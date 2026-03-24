import { useState, useCallback, useRef } from 'react'
import type { ReactNode } from 'react'
import type { AttachedFile } from '../../lib/chatService'
import type { UIMessage } from './chatTypes'
import { SavedThoughts } from './ThinkingBlock'
import { WikiCardSet } from '../../components/WikiCard'
import { fmt, getFileKind, FILE_STYLES, relativeTime } from './chatUtils'
import { renderContent } from './chatContent'

// ─── FileTypeIcon ─────────────────────────────────────────────────────────────

function FileTypeIcon({ kind }: { kind: string }) {
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

// ─── FileChip ─────────────────────────────────────────────────────────────────

export function FileChip({ f, onRemove }: { f: AttachedFile; onRemove?: () => void }) {
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
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      )}
    </div>
  )
}

// ─── SentFileChip ─────────────────────────────────────────────────────────────

export function SentFileChip({ f, onLightbox }: { f: AttachedFile; onLightbox?: (url: string) => void }) {
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

// ─── Shared small UI ──────────────────────────────────────────────────────────

function IcoCheck() {
  return (
    <svg className="w-3.5 h-3.5 text-[#2FAF8F]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  )
}

function ActionBtn({ onClick, title, children }: { onClick: () => void; title: string; children: ReactNode }) {
  return (
    <button onClick={onClick} title={title} className="w-6 h-6 flex items-center justify-center rounded-lg text-stone-300 dark:text-stone-600 hover:text-stone-500 dark:hover:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800/60 transition-all">
      {children}
    </button>
  )
}

const IcoSpark = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
  </svg>
)
const IcoCopy = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
)
const IcoRefresh = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>
)
const IcoEdit = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
)

const IcoPin = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
)

interface ChatMessageProps {
  msg:              UIMessage
  idx:              number
  editingIdx:       number | null
  editingText:      string
  copiedId:         string | null
  artifact:         { kind: string } | null
  onSetEditingIdx:  (idx: number | null) => void
  onSetEditingText: (text: string) => void
  onEditSave:       (idx: number) => void
  onCopy:           (text: string, id: string) => void
  onRegenerate:     (idx: number) => void
  onLightbox:       (url: string) => void
  onAddToast:       (text: string, kind?: 'error' | 'info') => void
  onCloseArtifact:  () => void
  onPin:            (id: string) => void
  onFeedback:       (msgId: string, kind: 'up' | 'down') => Promise<void>
  renderInlineWidget: (id: string) => ReactNode
  onToggleThoughts: (idx: number) => void
  MAX_CHARS:        number
}

