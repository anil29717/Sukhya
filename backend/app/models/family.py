import secrets
import string
from datetime import UTC, date, datetime
from enum import Enum

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class FamilyRelationship(str, Enum):
    PARENT = "parent"
    CHILD = "child"
    SPOUSE = "spouse"
    SIBLING = "sibling"
    OTHER = "other"


def generate_medical_id() -> str:
    alphabet = string.ascii_uppercase + string.digits
    return "HID-" + "".join(secrets.choice(alphabet) for _ in range(8))


class FamilyMember(Base):
    """Links a guardian patient account to a dependent's patient profile."""

    __tablename__ = "family_members"

    id: Mapped[int] = mapped_column(primary_key=True)
    guardian_patient_id: Mapped[int] = mapped_column(
        ForeignKey("patients.id", ondelete="CASCADE"), nullable=False, index=True
    )
    dependent_patient_id: Mapped[int] = mapped_column(
        ForeignKey("patients.id", ondelete="CASCADE"), nullable=False, unique=True
    )
    relation_type: Mapped[str] = mapped_column(String(30), nullable=False)
    nickname: Mapped[str | None] = mapped_column(String(100), nullable=True)
    can_share_records: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
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

    guardian_patient: Mapped["Patient"] = relationship(
        foreign_keys=[guardian_patient_id], back_populates="managed_family"
    )
    dependent_patient: Mapped["Patient"] = relationship(
        foreign_keys=[dependent_patient_id], back_populates="family_member_link"
    )

    __table_args__ = (
        UniqueConstraint("guardian_patient_id", "dependent_patient_id", name="uq_guardian_dependent"),
    )


class EmergencyProfile(Base):
    __tablename__ = "emergency_profiles"

    id: Mapped[int] = mapped_column(primary_key=True)
    patient_id: Mapped[int] = mapped_column(
        ForeignKey("patients.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    medical_id_number: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, index=True)
    blood_group: Mapped[str | None] = mapped_column(String(5), nullable=True)
    allergies: Mapped[str | None] = mapped_column(Text, nullable=True)
    chronic_diseases: Mapped[str | None] = mapped_column(Text, nullable=True)
    emergency_contact_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    emergency_contact_phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    emergency_contact_relation: Mapped[str | None] = mapped_column(String(50), nullable=True)
    additional_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
        nullable=False,
    )

    patient: Mapped["Patient"] = relationship(back_populates="emergency_profile")


from app.models.patient import Patient  # noqa: E402, F401
