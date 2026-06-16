from datetime import date, datetime, time

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.auth import UserResponse


class PatientProfileUpdateRequest(BaseModel):
    date_of_birth: date | None = None
    gender: str | None = Field(default=None, description="male, female, or other")
    blood_group: str | None = Field(default=None, description="A+, A-, B+, B-, AB+, AB-, O+, O-")
    emergency_contact_name: str | None = Field(default=None, max_length=255)
    emergency_contact_phone: str | None = Field(default=None, max_length=20)


class PatientMedicalInfoUpdateRequest(BaseModel):
    allergies: str | None = None
    medical_history: str | None = None
    existing_conditions: str | None = None


class PatientResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    date_of_birth: date | None
    gender: str | None
    blood_group: str | None
    emergency_contact_name: str | None
    emergency_contact_phone: str | None
    allergies: str | None
    medical_history: str | None
    existing_conditions: str | None
    created_at: datetime
    updated_at: datetime
    user: UserResponse


class PatientListItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    date_of_birth: date | None
    gender: str | None
    blood_group: str | None
    full_name: str
    email: str
    phone: str | None


class PatientListResponse(BaseModel):
    items: list[PatientListItemResponse]
    total: int
    page: int
    page_size: int
