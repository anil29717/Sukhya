from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class MedicalRecordResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    patient_id: int
    uploaded_by_user_id: int | None
    appointment_id: int | None
    record_type: str
    title: str
    description: str | None
    file_name: str
    file_size: int
    mime_type: str
    download_url: str | None = None
    created_at: datetime
    updated_at: datetime


class MedicalRecordListResponse(BaseModel):
    items: list[MedicalRecordResponse]
    total: int
    page: int
    page_size: int


class MedicationItem(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    dosage: str | None = Field(default=None, max_length=100)
    frequency: str | None = Field(default=None, max_length=100)
    duration: str | None = Field(default=None, max_length=100)


class PrescriptionCreateRequest(BaseModel):
    patient_id: int
    appointment_id: int | None = None
    diagnosis: str | None = Field(default=None, max_length=500)
    medications: list[MedicationItem] = Field(default_factory=list)
    instructions: str | None = None


class PrescriptionUpdateRequest(BaseModel):
    diagnosis: str | None = Field(default=None, max_length=500)
    medications: list[MedicationItem] | None = None
    instructions: str | None = None
    appointment_id: int | None = None


class PrescriptionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    patient_id: int
    doctor_id: int
    appointment_id: int | None
    diagnosis: str | None
    medications: list[MedicationItem]
    instructions: str | None
    document_record_id: int | None
    status: str
    download_url: str | None = None
    created_at: datetime
    updated_at: datetime
    patient_name: str | None = None
    doctor_name: str | None = None


class PrescriptionListResponse(BaseModel):
    items: list[PrescriptionResponse]
    total: int
    page: int
    page_size: int


class NotificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    channel: str
    event_type: str
    title: str
    message: str
    status: str
    error_message: str | None
    sent_at: datetime | None
    created_at: datetime


class NotificationListResponse(BaseModel):
    items: list[NotificationResponse]
    total: int
    page: int
    page_size: int


class AnalyticsResponse(BaseModel):
    total_patients: int
    total_doctors: int
    total_appointments: int
    total_reports: int
    total_prescriptions: int
    pending_doctors: int
    pending_appointments: int


class AdminUserUpdateRequest(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=255)
    phone: str | None = Field(default=None, max_length=20)
    is_active: bool | None = None
    is_approved: bool | None = None


class AuditLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int | None
    action: str
    resource: str | None
    details: str | None
    ip_address: str | None
    created_at: datetime


class AuditLogListResponse(BaseModel):
    items: list[AuditLogResponse]
    total: int
    page: int
    page_size: int


class UsageReportResponse(BaseModel):
    period_days: int
    new_patients: int
    new_doctors: int
    appointments_booked: int
    appointments_completed: int
    records_uploaded: int
    prescriptions_created: int
    notifications_sent: int
