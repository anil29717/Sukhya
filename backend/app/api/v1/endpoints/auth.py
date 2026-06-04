from fastapi import APIRouter, Depends, Request, Security, status
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.database import get_db
from app.core.deps import get_current_user, require_roles, security_scheme
from app.models import RoleName, User
from app.schemas.auth import (
    AccessTokenResponse,
    AdminUserCreateRequest,
    LoginRequest,
    MessageResponse,
    PasswordResetConfirmRequest,
    PasswordResetRequest,
    PasswordResetTokenResponse,
    RefreshTokenRequest,
    TokenResponse,
    UserProfileUpdateRequest,
    UserRegisterRequest,
    UserResponse,
)
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register/patient",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new patient",
    description="Create a patient account. No authentication required.",
)
def register_patient(data: UserRegisterRequest, db: Session = Depends(get_db)) -> User:
    return auth_service.register_patient(db, data)


@router.post(
    "/register/doctor",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new doctor",
    description="Create a doctor account. Requires admin approval before login.",
)
def register_doctor(data: UserRegisterRequest, db: Session = Depends(get_db)) -> User:
    return auth_service.register_doctor(db, data)


@router.post(
    "/admin/users",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a user (Admin only)",
    description="Admin can create users with any role: admin, doctor, or patient.",
)
def create_user_admin(
    data: AdminUserCreateRequest,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(RoleName.ADMIN)),
    __: str = Security(security_scheme),
) -> User:
    return auth_service.create_admin_user(db, data)


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Login",
    description="Authenticate with email and password. Returns access and refresh tokens.",
)
def login(data: LoginRequest, request: Request, db: Session = Depends(get_db)) -> TokenResponse:
    client_ip = request.client.host if request.client else None
    return auth_service.login_user(db, data, ip_address=client_ip)


@router.post(
    "/logout",
    response_model=MessageResponse,
    summary="Logout",
    description="Revoke the refresh token. Requires a valid refresh token in the body.",
)
def logout(data: RefreshTokenRequest, db: Session = Depends(get_db)) -> MessageResponse:
    auth_service.logout_user(db, data.refresh_token)
    return MessageResponse(message="Logged out successfully")


@router.post(
    "/refresh",
    response_model=TokenResponse,
    summary="Refresh access token",
    description="Exchange a valid refresh token for a new access + refresh token pair.",
)
def refresh_token(data: RefreshTokenRequest, db: Session = Depends(get_db)) -> TokenResponse:
    return auth_service.refresh_access_token(db, data.refresh_token)


@router.post(
    "/password-reset/request",
    response_model=PasswordResetTokenResponse | MessageResponse,
    summary="Request password reset",
    description=(
        "Request a password reset link. In development mode, the reset token is returned "
        "in the response for Swagger testing. In production, it would be sent via email."
    ),
)
def password_reset_request(data: PasswordResetRequest, db: Session = Depends(get_db)):
    settings = get_settings()
    token = auth_service.request_password_reset(db, data.email)

    if settings.DEBUG and token:
        return PasswordResetTokenResponse(
            reset_token=token,
            message="Password reset token generated (development mode only)",
        )

    return MessageResponse(
        message="If the email exists, a password reset link has been sent",
    )


@router.post(
    "/password-reset/confirm",
    response_model=MessageResponse,
    summary="Confirm password reset",
    description="Set a new password using the reset token from the password reset request.",
)
def password_reset_confirm(
    data: PasswordResetConfirmRequest,
    db: Session = Depends(get_db),
) -> MessageResponse:
    auth_service.confirm_password_reset(db, data.token, data.new_password)
    return MessageResponse(message="Password updated successfully")
