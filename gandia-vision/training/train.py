"""
training/train.py
Fine-tune de YOLOv11 con datos propios + datasets públicos.
Ejecutar en RunPod con GPU.
"""

import argparse
from pathlib import Path
from ultralytics import YOLO
from loguru import logger


def entrenar(
    data_yaml:   str  = "./datasets/gandia.yaml",
    base_model:  str  = "yolo11n.pt",
    epochs:      int  = 100,
    imgsz:       int  = 640,
    batch:       int  = 16,
    nombre:      str  = "gandia-v1",
    device:      str  = "0",          # GPU 0, o "cpu"
):
    logger.info(f"Iniciando entrenamiento: {nombre}")
    logger.info(f"Base: {base_model} | Epochs: {epochs} | Batch: {batch}")

    model = YOLO(base_model)

    results = model.train(
        data       = data_yaml,
        epochs     = epochs,
        imgsz      = imgsz,
        batch      = batch,
        name       = nombre,
        device     = device,
        patience   = 20,              # Early stopping
        save       = True,
        save_period= 10,
        plots      = True,
        # Augmentaciones para condiciones de rancho mexicano
        flipud     = 0.5,
        fliplr     = 0.5,
        mosaic     = 1.0,
        mixup      = 0.1,
        degrees    = 10.0,
        translate  = 0.1,
        scale      = 0.5,
        hsv_h      = 0.015,
        hsv_s      = 0.7,
        hsv_v      = 0.4,             # Variación de brillo (polvo, sombra, noche)
    )

    logger.info(f"Entrenamiento completado. Mejor mAP50: {results.results_dict.get('metrics/mAP50(B)', 0):.4f}")
    return results


def exportar_onnx(model_path: str, imgsz: int = 640):
    """Exporta a ONNX para inferencia optimizada."""
    model = YOLO(model_path)
    model.export(format="onnx", imgsz=imgsz, optimize=True)
    logger.info(f"Modelo exportado a ONNX: {model_path.replace('.pt', '.onnx')}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--data",    default="./datasets/gandia.yaml")
    parser.add_argument("--base",    default="yolo11n.pt")
    parser.add_argument("--epochs",  type=int, default=100)
    parser.add_argument("--batch",   type=int, default=16)
    parser.add_argument("--nombre",  default="gandia-v1")
    parser.add_argument("--device",  default="0")
    parser.add_argument("--export",  action="store_true")
    args = parser.parse_args()

    results = entrenar(
        data_yaml  = args.data,
        base_model = args.base,
        epochs     = args.epochs,
        batch      = args.batch,
        nombre     = args.nombre,
        device     = args.device,
    )

    if args.export:
        best = f"runs/detect/{args.nombre}/weights/best.pt"
        exportar_onnx(best)
