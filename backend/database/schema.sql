-- COSOS Database Schema
-- MVP: Context-aware AI Chief of Staff

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ============================================
-- USERS & AUTHENTICATION
-- ============================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    timezone VARCHAR(50) DEFAULT 'UTC',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    
    -- Preferences
    brief_time TIME DEFAULT '07:00:00', -- When to send daily brief
    brief_email_enabled BOOLEAN DEFAULT true,
    brief_slack_enabled BOOLEAN DEFAULT false,
    slack_webhook_url TEXT
);

-- Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own data"
    ON users FOR ALL
    USING (auth.uid() = id);

-- ============================================
-- USER CONTEXT (Business info, goals, style)
-- ============================================

CREATE TABLE user_context (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Business Context
    business_mission TEXT, -- Mission statement / what they're building
    business_stage VARCHAR(50), -- idea, mvp, growth, scale
    key_metrics JSONB, -- Array of metrics they care about
    
    -- Audience & Market
    target_audience JSONB, -- Array of customer profiles
    value_propositions JSONB, -- Key value props
    competitive_positioning TEXT,
    
    -- Communication Style
    brand_voice TEXT, -- Voice guidelines
    tone_preference VARCHAR(50), -- formal, casual, etc.
    writing_examples JSONB, -- Array of example content
    
    -- Current Focus
    quarterly_goals JSONB, -- Top 3 goals this quarter
    current_challenges JSONB, -- Biggest blockers
    success_criteria TEXT, -- What success looks like
    
    -- Embeddings for RAG
    context_embedding vector(1536), -- OpenAI ada-002 embedding
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE user_context ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own context"
    ON user_context FOR ALL
    USING (user_id = auth.uid());

-- Index for vector similarity search
CREATE INDEX user_context_embedding_idx ON user_context
USING ivfflat (context_embedding vector_cosine_ops);

-- ============================================
-- PROJECTS & INITIATIVES
-- ============================================

CREATE TABLE projects (
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

CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_external_id ON projects(external_id);

-- Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own projects"
    ON projects FOR ALL
    USING (auth.uid() = user_id);


CREATE TABLE initiatives (
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

CREATE INDEX idx_initiatives_user_id ON initiatives(user_id);
CREATE INDEX idx_initiatives_status ON initiatives(status);

-- Row Level Security
ALTER TABLE initiatives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own initiatives"
    ON initiatives FOR ALL
    USING (auth.uid() = user_id);


-- Link projects to initiatives (many-to-many)
CREATE TABLE project_initiatives (
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    initiative_id UUID NOT NULL REFERENCES initiatives(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (project_id, initiative_id)
);

CREATE INDEX idx_project_initiatives_project ON project_initiatives(project_id);
CREATE INDEX idx_project_initiatives_initiative ON project_initiatives(initiative_id);

-- Row Level Security
ALTER TABLE project_initiatives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own project-initiative links"
    ON project_initiatives FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = project_initiatives.project_id
            AND projects.user_id = auth.uid()
        )
    );


-- ============================================
-- INTEGRATIONS (OAuth tokens)
-- ============================================

CREATE TABLE integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL, -- gmail, google_calendar, slack
    
    -- OAuth tokens (encrypted by Supabase)
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    token_expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    scope TEXT, -- OAuth scopes granted
    account_email VARCHAR(255), -- Connected account email
    
    is_active BOOLEAN DEFAULT true,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, provider)
);

ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own integrations"
    ON integrations FOR ALL
    USING (user_id = auth.uid());

-- ============================================
-- EMAILS (Synced from Gmail)
-- ============================================

