import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { Sparkles, MessageSquare, FileText, Bell, User, ArrowRight, X } from 'lucide-react'

// ─── TIPOS ────────────────────────────────────────────────────────────────────

type UserRole = 'productor' | 'mvz' | 'exportador' | 'auditor' | 'union_ganadera' | null

interface UserData {
  nombre: string
  rancho: string
  role: UserRole
  profileIncomplete: boolean
}

interface SpotlightRect {
  top: number; left: number; width: number; height: number; radius: number
}

// ─── COPY POR ROL ─────────────────────────────────────────────────────────────

function getChatCopy(role: UserRole) {
  if (role === 'union_ganadera') return 'Consulta reportes de toda la región, normativa y decisiones institucionales al instante.'
  if (role === 'mvz')           return 'Accede a protocolos sanitarios, expedientes y guías de certificación en segundos.'
  if (role === 'exportador')    return 'Consulta requisitos USDA, aranceles y estatus de tus trámites de exportación.'
  if (role === 'auditor')       return 'Revisa normativa, historial de decisiones y genera reportes de auditoría.'
  return 'Pregunta sobre tus animales, trámites o normativa. GANDIA 7 responde en segundos.'
}

function getTramitesCopy(role: UserRole) {
  if (role === 'union_ganadera') return 'Revisa y aprueba expedientes de todos los municipios del estado. Flujo completo en un solo lugar.'
  if (role === 'mvz')           return 'Gestiona dictámenes, certificados sanitarios y documentación de tus clientes.'
  if (role === 'exportador')    return 'Da seguimiento a tus exportaciones, movilizaciones y regularizaciones activas.'
  return 'Gestiona certificaciones, exportaciones y movilizaciones sin papeles ni filas.'
}

// ─── DEFINICIÓN DE PASOS ──────────────────────────────────────────────────────

interface TourStep {
  id: string
  targetId: string | null     // ID del elemento real a iluminar
  icon: React.ReactNode
  label: string               // etiqueta pequeña arriba
  title: string
  body: string
  tooltipSide: 'right' | 'left' | 'bottom' | 'center'
  isSplash?: boolean
  isFinale?: boolean
}

// ─── SAVE TOUR COMPLETED ──────────────────────────────────────────────────────

async function markTourCompleted(userId: string) {
  // Guarda tour_completed:true dentro del jsonb preferences
  // Primero lee preferences actuales para no pisar otros campos
  const { data } = await supabase
    .from('user_profiles')
    .select('preferences')
    .eq('user_id', userId)
    .maybeSingle()

  const current = (data?.preferences as Record<string, unknown>) ?? {}
  const updated  = { ...current, tour_completed: true }

  await Promise.allSettled([
    supabase.from('user_profiles').update({ preferences: updated }).eq('user_id', userId),
    supabase.from('profiles').update({ preferences: updated }).eq('id', userId),
  ])
}

// ─── HOOK: leer datos del usuario ─────────────────────────────────────────────

function useUserData(): { data: UserData | null; loading: boolean; tourCompleted: boolean } {
  const [data,          setData]          = useState<UserData | null>(null)
  const [loading,       setLoading]       = useState(true)
  const [tourCompleted, setTourCompleted] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { setLoading(false); return }

        const { data: profile } = await supabase
          .from('user_profiles')
          .select('personal_data, institutional_data, role, preferences')
          .eq('user_id', user.id)
          .maybeSingle()

        const { data: ranch } = await supabase
          .from('ranch_extended_profiles')
          .select('name, active_heads, surface_ha')
          .eq('user_id', user.id)
          .maybeSingle()

        const pd   = profile?.personal_data as Record<string, string> | null
        const id   = profile?.institutional_data as Record<string, string> | null
        const prefs = (profile?.preferences as Record<string, unknown>) ?? {}

        const nombre = pd?.nombre ?? pd?.full_name ?? user.email?.split('@')[0] ?? 'Usuario'
        const rancho = ranch?.name ?? id?.nombre_rancho ?? id?.razon_social ?? 'tu operación'
        const role   = (profile?.role as UserRole) ?? null
        const profileIncomplete = !ranch?.name || !ranch?.active_heads

        setTourCompleted(prefs.tour_completed === true)
        setData({ nombre, rancho, role, profileIncomplete })
      } catch {
        setData({ nombre: 'Usuario', rancho: 'tu operación', role: null, profileIncomplete: false })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return { data, loading, tourCompleted }
}

