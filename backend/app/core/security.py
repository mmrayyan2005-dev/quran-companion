"""
Password hashing and JWT token creation/verification.

Kept dependency-light on purpose: `bcrypt` for hashing (has solid
precompiled-wheel support across platforms/Python versions — a real
concern for us given the wheel issues we hit with other packages on
Python 3.14) and `pyjwt` for tokens (pure Python, no C extension at all).

These functions are pure (no DB, no FastAPI) so they're unit-testable
in isolation, same principle as the spaced repetition service.
"""
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt

from app.db.config import settings


def hash_password(plain_password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(plain_password.encode("utf-8"), salt)
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))


def create_access_token(subject: str, expires_delta: timedelta | None = None) -> str:
    """subject is typically the user's id (as a string) or email."""
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.access_token_expire_minutes)
    )
    to_encode = {"sub": subject, "exp": expire}
    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> str | None:
    """Returns the subject (user id) if the token is valid, else None."""
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.jwt_algorithm])
        return payload.get("sub")
    except jwt.PyJWTError:
        return None
