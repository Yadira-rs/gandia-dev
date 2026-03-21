-- ─── GANDIA VISION — Migration 001 ──────────────────────────────────────────
-- Tablas para el sistema de visión por computadora.
-- Ejecutar en Supabase SQL Editor.
-- ─────────────────────────────────────────────────────────────────────────────

-- Sesiones de procesamiento
CREATE TABLE IF NOT EXISTS vision_sessions (
    id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    rancho_id        UUID NOT NULL REFERENCES ranch_extended_profiles(id),
    camara_id        UUID NOT NULL REFERENCES camaras(id),
    corral_id        UUID NOT NULL REFERENCES corrales(id),
    inicio           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fin              TIMESTAMPTZ,
    estado           TEXT NOT NULL DEFAULT 'active'
                         CHECK (estado IN ('active','completed','error')),
    fps_target       INT NOT NULL DEFAULT 10,
    fps_real         FLOAT,
    frames_procesados INT DEFAULT 0,
    modelo_version   TEXT NOT NULL DEFAULT '1.0.0',
    created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Detecciones por frame
CREATE TABLE IF NOT EXISTS vision_detecciones (
    id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id          UUID REFERENCES vision_sessions(id),
    camara_id           UUID NOT NULL REFERENCES camaras(id),
    corral_id           UUID NOT NULL REFERENCES corrales(id),
    timestamp           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    n_vacas             INT NOT NULL DEFAULT 0,
    n_down              INT NOT NULL DEFAULT 0,
    n_wound_suspect     INT NOT NULL DEFAULT 0,
    confianza_promedio  FLOAT,
    latencia_ms         INT,
    modelo_version      TEXT
);

-- Tracks activos (estado vivo de cada animal detectado)
CREATE TABLE IF NOT EXISTS vision_tracks (
    id                          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id                  UUID NOT NULL REFERENCES vision_sessions(id),
    track_id_local              INT NOT NULL,
    animal_id                   UUID REFERENCES animales(id),
    corral_id                   UUID NOT NULL REFERENCES corrales(id),
    inicio                      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ultimo_frame                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    posicion_x                  FLOAT,
    posicion_y                  FLOAT,
    velocidad_promedio          FLOAT DEFAULT 0,
    velocidad_actual            FLOAT DEFAULT 0,
    tiempo_inmovil_segundos     FLOAT DEFAULT 0,
    distancia_centroide_hato    FLOAT DEFAULT 0,
    clase_dominante             TEXT DEFAULT 'cow',
    confianza_promedio          FLOAT,
    UNIQUE (session_id, track_id_local)
);

-- Evidencia visual de anomalías
CREATE TABLE IF NOT EXISTS vision_evidencia (
    id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    anomalia_id         UUID NOT NULL REFERENCES anomalias_monitoreo(id) ON DELETE CASCADE,
    track_id            UUID REFERENCES vision_tracks(id),
    url_storage         TEXT NOT NULL,
    frame_context_url   TEXT,
    timestamp           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    bbox_x              FLOAT,
    bbox_y              FLOAT,
    bbox_w              FLOAT,
    bbox_h              FLOAT,
    clase               TEXT,
    confianza           FLOAT
);

-- Lecturas RFID
CREATE TABLE IF NOT EXISTS rfid_eventos (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    rancho_id   UUID NOT NULL REFERENCES ranch_extended_profiles(id),
    corral_id   UUID REFERENCES corrales(id),
    animal_id   UUID REFERENCES animales(id),
    arete       TEXT NOT NULL,
    timestamp   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    tipo        TEXT NOT NULL DEFAULT 'lectura'
                    CHECK (tipo IN ('entrada','salida','lectura')),
    fuente      TEXT NOT NULL DEFAULT 'manual'
                    CHECK (fuente IN ('mqtt','rest','manual')),
    lector_id   TEXT
);

-- Versiones de modelos YOLO
CREATE TABLE IF NOT EXISTS vision_modelos (
    id                   UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre               TEXT NOT NULL,
    version              TEXT NOT NULL,
    archivo_path         TEXT NOT NULL,
    fecha_entrenamiento  TIMESTAMPTZ,
    precision            FLOAT,
    recall               FLOAT,
    map50                FLOAT,
    map95                FLOAT,
    clases_json          JSONB DEFAULT '["cow","cow_down","wound_suspect"]',
    activo               BOOL DEFAULT FALSE,
    rancho_id            UUID REFERENCES ranch_extended_profiles(id),
    dataset_usado        TEXT,
    created_at           TIMESTAMPTZ DEFAULT NOW()
);

-- ─── ÍNDICES ──────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_vision_det_camara_ts
    ON vision_detecciones (camara_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_vision_det_corral_ts
    ON vision_detecciones (corral_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_vision_tracks_session
    ON vision_tracks (session_id, ultimo_frame DESC);

CREATE INDEX IF NOT EXISTS idx_vision_tracks_corral
    ON vision_tracks (corral_id, tiempo_inmovil_segundos DESC);

CREATE INDEX IF NOT EXISTS idx_rfid_rancho_ts
    ON rfid_eventos (rancho_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_rfid_corral_ts
    ON rfid_eventos (corral_id, timestamp DESC);

-- ─── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE vision_sessions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE vision_detecciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE vision_tracks     ENABLE ROW LEVEL SECURITY;
ALTER TABLE vision_evidencia  ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfid_eventos      ENABLE ROW LEVEL SECURITY;
ALTER TABLE vision_modelos    ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS — el backend usa service_role key

-- ─── REALTIME ─────────────────────────────────────────────────────────────────

ALTER PUBLICATION supabase_realtime ADD TABLE vision_detecciones;
ALTER PUBLICATION supabase_realtime ADD TABLE rfid_eventos;
