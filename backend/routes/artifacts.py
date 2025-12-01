"""Routes for artifact generation and management."""

import logging
import json
from fastapi import APIRouter, HTTPException, Query, Body
from fastapi.responses import StreamingResponse
from typing import Optional, List, Dict, Any, AsyncGenerator

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


@router.post("/draft", response_model=Dict[str, Any])
async def create_artifact_draft(
    user_id: str = Query(..., description="User ID"),
    request_data: Dict[str, Any] = Body(..., description="Draft request data")
) -> Dict[str, Any]:
    """
    Create an artifact draft with clarifying questions.

    This is the conversational approach (like Den):
    1. User provides initial prompt
    2. AI creates a draft artifact AND asks clarifying questions
    3. User can refine through conversation
    4. When satisfied, user saves the final artifact

    Args:
        user_id: User ID
        request_data: Contains prompt, conversation_history (optional), and draft (optional)

    Returns:
        Dict with draft artifact, assistant message, and suggested questions
    """
    try:
        service = ArtifactService()

        prompt = request_data.get("prompt")
        if not prompt:
            raise HTTPException(status_code=400, detail="prompt is required")

        conversation_history = request_data.get("conversation_history", [])
        current_draft = request_data.get("draft")
        context = request_data.get("context")

        result = await service.create_artifact_draft(
            user_id=user_id,
            prompt=prompt,
            conversation_history=conversation_history,
            current_draft=current_draft,
            context=context
        )

        logger.info(f"Draft created for user {user_id}")

        return result

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating draft: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/spec/stream")
async def create_spec_stream(
    user_id: str = Query(..., description="User ID"),
    request_data: Dict[str, Any] = Body(..., description="Spec request data")
) -> StreamingResponse:
    """
    Create a Product Spec with streaming response (Phase 1).

    The Product Spec is a markdown document that defines what the artifact
    should do. UI components are generated from this spec in Phase 2.

    Streams SSE events:
    - thinking: Shows what the AI is considering
    - building: Shows progress on building the spec
    - spec: The Product Spec document {spec, title, description}
    - message: Assistant message
    - done: Stream complete
    - error: Error occurred
    """
    async def generate() -> AsyncGenerator[str, None]:
        try:
            service = ArtifactService()

            prompt = request_data.get("prompt")
            if not prompt:
                yield f"data: {json.dumps({'type': 'error', 'content': 'prompt is required'})}\n\n"
                return

            conversation_history = request_data.get("conversation_history", [])
            current_spec = request_data.get("spec")
            context = request_data.get("context")

            # Stream the spec creation process
            async for event in service.create_spec_stream(
                user_id=user_id,
                prompt=prompt,
                conversation_history=conversation_history,
                current_spec=current_spec,
                context=context
            ):
                yield f"data: {json.dumps(event)}\n\n"

            yield f"data: {json.dumps({'type': 'done'})}\n\n"

        except Exception as e:
            logger.error(f"Error in streaming spec: {e}")
            yield f"data: {json.dumps({'type': 'error', 'content': str(e)})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )


@router.post("/generate-ui", response_model=Dict[str, Any])
async def generate_ui_from_spec(
    user_id: str = Query(..., description="User ID"),
    request_data: Dict[str, Any] = Body(..., description="Spec and context")
) -> Dict[str, Any]:
    """
    Generate UI components from a Product Spec (Phase 2).

    Takes a Product Spec document and generates visual components.

    Args:
        user_id: User ID
        request_data: Contains spec (markdown), title, and optional context

    Returns:
        Dict with components array and data
    """
    try:
        service = ArtifactService()

        spec = request_data.get("spec")
        if not spec:
            raise HTTPException(status_code=400, detail="spec is required")

        title = request_data.get("title", "Untitled")
        context = request_data.get("context")

        result = await service.generate_ui_from_spec(
            spec=spec,
            title=title,
            context=context
        )

        logger.info(f"UI generated from spec for user {user_id}")

        return result

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error generating UI from spec: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate", response_model=ArtifactResponse)
async def generate_artifact(
    user_id: str = Query(..., description="User ID"),
    artifact_data: ArtifactCreate = Body(..., description="Artifact creation data")
) -> ArtifactResponse:
    """
    Generate an artifact from a user prompt (legacy one-shot approach).

    For the new conversational approach, use POST /artifacts/draft instead.

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


@router.put("/{artifact_id}/data", response_model=Artifact)
async def update_artifact_data(
    artifact_id: str,
    data: Dict[str, Any] = Body(..., embed=True, description="Artifact data to update")
) -> Artifact:
    """
    Update artifact data (user-entered content).

    This endpoint updates the data field within the artifact's content,
    which stores user-entered information like OKR entries, KPI values, etc.

    Args:
        artifact_id: Artifact ID
        data: New data to merge into artifact.content.data

    Returns:
        Updated artifact
    """
    try:
        service = ArtifactService()
        artifact = await service.update_artifact_data(artifact_id, data)

        logger.info(f"Artifact data updated: {artifact_id}")

        return artifact

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating artifact data: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{artifact_id}")
async def delete_artifact(
    artifact_id: str,
    user_id: str = Query(..., description="User ID")
) -> Dict[str, str]:
    """
    Delete an artifact.

    Args:
        artifact_id: Artifact ID
        user_id: User ID (for authorization)

    Returns:
        Success message
    """
    try:
        service = ArtifactService()
        await service.delete_artifact(artifact_id, user_id)

        logger.info(f"Artifact deleted: {artifact_id}")

        return {"message": "Artifact deleted successfully"}

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error deleting artifact: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{artifact_id}/edit")
async def edit_artifact_with_ai(
    artifact_id: str,
    user_id: str = Query(..., description="User ID"),
    request_data: Dict[str, Any] = Body(..., description="Edit request data")
) -> Dict[str, Any]:
    """
    Edit an artifact using AI based on user's message.

    Args:
        artifact_id: Artifact ID
        user_id: User ID (for authorization)
        request_data: Contains user_message and optional conversation_history

    Returns:
        Assistant message and updated artifact
    """
    try:
        service = ArtifactService()

        user_message = request_data.get("user_message")
        if not user_message:
            raise HTTPException(status_code=400, detail="user_message is required")

        conversation_history = request_data.get("conversation_history", [])

        result = await service.edit_artifact_with_ai(
            artifact_id=artifact_id,
            user_id=user_id,
            user_message=user_message,
            conversation_history=conversation_history
        )

        logger.info(f"Artifact edited via AI: {artifact_id}")

        return result

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error editing artifact with AI: {e}")
        raise HTTPException(status_code=500, detail=str(e))

