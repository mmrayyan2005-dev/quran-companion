"""
One-time / re-runnable ingestion of Quran text + translation data from
the Al Quran Cloud API (api.alquran.cloud) into our database.

This is the ONLY path by which rows in `surahs` and `verses` are created
or updated. Run it again to refresh data — never hand-edit rows in psql.
That discipline is what the cricket project's pipeline.py was missing,
which let stale manual overrides silently double player run counts.

Note: we originally targeted api.quran.com, but that API has moved behind
an app-credential gateway (Quran Foundation) and no longer returns
translations on unauthenticated requests. Al Quran Cloud (a long-running,
free, no-auth public API) is the replacement source.

Usage:
    python -m scripts.ingest_quran_data
"""
import sys

import httpx
from sqlalchemy.orm import Session

from app.db.session import SessionLocal, engine, Base
from app.models.verse import Surah, Verse

BASE_URL = "https://api.alquran.cloud/v1"
ARABIC_EDITION = "quran-uthmani"
TRANSLATION_EDITION = "en.sahih"  # Saheeh International


def fetch_surah_list(client: httpx.Client) -> list[dict]:
    resp = client.get(f"{BASE_URL}/surah")
    resp.raise_for_status()
    return resp.json()["data"]


def fetch_surah_editions(client: httpx.Client, surah_id: int) -> tuple[dict, dict]:
    """Returns (arabic_edition_data, translation_edition_data) for one surah."""
    resp = client.get(f"{BASE_URL}/surah/{surah_id}/editions/{ARABIC_EDITION},{TRANSLATION_EDITION}")
    resp.raise_for_status()
    editions = resp.json()["data"]
    return editions[0], editions[1]


def validate_surah_record(raw: dict) -> None:
    """Fail loudly on bad data rather than silently inserting garbage."""
    if not (1 <= raw["number"] <= 114):
        raise ValueError(f"Invalid surah number: {raw['number']}")
    if raw["numberOfAyahs"] <= 0:
        raise ValueError(f"Surah {raw['number']} has non-positive ayah count")


def ingest(db: Session) -> None:
    with httpx.Client(timeout=30.0) as client:
        surahs_raw = fetch_surah_list(client)
        print(f"Fetched {len(surahs_raw)} surahs from API")

        for s in surahs_raw:
            validate_surah_record(s)
            surah_id = s["number"]

            surah = db.get(Surah, surah_id) or Surah(id=surah_id)
            surah.name_arabic = s["name"]
            surah.name_english = s["englishNameTranslation"]
            surah.name_transliteration = s["englishName"]
            surah.revelation_place = "Makkah" if s["revelationType"] == "Meccan" else "Madinah"
            surah.verse_count = s["numberOfAyahs"]
            db.merge(surah)
            db.commit()

            arabic_edition, translation_edition = fetch_surah_editions(client, surah_id)
            arabic_ayahs = arabic_edition["ayahs"]
            translation_ayahs = translation_edition["ayahs"]

            expected_count = s["numberOfAyahs"]
            if len(arabic_ayahs) != expected_count or len(translation_ayahs) != expected_count:
                # Loud warning rather than a silent partial dataset —
                # exactly the kind of gap the Cricsheet coverage issue
                # went unnoticed for too long in the cricket project.
                print(
                    f"  WARNING: surah {surah_id} expected {expected_count} ayahs, "
                    f"got {len(arabic_ayahs)} arabic / {len(translation_ayahs)} translation",
                    file=sys.stderr,
                )

            for arabic_ayah, translation_ayah in zip(arabic_ayahs, translation_ayahs):
                ayah_number = arabic_ayah["numberInSurah"]
                verse = (
                    db.query(Verse)
                    .filter_by(surah_id=surah_id, ayah_number=ayah_number)
                    .one_or_none()
                    or Verse(surah_id=surah_id, ayah_number=ayah_number)
                )
                verse.text_arabic = arabic_ayah["text"]
                verse.text_translation_en = translation_ayah["text"]
                verse.juz_number = arabic_ayah["juz"]
                verse.page_number = arabic_ayah["page"]
                db.add(verse)

            db.commit()
            print(f"  Ingested surah {surah_id} ({len(arabic_ayahs)} verses)")

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
