"""
workers/celery_app.py
Configuración de Celery con Redis (Upstash).
"""

from celery import Celery
from config.settings import settings

app = Celery(
    "gandia_vision",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=[
        "workers.task_frame",
        "workers.task_stream",
        "workers.task_rfid",
    ],
)

app.conf.update(
    task_serializer       = "json",
    accept_content        = ["json"],
    result_serializer     = "json",
    timezone              = "America/Monterrey",
    enable_utc            = True,
    task_track_started    = True,
    task_acks_late        = True,
    worker_prefetch_multiplier = 1,   # 1 tarea a la vez por worker (pesado con GPU)
    task_routes = {
        "workers.task_frame.*":  {"queue": "vision"},
        "workers.task_stream.*": {"queue": "vision"},
        "workers.task_rfid.*":   {"queue": "rfid"},
    },
)
