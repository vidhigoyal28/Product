from fastapi import APIRouter

from app.api.v1.routers.health import router as health_router
from app.api.v1.routers.auth import router as auth_router
from app.api.v1.routers.inspections import router as inspections_router
from app.api.v1.routers.analysis import router as analysis_router
from app.api.v1.routers.declarations import router as declarations_router
from app.api.v1.routers.compliance import router as compliance_router
from app.api.v1.routers.reviews import router as reviews_router
from app.api.v1.routers.reports import router as reports_router
from app.api.v1.routers.rules import router as rules_router
from app.api.v1.routers.dashboard import router as dashboard_router

api_router = APIRouter()

api_router.include_router(health_router)
api_router.include_router(auth_router)
api_router.include_router(inspections_router)
api_router.include_router(analysis_router)
api_router.include_router(declarations_router)
api_router.include_router(compliance_router)
api_router.include_router(reviews_router)
api_router.include_router(reports_router)
api_router.include_router(rules_router)
api_router.include_router(dashboard_router)
