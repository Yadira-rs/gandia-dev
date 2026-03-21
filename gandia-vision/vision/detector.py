"""
vision/detector.py
Detección de bovinos con YOLOv11.
Retorna detecciones normalizadas listas para ByteTrack.
"""

import time
import numpy as np
from pathlib import Path
from typing import Optional
from ultralytics import YOLO
from loguru import logger
from config.settings import settings


# ─── CONSTANTES ───────────────────────────────────────────────────────────────

CLASES = {0: "cow", 1: "cow_down", 2: "wound_suspect"}
CLASES_INVERTIDO = {v: k for k, v in CLASES.items()}


# ─── DETECTOR ─────────────────────────────────────────────────────────────────

class GandiaDetector:
    """
    Wrapper de YOLOv11 para detección de bovinos.
    Carga el modelo una sola vez y reutiliza para múltiples frames.
    """

    def __init__(self, model_path: Optional[str] = None):
        custom = Path("./models/yolov11n-gandia.pt")
        base   = Path("./models/yolo11n.pt")

        if model_path and Path(model_path).exists():
            path = model_path
        elif custom.exists():
            path = str(custom)
            logger.info(f"Cargando modelo fine-tuned: {path}")
        elif base.exists():
            path = str(base)
            logger.warning("Modelo Gandia no encontrado, usando base")
        else:
            raise FileNotFoundError(
                "No se encontró modelo YOLO. "
                "Coloca yolo11n.pt en ./models/"
            )

        logger.info(f"Cargando modelo YOLO desde {path}")
        self.model     = YOLO(path)
        self.conf      = settings.yolo_confidence
        self.iou       = settings.yolo_iou
        self.model_ver = Path(path).stem
        logger.info("Modelo YOLO cargado OK")

    def detectar(self, frame: np.ndarray) -> dict:
        """
        Corre inferencia sobre un frame BGR (OpenCV).

        Returns:
            {
              "detecciones": [
                {
                  "bbox": [x1, y1, x2, y2],   # píxeles absolutos
                  "bbox_norm": [x, y, w, h],   # normalizado 0-1
                  "clase": "cow",
                  "clase_id": 0,
                  "confianza": 0.87,
                }
              ],
              "conteos": {"cow": 3, "cow_down": 1, "wound_suspect": 0},
              "confianza_promedio": 0.82,
              "latencia_ms": 45,
              "modelo_version": "yolov11n-gandia",
            }
        """
        t0 = time.perf_counter()

        results = self.model(
            frame,
            conf=self.conf,
            iou=self.iou,
            verbose=False,
        )[0]

        h, w = frame.shape[:2]
        detecciones = []
        conteos     = {"cow": 0, "cow_down": 0, "wound_suspect": 0}

        for box in results.boxes:
            clase_id  = int(box.cls.item())
            clase     = CLASES.get(clase_id, "cow")
            confianza = float(box.conf.item())

            x1, y1, x2, y2 = map(float, box.xyxy[0].tolist())

            detecciones.append({
                "bbox":      [x1, y1, x2, y2],
                "bbox_norm": [x1/w, y1/h, (x2-x1)/w, (y2-y1)/h],
                "clase":     clase,
                "clase_id":  clase_id,
                "confianza": round(confianza, 4),
            })

            if clase in conteos:
                conteos[clase] += 1

        latencia_ms = int((time.perf_counter() - t0) * 1000)
        conf_prom   = (sum(d["confianza"] for d in detecciones) / len(detecciones)
                       if detecciones else 0.0)

        return {
            "detecciones":        detecciones,
            "conteos":            conteos,
            "confianza_promedio": round(conf_prom, 4),
            "latencia_ms":        latencia_ms,
            "modelo_version":     self.model_ver,
        }

    def detecciones_para_tracker(self, resultado: dict) -> np.ndarray:
        """
        Convierte detecciones al formato que espera ByteTrack:
        [[x1, y1, x2, y2, confianza, clase_id], ...]
        """
        dets = resultado["detecciones"]
        if not dets:
            return np.empty((0, 6))

        return np.array([
            [*d["bbox"], d["confianza"], d["clase_id"]]
            for d in dets
        ], dtype=np.float32)


# ─── SINGLETON ────────────────────────────────────────────────────────────────

_detector_instance: Optional[GandiaDetector] = None


def get_detector() -> GandiaDetector:
    global _detector_instance
    if _detector_instance is None:
        _detector_instance = GandiaDetector()
    return _detector_instance

