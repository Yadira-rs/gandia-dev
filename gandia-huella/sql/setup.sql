-- ============================================================
-- setup.sql — NosePrint Bovino v3.0
-- Ejecutar en el SQL Editor de Supabase
-- ============================================================
-- NOTA: Este script asume que la tabla biometria_embeddings
-- ya existe con sus columnas base (id, animal_id, rancho_id,
-- subido_por, imagen_path, activo, created_at).
-- Solo agrega/actualiza lo relacionado con biometría vectorial.
-- ============================================================

-- 1. Habilitar extensión pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Agregar columnas biométricas si no existen
ALTER TABLE biometria_embeddings
  ADD COLUMN IF NOT EXISTS fp_features      JSONB,
  ADD COLUMN IF NOT EXISTS embedding_raw    JSONB,
  ADD COLUMN IF NOT EXISTS calidad          DECIMAL(4,3),
  ADD COLUMN IF NOT EXISTS modo             VARCHAR(20) DEFAULT 'direct';

-- 3. Cambiar columna embedding_vector a VECTOR(256)
--    Si ya existe como VECTOR(128), eliminar primero el índice viejo
DROP INDEX IF EXISTS idx_biometria_emb_vector;
DROP INDEX IF EXISTS biometria_embeddings_embedding_vector_idx;

-- Agregar columna si no existe (primera vez)
ALTER TABLE biometria_embeddings
  ADD COLUMN IF NOT EXISTS embedding_vector VECTOR(256);

-- Si ya existía como VECTOR(128), cambiar la dimensión
-- (comentar si es primera vez / descomentar si ya tenías 128)
-- ALTER TABLE biometria_embeddings
--   ALTER COLUMN embedding_vector TYPE vector(256)
--   USING embedding_vector::text::vector(256);

-- 4. Índice IVFFlat optimizado para 256 dims
--    (crear DESPUÉS de tener al menos 100 registros)
CREATE INDEX IF NOT EXISTS biometria_embeddings_embedding_vector_idx
  ON biometria_embeddings
  USING ivfflat (embedding_vector vector_cosine_ops)
  WITH (lists = 100);

-- 5. RPC de búsqueda por similitud coseno
CREATE OR REPLACE FUNCTION public.search_embeddings_by_rancho(
  query_vector vector(256),
  p_rancho_id  uuid,
  p_top_k      integer DEFAULT 10
)
RETURNS TABLE(
  animal_id uuid,
  distance  double precision,
  nombre    text,
  siniiga   text
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    be.animal_id,
    (be.embedding_vector <=> query_vector)::FLOAT AS distance,
    a.nombre,
    a.siniiga
  FROM biometria_embeddings be
  LEFT JOIN animales a ON a.id = be.animal_id
  WHERE be.rancho_id = p_rancho_id
    AND be.activo    = TRUE
    AND be.embedding_vector IS NOT NULL
  ORDER BY be.embedding_vector <=> query_vector
  LIMIT p_top_k;
$$;

-- 6. Verificar que todo quedó correcto
SELECT
  column_name,
  data_type,
  udt_name
FROM information_schema.columns
WHERE table_name = 'biometria_embeddings'
  AND column_name IN ('embedding_vector', 'fp_features', 'embedding_raw', 'calidad', 'modo')
ORDER BY column_name;