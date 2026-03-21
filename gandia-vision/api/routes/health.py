"""api/routes/health.py"""
from fastapi import APIRouter
from config.settings import settings

router = APIRouter(tags=["Health"])


@router.get("/health")
async def health():
    return {"status": "ok", "version": settings.app_version, "env": settings.environment}


@router.get("/version")
async def version():
    return {"version": settings.app_version}
