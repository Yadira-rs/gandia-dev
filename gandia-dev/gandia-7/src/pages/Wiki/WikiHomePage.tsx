// src/pages/Wiki/WikiHomePage.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase }    from '../../lib/supabaseClient'

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface DominioSalud {
  dominio:           string
  hechos_activos:    number
  hechos_revision:   number
  total:             number
  pct_vigente:       number
  hti_promedio:      number
  ultima_verificacion: string | null
}

interface HechoPreview {
  id:         string
  afirmacion: string
  dominio:    string
  hti:        number
  fuente_nombre: string
  verificado_at: string
}

// ─── Config dominios ──────────────────────────────────────────────────────────

const DOMINIOS = [
  { id: 'sanidad',     label: 'Sanidad Animal',    color: '#ef4444' },
  { id: 'exportacion', label: 'Exportación',        color: '#2FAF8F' },
  { id: 'regulacion',  label: 'Regulación Federal', color: '#f59e0b' },
  { id: 'razas',       label: 'Razas y Genética',   color: '#8b5cf6' },
  { id: 'nutricion',   label: 'Nutrición',          color: '#10b981' },
  { id: 'mercado',     label: 'Mercado y Precios',  color: '#3b82f6' },
  { id: 'bienestar',   label: 'Bienestar Animal',   color: '#ec4899' },
  { id: 'clima',       label: 'Clima y Riesgo',     color: '#64748b' },
]

// SVG monocromáticos por dominio — sin emojis
const DOMINIO_SVG: Record<string, React.ReactNode> = {
  sanidad: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  ),
  exportacion: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    </svg>
  ),
  regulacion: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  ),
  razas: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
    </svg>
  ),
  nutricion: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a10 10 0 1 0 10 10H12V2z"/><path d="M12 2a10 10 0 0 1 10 10"/>
    </svg>
  ),
  mercado: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  ),
  bienestar: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
    </svg>
  ),
  clima: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9z"/>
    </svg>
  ),
}

// ─── Helper HTI ───────────────────────────────────────────────────────────────

function htiColor(hti: number) {
  if (hti >= 80) return '#2FAF8F'
  if (hti >= 60) return '#f59e0b'
  return '#ef4444'
}

function relativeDate(iso: string | null) {
  if (!iso) return 'Nunca'
  const d    = new Date(iso)
  const diff = Math.floor((Date.now() - d.getTime()) / 86400000)
  if (diff === 0) return 'hoy'
  if (diff === 1) return 'ayer'
  if (diff < 30)  return `hace ${diff} días`
  return d.toLocaleDateString('es-MX', { month: 'short', year: 'numeric' })
}

// ─── Icons (igual que NoticiasPage) ──────────────────────────────────────────
const Ico = {
  Search: ({ c = 'w-4 h-4' }: { c?: string }) => (
    <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7.5"/><line x1="20.5" y1="20.5" x2="16.1" y2="16.1"/>
    </svg>
  ),
  Spark: ({ c = 'w-3.5 h-3.5' }: { c?: string }) => (
    <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
    </svg>
  ),
  Send: ({ c = 'w-3.5 h-3.5' }: { c?: string }) => (
    <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>
    </svg>
  ),
}

// ─── Tarjeta de resultado de búsqueda ────────────────────────────────────────

