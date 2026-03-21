/**
 * src/lib/visionApi.ts
 * Cliente HTTP para Gandia Vision API.
 * URL base desde variable de entorno VITE_VISION_API_URL.
 * Si no está definida usa localhost:8000 en desarrollo.
 */

import { supabase } from './supabaseClient'

const BASE_URL = (import.meta.env.VITE_VISION_API_URL as string) || 'http://localhost:8000'

// ─── AUTH TOKEN ───────────────────────────────────────────────────────────────

async function getToken(): Promise<string> {
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? ''
}

async function headers(): Promise<HeadersInit> {
  const token = await getToken()
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

// ─── BASE FETCH ───────────────────────────────────────────────────────────────

async function get<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: await headers(),
    })
    if (!res.ok) return null
    return res.json() as Promise<T>
  } catch {
    return null
  }
}

async function post<T>(path: string, body: unknown): Promise<T | null> {
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: await headers(),
      body: JSON.stringify(body),
    })
    if (!res.ok) return null
    return res.json() as Promise<T>
  } catch {
    return null
  }
}

// ─── TIPOS ────────────────────────────────────────────────────────────────────

export interface VisionScore {
  score:     number
  label:     'ÓPTIMO' | 'ACEPTABLE' | 'RIESGO'
  color:     string
  breakdown: {
    anomalias_alta:        number
    corrales_alerta:       number
    camaras_online:        number
    animales_registrados:  number
    bonus_rfid:            number
  }
  detalles: {
    n_anomalias_alta:   number
    n_corrales_alerta:  number
    camaras_online:     number
    total_corrales:     number
    animales_total:     number | null
  }
}

export interface VisionAnomalia {
  id:         string
  tipo:       string
  severidad:  'alta' | 'media' | 'baja'
  corral_id:  string
  rancho_id:  string
  animal_id:  string | null
  notas:      string | null
  resuelto:   boolean
  created_at: string
  vision_evidencia?: { url_storage: string; clase: string; confianza: number }[]
}

export interface StreamStartResponse {
  ok:         boolean
  session_id: string
}

// ─── API FUNCTIONS ────────────────────────────────────────────────────────────

/**
 * Score sanitario 0-100 desde el backend de visión.
 * Fuente de verdad — reemplaza el cálculo frontend.
 */
export async function getVisionScore(ranchoId: string): Promise<VisionScore | null> {
  return get<VisionScore>(`/score/${ranchoId}`)
}

/**
 * Anomalías activas del rancho desde el backend.
 */
export async function getVisionAnomalias(ranchoId: string): Promise<VisionAnomalia[]> {
  const data = await get<VisionAnomalia[]>(`/anomalias/${ranchoId}?activas=true`)
  return data ?? []
}

/**
 * Resolver una anomalía vía backend.
 */
export async function resolverVisionAnomalia(anomaliaId: string, resueltoPor: string): Promise<boolean> {
  const data = await post(`/anomalias/${anomaliaId}/resolver`, { resuelto_por: resueltoPor })
  return data !== null
}

/**
 * Iniciar procesamiento de stream RTSP.
 */
export async function startVisionStream(params: {
  camara_id:         string
  corral_id:         string
  rancho_id:         string
  rtsp_url:          string
  fps_target?:       number
  n_vacas_esperadas?: number
}): Promise<StreamStartResponse | null> {
  return post<StreamStartResponse>('/streams/start', params)
}

/**
 * Detener stream activo.
 */
export async function stopVisionStream(camaraId: string): Promise<boolean> {
  const data = await post('/streams/stop', { camara_id: camaraId })
  return data !== null
}

/**
 * Enviar lectura RFID al backend.
 */
export async function postRFIDEvento(params: {
  arete:     string
  corral_id: string
  rancho_id: string
  tipo?:     string
}): Promise<{ matched: boolean; animal_id: string | null } | null> {
  return post('/rfid/evento', { ...params, tipo: params.tipo ?? 'lectura' })
}

/**
 * Health check — verifica que el backend esté disponible.
 */
export async function checkVisionHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/health`)
    return res.ok
  } catch {
    return false
  }
}