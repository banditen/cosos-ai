"""Integration model for OAuth connections."""

from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, EmailStr


class Integration(BaseModel):
    """OAuth integration model."""
    
    id: UUID
    user_id: UUID
    provider: str  # gmail, google_calendar, slack
    
    # OAuth tokens (will be encrypted by Supabase)
    access_token: str
    refresh_token: Optional[str] = None
    token_expires_at: Optional[datetime] = None
    
    # Metadata
    scope: Optional[str] = None
    account_email: Optional[EmailStr] = None
    
    is_active: bool = True
    last_sync_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class IntegrationCreate(BaseModel):
    """Schema for creating an integration."""
    
    provider: str
    access_token: str
    refresh_token: Optional[str] = None
    token_expires_at: Optional[datetime] = None
    scope: Optional[str] = None
    account_email: Optional[EmailStr] = None

