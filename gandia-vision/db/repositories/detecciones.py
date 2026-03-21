"""
db/repositories/detecciones.py
Operaciones sobre vision_detecciones y vision_tracks.
"""

from datetime import datetime
from typing import Optional
from db.client import db
from loguru import logger


class DeteccionesRepo:

    TABLE_DETECCIONES = "vision_detecciones"
    TABLE_TRACKS      = "vision_tracks"
    TABLE_SESSIONS    = "vision_sessions"

    # ── Sessions ──────────────────────────────────────────────────────────────

    def crear_session(self, rancho_id: str, camara_id: str, corral_id: str,
                      fps_target: int, modelo_version: str) -> dict:
        data = {
            "rancho_id":      rancho_id,
            "camara_id":      camara_id,
            "corral_id":      corral_id,
            "inicio":         datetime.utcnow().isoformat(),
            "estado":         "active",
            "fps_target":     fps_target,
            "modelo_version": modelo_version,
        }
        res = db.table(self.TABLE_SESSIONS).insert(data).execute()
        return res.data[0] if res.data else {}

    def cerrar_session(self, session_id: str, frames_procesados: int, fps_real: float) -> None:
        db.table(self.TABLE_SESSIONS).update({
            "fin":                datetime.utcnow().isoformat(),
            "estado":             "completed",
            "frames_procesados":  frames_procesados,
            "fps_real":           round(fps_real, 2),
        }).eq("id", session_id).execute()

    # ── Detecciones ───────────────────────────────────────────────────────────

    def guardar_deteccion(self, session_id: str, camara_id: str, corral_id: str,
                          n_vacas: int, n_down: int, n_wound: int,
                          confianza_promedio: float, latencia_ms: int,
                          modelo_version: str) -> dict:
        data = {
            "session_id":         session_id,
            "camara_id":          camara_id,
            "corral_id":          corral_id,
            "timestamp":          datetime.utcnow().isoformat(),
            "n_vacas":            n_vacas,
            "n_down":             n_down,
            "n_wound_suspect":    n_wound,
            "confianza_promedio": round(confianza_promedio, 4),
            "latencia_ms":        latencia_ms,
            "modelo_version":     modelo_version,
        }
        res = db.table(self.TABLE_DETECCIONES).insert(data).execute()
        return res.data[0] if res.data else {}

    def ultimas_detecciones(self, corral_id: str, limite: int = 100) -> list:
        res = (db.table(self.TABLE_DETECCIONES)
               .select("*")
               .eq("corral_id", corral_id)
               .order("timestamp", desc=True)
               .limit(limite)
               .execute())
        return res.data or []

    # ── Tracks ────────────────────────────────────────────────────────────────

    def upsert_track(self, session_id: str, track_id_local: int, corral_id: str,
                     pos_x: float, pos_y: float, velocidad: float,
                     tiempo_inmovil: float, dist_centroide: float,
                     clase: str, confianza: float,
                     animal_id: Optional[str] = None) -> dict:
        data = {
            "session_id":              session_id,
            "track_id_local":          track_id_local,
            "corral_id":               corral_id,
            "animal_id":               animal_id,
            "ultimo_frame":            datetime.utcnow().isoformat(),
            "posicion_x":              round(pos_x, 4),
            "posicion_y":              round(pos_y, 4),
            "velocidad_actual":        round(velocidad, 4),
            "tiempo_inmovil_segundos": round(tiempo_inmovil, 1),
            "distancia_centroide_hato": round(dist_centroide, 2),
            "clase_dominante":         clase,
            "confianza_promedio":      round(confianza, 4),
        }
        res = (db.table(self.TABLE_TRACKS)
               .upsert(data, on_conflict="session_id,track_id_local")
               .execute())
        return res.data[0] if res.data else {}

    def tracks_activos(self, session_id: str) -> list:
        res = (db.table(self.TABLE_TRACKS)
               .select("*")
               .eq("session_id", session_id)
               .execute())
        return res.data or []


detecciones_repo = DeteccionesRepo()
