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

<<<<<<< Updated upstream
// ─── HELPER — lunes de esta semana ───────────────────────────────────────────

function lunesDeEstaSemana(): string {
  const d   = new Date()
  const day = d.getDay()
  d.setDate(d.getDate() - day + (day === 0 ? -6 : 1))
  return d.toISOString().split('T')[0]
}

// ═══════════════════════════════════════════════════════════════════════════════
// 1. useTwinsAnimales — alimenta TwinsPerfilesWidget + TwinsHeroWidget
// ═══════════════════════════════════════════════════════════════════════════════
=======
// ── 1. useTwinsAnimales ───────────────────────────────────────────────────────
>>>>>>> Stashed changes

export function useTwinsAnimales(ranchoId: string | null) {
  const [animales, setAnimales] = useState<AnimalListItem[]>([])
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  const fetch = useCallback(async () => {
    if (!ranchoId) return
<<<<<<< Updated upstream
    setLoading(true)
    setError(null)

=======
    setLoading(true); setError(null)
>>>>>>> Stashed changes
    const { data, error: err } = await supabase
      .from('animales')
      .select('*')
      .eq('rancho_id', ranchoId)
      .neq('estatus', 'baja')
      .order('created_at', { ascending: false })
    if (err) { setError(err.message); setLoading(false); return }

<<<<<<< Updated upstream
    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }

    // Mapear AnimalDB → AnimalListItem (formato de TwinsPerfilesWidget)
    const mapped: AnimalListItem[] = (data ?? []).map(a => ({
      perfil: {
        arete:          a.siniiga,
        nombre:         a.nombre   ?? undefined,
        raza:           a.raza,
        sexo:           a.sexo === 'hembra' ? 'Hembra' : 'Macho',
        edadMeses:      calcEdadMeses(a.fecha_nacimiento),
        lote:           a.rfid     ?? '—',
        corral:         a.upp      ?? '—',
        upp:            a.upp      ?? '—',
        pesoActual:     Number(a.peso_kg ?? 0),
        pesoNacimiento: 0,          // se actualiza con useTwinsPesos
        pesoMeta:       500,        // TODO: traer de tabla protocolos cuando exista
        gananciaDiaria: 0.8,        // TODO: calcular desde twins_pesos
        estado:         (a.estatus as 'engorda' | 'cría' | 'reproducción' | 'cuarentena') ?? 'engorda',
        alertas:        0,
      },
      pesos: [],                    // se cargan en detalle con useTwinsPesos
    }))

    setAnimales(mapped)
=======
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
>>>>>>> Stashed changes
    setLoading(false)
  }, [ranchoId])

  useEffect(() => { void fetch() }, [fetch])
  return { animales, loading, error, refetch: fetch }
}

// ── 2. useTwinsPesos ──────────────────────────────────────────────────────────

