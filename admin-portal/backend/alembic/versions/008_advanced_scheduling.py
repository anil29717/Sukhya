"""Advanced scheduling: buffer, waitlist, recurring

Revision ID: 008
Revises: 007
Create Date: 2026-06-04

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "008"
down_revision: Union[str, None] = "007"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("doctors", schema=None) as batch_op:
        batch_op.add_column(sa.Column("slot_buffer_minutes", sa.Integer(), nullable=False, server_default="0"))
        batch_op.add_column(sa.Column("max_appointments_per_day", sa.Integer(), nullable=True))

    op.create_table(
        "recurring_appointments",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("patient_id", sa.Integer(), nullable=False),
        sa.Column("doctor_id", sa.Integer(), nullable=False),
        sa.Column("booked_by_user_id", sa.Integer(), nullable=True),
        sa.Column("family_member_id", sa.Integer(), nullable=True),
        sa.Column("recurrence_pattern", sa.String(length=20), nullable=False),
        sa.Column("day_of_week", sa.Integer(), nullable=False),
        sa.Column("preferred_start_time", sa.Time(), nullable=False),
        sa.Column("start_date", sa.Date(), nullable=False),
        sa.Column("end_date", sa.Date(), nullable=True),
        sa.Column("reason", sa.String(length=500), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("last_generated_date", sa.Date(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["booked_by_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["doctor_id"], ["doctors.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["family_member_id"], ["family_members.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["patient_id"], ["patients.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_recurring_appointments_patient_id", "recurring_appointments", ["patient_id"])
    op.create_index("ix_recurring_appointments_doctor_id", "recurring_appointments", ["doctor_id"])

    op.create_table(
        "appointment_waitlist",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("patient_id", sa.Integer(), nullable=False),
        sa.Column("doctor_id", sa.Integer(), nullable=False),
        sa.Column("booked_by_user_id", sa.Integer(), nullable=True),
        sa.Column("desired_date", sa.Date(), nullable=False),
        sa.Column("preferred_start_time", sa.Time(), nullable=True),
        sa.Column("reason", sa.String(length=500), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("booked_appointment_id", sa.Integer(), nullable=True),
        sa.Column("offered_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["booked_appointment_id"], ["appointments.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["booked_by_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["doctor_id"], ["doctors.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["patient_id"], ["patients.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_appointment_waitlist_patient_id", "appointment_waitlist", ["patient_id"])
    op.create_index("ix_appointment_waitlist_doctor_id", "appointment_waitlist", ["doctor_id"])
    op.create_index("ix_appointment_waitlist_desired_date", "appointment_waitlist", ["desired_date"])
    op.create_index("ix_appointment_waitlist_status", "appointment_waitlist", ["status"])

    with op.batch_alter_table("appointments", schema=None) as batch_op:
        batch_op.add_column(sa.Column("recurring_appointment_id", sa.Integer(), nullable=True))
        batch_op.create_foreign_key(
            "fk_appointments_recurring",
            "recurring_appointments",
            ["recurring_appointment_id"],
            ["id"],
            ondelete="SET NULL",
        )
        batch_op.create_index("ix_appointments_recurring_appointment_id", ["recurring_appointment_id"])


def downgrade() -> None:
    with op.batch_alter_table("appointments", schema=None) as batch_op:
        batch_op.drop_index("ix_appointments_recurring_appointment_id")
        batch_op.drop_constraint("fk_appointments_recurring", type_="foreignkey")
        batch_op.drop_column("recurring_appointment_id")

    op.drop_table("appointment_waitlist")
    op.drop_table("recurring_appointments")

    with op.batch_alter_table("doctors", schema=None) as batch_op:
        batch_op.drop_column("max_appointments_per_day")
        batch_op.drop_column("slot_buffer_minutes")
