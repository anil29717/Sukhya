from datetime import date

from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.models import (
    Appointment,
    AppointmentStatus,
    EmergencyProfile,
    FamilyMember,
    FamilyRelationship,
    MedicalRecord,
    Patient,
    RoleName,
    User,
    generate_medical_id,
)
from app.schemas.family import (
    EmergencyProfileUpdateRequest,
    FamilyMemberCreateRequest,
    FamilyMemberUpdateRequest,
)

ACTIVE_APPOINTMENT_STATUSES = [
    AppointmentStatus.PENDING.value,
    AppointmentStatus.CONFIRMED.value,
]


def patient_display_name(patient: Patient) -> str:
    if patient.user:
        return patient.user.full_name
    return patient.display_name or "Family Member"


def get_guardian_patient(db: Session, user: User) -> Patient:
    patient = (
        db.query(Patient)
        .options(joinedload(Patient.user))
        .filter(Patient.user_id == user.id)
        .first()
    )
    if patient is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient profile not found")
    return patient


def _load_family_member(db: Session, family_member_id: int, guardian: Patient) -> FamilyMember:
    member = (
        db.query(FamilyMember)
        .options(
            joinedload(FamilyMember.dependent_patient),
            joinedload(FamilyMember.guardian_patient),
        )
        .filter(
            FamilyMember.id == family_member_id,
            FamilyMember.guardian_patient_id == guardian.id,
            FamilyMember.is_active.is_(True),
        )
        .first()
    )
    if member is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Family member not found")
    return member


def can_guardian_access_dependent(db: Session, guardian: Patient, dependent_patient_id: int) -> bool:
    if guardian.id == dependent_patient_id:
        return True
    link = (
        db.query(FamilyMember)
        .filter(
            FamilyMember.guardian_patient_id == guardian.id,
            FamilyMember.dependent_patient_id == dependent_patient_id,
            FamilyMember.is_active.is_(True),
            FamilyMember.can_share_records.is_(True),
        )
        .first()
    )
    return link is not None


def resolve_patient_for_booking(
    db: Session, guardian: Patient, family_member_id: int | None
) -> tuple[Patient, FamilyMember | None]:
    if family_member_id is None:
        return guardian, None

    member = _load_family_member(db, family_member_id, guardian)
    return member.dependent_patient, member


def list_family_members(db: Session, guardian: Patient) -> list[FamilyMember]:
    return (
        db.query(FamilyMember)
        .options(joinedload(FamilyMember.dependent_patient))
        .filter(FamilyMember.guardian_patient_id == guardian.id, FamilyMember.is_active.is_(True))
        .order_by(FamilyMember.created_at.desc())
        .all()
    )


def _sync_dependent_profile(patient: Patient, data: FamilyMemberCreateRequest | FamilyMemberUpdateRequest) -> None:
    if hasattr(data, "full_name") and data.full_name is not None:
        patient.display_name = data.full_name
    if data.date_of_birth is not None:
        patient.date_of_birth = data.date_of_birth
    if data.gender is not None:
        patient.gender = data.gender.lower() if isinstance(data.gender, str) else data.gender
    if data.blood_group is not None:
        patient.blood_group = data.blood_group
    if data.allergies is not None:
        patient.allergies = data.allergies
    if hasattr(data, "chronic_diseases") and data.chronic_diseases is not None:
        patient.existing_conditions = data.chronic_diseases
    if data.emergency_contact_name is not None:
        patient.emergency_contact_name = data.emergency_contact_name
    if data.emergency_contact_phone is not None:
        patient.emergency_contact_phone = data.emergency_contact_phone


