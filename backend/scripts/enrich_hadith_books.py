"""
Enriches already-ingested hadiths with their traditional book/topic
categorization (e.g. "Prayer", "Fasting", "Jihad").

This is a SEPARATE step from ingest_hadith_data.py on purpose: it doesn't
re-fetch hadith text at all, just tags existing rows using the source
dataset's section metadata. Safe and fast to run after ingestion — it's
a one-time bulk fetch of info.json (contains all collections), not a
per-hadith API call, so no rate limiting concerns here.

Source: the underlying fawazahmed0/hadith-api dataset (same one UmmahAPI
wraps), which provides section names and per-hadith book numbers via a
single metadata file rather than a per-hadith field.

Usage:
    python -m scripts.enrich_hadith_books --source bukhari
    python -m scripts.enrich_hadith_books --source muslim
"""
import argparse
import sys

import httpx

from app.db.session import SessionLocal
from app.models.hadith import HadithCollection, HadithBook, Hadith

INFO_URL = "https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/info.json"


def fetch_info() -> dict:
    with httpx.Client(timeout=60.0) as client:
        resp = client.get(INFO_URL)
        resp.raise_for_status()
        return resp.json()


def enrich(source: str) -> None:
    print(f"Fetching book/section metadata for all collections (one-time, ~large file)...")
    info = fetch_info()

    if source not in info:
        raise ValueError(f"'{source}' not found in source metadata. Available keys include: {list(info)[:10]}...")

    collection_info = info[source]
    sections = collection_info["metadata"]["sections"]
    hadith_refs = {h["hadithnumber"]: h["reference"]["book"] for h in collection_info["hadiths"]}

    db = SessionLocal()
    try:
        collection = db.query(HadithCollection).filter(HadithCollection.key == source).one_or_none()
        if collection is None:
            print(
                f"ERROR: no HadithCollection row for '{source}' yet — run "
                f"ingest_hadith_data.py --source {source} first.",
                file=sys.stderr,
            )
            return

        book_by_number = {}
        for number_str, name in sections.items():
            number = int(number_str)
            if number == 0 or not name:
                continue  # section "0" is a placeholder, not a real book
            book = (
                db.query(HadithBook)
                .filter(HadithBook.collection_id == collection.id, HadithBook.book_number == number)
                .one_or_none()
            )
            if book is None:
                book = HadithBook(collection_id=collection.id, book_number=number, book_name=name)
                db.add(book)
                db.flush()
            else:
                book.book_name = name  # keep name current if it changed
            book_by_number[number] = book
        db.commit()
        print(f"Upserted {len(book_by_number)} books for {collection.name}.")

        hadiths = db.query(Hadith).filter(Hadith.collection_id == collection.id).all()
        tagged = 0
        skipped = 0
        for h in hadiths:
            book_number = hadith_refs.get(h.hadith_number)
            if book_number is None or book_number not in book_by_number:
                skipped += 1
                continue
            h.book_id = book_by_number[book_number].id
            tagged += 1

        db.commit()
        print(f"Tagged {tagged} hadiths with a book. Skipped {skipped} (no matching reference — not necessarily an error, some numbering schemes differ slightly).")

    finally:
        db.close()

    print(f"Enrichment complete for {source}.")


def main() -> None:
    parser = argparse.ArgumentParser(description="Tag ingested hadiths with their book/topic.")
    parser.add_argument("--source", required=True, help="Collection key, e.g. bukhari, muslim.")
    args = parser.parse_args()
    enrich(args.source)


if __name__ == "__main__":
    main()
