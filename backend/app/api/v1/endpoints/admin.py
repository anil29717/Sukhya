from fastapi import APIRouter, Depends, Query, Request, Security
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_roles, security_scheme
from app.models import RoleName, User
from app.schemas.admin import (
    AdminDoctorUpdateRequest,
    AdminPatientCreateRequest,
    AdminPatientUpdateRequest,
    DbCopyRequest,
    DbCopyResponse,
    DbTestConnectionRequest,
    DbTestConnectionResponse,
    MedicalRecordUpdateRequest,
    MedicationListResponse,
    StorageFileListResponse,
    StorageHealthResponse,
    StorageStatsResponse,
    SystemInfoResponse,
    UserListResponse,
    VitalListResponse,
)
from app.schemas.auth import UserResponse
from app.schemas.medical import (
    AdminUserUpdateRequest,
    AnalyticsResponse,
    AuditLogListResponse,
    AuditLogResponse,
    MedicalRecordListResponse,
    MedicalRecordResponse,
    NotificationListResponse,
    NotificationResponse,
    UsageReportResponse,
)
from app.schemas.appointment import AppointmentListResponse, AppointmentResponse
from app.schemas.doctor import DoctorResponse
from app.schemas.medication import MedicationCreateRequest, MedicationResponse, MedicationUpdateRequest, VitalSignResponse
from app.schemas.patient import PatientResponse
from app.services import admin_service, appointment_service, database_copy_service, doctor_service, medical_record_service, medication_service, patient_service, storage_admin_service

router = APIRouter(prefix="/admin", tags=["Admin Portal"])


@router.get("/analytics", response_model=AnalyticsResponse, summary="Dashboard analytics")
def get_analytics(
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(RoleName.ADMIN)),
    __: str = Security(security_scheme),
) -> AnalyticsResponse:
    return AnalyticsResponse(**admin_service.get_analytics(db))


@router.get("/users", response_model=UserListResponse, summary="List all users")
def list_users(
    role: str | None = Query(default=None),
    search: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(RoleName.ADMIN)),
    __: str = Security(security_scheme),
) -> UserListResponse:
    users, total = admin_service.list_users(db, role=role, search=search, page=page, page_size=page_size)
    return UserListResponse(
        items=[UserResponse.model_validate(u) for u in users],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.put("/users/{user_id}", response_model=UserResponse, summary="Update user")
def update_user(
    user_id: int,
    data: AdminUserUpdateRequest,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(RoleName.ADMIN)),
    __: str = Security(security_scheme),
) -> UserResponse:
    return admin_service.update_user(db, user_id, data)


@router.delete("/users/{user_id}", response_model=UserResponse, summary="Deactivate user")
def deactivate_user(
    user_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(RoleName.ADMIN)),
    __: str = Security(security_scheme),
) -> UserResponse:
    return admin_service.deactivate_user(db, user_id)


@router.post("/patients", response_model=PatientResponse, status_code=201, summary="Create patient")
def create_patient(
    data: AdminPatientCreateRequest,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(RoleName.ADMIN)),
    __: str = Security(security_scheme),
) -> PatientResponse:
    patient = admin_service.create_patient_admin(db, data)
    return patient_service.get_patient_by_id(db, patient.id)


@router.put("/patients/{patient_id}", response_model=PatientResponse, summary="Update patient")
def update_patient(
    patient_id: int,
    data: AdminPatientUpdateRequest,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(RoleName.ADMIN)),
    __: str = Security(security_scheme),
) -> PatientResponse:
    admin_service.update_patient_admin(db, patient_id, data)
    return patient_service.get_patient_by_id(db, patient_id)


@router.delete("/patients/{patient_id}", response_model=PatientResponse, summary="Deactivate patient")
def deactivate_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(RoleName.ADMIN)),
    __: str = Security(security_scheme),
) -> PatientResponse:
    admin_service.deactivate_patient_admin(db, patient_id)
    return patient_service.get_patient_by_id(db, patient_id)


@router.put("/doctors/{doctor_id}", response_model=DoctorResponse, summary="Update doctor profile")
def update_doctor(
    doctor_id: int,
    data: AdminDoctorUpdateRequest,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(RoleName.ADMIN)),
    __: str = Security(security_scheme),
) -> DoctorResponse:
    admin_service.update_doctor_admin(db, doctor_id, data)
    return doctor_service.get_doctor_by_id(db, doctor_id, approved_only=False)