def _ensure_emergency_profile(db: Session, patient: Patient, data) -> EmergencyProfile:
    profile = db.query(EmergencyProfile).filter(EmergencyProfile.patient_id == patient.id).first()
    if profile is None:
        profile = EmergencyProfile(
            patient_id=patient.id,
            medical_id_number=generate_medical_id(),
            blood_group=patient.blood_group,
            allergies=patient.allergies,
            chronic_diseases=patient.existing_conditions,
            emergency_contact_name=patient.emergency_contact_name,
            emergency_contact_phone=patient.emergency_contact_phone,
        )
        db.add(profile)
    else:
        if patient.blood_group:
            profile.blood_group = patient.blood_group
        if patient.allergies:
            profile.allergies = patient.allergies
        if patient.existing_conditions:
            profile.chronic_diseases = patient.existing_conditions
        if patient.emergency_contact_name:
            profile.emergency_contact_name = patient.emergency_contact_name
        if patient.emergency_contact_phone:
            profile.emergency_contact_phone = patient.emergency_contact_phone
    if hasattr(data, "chronic_diseases") and getattr(data, "chronic_diseases", None):
        profile.chronic_diseases = data.chronic_diseases
    return profile


def create_family_member(db: Session, guardian: Patient, data: FamilyMemberCreateRequest) -> FamilyMember:
    dependent = Patient(
        user_id=None,
        display_name=data.full_name,
        date_of_birth=data.date_of_birth,
        gender=data.gender.lower() if data.gender else None,
        blood_group=data.blood_group,
        allergies=data.allergies,
        existing_conditions=data.chronic_diseases,
        emergency_contact_name=data.emergency_contact_name,
        emergency_contact_phone=data.emergency_contact_phone,
    )
    db.add(dependent)
    db.flush()

    member = FamilyMember(
        guardian_patient_id=guardian.id,
        dependent_patient_id=dependent.id,
        relation_type=data.relationship,
        nickname=data.nickname,
        can_share_records=data.can_share_records,
    )
    db.add(member)
    _ensure_emergency_profile(db, dependent, data)
    db.commit()
    return _load_family_member(db, member.id, guardian)


def update_family_member(
    db: Session, guardian: Patient, family_member_id: int, data: FamilyMemberUpdateRequest
) -> FamilyMember:
    member = _load_family_member(db, family_member_id, guardian)

    if data.relationship is not None:
        try:
            FamilyRelationship(data.relationship.lower())
            member.relation_type = data.relationship.lower()
        except ValueError as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid relationship") from exc
    if data.nickname is not None:
        member.nickname = data.nickname
    if data.can_share_records is not None:
        member.can_share_records = data.can_share_records
    if data.is_active is not None:
        member.is_active = data.is_active

    _sync_dependent_profile(member.dependent_patient, data)
    _ensure_emergency_profile(db, member.dependent_patient, data)
    db.commit()
    return _load_family_member(db, family_member_id, guardian)


def remove_family_member(db: Session, guardian: Patient, family_member_id: int) -> None:
    member = _load_family_member(db, family_member_id, guardian)
    member.is_active = False
    db.commit()


