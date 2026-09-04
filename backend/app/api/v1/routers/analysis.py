from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.inspection import Inspection
from app.schemas.analysis import AnalysisTriggerRequest, AnalysisPipelineResult
from app.services.ai_interfaces.orchestrator import AIPipelineOrchestrator
from app.services.audit_service import AuditService

router = APIRouter(prefix="/analysis", tags=["AI Analysis"])


@router.post("/trigger", response_model=AnalysisPipelineResult)
async def trigger_analysis_pipeline(
    payload: AnalysisTriggerRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    inspection = db.query(Inspection).filter(
        (Inspection.id == payload.inspection_id) | (Inspection.inspection_code == payload.inspection_id)
    ).first()

    if not inspection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Inspection '{payload.inspection_id}' not found"
        )

    orchestrator = AIPipelineOrchestrator()
    result = await orchestrator.run_pipeline(db, inspection.id)

    AuditService.log_event(
        db,
        action="ANALYSIS_PIPELINE_EXECUTED",
        entity_type="Inspection",
        entity_id=inspection.id,
        user_id=current_user.id,
        details={
            "total_declarations": result.total_declarations_extracted,
            "overall_status": result.overall_status,
            "confidence_score": result.confidence_score
        }
    )

    return result
