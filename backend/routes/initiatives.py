"""Routes for initiative management."""

import logging
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional

from database.client import get_supabase_client
from models.project import (
    Initiative, InitiativeCreate, InitiativeUpdate,
    Project, InitiativeWithProjects
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/initiatives", tags=["initiatives"])


@router.post("/", response_model=Initiative)
async def create_initiative(
    initiative: InitiativeCreate,
    user_id: str = Query(..., description="User ID")
) -> Initiative:
    """
    Create a new initiative.
    
    Args:
        initiative: Initiative data
        user_id: User ID
        
    Returns:
        Created initiative
    """
    try:
        supabase = get_supabase_client()
        
        # Prepare initiative data
        initiative_dict = initiative.model_dump(exclude_none=True)

        # Convert date objects to strings
        if "target_date" in initiative_dict and initiative_dict["target_date"]:
            initiative_dict["target_date"] = initiative_dict["target_date"].isoformat()

        initiative_data = {
            "user_id": user_id,
            **initiative_dict,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        # Insert initiative
        result = supabase.table("initiatives").insert(initiative_data).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to create initiative")
        
        logger.info(f"Initiative created: {result.data[0]['id']}")
        
        return Initiative(**result.data[0])
        
    except Exception as e:
        logger.error(f"Error creating initiative: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/", response_model=List[Initiative])
async def list_initiatives(
    user_id: str = Query(..., description="User ID"),
    status: Optional[str] = Query(None, description="Filter by status"),
    limit: int = Query(50, description="Number of initiatives to return", ge=1, le=100)
) -> List[Initiative]:
    """
    List initiatives for a user.
    
    Args:
        user_id: User ID
        status: Optional status filter
        limit: Number of initiatives to return
        
    Returns:
        List of initiatives
    """
    try:
        supabase = get_supabase_client()
        
        query = supabase.table("initiatives").select("*").eq("user_id", user_id)
        
        if status:
            query = query.eq("status", status)
        
        result = query.order("created_at", desc=True).limit(limit).execute()
        
        return [Initiative(**i) for i in result.data] if result.data else []
        
    except Exception as e:
        logger.error(f"Error listing initiatives: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{initiative_id}", response_model=InitiativeWithProjects)
async def get_initiative(
    initiative_id: str,
    user_id: str = Query(..., description="User ID")
) -> InitiativeWithProjects:
    """
    Get a specific initiative with its linked projects.
    
    Args:
        initiative_id: Initiative ID
        user_id: User ID (for security)
        
    Returns:
        Initiative with projects
    """
    try:
        supabase = get_supabase_client()
        
        # Get initiative
        initiative_result = supabase.table("initiatives").select("*").eq(
            "id", initiative_id
        ).eq("user_id", user_id).execute()
        
        if not initiative_result.data:
            raise HTTPException(status_code=404, detail="Initiative not found")
        
        initiative = Initiative(**initiative_result.data[0])
        
        # Get linked projects
        links_result = supabase.table("project_initiatives").select(
            "project_id"
        ).eq("initiative_id", initiative_id).execute()
        
        projects = []
        if links_result.data:
            project_ids = [link["project_id"] for link in links_result.data]
            projects_result = supabase.table("projects").select("*").in_(
                "id", project_ids
            ).execute()
            
            if projects_result.data:
                projects = [Project(**p) for p in projects_result.data]
        
        return InitiativeWithProjects(
            **initiative.model_dump(),
            projects=projects
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting initiative: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/{initiative_id}", response_model=Initiative)
async def update_initiative(
    initiative_id: str,
    initiative_update: InitiativeUpdate,
    user_id: str = Query(..., description="User ID")
) -> Initiative:
    """
    Update an initiative.
    
    Args:
        initiative_id: Initiative ID
        initiative_update: Fields to update
        user_id: User ID (for security)
        
    Returns:
        Updated initiative
    """
    try:
        supabase = get_supabase_client()
        
        # Prepare update data
        update_data = initiative_update.model_dump(exclude_none=True)

        # Convert date objects to strings
        if "target_date" in update_data and update_data["target_date"]:
            update_data["target_date"] = update_data["target_date"].isoformat()

        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        
        # Update initiative
        result = supabase.table("initiatives").update(update_data).eq(
            "id", initiative_id
        ).eq("user_id", user_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Initiative not found")
        
        logger.info(f"Initiative updated: {initiative_id}")
        
        return Initiative(**result.data[0])
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating initiative: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{initiative_id}")
async def delete_initiative(
    initiative_id: str,
    user_id: str = Query(..., description="User ID")
) -> dict:
    """
    Delete an initiative.
    
    Args:
        initiative_id: Initiative ID
        user_id: User ID (for security)
        
    Returns:
        Success message
    """
    try:
        supabase = get_supabase_client()
        
        result = supabase.table("initiatives").delete().eq(
            "id", initiative_id
        ).eq("user_id", user_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Initiative not found")
        
        logger.info(f"Initiative deleted: {initiative_id}")
        
        return {"message": "Initiative deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting initiative: {e}")
        raise HTTPException(status_code=500, detail=str(e))

