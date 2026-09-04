from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field

from app.models.enums import ComplianceResult, OverallStatus
from app.schemas.rule import RuleResponse


class ComplianceFindingBase(BaseModel):
    field: str
    result: ComplianceResult
    reason: str
    evidence_image_id: Optional[str] = None
    bounding_box: Optional[Dict[str, Any]] = None
    confidence: float = Field(default=0.0, ge=0.0, le=100.0)
    rule_version: str = "2011.1"


class ComplianceFindingCreate(ComplianceFindingBase):
    inspection_id: str
    rule_id: Optional[str] = None


class ComplianceFindingResponse(ComplianceFindingBase):
    id: str
    inspection_id: str
    rule_id: Optional[str] = None
    rule: Optional[RuleResponse] = None
    is_verified: bool
    verified_by_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ComplianceEvaluationRequest(BaseModel):
    rule_version: Optional[str] = None
    force_re_evaluate: bool = False


class ComplianceEvaluationResponse(BaseModel):
    inspection_id: str
    overall_status: OverallStatus
    confidence_score: float
    total_rules_evaluated: int
    passed_count: int
    failed_count: int
    needs_review_count: int
    not_applicable_count: int
    findings: List[ComplianceFindingResponse]
