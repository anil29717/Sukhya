from __future__ import annotations

import re
from urllib.parse import urlparse

from fastapi import HTTPException, status
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import Session

from app.core.audit import log_audit
from app.core.config import get_settings

settings = get_settings()

# Tables in FK-safe copy order (subset of app schema)
COPYABLE_TABLES = [
    "roles",
    "users",
    "patients",
    "doctors",
    "doctor_availability",
    "doctor_leaves",
    "appointments",
    "medical_records",
    "prescriptions",
    "medications",
    "medication_schedules",
    "medication_logs",
    "vital_signs",
    "notifications",
    "doctor_notes",
    "follow_ups",
    "family_members",
    "emergency_profiles",
    "health_timeline_events",
    "audit_logs",
]


def _mask_url(url: str) -> str:
    return re.sub(r":([^:@/]+)@", ":***@", url)


def _require_enabled() -> None:
    if not settings.ADMIN_DB_COPY_ENABLED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Database copy is disabled. Set ADMIN_DB_COPY_ENABLED=true to enable.",
        )


def test_connection(source_url: str) -> dict:
    _require_enabled()
    try:
        engine = create_engine(source_url, pool_pre_ping=True)
        inspector = inspect(engine)
        table_names = inspector.get_table_names()
        tables = []
        with engine.connect() as conn:
            for name in sorted(table_names):
                try:
                    count = conn.execute(text(f'SELECT COUNT(*) FROM "{name}"')).scalar() or 0
                except Exception:
                    count = -1
                tables.append({
                    "name": name,
                    "row_count": count,
                    "copyable": name in COPYABLE_TABLES,
                })
        engine.dispose()
        return {"ok": True, "message": "Connection successful", "tables": tables}
    except Exception as exc:
        return {"ok": False, "message": str(exc)[:500], "tables": []}


def copy_tables(
    db: Session,
    *,
    admin_user_id: int,
    source_url: str,
    tables: list[str],
    mode: str,
    ip_address: str | None = None,
) -> dict:
    _require_enabled()

    invalid = [t for t in tables if t not in COPYABLE_TABLES]
    if invalid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Tables not allowed for copy: {invalid}",
        )

    ordered = [t for t in COPYABLE_TABLES if t in tables]
    target_engine = db.get_bind()
    source_engine = create_engine(source_url, pool_pre_ping=True)
    results = []

    log_audit(
        db,
        user_id=admin_user_id,
        action="database_copy",
        resource="database",
        details=f"mode={mode} tables={ordered} source={_mask_url(source_url)}",
        ip_address=ip_address,
    )

    try:
        with source_engine.connect() as src_conn, target_engine.connect() as tgt_conn:
            for table in ordered:
                copied = 0
                skipped = 0
                errors: list[str] = []
                try:
                    if mode == "replace":
                        tgt_conn.execute(text(f'TRUNCATE TABLE "{table}" RESTART IDENTITY CASCADE'))
                        tgt_conn.commit()

                    rows = src_conn.execute(text(f'SELECT * FROM "{table}"')).mappings().all()
                    if not rows:
                        results.append({"table": table, "copied": 0, "skipped": 0, "errors": []})
                        continue

                    columns = list(rows[0].keys())
                    col_list = ", ".join(f'"{c}"' for c in columns)
                    placeholders = ", ".join(f":{c}" for c in columns)

                    for row in rows:
                        try:
                            if mode == "merge":
                                tgt_conn.execute(
                                    text(
                                        f'INSERT INTO "{table}" ({col_list}) VALUES ({placeholders}) '
                                        f'ON CONFLICT DO NOTHING'
                                    ),
                                    dict(row),
                                )
                            else:
                                tgt_conn.execute(
                                    text(f'INSERT INTO "{table}" ({col_list}) VALUES ({placeholders})'),
                                    dict(row),
                                )
                            copied += 1
                        except Exception as row_exc:
                            skipped += 1
                            if len(errors) < 5:
                                errors.append(str(row_exc)[:150])
                    tgt_conn.commit()
                except Exception as table_exc:
                    tgt_conn.rollback()
                    errors.append(str(table_exc)[:200])
                results.append({"table": table, "copied": copied, "skipped": skipped, "errors": errors})
    finally:
        source_engine.dispose()

    success = all(len(r["errors"]) == 0 for r in results)
    return {"success": success, "results": results}
