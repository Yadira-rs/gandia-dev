import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { HTIBadge } from '../../components/ui/radar/HTIBadge'
import type { VerificationStatus } from '../../components/ui/radar/HTIBadge'

// ─── TYPES ────────────────────────────────────────────────────────────────────
type Perfil = 'Productor' | 'Exportador' | 'MVZ' | 'Union' | 'Auditor'

interface SearchResult {
  question:     string
  answer:       string
  fuentes:      { tipo: string; count: number; color: string }[]
  related:      RelatedNoticia[]
  loading:      boolean
  perspectivas?: { oficial: string; campo: string } | null
}

interface RelatedNoticia {
  id:                  string
  titulo:              string
  categoria:           string
  tiempo_relativo:     string
  trust_index:         number
  verification_status: VerificationStatus
}

// ─── SUGERENCIAS ─────────────────────────────────────────────────────────────
const SUGERENCIAS_GRID = [
  { label: '¿Qué noticias afectan exportación esta semana?',   icon: '📦' },
  { label: 'Estado sanitario en Durango y Chihuahua hoy',      icon: '🩺' },
  { label: 'Resumen de precios del becerro últimos 7 días',    icon: '💰' },
  { label: '¿Cómo afecta la normativa USDA a productores?',   icon: '📋' },
  { label: '¿Hay alguna alerta sanitaria activa en México?',   icon: '⚠️' },
  { label: 'Compara situación sanitaria norte vs sur',         icon: '🗺️' },
]

const PERFILES: Perfil[] = ['Productor', 'Exportador', 'MVZ', 'Union', 'Auditor']

