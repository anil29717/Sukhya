import json

from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session, joinedload

from app.core.audit import log_audit
from app.models import Doctor, MedicalRecord, Patient, Prescription, PrescriptionStatus, RoleName, User
from app.schemas.medical import MedicationItem, PrescriptionCreateRequest, PrescriptionUpdateRequest
from app.services import medical_record_service
from app.services.notification_service import notify_prescription_shared


def _medications_to_json(items: list[MedicationItem]) -> str:
    return json.dumps([item.model_dump() for item in items])


def _medications_from_json(raw: str | None) -> list[MedicationItem]:
    if not raw:
        return []
    data = json.loads(raw)
    return [MedicationItem(**item) for item in data]


def create_prescription(db: Session, doctor: Doctor, data: PrescriptionCreateRequest) -> Prescription:
    patient = db.query(Patient).options(joinedload(Patient.user)).filter(Patient.id == data.patient_id).first()
    if patient is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")

    prescription = Prescription(
        patient_id=data.patient_id,
        doctor_id=doctor.id,
        appointment_id=data.appointment_id,
        diagnosis=data.diagnosis,
        medications=_medications_to_json(data.medications),
        instructions=data.instructions,
        status=PrescriptionStatus.DRAFT.value,
    )
    db.add(prescription)
    db.commit()
    db.refresh(prescription)
    return _load_prescription(db, prescription.id)


def update_prescription(db: Session, prescription_id: int, doctor: Doctor, data: PrescriptionUpdateRequest) -> Prescription:
    prescription = _get_doctor_prescription(db, prescription_id, doctor)

    if data.diagnosis is not None:
        prescription.diagnosis = data.diagnosis
    if data.medications is not None:
        prescription.medications = _medications_to_json(data.medications)
    if data.instructions is not None:
        prescription.instructions = data.instructions
    if data.appointment_id is not None:
        prescription.appointment_id = data.appointment_id

    db.commit()
    return _load_prescription(db, prescription.id)


def share_prescription(db: Session, prescription_id: int, doctor: Doctor) -> Prescription:
    prescription = _get_doctor_prescription(db, prescription_id, doctor)
    prescription.status = PrescriptionStatus.SHARED.value
    db.commit()
    prescription = _load_prescription(db, prescription.id)
    notify_prescription_shared(db, prescription.patient.user, prescription.doctor.user.full_name)
    return prescription


def attach_document(
    db: Session,
    prescription_id: int,
    doctor: Doctor,
    file: UploadFile,
    user: User,
) -> Prescription:
    prescription = _get_doctor_prescription(db, prescription_id, doctor)
    record = medical_record_service.upload_record(
        db,
        user,
        patient_id=prescription.patient_id,
        record_type="prescription",
        title=f"Prescription #{prescription.id}",
        description=prescription.diagnosis,
        appointment_id=prescription.appointment_id,
        file=file,
    )
    prescription.document_record_id = record.id
    db.commit()
    return _load_prescription(db, prescription.id)


def _get_doctor_prescription(db: Session, prescription_id: int, doctor: Doctor) -> Prescription:
    prescription = db.query(Prescription).filter(
        Prescription.id == prescription_id, Prescription.doctor_id == doctor.id
    ).first()
    if prescription is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prescription not found")
    return prescription


def _load_prescription(db: Session, prescription_id: int) -> Prescription:
    prescription = (
        db.query(Prescription)
        .options(
            joinedload(Prescription.patient).joinedload(Patient.user),
            joinedload(Prescription.doctor).joinedload(Doctor.user),
            joinedload(Prescription.document_record),
        )
        .filter(Prescription.id == prescription_id)
        .first()
    )
    if prescription is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prescription not found")
    return prescription


def get_prescription(db: Session, prescription_id: int, user: User, ip_address: str | None = None) -> Prescription:
    prescription = _load_prescription(db, prescription_id)

    if user.role.name == RoleName.ADMIN.value:
        pass
    elif user.role.name == RoleName.DOCTOR.value:
        if prescription.doctor.user_id != user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    elif user.role.name == RoleName.PATIENT.value:
        if prescription.patient.user_id != user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        if prescription.status != PrescriptionStatus.SHARED.value:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Prescription not shared yet")
    else:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    log_audit(
        db,
        user_id=user.id,
        action="view",
        resource="prescription",
        details=f"Viewed prescription {prescription_id}",
        ip_address=ip_address,
    )
    return prescription


def list_prescriptions(
    db: Session,
    user: User,
    *,
    patient_id: int | None = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[Prescription], int]:
    query = db.query(Prescription).options(
        joinedload(Prescription.patient).joinedload(Patient.user),
        joinedload(Prescription.doctor).joinedload(Doctor.user),
        joinedload(Prescription.document_record),
    )

    if user.role.name == RoleName.PATIENT.value:
        patient = db.query(Patient).filter(Patient.user_id == user.id).first()
        if patient is None:
            return [], 0
        query = query.filter(
            Prescription.patient_id == patient.id,
            Prescription.status == PrescriptionStatus.SHARED.value,
        )
    elif user.role.name == RoleName.DOCTOR.value:
        doctor = db.query(Doctor).filter(Doctor.user_id == user.id).first()
        if doctor is None:
            return [], 0
        query = query.filter(Prescription.doctor_id == doctor.id)
        if patient_id:
            query = query.filter(Prescription.patient_id == patient_id)
    elif user.role.name == RoleName.ADMIN.value:
        if patient_id:
            query = query.filter(Prescription.patient_id == patient_id)

    total = query.count()
    items = (
        query.order_by(Prescription.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return items, total


def prescription_to_dict(prescription: Prescription) -> dict:
    download_url = None
    if prescription.document_record:
        from app.core.storage import storage_service

        download_url = storage_service.get_download_url(prescription.document_record.storage_key)

    return {
        "id": prescription.id,
        "patient_id": prescription.patient_id,
        "doctor_id": prescription.doctor_id,
        "appointment_id": prescription.appointment_id,
        "diagnosis": prescription.diagnosis,
        "medications": [m.model_dump() for m in _medications_from_json(prescription.medications)],
        "instructions": prescription.instructions,
        "document_record_id": prescription.document_record_id,
        "status": prescription.status,
        "download_url": download_url,
        "created_at": prescription.created_at,
        "updated_at": prescription.updated_at,
        "patient_name": prescription.patient.user.full_name if prescription.patient else None,
        "doctor_name": prescription.doctor.user.full_name if prescription.doctor else None,
    }
