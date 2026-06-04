from datetime import UTC, date, datetime, time, timedelta

from fastapi import HTTPException, status
from sqlalchemy import and_, or_
from sqlalchemy.orm import Session, joinedload

from app.models import (
    Appointment,
    AppointmentStatus,
    Doctor,
    DoctorAvailability,
    DoctorLeave,
    Patient,
    RoleName,
    User,
)
from app.schemas.appointment import (
    AppointmentBookRequest,
    AppointmentCancelRequest,
    AppointmentCompleteRequest,
    AppointmentRescheduleRequest,
    AvailableSlotResponse,
)

SLOT_DURATION_MINUTES = 30
ACTIVE_STATUSES = [AppointmentStatus.PENDING.value, AppointmentStatus.CONFIRMED.value]


def _add_minutes(t: time, minutes: int) -> time:
    combined = datetime.combine(date.today(), t) + timedelta(minutes=minutes)
    return combined.time()


def _get_end_time(start: time) -> time:
    return _add_minutes(start, SLOT_DURATION_MINUTES)


def _is_on_leave(db: Session, doctor_id: int, appointment_date: date) -> bool:
    leave = (
        db.query(DoctorLeave)
        .filter(
            DoctorLeave.doctor_id == doctor_id,
            DoctorLeave.start_date <= appointment_date,
            DoctorLeave.end_date >= appointment_date,
        )
        .first()
    )
    return leave is not None


def _get_booked_starts(db: Session, doctor_id: int, appointment_date: date) -> set[time]:
    appointments = (
        db.query(Appointment)
        .filter(
            Appointment.doctor_id == doctor_id,
            Appointment.appointment_date == appointment_date,
            Appointment.status.in_(ACTIVE_STATUSES),
        )
        .all()
    )
    return {appt.start_time for appt in appointments}


def _validate_slot_available(
    db: Session,
    doctor: Doctor,
    appointment_date: date,
    start_time: time,
    *,
    exclude_appointment_id: int | None = None,
) -> time:
    if appointment_date < date.today():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot book in the past")

    if not doctor.user.is_approved or not doctor.user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Doctor is not available")

    if _is_on_leave(db, doctor.id, appointment_date):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Doctor is on leave for this date",
        )

    day_of_week = appointment_date.weekday()
    availability = (
        db.query(DoctorAvailability)
        .filter(
            DoctorAvailability.doctor_id == doctor.id,
            DoctorAvailability.day_of_week == day_of_week,
            DoctorAvailability.is_active.is_(True),
        )
        .all()
    )

    if not availability:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Doctor has no availability on this day",
        )

    end_time = _get_end_time(start_time)
    slot_valid = False
    for slot in availability:
        if slot.start_time <= start_time and end_time <= slot.end_time:
            slot_valid = True
            break

    if not slot_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Selected time is outside doctor availability",
        )

    booked = _get_booked_starts(db, doctor.id, appointment_date)
    if exclude_appointment_id:
        existing = db.query(Appointment).filter(Appointment.id == exclude_appointment_id).first()
        if existing and existing.start_time in booked:
            booked = booked - {existing.start_time}

    if start_time in booked:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This slot is already booked",
        )

    from app.services.scheduling_service import enforce_max_per_day, is_slot_available_with_rules

    enforce_max_per_day(db, doctor, appointment_date)
    if not is_slot_available_with_rules(
        db,
        doctor,
        appointment_date,
        start_time,
        end_time,
        exclude_appointment_id=exclude_appointment_id,
    ):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Slot conflicts with buffer time or existing booking",
        )

    return end_time


def get_available_slots(db: Session, doctor: Doctor, appointment_date: date) -> list[AvailableSlotResponse]:
    if appointment_date < date.today():
        return []

    from app.services.scheduling_service import count_day_appointments, is_slot_available_with_rules

    if doctor.max_appointments_per_day and count_day_appointments(
        db, doctor.id, appointment_date
    ) >= doctor.max_appointments_per_day:
        return []

    if _is_on_leave(db, doctor.id, appointment_date):
        return []

    day_of_week = appointment_date.weekday()
    availability = (
        db.query(DoctorAvailability)
        .filter(
            DoctorAvailability.doctor_id == doctor.id,
            DoctorAvailability.day_of_week == day_of_week,
            DoctorAvailability.is_active.is_(True),
        )
        .order_by(DoctorAvailability.start_time)
        .all()
    )

    booked = _get_booked_starts(db, doctor.id, appointment_date)
    slots: list[AvailableSlotResponse] = []

    for window in availability:
        current = window.start_time
        while True:
            end_time = _get_end_time(current)
            if end_time > window.end_time:
                break
            if current not in booked:
                include = False
                if appointment_date == date.today():
                    now = datetime.now(UTC).time()
                    include = current > now
                else:
                    include = True
                if include and is_slot_available_with_rules(
                    db, doctor, appointment_date, current, end_time
                ):
                    slots.append(AvailableSlotResponse(start_time=current, end_time=end_time))
            current = end_time

    return slots


