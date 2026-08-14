# Quran Study Companion

Verse search, bookmarking, tafsir lookup, and a spaced-repetition
memorization tracker. Built as a proper full-stack app: FastAPI + PostgreSQL
backend, React frontend (coming next).

## Why this project is structured differently from the cricket dashboard

| Cricket project issue | What's different here |
|---|---|
| Manual data overrides → doubled run counts | `scripts/ingest_quran_data.py` is the *only* way data enters the DB. Never edit rows by hand. |
| No validation → bad outliers slipped through | Pydantic schemas validate every record at ingestion and at the API boundary (`app/schemas/`). |
| Logic bugs (gender-mixing in clustering) found late | Core logic (e.g. spaced repetition in `app/services/`) is pure, isolated, and unit-tested from the first commit. |
| Fragile frontend tightly coupled to backend | Clean REST API with auto-generated OpenAPI docs (`/docs`) — frontend only ever talks JSON. |
| Mobile responsiveness bolted on late | Frontend (when added) will be mobile-first from the start. |
| No CI, bugs caught manually | `.github/workflows/backend-tests.yml` runs the test suite on every push. |

## Project status

**Done:**
- Backend structure: models, schemas, services, API routes
- Verse/Surah models + ingestion script (Quran.com API)
- Bookmark model
- Spaced repetition service (SM-2 style) + full unit tests
- Memorization API endpoints
- CI pipeline (pytest on push)

**Next:**
- Alembic migrations (initial revision)
- Auth (JWT-based user accounts)
- Tafsir data source + ingestion
- React frontend (mobile-first)
- Deployment (Railway/Render for backend, Vercel for frontend)

## Local setup

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

cp .env.example .env   # edit DATABASE_URL if needed

# Once Postgres is running and migrations exist:
python -m scripts.ingest_quran_data

uvicorn app.main:app --reload
```

Visit `http://localhost:8000/docs` for interactive API docs.

## Running tests

```bash
cd backend
pytest -v
```
