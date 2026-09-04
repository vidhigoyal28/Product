from typing import List, Optional
from sqlalchemy.orm import Session

from app.models.rule import Rule
from app.models.enums import ValidationType, RuleSeverity

# Structured, verified schema definitions (uses "Applicable Rule" as placeholder without invented rule numbers)
INITIAL_SAFE_RULE_SCHEMAS = [
    {
        "rule_id": "RULE-SCHEMA-001",
        "source_document": "Legal Metrology (Packaged Commodities) Rules, 2011",
        "rule_clause_reference": "Applicable Rule",
        "version": "2011.1",
        "requirement": "Every package must declare the common or generic name of the commodity.",
        "applicability_conditions": {"categories": ["ALL"], "package_types": ["ALL"], "is_imported": None},
        "validation_type": ValidationType.PRESENCE,
        "validation_parameters": {"target_field": "commodity_name"},
        "severity": RuleSeverity.HIGH,
        "explanation": "Ensures consumer awareness regarding the true nature and identity of packaged contents.",
        "is_active": True,
    },
    {
        "rule_id": "RULE-SCHEMA-002",
        "source_document": "Legal Metrology (Packaged Commodities) Rules, 2011",
        "rule_clause_reference": "Applicable Rule",
        "version": "2011.1",
        "requirement": "The net quantity contained in the package must be declared in standard units of weight, measure, or number.",
        "applicability_conditions": {"categories": ["ALL"], "package_types": ["ALL"], "is_imported": None},
        "validation_type": ValidationType.STANDARD_UNITS,
        "validation_parameters": {
            "target_field": "net_quantity",
            "allowed_units": ["g", "kg", "ml", "l", "m", "cm", "mm", "unit", "u", "units", "n"]
        },
        "severity": RuleSeverity.CRITICAL,
        "explanation": "Standard metric/SI units prevent misleading quantity representations to consumers.",
        "is_active": True,
    },
    {
        "rule_id": "RULE-SCHEMA-003",
        "source_document": "Legal Metrology (Packaged Commodities) Rules, 2011",
        "rule_clause_reference": "Applicable Rule",
        "version": "2011.1",
        "requirement": "Retail sale price / Maximum Retail Price (MRP) must be declared inclusive of all taxes.",
        "applicability_conditions": {"categories": ["ALL"], "package_types": ["ALL"], "is_imported": None},
        "validation_type": ValidationType.REGEX_MATCH,
        "validation_parameters": {
            "target_field": "mrp",
            "pattern": r"(incl\.?|inclusive)\s*(of)?\s*all\s*taxes",
            "failure_message": "MRP declaration lacks statutory 'inclusive of all taxes' phrasing."
        },
        "severity": RuleSeverity.HIGH,
        "explanation": "Prevents overcharging and hidden taxation beyond the declared retail sale price.",
        "is_active": True,
    },
    {
        "rule_id": "RULE-SCHEMA-004",
        "source_document": "Legal Metrology (Packaged Commodities) Rules, 2011",
        "rule_clause_reference": "Applicable Rule",
        "version": "2011.1",
        "requirement": "Unit Sale Price (USP) per gram, milliliter, or unit must be declared alongside MRP.",
        "applicability_conditions": {"categories": ["ALL"], "package_types": ["ALL"], "is_imported": None},
        "validation_type": ValidationType.PRESENCE,
        "validation_parameters": {"target_field": "unit_sale_price"},
        "severity": RuleSeverity.MEDIUM,
        "explanation": "Enables transparent price comparison across varying pack sizes.",
        "is_active": True,
    },
    {
        "rule_id": "RULE-SCHEMA-005",
        "source_document": "Legal Metrology (Packaged Commodities) Rules, 2011",
        "rule_clause_reference": "Applicable Rule",
        "version": "2011.1",
        "requirement": "Name and complete address of the manufacturer, packer, or importer must be clearly declared.",
        "applicability_conditions": {"categories": ["ALL"], "package_types": ["ALL"], "is_imported": None},
        "validation_type": ValidationType.PRESENCE,
        "validation_parameters": {"target_field": "manufacturer_details"},
        "severity": RuleSeverity.HIGH,
        "explanation": "Establishes commercial traceability and manufacturer accountability.",
        "is_active": True,
    },
    {
        "rule_id": "RULE-SCHEMA-006",
        "source_document": "Legal Metrology (Packaged Commodities) Rules, 2011",
        "rule_clause_reference": "Applicable Rule",
        "version": "2011.1",
        "requirement": "Month and year of manufacture, packing, or import must be indicated on the package.",
        "applicability_conditions": {"categories": ["ALL"], "package_types": ["ALL"], "is_imported": None},
        "validation_type": ValidationType.PRESENCE,
        "validation_parameters": {"target_field": "date_of_packing"},
        "severity": RuleSeverity.MEDIUM,
        "explanation": "Informs consumers of the packaging freshness and shelf timeline.",
        "is_active": True,
    },
    {
        "rule_id": "RULE-SCHEMA-007",
        "source_document": "Legal Metrology (Packaged Commodities) Rules, 2011",
        "rule_clause_reference": "Applicable Rule",
        "version": "2011.1",
        "requirement": "Country of Origin must be explicitly declared on packaged goods.",
        "applicability_conditions": {"categories": ["ALL"], "package_types": ["ALL"], "is_imported": None},
        "validation_type": ValidationType.PRESENCE,
        "validation_parameters": {"target_field": "country_of_origin"},
        "severity": RuleSeverity.HIGH,
        "explanation": "Ensures statutory provenance transparency for domestic and imported goods.",
        "is_active": True,
    },
    {
        "rule_id": "RULE-SCHEMA-008",
        "source_document": "Legal Metrology (Packaged Commodities) Rules, 2011",
        "rule_clause_reference": "Applicable Rule",
        "version": "2011.1",
        "requirement": "Consumer grievance cell details (Contact Name/Designation, Telephone, and Email) must be declared.",
        "applicability_conditions": {"categories": ["ALL"], "package_types": ["ALL"], "is_imported": None},
        "validation_type": ValidationType.PRESENCE,
        "validation_parameters": {"target_field": "customer_care"},
        "severity": RuleSeverity.MEDIUM,
        "explanation": "Provides direct redressal access for consumer complaints.",
        "is_active": True,
    },
    {
        "rule_id": "RULE-SCHEMA-009",
        "source_document": "Legal Metrology (Packaged Commodities) Rules, 2011",
        "rule_clause_reference": "Applicable Rule",
        "version": "2011.1",
        "requirement": "Numeral and letter font heights must meet minimum threshold relative to Principal Display Panel area.",
        "applicability_conditions": {"categories": ["ALL"], "package_types": ["ALL"], "is_imported": None},
        "validation_type": ValidationType.FONT_HEIGHT,
        "validation_parameters": {"target_field": "font_height_compliance"},
        "severity": RuleSeverity.MEDIUM,
        "explanation": "Guarantees legibility and prominent visibility of statutory packaging text.",
        "is_active": True,
    },
]


class RuleRepository:
    """Manages retrieval and initialization of data-driven rule records."""

    @staticmethod
    def seed_initial_rules(db: Session) -> int:
        count = 0
        for item in INITIAL_SAFE_RULE_SCHEMAS:
            existing = db.query(Rule).filter(Rule.rule_id == item["rule_id"]).first()
            if not existing:
                rule = Rule(**item)
                db.add(rule)
                count += 1
        if count > 0:
            db.commit()
        return count

    @staticmethod
    def get_active_rules(db: Session, version: Optional[str] = None) -> List[Rule]:
        query = db.query(Rule).filter(Rule.is_active == True)
        if version:
            query = query.filter(Rule.version == version)
        return query.all()
