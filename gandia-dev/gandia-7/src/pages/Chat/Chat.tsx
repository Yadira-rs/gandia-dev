import { useRef, useEffect, useMemo, useState, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import ArtifactShell from '../../artifacts/ArtifactShell'
import { useArtifacts, type ArtifactMessage } from './useArtifacts'
import ProfileBanner from '../../components/ui/ProfileBanner'
import { useUser } from '../../context/UserContext'
import { useChat } from './useChat'
import { ChatMessage } from './ChatMessage'
import { renderContent } from './chatContent'
import { ChatInputBar } from './ChatInputBar'
import { ThinkingBlock } from './ThinkingBlock'
import type { ChatModel } from '../../lib/chatService'
import type { WidgetArtifact, ArtifactDomain } from '../../artifacts/artifactTypes'
import { domainToAnima } from '../../artifacts/artifactTypes'
import { supabase } from '../../lib/supabaseClient'
import { useDictation } from './useDictation'

// ─── Greetings ────────────────────────────────────────────────────────────────
const GREETINGS = [
  (n: string) => `¿Qué necesitas hoy, ${n}?`,
  (n: string) => `Hola, ${n}. ¿Por dónde empezamos?`,
  (n: string) => `${n}, ¿en qué te ayudo?`,
  (n: string) => `Listo, ${n}. ¿Qué resolvemos?`,
  (n: string) => `Buenas, ${n}. ¿Qué hacemos?`,
  (n: string) => `¿Cómo puedo ayudarte hoy, ${n}?`,
]

// ─── Quick actions per mode ────────────────────────────────────────────────────
const QUICK_ACTIONS_BY_MODE = {
  asistente: [
    { icon: 'passport', label: 'Pasaportes',  desc: 'Estado de mis trámites activos' },
    { icon: 'price',    label: 'Precios',     desc: 'Mercado hoy en el norte'        },
    { icon: 'health',   label: 'Sanidad',     desc: 'Alertas SENASICA vigentes'      },
    { icon: 'export',   label: 'Exportación', desc: 'Requisitos FDA actualizados'    },
  ],
  noticias: [
    { icon: 'price',    label: 'Mercados',    desc: 'Cotizaciones del día'           },
    { icon: 'health',   label: 'SENASICA',    desc: 'Últimas alertas oficiales'      },
    { icon: 'export',   label: 'Comercio',    desc: 'Noticias de exportación'        },
    { icon: 'passport', label: 'Normativa',   desc: 'Cambios regulatorios recientes' },
  ],
  investigacion: [
    { icon: 'health',   label: 'NOM vigentes',    desc: 'Normas oficiales actuales'    },
    { icon: 'export',   label: 'Tratados TLC',     desc: 'Condiciones de exportación'  },
    { icon: 'price',    label: 'Análisis precios', desc: 'Tendencias históricas'       },
    { icon: 'passport', label: 'COFEPRIS',         desc: 'Regulación sanitaria'        },
  ],
}

const ROTATING_PHRASES = [
  '¿Qué pasa con los precios esta semana?',
  '¿Hay alertas sanitarias en mi zona?',
  '¿Cuándo vence mi próximo trámite?',
  '¿Cuáles son los nuevos requisitos de la FDA?',
  '¿Cómo afecta el clima a mi ganado?',
]

// ─── RotatingPhrase ───────────────────────────────────────────────────────────
function RotatingPhrase({ onSelect }: { onSelect: (q: string) => void }) {
  const [idx, setIdx]         = useState(0)
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    const iv = setInterval(() => {
      setVisible(false)
      setTimeout(() => { setIdx(i => (i + 1) % ROTATING_PHRASES.length); setVisible(true) }, 320)
    }, 3200)
    return () => clearInterval(iv)
  }, [])
  return (
    <div className="ch-card text-center" style={{ animationDelay: '180ms', minHeight: '36px' }}>
      <button
        onClick={() => onSelect(ROTATING_PHRASES[idx])}
        className="group inline-flex items-center gap-2"
        style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(5px)', transition: 'opacity 320ms ease, transform 320ms ease' }}
      >
        <span className="ch-serif text-[17px] italic text-stone-400 dark:text-stone-500 group-hover:text-stone-600 dark:group-hover:text-stone-300 transition-colors duration-150 leading-snug">
          {ROTATING_PHRASES[idx]}
        </span>
        <span className="text-stone-200 dark:text-stone-700 group-hover:text-[#2FAF8F] transition-colors duration-150 shrink-0">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
          </svg>
        </span>
      </button>
    </div>
  )
}