@router.get("/appointments", response_model=AppointmentListResponse, summary="Monitor appointments")
def monitor_appointments(
    status_filter: str | None = Query(default=None, alias="status"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(RoleName.ADMIN)),
    __: str = Security(security_scheme),
) -> AppointmentListResponse:
    items, total = admin_service.list_appointments_admin(
        db, status_filter=status_filter, page=page, page_size=page_size
    )
    return AppointmentListResponse(
        items=[AppointmentResponse(**appointment_service.format_appointment_response(a)) for a in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/medical-records", response_model=MedicalRecordListResponse, summary="Monitor medical records")
def monitor_records(
    record_type: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(RoleName.ADMIN)),
    __: str = Security(security_scheme),
) -> MedicalRecordListResponse:
    items, total = admin_service.list_records_admin(db, record_type=record_type, page=page, page_size=page_size)
    return MedicalRecordListResponse(
        items=[MedicalRecordResponse(**medical_record_service.record_to_dict(r)) for r in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.put("/medical-records/{record_id}", response_model=MedicalRecordResponse, summary="Update record metadata")
def update_record(
    record_id: int,
    data: MedicalRecordUpdateRequest,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(RoleName.ADMIN)),
    __: str = Security(security_scheme),
) -> MedicalRecordResponse:
    record = admin_service.update_record_metadata(db, record_id, title=data.title, description=data.description)
    return MedicalRecordResponse(**medical_record_service.record_to_dict(record))


@router.get("/audit-logs", response_model=AuditLogListResponse, summary="View audit logs")
def list_audit_logs(
    action: str | None = Query(default=None),
    resource: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(RoleName.ADMIN)),
    __: str = Security(security_scheme),
) -> AuditLogListResponse:
    items, total = admin_service.list_audit_logs(
        db, action=action, resource=resource, page=page, page_size=page_size
    )
    return AuditLogListResponse(
        items=[AuditLogResponse.model_validate(i) for i in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/usage-reports", response_model=UsageReportResponse, summary="Usage reports")
def usage_reports(
    days: int = Query(default=30, ge=1, le=365),
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(RoleName.ADMIN)),
    __: str = Security(security_scheme),
) -> UsageReportResponse:
    return UsageReportResponse(**admin_service.get_usage_report(db, days=days))


@router.get("/notifications", response_model=NotificationListResponse, summary="All platform notifications")
def list_notifications(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(RoleName.ADMIN)),
    __: str = Security(security_scheme),
) -> NotificationListResponse:
    items, total = admin_service.list_notifications_admin(db, page=page, page_size=page_size)
    return NotificationListResponse(
        items=[NotificationResponse.model_validate(i) for i in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/medications", response_model=MedicationListResponse, summary="All medications")
def list_medications(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(RoleName.ADMIN)),
    __: str = Security(security_scheme),
) -> MedicationListResponse:
    items, total = admin_service.list_medications_admin(db, page=page, page_size=page_size)
    return MedicationListResponse(
        items=[MedicationResponse(**medication_service._medication_to_dict(i)) for i in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.post("/medications", response_model=MedicationResponse, status_code=201, summary="Create medication")
def create_medication_admin(
    data: MedicationCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleName.ADMIN)),
    __: str = Security(security_scheme),
) -> MedicationResponse:
    med = medication_service.create_medication(db, current_user, data)
    return MedicationResponse(**medication_service._medication_to_dict(med))


@router.put("/medications/{medication_id}", response_model=MedicationResponse, summary="Update medication")
def update_medication_admin(
    medication_id: int,
    data: MedicationUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleName.ADMIN)),
    __: str = Security(security_scheme),
) -> MedicationResponse:
    med = medication_service.update_medication(db, current_user, medication_id, data)
    return MedicationResponse(**medication_service._medication_to_dict(med))


@router.delete("/medications/{medication_id}", response_model=MedicationResponse, summary="Deactivate medication")
def deactivate_medication_admin(
    medication_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleName.ADMIN)),
    __: str = Security(security_scheme),
) -> MedicationResponse:
    med = medication_service.update_medication(
        db, current_user, medication_id, MedicationUpdateRequest(is_active=False)
    )
    return MedicationResponse(**medication_service._medication_to_dict(med))


@router.get("/vitals", response_model=VitalListResponse, summary="All vital signs")
def list_vitals(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(RoleName.ADMIN)),
    __: str = Security(security_scheme),
) -> VitalListResponse:
    items, total = admin_service.list_vitals_admin(db, page=page, page_size=page_size)
    return VitalListResponse(
        items=[VitalSignResponse.model_validate(i) for i in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/storage/stats", response_model=StorageStatsResponse, summary="Storage usage statistics")
def storage_stats(
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(RoleName.ADMIN)),
    __: str = Security(security_scheme),
) -> StorageStatsResponse:
    return StorageStatsResponse(**storage_admin_service.get_storage_stats(db))


@router.get("/storage/health", response_model=StorageHealthResponse, summary="Storage provider health")
def storage_health(
    _: User = Depends(require_roles(RoleName.ADMIN)),
    __: str = Security(security_scheme),
) -> StorageHealthResponse:
    return StorageHealthResponse(**storage_admin_service.get_storage_health())


@router.get("/storage/files", response_model=StorageFileListResponse, summary="Browse uploaded files")
def storage_files(
    search: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(RoleName.ADMIN)),
    __: str = Security(security_scheme),
) -> StorageFileListResponse:
    items, total = storage_admin_service.list_storage_files(db, search=search, page=page, page_size=page_size)
    return StorageFileListResponse(items=items, total=total, page=page, page_size=page_size)


@router.get("/system/info", response_model=SystemInfoResponse, summary="System configuration info")
def system_info(
    _: User = Depends(require_roles(RoleName.ADMIN)),
    __: str = Security(security_scheme),
) -> SystemInfoResponse:
    return SystemInfoResponse(**storage_admin_service.get_system_info())


@router.post("/database/test-connection", response_model=DbTestConnectionResponse, summary="Test source PostgreSQL")
def test_db_connection(
    data: DbTestConnectionRequest,
    _: User = Depends(require_roles(RoleName.ADMIN)),
    __: str = Security(security_scheme),
) -> DbTestConnectionResponse:
    return DbTestConnectionResponse(**database_copy_service.test_connection(data.source_url))


@router.post("/database/copy", response_model=DbCopyResponse, summary="Copy tables from source PostgreSQL")
def copy_database(
    request: Request,
    data: DbCopyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleName.ADMIN)),
    __: str = Security(security_scheme),
) -> DbCopyResponse:
    ip = request.client.host if request.client else None
    result = database_copy_service.copy_tables(
        db,
        admin_user_id=current_user.id,
        source_url=data.source_url,
        tables=data.tables,
        mode=data.mode,
        ip_address=ip,
    )
    return DbCopyResponse(**result)
