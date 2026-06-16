from datetime import date

from fastapi import APIRouter, Depends, Query, Security, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_roles, security_scheme
from app.models import RoleName, User
from app.schemas.appointment import (
    AppointmentBookRequest,
    AppointmentCancelRequest,
    AppointmentCompleteRequest,
    AppointmentListResponse,
    AppointmentRescheduleRequest,
    AppointmentResponse,
    AvailableSlotsResponse,
)
from app.services import appointment_service, doctor_service, patient_service

router = APIRouter(prefix="/appointments", tags=["Appointments"])


def _to_response(appointment) -> AppointmentResponse:
    return AppointmentResponse(**appointment_service.format_appointment_response(appointment))


def _to_list(appointments, total: int, page: int, page_size: int) -> AppointmentListResponse:
    return AppointmentListResponse(
        items=[_to_response(a) for a in appointments],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get(
    "/doctors/{doctor_id}/slots",
    response_model=AvailableSlotsResponse,
    summary="Get available appointment slots",
    description="Returns 30-minute slots for a doctor on a given date based on availability, leaves, and existing bookings.",
)
def get_doctor_slots(
    doctor_id: int,
    appointment_date: date = Query(..., description="Date to check availability (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
) -> AvailableSlotsResponse:
    doctor = doctor_service.get_doctor_by_id(db, doctor_id)
    slots = appointment_service.get_available_slots(db, doctor, appointment_date)
    return AvailableSlotsResponse(
        doctor_id=doctor.id,
        appointment_date=appointment_date,
        slot_duration_minutes=appointment_service.SLOT_DURATION_MINUTES,
        slots=slots,
    )


@router.post(
    "",
    response_model=AppointmentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Book an appointment",
)
def book_appointment(
    data: AppointmentBookRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleName.PATIENT)),
    _: str = Security(security_scheme),
) -> AppointmentResponse:
    from app.services import family_service

    guardian = family_service.get_guardian_patient(db, current_user)
    target_patient, family_member = family_service.resolve_patient_for_booking(
        db, guardian, data.family_member_id
    )
    appointment = appointment_service.book_appointment(
        db,
        target_patient,
        data,
        booked_by_user_id=current_user.id,
        family_member_id=family_member.id if family_member else None,
    )
    return _to_response(appointment)


@router.get(
    "/upcoming",
    response_model=AppointmentListResponse,
    summary="List upcoming appointments",
)
def list_upcoming_appointments(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleName.PATIENT, RoleName.DOCTOR, RoleName.ADMIN)),
    _: str = Security(security_scheme),
) -> AppointmentListResponse:
    items, total = appointment_service.list_appointments(
        db, current_user, upcoming=True, page=page, page_size=page_size
    )
    return _to_list(items, total, page, page_size)


@router.get(
    "/completed",
    response_model=AppointmentListResponse,
    summary="List completed appointments",
)
def list_completed_appointments(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleName.PATIENT, RoleName.DOCTOR, RoleName.ADMIN)),
    _: str = Security(security_scheme),
) -> AppointmentListResponse:
    items, total = appointment_service.list_appointments(
        db, current_user, completed=True, page=page, page_size=page_size
    )
    return _to_list(items, total, page, page_size)


@router.get(
    "/history",
    response_model=AppointmentListResponse,
    summary="Appointment history with filters",
)
def list_appointment_history(
    status_filter: str | None = Query(default=None, alias="status"),
    from_date: date | None = Query(default=None),
    to_date: date | None = Query(default=None),
    doctor_id: int | None = Query(default=None),
    patient_id: int | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleName.PATIENT, RoleName.DOCTOR, RoleName.ADMIN)),
    _: str = Security(security_scheme),
) -> AppointmentListResponse:
    items, total = appointment_service.list_appointments(
        db,
        current_user,
        status_filter=status_filter,
        from_date=from_date,
        to_date=to_date,
        doctor_id=doctor_id,
        patient_id=patient_id,
        page=page,
        page_size=page_size,
    )
    return _to_list(items, total, page, page_size)


@router.get(
    "/today",
    response_model=AppointmentListResponse,
    summary="Doctor dashboard — today's appointments",
)
def list_today_appointments(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleName.DOCTOR)),
    _: str = Security(security_scheme),
) -> AppointmentListResponse:
    doctor = doctor_service.get_doctor_by_user_id(db, current_user.id)
    items = appointment_service.get_today_appointments(db, doctor)
    return _to_list(items, len(items), 1, max(len(items), 1))


@router.get(
    "/{appointment_id}",
    response_model=AppointmentResponse,
    summary="Get appointment details",
)
def get_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleName.PATIENT, RoleName.DOCTOR, RoleName.ADMIN)),
    _: str = Security(security_scheme),
) -> AppointmentResponse:
    appointment = appointment_service._load_appointment(db, appointment_id)
    appointment_service._check_access(appointment, current_user)
    return _to_response(appointment)


@router.post(
    "/{appointment_id}/confirm",
    response_model=AppointmentResponse,
    summary="Confirm appointment",
)
def confirm_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleName.DOCTOR, RoleName.ADMIN)),
    _: str = Security(security_scheme),
) -> AppointmentResponse:
    appointment = appointment_service.confirm_appointment(db, appointment_id, current_user)
    return _to_response(appointment)


@router.post(
    "/{appointment_id}/reschedule",
    response_model=AppointmentResponse,
    summary="Reschedule appointment",
)
def reschedule_appointment(
    appointment_id: int,
    data: AppointmentRescheduleRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleName.PATIENT, RoleName.DOCTOR, RoleName.ADMIN)),
    _: str = Security(security_scheme),
) -> AppointmentResponse:
    appointment = appointment_service.reschedule_appointment(db, appointment_id, current_user, data)
    return _to_response(appointment)


@router.post(
    "/{appointment_id}/cancel",
    response_model=AppointmentResponse,
    summary="Cancel appointment",
)
def cancel_appointment(
    appointment_id: int,
    data: AppointmentCancelRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleName.PATIENT, RoleName.DOCTOR, RoleName.ADMIN)),
    _: str = Security(security_scheme),
) -> AppointmentResponse:
    appointment = appointment_service.cancel_appointment(db, appointment_id, current_user, data)
    return _to_response(appointment)


@router.post(
    "/{appointment_id}/complete",
    response_model=AppointmentResponse,
    summary="Complete appointment",
)
def complete_appointment(
    appointment_id: int,
    data: AppointmentCompleteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleName.DOCTOR, RoleName.ADMIN)),
    _: str = Security(security_scheme),
) -> AppointmentResponse:
    appointment = appointment_service.complete_appointment(db, appointment_id, current_user, data)
    return _to_response(appointment)
