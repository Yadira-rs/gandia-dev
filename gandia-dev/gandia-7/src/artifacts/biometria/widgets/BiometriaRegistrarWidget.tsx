/**
 * BiometriaRegistrarWidget — datos REALES desde Supabase
 * ARCHIVO → src/artifacts/biometria/widgets/BiometriaRegistrarWidget.tsx
 *
 * CAMBIOS vs mock:
 *   - useAnimalesSinHuella() reemplaza ANIMALES_MOCK
 *   - useRanchoId() + useUser() para obtener el rancho del usuario
 *   - Filtra animales con biometria_status 'sin-registrar' o 'pendiente'
 *   - Muestra contador real + badge en vivo
 */
import { useState, useMemo } from 'react'
import { useUser }              from '../../../context/UserContext'
import { useRanchoId }          from '../../../hooks/useAnimales'
import {
  useAnimalesSinHuella,
  type AnimalConBiometria,
  type BiometriaStatus,
} from '../../../hooks/useBiometria'
import type { AnimalContext } from './BiometriaCapturaWidget'

type Filtro = 'todos' | 'sin-registrar' | 'pendiente'

interface Props {
  onIniciarCaptura?: (animal: AnimalContext) => void
  onRefetch?:        () => void
}

const BIO: Record<BiometriaStatus, { dot: string; label: string; hint: string; textColor: string }> = {
  'registrado':    { dot: 'bg-[#2FAF8F]',                   label: 'Registrado',    hint: '',                                          textColor: 'text-[#2FAF8F]'  },
  'pendiente':     { dot: 'bg-amber-400',                   label: 'Pendiente',     hint: 'Score bajo — necesita verificación humana', textColor: 'text-amber-500'  },
  'sin-registrar': { dot: 'bg-stone-300 dark:bg-stone-600', label: 'Sin registrar', hint: 'Sin captura de morro todavía',              textColor: 'text-stone-400 dark:text-stone-500' },
}

// ─── DB → AnimalContext (consumido por BiometriaCapturaWidget) ────────────────

function toAnimalContext(a: AnimalConBiometria): AnimalContext {
  return {
    id:     a.id,
    nombre: a.nombre ?? '—',
    arete:  a.siniiga,
    raza:   a.raza,
    lote:   a.upp ?? '—',
  }
}

// ─── WIDGET ───────────────────────────────────────────────────────────────────

