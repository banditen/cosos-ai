# Development Guide

## Local Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 14+
- Git

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env

# Edit .env with your local configuration
# Start development server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

API docs available at: `http://localhost:8000/docs`

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local

# Edit .env.local with your configuration
# Start development server
npm run dev
```

Frontend available at: `http://localhost:3000`

## Code Style

### Python
- Follow PEP 8
- Use type hints
- Format with `black`
- Check with `flake8`

```bash
# Format code
black backend/

# Check style
flake8 backend/ --max-line-length=100

# Type check
mypy backend/
```

### JavaScript/TypeScript
- Use Prettier
- ESLint for linting
- Follow Next.js conventions

```bash
# Format code
npm run format

# Lint code
npm run lint

# Type check
npm run type-check
```

## Git Workflow

1. Create feature branch: `git checkout -b feat/feature-name`
2. Make changes and commit: `git commit -m "feat(scope): description"`
3. Push to GitHub: `git push origin feat/feature-name`
4. Create Pull Request for review

## Commit Message Format

```
type(scope): subject

type: feat, fix, docs, refactor, test, chore
scope: brief scope of change
subject: max 50 characters, imperative mood
```

Examples:
- `feat(gmail): add email sync background job`
- `fix(chat): resolve context search timeout`
- `docs(readme): update installation instructions`

## Testing

### Backend
```bash
cd backend

# Run tests
pytest

# Run tests with coverage
pytest --cov=. --cov-report=html

# Run specific test
pytest tests/test_gmail_service.py::test_fetch_emails
```

### Frontend
```bash
cd frontend

# Run tests (when added)
npm test
```

## Debugging

### Backend
- Use print statements or Python debugger: `import pdb; pdb.set_trace()`
- Check logs: `tail -f backend_logs.txt`
- Use FastAPI interactive docs: `http://localhost:8000/docs`

### Frontend
- Use browser DevTools (F12)
- Check console for errors
- Use React DevTools browser extension

## Database

### Migrations
```bash
cd backend

# Create migration
alembic revision --autogenerate -m "add users table"

# Apply migrations
alembic upgrade head

# Rollback
alembic downgrade -1
```

## Deployment

See `DEPLOYMENT.md` for deployment instructions.

## Troubleshooting

### Backend won't start
- Check Python version: `python --version` (needs 3.11+)
- Verify .env file exists
- Check port 8000 is available: `lsof -i :8000`
- Verify Supabase credentials

### Frontend won't start
- Check Node version: `node --version` (needs 18+)
- Clear node_modules: `rm -rf node_modules && npm install`
- Check port 3000 is available: `lsof -i :3000`

### Database connection fails
- Verify DATABASE_URL in .env
- Check PostgreSQL is running
- Verify credentials are correct

## Performance Tips

- Use FastAPI's built-in caching for frequently accessed data
- Implement pagination for large data sets
- Use database indexes for common queries
- Monitor API response times in production

## Resources

- [FastAPI Docs](https://fastapi.tiangolo.com)
- [Next.js Docs](https://nextjs.org/docs)
- [PostgreSQL Docs](https://www.postgresql.org/docs)
- [Supabase Docs](https://supabase.com/docs)
