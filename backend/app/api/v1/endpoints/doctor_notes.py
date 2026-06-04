from fastapi import APIRouter, Depends, Query, Security, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_roles, security_scheme
from app.models import RoleName, User
from app.schemas.clinical import DoctorNoteCreateRequest, DoctorNoteResponse, DoctorNoteUpdateRequest
from app.services import doctor_note_service

router = APIRouter(prefix="/doctor-notes", tags=["Doctor Notes (Premium)"])


@router.get("", response_model=list[DoctorNoteResponse], summary="List doctor notes")
def list_notes(
    patient_id: int | None = Query(default=None),
    appointment_id: int | None = Query(default=None),
    note_type: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleName.DOCTOR, RoleName.PATIENT, RoleName.ADMIN)),
    _: str = Security(security_scheme),
) -> list[DoctorNoteResponse]:
    items, _ = doctor_note_service.list_notes(
        db,
        current_user,
        patient_id=patient_id,
        appointment_id=appointment_id,
        note_type=note_type,
        page=page,
        page_size=page_size,
    )
    return [DoctorNoteResponse(**item) for item in items]


@router.post(
    "",
    response_model=DoctorNoteResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create consultation note",
)
def create_note(
    data: DoctorNoteCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleName.DOCTOR)),
    _: str = Security(security_scheme),
) -> DoctorNoteResponse:
    note = doctor_note_service.create_note(db, current_user, data)
    return DoctorNoteResponse(**doctor_note_service._note_to_dict(note))


@router.get("/{note_id}", response_model=DoctorNoteResponse, summary="Get note")
def get_note(
    note_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleName.DOCTOR, RoleName.PATIENT, RoleName.ADMIN)),
    _: str = Security(security_scheme),
) -> DoctorNoteResponse:
    return DoctorNoteResponse(**doctor_note_service.get_note(db, current_user, note_id))


@router.put("/{note_id}", response_model=DoctorNoteResponse, summary="Update note")
def update_note(
    note_id: int,
    data: DoctorNoteUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleName.DOCTOR)),
    _: str = Security(security_scheme),
) -> DoctorNoteResponse:
    note = doctor_note_service.update_note(db, current_user, note_id, data)
    return DoctorNoteResponse(**doctor_note_service._note_to_dict(note))


@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete note")
def delete_note(
    note_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleName.DOCTOR)),
    _: str = Security(security_scheme),
) -> None:
    doctor_note_service.delete_note(db, current_user, note_id)
