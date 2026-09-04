import uuid
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session

from app.models.report import Report
from app.models.inspection import Inspection
from app.models.finding import ComplianceFinding
from app.models.declaration import Declaration
from app.models.user import User
from app.models.enums import ReportType, ComplianceResult


class ReportService:
    """Generates official Legal Metrology compliance notices and report dossiers."""

    @staticmethod
    def generate_inspection_report(
        db: Session,
        inspection_id: str,
        user: User,
        report_type: ReportType = ReportType.FORM_II_STATUTORY_NOTICE
    ) -> Report:
        inspection = db.query(Inspection).filter(Inspection.id == inspection_id).first()
        if not inspection:
            raise ValueError(f"Inspection {inspection_id} not found")

        findings = db.query(ComplianceFinding).filter(ComplianceFinding.inspection_id == inspection_id).all()
        declarations = db.query(Declaration).filter(Declaration.inspection_id == inspection_id).all()

        violations = [
            {
                "field": f.field,
                "result": f.result.value,
                "reason": f.reason,
                "rule_clause_reference": f.rule.rule_clause_reference if f.rule else "Applicable Rule",
                "severity": f.rule.severity.value if f.rule else "HIGH",
            }
            for f in findings if f.result == ComplianceResult.FAIL
        ]

        declarations_summary = [
            {
                "field_name": d.field_name,
                "normalized_value": d.normalized_value,
                "confidence": d.confidence,
                "is_verified": d.is_verified,
            }
            for d in declarations
        ]

        summary_data: Dict[str, Any] = {
            "department": "Government of India • Department of Consumer Affairs",
            "statutory_act": "Legal Metrology (Packaged Commodities) Rules, 2011",
            "statutory_notice_title": "Statutory Label Compliance Audit Notice & Verification Certificate",
            "inspection_code": inspection.inspection_code,
            "reference_id": inspection.reference_id,
            "product_name": inspection.product_name,
            "category": inspection.category,
            "is_imported": inspection.is_imported,
            "inspection_date": inspection.created_at.isoformat(),
            "officer_name": user.full_name,
            "officer_badge": user.badge_number or "LM-OFFICER",
            "zone_division": user.zone_division or "National Enforcement Division",
            "overall_status": inspection.overall_status.value,
            "confidence_score": inspection.confidence_score,
            "total_violations_count": len(violations),
            "violations": violations,
            "declarations_summary": declarations_summary,
            "compliance_verdict": (
                "Package conforms to mandatory declarations requirements under Applicable Rule."
                if inspection.overall_status.value == "COMPLIANT"
                else "Package exhibits statutory declaration violations as listed under Applicable Rule."
            ),
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

        report_code = f"REP-{inspection.inspection_code.replace('INSP-', '')}"
        report = Report(
            report_code=report_code,
            inspection_id=inspection.id,
            report_type=report_type,
            generated_by_id=user.id,
            summary_data=summary_data,
        )
        db.add(report)
        db.commit()
        db.refresh(report)
        return report
