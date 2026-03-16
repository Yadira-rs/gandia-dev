import { useState, useCallback, useRef, useEffect } from 'react'
import {
  chatService,
  type ChatMode,
  type ChatModel,
  type AttachedFile,
  type AssistantPrefs,
} from '../../lib/chatService'
import type { UIMessage, Toast } from './chatTypes'
import { dbToUI } from './chatUtils'

// ─── Constants ────────────────────────────────────────────────────────────────
export const MAX_CHARS   = 4000

// ─── Read assistant prefs from localStorage (set by Configuraciones) ─────────
function getAssistantPrefs(): AssistantPrefs & { suggestions: boolean; history: boolean } {
  try {
    const raw = localStorage.getItem('gandia-assistant-prefs')
    if (raw) return { detailLevel: 'balanced', tone: 'professional', suggestions: true, history: true, ...JSON.parse(raw) }
  } catch { /* ignore */ }
  return { detailLevel: 'balanced', tone: 'professional', suggestions: true, history: true }
}
export const MAX_FILE_MB = 10

// ─── Smart error messages ─────────────────────────────────────────────────────
function friendlyError(err: unknown): string {
  const msg = err instanceof Error ? err.message.toLowerCase() : ''
  if (msg.includes('networkerror') || msg.includes('failed to fetch') || msg.includes('network'))
    return 'Sin conexión. Revisa tu internet e intenta de nuevo.'
  if (msg.includes('timeout') || msg.includes('aborted'))
    return 'La respuesta tardó demasiado. Intenta de nuevo.'
  if (msg.includes('401') || msg.includes('unauthorized'))
    return 'Sesión expirada. Recarga la página para continuar.'
  if (msg.includes('403') || msg.includes('forbidden'))
    return 'No tienes permiso para hacer eso.'
  if (msg.includes('429') || msg.includes('rate limit'))
    return 'Demasiadas solicitudes. Espera unos segundos.'
  if (msg.includes('500') || msg.includes('502') || msg.includes('503'))
    return 'El servidor está teniendo problemas. Intenta en un momento.'
  if (msg.includes('quota') || msg.includes('limit exceeded'))
    return 'Límite de uso alcanzado. Intenta más tarde.'
  return 'Algo salió mal. Intenta de nuevo.'
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useChat(onArtifactText?: (text: string) => boolean) {
  // ── Messages & conversation ─────────────────────────────────────────────────
  const [messages,        setMessages]        = useState<UIMessage[]>([])
  const [conversationId,  setConversationId]  = useState<string | null>(null)

  // ── Input ───────────────────────────────────────────────────────────────────
  const [message,        setMessage]        = useState('')
  const [attachedFiles,  setAttachedFiles]  = useState<AttachedFile[]>([])
  const [pendingFiles,   setPendingFiles]   = useState<File[]>([])

  // ── Generation state ────────────────────────────────────────────────────────
  const [isGenerating,      setIsGenerating]      = useState(false)
  const [isSaving,          setIsSaving]          = useState(false)
  const [showThinking,      setShowThinking]      = useState(false)
  const [thinkingSteps,     setThinkingSteps]     = useState<string[]>([])
  const [thinkingIdx,       setThinkingIdx]       = useState(0)
  const [thinkingDone,      setThinkingDone]      = useState(false)
  const [thinkingExpanded,  setThinkingExpanded]  = useState(false)
  const [streamingText,     setStreamingText]     = useState('')
  const [isStreaming,       setIsStreaming]        = useState(false)

  // ── UI micro-state ──────────────────────────────────────────────────────────
  const [toasts,         setToasts]         = useState<Toast[]>([])
  const [copiedId,       setCopiedId]       = useState<string | null>(null)
  const [isAtBottom,     setIsAtBottom]     = useState(true)
  const [hasNewMsg,      setHasNewMsg]      = useState(false)
  const [editingIdx,     setEditingIdx]     = useState<number | null>(null)
  const [editingText,    setEditingText]    = useState('')
  const [confirmNewChat, setConfirmNewChat] = useState(false)
  const [isDragging,     setIsDragging]     = useState(false)
  const [lightboxUrl,    setLightboxUrl]    = useState<string | null>(null)

  // ── Mode / model ────────────────────────────────────────────────────────────
  const [mode,      setMode]      = useState<ChatMode>('asistente')
  const [model,     setModel]     = useState<ChatModel>('acipe')
  const [modeOpen,  setModeOpen]  = useState(false)
  const [modelOpen, setModelOpen] = useState(false)

  // ─── Auto-switch model on connectivity change ────────────────────
  const [isOnline, setIsOnline] = useState(() => navigator.onLine)

  // ── Refs ────────────────────────────────────────────────────────────────────
  const abortRef = useRef<AbortController | null>(null)

  // Auto-switch acipe ↔ acipe-slim based on connectivity
  useEffect(() => {
    const goOffline = () => {
      setIsOnline(false)
      setModel(prev => prev === 'acipe' ? 'acipe-slim' : prev)
    }
    const goOnline = () => {
      setIsOnline(true)
      setModel(prev => prev === 'acipe-slim' ? 'acipe' : prev)
    }
    window.addEventListener('offline', goOffline)
    window.addEventListener('online',  goOnline)
    return () => {
      window.removeEventListener('offline', goOffline)
      window.removeEventListener('online',  goOnline)
    }
  }, [])

  // ─── Toast ──────────────────────────────────────────────────────────────────
  const addToast = useCallback((text: string, kind: Toast['kind'] = 'error') => {
    const id = crypto.randomUUID()
    setToasts(p => [...p, { id, text, kind }])
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500)
  }, [])

  // ─── Copy ───────────────────────────────────────────────────────────────────
  const handleCopy = useCallback((text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 1800)
  }, [])

  // ─── Process files ───────────────────────────────────────────────────────────
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
  }, [addToast])

  // ─── Stop generation ────────────────────────────────────────────────────────
  const handleStop = useCallback(() => {
    abortRef.current?.abort()
    setIsGenerating(false)
    setIsStreaming(false)
    setShowThinking(false)
    setStreamingText(prev => {
      if (prev.trim() && conversationId) {
        const partial = prev
        chatService.saveMessage({
          conversation_id: conversationId,
          role: 'assistant',
          content: partial + ' ∎',
          metadata: { stopped: true },
        }).catch(() => {})
        setMessages(p => [...p, {
          id: crypto.randomUUID(), role: 'assistant', content: partial + ' ∎',
          files: [], thoughts: [], thoughtsExpanded: false, isError: false,
          ts: Date.now(),
        }])
      }
      return ''
    })
  }, [conversationId])

  // ─── New chat ────────────────────────────────────────────────────────────────
  const doNewChat = useCallback(() => {
    handleStop()
    setMessages([])
    setConversationId(null)
    setConfirmNewChat(false)
    setStreamingText('')
    setThinkingSteps([])
  }, [handleStop])

  const handleNewChat = useCallback(() => {
    if (messages.length > 0) { setConfirmNewChat(true); return }
    doNewChat()
  }, [messages.length, doNewChat])

  // ─── Core generation ─────────────────────────────────────────────────────────
  const runGeneration = useCallback(async (
    userContent: string,
    filesToSend: AttachedFile[],
    rawFiles:    File[],
    convId:      string | null,
    history:     UIMessage[],
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
      // 1. Crear conversación si no existe
      let currentConvId = convId
      if (!currentConvId) {
        const conv = await chatService.createConversation({ mode, model })
        currentConvId = conv.id
        setConversationId(conv.id)
      }

      // 2. Subir archivos
      let uploadedFiles: AttachedFile[] = filesToSend.filter(f => f.storage_path)
      if (rawFiles.length > 0) {
        setIsSaving(true)
        try {
          const uploads = await Promise.all(rawFiles.map(f => chatService.uploadFile(f, currentConvId!)))
          uploadedFiles = [...uploadedFiles, ...uploads]
        } catch {
          addToast('Error al subir archivos. Intenta de nuevo.', 'error')
          setIsGenerating(false)
          setIsSaving(false)
          return
        }
        setIsSaving(false)
      }

      // 3. Guardar mensaje del usuario
      const savedUser = await chatService.saveMessage({
        conversation_id: currentConvId,
        role:    'user',
        content: userContent,
        files:   uploadedFiles,
      })
      setMessages(prev => prev.map(m =>
        m.id === 'temp-user' ? { ...dbToUI(savedUser), thoughtsExpanded: false } : m
      ))

      // 4. Construir historial (respetando preferencia mantener_historial)
      const assistantPrefs = getAssistantPrefs()
      const historyToSend = assistantPrefs.history
        ? history.filter(m => !m.isError).map(m => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
          }))
        : []
      const apiHistory = [
        ...historyToSend,
        { role: 'user' as const, content: userContent },
      ]

      // 5. Llamar a ACIPE con streaming
      setShowThinking(true)
      let localThoughts: string[] = []

      const response = await chatService.callAcipe(
        apiHistory, mode, model,
        (chunk: string) => {
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
        assistantPrefs,
      )

      // 6. Guardar respuesta
      const savedAssistant = await chatService.saveMessage({
        conversation_id: currentConvId,
        role:        'assistant',
        content:     response.content,
        thoughts:    response.thoughts,
        model:       response.model,
        tokens_used: response.tokens_used,
        latency_ms:  response.latency_ms,
      })

      // 7. Commit UI
      setIsGenerating(false)
      setIsStreaming(false)
      setStreamingText('')
      setShowThinking(false)
      setMessages(prev => [...prev, { ...dbToUI(savedAssistant), thoughtsExpanded: false }])

    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return

      setIsGenerating(false)
      setIsStreaming(false)
      setShowThinking(false)
      setStreamingText('')

      const errorText = friendlyError(err)
      addToast(errorText, 'error')

      if (conversationId) {
        chatService.saveMessage({
          conversation_id: conversationId,
          role: 'assistant', content: '', is_error: true,
          metadata: { error: errorText },
        }).catch(() => {})
      }

      setMessages(prev => [...prev, {
        id: crypto.randomUUID(), role: 'assistant', content: '',
        files: [], thoughts: [], thoughtsExpanded: false, isError: true,
        ts: Date.now(),
      }])
    }
  }, [mode, model, conversationId, addToast])

  // ─── Send ────────────────────────────────────────────────────────────────────
  const handleSend = useCallback(() => {
    const trimmed = message.trim()
    if (!trimmed && attachedFiles.length === 0) return
    if (isGenerating) return

    const tempUserMsg: UIMessage = {
      id: 'temp-user', role: 'user', content: trimmed,
      files: [...attachedFiles], thoughts: [], thoughtsExpanded: false,
      isError: false, ts: Date.now(),
    }

    const currentHistory = [...messages]
    setMessages(prev => [...prev, tempUserMsg])
    setMessage('')
    setAttachedFiles([])
    const rawToUpload = [...pendingFiles]
    setPendingFiles([])

    if (attachedFiles.length === 0 && onArtifactText?.(trimmed)) return

    runGeneration(trimmed, attachedFiles, rawToUpload, conversationId, currentHistory)
  }, [message, attachedFiles, pendingFiles, isGenerating, messages, conversationId, runGeneration, onArtifactText])

  // ─── handleSendWith: envía texto directo (usado por voz) ───────────────────
  const handleSendWith = useCallback((text: string) => {
    const trimmed = text.trim()
    if (!trimmed || isGenerating) return
    const tempUserMsg: UIMessage = {
      id: 'temp-user', role: 'user', content: trimmed,
      files: [], thoughts: [], thoughtsExpanded: false,
      isError: false, ts: Date.now(),
    }
    const currentHistory = [...messages]
    setMessages(prev => [...prev, tempUserMsg])
    setMessage('')
    if (onArtifactText?.(trimmed)) return
    runGeneration(trimmed, [], [], conversationId, currentHistory)
  }, [isGenerating, messages, conversationId, runGeneration, onArtifactText])

  // ─── Edit & resend ───────────────────────────────────────────────────────────
  const handleEditSave = useCallback((idx: number) => {
    const trimmed = editingText.trim()
    if (!trimmed) return
    const updatedHistory = messages.slice(0, idx).concat({ ...messages[idx], content: trimmed, ts: Date.now(), edited: true })
    setMessages(updatedHistory)
    setEditingIdx(null)
    setEditingText('')
    runGeneration(trimmed, [], [], conversationId, messages.slice(0, idx))
  }, [editingText, messages, conversationId, runGeneration])

  // ─── Pin message ────────────────────────────────────────────────────────────
  const handlePin = useCallback((id: string) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, pinned: !m.pinned } : m))
  }, [])

  // ─── Regenerate ──────────────────────────────────────────────────────────────
  const handleRegenerate = useCallback((idx: number) => {
    const prevHistory = messages.slice(0, idx)
    const lastUser    = [...prevHistory].reverse().find(m => m.role === 'user')
    if (!lastUser) return
    setMessages(prevHistory)
    runGeneration(lastUser.content, lastUser.files ?? [], [], conversationId, prevHistory.slice(0, -1))
  }, [messages, conversationId, runGeneration])

  return {
    // messages
    messages, setMessages,
    conversationId,

    // input
    message, setMessage,
    attachedFiles, setAttachedFiles,
    pendingFiles, setPendingFiles,

    // generation
    isGenerating, isSaving,
    showThinking,
    thinkingSteps, thinkingIdx, thinkingDone,
    thinkingExpanded, setThinkingExpanded,
    streamingText, isStreaming,

    // ui
    toasts,
    copiedId,
    isAtBottom, setIsAtBottom,
    hasNewMsg, setHasNewMsg,
    editingIdx, setEditingIdx,
    editingText, setEditingText,
    confirmNewChat, setConfirmNewChat,
    isDragging, setIsDragging,
    lightboxUrl, setLightboxUrl,

    // mode / model
    mode, setMode,
    model, setModel,
    modeOpen, setModeOpen,
    modelOpen, setModelOpen,

    // handlers
    addToast,
    handleCopy,
    processFiles,
    handleStop,
    doNewChat,
    handleNewChat,
    handleSend,
    handleSendWith,
    handleEditSave,
    handleRegenerate,
    handlePin,
    isOnline,
  }
}