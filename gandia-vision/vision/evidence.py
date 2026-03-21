"""
vision/evidence.py
Recorta el bbox del animal del frame y sube a Supabase Storage.
"""

import io
import uuid
from datetime import datetime
import numpy as np
import cv2
from PIL import Image
from loguru import logger
from db.client import db
from config.settings import settings


class EvidenceCapture:

    BUCKET = settings.storage_bucket

    def recortar_track(self, frame: np.ndarray, bbox: list,
                       padding: float = 0.15) -> bytes:
        """
        Recorta el bounding box del animal con un padding y retorna JPEG.
        padding: porcentaje extra alrededor del bbox (0.15 = 15%)
        """
        h, w = frame.shape[:2]
        x1, y1, x2, y2 = bbox

        # Aplicar padding
        bw = x2 - x1
        bh = y2 - y1
        x1 = max(0, int(x1 - bw * padding))
        y1 = max(0, int(y1 - bh * padding))
        x2 = min(w, int(x2 + bw * padding))
        y2 = min(h, int(y2 + bh * padding))

        crop = frame[y1:y2, x1:x2]
        crop_rgb = cv2.cvtColor(crop, cv2.COLOR_BGR2RGB)
        img = Image.fromarray(crop_rgb)

        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=85)
        return buf.getvalue()

    def subir_evidencia(self, imagen_bytes: bytes, rancho_id: str,
                        corral_id: str, tipo: str) -> str:
        """
        Sube imagen a Supabase Storage y retorna la URL pública.
        Path: evidencia/{rancho_id}/{fecha}/{uuid}.jpg
        """
        fecha = datetime.utcnow().strftime("%Y/%m/%d")
        nombre = f"{uuid.uuid4().hex}.jpg"
        path = f"evidencia/{rancho_id}/{fecha}/{nombre}"

        try:
            db.storage.from_(self.BUCKET).upload(
                path=path,
                file=imagen_bytes,
                file_options={"content-type": "image/jpeg"},
            )
            url = db.storage.from_(self.BUCKET).get_public_url(path)
            logger.info(f"Evidencia subida: {url}")
            return url
        except Exception as e:
            logger.error(f"Error subiendo evidencia: {e}")
            return ""

    def capturar_y_subir(self, frame: np.ndarray, track: dict,
                          rancho_id: str, corral_id: str) -> dict:
        """
        Pipeline completo: recorta → sube → retorna metadata.
        """
        try:
            jpeg = self.recortar_track(frame, track["bbox"])
            url  = self.subir_evidencia(jpeg, rancho_id, corral_id, track["clase"])

            return {
                "url_storage": url,
                "bbox": {
                    "x": track["bbox"][0],
                    "y": track["bbox"][1],
                    "w": track["bbox"][2] - track["bbox"][0],
                    "h": track["bbox"][3] - track["bbox"][1],
                },
                "clase":     track["clase"],
                "confianza": track["confianza"],
            }
        except Exception as e:
            logger.error(f"Error en captura de evidencia: {e}")
            return {}


evidence_capture = EvidenceCapture()
