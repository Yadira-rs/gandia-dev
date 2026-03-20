"""
scripts/test_camera.py
Prueba rápida del detector con una imagen o stream local.
Ejecutar: python scripts/test_camera.py --source 0
"""

import cv2
import argparse
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from vision.detector import get_detector


def test_detector(source: str, show: bool = True):
    detector = get_detector()
    cap = cv2.VideoCapture(int(source) if source.isdigit() else source)

    if not cap.isOpened():
        print(f"No se pudo abrir: {source}")
        return

    print("Presiona Q para salir")
    while True:
        ret, frame = cap.read()
        if not ret:
            break

        result = detector.detectar(frame)
        conteos = result["conteos"]

        # Dibujar bboxes
        for det in result["detecciones"]:
            x1, y1, x2, y2 = map(int, det["bbox"])
            color = {"cow": (0, 200, 100), "cow_down": (0, 100, 255), "wound_suspect": (0, 0, 255)}.get(det["clase"], (200, 200, 200))
            cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
            label = f"{det['clase']} {det['confianza']:.2f}"
            cv2.putText(frame, label, (x1, y1 - 8), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 1)

        # Info overlay
        info = f"vacas:{conteos['cow']} down:{conteos['cow_down']} herida:{conteos['wound_suspect']} | {result['latencia_ms']}ms"
        cv2.putText(frame, info, (10, 25), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (47, 175, 143), 2)

        if show:
            cv2.imshow("Gandia Vision", frame)
            if cv2.waitKey(1) & 0xFF == ord("q"):
                break
        else:
            print(info)

    cap.release()
    cv2.destroyAllWindows()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", default="0", help="0=webcam, path=video/imagen, rtsp://...")
    parser.add_argument("--no-show", action="store_true")
    args = parser.parse_args()
    test_detector(args.source, show=not args.no_show)
