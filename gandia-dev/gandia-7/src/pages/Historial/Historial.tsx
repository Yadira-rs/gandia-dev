import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { chatService, type Conversation, type ChatMode } from '../../lib/chatService'

// ─── TYPES ────────────────────────────────────────────────────────────────────
type ViewMode = 'list' | 'grid'
type FilterKey = 'todos' | 'asistente' | 'noticias' | 'investigacion'

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function dateGroup(dateStr: string): string {
  const date  = new Date(dateStr)
  const now   = new Date()
  const diff  = Math.floor((now.getTime() - date.getTime()) / 86_400_000)
  if (diff === 0) return 'Hoy'
  if (diff === 1) return 'Ayer'
  if (diff <= 7)  return 'Esta semana'
  if (diff <= 30) return 'Este mes'
  return 'Antes'
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now  = new Date()
  const diff = Math.floor((now.getTime() - date.getTime()) / 86_400_000)
  if (diff === 0)
    return `Hoy, ${date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}`
  if (diff === 1)
    return `Ayer, ${date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}`
  return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'todos',         label: 'Todos'         },
  { key: 'asistente',     label: 'Asistente'     },
  { key: 'noticias',      label: 'Noticias'      },
  { key: 'investigacion', label: 'Investigación' },
]

const MODE_DOT: Record<ChatMode, string> = {
  asistente:     'bg-[#2FAF8F]',
  noticias:      'bg-blue-400',
  investigacion: 'bg-violet-400',
}

const MODE_LABEL: Record<ChatMode, string> = {
  asistente:     'Asistente',
  noticias:      'Noticias',
  investigacion: 'Investigación',
}

const GROUP_ORDER = ['Hoy', 'Ayer', 'Esta semana', 'Este mes', 'Antes']

