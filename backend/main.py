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

# Import routes (will be added in Phase 1)
# from routes import auth, chat, emails, integrations

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle management."""
    logger.info("🚀 COSOS API starting up...")
    # Initialize services, connect to DB, etc.
    yield
    logger.info("🛑 COSOS API shutting down...")
    # Clean up resources

app = FastAPI(
    title="COSOS API",
    description="AI Chief of Staff for founders",
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
        "name": "COSOS: AI Chief of Staff",
        "version": "0.1.0",
        "environment": os.getenv("ENVIRONMENT", "development"),
        "docs": "/docs",
        "health": "/health"
    }

# Routes will be imported here
# app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
# app.include_router(chat.router, prefix="/api/v1/chat", tags=["chat"])
# app.include_router(emails.router, prefix="/api/v1/emails", tags=["emails"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        reload=os.getenv("ENVIRONMENT") == "development"
    )
