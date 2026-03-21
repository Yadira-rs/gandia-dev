"""
register_dataset.py v5.0 — NosePrint (CLASE MUNDIAL)
=====================================================
Mejoras implementadas:
  1. EfficientNetB4 ensemble (1792-dim raw)
  2. PCA 1792→256 con whiten=True
  3. N_IMAGENES=3 por animal — promedia embeddings y fingerprints
  4. Pipeline COMPLETO: detect → preprocess → fingerprint + embedding
  5. Selección por nitidez (Laplaciano) de las mejores N imágenes
  6. Manejo robusto de errores con reintentos y logging
  7. Timeout extendido (30s) para Supabase en condiciones de red lentas
  8. Verificación de animales existentes antes de crear (evita duplicados)
  9. Reporte CSV detallado con n_imgs y calidad promedio
 10. Progreso claro con emojis y estadísticas en tiempo real

USO:
  python register_dataset.py \
    --dataset ./BeefCattle_Muzzle_Individualized \
    --rancho-id 05e27da2-bd92-4af7-9cac-91653cbe85bc
"""

import os
import sys
import csv
import time
import argparse
import logging
import pickle
import requests
import numpy as np
import cv2
import torch
import torch.nn as nn
from pathlib import Path
from torchvision import models
from dotenv import load_dotenv

load_dotenv()
logging.basicConfig(level=logging.WARNING)   # silenciar logs de torch en consola

# ─── Constantes ───────────────────────────────────────────────────────────────
SUPABASE_URL   = os.getenv("SUPABASE_URL", "").rstrip("/")
SUPABASE_KEY   = os.getenv("SUPABASE_SERVICE_KEY", "")
PROPIETARIO_ID = "05e27da2-bd92-4af7-9cac-91653cbe85bc"
RANCHO_REAL_ID = "349e35f2-caa8-499f-804f-e15a4b1ff327"
N_IMAGENES     = 3       # mejores imágenes por animal a promediar
SUPABASE_TIMEOUT = 30    # segundos — para conexiones lentas
MAX_RETRIES      = 3     # reintentos para llamadas a Supabase

H = {
    "apikey":        SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type":  "application/json",
    "Prefer":        "return=representation",
}

# ─── Agregar directorio del proyecto al path ──────────────────────────────────
sys.path.insert(0, str(Path(__file__).parent))
from pipeline.fingerprint  import extract_fingerprint
from pipeline.preprocessor import preprocess
from pipeline.detector     import detect_morro_region

# ─── Cargar EfficientNetB4 ────────────────────────────────────────────────────

def _build_efficientnet():
    print("Cargando EfficientNetB4...", flush=True)
    eff      = models.efficientnet_b4(weights=models.EfficientNet_B4_Weights.IMAGENET1K_V1)
    backbone = nn.Sequential(eff.features, nn.AdaptiveAvgPool2d(1), nn.Flatten())
    backbone.eval()
    print("✅ EfficientNetB4 listo", flush=True)
    return backbone

_backbone = _build_efficientnet()

# ─── Cargar PCA ───────────────────────────────────────────────────────────────

def _load_pca() -> tuple:
    """Carga PCA desde models/pca_model.pkl con validación."""
    pca_path = Path("models/pca_model.pkl")
    if not pca_path.exists():
        print("⚠️  Sin PCA — usando truncación a 256 dims", flush=True)
        print("   Ejecuta train_pca_local.py primero para mejor precisión.", flush=True)
        return None, 1792

    try:
        with open(pca_path, "rb") as f:
            pca = pickle.load(f)

        n_features   = getattr(pca, "n_features_in_", None)
        n_components = getattr(pca, "n_components_", 256)

        if n_features is None:
            print(f"✅ PCA cargado: ?→{n_components}", flush=True)
            return pca, 1792

        print(f"✅ PCA cargado: {n_features}→{n_components} (whiten={getattr(pca,'whiten','?')})", flush=True)
        return pca, int(n_features)

    except Exception as e:
        print(f"⚠️  Error cargando PCA: {e} — usando truncación", flush=True)
        return None, 1792

_pca, _raw_dim = _load_pca()


# ─── Extracción de features ───────────────────────────────────────────────────

