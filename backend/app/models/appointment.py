from datetime import UTC, date, datetime, time
from enum import Enum

from sqlalchemy import Date, DateTime, ForeignKey, String, Text, Time, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class AppointmentStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class Appointment(Base):
    __tablename__ = "appointments"

    id: Mapped[int] = mapped_column(primary_key=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id", ondelete="CASCADE"), nullable=False, index=True)
    doctor_id: Mapped[int] = mapped_column(ForeignKey("doctors.id", ondelete="CASCADE"), nullable=False, index=True)
    booked_by_user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    family_member_id: Mapped[int | None] = mapped_column(
        ForeignKey("family_members.id", ondelete="SET NULL"), nullable=True, index=True
    )
    recurring_appointment_id: Mapped[int | None] = mapped_column(
        ForeignKey("recurring_appointments.id", ondelete="SET NULL"), nullable=True, index=True
    )
    appointment_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    start_time: Mapped[time] = mapped_column(Time, nullable=False)
    end_time: Mapped[time] = mapped_column(Time, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default=AppointmentStatus.PENDING.value, nullable=False, index=True)
    reason: Mapped[str | None] = mapped_column(String(500), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    cancellation_reason: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
        nullable=False,
    )

    patient: Mapped["Patient"] = relationship(back_populates="appointments")
    doctor: Mapped["Doctor"] = relationship(back_populates="appointments")
    booked_by: Mapped["User | None"] = relationship(foreign_keys=[booked_by_user_id])
    family_member: Mapped["FamilyMember | None"] = relationship()
    recurring_series: Mapped["RecurringAppointment | None"] = relationship(
        back_populates="generated_appointments"
    )

    __table_args__ = (
        UniqueConstraint(
            "doctor_id", "appointment_date", "start_time", name="uq_doctor_date_start"
        ),
    )


from app.models.family import FamilyMember  # noqa: E402, F401
from app.models.scheduling import RecurringAppointment  # noqa: E402, F401
from app.models.patient import Doctor, Patient  # noqa: E402, F401
from app.models.user import User  # noqa: E402, F401
