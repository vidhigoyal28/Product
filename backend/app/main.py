import os
from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse

from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
from app.core.security import hash_password
from app.models.user import User
from app.models.enums import UserRole
from app.services.compliance.rule_repository import RuleRepository
from app.api.v1.api import api_router


def seed_default_users():
    """Seed initial default credentials for testing and evaluation."""
    db = SessionLocal()
    try:
        # 1. Admin
        if not db.query(User).filter(User.username == "admin").first():
            admin = User(
                username="admin",
                email="admin@legalmetrology.gov.in",
                full_name="National Directorate Admin",
                hashed_password=hash_password("Admin@123456"),
                role=UserRole.ADMIN,
                badge_number="LM-NAT-001",
                zone_division="Central Directorate",
                is_active=True
            )
            db.add(admin)

        # 2. Inspector
        if not db.query(User).filter(User.username == "inspector.sharma").first():
            inspector = User(
                username="inspector.sharma",
                email="r.sharma@legalmetrology.gov.in",
                full_name="Inspector R. Sharma",
                hashed_password=hash_password("Officer@123456"),
                role=UserRole.INSPECTOR,
                badge_number="LM-DEL-2024-88",
                zone_division="North Zone - Division 04",
                is_active=True
            )
            db.add(inspector)

        # 3. Reviewer
        if not db.query(User).filter(User.username == "reviewer.patel").first():
            reviewer = User(
                username="reviewer.patel",
                email="s.patel@legalmetrology.gov.in",
                full_name="Senior Reviewer S. Patel",
                hashed_password=hash_password("Reviewer@123456"),
                role=UserRole.REVIEWER,
                badge_number="LM-REV-2024-12",
                zone_division="Appellate Review Division",
                is_active=True
            )
            db.add(reviewer)

        db.commit()

        # Seed safe rule schemas
        RuleRepository.seed_initial_rules(db)
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    Base.metadata.create_all(bind=engine)
    Path(settings.UPLOAD_DIR).mkdir(parents=True, exist_ok=True)
    seed_default_users()
    yield
    # Shutdown


app = FastAPI(
    title=settings.APP_NAME,
    description=(
        "Production-grade backend system for SIH 2026 Problem Statement SIH26034: "
        "'Software System to check compliance of Packaged Commodities under "
        "Legal Metrology (Packaged Commodities) Rules, 2011'."
    ),
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded static files
upload_path = Path(settings.UPLOAD_DIR).resolve()
upload_path.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(upload_path)), name="uploads")

# Mount API routes under /api
app.include_router(api_router, prefix="/api")


@app.get("/", include_in_schema=False)
def root_redirect():
    return RedirectResponse(url="/docs")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
