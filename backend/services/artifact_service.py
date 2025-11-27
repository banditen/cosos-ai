"""Artifact generation service - creates artifacts from user prompts."""

import logging
import json
from datetime import datetime, date
from typing import Dict, Any, Optional
from openai import OpenAI
from uuid import UUID

from config import settings
from database.client import get_supabase_client
from models.artifact import ArtifactType, ArtifactCreate, Artifact

logger = logging.getLogger(__name__)


class ArtifactService:
    """Service for generating artifacts from user prompts."""
    
    def __init__(self):
        self.client = OpenAI(api_key=settings.OPENAI_API_KEY)
        self.supabase = get_supabase_client()
    
    async def generate_artifact(
        self,
        user_id: str,
        artifact_create: ArtifactCreate
    ) -> Artifact:
        """
        Generate an artifact from a user prompt.
        
        Args:
            user_id: User ID
            artifact_create: Artifact creation data (prompt + context)
            
        Returns:
            Generated artifact
        """
        logger.info(f"Generating artifact for user {user_id} from prompt: {artifact_create.prompt[:100]}...")
        
        # Step 1: Classify the prompt to determine artifact type
        artifact_type = await self._classify_prompt(artifact_create.prompt)
        
        # Step 2: Generate the artifact content based on type
        content = await self._generate_content(
            artifact_type=artifact_type,
            prompt=artifact_create.prompt,
            context=artifact_create.context
        )
        
        # Step 3: Extract title and description
        title = content.get("title", "Untitled Artifact")
        description = content.get("description")
        
        # Step 4: Save to database
        artifact_data = {
            "user_id": user_id,
            "type": artifact_type.value,
            "title": title,
            "description": description,
            "prompt": artifact_create.prompt,
            "context": artifact_create.context.dict() if artifact_create.context else None,
            "content": content,
            "metadata": {
                "integrations_required": content.get("integrations_required", []),
                "generated_at": datetime.utcnow().isoformat()
            },
            "integrations_connected": [],
            "status": "active"
        }
        
        result = self.supabase.table("artifacts").insert(artifact_data).execute()
        
        if not result.data:
            raise ValueError("Failed to save artifact to database")
        
        # Step 5: Log the prompt
        await self._log_prompt(
            user_id=user_id,
            prompt=artifact_create.prompt,
            artifact_id=result.data[0]["id"],
            artifact_type=artifact_type.value,
            context=artifact_create.context
        )
        
        logger.info(f"Successfully generated {artifact_type.value} artifact: {title}")
        
        return Artifact(**result.data[0])
    
    async def _classify_prompt(self, prompt: str) -> ArtifactType:
        """
        Classify the user's prompt to determine what type of artifact to generate.
        
        Args:
            prompt: User's natural language prompt
            
        Returns:
            Artifact type
        """
        classification_prompt = f"""
        Classify this user prompt into one of these artifact types:
        
        - mrr_tracker: User wants to track MRR/revenue growth (keywords: MRR, revenue, growth, $, track)
        - retention_analysis: User wants to analyze retention/churn (keywords: retention, churn, users leaving)
        - board_prep: User needs to prepare for a board meeting (keywords: board, meeting, deck, presentation)
        - activation_monitor: User wants to track activation/onboarding (keywords: activation, onboarding, signup)
        - product_velocity: User wants to track product/engineering velocity (keywords: velocity, shipping, engineering)
        - customer_feedback: User wants to analyze customer feedback (keywords: feedback, customer, support)
        - operating_system: User wants a complete operating system (keywords: operating system, decision system, blueprint)
        - custom: None of the above
        
        User prompt: "{prompt}"
        
        Respond with ONLY the artifact type (e.g., "mrr_tracker"). No explanation.
        """
        
        response = self.client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a classifier. Respond with only the artifact type."},
                {"role": "user", "content": classification_prompt}
            ],
            temperature=0.0,
            max_tokens=20
        )
        
        artifact_type_str = response.choices[0].message.content.strip().lower()
        
        # Map to enum
        type_mapping = {
            "mrr_tracker": ArtifactType.MRR_TRACKER,
            "retention_analysis": ArtifactType.RETENTION_ANALYSIS,
            "board_prep": ArtifactType.BOARD_PREP,
            "activation_monitor": ArtifactType.ACTIVATION_MONITOR,
            "product_velocity": ArtifactType.PRODUCT_VELOCITY,
            "customer_feedback": ArtifactType.CUSTOMER_FEEDBACK,
            "operating_system": ArtifactType.OPERATING_SYSTEM,
        }
        
        return type_mapping.get(artifact_type_str, ArtifactType.CUSTOM)

    async def _generate_content(
        self,
        artifact_type: ArtifactType,
        prompt: str,
        context: Optional[Any]
    ) -> Dict[str, Any]:
        """
        Generate artifact content based on type.

        Args:
            artifact_type: Type of artifact to generate
            prompt: User's prompt
            context: User context from onboarding

        Returns:
            Structured artifact content
        """
        # Route to appropriate template
        if artifact_type == ArtifactType.MRR_TRACKER:
            return await self._generate_mrr_tracker(prompt, context)
        elif artifact_type == ArtifactType.RETENTION_ANALYSIS:
            return await self._generate_retention_analysis(prompt, context)
        elif artifact_type == ArtifactType.BOARD_PREP:
            return await self._generate_board_prep(prompt, context)
        else:
            return await self._generate_custom(prompt, context)

    async def _generate_mrr_tracker(
        self,
        prompt: str,
        context: Optional[Any]
    ) -> Dict[str, Any]:
        """
        Generate an MRR Growth Tracker artifact.

        This creates a structured tracker with:
        - Current state (estimated)
        - Target (from prompt)
        - The path (monthly milestones)
        - Reality check
        - Monitoring plan
        - Alert rules
        - Next actions
        """
        # Build context string
        context_str = ""
        if context:
            context_str = f"""
            User context:
            - Stage: {context.stage if hasattr(context, 'stage') else 'unknown'}
            - Goal: {context.goal if hasattr(context, 'goal') else 'unknown'}
            - Challenge: {context.challenge if hasattr(context, 'challenge') else 'none provided'}
            """

        system_prompt = """
        You are COSOS, an AI operating partner for founders. Generate a detailed MRR Growth Tracker.

        Your output must be a JSON object with this EXACT structure:
        {
            "title": "Track our path to $X MRR",
            "description": "Brief description of what this tracker monitors",
            "current_state": {
                "estimated_mrr": 0,
                "reasoning": "Why you estimated this based on stage/context"
            },
            "target": {
                "amount": 100000,
                "timeframe": "by end of year",
                "date": "2025-12-31"
            },
            "the_path": {
                "monthly_milestones": [
                    {"month": "Dec 2025", "target_mrr": 10000, "growth_needed": "10k", "is_achievable": true},
                    {"month": "Jan 2026", "target_mrr": 20000, "growth_needed": "10k", "is_achievable": true}
                ],
                "required_monthly_growth_rate": "15%",
                "required_new_customers_per_month": 50
            },
            "reality_check": {
                "is_achievable": true,
                "confidence_level": "medium",
                "key_assumptions": ["assumption 1", "assumption 2"],
                "biggest_risks": ["risk 1", "risk 2"]
            },
            "monitoring_plan": {
                "metrics_to_track": ["New MRR", "Churn", "Expansion"],
                "check_frequency": "weekly",
                "data_sources": ["Stripe", "manual input"]
            },
            "alert_rules": [
                {"condition": "MRR growth < 10% for 2 consecutive months", "action": "Alert founder"},
                {"condition": "Churn rate > 5%", "action": "Deep dive into retention"}
            ],
            "next_actions": [
                {"action": "Connect Stripe to get real MRR data", "priority": "high"},
                {"action": "Set up weekly MRR review", "priority": "medium"}
            ],
            "integrations_required": ["stripe"]
        }

        Be specific with numbers. Make realistic estimates based on the user's stage.
        If they're pre-launch, estimate $0 MRR. If early revenue, estimate $1k-10k.
        """

        user_message = f"""
        User prompt: "{prompt}"
        {context_str}

        Generate the MRR Growth Tracker JSON.
        """

        response = self.client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ],
            temperature=0.7,
            response_format={"type": "json_object"}
        )

        content = json.loads(response.choices[0].message.content)
        return content

    async def _generate_retention_analysis(
        self,
        prompt: str,
        context: Optional[Any]
    ) -> Dict[str, Any]:
        """Generate a Retention Analysis artifact."""
        # Similar structure to MRR tracker but focused on retention
        return {
            "title": "Retention Analysis System",
            "description": "Track and improve user retention",
            "integrations_required": ["posthog", "stripe"],
            "note": "Full implementation coming soon - this is a placeholder"
        }

    async def _generate_board_prep(
        self,
        prompt: str,
        context: Optional[Any]
    ) -> Dict[str, Any]:
        """Generate a Board Meeting Prep package."""
        return {
            "title": "Board Meeting Prep Package",
            "description": "Everything you need for your board meeting",
            "integrations_required": ["stripe", "linear"],
            "note": "Full implementation coming soon - this is a placeholder"
        }

    async def _generate_custom(
        self,
        prompt: str,
        context: Optional[Any]
    ) -> Dict[str, Any]:
        """
        Generate a custom component-based artifact from user prompt.

        This uses the new component system with:
        - MetricCard: Display KPIs and metrics
        - DataList: Show lists of items
        - ProgressBar: Visual progress indicators
        - InputForm: Forms to add new data
        - TextBlock: Instructions and context
        """
        # Build context string
        context_str = ""
        if context:
            context_str = f"""
            User context:
            - Stage: {context.stage if hasattr(context, 'stage') else 'unknown'}
            - Goal: {context.goal if hasattr(context, 'goal') else 'unknown'}
            - Challenge: {context.challenge if hasattr(context, 'challenge') else 'none provided'}
            """

        system_prompt = """
        You are Cosos, an AI operating partner for startup founders. Generate a custom artifact using a component-based system.

        Available components:
        1. MetricCard - Display a single metric/KPI with optional target and progress
        2. DataList - Display a table of items with specified fields
        3. ProgressBar - Show progress toward a goal
        4. InputForm - Form to add new data items
        5. TextBlock - Display text/instructions (variants: default, info, warning, success)

        Your output must be a JSON object with this EXACT structure:
        {
          "title": "Artifact Title",
          "description": "Brief description of what this artifact does",
          "components": [
            {
              "id": "unique_id_1",
              "type": "MetricCard",
              "config": {
                "title": "Metric Name",
                "value": 0,
                "target": 100,
                "unit": "units",
                "icon": "TrendingUp",
                "description": "Optional description"
              }
            },
            {
              "id": "unique_id_2",
              "type": "DataList",
              "config": {
                "title": "List Title",
                "items": [],
                "fields": ["field1", "field2", "field3"],
                "dataKey": "items_collection_name",
                "emptyMessage": "No items yet"
              }
            },
            {
              "id": "unique_id_3",
              "type": "InputForm",
              "config": {
                "title": "Add New Item",
                "dataKey": "items_collection_name",
                "fields": [
                  {
                    "name": "field1",
                    "label": "Field 1",
                    "type": "text",
                    "required": true,
                    "placeholder": "Enter value"
                  }
                ],
                "submitLabel": "Add Item"
              }
            }
          ],
          "data": {}
        }

        Important rules:
        - Use Lucide icon names for MetricCard icons (e.g., "TrendingUp", "Target", "Users", "DollarSign")
        - DataList and InputForm should share the same "dataKey" to connect them
        - InputForm fields should match DataList fields
        - Field types: "text", "number", "date", "textarea", "select"
        - Keep it simple and focused on the user's specific need
        - Start with empty data: {}
        - Use 2-5 components maximum for clarity
        """

        user_prompt = f"""
        User prompt: "{prompt}"
        {context_str}

        Generate a component-based artifact that solves this user's need.
        Return ONLY valid JSON, no markdown formatting.
        """

        response = self.client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.7,
            max_tokens=2000
        )

        content_str = response.choices[0].message.content.strip()

        # Remove markdown code blocks if present
        if content_str.startswith("```"):
            content_str = content_str.split("```")[1]
            if content_str.startswith("json"):
                content_str = content_str[4:]
            content_str = content_str.strip()

        try:
            content = json.loads(content_str)
            return content
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse LLM response as JSON: {e}")
            logger.error(f"Response was: {content_str}")
            # Return a fallback structure
            return {
                "title": "Custom Artifact",
                "description": f"Generated from: {prompt[:100]}",
                "components": [
                    {
                        "id": "text_1",
                        "type": "TextBlock",
                        "config": {
                            "text": f"Artifact generation in progress. Prompt: {prompt}",
                            "variant": "info"
                        }
                    }
                ],
                "data": {}
            }

    async def _log_prompt(
        self,
        user_id: str,
        prompt: str,
        artifact_id: str,
        artifact_type: str,
        context: Optional[Any]
    ) -> None:
        """Log the user's prompt for analytics and learning."""
        prompt_data = {
            "user_id": user_id,
            "prompt": prompt,
            "artifact_id": artifact_id,
            "artifact_type": artifact_type,
            "context": context.dict() if context else None,
            "was_successful": True
        }

        self.supabase.table("prompts").insert(prompt_data).execute()

    async def get_artifact(self, artifact_id: str, user_id: str) -> Optional[Artifact]:
        """Get an artifact by ID."""
        result = self.supabase.table("artifacts")\
            .select("*")\
            .eq("id", artifact_id)\
            .eq("user_id", user_id)\
            .execute()

        if not result.data:
            return None

        return Artifact(**result.data[0])

    async def list_artifacts(
        self,
        user_id: str,
        limit: int = 50,
        offset: int = 0
    ) -> list[Artifact]:
        """List all artifacts for a user."""
        result = self.supabase.table("artifacts")\
            .select("*")\
            .eq("user_id", user_id)\
            .eq("status", "active")\
            .order("created_at", desc=True)\
            .limit(limit)\
            .offset(offset)\
            .execute()

        return [Artifact(**item) for item in result.data]

    async def update_artifact(
        self,
        artifact_id: str,
        user_id: str,
        updates: Dict[str, Any]
    ) -> Artifact:
        """Update an artifact."""
        result = self.supabase.table("artifacts")\
            .update(updates)\
            .eq("id", artifact_id)\
            .eq("user_id", user_id)\
            .execute()

        if not result.data:
            raise ValueError("Artifact not found or update failed")

        return Artifact(**result.data[0])

    async def update_artifact_data(
        self,
        artifact_id: str,
        data: Dict[str, Any]
    ) -> Artifact:
        """
        Update artifact data (user-entered content).

        This merges the provided data into the artifact's content.data field.

        Args:
            artifact_id: Artifact ID
            data: Data to merge into artifact.content.data

        Returns:
            Updated artifact
        """
        # First, get the current artifact
        result = self.supabase.table("artifacts")\
            .select("*")\
            .eq("id", artifact_id)\
            .execute()

        if not result.data:
            raise ValueError("Artifact not found")

        artifact = result.data[0]
        content = artifact.get("content", {})

        # Merge new data into existing data
        content["data"] = data

        # Update the artifact
        update_result = self.supabase.table("artifacts")\
            .update({"content": content})\
            .eq("id", artifact_id)\
            .execute()

        if not update_result.data:
            raise ValueError("Failed to update artifact data")

        return Artifact(**update_result.data[0])

    async def delete_artifact(
        self,
        artifact_id: str,
        user_id: str
    ) -> None:
        """
        Delete an artifact.

        Args:
            artifact_id: Artifact ID
            user_id: User ID (for authorization)

        Raises:
            ValueError: If artifact not found or user doesn't have permission
        """
        # Verify the artifact exists and belongs to the user
        result = self.supabase.table("artifacts")\
            .select("id, user_id")\
            .eq("id", artifact_id)\
            .eq("user_id", user_id)\
            .execute()

        if not result.data:
            raise ValueError("Artifact not found or you don't have permission to delete it")

        # Delete the artifact
        delete_result = self.supabase.table("artifacts")\
            .delete()\
            .eq("id", artifact_id)\
            .execute()

        if not delete_result.data:
            raise ValueError("Failed to delete artifact")

    async def edit_artifact_with_ai(
        self,
        artifact_id: str,
        user_id: str,
        user_message: str,
        conversation_history: list[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        """
        Edit an artifact using AI based on user's message.

        Args:
            artifact_id: Artifact ID
            user_id: User ID (for authorization)
            user_message: User's message describing what to change
            conversation_history: Previous messages in the conversation

        Returns:
            Dict with assistant_message and updated artifact
        """
        # Get the current artifact
        result = self.supabase.table("artifacts")\
            .select("*")\
            .eq("id", artifact_id)\
            .eq("user_id", user_id)\
            .execute()

        if not result.data:
            raise ValueError("Artifact not found or you don't have permission to edit it")

        artifact = result.data[0]

        # Build conversation context
        messages = [
            {
                "role": "system",
                "content": f"""You are COSOS, an AI operating partner helping a founder edit their artifact.

Current artifact:
- Title: {artifact['title']}
- Type: {artifact['type']}
- Description: {artifact.get('description', 'No description')}
- Content: {json.dumps(artifact.get('content', {}), indent=2)}

Your task:
1. Understand what the user wants to change
2. Modify the artifact content accordingly
3. Return BOTH:
   - A friendly message explaining what you changed
   - The updated artifact content as JSON

Response format:
{{
  "message": "I've updated your artifact to...",
  "updated_content": {{ ... the full updated content object ... }}
}}

Be conversational and helpful. If the request is unclear, ask for clarification.
"""
            }
        ]

        # Add conversation history if provided
        if conversation_history:
            messages.extend(conversation_history)

        # Add current user message
        messages.append({
            "role": "user",
            "content": user_message
        })

        # Call OpenAI
        response = self.client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            temperature=0.7,
            response_format={"type": "json_object"}
        )

        result_json = json.loads(response.choices[0].message.content)

        # Update the artifact if content was changed
        if "updated_content" in result_json:
            update_result = self.supabase.table("artifacts")\
                .update({"content": result_json["updated_content"]})\
                .eq("id", artifact_id)\
                .execute()

            if not update_result.data:
                raise ValueError("Failed to update artifact")

            artifact = update_result.data[0]

        return {
            "assistant_message": result_json.get("message", "I've updated your artifact."),
            "artifact": Artifact(**artifact)
        }

