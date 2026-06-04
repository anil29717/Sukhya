from datetime import UTC, date, datetime, time
from enum import Enum

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, String, Text, Time
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class RecurrencePattern(str, Enum):
    WEEKLY = "weekly"
    BIWEEKLY = "biweekly"
    MONTHLY = "monthly"


class WaitlistStatus(str, Enum):
    WAITING = "waiting"
    OFFERED = "offered"
    BOOKED = "booked"
    CANCELLED = "cancelled"


class RecurringAppointment(Base):
    __tablename__ = "recurring_appointments"

    id: Mapped[int] = mapped_column(primary_key=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id", ondelete="CASCADE"), nullable=False, index=True)
    doctor_id: Mapped[int] = mapped_column(ForeignKey("doctors.id", ondelete="CASCADE"), nullable=False, index=True)
    booked_by_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    family_member_id: Mapped[int | None] = mapped_column(
        ForeignKey("family_members.id", ondelete="SET NULL"), nullable=True
    )
    recurrence_pattern: Mapped[str] = mapped_column(String(20), nullable=False)
    day_of_week: Mapped[int] = mapped_column(Integer, nullable=False)
    preferred_start_time: Mapped[time] = mapped_column(Time, nullable=False)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    reason: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    last_generated_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
        nullable=False,
    )

    patient: Mapped["Patient"] = relationship()
    doctor: Mapped["Doctor"] = relationship()
    generated_appointments: Mapped[list["Appointment"]] = relationship(
        back_populates="recurring_series", foreign_keys="Appointment.recurring_appointment_id"
    )


class AppointmentWaitlist(Base):
    __tablename__ = "appointment_waitlist"

    id: Mapped[int] = mapped_column(primary_key=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id", ondelete="CASCADE"), nullable=False, index=True)
    doctor_id: Mapped[int] = mapped_column(ForeignKey("doctors.id", ondelete="CASCADE"), nullable=False, index=True)
    booked_by_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    desired_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    preferred_start_time: Mapped[time | None] = mapped_column(Time, nullable=True)
    reason: Mapped[str | None] = mapped_column(String(500), nullable=True)
    status: Mapped[str] = mapped_column(
        String(20), default=WaitlistStatus.WAITING.value, nullable=False, index=True
    )
    position: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    booked_appointment_id: Mapped[int | None] = mapped_column(
        ForeignKey("appointments.id", ondelete="SET NULL"), nullable=True
    )
    offered_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )

    patient: Mapped["Patient"] = relationship()
    doctor: Mapped["Doctor"] = relationship()
    booked_appointment: Mapped["Appointment | None"] = relationship(
        foreign_keys=[booked_appointment_id]
    )


from app.models.family import FamilyMember  # noqa: E402, F401
from app.models.patient import Doctor, Patient  # noqa: E402, F401
from app.models.user import User  # noqa: E402, F401
