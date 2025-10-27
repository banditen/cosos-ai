"""Email model for synced Gmail messages."""

from datetime import datetime
from typing import Optional, List, Dict, Any
from uuid import UUID
from pydantic import BaseModel, EmailStr


class Email(BaseModel):
    """Email model."""
    
    id: UUID
    user_id: UUID
    
    # Gmail metadata
    gmail_id: str
    thread_id: Optional[str] = None
    
    # Email content
    subject: Optional[str] = None
    from_email: Optional[EmailStr] = None
    from_name: Optional[str] = None
    to_emails: List[EmailStr] = []
    cc_emails: List[EmailStr] = []
    body_text: Optional[str] = None
    body_html: Optional[str] = None
    
    # Metadata
    received_at: Optional[datetime] = None
    labels: List[str] = []
    is_read: bool = False
    is_important: bool = False
    has_attachments: bool = False
    
    # AI Analysis
    summary: Optional[str] = None
    action_items: List[Dict[str, Any]] = []
    priority_score: Optional[int] = None  # 1-5
    category: Optional[str] = None  # customer, investor, team, etc.
    
    # Embeddings
    content_embedding: Optional[List[float]] = None
    
    synced_at: datetime
    created_at: datetime
    
    class Config:
        from_attributes = True


class EmailCreate(BaseModel):
    """Schema for creating an email record."""
    
    gmail_id: str
    thread_id: Optional[str] = None
    subject: Optional[str] = None
    from_email: Optional[EmailStr] = None
    from_name: Optional[str] = None
    to_emails: List[EmailStr] = []
    cc_emails: List[EmailStr] = []
    body_text: Optional[str] = None
    body_html: Optional[str] = None
    received_at: Optional[datetime] = None
    labels: List[str] = []
    is_read: bool = False
    is_important: bool = False
    has_attachments: bool = False


class EmailAnalysis(BaseModel):
    """Schema for AI analysis results."""
    
    summary: str
    action_items: List[Dict[str, Any]]
    priority_score: int  # 1-5
    category: str
    reasoning: str  # Why this priority/category

