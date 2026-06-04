from fastapi import APIRouter, Depends, Query, Security, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_roles, security_scheme
from app.models import RoleName, User
from app.schemas.auth import MessageResponse
from app.schemas.family import (
    EmergencyCardResponse,
    EmergencyProfileResponse,
    EmergencyProfileUpdateRequest,
    FamilyDashboardResponse,
    FamilyMemberCreateRequest,
    FamilyMemberResponse,
    FamilyMemberUpdateRequest,
)
from app.services import family_service

router = APIRouter(prefix="/family", tags=["Family Health (Premium)"])


@router.get(
    "/members",
    response_model=list[FamilyMemberResponse],
    summary="List family members",
)
def list_members(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleName.PATIENT)),
    _: str = Security(security_scheme),
) -> list[FamilyMemberResponse]:
    guardian = family_service.get_guardian_patient(db, current_user)
    members = family_service.list_family_members(db, guardian)
    return [FamilyMemberResponse(**family_service.family_member_to_dict(m)) for m in members]


@router.post(
    "/members",
    response_model=FamilyMemberResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add a family member",
    description="Creates a dependent health profile managed by the logged-in patient.",
)
def add_member(
    data: FamilyMemberCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleName.PATIENT)),
    _: str = Security(security_scheme),
) -> FamilyMemberResponse:
    guardian = family_service.get_guardian_patient(db, current_user)
    member = family_service.create_family_member(db, guardian, data)
    return FamilyMemberResponse(**family_service.family_member_to_dict(member))


@router.get(
    "/members/{family_member_id}",
    response_model=FamilyMemberResponse,
    summary="Get family member details",
)
def get_member(
    family_member_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleName.PATIENT)),
    _: str = Security(security_scheme),
) -> FamilyMemberResponse:
    guardian = family_service.get_guardian_patient(db, current_user)
    member = family_service._load_family_member(db, family_member_id, guardian)
    return FamilyMemberResponse(**family_service.family_member_to_dict(member))


@router.put(
    "/members/{family_member_id}",
    response_model=FamilyMemberResponse,
    summary="Update family member",
)
def update_member(
    family_member_id: int,
    data: FamilyMemberUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleName.PATIENT)),
    _: str = Security(security_scheme),
) -> FamilyMemberResponse:
    guardian = family_service.get_guardian_patient(db, current_user)
    member = family_service.update_family_member(db, guardian, family_member_id, data)
    return FamilyMemberResponse(**family_service.family_member_to_dict(member))


@router.delete(
    "/members/{family_member_id}",
    response_model=MessageResponse,
    summary="Remove family member (deactivate)",
)
def remove_member(
    family_member_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleName.PATIENT)),
    _: str = Security(security_scheme),
) -> MessageResponse:
    guardian = family_service.get_guardian_patient(db, current_user)
    family_service.remove_family_member(db, guardian, family_member_id)
    return MessageResponse(message="Family member removed successfully")


@router.get(
    "/dashboard",
    response_model=FamilyDashboardResponse,
    summary="Family health dashboard",
)
def family_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleName.PATIENT)),
    _: str = Security(security_scheme),
) -> FamilyDashboardResponse:
    guardian = family_service.get_guardian_patient(db, current_user)
    return FamilyDashboardResponse(**family_service.family_dashboard(db, guardian))


@router.get(
    "/emergency/me",
    response_model=EmergencyProfileResponse,
    summary="Get my emergency medical profile",
)
def get_my_emergency_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleName.PATIENT)),
    _: str = Security(security_scheme),
) -> EmergencyProfileResponse:
    guardian = family_service.get_guardian_patient(db, current_user)
    profile = family_service.get_or_create_emergency_profile(db, guardian)
    return EmergencyProfileResponse(
        **family_service.emergency_profile_to_dict(profile, guardian)
    )


@router.put(
    "/emergency/me",
    response_model=EmergencyProfileResponse,
    summary="Update my emergency medical profile",
)
def update_my_emergency_profile(
    data: EmergencyProfileUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleName.PATIENT)),
    _: str = Security(security_scheme),
) -> EmergencyProfileResponse:
    guardian = family_service.get_guardian_patient(db, current_user)
    profile = family_service.update_emergency_profile(db, guardian, data)
    return EmergencyProfileResponse(
        **family_service.emergency_profile_to_dict(profile, guardian)
    )


@router.get(
    "/emergency/card",
    response_model=EmergencyCardResponse,
    summary="One-tap emergency access card",
    description="Critical medical info for self or a family member. Optimized for emergency screens.",
)
def emergency_card(
    family_member_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleName.PATIENT)),
    _: str = Security(security_scheme),
) -> EmergencyCardResponse:
    guardian = family_service.get_guardian_patient(db, current_user)
    return EmergencyCardResponse(
        **family_service.get_emergency_card(db, guardian, family_member_id=family_member_id)
    )


@router.put(
    "/emergency/members/{family_member_id}",
    response_model=EmergencyProfileResponse,
    summary="Update family member emergency profile",
)
def update_family_emergency(
    family_member_id: int,
    data: EmergencyProfileUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleName.PATIENT)),
    _: str = Security(security_scheme),
) -> EmergencyProfileResponse:
    guardian = family_service.get_guardian_patient(db, current_user)
    profile = family_service.update_emergency_profile(
        db, guardian, data, family_member_id=family_member_id
    )
    member = family_service._load_family_member(db, family_member_id, guardian)
    return EmergencyProfileResponse(
        **family_service.emergency_profile_to_dict(profile, member.dependent_patient)
    )
