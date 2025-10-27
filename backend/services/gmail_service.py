"""Gmail service for OAuth and email syncing."""

import logging
import base64
from datetime import datetime, timedelta, timezone
from typing import List, Optional, Dict, Any
from uuid import UUID

from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

from config import settings
from database.client import get_supabase_client
from models.email import EmailCreate
from models.integration import IntegrationCreate

logger = logging.getLogger(__name__)


class GmailService:
    """Service for Gmail OAuth and email syncing."""
    
    def __init__(self):
        self.supabase = get_supabase_client()
        self.scopes = settings.GMAIL_SCOPES
    
    def get_oauth_url(self, user_id: str) -> str:
        """
        Generate OAuth URL for Gmail authorization.
        
        Args:
            user_id: User ID to associate with the OAuth flow
            
        Returns:
            Authorization URL
        """
        flow = Flow.from_client_config(
            {
                "web": {
                    "client_id": settings.GOOGLE_CLIENT_ID,
                    "client_secret": settings.GOOGLE_CLIENT_SECRET,
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                    "redirect_uris": [settings.GOOGLE_REDIRECT_URI],
                }
            },
            scopes=self.scopes + settings.CALENDAR_SCOPES,
        )
        
        flow.redirect_uri = settings.GOOGLE_REDIRECT_URI
        
        authorization_url, state = flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true',
            state=user_id,  # Pass user_id as state
            prompt='consent'  # Force consent to get refresh token
        )
        
        return authorization_url
    
    async def handle_oauth_callback(
        self,
        code: str,
        user_id: str
    ) -> Dict[str, Any]:
        """
        Handle OAuth callback and store tokens.

        Args:
            code: Authorization code from Google
            user_id: User ID from state parameter

        Returns:
            Integration data
        """
        # Don't specify scopes in callback to avoid validation errors
        # Google will return whatever scopes were actually granted
        flow = Flow.from_client_config(
            {
                "web": {
                    "client_id": settings.GOOGLE_CLIENT_ID,
                    "client_secret": settings.GOOGLE_CLIENT_SECRET,
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                    "redirect_uris": [settings.GOOGLE_REDIRECT_URI],
                }
            },
            scopes=None,  # Don't validate scopes in callback
        )

        flow.redirect_uri = settings.GOOGLE_REDIRECT_URI
        flow.fetch_token(code=code)
        
        credentials = flow.credentials
        
        # Get user's email from Gmail API
        service = build('gmail', 'v1', credentials=credentials)
        profile = service.users().getProfile(userId='me').execute()
        email_address = profile.get('emailAddress')
        
        # Calculate token expiry
        token_expires_at = None
        if credentials.expiry:
            token_expires_at = credentials.expiry.isoformat()
        
        # Store integration in database
        # Use the actual scopes from credentials to avoid mismatch
        granted_scopes = credentials.scopes if (hasattr(credentials, 'scopes') and credentials.scopes) else (self.scopes + settings.CALENDAR_SCOPES)

        integration_data = {
            "user_id": user_id,
            "provider": "gmail",
            "access_token": credentials.token,
            "refresh_token": credentials.refresh_token,
            "token_expires_at": token_expires_at,
            "scope": " ".join(sorted(granted_scopes)) if granted_scopes else "",  # Sort to ensure consistent order
            "account_email": email_address,
            "is_active": True,
        }
        
        # Upsert integration (update if exists, insert if not)
        result = self.supabase.table("integrations").upsert(
            integration_data,
            on_conflict="user_id,provider"
        ).execute()
        
        logger.info(f"Gmail integration created for user {user_id}")
        
        return result.data[0] if result.data else integration_data
    
    def _get_credentials(self, user_id: str) -> Optional[Credentials]:
        """
        Get Gmail credentials for a user.
        
        Args:
            user_id: User ID
            
        Returns:
            Google credentials or None
        """
        # Fetch integration from database
        result = self.supabase.table("integrations").select("*").eq(
            "user_id", user_id
        ).eq("provider", "gmail").eq("is_active", True).execute()
        
        if not result.data:
            logger.warning(f"No Gmail integration found for user {user_id}")
            return None
        
        integration = result.data[0]
        
        # Create credentials object
        credentials = Credentials(
            token=integration["access_token"],
            refresh_token=integration["refresh_token"],
            token_uri="https://oauth2.googleapis.com/token",
            client_id=settings.GOOGLE_CLIENT_ID,
            client_secret=settings.GOOGLE_CLIENT_SECRET,
            scopes=self.scopes,
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
    
    async def sync_emails(
        self, 
        user_id: str, 
        days_back: int = 1,
        max_results: int = 100
    ) -> List[Dict[str, Any]]:
        """
        Sync emails from Gmail for a user.
        
        Args:
            user_id: User ID
            days_back: Number of days to sync back
            max_results: Maximum number of emails to fetch
            
        Returns:
            List of synced email data
        """
        credentials = self._get_credentials(user_id)
        if not credentials:
            raise ValueError(f"No Gmail credentials found for user {user_id}")
        
        service = build('gmail', 'v1', credentials=credentials)

        # Calculate date filter
        after_date = datetime.now(timezone.utc) - timedelta(days=days_back)
        query = f"after:{int(after_date.timestamp())}"
        
        try:
            # List messages
            results = service.users().messages().list(
                userId='me',
                q=query,
                maxResults=max_results
            ).execute()
            
            messages = results.get('messages', [])
            logger.info(f"Found {len(messages)} emails for user {user_id}")
            
            synced_emails = []
            
            for msg in messages:
                # Get full message details
                message = service.users().messages().get(
                    userId='me',
                    id=msg['id'],
                    format='full'
                ).execute()
                
                # Parse email data
                email_data = self._parse_email(message, user_id)
                
                # Check if email already exists
                existing = self.supabase.table("emails").select("id").eq(
                    "gmail_id", email_data["gmail_id"]
                ).execute()
                
                if existing.data:
                    logger.debug(f"Email {email_data['gmail_id']} already exists, skipping")
                    continue
                
                # Insert email into database
                result = self.supabase.table("emails").insert(email_data).execute()
                
                if result.data:
                    synced_emails.append(result.data[0])
                    logger.debug(f"Synced email: {email_data['subject']}")
            
            # Update last sync time
            self.supabase.table("integrations").update({
                "last_sync_at": datetime.now(timezone.utc).isoformat()
            }).eq("user_id", user_id).eq("provider", "gmail").execute()
            
            logger.info(f"Synced {len(synced_emails)} new emails for user {user_id}")
            
            return synced_emails
            
        except HttpError as error:
            logger.error(f"Gmail API error: {error}")
            raise
    
    def _parse_email(self, message: Dict[str, Any], user_id: str) -> Dict[str, Any]:
        """
        Parse Gmail message into email data.
        
        Args:
            message: Gmail message object
            user_id: User ID
            
        Returns:
            Email data dict
        """
        headers = {h['name']: h['value'] for h in message['payload'].get('headers', [])}
        
        # Extract body
        body_text = ""
        body_html = ""
        
        if 'parts' in message['payload']:
            for part in message['payload']['parts']:
                if part['mimeType'] == 'text/plain' and 'data' in part['body']:
                    body_text = base64.urlsafe_b64decode(part['body']['data']).decode('utf-8')
                elif part['mimeType'] == 'text/html' and 'data' in part['body']:
                    body_html = base64.urlsafe_b64decode(part['body']['data']).decode('utf-8')
        elif 'body' in message['payload'] and 'data' in message['payload']['body']:
            body_text = base64.urlsafe_b64decode(message['payload']['body']['data']).decode('utf-8')
        
        # Parse recipients
        to_emails = self._parse_email_addresses(headers.get('To', ''))
        cc_emails = self._parse_email_addresses(headers.get('Cc', ''))
        
        # Parse received date
        received_at = None
        if 'internalDate' in message:
            received_at = datetime.fromtimestamp(int(message['internalDate']) / 1000, tz=timezone.utc).isoformat()
        
        return {
            "user_id": user_id,
            "gmail_id": message['id'],
            "thread_id": message.get('threadId'),
            "subject": headers.get('Subject', '(No Subject)'),
            "from_email": self._extract_email(headers.get('From', '')),
            "from_name": self._extract_name(headers.get('From', '')),
            "to_emails": to_emails,
            "cc_emails": cc_emails,
            "body_text": body_text,
            "body_html": body_html,
            "received_at": received_at,
            "labels": message.get('labelIds', []),
            "is_read": 'UNREAD' not in message.get('labelIds', []),
            "is_important": 'IMPORTANT' in message.get('labelIds', []),
            "has_attachments": any(
                part.get('filename') for part in message['payload'].get('parts', [])
            ),
        }
    
    def _parse_email_addresses(self, email_string: str) -> List[str]:
        """Parse comma-separated email addresses."""
        if not email_string:
            return []
        
        emails = []
        for part in email_string.split(','):
            email = self._extract_email(part.strip())
            if email:
                emails.append(email)
        return emails
    
    def _extract_email(self, email_string: str) -> Optional[str]:
        """Extract email address from string like 'Name <email@example.com>'."""
        if not email_string:
            return None
        
        if '<' in email_string and '>' in email_string:
            return email_string.split('<')[1].split('>')[0].strip()
        return email_string.strip()
    
    def _extract_name(self, email_string: str) -> Optional[str]:
        """Extract name from string like 'Name <email@example.com>'."""
        if not email_string:
            return None
        
        if '<' in email_string:
            return email_string.split('<')[0].strip().strip('"')
        return None

