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

    // JOIN con corrales para obtener el label del corral
    const { data, error: err } = await supabase
      .from('animales')
      .select('*, corrales(label)')
      .eq('rancho_id', ranchoId)
      .neq('estatus', 'baja')
      .order('created_at', { ascending: false })

    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }

    // Mapear estatus DB → estado válido del widget
    // La tabla 'animales' usa: activo | vendido | muerto | exportado | baja
    // El widget espera:        engorda | cría | reproducción | cuarentena
    type EstadoWidget = 'engorda' | 'cría' | 'reproducción' | 'cuarentena'
    const ESTATUS_MAP: Record<string, EstadoWidget> = {
      activo:    'engorda',
      vendido:   'engorda',
      exportado: 'engorda',
      muerto:    'cuarentena',
    }

    // Mapear AnimalDB → AnimalListItem (formato de TwinsPerfilesWidget)
    const mapped: AnimalListItem[] = (data ?? []).map(a => {
      const pesoActual     = Number(a.peso_kg          ?? 0)
      const pesoNacimiento = Number(a.peso_nacimiento   ?? 0)
      // pesoMeta: campo real si existe, sino +40% del peso actual, sino 500
      const pesoMeta = a.peso_meta
        ? Number(a.peso_meta)
        : pesoActual > 0 ? Math.round(pesoActual * 1.4) : 500
      const gananciaDiaria = Number(a.ganancia_diaria_kg ?? 0.8)
      const corralLabel = (a.corrales as { label?: string } | null)?.label
      return {
        perfil: {
          arete:          a.siniiga,
          nombre:         a.nombre ?? undefined,
          raza:           a.raza,
          sexo:           a.sexo === 'hembra' ? 'Hembra' : 'Macho',
          edadMeses:      calcEdadMeses(a.fecha_nacimiento),
          lote:           corralLabel ?? a.upp ?? '—',  // corral como lote — rfid es el chip
          corral:         corralLabel ?? a.upp ?? '—',
          upp:            a.upp ?? '—',
          pesoActual,
          pesoNacimiento,
          pesoMeta,
          gananciaDiaria,
          estado:         ESTATUS_MAP[a.estatus] ?? 'engorda',
          alertas:        0,
        },
        pesos: [],
      }
    })

    setAnimales(mapped)
    setLoading(false)
  }, [ranchoId])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void fetch() }, [fetch])

  return { animales, loading, error, refetch: fetch }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2. useTwinsPesos — alimenta TwinsPesoWidget
// ═══════════════════════════════════════════════════════════════════════════════

// NOTA: twins_pesos.animal_id guarda siniiga (ver twinsService.registrarPeso)
// El parámetro se llama siniiga para evitar confusión con UUID
export function useTwinsPesos(siniiga: string | null) {
  const [registros, setRegistros] = useState<RegistroPeso[]>([])
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!siniiga) { setRegistros([]); return }
    setLoading(true)

    supabase
      .from('twins_pesos')
      .select('peso, objetivo, fecha')
      .eq('animal_id', siniiga)
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
  }, [siniiga])

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
    // eslint-disable-next-line react-hooks/set-state-in-effect
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

// NOTA: twins_alimentacion.animal_id guarda siniiga (ver twinsService.registrarAlimentacion)
export function useTwinsAlimentacion(
  siniiga:        string | null,
  pesoActual:     number = 0,
  pesoMeta:       number = 500,
  gananciaDiaria: number = 0.8,
) {
  const [datos,   setDatos]   = useState<DatosAlimentacion | null>(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!siniiga) { setDatos(null); return }
    setLoading(true)

    supabase
      .from('twins_alimentacion')
      .select('semana_inicio, forraje_pct, concentrado_pct, suplemento_pct, ca_valor')
      .eq('animal_id', siniiga)
      .order('semana_inicio', { ascending: false })
      .limit(4)
      .then(({ data, error: err }) => {
        if (err) { setError(err.message); setLoading(false); return }

        const rows = data ?? []

        // Sin ningún registro → devolver null para que el widget muestre estado vacío
        if (!rows.length) { setDatos(null); setLoading(false); return }

        // CA más reciente — solo del registro más nuevo
        const caActual = rows[0]?.ca_valor != null ? Number(rows[0].ca_valor) : 0

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
          caObjetivo:  7.0,   // estándar industria bovina México (referencia fija)
          caIndustria: 8.2,   // promedio industria nacional (referencia fija)
          proyDias:    dias,
          proyFecha,
          pesoMeta,
          pesoActual,
        })
        setLoading(false)
      })
  }, [siniiga, pesoActual, pesoMeta, gananciaDiaria])

  return { datos, loading, error }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 5. useTwinsFeed — alimenta TwinsFeedWidget (auditorías)
// ═══════════════════════════════════════════════════════════════════════════════
// Por ahora devuelve array vacío — cuando exista tabla twins_auditorias
// solo hay que cambiar la query aquí. El widget no cambia.

export function useTwinsFeed(siniiga: string | null) {
  const [auditorias,  setAuditorias]  = useState<Auditoria[]>([])
  const [completitud, setCompletitud] = useState(0)
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState<string | null>(null)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!siniiga) { setAuditorias([]); setCompletitud(0); return }
    setLoading(true)

    supabase
      .from('v_twins_auditorias')
      .select('id, nombre, sub, fecha, estado, hash_ipfs, hash_ok')
      .eq('siniiga', siniiga)
      .order('fecha', { ascending: false })
      .then(({ data, error: err }) => {
        if (err) { setError(err.message); setLoading(false); return }

        const mapped: Auditoria[] = (data ?? []).map((row, idx) => ({
          id:      idx + 1,
          nombre:  row.nombre  ?? '—',
          sub:     row.sub     ?? '—',
          fecha:   formatFecha(row.fecha),
          estado:  (row.estado as Auditoria['estado']) ?? 'incompleto',
          pills:   [],   // pills detalladas se agregan cuando haya tabla de evidencias
          hash:    row.hash_ipfs ?? 'Sin hash IPFS',
          hashOk:  row.hash_ok  ?? false,
        }))

        setAuditorias(mapped)
        const total    = mapped.length
        const completas = mapped.filter(a => a.estado !== 'incompleto').length
        setCompletitud(total > 0 ? Math.round((completas / total) * 100) : 0)
        setLoading(false)
      })
  }, [siniiga])

  return { auditorias, completitud, loading, error }
}