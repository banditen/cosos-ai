"""Setup routes for COSOS backend - handles initial user setup flow."""

import logging
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional
from database.client import get_supabase_client
from datetime import datetime

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/setup", tags=["setup"])

class Project(BaseModel):
    name: str
    description: Optional[str] = None
    goal: Optional[str] = None

class Metric(BaseModel):
    name: str
    current_value: str
    target_value: str
    unit: str
    source: str = 'manual'

class SetupData(BaseModel):
    business_description: str
    success_definition: str
    biggest_challenge: Optional[str] = None
    projects: List[Project]
    metrics: List[Metric]

@router.post("/complete")
async def complete_setup(
    user_id: str = Query(..., description="User ID"),
    data: SetupData = None
):
    """
    Complete the setup flow by saving all user data.
    
    Args:
        user_id: User ID
        data: Setup data including context, projects, and metrics
        
    Returns:
        Success message
    """
    try:
        supabase = get_supabase_client()
        
        # 1. Save user context
        context_data = {
            'user_id': user_id,
            'business_mission': data.business_description,
            'success_criteria': data.success_definition,
            'current_challenges': [data.biggest_challenge] if data.biggest_challenge else [],
            'updated_at': datetime.utcnow().isoformat()
        }
        
        # Check if context exists
        existing_context = supabase.table('user_context').select('id').eq('user_id', user_id).execute()
        
        if existing_context.data:
            # Update existing context
            supabase.table('user_context').update(context_data).eq('user_id', user_id).execute()
            logger.info(f"Updated context for user {user_id}")
        else:
            # Insert new context
            supabase.table('user_context').insert(context_data).execute()
            logger.info(f"Created context for user {user_id}")
        
        # 2. Save projects
        for project in data.projects:
            project_data = {
                'user_id': user_id,
                'name': project.name,
                'description': project.description,
                'goal': project.goal,
                'status': 'active',
                'created_at': datetime.utcnow().isoformat()
            }
            supabase.table('projects').insert(project_data).execute()
        
        logger.info(f"Created {len(data.projects)} projects for user {user_id}")
        
        # 3. Save metrics
        # First, ensure metrics table exists (create if needed)
        for metric in data.metrics:
            metric_data = {
                'user_id': user_id,
                'name': metric.name,
                'current_value': metric.current_value,
                'target_value': metric.target_value,
                'unit': metric.unit,
                'source': metric.source,
                'created_at': datetime.utcnow().isoformat()
            }
            supabase.table('metrics').insert(metric_data).execute()
        
        logger.info(f"Created {len(data.metrics)} metrics for user {user_id}")
        
        return {
            'success': True,
            'message': 'Setup completed successfully',
            'user_id': user_id,
            'projects_created': len(data.projects),
            'metrics_created': len(data.metrics)
        }
        
    except Exception as e:
        logger.error(f"Error completing setup: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to complete setup: {str(e)}"
        )

