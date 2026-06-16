from datetime import UTC, date, datetime, time, timedelta

from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.models import (
    Doctor,
    Medication,
    MedicationLog,
    MedicationSchedule,
    NotificationChannel,
    RoleName,
    User,
    VitalSign,
)
from app.models.medication import MedicationLogStatus, VitalType
from app.models.patient import Patient
from app.schemas.medication import (
    MedicationCreateRequest,
    MedicationLogRequest,
    MedicationUpdateRequest,
    VitalSignCreateRequest,
)
from app.services.notification_service import notification_service
from app.services.timeline_service import resolve_patient_access


def _medication_to_dict(med: Medication) -> dict:
    return {
        "id": med.id,
        "patient_id": med.patient_id,
        "doctor_id": med.doctor_id,
        "name": med.name,
        "dosage": med.dosage,
        "frequency": med.frequency,
        "instructions": med.instructions,
        "start_date": med.start_date,
        "end_date": med.end_date,
        "is_active": med.is_active,
        "schedules": [
            {
                "id": s.id,
                "time_of_day": s.time_of_day,
                "days_of_week": s.days_of_week,
                "reminder_enabled": s.reminder_enabled,
            }
            for s in med.schedules
        ],
        "created_at": med.created_at,
        "updated_at": med.updated_at,
    }


def create_medication(db: Session, user: User, data: MedicationCreateRequest) -> Medication:
    doctor_id = None
    if user.role.name == RoleName.DOCTOR.value:
        doctor = db.query(Doctor).filter(Doctor.user_id == user.id).first()
        if doctor is None:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Doctor profile not found")
        doctor_id = doctor.id
        if data.patient_id is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="patient_id required")
        patient = resolve_patient_access(db, user, data.patient_id)
    elif user.role.name == RoleName.PATIENT.value:
        patient = resolve_patient_access(db, user, data.patient_id)
    elif user.role.name == RoleName.ADMIN.value:
        if data.patient_id is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="patient_id required")
        patient = resolve_patient_access(db, user, data.patient_id)
    else:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    med = Medication(
        patient_id=patient.id,
        doctor_id=doctor_id,
        name=data.name,
        dosage=data.dosage,
        frequency=data.frequency,
        instructions=data.instructions,
        start_date=data.start_date,
        end_date=data.end_date,
    )
    db.add(med)
    db.flush()
    for sched in data.schedules:
        db.add(
            MedicationSchedule(
                medication_id=med.id,
                time_of_day=sched.time_of_day,
                days_of_week=sched.days_of_week,
                reminder_enabled=sched.reminder_enabled,
            )
        )
    db.commit()
    db.refresh(med)
    return (
        db.query(Medication)
        .options(joinedload(Medication.schedules))
        .filter(Medication.id == med.id)
        .first()
    )


def update_medication(
    db: Session, user: User, medication_id: int, data: MedicationUpdateRequest
) -> Medication:
    med = _get_medication_for_user(db, user, medication_id)
    for field in ("name", "dosage", "frequency", "instructions", "start_date", "end_date", "is_active"):
        value = getattr(data, field)
        if value is not None:
            setattr(med, field, value)
    db.commit()
    return (
        db.query(Medication)
        .options(joinedload(Medication.schedules))
        .filter(Medication.id == med.id)
        .first()
    )


def _get_medication_for_user(db: Session, user: User, medication_id: int) -> Medication:
    med = (
        db.query(Medication)
        .options(joinedload(Medication.schedules), joinedload(Medication.patient))
        .filter(Medication.id == medication_id)
        .first()
    )
    if med is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Medication not found")
    resolve_patient_access(db, user, med.patient_id)
    return med


