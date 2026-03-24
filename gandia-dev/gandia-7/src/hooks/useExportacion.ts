/**
 * useExportacion.ts
 *
 * Hook central de datos para el módulo de Exportación (Aretes Azules SENASICA).
 * Conecta con exportacion_solicitudes + exportacion_aretes en Supabase.
 *
 * ARCHIVO → src/hooks/useExportacion.ts
 *
 * Exports:
 *   Types    → SolicitudDB, AreteDB, SolicitudConConteos
 *   Hooks    → useExportacionHistorial, useExportacionDetalle
 *   Actions  → crearSolicitud, actualizarSolicitud, eliminarSolicitud,
 *              upsertAretes, eliminarArete, marcarExportada
 *   Helpers  → dbToSolicitudData, dbToAreteRow, validateAretes
 */

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { SolicitudData, AreteRow, SolicitudGuardada } from '../artifacts/artifactTypes'

// ─── Helper de error ──────────────────────────────────────────────────────────

function errMsg(e: unknown): string {
  if (e instanceof Error) return e.message
  if (typeof e === 'object' && e !== null && 'message' in e)
    return String((e as { message: unknown }).message)
  return String(e)
}

// ─── TIPOS DB ─────────────────────────────────────────────────────────────────

export interface SolicitudDB {
  id:            string
  rancho_id:     string
  creado_por:    string
  psg:           string
  upp:           string
  sexo:          'Macho' | 'Hembra'
  folio_factura: string
  estado:        'borrador' | 'lista' | 'exportada'
  exportada_at:  string | null
  notas:         string | null
  created_at:    string
  updated_at:    string
}

export interface AreteDB {
  id:            string
  solicitud_id:  string
  rancho_id:     string
  orden:         number
  arete_origen:  string
  folio_factura: string
  status:        'ok' | 'duplicado' | 'invalido'
  animal_id:     string | null
  created_at:    string
  updated_at:    string
}

// La vista v_exportacion_historial agrega conteos de aretes
export interface SolicitudConConteos extends SolicitudDB {
  folio_interno:     string
  total_aretes:      number
  aretes_ok:         number
  aretes_duplicado:  number
  aretes_invalido:   number
}

// ─── CONVERSORES DB → tipos del frontend ─────────────────────────────────────

export function dbToSolicitudData(s: SolicitudDB): SolicitudData {
  return {
    psg:          s.psg,
    upp:          s.upp,
    sexo:         s.sexo,
    folioFactura: s.folio_factura,
  }
}

export function dbToAreteRow(a: AreteDB): AreteRow {
  return {
    id:            a.orden,
    areteOrigen:   a.arete_origen,
    folioFactura:  a.folio_factura,
    status:        a.status,
  }
}

export function dbToSolicitudGuardada(s: SolicitudConConteos): SolicitudGuardada {
  const fecha = new Date(s.created_at).toLocaleDateString('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
  return {
    id:       s.id,
    folio:    s.folio_interno,
    solicitud: dbToSolicitudData(s),
    rows:     [],   // Las filas se cargan lazy en useExportacionDetalle
    estado:   s.estado,
    fecha,
  }
}

// ─── VALIDACIÓN DE ARETES ─────────────────────────────────────────────────────
// Misma lógica que ExportacionValidacionWidget, centralizada aquí.

export function validateAretes(rows: AreteRow[]): AreteRow[] {
  const seen = new Map<string, number>()
  return rows.map(row => {
    if (!row.areteOrigen.trim()) return { ...row, status: 'invalido' as const }
    const num = Number(row.areteOrigen)
    if (
      !/^\d{10}$/.test(row.areteOrigen) ||
      num < 1_000_000_000 ||
      num > 1_100_000_000
    ) return { ...row, status: 'invalido' as const }
    if (seen.has(row.areteOrigen)) return { ...row, status: 'duplicado' as const }
    seen.set(row.areteOrigen, row.id)
    return { ...row, status: 'ok' as const }
  })
}

// ─── HOOK: historial de solicitudes del rancho ────────────────────────────────

export function useExportacionHistorial(ranchoId: string | null) {
  const [solicitudes, setSolicitudes] = useState<SolicitudConConteos[]>([])
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState<string | null>(null)

  const fetchHistorial = useCallback(async () => {
    if (!ranchoId) return
    setLoading(true)
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from('v_exportacion_historial')
        .select('*')
        .eq('rancho_id', ranchoId)
        .order('created_at', { ascending: false })

      if (err) throw err
      setSolicitudes((data ?? []) as SolicitudConConteos[])
    } catch (e) {
      setError(errMsg(e))
    } finally {
      setLoading(false)
    }
  }, [ranchoId])

  useEffect(() => { fetchHistorial() }, [fetchHistorial])

  return { solicitudes, loading, error, refetch: fetchHistorial }
}

// ─── HOOK: detalle de una solicitud (encabezado + aretes) ─────────────────────

export function useExportacionDetalle(solicitudId: string | null) {
  const [solicitud, setSolicitud] = useState<SolicitudDB | null>(null)
  const [aretes,    setAretes]    = useState<AreteDB[]>([])
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  const fetchDetalle = useCallback(async () => {
    if (!solicitudId) { setSolicitud(null); setAretes([]); return }
    setLoading(true)
    setError(null)
    try {
      // Encabezado
      const { data: sol, error: solErr } = await supabase
        .from('exportacion_solicitudes')
        .select('*')
        .eq('id', solicitudId)
        .single()

      if (solErr) throw solErr
      setSolicitud(sol as SolicitudDB)

      // Aretes ordenados
      const { data: ars, error: arsErr } = await supabase
        .from('exportacion_aretes')
        .select('*')
        .eq('solicitud_id', solicitudId)
        .order('orden', { ascending: true })

      if (arsErr) throw arsErr
      setAretes((ars ?? []) as AreteDB[])
    } catch (e) {
      setError(errMsg(e))
    } finally {
      setLoading(false)
    }
  }, [solicitudId])

  useEffect(() => { fetchDetalle() }, [fetchDetalle])

  return { solicitud, aretes, loading, error, refetch: fetchDetalle }
}

