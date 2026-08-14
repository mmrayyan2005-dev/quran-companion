"""
One-time / re-runnable ingestion of Quran text + translation data from
the Quran.com API (api.quran.com) into our database.

This is the ONLY path by which rows in `surahs` and `verses` are created
or updated. Run it again to refresh data — never hand-edit rows in psql.
That discipline is what the cricket project's pipeline.py was missing,
which let stale manual overrides silently double player run counts.

Usage:
    python -m scripts.ingest_quran_data
"""
import sys

import httpx
from sqlalchemy.orm import Session

from app.db.config import settings
from app.db.session import SessionLocal, engine, Base
from app.models.verse import Surah, Verse


def fetch_surah_list(client: httpx.Client) -> list[dict]:
    resp = client.get(f"{settings.quran_api_base_url}/chapters", params={"language": "en"})
    resp.raise_for_status()
    return resp.json()["chapters"]


def fetch_verses_for_surah(client: httpx.Client, surah_id: int) -> list[dict]:
    resp = client.get(
        f"{settings.quran_api_base_url}/verses/by_chapter/{surah_id}",
        params={
            "language": "en",
            "words": "false",
            "translations": "131",  # Saheeh International
            "fields": "text_uthmani,juz_number,page_number",
            "per_page": 300,
        },
    )
    resp.raise_for_status()
    return resp.json()["verses"]


def validate_surah_record(raw: dict) -> None:
    """Fail loudly on bad data rather than silently inserting garbage."""
    if not (1 <= raw["id"] <= 114):
        raise ValueError(f"Invalid surah id: {raw['id']}")
    if raw["verses_count"] <= 0:
        raise ValueError(f"Surah {raw['id']} has non-positive verse count")


def ingest(db: Session) -> None:
    with httpx.Client(timeout=30.0) as client:
        surahs_raw = fetch_surah_list(client)
        print(f"Fetched {len(surahs_raw)} surahs from API")

        for s in surahs_raw:
            validate_surah_record(s)

            surah = db.get(Surah, s["id"]) or Surah(id=s["id"])
            surah.name_arabic = s["name_arabic"]
            surah.name_english = s["translated_name"]["name"]
            surah.name_transliteration = s["name_simple"]
            surah.revelation_place = s["revelation_place"].capitalize()
            surah.verse_count = s["verses_count"]
            db.merge(surah)
            db.commit()

            verses_raw = fetch_verses_for_surah(client, s["id"])
            expected_count = s["verses_count"]
            if len(verses_raw) != expected_count:
                # Loud warning rather than a silent partial dataset —
                # exactly the kind of gap the Cricsheet coverage issue
                # went unnoticed for too long in the cricket project.
                print(
                    f"  WARNING: surah {s['id']} expected {expected_count} verses, "
                    f"got {len(verses_raw)}",
                    file=sys.stderr,
                )

            for v in verses_raw:
                ayah_number = int(v["verse_key"].split(":")[1])
                verse = (
                    db.query(Verse)
                    .filter_by(surah_id=s["id"], ayah_number=ayah_number)
                    .one_or_none()
                    or Verse(surah_id=s["id"], ayah_number=ayah_number)
                )
                verse.text_arabic = v["text_uthmani"]
                verse.text_translation_en = v["translations"][0]["text"]
                verse.juz_number = v["juz_number"]
                verse.page_number = v["page_number"]
                db.add(verse)

            db.commit()
            print(f"  Ingested surah {s['id']} ({len(verses_raw)} verses)")

    print("Ingestion complete.")


def main() -> None:
    Base.metadata.create_all(bind=engine)  # dev convenience; prod uses alembic
    db = SessionLocal()
    try:
        ingest(db)
    finally:
        db.close()


if __name__ == "__main__":
    main()
