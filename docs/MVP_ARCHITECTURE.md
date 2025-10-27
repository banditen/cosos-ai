# COSOS MVP Architecture

**Version:** 1.0  
**Date:** October 27, 2025  
**Goal:** Ship context-aware AI Chief of Staff in 8 weeks

---

## 🎯 Core Concept

An **agent-based** (not assistant-based) system that:
- Runs autonomously every morning at 7am
- Analyzes emails + calendar using your business context
- Produces actionable daily brief with priorities, time blocks, and flags
- Learns from your feedback over time

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    USER ONBOARDING                      │
│  Collects: Business context, goals, style, challenges  │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                  DATA SYNC (Continuous)                 │
│         Gmail API ← → Calendar API ← → Supabase         │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│              DAILY AGENT LOOP (7am daily)               │
│                                                         │
│  1. Fetch: Last 24h emails + today's calendar          │
│  2. Retrieve: User context (RAG with vector search)    │
│  3. Analyze: GPT-4o-mini with context                  │
│  4. Generate: Daily brief (priorities, blocks, flags)  │
│  5. Deliver: Email + Web dashboard                     │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                   FEEDBACK LOOP                         │
│  User corrects priorities → Stored as embeddings       │
│  → Used in future agent decisions                       │
└─────────────────────────────────────────────────────────┘
```

---

## 🔐 Security (MVP)

### Principles
- **Database-level encryption** (Supabase RLS)
- **OAuth 2.0** for Gmail/Calendar (minimal scopes)
- **OpenAI API** (data not used for training)
- **Audit logging** for all actions
- **HTTPS everywhere**

### Phase 2
- Field-level encryption
- SOC 2 Type II compliance
- Self-hosted LLM option (premium tier)

---

## 🤖 LLM Strategy

### MVP: RAG with GPT-4o-mini

**Why GPT-4o-mini?**
- Fast inference (1-2 seconds)
- Large context window (128k tokens)
- Cost-effective ($0.15 per 1M input tokens)
- Good quality for structured tasks

**How it works:**
1. User context stored as vector embeddings (OpenAI ada-002)
2. Daily data (emails + calendar) embedded
3. Vector similarity search retrieves relevant context
4. Minimal prompt sent to GPT-4o-mini
5. Structured output (JSON) for brief generation

**Cost per user:** ~$0.50-1.00/month

### Phase 2: Personalization

**After 30 days:**
- Fine-tune GPT-4o-mini on user's feedback
- Deploy user-specific model endpoint
- Cost: ~$2-3/month per user

**Premium Tier:**
- Self-hosted Llama 3.1 70B
- Complete data control
- Custom pricing

---

## 📊 Database Schema

### Core Tables

**users**
- User profile, preferences, brief settings

**user_context**
- Business mission, goals, audience, style
- Vector embeddings for RAG

**integrations**
- OAuth tokens for Gmail, Calendar, Slack

**emails**
- Synced Gmail messages
- AI analysis (summary, priority, action items)
- Vector embeddings

**calendar_events**
- Synced Google Calendar events
- AI analysis (event type, importance)

**daily_briefs**
- Generated briefs with priorities, time blocks, flags
- Agent reasoning for debugging

**feedback**
- User corrections to agent decisions
- Vector embeddings for learning

**audit_log**
- All actions logged for security

### Key Features
- **Row-Level Security (RLS):** Users can only access their own data
- **Vector Search:** pgvector extension for similarity search
- **Audit Trail:** Immutable logs for compliance

---

## 🔄 Daily Agent Loop

### Trigger
- Scheduled job runs at user's preferred time (default 7am)
- Can also be triggered manually via API

### Steps

**1. Data Collection**
```python
# Fetch last 24h emails
emails = fetch_emails(user_id, since=yesterday)

# Fetch today's calendar
events = fetch_calendar(user_id, date=today)
```

**2. Context Retrieval**
```python
# Embed today's data
today_embedding = embed(emails + events)

# Search user context for relevant pieces
relevant_context = vector_search(
    user_id=user_id,
    query_embedding=today_embedding,
    top_k=10
)
```

**3. Agent Analysis**
```python
# Build prompt with context
prompt = f"""
You are the Chief of Staff for {user.name}.

BUSINESS CONTEXT:
{relevant_context}

TODAY'S DATA:
Emails: {emails}
Calendar: {events}

TASK: Generate daily brief with:
1. Top 3 priorities (with reasoning)
2. Suggested time blocks for deep work
3. Quick wins (< 15 min tasks)
4. Urgent flags

Output as JSON.
"""

