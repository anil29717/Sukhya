from fastapi import APIRouter, Depends, File, Query, Request, Security, UploadFile, status
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_roles, security_scheme
from app.core.storage import storage_service
from app.models import RoleName, User
from app.schemas.auth import MessageResponse
from app.schemas.medical import (
    PrescriptionCreateRequest,
    PrescriptionListResponse,
    PrescriptionResponse,
    PrescriptionUpdateRequest,
)
from app.services import doctor_service, prescription_service

router = APIRouter(prefix="/prescriptions", tags=["Prescriptions"])


def _to_response(p) -> PrescriptionResponse:
    return PrescriptionResponse(**prescription_service.prescription_to_dict(p))


@router.post(
    "",
    response_model=PrescriptionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create prescription",
)
def create_prescription(
    data: PrescriptionCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleName.DOCTOR)),
    _: str = Security(security_scheme),
) -> PrescriptionResponse:
    doctor = doctor_service.get_doctor_by_user_id(db, current_user.id)
    prescription = prescription_service.create_prescription(db, doctor, data)
    return _to_response(prescription)


@router.get(
    "",
    response_model=PrescriptionListResponse,
    summary="List prescriptions",
)
def list_prescriptions(
    patient_id: int | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleName.PATIENT, RoleName.DOCTOR, RoleName.ADMIN)),
    _: str = Security(security_scheme),
) -> PrescriptionListResponse:
    items, total = prescription_service.list_prescriptions(
        db, current_user, patient_id=patient_id, page=page, page_size=page_size
    )
    return PrescriptionListResponse(
        items=[_to_response(p) for p in items], total=total, page=page, page_size=page_size
    )


@router.get(
    "/{prescription_id}",
    response_model=PrescriptionResponse,
    summary="Get prescription details",
)
def get_prescription(
    prescription_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleName.PATIENT, RoleName.DOCTOR, RoleName.ADMIN)),
    _: str = Security(security_scheme),
) -> PrescriptionResponse:
    ip = request.client.host if request.client else None
    prescription = prescription_service.get_prescription(db, prescription_id, current_user, ip_address=ip)
    return _to_response(prescription)


@router.put(
    "/{prescription_id}",
    response_model=PrescriptionResponse,
    summary="Edit prescription",
)
def update_prescription(
    prescription_id: int,
    data: PrescriptionUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleName.DOCTOR)),
    _: str = Security(security_scheme),
) -> PrescriptionResponse:
    doctor = doctor_service.get_doctor_by_user_id(db, current_user.id)
    prescription = prescription_service.update_prescription(db, prescription_id, doctor, data)
    return _to_response(prescription)


@router.post(
    "/{prescription_id}/share",
    response_model=PrescriptionResponse,
    summary="Share prescription with patient",
)
def share_prescription(
    prescription_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleName.DOCTOR)),
    _: str = Security(security_scheme),
) -> PrescriptionResponse:
    doctor = doctor_service.get_doctor_by_user_id(db, current_user.id)
    prescription = prescription_service.share_prescription(db, prescription_id, doctor)
    return _to_response(prescription)


@router.post(
    "/{prescription_id}/upload",
    response_model=PrescriptionResponse,
    summary="Upload prescription document",
)
async def upload_prescription_document(
    prescription_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleName.DOCTOR)),
    _: str = Security(security_scheme),
) -> PrescriptionResponse:
    doctor = doctor_service.get_doctor_by_user_id(db, current_user.id)
    prescription = prescription_service.attach_document(db, prescription_id, doctor, file, current_user)
    return _to_response(prescription)


@router.get(
    "/{prescription_id}/download",
    summary="Download prescription document",
)
def download_prescription(
    prescription_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleName.PATIENT, RoleName.DOCTOR, RoleName.ADMIN)),
    _: str = Security(security_scheme),
):
    ip = request.client.host if request.client else None
    prescription = prescription_service.get_prescription(db, prescription_id, current_user, ip_address=ip)
    if not prescription.document_record:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="No document attached")

    content, _ = storage_service.read_file(prescription.document_record.storage_key)
    return Response(
        content=content,
        media_type=prescription.document_record.mime_type,
        headers={
            "Content-Disposition": f'attachment; filename="{prescription.document_record.file_name}"'
        },
    )
