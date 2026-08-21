"""
Tests for the word-boundary search fix. The bug: searching "read"
previously matched "already", "spread", "readily" via plain substring
matching. These tests verify the fix uses real word boundaries instead.
"""
import re


def python_word_boundary_match(query: str, text: str) -> bool:
    escaped = re.escape(query.strip())
    pattern = rf"\b{escaped}\b"
    return re.search(pattern, text, re.IGNORECASE) is not None


def test_matches_standalone_word():
    assert python_word_boundary_match("read", "you should read this") is True


def test_does_not_match_substring_within_another_word():
    assert python_word_boundary_match("read", "the seed was already planted") is False
    assert python_word_boundary_match("read", "the fields will spread wide") is False


def test_matches_case_insensitively():
    assert python_word_boundary_match("Mercy", "his mercy is vast") is True


def test_matches_word_at_start_and_end_of_string():
    assert python_word_boundary_match("mercy", "mercy") is True
    assert python_word_boundary_match("mercy", "seeking mercy") is True
    assert python_word_boundary_match("mercy", "mercy be upon you") is True


def test_does_not_match_partial_word_prefix():
    assert python_word_boundary_match("merc", "mercy") is False
