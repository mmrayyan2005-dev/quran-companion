"""
One-time / re-runnable ingestion of tafsir (Quranic commentary) data from
UmmahAPI (ummahapi.com) into our database.

Same discipline as ingest_quran_data.py: this is the ONLY path tafsir rows
enter the database. Never hand-edit the tafsirs table.

Differences from the Quran text ingestion:
- Rate-limited: UmmahAPI allows 100 requests/minute for the tafsir
  endpoint. At 6,236 verses per source, that's ~65+ minutes per tafsir
  source — this script sleeps between requests to stay safely under
  that limit, and is meant to be left running, not babysat.
- Resumable: re-running skips (verse, source) pairs already ingested,
  so if it's interrupted (closed terminal, network drop), just run it
  again — it picks up where it left off instead of restarting or
  duplicating rows.
- Source-scoped: run one tafsir source at a time via --source, so you
  can start with Ibn Kathir now and add Ma'arif/Muyassar later without
  re-doing completed work.

Usage:
    python -m scripts.ingest_tafsir_data --source ibn_kathir
    python -m scripts.ingest_tafsir_data --source maarif
    python -m scripts.ingest_tafsir_data --source muyassar
"""
import argparse
import sys
import time

import httpx
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.verse import Verse, Tafsir

BASE_URL = "https://ummahapi.com/api/tafsir"

# Display names for each source key — used as Tafsir.source_name so the
# frontend can show a human-readable label, not the raw API key.
SOURCE_DISPLAY_NAMES = {
    "ibn_kathir": "Ibn Kathir (Abridged)",
    "maarif": "Ma'arif al-Quran",
    "muyassar": "Tafsir Muyassar",
}

# Stay safely under UmmahAPI's stated 100 requests/minute limit for the
# tafsir endpoint.
SECONDS_BETWEEN_REQUESTS = 0.7
MAX_RETRIES_PER_VERSE = 2


def fetch_tafsir(client: httpx.Client, source: str, surah_id: int, ayah_number: int) -> dict | None:
    url = f"{BASE_URL}/{source}/surah/{surah_id}/ayah/{ayah_number}"
    for attempt in range(1, MAX_RETRIES_PER_VERSE + 1):
        try:
            resp = client.get(url, timeout=20.0)
            resp.raise_for_status()
            return resp.json()
        except (httpx.HTTPError, httpx.TimeoutException) as e:
            if attempt == MAX_RETRIES_PER_VERSE:
                print(f"  WARNING: failed to fetch {surah_id}:{ayah_number} after {attempt} tries: {e}", file=sys.stderr)
                return None
            time.sleep(2)  # brief backoff before retry
    return None


def already_ingested_verse_ids(db: Session, source_name: str) -> set[int]:
    rows = db.query(Tafsir.verse_id).filter(Tafsir.source_name == source_name).all()
    return {r[0] for r in rows}


def ingest(db: Session, source: str) -> None:
    if source not in SOURCE_DISPLAY_NAMES:
        raise ValueError(f"Unknown source '{source}'. Valid options: {list(SOURCE_DISPLAY_NAMES)}")

    source_name = SOURCE_DISPLAY_NAMES[source]
    verses = db.query(Verse).order_by(Verse.surah_id, Verse.ayah_number).all()
    already_done = already_ingested_verse_ids(db, source_name)

    remaining = [v for v in verses if v.id not in already_done]
    print(f"Source: {source_name}")
    print(f"Total verses: {len(verses)} | Already ingested: {len(already_done)} | Remaining: {len(remaining)}")

    if not remaining:
        print("Nothing to do — this source is already fully ingested.")
        return

    with httpx.Client() as client:
        for i, verse in enumerate(remaining, start=1):
            data = fetch_tafsir(client, source, verse.surah_id, verse.ayah_number)
            time.sleep(SECONDS_BETWEEN_REQUESTS)

            if data is None:
                continue  # already warned in fetch_tafsir; move on rather than halt the whole run

            if not data.get("success") or "tafsir" not in data.get("data", {}):
                print(f"  WARNING: unexpected response shape for {verse.surah_id}:{verse.ayah_number}, skipping", file=sys.stderr)
                continue

            text = data["data"]["tafsir"].get("text")
            if not text:
                print(f"  WARNING: empty tafsir text for {verse.surah_id}:{verse.ayah_number}, skipping", file=sys.stderr)
                continue

            tafsir_row = Tafsir(verse_id=verse.id, source_name=source_name, text=text)
            db.add(tafsir_row)

            if i % 25 == 0:
                db.commit()
                print(f"  Progress: {i}/{len(remaining)} ({verse.surah_id}:{verse.ayah_number} done)")

        db.commit()

    print(f"Ingestion complete for {source_name}.")


def main() -> None:
    parser = argparse.ArgumentParser(description="Ingest tafsir data for one source.")
    parser.add_argument(
        "--source",
        required=True,
        choices=list(SOURCE_DISPLAY_NAMES),
        help="Which tafsir source to ingest.",
    )
    args = parser.parse_args()

    db = SessionLocal()
    try:
        ingest(db, args.source)
    finally:
        db.close()


if __name__ == "__main__":
    main()
