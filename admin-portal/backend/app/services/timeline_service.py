from datetime import UTC, date, datetime, time

from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.models import (
    Appointment,
    AppointmentStatus,
    Doctor,
    HealthTimelineEvent,
    MedicalRecord,
    Prescription,
    PrescriptionStatus,
    RoleName,
    User,
)
from app.models.timeline import TimelineEventType
from app.models.patient import Patient
from app.services.family_service import can_guardian_access_dependent, get_guardian_patient


def resolve_patient_access(db: Session, user: User, patient_id: int | None) -> Patient:
    if user.role.name == RoleName.PATIENT.value:
        guardian = get_guardian_patient(db, user)
        if patient_id is None:
            return guardian
        if patient_id == guardian.id:
            return guardian
        if can_guardian_access_dependent(db, guardian, patient_id):
            patient = db.query(Patient).filter(Patient.id == patient_id).first()
            if patient:
                return patient
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    if user.role.name == RoleName.DOCTOR.value:
        from app.models import Doctor

        if patient_id is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="patient_id required")
        patient = db.query(Patient).filter(Patient.id == patient_id).first()
        if patient is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")
        doctor = db.query(Doctor).filter(Doctor.user_id == user.id).first()
        if doctor:
            from app.models import Appointment as Appt

            has = (
                db.query(Appt)
                .filter(Appt.patient_id == patient_id, Appt.doctor_id == doctor.id)
                .first()
            )
            if not has:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        return patient

    if user.role.name == RoleName.ADMIN.value:
        if patient_id is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="patient_id required")
        patient = db.query(Patient).filter(Patient.id == patient_id).first()
        if patient is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")
        return patient

    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")


def _appointment_event_at(appt: Appointment) -> datetime:
    return datetime.combine(appt.appointment_date, appt.start_time, tzinfo=UTC)


def build_timeline_events(
    db: Session,
    patient: Patient,
    *,
    event_type: str | None = None,
    from_date: date | None = None,
    to_date: date | None = None,
) -> list[dict]:
    events: list[dict] = []

    if event_type in (None, TimelineEventType.APPOINTMENT.value, TimelineEventType.DOCTOR_VISIT.value):
        appointments = (
            db.query(Appointment)
            .options(joinedload(Appointment.doctor).joinedload(Doctor.user))
            .filter(Appointment.patient_id == patient.id)
            .all()
        )
        for appt in appointments:
            at = _appointment_event_at(appt)
            if from_date and appt.appointment_date < from_date:
                continue
            if to_date and appt.appointment_date > to_date:
                continue
            doctor_name = appt.doctor.user.full_name if appt.doctor and appt.doctor.user else "Doctor"
            if appt.status == AppointmentStatus.COMPLETED.value:
                et = TimelineEventType.DOCTOR_VISIT.value
                title = f"Visit with Dr. {doctor_name}"
            else:
                et = TimelineEventType.APPOINTMENT.value
                title = f"Appointment — {appt.status}"
            if event_type and event_type != et and event_type != TimelineEventType.APPOINTMENT.value:
                if event_type == TimelineEventType.DOCTOR_VISIT.value and et != TimelineEventType.DOCTOR_VISIT.value:
                    continue
                if event_type == TimelineEventType.APPOINTMENT.value and et == TimelineEventType.DOCTOR_VISIT.value:
                    continue
            events.append(
                {
                    "event_type": et,
                    "reference_id": appt.id,
                    "title": title,
                    "summary": appt.reason,
                    "event_at": at,
                    "patient_id": patient.id,
                    "extra": {"status": appt.status, "doctor_id": appt.doctor_id},
                }
            )

    if event_type in (None, TimelineEventType.PRESCRIPTION.value):
        prescriptions = (
            db.query(Prescription)
            .options(joinedload(Prescription.doctor).joinedload(Doctor.user))
            .filter(
                Prescription.patient_id == patient.id,
                Prescription.status == PrescriptionStatus.SHARED.value,
            )
            .all()
        )
        for rx in prescriptions:
            at = rx.created_at
            if from_date and at.date() < from_date:
                continue
            if to_date and at.date() > to_date:
                continue
            doctor_name = rx.doctor.user.full_name if rx.doctor and rx.doctor.user else "Doctor"
            events.append(
                {
                    "event_type": TimelineEventType.PRESCRIPTION.value,
                    "reference_id": rx.id,
                    "title": f"Prescription from Dr. {doctor_name}",
                    "summary": rx.diagnosis,
                    "event_at": at,
                    "patient_id": patient.id,
                    "extra": {"status": rx.status},
                }
            )

    if event_type in (None, TimelineEventType.MEDICAL_RECORD.value):
        records = db.query(MedicalRecord).filter(MedicalRecord.patient_id == patient.id).all()
        for rec in records:
            at = rec.created_at
            if from_date and at.date() < from_date:
                continue
            if to_date and at.date() > to_date:
                continue
            events.append(
                {
                    "event_type": TimelineEventType.MEDICAL_RECORD.value,
                    "reference_id": rec.id,
                    "title": rec.title,
                    "summary": rec.description,
                    "event_at": at,
                    "patient_id": patient.id,
                    "extra": {"record_type": rec.record_type},
                }
            )

    events.sort(key=lambda e: e["event_at"], reverse=True)
    return events


def sync_timeline_cache(db: Session, patient_id: int) -> int:
    db.query(HealthTimelineEvent).filter(HealthTimelineEvent.patient_id == patient_id).delete()
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        return 0
    events = build_timeline_events(db, patient)
    for ev in events:
        db.add(
            HealthTimelineEvent(
                patient_id=patient_id,
                event_type=ev["event_type"],
                reference_id=ev["reference_id"],
                title=ev["title"],
                summary=ev["summary"],
                event_at=ev["event_at"],
            )
        )
    db.commit()
    return len(events)


def list_timeline(
    db: Session,
    user: User,
    *,
    patient_id: int | None = None,
    event_type: str | None = None,
    from_date: date | None = None,
    to_date: date | None = None,
    page: int = 1,
    page_size: int = 50,
) -> tuple[list[dict], int]:
    patient = resolve_patient_access(db, user, patient_id)
    events = build_timeline_events(
        db, patient, event_type=event_type, from_date=from_date, to_date=to_date
    )
    total = len(events)
    start = (page - 1) * page_size
    return events[start : start + page_size], total
