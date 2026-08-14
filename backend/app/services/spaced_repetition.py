"""
SM-2-style spaced repetition scheduler.

Kept as a pure function (no DB, no side effects) so it can be unit tested
directly — the cricket project's ML clustering bug (gender mixing) went
undetected for a while precisely because the logic was entangled with
data loading and rendering. Here, logic and I/O are separate on purpose.
"""
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

from app.models.enums import ReviewOutcome

MIN_EASE_FACTOR = 1.3


@dataclass
class ReviewState:
    ease_factor: float
    interval_days: int
    repetitions: int


def schedule_next_review(state: ReviewState, outcome: ReviewOutcome) -> tuple[ReviewState, datetime]:
    """
    Given the current review state and how the user's recall went,
    return the updated state and the next review datetime (UTC).
    """
    if outcome == ReviewOutcome.AGAIN:
        new_state = ReviewState(
            ease_factor=max(MIN_EASE_FACTOR, state.ease_factor - 0.2),
            interval_days=1,
            repetitions=0,
        )
    else:
        ease_delta = {
            ReviewOutcome.HARD: -0.15,
            ReviewOutcome.GOOD: 0.0,
            ReviewOutcome.EASY: 0.15,
        }[outcome]
        new_ease = max(MIN_EASE_FACTOR, state.ease_factor + ease_delta)
        new_reps = state.repetitions + 1

        if new_reps == 1:
            new_interval = 1
        elif new_reps == 2:
            new_interval = 6
        else:
            new_interval = round(state.interval_days * new_ease)

        new_state = ReviewState(
            ease_factor=new_ease,
            interval_days=max(1, new_interval),
            repetitions=new_reps,
        )

    next_review = datetime.now(timezone.utc) + timedelta(days=new_state.interval_days)
    return new_state, next_review