// ─── SPOTLIGHT OVERLAY ────────────────────────────────────────────────────────

function SpotlightOverlay({ rect, visible }: { rect: SpotlightRect | null; visible: boolean }) {
  if (!rect) return (
    <div style={{
      position: 'fixed', inset: 0,
      backgroundColor: 'rgba(0,0,0,0.82)',
      backdropFilter: 'blur(2px)',
      WebkitBackdropFilter: 'blur(2px)',
      opacity: visible ? 1 : 0,
      transition: 'opacity 350ms ease',
      zIndex: 990,
      pointerEvents: 'none',
    }} />
  )

  const pad = 12
  const t = rect.top    - pad
  const l = rect.left   - pad
  const w = rect.width  + pad * 2
  const h = rect.height + pad * 2
  const r = rect.radius + 4

  // SVG cutout technique — hueco real en la máscara
  const svgW = window.innerWidth
  const svgH = window.innerHeight

  const path = [
    `M 0 0 H ${svgW} V ${svgH} H 0 Z`,
    // Rectángulo redondeado recortado
    `M ${l + r} ${t}`,
    `H ${l + w - r}`,
    `Q ${l + w} ${t} ${l + w} ${t + r}`,
    `V ${t + h - r}`,
    `Q ${l + w} ${t + h} ${l + w - r} ${t + h}`,
    `H ${l + r}`,
    `Q ${l} ${t + h} ${l} ${t + h - r}`,
    `V ${t + r}`,
    `Q ${l} ${t} ${l + r} ${t}`,
    `Z`,
  ].join(' ')

  return (
    <svg
      style={{
        position: 'fixed', inset: 0, zIndex: 990, pointerEvents: 'none',
        opacity: visible ? 1 : 0,
        transition: 'opacity 350ms ease',
      }}
      width={svgW}
      height={svgH}
    >
      <defs>
        <filter id="tour-blur">
          <feGaussianBlur stdDeviation="1.5" />
        </filter>
      </defs>
      <path
        d={path}
        fill="rgba(0,0,0,0.82)"
        fillRule="evenodd"
      />
      {/* Borde verde brillante alrededor del recorte */}
      <rect
        x={l} y={t} width={w} height={h} rx={r}
        fill="none"
        stroke="#2FAF8F"
        strokeWidth="1.5"
        strokeOpacity="0.6"
        style={{
          filter: 'drop-shadow(0 0 8px rgba(47,175,143,0.5))',
        }}
      />
    </svg>
  )
}

// ─── TOOLTIP ─────────────────────────────────────────────────────────────────

interface TooltipProps {
  step: TourStep
  rect: SpotlightRect | null
  stepIndex: number
  totalSteps: number
  onNext: () => void
  onSkip: () => void
  isDark: boolean
  userData: UserData
}

