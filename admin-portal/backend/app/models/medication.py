from datetime import UTC, date, datetime, time
from enum import Enum

from sqlalchemy import Boolean, Date, DateTime, Float, ForeignKey, Integer, String, Text, Time
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class VitalType(str, Enum):
    BLOOD_PRESSURE = "blood_pressure"
    BLOOD_SUGAR = "blood_sugar"
    WEIGHT = "weight"
    HEART_RATE = "heart_rate"
    OXYGEN = "oxygen"


class MedicationLogStatus(str, Enum):
    TAKEN = "taken"
    MISSED = "missed"
    SKIPPED = "skipped"


class Medication(Base):
    __tablename__ = "medications"

    id: Mapped[int] = mapped_column(primary_key=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id", ondelete="CASCADE"), nullable=False, index=True)
    doctor_id: Mapped[int | None] = mapped_column(ForeignKey("doctors.id", ondelete="SET NULL"), nullable=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    dosage: Mapped[str | None] = mapped_column(String(100), nullable=True)
    frequency: Mapped[str | None] = mapped_column(String(100), nullable=True)
    instructions: Mapped[str | None] = mapped_column(Text, nullable=True)
    start_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
        nullable=False,
    )

    patient: Mapped["Patient"] = relationship(back_populates="medications")
    doctor: Mapped["Doctor | None"] = relationship()
    schedules: Mapped[list["MedicationSchedule"]] = relationship(
        back_populates="medication", cascade="all, delete-orphan"
    )
    logs: Mapped[list["MedicationLog"]] = relationship(
        back_populates="medication", cascade="all, delete-orphan"
    )


class MedicationSchedule(Base):
    __tablename__ = "medication_schedules"

    id: Mapped[int] = mapped_column(primary_key=True)
    medication_id: Mapped[int] = mapped_column(ForeignKey("medications.id", ondelete="CASCADE"), nullable=False)
    time_of_day: Mapped[time] = mapped_column(Time, nullable=False)
    days_of_week: Mapped[str] = mapped_column(String(20), default="0,1,2,3,4,5,6", nullable=False)
    reminder_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    medication: Mapped["Medication"] = relationship(back_populates="schedules")


class MedicationLog(Base):
    __tablename__ = "medication_logs"

    id: Mapped[int] = mapped_column(primary_key=True)
    medication_id: Mapped[int] = mapped_column(ForeignKey("medications.id", ondelete="CASCADE"), nullable=False, index=True)
    scheduled_for: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False)
    taken_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    notes: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )

    medication: Mapped["Medication"] = relationship(back_populates="logs")


class VitalSign(Base):
    __tablename__ = "vital_signs"

    id: Mapped[int] = mapped_column(primary_key=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id", ondelete="CASCADE"), nullable=False, index=True)
    vital_type: Mapped[str] = mapped_column(String(30), nullable=False, index=True)
    value: Mapped[float] = mapped_column(Float, nullable=False)
    secondary_value: Mapped[float | None] = mapped_column(Float, nullable=True)
    unit: Mapped[str | None] = mapped_column(String(20), nullable=True)
    notes: Mapped[str | None] = mapped_column(String(500), nullable=True)
    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )

    patient: Mapped["Patient"] = relationship(back_populates="vital_signs")


from app.models.patient import Doctor, Patient  # noqa: E402, F401
