from fastapi import APIRouter, Depends, Security, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user, security_scheme
from app.models import User
from app.schemas.auth import UserProfileUpdateRequest, UserResponse

router = APIRouter(prefix="/users", tags=["Users"])


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current user profile",
    description="Returns the authenticated user's profile. Requires Bearer token.",
)
def get_my_profile(
    current_user: User = Depends(get_current_user),
    _: str = Security(security_scheme),
) -> User:
    return current_user


@router.put(
    "/me",
    response_model=UserResponse,
    summary="Update current user profile",
    description="Update personal info, profile photo URL, and language preference.",
)
def update_my_profile(
    data: UserProfileUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    _: str = Security(security_scheme),
) -> User:
    if data.full_name is not None:
        current_user.full_name = data.full_name
    if data.phone is not None:
        current_user.phone = data.phone
    if data.profile_photo_url is not None:
        current_user.profile_photo_url = data.profile_photo_url
    if data.language_preference is not None:
        current_user.language_preference = data.language_preference

    db.commit()
    db.refresh(current_user)
    return current_user
