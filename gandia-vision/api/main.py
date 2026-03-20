"""
api/main.py
Entrada principal de la API Gandia Vision.
Desplegado en Fly.io.
"""

import sentry_sdk
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger

from config.settings import settings
from api.routes import streams, detecciones, anomalias, rfid, score, health


# ─── SENTRY ───────────────────────────────────────────────────────────────────

if settings.sentry_dsn:
    sentry_sdk.init(
        dsn=settings.sentry_dsn,
        environment=settings.environment,
        traces_sample_rate=0.2,
    )


# ─── LIFESPAN ─────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Gandia Vision API v{settings.app_version} iniciando...")
    # Pre-cargar modelo YOLO al arrancar (evita cold start en primer request)
    if settings.environment != "development":
        from vision.detector import get_detector
        get_detector()
        logger.info("Modelo YOLO pre-cargado")
    yield
    logger.info("Apagando Gandia Vision API")


# ─── APP ──────────────────────────────────────────────────────────────────────

app = FastAPI(
    title       = "Gandia Vision API",
    description = "Sistema de monitoreo sanitario bovino con visión por computadora",
    version     = settings.app_version,
    lifespan    = lifespan,
    docs_url    = "/docs" if settings.environment != "production" else None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins     = ["*"],   # Restringir en producción
    allow_credentials = True,
    allow_methods     = ["*"],
    allow_headers     = ["*"],
)

# ─── ROUTERS ──────────────────────────────────────────────────────────────────

app.include_router(health.router)
app.include_router(streams.router)
app.include_router(detecciones.router)
app.include_router(anomalias.router)
app.include_router(rfid.router)
app.include_router(score.router)
