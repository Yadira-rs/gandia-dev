/**
 * GANDIA 7 — tramitesService.ts
 * Capa de datos real para el módulo Trámites.
 * Mapea las tablas: entidades, estados, eventos, evidencias, decisiones
 */

import { supabase } from '../lib/supabaseClient'

// ─── TIPOS SUPABASE ───────────────────────────────────────────────────────────

export interface Entidad {
  id: number
  nombre: string | null
  tipo: string | null            // 'municipio' | 'tramite'
  created_at: string
}

export interface Estado {
  id: number
  entidad_id: number | null
  nombre: string | null          // 'en_revision' | 'con_observaciones' | 'documentacion_completa'
  es_final: boolean | null
  created_at: string
}

export interface Evento {
  id: number
  entidad_id: number | null
  estado_id: number | null
  tipo: string | null            // 'ingreso' | 'documento' | 'revision' | 'estado' | 'alerta'
  descripcion: string | null
  ejecutado_por: string | null
  created_at: string
  estado?: Estado                // join
}

export interface Evidencia {
  id: number
  evento_id: number | null
  archivo_url: string | null
  tipo: string | null
  hash: string | null
  created_at: string
}

export interface Decision {
  id: number
  evento_id: number | null
  resultado: string | null       // nuevo estatus tras la decisión
  origen: string | null          // 'revisor' | 'sistema'
  created_at: string
}

// ─── TIPOS DE DOMINIO (UI) ────────────────────────────────────────────────────

export type TramiteTipo    = 'exportacion' | 'movilizacion' | 'regularizacion'
export type TramiteEstatus = 'en_revision' | 'con_observaciones' | 'documentacion_completa'

export interface MunicipioResumen {
  id: string           // entidad.id como string
  nombre: string
  tramitesActivos: number
  conObservaciones: number
  completos: number
  sinRevisar: number
}

export interface TramiteUI {
  id: string
  municipioId: string
  upp: string
  tipo: TramiteTipo
  numAnimales: number
  estatus: TramiteEstatus
  fechaIngreso: string
  productor: string
  checklistPct: number
  // ids internos para updates
  _entidadId: number
  _estadoActivoId: number | null
}

export interface EvidenciaUI {
  id: string
  nombre: string
  tipo: string
  fechaCarga: string
  cargadoPor: string
  estado: 'vigente' | 'presente' | 'ilegible' | 'incompleto' | 'no_vigente'
  archivoUrl: string | null
}

