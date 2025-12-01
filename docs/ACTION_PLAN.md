# COSOS Action Plan: What to Build Next

**Updated:** 2025-12-01
**Approach:** Product Spec-First Artifact Builder → Data Connections → AI Automation

---

## 🎯 The Refined Vision

**What users are asking for:**
- Goal setting & accountability systems
- Understanding and tracking KPIs
- Custom dashboards for their specific metrics
- Tools like ChartMogul, Notion, Airtable but tailored to their business

**What we're building:**
1. **Describe what you need** → AI creates a Product Spec through conversation
2. **Review and refine the spec** → Edit directly or chat to iterate
3. **Build from spec** → UI components generated from the spec
4. **Connect your data sources** → It populates with real data
5. **Set artifact live** → Appears on home dashboard
6. **AI agents automate execution** → Workflows run automatically (future)

**Value proposition:**
> "Build custom business tools in seconds. No-code dashboards, trackers, and systems that actually fit your business. Connect your data, automate with AI."

---

## 📊 Current State (Dec 1, 2025)

### ✅ What's Working
- Complete onboarding flow (7 screens)
- **Product Spec-based artifact creation** (two-phase: Spec → UI)
- **Conversational spec builder** at `/artifacts/new`
- LLM-powered spec generation with structured questions
- Component-based rendering (MetricCard, DataList, ProgressBar, InputForm, TextBlock, **Chart**)
- **Chart component** (line, bar, pie, area) using Recharts
- Artifact CRUD operations with spec and phase tracking
- Inline spec editing with markdown preview
- Chat panel for refining artifacts
- **Draft vs Live artifacts** (home shows only live)
- Database schema with RLS

### ⚠️ What's Missing
- "Set Live" button (to publish artifacts to home)
- Limited component library (need Table, Kanban, Timeline, etc.)
- No data persistence for user inputs
- Static artifacts (no live data updates)
- No templates library
- No integrations connected yet

---

## 🎯 The New Goal

Build an MVP where:
1. User describes what they need (in natural language)
2. Cosos generates a custom tool (dashboard, tracker, system) in 10 seconds
3. User can edit, customize, and add data manually
4. User gets immediate value (even without integrations)
5. Later: User connects tools to make it live with real data

---

## 📋 Phase 1: Flexible Artifact Builder (Weeks 1-2) ⭐ CURRENT FOCUS

**Goal:** Make artifacts powerful enough to replicate ChartMogul/Notion/Airtable basics

### Priority 1: Expand Component Library

**Current components (6):**
- ✅ MetricCard - Single KPI display
- ✅ DataList - Simple table
- ✅ ProgressBar - Visual progress
- ✅ InputForm - Data entry
- ✅ TextBlock - Instructions/content
- ✅ **Chart** - Line, bar, pie, area charts (Recharts)

**New components needed (7):**

---

#### 2. Table Component (Enhanced)
**Why:** DataList is too simple. Need sorting, filtering, pagination.

**Features:**
- Sortable columns
- Search/filter
- Pagination
- Row actions (edit, delete)
- Bulk selection

**Props:**
```typescript
{
  columns: Array<{key: string, label: string, sortable?: boolean}>,
  data: Array<Record<string, any>>,
  searchable?: boolean,
  pageSize?: number,
  onRowClick?: (row) => void
}
```

**Files to create:**
- `app/src/components/artifacts/Table.tsx`

---

#### 3. Kanban/Board Component
**Why:** For pipelines, roadmaps, task management (Notion/Airtable style).

**Features:**
- Drag-and-drop between columns
- Card customization
- Add new cards
- Column limits

**Props:**
```typescript
{
  columns: Array<{id: string, title: string, cards: Array<Card>}>,
  onCardMove?: (cardId, fromColumn, toColumn) => void,
  onCardClick?: (card) => void
}
```

**Files to create:**
- `app/src/components/artifacts/KanbanBoard.tsx`
- Use @dnd-kit/core for drag-drop

---

#### 4. Timeline Component
**Why:** For roadmaps, milestones, project planning.

**Features:**
- Gantt-style timeline
- Milestones
- Dependencies (optional)
- Date ranges

**Props:**
```typescript
{
  items: Array<{
    id: string,
    title: string,
    startDate: Date,
    endDate: Date,
    status: 'planned' | 'in-progress' | 'complete'
  }>,
  onItemClick?: (item) => void
}
```

