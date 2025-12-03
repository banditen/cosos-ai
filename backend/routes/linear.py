"""Linear integration routes for OAuth and syncing."""

import logging
from fastapi import APIRouter, HTTPException, Query, Depends
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from typing import List, Dict, Any

from services.linear_service import LinearService
from database.client import get_supabase_client

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/linear", tags=["linear"])


class OAuthURLResponse(BaseModel):
    """Response with OAuth URL."""
    url: str


class SyncResponse(BaseModel):
    """Response from sync operation."""
    success: bool
    issues_synced: int
    projects_synced: int
    message: str


@router.get("/oauth/url")
async def get_linear_oauth_url(user_id: str = Query(..., description="User ID")) -> OAuthURLResponse:
    """
    Get Linear OAuth URL for authorization.
    
    Args:
        user_id: User ID to associate with OAuth flow
        
    Returns:
        OAuth authorization URL
    """
    try:
        linear_service = LinearService()
        auth_url = linear_service.get_oauth_url(user_id)
        
        return OAuthURLResponse(url=auth_url)
        
    except Exception as e:
        logger.error(f"Error generating Linear OAuth URL: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/oauth/callback")
async def linear_oauth_callback(
    code: str = Query(..., description="Authorization code"),
    state: str = Query(..., description="User ID from state parameter")
):
    """
    Handle Linear OAuth callback.
    
    Args:
        code: Authorization code from Linear
        state: User ID passed as state parameter
        
    Returns:
        Redirect to frontend with success/error
    """
    try:
        user_id = state
        
        linear_service = LinearService()
        integration = await linear_service.handle_oauth_callback(code, user_id)
        
        logger.info(f"Linear OAuth successful for user {user_id}")

        # Redirect to frontend
        frontend_url = "http://localhost:3000"
        return RedirectResponse(
            url=f"{frontend_url}/setup?oauth_success=true&provider=linear&integration_id={integration['id']}"
        )

    except Exception as e:
        logger.error(f"Linear OAuth callback error: {e}")
        frontend_url = "http://localhost:3000"
        return RedirectResponse(
            url=f"{frontend_url}/setup?oauth_error={str(e)}&provider=linear"
        )


@router.post("/sync")
async def sync_linear(
    user_id: str = Query(..., description="User ID")
) -> SyncResponse:
    """
    Manually trigger Linear sync for a user.
    
    Args:
        user_id: User ID
        
    Returns:
        Sync results
    """
    try:
        linear_service = LinearService()
        
        # Sync issues
        issues = await linear_service.sync_issues(user_id, days_back=30)
        
        # Sync projects
        projects = await linear_service.sync_projects(user_id)
        
        return SyncResponse(
            success=True,
            issues_synced=len(issues),
            projects_synced=len(projects),
            message=f"Synced {len(issues)} issues and {len(projects)} projects"
        )
        
    except ValueError as e:
        import traceback
        logger.error(f"Linear sync error: {e}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        import traceback
        logger.error(f"Linear sync error: {e}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/issues")
async def get_linear_issues(
    user_id: str = Query(..., description="User ID"),
    limit: int = Query(50, description="Maximum number of issues to return")
) -> List[Dict[str, Any]]:
    """
    Get Linear issues for a user.
    
    Args:
        user_id: User ID
        limit: Maximum number of issues to return
        
    Returns:
        List of Linear issues
    """
    try:
        supabase = get_supabase_client()
        
        result = supabase.table("linear_issues").select("*").eq(
            "user_id", user_id
        ).eq("is_archived", False).order(
            "updated_at_linear", desc=True
        ).limit(limit).execute()
        
        return result.data
        
    except Exception as e:
        logger.error(f"Error fetching Linear issues: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/projects")
async def get_linear_projects(
    user_id: str = Query(..., description="User ID"),
    limit: int = Query(50, description="Maximum number of projects to return")
) -> List[Dict[str, Any]]:
    """
    Get Linear projects for a user.
    
    Args:
        user_id: User ID
        limit: Maximum number of projects to return
        
    Returns:
        List of Linear projects
    """
    try:
        supabase = get_supabase_client()
        
        result = supabase.table("linear_projects").select("*").eq(
            "user_id", user_id
        ).eq("is_archived", False).order(
            "target_date", desc=False
        ).limit(limit).execute()
        
        return result.data
        
    except Exception as e:
        logger.error(f"Error fetching Linear projects: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status")
async def get_linear_status(
    user_id: str = Query(..., description="User ID")
) -> Dict[str, Any]:
    """
    Get Linear integration status for a user.
    
    Args:
        user_id: User ID
        
    Returns:
        Integration status
    """
    try:
        supabase = get_supabase_client()
        
        # Get integration
        integration_result = supabase.table("integrations").select("*").eq(
            "user_id", user_id
        ).eq("provider", "linear").eq("is_active", True).execute()
        
        if not integration_result.data:
            return {
                "connected": False,
                "message": "Linear not connected"
            }
        
        integration = integration_result.data[0]
        
        # Get issue count
        issues_result = supabase.table("linear_issues").select("id", count="exact").eq(
            "user_id", user_id
        ).eq("is_archived", False).execute()
        
        # Get project count
        projects_result = supabase.table("linear_projects").select("id", count="exact").eq(
            "user_id", user_id
        ).eq("is_archived", False).execute()
        
        return {
            "connected": True,
            "account_email": integration.get("account_email"),
            "last_sync_at": integration.get("last_sync_at"),
            "issues_count": issues_result.count or 0,
            "projects_count": projects_result.count or 0,
        }
        
    except Exception as e:
        logger.error(f"Error fetching Linear status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