// ─── ICONS ────────────────────────────────────────────────────────────────────
const Ico = {
  Back: ({ c = 'w-3.5 h-3.5' }: { c?: string }) => (
    <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
    </svg>
  ),
  Send: ({ c = 'w-3.5 h-3.5' }: { c?: string }) => (
    <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>
    </svg>
  ),
  Spark: ({ c = 'w-3.5 h-3.5' }: { c?: string }) => (
    <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
    </svg>
  ),
  Search: ({ c = 'w-4 h-4' }: { c?: string }) => (
    <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7.5"/><line x1="20.5" y1="20.5" x2="16.1" y2="16.1"/>
    </svg>
  ),
  ChevronDown: ({ c = 'w-3 h-3' }: { c?: string }) => (
    <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  ),
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function RadarSearchPage() {
  const navigate      = useNavigate()
  const [params]      = useSearchParams()

  const initialQ      = params.get('q')      ?? ''
  const initialPerfil = (params.get('perfil') ?? 'Productor') as Perfil

  const [perfil,      setPerfil]      = useState<Perfil>(initialPerfil)
  const [profileOpen, setProfileOpen] = useState(false)
  const [query,       setQuery]       = useState('')
  const [focused,     setFocused]     = useState(false)
  const [result,      setResult]      = useState<SearchResult | null>(null)
  const [barLeft,     setBarLeft]     = useState(0)

  const inputRef   = useRef<HTMLInputElement>(null)
  const mainRef    = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)

  // ─── Sidebar-aware bar ────────────────────────────────────────────────────
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

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node))
        setProfileOpen(false)
    }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  // ─── Auto-run si viene query en URL ───────────────────────────────────────
  useEffect(() => {
    if (initialQ) void runSearch(initialQ)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ─── Fetch noticias del contexto ──────────────────────────────────────────
  const fetchContext = useCallback(async () => {
    const { data } = await supabase
      .from('v_noticias_feed')
      .select('id, titulo, categoria, resumen_general, fuente, trust_index, verification_status, tiempo_relativo')
      .order('trust_index', { ascending: false })
      .limit(20)
    return data ?? []
  }, [])

  // ─── Run search via Edge Function ─────────────────────────────────────────
  const runSearch = useCallback(async (q: string) => {
    if (!q.trim()) return
    const newResult: SearchResult = {
      question: q.trim(),
      answer:   '',
      fuentes:  [],
      related:  [],
      loading:  true,
      perspectivas: null,
    }
    setResult(newResult)
    setQuery('')
    window.scrollTo({ top: 0, behavior: 'smooth' })

    try {
      const noticias = await fetchContext()

      // Clasificar fuentes consultadas
      const oficial     = noticias.filter((n: { trust_index: number }) => n.trust_index >= 90).length
      const verificado  = noticias.filter((n: { trust_index: number }) => n.trust_index >= 75 && n.trust_index < 90).length
      const comunidad   = noticias.filter((n: { trust_index: number }) => n.trust_index < 60).length
      const fuentesInfo = [
        ...(oficial    > 0 ? [{ tipo: `${oficial} fuente${oficial > 1 ? 's' : ''} oficial${oficial > 1 ? 'es' : ''}`,   count: oficial,    color: '#2FAF8F' }] : []),
        ...(verificado > 0 ? [{ tipo: `${verificado} verificad${verificado > 1 ? 'as' : 'a'}`,                           count: verificado, color: '#d97706' }] : []),
        ...(comunidad  > 0 ? [{ tipo: `${comunidad} comunitari${comunidad > 1 ? 'os' : 'o'}`,                            count: comunidad,  color: '#78716c' }] : []),
      ]

      const ctx = noticias
        .map((n: { trust_index: number; categoria: string; titulo: string; resumen_general: string; fuente: string }) =>
          `[${n.trust_index >= 90 ? 'OFICIAL' : n.trust_index >= 75 ? 'VERIFICADO' : 'COMUNIDAD'}][${n.categoria}] ${n.titulo}: ${n.resumen_general} (${n.fuente})`
        )
        .join('\n')

      const { data: fnData, error: fnError } = await supabase.functions.invoke('radar-ai', {
        body: {
          type:    'search',
          query:   q.trim(),
          perfil,
          context: ctx,
        },
      })

      if (fnError) throw fnError

      const answer: string           = fnData?.answer        ?? ''
      const perspectivas             = fnData?.perspectivas  ?? null

      // Noticias relacionadas
      const terms   = q.toLowerCase().split(' ').filter((t: string) => t.length > 4)
      const related = (noticias as RelatedNoticia[]).filter(n =>
        terms.some((t: string) =>
          n.titulo.toLowerCase().includes(t) ||
          n.categoria.toLowerCase().includes(t)
        )
      ).slice(0, 3)

      const finalResult: SearchResult = {
        question:    q.trim(),
        answer,
        fuentes:     fuentesInfo,
        related,
        loading:     false,
        perspectivas,
      }
      setResult(finalResult)

    } catch (err) {
      console.error('Error en search:', err)
      setResult({
        ...newResult,
        loading: false,
        answer:  'No se pudo procesar la consulta. Verifica tu conexión o intenta de nuevo.',
      })
    }
  }, [perfil, fetchContext])

  const handleSubmit = () => {
    if (!query.trim() || result?.loading) return
    void runSearch(query)
  }

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600&display=swap');
        .np * { -webkit-font-smoothing: antialiased; }
        .np, .np * { font-family: 'Geist', system-ui, sans-serif; }
        .s  { font-family: 'Instrument Serif', Georgia, serif; }
        .si { font-family: 'Instrument Serif', Georgia, serif; font-style: italic; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #e7e5e4; border-radius: 999px; }
        .dark ::-webkit-scrollbar-thumb { background: #3c3836; }
        .np *:focus { outline: none !important; box-shadow: none !important; }
        @keyframes fu { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
        .fu { animation: fu 360ms cubic-bezier(.16,1,.3,1) both; }
        @keyframes sh {
          0%   { background-position: -500px 0; }
          100% { background-position:  500px 0; }
        }
        .sh {
          background: linear-gradient(90deg, #f0efee 25%, #e8e7e5 50%, #f0efee 75%);
          background-size: 500px 100%;
          animation: sh 1.5s ease-in-out infinite;
        }
        .dark .sh {
          background: linear-gradient(90deg, #1c1917 25%, #262220 50%, #1c1917 75%);
          background-size: 500px 100%;
        }
        .sb { transition: box-shadow 200ms ease; }
        .sb.active { box-shadow: 0 6px 24px rgba(0,0,0,.10); }
        .dark .sb.active { box-shadow: 0 6px 28px rgba(0,0,0,.40); }
        @keyframes dd { from { opacity:0; transform:translateY(-4px) scale(.98) } to { opacity:1; transform:translateY(0) scale(1) } }
        .dd { animation: dd 140ms cubic-bezier(.16,1,.3,1); }
        @keyframes sug { from { opacity:0; transform:translateY(4px) } to { opacity:1; transform:translateY(0) } }
        .sug { animation: sug 200ms ease both; }
      `}</style>

      <div ref={mainRef} className="np min-h-screen bg-[#fafaf9] dark:bg-[#0c0a09]">

        {/* ── HEADER ──────────────────────────────────────────────────────── */}
        <header className="max-w-[760px] mx-auto px-8 pt-10 pb-0">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/noticias')}
              className="flex items-center gap-2 text-[12.5px] font-medium text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
            >
              <Ico.Back />
              Radar
            </button>

            {/* Selector perfil */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen(p => !p)}
                className="flex items-center gap-1.5 h-7 px-3 rounded-full text-[11.5px] font-medium text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700/60 hover:border-stone-300 transition-colors bg-white dark:bg-transparent"
              >
                {perfil}
                <Ico.ChevronDown c={`w-3 h-3 text-stone-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
              </button>
              {profileOpen && (
                <div className="dd absolute right-0 top-full mt-1.5 w-32 bg-white dark:bg-[#1c1917] rounded-xl border border-stone-200/80 dark:border-stone-800 shadow-[0_8px_24px_rgba(0,0,0,.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,.4)] overflow-hidden z-50 py-1">
                  {PERFILES.map(p => (
                    <button
                      key={p}
                      onClick={() => { setPerfil(p); setProfileOpen(false) }}
                      className={`w-full text-left px-4 py-2 text-[12px] transition-colors ${
                        perfil === p
                          ? 'text-[#2FAF8F] font-semibold'
                          : 'text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800/60'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ── MAIN ────────────────────────────────────────────────────────── */}
        <main className="max-w-[760px] mx-auto px-8 pb-48">

          {/* ESTADO VACÍO — sin consulta activa */}
          {!result && (
            <div className="mt-16 fu">
              <p className="s text-[32px] text-stone-900 dark:text-stone-50 leading-[1.2] mb-2">
                Search<span style={{ color: '#2FAF8F' }}>.</span>
              </p>
              <p className="text-[14px] text-stone-400 dark:text-stone-500 mb-12">
                Pregúntale al sector ganadero mexicano
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {SUGERENCIAS_GRID.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => void runSearch(s.label)}
                    className="sug text-left p-4 rounded-xl border border-stone-200/70 dark:border-stone-800/60 bg-white dark:bg-[#141210] hover:border-stone-300 dark:hover:border-stone-700 hover:shadow-sm transition-all duration-150 group"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <span className="text-[18px] mb-2 block">{s.icon}</span>
                    <span className="text-[13px] font-medium text-stone-700 dark:text-stone-300 group-hover:text-stone-900 dark:group-hover:text-stone-50 leading-snug transition-colors">
                      {s.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* RESULTADO */}
          {result && (
            <div className="mt-14 fu">

              {/* Pregunta como titular */}
              <p className="text-[10.5px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-[0.12em] mb-3">
                Consulta
              </p>
              <h2 className="s text-[28px] text-stone-900 dark:text-stone-50 leading-[1.28] mb-8">
                {result.question}
              </h2>

              {/* Fuentes consultadas */}
              {result.fuentes.length > 0 && (
                <div className="flex items-center gap-2 mb-6 flex-wrap">
                  <span className="text-[10.5px] text-stone-400 dark:text-stone-500">Basado en</span>
                  {result.fuentes.map((f, i) => (
                    <span
                      key={i}
                      className="text-[10.5px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ color: f.color, background: `${f.color}15` }}
                    >
                      {f.tipo}
                    </span>
                  ))}
                </div>
              )}

              {/* Header respuesta */}
              <div className="flex items-center gap-3 mb-5">
                <Ico.Spark c="w-3 h-3 text-[#2FAF8F]" />
                <span className="text-[10.5px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-[0.1em]">
                  Análisis · {perfil}
                </span>
                <div className="flex-1 h-px bg-stone-100 dark:bg-stone-800/60" />
              </div>

              {/* Respuesta */}
              {result.loading ? (
                <div className="space-y-3 py-1">
                  {[100, 90, 82, 68, 88, 75].map((w, i) => (
                    <div key={i} className="sh h-[14px] rounded-full" style={{ width: `${w}%` }} />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {result.answer.split('\n\n').filter(Boolean).map((para, i) => (
                    <p key={i} className="text-[15px] text-stone-600 dark:text-stone-300 leading-[1.78]">
                      {para.replace(/\n/g, ' ')}
                    </p>
                  ))}
                </div>
              )}

              {/* Perspectivas múltiples */}
              {!result.loading && result.perspectivas && (
                <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-5 rounded-xl border border-stone-200/70 dark:border-stone-800/60 bg-white dark:bg-[#141210]">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 rounded-full bg-[#2FAF8F]" />
                      <span className="text-[10.5px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-[0.08em]">
                        Fuentes oficiales
                      </span>
                    </div>
                    <p className="text-[13px] text-stone-600 dark:text-stone-300 leading-[1.72]">
                      {result.perspectivas.oficial}
                    </p>
                  </div>
                  <div className="p-5 rounded-xl border border-stone-200/70 dark:border-stone-800/60 bg-white dark:bg-[#141210]">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 rounded-full bg-[#d97706]" />
                      <span className="text-[10.5px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-[0.08em]">
                        Reportes de campo
                      </span>
                    </div>
                    <p className="text-[13px] text-stone-600 dark:text-stone-300 leading-[1.72]">
                      {result.perspectivas.campo}
                    </p>
                  </div>
                </div>
              )}

              {/* Noticias relacionadas */}
              {!result.loading && result.related.length > 0 && (
                <div className="mt-12">
                  <div className="flex items-center gap-3 mb-0">
                    <span className="text-[10.5px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-[0.1em]">
                      Noticias relacionadas
                    </span>
                    <div className="flex-1 h-px bg-stone-100 dark:bg-stone-800/60" />
                  </div>
                  <div className="divide-y divide-stone-100 dark:divide-stone-800/50">
                    {result.related.map(n => (
                      <div
                        key={n.id}
                        className="py-5 cursor-pointer group"
                        onClick={() => navigate(`/noticias/${n.id}`)}
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-[10.5px] font-semibold text-stone-400 dark:text-stone-500 tracking-[0.08em]">
                            {n.categoria}
                          </span>
                          <span className="text-stone-200 dark:text-stone-700">·</span>
                          <span className="text-[10.5px] text-stone-400 dark:text-stone-500">
                            {n.tiempo_relativo}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <p className="text-[14px] font-medium text-stone-700 dark:text-stone-300 group-hover:text-stone-900 dark:group-hover:text-stone-50 leading-snug transition-colors">
                            {n.titulo}
                          </p>
                          <HTIBadge score={n.trust_index} status={n.verification_status} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Nueva pregunta */}
              {!result.loading && (
                <div className="mt-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex-1 h-px bg-stone-100 dark:bg-stone-800/60" />
                    <span className="text-[10.5px] font-semibold text-stone-300 dark:text-stone-600 uppercase tracking-[0.1em]">
                      Seguir preguntando
                    </span>
                    <div className="flex-1 h-px bg-stone-100 dark:bg-stone-800/60" />
                  </div>
                </div>
              )}
            </div>
          )}
        </main>

        {/* ── BARRA FIJA INFERIOR ─────────────────────────────────────────── */}
        <div
          className="fixed bottom-0 right-0 z-30 pointer-events-none transition-[left] duration-[240ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
          style={{ left: barLeft }}
        >
          <div className="h-16 bg-gradient-to-t from-[#fafaf9] via-[#fafaf9]/70 to-transparent dark:from-[#0c0a09] dark:via-[#0c0a09]/70" />

          <div className="bg-[#fafaf9]/95 dark:bg-[#0c0a09]/95 backdrop-blur-2xl pb-7 pointer-events-auto">
            <div className="max-w-[760px] mx-auto px-8">

              {focused && !query && (
                <div className="flex flex-wrap gap-1.5 mb-2.5 max-h-7 overflow-hidden">
                  {SUGERENCIAS_GRID.slice(0, 3).map((s, i) => (
                    <button
                      key={i}
                      onMouseDown={() => { setQuery(s.label); setTimeout(() => inputRef.current?.focus(), 10) }}
                      className="sug shrink-0 h-7 px-3 rounded-full border border-stone-200 dark:border-stone-700/60 bg-white/80 dark:bg-stone-800/60 text-[11.5px] text-stone-500 dark:text-stone-400 hover:border-stone-300 hover:text-stone-700 transition-all whitespace-nowrap"
                      style={{ animationDelay: `${i * 40}ms` }}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              )}

              <div className={`sb flex items-center gap-3 bg-white dark:bg-[#1c1917] border border-stone-200/80 dark:border-stone-800/60 rounded-2xl px-4 shadow-[0_2px_16px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_20px_rgba(0,0,0,0.30)] ${focused ? 'active' : ''}`}>
                <Ico.Search c="w-4 h-4 text-stone-300 dark:text-stone-600 shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  onKeyDown={e => { if (e.key === 'Enter') handleSubmit() }}
                  placeholder="Pregunta sobre el sector ganadero..."
                  style={{ outline: 'none', boxShadow: 'none', WebkitAppearance: 'none' }}
                  className="flex-1 h-12 bg-transparent text-[14px] text-stone-800 dark:text-stone-100 placeholder-stone-300 dark:placeholder-stone-600"
                />
                {(query || result?.loading) && (
                  <button
                    onClick={handleSubmit}
                    disabled={result?.loading}
                    className="shrink-0 w-8 h-8 rounded-xl bg-[#2FAF8F] hover:bg-[#27a07f] active:scale-[0.93] flex items-center justify-center transition-all shadow-sm disabled:opacity-60"
                  >
                    {result?.loading
                      ? <div className="w-3.5 h-3.5 border-[1.5px] border-white/30 border-t-white rounded-full animate-spin" />
                      : <Ico.Send c="w-3.5 h-3.5 text-white" />
                    }
                  </button>
                )}
              </div>

              <p className="text-center text-[10.5px] text-stone-300 dark:text-stone-700 mt-2">
                Las respuestas son generadas por IA y pueden contener errores · Verifica con fuentes oficiales
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}