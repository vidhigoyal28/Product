from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.finding import ComplianceFinding
from app.schemas.compliance import (
    ComplianceEvaluationRequest,
    ComplianceEvaluationResponse,
    ComplianceFindingResponse,
)
from app.services.compliance.engine import get_compliance_engine
from app.services.audit_service import AuditService

router = APIRouter(prefix="/compliance", tags=["Compliance Engine"])


@router.post("/evaluate", response_model=ComplianceEvaluationResponse)
async def evaluate_compliance(
    payload: ComplianceEvaluationRequest,
    inspection_id: str = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    engine = get_compliance_engine()
    result = await engine.evaluate_inspection(
        db,
        inspection_id=inspection_id,
        rule_version=payload.rule_version
    )

    AuditService.log_event(
        db,
        action="COMPLIANCE_EVALUATION_RUN",
        entity_type="Inspection",
        entity_id=inspection_id,
        user_id=current_user.id,
        details={
            "overall_status": result.overall_status.value,
            "rules_evaluated": result.total_rules_evaluated,
            "failed_count": result.failed_count
        }
    )

    return result


@router.get("/findings/{inspection_id}", response_model=List[ComplianceFindingResponse])
def get_findings_for_inspection(
    inspection_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    findings = db.query(ComplianceFinding).filter(
        ComplianceFinding.inspection_id == inspection_id
    ).all()
    return findings
