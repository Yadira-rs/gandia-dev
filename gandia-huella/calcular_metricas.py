"""
calcular_metricas.py — NosePrint v3.0
Calcula métricas biométricas reales sobre el dataset:
  - Accuracy (tasa de identificación correcta)
  - FMR  (False Match Rate)    — impostores aceptados
  - FNMR (False Non-Match Rate) — genuinos rechazados
  - EER  (Equal Error Rate)    — punto de cruce FMR=FNMR

USO:
  python calcular_metricas.py --dataset ./BeefCattle_Muzzle_Individualized --n 50
  (usa --n para probar con un subconjunto rápido, omite para los 268)
"""
import os, sys, argparse, json, random
import numpy as np
import cv2
import torch
import torch.nn as nn
import pickle
import requests
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL","").rstrip("/")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY","")
RANCHO_ID    = "349e35f2-caa8-499f-804f-e15a4b1ff327"
H = {"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"}

sys.path.insert(0, str(Path(__file__).parent))
from pipeline.fingerprint  import extract_fingerprint, compare_fingerprints
from pipeline.preprocessor import preprocess
from pipeline.detector     import detect_morro_region
from torchvision import models

print("Cargando EfficientNetB4...", flush=True)
_eff      = models.efficientnet_b4(weights=models.EfficientNet_B4_Weights.IMAGENET1K_V1)
_backbone = nn.Sequential(_eff.features, nn.AdaptiveAvgPool2d(1), nn.Flatten())
_backbone.eval()

_pca = None
if Path("models/pca_model.pkl").exists():
    _pca = pickle.load(open("models/pca_model.pkl","rb"))
    print(f"✅ PCA: {_pca.n_features_in_}→{_pca.n_components_}", flush=True)


def get_embedding(img_bgr):
    recorte = detect_morro_region(img_bgr, modo="direct")
    prep    = preprocess(recorte)
    fp      = extract_fingerprint(prep["img_gray"])
    with torch.no_grad():
        feat = _backbone(prep["img_tensor"]).squeeze().numpy().astype(np.float64)
    norm = np.linalg.norm(feat)
    if norm > 1e-8: feat = feat / norm
    if _pca:
        emb = _pca.transform(feat.reshape(1,-1))[0]
    else:
        emb = feat[:256]
    norm2 = np.linalg.norm(emb)
    if norm2 > 1e-8: emb = emb / norm2
    return fp, emb.astype(np.float32)


def top2_imagenes(carpeta):
    imgs = list(carpeta.glob("*.jpg")) + list(carpeta.glob("*.JPG"))
    if len(imgs) < 2: return None, None
    scored = []
    for p in imgs:
        g = cv2.imread(str(p), cv2.IMREAD_GRAYSCALE)
        if g is None: continue
        scored.append((p, float(cv2.Laplacian(g, cv2.CV_64F).var())))
    scored.sort(key=lambda x: x[1], reverse=True)
    return scored[0][0], scored[1][0] if len(scored) > 1 else None


