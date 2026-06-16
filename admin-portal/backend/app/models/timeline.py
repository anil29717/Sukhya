from datetime import UTC, datetime
from enum import Enum

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class TimelineEventType(str, Enum):
    APPOINTMENT = "appointment"
    PRESCRIPTION = "prescription"
    MEDICAL_RECORD = "medical_record"
    DOCTOR_VISIT = "doctor_visit"


class RecordDownloadLog(Base):
    __tablename__ = "record_download_logs"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id", ondelete="CASCADE"), nullable=False, index=True)
    medical_record_id: Mapped[int] = mapped_column(
        ForeignKey("medical_records.id", ondelete="CASCADE"), nullable=False, index=True
    )
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    downloaded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )

    user: Mapped["User | None"] = relationship()
    patient: Mapped["Patient"] = relationship()
    medical_record: Mapped["MedicalRecord"] = relationship()


class HealthTimelineEvent(Base):
    """Cached timeline entry for fast reads; rebuilt from source data."""

    __tablename__ = "health_timeline_events"

    id: Mapped[int] = mapped_column(primary_key=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id", ondelete="CASCADE"), nullable=False, index=True)
    event_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    reference_id: Mapped[int] = mapped_column(Integer, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    event_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )

    patient: Mapped["Patient"] = relationship()


from app.models.medical import MedicalRecord  # noqa: E402, F401
from app.models.patient import Patient  # noqa: E402, F401
from app.models.user import User  # noqa: E402, F401
