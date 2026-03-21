"""
anomaly/scorer.py
Calcula el score sanitario 0-100 del rancho.
Fuente de verdad — reemplaza el cálculo frontend.
"""

from db.client import db
from loguru import logger


class SanitaryScorer:

    def calcular(self, rancho_id: str) -> dict:
        """
        Calcula el score sanitario 0-100 con breakdown por componente.

        Returns:
            {
              "score": 85,
              "label": "ÓPTIMO",
              "breakdown": {
                "anomalias_alta": 40,
                "corrales_alerta": 30,
                "camaras_online": 15,
                "animales_registrados": 10,
                "bonus_rfid": 5,
              },
              "detalles": { ... }
            }
        """
        try:
            res = (db.table("v_monitoreo_rancho")
                   .select("*")
                   .eq("rancho_id", rancho_id)
                   .single()
                   .execute())
            data = res.data or {}
        except Exception as e:
            logger.error(f"Error obteniendo resumen: {e}")
            data = {}

        # ── Componentes ────────────────────────────────────────────────────

        # 1. Anomalías de severidad alta (0-40)
        n_alta = data.get("anomalias_alta") or 0
        s_anomalias = max(0, 40 - n_alta * 8)

        # 2. Corrales en alerta (0-30)
        n_alerta = data.get("corrales_alerta") or 0
        s_corrales = max(0, 30 - n_alerta * 6)

        # 3. Cobertura de cámaras (0-20)
        total_corrales  = max(data.get("total_corrales") or 1, 1)
        camaras_online  = data.get("camaras_online") or 0
        s_camaras = round((camaras_online / total_corrales) * 20)

        # 4. Animales registrados (0-10)
        s_animales = 10 if (data.get("animales_total") or 0) > 0 else 0

        score_base = s_anomalias + s_corrales + s_camaras + s_animales

        # ── Bonus ──────────────────────────────────────────────────────────

        bonus_rfid = 0
        try:
            # Bonus si >80% de tracks tienen RFID match en las últimas 24h
            res_tracks = (db.table("vision_tracks")
                          .select("animal_id")
                          .eq("corral_id", data.get("corral_id", ""))
                          .limit(100)
                          .execute())
            if res_tracks.data:
                con_rfid = sum(1 for t in res_tracks.data if t["animal_id"])
                if con_rfid / len(res_tracks.data) > 0.8:
                    bonus_rfid = 5
        except Exception:
            pass

        score = min(100, score_base + bonus_rfid)

        return {
            "score": score,
            "label": self._label(score),
            "color": self._color(score),
            "breakdown": {
                "anomalias_alta":       s_anomalias,
                "corrales_alerta":      s_corrales,
                "camaras_online":       s_camaras,
                "animales_registrados": s_animales,
                "bonus_rfid":           bonus_rfid,
            },
            "detalles": {
                "n_anomalias_alta": n_alta,
                "n_corrales_alerta": n_alerta,
                "camaras_online": camaras_online,
                "total_corrales": total_corrales,
                "animales_total": data.get("animales_total", 0),
            }
        }

    def _label(self, score: int) -> str:
        if score >= 85: return "ÓPTIMO"
        if score >= 65: return "ACEPTABLE"
        return "RIESGO"

    def _color(self, score: int) -> str:
        if score >= 85: return "#2FAF8F"
        if score >= 65: return "#F5A623"
        return "#E5484D"


scorer = SanitaryScorer()