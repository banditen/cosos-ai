"""Daily brief and feedback models."""

from datetime import datetime, date
from typing import Optional, List, Dict, Any
from uuid import UUID
from pydantic import BaseModel


class Priority(BaseModel):
    """A single priority item."""
    
    task: str
    reasoning: str
    estimated_time: int  # minutes
    source: str  # email, calendar, context
    source_id: Optional[str] = None  # Reference to email/event


class TimeBlock(BaseModel):
    """Suggested time block for focus work."""
    
    start_time: str  # HH:MM format
    end_time: str
    purpose: str
    reasoning: str


class QuickWin(BaseModel):
    """Quick task under 15 minutes."""
    
    task: str
    estimated_time: int  # minutes
    source: str


class Flag(BaseModel):
    """Urgent item needing attention."""
    
    type: str  # urgent_email, calendar_conflict, missing_context
    title: str
    description: str
    action_required: str
    source_id: Optional[str] = None


class DailyBrief(BaseModel):
    """Daily brief model."""
    
    id: UUID
    user_id: UUID
    brief_date: date
    
    # Generated content
    top_priorities: List[Priority]
    time_blocks: List[TimeBlock]
    quick_wins: List[QuickWin]
    flags: List[Flag]
    
    # Full brief text
    brief_text: str  # Plain text for email
    brief_html: str  # HTML for web
    
    # Metadata
    generated_at: datetime
    sent_at: Optional[datetime] = None
    viewed_at: Optional[datetime] = None
    
    # Agent reasoning (for debugging)
    agent_reasoning: Optional[Dict[str, Any]] = None
    
    class Config:
        from_attributes = True


class DailyBriefCreate(BaseModel):
    """Schema for creating a daily brief."""
    
    brief_date: date
    top_priorities: List[Priority]
    time_blocks: List[TimeBlock]
    quick_wins: List[QuickWin]
    flags: List[Flag]
    brief_text: str
    brief_html: str
    agent_reasoning: Optional[Dict[str, Any]] = None


class Feedback(BaseModel):
    """User feedback on agent decisions."""
    
    id: UUID
    user_id: UUID
    brief_id: Optional[UUID] = None
    
    # What was the feedback about?
    feedback_type: str  # priority_correction, time_block_adjustment, etc.
    
    # Original vs corrected
    original_value: Dict[str, Any]
    corrected_value: Dict[str, Any]
    user_note: Optional[str] = None
    
    # Embeddings for learning
    feedback_embedding: Optional[List[float]] = None
    
    created_at: datetime
    
    class Config:
        from_attributes = True


class FeedbackCreate(BaseModel):
    """Schema for creating feedback."""
    
    brief_id: Optional[UUID] = None
    feedback_type: str
    original_value: Dict[str, Any]
    corrected_value: Dict[str, Any]
    user_note: Optional[str] = None

