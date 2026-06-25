import asyncio
import json

from fastapi import APIRouter, Depends, Query, Security
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_roles, security_scheme
from app.models import RoleName, User
from app.schemas.medical import NotificationListResponse, NotificationResponse
from app.models import Notification

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get(
    "/stream",
    summary="Real-time notification stream (SSE)",
    description=(
        "Server-sent events stream for live notifications. "
        "Sends heartbeat events until push delivery is implemented."
    ),
)
async def notification_stream(
    current_user: User = Depends(require_roles(RoleName.PATIENT, RoleName.DOCTOR, RoleName.ADMIN)),
    _: str = Security(security_scheme),
) -> StreamingResponse:
    async def event_generator():
        yield f"data: {json.dumps({'type': 'connected', 'user_id': current_user.id})}\n\n"
        while True:
            await asyncio.sleep(30)
            yield f"data: {json.dumps({'type': 'heartbeat'})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.get(
    "/me",
    response_model=NotificationListResponse,
    summary="List my notifications",
)
def list_my_notifications(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleName.PATIENT, RoleName.DOCTOR, RoleName.ADMIN)),
    _: str = Security(security_scheme),
) -> NotificationListResponse:
    query = db.query(Notification).filter(Notification.user_id == current_user.id)
    total = query.count()
    items = (
        query.order_by(Notification.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return NotificationListResponse(
        items=[NotificationResponse.model_validate(i) for i in items],
        total=total,
        page=page,
        page_size=page_size,
    )
