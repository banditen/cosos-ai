"""Google Calendar service for syncing calendar events."""

import logging
from datetime import datetime, timedelta, timezone
from typing import List, Optional, Dict, Any

from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

from config import settings
from database.client import get_supabase_client

logger = logging.getLogger(__name__)


class CalendarService:
    """Service for Google Calendar syncing."""
    
    def __init__(self):
        self.supabase = get_supabase_client()
        self.scopes = settings.CALENDAR_SCOPES
    
    def _get_credentials(self, user_id: str) -> Optional[Credentials]:
        """
        Get Google Calendar credentials for a user.
        Uses the same OAuth integration as Gmail.
        
        Args:
            user_id: User ID
            
        Returns:
            Google credentials or None
        """
        # Fetch integration from database (same as Gmail)
        result = self.supabase.table("integrations").select("*").eq(
            "user_id", user_id
        ).eq("provider", "gmail").eq("is_active", True).execute()
        
        if not result.data:
            logger.warning(f"No Google integration found for user {user_id}")
            return None
        
        integration = result.data[0]
        
        # Create credentials object
        credentials = Credentials(
            token=integration["access_token"],
            refresh_token=integration["refresh_token"],
            token_uri="https://oauth2.googleapis.com/token",
            client_id=settings.GOOGLE_CLIENT_ID,
            client_secret=settings.GOOGLE_CLIENT_SECRET,
            scopes=settings.GMAIL_SCOPES + self.scopes,
        )
        
        # Check if token needs refresh
        if integration.get("token_expires_at"):
            expiry = datetime.fromisoformat(integration["token_expires_at"])
            now = datetime.now(timezone.utc)
            if expiry <= now:
                logger.info(f"Refreshing token for user {user_id}")
                credentials.refresh(None)

                # Update token in database
                self.supabase.table("integrations").update({
                    "access_token": credentials.token,
                    "token_expires_at": credentials.expiry.isoformat() if credentials.expiry else None,
                    "updated_at": now.isoformat(),
                }).eq("id", integration["id"]).execute()
        
        return credentials
    
    async def sync_calendar(
        self, 
        user_id: str, 
        days_forward: int = 7,
        days_back: int = 1
    ) -> List[Dict[str, Any]]:
        """
        Sync calendar events from Google Calendar.
        
        Args:
            user_id: User ID
            days_forward: Number of days forward to sync
            days_back: Number of days back to sync
            
        Returns:
            List of synced calendar events
        """
        credentials = self._get_credentials(user_id)
        if not credentials:
            raise ValueError(f"No Google credentials found for user {user_id}")
        
        service = build('calendar', 'v3', credentials=credentials)

        # Calculate time range
        # Use replace(tzinfo=None) to get naive datetime, then add 'Z' for UTC
        now = datetime.now(timezone.utc)
        time_min = (now - timedelta(days=days_back)).replace(tzinfo=None).isoformat() + 'Z'
        time_max = (now + timedelta(days=days_forward)).replace(tzinfo=None).isoformat() + 'Z'
        
        try:
            # Get events from primary calendar
            events_result = service.events().list(
                calendarId='primary',
                timeMin=time_min,
                timeMax=time_max,
                maxResults=100,
                singleEvents=True,
                orderBy='startTime'
            ).execute()
            
            events = events_result.get('items', [])
            logger.info(f"Found {len(events)} calendar events for user {user_id}")
            
            synced_events = []
            
            for event in events:
                # Parse event data
                event_data = self._parse_event(event, user_id)
                
                # Check if event already exists
                existing = self.supabase.table("calendar_events").select("id").eq(
                    "gcal_id", event_data["gcal_id"]
                ).execute()
                
                if existing.data:
                    # Update existing event
                    result = self.supabase.table("calendar_events").update(
                        event_data
                    ).eq("id", existing.data[0]["id"]).execute()
                    logger.debug(f"Updated event: {event_data['title']}")
                else:
                    # Insert new event
                    result = self.supabase.table("calendar_events").insert(
                        event_data
                    ).execute()
                    logger.debug(f"Synced new event: {event_data['title']}")
                
                if result.data:
                    synced_events.append(result.data[0])
            
            logger.info(f"Synced {len(synced_events)} calendar events for user {user_id}")
            
            return synced_events
            
        except HttpError as error:
            logger.error(f"Calendar API error: {error}")
            raise
    
    def _parse_event(self, event: Dict[str, Any], user_id: str) -> Dict[str, Any]:
        """
        Parse Google Calendar event into event data.
        
        Args:
            event: Google Calendar event object
            user_id: User ID
            
        Returns:
            Event data dict
        """
        # Parse start and end times
        start = event['start'].get('dateTime', event['start'].get('date'))
        end = event['end'].get('dateTime', event['end'].get('date'))
        is_all_day = 'date' in event['start']
        
        # Parse start/end as datetime
        if is_all_day:
            start_time = datetime.fromisoformat(start).isoformat()
            end_time = datetime.fromisoformat(end).isoformat()
        else:
            start_time = start
            end_time = end
        
        # Parse attendees
        attendees = []
        for attendee in event.get('attendees', []):
            attendees.append({
                'email': attendee.get('email'),
                'name': attendee.get('displayName', ''),
                'status': attendee.get('responseStatus', 'needsAction')
            })
        
        # Get organizer
        organizer_email = None
        if 'organizer' in event:
            organizer_email = event['organizer'].get('email')
        
        # Check if recurring
        is_recurring = 'recurrence' in event or 'recurringEventId' in event
        recurrence_rule = None
        if 'recurrence' in event:
            recurrence_rule = event['recurrence'][0] if event['recurrence'] else None
        
        return {
            "user_id": user_id,
            "gcal_id": event['id'],
            "calendar_id": event.get('organizer', {}).get('email', 'primary'),
            "title": event.get('summary', '(No Title)'),
            "description": event.get('description'),
            "location": event.get('location'),
            "start_time": start_time,
            "end_time": end_time,
            "is_all_day": is_all_day,
            "timezone": event['start'].get('timeZone'),
            "attendees": attendees,
            "organizer_email": organizer_email,
            "status": event.get('status', 'confirmed'),
            "is_recurring": is_recurring,
            "recurrence_rule": recurrence_rule,
        }

