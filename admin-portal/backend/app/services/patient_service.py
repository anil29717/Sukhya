from fastapi import HTTPException, status
from sqlalchemy import func, or_
from sqlalchemy.orm import Session, joinedload

from app.models import Doctor, Patient, Role, RoleName, User


def get_patient_by_user_id(db: Session, user_id: int) -> Patient:
    patient = (
        db.query(Patient)
        .options(joinedload(Patient.user).joinedload(User.role))
        .filter(Patient.user_id == user_id)
        .first()
    )
    if patient is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient profile not found")
    return patient


def get_patient_by_id(db: Session, patient_id: int) -> Patient:
    patient = (
        db.query(Patient)
        .options(joinedload(Patient.user).joinedload(User.role))
        .filter(Patient.id == patient_id)
        .first()
    )
    if patient is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")
    return patient


def ensure_patient_role(user: User) -> None:
    if user.role.name != RoleName.PATIENT.value:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Patient role required")


def create_patient_profile(db: Session, user: User) -> Patient:
    existing = db.query(Patient).filter(Patient.user_id == user.id).first()
    if existing:
        return existing

    patient = Patient(user_id=user.id)
    db.add(patient)
    db.commit()
    db.refresh(patient)
    return patient


def update_patient_profile(db: Session, patient: Patient, data) -> Patient:
    if data.date_of_birth is not None:
        patient.date_of_birth = data.date_of_birth
    if data.gender is not None:
        patient.gender = data.gender.lower()
    if data.blood_group is not None:
        patient.blood_group = data.blood_group
    if data.emergency_contact_name is not None:
        patient.emergency_contact_name = data.emergency_contact_name
    if data.emergency_contact_phone is not None:
        patient.emergency_contact_phone = data.emergency_contact_phone

    db.commit()
    db.refresh(patient)
    return patient


def update_patient_medical_info(db: Session, patient: Patient, data) -> Patient:
    if data.allergies is not None:
        patient.allergies = data.allergies
    if data.medical_history is not None:
        patient.medical_history = data.medical_history
    if data.existing_conditions is not None:
        patient.existing_conditions = data.existing_conditions

    db.commit()
    db.refresh(patient)
    return patient


def search_patients(
    db: Session,
    *,
    search: str | None = None,
    gender: str | None = None,
    blood_group: str | None = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[dict], int]:
    query = db.query(Patient).join(User).filter(User.is_active.is_(True))

    if search:
        term = f"%{search.lower()}%"
        query = query.filter(
            or_(
                func.lower(User.full_name).like(term),
                func.lower(User.email).like(term),
                func.lower(User.phone).like(term),
            )
        )

    if gender:
        query = query.filter(Patient.gender == gender.lower())

    if blood_group:
        query = query.filter(Patient.blood_group == blood_group)

    total = query.count()
    patients = (
        query.order_by(User.full_name)
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    items = [
        {
            "id": p.id,
            "user_id": p.user_id,
            "date_of_birth": p.date_of_birth,
            "gender": p.gender,
            "blood_group": p.blood_group,
            "full_name": p.user.full_name,
            "email": p.user.email,
            "phone": p.user.phone,
        }
        for p in patients
    ]
    return items, total
