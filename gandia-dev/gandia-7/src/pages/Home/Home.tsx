import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileCheck, Database, Eye, CheckCircle, Users, ChevronDown, Cookie,
  Brain, Link2, WifiOff, Camera, LockOpen, Building2, Leaf,
  ClipboardList, BadgeCheck,
} from 'lucide-react'
import Footer from '../../components/ui/Footer'
import Header from '../../components/ui/Header'

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const MODULE_CARDS = [
  {
    icon: Users,
    title: 'Rancho',
    description: 'Gestión de instalaciones, infraestructura de monitoreo y responsables operativos del ecosistema ganadero.',
    features: ['Registro oficial', 'Geolocalización', 'Infraestructura'],
    num: '01',
  },
  {
    icon: FileCheck,
    title: 'Pasaporte',
    description: 'Documento digital oficial con identificación biométrica, historial sanitario y certificaciones veterinarias.',
    features: ['Identificación RFID', 'Historial médico', 'Documentos legales'],
    num: '02',
  },
  {
    icon: Database,
    title: 'Gemelo Digital',
    description: 'Réplica virtual con registro cronológico completo de eventos, tratamientos y evidencias multimedia.',
    features: ['Timeline continuo', 'Evidencias', 'Sincronización'],
    num: '03',
  },
  {
    icon: Eye,
    title: 'Monitoreo',
    description: 'Supervisión visual mediante cámaras fijas y drones con registro de eventos y alertas técnicas.',
    features: ['Video 24/7', 'Alertas automáticas', 'Geolocalización'],
    num: '04',
  },
  {
    icon: ClipboardList,
    title: 'Auditoría',
    description: 'Proceso de revisión humana integral que valida coherencia entre pasaporte, gemelo y monitoreo.',
    features: ['Revisión documental', 'Validación cruzada', 'Estados de proceso'],
    num: '05',
  },
  {
    icon: BadgeCheck,
    title: 'Certificación',
    description: 'Emisión de documentos verificables para comercio nacional e internacional con validez regulatoria.',
    features: ['Certificado digital', 'Cumplimiento normativo', 'Exportación'],
    num: '06',
  },
] as const

const BENEFIT_CARDS = [
  {
    role: 'Productor',
    tag: 'Rancho / UPP',
    benefits: ['Control operativo total del rancho', 'Historial verificable de cada animal', 'Incremento del valor comercial', 'Acceso a mercados premium'],
  },
  {
    role: 'Veterinario',
    tag: 'MVZ Certificado',
    benefits: ['Acceso inmediato al historial completo', 'Registro digital de tratamientos', 'Emisión de certificados oficiales', 'Trazabilidad de intervenciones'],
  },
  {
    role: 'Autoridad',
    tag: 'SENASICA / SADER',
    benefits: ['Supervisión en tiempo real', 'Auditorías automatizadas', 'Cumplimiento normativo verificable', 'Reportes institucionales instantáneos'],
  },
  {
    role: 'Exportador',
    tag: 'Mercados Internacionales',
    benefits: ['Certificación internacional inmediata', 'Documentación verificable digitalmente', 'Agilización de trámites aduanales', 'Cumplimiento de estándares globales'],
  },
] as const

const TRUSTED_ORGS = [
  { name: 'SENASICA', full: 'Servicio Nacional de Sanidad, Inocuidad y Calidad Agroalimentaria' },
  { name: 'USDA · APHIS', full: 'Animal and Plant Health Inspection Service' },
  { name: 'OMSA / WOAH', full: 'Organización Mundial de Sanidad Animal' },
  { name: 'SINIIGA', full: 'Sistema Nacional de Identificación Individual de Ganado' },
  { name: 'SADER', full: 'Secretaría de Agricultura y Desarrollo Rural' },
  { name: 'FAO', full: 'Food and Agriculture Organization of the United Nations' },
  { name: 'CNOG', full: 'Confederación Nacional de Organizaciones Ganaderas' },
  { name: 'UGRD', full: 'Unión Ganadera Regional de Durango' },
  { name: 'FIRA', full: 'Fideicomisos Instituidos en Relación con la Agricultura' },
  { name: 'UTD', full: 'Universidad Tecnológica de Durango' },
]

const STATS = [
  { value: 'USD $65B', label: 'pérdidas anuales por enfermedades en ganadería global', source: 'Liang et al., 2024' },
  { value: '41%', label: 'caída exportaciones MX por suspensiones sanitarias en 2025', source: 'Mexico Business News, 2025' },
  { value: '48h', label: 'tiempo máximo para entrega de registros exigido por USDA APHIS', source: 'U.S. CRS, 2024' },
  { value: '96.3%', label: 'precisión en identificación biométrica de huella de morro', source: 'Kumar et al., 2018' },
]

const TECH_PILLARS = [
  {
    Icon: Brain,
    title: 'IA ACIPE',
    desc: 'Arquitectura Cognitiva Institucional por Estados. La IA nunca decide — organiza evidencia para la autoridad humana.',
    color: '#2FAF8F',
  },
  {
    Icon: Link2,
    title: 'Blockchain Selectivo',
    desc: 'Hashes SHA-256 en red Polygon. Solo eventos críticos se anclan. Costo: $0.001 USD/tx, 41.6 kg CO₂/año.',
    color: '#2FAF8F',
  },
  {
    Icon: WifiOff,
    title: 'Offline-First',
    desc: 'Operación plena sin conectividad. Sincronización diferida controlada al recuperar señal. Sin pérdida de datos.',
    color: '#2FAF8F',
  },
  {
    Icon: Camera,
    title: 'IoT Contextual',
    desc: 'Cámaras fijas + drones. La identidad no depende del arete — la biometría nasal es el ancla permanente.',
    color: '#2FAF8F',
  },
] as const

const MODELO_PILLARS = [
  {
    Icon: LockOpen,
    label: 'Sin Suscripciones Forzosas',
    desc: 'No existen planes mensuales. Solo pagas por acciones que generan valor documental oficial.',
  },
  {
    Icon: Building2,
    label: 'Estructura por Rol',
    desc: 'Productores, MVZ, uniones, exportadores y auditores — cada uno con un modelo diferenciado.',
  },
  {
    Icon: Eye,
    label: 'Transparencia Total',
    desc: 'Sin cargos ocultos. Cada acción que genera consumo es visible y confirmada antes de ejecutarse.',
  },
  {
    Icon: Leaf,
    label: 'Tier Gratuito Funcional',
    desc: 'Hasta 20 animales con funcionalidad completa. El acceso a mercados premium financia la inclusión.',
  },
] as const

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface SectionProps {
  children: React.ReactNode
  className?: string
  id?: string
}

interface ScrollRevealProps {
  children: React.ReactNode
  delay?: number
  className?: string
}

interface AccordionProps {
  title: string
  children: React.ReactNode
  isDark: boolean
}

// ─── HOOKS ────────────────────────────────────────────────────────────────────

const useScrollReveal = (threshold = 0.08) => {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true) },
      { threshold }
    )
    obs.observe(el)
    return () => { if (el) obs.unobserve(el) }
  }, [threshold])
  return { ref, isVisible }
}

const useTheme = () => {
  const [isDark, setIsDark] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)').matches : true
  )
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const fn = (e: MediaQueryListEvent) => setIsDark(e.matches)
    mq.addEventListener('change', fn)
    return () => mq.removeEventListener('change', fn)
  }, [])
  return { isDark }
}

// ─── BASE COMPONENTS ──────────────────────────────────────────────────────────

const Section = ({ children, className = '', id }: SectionProps) => (
  <section id={id} className={`py-24 px-6 ${className}`}>
    <div className="max-w-6xl mx-auto">{children}</div>
  </section>
)

