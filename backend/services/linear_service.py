"""Linear service for OAuth and issue/project syncing."""

import logging
import requests
from datetime import datetime, timedelta, timezone
from typing import List, Optional, Dict, Any
from uuid import UUID

from config import settings
from database.client import get_supabase_client

logger = logging.getLogger(__name__)


class LinearService:
    """Service for Linear OAuth and syncing."""
    
    def __init__(self):
        self.supabase = get_supabase_client()
        self.scopes = settings.LINEAR_SCOPES
        self.api_url = "https://api.linear.app"
        self.graphql_url = f"{self.api_url}/graphql"
    
    def get_oauth_url(self, user_id: str) -> str:
        """
        Generate OAuth URL for Linear authorization.
        
        Args:
            user_id: User ID to associate with the OAuth flow
            
        Returns:
            Authorization URL
        """
        scope = ",".join(self.scopes)
        auth_url = (
            f"https://linear.app/oauth/authorize"
            f"?client_id={settings.LINEAR_CLIENT_ID}"
            f"&redirect_uri={settings.LINEAR_REDIRECT_URI}"
            f"&response_type=code"
            f"&scope={scope}"
            f"&state={user_id}"
        )
        
        logger.info(f"Generated Linear OAuth URL for user {user_id}")
        return auth_url
    
    async def handle_oauth_callback(
        self,
        code: str,
        user_id: str
    ) -> Dict[str, Any]:
        """
        Handle OAuth callback and store tokens.

        Args:
            code: Authorization code from Linear
            user_id: User ID from state parameter

        Returns:
            Integration data
        """
        # Exchange code for access token
        token_url = f"{self.api_url}/oauth/token"
        payload = {
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": settings.LINEAR_REDIRECT_URI,
            "client_id": settings.LINEAR_CLIENT_ID,
            "client_secret": settings.LINEAR_CLIENT_SECRET,
        }

        # Linear expects form-encoded data, not JSON
        response = requests.post(token_url, data=payload)
        response.raise_for_status()
        token_data = response.json()

        logger.info(f"Linear OAuth token response: {token_data}")

        access_token = token_data["access_token"]

        # Calculate token expiry
        # Linear may return expires_in (seconds) or expires_at (ISO timestamp)
        token_expires_at = None
        if token_data.get("expires_at"):
            # Linear returns ISO timestamp - normalize it
            token_expires_at = self._normalize_timestamp(token_data["expires_at"])
        elif token_data.get("expires_in"):
            # Calculate from expires_in seconds
            expiry_time = datetime.now(timezone.utc) + timedelta(seconds=token_data["expires_in"])
            token_expires_at = expiry_time.isoformat(timespec='microseconds')
        
        # Get user info from Linear API
        user_info = self._get_viewer_info(access_token)
        account_email = user_info.get("email")
        
        # Store integration in database
        integration_data = {
            "user_id": user_id,
            "provider": "linear",
            "access_token": access_token,
            "refresh_token": None,  # Linear doesn't use refresh tokens (long-lived tokens)
            "token_expires_at": token_expires_at,
            "scope": " ".join(self.scopes),
            "account_email": account_email,
            "is_active": True,
        }
        
        # Upsert integration (update if exists, insert if not)
        result = self.supabase.table("integrations").upsert(
            integration_data,
            on_conflict="user_id,provider"
        ).execute()
        
        logger.info(f"Linear OAuth successful for user {user_id}")
        return result.data[0]
    
    def _get_viewer_info(self, access_token: str) -> Dict[str, Any]:
        """
        Get viewer (current user) info from Linear API.
        
        Args:
            access_token: Linear access token
            
        Returns:
            User info dict
        """
        query = """
        query {
            viewer {
                id
                name
                email
            }
        }
        """
        
        headers = {
            "Authorization": access_token,
            "Content-Type": "application/json",
        }
        
        response = requests.post(
            self.graphql_url,
            json={"query": query},
            headers=headers
        )
        response.raise_for_status()
        data = response.json()
        
        return data["data"]["viewer"]
    
    def _get_access_token(self, user_id: str) -> Optional[str]:
        """
        Get Linear access token for a user.
        
        Args:
            user_id: User ID
            
        Returns:
            Access token or None
        """
        # Fetch integration from database
        result = self.supabase.table("integrations").select("*").eq(
            "user_id", user_id
        ).eq("provider", "linear").eq("is_active", True).execute()
        
        if not result.data:
            logger.warning(f"No Linear integration found for user {user_id}")
            return None
        
        integration = result.data[0]
        
        # Linear uses long-lived tokens, no refresh needed
        # But check if token is expired
        if integration.get("token_expires_at"):
            # Normalize timestamp to handle Linear's 5-digit microseconds
            normalized_expiry = self._normalize_timestamp(integration["token_expires_at"])
            expiry = datetime.fromisoformat(normalized_expiry)
            now = datetime.now(timezone.utc)
            if expiry <= now:
                logger.warning(f"Linear token expired for user {user_id}")
                return None
        
        return integration["access_token"]
    
    async def sync_issues(
        self, 
        user_id: str, 
        days_back: int = 7,
        max_results: int = 100
    ) -> List[Dict[str, Any]]:
        """
        Sync issues from Linear for a user.
        
        Args:
            user_id: User ID
            days_back: Number of days to sync back
            max_results: Maximum number of issues to fetch
            
        Returns:
            List of synced issue data
        """
        access_token = self._get_access_token(user_id)
        if not access_token:
            raise ValueError(f"No Linear access token found for user {user_id}")
        
        # GraphQL query to fetch issues assigned to the user
        # Note: Removed date filter for now to test basic query
        query = """
        query($first: Int!) {
            viewer {
                assignedIssues(first: $first) {
                    nodes {
                        id
                        title
                        description
                        priority
                        url
                        state {
                            id
                            name
                            type
                        }
                        assignee {
                            id
                            name
                        }
                        team {
                            id
                            name
                        }
                        project {
                            id
                            name
                        }
                        createdAt
                        updatedAt
                        completedAt
                        canceledAt
                        dueDate
                        archivedAt
                        labels {
                            nodes {
                                id
                                name
                                color
                            }
                        }
                    }
                }
            }
        }
        """
        
        variables = {
            "first": max_results
        }
        
        headers = {
            "Authorization": access_token,
            "Content-Type": "application/json",
        }
        
        try:
            response = requests.post(
                self.graphql_url,
                json={"query": query, "variables": variables},
                headers=headers
            )

            # Log response for debugging
            logger.info(f"Linear API response status: {response.status_code}")
            if response.status_code != 200:
                logger.error(f"Linear API error response: {response.text}")

            response.raise_for_status()
            data = response.json()

            if "errors" in data:
                logger.error(f"Linear API errors: {data['errors']}")
                raise ValueError(f"Linear API error: {data['errors']}")
            
            issues = data["data"]["viewer"]["assignedIssues"]["nodes"]
            logger.info(f"Found {len(issues)} issues for user {user_id}")
            
            synced_issues = []
            
            for issue in issues:
                # Parse issue data
                issue_data = self._parse_issue(issue, user_id)
                
                # Check if issue already exists
                existing = self.supabase.table("linear_issues").select("id").eq(
                    "linear_id", issue_data["linear_id"]
                ).execute()
                
                if existing.data:
                    # Update existing issue
                    result = self.supabase.table("linear_issues").update(
                        issue_data
                    ).eq("id", existing.data[0]["id"]).execute()
                    logger.debug(f"Updated issue: {issue_data['title']}")
                else:
                    # Insert new issue
                    result = self.supabase.table("linear_issues").insert(
                        issue_data
                    ).execute()
                    logger.debug(f"Synced new issue: {issue_data['title']}")
                
                if result.data:
                    synced_issues.append(result.data[0])
            
            # Update last sync time
            self.supabase.table("integrations").update({
                "last_sync_at": datetime.now(timezone.utc).isoformat(timespec='microseconds')
            }).eq("user_id", user_id).eq("provider", "linear").execute()
            
            logger.info(f"Synced {len(synced_issues)} Linear issues for user {user_id}")
            
            return synced_issues
            
        except requests.exceptions.RequestException as error:
            logger.error(f"Linear API error: {error}")
            raise

    def _normalize_timestamp(self, timestamp: str) -> str:
        """
        Normalize Linear timestamp to ensure 6 digits of microseconds.
        Linear sometimes returns 5 digits which breaks Python's datetime parser.

        Args:
            timestamp: ISO format timestamp string

        Returns:
            Normalized timestamp string
        """
        if not timestamp:
            return None

        # Fix microseconds: Linear returns 5 digits, PostgreSQL expects 6
        # Example: 2025-10-30T17:08:31.81388+00:00 -> 2025-10-30T17:08:31.813880+00:00
        import re
        # Match timestamp with microseconds
        pattern = r'(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})\.(\d+)([\+\-]\d{2}:\d{2}|Z)'
        match = re.match(pattern, timestamp)

        if match:
            date_time = match.group(1)
            microseconds = match.group(2)
            timezone = match.group(3)

            # Pad microseconds to 6 digits
            microseconds = microseconds.ljust(6, '0')[:6]

            return f"{date_time}.{microseconds}{timezone}"

        # If no microseconds, return as-is
        return timestamp

    def _parse_issue(self, issue: Dict[str, Any], user_id: str) -> Dict[str, Any]:
        """
        Parse Linear issue into database format.

        Args:
            issue: Linear issue object
            user_id: User ID

        Returns:
            Issue data dict
        """
        state = issue.get("state", {})
        assignee = issue.get("assignee", {})
        team = issue.get("team", {})
        project = issue.get("project", {})
        labels = issue.get("labels", {}).get("nodes", [])

        return {
            "user_id": user_id,
            "linear_id": issue["id"],
            "linear_url": issue.get("url"),
            "title": issue["title"],
            "description": issue.get("description"),
            "priority": issue.get("priority"),
            "state_id": state.get("id"),
            "state_name": state.get("name"),
            "state_type": state.get("type"),
            "assignee_id": assignee.get("id"),
            "assignee_name": assignee.get("name"),
            "team_id": team.get("id"),
            "team_name": team.get("name"),
            "project_id": project.get("id") if project else None,
            "project_name": project.get("name") if project else None,
            "created_at_linear": self._normalize_timestamp(issue.get("createdAt")),
            "updated_at_linear": self._normalize_timestamp(issue.get("updatedAt")),
            "completed_at": self._normalize_timestamp(issue.get("completedAt")),
            "canceled_at": self._normalize_timestamp(issue.get("canceledAt")),
            "due_date": issue.get("dueDate"),
            "is_archived": issue.get("archivedAt") is not None,
            "labels": labels,
        }

    async def sync_projects(
        self,
        user_id: str,
        max_results: int = 50
    ) -> List[Dict[str, Any]]:
        """
        Sync projects from Linear for a user.

        Args:
            user_id: User ID
            max_results: Maximum number of projects to fetch

        Returns:
            List of synced project data
        """
        access_token = self._get_access_token(user_id)
        if not access_token:
            raise ValueError(f"No Linear access token found for user {user_id}")

        # GraphQL query to fetch projects
        # Note: Removed state filter for now - will fetch all projects
        query = """
        query($first: Int!) {
            projects(first: $first) {
                nodes {
                    id
                    name
                    description
                    url
                    state
                    startDate
                    targetDate
                    completedAt
                    canceledAt
                    progress
                    archivedAt
                    teams {
                        nodes {
                            id
                            name
                        }
                    }
                }
            }
        }
        """

        variables = {
            "first": max_results
        }

        headers = {
            "Authorization": access_token,
            "Content-Type": "application/json",
        }

        try:
            response = requests.post(
                self.graphql_url,
                json={"query": query, "variables": variables},
                headers=headers
            )

            # Log response for debugging
            logger.info(f"Linear API response status: {response.status_code}")
            if response.status_code != 200:
                logger.error(f"Linear API error response: {response.text}")

            response.raise_for_status()
            data = response.json()

            if "errors" in data:
                logger.error(f"Linear API errors: {data['errors']}")
                raise ValueError(f"Linear API error: {data['errors']}")

            projects = data["data"]["projects"]["nodes"]
            logger.info(f"Found {len(projects)} projects for user {user_id}")

            synced_projects = []

            for project in projects:
                # Parse project data
                project_data = self._parse_project(project, user_id)

                # Check if project already exists
                existing = self.supabase.table("linear_projects").select("id").eq(
                    "linear_id", project_data["linear_id"]
                ).execute()

                if existing.data:
                    # Update existing project
                    result = self.supabase.table("linear_projects").update(
                        project_data
                    ).eq("id", existing.data[0]["id"]).execute()
                    logger.debug(f"Updated project: {project_data['name']}")
                else:
                    # Insert new project
                    result = self.supabase.table("linear_projects").insert(
                        project_data
                    ).execute()
                    logger.debug(f"Synced new project: {project_data['name']}")

                if result.data:
                    synced_projects.append(result.data[0])

            logger.info(f"Synced {len(synced_projects)} Linear projects for user {user_id}")

            return synced_projects

        except requests.exceptions.RequestException as error:
            logger.error(f"Linear API error: {error}")
            raise

    def _parse_project(self, project: Dict[str, Any], user_id: str) -> Dict[str, Any]:
        """
        Parse Linear project into database format.

        Args:
            project: Linear project object
            user_id: User ID

        Returns:
            Project data dict
        """
        teams = project.get("teams", {}).get("nodes", [])
        team = teams[0] if teams else {}

        return {
            "user_id": user_id,
            "linear_id": project["id"],
            "linear_url": project.get("url"),
            "name": project["name"],
            "description": project.get("description"),
            "state": project.get("state"),
            "team_id": team.get("id"),
            "team_name": team.get("name"),
            "start_date": project.get("startDate"),
            "target_date": project.get("targetDate"),
            "completed_at": self._normalize_timestamp(project.get("completedAt")),
            "canceled_at": self._normalize_timestamp(project.get("canceledAt")),
            "progress": project.get("progress"),
            "is_archived": project.get("archivedAt") is not None,
        }

