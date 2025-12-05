"""Slack integration routes for OAuth, sync, and events."""

import logging
import hashlib
import hmac
import time
from fastapi import APIRouter, HTTPException, Query, Request, Response
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

from config import settings
from services.slack_service import SlackService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/slack", tags=["slack"])


class OAuthURLResponse(BaseModel):
    url: str


class ChannelResponse(BaseModel):
    id: str
    name: str
    is_private: bool
    num_members: Optional[int] = None


class SyncResponse(BaseModel):
    success: bool
    messages_synced: int
    channel_id: str


class ConnectionStatus(BaseModel):
    connected: bool
    last_sync_at: Optional[datetime] = None
    workspace_name: Optional[str] = None


@router.get("/oauth/url", response_model=OAuthURLResponse)
async def get_slack_oauth_url(user_id: str = Query(..., description="User ID")):
    """Get Slack OAuth authorization URL."""
    try:
        service = SlackService()
        url = service.get_oauth_url(user_id)
        return OAuthURLResponse(url=url)
    except Exception as e:
        logger.error(f"Error generating Slack OAuth URL: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/oauth/callback")
async def slack_oauth_callback(
    code: str = Query(..., description="Authorization code"),
    state: str = Query(..., description="User ID from state"),
):
    """Handle Slack OAuth callback."""
    try:
        service = SlackService()
        await service.handle_oauth_callback(code, state)

        # Redirect to frontend setup page
        frontend_url = "http://localhost:3000"
        return RedirectResponse(url=f"{frontend_url}/setup?oauth_success=true&provider=slack")
    except Exception as e:
        logger.error(f"Slack OAuth callback error: {e}")
        frontend_url = "http://localhost:3000"
        return RedirectResponse(url=f"{frontend_url}/setup?oauth_error={str(e)}&provider=slack")


@router.get("/status", response_model=ConnectionStatus)
async def get_slack_status(user_id: str = Query(..., description="User ID")):
    """Get Slack connection status."""
    try:
        service = SlackService()
        status = service.get_connection_status(user_id)
        workspace = status.get("workspace", {})
        return ConnectionStatus(
            connected=status.get("connected", False),
            last_sync_at=status.get("last_sync_at"),
            workspace_name=workspace.get("name") if workspace else None,
        )
    except Exception as e:
        logger.error(f"Error getting Slack status: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/channels", response_model=List[ChannelResponse])
async def get_slack_channels(user_id: str = Query(..., description="User ID")):
    """Get list of Slack channels."""
    try:
        service = SlackService()
        channels = await service.get_channels(user_id)
        return [
            ChannelResponse(
                id=ch["id"],
                name=ch["name"],
                is_private=ch.get("is_private", False),
                num_members=ch.get("num_members"),
            )
            for ch in channels
        ]
    except Exception as e:
        logger.error(f"Error getting Slack channels: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/sync", response_model=SyncResponse)
async def sync_slack_channel(
    user_id: str = Query(..., description="User ID"),
    channel_id: str = Query(..., description="Channel ID to sync"),
):
    """Sync messages from a Slack channel."""
    try:
        service = SlackService()
        count = await service.sync_messages(user_id, channel_id)
        return SyncResponse(success=True, messages_synced=count, channel_id=channel_id)
    except Exception as e:
        logger.error(f"Error syncing Slack channel: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/disconnect")
async def disconnect_slack(user_id: str = Query(..., description="User ID")):
    """Disconnect Slack integration."""
    try:
        service = SlackService()
        await service.disconnect(user_id)
        return {"message": "Slack disconnected successfully"}
    except Exception as e:
        logger.error(f"Error disconnecting Slack: {e}")
        raise HTTPException(status_code=500, detail=str(e))


