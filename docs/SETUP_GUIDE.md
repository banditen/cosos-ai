# COSOS Setup Guide

Complete guide to set up COSOS locally for development.

---

## Prerequisites

- Python 3.11+
- Node.js 18+
- Git
- Supabase account (free tier is fine)
- Google Cloud account (for OAuth)
- OpenAI API key

---

## Step 1: Supabase Setup

### 1.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up / Log in
3. Click "New Project"
4. Fill in:
   - **Name:** cosos-dev (or your choice)
   - **Database Password:** (save this!)
   - **Region:** Choose closest to you
5. Wait for project to be created (~2 minutes)

### 1.2 Get Supabase Credentials

1. In your project dashboard, go to **Settings** → **API**
2. Copy these values:
   - **Project URL** → `SUPABASE_URL`
   - **anon public** key → `SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_KEY`

### 1.3 Run Database Migrations

1. In Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy the entire contents of `backend/database/schema.sql`
4. Paste into the SQL editor
5. Click "Run" (bottom right)
6. You should see "Success. No rows returned"

**Verify tables created:**
- Go to **Table Editor**
- You should see: users, user_context, integrations, emails, calendar_events, daily_briefs, feedback, audit_log

### 1.4 Get Database URL

1. Go to **Settings** → **Database**
2. Scroll to **Connection string** → **URI**
3. Copy the connection string
4. Replace `[YOUR-PASSWORD]` with your database password
5. This is your `DATABASE_URL`

---

## Step 2: Google Cloud Setup (OAuth)

### 2.1 Create Google Cloud Project

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Click "Select a project" → "New Project"
3. Name: "COSOS" (or your choice)
4. Click "Create"

### 2.2 Enable APIs

1. In the search bar, type "Gmail API"
2. Click "Gmail API" → "Enable"
3. Repeat for "Google Calendar API"

### 2.3 Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Choose **External** (unless you have Google Workspace)
3. Fill in:
   - **App name:** COSOS
   - **User support email:** Your email
   - **Developer contact:** Your email
4. Click "Save and Continue"
5. **Scopes:** Click "Add or Remove Scopes"
   - Add: `https://www.googleapis.com/auth/gmail.readonly`
   - Add: `https://www.googleapis.com/auth/gmail.modify`
   - Add: `https://www.googleapis.com/auth/calendar.readonly`
6. Click "Save and Continue"
7. **Test users:** Add your email address
8. Click "Save and Continue"

### 2.4 Create OAuth Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click "Create Credentials" → "OAuth client ID"
3. Application type: **Web application**
4. Name: "COSOS Backend"
5. **Authorized redirect URIs:**
   - Add: `http://localhost:8000/api/v1/auth/google/callback`
6. Click "Create"
7. Copy:
   - **Client ID** → `GOOGLE_CLIENT_ID`
   - **Client Secret** → `GOOGLE_CLIENT_SECRET`

---

## Step 3: OpenAI Setup

