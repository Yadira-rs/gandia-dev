/**
 * GANDIA — useVoiceNav v3
 *
 * Mejoras v3:
 *   - Wake word requiere inicio del transcript: "gandia, ir a chat" no "hablar gandia random"
 *   - Nuevo comando pendiente cancela el anterior automáticamente
 *   - Beep descendente al pausar por timeout
 *   - autoShow NO se activa si el usuario dismissó manualmente (intencional)
 *   - Comando "abrir notificaciones" / "cerrar notificaciones"
 *   - Activación en caliente vía evento 'gandia:voice-toggle' (sin recargar página)
 *   - Comandos de chat solo se despachan — el receptor (Chat.tsx) decide si aplica
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
  resultIndex: number
}
interface SpeechRecognitionErrorEvent extends Event {
  error: string
}
interface ISpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  maxAlternatives: number
  start(): void
  stop(): void
  abort(): void
  onresult:    ((e: SpeechRecognitionEvent) => void) | null
  onerror:     ((e: SpeechRecognitionErrorEvent) => void) | null
  onend:       (() => void) | null
  onstart:     (() => void) | null
  onspeechend: (() => void) | null
}

export type VoiceChatCmd = 'new_chat' | 'stop' | `search:${string}`

export interface UseVoiceNavOptions {
  enabled:    boolean
  onChatCmd?: (cmd: VoiceChatCmd) => void
}

export interface UseVoiceNavReturn {
  listening:      boolean
  supported:      boolean
  paused:         boolean
  dismissed:      boolean
  pendingAction:  string | null
  pendingLogout:  boolean
  lastCmd:        string | null
  error:          string | null
  togglePause:    () => void
  dismiss:        () => void
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const CMD_TIMEOUT_MS = 60 * 1000   // 1 min sin comando → pausa
const NAV_DELAY_MS   = 800

// Wake word: solo al INICIO del transcript (evita falsos positivos en conversación)
const WAKE_REGEX = /^(hey\s+gandia|oye\s+gandia|hola\s+gandia|gandia)[,\s]/i

// ─── Comandos de navegación ───────────────────────────────────────────────────

const NAV_COMMANDS: { patterns: string[]; action: string; label: string }[] = [
  { patterns: ['chat', 'ir a chat', 'abrir chat'],                           action: '/chat',              label: 'Chat'             },
  { patterns: ['noticias', 'ir a noticias'],                                 action: '/noticias',          label: 'Noticias'         },
  { patterns: ['trámites', 'tramites', 'ir a trámites', 'ir a tramites'],    action: '/tramites',          label: 'Trámites'         },
  { patterns: ['historial', 'ir a historial'],                               action: '/historial',         label: 'Historial'        },
  { patterns: ['notificaciones', 'ir a notificaciones', 'abrir notificaciones'], action: 'NOTIF_OPEN',     label: 'Notificaciones'   },
  { patterns: ['cerrar notificaciones', 'ocultar notificaciones'],           action: 'NOTIF_CLOSE',        label: 'Cerrar notif.'    },
  { patterns: ['configuraciones', 'ir a configuraciones', 'ajustes'],        action: '/configuraciones',   label: 'Configuraciones'  },
  { patterns: ['plan', 'mejorar plan', 'ir a plan', 'ver suscripcion', 'ver suscripción', 'actualizar plan'], action: '/plan', label: 'Plan' },
  { patterns: ['perfil', 'ir a perfil'],                                     action: '/perfil',            label: 'Perfil'           },
  { patterns: ['ayuda', 'ir a ayuda'],                                       action: '/ayuda',             label: 'Ayuda'            },
  { patterns: ['monitoreo', 'ir a monitoreo'],                               action: 'CHAT:monitoring',    label: 'Monitoreo'        },
  { patterns: ['fichas', 'pasaportes', 'ir a fichas'],                       action: 'CHAT:passport',      label: 'Fichas'           },
  { patterns: ['gemelos', 'ir a gemelos'],                                   action: 'CHAT:twins',         label: 'Gemelos'          },
  { patterns: ['volver', 'atrás', 'atras', 'regresar'],                     action: 'BACK',               label: 'Atrás'            },
  { patterns: ['escribe', 'escribir', 'dictar', 'modo escritura'],             action: 'DICTATE',            label: 'Dictado'          },
  { patterns: ['ir a chat y escribe', 'ir a chat y escribir', 'ir a chat y dictar', 'chat y escribe', 'chat escribe'], action: 'CHAT_DICTATE', label: 'Chat y dictado' },
  { patterns: ['cerrar sesion', 'cerrar sesión', 'salir', 'logout'],         action: 'LOGOUT',             label: 'Cerrar sesión'    },
]

const CHAT_COMMANDS: { patterns: string[]; cmd: VoiceChatCmd }[] = [
  { patterns: ['nueva consulta', 'nuevo chat', 'limpiar chat', 'nueva conversacion', 'nueva conversación'], cmd: 'new_chat' },
  { patterns: ['detener', 'parar', 'stop', 'cancela generacion', 'cancela generación'],                     cmd: 'stop'    },
]

const CANCEL_PATTERNS  = ['cancela', 'cancelar', 'espera', 'no', 'abort']
const CONFIRM_PATTERNS = ['confirmar', 'confirma', 'si', 'sí', 'adelante', 'ok']

// ─── Helpers ──────────────────────────────────────────────────────────────────

function norm(t: string) {
  return t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
}

function beep(freq: number, duration: number, vol = 0.08) {
  try {
    const ctx  = new AudioContext()
    const osc  = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.frequency.value = freq
    gain.gain.setValueAtTime(vol, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
    osc.start(); osc.stop(ctx.currentTime + duration)
    setTimeout(() => ctx.close(), (duration + 0.1) * 1000)
  } catch { /* sin AudioContext */ }
}

