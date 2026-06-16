from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.auth import UserResponse
from app.schemas.medication import MedicationResponse, VitalSignResponse


class UserListResponse(BaseModel):
    items: list[UserResponse]
    total: int
    page: int
    page_size: int


class StorageProviderHealth(BaseModel):
    name: str
    configured: bool
    status: str  # online | offline | not_configured
    message: str | None = None


class StorageStatsResponse(BaseModel):
    total_files: int
    total_bytes: int
    total_mb: float
    by_record_type: dict[str, int]
    by_provider: dict[str, int]
    bytes_by_provider: dict[str, int]


class StorageHealthResponse(BaseModel):
    storage_backend: str
    dual_write_s3: bool
    cloudinary_configured: bool
    s3_configured: bool
    providers: list[StorageProviderHealth]


class StorageFileItem(BaseModel):
    id: int
    patient_id: int
    patient_name: str | None
    title: str
    file_name: str
    mime_type: str
    file_size: int
    record_type: str
    storage_key: str
    provider: str
    download_url: str | None
    created_at: datetime


class StorageFileListResponse(BaseModel):
    items: list[StorageFileItem]
    total: int
    page: int
    page_size: int


class DbTableInfo(BaseModel):
    name: str
    row_count: int
    copyable: bool


class DbTestConnectionRequest(BaseModel):
    source_url: str = Field(min_length=10)


class DbTestConnectionResponse(BaseModel):
    ok: bool
    message: str
    tables: list[DbTableInfo]


class DbCopyRequest(BaseModel):
    source_url: str = Field(min_length=10)
    tables: list[str] = Field(min_length=1)
    mode: str = Field(default="merge", pattern="^(merge|replace)$")


class DbCopyTableResult(BaseModel):
    table: str
    copied: int
    skipped: int
    errors: list[str]


class DbCopyResponse(BaseModel):
    success: bool
    results: list[DbCopyTableResult]


class SystemInfoResponse(BaseModel):
    app_version: str
    storage_backend: str
    dual_write_s3: bool
    db_copy_enabled: bool
    database_host_masked: str


class AdminPatientCreateRequest(BaseModel):
    email: str
    password: str = Field(min_length=8)
    full_name: str
    phone: str | None = None
    date_of_birth: str | None = None
    gender: str | None = None
    blood_group: str | None = None


class AdminPatientUpdateRequest(BaseModel):
    full_name: str | None = None
    phone: str | None = None
    date_of_birth: str | None = None
    gender: str | None = None
    blood_group: str | None = None
    is_active: bool | None = None


class AdminDoctorUpdateRequest(BaseModel):
    qualification: str | None = None
    specialization: str | None = None
    experience_years: int | None = None
    consultation_fee: float | None = None
    bio: str | None = None
    is_active: bool | None = None


class MedicalRecordUpdateRequest(BaseModel):
    title: str | None = None
    description: str | None = None


class MedicationListResponse(BaseModel):
    items: list[MedicationResponse]
    total: int
    page: int
    page_size: int


class VitalListResponse(BaseModel):
    items: list[VitalSignResponse]
    total: int
    page: int
    page_size: int
