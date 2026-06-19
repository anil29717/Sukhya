from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import hash_password
from app.models import Role, RoleName, User

settings = get_settings()

DEFAULT_ROLES = [RoleName.ADMIN, RoleName.DOCTOR, RoleName.PATIENT]


def seed_roles(db: Session) -> None:
    for role_name in DEFAULT_ROLES:
        exists = db.query(Role).filter(Role.name == role_name.value).first()
        if not exists:
            db.add(Role(name=role_name.value))
    db.commit()


def seed_default_admin(db: Session) -> None:
    legacy_admin = db.query(User).filter(User.email == "admin@healthcare.local").first()
    if legacy_admin:
        legacy_admin.email = settings.DEFAULT_ADMIN_EMAIL.lower()
        db.commit()

    admin_role = db.query(Role).filter(Role.name == RoleName.ADMIN.value).first()
    if admin_role is None:
        return

    existing_admin = (
        db.query(User).join(Role).filter(Role.name == RoleName.ADMIN.value).first()
    )
    if existing_admin:
        return

    admin = User(
        email=settings.DEFAULT_ADMIN_EMAIL.lower(),
        hashed_password=hash_password(settings.DEFAULT_ADMIN_PASSWORD),
        full_name=settings.DEFAULT_ADMIN_FULL_NAME,
        role_id=admin_role.id,
        is_active=True,
        is_approved=True,
        language_preference="en",
    )
    db.add(admin)
    db.commit()


def backfill_role_profiles(db: Session) -> None:
    from app.services import doctor_service, patient_service

    patients = (
        db.query(User)
        .join(Role)
        .filter(Role.name == RoleName.PATIENT.value)
        .all()
    )
    for user in patients:
        patient_service.create_patient_profile(db, user)

    doctors = (
        db.query(User)
        .join(Role)
        .filter(Role.name == RoleName.DOCTOR.value)
        .all()
    )
    for user in doctors:
        doctor_service.create_doctor_profile(db, user)


def backfill_emergency_profiles(db: Session) -> None:
    from app.models import EmergencyProfile, Patient, generate_medical_id

    patients = db.query(Patient).all()
    for patient in patients:
        exists = db.query(EmergencyProfile).filter(EmergencyProfile.patient_id == patient.id).first()
        if exists:
            continue
        if patient.user:
            patient.display_name = patient.user.full_name
        db.add(
            EmergencyProfile(
                patient_id=patient.id,
                medical_id_number=generate_medical_id(),
                blood_group=patient.blood_group,
                allergies=patient.allergies,
                chronic_diseases=patient.existing_conditions,
                emergency_contact_name=patient.emergency_contact_name,
                emergency_contact_phone=patient.emergency_contact_phone,
            )
        )
    db.commit()
