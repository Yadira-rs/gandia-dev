"""
validator.py — Paso 1 del pipeline
Valida que la imagen sea utilizable antes de procesar.
Criterios: formato, tamaño, resolución mínima, nitidez (Laplaciano).
"""

import cv2
import numpy as np
from typing import Any

MAX_SIZE_MB     = 10          # dataset tiene imágenes de hasta 3MB
MIN_WIDTH       = 480         # bajado para dataset
MIN_HEIGHT      = 360
MIN_LAPLACIAN   = 30.0        # bajado — dataset tiene fotos de campo con algo de movimiento
ALLOWED_FORMATS = {b"\xff\xd8\xff": "jpeg", b"\x89PNG": "png"}


def _detect_format(raw: bytes) -> str | None:
    for magic, fmt in ALLOWED_FORMATS.items():
        if raw[:len(magic)] == magic:
            return fmt
    return None


def _laplacian_variance(img_gray: np.ndarray) -> float:
    return float(cv2.Laplacian(img_gray, cv2.CV_64F).var())


def validate_image(raw_bytes: bytes) -> dict[str, Any]:
    size_mb = len(raw_bytes) / (1024 * 1024)
    if size_mb > MAX_SIZE_MB:
        return {"ok": False, "mensaje": f"Imagen demasiado grande ({size_mb:.1f} MB, máx {MAX_SIZE_MB} MB)", "calidad": 0.0}

    fmt = _detect_format(raw_bytes)
    if fmt is None:
        return {"ok": False, "mensaje": "Formato no soportado. Usar JPEG o PNG.", "calidad": 0.0}

    arr = np.frombuffer(raw_bytes, dtype=np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        return {"ok": False, "mensaje": "No se pudo decodificar la imagen.", "calidad": 0.0}

    h, w = img.shape[:2]
    if w < MIN_WIDTH or h < MIN_HEIGHT:
        return {
            "ok": False,
            "mensaje": f"Resolución insuficiente ({w}×{h}). Mínimo {MIN_WIDTH}×{MIN_HEIGHT}.",
            "calidad": 0.0,
        }

    gray    = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    lap_var = _laplacian_variance(gray)
    calidad = min(lap_var / 500.0, 1.0)

    if lap_var < MIN_LAPLACIAN:
        return {
            "ok": False,
            "mensaje": "Imagen demasiado borrosa. Acerca el celular y mantén firme.",
            "calidad": round(calidad, 3),
        }

    return {"ok": True, "img": img, "calidad": round(calidad, 3)}