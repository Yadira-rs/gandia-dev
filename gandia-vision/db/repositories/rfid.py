"""
db/repositories/rfid.py
Lecturas RFID y cruce con animales registrados.
"""

from datetime import datetime, timedelta
from typing import Optional
from db.client import db


class RFIDRepo:

    TABLE_EVENTOS  = "rfid_eventos"
    TABLE_ANIMALES = "animales"

    def guardar_evento(self, rancho_id: str, corral_id: str, arete: str,
                       tipo: str, fuente: str = "mqtt",
                       lector_id: Optional[str] = None) -> dict:
        # Buscar animal_id por arete
        animal = self.buscar_por_arete(arete)
        data = {
            "rancho_id":  rancho_id,
            "corral_id":  corral_id,
            "arete":      arete,
            "animal_id":  animal.get("id") if animal else None,
            "timestamp":  datetime.utcnow().isoformat(),
            "tipo":       tipo,
            "fuente":     fuente,
            "lector_id":  lector_id,
        }
        res = db.table(self.TABLE_EVENTOS).insert(data).execute()
        return res.data[0] if res.data else {}

    def buscar_por_arete(self, arete: str) -> Optional[dict]:
        res = (db.table(self.TABLE_ANIMALES)
               .select("id, siniiga, rfid, nombre")
               .or_(f"siniiga.eq.{arete},rfid.eq.{arete}")
               .limit(1)
               .execute())
        return res.data[0] if res.data else None

    def lecturas_recientes(self, corral_id: str,
                           ventana_segundos: int = 30) -> list:
        """Retorna lecturas RFID recientes para cruzar con tracks de visión."""
        desde = (datetime.utcnow() - timedelta(seconds=ventana_segundos)).isoformat()
        res = (db.table(self.TABLE_EVENTOS)
               .select("arete, animal_id, timestamp")
               .eq("corral_id", corral_id)
               .gte("timestamp", desde)
               .execute())
        return res.data or []

    def eventos_por_rancho(self, rancho_id: str, limite: int = 200) -> list:
        res = (db.table(self.TABLE_EVENTOS)
               .select("*, animales(siniiga, nombre)")
               .eq("rancho_id", rancho_id)
               .order("timestamp", desc=True)
               .limit(limite)
               .execute())
        return res.data or []


rfid_repo = RFIDRepo()
