"""
auth.py — JWT authentication with MongoDB-backed user store.
Falls back to database.py in-memory store automatically.
"""

import os
import base64
import hashlib
import hmac
import secrets
from datetime import datetime, timedelta
from typing import Optional

from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

SECRET_KEY = os.getenv("SECRET_KEY", "ai-property-platform-secret-key-2024-thesis")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login", auto_error=False)

PBKDF2_ITERATIONS = 210_000


def hash_password(password: str) -> str:
    # Use PBKDF2 to avoid runtime breakages from bcrypt backend mismatches.
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, PBKDF2_ITERATIONS)
    return "pbkdf2_sha256${}${}${}".format(
        PBKDF2_ITERATIONS,
        base64.urlsafe_b64encode(salt).decode("ascii"),
        base64.urlsafe_b64encode(digest).decode("ascii"),
    )


def verify_password(plain: str, hashed: str) -> bool:
    if not hashed:
        return False

    if hashed.startswith("pbkdf2_sha256$"):
        try:
            _, iterations, salt_b64, digest_b64 = hashed.split("$", 3)
            salt = base64.urlsafe_b64decode(salt_b64.encode("ascii"))
            expected = base64.urlsafe_b64decode(digest_b64.encode("ascii"))
            candidate = hashlib.pbkdf2_hmac("sha256", plain.encode("utf-8"), salt, int(iterations))
            return hmac.compare_digest(candidate, expected)
        except Exception:
            return False

    # Legacy support for previously stored bcrypt hashes.
    try:
        return pwd_context.verify(plain, hashed)
    except Exception:
        return False


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None


def get_current_user(token: str = Depends(oauth2_scheme)) -> Optional[str]:
    if not token:
        return None
    payload = decode_token(token)
    if not payload:
        return None
    return payload.get("sub")


def get_current_role(token: str = Depends(oauth2_scheme)) -> Optional[str]:
    if not token:
        return None
    payload = decode_token(token)
    if not payload:
        return None
    return payload.get("role", "tenant")


def require_auth(token: str = Depends(oauth2_scheme)) -> str:
    username = get_current_user(token)
    if not username:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return username


def require_landlord(token: str = Depends(oauth2_scheme)) -> str:
    """Raises 403 if caller is not authenticated as a landlord."""
    if not token:
        raise HTTPException(status_code=403, detail="Authentication required")
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=403, detail="Invalid token")
    role = payload.get("role", "tenant")
    if role != "landlord":
        raise HTTPException(
            status_code=403,
            detail="Landlord account required to perform this action"
        )
    return payload.get("sub")
