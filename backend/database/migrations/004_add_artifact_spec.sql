-- Migration: Add spec and phase columns to artifacts table
-- Date: 2025-12-01
-- Description: Support Product Spec-based artifact generation

-- Add spec column for Product Specification document (markdown)
ALTER TABLE artifacts ADD COLUMN IF NOT EXISTS spec TEXT;

-- Add phase column for tracking artifact creation phase
-- 'spec' = Product Spec document phase (being defined)
-- 'ui' = UI components generated from spec
ALTER TABLE artifacts ADD COLUMN IF NOT EXISTS phase VARCHAR(20) DEFAULT 'spec';

-- Ensure conversation_history column exists (may have been missing)
ALTER TABLE artifacts ADD COLUMN IF NOT EXISTS conversation_history JSONB;

-- Create index on phase for filtering
CREATE INDEX IF NOT EXISTS idx_artifacts_phase ON artifacts(phase);

-- Comment on new columns
COMMENT ON COLUMN artifacts.spec IS 'Product Specification document in markdown format - the source of truth for the artifact';
COMMENT ON COLUMN artifacts.phase IS 'Current phase of artifact creation: spec (defining requirements) or ui (components generated)';

-- IMPORTANT: After running this migration, you need to reload the PostgREST schema cache
-- In Supabase Dashboard: Go to Database > Extensions > Reload schema cache
-- Or run: NOTIFY pgrst, 'reload schema';

