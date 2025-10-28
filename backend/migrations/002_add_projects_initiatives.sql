-- Migration: Add Projects and Initiatives Tables
-- Date: 2025-10-28
-- Description: Add project and initiative tracking with support for future integrations

-- ============================================
-- PROJECTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Project Details
    name TEXT NOT NULL,
    description TEXT,
    goal TEXT, -- What success looks like for this project
    status VARCHAR(50) DEFAULT 'active', -- active, paused, completed, archived
    
    -- Timeline
    start_date DATE,
    deadline DATE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Integration Support (for future Linear, Notion, etc.)
    source VARCHAR(50) DEFAULT 'manual', -- manual, linear, notion, asana, etc.
    external_id TEXT, -- ID from external system
    external_url TEXT, -- Link to external project
    sync_enabled BOOLEAN DEFAULT false,
    last_synced_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_external_id ON projects(external_id);

-- Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can only access their own projects" ON projects;
CREATE POLICY "Users can only access their own projects"
    ON projects FOR ALL
    USING (auth.uid() = user_id);


-- ============================================
-- INITIATIVES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS initiatives (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Initiative Details
    name TEXT NOT NULL,
    description TEXT,
    success_criteria TEXT, -- How to know when this is achieved
    status VARCHAR(50) DEFAULT 'active', -- active, paused, completed, archived
    
    -- Timeline
    target_date DATE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Integration Support
    source VARCHAR(50) DEFAULT 'manual',
    external_id TEXT,
    external_url TEXT,
    sync_enabled BOOLEAN DEFAULT false,
    last_synced_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_initiatives_user_id ON initiatives(user_id);
CREATE INDEX IF NOT EXISTS idx_initiatives_status ON initiatives(status);

-- Row Level Security
ALTER TABLE initiatives ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can only access their own initiatives" ON initiatives;
CREATE POLICY "Users can only access their own initiatives"
    ON initiatives FOR ALL
    USING (auth.uid() = user_id);


-- ============================================
-- PROJECT-INITIATIVE LINK TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS project_initiatives (
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    initiative_id UUID NOT NULL REFERENCES initiatives(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (project_id, initiative_id)
);

CREATE INDEX IF NOT EXISTS idx_project_initiatives_project ON project_initiatives(project_id);
CREATE INDEX IF NOT EXISTS idx_project_initiatives_initiative ON project_initiatives(initiative_id);

-- Row Level Security
ALTER TABLE project_initiatives ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can only access their own project-initiative links" ON project_initiatives;
CREATE POLICY "Users can only access their own project-initiative links"
    ON project_initiatives FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = project_initiatives.project_id 
            AND projects.user_id = auth.uid()
        )
    );

