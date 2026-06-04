from datetime import date

from fastapi import HTTPException, status
from sqlalchemy import func, or_
from sqlalchemy.orm import Session, joinedload

from app.models import Doctor, DoctorAvailability, DoctorLeave, Role, RoleName, User
from app.schemas.doctor import (
    AvailabilityBulkUpdateRequest,
    DoctorLeaveCreateRequest,
    DoctorProfileUpdateRequest,
)


def get_doctor_by_user_id(db: Session, user_id: int) -> Doctor:
    doctor = (
        db.query(Doctor)
        .options(
            joinedload(Doctor.user).joinedload(User.role),
            joinedload(Doctor.availability_slots),
        )
        .filter(Doctor.user_id == user_id)
        .first()
    )
    if doctor is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor profile not found")
    return doctor


def get_doctor_by_id(db: Session, doctor_id: int, *, approved_only: bool = True) -> Doctor:
    query = (
        db.query(Doctor)
        .options(
            joinedload(Doctor.user).joinedload(User.role),
            joinedload(Doctor.availability_slots),
        )
        .filter(Doctor.id == doctor_id)
    )

    doctor = query.first()
    if doctor is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found")

    if approved_only and (not doctor.user.is_approved or not doctor.user.is_active):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found")

    return doctor


def ensure_doctor_role(user: User) -> None:
    if user.role.name != RoleName.DOCTOR.value:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Doctor role required")


def create_doctor_profile(db: Session, user: User) -> Doctor:
    existing = db.query(Doctor).filter(Doctor.user_id == user.id).first()
    if existing:
        return existing

    doctor = Doctor(user_id=user.id)
    db.add(doctor)
    db.commit()
    db.refresh(doctor)
    return doctor


def update_doctor_profile(db: Session, doctor: Doctor, data: DoctorProfileUpdateRequest) -> Doctor:
    if data.qualification is not None:
        doctor.qualification = data.qualification
    if data.specialization is not None:
        doctor.specialization = data.specialization
    if data.experience_years is not None:
        doctor.experience_years = data.experience_years
    if data.consultation_fee is not None:
        doctor.consultation_fee = data.consultation_fee
    if data.bio is not None:
        doctor.bio = data.bio

    db.commit()
    db.refresh(doctor)
    return doctor


def list_doctors(
    db: Session,
    *,
    search: str | None = None,
    specialization: str | None = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[dict], int]:
    query = (
        db.query(Doctor)
        .join(User)
        .join(Role)
        .filter(
            User.is_active.is_(True),
            User.is_approved.is_(True),
            Role.name == RoleName.DOCTOR.value,
        )
    )

    if search:
        term = f"%{search.lower()}%"
        query = query.filter(
            or_(
                func.lower(User.full_name).like(term),
                func.lower(Doctor.specialization).like(term),
                func.lower(Doctor.qualification).like(term),
            )
        )

    if specialization:
        query = query.filter(func.lower(Doctor.specialization).like(f"%{specialization.lower()}%"))

    total = query.count()
    doctors = (
        query.order_by(User.full_name)
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    items = [
        {
            "id": d.id,
            "user_id": d.user_id,
            "full_name": d.user.full_name,
            "email": d.user.email,
            "phone": d.user.phone,
            "profile_photo_url": d.user.profile_photo_url,
            "qualification": d.qualification,
            "specialization": d.specialization,
            "experience_years": d.experience_years,
            "consultation_fee": d.consultation_fee,
        }
        for d in doctors
    ]
    return items, total


def replace_availability(
    db: Session, doctor: Doctor, data: AvailabilityBulkUpdateRequest
) -> list[DoctorAvailability]:
    db.query(DoctorAvailability).filter(DoctorAvailability.doctor_id == doctor.id).delete()

    slots = []
    for slot_data in data.slots:
        slot = DoctorAvailability(
            doctor_id=doctor.id,
            day_of_week=slot_data.day_of_week,
            start_time=slot_data.start_time,
            end_time=slot_data.end_time,
            is_active=slot_data.is_active,
        )
        db.add(slot)
        slots.append(slot)

    db.commit()
    for slot in slots:
        db.refresh(slot)
    return slots


def get_doctor_availability(db: Session, doctor: Doctor) -> list[DoctorAvailability]:
    return (
        db.query(DoctorAvailability)
        .filter(DoctorAvailability.doctor_id == doctor.id)
        .order_by(DoctorAvailability.day_of_week, DoctorAvailability.start_time)
        .all()
    )


def create_leave(db: Session, doctor: Doctor, data: DoctorLeaveCreateRequest) -> DoctorLeave:
    overlapping = (
        db.query(DoctorLeave)
        .filter(
            DoctorLeave.doctor_id == doctor.id,
            DoctorLeave.start_date <= data.end_date,
            DoctorLeave.end_date >= data.start_date,
        )
        .first()
    )
    if overlapping:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Leave dates overlap with an existing leave",
        )

    leave = DoctorLeave(
        doctor_id=doctor.id,
        start_date=data.start_date,
        end_date=data.end_date,
        reason=data.reason,
    )
    db.add(leave)
    db.commit()
    db.refresh(leave)
    return leave


def list_leaves(db: Session, doctor: Doctor) -> list[DoctorLeave]:
    return (
        db.query(DoctorLeave)
        .filter(DoctorLeave.doctor_id == doctor.id)
        .order_by(DoctorLeave.start_date.desc())
        .all()
    )


def delete_leave(db: Session, doctor: Doctor, leave_id: int) -> None:
    leave = (
        db.query(DoctorLeave)
        .filter(DoctorLeave.id == leave_id, DoctorLeave.doctor_id == doctor.id)
        .first()
    )
    if leave is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Leave not found")

    db.delete(leave)
    db.commit()


def list_pending_doctors(db: Session) -> list[dict]:
    doctors = (
        db.query(User)
        .join(Role)
        .outerjoin(Doctor, Doctor.user_id == User.id)
        .filter(
            Role.name == RoleName.DOCTOR.value,
            User.is_approved.is_(False),
            User.is_active.is_(True),
        )
        .order_by(User.created_at.desc())
        .all()
    )

    results = []
    for user in doctors:
        doctor = db.query(Doctor).filter(Doctor.user_id == user.id).first()
        results.append(
            {
                "user_id": user.id,
                "email": user.email,
                "full_name": user.full_name,
                "phone": user.phone,
                "created_at": user.created_at,
                "doctor_id": doctor.id if doctor else None,
                "specialization": doctor.specialization if doctor else None,
            }
        )
    return results


def approve_doctor(db: Session, user_id: int) -> User:
    user = (
        db.query(User)
        .options(joinedload(User.role))
        .join(Role)
        .filter(User.id == user_id, Role.name == RoleName.DOCTOR.value)
        .first()
    )
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor user not found")

    if user.is_approved:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Doctor already approved")

    user.is_approved = True
    db.commit()
    db.refresh(user)
    return user


def reject_doctor(db: Session, user_id: int) -> User:
    user = (
        db.query(User)
        .options(joinedload(User.role))
        .join(Role)
        .filter(User.id == user_id, Role.name == RoleName.DOCTOR.value)
        .first()
    )
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor user not found")

    user.is_active = False
    user.is_approved = False
    db.commit()
    db.refresh(user)
    return user
