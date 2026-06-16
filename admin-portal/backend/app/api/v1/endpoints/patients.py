from fastapi import APIRouter, Depends, Query, Security, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user, require_roles, security_scheme
from app.models import RoleName, User
from app.schemas.patient import (
    PatientListResponse,
    PatientMedicalInfoUpdateRequest,
    PatientProfileUpdateRequest,
    PatientResponse,
)
from app.services import patient_service

router = APIRouter(prefix="/patients", tags=["Patients"])


@router.get(
    "/me",
    response_model=PatientResponse,
    summary="Get my patient profile",
)
def get_my_patient_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleName.PATIENT)),
    _: str = Security(security_scheme),
) -> PatientResponse:
    return patient_service.get_patient_by_user_id(db, current_user.id)


@router.put(
    "/me",
    response_model=PatientResponse,
    summary="Update my patient profile",
)
def update_my_patient_profile(
    data: PatientProfileUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleName.PATIENT)),
    _: str = Security(security_scheme),
) -> PatientResponse:
    patient = patient_service.get_patient_by_user_id(db, current_user.id)
    patient_service.update_patient_profile(db, patient, data)
    return patient_service.get_patient_by_user_id(db, current_user.id)


@router.put(
    "/me/medical",
    response_model=PatientResponse,
    summary="Update my medical information",
)
def update_my_medical_info(
    data: PatientMedicalInfoUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleName.PATIENT)),
    _: str = Security(security_scheme),
) -> PatientResponse:
    patient = patient_service.get_patient_by_user_id(db, current_user.id)
    patient_service.update_patient_medical_info(db, patient, data)
    return patient_service.get_patient_by_user_id(db, current_user.id)


@router.get(
    "",
    response_model=PatientListResponse,
    summary="Search and list patients",
    description="Available to doctors and admins. Supports search and filters.",
)
def list_patients(
    search: str | None = Query(default=None, description="Search by name, email, or phone"),
    gender: str | None = Query(default=None),
    blood_group: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(RoleName.DOCTOR, RoleName.ADMIN)),
    __: str = Security(security_scheme),
) -> PatientListResponse:
    items, total = patient_service.search_patients(
        db,
        search=search,
        gender=gender,
        blood_group=blood_group,
        page=page,
        page_size=page_size,
    )
    return PatientListResponse(items=items, total=total, page=page, page_size=page_size)


@router.get(
    "/{patient_id}",
    response_model=PatientResponse,
    summary="Get patient details",
    description="Doctors and admins can view full patient profile.",
)
def get_patient_details(
    patient_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(RoleName.DOCTOR, RoleName.ADMIN)),
    __: str = Security(security_scheme),
) -> PatientResponse:
    return patient_service.get_patient_by_id(db, patient_id)
