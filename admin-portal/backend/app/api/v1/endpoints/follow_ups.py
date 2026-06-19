from fastapi import APIRouter, Depends, Query, Security, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_roles, security_scheme
from app.models import RoleName, User
from app.schemas.clinical import FollowUpCreateRequest, FollowUpResponse, FollowUpUpdateRequest
from app.services import follow_up_service

router = APIRouter(prefix="/follow-ups", tags=["Follow-Ups (Premium)"])


@router.get("", response_model=list[FollowUpResponse], summary="List follow-ups")
def list_follow_ups(
    patient_id: int | None = Query(default=None),
    status_filter: str | None = Query(default=None, alias="status"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleName.DOCTOR, RoleName.PATIENT, RoleName.ADMIN)),
    _: str = Security(security_scheme),
) -> list[FollowUpResponse]:
    items, _ = follow_up_service.list_follow_ups(
        db,
        current_user,
        patient_id=patient_id,
        status_filter=status_filter,
        page=page,
        page_size=page_size,
    )
    return [FollowUpResponse(**item) for item in items]


@router.post(
    "",
    response_model=FollowUpResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Schedule follow-up",
)
def create_follow_up(
    data: FollowUpCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleName.DOCTOR)),
    _: str = Security(security_scheme),
) -> FollowUpResponse:
    fu = follow_up_service.create_follow_up(db, current_user, data)
    return FollowUpResponse(**follow_up_service._follow_up_to_dict(fu))


@router.put("/{follow_up_id}", response_model=FollowUpResponse, summary="Update follow-up")
def update_follow_up(
    follow_up_id: int,
    data: FollowUpUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleName.DOCTOR)),
    _: str = Security(security_scheme),
) -> FollowUpResponse:
    fu = follow_up_service.update_follow_up(db, current_user, follow_up_id, data)
    return FollowUpResponse(**follow_up_service._follow_up_to_dict(fu))


@router.post("/reminders/send", summary="Send follow-up reminder notifications")
def send_reminders(
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(RoleName.ADMIN)),
    __: str = Security(security_scheme),
) -> dict:
    count = follow_up_service.send_follow_up_reminders(db)
    return {"notifications_sent": count}
