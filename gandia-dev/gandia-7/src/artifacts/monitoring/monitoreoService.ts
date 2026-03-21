/**
 * monitoreoService.ts
 * Capa de datos Supabase para el módulo de Monitoreo Ganadero.
 * Todos los widgets consumen desde aquí — nunca Supabase directo en widgets.
 */

import { supabase } from '../../lib/supabaseClient'

// ─── TIPOS BASE ───────────────────────────────────────────────────────────────

export interface DBCorral {
  id:           string
  rancho_id:    string
  label:        string
  capacidad:    number
  animales:     number
  estado:       'normal' | 'atencion' | 'cuarentena'
  temperatura:  number | null
  humedad:      number | null
  tiene_camara: boolean
  activo:       boolean
  lat:          number | null
  lng:          number | null
}

export interface DBCamara {
  id:                string
  rancho_id:         string
  corral_id:         string | null
  label:             string
  stream_url:        string | null
  snapshot_url:      string | null
  fps_analisis:      number
  estado:            'online' | 'offline'
  alertas_activas:   boolean
  detectados:        number
  inventario:        number
  ultima_lectura_at: string | null
}

export interface DBConteo {
  id:                  string
  rancho_id:           string
  corral_id:           string
  detectados:          number
  inventario_esperado: number
  match_pct:           number
  fuente:              'manual' | 'camara' | 'rfid' | 'dron'
  registrado_por:      string | null
  notas:               string | null
  created_at:          string
}

export interface DBAnomalia {
  id:             string
  rancho_id:      string
  corral_id:      string
  animal_id:      string | null
  tipo:           string
  severidad:      'alta' | 'media' | 'baja'
  fuente:         'manual' | 'camara' | 'rfid' | 'ia'
  resuelto:       boolean
  resuelto_por:   string | null
  resuelto_at:    string | null
  evidencia_url:  string | null
  notas:          string | null
  registrado_por: string | null
  created_at:     string
}

export interface DBAnimal {
  id:               string
  siniiga:          string | null
  rfid:             string | null
  nombre:           string | null
  raza:             string | null
  sexo:             string | null
  fecha_nacimiento: string | null
  peso_kg:          number | null
  rancho_id:        string
  corral_id:        string | null
  estatus:          string | null
}

export interface MonitoreoResumen {
  rancho_id:        string
  rancho_nombre:    string
  lat:              number | null
  lng:              number | null
  total_corrales:   number
  corrales_activos: number
  animales_total:   number
  capacidad_total:  number
  ocupacion_pct:    number
  corrales_alerta:  number
  anomalias_activas:number
  anomalias_alta:   number
  camaras_online:   number
}

// ─── RANCHO ───────────────────────────────────────────────────────────────────

export async function getRanchoPorUsuario(userId: string) {
  const { data, error } = await supabase
    .from('ranch_extended_profiles')
    .select('id, name, lat, lng, capacity_heads, active_heads, state, municipality')
    .eq('user_id', userId)
    .single()
  if (error) throw error
  return data
}

// ─── VISTA RESUMEN ────────────────────────────────────────────────────────────

export async function getResumenMonitoreo(ranchoId: string): Promise<MonitoreoResumen | null> {
  const { data, error } = await supabase
    .from('v_monitoreo_rancho')
    .select('*')
    .eq('rancho_id', ranchoId)
    .single()
  if (error) return null
  return data
}

/** Score sanitario 0-100 calculado en cliente */
export function calcularScore(resumen: MonitoreoResumen): number {
  if (!resumen) return 0
  const camarasTotal = resumen.total_corrales || 1

  const s1 = resumen.anomalias_alta   === 0 ? 40 : Math.max(0, 40 - resumen.anomalias_alta * 8)
  const s2 = resumen.corrales_alerta  === 0 ? 30 : Math.max(0, 30 - resumen.corrales_alerta * 6)
  const s3 = Math.round((resumen.camaras_online / camarasTotal) * 20)
  const s4 = resumen.animales_total > 0 ? 10 : 0

  return Math.min(100, s1 + s2 + s3 + s4)
}

// ─── CORRALES ─────────────────────────────────────────────────────────────────

export async function getCorrales(ranchoId: string): Promise<DBCorral[]> {
  const { data, error } = await supabase
    .from('corrales')
    .select('*')
    .eq('rancho_id', ranchoId)
    .eq('activo', true)
    .order('label')
  if (error) throw error
  return data ?? []
}

export async function updateCorralEstado(id: string, estado: DBCorral['estado']) {
  const { error } = await supabase
    .from('corrales')
    .update({ estado })
    .eq('id', id)
  if (error) throw error
}

// ─── CÁMARAS ──────────────────────────────────────────────────────────────────

export async function getCamaras(ranchoId: string): Promise<DBCamara[]> {
  const { data, error } = await supabase
    .from('camaras')
    .select('*')
    .eq('rancho_id', ranchoId)
    .order('label')
  if (error) throw error
  return data ?? []
}

