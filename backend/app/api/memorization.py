from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user_data import MemorizationProgress
from app.schemas.user_data import MemorizationProgressOut, ReviewSubmit
from app.services.spaced_repetition import ReviewState, schedule_next_review

router = APIRouter(prefix="/api/v1/memorization", tags=["memorization"])

# NOTE: auth/current-user wiring comes with the auth milestone.
# For now these endpoints take user_id explicitly so the scheduling
# logic and API shape can be built and tested before auth exists.


@router.get("/due/{user_id}", response_model=list[MemorizationProgressOut])
def get_due_reviews(user_id: int, db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc)
    return (
        db.query(MemorizationProgress)
        .filter(MemorizationProgress.user_id == user_id, MemorizationProgress.next_review_at <= now)
        .all()
    )


@router.post("/review/{user_id}", response_model=MemorizationProgressOut)
def submit_review(user_id: int, payload: ReviewSubmit, db: Session = Depends(get_db)):
    progress = (
        db.query(MemorizationProgress)
        .filter_by(user_id=user_id, verse_id=payload.verse_id)
        .one_or_none()
    )
    if progress is None:
        progress = MemorizationProgress(
            user_id=user_id, verse_id=payload.verse_id, ease_factor=2.5, interval_days=1, repetitions=0
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
