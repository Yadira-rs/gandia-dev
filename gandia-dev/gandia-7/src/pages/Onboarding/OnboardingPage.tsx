import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { getCurrentProfile } from '../../lib/authService'
import { Check, Moon, Sun, ArrowRight, Sparkles } from 'lucide-react'

// ─── TYPES ────────────────────────────────────────────────────────────────────

type Theme = 'dark' | 'light'
type Font  = 'geist' | 'serif' | 'lora'

interface Preferences {
  theme: Theme
  font:  Font
}

// ─── FONT CONFIG ──────────────────────────────────────────────────────────────

const FONTS: { id: Font; label: string; tagline: string; sample: string; body: string; family: string }[] = [
  {
    id:      'geist',
    label:   'Geist',
    tagline: 'Moderna · Clara',
    sample:  'Ag',
    body:    'Optimizada para pantalla',
    family:  "'Geist', system-ui, sans-serif",
  },
  {
    id:      'serif',
    label:   'Instrument',
    tagline: 'Premium · Elegante',
    sample:  'Ag',
    body:    'Inspirada en editoriales',
    family:  "'Instrument Serif', Georgia, serif",
  },
  {
    id:      'lora',
    label:   'Lora',
    tagline: 'Editorial · Cálida',
    sample:  'Ag',
    body:    'Lectura de largo aliento',
    family:  "'Lora', Georgia, serif",
  },
]

const FONT_FAMILIES: Record<Font, string> = {
  geist: "'Geist', system-ui, sans-serif",
  serif: "'Instrument Serif', Georgia, serif",
  lora:  "'Lora', Georgia, serif",
}

const FONT_SAMPLE_STYLE: Record<Font, React.CSSProperties> = {
  geist: { fontFamily: "'Geist', system-ui, sans-serif", fontWeight: 500, fontStyle: 'normal' },
  serif: { fontFamily: "'Instrument Serif', Georgia, serif", fontStyle: 'italic', fontWeight: 400 },
  lora:  { fontFamily: "'Lora', Georgia, serif", fontWeight: 400, fontStyle: 'italic' },
}

// ─── SAVE ─────────────────────────────────────────────────────────────────────

async function saveOnboardingPreferences(prefs: Preferences): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No session')
  const payload = { preferences: prefs, onboarding_completed: true, updated_at: new Date().toISOString() }
  await Promise.allSettled([
    supabase.from('user_profiles').update(payload).eq('user_id', user.id),
    supabase.from('profiles').update(payload).eq('id', user.id),
  ])
}

function applyPreferences(prefs: Preferences) {
  document.documentElement.classList.toggle('dark', prefs.theme === 'dark')
  document.documentElement.style.setProperty('--font-app', FONT_FAMILIES[prefs.font])
  localStorage.setItem('gandia-theme', prefs.theme)
  localStorage.setItem('gandia-font', prefs.font)
}

