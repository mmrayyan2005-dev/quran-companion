from datetime import timedelta

from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token,
)


def test_hash_password_produces_different_output_than_input():
    hashed = hash_password("mySecretPass123")
    assert hashed != "mySecretPass123"


def test_verify_password_succeeds_for_correct_password():
    hashed = hash_password("mySecretPass123")
    assert verify_password("mySecretPass123", hashed) is True


def test_verify_password_fails_for_wrong_password():
    hashed = hash_password("mySecretPass123")
    assert verify_password("wrongPassword", hashed) is False


def test_same_password_hashes_differently_each_time():
    # bcrypt uses a random salt per call — this guards against a regression
    # where hashing became deterministic (a real security weakness).
    hashed1 = hash_password("samePassword")
    hashed2 = hash_password("samePassword")
    assert hashed1 != hashed2
    assert verify_password("samePassword", hashed1) is True
    assert verify_password("samePassword", hashed2) is True


def test_create_and_decode_access_token_roundtrip():
    token = create_access_token(subject="42")
    subject = decode_access_token(token)
    assert subject == "42"


def test_decode_rejects_garbage_token():
    assert decode_access_token("not.a.real.token") is None


def test_decode_rejects_expired_token():
    token = create_access_token(subject="42", expires_delta=timedelta(seconds=-1))
    assert decode_access_token(token) is None
