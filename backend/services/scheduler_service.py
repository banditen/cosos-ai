"""
Scheduler service for automated background jobs.

This service handles:
1. 30-minute sync loop (Gmail + Calendar)
2. Daily brief generation (7am)
3. Embedding generation (background)
4. Retry logic for failed jobs
"""

import logging
import asyncio
from datetime import datetime, time, timezone
from typing import Optional, Dict, Any, List
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger
from apscheduler.events import EVENT_JOB_EXECUTED, EVENT_JOB_ERROR

from config import settings
from database.client import get_supabase_client
from services.gmail_service import GmailService
from services.calendar_service import CalendarService
from services.linear_service import LinearService
from services.agent_service import AgentService
from services.embedding_service import EmbeddingService

logger = logging.getLogger(__name__)


class SchedulerService:
    """Background job scheduler for automated sync and brief generation."""
    
    def __init__(self):
        """Initialize the scheduler."""
        self.scheduler = AsyncIOScheduler(timezone="UTC")
        self.supabase = get_supabase_client()
        self.gmail_service = GmailService()
        self.calendar_service = CalendarService()
        self.linear_service = LinearService()
        self.agent_service = AgentService()
        self.embedding_service = EmbeddingService()
        
        # Job execution tracking
        self.job_stats: Dict[str, Dict[str, Any]] = {}
        
        # Add event listeners
        self.scheduler.add_listener(
            self._job_executed_listener,
            EVENT_JOB_EXECUTED | EVENT_JOB_ERROR
        )
    
    def start(self):
        """Start the scheduler and register all jobs."""
        logger.info("🚀 Starting scheduler service...")
        
        # Register jobs
        self._register_sync_jobs()
        self._register_brief_jobs()
        
        # Start scheduler
        self.scheduler.start()
        logger.info("✅ Scheduler started successfully")
        logger.info(f"📋 Registered jobs: {len(self.scheduler.get_jobs())}")
    
    def shutdown(self):
        """Shutdown the scheduler gracefully."""
        logger.info("🛑 Shutting down scheduler...")
        self.scheduler.shutdown(wait=True)
        logger.info("✅ Scheduler shutdown complete")
    
    def _register_sync_jobs(self):
        """Register sync jobs (every 30 minutes)."""
        # Gmail + Calendar + Linear sync every 30 minutes
        self.scheduler.add_job(
            self._sync_all_users,
            trigger=IntervalTrigger(minutes=30),
            id="sync_all_users",
            name="Sync Gmail + Calendar + Linear for all users",
            replace_existing=True,
            max_instances=1,  # Prevent overlapping runs
            misfire_grace_time=300  # 5 minutes grace period
        )
        logger.info("✅ Registered sync job (every 30 minutes)")
    
    def _register_brief_jobs(self):
        """Register daily brief generation jobs."""
        # Daily brief generation at 7am UTC (default)
        # In production, this should be per-user based on their timezone
        self.scheduler.add_job(
            self._generate_briefs_for_all_users,
            trigger=CronTrigger(hour=7, minute=0),
            id="generate_daily_briefs",
            name="Generate daily briefs for all users",
            replace_existing=True,
            max_instances=1,
            misfire_grace_time=3600  # 1 hour grace period
        )
        logger.info("✅ Registered daily brief job (7am UTC)")
    
    async def _sync_all_users(self):
        """
        Sync Gmail + Calendar + Linear for all active users.

        This job runs every 30 minutes and:
        1. Fetches all active users with integrations
        2. Syncs Gmail, Calendar, and Linear for each user
        3. Generates embeddings in background
        4. Handles errors gracefully (continues on failure)
        """
        logger.info("🔄 Starting sync for all users...")
        start_time = datetime.now(timezone.utc)
        
        try:
            # Get all active users with Gmail integration
            result = self.supabase.table("integrations").select(
                "user_id, provider"
            ).eq("is_active", True).eq("provider", "gmail").execute()
            
            users = result.data
            logger.info(f"Found {len(users)} users with active integrations")
            
            success_count = 0
            error_count = 0
            
            for user_data in users:
                user_id = user_data["user_id"]

                try:
                    # Sync Gmail
                    await self._sync_user_gmail(user_id)

                    # Sync Calendar
                    await self._sync_user_calendar(user_id)

                    # Sync Linear (if connected)
                    await self._sync_user_linear(user_id)

                    success_count += 1
                    logger.info(f"✅ Synced user {user_id}")

                except Exception as e:
                    error_count += 1
                    logger.error(f"❌ Error syncing user {user_id}: {e}")
                    # Continue to next user (don't fail entire job)
                    continue
            
            duration = (datetime.now(timezone.utc) - start_time).total_seconds()
            logger.info(
                f"✅ Sync complete: {success_count} succeeded, {error_count} failed "
                f"(took {duration:.2f}s)"
            )
            
            # Update job stats
            self.job_stats["sync_all_users"] = {
                "last_run": start_time.isoformat(),
                "duration_seconds": duration,
                "success_count": success_count,
                "error_count": error_count
            }
            
        except Exception as e:
            logger.error(f"❌ Fatal error in sync job: {e}")
            raise
    
    async def _sync_user_gmail(self, user_id: str, max_retries: int = 3):
        """
        Sync Gmail for a single user with retry logic.
        
        Args:
            user_id: User ID
            max_retries: Maximum number of retry attempts
        """
        for attempt in range(max_retries):
            try:
                synced_emails = await self.gmail_service.sync_emails(
                    user_id=user_id,
                    days_back=1,  # Only sync last 24 hours
                    max_results=100
                )
                
                # Generate embeddings in background (don't wait)
                if synced_emails:
                    asyncio.create_task(self._generate_embeddings_for_user(user_id))
                
                logger.debug(f"Synced {len(synced_emails)} emails for user {user_id}")
                return synced_emails
                
            except Exception as e:
                if attempt < max_retries - 1:
                    wait_time = 2 ** attempt  # Exponential backoff: 1s, 2s, 4s
                    logger.warning(
                        f"Gmail sync failed for user {user_id} (attempt {attempt + 1}/{max_retries}). "
                        f"Retrying in {wait_time}s... Error: {e}"
                    )
                    await asyncio.sleep(wait_time)
                else:
                    logger.error(f"Gmail sync failed for user {user_id} after {max_retries} attempts: {e}")
                    raise
    
    async def _sync_user_calendar(self, user_id: str, max_retries: int = 3):
        """
        Sync Calendar for a single user with retry logic.
        
        Args:
            user_id: User ID
            max_retries: Maximum number of retry attempts
        """
        for attempt in range(max_retries):
            try:
                synced_events = await self.calendar_service.sync_calendar(
                    user_id=user_id,
                    days_forward=7,  # Next 7 days
                    days_back=1  # Last 24 hours
                )
                
                logger.debug(f"Synced {len(synced_events)} events for user {user_id}")
                return synced_events
                
            except Exception as e:
                if attempt < max_retries - 1:
                    wait_time = 2 ** attempt  # Exponential backoff
                    logger.warning(
                        f"Calendar sync failed for user {user_id} (attempt {attempt + 1}/{max_retries}). "
                        f"Retrying in {wait_time}s... Error: {e}"
                    )
                    await asyncio.sleep(wait_time)
                else:
                    logger.error(f"Calendar sync failed for user {user_id} after {max_retries} attempts: {e}")
                    raise

    async def _sync_user_linear(self, user_id: str, max_retries: int = 3):
        """
        Sync Linear for a single user with retry logic.

        Args:
            user_id: User ID
            max_retries: Maximum number of retry attempts
        """
        # Check if user has Linear integration
        result = self.supabase.table("integrations").select("id").eq(
            "user_id", user_id
        ).eq("provider", "linear").eq("is_active", True).execute()

        if not result.data:
            # User doesn't have Linear connected, skip silently
            return []

        for attempt in range(max_retries):
            try:
                # Sync issues
                synced_issues = await self.linear_service.sync_issues(
                    user_id=user_id,
                    days_back=7,  # Last 7 days
                    max_results=100
                )

                # Sync projects
                synced_projects = await self.linear_service.sync_projects(
                    user_id=user_id,
                    max_results=50
                )

                logger.debug(
                    f"Synced {len(synced_issues)} issues and {len(synced_projects)} projects "
                    f"for user {user_id}"
                )
                return synced_issues + synced_projects

            except Exception as e:
                if attempt < max_retries - 1:
                    wait_time = 2 ** attempt  # Exponential backoff
                    logger.warning(
                        f"Linear sync failed for user {user_id} (attempt {attempt + 1}/{max_retries}). "
                        f"Retrying in {wait_time}s... Error: {e}"
                    )
                    await asyncio.sleep(wait_time)
                else:
                    logger.error(f"Linear sync failed for user {user_id} after {max_retries} attempts: {e}")
                    # Don't raise - Linear is optional, continue with other syncs
                    return []

    async def _generate_embeddings_for_user(self, user_id: str):
        """
        Generate embeddings for emails without embeddings.
        
        Args:
            user_id: User ID
        """
        try:
            # Get emails without embeddings
            result = self.supabase.table("emails").select("*").eq(
                "user_id", user_id
            ).is_("content_embedding", "null").execute()
            
            emails = result.data
            
            if not emails:
                return
            
            logger.info(f"Generating embeddings for {len(emails)} emails (user {user_id})")
            
            for email in emails:
                try:
                    # Generate embedding
                    embedding = self.embedding_service.embed_email(
                        subject=email.get('subject', ''),
                        body=email.get('body_text', ''),
                        from_email=email.get('from_email', '')
                    )
                    
                    # Update email with embedding
                    self.supabase.table("emails").update({
                        "content_embedding": embedding
                    }).eq("id", email["id"]).execute()
                    
                except Exception as e:
                    logger.error(f"Error generating embedding for email {email['id']}: {e}")
                    continue
            
            logger.info(f"✅ Generated embeddings for {len(emails)} emails (user {user_id})")
            
        except Exception as e:
            logger.error(f"Error in embedding generation for user {user_id}: {e}")
    
    async def _generate_briefs_for_all_users(self):
        """
        Generate daily briefs for all active users.
        
        This job runs daily at 7am UTC and:
        1. Fetches all active users
        2. Generates daily brief for each user
        3. Handles errors gracefully
        """
        logger.info("📋 Starting daily brief generation for all users...")
        start_time = datetime.now(timezone.utc)
        
        try:
            # Get all active users
            result = self.supabase.table("users").select("id").eq("is_active", True).execute()
            
            users = result.data
            logger.info(f"Found {len(users)} active users")
            
            success_count = 0
            error_count = 0
            
            for user_data in users:
                user_id = user_data["id"]
                
                try:
                    # Generate brief
                    brief = await self.agent_service.generate_daily_brief(user_id=user_id)
                    success_count += 1
                    logger.info(f"✅ Generated brief for user {user_id}")
                    
                except Exception as e:
                    error_count += 1
                    logger.error(f"❌ Error generating brief for user {user_id}: {e}")
                    continue
            
            duration = (datetime.now(timezone.utc) - start_time).total_seconds()
            logger.info(
                f"✅ Brief generation complete: {success_count} succeeded, {error_count} failed "
                f"(took {duration:.2f}s)"
            )
            
            # Update job stats
            self.job_stats["generate_daily_briefs"] = {
                "last_run": start_time.isoformat(),
                "duration_seconds": duration,
                "success_count": success_count,
                "error_count": error_count
            }
            
        except Exception as e:
            logger.error(f"❌ Fatal error in brief generation job: {e}")
            raise
    
    def _job_executed_listener(self, event):
        """
        Event listener for job execution.
        
        Logs job execution and errors.
        """
        if event.exception:
            logger.error(
                f"❌ Job {event.job_id} failed: {event.exception}",
                exc_info=event.exception
            )
        else:
            logger.info(f"✅ Job {event.job_id} executed successfully")
    
    def get_job_stats(self) -> Dict[str, Any]:
        """
        Get job execution statistics.
        
        Returns:
            Dictionary of job stats
        """
        return {
            "jobs": [
                {
                    "id": job.id,
                    "name": job.name,
                    "next_run": job.next_run_time.isoformat() if job.next_run_time else None,
                    "trigger": str(job.trigger)
                }
                for job in self.scheduler.get_jobs()
            ],
            "stats": self.job_stats
        }


# Global scheduler instance
_scheduler: Optional[SchedulerService] = None


def get_scheduler() -> SchedulerService:
    """
    Get the global scheduler instance.
    
    Returns:
        SchedulerService instance
    """
    global _scheduler
    if _scheduler is None:
        _scheduler = SchedulerService()
    return _scheduler

