"""
detector.py — Paso 2 del pipeline
Detecta y recorta la región del morro en la imagen.

Modo "direct": detección por contornos Canny en zona central-inferior.
Modo "sheet":  detecta marcadores ArUco primero, corrige perspectiva,
               luego recorta la zona morro definida en la hoja.
"""

import cv2
import numpy as np

# ─── Configuración del layout de la Hoja Inteligente ─────────────────────────
# Posición relativa de la zona morro dentro de la hoja (fracción del tamaño)
# Ajustar según el diseño final impreso de la hoja.
SHEET_MORRO_TOP    = 0.25   # inicio vertical de la zona morro
SHEET_MORRO_BOTTOM = 0.75   # fin vertical
SHEET_MORRO_LEFT   = 0.10   # inicio horizontal
SHEET_MORRO_RIGHT  = 0.90   # fin horizontal

# ID de los marcadores ArUco en las 4 esquinas (mismo orden al generar la hoja)
ARUCO_IDS = [0, 1, 2, 3]    # TL, TR, BR, BL


def detect_morro_region(img_bgr: np.ndarray, modo: str = "direct") -> np.ndarray:
    """
    Devuelve recorte BGR de la región del morro.
    Nunca falla: si no detecta, usa fallback del 50% central.
    """
    if modo == "sheet":
        return _detect_sheet_mode(img_bgr)
    else:
        return _detect_direct_mode(img_bgr)


# ─── MODO DIRECTO ─────────────────────────────────────────────────────────────

def _detect_direct_mode(img: np.ndarray) -> np.ndarray:
    h, w = img.shape[:2]
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Solo analizar la mitad inferior central (donde suele estar el morro)
    roi_y1 = h // 3
    roi_y2 = h
    roi_x1 = w // 6
    roi_x2 = w - w // 6
    roi = gray[roi_y1:roi_y2, roi_x1:roi_x2]

    # Canny sobre la ROI
    blurred = cv2.GaussianBlur(roi, (5, 5), 0)
    edges   = cv2.Canny(blurred, 30, 100)

    # Encontrar contornos y buscar el más grande y "elíptico"
    contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    best_box = None
    best_area = 0.0

    for cnt in contours:
        area = cv2.contourArea(cnt)
        if area < 5000:   # ignorar contornos pequeños
            continue
        x, y, cw, ch = cv2.boundingRect(cnt)
        # Filtro de proporción: el morro tiene proporción ancha (~1.2–3.0)
        ratio = cw / ch if ch > 0 else 0
        if 1.0 < ratio < 4.0 and area > best_area:
            best_area = area
            best_box  = (x, y, cw, ch)

    if best_box:
        x, y, bw, bh = best_box
        # Margen del 10%
        margin_x = int(bw * 0.10)
        margin_y = int(bh * 0.10)
        x1 = max(0, x - margin_x + roi_x1)
        y1 = max(0, y - margin_y + roi_y1)
        x2 = min(w, x + bw + margin_x + roi_x1)
        y2 = min(h, y + bh + margin_y + roi_y1)
        return img[y1:y2, x1:x2]

    # Fallback: 50% central
    return _center_crop(img)


# ─── MODO HOJA INTELIGENTE ────────────────────────────────────────────────────

def _detect_sheet_mode(img: np.ndarray) -> np.ndarray:
    """
    1. Detectar 4 marcadores ArUco en las esquinas de la hoja.
    2. Corregir perspectiva con homografía.
    3. Recortar la zona morro según las proporciones definidas.
    """
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    aruco_dict   = cv2.aruco.getPredefinedDictionary(cv2.aruco.DICT_4X4_50)
    aruco_params = cv2.aruco.DetectorParameters()
    detector     = cv2.aruco.ArucoDetector(aruco_dict, aruco_params)

    corners, ids, _ = detector.detectMarkers(gray)

    if ids is None or len(ids) < 4:
        # No se encontraron suficientes marcadores → fallback directo
        return _detect_direct_mode(img)

    # Mapear ids a posiciones de esquina
    id_to_corner: dict[int, np.ndarray] = {}
    for i, mid in enumerate(ids.flatten()):
        if mid in ARUCO_IDS:
            # Centro del marcador
            c = corners[i][0]
            id_to_corner[int(mid)] = c.mean(axis=0)

    if len(id_to_corner) < 4:
        return _detect_direct_mode(img)

    # Orden: TL=0, TR=1, BR=2, BL=3
    try:
        src_pts = np.float32([
            id_to_corner[0],
            id_to_corner[1],
            id_to_corner[2],
            id_to_corner[3],
        ])
    except KeyError:
        return _detect_direct_mode(img)

    # Tamaño normalizado de la hoja en la imagen corregida
    sheet_w, sheet_h = 800, 1100

    dst_pts = np.float32([
        [0,       0      ],
        [sheet_w, 0      ],
        [sheet_w, sheet_h],
        [0,       sheet_h],
    ])

    M           = cv2.getPerspectiveTransform(src_pts, dst_pts)
    sheet_warped = cv2.warpPerspective(img, M, (sheet_w, sheet_h))

    # Recortar zona morro según proporciones configuradas
    y1 = int(SHEET_MORRO_TOP    * sheet_h)
    y2 = int(SHEET_MORRO_BOTTOM * sheet_h)
    x1 = int(SHEET_MORRO_LEFT   * sheet_w)
    x2 = int(SHEET_MORRO_RIGHT  * sheet_w)

    recorte = sheet_warped[y1:y2, x1:x2]
    if recorte.size == 0:
        return _center_crop(img)

    return recorte


# ─── FALLBACK ─────────────────────────────────────────────────────────────────

def _center_crop(img: np.ndarray) -> np.ndarray:
    h, w = img.shape[:2]
    y1, y2 = h // 4, h * 3 // 4
    x1, x2 = w // 4, w * 3 // 4
    return img[y1:y2, x1:x2]
