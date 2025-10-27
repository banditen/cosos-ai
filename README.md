# COSOS: AI Chief of Staff

An intelligent executive partner that helps founders think, plan, and execute — managing time, tasks, and context like a world-class Chief of Staff.

**Status:** MVP Development  
**Timeline:** 8–10 weeks (solo builder + AI IDE)  
**Start Date:** October 27, 2025  
**Target Launch:** January 2026

---

## 🎯 Project Overview

COSOS is a lightweight AI assistant that:
- Syncs your Gmail inbox and extracts key information
- Provides daily context and briefings through chat
- Automates email summarization and task extraction
- Learns your business context over time

**Core MVP Features:**
- ✅ Gmail OAuth + email sync
- ✅ Email-to-summary pipeline with Claude AI
- ✅ Chat interface with context search
- ✅ Daily email summaries
- ✅ Task extraction from conversations

**Not in MVP:**
- Calendar integration (Phase 2)
- Notion integration (Phase 2)
- Advanced analytics (Phase 2)
- Multi-user (Phase 2)

---

## 📦 Tech Stack (Simplified for Solo Builder)

### Backend
- **Language:** Python 3.11
- **Framework:** FastAPI
- **Database:** PostgreSQL (Supabase)
- **Vector Search:** pgvector (PostgreSQL built-in)
- **AI Model:** OpenAI GPT-4
- **Email:** Gmail API
- **Deployment:** Railway.app or Render.com

### Frontend
- **Framework:** Next.js 14 (React)
- **Language:** TypeScript
- **UI:** Tailwind CSS + shadcn/ui
- **Deployment:** Vercel

### Infrastructure
- **Auth:** Supabase Auth (JWT-based)
- **Email Queue:** Inline processing (no Redis)
- **Logging:** Console + Supabase logs

---

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- Git
- GitHub CLI (`gh`)

### 1. Clone Repository
```bash
git clone https://github.com/rasa/cosos-ai.git
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

# Run migrations
alembic upgrade head

# Start development server
uvicorn main:app --reload --port 8000
```

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Create .env.local (copy from .env.example)
cp .env.example .env.local

# Start development server
npm run dev
```

Visit `http://localhost:3000` for frontend, `http://localhost:8000/docs` for API.

---

## 📁 Project Structure

```
cosos-ai/
├── backend/                    # Python FastAPI backend
│   ├── main.py                # Application entry point
│   ├── config.py              # Configuration
│   ├── requirements.txt        # Python dependencies
│   ├── .env.example            # Environment variables template
│   ├── services/              # Core services
│   │   ├── gmail_service.py   # Gmail integration
│   │   ├── ai_service.py      # Claude/OpenAI integration
│   │   ├── context_service.py # Vector embeddings & search
│   │   └── chat_service.py    # Chat logic
│   └── tests/                 # Unit tests
│
├── frontend/                   # Next.js React frontend
│   ├── src/
│   │   ├── app/              # App router pages
│   │   ├── components/       # React components
│   │   ├── services/         # API client
│   │   └── hooks/            # Custom hooks
│   ├── package.json
│   └── .env.example
│
├── docs/                       # Documentation
│   ├── DEVELOPMENT.md         # Development guide
│   ├── API.md                 # API specification
│   └── DEPLOYMENT.md          # Deployment instructions
│
├── .gitignore
├── README.md                  # This file
└── LICENSE
```

---

## 📊 Development Timeline

| Week | Focus | Deliverables |
|------|-------|--------------|
| 1 | Backend scaffold + Gmail OAuth | FastAPI app, Gmail auth working |
| 2 | Email sync + storage | Emails fetched and stored in DB |
| 3 | AI integration + chat | Claude integration, basic chat endpoint |
| 4 | Frontend setup + UI | Next.js project, basic auth flow |
| 5 | Chat UI + context search | Working chat interface |
| 6 | Email summarization | Daily summary generation |
| 7 | Polish + error handling | Bug fixes, logging |
| 8 | Testing + deploy | MVP deployed to staging/production |

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

## 🔗 Important Links

- **Product Roadmap:** See `docs/ROADMAP.md`
- **Tech Stack Details:** See `docs/TECH_STACK.md`
- **API Documentation:** `http://localhost:8000/docs` (Swagger UI)
- **GitHub Issues:** Track bugs and features

---

## 📝 Commit Message Convention

```
type(scope): subject

fix(gmail): resolve email sync timeout
feat(chat): add context search to messages
docs(readme): update setup instructions
refactor(services): simplify email handler
test(api): add integration tests
```

Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`

---

## 🐛 Reporting Issues

1. Check existing issues first
2. Create issue with clear description
3. Include reproduction steps
4. Label appropriately (bug, feature-request, documentation)

---

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [FastAPI Documentation](https://fastapi.tiangolo.com)
- [Next.js Documentation](https://nextjs.org/docs)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)

---

## 📄 License

MIT License - See LICENSE file

---

**Built with ❤️ by a solo founder + AI IDE**

Last updated: October 27, 2025