export interface EventoUI {
  id: string
  fecha: string
  tipo: 'ingreso' | 'documento' | 'revision' | 'estado' | 'alerta'
  descripcion: string
  actor: string
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function parseMeta(nombre: string | null): {
  upp: string; tipo: TramiteTipo; municipioId: string; numAnimales: number; productor: string
} {
  // nombre guardado como JSON string: '{"upp":"UPP-DGO-2024-001","tipo":"exportacion",...}'
  try {
    if (nombre) {
      const p = JSON.parse(nombre)
      return {
        upp:         p.upp         ?? nombre,
        tipo:        p.tipo        ?? 'exportacion',
        municipioId: String(p.municipioId ?? 0),
        numAnimales: p.numAnimales ?? 0,
        productor:   p.productor   ?? '',
      }
    }
  } catch { /* nombre plano, no JSON */ }
  return { upp: nombre ?? '', tipo: 'exportacion', municipioId: '0', numAnimales: 0, productor: '' }
}

function resolveEstatus(estados: Estado[]): TramiteEstatus {
  // el estado más reciente (mayor id) determina el estatus actual
  if (!estados.length) return 'en_revision'
  const last = [...estados].sort((a, b) => b.id - a.id)[0]
  const n = last.nombre ?? ''
  if (n === 'con_observaciones' || n === 'documentacion_completa') return n as TramiteEstatus
  return 'en_revision'
}

function checklistPctFromEventos(eventos: Evento[]): number {
  // % de checklist = porcentaje de eventos tipo 'revision' marcados como ok
  const revs = eventos.filter(e => e.tipo === 'revision')
  if (!revs.length) return 0
  const ok = revs.filter(e => e.descripcion?.startsWith('[OK]')).length
  return Math.round((ok / revs.length) * 100)
}

// ─── MUNICIPIOS ───────────────────────────────────────────────────────────────

/**
 * Trae todos los municipios (entidades tipo='municipio') con conteo de trámites.
 * Si no existe la distinción por tipo, trae todas las entidades raíz.
 */
export async function getMunicipios(): Promise<MunicipioResumen[]> {
  // 1. Entidades que funcionan como municipios
  const { data: munis, error: eM } = await supabase
    .from('entidades')
    .select('id, nombre, tipo')
    .or('tipo.eq.municipio,tipo.is.null')
    .order('nombre')

  if (eM || !munis) throw eM ?? new Error('Sin datos de municipios')

  // 2. Trámites (entidades tipo='tramite') con su estado actual
  const { data: tramites, error: eT } = await supabase
    .from('entidades')
    .select(`
      id, nombre, tipo,
      estados ( id, nombre, es_final, entidad_id )
    `)
    .eq('tipo', 'tramite')

  if (eT) throw eT

  // Mapear municipio → trámites
  return munis.map(m => {
    const tramitesDeMuni = (tramites ?? []).filter(t => {
      try { return JSON.parse(t.nombre ?? '').municipioId === String(m.id) } catch { return false }
    })
    const estatusDe = (t: typeof tramitesDeMuni[0]): TramiteEstatus =>
      resolveEstatus((t.estados ?? []) as Estado[])

    const activos          = tramitesDeMuni.length
    const conObs           = tramitesDeMuni.filter(t => estatusDe(t) === 'con_observaciones').length
    const completos        = tramitesDeMuni.filter(t => estatusDe(t) === 'documentacion_completa').length
    const sinRevisar       = tramitesDeMuni.filter(t => {
      const evCount = 0  // sin eventos de revisión
      return evCount === 0 && estatusDe(t) === 'en_revision'
    }).length

    return {
      id:               String(m.id),
      nombre:           m.nombre ?? `Municipio ${m.id}`,
      tramitesActivos:  activos,
      conObservaciones: conObs,
      completos,
      sinRevisar,
    }
  })
}

// ─── TRÁMITES POR MUNICIPIO ───────────────────────────────────────────────────

export async function getTramitesByMunicipio(municipioId: string): Promise<TramiteUI[]> {
  const { data, error } = await supabase
    .from('entidades')
    .select(`
      id, nombre, tipo,
      estados ( id, nombre, es_final, entidad_id, created_at )
    `)
    .eq('tipo', 'tramite')

  if (error) throw error
  if (!data) return []

  return data
    .filter(e => {
      try { return JSON.parse(e.nombre ?? '').municipioId === municipioId } catch { return false }
    })
    .map(e => {
      const meta    = parseMeta(e.nombre)
      const estados = (e.estados ?? []) as Estado[]
      const estatus = resolveEstatus(estados)
      const lastEst = [...estados].sort((a, b) => b.id - a.id)[0]

      return {
        id:            String(e.id),
        municipioId,
        upp:           meta.upp,
        tipo:          meta.tipo,
        numAnimales:   meta.numAnimales,
        estatus,
        fechaIngreso:  e.estados?.[0]?.created_at?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
        productor:     meta.productor,
        checklistPct:  0,           // se calcula al abrir el expediente
        _entidadId:    e.id,
        _estadoActivoId: lastEst?.id ?? null,
      }
    })
}

// ─── DETALLE DE EXPEDIENTE ────────────────────────────────────────────────────

export interface ExpedienteDetalle {
  tramite: TramiteUI
  eventos: EventoUI[]
  evidencias: EvidenciaUI[]
  decisiones: Decision[]
}

export async function getExpediente(tramiteId: string): Promise<ExpedienteDetalle> {
  const eid = parseInt(tramiteId)

  // Entidad + estados
  const { data: entidad, error: eE } = await supabase
    .from('entidades')
    .select(`id, nombre, tipo, estados ( id, nombre, es_final, created_at )`)
    .eq('id', eid)
    .single()

  if (eE || !entidad) throw eE ?? new Error('Trámite no encontrado')

  // Eventos de esta entidad
  const { data: eventosRaw, error: eEv } = await supabase
    .from('eventos')
    .select(`id, tipo, descripcion, ejecutado_por, created_at, estado_id, estados(id,nombre)`)
    .eq('entidad_id', eid)
    .order('created_at', { ascending: true })

  if (eEv) throw eEv

  // Evidencias de todos los eventos
  const eventoIds = (eventosRaw ?? []).map(e => e.id)
  const { data: evidenciasRaw } = await supabase
    .from('evidencias')
    .select('*')
    .in('evento_id', eventoIds.length ? eventoIds : [-1])

  // Decisiones
  const { data: decisionesRaw } = await supabase
    .from('decisiones')
    .select('*')
    .in('evento_id', eventoIds.length ? eventoIds : [-1])
    .order('created_at', { ascending: false })

  const estados   = (entidad.estados ?? []) as Estado[]
  const estatus   = resolveEstatus(estados)
  const lastEst   = [...estados].sort((a, b) => b.id - a.id)[0]
  const meta      = parseMeta(entidad.nombre)
  const allEvents = (eventosRaw ?? []) as unknown as (Evento & { estados?: Estado })[]

  const tramite: TramiteUI = {
    id:             tramiteId,
    municipioId:    meta.municipioId,
    upp:            meta.upp,
    tipo:           meta.tipo,
    numAnimales:    meta.numAnimales,
    estatus,
    fechaIngreso:   estados[0]?.created_at?.slice(0, 10) ?? '',
    productor:      meta.productor,
    checklistPct:   checklistPctFromEventos(allEvents),
    _entidadId:     entidad.id,
    _estadoActivoId: lastEst?.id ?? null,
  }

  const eventos: EventoUI[] = allEvents.map(e => ({
    id:          String(e.id),
    fecha:       new Date(e.created_at).toLocaleString('es-MX'),
    tipo:        (e.tipo as EventoUI['tipo']) ?? 'revision',
    descripcion: e.descripcion ?? '',
    actor:       e.ejecutado_por ?? 'Sistema',
  }))

  const evidencias: EvidenciaUI[] = (evidenciasRaw ?? []).map(ev => ({
    id:         String(ev.id),
    nombre:     ev.tipo ?? `Archivo ${ev.id}`,
    tipo:       ev.tipo ?? 'evidencia',
    fechaCarga: new Date(ev.created_at).toLocaleString('es-MX'),
    cargadoPor: 'Productor',
    estado:     ev.hash ? 'vigente' : 'presente',
    archivoUrl: ev.archivo_url ?? null,
  }))

  return {
    tramite,
    eventos,
    evidencias,
    decisiones: (decisionesRaw ?? []) as Decision[],
  }
}

// ─── CREAR TRÁMITE ────────────────────────────────────────────────────────────

export interface NuevoTramitePayload {
  upp: string
  tipo: TramiteTipo
  numAnimales: number
  productor: string
  municipioId: string
  userId: string
}

export async function crearTramite(payload: NuevoTramitePayload): Promise<string> {
  // 1. Entidad
  const nombre = JSON.stringify({
    upp:         payload.upp,
    tipo:        payload.tipo,
    numAnimales: payload.numAnimales,
    productor:   payload.productor,
    municipioId: payload.municipioId,
  })

  const { data: entidad, error: eEnt } = await supabase
    .from('entidades')
    .insert({ nombre, tipo: 'tramite' })
    .select('id')
    .single()

  if (eEnt || !entidad) throw eEnt ?? new Error('No se pudo crear el trámite')

  // 2. Estado inicial
  const { data: estado, error: eEst } = await supabase
    .from('estados')
    .insert({ entidad_id: entidad.id, nombre: 'en_revision', es_final: false })
    .select('id')
    .single()

  if (eEst) throw eEst

  // 3. Evento de ingreso
  await supabase.from('eventos').insert({
    entidad_id:    entidad.id,
    estado_id:     estado?.id ?? null,
    tipo:          'ingreso',
    descripcion:   `Expediente ${payload.upp} ingresado al sistema`,
    ejecutado_por: payload.userId,
  })

  return String(entidad.id)
}

// ─── CAMBIAR ESTATUS ─────────────────────────────────────────────────────────

export async function cambiarEstatus(
  tramite: TramiteUI,
  nuevoEstatus: TramiteEstatus,
  observacion: string,
  userId: string,
): Promise<void> {
  // 1. Nuevo estado en la tabla estados
  const esFinal = nuevoEstatus === 'documentacion_completa'
  const { data: estado, error: eEst } = await supabase
    .from('estados')
    .insert({ entidad_id: tramite._entidadId, nombre: nuevoEstatus, es_final: esFinal })
    .select('id')
    .single()

  if (eEst) throw eEst

  // 2. Evento de cambio de estado
  const { data: evento, error: eEv } = await supabase
    .from('eventos')
    .insert({
      entidad_id:    tramite._entidadId,
      estado_id:     estado?.id ?? null,
      tipo:          'estado',
      descripcion:   observacion || `Estado cambiado a ${nuevoEstatus}`,
      ejecutado_por: userId,
    })
    .select('id')
    .single()

  if (eEv) throw eEv

  // 3. Decisión registrada
  await supabase.from('decisiones').insert({
    evento_id: evento?.id ?? null,
    resultado: nuevoEstatus,
    origen:    'revisor',
  })
}

// ─── GUARDAR REVISIÓN (observaciones + checklist) ─────────────────────────────

export async function guardarRevision(
  tramite: TramiteUI,
  observacion: string,
  checklistCompletados: number,
  checklistTotal: number,
  userId: string,
): Promise<void> {
  const desc = `[REVISION] ${checklistCompletados}/${checklistTotal} ítems | ${observacion || 'Sin observaciones adicionales'}`

  await supabase.from('eventos').insert({
    entidad_id:    tramite._entidadId,
    estado_id:     tramite._estadoActivoId,
    tipo:          'revision',
    descripcion:   desc,
    ejecutado_por: userId,
  })
}

// ─── AGREGAR EVIDENCIA ────────────────────────────────────────────────────────

export async function agregarEvidencia(
  tramite: TramiteUI,
  archivoUrl: string,
  tipo: string,
  userId: string,
): Promise<void> {
  // Evento de tipo documento
  const { data: evento, error: eEv } = await supabase
    .from('eventos')
    .insert({
      entidad_id:    tramite._entidadId,
      estado_id:     tramite._estadoActivoId,
      tipo:          'documento',
      descripcion:   `Evidencia cargada: ${tipo}`,
      ejecutado_por: userId,
    })
    .select('id')
    .single()

  if (eEv) throw eEv

  await supabase.from('evidencias').insert({
    evento_id:   evento?.id ?? null,
    archivo_url: archivoUrl,
    tipo,
    hash:        null,
  })
}

// ─── ASEGURAR MUNICIPIOS SEED ─────────────────────────────────────────────────
// Si la base está vacía, inserta los municipios de Durango como entidades

const MUNICIPIOS_DURANGO = [
  'Guadalupe Victoria','Durango','Pueblo Nuevo','Gómez Palacio',
  'Santiago Papasquiaro','Mezquital','Lerdo','Nombre de Dios','Poanas','San Dimas',
]

export async function seedMunicipiosIfEmpty(): Promise<void> {
  const { count } = await supabase
    .from('entidades')
    .select('*', { count: 'exact', head: true })
    .eq('tipo', 'municipio')

  if ((count ?? 0) > 0) return  // ya hay datos

  await supabase.from('entidades').insert(
    MUNICIPIOS_DURANGO.map(nombre => ({ nombre, tipo: 'municipio' }))
  )
}