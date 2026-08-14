from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.user_data import ReviewOutcome


class BookmarkCreate(BaseModel):
    verse_id: int
    note: str | None = None


class BookmarkOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    verse_id: int
    note: str | None
    created_at: datetime


class ReviewSubmit(BaseModel):
    verse_id: int
    outcome: ReviewOutcome


class MemorizationProgressOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    verse_id: int
    ease_factor: float
    interval_days: int
    repetitions: int
    last_reviewed_at: datetime | None
    next_review_at: datetime