def _load_appointment(db: Session, appointment_id: int) -> Appointment:
    appointment = (
        db.query(Appointment)
        .options(
            joinedload(Appointment.patient).joinedload(Patient.user),
            joinedload(Appointment.doctor).joinedload(Doctor.user),
        )
        .filter(Appointment.id == appointment_id)
        .first()
    )
    if appointment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found")
    return appointment


def _check_access(appointment: Appointment, user: User) -> None:
    if user.role.name == RoleName.ADMIN.value:
        return

    if user.role.name == RoleName.PATIENT.value:
        if appointment.patient.user_id == user.id:
            return
        if appointment.booked_by_user_id == user.id:
            return
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    if user.role.name == RoleName.DOCTOR.value:
        if appointment.doctor.user_id != user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        return

    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")


def book_appointment(
    db: Session,
    patient: Patient,
    data: AppointmentBookRequest,
    *,
    booked_by_user_id: int | None = None,
    family_member_id: int | None = None,
) -> Appointment:
    doctor = (
        db.query(Doctor)
        .options(joinedload(Doctor.user))
        .filter(Doctor.id == data.doctor_id)
        .first()
    )
    if doctor is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found")

    end_time = _validate_slot_available(db, doctor, data.appointment_date, data.start_time)

    appointment = Appointment(
        patient_id=patient.id,
        doctor_id=doctor.id,
        appointment_date=data.appointment_date,
        start_time=data.start_time,
        end_time=end_time,
        status=AppointmentStatus.PENDING.value,
        reason=data.reason,
        booked_by_user_id=booked_by_user_id,
        family_member_id=family_member_id,
    )
    db.add(appointment)
    db.commit()
    loaded = _load_appointment(db, appointment.id)

    from app.services.notification_service import notify_appointment_booked

    from app.services.family_service import patient_display_name

    notify_user = loaded.patient.user
    if notify_user is None and booked_by_user_id:
        notify_user = db.query(User).filter(User.id == booked_by_user_id).first()
    if notify_user:
        patient_name = patient_display_name(loaded.patient)
        notify_appointment_booked(
            db,
            notify_user,
            loaded.doctor.user.full_name,
            str(loaded.appointment_date),
            loaded.start_time.strftime("%H:%M"),
        )
    return loaded


def confirm_appointment(db: Session, appointment_id: int, user: User) -> Appointment:
    appointment = _load_appointment(db, appointment_id)
    _check_access(appointment, user)

    if user.role.name not in {RoleName.DOCTOR.value, RoleName.ADMIN.value}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only doctors can confirm")

    if appointment.status != AppointmentStatus.PENDING.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot confirm appointment with status '{appointment.status}'",
        )

    appointment.status = AppointmentStatus.CONFIRMED.value
    db.commit()
    loaded = _load_appointment(db, appointment.id)

    from app.services.notification_service import notify_appointment_confirmed

    notify_appointment_confirmed(
        db,
        loaded.patient.user,
        loaded.doctor.user.full_name,
        str(loaded.appointment_date),
        loaded.start_time.strftime("%H:%M"),
    )
    return loaded


def reschedule_appointment(
    db: Session, appointment_id: int, user: User, data: AppointmentRescheduleRequest
) -> Appointment:
    appointment = _load_appointment(db, appointment_id)
    _check_access(appointment, user)

    if appointment.status not in ACTIVE_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only pending or confirmed appointments can be rescheduled",
        )

    end_time = _validate_slot_available(
        db,
        appointment.doctor,
        data.appointment_date,
        data.start_time,
        exclude_appointment_id=appointment.id,
    )

    appointment.appointment_date = data.appointment_date
    appointment.start_time = data.start_time
    appointment.end_time = end_time
    if data.reason:
        appointment.reason = data.reason
    appointment.status = AppointmentStatus.PENDING.value
    db.commit()
    return _load_appointment(db, appointment.id)


def cancel_appointment(
    db: Session, appointment_id: int, user: User, data: AppointmentCancelRequest
) -> Appointment:
    appointment = _load_appointment(db, appointment_id)
    _check_access(appointment, user)

    if appointment.status not in ACTIVE_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only pending or confirmed appointments can be cancelled",
        )

    freed_date = appointment.appointment_date
    freed_start = appointment.start_time
    freed_end = appointment.end_time
    freed_doctor_id = appointment.doctor_id

    appointment.status = AppointmentStatus.CANCELLED.value
    appointment.cancellation_reason = data.cancellation_reason
    db.commit()

    from app.services.scheduling_service import try_allocate_waitlist

    try_allocate_waitlist(
        db,
        doctor_id=freed_doctor_id,
        appointment_date=freed_date,
        start_time=freed_start,
        end_time=freed_end,
    )

    loaded = _load_appointment(db, appointment.id)

    from app.services.notification_service import notify_appointment_status

    notify_appointment_status(
        db,
        loaded.patient.user,
        "cancelled",
        f"Your appointment on {loaded.appointment_date} at {loaded.start_time.strftime('%H:%M')} was cancelled.",
    )
    return loaded