export function ChatMessage({
  msg, idx,
  editingIdx, editingText,
  copiedId, artifact,
  onSetEditingIdx, onSetEditingText, onEditSave,
  onCopy, onRegenerate, onLightbox, onCloseArtifact, onPin, onFeedback,
  renderInlineWidget, onToggleThoughts,
  MAX_CHARS,
}: ChatMessageProps) {
  // ── TTS ────────────────────────────────────────────────────────────────────
  const [speaking,   setSpeaking]   = useState(false)
  const uttRef       = useRef<SpeechSynthesisUtterance | null>(null)

  const handleSpeak = useCallback(() => {
    if (!window.speechSynthesis) return
    if (speaking) {
      window.speechSynthesis.cancel()
      setSpeaking(false)
      return
    }
    const text = msg.content.replace(/\*\*/g, '').replace(/^[-•]\s/gm, '').trim()
    const utt  = new SpeechSynthesisUtterance(text)
    utt.lang   = 'es-MX'
    utt.rate   = 1.05
    utt.onend  = () => setSpeaking(false)
    utt.onerror = () => setSpeaking(false)
    uttRef.current = utt
    setSpeaking(true)
    window.speechSynthesis.speak(utt)
  }, [speaking, msg.content])

  // ── Feedback ───────────────────────────────────────────────────────────────
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null)

  const handleFeedback = useCallback(async (kind: 'up' | 'down') => {
    if (feedback) return  // ya votó
    setFeedback(kind)
    await onFeedback(msg.id, kind)
  }, [feedback, msg.id, onFeedback])
  return (
    <div className="flex flex-col gap-0" data-msg-id={msg.id}>
      {msg.role === 'assistant' && msg.thoughts && msg.thoughts.length > 0 && (
        <SavedThoughts
          thoughts={msg.thoughts}
          expanded={msg.thoughtsExpanded}
          onToggle={() => onToggleThoughts(idx)}
        />
      )}

      {msg.artifact && artifact === null && renderInlineWidget(msg.artifact.id as string)}

      <div className={`ch-msg flex gap-3 mt-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
        <div className={`group relative ${msg.role === 'user' ? 'max-w-[80%]' : 'flex-1 min-w-0 max-w-[85%]'}`}>

          {msg.role === 'user' && (
            editingIdx === idx ? (
              <div className="bg-white dark:bg-[#1c1917] border border-[#2FAF8F]/40 rounded-2xl rounded-br-md overflow-hidden shadow-[0_0_0_3px_rgba(47,175,143,0.08)]">
                <textarea
                  autoFocus
                  value={editingText}
                  onChange={e => onSetEditingText(e.target.value.slice(0, MAX_CHARS))}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onEditSave(idx) }
                    if (e.key === 'Escape') { onSetEditingIdx(null); onSetEditingText('') }
                  }}
                  className="w-full px-4 pt-3 pb-2 bg-transparent text-[14px] text-stone-800 dark:text-stone-100 resize-none leading-[1.75]"
                  style={{ minHeight: 60, outline: 'none', boxShadow: 'none' }}
                  rows={Math.max(2, editingText.split('\n').length)}
                />
                <div className="flex items-center justify-between px-3 pb-2.5 gap-2">
                  <span className="text-[10.5px] text-stone-300 dark:text-stone-600">Enter para guardar · Esc para cancelar</span>
                  <div className="flex gap-1.5">
                    <button onClick={() => { onSetEditingIdx(null); onSetEditingText('') }} className="h-7 px-3 rounded-lg text-[11.5px] font-medium text-stone-500 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors">Cancelar</button>
                    <button onClick={() => onEditSave(idx)} className="h-7 px-3 rounded-lg text-[11.5px] font-medium text-white bg-[#2FAF8F] hover:bg-[#27a07f] transition-colors shadow-sm">Guardar</button>
                  </div>
                </div>
              </div>
            ) : (
              <div className={`bg-white dark:bg-[#1c1917] border border-stone-200/70 dark:border-stone-800/60 rounded-2xl rounded-br-md px-4 py-3 ${msg.pinned ? 'border-l-2 border-l-[#2FAF8F]/60' : ''}`}>
                {msg.files && msg.files.length > 0 && (
                  <div className={`space-y-1.5 ${msg.content ? 'mb-3' : ''}`}>
                    {msg.files.map(f => <SentFileChip key={f.id} f={f} onLightbox={onLightbox} />)}
                  </div>
                )}
                {msg.content && (
                  <p className="text-[14px] text-stone-800 dark:text-stone-100 leading-[1.75] whitespace-pre-wrap wrap-break-word">{msg.content}</p>
                )}
              </div>
            )
          )}

          {msg.role === 'assistant' && (
            <>
              {msg.isError ? (
                <div className="flex items-center gap-2.5 py-1">
                  <svg className="w-4 h-4 text-rose-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><circle cx="12" cy="16" r="0.5" fill="currentColor"/>
                  </svg>
                  <span className="text-[13px] text-stone-400 dark:text-stone-500 italic">Error al generar respuesta.</span>
                  <button onClick={() => onRegenerate(idx)} className="text-[12px] text-[#2FAF8F] hover:underline font-medium">Reintentar</button>
                </div>
              ) : (
                <>
                  <div className={`text-[14px] leading-[1.75] text-stone-700 dark:text-stone-200 space-y-1 ${msg.pinned ? 'border-l-2 border-[#2FAF8F]/50 pl-3' : ''}`}>
                    {renderContent(msg.content)}
                  </div>
                  {msg.wiki_hechos && msg.wiki_hechos.length > 0 && (
                    <WikiCardSet hechos={msg.wiki_hechos} />
                  )}
                  {msg.artifact && artifact?.kind === 'module' && (
                    <div className="mt-3 flex items-center gap-2 text-[12px] text-stone-400 dark:text-stone-500">
                      <svg className="w-3.5 h-3.5 text-[#2FAF8F]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
                      </svg>
                      Expediente abierto
                      <button onClick={onCloseArtifact} className="text-[#2FAF8F] hover:underline">Cerrar</button>
                    </div>
                  )}
                  {msg.model && msg.model !== 'acipe' && (
                    <span className="inline-flex items-center gap-1 mt-1.5 text-[10.5px] text-stone-300 dark:text-stone-600">
                      <IcoSpark /> {msg.model}
                    </span>
                  )}
                </>
              )}
            </>
          )}

          <div className={`flex items-center gap-0.5 mt-1.5 px-1 transition-opacity duration-150 ${msg.role === 'user' ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}>
            <span className="text-[10.5px] text-stone-300 dark:text-stone-600 mr-1.5" title={new Date(msg.ts).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}>
              {relativeTime(msg.ts)}
            </span>
            {msg.edited && (
              <span className="text-[10px] text-stone-300 dark:text-stone-600 mr-1 italic">editado</span>
            )}
            {msg.role === 'user' ? (
              <>
                <ActionBtn onClick={() => { onSetEditingIdx(idx); onSetEditingText(msg.content) }} title="Editar"><IcoEdit /></ActionBtn>
                <ActionBtn onClick={() => onCopy(msg.content, `msg-${msg.ts}`)} title="Copiar">
                  {copiedId === `msg-${msg.ts}` ? <IcoCheck /> : <IcoCopy />}
                </ActionBtn>
                <ActionBtn onClick={() => onPin(msg.id)} title={msg.pinned ? 'Quitar destacado' : 'Destacar'}>
                  <span className={msg.pinned ? 'text-[#2FAF8F]' : ''}><IcoPin /></span>
                </ActionBtn>
              </>
            ) : !msg.isError ? (
              <>
                <ActionBtn onClick={() => onCopy(msg.content, `msg-${msg.ts}`)} title="Copiar">
                  {copiedId === `msg-${msg.ts}` ? <IcoCheck /> : <IcoCopy />}
                </ActionBtn>
                <ActionBtn onClick={() => onPin(msg.id)} title={msg.pinned ? 'Quitar destacado' : 'Destacar'}>
                  <span className={msg.pinned ? 'text-[#2FAF8F]' : ''}><IcoPin /></span>
                </ActionBtn>
                <ActionBtn
                  onClick={() => handleFeedback('up')}
                  title={feedback === 'up' ? 'Gracias por tu feedback' : 'Me gusta'}
                >
                  <svg className={`w-3.5 h-3.5 transition-colors ${feedback === 'up' ? 'text-[#2FAF8F]' : ''}`} viewBox="0 0 24 24" fill={feedback === 'up' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/>
                    <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
                  </svg>
                </ActionBtn>
                <ActionBtn
                  onClick={() => handleFeedback('down')}
                  title={feedback === 'down' ? 'Gracias por tu feedback' : 'No me gusta'}
                >
                  <svg className={`w-3.5 h-3.5 transition-colors ${feedback === 'down' ? 'text-rose-400' : ''}`} viewBox="0 0 24 24" fill={feedback === 'down' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z"/>
                    <path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/>
                  </svg>
                </ActionBtn>
                {/* TTS — leer respuesta en voz alta */}
                {'speechSynthesis' in window && (
                  <ActionBtn onClick={handleSpeak} title={speaking ? 'Detener lectura' : 'Escuchar respuesta'}>
                    <svg className={`w-3.5 h-3.5 transition-colors ${speaking ? 'text-[#2FAF8F]' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      {speaking
                        ? <><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></>
                        : <><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></>
                      }
                    </svg>
                  </ActionBtn>
                )}
                <div className="w-px h-3 bg-stone-200 dark:bg-stone-700/60 mx-0.5" />
                <ActionBtn onClick={() => onRegenerate(idx)} title="Regenerar"><IcoRefresh /></ActionBtn>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}