const ScrollReveal = ({ children, delay = 0, className = '' }: ScrollRevealProps) => {
  const { ref, isVisible } = useScrollReveal()
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

const SectionEyebrow = ({ children, isDark }: { children: React.ReactNode; isDark: boolean }) => (
  <div className="flex items-center gap-2.5 mb-5">
    <span className="w-1.5 h-1.5 rounded-full bg-[#2FAF8F] shrink-0" />
    <span className="w-[18px] h-px bg-[#2FAF8F]/50 shrink-0" />
    <span className={`text-[11px] font-semibold tracking-[0.14em] uppercase ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
      {children}
    </span>
  </div>
)

const Accordion = ({ title, children, isDark }: AccordionProps) => {
  const [open, setOpen] = useState(false)
  return (
    <div className={`border-b transition-colors ${isDark ? 'border-stone-800/60' : 'border-stone-200'}`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full py-5 flex items-center justify-between text-left group"
        aria-expanded={open}
      >
        <span className={`text-[13.5px] font-medium leading-snug transition-colors duration-200 ${open ? 'text-[#2FAF8F]' : isDark ? 'text-stone-200' : 'text-stone-800'}`}>
          {title}
        </span>
        <span className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 ml-4 transition-all duration-300 ${
          open ? 'bg-[#2FAF8F]/15 border-[#2FAF8F]/40' : isDark ? 'border-stone-700 group-hover:border-stone-500' : 'border-stone-300 group-hover:border-stone-400'
        }`}>
          <ChevronDown className={`w-3 h-3 transition-all duration-300 ${open ? 'rotate-180 text-[#2FAF8F]' : isDark ? 'text-stone-500' : 'text-stone-400'}`} strokeWidth={2} />
        </span>
      </button>
      <div className={`accordion-content overflow-hidden ${open ? 'max-h-72 opacity-100 pb-5' : 'max-h-0 opacity-0'}`}>
        <p className={`text-[13px] leading-[1.75] ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>{children}</p>
      </div>
    </div>
  )
}

const CookieBanner = ({ isDark }: { isDark: boolean }) => {
  const navigate = useNavigate()
  const [show, setShow] = useState(() => {
    try { return !localStorage.getItem('cookieConsent') } catch { return false }
  })
  const accept = () => { localStorage.setItem('cookieConsent', 'accepted'); setShow(false) }
  const decline = () => { localStorage.setItem('cookieConsent', 'declined'); setShow(false) }
  if (!show) return null
  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 px-6 py-4 border-t backdrop-blur-2xl ${isDark ? 'bg-[#0c0a09]/92 border-stone-800/60' : 'bg-white/92 border-stone-200'}`}
      role="dialog"
    >
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center gap-4">
        <Cookie className="w-5 h-5 text-[#2FAF8F] shrink-0 mt-0.5" strokeWidth={1.5} />
        <p className={`flex-1 text-[12.5px] leading-relaxed ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
          Usamos cookies para mejorar tu experiencia. Consulta nuestra{' '}
          <button onClick={() => navigate('/legal?section=privacy')} className="text-[#2FAF8F] hover:underline">
            Política de Privacidad
          </button>.
        </p>
        <div className="flex gap-2 shrink-0">
          <button onClick={decline} className={`px-4 py-2 rounded-xl text-[12px] font-medium border transition-all ${isDark ? 'border-stone-700 text-stone-300 hover:bg-stone-800' : 'border-stone-300 text-stone-600 hover:bg-stone-100'}`}>
            Solo esenciales
          </button>
          <button onClick={accept} className="px-4 py-2 rounded-xl text-[12px] font-medium bg-[#2FAF8F] text-white hover:bg-[#27a07f] transition-all">
            Aceptar
          </button>
        </div>
      </div>
    </div>
  )
}

const TrustedMarquee = ({ isDark }: { isDark: boolean }) => {
  const items = [...TRUSTED_ORGS, ...TRUSTED_ORGS]
  return (
    <div className="overflow-hidden relative">
      <div className={`absolute left-0 top-0 bottom-0 w-24 z-10 pointer-events-none ${isDark ? 'bg-gradient-to-r from-[#0c0a09]' : 'bg-gradient-to-r from-white'} to-transparent`} />
      <div className={`absolute right-0 top-0 bottom-0 w-24 z-10 pointer-events-none ${isDark ? 'bg-gradient-to-l from-[#0c0a09]' : 'bg-gradient-to-l from-white'} to-transparent`} />
      <div className="flex items-center gap-6 marquee-track">
        {items.map((org, i) => (
          <div
            key={i}
            title={org.full}
            className={`shrink-0 flex items-center gap-2.5 px-4 py-2 rounded-xl border transition-colors whitespace-nowrap cursor-default ${
              isDark
                ? 'border-stone-800/60 bg-stone-900/40 text-stone-400 hover:text-stone-200 hover:border-stone-700'
                : 'border-stone-200 bg-stone-50 text-stone-500 hover:text-stone-700 hover:border-stone-300'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#2FAF8F] opacity-70 shrink-0" />
            <span className="text-[12px] font-semibold tracking-[0.03em]">{org.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── ICONS ────────────────────────────────────────────────────────────────────

const GandiaLogo = ({ className = 'w-3.5 h-3.5' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 2L2 7l10 5 10-5-10-5z" />
    <path d="M2 17l10 5 10-5" />
    <path d="M2 12l10 5 10-5" />
  </svg>
)

const SendIcon = () => (
  <svg className="w-[17px] h-[17px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="19" x2="12" y2="5" /><polyline points="5 12 12 5 19 12" />
  </svg>
)

const MicIcon = () => (
  <svg className="w-[17px] h-[17px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
  </svg>
)

const ClipIcon = () => (
  <svg className="w-[17px] h-[17px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
  </svg>
)

const SparkIcon = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
  </svg>
)

const ChevDownSmall = () => (
  <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
)

// ─── FLOATING SIDE MESSAGES ──────────────────────────────────────────────────
// Desktop only — mensajes flotantes que suben por los lados y se desvanecen

const LEFT_MSGS = [
  '¿Cómo registro un nuevo animal?',
  '¿Cuándo vence mi certificado?',
  '¿Qué pasa si pierdo el arete?',
  '¿Puedo usar el sistema sin señal?',
  '¿Cómo exporto a Estados Unidos?',
  '¿Qué documentos pide el USDA?',
]

const RIGHT_MSGS = [
  '¿Cuánto cuesta la certificación?',
  '¿Qué es el gemelo digital?',
  '¿Cómo funciona la biometría nasal?',
  '¿Qué es SENASICA?',
  '¿Puedo tener varios ranchos?',
  '¿Qué es el pasaporte ganadero?',
]

type FloatItem = { id: number; text: string; x: number; delay: number; duration: number; bottom: number }

const FloatingMessages = ({ isDark }: { isDark: boolean }) => {
  const [items, setItems] = useState<{ left: FloatItem[]; right: FloatItem[] }>({ left: [], right: [] })
  const counterRef = useRef(0)

  const spawn = useCallback((side: 'left' | 'right') => {
    const pool = side === 'left' ? LEFT_MSGS : RIGHT_MSGS
    const text = pool[Math.floor(Math.random() * pool.length)]
    const id = counterRef.current++
    const item: FloatItem = {
      id,
      text,
      x: Math.random() * 15,      // horizontal jitter within the column
      delay: 0,
      duration: 7000 + Math.random() * 3000,
      bottom: -60,
    }
    setItems(prev => ({ ...prev, [side]: [...prev[side].slice(-4), item] }))
    // Remove after animation
    setTimeout(() => {
      setItems(prev => ({ ...prev, [side]: prev[side].filter(i => i.id !== id) }))
    }, item.duration + 200)
  }, [])

  useEffect(() => {
    // Stagger initial spawns
    const timers: ReturnType<typeof setTimeout>[] = []
    const scheduleLeft  = (delay: number) => timers.push(setTimeout(() => {
      spawn('left')
      const iv = setInterval(() => spawn('left'),  10000 + Math.random() * 4000)
      timers.push(iv as unknown as ReturnType<typeof setTimeout>)
    }, delay))
    const scheduleRight = (delay: number) => timers.push(setTimeout(() => {
      spawn('right')
      const iv = setInterval(() => spawn('right'), 10000 + Math.random() * 4000)
      timers.push(iv as unknown as ReturnType<typeof setTimeout>)
    }, delay))

    scheduleLeft(800)
    scheduleLeft(5500)
    scheduleRight(2800)
    scheduleRight(7200)

    return () => timers.forEach(t => clearTimeout(t))
  }, [spawn])

  const bubble = (item: FloatItem, side: 'left' | 'right', idx: number) => (
    <div
      key={item.id}
      className="float-msg absolute select-none"
      style={{
        bottom: `${item.bottom}px`,
        left: side === 'left' ? `${item.x}%` : undefined,
        right: side === 'right' ? `${item.x}%` : undefined,
        animationDuration: `${item.duration}ms`,
        zIndex: 5 + idx,
      }}
    >
      <div className={`px-3.5 py-2 rounded-2xl ${
        side === 'left' ? 'rounded-bl-sm' : 'rounded-br-sm'
      } text-[12px] font-medium border backdrop-blur-sm ${
        isDark
          ? 'bg-[#1a1714]/80 border-stone-700/40 text-stone-400'
          : 'bg-white/80 border-stone-200/70 text-stone-500'
      }`}>
        {item.text}
      </div>
    </div>
  )

  return (
    <>
      {/* Left column */}
      <div
        className="hidden lg:block absolute left-4 top-0 bottom-0 w-56 pointer-events-none"
        style={{
          maskImage: 'linear-gradient(180deg, transparent 0%, black 20%, black 58%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(180deg, transparent 0%, black 20%, black 58%, transparent 100%)',
        }}
      >
        {items.left.map((item, i) => bubble(item, 'left', i))}
      </div>

      {/* Right column */}
      <div
        className="hidden lg:block absolute right-4 top-0 bottom-0 w-56 pointer-events-none"
        style={{
          maskImage: 'linear-gradient(180deg, transparent 0%, black 20%, black 58%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(180deg, transparent 0%, black 20%, black 58%, transparent 100%)',
        }}
      >
        {items.right.map((item, i) => bubble(item, 'right', i))}
      </div>
    </>
  )
}

// ─── HERO CHAT DEMO ───────────────────────────────────────────────────────────

type HeroPhase = 'idle' | 'typing' | 'sent' | 'dots' | 'response' | 'ctas'

const TITLE_STR    = 'GANDIA 7'
const SUBTITLE_STR = 'Sistema Institucional de Trazabilidad Ganadera'
const DESC_STR     = 'Infraestructura digital de consulta, evidencia y trazabilidad del ecosistema ganadero, diseñada para operar en el campo real (con o sin señal), interoperable con sistemas oficiales y escalable de México hacia mercados internacionales.'

const HeroChatDemo = ({ isDark }: { isDark: boolean }) => {
  const [inputText, setInputText]     = useState('')
  const [phase, setPhase]             = useState<HeroPhase>('idle')
  const [streamTitle, setStreamTitle] = useState('')
  const [streamSub, setStreamSub]     = useState('')
  const [streamDesc, setStreamDesc]   = useState('')

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []

    timers.push(setTimeout(() => {
      setPhase('typing')
      const USER_MSG = '¿Qué es GANDIA 7?'
      let i = 0
      const typeInterval = setInterval(() => {
        i++
        setInputText(USER_MSG.slice(0, i))
        if (i >= USER_MSG.length) {
          clearInterval(typeInterval)
          timers.push(setTimeout(() => {
            setPhase('sent')
            setInputText('')
            timers.push(setTimeout(() => {
              setPhase('dots')
              timers.push(setTimeout(() => {
                setPhase('response')

                // ── Stream title ──────────────────────────────
                let ti = 0
                const titleIv = setInterval(() => {
                  ti++
                  setStreamTitle(TITLE_STR.slice(0, ti))
                  if (ti >= TITLE_STR.length) {
                    clearInterval(titleIv)

                    // ── Stream subtitle ───────────────────────
                    timers.push(setTimeout(() => {
                      let si = 0
                      const subIv = setInterval(() => {
                        si++
                        setStreamSub(SUBTITLE_STR.slice(0, si))
                        if (si >= SUBTITLE_STR.length) {
                          clearInterval(subIv)

                          // ── Stream description ────────────────
                          timers.push(setTimeout(() => {
                            let di = 0
                            const descIv = setInterval(() => {
                              di += 3
                              setStreamDesc(DESC_STR.slice(0, di))
                              if (di >= DESC_STR.length) {
                                clearInterval(descIv)
                                setPhase('ctas')
                              }
                            }, 18)
                          }, 120))
                        }
                      }, 28)
                    }, 180))
                  }
                }, 70)

              }, 1300))
            }, 450))
          }, 650))
        }
      }, 85)
    }, 900))

    return () => timers.forEach(clearTimeout)
  }, [])

  const muted = isDark ? 'text-stone-400' : 'text-stone-500'

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-0">

      {/* ── Messages area ── */}
      <div className="flex flex-col gap-4 mb-9" style={{ minHeight: '200px', justifyContent: 'flex-end' }}>

        {/* User bubble — Chat.tsx style, alineado derecha */}
        {(phase === 'sent' || phase === 'dots' || phase === 'response' || phase === 'ctas') && (
          <div className="w-full flex justify-end animate-hero-msg-in">
            <div
              className="px-4 py-3 rounded-2xl rounded-br-md text-[14px] bg-white dark:bg-[#1c1917] border border-stone-200/70 dark:border-stone-800/60 text-stone-800 dark:text-stone-100 leading-[1.75]"
              style={{ maxWidth: '280px' }}
            >
              ¿Qué es GANDIA 7?
            </div>
          </div>
        )}

        {/* Typing dots — izquierda, con avatar como Chat.tsx */}
        {phase === 'dots' && (
          <div className="flex items-center gap-2 animate-hero-msg-in">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${isDark ? 'bg-stone-800/60' : 'bg-stone-100'}`}>
              <GandiaLogo className="w-3.5 h-3.5 text-[#2FAF8F]" />
            </div>
            <div className={`flex items-center gap-1 px-4 py-3 rounded-2xl rounded-bl-sm ${isDark ? 'bg-stone-800/50' : 'bg-stone-100/80'}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-[#2FAF8F] animate-typing-dot" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-[#2FAF8F] animate-typing-dot" style={{ animationDelay: '160ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-[#2FAF8F] animate-typing-dot" style={{ animationDelay: '320ms' }} />
            </div>
          </div>
        )}

        {/* AI Response — avatar izquierda, texto centrado, typewriter */}
        {(phase === 'response' || phase === 'ctas') && (
          <div className="flex items-start gap-2.5 animate-hero-msg-in">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-1 ${isDark ? 'bg-stone-800/60' : 'bg-stone-100'}`}>
              <GandiaLogo className="w-3.5 h-3.5 text-[#2FAF8F]" />
            </div>
            <div className="flex-1 min-w-0 text-center">
              {/* Title */}
              <h1 className="serif italic text-[clamp(3rem,7vw,5.5rem)] leading-none tracking-tight text-gradient mb-2">
                {streamTitle}
                {streamTitle.length < TITLE_STR.length && <span className="hero-cursor">|</span>}
              </h1>
              {/* Subtitle — only shows after title done */}
              {streamTitle.length >= TITLE_STR.length && (
                <p className={`text-[clamp(0.95rem,1.8vw,1.1rem)] font-light leading-relaxed mb-4 ${muted}`}>
                  {streamSub}
                  {streamSub.length > 0 && streamSub.length < SUBTITLE_STR.length && <span className="hero-cursor">|</span>}
                </p>
              )}
              {/* Description — only shows after subtitle done */}
              {streamSub.length >= SUBTITLE_STR.length && (
                <p className={`text-[14px] leading-[1.8] max-w-lg mx-auto ${muted}`}>
                  {streamDesc}
                  {streamDesc.length > 0 && streamDesc.length < DESC_STR.length && <span className="hero-cursor">|</span>}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Chat Input ── */}
      <div className="ch-input bg-white dark:bg-[#141210] border border-stone-200/80 dark:border-stone-800/70 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_20px_rgba(0,0,0,0.25)]">
        <div
          className="w-full px-4 pt-3.5 pb-2 bg-transparent text-[14px] text-stone-800 dark:text-stone-100 leading-relaxed"
          style={{ minHeight: '46px' }}
          aria-hidden="true"
        >
          {inputText
            ? <span>{inputText}<span className="hero-cursor">|</span></span>
            : <span className="text-stone-300 dark:text-stone-600 select-none">Pregunta sobre tu ganado, trámites o normativa…</span>
          }
        </div>

        <div className="flex items-center justify-between px-3 pb-3 pt-1 gap-2">
          <div className="flex items-center gap-1.5">
            <button className="w-7 h-7 flex items-center justify-center rounded-full text-stone-300 dark:text-stone-600 cursor-default" tabIndex={-1} aria-hidden="true">
              <ClipIcon />
            </button>
            <div className="w-px h-4 bg-stone-200 dark:bg-stone-700/60" />
            <div className="flex items-center gap-1.5 h-7 px-3 rounded-full text-[11.5px] font-medium bg-stone-50 dark:bg-stone-800/60 border border-stone-200/70 dark:border-stone-700/50 text-stone-500 dark:text-stone-400 select-none">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
              <span>Asistente</span>
              <ChevDownSmall />
            </div>
            <div className="flex items-center gap-1 h-7 px-2.5 rounded-full text-[11px] font-medium text-stone-400 dark:text-stone-500 border border-stone-200/70 dark:border-stone-700/50 bg-stone-50 dark:bg-stone-800/40 select-none">
              <SparkIcon />
              <span className="ml-0.5">Claude</span>
              <ChevDownSmall />
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button className="w-7 h-7 flex items-center justify-center rounded-full text-stone-300 dark:text-stone-600 cursor-default" tabIndex={-1} aria-hidden="true">
              <MicIcon />
            </button>
            <button
              className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all ${
                inputText.trim()
                  ? 'bg-[#2FAF8F] text-white shadow-sm'
                  : 'bg-stone-100 dark:bg-stone-800/60 text-stone-300 dark:text-stone-600 cursor-default'
              }`}
              tabIndex={-1}
              aria-hidden="true"
            >
              <SendIcon />
            </button>
          </div>
        </div>
      </div>

      {/* Hint */}
      <p className="text-center text-[10.5px] text-stone-300 dark:text-stone-700 mt-2.5 select-none">
        GANDIA 7 · Asistente de gestión ganadera
      </p>

      {/* Trust badges — centrados */}
      <div className={`flex flex-wrap items-center justify-center gap-5 mt-4 ${muted}`}>
        {['Offline-First', 'Evidencia Verificable', 'IA como Interfaz'].map((f) => (
          <div key={f} className="flex items-center gap-1.5 text-[12px]">
            <CheckCircle className="w-3 h-3 text-[#2FAF8F]" strokeWidth={2.5} />
            <span>{f}</span>
          </div>
        ))}
      </div>
    </div>
  )
}



// ─── SHOWCASE CAROUSEL ────────────────────────────────────────────────────────

const SHOWCASE_MODULES = [
  { num: '01', name: 'Chat IA',        desc: 'Consulta inteligente sobre ganado, trámites y normativa. Disponible offline.',       src: '/screens/chat.png'         },
  { num: '02', name: 'Rancho',         desc: 'Gestión completa de instalaciones, infraestructura y responsables operativos.',       src: '/screens/rancho.png'       },
  { num: '03', name: 'Pasaporte',      desc: 'Documento digital oficial con biometría nasal, historial sanitario y certificados.',  src: '/screens/pasaporte.png'    },
  { num: '04', name: 'Gemelo Digital', desc: 'Réplica virtual con timeline continuo de eventos, tratamientos y evidencias.',        src: '/screens/gemelo.png'       },
  { num: '05', name: 'Monitoreo',      desc: 'Supervisión visual mediante cámaras y drones con alertas en tiempo real.',            src: '/screens/monitoreo.png'    },
  { num: '06', name: 'Auditoría',      desc: 'Revisión integral que valida coherencia entre pasaporte, gemelo y monitoreo.',        src: '/screens/auditoria.png'    },
  { num: '07', name: 'Certificación',  desc: 'Emisión de documentos verificables para comercio nacional e internacional.',         src: '/screens/certificacion.png'},
  { num: '08', name: 'Trámites',       desc: 'Gestión centralizada de trámites oficiales con seguimiento de estado y notificaciones.',src: '/screens/tramites.png'   },
] as const

const PLACEHOLDER_GRADIENTS = [
  'linear-gradient(135deg,#0d1a16 0%,#0a1410 40%,#06110d 100%)',
  'linear-gradient(135deg,#0e1a12 0%,#091408 100%)',
  'linear-gradient(135deg,#0c1810 0%,#0a1510 100%)',
  'linear-gradient(135deg,#0d1a14 0%,#081209 100%)',
  'linear-gradient(135deg,#0b1812 0%,#091410 100%)',
  'linear-gradient(135deg,#0e1a13 0%,#0a1611 100%)',
  'linear-gradient(135deg,#0d1914 0%,#091310 100%)',
  'linear-gradient(135deg,#0c1810 0%,#0a1410 100%)',
]

function ShowcaseCarousel() {
  const [active, setActive]     = useState(0)
  const [prev, setPrev]         = useState<number | null>(null)
  const [direction, setDirection] = useState<'next' | 'prev'>('next')
  const [animating, setAnimating] = useState(false)
  const [paused, setPaused]     = useState(false)
  const [infoKey, setInfoKey]   = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const goTo = useCallback((idx: number, dir: 'next' | 'prev') => {
    if (animating) return
    setDirection(dir)
    setPrev(active)
    setAnimating(true)
    setActive(idx)
    setInfoKey(k => k + 1)
    setTimeout(() => { setPrev(null); setAnimating(false) }, 750)
  }, [active, animating])

  const goNext = useCallback(() => {
    goTo((active + 1) % SHOWCASE_MODULES.length, 'next')
  }, [active, goTo])

  const goPrev = useCallback(() => {
    goTo((active - 1 + SHOWCASE_MODULES.length) % SHOWCASE_MODULES.length, 'prev')
  }, [active, goTo])

  useEffect(() => {
    if (paused) { if (timerRef.current) clearInterval(timerRef.current); return }
    timerRef.current = setInterval(goNext, 5200)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [paused, goNext])

  const prevIdx = (active - 1 + SHOWCASE_MODULES.length) % SHOWCASE_MODULES.length
  const nextIdx = (active + 1) % SHOWCASE_MODULES.length
  const mod = SHOWCASE_MODULES[active]

  return (
    <section
      style={{ background: '#060504', borderTop: '1px solid rgba(255,255,255,0.04)', position: 'relative', overflow: 'hidden' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <style>{`
        /* ── Scan line ── */
        @keyframes cine-scan { 0%{top:-2px} 100%{top:100%} }
        .cine-scanline-bar {
          position:absolute; left:0; right:0; height:2px; z-index:6; pointer-events:none;
          background:linear-gradient(90deg,transparent,rgba(47,175,143,0.04),transparent);
          animation:cine-scan 11s linear infinite;
        }

        /* ── Slide transitions ── */
        @keyframes slide-in-right  { from{transform:translateX(120%) scale(0.88);opacity:0} to{transform:translateX(0) scale(1);opacity:1} }
        @keyframes slide-in-left   { from{transform:translateX(-120%) scale(0.88);opacity:0} to{transform:translateX(0) scale(1);opacity:1} }
        @keyframes slide-out-left  { from{transform:translateX(0) scale(1);opacity:1}  to{transform:translateX(-120%) scale(0.88);opacity:0} }
        @keyframes slide-out-right { from{transform:translateX(0) scale(1);opacity:1}  to{transform:translateX(120%) scale(0.88);opacity:0} }

        .cine-enter-next { animation:slide-in-right  0.72s cubic-bezier(0.16,1,0.3,1) both; }
        .cine-enter-prev { animation:slide-in-left   0.72s cubic-bezier(0.16,1,0.3,1) both; }
        .cine-exit-next  { animation:slide-out-left  0.72s cubic-bezier(0.16,1,0.3,1) both; }
        .cine-exit-prev  { animation:slide-out-right 0.72s cubic-bezier(0.16,1,0.3,1) both; }

        /* ── Info fade ── */
        @keyframes info-in { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        .cine-info-enter { animation:info-in 0.6s cubic-bezier(0.16,1,0.3,1) 0.18s both; }

        /* ── Screen glow pulse ── */
        @keyframes screen-glow {
          0%,100%{box-shadow:0 30px 100px rgba(0,0,0,0.9),0 0 80px rgba(47,175,143,0.06),0 0 0 1px rgba(47,175,143,0.1)}
          50%    {box-shadow:0 30px 100px rgba(0,0,0,0.9),0 0 120px rgba(47,175,143,0.12),0 0 0 1px rgba(47,175,143,0.18)}
        }
        .cine-screen-glow { animation:screen-glow 4s ease-in-out infinite; }

        /* ── Dot ── */
        .cine-dot { transition:all 0.35s cubic-bezier(0.16,1,0.3,1); cursor:pointer; }
        .cine-dot:hover { background:rgba(255,255,255,0.4) !important; }

        /* ── Nav arrows ── */
        .cine-arrow {
          position:absolute; top:50%; z-index:20;
          width:48px; height:48px; border-radius:50%;
          display:flex; align-items:center; justify-content:center;
          border:1px solid rgba(255,255,255,0.08);
          background:rgba(6,5,4,0.7);
          backdrop-filter:blur(12px);
          cursor:pointer;
          transition:all 0.25s ease;
          transform:translateY(-50%);
        }
        .cine-arrow:hover {
          border-color:rgba(47,175,143,0.35);
          background:rgba(6,5,4,0.92);
          box-shadow:0 0 24px rgba(47,175,143,0.12);
        }
        .cine-arrow-left  { left:max(16px, calc(50% - 480px)); }
        .cine-arrow-right { right:max(16px, calc(50% - 480px)); }

        /* ── Side screens ── */
        .cine-side-screen {
          position:absolute;
          top:0; bottom:0;
          width:clamp(160px, 22vw, 300px);
          display:flex; align-items:center;
          pointer-events:none; z-index:3;
          overflow:hidden;
        }
        .cine-side-left  { left:0; }
        .cine-side-right { right:0; }

        .cine-side-inner {
          width:100%; aspect-ratio:16/10;
          border-radius:2px;
          overflow:hidden;
          border:1px solid rgba(255,255,255,0.05);
          background:#0a0908;
          opacity:0.32;
          transform:scale(0.88);
          transform-origin:center;
          transition:opacity 0.5s ease, transform 0.5s ease;
          filter:saturate(0.4) brightness(0.6);
        }
        .cine-side-left .cine-side-inner  { transform-origin:left center; }
        .cine-side-right .cine-side-inner { transform-origin:right center; }

        /* Side gradient masks — Pixel Point technique */
        .cine-mask-left {
          position:absolute; left:0; top:0; bottom:0; z-index:15; pointer-events:none;
          width:clamp(200px,28vw,380px);
          background:linear-gradient(to right,#060504 0%,#060504 35%,rgba(6,5,4,0.85) 60%,rgba(6,5,4,0.4) 78%,transparent 100%);
        }
        .cine-mask-right {
          position:absolute; right:0; top:0; bottom:0; z-index:15; pointer-events:none;
          width:clamp(200px,28vw,380px);
          background:linear-gradient(to left,#060504 0%,#060504 35%,rgba(6,5,4,0.85) 60%,rgba(6,5,4,0.4) 78%,transparent 100%);
        }

        /* ── Progress bar ── */
        @keyframes progress-fill { from{width:0%} to{width:100%} }
        .cine-progress-bar {
          height:2px;
          background:rgba(47,175,143,0.7);
          border-radius:1px;
          animation:progress-fill 5.2s linear both;
        }
      `}</style>

      {/* Ambient glow */}
      <div style={{
        position:'absolute', top:'45%', left:'50%',
        transform:'translate(-50%,-50%)',
        width:900, height:600, zIndex:0, pointerEvents:'none',
        background:'radial-gradient(ellipse,rgba(47,175,143,0.055) 0%,transparent 60%)',
        filter:'blur(80px)',
      }}/>

      {/* Grain */}
      <div style={{
        position:'absolute', inset:0, zIndex:1, pointerEvents:'none',
        backgroundImage:`url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E")`,
        mixBlendMode:'screen' as const,
      }}/>

      {/* Top dissolve */}
      <div style={{ position:'absolute', top:0, insetInline:0, height:140, zIndex:20, pointerEvents:'none', background:'linear-gradient(to bottom,#060504 0%,transparent 100%)' }}/>
      {/* Bottom dissolve */}
      <div style={{ position:'absolute', bottom:0, insetInline:0, height:180, zIndex:20, pointerEvents:'none', background:'linear-gradient(to top,#060504 0%,transparent 100%)' }}/>

      {/* Scan line */}
      <div className="cine-scanline-bar"/>

      <div style={{ position:'relative', zIndex:10, maxWidth:1400, margin:'0 auto', padding:'clamp(80px,10vw,140px) 0 clamp(80px,10vw,120px)' }}>

        {/* ── HEADER ── */}
        <ScrollReveal>
          <div style={{ padding:'0 clamp(24px,5vw,80px)', marginBottom:'clamp(48px,7vw,80px)' }}>
            <div style={{ display:'flex', flexDirection:'column', gap:0, maxWidth:680 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:24 }}>
                <span style={{ width:6, height:6, borderRadius:'50%', background:'#2FAF8F', boxShadow:'0 0 10px rgba(47,175,143,1)', display:'inline-block' }}/>
                <div style={{ height:1, width:32, background:'rgba(47,175,143,0.3)' }}/>
                <span style={{ fontFamily:'Geist,sans-serif', fontSize:10, fontWeight:700, letterSpacing:'0.18em', textTransform:'uppercase' as const, color:'#2FAF8F' }}>
                  Plataforma
                </span>
              </div>
              <h2 style={{ fontFamily:"'Instrument Serif',Georgia,serif", fontSize:'clamp(3rem,6vw,5.5rem)', lineHeight:0.88, letterSpacing:'-0.04em', margin:0 }}>
                <span style={{ color:'rgba(255,255,255,0.93)', display:'block' }}>Una herramienta</span>
                <em style={{ color:'rgba(255,255,255,0.11)', fontStyle:'italic', display:'block' }}>diseñada para el campo.</em>
              </h2>
            </div>
          </div>
        </ScrollReveal>

        {/* ── CAROUSEL STAGE ── */}
        <div style={{ position:'relative', width:'100%', overflow:'hidden', paddingBottom:'2px' }}>

          {/* Side screens — previous */}
          <div className="cine-side-screen cine-side-left">
            <div className="cine-side-inner">
              <img src={SHOWCASE_MODULES[prevIdx].src} alt="" loading="lazy" style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'top center', display:'block' }}
                onError={(e)=>{ (e.currentTarget as HTMLImageElement).style.display='none' }}
              />
              <div style={{ position:'absolute', inset:0, background:PLACEHOLDER_GRADIENTS[prevIdx] }}/>
            </div>
          </div>

          {/* Side screens — next */}
          <div className="cine-side-screen cine-side-right">
            <div className="cine-side-inner">
              <img src={SHOWCASE_MODULES[nextIdx].src} alt="" loading="lazy" style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'top center', display:'block' }}
                onError={(e)=>{ (e.currentTarget as HTMLImageElement).style.display='none' }}
              />
              <div style={{ position:'absolute', inset:0, background:PLACEHOLDER_GRADIENTS[nextIdx] }}/>
            </div>
          </div>

          {/* Pixel Point gradient masks — make sides dissolve into dark */}
          <div className="cine-mask-left"/>
          <div className="cine-mask-right"/>

          {/* ── MAIN SCREEN — center stage ── */}
          <div style={{ display:'flex', justifyContent:'center', padding:'0 clamp(24px,5vw,60px)', position:'relative', zIndex:10 }}>
            <div style={{ position:'relative', width:'100%', maxWidth:900 }}>

              {/* Screen wrapper — clip & stack */}
              <div style={{ position:'relative', aspectRatio:'16/10', borderRadius:6, overflow:'hidden', background:'#0a0908' }} className="cine-screen-glow">

                {/* Exit slide (prev active) */}
                {prev !== null && (
                  <div key={`exit-${prev}`} style={{ position:'absolute', inset:0 }}
                    className={direction === 'next' ? 'cine-exit-next' : 'cine-exit-prev'}
                  >
                    <img src={SHOWCASE_MODULES[prev].src} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'top center', display:'block', filter:'brightness(0.85) saturate(0.92)' }}
                      onError={(e)=>{ (e.currentTarget as HTMLImageElement).style.display='none' }}
                    />
                    <div style={{ position:'absolute', inset:0, background:PLACEHOLDER_GRADIENTS[prev] }}/>
                  </div>
                )}

                {/* Active slide */}
                <div key={`active-${active}`} style={{ position:'absolute', inset:0 }}
                  className={animating ? (direction === 'next' ? 'cine-enter-next' : 'cine-enter-prev') : ''}
                >
                  {/* Actual screenshot */}
                  <img
                    src={mod.src}
                    alt={`GANDIA 7 — ${mod.name}`}
                    loading="lazy"
                    style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'top center', display:'block', filter:'brightness(0.87) saturate(0.93)' }}
                    onError={(e)=>{ (e.currentTarget as HTMLImageElement).style.display='none' }}
                  />
                  {/* Fallback gradient placeholder */}
                  <div style={{ position:'absolute', inset:0, background:PLACEHOLDER_GRADIENTS[active] }}/>

                  {/* Subtle inner overlay */}
                  <div style={{ position:'absolute', inset:0, background:'linear-gradient(180deg,rgba(6,5,4,0.1) 0%,transparent 25%,transparent 60%,rgba(6,5,4,0.65) 100%)' }}/>

                  {/* ── Letterbox top bar ── */}
                  <div style={{ position:'absolute', top:0, left:0, right:0, height:32, background:'#060504', borderBottom:'1px solid rgba(255,255,255,0.04)', display:'flex', alignItems:'center', padding:'0 16px', gap:8, zIndex:3 }}>
                    <span style={{ fontFamily:'Geist,monospace', fontSize:9, fontWeight:600, letterSpacing:'0.14em', color:'rgba(255,255,255,0.2)', textTransform:'uppercase' as const }}>GANDIA·7</span>
                    <div style={{ flex:1, height:1, background:'rgba(255,255,255,0.04)' }}/>
                    <span style={{ fontFamily:'Geist,monospace', fontSize:9, fontWeight:600, letterSpacing:'0.14em', color:'rgba(255,255,255,0.15)' }}>{mod.num}/08</span>
                    <span style={{ width:5, height:5, borderRadius:'50%', background:'#2FAF8F', display:'inline-block' }} className="pulse-dot"/>
                  </div>

                  {/* ── Progress bar ── */}
                  <div style={{ position:'absolute', top:32, left:0, right:0, height:2, background:'rgba(255,255,255,0.04)', zIndex:3 }}>
                    {!paused && <div key={`bar-${active}-${infoKey}`} className="cine-progress-bar"/>}
                  </div>

                  {/* ── Module slug bottom-left ── */}
                  <div style={{ position:'absolute', bottom:0, left:0, right:0, zIndex:3, padding:'60px 20px 18px', background:'linear-gradient(to top,rgba(6,5,4,0.88) 0%,transparent 100%)' }}>
                    <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <span style={{ fontFamily:'Geist,monospace', fontSize:9, fontWeight:600, letterSpacing:'0.12em', color:'rgba(255,255,255,0.22)', textTransform:'uppercase' as const }}>[{mod.num.padStart(3,'0')}]</span>
                        <div style={{ width:20, height:1, background:'rgba(255,255,255,0.15)' }}/>
                        <span style={{ fontFamily:"'Instrument Serif',Georgia,serif", fontStyle:'italic', fontSize:15, color:'rgba(255,255,255,0.6)', letterSpacing:'-0.01em' }}>{mod.name}</span>
                      </div>
                      <div style={{ display:'flex', gap:4 }}>
                        {[0,1,2].map(i => <div key={i} style={{ width:2, height:2, borderRadius:'50%', background:'rgba(255,255,255,0.2)' }}/>)}
                      </div>
                    </div>
                  </div>

                </div>

                {/* Corner gloss */}
                <div style={{ position:'absolute', inset:0, zIndex:4, borderRadius:6, border:'1px solid rgba(255,255,255,0.07)', pointerEvents:'none' }}/>
              </div>

              {/* Under-screen ground glow */}
              <div style={{ position:'absolute', bottom:-40, left:'50%', transform:'translateX(-50%)', width:'70%', height:80, background:'radial-gradient(ellipse,rgba(47,175,143,0.09) 0%,transparent 70%)', filter:'blur(24px)', pointerEvents:'none', zIndex:-1 }}/>
            </div>
          </div>

          {/* ── Nav arrows ── */}
          <button className="cine-arrow cine-arrow-left" onClick={goPrev} aria-label="Módulo anterior">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <button className="cine-arrow cine-arrow-right" onClick={goNext} aria-label="Módulo siguiente">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>

        {/* ── INFO BLOCK — module name + description ── */}
        <div style={{ padding:'0 clamp(24px,5vw,60px)' }}>
          <div style={{ maxWidth:900, margin:'0 auto' }}>
            <div key={infoKey} className="cine-info-enter" style={{ padding:'32px 0 0', display:'flex', flexDirection:'column' as const, gap:8 }}>
              <div style={{ display:'flex', alignItems:'baseline', gap:16 }}>
                <span style={{ fontFamily:"'Instrument Serif',Georgia,serif", fontStyle:'italic', fontSize:'clamp(2rem,4vw,3.2rem)', lineHeight:1, color:'rgba(255,255,255,0.88)', letterSpacing:'-0.03em' }}>
                  {mod.name}
                </span>
                <span style={{ fontFamily:'Geist,sans-serif', fontSize:11, fontWeight:600, letterSpacing:'0.14em', textTransform:'uppercase' as const, color:'rgba(47,175,143,0.65)', paddingBottom:4 }}>
                  Módulo {mod.num}
                </span>
              </div>
              <p style={{ fontFamily:'Geist,sans-serif', fontSize:13.5, lineHeight:1.75, color:'rgba(255,255,255,0.28)', fontWeight:300, maxWidth:520, margin:0 }}>
                {mod.desc}
              </p>
            </div>

            {/* ── Dots + counter ── */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingTop:28 }}>
              <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                {SHOWCASE_MODULES.map((_, i) => (
                  <button
                    key={i}
                    className="cine-dot"
                    onClick={() => goTo(i, i > active ? 'next' : 'prev')}
                    aria-label={`Ir a módulo ${i+1}`}
                    style={{
                      width: i === active ? 24 : 5,
                      height: 5,
                      borderRadius: 3,
                      border: 'none',
                      padding: 0,
                      background: i === active ? '#2FAF8F' : 'rgba(255,255,255,0.15)',
                      cursor: 'pointer',
                      outline: 'none',
                    }}
                  />
                ))}
              </div>
              <span style={{ fontFamily:'Geist,monospace', fontSize:10, fontWeight:600, letterSpacing:'0.14em', color:'rgba(255,255,255,0.16)' }}>
                {String(active + 1).padStart(2,'0')} / 08
              </span>
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

