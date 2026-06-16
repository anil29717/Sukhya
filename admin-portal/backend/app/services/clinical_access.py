from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models import Appointment, Doctor, RoleName, User
from app.models.patient import Patient


def get_doctor_profile(db: Session, user: User) -> Doctor:
    if user.role.name != RoleName.DOCTOR.value:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Doctor access only")
    doctor = db.query(Doctor).filter(Doctor.user_id == user.id).first()
    if doctor is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor profile not found")
    return doctor


def doctor_can_access_patient(db: Session, doctor: Doctor, patient_id: int) -> Patient:
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if patient is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")
    has = (
        db.query(Appointment)
        .filter(Appointment.patient_id == patient_id, Appointment.doctor_id == doctor.id)
        .first()
    )
    if not has:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No consultation history with this patient",
        )
    return patient


def validate_appointment_for_doctor(
    db: Session, doctor: Doctor, appointment_id: int | None, patient_id: int
) -> None:
    if appointment_id is None:
        return
    appt = (
        db.query(Appointment)
        .filter(
            Appointment.id == appointment_id,
            Appointment.doctor_id == doctor.id,
            Appointment.patient_id == patient_id,
        )
        .first()
    )
    if appt is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid appointment for this patient")
