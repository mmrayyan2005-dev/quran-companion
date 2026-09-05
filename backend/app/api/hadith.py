import re

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from app.db.session import get_db
from app.models.hadith import HadithCollection, HadithBook, Hadith
from app.schemas.hadith import HadithCollectionOut, HadithBookOut, HadithOut, HadithSearchResult

router = APIRouter(prefix="/api/v1/hadith", tags=["hadith"])


def _to_hadith_out(h: Hadith) -> HadithOut:
    return HadithOut(
        id=h.id,
        hadith_number=h.hadith_number,
        text_arabic=h.text_arabic,
        text_english=h.text_english,
        grade=h.grade,
        book_number=h.book.book_number if h.book else None,
        book_name=h.book.book_name if h.book else None,
    )


@router.get("/collections", response_model=list[HadithCollectionOut])
def list_collections(db: Session = Depends(get_db)):
    return db.query(HadithCollection).order_by(HadithCollection.name).all()


@router.get("/{collection_key}/books", response_model=list[HadithBookOut])
def list_books(collection_key: str, db: Session = Depends(get_db)):
    """
    Books (topical divisions) within a collection — e.g. "Prayer",
    "Fasting", "Jihad". Empty list means enrichment hasn't run for this
    collection yet, not an error.
    """
    collection = db.query(HadithCollection).filter(HadithCollection.key == collection_key).one_or_none()
    if collection is None:
        raise HTTPException(status_code=404, detail="Collection not found")

    return (
        db.query(HadithBook)
        .filter(HadithBook.collection_id == collection.id)
        .order_by(HadithBook.book_number)
        .all()
    )


@router.get("/{collection_key}/books/{book_number}", response_model=list[HadithOut])
def browse_book(
    collection_key: str,
    book_number: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    collection = db.query(HadithCollection).filter(HadithCollection.key == collection_key).one_or_none()
    if collection is None:
        raise HTTPException(status_code=404, detail="Collection not found")

    book = (
        db.query(HadithBook)
        .filter(HadithBook.collection_id == collection.id, HadithBook.book_number == book_number)
        .one_or_none()
    )
    if book is None:
        raise HTTPException(status_code=404, detail="Book not found")

    offset = (page - 1) * page_size
    rows = (
        db.query(Hadith)
        .options(joinedload(Hadith.book))
        .filter(Hadith.book_id == book.id)
        .order_by(Hadith.hadith_number)
        .offset(offset)
        .limit(page_size)
        .all()
    )
    return [_to_hadith_out(h) for h in rows]


@router.get("/{collection_key}", response_model=list[HadithOut])
def browse_collection(
    collection_key: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    collection = db.query(HadithCollection).filter(HadithCollection.key == collection_key).one_or_none()
    if collection is None:
        raise HTTPException(status_code=404, detail="Collection not found")

    offset = (page - 1) * page_size
    rows = (
        db.query(Hadith)
        .options(joinedload(Hadith.book))
        .filter(Hadith.collection_id == collection.id)
        .order_by(Hadith.hadith_number)
        .offset(offset)
        .limit(page_size)
        .all()
    )
    return [_to_hadith_out(h) for h in rows]


@router.get("/{collection_key}/{hadith_number}", response_model=HadithOut)
def get_hadith(collection_key: str, hadith_number: int, db: Session = Depends(get_db)):
    collection = db.query(HadithCollection).filter(HadithCollection.key == collection_key).one_or_none()
    if collection is None:
        raise HTTPException(status_code=404, detail="Collection not found")

    hadith = (
        db.query(Hadith)
        .options(joinedload(Hadith.book))
        .filter(Hadith.collection_id == collection.id, Hadith.hadith_number == hadith_number)
        .one_or_none()
    )
    if hadith is None:
        raise HTTPException(status_code=404, detail="Hadith not found")
    return _to_hadith_out(hadith)


@router.get("/search/all", response_model=list[HadithSearchResult])
def search_hadiths(
    q: str = Query(..., min_length=2, description="Search text (English translation)"),
    limit: int = Query(300, ge=1, le=1000),
    db: Session = Depends(get_db),
):
    escaped = re.escape(q.strip())
    pg_word_boundary_pattern = rf"\m{escaped}\M"
    py_word_boundary_pattern = rf"\b{escaped}\b"

    matches = (
        db.query(Hadith)
        .options(joinedload(Hadith.book))
        .filter(Hadith.text_english.op("~*")(pg_word_boundary_pattern))
        .order_by(Hadith.collection_id, Hadith.hadith_number)
        .limit(limit)
        .all()
    )
    results = []
    for h in matches:
        match = re.search(py_word_boundary_pattern, h.text_english, re.IGNORECASE)
        idx = match.start() if match else 0
        match_len = len(match.group()) if match else len(q)
        start = max(0, idx - 40)
        snippet = h.text_english[start: idx + match_len + 40]
        results.append(
            HadithSearchResult(
                hadith=_to_hadith_out(h),
                collection_name=h.collection.name,
                collection_key=h.collection.key,
                match_snippet=snippet,
            )
        )
    return results
