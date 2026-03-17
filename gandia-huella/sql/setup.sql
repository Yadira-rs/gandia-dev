-- ============================================================
-- setup.sql — Ejecutar en el SQL Editor de Supabase
-- Habilita pgvector y crea la columna + función de búsqueda
-- ============================================================

-- 1. Habilitar extensión pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Agregar columna embedding_vector a biometria_embeddings
--    (si la tabla ya existe sin esa columna)
ALTER TABLE biometria_embeddings
  ADD COLUMN IF NOT EXISTS embedding_vector VECTOR(128),
  ADD COLUMN IF NOT EXISTS fp_features      JSONB,
  ADD COLUMN IF NOT EXISTS embedding_raw    JSONB,  -- vector 2048 crudo para re-entrenar PCA
  ADD COLUMN IF NOT EXISTS calidad          DECIMAL(4,3),
  ADD COLUMN IF NOT EXISTS modo             VARCHAR(20) DEFAULT 'direct',
  ADD COLUMN IF NOT EXISTS activo           BOOLEAN DEFAULT TRUE;

-- 3. Índice IVFFlat para búsqueda aproximada eficiente
--    (crear DESPUÉS de tener al menos 100 registros)
CREATE INDEX IF NOT EXISTS idx_biometria_emb_vector
  ON biometria_embeddings
  USING ivfflat (embedding_vector vector_cosine_ops)
  WITH (lists = 50);

-- 4. Función RPC para búsqueda por similitud coseno desde el backend
CREATE OR REPLACE FUNCTION search_embeddings_by_rancho(
  query_vector VECTOR(128),
  p_rancho_id  UUID,
  p_top_k      INT DEFAULT 5
)
RETURNS TABLE (
  animal_id UUID,
  distance  FLOAT,
  nombre    TEXT,
  siniiga   TEXT
)
LANGUAGE SQL STABLE
AS $$
  SELECT
    be.animal_id,
    (be.embedding_vector <=> query_vector)::FLOAT AS distance,
    a.nombre,
    a.siniiga
  FROM biometria_embeddings be
  LEFT JOIN animales a ON a.id = be.animal_id
  WHERE be.rancho_id = p_rancho_id
    AND be.activo = TRUE
    AND be.embedding_vector IS NOT NULL
  ORDER BY be.embedding_vector <=> query_vector
  LIMIT p_top_k;
$$;

-- 5. RLS: el service_role key del backend puede leer/escribir sin restricción.
--    Las políticas existentes de la app frontend (anon key) no se tocan.
