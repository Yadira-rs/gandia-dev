/**
 * useDocumentos.ts
 * Hook central del módulo Documentos.
 * ARCHIVO → src/hooks/useDocumentos.ts
 *
 * Tablas en Supabase:
 *   expedientes            — grupos de documentos por trámite
 *   expediente_documentos  — archivos dentro de un expediente
 *   expediente_notas       — comentarios de la unión ganadera
 */

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

// ─── Helper ───────────────────────────────────────────────────────────────────
function errMsg(e: unknown): string {
  if (e instanceof Error) return e.message
  if (typeof e === 'object' && e !== null && 'message' in e)
    return String((e as { message: unknown }).message)
  return String(e)
}

// ─── TIPOS PÚBLICOS ───────────────────────────────────────────────────────────

export type TipoTramite =
  | 'movilizacion'
  | 'exportacion'
  | 'certificacion'
  | 'sanitario'
  | 'comercial'
  | 'otro'

export type EstadoExpediente =
  | 'borrador'
  | 'en_revision'
  | 'aprobado'
  | 'rechazado'
  | 'completado'

export type TipoDocExpediente =
  | 'factura'
  | 'cuvq'
  | 'reemo'
  | 'resultado_lab'
  | 'vacunacion'
  | 'foto_oficial'
  | 'certificado_sanitario'
  | 'guia_movilizacion'
  | 'constancia_upp'
  | 'identificacion'
  | 'otro'

export type TipoNota = 'comentario' | 'aprobacion' | 'rechazo' | 'correccion'

export interface ExpedienteDB {
  id:                  string
  rancho_id:           string
  user_id:             string
  tipo_tramite:        TipoTramite
  titulo:              string
  descripcion:         string | null
  estado:              EstadoExpediente
  created_at:          string
  updated_at:          string
  rancho_nombre?:      string | null
  propietario_nombre?: string | null
  total_docs?:         number
}

export interface ExpedienteDocumentoDB {
  id:              string
  expediente_id:   string
  rancho_id:       string
  subido_por:      string
  tipo:            TipoDocExpediente
  nombre:          string
  storage_path:    string
  mime_type:       string | null
  tamano_bytes:    number | null
  descripcion:     string | null
  emisor:          string | null
  fecha_documento: string | null
  hash_sha256:     string | null
  created_at:      string
}

export interface ExpedienteNotaDB {
  id:            string
  expediente_id: string
  autor_id:      string
  tipo:          TipoNota
  contenido:     string
  created_at:    string
  autor_nombre?: string | null
}

// ─── CONSTANTES UI ────────────────────────────────────────────────────────────

export const TRAMITE_LABEL: Record<TipoTramite, string> = {
  movilizacion:  'Movilización',
  exportacion:   'Exportación',
  certificacion: 'Certificación',
  sanitario:     'Sanitario',
  comercial:     'Comercial',
  otro:          'Otro',
}

export const TRAMITE_COLOR: Record<TipoTramite, string> = {
  movilizacion:  '#f59e0b',
  exportacion:   '#3b82f6',
  certificacion: '#2FAF8F',
  sanitario:     '#ef4444',
  comercial:     '#8b5cf6',
  otro:          '#78716c',
}

export const ESTADO_LABEL: Record<EstadoExpediente, string> = {
  borrador:    'Borrador',
  en_revision: 'En revisión',
  aprobado:    'Aprobado',
  rechazado:   'Rechazado',
  completado:  'Completado',
}

export const ESTADO_STYLE: Record<EstadoExpediente, string> = {
  borrador:    'text-stone-500 bg-stone-100 dark:bg-stone-800/60',
  en_revision: 'text-amber-600 bg-amber-50 dark:bg-amber-950/30',
  aprobado:    'text-[#2FAF8F] bg-[#2FAF8F]/10',
  rechazado:   'text-red-500 bg-red-50 dark:bg-red-950/30',
  completado:  'text-blue-500 bg-blue-50 dark:bg-blue-950/30',
}

