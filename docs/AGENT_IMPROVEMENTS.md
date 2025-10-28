# Agent Intelligence Improvements

## Phase 1: Current State ✅
- Basic brief generation working
- Retrieves user context, emails, calendar
- Uses GPT-4o-mini for analysis
- Generates priorities, time blocks, quick wins, flags

## Phase 2: Intelligence Enhancements 🎯

### 1. **Context-Aware Reasoning**
**Problem:** Priorities lack deep connection to user's actual goals and initiatives.

**Current behavior:**
```
"Pushing the COSOS repository is crucial for launching the MVP"
```

**Desired behavior:**
```
"Pushing COSOS repository directly supports your Q4 goal of '10 paying beta users' 
by enabling the MVP launch. This aligns with your current challenge of 'building 
fast while maintaining quality' and moves you closer to your success criteria of 
'users can't live without COSOS'."
```

**Implementation:**
- Add `projects` and `initiatives` tables to track active work
- Link priorities to specific projects/initiatives
- Use RAG to retrieve relevant context based on email/calendar content
- Enhance prompt to explicitly connect tasks to user's stated goals

---

### 2. **Project/Initiative Tracking**
**Problem:** No way to track what the user is actively working on.

**Solution:**
- Add `projects` table with fields:
  - `name` - Project name (e.g., "COSOS MVP Launch")
  - `description` - What it is
  - `goal` - What success looks like
  - `deadline` - When it's due
  - `status` - active, paused, completed
  - `key_metrics` - How to measure progress
  - `current_blockers` - What's in the way

- Add `initiatives` table for larger strategic work:
  - `name` - Initiative name (e.g., "Get to 10 paying beta users")
  - `description` - Strategic goal
  - `target_date` - When to achieve
  - `success_criteria` - How to know it's done
  - `related_projects` - Links to projects table

- Link briefs to projects/initiatives:
  - Each priority should reference a project_id or initiative_id
  - Reasoning should explain how the task moves the project forward

---

### 3. **Smarter Email Analysis**
**Problem:** Agent doesn't understand email importance in context of user's work.

**Current:** Treats all emails equally
**Desired:** Prioritize based on:
- Sender importance (is this a customer? investor? team member?)
- Content relevance to active projects
- Urgency signals (deadlines, action required)
- Historical patterns (what emails led to important outcomes?)

**Implementation:**
- Add `email_importance_score` (0-100) based on:
  - Sender relationship to user's goals
  - Keywords matching active projects
  - Urgency indicators
  - User's past actions on similar emails
- Use this score to filter which emails make it into priorities

---

### 4. **Calendar Intelligence**
**Problem:** Calendar events aren't analyzed for strategic value.

**Current:** Just lists events
**Desired:** Understand:
- Which meetings align with goals vs. are distractions
- Prep time needed for important meetings
- Conflicts with deep work time
- Opportunities to decline/delegate

**Implementation:**
- Analyze meeting attendees (customers? investors? team?)
- Check meeting topics against active projects
- Suggest prep tasks before important meetings
- Flag low-value meetings that could be declined

---

### 5. **Vector Similarity Search for Context**
**Problem:** Currently fetching ALL user context, not just relevant pieces.

**Current:** Loads entire user_context into prompt
**Desired:** Use pgvector to find only relevant context

**Implementation:**
- Generate embedding for the day's emails + calendar
- Use vector similarity to find top 5-10 most relevant context pieces
- Only include those in the prompt
- Reduces token usage and improves focus

---

### 6. **Learning from Feedback**
**Problem:** No way for agent to improve over time.

**Desired:**
- User can mark priorities as "not important" or "missed this"
- Agent learns what matters to this specific user
- Adjusts future briefs based on corrections

**Implementation:**
- Add feedback endpoints (already in schema)
- Store feedback with embeddings
- Use feedback history in prompt: "In the past, you said X was important but Y wasn't"
- Adjust priority scoring based on feedback patterns

---

### 7. **Proactive Insights**
**Problem:** Agent is reactive (only responds to emails/calendar).

**Desired:**
- "You haven't talked to Customer X in 2 weeks - might be time to check in"
- "Your goal was 10 beta users by Nov 1, but you're at 3 - need to accelerate"
- "You've had 5 meetings this week but no deep work time - consider blocking focus time"

**Implementation:**
- Track patterns over time
- Compare current state to goals
- Generate proactive suggestions in "flags" section

---

## Implementation Priority

### **Week 2-3: Core Intelligence** (DONE ✅)
1. ✅ Basic brief generation
2. ✅ Add projects/initiatives tracking
3. ✅ Enhance reasoning to link to projects
4. 🔄 Implement vector similarity for context retrieval (Phase 3)

### **Phase 3: Enhanced Project Intelligence** (FUTURE)
1. **Link priorities to specific project IDs**
   - Add `project_id` field to Priority model
   - Agent should identify which project each task belongs to
   - Track task completion per project

2. **Calculate deadline urgency**
   - Show "Only X days left!" for approaching deadlines
   - Prioritize tasks for projects with closer deadlines
   - Flag overdue projects

3. **Track project progress**
   - Calculate % complete based on completed tasks
   - Show momentum: "You've completed 5 tasks this week on COSOS MVP"
   - Identify blocked projects with no recent activity

4. **Smart project suggestions**
   - "You haven't worked on Project X in 3 days - consider scheduling time"
   - "Project Y is 80% complete - push to finish this week"
   - "Project Z deadline is in 2 days but only 30% complete - need to accelerate or adjust deadline"

### **Week 4: Learning & Refinement**
5. 🔄 Add feedback loop
6. 🔄 Improve email importance scoring
7. 🔄 Add calendar intelligence

### **Week 5-6: Proactive Agent**
8. 🔄 Pattern detection
9. 🔄 Proactive insights
10. 🔄 Goal tracking and progress monitoring

---

## Example: Improved Brief

### Current (Generic):
```
Priority: "Set up backend features on Supabase"
Reasoning: "Establishing a reliable backend is essential for functionality"
```

### Improved (Context-Aware):
```
Priority: "Complete Supabase RLS policies for user_context table"
Reasoning: "This unblocks the onboarding flow for your 'COSOS MVP Launch' project, 
which is critical for your Q4 initiative of '10 paying beta users by Nov 1'. 
You're currently at 3 beta users with 4 days left - this is a high-leverage task 
that directly impacts your success criteria of 'users can't live without COSOS'."

Project: COSOS MVP Launch
Initiative: Get to 10 paying beta users
Impact: High (unblocks user onboarding)
Urgency: Critical (4 days to deadline)
```

---

## Notes
- Keep "build fast, ship fast" philosophy
- Don't over-engineer - add intelligence incrementally
- Test each improvement with real usage
- User feedback is the ultimate measure of success

