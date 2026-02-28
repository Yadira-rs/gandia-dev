import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import PassportCard from '../../artifacts/passport/PassportCard'
import ArtifactShell, { type ArtifactType } from '../../artifacts/ArtifactShell'
import { detectPassportIntent, MOCK_PASSPORT } from '../../artifacts/passport/mockData'
import ProfileBanner from '../../components/ui/ProfileBanner'
import {
  chatService,
  type ChatMode,
  type ChatModel,
  type ChatMessage as DBMessage,
  type AttachedFile,
} from '../../lib/chatService'

// ─── TYPES ────────────────────────────────────────────────────────────────────

type UIMessage = {
  id:               string          // DB id (o temp id mientras se guarda)
  role:             'user' | 'assistant'
  content:          string
  files:            AttachedFile[]
  thoughts:         string[]
  thoughtsExpanded: boolean
  isError:          boolean
  model?:           ChatModel
  ts:               number          // timestamp local para relativeTime
  artifact?:        ArtifactType    // artefacto inline simulado (no se guarda en DB)
}

type Toast = { id: string; text: string; kind: 'error' | 'info' }

const MAX_CHARS   = 4000
const MAX_FILE_MB = 10

// Modelo de asistente — solo visible en modo 'asistente'
const MODELS_ASISTENTE: { id: ChatModel; label: string; desc: string }[] = [
  { id: 'acipe', label: 'Siete 1.0', desc: 'Asistente ganadero' },
]

// Modelos externos — solo visibles en modos 'noticias' e 'investigacion'
const MODELS_EXTERNOS: { id: ChatModel; label: string; desc: string }[] = [
  { id: 'claude', label: 'Claude', desc: 'Análisis profundo' },
  { id: 'gpt4o',  label: 'GPT-4o', desc: 'Respuesta rápida'  },
  { id: 'gemini', label: 'Gemini', desc: 'Multimodal'         },
]

const QUICK_ACTIONS = [
  { icon: 'passport', label: 'Pasaportes',  desc: 'Estado de mis trámites activos' },
  { icon: 'price',    label: 'Precios',     desc: 'Mercado hoy en el norte'        },
  { icon: 'health',   label: 'Sanidad',     desc: 'Alertas SENASICA vigentes'      },
  { icon: 'export',   label: 'Exportación', desc: 'Requisitos FDA actualizados'    },
]

// ─── ICONS ────────────────────────────────────────────────────────────────────
const I = {
  Send: () => (
    <svg className="w-4.25 h-4.25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>
    </svg>
  ),
  Mic: () => (
    <svg className="w-4.25 h-4.25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
      <line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
    </svg>
  ),
  Clip: () => (
    <svg className="w-4.25 h-4.25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
    </svg>
  ),
  ChevronDown: () => (
    <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  ),
  ChevronUp: () => (
    <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <polyline points="18 15 12 9 6 15"/>
    </svg>
  ),
  News: () => (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 0-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/>
      <path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6Z"/>
    </svg>
  ),
  Chat: () => (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  ),
  Search: () => (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  Copy: () => (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
    </svg>
  ),
  Refresh: () => (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
    </svg>
  ),
  Edit: () => (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  ),
  X: () => (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  Passport: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2"/><circle cx="12" cy="11" r="3"/>
      <path d="M9 17c0-1.66 1.34-3 3-3s3 1.34 3 3"/>
    </svg>
  ),
  TrendUp: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
    </svg>
  ),
  Shield: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  Globe: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  ),
  Spark: () => (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
    </svg>
  ),
  Pin: () => (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  Trash: () => (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
      <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
    </svg>
  ),
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const fmt = (b: number) =>
  b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(1)} MB`

function relativeTime(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000)
  if (diff < 10)   return 'ahora'
  if (diff < 60)   return `hace ${diff}s`
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`
  return new Date(ts).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
}

function dbToUI(msg: DBMessage): UIMessage {
  return {
    id:               msg.id,
    role:             msg.role === 'system' ? 'assistant' : msg.role,
    content:          msg.content,
    files:            msg.files ?? [],
    thoughts:         msg.thoughts ?? [],
    thoughtsExpanded: false,
    isError:          msg.is_error,
    model:            msg.model,
    ts:               new Date(msg.created_at).getTime(),
  }
}

// ─── FILE HELPERS ─────────────────────────────────────────────────────────────
function getFileKind(type: string, name: string) {
  if (type.startsWith('image/'))                                                        return 'image'
  if (type.startsWith('audio/'))                                                        return 'audio'
  if (type === 'application/pdf' || name.endsWith('.pdf'))                              return 'pdf'
  if (type.includes('spreadsheet') || name.endsWith('.xlsx') || name.endsWith('.xls')) return 'xlsx'
  if (type.includes('wordprocessingml') || name.endsWith('.docx') || name.endsWith('.doc')) return 'docx'
  if (type === 'text/plain' || name.endsWith('.txt'))                                   return 'txt'
  return 'generic'
}

const FILE_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  pdf:     { bg: 'bg-red-50 dark:bg-red-950/30',        color: 'text-red-500',     label: 'PDF'  },
  xlsx:    { bg: 'bg-emerald-50 dark:bg-emerald-950/30', color: 'text-emerald-500', label: 'XLS'  },
  docx:    { bg: 'bg-blue-50 dark:bg-blue-950/30',       color: 'text-blue-500',    label: 'DOC'  },
  image:   { bg: 'bg-[#2FAF8F]/08 dark:bg-[#2FAF8F]/10', color: 'text-[#2FAF8F]',  label: 'IMG'  },
  audio:   { bg: 'bg-purple-50 dark:bg-purple-950/30',   color: 'text-purple-500',  label: 'AUD'  },
  txt:     { bg: 'bg-stone-100 dark:bg-stone-800/50',    color: 'text-stone-400',   label: 'TXT'  },
  generic: { bg: 'bg-stone-100 dark:bg-stone-800/50',    color: 'text-stone-400',   label: 'FILE' },
}

const FileTypeIcon = ({ kind }: { kind: string }) => {
  const c = `w-4 h-4 ${FILE_STYLES[kind]?.color ?? 'text-stone-400'}`
  if (kind === 'pdf') return (
    <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
      <line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="11" y2="17"/>
    </svg>
  )
  if (kind === 'xlsx') return (
    <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
      <line x1="9" y1="13" x2="11" y2="17"/><line x1="11" y1="13" x2="9" y2="17"/>
    </svg>
  )
  if (kind === 'docx') return (
    <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
      <line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="15" y2="17"/>
    </svg>
  )
  if (kind === 'image') return (
    <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
      <polyline points="21 15 16 10 5 21"/>
    </svg>
  )
  if (kind === 'audio') return (
    <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
    </svg>
  )
  return (
    <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
      <line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/>
    </svg>
  )
}

function FileChip({ f, onRemove }: { f: AttachedFile; onRemove?: () => void }) {
  const kind = getFileKind(f.type, f.name)
  const s    = FILE_STYLES[kind]
  return (
    <div className="flex items-center gap-2 pl-2.5 pr-2 py-1.5 rounded-xl border border-stone-200/70 dark:border-stone-800/60 bg-white dark:bg-[#1c1917] text-[12px]">
      <div className={`w-6 h-6 rounded-lg ${s.bg} flex items-center justify-center shrink-0`}>
        <FileTypeIcon kind={kind} />
      </div>
      <span className="font-medium text-stone-700 dark:text-stone-300 truncate max-w-32.5">{f.name}</span>
      <span className="text-stone-300 dark:text-stone-600 shrink-0 text-[10.5px]">{fmt(f.size)}</span>
      {onRemove && (
        <button onClick={onRemove} className="text-stone-300 hover:text-stone-500 dark:hover:text-stone-400 transition-colors ml-0.5">
          <I.X />
        </button>
      )}
    </div>
  )
}

