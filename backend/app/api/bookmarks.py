from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user_data import User, Bookmark
from app.models.verse import Verse
from app.schemas.user_data import BookmarkCreate, BookmarkOut, BookmarkVerseInfo

router = APIRouter(prefix="/api/v1/bookmarks", tags=["bookmarks"])


def _to_bookmark_out(bookmark: Bookmark) -> BookmarkOut:
    v = bookmark.verse
    return BookmarkOut(
        id=bookmark.id,
        verse_id=bookmark.verse_id,
        note=bookmark.note,
        created_at=bookmark.created_at,
        verse=BookmarkVerseInfo(
            id=v.id,
            surah_id=v.surah_id,
            ayah_number=v.ayah_number,
            text_arabic=v.text_arabic,
            text_translation_en=v.text_translation_en,
            surah_name_english=v.surah.name_english,
        ),
    )


@router.get("", response_model=list[BookmarkOut])
def list_bookmarks(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    bookmarks = (
        db.query(Bookmark)
        .options(joinedload(Bookmark.verse).joinedload(Verse.surah))
        .filter(Bookmark.user_id == current_user.id)
        .order_by(Bookmark.created_at.desc())
        .all()
    )
    return [_to_bookmark_out(b) for b in bookmarks]


@router.post("", response_model=BookmarkOut, status_code=status.HTTP_201_CREATED)
def create_bookmark(
    payload: BookmarkCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    verse = db.get(Verse, payload.verse_id)
    if verse is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Verse not found")

    bookmark = Bookmark(user_id=current_user.id, verse_id=payload.verse_id, note=payload.note)
    db.add(bookmark)
    db.commit()
    db.refresh(bookmark)
    return _to_bookmark_out(bookmark)


@router.delete("/{bookmark_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_bookmark(
    bookmark_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    bookmark = (
        db.query(Bookmark)
        .filter(Bookmark.id == bookmark_id, Bookmark.user_id == current_user.id)
        .one_or_none()
    )
    if bookmark is None:
        # Deliberately the same 404 whether the bookmark doesn't exist or
        # belongs to someone else — don't leak which case it is.
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bookmark not found")
    db.delete(bookmark)
    db.commit()
