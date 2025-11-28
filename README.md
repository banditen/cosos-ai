# Cosos — The Engine Room That Runs With You

**Create custom business dashboards in minutes using natural language.**

Know if you're winning, every single day.

🌐 **Website:** [cosos.xyz](https://cosos.xyz)

---

## 🎯 What is Cosos?

Cosos is not an assistant. It's not a tool. **It's your engine room.**

### **The Problem:**
Founders are drowning in chaos. Emails, meetings, tasks, metrics — but no clear system. No way to know if they're focusing on the right things. No confidence they're winning.

### **How Cosos Works:**

**1. Create Custom Artifacts**
Build exactly what you need using natural language:
- **Describe your needs** - Tell the AI what you want to track
- **AI generates the dashboard** - Custom metrics, trackers, and visualizations
- **Refine with conversation** - Edit and improve through natural language

**2. Track What Matters**
Your custom artifacts help you:
- Monitor key business metrics in real-time
- Track progress on important initiatives
- Visualize data that matters to your business
- Stay focused on what drives results

**3. Evolve Your System**
Artifacts grow with your business:
- **Edit anytime** - Conversational AI sidebar for modifications
- **Create new artifacts** - Build new trackers as needs change
- **Activate what matters** - Focus on the most important metrics today

### **The Difference:**

We don't give you generic dashboards. We don't force you into templates. We don't make you learn complex tools.

**We let you describe what you need, then build it for you instantly.**

### **Brand Essence:**

*The Engine Room That Runs With You.*

**Core Ideas:**
- Clarity from Day 1
- Real-time awareness
- Intelligent execution
- Founder partnership
- Quiet power

### **Competitive Positioning:**

| **Notion** | **Airtable** | **Retool** | **Cosos** |
|------------|--------------|------------|-----------|
| Templates you customize | Databases you configure | Apps you build | **Artifacts AI creates for you** |
| Manual setup | Manual setup | Code required | **Natural language** |
| Static dashboards | Complex formulas | Developer tool | **Conversational AI** |
| One-size-fits-all | Flexible but complex | Powerful but technical | **Custom and simple** |

---

## 🚀 Current Status

**Phase:** MVP in Production
**Users:** Private Beta
**Last Updated:** November 28, 2024

### **What's Working:**

- ✅ **Google OAuth Login** - Secure authentication via Supabase
- ✅ **AI-Powered Artifact Creation** - Natural language to custom dashboards
- ✅ **Conversational Onboarding** - Multi-step flow to understand your business
- ✅ **Dynamic Artifact Rendering** - Metrics, progress bars, data lists, text blocks
- ✅ **Artifact Management** - Rename, delete, and activate artifacts
- ✅ **Edit Sidebar** - Conversational AI for modifying artifacts in real-time
- ✅ **Collapsible Sidebar** - Icon-based navigation with artifact submenu
- ✅ **Custom Branding** - Logo and favicon integration

### **Artifact Components:**

- ✅ **MetricCard** - Display key business metrics with trends
- ✅ **ProgressBar** - Visual progress tracking with percentages
- ✅ **DataList** - Structured lists with icons and descriptions
- ✅ **TextBlock** - Rich text content with headings
- ✅ **InputForm** - Data entry forms for artifact updates

### **What's Next:**

- 🎯 **Data Persistence** - Save and update artifact data
- 🎯 **Real-time Collaboration** - Share artifacts with team members
- 🎯 **Integrations** - Connect to external data sources (Stripe, Google Analytics, etc.)
- 🎯 **Templates** - Pre-built artifact templates for common use cases
- 🎯 **Mobile App** - Native mobile experience

See `MISSION_STATEMENT.md` and `BUILD_STRATEGY.md` for full roadmap.

---

## 💎 Core Value Proposition

### **1. Natural Language Creation, Not Manual Configuration**

**Others:** "Configure these fields and formulas"
**Cosos:** "Describe what you need, we'll build it"

- Create dashboards by describing them in plain English
- AI generates the exact structure and components you need
- No templates, no configuration, no learning curve

### **2. Conversational Editing, Not Complex UIs**

**Others:** Navigate menus and settings to make changes
**Cosos:** Chat with AI to modify your artifacts

- Edit sidebar with conversational interface
- Describe changes in natural language
- AI updates your artifact in real-time

### **3. Custom Built, Not One-Size-Fits-All**

**Others:** Templates you customize or databases you configure
**Cosos:** Artifacts built specifically for your business

- Every artifact is unique to your needs
- No forcing your workflow into someone else's template
- Evolves with your business through conversation

### **4. Instant Value, Not Setup Tax**

**Others:** Hours of setup before you see value
**Cosos:** Working dashboard in minutes

- Describe your needs in onboarding
- Get your first artifact immediately
- Start tracking what matters from day one

---

## 🔐 Security & Privacy

**Your data is yours. Period.**

Cosos is built with enterprise-grade security from day one:

- ✅ **Private by Design** - Your artifacts and data are never shared across users
- ✅ **End-to-End Encryption** - All data encrypted in transit (TLS) and at rest (AES-256)
- ✅ **Row-Level Security** - Supabase RLS ensures you can only access your own data
- ✅ **OAuth 2.0** - Industry-standard authentication via Google
- ✅ **No Data Sharing** - We never train models on your data or share with third parties
- ✅ **SOC 2 Roadmap** - Building toward SOC 2 Type II compliance
- ✅ **GDPR/CCPA Ready** - Data deletion, export, and privacy controls

**Your business intelligence stays with you.** Cosos is a tool you use and customize for yourself, not a shared platform that learns from everyone.

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
- **UI:** Tailwind CSS + shadcn/ui (New York style)
- **Icons:** Lucide React
- **Fonts:** Space Grotesk (headings), Figtree (body)
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
- **App**: `http://localhost:3000`
- **API Docs**: `http://localhost:8000/docs`

**First-time setup:**
1. Sign in with Google
2. Complete onboarding flow (stage, goal, challenge, prompt)
3. AI generates your first artifact
4. Activate artifact to see it on your home page
5. Edit, rename, or create more artifacts!

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
│   │   ├── artifact.py       # Artifact data models
│   │   └── user.py           # User data models
│   ├── routes/               # API endpoints
│   │   ├── auth.py           # Authentication
│   │   ├── artifacts.py      # Artifact CRUD & AI generation
│   │   └── onboarding.py     # User onboarding
│   ├── services/             # Core business logic
│   │   ├── artifact_service.py # AI artifact generation & editing
│   │   └── supabase_service.py # Database operations
│   └── utils/                # Utilities
│
├── app/                       # Next.js frontend (app.cosos.xyz)
│   ├── public/               # Static assets
│   │   ├── logo.png          # Cosos logo
│   │   └── favicon.ico       # Favicon
│   ├── src/
│   │   ├── app/              # App router pages
│   │   │   ├── page.tsx      # Landing/redirect
│   │   │   ├── login/        # Login page
│   │   │   ├── (app)/        # Shared layout route group
│   │   │   │   ├── layout.tsx # Sidebar layout
│   │   │   │   ├── home/     # Home page (active artifact)
│   │   │   │   └── artifacts/ # Artifact management
│   │   │   │       ├── page.tsx # Artifacts list
│   │   │   │       └── [id]/  # Individual artifact page
│   │   │   └── onboarding/   # Onboarding flow
│   │   ├── components/       # React components
│   │   │   ├── app-sidebar.tsx # Collapsible sidebar
│   │   │   ├── artifacts/    # Artifact components
│   │   │   │   ├── ArtifactRenderer.tsx # Main renderer
│   │   │   │   ├── ArtifactActions.tsx  # Rename/delete
│   │   │   │   ├── EditArtifactSidebar.tsx # AI editing
│   │   │   │   ├── MetricCard.tsx
│   │   │   │   ├── ProgressBarComponent.tsx
│   │   │   │   ├── DataList.tsx
│   │   │   │   ├── TextBlock.tsx
│   │   │   │   └── InputForm.tsx
│   │   │   ├── onboarding/   # Onboarding screens
│   │   │   └── ui/           # shadcn/ui components
│   │   ├── lib/              # API client & utilities
│   │   │   ├── api.ts        # API client
│   │   │   ├── events.ts     # Custom event system
│   │   │   └── utils.ts      # Utilities
│   │   └── types/            # TypeScript types
│   │       └── artifact.ts   # Artifact types
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

### **Phase 1: AI-Powered Artifact System** ✅ Complete
*Goal: Create custom dashboards through natural language*

- ✅ Natural language artifact creation
- ✅ Conversational onboarding flow
- ✅ Dynamic artifact rendering (metrics, progress, lists, text)
- ✅ Artifact management (rename, delete, activate)
- ✅ AI-powered editing sidebar
- ✅ Collapsible sidebar with artifact navigation
- ✅ Custom branding and design system

### **Phase 2: Data Integration (Q1 2025)**
*Goal: Connect artifacts to real data sources*

- 🎯 Data persistence and updates
- 🎯 External integrations (Stripe, Google Analytics, etc.)
- 🎯 Real-time data syncing
- 🎯 Manual data entry forms
- 🎯 CSV/Excel import

### **Phase 3: Collaboration & Sharing (Q2 2025)**
*Goal: Enable team collaboration on artifacts*

- 🎯 Share artifacts with team members
- 🎯 Real-time collaboration
- 🎯 Comments and annotations
- 🎯 Version history
- 🎯 Export to PDF/PNG

### **Phase 4: Intelligence & Automation (Q3 2025)**
*Goal: Proactive insights and automated actions*

- 🎯 AI-generated insights from artifact data
- 🎯 Automated alerts and notifications
- 🎯 Predictive analytics
- 🎯 Automated data collection
- 🎯 Smart recommendations

See `MISSION_STATEMENT.md` and `BUILD_STRATEGY.md` for detailed roadmap.

---

## 🔐 Environment Variables

### Backend (.env)
```
# OpenAI
OPENAI_API_KEY=sk-...

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_KEY=eyJxxx...

# App
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

**Last updated:** November 28, 2024
