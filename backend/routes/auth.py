"""Authentication routes for OAuth flows."""

import logging
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import RedirectResponse
from pydantic import BaseModel

from services.gmail_service import GmailService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["authentication"])


class OAuthURLResponse(BaseModel):
    """Response with OAuth URL."""
    url: str


@router.get("/google/url")
async def get_google_oauth_url(user_id: str = Query(..., description="User ID")) -> OAuthURLResponse:
    """
    Get Google OAuth URL for Gmail and Calendar authorization.
    
    Args:
        user_id: User ID to associate with OAuth flow
        
    Returns:
        OAuth authorization URL
    """
    try:
        gmail_service = GmailService()
        auth_url = gmail_service.get_oauth_url(user_id)
        
        return OAuthURLResponse(url=auth_url)
        
    except Exception as e:
        logger.error(f"Error generating OAuth URL: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/google/callback")
async def google_oauth_callback(
    code: str = Query(..., description="Authorization code"),
    state: str = Query(..., description="User ID from state parameter")
):
    """
    Handle Google OAuth callback.
    
    Args:
        code: Authorization code from Google
        state: User ID passed as state parameter
        
    Returns:
        Redirect to frontend with success/error
    """
    try:
        user_id = state
        
        gmail_service = GmailService()
        integration = await gmail_service.handle_oauth_callback(code, user_id)
        
        logger.info(f"OAuth successful for user {user_id}")

        # Redirect to frontend success page
        # Use port 3001 for local development (3000 is often taken)
        frontend_url = "http://localhost:3001"
        return RedirectResponse(
            url=f"{frontend_url}/dashboard?oauth_success=true&integration_id={integration['id']}"
        )

    except Exception as e:
        logger.error(f"OAuth callback error: {e}")
        # Redirect to frontend error page
        frontend_url = "http://localhost:3001"
        return RedirectResponse(
            url=f"{frontend_url}/dashboard?oauth_error={str(e)}"
        )


@router.delete("/google/disconnect")
async def disconnect_google(user_id: str = Query(..., description="User ID")):
    """
    Disconnect Google integration for a user.
    
    Args:
        user_id: User ID
        
    Returns:
        Success message
    """
    try:
        from database.client import get_supabase_client
        
        supabase = get_supabase_client()
        
        # Deactivate integration
        result = supabase.table("integrations").update({
            "is_active": False
        }).eq("user_id", user_id).eq("provider", "gmail").execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Integration not found")
        
        logger.info(f"Disconnected Google integration for user {user_id}")
        
        return {"message": "Google integration disconnected successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error disconnecting Google: {e}")
        raise HTTPException(status_code=500, detail=str(e))

