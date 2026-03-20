# Gandia Vision 🐄

**Sistema Inteligente de Monitoreo Sanitario y Trazabilidad Ganadera**
México → USA Export Protection Layer

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Visión IA | YOLOv11n + ByteTrack + OpenCV |
| API | FastAPI + Celery + Redis (Upstash) |
| Base de datos | Supabase (PG + Storage + Realtime) |
| GPU | RunPod (T4 / RTX 3090) |
| API Host | Fly.io |

---

## Estructura

```
gandia-vision/
├── api/            # FastAPI — endpoints REST
├── vision/         # YOLOv11 + ByteTrack + análisis
├── anomaly/        # Motor de reglas + scoring sanitario
├── workers/        # Celery tasks (frame, stream, rfid)
├── rfid/           # MQTT listener
├── db/             # Supabase client + repositories
├── training/       # Fine-tune YOLO
├── scripts/        # Utilidades
└── docker/         # Dockerfiles + compose
```

---

## Setup local

```bash
# 1. Clonar y entrar
git clone https://github.com/tu-usuario/gandia-vision
cd gandia-vision

# 2. Variables de entorno
cp .env.example .env
# Editar .env con tus credenciales Supabase + Redis

# 3. Instalar dependencias
pip install -r requirements.txt

# 4. Migración DB (ejecutar en Supabase SQL Editor)
# db/migrations/001_vision_tables.sql

# 5. Levantar todo en local
docker compose -f docker/docker-compose.dev.yml up

# O sin Docker:
uvicorn api.main:app --reload &
celery -A workers.celery_app worker --queues=vision,rfid --pool=solo --loglevel=debug
```

---

## Probar detector

```bash
# Webcam local
python scripts/test_camera.py --source 0

# Video
python scripts/test_camera.py --source ./video_vacas.mp4

# RTSP
python scripts/test_camera.py --source rtsp://192.168.1.x:554/stream
```

---

## API Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /health | Estado del servicio |
| POST | /streams/frame | Procesar 1 frame (base64) |
| POST | /streams/start | Iniciar stream RTSP |
| POST | /streams/stop | Detener stream |
| GET | /detecciones/{corral_id} | Últimas detecciones |
| GET | /anomalias/{rancho_id} | Anomalías activas |
| PATCH | /anomalias/{id}/resolver | Resolver anomalía |
| POST | /rfid/evento | Lectura RFID via REST |
| GET | /score/{rancho_id} | Score sanitario 0-100 |

Docs interactivos: `http://localhost:8000/docs`

---

## Entrenamiento

```bash
# 1. Preparar datasets
python training/datasets/download_colo.py

# 2. Entrenar (en RunPod con GPU)
python training/train.py \
  --data ./training/datasets/gandia.yaml \
  --base yolo11n.pt \
  --epochs 100 \
  --batch 16 \
  --nombre gandia-v1 \
  --export

# 3. Evaluar y registrar en DB
python training/evaluate.py \
  --model runs/detect/gandia-v1/weights/best.pt \
  --rancho TU_RANCHO_ID
```

---

## Deploy RunPod (Worker GPU)

```bash
# Build imagen
docker build -f docker/Dockerfile.worker -t gandia-vision-worker .

# Subir a registry
docker push tu-registry/gandia-vision-worker:latest

# En RunPod: usar imagen personalizada
# Variables de entorno: copiar de .env
# Comando: ya definido en Dockerfile.worker
```

---

## Deploy Fly.io (API)

```bash
# Instalar flyctl si no tienes
curl -L https://fly.io/install.sh | sh

# Login y deploy
fly auth login
fly launch --dockerfile docker/Dockerfile.api
fly secrets set SUPABASE_URL=... SUPABASE_SERVICE_KEY=... REDIS_URL=...
fly deploy
```

---

## Clases YOLO

| ID | Clase | Descripción |
|----|-------|-------------|
| 0 | `cow` | Vaca de pie, comportamiento normal |
| 1 | `cow_down` | Vaca echada o postrada |
| 2 | `wound_suspect` | Zona con lesión visible |

---

## Flujo completo

```
Cámara IP → RTSP stream → FastAPI /streams/start
                               ↓
                    Celery Worker (RunPod GPU)
                               ↓
                    YOLO detecta → ByteTrack asigna ID
                               ↓
                    Motor de reglas evalúa comportamiento
                               ↓
                    Anomalía + Evidencia → Supabase
                               ↓
                    Realtime → Frontend Gandia 7 actualiza widgets
```

---

## Licencia

Propietario — Gandia 7 © 2026