def list_medications(
    db: Session,
    user: User,
    *,
    patient_id: int | None = None,
    active_only: bool = True,
) -> list[Medication]:
    query = db.query(Medication).options(joinedload(Medication.schedules))

    if user.role.name == RoleName.ADMIN.value:
        if patient_id:
            query = query.filter(Medication.patient_id == patient_id)
    else:
        patient = resolve_patient_access(db, user, patient_id)
        query = query.filter(Medication.patient_id == patient.id)
    if active_only:
        query = query.filter(Medication.is_active.is_(True))
    return query.order_by(Medication.created_at.desc()).all()


def log_dose(db: Session, user: User, medication_id: int, data: MedicationLogRequest) -> MedicationLog:
    if data.status not in {s.value for s in MedicationLogStatus}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid status")

    med = _get_medication_for_user(db, user, medication_id)
    taken_at = datetime.now(UTC) if data.status == MedicationLogStatus.TAKEN.value else None
    log = MedicationLog(
        medication_id=med.id,
        scheduled_for=data.scheduled_for,
        status=data.status,
        taken_at=taken_at,
        notes=data.notes,
    )
    db.add(log)
    db.commit()
    db.refresh(log)

    if data.status == MedicationLogStatus.MISSED.value and med.patient.user:
        notification_service.send(
            db,
            user=med.patient.user,
            channel=NotificationChannel.EMAIL.value,
            event_type="medication_missed",
            title="Missed medication dose",
            message=f"You missed a dose of {med.name}.",
            metadata={"medication_id": med.id},
        )

    return log