# Call GPT-4o-mini
response = openai.chat.completions.create(
    model="gpt-4o-mini",
    messages=[{"role": "user", "content": prompt}],
    response_format={"type": "json_object"}
)
```

**4. Brief Generation**
```python
# Parse JSON response
brief_data = json.loads(response.choices[0].message.content)

# Generate formatted text/HTML
brief_text = format_brief_text(brief_data)
brief_html = format_brief_html(brief_data)

# Save to database
save_brief(user_id, brief_data, brief_text, brief_html)
```

**5. Delivery**
```python
# Send email
send_email(user.email, subject="Your Daily Brief", body=brief_html)

# Update dashboard
update_dashboard(user_id, brief_id)

# Optional: Send to Slack
if user.brief_slack_enabled:
    send_slack(user.slack_webhook_url, brief_text)
```

---

## 📝 Onboarding Flow

### Step 1: Account Creation
- Sign up with email
- OAuth with Google (for Gmail/Calendar)

### Step 2: Context Collection
**Form with sections:**

1. **Business Context**
   - What are you building? (mission statement)
   - Current stage: [Idea / MVP / Growth / Scale]
   - Key metrics you care about

2. **Audience & Market**
   - Who are your customers? (profiles)
   - What value do you provide?
   - How do you position vs competitors?

3. **Communication Style**
   - Brand voice guidelines
   - Upload 2-3 examples of your best content
   - Tone preference: [Formal / Professional / Casual]

4. **Current Focus**
   - Top 3 goals this quarter
   - Biggest challenges/blockers
   - What does success look like this month?

### Step 3: Preferences
- What time should we send your daily brief?
- Email? Slack? Both?
- Any specific focus areas?

### Step 4: First Sync
- Sync last 7 days of emails
- Sync next 7 days of calendar
- Generate first brief immediately

---

## 🔁 Feedback Loop

### How Users Give Feedback

**On Priorities:**
```
Original: "Respond to investor email" (Priority #1)
User: "Actually, shipping feature X is more important"
→ Stored as feedback with reasoning
```

**On Time Blocks:**
```
Original: "Focus time 9-11am"
User: "I prefer afternoons for deep work"
→ Learned preference
```

**On Categories:**
```
Original: Email categorized as "low priority"
User: "This is from a key customer, should be high"
→ Improves future categorization
```

### How Agent Learns

1. Feedback stored as vector embeddings
2. Retrieved during future analysis
3. Influences priority scoring and categorization
4. After 30 days, can fine-tune model

---

## 📦 Tech Stack Summary

| Component | Technology | Why |
|-----------|-----------|-----|
| **Backend** | FastAPI + Python 3.11 | Fast, async, type-safe |
| **Database** | Supabase (PostgreSQL + pgvector) | RLS, vector search, easy setup |
| **LLM** | OpenAI GPT-4o-mini | Fast, cheap, good quality |
| **Embeddings** | OpenAI ada-002 | Industry standard |
| **Email** | Gmail API | OAuth, reliable |
| **Calendar** | Google Calendar API | OAuth, reliable |
| **Frontend** | Next.js 14 + TypeScript | Fast, modern |
| **Deploy** | Vercel (frontend) + Railway (backend) | Easy, affordable |

---

## 📅 8-Week Timeline

### Week 1-2: Foundation
- ✅ Database schema
- ✅ User models
- ⏳ Onboarding flow
- ⏳ Gmail + Calendar OAuth

### Week 3-4: Agent Core
- ⏳ Email/Calendar sync service
- ⏳ Vector embedding service
- ⏳ Agent reasoning engine
- ⏳ Daily execution loop

### Week 5-6: Brief & Delivery
- ⏳ Brief generation
- ⏳ Email delivery
- ⏳ Web dashboard
- ⏳ Feedback mechanism

### Week 7-8: Polish & Launch
- ⏳ Testing
- ⏳ Error handling
- ⏳ Performance optimization
- ⏳ Deploy to production

---

## 🎯 Success Metrics

**Week 8 Demo:**
> "Every morning at 7am, I get a brief that tells me my top 3 priorities, suggests when to do deep work, and flags anything urgent. It takes 2 minutes to read and saves me 30 minutes of 'figuring out my day'."

**Key Metrics:**
- Brief generation time: < 5 seconds
- Brief accuracy: 80%+ (user agrees with priorities)
- Time saved: 30+ minutes per day
- User engagement: 90%+ open rate on briefs

---

## 🚀 Next Steps

1. Set up Supabase project
2. Run database migrations
3. Build onboarding API endpoints
4. Implement Gmail OAuth flow
5. Build first version of agent loop

**Let's ship! 🚀**

