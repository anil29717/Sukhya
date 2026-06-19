import hashlib
import secrets
from datetime import UTC, datetime, timedelta

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import get_settings

settings = get_settings()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(subject: str, role: str) -> str:
    expire = datetime.now(UTC) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": subject, "role": role, "type": "access", "exp": expire}
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_refresh_token_value() -> str:
    return secrets.token_urlsafe(48)


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def decode_access_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError as exc:
        raise ValueError("Invalid or expired token") from exc

    if payload.get("type") != "access":
        raise ValueError("Invalid token type")

    return payload


def create_password_reset_token_value() -> str:
    return secrets.token_urlsafe(32)