export const TIPOS_DOC_EXP: { value: TipoDocExpediente; label: string }[] = [
  { value: 'factura',               label: 'Factura'                },
  { value: 'cuvq',                  label: 'CUVQ'                   },
  { value: 'reemo',                 label: 'Guía REEMO'             },
  { value: 'guia_movilizacion',     label: 'Guía de movilización'   },
  { value: 'certificado_sanitario', label: 'Certificado sanitario'  },
  { value: 'resultado_lab',         label: 'Resultado laboratorio'  },
  { value: 'vacunacion',            label: 'Vacunación'             },
  { value: 'constancia_upp',        label: 'Constancia UPP'         },
  { value: 'foto_oficial',          label: 'Foto oficial'           },
  { value: 'identificacion',        label: 'Identificación'         },
  { value: 'otro',                  label: 'Otro'                   },
]

export const DOC_TIPO_LABEL: Record<string, string> = Object.fromEntries(
  TIPOS_DOC_EXP.map(t => [t.value, t.label])
)

export const DOC_TIPO_COLOR: Record<string, string> = {
  factura:               'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30',
  cuvq:                  'text-blue-500 bg-blue-50 dark:bg-blue-950/30',
  reemo:                 'text-orange-500 bg-orange-50 dark:bg-orange-950/30',
  guia_movilizacion:     'text-amber-600 bg-amber-50 dark:bg-amber-950/30',
  certificado_sanitario: 'text-[#2FAF8F] bg-[#2FAF8F]/10',
  resultado_lab:         'text-purple-500 bg-purple-50 dark:bg-purple-950/30',
  vacunacion:            'text-teal-500 bg-teal-50 dark:bg-teal-950/30',
  constancia_upp:        'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/30',
  foto_oficial:          'text-stone-500 bg-stone-100 dark:bg-stone-800/60',
  identificacion:        'text-blue-500 bg-blue-50 dark:bg-blue-950/30',
  otro:                  'text-stone-400 bg-stone-100 dark:bg-stone-800/60',
}

// ─── REQUISITOS POR TRÁMITE ───────────────────────────────────────────────────

export const REQUISITOS_TRAMITE: Record<TipoTramite, { tipo: TipoDocExpediente; label: string; obligatorio: boolean }[]> = {
  movilizacion: [
    { tipo: 'guia_movilizacion',    label: 'Guía de movilización',   obligatorio: true  },
    { tipo: 'cuvq',                 label: 'CUVQ',                   obligatorio: true  },
    { tipo: 'factura',              label: 'Factura',                obligatorio: true  },
    { tipo: 'vacunacion',           label: 'Cartilla de vacunación', obligatorio: false },
  ],
  exportacion: [
    { tipo: 'factura',              label: 'Factura',                obligatorio: true  },
    { tipo: 'cuvq',                 label: 'CUVQ',                   obligatorio: true  },
    { tipo: 'reemo',                label: 'Guía REEMO',             obligatorio: true  },
    { tipo: 'resultado_lab',        label: 'Resultado laboratorio',  obligatorio: true  },
    { tipo: 'certificado_sanitario',label: 'Certificado sanitario',  obligatorio: true  },
    { tipo: 'foto_oficial',         label: 'Fotografía oficial',     obligatorio: false },
  ],
  certificacion: [
    { tipo: 'constancia_upp',       label: 'Constancia UPP',         obligatorio: true  },
    { tipo: 'certificado_sanitario',label: 'Certificado sanitario',  obligatorio: true  },
    { tipo: 'resultado_lab',        label: 'Resultado laboratorio',  obligatorio: true  },
    { tipo: 'vacunacion',           label: 'Cartilla de vacunación', obligatorio: true  },
    { tipo: 'identificacion',       label: 'Identificación',         obligatorio: false },
  ],
  sanitario: [
    { tipo: 'resultado_lab',        label: 'Resultado laboratorio',  obligatorio: true  },
    { tipo: 'certificado_sanitario',label: 'Certificado sanitario',  obligatorio: true  },
    { tipo: 'vacunacion',           label: 'Cartilla de vacunación', obligatorio: false },
  ],
  comercial: [
    { tipo: 'factura',              label: 'Factura',                obligatorio: true  },
    { tipo: 'identificacion',       label: 'Identificación',         obligatorio: false },
  ],
  otro: [],
}

// ─── HOOK: expedientes del rancho (productor) ─────────────────────────────────

export function useExpedientes(ranchoId: string | null) {
  const [expedientes, setExpedientes] = useState<ExpedienteDB[]>([])
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState<string | null>(null)

  const fetchExpedientes = useCallback(async () => {
    if (!ranchoId) { setExpedientes([]); return }
    setLoading(true)
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from('expedientes')
        .select('*')
        .eq('rancho_id', ranchoId)
        .order('updated_at', { ascending: false })
      if (err) throw err
      setExpedientes(data ?? [])
    } catch (e) {
      setError(errMsg(e))
    } finally {
      setLoading(false)
    }
  }, [ranchoId])

  useEffect(() => { fetchExpedientes() }, [fetchExpedientes])
  return { expedientes, loading, error, refetch: fetchExpedientes }
}

