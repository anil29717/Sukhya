from datetime import date

from fastapi import APIRouter, Depends, Query, Security, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_roles, security_scheme
from app.models import RoleName, User
from app.schemas.medication import (
    MedicationCreateRequest,
    MedicationLogRequest,
    MedicationLogResponse,
    MedicationResponse,
    MedicationUpdateRequest,
    VitalSignCreateRequest,
    VitalSignResponse,
    VitalTrendsResponse,
)
from app.services import medication_service

router = APIRouter(prefix="/medications", tags=["Medications & Vitals (Premium)"])


@router.get("", response_model=list[MedicationResponse], summary="List medications")
def list_medications(
    patient_id: int | None = Query(default=None),
    active_only: bool = Query(default=True),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleName.PATIENT, RoleName.DOCTOR, RoleName.ADMIN)),
    _: str = Security(security_scheme),
) -> list[MedicationResponse]:
    meds = medication_service.list_medications(
        db, current_user, patient_id=patient_id, active_only=active_only
    )
    return [MedicationResponse(**medication_service._medication_to_dict(m)) for m in meds]


@router.post(
    "",
    response_model=MedicationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add medication",
)
def create_medication(
    data: MedicationCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleName.PATIENT, RoleName.DOCTOR, RoleName.ADMIN)),
    _: str = Security(security_scheme),
) -> MedicationResponse:
    med = medication_service.create_medication(db, current_user, data)
    return MedicationResponse(**medication_service._medication_to_dict(med))


@router.put("/{medication_id}", response_model=MedicationResponse, summary="Update medication")
def update_medication(
    medication_id: int,
    data: MedicationUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleName.PATIENT, RoleName.DOCTOR, RoleName.ADMIN)),
    _: str = Security(security_scheme),
) -> MedicationResponse:
    med = medication_service.update_medication(db, current_user, medication_id, data)
    return MedicationResponse(**medication_service._medication_to_dict(med))


@router.post(
    "/{medication_id}/log",
    response_model=MedicationLogResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Log dose (taken, missed, skipped)",
)
def log_dose(
    medication_id: int,
    data: MedicationLogRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleName.PATIENT, RoleName.DOCTOR, RoleName.ADMIN)),
    _: str = Security(security_scheme),
) -> MedicationLogResponse:
    log = medication_service.log_dose(db, current_user, medication_id, data)
    med = medication_service._get_medication_for_user(db, current_user, medication_id)
    return MedicationLogResponse(
        id=log.id,
        medication_id=log.medication_id,
        medication_name=med.name,
        scheduled_for=log.scheduled_for,
        status=log.status,
        taken_at=log.taken_at,
        notes=log.notes,
        created_at=log.created_at,
    )


@router.get("/logs", response_model=list[MedicationLogResponse], summary="Medication history")
def medication_logs(
    patient_id: int | None = Query(default=None),
    medication_id: int | None = Query(default=None),
    from_date: date | None = Query(default=None),
    to_date: date | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleName.PATIENT, RoleName.DOCTOR, RoleName.ADMIN)),
    _: str = Security(security_scheme),
) -> list[MedicationLogResponse]:
    items, _ = medication_service.list_medication_logs(
        db,
        current_user,
        patient_id=patient_id,
        medication_id=medication_id,
        from_date=from_date,
        to_date=to_date,
        page=page,
        page_size=page_size,
    )
    return [MedicationLogResponse(**item) for item in items]


@router.get("/reminders/due", summary="Due medication reminders today")
def due_reminders(
    patient_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleName.PATIENT, RoleName.DOCTOR, RoleName.ADMIN)),
    _: str = Security(security_scheme),
) -> list[dict]:
    return medication_service.get_due_reminders(db, current_user, patient_id=patient_id)


@router.post("/reminders/send", summary="Send due reminder notifications")
def send_reminders(
    patient_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleName.PATIENT, RoleName.ADMIN)),
    _: str = Security(security_scheme),
) -> dict:
    count = medication_service.send_reminder_notifications(db, current_user, patient_id=patient_id)
    return {"notifications_sent": count}


vitals_router = APIRouter(prefix="/vitals", tags=["Medications & Vitals (Premium)"])


@vitals_router.post(
    "",
    response_model=VitalSignResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Log vital sign",
)
def create_vital(
    data: VitalSignCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleName.PATIENT, RoleName.DOCTOR, RoleName.ADMIN)),
    _: str = Security(security_scheme),
) -> VitalSignResponse:
    vital = medication_service.create_vital(db, current_user, data)
    return VitalSignResponse.model_validate(vital)


@vitals_router.get("", response_model=list[VitalSignResponse], summary="List vital signs")
def list_vitals(
    patient_id: int | None = Query(default=None),
    vital_type: str | None = Query(default=None),
    from_date: date | None = Query(default=None),
    to_date: date | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleName.PATIENT, RoleName.DOCTOR, RoleName.ADMIN)),
    _: str = Security(security_scheme),
) -> list[VitalSignResponse]:
    items, _ = medication_service.list_vitals(
        db,
        current_user,
        patient_id=patient_id,
        vital_type=vital_type,
        from_date=from_date,
        to_date=to_date,
        page=page,
        page_size=page_size,
    )
    return [VitalSignResponse.model_validate(v) for v in items]


@vitals_router.get("/trends", response_model=VitalTrendsResponse, summary="Vital sign trends")
def vital_trends(
    vital_type: str = Query(...),
    patient_id: int | None = Query(default=None),
    days: int = Query(default=30, ge=1, le=365),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleName.PATIENT, RoleName.DOCTOR, RoleName.ADMIN)),
    _: str = Security(security_scheme),
) -> VitalTrendsResponse:
    return VitalTrendsResponse(**medication_service.vital_trends(
        db, current_user, patient_id=patient_id, vital_type=vital_type, days=days
    ))
