from typing import Optional, Dict, Any
from sqlalchemy.orm import Session

from app.models.audit import AuditLog


class AuditService:
    """Records human review actions, status changes, and system events for compliance auditing."""

    @staticmethod
    def log_event(
        db: Session,
        action: str,
        entity_type: str,
        entity_id: str,
        user_id: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None
    ) -> AuditLog:
        entry = AuditLog(
            user_id=user_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            details=details or {},
            ip_address=ip_address
        )
        db.add(entry)
        db.commit()
        return entry
