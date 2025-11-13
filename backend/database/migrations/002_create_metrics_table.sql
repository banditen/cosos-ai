-- Create metrics table for tracking user KPIs
CREATE TABLE IF NOT EXISTS metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Metric Details
    name TEXT NOT NULL,
    current_value TEXT,
    target_value TEXT,
    unit TEXT,
    source TEXT CHECK (source IN ('manual', 'stripe', 'linear', 'calculated')) DEFAULT 'manual',
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own metrics"
    ON metrics FOR ALL
    USING (user_id = auth.uid());

-- Index for faster queries
CREATE INDEX metrics_user_id_idx ON metrics(user_id);
CREATE INDEX metrics_created_at_idx ON metrics(created_at DESC);