def extraer_features(img_bgr: np.ndarray) -> tuple[list, list, list, float]:
    """
    Pipeline completo para una imagen:
      detect → preprocess → fingerprint + embedding

    Returns:
        (fp_vector, emb_vector, emb_raw, calidad)
        fp_vector  : lista 1024 floats — fingerprint CV
        emb_vector : lista 256 floats  — embedding IA con PCA
        emb_raw    : lista 1792 floats — embedding crudo para re-entrenamiento
        calidad    : float 0-1         — nitidez Laplaciana
    """
    # Paso 1: Detectar región del morro
    recorte = detect_morro_region(img_bgr, modo="direct")

    # Paso 2: Preprocesar
    prep = preprocess(recorte)

    # Paso 3: Fingerprint CV
    fp = extract_fingerprint(prep["img_gray"])

    # Paso 4: Embedding IA
    with torch.no_grad():
        feat_raw = _backbone(prep["img_tensor"]).squeeze().numpy().astype(np.float64)

    # Normalizar raw
    norm = np.linalg.norm(feat_raw)
    if norm > 1e-8:
        feat_raw_norm = feat_raw / norm
    else:
        feat_raw_norm = feat_raw

    # Aplicar PCA si está disponible
    if _pca is not None:
        emb = _pca.transform(feat_raw_norm.reshape(1, -1))[0].astype(np.float64)
    else:
        emb = feat_raw_norm[:256]

    # Normalizar post-PCA
    norm2 = np.linalg.norm(emb)
    if norm2 > 1e-8:
        emb = emb / norm2

    # Calidad por varianza Laplaciana
    gray    = cv2.cvtColor(cv2.resize(img_bgr, (256, 256)), cv2.COLOR_BGR2GRAY)
    lap_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    calidad = min(lap_var / 500.0, 1.0)

    return fp, emb.astype(np.float32).tolist(), feat_raw_norm.astype(np.float32).tolist(), calidad


# ─── Selección de mejores imágenes ────────────────────────────────────────────

def top_n_imagenes(carpeta: Path, n: int = 3) -> list[Path]:
    """
    Selecciona las N imágenes más nítidas de una carpeta
    usando varianza del Laplaciano como métrica de nitidez.
    """
    extensiones = ["*.jpg", "*.JPG", "*.jpeg", "*.JPEG", "*.png", "*.PNG"]
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
            score = float(cv2.Laplacian(g, cv2.CV_64F).var())
            scored.append((p, score))
        except Exception:
            pass

    scored.sort(key=lambda x: x[1], reverse=True)
    return [p for p, _ in scored[:n]]


# ─── Supabase helpers ─────────────────────────────────────────────────────────

def _supabase_request(method: str, url: str, **kwargs) -> requests.Response | None:
    """
    Wrapper con reintentos automáticos para llamadas a Supabase.
    Reintenta en caso de timeout o error de red.
    """
    for attempt in range(MAX_RETRIES):
        try:
            kwargs.setdefault("timeout", SUPABASE_TIMEOUT)
            r = requests.request(method, url, headers=H, **kwargs)
            return r
        except requests.exceptions.Timeout:
            if attempt < MAX_RETRIES - 1:
                wait = (attempt + 1) * 3
                print(f"(timeout, reintentando en {wait}s...)", end="", flush=True)
                time.sleep(wait)
            else:
                print(f"(timeout definitivo después de {MAX_RETRIES} intentos)", flush=True)
                return None
        except requests.exceptions.ConnectionError as e:
            if attempt < MAX_RETRIES - 1:
                time.sleep(3)
            else:
                print(f"(error de conexión: {e})", flush=True)
                return None
    return None


