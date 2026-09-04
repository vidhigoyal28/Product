import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, JSON, Enum as SQLEnum, ForeignKey
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.enums import ReportType


class Report(Base):
    __tablename__ = "reports"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    report_code = Column(String(100), unique=True, nullable=False, index=True) # e.g. "REP-INSP-2026-0891"
    inspection_id = Column(String(36), ForeignKey("inspections.id", ondelete="CASCADE"), nullable=False)
    report_type = Column(SQLEnum(ReportType), default=ReportType.FORM_II_STATUTORY_NOTICE, nullable=False)
    
    generated_by_id = Column(String(36), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    summary_data = Column(JSON, nullable=False) # Full snapshot of inspection, violations, declarations, signatures
    file_path = Column(String(500), nullable=True) # PDF/HTML export location if rendered
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    inspection = relationship("Inspection", back_populates="reports")
    generated_by = relationship("User", back_populates="reports_generated", foreign_keys=[generated_by_id])
