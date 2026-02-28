import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Footer from '../../components/ui/Footer'
import Header from '../../components/ui/Header'
import {
  Download,
  ExternalLink,
  Search,
  Clock,
  CheckCircle,
  FileText,
  Video,
  Code,
  BookOpen,
  Users,
  Building2,
  Workflow,
  Sparkles,
  TrendingUp,
  Calendar,
  Command,
  ArrowRight,
  X,
} from 'lucide-react'

// ─── TYPES ────────────────────────────────────────────────────────────────────
type RecursoEstado = 'disponible' | 'proximamente' | 'externo' | 'desarrollo'
type CategoriaRecurso = 'guias' | 'manuales' | 'tecnicos' | 'videos' | 'integraciones'

interface Recurso {
  id: string
  titulo: string
  descripcion: string
  categoria: CategoriaRecurso
  estado: RecursoEstado
  tipo: 'PDF' | 'Video' | 'Documento' | 'API'
  tamano?: string
  duracion?: string
  fecha: string
  fechaDisponibilidad?: string
  icono: React.ElementType
  url?: string
  destacado?: boolean
  roles?: string[]
  descargas?: number
  progreso?: number
  nuevo?: boolean
}

interface TimelineItem {
  mes: string
  items: {
    titulo: string
    estado: 'completado' | 'en-progreso' | 'planeado'
    progreso?: number
  }[]
}