def fuse_score(fp_a, emb_a, fp_b, emb_b):
    score_cv = compare_fingerprints(fp_a, fp_b)
    score_ia = float(np.dot(emb_a, emb_b))
    score_ia = max(0.0, min(1.0, (1.0 - score_ia/2.0)))
    # Usar similitud coseno directa
    score_ia_sim = max(0.0, min(1.0, float(np.dot(emb_a, emb_b))))
    return 0.55 * score_cv + 0.45 * score_ia_sim


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dataset", default="./BeefCattle_Muzzle_Individualized")
    parser.add_argument("--n", type=int, default=50)
    parser.add_argument("--threshold", type=float, default=0.80)
    parser.add_argument("--output", default="metricas.json")
    args = parser.parse_args()

    dataset_path = Path(args.dataset)
    carpetas = sorted([d for d in dataset_path.iterdir() if d.is_dir() and d.name.startswith("cattle_")])
    random.seed(42)
    carpetas = random.sample(carpetas, min(args.n, len(carpetas)))
    total = len(carpetas)

    print(f"\n📊 Calculando métricas con {total} animales...\n{'─'*50}")

    # Extraer 2 imágenes por animal: img1=referencia, img2=query
    referencias = {}  # siniiga → (fp, emb)
    queries     = {}  # siniiga → (fp, emb)
    errores     = 0

    for i, carpeta in enumerate(carpetas, 1):
        siniiga = carpeta.name
        p1, p2  = top2_imagenes(carpeta)
        if p1 is None or p2 is None:
            errores += 1; continue
        try:
            img1 = cv2.imread(str(p1))
            img2 = cv2.imread(str(p2))
            if img1 is None or img2 is None: errores+=1; continue
            fp1, emb1 = get_embedding(img1)
            fp2, emb2 = get_embedding(img2)
            referencias[siniiga] = (fp1, emb1)
            queries[siniiga]     = (fp2, emb2)
            print(f"[{i:>3}/{total}] ✅ {siniiga}", flush=True)
        except Exception as e:
            print(f"[{i:>3}/{total}] ❌ {siniiga}: {e}", flush=True)
            errores += 1

    animales = list(referencias.keys())
    n = len(animales)
    print(f"\n✅ {n} animales procesados, {errores} errores\n{'─'*50}")

    # Calcular scores genuinos (misma vaca, imagen diferente)
    genuine_scores = []
    for s in animales:
        score = fuse_score(*referencias[s], *queries[s])
        genuine_scores.append(score)

    # Calcular scores impostores (vacas diferentes)
    impostor_scores = []
    pairs = [(animales[i], animales[j]) for i in range(n) for j in range(i+1, min(i+6, n))]
    for s1, s2 in pairs:
        score = fuse_score(*referencias[s1], *referencias[s2])
        impostor_scores.append(score)

    genuine_scores  = np.array(genuine_scores)
    impostor_scores = np.array(impostor_scores)

    # Métricas en el threshold dado
    th = args.threshold
    TP  = np.sum(genuine_scores  >= th)
    FN  = np.sum(genuine_scores  <  th)
    FP  = np.sum(impostor_scores >= th)
    TN  = np.sum(impostor_scores <  th)

    accuracy = float(TP / n) if n > 0 else 0
    fnmr     = float(FN / n) if n > 0 else 0
    fmr      = float(FP / len(impostor_scores)) if impostor_scores.size > 0 else 0

    # EER — threshold donde FMR ≈ FNMR
    thresholds = np.linspace(0, 1, 200)
    eer_val, eer_th = 1.0, th
    for t in thresholds:
        _fmr  = float(np.mean(impostor_scores >= t))
        _fnmr = float(np.mean(genuine_scores  <  t))
        diff  = abs(_fmr - _fnmr)
        if diff < abs(eer_val - 0):
            eer_val = (_fmr + _fnmr) / 2
            eer_th  = float(t)

    print(f"""
╔══════════════════════════════════════════╗
  📊 MÉTRICAS BIOMÉTRICAS NosePrint v3.0
  ─────────────────────────────────────────
  Animales evaluados : {n}
  Threshold          : {th:.2f}
  ─────────────────────────────────────────
  ✅ Accuracy        : {accuracy*100:.1f}%
  ✅ FNMR            : {fnmr*100:.1f}%
  ✅ FMR             : {fmr*100:.1f}%
  ✅ EER             : {eer_val*100:.1f}% (th={eer_th:.2f})
  ─────────────────────────────────────────
  Score genuino avg  : {genuine_scores.mean()*100:.1f}%
  Score impostor avg : {impostor_scores.mean()*100:.1f}%
╚══════════════════════════════════════════╝
""")

    resultado = {
        "n_animales":       n,
        "threshold":        th,
        "accuracy":         round(accuracy, 4),
        "fnmr":             round(fnmr, 4),
        "fmr":              round(fmr, 4),
        "eer":              round(eer_val, 4),
        "eer_threshold":    round(eer_th, 4),
        "genuine_avg":      round(float(genuine_scores.mean()), 4),
        "impostor_avg":     round(float(impostor_scores.mean()), 4),
        "errores":          errores,
    }

    with open(args.output, "w") as f:
        json.dump(resultado, f, indent=2)
    print(f"Guardado en {args.output}")


if __name__ == "__main__":
    main()