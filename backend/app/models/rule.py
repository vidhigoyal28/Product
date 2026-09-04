import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, JSON, Enum as SQLEnum, Text
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.enums import ValidationType, RuleSeverity


class Rule(Base):
    __tablename__ = "rules"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    rule_id = Column(String(100), unique=True, nullable=False, index=True) # e.g. "RULE-SCHEMA-001"
    
    source_document = Column(String(255), nullable=False)                  # e.g. "Legal Metrology (Packaged Commodities) Rules, 2011"
    rule_clause_reference = Column(String(150), nullable=False)            # e.g. "Applicable Rule Placeholder"
    version = Column(String(50), default="2011.1", nullable=False, index=True)
    
    effective_from = Column(DateTime, nullable=True)
    effective_to = Column(DateTime, nullable=True)
    
    requirement = Column(Text, nullable=False)                             # Text requirement description
    
    # Applicability conditions (JSON structure evaluated by ApplicabilityEvaluator)
    # { "categories": ["Food & Confectionery", ...], "package_types": [...], "is_imported": null, "exemptions": [] }
    applicability_conditions = Column(JSON, nullable=False, default=dict)
    
    validation_type = Column(SQLEnum(ValidationType), default=ValidationType.PRESENCE, nullable=False)
    # Validation parameters (e.g. regex patterns, required sub-fields, threshold measurements)
    validation_parameters = Column(JSON, nullable=True, default=dict)
    
    severity = Column(SQLEnum(RuleSeverity), default=RuleSeverity.HIGH, nullable=False)
    explanation = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # Relationships
    findings = relationship("ComplianceFinding", back_populates="rule")
