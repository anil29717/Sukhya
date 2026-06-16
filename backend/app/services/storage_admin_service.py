from __future__ import annotations

import os
from pathlib import Path

from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.core.config import get_settings
from app.core.storage import CLOUDINARY_PREFIX, S3_PREFIX, storage_service
from app.models import MedicalRecord, Patient

settings = get_settings()


def _provider_from_key(storage_key: str) -> str:
    if storage_key.startswith(CLOUDINARY_PREFIX):
        return "cloudinary"
    if storage_key.startswith(S3_PREFIX):
        return "s3"
    return "local"


def get_storage_stats(db: Session) -> dict:
    records = db.query(MedicalRecord.storage_key, MedicalRecord.file_size, MedicalRecord.record_type).all()
    total_files = len(records)
    total_bytes = sum(r.file_size for r in records)

    by_record_type: dict[str, int] = {}
    by_provider: dict[str, int] = {}
    bytes_by_provider: dict[str, int] = {}

    for key, size, rtype in records:
        by_record_type[rtype] = by_record_type.get(rtype, 0) + 1
        provider = _provider_from_key(key)
        by_provider[provider] = by_provider.get(provider, 0) + 1
        bytes_by_provider[provider] = bytes_by_provider.get(provider, 0) + size

    return {
        "total_files": total_files,
        "total_bytes": total_bytes,
        "total_mb": round(total_bytes / (1024 * 1024), 2),
        "by_record_type": by_record_type,
        "by_provider": by_provider,
        "bytes_by_provider": bytes_by_provider,
    }


def _probe_cloudinary() -> tuple[str, str | None]:
    if not settings.cloudinary_configured:
        return "not_configured", "Cloudinary credentials not set"
    try:
        import cloudinary
        import cloudinary.api

        cloudinary.config(
            cloud_name=settings.CLOUDINARY_CLOUD_NAME,
            api_key=settings.CLOUDINARY_API_KEY,
            api_secret=settings.CLOUDINARY_API_SECRET,
            secure=True,
        )
        cloudinary.api.ping()
        return "online", None
    except Exception as exc:
        return "offline", str(exc)[:200]


def _probe_s3() -> tuple[str, str | None]:
    if not settings.s3_configured:
        return "not_configured", "S3 credentials or bucket not set"
    try:
        client = storage_service._s3_client()
        client.head_bucket(Bucket=settings.S3_BUCKET_NAME)
        return "online", None
    except Exception as exc:
        return "offline", str(exc)[:200]


def _probe_local() -> tuple[str, str | None]:
    try:
        root = Path(settings.LOCAL_STORAGE_PATH)
        root.mkdir(parents=True, exist_ok=True)
        test = root / ".write_test"
        test.write_text("ok")
        test.unlink(missing_ok=True)
        return "online", None
    except Exception as exc:
        return "offline", str(exc)[:200]


def get_storage_health() -> dict:
    providers = []

    c_status, c_msg = _probe_cloudinary()
    providers.append({
        "name": "cloudinary",
        "configured": settings.cloudinary_configured,
        "status": c_status if settings.cloudinary_configured else "not_configured",
        "message": c_msg,
    })

    s_status, s_msg = _probe_s3()
    providers.append({
        "name": "s3",
        "configured": settings.s3_configured,
        "status": s_status if settings.s3_configured else "not_configured",
        "message": s_msg,
    })

    l_status, l_msg = _probe_local()
    providers.append({
        "name": "local",
        "configured": True,
        "status": l_status,
        "message": l_msg,
    })

    return {
        "storage_backend": settings.STORAGE_BACKEND,
        "dual_write_s3": settings.STORAGE_DUAL_WRITE_S3,
        "cloudinary_configured": settings.cloudinary_configured,
        "s3_configured": settings.s3_configured,
        "providers": providers,
    }


def list_storage_files(
    db: Session,
    *,
    search: str | None = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[dict], int]:
    query = db.query(MedicalRecord).options(joinedload(MedicalRecord.patient).joinedload(Patient.user))

    if search:
        term = f"%{search.lower()}%"
        query = query.filter(
            func.lower(MedicalRecord.title).like(term)
            | func.lower(MedicalRecord.file_name).like(term)
        )

    total = query.count()
    items = (
        query.order_by(MedicalRecord.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    result = []
    for r in items:
        patient_name = r.patient.user.full_name if r.patient and r.patient.user else None
        try:
            download_url = storage_service.get_download_url(r.storage_key)
        except Exception:
            download_url = None
        result.append({
            "id": r.id,
            "patient_id": r.patient_id,
            "patient_name": patient_name,
            "title": r.title,
            "file_name": r.file_name,
            "mime_type": r.mime_type,
            "file_size": r.file_size,
            "record_type": r.record_type,
            "storage_key": r.storage_key,
            "provider": _provider_from_key(r.storage_key),
            "download_url": download_url,
            "created_at": r.created_at,
        })
    return result, total


def get_system_info() -> dict:
    db_url = settings.DATABASE_URL
    host_masked = "configured"
    try:
        if "@" in db_url:
            host_part = db_url.split("@", 1)[1].split("/")[0]
            host_masked = host_part[:20] + "..." if len(host_part) > 20 else host_part
    except Exception:
        host_masked = "unknown"

    return {
        "app_version": settings.APP_VERSION,
        "storage_backend": settings.STORAGE_BACKEND,
        "dual_write_s3": settings.STORAGE_DUAL_WRITE_S3,
        "db_copy_enabled": settings.ADMIN_DB_COPY_ENABLED,
        "database_host_masked": host_masked,
    }
