"""
db/repositories/anomalias.py
Operaciones sobre anomalias_monitoreo y vision_evidencia.
"""

from datetime import datetime
from typing import Optional
from db.client import db


class AnomaliasRepo:

    TABLE_ANOMALIAS = "anomalias_monitoreo"
    TABLE_EVIDENCIA = "vision_evidencia"

    def crear_anomalia(self, rancho_id: str, corral_id: str, tipo: str,
                       severidad: str, fuente: str = "vision_ia",
                       animal_id: Optional[str] = None,
                       notas: Optional[str] = None,
                       track_id: Optional[str] = None) -> dict:
        data = {
            "rancho_id":  rancho_id,
            "corral_id":  corral_id,
            "tipo":       tipo,
            "severidad":  severidad,
            "fuente":     fuente,
            "animal_id":  animal_id,
            "notas":      notas,
            "resuelto":   False,
        }
        res = db.table(self.TABLE_ANOMALIAS).insert(data).execute()
        return res.data[0] if res.data else {}

    def ya_existe_activa(self, corral_id: str, tipo: str,
                         ventana_minutos: int = 30) -> bool:
        """Evita duplicar anomalías del mismo tipo en la misma ventana de tiempo."""
        from datetime import timedelta
        desde = (datetime.utcnow() - timedelta(minutes=ventana_minutos)).isoformat()
        res = (db.table(self.TABLE_ANOMALIAS)
               .select("id")
               .eq("corral_id", corral_id)
               .eq("tipo", tipo)
               .eq("resuelto", False)
               .gte("created_at", desde)
               .limit(1)
               .execute())
        return len(res.data or []) > 0

    def guardar_evidencia(self, anomalia_id: str, track_id: Optional[str],
                          url_storage: str, bbox: dict,
                          clase: str, confianza: float,
                          frame_context_url: Optional[str] = None) -> dict:
        data = {
            "anomalia_id":       anomalia_id,
            "track_id":          track_id,
            "url_storage":       url_storage,
            "timestamp":         datetime.utcnow().isoformat(),
            "bbox_x":            bbox.get("x", 0),
            "bbox_y":            bbox.get("y", 0),
            "bbox_w":            bbox.get("w", 0),
            "bbox_h":            bbox.get("h", 0),
            "clase":             clase,
            "confianza":         round(confianza, 4),
            "frame_context_url": frame_context_url,
        }
        res = db.table(self.TABLE_EVIDENCIA).insert(data).execute()
        return res.data[0] if res.data else {}

    def anomalias_activas(self, rancho_id: str) -> list:
        res = (db.table(self.TABLE_ANOMALIAS)
               .select("*, vision_evidencia(*)")
               .eq("rancho_id", rancho_id)
               .eq("resuelto", False)
               .order("created_at", desc=True)
               .execute())
        return res.data or []

    def resolver(self, anomalia_id: str, resuelto_por: str) -> None:
        db.table(self.TABLE_ANOMALIAS).update({
            "resuelto":    True,
            "resuelto_en": datetime.utcnow().isoformat(),
        }).eq("id", anomalia_id).execute()


anomalias_repo = AnomaliasRepo()
