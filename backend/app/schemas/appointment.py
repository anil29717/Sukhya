from datetime import date, datetime, time

from pydantic import BaseModel, ConfigDict, Field, field_validator


class AvailableSlotResponse(BaseModel):
    start_time: time
    end_time: time


class AvailableSlotsResponse(BaseModel):
    doctor_id: int
    appointment_date: date
    slot_duration_minutes: int
    slots: list[AvailableSlotResponse]


class AppointmentBookRequest(BaseModel):
    doctor_id: int
    appointment_date: date
    start_time: time
    reason: str | None = Field(default=None, max_length=500)
    family_member_id: int | None = Field(
        default=None,
        description="Book on behalf of a family member (managed dependent profile)",
    )

    @field_validator("appointment_date")
    @classmethod
    def date_not_in_past(cls, value: date) -> date:
        if value < date.today():
            raise ValueError("appointment_date cannot be in the past")
        return value


class AppointmentRescheduleRequest(BaseModel):
    appointment_date: date
    start_time: time
    reason: str | None = Field(default=None, max_length=500)

    @field_validator("appointment_date")
    @classmethod
    def date_not_in_past(cls, value: date) -> date:
        if value < date.today():
            raise ValueError("appointment_date cannot be in the past")
        return value


class AppointmentCancelRequest(BaseModel):
    cancellation_reason: str | None = Field(default=None, max_length=500)


class AppointmentCompleteRequest(BaseModel):
    notes: str | None = None


class AppointmentParticipantResponse(BaseModel):
    id: int | None = None
    full_name: str
    email: str | None = None
    phone: str | None = None
    is_family_dependent: bool = False
    family_member_id: int | None = None


class AppointmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    patient_id: int
    doctor_id: int
    appointment_date: date
    start_time: time
    end_time: time
    status: str
    reason: str | None
    notes: str | None
    cancellation_reason: str | None
    created_at: datetime
    updated_at: datetime
    patient: AppointmentParticipantResponse | None = None
    doctor: AppointmentParticipantResponse | None = None
    booked_by_user_id: int | None = None
    family_member_id: int | None = None


class AppointmentListResponse(BaseModel):
    items: list[AppointmentResponse]
    total: int
    page: int
    page_size: int
