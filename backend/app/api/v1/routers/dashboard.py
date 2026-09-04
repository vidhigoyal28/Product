from typing import List
from collections import Counter
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc, func

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.inspection import Inspection
from app.models.finding import ComplianceFinding
from app.models.enums import OverallStatus, ComplianceResult
from app.schemas.dashboard import (
    DashboardStatsResponse,
    CategoryDistributionItem,
    ViolationDistributionItem,
    InspectionTrendItem,
)
from app.schemas.inspection import InspectionResponse

router = APIRouter(prefix="/dashboard", tags=["Dashboard Telemetry"])


@router.get("/stats", response_model=DashboardStatsResponse)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    inspections = db.query(Inspection).all()
    total = len(inspections)
    compliant = sum(1 for i in inspections if i.overall_status == OverallStatus.COMPLIANT)
    non_compliant = sum(1 for i in inspections if i.overall_status == OverallStatus.NON_COMPLIANT)
    needs_review = sum(1 for i in inspections if i.overall_status == OverallStatus.NEEDS_REVIEW)
    rate = round((compliant / total) * 100, 1) if total > 0 else 0.0

    # Category distribution
    cat_map = {}
    for i in inspections:
        if i.category not in cat_map:
            cat_map[i.category] = {"total": 0, "compliant": 0, "non_compliant": 0, "needs_review": 0}
        cat_map[i.category]["total"] += 1
        if i.overall_status == OverallStatus.COMPLIANT:
            cat_map[i.category]["compliant"] += 1
        elif i.overall_status == OverallStatus.NON_COMPLIANT:
            cat_map[i.category]["non_compliant"] += 1
        else:
            cat_map[i.category]["needs_review"] += 1

    category_distribution = [
        CategoryDistributionItem(
            category=k,
            total=v["total"],
            compliant=v["compliant"],
            non_compliant=v["non_compliant"],
            needs_review=v["needs_review"]
        )
        for k, v in cat_map.items()
    ]

    # Violation distribution from findings
    failed_findings = db.query(ComplianceFinding).filter(
        ComplianceFinding.result == ComplianceResult.FAIL
    ).all()

    viol_counter = Counter(f.field for f in failed_findings)
    violation_distribution = [
        ViolationDistributionItem(
            field_name=field,
            rule_clause_reference="Applicable Rule",
            count=count,
            severity="HIGH"
        )
        for field, count in viol_counter.most_common(6)
    ]

    # Recent inspections
    recent = db.query(Inspection).order_by(desc(Inspection.created_at)).limit(5).all()

    # Trends (past 7 days)
    today = datetime.now(timezone.utc).date()
    trends = []
    for day_offset in range(6, -1, -1):
        target_date = today - timedelta(days=day_offset)
        day_inspections = [
            i for i in inspections
            if i.created_at.date() == target_date
        ]
        trends.append(
            InspectionTrendItem(
                date=target_date.strftime("%b %d"),
                total=len(day_inspections),
                compliant=sum(1 for i in day_inspections if i.overall_status == OverallStatus.COMPLIANT),
                non_compliant=sum(1 for i in day_inspections if i.overall_status == OverallStatus.NON_COMPLIANT)
            )
        )

    return DashboardStatsResponse(
        total_inspections=total,
        compliant_count=compliant,
        non_compliant_count=non_compliant,
        needs_review_count=needs_review,
        compliance_rate=rate,
        category_distribution=category_distribution,
        violation_distribution=violation_distribution,
        recent_inspections=[InspectionResponse.from_orm(i) for i in recent],
        trends=trends
    )