def crear_o_buscar_animal(siniiga: str) -> str | None:
    """
    Busca el animal por siniiga. Si no existe, lo crea.
    Devuelve el UUID del animal o None si falla.
    """
    # Buscar primero
    r = _supabase_request(
        "GET",
        f"{SUPABASE_URL}/rest/v1/animales",
        params={
            "siniiga":   f"eq.{siniiga}",
            "rancho_id": f"eq.{RANCHO_REAL_ID}",
            "select":    "id",
        },
    )
    if r and r.ok and r.json():
        return r.json()[0]["id"]

    # Crear nuevo animal
    r = _supabase_request(
        "POST",
        f"{SUPABASE_URL}/rest/v1/animales",
        json={
            "siniiga":          siniiga,
            "nombre":           siniiga,
            "raza":             "Bovino",
            "especie":          "bovino",
            "sexo":             "macho",
            "fecha_nacimiento": "2020-01-01",
            "rancho_id":        RANCHO_REAL_ID,
            "propietario_id":   PROPIETARIO_ID,
            "estatus":          "activo",
            "biometria_status": "sin-registrar",
        },
    )
    if r and r.ok and r.json():
        return r.json()[0]["id"]

    print(f"\n      ❌ Error creando animal {siniiga}: {r.text if r else 'sin respuesta'}")
    return None


def guardar_embedding(
    animal_id: str,
    fp: list[float],
    emb: list[float],
    emb_raw: list[float],
    calidad: float,
    n_imgs: int,
) -> bool:
    """
    Guarda el embedding en biometria_embeddings.
    El vector se convierte a string pgvector "[v1,v2,...]".
    """
    vec_str = "[" + ",".join(f"{v:.6f}" for v in emb) + "]"

    r = _supabase_request(
        "POST",
        f"{SUPABASE_URL}/rest/v1/biometria_embeddings",
        json={
            "animal_id":        animal_id,
            "rancho_id":        RANCHO_REAL_ID,
            "subido_por":       animal_id,
            "imagen_path":      f"dataset/{animal_id}",
            "fp_features":      fp,
            "embedding_vector": vec_str,
            "embedding_raw":    emb_raw,
            "calidad":          round(calidad, 4),
            "modo":             "direct",
            "activo":           True,
        },
    )

    if r is None:
        print("\n      ❌ Sin respuesta de Supabase")
        return False

    if r.status_code >= 400:
        print(f"\n      ❌ Error Supabase {r.status_code}: {r.text[:200]}")
        return False

    return True


