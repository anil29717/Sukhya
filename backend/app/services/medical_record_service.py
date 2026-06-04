import os
from pathlib import PurePosixPath

from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session, joinedload

from app.core.audit import log_audit
from app.core.config import get_settings
from app.core.storage import storage_service
from app.models import (
    ALLOWED_EXTENSIONS,
    ALLOWED_MIME_TYPES,
    Appointment,
    MedicalRecord,
    Patient,
    RECORD_TYPE_FOLDERS,
    RecordType,
    RoleName,
    User,
)
from app.services.notification_service import notify_report_uploaded

settings = get_settings()


def _validate_file(file: UploadFile, content: bytes) -> None:
    if len(content) > settings.max_upload_size_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File exceeds maximum size of {settings.MAX_UPLOAD_SIZE_MB}MB",
        )

    ext = PurePosixPath(file.filename or "").suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type not allowed. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
        )

    mime = file.content_type or "application/octet-stream"
    if mime not in ALLOWED_MIME_TYPES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"MIME type '{mime}' not allowed")


def _can_access_patient_records(db: Session, user: User, patient: Patient) -> bool:
    if user.role.name == RoleName.ADMIN.value:
        return True
    if user.role.name == RoleName.PATIENT.value:
        if patient.user_id == user.id:
            return True
        from app.services.family_service import can_guardian_access_dependent, get_guardian_patient

        try:
            guardian = get_guardian_patient(db, user)
            return can_guardian_access_dependent(db, guardian, patient.id)
        except HTTPException:
            return False
    if user.role.name == RoleName.DOCTOR.value:
        if patient.user_id == user.id:
            return True
        from app.models import Doctor

        doctor = db.query(Doctor).filter(Doctor.user_id == user.id).first()
        if doctor is None:
            return False
        has_appointment = (
            db.query(Appointment)
            .filter(
                Appointment.patient_id == patient.id,
                Appointment.doctor_id == doctor.id,
            )
            .first()
        )
        return has_appointment is not None
    return False


def upload_record(
    db: Session,
    user: User,
    *,
    patient_id: int,
    record_type: str,
    title: str,
    description: str | None,
    appointment_id: int | None,
    file: UploadFile,
    ip_address: str | None = None,
) -> MedicalRecord:
    try:
        RecordType(record_type)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid record_type") from exc

    patient = db.query(Patient).options(joinedload(Patient.user)).filter(Patient.id == patient_id).first()
    if patient is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")

    if user.role.name == RoleName.PATIENT.value:
        if patient.user_id != user.id and not _can_access_patient_records(db, user, patient):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Cannot upload for this patient"
            )

    if user.role.name == RoleName.DOCTOR.value:
        if not _can_access_patient_records(db, user, patient):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No access to this patient")

    content = file.file.read()
    _validate_file(file, content)

    folder = RECORD_TYPE_FOLDERS[record_type]
    storage_key = storage_service.build_storage_key(folder, patient_id, file.filename or "document")
    storage_service.save_file(storage_key, content, file.content_type or "application/octet-stream")

    record = MedicalRecord(
        patient_id=patient_id,
        uploaded_by_user_id=user.id,
        appointment_id=appointment_id,
        record_type=record_type,
        title=title,
        description=description,
        file_name=file.filename or "document",
        storage_key=storage_key,
        file_size=len(content),
        mime_type=file.content_type or "application/octet-stream",
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    log_audit(
        db,
        user_id=user.id,
        action="upload",
        resource="medical_record",
        details=f"Uploaded record {record.id} for patient {patient_id}",
        ip_address=ip_address,
    )
    notify_report_uploaded(db, patient.user, title)
    return record


def get_record(db: Session, record_id: int, user: User, ip_address: str | None = None) -> MedicalRecord:
    record = (
        db.query(MedicalRecord)
        .options(joinedload(MedicalRecord.patient).joinedload(Patient.user))
        .filter(MedicalRecord.id == record_id)
        .first()
    )
    if record is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Record not found")

    if not _can_access_patient_records(db, user, record.patient):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    log_audit(
        db,
        user_id=user.id,
        action="view",
        resource="medical_record",
        details=f"Viewed record {record.id}",
        ip_address=ip_address,
    )
    return record


def list_records(
    db: Session,
    user: User,
    *,
    patient_id: int | None = None,
    record_type: str | None = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[MedicalRecord], int]:
    query = db.query(MedicalRecord).options(joinedload(MedicalRecord.patient))

    if user.role.name == RoleName.PATIENT.value:
        from app.models import FamilyMember
        from app.services.family_service import get_guardian_patient

        guardian = get_guardian_patient(db, user)
        dependent_ids = [
            row[0]
            for row in db.query(FamilyMember.dependent_patient_id)
            .filter(
                FamilyMember.guardian_patient_id == guardian.id,
                FamilyMember.is_active.is_(True),
                FamilyMember.can_share_records.is_(True),
            )
            .all()
        ]
        accessible_ids = [guardian.id, *dependent_ids]
        query = query.filter(MedicalRecord.patient_id.in_(accessible_ids))
    elif user.role.name == RoleName.DOCTOR.value:
        if patient_id:
            patient = db.query(Patient).filter(Patient.id == patient_id).first()
            if patient is None or not _can_access_patient_records(db, user, patient):
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
            query = query.filter(MedicalRecord.patient_id == patient_id)
        else:
            from app.models import Doctor

            doctor = db.query(Doctor).filter(Doctor.user_id == user.id).first()
            if doctor is None:
                return [], 0
            patient_ids = [
                row[0]
                for row in db.query(Appointment.patient_id)
                .filter(Appointment.doctor_id == doctor.id)
                .distinct()
                .all()
            ]
            if not patient_ids:
                return [], 0
            query = query.filter(MedicalRecord.patient_id.in_(patient_ids))
    elif user.role.name == RoleName.ADMIN.value:
        if patient_id:
            query = query.filter(MedicalRecord.patient_id == patient_id)

    if record_type:
        query = query.filter(MedicalRecord.record_type == record_type)

    total = query.count()
    records = (
        query.order_by(MedicalRecord.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return records, total


def delete_record(db: Session, record_id: int, user: User, ip_address: str | None = None) -> None:
    record = db.query(MedicalRecord).options(joinedload(MedicalRecord.patient)).filter(MedicalRecord.id == record_id).first()
    if record is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Record not found")

    if user.role.name not in {RoleName.ADMIN.value, RoleName.DOCTOR.value}:
        if user.role.name != RoleName.PATIENT.value or record.patient.user_id != user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    storage_service.delete_file(record.storage_key)
    db.delete(record)
    db.commit()

    log_audit(
        db,
        user_id=user.id,
        action="delete",
        resource="medical_record",
        details=f"Deleted record {record_id}",
        ip_address=ip_address,
    )


def record_to_dict(record: MedicalRecord) -> dict:
    return {
        "id": record.id,
        "patient_id": record.patient_id,
        "uploaded_by_user_id": record.uploaded_by_user_id,
        "appointment_id": record.appointment_id,
        "record_type": record.record_type,
        "title": record.title,
        "description": record.description,
        "file_name": record.file_name,
        "file_size": record.file_size,
        "mime_type": record.mime_type,
        "download_url": storage_service.get_download_url(record.storage_key),
        "created_at": record.created_at,
        "updated_at": record.updated_at,
    }
