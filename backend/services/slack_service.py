"""Slack integration service for OAuth and message sync."""

import logging
import httpx
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any, List
from urllib.parse import urlencode

from config import settings
from database.client import get_supabase_client

logger = logging.getLogger(__name__)


class SlackService:
    """Service for Slack OAuth and message synchronization."""

    def __init__(self):
        self.client_id = settings.SLACK_CLIENT_ID
        self.client_secret = settings.SLACK_CLIENT_SECRET
        self.redirect_uri = settings.SLACK_REDIRECT_URI
        self.scopes = settings.SLACK_SCOPES
        self.supabase = get_supabase_client()

    def get_oauth_url(self, user_id: str) -> str:
        """Generate Slack OAuth authorization URL."""
        params = {
            "client_id": self.client_id,
            "scope": ",".join(self.scopes),
            "redirect_uri": self.redirect_uri,
            "state": user_id,
        }
        return f"https://slack.com/oauth/v2/authorize?{urlencode(params)}"

    async def handle_oauth_callback(self, code: str, user_id: str) -> Dict[str, Any]:
        """Exchange authorization code for access token and store integration."""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://slack.com/api/oauth.v2.access",
                data={
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "code": code,
                    "redirect_uri": self.redirect_uri,
                },
            )
            data = response.json()

        if not data.get("ok"):
            error = data.get("error", "Unknown error")
            logger.error(f"Slack OAuth error: {error}")
            raise Exception(f"Slack OAuth failed: {error}")

        access_token = data.get("access_token")
        team_info = data.get("team", {})
        authed_user = data.get("authed_user", {})

        # Store integration
        integration_data = {
            "user_id": user_id,
            "provider": "slack",
            "access_token": access_token,
            "refresh_token": None,
            "token_expires_at": None,  # Slack tokens don't expire
            "scope": ",".join(self.scopes),
            "account_email": authed_user.get("id"),  # Slack user ID
            "is_active": True,
        }

        result = self.supabase.table("integrations").upsert(
            integration_data, on_conflict="user_id,provider"
        ).execute()

        # Store team metadata in knowledge_sources
        self._store_slack_workspace(user_id, team_info, access_token)

        logger.info(f"Slack OAuth successful for user {user_id}, team {team_info.get('name')}")
        return result.data[0]

    def _store_slack_workspace(self, user_id: str, team_info: Dict, access_token: str):
        """Store Slack workspace as a knowledge source."""
        source_data = {
            "user_id": user_id,
            "name": f"Slack - {team_info.get('name', 'Workspace')}",
            "type": "slack",
            "external_id": team_info.get("id"),
            "status": "active",
            "metadata": {"team_name": team_info.get("name"), "team_id": team_info.get("id")},
        }
        self.supabase.table("knowledge_sources").upsert(
            source_data, on_conflict="user_id,external_id"
        ).execute()

    async def get_channels(self, user_id: str) -> List[Dict[str, Any]]:
        """Get list of channels the bot has access to."""
        integration = self._get_integration(user_id)
        if not integration:
            raise Exception("Slack not connected")

        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://slack.com/api/conversations.list",
                headers={"Authorization": f"Bearer {integration['access_token']}"},
                params={"types": "public_channel,private_channel", "limit": 200},
            )
            data = response.json()

        if not data.get("ok"):
            raise Exception(f"Failed to get channels: {data.get('error')}")

        return data.get("channels", [])

    async def sync_messages(
        self, user_id: str, channel_id: str, oldest: Optional[datetime] = None
    ) -> int:
        """Sync messages from a Slack channel."""
        integration = self._get_integration(user_id)
        if not integration:
            raise Exception("Slack not connected")

        # Default to last 7 days
        if oldest is None:
            oldest = datetime.now(timezone.utc) - timedelta(days=7)

        messages = await self._fetch_channel_messages(
            integration["access_token"], channel_id, oldest
        )

        # Get channel info
        channel_name = await self._get_channel_name(integration["access_token"], channel_id)

        # Store messages
        count = 0
        for msg in messages:
            if msg.get("type") == "message" and msg.get("text"):
                self._store_message(user_id, channel_id, channel_name, msg)
                count += 1

        # Update sync timestamp
        self.supabase.table("integrations").update(
            {"last_sync_at": datetime.now(timezone.utc).isoformat()}
        ).eq("user_id", user_id).eq("provider", "slack").execute()

        logger.info(f"Synced {count} messages from channel {channel_name}")
        return count

    async def _fetch_channel_messages(
        self, access_token: str, channel_id: str, oldest: datetime
    ) -> List[Dict]:
        """Fetch messages from a channel."""
        messages = []
        cursor = None

        async with httpx.AsyncClient() as client:
            while True:
                params = {
                    "channel": channel_id,
                    "oldest": str(oldest.timestamp()),
                    "limit": 200,
                }
                if cursor:
                    params["cursor"] = cursor

                response = await client.get(
                    "https://slack.com/api/conversations.history",
                    headers={"Authorization": f"Bearer {access_token}"},
                    params=params,
                )
                data = response.json()

                if not data.get("ok"):
                    logger.error(f"Failed to fetch messages: {data.get('error')}")
                    break

                messages.extend(data.get("messages", []))
                cursor = data.get("response_metadata", {}).get("next_cursor")
                if not cursor:
                    break

        return messages

    async def _get_channel_name(self, access_token: str, channel_id: str) -> str:
        """Get channel name from ID."""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://slack.com/api/conversations.info",
                headers={"Authorization": f"Bearer {access_token}"},
                params={"channel": channel_id},
            )
            data = response.json()

        if data.get("ok"):
            return data.get("channel", {}).get("name", channel_id)
        return channel_id

    def _store_message(
        self, user_id: str, channel_id: str, channel_name: str, msg: Dict
    ):
        """Store a single Slack message."""
        message_at = datetime.fromtimestamp(float(msg.get("ts", 0)), tz=timezone.utc)

        message_data = {
            "user_id": user_id,
            "slack_ts": msg.get("ts"),
            "channel_id": channel_id,
            "channel_name": channel_name,
            "thread_ts": msg.get("thread_ts"),
            "text": msg.get("text", ""),
            "user_slack_id": msg.get("user"),
            "user_name": msg.get("username"),
            "message_type": msg.get("subtype", "message"),
            "has_attachments": bool(msg.get("attachments") or msg.get("files")),
            "reactions": msg.get("reactions"),
            "message_at": message_at.isoformat(),
        }

        self.supabase.table("slack_messages").upsert(
            message_data, on_conflict="user_id,slack_ts,channel_id"
        ).execute()

    def _get_integration(self, user_id: str) -> Optional[Dict]:
        """Get Slack integration for user."""
        result = (
            self.supabase.table("integrations")
            .select("*")
            .eq("user_id", user_id)
            .eq("provider", "slack")
            .eq("is_active", True)
            .execute()
        )
        return result.data[0] if result.data else None

    def get_connection_status(self, user_id: str) -> Dict[str, Any]:
        """Get Slack connection status for user."""
        integration = self._get_integration(user_id)
        if not integration:
            return {"connected": False}

        # Get workspace info
        source = (
            self.supabase.table("knowledge_sources")
            .select("*")
            .eq("user_id", user_id)
            .eq("type", "slack")
            .execute()
        )

        return {
            "connected": True,
            "last_sync_at": integration.get("last_sync_at"),
            "workspace": source.data[0] if source.data else None,
        }

    async def disconnect(self, user_id: str) -> bool:
        """Disconnect Slack integration."""
        self.supabase.table("integrations").update({"is_active": False}).eq(
            "user_id", user_id
        ).eq("provider", "slack").execute()

        self.supabase.table("knowledge_sources").update({"status": "disconnected"}).eq(
            "user_id", user_id
        ).eq("type", "slack").execute()

        logger.info(f"Disconnected Slack for user {user_id}")
        return True
