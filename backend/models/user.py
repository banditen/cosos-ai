"""User and UserContext models."""

from datetime import datetime, time
from typing import Optional, List, Dict, Any
from uuid import UUID
from pydantic import BaseModel, EmailStr, Field


class User(BaseModel):
    """User model."""
    
    id: UUID
    email: EmailStr
    full_name: Optional[str] = None
    timezone: str = "UTC"
    created_at: datetime
    updated_at: datetime
    last_login_at: Optional[datetime] = None
    is_active: bool = True
    
    # Preferences
    brief_time: time = time(7, 0)  # 7:00 AM
    brief_email_enabled: bool = True
    brief_slack_enabled: bool = False
    slack_webhook_url: Optional[str] = None
    
    class Config:
        from_attributes = True


class UserContextCreate(BaseModel):
    """Schema for creating user context during onboarding."""
    
    # Business Context
    business_mission: str = Field(..., description="Mission statement / what you're building")
    business_stage: str = Field(..., description="idea, mvp, growth, scale")
    key_metrics: List[str] = Field(default_factory=list, description="Metrics you care about")
    
    # Audience & Market
    target_audience: List[Dict[str, str]] = Field(
        default_factory=list,
        description="Customer profiles with name and description"
    )
    value_propositions: List[str] = Field(
        default_factory=list,
        description="Key value propositions"
    )
    competitive_positioning: Optional[str] = None
    
    # Communication Style
    brand_voice: Optional[str] = Field(None, description="Voice guidelines")
    tone_preference: str = Field(default="professional", description="formal, casual, professional")
    writing_examples: List[str] = Field(
        default_factory=list,
        description="Examples of your best emails/content"
    )
    
    # Current Focus
    quarterly_goals: List[Dict[str, str]] = Field(
        default_factory=list,
        description="Top 3 goals this quarter with goal and deadline"
    )
    current_challenges: List[str] = Field(
        default_factory=list,
        description="Biggest blockers"
    )
    success_criteria: Optional[str] = Field(None, description="What success looks like")


class UserContext(UserContextCreate):
    """User context model with database fields."""
    
    id: UUID
    user_id: UUID
    context_embedding: Optional[List[float]] = None  # Vector embedding
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class UserContextUpdate(BaseModel):
    """Schema for updating user context."""
    
    business_mission: Optional[str] = None
    business_stage: Optional[str] = None
    key_metrics: Optional[List[str]] = None
    target_audience: Optional[List[Dict[str, str]]] = None
    value_propositions: Optional[List[str]] = None
    competitive_positioning: Optional[str] = None
    brand_voice: Optional[str] = None
    tone_preference: Optional[str] = None
    writing_examples: Optional[List[str]] = None
    quarterly_goals: Optional[List[Dict[str, str]]] = None
    current_challenges: Optional[List[str]] = None
    success_criteria: Optional[str] = None

