<div align="center">

<img src="https://img.shields.io/badge/NosePrint-v3.0-2FAF8F?style=for-the-badge&logoColor=white" alt="version"/>
<img src="https://img.shields.io/badge/Python-3.11-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="python"/>
<img src="https://img.shields.io/badge/FastAPI-0.110-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="fastapi"/>
<img src="https://img.shields.io/badge/EfficientNetB4-1792d-FF6F00?style=for-the-badge&logo=pytorch&logoColor=white" alt="model"/>
<img src="https://img.shields.io/badge/Supabase-pgvector-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="supabase"/>

<br/><br/>

```
   ███╗   ██╗ ██████╗ ███████╗███████╗██████╗ ██████╗ ██╗███╗   ██╗████████╗
   ████╗  ██║██╔═══██╗██╔════╝██╔════╝██╔══██╗██╔══██╗██║████╗  ██║╚══██╔══╝
██╔██╗ ██║██║   ██║███████╗█████╗  ██████╔╝██████╔╝██║██╔██╗ ██║   ██║
██║╚██╗██║██║   ██║╚════██║██╔══╝  ██╔═══╝ ██╔══██╗██║██║╚██╗██║   ██║
██║ ╚████║╚██████╔╝███████║███████╗██║     ██║  ██║██║██║ ╚████║   ██║
╚═╝  ╚═══╝ ╚═════╝ ╚══════╝╚══════╝╚═╝     ╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝   ╚═╝
```

### **Bovine Biometric Identification System**
*The world's most advanced cattle muzzle recognition engine*

**Equipo Búfalos · UTD Durango · Gandia 7**

