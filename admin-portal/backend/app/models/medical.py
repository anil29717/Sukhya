from datetime import UTC, datetime
from enum import Enum

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class RecordType(str, Enum):
    PRESCRIPTION = "prescription"
    DIAGNOSTIC_REPORT = "diagnostic_report"
    LAB_REPORT = "lab_report"
    XRAY = "xray"
    MRI = "mri"
    CTSCAN = "ctscan"


RECORD_TYPE_FOLDERS = {
    RecordType.PRESCRIPTION.value: "prescriptions",
    RecordType.DIAGNOSTIC_REPORT.value: "reports",
    RecordType.LAB_REPORT.value: "reports",
    RecordType.XRAY.value: "xray",
    RecordType.MRI.value: "mri",
    RecordType.CTSCAN.value: "ctscan",
}

ALLOWED_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png", ".docx"}
ALLOWED_MIME_TYPES = {
    "application/pdf",
    "image/jpeg",
    "image/png",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}


class MedicalRecord(Base):
    __tablename__ = "medical_records"

    id: Mapped[int] = mapped_column(primary_key=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id", ondelete="CASCADE"), nullable=False, index=True)
    uploaded_by_user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    appointment_id: Mapped[int | None] = mapped_column(ForeignKey("appointments.id", ondelete="SET NULL"), nullable=True)
    record_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    storage_key: Mapped[str] = mapped_column(String(500), nullable=False, unique=True)
    file_size: Mapped[int] = mapped_column(Integer, nullable=False)
    mime_type: Mapped[str] = mapped_column(String(100), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
        nullable=False,
    )

    patient: Mapped["Patient"] = relationship(back_populates="medical_records")
    uploaded_by: Mapped["User"] = relationship()
    appointment: Mapped["Appointment | None"] = relationship()


class PrescriptionStatus(str, Enum):
    DRAFT = "draft"
    SHARED = "shared"


class Prescription(Base):
    __tablename__ = "prescriptions"

    id: Mapped[int] = mapped_column(primary_key=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id", ondelete="CASCADE"), nullable=False, index=True)
    doctor_id: Mapped[int] = mapped_column(ForeignKey("doctors.id", ondelete="CASCADE"), nullable=False, index=True)
    appointment_id: Mapped[int | None] = mapped_column(ForeignKey("appointments.id", ondelete="SET NULL"), nullable=True)
    diagnosis: Mapped[str | None] = mapped_column(String(500), nullable=True)
    medications: Mapped[str | None] = mapped_column(Text, nullable=True)
    instructions: Mapped[str | None] = mapped_column(Text, nullable=True)
    document_record_id: Mapped[int | None] = mapped_column(
        ForeignKey("medical_records.id", ondelete="SET NULL"), nullable=True
    )
    status: Mapped[str] = mapped_column(String(20), default=PrescriptionStatus.DRAFT.value, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
        nullable=False,
    )

    patient: Mapped["Patient"] = relationship(back_populates="prescriptions")
    doctor: Mapped["Doctor"] = relationship(back_populates="prescriptions")
    appointment: Mapped["Appointment | None"] = relationship()
    document_record: Mapped["MedicalRecord | None"] = relationship()


class NotificationChannel(str, Enum):
    EMAIL = "email"
    WHATSAPP = "whatsapp"


class NotificationStatus(str, Enum):
    PENDING = "pending"
    SENT = "sent"
    FAILED = "failed"


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    channel: Mapped[str] = mapped_column(String(20), nullable=False)
    event_type: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default=NotificationStatus.PENDING.value, nullable=False)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    metadata_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )

    user: Mapped["User"] = relationship()


from app.models.appointment import Appointment  # noqa: E402, F401
from app.models.patient import Doctor, Patient  # noqa: E402, F401
from app.models.user import User  # noqa: E402, F401
