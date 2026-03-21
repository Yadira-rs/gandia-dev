"""
scripts/seed_db.py
Inserta datos iniciales para desarrollo y testing.
Ejecutar: python scripts/seed_db.py
"""

import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from db.client import db
from loguru import logger


def seed_modelo():
    """Registra el modelo base en vision_modelos."""
    res = db.table("vision_modelos").insert({
        "nombre":       "yolov11n-base",
        "version":      "1.0.0",
        "archivo_path": "./models/yolov11n.pt",
        "precision":    0.72,
        "recall":       0.68,
        "map50":        0.71,
        "map95":        0.45,
        "activo":       True,
        "dataset_usado": "COLO+CBVD5",
        "clases_json":  ["cow", "cow_down", "wound_suspect"],
    }).execute()
    logger.info(f"Modelo registrado: {res.data}")


def seed_umbrales_default(rancho_id: str):
    """Inserta umbrales por defecto para un rancho."""
    import json
    from pathlib import Path
    rules = json.loads((Path(__file__).parent.parent / "config" / "rules_default.json").read_text())
    res = db.table("anomalia_umbrales").upsert({
        "rancho_id": rancho_id,
        **{k: v for k, v in rules.items() if not k.startswith("_") and k != "severidades"},
    }, on_conflict="rancho_id").execute()
    logger.info(f"Umbrales insertados para rancho {rancho_id}")


if __name__ == "__main__":
    seed_modelo()
    logger.info("Seed completado")
