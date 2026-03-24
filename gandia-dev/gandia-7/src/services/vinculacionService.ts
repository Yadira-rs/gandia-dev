/**
 * vinculacionService.ts
 * Operaciones CRUD para la tabla `vinculaciones` en Supabase.
 * Todas las funciones son puras (sin hooks) — el hook useVinculaciones.ts las consume.
 */

import { supabase } from '../lib/supabaseClient'
import type { VinculacionTipo } from '../artifacts/artifactTypes'

// ─── TIPOS DB ─────────────────────────────────────────────────────────────────

export interface VinculacionDB {
  id:             string
  solicitante_id: string
  receptor_id:    string
  tipo:           VinculacionTipo
  estado:         'pendiente' | 'activa' | 'rechazada' | 'revocada' | 'expirada'
  mensaje:        string | null
  created_at:     string
  aceptada_at:    string | null
  expira_at:      string | null
  revocada_por:   string | null
  motivo_fin:     string | null
  // campos enriquecidos (join con user_profiles)
  solicitante_nombre?: string
  receptor_nombre?:    string
  solicitante_role?:   string
  receptor_role?:      string
}

export interface EntidadBuscable {
  user_id:    string
  nombre:     string
  role:       string
  email?:     string
}

// ─── HELPER ───────────────────────────────────────────────────────────────────

function errMsg(e: unknown): string {
  if (e instanceof Error) return e.message
  if (typeof e === 'object' && e !== null && 'message' in e) return String((e as { message: unknown }).message)
  return String(e)
}

