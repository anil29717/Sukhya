from datetime import UTC, date, datetime, time

from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.models import Doctor, NotificationChannel, RoleName, User
from app.models.clinical import FollowUp
from app.models.patient import Patient
from app.models.clinical import FollowUpStatus
from app.schemas.clinical import FollowUpCreateRequest, FollowUpUpdateRequest
from app.services.clinical_access import doctor_can_access_patient, get_doctor_profile, validate_appointment_for_doctor
from app.services.family_service import get_guardian_patient, patient_display_name
from app.services.notification_service import notification_service


def _follow_up_to_dict(fu: FollowUp) -> dict:
    doctor_name = fu.doctor.user.full_name if fu.doctor and fu.doctor.user else None
    patient_name = patient_display_name(fu.patient) if fu.patient else None
    return {
        "id": fu.id,
        "doctor_id": fu.doctor_id,
        "doctor_name": doctor_name,
        "patient_id": fu.patient_id,
        "patient_name": patient_name,
        "source_appointment_id": fu.source_appointment_id,
        "scheduled_date": fu.scheduled_date,
        "scheduled_time": fu.scheduled_time,
        "reason": fu.reason,
        "notes": fu.notes,
        "status": fu.status,
        "created_at": fu.created_at,
        "updated_at": fu.updated_at,
    }


def create_follow_up(db: Session, user: User, data: FollowUpCreateRequest) -> FollowUp:
    doctor = get_doctor_profile(db, user)
    doctor_can_access_patient(db, doctor, data.patient_id)
    if data.source_appointment_id:
        validate_appointment_for_doctor(db, doctor, data.source_appointment_id, data.patient_id)

    if data.scheduled_date < date.today():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot schedule in the past")

    fu = FollowUp(
        doctor_id=doctor.id,
        patient_id=data.patient_id,
        source_appointment_id=data.source_appointment_id,
        scheduled_date=data.scheduled_date,
        scheduled_time=data.scheduled_time,
        reason=data.reason,
        notes=data.notes,
    )
    db.add(fu)
    db.commit()
    return _load(db, fu.id)


def update_follow_up(db: Session, user: User, follow_up_id: int, data: FollowUpUpdateRequest) -> FollowUp:
    fu = _get_for_doctor(db, user, follow_up_id)
    if data.scheduled_date is not None:
        fu.scheduled_date = data.scheduled_date
    if data.scheduled_time is not None:
        fu.scheduled_time = data.scheduled_time
    if data.reason is not None:
        fu.reason = data.reason
    if data.notes is not None:
        fu.notes = data.notes
    if data.status is not None:
        if data.status not in {s.value for s in FollowUpStatus}:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid status")
        fu.status = data.status
    db.commit()
    return _load(db, fu.id)


def list_follow_ups(
    db: Session,
    user: User,
    *,
    patient_id: int | None = None,
    status_filter: str | None = None,
    page: int = 1,
    page_size: int = 50,
) -> tuple[list[dict], int]:
    query = (
        db.query(FollowUp)
        .options(joinedload(FollowUp.doctor).joinedload(Doctor.user), joinedload(FollowUp.patient))
    )

    if user.role.name == RoleName.DOCTOR.value:
        doctor = get_doctor_profile(db, user)
        query = query.filter(FollowUp.doctor_id == doctor.id)
        if patient_id:
            doctor_can_access_patient(db, doctor, patient_id)
            query = query.filter(FollowUp.patient_id == patient_id)
    elif user.role.name == RoleName.PATIENT.value:
        guardian = get_guardian_patient(db, user)
        query = query.filter(FollowUp.patient_id == guardian.id)
    elif user.role.name == RoleName.ADMIN.value:
        if patient_id:
            query = query.filter(FollowUp.patient_id == patient_id)
    else:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    if status_filter:
        query = query.filter(FollowUp.status == status_filter)

    total = query.count()
    items = (
        query.order_by(FollowUp.scheduled_date.asc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return [_follow_up_to_dict(fu) for fu in items], total


def get_due_follow_up_reminders(db: Session, *, days_ahead: int = 1) -> list[FollowUp]:
    today = date.today()
    end = today
    from datetime import timedelta

    end = today + timedelta(days=days_ahead)
    return (
        db.query(FollowUp)
        .options(joinedload(FollowUp.doctor).joinedload(Doctor.user), joinedload(FollowUp.patient).joinedload(Patient.user))  # noqa: E501
        .filter(
            FollowUp.status == FollowUpStatus.SCHEDULED.value,
            FollowUp.scheduled_date >= today,
            FollowUp.scheduled_date <= end,
            FollowUp.reminder_sent_at.is_(None),
        )
        .all()
    )


def send_follow_up_reminders(db: Session) -> int:
    from app.models.patient import Patient

    due = get_due_follow_up_reminders(db)
    sent = 0
    for fu in due:
        if not fu.patient or not fu.patient.user:
            continue
        time_str = fu.scheduled_time.strftime("%H:%M") if fu.scheduled_time else "any time"
        doctor_name = fu.doctor.user.full_name if fu.doctor and fu.doctor.user else "your doctor"
        notification_service.send(
            db,
            user=fu.patient.user,
            channel=NotificationChannel.EMAIL.value,
            event_type="follow_up_reminder",
            title="Follow-up appointment reminder",
            message=f"Follow-up with Dr. {doctor_name} on {fu.scheduled_date} at {time_str}. Reason: {fu.reason or 'General check-up'}",
            metadata={"follow_up_id": fu.id},
        )
        notification_service.send(
            db,
            user=fu.patient.user,
            channel=NotificationChannel.WHATSAPP.value,
            event_type="follow_up_reminder",
            title="Follow-up reminder",
            message=f"Reminder: follow-up with Dr. {doctor_name} on {fu.scheduled_date}.",
        )
        fu.reminder_sent_at = datetime.now(UTC)
        sent += 1
    db.commit()
    return sent


def _get_for_doctor(db: Session, user: User, follow_up_id: int) -> FollowUp:
    doctor = get_doctor_profile(db, user)
    fu = db.query(FollowUp).filter(FollowUp.id == follow_up_id, FollowUp.doctor_id == doctor.id).first()
    if fu is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Follow-up not found")
    return fu


def _load(db: Session, follow_up_id: int) -> FollowUp:
    from app.models.patient import Patient

    return (
        db.query(FollowUp)
        .options(joinedload(FollowUp.doctor).joinedload(Doctor.user), joinedload(FollowUp.patient))
        .filter(FollowUp.id == follow_up_id)
        .first()
    )
