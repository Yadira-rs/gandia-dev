import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

// ─── TYPES ────────────────────────────────────────────────────────────────────
type OrbState = 'idle' | 'listening' | 'processing' | 'speaking'

interface Turn {
  role: 'user' | 'gandia'
  text: string
  ts: string
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const now = () =>
  new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })

// ─── MOCK CONVERSATION ───────────────────────────────────────────────────────
const MOCK_TURNS: Turn[] = [
  {
    role: 'user',
    text: 'Necesito registrar un nuevo pasaporte para un becerro que acaba de nacer esta mañana.',
    ts: '09:14',
  },
  {
    role: 'gandia',
    text: 'Perfecto. Para iniciar el registro del pasaporte necesito el número de arete oficial o el ID del animal. ¿Lo tienes a la mano?',
    ts: '09:14',
  },
]

// ─── WAVEFORM ─────────────────────────────────────────────────────────────────
function Waveform({ active }: { active: boolean }) {
  const bars = 28
  return (
    <div className="flex items-center justify-center gap-[3px] h-8">
      {Array.from({ length: bars }).map((_, i) => (
        <div
          key={i}
          className="rounded-full transition-all"
          style={{
            width: 2,
            backgroundColor: active ? '#2FAF8F' : '#d6d3d1',
            height: active
              ? `${8 + Math.abs(Math.sin(i * 0.72)) * 24}px`
              : '4px',
            animationDelay: active ? `${i * 38}ms` : '0ms',
            animation: active
              ? `wave-bar 1.1s ease-in-out ${i * 38}ms infinite alternate`
              : 'none',
            opacity: active ? 1 : 0.5,
          }}
        />
      ))}
    </div>
  )
}

