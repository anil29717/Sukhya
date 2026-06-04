from datetime import date, datetime, time

from pydantic import BaseModel, ConfigDict, Field


class DoctorNoteCreateRequest(BaseModel):
    patient_id: int
    appointment_id: int | None = None
    note_type: str = Field(description="consultation, diagnosis, follow_up, private, observation")
    title: str = Field(min_length=1, max_length=255)
    content: str = Field(min_length=1)
    is_private: bool = False


class DoctorNoteUpdateRequest(BaseModel):
    note_type: str | None = None
    title: str | None = Field(default=None, max_length=255)
    content: str | None = None
    is_private: bool | None = None
    appointment_id: int | None = None


class DoctorNoteResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    doctor_id: int
    doctor_name: str | None = None
    patient_id: int
    appointment_id: int | None
    note_type: str
    title: str
    content: str
    is_private: bool
    created_at: datetime
    updated_at: datetime


class FollowUpCreateRequest(BaseModel):
    patient_id: int
    source_appointment_id: int | None = None
    scheduled_date: date
    scheduled_time: time | None = None
    reason: str | None = Field(default=None, max_length=500)
    notes: str | None = None


class FollowUpUpdateRequest(BaseModel):
    scheduled_date: date | None = None
    scheduled_time: time | None = None
    reason: str | None = None
    notes: str | None = None
    status: str | None = Field(default=None, description="scheduled, completed, cancelled, missed")


class FollowUpResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    doctor_id: int
    doctor_name: str | None = None
    patient_id: int
    patient_name: str | None = None
    source_appointment_id: int | None
    scheduled_date: date
    scheduled_time: time | None
    reason: str | None
    notes: str | None
    status: str
    created_at: datetime
    updated_at: datetime


class DailyAppointmentStat(BaseModel):
    date: date
    total: int
    completed: int
    cancelled: int


class DoctorAnalyticsResponse(BaseModel):
    doctor_id: int
    total_patients: int
    new_patients_this_month: int
    appointments_today: int
    appointments_this_month: int
    completed_consultations: int
    cancelled_appointments: int
    pending_follow_ups: int
    daily_appointments: list[DailyAppointmentStat]
    consultation_completion_rate: float


class PatientHistoryRecord(BaseModel):
    id: int
    record_type: str
    title: str
    created_at: datetime


class PatientHistoryPrescription(BaseModel):
    id: int
    diagnosis: str | None
    status: str
    created_at: datetime


class PatientHistoryAppointment(BaseModel):
    id: int
    appointment_date: date
    start_time: time
    status: str
    reason: str | None


class PatientHistoryNote(BaseModel):
    id: int
    note_type: str
    title: str
    content: str
    appointment_id: int | None
    created_at: datetime


class PatientHistoryResponse(BaseModel):
    patient_id: int
    patient_name: str | None
    timeline: list[dict]
    appointments: list[PatientHistoryAppointment]
    medical_records: list[PatientHistoryRecord]
    prescriptions: list[PatientHistoryPrescription]
    doctor_notes: list[PatientHistoryNote]
    follow_ups: list[FollowUpResponse]
