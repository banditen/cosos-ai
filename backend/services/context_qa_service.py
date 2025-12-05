"""Context Q&A service for RAG-powered business intelligence queries."""

import logging
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from openai import OpenAI
import json

from config import settings
from database.client import get_supabase_client
from services.embedding_service import EmbeddingService

logger = logging.getLogger(__name__)


class ContextQAService:
    """Service for answering questions using business context via RAG."""

    def __init__(self):
        self.supabase = get_supabase_client()
        self.embedding_service = EmbeddingService()
        self.openai = OpenAI(api_key=settings.OPENAI_API_KEY)
        self.model = settings.OPENAI_MODEL

    async def ask(
        self,
        user_id: str,
        question: str,
        conversation_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Answer a question using the user's business context.

        Args:
            user_id: User ID
            question: The question to answer
            conversation_id: Optional conversation ID for context

        Returns:
            Answer with sources and metadata
        """
        # Generate embedding for the question
        question_embedding = self.embedding_service.generate_embedding(question)

        # Retrieve relevant context using vector similarity
        relevant_context = await self._retrieve_context(user_id, question_embedding)

        # Get conversation history if continuing
        history = []
        if conversation_id:
            history = self._get_conversation_history(conversation_id)

        # Generate answer using LLM
        answer, sources = await self._generate_answer(question, relevant_context, history)

        # Store in conversation
        conv_id = self._store_conversation(user_id, conversation_id, question, answer, sources)

        return {
            "answer": answer,
            "sources": sources,
            "conversation_id": conv_id,
            "context_used": len(relevant_context),
        }

    async def _retrieve_context(
        self, user_id: str, embedding: List[float], limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Retrieve relevant context using vector similarity search."""
        context_items = []

        # Search context embeddings using pgvector
        # Note: This requires the match_context_embeddings function in Supabase
        try:
            result = self.supabase.rpc(
                "match_context_embeddings",
                {
                    "query_embedding": embedding,
                    "match_user_id": user_id,
                    "match_count": limit,
                    "match_threshold": 0.7,
                },
            ).execute()

            if result.data:
                for item in result.data:
                    context_items.append({
                        "id": item.get("id"),
                        "type": item.get("source_type"),
                        "text": item.get("chunk_text"),
                        "similarity": item.get("similarity"),
                        "metadata": item.get("metadata"),
                    })
        except Exception as e:
            logger.warning(f"Vector search failed, falling back to text search: {e}")
            # Fallback: get recent documents
            context_items = await self._fallback_context_retrieval(user_id, limit)

        return context_items

    async def _fallback_context_retrieval(
        self, user_id: str, limit: int
    ) -> List[Dict[str, Any]]:
        """Fallback context retrieval without vector search."""
        context_items = []

        # Get recent documents
        try:
            docs = (
                self.supabase.table("context_documents")
                .select("id, title, type, content")
                .eq("user_id", user_id)
                .eq("is_active", True)
                .order("updated_at", desc=True)
                .limit(limit)
                .execute()
            )

            for doc in docs.data or []:
                context_items.append({
                    "id": doc["id"],
                    "type": "document",
                    "text": f"{doc['title']}\n\n{doc['content'][:2000]}",
                    "metadata": {"doc_type": doc["type"]},
                })
        except Exception as e:
            logger.warning(f"Failed to fetch documents: {e}")

        # Get Linear issues
        try:
            issues = (
                self.supabase.table("linear_issues")
                .select("id, title, description, state_name, state_type, priority, team_name, project_name, completed_at, updated_at_linear")
                .eq("user_id", user_id)
                .eq("is_archived", False)
                .order("updated_at_linear", desc=True)
                .limit(limit)
                .execute()
            )

            for issue in issues.data or []:
                status = f"[{issue['state_name']}]" if issue.get('state_name') else ""
                completed = " (Completed)" if issue.get('completed_at') else ""
                project = f" in {issue['project_name']}" if issue.get('project_name') else ""
                team = f" ({issue['team_name']})" if issue.get('team_name') else ""
                desc = issue.get('description', '')[:500] if issue.get('description') else ""

                context_items.append({
                    "id": issue["id"],
                    "type": "linear_issue",
                    "text": f"Linear Issue {status}{completed}: {issue['title']}{project}{team}\n{desc}",
                    "metadata": {
                        "state_type": issue.get("state_type"),
                        "priority": issue.get("priority"),
                        "team": issue.get("team_name"),
                    },
                })
        except Exception as e:
            logger.warning(f"Failed to fetch Linear issues: {e}")

        # Get recent Slack messages
        try:
            messages = (
                self.supabase.table("slack_messages")
                .select("id, channel_name, text, user_name, message_at")
                .eq("user_id", user_id)
                .order("message_at", desc=True)
                .limit(limit)
                .execute()
            )

            for msg in messages.data or []:
                context_items.append({
                    "id": msg["id"],
                    "type": "slack_message",
                    "text": f"[{msg['channel_name']}] {msg['user_name']}: {msg['text']}",
                    "metadata": {"channel": msg["channel_name"]},
                })
        except Exception as e:
            logger.warning(f"Failed to fetch Slack messages: {e}")

        return context_items

    async def _generate_answer(
        self,
        question: str,
        context: List[Dict[str, Any]],
        history: List[Dict[str, str]],
    ) -> tuple[str, List[Dict[str, Any]]]:
        """Generate answer using LLM with retrieved context."""
        # Build context string
        context_str = "\n\n---\n\n".join([
            f"[{item['type']}]: {item['text']}" for item in context
        ])

        # Build messages
        messages = [
            {
                "role": "system",
                "content": self._get_system_prompt(),
            }
        ]

        # Add history
        for msg in history[-6:]:  # Last 3 exchanges
            messages.append(msg)

        # Add context and question
        messages.append({
            "role": "user",
            "content": f"""Based on the following business context, answer the question.

CONTEXT:
{context_str}

QUESTION: {question}

Provide a clear, actionable answer. If the context doesn't contain enough information, say so.""",
        })

        # Generate response
        response = self.openai.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=0.7,
            max_tokens=1000,
        )

        answer = response.choices[0].message.content

        # Extract sources
        sources = [
            {"id": item["id"], "type": item["type"], "preview": item["text"][:100]}
            for item in context[:5]
        ]

        return answer, sources

    def _get_system_prompt(self) -> str:
        """Get the system prompt for the Q&A assistant."""
        return """You are Cosos, an AI business intelligence assistant. You help founders and CEOs understand their business context by answering questions based on their connected data sources (Slack, Notion, documents, etc.).

Your role is to:
1. Provide clear, actionable insights based on the available context
2. Connect dots between different pieces of information
3. Highlight relevant decisions, goals, and discussions
4. Be honest when you don't have enough information

Keep responses concise but comprehensive. Use bullet points for clarity when appropriate."""

    def _get_conversation_history(self, conversation_id: str) -> List[Dict[str, str]]:
        """Get conversation history."""
        result = (
            self.supabase.table("context_conversations")
            .select("messages")
            .eq("id", conversation_id)
            .execute()
        )

        if result.data:
            return result.data[0].get("messages", [])
        return []

    def _store_conversation(
        self,
        user_id: str,
        conversation_id: Optional[str],
        question: str,
        answer: str,
        sources: List[Dict],
    ) -> str:
        """Store conversation in database."""
        now = datetime.now(timezone.utc).isoformat()

        new_messages = [
            {"role": "user", "content": question, "timestamp": now},
            {"role": "assistant", "content": answer, "timestamp": now},
        ]

        if conversation_id:
            # Update existing conversation
            existing = self._get_conversation_history(conversation_id)
            existing.extend(new_messages)

            self.supabase.table("context_conversations").update({
                "messages": existing,
                "context_used": [s["id"] for s in sources],
                "updated_at": now,
            }).eq("id", conversation_id).execute()

            return conversation_id
        else:
            # Create new conversation
            result = self.supabase.table("context_conversations").insert({
                "user_id": user_id,
                "title": question[:100],
                "messages": new_messages,
                "context_used": [s["id"] for s in sources],
            }).execute()

            return result.data[0]["id"] if result.data else None

    def get_conversations(self, user_id: str, limit: int = 20) -> List[Dict[str, Any]]:
        """Get user's conversation history."""
        result = (
            self.supabase.table("context_conversations")
            .select("id, title, created_at, updated_at")
            .eq("user_id", user_id)
            .order("updated_at", desc=True)
            .limit(limit)
            .execute()
        )
        return result.data or []

    def get_conversation(self, conversation_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific conversation."""
        result = (
            self.supabase.table("context_conversations")
            .select("*")
            .eq("id", conversation_id)
            .execute()
        )
        return result.data[0] if result.data else None
