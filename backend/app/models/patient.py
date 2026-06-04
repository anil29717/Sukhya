from datetime import UTC, date, datetime, time
from enum import Enum

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    Time,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Gender(str, Enum):
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"


class BloodGroup(str, Enum):
    A_POS = "A+"
    A_NEG = "A-"
    B_POS = "B+"
    B_NEG = "B-"
    AB_POS = "AB+"
    AB_NEG = "AB-"
    O_POS = "O+"
    O_NEG = "O-"


class Patient(Base):
    __tablename__ = "patients"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=True
    )
    display_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    date_of_birth: Mapped[date | None] = mapped_column(Date, nullable=True)
    gender: Mapped[str | None] = mapped_column(String(20), nullable=True)
    blood_group: Mapped[str | None] = mapped_column(String(5), nullable=True)
    emergency_contact_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    emergency_contact_phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    allergies: Mapped[str | None] = mapped_column(Text, nullable=True)
    medical_history: Mapped[str | None] = mapped_column(Text, nullable=True)
    existing_conditions: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
        nullable=False,
    )

    user: Mapped["User | None"] = relationship(back_populates="patient_profile")
    appointments: Mapped[list["Appointment"]] = relationship(
        back_populates="patient", cascade="all, delete-orphan"
    )
    medical_records: Mapped[list["MedicalRecord"]] = relationship(
        back_populates="patient", cascade="all, delete-orphan"
    )
    prescriptions: Mapped[list["Prescription"]] = relationship(
        back_populates="patient", cascade="all, delete-orphan"
    )
    managed_family: Mapped[list["FamilyMember"]] = relationship(
        foreign_keys="FamilyMember.guardian_patient_id",
        back_populates="guardian_patient",
        cascade="all, delete-orphan",
    )
    family_member_link: Mapped["FamilyMember | None"] = relationship(
        foreign_keys="FamilyMember.dependent_patient_id",
        back_populates="dependent_patient",
        uselist=False,
    )
    emergency_profile: Mapped["EmergencyProfile | None"] = relationship(
        back_populates="patient", cascade="all, delete-orphan", uselist=False
    )
    medications: Mapped[list["Medication"]] = relationship(
        back_populates="patient", cascade="all, delete-orphan"
    )
    vital_signs: Mapped[list["VitalSign"]] = relationship(
        back_populates="patient", cascade="all, delete-orphan"
    )


class Doctor(Base):
    __tablename__ = "doctors"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    qualification: Mapped[str | None] = mapped_column(String(255), nullable=True)
    specialization: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    experience_years: Mapped[int | None] = mapped_column(Integer, nullable=True)
    consultation_fee: Mapped[float | None] = mapped_column(Float, nullable=True)
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)
    slot_buffer_minutes: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    max_appointments_per_day: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
        nullable=False,
    )

    user: Mapped["User"] = relationship(back_populates="doctor_profile")
    availability_slots: Mapped[list["DoctorAvailability"]] = relationship(
        back_populates="doctor", cascade="all, delete-orphan"
    )
    leaves: Mapped[list["DoctorLeave"]] = relationship(
        back_populates="doctor", cascade="all, delete-orphan"
    )
    appointments: Mapped[list["Appointment"]] = relationship(
        back_populates="doctor", cascade="all, delete-orphan"
    )
    prescriptions: Mapped[list["Prescription"]] = relationship(
        back_populates="doctor", cascade="all, delete-orphan"
    )


class DoctorAvailability(Base):
    __tablename__ = "doctor_availability"

    id: Mapped[int] = mapped_column(primary_key=True)
    doctor_id: Mapped[int] = mapped_column(ForeignKey("doctors.id", ondelete="CASCADE"), nullable=False)
    day_of_week: Mapped[int] = mapped_column(Integer, nullable=False)
    start_time: Mapped[time] = mapped_column(Time, nullable=False)
    end_time: Mapped[time] = mapped_column(Time, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    doctor: Mapped["Doctor"] = relationship(back_populates="availability_slots")

    __table_args__ = (
        UniqueConstraint("doctor_id", "day_of_week", "start_time", name="uq_doctor_day_start"),
    )


class DoctorLeave(Base):
    __tablename__ = "doctor_leaves"

    id: Mapped[int] = mapped_column(primary_key=True)
    doctor_id: Mapped[int] = mapped_column(ForeignKey("doctors.id", ondelete="CASCADE"), nullable=False)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    reason: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )

    doctor: Mapped["Doctor"] = relationship(back_populates="leaves")


from app.models.user import User  # noqa: E402, F401