function beepDown() {
  // Tono descendente: avisa que el mic se durmió
  beep(600, 0.1, 0.06)
  setTimeout(() => beep(440, 0.1, 0.05), 150)
  setTimeout(() => beep(300, 0.15, 0.04), 300)
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useVoiceNav({ enabled, onChatCmd }: UseVoiceNavOptions): UseVoiceNavReturn {
  const navigate = useNavigate()

  const SpeechRecognitionCtor = (
    typeof window !== 'undefined' &&
    ((window as unknown as Record<string, unknown>).SpeechRecognition ||
     (window as unknown as Record<string, unknown>).webkitSpeechRecognition)
  ) as (new () => ISpeechRecognition) | undefined

  const supported = !!SpeechRecognitionCtor

  const recogRef         = useRef<ISpeechRecognition | null>(null)
  const enabledRef       = useRef(enabled)
  const pausedRef        = useRef(false)
  const dictModeRef      = useRef(false)  // true = reconocedor en modo dictado
  const dictTextRef      = useRef('')     // texto acumulado en modo dictado
  // intentionalDismiss: true cuando el usuario hizo X — autoShow NO reabre
  const intentDismissRef = useRef(false)
  const silenceTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const navTimerRef      = useRef<ReturnType<typeof setTimeout> | null>(null)
  const showTimerRef     = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onChatCmdRef     = useRef(onChatCmd)
  onChatCmdRef.current   = onChatCmd

  const [listening,     setListening]     = useState(false)
  const [paused,        setPaused]        = useState(false)
  const [dismissed,     setDismissed]     = useState(false)
  const [pendingAction, setPendingAction] = useState<string | null>(null)
  const [pendingLogout, setPendingLogout] = useState(false)
  const [lastCmd,       setLastCmd]       = useState<string | null>(null)
  const [error,         setError]         = useState<string | null>(null)

  // ─── Silence / inactivity timer ─────────────────────────────────────────────
  const resetSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
    silenceTimerRef.current = setTimeout(() => {
      pausedRef.current = true
      setPaused(true)
      beepDown()
      recogRef.current?.abort()
    }, CMD_TIMEOUT_MS)
  }, [])

  // ─── Feedback visual ────────────────────────────────────────────────────────
  const showCmd = useCallback((text: string) => {
    setLastCmd(text)
    setTimeout(() => setLastCmd(null), 3000)
  }, [])

  // ─── Auto-show panel (solo si no fue dismissal intencional) ─────────────────
  const autoShow = useCallback(() => {
    if (intentDismissRef.current) return  // el usuario lo cerró a propósito, no molestar
    if (showTimerRef.current) clearTimeout(showTimerRef.current)
    setDismissed(false)
    showTimerRef.current = setTimeout(() => {
      setDismissed(true)
    }, 5000)
  }, [])

  // ─── Cancelar navegación pendiente ──────────────────────────────────────────
  const cancelPending = useCallback(() => {
    if (navTimerRef.current) { clearTimeout(navTimerRef.current); navTimerRef.current = null }
    setPendingAction(null)
    setPendingLogout(false)
  }, [])

  // ─── Navegar tras delay (cancela pendiente anterior automáticamente) ─────────
  const scheduleNav = useCallback((action: string, label: string, transcript: string) => {
    // Cancelar cualquier navegación anterior antes de programar la nueva
    if (navTimerRef.current) { clearTimeout(navTimerRef.current); navTimerRef.current = null }

    showCmd(transcript)
    setPendingAction(`Yendo a ${label}…`)
    beep(880, 0.12)
    resetSilenceTimer()

    navTimerRef.current = setTimeout(() => {
      setPendingAction(null)
      if (action === 'BACK')         { navigate(-1); return }
      if (action === 'NOTIF_OPEN')   { window.dispatchEvent(new CustomEvent('gandia:notif-open'));  return }
      if (action === 'NOTIF_CLOSE')  { window.dispatchEvent(new CustomEvent('gandia:notif-close')); return }
      if (action === 'DICTATE') {
        dictModeRef.current = true
        dictTextRef.current = ''
        window.dispatchEvent(new CustomEvent('gandia:dictation-started'))
        return
      }
      if (action === 'CHAT_DICTATE') {
        navigate('/chat')
        setTimeout(() => {
          dictModeRef.current = true
          dictTextRef.current = ''
          window.dispatchEvent(new CustomEvent('gandia:dictation-started'))
        }, 400)
        return
      }
      if (action.startsWith('CHAT:')) {
        const param = action.split(':')[1]
        navigate({ pathname: '/chat', search: `?open=${param}` }); return
      }
      navigate(action)
    }, NAV_DELAY_MS)
  }, [navigate, showCmd, resetSilenceTimer])

  // ─── Resolver transcript ────────────────────────────────────────────────────
  const handleTranscript = useCallback((raw: string) => {
    const t = norm(raw)

    // ── Wake word — solo al inicio del transcript ────────────────────────────
    if (WAKE_REGEX.test(raw.trim())) {
      intentDismissRef.current = false  // wake word siempre reabre
      autoShow()
      beep(880, 0.1)
      resetSilenceTimer()
      // Procesar el comando que viene después del wake word
      const afterWake = raw.trim().replace(WAKE_REGEX, '').trim()
      if (afterWake) {
        // Re-entrar recursivamente con el texto tras el wake word
        handleTranscriptRef.current(afterWake)
      }
      return
    }

    // ── Auto-show al reconocer cualquier cosa (si no fue intencional) ────────
    autoShow()

    // ── Confirmación / cancelación de logout ─────────────────────────────────
    if (pendingLogout) {
      if (CONFIRM_PATTERNS.some(p => t.includes(norm(p)))) {
        setPendingLogout(false)
        showCmd(raw)
        resetSilenceTimer()
        navigate('/login', { replace: true })
      } else if (CANCEL_PATTERNS.some(p => t.includes(norm(p)))) {
        setPendingLogout(false)
        showCmd('Cancelado')
        resetSilenceTimer()
      }
      return
    }

    // ── Cancelar navegación pendiente ────────────────────────────────────────
    if (pendingAction && CANCEL_PATTERNS.some(p => t.includes(norm(p)))) {
      cancelPending()
      showCmd('Cancelado')
      beep(440, 0.1)
      resetSilenceTimer()
      return
    }

    // ── Comandos de chat ─────────────────────────────────────────────────────
    for (const { patterns, cmd } of CHAT_COMMANDS) {
      if (patterns.some(p => t.includes(norm(p)))) {
        showCmd(raw); beep(660, 0.1)
        resetSilenceTimer()
        onChatCmdRef.current?.(cmd)
        return
      }
    }

    // ── Buscar [término] ─────────────────────────────────────────────────────
    const searchMatch = t.match(/^buscar?\s+(.+)/)
    if (searchMatch) {
      const term = raw.trim().replace(/^buscar?\s+/i, '')
      showCmd(raw); beep(660, 0.1)
      resetSilenceTimer()
      onChatCmdRef.current?.(`search:${term}` as VoiceChatCmd)
      return
    }

    // ── Cerrar sesión (requiere confirmación) ────────────────────────────────
    const logoutCmd = NAV_COMMANDS.find(c => c.action === 'LOGOUT')
    if (logoutCmd?.patterns.some(p => t.includes(norm(p)))) {
      showCmd(raw)
      setPendingLogout(true)
      beep(440, 0.15)
      resetSilenceTimer()
      return
    }

    // ── Navegación ───────────────────────────────────────────────────────────
    for (const { patterns, action, label } of NAV_COMMANDS) {
      if (action === 'LOGOUT') continue
      if (patterns.some(p => t.includes(norm(p)))) {
        scheduleNav(action, label, raw)
        return
      }
    }
    // Transcript sin comando reconocido — no reiniciar timer
  }, [pendingAction, pendingLogout, resetSilenceTimer, showCmd, scheduleNav,
      cancelPending, navigate, autoShow])

  const handleTranscriptRef  = useRef(handleTranscript)
  handleTranscriptRef.current  = handleTranscript
  const startListeningRef = useRef<() => void>(() => {})

  // ─── Start / stop ────────────────────────────────────────────────────────────
  const startListening = useCallback(() => {
    if (!SpeechRecognitionCtor || !enabledRef.current || pausedRef.current) return

    const recog = new SpeechRecognitionCtor()
    recog.continuous      = true
    recog.interimResults  = true
    recog.lang            = 'es-MX'
    recog.maxAlternatives = 2

    recog.onstart    = () => { setListening(true); beep(660, 0.08); resetSilenceTimer() }
    recog.onspeechend = () => { /* no reset — solo comandos reales reinician el timer */ }

    recog.onresult = (e: SpeechRecognitionEvent) => {
      if (dictModeRef.current) {
        // ── MODO DICTADO ─────────────────────────────────────────────────────
        let finalChunk = ''
        let interimChunk = ''
        for (let i = e.resultIndex; i < e.results.length; i++) {
          if (e.results[i].isFinal) finalChunk  += e.results[i][0].transcript
          else                      interimChunk += e.results[i][0].transcript
        }
        if (interimChunk) {
          window.dispatchEvent(new CustomEvent('gandia:dictation-transcript', {
            detail: { transcript: dictTextRef.current, interim: interimChunk }
          }))
        }
        if (finalChunk) {
          const t = norm(finalChunk).trim()
          const sendPatterns  = ['enviar','envia','envía','mandar','manda','send']
          const cancelPatterns = ['cancelar','cancela','limpiar','limpia','borrar','borra']
          // strip punctuation before comparing — Chrome adds "." or "," to transcripts
          const tClean = t.replace(/[.,!?;:]+$/g, '').trim()
          const isSend   = sendPatterns.some(p  => tClean === norm(p) || tClean.endsWith(' ' + norm(p)))
          const isCancel = cancelPatterns.some(p => tClean === norm(p) || tClean.endsWith(' ' + norm(p)))
          if (isSend) {
            const text = dictTextRef.current.trim()
            dictModeRef.current = false
            dictTextRef.current = ''
            if (text) {
              window.dispatchEvent(new CustomEvent('gandia:dictation-commit', { detail: { text } }))
            } else {
              window.dispatchEvent(new CustomEvent('gandia:dictation-cancelled'))
            }
            return
          }
          if (isCancel) {
            dictModeRef.current = false
            dictTextRef.current = ''
            window.dispatchEvent(new CustomEvent('gandia:dictation-cancelled'))
            return
          }
          dictTextRef.current += (dictTextRef.current ? ' ' : '') + finalChunk.trim()
          window.dispatchEvent(new CustomEvent('gandia:dictation-transcript', {
            detail: { transcript: dictTextRef.current, interim: '' }
          }))
        }
        return
      }
      // ── MODO NAVEGACIÓN — solo resultados finales ──────────────────────────
      if (!e.results[e.resultIndex].isFinal) return
      const transcript = e.results[e.resultIndex][0].transcript
      handleTranscriptRef.current(transcript)
    }

    recog.onerror = (e: SpeechRecognitionErrorEvent) => {
      if (e.error === 'not-allowed') {
        setError('Permiso de micrófono denegado')
        setListening(false)
      } else if (e.error === 'no-speech' || e.error === 'network' || e.error === 'aborted') {
        // Transitorios — se recupera solo en onend
      } else {
        setError(`Error: ${e.error}`)
        setTimeout(() => setError(null), 4000)
      }
    }

    recog.onend = () => {
      setListening(false)
      recogRef.current = null
      if (enabledRef.current && !pausedRef.current) {
        setTimeout(() => {
          if (enabledRef.current && !pausedRef.current) {
            startListeningRef.current()
          }
        }, 300)
      }
    }

    recogRef.current = recog
    try { recog.start() } catch { setError('No se pudo iniciar el reconocimiento de voz') }
  }, [SpeechRecognitionCtor, resetSilenceTimer])

  startListeningRef.current = startListening

  const stopListening = useCallback(() => {
    enabledRef.current = false
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
    if (navTimerRef.current)     clearTimeout(navTimerRef.current)
    if (showTimerRef.current)    clearTimeout(showTimerRef.current)
    if (recogRef.current) { try { recogRef.current.abort() } catch { /**/ }; recogRef.current = null }
    setListening(false)
    setPendingAction(null)
    setPendingLogout(false)
  }, [])

  // ─── Toggle pausa manual ─────────────────────────────────────────────────────
  const togglePause = useCallback(() => {
    if (pausedRef.current) {
      pausedRef.current = false
      setPaused(false)
      startListening()
    } else {
      pausedRef.current = true
      setPaused(true)
      beepDown()
      recogRef.current?.abort()
    }
  }, [startListening])

  // ─── Dismiss intencional ─────────────────────────────────────────────────────
  const dismiss = useCallback(() => {
    intentDismissRef.current = true
    setDismissed(true)
    if (showTimerRef.current) clearTimeout(showTimerRef.current)
  }, [])

  // ─── Salir de modo dictado cuando useDictation llama stop() ────────────────
  useEffect(() => {
    const handler = () => {
      dictModeRef.current = false
      dictTextRef.current = ''
      window.dispatchEvent(new CustomEvent('gandia:dictation-cancelled'))
    }
    window.addEventListener('gandia:dictation-stop', handler)
    return () => window.removeEventListener('gandia:dictation-stop', handler)
  }, [])

  // ─── Wake event desde dot button ─────────────────────────────────────────────
  useEffect(() => {
    const handler = () => {
      intentDismissRef.current = false
      autoShow()
    }
    window.addEventListener('gandia:voice-wake', handler)
    return () => window.removeEventListener('gandia:voice-wake', handler)
  }, [autoShow])

  // (mic yield removed — dictado usa el mismo reconocedor, no hay conflicto)

  // ─── Activación en caliente vía evento ───────────────────────────────────────
  // Configuraciones dispara 'gandia:voice-toggle' al guardar, sin recargar página
  useEffect(() => {
    const handler = (e: Event) => {
      const { enabled: newEnabled } = (e as CustomEvent<{ enabled: boolean }>).detail
      enabledRef.current = newEnabled
      if (newEnabled && supported) {
        pausedRef.current = false
        setPaused(false)
        setError(null)
        startListening()
      } else {
        stopListening()
      }
    }
    window.addEventListener('gandia:voice-toggle', handler)
    return () => window.removeEventListener('gandia:voice-toggle', handler)
  }, [supported, startListening, stopListening])

  // ─── Reaccionar a cambio de prop enabled ─────────────────────────────────────
  useEffect(() => {
    enabledRef.current = enabled
    if (enabled && supported) {
      pausedRef.current = false
      setPaused(false)
      setError(null)
      startListening()
    } else {
      stopListening()
    }
    return () => { stopListening() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, supported])

  return { listening, supported, paused, dismissed, pendingAction, pendingLogout, lastCmd, error, togglePause, dismiss }
}