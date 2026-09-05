"""
One-time / re-runnable ingestion of hadith data from UmmahAPI
(ummahapi.com) into our database.

Same discipline as ingest_tafsir_data.py: this is the ONLY path hadith
rows enter the database. Resumable (skips already-ingested hadiths),
rate-limited (100 req/min ceiling on UmmahAPI), and resilient to
dropped DB connections mid-run (reconnects rather than crashing a
multi-hour job over one network blip).

Scope: starts with Bukhari and Muslim (the two most authoritative
collections) rather than all 10 at once — same "one meaningful chunk
at a time" approach used for tafsir sources. Other collections can be
added later with the same command pattern.

Usage:
    python -m scripts.ingest_hadith_data --source bukhari
    python -m scripts.ingest_hadith_data --source muslim
"""
import argparse
import sys
import time

import httpx
from sqlalchemy.exc import OperationalError

from app.db.session import SessionLocal
from app.models.hadith import HadithCollection, Hadith

BASE_URL = "https://ummahapi.com/api/hadith"
SECONDS_BETWEEN_REQUESTS = 0.7
MAX_RETRIES_PER_HADITH = 2


def fetch_collections_metadata(client: httpx.Client) -> list[dict]:
    resp = client.get(f"{BASE_URL}/collections", timeout=20.0)
    resp.raise_for_status()
    return resp.json()["data"]["collections"]


def fetch_hadith(client: httpx.Client, collection_key: str, number: int) -> dict | None:
    url = f"{BASE_URL}/{collection_key}/{number}"
    for attempt in range(1, MAX_RETRIES_PER_HADITH + 1):
        try:
            resp = client.get(url, timeout=20.0)
            resp.raise_for_status()
            return resp.json()
        except (httpx.HTTPError, httpx.TimeoutException) as e:
            if attempt == MAX_RETRIES_PER_HADITH:
                print(f"  WARNING: failed to fetch {collection_key} #{number} after {attempt} tries: {e}", file=sys.stderr)
                return None
            time.sleep(2)
    return None


def ensure_collection_row(db, key: str, meta: dict) -> HadithCollection:
    """Upserts the HadithCollection row from the /collections metadata."""
    row = db.query(HadithCollection).filter(HadithCollection.key == key).one_or_none()
    if row is None:
        row = HadithCollection(key=key)
    row.name = meta["name"]
    row.arabic_name = meta.get("arabic_name")
    row.author = meta.get("author")
    row.reliability = meta.get("reliability")
    row.total_hadiths = meta["total_hadiths"]
    db.add(row)
    db.commit()
    return row


def ingest(source: str) -> None:
    db = SessionLocal()
    try:
        with httpx.Client() as client:
            all_meta = fetch_collections_metadata(client)
        meta_by_key = {c["key"]: c for c in all_meta}

        if source not in meta_by_key:
            raise ValueError(f"Unknown source '{source}'. Valid options: {list(meta_by_key)}")

        collection = ensure_collection_row(db, source, meta_by_key[source])
        collection_id = collection.id
        total = collection.total_hadiths

        already_done_numbers = {
            n for (n,) in db.query(Hadith.hadith_number).filter(Hadith.collection_id == collection_id).all()
        }
    finally:
        db.close()

    remaining_numbers = [n for n in range(1, total + 1) if n not in already_done_numbers]
    print(f"Source: {meta_by_key[source]['name']} ({source})")
    print(f"Total hadiths: {total} | Already ingested: {len(already_done_numbers)} | Remaining: {len(remaining_numbers)}")

    if not remaining_numbers:
        print("Nothing to do — this collection is already fully ingested.")
        return

    db = SessionLocal()
    pending_count = 0

    with httpx.Client() as client:
        for i, number in enumerate(remaining_numbers, start=1):
            data = fetch_hadith(client, source, number)
            time.sleep(SECONDS_BETWEEN_REQUESTS)

            if data is None:
                continue

            if not data.get("success"):
                print(f"  WARNING: unexpected response for {source} #{number}, skipping", file=sys.stderr)
                continue

            h = data.get("data", {})
            english_text = h.get("english")
            if not english_text:
                print(f"  WARNING: empty english text for {source} #{number}, skipping", file=sys.stderr)
                continue

            for db_attempt in range(2):
                try:
                    hadith_row = Hadith(
                        collection_id=collection_id,
                        hadith_number=number,
                        text_arabic=h.get("arabic"),
                        text_english=english_text,
                        grade=h.get("grade"),
                    )
                    db.add(hadith_row)
                    pending_count += 1

                    if pending_count >= 25:
                        db.commit()
                        pending_count = 0
                        print(f"  Progress: {i}/{len(remaining_numbers)} (#{number} done)")
                    break
                except OperationalError as e:
                    print(f"  WARNING: DB connection issue, reconnecting and retrying: {e}", file=sys.stderr)
                    db.rollback()
                    db.close()
                    db = SessionLocal()
                    pending_count = 0
                    if db_attempt == 1:
                        print(f"  WARNING: giving up on #{number} after reconnect retry", file=sys.stderr)

        try:
            db.commit()
        except OperationalError:
            db.rollback()
            db.close()
            db = SessionLocal()
    db.close()

    print(f"Ingestion complete for {meta_by_key[source]['name']}.")


def main() -> None:
    parser = argparse.ArgumentParser(description="Ingest hadith data for one collection.")
    parser.add_argument("--source", required=True, help="Collection key, e.g. bukhari, muslim.")
    args = parser.parse_args()
    ingest(args.source)


if __name__ == "__main__":
    main()
