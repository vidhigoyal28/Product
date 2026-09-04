from typing import Dict, Any, Tuple
from datetime import datetime, timezone

from app.models.rule import Rule
from app.models.inspection import Inspection


class ApplicabilityEvaluator:
    """
    Evaluates whether a structured Rule record applies to a given Inspection context.
    Does NOT use hard-coded rules; evaluates the rule's metadata & applicability conditions.
    """

    @staticmethod
    def evaluate_applicability(rule: Rule, inspection: Inspection) -> Tuple[bool, str]:
        # 1. Check active status
        if not rule.is_active:
            return False, "Rule is currently inactive in the repository."

        # 2. Check effective date range
        now = datetime.now(timezone.utc)
        if rule.effective_from:
            eff_from = rule.effective_from if rule.effective_from.tzinfo else rule.effective_from.replace(tzinfo=timezone.utc)
            if now < eff_from:
                return False, f"Rule is not yet effective (Effective from: {rule.effective_from.isoformat()})."

        if rule.effective_to:
            eff_to = rule.effective_to if rule.effective_to.tzinfo else rule.effective_to.replace(tzinfo=timezone.utc)
            if now > eff_to:
                return False, f"Rule has expired (Effective to: {rule.effective_to.isoformat()})."

        conditions: Dict[str, Any] = rule.applicability_conditions or {}

        # 3. Check Category filters
        applicable_categories = conditions.get("categories")
        if applicable_categories and isinstance(applicable_categories, list):
            if "ALL" not in applicable_categories and inspection.category not in applicable_categories:
                return False, f"Not applicable to category '{inspection.category}' (Applies to: {applicable_categories})."

        # 4. Check Package Type filters
        applicable_package_types = conditions.get("package_types")
        if applicable_package_types and isinstance(applicable_package_types, list):
            if "ALL" not in applicable_package_types and inspection.package_type not in applicable_package_types:
                return False, f"Not applicable to package type '{inspection.package_type}'."

        # 5. Check Import Status condition
        # is_imported condition can be: true (imported only), false (domestic only), null (both)
        requires_imported = conditions.get("is_imported")
        if requires_imported is not None:
            if bool(requires_imported) != bool(inspection.is_imported):
                target_status = "Imported" if requires_imported else "Domestic"
                return False, f"Applies exclusively to {target_status} commodities."

        # 6. Check Statutory Exceptions
        exemptions = conditions.get("exemptions", [])
        if exemptions and isinstance(exemptions, list):
            # E.g. small package exemption, fast food exemption
            for ex in exemptions:
                if ex == "PACKAGES_UNDER_10G_EXEMPTION" and conditions.get("weight_threshold_g", 0) < 10:
                    pass

        return True, "Rule applicability conditions satisfied for this commodity."