export default function BiometriaRegistrarWidget({ onIniciarCaptura, onRefetch }: Props) {
  const { profile } = useUser()
  const userId      = profile?.user_id ?? null
  const { ranchoId } = useRanchoId(userId)

  const { animales, loading, error, refetch } = useAnimalesSinHuella(ranchoId)

  const [query,    setQuery]    = useState('')
  const [filtro,   setFiltro]   = useState<Filtro>('todos')
  const [expanded, setExpanded] = useState<string | null>(null)

  const cntSinReg    = useMemo(() => animales.filter(a => a.biometria_status === 'sin-registrar').length, [animales])
  const cntPendiente = useMemo(() => animales.filter(a => a.biometria_status === 'pendiente').length,     [animales])

  const lower = query.toLowerCase()
  const filtrado = useMemo(() => animales.filter(a => {
    const matchFiltro = filtro === 'todos' || a.biometria_status === filtro
    const matchQuery  = !query.trim() ||
      (a.nombre ?? '').toLowerCase().includes(lower) ||
      a.siniiga.toLowerCase().includes(lower) ||
      a.raza.toLowerCase().includes(lower)
    return matchFiltro && matchQuery
  }), [animales, filtro, query, lower])

  const FILTROS: { id: Filtro; label: string; count: number }[] = [
    { id: 'todos',         label: 'Todos',         count: animales.length },
    { id: 'sin-registrar', label: 'Sin registrar', count: cntSinReg       },
    { id: 'pendiente',     label: 'Pendiente',     count: cntPendiente    },
  ]

  // ── Loading ──
  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <div className="flex flex-col items-center gap-3">
        <div className="w-5 h-5 border-2 border-[#2FAF8F] border-t-transparent rounded-full animate-spin"/>
        <p className="text-[12px] text-stone-400 dark:text-stone-500">Cargando animales…</p>
      </div>
    </div>
  )

  // ── Error ──
  if (error) return (
    <div className="flex flex-col items-center gap-3 py-16 text-center px-8">
      <p className="text-[12px] text-stone-500 dark:text-stone-400">No se pudo cargar los animales</p>
      <p className="text-[11px] text-stone-400 font-mono">{error}</p>
      <button
        onClick={refetch}
        className="mt-2 px-3 py-1.5 rounded-lg border border-stone-200/70 dark:border-stone-800 text-[11px] text-stone-500 hover:text-stone-700 transition-colors bg-transparent cursor-pointer"
      >
        Reintentar
      </button>
    </div>
  )

  return (
    <div className="flex flex-col gap-4">

      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[13.5px] font-semibold text-stone-800 dark:text-stone-100 leading-tight">
            Vincular huella a pasaporte
          </p>
          <p className="text-[12px] text-stone-400 dark:text-stone-500 mt-0.5">
            Animales que requieren captura o verificación de morro
          </p>
        </div>
        <button
          onClick={() => { refetch(); onRefetch?.() }}
          title="Actualizar lista"
          className="w-8 h-8 flex items-center justify-center rounded-[8px] border border-stone-200/70 dark:border-stone-800 text-stone-400 hover:text-[#2FAF8F] hover:border-[#2FAF8F]/30 transition-all cursor-pointer bg-transparent"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="23 4 23 10 17 10"/>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
        </button>
      </div>

      {/* ── Búsqueda ── */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
          width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setExpanded(null) }}
          placeholder="Buscar por nombre, arete o raza…"
          className="w-full h-10 pl-9 pr-8 rounded-[8px] border border-stone-200 dark:border-stone-700/60 bg-white dark:bg-[#1c1917] text-[12.5px] text-stone-700 dark:text-stone-300 placeholder:text-stone-400 dark:placeholder:text-stone-500 outline-none focus:border-[#2FAF8F]/50 focus:ring-2 focus:ring-[#2FAF8F]/10 transition-all"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-300 hover:text-stone-500 transition-colors cursor-pointer bg-transparent border-0 p-0"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        )}
      </div>

      {/* ── Filtros ── */}
      <div className="flex gap-1.5 flex-wrap">
        {FILTROS.map(f => {
          const active = filtro === f.id
          const activeStyle = f.id === 'pendiente'
            ? 'bg-amber-500 text-white border-transparent'
            : 'bg-stone-800 dark:bg-stone-100 text-white dark:text-stone-800 border-transparent'
          return (
            <button
              key={f.id}
              onClick={() => { setFiltro(f.id); setExpanded(null) }}
              className={`flex items-center gap-1.5 h-7 px-3 rounded-full text-[11.5px] font-medium transition-all cursor-pointer border ${
                active
                  ? activeStyle
                  : 'bg-white dark:bg-[#1c1917] text-stone-500 dark:text-stone-400 border-stone-200 dark:border-stone-700/60 hover:border-stone-300'
              }`}
            >
              {f.label}
              <span className={`text-[10px] font-bold tabular-nums ${active ? 'opacity-80' : 'opacity-50'}`}>
                {f.count}
              </span>
            </button>
          )
        })}
      </div>

      {/* ── Lista ── */}
      <div className="bg-white dark:bg-[#1c1917] border border-stone-200/60 dark:border-stone-800/50 rounded-[12px] overflow-hidden">

        {/* Estado vacío — todos registrados */}
        {animales.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 py-12 px-6 text-center">
            <div className="w-10 h-10 rounded-2xl bg-[#2FAF8F]/10 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2FAF8F" strokeWidth="1.5" strokeLinecap="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <p className="text-[13px] font-semibold text-stone-600 dark:text-stone-300">¡Todo al día!</p>
            <p className="text-[11.5px] text-stone-400 dark:text-stone-500">
              Todos los animales tienen huella de morro registrada
            </p>
          </div>
        )}

        {/* Sin resultados para búsqueda */}
        {animales.length > 0 && filtrado.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 py-10 px-6">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" className="text-stone-300 dark:text-stone-700">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <p className="text-[12.5px] text-stone-400 dark:text-stone-500 text-center">
              {query ? `Sin resultados para "${query}"` : 'No hay animales en este filtro'}
            </p>
          </div>
        )}

        {/* Filas */}
        {filtrado.map((a, i) => {
          const cfg        = BIO[a.biometria_status]
          const isExpanded = expanded === a.id

          return (
            <div key={a.id} className={i < filtrado.length - 1 ? 'border-b border-stone-100 dark:border-stone-800/40' : ''}>

              {/* Fila principal */}
              <div
                onClick={() => setExpanded(isExpanded ? null : a.id)}
                className={`flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-colors hover:bg-stone-50 dark:hover:bg-stone-800/20 ${
                  isExpanded ? 'bg-stone-50 dark:bg-stone-800/20' : ''
                }`}
              >
                <span className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot} ${a.biometria_status === 'pendiente' ? 'animate-pulse' : ''}`}/>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-[13px] font-semibold text-stone-800 dark:text-stone-100 leading-tight">
                      {a.nombre ?? '—'}
                    </p>
                    <p className="text-[12px] text-stone-400 dark:text-stone-500 font-mono">{a.siniiga}</p>
                  </div>
                  <p className="text-[11.5px] text-stone-400 dark:text-stone-500 mt-0.5">
                    {a.raza} · {a.sexo === 'macho' ? 'Macho' : 'Hembra'}
                    {a.upp ? ` · ${a.upp}` : ''}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <p className={`text-[11.5px] font-medium ${cfg.textColor}`}>{cfg.label}</p>
                    {a.biometria_status === 'pendiente' && (
                      <p className="text-[10px] text-amber-400/80 leading-tight">Verificar</p>
                    )}
                  </div>
                  <svg
                    className={`w-4 h-4 text-stone-300 dark:text-stone-600 transition-transform duration-150 ${isExpanded ? 'rotate-180' : ''}`}
                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </div>
              </div>

              {/* Panel expandido */}
              {isExpanded && (
                <div className="px-4 pb-3.5 pt-3 bg-stone-50 dark:bg-stone-800/20 border-t border-stone-100 dark:border-stone-800/40 flex flex-col gap-2.5">
                  {cfg.hint && (
                    <p className="text-[11.5px] text-stone-400 dark:text-stone-500">{cfg.hint}</p>
                  )}
                  <button
                    onClick={() => { onIniciarCaptura?.(toAnimalContext(a)); onRefetch?.() }}
                    className="w-full h-9 bg-[#2FAF8F] hover:bg-[#27a07f] text-white text-[12.5px] font-semibold rounded-[8px] border-0 cursor-pointer transition-colors flex items-center justify-center gap-2 active:scale-[0.98]"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                      <circle cx="12" cy="12" r="3"/>
                      <path d="M3 9V6a1 1 0 0 1 1-1h3"/><path d="M21 9V6a1 1 0 0 0-1-1h-3"/>
                      <path d="M3 15v3a1 1 0 0 0 1 1h3"/><path d="M21 15v3a1 1 0 0 1-1 1h-3"/>
                    </svg>
                    {a.biometria_status === 'pendiente' ? 'Volver a capturar' : 'Capturar huella'}
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Footer ── */}
      {filtrado.length > 0 && (
        <p className="text-[11.5px] text-stone-400 dark:text-stone-500">
          {filtrado.length} animal{filtrado.length !== 1 ? 'es' : ''} pendiente{filtrado.length !== 1 ? 's' : ''}
          {cntPendiente > 0 && (
            <span className="text-amber-500 ml-1.5">· {cntPendiente} requieren verificación</span>
          )}
        </p>
      )}
    </div>
  )
}