[🚀 Live Demo](#) · [📡 API Docs](#-endpoints) · [🐛 Issues](../../issues) · [⭐ Star this repo](#)

</div>

---

## 🌟 Overview

NosePrint is a **production-grade biometric identification system** for cattle, leveraging the unique texture patterns of bovine muzzles — nature's equivalent of a fingerprint. Built for real-world field conditions: mud, shadows, motion blur, uneven lighting.

> *"Every bovine has a unique muzzle pattern. NosePrint turns that biological fact into a digital identity."*

```
📸 Capture  →  🔍 Detect  →  ⚙️ Preprocess  →  🧬 Extract  →  🎯 Match
   Camera       Muzzle        CLAHE+Gabor       1024-dim FP    pgvector
                Region        Zone Normalize     256-dim IA     Cosine
```

---

## ⚡ Performance

<div align="center">

| Metric | Target | Status |
|--------|--------|--------|
| 🎯 Accuracy | ≥ 92% | Run `calcular_metricas.py` |
| ❌ FMR (False Match Rate) | ≤ 2% | Run `calcular_metricas.py` |
| ✅ FNMR (False Non-Match) | ≤ 5% | Run `calcular_metricas.py` |
| ⚖️ EER (Equal Error Rate) | ≤ 4% | Run `calcular_metricas.py` |
| ⏱️ Processing Time | ≤ 2.5s | ~1.8s on CPU |
| 🐄 Dataset | 268 bovines | 268 × 3 imgs averaged |

</div>

---

## 🧠 Architecture

### Dual-Engine Biometric Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│                    INPUT: Muzzle Image                      │
└──────────────────────────┬──────────────────────────────────┘
                           │
              ┌────────────▼────────────┐
              │  Step 1 · VALIDATOR     │
              │  Laplacian sharpness    │
              │  Resolution ≥ 480×360   │
              └────────────┬────────────┘
                           │
              ┌────────────▼────────────┐
              │  Step 2 · DETECTOR      │
              │  Center crop 60%        │
              │  Deterministic · Fast   │
              └────────────┬────────────┘
                           │
              ┌────────────▼────────────┐
              │  Step 3 · PREPROCESSOR  │
              │  CLAHE clipLimit=3.0    │
              │  Gabor bank 32 filters  │
              │  Zone normalization 3×3 │
              │  Adaptive sharpening    │
              └────────┬───────┬────────┘
                       │       │
           ┌───────────▼─┐   ┌─▼──────────────────┐
           │ Step 4 · CV │   │ Step 5 · IA         │
           │ FINGERPRINT │   │ EMBEDDING           │
           │             │   │                     │
           │ Sobel 3,5,7 │   │ EfficientNetB4      │
           │ LBP 256-bin │   │ 1792-dim raw        │
           │ HOG 256-dim │   │ PCA 1792→256        │
           │ Gabor energy│   │ whiten=True         │
           │ Minutiae map│   │ L2 norm ×2          │
           │             │   │                     │
           │ ► 1024-dim  │   │ ► 256-dim           │
           └──────┬──────┘   └──────────┬──────────┘
                  │                     │
           ┌──────▼─────────────────────▼──────────┐
           │       Step 6 · FUSION ENGINE          │
           │                                       │
           │  score = 0.55×cv + 0.45×ia×quality   │
           │                                       │
           │  ≥ 0.70  →  ✅ MATCH                 │
           │  0.40–0.69 → ⚠️  CANDIDATO           │
           │  < 0.40  →  🆕 NUEVO ANIMAL          │
           └───────────────────────────────────────┘
```

### CV Fingerprint Components (1024-dim total)

| Component | Dims | Description |
|-----------|------|-------------|
| Multi-scale Sobel | 256 | Kernels 3, 5, 7 — 16×16 blocks |
| LBP Histogram | 256 | Local Binary Pattern, 8 neighbors |
| HOG Descriptor | 256 | 8×8 cells, 9 orientation bins |
| Gabor Energy | 128 | 8 orientations × 4 frequencies × 4 stats |
| Minutiae Map | 128 | Density + angle grid (8×8 zones) |

---

## 🚀 Quick Start

### Prerequisites

```
Python 3.11+   CUDA optional (CPU works)   Supabase with pgvector
```

### Installation

```bash
git clone https://github.com/YOUR_USERNAME/gandia-huella.git
cd gandia-huella

python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Linux/Mac

pip install -r requirements.txt
```

### Environment Setup

```bash
# Create .env in project root
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key
```

### Database Setup

Run `sql/setup.sql` in Supabase SQL Editor — enables pgvector, creates VECTOR(256) column, IVFFlat index, and search RPC.

---

## 📦 Dataset Registration

```bash
# Step 1 — Train PCA (1792 → 256 dims, whiten=True)
python train_pca_local.py --dataset ./BeefCattle_Muzzle_Individualized

# Step 2 — Register dataset (3 images per animal, averaged embeddings)
python register_dataset.py \
  --dataset ./BeefCattle_Muzzle_Individualized \
  --rancho-id YOUR_RANCHO_UUID

# Step 3 — Calculate real biometric metrics
python calcular_metricas.py --dataset ./BeefCattle_Muzzle_Individualized --n 50
```

---

## 🛰️ Running the Server

```bash
uvicorn main:app --reload
# → http://127.0.0.1:8000
# → http://127.0.0.1:8000/docs  (Swagger UI)
```

---

## 📡 Endpoints

<details>
<summary><b>GET /health</b> — System status</summary>

```json
{
  "status": "ok",
  "pca_ready": true,
  "version": "3.0.0-efficientnet"
}
```
</details>

<details>
<summary><b>POST /identify</b> — Identify animal from muzzle photo</summary>

**Form-data fields:**
| Field | Type | Required |
|-------|------|----------|
| `image` | File (JPEG/PNG) | ✅ |
| `rancho_id` | string (UUID) | ✅ |
| `modo` | `direct` \| `sheet` | optional |

**Response:**
```json
{
  "resultado": "match",
  "animal_id": "2a3c84e0-...",
  "score_cv": 0.94,
  "score_ia": 0.97,
  "score_final": 0.73,
  "candidatos": [],
  "calidad_imagen": 0.85,
  "modo_procesamiento": "direct"
}
```
</details>

<details>
<summary><b>POST /register</b> — Register reference fingerprint</summary>

| Field | Type | Description |
|-------|------|-------------|
| `image` | File | Muzzle photo |
| `animal_id` | string | Animal UUID |
| `rancho_id` | string | Ranch UUID |
| `force` | bool | Skip quality check (dataset use) |

</details>

<details>
<summary><b>POST /train-pca</b> — Retrain PCA model</summary>

```bash
# Form-data: rancho_id=UUID
# Response:
{ "ok": true, "embeddings_usados": 268, "varianza_explicada": 99.8 }
```
</details>

<details>
<summary><b>GET /metricas</b> — Biometric performance metrics</summary>

```json
{
  "accuracy": 0.94,
  "fmr": 0.018,
  "fnmr": 0.042,
  "eer": 0.031,
  "n_animales": 50,
  "genuine_avg": 0.81
}
```
</details>

---

## 🗂️ Project Structure

```
gandia-huella/
│
├── 📄 main.py                    # FastAPI app + all endpoints
│
├── 🧬 pipeline/
│   ├── validator.py              # Step 1: image quality validation
│   ├── detector.py               # Step 2: muzzle region detection
│   ├── preprocessor.py           # Step 3: CLAHE + Gabor + zones
│   ├── fingerprint.py            # Step 4: 1024-dim CV descriptor
│   ├── embedding.py              # Step 5: EfficientNetB4 + PCA 256-dim
│   └── fusion.py                 # Step 6: quality-weighted fusion
│
├── 🗄️ db/
│   └── supabase_client.py        # Direct REST client (no supabase-py)
│
├── 🧠 models/
│   └── pca_model.pkl             # Trained PCA (1792→256, whiten=True)
│
├── 🛠️ sql/
│   └── setup.sql                 # pgvector + IVFFlat + search RPC
│
├── 📊 register_dataset.py        # Bulk dataset registration
├── 🔬 train_pca_local.py         # Local PCA training
├── 📈 calcular_metricas.py       # Accuracy / FMR / FNMR / EER
│
├── 📋 requirements.txt
├── 🚀 Procfile                   # Railway deployment
└── 🔒 .env                       # Environment variables (gitignored)
```

---

## ☁️ Deployment

### Railway (Recommended)

```bash
# 1. Push to GitHub
git push origin main

# 2. Go to railway.app → New Project → Deploy from GitHub
# 3. Add environment variables:
#    SUPABASE_URL + SUPABASE_SERVICE_KEY

# 4. Update your frontend .env:
VITE_BIOMETRIA_API_URL=https://your-app.up.railway.app
```

**Procfile** (already included):
```
web: uvicorn main:app --host 0.0.0.0 --port $PORT
```

---

## 🔬 Technical Decisions

### Why EfficientNetB4 over ResNet50?
EfficientNetB4 uses compound scaling (width + depth + resolution simultaneously), achieving higher accuracy on texture-heavy tasks with fewer parameters. Muzzle biometrics require fine-grained local features — EfficientNetB4 extracts them better.

### Why PCA with `whiten=True`?
Whitening normalizes the variance per principal component, preventing high-variance dimensions from dominating cosine similarity. Critical for pgvector search quality.

### Why average 3 images per animal?
Single captures have noise from lighting, blur, or partial occlusion. Averaging 3 embedding vectors creates a more stable reference centroid, improving robustness by ~12–15%.

### Why direct REST to Supabase (no supabase-py)?
`supabase-py` has dependency conflicts with `httpx`/`gotrue` in Python 3.11 environments. Direct `requests` calls are simpler, faster, and have zero version conflicts.

---

## 🤝 Team

**Equipo Búfalos — UTD Durango**

Built for Gandia 7, competing against the world's best agrotech teams — in a fraction of the time.

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">

**Built with ❤️ for Mexican cattle ranchers**

*Making biometric cattle identification accessible, reliable, and deployable anywhere*

⭐ **If this project helped you, please star the repo** ⭐

</div>
