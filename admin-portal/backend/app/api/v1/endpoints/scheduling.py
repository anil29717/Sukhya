from fastapi import APIRouter, Depends, Query, Security, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_roles, security_scheme
from app.models import RoleName, User
from app.schemas.scheduling import (
    DoctorSchedulingSettingsRequest,
    DoctorSchedulingSettingsResponse,
    QuickRebookResponse,
    RecurringAppointmentCreateRequest,
    RecurringAppointmentResponse,
    WaitlistEntryResponse,
    WaitlistJoinRequest,
)
from app.services import scheduling_service
from app.services.clinical_access import get_doctor_profile

router = APIRouter(prefix="/appointments", tags=["Advanced Appointments (Premium)"])
doctor_scheduling_router = APIRouter(prefix="/doctors", tags=["Advanced Appointments (Premium)"])


@doctor_scheduling_router.get(
    "/me/scheduling",
    response_model=DoctorSchedulingSettingsResponse,
    summary="Get smart slot settings",
)
def get_scheduling_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleName.DOCTOR)),
    _: str = Security(security_scheme),
) -> DoctorSchedulingSettingsResponse:
    doctor = get_doctor_profile(db, current_user)
    return DoctorSchedulingSettingsResponse(**scheduling_service.get_scheduling_settings(doctor))


@doctor_scheduling_router.put(
    "/me/scheduling",
    response_model=DoctorSchedulingSettingsResponse,
    summary="Update buffer time and max appointments per day",
)
def update_scheduling_settings(
    data: DoctorSchedulingSettingsRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleName.DOCTOR)),
    _: str = Security(security_scheme),
) -> DoctorSchedulingSettingsResponse:
    doctor = get_doctor_profile(db, current_user)
    return DoctorSchedulingSettingsResponse(
        **scheduling_service.update_scheduling_settings(db, doctor, data)
    )


@router.post(
    "/waitlist",
    response_model=WaitlistEntryResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Join appointment waitlist",
)
def join_waitlist(
    data: WaitlistJoinRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleName.PATIENT)),
    _: str = Security(security_scheme),
) -> WaitlistEntryResponse:
    from app.services import family_service

    guardian = family_service.get_guardian_patient(db, current_user)
    patient, _ = family_service.resolve_patient_for_booking(db, guardian, data.family_member_id)
    entry = scheduling_service.join_waitlist(
        db, current_user, patient, data, booked_by_user_id=current_user.id
    )
    return WaitlistEntryResponse(**scheduling_service.waitlist_to_dict(entry))


@router.get("/waitlist", response_model=list[WaitlistEntryResponse], summary="List waitlist entries")
def list_waitlist(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleName.PATIENT, RoleName.DOCTOR, RoleName.ADMIN)),
    _: str = Security(security_scheme),
) -> list[WaitlistEntryResponse]:
    entries = scheduling_service.list_waitlist(db, current_user)
    return [WaitlistEntryResponse(**scheduling_service.waitlist_to_dict(e)) for e in entries]


@router.delete("/waitlist/{waitlist_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Leave waitlist")
def leave_waitlist(
    waitlist_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleName.PATIENT)),
    _: str = Security(security_scheme),
) -> None:
    scheduling_service.leave_waitlist(db, current_user, waitlist_id)


@router.post(
    "/recurring",
    response_model=RecurringAppointmentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create recurring appointment series",
)
def create_recurring(
    data: RecurringAppointmentCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleName.PATIENT)),
    _: str = Security(security_scheme),
) -> RecurringAppointmentResponse:
    from app.services import family_service

    guardian = family_service.get_guardian_patient(db, current_user)
    patient, family_member = family_service.resolve_patient_for_booking(db, guardian, data.family_member_id)
    series, _ = scheduling_service.create_recurring(
        db,
        patient,
        data,
        booked_by_user_id=current_user.id,
        family_member_id=family_member.id if family_member else None,
    )
    return RecurringAppointmentResponse(**scheduling_service.recurring_to_dict(db, series))


@router.get("/recurring", response_model=list[RecurringAppointmentResponse], summary="List recurring series")
def list_recurring(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleName.PATIENT, RoleName.DOCTOR, RoleName.ADMIN)),
    _: str = Security(security_scheme),
) -> list[RecurringAppointmentResponse]:
    series_list = scheduling_service.list_recurring(db, current_user)
    return [
        RecurringAppointmentResponse(**scheduling_service.recurring_to_dict(db, s))
        for s in series_list
    ]


@router.delete(
    "/recurring/{series_id}",
    response_model=RecurringAppointmentResponse,
    summary="Deactivate recurring series",
)
def deactivate_recurring(
    series_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleName.PATIENT)),
    _: str = Security(security_scheme),
) -> RecurringAppointmentResponse:
    series = scheduling_service.deactivate_recurring(db, current_user, series_id)
    return RecurringAppointmentResponse(**scheduling_service.recurring_to_dict(db, series))


@router.post(
    "/recurring/{series_id}/generate",
    summary="Generate more appointments for a series",
)
def generate_recurring(
    series_id: int,
    count: int = Query(default=4, ge=1, le=12),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleName.PATIENT)),
    _: str = Security(security_scheme),
) -> dict:
    n = scheduling_service.generate_more_recurring(db, current_user, series_id, count=count)
    return {"appointments_created": n}


@router.post(
    "/{appointment_id}/quick-rebook",
    response_model=QuickRebookResponse,
    summary="Rebook same doctor at next available slot",
)
def quick_rebook(
    appointment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleName.PATIENT)),
    _: str = Security(security_scheme),
) -> QuickRebookResponse:
    return QuickRebookResponse(**scheduling_service.quick_rebook(db, current_user, appointment_id))