function Tooltip({ step, rect, stepIndex, totalSteps, onNext, onSkip, isDark, userData }: TooltipProps) {
  const bg   = isDark ? '#1a1714' : '#ffffff'
  const tx1  = isDark ? '#f5f5f4' : '#1c1917'
  const tx2  = isDark ? '#a8a29e' : '#78716c'
  const bdr  = isDark ? 'rgba(68,64,60,0.7)' : 'rgba(214,211,208,0.8)'
  const isLast = stepIndex === totalSteps - 1

  // Posición del tooltip según el lado y el rect
  let top = '50%'
  let left = '50%'
  let transform = 'translate(-50%, -50%)'
  let lineStyle: React.CSSProperties | null = null

  const W = 300
  const margin = 24

  if (rect && step.tooltipSide !== 'center') {
    const cx = rect.left + rect.width  / 2
    const cy = rect.top  + rect.height / 2
    const pad = 14

    if (step.tooltipSide === 'right') {
      const tL = rect.left + rect.width + pad * 2 + 12
      const tT = Math.max(margin, Math.min(cy - 100, window.innerHeight - 220 - margin))
      top = `${tT}px`; left = `${tL}px`; transform = 'none'
      lineStyle = {
        position: 'fixed',
        left: rect.left + rect.width + pad,
        top: cy,
        width: pad + 12,
        height: 1,
        backgroundColor: '#2FAF8F',
        opacity: 0.5,
        zIndex: 993,
        pointerEvents: 'none',
      }
    } else if (step.tooltipSide === 'left') {
      const tL = rect.left - W - pad * 2 - 12
      const tT = Math.max(margin, Math.min(cy - 100, window.innerHeight - 220 - margin))
      top = `${tT}px`; left = `${Math.max(margin, tL)}px`; transform = 'none'
    } else if (step.tooltipSide === 'bottom') {
      const tT = rect.top + rect.height + pad * 2 + 8
      const tL = Math.max(margin, Math.min(cx - W / 2, window.innerWidth - W - margin))
      top = `${tT}px`; left = `${tL}px`; transform = 'none'
      lineStyle = {
        position: 'fixed',
        left: cx - 1,
        top: rect.top + rect.height + pad,
        width: 1,
        height: 8,
        backgroundColor: '#2FAF8F',
        opacity: 0.5,
        zIndex: 993,
        pointerEvents: 'none',
      }
    }
  }

  return (
    <>
      {/* Línea conectora */}
      {lineStyle && <div style={lineStyle} />}

      {/* Card */}
      <div style={{
        position: 'fixed',
        top, left, transform,
        width: step.isSplash || step.isFinale ? 'min(480px, calc(100vw - 48px))' : W,
        zIndex: 994,
        animation: 'tour-tooltip-in 380ms cubic-bezier(.16,1,.3,1) both',
      }}>
        <div style={{
          backgroundColor: bg,
          border: `1px solid ${bdr}`,
          borderRadius: 22,
          overflow: 'hidden',
          boxShadow: isDark
            ? '0 32px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(68,64,60,0.4)'
            : '0 32px 64px rgba(0,0,0,0.12), 0 0 0 1px rgba(214,211,208,0.6)',
        }}>
          {/* Barra verde top */}
          <div style={{
            height: 2,
            background: 'linear-gradient(90deg, #2FAF8F, #1a9070)',
          }} />

          <div style={{ padding: step.isSplash || step.isFinale ? '32px 28px 28px' : '22px 22px 20px' }}>

            {/* Splash especial */}
            {step.isSplash && (
              <div style={{ textAlign: 'center' }}>
                {/* Logo */}
                <div style={{
                  width: 52, height: 52, borderRadius: 16,
                  backgroundColor: 'rgba(47,175,143,0.1)',
                  border: '1px solid rgba(47,175,143,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 20px',
                  animation: 'tour-glow 2.8s ease-in-out infinite',
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2FAF8F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                    <path d="M2 17l10 5 10-5"/>
                    <path d="M2 12l10 5 10-5"/>
                  </svg>
                </div>

                <p style={{
                  fontFamily: "'Geist', system-ui, sans-serif",
                  fontSize: 10, fontWeight: 700,
                  letterSpacing: '0.14em', textTransform: 'uppercase',
                  color: '#2FAF8F', marginBottom: 12,
                }}>
                  GANDIA 7
                </p>

                <h1 style={{
                  fontFamily: "'Instrument Serif', Georgia, serif",
                  fontStyle: 'italic',
                  fontSize: 'clamp(2rem, 5vw, 2.8rem)',
                  lineHeight: 1.08,
                  color: tx1,
                  marginBottom: 14,
                }}>
                  Bienvenido,<br />
                  <span style={{ color: '#2FAF8F' }}>{userData.nombre}.</span>
                </h1>

                <p style={{
                  fontFamily: "'Geist', system-ui, sans-serif",
                  fontSize: 14, lineHeight: 1.7,
                  color: tx2, marginBottom: 28,
                  maxWidth: 360, margin: '0 auto 28px',
                }}>
                  {userData.rancho !== 'tu operación'
                    ? <>Tu operación <strong style={{ color: tx1 }}>{userData.rancho}</strong> ya está en el sistema. Te mostramos lo esencial en 30 segundos.</>
                    : 'Te mostramos lo esencial del sistema en 30 segundos.'
                  }
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <button
                    onClick={onNext}
                    style={{
                      padding: '14px 24px', borderRadius: 13, border: 'none',
                      backgroundColor: '#2FAF8F', color: '#fff',
                      fontFamily: "'Geist', system-ui, sans-serif",
                      fontSize: 14, fontWeight: 600,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      cursor: 'pointer',
                      boxShadow: '0 8px 24px rgba(47,175,143,.3)',
                      transition: 'all 180ms ease',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#27a07f'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#2FAF8F'; e.currentTarget.style.transform = 'none' }}
                  >
                    Comenzar recorrido
                    <ArrowRight style={{ width: 14, height: 14 }} strokeWidth={2.5} />
                  </button>
                  <button
                    onClick={onSkip}
                    style={{
                      padding: '10px', border: 'none', backgroundColor: 'transparent',
                      fontFamily: "'Geist', system-ui, sans-serif",
                      fontSize: 12.5, color: tx2, cursor: 'pointer',
                      transition: 'color 150ms ease',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.color = tx1)}
                    onMouseLeave={e => (e.currentTarget.style.color = tx2)}
                  >
                    Ir directo al chat
                  </button>
                </div>
              </div>
            )}

            {/* Finale */}
            {step.isFinale && (
              <div style={{ textAlign: 'center' }}>
                {/* Check animado */}
                <div style={{
                  width: 56, height: 56, borderRadius: '50%',
                  backgroundColor: 'rgba(47,175,143,0.12)',
                  border: '2px solid #2FAF8F',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 20px',
                  animation: 'tour-check-pop 500ms cubic-bezier(.34,1.56,.64,1) both',
                }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2FAF8F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>

                <h2 style={{
                  fontFamily: "'Instrument Serif', Georgia, serif",
                  fontStyle: 'italic',
                  fontSize: 'clamp(1.8rem, 4vw, 2.4rem)',
                  color: tx1, marginBottom: 10, lineHeight: 1.1,
                }}>
                  Todo listo.
                </h2>
                <p style={{
                  fontFamily: "'Geist', system-ui, sans-serif",
                  fontSize: 14, color: tx2, lineHeight: 1.7,
                  marginBottom: 28, maxWidth: 340, margin: '0 auto 28px',
                }}>
                  {userData.profileIncomplete
                    ? 'Puedes empezar ahora. Te recomendamos completar tu perfil para aprovechar todas las funciones.'
                    : 'Tu sistema está configurado y listo. Empieza con cualquier pregunta.'}
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <button
                    onClick={onNext}
                    style={{
                      padding: '14px 24px', borderRadius: 13, border: 'none',
                      backgroundColor: '#2FAF8F', color: '#fff',
                      fontFamily: "'Geist', system-ui, sans-serif",
                      fontSize: 14, fontWeight: 600,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      cursor: 'pointer',
                      boxShadow: '0 8px 24px rgba(47,175,143,.3)',
                      transition: 'all 180ms ease',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#27a07f'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#2FAF8F'; e.currentTarget.style.transform = 'none' }}
                  >
                    Entrar al sistema
                    <ArrowRight style={{ width: 14, height: 14 }} strokeWidth={2.5} />
                  </button>

                  {userData.profileIncomplete && (
                    <button
                      onClick={() => onSkip()}
                      style={{
                        padding: '10px', border: 'none',
                        backgroundColor: 'transparent',
                        fontFamily: "'Geist', system-ui, sans-serif",
                        fontSize: 12.5, color: '#2FAF8F', cursor: 'pointer',
                        fontWeight: 600,
                      }}
                    >
                      Completar perfil primero →
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Paso normal con spotlight */}
            {!step.isSplash && !step.isFinale && (
              <>
                {/* Label */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 9,
                    backgroundColor: 'rgba(47,175,143,0.1)',
                    border: '1px solid rgba(47,175,143,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#2FAF8F', flexShrink: 0,
                  }}>
                    {step.icon}
                  </div>
                  <span style={{
                    fontFamily: "'Geist', system-ui, sans-serif",
                    fontSize: 10, fontWeight: 700,
                    letterSpacing: '0.12em', textTransform: 'uppercase',
                    color: tx2,
                  }}>
                    {step.label}
                  </span>
                </div>

                {/* Título */}
                <h3 style={{
                  fontFamily: "'Instrument Serif', Georgia, serif",
                  fontStyle: 'italic',
                  fontSize: 22, lineHeight: 1.15,
                  color: tx1, marginBottom: 10,
                }}>
                  {step.title}
                </h3>

                {/* Body */}
                <p style={{
                  fontFamily: "'Geist', system-ui, sans-serif",
                  fontSize: 13.5, lineHeight: 1.7,
                  color: tx2, marginBottom: 22,
                }}>
                  {step.body}
                </p>

                {/* Acción especial si perfil incompleto (paso de perfil) */}
                {step.id === 'perfil' && userData.profileIncomplete && (
                  <div style={{
                    padding: '10px 14px', borderRadius: 12, marginBottom: 18,
                    backgroundColor: 'rgba(47,175,143,0.07)',
                    border: '1px solid rgba(47,175,143,0.2)',
                    display: 'flex', alignItems: 'center', gap: 10,
                  }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#2FAF8F', flexShrink: 0 }} />
                    <p style={{
                      fontFamily: "'Geist', system-ui, sans-serif",
                      fontSize: 12, color: '#2FAF8F', fontWeight: 500, margin: 0, lineHeight: 1.5,
                    }}>
                      Tu perfil necesita algunos datos para funcionar al 100%.
                    </p>
                  </div>
                )}

                {/* Botón siguiente */}
                <button
                  onClick={onNext}
                  style={{
                    width: '100%', padding: '11px 18px',
                    borderRadius: 12, border: 'none',
                    backgroundColor: '#2FAF8F', color: '#fff',
                    fontFamily: "'Geist', system-ui, sans-serif",
                    fontSize: 13, fontWeight: 600,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(47,175,143,.25)',
                    transition: 'all 180ms ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#27a07f'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#2FAF8F'; e.currentTarget.style.transform = 'none' }}
                >
                  {isLast ? 'Entrar al sistema' : 'Siguiente'}
                  <ArrowRight style={{ width: 13, height: 13 }} strokeWidth={2.5} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

// ─── DOTS DE PROGRESO ─────────────────────────────────────────────────────────

function ProgressDots({ total, current, isDark }: { total: number; current: number; isDark: boolean }) {
  // No mostrar en splash (0) ni finale (last)
  if (current === 0 || current === total - 1) return null
  const innerTotal = total - 2  // sin splash ni finale
  const innerCurrent = current - 1

  return (
    <div style={{
      position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)',
      zIndex: 995,
      display: 'flex', alignItems: 'center', gap: 7,
      animation: 'tour-tooltip-in 400ms ease both',
    }}>
      {Array.from({ length: innerTotal }).map((_, i) => (
        <div key={i} style={{
          width: i === innerCurrent ? 20 : 6,
          height: 6, borderRadius: 999,
          backgroundColor: i === innerCurrent
            ? '#2FAF8F'
            : i < innerCurrent
              ? 'rgba(47,175,143,0.35)'
              : isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
          transition: 'all 350ms cubic-bezier(.4,0,.2,1)',
          animation: i === innerCurrent ? 'tour-dot-pulse 2.4s ease-in-out infinite' : 'none',
        }} />
      ))}
    </div>
  )
}

// ─── BOTÓN SKIP ESQUINA ───────────────────────────────────────────────────────

function SkipButton({ onSkip, isDark, show }: { onSkip: () => void; isDark: boolean; show: boolean }) {
  if (!show) return null
  return (
    <button
      onClick={onSkip}
      style={{
        position: 'fixed', top: 20, right: 20, zIndex: 996,
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '7px 12px', borderRadius: 10,
        backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
        color: isDark ? '#a8a29e' : '#78716c',
        fontFamily: "'Geist', system-ui, sans-serif",
        fontSize: 12, fontWeight: 500,
        cursor: 'pointer',
        transition: 'all 150ms ease',
        animation: 'tour-tooltip-in 400ms ease both',
      }}
      onMouseEnter={e => { e.currentTarget.style.backgroundColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.09)' }}
      onMouseLeave={e => { e.currentTarget.style.backgroundColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}
    >
      <X style={{ width: 11, height: 11 }} strokeWidth={2} />
      Saltar tour
    </button>
  )
}

// ─── COMPONENT PRINCIPAL ──────────────────────────────────────────────────────

export default function TourPage() {
  const navigate                              = useNavigate()
  const { data: userData, loading, tourCompleted } = useUserData()
  const [stepIndex, setStepIndex]             = useState(0)
  const [rect,      setRect]                  = useState<SpotlightRect | null>(null)
  const [visible,   setVisible]               = useState(false)
  const [isDark,    setIsDark]                = useState(() =>
    document.documentElement.classList.contains('dark')
  )
  const rafRef = useRef<number>(0)

  // Guard: si ya completó el tour, ir directo al chat
  useEffect(() => {
    if (!loading && tourCompleted) {
      navigate('/chat', { replace: true })
    }
  }, [loading, tourCompleted, navigate])

  // Sincronizar si el tema cambia externamente (poco probable pero seguro)
  useEffect(() => {
    const obs = new MutationObserver(() =>
      setIsDark(document.documentElement.classList.contains('dark'))
    )
    obs.observe(document.documentElement, { attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [])

  // Definir pasos dinámicamente según userData — memoizado para estabilizar deps
  const steps = useMemo<TourStep[]>(() => userData ? [
    {
      id: 'splash',
      targetId: null,
      icon: <Sparkles style={{ width: 13, height: 13 }} />,
      label: 'Bienvenida',
      title: 'Bienvenido',
      body: '',
      tooltipSide: 'center' as const,
      isSplash: true,
    },
    {
      id: 'chat',
      targetId: 'tour-target-chat',
      icon: <MessageSquare style={{ width: 13, height: 13 }} strokeWidth={1.75} />,
      label: 'Módulo principal',
      title: 'El chat es tu centro.',
      body: getChatCopy(userData.role),
      tooltipSide: 'right' as const,
    },
    {
      id: 'tramites',
      targetId: 'tour-target-tramites',
      icon: <FileText style={{ width: 13, height: 13 }} strokeWidth={1.75} />,
      label: 'Gestión documental',
      title: 'Trámites sin filas.',
      body: getTramitesCopy(userData.role),
      tooltipSide: 'right' as const,
    },
    {
      id: 'notificaciones',
      targetId: 'tour-target-notificaciones',
      icon: <Bell style={{ width: 13, height: 13 }} strokeWidth={1.75} />,
      label: 'Alertas en tiempo real',
      title: 'Siempre informado.',
      body: 'Te avisamos cuando un trámite avanza, un documento llega o algo requiere tu atención.',
      tooltipSide: 'right' as const,
    },
    {
      id: 'perfil',
      targetId: 'tour-target-perfil',
      icon: <User style={{ width: 13, height: 13 }} strokeWidth={1.75} />,
      label: 'Tu perfil',
      title: userData.profileIncomplete ? 'Completa tu perfil.' : 'Tu perfil está listo.',
      body: userData.profileIncomplete
        ? 'Con tu información completa el sistema puede personalizar reportes, alertas y trámites.'
        : 'Tu información está registrada. Puedes actualizarla en cualquier momento desde configuraciones.',
      tooltipSide: 'right' as const,
    },
    {
      id: 'finale',
      targetId: null,
      icon: <Sparkles style={{ width: 13, height: 13 }} />,
      label: 'Listo',
      title: 'Todo listo.',
      body: '',
      tooltipSide: 'center' as const,
      isFinale: true,
    },
  ] : [], [userData])

  // Medir el elemento target del paso actual
  const measureTarget = useCallback((targetId: string | null) => {
    if (!targetId) { setRect(null); return }

    const el = document.getElementById(targetId)
    if (!el) { setRect(null); return }

    const r = el.getBoundingClientRect()
    const style = window.getComputedStyle(el)
    const radius = parseInt(style.borderRadius) || 12

    setRect({ top: r.top, left: r.left, width: r.width, height: r.height, radius })
  }, [])

  // Al cambiar de paso: mide y activa
  useEffect(() => {
    if (!steps.length) return
    const step = steps[stepIndex]

    cancelAnimationFrame(rafRef.current)

    // setVisible(false) va dentro del timeout — nunca setState síncrono en effect
    const t = setTimeout(() => {
      setVisible(false)
      measureTarget(step.targetId)
      rafRef.current = requestAnimationFrame(() => {
        setVisible(true)
      })
    }, 20)  // delay mínimo para que React procese el render anterior

    return () => {
      clearTimeout(t)
      cancelAnimationFrame(rafRef.current)
    }
  }, [stepIndex, steps, measureTarget])

  // Re-medir si cambia tamaño de ventana
  useEffect(() => {
    const onResize = () => {
      if (steps[stepIndex]) measureTarget(steps[stepIndex].targetId)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [stepIndex, steps, measureTarget])

  const finishTour = useCallback(async (goToProfile = false) => {
    setVisible(false)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) await markTourCompleted(user.id)
    } catch { /* no-op */ }
    setTimeout(() => {
      navigate(goToProfile ? '/perfil/editar' : '/chat', { replace: true })
    }, 300)
  }, [navigate])

  const handleNext = useCallback(() => {
    const step = steps[stepIndex]

    // Si es la pantalla finale y perfil incompleto, el botón secundario va a perfil
    if (step?.isFinale) { finishTour(false); return }

    if (stepIndex < steps.length - 1) {
      setStepIndex(i => i + 1)
    } else {
      finishTour(false)
    }
  }, [stepIndex, steps, finishTour])

  const handleSkip          = useCallback(() => { finishTour(false) }, [finishTour])
  const handleSkipToProfile = useCallback(() => { finishTour(true)  }, [finishTour])

  // Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleSkip()
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); handleNext() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleNext, handleSkip])

  if (loading || !userData || !steps.length) return null

  const currentStep = steps[stepIndex]

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital,wght@0,400;1,400&family=Geist:wght@300;400;500;600&display=swap');

        @keyframes tour-tooltip-in {
          from { opacity: 0; transform: translateY(10px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)  scale(1); }
        }
        @keyframes tour-glow {
          0%, 100% { box-shadow: 0 0 0 0   rgba(47,175,143,0.4); }
          60%       { box-shadow: 0 0 0 10px rgba(47,175,143,0);   }
        }
        @keyframes tour-dot-pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.65; }
        }
        @keyframes tour-check-pop {
          from { opacity: 0; transform: scale(0.4); }
          to   { opacity: 1; transform: scale(1);   }
        }
      `}</style>

      {/* Overlay spotlight */}
      <SpotlightOverlay rect={currentStep.targetId ? rect : null} visible={visible} />

      {/* Skip button (no en splash ni finale) */}
      <SkipButton
        onSkip={handleSkip}
        isDark={isDark}
        show={!currentStep.isSplash && !currentStep.isFinale}
      />

      {/* Tooltip / card */}
      {visible && userData && (
        <Tooltip
          key={stepIndex}
          step={currentStep}
          rect={rect}
          stepIndex={stepIndex}
          totalSteps={steps.length}
          onNext={handleNext}
          onSkip={currentStep.isFinale ? handleSkipToProfile : handleSkip}
          isDark={isDark}
          userData={userData}
        />
      )}

      {/* Progress dots */}
      <ProgressDots
        total={steps.length}
        current={stepIndex}
        isDark={isDark}
      />
    </>
  )
}