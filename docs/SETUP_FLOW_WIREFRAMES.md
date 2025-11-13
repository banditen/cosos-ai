# COSOS Setup Flow - Wireframes & Product Spec

**Last Updated:** November 13, 2025  
**Status:** Design Phase  
**Goal:** Help founders define their business structure (projects, metrics, goals) in 15-20 minutes

---

## 🎯 Product Requirements

### User Story
> "As a founder, I want to quickly set up COSOS with my key projects and metrics, so that I can start getting relevant daily insights immediately."

### Success Criteria
- ✅ Setup completion rate > 85%
- ✅ Time to complete < 20 minutes
- ✅ 3-5 projects defined per user
- ✅ 3-5 metrics defined per user
- ✅ User reports "clarity on priorities" > 90%

### Out of Scope (v1)
- Team collaboration features
- Custom metric formulas
- Advanced project dependencies
- Bulk import from other tools

---

## 📱 User Flow Overview

```
1. Welcome & Context (2-3 min)
   ↓
2. Define Projects (5-7 min)
   ↓
3. Define Metrics (3-5 min)
   ↓
4. Review & Confirm (2-3 min)
   ↓
5. First Insight (Generated immediately)
```

---

## 🎨 Wireframes

### Screen 1: Welcome

```
┌─────────────────────────────────────────────┐
│                                             │
│              COSOS                          │
│                                             │
│     Let's set up your command center        │
│                                             │
│  In the next 15 minutes, we'll help you:   │
│                                             │
│  ✓ Map your key projects                   │
│  ✓ Define your success metrics             │
│  ✓ Generate your first insight             │
│                                             │
│  You already have Gmail, Calendar, and      │
│  Linear connected. We'll use that data      │
│  to give you immediate value.               │
│                                             │
│                                             │
│         [Continue →]                        │
│                                             │
└─────────────────────────────────────────────┘
```

**Technical Notes:**
- Check if user has integrations connected
- Show connected integrations dynamically
- Track setup start time for analytics

---

### Screen 2: Business Context

```
┌─────────────────────────────────────────────┐
│  ← Back                            Step 1/4 │
├─────────────────────────────────────────────┤
│                                             │
│  Tell us about your business                │
│                                             │
│  What are you building?                     │
│  ┌─────────────────────────────────────┐   │
│  │ We're building...                   │   │
│  │                                     │   │
│  │                                     │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  What does success look like in 6 months?  │
│  ┌─────────────────────────────────────┐   │
│  │ In 6 months, we'll have...          │   │
│  │                                     │   │
│  │                                     │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  What's your biggest challenge right now?  │
│  ┌─────────────────────────────────────┐   │
│  │ Our biggest challenge is...         │   │
│  │                                     │   │
│  └─────────────────────────────────────┘   │
│                                             │
│                                             │
│                        [Continue →]         │
│                                             │
└─────────────────────────────────────────────┘
```

**Technical Notes:**
- Save to `user_context` table: `business_mission`, `success_criteria`, `current_challenges`
- Use AI to parse and suggest projects/metrics in next steps
- Allow skip on optional fields

---

### Screen 3: Define Projects

```
┌─────────────────────────────────────────────┐
│  ← Back                            Step 2/4 │
├─────────────────────────────────────────────┤
│                                             │
│  Your Key Projects                          │
│                                             │
│  What are the 3-5 major things you're       │
│  working on right now?                      │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ 📋 Launch MVP                       │   │
│  │ Goal: Ship to first 10 customers    │   │
│  │ Target: March 2026          [Edit]  │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ 💰 Raise Pre-Seed                   │   │
│  │ Goal: $500k at $5M cap              │   │
│  │ Target: Q1 2026             [Edit]  │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  [+ Add Project]                            │
│                                             │
│  💡 We found 3 projects in Linear.          │
│     [Import from Linear]                    │
│                                             │
│                        [Continue →]         │
│                                             │
└─────────────────────────────────────────────┘
```

**Technical Notes:**
- Use existing `projects` table
- AI suggests projects based on business context
- If Linear connected, show import option
- Minimum 1 project, maximum 7 projects
- Each project: name, goal, deadline (optional)

---

### Screen 4: Define Metrics

```
┌─────────────────────────────────────────────┐
│  ← Back                            Step 3/4 │
├─────────────────────────────────────────────┤
│                                             │
│  Your Success Metrics                       │
│                                             │
│  What 3-5 numbers tell you if you're        │
│  winning?                                   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ 💵 MRR                              │   │
│  │ Current: $0  →  Target: $10,000     │   │
│  │ Source: Stripe (auto-tracked) [Edit]│   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ 👥 Waitlist Signups                 │   │
│  │ Current: 47  →  Target: 1,000       │   │
│  │ Source: Manual              [Edit]  │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  [+ Add Metric]                             │
│                                             │
│  Common metrics:                            │
│  [+ MRR] [+ Active Users] [+ Runway]        │
│                                             │
│                        [Continue →]         │
│                                             │
└─────────────────────────────────────────────┘
```

**Technical Notes:**
- Create new `metrics` table (see schema below)
- AI suggests metrics based on business context
- If Stripe connected, auto-populate MRR
- If Linear connected, suggest "Issues Closed/Week"
- Minimum 1 metric, maximum 7 metrics

---

## 🗄️ Database Schema Addition

We need to add a `metrics` table to complement existing `projects`:

```sql
CREATE TABLE metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Metric details
    name TEXT NOT NULL,
    description TEXT,
    unit TEXT, -- "USD", "users", "count", "percentage"
    
    -- Values
    current_value DECIMAL,
    target_value DECIMAL,
    
    -- Data source
    source VARCHAR(50) DEFAULT 'manual', -- manual, stripe, linear, calculated
    source_config JSONB, -- Config for auto-tracking
    
    -- Display
    display_format VARCHAR(20) DEFAULT 'number', -- number, currency, percentage
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_metrics_user_id ON metrics(user_id);
ALTER TABLE metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own metrics"
    ON metrics FOR ALL USING (auth.uid() = user_id);
```

---

## 🔧 Technical Implementation Plan

### Phase 1: Backend (Week 1)
1. Create `metrics` table migration
2. Build API endpoints:
   - `POST /api/v1/setup/context` - Save business context
   - `GET/POST /api/v1/projects` - CRUD for projects
   - `GET/POST /api/v1/metrics` - CRUD for metrics
   - `POST /api/v1/setup/complete` - Mark setup as done
3. Add AI suggestion logic for projects/metrics

### Phase 2: Frontend (Week 1-2)
4. Build multi-step wizard component
5. Create project card component (add/edit/delete)
6. Create metric card component (add/edit/delete)
7. Add Linear import functionality
8. Add Stripe auto-populate for MRR

### Phase 3: Intelligence (Week 2)
9. Update brief generation to use projects/metrics
10. Generate "first insight" immediately after setup
11. Show project progress in dashboard

---

## 📊 Analytics & Tracking

Track these events:
- `setup_started`
- `setup_step_completed` (with step number)
- `setup_abandoned` (with last step)
- `setup_completed` (with time taken)
- `project_added` (manual vs AI-suggested)
- `metric_added` (manual vs auto-populated)

---

## 🚀 Next Steps

1. Review wireframes with team
2. Create database migration for `metrics` table
3. Build API endpoints
4. Implement frontend wizard
5. Test with 5 beta users
6. Iterate based on feedback