def complete_appointment(
    db: Session, appointment_id: int, user: User, data: AppointmentCompleteRequest
) -> Appointment:
    appointment = _load_appointment(db, appointment_id)
    _check_access(appointment, user)

    if user.role.name not in {RoleName.DOCTOR.value, RoleName.ADMIN.value}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only doctors can complete")

    if appointment.status != AppointmentStatus.CONFIRMED.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only confirmed appointments can be completed",
        )

    appointment.status = AppointmentStatus.COMPLETED.value
    if data.notes:
        appointment.notes = data.notes
    db.commit()
    return _load_appointment(db, appointment.id)


def _apply_role_filter(query, db: Session, user: User):
    if user.role.name == RoleName.PATIENT.value:
        from app.models import FamilyMember

        guardian = db.query(Patient).filter(Patient.user_id == user.id).first()
        if guardian is None:
            return query.filter(False)
        dependent_ids = [
            row[0]
            for row in db.query(FamilyMember.dependent_patient_id)
            .filter(
                FamilyMember.guardian_patient_id == guardian.id,
                FamilyMember.is_active.is_(True),
            )
            .all()
        ]
        patient_ids = [guardian.id, *dependent_ids]
        return query.filter(Appointment.patient_id.in_(patient_ids))
    if user.role.name == RoleName.DOCTOR.value:
        return query.join(Doctor).filter(Doctor.user_id == user.id)
    return query


def list_appointments(
    db: Session,
    user: User,
    *,
    status_filter: str | None = None,
    from_date: date | None = None,
    to_date: date | None = None,
    doctor_id: int | None = None,
    patient_id: int | None = None,
    upcoming: bool | None = None,
    completed: bool | None = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[Appointment], int]:
    query = db.query(Appointment).options(
        joinedload(Appointment.patient).joinedload(Patient.user),
        joinedload(Appointment.doctor).joinedload(Doctor.user),
    )
    query = _apply_role_filter(query, db, user)

    if user.role.name == RoleName.ADMIN.value:
        if doctor_id:
            query = query.filter(Appointment.doctor_id == doctor_id)
        if patient_id:
            query = query.filter(Appointment.patient_id == patient_id)

    if status_filter:
        query = query.filter(Appointment.status == status_filter)

    if from_date:
        query = query.filter(Appointment.appointment_date >= from_date)
    if to_date:
        query = query.filter(Appointment.appointment_date <= to_date)

    today = date.today()
    now_time = datetime.now(UTC).time()

    if upcoming:
        query = query.filter(
            Appointment.status.in_(ACTIVE_STATUSES),
            or_(
                Appointment.appointment_date > today,
                and_(
                    Appointment.appointment_date == today,
                    Appointment.start_time >= now_time,
                ),
            ),
        )
    elif completed:
        query = query.filter(Appointment.status == AppointmentStatus.COMPLETED.value)
    else:
        query = query.filter(Appointment.status != AppointmentStatus.CANCELLED.value)

    total = query.count()
    appointments = (
        query.order_by(Appointment.appointment_date.desc(), Appointment.start_time.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return appointments, total


def get_today_appointments(db: Session, doctor: Doctor) -> list[Appointment]:
    today = date.today()
    return (
        db.query(Appointment)
        .options(
            joinedload(Appointment.patient).joinedload(Patient.user),
            joinedload(Appointment.doctor).joinedload(Doctor.user),
        )
        .filter(
            Appointment.doctor_id == doctor.id,
            Appointment.appointment_date == today,
            Appointment.status.in_(ACTIVE_STATUSES),
        )
        .order_by(Appointment.start_time)
        .all()
    )


def format_appointment_response(appointment: Appointment) -> dict:
    from app.services.family_service import patient_display_name

    patient_data = None
    doctor_data = None

    if appointment.patient:
        if appointment.patient.user:
            patient_data = {
                "id": appointment.patient.user.id,
                "full_name": appointment.patient.user.full_name,
                "email": appointment.patient.user.email,
                "phone": appointment.patient.user.phone,
                "is_family_dependent": appointment.family_member_id is not None,
                "family_member_id": appointment.family_member_id,
            }
        else:
            patient_data = {
                "id": None,
                "full_name": patient_display_name(appointment.patient),
                "email": None,
                "phone": appointment.patient.emergency_contact_phone,
                "is_family_dependent": True,
                "family_member_id": appointment.family_member_id,
            }
    if appointment.doctor and appointment.doctor.user:
        doctor_data = {
            "id": appointment.doctor.user.id,
            "full_name": appointment.doctor.user.full_name,
            "email": appointment.doctor.user.email,
            "phone": appointment.doctor.user.phone,
        }

    return {
        "id": appointment.id,
        "patient_id": appointment.patient_id,
        "doctor_id": appointment.doctor_id,
        "appointment_date": appointment.appointment_date,
        "start_time": appointment.start_time,
        "end_time": appointment.end_time,
        "status": appointment.status,
        "reason": appointment.reason,
        "notes": appointment.notes,
        "cancellation_reason": appointment.cancellation_reason,
        "created_at": appointment.created_at,
        "updated_at": appointment.updated_at,
        "patient": patient_data,
        "doctor": doctor_data,
        "booked_by_user_id": appointment.booked_by_user_id,
        "family_member_id": appointment.family_member_id,
    }