function SentFileChip({ f, onLightbox }: { f: AttachedFile; onLightbox?: (url: string) => void }) {
  const kind = getFileKind(f.type, f.name)
  const s    = FILE_STYLES[kind]
  if (kind === 'image' && f.url) {
    return (
      <div
        className="rounded-xl overflow-hidden border border-stone-200/50 dark:border-stone-700/40 bg-stone-100 dark:bg-stone-800/30 cursor-zoom-in"
        style={{ maxWidth: 260 }}
        onClick={() => onLightbox?.(f.url)}
      >
        <img src={f.url} alt={f.name} className="w-full object-cover hover:opacity-90 transition-opacity" style={{ maxHeight: 180 }} />
        <div className="flex items-center gap-2 px-2.5 py-1.5">
          <p className="text-[11px] font-medium text-stone-500 dark:text-stone-400 truncate flex-1">{f.name}</p>
          <p className="text-stone-400 dark:text-stone-500 text-[10px] shrink-0">{fmt(f.size)}</p>
        </div>
      </div>
    )
  }
  return (
    <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl border border-stone-200/50 dark:border-stone-700/40 bg-stone-50/80 dark:bg-stone-800/30 text-[12px]">
      <div className={`w-7 h-7 rounded-[9px] ${s.bg} flex items-center justify-center shrink-0 border border-stone-200/40 dark:border-stone-700/30`}>
        <FileTypeIcon kind={kind} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-stone-700 dark:text-stone-300 truncate leading-snug" style={{ maxWidth: '220px' }}>{f.name}</p>
        <p className="text-stone-400 dark:text-stone-500 text-[10.5px] mt-px leading-none">{s.label} · {fmt(f.size)}</p>
      </div>
      <svg className="w-3.5 h-3.5 text-stone-300 dark:text-stone-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
    </div>
  )
}

const QuickIcon = ({ icon }: { icon: string }) => {
  if (icon === 'passport') return <I.Passport />
  if (icon === 'price')    return <I.TrendUp />
  if (icon === 'health')   return <I.Shield />
  return <I.Globe />
}

const ROTATING_PHRASES = [
  '¿Qué pasa con los precios esta semana?',
  '¿Hay alertas sanitarias en mi zona?',
  '¿Cuándo vence mi próximo trámite?',
  '¿Cuáles son los nuevos requisitos de la FDA?',
  '¿Cómo afecta el clima a mi ganado?',
]

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

// ─── MARKDOWN RENDERER ────────────────────────────────────────────────────────
function renderContent(text: string) {
  const lines    = text.split('\n')
  const elements: React.ReactNode[] = []
  let key = 0
  const renderInline = (line: string) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g)
    return parts.map((p, i) =>
      p.startsWith('**') && p.endsWith('**')
        ? <strong key={i} className="font-semibold text-stone-800 dark:text-stone-100">{p.slice(2, -2)}</strong>
        : p
    )
  }
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    if (!line.trim()) { elements.push(<div key={key++} className="h-3" />); i++; continue }
    if (line.match(/^[-•]\s/)) {
      const items: string[] = []
      while (i < lines.length && lines[i].match(/^[-•]\s/)) { items.push(lines[i].replace(/^[-•]\s/, '')); i++ }
      elements.push(
        <ul key={key++} className="space-y-1 my-1">
          {items.map((item, ii) => (
            <li key={ii} className="flex items-start gap-2.5 text-[14px] text-stone-600 dark:text-stone-300 leading-[1.7]">
              <span className="mt-1.75 w-1 h-1 rounded-full bg-[#2FAF8F]/60 shrink-0" />
              <span>{renderInline(item)}</span>
            </li>
          ))}
        </ul>
      )
      continue
    }
    if (line.match(/^\*\*[^*]+\*\*$/)) {
      elements.push(
        <p key={key++} className="text-[14px] font-semibold text-stone-800 dark:text-stone-100 leading-snug mt-4 first:mt-0">
          {line.slice(2, -2)}
        </p>
      )
      i++; continue
    }
    elements.push(
      <p key={key++} className="text-[14px] text-stone-700 dark:text-stone-200 leading-[1.75]">
        {renderInline(line)}
      </p>
    )
    i++
  }
  return elements
}

