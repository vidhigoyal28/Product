from typing import List, Dict, Any, Optional
from pydantic import BaseModel

from app.schemas.inspection import InspectionResponse


class CategoryDistributionItem(BaseModel):
    category: str
    total: int
    compliant: int
    non_compliant: int
    needs_review: int


class ViolationDistributionItem(BaseModel):
    field_name: str
    rule_clause_reference: str
    count: int
    severity: str


class InspectionTrendItem(BaseModel):
    date: str
    total: int
    compliant: int
    non_compliant: int


class DashboardStatsResponse(BaseModel):
    total_inspections: int
    compliant_count: int
    non_compliant_count: int
    needs_review_count: int
    compliance_rate: float
    category_distribution: List[CategoryDistributionItem]
    violation_distribution: List[ViolationDistributionItem]
    recent_inspections: List[InspectionResponse]
    trends: List[InspectionTrendItem]
