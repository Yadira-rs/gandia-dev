"""
workers/task_rfid.py
Tarea Celery: procesar lectura RFID y cruzar con tracks activos.
"""

from loguru import logger
from workers.celery_app import app
from db.repositories.rfid import rfid_repo


@app.task(bind=True, max_retries=3, queue="rfid",
          name="workers.task_rfid.procesar_lectura")
def procesar_lectura(self, arete: str, corral_id: str, rancho_id: str,
                     tipo: str = "lectura", fuente: str = "mqtt",
                     lector_id: str = None) -> dict:
    """
    Persiste una lectura RFID y la cruza con tracks de visión activos.
    """
    try:
        evento = rfid_repo.guardar_evento(
            rancho_id = rancho_id,
            corral_id = corral_id,
            arete     = arete,
            tipo      = tipo,
            fuente    = fuente,
            lector_id = lector_id,
        )

        matched = evento.get("animal_id") is not None
        logger.info(f"RFID procesado: {arete} | match={matched}")
        return {"evento_id": evento.get("id"), "matched": matched}

    except Exception as exc:
        logger.error(f"Error procesando RFID {arete}: {exc}")
        raise self.retry(exc=exc, countdown=1)
