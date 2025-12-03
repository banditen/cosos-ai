-- Migration: Create Context Layer tables
-- Date: 2025-12-03
-- Description: Add tables for business context intelligence layer

-- KNOWLEDGE SOURCES (Connected knowledge bases)
CREATE TABLE IF NOT EXISTS knowledge_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    external_id VARCHAR(255),
    external_url TEXT,
    status VARCHAR(20) DEFAULT 'active',
    last_synced_at TIMESTAMP WITH TIME ZONE,
    sync_error TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_knowledge_sources_user_id ON knowledge_sources(user_id);
ALTER TABLE knowledge_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own knowledge sources" ON knowledge_sources FOR ALL USING (auth.uid() = user_id);

-- CONTEXT DOCUMENTS (Synced content from sources)
CREATE TABLE IF NOT EXISTS context_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    source_id UUID REFERENCES knowledge_sources(id) ON DELETE CASCADE,
    title VARCHAR(500),
    type VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    content_hash VARCHAR(64),
    external_id VARCHAR(255),
    external_url TEXT,
    is_active BOOLEAN DEFAULT true,
    source_updated_at TIMESTAMP WITH TIME ZONE,
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_context_documents_user_id ON context_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_context_documents_source_id ON context_documents(source_id);
ALTER TABLE context_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own context documents" ON context_documents FOR ALL USING (auth.uid() = user_id);

-- CONTEXT EMBEDDINGS (Vector embeddings for RAG)
CREATE TABLE IF NOT EXISTS context_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    source_type VARCHAR(50) NOT NULL,
    source_id UUID NOT NULL,
    chunk_index INTEGER DEFAULT 0,
    chunk_text TEXT NOT NULL,
    embedding vector(1536),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_context_embeddings_user_id ON context_embeddings(user_id);
CREATE INDEX IF NOT EXISTS idx_context_embeddings_source ON context_embeddings(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_context_embeddings_vector ON context_embeddings USING ivfflat (embedding vector_cosine_ops);
ALTER TABLE context_embeddings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access their own embeddings" ON context_embeddings FOR ALL USING (auth.uid() = user_id);

-- SLACK MESSAGES (Synced from Slack)
CREATE TABLE IF NOT EXISTS slack_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    slack_ts VARCHAR(50) NOT NULL,
    channel_id VARCHAR(50) NOT NULL,
    channel_name VARCHAR(255),
    thread_ts VARCHAR(50),
    text TEXT NOT NULL,
    user_slack_id VARCHAR(50),
    user_name VARCHAR(255),
    message_type VARCHAR(50) DEFAULT 'message',
    has_attachments BOOLEAN DEFAULT false,
    reactions JSONB,
    summary TEXT,
    topics JSONB,
    is_decision BOOLEAN DEFAULT false,
    is_goal_related BOOLEAN DEFAULT false,
    sentiment VARCHAR(20),
    message_at TIMESTAMP WITH TIME ZONE NOT NULL,
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, slack_ts, channel_id)
);
CREATE INDEX IF NOT EXISTS idx_slack_messages_user_id ON slack_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_slack_messages_channel ON slack_messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_slack_messages_message_at ON slack_messages(message_at DESC);
ALTER TABLE slack_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access their own slack messages" ON slack_messages FOR ALL USING (auth.uid() = user_id);

-- BUSINESS GOALS (Extracted from context)
CREATE TABLE IF NOT EXISTS business_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    type VARCHAR(50),
    parent_goal_id UUID REFERENCES business_goals(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'active',
    progress FLOAT DEFAULT 0,
    target_date DATE,
    completed_at TIMESTAMP WITH TIME ZONE,
    source_type VARCHAR(50),
    source_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_business_goals_user_id ON business_goals(user_id);
ALTER TABLE business_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own goals" ON business_goals FOR ALL USING (auth.uid() = user_id);

-- DECISIONS (Tracked decisions with context)
CREATE TABLE IF NOT EXISTS decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    rationale TEXT,
    status VARCHAR(50) DEFAULT 'made',
    outcome TEXT,
    related_goals JSONB,
    source_type VARCHAR(50),
    source_id UUID,
    decided_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_decisions_user_id ON decisions(user_id);
ALTER TABLE decisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own decisions" ON decisions FOR ALL USING (auth.uid() = user_id);

-- CONTEXT CONVERSATIONS (Q&A history)
CREATE TABLE IF NOT EXISTS context_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255),
    messages JSONB NOT NULL DEFAULT '[]',
    context_used JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_context_conversations_user_id ON context_conversations(user_id);
ALTER TABLE context_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own conversations" ON context_conversations FOR ALL USING (auth.uid() = user_id);

-- AGENTS (User-created specialized agents)
CREATE TABLE IF NOT EXISTS agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    system_prompt TEXT,
    integrations JSONB DEFAULT '[]',
    knowledge_sources JSONB DEFAULT '[]',
    model VARCHAR(50) DEFAULT 'gpt-4o-mini',
    temperature FLOAT DEFAULT 0.7,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_agents_user_id ON agents(user_id);
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own agents" ON agents FOR ALL USING (auth.uid() = user_id);

-- GRANTS
GRANT SELECT, INSERT, UPDATE, DELETE ON knowledge_sources TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON context_documents TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON context_embeddings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON slack_messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON business_goals TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON decisions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON context_conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON agents TO authenticated;

-- TRIGGERS
CREATE TRIGGER update_knowledge_sources_updated_at BEFORE UPDATE ON knowledge_sources FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_context_documents_updated_at BEFORE UPDATE ON context_documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_business_goals_updated_at BEFORE UPDATE ON business_goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_decisions_updated_at BEFORE UPDATE ON decisions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_context_conversations_updated_at BEFORE UPDATE ON context_conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON agents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- VECTOR SIMILARITY SEARCH FUNCTION
CREATE OR REPLACE FUNCTION match_context_embeddings(
    query_embedding vector(1536),
    match_user_id UUID,
    match_count INT DEFAULT 10,
    match_threshold FLOAT DEFAULT 0.7
)
RETURNS TABLE (
    id UUID,
    source_type VARCHAR(50),
    source_id UUID,
    chunk_text TEXT,
    metadata JSONB,
    similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        ce.id,
        ce.source_type,
        ce.source_id,
        ce.chunk_text,
        ce.metadata,
        1 - (ce.embedding <=> query_embedding) AS similarity
    FROM context_embeddings ce
    WHERE ce.user_id = match_user_id
    AND 1 - (ce.embedding <=> query_embedding) > match_threshold
    ORDER BY ce.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;
