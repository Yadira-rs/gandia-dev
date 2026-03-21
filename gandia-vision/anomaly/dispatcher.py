"""
anomaly/dispatcher.py
Toma una señal de anomalía del analyzer y la persiste en Supabase.
Evita duplicados. Adjunta evidencia. Notifica via Realtime.
"""

from loguru import logger
from db.repositories.anomalias import anomalias_repo


class AnomalyDispatcher:

    # Ventana anti-duplicados por tipo (minutos)
    VENTANA_DEDUP = {
        "Postura caída":       30,
        "Separación del hato": 20,
        "Herida sospechosa":   60,
        "Faltante RFID":       30,
        "Sin ingesta":         60,
        "Sobrepoblación":      15,
    }

    def __init__(self, rancho_id: str, corral_id: str):
        self.rancho_id = rancho_id
        self.corral_id = corral_id

    def despachar(self, señal: dict, evidencia: dict) -> dict | None:
        """
        Persiste una anomalía si no existe ya una activa del mismo tipo.

        Args:
            señal: output del analyzer.analizar_tracks()
            evidencia: output de evidence_capture.capturar_y_subir()

        Returns:
            dict con la anomalía creada, o None si era duplicado
        """
        tipo      = señal["tipo"]
        ventana   = self.VENTANA_DEDUP.get(tipo, 30)

        # Anti-duplicado
        if anomalias_repo.ya_existe_activa(self.corral_id, tipo, ventana):
            logger.debug(f"Anomalía duplicada ignorada: {tipo}")
            return None

        # Crear anomalía
        anomalia = anomalias_repo.crear_anomalia(
            rancho_id = self.rancho_id,
            corral_id = self.corral_id,
            tipo      = tipo,
            severidad = señal["severidad"],
            fuente    = "vision_ia",
            animal_id = señal.get("animal_id"),
            notas     = señal.get("descripcion"),
        )

        if not anomalia:
            return None

        anomalia_id = anomalia["id"]
        logger.info(f"Anomalía creada: {tipo} [{señal['severidad']}] → {anomalia_id}")

        # Adjuntar evidencia si hay
        if evidencia.get("url_storage"):
            anomalias_repo.guardar_evidencia(
                anomalia_id = anomalia_id,
                track_id    = None,
                url_storage = evidencia["url_storage"],
                bbox        = evidencia.get("bbox", {}),
                clase       = evidencia.get("clase", tipo),
                confianza   = evidencia.get("confianza", 0.0),
            )

        # Supabase Realtime notifica automáticamente al frontend
        # gracias a: ALTER PUBLICATION supabase_realtime ADD TABLE anomalias_monitoreo
        return anomalia