// ─── ICONS ────────────────────────────────────────────────────────────────────
const Ico = {
  Search: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7.5"/><line x1="20.5" y1="20.5" x2="16.1" y2="16.1"/>
    </svg>
  ),
  List: () => (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
      <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
    </svg>
  ),
  Grid: () => (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
    </svg>
  ),
  ArrowRight: () => (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
    </svg>
  ),
  Spark: () => (
    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
    </svg>
  ),
  Plus: () => (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  Msg: () => (
    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  ),
  X: () => (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  Pin: () => (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17z"/>
    </svg>
  ),
  Trash: () => (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
      <path d="M10 11v6"/><path d="M14 11v6"/>
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
    </svg>
  ),
  Archive: () => (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/>
      <line x1="10" y1="12" x2="14" y2="12"/>
    </svg>
  ),
}

// ─── SKELETON ─────────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <div className="py-5 -mx-3 px-3">
      <div className="flex items-start gap-4">
        <div className="flex-1 space-y-2.5">
          <div className="flex items-center gap-2">
            <div className="hi-sh w-1.5 h-1.5 rounded-full" />
            <div className="hi-sh h-3 w-20 rounded-full" />
          </div>
          <div className="hi-sh h-4 w-3/4 rounded-full" />
          <div className="hi-sh h-3 w-full rounded-full" />
          <div className="hi-sh h-3 w-2/3 rounded-full" />
          <div className="flex gap-3 mt-1">
            <div className="hi-sh h-3 w-8 rounded-full" />
            <div className="hi-sh h-3 w-20 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-[#141210] border border-stone-200/70 dark:border-stone-800/60 rounded-2xl p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="hi-sh w-1.5 h-1.5 rounded-full" />
          <div className="hi-sh h-3 w-20 rounded-full" />
        </div>
      </div>
      <div className="hi-sh h-4 w-4/5 rounded-full" />
      <div className="space-y-1.5">
        <div className="hi-sh h-3 w-full rounded-full" />
        <div className="hi-sh h-3 w-full rounded-full" />
        <div className="hi-sh h-3 w-2/3 rounded-full" />
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-stone-100 dark:border-stone-800/50">
        <div className="hi-sh h-3 w-24 rounded-full" />
        <div className="hi-sh h-3 w-10 rounded-full" />
      </div>
    </div>
  )
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function Historial() {
  const navigate                        = useNavigate()
  const [view, setView]                 = useState<ViewMode>('list')
  const [filter, setFilter]             = useState<FilterKey>('todos')
  const [query, setQuery]               = useState('')
  const [focused, setFocused]           = useState(false)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isLoading, setIsLoading]       = useState(true)
  const [error, setError]               = useState<string | null>(null)
  const [deletingId, setDeletingId]     = useState<string | null>(null)
  const [toastMsg, setToastMsg]         = useState<string | null>(null)

  const inputRef = useRef<HTMLInputElement>(null)
  const mainRef  = useRef<HTMLDivElement>(null)
  const [barLeft, setBarLeft] = useState(0)

  // ── Sidebar-aware fixed bar ──────────────────────────────────────────────
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

  // ── Toast helper ─────────────────────────────────────────────────────────
  const showToast = useCallback((msg: string) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 2800)
  }, [])

  // ── Cargar conversaciones ────────────────────────────────────────────────
  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await chatService.listConversations({ limit: 100 })
      setConversations(data)
    } catch {
      setError('No se pudieron cargar las conversaciones. Intenta de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // ── Abrir conversación ───────────────────────────────────────────────────
  const handleOpen = (id: string) => {
    // Navega al chat pasando el id como state — Chat.tsx lo puede leer
    navigate('/chat', { state: { conversationId: id } })
  }

  // ── Pin / unpin ──────────────────────────────────────────────────────────
  const handlePin = async (conv: Conversation, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await chatService.pinConversation(conv.id, !conv.is_pinned)
      setConversations(prev =>
        prev.map(c => c.id === conv.id ? { ...c, is_pinned: !conv.is_pinned } : c)
      )
      showToast(conv.is_pinned ? 'Conversación desfijada' : 'Conversación fijada')
    } catch {
      showToast('Error al fijar conversación')
    }
  }

  // ── Archivar ─────────────────────────────────────────────────────────────
  const handleArchive = async (conv: Conversation, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await chatService.archiveConversation(conv.id, true)
      setConversations(prev => prev.filter(c => c.id !== conv.id))
      showToast('Conversación archivada')
    } catch {
      showToast('Error al archivar')
    }
  }

  // ── Eliminar ─────────────────────────────────────────────────────────────
  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setDeletingId(id)
    try {
      await chatService.deleteConversation(id)
      setConversations(prev => prev.filter(c => c.id !== id))
      showToast('Conversación eliminada')
    } catch {
      showToast('Error al eliminar')
    } finally {
      setDeletingId(null)
    }
  }

  // ── Filtrar + buscar ─────────────────────────────────────────────────────
  const filtered = conversations.filter(conv => {
    const matchesFilter = filter === 'todos' || conv.mode === filter
    const q = query.toLowerCase()
    const matchesQuery  = !q || conv.title.toLowerCase().includes(q)
    return matchesFilter && matchesQuery
  })

  // Pinned primero, luego por fecha
  const sorted = [...filtered].sort((a, b) => {
    if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1
    const ta = a.last_message_at ?? a.created_at
    const tb = b.last_message_at ?? b.created_at
    return new Date(tb).getTime() - new Date(ta).getTime()
  })

  // ── Agrupar por fecha ────────────────────────────────────────────────────
  const groups = sorted.reduce<Record<string, Conversation[]>>((acc, conv) => {
    const g = conv.is_pinned ? 'Fijadas' : dateGroup(conv.last_message_at ?? conv.created_at)
    if (!acc[g]) acc[g] = []
    acc[g].push(conv)
    return acc
  }, {})

  const groupOrder = ['Fijadas', ...GROUP_ORDER]

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600&display=swap');
        .hi * { -webkit-font-smoothing: antialiased; }
        .hi { font-family: 'Geist', system-ui, sans-serif; }
        .hi-s { font-family: 'Instrument Serif', Georgia, serif; }
        .hi *:focus, .hi *:focus-visible { outline: none !important; box-shadow: none !important; }
        .hi-scroll::-webkit-scrollbar { width: 3px; }
        .hi-scroll::-webkit-scrollbar-track { background: transparent; }
        .hi-scroll::-webkit-scrollbar-thumb { background: #e7e5e4; border-radius: 999px; }
        .dark .hi-scroll::-webkit-scrollbar-thumb { background: #3c3836; }
        .hi-scroll { scrollbar-width: thin; scrollbar-color: #e7e5e4 transparent; }
        .dark .hi-scroll { scrollbar-color: #3c3836 transparent; }
        @keyframes hi-fu { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .hi-fu { animation: hi-fu 380ms cubic-bezier(.16,1,.3,1) both; }
        @keyframes hi-row { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }
        .hi-row { animation: hi-row 300ms cubic-bezier(.16,1,.3,1) both; }
        .hi-sb { transition: box-shadow 200ms ease; }
        .hi-sb.active { box-shadow: 0 6px 24px rgba(0,0,0,0.08); }
        .dark .hi-sb.active { box-shadow: 0 6px 28px rgba(0,0,0,0.40); }
        .hi-card { transition: box-shadow 180ms ease, border-color 180ms ease, transform 180ms ease; }
        .hi-card:hover { box-shadow: 0 8px 28px rgba(0,0,0,0.07); transform: translateY(-1px); }
        .dark .hi-card:hover { box-shadow: 0 8px 32px rgba(0,0,0,0.35); }
        @keyframes hi-sh { 0%{background-position:-500px 0} 100%{background-position:500px 0} }
        .hi-sh {
          background: linear-gradient(90deg, #f0efee 25%, #e8e7e5 50%, #f0efee 75%);
          background-size: 500px 100%;
          animation: hi-sh 1.5s ease-in-out infinite;
        }
        .dark .hi-sh {
          background: linear-gradient(90deg, #1c1917 25%, #262220 50%, #1c1917 75%);
          background-size: 500px 100%;
        }
        .hi-pill-active { background: #1c1917; color: #fafaf9; }
        .dark .hi-pill-active { background: #f5f5f4; color: #1c1917; }
        .hi-vt-active { background: white; color: #1c1917; box-shadow: 0 1px 4px rgba(0,0,0,0.10); }
        .dark .hi-vt-active { background: #1c1917; color: #fafaf9; }
        @keyframes hi-toast { from{opacity:0;transform:translateY(6px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        .hi-toast { animation: hi-toast 200ms cubic-bezier(.16,1,.3,1) both; }
        @keyframes hi-spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        .hi-spin { animation: hi-spin 1s linear infinite; }
        /* Acciones hover */
        .hi-actions { opacity: 0; transition: opacity 150ms ease; }
        .group/item:hover .hi-actions,
        .group/card:hover .hi-actions { opacity: 1; }
      `}</style>

      <div ref={mainRef} className="hi relative h-full flex flex-col bg-[#fafaf9] dark:bg-[#0c0a09]">

        {/* ── TOAST ───────────────────────────────────────────────── */}
        {toastMsg && (
          <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-50 hi-toast">
            <div className="px-4 py-2.5 rounded-2xl bg-stone-800 dark:bg-stone-100 text-white dark:text-stone-900 text-[12.5px] font-medium shadow-lg">
              {toastMsg}
            </div>
          </div>
        )}

        {/* ── SCROLLABLE AREA ─────────────────────────────────────── */}
        <div className="hi-scroll flex-1 overflow-y-auto">

          {/* ── HEADER ────────────────────────────────────────────── */}
          <header className="max-w-[860px] mx-auto px-8 pt-10 hi-fu">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h1 className="text-[16px] font-semibold tracking-[-0.022em] text-stone-900 dark:text-stone-50">
                  Historial
                </h1>
                <p className="text-[11.5px] text-stone-400 dark:text-stone-500 mt-0.5 leading-none">
                  {isLoading
                    ? 'Cargando conversaciones…'
                    : `${conversations.length} conversación${conversations.length !== 1 ? 'es' : ''} · Ordenado por recientes`}
                </p>
              </div>

              {/* View toggle + New */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate('/chat')}
                  className="w-7 h-7 flex items-center justify-center rounded-full border border-stone-200/80 dark:border-stone-700/50 bg-white dark:bg-transparent text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-200 hover:border-stone-300 dark:hover:border-stone-500 transition-all duration-150"
                  title="Nueva conversación"
                >
                  <Ico.Plus />
                </button>
                <div className="flex bg-stone-100 dark:bg-stone-800/60 rounded-lg p-0.5">
                  {(['list', 'grid'] as ViewMode[]).map(v => (
                    <button
                      key={v}
                      onClick={() => setView(v)}
                      className={`w-7 h-7 flex items-center justify-center rounded-md transition-all text-stone-400 dark:text-stone-500 ${view === v ? 'hi-vt-active' : 'hover:text-stone-600 dark:hover:text-stone-300'}`}
                    >
                      {v === 'list' ? <Ico.List /> : <Ico.Grid />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-1.5 mt-6 overflow-x-auto hi-scroll pb-0.5">
              {FILTERS.map(f => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`shrink-0 h-7 px-3.5 rounded-full text-[11.5px] font-medium transition-all duration-150 ${
                    filter === f.key
                      ? 'hi-pill-active'
                      : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </header>

          {/* ── MAIN CONTENT ──────────────────────────────────────── */}
          <main className="max-w-[860px] mx-auto px-8 pb-48 mt-10">

            {/* Error */}
            {error && (
              <div className="hi-fu flex flex-col items-center justify-center py-16 text-center">
                <p className="text-[13px] text-rose-400 mb-3">{error}</p>
                <button
                  onClick={load}
                  className="text-[12px] font-medium text-[#2FAF8F] hover:text-[#1a9070] transition-colors"
                >
                  Reintentar
                </button>
              </div>
            )}

            {/* Loading skeleton */}
            {!error && isLoading && (
              view === 'list' ? (
                <div>
                  {[...Array(2)].map((_, gi) => (
                    <div key={gi} className="mb-8">
                      <div className="flex items-center gap-3 mb-0">
                        <div className="hi-sh h-2.5 w-16 rounded-full" />
                        <div className="flex-1 h-px bg-stone-100 dark:bg-stone-800/60" />
                      </div>
                      <div className="divide-y divide-stone-100 dark:divide-stone-800/50">
                        {[...Array(3)].map((_, i) => <SkeletonRow key={i} />)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
                </div>
              )
            )}

            {/* Empty state */}
            {!error && !isLoading && filtered.length === 0 && (
              <div className="hi-fu flex flex-col items-center justify-center py-24 text-center">
                <div className="w-10 h-10 rounded-2xl bg-stone-100 dark:bg-stone-800/60 flex items-center justify-center text-stone-300 dark:text-stone-600 mb-4">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                </div>
                <p className="text-[14px] font-medium text-stone-700 dark:text-stone-300 mb-1">Sin resultados</p>
                <p className="text-[12.5px] text-stone-400 dark:text-stone-500">
                  {query
                    ? `No hay conversaciones para "${query}"`
                    : conversations.length === 0
                    ? 'Aún no tienes conversaciones. ¡Empieza una!'
                    : 'No hay conversaciones en esta categoría'}
                </p>
                <button
                  onClick={() => navigate('/chat')}
                  className="mt-6 flex items-center gap-1.5 text-[12px] font-medium text-[#2FAF8F] hover:text-[#1a9070] transition-colors"
                >
                  Iniciar nueva conversación
                  <Ico.ArrowRight />
                </button>
              </div>
            )}

            {/* ── LIST VIEW ───────────────────────────────────────── */}
            {!error && !isLoading && filtered.length > 0 && view === 'list' && (
              <div className="space-y-8">
                {groupOrder.filter(g => groups[g]).map(group => (
                  <section key={group}>
                    <div className="flex items-center gap-3 mb-0">
                      <span className="text-[10.5px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-[0.1em] shrink-0 flex items-center gap-1.5">
                        {group === 'Fijadas' && (
                          <svg className="w-2.5 h-2.5 text-[#2FAF8F]" viewBox="0 0 24 24" fill="currentColor"><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17z"/><line x1="12" y1="17" x2="12" y2="22" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/></svg>
                        )}
                        {group}
                      </span>
                      <div className="flex-1 h-px bg-stone-100 dark:bg-stone-800/60" />
                    </div>

                    <div className="divide-y divide-stone-100 dark:divide-stone-800/50">
                      {groups[group].map((conv, i) => (
                        <article
                          key={conv.id}
                          onClick={() => handleOpen(conv.id)}
                          className="hi-row group/item py-5 -mx-3 px-3 rounded-xl cursor-pointer"
                          style={{ animationDelay: `${i * 35}ms` }}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              {/* Mode badge */}
                              <div className="flex items-center gap-2 mb-1.5">
                                <span className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${MODE_DOT[conv.mode]}`} />
                                <span className="text-[11px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-[0.08em]">
                                  {MODE_LABEL[conv.mode]}
                                </span>
                                {conv.is_pinned && (
                                  <span className="text-[10px] font-medium text-[#2FAF8F]">· Fijada</span>
                                )}
                              </div>

                              {/* Title */}
                              <h3 className="text-[15px] font-semibold tracking-[-0.018em]
                                             text-stone-700 dark:text-stone-300
                                             group-hover/item:text-stone-900 dark:group-hover/item:text-stone-50
                                             leading-snug mb-1.5 transition-colors duration-150 truncate pr-4">
                                {conv.title}
                              </h3>

                              {/* Meta row */}
                              <div className="flex items-center gap-2.5 mt-2">
                                <span className="flex items-center gap-1 text-[11px] text-stone-300 dark:text-stone-600">
                                  <Ico.Msg />
                                  {conv.message_count}
                                </span>
                                <span className="text-stone-200 dark:text-stone-700">·</span>
                                <span className="text-[11px] text-stone-400 dark:text-stone-500">
                                  {formatDate(conv.last_message_at ?? conv.created_at)}
                                </span>
                              </div>
                            </div>

                            {/* Acciones */}
                            <div className="flex items-center gap-0.5 shrink-0 mt-0.5">
                              {/* Botones de acción — visibles en hover */}
                              <div className="hi-actions flex items-center gap-0.5 mr-1">
                                <button
                                  onClick={e => handlePin(conv, e)}
                                  title={conv.is_pinned ? 'Desfijar' : 'Fijar'}
                                  className={`w-6 h-6 flex items-center justify-center rounded-lg transition-colors ${conv.is_pinned ? 'text-[#2FAF8F]' : 'text-stone-300 dark:text-stone-600 hover:text-stone-500 dark:hover:text-stone-400'}`}
                                >
                                  <Ico.Pin />
                                </button>
                                <button
                                  onClick={e => handleArchive(conv, e)}
                                  title="Archivar"
                                  className="w-6 h-6 flex items-center justify-center rounded-lg text-stone-300 dark:text-stone-600 hover:text-amber-400 transition-colors"
                                >
                                  <Ico.Archive />
                                </button>
                                <button
                                  onClick={e => handleDelete(conv.id, e)}
                                  title="Eliminar"
                                  disabled={deletingId === conv.id}
                                  className="w-6 h-6 flex items-center justify-center rounded-lg text-stone-300 dark:text-stone-600 hover:text-rose-400 transition-colors disabled:opacity-40"
                                >
                                  {deletingId === conv.id
                                    ? <svg className="w-3 h-3 hi-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                                    : <Ico.Trash />}
                                </button>
                              </div>
                              {/* Abrir */}
                              <span className="text-stone-200 dark:text-stone-700 group-hover/item:text-[#2FAF8F] transition-colors duration-150 flex items-center gap-1">
                                <Ico.Spark />
                                <span className="text-[11px] font-medium hidden sm:block opacity-0 group-hover/item:opacity-100 transition-opacity">
                                  Abrir
                                </span>
                              </span>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}

            {/* ── GRID VIEW ───────────────────────────────────────── */}
            {!error && !isLoading && filtered.length > 0 && view === 'grid' && (
              <div className="space-y-8">
                {groupOrder.filter(g => groups[g]).map(group => (
                  <section key={group}>
                    <div className="flex items-center gap-3 mb-5">
                      <span className="text-[10.5px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-[0.1em] shrink-0">
                        {group}
                      </span>
                      <div className="flex-1 h-px bg-stone-100 dark:bg-stone-800/60" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {groups[group].map((conv, i) => (
                        <div
                          key={conv.id}
                          onClick={() => handleOpen(conv.id)}
                          className="hi-row hi-card group/card bg-white dark:bg-[#141210] border border-stone-200/70 dark:border-stone-800/60 rounded-2xl p-5 cursor-pointer flex flex-col gap-3"
                          style={{ animationDelay: `${i * 40}ms` }}
                        >
                          {/* Top */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className={`w-1.5 h-1.5 rounded-full ${MODE_DOT[conv.mode]}`} />
                              <span className="text-[10.5px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-[0.08em]">
                                {MODE_LABEL[conv.mode]}
                              </span>
                              {conv.is_pinned && (
                                <span className="text-[10px] font-medium text-[#2FAF8F]">· Fijada</span>
                              )}
                            </div>
                            {/* Acciones grid */}
                            <div className="hi-actions flex items-center gap-0.5">
                              <button
                                onClick={e => handlePin(conv, e)}
                                title={conv.is_pinned ? 'Desfijar' : 'Fijar'}
                                className={`w-6 h-6 flex items-center justify-center rounded-lg transition-colors ${conv.is_pinned ? 'text-[#2FAF8F]' : 'text-stone-300 dark:text-stone-600 hover:text-stone-500'}`}
                              >
                                <Ico.Pin />
                              </button>
                              <button
                                onClick={e => handleArchive(conv, e)}
                                title="Archivar"
                                className="w-6 h-6 flex items-center justify-center rounded-lg text-stone-300 dark:text-stone-600 hover:text-amber-400 transition-colors"
                              >
                                <Ico.Archive />
                              </button>
                              <button
                                onClick={e => handleDelete(conv.id, e)}
                                title="Eliminar"
                                disabled={deletingId === conv.id}
                                className="w-6 h-6 flex items-center justify-center rounded-lg text-stone-300 dark:text-stone-600 hover:text-rose-400 transition-colors disabled:opacity-40"
                              >
                                {deletingId === conv.id
                                  ? <svg className="w-3 h-3 hi-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                                  : <Ico.Trash />}
                              </button>
                            </div>
                          </div>

                          {/* Title */}
                          <h3 className="text-[14px] font-semibold tracking-[-0.018em]
                                         text-stone-700 dark:text-stone-300
                                         group-hover/card:text-stone-900 dark:group-hover/card:text-stone-50
                                         leading-snug transition-colors duration-150 line-clamp-2">
                            {conv.title}
                          </h3>

                          {/* Footer */}
                          <div className="flex items-center justify-between pt-3 border-t border-stone-100 dark:border-stone-800/50 mt-auto">
                            <div className="flex items-center gap-2 text-[11px] text-stone-300 dark:text-stone-600">
                              <span className="flex items-center gap-1">
                                <Ico.Msg /> {conv.message_count}
                              </span>
                              <span>·</span>
                              <span>{formatDate(conv.last_message_at ?? conv.created_at)}</span>
                            </div>
                            <span className="flex items-center gap-1 text-[11px] font-medium text-stone-300 dark:text-stone-600 group-hover/card:text-[#2FAF8F] transition-colors">
                              <Ico.Spark />
                              Abrir
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}

          </main>
        </div>{/* end hi-scroll */}

        {/* ── FIXED SEARCH BAR ────────────────────────────────────── */}
        <div
          className="fixed bottom-0 right-0 z-30 pointer-events-none transition-[left] duration-[240ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
          style={{ left: barLeft }}
        >
          <div className="h-20 bg-gradient-to-t from-[#fafaf9] via-[#fafaf9]/70 to-transparent dark:from-[#0c0a09] dark:via-[#0c0a09]/70" />

          <div className="bg-[#fafaf9]/95 dark:bg-[#0c0a09]/95 backdrop-blur-2xl pb-7 pointer-events-auto">
            <div className="max-w-[860px] mx-auto px-8">
              <div className={`hi-sb flex items-center gap-3 bg-white dark:bg-[#1c1917] border border-stone-200/80 dark:border-stone-800/60 rounded-2xl px-4 shadow-[0_2px_16px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_20px_rgba(0,0,0,0.30)] ${focused ? 'active' : ''}`}>
                <span className="text-stone-300 dark:text-stone-600 shrink-0">
                  <Ico.Search />
                </span>
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  placeholder="Buscar conversaciones…"
                  style={{ outline: 'none', boxShadow: 'none', WebkitAppearance: 'none' }}
                  className="flex-1 h-12 bg-transparent text-[14px] text-stone-800 dark:text-stone-100 placeholder-stone-300 dark:placeholder-stone-600"
                />
                {query && (
                  <button
                    onClick={() => setQuery('')}
                    className="shrink-0 text-stone-300 dark:text-stone-600 hover:text-stone-500 dark:hover:text-stone-400 transition-colors"
                  >
                    <Ico.X />
                  </button>
                )}
              </div>
              <p className="text-center text-[10.5px] text-stone-300 dark:text-stone-700 mt-2">
                Siete · Historial de conversaciones
              </p>
            </div>
          </div>
        </div>

      </div>
    </>
  )
}