function useOSTheme(): Theme {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

// ─── PREVIEW CARD ─────────────────────────────────────────────────────────────

function PreviewCard({ prefs, isDark, tx1, tx2, bdr, bg3 }: {
  prefs: Preferences; isDark: boolean; tx1: string; tx2: string; bdr: string; bg3: string
}) {
  const bodyFont = FONT_FAMILIES[prefs.font]
  const cardBg   = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'
  const msgBg    = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'
  const accentBg = isDark ? 'rgba(47,175,143,0.12)'  : 'rgba(47,175,143,0.09)'

  return (
    <div style={{
      borderRadius: 18,
      border: `1px solid ${bdr}`,
      backgroundColor: bg3,
      overflow: 'hidden',
      transition: 'all 320ms cubic-bezier(.4,0,.2,1)',
    }}>
      {/* Header bar */}
      <div style={{
        padding: '10px 14px',
        borderBottom: `1px solid ${bdr}`,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        backgroundColor: cardBg,
      }}>
        <div style={{ display: 'flex', gap: 5 }}>
          {['#ff5f57','#febc2e','#28c840'].map(c => (
            <div key={c} style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: c, opacity: .7 }} />
          ))}
        </div>
        <div style={{
          flex: 1, height: 18, borderRadius: 6,
          backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: 9, color: tx2, fontFamily: FONT_FAMILIES['geist'], letterSpacing: '0.06em' }}>
            GANDIA 7 — Preview
          </span>
        </div>
      </div>

      {/* Chat preview */}
      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* User bubble */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{
            padding: '8px 12px',
            borderRadius: '14px 14px 4px 14px',
            backgroundColor: '#2FAF8F',
            maxWidth: '75%',
          }}>
            <span style={{ fontFamily: bodyFont, fontSize: 11.5, color: '#fff', lineHeight: 1.55, transition: 'font-family 280ms ease' }}>
              ¿Cuál es el estatus del rancho?
            </span>
          </div>
        </div>

        {/* AI bubble */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <div style={{
            width: 22, height: 22, borderRadius: 7, flexShrink: 0,
            backgroundColor: accentBg,
            border: `1px solid rgba(47,175,143,.25)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Sparkles style={{ width: 10, height: 10, color: '#2FAF8F' }} strokeWidth={2} />
          </div>
          <div style={{
            padding: '8px 12px',
            borderRadius: '4px 14px 14px 14px',
            backgroundColor: msgBg,
            border: `1px solid ${bdr}`,
            maxWidth: '80%',
          }}>
            <span style={{ fontFamily: bodyFont, fontSize: 11.5, color: tx1, lineHeight: 1.6, transition: 'font-family 280ms ease, color 280ms ease' }}>
              El{' '}
              <strong style={{ color: '#2FAF8F', fontWeight: 600 }}>rancho Los Pinos</strong>
              {' '}cuenta con 142 cabezas activas. Certificación SENASICA vigente.
            </span>
          </div>
        </div>

        {/* Typing indicator */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{
            width: 22, height: 22, borderRadius: 7,
            backgroundColor: accentBg,
            border: `1px solid rgba(47,175,143,.25)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Sparkles style={{ width: 10, height: 10, color: '#2FAF8F' }} strokeWidth={2} />
          </div>
          <div style={{ display: 'flex', gap: 3, alignItems: 'center', padding: '0 4px' }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: 5, height: 5, borderRadius: '50%',
                backgroundColor: tx2,
                animation: `ob-dot 1.4s ease-in-out ${i * 0.2}s infinite`,
                opacity: .6,
              }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const navigate = useNavigate()
  const osTheme  = useOSTheme()

  const [prefs,   setPrefs]   = useState<Preferences>({ theme: osTheme, font: 'geist' })
  const [saving,  setSaving]  = useState(false)
  const [checked, setChecked] = useState(false)
  const [step,    setStep]    = useState<1 | 2>(1)

  useEffect(() => {
    getCurrentProfile().then(profile => {
      if (profile?.onboarding_completed === true) {
        // Si ya hizo onboarding pero no el tour, mandarlo al tour
        const prefs = (profile?.preferences as Record<string, unknown>) ?? {}
        navigate(prefs.tour_completed === true ? '/chat' : '/tour', { replace: true })
      } else {
        setChecked(true)
      }
    }).catch(() => setChecked(true))
  }, [navigate])

  useEffect(() => { applyPreferences(prefs) }, [prefs])

  const setTheme = useCallback((t: Theme) => setPrefs(p => ({ ...p, theme: t })), [])
  const setFont  = useCallback((f: Font)  => setPrefs(p => ({ ...p, font: f })),  [])

  const handleContinue = async () => {
    if (step === 1) { setStep(2); return }
    setSaving(true)
    try { await saveOnboardingPreferences(prefs) } catch { /* no-op */ }
    navigate('/tour', { replace: true })
  }

  const handleSkip = () => {
    applyPreferences({ theme: osTheme, font: 'geist' })
    navigate('/tour', { replace: true })
  }

  const isDark = prefs.theme === 'dark'
  const bg     = isDark ? '#0c0a09' : '#fafaf9'
  const bg3    = isDark ? '#1a1714' : '#ffffff'
  const bdr    = isDark ? 'rgba(68,64,60,0.5)'  : 'rgba(214,211,208,0.65)'
  const tx1    = isDark ? '#f5f5f4' : '#1c1917'
  const tx2    = isDark ? '#a8a29e' : '#78716c'
  const bodyFont = FONT_FAMILIES[prefs.font]

  if (!checked) return null

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital,wght@0,400;1,400&family=Geist:wght@300;400;500;600&family=Lora:ital,wght@0,400;0,500;1,400&display=swap');

        *, *::before, *::after { box-sizing: border-box; -webkit-font-smoothing: antialiased; }

        @keyframes ob-fade-up {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes ob-fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes ob-dot {
          0%, 80%, 100% { transform: scale(0.6); opacity: .3; }
          40%            { transform: scale(1);   opacity: .8; }
        }
        @keyframes ob-glow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(47,175,143,0.4); }
          60%       { box-shadow: 0 0 0 8px rgba(47,175,143,0); }
        }
        @keyframes ob-scan {
          0%   { background-position: 0% 0%; }
          100% { background-position: 0% 200%; }
        }

        .ob-page {
          animation: ob-fade-in 600ms ease both;
        }
        .ob-a1 { animation: ob-fade-up 700ms cubic-bezier(.16,1,.3,1) 40ms  both; }
        .ob-a2 { animation: ob-fade-up 700ms cubic-bezier(.16,1,.3,1) 100ms both; }
        .ob-a3 { animation: ob-fade-up 700ms cubic-bezier(.16,1,.3,1) 160ms both; }
        .ob-a4 { animation: ob-fade-up 700ms cubic-bezier(.16,1,.3,1) 220ms both; }
        .ob-a5 { animation: ob-fade-up 700ms cubic-bezier(.16,1,.3,1) 280ms both; }
        .ob-a6 { animation: ob-fade-up 700ms cubic-bezier(.16,1,.3,1) 340ms both; }
        .ob-a7 { animation: ob-fade-up 700ms cubic-bezier(.16,1,.3,1) 400ms both; }
        .ob-a8 { animation: ob-fade-up 700ms cubic-bezier(.16,1,.3,1) 460ms both; }

        .ob-opt {
          cursor: pointer;
          transition:
            border-color 180ms ease,
            box-shadow 180ms ease,
            background-color 180ms ease,
            transform 140ms cubic-bezier(.34,1.56,.64,1);
        }
        .ob-opt:hover { transform: translateY(-2px) scale(1.012); }
        .ob-opt:active { transform: scale(0.98); }

        .ob-btn-primary {
          cursor: pointer;
          transition: all 200ms cubic-bezier(.4,0,.2,1);
        }
        .ob-btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 16px 40px rgba(47,175,143,.36) !important;
          background-color: #27a07f !important;
        }
        .ob-btn-primary:active:not(:disabled) {
          transform: scale(0.98);
        }
        .ob-btn-ghost {
          cursor: pointer;
          transition: color 150ms ease, background-color 150ms ease;
        }

        .ob-step-enter {
          animation: ob-fade-up 500ms cubic-bezier(.16,1,.3,1) both;
        }
        .ob-step-exit {
          animation: ob-fade-in 200ms ease reverse both;
        }
      `}</style>

      {/* ── Ambient background ── */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        transition: 'all 500ms ease',
        background: isDark
          ? `
            radial-gradient(ellipse 80% 55% at 50% 105%, rgba(47,175,143,.12) 0%, transparent 65%),
            radial-gradient(ellipse 50% 40% at 5%  10%,  rgba(47,175,143,.05) 0%, transparent 60%),
            radial-gradient(ellipse 40% 35% at 95% 5%,   rgba(47,175,143,.03) 0%, transparent 55%)
          `
          : `
            radial-gradient(ellipse 80% 55% at 50% 105%, rgba(47,175,143,.10) 0%, transparent 65%),
            radial-gradient(ellipse 50% 40% at 5%  10%,  rgba(47,175,143,.04) 0%, transparent 60%)
          `,
      }} />

      <div
        className="ob-page"
        style={{
          fontFamily: bodyFont,
          backgroundColor: bg,
          color: tx1,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 24px',
          position: 'relative',
          zIndex: 1,
          transition: 'background-color 320ms ease, color 320ms ease, font-family 280ms ease',
        }}
      >
        <div style={{ width: '100%', maxWidth: 460 }}>

          {/* ── Progress ── */}
          <div className="ob-a1" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 48 }}>
            {[1, 2].map(s => (
              <div key={s} style={{
                height: 3,
                borderRadius: 999,
                width: step >= s ? 40 : 20,
                backgroundColor: step >= s ? '#2FAF8F' : bdr,
                opacity: step > s ? 0.5 : 1,
                transition: 'all 400ms cubic-bezier(.4,0,.2,1)',
              }} />
            ))}
          </div>

          {/* ── Logo ── */}
          <div className="ob-a2" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, marginBottom: 36 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 9,
              backgroundColor: 'rgba(47,175,143,.12)',
              border: '1px solid rgba(47,175,143,.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              animation: 'ob-glow 2.8s ease-in-out infinite',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2FAF8F" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <span style={{
              fontFamily: "'Geist', system-ui, sans-serif",
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: '0.02em',
              color: tx1,
            }}>GANDIA 7</span>
          </div>

          {/* ══ STEP 1: APPEARANCE ══ */}
          {step === 1 && (
            <div className="ob-step-enter">
              {/* Headline */}
              <div className="ob-a3" style={{ textAlign: 'center', marginBottom: 48 }}>
                <h1 style={{
                  fontFamily: "'Instrument Serif', Georgia, serif",
                  fontStyle: 'italic',
                  fontSize: 'clamp(2.6rem, 7vw, 3.6rem)',
                  lineHeight: 1.06,
                  color: tx1,
                  margin: '0 0 14px',
                  letterSpacing: '-0.01em',
                }}>
                  Elige tu<br />
                  <span style={{ color: '#2FAF8F' }}>apariencia.</span>
                </h1>
                <p style={{
                  fontFamily: bodyFont,
                  fontSize: 14,
                  lineHeight: 1.75,
                  color: tx2,
                  margin: '0 auto',
                  maxWidth: 320,
                }}>
                  Selecciona el tema que mejor se adapte a tu entorno de trabajo.
                </p>
              </div>

              {/* Theme selector — large visual cards */}
              <div className="ob-a4" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 40 }}>
                {(['dark', 'light'] as Theme[]).map(t => {
                  const active  = prefs.theme === t
                  const cardDark = t === 'dark'
                  return (
                    <button
                      key={t}
                      onClick={() => setTheme(t)}
                      className="ob-opt"
                      style={{
                        padding: 0,
                        borderRadius: 18,
                        border: `1.5px solid ${active ? '#2FAF8F' : bdr}`,
                        backgroundColor: 'transparent',
                        overflow: 'hidden',
                        boxShadow: active ? `0 0 0 1px #2FAF8F, 0 8px 32px rgba(47,175,143,.18)` : 'none',
                        position: 'relative',
                      }}
                    >
                      {/* Mini UI mockup */}
                      <div style={{
                        backgroundColor: cardDark ? '#0c0a09' : '#f8f7f5',
                        padding: '14px 14px 10px',
                        borderBottom: `1px solid ${cardDark ? 'rgba(68,64,60,.4)' : 'rgba(214,211,208,.5)'}`,
                      }}>
                        {/* Mini top bar */}
                        <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
                          {['#ff5f57','#febc2e','#28c840'].map(c => (
                            <div key={c} style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: c, opacity: .65 }} />
                          ))}
                        </div>
                        {/* Mini chat */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <div style={{
                              height: 7, width: '60%', borderRadius: 4,
                              backgroundColor: '#2FAF8F', opacity: .9,
                            }} />
                          </div>
                          <div style={{
                            height: 7, width: '80%', borderRadius: 4,
                            backgroundColor: cardDark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.08)',
                          }} />
                          <div style={{
                            height: 7, width: '55%', borderRadius: 4,
                            backgroundColor: cardDark ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.05)',
                          }} />
                        </div>
                      </div>

                      {/* Label */}
                      <div style={{
                        padding: '10px 14px 12px',
                        backgroundColor: cardDark ? '#141210' : '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}>
                        <div style={{ textAlign: 'left' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                            {t === 'dark'
                              ? <Moon  style={{ width: 11, height: 11, color: cardDark ? '#a8a29e' : '#78716c' }} strokeWidth={1.75} />
                              : <Sun   style={{ width: 11, height: 11, color: '#f59e0b' }} strokeWidth={1.75} />
                            }
                            <span style={{
                              fontFamily: "'Geist', system-ui, sans-serif",
                              fontSize: 11, fontWeight: 600,
                              color: cardDark ? '#f5f5f4' : '#1c1917',
                            }}>
                              {t === 'dark' ? 'Oscuro' : 'Claro'}
                            </span>
                          </div>
                          <span style={{
                            fontFamily: "'Geist', system-ui, sans-serif",
                            fontSize: 9.5, color: cardDark ? '#78716c' : '#a8a29e',
                          }}>
                            {t === 'dark' ? 'Fácil en los ojos' : 'Máxima claridad'}
                          </span>
                        </div>

                        {/* Check */}
                        <div style={{
                          width: 18, height: 18, borderRadius: '50%',
                          backgroundColor: active ? '#2FAF8F' : (cardDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.06)'),
                          border: `1.5px solid ${active ? '#2FAF8F' : (cardDark ? 'rgba(255,255,255,.12)' : 'rgba(0,0,0,.12)')}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all 220ms cubic-bezier(.34,1.56,.64,1)',
                          transform: active ? 'scale(1)' : 'scale(0.9)',
                        }}>
                          {active && <Check style={{ width: 9, height: 9, color: '#fff' }} strokeWidth={3} />}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* CTA */}
              <div className="ob-a5" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button
                  onClick={handleContinue}
                  className="ob-btn-primary"
                  style={{
                    width: '100%',
                    padding: '15px 28px',
                    borderRadius: 14,
                    border: 'none',
                    backgroundColor: '#2FAF8F',
                    color: '#fff',
                    fontFamily: bodyFont,
                    fontSize: 14,
                    fontWeight: 600,
                    letterSpacing: '-0.01em',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    boxShadow: '0 8px 24px rgba(47,175,143,.28)',
                  }}
                >
                  Siguiente: tipografía
                  <ArrowRight style={{ width: 14, height: 14 }} strokeWidth={2.5} />
                </button>
                <button
                  onClick={handleSkip}
                  className="ob-btn-ghost"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    fontFamily: bodyFont,
                    fontSize: 12.5,
                    color: tx2,
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = tx1)}
                  onMouseLeave={e => (e.currentTarget.style.color = tx2)}
                >
                  Saltar configuración
                </button>
              </div>
            </div>
          )}

          {/* ══ STEP 2: TYPOGRAPHY ══ */}
          {step === 2 && (
            <div className="ob-step-enter">
              {/* Headline */}
              <div className="ob-a3" style={{ textAlign: 'center', marginBottom: 40 }}>
                <h1 style={{
                  fontFamily: "'Instrument Serif', Georgia, serif",
                  fontStyle: 'italic',
                  fontSize: 'clamp(2.6rem, 7vw, 3.6rem)',
                  lineHeight: 1.06,
                  color: tx1,
                  margin: '0 0 14px',
                  letterSpacing: '-0.01em',
                }}>
                  Elige tu<br />
                  <span style={{ color: '#2FAF8F' }}>tipografía.</span>
                </h1>
                <p style={{
                  fontFamily: bodyFont,
                  fontSize: 14,
                  lineHeight: 1.75,
                  color: tx2,
                  margin: '0 auto',
                  maxWidth: 320,
                  transition: 'font-family 280ms ease',
                }}>
                  Así se verá el texto en todos los módulos del sistema.
                </p>
              </div>

              {/* Font selector */}
              <div className="ob-a4" style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                {FONTS.map(f => {
                  const active = prefs.font === f.id
                  return (
                    <button
                      key={f.id}
                      onClick={() => setFont(f.id)}
                      className="ob-opt"
                      style={{
                        padding: '16px 18px',
                        borderRadius: 16,
                        border: `1.5px solid ${active ? '#2FAF8F' : bdr}`,
                        backgroundColor: active
                          ? (isDark ? 'rgba(47,175,143,.07)' : 'rgba(47,175,143,.05)')
                          : bg3,
                        boxShadow: active ? `0 0 0 1px #2FAF8F, 0 6px 24px rgba(47,175,143,.14)` : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 16,
                        textAlign: 'left',
                        position: 'relative',
                      }}
                    >
                      {/* Sample letter */}
                      <div style={{
                        width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                        backgroundColor: isDark ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.03)',
                        border: `1px solid ${bdr}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <span style={{
                          ...FONT_SAMPLE_STYLE[f.id],
                          fontSize: 26,
                          color: active ? '#2FAF8F' : tx1,
                          transition: 'color 200ms ease',
                          lineHeight: 1,
                        }}>
                          {f.sample}
                        </span>
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 3 }}>
                          <span style={{
                            ...FONT_SAMPLE_STYLE[f.id],
                            fontSize: 15,
                            color: tx1,
                            fontWeight: 600,
                            transition: 'font-family 280ms ease',
                          }}>
                            {f.label}
                          </span>
                          <span style={{
                            fontFamily: "'Geist', system-ui, sans-serif",
                            fontSize: 10,
                            fontWeight: 700,
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            color: active ? '#2FAF8F' : tx2,
                            transition: 'color 180ms ease',
                          }}>
                            {f.tagline}
                          </span>
                        </div>
                        <p style={{
                          fontFamily: f.family,
                          fontSize: 12.5,
                          color: tx2,
                          margin: 0,
                          lineHeight: 1.5,
                          fontStyle: f.id === 'serif' ? 'italic' : 'normal',
                        }}>
                          {f.body}
                        </p>
                      </div>

                      {/* Radio */}
                      <div style={{
                        width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                        border: `2px solid ${active ? '#2FAF8F' : bdr}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 200ms cubic-bezier(.34,1.56,.64,1)',
                        backgroundColor: active ? '#2FAF8F' : 'transparent',
                      }}>
                        {active && (
                          <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#fff' }} />
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Live preview */}
              <div className="ob-a5" style={{ marginBottom: 28 }}>
                <PreviewCard
                  prefs={prefs}
                  isDark={isDark}
                  tx1={tx1}
                  tx2={tx2}
                  bdr={bdr}
                  bg3={bg3}
                />
              </div>

              {/* CTA */}
              <div className="ob-a6" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button
                  onClick={handleContinue}
                  disabled={saving}
                  className="ob-btn-primary"
                  style={{
                    width: '100%',
                    padding: '15px 28px',
                    borderRadius: 14,
                    border: 'none',
                    backgroundColor: '#2FAF8F',
                    color: '#fff',
                    fontFamily: bodyFont,
                    fontSize: 14,
                    fontWeight: 600,
                    letterSpacing: '-0.01em',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    boxShadow: '0 8px 24px rgba(47,175,143,.28)',
                    opacity: saving ? 0.7 : 1,
                    cursor: saving ? 'not-allowed' : 'pointer',
                    transition: 'all 200ms cubic-bezier(.4,0,.2,1)',
                  }}
                >
                  {saving ? (
                    <>
                      <span style={{ opacity: .8 }}>Guardando</span>
                      <div style={{
                        width: 14, height: 14, borderRadius: '50%',
                        border: '2px solid rgba(255,255,255,.3)',
                        borderTopColor: '#fff',
                        animation: 'spin 0.8s linear infinite',
                      }} />
                    </>
                  ) : (
                    <>
                      Entrar al sistema
                      <ArrowRight style={{ width: 14, height: 14 }} strokeWidth={2.5} />
                    </>
                  )}
                </button>

                <button
                  onClick={() => setStep(1)}
                  className="ob-btn-ghost"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    fontFamily: bodyFont,
                    fontSize: 12.5,
                    color: tx2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 5,
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = tx1)}
                  onMouseLeave={e => (e.currentTarget.style.color = tx2)}
                >
                  ← Volver a apariencia
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  )
}