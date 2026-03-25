/**
 * GANDIA · TWINS — Hooks de datos
 * ARCHIVO → src/hooks/useTwinsData.ts
 *
 * FIXES v4:
 * - formatFecha / formatSemana: guard para fechas nulas o inválidas → "—"
 * - useTwinsAlimentacion: siniiga como dep principal del refetch; pesos
 *   se leen desde los parámetros dentro del callback sin causar loops
 * - useTwinsAlimentacion recibe y pasa pesoNacimiento al widget
 * - deps redondeadas para evitar re-fetches innecesarios
 */

import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase }                          from '../lib/supabaseClient'

import type { AnimalListItem }    from '../artifacts/twins/widgets/TwinsPerfilesWidget'
import type { RegistroPeso }      from '../artifacts/twins/widgets/TwinsPesoWidget'
import type { EventoTimeline }    from '../artifacts/twins/widgets/TwinsTimelineWidget'
import type { DatosAlimentacion } from '../artifacts/twins/widgets/TwinsAlimentacionWidget'
import type { Auditoria }         from '../artifacts/twins/widgets/TwinsFeedWidget'

function calcEdadMeses(fechaNacimiento: string): number {
  const hoy = new Date()
  const nac = new Date(fechaNacimiento + 'T00:00:00')
  return Math.max(0,
    (hoy.getFullYear() - nac.getFullYear()) * 12 + (hoy.getMonth() - nac.getMonth())
  )
}

function formatFecha(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso + 'T00:00:00')
  if (isNaN(d.getTime())) return '—'
  const meses = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC']
  return `${String(d.getDate()).padStart(2,'0')} ${meses[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`
}

function formatSemana(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso + 'T00:00:00')
  if (isNaN(d.getTime())) return '—'
  const meses = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC']
  return `${String(d.getDate()).padStart(2,'0')} ${meses[d.getMonth()]}`
}

// ── 1. useTwinsAnimales ───────────────────────────────────────────────────────

export function useTwinsAnimales(ranchoId: string | null) {
  const [animales, setAnimales] = useState<AnimalListItem[]>([])
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  const fetch = useCallback(async () => {
    if (!ranchoId) return
    setLoading(true); setError(null)
    const { data, error: err } = await supabase
      .from('animales')
      .select('*')
      .eq('rancho_id', ranchoId)
      .neq('estatus', 'baja')
      .order('created_at', { ascending: false })
    if (err) { setError(err.message); setLoading(false); return }

    type EstadoWidget = 'engorda' | 'cría' | 'reproducción' | 'cuarentena'
    const ESTATUS_MAP: Record<string, EstadoWidget> = {
      activo: 'engorda', vendido: 'engorda', exportado: 'engorda', muerto: 'cuarentena',
    }
    setAnimales((data ?? []).map(a => {
      const pesoActual     = Number(a.peso_kg         ?? 0)
      const pesoNacimiento = Number(a.peso_nacimiento  ?? 0)
      const pesoMeta       = a.peso_meta ? Number(a.peso_meta) : pesoActual > 0 ? Math.round(pesoActual * 1.4) : 500
      const gananciaDiaria = Number(a.ganancia_diaria_kg ?? 0.8)
      const corralLabel    = (a.corrales as { label?: string } | null)?.label
      return {
        perfil: {
          arete: a.siniiga, nombre: a.nombre ?? undefined,
          raza: a.raza, sexo: a.sexo === 'hembra' ? 'Hembra' : 'Macho',
          edadMeses: calcEdadMeses(a.fecha_nacimiento),
          lote: corralLabel ?? a.upp ?? '—', corral: corralLabel ?? a.upp ?? '—',
          upp: a.upp ?? '—', pesoActual, pesoNacimiento, pesoMeta, gananciaDiaria,
          estado: ESTATUS_MAP[a.estatus] ?? 'engorda', alertas: 0,
        },
        pesos: [],
      }
    }))
    setLoading(false)
  }, [ranchoId])

  useEffect(() => { void fetch() }, [fetch])
  return { animales, loading, error, refetch: fetch }
}

// ── 2. useTwinsPesos ──────────────────────────────────────────────────────────

export function useTwinsPesos(siniiga: string | null) {
  const [registros, setRegistros] = useState<RegistroPeso[]>([])
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  const fetch = useCallback(async () => {
    if (!siniiga) { setRegistros([]); return }
    setLoading(true); setError(null)
    const { data, error: err } = await supabase
      .from('twins_pesos').select('peso, objetivo, fecha')
      .eq('animal_id', siniiga).order('fecha', { ascending: true })
    if (err) { setError(err.message); setLoading(false); return }
    setRegistros((data ?? []).map(r => ({
      fecha: formatFecha(r.fecha), peso: Number(r.peso),
      objetivo: r.objetivo ? Number(r.objetivo) : undefined,
    })))
    setLoading(false)
  }, [siniiga])

  useEffect(() => { void fetch() }, [fetch])
  return { registros, loading, error, refetch: fetch }
}

// ── 3. useTwinsTimeline ───────────────────────────────────────────────────────

type EventoTipo = 'movilizacion' | 'vacunacion' | 'pesaje' | 'auditoria' | 'tratamiento'
type EventoCert = 'completa' | 'parcial' | 'pendiente'

const TIPO_MAP: Record<string, EventoTipo> = {
  movilizacion: 'movilizacion', vacunacion: 'vacunacion', pesaje: 'pesaje',
  auditoria: 'auditoria', tratamiento: 'tratamiento',
  nacimiento: 'movilizacion', otro: 'movilizacion',
}

