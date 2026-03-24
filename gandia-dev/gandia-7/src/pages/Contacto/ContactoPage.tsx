import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Footer from '../../components/ui/Footer'
import Header from '../../components/ui/Header'
import { Shield, Mail, Building2, FileText, Headphones, Clock, Check, Copy, Scale, Newspaper, ChevronDown } from 'lucide-react'

// ─── HOOKS ────────────────────────────────────────────────────────────────────

function useTheme() {
  const [isDark, setIsDark] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)').matches : false
  )
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const fn = (e: MediaQueryListEvent) => setIsDark(e.matches)
    mq.addEventListener('change', fn)
    return () => mq.removeEventListener('change', fn)
  }, [])
  return isDark
}

function useInView(threshold = 0.07) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true) }, { threshold })
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, inView }
}

function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, inView } = useInView()
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

// ─── DATA ─────────────────────────────────────────────────────────────────────

const CANALES = [
  {
    id: 'soporte',
    icon: Headphones,
    titulo: 'Soporte Técnico',
    subtitulo: 'Incidencias y asistencia operativa',
    email: 'soporte@gandia7.com',
    color: '#2FAF8F',
    badge: 'Respuesta prioritaria',
    tiempoRespuesta: '24–48 hrs hábiles',
    horario: 'Lun – Vie · 9:00 – 18:00 (GMT-6)',
    usos: [
      'Incidencias técnicas y errores del sistema',
      'Problemas de acceso o autenticación',
      'Asistencia en el uso de funcionalidades',
      'Reportes de comportamiento inesperado',
      'Consultas sobre integraciones',
    ],
  },
  {
    id: 'vinculacion',
    icon: Building2,
    titulo: 'Vinculación Institucional',
    subtitulo: 'Alianzas y convenios del sector',
    email: 'vinculacion@gandia7.com',
    color: '#007AFF',
    badge: '3–5 días hábiles',
    tiempoRespuesta: '3–5 días hábiles',
    horario: 'Lun – Vie · 9:00 – 18:00 (GMT-6)',
    usos: [
      'Uniones ganaderas y asociaciones del sector',
      'Instituciones académicas y de investigación',
      'Organismos públicos y gubernamentales',
      'Propuestas de colaboración estratégica',
      'Integración tecnológica regional',
    ],
  },
  {
    id: 'autoridades',
    icon: FileText,
    titulo: 'Coordinación con Autoridades',
    subtitulo: 'Canal regulatorio y sanitario',
    email: 'autoridades@gandia7.com',
    color: '#FF3B30',
    badge: 'Canal exclusivo',
    tiempoRespuesta: '24–72 hrs hábiles',
    horario: 'Lun – Vie · 9:00 – 18:00 (GMT-6)',
    usos: [
      'Consultas regulatorias y de cumplimiento',
      'Validaciones de certificaciones oficiales',
      'Integraciones con sistemas de autoridad',
      'Solicitudes de información institucional',
      'Auditorías y verificaciones de campo',
    ],
  },
  {
    id: 'general',
    icon: Mail,
    titulo: 'Información General',
    subtitulo: 'Consultas comerciales e información',
    email: 'contacto@gandia7.com',
    color: '#AF52DE',
    badge: '48–72 hrs hábiles',
    tiempoRespuesta: '48–72 hrs hábiles',
    horario: 'Lun – Vie · 9:00 – 18:00 (GMT-6)',
    usos: [
      'Información sobre productos y servicios',
      'Consultas comerciales y tarifas',
      'Orientación inicial del sistema',
      'Solicitudes de demostraciones',
      'Comunicación corporativa general',
    ],
  },
]

const CANALES_ESP = [
  { icon: Scale,     titulo: 'Legal y Contratos',  email: 'legal@gandia7.com',      desc: 'Asuntos legales, contratos y derechos ARCO' },
  { icon: Shield,    titulo: 'Privacidad',          email: 'privacidad@gandia7.com', desc: 'Ejercicio de derechos ARCO · LFPDPPP' },
  { icon: Newspaper, titulo: 'Prensa y Medios',     email: 'prensa@gandia7.com',     desc: 'Comunicados, entrevistas, material gráfico' },
]

// ─── MAIN ─────────────────────────────────────────────────────────────────────

