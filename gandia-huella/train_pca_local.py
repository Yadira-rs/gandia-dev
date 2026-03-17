"""
train_pca_local.py — Entrenamiento PCA local (v3.0 CLASE MUNDIAL)
=================================================================
Entrena PCA 1792→256 con EfficientNetB4 ensemble desde dataset local.
  - whiten=True para mejor separación inter-clase
  - Usa mismo pipeline que register_dataset y main.py
  - 3 imágenes por animal promediadas para más robustez
  - Reporta varianza explicada por componentes

USO:
  python train_pca_local.py --dataset ./BeefCattle_Muzzle_Individualized
"""

import os
import sys
import argparse
import pickle
import numpy as np
import cv2
import torch
import torch.nn as nn
from pathlib import Path
from torchvision import models
from sklearn.decomposition import PCA

sys.path.insert(0, str(Path(__file__).parent))
from pipeline.detector     import detect_morro_region
from pipeline.preprocessor import preprocess

# ─── Cargar modelo ────────────────────────────────────────────────────────────

print("Cargando EfficientNetB4...", flush=True)
_eff      = models.efficientnet_b4(weights=models.EfficientNet_B4_Weights.IMAGENET1K_V1)
_backbone = nn.Sequential(_eff.features, nn.AdaptiveAvgPool2d(1), nn.Flatten())
_backbone.eval()

# Detectar dimensión real
with torch.no_grad():
    dummy = torch.zeros(1, 3, 380, 380)
    raw_d = _backbone(dummy).shape[1]

print(f"✅ EfficientNetB4 listo — raw dim: {raw_d}", flush=True)


# ─── Extracción ───────────────────────────────────────────────────────────────

def extract_raw(img_bgr: np.ndarray) -> np.ndarray | None:
    """Extrae vector crudo 1792-dim para una imagen."""
    try:
        recorte = detect_morro_region(img_bgr, modo="direct")
        prep    = preprocess(recorte)
        with torch.no_grad():
            feat = _backbone(prep["img_tensor"]).squeeze().numpy().astype(np.float64)
        norm = np.linalg.norm(feat)
        if norm > 1e-8:
            feat = feat / norm
        return feat.astype(np.float32)
    except Exception as e:
        print(f"  error: {e}")
        return None


def top_n_imagenes(carpeta: Path, n: int = 3) -> list[Path]:
    extensiones = ["*.jpg", "*.JPG", "*.jpeg", "*.png", "*.PNG"]
    imgs = []
    for ext in extensiones:
        imgs.extend(carpeta.glob(ext))
    if not imgs:
        return []
    scored = []
    for p in imgs:
        try:
            g = cv2.imread(str(p), cv2.IMREAD_GRAYSCALE)
            if g is None:
                continue
            s = float(cv2.Laplacian(g, cv2.CV_64F).var())
            scored.append((p, s))
        except Exception:
            pass
    scored.sort(key=lambda x: x[1], reverse=True)
    return [p for p, _ in scored[:n]]


# ─── MAIN ─────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dataset",    default="./BeefCattle_Muzzle_Individualized")
    parser.add_argument("--output",     default="models/pca_model.pkl")
    parser.add_argument("--components", type=int, default=256)
    parser.add_argument("--n-imgs",     type=int, default=3)
    args = parser.parse_args()

    dataset_path = Path(args.dataset)
    if not dataset_path.exists():
        print(f"❌ No existe: {dataset_path}"); return

    carpetas = sorted([
        d for d in dataset_path.iterdir()
        if d.is_dir() and d.name.startswith("cattle_")
    ])
    total = len(carpetas)

    print(f"\n📂 {total} animales  |  {args.n_imgs} imgs/animal  |  {raw_d}→{args.components} PCA")
    print("─" * 60)

    features = []
    errores  = 0

    for i, carpeta in enumerate(carpetas, 1):
        mejores = top_n_imagenes(carpeta, args.n_imgs)
        print(f"[{i:>4}/{total}] {carpeta.name}  ({len(mejores)} imgs)", end="  ", flush=True)

        if not mejores:
            print("⚠️  sin imágenes")
            errores += 1
            continue

        vecs = []
        for img_path in mejores:
            img = cv2.imread(str(img_path))
            if img is None:
                continue
            feat = extract_raw(img)
            if feat is not None:
                vecs.append(feat)

        if not vecs:
            print("❌ todas fallaron")
            errores += 1
            continue

        # Promediar y normalizar
        avg  = np.mean(vecs, axis=0)
        norm = np.linalg.norm(avg)
        if norm > 1e-8:
            avg = avg / norm
        features.append(avg)
        print(f"✅  n={len(vecs)}", flush=True)

    if len(features) < 10:
        print(f"\n❌ Solo {len(features)} muestras válidas, se necesitan ≥10.")
        return

    X = np.array(features)
    print(f"\n🧠 Entrenando PCA {X.shape[1]}→{args.components} (whiten=True) con {X.shape[0]} muestras...")

    pca = PCA(n_components=args.components, whiten=True)
    pca.fit(X)

    # Guardar
    out_path = Path(args.output)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, "wb") as f:
        pickle.dump(pca, f)

    var_total = float(pca.explained_variance_ratio_.sum() * 100)
    var_top10 = float(pca.explained_variance_ratio_[:10].sum() * 100)
    var_top50 = float(pca.explained_variance_ratio_[:50].sum() * 100)

    print(f"""
╔══════════════════════════════════════════╗
  ✅ PCA entrenado y guardado
  Archivo    : {args.output}
  Muestras   : {X.shape[0]}
  Dimensiones: {X.shape[1]} → {args.components}
  Varianza total     : {var_total:.1f}%
  Varianza top-10    : {var_top10:.1f}%
  Varianza top-50    : {var_top50:.1f}%
  Whiten             : True
  Errores            : {errores}
╚══════════════════════════════════════════╝

Siguientes pasos:
  1. Reinicia uvicorn para cargar el nuevo PCA
  2. Borra embeddings viejos en Supabase:
     DELETE FROM biometria_embeddings WHERE rancho_id = '{os.getenv("RANCHO_ID","<rancho_id>")}';
  3. Re-ejecuta register_dataset.py
""")


if __name__ == "__main__":
    main()