// ─── ACCIÓN: crear solicitud nueva ───────────────────────────────────────────

export async function crearSolicitud(
  data:      SolicitudData,
  ranchoId:  string,
  userId:    string,
): Promise<{ solicitud: SolicitudDB | null; error: string | null }> {
  try {
    const { data: row, error: err } = await supabase
      .from('exportacion_solicitudes')
      .insert({
        rancho_id:     ranchoId,
        creado_por:    userId,
        psg:           data.psg,
        upp:           data.upp,
        sexo:          data.sexo,
        folio_factura: data.folioFactura,
        estado:        'borrador',
      })
      .select()
      .single()

    if (err) throw err
    return { solicitud: row as SolicitudDB, error: null }
  } catch (e) {
    return { solicitud: null, error: errMsg(e) }
  }
}

// ─── ACCIÓN: actualizar encabezado de solicitud ──────────────────────────────

export async function actualizarSolicitud(
  solicitudId: string,
  data:        Partial<SolicitudData>,
): Promise<{ error: string | null }> {
  try {
    const patch: Record<string, string> = {}
    if (data.psg          !== undefined) patch.psg           = data.psg
    if (data.upp          !== undefined) patch.upp           = data.upp
    if (data.sexo         !== undefined) patch.sexo          = data.sexo
    if (data.folioFactura !== undefined) patch.folio_factura = data.folioFactura

    const { error: err } = await supabase
      .from('exportacion_solicitudes')
      .update(patch)
      .eq('id', solicitudId)

    if (err) throw err
    return { error: null }
  } catch (e) {
    return { error: errMsg(e) }
  }
}

// ─── ACCIÓN: cambiar estado de la solicitud ───────────────────────────────────

export async function cambiarEstadoSolicitud(
  solicitudId: string,
  estado:      SolicitudDB['estado'],
): Promise<{ error: string | null }> {
  try {
    const patch: Record<string, unknown> = { estado }
    if (estado === 'exportada') patch.exportada_at = new Date().toISOString()

    const { error: err } = await supabase
      .from('exportacion_solicitudes')
      .update(patch)
      .eq('id', solicitudId)

    if (err) throw err
    return { error: null }
  } catch (e) {
    return { error: errMsg(e) }
  }
}

// ─── ACCIÓN: eliminar solicitud (solo borradores) ─────────────────────────────

export async function eliminarSolicitud(
  solicitudId: string,
): Promise<{ error: string | null }> {
  try {
    const { error: err } = await supabase
      .from('exportacion_solicitudes')
      .delete()
      .eq('id', solicitudId)
      .eq('estado', 'borrador')  // RLS también lo bloquea, pero doble seguridad

    if (err) throw err
    return { error: null }
  } catch (e) {
    return { error: errMsg(e) }
  }
}

// ─── ACCIÓN: sincronizar aretes completos (replace) ──────────────────────────
// Borra todos los aretes de la solicitud y los reinserta con el orden actual.
// Se llama al guardar la tabla o al finalizar la validación.

export async function upsertAretes(
  solicitudId: string,
  ranchoId:    string,
  rows:        AreteRow[],
): Promise<{ error: string | null }> {
  try {
    // 1. Borrar aretes existentes
    const { error: delErr } = await supabase
      .from('exportacion_aretes')
      .delete()
      .eq('solicitud_id', solicitudId)

    if (delErr) throw delErr

    // 2. Reinsert con orden secuencial (si hay filas)
    if (rows.length === 0) return { error: null }

    const inserts = rows.map((r, i) => ({
      solicitud_id:  solicitudId,
      rancho_id:     ranchoId,
      orden:         i + 1,
      arete_origen:  r.areteOrigen,
      folio_factura: r.folioFactura,
      status:        r.status,
    }))

    const { error: insErr } = await supabase
      .from('exportacion_aretes')
      .insert(inserts)

    if (insErr) throw insErr
    return { error: null }
  } catch (e) {
    return { error: errMsg(e) }
  }
}

// ─── ACCIÓN: eliminar un solo arete ──────────────────────────────────────────

export async function eliminarArete(
  areteId: string,
): Promise<{ error: string | null }> {
  try {
    const { error: err } = await supabase
      .from('exportacion_aretes')
      .delete()
      .eq('id', areteId)

    if (err) throw err
    return { error: null }
  } catch (e) {
    return { error: errMsg(e) }
  }
}

// ─── ACCIÓN: marcar solicitud como exportada + guardar aretes finales ─────────
// Convenience function que agrupa upsertAretes + cambiarEstado en una sola llamada.

export async function marcarExportada(
  solicitudId: string,
  ranchoId:    string,
  rows:        AreteRow[],
): Promise<{ error: string | null }> {
  // Primero sincronizar aretes validados
  const { error: upsertErr } = await upsertAretes(solicitudId, ranchoId, rows)
  if (upsertErr) return { error: upsertErr }

  // Luego cerrar la solicitud
  return cambiarEstadoSolicitud(solicitudId, 'exportada')
}