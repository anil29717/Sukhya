from datetime import UTC, datetime, timedelta

from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.models import (
    Appointment,
    AppointmentStatus,
    AuditLog,
    Doctor,
    MedicalRecord,
    Notification,
    NotificationStatus,
    Patient,
    Prescription,
    Role,
    RoleName,
    User,
)
from app.schemas.auth import UserResponse
from app.schemas.medical import AdminUserUpdateRequest


def get_analytics(db: Session) -> dict:
    total_patients = db.query(Patient).count()
    total_doctors = db.query(Doctor).join(User).join(Role).filter(Role.name == RoleName.DOCTOR.value).count()
    total_appointments = db.query(Appointment).count()
    total_reports = db.query(MedicalRecord).count()
    total_prescriptions = db.query(Prescription).count()
    pending_doctors = (
        db.query(User)
        .join(Role)
        .filter(Role.name == RoleName.DOCTOR.value, User.is_approved.is_(False), User.is_active.is_(True))
        .count()
    )
    pending_appointments = (
        db.query(Appointment).filter(Appointment.status == AppointmentStatus.PENDING.value).count()
    )
    return {
        "total_patients": total_patients,
        "total_doctors": total_doctors,
        "total_appointments": total_appointments,
        "total_reports": total_reports,
        "total_prescriptions": total_prescriptions,
        "pending_doctors": pending_doctors,
        "pending_appointments": pending_appointments,
    }


def list_users(
    db: Session,
    *,
    role: str | None = None,
    search: str | None = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[User], int]:
    query = db.query(User).options(joinedload(User.role))

    if role:
        query = query.join(Role).filter(Role.name == role.lower())

    if search:
        term = f"%{search.lower()}%"
        query = query.filter(
            func.lower(User.full_name).like(term) | func.lower(User.email).like(term)
        )

    total = query.count()
    users = query.order_by(User.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return users, total


def update_user(db: Session, user_id: int, data: AdminUserUpdateRequest) -> User:
    user = db.query(User).options(joinedload(User.role)).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if data.full_name is not None:
        user.full_name = data.full_name
    if data.phone is not None:
        user.phone = data.phone
    if data.is_active is not None:
        user.is_active = data.is_active
    if data.is_approved is not None:
        user.is_approved = data.is_approved

    db.commit()
    db.refresh(user)
    return user


def list_appointments_admin(
    db: Session,
    *,
    status_filter: str | None = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[Appointment], int]:
    query = db.query(Appointment).options(
        joinedload(Appointment.patient).joinedload(Patient.user),
        joinedload(Appointment.doctor).joinedload(Doctor.user),
    )
    if status_filter:
        query = query.filter(Appointment.status == status_filter)

    total = query.count()
    items = (
        query.order_by(Appointment.appointment_date.desc(), Appointment.start_time.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return items, total


def list_records_admin(
    db: Session,
    *,
    record_type: str | None = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[MedicalRecord], int]:
    query = db.query(MedicalRecord)
    if record_type:
        query = query.filter(MedicalRecord.record_type == record_type)

    total = query.count()
    items = query.order_by(MedicalRecord.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return items, total


def list_audit_logs(
    db: Session,
    *,
    action: str | None = None,
    resource: str | None = None,
    page: int = 1,
    page_size: int = 50,
) -> tuple[list[AuditLog], int]:
    query = db.query(AuditLog)
    if action:
        query = query.filter(AuditLog.action == action)
    if resource:
        query = query.filter(AuditLog.resource == resource)

    total = query.count()
    items = query.order_by(AuditLog.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return items, total


def get_usage_report(db: Session, days: int = 30) -> dict:
    since = datetime.now(UTC) - timedelta(days=days)

    new_patients = db.query(Patient).filter(Patient.created_at >= since).count()
    new_doctors = db.query(Doctor).filter(Doctor.created_at >= since).count()
    appointments_booked = db.query(Appointment).filter(Appointment.created_at >= since).count()
    appointments_completed = (
        db.query(Appointment)
        .filter(Appointment.status == AppointmentStatus.COMPLETED.value, Appointment.updated_at >= since)
        .count()
    )
    records_uploaded = db.query(MedicalRecord).filter(MedicalRecord.created_at >= since).count()
    prescriptions_created = db.query(Prescription).filter(Prescription.created_at >= since).count()
    notifications_sent = (
        db.query(Notification)
        .filter(Notification.status == NotificationStatus.SENT.value, Notification.created_at >= since)
        .count()
    )

    return {
        "period_days": days,
        "new_patients": new_patients,
        "new_doctors": new_doctors,
        "appointments_booked": appointments_booked,
        "appointments_completed": appointments_completed,
        "records_uploaded": records_uploaded,
        "prescriptions_created": prescriptions_created,
        "notifications_sent": notifications_sent,
    }
