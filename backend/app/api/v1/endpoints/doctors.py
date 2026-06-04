from fastapi import APIRouter, Depends, Query, Security, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user, require_roles, security_scheme
from app.models import RoleName, User
from app.schemas.auth import MessageResponse
from app.schemas.doctor import (
    AvailabilityBulkUpdateRequest,
    AvailabilitySlotResponse,
    DoctorLeaveCreateRequest,
    DoctorLeaveResponse,
    DoctorListResponse,
    DoctorProfileUpdateRequest,
    DoctorResponse,
    PendingDoctorResponse,
    DoctorApprovalActionResponse,
)
from app.services import doctor_service

router = APIRouter(prefix="/doctors", tags=["Doctors"])


@router.get(
    "",
    response_model=DoctorListResponse,
    summary="List approved doctors",
    description="Public listing of approved doctors. Optional search and specialization filter.",
)
def list_doctors(
    search: str | None = Query(default=None),
    specialization: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
) -> DoctorListResponse:
    items, total = doctor_service.list_doctors(
        db,
        search=search,
        specialization=specialization,
        page=page,
        page_size=page_size,
    )
    return DoctorListResponse(items=items, total=total, page=page, page_size=page_size)


@router.get(
    "/me",
    response_model=DoctorResponse,
    summary="Get my doctor profile",
)
def get_my_doctor_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleName.DOCTOR)),
    _: str = Security(security_scheme),
) -> DoctorResponse:
    return doctor_service.get_doctor_by_user_id(db, current_user.id)


@router.put(
    "/me",
    response_model=DoctorResponse,
    summary="Update my doctor profile",
)
def update_my_doctor_profile(
    data: DoctorProfileUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleName.DOCTOR)),
    _: str = Security(security_scheme),
) -> DoctorResponse:
    doctor = doctor_service.get_doctor_by_user_id(db, current_user.id)
    doctor_service.update_doctor_profile(db, doctor, data)
    return doctor_service.get_doctor_by_user_id(db, current_user.id)


@router.get(
    "/me/availability",
    response_model=list[AvailabilitySlotResponse],
    summary="Get my weekly availability",
)
def get_my_availability(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleName.DOCTOR)),
    _: str = Security(security_scheme),
) -> list[AvailabilitySlotResponse]:
    doctor = doctor_service.get_doctor_by_user_id(db, current_user.id)
    return doctor_service.get_doctor_availability(db, doctor)


@router.put(
    "/me/availability",
    response_model=list[AvailabilitySlotResponse],
    summary="Set my weekly availability",
    description="Replaces the entire weekly schedule with the provided slots.",
)
def set_my_availability(
    data: AvailabilityBulkUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleName.DOCTOR)),
    _: str = Security(security_scheme),
) -> list[AvailabilitySlotResponse]:
    doctor = doctor_service.get_doctor_by_user_id(db, current_user.id)
    return doctor_service.replace_availability(db, doctor, data)


@router.get(
    "/me/leaves",
    response_model=list[DoctorLeaveResponse],
    summary="List my leave records",
)
def list_my_leaves(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleName.DOCTOR)),
    _: str = Security(security_scheme),
) -> list[DoctorLeaveResponse]:
    doctor = doctor_service.get_doctor_by_user_id(db, current_user.id)
    return doctor_service.list_leaves(db, doctor)


@router.post(
    "/me/leaves",
    response_model=DoctorLeaveResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a leave record",
)
def create_my_leave(
    data: DoctorLeaveCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleName.DOCTOR)),
    _: str = Security(security_scheme),
) -> DoctorLeaveResponse:
    doctor = doctor_service.get_doctor_by_user_id(db, current_user.id)
    return doctor_service.create_leave(db, doctor, data)


@router.delete(
    "/me/leaves/{leave_id}",
    response_model=MessageResponse,
    summary="Delete a leave record",
)
def delete_my_leave(
    leave_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleName.DOCTOR)),
    _: str = Security(security_scheme),
) -> MessageResponse:
    doctor = doctor_service.get_doctor_by_user_id(db, current_user.id)
    doctor_service.delete_leave(db, doctor, leave_id)
    return MessageResponse(message="Leave deleted successfully")


@router.get(
    "/{doctor_id}",
    response_model=DoctorResponse,
    summary="Get doctor details",
    description="Public endpoint for approved doctor profile with availability.",
)
def get_doctor_details(doctor_id: int, db: Session = Depends(get_db)) -> DoctorResponse:
    return doctor_service.get_doctor_by_id(db, doctor_id)


admin_router = APIRouter(prefix="/admin/doctors", tags=["Admin — Doctors"])


@admin_router.get(
    "/pending",
    response_model=list[PendingDoctorResponse],
    summary="List pending doctor approvals",
)
def list_pending_doctors(
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(RoleName.ADMIN)),
    __: str = Security(security_scheme),
) -> list[PendingDoctorResponse]:
    return doctor_service.list_pending_doctors(db)


@admin_router.post(
    "/{user_id}/approve",
    response_model=DoctorApprovalActionResponse,
    summary="Approve a doctor",
)
def approve_doctor(
    user_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(RoleName.ADMIN)),
    __: str = Security(security_scheme),
) -> DoctorApprovalActionResponse:
    user = doctor_service.approve_doctor(db, user_id)
    return DoctorApprovalActionResponse(message="Doctor approved successfully", user=user)


@admin_router.post(
    "/{user_id}/reject",
    response_model=DoctorApprovalActionResponse,
    summary="Reject a doctor registration",
)
def reject_doctor(
    user_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(RoleName.ADMIN)),
    __: str = Security(security_scheme),
) -> DoctorApprovalActionResponse:
    user = doctor_service.reject_doctor(db, user_id)
    return DoctorApprovalActionResponse(message="Doctor registration rejected", user=user)
