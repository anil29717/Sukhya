from fastapi import APIRouter, Depends, File, Form, Query, Request, Security, UploadFile, status
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_roles, security_scheme
from app.core.storage import storage_service
from app.models import RoleName, User
from app.schemas.medical import MedicalRecordListResponse, MedicalRecordResponse
from app.services import medical_record_service

router = APIRouter(prefix="/medical-records", tags=["Medical Records (EHR)"])


def _to_response(record) -> MedicalRecordResponse:
    return MedicalRecordResponse(**medical_record_service.record_to_dict(record))


@router.post(
    "",
    response_model=MedicalRecordResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload medical record",
)
async def upload_medical_record(
    request: Request,
    patient_id: int = Form(...),
    record_type: str = Form(...),
    title: str = Form(...),
    description: str | None = Form(default=None),
    appointment_id: int | None = Form(default=None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleName.PATIENT, RoleName.DOCTOR, RoleName.ADMIN)),
    _: str = Security(security_scheme),
) -> MedicalRecordResponse:
    ip = request.client.host if request.client else None
    record = medical_record_service.upload_record(
        db,
        current_user,
        patient_id=patient_id,
        record_type=record_type,
        title=title,
        description=description,
        appointment_id=appointment_id,
        file=file,
        ip_address=ip,
    )
    return _to_response(record)


@router.get(
    "",
    response_model=MedicalRecordListResponse,
    summary="List medical records",
)
def list_medical_records(
    patient_id: int | None = Query(default=None),
    record_type: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleName.PATIENT, RoleName.DOCTOR, RoleName.ADMIN)),
    _: str = Security(security_scheme),
) -> MedicalRecordListResponse:
    items, total = medical_record_service.list_records(
        db, current_user, patient_id=patient_id, record_type=record_type, page=page, page_size=page_size
    )
    return MedicalRecordListResponse(
        items=[_to_response(r) for r in items], total=total, page=page, page_size=page_size
    )


@router.get(
    "/{record_id}",
    response_model=MedicalRecordResponse,
    summary="View medical record metadata",
)
def get_medical_record(
    record_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleName.PATIENT, RoleName.DOCTOR, RoleName.ADMIN)),
    _: str = Security(security_scheme),
) -> MedicalRecordResponse:
    ip = request.client.host if request.client else None
    record = medical_record_service.get_record(db, record_id, current_user, ip_address=ip)
    return _to_response(record)


@router.get(
    "/{record_id}/download",
    summary="Download medical record file",
)
def download_medical_record(
    record_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleName.PATIENT, RoleName.DOCTOR, RoleName.ADMIN)),
    _: str = Security(security_scheme),
):
    ip = request.client.host if request.client else None
    record = medical_record_service.get_record(db, record_id, current_user, ip_address=ip)
    from app.services.locker_service import log_download

    log_download(db, current_user, record, ip_address=ip)
    content, _ = storage_service.read_file(record.storage_key)
    return Response(
        content=content,
        media_type=record.mime_type,
        headers={"Content-Disposition": f'attachment; filename="{record.file_name}"'},
    )


@router.delete(
    "/{record_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete medical record",
)
def delete_medical_record(
    record_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleName.PATIENT, RoleName.DOCTOR, RoleName.ADMIN)),
    _: str = Security(security_scheme),
):
    ip = request.client.host if request.client else None
    medical_record_service.delete_record(db, record_id, current_user, ip_address=ip)


@router.get(
    "/files/{storage_key:path}",
    summary="Serve local storage file (dev mode)",
    include_in_schema=False,
)
def serve_local_file(
    storage_key: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleName.PATIENT, RoleName.DOCTOR, RoleName.ADMIN)),
    _: str = Security(security_scheme),
):
    from app.models import MedicalRecord

    record = db.query(MedicalRecord).filter(MedicalRecord.storage_key == storage_key).first()
    if record is None:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="File not found")

    medical_record_service.get_record(db, record.id, current_user)
    content, mime = storage_service.read_file(storage_key)
    return Response(content=content, media_type=mime or record.mime_type)