def list_medication_logs(
    db: Session,
    user: User,
    *,
    patient_id: int | None = None,
    medication_id: int | None = None,
    from_date: date | None = None,
    to_date: date | None = None,
    page: int = 1,
    page_size: int = 50,
) -> tuple[list[dict], int]:
    patient = resolve_patient_access(db, user, patient_id)
    query = (
        db.query(MedicationLog)
        .join(Medication)
        .filter(Medication.patient_id == patient.id)
    )
    if medication_id:
        query = query.filter(MedicationLog.medication_id == medication_id)
    if from_date:
        query = query.filter(MedicationLog.scheduled_for >= datetime.combine(from_date, time.min, tzinfo=UTC))
    if to_date:
        query = query.filter(
            MedicationLog.scheduled_for <= datetime.combine(to_date, time.max.replace(microsecond=0), tzinfo=UTC)
        )
    total = query.count()
    logs = (
        query.options(joinedload(MedicationLog.medication))
        .order_by(MedicationLog.scheduled_for.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return [
        {
            "id": log.id,
            "medication_id": log.medication_id,
            "medication_name": log.medication.name,
            "scheduled_for": log.scheduled_for,
            "status": log.status,
            "taken_at": log.taken_at,
            "notes": log.notes,
            "created_at": log.created_at,
        }
        for log in logs
    ], total


def get_due_reminders(db: Session, user: User, *, patient_id: int | None = None) -> list[dict]:
    patient = resolve_patient_access(db, user, patient_id)
    today = datetime.now(UTC).date()
    weekday = today.weekday()
    now = datetime.now(UTC)

    meds = (
        db.query(Medication)
        .options(joinedload(Medication.schedules))
        .filter(Medication.patient_id == patient.id, Medication.is_active.is_(True))
        .all()
    )
    due: list[dict] = []
    for med in meds:
        if med.start_date and med.start_date > today:
            continue
        if med.end_date and med.end_date < today:
            continue
        for sched in med.schedules:
            if not sched.reminder_enabled:
                continue
            days = {int(d.strip()) for d in sched.days_of_week.split(",") if d.strip().isdigit()}
            if weekday not in days:
                continue
            scheduled_for = datetime.combine(today, sched.time_of_day, tzinfo=UTC)
            if scheduled_for > now + timedelta(hours=2):
                continue
            existing = (
                db.query(MedicationLog)
                .filter(
                    MedicationLog.medication_id == med.id,
                    MedicationLog.scheduled_for == scheduled_for,
                )
                .first()
            )
            if existing:
                continue
            due.append(
                {
                    "medication_id": med.id,
                    "medication_name": med.name,
                    "dosage": med.dosage,
                    "scheduled_for": scheduled_for,
                    "schedule_id": sched.id,
                }
            )
    due.sort(key=lambda x: x["scheduled_for"])
    return due


def send_reminder_notifications(db: Session, user: User, *, patient_id: int | None = None) -> int:
    """Send notifications for due doses (call from cron or admin). Returns count sent."""
    patient = resolve_patient_access(db, user, patient_id)
    if not patient.user:
        return 0
    due = get_due_reminders(db, user, patient_id=patient.id)
    sent = 0
    for item in due:
        notification_service.send(
            db,
            user=patient.user,
            channel=NotificationChannel.EMAIL.value,
            event_type="medication_reminder",
            title=f"Medication reminder: {item['medication_name']}",
            message=f"Time to take {item['medication_name']} ({item.get('dosage') or 'see label'}).",
            metadata=item,
        )
        sent += 1
    return sent


def create_vital(db: Session, user: User, data: VitalSignCreateRequest) -> VitalSign:
    try:
        VitalType(data.vital_type)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid vital_type") from exc

    patient = resolve_patient_access(db, user, data.patient_id)
    recorded_at = data.recorded_at or datetime.now(UTC)
    vital = VitalSign(
        patient_id=patient.id,
        vital_type=data.vital_type,
        value=data.value,
        secondary_value=data.secondary_value,
        unit=data.unit or _default_unit(data.vital_type),
        notes=data.notes,
        recorded_at=recorded_at,
    )
    db.add(vital)
    db.commit()
    db.refresh(vital)
    return vital


def _default_unit(vital_type: str) -> str:
    return {
        VitalType.BLOOD_PRESSURE.value: "mmHg",
        VitalType.BLOOD_SUGAR.value: "mg/dL",
        VitalType.WEIGHT.value: "kg",
        VitalType.HEART_RATE.value: "bpm",
        VitalType.OXYGEN.value: "%",
    }.get(vital_type, "")


def list_vitals(
    db: Session,
    user: User,
    *,
    patient_id: int | None = None,
    vital_type: str | None = None,
    from_date: date | None = None,
    to_date: date | None = None,
    page: int = 1,
    page_size: int = 50,
) -> tuple[list[VitalSign], int]:
    patient = resolve_patient_access(db, user, patient_id)
    query = db.query(VitalSign).filter(VitalSign.patient_id == patient.id)
    if vital_type:
        query = query.filter(VitalSign.vital_type == vital_type)
    if from_date:
        query = query.filter(VitalSign.recorded_at >= datetime.combine(from_date, time.min, tzinfo=UTC))
    if to_date:
        query = query.filter(
            VitalSign.recorded_at <= datetime.combine(to_date, time.max.replace(microsecond=0), tzinfo=UTC)
        )
    total = query.count()
    items = (
        query.order_by(VitalSign.recorded_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return items, total


def vital_trends(
    db: Session,
    user: User,
    *,
    patient_id: int | None = None,
    vital_type: str,
    days: int = 30,
) -> dict:
    try:
        VitalType(vital_type)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid vital_type") from exc

    patient = resolve_patient_access(db, user, patient_id)
    since = datetime.now(UTC) - timedelta(days=days)
    vitals = (
        db.query(VitalSign)
        .filter(
            VitalSign.patient_id == patient.id,
            VitalSign.vital_type == vital_type,
            VitalSign.recorded_at >= since,
        )
        .order_by(VitalSign.recorded_at.asc())
        .all()
    )
    unit = vitals[-1].unit if vitals else _default_unit(vital_type)
    return {
        "vital_type": vital_type,
        "unit": unit,
        "points": [
            {
                "recorded_at": v.recorded_at,
                "value": v.value,
                "secondary_value": v.secondary_value,
            }
            for v in vitals
        ],
    }
