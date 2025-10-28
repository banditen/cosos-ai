"""Routes for daily brief generation and retrieval."""

import logging
from datetime import date
from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List, Dict, Any

from database.client import get_supabase_client
from services.agent_service import AgentService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/briefs", tags=["briefs"])


@router.post("/generate")
async def generate_brief(
    user_id: str = Query(..., description="User ID"),
    brief_date: Optional[str] = Query(None, description="Date for brief (YYYY-MM-DD), defaults to today")
) -> Dict[str, Any]:
    """
    Generate a daily brief for the user.
    
    This endpoint:
    1. Retrieves user context
    2. Fetches recent emails and calendar events
    3. Analyzes them with GPT-4o-mini
    4. Generates a structured brief with priorities, time blocks, quick wins, and flags
    5. Saves to database
    
    Args:
        user_id: User ID
        brief_date: Date for the brief (defaults to today)
        
    Returns:
        Generated brief data
    """
    try:
        # Parse date if provided
        target_date = date.fromisoformat(brief_date) if brief_date else None
        
        # Generate the brief
        agent = AgentService()
        brief = await agent.generate_daily_brief(user_id, target_date)
        
        logger.info(f"Brief generated for user {user_id}")
        
        return brief
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error generating brief: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/")
async def get_briefs(
    user_id: str = Query(..., description="User ID"),
    limit: int = Query(10, description="Number of briefs to return", ge=1, le=100)
) -> List[Dict[str, Any]]:
    """
    Get recent briefs for a user.
    
    Args:
        user_id: User ID
        limit: Number of briefs to return
        
    Returns:
        List of briefs
    """
    try:
        supabase = get_supabase_client()
        
        result = supabase.table("daily_briefs").select("*").eq(
            "user_id", user_id
        ).order("brief_date", desc=True).limit(limit).execute()
        
        return result.data or []
        
    except Exception as e:
        logger.error(f"Error fetching briefs: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{brief_id}")
async def get_brief(
    brief_id: str,
    user_id: str = Query(..., description="User ID")
) -> Dict[str, Any]:
    """
    Get a specific brief by ID.
    
    Args:
        brief_id: Brief ID
        user_id: User ID (for security)
        
    Returns:
        Brief data
    """
    try:
        supabase = get_supabase_client()
        
        result = supabase.table("daily_briefs").select("*").eq(
            "id", brief_id
        ).eq("user_id", user_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Brief not found")
        
        return result.data[0]
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching brief: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/date/{brief_date}")
async def get_brief_by_date(
    brief_date: str,
    user_id: str = Query(..., description="User ID")
) -> Dict[str, Any]:
    """
    Get a brief for a specific date.
    
    Args:
        brief_date: Date in YYYY-MM-DD format
        user_id: User ID
        
    Returns:
        Brief data
    """
    try:
        # Validate date format
        date.fromisoformat(brief_date)
        
        supabase = get_supabase_client()
        
        result = supabase.table("daily_briefs").select("*").eq(
            "user_id", user_id
        ).eq("brief_date", brief_date).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail=f"No brief found for {brief_date}")
        
        return result.data[0]
        
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching brief by date: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{brief_id}")
async def delete_brief(
    brief_id: str,
    user_id: str = Query(..., description="User ID")
) -> Dict[str, str]:
    """
    Delete a brief.
    
    Args:
        brief_id: Brief ID
        user_id: User ID (for security)
        
    Returns:
        Success message
    """
    try:
        supabase = get_supabase_client()
        
        result = supabase.table("daily_briefs").delete().eq(
            "id", brief_id
        ).eq("user_id", user_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Brief not found")
        
        logger.info(f"Brief {brief_id} deleted")
        
        return {"message": "Brief deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting brief: {e}")
        raise HTTPException(status_code=500, detail=str(e))

