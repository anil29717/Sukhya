from datetime import UTC, datetime, timedelta

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import (
    create_access_token,
    create_password_reset_token_value,
    create_refresh_token_value,
    hash_password,
    hash_token,
    verify_password,
)
from app.models import AuditLog, PasswordResetToken, RefreshToken, Role, RoleName, User
from app.schemas.auth import (
    AdminUserCreateRequest,
    LoginRequest,
    TokenResponse,
    UserRegisterRequest,
)

settings = get_settings()


def _get_role(db: Session, role_name: RoleName) -> Role:
    role = db.query(Role).filter(Role.name == role_name.value).first()
    if role is None:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Role not configured")
    return role


def _create_user(
    db: Session,
    data: UserRegisterRequest,
    role_name: RoleName,
    *,
    is_approved: bool = True,
) -> User:
    existing = db.query(User).filter(User.email == data.email.lower()).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    role = _get_role(db, role_name)
    user = User(
        email=data.email.lower(),
        hashed_password=hash_password(data.password),
        full_name=data.full_name,
        phone=data.phone,
        language_preference=data.language_preference,
        role_id=role.id,
        is_approved=is_approved,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def register_patient(db: Session, data: UserRegisterRequest) -> User:
    user = _create_user(db, data, RoleName.PATIENT)
    from app.services import patient_service

    patient_service.create_patient_profile(db, user)
    db.refresh(user)
    return user


def register_doctor(db: Session, data: UserRegisterRequest) -> User:
    user = _create_user(db, data, RoleName.DOCTOR, is_approved=False)
    from app.services import doctor_service

    doctor_service.create_doctor_profile(db, user)
    db.refresh(user)
    return user


def create_admin_user(db: Session, data: AdminUserCreateRequest) -> User:
    try:
        role_name = RoleName(data.role.lower())
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid role. Must be admin, doctor, or patient",
        ) from exc

    is_approved = role_name != RoleName.DOCTOR
    register_data = UserRegisterRequest(
        email=data.email,
        password=data.password,
        full_name=data.full_name,
        phone=data.phone,
        language_preference=data.language_preference,
    )
    user = _create_user(db, register_data, role_name, is_approved=is_approved)

    if role_name == RoleName.PATIENT:
        from app.services import patient_service

        patient_service.create_patient_profile(db, user)
    elif role_name == RoleName.DOCTOR:
        from app.services import doctor_service

        doctor_service.create_doctor_profile(db, user)

    db.refresh(user)
    return user


def _issue_tokens(db: Session, user: User) -> TokenResponse:
    access_token = create_access_token(str(user.id), user.role.name)
    refresh_token_value = create_refresh_token_value()
    refresh_token = RefreshToken(
        user_id=user.id,
        token_hash=hash_token(refresh_token_value),
        expires_at=datetime.now(UTC) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    )
    db.add(refresh_token)
    db.commit()
    return TokenResponse(access_token=access_token, refresh_token=refresh_token_value)


def login_user(db: Session, data: LoginRequest, ip_address: str | None = None) -> TokenResponse:
    user = db.query(User).filter(User.email == data.email.lower()).first()
    if user is None or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is inactive")

    if user.role.name == RoleName.DOCTOR.value and not user.is_approved:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Doctor account pending admin approval",
        )

    db.add(
        AuditLog(
            user_id=user.id,
            action="login",
            resource="auth",
            details="User logged in",
            ip_address=ip_address,
        )
    )
    db.commit()

    return _issue_tokens(db, user)


def logout_user(db: Session, refresh_token: str) -> None:
    token_hash = hash_token(refresh_token)
    stored = db.query(RefreshToken).filter(RefreshToken.token_hash == token_hash).first()
    if stored and not stored.revoked:
        stored.revoked = True
        db.commit()


def refresh_access_token(db: Session, refresh_token: str) -> TokenResponse:
    token_hash = hash_token(refresh_token)
    stored = (
        db.query(RefreshToken)
        .filter(RefreshToken.token_hash == token_hash, RefreshToken.revoked.is_(False))
        .first()
    )

    if stored is None or stored.expires_at < datetime.now(UTC):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired refresh token")

    user = db.query(User).filter(User.id == stored.user_id, User.is_active.is_(True)).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    stored.revoked = True
    db.commit()

    return _issue_tokens(db, user)


def request_password_reset(db: Session, email: str) -> str | None:
    user = db.query(User).filter(User.email == email.lower()).first()
    if user is None:
        return None

    token_value = create_password_reset_token_value()
    reset_token = PasswordResetToken(
        user_id=user.id,
        token_hash=hash_token(token_value),
        expires_at=datetime.now(UTC)
        + timedelta(minutes=settings.PASSWORD_RESET_TOKEN_EXPIRE_MINUTES),
    )
    db.add(reset_token)
    db.commit()
    return token_value


def confirm_password_reset(db: Session, token: str, new_password: str) -> None:
    token_hash = hash_token(token)
    stored = (
        db.query(PasswordResetToken)
        .filter(PasswordResetToken.token_hash == token_hash, PasswordResetToken.used.is_(False))
        .first()
    )

    if stored is None or stored.expires_at < datetime.now(UTC):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired reset token")

    user = db.query(User).filter(User.id == stored.user_id).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user.hashed_password = hash_password(new_password)
    stored.used = True

    db.query(RefreshToken).filter(
        RefreshToken.user_id == user.id,
        RefreshToken.revoked.is_(False),
    ).update({"revoked": True})

    db.commit()