**Files to create:**
- `app/src/components/artifacts/Timeline.tsx`

---

#### 5. Tabs/Sections Component
**Why:** Multi-section layouts for complex artifacts.

**Features:**
- Tab navigation
- Collapsible sections
- Nested content

**Props:**
```typescript
{
  tabs: Array<{
    id: string,
    label: string,
    icon?: string,
    content: Component[]
  }>,
  defaultTab?: string
}
```

**Files to create:**
- `app/src/components/artifacts/Tabs.tsx`

---

#### 6. StatusBadge Component
**Why:** Visual status indicators for goals, tasks, health scores.

**Features:**
- Color-coded statuses
- Icons
- Tooltips

**Props:**
```typescript
{
  status: 'on-track' | 'at-risk' | 'blocked' | 'complete',
  label?: string,
  size?: 'sm' | 'md' | 'lg'
}
```

**Files to create:**
- `app/src/components/artifacts/StatusBadge.tsx`

---

#### 7. Calculator/Formula Component
**Why:** Computed fields (burn rate, runway, conversion rates).

**Features:**
- Define formulas
- Reference other fields
- Auto-calculate
- Display result

**Props:**
```typescript
{
  formula: string, // e.g., "revenue - expenses"
  inputs: Record<string, number>,
  label: string,
  format?: 'currency' | 'percentage' | 'number'
}
```

**Files to create:**
- `app/src/components/artifacts/Calculator.tsx`

---

#### 8. Grid Layout Component
**Why:** Flexible layouts for dashboard-style artifacts.

**Features:**
- Responsive grid
- Drag-to-reorder (future)
- Customizable columns

**Props:**
```typescript
{
  columns: number,
  gap: number,
  children: Component[]
}
```

**Files to create:**
- `app/src/components/artifacts/GridLayout.tsx`

---

### Priority 2: Improve LLM Generation Quality

**Current state:** LLM generates basic artifacts, but quality varies.

**What to improve:**

#### 1. Better System Prompts
**Update:** `backend/services/artifact_service.py`

**Changes:**
- More specific component examples
- Better context understanding
- Smarter component selection based on use case
- Include all 13 components in generation options

**Example improvement:**
```python
# Before: Generic "create a dashboard"
# After: "Create a ChartMogul-style MRR dashboard with:
#        - Line chart showing MRR trend (last 12 months)
#        - Metric cards for current MRR, growth rate, churn
#        - Table of top customers by revenue
#        - Status badges for health indicators"
```

#### 2. Add Template Library
**Create:** `backend/templates/artifact_templates.py`

**Pre-built templates:**
1. **ChartMogul-style Revenue Dashboard**
   - MRR trend chart
   - Key metrics (MRR, growth, churn, LTV)
   - Customer table
   - Revenue breakdown pie chart

2. **Notion-style OKR Tracker**
   - Tabs for each objective
   - Progress bars for key results
   - Status badges
   - Timeline for milestones

3. **Airtable-style Customer Pipeline**
   - Kanban board (stages: Lead → Qualified → Demo → Closed)
   - Table view with filters
   - Metric cards (conversion rates)

4. **Product Roadmap**
   - Timeline component
   - Kanban board (Now → Next → Later)
   - Status badges
   - Priority calculator

5. **Weekly Metrics Snapshot**
   - Grid layout with metric cards
   - Charts for key trends
   - Status badges for health
   - Text blocks for insights

**Implementation:**
```python
TEMPLATES = {
    "revenue_dashboard": {
        "name": "Revenue Dashboard (ChartMogul-style)",
        "description": "Track MRR, growth, and customer metrics",
        "components": [...],
        "keywords": ["revenue", "mrr", "growth", "chartmogul"]
    },
    # ... more templates
}

def match_template(prompt: str) -> Optional[str]:
    """Match user prompt to best template."""
    # Use embeddings or keyword matching
    pass
```

#### 3. Smarter Component Selection
**Logic to add:**
- If prompt mentions "trend" or "over time" → Use Chart (line)
- If prompt mentions "compare" or "breakdown" → Use Chart (bar/pie)
- If prompt mentions "pipeline" or "stages" → Use Kanban
- If prompt mentions "roadmap" or "timeline" → Use Timeline
- If prompt mentions "goals" or "progress" → Use ProgressBar + StatusBadge
- If prompt mentions "track" or "monitor" → Use Table + MetricCard

