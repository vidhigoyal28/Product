from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class AnalysisTriggerRequest(BaseModel):
    inspection_id: str
    force_reprocess: bool = False


class StageResult(BaseModel):
    stage_id: int
    stage_name: str
    status: str = "COMPLETED" # COMPLETED, FAILED, SKIPPED
    duration_ms: int = 500
    metrics: Optional[Dict[str, Any]] = None
    remarks: Optional[str] = None


class AnalysisPipelineResult(BaseModel):
    inspection_id: str
    success: bool
    stages: List[StageResult]
    total_declarations_extracted: int
    quality_score: float
    confidence_score: float
    overall_status: str
    message: str
