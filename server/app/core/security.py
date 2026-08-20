"""
Token generation, verification, and symmetric encryption for Vidyra.

Provides:
  - JWT access / refresh token lifecycle
  - Fernet-based OAuth token encryption at rest
  - Bcrypt password hashing (for future local-auth support)
"""

from datetime import datetime, timedelta, timezone
from typing import Optional

import bcrypt
from jose import JWTError, jwt
from cryptography.fernet import Fernet

from app.core.config import settings

_fernet = Fernet(settings.FERNET_KEY.encode())


# ── Password hashing ──────────────────────────────────────────────

def hash_password(password: str) -> str:
    """
    Return a bcrypt hash of ``password``.
    Input is truncated to 72 bytes to stay within bcrypt's hard limit.
    """
    pw_bytes = password.encode("utf-8")[:72]
    return bcrypt.hashpw(pw_bytes, bcrypt.gensalt(rounds=12)).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    """Compare ``plain`` against a bcrypt ``hashed`` digest."""
    try:
        pw_bytes = plain.encode("utf-8")[:72]
        return bcrypt.checkpw(pw_bytes, hashed.encode("utf-8"))
    except Exception:
        return False


# ── JWT tokens ───────────────────────────────────────────────────

def _encode_jwt(payload: dict) -> str:
    return jwt.encode(payload, settings.JWT_SECRET, algorithm="HS256")


def mint_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Generate a short-lived JWT access token."""
    payload = data.copy()
    expiry = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    payload.update({"exp": expiry, "type": "access"})
    return _encode_jwt(payload)


def mint_refresh_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Generate a long-lived JWT refresh token."""
    payload = data.copy()
    expiry = datetime.now(timezone.utc) + (
        expires_delta or timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    )
    payload.update({"exp": expiry, "type": "refresh"})
    return _encode_jwt(payload)


def verify_token(token: str, token_type: str = "access") -> Optional[str]:
    """
    Decode and validate a JWT token.

    Returns the ``sub`` (user ID) on success, or ``None`` on failure.
    """
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
        if payload.get("type") != token_type:
            return None
        user_id: Optional[str] = payload.get("sub")
        return user_id
    except JWTError:
        return None


def create_token_pair(user_id: str) -> dict:
    """
    Issue an access + refresh token pair for ``user_id``.

    Returns:
        ``{"access_token": str, "refresh_token": str, "token_type": "bearer"}``
    """
    return {
        "access_token": mint_access_token({"sub": user_id}),
        "refresh_token": mint_refresh_token({"sub": user_id}),
        "token_type": "bearer",
    }


# Back-compat aliases used by existing route modules
create_access_token = mint_access_token
create_refresh_token = mint_refresh_token


# ── Fernet encryption ─────────────────────────────────────────────

def encrypt_token(token: str) -> str:
    """Encrypt an OAuth token for secure storage."""
    return _fernet.encrypt(token.encode()).decode()


def decrypt_token(encrypted_token: str) -> str:
    """Decrypt a stored OAuth token."""
    return _fernet.decrypt(encrypted_token.encode()).decode()
