"""
vision/analyzer.py
Análisis de comportamiento por track.
Evalúa cada track y decide si hay anomalía.
"""

import json
from pathlib import Path
from typing import Optional
from loguru import logger


# ─── CARGA DE UMBRALES ────────────────────────────────────────────────────────

def cargar_umbrales(rancho_id: Optional[str] = None) -> dict:
    """
    Carga umbrales. Primero intenta desde DB (por rancho),
    si no usa el default de config/rules_default.json.
    """
    default_path = Path(__file__).parent.parent / "config" / "rules_default.json"
    with open(default_path) as f:
        defaults = json.load(f)

    if rancho_id:
        try:
            from db.client import db
            res = (db.table("anomalia_umbrales")
                   .select("*")
                   .eq("rancho_id", rancho_id)
                   .single()
                   .execute())
            if res.data:
                defaults.update(res.data)
        except Exception:
            pass  # Usa defaults si falla

    return defaults


# ─── ANALYZER ─────────────────────────────────────────────────────────────────

class BehaviorAnalyzer:
    """
    Evalúa tracks y genera señales de anomalía.
    Separado de la lógica de persistencia — solo análisis.
    """

    def __init__(self, rancho_id: Optional[str] = None):
        self.umbrales = cargar_umbrales(rancho_id)

    def analizar_tracks(self, tracks: list[dict],
                        n_vacas_esperadas: int,
                        frame_w_metros: float = 30.0) -> list[dict]:
        """
        Evalúa todos los tracks de un frame y retorna lista de anomalías detectadas.

        Returns:
            [
              {
                "tipo": "postura_caida",
                "severidad": "alta",
                "track_id": 5,
                "animal_id": "uuid...",
                "descripcion": "Animal sin movimiento por 22 min",
                "confianza": 0.91,
              }
            ]
        """
        anomalias = []
        n_detectados = len(tracks)

        # ── Sobrepoblación ─────────────────────────────────────────────────
        if n_vacas_esperadas > 0:
            pct = (n_detectados / n_vacas_esperadas) * 100
            if pct > self.umbrales.get("sobrepoblacion_pct", 110):
                anomalias.append({
                    "tipo":        "Sobrepoblación",
                    "severidad":   self.umbrales["severidades"]["sobrepoblacion"],
                    "track_id":    None,
                    "animal_id":   None,
                    "descripcion": f"Detectadas {n_detectados} vacas, capacidad {n_vacas_esperadas} ({pct:.0f}%)",
                    "confianza":   0.85,
                })

        # ── Análisis por track ─────────────────────────────────────────────
        centroide = self._centroide(tracks)

        for track in tracks:
            tid = track["track_id"]

            # Postura caída
            umbral_caida = self.umbrales.get("postura_caida_minutos", 20) * 60
            if (track["clase"] == "cow_down"
                    and track["tiempo_inmovil_seg"] >= umbral_caida):
                anomalias.append({
                    "tipo":        "Postura caída",
                    "severidad":   self.umbrales["severidades"]["postura_caida"],
                    "track_id":    tid,
                    "animal_id":   track.get("animal_id"),
                    "descripcion": f"Animal postrado {track['tiempo_inmovil_seg']/60:.1f} min",
                    "confianza":   track["confianza"],
                })

            # Lesión sospechosa
            if (track["clase"] == "wound_suspect"
                    and track["confianza"] >= self.umbrales.get("wound_suspect_confianza", 0.65)):
                anomalias.append({
                    "tipo":        "Herida sospechosa",
                    "severidad":   self.umbrales["severidades"]["wound_suspect"],
                    "track_id":    tid,
                    "animal_id":   track.get("animal_id"),
                    "descripcion": f"Lesión detectada con {track['confianza']*100:.0f}% confianza",
                    "confianza":   track["confianza"],
                })

            # Separación del hato
            dist = self._distancia_al_centroide(track, centroide, frame_w_metros)
            umbral_sep = self.umbrales.get("separacion_metros", 15)
            if n_detectados >= 3 and dist >= umbral_sep:
                anomalias.append({
                    "tipo":        "Separación del hato",
                    "severidad":   self.umbrales["severidades"]["separacion"],
                    "track_id":    tid,
                    "animal_id":   track.get("animal_id"),
                    "descripcion": f"Animal a {dist:.1f}m del grupo",
                    "confianza":   0.75,
                })

        return anomalias

    def evaluar_faltante(self, n_detectados: int, n_esperados: int,
                         minutos_ventana: float) -> Optional[dict]:
        """Detecta animales faltantes comparando conteo vs inventario."""
        if n_esperados <= 0:
            return None

        umbral = self.umbrales.get("faltante_minutos", 30)
        faltantes = n_esperados - n_detectados

        if faltantes > 0 and minutos_ventana >= umbral:
            return {
                "tipo":        "Faltante RFID",
                "severidad":   self.umbrales["severidades"]["faltante"],
                "track_id":    None,
                "animal_id":   None,
                "descripcion": f"{faltantes} animal(es) sin detectar por {minutos_ventana:.0f} min",
                "confianza":   0.70,
            }
        return None

    def _centroide(self, tracks: list[dict]) -> tuple[float, float]:
        if not tracks:
            return 0.5, 0.5
        return (
            sum(t["pos_x"] for t in tracks) / len(tracks),
            sum(t["pos_y"] for t in tracks) / len(tracks),
        )

    def _distancia_al_centroide(self, track: dict, centroide: tuple,
                                 frame_w_metros: float) -> float:
        cx, cy = centroide
        dx = (track["pos_x"] - cx) * frame_w_metros
        dy = (track["pos_y"] - cy) * frame_w_metros
        return round((dx**2 + dy**2) ** 0.5, 2)
