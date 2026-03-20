"""
config/settings.py
Configuración centralizada con Pydantic BaseSettings.
Todas las variables de entorno del sistema.
"""

from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # ── Supabase ──────────────────────────────────────────────────────────────
    supabase_url:         str
    supabase_service_key: str
    supabase_anon_key:    str
    storage_bucket:       str = "gandia-vision-evidence"

    # ── Redis ─────────────────────────────────────────────────────────────────
    redis_url: str = "redis://localhost:6379"

    # ── Auth ──────────────────────────────────────────────────────────────────
    jwt_secret:    str
    jwt_algorithm: str = "HS256"

    # ── Vision ────────────────────────────────────────────────────────────────
    yolo_model_path:  str   = "./models/yolov11n.pt"
    yolo_confidence:  float = 0.45
    yolo_iou:         float = 0.45
    max_fps:          int   = 10

    # ── MQTT ──────────────────────────────────────────────────────────────────
    mqtt_broker:   str = "localhost"
    mqtt_port:     int = 1883
    mqtt_user:     str = ""
    mqtt_password: str = ""
    mqtt_topic:    str = "gandia/rfid/#"

    # ── Sentry ────────────────────────────────────────────────────────────────
    sentry_dsn: str = ""

    # ── App ───────────────────────────────────────────────────────────────────
    environment: str = "development"
    log_level:   str = "INFO"
    app_version: str = "1.0.0"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
