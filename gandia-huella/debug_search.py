"""
debug_search.py — corre en gandia-huella para diagnosticar el problema
python debug_search.py
"""
import os, sys, json, requests
import numpy as np
import cv2
import torch
import torch.nn as nn
import pickle
from pathlib import Path
from torchvision import models, transforms
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL","").rstrip("/")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY","")
RANCHO_ID    = "349e35f2-caa8-499f-804f-e15a4b1ff327"

H = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
}

sys.path.insert(0, ".")
from pipeline.fingerprint  import extract_fingerprint
from pipeline.preprocessor import preprocess

print("=== 1. Cargando ResNet50 ===")
_resnet   = models.resnet50(weights=models.ResNet50_Weights.IMAGENET1K_V1)
_backbone = nn.Sequential(*list(_resnet.children())[:-1])
_backbone.eval()
_tf = transforms.Compose([
    transforms.ToPILImage(), transforms.Resize((224,224)), transforms.ToTensor(),
    transforms.Normalize([0.485,0.456,0.406],[0.229,0.224,0.225]),
])

_pca = None
pca_path = Path("models/pca_model.pkl")
if pca_path.exists():
    _pca = pickle.load(open(pca_path,"rb"))
    print(f"PCA cargado: n_features_in={_pca.n_features_in_}, n_components={_pca.n_components_}")
else:
    print("SIN PCA")

print("\n=== 2. Buscando imagen de prueba ===")
dataset = Path("BeefCattle_Muzzle_Individualized/cattle_0100")
imgs = list(dataset.glob("*.jpg")) + list(dataset.glob("*.JPG"))
if not imgs:
    print("ERROR: No se encontró cattle_0100"); sys.exit(1)
img_path = imgs[0]
print(f"Imagen: {img_path}")

img = cv2.imread(str(img_path))
print(f"Shape: {img.shape}")

print("\n=== 3. Extrayendo vectores ===")
prep = preprocess(img)
fp   = extract_fingerprint(prep["img_gray"])
print(f"Fingerprint: dim={len(fp)}, min={min(fp):.4f}, max={max(fp):.4f}, norm={np.linalg.norm(fp):.4f}")

with torch.no_grad():
    feat = _backbone(_tf(cv2.cvtColor(img, cv2.COLOR_BGR2RGB)).unsqueeze(0)).squeeze().numpy()
if _pca:
    emb = _pca.transform(feat.reshape(1,-1))[0]
else:
    emb = feat[:128]
norm = np.linalg.norm(emb)
emb = emb / (norm + 1e-8)
print(f"Embedding: dim={len(emb)}, min={min(emb):.4f}, max={max(emb):.4f}, norm={np.linalg.norm(emb):.4f}")

print("\n=== 4. Revisando BD ===")
r = requests.get(f"{SUPABASE_URL}/rest/v1/biometria_embeddings", headers=H,
    params={"select":"id,animal_id,calidad,fp_features", "rancho_id":f"eq.{RANCHO_ID}", "activo":"eq.true", "limit":"2"}, timeout=10)
rows = r.json()
print(f"Filas en BD: {len(rows)}")
if rows:
    row = rows[0]
    fp_db = row.get("fp_features")
    if fp_db:
        fp_db_arr = fp_db if isinstance(fp_db, list) else json.loads(fp_db)
        print(f"fp_features en BD: dim={len(fp_db_arr)}, norm={np.linalg.norm(fp_db_arr):.4f}")
        # Calcular similitud
        q = np.array(fp, dtype=np.float32)
        ref = np.array(fp_db_arr, dtype=np.float32)
        sim = float(np.dot(q, ref) / (np.linalg.norm(q) * np.linalg.norm(ref) + 1e-8))
        print(f"Similitud fingerprint con primera fila: {sim:.4f}")
    else:
        print("ERROR: fp_features es None en la BD")

print("\n=== 5. Probando RPC pgvector ===")
vec_str = "[" + ",".join(f"{v:.6f}" for v in emb.tolist()) + "]"
r = requests.post(f"{SUPABASE_URL}/rest/v1/rpc/search_embeddings_by_rancho", headers=H,
    json={"query_vector": vec_str, "p_rancho_id": RANCHO_ID, "p_top_k": 3}, timeout=10)
print(f"Status: {r.status_code}")
print(f"Respuesta: {r.text[:300]}")

print("\n=== FIN DIAGNÓSTICO ===")