// ─── QuickIcon ────────────────────────────────────────────────────────────────
function QuickIcon({ icon }: { icon: string }) {
  const s = { className: 'w-5 h-5', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '1.5', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  if (icon === 'passport') return <svg {...s}><rect x="4" y="2" width="16" height="20" rx="2"/><circle cx="12" cy="11" r="3"/><path d="M9 17c0-1.66 1.34-3 3-3s3 1.34 3 3"/></svg>
  if (icon === 'price')    return <svg {...s}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
  if (icon === 'health')   return <svg {...s}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
  return <svg {...s}><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
}

// ─── PinnedBar ────────────────────────────────────────────────────────────────
function PinnedBar({ messages, onUnpin }: { messages: import('./chatTypes').UIMessage[]; onUnpin: (id: string) => void }) {
  const [open, setOpen] = useState(false)
  const pinned = messages.filter(m => m.pinned).slice(0, 5)
  if (pinned.length === 0) return null

  const scrollToMsg = (id: string) => {
    const el = document.querySelector(`[data-msg-id="${id}"]`)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
  return (
    <div className="border-b border-[#2FAF8F]/15 dark:border-[#2FAF8F]/10" style={{ background: 'linear-gradient(to bottom, rgba(47,175,143,0.06), rgba(47,175,143,0.02))', boxShadow: '0 2px 12px rgba(47,175,143,0.06)' }}>
      <button
        onClick={() => setOpen(p => !p)}
        className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-stone-50 dark:hover:bg-stone-800/40 transition-colors"
      >
        <svg className="w-3 h-3 text-[#2FAF8F] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
        </svg>
        <span className="text-[11.5px] font-semibold text-stone-500 dark:text-stone-400 flex-1">
          {pinned.length} destacado{pinned.length > 1 ? 's' : ''}
        </span>
        <svg
          className={`w-3 h-3 text-stone-300 dark:text-stone-600 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      {open && (
        <div className="flex flex-col divide-y divide-stone-100 dark:divide-stone-800/60 px-4 pb-2">
          {pinned.map(m => (
            <div key={m.id} className="flex items-start gap-3 py-2.5">
              <div className="w-px self-stretch bg-[#2FAF8F]/40 shrink-0" />
              <button
                onClick={() => scrollToMsg(m.id)}
                className="flex-1 text-left text-[12.5px] text-stone-600 dark:text-stone-300 leading-[1.6] line-clamp-2 min-w-0 hover:text-stone-800 dark:hover:text-stone-100 transition-colors"
              >
                {m.content}
              </button>
              <div className="flex items-center gap-2 shrink-0 ml-1">
                <span className="text-[10.5px] text-stone-300 dark:text-stone-600">
                  {new Date(m.ts).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <button
                  onClick={() => onUnpin(m.id)}
                  title="Quitar destacado"
                  className="w-5 h-5 flex items-center justify-center rounded-md text-stone-300 dark:text-stone-600 hover:text-rose-400 dark:hover:text-rose-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-all"
                >
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Chat ─────────────────────────────────────────────────────────────────────
export default function Chat() {
  const navigate = useNavigate()
  const location = useLocation()

  // ── Abrir anima desde sidebar (?open=domain) ────────────────────────────────
  const VALID_DOMAINS: ArtifactDomain[] = [
    'fichas', 'twins', 'monitoring', 'certification', 'verification', 'documentos', 'marketplace',
  ]
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const domain = params.get('open') as ArtifactDomain | null
    if (domain && VALID_DOMAINS.includes(domain)) {
      openDirect(domainToAnima(domain))
      navigate('/chat', { replace: true })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search])

  // ── Abrir Ánima de documentos desde tramitesPanel (location.state) ──────────
  useEffect(() => {
    const state = location.state as { openDocumentos?: boolean; docFilter?: string } | null
    if (state?.openDocumentos) {
      openDirect(domainToAnima('documentos'))
      navigate('/chat', { replace: true, state: { docFilter: state.docFilter } })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── User ────────────────────────────────────────────────────────────────────
  const { profile } = useUser()

  // Leer prefs del asistente desde localStorage
  const assistantPrefs = (() => {
    try {
      const raw = localStorage.getItem('gandia-assistant-prefs')
      return raw ? { suggestions: true, history: true, ...JSON.parse(raw) } : { suggestions: true, history: true }
    } catch { return { suggestions: true, history: true } }
  })()
  const pd = (profile?.personal_data as Record<string, string> | null) ?? {}
  const firstName = (pd.fullName || pd.full_name || pd.nombre_completo || pd.nombre || profile?.email?.split('@')[0] || '').split(' ')[0]
  // Fijar el índice del saludo una vez (no cambia al navegar)
  const greetingIdxRef = useRef(Math.floor(Math.random() * GREETINGS.length))
  // Recalcular solo cuando firstName pasa de vacío a tener valor
  const greeting = useMemo(
    () => GREETINGS[greetingIdxRef.current](firstName || 'tú'),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [firstName || 'tú']
  )

  // ── Artifacts ───────────────────────────────────────────────────────────────
  // pushMessage is defined after useChat, so we use a ref to avoid circular dep
  const pushMessageRef = useRef<(msg: ArtifactMessage) => void>(() => {})

  const {
    artifact, escalate, deescalate,
    close: closeArtifact,
    openDirect,
    isSimulating, simSteps, simIdx, simDone,
    handleText: handleArtifactText,
    renderInlineWidget,
  } = useArtifacts({ pushMessage: (msg) => pushMessageRef.current(msg) })

  // ── Chat logic ───────────────────────────────────────────────────────────────
  const {
    messages, setMessages,
    message, setMessage,
    attachedFiles, setAttachedFiles,
    pendingFiles, setPendingFiles,
    isGenerating, isSaving,
    showThinking, thinkingSteps, thinkingIdx, thinkingDone,
    thinkingExpanded, setThinkingExpanded,
    streamingText, isStreaming,
    toasts,
    copiedId,
    isAtBottom, setIsAtBottom,
    hasNewMsg, setHasNewMsg,
    editingIdx, setEditingIdx,
    editingText, setEditingText,
    confirmNewChat, setConfirmNewChat,
    isDragging, setIsDragging,
    lightboxUrl, setLightboxUrl,
    mode, setMode,
    model, setModel,
    modeOpen, setModeOpen,
    modelOpen, setModelOpen,
    addToast, handleCopy,
    processFiles,
    handleStop, doNewChat, handleNewChat,
    handleSend, handleSendWith, handleEditSave, handleRegenerate, handlePin,
    isOnline,
  } = useChat(handleArtifactText)

  // Wire pushMessage after both hooks are initialized
  useEffect(() => {
    pushMessageRef.current = (msg: ArtifactMessage) => {
      setMessages(prev => {
        const withRealUser = prev.map(m =>
          m.id === 'temp-user' ? { ...m, id: crypto.randomUUID() } : m
        )
        return [...withRealUser, {
          id: crypto.randomUUID(), role: 'assistant' as const,
          content: msg.content, files: [], thoughts: msg.thoughts,
          thoughtsExpanded: false, isError: false, model: 'acipe' as ChatModel,
          ts: Date.now(),
          artifact: { ...msg.artifact, id: msg.artifact.id as WidgetArtifact['id'] },
        }]
      })
    }
  }, [setMessages])

  // ── Scroll ───────────────────────────────────────────────────────────────────
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollAreaRef  = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isAtBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      const t = setTimeout(() => setHasNewMsg(false), 0)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => setHasNewMsg(true), 0)
    return () => clearTimeout(t)
  }, [messages, isGenerating, streamingText, isAtBottom, setHasNewMsg])

  useEffect(() => {
    const el = scrollAreaRef.current
    if (!el) return
    const fn = () => { setIsAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 80) }
    el.addEventListener('scroll', fn, { passive: true })
    return () => el.removeEventListener('scroll', fn)
  }, [setIsAtBottom])

  // Toggle saved thoughts
  const handleToggleThoughts = useCallback((idx: number) => {
    setMessages(prev => prev.map((m, i) => i === idx ? { ...m, thoughtsExpanded: !m.thoughtsExpanded } : m))
  }, [setMessages])

  // ── Feedback real → message_feedback table ──────────────────────────────────
  const handleFeedback = useCallback(async (msgId: string, kind: 'up' | 'down') => {
    try {
      await supabase.from('message_feedback').upsert({
        message_id: msgId,
        feedback:   kind,
        created_at: new Date().toISOString(),
      }, { onConflict: 'message_id' })
    } catch {
      // silencioso — el feedback no debe interrumpir el flujo
    }
  }, [])

  // ── Keyboard shortcuts ────────────────────────────────────────────────────────
  useEffect(() => {
    const MODES: import('../../lib/chatService').ChatMode[] = ['asistente', 'noticias', 'investigacion']
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey
      if (mod && e.key === 'k') { e.preventDefault(); handleNewChat() }
      if (mod && e.key === '/') {
        e.preventDefault()
        setMode(prev => {
          const idx = MODES.indexOf(prev)
          return MODES[(idx + 1) % MODES.length]
        })
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleNewChat, setMode])

  // ── Dictation ────────────────────────────────────────────────────────────────
  const dictation = useDictation(
    () => {},  // commit handled directly below via event
    () => {},  // cancel handled directly below via event
  )

  // Sync transcript + interim into input
  useEffect(() => {
    if (!dictation.active) return
    const full = dictation.interim
      ? (dictation.transcript + ' ' + dictation.interim).trim()
      : dictation.transcript
    setMessage(full)
  }, [dictation.active, dictation.transcript, dictation.interim, setMessage])

  // COMMIT — escuchar directo, sin pasar por callbacks de useDictation
  useEffect(() => {
    const handler = (e: Event) => {
      const text = (e as CustomEvent<{text: string}>).detail.text
      if (!text) return
      setMessage(text)
      handleSendWith(text)
    }
    window.addEventListener('gandia:dictation-commit', handler)
    return () => window.removeEventListener('gandia:dictation-commit', handler)
  }, [handleSendWith, setMessage])

  // CANCEL — limpiar input
  useEffect(() => {
    const handler = () => setMessage('')
    window.addEventListener('gandia:dictation-cancelled', handler)
    return () => window.removeEventListener('gandia:dictation-cancelled', handler)
  }, [setMessage])

  // ── Voice command listener ───────────────────────────────────────────────────
  // AppLayout despacha 'gandia:voice-cmd' cuando el usuario habla un comando de chat.
  useEffect(() => {
    const handler = (e: Event) => {
      const cmd = (e as CustomEvent<string>).detail
      if (!cmd) return
      if (cmd === 'new_chat') {
        handleNewChat()
      } else if (cmd === 'stop') {
        handleStop()
      } else if (cmd.startsWith('search:')) {
        const term = cmd.slice(7)
        setMessage(term)
        handleSendWith(term)
      }
    }
    window.addEventListener('gandia:voice-cmd', handler)
    return () => window.removeEventListener('gandia:voice-cmd', handler)
  }, [handleNewChat, handleStop, handleSendWith, setMessage])

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600&display=swap');
        .ch * { -webkit-font-smoothing: antialiased; }
        .ch { font-family: 'Geist', system-ui, sans-serif; }
        .ch-serif { font-family: 'Instrument Serif', Georgia, serif; }
        .ch *:focus, .ch *:focus-visible { outline: none !important; box-shadow: none !important; border-color: inherit !important; }
        .ch textarea:focus { outline: none !important; box-shadow: none !important; }
        .ch-input { transition: box-shadow 180ms ease; }
        .ch-input:focus-within { box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
        .dark .ch-input:focus-within { box-shadow: 0 4px 28px rgba(0,0,0,0.35); }
        .ch-scroll { scrollbar-width: thin; scrollbar-color: rgba(168,162,158,0.4) transparent; }
        .dark .ch-scroll { scrollbar-color: rgba(168,162,158,0.25) transparent; }
        .ch-scroll::-webkit-scrollbar { width: 2px; }
        .ch-scroll::-webkit-scrollbar-track { background: transparent; }
        .ch-scroll::-webkit-scrollbar-thumb { background-color: rgba(168,162,158,0.4); border-radius: 999px; }
        .ch-scroll::-webkit-scrollbar-thumb:hover { background-color: rgba(168,162,158,0.6); }
        .dark .ch-scroll::-webkit-scrollbar-thumb { background-color: rgba(168,162,158,0.25); }
        .dark .ch-scroll::-webkit-scrollbar-thumb:hover { background-color: rgba(168,162,158,0.4); }
        @keyframes ch-dd { from { opacity:0; transform:translateY(4px) scale(.98) } to { opacity:1; transform:translateY(0) scale(1) } }
        .ch-dd { animation: ch-dd 130ms cubic-bezier(.16,1,.3,1) both; }
        @keyframes ch-msg { from { opacity:0; transform:translateY(6px) } to { opacity:1; transform:translateY(0) } }
        .ch-msg { animation: ch-msg 280ms cubic-bezier(.16,1,.3,1) both; }
        @keyframes ch-card { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
        .ch-card { animation: ch-card 400ms cubic-bezier(.16,1,.3,1) both; }
        @keyframes gl-in { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }
        @keyframes gl-ft { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-2.5px)} }
        @keyframes gl-fm { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-1.5px)} }
        @keyframes gl-fb { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-0.7px)} }
        @keyframes gl-wrap { from{opacity:0} to{opacity:1} }
        .gl-wrap { animation: gl-wrap 200ms ease both; }
        .gl-b { animation: gl-in 380ms cubic-bezier(.16,1,.3,1) 0ms both, gl-fb 3.6s ease-in-out 500ms infinite; }
        .gl-m { animation: gl-in 380ms cubic-bezier(.16,1,.3,1) 100ms both, gl-fm 3.6s ease-in-out 800ms infinite; }
        .gl-t { animation: gl-in 380ms cubic-bezier(.16,1,.3,1) 200ms both, gl-ft 3.6s ease-in-out 1100ms infinite; }
        .ch-files-scroll { -webkit-overflow-scrolling: touch; scrollbar-width: thin; scrollbar-color: #e7e5e4 transparent; }
        .dark .ch-files-scroll { scrollbar-color: #3c3836 transparent; }
        .ch-files-scroll::-webkit-scrollbar { height: 2px; }
        .ch-files-scroll::-webkit-scrollbar-thumb { background: #e7e5e4; border-radius: 999px; }
        .dark .ch-files-scroll::-webkit-scrollbar-thumb { background: #3c3836; }
        @media (hover: none) { .ch-files-scroll::-webkit-scrollbar { display: none; } .ch-files-scroll { scrollbar-width: none; } }
        @keyframes ch-hero { from { opacity:0; transform:translateY(14px) } to { opacity:1; transform:translateY(0) } }
        .ch-hero { animation: ch-hero 500ms cubic-bezier(.16,1,.3,1) both; }
        @keyframes th-in  { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }
        @keyframes th-txt { from{opacity:0;transform:translateY(3px)} to{opacity:1;transform:translateY(0)} }
        @keyframes th-line{ from{opacity:0;transform:translateX(-4px)} to{opacity:1;transform:translateX(0)} }
        @keyframes th-exp { from{opacity:0;max-height:0;transform:translateY(-4px)} to{opacity:1;max-height:600px;transform:translateY(0)} }
        @keyframes th-resp{ from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .th-wrap   { animation: th-in  300ms cubic-bezier(.16,1,.3,1) both; }
        .th-label  { animation: th-txt 220ms cubic-bezier(.16,1,.3,1) both; }
        .th-expand { animation: th-exp 280ms cubic-bezier(.16,1,.3,1) both; overflow:hidden; }
        .th-resp   { animation: th-resp 400ms cubic-bezier(.16,1,.3,1) both; }
        .th-line   { animation: th-line 200ms cubic-bezier(.16,1,.3,1) both; }
        @keyframes toast-in { from{opacity:0;transform:translateY(8px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        .ch-toast { animation: toast-in 200ms cubic-bezier(.16,1,.3,1) both; }
        @keyframes ch-spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        .ch-spin { animation: ch-spin 1s linear infinite; }
        @keyframes drag-pulse { 0%,100%{box-shadow:0 0 0 8px rgba(47,175,143,0.08)} 50%{box-shadow:0 0 0 14px rgba(47,175,143,0.04)} }
      `}</style>

      <div
        className="ch relative flex flex-col h-full bg-[#fafaf9] dark:bg-[#0c0a09]"
        onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={e => { e.preventDefault(); setIsDragging(false) }}
        onDrop={e => { e.preventDefault(); setIsDragging(false); processFiles(Array.from(e.dataTransfer.files)) }}
      >
        {/* ── Profile banner ─────────────────────────────────────── */}
        <ProfileBanner />

        {/* ── Overlays ───────────────────────────────────────────── */}

        {lightboxUrl && (
          <div className="fixed inset-0 z-300 bg-black/80 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setLightboxUrl(null)}>
            <button className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors" onClick={() => setLightboxUrl(null)}>
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
            <img src={lightboxUrl} alt="Vista ampliada" className="max-w-full max-h-full rounded-2xl shadow-2xl object-contain" onClick={e => e.stopPropagation()} />
          </div>
        )}

        {confirmNewChat && (
          <div className="fixed inset-0 z-200 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-md" onClick={() => setConfirmNewChat(false)} />
            <div className="relative w-full max-w-75 bg-white dark:bg-[#1c1917] rounded-[20px] shadow-2xl border border-stone-200/80 dark:border-stone-800 overflow-hidden">
              <div className="h-0.75 bg-linear-to-r from-[#2FAF8F] to-[#1a9070]" />
              <div className="p-5">
                <p className="text-[14px] font-semibold text-stone-900 dark:text-stone-50 mb-1">¿Iniciar nuevo chat?</p>
                <p className="text-[12.5px] text-stone-500 dark:text-stone-400 leading-relaxed">La conversación actual se guardará en tu historial.</p>
                <div className="flex gap-2 mt-4">
                  <button onClick={() => setConfirmNewChat(false)} className="flex-1 h-9 rounded-xl text-[13px] font-medium text-stone-600 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 active:scale-[0.98] transition-all">Cancelar</button>
                  <button onClick={doNewChat} className="flex-1 h-9 rounded-xl text-[13px] font-medium text-white bg-[#2FAF8F] hover:bg-[#27a07f] active:scale-[0.98] transition-all shadow-sm">Nuevo chat</button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-200 flex flex-col gap-2 items-center pointer-events-none">
          {toasts.map(t => (
            <div key={t.id} className={`ch-toast flex items-center gap-2.5 px-4 py-2.5 rounded-2xl shadow-lg text-[12.5px] font-medium ${t.kind === 'error' ? 'bg-rose-500 text-white' : 'bg-stone-800 dark:bg-stone-100 text-white dark:text-stone-900'}`}>
              {t.kind === 'error' && <svg style={{ width: 13, height: 13, flexShrink: 0 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><circle cx="12" cy="16" r="0.5" fill="currentColor"/></svg>}
              {t.text}
            </div>
          ))}
        </div>

        {isDragging && (
          <div className="fixed inset-0 z-50 bg-[#2FAF8F]/10 dark:bg-[#2FAF8F]/15 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-white dark:bg-[#1c1917] border-2 border-dashed border-[#2FAF8F]/60 dark:border-[#2FAF8F]/50 rounded-3xl p-14 text-center shadow-[0_0_0_8px_rgba(47,175,143,0.08)]" style={{ animation: 'drag-pulse 1.2s ease-in-out infinite' }}>
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-[#2FAF8F]/15 flex items-center justify-center text-[#2FAF8F]">
                <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>
              </div>
              <p className="text-[15px] font-semibold text-stone-800 dark:text-stone-100">Suelta aquí</p>
              <p className="text-[12.5px] text-stone-400 dark:text-stone-500 mt-1">Imágenes, audios o documentos</p>
            </div>
          </div>
        )}

        {artifact?.kind === 'anima' && (
          <div className="fixed inset-0 z-100 flex flex-col">
            <ArtifactShell artifact={artifact} onClose={closeArtifact} onEscalate={() => {}} onDeescalate={deescalate} />
          </div>
        )}

        {/* ── Split row ─────────────────────────────────────────────── */}
        <div className="flex flex-1 min-h-0">

          {/* ── Chat pane ──────────────────────────────────────────── */}
          <div className={`relative flex flex-col min-w-0 transition-all duration-300 ${artifact?.kind === 'module' ? 'hidden md:flex md:w-[42%]' : 'w-full'}`}>

            {/* Pinned bar — flujo normal, encima del scroll */}
            <PinnedBar messages={messages} onUnpin={handlePin} />

            {/* Scroll to bottom pill */}
            {!isAtBottom && hasNewMsg && (
              <div className="absolute bottom-43.75 left-0 right-0 z-30 pointer-events-none flex justify-center" style={{ width: artifact?.kind === 'module' ? undefined : '100%' }}>
                <button
                  onClick={() => { setIsAtBottom(true); messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); setHasNewMsg(false) }}
                  className="pointer-events-auto ch-toast flex items-center justify-center w-9 h-9 rounded-full bg-white dark:bg-[#1c1917] border border-stone-200/80 dark:border-stone-700/60 shadow-lg hover:bg-stone-50 dark:hover:bg-stone-800 transition-all hover:shadow-xl hover:-translate-y-0.5"
                >
                  <svg className="w-4 h-4 text-[#2FAF8F]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>
                </button>
              </div>
            )}

            {/* Scrollable messages */}
            <div ref={scrollAreaRef} className="ch-scroll flex-1 overflow-y-auto overflow-x-hidden flex flex-col relative w-full">
              <div className="flex-1 flex flex-col px-4 lg:px-6 pt-6">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center flex-1 min-h-[50vh]">
                  <div className="w-full max-w-130 px-2 py-8">
                    <div className="ch-hero text-center mb-10">
                      <h1 className="ch-serif text-[36px] sm:text-[42px] text-stone-900 dark:text-stone-50 leading-[1.18] italic">
                        {greeting}
                      </h1>
                    </div>
                    {assistantPrefs.suggestions && <RotatingPhrase onSelect={setMessage} />}
                    {assistantPrefs.suggestions && (
                      <div className="ch-card flex flex-wrap justify-center gap-2 mt-7" style={{ animationDelay: '300ms' }}>
                        {QUICK_ACTIONS_BY_MODE[mode].map((qa, i) => (
                          <button
                            key={qa.icon}
                            onClick={() => setMessage(`${qa.label}: `)}
                            className="flex items-center gap-1.5 h-8 px-3.5 rounded-full border border-stone-200/80 dark:border-stone-700/50 bg-white dark:bg-[#141210] text-[12px] font-medium text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-100 hover:border-stone-300 dark:hover:border-stone-600 hover:shadow-[0_2px_10px_rgba(0,0,0,0.06)] transition-all duration-150"
                            style={{ animationDelay: `${i * 40 + 320}ms` }}
                          >
                            <span className="text-stone-300 dark:text-stone-600"><QuickIcon icon={qa.icon} /></span>
                            {qa.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="w-full max-w-170 mx-auto space-y-8 pb-4" aria-live="polite" aria-label="Mensajes del chat">
                  {messages.map((msg, idx) => (
                    <ChatMessage
                      key={msg.id}
                      msg={msg}
                      idx={idx}
                      editingIdx={editingIdx}
                      editingText={editingText}
                      copiedId={copiedId}
                      artifact={artifact}
                      onSetEditingIdx={setEditingIdx}
                      onSetEditingText={setEditingText}
                      onEditSave={handleEditSave}
                      onCopy={handleCopy}
                      onRegenerate={handleRegenerate}
                      onPin={handlePin}
                      onFeedback={handleFeedback}
                      onLightbox={setLightboxUrl}
                      onAddToast={addToast}
                      onCloseArtifact={closeArtifact}
                      renderInlineWidget={renderInlineWidget}
                      onToggleThoughts={handleToggleThoughts}
                      MAX_CHARS={4000}
                    />
                  ))}

                  {/* Generating: logo → thinking → streaming */}
                  {(isGenerating || isSimulating) && (
                    <div className="ch-msg flex gap-3">
                      <div className="flex-1 pt-0.5">
                        {isSaving ? (
                          <div className="flex items-center gap-2 text-[12.5px] text-stone-400 dark:text-stone-500">
                            <svg className="w-3.5 h-3.5 ch-spin text-[#2FAF8F]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                            Subiendo archivos…
                          </div>
                        ) : !showThinking && !isStreaming && !(isSimulating && simSteps.length > 0) ? (
                          <div className="gl-wrap py-1">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2FAF8F" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                              <g className="gl-b"><path d="M2 17l10 5 10-5"/></g>
                              <g className="gl-m"><path d="M2 12l10 5 10-5"/></g>
                              <g className="gl-t"><path d="M12 2L2 7l10 5 10-5-10-5z"/></g>
                            </svg>
                          </div>
                        ) : isStreaming ? (
                          <div className="text-[14px] leading-[1.75] text-stone-700 dark:text-stone-200 space-y-1">
                            {renderContent(streamingText)}
                            <span className="inline-block w-0.5 h-3.5 bg-[#2FAF8F] ml-0.5 align-middle animate-pulse" />
                          </div>
                        ) : (
                          <ThinkingBlock
                            thoughts={isSimulating ? (simSteps.length > 0 ? simSteps : ['Procesando…']) : (thinkingSteps.length > 0 ? thinkingSteps : ['Procesando…'])}
                            currentIdx={isSimulating ? simIdx : thinkingIdx}
                            done={isSimulating ? simDone : thinkingDone}
                            expanded={thinkingExpanded}
                            onToggle={() => setThinkingExpanded(p => !p)}
                          />
                        )}
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} className="h-4" />
                </div>
              )}
              </div>

              {/* Input bar flotante anclado en la parte inferior del scroll */}
              <div className="sticky bottom-0 z-20 mt-auto pt-8 pb-0 bg-gradient-to-t from-[#fafaf9] via-[#fafaf9] via-60% to-transparent dark:from-[#0c0a09] dark:via-[#0c0a09] dark:via-60%">
                <ChatInputBar
              message={message}
              onMessageChange={setMessage}
              attachedFiles={attachedFiles}
              onRemoveFile={(id, name) => {
                setAttachedFiles(p => p.filter(x => x.id !== id))
                setPendingFiles(p => p.filter(x => x.name !== name))
              }}
              onClearFiles={() => { setAttachedFiles([]); setPendingFiles([]) }}
              pendingFiles={pendingFiles}
              isOnline={isOnline}
              isGenerating={isGenerating}
              isSimulating={isSimulating}
              messagesCount={messages.length}
              mode={mode}
              model={model}
              modeOpen={modeOpen}
              modelOpen={modelOpen}
              onSetMode={setMode}
              onSetModel={setModel}
              onSetModeOpen={setModeOpen}
              onSetModelOpen={setModelOpen}
              onSend={handleSend}
              onStop={handleStop}
              onNewChat={handleNewChat}
              onProcessFiles={processFiles}
              onNavigateVoz={() => navigate('/voz')}
              dictationActive={dictation.active}
              onDictationStop={dictation.stop}
            />
              </div>
            </div>
          </div>

          {/* ── Artifact pane ──────────────────────────────────────── */}
          {artifact?.kind === 'module' && (
            <div className="flex flex-col border-l border-stone-200/70 dark:border-stone-800 w-full md:w-[58%]">
              <ArtifactShell artifact={artifact} onClose={closeArtifact} onEscalate={escalate} onDeescalate={deescalate} />
            </div>
          )}

        </div>
      </div>
    </>
  )
}