from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.rule import Rule
from app.models.enums import ValidationType, RuleSeverity


# ---------------------------------------------------------------------------
# Legal Metrology (Packaged Commodities) Rules, 2011
# Current compliance schema for the SIH packaged-commodity inspection system.
#
# Source of truth:
#   Legal Metrology Act, 2009
#   Legal Metrology (Packaged Commodities) Rules, 2011
#   Applicable amendments incorporated up to the current 2026 framework.
#
# IMPORTANT:
# This repository stores the legal requirement and its applicability.
# Validators perform the actual machine-checkable validation.
# ---------------------------------------------------------------------------

CURRENT_RULE_VERSION = "LMPC-2011-CURRENT-2026"


INITIAL_SAFE_RULE_SCHEMAS = [

    # -----------------------------------------------------------------------
    # Rule 6(1)(a) — Manufacturer / Packer / Importer
    # -----------------------------------------------------------------------
    {
        "rule_id": "RULE-LMPC-001",
        "source_document": "Legal Metrology (Packaged Commodities) Rules, 2011",
        "rule_clause_reference": "Rule 6(1)(a)",
        "version": CURRENT_RULE_VERSION,

        "requirement": (
            "The package must declare the name and address of the "
            "manufacturer, packer, or importer, as applicable."
        ),

        "applicability_conditions": {
            "categories": ["ALL"],
            "package_types": ["ALL"],
            "is_imported": None,
        },

        "validation_type": ValidationType.PRESENCE,

        "validation_parameters": {
            "target_field": "manufacturer_details",
            "minimum_confidence_for_automatic_pass": 65,
        },

        "severity": RuleSeverity.HIGH,

        "explanation": (
            "Checks whether the package contains the required "
            "manufacturer, packer, or importer identification details."
        ),

        "is_active": True,
    },

    # -----------------------------------------------------------------------
    # Rule 6(1)(aa) — Country of Origin for Imported Products
    # -----------------------------------------------------------------------
    {
        "rule_id": "RULE-LMPC-002",
        "source_document": "Legal Metrology (Packaged Commodities) Rules, 2011",
        "rule_clause_reference": "Rule 6(1)(aa)",
        "version": CURRENT_RULE_VERSION,

        "requirement": (
            "Imported packages must declare the applicable country of "
            "origin, country of manufacture, or country of assembly."
        ),

        "applicability_conditions": {
            "categories": ["ALL"],
            "package_types": ["ALL"],
            "is_imported": True,
        },

        "validation_type": ValidationType.PRESENCE,

        "validation_parameters": {
            "target_field": "country_of_origin",
            "minimum_confidence_for_automatic_pass": 65,
        },

        "severity": RuleSeverity.HIGH,

        "explanation": (
            "Country-of-origin validation applies to imported packaged "
            "commodities. Domestic products must not fail this rule merely "
            "because country-of-origin information is absent."
        ),

        "is_active": True,
    },

    # -----------------------------------------------------------------------
    # Rule 6(1)(b) — Common / Generic Name
    # -----------------------------------------------------------------------
    {
        "rule_id": "RULE-LMPC-003",
        "source_document": "Legal Metrology (Packaged Commodities) Rules, 2011",
        "rule_clause_reference": "Rule 6(1)(b)",
        "version": CURRENT_RULE_VERSION,

        "requirement": (
            "The common or generic name of the commodity contained in the "
            "package must be declared."
        ),

        "applicability_conditions": {
            "categories": ["ALL"],
            "package_types": ["ALL"],
            "is_imported": None,
        },

        "validation_type": ValidationType.PRESENCE,

        "validation_parameters": {
            "target_field": "commodity_name",
            "minimum_confidence_for_automatic_pass": 65,
        },

        "severity": RuleSeverity.HIGH,

        "explanation": (
            "Ensures that the consumer can identify the common or generic "
            "identity of the packaged commodity."
        ),

        "is_active": True,
    },

    # -----------------------------------------------------------------------
    # Rule 6(1)(c) — Net Quantity
    # -----------------------------------------------------------------------
    {
        "rule_id": "RULE-LMPC-004",
        "source_document": "Legal Metrology (Packaged Commodities) Rules, 2011",
        "rule_clause_reference": "Rule 6(1)(c)",
        "version": CURRENT_RULE_VERSION,

        "requirement": (
            "The net quantity must be declared using the applicable standard "
            "unit of weight or measure, or by number where the commodity is "
            "packed or sold by number."
        ),

        "applicability_conditions": {
            "categories": ["ALL"],
            "package_types": ["ALL"],
            "is_imported": None,
        },

        "validation_type": ValidationType.STANDARD_UNITS,

        "validation_parameters": {
            "target_field": "net_quantity",

            # Weight / mass
            "weight_units": [
                "mg",
                "g",
                "kg",
            ],

            # Volume
            "volume_units": [
                "ml",
                "l",
            ],

            # Count / number
            "count_units": [
                "unit",
                "units",
                "piece",
                "pieces",
                "pcs",
                "number",
                "no",
            ],

            "allowed_units": [
                "mg",
                "g",
                "kg",
                "ml",
                "l",
                "unit",
                "units",
                "piece",
                "pieces",
                "pcs",
                "number",
                "no",
            ],

            "minimum_confidence_for_automatic_pass": 65,
        },

        "severity": RuleSeverity.CRITICAL,

        "explanation": (
            "Validates the presence of a numeric net quantity and a "
            "configured standard weight, volume, or count unit. Length "
            "units such as cm and mm are intentionally not treated as "
            "generic net-quantity units."
        ),

        "is_active": True,
    },

    # -----------------------------------------------------------------------
    # Rule 6(1)(d) — Month and Year of Manufacture
    #
    # The 2021 amendment removed the earlier wording referring to
    # pre-packed/imported commodities from this clause.
    # -----------------------------------------------------------------------
    {
        "rule_id": "RULE-LMPC-005",
        "source_document": "Legal Metrology (Packaged Commodities) Rules, 2011",
        "rule_clause_reference": "Rule 6(1)(d)",
        "version": CURRENT_RULE_VERSION,

        "requirement": (
            "The month and year of manufacture must be declared where "
            "this declaration is applicable."
        ),

        "applicability_conditions": {
            "categories": ["ALL"],
            "package_types": ["ALL"],
            "is_imported": None,
        },

        "validation_type": ValidationType.DATE_VALIDITY,

        "validation_parameters": {
            "target_field": "date_of_packing",

            "accepted_formats": [
                "MM/YYYY",
                "MM-YYYY",
                "MM.YYYY",
                "YYYY/MM",
                "YYYY-MM",
                "DD/MM/YYYY",
                "DD-MM-YYYY",
                "DD.MM.YYYY",
            ],

            "minimum_confidence_for_automatic_pass": 65,
        },

        "severity": RuleSeverity.MEDIUM,

        "explanation": (
            "Checks that the detected manufacture-date declaration is "
            "present and syntactically valid. The rule configuration "
            "does not silently treat a date as compliant merely because "
            "some date-like OCR text was found."
        ),

        "is_active": True,
    },

    # -----------------------------------------------------------------------
    # Rule 6(1)(e) — Retail Sale Price / MRP
    # -----------------------------------------------------------------------
    {
        "rule_id": "RULE-LMPC-006",
        "source_document": "Legal Metrology (Packaged Commodities) Rules, 2011",
        "rule_clause_reference": "Rule 6(1)(e)",
        "version": CURRENT_RULE_VERSION,

        "requirement": (
            "The retail sale price / Maximum Retail Price must be declared "
            "in Indian currency in the prescribed manner and inclusive "
            "of all taxes."
        ),

        "applicability_conditions": {
            "categories": ["ALL"],
            "package_types": ["ALL"],
            "is_imported": None,
        },

        "validation_type": ValidationType.REGEX_MATCH,

        "validation_parameters": {
            "target_field": "mrp",

            # The validator checks the detected declaration text.
            # Numeric/currency parsing can be strengthened further without
            # changing the rule repository architecture.
            "pattern": (
                r"(?:"
                r"mrp"
                r"|maximum\s+retail\s+price"
                r"|retail\s+sale\s+price"
                r")"
                r".{0,80}"
                r"(?:₹|rs\.?|rs|inr)"
                r".{0,80}"
                r"(?:\d+(?:\.\d{1,2})?)"
            ),

            "ignore_case": True,

            "failure_message": (
                "MRP/retail sale price was detected, but the declaration "
                "does not contain a recognizable Indian-currency price "
                "format."
            ),

            "minimum_confidence_for_automatic_pass": 65,
        },

        "severity": RuleSeverity.HIGH,

        "explanation": (
            "Checks for a recognizable retail sale price/MRP declaration "
            "using Indian currency notation. Inclusive-of-all-taxes "
            "wording is a statutory requirement, but image/OCR evidence "
            "should not be treated as proof of every formatting detail "
            "when the extracted text is incomplete."
        ),

        "is_active": True,
    },

    # -----------------------------------------------------------------------
    # Rule 6(1)(f) — Dimensions where Relevant
    # -----------------------------------------------------------------------
    {
        "rule_id": "RULE-LMPC-007",
        "source_document": "Legal Metrology (Packaged Commodities) Rules, 2011",
        "rule_clause_reference": "Rule 6(1)(f)",
        "version": CURRENT_RULE_VERSION,

        "requirement": (
            "Where the size or dimensions of the commodity are relevant, "
            "the applicable dimensions must be declared."
        ),

        # IMPORTANT:
        # No "ALL" here. Otherwise the evaluator's category condition would
        # make the rule applicable to every commodity.
        "applicability_conditions": {
            "categories": [
                "CLOTHING",
                "FOOTWEAR",
                "TEXTILE",
                "GARMENT",
                "FURNITURE",
                "ELECTRONICS",
            ],
            "package_types": ["ALL"],
            "is_imported": None,
            "conditional": "dimensions_relevant",
        },

        "validation_type": ValidationType.PRESENCE,

        "validation_parameters": {
            "target_field": "dimensions",
            "minimum_confidence_for_automatic_pass": 65,
        },

        "severity": RuleSeverity.MEDIUM,

        "explanation": (
            "Dimensions are checked only where they are relevant to the "
            "commodity. Unrelated commodities must not automatically fail "
            "because a dimension declaration is absent."
        ),

        "is_active": True,
    },

    # -----------------------------------------------------------------------
    # Rule 6(2) — Consumer Care / Complaint Contact
    # -----------------------------------------------------------------------
    {
        "rule_id": "RULE-LMPC-008",
        "source_document": "Legal Metrology (Packaged Commodities) Rules, 2011",
        "rule_clause_reference": "Rule 6(2)",
        "version": CURRENT_RULE_VERSION,

        "requirement": (
            "The package must provide the name/address and contact details "
            "of the person or office that can be contacted for consumer "
            "complaints."
        ),

        "applicability_conditions": {
            "categories": ["ALL"],
            "package_types": ["ALL"],
            "is_imported": None,
        },

        "validation_type": ValidationType.PRESENCE,

        "validation_parameters": {
            "target_field": "customer_care",
            "minimum_confidence_for_automatic_pass": 65,
        },

        "severity": RuleSeverity.MEDIUM,

        "explanation": (
            "Provides consumers with a mechanism for complaints and "
            "consumer grievance redressal."
        ),

        "is_active": True,
    },

    # -----------------------------------------------------------------------
    # Rule 6(11) — Unit Sale Price
    #
    # Current framework includes:
    #   - per gram / kilogram
    #   - per centimetre / metre
    #   - per ml / litre
    #   - per number
    #
    # 2023 amendment:
    # unit sale price is not required for combination, group or multi-piece
    # packages.
    # -----------------------------------------------------------------------
    {
        "rule_id": "RULE-LMPC-009",
        "source_document": "Legal Metrology (Packaged Commodities) Rules, 2011",
        "rule_clause_reference": "Rule 6(11)",
        "version": CURRENT_RULE_VERSION,

        "requirement": (
            "Where applicable, the unit sale price in rupees, rounded to "
            "the nearest two decimal places, must be declared in the "
            "prescribed unit based on the applicable net quantity, length, "
            "volume, or number."
        ),

        "applicability_conditions": {
            "categories": ["ALL"],
            "package_types": [
                "ALL",
            ],
            "is_imported": None,
            "conditional": "unit_sale_price_applicable",

            # These package types can be used by the frontend/backend when
            # package classification becomes more granular.
            "exempt_package_types": [
                "COMBINATION",
                "COMBINATION_PACKAGE",
                "GROUP",
                "GROUP_PACKAGE",
                "MULTI_PIECE",
                "MULTI_PIECE_PACKAGE",
            ],
        },

        "validation_type": ValidationType.CUSTOM_LOGIC,

        "validation_parameters": {
            "target_field": "unit_sale_price",

            # Initial machine-checkable evidence requirement.
            # Exact mathematical reconciliation against net quantity,
            # MRP and package type should be implemented in the next
            # validator enhancement.
            "required_keywords": [
                "per",
            ],

            "minimum_confidence_for_automatic_pass": 65,

            "rounding_decimals": 2,

            "supported_unit_sale_price_units": [
                "g",
                "kg",
                "cm",
                "m",
                "ml",
                "l",
                "number",
                "unit",
            ],
        },

        "severity": RuleSeverity.MEDIUM,

        "explanation": (
            "Checks the presence of a recognizable unit-sale-price "
            "declaration while preserving the current Rule 6(11) unit "
            "categories. Combination, group and multi-piece package "
            "exceptions are represented in rule applicability metadata."
        ),

        "is_active": True,
    },

    # -----------------------------------------------------------------------
    # Conditional best-before / use-by declaration
    # -----------------------------------------------------------------------
    {
        "rule_id": "RULE-LMPC-010",
        "source_document": "Legal Metrology (Packaged Commodities) Rules, 2011",
        "rule_clause_reference": "Conditional best-before/use-by requirement",
        "version": CURRENT_RULE_VERSION,

        "requirement": (
            "Where the commodity may become unfit for human consumption, "
            "the applicable best-before or use-by declaration must be "
            "present."
        ),

        "applicability_conditions": {
            "categories": [
                "FOOD",
                "BEVERAGE",
            ],
            "package_types": ["ALL"],
            "is_imported": None,
            "conditional": "shelf_life_applicable",
        },

        "validation_type": ValidationType.DATE_VALIDITY,

        "validation_parameters": {
            "target_field": "best_before",

            "accepted_formats": [
                "MM/YYYY",
                "MM-YYYY",
                "MM.YYYY",
                "YYYY/MM",
                "YYYY-MM",
                "DD/MM/YYYY",
                "DD-MM-YYYY",
                "DD.MM.YYYY",
            ],

            "minimum_confidence_for_automatic_pass": 65,
        },

        "severity": RuleSeverity.HIGH,

        "explanation": (
            "This is a conditional declaration. The system must not "
            "automatically require best-before/use-by information for "
            "every packaged commodity."
        ),

        "is_active": True,
    },

    # -----------------------------------------------------------------------
    # Rule 9(1)(a) — Legibility and Prominence
    # -----------------------------------------------------------------------
    {
        "rule_id": "RULE-LMPC-011",
        "source_document": "Legal Metrology (Packaged Commodities) Rules, 2011",
        "rule_clause_reference": "Rule 9(1)(a)",
        "version": CURRENT_RULE_VERSION,

        "requirement": (
            "Every declaration required under the Rules must be legible "
            "and prominent."
        ),

        "applicability_conditions": {
            "categories": ["ALL"],
            "package_types": ["ALL"],
            "is_imported": None,
        },

        "validation_type": ValidationType.FONT_HEIGHT,

        "validation_parameters": {
            "target_field": "font_height_compliance",

            "minimum_confidence_for_automatic_pass": 85,

            "insufficient_evidence_result": "NEEDS_REVIEW",

            # Do not claim a physical font-size measurement unless a
            # calibrated measurement is available.
            "requires_physical_scale_for_automatic_pass": True,
        },

        "severity": RuleSeverity.HIGH,

        "explanation": (
            "OCR bounding boxes and image evidence can support a "
            "legibility/prominence assessment. The system must not claim "
            "exact physical font-height compliance without reliable "
            "image/package scale."
        ),

        "is_active": True,
    },
]


class RuleRepository:
    """Source of truth for the data-driven Legal Metrology rule set."""

    @staticmethod
    def seed_initial_rules(db: Session) -> int:
        """
        Upsert the configured rule definitions into the local database.

        Existing rules are updated so that changes in this repository
        propagate to an existing development database.
        """

        changed_count = 0

        for item in INITIAL_SAFE_RULE_SCHEMAS:
            existing = (
                db.query(Rule)
                .filter(Rule.rule_id == item["rule_id"])
                .first()
            )

            if existing:
                for field, value in item.items():
                    if field != "rule_id":
                        setattr(existing, field, value)

                changed_count += 1

            else:
                db.add(Rule(**item))
                changed_count += 1

        db.commit()

        return changed_count

    @staticmethod
    def get_active_rules(
        db: Session,
        version: Optional[str] = None,
    ) -> List[Rule]:

        query = (
            db.query(Rule)
            .filter(Rule.is_active.is_(True))
        )

        if version:
            query = query.filter(Rule.version == version)

        return query.all()