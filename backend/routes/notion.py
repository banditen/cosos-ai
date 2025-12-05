"""Notion integration routes for OAuth and sync."""

import logging
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from config import settings
from services.notion_service import NotionService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/notion", tags=["notion"])


class OAuthURLResponse(BaseModel):
    url: str


class PageResponse(BaseModel):
    id: str
    title: str
    type: str
    url: Optional[str] = None
    last_edited: Optional[datetime] = None


class SyncResponse(BaseModel):
    success: bool
    page_id: str
    title: str


class ConnectionStatus(BaseModel):
    connected: bool
    last_sync_at: Optional[datetime] = None
    workspace_name: Optional[str] = None


@router.get("/oauth/url", response_model=OAuthURLResponse)
async def get_notion_oauth_url(user_id: str = Query(..., description="User ID")):
    """Get Notion OAuth authorization URL."""
    try:
        service = NotionService()
        url = service.get_oauth_url(user_id)
        return OAuthURLResponse(url=url)
    except Exception as e:
        logger.error(f"Error generating Notion OAuth URL: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/oauth/callback")
async def notion_oauth_callback(
    code: str = Query(..., description="Authorization code"),
    state: str = Query(..., description="User ID from state"),
):
    """Handle Notion OAuth callback."""
    try:
        service = NotionService()
        await service.handle_oauth_callback(code, state)

        return RedirectResponse(url=f"{settings.FRONTEND_URL}/setup?oauth_success=true&provider=notion")
    except Exception as e:
        logger.error(f"Notion OAuth callback error: {e}")
        return RedirectResponse(url=f"{settings.FRONTEND_URL}/setup?oauth_error={str(e)}&provider=notion")


@router.get("/status", response_model=ConnectionStatus)
async def get_notion_status(user_id: str = Query(..., description="User ID")):
    """Get Notion connection status."""
    try:
        service = NotionService()
        status = service.get_connection_status(user_id)
        workspace = status.get("workspace", {})
        return ConnectionStatus(
            connected=status.get("connected", False),
            last_sync_at=status.get("last_sync_at"),
            workspace_name=workspace.get("name") if workspace else None,
        )
    except Exception as e:
        logger.error(f"Error getting Notion status: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/pages", response_model=List[PageResponse])
async def search_notion_pages(
    user_id: str = Query(..., description="User ID"),
    query: Optional[str] = Query(None, description="Search query"),
):
    """Search for pages in Notion workspace."""
    try:
        service = NotionService()
        results = await service.search_pages(user_id, query)

        pages = []
        for item in results:
            if item.get("object") == "page":
                props = item.get("properties", {})
                title = "Untitled"
                for key, value in props.items():
                    if value.get("type") == "title":
                        title_arr = value.get("title", [])
                        if title_arr:
                            title = title_arr[0].get("plain_text", "Untitled")
                            break

                pages.append(
                    PageResponse(
                        id=item["id"],
                        title=title,
                        type=item.get("parent", {}).get("type", "page"),
                        url=item.get("url"),
                        last_edited=item.get("last_edited_time"),
                    )
                )
        return pages
    except Exception as e:
        logger.error(f"Error searching Notion pages: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/sync", response_model=SyncResponse)
async def sync_notion_page(
    user_id: str = Query(..., description="User ID"),
    page_id: str = Query(..., description="Page ID to sync"),
):
    """Sync a Notion page to context documents."""
    try:
        service = NotionService()
        result = await service.sync_page(user_id, page_id)
        return SyncResponse(
            success=True, page_id=page_id, title=result.get("title", "Untitled")
        )
    except Exception as e:
        logger.error(f"Error syncing Notion page: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/disconnect")
async def disconnect_notion(user_id: str = Query(..., description="User ID")):
    """Disconnect Notion integration."""
    try:
        service = NotionService()
        await service.disconnect(user_id)
        return {"message": "Notion disconnected successfully"}
    except Exception as e:
        logger.error(f"Error disconnecting Notion: {e}")
        raise HTTPException(status_code=500, detail=str(e))