def get_or_create_emergency_profile(db: Session, patient: Patient) -> EmergencyProfile:
    profile = db.query(EmergencyProfile).filter(EmergencyProfile.patient_id == patient.id).first()
    if profile:
        return profile

    profile = EmergencyProfile(
        patient_id=patient.id,
        medical_id_number=generate_medical_id(),
        blood_group=patient.blood_group,
        allergies=patient.allergies,
        chronic_diseases=patient.existing_conditions,
        emergency_contact_name=patient.emergency_contact_name,
        emergency_contact_phone=patient.emergency_contact_phone,
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile


def update_emergency_profile(
    db: Session, guardian: Patient, data: EmergencyProfileUpdateRequest, *, family_member_id: int | None = None
) -> EmergencyProfile:
    if family_member_id:
        member = _load_family_member(db, family_member_id, guardian)
        patient = member.dependent_patient
    else:
        patient = guardian

    profile = get_or_create_emergency_profile(db, patient)

    if data.blood_group is not None:
        profile.blood_group = data.blood_group
        patient.blood_group = data.blood_group
    if data.allergies is not None:
        profile.allergies = data.allergies
        patient.allergies = data.allergies
    if data.chronic_diseases is not None:
        profile.chronic_diseases = data.chronic_diseases
        patient.existing_conditions = data.chronic_diseases
    if data.emergency_contact_name is not None:
        profile.emergency_contact_name = data.emergency_contact_name
        patient.emergency_contact_name = data.emergency_contact_name
    if data.emergency_contact_phone is not None:
        profile.emergency_contact_phone = data.emergency_contact_phone
        patient.emergency_contact_phone = data.emergency_contact_phone
    if data.emergency_contact_relation is not None:
        profile.emergency_contact_relation = data.emergency_contact_relation
    if data.additional_notes is not None:
        profile.additional_notes = data.additional_notes

    db.commit()
    db.refresh(profile)
    return profile


def get_emergency_card(
    db: Session, guardian: Patient, *, family_member_id: int | None = None
) -> dict:
    if family_member_id:
        member = _load_family_member(db, family_member_id, guardian)
        patient = member.dependent_patient
    else:
        patient = guardian

    profile = get_or_create_emergency_profile(db, patient)
    return {
        "medical_id_number": profile.medical_id_number,
        "full_name": patient_display_name(patient),
        "blood_group": profile.blood_group or patient.blood_group,
        "allergies": profile.allergies or patient.allergies,
        "chronic_diseases": profile.chronic_diseases or patient.existing_conditions,
        "emergency_contact_name": profile.emergency_contact_name or patient.emergency_contact_name,
        "emergency_contact_phone": profile.emergency_contact_phone or patient.emergency_contact_phone,
        "emergency_contact_relation": profile.emergency_contact_relation,
        "additional_notes": profile.additional_notes,
    }


def family_dashboard(db: Session, guardian: Patient) -> dict:
    members = list_family_members(db, guardian)
    today = date.today()
    summaries = []
    total_upcoming = 0

    for member in members:
        dep = member.dependent_patient
        upcoming = (
            db.query(Appointment)
            .filter(
                Appointment.patient_id == dep.id,
                Appointment.status.in_(ACTIVE_APPOINTMENT_STATUSES),
                Appointment.appointment_date >= today,
            )
            .count()
        )
        records_count = db.query(MedicalRecord).filter(MedicalRecord.patient_id == dep.id).count()
        has_emergency = (
            db.query(EmergencyProfile).filter(EmergencyProfile.patient_id == dep.id).first() is not None
        )
        total_upcoming += upcoming
        summaries.append(
            {
                "family_member_id": member.id,
                "dependent_patient_id": dep.id,
                "full_name": patient_display_name(dep),
                "relationship": member.relation_type,
                "upcoming_appointments": upcoming,
                "medical_records_count": records_count,
                "has_emergency_profile": has_emergency,
            }
        )

    guardian_upcoming = (
        db.query(Appointment)
        .filter(
            Appointment.patient_id == guardian.id,
            Appointment.status.in_(ACTIVE_APPOINTMENT_STATUSES),
            Appointment.appointment_date >= today,
        )
        .count()
    )
    total_upcoming += guardian_upcoming

    return {
        "guardian_name": patient_display_name(guardian),
        "total_family_members": len(members),
        "total_upcoming_appointments": total_upcoming,
        "members": summaries,
    }


def family_member_to_dict(member: FamilyMember) -> dict:
    dep = member.dependent_patient
    return {
        "id": member.id,
        "guardian_patient_id": member.guardian_patient_id,
        "dependent_patient_id": member.dependent_patient_id,
        "relationship": member.relation_type,
        "nickname": member.nickname,
        "can_share_records": member.can_share_records,
        "is_active": member.is_active,
        "created_at": member.created_at,
        "updated_at": member.updated_at,
        "dependent": {
            "patient_id": dep.id,
            "display_name": patient_display_name(dep),
            "date_of_birth": dep.date_of_birth,
            "gender": dep.gender,
            "blood_group": dep.blood_group,
            "allergies": dep.allergies,
            "chronic_diseases": dep.existing_conditions,
        },
    }


def emergency_profile_to_dict(profile: EmergencyProfile, patient: Patient) -> dict:
    return {
        "id": profile.id,
        "patient_id": profile.patient_id,
        "medical_id_number": profile.medical_id_number,
        "blood_group": profile.blood_group,
        "allergies": profile.allergies,
        "chronic_diseases": profile.chronic_diseases,
        "emergency_contact_name": profile.emergency_contact_name,
        "emergency_contact_phone": profile.emergency_contact_phone,
        "emergency_contact_relation": profile.emergency_contact_relation,
        "additional_notes": profile.additional_notes,
        "display_name": patient_display_name(patient),
        "updated_at": profile.updated_at,
    }
