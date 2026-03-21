"""
training/evaluate.py
Evalúa un modelo entrenado y guarda métricas en Supabase.
"""

import argparse
from pathlib import Path
from ultralytics import YOLO
from loguru import logger
from db.client import db


def evaluar(model_path: str, data_yaml: str = "./datasets/gandia.yaml",
            rancho_id: str = None):
    model = YOLO(model_path)
    metrics = model.val(data=data_yaml, verbose=True)

    precision = float(metrics.results_dict.get("metrics/precision(B)", 0))
    recall    = float(metrics.results_dict.get("metrics/recall(B)", 0))
    map50     = float(metrics.results_dict.get("metrics/mAP50(B)", 0))
    map95     = float(metrics.results_dict.get("metrics/mAP50-95(B)", 0))

    logger.info(f"P={precision:.4f}  R={recall:.4f}  mAP50={map50:.4f}  mAP50-95={map95:.4f}")

    # Guardar en Supabase
    nombre  = Path(model_path).parent.parent.name
    version = Path(model_path).stem

    db.table("vision_modelos").insert({
        "nombre":         nombre,
        "version":        version,
        "archivo_path":   model_path,
        "precision":      round(precision, 4),
        "recall":         round(recall, 4),
        "map50":          round(map50, 4),
        "map95":          round(map95, 4),
        "rancho_id":      rancho_id,
        "dataset_usado":  data_yaml,
        "activo":         map50 > 0.7,
    }).execute()

    logger.info("Métricas guardadas en Supabase")
    return {"precision": precision, "recall": recall, "map50": map50, "map95": map95}


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", required=True)
    parser.add_argument("--data",  default="./datasets/gandia.yaml")
    parser.add_argument("--rancho", default=None)
    args = parser.parse_args()
    evaluar(args.model, args.data, args.rancho)
