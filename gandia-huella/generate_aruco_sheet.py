"""
generate_aruco_sheet.py
Genera la Hoja Inteligente imprimible con los 4 marcadores ArUco en las esquinas.
Ejecutar UNA VEZ para generar el PDF/PNG que se imprimirá.

Uso:
  python generate_aruco_sheet.py --output hoja_inteligente.png
"""

import cv2
import numpy as np
import argparse

# Tamaño de la hoja (píxeles a 300dpi → ~8.5×11 pulgadas)
SHEET_W = 2550
SHEET_H = 3300
MARGIN  = 120   # margen desde los bordes
MARKER_SIZE = 180   # tamaño de cada marcador ArUco

# Posición de la zona morro (mismas proporciones que detector.py)
MORRO_TOP    = int(0.25 * SHEET_H)
MORRO_BOTTOM = int(0.75 * SHEET_H)
MORRO_LEFT   = int(0.10 * SHEET_W)
MORRO_RIGHT  = int(0.90 * SHEET_W)


def generate_sheet(output_path: str):
    # Fondo blanco
    sheet = np.ones((SHEET_H, SHEET_W, 3), dtype=np.uint8) * 255

    # Diccionario ArUco 4x4 (50 marcadores disponibles)
    aruco_dict = cv2.aruco.getPredefinedDictionary(cv2.aruco.DICT_4X4_50)

    # IDs y posiciones de esquina: TL=0, TR=1, BR=2, BL=3
    corners = [
        (MARGIN,                   MARGIN,                    0),   # TL
        (SHEET_W - MARGIN - MARKER_SIZE, MARGIN,              1),   # TR
        (SHEET_W - MARGIN - MARKER_SIZE, SHEET_H - MARGIN - MARKER_SIZE, 2),  # BR
        (MARGIN,                   SHEET_H - MARGIN - MARKER_SIZE, 3),  # BL
    ]

    for (x, y, marker_id) in corners:
        marker_img = cv2.aruco.generateImageMarker(aruco_dict, marker_id, MARKER_SIZE)
        marker_bgr = cv2.cvtColor(marker_img, cv2.COLOR_GRAY2BGR)
        sheet[y:y+MARKER_SIZE, x:x+MARKER_SIZE] = marker_bgr

    # Rectángulo de la zona morro
    cv2.rectangle(sheet,
                  (MORRO_LEFT, MORRO_TOP),
                  (MORRO_RIGHT, MORRO_BOTTOM),
                  (100, 100, 100), 8)

    # Texto guía
    font = cv2.FONT_HERSHEY_SIMPLEX
    cv2.putText(sheet, "ZONA MORRO",
                (MORRO_LEFT + 60, MORRO_TOP + 80),
                font, 2.5, (130, 130, 130), 6)
    cv2.putText(sheet, "Acercar morro aqui",
                (MORRO_LEFT + 60, MORRO_TOP + 180),
                font, 1.8, (170, 170, 170), 4)

    # Título superior
    cv2.putText(sheet, "GANDIA - Huella de Morro",
                (SHEET_W // 2 - 500, 80),
                font, 2.2, (40, 40, 40), 5)

    cv2.imwrite(output_path, sheet)
    print(f"Hoja guardada en: {output_path}")
    print(f"Imprimir a tamaño carta (8.5×11in) para que las proporciones sean correctas.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", default="hoja_inteligente.png")
    args = parser.parse_args()
    generate_sheet(args.output)