---

### Priority 3: Data Persistence Layer

**Current state:** User inputs in InputForms don't save.

**What to build:**

#### 1. Artifact Data Storage
**Update schema:** `backend/database/migrations/003_create_artifacts_tables.sql`

**Add column:**
```sql
ALTER TABLE artifacts ADD COLUMN user_data JSONB DEFAULT '{}';
```

**Purpose:** Store user-entered data separately from generated content.

**Structure:**
```json
{
  "user_data": {
    "form_1_input": "value",
    "table_row_1": {...},
    "custom_metric_1": 1000
  }
}
```

#### 2. Update API Endpoints
**Update:** `backend/routes/artifacts.py`

**New endpoint:**
```python
@router.patch("/{artifact_id}/data")
async def update_artifact_data(
    artifact_id: str,
    user_id: str,
    data_updates: Dict[str, Any]
):
    """Update user-entered data in artifact."""
    # Merge data_updates into artifact.user_data
    # Return updated artifact
```

#### 3. Frontend Data Binding
**Update:** All input components

**Changes:**
- InputForm: Save on blur/submit
- Table: Save on row edit
- Calculator: Save input values
- Kanban: Save on card move

**Example:**
```typescript
// In InputForm component
const handleSubmit = async (data) => {
  await apiClient.artifacts.updateData(artifactId, {
    [formId]: data
  });
  // Optimistic UI update
};
```

---

### Priority 4: Improved Editing Experience

**Current state:** Edit sidebar is basic, no visual editor.

**What to build:**

#### 1. Inline Editing
**Update:** `app/src/components/artifacts/ArtifactRenderer.tsx`

**Features:**
- Click to edit text blocks
- Click to edit metric values
- Click to edit chart data
- Save on blur

#### 2. Component Reordering
**Add:** Drag-to-reorder components

**Implementation:**
- Use @dnd-kit/core
- Visual drop zones
- Save new order to backend

#### 3. Add/Remove Components
**Add:** UI to add new components to artifact

**Features:**
- "+" button between components
- Component picker modal
- Configure component props
- Delete component button

#### 4. Visual Editor Mode
**Add:** Toggle between View and Edit modes

**Edit mode features:**
- All components show edit controls
- Drag handles visible
- Add/remove buttons visible
- Save/Cancel buttons in header

---

### Priority 5: Templates Library UI

**What to build:**

#### 1. Template Gallery
**Create:** `app/src/app/templates/page.tsx`

**Features:**
- Browse pre-built templates
- Preview template
- "Use this template" button
- Filter by category (Revenue, Product, Operations, etc.)

#### 2. Template Selection in Onboarding
**Update:** `app/src/components/onboarding/PromptScreen.tsx`

**Add:**
- "Start from template" option
- Template picker
- Still allow custom prompts

#### 3. Save as Template
**Add:** Feature to save custom artifacts as templates

**Use case:** User creates great dashboard → Save as template → Reuse for other projects

---

## 📋 Phase 2: Data Connections (Weeks 3-4) - FUTURE

**Goal:** Connect artifacts to real data sources

### What to Build:
1. **Stripe Integration**
   - OAuth flow
   - Sync MRR, customers, churn
   - Update revenue artifacts automatically

2. **PostHog Integration**
   - API key setup
   - Sync product analytics
   - Update activation/retention artifacts

3. **Integration CTAs**
   - Contextual prompts in artifacts
   - "Connect Stripe to see real data"
   - Sync status indicators

4. **Data Refresh System**
   - Background jobs
   - Manual refresh button
   - Webhook handlers

---

## 📋 Phase 3: AI Automation Layer (Weeks 5+) - FUTURE

**Goal:** Agents that execute workflows automatically

### What to Build:
1. **Monitoring & Alerts**
   - Track metrics in artifacts
   - Alert on thresholds
   - Daily/weekly summaries

2. **Workflow Engine**
   - Define workflows in artifacts
   - Trigger on conditions
   - Execute actions (create Linear ticket, send Slack message, etc.)

3. **Agent System**
   - Autonomous agents per artifact
   - Learn from user feedback
   - Proactive recommendations

---

## 🎯 What to Build NEXT

