# COSOS Action Plan: What to Build Next

**Updated:** 2025-11-16  
**Approach:** Prompt-Driven Artifact Generation

---

## 🎯 The Goal

Build an MVP where:
1. User describes what they need (in natural language)
2. COSOS generates a specific, actionable artifact in 10 seconds
3. User gets immediate value (even without integrations)
4. User connects tools to make it live with real data

---

## 📋 Phase 1: Foundation (Week 1-2)

### 1. New Onboarding Flow (Frontend)
**Location:** `app/src/app/onboarding/`

**What to build:**
- Screen 1: Welcome (simple, clean)
- Screen 2: Quick Context (3 questions: stage, goal, challenge)
- Screen 3: The Prompt (large text area with examples)
- Screen 4: Loading state (5-10 second animation)
- Screen 5: Generated artifact display

**Files to create/modify:**
- `app/src/app/onboarding/page.tsx` (replace current 2-step flow)
- `app/src/components/onboarding/PromptScreen.tsx` (new)
- `app/src/components/onboarding/LoadingScreen.tsx` (new)
- `app/src/components/artifacts/ArtifactDisplay.tsx` (new)

---

### 2. Artifact Generation Service (Backend)
**Location:** `backend/services/`

**What to build:**
- Prompt processing service (parse user intent)
- Artifact generation service (LLM-powered)
- Template system (MRR tracker, retention analysis, etc.)
- Output formatting (structured JSON → clean display)

**Files to create:**
- `backend/services/prompt_service.py` (new)
- `backend/services/artifact_service.py` (new)
- `backend/templates/` (new directory)
  - `mrr_tracker_template.py`
  - `retention_analysis_template.py`
  - `board_prep_template.py`
  - `dashboard_template.py`

**API endpoints to create:**
- `POST /api/v1/artifacts/generate` (takes prompt, returns artifact)
- `GET /api/v1/artifacts/{id}` (retrieve saved artifact)
- `PUT /api/v1/artifacts/{id}` (update artifact)

---

### 3. Database Schema Updates
**Location:** `backend/database/`

**What to add:**
- `artifacts` table (stores generated artifacts)
- `prompts` table (stores user prompts for learning)

**Schema:**
```sql
CREATE TABLE artifacts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  type VARCHAR(50), -- 'mrr_tracker', 'retention_analysis', etc.
  title VARCHAR(255),
  prompt TEXT,
  content JSONB, -- the generated artifact structure
  metadata JSONB, -- stage, goal, integrations_required, etc.
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE prompts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  prompt TEXT,
  artifact_id UUID REFERENCES artifacts(id),
  created_at TIMESTAMP
);
```

**Files to create/modify:**
- `backend/database/migrations/add_artifacts_tables.sql` (new)
- `backend/models/artifact.py` (new)

---

### 4. Artifact Templates (LLM Prompts)
**Location:** `backend/templates/`

**What to build:**
Create LLM prompt templates for common artifacts:

**Example: MRR Tracker Template**
```python
def generate_mrr_tracker(user_context, user_prompt):
    """
    Generates an MRR Growth Tracker artifact.
    
    Args:
        user_context: {stage, goal, challenge}
        user_prompt: User's natural language request
    
    Returns:
        Structured artifact JSON
    """
    system_prompt = """
    You are COSOS, an AI operating partner for founders.
    Generate a detailed MRR Growth Tracker based on the user's request.
    
    Include:
    - Current state (estimated from stage)
    - Target (from user's prompt)
    - The path (monthly milestones)
    - Reality check (is this achievable?)
    - Monitoring plan (what metrics to watch)
    - Alert rules (when to notify)
    - Next actions (connect Stripe, etc.)
    
    Output as structured JSON.
    """
    
    # Call LLM with system_prompt + user_context + user_prompt
    # Parse response into structured format
    # Return artifact
```

**Templates to create:**
1. MRR Tracker
2. Retention Analysis
3. Board Meeting Prep
4. Activation Funnel Monitor
5. Product Velocity Dashboard
6. Customer Feedback Analyzer
7. Operating System Blueprint (optional)

---

## 📋 Phase 2: Activation (Week 3-4)

### 5. Integration CTAs
**Location:** `app/src/components/artifacts/`

**What to build:**
- Contextual integration prompts (based on artifact type)
- OAuth flow for Stripe, Posthog
- Data sync status indicators

**Files to create:**
- `app/src/components/artifacts/IntegrationCTA.tsx` (new)
- `app/src/components/integrations/StripeConnect.tsx` (new)
- `app/src/components/integrations/PosthogConnect.tsx` (new)

---

### 6. Live Data Updates
**Location:** `backend/services/`

**What to build:**
- Data normalization layer (Stripe → standard format)
- Artifact update service (refresh with real data)
- Webhook handlers (for real-time updates)

**Files to create:**
- `backend/services/data_normalization.py` (new)
- `backend/services/artifact_updater.py` (new)
- `backend/routes/webhooks.py` (new)

---

### 7. Dashboard
**Location:** `app/src/app/dashboard/`

**What to build:**
- Replace current brief-focused dashboard
- Show saved artifacts as cards
- "Create new artifact" prominent CTA
- Recent insights feed

**Files to modify:**
- `app/src/app/dashboard/page.tsx` (major refactor)
- `app/src/components/dashboard/ArtifactCard.tsx` (new)
- `app/src/components/dashboard/CreateArtifactButton.tsx` (new)

---

## 🎯 What to Build FIRST (This Week)

### Priority 1: Onboarding Flow (Frontend)
Start here because it's the user's first experience.

**Tasks:**
1. Create new onboarding screens (3 screens + prompt + loading + output)
2. Wire up to backend API (even if backend returns mock data initially)
3. Test the flow end-to-end

### Priority 2: Artifact Generation Service (Backend)
This is the core magic.

**Tasks:**
1. Create prompt processing service
2. Build ONE template (MRR Tracker) end-to-end
3. Test LLM generation quality
4. Create API endpoint

### Priority 3: Database Schema
Foundation for everything.

**Tasks:**
1. Create migration for artifacts table
2. Create Artifact model
3. Test CRUD operations

---

## 📊 Success Criteria for MVP

- [ ] User can complete onboarding in <2 minutes
- [ ] User can prompt "Track our path to $100k MRR" and get a structured tracker
- [ ] Generated artifact shows specific numbers, timelines, and logic
- [ ] User can save artifact to dashboard
- [ ] User can connect Stripe and see real data populate the tracker
- [ ] User can generate multiple different artifacts

---

## 🚀 Next Steps (Right Now)

1. **Review this plan** - Does it make sense? Any questions?
2. **Choose starting point** - Onboarding flow or backend service?
3. **Start building** - I can help with any of these components

What would you like to tackle first?

