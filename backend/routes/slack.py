"""Slack integration routes for OAuth and sync."""

import logging
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

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

        # Redirect to frontend integrations page
        frontend_url = "http://localhost:3000"
        return RedirectResponse(url=f"{frontend_url}/integrations?oauth_success=slack")
    except Exception as e:
        logger.error(f"Slack OAuth callback error: {e}")
        frontend_url = "http://localhost:3000"
        return RedirectResponse(url=f"{frontend_url}/integrations?oauth_error={str(e)}")


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