CREATE TABLE emails (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Gmail metadata
    gmail_id VARCHAR(255) UNIQUE NOT NULL,
    thread_id VARCHAR(255),
    
    -- Email content
    subject TEXT,
    from_email VARCHAR(255),
    from_name VARCHAR(255),
    to_emails JSONB, -- Array of recipients
    cc_emails JSONB,
    body_text TEXT,
    body_html TEXT,
    
    -- Metadata
    received_at TIMESTAMP WITH TIME ZONE,
    labels JSONB, -- Gmail labels
    is_read BOOLEAN DEFAULT false,
    is_important BOOLEAN DEFAULT false,
    has_attachments BOOLEAN DEFAULT false,
    
    -- AI Analysis
    summary TEXT, -- AI-generated summary
    action_items JSONB, -- Extracted tasks
    priority_score INTEGER, -- 1-5, AI-determined priority
    category VARCHAR(50), -- customer, investor, team, etc.
    
    -- Embeddings
    content_embedding vector(1536),
    
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own emails"
    ON emails FOR ALL
    USING (user_id = auth.uid());

-- Indexes
CREATE INDEX emails_user_id_idx ON emails(user_id);
CREATE INDEX emails_received_at_idx ON emails(received_at DESC);
CREATE INDEX emails_gmail_id_idx ON emails(gmail_id);
CREATE INDEX emails_embedding_idx ON emails 
USING ivfflat (content_embedding vector_cosine_ops);

-- ============================================
-- CALENDAR EVENTS (Synced from Google Calendar)
-- ============================================

CREATE TABLE calendar_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Google Calendar metadata
    gcal_id VARCHAR(255) UNIQUE NOT NULL,
    calendar_id VARCHAR(255),
    
    -- Event details
    title TEXT,
    description TEXT,
    location TEXT,
    
    -- Timing
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    is_all_day BOOLEAN DEFAULT false,
    timezone VARCHAR(50),
    
    -- Participants
    attendees JSONB, -- Array of attendees
    organizer_email VARCHAR(255),
    
    -- Metadata
    status VARCHAR(50), -- confirmed, tentative, cancelled
    is_recurring BOOLEAN DEFAULT false,
    recurrence_rule TEXT,
    
    -- AI Analysis
    event_type VARCHAR(50), -- meeting, focus_time, personal, etc.
    importance_score INTEGER, -- 1-5
    
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own calendar"
    ON calendar_events FOR ALL
    USING (user_id = auth.uid());

-- Indexes
CREATE INDEX calendar_events_user_id_idx ON calendar_events(user_id);
CREATE INDEX calendar_events_start_time_idx ON calendar_events(start_time);
CREATE INDEX calendar_events_gcal_id_idx ON calendar_events(gcal_id);

-- ============================================
-- DAILY BRIEFS (Generated by agent)
-- ============================================

CREATE TABLE daily_briefs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Brief date
    brief_date DATE NOT NULL,
    
    -- Generated content
    top_priorities JSONB, -- Array of {task, reasoning, estimated_time}
    time_blocks JSONB, -- Suggested focus time blocks
    quick_wins JSONB, -- Tasks < 15 min
    flags JSONB, -- Urgent items needing attention
    
    -- Full brief text
    brief_text TEXT, -- Formatted brief for email
    brief_html TEXT, -- HTML version for web
    
    -- Metadata
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sent_at TIMESTAMP WITH TIME ZONE,
    viewed_at TIMESTAMP WITH TIME ZONE,
    
    -- Agent reasoning (for debugging)
    agent_reasoning JSONB,
    
    UNIQUE(user_id, brief_date)
);

ALTER TABLE daily_briefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own briefs"
    ON daily_briefs FOR ALL
    USING (user_id = auth.uid());

-- Indexes
CREATE INDEX daily_briefs_user_id_idx ON daily_briefs(user_id);
CREATE INDEX daily_briefs_date_idx ON daily_briefs(brief_date DESC);

-- ============================================
-- LINEAR INTEGRATION
-- ============================================

CREATE TABLE linear_issues (
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

    -- AI Analysis
    priority_score INTEGER, -- 1-5, AI-determined priority
    estimated_time INTEGER, -- Minutes

    -- Sync metadata
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE linear_issues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own Linear issues"
    ON linear_issues FOR ALL
    USING (user_id = auth.uid());

-- Indexes
CREATE INDEX linear_issues_user_id_idx ON linear_issues(user_id);
CREATE INDEX linear_issues_linear_id_idx ON linear_issues(linear_id);
CREATE INDEX linear_issues_assignee_idx ON linear_issues(assignee_id);
CREATE INDEX linear_issues_state_type_idx ON linear_issues(state_type);
CREATE INDEX linear_issues_updated_at_idx ON linear_issues(updated_at_linear DESC);

-- ============================================
-- LINEAR PROJECTS
-- ============================================

CREATE TABLE linear_projects (
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

    -- Sync metadata
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE linear_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own Linear projects"
    ON linear_projects FOR ALL
    USING (user_id = auth.uid());

-- Indexes
CREATE INDEX linear_projects_user_id_idx ON linear_projects(user_id);
CREATE INDEX linear_projects_linear_id_idx ON linear_projects(linear_id);
CREATE INDEX linear_projects_state_idx ON linear_projects(state);

-- ============================================
-- FEEDBACK (User corrections to agent decisions)
-- ============================================

CREATE TABLE feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    brief_id UUID REFERENCES daily_briefs(id) ON DELETE CASCADE,

    -- What was the feedback about?
    feedback_type VARCHAR(50), -- priority_correction, time_block_adjustment, etc.

    -- Original vs corrected
    original_value JSONB,
    corrected_value JSONB,
    user_note TEXT, -- Optional explanation

    -- Embeddings for learning
    feedback_embedding vector(1536),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own feedback"
    ON feedback FOR ALL
    USING (user_id = auth.uid());

-- Indexes
CREATE INDEX feedback_user_id_idx ON feedback(user_id);
CREATE INDEX feedback_brief_id_idx ON feedback(brief_id);
CREATE INDEX feedback_embedding_idx ON feedback
USING ivfflat (feedback_embedding vector_cosine_ops);

-- ============================================
-- AUDIT LOG (Track all important actions)
-- ============================================

CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Action details
    action VARCHAR(100) NOT NULL, -- login, email_sync, brief_generated, etc.
    resource_type VARCHAR(50), -- email, calendar, brief, etc.
    resource_id UUID,
    
    -- Request metadata
    ip_address INET,
    user_agent TEXT,
    
    -- Result
    status VARCHAR(20), -- success, failure
    error_message TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- No RLS on audit log (admin only)
CREATE INDEX audit_log_user_id_idx ON audit_log(user_id);
CREATE INDEX audit_log_created_at_idx ON audit_log(created_at DESC);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_context_updated_at BEFORE UPDATE ON user_context
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_integrations_updated_at BEFORE UPDATE ON integrations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

