# Roadmap: Quran Study Companion → Full Islamic App

This is the plan for where this project goes next. Each phase is scoped to
be a complete, working addition on its own — following the same discipline
we used from day one: one source of truth for data, tests before it's
"done," and no feature half-built and left dangling.

**Rule for every phase below:** don't start the next one until the current
one has tests passing, is pushed to GitHub, and actually works end-to-end
in the app — not just "the backend returns JSON." This is exactly the
discipline that was missing in the cricket project.

---

## Phase 0 — Where we are now (done)

- FastAPI + PostgreSQL backend, cleanly structured
- Full Quran text (114 surahs, 6,236 verses, Arabic + English) ingested
- Verse search, bookmarks, auth (JWT), spaced-repetition memorization
- Alembic migrations, CI on GitHub, 14 passing tests
- React frontend: Read, Search, Saved, Memorize, Login/Signup

---

## Phase 1 — Polish what exists (small, do this first)

Before adding new content types, close the gaps in what's already built:

- [ ] Bookmarks page should show actual verse text, not just "Verse #1"
      (join verse data into the bookmarks response)
- [ ] Add a verse detail view reachable from bookmarks (tap → jump to
      that verse in its surah)
- [ ] "Add to memorization" button on a verse (right now memorization
      endpoints exist but nothing in the UI adds a verse to the queue)
- [ ] Push the frontend to GitHub (only the backend is there currently)
- [ ] Deploy backend + frontend somewhere live (Railway/Render for
      backend, Vercel for frontend) so you have a shareable link, not
      just "works on my machine"

**Why first:** a live, shareable, complete-feeling app is a much stronger
portfolio piece than a bigger app that's half-wired. Also — deploying now
means every phase after this gets tested against a real deployed
environment, not just localhost.

---

## Phase 2 — Multiple Tafsir sources

- [x] Research 2-3 free tafsir sources with usable APIs/datasets — landed
      on UmmahAPI (ummahapi.com), no key required, 100 req/min limit
- [x] New ingestion script: `scripts/ingest_tafsir_data.py`, following
      the same pattern as `ingest_quran_data.py` — resumable, rate-limited,
      one source at a time
- [x] API endpoint: `GET /api/v1/verses/{verse_id}/tafsir` — returns all
      ingested sources for a verse
- [x] Frontend: tafsir picker on the verse view (`TafsirPanel.jsx`) —
      expandable, lazy-loads on tap, shows a source-switcher once more
      than one source exists
- [ ] Ibn Kathir ingestion running (in progress as of this note)
- [ ] Ma'arif al-Quran ingestion (`--source maarif`)
- [ ] Muyassar ingestion (`--source muyassar`)

**Data model:** `Tafsir` table already existed in the schema — this
phase was "populate it and build UI around it," not "design something new."

---

## Phase 3 — Hadith collections

- [ ] New models: `HadithBook` (e.g. Sahih al-Bukhari), `Hadith`
      (book_id, chapter, number, arabic_text, english_text, grade)
- [ ] New Alembic migration for these tables
- [ ] Ingestion from a real source (Sunnah.com has a public API;
      confirm current terms/access before building against it)
- [ ] New API routes: browse by book, browse by chapter, search
- [ ] New frontend section: "Hadith" added to bottom nav or a secondary
      nav level (by this phase, 5 bottom-nav items may be too many —
      worth revisiting the nav structure, not just adding a 5th icon)

**Watch for:** hadith grading (sahih/hasan/da'if) matters a lot to
correctness — don't gloss over it in the data model, and cite the source
collection clearly in the UI so nothing gets presented without attribution.

---

## Phase 4 — Quranic duas

- [ ] New model: `Dua` (category, arabic_text, transliteration,
      translation, source_reference — e.g. which verse/hadith it's from)
- [ ] Unlike Quran/hadith, there's no single authoritative bulk API for
      this — likely a curated dataset you assemble deliberately (quality
      over speed here; this is exactly the kind of content where a wrong
      or unsourced entry is worse than a missing one)
- [ ] Categorized browse UI (morning/evening, travel, distress, etc.)

---

## Phase 5 — Prayer times

- [ ] No ingestion needed — call a prayer-times API live
      (Aladhan API is a common free option; confirm calculation method
      options since these vary by region/school of thought)
- [ ] Location handling: browser geolocation with a manual
      city-search fallback
- [ ] New frontend section with today's five prayer times + countdown
      to next prayer
- [ ] Consider: notification/reminder system is a natural follow-up but
      is its own significant scope (push notifications, background
      scheduling) — treat as a later phase, not bundled into this one

---

## Phase 6 — Pull it together

By this point the app has grown a lot. Revisit before adding more:

- [ ] Navigation structure — a bottom nav with 6+ items stops working;
      likely needs a "More" section or a different pattern
- [ ] Home screen redesign — with Quran + Tafsir + Hadith + Duas +
      Prayer Times, the current "surah list as homepage" may not be the
      right front door anymore
- [ ] Performance check — are queries still fast with much more data?
- [ ] Revisit RLS (Row Level Security) in Supabase before wider use —
      flagged back in Phase 0 as a pre-deployment must-do

---

## Notes on sequencing

- Tafsir (Phase 2) before Hadith (Phase 3) because it extends data you
  already have, lower risk, good next win.
- Duas (Phase 4) is deliberately after the two API-driven phases because
  it requires the most manual curation — better to do it once you're
  warmed up on the ingestion pattern, not as your first new content type.
- Prayer times (Phase 5) is technically the easiest (no database
  ingestion at all) but placed later so the app has real Quran+Hadith+Dua
  substance before layering in a utility feature.
