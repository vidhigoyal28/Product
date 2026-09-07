from typing import Dict, Any, Tuple
from datetime import datetime, timezone

from app.models.rule import Rule
from app.models.inspection import Inspection


class ApplicabilityEvaluator:
    """
    Evaluates whether a structured compliance rule applies to an inspection.

    Applicability is driven by rule metadata rather than hard-coded legal rules.
    Conditional rules are handled conservatively so that the system does not
    automatically fail a package when the available inspection metadata is
    insufficient to establish applicability.
    """

    @staticmethod
    def evaluate_applicability(
        rule: Rule,
        inspection: Inspection,
    ) -> Tuple[bool, str]:

        # ------------------------------------------------------------------
        # 1. Active status
        # ------------------------------------------------------------------
        if not rule.is_active:
            return False, "Rule is currently inactive."

        # ------------------------------------------------------------------
        # 2. Effective date
        # ------------------------------------------------------------------
        now = datetime.now(timezone.utc)

        if rule.effective_from:
            eff_from = (
                rule.effective_from
                if rule.effective_from.tzinfo
                else rule.effective_from.replace(tzinfo=timezone.utc)
            )

            if now < eff_from:
                return (
                    False,
                    f"Rule is not yet effective. Effective from "
                    f"{rule.effective_from.isoformat()}.",
                )

        if rule.effective_to:
            eff_to = (
                rule.effective_to
                if rule.effective_to.tzinfo
                else rule.effective_to.replace(tzinfo=timezone.utc)
            )

            if now > eff_to:
                return (
                    False,
                    f"Rule has expired. Effective to "
                    f"{rule.effective_to.isoformat()}.",
                )

        conditions: Dict[str, Any] = rule.applicability_conditions or {}

        # ------------------------------------------------------------------
        # 3. Category applicability
        # ------------------------------------------------------------------
        applicable_categories = conditions.get("categories")

        if applicable_categories and isinstance(applicable_categories, list):

            normalized_category = (
                (inspection.category or "")
                .strip()
                .upper()
            )

            normalized_categories = {
                str(category).strip().upper()
                for category in applicable_categories
            }

            if (
                "ALL" not in normalized_categories
                and normalized_category not in normalized_categories
            ):
                return (
                    False,
                    f"Rule is not applicable to category "
                    f"'{inspection.category}'.",
                )

        # ------------------------------------------------------------------
        # 4. Package type applicability
        # ------------------------------------------------------------------
        applicable_package_types = conditions.get("package_types")

        if (
            applicable_package_types
            and isinstance(applicable_package_types, list)
        ):

            normalized_package_type = (
                (inspection.package_type or "")
                .strip()
                .upper()
            )

            normalized_package_types = {
                str(package_type).strip().upper()
                for package_type in applicable_package_types
            }

            if (
                "ALL" not in normalized_package_types
                and normalized_package_type not in normalized_package_types
            ):
                return (
                    False,
                    f"Rule is not applicable to package type "
                    f"'{inspection.package_type}'.",
                )

        # ------------------------------------------------------------------
        # 5. Import / domestic applicability
        # ------------------------------------------------------------------
        requires_imported = conditions.get("is_imported")

        if requires_imported is not None:

            inspection_is_imported = bool(inspection.is_imported)

            if bool(requires_imported) != inspection_is_imported:

                target_status = (
                    "imported"
                    if bool(requires_imported)
                    else "domestic"
                )

                return (
                    False,
                    f"Rule applies only to {target_status} commodities.",
                )

        # ------------------------------------------------------------------
        # 6. Conditional applicability
        # ------------------------------------------------------------------
        conditional = conditions.get("conditional")

        if conditional:

            # --------------------------------------------------------------
            # Best-before / use-by
            # --------------------------------------------------------------
            if conditional == "shelf_life_applicable":

                category = (
                    (inspection.category or "")
                    .strip()
                    .upper()
                )

                shelf_life_categories = {
                    "FOOD",
                    "BEVERAGE",
                    "COSMETIC",
                    "PHARMACEUTICAL",
                }

                if category not in shelf_life_categories:
                    return (
                        False,
                        "Best-before/use-by check is not applicable "
                        f"to category '{inspection.category}'.",
                    )

            # --------------------------------------------------------------
            # Dimensions
            #
            # Only evaluate this condition when the commodity category is
            # explicitly identified as dimension-relevant.
            # --------------------------------------------------------------
            elif conditional == "dimensions_relevant":

                category = (
                    (inspection.category or "")
                    .strip()
                    .upper()
                )

                dimension_categories = {
                    "CLOTHING",
                    "FOOTWEAR",
                    "TEXTILE",
                    "GARMENT",
                    "FURNITURE",
                    "ELECTRONICS",
                }

                if category not in dimension_categories:
                    return (
                        False,
                        "Dimension check is not applicable to "
                        f"category '{inspection.category}'.",
                    )

            # --------------------------------------------------------------
            # Unit sale price
            #
            # Keep this applicable by default for the current SIH inspection
            # flow. The validator decides whether the declaration itself is
            # present and valid.
            # --------------------------------------------------------------
            elif conditional == "unit_sale_price_applicable":
                return (
                    True,
                    "Unit sale price check is applicable to this "
                    "packaged-commodity inspection.",
                )

            # --------------------------------------------------------------
            # Unknown conditional
            #
            # Never silently assume applicability for an unknown condition.
            # This protects the compliance engine from future rule metadata
            # mistakes.
            # --------------------------------------------------------------
            else:
                return (
                    False,
                    f"Unknown applicability condition '{conditional}'.",
                )

        # ------------------------------------------------------------------
        # 7. Explicit statutory exemptions
        # ------------------------------------------------------------------
        exemptions = conditions.get("exemptions", [])

        if exemptions and isinstance(exemptions, list):

            for exemption in exemptions:

                # Keep exemption handling explicit.
                # Do not silently pass an exemption unless the inspection
                # contains enough information to establish it.
                if exemption == "PACKAGES_UNDER_10G_EXEMPTION":

                    weight_threshold = conditions.get(
                        "weight_threshold_g"
                    )

                    if weight_threshold is not None:
                        try:
                            if float(weight_threshold) < 10:
                                return (
                                    False,
                                    "Rule is excluded by the configured "
                                    "small-package exemption.",
                                )
                        except (TypeError, ValueError):
                            pass

        return (
            True,
            "Rule applicability conditions satisfied for this inspection.",
        )