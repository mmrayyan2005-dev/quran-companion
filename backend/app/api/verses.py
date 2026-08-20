from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.verse import Surah, Verse, Tafsir
from app.schemas.verse import SurahOut, VerseOut, VerseSearchResult, TafsirOut

router = APIRouter(prefix="/api/v1", tags=["verses"])


@router.get("/surahs", response_model=list[SurahOut])
def list_surahs(db: Session = Depends(get_db)):
    return db.query(Surah).order_by(Surah.id).all()


@router.get("/surahs/{surah_id}/verses", response_model=list[VerseOut])
def get_surah_verses(surah_id: int, db: Session = Depends(get_db)):
    if not (1 <= surah_id <= 114):
        raise HTTPException(status_code=400, detail="surah_id must be between 1 and 114")
    verses = db.query(Verse).filter(Verse.surah_id == surah_id).order_by(Verse.ayah_number).all()
    if not verses:
        raise HTTPException(status_code=404, detail="Surah not found")
    return verses


@router.get("/verses/{verse_id}/tafsir", response_model=list[TafsirOut])
def get_verse_tafsir(verse_id: int, db: Session = Depends(get_db)):
    """
    Returns all available tafsir entries for a verse, from whichever
    sources have been ingested so far (see scripts/ingest_tafsir_data.py).
    Empty list is a valid response — it just means no tafsir source has
    been ingested for this verse yet, not an error.
    """
    verse = db.get(Verse, verse_id)
    if verse is None:
        raise HTTPException(status_code=404, detail="Verse not found")
    return db.query(Tafsir).filter(Tafsir.verse_id == verse_id).order_by(Tafsir.source_name).all()


@router.get("/verses/search", response_model=list[VerseSearchResult])
def search_verses(
    q: str = Query(..., min_length=2, description="Search text (English translation)"),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    matches = (
        db.query(Verse)
        .filter(or_(Verse.text_translation_en.ilike(f"%{q}%")))
        .limit(limit)
        .all()
    )
    results = []
    for v in matches:
        idx = v.text_translation_en.lower().find(q.lower())
        start = max(0, idx - 40)
        snippet = v.text_translation_en[start: idx + len(q) + 40]
        results.append(
            VerseSearchResult(
                verse=VerseOut.model_validate(v),
                surah_name_english=v.surah.name_english,
                match_snippet=snippet,
            )
        )
    return results
