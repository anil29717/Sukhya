from datetime import date, datetime, time

from pydantic import BaseModel, ConfigDict, Field, field_validator


class DoctorSchedulingSettingsRequest(BaseModel):
    slot_buffer_minutes: int = Field(default=0, ge=0, le=60)
    max_appointments_per_day: int | None = Field(default=None, ge=1, le=50)


class DoctorSchedulingSettingsResponse(BaseModel):
    doctor_id: int
    slot_buffer_minutes: int
    max_appointments_per_day: int | None
    slot_duration_minutes: int = 30


class RecurringAppointmentCreateRequest(BaseModel):
    doctor_id: int
    recurrence_pattern: str = Field(description="weekly, biweekly, or monthly")
    day_of_week: int = Field(ge=0, le=6, description="0=Monday")
    preferred_start_time: time
    start_date: date
    end_date: date | None = None
    reason: str | None = Field(default=None, max_length=500)
    family_member_id: int | None = None
    weeks_ahead: int = Field(default=4, ge=1, le=12, description="How many occurrences to book now")

    @field_validator("start_date")
    @classmethod
    def start_not_past(cls, value: date) -> date:
        if value < date.today():
            raise ValueError("start_date cannot be in the past")
        return value


class RecurringAppointmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    patient_id: int
    doctor_id: int
    recurrence_pattern: str
    day_of_week: int
    preferred_start_time: time
    start_date: date
    end_date: date | None
    reason: str | None
    is_active: bool
    last_generated_date: date | None
    appointments_created: int = 0
    created_at: datetime


class WaitlistJoinRequest(BaseModel):
    doctor_id: int
    desired_date: date
    preferred_start_time: time | None = None
    reason: str | None = Field(default=None, max_length=500)
    family_member_id: int | None = None

    @field_validator("desired_date")
    @classmethod
    def date_not_past(cls, value: date) -> date:
        if value < date.today():
            raise ValueError("desired_date cannot be in the past")
        return value


class WaitlistEntryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    patient_id: int
    doctor_id: int
    doctor_name: str | None = None
    desired_date: date
    preferred_start_time: time | None
    reason: str | None
    status: str
    position: int
    booked_appointment_id: int | None
    created_at: datetime


class QuickRebookResponse(BaseModel):
    original_appointment_id: int
    new_appointment_id: int
    appointment_date: date
    start_time: time
    end_time: time
    status: str
