# SIH26034 — Legal Metrology Packaged Commodities Compliance Backend

Production-grade FastAPI backend for SIH 2026 Problem Statement **SIH26034**:  
*"Software System to check compliance of Packaged Commodities under Legal Metrology (Packaged Commodities) Rules, 2011 by scanning products, images and labels."*

---

## 🏛️ System Architecture

### 1. Data-Driven Compliance Engine (4-Tier Pipeline)
Legal rules are **never hard-coded in Python `if/else` statements**. Instead, rules are structured, versioned database records evaluated through a formal 4-tier pipeline:

```
┌─────────────────┐
│    Rule Data    │  (Structured schemas with applicability & validation parameters)
└────────┬────────┘
         ▼
┌─────────────────┐
│  Applicability  │  (Evaluates commodity category, package type, import status, exemptions)
│    Evaluator    │
└────────┬────────┘
         ▼
┌─────────────────┐
│   Validation    │  (Presence, Standard Units, Regex Format, Font Proportions)
│     Engine      │
└────────┬────────┘
         ▼
┌─────────────────┐
│   Compliance    │  (PASS, FAIL, NEEDS_REVIEW, NOT_APPLICABLE with evidence & audit trail)
│     Finding     │
└─────────────────┘
```

### 2. AI Analysis Integration Layer
Clean, abstract service interfaces are established so computer vision, OCR, and detection models can be plugged in without refactoring:
- `IImageQualityAnalyzer`: Sharpness, glare, skew, resolution assessment.
- `IImagePreprocessor`: Perspective deskewing, noise filtering, PDP panel isolation.
- `IOCRService`: Character recognition & token confidence extraction.
- `IRegionDetector`: Text block and statutory panel localization.
- `IDeclarationExtractor`: Entity parsing for MRP, net quantity, manufacturer, dates, and grievance contacts.
- `AIPipelineOrchestrator`: 8-stage pipeline orchestrator matching enforcement workflows.

### 3. Storage Abstraction
- `StorageService` interface decoupled from underlying storage engines.
- `LocalStorageService` with file validation, MIME sanitization, and path-traversal safety (extensible for S3/GCS).

### 4. Role-Based Access Control (RBAC)
- **`ADMIN`**: User management, system calibration, rule schema creation/modification.
- **`INSPECTOR`**: Field inspections, image capture/upload, automated verification, report generation.
- **`REVIEWER`**: Appellate reviews, declaration overrides, finding sign-offs, and compliance certification.

---

## 🚀 Getting Started

### 1. Prerequisites
- Python 3.10+
- PostgreSQL (optional, SQLite supported out-of-the-box for local development)

### 2. Virtual Environment Setup
```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Configure `.env` settings as needed:
```env
APP_NAME="Legal Metrology Compliance Inspection System API"
DATABASE_URL="sqlite:///./legal_metrology.db"
# Or PostgreSQL:
# DATABASE_URL="postgresql+psycopg://postgres:password@localhost:5432/legal_metrology"
SECRET_KEY="your-secure-random-jwt-secret-key"
ACCESS_TOKEN_EXPIRE_MINUTES=480
STORAGE_DRIVER="local"
UPLOAD_DIR="./uploads"
```

### 4. Database Migrations (Alembic)
```bash
# Run migrations
alembic upgrade head
```

### 5. Running the Application
```bash
# Start FastAPI development server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

---

## 🔐 Default Seed Credentials

Upon startup, the system automatically initializes default user accounts for testing:

| Role | Username | Password | Email | Zone / Directorate |
|---|---|---|---|---|
| **ADMIN** | `admin` | `Admin@123456` | `admin@legalmetrology.gov.in` | Central Directorate |
| **INSPECTOR** | `inspector.sharma` | `Officer@123456` | `r.sharma@legalmetrology.gov.in` | North Zone - Division 04 |
| **REVIEWER** | `reviewer.patel` | `Reviewer@123456` | `s.patel@legalmetrology.gov.in` | Appellate Review Division |

---

## 📡 API Endpoints Overview

| Prefix | Tags | Key Endpoints |
|---|---|---|
| `/api/health` | Health | `GET /api/health` — System status & DB connectivity |
| `/api/auth` | Authentication | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` |
| `/api/inspections` | Inspections | `POST /api/inspections`, `GET /api/inspections`, `GET /api/inspections/{id}`, `POST /api/inspections/{id}/images` |
| `/api/analysis` | AI Pipeline | `POST /api/analysis/trigger` — Executes 8-stage verification pipeline |
| `/api/declarations` | Declarations | `GET /api/declarations`, `POST /api/declarations`, `PUT /api/declarations/{id}`, `POST /api/declarations/{id}/verify` |
| `/api/compliance` | Compliance Engine | `POST /api/compliance/evaluate`, `GET /api/compliance/findings/{inspection_id}` |
| `/api/reviews` | Reviews & Audit | `POST /api/reviews`, `GET /api/reviews/{inspection_id}` — Human sign-offs & overrides |
| `/api/reports` | Statutory Notices | `POST /api/reports/generate`, `GET /api/reports`, `GET /api/reports/{id}` |
| `/api/rules` | Rule Repository | `GET /api/rules`, `GET /api/rules/{id}`, `POST /api/rules`, `PUT /api/rules/{id}` |
| `/api/dashboard` | Telemetry | `GET /api/dashboard/stats` — Metrics, trends, violation breakdowns |

---

## 📖 Interactive API Documentation

- **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **OpenAPI Schema**: [http://localhost:8000/openapi.json](http://localhost:8000/openapi.json)
