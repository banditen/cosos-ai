"""Analysis routes for COSOS backend."""

import logging
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, HttpUrl
from openai import OpenAI
from config import settings
import httpx

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/analysis", tags=["analysis"])

class WebsiteAnalysisRequest(BaseModel):
    url: HttpUrl

class WebsiteAnalysisResponse(BaseModel):
    description: str
    success: bool

@router.post("/website", response_model=WebsiteAnalysisResponse)
async def analyze_website(request: WebsiteAnalysisRequest):
    """
    Analyze a website URL and generate a business description.
    
    Args:
        request: Website URL to analyze
        
    Returns:
        AI-generated business description
    """
    try:
        # Fetch website content
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
            try:
                response = await client.get(str(request.url))
                response.raise_for_status()
                html_content = response.text
            except httpx.HTTPError as e:
                logger.error(f"Error fetching website: {e}")
                raise HTTPException(
                    status_code=400,
                    detail=f"Could not fetch website. Please check the URL and try again."
                )
        
        # Extract text content (simple approach - just get first 5000 chars)
        # In production, you'd want to use a proper HTML parser
        text_content = html_content[:5000]
        
        # Use OpenAI to analyze the website
        client = OpenAI(api_key=settings.OPENAI_API_KEY)
        
        prompt = f"""Analyze this website content and write a concise business description (2-3 sentences, max 300 characters).
Focus on:
- What the company builds/offers
- Who it's for
- The core value proposition

Website content:
{text_content}

Write the description in first person (e.g., "We're building..."). Be specific and avoid buzzwords."""

        completion = client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": "You are a business analyst who writes clear, concise company descriptions. Write in first person, be specific, and avoid marketing fluff."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.7,
            max_tokens=150
        )
        
        description = completion.choices[0].message.content.strip()
        
        # Ensure it's within character limit
        if len(description) > 500:
            description = description[:497] + "..."
        
        logger.info(f"Successfully analyzed website: {request.url}")
        
        return WebsiteAnalysisResponse(
            description=description,
            success=True
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error analyzing website: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to analyze website. Please try again or enter your description manually."
        )

