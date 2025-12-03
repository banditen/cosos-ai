"""
COSOS: AI Chief of Staff - FastAPI Backend
Entry point for the application.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Import routes
from routes import auth_router, sync_router
from routes.onboarding import router as onboarding_router
from routes.briefs import router as briefs_router
from routes.projects import router as projects_router
from routes.initiatives import router as initiatives_router
from routes.scheduler import router as scheduler_router
from routes.linear import router as linear_router
from routes.analysis import router as analysis_router
from routes.setup import router as setup_router
from routes.artifacts import router as artifacts_router
from routes.slack import router as slack_router
from routes.notion import router as notion_router
from routes.context import router as context_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle management."""
    logger.info("🚀 COSOS API starting up...")

    # Test database connection
    from database.client import test_connection
    if test_connection():
        logger.info("✅ Database connection successful")
    else:
        logger.warning("⚠️  Database connection failed")

    # Start scheduler for automated jobs
    from services.scheduler_service import get_scheduler
    scheduler = get_scheduler()
    scheduler.start()

    yield

    logger.info("🛑 COSOS API shutting down...")
    # Shutdown scheduler
    scheduler.shutdown()
    logger.info("✅ Scheduler shutdown complete")

app = FastAPI(
    title="COSOS API",
    description="The Engine Room That Runs With You — Proactive AI decision-maker for solopreneurs and early-stage CEOs",
    version="0.1.0",
    lifespan=lifespan
)

# CORS configuration
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring."""
    return {
        "status": "healthy",
        "service": "cosos-api",
        "version": "0.1.0"
    }

@app.get("/")
async def root():
    """Root endpoint - API information."""
    return {
        "name": "COSOS — The Engine Room That Runs With You",
        "tagline": "Know if you're winning, every single day",
        "version": "0.1.0",
        "environment": os.getenv("ENVIRONMENT", "development"),
        "docs": "/docs",
        "health": "/health"
    }

# Include routers
app.include_router(auth_router, prefix="/api/v1")
app.include_router(sync_router, prefix="/api/v1")
app.include_router(onboarding_router, prefix="/api/v1")
app.include_router(briefs_router, prefix="/api/v1")
app.include_router(projects_router, prefix="/api/v1")
app.include_router(initiatives_router, prefix="/api/v1")
app.include_router(scheduler_router, prefix="/api/v1")
app.include_router(linear_router, prefix="/api/v1")
app.include_router(analysis_router, prefix="/api/v1")
app.include_router(setup_router, prefix="/api/v1")
app.include_router(artifacts_router, prefix="/api/v1")  # NEW: Artifact generation
app.include_router(slack_router, prefix="/api/v1")  # Slack integration
app.include_router(notion_router, prefix="/api/v1")  # Notion integration
app.include_router(context_router, prefix="/api/v1")  # Context Q&A

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        reload=os.getenv("ENVIRONMENT") == "development"
    )
