"""
Plain enums with zero dependencies on SQLAlchemy or the DB session.

Why this file exists: ReviewOutcome used to live in user_data.py, which
meant importing it (e.g. in a pure unit test for the scheduling algorithm)
dragged in the entire ORM model graph, the DB engine, and a live driver
import. That's the kind of accidental coupling that makes small pieces of
logic hard to test in isolation — worth avoiding on purpose here.
"""
import enum


class ReviewOutcome(str, enum.Enum):
    AGAIN = "again"
    HARD = "hard"
    GOOD = "good"
    EASY = "easy"
