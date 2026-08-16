"""
User-generated data — separate from the read-only Quran content in verse.py.
Keeping these apart means the content tables (verse.py) stay a pure,
re-ingestible source of truth, while this file owns anything that mutates
during normal app use.
"""
from datetime import datetime, timezone

from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Enum, Float
from sqlalchemy.orm import relationship

from app.db.session import Base
from app.models.enums import ReviewOutcome


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    bookmarks = relationship("Bookmark", back_populates="user")
    memorization_progress = relationship("MemorizationProgress", back_populates="user")


class Bookmark(Base):
    __tablename__ = "bookmarks"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    verse_id = Column(Integer, ForeignKey("verses.id"), nullable=False)
    note = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="bookmarks")
    verse = relationship("Verse")


class MemorizationProgress(Base):
    """
    One row per (user, verse) being memorized. Tracks spaced-repetition
    state using an SM-2-style algorithm (see services/spaced_repetition.py).
    """
    __tablename__ = "memorization_progress"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    verse_id = Column(Integer, ForeignKey("verses.id"), nullable=False)

    ease_factor = Column(Float, default=2.5, nullable=False)
    interval_days = Column(Integer, default=1, nullable=False)
    repetitions = Column(Integer, default=0, nullable=False)
    last_reviewed_at = Column(DateTime, nullable=True)
    next_review_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="memorization_progress")
