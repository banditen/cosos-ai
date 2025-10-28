"""Pydantic models for projects and initiatives."""

from datetime import date, datetime
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, Field


# ============================================
# PROJECT MODELS
# ============================================

class ProjectBase(BaseModel):
    """Base project model with common fields."""
    name: str = Field(..., description="Project name")
    description: Optional[str] = Field(None, description="Project description")
    goal: Optional[str] = Field(None, description="What success looks like")
    status: str = Field("active", description="Project status: active, paused, completed, archived")
    start_date: Optional[date] = Field(None, description="Project start date")
    deadline: Optional[date] = Field(None, description="Project deadline")


class ProjectCreate(ProjectBase):
    """Model for creating a new project."""
    pass


class ProjectUpdate(BaseModel):
    """Model for updating a project (all fields optional)."""
    name: Optional[str] = None
    description: Optional[str] = None
    goal: Optional[str] = None
    status: Optional[str] = None
    start_date: Optional[date] = None
    deadline: Optional[date] = None


class Project(ProjectBase):
    """Full project model with all fields."""
    id: UUID
    user_id: UUID
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    # Integration fields
    source: str = "manual"
    external_id: Optional[str] = None
    external_url: Optional[str] = None
    sync_enabled: bool = False
    last_synced_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


# ============================================
# INITIATIVE MODELS
# ============================================

class InitiativeBase(BaseModel):
    """Base initiative model with common fields."""
    name: str = Field(..., description="Initiative name")
    description: Optional[str] = Field(None, description="Initiative description")
    success_criteria: Optional[str] = Field(None, description="How to know when achieved")
    status: str = Field("active", description="Initiative status: active, paused, completed, archived")
    target_date: Optional[date] = Field(None, description="Target completion date")


class InitiativeCreate(InitiativeBase):
    """Model for creating a new initiative."""
    pass


class InitiativeUpdate(BaseModel):
    """Model for updating an initiative (all fields optional)."""
    name: Optional[str] = None
    description: Optional[str] = None
    success_criteria: Optional[str] = None
    status: Optional[str] = None
    target_date: Optional[date] = None


class Initiative(InitiativeBase):
    """Full initiative model with all fields."""
    id: UUID
    user_id: UUID
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    # Integration fields
    source: str = "manual"
    external_id: Optional[str] = None
    external_url: Optional[str] = None
    sync_enabled: bool = False
    last_synced_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


# ============================================
# PROJECT-INITIATIVE LINK
# ============================================

class ProjectInitiativeLink(BaseModel):
    """Link between a project and an initiative."""
    project_id: UUID
    initiative_id: UUID
    created_at: datetime
    
    class Config:
        from_attributes = True


# ============================================
# EXTENDED MODELS (with relationships)
# ============================================

class ProjectWithInitiatives(Project):
    """Project with linked initiatives."""
    initiatives: List[Initiative] = []


class InitiativeWithProjects(Initiative):
    """Initiative with linked projects."""
    projects: List[Project] = []

