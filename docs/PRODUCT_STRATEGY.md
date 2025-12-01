# Cosos Product Strategy

**Date:** December 1, 2025
**Status:** Product Spec-Based Artifact System Implemented

---

## 🎯 The Core Insight (From User Research)

**What founders are asking for:**
1. Goal setting & accountability systems
2. Understanding and tracking their KPIs
3. Custom dashboards for their specific metrics
4. Tools like ChartMogul, Notion, Airtable but tailored to their business

**What they're NOT asking for:**
- Generic "operating system blueprints"
- AI that tells them what to do
- Complex automation (yet)

---

## 💡 The New Positioning

> "Build custom business tools in seconds. No-code dashboards, trackers, and systems that actually fit your business. Connect your data, automate with AI."

---

## 🏗️ The Two-Phase Artifact Creation

### How It Works Now:
1. **User describes what they need** → AI generates a Product Spec document
2. **Conversational refinement** → AI asks numbered questions to clarify
3. **Spec review/edit** → User can edit the markdown spec directly
4. **Build from Spec** → UI components generated from the spec
5. **Set Live** → Artifact appears on home dashboard

### Product Spec Document Structure:
- **Title** - Clear name for the artifact
- **Overview** - 1-2 sentence description
- **Purpose** - Why the user needs this
- **Key Metrics** - Important KPIs to track
- **Data Sources** - Where data comes from (integrations needed)
- **Sections/Views** - UI structure
- **Refresh Frequency** - How often data updates

---

## 🏗️ The Three-Phase Strategy

### Phase 1: Flexible Artifact Builder ✅ COMPLETE
**Goal:** User can build ChartMogul/Notion/Airtable-style tools through prompts

**What was built:**
- Product Spec-based artifact creation system
- Conversational spec builder with chat UI
- Chart component (line, bar, pie, area)
- Inline spec editing with markdown preview
- Draft vs Live artifact status
- AI prompts with structured questions

**Status:** Core flow working, needs more components

---

### Phase 2: Data Connections (Weeks 3-4)
**Goal:** Artifacts populate with real data from integrations

**What to build:**
- Stripe integration (revenue data)
- PostHog integration (product analytics)
- Integration CTAs in artifacts
- Data refresh system
- Webhook handlers

**Success metric:** User connects Stripe and sees real MRR data in their dashboard

---

### Phase 3: AI Automation Layer (Weeks 5+)
**Goal:** Agents automate execution across tools

**What to build:**
- Monitoring & alerting system
- Workflow engine
- Autonomous agents per artifact
- Cross-tool automation

**Success metric:** Agent detects MRR drop, creates Linear ticket, sends Slack alert automatically

---

## 🎨 Component Library Strategy

### Current (6 components):
- ✅ MetricCard - Single KPI display
- ✅ DataList - Simple table
- ✅ ProgressBar - Visual progress
- ✅ InputForm - Data entry
- ✅ TextBlock - Instructions/content
- ✅ **Chart** - Line, bar, pie, area (Recharts)

### Planned (7 more):
1. **Table** - Sortable, filterable, paginated
2. **Kanban** - Drag-drop boards (pipelines)
3. **Timeline** - Gantt-style (roadmaps)
4. **Tabs** - Multi-section layouts
5. **StatusBadge** - Visual status indicators
6. **Calculator** - Computed fields
7. **GridLayout** - Flexible layouts

---

## 📋 Template Library Strategy

### Pre-built templates to offer:

1. **ChartMogul-style Revenue Dashboard**
   - MRR trend chart (line)
   - Key metrics (cards)
   - Customer table
   - Revenue breakdown (pie)

2. **Notion-style OKR Tracker**
   - Tabs per objective
   - Progress bars for key results
   - Status badges
   - Timeline for milestones

3. **Airtable-style Customer Pipeline**
   - Kanban board (stages)
   - Table view with filters
   - Conversion metrics

4. **Product Roadmap**
   - Timeline component
   - Kanban (Now/Next/Later)
   - Priority calculator

5. **Weekly Metrics Snapshot**
   - Grid layout
   - Metric cards
   - Trend charts
   - Status badges

---

## 🎯 Competitive Positioning

### vs ChartMogul:
- **Them:** Fixed dashboard for SaaS metrics
- **Us:** Custom dashboards for ANY metrics, built in seconds

### vs Notion:
- **Them:** Blank canvas, manual setup
- **Us:** AI generates the structure, you just describe what you need

### vs Airtable:
- **Them:** Database-first, complex setup
- **Us:** Use-case first, instant setup

### vs All:
- **Unique:** AI-native from day one, will automate execution later

---

## 📊 Success Metrics

### Phase 1 (Artifact Builder):
- [ ] User completes onboarding in <2 minutes
- [ ] Artifact generation takes <10 seconds
- [ ] 80%+ of prompts generate useful artifacts
- [ ] User can create ChartMogul-style dashboard
- [ ] User can create Notion-style OKR tracker
- [ ] User can create Airtable-style pipeline

### Phase 2 (Data Connections):
- [ ] User connects first integration in <2 minutes
- [ ] Data syncs within 30 seconds
- [ ] Artifacts update automatically
- [ ] 50%+ of users connect at least one integration

### Phase 3 (AI Automation):
- [ ] Agents run workflows automatically
- [ ] 80%+ accuracy on workflow execution
- [ ] Users save 5+ hours per week

---

## 🚀 Go-to-Market Strategy

### Target Audience:
- Early-stage founders (pre-seed to Series A)
- Technical enough to appreciate AI
- Frustrated with generic tools
- Need custom solutions but can't afford custom dev

### Messaging:
- "Stop fighting with Notion templates"
- "Your business is unique. Your tools should be too."
- "Build what you need in 30 seconds, not 3 hours"

### Pricing (future):
- Free: 3 artifacts, manual data entry
- Pro ($29/mo): Unlimited artifacts, 3 integrations
- Team ($99/mo): Unlimited everything, AI automation

---

## 🎯 Next Steps

See `ACTION_PLAN.md` for detailed implementation plan.

**Immediate:**
- Add "Set Live" button to publish artifacts
- Build Table component with sorting/filtering
- Build StatusBadge component

**This week:** Complete core component library
**Next week:** Data persistence + templates
**Week 3-4:** Add integrations (Stripe, PostHog)
**Week 5+:** AI automation layer

