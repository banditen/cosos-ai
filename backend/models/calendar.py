"""Calendar event model for synced Google Calendar events."""

from datetime import datetime
from typing import Optional, List, Dict, Any
from uuid import UUID
from pydantic import BaseModel, EmailStr


class CalendarEvent(BaseModel):
    """Calendar event model."""
    
    id: UUID
    user_id: UUID
    
    # Google Calendar metadata
    gcal_id: str
    calendar_id: Optional[str] = None
    
    # Event details
    title: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    
    # Timing
    start_time: datetime
    end_time: datetime
    is_all_day: bool = False
    timezone: Optional[str] = None
    
    # Participants
    attendees: List[Dict[str, str]] = []  # [{email, name, status}]
    organizer_email: Optional[EmailStr] = None
    
    # Metadata
    status: Optional[str] = None  # confirmed, tentative, cancelled
    is_recurring: bool = False
    recurrence_rule: Optional[str] = None
    
    # AI Analysis
    event_type: Optional[str] = None  # meeting, focus_time, personal, etc.
    importance_score: Optional[int] = None  # 1-5
    
    synced_at: datetime
    created_at: datetime
    
    class Config:
        from_attributes = True


class CalendarEventCreate(BaseModel):
    """Schema for creating a calendar event record."""
    
    gcal_id: str
    calendar_id: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    start_time: datetime
    end_time: datetime
    is_all_day: bool = False
    timezone: Optional[str] = None
    attendees: List[Dict[str, str]] = []
    organizer_email: Optional[EmailStr] = None
    status: Optional[str] = None
    is_recurring: bool = False
    recurrence_rule: Optional[str] = None