// ─── HOOK: todos los expedientes (unión ganadera) ─────────────────────────────

export function useAllExpedientes() {
  const [expedientes, setExpedientes] = useState<ExpedienteDB[]>([])
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from('expedientes')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(200)
      if (err) throw err

      const rows = data ?? []

      // Obtener nombres de ranchos en paralelo
      const ranchoIds = [...new Set(rows.map(r => r.rancho_id).filter(Boolean))]
      const { data: ranchos } = ranchoIds.length
        ? await supabase
            .from('ranch_extended_profiles')
            .select('id, name')
            .in('id', ranchoIds)
        : { data: [] }

      const ranchoMap = Object.fromEntries(
        (ranchos ?? []).map((r: { id: string; name: string | null }) => [r.id, r.name ?? null])
      )

      setExpedientes(rows.map(e => ({
        ...e,
        rancho_nombre: ranchoMap[e.rancho_id] ?? null,
      })))
    } catch (e) {
      setError(errMsg(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])
  return { expedientes, loading, error, refetch: fetchAll }
}

// ─── HOOK: documentos de un expediente ───────────────────────────────────────

export function useExpedienteDocumentos(expedienteId: string | null) {
  const [documentos, setDocumentos] = useState<ExpedienteDocumentoDB[]>([])
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState<string | null>(null)

  const fetchDocs = useCallback(async () => {
    if (!expedienteId) { setDocumentos([]); return }
    setLoading(true)
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from('expediente_documentos')
        .select('*')
        .eq('expediente_id', expedienteId)
        .order('created_at', { ascending: false })
      if (err) throw err
      setDocumentos(data ?? [])
    } catch (e) {
      setError(errMsg(e))
    } finally {
      setLoading(false)
    }
  }, [expedienteId])

  useEffect(() => { fetchDocs() }, [fetchDocs])
  return { documentos, loading, error, refetch: fetchDocs }
}

// ─── HOOK: notas de un expediente ────────────────────────────────────────────

export function useExpedienteNotas(expedienteId: string | null) {
  const [notas,   setNotas]   = useState<ExpedienteNotaDB[]>([])
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  const fetchNotas = useCallback(async () => {
    if (!expedienteId) { setNotas([]); return }
    setLoading(true)
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from('expediente_notas')
        .select(`*, user_profiles(personal_data)`)
        .eq('expediente_id', expedienteId)
        .order('created_at', { ascending: true })
      if (err) throw err

      const mapped = (data ?? []).map((n: ExpedienteNotaDB & {
        user_profiles?: { personal_data: Record<string, string> | null } | null
      }) => ({
        ...n,
        autor_nombre: n.user_profiles?.personal_data?.fullName
                    ?? n.user_profiles?.personal_data?.nombre ?? null,
      })) as ExpedienteNotaDB[]

      setNotas(mapped)
    } catch (e) {
      setError(errMsg(e))
    } finally {
      setLoading(false)
    }
  }, [expedienteId])

  useEffect(() => { fetchNotas() }, [fetchNotas])
  return { notas, loading, error, refetch: fetchNotas }
}

// ─── ACCIÓN: crear expediente ─────────────────────────────────────────────────

export async function crearExpediente(params: {
  ranchoId:     string
  userId:       string
  tipoTramite:  TipoTramite
  titulo:       string
  descripcion?: string
}): Promise<{ expediente: ExpedienteDB | null; error: string | null }> {
  try {
    const { data, error: err } = await supabase
      .from('expedientes')
      .insert({
        rancho_id:    params.ranchoId,
        user_id:      params.userId,
        tipo_tramite: params.tipoTramite,
        titulo:       params.titulo,
        descripcion:  params.descripcion ?? null,
        estado:       'borrador',
      })
      .select()
      .single()
    if (err) throw err
    return { expediente: data, error: null }
  } catch (e) {
    return { expediente: null, error: errMsg(e) }
  }
}

// ─── ACCIÓN: subir documento a expediente ────────────────────────────────────

