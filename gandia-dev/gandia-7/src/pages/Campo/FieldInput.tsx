/**
 * FieldInput.tsx
 * Barra de entrada simplificada para el Agente de Campo.
 * Texto · Voz · Foto · Archivo — nada más.
 */

import {
    useState,
    useRef,
    useCallback,
    useEffect,
    type ChangeEvent,
    type KeyboardEvent,
} from 'react'

// ─── TIPOS ────────────────────────────────────────────────────────────────────

export interface FieldInputValue {
    text: string
    blob?: Blob
    mimeType?: string
    fileName?: string
    fileSize?: number
    type: 'text' | 'audio' | 'image' | 'file'
    durationSec?: number
}

interface FieldInputProps {
    disabled?: boolean
    onSend: (value: FieldInputValue) => void
    onVolume?: (v: number) => void    // 0-1 para la esfera
    onRecStart?: () => void
    onRecStop?: () => void
}

// ─── MICRÓFONO ────────────────────────────────────────────────────────────────

function useMicrophone(onVolume?: (v: number) => void) {
    const mediaRef = useRef<MediaRecorder | null>(null)
    const chunksRef = useRef<Blob[]>([])
    const analyserRef = useRef<AnalyserNode | null>(null)
    const rafRef = useRef<number>(0)
    const startTimeRef = useRef<number>(0)
    const [recording, setRecording] = useState(false)

    const stopVolumeLoop = () => {
        cancelAnimationFrame(rafRef.current)
        onVolume?.(0)
    }

    const startVolumeLoop = (analyser: AnalyserNode) => {
        const data = new Uint8Array(analyser.frequencyBinCount)
        const loop = () => {
            analyser.getByteFrequencyData(data)
            const avg = data.reduce((a, b) => a + b, 0) / data.length
            onVolume?.(Math.min(avg / 128, 1))
            rafRef.current = requestAnimationFrame(loop)
        }
        rafRef.current = requestAnimationFrame(loop)
    }

    const start = useCallback(async (): Promise<boolean> => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            const ctx = new AudioContext()
            const src = ctx.createMediaStreamSource(stream)
            const analyser = ctx.createAnalyser()
            analyser.fftSize = 64
            src.connect(analyser)
            analyserRef.current = analyser

            chunksRef.current = []
            startTimeRef.current = Date.now()

            const mimeType =
                MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' :
                    MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' :
                        ''

            const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
            rec.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }

            mediaRef.current = rec
            rec.start(100)
            setRecording(true)
            startVolumeLoop(analyser)
            return true
        } catch {
            return false
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [onVolume])

    const stop = useCallback((): Promise<{ blob: Blob; durationSec: number; mimeType: string } | null> => {
        return new Promise((resolve) => {
            const rec = mediaRef.current
            if (!rec || rec.state === 'inactive') { resolve(null); return }

            const durationSec = (Date.now() - startTimeRef.current) / 1000

            rec.onstop = () => {
                const mimeType = rec.mimeType || 'audio/webm'
                const blob = new Blob(chunksRef.current, { type: mimeType })
                // Detener tracks
                rec.stream.getTracks().forEach(t => t.stop())
                stopVolumeLoop()
                setRecording(false)
                resolve({ blob, durationSec, mimeType })
            }
            rec.stop()
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => () => { void stop() }, [stop])

    return { recording, start, stop }
}

// ─── COMPONENTE ───────────────────────────────────────────────────────────────

export function FieldInput({
    disabled = false,
    onSend,
    onVolume,
    onRecStart,
    onRecStop,
}: FieldInputProps) {
    const [text, setText] = useState('')
    const [preview, setPreview] = useState<{ name: string; type: string } | null>(null)
    const pendingFileRef = useRef<FieldInputValue | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const imgInputRef = useRef<HTMLInputElement>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    const { recording, start: startRec, stop: stopRec } = useMicrophone(onVolume)

    // ── Auto-resize textarea ─────────────────────────────────────────────────
    useEffect(() => {
        const el = textareaRef.current
        if (!el) return
        el.style.height = 'auto'
        el.style.height = `${Math.min(el.scrollHeight, 120)}px`
    }, [text])

    // ── Enviar texto ─────────────────────────────────────────────────────────
    const handleSendText = useCallback(() => {
        const t = text.trim()
        if (!t || disabled) return
        onSend({ text: t, type: 'text' })
        setText('')
    }, [text, disabled, onSend])

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            // Si hay archivo pendiente y texto, combinar
            if (pendingFileRef.current) {
                onSend({ ...pendingFileRef.current, text: text.trim() || pendingFileRef.current.text })
                pendingFileRef.current = null
                setPreview(null)
                setText('')
            } else {
                handleSendText()
            }
        }
    }

    // ── Grabar audio ─────────────────────────────────────────────────────────
    const handleMic = useCallback(async () => {
        if (recording) {
            onRecStop?.()
            const result = await stopRec()
            if (result) {
                onSend({
                    text: `Audio ${Math.round(result.durationSec)}s`,
                    blob: result.blob,
                    mimeType: result.mimeType,
                    fileName: `audio_${Date.now()}.webm`,
                    fileSize: result.blob.size,
                    type: 'audio',
                    durationSec: result.durationSec,
                })
            }
        } else {
            const ok = await startRec()
            if (ok) onRecStart?.()
        }
    }, [recording, startRec, stopRec, onSend, onRecStart, onRecStop])

    // ── Adjuntar imagen / cámara ──────────────────────────────────────────────
    const handleImageFile = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        pendingFileRef.current = {
            text: file.name,
            blob: file,
            mimeType: file.type,
            fileName: file.name,
            fileSize: file.size,
            type: 'image',
        }
        setPreview({ name: file.name, type: 'image' })
        e.target.value = ''
    }

    // ── Adjuntar archivo ──────────────────────────────────────────────────────
    const handleAnyFile = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        const type = file.type.startsWith('image/') ? 'image' : 'file'
        pendingFileRef.current = {
            text: file.name,
            blob: file,
            mimeType: file.type,
            fileName: file.name,
            fileSize: file.size,
            type,
        }
        setPreview({ name: file.name, type })
        e.target.value = ''
    }

    // ── Enviar con archivo adjunto ────────────────────────────────────────────
    const handleSendAttachment = useCallback(() => {
        if (!pendingFileRef.current || disabled) return
        const caption = text.trim() || pendingFileRef.current.text
        onSend({ ...pendingFileRef.current, text: caption })
        pendingFileRef.current = null
        setPreview(null)
        setText('')
    }, [text, disabled, onSend])

    const canSend = (text.trim().length > 0 || preview) && !disabled

    return (
        <div className="w-full px-4">
            <style>{`
                .field-textarea:focus {
                    outline: none !important;
                    box-shadow: none !important;
                    ring: 0 !important;
                }
            `}</style>
            {/* ── Preview de adjunto ──────────────────────────────────────────────── */}
            {preview && (
                <div className="mb-2 flex items-center gap-2 px-3 py-2 rounded-xl bg-stone-100 dark:bg-stone-800/60 border border-stone-200/60 dark:border-stone-700/40">
                    <span className="text-[11px] font-medium text-[#2FAF8F]">
                        {preview.type === 'image' ? '📷' : '📎'}
                    </span>
                    <span className="text-[12px] text-stone-600 dark:text-stone-300 truncate flex-1">{preview.name}</span>
                    <button
                        onClick={() => { pendingFileRef.current = null; setPreview(null) }}
                        className="w-4 h-4 flex items-center justify-center rounded-full text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors"
                    >
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>
            )}

            {/* ── Barra principal ──────────────────────────────────────────────────── */}
            <div className={[
                'flex items-end gap-2 px-3 py-2.5',
                'bg-white dark:bg-[#1c1917]',
                'border border-stone-200/80 dark:border-stone-700/50',
                'rounded-2xl shadow-sm',
                'transition-all duration-200',
                'focus-within:border-stone-300 dark:focus-within:border-stone-600',
                'focus-within:shadow-[0_2px_12px_rgba(0,0,0,0.06)]',
                recording ? 'border-[#2FAF8F]/50 ring-2 ring-[#2FAF8F]/15' : '',
            ].join(' ')}>

                {/* Inputs ocultos */}
                <input
                    ref={imgInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleImageFile}
                />
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="*/*"
                    className="hidden"
                    onChange={handleAnyFile}
                />

                {/* ── Botón adjuntar (Clip) ────────────────────────────────────────── */}
                <ActionButton
                    onClick={() => fileInputRef.current?.click()}
                    disabled={disabled || recording}
                    title="Adjuntar archivo o foto"
                    active={!!preview}
                >
                    <svg className="w-[17px] h-[17px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                    </svg>
                </ActionButton>

                {/* ── Textarea ────────────────────────────────────────────────────── */}
                {!recording ? (
                    <textarea
                        ref={textareaRef}
                        value={text}
                        onChange={e => setText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Escribe un reporte…"
                        rows={1}
                        disabled={disabled}
                        className={[
                            'flex-1 resize-none bg-transparent outline-none field-textarea',
                            'text-[14px] text-stone-800 dark:text-stone-100',
                            'placeholder:text-stone-400 dark:placeholder:text-stone-600',
                            'leading-[1.5] py-[3px]',
                            'scrollbar-hide',
                            disabled ? 'opacity-50 cursor-not-allowed' : '',
                        ].join(' ')}
                    />
                ) : (
                    /* Estado grabando */
                    <div className="flex-1 flex items-center gap-2 py-[3px]">
                        <span className="w-2 h-2 rounded-full bg-[#2FAF8F] animate-pulse shrink-0" />
                        <span className="text-[13px] text-[#2FAF8F] font-medium">Grabando…</span>
                    </div>
                )}

                {/* ── Botón micrófono ──────────────────────────────────────────────── */}
                <ActionButton
                    onClick={handleMic}
                    disabled={disabled}
                    title={recording ? 'Detener grabación' : 'Grabar audio'}
                    active={recording}
                    highlight={recording}
                >
                    {recording ? (
                        <svg className="w-[17px] h-[17px]" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                            <rect x="6" y="6" width="12" height="12" rx="2" />
                        </svg>
                    ) : (
                        <svg className="w-[17px] h-[17px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z" />
                            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                            <line x1="12" y1="19" x2="12" y2="22" />
                        </svg>
                    )}
                </ActionButton>

                {/* ── Botón enviar ─────────────────────────────────────────────────── */}
                <button
                    onClick={preview ? handleSendAttachment : handleSendText}
                    disabled={!canSend}
                    className={[
                        'w-8 h-8 rounded-xl flex items-center justify-center shrink-0',
                        'transition-all duration-200 active:scale-[0.92]',
                        canSend
                            ? 'bg-[#2FAF8F] text-white shadow-sm hover:bg-[#28a07f]'
                            : 'bg-stone-100 dark:bg-stone-800 text-stone-300 dark:text-stone-600',
                    ].join(' ')}
                    title="Enviar"
                >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13" />
                        <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                </button>

            </div>
        </div>
    )
}

// ─── ActionButton ─────────────────────────────────────────────────────────────

function ActionButton({
    children,
    onClick,
    disabled,
    title,
    active,
    highlight,
}: {
    children: React.ReactNode
    onClick: () => void
    disabled?: boolean
    title?: string
    active?: boolean
    highlight?: boolean
}) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            title={title}
            className={[
                'w-8 h-8 rounded-xl flex items-center justify-center shrink-0',
                'transition-all duration-200 active:scale-[0.92]',
                highlight
                    ? 'bg-[#2FAF8F]/15 text-[#2FAF8F]'
                    : active
                        ? 'text-[#2FAF8F]'
                        : 'text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800/60',
                disabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : '',
            ].join(' ')}
        >
            {children}
        </button>
    )
}