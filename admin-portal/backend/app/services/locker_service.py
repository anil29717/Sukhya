from sqlalchemy.orm import Session, joinedload

from app.models import AuditLog, MedicalRecord, RecordDownloadLog, RoleName, User
from app.services.family_service import can_guardian_access_dependent, get_guardian_patient, patient_display_name
from app.services.timeline_service import resolve_patient_access


def log_download(
    db: Session,
    user: User,
    record: MedicalRecord,
    *,
    ip_address: str | None = None,
) -> RecordDownloadLog:
    log = RecordDownloadLog(
        user_id=user.id,
        patient_id=record.patient_id,
        medical_record_id=record.id,
        ip_address=ip_address,
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


def locker_summary(db: Session, user: User, patient_id: int | None = None) -> dict:
    patient = resolve_patient_access(db, user, patient_id)
    records = db.query(MedicalRecord).filter(MedicalRecord.patient_id == patient.id).all()
    by_type: dict[str, int] = {}
    for rec in records:
        by_type[rec.record_type] = by_type.get(rec.record_type, 0) + 1

    downloads = (
        db.query(RecordDownloadLog).filter(RecordDownloadLog.patient_id == patient.id).count()
    )
    record_ids = {str(r.id) for r in records}
    access_logs = (
        db.query(AuditLog)
        .filter(AuditLog.resource == "medical_record")
        .order_by(AuditLog.created_at.desc())
        .limit(1000)
        .all()
    )
    access_for_patient = sum(
        1
        for log in access_logs
        if log.details and any(rid in log.details for rid in record_ids)
    )

    shared = False
    if user.role.name == RoleName.PATIENT.value:
        guardian = get_guardian_patient(db, user)
        if patient.id != guardian.id:
            shared = can_guardian_access_dependent(db, guardian, patient.id)

    return {
        "patient_id": patient.id,
        "total_records": len(records),
        "by_type": by_type,
        "total_downloads": downloads,
        "total_access_events": access_for_patient,
        "shared_with_family": shared,
    }


def list_download_history(
    db: Session, user: User, *, patient_id: int | None = None, page: int = 1, page_size: int = 20
) -> tuple[list[dict], int]:
    patient = resolve_patient_access(db, user, patient_id)
    query = (
        db.query(RecordDownloadLog)
        .options(joinedload(RecordDownloadLog.medical_record), joinedload(RecordDownloadLog.user))
        .filter(RecordDownloadLog.patient_id == patient.id)
        .order_by(RecordDownloadLog.downloaded_at.desc())
    )
    total = query.count()
    logs = query.offset((page - 1) * page_size).limit(page_size).all()
    items = [
        {
            "id": log.id,
            "medical_record_id": log.medical_record_id,
            "record_title": log.medical_record.title if log.medical_record else "Unknown",
            "record_type": log.medical_record.record_type if log.medical_record else "",
            "downloaded_at": log.downloaded_at,
            "downloaded_by": log.user.full_name if log.user else None,
        }
        for log in logs
    ]
    return items, total


def list_access_logs(
    db: Session, user: User, *, patient_id: int | None = None, page: int = 1, page_size: int = 20
) -> tuple[list[dict], int]:
    patient = resolve_patient_access(db, user, patient_id)
    record_ids = [
        row[0]
        for row in db.query(MedicalRecord.id).filter(MedicalRecord.patient_id == patient.id).all()
    ]
    if not record_ids:
        return [], 0

    all_logs = (
        db.query(AuditLog)
        .filter(AuditLog.resource == "medical_record")
        .order_by(AuditLog.created_at.desc())
        .limit(500)
        .all()
    )
    filtered = [a for a in all_logs if a.details and any(str(rid) in a.details for rid in record_ids)]
    total = len(filtered)
    page_logs = filtered[(page - 1) * page_size : page * page_size]
    return [
        {
            "id": log.id,
            "action": log.action,
            "resource": log.resource,
            "details": log.details,
            "user_id": log.user_id,
            "ip_address": log.ip_address,
            "created_at": log.created_at,
        }
        for log in page_logs
    ], total


def list_family_shared_records(db: Session, user: User) -> list[dict]:
    from app.models import FamilyMember

    guardian = get_guardian_patient(db, user)
    members = (
        db.query(FamilyMember)
        .options(joinedload(FamilyMember.dependent_patient))
        .filter(
            FamilyMember.guardian_patient_id == guardian.id,
            FamilyMember.is_active.is_(True),
            FamilyMember.can_share_records.is_(True),
        )
        .all()
    )
    results = []
    for member in members:
        records = (
            db.query(MedicalRecord)
            .filter(MedicalRecord.patient_id == member.dependent_patient_id)
            .order_by(MedicalRecord.created_at.desc())
            .limit(10)
            .all()
        )
        results.append(
            {
                "family_member_id": member.id,
                "patient_name": patient_display_name(member.dependent_patient),
                "relationship": member.relation_type,
                "records": [
                    {
                        "id": r.id,
                        "title": r.title,
                        "record_type": r.record_type,
                        "created_at": r.created_at,
                    }
                    for r in records
                ],
            }
        )
    return results
