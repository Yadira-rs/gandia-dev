"""
main.py — Gandia NosePrint Backend
"""

import os
from pathlib import Path
from dotenv import load_dotenv
load_dotenv(Path(__file__).parent / ".env")

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import numpy as np
import logging

from pipeline.validator    import validate_image
from pipeline.detector     import detect_morro_region
from pipeline.preprocessor import preprocess
from pipeline.fingerprint  import extract_fingerprint, compare_fingerprints
from pipeline.embedding    import EmbeddingModel
from pipeline.fusion       import fuse_scores, decide_result
from db.supabase_client    import SupabaseClient

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("gandia")

embedding_model: EmbeddingModel = None
db_client: SupabaseClient       = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global embedding_model, db_client
    log.info("Cargando EfficientNetB4…")
    embedding_model = EmbeddingModel()
    log.info("Conectando a Supabase…")
    db_client = SupabaseClient()
    log.info("Backend listo ✓")
    yield
    log.info("Apagando backend…")


app = FastAPI(title="Gandia NosePrint API", version="2.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {
        "status":    "ok",
        "pca_ready": embedding_model.pca_ready,
        "version":   "3.0.0-efficientnet",
    }


@app.get("/metricas")
def get_metricas():
    """Devuelve métricas calculadas por calcular_metricas.py si existen."""
    import json
    metricas_path = Path("metricas.json")
    if not metricas_path.exists():
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Métricas no calculadas. Corre calcular_metricas.py")
    with open(metricas_path) as f:
        return json.load(f)


@app.post("/identify")
async def identify(
    image:     UploadFile = File(...),
    rancho_id: str        = Form(...),
    modo:      str        = Form("direct"),
):
    raw_bytes = await image.read()

    validation = validate_image(raw_bytes)
    if not validation["ok"]:
        raise HTTPException(status_code=422, detail={
            "error":   "imagen_invalida",
            "mensaje": validation["mensaje"],
            "calidad": validation.get("calidad", 0.0),
        })

    img_bgr  = validation["img"]
    recorte  = detect_morro_region(img_bgr, modo=modo)
    log.info("Región detectada: %s modo=%s", recorte.shape, modo)

    prep       = preprocess(recorte)
    fp_vector  = extract_fingerprint(prep["img_gray"])
    emb_vector = embedding_model.extract(prep["img_tensor"])

    candidatos_cv  = db_client.search_fingerprints(fp_vector,  rancho_id, top_k=5)
    candidatos_emb = db_client.search_embeddings(emb_vector,   rancho_id, top_k=5)

    # Fusión ponderada por calidad
    resultados = fuse_scores(candidatos_cv, candidatos_emb, calidad_imagen=validation["calidad"])
    decision   = decide_result(resultados)

    log.info("Resultado: %s | animal_id=%s | score_final=%.3f",
             decision["resultado"], decision.get("animal_id"), decision["score_final"])

    return {
        "resultado":          decision["resultado"],
        "animal_id":          decision.get("animal_id"),
        "score_cv":           decision["score_cv"],
        "score_ia":           decision["score_ia"],
        "score_final":        decision["score_final"],
        "candidatos":         decision.get("candidatos", []),
        "calidad_imagen":     validation["calidad"],
        "modo_procesamiento": modo,
    }


@app.post("/register")
async def register_huella(
    image:     UploadFile = File(...),
    animal_id: str        = Form(...),
    rancho_id: str        = Form(...),
    modo:      str        = Form("direct"),
    force:     bool       = Form(False),
):
    import cv2 as _cv
    raw_bytes  = await image.read()
    validation = validate_image(raw_bytes)

    if not validation["ok"] and not force:
        raise HTTPException(status_code=422, detail={
            "error":   "imagen_invalida",
            "mensaje": validation["mensaje"],
        })

    if not validation["ok"] and force:
        arr = np.frombuffer(raw_bytes, dtype=np.uint8)
        img_decoded = _cv.imdecode(arr, _cv.IMREAD_COLOR)
        if img_decoded is None:
            raise HTTPException(status_code=422, detail={"error": "decode_fail"})
        validation = {"ok": True, "img": img_decoded, "calidad": 0.5}

    img_bgr    = validation["img"]
    recorte    = detect_morro_region(img_bgr, modo=modo)
    prep       = preprocess(recorte)
    fp_vector  = extract_fingerprint(prep["img_gray"])
    emb_vector = embedding_model.extract(prep["img_tensor"])
    emb_raw    = embedding_model.extract_raw(prep["img_tensor"])

    db_client.save_reference(
        animal_id=animal_id,
        rancho_id=rancho_id,
        fp_vector=fp_vector,
        emb_vector=emb_vector,
        emb_raw=emb_raw,
        calidad=float(validation["calidad"]),
        modo=modo,
    )

    if db_client.should_retrain_pca():
        all_embs = db_client.get_all_raw_embeddings(rancho_id)
        if len(all_embs) >= 10:
            embedding_model.fit_pca(np.array(all_embs))
            embedding_model.save_pca()
            log.info("PCA re-entrenado con %d embeddings", len(all_embs))

    return {"ok": True, "animal_id": animal_id, "calidad": float(validation["calidad"])}


@app.post("/train-pca")
async def train_pca(rancho_id: str = Form(...)):
    """Admin: re-entrenar PCA desde embeddings_raw en BD."""
    all_embs = db_client.get_all_raw_embeddings(rancho_id)
    if len(all_embs) < 10:
        raise HTTPException(status_code=400, detail={
            "error": f"Se necesitan ≥10 registros, hay {len(all_embs)}"
        })
    embedding_model.fit_pca(np.array(all_embs))
    embedding_model.save_pca()
    return {
        "ok":                 True,
        "embeddings_usados":  len(all_embs),
        "varianza_explicada": round(sum(embedding_model.pca.explained_variance_ratio_) * 100, 1),
    }