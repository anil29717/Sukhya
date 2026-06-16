from datetime import date

from fastapi import APIRouter, Depends, Query, Security
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_roles, security_scheme
from app.models import RoleName, User
from app.schemas.timeline import TimelineEventResponse, TimelineListResponse
from app.services import timeline_service

router = APIRouter(prefix="/health-timeline", tags=["Health Timeline (Premium)"])


@router.get(
    "",
    response_model=TimelineListResponse,
    summary="Unified health timeline",
    description="Chronological view of appointments, visits, prescriptions, and medical records.",
)
def get_timeline(
    patient_id: int | None = Query(default=None),
    event_type: str | None = Query(default=None, description="appointment, prescription, medical_record, doctor_visit"),
    from_date: date | None = Query(default=None),
    to_date: date | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleName.PATIENT, RoleName.DOCTOR, RoleName.ADMIN)),
    _: str = Security(security_scheme),
) -> TimelineListResponse:
    items, total = timeline_service.list_timeline(
        db,
        current_user,
        patient_id=patient_id,
        event_type=event_type,
        from_date=from_date,
        to_date=to_date,
        page=page,
        page_size=page_size,
    )
    return TimelineListResponse(
        items=[TimelineEventResponse(**item) for item in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.post(
    "/sync",
    summary="Rebuild timeline cache",
    description="Admin/doctor: rebuild cached timeline events for a patient.",
)
def sync_timeline(
    patient_id: int = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleName.DOCTOR, RoleName.ADMIN)),
    _: str = Security(security_scheme),
) -> dict:
    timeline_service.resolve_patient_access(db, current_user, patient_id)
    count = timeline_service.sync_timeline_cache(db, patient_id)
    return {"patient_id": patient_id, "events_cached": count}
