import io
import sys
from pathlib import Path
from fastapi.testclient import TestClient

# Add backend directory to sys.path
sys.path.insert(0, str(Path(__file__).parent.resolve()))

from app.main import app

def run_tests():
    print("==================================================")
    print("STARTING BACKEND VERIFICATION SUITE")
    print("==================================================")

    with TestClient(app) as client:
        # 1. Health Check
        print("\n[1] Testing GET /api/health...")
        res = client.get("/api/health")
        assert res.status_code == 200, f"Health check failed: {res.text}"
        health_data = res.json()
        assert health_data["status"] == "online"
        assert health_data["database"] == "healthy"
        print("  -> Passed: Health check OK (database healthy).")

        # 2. Swagger / OpenAPI Documentation
        print("\n[2] Testing OpenAPI schema & Swagger docs...")
        res = client.get("/openapi.json")
        assert res.status_code == 200, f"OpenAPI JSON failed: {res.text}"
        openapi_data = res.json()
        assert "paths" in openapi_data
        assert "/api/health" in openapi_data["paths"]
        assert "/api/auth/login" in openapi_data["paths"]
        assert "/api/inspections" in openapi_data["paths"]
        print(f"  -> Passed: OpenAPI schema generated with {len(openapi_data['paths'])} endpoints.")

        # 3. Authentication (Login & Tokens)
        print("\n[3] Testing Authentication (Inspector & Admin logins)...")
        login_res = client.post("/api/auth/login", json={
            "username": "inspector.sharma",
            "password": "Officer@123456"
        })
        assert login_res.status_code == 200, f"Inspector login failed: {login_res.text}"
        inspector_token = login_res.json()["access_token"]
        inspector_headers = {"Authorization": f"Bearer {inspector_token}"}
        print("  -> Passed: Inspector login successful. Token acquired.")

        admin_res = client.post("/api/auth/login", json={
            "username": "admin",
            "password": "Admin@123456"
        })
        assert admin_res.status_code == 200, f"Admin login failed: {admin_res.text}"
        admin_token = admin_res.json()["access_token"]
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        print("  -> Passed: Admin login successful. Token acquired.")

        # Test /api/auth/me
        me_res = client.get("/api/auth/me", headers=inspector_headers)
        assert me_res.status_code == 200
        assert me_res.json()["username"] == "inspector.sharma"
        assert me_res.json()["role"] == "INSPECTOR"
        print("  -> Passed: /api/auth/me returns authenticated officer profile.")

        # 4. Inspection Creation
        print("\n[4] Testing Inspection Creation (POST /api/inspections)...")
        insp_res = client.post("/api/inspections", headers=inspector_headers, json={
            "product_name": "NutriDelight Almond Cookies 200g",
            "brand_name": "NutriDelight",
            "category": "Food & Confectionery",
            "package_type": "Standard Pre-packaged",
            "is_imported": False,
            "notes": "Sample collected during retail market inspection."
        })
        assert insp_res.status_code == 201, f"Inspection creation failed: {insp_res.text}"
        insp_data = insp_res.json()
        inspection_id = insp_data["id"]
        inspection_code = insp_data["inspection_code"]
        assert inspection_code.startswith("INSP-")
        print(f"  -> Passed: Created inspection with ID {inspection_id} and Code {inspection_code}.")

        # 5. Image Upload
        print("\n[5] Testing Package Image Upload (POST /api/inspections/{id}/images)...")
        from PIL import Image as PILImage
        img_buf = io.BytesIO()
        test_img = PILImage.new("RGB", (640, 480), color=(73, 109, 137))
        test_img.save(img_buf, format="JPEG")
        img_bytes = img_buf.getvalue()

        upload_res = client.post(
            f"/api/inspections/{inspection_id}/images",
            headers=inspector_headers,
            files={"file": ("pdp_front.jpg", img_bytes, "image/jpeg")},
            data={"image_type": "PDP"}
        )
        assert upload_res.status_code == 201, f"Image upload failed: {upload_res.text}"
        img_data = upload_res.json()
        assert img_data["image_type"] == "PDP"
        assert img_data["url"].startswith("/uploads/")
        print(f"  -> Passed: Uploaded package image (URL: {img_data['url']}).")

        # 6. Inspection Retrieval
        print("\n[6] Testing Inspection Retrieval (GET /api/inspections/{id})...")
        get_res = client.get(f"/api/inspections/{inspection_id}", headers=inspector_headers)
        assert get_res.status_code == 200, f"Inspection get failed: {get_res.text}"
        detail_data = get_res.json()
        assert len(detail_data["images"]) >= 1
        assert detail_data["images"][0]["file_name"] == "pdp_front.jpg"
        print(f"  -> Passed: Retrieved inspection with {len(detail_data['images'])} attached image(s).")

        # 7. AI Analysis & 8-Stage Pipeline
        print("\n[7] Testing AI Pipeline Execution (POST /api/analysis/trigger)...")
        pipeline_res = client.post(
            "/api/analysis/trigger",
            headers=inspector_headers,
            json={"inspection_id": inspection_id}
        )
        assert pipeline_res.status_code == 200, f"Analysis trigger failed: {pipeline_res.text}"
        pipe_data = pipeline_res.json()
        assert pipe_data["success"] is True
        assert len(pipe_data["stages"]) == 8
        print(f"  -> Passed: 8-Stage AI pipeline executed ({pipe_data['total_declarations_extracted']} declarations extracted).")

        # 8. Declarations & Compliance Evaluation
        print("\n[8] Testing Declarations Retrieval & Compliance Evaluation...")
        decls_res = client.get(f"/api/declarations?inspection_id={inspection_id}", headers=inspector_headers)
        assert decls_res.status_code == 200
        decls = decls_res.json()
        assert len(decls) > 0
        print(f"  -> Passed: Found {len(decls)} extracted statutory declarations.")

        eval_res = client.post(
            f"/api/compliance/evaluate?inspection_id={inspection_id}",
            headers=inspector_headers,
            json={}
        )
        assert eval_res.status_code == 200
        eval_data = eval_res.json()
        assert eval_data["total_rules_evaluated"] > 0
        assert len(eval_data["findings"]) > 0
        print(f"  -> Passed: Compliance evaluation generated {len(eval_data['findings'])} findings across {eval_data['total_rules_evaluated']} rules (Status: {eval_data['overall_status']}).")

        # 9. Role-Based Authorization
        print("\n[9] Testing Role-Based Authorization (RBAC)...")
        # Inspector trying to create a rule (Restricted to ADMIN/REVIEWER)
        forbidden_res = client.post("/api/rules", headers=inspector_headers, json={
            "rule_id": "RULE-TEST-999",
            "requirement": "Unauthorized test rule"
        })
        assert forbidden_res.status_code == 403, f"Expected 403 Forbidden for Inspector creating rule, got {forbidden_res.status_code}"
        print("  -> Passed: Inspector blocked from creating rule (403 Forbidden).")

        # Admin creating a rule (Allowed)
        allowed_rule_res = client.post("/api/rules", headers=admin_headers, json={
            "rule_id": "RULE-TEST-999",
            "source_document": "Legal Metrology (Packaged Commodities) Rules, 2011",
            "rule_clause_reference": "Applicable Rule",
            "version": "2011.1",
            "requirement": "Test rule requirement for admin validation.",
            "applicability_conditions": {"categories": ["ALL"]},
            "validation_type": "PRESENCE",
            "validation_parameters": {"target_field": "commodity_name"},
            "severity": "MEDIUM"
        })
        assert allowed_rule_res.status_code == 201, f"Admin rule creation failed: {allowed_rule_res.text}"
        print("  -> Passed: Admin authorized to create rule (201 Created).")

        # 10. Human Review & Audit Trail
        print("\n[10] Testing Human Review Submission (POST /api/reviews)...")
        review_res = client.post(
            f"/api/reviews?inspection_id={inspection_id}",
            headers=inspector_headers,
            json={
                "action_type": "SIGN_OFF",
                "new_status": "COMPLIANT",
                "comments": "Inspected and confirmed by Authorized Enforcement Officer."
            }
        )
        assert review_res.status_code == 201, f"Review submission failed: {review_res.text}"
        print("  -> Passed: Officer review signed off.")

        # 11. Report Generation
        print("\n[11] Testing Report Generation (POST /api/reports/generate)...")
        rep_res = client.post(
            f"/api/reports/generate?inspection_id={inspection_id}",
            headers=inspector_headers,
            json={"report_type": "FORM_II_STATUTORY_NOTICE"}
        )
        assert rep_res.status_code == 201, f"Report generation failed: {rep_res.text}"
        rep_data = rep_res.json()
        assert rep_data["report_code"].startswith("REP-")
        print(f"  -> Passed: Generated statutory report {rep_data['report_code']}.")

        # 12. Dashboard Telemetry
        print("\n[12] Testing Dashboard Telemetry (GET /api/dashboard/stats)...")
        dash_res = client.get("/api/dashboard/stats", headers=inspector_headers)
        assert dash_res.status_code == 200
        dash_data = dash_res.json()
        assert dash_data["total_inspections"] >= 1
        assert "category_distribution" in dash_data
        assert "trends" in dash_data
        print(f"  -> Passed: Dashboard telemetry returned {dash_data['total_inspections']} total inspections.")

    print("\n==================================================")
    print("ALL 12 VERIFICATION TESTS PASSED SUCCESSFULLY!")
    print("==================================================")

if __name__ == "__main__":
    run_tests()
