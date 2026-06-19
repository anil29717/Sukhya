from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class MessageResponse(BaseModel):
    message: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class AccessTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserRegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(min_length=2, max_length=255)
    phone: str | None = Field(default=None, max_length=20)
    language_preference: str = Field(default="en", max_length=10)


class AdminUserCreateRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(min_length=2, max_length=255)
    phone: str | None = Field(default=None, max_length=20)
    role: str = Field(description="One of: admin, doctor, patient")
    language_preference: str = Field(default="en", max_length=10)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetConfirmRequest(BaseModel):
    token: str
    new_password: str = Field(min_length=8, max_length=128)


class UserProfileUpdateRequest(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=255)
    phone: str | None = Field(default=None, max_length=20)
    profile_photo_url: str | None = Field(default=None, max_length=500)
    language_preference: str | None = Field(default=None, max_length=10)


class RoleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    full_name: str
    phone: str | None
    profile_photo_url: str | None
    language_preference: str
    is_active: bool
    is_approved: bool
    role: RoleResponse
    created_at: datetime
    updated_at: datetime


class PasswordResetTokenResponse(BaseModel):
    """Returned in development when requesting password reset (for Swagger testing)."""

    reset_token: str
    message: str
