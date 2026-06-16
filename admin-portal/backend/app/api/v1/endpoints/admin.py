from fastapi import APIRouter, Depends, Query, Security
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_roles, security_scheme
from app.models import RoleName, User
from app.schemas.auth import UserResponse
from app.schemas.medical import (
    AdminUserUpdateRequest,
    AnalyticsResponse,
    AuditLogListResponse,
    AuditLogResponse,
    MedicalRecordListResponse,
    MedicalRecordResponse,
    UsageReportResponse,
)
from app.schemas.appointment import AppointmentListResponse, AppointmentResponse
from app.services import admin_service, appointment_service, medical_record_service

router = APIRouter(prefix="/admin", tags=["Admin Portal"])


@router.get("/analytics", response_model=AnalyticsResponse, summary="Dashboard analytics")
def get_analytics(
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(RoleName.ADMIN)),
    __: str = Security(security_scheme),
) -> AnalyticsResponse:
    return AnalyticsResponse(**admin_service.get_analytics(db))


@router.get("/users", response_model=list[UserResponse], summary="List all users")
def list_users(
    role: str | None = Query(default=None),
    search: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(RoleName.ADMIN)),
    __: str = Security(security_scheme),
) -> list[UserResponse]:
    users, _ = admin_service.list_users(db, role=role, search=search, page=page, page_size=page_size)
    return users


@router.put("/users/{user_id}", response_model=UserResponse, summary="Update user")
def update_user(
    user_id: int,
    data: AdminUserUpdateRequest,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(RoleName.ADMIN)),
    __: str = Security(security_scheme),
) -> UserResponse:
    return admin_service.update_user(db, user_id, data)


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