### ✅ Completed (Dec 1, 2025)
- [x] Chart Component (line, bar, pie, area)
- [x] Product Spec-based artifact system
- [x] Conversational spec builder (`/artifacts/new`)
- [x] Inline spec editing with markdown preview
- [x] Chat panel for refining specs
- [x] View toggle (Spec/UI) on artifact pages
- [x] Draft vs Live artifact status
- [x] Home page shows only LIVE artifacts
- [x] AI prompts output numbered questions
- [x] AI understands integration requirements

### 🔜 Next Up (Priority Order)

**1. "Set Live" Button**
- [ ] Add "Set Live" action to artifact page
- [ ] Check if required integrations are connected
- [ ] Update status to 'live'
- [ ] Artifact appears on home dashboard

**2. Table Component (Enhanced)**
- [ ] Create Table.tsx with sorting/filtering
- [ ] Add pagination
- [ ] Add to ArtifactRenderer

**3. StatusBadge Component**
- [ ] Visual status indicators (on-track, at-risk, blocked)
- [ ] Add to ArtifactRenderer

**4. Kanban Board Component**
- [ ] Install @dnd-kit/core
- [ ] Drag-and-drop between columns
- [ ] Add to ArtifactRenderer

**5. Data Persistence**
- [ ] Save user inputs from InputForms
- [ ] Persist table edits
- [ ] Optimistic UI updates

**6. Templates Library**
- [ ] Pre-built templates (MRR Dashboard, OKR Tracker, etc.)
- [ ] Template picker in artifact creation

---

## 📊 Success Criteria for Phase 1

**Component Library:**
- [ ] 13 total components available
- [ ] All components render correctly
- [ ] All components work in ArtifactRenderer
- [ ] LLM can generate artifacts using all components

**Generation Quality:**
- [ ] User can create ChartMogul-style dashboard
- [ ] User can create Notion-style OKR tracker
- [ ] User can create Airtable-style pipeline
- [ ] Generated artifacts are specific and actionable
- [ ] 80%+ of prompts generate useful artifacts

**Data Persistence:**
- [ ] User inputs save automatically
- [ ] Data persists across sessions
- [ ] Edits update in real-time
- [ ] No data loss

**User Experience:**
- [ ] Onboarding takes <2 minutes
- [ ] Artifact generation takes <10 seconds
- [ ] Editing is intuitive
- [ ] Mobile responsive

---

## 🚀 Immediate Next Steps (Today)

### Option A: Start with Chart Component (Recommended)
**Why:** Highest impact, enables dashboard artifacts

**Tasks:**
1. Install Recharts: `npm install recharts`
2. Create `app/src/components/artifacts/Chart.tsx`
3. Implement line, bar, pie charts
4. Add to ArtifactRenderer switch statement
5. Update artifact_service.py to include Chart in prompts
6. Test with sample MRR dashboard

### Option B: Start with Templates Library
**Why:** Quick wins, demonstrates flexibility

**Tasks:**
1. Create `backend/templates/artifact_templates.py`
2. Define 5 pre-built templates
3. Add template matching logic
4. Update artifact_service.py to use templates
5. Test generation with template hints

### Option C: Start with Data Persistence
**Why:** Makes existing components more useful

**Tasks:**
1. Add user_data column migration
2. Create PATCH endpoint
3. Update InputForm component
4. Test data saving
5. Add optimistic UI updates

---

## � My Recommendation

**Start with Chart Component (Option A)**

**Reasoning:**
1. **Highest user value** - Dashboards are what users want most
2. **Unlocks new use cases** - Can't build ChartMogul-style tools without charts
3. **Visual impact** - Charts make artifacts feel professional
4. **Foundation for others** - Once charts work, other components follow same pattern

**After Chart, do this order:**
1. Chart (Day 1-2)
2. Table (Day 3)
3. StatusBadge + Calculator (Day 4)
4. GridLayout + Tabs (Day 5)
5. Data Persistence (Day 9)
6. Templates + LLM Quality (Day 10)
7. Kanban (Day 6-7)
8. Timeline (Day 8)

This gives you a **working dashboard builder in 5 days**, then polish in Week 2.

---

## 🤔 What do you think?

1. **Does this align with your vision?** (ChartMogul/Notion/Airtable replicas)
2. **Should we start with Chart component?**
3. **Any components missing from the list?**
4. **Any concerns about the approach?**

Let me know and we can start building! 🚀

