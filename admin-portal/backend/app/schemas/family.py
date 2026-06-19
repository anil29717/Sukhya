from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.family import FamilyRelationship


class FamilyMemberCreateRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=255)
    relationship: str = Field(description="parent, child, spouse, sibling, other")
    nickname: str | None = Field(default=None, max_length=100)
    date_of_birth: date | None = None
    gender: str | None = Field(default=None, max_length=20)
    blood_group: str | None = Field(default=None, max_length=5)
    allergies: str | None = None
    chronic_diseases: str | None = None
    emergency_contact_name: str | None = Field(default=None, max_length=255)
    emergency_contact_phone: str | None = Field(default=None, max_length=20)
    can_share_records: bool = True

    @field_validator("relationship")
    @classmethod
    def valid_relationship(cls, value: str) -> str:
        try:
            FamilyRelationship(value.lower())
        except ValueError as exc:
            raise ValueError(
                "relationship must be parent, child, spouse, sibling, or other"
            ) from exc
        return value.lower()


class FamilyMemberUpdateRequest(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=255)
    relationship: str | None = None
    nickname: str | None = Field(default=None, max_length=100)
    date_of_birth: date | None = None
    gender: str | None = Field(default=None, max_length=20)
    blood_group: str | None = Field(default=None, max_length=5)
    allergies: str | None = None
    chronic_diseases: str | None = None
    emergency_contact_name: str | None = Field(default=None, max_length=255)
    emergency_contact_phone: str | None = Field(default=None, max_length=20)
    can_share_records: bool | None = None
    is_active: bool | None = None


class FamilyMemberDependentResponse(BaseModel):
    patient_id: int
    display_name: str
    date_of_birth: date | None
    gender: str | None
    blood_group: str | None
    allergies: str | None
    chronic_diseases: str | None


class FamilyMemberResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    guardian_patient_id: int
    dependent_patient_id: int
    relationship: str
    nickname: str | None
    can_share_records: bool
    is_active: bool
    created_at: datetime
    updated_at: datetime
    dependent: FamilyMemberDependentResponse


class EmergencyProfileUpdateRequest(BaseModel):
    blood_group: str | None = Field(default=None, max_length=5)
    allergies: str | None = None
    chronic_diseases: str | None = None
    emergency_contact_name: str | None = Field(default=None, max_length=255)
    emergency_contact_phone: str | None = Field(default=None, max_length=20)
    emergency_contact_relation: str | None = Field(default=None, max_length=50)
    additional_notes: str | None = None


class EmergencyProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    patient_id: int
    medical_id_number: str
    blood_group: str | None
    allergies: str | None
    chronic_diseases: str | None
    emergency_contact_name: str | None
    emergency_contact_phone: str | None
    emergency_contact_relation: str | None
    additional_notes: str | None
    display_name: str
    updated_at: datetime


class EmergencyCardResponse(BaseModel):
    """One-tap emergency bundle — minimal critical info."""

    medical_id_number: str
    full_name: str
    blood_group: str | None
    allergies: str | None
    chronic_diseases: str | None
    emergency_contact_name: str | None
    emergency_contact_phone: str | None
    emergency_contact_relation: str | None
    additional_notes: str | None


class FamilyDashboardMemberSummary(BaseModel):
    family_member_id: int
    dependent_patient_id: int
    full_name: str
    relationship: str
    upcoming_appointments: int
    medical_records_count: int
    has_emergency_profile: bool


class FamilyDashboardResponse(BaseModel):
    guardian_name: str
    total_family_members: int
    total_upcoming_appointments: int
    members: list[FamilyDashboardMemberSummary]
