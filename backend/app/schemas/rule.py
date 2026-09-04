from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field

from app.models.enums import ValidationType, RuleSeverity


class RuleBase(BaseModel):
    rule_id: str = Field(..., description="Unique alphanumeric identifier e.g. RULE-SCHEMA-001")
    source_document: str = Field("Legal Metrology (Packaged Commodities) Rules, 2011")
    rule_clause_reference: str = Field("Applicable Rule Placeholder")
    version: str = Field("2011.1")
    effective_from: Optional[datetime] = None
    effective_to: Optional[datetime] = None
    requirement: str
    applicability_conditions: Dict[str, Any] = Field(
        default_factory=dict,
        description="Conditions evaluating category, package_type, is_imported, exceptions"
    )
    validation_type: ValidationType = ValidationType.PRESENCE
    validation_parameters: Optional[Dict[str, Any]] = Field(default_factory=dict)
    severity: RuleSeverity = RuleSeverity.HIGH
    explanation: Optional[str] = None
    is_active: bool = True


class RuleCreate(RuleBase):
    pass


class RuleUpdate(BaseModel):
    requirement: Optional[str] = None
    applicability_conditions: Optional[Dict[str, Any]] = None
    validation_type: Optional[ValidationType] = None
    validation_parameters: Optional[Dict[str, Any]] = None
    severity: Optional[RuleSeverity] = None
    explanation: Optional[str] = None
    is_active: Optional[bool] = None


class RuleResponse(RuleBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
