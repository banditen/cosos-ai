-- ============================================
-- LINEAR INTEGRATION
-- ============================================

CREATE TABLE IF NOT EXISTS linear_issues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Linear metadata
    linear_id VARCHAR(255) UNIQUE NOT NULL,
    linear_url TEXT,

    -- Issue details
    title TEXT NOT NULL,
    description TEXT,
    priority INTEGER, -- 0 = No priority, 1 = Urgent, 2 = High, 3 = Normal, 4 = Low

    -- Status
    state_id VARCHAR(255),
    state_name VARCHAR(100),
    state_type VARCHAR(50), -- started, unstarted, completed, canceled

    -- Assignment
    assignee_id VARCHAR(255),
    assignee_name VARCHAR(255),

    -- Project/Team
    team_id VARCHAR(255),
    team_name VARCHAR(255),
    project_id VARCHAR(255),
    project_name VARCHAR(255),

    -- Dates
    created_at_linear TIMESTAMP WITH TIME ZONE,
    updated_at_linear TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    canceled_at TIMESTAMP WITH TIME ZONE,
    due_date DATE,

    -- Metadata
    is_archived BOOLEAN DEFAULT false,
    labels JSONB, -- Array of label objects
    priority_score INTEGER, -- Linear's internal priority score
    estimated_time INTEGER, -- Estimated time in minutes

    -- Timestamps
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for linear_issues
CREATE INDEX IF NOT EXISTS idx_linear_issues_user_id ON linear_issues(user_id);
CREATE INDEX IF NOT EXISTS idx_linear_issues_linear_id ON linear_issues(linear_id);
CREATE INDEX IF NOT EXISTS idx_linear_issues_state_type ON linear_issues(state_type);
CREATE INDEX IF NOT EXISTS idx_linear_issues_assignee_id ON linear_issues(assignee_id);
CREATE INDEX IF NOT EXISTS idx_linear_issues_team_id ON linear_issues(team_id);
CREATE INDEX IF NOT EXISTS idx_linear_issues_project_id ON linear_issues(project_id);
CREATE INDEX IF NOT EXISTS idx_linear_issues_updated_at ON linear_issues(updated_at_linear);

-- Row Level Security for linear_issues
ALTER TABLE linear_issues ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own Linear issues" ON linear_issues;
CREATE POLICY "Users can view their own Linear issues"
    ON linear_issues FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own Linear issues" ON linear_issues;
CREATE POLICY "Users can insert their own Linear issues"
    ON linear_issues FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own Linear issues" ON linear_issues;
CREATE POLICY "Users can update their own Linear issues"
    ON linear_issues FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own Linear issues" ON linear_issues;
CREATE POLICY "Users can delete their own Linear issues"
    ON linear_issues FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- LINEAR PROJECTS
-- ============================================

CREATE TABLE IF NOT EXISTS linear_projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Linear metadata
    linear_id VARCHAR(255) UNIQUE NOT NULL,
    linear_url TEXT,

    -- Project details
    name TEXT NOT NULL,
    description TEXT,

    -- Status
    state VARCHAR(50), -- planned, started, paused, completed, canceled

    -- Team
    team_id VARCHAR(255),
    team_name VARCHAR(255),

    -- Dates
    start_date DATE,
    target_date DATE,
    completed_at TIMESTAMP WITH TIME ZONE,
    canceled_at TIMESTAMP WITH TIME ZONE,

    -- Progress
    progress FLOAT, -- 0.0 to 1.0

    -- Metadata
    is_archived BOOLEAN DEFAULT false,

    -- Timestamps
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for linear_projects
CREATE INDEX IF NOT EXISTS idx_linear_projects_user_id ON linear_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_linear_projects_linear_id ON linear_projects(linear_id);
CREATE INDEX IF NOT EXISTS idx_linear_projects_state ON linear_projects(state);
CREATE INDEX IF NOT EXISTS idx_linear_projects_team_id ON linear_projects(team_id);

-- Row Level Security for linear_projects
ALTER TABLE linear_projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own Linear projects" ON linear_projects;
CREATE POLICY "Users can view their own Linear projects"
    ON linear_projects FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own Linear projects" ON linear_projects;
CREATE POLICY "Users can insert their own Linear projects"
    ON linear_projects FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own Linear projects" ON linear_projects;
CREATE POLICY "Users can update their own Linear projects"
    ON linear_projects FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own Linear projects" ON linear_projects;
CREATE POLICY "Users can delete their own Linear projects"
    ON linear_projects FOR DELETE
    USING (auth.uid() = user_id);

