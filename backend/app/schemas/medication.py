from datetime import date, datetime, time

from pydantic import BaseModel, ConfigDict, Field


class MedicationScheduleRequest(BaseModel):
    time_of_day: time
    days_of_week: str = Field(default="0,1,2,3,4,5,6", description="Comma-separated 0=Mon..6=Sun")
    reminder_enabled: bool = True


class MedicationCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    dosage: str | None = Field(default=None, max_length=100)
    frequency: str | None = Field(default=None, max_length=100)
    instructions: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    patient_id: int | None = Field(default=None, description="Doctor sets for patient; patient uses self")
    schedules: list[MedicationScheduleRequest] = Field(default_factory=list)


class MedicationUpdateRequest(BaseModel):
    name: str | None = Field(default=None, max_length=255)
    dosage: str | None = None
    frequency: str | None = None
    instructions: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    is_active: bool | None = None


class MedicationLogRequest(BaseModel):
    scheduled_for: datetime
    status: str = Field(description="taken, missed, or skipped")
    notes: str | None = Field(default=None, max_length=500)


class MedicationScheduleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    time_of_day: time
    days_of_week: str
    reminder_enabled: bool


class MedicationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    patient_id: int
    doctor_id: int | None
    name: str
    dosage: str | None
    frequency: str | None
    instructions: str | None
    start_date: date | None
    end_date: date | None
    is_active: bool
    schedules: list[MedicationScheduleResponse] = []
    created_at: datetime
    updated_at: datetime


class MedicationLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    medication_id: int
    medication_name: str
    scheduled_for: datetime
    status: str
    taken_at: datetime | None
    notes: str | None
    created_at: datetime


class VitalSignCreateRequest(BaseModel):
    vital_type: str = Field(description="blood_pressure, blood_sugar, weight, heart_rate, oxygen")
    value: float
    secondary_value: float | None = Field(default=None, description="e.g. diastolic BP")
    unit: str | None = Field(default=None, max_length=20)
    notes: str | None = Field(default=None, max_length=500)
    recorded_at: datetime | None = None
    patient_id: int | None = None


class VitalSignResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    patient_id: int
    vital_type: str
    value: float
    secondary_value: float | None
    unit: str | None
    notes: str | None
    recorded_at: datetime
    created_at: datetime


class VitalTrendPoint(BaseModel):
    recorded_at: datetime
    value: float
    secondary_value: float | None = None


class VitalTrendsResponse(BaseModel):
    vital_type: str
    unit: str | None
    points: list[VitalTrendPoint]
