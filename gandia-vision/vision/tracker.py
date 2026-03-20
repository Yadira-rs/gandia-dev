"""
vision/tracker.py
Tracking de bovinos con ByteTrack (via boxmot).
Mantiene ID persistente por animal en una sesión.
"""

import numpy as np
from typing import Optional
from loguru import logger

try:
    from boxmot import ByteTracker
    TRACKER_AVAILABLE = True
except ImportError:
    TRACKER_AVAILABLE = False
    logger.warning("boxmot no disponible, usando tracking simulado")


# ─── TRACK STATE ──────────────────────────────────────────────────────────────

class TrackState:
    """Estado acumulado de un track a lo largo de la sesión."""

    def __init__(self, track_id: int, clase: str, pos_x: float, pos_y: float):
        self.track_id        = track_id
        self.clase_dominante = clase
        self.pos_x           = pos_x
        self.pos_y           = pos_y
        self.historial_pos   = [(pos_x, pos_y)]
        self.velocidades     = []
        self.tiempo_inmovil  = 0.0
        self.animal_id: Optional[str] = None
        self.frames_count    = 1
        self.ultima_clase    = clase
        self.clases_counter  = {clase: 1}

    def actualizar(self, pos_x: float, pos_y: float, clase: str,
                   dt_segundos: float = 0.1):
        """Actualiza posición, velocidad y tiempo inmóvil."""
        # Velocidad en unidades normalizadas por segundo
        dx = pos_x - self.pos_x
        dy = pos_y - self.pos_y
        dist = (dx**2 + dy**2) ** 0.5
        velocidad = dist / dt_segundos if dt_segundos > 0 else 0

        self.velocidades.append(velocidad)
        if len(self.velocidades) > 100:
            self.velocidades.pop(0)

        # Tiempo inmóvil
        if velocidad < 0.005:  # umbral de inmovilidad
            self.tiempo_inmovil += dt_segundos
        else:
            self.tiempo_inmovil = max(0, self.tiempo_inmovil - dt_segundos * 0.5)

        self.pos_x = pos_x
        self.pos_y = pos_y
        self.historial_pos.append((pos_x, pos_y))
        if len(self.historial_pos) > 300:
            self.historial_pos.pop(0)

        # Clase dominante
        self.clases_counter[clase] = self.clases_counter.get(clase, 0) + 1
        self.clase_dominante = max(self.clases_counter, key=self.clases_counter.get)
        self.frames_count += 1

    @property
    def velocidad_promedio(self) -> float:
        return sum(self.velocidades) / len(self.velocidades) if self.velocidades else 0.0

    @property
    def velocidad_actual(self) -> float:
        return self.velocidades[-1] if self.velocidades else 0.0


# ─── TRACKER ──────────────────────────────────────────────────────────────────

class GandiaTracker:
    """
    Wrapper de ByteTrack para mantener IDs consistentes por sesión.
    """

    def __init__(self, fps: int = 10):
        self.fps        = fps
        self.dt         = 1.0 / fps
        self.states: dict[int, TrackState] = {}

        if TRACKER_AVAILABLE:
            self.tracker = ByteTracker(
                track_thresh=0.45,
                track_buffer=30,
                match_thresh=0.8,
                frame_rate=fps,
            )
        else:
            self.tracker = None
            self._next_id = 1

    def actualizar(self, detecciones_np: np.ndarray,
                   frame_shape: tuple) -> list[dict]:
        """
        Procesa detecciones y retorna tracks actualizados.

        Args:
            detecciones_np: array [[x1,y1,x2,y2,conf,clase_id], ...]
            frame_shape: (height, width)

        Returns:
            lista de tracks activos con estado completo
        """
        h, w = frame_shape[:2]

        if self.tracker and len(detecciones_np) > 0:
            # ByteTrack espera img_size para normalizar
            tracks_raw = self.tracker.update(
                detecciones_np,
                np.zeros((h, w, 3), dtype=np.uint8)  # frame mock para el tracker
            )
        else:
            tracks_raw = self._tracker_simulado(detecciones_np)

        resultado = []
        for t in tracks_raw:
            if len(t) < 5:
                continue

            x1, y1, x2, y2, track_id = t[:5]
            clase_id = int(t[5]) if len(t) > 5 else 0
            conf     = float(t[6]) if len(t) > 6 else 0.5

            from vision.detector import CLASES
            clase = CLASES.get(clase_id, "cow")

            # Centro normalizado
            cx = ((x1 + x2) / 2) / w
            cy = ((y1 + y2) / 2) / h

            tid = int(track_id)
            if tid not in self.states:
                self.states[tid] = TrackState(tid, clase, cx, cy)
            else:
                self.states[tid].actualizar(cx, cy, clase, self.dt)

            state = self.states[tid]
            resultado.append({
                "track_id":              tid,
                "bbox":                  [float(x1), float(y1), float(x2), float(y2)],
                "bbox_norm":             [float(x1)/w, float(y1)/h,
                                          float(x2-x1)/w, float(y2-y1)/h],
                "pos_x":                 round(cx, 4),
                "pos_y":                 round(cy, 4),
                "clase":                 state.clase_dominante,
                "confianza":             round(conf, 4),
                "velocidad_actual":      round(state.velocidad_actual, 4),
                "velocidad_promedio":    round(state.velocidad_promedio, 4),
                "tiempo_inmovil_seg":    round(state.tiempo_inmovil, 1),
                "animal_id":             state.animal_id,
            })

        return resultado

    def calcular_centroide_hato(self, tracks: list[dict]) -> tuple[float, float]:
        """Centroide del hato — promedio de posiciones de todos los tracks."""
        if not tracks:
            return 0.5, 0.5
        cx = sum(t["pos_x"] for t in tracks) / len(tracks)
        cy = sum(t["pos_y"] for t in tracks) / len(tracks)
        return cx, cy

    def distancia_al_centroide(self, track: dict, centroide: tuple,
                                frame_w_metros: float = 30.0) -> float:
        """Distancia estimada en metros al centroide del hato."""
        cx, cy = centroide
        dx = (track["pos_x"] - cx) * frame_w_metros
        dy = (track["pos_y"] - cy) * frame_w_metros
        return round((dx**2 + dy**2) ** 0.5, 2)

    def asignar_rfid(self, track_id: int, animal_id: str) -> None:
        if track_id in self.states:
            self.states[track_id].animal_id = animal_id

    def _tracker_simulado(self, dets: np.ndarray) -> np.ndarray:
        """Fallback simple cuando boxmot no está disponible."""
        result = []
        for det in dets:
            result.append([*det[:5], self._next_id, det[4], det[5]])
            self._next_id += 1
        return np.array(result) if result else np.empty((0, 8))