export async function insertCamara(cam: Omit<DBCamara, 'id'>) {
  const { data, error } = await supabase
    .from('camaras')
    .insert(cam)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateCamara(id: string, updates: Partial<DBCamara>) {
  const { data, error } = await supabase
    .from('camaras')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteCamara(id: string) {
  const { error } = await supabase
    .from('camaras')
    .delete()
    .eq('id', id)
  if (error) throw error
}

// ─── CONTEOS ──────────────────────────────────────────────────────────────────

/** Último conteo por corral — para el dashboard de sensores */
export async function getUltimosConteos(ranchoId: string): Promise<DBConteo[]> {
  const { data, error } = await supabase
    .from('conteos')
    .select('*')
    .eq('rancho_id', ranchoId)
    .order('created_at', { ascending: false })
    .limit(100)
  if (error) throw error
  return data ?? []
}

export async function insertConteo(conteo: {
  rancho_id:           string
  corral_id:           string
  detectados:          number
  inventario_esperado: number
  fuente:              DBConteo['fuente']
  notas?:              string
  registrado_por?:     string
}) {
  const { data, error } = await supabase
    .from('conteos')
    .insert(conteo)
    .select()
    .single()
  if (error) throw error
  return data
}

// ─── ANOMALÍAS ────────────────────────────────────────────────────────────────

export async function getAnomalias(ranchoId: string): Promise<DBAnomalia[]> {
  const { data, error } = await supabase
    .from('anomalias_monitoreo')
    .select('*')
    .eq('rancho_id', ranchoId)
    .order('created_at', { ascending: false })
    .limit(100)
  if (error) throw error
  return data ?? []
}

export async function insertAnomalia(a: {
  rancho_id:      string
  corral_id:      string
  animal_id?:     string
  tipo:           string
  severidad:      DBAnomalia['severidad']
  fuente:         DBAnomalia['fuente']
  notas?:         string
  evidencia_url?: string
  registrado_por?: string
}) {
  const { data, error } = await supabase
    .from('anomalias_monitoreo')
    .insert(a)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function resolverAnomalia(id: string, resueltoPor: string, notas?: string) {
  const { data, error } = await supabase
    .from('anomalias_monitoreo')
    .update({ resuelto: true, resuelto_por: resueltoPor, notas: notas ?? null })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateAnomalia(id: string, updates: Partial<DBAnomalia>) {
  const { data, error } = await supabase
    .from('anomalias_monitoreo')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

/** Suscripción Realtime a anomalías del rancho */
export function subscribeAnomalias(ranchoId: string, callback: () => void) {
  return supabase
    .channel(`anomalias_${ranchoId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'anomalias_monitoreo', filter: `rancho_id=eq.${ranchoId}` },
      callback
    )
    .subscribe()
}

// ─── ANIMALES ─────────────────────────────────────────────────────────────────

export async function getAnimalesPorRancho(ranchoId: string): Promise<DBAnimal[]> {
  const { data, error } = await supabase
    .from('animales')
    .select('id, siniiga, rfid, nombre, raza, sexo, fecha_nacimiento, peso_kg, rancho_id, corral_id, estatus, biometria_status')
    .eq('rancho_id', ranchoId)
    .order('siniiga')
  if (error) throw error
  return data ?? []
}

export async function getAnimalesPorCorral(corralId: string): Promise<DBAnimal[]> {
  const { data, error } = await supabase
    .from('animales')
    .select('id, siniiga, rfid, nombre, raza, sexo, fecha_nacimiento, peso_kg, rancho_id, corral_id, estatus')
    .eq('corral_id', corralId)
    .order('siniiga')
  if (error) throw error
  return data ?? []
}

export async function asignarAnimalACorral(animalId: string, corralId: string | null) {
  const { error } = await supabase
    .from('animales')
    .update({ corral_id: corralId })
    .eq('id', animalId)
  if (error) throw error
}

// ─── MAPPERS: DB → Tipos de widgets ──────────────────────────────────────────
// Los widgets existentes usan tipos propios con id numérico.
// Estos mappers convierten sin romper los widgets.

import type { Corral }  from '../monitoring/widgets/MapaVistaGeneralWidget'
import type { Camara }  from '../monitoring/widgets/CamaraListaWidget'
import type { Anomalia } from '../monitoring/widgets/AnomaliaFeedWidget'

export function dbCorralToWidget(c: DBCorral, idx: number): Corral {
  return {
    id:        idx + 1,           // numérico para PIN_POS en mapa
    label:     c.label,
    animales:  c.animales,
    capacidad: c.capacidad,
    estado:    c.estado,
    temp:      c.temperatura ?? 22,
    humedad:   c.humedad    ?? 60,
    camara:    c.tiene_camara,
    lat:       c.lat  ?? undefined,
    lng:       c.lng  ?? undefined,
    _dbId:     c.id,              // UUID real para operaciones DB
  } as Corral & { _dbId: string }
}

export function dbCamaraToWidget(c: DBCamara, corrales: DBCorral[], idx: number): Camara {
  const corral = corrales.find(co => co.id === c.corral_id)
  return {
    id:         idx + 1,
    label:      c.label,
    corral:     corral?.label ?? '—',
    estado:     c.estado,
    detectados: c.detectados,
    inventario: c.inventario,
    fps:        c.fps_analisis,
    _dbId:      c.id,
    snapshotUrl: c.snapshot_url ?? undefined,
  } as Camara & { _dbId: string; snapshotUrl?: string }
}

export function dbAnomaliaToWidget(a: DBAnomalia, corrales: DBCorral[]): Anomalia {
  const corral = corrales.find(c => c.id === a.corral_id)
  const ts = new Date(a.created_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
  return {
    id:        a.id as unknown as number,  // widget espera número; usamos string pero funciona
    ts,
    animal:    a.animal_id ? `#${a.animal_id.slice(-4).toUpperCase()}` : '—',
    corral:    corral?.label ?? '—',
    tipo:      a.tipo,
    severidad: a.severidad === 'baja' ? 'media' : a.severidad,
    resuelto:  a.resuelto,
    _dbId:     a.id,
    notas:     a.notas ?? undefined,
  } as Anomalia & { _dbId: string; notas?: string }
}