"""
workers/task_stream.py
Tarea Celery de larga duración: procesar stream RTSP completo.
"""

from loguru import logger
from workers.celery_app import app
from db.repositories.detecciones import detecciones_repo


# Registro de streams activos en memoria del worker
_streams_activos: dict = {}


@app.task(bind=True, queue="vision", time_limit=86400,
          name="workers.task_stream.iniciar_stream")
def iniciar_stream(self, camara_id: str, corral_id: str, rancho_id: str,
                   rtsp_url: str, fps_target: int = 10,
                   n_vacas_esperadas: int = 0) -> dict:
    """
    Inicia el procesamiento continuo de un stream RTSP.
    Corre hasta que se llame detener_stream().
    """
    from db.repositories.detecciones import detecciones_repo
    from vision.stream_processor import StreamProcessor

    # Crear sesión en DB
    session = detecciones_repo.crear_session(
        rancho_id     = rancho_id,
        camara_id     = camara_id,
        corral_id     = corral_id,
        fps_target    = fps_target,
        modelo_version= "yolov11n-gandia-1.0",
    )
    session_id = session.get("id", "unknown")

    processor = StreamProcessor(
        camara_id         = camara_id,
        corral_id         = corral_id,
        rancho_id         = rancho_id,
        rtsp_url          = rtsp_url,
        session_id        = session_id,
        fps_target        = fps_target,
        n_vacas_esperadas = n_vacas_esperadas,
    )

    _streams_activos[camara_id] = processor
    logger.info(f"Stream iniciado: {camara_id} → {rtsp_url}")

    try:
        processor.procesar_stream()
    finally:
        _streams_activos.pop(camara_id, None)

    return {"session_id": session_id, "frames": processor.frames_procesados}


@app.task(queue="vision", name="workers.task_stream.detener_stream")
def detener_stream(camara_id: str) -> dict:
    """Detiene un stream activo por camara_id."""
    processor = _streams_activos.get(camara_id)
    if processor:
        processor.detener()
        logger.info(f"Stream detenido: {camara_id}")
        return {"ok": True}
    return {"ok": False, "error": "Stream no encontrado"}
