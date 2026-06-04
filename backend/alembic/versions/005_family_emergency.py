"""Family health and emergency profiles

Revision ID: 005
Revises: 004
Create Date: 2026-06-04

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "005"
down_revision: Union[str, None] = "004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("patients", schema=None) as batch_op:
        batch_op.add_column(sa.Column("display_name", sa.String(length=255), nullable=True))
        batch_op.alter_column("user_id", existing_type=sa.Integer(), nullable=True)

    op.create_table(
        "family_members",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("guardian_patient_id", sa.Integer(), nullable=False),
        sa.Column("dependent_patient_id", sa.Integer(), nullable=False),
        sa.Column("relation_type", sa.String(length=30), nullable=False),
        sa.Column("nickname", sa.String(length=100), nullable=True),
        sa.Column("can_share_records", sa.Boolean(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["dependent_patient_id"], ["patients.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["guardian_patient_id"], ["patients.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("dependent_patient_id"),
        sa.UniqueConstraint("guardian_patient_id", "dependent_patient_id", name="uq_guardian_dependent"),
    )
    op.create_index(op.f("ix_family_members_guardian_patient_id"), "family_members", ["guardian_patient_id"])

    op.create_table(
        "emergency_profiles",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("patient_id", sa.Integer(), nullable=False),
        sa.Column("medical_id_number", sa.String(length=20), nullable=False),
        sa.Column("blood_group", sa.String(length=5), nullable=True),
        sa.Column("allergies", sa.Text(), nullable=True),
        sa.Column("chronic_diseases", sa.Text(), nullable=True),
        sa.Column("emergency_contact_name", sa.String(length=255), nullable=True),
        sa.Column("emergency_contact_phone", sa.String(length=20), nullable=True),
        sa.Column("emergency_contact_relation", sa.String(length=50), nullable=True),
        sa.Column("additional_notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["patient_id"], ["patients.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("patient_id"),
        sa.UniqueConstraint("medical_id_number"),
    )
    op.create_index(op.f("ix_emergency_profiles_medical_id_number"), "emergency_profiles", ["medical_id_number"])

    with op.batch_alter_table("appointments", schema=None) as batch_op:
        batch_op.add_column(sa.Column("booked_by_user_id", sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column("family_member_id", sa.Integer(), nullable=True))
        batch_op.create_foreign_key(
            "fk_appointments_booked_by_user_id", "users", ["booked_by_user_id"], ["id"], ondelete="SET NULL"
        )
        batch_op.create_foreign_key(
            "fk_appointments_family_member_id",
            "family_members",
            ["family_member_id"],
            ["id"],
            ondelete="SET NULL",
        )
        batch_op.create_index(batch_op.f("ix_appointments_booked_by_user_id"), ["booked_by_user_id"])
        batch_op.create_index(batch_op.f("ix_appointments_family_member_id"), ["family_member_id"])


def downgrade() -> None:
    with op.batch_alter_table("appointments", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_appointments_family_member_id"))
        batch_op.drop_index(batch_op.f("ix_appointments_booked_by_user_id"))
        batch_op.drop_constraint("fk_appointments_family_member_id", type_="foreignkey")
        batch_op.drop_constraint("fk_appointments_booked_by_user_id", type_="foreignkey")
        batch_op.drop_column("family_member_id")
        batch_op.drop_column("booked_by_user_id")

    op.drop_index(op.f("ix_emergency_profiles_medical_id_number"), table_name="emergency_profiles")
    op.drop_table("emergency_profiles")
    op.drop_index(op.f("ix_family_members_guardian_patient_id"), table_name="family_members")
    op.drop_table("family_members")

    with op.batch_alter_table("patients", schema=None) as batch_op:
        batch_op.drop_column("display_name")
        batch_op.alter_column("user_id", existing_type=sa.Integer(), nullable=False)
