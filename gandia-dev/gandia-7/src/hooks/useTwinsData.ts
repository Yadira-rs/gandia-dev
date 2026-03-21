/**
 * ═══════════════════════════════════════════════════════════════════
 * GANDIA · TWINS — Hooks de datos para cada widget
 * ═══════════════════════════════════════════════════════════════════
 *
 * ARCHIVO → src/hooks/useTwinsData.ts
 *
 * Exporta un hook por widget:
 *   useTwinsAnimales      → TwinsPerfilesWidget + TwinsHeroWidget
 *   useTwinsPesos         → TwinsPesoWidget
 *   useTwinsTimeline      → TwinsTimelineWidget
 *   useTwinsAlimentacion  → TwinsAlimentacionWidget
 *   useTwinsFeed          → TwinsFeedWidget (auditorías)
 *
 * Uso en GemelosModulo.tsx / GemelosAnima.tsx:
 *   import { useTwinsAnimales, useTwinsPesos, ... } from '@/hooks/useTwinsData'
 */

import { useEffect, useState, useCallback } from 'react'
import { supabase }                          from '../lib/supabaseClient'

// ─── Tipos de los widgets (importados para compatibilidad exacta) ─────────────
import type { AnimalListItem }    from '../artifacts/twins/widgets/TwinsPerfilesWidget'
import type { RegistroPeso }      from '../artifacts/twins/widgets/TwinsPesoWidget'
import type { EventoTimeline }    from '../artifacts/twins/widgets/TwinsTimelineWidget'
import type { DatosAlimentacion } from '../artifacts/twins/widgets/TwinsAlimentacionWidget'
import type { Auditoria }         from '../artifacts/twins/widgets/TwinsFeedWidget'

// ─── HELPER — calcular edad en meses ─────────────────────────────────────────

function calcEdadMeses(fechaNacimiento: string): number {
  const hoy = new Date()
  const nac = new Date(fechaNacimiento + 'T00:00:00')
  return Math.max(0,
    (hoy.getFullYear() - nac.getFullYear()) * 12 + (hoy.getMonth() - nac.getMonth())
  )
}

// ─── HELPER — formatear fecha ISO → 'DD MMM YY' ──────────────────────────────

function formatFecha(iso: string): string {
  const d     = new Date(iso)
  const meses = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC']
  return `${String(d.getDate()).padStart(2,'0')} ${meses[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`
}

// ─── HELPER — formatear fecha ISO → 'DD MMM' (para semanas) ──────────────────

function formatSemana(iso: string): string {
  const d     = new Date(iso)
  const meses = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC']
  return `${String(d.getDate()).padStart(2,'0')} ${meses[d.getMonth()]}`
}

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

export function useTwinsAnimales(ranchoId: string | null) {
  const [animales, setAnimales] = useState<AnimalListItem[]>([])
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  const fetch = useCallback(async () => {
    if (!ranchoId) return
    setLoading(true)
    setError(null)

    const { data, error: err } = await supabase
      .from('animales')
      .select('*')
      .eq('rancho_id', ranchoId)
      .neq('estatus', 'baja')
      .order('created_at', { ascending: false })

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
    setLoading(false)
  }, [ranchoId])

  useEffect(() => { void fetch() }, [fetch])

  return { animales, loading, error, refetch: fetch }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2. useTwinsPesos — alimenta TwinsPesoWidget
// ═══════════════════════════════════════════════════════════════════════════════

export function useTwinsPesos(animalId: string | null) {
  const [registros, setRegistros] = useState<RegistroPeso[]>([])
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState<string | null>(null)

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

  return { registros, loading, error }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3. useTwinsTimeline — alimenta TwinsTimelineWidget
// ═══════════════════════════════════════════════════════════════════════════════

// Tipos válidos del widget
type EventoTipo = 'movilizacion' | 'vacunacion' | 'pesaje' | 'auditoria' | 'tratamiento'
type EventoCert = 'completa' | 'parcial' | 'pendiente'

// Mapeo de tipo DB → tipo del widget
const TIPO_MAP: Record<string, EventoTipo> = {
  movilizacion: 'movilizacion',
  vacunacion:   'vacunacion',
  pesaje:       'pesaje',
  auditoria:    'auditoria',
  tratamiento:  'tratamiento',
  nacimiento:   'movilizacion',  // nacimiento se muestra como movilización
  otro:         'movilizacion',
}

export function useTwinsTimeline(animalId: string | null) {
  const [eventos,  setEventos]  = useState<EventoTimeline[]>([])
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  useEffect(() => {
    if (!animalId) { setEventos([]); return }
    setLoading(true)

    supabase
      .from('twins_eventos')
      .select('id, tipo, fecha, data')
      .eq('animal_id', animalId)
      .order('fecha', { ascending: false })
      .then(({ data, error: err }) => {
        if (err) { setError(err.message); setLoading(false); return }

        setEventos((data ?? []).map((row, idx) => {
          // data es jsonb: { titulo, valor, cert, ubicacion, detalle? }
          const d = (row.data ?? {}) as Record<string, string>
          return {
            id:        idx + 1,
            fecha:     formatFecha(row.fecha),
            tipo:      (TIPO_MAP[row.tipo] ?? 'movilizacion') as EventoTipo,
            titulo:    d.titulo    ?? row.tipo,
            detalle:   d.detalle   ?? undefined,
            valor:     d.valor     ?? undefined,
            cert:      (d.cert     ?? 'pendiente') as EventoCert,
            ubicacion: d.ubicacion ?? undefined,
          }
        }))
        setLoading(false)
      })
  }, [animalId])

  return { eventos, loading, error }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 4. useTwinsAlimentacion — alimenta TwinsAlimentacionWidget
// ═══════════════════════════════════════════════════════════════════════════════

export function useTwinsAlimentacion(
  animalId:       string | null,
  pesoActual:     number = 0,
  pesoMeta:       number = 500,
  gananciaDiaria: number = 0.8,
) {
  const [datos,   setDatos]   = useState<DatosAlimentacion | null>(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  useEffect(() => {
    if (!animalId) { setDatos(null); return }
    setLoading(true)

    supabase
      .from('twins_alimentacion')
      .select('semana_inicio, forraje_pct, concentrado_pct, suplemento_pct, ca_valor')
      .eq('animal_id', animalId)
      .order('semana_inicio', { ascending: false })
      .limit(4)
      .then(({ data, error: err }) => {
        if (err) { setError(err.message); setLoading(false); return }

        const rows = data ?? []

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
}

// ═══════════════════════════════════════════════════════════════════════════════
// 5. useTwinsFeed — alimenta TwinsFeedWidget (auditorías)
// ═══════════════════════════════════════════════════════════════════════════════
// Por ahora devuelve array vacío — cuando exista tabla twins_auditorias
// solo hay que cambiar la query aquí. El widget no cambia.

export function useTwinsFeed(_animalId: string | null) {
  const [auditorias,  setAuditorias]  = useState<Auditoria[]>([])
  const [completitud, setCompletitud] = useState(0)
  const [loading,     setLoading]     = useState(false)

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