export async function subirDocExpediente(params: {
  file:          File
  expedienteId:  string
  ranchoId:      string
  userId:        string
  tipo:          TipoDocExpediente
  descripcion?:  string
  emisor?:       string
  fechaDoc?:     string
}): Promise<{ doc: ExpedienteDocumentoDB | null; error: string | null }> {
  const { file, expedienteId, ranchoId, userId, tipo, descripcion, emisor, fechaDoc } = params
  try {
    const ext         = file.name.split('.').pop() ?? 'bin'
    const storagePath = `expedientes/${ranchoId}/${expedienteId}/${crypto.randomUUID()}.${ext}`

    const { error: uploadErr } = await supabase.storage
      .from('expediente-documentos')
      .upload(storagePath, file, { contentType: file.type, upsert: false })
    if (uploadErr) throw uploadErr

    const buffer  = await file.arrayBuffer()
    const hashBuf = await crypto.subtle.digest('SHA-256', buffer)
    const hashHex = Array.from(new Uint8Array(hashBuf))
      .map(b => b.toString(16).padStart(2, '0')).join('')

    const { data, error: insertErr } = await supabase
      .from('expediente_documentos')
      .insert({
        expediente_id:   expedienteId,
        rancho_id:       ranchoId,
        subido_por:      userId,
        tipo,
        nombre:          file.name,
        storage_path:    storagePath,
        mime_type:       file.type,
        tamano_bytes:    file.size,
        descripcion:     descripcion ?? null,
        emisor:          emisor ?? null,
        fecha_documento: fechaDoc ?? null,
        hash_sha256:     hashHex,
      })
      .select()
      .single()
    if (insertErr) throw insertErr

    await supabase
      .from('expedientes')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', expedienteId)

    return { doc: data, error: null }
  } catch (e) {
    return { doc: null, error: errMsg(e) }
  }
}

// ─── ACCIÓN: URL firmada ──────────────────────────────────────────────────────

export async function getDocExpedienteUrl(storagePath: string): Promise<string | null> {
  const { data } = await supabase.storage
    .from('expediente-documentos')
    .createSignedUrl(storagePath, 3600)
  return data?.signedUrl ?? null
}

// ─── ACCIÓN: actualizar estado ────────────────────────────────────────────────

export async function actualizarEstadoExpediente(
  expedienteId: string,
  estado: EstadoExpediente
): Promise<{ error: string | null }> {
  try {
    const { error: err } = await supabase
      .from('expedientes')
      .update({ estado, updated_at: new Date().toISOString() })
      .eq('id', expedienteId)
    if (err) throw err
    return { error: null }
  } catch (e) {
    return { error: errMsg(e) }
  }
}

// ─── ACCIÓN: agregar nota ─────────────────────────────────────────────────────

export async function agregarNota(params: {
  expedienteId: string
  autorId:      string
  tipo:         TipoNota
  contenido:    string
}): Promise<{ nota: ExpedienteNotaDB | null; error: string | null }> {
  try {
    const { data, error: err } = await supabase
      .from('expediente_notas')
      .insert({
        expediente_id: params.expedienteId,
        autor_id:      params.autorId,
        tipo:          params.tipo,
        contenido:     params.contenido,
      })
      .select()
      .single()
    if (err) throw err
    return { nota: data, error: null }
  } catch (e) {
    return { nota: null, error: errMsg(e) }
  }
}

// ─── HELPER: evaluar completitud ─────────────────────────────────────────────

export function evaluarCompletitud(
  tipoTramite: TipoTramite,
  documentos: ExpedienteDocumentoDB[]
): { porcentaje: number; faltantes: string[]; tieneObligatorios: boolean } {
  const requisitos = REQUISITOS_TRAMITE[tipoTramite]
  if (requisitos.length === 0) return { porcentaje: 100, faltantes: [], tieneObligatorios: true }

  const tiposPresentes    = new Set(documentos.map(d => d.tipo))
  const obligatorios      = requisitos.filter(r => r.obligatorio)
  const faltantes         = requisitos.filter(r => !tiposPresentes.has(r.tipo)).map(r => r.label)
  const presentes         = requisitos.filter(r => tiposPresentes.has(r.tipo)).length
  const porcentaje        = Math.round((presentes / requisitos.length) * 100)
  const tieneObligatorios = obligatorios.every(r => tiposPresentes.has(r.tipo))

  return { porcentaje, faltantes, tieneObligatorios }
}