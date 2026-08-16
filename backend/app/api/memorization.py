from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user_data import User, MemorizationProgress
from app.models.verse import Verse
from app.schemas.user_data import MemorizationProgressOut, ReviewSubmit
from app.services.spaced_repetition import ReviewState, schedule_next_review

router = APIRouter(prefix="/api/v1/memorization", tags=["memorization"])


@router.post("/add/{verse_id}", response_model=MemorizationProgressOut, status_code=status.HTTP_201_CREATED)
def add_to_memorization(
    verse_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Adds a verse to the user's memorization queue, due for review
    immediately. Distinct from submit_review below — that endpoint scores
    an existing review, this one creates the starting entry so a verse
    can show up in /due for the first time.
    """
    verse = db.get(Verse, verse_id)
    if verse is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Verse not found")

    existing = (
        db.query(MemorizationProgress)
        .filter_by(user_id=current_user.id, verse_id=verse_id)
        .one_or_none()
    )
    if existing is not None:
        return existing  # already in the queue — not an error, just a no-op

    progress = MemorizationProgress(
        user_id=current_user.id,
        verse_id=verse_id,
        ease_factor=2.5,
        interval_days=1,
        repetitions=0,
        next_review_at=datetime.now(timezone.utc),  # due right away
    )
    db.add(progress)
    db.commit()
    db.refresh(progress)
    return progress


@router.get("/due", response_model=list[MemorizationProgressOut])
def get_due_reviews(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    now = datetime.now(timezone.utc)
    return (
        db.query(MemorizationProgress)
        .filter(MemorizationProgress.user_id == current_user.id, MemorizationProgress.next_review_at <= now)
        .all()
    )


@router.post("/review", response_model=MemorizationProgressOut)
def submit_review(
    payload: ReviewSubmit,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    progress = (
        db.query(MemorizationProgress)
        .filter_by(user_id=current_user.id, verse_id=payload.verse_id)
        .one_or_none()
    )
    if progress is None:
        progress = MemorizationProgress(
            user_id=current_user.id, verse_id=payload.verse_id, ease_factor=2.5, interval_days=1, repetitions=0
        )
        db.add(progress)
        db.flush()

    current_state = ReviewState(
        ease_factor=progress.ease_factor,
        interval_days=progress.interval_days,
        repetitions=progress.repetitions,
    )
    new_state, next_review = schedule_next_review(current_state, payload.outcome)

    progress.ease_factor = new_state.ease_factor
    progress.interval_days = new_state.interval_days
    progress.repetitions = new_state.repetitions
    progress.last_reviewed_at = datetime.now(timezone.utc)
    progress.next_review_at = next_review

    db.commit()
    db.refresh(progress)
    return progress
