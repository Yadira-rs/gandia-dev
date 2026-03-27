-- ==========================================
-- GANDIA 7: CONFIGURACIÓN PARA MÓDULO CAMPO
-- ==========================================

-- 1. Crear tabla de eventos de campo
CREATE TABLE IF NOT EXISTS public.campo_eventos (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    rancho_id TEXT,
    input_type TEXT,
    content TEXT,
    attachment_url TEXT,
    mime_type TEXT,
    file_name TEXT,
    file_size BIGINT,
    duration_sec FLOAT,
    gps_lat DOUBLE PRECISION,
    gps_lng DOUBLE PRECISION,
    gps_accuracy FLOAT,
    operador_nombre TEXT,
    created_at_local TIMESTAMPTZ,
    synced_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Habilitar RLS (Seguridad de Fila)
ALTER TABLE public.campo_eventos ENABLE ROW LEVEL SECURITY;

-- 3. Crear política de acceso (solo el dueño puede ver/editar sus datos)
CREATE POLICY "Users can manage their own campo events"
ON public.campo_eventos
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. Nota sobre Storage (Archivos y Audio):
-- Debes crear manualmente un BUCKET PÚBLICO llamado 'campo-evidencia' 
-- en la sección STORAGE de tu panel de Supabase para que las fotos y audios se guarden.
