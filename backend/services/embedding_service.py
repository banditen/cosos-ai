"""Embedding service for generating vector embeddings using OpenAI."""

import logging
from typing import List, Optional
from openai import OpenAI

from config import settings

logger = logging.getLogger(__name__)


class EmbeddingService:
    """Service for generating embeddings using OpenAI."""
    
    def __init__(self):
        self.client = OpenAI(api_key=settings.OPENAI_API_KEY)
        self.model = settings.OPENAI_EMBEDDING_MODEL
    
    def generate_embedding(self, text: str) -> List[float]:
        """
        Generate embedding for a single text.
        
        Args:
            text: Text to embed
            
        Returns:
            Embedding vector (1536 dimensions for ada-002)
        """
        if not text or not text.strip():
            logger.warning("Empty text provided for embedding")
            return [0.0] * 1536  # Return zero vector
        
        try:
            response = self.client.embeddings.create(
                model=self.model,
                input=text
            )
            
            embedding = response.data[0].embedding
            logger.debug(f"Generated embedding for text (length: {len(text)})")
            
            return embedding
            
        except Exception as e:
            logger.error(f"Error generating embedding: {e}")
            raise
    
    def generate_embeddings_batch(self, texts: List[str]) -> List[List[float]]:
        """
        Generate embeddings for multiple texts in batch.
        
        Args:
            texts: List of texts to embed
            
        Returns:
            List of embedding vectors
        """
        if not texts:
            return []
        
        # Filter out empty texts
        valid_texts = [t for t in texts if t and t.strip()]
        
        if not valid_texts:
            logger.warning("No valid texts provided for batch embedding")
            return [[0.0] * 1536] * len(texts)
        
        try:
            response = self.client.embeddings.create(
                model=self.model,
                input=valid_texts
            )
            
            embeddings = [item.embedding for item in response.data]
            logger.info(f"Generated {len(embeddings)} embeddings in batch")
            
            return embeddings
            
        except Exception as e:
            logger.error(f"Error generating batch embeddings: {e}")
            raise
    
    def embed_email(self, subject: str, body: str, from_email: str = "") -> List[float]:
        """
        Generate embedding for an email.
        Combines subject, body, and sender for context.
        
        Args:
            subject: Email subject
            body: Email body
            from_email: Sender email
            
        Returns:
            Embedding vector
        """
        # Combine email components
        text = f"From: {from_email}\nSubject: {subject}\n\n{body}"
        
        # Truncate if too long (max ~8000 tokens for ada-002)
        max_chars = 30000  # Rough estimate
        if len(text) > max_chars:
            text = text[:max_chars] + "..."
            logger.debug(f"Truncated email text from {len(text)} to {max_chars} chars")
        
        return self.generate_embedding(text)
    
    def embed_user_context(self, context_dict: dict) -> List[float]:
        """
        Generate embedding for user context.
        
        Args:
            context_dict: Dictionary with user context fields
            
        Returns:
            Embedding vector
        """
        # Combine all context fields into a single text
        parts = []
        
        if context_dict.get('business_mission'):
            parts.append(f"Mission: {context_dict['business_mission']}")
        
        if context_dict.get('business_stage'):
            parts.append(f"Stage: {context_dict['business_stage']}")
        
        if context_dict.get('quarterly_goals'):
            goals = context_dict['quarterly_goals']
            if isinstance(goals, list):
                goals_text = ", ".join([g.get('goal', str(g)) for g in goals])
                parts.append(f"Goals: {goals_text}")
        
        if context_dict.get('current_challenges'):
            challenges = context_dict['current_challenges']
            if isinstance(challenges, list):
                parts.append(f"Challenges: {', '.join(challenges)}")
        
        if context_dict.get('target_audience'):
            audience = context_dict['target_audience']
            if isinstance(audience, list):
                audience_text = ", ".join([a.get('name', str(a)) for a in audience])
                parts.append(f"Target Audience: {audience_text}")
        
        if context_dict.get('value_propositions'):
            props = context_dict['value_propositions']
            if isinstance(props, list):
                parts.append(f"Value Props: {', '.join(props)}")
        
        text = "\n".join(parts)
        
        if not text:
            logger.warning("Empty user context provided for embedding")
            return [0.0] * 1536
        
        return self.generate_embedding(text)

