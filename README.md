# Cosos — The Engine Room That Runs With You

**Connect your tools. Get instant insights. Know if you're winning.**

🌐 **Website:** [cosos.xyz](https://cosos.xyz)

---

## 🎯 What is Cosos?

Cosos connects to your existing tools (Linear, Slack, Notion, Gmail, Calendar) and gives you **instant clarity** on what matters most—your priorities and progress.

---

## 🚀 Current Status

**Phase:** MVP Development
**Last Updated:** December 5, 2025

### What's Working:
- ✅ Google OAuth login (Supabase)
- ✅ Onboarding: Welcome → Connect Tools → Context → First Analysis
- ✅ Integration OAuth: Linear, Slack, Notion, Gmail, Calendar
- ✅ Home page with progress dashboard (completed issues, in-progress, completion rate)
- ✅ AI-powered context Q&A (chat with your data)
- ✅ Knowledge base for documents
- ✅ Clean minimal UI with consistent PageHeader navigation
- ✅ Brand icons via Iconify/Simple Icons

### What's Next:
- 🎯 Expand integrations (GitHub)
- 🎯 Custom artifact builder (prompt-driven business tools)
- 🎯 AI agents for automation

---

## 📦 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, TypeScript, Tailwind, shadcn/ui |
| Backend | Python, FastAPI |
| Database | Supabase (PostgreSQL + RLS) |
| Auth | Supabase Auth (Google OAuth) |
| AI | OpenAI GPT-4o-mini |
| Icons | Lucide React (UI), Iconify Simple Icons (brands) |

---

## 🚀 Quick Start

```bash
# Backend
cd backend
source venv/bin/activate
pip install -r requirements.txt
python main.py

# Frontend
cd app
npm install
npm run dev
```

Visit `http://localhost:3000`

---

## 📄 License

MIT License
