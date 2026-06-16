from fastapi import APIRouter, Depends, Query, Request, Security
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_roles, security_scheme
from app.models import RoleName, User
from app.schemas.timeline import (
    AccessLogResponse,
    DigitalLockerListResponse,
    DigitalLockerSummaryResponse,
    DownloadLogResponse,
)
from app.services import locker_service

router = APIRouter(prefix="/digital-locker", tags=["Digital Health Locker (Premium)"])


@router.get(
    "/summary",
    response_model=DigitalLockerSummaryResponse,
    summary="Digital locker summary",
)
def locker_summary(
    patient_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleName.PATIENT, RoleName.DOCTOR, RoleName.ADMIN)),
    _: str = Security(security_scheme),
) -> DigitalLockerSummaryResponse:
    return DigitalLockerSummaryResponse(**locker_service.locker_summary(db, current_user, patient_id))


@router.get(
    "",
    response_model=DigitalLockerListResponse,
    summary="Locker overview with recent activity",
)
def locker_overview(
    patient_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleName.PATIENT, RoleName.DOCTOR, RoleName.ADMIN)),
    _: str = Security(security_scheme),
) -> DigitalLockerListResponse:
    summary = locker_service.locker_summary(db, current_user, patient_id)
    downloads, _ = locker_service.list_download_history(db, current_user, patient_id=patient_id, page_size=5)
    access, _ = locker_service.list_access_logs(db, current_user, patient_id=patient_id, page_size=5)
    return DigitalLockerListResponse(
        summary=DigitalLockerSummaryResponse(**summary),
        recent_downloads=[DownloadLogResponse(**d) for d in downloads],
        recent_access=[AccessLogResponse(**a) for a in access],
    )


@router.get(
    "/downloads",
    response_model=list[DownloadLogResponse],
    summary="Record download history",
)
def download_history(
    patient_id: int | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleName.PATIENT, RoleName.DOCTOR, RoleName.ADMIN)),
    _: str = Security(security_scheme),
) -> list[DownloadLogResponse]:
    items, _ = locker_service.list_download_history(
        db, current_user, patient_id=patient_id, page=page, page_size=page_size
    )
    return [DownloadLogResponse(**item) for item in items]


@router.get(
    "/access-logs",
    response_model=list[AccessLogResponse],
    summary="Record access audit trail",
)
def access_logs(
    patient_id: int | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleName.PATIENT, RoleName.DOCTOR, RoleName.ADMIN)),
    _: str = Security(security_scheme),
) -> list[AccessLogResponse]:
    items, _ = locker_service.list_access_logs(
        db, current_user, patient_id=patient_id, page=page, page_size=page_size
    )
    return [AccessLogResponse(**item) for item in items]


@router.get(
    "/family-shared",
    summary="Records shared by family members",
)
def family_shared(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleName.PATIENT)),
    _: str = Security(security_scheme),
) -> list[dict]:
    return locker_service.list_family_shared_records(db, current_user)