function formatFecha(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

function calcExpira(expira_at: string | null): string | null {
  if (!expira_at) return null
  const d = new Date(expira_at)
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ─── FETCH PRINCIPAL ──────────────────────────────────────────────────────────

/**
 * Carga todas las vinculaciones del usuario:
 * - activas: estado = 'activa'
 * - pendientes: estado = 'pendiente'
 * - historial: estado IN ('rechazada', 'revocada', 'expirada')
 *
 * Enriquece los datos con el nombre de la entidad relacionada
 * consultando user_profiles.
 */
export async function fetchVinculaciones(userId: string): Promise<{
  activas:    import('../artifacts/artifactTypes').Vinculacion[]
  pendientes: import('../artifacts/artifactTypes').VinculacionPendiente[]
  historial:  import('../artifacts/artifactTypes').VinculacionHistorial[]
  error:      string | null
}> {
  try {
    // 1. Traer todas las vinculaciones donde participa el usuario
    const { data: rows, error: fetchErr } = await supabase
      .from('vinculaciones')
      .select('*')
      .or(`solicitante_id.eq.${userId},receptor_id.eq.${userId}`)
      .order('created_at', { ascending: false })

    if (fetchErr) throw fetchErr
    if (!rows || rows.length === 0) {
      return { activas: [], pendientes: [], historial: [], error: null }
    }

    // 2. Recopilar todos los user_ids únicos de la otra parte
    const otherIds = [...new Set(
      rows.map((r: VinculacionDB) => r.solicitante_id === userId ? r.receptor_id : r.solicitante_id)
    )]

    // 3. Obtener nombres de los perfiles
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('user_id, personal_data, role')
      .in('user_id', otherIds)

    const profileMap = new Map<string, { nombre: string; role: string }>()
    for (const p of profiles ?? []) {
      const nombre = p.personal_data?.full_name ?? p.personal_data?.nombre ?? 'Usuario'
      profileMap.set(p.user_id, { nombre, role: p.role ?? 'usuario' })
    }

    // 4. Clasificar y mapear
    const activas:    import('../artifacts/artifactTypes').Vinculacion[]         = []
    const pendientes: import('../artifacts/artifactTypes').VinculacionPendiente[] = []
    const historial:  import('../artifacts/artifactTypes').VinculacionHistorial[] = []

    for (const row of rows as VinculacionDB[]) {
      const otherId = row.solicitante_id === userId ? row.receptor_id : row.solicitante_id
      const other   = profileMap.get(otherId) ?? { nombre: 'Entidad desconocida', role: '—' }
      const esEnviada = row.solicitante_id === userId

      if (row.estado === 'activa') {
        activas.push({
          id:         row.id,
          entidad:    other.nombre,
          entidad_id: otherId,
          tipo:       row.tipo,
          estado:     'activa',
          fecha:      formatFecha(row.aceptada_at ?? row.created_at),
          expira:     calcExpira(row.expira_at),
        })
      } else if (row.estado === 'pendiente') {
        pendientes.push({
          id:         row.id,
          entidad:    other.nombre,
          entidad_id: otherId,
          tipo:       row.tipo,
          direccion:  esEnviada ? 'enviada' : 'recibida',
          fecha:      formatFecha(row.created_at),
          mensaje:    row.mensaje,
        })
      } else {
        // rechazada | revocada | expirada
        historial.push({
          id:          row.id,
          entidad:     other.nombre,
          entidad_id:  otherId,
          tipo:        row.tipo,
          estado:      row.estado,
          fechaInicio: row.aceptada_at ? formatFecha(row.aceptada_at) : '—',
          fechaFin:    formatFecha(row.created_at), // updated implícitamente cuando cambia estado
          motivo:      row.motivo_fin ?? '—',
        })
      }
    }

    return { activas, pendientes, historial, error: null }
  } catch (e) {
    return { activas: [], pendientes: [], historial: [], error: errMsg(e) }
  }
}

// ─── BUSCAR ENTIDADES ─────────────────────────────────────────────────────────

/**
 * Busca usuarios en user_profiles por texto.
 * Excluye al propio usuario.
 * Busca en los campos de `personal_data` e `institutional_data`.
 */
export async function buscarEntidades(
  query:        string,
  excludeUserId: string
): Promise<EntidadBuscable[]> {
  if (!query || query.length < 2) return []

  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('user_id, role, personal_data, institutional_data')
      .neq('user_id', excludeUserId)
      .limit(500)

    if (error) throw error

    const qLower = query.toLowerCase()
    const resultados: EntidadBuscable[] = []

    for (const p of data ?? []) {
      const pData = (p.personal_data || {}) as any
      const iData = (p.institutional_data || {}) as any

      // 1. Verificamos coincidencia profunda (en cualquier valor del JSON)
      const allText = JSON.stringify({ ...pData, ...iData }).toLowerCase()
      
      if (allText.includes(qLower)) {
        // 2. Intentamos extraer el mejor nombre posible para mostrar
        let nombre = 
          iData.razon_social || 
          iData.nombre_institucion || 
          iData.nombre_empresa ||
          pData.fullName || 
          pData.full_name || 
          (pData.nombre && pData.apellidos ? `${pData.nombre} ${pData.apellidos}` : '') ||
          pData.nombre ||
          'Entidad sin nombre'

        resultados.push({
          user_id: p.user_id,
          nombre,
          role:  p.role ?? 'usuario',
          email: pData.email || undefined,
        })
      }
      
      if (resultados.length >= 10) break
    }

    return resultados
  } catch (err) {
    return []
  }
}

// ─── ENVIAR SOLICITUD ─────────────────────────────────────────────────────────

export async function enviarSolicitud(params: {
  solicitanteId: string
  receptorId:    string
  tipo:          VinculacionTipo
  mensaje:       string
  expiraDias?:   number   // solo para auditoría
}): Promise<{ error: string | null }> {
  try {
    const expira_at = params.expiraDias
      ? new Date(Date.now() + params.expiraDias * 86_400_000).toISOString()
      : null

    const { error } = await supabase
      .from('vinculaciones')
      .insert({
        solicitante_id: params.solicitanteId,
        receptor_id:    params.receptorId,
        tipo:           params.tipo,
        mensaje:        params.mensaje || null,
        estado:         'pendiente',
        expira_at,
      })

    if (error) throw error
    return { error: null }
  } catch (e) {
    return { error: errMsg(e) }
  }
}

// ─── ACEPTAR ─────────────────────────────────────────────────────────────────

export async function aceptarVinculacion(id: string): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase
      .from('vinculaciones')
      .update({ estado: 'activa', aceptada_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error
    return { error: null }
  } catch (e) {
    return { error: errMsg(e) }
  }
}

// ─── RECHAZAR ────────────────────────────────────────────────────────────────

export async function rechazarVinculacion(id: string): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase
      .from('vinculaciones')
      .update({ estado: 'rechazada', motivo_fin: 'Solicitud rechazada' })
      .eq('id', id)

    if (error) throw error
    return { error: null }
  } catch (e) {
    return { error: errMsg(e) }
  }
}

// ─── REVOCAR ─────────────────────────────────────────────────────────────────

export async function revocarVinculacion(
  id:     string,
  userId: string
): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase
      .from('vinculaciones')
      .update({
        estado:      'revocada',
        revocada_por: userId,
        motivo_fin:  'Revocado por el usuario',
      })
      .eq('id', id)

    if (error) throw error
    return { error: null }
  } catch (e) {
    return { error: errMsg(e) }
  }
}

// ─── EXPIRAR AUTOMÁTICO ───────────────────────────────────────────────────────

/**
 * Marca como 'expiradas' las vinculaciones activas cuya expira_at ya pasó.
 * Se llama al montar el hook (fire-and-forget).
 */
export async function expirarVencidas(): Promise<void> {
  try {
    await supabase
      .from('vinculaciones')
      .update({ estado: 'expirada', motivo_fin: 'Vencimiento automático' })
      .eq('estado', 'activa')
      .lt('expira_at', new Date().toISOString())
  } catch {
    // silencioso — no crítico
  }
}
