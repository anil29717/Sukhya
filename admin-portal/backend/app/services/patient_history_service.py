from sqlalchemy.orm import Session, joinedload

from app.models import Appointment, MedicalRecord, Prescription, PrescriptionStatus, User
from app.models.clinical import DoctorNote
from app.services.clinical_access import doctor_can_access_patient, get_doctor_profile
from app.services.family_service import patient_display_name
from app.services import follow_up_service, timeline_service


def get_patient_history(db: Session, user: User, patient_id: int) -> dict:
    doctor = get_doctor_profile(db, user)
    patient = doctor_can_access_patient(db, doctor, patient_id)

    timeline, _ = timeline_service.list_timeline(
        db, user, patient_id=patient_id, page=1, page_size=100
    )

    appointments = (
        db.query(Appointment)
        .filter(Appointment.patient_id == patient_id, Appointment.doctor_id == doctor.id)
        .order_by(Appointment.appointment_date.desc(), Appointment.start_time.desc())
        .limit(50)
        .all()
    )

    records = (
        db.query(MedicalRecord)
        .filter(MedicalRecord.patient_id == patient_id)
        .order_by(MedicalRecord.created_at.desc())
        .limit(50)
        .all()
    )

    prescriptions = (
        db.query(Prescription)
        .filter(
            Prescription.patient_id == patient_id,
            Prescription.doctor_id == doctor.id,
            Prescription.status == PrescriptionStatus.SHARED.value,
        )
        .order_by(Prescription.created_at.desc())
        .limit(50)
        .all()
    )

    notes = (
        db.query(DoctorNote)
        .filter(DoctorNote.patient_id == patient_id, DoctorNote.doctor_id == doctor.id)
        .order_by(DoctorNote.created_at.desc())
        .limit(50)
        .all()
    )

    follow_ups, _ = follow_up_service.list_follow_ups(
        db, user, patient_id=patient_id, page=1, page_size=50
    )

    return {
        "patient_id": patient.id,
        "patient_name": patient_display_name(patient),
        "timeline": timeline,
        "appointments": [
            {
                "id": a.id,
                "appointment_date": a.appointment_date,
                "start_time": a.start_time,
                "status": a.status,
                "reason": a.reason,
            }
            for a in appointments
        ],
        "medical_records": [
            {
                "id": r.id,
                "record_type": r.record_type,
                "title": r.title,
                "created_at": r.created_at,
            }
            for r in records
        ],
        "prescriptions": [
            {
                "id": p.id,
                "diagnosis": p.diagnosis,
                "status": p.status,
                "created_at": p.created_at,
            }
            for p in prescriptions
        ],
        "doctor_notes": [
            {
                "id": n.id,
                "note_type": n.note_type,
                "title": n.title,
                "content": n.content,
                "appointment_id": n.appointment_id,
                "created_at": n.created_at,
            }
            for n in notes
        ],
        "follow_ups": follow_ups,
    }
