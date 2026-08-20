# Handoff Notes — Quran Study Companion

For a new Claude conversation picking this up. Rayyan (4th-year Data
Science student, IMSciences Peshawar) is building this as a portfolio
project. He prefers step-by-step, explicit copy-paste instructions —
he's a beginner with terminal/deployment tooling, capable in code/logic.
Primary machine: Windows, username `dell`.

## What this project is

Quran Study Companion — a full-stack app: FastAPI + PostgreSQL backend,
React (Vite) frontend. Verse reading, search, bookmarking, tafsir, and
spaced-repetition memorization. Long-term vision (see ROADMAP.md):
evolve into a full Islamic app — hadith collections, duas, prayer times.

GitHub: `github.com/mmrayyan2005-dev/quran-companion`
Live backend: `https://quran-companion-production-acc7.up.railway.app`
Live frontend: `https://quran-companion-ashen.vercel.app`
Local project path: `C:\Users\dell\Downloads\quran-companion`

## Current state (as of this handoff)

**Fully built and working:**
- Backend: models, schemas, services, API routes — verses, auth (JWT),
  bookmarks, memorization (spaced repetition, SM-2 style), tafsir
- 16/16 backend tests passing
- Alembic migrations set up (initial revision stamped)
- Frontend: Read, Search, Saved, Memorize, Login/Signup, tafsir panel —
  illuminated-manuscript design (deep teal, gold accent, Amiri/Spectral/
  Inter fonts), mobile-first with bottom nav
- CI (GitHub Actions) runs backend tests on every push
- **Deployed live**: backend on Railway, frontend on Vercel, both
  auto-redeploy on every push to `main`
- Database: Supabase Postgres, full Quran text ingested (114 surahs,
  6,236 verses, Arabic + English translation)

**In progress right now:**
- Tafsir ingestion (`scripts/ingest_tafsir_data.py --source ibn_kathir`)
  was running in the user's terminal when this handoff was written —
  check with the user whether it finished. It's resumable (safe to
  re-run, skips completed verses) if it stopped partway.
- Only Ibn Kathir has been started. Ma'arif al-Quran and Muyassar
  (`--source maarif`, `--source muyassar`) still need to run — same
  script, same command pattern, just swap the source name. Each full
  run against 6,236 verses takes roughly 70-90 minutes (rate-limited to
  stay under UmmahAPI's 100 req/min).
- The tafsir API endpoint and frontend `TafsirPanel` component are
  built, but the user had NOT yet merged/pulled the latest code into
  their local project when this handoff was written — check whether
  they did before continuing. If not, the tafsir picker UI won't show
  up locally even though ingestion may have progressed.

## Important operational context

**Windows environment gotchas hit repeatedly this session — don't
repeat these:**
- User is on Python 3.14 (very new) — package versions pinned to older
  releases will fail to find wheels and try to build from source, which
  fails without a C compiler. Always use `>=` version floors for new
  dependencies, not exact pins, unless there's a specific reason.
- `pip install` requires the venv to be activated
  (`venv\Scripts\activate`) every new terminal session — the user has
  forgotten this multiple times, causing confusing "module not found"
  errors that look unrelated to the real cause.
- Notepad-based file edits have repeatedly failed silently (edits not
  saving, or saving to a `.txt`-suffixed duplicate) — prefer giving
  the user complete file replacements via a downloadable zip over
  incremental Notepad edits. When a small in-place edit is
  unavoidable, verify it landed using `findstr "some unique string" path`
  before proceeding, don't assume it worked.
- Command Prompt's `>` redirects — a stray `>` in copy-pasted text
  creates unwanted files. Watched for stray files named `type`,
  `2.9.12` etc. this session, all from this cause.

**Credentials — already exposed in this chat history, already rotated
once, exposure risk is understood/accepted by the user for this
personal project:**
- Supabase DB password and app SECRET_KEY have been posted in this
  conversation's history more than once. The user is aware and has
  chosen not to prioritize rotating them further (his call, low-stakes
  personal project). Don't re-lecture him about it unless he brings it
  up — just don't casually reprint full secrets either.
- **Database connection**: MUST use Supabase's **Session Pooler**
  connection string, NOT the direct connection. The direct connection
  resolves to an IPv6-only address that Railway can't reach ("Network
  is unreachable") — this cost significant debugging time this session.
  Pooler format: `postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres`
- **CORS**: backend's `CORS_ALLOWED_ORIGINS` env var (comma-separated)
  must include both `http://localhost:5173` (local dev) and the live
  Vercel URL. If the user deploys a new frontend URL later, this needs
  updating in Railway's variables too.

## Established project conventions (keep following these)

- Data enters the DB ONLY through ingestion scripts in `scripts/` —
  never hand-edit rows. This was the core lesson from a prior project
  (cricket analytics dashboard) where manual overrides caused silent
  data corruption.
- Pure logic (spaced repetition, password hashing/JWT) lives in
  `app/services/` and `app/core/`, decoupled from DB/FastAPI so it's
  unit-testable in isolation. Don't let DB imports leak into these.
- Every new feature gets a test before being considered done.
- Schema changes go through Alembic (`alembic revision --autogenerate`
  + `alembic upgrade head`), not the `Base.metadata.create_all()` dev
  shortcut.
- File delivery pattern that's worked well: make changes in the sandbox,
  run tests/build to verify, zip only the changed files (not the whole
  project) with a clear name, `present_files`, then walk the user
  through extracting the zip into their existing project folder
  (Windows will prompt to replace — "Yes to All" is the answer) rather
  than pasting code into Notepad.

## Immediate next steps

1. Ask the user whether the Ibn Kathir ingestion finished, and whether
   they've merged the tafsir API + frontend code yet.
2. If ingestion finished: help them run `--source maarif` and
   `--source muyassar` next (same pattern, one at a time).
3. If code wasn't merged yet: walk them through it (extract zip, "Yes
   to All", restart servers, `pytest -v`, test live).
4. Once all 3 tafsir sources are in: commit, push, confirm Railway +
   Vercel auto-redeploy succeeds, test tafsir picker on the live site.
5. After that: Phase 1's checklist is fully done, Phase 2 (tafsir) will
   be fully done — Phase 3 (hadith collections) is next per ROADMAP.md.

## Where to find things

- `ROADMAP.md` (project root) — the full phased plan, kept up to date
  as phases complete.
- `README.md` (project root) — setup instructions, lessons-learned table.
- This project's memory of past conversations includes the user's
  broader context (other portfolio projects, coursework, interests).
