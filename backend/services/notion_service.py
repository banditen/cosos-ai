"""Notion integration service for OAuth and content sync."""

import logging
import httpx
import hashlib
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from urllib.parse import urlencode
import base64

from config import settings
from database.client import get_supabase_client

logger = logging.getLogger(__name__)


class NotionService:
    """Service for Notion OAuth and content synchronization."""

    def __init__(self):
        self.client_id = settings.NOTION_CLIENT_ID
        self.client_secret = settings.NOTION_CLIENT_SECRET
        self.redirect_uri = settings.NOTION_REDIRECT_URI
        self.supabase = get_supabase_client()

    def get_oauth_url(self, user_id: str) -> str:
        """Generate Notion OAuth authorization URL."""
        params = {
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "response_type": "code",
            "owner": "user",
            "state": user_id,
        }
        return f"https://api.notion.com/v1/oauth/authorize?{urlencode(params)}"

    async def handle_oauth_callback(self, code: str, user_id: str) -> Dict[str, Any]:
        """Exchange authorization code for access token."""
        # Notion uses Basic auth for token exchange
        credentials = base64.b64encode(
            f"{self.client_id}:{self.client_secret}".encode()
        ).decode()

        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.notion.com/v1/oauth/token",
                headers={
                    "Authorization": f"Basic {credentials}",
                    "Content-Type": "application/json",
                },
                json={
                    "grant_type": "authorization_code",
                    "code": code,
                    "redirect_uri": self.redirect_uri,
                },
            )
            data = response.json()

        if "error" in data:
            error = data.get("error", "Unknown error")
            logger.error(f"Notion OAuth error: {error}")
            raise Exception(f"Notion OAuth failed: {error}")

        access_token = data.get("access_token")
        workspace_info = data.get("workspace_name", "Notion Workspace")
        workspace_id = data.get("workspace_id")

        # Store integration
        integration_data = {
            "user_id": user_id,
            "provider": "notion",
            "access_token": access_token,
            "refresh_token": None,
            "token_expires_at": None,
            "scope": "read",
            "account_email": workspace_id,
            "is_active": True,
        }

        result = self.supabase.table("integrations").upsert(
            integration_data, on_conflict="user_id,provider"
        ).execute()

        # Store as knowledge source
        self._store_notion_workspace(user_id, workspace_id, workspace_info)

        logger.info(f"Notion OAuth successful for user {user_id}")
        return result.data[0]

    def _store_notion_workspace(self, user_id: str, workspace_id: str, name: str):
        """Store Notion workspace as a knowledge source."""
        source_data = {
            "user_id": user_id,
            "name": f"Notion - {name}",
            "type": "notion",
            "external_id": workspace_id,
            "status": "active",
            "metadata": {"workspace_name": name, "workspace_id": workspace_id},
        }
        self.supabase.table("knowledge_sources").upsert(
            source_data, on_conflict="user_id,external_id"
        ).execute()

    async def search_pages(
        self, user_id: str, query: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Search for pages in Notion workspace."""
        integration = self._get_integration(user_id)
        if not integration:
            raise Exception("Notion not connected")

        async with httpx.AsyncClient() as client:
            body = {"page_size": 100}
            if query:
                body["query"] = query

            response = await client.post(
                "https://api.notion.com/v1/search",
                headers={
                    "Authorization": f"Bearer {integration['access_token']}",
                    "Notion-Version": "2022-06-28",
                },
                json=body,
            )
            data = response.json()

        if "error" in data:
            raise Exception(f"Failed to search Notion: {data.get('message')}")

        return data.get("results", [])

    async def get_page_content(self, user_id: str, page_id: str) -> Dict[str, Any]:
        """Get content of a Notion page."""
        integration = self._get_integration(user_id)
        if not integration:
            raise Exception("Notion not connected")

        async with httpx.AsyncClient() as client:
            # Get page metadata
            page_resp = await client.get(
                f"https://api.notion.com/v1/pages/{page_id}",
                headers={
                    "Authorization": f"Bearer {integration['access_token']}",
                    "Notion-Version": "2022-06-28",
                },
            )
            page_data = page_resp.json()

            # Get page blocks (content)
            blocks_resp = await client.get(
                f"https://api.notion.com/v1/blocks/{page_id}/children",
                headers={
                    "Authorization": f"Bearer {integration['access_token']}",
                    "Notion-Version": "2022-06-28",
                },
                params={"page_size": 100},
            )
            blocks_data = blocks_resp.json()

        return {"page": page_data, "blocks": blocks_data.get("results", [])}

    async def sync_page(self, user_id: str, page_id: str) -> Dict[str, Any]:
        """Sync a Notion page to context documents."""
        content_data = await self.get_page_content(user_id, page_id)
        page = content_data["page"]
        blocks = content_data["blocks"]

        # Extract title
        title = self._extract_title(page)

        # Convert blocks to text
        text_content = self._blocks_to_text(blocks)
        content_hash = hashlib.sha256(text_content.encode()).hexdigest()

        # Determine document type based on title/content
        doc_type = self._classify_document(title, text_content)

        # Get knowledge source
        source = (
            self.supabase.table("knowledge_sources")
            .select("id")
            .eq("user_id", user_id)
            .eq("type", "notion")
            .execute()
        )
        source_id = source.data[0]["id"] if source.data else None

        # Store document
        doc_data = {
            "user_id": user_id,
            "source_id": source_id,
            "title": title,
            "type": doc_type,
            "content": text_content,
            "content_hash": content_hash,
            "external_id": page_id,
            "external_url": page.get("url"),
            "source_updated_at": page.get("last_edited_time"),
        }

        result = self.supabase.table("context_documents").upsert(
            doc_data, on_conflict="user_id,external_id"
        ).execute()

        logger.info(f"Synced Notion page: {title}")
        return result.data[0] if result.data else doc_data

    def _extract_title(self, page: Dict) -> str:
        """Extract title from Notion page."""
        props = page.get("properties", {})
        for key, value in props.items():
            if value.get("type") == "title":
                title_arr = value.get("title", [])
                if title_arr:
                    return title_arr[0].get("plain_text", "Untitled")
        return "Untitled"

    def _blocks_to_text(self, blocks: List[Dict]) -> str:
        """Convert Notion blocks to plain text."""
        lines = []
        for block in blocks:
            block_type = block.get("type")
            if block_type in ["paragraph", "heading_1", "heading_2", "heading_3"]:
                rich_text = block.get(block_type, {}).get("rich_text", [])
                text = "".join(rt.get("plain_text", "") for rt in rich_text)
                if text:
                    lines.append(text)
            elif block_type == "bulleted_list_item":
                rich_text = block.get(block_type, {}).get("rich_text", [])
                text = "".join(rt.get("plain_text", "") for rt in rich_text)
                if text:
                    lines.append(f"• {text}")
            elif block_type == "numbered_list_item":
                rich_text = block.get(block_type, {}).get("rich_text", [])
                text = "".join(rt.get("plain_text", "") for rt in rich_text)
                if text:
                    lines.append(f"- {text}")
        return "\n".join(lines)

    def _classify_document(self, title: str, content: str) -> str:
        """Classify document type based on content."""
        title_lower = title.lower()
        content_lower = content.lower()

        if any(kw in title_lower for kw in ["okr", "objective", "key result"]):
            return "okr"
        if any(kw in title_lower for kw in ["strategy", "roadmap", "vision"]):
            return "strategy"
        if any(kw in title_lower for kw in ["decision", "adr"]):
            return "decision"
        if any(kw in title_lower for kw in ["meeting", "notes", "standup"]):
            return "meeting_notes"
        return "general"

    def _get_integration(self, user_id: str) -> Optional[Dict]:
        """Get Notion integration for user."""
        result = (
            self.supabase.table("integrations")
            .select("*")
            .eq("user_id", user_id)
            .eq("provider", "notion")
            .eq("is_active", True)
            .execute()
        )
        return result.data[0] if result.data else None

    def get_connection_status(self, user_id: str) -> Dict[str, Any]:
        """Get Notion connection status."""
        integration = self._get_integration(user_id)
        if not integration:
            return {"connected": False}

        source = (
            self.supabase.table("knowledge_sources")
            .select("*")
            .eq("user_id", user_id)
            .eq("type", "notion")
            .execute()
        )

        return {
            "connected": True,
            "last_sync_at": integration.get("last_sync_at"),
            "workspace": source.data[0] if source.data else None,
        }

    async def disconnect(self, user_id: str) -> bool:
        """Disconnect Notion integration."""
        self.supabase.table("integrations").update({"is_active": False}).eq(
            "user_id", user_id
        ).eq("provider", "notion").execute()

        self.supabase.table("knowledge_sources").update({"status": "disconnected"}).eq(
            "user_id", user_id
        ).eq("type", "notion").execute()

        logger.info(f"Disconnected Notion for user {user_id}")
        return True