1. Go to [platform.openai.com](https://platform.openai.com)
2. Sign up / Log in
3. Go to **API Keys**
4. Click "Create new secret key"
5. Name: "COSOS"
6. Copy the key → `OPENAI_API_KEY`

**Note:** You'll need to add credits to your OpenAI account. $5-10 is plenty for development.

---

## Step 4: Backend Setup

### 4.1 Clone Repository

```bash
cd backend
```

### 4.2 Create Virtual Environment

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 4.3 Install Dependencies

```bash
pip install -r requirements.txt
```

### 4.4 Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and fill in all the values you collected:

```bash
# Environment
ENVIRONMENT=development
DEBUG=true
PORT=8000

# Database (from Supabase Step 1.4)
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres

# Supabase (from Step 1.2)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_KEY=eyJxxx...

# OpenAI (from Step 3)
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
OPENAI_EMBEDDING_MODEL=text-embedding-ada-002

# Google OAuth (from Step 2.4)
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
GOOGLE_REDIRECT_URI=http://localhost:8000/api/v1/auth/google/callback

# Security
SECRET_KEY=your-random-secret-key-change-this

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8000
```

### 4.5 Start Backend

```bash
uvicorn main:app --reload --port 8000
```

You should see:
```
🚀 COSOS API starting up...
✅ Database connection successful
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### 4.6 Test API

Open browser to: http://localhost:8000/docs

You should see the FastAPI Swagger UI with endpoints:
- `/health`
- `/api/v1/auth/google/url`
- `/api/v1/auth/google/callback`
- `/api/v1/sync/gmail`
- `/api/v1/sync/calendar`
- `/api/v1/sync/all`

---

## Step 5: Test Gmail Integration

### 5.1 Get OAuth URL

1. Go to http://localhost:8000/docs
2. Find `GET /api/v1/auth/google/url`
3. Click "Try it out"
4. Enter a test `user_id` (e.g., "test-user-123")
5. Click "Execute"
6. Copy the `url` from the response

### 5.2 Authorize

1. Paste the URL in your browser
2. Sign in with your Google account
3. Grant permissions for Gmail and Calendar
4. You'll be redirected to `http://localhost:3000/auth/success` (will fail since frontend isn't running yet, but that's OK)

### 5.3 Verify Integration

1. Go to Supabase dashboard → **Table Editor** → **integrations**
2. You should see a row with:
   - `user_id`: test-user-123
   - `provider`: gmail
   - `is_active`: true
   - `account_email`: your email

### 5.4 Sync Emails

1. Go back to http://localhost:8000/docs
2. Find `POST /api/v1/sync/gmail`
3. Click "Try it out"
4. Enter:
   - `user_id`: test-user-123
   - `days_back`: 1
   - `max_results`: 10
5. Click "Execute"

You should see:
```json
{
  "message": "Successfully synced X emails",
  "synced_count": X,
  "user_id": "test-user-123"
}
```

### 5.5 Verify Emails

1. Go to Supabase → **Table Editor** → **emails**
2. You should see your synced emails!

### 5.6 Sync Calendar

1. Go to http://localhost:8000/docs
2. Find `POST /api/v1/sync/calendar`
3. Click "Try it out"
4. Enter `user_id`: test-user-123
5. Click "Execute"

Check **calendar_events** table in Supabase.

---

## Step 6: Troubleshooting

### Database connection fails

- Check `DATABASE_URL` is correct
- Make sure you replaced `[YOUR-PASSWORD]` with actual password
- Verify Supabase project is running

### OAuth fails

- Check `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct
- Verify redirect URI matches exactly: `http://localhost:8000/api/v1/auth/google/callback`
- Make sure you added your email as a test user in Google Cloud Console

### Gmail sync fails

- Make sure you completed OAuth flow first
- Check integration exists in database
- Verify Gmail API is enabled in Google Cloud Console

### OpenAI errors

- Check `OPENAI_API_KEY` is correct
- Make sure you have credits in your OpenAI account
- Verify API key has access to `gpt-4o-mini` and `text-embedding-ada-002`

---

## Next Steps

✅ Backend is running  
✅ Database is set up  
✅ Gmail + Calendar sync working  

**Now you can:**
1. Build the onboarding flow
2. Build the agent reasoning engine
3. Build the frontend

---

## Useful Commands

```bash
# Start backend
cd backend
source venv/bin/activate
uvicorn main:app --reload

# View logs
tail -f backend_logs.txt

# Check database
# Use Supabase dashboard → Table Editor

# Test API
curl http://localhost:8000/health
```

---

## Support

If you run into issues:
1. Check the logs in terminal
2. Check Supabase logs (Dashboard → Logs)
3. Verify all environment variables are set correctly
4. Make sure all APIs are enabled in Google Cloud Console

---

**You're all set! 🚀**