// ─── THINKING BLOCK ───────────────────────────────────────────────────────────
function ThinkingBlock({
  thoughts, currentIdx, done, expanded, onToggle,
}: {
  thoughts: string[]; currentIdx: number; done: boolean; expanded: boolean; onToggle: () => void
}) {
  const visible = done ? thoughts : thoughts.slice(0, currentIdx + 1)
  return (
    <div className="th-wrap max-w-120">
      <button onClick={onToggle} className="flex items-center gap-2.5 group" aria-expanded={expanded}>
        <span aria-live="polite" aria-atomic="true" className="sr-only">
          {done ? `Análisis completado: ${thoughts.length} pasos` : `Pensando: ${thoughts[currentIdx]}`}
        </span>
        {!done ? (
          <span className="flex items-center shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2FAF8F" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <g className="gl-b"><path d="M2 17l10 5 10-5"/></g>
              <g className="gl-m"><path d="M2 12l10 5 10-5"/></g>
              <g className="gl-t"><path d="M12 2L2 7l10 5 10-5-10-5z"/></g>
            </svg>
          </span>
        ) : (
          <svg className="w-3.25 h-3.25 text-[#2FAF8F] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        )}
        <span key={`t-${currentIdx}-${done}`} className="th-label ch-serif italic text-[13px] leading-snug text-stone-400 dark:text-stone-500">
          {done ? `Analicé ${thoughts.length} pasos` : thoughts[currentIdx]}
        </span>
        <svg
          className={`w-2.5 h-2.5 shrink-0 transition-all duration-200 ${expanded ? 'rotate-180 text-stone-400 opacity-100' : 'text-stone-300 opacity-0 group-hover:opacity-100'}`}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      {expanded && (
        <div className="th-expand mt-3 space-y-2.5">
          {visible.map((t, i) => (
            <div key={i} className="th-line flex items-start gap-2.5" style={{ animationDelay: `${i * 40}ms` }}>
              <span className="mt-1.25 shrink-0 w-1.25 h-1.25 rounded-full bg-[#2FAF8F]/40" />
              <p className="text-[12px] text-stone-400 dark:text-stone-500 leading-[1.65]">{t}</p>
            </div>
          ))}
          {!done && (
            <div className="flex items-start gap-2.5">
              <span className="mt-1.25 shrink-0 w-1.25 h-1.25 rounded-full bg-stone-200 dark:bg-stone-700" />
              <p className="text-[12px] text-stone-300 dark:text-stone-700 italic leading-[1.65]">Procesando…</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function IcoCheck() {
  return (
    <svg className="w-3.5 h-3.5 text-[#2FAF8F]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  )
}
function ActionBtn({ onClick, title, children }: { onClick: () => void; title: string; children: React.ReactNode }) {
  return (
    <button onClick={onClick} title={title} className="w-6 h-6 flex items-center justify-center rounded-lg text-stone-300 dark:text-stone-600 hover:text-stone-500 dark:hover:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800/60 transition-all">
      {children}
    </button>
  )
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function Chat() {
  // ── UI state ────────────────────────────────────────────────────────────────
  const [message, setMessage]                   = useState('')
  const [messages, setMessages]                 = useState<UIMessage[]>([])
  const [attachedFiles, setAttachedFiles]       = useState<AttachedFile[]>([])
  const [pendingFiles, setPendingFiles]         = useState<File[]>([])  // Files esperando subirse
  const [isDragging, setIsDragging]             = useState(false)
  const [isGenerating, setIsGenerating]         = useState(false)
  const [showThinking, setShowThinking]         = useState(false)
  const [thinkingSteps, setThinkingSteps]       = useState<string[]>([])
  const [thinkingIdx, setThinkingIdx]           = useState(0)
  const [thinkingDone, setThinkingDone]         = useState(false)
  const [thinkingExpanded, setThinkingExpanded] = useState(false)
  const [streamingText, setStreamingText]       = useState('')
  const [isStreaming, setIsStreaming]           = useState(false)
  const [toasts, setToasts]                     = useState<Toast[]>([])
  const [copiedId, setCopiedId]                 = useState<string | null>(null)
  const [isAtBottom, setIsAtBottom]             = useState(true)
  const [hasNewMsg, setHasNewMsg]               = useState(false)
  const [editingIdx, setEditingIdx]             = useState<number | null>(null)
  const [editingText, setEditingText]           = useState('')
  const [lightboxUrl, setLightboxUrl]           = useState<string | null>(null)
  const [confirmNewChat, setConfirmNewChat]     = useState(false)
  const [mode, setMode]                         = useState<ChatMode>('asistente')
  const [model, setModel]                       = useState<ChatModel>('acipe')
  const [modelOpen, setModelOpen]               = useState(false)
  const [modeOpen, setModeOpen]                 = useState(false)

  // ── Routing — debe ir antes de cualquier useState que use searchParams ───────
  const navigate       = useNavigate()
  const [searchParams] = useSearchParams()

  // ── Artifact state — inicializa desde URL param si viene desde /pasaportes etc ──
  const [activeArtifact,    setActiveArtifact]    = useState<ArtifactType | null>(() =>
    searchParams.get('artifact') as ArtifactType | null
  )
  const [artifactFullscreen, setArtifactFullscreen] = useState(false)

  // ── DB / session state ──────────────────────────────────────────────────────
  const [conversationId, setConversationId]     = useState<string | null>(null)
  const loadingMessages = false
  const [isSaving, setIsSaving]                 = useState(false) // uploading files

  // ── Refs ────────────────────────────────────────────────────────────────────
  const textareaRef    = useRef<HTMLTextAreaElement>(null)
  const fileInputRef   = useRef<HTMLInputElement>(null)
  const modelRef       = useRef<HTMLDivElement>(null)
  const modeRef        = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollAreaRef  = useRef<HTMLDivElement>(null)
  const abortRef       = useRef<AbortController | null>(null)

  const activeModels   = mode === 'asistente' ? MODELS_ASISTENTE : MODELS_EXTERNOS
  const selectedModel  = activeModels.find(m => m.id === model) ?? activeModels[0]

  // ─── Toast ──────────────────────────────────────────────────────────────────
  const addToast = useCallback((text: string, kind: Toast['kind'] = 'error') => {
    const id = crypto.randomUUID()
    setToasts(p => [...p, { id, text, kind }])
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500)
  }, [])

  // ─── Process files (local preview) ──────────────────────────────────────────
  const processFiles = useCallback((files: File[]) => {
    const ACCEPTED     = ['image/', 'audio/', 'application/pdf', 'application/vnd', 'text/plain']
    const ACCEPTED_EXT = ['.pdf', '.doc', '.docx', '.txt', '.xlsx', '.xls']
    files.forEach(file => {
      const ok = ACCEPTED.some(t => file.type.startsWith(t)) || ACCEPTED_EXT.some(e => file.name.toLowerCase().endsWith(e))
      if (!ok) { addToast(`Tipo no soportado: ${file.name.split('.').pop()?.toUpperCase() ?? '?'}`, 'error'); return }
      if (file.size > MAX_FILE_MB * 1024 * 1024) { addToast(`Máx. ${MAX_FILE_MB} MB: ${file.name}`, 'error'); return }
      const preview: AttachedFile = {
        id:   crypto.randomUUID(),
        name: file.name,
        type: file.type,
        size: file.size,
        url:  URL.createObjectURL(file),
      }
      setAttachedFiles(prev => [...prev, preview])
      setPendingFiles(prev => [...prev, file])
    })
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [addToast])

  // ─── Auto-scroll ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isAtBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      const t = setTimeout(() => setHasNewMsg(false), 0)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => setHasNewMsg(true), 0)
    return () => clearTimeout(t)
  }, [messages, isGenerating, streamingText, isAtBottom])

  useEffect(() => {
    const el = scrollAreaRef.current
    if (!el) return
    const fn = () => { setIsAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 80) }
    el.addEventListener('scroll', fn, { passive: true })
    return () => el.removeEventListener('scroll', fn)
  }, [])

  // ─── Auto-resize textarea ────────────────────────────────────────────────────
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 180) + 'px'
    }
  }, [message])

  // ─── Paste images ───────────────────────────────────────────────────────────
  useEffect(() => {
    const fn = (e: ClipboardEvent) => {
      const imgs = Array.from(e.clipboardData?.items ?? []).filter(i => i.type.startsWith('image/'))
      if (!imgs.length) return
      e.preventDefault()
      imgs.forEach(i => { const f = i.getAsFile(); if (f) processFiles([f]) })
    }
    document.addEventListener('paste', fn)
    return () => document.removeEventListener('paste', fn)
  }, [processFiles])

  // ─── Close dropdowns on outside click ───────────────────────────────────────
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (modelRef.current   && !modelRef.current.contains(e.target as Node))   setModelOpen(false)
      if (modeRef.current    && !modeRef.current.contains(e.target as Node))    setModeOpen(false)
    }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  // ─── Copy ───────────────────────────────────────────────────────────────────
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 1800)
  }

  // ─── Stop generation ────────────────────────────────────────────────────────
  const handleStop = useCallback(() => {
    abortRef.current?.abort()
    setIsGenerating(false)
    setIsStreaming(false)
    setShowThinking(false)
    // Guardar lo que llegó hasta aquí si hay texto
    setStreamingText(prev => {
      if (prev.trim() && conversationId) {
        const partial = prev
        chatService.saveMessage({
          conversation_id: conversationId,
          role: 'assistant',
          content: partial + ' ∎',
          metadata: { stopped: true },
        }).catch(() => {/* best effort */})
        setMessages(p => [...p, {
          id: crypto.randomUUID(), role: 'assistant', content: partial + ' ∎',
          files: [], thoughts: [], thoughtsExpanded: false, isError: false,
          ts: Date.now(),
        }])
      }
      return ''
    })
  }, [conversationId])

  // ─── NEW CHAT ────────────────────────────────────────────────────────────────
  const doNewChat = useCallback(() => {
    handleStop()
    setMessages([])
    setConversationId(null)
    setConfirmNewChat(false)
    setStreamingText('')
    setThinkingSteps([])
  }, [handleStop])

  const handleNewChat = () => {
    if (messages.length > 0) { setConfirmNewChat(true); return }
    doNewChat()
  }

  // ─── CORE SEND ──────────────────────────────────────────────────────────────
  const runGeneration = useCallback(async (
    userContent:   string,
    filesToSend:   AttachedFile[],
    rawFiles:      File[],
    convId:        string | null,
    history:       UIMessage[],
  ) => {
    setIsGenerating(true)
    setShowThinking(false)
    setThinkingSteps([])
    setThinkingIdx(0)
    setThinkingDone(false)
    setThinkingExpanded(false)
    setStreamingText('')
    setIsStreaming(false)
    setIsAtBottom(true)

    abortRef.current = new AbortController()

    try {
      // 1️⃣ Crear conversación si no existe
      let currentConvId = convId
      if (!currentConvId) {
        const conv = await chatService.createConversation({ mode, model })
        currentConvId = conv.id
        setConversationId(conv.id)
      }

      // 2️⃣ Subir archivos adjuntos a Storage
      let uploadedFiles: AttachedFile[] = filesToSend.filter(f => f.storage_path) // ya subidos
      if (rawFiles.length > 0) {
        setIsSaving(true)
        try {
          const uploads = await Promise.all(
            rawFiles.map(f => chatService.uploadFile(f, currentConvId!))
          )
          uploadedFiles = [...uploadedFiles, ...uploads]
        } catch {
          addToast('Error al subir archivos. Intenta de nuevo.', 'error')
          setIsGenerating(false)
          setIsSaving(false)
          return
        }
        setIsSaving(false)
      }

      // 3️⃣ Guardar mensaje del usuario en BD
      const savedUser = await chatService.saveMessage({
        conversation_id: currentConvId,
        role:    'user',
        content: userContent,
        files:   uploadedFiles,
      })

      // Actualizar el mensaje UI con el id real y los archivos subidos
      setMessages(prev => prev.map(m =>
        m.id === 'temp-user' ? { ...dbToUI(savedUser), thoughtsExpanded: false } : m
      ))

      // 4️⃣ Construir historial para ACIPE (sin el mensaje de sistema, solo user/assistant)
      const apiHistory = [
        ...history.filter(m => !m.isError).map(m => ({
          role:    m.role as 'user' | 'assistant',
          content: m.content,
        })),
        { role: 'user' as const, content: userContent },
      ]

      // 5️⃣ Llamar a ACIPE con streaming
      setShowThinking(true)

      // Manejo de thoughts que llegan via streaming
      let localThoughts: string[] = []

      const response = await chatService.callAcipe(
        apiHistory,
        mode,
        model,
        // onChunk — recibe texto o un JSON de thoughts
        (chunk: string) => {
          // Detectar si el chunk es un thought especial
          if (chunk.startsWith('__THOUGHT__:')) {
            const thought = chunk.replace('__THOUGHT__:', '').trim()
            localThoughts = [...localThoughts, thought]
            setThinkingSteps([...localThoughts])
            setThinkingIdx(localThoughts.length - 1)
            return
          }
          if (chunk === '__THOUGHTS_DONE__') {
            setThinkingDone(true)
            setShowThinking(false)
            setIsStreaming(true)
            return
          }
          setStreamingText(prev => prev + chunk)
        },
      )

      // 6️⃣ Guardar respuesta del asistente en BD
      const savedAssistant = await chatService.saveMessage({
        conversation_id: currentConvId,
        role:        'assistant',
        content:     response.content,
        thoughts:    response.thoughts,
        model:       response.model,
        tokens_used: response.tokens_used,
        latency_ms:  response.latency_ms,
      })

      // 7️⃣ Commit al estado UI
      setIsGenerating(false)
      setIsStreaming(false)
      setStreamingText('')
      setShowThinking(false)
      setMessages(prev => [...prev, { ...dbToUI(savedAssistant), thoughtsExpanded: false }])

    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return // usuario lo detuvo

      setIsGenerating(false)
      setIsStreaming(false)
      setShowThinking(false)
      setStreamingText('')

      const errorText = err instanceof Error ? err.message : 'Error desconocido'
      addToast(errorText, 'error')

      // Guardar mensaje de error en BD si tenemos conversación
      if (conversationId) {
        chatService.saveMessage({
          conversation_id: conversationId,
          role:     'assistant',
          content:  '',
          is_error: true,
          metadata: { error: errorText },
        }).catch(() => {/* best effort */})
      }

      setMessages(prev => [...prev, {
        id: crypto.randomUUID(), role: 'assistant', content: '',
        files: [], thoughts: [], thoughtsExpanded: false, isError: true,
        ts: Date.now(),
      }])
    }
  }, [mode, model, conversationId, addToast])

  // ─── SIMULATED PASSPORT RESPONSE (no API call) ──────────────────────────────
  const runPassportSimulation = useCallback(() => {
    setIsGenerating(true)
    setShowThinking(true)
    setThinkingSteps(['Consultando índice institucional SINIIGA...'])
    setThinkingIdx(0)
    setThinkingDone(false)
    setIsAtBottom(true)

    // Simular pasos de thinking progresivos
    const steps = [
      'Consultando índice institucional SINIIGA...',
      'Recuperando datos biométricos, sanitarios y de propiedad...',
      'Verificando elegibilidad · Protocolo USDA/SENASICA...',
      'Estatus: ELEGIBLE · Arete Azul activo · Sin alertas sanitarias',
    ]
    steps.forEach((_step, i) => {
      setTimeout(() => {
        setThinkingSteps(steps.slice(0, i + 1))
        setThinkingIdx(i)
        if (i === steps.length - 1) {
          setThinkingDone(true)
          setTimeout(() => {
            setShowThinking(false)
            setIsStreaming(true)
            // Añadir respuesta simulada con artefacto
            setTimeout(() => {
              setIsGenerating(false)
              setIsStreaming(false)
              setMessages(prev => {
                // Actualizar temp-user con id real
                const withRealUser = prev.map(m =>
                  m.id === 'temp-user' ? { ...m, id: crypto.randomUUID() } : m
                )
                return [...withRealUser, {
                  id:               crypto.randomUUID(),
                  role:             'assistant' as const,
                  content:          'Aquí está el Pasaporte Digital del Ejemplar #892.',
                  files:            [],
                  thoughts:         steps,
                  thoughtsExpanded: false,
                  isError:          false,
                  model:            'acipe' as ChatModel,
                  ts:               Date.now(),
                  artifact:         'passport' as ArtifactType,
                }]
              })
            }, 400)
          }, 300)
        }
      }, i * 900)
    })
  }, [])

  // ─── SEND ────────────────────────────────────────────────────────────────────
  const handleSend = useCallback(() => {
    const trimmed = message.trim()
    if (!trimmed && attachedFiles.length === 0) return
    if (isGenerating) return

    const tempUserMsg: UIMessage = {
      id:               'temp-user',
      role:             'user',
      content:          trimmed,
      files:            [...attachedFiles],
      thoughts:         [],
      thoughtsExpanded: false,
      isError:          false,
      ts:               Date.now(),
    }

    const currentHistory = [...messages]
    setMessages(prev => [...prev, tempUserMsg])
    setMessage('')
    setAttachedFiles([])
    const rawToUpload = [...pendingFiles]
    setPendingFiles([])
    if (textareaRef.current) textareaRef.current.style.height = 'auto'

    // Interceptar intent de pasaporte — respuesta simulada sin tocar la API
    if (detectPassportIntent(trimmed) && attachedFiles.length === 0) {
      runPassportSimulation()
      return
    }

    runGeneration(trimmed, attachedFiles, rawToUpload, conversationId, currentHistory)
  }, [message, attachedFiles, pendingFiles, isGenerating, messages, conversationId, runGeneration, runPassportSimulation])

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  // ─── EDIT & RESEND ───────────────────────────────────────────────────────────
  const handleEditSave = useCallback((idx: number) => {
    const trimmed = editingText.trim()
    if (!trimmed) return
    const updatedHistory = messages.slice(0, idx).concat({ ...messages[idx], content: trimmed, ts: Date.now() })
    setMessages(updatedHistory)
    setEditingIdx(null)
    setEditingText('')
    // Re-run desde ese punto
    runGeneration(trimmed, [], [], conversationId, messages.slice(0, idx))
  }, [editingText, messages, conversationId, runGeneration])

  // ─── REGENERATE ──────────────────────────────────────────────────────────────
  const handleRegenerate = useCallback((idx: number) => {
    const prevHistory = messages.slice(0, idx)
    const lastUser    = [...prevHistory].reverse().find(m => m.role === 'user')
    if (!lastUser) return
    setMessages(prevHistory)
    runGeneration(lastUser.content, lastUser.files ?? [], [], conversationId, prevHistory.slice(0, -1))
  }, [messages, conversationId, runGeneration])

  // ─── Mode / model labels ─────────────────────────────────────────────────────
  const modeLabel: Record<ChatMode, string> = {
    asistente:     'Asistente',
    noticias:      'Noticias',
    investigacion: 'Investigación',
  }
  const modeIcon = (m: ChatMode) => {
    if (m === 'noticias')      return <I.News />
    if (m === 'investigacion') return <I.Search />
    return <I.Chat />
  }
  const isActiveMode = mode !== 'asistente'

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
        .ch-scroll::-webkit-scrollbar { width: 3px; }
        .ch-scroll::-webkit-scrollbar-track { background: transparent; }
        .ch-scroll::-webkit-scrollbar-thumb { background: #e7e5e4; border-radius: 999px; }
        .dark .ch-scroll::-webkit-scrollbar-thumb { background: #3c3836; }
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
        @keyframes th-dot { 0%,80%,100%{opacity:.25;transform:scale(.85)} 40%{opacity:1;transform:scale(1)} }
        @keyframes th-line{ from{opacity:0;transform:translateX(-4px)} to{opacity:1;transform:translateX(0)} }
        @keyframes th-exp { from{opacity:0;max-height:0;transform:translateY(-4px)} to{opacity:1;max-height:600px;transform:translateY(0)} }
        @keyframes th-resp{ from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .th-wrap   { animation: th-in  300ms cubic-bezier(.16,1,.3,1) both; }
        .th-label  { animation: th-txt 220ms cubic-bezier(.16,1,.3,1) both; }
        .th-expand { animation: th-exp 280ms cubic-bezier(.16,1,.3,1) both; overflow:hidden; }
        .th-resp   { animation: th-resp 400ms cubic-bezier(.16,1,.3,1) both; }
        .th-line   { animation: th-line 200ms cubic-bezier(.16,1,.3,1) both; }
        @keyframes toast-in  { from{opacity:0;transform:translateY(8px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        .ch-toast { animation: toast-in 200ms cubic-bezier(.16,1,.3,1) both; }
        @keyframes ch-spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        .ch-spin { animation: ch-spin 1s linear infinite; }
      `}</style>

      <div
        className="ch relative flex flex-col h-full bg-[#fafaf9] dark:bg-[#0c0a09]"
        onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={e => { e.preventDefault(); setIsDragging(false) }}
        onDrop={e => { e.preventDefault(); setIsDragging(false); processFiles(Array.from(e.dataTransfer.files)) }}
      >

        {/* ── BANNER PERFIL INCOMPLETO (ocupa su propio row) ────────── */}
        <ProfileBanner />

        {/* ── OVERLAYS (fixed, no afectan el layout) ───────────────── */}

        {/* LIGHTBOX */}
        {lightboxUrl && (
          <div className="fixed inset-0 z-300 bg-black/80 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setLightboxUrl(null)}>
            <button className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors" onClick={() => setLightboxUrl(null)}>
              <I.X />
            </button>
            <img src={lightboxUrl} alt="Vista ampliada" className="max-w-full max-h-full rounded-2xl shadow-2xl object-contain" onClick={e => e.stopPropagation()} />
          </div>
        )}

        {/* CONFIRM NUEVO CHAT */}
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

        {/* TOASTS */}
        <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-200 flex flex-col gap-2 items-center pointer-events-none">
          {toasts.map(t => (
            <div key={t.id} className={`ch-toast flex items-center gap-2.5 px-4 py-2.5 rounded-2xl shadow-lg text-[12.5px] font-medium ${t.kind === 'error' ? 'bg-rose-500 text-white' : 'bg-stone-800 dark:bg-stone-100 text-white dark:text-stone-900'}`}>
              {t.kind === 'error' && (
                <svg style={{ width: 13, height: 13, flexShrink: 0 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><circle cx="12" cy="16" r="0.5" fill="currentColor"/>
                </svg>
              )}
              {t.text}
            </div>
          ))}
        </div>

        {/* DRAG OVERLAY */}
        {isDragging && (
          <div className="fixed inset-0 z-50 bg-[#2FAF8F]/08 dark:bg-[#2FAF8F]/12 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-white dark:bg-[#1c1917] border border-dashed border-[#2FAF8F]/50 rounded-3xl p-14 text-center shadow-2xl">
              <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-[#2FAF8F]/10 flex items-center justify-center text-[#2FAF8F]">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>
              </div>
              <p className="text-[14px] font-semibold text-stone-800 dark:text-stone-100">Suelta aquí</p>
              <p className="text-[12px] text-stone-400 dark:text-stone-500 mt-1">Imágenes, audios o documentos</p>
            </div>
          </div>
        )}

        {/* ── ARTIFACT FULLSCREEN (cubre todo) ─────────────────────── */}
        {activeArtifact && artifactFullscreen && (
          <div className="fixed inset-0 z-100 flex flex-col">
            <ArtifactShell
              type={activeArtifact}
              onClose={() => { setActiveArtifact(null); setArtifactFullscreen(false) }}
              fullscreen={true}
              onToggleFullscreen={() => setArtifactFullscreen(false)}
            />
          </div>
        )}

        {/* ── SPLIT ROW (chat izquierda + artefacto derecha) ───────── */}
        <div className="flex flex-1 min-h-0">

        {/* ── CHAT PANE ─────────────────────────────────────────────── */}
        <div
          className="flex flex-col min-w-0 transition-all duration-300"
          style={{ width: activeArtifact && !artifactFullscreen ? '42%' : '100%' }}
        >
          {/* SCROLL TO BOTTOM */}
          {!isAtBottom && hasNewMsg && (
            <div className="absolute bottom-43.75 left-0 right-0 z-30 pointer-events-none flex justify-center" style={{ width: activeArtifact && !artifactFullscreen ? '42%' : '100%' }}>
              <button
                onClick={() => { setIsAtBottom(true); messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); setHasNewMsg(false) }}
                className="pointer-events-auto ch-toast flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-[#1c1917] border border-stone-200/80 dark:border-stone-700/60 shadow-lg text-[12px] font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
              >
                <svg className="w-3.5 h-3.5 text-[#2FAF8F]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/><polyline points="6 4 12 10 18 4"/></svg>
                Nuevo mensaje
              </button>
            </div>
          )}

          {/* ── SCROLLABLE MESSAGES ── */}
          <div ref={scrollAreaRef} className="ch-scroll flex-1 overflow-y-auto px-4 lg:px-6 pb-6 pt-6">
          {loadingMessages ? (
            <div className="flex items-center justify-center h-full">
              <svg className="w-6 h-6 ch-spin text-[#2FAF8F]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center min-h-full">
              <div className="w-full max-w-130 px-2 py-8">
                <div className="ch-hero text-center mb-10">
                  <h1 className="ch-serif text-[36px] sm:text-[42px] text-stone-900 dark:text-stone-50 leading-[1.18] italic">
                    ¿Qué necesitas<br />saber hoy?
                  </h1>
                </div>
                <RotatingPhrase onSelect={(q) => { setMessage(q); setTimeout(() => textareaRef.current?.focus(), 60) }} />
                <div className="ch-card flex flex-wrap justify-center gap-2 mt-7" style={{ animationDelay: '300ms' }}>
                  {QUICK_ACTIONS.map((qa, i) => (
                    <button
                      key={qa.icon}
                      onClick={() => { setMessage(`${qa.label}: `); setTimeout(() => textareaRef.current?.focus(), 60) }}
                      className="flex items-center gap-1.5 h-8 px-3.5 rounded-full border border-stone-200/80 dark:border-stone-700/50 bg-white dark:bg-[#141210] text-[12px] font-medium text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-100 hover:border-stone-300 dark:hover:border-stone-600 hover:shadow-[0_2px_10px_rgba(0,0,0,0.06)] transition-all duration-150"
                      style={{ animationDelay: `${i * 40 + 320}ms` }}
                    >
                      <span className="text-stone-300 dark:text-stone-600"><QuickIcon icon={qa.icon} /></span>
                      {qa.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-170 mx-auto space-y-8 pb-4" aria-live="polite" aria-label="Mensajes del chat">
              {messages.map((msg, idx) => (
                <div key={msg.id} className="flex flex-col gap-0">
                  <div className={`ch-msg flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`group ${msg.role === 'user' ? 'max-w-[80%]' : 'flex-1 min-w-0 max-w-[85%]'}`}>

                    {/* ── USER ── */}
                    {msg.role === 'user' && (
                      editingIdx === idx ? (
                        <div className="bg-white dark:bg-[#1c1917] border border-[#2FAF8F]/40 rounded-2xl rounded-br-md overflow-hidden shadow-[0_0_0_3px_rgba(47,175,143,0.08)]">
                          <textarea
                            autoFocus
                            value={editingText}
                            onChange={e => setEditingText(e.target.value.slice(0, MAX_CHARS))}
                            onKeyDown={e => {
                              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleEditSave(idx) }
                              if (e.key === 'Escape') { setEditingIdx(null); setEditingText('') }
                            }}
                            className="w-full px-4 pt-3 pb-2 bg-transparent text-[14px] text-stone-800 dark:text-stone-100 resize-none leading-[1.75]"
                            style={{ minHeight: 60, outline: 'none', boxShadow: 'none' }}
                            rows={Math.max(2, editingText.split('\n').length)}
                          />
                          <div className="flex items-center justify-between px-3 pb-2.5 gap-2">
                            <span className="text-[10.5px] text-stone-300 dark:text-stone-600">Enter para guardar · Esc para cancelar</span>
                            <div className="flex gap-1.5">
                              <button onClick={() => { setEditingIdx(null); setEditingText('') }} className="h-7 px-3 rounded-lg text-[11.5px] font-medium text-stone-500 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors">Cancelar</button>
                              <button onClick={() => handleEditSave(idx)} className="h-7 px-3 rounded-lg text-[11.5px] font-medium text-white bg-[#2FAF8F] hover:bg-[#27a07f] transition-colors shadow-sm">Guardar</button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-white dark:bg-[#1c1917] border border-stone-200/70 dark:border-stone-800/60 rounded-2xl rounded-br-md px-4 py-3">
                          {msg.files && msg.files.length > 0 && (
                            <div className={`space-y-1.5 ${msg.content ? 'mb-3' : ''}`}>
                              {msg.files.map(f => <SentFileChip key={f.id} f={f} onLightbox={setLightboxUrl} />)}
                            </div>
                          )}
                          {msg.content && (
                            <p className="text-[14px] text-stone-800 dark:text-stone-100 leading-[1.75] whitespace-pre-wrap wrap-break-word">{msg.content}</p>
                          )}
                        </div>
                      )
                    )}

                    {/* ── ASSISTANT ── */}
                    {msg.role === 'assistant' && (
                      <>
                        {msg.isError ? (
                          <div className="flex items-center gap-2.5 py-1">
                            <svg className="w-4 h-4 text-rose-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><circle cx="12" cy="16" r="0.5" fill="currentColor"/>
                            </svg>
                            <span className="text-[13px] text-stone-400 dark:text-stone-500 italic">Error al generar respuesta.</span>
                            <button onClick={() => handleRegenerate(idx)} className="text-[12px] text-[#2FAF8F] hover:underline font-medium">Reintentar</button>
                          </div>
                        ) : (
                          <>
                            {msg.thoughts && msg.thoughts.length > 0 && (
                              <div className="th-resp mb-3 max-w-120">
                                <button
                                  onClick={() => setMessages(prev => prev.map((m, i) => i === idx ? { ...m, thoughtsExpanded: !m.thoughtsExpanded } : m))}
                                  className="flex items-center gap-2.5 group"
                                >
                                  <svg className="w-3.25 h-3.25 text-[#2FAF8F] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12"/>
                                  </svg>
                                  <span className="ch-serif italic text-[13px] text-stone-400 dark:text-stone-500">
                                    Analicé {msg.thoughts.length} pasos
                                  </span>
                                  <svg className={`w-2.5 h-2.5 shrink-0 transition-all duration-200 ${msg.thoughtsExpanded ? 'rotate-180 text-stone-400 opacity-100' : 'text-stone-300 opacity-0 group-hover:opacity-100'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <polyline points="6 9 12 15 18 9"/>
                                  </svg>
                                </button>
                                {msg.thoughtsExpanded && (
                                  <div className="th-expand mt-3 space-y-2.5">
                                    {msg.thoughts.map((t, ti) => (
                                      <div key={ti} className="th-line flex items-start gap-2.5" style={{ animationDelay: `${ti * 40}ms` }}>
                                        <span className="mt-1.25 shrink-0 w-1.25 h-1.25 rounded-full bg-[#2FAF8F]/40" />
                                        <p className="text-[12px] text-stone-400 dark:text-stone-500 leading-[1.65]">{t}</p>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                            <div className="text-[14px] leading-[1.75] text-stone-700 dark:text-stone-200 space-y-1">
                              {renderContent(msg.content)}
                            </div>
                            {/* ── ARTEFACTO DORMIDO — inline en el chat ── */}
                            {/* (renderizado abajo fuera del 85% div) */}
                            {msg.artifact === 'passport' && activeArtifact === 'passport' && (
                              <div className="mt-3 flex items-center gap-2 text-[12px] text-stone-400 dark:text-stone-500">
                                <svg className="w-3.5 h-3.5 text-[#2FAF8F]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
                                Expediente abierto
                                <button onClick={() => setActiveArtifact(null)} className="text-[#2FAF8F] hover:underline">Cerrar</button>
                              </div>
                            )}
                            {msg.model && msg.model !== 'acipe' && (
                              <span className="inline-flex items-center gap-1 mt-1.5 text-[10.5px] text-stone-300 dark:text-stone-600">
                                <I.Spark /> {msg.model}
                              </span>
                            )}
                          </>
                        )}
                      </>
                    )}

                    {/* ── ACCIONES ── */}
                    <div className={`flex items-center gap-0.5 mt-1.5 px-1 transition-opacity duration-150 ${msg.role === 'user' ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}>
                      <span className="text-[10.5px] text-stone-300 dark:text-stone-600 mr-1.5" title={new Date(msg.ts).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}>
                        {relativeTime(msg.ts)}
                      </span>
                      {msg.role === 'user' ? (
                        <>
                          <ActionBtn onClick={() => { setEditingIdx(idx); setEditingText(msg.content) }} title="Editar"><I.Edit /></ActionBtn>
                          <ActionBtn onClick={() => handleCopy(msg.content, `msg-${msg.ts}`)} title="Copiar">
                            {copiedId === `msg-${msg.ts}` ? <IcoCheck /> : <I.Copy />}
                          </ActionBtn>
                        </>
                      ) : !msg.isError ? (
                        <>
                          <ActionBtn onClick={() => handleRegenerate(idx)} title="Regenerar"><I.Refresh /></ActionBtn>
                          <ActionBtn onClick={() => handleCopy(msg.content, `msg-${msg.ts}`)} title="Copiar">
                            {copiedId === `msg-${msg.ts}` ? <IcoCheck /> : <I.Copy />}
                          </ActionBtn>
                          <div className="w-px h-3 bg-stone-200 dark:bg-stone-700/60 mx-0.5" />
                          <ActionBtn onClick={() => addToast('Gracias por tu feedback', 'info')} title="Me gusta">
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/>
                              <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
                            </svg>
                          </ActionBtn>
                          <ActionBtn onClick={() => addToast('Gracias por tu feedback', 'info')} title="No me gusta">
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z"/>
                              <path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/>
                            </svg>
                          </ActionBtn>
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>
                  {/* ── PASSPORT CARD — full width debajo del mensaje ── */}
                  {msg.artifact === 'passport' && !activeArtifact && (
                    <PassportCard
                      data={MOCK_PASSPORT}
                      onExpand={() => setActiveArtifact('passport')}
                    />
                  )}
                </div>
              ))}

              {/* ── GENERANDO: logo → thinking → streaming ── */}
              {isGenerating && (
                <div className="ch-msg flex gap-3">
                  <div className="flex-1 pt-0.5">
                    {isSaving ? (
                      <div className="flex items-center gap-2 text-[12.5px] text-stone-400 dark:text-stone-500">
                        <svg className="w-3.5 h-3.5 ch-spin text-[#2FAF8F]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                        Subiendo archivos…
                      </div>
                    ) : !showThinking && !isStreaming ? (
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
                        thoughts={thinkingSteps.length > 0 ? thinkingSteps : ['Procesando…']}
                        currentIdx={thinkingIdx}
                        done={thinkingDone}
                        expanded={thinkingExpanded}
                        onToggle={() => setThinkingExpanded(p => !p)}
                      />
                    )}
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* ── INPUT AREA ────────────────────────────────────────────── */}
        <div className="px-4 lg:px-6 pb-6 pt-3 shrink-0">
          <div className="max-w-170 mx-auto">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,audio/*,.pdf,.doc,.docx,.txt,.xlsx,.xls"
              onChange={e => processFiles(Array.from(e.target.files || []))}
              className="hidden"
            />

            {attachedFiles.length > 0 && (
              <div className="mb-2.5">
                {attachedFiles.length <= 3 ? (
                  <div className="overflow-x-auto ch-files-scroll">
                    <div className="flex gap-2 pb-1" style={{ width: 'max-content' }}>
                      {attachedFiles.map(f => (
                        <FileChip key={f.id} f={f} onRemove={() => {
                          setAttachedFiles(p => p.filter(x => x.id !== f.id))
                          setPendingFiles(p => p.filter(x => x.name !== f.name))
                        }} />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 flex-wrap">
                    {attachedFiles.slice(0, 2).map(f => (
                      <FileChip key={f.id} f={f} onRemove={() => {
                        setAttachedFiles(p => p.filter(x => x.id !== f.id))
                        setPendingFiles(p => p.filter(x => x.name !== f.name))
                      }} />
                    ))}
                    <div className="flex items-center gap-1.5 h-8.5 px-3 rounded-xl border border-stone-200/70 dark:border-stone-800/60 bg-white dark:bg-[#1c1917] text-[12px] font-medium text-stone-500 dark:text-stone-400">
                      <I.Clip />
                      +{attachedFiles.length - 2} más
                      <button onClick={() => { setAttachedFiles([]); setPendingFiles([]) }} className="ml-1 text-stone-300 hover:text-rose-400 transition-colors">
                        <I.X />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="ch-input bg-white dark:bg-[#141210] border border-stone-200/80 dark:border-stone-800/70 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_20px_rgba(0,0,0,0.25)]">
              <textarea
                ref={textareaRef}
                value={message}
                onChange={e => setMessage(e.target.value.slice(0, MAX_CHARS))}
                onKeyDown={handleKey}
                placeholder={
                  mode === 'noticias'      ? 'Buscar y analizar noticias del sector…' :
                  mode === 'investigacion' ? 'Investigar normativa, mercados o tendencias…' :
                  'Pregunta sobre tu ganado, trámites o normativa…'
                }
                rows={1}
                className="w-full px-4 pt-3.5 pb-2 bg-transparent text-[14px] text-stone-800 dark:text-stone-100 placeholder-stone-300 dark:placeholder-stone-600 resize-none leading-relaxed"
                style={{ maxHeight: '180px', minHeight: '46px', outline: 'none', boxShadow: 'none' }}
              />
              {message.length > MAX_CHARS * 0.8 && (
                <div className="flex justify-end px-4 pb-1">
                  <span className={`text-[10.5px] tabular-nums ${message.length >= MAX_CHARS ? 'text-rose-400' : 'text-stone-400 dark:text-stone-500'}`}>
                    {message.length}/{MAX_CHARS}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between px-3 pb-3 pt-1 gap-2">
                <div className="flex items-center gap-1.5">

                  {/* Clip */}
                  <button onClick={() => fileInputRef.current?.click()} className="w-7 h-7 flex items-center justify-center rounded-full text-stone-300 dark:text-stone-600 hover:text-stone-500 dark:hover:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800/60 transition-all">
                    <I.Clip />
                  </button>

                  <div className="w-px h-4 bg-stone-200 dark:bg-stone-700/60" />

                  {/* Mode */}
                  <div className="relative" ref={modeRef}>
                    <button
                      onClick={() => { setModeOpen(p => !p); setModelOpen(false) }}
                      aria-haspopup="listbox" aria-expanded={modeOpen} aria-label={`Modo: ${modeLabel[mode]}`}
                      className={`flex items-center gap-1.5 h-7 px-3 rounded-full text-[11.5px] font-medium transition-all border ${isActiveMode ? 'bg-[#2FAF8F]/10 border-[#2FAF8F]/25 text-[#2FAF8F]' : 'bg-stone-50 dark:bg-stone-800/60 border-stone-200/70 dark:border-stone-700/50 text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200'}`}
                    >
                      {modeIcon(mode)}
                      <span>{modeLabel[mode]}</span>
                      {modeOpen ? <I.ChevronUp /> : <I.ChevronDown />}
                    </button>
                    {modeOpen && (
                      <div className="ch-dd absolute bottom-full left-0 mb-2 w-48 bg-white dark:bg-[#1c1917] rounded-xl border border-stone-200/80 dark:border-stone-800 shadow-[0_8px_28px_rgba(0,0,0,0.10)] dark:shadow-[0_8px_36px_rgba(0,0,0,0.40)] overflow-hidden py-1 z-40">
                        {([
                          { id: 'asistente'     as ChatMode, label: 'Asistente',     desc: 'Gestión ganadera',       icon: <I.Chat />   },
                          { id: 'noticias'      as ChatMode, label: 'Noticias',      desc: 'Analizar el sector',     icon: <I.News />   },
                          { id: 'investigacion' as ChatMode, label: 'Investigación', desc: 'Normativa y tendencias', icon: <I.Search /> },
                        ]).map(m => (
                          <button key={m.id} onClick={() => {
                            setMode(m.id)
                            setModeOpen(false)
                            // Resetear modelo al default del modo seleccionado
                            setModel(m.id === 'asistente' ? 'acipe' : 'claude')
                          }} className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${mode === m.id ? 'text-[#2FAF8F]' : 'text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800/60'}`}>
                            <span className="shrink-0">{m.icon}</span>
                            <span>
                              <span className="block text-[12px] font-semibold">{m.label}</span>
                              <span className="block text-[11px] text-stone-400 dark:text-stone-500">{m.desc}</span>
                            </span>
                            {mode === m.id && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#2FAF8F] shrink-0" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Model — Siete 1.0 fijo en asistente · selector en noticias/investigacion */}
                  <div className="relative" ref={modelRef}>
                    <button
                      onClick={() => {
                        if (mode === 'asistente') return // no abre en asistente
                        setModelOpen(p => !p)
                        setModeOpen(false)
                      }}
                      aria-haspopup="listbox"
                      aria-expanded={mode !== 'asistente' && modelOpen}
                      aria-label={`Modelo: ${selectedModel.label}`}
                      className={`flex items-center gap-1 h-7 px-2.5 rounded-full text-[11px] font-medium border transition-all bg-stone-50 dark:bg-stone-800/40 ${
                        mode === 'asistente'
                          ? 'text-stone-400 dark:text-stone-500 border-stone-200/70 dark:border-stone-700/50 cursor-default'
                          : 'text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 border-stone-200/70 dark:border-stone-700/50 hover:border-stone-300 dark:hover:border-stone-600 cursor-pointer'
                      }`}
                    >
                      <I.Spark />
                      <span className="ml-0.5">{selectedModel.label}</span>
                      {mode !== 'asistente' && (modelOpen ? <I.ChevronUp /> : <I.ChevronDown />)}
                    </button>
                    {modelOpen && mode !== 'asistente' && (
                      <div className="ch-dd absolute bottom-full left-0 mb-2 w-48 bg-white dark:bg-[#1c1917] rounded-xl border border-stone-200/80 dark:border-stone-800 shadow-[0_8px_28px_rgba(0,0,0,0.10)] dark:shadow-[0_8px_36px_rgba(0,0,0,0.40)] overflow-hidden py-1 z-40">
                        {MODELS_EXTERNOS.map(m => (
                          <button key={m.id} onClick={() => { setModel(m.id); setModelOpen(false) }} className={`w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors ${model === m.id ? 'text-[#2FAF8F]' : 'text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800/60'}`}>
                            <span>
                              <span className="block text-[12px] font-semibold">{m.label}</span>
                              <span className="block text-[11px] text-stone-400 dark:text-stone-500">{m.desc}</span>
                            </span>
                            {model === m.id && <span className="w-1.5 h-1.5 rounded-full bg-[#2FAF8F] shrink-0" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Historial + Mic + New + Send */}
                <div className="flex items-center gap-1.5">
                  {messages.length > 0 && !isGenerating && (
                    <button onClick={handleNewChat} className="w-7 h-7 flex items-center justify-center rounded-full text-stone-300 dark:text-stone-600 hover:text-stone-500 dark:hover:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800/60 transition-all" title="Nuevo chat">
                      <svg className="w-3.75 h-3.75" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 5v14M5 12h14"/>
                      </svg>
                    </button>
                  )}

                  <button onClick={() => navigate('/voz')} className="w-7 h-7 flex items-center justify-center rounded-full text-stone-300 dark:text-stone-600 hover:text-stone-500 dark:hover:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800/60 transition-all">
                    <I.Mic />
                  </button>

                  <button
                    onClick={isGenerating ? handleStop : handleSend}
                    disabled={!isGenerating && !message.trim() && attachedFiles.length === 0}
                    className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all ${
                      isGenerating
                        ? 'bg-stone-800 dark:bg-stone-200 text-white dark:text-stone-900 hover:bg-stone-700 dark:hover:bg-stone-300 shadow-sm active:scale-95'
                        : message.trim() || attachedFiles.length > 0
                        ? 'bg-[#2FAF8F] hover:bg-[#27a07f] text-white shadow-sm active:scale-95'
                        : 'bg-stone-100 dark:bg-stone-800/60 text-stone-300 dark:text-stone-600 cursor-not-allowed'
                    }`}
                  >
                    {isGenerating ? (
                      <svg className="w-3.25 h-3.25" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2.5"/></svg>
                    ) : (
                      <I.Send />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <p className="text-center text-[10.5px] text-stone-300 dark:text-stone-700 mt-2.5">
              {mode === 'noticias'
                ? 'Normativa SENASICA · USDA · FDA · Precios SNIIM'
                : mode === 'investigacion'
                ? 'Búsqueda profunda · Fuentes verificadas · Análisis sectorial'
                : 'Siete 1.0 · Asistente de gestión ganadera'}
            </p>
          </div>
        </div>

        </div>{/* end chat pane */}

        {/* ── ARTIFACT PANE (split, lado derecho) ─────────────────── */}
        {activeArtifact && !artifactFullscreen && (
          <div className="flex flex-col border-l border-stone-200/70 dark:border-stone-800" style={{ width: '58%' }}>
            <ArtifactShell
              type={activeArtifact}
              onClose={() => { setActiveArtifact(null); setArtifactFullscreen(false) }}
              fullscreen={false}
              onToggleFullscreen={() => setArtifactFullscreen(true)}
            />
          </div>
        )}

        </div>{/* end split row */}

      </div>
    </>
  )
}