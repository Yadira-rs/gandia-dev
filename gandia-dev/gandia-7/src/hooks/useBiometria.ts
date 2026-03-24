/**
 * useBiometria.ts
 * Hook central del módulo Biometría — patrón idéntico a useAnimales.ts
 * ARCHIVO → src/hooks/useBiometria.ts
 */

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

function errMsg(e: unknown): string {
  if (e instanceof Error) return e.message
  if (typeof e === 'object' && e !== null && 'message' in e)
    return String((e as { message: unknown }).message)
  return String(e)
}

function relativeTime(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000)
  if (diff < 10)   return 'ahora'
  if (diff < 60)   return `hace ${diff}s`
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} hr`
  return new Date(ts).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })
}

// ─── TIPOS PÚBLICOS ───────────────────────────────────────────────────────────

export type BiometriaStatus = 'sin-registrar' | 'pendiente' | 'registrado'
export type ResultadoCaptura = 'match' | 'candidato' | 'nuevo' | 'error'
export type ModoCaptura = 'direct' | 'sheet'

export interface BiometriaCapturaDB {
  id:             string
  rancho_id:      string
  animal_id:      string | null
  subido_por:     string
  imagen_path:    string
  score_cv:       number | null
  score_ia:       number | null
  score_fusion:   number | null
  resultado:      ResultadoCaptura
  modo:           ModoCaptura
  confirmado:     boolean
  confirmado_por: string | null
  confirmado_at:  string | null
  notas:          string | null
  created_at:     string
  // joined desde animales
  animal_nombre?: string | null
  animal_siniiga?: string | null
}

export interface AnimalConBiometria {
  id:               string
  siniiga:          string
  nombre:           string | null
  raza:             string
  sexo:             'macho' | 'hembra'
  biometria_status: BiometriaStatus
  upp:              string | null
}

// ─── MAPEO: DB → RegistroCaptura UI (consumido por Historial y Estadísticas) ─

export interface RegistroCaptura {
  capturaId:  string             // ← UUID real de la BD
  id:         number             // ← índice para listas (legacy)
  ts:         string
  animal:     string
  arete:      string
  lote:       string
  score:      number
  resultado:  ResultadoCaptura
  modo:       ModoCaptura
  confirmado: boolean
}

export function dbToRegistro(c: BiometriaCapturaDB, idx: number): RegistroCaptura {
  return {
    capturaId:  c.id,
    id:         idx,
    ts:         relativeTime(new Date(c.created_at).getTime()),
    animal:     c.animal_nombre ?? '—',
    arete:      c.animal_siniiga ?? '—',
    lote:       '—',
    score:      c.score_fusion ?? 0,
    resultado:  c.resultado,
    modo:       c.modo,
    confirmado: c.confirmado,
  }
}

// ─── HOOK: historial completo del rancho (hoy) ────────────────────────────────

export function useBiometriaCapturas(ranchoId: string | null) {
  const [capturas,  setCapturas]  = useState<BiometriaCapturaDB[]>([])
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  const fetchCapturas = useCallback(async () => {
    if (!ranchoId) return
    setLoading(true)
    setError(null)
    try {
      const hoy = new Date()
      hoy.setHours(0, 0, 0, 0)

      const { data, error: err } = await supabase
        .from('biometria_capturas')
        .select('*, animales(nombre, siniiga)')
        .eq('rancho_id', ranchoId)
        .gte('created_at', hoy.toISOString())
        .order('created_at', { ascending: false })
        .limit(200)

      if (err) throw err

      const mapped = (data ?? []).map((c: BiometriaCapturaDB & { animales?: { nombre: string | null; siniiga: string | null } | null }) => ({
        ...c,
        animal_nombre:  c.animales?.nombre  ?? null,
        animal_siniiga: c.animales?.siniiga ?? null,
      })) as BiometriaCapturaDB[]

      setCapturas(mapped)
    } catch (e) {
      setError(errMsg(e))
    } finally {
      setLoading(false)
    }
  }, [ranchoId])

  useEffect(() => { fetchCapturas() }, [fetchCapturas])

  return { capturas, loading, error, refetch: fetchCapturas }
}

// ─── HOOK: capturas de UN animal (FichaHuellaWidget) ─────────────────────────

export function useCapturasPorAnimal(animalId: string | null) {
  const [capturas,  setCapturas]  = useState<BiometriaCapturaDB[]>([])
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  const fetchCapturas = useCallback(async () => {
    if (!animalId) { setCapturas([]); return }
    setLoading(true)
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from('biometria_capturas')
        .select('*')
        .eq('animal_id', animalId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (err) throw err
      setCapturas(data ?? [])
    } catch (e) {
      setError(errMsg(e))
    } finally {
      setLoading(false)
    }
  }, [animalId])

  useEffect(() => { fetchCapturas() }, [fetchCapturas])

  return { capturas, loading, error, refetch: fetchCapturas }
}

// ─── HOOK: animales SIN huella o pendientes (BiometriaRegistrarWidget) ────────

export function useAnimalesSinHuella(ranchoId: string | null) {
  const [animales,  setAnimales]  = useState<AnimalConBiometria[]>([])
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  const fetchAnimales = useCallback(async () => {
    if (!ranchoId) return
    setLoading(true)
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from('animales')
        .select('id, siniiga, nombre, raza, sexo, biometria_status, upp')
        .eq('rancho_id', ranchoId)
        .neq('estatus', 'baja')
        .in('biometria_status', ['sin-registrar', 'pendiente'])
        .order('biometria_status')     // pendiente primero (alfabético)
        .order('nombre')

      if (err) throw err
      setAnimales(data ?? [])
    } catch (e) {
      setError(errMsg(e))
    } finally {
      setLoading(false)
    }
  }, [ranchoId])

  useEffect(() => { fetchAnimales() }, [fetchAnimales])

  return { animales, loading, error, refetch: fetchAnimales }
}

// ─── ACCIÓN: subir imagen y registrar captura ─────────────────────────────────

export async function registrarCaptura(params: {
  imageDataUrl: string
  ranchoId:     string
  userId:       string
  animalId?:    string | null
  scoreCV?:     number
  scoreIA?:     number
  scoreFusion?: number
  resultado:    ResultadoCaptura
  modo:         ModoCaptura
  latitud?:     number
  longitud?:    number
}): Promise<{ captura: BiometriaCapturaDB | null; error: string | null }> {
  try {
    // 1. Convertir dataURL → Blob
    const res  = await fetch(params.imageDataUrl)
    const blob = await res.blob()
    const ext  = blob.type.includes('png') ? 'png' : 'jpg'
    const path = `${params.ranchoId}/capturas/${crypto.randomUUID()}.${ext}`

    // 2. Storage
    const { error: uploadErr } = await supabase.storage
      .from('biometria-capturas')
      .upload(path, blob, { contentType: blob.type, upsert: false })

    if (uploadErr) throw uploadErr

    // 3. Insertar en BD
    const { data, error: insertErr } = await supabase
      .from('biometria_capturas')
      .insert({
        rancho_id:    params.ranchoId,
        animal_id:    params.animalId ?? null,
        subido_por:   params.userId,
        imagen_path:  path,
        score_cv:     params.scoreCV    ?? null,
        score_ia:     params.scoreIA    ?? null,
        score_fusion: params.scoreFusion ?? null,
        resultado:    params.resultado,
        modo:         params.modo,
        confirmado:   false,
        latitud:      params.latitud  ?? null,
        longitud:     params.longitud ?? null,
      })
      .select()
      .single()

    if (insertErr) throw insertErr
    return { captura: data, error: null }
  } catch (e) {
    return { captura: null, error: errMsg(e) }
  }
}

// ─── ACCIÓN: confirmar captura ────────────────────────────────────────────────
// El trigger en BD actualiza biometria_status en animales automáticamente.

export async function confirmarCaptura(params: {
  capturaId: string
  animalId:  string
  userId:    string
  notas?:    string
}): Promise<{ error: string | null }> {
  try {
    const { error: err } = await supabase
      .from('biometria_capturas')
      .update({
        confirmado:     true,
        confirmado_por: params.userId,
        confirmado_at:  new Date().toISOString(),
        animal_id:      params.animalId,
        notas:          params.notas ?? null,
      })
      .eq('id', params.capturaId)

    if (err) throw err

    // Auto-evento en timeline twins cuando se confirma una huella biométrica
    // Fire-and-forget — no bloquea la respuesta al usuario
    void supabase
      .from('animales')
      .select('siniiga')
      .eq('id', params.animalId)
      .single()
      .then(({ data: animal }) => {
        if (!animal?.siniiga) return
        void supabase.from('twins_eventos').insert({
          animal_id: animal.siniiga,
          tipo:      'auditoria',
          fecha:     new Date().toISOString(),
          data: {
            titulo:    'Huella biométrica confirmada',
            valor:     'Captura de morro verificada',
            cert:      'completa',
            ubicacion: '',
          },
        })
      })

    return { error: null }
  } catch (e) {
    return { error: errMsg(e) }
  }
}

// ─── ACCIÓN: guardar embedding de referencia ──────────────────────────────────

export async function registrarEmbedding(params: {
  imageDataUrl: string
  animalId:     string
  ranchoId:     string
  userId:       string
  calidad:      number
}): Promise<{ error: string | null }> {
  try {
    const res  = await fetch(params.imageDataUrl)
    const blob = await res.blob()
    const ext  = blob.type.includes('png') ? 'png' : 'jpg'
    const path = `${params.ranchoId}/${params.animalId}/ref_${crypto.randomUUID()}.${ext}`

    const { error: uploadErr } = await supabase.storage
      .from('biometria-capturas')
      .upload(path, blob, { contentType: blob.type, upsert: false })

    if (uploadErr) throw uploadErr

    // Desactivar embedding anterior
    await supabase
      .from('biometria_embeddings')
      .update({ activo: false })
      .eq('animal_id', params.animalId)
      .eq('activo', true)

    const { error: insertErr } = await supabase
      .from('biometria_embeddings')
      .insert({
        animal_id:   params.animalId,
        rancho_id:   params.ranchoId,
        subido_por:  params.userId,
        imagen_path: path,
        calidad:     params.calidad,
        activo:      true,
      })

    if (insertErr) throw insertErr
    return { error: null }
  } catch (e) {
    return { error: errMsg(e) }
  }
}

// ─── ACCIÓN: URL firmada de imagen ───────────────────────────────────────────

export async function getCapturaUrl(storagePath: string): Promise<string | null> {
  const { data } = await supabase.storage
    .from('biometria-capturas')
    .createSignedUrl(storagePath, 3600)
  return data?.signedUrl ?? null
}