function Home() {
  const { isDark } = useTheme()
  const navigate = useNavigate()

  // Apply dark class + inject scrollbar styles globally
  useEffect(() => {
    if (isDark) document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
  }, [isDark])



  const bg = isDark ? 'bg-[#0c0a09] text-[#FAFAFA]' : 'bg-white text-[#171717]'
  const muted = isDark ? 'text-stone-400' : 'text-stone-500'
  const divider = isDark ? 'border-stone-800/50' : 'border-stone-200'

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600&display=swap');

        * { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
        body, .gh-root { font-family: 'Geist', system-ui, sans-serif; }
        .serif { font-family: 'Instrument Serif', Georgia, serif; }

        /* Product showcase */
        @keyframes showcase-in { from { opacity:0; transform:translateY(24px) } to { opacity:1; transform:translateY(0) } }
        .showcase-in { animation: showcase-in 700ms cubic-bezier(.16,1,.3,1) both; }
        @keyframes glow-pulse { 0%,100%{opacity:.5} 50%{opacity:.8} }
        .glow-pulse { animation: glow-pulse 4s ease-in-out infinite; }

        /* Blur reveal on hover */
        .blur-reveal {
          filter: blur(4px);
          opacity: 0.4;
          transition: filter 350ms ease, opacity 350ms ease;
          cursor: default;
          user-select: none;
        }
        .blur-reveal-parent:hover .blur-reveal,
        .blur-reveal-parent:focus-within .blur-reveal {
          filter: blur(0px);
          opacity: 1;
          user-select: auto;
        }

        /* Noise grain */
        .noise-overlay::after {
          content: '';
          position: absolute; inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
          pointer-events: none; z-index: 1; opacity: 0.6; mix-blend-mode: overlay;
        }

        /* Marquee */
        @keyframes marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .marquee-track { animation: marquee 36s linear infinite; width: max-content; }
        .marquee-track:hover { animation-play-state: paused; }

        /* Hero message entrance */
        @keyframes hero-msg-in {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-hero-msg-in { animation: hero-msg-in 0.55s cubic-bezier(.16,1,.3,1) both; }

        /* Hero line stagger */
        @keyframes hero-line-in {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-hero-line { animation: hero-line-in 0.6s cubic-bezier(.16,1,.3,1) both; }

        /* Typing dots */
        @keyframes typing-bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30%            { transform: translateY(-4px); opacity: 1; }
        }
        .animate-typing-dot { animation: typing-bounce 1.1s ease-in-out infinite; }

        /* Input cursor blink */
        @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0; } }
        .hero-cursor { animation: blink 1s step-end infinite; margin-left: 1px; color: #2FAF8F; }

        /* Dot grid mask */
        .pp-dot-grid {
          position: absolute; inset: 0;
          background-image: radial-gradient(circle, rgba(47,175,143,0.14) 1px, transparent 1px);
          background-size: 28px 28px;
          mask-image: radial-gradient(ellipse 85% 80% at 50% 50%, black 0%, transparent 72%);
          -webkit-mask-image: radial-gradient(ellipse 85% 80% at 50% 50%, black 0%, transparent 72%);
          pointer-events: none;
        }

        .pp-band-mask {
          position: absolute; inset: 0;
          background: linear-gradient(180deg,
            transparent 0%,
            rgba(47,175,143,0.018) 30%,
            rgba(47,175,143,0.025) 50%,
            rgba(47,175,143,0.018) 70%,
            transparent 100%
          );
          pointer-events: none;
        }

        /* Stat shimmer */
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .stat-shimmer {
          background: linear-gradient(90deg, #2FAF8F 0%, #6EDFC0 40%, #2FAF8F 60%, #1d8f72 100%);
          background-size: 200% auto;
          -webkit-background-clip: text; background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 4s linear infinite;
        }

        /* Floating side messages */
        @keyframes float-msg-up {
          0%   { opacity: 0; transform: translateY(0px); }
          12%  { opacity: 1; }
          75%  { opacity: 1; }
          100% { opacity: 0; transform: translateY(-420px); }
        }
        .float-msg { animation: float-msg-up linear both; pointer-events: none; }

        /* Gradient text */
        .text-gradient {
          background: linear-gradient(135deg, #2FAF8F 0%, #5DD9B0 100%);
          -webkit-background-clip: text; background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        /* Card hover */
        .card-glow { transition: border-color 280ms ease, box-shadow 280ms ease; }
        .card-glow:hover { border-color: rgba(47,175,143,0.3) !important; box-shadow: 0 0 0 1px rgba(47,175,143,0.08); }

        /* Accordion */
        .accordion-content { transition: max-height 380ms cubic-bezier(.4,0,.2,1), opacity 280ms ease, padding 280ms ease; }

        /* Button */
        .btn-primary:active { transform: scale(0.97); }

        /* Focus ring */
        :focus-visible { outline: 2px solid #2FAF8F; outline-offset: 3px; border-radius: 6px; }

        /* Chapter grid line accent */
        .chapter-item { transition: background 0.25s ease; }
        .chapter-item::before {
          content: '';
          position: absolute; top: 0; left: 0; right: 0; height: 2px;
          background: linear-gradient(90deg, #2FAF8F, #5DD9B0);
          opacity: 0;
          transition: opacity 0.25s ease;
        }
        .chapter-item:hover::before { opacity: 1; }

        /* Pulse dot */
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); box-shadow: 0 0 0 0 rgba(47,175,143,0.4); }
          50%       { opacity: .7; transform: scale(0.85); box-shadow: 0 0 0 5px rgba(47,175,143,0); }
        }
        .pulse-dot { animation: pulse-dot 2.4s ease-in-out infinite; }

        /* Float card */
        @keyframes float-card {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-6px); }
        }
        .float-card { animation: float-card 5s ease-in-out infinite; }
      `}</style>

      <div className={`min-h-screen gh-root ${bg} transition-colors duration-300`}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-[#2FAF8F] focus:text-white focus:rounded-lg"
        >
          Saltar al contenido
        </a>

        <Header currentSection="home" isDark={isDark} />

        <main id="main-content">

          {/* ══════════════════════════════════════════════════════════════════════
              HERO — Chat Simulation + Notification CTA
          ══════════════════════════════════════════════════════════════════════ */}
          <section className="noise-overlay relative min-h-screen flex flex-col justify-center overflow-hidden px-6 pt-0 pb-14">

            {/* Layer 1: ambient radial glow */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: isDark
                  ? 'radial-gradient(ellipse 65% 55% at 50% 50%, rgba(47,175,143,0.07) 0%, transparent 65%), radial-gradient(ellipse 40% 40% at 20% 20%, rgba(47,175,143,0.03) 0%, transparent 55%)'
                  : 'radial-gradient(ellipse 65% 55% at 50% 50%, rgba(47,175,143,0.06) 0%, transparent 65%)',
              }}
            />

            {/* Layer 2: Pixel Point dot grid */}
            <div className="pp-dot-grid" />

            {/* Layer 3: horizontal band */}
            <div className="pp-band-mask" />

            {/* Layer 4: top/bottom edge fade */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: isDark
                  ? `linear-gradient(180deg, #0c0a09 0%, transparent 12%, transparent 88%, #0c0a09 100%)`
                  : `linear-gradient(180deg, white 0%, transparent 12%, transparent 88%, white 100%)`,
              }}
            />

            {/* Floating side messages — desktop only */}
            <FloatingMessages isDark={isDark} />

            {/* Eyebrow — centrado, pegado a la simulación */}
            <div className="relative z-10 w-full flex justify-center mb-7">
              <div className="flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2FAF8F] shrink-0" />
                <span className="w-[18px] h-px bg-[#2FAF8F]/50 shrink-0" />
                <span className={`text-[11px] font-semibold tracking-[0.14em] uppercase ${muted}`}>
                  Sistema de Trazabilidad Ganadera
                </span>
              </div>
            </div>

            {/* Wrapper: chat centrado + notif card anclada a la derecha */}
            <div className="relative z-10 w-full max-w-2xl mx-auto">
              <HeroChatDemo isDark={isDark} />


            </div>
          </section>

          {/* Trusted marquee */}
          <section className={`py-10 border-b ${divider} ${isDark ? 'bg-[#0e0c0b]' : 'bg-stone-50/60'}`}>
            <TrustedMarquee isDark={isDark} />
          </section>

          {/* ══════════════════════════════════════════════════════════════════════
              EL PROBLEMA REAL
          ══════════════════════════════════════════════════════════════════════ */}
          <Section id="problema" className={`border-t ${divider} ${isDark ? 'bg-[#0c0a09]' : 'bg-white'}`}>
            <ScrollReveal>
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
                <div>
                  <SectionEyebrow isDark={isDark}>El Problema Real</SectionEyebrow>
                  <h2 className={`serif italic text-[clamp(2rem,4vw,3.2rem)] leading-[1.1] ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>
                    La trazabilidad ganadera<br />está rota.
                  </h2>
                </div>
                <p className={`text-[14px] leading-[1.8] max-w-sm ${muted}`}>
                  El problema no es la falta de datos — es el desorden de la evidencia. Información dispersa, documentación en papel, fraude por aretes removibles, auditorías que tardan 2–4 semanas.
                </p>
              </div>
            </ScrollReveal>

            <div className="grid md:grid-cols-2 gap-px rounded-2xl overflow-hidden border" style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)', borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)' }}>
              <ScrollReveal>
                <div className={`p-10 h-full ${isDark ? 'bg-[#0e0c0b]' : 'bg-stone-50'}`}>
                  <div className="space-y-0">
                    {[
                      { n: '01', title: 'Información Dispersa', desc: 'Registros en papel sin interoperabilidad. GANDIA 7 ordena evidencia sin absorber bases oficiales.' },
                      { n: '02', title: 'Identidad Frágil', desc: 'La identidad no puede depender de un arete removible. GANDIA establece biometría multicapa con huella de morro y fotografías certificadas.' },
                      { n: '03', title: 'Certificación Lenta', desc: 'Sin trazabilidad digital, certificar un lote toma hasta 4 semanas. GANDIA entrega respuesta en 48h mediante arquitectura ACIPE.' },
                    ].map((p, i) => (
                      <div key={p.n} className={`blur-reveal-parent flex gap-5 py-7 ${i < 2 ? `border-b ${divider}` : ''}`}>
                        <span className={`serif italic text-[2.2rem] leading-none shrink-0 tabular-nums mt-1 ${isDark ? 'text-stone-800' : 'text-stone-200'}`}>{p.n}</span>
                        <div>
                          <p className={`text-[14px] font-semibold mb-2 ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>{p.title}</p>
                          <p className={`blur-reveal text-[13px] leading-[1.7] ${muted}`}>{p.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollReveal>

              <ScrollReveal delay={100}>
                <div className="grid grid-cols-2 gap-px h-full" style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)' }}>
                  {STATS.map((stat) => (
                    <div key={stat.value} className={`p-8 flex flex-col justify-between ${isDark ? 'bg-[#0e0c0b]' : 'bg-stone-50'}`}>
                      <div className="stat-shimmer serif italic text-[clamp(2rem,3.5vw,2.8rem)] leading-none font-light mb-3">
                        {stat.value}
                      </div>
                      <div>
                        <p className={`text-[12.5px] leading-[1.65] mb-2 ${isDark ? 'text-stone-300' : 'text-stone-700'}`}>{stat.label}</p>
                        <p className={`text-[10px] font-semibold tracking-widest uppercase ${isDark ? 'text-stone-600' : 'text-stone-400'}`}>{stat.source}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollReveal>
            </div>
          </Section>

          {/* ══════════════════════════════════════════════════════════════════════
              CAMPO VIVO
          ══════════════════════════════════════════════════════════════════════ */}
          <section className={`relative overflow-hidden ${isDark ? 'bg-[#0c0a09]' : 'bg-white'}`}>
            <div className="max-w-6xl mx-auto px-6 py-24">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <ScrollReveal>
                  <div className="relative">
                    <div className={`rounded-2xl overflow-hidden aspect-[4/3] ring-1 ring-inset ${isDark ? 'ring-white/8' : 'ring-black/5'} shadow-2xl`}>
                      <img
                        src="https://media.istockphoto.com/id/1474869194/photo/hereford-calf-closeup.jpg?s=612x612&w=0&k=20&c=eCWHsmmSQ1l3gkGD9GM3rX7laSPPtvQrXqLsAJ1_oWc="
                        alt="Becerro Hereford en rancho con trazabilidad GANDIA 7"
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <div className={`absolute inset-0 ${isDark ? 'bg-gradient-to-t from-black/40 via-transparent to-black/10' : 'bg-gradient-to-t from-black/20 via-transparent to-transparent'}`} />
                    </div>
                    <div className={`float-card absolute bottom-5 left-5 px-4 py-3 rounded-2xl border backdrop-blur-2xl shadow-xl ${isDark ? 'bg-[#0c0a09]/88 border-stone-700/50' : 'bg-white/92 border-stone-200/80'}`}>
                      <p className="serif italic text-[22px] leading-none text-[#2FAF8F]">96.3%</p>
                      <p className={`text-[9.5px] mt-1 font-medium ${muted}`}>Precisión biométrica</p>
                    </div>
                    <div className={`float-card absolute top-5 right-5 flex items-center gap-2.5 px-3.5 py-2 rounded-2xl border backdrop-blur-2xl shadow-xl ${isDark ? 'bg-[#0c0a09]/88 border-stone-700/50' : 'bg-white/92 border-stone-200/80'}`} style={{ animationDelay: '1.4s' }}>
                      <span className="pulse-dot w-2 h-2 rounded-full bg-[#2FAF8F]" />
                      <div>
                        <p className={`text-[9.5px] font-bold tracking-widest uppercase ${isDark ? 'text-stone-300' : 'text-stone-700'}`}>En Operación</p>
                        <p className={`text-[9px] ${muted}`}>Trazabilidad activa</p>
                      </div>
                    </div>
                  </div>
                </ScrollReveal>

                <ScrollReveal delay={150}>
                  <div>
                    <SectionEyebrow isDark={isDark}>El Campo Real</SectionEyebrow>
                    <h2 className={`serif italic text-[clamp(2rem,4vw,3.2rem)] leading-[1.1] mb-6 ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>
                      Cada animal,<br />
                      <span className="text-gradient">un expediente vivo.</span>
                    </h2>
                    <p className={`text-[14.5px] leading-[1.85] mb-8 ${muted}`}>
                      En el campo mexicano, cada res cruza fronteras regulatorias, veterinarias y comerciales. GANDIA 7 convierte cada animal en una unidad de evidencia digital: biometría nasal, historial médico, geolocalización y cadena documental trazable desde el rancho hasta el mercado internacional.
                    </p>
                    <div className="space-y-3">
                      {[
                        'Identidad permanente por biometría nasal — no depende del arete',
                        'Registro cronológico continuo: eventos, tratamientos, evidencias',
                        'Documentación lista para USDA APHIS, SENASICA y FDA',
                      ].map((item) => (
                        <div key={item} className="flex items-start gap-3">
                          <CheckCircle className="w-4 h-4 text-[#2FAF8F] shrink-0 mt-0.5" strokeWidth={2.5} />
                          <span className={`text-[13px] leading-[1.65] ${muted}`}>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </ScrollReveal>
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════════════════════
              MODULES
          ══════════════════════════════════════════════════════════════════════ */}
          <Section id="modulos" className={isDark ? 'bg-[#0c0a09]' : 'bg-white'}>
            <ScrollReveal>
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
                <div>
                  <SectionEyebrow isDark={isDark}>Sistema Modular</SectionEyebrow>
                  <h2 className={`serif italic text-[clamp(2rem,4vw,3.2rem)] leading-[1.1] ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>
                    Seis capítulos.<br />Un solo animal.
                  </h2>
                </div>
                <p className={`text-[14px] leading-[1.8] max-w-sm ${muted}`}>
                  Cada módulo es un nodo de evidencia. Desde el registro del rancho hasta la certificación de exportación — todo documentado, verificado, trazable.
                </p>
              </div>
            </ScrollReveal>

            <div className={`grid md:grid-cols-[1fr_1fr] gap-px rounded-2xl overflow-hidden border ${divider}`} style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)' }}>
              <ScrollReveal>
                <div className={`blur-reveal-parent chapter-item relative flex flex-col justify-between p-10 md:row-span-2 h-full min-h-[360px] cursor-default ${isDark ? 'bg-[#0e0c0b] hover:bg-[#111009]' : 'bg-stone-50 hover:bg-white'}`}>
                  <div>
                    <div className="flex items-center justify-between mb-8">
                      <span className={`text-[11px] font-semibold tracking-[0.18em] uppercase ${muted}`}>01 — Módulo</span>
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${isDark ? 'border-stone-800/60 bg-stone-900/40' : 'border-stone-200 bg-white'}`}>
                        <Users className="w-4 h-4 text-[#2FAF8F]" strokeWidth={1.75} />
                      </div>
                    </div>
                    <h3 className={`serif italic text-[clamp(2rem,3.5vw,3rem)] leading-[1.05] mb-4 ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>
                      Rancho
                    </h3>
                    <p className={`blur-reveal text-[14px] leading-[1.8] ${muted}`}>
                      Gestión de instalaciones, infraestructura de monitoreo y responsables operativos del ecosistema ganadero. El origen de cada cadena de evidencia comienza aquí.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-8">
                    {['Registro oficial', 'Geolocalización', 'Infraestructura'].map((f) => (
                      <span key={f} className={`text-[11px] font-medium tracking-wide px-3 py-1.5 rounded-full border ${isDark ? 'border-stone-800/80 text-stone-400 bg-stone-900/30' : 'border-stone-200 text-stone-500 bg-white'}`}>{f}</span>
                    ))}
                  </div>
                </div>
              </ScrollReveal>

              <div className="grid grid-cols-2 gap-px" style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)' }}>
                {MODULE_CARDS.slice(1, 5).map((mod, i) => (
                  <ScrollReveal key={mod.num} delay={i * 60}>
                    <div className={`blur-reveal-parent chapter-item relative p-7 h-full cursor-default ${isDark ? 'bg-[#0e0c0b] hover:bg-[#111009]' : 'bg-stone-50 hover:bg-white'}`}>
                      <div className="flex items-start justify-between mb-5">
                        <span className={`text-[10px] font-semibold tracking-[0.18em] uppercase ${muted}`}>{mod.num}</span>
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center border ${isDark ? 'border-stone-800/60 bg-stone-900/30' : 'border-stone-200 bg-white'}`}>
                          <mod.icon className="w-3.5 h-3.5 text-[#2FAF8F]" strokeWidth={1.75} />
                        </div>
                      </div>
                      <h3 className={`serif italic text-[1.4rem] leading-tight mb-2 ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>{mod.title}</h3>
                      <p className={`blur-reveal text-[12.5px] leading-[1.7] ${muted}`}>{mod.description}</p>
                    </div>
                  </ScrollReveal>
                ))}
              </div>

              <ScrollReveal className="md:col-span-2">
                <div
                  className={`blur-reveal-parent chapter-item relative p-8 cursor-default ${isDark ? 'bg-[#0e0d0b] hover:bg-[#101009]' : 'bg-stone-50/80 hover:bg-white'}`}
                  style={{ borderTop: `1px solid ${isDark ? 'rgba(47,175,143,0.15)' : 'rgba(47,175,143,0.12)'}` }}
                >
                  <div className="flex flex-col md:flex-row md:items-center gap-6">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#2FAF8F]/10 border border-[#2FAF8F]/20 shrink-0">
                        <BadgeCheck className="w-5 h-5 text-[#2FAF8F]" strokeWidth={1.5} />
                      </div>
                      <div>
                        <span className={`text-[10px] font-semibold tracking-[0.18em] uppercase block mb-1 ${muted}`}>06 — Módulo</span>
                        <h3 className="serif italic text-[1.5rem] leading-none text-[#2FAF8F]">Certificación</h3>
                      </div>
                    </div>
                    <p className={`blur-reveal text-[13.5px] leading-[1.75] flex-1 ${muted}`}>
                      Emisión de documentos verificables para comercio nacional e internacional con validez regulatoria. El destino final de la cadena de evidencia.
                    </p>
                    <div className="flex flex-wrap gap-2 shrink-0">
                      {['Certificado digital', 'Cumplimiento normativo', 'Exportación'].map((f) => (
                        <span key={f} className="text-[11px] font-medium tracking-wide px-3 py-1.5 rounded-full border border-[#2FAF8F]/20 text-[#2FAF8F] bg-[#2FAF8F]/05">{f}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            </div>

            <ScrollReveal delay={200} className="mt-16">
              <div className={`border-t pr-2 ${divider}`}>
                <div className="flex items-center justify-between py-4 mb-2">
                  <p className={`text-[10.5px] font-semibold tracking-[0.16em] uppercase ${muted}`}>Flujo del sistema</p>
                  <p className={`text-[10.5px] font-semibold tracking-[0.16em] uppercase ${muted}`}>De rancho a certificación</p>
                </div>
                {[
                  { n: '01', label: 'Rancho',         sub: 'Unidad de Producción Pecuaria' },
                  { n: '02', label: 'Animal',          sub: 'Registro e identidad biométrica' },
                  { n: '03', label: 'Pasaporte',       sub: 'Documento oficial individual' },
                  { n: '04', label: 'Gemelo Digital',  sub: 'Expediente vivo en plataforma' },
                  { n: '05', label: 'Monitoreo',       sub: 'Trazabilidad continua en campo' },
                  { n: '06', label: 'Auditoría',       sub: 'Verificación institucional' },
                  { n: '07', label: 'Certificación',   sub: 'Habilitación para exportación' },
                ].map(({ n, label, sub }, i, arr) => (
                  <div
                    key={n}
                    className={`group flex items-center justify-between py-4 px-4 border-t transition-colors duration-200 cursor-default ${divider} ${
                      isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-black/[0.015]'
                    } ${i === arr.length - 1 ? `border-b ${divider}` : ''}`}
                  >
                    <div className="flex items-center gap-8 min-w-0 flex-1">
                      <span className={`serif italic text-[clamp(2rem,3.5vw,2.8rem)] leading-none tabular-nums shrink-0 transition-colors duration-200 ${
                        i === arr.length - 1 ? 'text-[#2FAF8F]' : isDark ? 'text-stone-800 group-hover:text-stone-600' : 'text-stone-200 group-hover:text-stone-300'
                      }`}>{n}</span>
                      <span className={`text-[clamp(1.1rem,2vw,1.5rem)] font-light tracking-tight transition-colors duration-200 ${
                        i === arr.length - 1 ? 'text-[#2FAF8F]' : isDark ? 'text-stone-100 group-hover:text-white' : 'text-stone-800 group-hover:text-stone-900'
                      }`}>{label}</span>
                    </div>
                    <span className={`text-[11.5px] tracking-wide transition-opacity duration-200 opacity-0 group-hover:opacity-100 shrink-0 whitespace-nowrap ml-6 text-right ${muted}`}>{sub}</span>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </Section>


          {/* ══════════════════════════════════════════════════════════════════════
              PRODUCT SHOWCASE — Cinematic Netflix Carousel
          ══════════════════════════════════════════════════════════════════════ */}
          <ShowcaseCarousel />


          {/* ══════════════════════════════════════════════════════════════════════
              TECH PILLARS
          ══════════════════════════════════════════════════════════════════════ */}
          <section className={`py-24 px-6 border-t border-b ${divider} ${isDark ? 'bg-[#0e0c0b]' : 'bg-stone-50/60'}`}>
            <div className="max-w-6xl mx-auto">
              <ScrollReveal>
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-14">
                  <div>
                    <SectionEyebrow isDark={isDark}>Tecnología</SectionEyebrow>
                    <h2 className={`serif italic text-[clamp(2rem,4vw,3rem)] leading-[1.1] ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>
                      Cuatro pilares.<br />Un sistema robusto.
                    </h2>
                  </div>
                  <p className={`text-[14px] leading-[1.8] max-w-xs ${muted}`}>
                    Arquitectura diseñada para el campo real. No para el laboratorio.
                  </p>
                </div>
              </ScrollReveal>

              <div className={`grid grid-cols-2 md:grid-cols-4 gap-px rounded-2xl overflow-hidden border ${divider}`} style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)' }}>
                {TECH_PILLARS.map(({ Icon, title, desc }, i) => (
                  <ScrollReveal key={title} delay={i * 70}>
                    <div className={`blur-reveal-parent chapter-item relative group p-8 h-full cursor-default ${isDark ? 'bg-[#0e0c0b] hover:bg-[#111009]' : 'bg-stone-50 hover:bg-white'}`}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border mb-6 transition-colors duration-300 ${isDark ? 'border-stone-800/60 bg-stone-900/30 group-hover:border-[#2FAF8F]/25 group-hover:bg-[#2FAF8F]/05' : 'border-stone-200 bg-white group-hover:border-[#2FAF8F]/30'}`}>
                        <Icon className="w-4.5 h-4.5 text-[#2FAF8F]" strokeWidth={1.5} />
                      </div>
                      <h3 className={`text-[13px] font-semibold mb-3 ${isDark ? 'text-stone-200' : 'text-stone-800'}`}>{title}</h3>
                      <p className={`blur-reveal text-[12.5px] leading-[1.75] ${muted}`}>{desc}</p>
                    </div>
                  </ScrollReveal>
                ))}
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════════════════════
              BENEFITS
          ══════════════════════════════════════════════════════════════════════ */}
          <Section id="beneficios" className={isDark ? 'bg-[#0c0a09]' : 'bg-white'}>
            <ScrollReveal>
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
                <div>
                  <SectionEyebrow isDark={isDark}>Para cada actor</SectionEyebrow>
                  <h2 className={`serif italic text-[clamp(2rem,4vw,3rem)] leading-[1.1] ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>
                    El ecosistema.<br />Completo.
                  </h2>
                </div>
                <p className={`text-[14px] leading-[1.8] max-w-xs ${muted}`}>
                  Cada rol tiene acceso diferenciado y valor específico. Sin suscripciones forzosas. Sin accesos genéricos.
                </p>
              </div>
            </ScrollReveal>

            <div className={`grid grid-cols-1 md:grid-cols-2 gap-px rounded-2xl overflow-hidden border ${divider}`} style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)' }}>
              {BENEFIT_CARDS.map((card, i) => (
                <ScrollReveal key={card.role} delay={i * 70}>
                  <div className={`blur-reveal-parent chapter-item relative p-10 h-full cursor-default ${isDark ? 'bg-[#0e0c0b] hover:bg-[#111009]' : 'bg-stone-50 hover:bg-white'}`}>
                    <h3 className={`serif italic text-[clamp(1.8rem,3vw,2.4rem)] leading-none mb-1 ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>
                      {card.role}
                    </h3>
                    <p className="text-[10.5px] font-semibold tracking-[0.14em] uppercase text-[#2FAF8F] mb-7">{card.tag}</p>
                    <ul className="blur-reveal space-y-0">
                      {card.benefits.map((b, bi) => (
                        <li
                          key={b}
                          className={`flex items-start gap-3 py-3 text-[13.5px] leading-[1.65] ${bi < card.benefits.length - 1 ? `border-b ${divider}` : ''} ${muted}`}
                        >
                          <span className="text-[#2FAF8F] font-medium shrink-0 mt-0.5">—</span>
                          {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </Section>

          {/* ══════════════════════════════════════════════════════════════════════
              VIDEO
          ══════════════════════════════════════════════════════════════════════ */}
          <Section className={`border-t ${divider} ${isDark ? 'bg-[#0c0a09]' : 'bg-white'}`}>
            <ScrollReveal>
              <div className="text-center mb-10">
                <SectionEyebrow isDark={isDark}>Sistema en Acción</SectionEyebrow>
                <h2 className={`serif italic text-[clamp(1.8rem,4vw,2.8rem)] leading-[1.15] ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>
                  Trazabilidad digital en tiempo real.
                </h2>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={100}>
              <div className="max-w-4xl mx-auto">
                <div className={`relative rounded-2xl overflow-hidden shadow-2xl ring-1 ring-inset ${isDark ? 'ring-white/8' : 'ring-black/5'}`}>
                  <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                    <iframe
                      className="absolute inset-0 w-full h-full"
                      src="https://www.youtube.com/embed/dQw4w9WgXcQ?controls=1&modestbranding=1&rel=0"
                      title="GANDIA 7 - Sistema de Trazabilidad Ganadera"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      loading="lazy"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-6 mt-10">
                  {[['99.9%', 'Disponibilidad del Sistema'], ['48h', 'Certificación Promedio'], ['24/7', 'Monitoreo Continuo']].map(([v, l]) => (
                    <div key={l} className="text-center">
                      <p className="serif italic text-[clamp(1.8rem,4vw,2.5rem)] leading-none text-[#2FAF8F] mb-1.5">{v}</p>
                      <p className={`text-[12px] ${muted}`}>{l}</p>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollReveal>
          </Section>

          {/* ══════════════════════════════════════════════════════════════════════
              MODELO OPERATIVO
          ══════════════════════════════════════════════════════════════════════ */}
          <Section className={`border-t ${divider} ${isDark ? 'bg-[#0e0c0b]' : 'bg-stone-50/60'}`}>
            <div className="grid md:grid-cols-2 gap-16 items-start mb-14">
              <ScrollReveal>
                <SectionEyebrow isDark={isDark}>Modelo Operativo</SectionEyebrow>
                <h2 className={`serif italic text-[clamp(2rem,4vw,3rem)] leading-[1.1] mb-6 ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>
                  Infraestructura bajo consumo habilitado.
                </h2>
                <p className={`text-[14px] leading-[1.75] mb-8 ${muted}`}>
                  GANDIA 7 no opera bajo suscripción mensual. El sistema funciona mediante habilitación institucional y consumo operativo según el rol — pagas exclusivamente por acciones que generan valor documental oficial.
                </p>
                <div className={`rounded-2xl border p-6 mb-6 relative overflow-hidden ${isDark ? 'bg-[#141210] border-stone-800/60' : 'bg-white border-stone-200'}`}>
                  <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#2FAF8F] to-[#5DD9B0] rounded-l-2xl" />
                  <p className={`text-[10px] font-semibold tracking-[0.14em] uppercase mb-3 pl-3 ${muted}`}>Principio Fundamental</p>
                  <p className={`serif italic text-[1.15rem] leading-[1.55] pl-3 ${isDark ? 'text-stone-200' : 'text-stone-800'}`}>
                    "No vendemos software. Habilitamos certeza verificable."
                  </p>
                </div>
                <button
                  onClick={() => navigate('/modelo-operativo')}
                  className="group flex items-center gap-2 text-[13px] font-medium text-[#2FAF8F] hover:text-[#1a9070] transition-colors"
                >
                  Ver modelo operativo completo
                  <svg className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </button>
              </ScrollReveal>

              <ScrollReveal delay={100}>
                <div className={`rounded-2xl border overflow-hidden ${isDark ? 'border-stone-800/60' : 'border-stone-200'}`}>
                  {MODELO_PILLARS.map(({ Icon, label, desc }, i) => (
                    <div key={label} className={`blur-reveal-parent flex gap-4 p-6 ${i < MODELO_PILLARS.length - 1 ? `border-b ${divider}` : ''} ${isDark ? 'bg-[#0e0c0b]' : 'bg-stone-50/40'}`}>
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 mt-0.5 ${isDark ? 'border-stone-800/60 bg-stone-900/30' : 'border-stone-200 bg-white'}`}>
                        <Icon className="w-4 h-4 text-[#2FAF8F]" strokeWidth={1.75} />
                      </div>
                      <div>
                        <p className={`text-[13px] font-semibold mb-1 ${isDark ? 'text-stone-200' : 'text-stone-800'}`}>{label}</p>
                        <p className={`blur-reveal text-[12.5px] leading-[1.7] ${muted}`}>{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollReveal>
            </div>
          </Section>

          {/* ══════════════════════════════════════════════════════════════════════
              CTA FINAL
          ══════════════════════════════════════════════════════════════════════ */}
          <Section id="acceso" className={`relative overflow-hidden border-t ${divider} ${isDark ? 'bg-[#0e0c0b]' : 'bg-stone-50/60'}`}>
            <div className="absolute inset-0 pointer-events-none" style={{
              backgroundImage: isDark
                ? 'radial-gradient(ellipse 60% 50% at 50% 100%, rgba(47,175,143,0.07) 0%, transparent 70%)'
                : 'radial-gradient(ellipse 60% 50% at 50% 100%, rgba(47,175,143,0.09) 0%, transparent 70%)',
            }} />
            <div className="max-w-3xl mx-auto text-center relative">
              <ScrollReveal>
                <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl border mb-8 mx-auto ${isDark ? 'bg-[#141210] border-stone-800/60' : 'bg-white border-stone-200'}`}>
                  <GandiaLogo className="w-7 h-7 text-[#2FAF8F]" />
                </div>
                <h2 className={`serif italic text-[clamp(2.2rem,5vw,3.8rem)] leading-[1.1] mb-5 ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>
                  Comienza a construir<br />
                  <span className="text-gradient">certeza ganadera.</span>
                </h2>
                <p className={`text-[14.5px] leading-[1.8] mb-10 max-w-xl mx-auto ${muted}`}>
                  GANDIA 7 opera mediante autorización controlada para productores, veterinarios, autoridades sanitarias y entidades certificadoras. Acceso escalonado por rol con tier gratuito hasta 20 animales.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center mb-14">
                  <button
                    onClick={() => navigate('/signup')}
                    className={`group flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-[13.5px] font-medium border transition-all hover:scale-[1.01] active:scale-[0.99] ${isDark ? 'border-stone-700 text-stone-300 hover:border-stone-500 hover:bg-stone-900/40' : 'border-stone-300 text-stone-700 hover:border-stone-400 hover:bg-stone-50'}`}
                  >
                    Solicitar Acceso
                    <svg className="w-3.5 h-3.5 transition-transform group-hover:rotate-45" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M7 17L17 7M17 7H7M17 7V17" /></svg>
                  </button>
                  <button
                    onClick={() => navigate('/login')}
                    className="btn-primary group flex items-center justify-center gap-2 px-8 py-4 bg-[#171717] dark:bg-[#FAFAFA] text-white dark:text-[#171717] rounded-xl text-[13.5px] font-semibold transition-all hover:opacity-90 hover:shadow-xl hover:shadow-black/20 active:scale-[0.97]"
                  >
                    Iniciar Sesión
                    <svg className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                  </button>
                </div>
                <div className={`flex flex-wrap items-center justify-center gap-5 mb-16 ${muted}`}>
                  {['Tier gratuito · hasta 20 animales', 'Sin tarjeta de crédito', 'Acceso en 48h'].map((t) => (
                    <div key={t} className="flex items-center gap-1.5 text-[12px]">
                      <CheckCircle className="w-3 h-3 text-[#2FAF8F]" strokeWidth={2.5} />
                      <span>{t}</span>
                    </div>
                  ))}
                </div>
              </ScrollReveal>

              <ScrollReveal delay={100}>
                <div className={`border-t ${divider} pt-10 text-left`}>
                  <p className={`text-[11px] font-semibold tracking-[0.12em] uppercase mb-6 text-center ${muted}`}>Preguntas Frecuentes</p>
                  <div>
                    <Accordion title="¿Quién puede acceder al sistema?" isDark={isDark}>
                      El acceso está restringido a productores registrados, veterinarios certificados (MVZ), autoridades sanitarias oficiales y organismos certificadores autorizados. Las credenciales son emitidas únicamente por entidades reguladoras.
                    </Accordion>
                    <Accordion title="¿Cómo se emite un certificado de exportación?" isDark={isDark}>
                      Los certificados se generan automáticamente una vez que el animal ha completado todos los procesos de auditoría y cumple con los estándares internacionales (USDA ADT, NOM aplicables). El documento digital es verificable mediante códigos únicos y trazabilidad completa en blockchain.
                    </Accordion>
                    <Accordion title="¿Qué normativas cumple el sistema?" isDark={isDark}>
                      GANDIA 7 cumple con la Ley Federal de Sanidad Animal, NOM-001-SAG/GAN-2015, NOM-051-ZOO-1995, protocolos SENASICA/SADER, la Regla Final de Trazabilidad USDA APHIS (noviembre 2024) y directrices de la OMSA para identificación única y trazabilidad bidireccional.
                    </Accordion>
                    <Accordion title="¿El sistema funciona sin internet?" isDark={isDark}>
                      Sí. GANDIA 7 es Offline-First: opera con plena funcionalidad en zonas sin señal. La evidencia se firma criptográficamente en el dispositivo y se sincroniza de forma controlada al recuperar conectividad. Ningún registro crítico se pierde.
                    </Accordion>
                    <Accordion title="¿Cómo protege los datos el sistema?" isDark={isDark}>
                      Cifrado AES-256 en reposo, TLS 1.3 en tránsito, Row Level Security en PostgreSQL (ningún usuario ve datos fuera de su entidad), y hashes SHA-256 en blockchain. La información es propiedad del generador — GANDIA actúa únicamente como custodio técnico neutral.
                    </Accordion>
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </Section>

        </main>

        <Footer isDark={isDark} />
        <CookieBanner isDark={isDark} />
      </div>
    </>
  )
}

export default Home