"""Context Q&A routes for business intelligence queries."""

import logging
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from services.context_qa_service import ContextQAService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/context", tags=["context"])


class AskRequest(BaseModel):
    question: str
    conversation_id: Optional[str] = None


class SourceInfo(BaseModel):
    id: str
    type: str
    preview: str


class AskResponse(BaseModel):
    answer: str
    sources: List[SourceInfo]
    conversation_id: str
    context_used: int


class ConversationSummary(BaseModel):
    id: str
    title: str
    created_at: datetime
    updated_at: datetime


class MessageInfo(BaseModel):
    role: str
    content: str
    timestamp: Optional[str] = None


class ConversationDetail(BaseModel):
    id: str
    title: str
    messages: List[MessageInfo]
    created_at: datetime
    updated_at: datetime


class ContextItem(BaseModel):
    id: str
    type: str
    text: str
    similarity: Optional[float] = None


class ContextRetrievalResponse(BaseModel):
    context: List[ContextItem]
    count: int


@router.get("/retrieve", response_model=ContextRetrievalResponse)
async def retrieve_context(
    user_id: str = Query(..., description="User ID"),
    query: str = Query(..., description="Query to search for"),
    limit: int = Query(10, description="Max items to return"),
):
    """Retrieve relevant context for a query (used by AI SDK route)."""
    try:
        service = ContextQAService()
        embedding = service.embedding_service.generate_embedding(query)
        context = await service._retrieve_context(user_id, embedding, limit)

        return ContextRetrievalResponse(
            context=[
                ContextItem(
                    id=str(item.get("id", "")),
                    type=item.get("type", "unknown"),
                    text=item.get("text", "")[:2000],
                    similarity=item.get("similarity"),
                )
                for item in context
            ],
            count=len(context),
        )
    except Exception as e:
        logger.error(f"Error retrieving context: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/ask", response_model=AskResponse)
async def ask_question(
    request: AskRequest,
    user_id: str = Query(..., description="User ID"),
):
    """Ask a question about your business context."""
    try:
        service = ContextQAService()
        result = await service.ask(
            user_id=user_id,
            question=request.question,
            conversation_id=request.conversation_id,
        )

        return AskResponse(
            answer=result["answer"],
            sources=[SourceInfo(**s) for s in result["sources"]],
            conversation_id=result["conversation_id"],
            context_used=result["context_used"],
        )
    except Exception as e:
        logger.error(f"Error answering question: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/conversations", response_model=List[ConversationSummary])
async def list_conversations(
    user_id: str = Query(..., description="User ID"),
    limit: int = Query(20, description="Max conversations to return"),
):
    """Get list of user's conversations."""
    try:
        service = ContextQAService()
        conversations = service.get_conversations(user_id, limit)
        return [ConversationSummary(**c) for c in conversations]
    except Exception as e:
        logger.error(f"Error listing conversations: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/conversations/{conversation_id}", response_model=ConversationDetail)
async def get_conversation(
    conversation_id: str,
    user_id: str = Query(..., description="User ID"),
):
    """Get a specific conversation."""
    try:
        service = ContextQAService()
        conversation = service.get_conversation(conversation_id)

        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")

        return ConversationDetail(
            id=conversation["id"],
            title=conversation["title"] or "Untitled",
            messages=[MessageInfo(**m) for m in conversation.get("messages", [])],
            created_at=conversation["created_at"],
            updated_at=conversation["updated_at"],
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting conversation: {e}")
        raise HTTPException(status_code=500, detail=str(e))

