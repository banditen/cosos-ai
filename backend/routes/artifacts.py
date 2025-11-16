"""Routes for artifact generation and management."""

import logging
from fastapi import APIRouter, HTTPException, Query, Body
from typing import Optional, List, Dict, Any

from models.artifact import (
    ArtifactCreate,
    ArtifactUpdate,
    ArtifactResponse,
    ArtifactListResponse,
    Artifact
)
from services.artifact_service import ArtifactService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/artifacts", tags=["artifacts"])


@router.post("/generate", response_model=ArtifactResponse)
async def generate_artifact(
    user_id: str = Query(..., description="User ID"),
    artifact_data: ArtifactCreate = Body(..., description="Artifact creation data")
) -> ArtifactResponse:
    """
    Generate an artifact from a user prompt.
    
    This is the core endpoint for the new prompt-driven approach:
    1. User provides a natural language prompt
    2. AI classifies the prompt to determine artifact type
    3. AI generates structured artifact content
    4. Artifact is saved to database
    5. Prompt is logged for analytics
    
    Args:
        user_id: User ID
        artifact_data: Contains prompt and optional context
        
    Returns:
        Generated artifact
    """
    try:
        service = ArtifactService()
        artifact = await service.generate_artifact(user_id, artifact_data)
        
        logger.info(f"Artifact generated for user {user_id}: {artifact.title}")
        
        return ArtifactResponse(
            artifact=artifact,
            message="Artifact generated successfully"
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error generating artifact: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{artifact_id}", response_model=Artifact)
async def get_artifact(
    artifact_id: str,
    user_id: str = Query(..., description="User ID")
) -> Artifact:
    """
    Get a specific artifact by ID.
    
    Args:
        artifact_id: Artifact ID
        user_id: User ID (for authorization)
        
    Returns:
        Artifact data
    """
    try:
        service = ArtifactService()
        artifact = await service.get_artifact(artifact_id, user_id)
        
        if not artifact:
            raise HTTPException(status_code=404, detail="Artifact not found")
        
        return artifact
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving artifact: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/", response_model=ArtifactListResponse)
async def list_artifacts(
    user_id: str = Query(..., description="User ID"),
    limit: int = Query(50, description="Number of artifacts to return", ge=1, le=100),
    offset: int = Query(0, description="Offset for pagination", ge=0)
) -> ArtifactListResponse:
    """
    List all artifacts for a user.
    
    Args:
        user_id: User ID
        limit: Number of artifacts to return
        offset: Offset for pagination
        
    Returns:
        List of artifacts
    """
    try:
        service = ArtifactService()
        artifacts = await service.list_artifacts(user_id, limit, offset)
        
        return ArtifactListResponse(
            artifacts=artifacts,
            total=len(artifacts),
            page=offset // limit + 1,
            page_size=limit
        )
        
    except Exception as e:
        logger.error(f"Error listing artifacts: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{artifact_id}", response_model=Artifact)
async def update_artifact(
    artifact_id: str,
    user_id: str = Query(..., description="User ID"),
    updates: ArtifactUpdate = Body(..., description="Artifact updates")
) -> Artifact:
    """
    Update an artifact.
    
    Args:
        artifact_id: Artifact ID
        user_id: User ID (for authorization)
        updates: Fields to update
        
    Returns:
        Updated artifact
    """
    try:
        service = ArtifactService()
        
        # Convert to dict and remove None values
        update_dict = {k: v for k, v in updates.dict().items() if v is not None}
        
        artifact = await service.update_artifact(artifact_id, user_id, update_dict)
        
        logger.info(f"Artifact updated: {artifact_id}")
        
        return artifact
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating artifact: {e}")
        raise HTTPException(status_code=500, detail=str(e))

