"""Artifact and Prompt models for prompt-driven artifact generation."""

from datetime import datetime
from typing import Optional, List, Dict, Any
from uuid import UUID
from pydantic import BaseModel, Field
from enum import Enum


class ArtifactType(str, Enum):
    """Types of artifacts that can be generated."""
    MRR_TRACKER = "mrr_tracker"
    RETENTION_ANALYSIS = "retention_analysis"
    BOARD_PREP = "board_prep"
    ACTIVATION_MONITOR = "activation_monitor"
    PRODUCT_VELOCITY = "product_velocity"
    CUSTOMER_FEEDBACK = "customer_feedback"
    OPERATING_SYSTEM = "operating_system"
    CUSTOM = "custom"


class ArtifactStatus(str, Enum):
    """Status of an artifact."""
    ACTIVE = "active"
    ARCHIVED = "archived"
    DELETED = "deleted"


class UserContext(BaseModel):
    """User context from onboarding."""
    stage: str  # 'pre-launch', 'early-revenue', 'seed', 'series-a', 'series-b+'
    goal: str  # 'find-pmf', 'grow-revenue', 'improve-retention', etc.
    challenge: Optional[str] = None  # Optional challenge description


class ArtifactCreate(BaseModel):
    """Schema for creating a new artifact."""
    prompt: str = Field(..., description="User's natural language prompt")
    context: Optional[UserContext] = Field(None, description="User context from onboarding")


class Artifact(BaseModel):
    """Artifact model - represents a generated artifact."""
    
    id: UUID
    user_id: UUID
    
    # Metadata
    type: ArtifactType
    title: str
    description: Optional[str] = None
    
    # User input
    prompt: str
    context: Optional[Dict[str, Any]] = None
    
    # Generated content
    content: Dict[str, Any]  # Structured artifact data
    metadata: Optional[Dict[str, Any]] = None
    
    # Status
    status: ArtifactStatus = ArtifactStatus.ACTIVE
    
    # Integration status
    integrations_connected: Optional[List[str]] = Field(default=None)
    last_synced_at: Optional[datetime] = None

    def __init__(self, **data):
        # Convert None to empty list for integrations_connected
        if data.get('integrations_connected') is None:
            data['integrations_connected'] = []
        super().__init__(**data)
    
    # Timestamps
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class ArtifactUpdate(BaseModel):
    """Schema for updating an artifact."""
    title: Optional[str] = None
    description: Optional[str] = None
    content: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None
    status: Optional[ArtifactStatus] = None
    integrations_connected: Optional[List[str]] = None


class Prompt(BaseModel):
    """Prompt model - tracks all user prompts."""
    
    id: UUID
    user_id: UUID
    
    # Prompt data
    prompt: str
    context: Optional[Dict[str, Any]] = None
    
    # Result
    artifact_id: Optional[UUID] = None
    artifact_type: Optional[str] = None
    
    # Success tracking
    was_successful: bool = True
    error_message: Optional[str] = None
    
    # Timestamps
    created_at: datetime
    
    class Config:
        from_attributes = True


class ArtifactUpdateRecord(BaseModel):
    """Artifact update record - tracks changes to artifacts."""
    
    id: UUID
    artifact_id: UUID
    user_id: UUID
    
    # Update data
    update_type: str  # 'manual_edit', 'data_refresh', 'integration_sync'
    changes: Dict[str, Any]
    
    # Timestamps
    created_at: datetime
    
    class Config:
        from_attributes = True


# Response models for API
class ArtifactResponse(BaseModel):
    """Response model for artifact endpoints."""
    artifact: Artifact
    message: Optional[str] = None


class ArtifactListResponse(BaseModel):
    """Response model for listing artifacts."""
    artifacts: List[Artifact]
    total: int
    page: int = 1
    page_size: int = 50

