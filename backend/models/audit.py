"""Audit log model."""

from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel


class AuditLog(BaseModel):
    """Audit log model."""
    
    id: UUID
    user_id: Optional[UUID] = None
    
    # Action details
    action: str  # login, email_sync, brief_generated, etc.
    resource_type: Optional[str] = None  # email, calendar, brief, etc.
    resource_id: Optional[UUID] = None
    
    # Request metadata
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    
    # Result
    status: str  # success, failure
    error_message: Optional[str] = None
    
    created_at: datetime
    
    class Config:
        from_attributes = True


class AuditLogCreate(BaseModel):
    """Schema for creating an audit log entry."""
    
    user_id: Optional[UUID] = None
    action: str
    resource_type: Optional[str] = None
    resource_id: Optional[UUID] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    status: str = "success"
    error_message: Optional[str] = None

