import { useRef, useEffect } from 'react'
import type { AttachedFile, ChatMode, ChatModel } from '../../lib/chatService'
import { FileChip } from './ChatMessage'
import { MAX_CHARS } from './useChat'
import { MODELS_ASISTENTE, MODELS_EXTERNOS, modeLabel } from './chatConstants'

// ─── Icons (local, scoped to this file) ──────────────────────────────────────

const IcoSend = () => (
  <svg className="w-4.25 h-4.25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>
  </svg>
)
const IcoMic = () => (
  <svg className="w-4.25 h-4.25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
    <line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
  </svg>
)
const IcoClip = () => (
  <svg className="w-4.25 h-4.25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
  </svg>
)
const IcoChevronDown = () => (
  <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
)
const IcoChevronUp = () => (
  <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <polyline points="18 15 12 9 6 15"/>
  </svg>
)
const IcoSpark = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
  </svg>
)
const IcoNews = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 0-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/>
    <path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6Z"/>
  </svg>
)
const IcoChat = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
)
const IcoSearch = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
)
const IcoX = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)
const IcoNewChat = () => (
  <svg className="w-3.75 h-3.75" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14M5 12h14"/>
  </svg>
)

// ─── modeIcon (local — uses local icon components so stays here) ──────────────
const modeIcon = (m: ChatMode) => {
  if (m === 'noticias')      return <IcoNews />
  if (m === 'investigacion') return <IcoSearch />
  return <IcoChat />
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface ChatInputBarProps {
  // input state
  message:       string
  onMessageChange: (v: string) => void
  attachedFiles: AttachedFile[]
  onRemoveFile:  (id: string, name: string) => void
  onClearFiles:  () => void
  pendingFiles:  File[]   // needed to keep in sync

  // generation
  isOnline:      boolean
  isGenerating:  boolean
  isSimulating:  boolean
  messagesCount: number

  // mode / model
  mode:       ChatMode
  model:      ChatModel
  modeOpen:   boolean
  modelOpen:  boolean
  onSetMode:     (m: ChatMode)  => void
  onSetModel:    (m: ChatModel) => void
  onSetModeOpen: (v: boolean)   => void
  onSetModelOpen:(v: boolean)   => void

  // callbacks
  onSend:        () => void
  onStop:        () => void
  onNewChat:     () => void
  onProcessFiles:(files: File[]) => void
  onNavigateVoz: () => void
}

// ─── ChatInputBar ─────────────────────────────────────────────────────────────

export function ChatInputBar({
  message, onMessageChange,
  attachedFiles, onRemoveFile, onClearFiles,
  isOnline, isGenerating, isSimulating, messagesCount,
  mode, model, modeOpen, modelOpen,
  onSetMode, onSetModel, onSetModeOpen, onSetModelOpen,
  onSend, onStop, onNewChat, onProcessFiles, onNavigateVoz,
}: ChatInputBarProps) {
  const textareaRef  = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const modeRef      = useRef<HTMLDivElement>(null)
  const modelRef     = useRef<HTMLDivElement>(null)

  const activeModels  = mode === 'asistente' ? MODELS_ASISTENTE : MODELS_EXTERNOS
  const selectedModel = activeModels.find(m => m.id === model) ?? activeModels[0]
  const isActiveMode  = mode !== 'asistente'

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 280) + 'px'
    }
  }, [message])

  // Paste images
  useEffect(() => {
    const fn = (e: ClipboardEvent) => {
      const imgs = Array.from(e.clipboardData?.items ?? []).filter(i => i.type.startsWith('image/'))
      if (!imgs.length) return
      e.preventDefault()
      imgs.forEach(i => { const f = i.getAsFile(); if (f) onProcessFiles([f]) })
    }
    document.addEventListener('paste', fn)
    return () => document.removeEventListener('paste', fn)
  }, [onProcessFiles])

  // Close dropdowns on outside click
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (modelRef.current && !modelRef.current.contains(e.target as Node)) onSetModelOpen(false)
      if (modeRef.current  && !modeRef.current.contains(e.target as Node))  onSetModeOpen(false)
    }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [onSetModelOpen, onSetModeOpen])

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend() }
  }

  return (
    <>
      <style>{`
        .ch-textarea::-webkit-scrollbar { width: 6px; }
        .ch-textarea::-webkit-scrollbar-track { background: transparent; }
        .ch-textarea::-webkit-scrollbar-thumb { background: rgba(120,113,108,0.25); border-radius: 99px; }
        .ch-textarea::-webkit-scrollbar-thumb:hover { background: rgba(120,113,108,0.45); }
        .dark .ch-textarea::-webkit-scrollbar-thumb { background: rgba(168,162,158,0.15); }
        .dark .ch-textarea::-webkit-scrollbar-thumb:hover { background: rgba(168,162,158,0.30); }
      `}</style>
    <div className="px-4 lg:px-6 pb-6 shrink-0">
      <div className="max-w-170 mx-auto">

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,audio/*,.pdf,.doc,.docx,.txt,.xlsx,.xls"
          onChange={e => {
            onProcessFiles(Array.from(e.target.files || []))
            if (fileInputRef.current) fileInputRef.current.value = ''
          }}
          className="hidden"
        />

        {/* Attached files preview */}
        {attachedFiles.length > 0 && (
          <div className="mb-2.5">
            {attachedFiles.length <= 3 ? (
              <div className="overflow-x-auto ch-files-scroll">
                <div className="flex gap-2 pb-1" style={{ width: 'max-content' }}>
                  {attachedFiles.map(f => (
                    <FileChip key={f.id} f={f} onRemove={() => onRemoveFile(f.id, f.name)} />
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 flex-wrap">
                {attachedFiles.slice(0, 2).map(f => (
                  <FileChip key={f.id} f={f} onRemove={() => onRemoveFile(f.id, f.name)} />
                ))}
                <div className="flex items-center gap-1.5 h-8.5 px-3 rounded-xl border border-stone-200/70 dark:border-stone-800/60 bg-white dark:bg-[#1c1917] text-[12px] font-medium text-stone-500 dark:text-stone-400">
                  <IcoClip />
                  +{attachedFiles.length - 2} más
                  <button onClick={onClearFiles} className="ml-1 text-stone-300 hover:text-rose-400 transition-colors">
                    <IcoX />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Input box */}
        <div className="ch-input bg-white dark:bg-[#141210] border border-stone-200/80 dark:border-stone-800/70 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_20px_rgba(0,0,0,0.25)]">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={e => onMessageChange(e.target.value.slice(0, MAX_CHARS))}
            onKeyDown={handleKey}
            placeholder={
              mode === 'noticias'      ? 'Buscar y analizar noticias del sector…' :
              mode === 'investigacion' ? 'Investigar normativa, mercados o tendencias…' :
              'Pregunta sobre tu ganado, trámites o normativa…'
            }
            rows={1}
            className="ch-textarea w-full px-4 pt-3.5 pb-2 bg-transparent text-[14px] text-stone-800 dark:text-stone-100 placeholder-stone-300 dark:placeholder-stone-600 resize-none leading-relaxed"
            style={{ maxHeight: '280px', minHeight: '46px', outline: 'none', boxShadow: 'none' }}
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
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-7 h-7 flex items-center justify-center rounded-full text-stone-300 dark:text-stone-600 hover:text-stone-500 dark:hover:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800/60 transition-all"
              >
                <IcoClip />
              </button>

              <div className="w-px h-4 bg-stone-200 dark:bg-stone-700/60" />

              {/* Mode selector */}
              <div className="relative" ref={modeRef}>
                <button
                  onClick={() => { onSetModeOpen(!modeOpen); onSetModelOpen(false) }}
                  aria-haspopup="listbox" aria-expanded={modeOpen} aria-label={`Modo: ${modeLabel[mode]}`}
                  className={`flex items-center gap-1.5 h-7 px-3 rounded-full text-[11.5px] font-medium transition-all border ${
                    isActiveMode
                      ? 'bg-[#2FAF8F]/10 border-[#2FAF8F]/25 text-[#2FAF8F]'
                      : 'bg-stone-50 dark:bg-stone-800/60 border-stone-200/70 dark:border-stone-700/50 text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200'
                  }`}
                >
                  {modeIcon(mode)}
                  <span>{modeLabel[mode]}</span>
                  {modeOpen ? <IcoChevronUp /> : <IcoChevronDown />}
                </button>
                {modeOpen && (
                  <div className="ch-dd absolute bottom-full left-0 mb-2 w-48 bg-white dark:bg-[#1c1917] rounded-xl border border-stone-200/80 dark:border-stone-800 shadow-[0_8px_28px_rgba(0,0,0,0.10)] dark:shadow-[0_8px_36px_rgba(0,0,0,0.40)] overflow-hidden py-1 z-40">
                    {([
                      { id: 'asistente'     as ChatMode, label: 'Asistente',     desc: 'Gestión ganadera',       icon: <IcoChat />   },
                      { id: 'noticias'      as ChatMode, label: 'Noticias',      desc: 'Analizar el sector',     icon: <IcoNews />   },
                      { id: 'investigacion' as ChatMode, label: 'Investigación', desc: 'Normativa y tendencias', icon: <IcoSearch /> },
                    ]).map(m => (
                      <button key={m.id} onClick={() => {
                        onSetMode(m.id)
                        onSetModeOpen(false)
                        onSetModel(m.id === 'asistente' ? 'acipe' : 'claude')
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

              {/* Model selector */}
              <div className="relative" ref={modelRef}>
                <button
                  onClick={() => {
                    onSetModelOpen(!modelOpen)
                    onSetModeOpen(false)
                  }}
                  aria-haspopup="listbox"
                  aria-expanded={modelOpen}
                  aria-label={`Modelo: ${selectedModel.label}`}
                  className="flex items-center gap-1 h-7 px-2.5 rounded-full text-[11px] font-medium border transition-all bg-stone-50 dark:bg-stone-800/40 text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 border-stone-200/70 dark:border-stone-700/50 hover:border-stone-300 dark:hover:border-stone-600 cursor-pointer"
                >
                  <IcoSpark />
                  <span className="ml-0.5">{selectedModel.label}</span>
                  {!isOnline && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" title="Sin conexión" />}
                  {modelOpen ? <IcoChevronUp /> : <IcoChevronDown />}
                </button>
                {modelOpen && (
                  <div className="ch-dd absolute bottom-full left-0 mb-2 w-52 bg-white dark:bg-[#1c1917] rounded-xl border border-stone-200/80 dark:border-stone-800 shadow-[0_8px_28px_rgba(0,0,0,0.10)] dark:shadow-[0_8px_36px_rgba(0,0,0,0.40)] overflow-hidden py-1 z-40">
                    {(mode === 'asistente' ? MODELS_ASISTENTE : MODELS_EXTERNOS).map(m => (
                      <button key={m.id} onClick={() => { onSetModel(m.id); onSetModelOpen(false) }} className={`w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors ${model === m.id ? 'text-[#2FAF8F]' : 'text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800/60'}`}>
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

            {/* Right actions: new chat, mic, send/stop */}
            <div className="flex items-center gap-1.5">
              {messagesCount > 0 && !isGenerating && (
                <button
                  onClick={onNewChat}
                  className="w-7 h-7 flex items-center justify-center rounded-full text-stone-300 dark:text-stone-600 hover:text-stone-500 dark:hover:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800/60 transition-all"
                  title="Nuevo chat"
                >
                  <IcoNewChat />
                </button>
              )}

              <button
                onClick={onNavigateVoz}
                className="w-7 h-7 flex items-center justify-center rounded-full text-stone-300 dark:text-stone-600 hover:text-stone-500 dark:hover:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800/60 transition-all"
              >
                <IcoMic />
              </button>

              <button
                onClick={isGenerating || isSimulating ? onStop : onSend}
                disabled={!isGenerating && !isSimulating && !message.trim() && attachedFiles.length === 0}
                className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all ${
                  isGenerating || isSimulating
                    ? 'bg-stone-800 dark:bg-stone-200 text-white dark:text-stone-900 hover:bg-stone-700 dark:hover:bg-stone-300 shadow-sm active:scale-95'
                    : message.trim() || attachedFiles.length > 0
                    ? 'bg-[#2FAF8F] hover:bg-[#27a07f] text-white shadow-sm active:scale-95'
                    : 'bg-stone-100 dark:bg-stone-800/60 text-stone-300 dark:text-stone-600 cursor-not-allowed'
                }`}
              >
                {isGenerating || isSimulating ? (
                  <svg className="w-3.25 h-3.25" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2.5"/></svg>
                ) : (
                  <IcoSend />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Bottom caption */}
        <p className="text-center text-[10.5px] text-stone-300 dark:text-stone-700 mt-2.5">
          {mode === 'noticias'
            ? 'Normativa SENASICA · USDA · FDA · Precios SNIIM'
            : mode === 'investigacion'
            ? 'Búsqueda profunda · Fuentes verificadas · Análisis sectorial'
            : 'Siete 1.0 · Asistente de gestión ganadera'}
        </p>
      </div>
    </div>
    </>
  )
}