export default function ContactoPage() {
  const isDark   = useTheme()
  const navigate = useNavigate()
  const [copiedId,  setCopiedId]  = useState<string | null>(null)
  const [openCard,  setOpenCard]  = useState<string | null>('soporte')

  const bg  = isDark ? '#0c0a09' : '#fafaf9'
  const bg2 = isDark ? '#141210' : '#f4f2f0'
  const bg3 = isDark ? '#1c1917' : '#ffffff'
  const bdr = isDark ? 'rgba(68,64,60,0.5)'  : 'rgba(214,211,208,0.7)'
  const tx1 = isDark ? '#fafafa'  : '#171717'
  const tx2 = isDark ? '#a8a29e'  : '#78716c'

  const copy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      // Clipboard puede fallar por permisos del navegador o falta de soporte.
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital,wght@0,400;1,400&family=Geist:wght@300;400;500;600&display=swap');

        .co * { -webkit-font-smoothing: antialiased; box-sizing: border-box; }
        .co   { font-family: 'Geist', system-ui, sans-serif; }
        .s    { font-family: 'Instrument Serif', Georgia, serif; }

        .co *:focus { outline: none !important; }
        .co *:focus-visible { outline: 2px solid #2FAF8F !important; outline-offset: 3px; border-radius: 6px; }

        .co ::-webkit-scrollbar       { width: 3px; }
        .co ::-webkit-scrollbar-track { background: transparent; }
        .co ::-webkit-scrollbar-thumb { background: ${isDark ? '#44403c' : '#e7e5e4'}; border-radius: 999px; }

        .noise::after {
          content: ''; position: absolute; inset: 0; z-index: 1; pointer-events: none;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");
          mix-blend-mode: overlay;
        }

        @keyframes hi { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        .h1 { animation: hi 820ms cubic-bezier(.16,1,.3,1) 60ms  both; }
        .h2 { animation: hi 820ms cubic-bezier(.16,1,.3,1) 180ms both; }
        .h3 { animation: hi 820ms cubic-bezier(.16,1,.3,1) 300ms both; }
        .h4 { animation: hi 820ms cubic-bezier(.16,1,.3,1) 420ms both; }

        @keyframes pd { 0%,100%{box-shadow:0 0 0 0 rgba(47,175,143,.45)} 60%{box-shadow:0 0 0 6px rgba(47,175,143,0)} }
        .pulse { animation: pd 2.4s ease-in-out infinite; }

        @keyframes sh { 0%{background-position:-300% center} 100%{background-position:300% center} }
        .shimmer {
          background: linear-gradient(90deg, #2FAF8F 0%, #7ee8c8 30%, #2FAF8F 55%, #1d9070 100%);
          background-size: 300% auto;
          -webkit-background-clip: text; background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: sh 5s linear infinite;
        }

        @keyframes mq { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        .mq { animation: mq 30s linear infinite; width: max-content; }
        .mq:hover { animation-play-state: paused; }

        .acc { transition: max-height 380ms cubic-bezier(.4,0,.2,1), opacity 280ms ease; }

        .canal-card { transition: border-color 200ms ease, box-shadow 200ms ease; }
        .canal-card:hover { box-shadow: 0 0 0 1px ${isDark ? 'rgba(68,64,60,0.9)' : 'rgba(180,175,170,0.9)'}; }

        @keyframes ca1 { 0%,100%{transform:scale(1);opacity:.07} 50%{transform:scale(1.1);opacity:.13} }
        @keyframes ca2 { 0%,100%{transform:scale(1.05);opacity:.05} 50%{transform:scale(0.95);opacity:.1} }
        .ca1 { animation: ca1 9s ease-in-out infinite; }
        .ca2 { animation: ca2 12s ease-in-out 2s infinite; }

        .email-btn { transition: background-color 140ms ease, color 140ms ease; }
        .email-btn:hover { background-color: ${isDark ? 'rgba(47,175,143,.12)' : 'rgba(47,175,143,.08)'}; }
      `}</style>

      <div className="co min-h-screen" style={{ backgroundColor: bg, color: tx1 }}>
        <Header currentSection="contacto" isDark={isDark} />

        {/* ══════════════════════════════════════════════════════
            HERO
        ══════════════════════════════════════════════════════ */}
        <section className="noise relative overflow-hidden" style={{ borderBottom: `1px solid ${bdr}` }}>
          <div className="absolute inset-0 pointer-events-none" style={{
            backgroundImage: `
              radial-gradient(ellipse 80% 60% at 50% 100%, ${isDark ? 'rgba(47,175,143,0.08)' : 'rgba(47,175,143,0.10)'} 0%, transparent 70%),
              radial-gradient(ellipse 40% 40% at 15% 20%, ${isDark ? 'rgba(47,175,143,0.04)' : 'rgba(47,175,143,0.05)'} 0%, transparent 55%),
              radial-gradient(ellipse 35% 35% at 85% 10%, ${isDark ? 'rgba(47,175,143,0.03)' : 'rgba(47,175,143,0.04)'} 0%, transparent 50%)
            `
          }} />

          <div style={{ maxWidth: 1152, margin: '0 auto', padding: '60px 32px 68px', position: 'relative', zIndex: 2, textAlign: 'center' }}>

            <div className="h1 flex items-center justify-center gap-2.5" style={{ marginBottom: 32 }}>
              <span className="pulse" style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#2FAF8F', flexShrink: 0 }} />
              <span style={{ width: 20, height: 1, backgroundColor: 'rgba(47,175,143,.5)', flexShrink: 0 }} />
              <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: tx2 }}>
                Contacto Institucional · GANDIA 7
              </span>
              <span style={{ width: 20, height: 1, backgroundColor: 'rgba(47,175,143,.5)', flexShrink: 0 }} />
            </div>

            <h1 className="h2 s" style={{ fontSize: 'clamp(3rem, 8vw, 5.8rem)', lineHeight: 1.05, fontStyle: 'italic', letterSpacing: '-0.01em', marginBottom: 16 }}>
              Canales directos.<br />Respuesta garantizada.
            </h1>

            <p className="h3" style={{ fontSize: 15, lineHeight: 1.82, color: tx2, maxWidth: 520, margin: '0 auto 48px' }}>
              Cada canal existe por un motivo específico. Sin formularios intermedios, sin bots. Comunicación institucional directa con el equipo que puede ayudarte.
            </p>

            {/* Stats */}
            <div className="h4 flex flex-wrap items-center justify-center gap-6">
              {[
                { val: '4', label: 'Canales especializados' },
                { val: '24h', label: 'Tiempo máximo soporte' },
                { val: '100%', label: 'Comunicación certificada' },
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-3" style={{
                  padding: '10px 20px', borderRadius: 12,
                  border: `1px solid ${bdr}`,
                  backgroundColor: isDark ? 'rgba(28,25,23,.6)' : 'rgba(255,255,255,.8)',
                  backdropFilter: 'blur(6px)',
                }}>
                  <span className="s shimmer" style={{ fontSize: 22, fontStyle: 'italic', lineHeight: 1 }}>{s.val}</span>
                  <span style={{ fontSize: 12, color: tx2, fontWeight: 500 }}>{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Marquee ───────────────────────────────────────── */}
        <section style={{ padding: '22px 0', borderBottom: `1px solid ${bdr}`, overflow: 'hidden', position: 'relative' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 72, zIndex: 1, pointerEvents: 'none', background: `linear-gradient(to right, ${bg}, transparent)` }} />
          <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 72, zIndex: 1, pointerEvents: 'none', background: `linear-gradient(to left, ${bg}, transparent)` }} />
          <div className="mq flex items-center" style={{ gap: 20 }}>
            {[...['soporte@gandia7.com','vinculacion@gandia7.com','autoridades@gandia7.com','contacto@gandia7.com','legal@gandia7.com','privacidad@gandia7.com','prensa@gandia7.com',
                  'soporte@gandia7.com','vinculacion@gandia7.com','autoridades@gandia7.com','contacto@gandia7.com','legal@gandia7.com','privacidad@gandia7.com','prensa@gandia7.com']].map((o, i) => (
              <div key={i} className="flex items-center gap-2" style={{
                padding: '4px 12px', borderRadius: 8, flexShrink: 0,
                border: `1px solid ${bdr}`,
                backgroundColor: isDark ? 'rgba(28,25,23,.4)' : 'rgba(255,255,255,.6)',
              }}>
                <span style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: '#2FAF8F', opacity: .7 }} />
                <span style={{ fontSize: 11, fontWeight: 500, color: tx2, whiteSpace: 'nowrap', fontFamily: 'monospace' }}>{o}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════
            CANALES PRINCIPALES — accordion style
        ══════════════════════════════════════════════════════ */}
        <section style={{ maxWidth: 1152, margin: '0 auto', padding: '72px 32px 0' }}>
          <Reveal>
            <div className="flex items-center gap-2.5" style={{ marginBottom: 10 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: '#2FAF8F' }} />
              <span style={{ width: 16, height: 1, backgroundColor: 'rgba(47,175,143,.5)' }} />
              <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.13em', textTransform: 'uppercase', color: tx2 }}>Canales principales</span>
            </div>
            <h2 className="s" style={{ fontSize: 'clamp(1.9rem, 5vw, 3.2rem)', fontStyle: 'italic', lineHeight: 1.12, marginBottom: 40, color: tx1 }}>
              Elige el canal correcto.<br /><span style={{ color: tx2 }}>Obtén respuesta precisa.</span>
            </h2>
          </Reveal>

          <Reveal delay={80}>
            <div style={{ borderRadius: 20, border: `1px solid ${bdr}`, backgroundColor: bg2, overflow: 'hidden' }}>
              {CANALES.map((canal, idx) => {
                const open = openCard === canal.id
                const Icon = canal.icon
                return (
                  <div key={canal.id} style={{ borderBottom: idx < CANALES.length - 1 ? `1px solid ${bdr}` : 'none' }}>

                    {/* ── Canal header / trigger ── */}
                    <button
                      onClick={() => setOpenCard(open ? null : canal.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 20,
                        width: '100%', padding: '24px 32px', background: 'none',
                        border: 'none', cursor: 'pointer', color: 'inherit', textAlign: 'left',
                        transition: 'background-color 150ms ease',
                        backgroundColor: open ? (isDark ? 'rgba(28,25,23,.5)' : 'rgba(245,242,240,.6)') : 'transparent',
                      }}
                    >
                      {/* Icon */}
                      <div style={{
                        width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                        backgroundColor: `${canal.color}18`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'background-color 200ms ease',
                      }}>
                        <Icon style={{ width: 19, height: 19, color: canal.color }} strokeWidth={1.75} />
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="flex items-center gap-3" style={{ marginBottom: 3 }}>
                          <span style={{ fontSize: 15, fontWeight: 600, color: tx1 }}>{canal.titulo}</span>
                          <span style={{
                            fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
                            backgroundColor: `${canal.color}18`, color: canal.color,
                            letterSpacing: '0.05em',
                          }}>{canal.badge}</span>
                        </div>
                        <span style={{ fontSize: 12.5, color: tx2 }}>{canal.subtitulo}</span>
                      </div>

                      {/* Email pill — visible en escritorio */}
                      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <code style={{
                          fontSize: 12, padding: '5px 12px', borderRadius: 8,
                          border: `1px solid ${bdr}`,
                          backgroundColor: isDark ? 'rgba(28,25,23,.6)' : 'rgba(255,255,255,.8)',
                          color: tx2, fontFamily: 'monospace',
                        }}>{canal.email}</code>

                        {/* Chevron */}
                        <span style={{
                          width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          border: `1px solid ${open ? `${canal.color}50` : bdr}`,
                          backgroundColor: open ? `${canal.color}12` : 'transparent',
                          transition: 'all 280ms ease',
                        }}>
                          <ChevronDown style={{
                            width: 13, height: 13,
                            color: open ? canal.color : tx2,
                            transform: open ? 'rotate(180deg)' : 'none',
                            transition: 'transform 300ms cubic-bezier(.4,0,.2,1)',
                          }} strokeWidth={2} />
                        </span>
                      </div>
                    </button>

                    {/* ── Canal body ── */}
                    <div className="acc overflow-hidden" style={{ maxHeight: open ? 600 : 0, opacity: open ? 1 : 0 }}>
                      <div style={{ padding: '20px 32px 32px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

                          {/* Casos de uso */}
                          <div style={{ padding: '22px 24px', borderRadius: 14, border: `1px solid ${bdr}`, backgroundColor: bg3 }}>
                            <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.11em', color: tx2, marginBottom: 16 }}>Casos de uso</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                              {canal.usos.map((uso, i) => (
                                <div key={i} className="flex items-start gap-3">
                                  <div style={{ width: 17, height: 17, borderRadius: 5, backgroundColor: `${canal.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                                    <Check style={{ width: 9, height: 9, color: canal.color }} strokeWidth={2.5} />
                                  </div>
                                  <span style={{ fontSize: 12.5, lineHeight: 1.55, color: isDark ? '#d6d3d1' : '#57534e' }}>{uso}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Info operativa + acciones */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

                            {/* Tiempo / horario */}
                            <div style={{ padding: '20px 22px', borderRadius: 14, border: `1px solid ${bdr}`, backgroundColor: bg3 }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                <div className="flex items-center gap-3">
                                  <div style={{ width: 32, height: 32, borderRadius: 9, backgroundColor: isDark ? 'rgba(44,40,36,.8)' : 'rgba(245,242,240,.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <Clock style={{ width: 14, height: 14, color: tx2 }} strokeWidth={1.75} />
                                  </div>
                                  <div>
                                    <p style={{ fontSize: 10.5, fontWeight: 700, color: tx2, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>Horario</p>
                                    <p style={{ fontSize: 12.5, color: tx1, fontWeight: 500 }}>{canal.horario}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <div style={{ width: 32, height: 32, borderRadius: 9, backgroundColor: `${canal.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <svg style={{ width: 14, height: 14, color: canal.color }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                  </div>
                                  <div>
                                    <p style={{ fontSize: 10.5, fontWeight: 700, color: tx2, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>Tiempo de respuesta</p>
                                    <p style={{ fontSize: 12.5, fontWeight: 600, color: canal.color }}>{canal.tiempoRespuesta}</p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Acciones */}
                            <div style={{ padding: '20px 22px', borderRadius: 14, border: `1px solid ${bdr}`, backgroundColor: bg3 }}>
                              <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.11em', color: tx2, marginBottom: 14 }}>Contactar</p>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <a
                                  href={`mailto:${canal.email}`}
                                  className="email-btn flex items-center gap-3"
                                  style={{
                                    padding: '11px 14px', borderRadius: 10,
                                    border: `1px solid ${canal.color}35`,
                                    backgroundColor: `${canal.color}08`,
                                    color: canal.color, textDecoration: 'none',
                                    fontSize: 13, fontWeight: 600,
                                  }}
                                >
                                  <Mail style={{ width: 14, height: 14, flexShrink: 0 }} strokeWidth={2} />
                                  Abrir en correo
                                </a>
                                <button
                                  onClick={() => copy(canal.email, canal.id)}
                                  style={{
                                    display: 'flex', alignItems: 'center', gap: 3,
                                    padding: '11px 14px', borderRadius: 10,
                                    border: `1px solid ${bdr}`,
                                    backgroundColor: copiedId === canal.id ? 'rgba(47,175,143,.1)' : 'transparent',
                                    color: copiedId === canal.id ? '#2FAF8F' : tx2,
                                    fontSize: 13, fontWeight: 500, cursor: 'pointer',
                                    transition: 'all 180ms ease',
                                  }}
                                >
                                  {copiedId === canal.id
                                    ? <><Check style={{ width: 14, height: 14 }} strokeWidth={2.5} /> Copiado</>
                                    : <><Copy style={{ width: 14, height: 14 }} strokeWidth={1.75} /> Copiar email</>
                                  }
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </Reveal>
        </section>

        {/* ══════════════════════════════════════════════════════
            CANALES ESPECIALIZADOS
        ══════════════════════════════════════════════════════ */}
        <section style={{ maxWidth: 1152, margin: '0 auto', padding: '72px 32px 0' }}>
          <Reveal>
            <div className="flex items-center gap-2.5" style={{ marginBottom: 10 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: '#2FAF8F' }} />
              <span style={{ width: 16, height: 1, backgroundColor: 'rgba(47,175,143,.5)' }} />
              <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.13em', textTransform: 'uppercase', color: tx2 }}>Canales especializados</span>
            </div>
            <h2 className="s" style={{ fontSize: 'clamp(1.9rem, 5vw, 3.2rem)', fontStyle: 'italic', lineHeight: 1.12, marginBottom: 32, color: tx1 }}>
              Comunicación específica.<br /><span style={{ color: tx2 }}>Para cada necesidad.</span>
            </h2>
          </Reveal>

          <Reveal delay={80}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {CANALES_ESP.map((c, i) => {
                const Icon = c.icon
                return (
                  <div key={i} className="canal-card" style={{
                    padding: '28px', borderRadius: 16,
                    border: `1px solid ${bdr}`, backgroundColor: bg2,
                    cursor: 'pointer',
                  }}
                    onClick={() => window.location.href = `mailto:${c.email}`}
                  >
                    <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: 'rgba(47,175,143,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                      <Icon style={{ width: 17, height: 17, color: '#2FAF8F' }} strokeWidth={1.75} />
                    </div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: tx1, marginBottom: 6 }}>{c.titulo}</p>
                    <code style={{ fontSize: 11.5, color: '#2FAF8F', fontFamily: 'monospace', display: 'block', marginBottom: 10 }}>{c.email}</code>
                    <p style={{ fontSize: 12, lineHeight: 1.6, color: tx2 }}>{c.desc}</p>
                  </div>
                )
              })}
            </div>
          </Reveal>
        </section>

        {/* ══════════════════════════════════════════════════════
            DOMICILIO — editorial masthead
        ══════════════════════════════════════════════════════ */}
        <section style={{ borderTop: `1px solid ${bdr}`, marginTop: 72 }}>
          <div style={{ maxWidth: 1152, margin: '0 auto', padding: '64px 32px' }}>
            <Reveal>
              <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '0 80px', alignItems: 'start' }}>

                {/* Left — label fijo */}
                <div style={{ paddingTop: 4 }}>
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: tx2, margin: 0 }}>
                    Domicilio<br />Administrativo
                  </p>
                </div>

                {/* Right — información en línea */}
                <div>
                  <p className="s" style={{ fontSize: 'clamp(1.4rem, 2.8vw, 2rem)', fontStyle: 'italic', lineHeight: 1.5, color: tx1, margin: '0 0 28px' }}>
                    Carretera Durango – Mezquital, Km. 4.5,<br />
                    C.P. 34308 · Durango, Durango · México
                  </p>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0', borderTop: `1px solid ${bdr}` }}>
                    {[
                      { label: 'Horario', value: 'Lun – Vie · 9:00 – 18:00 (GMT-6)' },
                      { label: 'Teléfono', value: 'No disponible' },
                      { label: 'RFC', value: 'No disponible', mono: true },
                    ].map((item, i, arr) => (
                      <div key={i} style={{
                        padding: '18px 0',
                        paddingRight: i < arr.length - 1 ? 48 : 0,
                        marginRight: i < arr.length - 1 ? 48 : 0,
                        borderRight: i < arr.length - 1 ? `1px solid ${bdr}` : 'none',
                        display: 'flex', flexDirection: 'column', gap: 4,
                      }}>
                        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: tx2 }}>{item.label}</span>
                        <span style={{ fontSize: 13.5, color: tx1, fontFamily: item.mono ? 'monospace' : 'inherit' }}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </Reveal>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════
            COMPROMISO — editorial statement
        ══════════════════════════════════════════════════════ */}
        <section style={{ borderTop: `1px solid ${bdr}` }}>
          <div style={{ maxWidth: 1152, margin: '0 auto', padding: '64px 32px' }}>
            <Reveal>
              <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '0 80px', alignItems: 'start' }}>

                {/* Left — label */}
                <div style={{ paddingTop: 4 }}>
                  <div className="flex items-center gap-2" style={{ marginBottom: 6 }}>
                    <Shield style={{ width: 11, height: 11, color: '#2FAF8F' }} strokeWidth={2} />
                    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#2FAF8F' }}>Garantía</span>
                  </div>
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: tx2, margin: 0 }}>
                    Compromiso<br />Institucional
                  </p>
                </div>

                {/* Right — statement */}
                <div>
                  <p className="s" style={{ fontSize: 'clamp(1.4rem, 2.8vw, 2rem)', fontStyle: 'italic', lineHeight: 1.55, color: tx1, margin: '0 0 32px', maxWidth: 680 }}>
                    Operamos bajo principios de transparencia, trazabilidad y responsabilidad. Toda comunicación oficial se atiende exclusivamente por canales certificados.
                  </p>

                  <div style={{ borderTop: `1px solid ${bdr}`, paddingTop: 24, display: 'flex', flexDirection: 'column', gap: 11 }}>
                    {[
                      'Correos corporativos terminan en @gandia7.com',
                      'Registros auditables de toda comunicación oficial',
                      'Tiempos de respuesta garantizados por canal',
                      'Sin intermediarios · Sin formularios anónimos',
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <span style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: '#2FAF8F', flexShrink: 0 }} />
                        <span style={{ fontSize: 13, color: tx2, lineHeight: 1.5 }}>{item}</span>
                      </div>
                    ))}
                  </div>

                  <p style={{ marginTop: 28, fontSize: 12.5, lineHeight: 1.72, color: tx2, borderTop: `1px solid ${bdr}`, paddingTop: 20, maxWidth: 560 }}>
                    GANDIA 7 nunca solicita datos sensibles por canales externos ni redes sociales. Ante cualquier duda, escribe a{' '}
                    <code style={{ fontFamily: 'monospace', fontWeight: 600, color: isDark ? '#6ee7b7' : '#065f46' }}>soporte@gandia7.com</code>.
                  </p>
                </div>

              </div>
            </Reveal>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════
            CTA FINAL
        ══════════════════════════════════════════════════════ */}
        <section style={{ borderTop: `1px solid ${bdr}` }}>
          <div style={{ maxWidth: 1152, margin: '0 auto', padding: '80px 32px 100px' }}>
            <Reveal>
              <div style={{ borderRadius: 24, border: `1px solid ${bdr}`, backgroundColor: bg2, overflow: 'hidden', position: 'relative' }}>
                <div className="ca1 absolute" style={{ width: 380, height: 380, borderRadius: '50%', backgroundColor: '#2FAF8F', filter: 'blur(72px)', top: -120, right: -80, zIndex: 0, pointerEvents: 'none' }} />
                <div className="ca2 absolute" style={{ width: 260, height: 260, borderRadius: '50%', backgroundColor: '#2FAF8F', filter: 'blur(56px)', bottom: -100, left: -40, zIndex: 0, pointerEvents: 'none' }} />

                <div style={{ position: 'relative', zIndex: 1, padding: '60px 48px', textAlign: 'center' }}>
                  <div style={{ width: 50, height: 50, borderRadius: 13, margin: '0 auto 26px', backgroundColor: 'rgba(47,175,143,.14)', border: '1px solid rgba(47,175,143,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg style={{ width: 22, height: 22, color: '#2FAF8F' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                      <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
                    </svg>
                  </div>
                  <h2 className="s" style={{ fontSize: 'clamp(2rem, 6vw, 3.8rem)', fontStyle: 'italic', lineHeight: 1.1, marginBottom: 14, color: tx1 }}>
                    ¿Listo para comenzar<br />con GANDIA 7?
                  </h2>
                  <p style={{ fontSize: 14.5, lineHeight: 1.78, maxWidth: 400, margin: '0 auto 38px', color: tx2 }}>
                    Tier gratuito hasta 20 animales.<br />Sin tarjeta de crédito. Activación en 24 horas.
                  </p>
                  <div className="flex flex-col sm:flex-row justify-center gap-3" style={{ marginBottom: 32 }}>
                    <button onClick={() => navigate('/signup')} style={{
                      padding: '13px 30px', borderRadius: 12, border: 'none', cursor: 'pointer',
                      backgroundColor: '#2FAF8F', color: '#fff', fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em',
                      boxShadow: '0 8px 24px rgba(47,175,143,.32)',
                      transition: 'all 180ms ease',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    }}
                      onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#27a07f'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 14px 32px rgba(47,175,143,.42)' }}
                      onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#2FAF8F'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(47,175,143,.32)' }}
                    >
                      Solicitar acceso
                      <svg style={{ width: 13, height: 13 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                    </button>
                    <button onClick={() => navigate('/modelo-operativo')} style={{
                      padding: '13px 30px', borderRadius: 12, cursor: 'pointer',
                      border: `1px solid ${bdr}`,
                      backgroundColor: isDark ? 'rgba(28,25,23,.6)' : 'rgba(255,255,255,.7)',
                      color: tx2, fontSize: 14, fontWeight: 500, transition: 'all 180ms ease',
                    }}
                      onMouseEnter={e => { e.currentTarget.style.color = tx1; e.currentTarget.style.borderColor = isDark ? '#78716c' : '#a8a29e' }}
                      onMouseLeave={e => { e.currentTarget.style.color = tx2; e.currentTarget.style.borderColor = bdr }}
                    >
                      Ver modelo operativo
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-6" style={{ fontSize: 12, color: tx2 }}>
                    {['Sin permanencia mínima', 'Activación en 24 horas', 'Soporte prioritario incluido'].map(t => (
                      <div key={t} className="flex items-center gap-1.5">
                        <Check style={{ width: 11, height: 11, color: '#2FAF8F' }} strokeWidth={2.5} />
                        {t}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        <Footer />
      </div>
    </>
  )
}