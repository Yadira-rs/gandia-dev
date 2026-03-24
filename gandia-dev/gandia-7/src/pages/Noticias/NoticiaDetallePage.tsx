import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { HTIBadge } from '../../components/ui/radar/HTIBadge'
import type { VerificationStatus } from '../../components/ui/radar/HTIBadge'

// ─── TYPES ───────────────────────────────────────────────────────────────────
type Perfil = 'Productor' | 'Exportador' | 'MVZ' | 'Union' | 'Auditor'

interface Noticia {
  id:                  string
  slug:                string
  titulo:              string
  cuerpo:              string
  fuente:              string
  fuente_origen:       string
  url_original:        string | null
  categoria:           string
  urgente:             boolean
  urgencia_nivel:      string
  resumen_general:     string
  resumenes_ia:        Record<string, string>
  impacto_ia:          string
  acciones_ia:         string[]
  relevancia:          Record<string, number>
  lectura_minutos:     number
  publicada_en:        string
  relacionadas:        string[]
  trust_index:         number
  verification_status: VerificationStatus
}

interface NoticiaRelacionada {
  id:                  string
  titulo:              string
  categoria:           string
  tiempo_relativo:     string
  trust_index:         number
  verification_status: VerificationStatus
}

interface WikiHechoVinculado {
  id:            string
  afirmacion:    string
  hti:           number
  fuente_nombre: string
  dominio:       string
}

