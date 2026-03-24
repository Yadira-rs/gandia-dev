import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { useUser } from '../../context/UserContext'
import { HTIBadge, HTIStatusBadge } from '../../components/ui/radar/HTIBadge'
import type { VerificationStatus } from '../../components/ui/radar/HTIBadge'

// ─── TYPES ────────────────────────────────────────────────────────────────────
type Perfil = 'Productor' | 'Exportador' | 'MVZ' | 'Union' | 'Auditor'

interface Noticia {
  id:                  string
  slug:                string
  titulo:              string
  resumen_general:     string
  resumenes_ia:        Record<string, string>
  fuente:              string
  fuente_origen:       string
  categoria:           string
  tiempo_relativo:     string
  lectura_minutos:     number
  urgente:             boolean
  urgencia_nivel:      string
  relevancia:          Record<string, number>
  trust_index:         number
  verification_status: VerificationStatus
}

interface DailySummary {
  id:                  string
  resumen_texto:       string
  noticias_procesadas: number
  generado_en:         string
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const CATEGORIAS = ['Todas', 'Sanidad', 'Precios', 'Normativa', 'Clima', 'Exportacion', 'Mercados', 'General']
const PERFILES:   Perfil[] = ['Productor', 'Exportador', 'MVZ', 'Union', 'Auditor']

// ─── ICONS ────────────────────────────────────────────────────────────────────
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
  ArrowRight: ({ c = 'w-3.5 h-3.5' }: { c?: string }) => (
    <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
    </svg>
  ),
  Send: ({ c = 'w-3.5 h-3.5' }: { c?: string }) => (
    <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>
    </svg>
  ),
  Refresh: ({ c = 'w-3.5 h-3.5' }: { c?: string }) => (
    <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
    </svg>
  ),
  ChevronDown: ({ c = 'w-3 h-3' }: { c?: string }) => (
    <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  ),
  Plus: ({ c = 'w-3.5 h-3.5' }: { c?: string }) => (
    <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function horaGenerado(iso: string) {
  const d = new Date(iso)
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function NoticiasPage() {
  const navigate = useNavigate()
  const { profile } = useUser()

  const [perfil,      setPerfil]      = useState<Perfil>('Productor')
  const [filtro,      setFiltro]      = useState('Todas')
  const [profileOpen, setProfileOpen] = useState(false)
  const [query,       setQuery]       = useState('')
  const [focused,     setFocused]     = useState(false)
  const [mode,        setMode]        = useState<'radar' | 'search'>('radar')
  const [barLeft,     setBarLeft]     = useState(0)
  const [scrolled,    setScrolled]    = useState(false)
  const [hasCreatorProfile, setHasCreatorProfile] = useState(false)

  // Wiki: IDs de noticias que tienen Hechos vinculados
  const [hechoNoticiaIds, setHechoNoticiaIds] = useState<Set<string>>(new Set())

  // Noticias
  const [noticias,        setNoticias]        = useState<Noticia[]>([])
  const [loadingNoticias, setLoadingNoticias] = useState(true)
  const [errorNoticias,   setErrorNoticias]   = useState<string | null>(null)

  // Daily summary — viene de Supabase, no de Claude en tiempo real
  const [summary,        setSummary]        = useState('')
  const [summaryLoading, setSummaryLoading] = useState(true)
  const [summaryAge,     setSummaryAge]     = useState('')

  const mainRef    = useRef<HTMLDivElement>(null)
  const inputRef   = useRef<HTMLInputElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)

  // ─── Fetch noticias ────────────────────────────────────────────────────────
  const fetchNoticias = useCallback(async () => {
    setLoadingNoticias(true)
    setErrorNoticias(null)
    try {
      let q = supabase
        .from('v_noticias_feed')
        .select('*')
        .order('urgente', { ascending: false })

      if (filtro !== 'Todas') {
        q = q.eq('categoria', filtro.toUpperCase())
      }

      const { data, error } = await q
      if (error) throw error
      setNoticias((data as Noticia[]) ?? [])

      // Cargar vinculaciones Wiki en paralelo
      const { data: vinculos } = await supabase
        .from('wiki_hecho_noticias')
        .select('noticia_id')
      if (vinculos) {
        setHechoNoticiaIds(new Set((vinculos as { noticia_id: string }[]).map(v => v.noticia_id)))
      }
    } catch (err) {
      console.error('Error al cargar noticias:', err)
      setErrorNoticias('No se pudieron cargar las noticias.')
    } finally {
      setLoadingNoticias(false)
    }
  }, [filtro])

  useEffect(() => { void fetchNoticias() }, [fetchNoticias])

  // ─── Verificar si el usuario ya tiene perfil de creador activo ────────────
  useEffect(() => {
    if (!profile?.user_id) return
    const check = async () => {
      const { data } = await supabase
        .from('creator_profiles')
        .select('id')
        .eq('user_id', profile.user_id)
        .eq('status', 'activo')
        .single()
      setHasCreatorProfile(!!data)
    }
    void check()
  }, [profile?.user_id])

  // ─── Fetch daily summary desde Supabase ───────────────────────────────────
  useEffect(() => {
    const fetchSummary = async () => {
      setSummaryLoading(true)
      const { data } = await supabase
        .from('daily_summary')
        .select('*')
        .eq('activo', true)
        .order('generado_en', { ascending: false })
        .limit(1)
        .single()

      if (data) {
        const s = data as DailySummary
        setSummary(s.resumen_texto)
        setSummaryAge(horaGenerado(s.generado_en))
      }
      setSummaryLoading(false)
    }
    void fetchSummary()
  }, [])

  // ─── Ordenar por relevancia del perfil ───────────────────────────────────
  const sortedNews = [...noticias].sort((a, b) => {
    const ra = a.relevancia?.[perfil] ?? 0
    const rb = b.relevancia?.[perfil] ?? 0
    return rb - ra
  })

  // ─── Scroll detector para sticky nav ─────────────────────────────────────
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

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

  // ─── Close profile dropdown ───────────────────────────────────────────────
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node))
        setProfileOpen(false)
    }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  // ─── Submit búsqueda → ir a Search ────────────────────────────────────────
  const handleSubmit = () => {
    if (!query.trim()) return
    navigate(`/noticias/search?q=${encodeURIComponent(query.trim())}&perfil=${perfil}`)
  }

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600&display=swap');
        .np * { -webkit-font-smoothing: antialiased; }
        .np { font-family: 'Geist', 'DM Sans', system-ui, sans-serif; }
        .s  { font-family: 'Instrument Serif', Georgia, serif; }
        ::-webkit-scrollbar { width: 3px; height: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #e7e5e4; border-radius: 999px; }
        .dark ::-webkit-scrollbar-thumb { background: #3c3836; }
        .np *:focus { outline: none !important; box-shadow: none !important; }
        .np *:focus-visible { outline: none !important; box-shadow: none !important; }
        @keyframes fu { from { opacity:0; transform:translateY(9px) } to { opacity:1; transform:translateY(0) } }
        .fu { animation: fu 380ms cubic-bezier(.16,1,.3,1) both; }
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
        .sb.active { box-shadow: 0 6px 24px rgba(0,0,0,0.10); }
        .dark .sb.active { box-shadow: 0 6px 28px rgba(0,0,0,0.40); }
        @keyframes dd { from { opacity:0; transform:translateY(-4px) scale(.98) } to { opacity:1; transform:translateY(0) scale(1) } }
        .dd { animation: dd 140ms cubic-bezier(.16,1,.3,1); }
        @keyframes sug { from { opacity:0; transform:translateY(4px) } to { opacity:1; transform:translateY(0) } }
        .sug { animation: sug 200ms ease both; }
        .np *:focus { outline: none !important; }
      `}</style>

      <div ref={mainRef} className="np min-h-screen bg-[#fafaf9] dark:bg-[#0c0a09]">

        {/* ── STICKY CATEGORY NAV ─────────────────────────────────────────── */}
        <div
          className={`fixed top-0 right-0 z-20 transition-all duration-300 ${
            scrolled
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 -translate-y-2 pointer-events-none'
          }`}
          style={{ left: barLeft }}
        >
          <div className="bg-[#fafaf9]/90 dark:bg-[#0c0a09]/90 backdrop-blur-xl border-b border-stone-100/80 dark:border-stone-800/50">
            <div className="max-w-[860px] mx-auto px-8 h-10 flex items-center justify-between gap-4">
              <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-none">
                {CATEGORIAS.map(f => (
                  <button
                    key={f}
                    onClick={() => setFiltro(f)}
                    className={`shrink-0 px-3 h-6 rounded-md text-[11px] font-medium transition-all duration-150 ${
                      filtro === f
                        ? 'text-stone-900 dark:text-stone-100 font-semibold'
                        : 'text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'
                    }`}
                  >
                    {f === 'Todas' ? 'Todas' : f.charAt(0) + f.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
              <div className="relative shrink-0" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen(p => !p)}
                  className="flex items-center gap-1 text-[11px] font-medium text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
                >
                  {perfil}
                  <Ico.ChevronDown c="w-3 h-3" />
                </button>
                {profileOpen && (
                  <div className="dd absolute right-0 top-full mt-1.5 w-32 bg-white dark:bg-[#1c1917] rounded-xl border border-stone-200/80 dark:border-stone-800 shadow-[0_8px_24px_rgba(0,0,0,.08)] overflow-hidden z-50 py-1">
                    {PERFILES.map(p => (
                      <button key={p} onClick={() => { setPerfil(p); setProfileOpen(false) }}
                        className={`w-full text-left px-4 py-2 text-[12px] transition-colors ${
                          perfil === p ? 'text-[#2FAF8F] font-semibold' : 'text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800/60'
                        }`}>
                        {p}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── HEADER EDITORIAL ────────────────────────────────────────────── */}
        <header className="max-w-[860px] mx-auto px-8 pt-10 pb-6">
          <div className="flex items-start justify-between">

            {/* Título */}
            <div>
              <h1 className="s text-[26px] font-normal tracking-[-0.02em] text-stone-900 dark:text-stone-50 leading-none">
                {mode === 'search' ? 'Search' : 'Noticias'}<span style={{ color: '#2FAF8F' }}>.</span>
              </h1>
              <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-1.5 leading-none tracking-[0.01em]">
                {mode === 'search' ? 'Pregunta sobre el sector ganadero' : 'Sector ganadero · Actualizado cada 6 h'}
              </p>
            </div>

            {/* Acciones */}
            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={() => navigate(hasCreatorProfile ? '/creadores/nuevo' : '/creadores')}
                className="text-[11.5px] font-medium text-stone-400 dark:text-stone-500 hover:text-[#2FAF8F] transition-colors"
              >
                + Enviar aporte
              </button>
              <div className="w-px h-3.5 bg-stone-200 dark:bg-stone-700/60" />
              {/* Perfil */}
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen(p => !p)}
                  className="flex items-center gap-1.5 text-[11.5px] font-medium text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-50 transition-colors"
                >
                  {perfil}
                  <Ico.ChevronDown c={`w-3 h-3 text-stone-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                </button>
                {profileOpen && (
                  <div className="dd absolute right-0 top-full mt-2 w-32 bg-white dark:bg-[#1c1917] rounded-xl border border-stone-200/80 dark:border-stone-800 shadow-[0_8px_24px_rgba(0,0,0,.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,.4)] overflow-hidden z-50 py-1">
                    {PERFILES.map(p => (
                      <button key={p} onClick={() => { setPerfil(p); setProfileOpen(false) }}
                        className={`w-full text-left px-4 py-2 text-[12px] transition-colors ${
                          perfil === p ? 'text-[#2FAF8F] font-semibold' : 'text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800/60'
                        }`}>
                        {p}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Línea divisoria + categorías inline */}
          {mode === 'radar' && (
          <div className="mt-6 pt-4 border-t border-stone-100 dark:border-stone-800/60 flex items-center gap-0.5 overflow-x-auto scrollbar-none">
            {CATEGORIAS.map(f => (
              <button
                key={f}
                onClick={() => setFiltro(f)}
                className={`shrink-0 px-3 h-6 rounded-md text-[11.5px] font-medium transition-all duration-150 ${
                  filtro === f
                    ? 'text-stone-900 dark:text-stone-100 font-semibold'
                    : 'text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-200'
                }`}
              >
                {f === 'Todas' ? 'Todas' : f.charAt(0) + f.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
          )}
        </header>

        {/* ── MAIN ────────────────────────────────────────────────────────── */}
        <main className="max-w-[860px] mx-auto px-8 pb-48">

          {/* ── MODO SEARCH — pantalla de búsqueda ── */}
          {mode === 'search' && (
            <div className="fu flex flex-col items-center justify-center min-h-[50vh] text-center">
              <h2 className="s text-[32px] text-stone-900 dark:text-stone-50 leading-tight mb-2">
                ¿Qué quieres saber<span style={{ color: '#2FAF8F' }}>?</span>
              </h2>
              <p className="text-[13px] text-stone-400 dark:text-stone-500 mb-12">
                Análisis del sector ganadero mexicano
              </p>
              <div className="flex flex-wrap gap-2 justify-center max-w-[560px]">
                {[
                  'Panorama ganadero hoy',
                  'Normativa USDA y México',
                  'Sanidad en el norte',
                  'Precios del becerro',
                  'Alertas sanitarias activas',
                  'Temporada de lluvias',
                ].map((s, i) => (
                  <button
                    key={i}
                    onClick={() => navigate(`/noticias/search?q=${encodeURIComponent(s)}&perfil=${perfil}`)}
                    className="h-8 px-4 rounded-full text-[12.5px] text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700/60 hover:border-stone-400 dark:hover:border-stone-500 hover:text-stone-900 dark:hover:text-stone-50 transition-all duration-150 bg-white dark:bg-transparent"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── MODO NOTICIAS — feed editorial ── */}
          {mode === 'radar' && (<>

          {/* RESUMEN DIARIO */}
          <div className="mt-10 fu rounded-2xl border border-stone-200/70 dark:border-stone-800/60 bg-white dark:bg-[#141210] px-7 py-6 shadow-[0_1px_12px_rgba(0,0,0,0.04)] dark:shadow-none">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Ico.Spark c="w-3.5 h-3.5 text-[#2FAF8F]" />
                <span className="text-[11px] font-medium text-stone-500 dark:text-stone-400 tracking-[0.03em]">
                  Resumen Inteligente
                </span>
              </div>
              {summaryAge && (
                <span className="text-[11px] text-stone-300 dark:text-stone-600">
                  Generado a las {summaryAge}
                </span>
              )}
            </div>

            {summaryLoading ? (
              <div className="space-y-2.5 py-0.5">
                {[100, 88, 68].map((w, i) => (
                  <div key={i} className="sh h-[15px] rounded-full" style={{ width: `${w}%` }} />
                ))}
              </div>
            ) : summary ? (
              <>
                <p className="text-[15px] text-stone-700 dark:text-stone-300 leading-[1.72]">
                  {summary}
                </p>
                <button
                  onClick={() => navigate(`/noticias/search?q=Dame+el+análisis+completo+del+panorama+ganadero+de+hoy&perfil=${perfil}`)}
                  className="mt-4 flex items-center gap-1.5 text-[12px] font-medium text-[#2FAF8F] hover:text-[#1a9070] transition-colors"
                >
                  Ver análisis completo
                  <Ico.ArrowRight c="w-3.5 h-3.5" />
                </button>
              </>
            ) : (
              <p className="text-[13px] text-stone-400 dark:text-stone-500 italic">
                El análisis del día estará disponible en cuanto el pipeline procese las primeras noticias.
              </p>
            )}
          </div>

          {/* LOADING */}
          {loadingNoticias && (
            <div className="divide-y divide-stone-100 dark:divide-stone-800/50">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="py-8">
                  <div className="sh h-3 w-24 rounded-full mb-3" />
                  <div className="sh h-5 w-full rounded-full mb-2" />
                  <div className="sh h-5 w-3/4 rounded-full mb-4" />
                  <div className="sh h-3 w-2/3 rounded-full" />
                </div>
              ))}
            </div>
          )}

          {/* ERROR */}
          {errorNoticias && !loadingNoticias && (
            <div className="py-12 text-center">
              <p className="text-[13px] text-stone-400 dark:text-stone-500 mb-3">{errorNoticias}</p>
              <button
                onClick={() => void fetchNoticias()}
                className="text-[12px] font-medium text-[#2FAF8F] hover:text-[#1a9070] transition-colors"
              >
                Reintentar
              </button>
            </div>
          )}

          {/* SIN RESULTADOS */}
          {!loadingNoticias && !errorNoticias && sortedNews.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-[13px] text-stone-400 dark:text-stone-500">
                No hay noticias en esta categoría.
              </p>
            </div>
          )}

          {/* LISTA */}
          {!loadingNoticias && !errorNoticias && (
            <div className="divide-y divide-stone-100 dark:divide-stone-800/50">
              {sortedNews.map((n, i) => (
                <article
                  key={n.id}
                  className="group/article fu py-8 -mx-4 px-4 rounded-xl transition-colors duration-150 cursor-pointer"
                  style={{
                    animationDelay: `${i * 35}ms`,
                    opacity: n.trust_index < 50 ? 0.7 : 1,
                  }}
                  onClick={() => navigate(`/noticias/${n.id}`)}
                >
                  <div className="flex items-center gap-2 mb-2.5">
                    {n.urgente && (
                      <span className="text-[9.5px] font-bold text-rose-500 uppercase tracking-[0.05em]">
                        Urgente ·
                      </span>
                    )}
                    <span className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 tracking-[0.06em]">
                      {n.categoria}
                    </span>
                    <span className="text-stone-200 dark:text-stone-700">·</span>
                    <span className="text-[11px] text-stone-400 dark:text-stone-500">
                      {n.tiempo_relativo}
                    </span>
                    {hechoNoticiaIds.has(n.id) && (
                      <span className="inline-flex items-center gap-1 text-[9.5px] font-semibold text-[#2FAF8F] bg-[#2FAF8F]/10 px-1.5 py-0.5 rounded-full">
                        <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        Wiki
                      </span>
                    )}
                  </div>

                  <h3 className="text-[16px] font-semibold tracking-[-0.022em]
                                  text-stone-700 dark:text-stone-300
                                  group-hover/article:text-stone-900 dark:group-hover/article:text-stone-50
                                  leading-snug mb-2.5 transition-colors duration-150">
                    {n.titulo}
                  </h3>

                  <p className="text-[13.5px]
                                text-stone-500 dark:text-stone-400
                                group-hover/article:text-stone-700 dark:group-hover/article:text-stone-200
                                leading-[1.7] mb-3.5 transition-colors duration-150">
                    {n.resumenes_ia?.[perfil] ?? n.resumen_general}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11.5px] font-medium text-stone-400 dark:text-stone-500">
                        {n.fuente}
                      </span>
                      <span className="text-stone-200 dark:text-stone-700">·</span>
                      <span className="text-[11.5px] text-stone-400 dark:text-stone-500">
                        {n.lectura_minutos} min
                      </span>
                      {n.fuente_origen === 'api' && (
                        <span className="text-[10px] font-medium text-stone-300 dark:text-stone-600 bg-stone-100 dark:bg-stone-800/50 px-1.5 py-0.5 rounded">
                          IA
                        </span>
                      )}
                      {n.fuente_origen === 'comunidad' && (
                        <span className="text-[10px] font-medium text-[#2FAF8F] bg-[#2FAF8F]/10 px-1.5 py-0.5 rounded">
                          Comunidad
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <HTIBadge
                        score={n.trust_index}
                        status={n.verification_status}
                        showTooltip
                      />
                      <HTIStatusBadge status={n.verification_status} />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
          </>)}
        </main>

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
                  {(['radar', 'search'] as const).map(m => (
                    <button
                      key={m}
                      onMouseDown={() => { setMode(m); setTimeout(() => inputRef.current?.focus(), 10) }}
                      className={`shrink-0 h-7 px-3 rounded-full text-[11.5px] font-medium transition-all duration-150 ${
                        mode === m
                          ? 'bg-stone-800/40 dark:bg-stone-700/40 text-stone-200 dark:text-stone-200'
                          : 'text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300'
                      }`}
                    >
                      {m === 'radar' ? 'Radar' : 'Search'}
                    </button>
                  ))}
                  <button
                    onMouseDown={() => navigate('/wiki')}
                    className="shrink-0 h-7 px-3 rounded-full text-[11.5px] font-medium text-stone-400 dark:text-stone-500 hover:text-[#2FAF8F] transition-colors"
                  >
                    Wiki
                  </button>
                </div>
              )}

              {/* Input */}
              <div className={`sb flex items-center gap-2 bg-white dark:bg-[#1c1917] border border-stone-200/80 dark:border-stone-800/60 rounded-2xl px-4 shadow-[0_2px_16px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_20px_rgba(0,0,0,0.30)] ${focused ? 'active' : ''}`}>

                {/* Botón de modo — icono */}
                <button
                  onMouseDown={e => { e.preventDefault(); setMode(m => m === 'radar' ? 'search' : 'radar') }}
                  className={`shrink-0 flex items-center justify-center transition-colors ${
                    mode === 'search' ? 'text-[#2FAF8F]' : 'text-stone-300 dark:text-stone-600 hover:text-stone-500'
                  }`}
                  title={mode === 'radar' ? 'Cambiar a Search' : 'Cambiar a Radar'}
                >
                  {mode === 'search'
                    ? <Ico.Spark c="w-4 h-4" />
                    : <Ico.Search c="w-4 h-4" />
                  }
                </button>

                <div className="w-px h-3.5 bg-stone-200 dark:bg-stone-700/60 shrink-0" />

                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  onKeyDown={e => { if (e.key === 'Enter') handleSubmit() }}
                  placeholder={mode === 'search' ? 'Preguntar a la IA...' : 'Buscar en el feed...'}
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
                SENASICA · USDA · SNIIM · Handeia Radar
              </p>
            </div>
          </div>
        </div>

      </div>
    </>
  )
}