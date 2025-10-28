"""Routes for project and initiative management."""

import logging
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from uuid import UUID

from database.client import get_supabase_client
from models.project import (
    Project, ProjectCreate, ProjectUpdate,
    Initiative, InitiativeCreate, InitiativeUpdate,
    ProjectWithInitiatives, InitiativeWithProjects
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/projects", tags=["projects"])


# ============================================
# PROJECT ENDPOINTS
# ============================================

@router.post("/", response_model=Project)
async def create_project(
    project: ProjectCreate,
    user_id: str = Query(..., description="User ID")
) -> Project:
    """
    Create a new project.
    
    Args:
        project: Project data
        user_id: User ID
        
    Returns:
        Created project
    """
    try:
        supabase = get_supabase_client()
        
        # Prepare project data
        project_dict = project.model_dump(exclude_none=True)

        # Convert date objects to strings
        if "start_date" in project_dict and project_dict["start_date"]:
            project_dict["start_date"] = project_dict["start_date"].isoformat()
        if "deadline" in project_dict and project_dict["deadline"]:
            project_dict["deadline"] = project_dict["deadline"].isoformat()

        project_data = {
            "user_id": user_id,
            **project_dict,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        # Insert project
        result = supabase.table("projects").insert(project_data).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to create project")
        
        logger.info(f"Project created: {result.data[0]['id']}")
        
        return Project(**result.data[0])
        
    except Exception as e:
        logger.error(f"Error creating project: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/", response_model=List[Project])
async def list_projects(
    user_id: str = Query(..., description="User ID"),
    status: Optional[str] = Query(None, description="Filter by status"),
    limit: int = Query(50, description="Number of projects to return", ge=1, le=100)
) -> List[Project]:
    """
    List projects for a user.
    
    Args:
        user_id: User ID
        status: Optional status filter
        limit: Number of projects to return
        
    Returns:
        List of projects
    """
    try:
        supabase = get_supabase_client()
        
        query = supabase.table("projects").select("*").eq("user_id", user_id)
        
        if status:
            query = query.eq("status", status)
        
        result = query.order("created_at", desc=True).limit(limit).execute()
        
        return [Project(**p) for p in result.data] if result.data else []
        
    except Exception as e:
        logger.error(f"Error listing projects: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{project_id}", response_model=ProjectWithInitiatives)
async def get_project(
    project_id: str,
    user_id: str = Query(..., description="User ID")
) -> ProjectWithInitiatives:
    """
    Get a specific project with its linked initiatives.
    
    Args:
        project_id: Project ID
        user_id: User ID (for security)
        
    Returns:
        Project with initiatives
    """
    try:
        supabase = get_supabase_client()
        
        # Get project
        project_result = supabase.table("projects").select("*").eq(
            "id", project_id
        ).eq("user_id", user_id).execute()
        
        if not project_result.data:
            raise HTTPException(status_code=404, detail="Project not found")
        
        project = Project(**project_result.data[0])
        
        # Get linked initiatives
        links_result = supabase.table("project_initiatives").select(
            "initiative_id"
        ).eq("project_id", project_id).execute()
        
        initiatives = []
        if links_result.data:
            initiative_ids = [link["initiative_id"] for link in links_result.data]
            initiatives_result = supabase.table("initiatives").select("*").in_(
                "id", initiative_ids
            ).execute()
            
            if initiatives_result.data:
                initiatives = [Initiative(**i) for i in initiatives_result.data]
        
        return ProjectWithInitiatives(
            **project.model_dump(),
            initiatives=initiatives
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting project: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/{project_id}", response_model=Project)
async def update_project(
    project_id: str,
    project_update: ProjectUpdate,
    user_id: str = Query(..., description="User ID")
) -> Project:
    """
    Update a project.
    
    Args:
        project_id: Project ID
        project_update: Fields to update
        user_id: User ID (for security)
        
    Returns:
        Updated project
    """
    try:
        supabase = get_supabase_client()
        
        # Prepare update data
        update_data = project_update.model_dump(exclude_none=True)

        # Convert date objects to strings
        if "start_date" in update_data and update_data["start_date"]:
            update_data["start_date"] = update_data["start_date"].isoformat()
        if "deadline" in update_data and update_data["deadline"]:
            update_data["deadline"] = update_data["deadline"].isoformat()

        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        
        # Update project
        result = supabase.table("projects").update(update_data).eq(
            "id", project_id
        ).eq("user_id", user_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Project not found")
        
        logger.info(f"Project updated: {project_id}")
        
        return Project(**result.data[0])
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating project: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{project_id}")
async def delete_project(
    project_id: str,
    user_id: str = Query(..., description="User ID")
) -> dict:
    """
    Delete a project.
    
    Args:
        project_id: Project ID
        user_id: User ID (for security)
        
    Returns:
        Success message
    """
    try:
        supabase = get_supabase_client()
        
        result = supabase.table("projects").delete().eq(
            "id", project_id
        ).eq("user_id", user_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Project not found")
        
        logger.info(f"Project deleted: {project_id}")
        
        return {"message": "Project deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting project: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{project_id}/initiatives/{initiative_id}")
async def link_project_to_initiative(
    project_id: str,
    initiative_id: str,
    user_id: str = Query(..., description="User ID")
) -> dict:
    """
    Link a project to an initiative.
    
    Args:
        project_id: Project ID
        initiative_id: Initiative ID
        user_id: User ID (for security)
        
    Returns:
        Success message
    """
    try:
        supabase = get_supabase_client()
        
        # Verify project belongs to user
        project_result = supabase.table("projects").select("id").eq(
            "id", project_id
        ).eq("user_id", user_id).execute()
        
        if not project_result.data:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Verify initiative belongs to user
        initiative_result = supabase.table("initiatives").select("id").eq(
            "id", initiative_id
        ).eq("user_id", user_id).execute()
        
        if not initiative_result.data:
            raise HTTPException(status_code=404, detail="Initiative not found")
        
        # Create link
        link_data = {
            "project_id": project_id,
            "initiative_id": initiative_id,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        supabase.table("project_initiatives").insert(link_data).execute()
        
        logger.info(f"Linked project {project_id} to initiative {initiative_id}")
        
        return {"message": "Project linked to initiative successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error linking project to initiative: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{project_id}/initiatives/{initiative_id}")
async def unlink_project_from_initiative(
    project_id: str,
    initiative_id: str,
    user_id: str = Query(..., description="User ID")
) -> dict:
    """
    Unlink a project from an initiative.
    
    Args:
        project_id: Project ID
        initiative_id: Initiative ID
        user_id: User ID (for security)
        
    Returns:
        Success message
    """
    try:
        supabase = get_supabase_client()
        
        result = supabase.table("project_initiatives").delete().eq(
            "project_id", project_id
        ).eq("initiative_id", initiative_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Link not found")
        
        logger.info(f"Unlinked project {project_id} from initiative {initiative_id}")
        
        return {"message": "Project unlinked from initiative successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error unlinking project from initiative: {e}")
        raise HTTPException(status_code=500, detail=str(e))