// ─── ICONS ──────────────────────────────────────────────────────────────────
const Ico = {
  ArrowLeft: ({ c = 'w-4 h-4' }: { c?: string }) => (
    <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
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
  Send: ({ c = 'w-3.5 h-3.5' }: { c?: string }) => (
    <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>
    </svg>
  ),
  ChevronDown: ({ c = 'w-3 h-3' }: { c?: string }) => (
    <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  ),
  AlertTriangle: ({ c = 'w-3.5 h-3.5' }: { c?: string }) => (
    <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  ExternalLink: ({ c = 'w-3 h-3' }: { c?: string }) => (
    <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
    </svg>
  ),
  Shield: ({ c = 'w-3.5 h-3.5' }: { c?: string }) => (
    <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
}

const PERFILES: Perfil[]                           = ['Productor', 'Exportador', 'MVZ', 'Union', 'Auditor']
const URGENCIA_COLOR: Record<string, string>       = {
  alta:  'text-rose-500',
  media: 'text-amber-500',
  baja:  'text-emerald-500',
}

const DOMINIO_ICON: Record<string, string> = {
  sanidad:     '🧬',
  exportacion: '✈️',
  regulacion:  '⚖️',
  razas:       '🐄',
  nutricion:   '🌾',
  mercado:     '📈',
  bienestar:   '❤️',
  clima:       '🌦️',
}

function htiColor(hti: number) {
  if (hti >= 80) return '#2FAF8F'
  if (hti >= 60) return '#f59e0b'
  return '#ef4444'
}

function tiempoRelativo(fecha: string): string {
  const diff = Date.now() - new Date(fecha).getTime()
  const h = Math.floor(diff / 3600000)
  const d = Math.floor(diff / 86400000)
  if (h < 1)  return 'Hace menos de 1 hora'
  if (h < 24) return `Hace ${h} hora${h > 1 ? 's' : ''}`
  if (d < 7)  return `Hace ${d} día${d > 1 ? 's' : ''}`
  return new Date(fecha).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function NoticiaDetallePage() {
  const { id }    = useParams<{ id: string }>()
  const navigate  = useNavigate()

  const [perfil,      setPerfil]      = useState<Perfil>('Productor')
  const [profileOpen, setProfileOpen] = useState(false)
  const [scrollPct,   setScrollPct]   = useState(0)
  const [query,       setQuery]       = useState('')
  const [focused,     setFocused]     = useState(false)
  const [chatHistory, setChatHistory] = useState<{ q: string; a: string }[]>([])
  const [chatLoading, setChatLoading] = useState(false)
  const [barLeft,     setBarLeft]     = useState(0)

  // DB state
  const [noticia,     setNoticia]     = useState<Noticia | null>(null)
  const [relacionadas, setRelacionadas] = useState<NoticiaRelacionada[]>([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState<string | null>(null)

  // ── Wiki hechos vinculados ──────────────────────────────────────────────────
  const [wikiHechos, setWikiHechos] = useState<WikiHechoVinculado[]>([])

  const inputRef   = useRef<HTMLInputElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)
  const mainRef    = useRef<HTMLDivElement>(null)

  // ─── Fetch noticia ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return
    const fetchNoticia = async () => {
      setLoading(true)
      setError(null)

      const { data, error: err } = await supabase
        .from('noticias')
        .select('*')
        .eq('id', id)
        .eq('activa', true)
        .single()

      if (err || !data) {
        setError('No se encontró la noticia.')
        setLoading(false)
        return
      }

      const raw = data as Noticia
      // acciones_ia puede venir como string '[]' desde el insert
      if (typeof raw.acciones_ia === 'string') {
        try { raw.acciones_ia = JSON.parse(raw.acciones_ia) } catch { raw.acciones_ia = [] }
      }
      setNoticia(raw)

      if (data.relacionadas?.length > 0) {
        const { data: rel } = await supabase
          .from('v_noticias_feed')
          .select('id, titulo, categoria, tiempo_relativo, trust_index, verification_status')
          .in('id', data.relacionadas)
          .limit(3)
        setRelacionadas((rel as NoticiaRelacionada[]) ?? [])
      }

      // ── Buscar Hechos Wiki vinculados a esta noticia ───────────────────────
      const { data: vinculos } = await supabase
        .from('wiki_hecho_noticias')
        .select('hecho_id')
        .eq('noticia_id', id)

      if (vinculos && vinculos.length > 0) {
        const ids = (vinculos as { hecho_id: string }[]).map(v => v.hecho_id)
        const { data: hechos } = await supabase
          .from('wiki_hechos')
          .select('id,afirmacion,hti,fuente_nombre,dominio')
          .in('id', ids)
          .eq('estado', 'activo')
          .order('hti', { ascending: false })
        setWikiHechos((hechos as WikiHechoVinculado[]) ?? [])
      }

      setLoading(false)
    }
    void fetchNoticia()
  }, [id])

  // ─── Scroll progress ──────────────────────────────────────────────────────
  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement
      setScrollPct(Math.min(1, Math.max(0, el.scrollTop / (el.scrollHeight - el.clientHeight))))
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // ─── Sidebar bar ──────────────────────────────────────────────────────────
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

  // ─── Profile dropdown ─────────────────────────────────────────────────────
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node))
        setProfileOpen(false)
    }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  // ─── Chat — usa Edge Function (no Claude directo) ─────────────────────────
  const handleQuery = async () => {
    if (!query.trim() || chatLoading || !noticia) return
    const q = query.trim()
    setQuery('')
    setChatLoading(true)
    setChatHistory(prev => [...prev, { q, a: '' }])

    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke('radar-ai', {
        body: {
          type:    'article-chat',
          query:   q,
          perfil,
          context: `${noticia.titulo}\n\n${noticia.cuerpo.slice(0, 2000)}`,
        },
      })

      if (fnError) throw fnError

      const answer: string = fnData?.answer ?? 'No se pudo procesar la consulta.'
      setChatHistory(prev =>
        prev.map((h, i) => i === prev.length - 1 ? { ...h, a: answer } : h)
      )
    } catch (err) {
      console.error('Error en chat de artículo:', err)
      setChatHistory(prev =>
        prev.map((h, i) => i === prev.length - 1 ? { ...h, a: 'No se pudo procesar la consulta. Verifica tu conexión.' } : h)
      )
    }
    setChatLoading(false)
  }

  const sugerencias = noticia ? [
    `¿Cómo afecta esto a mi ${perfil === 'Productor' ? 'rancho' : 'operación'}?`,
    '¿Qué debo hacer esta semana?',
    `Impacto para ${perfil}`,
  ] : []

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
        .sb.active { box-shadow: 0 6px 24px rgba(0,0,0,.10); }
        .dark .sb.active { box-shadow: 0 6px 28px rgba(0,0,0,.40); }
        @keyframes answer-in { from { opacity:0; transform:translateY(6px) } to { opacity:1; transform:translateY(0) } }
        .answer-in { animation: answer-in 300ms cubic-bezier(.16,1,.3,1) both; }
        @keyframes sug { from { opacity:0; transform:translateY(4px) } to { opacity:1; transform:translateY(0) } }
        .sug { animation: sug 200ms ease both; }
        @keyframes dd { from { opacity:0; transform:translateY(-4px) scale(.98) } to { opacity:1; transform:translateY(0) scale(1) } }
        .dd { animation: dd 140ms cubic-bezier(.16,1,.3,1); }
      `}</style>

      <div ref={mainRef} className="np min-h-screen bg-[#fafaf9] dark:bg-[#0c0a09]">

        {/* Progress bar */}
        <div
          className="fixed top-0 left-0 h-[2px] z-50 transition-all duration-100"
          style={{ width: `${scrollPct * 100}%`, background: '#2FAF8F' }}
        />

        {/* ── HEADER ──────────────────────────────────────────────────────── */}
        <header className="max-w-[760px] mx-auto px-8 pt-10 pb-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/noticias')}
              className="flex items-center gap-2 text-[12.5px] font-medium text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
            >
              <Ico.ArrowLeft c="w-3.5 h-3.5" />
              Noticias
            </button>

            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen(p => !p)}
                className="flex items-center gap-1.5 h-7 px-3 rounded-full text-[11.5px] font-medium text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700/60 hover:border-stone-300 transition-colors bg-white dark:bg-transparent"
              >
                {perfil}
                <Ico.ChevronDown c={`w-3 h-3 text-stone-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
              </button>
              {profileOpen && (
                <div className="dd absolute right-0 top-full mt-1.5 w-32 bg-white dark:bg-[#1c1917] rounded-xl border border-stone-200/80 dark:border-stone-800 shadow-[0_8px_24px_rgba(0,0,0,.08)] overflow-hidden z-50 py-1">
                  {PERFILES.map(p => (
                    <button
                      key={p}
                      onClick={() => { setPerfil(p); setProfileOpen(false); setChatHistory([]) }}
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

        {/* LOADING */}
        {loading && (
          <main className="max-w-[760px] mx-auto px-8 pb-48">
            <div className="sh h-4 w-24 rounded-full mb-6" />
            <div className="sh h-8 w-full rounded-xl mb-3" />
            <div className="sh h-8 w-4/5 rounded-xl mb-10" />
            <div className="space-y-3">
              {[100, 95, 88, 70, 92, 80].map((w, i) => (
                <div key={i} className="sh h-4 rounded-full" style={{ width: `${w}%` }} />
              ))}
            </div>
          </main>
        )}

        {/* ERROR */}
        {error && !loading && (
          <main className="max-w-[760px] mx-auto px-8 pb-48 pt-20 text-center">
            <p className="text-[14px] text-stone-400 dark:text-stone-500 mb-4">{error}</p>
            <button
              onClick={() => navigate('/noticias')}
              className="text-[12px] font-medium text-[#2FAF8F] hover:text-[#1a9070] transition-colors"
            >
              Volver a noticias
            </button>
          </main>
        )}

        {/* ARTÍCULO */}
        {noticia && !loading && (
          <main className="max-w-[760px] mx-auto px-8 pb-48 fu">

            {/* Meta */}
            <div className="flex items-center gap-2 mb-5 flex-wrap">
              {noticia.urgente && (
                <span className="flex items-center gap-1.5 text-[10px] font-bold text-rose-500 uppercase tracking-[0.06em]">
                  <Ico.AlertTriangle c="w-3 h-3" />
                  Urgente ·
                </span>
              )}
              <span className="text-[11.5px] font-semibold text-stone-500 dark:text-stone-400 tracking-[0.06em]">
                {noticia.categoria}
              </span>
              <span className="text-stone-200 dark:text-stone-700">·</span>
              <span className="text-[11.5px] text-stone-400 dark:text-stone-500">
                {tiempoRelativo(noticia.publicada_en)}
              </span>
              <span className="text-stone-200 dark:text-stone-700">·</span>
              <span className="text-[11.5px] text-stone-400 dark:text-stone-500">
                {noticia.lectura_minutos} min
              </span>
            </div>

            {/* Título */}
            <h1 className="s text-[28px] sm:text-[34px] text-stone-900 dark:text-stone-50 leading-[1.22] tracking-[-0.02em] mb-6">
              {noticia.titulo}
            </h1>

            {/* Fuente + HTI */}
            <div className="flex items-center justify-between mb-6 pb-6 border-b border-stone-100 dark:border-stone-800/60">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center shrink-0">
                  <Ico.Shield c="w-3 h-3 text-stone-400 dark:text-stone-500" />
                </div>
                <div>
                  <p className="text-[12px] font-semibold text-stone-700 dark:text-stone-300">
                    {noticia.fuente}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {/* Badge de origen */}
                    {noticia.fuente_origen === 'api' && (
                      <span className="text-[10px] font-medium text-stone-400 dark:text-stone-500 bg-stone-100 dark:bg-stone-800/60 px-1.5 py-0.5 rounded">
                        IA · NewsAPI
                      </span>
                    )}
                    {noticia.fuente_origen === 'comunidad' && (
                      <span className="text-[10px] font-medium text-[#2FAF8F] bg-[#2FAF8F]/10 px-1.5 py-0.5 rounded">
                        Comunidad
                      </span>
                    )}
                    {noticia.url_original && (
                      <a
                        href={noticia.url_original}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[11px] text-stone-400 dark:text-stone-500 hover:text-[#2FAF8F] transition-colors"
                      >
                        Ver fuente original <Ico.ExternalLink c="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
              <HTIBadge size="md" score={noticia.trust_index} status={noticia.verification_status} showTooltip />
            </div>

            {/* Disclaimer IA */}
            {noticia.fuente_origen === 'api' && (
              <div className="mb-8 px-4 py-3 rounded-xl bg-stone-50 dark:bg-stone-900/50 border border-stone-200/60 dark:border-stone-800/50 flex items-start gap-2.5">
                <svg className="w-3.5 h-3.5 text-stone-400 dark:text-stone-500 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <p className="text-[11.5px] text-stone-400 dark:text-stone-500 leading-[1.6]">
                  Este contenido fue procesado y resumido por IA a partir de fuentes externas. Puede contener errores o imprecisiones — verifica los datos críticos en la fuente original.
                </p>
              </div>
            )}

            {/* ── PANEL ANÁLISIS IA ── */}
            <div className="mb-10 rounded-2xl border border-stone-200/70 dark:border-stone-800/60 bg-white dark:bg-[#141210] overflow-hidden shadow-[0_1px_12px_rgba(0,0,0,0.04)]">
              <div className="px-6 py-4 border-b border-stone-100 dark:border-stone-800/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Ico.Spark c="w-3.5 h-3.5 text-[#2FAF8F]" />
                  <span className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 tracking-[0.04em]">
                    Análisis para {perfil}
                  </span>
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-[0.08em] ${URGENCIA_COLOR[noticia.urgencia_nivel] ?? 'text-stone-400'}`}>
                  Urgencia {noticia.urgencia_nivel}
                </span>
              </div>

              <div className="px-6 py-5">
                <p className="text-[14px] text-stone-600 dark:text-stone-300 leading-[1.75] mb-5">
                  {noticia.resumenes_ia?.[perfil] ?? noticia.resumen_general}
                </p>

                {noticia.impacto_ia && (
                  <div className="mb-5">
                    <p className="text-[10.5px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-[0.1em] mb-2">
                      Impacto directo
                    </p>
                    <p className="text-[13.5px] text-stone-600 dark:text-stone-300 leading-[1.7]">
                      {noticia.impacto_ia}
                    </p>
                  </div>
                )}

                {noticia.acciones_ia?.length > 0 && (
                  <div>
                    <p className="text-[10.5px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-[0.1em] mb-3">
                      Acciones recomendadas
                    </p>
                    <ul className="space-y-2">
                      {noticia.acciones_ia.map((accion, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <span className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-[#2FAF8F]" />
                          <span className="text-[13px] text-stone-700 dark:text-stone-300 leading-snug">
                            {accion}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* ── CUERPO / BRIEFING ── */}
            {(() => {
              let briefing: { que_paso?: string; por_que_importa?: string; numeros_clave?: string[]; contexto?: string; que_sigue?: string } | null = null
              try {
                const raw = typeof noticia.cuerpo === 'string' ? JSON.parse(noticia.cuerpo) : noticia.cuerpo
                if (raw && typeof raw === 'object' && raw.que_paso) briefing = raw
              } catch { /* texto plano */ }

              if (briefing) {
                return (
                  <div className="space-y-6 mb-10">
                    {briefing.que_paso && (
                      <div>
                        <p className="text-[10px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-[0.12em] mb-2">Qué pasó</p>
                        <p className="text-[16px] text-stone-700 dark:text-stone-300 leading-[1.82] tracking-[-0.01em]">{briefing.que_paso}</p>
                      </div>
                    )}
                    {briefing.por_que_importa && (
                      <div>
                        <p className="text-[10px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-[0.12em] mb-2">Por qué importa</p>
                        <p className="text-[15px] text-stone-600 dark:text-stone-400 leading-[1.8]">{briefing.por_que_importa}</p>
                      </div>
                    )}
                    {briefing.numeros_clave && briefing.numeros_clave.length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-[0.12em] mb-3">Números clave</p>
                        <div className="flex flex-wrap gap-2">
                          {briefing.numeros_clave.map((n, i) => (
                            <span key={i} className="px-3 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-800/60 text-[13px] font-medium text-stone-700 dark:text-stone-300">
                              {n}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {briefing.contexto && (
                      <div>
                        <p className="text-[10px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-[0.12em] mb-2">Contexto</p>
                        <p className="text-[14px] text-stone-500 dark:text-stone-400 leading-[1.8] italic">{briefing.contexto}</p>
                      </div>
                    )}
                    {briefing.que_sigue && (
                      <div className="p-4 rounded-xl border border-[#2FAF8F]/20 bg-[#2FAF8F]/[0.04]">
                        <p className="text-[10px] font-semibold text-[#2FAF8F] uppercase tracking-[0.12em] mb-2">Qué sigue</p>
                        <p className="text-[14px] text-stone-600 dark:text-stone-300 leading-[1.75]">{briefing.que_sigue}</p>
                      </div>
                    )}
                  </div>
                )
              }

              // Fallback — texto plano
              return (
                <div className="space-y-5 mb-10">
                  {noticia.cuerpo.split('\n\n').filter(Boolean).map((p, i) => (
                    <p key={i} className="text-[16px] text-stone-700 dark:text-stone-300 leading-[1.82] tracking-[-0.01em]">
                      {p}
                    </p>
                  ))}
                </div>
              )
            })()}

            {/* Ornament */}
            <div className="flex items-center justify-center gap-2 my-10">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-1 h-1 rounded-full bg-stone-300 dark:bg-stone-600" />
              ))}
            </div>

            {/* ── WIKI HANDEIA — Hechos vinculados ── */}
            {wikiHechos.length > 0 && (
              <div className="mb-10">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#2FAF8F]" />
                  <p className="text-[10.5px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-[0.08em]">
                    En Wiki Handeia
                  </p>
                </div>
                <div className="space-y-2">
                  {wikiHechos.map(h => (
                    <button
                      key={h.id}
                      onClick={() => navigate(`/wiki/hecho/${h.id}`)}
                      className="w-full text-left p-3.5 rounded-xl border border-[#2FAF8F]/20 bg-[#2FAF8F]/[0.04] dark:bg-[#2FAF8F]/[0.07] hover:border-[#2FAF8F]/40 hover:bg-[#2FAF8F]/[0.08] transition-all group"
                    >
                      <div className="flex items-start gap-2.5">
                        <span className="text-[14px] shrink-0 mt-px">{DOMINIO_ICON[h.dominio] ?? '📋'}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[9.5px] font-semibold text-[#2FAF8F] uppercase tracking-[0.08em]">
                              Hecho verificado
                            </span>
                            <span
                              className="text-[9px] font-bold px-1.5 py-px rounded-full"
                              style={{ color: htiColor(h.hti), background: `${htiColor(h.hti)}20` }}
                            >
                              HTI {h.hti}
                            </span>
                          </div>
                          <p className="text-[13px] font-medium text-stone-700 dark:text-stone-300 leading-[1.5] line-clamp-2 group-hover:text-stone-900 dark:group-hover:text-white transition-colors">
                            {h.afirmacion}
                          </p>
                          <p className="text-[10.5px] text-stone-400 dark:text-stone-500 mt-1">
                            {h.fuente_nombre}
                          </p>
                        </div>
                        <svg className="w-3.5 h-3.5 text-[#2FAF8F]/40 group-hover:text-[#2FAF8F] transition-colors shrink-0 mt-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <polyline points="9 18 15 12 9 6"/>
                        </svg>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── CHAT HISTORY ── */}
            {chatHistory.length > 0 && (
              <div className="mt-10 space-y-8">
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-stone-100 dark:bg-stone-800/60" />
                  <span className="text-[10.5px] font-semibold text-stone-300 dark:text-stone-600 uppercase tracking-[0.12em]">
                    Tus consultas
                  </span>
                  <div className="flex-1 h-px bg-stone-100 dark:bg-stone-800/60" />
                </div>

                {chatHistory.map((h, i) => (
                  <div key={i} className="answer-in">
                    <p className="text-[11px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-[0.1em] mb-2">
                      {perfil} preguntó
                    </p>
                    <p className="si text-[20px] text-stone-800 dark:text-stone-100 leading-snug mb-5">
                      {h.q}
                    </p>

                    <div className="flex items-start gap-3">
                      <div className="shrink-0 mt-0.5">
                        <Ico.Spark c="w-3.5 h-3.5 text-[#2FAF8F]" />
                      </div>
                      <div className="flex-1">
                        {!h.a ? (
                          <div className="space-y-2.5 py-0.5">
                            {[100, 85, 70].map((w, j) => (
                              <div key={j} className="sh h-3 rounded-full" style={{ width: `${w}%` }} />
                            ))}
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {h.a.split('\n\n').filter(Boolean).map((p, j) => (
                              <p key={j} className="text-[14.5px] text-stone-600 dark:text-stone-300 leading-[1.78]">
                                {p.replace(/\n/g, ' ')}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {i < chatHistory.length - 1 && (
                      <div className="mt-8 h-px bg-stone-100 dark:bg-stone-800/50" />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* ── RELACIONADAS ── */}
            {relacionadas.length > 0 && (
              <div className="mt-14">
                <div className="flex items-center gap-3 mb-0">
                  <span className="text-[10.5px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-[0.1em] shrink-0">
                    Más en {noticia.categoria}
                  </span>
                  <div className="flex-1 h-px bg-stone-100 dark:bg-stone-800/60" />
                </div>

                <div className="divide-y divide-stone-100 dark:divide-stone-800/50">
                  {relacionadas.map(r => (
                    <div
                      key={r.id}
                      className="group py-5 cursor-pointer -mx-4 px-4 rounded-xl transition-colors"
                      onClick={() => navigate(`/noticias/${r.id}`)}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10.5px] font-semibold text-stone-400 dark:text-stone-500 tracking-[0.07em]">
                          {r.categoria}
                        </span>
                        <span className="text-stone-200 dark:text-stone-700">·</span>
                        <span className="text-[10.5px] text-stone-400 dark:text-stone-500">{r.tiempo_relativo}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <p className="text-[14px] font-semibold text-stone-700 dark:text-stone-300
                                       group-hover:text-stone-900 dark:group-hover:text-stone-50
                                       leading-snug tracking-[-0.02em] transition-colors duration-150">
                          {r.titulo}
                        </p>
                        <HTIBadge score={r.trust_index} status={r.verification_status} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </main>
        )}

        {/* ── BARRA FIJA ──────────────────────────────────────────────────── */}
        <div
          className="fixed bottom-0 right-0 z-30 pointer-events-none transition-[left] duration-[240ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
          style={{ left: barLeft }}
        >
          <div className="h-16 bg-gradient-to-t from-[#fafaf9] via-[#fafaf9]/70 to-transparent dark:from-[#0c0a09] dark:via-[#0c0a09]/70" />

          <div className="bg-[#fafaf9]/95 dark:bg-[#0c0a09]/95 backdrop-blur-2xl pb-7 pointer-events-auto">
            <div className="max-w-[760px] mx-auto px-8">

              {focused && !query && sugerencias.length > 0 && (
                <div className="flex items-center gap-1.5 mb-2.5 overflow-hidden h-7">
                  {sugerencias.map((s, i) => (
                    <button
                      key={i}
                      onMouseDown={() => { setQuery(s); setTimeout(() => inputRef.current?.focus(), 10) }}
                      className="sug shrink-0 h-7 px-3 rounded-full border border-stone-200 dark:border-stone-700/60 bg-white/80 dark:bg-stone-800/60 text-[11.5px] text-stone-500 dark:text-stone-400 hover:border-stone-300 hover:text-stone-700 transition-all whitespace-nowrap"
                      style={{ animationDelay: `${i * 40}ms` }}
                    >
                      {s}
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
                  onKeyDown={e => { if (e.key === 'Enter') void handleQuery() }}
                  placeholder="Preguntar sobre esta noticia..."
                  style={{ outline: 'none', boxShadow: 'none', WebkitAppearance: 'none' }}
                  className="flex-1 h-12 bg-transparent text-[14px] text-stone-800 dark:text-stone-100 placeholder-stone-300 dark:placeholder-stone-600"
                />
                {query && (
                  <button
                    onClick={() => void handleQuery()}
                    disabled={chatLoading}
                    className="shrink-0 w-8 h-8 rounded-xl bg-[#2FAF8F] hover:bg-[#27a07f] active:scale-[0.93] flex items-center justify-center transition-all shadow-sm"
                  >
                    {chatLoading
                      ? <div className="w-3.5 h-3.5 border-[1.5px] border-white/30 border-t-white rounded-full animate-spin" />
                      : <Ico.Send c="w-3.5 h-3.5 text-white" />
                    }
                  </button>
                )}
              </div>

              <p className="text-center text-[10.5px] text-stone-300 dark:text-stone-700 mt-2">
                Análisis contextualizado por Handeia · {noticia?.fuente ?? ''}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}