"""Scheduler status and management routes."""

import logging
from typing import Dict, Any
from fastapi import APIRouter, HTTPException

from services.scheduler_service import get_scheduler

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/scheduler", tags=["scheduler"])


@router.get("/status")
async def get_scheduler_status() -> Dict[str, Any]:
    """
    Get scheduler status and job statistics.
    
    Returns:
        Scheduler status including:
        - Running jobs
        - Next run times
        - Execution statistics
    """
    try:
        scheduler = get_scheduler()
        stats = scheduler.get_job_stats()
        
        return {
            "status": "running",
            "scheduler_info": stats
        }
        
    except Exception as e:
        logger.error(f"Error getting scheduler status: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/trigger/sync")
async def trigger_sync_job() -> Dict[str, str]:
    """
    Manually trigger the sync job for all users.
    
    This is useful for testing or forcing an immediate sync.
    
    Returns:
        Success message
    """
    try:
        scheduler = get_scheduler()
        
        # Trigger the sync job immediately
        job = scheduler.scheduler.get_job("sync_all_users")
        if not job:
            raise HTTPException(status_code=404, detail="Sync job not found")
        
        job.modify(next_run_time=None)  # Run immediately
        
        return {
            "message": "Sync job triggered successfully",
            "job_id": "sync_all_users"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error triggering sync job: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/trigger/briefs")
async def trigger_brief_job() -> Dict[str, str]:
    """
    Manually trigger the daily brief generation job.
    
    This is useful for testing or generating briefs on-demand.
    
    Returns:
        Success message
    """
    try:
        scheduler = get_scheduler()
        
        # Trigger the brief job immediately
        job = scheduler.scheduler.get_job("generate_daily_briefs")
        if not job:
            raise HTTPException(status_code=404, detail="Brief generation job not found")
        
        job.modify(next_run_time=None)  # Run immediately
        
        return {
            "message": "Brief generation job triggered successfully",
            "job_id": "generate_daily_briefs"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error triggering brief job: {e}")
        raise HTTPException(status_code=500, detail=str(e))

