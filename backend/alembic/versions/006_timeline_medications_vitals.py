"""Health timeline, digital locker downloads, medications and vitals

Revision ID: 006
Revises: 005
Create Date: 2026-06-04

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "006"
down_revision: Union[str, None] = "005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "record_download_logs",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=True),
        sa.Column("patient_id", sa.Integer(), nullable=False),
        sa.Column("medical_record_id", sa.Integer(), nullable=False),
        sa.Column("ip_address", sa.String(length=45), nullable=True),
        sa.Column("downloaded_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["medical_record_id"], ["medical_records.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["patient_id"], ["patients.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_record_download_logs_patient_id", "record_download_logs", ["patient_id"])
    op.create_index("ix_record_download_logs_medical_record_id", "record_download_logs", ["medical_record_id"])

    op.create_table(
        "health_timeline_events",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("patient_id", sa.Integer(), nullable=False),
        sa.Column("event_type", sa.String(length=50), nullable=False),
        sa.Column("reference_id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("summary", sa.Text(), nullable=True),
        sa.Column("event_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["patient_id"], ["patients.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_health_timeline_events_patient_id", "health_timeline_events", ["patient_id"])
    op.create_index("ix_health_timeline_events_event_type", "health_timeline_events", ["event_type"])
    op.create_index("ix_health_timeline_events_event_at", "health_timeline_events", ["event_at"])

    op.create_table(
        "medications",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("patient_id", sa.Integer(), nullable=False),
        sa.Column("doctor_id", sa.Integer(), nullable=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("dosage", sa.String(length=100), nullable=True),
        sa.Column("frequency", sa.String(length=100), nullable=True),
        sa.Column("instructions", sa.Text(), nullable=True),
        sa.Column("start_date", sa.Date(), nullable=True),
        sa.Column("end_date", sa.Date(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["doctor_id"], ["doctors.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["patient_id"], ["patients.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_medications_patient_id", "medications", ["patient_id"])

    op.create_table(
        "medication_schedules",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("medication_id", sa.Integer(), nullable=False),
        sa.Column("time_of_day", sa.Time(), nullable=False),
        sa.Column("days_of_week", sa.String(length=20), nullable=False),
        sa.Column("reminder_enabled", sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(["medication_id"], ["medications.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "medication_logs",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("medication_id", sa.Integer(), nullable=False),
        sa.Column("scheduled_for", sa.DateTime(timezone=True), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("taken_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("notes", sa.String(length=500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["medication_id"], ["medications.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_medication_logs_medication_id", "medication_logs", ["medication_id"])

    op.create_table(
        "vital_signs",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("patient_id", sa.Integer(), nullable=False),
        sa.Column("vital_type", sa.String(length=30), nullable=False),
        sa.Column("value", sa.Float(), nullable=False),
        sa.Column("secondary_value", sa.Float(), nullable=True),
        sa.Column("unit", sa.String(length=20), nullable=True),
        sa.Column("notes", sa.String(length=500), nullable=True),
        sa.Column("recorded_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["patient_id"], ["patients.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_vital_signs_patient_id", "vital_signs", ["patient_id"])
    op.create_index("ix_vital_signs_vital_type", "vital_signs", ["vital_type"])
    op.create_index("ix_vital_signs_recorded_at", "vital_signs", ["recorded_at"])


def downgrade() -> None:
    op.drop_table("vital_signs")
    op.drop_table("medication_logs")
    op.drop_table("medication_schedules")
    op.drop_table("medications")
    op.drop_table("health_timeline_events")
    op.drop_table("record_download_logs")
