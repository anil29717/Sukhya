from datetime import date, datetime, time

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.schemas.auth import UserResponse


class DoctorProfileUpdateRequest(BaseModel):
    qualification: str | None = Field(default=None, max_length=255)
    specialization: str | None = Field(default=None, max_length=255)
    experience_years: int | None = Field(default=None, ge=0, le=60)
    consultation_fee: float | None = Field(default=None, ge=0)
    bio: str | None = None


class AvailabilitySlotRequest(BaseModel):
    day_of_week: int = Field(ge=0, le=6, description="0=Monday, 6=Sunday")
    start_time: time
    end_time: time
    is_active: bool = True

    @field_validator("end_time")
    @classmethod
    def end_after_start(cls, end_time: time, info) -> time:
        start_time = info.data.get("start_time")
        if start_time and end_time <= start_time:
            raise ValueError("end_time must be after start_time")
        return end_time


class AvailabilityBulkUpdateRequest(BaseModel):
    slots: list[AvailabilitySlotRequest]


class AvailabilitySlotResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    day_of_week: int
    start_time: time
    end_time: time
    is_active: bool


class DoctorLeaveCreateRequest(BaseModel):
    start_date: date
    end_date: date
    reason: str | None = Field(default=None, max_length=500)

    @field_validator("end_date")
    @classmethod
    def end_on_or_after_start(cls, end_date: date, info) -> date:
        start_date = info.data.get("start_date")
        if start_date and end_date < start_date:
            raise ValueError("end_date must be on or after start_date")
        return end_date


class DoctorLeaveResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    start_date: date
    end_date: date
    reason: str | None
    created_at: datetime


class DoctorResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    qualification: str | None
    specialization: str | None
    experience_years: int | None
    consultation_fee: float | None
    bio: str | None
    created_at: datetime
    updated_at: datetime
    user: UserResponse
    availability_slots: list[AvailabilitySlotResponse] = []


class DoctorListItemResponse(BaseModel):
    id: int
    user_id: int
    full_name: str
    email: str
    phone: str | None
    profile_photo_url: str | None
    qualification: str | None
    specialization: str | None
    experience_years: int | None
    consultation_fee: float | None


class DoctorListResponse(BaseModel):
    items: list[DoctorListItemResponse]
    total: int
    page: int
    page_size: int


class PendingDoctorResponse(BaseModel):
    user_id: int
    email: str
    full_name: str
    phone: str | None
    created_at: datetime
    doctor_id: int | None = None
    specialization: str | None = None


class DoctorApprovalActionResponse(BaseModel):
    message: str
    user: UserResponse
