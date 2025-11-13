# COSOS — The Engine Room That Runs With You

**Set up your command center in 15 minutes. Get your first insight immediately.**

Know if you're winning, every single day.

🌐 **Website:** [cosos.xyz](https://cosos.xyz)

---

## 🎯 What is COSOS?

COSOS is not an assistant. It's not a tool. **It's your engine room.**

### **The Problem:**
Founders are drowning in chaos. Emails, meetings, tasks, metrics — but no clear system. No way to know if they're focusing on the right things. No confidence they're winning.

### **How COSOS Works:**

**1. Quick Setup (15-20 minutes)**
Define what matters:
- **Your Key Projects** - The 3-5 things you're building
- **Your Success Metrics** - The numbers that tell you if you're winning
- **Your Goals** - What success looks like in 6 months

**2. Immediate Value**
Get your first insight right away:
- What's happening in your business right now
- What needs attention today
- What's at risk, what's working

**3. Daily Intelligence (Every Morning)**
COSOS analyzes everything automatically:
- **Daily Insights** (7am) - What changed, what matters, what to do
- **Weekly Digest** (Friday) - Progress on your projects, wins, risks
- **Real-time Awareness** - Always know if you're winning

### **The Difference:**

We don't wait for you to ask. We don't just summarize what happened. We don't automate tasks you define.

**We help you define what matters, then tell you every day if you're winning.**

### **Brand Essence:**

*The Engine Room That Runs With You.*

**Core Ideas:**
- Clarity from Day 1
- Real-time awareness
- Intelligent execution
- Founder partnership
- Quiet power

### **Competitive Positioning:**

| **Cofounder** | **Ambient** | **In Parallel** | **COSOS** |
|---------------|-------------|-----------------|-----------|
| Automates tasks you define | Preps meetings | Automates team routines | **Analyzes your business proactively** |
| Reactive | Passive | Team-focused | **Founder-focused** |
| Value after setup | Value after meetings | Value after adoption | **Value from Day 1** |
| Measures tasks | Measures meetings | Measures team alignment | **Measures business outcomes** |

---

## 🚀 Current Status

**Phase:** MVP in Production
**Users:** Private Beta
**Last Updated:** October 28, 2025

### **What's Working:**

- ✅ **Google OAuth Login** - Secure authentication via Supabase
- ✅ **Onboarding Flow** - Capture business context before first use
- ✅ **Gmail/Calendar OAuth** - Separate OAuth for API access
- ✅ **Data Sync** - Automatic email and calendar event syncing
- ✅ **Daily Briefs** - AI-generated briefs with:
  - Top Priorities (what to focus on today)
  - Time Blocks (when to work on what)
  - Quick Wins (easy wins to build momentum)
  - Flags (risks and blockers to address)

### **What's Next:**

- 🎯 **Projects & Initiatives Tracking** (Q1 2026)
- 🎯 **Outcome Correlation** - Track if priorities move metrics
- 🎯 **Enhanced Email Intelligence** - Smarter categorization
- 🎯 **Autonomous Task Creation** (Q2 2026)
- 🎯 **Proactive Web Research** (Q2 2026)

See `MISSION_STATEMENT.md` and `BUILD_STRATEGY.md` for full roadmap.

---

## 💎 Core Value Proposition

### **1. Proactive Intelligence, Not Reactive Assistance**

**Others:** "Tell me what to automate" or "I'll prep you for meetings"
**COSOS:** "Here's what you should do today to move your business forward"

- We analyze without being asked - every morning, COSOS evaluates your business state
- We recommend without prompting - priorities are generated based on strategic goals
- We flag risks before they become problems - proactive alerts on blockers

### **2. Business Progress, Not Task Completion**

**Others:** Measure tasks automated or meetings prepped
**COSOS:** Measures business outcomes achieved

- We track what matters - revenue, user growth, product velocity
- We connect actions to outcomes - every priority links to quarterly goals
- We tell you if you're winning - daily assessment of business health

### **3. Day-0 Value, Not Setup Tax**

**Others:** Require automation design or meeting attendance
**COSOS:** Delivers insights from your first sync

- Immediate intelligence - analyze emails on day 1, generate actionable brief
- No configuration required - AI understands your business from onboarding context
- Progressive enhancement - gets smarter as you use it, but useful immediately

### **4. Strategic Command, Not Tactical Execution**

**Others:** Execute workflows or summarize meetings
**COSOS:** Directs your strategic focus

- Time block optimization - tells you what to work on and when
- Priority ranking - surfaces the 3-5 things that matter most today
- Strategic reasoning - explains why each priority moves your business forward

---

## 🔐 Security & Privacy

**Your data is yours. Period.**

COSOS is built with enterprise-grade security from day one:

- ✅ **Private by Design** - Your AI agent learns ONLY from your data, never shared across users
- ✅ **End-to-End Encryption** - All data encrypted in transit (TLS) and at rest (AES-256)
- ✅ **Row-Level Security** - Supabase RLS ensures you can only access your own data
- ✅ **OAuth 2.0** - Industry-standard authentication for Gmail/Calendar access
- ✅ **No Data Sharing** - We never train models on your data or share with third parties
- ✅ **SOC 2 Roadmap** - Building toward SOC 2 Type II compliance (Q3 2026)
- ✅ **GDPR/CCPA Ready** - Data deletion, export, and privacy controls

**Your business intelligence stays with you.** COSOS is a tool you use and train for yourself, not a shared AI that learns from everyone.

---

## 📦 Tech Stack

### Backend
- **Language:** Python 3.9+
- **Framework:** FastAPI (async/await)
- **Database:** Supabase (PostgreSQL + pgvector)
- **Vector Search:** OpenAI ada-002 embeddings
- **AI Model:** OpenAI GPT-4o-mini
- **Integrations:** Gmail API, Google Calendar API
- **Deployment:** Railway.app or Render.com

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **UI:** Tailwind CSS + Headless UI
- **Auth:** Supabase Auth (Google OAuth)
- **Deployment:** Vercel

### Infrastructure
- **Auth:** Supabase Auth with Row-Level Security
- **Storage:** Supabase PostgreSQL with pgvector
- **Logging:** Structured logging with context
- **Monitoring:** Supabase dashboard + custom metrics

---

## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- Node.js 18+
- Git
- Supabase account
- OpenAI API key
- Google Cloud project (for OAuth)

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/cosos-ai.git
cd cosos-ai
```

### 2. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file (copy from .env.example)
cp .env.example .env
# Edit .env with your credentials

# Start development server
uvicorn main:app --reload --port 8000
```

### 3. Frontend Setup
```bash
cd app

# Install dependencies
npm install

# Create .env.local (copy from .env.example)
cp .env.example .env.local
# Edit .env.local with your credentials

# Start development server
npm run dev
```

### 4. Access the App

Visit:
- **Dashboard**: `http://localhost:3000`
- **API Docs**: `http://localhost:8000/docs`

**First-time setup:**
1. Sign in with Google
2. Complete onboarding (business context)
3. Connect Gmail/Calendar
4. Sync data
5. Generate your first brief!

> **Note**: See `docs/SETUP_GUIDE.md` for detailed setup instructions including Supabase, Google OAuth, and environment variables.

---

## 📁 Repository Structure

```
cosos-ai/
├── backend/                    # FastAPI backend (api.cosos.xyz)
│   ├── main.py                # Application entry point
│   ├── config.py              # Configuration
│   ├── requirements.txt       # Python dependencies
│   ├── models/                # Pydantic models
│   │   ├── brief.py          # Brief data models
│   │   └── user.py           # User data models
│   ├── routes/               # API endpoints
│   │   ├── auth.py           # Authentication
│   │   ├── briefs.py         # Brief generation
│   │   ├── integrations.py   # Gmail/Calendar OAuth
│   │   └── onboarding.py     # User onboarding
│   ├── services/             # Core business logic
│   │   ├── agent_service.py  # AI agent (brief generation)
│   │   ├── gmail_service.py  # Gmail integration
│   │   ├── calendar_service.py # Calendar integration
│   │   └── supabase_service.py # Database operations
│   └── utils/                # Utilities
│
├── app/                       # Next.js frontend (app.cosos.xyz)
│   ├── src/
│   │   ├── app/              # App router pages
│   │   │   ├── page.tsx      # Landing/redirect
│   │   │   ├── login/        # Login page
│   │   │   ├── dashboard/    # Main dashboard
│   │   │   └── onboarding/   # Onboarding flow
│   │   ├── components/       # React components
│   │   ├── lib/              # API client & utilities
│   │   └── types/            # TypeScript types
│   └── package.json
│
├── docs/                      # Documentation
│   ├── AGENT_IMPROVEMENTS.md # Future AI improvements
│   ├── DEVELOPMENT.md        # Development guide
│   ├── MVP_ARCHITECTURE.md   # Architecture overview
│   └── SETUP_GUIDE.md        # Detailed setup instructions
│
├── MISSION_STATEMENT.md       # Product vision & strategy
├── COMPETITIVE_POSITIONING.md # Market positioning
├── BUILD_STRATEGY.md          # Technical roadmap
├── PRODUCT_ROADMAP.md         # Product roadmap
├── PROGRESS.md                # Development progress
├── README.md                  # This file
├── LICENSE                    # MIT License
└── setup.sh                   # Automated setup script
```

### Separate Repository (cosos-web)

The marketing landing page is in a **separate repository**:
- **Repository**: `cosos-web`
- **Deployment**: https://cosos.xyz
- **Purpose**: Marketing website with hero, features, pricing, CTA

---

## 🗺️ Product Roadmap

### **Phase 1: Superior Intelligence (Q1 2026)** ✅ In Progress
*Goal: Make our daily brief 10x more valuable than competitors*

- ✅ Proactive daily briefs with priorities, time blocks, quick wins, flags
- ✅ Business context integration (mission, stage, goals, challenges)
- ✅ Email and calendar analysis
- ✅ Day-0 value from first sync
- 🎯 Projects & initiatives tracking
- 🎯 Outcome correlation (track if priorities move metrics)
- 🎯 Enhanced email intelligence

### **Phase 2: Autonomous Execution (Q2 2026)**
*Goal: Match automation capabilities while keeping intelligence advantage*

- 🎯 Auto-create tasks in Linear/Notion
- 🎯 Draft emails with business context
- 🎯 Proactive web research and competitor monitoring
- 🎯 Self-improving recommendations based on outcomes

### **Phase 3: Strategic Co-Pilot (Q3 2026)**
*Goal: Deliver strategic intelligence no competitor can match*

- 🎯 Market intelligence integration
- 🎯 Predictive analytics (runway, goal forecasts)
- 🎯 Strategic scenario planning
- 🎯 Autonomous research on demand

### **Phase 4: Command Center (Q4 2026)**
*Goal: Become the operating system for early-stage companies*

- 🎯 Multi-agent orchestration (sales, product, finance agents)
- 🎯 Real-time business dashboard
- 🎯 Autonomous decision-making with guardrails
- 🎯 Learning and adaptation engine

See `MISSION_STATEMENT.md` and `BUILD_STRATEGY.md` for detailed roadmap.

---

## 🔐 Environment Variables

### Backend (.env)
```
# OpenAI / Claude
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4
ANTHROPIC_API_KEY=sk-ant-...

# Gmail
GMAIL_CREDENTIALS_JSON=<base64-encoded-service-account>
GMAIL_REDIRECT_URI=http://localhost:8000/auth/gmail/callback

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_KEY=eyJxxx...

# App
DATABASE_URL=postgresql://user:password@localhost:5432/cosos
ENVIRONMENT=development
DEBUG=true
SECRET_KEY=<random-secret>
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
```

---

## 🛠️ Development Commands

### Backend
```bash
# Run dev server with auto-reload
uvicorn main:app --reload

# Run tests
pytest

# Check code quality
flake8 . --max-line-length=100

# Format code
black .
```

### Frontend
```bash
# Run dev server
npm run dev

# Build for production
npm run build

# Run production build locally
npm run start

# Type check
npm run type-check

# Lint code
npm run lint
```

---

## 📚 Documentation

- **`MISSION_STATEMENT.md`** - Product vision, competitive analysis, why we win
- **`COMPETITIVE_POSITIONING.md`** - One-page strategic overview vs competitors
- **`BUILD_STRATEGY.md`** - Technical roadmap and feature priorities
- **`PRODUCT_ROADMAP.md`** - Product roadmap and milestones
- **`PROGRESS.md`** - Development progress tracking
- **`docs/SETUP_GUIDE.md`** - Detailed setup instructions
- **`docs/DEVELOPMENT.md`** - Development guide
- **`docs/MVP_ARCHITECTURE.md`** - Architecture overview
- **`docs/AGENT_IMPROVEMENTS.md`** - Future AI improvements

---

## 🔗 Important Links

- **API Documentation:** `http://localhost:8000/docs` (Swagger UI)
- **Landing Page:** https://cosos.xyz (separate repo: `cosos-web`)
- **Dashboard:** https://app.cosos.xyz (production)
- **API:** https://api.cosos.xyz (production)

---

## 🛠️ Development

### Backend Commands
```bash
# Run dev server
uvicorn main:app --reload --port 8000

# Run tests
pytest

# Format code
black .

# Type check
mypy .
```

### Frontend Commands
```bash
# Run dev server
npm run dev

# Build for production
npm run build

# Type check
npm run type-check

# Lint
npm run lint
```

---

## 📝 Contributing

We're currently in private beta. If you're interested in contributing:

1. Check existing issues and roadmap
2. Create issue with clear description
3. Fork and create feature branch
4. Submit PR with tests and documentation

**Commit Convention:**
```
type(scope): subject

feat(briefs): add outcome correlation tracking
fix(gmail): resolve sync timeout issue
docs(readme): update setup instructions
```

Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`

---

## 📄 License

MIT License - See LICENSE file

---

## 🙏 Acknowledgments

Built with:
- [Supabase](https://supabase.com) - Database & Auth
- [FastAPI](https://fastapi.tiangolo.com) - Backend framework
- [Next.js](https://nextjs.org) - Frontend framework
- [OpenAI](https://openai.com) - AI models
- [Vercel](https://vercel.com) - Frontend hosting
- [Railway](https://railway.app) - Backend hosting

---

**Built by a solo founder with AI assistance.**

**Last updated:** October 28, 2025
