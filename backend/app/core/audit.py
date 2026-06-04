from sqlalchemy.orm import Session

from app.models import AuditLog, User


def log_audit(
    db: Session,
    *,
    user_id: int | None,
    action: str,
    resource: str,
    details: str | None = None,
    ip_address: str | None = None,
) -> None:
    db.add(
        AuditLog(
            user_id=user_id,
            action=action,
            resource=resource,
            details=details,
            ip_address=ip_address,
        )
    )
    db.commit()