<<<<<<< Updated upstream
export function useTwinsPesos(animalId: string | null) {
=======
export function useTwinsPesos(siniiga: string | null) {
>>>>>>> Stashed changes
  const [registros, setRegistros] = useState<RegistroPeso[]>([])
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState<string | null>(null)

<<<<<<< Updated upstream
  useEffect(() => {
    if (!animalId) { setRegistros([]); return }
    setLoading(true)

    supabase
      .from('twins_pesos')
      .select('peso, objetivo, fecha')
      .eq('animal_id', animalId)
      .order('fecha', { ascending: true })
      .then(({ data, error: err }) => {
        if (err) { setError(err.message); setLoading(false); return }

        setRegistros((data ?? []).map(r => ({
          fecha:    formatFecha(r.fecha),
          peso:     Number(r.peso),
          objetivo: r.objetivo ? Number(r.objetivo) : undefined,
        })))
        setLoading(false)
      })
  }, [animalId])
=======
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
>>>>>>> Stashed changes

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

<<<<<<< Updated upstream
  useEffect(() => {
=======
  const fetch = useCallback(async () => {
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
  useEffect(() => {
    if (!animalId) { setDatos(null); return }
    setLoading(true)
=======
  // Ref para leer los pesos actuales dentro del fetch sin incluirlos en deps
  const pesosRef = useRef({ pesoActual, pesoMeta, gananciaDiaria, pesoNacimiento })
  pesosRef.current = { pesoActual, pesoMeta, gananciaDiaria, pesoNacimiento }
>>>>>>> Stashed changes

  const fetch = useCallback(async () => {
    if (!siniiga) { setDatos(null); return }
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

<<<<<<< Updated upstream
        // CA más reciente
        const caActual = Number(rows[0]?.ca_valor ?? 6.8)

        // Proyección de salida
        const dias     = gananciaDiaria > 0
          ? Math.ceil((pesoMeta - pesoActual) / gananciaDiaria)
          : 0
        const fechaSal = new Date()
        fechaSal.setDate(fechaSal.getDate() + dias)
        const meses    = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC']
        const proyFecha = `${String(fechaSal.getDate()).padStart(2,'0')} ${meses[fechaSal.getMonth()]} ${fechaSal.getFullYear()}`

        setDatos({
          semanas: rows.map(r => ({
            fecha:        formatSemana(r.semana_inicio),
            forraje:      Number(r.forraje_pct     ?? 0),
            concentrado:  Number(r.concentrado_pct ?? 0),
            suplemento:   Number(r.suplemento_pct  ?? 0),
          })),
          caActual,
          caObjetivo:  7.1,
          caIndustria: 8.2,
          proyDias:    dias,
          proyFecha,
          pesoMeta,
          pesoActual,
        })
        setLoading(false)
      })
  }, [animalId, pesoActual, pesoMeta, gananciaDiaria])

  return { datos, loading, error }
=======
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
  }, [siniiga]) // Solo siniiga — los pesos se leen desde pesosRef dentro del fetch

  useEffect(() => { void fetch() }, [fetch])
  return { datos, loading, error, refetch: fetch }
>>>>>>> Stashed changes
}

// ── 5. useTwinsFeed ───────────────────────────────────────────────────────────

export function useTwinsFeed(_animalId: string | null) {
  const [auditorias,  setAuditorias]  = useState<Auditoria[]>([])
  const [completitud, setCompletitud] = useState(0)
  const [loading,     setLoading]     = useState(false)

<<<<<<< Updated upstream
  // TODO: cuando exista tabla twins_auditorias, descomentar:
  /*
  useEffect(() => {
    if (!_animalId) { setAuditorias([]); return }
    setLoading(true)

    supabase
      .from('twins_auditorias')
      .select('*, twins_evidencias(*)')
      .eq('animal_id', _animalId)
      .order('fecha', { ascending: false })
      .then(({ data, error }) => {
        if (error) { setLoading(false); return }
        const mapped = (data ?? []).map((a, idx) => ({
          id:     idx + 1,
          nombre: a.nombre,
          sub:    a.subtitulo ?? '',
          fecha:  formatFecha(a.fecha),
          estado: a.estado as Auditoria['estado'],
          pills:  (a.twins_evidencias ?? []).map((e: any) => ({ label: e.etiqueta, ok: e.estado === 'ok' })),
          hash:   a.hash_ipfs ?? 'Sin indexar',
          hashOk: !!a.hash_ipfs,
        }))
        setAuditorias(mapped)
        const total    = mapped.length
        const completas = mapped.filter(a => a.estado !== 'incompleto').length
        setCompletitud(total > 0 ? Math.round((completas / total) * 100) : 0)
        setLoading(false)
      })
  }, [_animalId])
  */

  return { auditorias, completitud, loading }
}
=======
  const fetch = useCallback(async () => {
    if (!siniiga) { setAuditorias([]); setCompletitud(0); return }
    setLoading(true); setError(null)
    const { data, error: err } = await supabase
      .from('v_twins_auditorias')
      .select('id, nombre, sub, fecha, estado, hash_ipfs, hash_ok')
      .eq('siniiga', siniiga)
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
  }, [siniiga])

  useEffect(() => { void fetch() }, [fetch])
  return { auditorias, completitud, loading, error, refetch: fetch }
}
>>>>>>> Stashed changes
