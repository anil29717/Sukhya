from datetime import UTC, date, datetime, time, timedelta

from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.models import (
    Appointment,
    AppointmentStatus,
    Doctor,
    NotificationChannel,
    Patient,
    RoleName,
    User,
)
from app.models.scheduling import (
    AppointmentWaitlist,
    RecurrencePattern,
    RecurringAppointment,
    WaitlistStatus,
)
from app.schemas.appointment import AppointmentBookRequest
from app.schemas.scheduling import (
    DoctorSchedulingSettingsRequest,
    RecurringAppointmentCreateRequest,
    WaitlistJoinRequest,
)
from app.services import appointment_service


def _intervals_conflict(
    start_a: time,
    end_a: time,
    start_b: time,
    end_b: time,
    buffer_minutes: int = 0,
) -> bool:
    d = date.today()
    a0 = datetime.combine(d, start_a)
    a1 = datetime.combine(d, end_a) + timedelta(minutes=buffer_minutes)
    b0 = datetime.combine(d, start_b)
    b1 = datetime.combine(d, end_b) + timedelta(minutes=buffer_minutes)
    return a0 < b1 and a1 > b0


def get_booked_slots(db: Session, doctor_id: int, appointment_date: date) -> list[tuple[time, time]]:
    appointments = (
        db.query(Appointment)
        .filter(
            Appointment.doctor_id == doctor_id,
            Appointment.appointment_date == appointment_date,
            Appointment.status.in_(appointment_service.ACTIVE_STATUSES),
        )
        .all()
    )
    return [(a.start_time, a.end_time) for a in appointments]


def count_day_appointments(db: Session, doctor_id: int, appointment_date: date) -> int:
    return (
        db.query(Appointment)
        .filter(
            Appointment.doctor_id == doctor_id,
            Appointment.appointment_date == appointment_date,
            Appointment.status.in_(appointment_service.ACTIVE_STATUSES),
        )
        .count()
    )


def enforce_max_per_day(db: Session, doctor: Doctor, appointment_date: date) -> None:
    if doctor.max_appointments_per_day is None:
        return
    count = count_day_appointments(db, doctor.id, appointment_date)
    if count >= doctor.max_appointments_per_day:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Doctor has reached max {doctor.max_appointments_per_day} appointments for this day",
        )


def is_slot_available_with_rules(
    db: Session,
    doctor: Doctor,
    appointment_date: date,
    start_time: time,
    end_time: time,
    *,
    exclude_appointment_id: int | None = None,
) -> bool:
    enforce_max_per_day(db, doctor, appointment_date)
    booked = get_booked_slots(db, doctor.id, appointment_date)
    if exclude_appointment_id:
        existing = db.query(Appointment).filter(Appointment.id == exclude_appointment_id).first()
        if existing:
            booked = [
                (s, e)
                for s, e in booked
                if not (s == existing.start_time and e == existing.end_time)
            ]
    buffer = doctor.slot_buffer_minutes or 0
    for b_start, b_end in booked:
        if _intervals_conflict(start_time, end_time, b_start, b_end, buffer):
            return False
    if start_time in {b[0] for b in booked}:
        return False
    return True


def get_scheduling_settings(doctor: Doctor) -> dict:
    return {
        "doctor_id": doctor.id,
        "slot_buffer_minutes": doctor.slot_buffer_minutes,
        "max_appointments_per_day": doctor.max_appointments_per_day,
        "slot_duration_minutes": appointment_service.SLOT_DURATION_MINUTES,
    }


def update_scheduling_settings(
    db: Session, doctor: Doctor, data: DoctorSchedulingSettingsRequest
) -> dict:
    doctor.slot_buffer_minutes = data.slot_buffer_minutes
    doctor.max_appointments_per_day = data.max_appointments_per_day
    db.commit()
    db.refresh(doctor)
    return get_scheduling_settings(doctor)


def _next_waitlist_position(db: Session, doctor_id: int, desired_date: date) -> int:
    max_pos = (
        db.query(AppointmentWaitlist.position)
        .filter(
            AppointmentWaitlist.doctor_id == doctor_id,
            AppointmentWaitlist.desired_date == desired_date,
            AppointmentWaitlist.status == WaitlistStatus.WAITING.value,
        )
        .order_by(AppointmentWaitlist.position.desc())
        .first()
    )
    return (max_pos[0] if max_pos else 0) + 1


