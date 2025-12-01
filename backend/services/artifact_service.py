"""Artifact generation service - creates artifacts from user prompts.

This service implements a two-phase artifact creation process:
1. Product Spec Phase: Generate a markdown Product Specification document
2. UI Phase: Generate visual components from the Product Spec
"""

import logging
import json
from datetime import datetime, date
from typing import Dict, Any, Optional
from openai import OpenAI
from uuid import UUID

from config import settings
from database.client import get_supabase_client
from models.artifact import ArtifactType, ArtifactCreate, Artifact, ArtifactPhase

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

        # If we have a spec (from the new spec-first flow), don't generate content
        if artifact_create.spec:
            # Spec-first flow: just save the spec, no UI generation yet
            content = {"components": [], "data": {}}
            artifact_type = ArtifactType.CUSTOM
            title = artifact_create.title_override or "Untitled Artifact"
            description = artifact_create.description_override
            phase = 'spec'
        elif artifact_create.content_override:
            # Content override: use provided content
            content = artifact_create.content_override
            artifact_type = await self._classify_prompt(artifact_create.prompt)
            title = artifact_create.title_override or content.get("title", "Untitled Artifact")
            description = artifact_create.description_override or content.get("description")
            phase = 'ui' if content.get('components') else 'spec'
        else:
            # Legacy flow: generate content from prompt
            artifact_type = await self._classify_prompt(artifact_create.prompt)
            content = await self._generate_content(
                artifact_type=artifact_type,
                prompt=artifact_create.prompt,
                context=artifact_create.context
            )
            title = content.get("title", "Untitled Artifact")
            description = content.get("description")
            phase = 'ui' if content.get('components') else 'spec'

        # Get spec from request
        spec = artifact_create.spec

        # Build artifact data - only include spec/phase if they have values
        # to gracefully handle cases where migration hasn't been run
        artifact_data = {
            "user_id": user_id,
            "type": artifact_type.value,
            "title": title,
            "description": description,
            "prompt": artifact_create.prompt,
            "context": artifact_create.context.model_dump() if artifact_create.context else None,
            "content": content,
            "metadata": {
                "integrations_required": content.get("integrations_required", []),
                "generated_at": datetime.now().isoformat()
            },
            "integrations_connected": [],
            "status": "active"
        }

        # Add spec and phase only if migration has been run (try/catch on insert will handle errors)
        if spec:
            artifact_data["spec"] = spec
            artifact_data["phase"] = phase

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

    async def create_artifact_draft(
        self,
        user_id: str,
        prompt: str,
        conversation_history: list = None,
        current_draft: dict = None,
        context: dict = None
    ) -> Dict[str, Any]:
        """
        Create an artifact draft with clarifying questions (Den-style conversational flow).

        Args:
            user_id: User ID
            prompt: User's current message
            conversation_history: Previous messages in the conversation
            current_draft: Existing draft artifact (if refining)
            context: User context from onboarding

        Returns:
            Dict with draft, assistant_message, and questions
        """
        logger.info(f"Creating artifact draft for user {user_id}")

        # Build context string
        context_str = ""
        if context:
            context_str = f"""
            User context:
            - Stage: {context.get('stage', 'unknown')}
            - Goal: {context.get('goal', 'unknown')}
            - Challenge: {context.get('challenge', 'none provided')}
            """

        # Build the system prompt
        system_prompt = f"""You are Cosos, an AI operating partner for startup founders. You help them build custom business tools (dashboards, trackers, systems) through conversation.

Your job is to:
1. Understand what the user wants to build
2. Create a DRAFT artifact using the component system
3. Ask clarifying questions to refine it
4. Update the draft based on user feedback

{context_str}

Available components:
1. MetricCard - Display a single metric/KPI with optional target and progress
2. DataList - Display a table of items with specified fields
3. ProgressBar - Show progress toward a goal
4. InputForm - Form to add new data items
5. TextBlock - Display text/instructions (variants: default, info, warning, success)
6. Chart - Display data visualizations (types: line, bar, pie, area)

Component configs:
- MetricCard: {{ title, value, target?, unit?, icon?, description? }}
- DataList: {{ title, items[], fields[], dataKey, emptyMessage? }}
- ProgressBar: {{ title, current, target, color? }}
- InputForm: {{ title, dataKey, fields[{{ name, label, type, required?, placeholder? }}], submitLabel }}
- TextBlock: {{ text, variant? }}
- Chart: {{ title, description?, type (line|bar|pie|area), data[], xAxisKey?, yAxisKey? }}

Icons: Use Lucide icon names like "TrendingUp", "DollarSign", "Users", "Target", "BarChart3", "PieChart", "ArrowUp", "ArrowDown"

CRITICAL: Your response MUST be valid JSON with this structure:
{{
  "message": "Your friendly response explaining the draft and asking questions",
  "questions": ["Question 1?", "Question 2?", "Question 3?"],
  "draft": {{
    "title": "Artifact Title",
    "description": "Brief description",
    "components": [...]
  }}
}}

Guidelines:
- On first message: Create an initial draft AND ask 2-3 clarifying questions
- Include sample data that looks realistic for their context
- Keep drafts simple (3-5 components max)
- Be conversational and helpful
- For dashboards, ALWAYS include at least one Chart component
- For MRR/revenue, include MetricCard + line Chart
- Questions should help you refine: What metrics? What time period? What data sources?"""

        # Build messages array
        messages = [{"role": "system", "content": system_prompt}]

        # Add conversation history
        if conversation_history:
            messages.extend(conversation_history)

        # Add current draft context if refining
        if current_draft:
            messages.append({
                "role": "assistant",
                "content": f"Current draft: {json.dumps(current_draft)}"
            })

        # Add user's current message
        messages.append({
            "role": "user",
            "content": prompt
        })

        # Call OpenAI
        response = self.client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            temperature=0.7,
            response_format={"type": "json_object"}
        )

        result = json.loads(response.choices[0].message.content)

        return {
            "draft": result.get("draft", {}),
            "assistant_message": result.get("message", "I've created a draft for you."),
            "questions": result.get("questions", [])
        }

    async def create_spec_stream(
        self,
        user_id: str,
        prompt: str,
        conversation_history: list = None,
        current_spec: str = None,
        context: dict = None
    ):
        """
        Create/refine a Product Spec document with streaming response.

        This is Phase 1 of artifact creation - building the specification
        that will later be used to generate UI components.

        Yields SSE events showing thinking, building, and the spec document.
        """
        import asyncio

        logger.info(f"Creating Product Spec (streaming) for user {user_id}")

        # Step 1: Yield thinking step
        yield {"type": "thinking", "content": "Understanding your request..."}
        await asyncio.sleep(0.3)

        # Build context string
        context_str = ""
        if context:
            context_str = f"""
            User context:
            - Stage: {context.get('stage', 'unknown')}
            - Goal: {context.get('goal', 'unknown')}
            - Challenge: {context.get('challenge', 'none provided')}
            """
            yield {"type": "thinking", "content": f"Considering your context as a {context.get('stage', 'startup')}..."}
            await asyncio.sleep(0.2)

        # Determine what we're building
        is_dashboard = any(kw in prompt.lower() for kw in ['dashboard', 'mrr', 'revenue', 'metrics', 'track', 'monitor'])
        is_tracker = any(kw in prompt.lower() for kw in ['tracker', 'okr', 'goal', 'progress', 'sprint'])

        if is_dashboard:
            yield {"type": "thinking", "content": "This looks like a dashboard — let me draft the specification..."}
        elif is_tracker:
            yield {"type": "thinking", "content": "Setting up a tracker specification..."}
        else:
            yield {"type": "thinking", "content": "Drafting your artifact specification..."}
        await asyncio.sleep(0.3)

        yield {"type": "building", "content": "Creating Product Spec..."}
        await asyncio.sleep(0.2)

        # Build the system prompt for Product Spec generation
        system_prompt = f"""You are Cosos, an AI operating partner for startup founders. You help them define what they want to build through a Product Specification document.

Your job is to:
1. Understand what the user wants to build
2. Create a structured Product Spec document (in markdown)
3. Ask clarifying questions to refine the spec

{context_str}

The Product Spec should be a markdown document with these sections:
- **Title**: Clear name for the artifact
- **Overview**: 1-2 sentence description of what this does
- **Purpose**: Why the user needs this, what problem it solves
- **Key Metrics**: List of important numbers/KPIs to track (for dashboards/trackers)
- **Data Sources**: Where the data comes from - be EXPLICIT about integrations needed
- **Sections/Views**: What parts the UI should have
- **Refresh Frequency**: How often data updates

IMPORTANT - Data Sources & Integrations:
- If the user wants to track MRR, revenue, subscriptions → needs Stripe or Paddle integration
- If the user wants to track sales pipeline, deals, CRM data → needs HubSpot, Salesforce, or Pipedrive integration
- If the user wants to track website analytics, traffic → needs Google Analytics integration
- If the user wants to track OKRs, project tasks, sprints → can use manual entry OR Linear/Jira integration
- ALWAYS mention what integrations would make this artifact more valuable

CRITICAL: Your response MUST be valid JSON:
{{
  "message": "Your friendly response explaining what you've drafted. End with your questions as a NUMBERED LIST like this:\\n\\n1. Question about metrics?\\n2. Question about data source?\\n3. Question about users?",
  "spec": "# Artifact Title\\n\\n## Overview\\n...(full markdown spec)...",
  "title": "Short title for the artifact",
  "description": "One-line description",
  "should_update_spec": true
}}

QUESTION FORMAT RULES:
- ALWAYS end your message with numbered questions (1. 2. 3.)
- Questions help refine: What specific metrics? What's the data source? Who uses this? What timeframe?
- Keep questions focused and actionable (2-4 questions max)

WHEN TO UPDATE THE SPEC:
- Set "should_update_spec": true when user provides NEW information that should be incorporated
- Set "should_update_spec": false when user asks a question, wants clarification, or is just chatting
- If user answers your questions → update the spec with their answers
- If user asks "what integrations do I need?" → don't update spec, just answer

The spec is the blueprint - UI will be generated from it later.
"""

        messages = [{"role": "system", "content": system_prompt}]

        if conversation_history:
            messages.extend(conversation_history)

        if current_spec:
            messages.append({
                "role": "assistant",
                "content": f"Current spec:\n{current_spec}"
            })

        messages.append({"role": "user", "content": prompt})

        yield {"type": "building", "content": "Drafting specification..."}
        await asyncio.sleep(0.1)

        # Stream the OpenAI response
        try:
            stream = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=messages,
                temperature=0.7,
                response_format={"type": "json_object"},
                stream=True
            )

            full_content = ""
            yielded_building = False

            for chunk in stream:
                if chunk.choices[0].delta.content:
                    full_content += chunk.choices[0].delta.content

                    # Yield progress updates based on content
                    if not yielded_building and len(full_content) > 100:
                        yield {"type": "building", "content": "Refining specification..."}
                        yielded_building = True

            # Parse the complete response
            result = json.loads(full_content)

            # Check if we should update the spec
            should_update = result.get("should_update_spec", True)

            if should_update:
                # Yield the spec (only if we should update it)
                yield {"type": "spec", "content": {
                    "spec": result.get("spec", ""),
                    "title": result.get("title", "Untitled"),
                    "description": result.get("description", "")
                }}

            # Yield the message
            yield {"type": "message", "content": result.get("message", "I've drafted a specification for you.")}

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse streaming response: {e}")
            yield {"type": "error", "content": "Failed to generate spec. Please try again."}
        except Exception as e:
            logger.error(f"Error in streaming spec: {e}")
            yield {"type": "error", "content": str(e)}

    async def generate_ui_from_spec(
        self,
        spec: str,
        title: str,
        context: dict = None
    ) -> Dict[str, Any]:
        """
        Generate UI components from a Product Spec document.

        This is Phase 2 of artifact creation - turning the spec into
        visual components.

        Args:
            spec: The Product Spec markdown document
            title: Artifact title
            context: Optional user context

        Returns:
            Dict with components array and data
        """
        logger.info(f"Generating UI from spec: {title}")

        context_str = ""
        if context:
            context_str = f"""
            User context:
            - Stage: {context.get('stage', 'unknown')}
            - Goal: {context.get('goal', 'unknown')}
            """

        system_prompt = f"""You are Cosos, an AI that generates UI components from a Product Specification.

Given this Product Spec, generate the appropriate UI components.

{context_str}

Available components:
1. MetricCard - Display a single metric/KPI (config: title, value, target?, unit?, icon?, description?)
2. DataList - Display a table of items (config: title, items[], fields[], dataKey, emptyMessage?)
3. ProgressBar - Show progress toward a goal (config: title, current, target, color?)
4. InputForm - Form to add new data (config: title, dataKey, fields[], submitLabel)
5. TextBlock - Display text/instructions (config: text, variant: default|info|warning|success)
6. Chart - Data visualizations (config: title, type: line|bar|pie|area, data[], xAxisKey, yAxisKey)

Icons: Use Lucide icon names like "TrendingUp", "DollarSign", "Users", "Target", "BarChart3"

CRITICAL: Return valid JSON:
{{
  "components": [
    {{
      "id": "unique_id",
      "type": "ComponentType",
      "config": {{...}}
    }}
  ],
  "data": {{}}
}}

Guidelines:
- Map each section in the spec to appropriate components
- Use MetricCard for each Key Metric
- Use Chart (line) for trend data, Chart (pie) for distributions
- Use DataList for lists of items
- Include realistic sample data
- Keep it focused (3-6 components max)
"""

        response = self.client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Generate UI components from this Product Spec:\n\n{spec}"}
            ],
            temperature=0.7,
            response_format={"type": "json_object"}
        )

        result = json.loads(response.choices[0].message.content)

        return {
            "components": result.get("components", []),
            "data": result.get("data", {})
        }

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
            Structured artifact content with components array
        """
        # Route ALL types through the component-based generator
        # The old template-based generators are deprecated in favor of the flexible component system
        return await self._generate_custom(prompt, context, artifact_type)

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
        context: Optional[Any],
        artifact_type: Optional[ArtifactType] = None
    ) -> Dict[str, Any]:
        """
        Generate a custom component-based artifact from user prompt.

        This uses the new component system with:
        - MetricCard: Display KPIs and metrics
        - DataList: Show lists of items
        - ProgressBar: Visual progress indicators
        - InputForm: Forms to add new data
        - TextBlock: Instructions and context
        - Chart: Data visualizations (line, bar, pie, area)
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

        # Add artifact type hint if available
        type_hint = ""
        if artifact_type:
            type_hints = {
                ArtifactType.MRR_TRACKER: "This should be an MRR/Revenue dashboard. MUST include: 1) MetricCard for current MRR, 2) Chart (line) showing MRR trend over time, 3) MetricCard for growth rate. Use realistic sample data.",
                ArtifactType.RETENTION_ANALYSIS: "This should be a Retention/Churn dashboard. Include: 1) MetricCard for retention rate, 2) Chart showing retention over cohorts, 3) DataList of churn reasons.",
                ArtifactType.BOARD_PREP: "This should be a Board Meeting Prep artifact. Include: 1) Key metrics (MetricCards), 2) Charts for growth trends, 3) DataList for agenda items.",
                ArtifactType.ACTIVATION_MONITOR: "This should track user activation. Include: MetricCards for activation rate and Chart for activation funnel.",
                ArtifactType.PRODUCT_VELOCITY: "This should track product/engineering velocity. Include: MetricCards for shipped features and Chart for velocity over time.",
                ArtifactType.CUSTOMER_FEEDBACK: "This should analyze customer feedback. Include: Chart (pie) for feedback categories and DataList for feedback items.",
            }
            type_hint = type_hints.get(artifact_type, "")

        system_prompt = f"""You are Cosos, an AI operating partner for startup founders. Generate a custom artifact using a component-based system.

{type_hint}

Available components:
1. MetricCard - Display a single metric/KPI with optional target and progress
2. DataList - Display a table of items with specified fields
3. ProgressBar - Show progress toward a goal
4. InputForm - Form to add new data items
5. TextBlock - Display text/instructions (variants: default, info, warning, success)
6. Chart - Display data visualizations (types: line, bar, pie, area)

Your output must be a JSON object with this EXACT structure:
{{
  "title": "Artifact Title",
  "description": "Brief description of what this artifact does",
  "components": [
    {{
      "id": "unique_id_1",
      "type": "MetricCard",
      "config": {{
        "title": "Metric Name",
        "value": 0,
        "target": 100,
        "unit": "units",
        "icon": "TrendingUp",
        "description": "Optional description"
      }}
    }},
    {{
      "id": "unique_id_2",
      "type": "DataList",
      "config": {{
        "title": "List Title",
        "items": [],
        "fields": ["field1", "field2", "field3"],
        "dataKey": "items_collection_name",
        "emptyMessage": "No items yet"
      }}
    }},
    {{
      "id": "unique_id_3",
      "type": "InputForm",
      "config": {{
        "title": "Add New Item",
        "dataKey": "items_collection_name",
        "fields": [
          {{
            "name": "field1",
            "label": "Field 1",
            "type": "text",
            "required": true,
            "placeholder": "Enter value"
          }}
        ],
        "submitLabel": "Add Item"
      }}
    }},
    {{
      "id": "unique_id_4",
      "type": "Chart",
      "config": {{
        "title": "Chart Title",
        "description": "Optional description",
        "type": "line",
        "data": [
          {{"name": "Jan", "value": 100}},
          {{"name": "Feb", "value": 150}},
          {{"name": "Mar", "value": 200}}
        ],
        "xAxisKey": "name",
        "yAxisKey": "value"
      }}
    }}
  ],
  "data": {{}}
}}

Important rules:
- Use Lucide icon names for MetricCard icons (e.g., "TrendingUp", "Target", "Users", "DollarSign")
- DataList and InputForm should share the same "dataKey" to connect them
- InputForm fields should match DataList fields
- Field types: "text", "number", "date", "textarea", "select"
- Chart types: "line" (trends over time), "bar" (comparisons), "pie" (distributions), "area" (cumulative)
- For charts, provide sample data with at least 3-5 data points
- Chart data should be an array of objects with keys matching xAxisKey and yAxisKey
- Keep it simple and focused on the user's specific need
- Start with empty data: {{}}
- Use 2-6 components maximum for clarity
- ALWAYS use Chart component for dashboards, revenue tracking, or any trend visualization"""

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

