"""
workers/task_frame.py
Tarea Celery: procesar un frame individual enviado como base64.
"""

import base64
import numpy as np
import cv2
from loguru import logger

from workers.celery_app import app
from db.repositories.detecciones import detecciones_repo


@app.task(bind=True, max_retries=2, queue="vision",
          name="workers.task_frame.procesar_frame")
def procesar_frame(self, frame_b64: str, camara_id: str, corral_id: str,
                   rancho_id: str, session_id: str,
                   n_vacas_esperadas: int = 0) -> dict:
    """
    Decodifica un frame base64, corre YOLO + ByteTrack + reglas.
    """
    try:
        # Decodificar frame
        frame_bytes = base64.b64decode(frame_b64)
        frame_np    = np.frombuffer(frame_bytes, np.uint8)
        frame       = cv2.imdecode(frame_np, cv2.IMREAD_COLOR)

        if frame is None:
            raise ValueError("Frame inválido")

        # Procesar
        from vision.stream_processor import StreamProcessor
        processor = StreamProcessor(
            camara_id         = camara_id,
            corral_id         = corral_id,
            rancho_id         = rancho_id,
            rtsp_url          = "",
            session_id        = session_id,
            n_vacas_esperadas = n_vacas_esperadas,
        )

        resultado = processor.procesar_frame_unico(frame)
        logger.info(f"Frame procesado: {resultado['conteos']} | "
                    f"latencia={resultado['latencia_ms']}ms")
        return resultado

    except Exception as exc:
        logger.error(f"Error procesando frame: {exc}")
        raise self.retry(exc=exc, countdown=2)
