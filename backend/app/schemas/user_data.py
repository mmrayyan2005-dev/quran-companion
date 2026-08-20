from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.enums import ReviewOutcome


class BookmarkCreate(BaseModel):
    verse_id: int
    note: str | None = None


class BookmarkVerseInfo(BaseModel):
    """Minimal verse info embedded in a bookmark response — enough to
    display and link to the verse without a second API call per bookmark."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    surah_id: int
    ayah_number: int
    text_arabic: str
    text_translation_en: str
    surah_name_english: str


class BookmarkOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    verse_id: int
    note: str | None
    created_at: datetime
    verse: BookmarkVerseInfo


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
    verse: BookmarkVerseInfo
