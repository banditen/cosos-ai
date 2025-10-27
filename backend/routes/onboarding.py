"""Onboarding routes for collecting user context."""

import logging
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

from database.client import get_supabase_client
from services.embedding_service import EmbeddingService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/onboarding", tags=["onboarding"])


class UserContextInput(BaseModel):
    """User context input for onboarding."""
    
    # Business Context
    business_mission: str = Field(..., description="Mission statement or what you're building", min_length=10)
    business_stage: str = Field(..., description="Business stage: idea, mvp, launched, scaling")
    key_metrics: Optional[List[str]] = Field(default=None, description="Key metrics you track")
    
    # Audience & Market
    target_audience: Optional[List[str]] = Field(default=None, description="Who are your customers?")
    value_propositions: Optional[List[str]] = Field(default=None, description="Key value propositions")
    competitive_positioning: Optional[str] = Field(default=None, description="How you differentiate")
    
    # Communication Style
    brand_voice: Optional[str] = Field(default=None, description="Brand voice guidelines")
    tone_preference: Optional[str] = Field(default="professional", description="Tone: professional, casual, friendly")
    
    # Current Focus
    quarterly_goals: Optional[List[str]] = Field(default=None, description="Top 3 goals this quarter")
    current_challenges: Optional[List[str]] = Field(default=None, description="Biggest challenges/blockers")
    success_criteria: Optional[str] = Field(default=None, description="What success looks like")


class UserContextResponse(BaseModel):
    """Response after saving user context."""
    id: str
    user_id: str
    message: str


@router.post("/context")
async def save_user_context(
    user_id: str = Query(..., description="User ID"),
    context: UserContextInput = ...
) -> UserContextResponse:
    """
    Save user context from onboarding.
    
    This collects business context, goals, audience info, and preferences
    that the AI agent will use to personalize daily briefs.
    
    Args:
        user_id: User ID
        context: User context data
        
    Returns:
        Saved context with ID
    """
    try:
        supabase = get_supabase_client()
        
        # Check if user exists
        user_result = supabase.table("users").select("id").eq("id", user_id).execute()
        if not user_result.data:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Generate embedding for the context
        # Combine all text fields into one for embedding
        context_text = f"""
        Mission: {context.business_mission}
        Stage: {context.business_stage}
        Goals: {', '.join(context.quarterly_goals or [])}
        Challenges: {', '.join(context.current_challenges or [])}
        Target Audience: {', '.join(context.target_audience or [])}
        Value Props: {', '.join(context.value_propositions or [])}
        Success Criteria: {context.success_criteria or ''}
        """
        
        embedding_service = EmbeddingService()
        embedding = embedding_service.generate_embedding(context_text.strip())
        
        # Prepare data for database
        context_data = {
            "user_id": user_id,
            "business_mission": context.business_mission,
            "business_stage": context.business_stage,
            "key_metrics": context.key_metrics,
            "target_audience": context.target_audience,
            "value_propositions": context.value_propositions,
            "competitive_positioning": context.competitive_positioning,
            "brand_voice": context.brand_voice,
            "tone_preference": context.tone_preference,
            "quarterly_goals": context.quarterly_goals,
            "current_challenges": context.current_challenges,
            "success_criteria": context.success_criteria,
            "context_embedding": embedding,
        }

        # Check if context already exists
        existing = supabase.table("user_context").select("id").eq("user_id", user_id).execute()

        if existing.data:
            # Update existing context
            result = supabase.table("user_context").update(context_data).eq("user_id", user_id).execute()
        else:
            # Insert new context
            result = supabase.table("user_context").insert(context_data).execute()

        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to save context")
        
        logger.info(f"Saved context for user {user_id}")
        
        return UserContextResponse(
            id=result.data[0]["id"],
            user_id=user_id,
            message="Context saved successfully! Your AI agent is now personalized."
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error saving user context: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/context")
async def get_user_context(
    user_id: str = Query(..., description="User ID")
) -> Dict[str, Any]:
    """
    Get user context.
    
    Args:
        user_id: User ID
        
    Returns:
        User context data
    """
    try:
        supabase = get_supabase_client()
        
        result = supabase.table("user_context").select("*").eq("user_id", user_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Context not found. Please complete onboarding.")
        
        return result.data[0]
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching user context: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/context")
async def update_user_context(
    user_id: str = Query(..., description="User ID"),
    context: UserContextInput = ...
) -> UserContextResponse:
    """
    Update user context.
    
    Args:
        user_id: User ID
        context: Updated context data
        
    Returns:
        Updated context
    """
    # Same as save_user_context since we use upsert
    return await save_user_context(user_id, context)


@router.delete("/context")
async def delete_user_context(
    user_id: str = Query(..., description="User ID")
) -> Dict[str, str]:
    """
    Delete user context.
    
    Args:
        user_id: User ID
        
    Returns:
        Success message
    """
    try:
        supabase = get_supabase_client()
        
        result = supabase.table("user_context").delete().eq("user_id", user_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Context not found")
        
        logger.info(f"Deleted context for user {user_id}")
        
        return {"message": "Context deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting user context: {e}")
        raise HTTPException(status_code=500, detail=str(e))

