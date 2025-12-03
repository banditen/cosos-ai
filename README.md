# Cosos — The Engine Room That Runs With You

**Connect your tools. Get instant insights. Know if you're winning.**

🌐 **Website:** [cosos.xyz](https://cosos.xyz)

---

## 🎯 What is Cosos?

Cosos connects to your existing tools (Gmail, Calendar, Linear, Slack, Notion) and gives you **instant clarity** on what matters most.

### How It Works:
1. **Connect Your Tools** - One-click OAuth for Gmail, Calendar, Linear, Slack, Notion
2. **Get First Analysis** - AI syncs your data and shows immediate insights
3. **Daily Clarity** - Wake up knowing your priorities

---

## 🚀 Current Status

**Phase:** MVP Development
**Last Updated:** December 3, 2025

### What's Working:
- ✅ Google OAuth login (Supabase)
- ✅ New onboarding: Welcome → Connect Tools → Context → First Analysis
- ✅ Integration OAuth: Gmail, Calendar, Linear, Slack, Notion
- ✅ Data sync (emails, calendar events, Linear issues)
- ✅ Clean minimal UI with brand identity

### What's Next:
- 🎯 Home page with daily insights
- 🎯 AI-generated summaries from synced data
- 🎯 Custom artifact builder (future phase)

---

## 📦 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, TypeScript, Tailwind, shadcn/ui |
| Backend | Python, FastAPI |
| Database | Supabase (PostgreSQL + RLS) |
| Auth | Supabase Auth (Google OAuth) |
| AI | OpenAI GPT-4o-mini |

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

## 📁 Key Files

```
app/src/
├── app/
│   ├── login/page.tsx        # Login
│   ├── setup/page.tsx        # Onboarding flow
│   ├── auth/callback/page.tsx # OAuth callback
│   └── (app)/home/page.tsx   # Main dashboard
├── components/
│   └── setup/steps/          # Onboarding step components
└── lib/supabase.ts           # Supabase client

backend/
├── main.py                   # FastAPI app
├── routes/
│   ├── auth.py              # Google OAuth
│   ├── linear.py            # Linear OAuth
│   ├── slack.py             # Slack OAuth
│   └── notion.py            # Notion OAuth
└── services/                # Business logic
```

---

## 📄 License

MIT License

**Last updated:** December 3, 2025