def verify_slack_signature(request_body: bytes, timestamp: str, signature: str) -> bool:
    """Verify that the request came from Slack."""
    if not settings.SLACK_SIGNING_SECRET:
        logger.warning("SLACK_SIGNING_SECRET not configured, skipping verification")
        return True

    # Check timestamp to prevent replay attacks
    if abs(time.time() - int(timestamp)) > 60 * 5:
        return False

    sig_basestring = f"v0:{timestamp}:{request_body.decode('utf-8')}"
    my_signature = 'v0=' + hmac.new(
        settings.SLACK_SIGNING_SECRET.encode(),
        sig_basestring.encode(),
        hashlib.sha256
    ).hexdigest()

    return hmac.compare_digest(my_signature, signature)


@router.post("/events")
async def slack_events(request: Request):
    """Handle Slack Events API webhook."""
    body = await request.body()
    data = await request.json()

    # Verify signature if signing secret is configured
    timestamp = request.headers.get("X-Slack-Request-Timestamp", "")
    signature = request.headers.get("X-Slack-Signature", "")

    if settings.SLACK_SIGNING_SECRET and not verify_slack_signature(body, timestamp, signature):
        logger.warning("Invalid Slack signature")
        raise HTTPException(status_code=403, detail="Invalid signature")

    # Handle URL verification challenge (required for setting up Events API)
    if data.get("type") == "url_verification":
        return {"challenge": data.get("challenge")}

    # Handle events
    event = data.get("event", {})
    event_type = event.get("type")

    logger.info(f"Received Slack event: {event_type}")

    if event_type == "app_mention":
        # Bot was mentioned in a channel
        await handle_app_mention(event, data.get("team_id"))
    elif event_type == "message" and event.get("channel_type") == "im":
        # Direct message to the bot
        if not event.get("bot_id"):  # Ignore bot's own messages
            await handle_direct_message(event, data.get("team_id"))

    return Response(status_code=200)


async def handle_app_mention(event: Dict[str, Any], team_id: str):
    """Handle when Cosos bot is mentioned in a channel."""
    from database.client import get_supabase_client

    supabase = get_supabase_client()
    channel_id = event.get("channel")
    thread_ts = event.get("thread_ts") or event.get("ts")
    text = event.get("text", "")
    user_slack_id = event.get("user")

    # Find user by team_id from knowledge_sources
    source_result = supabase.table("knowledge_sources").select("user_id, metadata").eq(
        "type", "slack"
    ).execute()

    user_id = None
    for source in source_result.data:
        metadata = source.get("metadata", {})
        if metadata.get("team_id") == team_id:
            user_id = source.get("user_id")
            break

    if not user_id:
        logger.warning(f"Could not find user for Slack team {team_id}")
        return

    # TODO: Process the message with Cosos AI and respond
    # For now, send a simple acknowledgment
    try:
        service = SlackService()
        await service.send_message(
            user_id=user_id,
            channel_id=channel_id,
            text="👋 Hey! I received your message. Full AI responses coming soon!",
            thread_ts=thread_ts
        )
    except Exception as e:
        logger.error(f"Failed to respond to mention: {e}")


async def handle_direct_message(event: Dict[str, Any], team_id: str):
    """Handle direct message to Cosos bot."""
    from database.client import get_supabase_client

    supabase = get_supabase_client()
    channel_id = event.get("channel")
    text = event.get("text", "")

    # Find user by team_id
    source_result = supabase.table("knowledge_sources").select("user_id, metadata").eq(
        "type", "slack"
    ).execute()

    user_id = None
    for source in source_result.data:
        metadata = source.get("metadata", {})
        if metadata.get("team_id") == team_id:
            user_id = source.get("user_id")
            break

    if not user_id:
        logger.warning(f"Could not find user for Slack team {team_id}")
        return

    # TODO: Process the message with Cosos AI and respond
    try:
        service = SlackService()
        await service.send_message(
            user_id=user_id,
            channel_id=channel_id,
            text="👋 I got your message! Full conversational AI coming soon."
        )
    except Exception as e:
        logger.error(f"Failed to respond to DM: {e}")