export function useTwinsTimeline(animalId: string | null) {
  const [eventos,  setEventos]  = useState<EventoTimeline[]>([])
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  const fetch = useCallback(async () => {
    if (!animalId) { setEventos([]); return }
    setLoading(true); setError(null)
    const { data, error: err } = await supabase
      .from('twins_eventos').select('id, tipo, fecha, data')
      .eq('animal_id', animalId).order('fecha', { ascending: false })
    if (err) { setError(err.message); setLoading(false); return }
    setEventos((data ?? []).map((row, idx) => {
      const d = (row.data ?? {}) as Record<string, string>
      return {
        id: idx + 1, fecha: formatFecha(row.fecha),
        tipo: (TIPO_MAP[row.tipo] ?? 'movilizacion') as EventoTipo,
        titulo: d.titulo ?? row.tipo, detalle: d.detalle ?? undefined,
        valor: d.valor ?? undefined, cert: (d.cert ?? 'pendiente') as EventoCert,
        ubicacion: d.ubicacion ?? undefined,
      }
    }))
    setLoading(false)
  }, [animalId])

  useEffect(() => { void fetch() }, [fetch])
  return { eventos, loading, error, refetch: fetch }
}

// ── 4. useTwinsAlimentacion ───────────────────────────────────────────────────
// FIX v4: siniiga es la dep real del refetch. Los valores de peso se leen
// desde una ref actualizada en cada render para evitar loops de floating point,
// sin necesidad de incluirlos como deps del useCallback.

export function useTwinsAlimentacion(
  animalId:       string | null,
  pesoActual:     number = 0,
  pesoMeta:       number = 500,
  gananciaDiaria: number = 0.8,
  pesoNacimiento: number = 0,
) {
  const [datos,   setDatos]   = useState<DatosAlimentacion | null>(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  // Ref para leer los pesos actuales dentro del fetch sin incluirlos en deps
  const pesosRef = useRef({ pesoActual, pesoMeta, gananciaDiaria, pesoNacimiento })
  pesosRef.current = { pesoActual, pesoMeta, gananciaDiaria, pesoNacimiento }

  const fetch = useCallback(async () => {
    if (!animalId) { setDatos(null); return }
    setLoading(true); setError(null)

    const { _pa, _pm, _gd, _pn } = (() => {
      const p = pesosRef.current
      return {
        _pa: Math.round(p.pesoActual     * 10) / 10,
        _pm: Math.round(p.pesoMeta       * 10) / 10,
        _gd: Math.round(p.gananciaDiaria * 10) / 10,
        _pn: Math.round(p.pesoNacimiento * 10) / 10,
      }
    })()

    const { data, error: err } = await supabase
      .from('twins_alimentacion')
      .select('semana_inicio, forraje_pct, concentrado_pct, suplemento_pct, ca_valor')
      .eq('animal_id', animalId)
      .order('semana_inicio', { ascending: false })
      .limit(4)
    if (err) { setError(err.message); setLoading(false); return }
    const rows = data ?? []
    if (!rows.length) { setDatos(null); setLoading(false); return }

    const caActual  = rows[0]?.ca_valor != null ? Number(rows[0].ca_valor) : 0
    const dias      = _gd > 0 ? Math.ceil((_pm - _pa) / _gd) : 0
    const fechaSal  = new Date()
    fechaSal.setDate(fechaSal.getDate() + dias)
    const meses     = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC']
    const proyFecha = `${String(fechaSal.getDate()).padStart(2,'0')} ${meses[fechaSal.getMonth()]} ${fechaSal.getFullYear()}`

    setDatos({
      semanas: rows.map(r => ({
        fecha:       formatSemana(r.semana_inicio),
        forraje:     Number(r.forraje_pct     ?? 0),
        concentrado: Number(r.concentrado_pct ?? 0),
        suplemento:  Number(r.suplemento_pct  ?? 0),
      })),
      caActual, caObjetivo: 7.0, caIndustria: 8.2,
      proyDias: dias, proyFecha,
      pesoMeta:       _pm,
      pesoActual:     _pa,
      pesoNacimiento: _pn,
    })
    setLoading(false)
  }, [animalId]) 

  useEffect(() => { void fetch() }, [fetch])
  return { datos, loading, error, refetch: fetch }
}

// ── 5. useTwinsFeed ───────────────────────────────────────────────────────────

export function useTwinsFeed(animalId: string | null) {
  const [auditorias,  setAuditorias]  = useState<Auditoria[]>([])
  const [completitud, setCompletitud] = useState(0)
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState<string | null>(null)

  const fetch = useCallback(async () => {
    if (!animalId) { setAuditorias([]); setCompletitud(0); return }
    setLoading(true); setError(null)
    const { data, error: err } = await supabase
      .from('v_twins_auditorias')
      .select('id, nombre, sub, fecha, estado, hash_ipfs, hash_ok')
      .eq('siniiga', animalId)
      .order('fecha', { ascending: false })
    if (err) { setError(err.message); setLoading(false); return }

    const mapped: Auditoria[] = (data ?? []).map((row, idx) => ({
      id: idx + 1, nombre: row.nombre ?? '—', sub: row.sub ?? '—',
      fecha: formatFecha(row.fecha),
      estado: (row.estado as Auditoria['estado']) ?? 'incompleto',
      pills: [], hash: row.hash_ipfs ?? 'Sin hash IPFS', hashOk: row.hash_ok ?? false,
    }))
    setAuditorias(mapped)
    const total    = mapped.length
    const completas = mapped.filter(a => a.estado !== 'incompleto').length
    setCompletitud(total > 0 ? Math.round((completas / total) * 100) : 0)
    setLoading(false)
  }, [animalId])

  useEffect(() => { void fetch() }, [fetch])
  return { auditorias, completitud, loading, error, refetch: fetch }
}