# ─── MAIN ─────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Registra dataset de huellas de morro en Supabase"
    )
    parser.add_argument("--dataset",   required=True,
                        help="Ruta a BeefCattle_Muzzle_Individualized")
    parser.add_argument("--rancho-id", required=True,
                        help="UUID del rancho (animales.rancho_id)")
    parser.add_argument("--start",     type=int, default=0,
                        help="Índice de inicio (para reanudar)")
    parser.add_argument("--limit",     type=int, default=0,
                        help="Límite de animales (0=todos)")
    parser.add_argument("--delay",     type=float, default=0.1,
                        help="Delay entre animales en segundos")
    parser.add_argument("--output",    default="reporte_registro.csv",
                        help="Archivo CSV de reporte")
    parser.add_argument("--n-imgs",    type=int, default=N_IMAGENES,
                        help="Número de imágenes a promediar por animal")
    args = parser.parse_args()

    # Validaciones
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("❌ Falta SUPABASE_URL o SUPABASE_SERVICE_KEY en .env")
        sys.exit(1)

    dataset_path = Path(args.dataset)
    if not dataset_path.exists():
        print(f"❌ No existe el dataset: {dataset_path}")
        sys.exit(1)

    # Obtener carpetas de animales
    carpetas = sorted([
        d for d in dataset_path.iterdir()
        if d.is_dir() and d.name.startswith("cattle_")
    ])

    if args.start:
        carpetas = carpetas[args.start:]
    if args.limit:
        carpetas = carpetas[:args.limit]

    total   = len(carpetas)
    n_imgs  = args.n_imgs

    print(f"\n{'═'*65}")
    print(f"  🐄 NosePrint Dataset Registration v5.0")
    print(f"{'═'*65}")
    print(f"  📂 Dataset   : {dataset_path.name}")
    print(f"  🐄 Animales  : {total}")
    print(f"  📸 Imgs/animal: {n_imgs}")
    print(f"  🔬 Descriptor : 1024-dim fingerprint + 256-dim embedding")
    print(f"  🧠 Backbone   : EfficientNetB4 {'+ PCA' if _pca else '(sin PCA)'}")
    print(f"{'═'*65}\n")

    ok, fail, resultados = 0, 0, []
    t_start = time.time()

    for i, carpeta in enumerate(carpetas, 1):
        siniiga = carpeta.name
        mejores = top_n_imagenes(carpeta, n_imgs)

        elapsed = time.time() - t_start
        eta     = (elapsed / i) * (total - i) if i > 1 else 0
        print(f"[{i:>4}/{total}] {siniiga:20s} ({len(mejores)} imgs)",
              end="  ", flush=True)

        # Sin imágenes
        if not mejores:
            print("⚠️  sin imágenes")
            fail += 1
            resultados.append({
                "siniiga": siniiga, "animal_id": "", "ok": False,
                "error": "sin_imagenes", "calidad": 0, "n_imgs": 0,
            })
            continue

        # Crear o buscar animal en Supabase
        animal_id = crear_o_buscar_animal(siniiga)
        if not animal_id:
            fail += 1
            resultados.append({
                "siniiga": siniiga, "animal_id": "", "ok": False,
                "error": "animal_creation_failed", "calidad": 0, "n_imgs": 0,
            })
            continue

        # Extraer features de N imágenes
        fps, embs, embs_raw, calidades = [], [], [], []
        for img_path in mejores:
            try:
                img = cv2.imread(str(img_path))
                if img is None:
                    continue
                fp, emb, emb_raw, cal = extraer_features(img)
                fps.append(np.array(fp, dtype=np.float32))
                embs.append(np.array(emb, dtype=np.float32))
                embs_raw.append(np.array(emb_raw, dtype=np.float32))
                calidades.append(cal)
            except Exception as e:
                print(f"(err:{str(e)[:30]})", end="", flush=True)

        if not embs:
            print("❌ todas las imágenes fallaron")
            fail += 1
            resultados.append({
                "siniiga": siniiga, "animal_id": animal_id, "ok": False,
                "error": "pipeline_failed", "calidad": 0, "n_imgs": 0,
            })
            continue

        # Promediar y renormalizar todos los vectores
        fp_avg     = np.mean(fps, axis=0)
        fp_norm    = np.linalg.norm(fp_avg)
        fp_final   = (fp_avg / (fp_norm + 1e-8)).tolist()

        emb_avg    = np.mean(embs, axis=0)
        emb_norm   = np.linalg.norm(emb_avg)
        emb_final  = (emb_avg / (emb_norm + 1e-8)).tolist()

        raw_avg    = np.mean(embs_raw, axis=0)
        raw_norm   = np.linalg.norm(raw_avg)
        raw_final  = (raw_avg / (raw_norm + 1e-8)).tolist()

        cal_final  = float(np.mean(calidades))

        # Guardar en Supabase
        if guardar_embedding(animal_id, fp_final, emb_final, raw_final, cal_final, len(embs)):
            print(f"✅  cal={cal_final:.3f}  n={len(embs)}  ETA:{eta:.0f}s")
            ok += 1
            resultados.append({
                "siniiga": siniiga, "animal_id": animal_id, "ok": True,
                "error": "", "calidad": round(cal_final, 3), "n_imgs": len(embs),
            })
        else:
            fail += 1
            resultados.append({
                "siniiga": siniiga, "animal_id": animal_id, "ok": False,
                "error": "supabase_error", "calidad": 0, "n_imgs": len(embs),
            })

        time.sleep(args.delay)

    # ── Guardar reporte CSV ───────────────────────────────────────────────────
    with open(args.output, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=[
            "siniiga", "animal_id", "ok", "error", "calidad", "n_imgs"
        ])
        writer.writeheader()
        writer.writerows(resultados)

    elapsed_total = time.time() - t_start
    print(f"""
{'═'*45}
  ✅ Exitosos  : {ok}
  ❌ Fallidos  : {fail}
  Total        : {total}
  Imgs/animal  : {n_imgs}
  Tiempo total : {elapsed_total:.0f}s
  Reporte      : {args.output}
{'═'*45}
""")

    if ok >= 10:
        print("💡 Siguiente paso: python train_pca_local.py --dataset", args.dataset)
        print("   Luego: reinicia uvicorn y prueba con /identify\n")


if __name__ == "__main__":
    main()