function HechoCard({ hecho, onClick }: { hecho: HechoPreview; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-4 py-3.5 rounded-xl border border-stone-200/60 dark:border-stone-800/40 bg-white dark:bg-[#141210] hover:bg-stone-50 dark:hover:bg-[#1a1816] transition-all duration-150 group"
    >
      <div className="flex items-start gap-3.5">
        <div className="shrink-0 mt-[3px] w-1.5 h-1.5 rounded-full bg-[#2FAF8F]/60" />
        <div className="flex-1 min-w-0">
          <p className="text-[13.5px] text-stone-700 dark:text-stone-300 leading-[1.55] group-hover:text-stone-900 dark:group-hover:text-stone-100 transition-colors">
            {hecho.afirmacion}
          </p>
          <div className="flex items-center gap-2.5 mt-1.5">
            <span className="text-[10.5px] font-semibold tabular-nums" style={{ color: htiColor(hecho.hti) }}>
              HTI {hecho.hti}
            </span>
            <span className="text-stone-200 dark:text-stone-700">·</span>
            <span className="text-[10.5px] text-stone-400 dark:text-stone-500 truncate">
              {hecho.fuente_nombre}
            </span>
          </div>
        </div>
        <svg className="w-3 h-3 shrink-0 text-stone-300 dark:text-stone-700 group-hover:text-stone-400 dark:group-hover:text-stone-500 mt-1.5 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </div>
    </button>
  )
}

// ─── Tarjeta de dominio ───────────────────────────────────────────────────────

function DominioCard({ dom, salud, onClick }: {
  dom:     typeof DOMINIOS[0]
  salud:   DominioSalud | undefined
  onClick: () => void
}) {
  const pct    = salud?.pct_vigente ?? 0
  const enRev  = (salud?.hechos_revision ?? 0) > 0
  const activos = salud?.hechos_activos ?? 0

  return (
    <button
      onClick={onClick}
      className="w-full h-full p-5 rounded-2xl border border-stone-200/60 dark:border-stone-800/50 bg-white dark:bg-[#141210] hover:border-stone-300/80 dark:hover:border-stone-700/60 hover:shadow-[0_2px_12px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_2px_16px_rgba(0,0,0,0.25)] text-left transition-all duration-200 group flex flex-col"
    >
      {/* Ícono SVG coloreado + badge revisión */}
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200"
          style={{ background: `${dom.color}18`, color: dom.color }}
        >
          <div className="w-[17px] h-[17px]">{DOMINIO_SVG[dom.id]}</div>
        </div>
        {enRev && (
          <span className="text-[9px] font-semibold text-amber-500/80 uppercase tracking-[0.06em]">
            Rev.
          </span>
        )}
      </div>

      {/* Nombre + conteo — ocupa el espacio disponible */}
      <div className="flex-1">
        <p className="text-[13px] font-semibold text-stone-800 dark:text-stone-100 mb-0.5 leading-snug group-hover:text-stone-900 dark:group-hover:text-white transition-colors">
          {dom.label}
        </p>
        <p className="text-[11px] text-stone-400 dark:text-stone-500 tabular-nums">
          {activos > 0 ? `${activos} hechos` : 'Sin datos'}
        </p>
      </div>

      {/* Barra de salud — siempre al fondo */}
      <div className="h-[2px] rounded-full bg-stone-100 dark:bg-stone-800/60 overflow-hidden mt-3">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: dom.color }}
        />
      </div>
    </button>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function WikiHomePage() {
  const navigate = useNavigate()

  const [salud,       setSalud]       = useState<DominioSalud[]>([])
  const [loading,     setLoading]     = useState(true)
  const [resultados,  setResultados]  = useState<HechoPreview[]>([])
  const [totalHechos, setTotalHechos] = useState(0)
  const [pctGlobal,   setPctGlobal]   = useState(0)
  const [ultimaSync,  setUltimaSync]  = useState<string | null>(null)

  // Barra fija — idéntica a Noticias
  const [query,   setQuery]   = useState('')
  const [focused, setFocused] = useState(false)
  const [barLeft,    setBarLeft]    = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const mainRef  = useRef<HTMLDivElement>(null)

  // Sidebar-aware bar
  useEffect(() => {
    const update = () => {
      if (mainRef.current) setBarLeft(mainRef.current.getBoundingClientRect().left)
    }
    update()
    window.addEventListener('resize', update)
    const obs = new ResizeObserver(update)
    if (mainRef.current) obs.observe(mainRef.current)
    return () => { window.removeEventListener('resize', update); obs.disconnect() }
  }, [])

  // Búsqueda con debounce
  const buscar = useCallback(async (q: string) => {
    if (!q.trim()) { setResultados([]); return }
    const { data } = await supabase
      .from('wiki_hechos')
      .select('id,afirmacion,dominio,hti,fuente_nombre,verificado_at')
      .eq('estado', 'activo')
      .textSearch('afirmacion', q, { config: 'spanish' })
      .order('hti', { ascending: false })
      .limit(8)
    setResultados((data as HechoPreview[]) ?? [])
  }, [])

  const handleSubmit = () => {
    if (!query.trim()) return
    navigate(`/noticias/search?q=${encodeURIComponent(query.trim())}`)
  }

  useEffect(() => {
    const t = setTimeout(() => void buscar(query), 350)
    return () => clearTimeout(t)
  }, [query, buscar])

  useEffect(() => {
    const load = async () => {
      const [{ data: saludData }, { count }] = await Promise.all([
        supabase.from('wiki_salud_dominios').select('*'),
        supabase.from('wiki_hechos').select('*', { count: 'exact', head: true }).eq('estado', 'activo'),
      ])

      const dominiosData = (saludData as DominioSalud[]) ?? []
      setSalud(dominiosData)
      setTotalHechos(count ?? 0)

      if (dominiosData.length > 0) {
        const prom = dominiosData.reduce((s, d) => s + d.pct_vigente, 0) / dominiosData.length
        setPctGlobal(Math.round(prom))

        const fechas = dominiosData.map(d => d.ultima_verificacion).filter(Boolean)
        if (fechas.length) setUltimaSync(fechas.sort().reverse()[0] ?? null)
      }

      setLoading(false)
    }
    void load()
  }, [])

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600&display=swap');
        .wk  { font-family: 'Geist', system-ui, sans-serif; -webkit-font-smoothing: antialiased; }
        .wks { font-family: 'Instrument Serif', Georgia, serif; }
        @keyframes fu  { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }
        .fu { animation: fu 400ms cubic-bezier(.16,1,.3,1) both; }
        .wk *:focus         { outline: none !important; box-shadow: none !important; }
        .wk *:focus-visible { outline: none !important; box-shadow: none !important; }
        @keyframes sug { from { opacity:0; transform:translateY(4px) } to { opacity:1; transform:translateY(0) } }
        .sug { animation: sug 200ms ease both; }
        .sb  { transition: box-shadow 200ms ease; }
        .sb.active { box-shadow: 0 6px 24px rgba(0,0,0,.10); }
        .dark .sb.active { box-shadow: 0 6px 28px rgba(0,0,0,.40); }
      `}</style>

      <div ref={mainRef} className="wk min-h-screen bg-[#fafaf9] dark:bg-[#0c0a09]">
        <div className="max-w-[860px] mx-auto px-6 pt-10 pb-48">

          {/* Header */}
          <div className="mb-10 fu">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h1 className="wks text-[26px] text-stone-900 dark:text-stone-50 tracking-[-0.01em]">
                  Wiki Handeia
                </h1>
                <p className="text-[13px] text-stone-400 dark:text-stone-500 mt-1 max-w-[460px] leading-[1.6]">
                  Base de conocimiento verificado del sector ganadero de México. Fuente primaria de Siete.
                </p>
              </div>
              <span className="text-[10px] font-semibold text-stone-400 dark:text-stone-500 border border-stone-200 dark:border-stone-700/60 px-2 py-0.5 rounded-full mt-1">
                Beta
              </span>
            </div>
          </div>

          {/* Indicador de salud global */}
          {!loading && (
            <div
              className="fu mb-8 flex items-center gap-5 py-2.5 px-0 border-b border-stone-100 dark:border-stone-800/50"
              style={{ animationDelay: '80ms' }}
            >
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#2FAF8F]" />
                <span className="text-[11.5px] text-stone-500 dark:text-stone-400 tabular-nums">
                  <span className="font-semibold text-stone-700 dark:text-stone-300">{totalHechos.toLocaleString()}</span> hechos
                </span>
              </div>
              <span className="text-stone-200 dark:text-stone-800">·</span>
              <span className="text-[11.5px] text-stone-500 dark:text-stone-400 tabular-nums">
                <span className="font-semibold text-stone-700 dark:text-stone-300">{pctGlobal}%</span> vigentes
              </span>
              <span className="text-stone-200 dark:text-stone-800">·</span>
              <span className="text-[11.5px] text-stone-400 dark:text-stone-500">
                Sync {relativeDate(ultimaSync)}
              </span>
            </div>
          )}

          {/* Resultados de búsqueda */}
          {resultados.length > 0 && (
            <div className="mb-8 fu" style={{ animationDelay: '0ms' }}>
              <p className="text-[10.5px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-[0.08em] mb-3">
                {resultados.length} {resultados.length === 1 ? 'resultado' : 'resultados'}
              </p>
              <div className="divide-y divide-stone-100 dark:divide-stone-800/50">
                {resultados.map(h => (
                  <HechoCard
                    key={h.id}
                    hecho={h}
                    onClick={() => navigate(`/wiki/hecho/${h.id}`)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Grid de dominios */}
          {resultados.length === 0 && (
            <>
              <p
                className="fu text-[10.5px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-[0.08em] mb-4 mt-8"
                style={{ animationDelay: '160ms' }}
              >
                Explorar por dominio
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 items-stretch">
                {DOMINIOS.map((dom, i) => {
                  const s = salud.find(sd => sd.dominio === dom.id)
                  return (
                    <div key={dom.id} className="fu h-full" style={{ animationDelay: `${200 + i * 40}ms` }}>
                      <DominioCard
                        dom={dom}
                        salud={s}
                        onClick={() => navigate(`/wiki/dominio/${dom.id}`)}
                      />
                    </div>
                  )
                })}
              </div>
            </>
          )}

          {/* CTA para creadores */}
          <div
            className="fu mt-12 p-4 rounded-xl border border-stone-200/60 dark:border-stone-800/50 bg-stone-50 dark:bg-stone-900/40 flex items-center justify-between gap-4"
            style={{ animationDelay: '520ms' }}
          >
            <div>
              <p className="text-[13px] font-medium text-stone-700 dark:text-stone-300 mb-0.5">
                ¿Tienes información verificable para aportar?
              </p>
              <p className="text-[12px] text-stone-400 dark:text-stone-500">
                Creadores Nivel 3 y 4 pueden proponer Hechos con fuente oficial.
              </p>
            </div>
            <button
              onClick={() => navigate('/creadores')}
              className="shrink-0 h-8 px-4 rounded-lg text-[12px] font-medium text-[#2FAF8F] border border-[#2FAF8F]/30 hover:bg-[#2FAF8F]/10 transition-colors whitespace-nowrap"
            >
              Proponer
            </button>
          </div>
        </div>

        {/* ── BARRA FIJA INFERIOR ─────────────────────────────────────────── */}
        <div
          className="fixed bottom-0 right-0 z-30 pointer-events-none transition-[left] duration-[240ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
          style={{ left: barLeft }}
        >
          <div className="h-20 bg-gradient-to-t from-[#fafaf9] via-[#fafaf9]/70 to-transparent dark:from-[#0c0a09] dark:via-[#0c0a09]/70" />

          <div className="bg-[#fafaf9]/95 dark:bg-[#0c0a09]/95 backdrop-blur-2xl pb-7 pointer-events-auto">
            <div className="max-w-[860px] mx-auto px-8">

              {focused && !query && (
                <div className="flex items-center gap-1 mb-2.5 sug">
                  <button
                    onMouseDown={() => navigate('/noticias')}
                    className="shrink-0 h-7 px-3 rounded-full text-[11.5px] font-medium text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 transition-all duration-150"
                  >
                    Radar
                  </button>
                  <button
                    onMouseDown={() => navigate('/noticias/search')}
                    className="shrink-0 h-7 px-3 rounded-full text-[11.5px] font-medium text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 transition-all duration-150"
                  >
                    Search
                  </button>
                  <span className="h-7 px-3 flex items-center text-[11.5px] font-medium bg-stone-800/40 dark:bg-stone-700/40 text-stone-200 dark:text-stone-200 rounded-full select-none">
                    Wiki
                  </span>
                </div>
              )}

              {/* Input */}
              <div className={`sb flex items-center gap-2 bg-white dark:bg-[#1c1917] border border-stone-200/80 dark:border-stone-800/60 rounded-2xl px-4 shadow-[0_2px_16px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_20px_rgba(0,0,0,0.30)] ${focused ? 'active' : ''}`}>

                <Ico.Search c="w-4 h-4 text-stone-300 dark:text-stone-600 shrink-0" />

                <div className="w-px h-3.5 bg-stone-200 dark:bg-stone-700/60 shrink-0" />

                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  onKeyDown={e => { if (e.key === 'Enter') handleSubmit() }}
                  placeholder="Buscar en Wiki Handeia..."
                  style={{ outline: 'none', boxShadow: 'none', WebkitAppearance: 'none' }}
                  className="flex-1 h-12 bg-transparent text-[14px] text-stone-800 dark:text-stone-100 placeholder-stone-300 dark:placeholder-stone-600"
                />
                {query && (
                  <button
                    onClick={handleSubmit}
                    className="shrink-0 w-8 h-8 rounded-xl bg-[#2FAF8F] hover:bg-[#27a07f] active:scale-[0.93] flex items-center justify-center transition-all shadow-sm"
                  >
                    <Ico.Send c="w-3.5 h-3.5 text-white" />
                  </button>
                )}
              </div>

              <p className="text-center text-[10.5px] text-stone-300 dark:text-stone-700 mt-2">
                SENASICA · DOF · USDA · Handeia Wiki
              </p>
            </div>
          </div>
        </div>

      </div>
    </>
  )
}