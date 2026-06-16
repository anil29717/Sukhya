from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.models import Doctor, RoleName, User
from app.models.clinical import DoctorNote
from app.models.clinical import NoteType
from app.schemas.clinical import DoctorNoteCreateRequest, DoctorNoteUpdateRequest
from app.services.clinical_access import doctor_can_access_patient, get_doctor_profile, validate_appointment_for_doctor


def _note_to_dict(note: DoctorNote, *, include_content: bool = True) -> dict:
    doctor_name = note.doctor.user.full_name if note.doctor and note.doctor.user else None
    return {
        "id": note.id,
        "doctor_id": note.doctor_id,
        "doctor_name": doctor_name,
        "patient_id": note.patient_id,
        "appointment_id": note.appointment_id,
        "note_type": note.note_type,
        "title": note.title,
        "content": note.content if include_content else "[private]",
        "is_private": note.is_private,
        "created_at": note.created_at,
        "updated_at": note.updated_at,
    }


def _validate_note_type(note_type: str) -> None:
    try:
        NoteType(note_type)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid note_type") from exc


def create_note(db: Session, user: User, data: DoctorNoteCreateRequest) -> DoctorNote:
    doctor = get_doctor_profile(db, user)
    _validate_note_type(data.note_type)
    doctor_can_access_patient(db, doctor, data.patient_id)
    validate_appointment_for_doctor(db, doctor, data.appointment_id, data.patient_id)

    is_private = data.is_private or data.note_type == NoteType.PRIVATE.value
    note = DoctorNote(
        doctor_id=doctor.id,
        patient_id=data.patient_id,
        appointment_id=data.appointment_id,
        note_type=data.note_type,
        title=data.title,
        content=data.content,
        is_private=is_private,
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    return _load_note(db, note.id)


def update_note(db: Session, user: User, note_id: int, data: DoctorNoteUpdateRequest) -> DoctorNote:
    note = _get_note_for_doctor(db, user, note_id)
    if data.note_type is not None:
        _validate_note_type(data.note_type)
        note.note_type = data.note_type
    if data.title is not None:
        note.title = data.title
    if data.content is not None:
        note.content = data.content
    if data.is_private is not None:
        note.is_private = data.is_private
    if data.appointment_id is not None:
        validate_appointment_for_doctor(db, note.doctor, data.appointment_id, note.patient_id)
        note.appointment_id = data.appointment_id
    if note.note_type == NoteType.PRIVATE.value:
        note.is_private = True
    db.commit()
    return _load_note(db, note.id)


def delete_note(db: Session, user: User, note_id: int) -> None:
    note = _get_note_for_doctor(db, user, note_id)
    db.delete(note)
    db.commit()


def _get_note_for_doctor(db: Session, user: User, note_id: int) -> DoctorNote:
    doctor = get_doctor_profile(db, user)
    note = (
        db.query(DoctorNote)
        .options(joinedload(DoctorNote.doctor).joinedload(Doctor.user))
        .filter(DoctorNote.id == note_id, DoctorNote.doctor_id == doctor.id)
        .first()
    )
    if note is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
    return note


def _load_note(db: Session, note_id: int) -> DoctorNote:
    return (
        db.query(DoctorNote)
        .options(joinedload(DoctorNote.doctor).joinedload(Doctor.user))
        .filter(DoctorNote.id == note_id)
        .first()
    )


def get_note(db: Session, user: User, note_id: int) -> dict:
    if user.role.name == RoleName.DOCTOR.value:
        note = _get_note_for_doctor(db, user, note_id)
        return _note_to_dict(note)
    if user.role.name == RoleName.PATIENT.value:
        note = (
            db.query(DoctorNote)
            .options(joinedload(DoctorNote.doctor).joinedload(Doctor.user))
            .filter(DoctorNote.id == note_id)
            .first()
        )
        if note is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
        from app.services.family_service import get_guardian_patient

        guardian = get_guardian_patient(db, user)
        if note.patient_id != guardian.id or note.is_private:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        return _note_to_dict(note)
    if user.role.name == RoleName.ADMIN.value:
        note = _load_note(db, note_id)
        if not note:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
        return _note_to_dict(note)
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")


def list_notes(
    db: Session,
    user: User,
    *,
    patient_id: int | None = None,
    appointment_id: int | None = None,
    note_type: str | None = None,
    page: int = 1,
    page_size: int = 50,
) -> tuple[list[dict], int]:
    query = db.query(DoctorNote).options(joinedload(DoctorNote.doctor).joinedload(Doctor.user))

    if user.role.name == RoleName.DOCTOR.value:
        doctor = get_doctor_profile(db, user)
        query = query.filter(DoctorNote.doctor_id == doctor.id)
        if patient_id:
            doctor_can_access_patient(db, doctor, patient_id)
            query = query.filter(DoctorNote.patient_id == patient_id)
    elif user.role.name == RoleName.PATIENT.value:
        from app.services.family_service import get_guardian_patient

        guardian = get_guardian_patient(db, user)
        if patient_id and patient_id != guardian.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        query = query.filter(DoctorNote.patient_id == guardian.id, DoctorNote.is_private.is_(False))
    elif user.role.name == RoleName.ADMIN.value:
        if patient_id:
            query = query.filter(DoctorNote.patient_id == patient_id)
    else:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    if appointment_id:
        query = query.filter(DoctorNote.appointment_id == appointment_id)
    if note_type:
        query = query.filter(DoctorNote.note_type == note_type)

    total = query.count()
    notes = (
        query.order_by(DoctorNote.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return [_note_to_dict(n) for n in notes], total
