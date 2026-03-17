# Gandia NosePrint — Backend FastAPI

## Estructura
```
backend/
  main.py                     ← App FastAPI + endpoints
  pipeline/
    validator.py              ← Paso 1: validar calidad imagen
    detector.py               ← Paso 2: detectar región del morro (Canny + ArUco)
    preprocessor.py           ← Paso 3: CLAHE, Gaussiano, normalizar
    fingerprint.py            ← Paso 4: motor CV clásico (descriptor 512)
    embedding.py              ← Paso 5: ResNet50 + PCA → vector 128
    fusion.py                 ← Paso 6: fusión 55/45 + regla de decisión
  db/
    supabase_client.py        ← búsqueda pgvector + guardar referencias
  sql/
    setup.sql                 ← ejecutar en Supabase antes de todo
  generate_aruco_sheet.py     ← genera hoja inteligente imprimible
  requirements.txt
  Procfile                    ← para Railway/Render
  .env.example
```

## Configuración inicial

### 1. Supabase — ejecutar setup.sql
Ir a Supabase → SQL Editor → pegar y ejecutar `sql/setup.sql`

### 2. Variables de entorno (.env)
```
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...   # service_role key (Settings → API)
```

### 3. Instalar dependencias
```bash
pip install -r requirements.txt
```

### 4. Generar hoja inteligente (una sola vez)
```bash
python generate_aruco_sheet.py --output hoja_gandia.png
# Imprimir a tamaño carta
```

### 5. Correr local
```bash
uvicorn main:app --reload --port 8000
```

### 6. Deploy en Railway
- Conectar repo
- Agregar variables de entorno SUPABASE_URL y SUPABASE_SERVICE_KEY
- Railway detecta el Procfile automáticamente

## Endpoints

| Método | Ruta         | Descripción                              |
|--------|--------------|------------------------------------------|
| POST   | /identify    | Identificar animal por imagen de morro   |
| POST   | /register    | Registrar huella de referencia           |
| POST   | /train-pca   | Re-entrenar PCA (admin)                  |
| GET    | /health      | Healthcheck                              |

## Flujo de uso

1. **Primer uso** (animal nuevo):
   - Frontend llama `POST /register` con imagen + animal_id
   - Backend extrae fingerprint + embedding y los guarda en Supabase

2. **Identificación en campo**:
   - Frontend llama `POST /identify` con imagen + rancho_id
   - Backend ejecuta el pipeline completo y devuelve resultado

3. **PCA** (automático):
   - Se re-entrena cada 20 nuevos registros
   - O manualmente con `POST /train-pca`

## Notas de producción

- ResNet50 (~100MB) se descarga automáticamente en el primer arranque
- Para ranchos > 1,000 animales: crear índice IVFFlat (ya en setup.sql)
- Para ranchos > 50,000: cambiar a índice HNSW y pre-filtrar por rancho_id
