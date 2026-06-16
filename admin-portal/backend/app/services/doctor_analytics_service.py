from datetime import UTC, date, datetime, timedelta

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models import Appointment, AppointmentStatus, User
from app.models.clinical import FollowUp
from app.models.clinical import FollowUpStatus
from app.services.clinical_access import get_doctor_profile


def get_doctor_analytics(db: Session, user: User, *, days: int = 30) -> dict:
    doctor = get_doctor_profile(db, user)
    today = date.today()
    month_start = today.replace(day=1)

    patient_ids = (
        db.query(Appointment.patient_id)
        .filter(Appointment.doctor_id == doctor.id)
        .distinct()
        .all()
    )
    unique_patients = {row[0] for row in patient_ids}

    new_this_month = (
        db.query(func.count(func.distinct(Appointment.patient_id)))
        .filter(
            Appointment.doctor_id == doctor.id,
            Appointment.created_at >= datetime.combine(month_start, datetime.min.time(), tzinfo=UTC),
        )
        .scalar()
        or 0
    )

    appointments_today = (
        db.query(Appointment)
        .filter(
            Appointment.doctor_id == doctor.id,
            Appointment.appointment_date == today,
            Appointment.status.in_(
                [AppointmentStatus.PENDING.value, AppointmentStatus.CONFIRMED.value]
            ),
        )
        .count()
    )

    appointments_this_month = (
        db.query(Appointment)
        .filter(
            Appointment.doctor_id == doctor.id,
            Appointment.appointment_date >= month_start,
            Appointment.appointment_date <= today,
        )
        .count()
    )

    completed = (
        db.query(Appointment)
        .filter(
            Appointment.doctor_id == doctor.id,
            Appointment.status == AppointmentStatus.COMPLETED.value,
        )
        .count()
    )

    cancelled = (
        db.query(Appointment)
        .filter(
            Appointment.doctor_id == doctor.id,
            Appointment.status == AppointmentStatus.CANCELLED.value,
        )
        .count()
    )

    pending_follow_ups = (
        db.query(FollowUp)
        .filter(
            FollowUp.doctor_id == doctor.id,
            FollowUp.status == FollowUpStatus.SCHEDULED.value,
            FollowUp.scheduled_date >= today,
        )
        .count()
    )

    start = today - timedelta(days=days - 1)
    daily_stats = []
    for i in range(days):
        d = start + timedelta(days=i)
        day_appts = (
            db.query(Appointment)
            .filter(Appointment.doctor_id == doctor.id, Appointment.appointment_date == d)
            .all()
        )
        daily_stats.append(
            {
                "date": d,
                "total": len(day_appts),
                "completed": sum(1 for a in day_appts if a.status == AppointmentStatus.COMPLETED.value),
                "cancelled": sum(1 for a in day_appts if a.status == AppointmentStatus.CANCELLED.value),
            }
        )

    total_finished = completed + cancelled
    completion_rate = round(completed / total_finished * 100, 1) if total_finished else 0.0

    return {
        "doctor_id": doctor.id,
        "total_patients": len(unique_patients),
        "new_patients_this_month": new_this_month,
        "appointments_today": appointments_today,
        "appointments_this_month": appointments_this_month,
        "completed_consultations": completed,
        "cancelled_appointments": cancelled,
        "pending_follow_ups": pending_follow_ups,
        "daily_appointments": daily_stats,
        "consultation_completion_rate": completion_rate,
    }