// ─── ORB ──────────────────────────────────────────────────────────────────────
function Orb({
  state,
  onClick,
}: {
  state: OrbState
  onClick: () => void
}) {
  return (
    <div className="relative flex items-center justify-center" style={{ width: 220, height: 220 }}>

      {/* Outer ambient ring — always visible, slow rotate */}
      <div
        className="absolute inset-0 rounded-full orb-ring-ambient"
        style={{
          border: '1px solid',
          borderColor:
            state === 'listening' ? 'rgba(47,175,143,0.25)'
            : state === 'speaking' ? 'rgba(47,175,143,0.20)'
            : 'rgba(168,162,158,0.18)',
        }}
      />

      {/* Pulse rings — listening */}
      {state === 'listening' && (
        <>
          <div className="absolute rounded-full orb-pulse-1" style={{ width: 176, height: 176, border: '1px solid rgba(47,175,143,0.22)' }} />
          <div className="absolute rounded-full orb-pulse-2" style={{ width: 176, height: 176, border: '1px solid rgba(47,175,143,0.15)' }} />
        </>
      )}

      {/* Speaking rings */}
      {state === 'speaking' && (
        <>
          <div className="absolute rounded-full orb-speak-1" style={{ width: 176, height: 176, border: '1px solid rgba(47,175,143,0.20)' }} />
        </>
      )}

      {/* Processing arc — SVG */}
      {state === 'processing' && (
        <svg
          className="absolute orb-spin-arc"
          width={176}
          height={176}
          viewBox="0 0 176 176"
          fill="none"
        >
          <circle cx="88" cy="88" r="86" stroke="rgba(47,175,143,0.12)" strokeWidth="1" />
          <circle
            cx="88" cy="88" r="86"
            stroke="#2FAF8F"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeDasharray="80 460"
            strokeDashoffset="0"
          />
        </svg>
      )}

      {/* Core button */}
      <button
        onClick={onClick}
        aria-label={state === 'idle' ? 'Iniciar escucha' : 'Detener'}
        className="orb-core relative z-10 rounded-full flex items-center justify-center transition-all duration-500 active:scale-95"
        style={{
          width: 140,
          height: 140,
          background:
            state === 'listening'
              ? 'radial-gradient(circle at 38% 38%, rgba(47,175,143,0.18) 0%, rgba(47,175,143,0.06) 60%, transparent 100%), rgba(255,255,255,0.55)'
              : state === 'speaking'
              ? 'radial-gradient(circle at 38% 38%, rgba(47,175,143,0.22) 0%, rgba(47,175,143,0.08) 55%, transparent 100%), rgba(255,255,255,0.55)'
              : state === 'processing'
              ? 'radial-gradient(circle at 38% 38%, rgba(200,195,190,0.35) 0%, transparent 70%), rgba(255,255,255,0.50)'
              : 'radial-gradient(circle at 38% 38%, rgba(220,215,210,0.6) 0%, transparent 70%), rgba(255,255,255,0.45)',
          boxShadow:
            state === 'listening'
              ? '0 0 0 1px rgba(47,175,143,0.20), 0 12px 48px rgba(47,175,143,0.18), inset 0 1px 0 rgba(255,255,255,0.8)'
              : state === 'speaking'
              ? '0 0 0 1px rgba(47,175,143,0.25), 0 16px 56px rgba(47,175,143,0.22), inset 0 1px 0 rgba(255,255,255,0.8)'
              : '0 0 0 1px rgba(168,162,158,0.20), 0 8px 32px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        }}
      >
        {/* Dark mode core */}
        <span className="hidden dark:block absolute inset-0 rounded-full" style={{
          background:
            state === 'listening'
              ? 'radial-gradient(circle at 38% 38%, rgba(47,175,143,0.22) 0%, rgba(47,175,143,0.07) 55%, transparent 100%), rgba(28,25,23,0.70)'
              : state === 'speaking'
              ? 'radial-gradient(circle at 38% 38%, rgba(47,175,143,0.28) 0%, rgba(47,175,143,0.09) 50%, transparent 100%), rgba(28,25,23,0.70)'
              : 'radial-gradient(circle at 38% 38%, rgba(60,55,50,0.9) 0%, transparent 70%), rgba(28,25,23,0.70)',
          boxShadow:
            state === 'listening'
              ? '0 0 0 1px rgba(47,175,143,0.22), 0 12px 48px rgba(47,175,143,0.20), inset 0 1px 0 rgba(255,255,255,0.06)'
              : state === 'speaking'
              ? '0 0 0 1px rgba(47,175,143,0.28), 0 16px 56px rgba(47,175,143,0.25), inset 0 1px 0 rgba(255,255,255,0.06)'
              : '0 0 0 1px rgba(80,70,60,0.30), 0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
        }} />

        {/* Icon */}
        <MicIcon state={state} />
      </button>
    </div>
  )
}

function MicIcon({ state }: { state: OrbState }) {
  const color =
    state === 'listening' ? '#2FAF8F'
    : state === 'speaking' ? '#2FAF8F'
    : state === 'processing' ? '#a8a29e'
    : '#78716c'

  if (state === 'processing') {
    return (
      <svg className="relative z-10 orb-icon-spin" width={28} height={28} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z"/>
        <path d="M2 17l10 5 10-5"/>
        <path d="M2 12l10 5 10-5"/>
      </svg>
    )
  }

  return (
    <svg className="relative z-10" width={28} height={28} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
      <line x1="12" y1="19" x2="12" y2="23"/>
      <line x1="8" y1="23" x2="16" y2="23"/>
    </svg>
  )
}

// ─── SUMMARY SHEET ────────────────────────────────────────────────────────────
function SummarySheet({
  open,
  onClose,
  turns,
}: {
  open: boolean
  onClose: () => void
  turns: Turn[]
}) {
  const navigate = useNavigate()

  const handleSendChat = () => {
    onClose()
    setTimeout(() => navigate('/chat'), 240)
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-40 transition-all duration-300"
        style={{
          background: open ? 'rgba(0,0,0,0.25)' : 'transparent',
          backdropFilter: open ? 'blur(4px)' : 'none',
          pointerEvents: open ? 'all' : 'none',
          opacity: open ? 1 : 0,
        }}
      />

      {/* Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 transition-transform duration-[360ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{ transform: open ? 'translateY(0)' : 'translateY(100%)' }}
      >
        <div className="mx-auto max-w-[640px] px-4 pb-8">
          <div className="bg-white dark:bg-[#1c1917] rounded-[24px] border border-stone-200/80 dark:border-stone-800/60 shadow-[0_-4px_60px_rgba(0,0,0,0.12)] dark:shadow-[0_-4px_60px_rgba(0,0,0,0.50)] overflow-hidden">
            {/* Top accent */}
            <div className="h-[3px] bg-gradient-to-r from-[#2FAF8F] via-[#3fcfaf] to-[#2FAF8F]" />

            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-8 h-[3px] rounded-full bg-stone-200 dark:bg-stone-700" />
            </div>

            {/* Header */}
            <div className="px-6 pt-3 pb-4 flex items-center justify-between">
              <div>
                <h3 className="text-[14px] font-semibold tracking-[-0.015em] text-stone-900 dark:text-stone-50">
                  Resumen de conversación
                </h3>
                <p className="text-[11.5px] text-stone-400 dark:text-stone-500 mt-0.5">
                  {turns.length} turnos · {turns[turns.length - 1]?.ts ?? '—'}
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800/60 transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Turns */}
            <div className="px-6 pb-4 space-y-4 max-h-[280px] overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
              {turns.map((t, i) => (
                <div key={i} className={`flex gap-3 ${t.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {t.role === 'gandia' && (
                    <div className="w-6 h-6 rounded-lg bg-[#2FAF8F] flex items-center justify-center text-white text-[10px] font-bold shrink-0 mt-0.5 shadow-sm">
                      G
                    </div>
                  )}
                  <div className="max-w-[80%]">
                    <div className={`rounded-2xl px-3.5 py-2.5 text-[13px] leading-[1.65] ${
                      t.role === 'user'
                        ? 'bg-stone-100 dark:bg-stone-800/60 text-stone-700 dark:text-stone-300'
                        : 'bg-transparent text-stone-600 dark:text-stone-300'
                    }`}>
                      {t.role === 'gandia'
                        ? <span className="sheet-serif italic">{t.text}</span>
                        : t.text
                      }
                    </div>
                    <p className="text-[10px] text-stone-300 dark:text-stone-600 mt-1 px-1">{t.ts}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="px-6 pb-6 pt-2 flex gap-2.5">
              <button
                onClick={() => navigator.clipboard.writeText(turns.map(t => `${t.role === 'gandia' ? 'Gandia' : 'Tú'}: ${t.text}`).join('\n\n'))}
                className="flex-1 h-10 rounded-xl text-[13px] font-medium text-stone-600 dark:text-stone-300 bg-stone-100 dark:bg-stone-800/60 hover:bg-stone-200 dark:hover:bg-stone-700 active:scale-[0.98] transition-all"
              >
                Copiar
              </button>
              <button
                onClick={handleSendChat}
                className="flex-1 h-10 rounded-xl text-[13px] font-medium text-white bg-[#2FAF8F] hover:bg-[#27a07f] active:scale-[0.98] transition-all shadow-sm"
              >
                Continuar en chat
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// ─── STATUS LABEL ─────────────────────────────────────────────────────────────
const STATE_META: Record<OrbState, { label: string; sub: string }> = {
  idle:       { label: 'Toca para hablar',  sub: 'Gandia está lista'            },
  listening:  { label: 'Escuchando…',       sub: 'Habla con claridad'           },
  processing: { label: 'Procesando…',       sub: 'Analizando tu solicitud'      },
  speaking:   { label: 'Gandia responde',   sub: 'Escucha la respuesta'         },
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function Voz() {
  const navigate = useNavigate()

  const [orbState, setOrbState] = useState<OrbState>('idle')
  const [isPaused, setIsPaused]   = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [turns, setTurns]         = useState<Turn[]>([])
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Demo flow ──
  const runDemo = useCallback(() => {
    setOrbState('listening')
    timerRef.current = setTimeout(() => {
      const userTurn: Turn = { role: 'user', text: MOCK_TURNS[0].text, ts: now() }
      setTurns([userTurn])
      setOrbState('processing')
      timerRef.current = setTimeout(() => {
        setOrbState('speaking')
        const gandiaTurn: Turn = { role: 'gandia', text: MOCK_TURNS[1].text, ts: now() }
        setTurns(p => [...p, gandiaTurn])
        timerRef.current = setTimeout(() => {
          setOrbState('idle')
        }, 3200)
      }, 1800)
    }, 2200)
  }, [])

  useEffect(() => {
    const t = setTimeout(runDemo, 600)
    return () => { clearTimeout(t); if (timerRef.current) clearTimeout(timerRef.current) }
  }, [runDemo])

  const handleOrbClick = () => {
    if (isPaused) return
    if (timerRef.current) clearTimeout(timerRef.current)
    if (orbState === 'idle') {
      runDemo()
    } else {
      setOrbState('idle')
    }
  }

  const handlePause = () => {
    setIsPaused(p => !p)
    if (!isPaused && timerRef.current) clearTimeout(timerRef.current)
    if (!isPaused) setOrbState('idle')
  }

  const meta = isPaused
    ? { label: 'En pausa', sub: 'Toca ▶ para continuar' }
    : STATE_META[orbState]

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600&display=swap');

        .vz * { -webkit-font-smoothing: antialiased; }
        .vz { font-family: 'Geist', system-ui, sans-serif; }
        .vz-serif, .sheet-serif { font-family: 'Instrument Serif', Georgia, serif; }

        .vz *:focus-visible { outline: none !important; box-shadow: none !important; }

        /* Waveform bar animation */
        @keyframes wave-bar {
          0%   { transform: scaleY(0.3); }
          100% { transform: scaleY(1);   }
        }

        /* Orb ambient ring — slow rotation */
        @keyframes ring-ambient {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        .orb-ring-ambient {
          animation: ring-ambient 18s linear infinite;
          border-style: dashed;
        }

        /* Listening pulse */
        @keyframes orb-pulse-out {
          0%   { transform: scale(1);    opacity: 0.5; }
          100% { transform: scale(1.48); opacity: 0;   }
        }
        .orb-pulse-1 { animation: orb-pulse-out 1.9s ease-out infinite; }
        .orb-pulse-2 { animation: orb-pulse-out 1.9s ease-out 0.65s infinite; }

        /* Speaking pulse */
        @keyframes orb-speak {
          0%,100% { transform: scale(1);    opacity: 0.3; }
          50%     { transform: scale(1.28); opacity: 0;   }
        }
        .orb-speak-1 { animation: orb-speak 2.4s ease-in-out infinite; }

        /* Processing arc spin */
        @keyframes arc-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .orb-spin-arc { animation: arc-spin 1.6s linear infinite; transform-origin: center; }

        /* Core idle breathing */
        @keyframes core-breathe {
          0%,100% { transform: scale(1);    }
          50%     { transform: scale(1.04); }
        }
        .orb-core { animation: core-breathe 4s ease-in-out infinite; }

        /* Processing icon micro-spin */
        @keyframes icon-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .orb-icon-spin { animation: icon-spin 3s linear infinite; }

        /* Turn entry */
        @keyframes turn-in {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
        .turn-in { animation: turn-in 320ms cubic-bezier(.16,1,.3,1) both; }

        /* State label cross-fade */
        @keyframes label-in {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
        .label-in { animation: label-in 240ms ease both; }

        /* Thin scrollbar */
        .vz-scroll::-webkit-scrollbar { width: 2px; }
        .vz-scroll::-webkit-scrollbar-track { background: transparent; }
        .vz-scroll::-webkit-scrollbar-thumb { background: #e7e5e4; border-radius: 999px; }
        .dark .vz-scroll::-webkit-scrollbar-thumb { background: #3c3836; }
      `}</style>

      <div className="vz flex flex-col h-full bg-[#fafaf9] dark:bg-[#0c0a09] select-none overflow-hidden">

        {/* ── BACK BTN — within page content, not in AppLayout header ── */}
        <div className="shrink-0 px-4 pt-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-[12px] font-medium text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800/60 transition-all"
            aria-label="Volver"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
            Volver
          </button>
        </div>

        {/* ── MAIN AREA ─────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">

          {/* ── ORB AREA — always centered ── */}
          <div className="flex-1 flex flex-col items-center justify-center gap-5 px-4 py-4 min-h-0">

            {/* State label */}
            <div key={`${orbState}-${isPaused}`} className="label-in text-center">
              <p className="text-[13px] font-medium tracking-[-0.01em] text-stone-700 dark:text-stone-200">
                {meta.label}
              </p>
              <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-0.5">
                {meta.sub}
              </p>
            </div>

            {/* Orb */}
            <Orb state={isPaused ? 'idle' : orbState} onClick={handleOrbClick} />

            {/* Waveform */}
            <div className="h-8">
              <Waveform active={!isPaused && orbState === 'listening'} />
            </div>

          </div>
        </div>

        {/* ── CONTROLS BAR ──────────────────────────────────── */}
        <div className="shrink-0 px-4 pb-6">
          <div className="max-w-[360px] mx-auto">
            <div className="flex items-center justify-center gap-3">

              {/* Pause / Resume */}
              <ControlBtn
                onClick={handlePause}
                label={isPaused ? 'Reanudar' : 'Pausar'}
                active={isPaused}
              >
                {isPaused ? (
                  <svg className="w-[17px] h-[17px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="5 3 19 12 5 21 5 3"/>
                  </svg>
                ) : (
                  <svg className="w-[17px] h-[17px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
                  </svg>
                )}
              </ControlBtn>

              {/* Big center mic toggle — send to chat if idle+turns, else orb action */}
              <button
                onClick={handleOrbClick}
                disabled={isPaused}
                aria-label="Activar micrófono"
                className={`
                  w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-200 active:scale-95 shadow-sm
                  ${isPaused
                    ? 'bg-stone-100 dark:bg-stone-800/60 text-stone-300 dark:text-stone-600 cursor-not-allowed'
                    : orbState !== 'idle'
                    ? 'bg-[#2FAF8F] hover:bg-[#27a07f] text-white shadow-[0_4px_20px_rgba(47,175,143,0.35)]'
                    : 'bg-stone-900 dark:bg-stone-50 text-white dark:text-stone-900 hover:bg-stone-700 dark:hover:bg-stone-200'
                  }
                `}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                  <line x1="12" y1="19" x2="12" y2="23"/>
                  <line x1="8" y1="23" x2="16" y2="23"/>
                </svg>
              </button>

              {/* Summary */}
              <ControlBtn
                onClick={() => setSheetOpen(true)}
                label="Resumen"
                badge={turns.length > 0 ? String(turns.length) : undefined}
              >
                <svg className="w-[17px] h-[17px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="9" y1="13" x2="15" y2="13"/>
                  <line x1="9" y1="17" x2="13" y2="17"/>
                </svg>
              </ControlBtn>

            </div>

            {/* Footer hint */}
            <p className="text-center text-[10.5px] text-stone-300 dark:text-stone-700 mt-4">
              GANDIA 7 · Voz · Asistente ganadero
            </p>
          </div>
        </div>

      </div>

      {/* ── SUMMARY SHEET ─────────────────────────────────────── */}
      <SummarySheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        turns={turns.length > 0 ? turns : MOCK_TURNS.map(t => ({ ...t, ts: '09:14' }))}
      />
    </>
  )
}

// ─── CONTROL BTN ──────────────────────────────────────────────────────────────
function ControlBtn({
  onClick,
  label,
  children,
  active = false,
  badge,
}: {
  onClick: () => void
  label: string
  children: React.ReactNode
  active?: boolean
  badge?: string
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`
        relative w-11 h-11 rounded-xl flex items-center justify-center
        transition-all duration-150 active:scale-95
        border
        ${active
          ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 border-stone-900 dark:border-stone-100'
          : 'bg-white dark:bg-[#1c1917] text-stone-500 dark:text-stone-400 border-stone-200/80 dark:border-stone-800/60 hover:text-stone-700 dark:hover:text-stone-200 hover:border-stone-300 dark:hover:border-stone-700 shadow-[0_1px_4px_rgba(0,0,0,0.05)]'
        }
      `}
    >
      {children}
      {badge && (
        <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-[#2FAF8F] text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1 leading-none shadow-sm">
          {badge}
        </span>
      )}
    </button>
  )
}