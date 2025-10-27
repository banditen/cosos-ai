"""Sync routes for Gmail and Calendar."""

import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, Query, BackgroundTasks
from pydantic import BaseModel

from services.gmail_service import GmailService
from services.calendar_service import CalendarService
from services.embedding_service import EmbeddingService
from database.client import get_supabase_client

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/sync", tags=["sync"])


class SyncResponse(BaseModel):
    """Response for sync operations."""
    message: str
    synced_count: int
    user_id: str


async def generate_email_embeddings(user_id: str):
    """
    Background task to generate embeddings for emails.
    
    Args:
        user_id: User ID
    """
    try:
        supabase = get_supabase_client()
        embedding_service = EmbeddingService()
        
        # Get emails without embeddings
        result = supabase.table("emails").select("*").eq(
            "user_id", user_id
        ).is_("content_embedding", "null").execute()
        
        emails = result.data
        logger.info(f"Generating embeddings for {len(emails)} emails")
        
        for email in emails:
            # Generate embedding
            embedding = embedding_service.embed_email(
                subject=email.get('subject', ''),
                body=email.get('body_text', ''),
                from_email=email.get('from_email', '')
            )
            
            # Update email with embedding
            supabase.table("emails").update({
                "content_embedding": embedding
            }).eq("id", email["id"]).execute()
        
        logger.info(f"Generated embeddings for {len(emails)} emails")
        
    except Exception as e:
        logger.error(f"Error generating email embeddings: {e}")


@router.post("/gmail", response_model=SyncResponse)
async def sync_gmail(
    user_id: str = Query(..., description="User ID"),
    days_back: int = Query(1, description="Number of days to sync back"),
    max_results: int = Query(100, description="Maximum emails to fetch"),
    background_tasks: BackgroundTasks = None
):
    """
    Sync emails from Gmail for a user.
    
    Args:
        user_id: User ID
        days_back: Number of days to sync back
        max_results: Maximum number of emails to fetch
        background_tasks: FastAPI background tasks
        
    Returns:
        Sync response with count of synced emails
    """
    try:
        gmail_service = GmailService()
        
        # Sync emails
        synced_emails = await gmail_service.sync_emails(
            user_id=user_id,
            days_back=days_back,
            max_results=max_results
        )
        
        # Generate embeddings in background
        if background_tasks and synced_emails:
            background_tasks.add_task(generate_email_embeddings, user_id)
        
        return SyncResponse(
            message=f"Successfully synced {len(synced_emails)} emails",
            synced_count=len(synced_emails),
            user_id=user_id
        )
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error syncing Gmail: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/calendar", response_model=SyncResponse)
async def sync_calendar(
    user_id: str = Query(..., description="User ID"),
    days_forward: int = Query(7, description="Number of days forward to sync"),
    days_back: int = Query(1, description="Number of days back to sync")
):
    """
    Sync calendar events from Google Calendar.
    
    Args:
        user_id: User ID
        days_forward: Number of days forward to sync
        days_back: Number of days back to sync
        
    Returns:
        Sync response with count of synced events
    """
    try:
        calendar_service = CalendarService()
        
        # Sync calendar
        synced_events = await calendar_service.sync_calendar(
            user_id=user_id,
            days_forward=days_forward,
            days_back=days_back
        )
        
        return SyncResponse(
            message=f"Successfully synced {len(synced_events)} calendar events",
            synced_count=len(synced_events),
            user_id=user_id
        )
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error syncing calendar: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/all", response_model=dict)
async def sync_all(
    user_id: str = Query(..., description="User ID"),
    background_tasks: BackgroundTasks = None
):
    """
    Sync both Gmail and Calendar for a user.
    
    Args:
        user_id: User ID
        background_tasks: FastAPI background tasks
        
    Returns:
        Combined sync results
    """
    try:
        gmail_service = GmailService()
        calendar_service = CalendarService()
        
        # Sync emails
        synced_emails = await gmail_service.sync_emails(user_id=user_id)
        
        # Sync calendar
        synced_events = await calendar_service.sync_calendar(user_id=user_id)
        
        # Generate embeddings in background
        if background_tasks and synced_emails:
            background_tasks.add_task(generate_email_embeddings, user_id)
        
        return {
            "message": "Successfully synced Gmail and Calendar",
            "gmail": {
                "synced_count": len(synced_emails)
            },
            "calendar": {
                "synced_count": len(synced_events)
            },
            "user_id": user_id
        }
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error syncing all: {e}")
        raise HTTPException(status_code=500, detail=str(e))

