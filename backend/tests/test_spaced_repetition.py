import pytest

from app.models.enums import ReviewOutcome
from app.services.spaced_repetition import ReviewState, schedule_next_review, MIN_EASE_FACTOR


def test_first_good_review_sets_interval_to_one_day():
    state = ReviewState(ease_factor=2.5, interval_days=1, repetitions=0)
    new_state, _ = schedule_next_review(state, ReviewOutcome.GOOD)
    assert new_state.repetitions == 1
    assert new_state.interval_days == 1


def test_second_good_review_sets_interval_to_six_days():
    state = ReviewState(ease_factor=2.5, interval_days=1, repetitions=1)
    new_state, _ = schedule_next_review(state, ReviewOutcome.GOOD)
    assert new_state.repetitions == 2
    assert new_state.interval_days == 6


def test_third_good_review_multiplies_by_ease_factor():
    state = ReviewState(ease_factor=2.5, interval_days=6, repetitions=2)
    new_state, _ = schedule_next_review(state, ReviewOutcome.GOOD)
    assert new_state.repetitions == 3
    assert new_state.interval_days == round(6 * 2.5)


def test_again_resets_repetitions_and_interval():
    state = ReviewState(ease_factor=2.8, interval_days=30, repetitions=5)
    new_state, _ = schedule_next_review(state, ReviewOutcome.AGAIN)
    assert new_state.repetitions == 0
    assert new_state.interval_days == 1
    assert new_state.ease_factor == pytest.approx(2.6)  # dropped by 0.2


def test_ease_factor_never_drops_below_minimum():
    state = ReviewState(ease_factor=1.35, interval_days=10, repetitions=3)
    new_state, _ = schedule_next_review(state, ReviewOutcome.AGAIN)
    assert new_state.ease_factor >= MIN_EASE_FACTOR


def test_easy_review_increases_ease_factor():
    state = ReviewState(ease_factor=2.5, interval_days=6, repetitions=2)
    new_state, _ = schedule_next_review(state, ReviewOutcome.EASY)
    assert new_state.ease_factor == pytest.approx(2.65)


def test_next_review_datetime_is_in_the_future():
    from datetime import datetime, timezone

    state = ReviewState(ease_factor=2.5, interval_days=1, repetitions=0)
    _, next_review = schedule_next_review(state, ReviewOutcome.GOOD)
    assert next_review > datetime.now(timezone.utc)