def join_waitlist(
    db: Session,
    user: User,
    patient: Patient,
    data: WaitlistJoinRequest,
    *,
    booked_by_user_id: int | None = None,
) -> AppointmentWaitlist:
    doctor = db.query(Doctor).filter(Doctor.id == data.doctor_id).first()
    if doctor is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found")

    if data.preferred_start_time:
        end_time = appointment_service._get_end_time(data.preferred_start_time)
        if not is_slot_available_with_rules(
            db, doctor, data.desired_date, data.preferred_start_time, end_time
        ):
            pass
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Slot is already available; book directly instead of waitlist",
            )

    existing = (
        db.query(AppointmentWaitlist)
        .filter(
            AppointmentWaitlist.patient_id == patient.id,
            AppointmentWaitlist.doctor_id == data.doctor_id,
            AppointmentWaitlist.desired_date == data.desired_date,
            AppointmentWaitlist.status == WaitlistStatus.WAITING.value,
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Already on waitlist for this date")

    entry = AppointmentWaitlist(
        patient_id=patient.id,
        doctor_id=data.doctor_id,
        booked_by_user_id=booked_by_user_id,
        desired_date=data.desired_date,
        preferred_start_time=data.preferred_start_time,
        reason=data.reason,
        position=_next_waitlist_position(db, data.doctor_id, data.desired_date),
    )
    db.add(entry)
    db.commit()
    return _load_waitlist(db, entry.id)


def leave_waitlist(db: Session, user: User, waitlist_id: int) -> None:
    entry = _get_waitlist_for_user(db, user, waitlist_id)
    if entry.status != WaitlistStatus.WAITING.value:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot leave this waitlist entry")
    entry.status = WaitlistStatus.CANCELLED.value
    db.commit()


def list_waitlist(db: Session, user: User) -> list[AppointmentWaitlist]:
    query = db.query(AppointmentWaitlist).options(
        joinedload(AppointmentWaitlist.doctor).joinedload(Doctor.user)
    )
    if user.role.name == RoleName.PATIENT.value:
        guardian = db.query(Patient).filter(Patient.user_id == user.id).first()
        if guardian is None:
            return []
        query = query.filter(AppointmentWaitlist.patient_id == guardian.id)
    elif user.role.name == RoleName.DOCTOR.value:
        doctor = db.query(Doctor).filter(Doctor.user_id == user.id).first()
        if doctor is None:
            return []
        query = query.filter(AppointmentWaitlist.doctor_id == doctor.id)
    return query.order_by(AppointmentWaitlist.desired_date, AppointmentWaitlist.position).all()


def try_allocate_waitlist(
    db: Session,
    *,
    doctor_id: int,
    appointment_date: date,
    start_time: time,
    end_time: time,
) -> Appointment | None:
    entries = (
        db.query(AppointmentWaitlist)
        .options(joinedload(AppointmentWaitlist.patient).joinedload(Patient.user))
        .filter(
            AppointmentWaitlist.doctor_id == doctor_id,
            AppointmentWaitlist.desired_date == appointment_date,
            AppointmentWaitlist.status == WaitlistStatus.WAITING.value,
        )
        .order_by(AppointmentWaitlist.position, AppointmentWaitlist.created_at)
        .all()
    )

    doctor = db.query(Doctor).options(joinedload(Doctor.user)).filter(Doctor.id == doctor_id).first()
    if not doctor:
        return None

    for entry in entries:
        if entry.preferred_start_time and entry.preferred_start_time != start_time:
            continue
        if not is_slot_available_with_rules(db, doctor, appointment_date, start_time, end_time):
            continue

        appt = Appointment(
            patient_id=entry.patient_id,
            doctor_id=doctor_id,
            appointment_date=appointment_date,
            start_time=start_time,
            end_time=end_time,
            status=AppointmentStatus.PENDING.value,
            reason=entry.reason or "Waitlist allocation",
            booked_by_user_id=entry.booked_by_user_id,
        )
        db.add(appt)
        db.flush()

        entry.status = WaitlistStatus.BOOKED.value
        entry.booked_appointment_id = appt.id
        entry.offered_at = datetime.now(UTC)
        db.commit()

        from app.services.notification_service import notification_service

        if entry.patient and entry.patient.user:
            notification_service.send(
                db,
                user=entry.patient.user,
                channel=NotificationChannel.EMAIL.value,
                event_type="waitlist_allocated",
                title="Appointment slot available",
                message=f"A slot opened on {appointment_date} at {start_time.strftime('%H:%M')} with Dr. {doctor.user.full_name}. Your appointment is pending confirmation.",
                metadata={"appointment_id": appt.id},
            )
        return _load_appointment(db, appt.id)
    return None


def _load_appointment(db: Session, appointment_id: int) -> Appointment:
    return appointment_service._load_appointment(db, appointment_id)


def _load_waitlist(db: Session, waitlist_id: int) -> AppointmentWaitlist:
    return (
        db.query(AppointmentWaitlist)
        .options(joinedload(AppointmentWaitlist.doctor).joinedload(Doctor.user))
        .filter(AppointmentWaitlist.id == waitlist_id)
        .first()
    )


def _get_waitlist_for_user(db: Session, user: User, waitlist_id: int) -> AppointmentWaitlist:
    entry = _load_waitlist(db, waitlist_id)
    if entry is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Waitlist entry not found")
    if user.role.name == RoleName.PATIENT.value:
        guardian = db.query(Patient).filter(Patient.user_id == user.id).first()
        if guardian and entry.patient_id == guardian.id:
            return entry
    if user.role.name == RoleName.DOCTOR.value:
        doctor = db.query(Doctor).filter(Doctor.user_id == user.id).first()
        if doctor and entry.doctor_id == doctor.id:
            return entry
    if user.role.name == RoleName.ADMIN.value:
        return entry
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")


def waitlist_to_dict(entry: AppointmentWaitlist) -> dict:
    doctor_name = entry.doctor.user.full_name if entry.doctor and entry.doctor.user else None
    return {
        "id": entry.id,
        "patient_id": entry.patient_id,
        "doctor_id": entry.doctor_id,
        "doctor_name": doctor_name,
        "desired_date": entry.desired_date,
        "preferred_start_time": entry.preferred_start_time,
        "reason": entry.reason,
        "status": entry.status,
        "position": entry.position,
        "booked_appointment_id": entry.booked_appointment_id,
        "created_at": entry.created_at,
    }


def _recurrence_dates(
    start: date, pattern: str, day_of_week: int, count: int, end_date: date | None
) -> list[date]:
    step = 7
    if pattern == RecurrencePattern.BIWEEKLY.value:
        step = 14
    elif pattern == RecurrencePattern.MONTHLY.value:
        step = 28

    dates: list[date] = []
    cursor = start
    while len(dates) < count:
        if end_date and cursor > end_date:
            break
        if cursor >= date.today() and cursor.weekday() == day_of_week:
            dates.append(cursor)
        cursor += timedelta(days=step)
    return dates


def create_recurring(
    db: Session,
    patient: Patient,
    data: RecurringAppointmentCreateRequest,
    *,
    booked_by_user_id: int | None = None,
    family_member_id: int | None = None,
) -> tuple[RecurringAppointment, int]:
    try:
        RecurrencePattern(data.recurrence_pattern)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid recurrence_pattern") from exc

    if data.start_date.weekday() != data.day_of_week:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="start_date must match day_of_week",
        )

    series = RecurringAppointment(
        patient_id=patient.id,
        doctor_id=data.doctor_id,
        booked_by_user_id=booked_by_user_id,
        family_member_id=family_member_id,
        recurrence_pattern=data.recurrence_pattern,
        day_of_week=data.day_of_week,
        preferred_start_time=data.preferred_start_time,
        start_date=data.start_date,
        end_date=data.end_date,
        reason=data.reason,
    )
    db.add(series)
    db.flush()

    created = _generate_for_series(db, series, count=data.weeks_ahead)
    series.last_generated_date = max((a.appointment_date for a in created), default=None)
    db.commit()
    db.refresh(series)
    return series, len(created)


def _generate_for_series(db: Session, series: RecurringAppointment, *, count: int) -> list[Appointment]:
    dates = _recurrence_dates(
        series.start_date, series.recurrence_pattern, series.day_of_week, count, series.end_date
    )
    created: list[Appointment] = []
    doctor = db.query(Doctor).options(joinedload(Doctor.user)).filter(Doctor.id == series.doctor_id).first()
    if not doctor:
        return created

    for appt_date in dates:
        if series.last_generated_date and appt_date <= series.last_generated_date:
            continue
        end_time = appointment_service._get_end_time(series.preferred_start_time)
        try:
            appointment_service._validate_slot_available(
                db, doctor, appt_date, series.preferred_start_time
            )
        except HTTPException:
            continue

        if not is_slot_available_with_rules(
            db, doctor, appt_date, series.preferred_start_time, end_time
        ):
            continue

        appt = Appointment(
            patient_id=series.patient_id,
            doctor_id=series.doctor_id,
            appointment_date=appt_date,
            start_time=series.preferred_start_time,
            end_time=end_time,
            status=AppointmentStatus.PENDING.value,
            reason=series.reason,
            booked_by_user_id=series.booked_by_user_id,
            family_member_id=series.family_member_id,
            recurring_appointment_id=series.id,
        )
        db.add(appt)
        created.append(appt)

    if created:
        series.last_generated_date = max(a.appointment_date for a in created)
    db.flush()
    return created


def list_recurring(db: Session, user: User) -> list[RecurringAppointment]:
    query = db.query(RecurringAppointment)
    if user.role.name == RoleName.PATIENT.value:
        guardian = db.query(Patient).filter(Patient.user_id == user.id).first()
        if guardian is None:
            return []
        query = query.filter(RecurringAppointment.patient_id == guardian.id)
    elif user.role.name == RoleName.DOCTOR.value:
        doctor = db.query(Doctor).filter(Doctor.user_id == user.id).first()
        if doctor:
            query = query.filter(RecurringAppointment.doctor_id == doctor.id)
    return query.order_by(RecurringAppointment.created_at.desc()).all()


def generate_more_recurring(db: Session, user: User, series_id: int, *, count: int = 4) -> int:
    series = db.query(RecurringAppointment).filter(RecurringAppointment.id == series_id).first()
    if series is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recurring series not found")
    if not series.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Series is inactive")
    if user.role.name == RoleName.PATIENT.value:
        guardian = db.query(Patient).filter(Patient.user_id == user.id).first()
        if not guardian or series.patient_id != guardian.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    created = _generate_for_series(db, series, count=count)
    db.commit()
    return len(created)


def deactivate_recurring(db: Session, user: User, series_id: int) -> RecurringAppointment:
    series = db.query(RecurringAppointment).filter(RecurringAppointment.id == series_id).first()
    if series is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recurring series not found")
    if user.role.name == RoleName.PATIENT.value:
        guardian = db.query(Patient).filter(Patient.user_id == user.id).first()
        if not guardian or series.patient_id != guardian.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    series.is_active = False
    db.commit()
    db.refresh(series)
    return series


def recurring_to_dict(db: Session, series: RecurringAppointment) -> dict:
    appt_count = (
        db.query(Appointment)
        .filter(Appointment.recurring_appointment_id == series.id)
        .count()
    )
    return {
        "id": series.id,
        "patient_id": series.patient_id,
        "doctor_id": series.doctor_id,
        "recurrence_pattern": series.recurrence_pattern,
        "day_of_week": series.day_of_week,
        "preferred_start_time": series.preferred_start_time,
        "start_date": series.start_date,
        "end_date": series.end_date,
        "reason": series.reason,
        "is_active": series.is_active,
        "last_generated_date": series.last_generated_date,
        "appointments_created": appt_count,
        "created_at": series.created_at,
    }


def quick_rebook(db: Session, user: User, appointment_id: int) -> dict:
    original = appointment_service._load_appointment(db, appointment_id)
    appointment_service._check_access(original, user)

    if user.role.name != RoleName.PATIENT.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only patients can quick-rebook",
        )

    doctor = original.doctor
    search_date = date.today()
    max_days = 60

    for _ in range(max_days):
        slots = appointment_service.get_available_slots(db, doctor, search_date)
        for slot in slots:
            book_data = AppointmentBookRequest(
                doctor_id=doctor.id,
                appointment_date=search_date,
                start_time=slot.start_time,
                reason=original.reason,
            )
            new_appt = appointment_service.book_appointment(
                db,
                original.patient,
                book_data,
                booked_by_user_id=user.id,
                family_member_id=original.family_member_id,
            )
            return {
                "original_appointment_id": original.id,
                "new_appointment_id": new_appt.id,
                "appointment_date": new_appt.appointment_date,
                "start_time": new_appt.start_time,
                "end_time": new_appt.end_time,
                "status": new_appt.status,
            }
        search_date += timedelta(days=1)

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="No available slots found for this doctor in the next 60 days",
    )
