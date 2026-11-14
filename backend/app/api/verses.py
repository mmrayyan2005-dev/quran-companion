import re

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.verse import Surah, Verse, Tafsir
from app.schemas.verse import SurahOut, VerseOut, VerseSearchResult, TafsirOut, JuzVerseOut

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


@router.get("/juz/{juz_number}/verses", response_model=list[JuzVerseOut])
def get_juz_verses(juz_number: int, db: Session = Depends(get_db)):
    if not (1 <= juz_number <= 30):
        raise HTTPException(status_code=400, detail="juz_number must be between 1 and 30")

    verses = (
        db.query(Verse)
        .filter(Verse.juz_number == juz_number)
        .order_by(Verse.surah_id, Verse.ayah_number)
        .all()
    )
    if not verses:
        raise HTTPException(status_code=404, detail="Juz not found")

    return [
        JuzVerseOut(
            verse=VerseOut.model_validate(v),
            surah_name_english=v.surah.name_english,
            surah_name_transliteration=v.surah.name_transliteration,
        )
        for v in verses
    ]


@router.get("/verses/{verse_id}/tafsir", response_model=list[TafsirOut])
def get_verse_tafsir(verse_id: int, db: Session = Depends(get_db)):
    verse = db.get(Verse, verse_id)
    if verse is None:
        raise HTTPException(status_code=404, detail="Verse not found")
    return db.query(Tafsir).filter(Tafsir.verse_id == verse_id).order_by(Tafsir.source_name).all()


@router.get("/verses/search", response_model=list[VerseSearchResult])
def search_verses(
    q: str = Query(..., min_length=2, description="Search text (English translation)"),
    limit: int = Query(300, ge=1, le=1000),
    db: Session = Depends(get_db),
):
    escaped = re.escape(q.strip())
    pg_word_boundary_pattern = rf"\m{escaped}\M"
    py_word_boundary_pattern = rf"\b{escaped}\b"

    matches = (
        db.query(Verse)
        .filter(Verse.text_translation_en.op("~*")(pg_word_boundary_pattern))
        .order_by(Verse.surah_id, Verse.ayah_number)
        .limit(limit)
        .all()
    )
    results = []
    for v in matches:
        match = re.search(py_word_boundary_pattern, v.text_translation_en, re.IGNORECASE)
        idx = match.start() if match else 0
        match_len = len(match.group()) if match else len(q)
        start = max(0, idx - 40)
        snippet = v.text_translation_en[start: idx + match_len + 40]
        results.append(
            VerseSearchResult(
                verse=VerseOut.model_validate(v),
                surah_name_english=v.surah.name_english,
                match_snippet=snippet,
            )
        )
    return results


# ---------------------------------------------------------------------------
# "Ask" search: type a question or topic, get the most relevant verses.
# No AI service involved, so nothing can expire. It strips filler words,
# adds a few related words, and ranks verses by how many topic words they hit.
# ---------------------------------------------------------------------------
_STOPWORDS = {
    "a", "about", "after", "all", "also", "am", "an", "and", "any", "are", "as", "at", "be", "because",
    "been", "before", "being", "but", "by", "can", "could", "did", "do", "does", "doing", "for", "from",
    "had", "has", "have", "how", "i", "if", "in", "into", "is", "it", "its", "me", "more", "most", "my",
    "no", "not", "of", "on", "or", "our", "out", "say", "says", "should", "so", "some", "than", "that",
    "the", "their", "them", "then", "there", "these", "they", "this", "those", "to", "us", "was", "we",
    "were", "what", "when", "where", "which", "who", "whom", "why", "will", "with", "would", "you",
    "your", "quran", "allah", "verse", "verses", "ayah", "ayat", "islam", "tell",
}

_SYNONYMS = {
    "patience": ["patient", "steadfast", "persevere", "endure"],
    "patient": ["patience", "steadfast", "persevere", "endure"],
    "mercy": ["merciful", "compassion"],
    "forgive": ["forgiveness", "pardon", "forgiving"],
    "forgiveness": ["forgive", "pardon", "forgiving"],
    "pray": ["prayer", "worship"],
    "prayer": ["pray", "worship", "establish"],
    "hardship": ["difficulty", "trial", "adversity", "distress"],
    "difficulty": ["hardship", "ease", "trial"],
    "parents": ["mother", "father", "parent"],
    "charity": ["spend", "alms", "poor", "zakah"],
    "fear": ["afraid", "fearful", "dread"],
    "hope": ["hopeful", "despair"],
    "death": ["die", "dies"],
    "heaven": ["paradise", "gardens"],
    "hell": ["fire", "punishment"],
    "justice": ["just", "fairness", "equity"],
    "peace": ["peaceful", "security", "tranquility"],
    "anger": ["wrath", "angry", "restrain"],
    "marriage": ["spouse", "wives", "husband", "wife"],
    "knowledge": ["learn", "wisdom", "understand"],
}


def _stem(word: str) -> str:
    # Cut long words short so "patience" also finds "patient" and "patiently".
    if len(word) <= 5:
        return word
    return word[: max(5, len(word) - 3)]


def _extract_keywords(question: str) -> list[tuple[str, int]]:
    """Returns [(stem, weight)]: words the user typed weigh 3, related words weigh 1."""
    words = re.findall(r"[a-z]+", question.lower())
    base = [w for w in words if w not in _STOPWORDS and len(w) >= 3]
    weights: dict[str, int] = {}
    for w in base:
        weights[_stem(w)] = 3
    for w in base:
        for related in _SYNONYMS.get(w, []):
            weights.setdefault(_stem(related), 1)
    return list(weights.items())


@router.get("/verses/ask", response_model=list[VerseSearchResult])
def ask_verses(
    q: str = Query(..., min_length=3, max_length=200, description="A question or topic"),
    limit: int = Query(15, ge=1, le=50),
    db: Session = Depends(get_db),
):
    keywords = _extract_keywords(q)
    if not keywords:
        return []

    alternation = "|".join(re.escape(stem) for stem, _ in keywords)
    candidates = (
        db.query(Verse)
        .filter(Verse.text_translation_en.op("~*")(rf"\m({alternation})"))
        .order_by(Verse.surah_id, Verse.ayah_number)
        .limit(3000)
        .all()
    )

    scored = []
    for v in candidates:
        text = v.text_translation_en
        score = 0
        best = None  # (position, length) of the earliest matching word
        for stem, weight in keywords:
            m = re.search(rf"\b{re.escape(stem)}\w*", text, re.IGNORECASE)
            if m:
                score += weight
                if best is None or m.start() < best[0]:
                    best = (m.start(), len(m.group()))
        if score:
            scored.append((score, v, best))

    scored.sort(key=lambda item: (-item[0], item[1].surah_id, item[1].ayah_number))

    results = []
    for score, v, best in scored[:limit]:
        idx, length = best
        start = max(0, idx - 40)
        snippet = v.text_translation_en[start: idx + length + 40]
        results.append(
            VerseSearchResult(
                verse=VerseOut.model_validate(v),
                surah_name_english=v.surah.name_english,
                match_snippet=snippet,
            )
        )
    return results