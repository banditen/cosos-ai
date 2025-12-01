-- Migration: Create artifacts and prompts tables
-- Date: 2025-11-16
-- Description: Add support for prompt-driven artifact generation

-- Artifacts table: stores generated artifacts (trackers, dashboards, analyses, etc.)
CREATE TABLE IF NOT EXISTS artifacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Artifact metadata
    type VARCHAR(50) NOT NULL, -- 'mrr_tracker', 'retention_analysis', 'board_prep', etc.
    title VARCHAR(255) NOT NULL,
    description TEXT,

    -- User input
    prompt TEXT NOT NULL, -- The original user prompt
    context JSONB, -- User context from onboarding (stage, goal, challenge)

    -- Generated content
    content JSONB NOT NULL, -- The structured artifact data
    metadata JSONB, -- Additional metadata (integrations_required, etc.)

    -- Conversation history for artifact refinement
    conversation_history JSONB, -- Array of {role, content} messages

    -- Status
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'archived', 'deleted'

    -- Integration status
    integrations_connected TEXT[], -- Array of connected integration names
    last_synced_at TIMESTAMP,

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Prompts table: stores all user prompts for learning and analytics
CREATE TABLE IF NOT EXISTS prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Prompt data
    prompt TEXT NOT NULL,
    context JSONB, -- User context at time of prompt
    
    -- Result
    artifact_id UUID REFERENCES artifacts(id) ON DELETE SET NULL,
    artifact_type VARCHAR(50), -- What type of artifact was generated
    
    -- Success tracking
    was_successful BOOLEAN DEFAULT true,
    error_message TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW()
);

-- Artifact updates table: tracks changes to artifacts over time
CREATE TABLE IF NOT EXISTS artifact_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artifact_id UUID NOT NULL REFERENCES artifacts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Update data
    update_type VARCHAR(50) NOT NULL, -- 'manual_edit', 'data_refresh', 'integration_sync'
    changes JSONB, -- What changed
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_artifacts_user_id ON artifacts(user_id);
CREATE INDEX IF NOT EXISTS idx_artifacts_type ON artifacts(type);
CREATE INDEX IF NOT EXISTS idx_artifacts_status ON artifacts(status);
CREATE INDEX IF NOT EXISTS idx_artifacts_created_at ON artifacts(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_prompts_user_id ON prompts(user_id);
CREATE INDEX IF NOT EXISTS idx_prompts_artifact_id ON prompts(artifact_id);
CREATE INDEX IF NOT EXISTS idx_prompts_created_at ON prompts(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_artifact_updates_artifact_id ON artifact_updates(artifact_id);
CREATE INDEX IF NOT EXISTS idx_artifact_updates_created_at ON artifact_updates(created_at DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at
CREATE TRIGGER update_artifacts_updated_at BEFORE UPDATE ON artifacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE artifact_updates ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- ARTIFACTS TABLE POLICIES
-- ============================================================================

-- Policy: Users can view their own artifacts
CREATE POLICY "Users can view their own artifacts"
    ON artifacts
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own artifacts
CREATE POLICY "Users can insert their own artifacts"
    ON artifacts
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own artifacts
CREATE POLICY "Users can update their own artifacts"
    ON artifacts
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own artifacts
CREATE POLICY "Users can delete their own artifacts"
    ON artifacts
    FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================================
-- PROMPTS TABLE POLICIES
-- ============================================================================

-- Policy: Users can view their own prompts
CREATE POLICY "Users can view their own prompts"
    ON prompts
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own prompts
CREATE POLICY "Users can insert their own prompts"
    ON prompts
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own prompts (for analytics)
CREATE POLICY "Users can update their own prompts"
    ON prompts
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- ARTIFACT_UPDATES TABLE POLICIES
-- ============================================================================

-- Policy: Users can view updates for their own artifacts
CREATE POLICY "Users can view their own artifact updates"
    ON artifact_updates
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert updates for their own artifacts
CREATE POLICY "Users can insert their own artifact updates"
    ON artifact_updates
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can view updates for artifacts they own (via artifact_id)
CREATE POLICY "Users can view updates for their artifacts"
    ON artifact_updates
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM artifacts
            WHERE artifacts.id = artifact_updates.artifact_id
            AND artifacts.user_id = auth.uid()
        )
    );

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant authenticated users access to tables
GRANT SELECT, INSERT, UPDATE, DELETE ON artifacts TO authenticated;
GRANT SELECT, INSERT, UPDATE ON prompts TO authenticated;
GRANT SELECT, INSERT ON artifact_updates TO authenticated;

-- Grant usage on sequences (for auto-increment IDs if needed)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