// ─── HOOKS ────────────────────────────────────────────────────────────────────
const useTheme = () => {
  const [isDark, setIsDark] = useState<boolean>(() =>
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

const useInView = (threshold = 0.07) => {
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

// ─── REVEAL ───────────────────────────────────────────────────────────────────
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

// ─── MAIN ─────────────────────────────────────────────────────────────────────
function RecursosPage() {
  const { isDark } = useTheme()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [categoriaActiva, setCategoriaActiva] = useState<CategoriaRecurso | 'todos'>('todos')
  const searchInputRef = useRef<HTMLInputElement>(null)

  // CMD+K shortcut
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(p => !p)
        setTimeout(() => searchInputRef.current?.focus(), 80)
      }
      if (e.key === 'Escape') setSearchOpen(false)
    }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [])

  // Theme tokens — idénticos al sistema GANDIA
  const bg  = isDark ? '#0c0a09' : '#fafaf9'
  const bg2 = isDark ? '#141210' : '#f4f2f0'
  const bg3 = isDark ? '#1c1917' : '#ffffff'
  const bdr = isDark ? 'rgba(68,64,60,0.5)' : 'rgba(214,211,208,0.7)'
  const tx1 = isDark ? '#fafafa'  : '#171717'
  const tx2 = isDark ? '#a8a29e'  : '#78716c'

  // ── DATA ──────────────────────────────────────────────────────────────────
  const recursos: Recurso[] = useMemo(() => [
    {
      id: 'guia-inicio-productores',
      titulo: 'Guía de Inicio para Productores',
      descripcion: 'Primeros pasos en GANDIA 7: registro de rancho, alta de animales y navegación básica del sistema.',
      categoria: 'guias', estado: 'disponible', tipo: 'PDF', tamano: '2.8 MB',
      fecha: '13 Feb 2026', icono: BookOpen, destacado: true, roles: ['Productor'], descargas: 234, nuevo: true,
    },
    {
      id: 'doc-api',
      titulo: 'Documentación API REST',
      descripcion: 'Referencia completa de endpoints, autenticación OAuth 2.0 y ejemplos de integración.',
      categoria: 'tecnicos', estado: 'externo', tipo: 'Documento',
      fecha: '10 Feb 2026', icono: Code, url: 'https://docs.gandia7.mx/api', destacado: true, descargas: 89,
    },
    {
      id: 'video-onboarding',
      titulo: 'Bienvenida a GANDIA 7',
      descripcion: 'Tour completo del sistema: navegación, módulos principales y primeras acciones.',
      categoria: 'videos', estado: 'disponible', tipo: 'Video', duracion: '8:24',
      fecha: '8 Feb 2026', icono: Video, destacado: true, roles: ['Todos'], descargas: 456, nuevo: true,
    },
    {
      id: 'manual-pasaportes',
      titulo: 'Manual de Pasaportes Digitales',
      descripcion: 'Creación, edición y gestión de pasaportes. Incluye identificación biométrica y vinculación RFID.',
      categoria: 'manuales', estado: 'disponible', tipo: 'PDF', tamano: '4.1 MB',
      fecha: '5 Feb 2026', icono: FileText, roles: ['Productor', 'MVZ'], descargas: 167,
    },
    {
      id: 'guia-mvz',
      titulo: 'Guía MVZ: Certificación Digital',
      descripcion: 'Emisión de dictámenes, certificados sanitarios y vinculación con expedientes oficiales.',
      categoria: 'guias', estado: 'proximamente', tipo: 'PDF',
      fecha: 'Marzo 2026', fechaDisponibilidad: 'Marzo 2026', icono: FileText, roles: ['MVZ'], progreso: 75,
    },
    {
      id: 'guia-exportacion',
      titulo: 'Guía de Exportación USDA',
      descripcion: 'Preparación de expedientes conforme requisitos USDA-APHIS para exportación a Estados Unidos.',
      categoria: 'guias', estado: 'proximamente', tipo: 'PDF',
      fecha: 'Marzo 2026', fechaDisponibilidad: 'Marzo 2026', icono: Building2, roles: ['Exportador'], progreso: 60,
    },
    {
      id: 'manual-gemelos',
      titulo: 'Manual de Gemelos Digitales',
      descripcion: 'Registro cronológico, evidencias multimedia y sincronización con monitoreo en tiempo real.',
      categoria: 'manuales', estado: 'desarrollo', tipo: 'PDF',
      fecha: 'Abril 2026', fechaDisponibilidad: 'Abril 2026', icono: Workflow, progreso: 35,
    },
    {
      id: 'videos-tutoriales',
      titulo: 'Serie de Tutoriales Avanzados',
      descripcion: 'Colección de 5 videos sobre módulos específicos: auditoría, certificación y exportación.',
      categoria: 'videos', estado: 'desarrollo', tipo: 'Video',
      fecha: 'Abril 2026', fechaDisponibilidad: 'Abril 2026', icono: Video, progreso: 20,
    },
    {
      id: 'integracion-senasica',
      titulo: 'Integración SENASICA',
      descripcion: 'Documentación técnica para sincronización con sistemas oficiales y validación automática.',
      categoria: 'integraciones', estado: 'desarrollo', tipo: 'Documento',
      fecha: 'Mayo 2026', fechaDisponibilidad: 'Mayo 2026', icono: Building2, progreso: 15,
    },
    {
      id: 'sdk-nodejs',
      titulo: 'SDK Node.js',
      descripcion: 'Librería oficial para integración con GANDIA 7 API en aplicaciones Node.js.',
      categoria: 'integraciones', estado: 'desarrollo', tipo: 'API',
      fecha: 'Mayo 2026', fechaDisponibilidad: 'Mayo 2026', icono: Code, progreso: 10,
    },
  ], [])

  const roadmapTimeline: TimelineItem[] = [
    {
      mes: 'Febrero 2026',
      items: [
        { titulo: 'Guía de Inicio Productores', estado: 'completado' },
        { titulo: 'Video de Bienvenida', estado: 'completado' },
        { titulo: 'Manual de Pasaportes', estado: 'completado' },
      ],
    },
    {
      mes: 'Marzo 2026',
      items: [
        { titulo: 'Guía MVZ Certificación', estado: 'en-progreso', progreso: 75 },
        { titulo: 'Guía de Exportación USDA', estado: 'en-progreso', progreso: 60 },
      ],
    },
    {
      mes: 'Abril 2026',
      items: [
        { titulo: 'Manual Gemelos Digitales', estado: 'planeado' },
        { titulo: 'Serie Tutoriales (5 videos)', estado: 'planeado' },
      ],
    },
    {
      mes: 'Mayo 2026',
      items: [
        { titulo: 'Integración SENASICA', estado: 'planeado' },
        { titulo: 'SDK Node.js', estado: 'planeado' },
      ],
    },
  ]

  // ── COMPUTED ───────────────────────────────────────────────────────────────
  const recursosDisponibles = recursos.filter(r => r.estado === 'disponible' || r.estado === 'externo')
  const recursosProximamente = recursos.filter(r => r.estado === 'proximamente' || r.estado === 'desarrollo')
  const recursosDestacados  = recursos.filter(r => r.destacado && (r.estado === 'disponible' || r.estado === 'externo'))

  const recursosFiltrados = useMemo(() => {
    let f = recursos
    if (categoriaActiva !== 'todos') f = f.filter(r => r.categoria === categoriaActiva)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      f = f.filter(r => r.titulo.toLowerCase().includes(q) || r.descripcion.toLowerCase().includes(q) || r.roles?.some(ro => ro.toLowerCase().includes(q)))
    }
    return f
  }, [recursos, categoriaActiva, searchQuery])

  // ── HANDLERS ───────────────────────────────────────────────────────────────
  const handleDescargar = useCallback((recurso: Recurso) => {
    if (recurso.estado === 'externo' && recurso.url) {
      window.open(recurso.url, '_blank', 'noopener,noreferrer')
      return
    }
    if (recurso.estado === 'disponible') {
      const link = document.createElement('a')
      link.href = `/api/recursos/descargar/${recurso.id}`
      link.download = `${recurso.id}.${recurso.tipo.toLowerCase()}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }, [])

  // ── ESTADO BADGE ───────────────────────────────────────────────────────────
  const EstadoBadge = ({ estado, progreso }: { estado: RecursoEstado; progreso?: number }) => {
    const map = {
      disponible:   { label: 'Disponible',    cls: 'bg-[#2FAF8F]/10 text-[#2FAF8F] border-[#2FAF8F]/25',   Icon: CheckCircle },
      externo:      { label: 'Externo',        cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20',       Icon: ExternalLink },
      proximamente: { label: 'Próximamente',   cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20',    Icon: Clock },
      desarrollo:   { label: 'En desarrollo',  cls: 'bg-purple-500/10 text-purple-400 border-purple-500/20', Icon: Sparkles },
    }
    const { label, cls, Icon } = map[estado]
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-semibold border tracking-[0.03em] ${cls}`}>
        <Icon className="w-3 h-3" strokeWidth={2} />
        {label}
        {progreso !== undefined && estado !== 'disponible' && estado !== 'externo' && (
          <span className="opacity-60">· {progreso}%</span>
        )}
      </span>
    )
  }

  // ── RECURSO CARD ───────────────────────────────────────────────────────────
  const RecursoCard = ({ recurso, hero = false }: { recurso: Recurso; hero?: boolean }) => {
    const Icon = recurso.icono
    const isAvailable = recurso.estado === 'disponible' || recurso.estado === 'externo'
    const isDimmed = !isAvailable

    return (
      <div
        onClick={() => isAvailable && handleDescargar(recurso)}
        className={`group relative rounded-2xl border transition-all duration-300 overflow-hidden ${hero ? 'p-7' : 'p-6'} ${
          isAvailable ? 'cursor-pointer' : 'cursor-default'
        } ${isDimmed ? 'opacity-55' : ''}`}
        style={{
          backgroundColor: bg3,
          borderColor: bdr,
        }}
        onMouseEnter={e => {
          if (!isAvailable) return
          ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(47,175,143,0.4)'
          ;(e.currentTarget as HTMLElement).style.boxShadow = isDark
            ? '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(47,175,143,0.1)'
            : '0 20px 60px rgba(0,0,0,0.08), 0 0 0 1px rgba(47,175,143,0.12)'
          ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'
        }}
        onMouseLeave={e => {
          ;(e.currentTarget as HTMLElement).style.borderColor = bdr
          ;(e.currentTarget as HTMLElement).style.boxShadow = 'none'
          ;(e.currentTarget as HTMLElement).style.transform = 'none'
        }}
      >
        {/* Top accent on hover */}
        {isAvailable && (
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#2FAF8F]/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        )}

        {/* Nuevo badge */}
        {recurso.nuevo && (
          <div className="absolute top-4 right-4">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#2FAF8F] text-white tracking-[0.05em] uppercase">
              <Sparkles className="w-2.5 h-2.5" strokeWidth={2.5} />
              Nuevo
            </span>
          </div>
        )}

        {/* Header */}
        <div className="flex items-start gap-4 mb-5">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105"
            style={{ backgroundColor: isDark ? 'rgba(47,175,143,0.1)' : 'rgba(47,175,143,0.08)' }}
          >
            <Icon className="w-5 h-5 text-[#2FAF8F]" strokeWidth={1.75} />
          </div>
          <div className="flex-1 min-w-0 pt-0.5">
            <EstadoBadge estado={recurso.estado} progreso={recurso.progreso} />
          </div>
        </div>

        {/* Title + desc */}
        <h3
          className={`font-semibold leading-snug mb-2.5 transition-colors duration-200 ${hero ? 'text-[17px]' : 'text-[14.5px]'} ${isAvailable ? 'group-hover:text-[#2FAF8F]' : ''}`}
          style={{ color: tx1 }}
        >
          {recurso.titulo}
        </h3>
        <p className="text-[12.5px] leading-[1.72] mb-5" style={{ color: tx2 }}>
          {recurso.descripcion}
        </p>

        {/* Meta row */}
        <div className="flex items-center gap-3 text-[11px] mb-4" style={{ color: tx2 }}>
          <span
            className="px-2 py-0.5 rounded-md font-medium"
            style={{ backgroundColor: isDark ? 'rgba(68,64,60,0.5)' : 'rgba(214,211,208,0.4)' }}
          >
            {recurso.tipo}
          </span>
          {recurso.tamano && <span>{recurso.tamano}</span>}
          {recurso.duracion && <span>{recurso.duracion}</span>}
          {recurso.descargas && recurso.descargas > 0 && (
            <span className="flex items-center gap-1 text-[#2FAF8F]">
              <TrendingUp className="w-3 h-3" strokeWidth={2} />
              {recurso.descargas}
            </span>
          )}
          {recurso.roles && recurso.roles.length > 0 && (
            <>
              <span>·</span>
              <span className="text-[#2FAF8F]">{recurso.roles.join(', ')}</span>
            </>
          )}
        </div>

        {/* Footer action */}
        {isAvailable && (
          <div className="flex items-center justify-between">
            <span className="text-[11px]" style={{ color: tx2 }}>{recurso.fecha}</span>
            <div className="flex items-center gap-1.5 text-[11.5px] font-medium text-stone-400 group-hover:text-[#2FAF8F] transition-colors duration-200">
              {recurso.estado === 'externo' ? (
                <><span>Abrir</span><ExternalLink className="w-3.5 h-3.5" strokeWidth={2} /></>
              ) : (
                <><span>Descargar</span><Download className="w-3.5 h-3.5" strokeWidth={2} /></>
              )}
            </div>
          </div>
        )}

        {/* Progress bar */}
        {recurso.progreso !== undefined && (recurso.estado === 'proximamente' || recurso.estado === 'desarrollo') && (
          <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${bdr}` }}>
            <div className="flex items-center justify-between text-[10.5px] mb-2">
              <span style={{ color: tx2 }}>Progreso de producción</span>
              <span style={{ color: '#2FAF8F' }} className="font-semibold">{recurso.progreso}%</span>
            </div>
            <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: isDark ? 'rgba(68,64,60,0.5)' : 'rgba(214,211,208,0.5)' }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${recurso.progreso}%`, background: 'linear-gradient(90deg, #2FAF8F, #1d9070)' }}
              />
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── CATEGORÍAS ─────────────────────────────────────────────────────────────
  const CATS: { id: CategoriaRecurso | 'todos'; label: string; Icon?: React.ElementType }[] = [
    { id: 'todos',         label: 'Todos' },
    { id: 'guias',         label: 'Guías',         Icon: BookOpen },
    { id: 'manuales',      label: 'Manuales',       Icon: Users },
    { id: 'tecnicos',      label: 'Técnicos',       Icon: Code },
    { id: 'videos',        label: 'Videos',         Icon: Video },
    { id: 'integraciones', label: 'Integraciones',  Icon: Building2 },
  ]

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital,wght@0,400;1,400&family=Geist:wght@300;400;500;600&display=swap');

        .rp * { -webkit-font-smoothing: antialiased; box-sizing: border-box; }
        .rp   { font-family: 'Geist', system-ui, sans-serif; }
        .rp-s { font-family: 'Instrument Serif', Georgia, serif; }

        .rp *:focus         { outline: none !important; }
        .rp *:focus-visible { outline: 2px solid #2FAF8F !important; outline-offset: 3px; border-radius: 6px; }
        .rp-search-input:focus, .rp-search-input:focus-visible { outline: none !important; box-shadow: none !important; }

        /* Noise grain */
        .rp-noise::after {
          content: ''; position: absolute; inset: 0; pointer-events: none; z-index: 1;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.025'/%3E%3C/svg%3E");
          mix-blend-mode: overlay;
        }

        /* Hero entrance */
        @keyframes rp-in { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:translateY(0) } }
        .rp-h1 { animation: rp-in 820ms cubic-bezier(.16,1,.3,1) 60ms  both; }
        .rp-h2 { animation: rp-in 820ms cubic-bezier(.16,1,.3,1) 180ms both; }
        .rp-h3 { animation: rp-in 820ms cubic-bezier(.16,1,.3,1) 300ms both; }
        .rp-h4 { animation: rp-in 820ms cubic-bezier(.16,1,.3,1) 420ms both; }
        .rp-h5 { animation: rp-in 820ms cubic-bezier(.16,1,.3,1) 520ms both; }

        /* Pulse dot */
        @keyframes rp-pulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(47,175,143,.45); }
          60%      { box-shadow: 0 0 0 7px rgba(47,175,143,0); }
        }
        .rp-pulse { animation: rp-pulse 2.4s ease-in-out infinite; }

        /* Search modal */
        @keyframes rp-modal { from { opacity:0; transform:translateY(-8px) scale(.97) } to { opacity:1; transform:translateY(0) scale(1) } }
        .rp-modal { animation: rp-modal 200ms cubic-bezier(.16,1,.3,1) both; }

        /* Marquee */
        @keyframes rp-mq { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        .rp-mq { animation: rp-mq 32s linear infinite; width: max-content; }
        .rp-mq:hover { animation-play-state: paused; }

        /* Shimmer stat */
        @keyframes rp-sh { 0%{background-position:-200% center} 100%{background-position:200% center} }
        .rp-shimmer {
          background: linear-gradient(90deg,#2FAF8F 0%,#7ee8c8 40%,#2FAF8F 60%,#1d9070 100%);
          background-size: 200% auto;
          -webkit-background-clip: text; background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: rp-sh 4s linear infinite;
        }

        /* CTA ambient orbs */
        @keyframes rp-ca1 { 0%,100%{transform:scale(1);opacity:.07}    50%{transform:scale(1.12);opacity:.14} }
        @keyframes rp-ca2 { 0%,100%{transform:scale(1.05);opacity:.05} 50%{transform:scale(0.95);opacity:.10} }
        .rp-ca1 { animation: rp-ca1 9s ease-in-out infinite; }
        .rp-ca2 { animation: rp-ca2 12s ease-in-out 2s infinite; }

        /* Scrollbar */
        .rp ::-webkit-scrollbar { width: 3px; }
        .rp ::-webkit-scrollbar-track { background: transparent; }
        .rp ::-webkit-scrollbar-thumb { background: rgba(68,64,60,0.5); border-radius: 999px; }

        /* g-line */
        .rp-gline { background: linear-gradient(90deg,transparent 0%,#2FAF8F 40%,#2FAF8F 60%,transparent 100%); height:1px; opacity:.25; }
      `}</style>

      <div className="rp min-h-screen" style={{ backgroundColor: bg, color: tx1 }}>
        <Header currentSection="recursos" isDark={isDark} />

        {/* ═══════════════════════════════════════════════════════
            HERO
        ═══════════════════════════════════════════════════════ */}
        <section className="rp-noise relative overflow-hidden" style={{ borderBottom: `1px solid ${bdr}` }}>
          {/* Ambient background */}
          <div className="absolute inset-0 pointer-events-none" style={{
            backgroundImage: `
              radial-gradient(ellipse 70% 55% at 50% 100%, ${isDark ? 'rgba(47,175,143,0.08)' : 'rgba(47,175,143,0.09)'} 0%, transparent 70%),
              radial-gradient(ellipse 45% 40% at 15% 20%, ${isDark ? 'rgba(47,175,143,0.04)' : 'rgba(47,175,143,0.05)'} 0%, transparent 55%)
            `,
          }} />

          <div style={{ maxWidth: 1152, margin: '0 auto', padding: '64px 32px 72px', position: 'relative', zIndex: 2, textAlign: 'center' }}>

            {/* Eyebrow */}
            <div className="rp-h1 flex items-center justify-center gap-2.5" style={{ marginBottom: 28 }}>
              <span className="rp-pulse" style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#2FAF8F', flexShrink: 0, display: 'inline-block' }} />
              <span style={{ width: 20, height: 1, backgroundColor: 'rgba(47,175,143,.5)', flexShrink: 0, display: 'inline-block' }} />
              <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: tx2 }}>
                Centro de Recursos · GANDIA 7
              </span>
              <span style={{ width: 20, height: 1, backgroundColor: 'rgba(47,175,143,.5)', flexShrink: 0, display: 'inline-block' }} />
            </div>

            {/* Main headline */}
            <h1 className="rp-h2 rp-s" style={{ fontSize: 'clamp(3rem,7vw,5.5rem)', lineHeight: 1.06, fontStyle: 'italic', letterSpacing: '-0.01em', marginBottom: 16 }}>
              Todo para dominar<br />GANDIA 7.
            </h1>
            <p className="rp-h3" style={{ fontSize: 15, lineHeight: 1.82, color: tx2, maxWidth: 520, margin: '0 auto 40px' }}>
              Documentación técnica, guías operativas y tutoriales para maximizar el uso de la plataforma.
            </p>

            {/* Search trigger */}
            <div className="rp-h4" style={{ maxWidth: 580, margin: '0 auto 36px' }}>
              <button
                onClick={() => { setSearchOpen(true); setTimeout(() => searchInputRef.current?.focus(), 80) }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  width: '100%', padding: '14px 20px', borderRadius: 16,
                  border: `1px solid ${bdr}`,
                  backgroundColor: bg3,
                  textAlign: 'left', cursor: 'text',
                  boxShadow: isDark ? '0 2px 20px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.05)',
                  transition: 'all 180ms ease',
                }}
                onMouseEnter={e => {
                  ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(47,175,143,0.4)'
                  ;(e.currentTarget as HTMLElement).style.boxShadow = isDark ? '0 4px 28px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.08)'
                }}
                onMouseLeave={e => {
                  ;(e.currentTarget as HTMLElement).style.borderColor = bdr
                  ;(e.currentTarget as HTMLElement).style.boxShadow = isDark ? '0 2px 20px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.05)'
                }}
              >
                <Search style={{ width: 15, height: 15, color: tx2, flexShrink: 0 }} strokeWidth={1.75} />
                <span style={{ flex: 1, fontSize: 13.5, color: isDark ? 'rgba(168,162,158,0.5)' : 'rgba(120,113,108,0.5)' }}>
                  Buscar documentación, guías, tutoriales…
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                  {[
                    <kbd key="cmd" style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 6px', borderRadius: 6, border: `1px solid ${bdr}`, backgroundColor: isDark ? 'rgba(44,40,36,.6)' : 'rgba(245,242,240,.8)', fontSize: 10, fontWeight: 600, color: tx2 }}>
                      <Command style={{ width: 9, height: 9 }} strokeWidth={2} />
                    </kbd>,
                    <kbd key="k" style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 6px', borderRadius: 6, border: `1px solid ${bdr}`, backgroundColor: isDark ? 'rgba(44,40,36,.6)' : 'rgba(245,242,240,.8)', fontSize: 10, fontWeight: 600, color: tx2 }}>
                      K
                    </kbd>,
                  ]}
                </div>
              </button>
            </div>

            {/* Stats pills */}
            <div className="rp-h5 flex flex-wrap justify-center gap-3">
              {[
                { icon: CheckCircle, label: `${recursosDisponibles.length} disponibles`, color: '#2FAF8F' },
                { icon: Clock,       label: `${recursosProximamente.length} próximamente`, color: '#f59e0b' },
                { icon: Calendar,    label: 'Actualizado hoy', color: '#a78bfa' },
              ].map(({ icon: Icon, label, color }) => (
                <div key={label} style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '7px 14px', borderRadius: 999,
                  border: `1px solid ${bdr}`,
                  backgroundColor: isDark ? 'rgba(28,25,23,.5)' : 'rgba(255,255,255,.7)',
                  backdropFilter: 'blur(6px)',
                  fontSize: 12, fontWeight: 500, color: tx2,
                }}>
                  <Icon style={{ width: 12, height: 12, color, flexShrink: 0 }} strokeWidth={2.5} />
                  {label}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── MARQUEE ───────────────────────────────────────────────────────── */}
        <section style={{ padding: '22px 0', borderBottom: `1px solid ${bdr}`, overflow: 'hidden', position: 'relative' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 80, zIndex: 1, pointerEvents: 'none', background: `linear-gradient(to right, ${bg}, transparent)` }} />
          <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 80, zIndex: 1, pointerEvents: 'none', background: `linear-gradient(to left, ${bg}, transparent)` }} />
          <div className="rp-mq flex items-center" style={{ gap: 16 }}>
            {[...['Guías Operativas', 'API Docs', 'Videos', 'Manuales MVZ', 'SDK', 'Exportación USDA', 'Integración SENASICA', 'Pasaportes', 'Gemelos Digitales', 'Tutoriales',
                  'Guías Operativas', 'API Docs', 'Videos', 'Manuales MVZ', 'SDK', 'Exportación USDA', 'Integración SENASICA', 'Pasaportes', 'Gemelos Digitales', 'Tutoriales']].map((o, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '4px 12px',
                borderRadius: 8, flexShrink: 0,
                border: `1px solid ${bdr}`,
                backgroundColor: isDark ? 'rgba(28,25,23,.4)' : 'rgba(255,255,255,.6)',
              }}>
                <span style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: '#2FAF8F', opacity: .7, flexShrink: 0 }} />
                <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.02em', color: tx2, whiteSpace: 'nowrap' }}>{o}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════
            SEARCH MODAL
        ═══════════════════════════════════════════════════════ */}
        {searchOpen && (
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '10vh', padding: '10vh 24px 24px', backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)' }}
            onClick={() => setSearchOpen(false)}
          >
            <div
              className="rp-modal"
              style={{ width: '100%', maxWidth: 600, borderRadius: 20, overflow: 'hidden', border: `1px solid ${bdr}`, backgroundColor: bg3, boxShadow: isDark ? '0 32px 80px rgba(0,0,0,0.7)' : '0 32px 80px rgba(0,0,0,0.15)' }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderBottom: `1px solid ${bdr}` }}>
                <Search style={{ width: 16, height: 16, color: tx2, flexShrink: 0 }} strokeWidth={1.75} />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Buscar en recursos…"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="rp-search-input"
                  style={{ flex: 1, background: 'transparent', fontSize: 15, color: tx1, border: 'none', outline: 'none' }}
                />
                <button onClick={() => setSearchOpen(false)} style={{ padding: '4px', borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: tx2 }}>
                  <X style={{ width: 16, height: 16 }} strokeWidth={2} />
                </button>
              </div>
              <div style={{ maxHeight: '55vh', overflowY: 'auto' }}>
                {searchQuery.trim() ? (
                  recursosFiltrados.length > 0 ? (
                    <div style={{ padding: 8 }}>
                      {recursosFiltrados.map(recurso => {
                        const Icon = recurso.icono
                        const isAvail = recurso.estado === 'disponible' || recurso.estado === 'externo'
                        return (
                          <button
                            key={recurso.id}
                            onClick={() => { if (isAvail) handleDescargar(recurso); setSearchOpen(false); setSearchQuery('') }}
                            style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '12px 14px', borderRadius: 12, textAlign: 'left', cursor: isAvail ? 'pointer' : 'default', background: 'none', border: 'none', color: 'inherit', transition: 'background 150ms ease' }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = isDark ? 'rgba(44,40,36,.6)' : 'rgba(245,242,240,.8)' }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}
                          >
                            <div style={{ width: 38, height: 38, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, backgroundColor: isDark ? 'rgba(47,175,143,0.1)' : 'rgba(47,175,143,0.08)' }}>
                              <Icon style={{ width: 18, height: 18, color: '#2FAF8F' }} strokeWidth={1.75} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontSize: 13.5, fontWeight: 500, color: tx1, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{recurso.titulo}</p>
                              <p style={{ fontSize: 11.5, color: tx2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{recurso.descripcion}</p>
                            </div>
                            <EstadoBadge estado={recurso.estado} />
                          </button>
                        )
                      })}
                    </div>
                  ) : (
                    <div style={{ padding: '40px 20px', textAlign: 'center', color: tx2, fontSize: 14 }}>Sin resultados para "{searchQuery}"</div>
                  )
                ) : (
                  <div style={{ padding: '20px 20px 14px' }}>
                    <p style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: tx2, marginBottom: 10 }}>Sugerencias</p>
                    {['guía', 'manual', 'video', 'API', 'exportación'].map(term => (
                      <button
                        key={term}
                        onClick={() => setSearchQuery(term)}
                        style={{ display: 'block', width: '100%', textAlign: 'left', padding: '9px 12px', borderRadius: 10, fontSize: 13.5, color: tx1, background: 'none', border: 'none', cursor: 'pointer', transition: 'background 150ms ease' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = isDark ? 'rgba(44,40,36,.6)' : 'rgba(245,242,240,.8)' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════
            DESTACADOS
        ═══════════════════════════════════════════════════════ */}
        {recursosDestacados.length > 0 && !searchQuery && (
          <section style={{ maxWidth: 1152, margin: '0 auto', padding: '72px 32px 0' }}>
            <Reveal>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: '#2FAF8F', display: 'inline-block' }} />
                <span style={{ width: 16, height: 1, backgroundColor: 'rgba(47,175,143,.5)', display: 'inline-block' }} />
                <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.13em', textTransform: 'uppercase', color: tx2 }}>Recursos destacados</span>
              </div>
              <h2 className="rp-s" style={{ fontSize: 'clamp(1.8rem,4vw,3rem)', fontStyle: 'italic', lineHeight: 1.14, marginBottom: 32, color: tx1 }}>
                Empieza aquí.
              </h2>
            </Reveal>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}>
              {recursosDestacados.map((r, i) => (
                <Reveal key={r.id} delay={i * 60}>
                  <RecursoCard recurso={r} hero />
                </Reveal>
              ))}
            </div>
          </section>
        )}

        {/* ═══════════════════════════════════════════════════════
            FILTROS + LISTA
        ═══════════════════════════════════════════════════════ */}
        <section style={{ maxWidth: 1152, margin: '0 auto', padding: '64px 32px 0' }}>
          <Reveal>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: '#2FAF8F', display: 'inline-block' }} />
              <span style={{ width: 16, height: 1, backgroundColor: 'rgba(47,175,143,.5)', display: 'inline-block' }} />
              <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.13em', textTransform: 'uppercase', color: tx2 }}>Biblioteca completa</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
              <h2 className="rp-s" style={{ fontSize: 'clamp(1.8rem,4vw,3rem)', fontStyle: 'italic', lineHeight: 1.14, color: tx1 }}>
                {recursosFiltrados.length} recurso{recursosFiltrados.length !== 1 ? 's' : ''}.
              </h2>
              {/* Filtro pills */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {CATS.map(({ id, label, Icon }) => {
                  const active = categoriaActiva === id
                  return (
                    <button
                      key={id}
                      onClick={() => setCategoriaActiva(id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        height: 34, padding: '0 14px', borderRadius: 999,
                        fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'all 180ms ease',
                        border: active ? 'none' : `1px solid ${bdr}`,
                        backgroundColor: active ? '#2FAF8F' : (isDark ? 'rgba(28,25,23,.5)' : 'rgba(255,255,255,.8)'),
                        color: active ? '#fff' : tx2,
                        boxShadow: active ? '0 4px 16px rgba(47,175,143,.3)' : 'none',
                      }}
                    >
                      {Icon && <Icon style={{ width: 12, height: 12 }} strokeWidth={2} />}
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>
          </Reveal>

          {recursosFiltrados.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 14, marginBottom: 80 }}>
              {recursosFiltrados.map((r, i) => (
                <Reveal key={r.id} delay={i * 45}>
                  <RecursoCard recurso={r} />
                </Reveal>
              ))}
            </div>
          ) : (
            <Reveal>
              <div style={{ textAlign: 'center', padding: '80px 0' }}>
                <div style={{ width: 72, height: 72, borderRadius: 20, backgroundColor: isDark ? 'rgba(44,40,36,.6)' : 'rgba(245,242,240,.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                  <Search style={{ width: 32, height: 32, color: tx2 }} strokeWidth={1.5} />
                </div>
                <p style={{ fontSize: 17, fontWeight: 600, color: tx1, marginBottom: 8 }}>Sin resultados</p>
                <p style={{ fontSize: 13.5, color: tx2, marginBottom: 24 }}>Intenta con otros términos o explora todas las categorías</p>
                <button
                  onClick={() => { setSearchQuery(''); setCategoriaActiva('todos') }}
                  style={{ padding: '10px 24px', borderRadius: 12, backgroundColor: '#2FAF8F', color: '#fff', fontSize: 13.5, fontWeight: 600, border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px rgba(47,175,143,.3)' }}
                >
                  Ver todos
                </button>
              </div>
            </Reveal>
          )}
        </section>

        {/* ═══════════════════════════════════════════════════════
            ROADMAP
        ═══════════════════════════════════════════════════════ */}
        <section style={{ borderTop: `1px solid ${bdr}`, borderBottom: `1px solid ${bdr}`, backgroundColor: bg2 }}>
          <div style={{ maxWidth: 1152, margin: '0 auto', padding: '72px 32px' }}>
            <Reveal>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: '#a78bfa', display: 'inline-block' }} />
                <span style={{ width: 16, height: 1, backgroundColor: 'rgba(167,139,250,.5)', display: 'inline-block' }} />
                <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.13em', textTransform: 'uppercase', color: tx2 }}>Roadmap · Transparencia total</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 40, flexWrap: 'wrap', gap: 16 }}>
                <h2 className="rp-s" style={{ fontSize: 'clamp(1.9rem,4.5vw,3.2rem)', fontStyle: 'italic', lineHeight: 1.12, color: tx1 }}>
                  Lo que estamos<br /><span style={{ color: tx2 }}>construyendo.</span>
                </h2>
                <p style={{ fontSize: 13.5, lineHeight: 1.72, color: tx2, maxWidth: 280 }}>
                  Actualizaciones continuas. Prioridad basada en feedback de usuarios activos.
                </p>
              </div>
              <style>{`@keyframes spin-tl2{to{transform:rotate(360deg)}} .spin-tl2{animation:spin-tl2 1.2s linear infinite; position:absolute; inset:-2px; border-radius:50%; border:2px solid transparent; border-top-color:#f59e0b;}`}</style>
              <div style={{ borderTop: `1px solid ${bdr}` }}>
                {roadmapTimeline.map((periodo, pi) => (
                  <Reveal key={periodo.mes} delay={pi * 60}>
                    <div style={{ borderBottom: `1px solid ${bdr}` }}>
                      {/* Mes header */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 0 14px' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: periodo.items.every(i => i.estado === 'completado') ? '#2FAF8F' : tx2 }}>
                          {periodo.mes}
                        </span>
                        <span style={{ fontSize: 11, color: tx2, opacity: 0.5 }}>
                          {periodo.items.filter(i => i.estado === 'completado').length}/{periodo.items.length}
                        </span>
                      </div>
                      {/* Items */}
                      <div style={{ paddingBottom: 18, display: 'flex', flexDirection: 'column', gap: 0 }}>
                        {periodo.items.map((item, ii) => (
                          <div key={ii} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '9px 0', borderTop: ii > 0 ? `1px solid ${isDark ? 'rgba(68,64,60,0.25)' : 'rgba(214,211,208,0.4)'}` : 'none' }}>
                            {item.estado === 'completado' ? (
                              <CheckCircle style={{ width: 13, height: 13, color: '#2FAF8F', flexShrink: 0 }} strokeWidth={2.5} />
                            ) : item.estado === 'en-progreso' ? (
                              <div style={{ width: 13, height: 13, borderRadius: '50%', border: '2px solid #f59e0b', flexShrink: 0, position: 'relative' }}>
                                <div className="spin-tl2" />
                              </div>
                            ) : (
                              <div style={{ width: 13, height: 13, borderRadius: '50%', border: `1.5px solid ${bdr}`, flexShrink: 0 }} />
                            )}
                            <span style={{ flex: 1, fontSize: 13.5, color: item.estado === 'completado' ? tx1 : tx2 }}>{item.titulo}</span>
                            {item.progreso !== undefined && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                                <div style={{ width: 64, height: 1.5, borderRadius: 999, backgroundColor: isDark ? 'rgba(68,64,60,0.5)' : 'rgba(214,211,208,0.6)', overflow: 'hidden' }}>
                                  <div style={{ height: '100%', width: `${item.progreso}%`, backgroundColor: '#f59e0b', borderRadius: 999 }} />
                                </div>
                                <span style={{ fontSize: 10.5, color: '#f59e0b', fontWeight: 600, minWidth: 28 }}>{item.progreso}%</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </Reveal>
          </div>
        </section>



        {/* ═══════════════════════════════════════════════════════
            CTA — CLOSING STATEMENT
        ═══════════════════════════════════════════════════════ */}
        <section style={{ maxWidth: 1152, margin: '0 auto', padding: '72px 32px 96px' }}>
          <Reveal>
            <div style={{ borderRadius: 24, border: `1px solid ${bdr}`, backgroundColor: bg2, overflow: 'hidden', position: 'relative' }}>

              {/* Ambient orbs */}
              <div className="rp-ca1" style={{ position: 'absolute', width: 380, height: 380, borderRadius: '50%', backgroundColor: '#2FAF8F', filter: 'blur(80px)', top: -140, right: -80, zIndex: 0, pointerEvents: 'none' }} />
              <div className="rp-ca2" style={{ position: 'absolute', width: 260, height: 260, borderRadius: '50%', backgroundColor: '#2FAF8F', filter: 'blur(64px)', bottom: -100, left: -40, zIndex: 0, pointerEvents: 'none' }} />

              <div style={{ position: 'relative', zIndex: 1, padding: '72px 48px', textAlign: 'center' }}>

                {/* Icon mark */}
                <div style={{ width: 52, height: 52, borderRadius: 14, margin: '0 auto 28px', backgroundColor: 'rgba(47,175,143,.12)', border: '1px solid rgba(47,175,143,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg style={{ width: 22, height: 22, color: '#2FAF8F' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
                  </svg>
                </div>

                <h2 className="rp-s" style={{ fontSize: 'clamp(2.2rem,6vw,4rem)', fontStyle: 'italic', lineHeight: 1.08, marginBottom: 14, color: tx1 }}>
                  ¿Necesitas ayuda<br />adicional?
                </h2>
                <p style={{ fontSize: 14.5, lineHeight: 1.78, maxWidth: 380, margin: '0 auto 40px', color: tx2 }}>
                  Nuestro equipo está disponible para soporte técnico y operativo. Tiempo de respuesta promedio: 2 horas.
                </p>

                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginBottom: 36 }}>
                  <button
                    onClick={() => navigate('/contacto')}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '13px 28px', borderRadius: 12, border: 'none', cursor: 'pointer',
                      backgroundColor: '#2FAF8F', color: '#fff', fontSize: 14, fontWeight: 600,
                      boxShadow: '0 8px 24px rgba(47,175,143,.32)',
                      transition: 'all 180ms ease',
                    }}
                    onMouseEnter={e => { ;(e.currentTarget as HTMLElement).style.backgroundColor = '#27a07f'; ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; ;(e.currentTarget as HTMLElement).style.boxShadow = '0 14px 32px rgba(47,175,143,.42)' }}
                    onMouseLeave={e => { ;(e.currentTarget as HTMLElement).style.backgroundColor = '#2FAF8F'; ;(e.currentTarget as HTMLElement).style.transform = 'none'; ;(e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(47,175,143,.32)' }}
                  >
                    Contactar Soporte
                    <ArrowRight style={{ width: 14, height: 14 }} strokeWidth={2.5} />
                  </button>
                  <button
                    onClick={() => navigate('/signup')}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '13px 28px', borderRadius: 12, cursor: 'pointer',
                      border: `1px solid ${bdr}`,
                      backgroundColor: isDark ? 'rgba(28,25,23,.6)' : 'rgba(255,255,255,.7)',
                      color: tx2, fontSize: 14, fontWeight: 500, transition: 'all 180ms ease',
                    }}
                    onMouseEnter={e => { ;(e.currentTarget as HTMLElement).style.color = tx1; ;(e.currentTarget as HTMLElement).style.borderColor = isDark ? '#78716c' : '#a8a29e' }}
                    onMouseLeave={e => { ;(e.currentTarget as HTMLElement).style.color = tx2; ;(e.currentTarget as HTMLElement).style.borderColor = bdr }}
                  >
                    Solicitar Acceso
                  </button>
                </div>

                {/* Trust pills */}
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 20, fontSize: 12, color: tx2 }}>
                  {['Soporte 24/7', 'Equipo especializado', 'Respuesta en 2h promedio'].map(t => (
                    <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <CheckCircle style={{ width: 12, height: 12, color: '#2FAF8F', flexShrink: 0 }} strokeWidth={2.5} />
                      {t}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </section>

        <Footer isDark={isDark} />
      </div>
    </>
  )
}

export default RecursosPage