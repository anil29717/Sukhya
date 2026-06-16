from fastapi import APIRouter, Depends, Query, Security
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_roles, security_scheme
from app.models import RoleName, User
from app.schemas.clinical import DoctorAnalyticsResponse, PatientHistoryResponse
from app.services import doctor_analytics_service, patient_history_service

router = APIRouter(prefix="/doctors", tags=["Doctor Analytics (Premium)"])


@router.get(
    "/me/analytics",
    response_model=DoctorAnalyticsResponse,
    summary="Doctor performance dashboard",
)
def my_analytics(
    days: int = Query(default=30, ge=7, le=90),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleName.DOCTOR)),
    _: str = Security(security_scheme),
) -> DoctorAnalyticsResponse:
    return DoctorAnalyticsResponse(**doctor_analytics_service.get_doctor_analytics(db, current_user, days=days))


@router.get(
    "/me/patients/{patient_id}/history",
    response_model=PatientHistoryResponse,
    summary="Full patient history for doctor",
    description="Timeline, records, prescriptions, notes, and follow-ups in one view.",
)
def patient_history(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleName.DOCTOR)),
    _: str = Security(security_scheme),
) -> PatientHistoryResponse:
    return PatientHistoryResponse(**patient_history_service.get_patient_history(db, current_user, patient_id))
