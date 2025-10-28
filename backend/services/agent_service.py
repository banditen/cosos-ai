"""Agent service for analyzing emails/calendar and generating daily briefs."""

import logging
import json
from datetime import datetime, date, timedelta, timezone
from typing import Dict, Any, List, Optional
from openai import OpenAI

from config import settings
from database.client import get_supabase_client
from services.embedding_service import EmbeddingService

logger = logging.getLogger(__name__)


class AgentService:
    """AI agent for generating personalized daily briefs."""
    
    def __init__(self):
        self.client = OpenAI(api_key=settings.OPENAI_API_KEY)
        self.supabase = get_supabase_client()
        self.embedding_service = EmbeddingService()
    
    async def generate_daily_brief(
        self,
        user_id: str,
        brief_date: Optional[date] = None
    ) -> Dict[str, Any]:
        """
        Generate a daily brief for the user.
        
        This is the main agent loop that:
        1. Retrieves user context
        2. Fetches recent emails and calendar events
        3. Analyzes them using GPT-4o-mini
        4. Generates a structured brief
        5. Saves to database
        
        Args:
            user_id: User ID
            brief_date: Date for the brief (defaults to today)
            
        Returns:
            Generated brief data
        """
        if brief_date is None:
            brief_date = date.today()
        
        logger.info(f"Generating brief for user {user_id} on {brief_date}")
        
        # Step 1: Get user context
        context = await self._get_user_context(user_id)
        if not context:
            raise ValueError("User context not found. Please complete onboarding first.")

        # Step 2: Get active projects and initiatives
        projects = await self._get_active_projects(user_id)
        initiatives = await self._get_active_initiatives(user_id)

        # Step 3: Get today's emails (unread or from last 24 hours)
        emails = await self._get_recent_emails(user_id, days_back=1)

        # Step 4: Get today's calendar events
        events = await self._get_todays_events(user_id, brief_date)

        # Step 5: Analyze with GPT-4o-mini
        analysis = await self._analyze_with_ai(context, projects, initiatives, emails, events, brief_date)
        
        # Step 5: Format the brief
        brief_text, brief_html = self._format_brief(analysis, brief_date)
        
        # Step 6: Save to database
        brief_data = {
            "user_id": user_id,
            "brief_date": brief_date.isoformat(),
            "top_priorities": [p.dict() for p in analysis["priorities"]],
            "time_blocks": [tb.dict() for tb in analysis["time_blocks"]],
            "quick_wins": [qw.dict() for qw in analysis["quick_wins"]],
            "flags": [f.dict() for f in analysis["flags"]],
            "brief_text": brief_text,
            "brief_html": brief_html,
            "agent_reasoning": analysis.get("reasoning", {}),
        }
        
        # Upsert (update if exists for this date, insert if not)
        existing = self.supabase.table("daily_briefs").select("id").eq(
            "user_id", user_id
        ).eq("brief_date", brief_date.isoformat()).execute()
        
        if existing.data:
            result = self.supabase.table("daily_briefs").update(brief_data).eq(
                "user_id", user_id
            ).eq("brief_date", brief_date.isoformat()).execute()
        else:
            result = self.supabase.table("daily_briefs").insert(brief_data).execute()
        
        logger.info(f"Brief generated and saved for {user_id}")
        
        return result.data[0]
    
    async def _get_user_context(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve user context from database."""
        result = self.supabase.table("user_context").select("*").eq("user_id", user_id).execute()
        return result.data[0] if result.data else None

    async def _get_active_projects(self, user_id: str) -> List[Dict[str, Any]]:
        """Retrieve active projects for the user."""
        result = self.supabase.table("projects").select("*").eq(
            "user_id", user_id
        ).eq("status", "active").execute()
        return result.data if result.data else []

    async def _get_active_initiatives(self, user_id: str) -> List[Dict[str, Any]]:
        """Retrieve active initiatives for the user."""
        result = self.supabase.table("initiatives").select("*").eq(
            "user_id", user_id
        ).eq("status", "active").execute()
        return result.data if result.data else []
    
    async def _get_recent_emails(self, user_id: str, days_back: int = 1) -> List[Dict[str, Any]]:
        """Get recent emails for analysis."""
        cutoff = datetime.now(timezone.utc) - timedelta(days=days_back)
        
        result = self.supabase.table("emails").select(
            "id, subject, from_email, from_name, body_text, received_at, is_read, labels"
        ).eq("user_id", user_id).gte(
            "received_at", cutoff.isoformat()
        ).order("received_at", desc=True).limit(50).execute()
        
        return result.data or []
    
    async def _get_todays_events(self, user_id: str, target_date: date) -> List[Dict[str, Any]]:
        """Get calendar events for the target date."""
        start_of_day = datetime.combine(target_date, datetime.min.time()).replace(tzinfo=timezone.utc)
        end_of_day = datetime.combine(target_date, datetime.max.time()).replace(tzinfo=timezone.utc)
        
        result = self.supabase.table("calendar_events").select(
            "id, title, description, start_time, end_time, attendees, location"
        ).eq("user_id", user_id).gte(
            "start_time", start_of_day.isoformat()
        ).lte(
            "start_time", end_of_day.isoformat()
        ).order("start_time").execute()
        
        return result.data or []
    
    async def _analyze_with_ai(
        self,
        context: Dict[str, Any],
        projects: List[Dict[str, Any]],
        initiatives: List[Dict[str, Any]],
        emails: List[Dict[str, Any]],
        events: List[Dict[str, Any]],
        brief_date: date
    ) -> Dict[str, Any]:
        """
        Use GPT-4o-mini to analyze emails and calendar.

        Returns structured analysis with priorities, time blocks, quick wins, and flags.
        """
        # Build the prompt
        prompt = self._build_analysis_prompt(context, projects, initiatives, emails, events, brief_date)
        
        # Call GPT-4o-mini with structured output
        response = self.client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": "You are an AI Chief of Staff for a busy founder. Your job is to analyze their emails and calendar, then generate a concise daily brief with actionable priorities, time blocks, quick wins, and urgent flags. Be specific, practical, and focused on high-impact work."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            response_format={"type": "json_object"},
            temperature=0.7,
        )
        
        # Parse the response
        analysis_json = json.loads(response.choices[0].message.content)

        # Debug logging
        logger.info(f"AI Response: {json.dumps(analysis_json, indent=2)}")
        logger.info(f"Time blocks in response: {len(analysis_json.get('time_blocks', []))}")

        # Convert to Pydantic models
        from models.brief import Priority, TimeBlock, QuickWin, Flag

        priorities = [Priority(**p) for p in analysis_json.get("priorities", [])]
        time_blocks = [TimeBlock(**tb) for tb in analysis_json.get("time_blocks", [])]
        quick_wins = [QuickWin(**qw) for qw in analysis_json.get("quick_wins", [])]
        flags = [Flag(**f) for f in analysis_json.get("flags", [])]

        logger.info(f"Parsed time blocks: {len(time_blocks)}")

        return {
            "priorities": priorities,
            "time_blocks": time_blocks,
            "quick_wins": quick_wins,
            "flags": flags,
            "reasoning": analysis_json.get("reasoning", {})
        }
    
    def _build_analysis_prompt(
        self,
        context: Dict[str, Any],
        projects: List[Dict[str, Any]],
        initiatives: List[Dict[str, Any]],
        emails: List[Dict[str, Any]],
        events: List[Dict[str, Any]],
        brief_date: date
    ) -> str:
        """Build the prompt for GPT-4o-mini analysis."""

        # Format context
        context_str = f"""
**Business Context:**
- Mission: {context.get('business_mission', 'N/A')}
- Stage: {context.get('business_stage', 'N/A')}
- Goals: {', '.join(context.get('quarterly_goals', []))}
- Challenges: {', '.join(context.get('current_challenges', []))}
- Success Criteria: {context.get('success_criteria', 'N/A')}
"""

        # Format projects
        projects_str = "\n".join([
            f"- **{p.get('name')}** (Deadline: {p.get('deadline', 'No deadline')})\n  Goal: {p.get('goal', 'N/A')}\n  Status: {p.get('status', 'active')}"
            for p in projects
        ])

        # Format initiatives
        initiatives_str = "\n".join([
            f"- **{i.get('name')}** (Target: {i.get('target_date', 'No target')})\n  Success Criteria: {i.get('success_criteria', 'N/A')}"
            for i in initiatives
        ])
        
        # Format emails
        emails_str = "\n".join([
            f"- [{e.get('received_at', 'N/A')}] From: {e.get('from_name', 'Unknown')} <{e.get('from_email', '')}>\n  Subject: {e.get('subject', 'No subject')}\n  Preview: {(e.get('body_text', '') or '')[:200]}..."
            for e in emails[:20]  # Limit to 20 most recent
        ])
        
        # Format calendar
        events_str = "\n".join([
            f"- {e.get('start_time', 'N/A')} - {e.get('end_time', 'N/A')}: {e.get('title', 'Untitled')}\n  Attendees: {len(e.get('attendees', []))} people"
            for e in events
        ])
        
        prompt = f"""
Today is {brief_date.strftime('%A, %B %d, %Y')}.

{context_str}

**Active Projects ({len(projects)} total):**
{projects_str if projects else "No active projects"}

**Active Initiatives ({len(initiatives)} total):**
{initiatives_str if initiatives else "No active initiatives"}

**Recent Emails ({len(emails)} total):**
{emails_str if emails else "No recent emails"}

**Today's Calendar ({len(events)} events):**
{events_str if events else "No events scheduled"}

**Your Task:**
Analyze the above and generate a daily brief in JSON format with:

**IMPORTANT:** When generating priorities, ALWAYS link them to specific projects or initiatives. Explain how each task moves a project forward or contributes to an initiative's success criteria. Reference deadlines and urgency.

1. **priorities** (array, max 3): Top things to focus on today
   - task (string): Clear, actionable task
   - reasoning (string): Why this matters based on business context
   - estimated_time (number): Minutes needed
   - source (string): "email", "calendar", or "context"
   - source_id (string, optional): Reference ID

2. **time_blocks** (array): Suggested focus time blocks
   - start_time (string): HH:MM format
   - end_time (string): HH:MM format
   - purpose (string): What to work on
   - reasoning (string): Why this time block

3. **quick_wins** (array): Tasks under 15 minutes
   - task (string): Quick actionable task
   - estimated_time (number): Minutes
   - source (string): Where this came from

4. **flags** (array): Urgent items needing immediate attention
   - type (string): "urgent_email", "calendar_conflict", "missing_context"
   - title (string): Brief title
   - description (string): What's the issue
   - action_required (string): What to do
   - source_id (string, optional): Reference ID

5. **reasoning** (object): Your thought process
   - key_insights (array of strings): What you noticed
   - assumptions (array of strings): What you assumed

Return ONLY valid JSON. Be specific and actionable. Focus on high-impact work aligned with their goals.
"""
        
        return prompt
    
    def _format_brief(self, analysis: Dict[str, Any], brief_date: date) -> tuple[str, str]:
        """Format the brief as plain text and HTML."""
        
        # Plain text version
        text_parts = [
            f"📋 Daily Brief for {brief_date.strftime('%A, %B %d, %Y')}",
            "=" * 60,
            "",
            "🎯 TOP PRIORITIES",
            "-" * 60,
        ]
        
        for i, p in enumerate(analysis["priorities"], 1):
            text_parts.append(f"{i}. {p.task} ({p.estimated_time} min)")
            text_parts.append(f"   Why: {p.reasoning}")
            text_parts.append("")
        
        text_parts.extend([
            "⏰ SUGGESTED TIME BLOCKS",
            "-" * 60,
        ])
        
        for tb in analysis["time_blocks"]:
            text_parts.append(f"{tb.start_time} - {tb.end_time}: {tb.purpose}")
            text_parts.append(f"   {tb.reasoning}")
            text_parts.append("")
        
        if analysis["quick_wins"]:
            text_parts.extend([
                "⚡ QUICK WINS (< 15 min)",
                "-" * 60,
            ])
            for qw in analysis["quick_wins"]:
                text_parts.append(f"• {qw.task} ({qw.estimated_time} min)")
        
        if analysis["flags"]:
            text_parts.extend([
                "",
                "🚩 FLAGS - NEEDS ATTENTION",
                "-" * 60,
            ])
            for flag in analysis["flags"]:
                text_parts.append(f"⚠️  {flag.title}")
                text_parts.append(f"   {flag.description}")
                text_parts.append(f"   Action: {flag.action_required}")
                text_parts.append("")
        
        brief_text = "\n".join(text_parts)
        
        # HTML version (simple for now)
        brief_html = f"<pre>{brief_text}</pre>"
        
        return brief_text, brief_html

