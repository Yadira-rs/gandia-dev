import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Footer from '../../components/ui/Footer'
import Header from '../../components/ui/Header'
import { Shield, FileText, Users, Building2, Globe, ChevronDown, Check, Info, TrendingDown } from 'lucide-react'

// ─── TYPES ────────────────────────────────────────────────────────────────────

type RolType = 'productor' | 'mvz' | 'union' | 'exportador' | 'auditor'

interface ConceptoConsumo {
  concepto: string
  descripcion: string
  precio: number
  unidad: string
}

interface EstructuraRol {
  nombre: string
  nombreCorto: string
  icono: React.ElementType
  tagline: string
  descripcion: string
  conceptos: ConceptoConsumo[]
  incluido: string[]
  destacado?: boolean
  color: string
  priceLabel: string
}

interface CalculatorState {
  tramites: number
  pasaportes: number
  consultasIA: number
  almacenamiento: number
}

// ─── DATA ─────────────────────────────────────────────────────────────────────

const ROLES: Record<RolType, EstructuraRol> = {
  productor: {
    nombre: 'Productor Ganadero',
    nombreCorto: 'Productor',
    icono: Users,
    tagline: 'Ranchos · UPP',
    descripcion: 'Solo pagas cuando ejecutas acciones que generan documentación oficial. Consultar, revisar y operar es siempre gratuito.',
    destacado: true,
    color: '#2FAF8F',
    priceLabel: 'Desde $15 MXN por acción',
    conceptos: [
      { concepto: 'Trámites oficiales', descripcion: 'Guías de tránsito, certificaciones sanitarias, documentos SENASICA', precio: 45, unidad: 'por trámite' },
      { concepto: 'Pasaportes digitales', descripcion: 'Registro biométrico con identificación RFID y huella de morro', precio: 35, unidad: 'por animal' },
      { concepto: 'Consultas IA especializadas', descripcion: 'Asesoría técnica contextual sobre sanidad, normativa y precios', precio: 15, unidad: 'por consulta' },
      { concepto: 'Almacenamiento extendido', descripcion: 'Evidencias multimedia — fotos, video y documentos en la nube', precio: 0.50, unidad: 'por GB / mes' },
    ],
    incluido: [
      'Acceso completo al sistema',
      'Chat institucional ilimitado',
      'Historial completo sin restricciones',
      'Notificaciones en tiempo real',
      'Soporte técnico 24/7',
      'Actualizaciones automáticas',
    ],
  },
  mvz: {
    nombre: 'Médico Veterinario Zootecnista',
    nombreCorto: 'MVZ',
    icono: FileText,
    tagline: 'Certificación profesional',
    descripcion: 'Facturación por acto profesional documentado. Acceso continuo sin costo — cobras solo cuando emites un documento oficial.',
    color: '#007AFF',
    priceLabel: 'Desde $25 MXN por acto',
    conceptos: [
      { concepto: 'Dictámenes oficiales', descripcion: 'Certificación zoosanitaria con firma electrónica válida', precio: 65, unidad: 'por dictamen' },
      { concepto: 'Vinculación documental', descripcion: 'Anexo a expedientes oficiales y pasaportes activos', precio: 25, unidad: 'por vinculación' },
      { concepto: 'Certificados digitales', descripcion: 'Documentos con validez legal inmediata y trazabilidad', precio: 85, unidad: 'por certificado' },
    ],
    incluido: [
      'Acceso profesional completo',
      'Expedientes asignados ilimitados',
      'Biblioteca técnica actualizada',
      'Herramientas de diagnóstico IA',
      'Trazabilidad de actos profesionales',
      'Reportes de actividad mensual',
    ],
  },
  union: {
    nombre: 'Unión Ganadera',
    nombreCorto: 'Unión',
    icono: Building2,
    tagline: 'Gestión regional',
    descripcion: 'Licencia institucional con acceso organizacional completo. Precio fijo mensual sin límite de usuarios ni operaciones internas.',
    color: '#AF52DE',
    priceLabel: '$2,500 MXN / mes',
    conceptos: [
      { concepto: 'Licencia institucional', descripcion: 'Acceso organizacional completo sin límite de usuarios', precio: 2500, unidad: 'mensual' },
      { concepto: 'Revisión documental', descripcion: 'Validación masiva de documentos de afiliados', precio: 15, unidad: 'por revisión' },
      { concepto: 'Constancias oficiales', descripcion: 'Documentos institucionales con respaldo digital', precio: 40, unidad: 'por constancia' },
    ],
    incluido: [
      'Usuarios corporativos ilimitados',
      'Dashboard ejecutivo avanzado',
      'Reportes y analytics regionales',
      'Personalización de marca',
      'Soporte prioritario dedicado',
      'Capacitación continua incluida',
    ],
  },
  exportador: {
    nombre: 'Exportador',
    nombreCorto: 'Exportador',
    icono: Globe,
    tagline: 'Comercio internacional',
    descripcion: 'Certeza documental verificable para cualquier mercado. Pago por expediente procesado.',
    color: '#FF9500',
    priceLabel: 'Desde $8 MXN por cabeza',
    conceptos: [
      { concepto: 'Expedientes de exportación', descripcion: 'Documentación completa con validez FDA · USDA · APHIS', precio: 150, unidad: 'por expediente' },
      { concepto: 'Verificación masiva de lote', descripcion: 'Validación automatizada de cabezas en tiempo real', precio: 8, unidad: 'por animal' },
      { concepto: 'Trazabilidad internacional', descripcion: 'Cumplimiento NOM + estándares USDA APHIS Rule 2024', precio: 200, unidad: 'por lote' },
    ],
    incluido: [
      'Plataforma completa de exportación',
      'Consulta ilimitada de expedientes',
      'Dashboard de operaciones en vivo',
      'Alertas de cumplimiento automáticas',
      'Integración API completa',
      'Certificaciones generadas al instante',
    ],
  },
  auditor: {
    nombre: 'Auditor · Inspector Oficial',
    nombreCorto: 'Auditor',
    icono: Shield,
    tagline: 'Autoridad regulatoria',
    descripcion: 'Las autoridades sanitarias tienen acceso completo e ilimitado por atribución institucional. Sin costo, sin restricciones, sin solicitud.',
    color: '#FF3B30',
    priceLabel: 'Acceso institucional gratuito',
    conceptos: [
      { concepto: 'Acceso institucional total', descripcion: 'SENASICA · SEDAGRO · Organismos certificadores · Sin restricciones legales', precio: 0, unidad: 'sin costo' },
    ],
    incluido: [
      'Consulta irrestricta de expedientes',
      'Herramientas de auditoría avanzadas',
      'Reportes institucionales en tiempo real',
      'Soporte prioritario inmediato',
      'Capacitación especializada incluida',
      'Historial de intervenciones verificable',
    ],
  },
}

const FAQS = [
  { q: '¿Existe un costo mensual obligatorio?', a: 'No. GANDIA 7 no opera bajo suscripción mensual obligatoria. Solo pagas por las acciones específicas que ejecutes y que generen documentación oficial. Si este mes no usas ningún servicio de pago, tu cargo es exactamente $0.' },
  { q: '¿Cómo sé exactamente cuánto voy a pagar?', a: 'Cada acción que genera consumo muestra el costo exacto antes de ejecutarla. Tu panel de control refleja el consumo acumulado en tiempo real. Puedes establecer límites de gasto y recibir alertas antes de alcanzarlos.' },
  { q: '¿Puedo usar el sistema sin generar costos?', a: 'Absolutamente. Consultar historiales completos, revisar pasaportes, usar el chat institucional, recibir notificaciones y acceder a toda la información es siempre gratuito. Solo pagas cuando ejecutas acciones que generan documentos oficiales.' },
  { q: '¿Las autoridades sanitarias pagan por usar GANDIA 7?', a: 'No. Auditores, inspectores y autoridades (SENASICA, SEDAGRO, organismos certificadores) tienen acceso completo e ilimitado por atribución institucional, sin costo alguno bajo ningún concepto.' },
  { q: '¿Qué pasa si un mes no uso el sistema?', a: 'Tu cuenta permanece activa sin cargos ni penalizaciones. Solo pagas cuando vuelvas a ejecutar acciones. No hay costos de mantenimiento, inactividad o reactivación. Tu información permanece segura y accesible siempre.' },
  { q: '¿Existen descuentos por volumen?', a: 'Sí, automáticos. 10% desde 100 operaciones mensuales, 15% desde 250, 20% desde 500. La calculadora interactiva los aplica en tiempo real para que veas el ahorro exacto.' },
]

// ─── HOOKS ────────────────────────────────────────────────────────────────────

function useAnimatedNumber(target: number, duration = 380) {
  const [val, setVal] = useState(target)
  const fromRef = useRef(target)
  const rafRef  = useRef<number | null>(null)

  useEffect(() => {
    const start = fromRef.current
    const diff  = target - start
    const t0    = performance.now()
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    const tick = (now: number) => {
      const p = Math.min((now - t0) / duration, 1)
      setVal(start + diff * (p * (2 - p)))
      if (p < 1) rafRef.current = requestAnimationFrame(tick)
      else fromRef.current = target
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [target, duration])
  return val
}

function useInView(threshold = 0.1) {
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

// ─── SCROLL REVEAL ────────────────────────────────────────────────────────────

function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, inView } = useInView(0.07)
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

export default function ModeloOperativoPage() {
  const isDark   = useTheme()
  const navigate = useNavigate()

  const [rol,    setRol]    = useState<RolType>('productor')
  const [faqIdx, setFaqIdx] = useState<number | null>(null)
  const [calcExpanded, setCalcExpanded] = useState(true)
  const [calc, setCalc] = useState<CalculatorState>({ tramites: 10, pasaportes: 15, consultasIA: 25, almacenamiento: 100 })
  const rolDetailRef = useRef<HTMLElement>(null)

  const handleVerDetalle = useCallback((r: RolType) => {
    setRol(r)
    setTimeout(() => {
      rolDetailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 60)
  }, [])

  const rolActual = ROLES[rol]

  const costo = useMemo(() => {
    if (rol !== 'productor') return null
    const sub = calc.tramites * 45 + calc.pasaportes * 35 + calc.consultasIA * 15 + calc.almacenamiento * 0.5
    const ops = calc.tramites + calc.pasaportes + calc.consultasIA
    const pct = ops >= 500 ? 0.20 : ops >= 250 ? 0.15 : ops >= 100 ? 0.10 : 0
    const desc = sub * pct
    const net  = sub - desc
    const iva  = net * 0.16
    return { sub, desc, pct: pct * 100, net, iva, total: net + iva, ops }
  }, [calc, rol])

  const totalAnim = useAnimatedNumber(costo?.total ?? 0, 420)

  const onSlider = useCallback((k: keyof CalculatorState, v: number) => {
    setCalc(p => ({ ...p, [k]: v }))
  }, [])

  // Theme tokens
  const bg  = isDark ? '#0c0a09' : '#fafaf9'
  const bg2 = isDark ? '#141210' : '#f4f2f0'
  const bg3 = isDark ? '#1c1917' : '#ffffff'
  const bdr = isDark ? 'rgba(68,64,60,0.5)'  : 'rgba(214,211,208,0.7)'
  const tx1 = isDark ? '#fafafa'  : '#171717'
  const tx2 = isDark ? '#a8a29e'  : '#78716c'
  const tx3 = isDark ? '#57534e'  : '#d6d3d1'

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital,wght@0,400;1,400&family=Geist:wght@300;400;500;600&display=swap');

        .mo * { -webkit-font-smoothing: antialiased; box-sizing: border-box; }
        .mo   { font-family: 'Geist', system-ui, sans-serif; }
        .s    { font-family: 'Instrument Serif', Georgia, serif; }

        .mo *:focus { outline: none !important; }
        .mo *:focus-visible { outline: 2px solid #2FAF8F !important; outline-offset: 3px; border-radius: 6px; }

        .mo ::-webkit-scrollbar       { width: 3px; }
        .mo ::-webkit-scrollbar-track { background: transparent; }
        .mo ::-webkit-scrollbar-thumb { background: ${isDark ? '#44403c' : '#e7e5e4'}; border-radius: 999px; }

        /* Noise overlay */
        .noise::after {
          content: ''; position: absolute; inset: 0; z-index: 1; pointer-events: none;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");
          mix-blend-mode: overlay;
        }

        /* Hero animations */
        @keyframes hi { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        .h1 { animation: hi 820ms cubic-bezier(.16,1,.3,1) 60ms  both; }
        .h2 { animation: hi 820ms cubic-bezier(.16,1,.3,1) 180ms both; }
        .h3 { animation: hi 820ms cubic-bezier(.16,1,.3,1) 300ms both; }
        .h4 { animation: hi 820ms cubic-bezier(.16,1,.3,1) 420ms both; }
        .h5 { animation: hi 820ms cubic-bezier(.16,1,.3,1) 520ms both; }

        /* Role card swap */
        @keyframes ri { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .role-card { animation: ri 280ms cubic-bezier(.16,1,.3,1) both; }

        /* Accordion */
        .acc { transition: max-height 360ms cubic-bezier(.4,0,.2,1), opacity 280ms ease; }

        /* Range slider */
        input[type=range] { -webkit-appearance: none; appearance: none; height: 2px; border-radius: 999px; cursor: pointer; }
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none; width: 18px; height: 18px; border-radius: 50%;
          background: #2FAF8F; border: 2.5px solid ${isDark ? '#0c0a09' : '#fafaf9'};
          box-shadow: 0 0 0 1px rgba(47,175,143,.3), 0 2px 8px rgba(47,175,143,.25);
          transition: transform 140ms ease, box-shadow 140ms ease;
        }
        input[type=range]::-webkit-slider-thumb:hover {
          transform: scale(1.3);
          box-shadow: 0 0 0 5px rgba(47,175,143,.12), 0 2px 12px rgba(47,175,143,.4);
        }

        /* Pulse */
        @keyframes pd { 0%,100%{box-shadow:0 0 0 0 rgba(47,175,143,.45)} 60%{box-shadow:0 0 0 6px rgba(47,175,143,0)} }
        .pulse { animation: pd 2.4s ease-in-out infinite; }

        /* Shimmer for big numbers */
        @keyframes sh { 0%{background-position:-300% center} 100%{background-position:300% center} }
        .shimmer {
          background: linear-gradient(90deg, #2FAF8F 0%, #7ee8c8 30%, #2FAF8F 55%, #1d9070 100%);
          background-size: 300% auto;
          -webkit-background-clip: text; background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: sh 5s linear infinite;
        }

        /* Marquee */
        @keyframes mq { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        .mq { animation: mq 30s linear infinite; width: max-content; }
        .mq:hover { animation-play-state: paused; }

        /* CTA ambient */
        @keyframes ca1 { 0%,100%{transform:scale(1);opacity:.07}    50%{transform:scale(1.1);opacity:.13} }
        @keyframes ca2 { 0%,100%{transform:scale(1.05);opacity:.05} 50%{transform:scale(0.95);opacity:.1} }
        .ca1 { animation: ca1 9s ease-in-out infinite; }
        .ca2 { animation: ca2 12s ease-in-out 2s infinite; }

        /* Comparison row in */
        @keyframes rw { from{opacity:0;transform:translateX(-6px)} to{opacity:1;transform:translateX(0)} }
        .rw { animation: rw 280ms ease both; }

        /* Tabular numbers */
        .num { font-variant-numeric: tabular-nums; }
      `}</style>

      <div className="mo min-h-screen" style={{ backgroundColor: bg, color: tx1 }}>
        <Header currentSection="precios" isDark={isDark} />

        {/* ══════════════════════════════════════════════════════
            HERO
        ══════════════════════════════════════════════════════ */}
        <section className="noise relative overflow-hidden" style={{ borderBottom: `1px solid ${bdr}` }}>
          <div className="absolute inset-0 pointer-events-none" style={{
            backgroundImage: `
              radial-gradient(ellipse 80% 60% at 50% 100%, ${isDark ? 'rgba(47,175,143,0.08)' : 'rgba(47,175,143,0.10)'} 0%, transparent 70%),
              radial-gradient(ellipse 50% 40% at 20% 20%, ${isDark ? 'rgba(47,175,143,0.04)' : 'rgba(47,175,143,0.05)'} 0%, transparent 55%),
              radial-gradient(ellipse 40% 40% at 80% 10%, ${isDark ? 'rgba(47,175,143,0.03)' : 'rgba(47,175,143,0.04)'} 0%, transparent 50%)
            `
          }} />

          <div style={{ maxWidth: 1152, margin: '0 auto', padding: '60px 32px 68px', position: 'relative', zIndex: 2, textAlign: 'center' }}>

            {/* Eyebrow */}
            <div className="h1 flex items-center justify-center gap-2.5" style={{ marginBottom: 32 }}>
              <span className="pulse" style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#2FAF8F', flexShrink: 0 }} />
              <span style={{ width: 20, height: 1, backgroundColor: 'rgba(47,175,143,.5)', flexShrink: 0 }} />
              <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: tx2 }}>
                Modelo Operativo · GANDIA 7
              </span>
              <span style={{ width: 20, height: 1, backgroundColor: 'rgba(47,175,143,.5)', flexShrink: 0 }} />
            </div>

            {/* Philosophy headline */}
            <h1 className="h2 s" style={{ fontSize: 'clamp(3.2rem, 8vw, 6rem)', lineHeight: 1.05, fontStyle: 'italic', letterSpacing: '-0.01em', marginBottom: 16 }}>
              No vendemos<br />software.
            </h1>
            <p className="h3 s" style={{ fontSize: 'clamp(1.5rem, 3.5vw, 2.6rem)', lineHeight: 1.2, fontStyle: 'italic', color: '#2FAF8F', marginBottom: 32 }}>
              Habilitamos certeza verificable.
            </p>

            <p className="h4" style={{ fontSize: 15, lineHeight: 1.82, color: tx2, marginBottom: 48, maxWidth: 560, margin: '0 auto 48px' }}>
              Paga únicamente por las acciones que generen valor documental oficial.
              Sin cuotas mensuales. Sin permanencias. Si este mes no usas nada de pago, tu cargo es exactamente{' '}
              <span className="s" style={{ fontStyle: 'italic', color: '#2FAF8F', fontSize: 18 }}>$0</span>.
            </p>

            {/* Trust pills */}
            <div className="h5 flex flex-wrap justify-center gap-2.5">
              {['Sin suscripción mensual', 'Actívate en 24 horas', 'Auditor: acceso gratuito siempre'].map(p => (
                <div key={p} className="flex items-center gap-2" style={{
                  padding: '7px 15px', borderRadius: 999,
                  border: `1px solid ${bdr}`,
                  backgroundColor: isDark ? 'rgba(28,25,23,.6)' : 'rgba(255,255,255,.8)',
                  fontSize: 12, fontWeight: 500, color: tx2,
                  backdropFilter: 'blur(6px)',
                }}>
                  <Check style={{ width: 11, height: 11, color: '#2FAF8F', flexShrink: 0 }} strokeWidth={2.5} />
                  {p}
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* ── Trusted logos marquee ─────────────────────────── */}
        <section style={{ padding: '28px 0', borderBottom: `1px solid ${bdr}`, overflow: 'hidden', position: 'relative' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 72, zIndex: 1, pointerEvents: 'none', background: `linear-gradient(to right, ${bg}, transparent)` }} />
          <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 72, zIndex: 1, pointerEvents: 'none', background: `linear-gradient(to left, ${bg}, transparent)` }} />
          <div className="mq flex items-center" style={{ gap: 20 }}>
            {[...['SENASICA','USDA · APHIS','OMSA / WOAH','SINIIGA','SADER','FDA','CNOG','FIRA','DOF',
                 'SENASICA','USDA · APHIS','OMSA / WOAH','SINIIGA','SADER','FDA','CNOG','FIRA','DOF']].map((o,i) => (
              <div key={i} className="flex items-center gap-2" style={{
                padding: '5px 13px', borderRadius: 8, flexShrink: 0,
                border: `1px solid ${bdr}`,
                backgroundColor: isDark ? 'rgba(28,25,23,.4)' : 'rgba(255,255,255,.6)',
              }}>
                <span style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: '#2FAF8F', opacity: .7 }} />
                <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.02em', color: tx2, whiteSpace: 'nowrap' }}>{o}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════
            ROL SELECTOR
        ══════════════════════════════════════════════════════ */}
        <section ref={rolDetailRef} style={{ maxWidth: 1152, margin: '0 auto', padding: '72px 32px 0', scrollMarginTop: 72 }}>
          <Reveal>
            <div className="flex items-center gap-2.5" style={{ marginBottom: 10 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: '#2FAF8F' }} />
              <span style={{ width: 16, height: 1, backgroundColor: 'rgba(47,175,143,.5)' }} />
              <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.13em', textTransform: 'uppercase', color: tx2 }}>
                Tu modelo según tu rol
              </span>
            </div>
            <h2 className="s" style={{ fontSize: 'clamp(1.9rem, 5vw, 3.2rem)', fontStyle: 'italic', lineHeight: 1.12, marginBottom: 32, color: tx1 }}>
              Cinco roles.<br /><span style={{ color: tx2 }}>Un principio.</span>
            </h2>
            {/* Pill tabs */}
            <div className="flex flex-wrap gap-2" style={{ marginBottom: 28 }}>
              {(Object.keys(ROLES) as RolType[]).map(r => {
                const c = ROLES[r]
                const active = r === rol
                return (
                  <button key={r} onClick={() => setRol(r)} style={{
                    display: 'flex', alignItems: 'center', gap: 7,
                    height: 36, padding: '0 16px', borderRadius: 999,
                    fontSize: 12.5, fontWeight: 500, cursor: 'pointer',
                    transition: 'all 200ms ease',
                    border: active ? 'none' : `1px solid ${bdr}`,
                    backgroundColor: active ? c.color : (isDark ? 'rgba(28,25,23,.5)' : 'rgba(255,255,255,.8)'),
                    color: active ? '#fff' : tx2,
                    boxShadow: active ? `0 4px 16px ${c.color}35` : 'none',
                    position: 'relative',
                  }}>
                    <c.icono style={{ width: 13, height: 13 }} strokeWidth={1.75} />
                    {c.nombreCorto}
                    {c.destacado && !active && (
                      <span style={{ position: 'absolute', top: -4, right: -3, width: 8, height: 8, borderRadius: '50%', backgroundColor: c.color, border: `2px solid ${bg}` }} />
                    )}
                  </button>
                )
              })}
            </div>
          </Reveal>
        </section>

        {/* ── Role detail card ─────────────────────────────── */}
        <section key={rol} style={{ maxWidth: 1152, margin: '0 auto', padding: '0 32px 80px' }}>
          <div className="role-card" style={{ borderRadius: 20, border: `1px solid ${bdr}`, backgroundColor: bg2, overflow: 'hidden' }}>

            {/* Card header */}
            <div style={{
              padding: '32px 32px 28px', borderBottom: `1px solid ${bdr}`,
              background: isDark
                ? `linear-gradient(135deg, ${rolActual.color}10 0%, transparent 55%)`
                : `linear-gradient(135deg, ${rolActual.color}07 0%, transparent 55%)`,
            }}>
              <div className="flex items-start gap-4">
                <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: `${rolActual.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <rolActual.icono style={{ width: 20, height: 20, color: rolActual.color }} strokeWidth={1.75} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="flex items-center gap-2.5" style={{ marginBottom: 5 }}>
                    <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: rolActual.color }}>{rolActual.tagline}</span>
                    {rolActual.destacado && (
                      <span style={{ fontSize: 9.5, fontWeight: 700, padding: '2px 8px', borderRadius: 999, backgroundColor: rolActual.color, color: '#fff' }}>Popular</span>
                    )}
                  </div>
                  <h3 style={{ fontSize: 19, fontWeight: 600, letterSpacing: '-0.02em', color: tx1, marginBottom: 6 }}>{rolActual.nombre}</h3>
                  <p style={{ fontSize: 13, lineHeight: 1.72, color: tx2, maxWidth: 500 }}>{rolActual.descripcion}</p>
                </div>
                <div className="shrink-0 text-right hidden sm:block">
                  <p className="s" style={{ fontSize: 12.5, fontStyle: 'italic', color: tx2, marginBottom: 2 }}>Precio base</p>
                  <p style={{ fontSize: 13, fontWeight: 600, color: rolActual.color }}>{rolActual.priceLabel}</p>
                </div>
              </div>
            </div>

            {/* Conceptos */}
            <div style={{ padding: '26px 32px', borderBottom: `1px solid ${bdr}` }}>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.11em', color: tx2, marginBottom: 18 }}>Conceptos de consumo</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 10 }}>
                {rolActual.conceptos.map((c, i) => (
                  <div key={i} style={{
                    padding: '18px 20px', borderRadius: 14,
                    border: `1px solid ${bdr}`, backgroundColor: bg3,
                    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14,
                    transition: 'border-color 180ms ease',
                  }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = `${rolActual.color}45`)}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = bdr)}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: tx1, marginBottom: 4, lineHeight: 1.4 }}>{c.concepto}</p>
                      <p style={{ fontSize: 11.5, lineHeight: 1.62, color: tx2 }}>{c.descripcion}</p>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div className="s num" style={{ fontSize: 32, fontStyle: 'italic', lineHeight: 1, color: rolActual.color }}>${c.precio}</div>
                      <p style={{ fontSize: 10, color: tx2, marginTop: 3, maxWidth: 72, textAlign: 'right', lineHeight: 1.4 }}>{c.unidad}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Calculator — productor only ── */}
            {rol === 'productor' && costo && (
              <div style={{ borderBottom: `1px solid ${bdr}` }}>
                <button onClick={() => setCalcExpanded(p => !p)} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  width: '100%', padding: '20px 32px', background: 'none', border: 'none',
                  cursor: 'pointer', color: 'inherit',
                }}>
                  <div className="flex items-center gap-3">
                    <div style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: 'rgba(47,175,143,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg style={{ width: 13, height: 13, color: '#2FAF8F' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                    </div>
                    <span style={{ fontSize: 13.5, fontWeight: 600, color: tx1 }}>Calculadora interactiva</span>
                    <span style={{ fontSize: 12, color: tx2 }}>· Estima tu inversión mensual</span>
                  </div>
                  <ChevronDown style={{ width: 15, height: 15, color: tx2, transition: 'transform 220ms ease', transform: calcExpanded ? 'rotate(180deg)' : 'none', flexShrink: 0 }} strokeWidth={1.75} />
                </button>

                <div className="acc overflow-hidden" style={{ maxHeight: calcExpanded ? 860 : 0, opacity: calcExpanded ? 1 : 0 }}>
                  <div style={{ padding: '0 32px 30px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(235px, 1fr))', gap: 10, marginBottom: 18 }}>
                      {[
                        { key: 'tramites'       as const, label: 'Trámites oficiales',   max: 100, precio: 45,  unit: '' },
                        { key: 'pasaportes'     as const, label: 'Pasaportes digitales', max: 100, precio: 35,  unit: '' },
                        { key: 'consultasIA'    as const, label: 'Consultas IA',          max: 200, precio: 15,  unit: '' },
                        { key: 'almacenamiento' as const, label: 'Almacenamiento',        max: 500, precio: 0.5, unit: ' GB' },
                      ].map(item => {
                        const v = calc[item.key]
                        const pct = (v / item.max) * 100
                        return (
                          <div key={item.key} style={{ padding: '16px 18px', borderRadius: 12, border: `1px solid ${bdr}`, backgroundColor: bg3 }}>
                            <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
                              <span style={{ fontSize: 12, fontWeight: 500, color: tx2 }}>{item.label}</span>
                              <div className="flex items-baseline gap-0.5">
                                <span className="s num" style={{ fontSize: 22, fontStyle: 'italic', color: '#2FAF8F', lineHeight: 1 }}>{v}</span>
                                {item.unit && <span style={{ fontSize: 10.5, color: tx2 }}>{item.unit}</span>}
                              </div>
                            </div>
                            <input type="range" min={0} max={item.max} value={v}
                              onChange={e => onSlider(item.key, +e.target.value)}
                              style={{ width: '100%', marginBottom: 10, background: `linear-gradient(to right,#2FAF8F 0%,#2FAF8F ${pct}%,${isDark ? '#292524' : '#e7e5e4'} ${pct}%,${isDark ? '#292524' : '#e7e5e4'} 100%)` }}
                            />
                            <div className="flex items-center justify-between">
                              <span style={{ fontSize: 10, color: tx3 }}>0</span>
                              <span style={{ fontSize: 11.5, fontWeight: 600, color: tx2 }}>${(v * item.precio).toFixed(2)} MXN</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Summary */}
                    <div style={{
                      borderRadius: 14, padding: '22px 26px',
                      border: `1px solid ${isDark ? 'rgba(47,175,143,.22)' : 'rgba(47,175,143,.18)'}`,
                      background: isDark
                        ? 'linear-gradient(135deg, rgba(47,175,143,.07) 0%, rgba(28,25,23,.8) 100%)'
                        : 'linear-gradient(135deg, rgba(47,175,143,.04) 0%, rgba(255,255,255,.95) 100%)',
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                        <div className="flex justify-between items-center" style={{ paddingBottom: 13, borderBottom: `1px solid ${bdr}`, fontSize: 13 }}>
                          <span style={{ color: tx2 }}>Subtotal</span>
                          <span style={{ fontWeight: 600, color: tx1 }}>${costo.sub.toFixed(2)}</span>
                        </div>
                        {costo.pct > 0 && (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <TrendingDown style={{ width: 13, height: 13, color: '#2FAF8F' }} strokeWidth={2} />
                              <span style={{ fontSize: 12.5, color: '#2FAF8F', fontWeight: 500 }}>Descuento por volumen ({costo.pct}%)</span>
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#2FAF8F' }}>−${costo.desc.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center" style={{ fontSize: 13 }}>
                          <span style={{ color: tx2 }}>IVA 16%</span>
                          <span style={{ fontWeight: 600, color: tx1 }}>${costo.iva.toFixed(2)}</span>
                        </div>
                        <div className="flex items-end justify-between" style={{ paddingTop: 13, borderTop: `1px solid ${bdr}` }}>
                          <div>
                            <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, color: tx2, marginBottom: 2 }}>Total estimado</p>
                            <p style={{ fontSize: 11.5, color: tx2 }}>Facturación mensual · MXN</p>
                          </div>
                          <div className="s shimmer num" style={{ fontSize: 48, lineHeight: 1, fontStyle: 'italic' }}>
                            ${totalAnim.toFixed(2)}
                          </div>
                        </div>
                        {costo.total === 0 && (
                          <div className="flex items-center gap-2" style={{ padding: '10px 14px', borderRadius: 10, backgroundColor: 'rgba(47,175,143,.1)', border: '1px solid rgba(47,175,143,.2)' }}>
                            <span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: '#2FAF8F', flexShrink: 0 }} />
                            <span style={{ fontSize: 12, color: '#2FAF8F', fontWeight: 500 }}>Si no usas servicios de pago, tu cargo es $0.00 MXN.</span>
                          </div>
                        )}
                        <div className="flex items-start gap-2.5" style={{ padding: '10px 14px', borderRadius: 10, backgroundColor: isDark ? 'rgba(44,40,36,.6)' : 'rgba(245,242,240,.8)', fontSize: 11.5, lineHeight: 1.65, color: tx2 }}>
                          <Info style={{ width: 13, height: 13, flexShrink: 0, marginTop: 2 }} strokeWidth={1.75} />
                          Estimación orientativa. El costo final refleja el consumo real del mes.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Todo incluido */}
            <div style={{ padding: '26px 32px' }}>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.11em', color: tx2, marginBottom: 16 }}>Siempre incluido sin cargo adicional</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 9 }}>
                {rolActual.incluido.map((item, i) => (
                  <div key={i} className="flex items-start gap-2.5" style={{ padding: '10px 13px', borderRadius: 10, backgroundColor: isDark ? 'rgba(44,40,36,.5)' : 'rgba(245,242,240,.7)' }}>
                    <div style={{ width: 17, height: 17, borderRadius: 5, backgroundColor: 'rgba(47,175,143,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                      <Check style={{ width: 9, height: 9, color: '#2FAF8F' }} strokeWidth={2.5} />
                    </div>
                    <span style={{ fontSize: 12.5, lineHeight: 1.5, color: isDark ? '#d6d3d1' : '#57534e' }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════
            GANDIA 7 VS TRADICIONAL
        ══════════════════════════════════════════════════════ */}
        <section style={{ borderTop: `1px solid ${bdr}`, borderBottom: `1px solid ${bdr}`, backgroundColor: bg2 }}>
          <div style={{ maxWidth: 1152, margin: '0 auto', padding: '80px 32px' }}>
            <Reveal>
              <div className="flex items-center gap-2.5" style={{ marginBottom: 14 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: '#2FAF8F' }} />
                <span style={{ width: 16, height: 1, backgroundColor: 'rgba(47,175,143,.5)' }} />
                <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.13em', textTransform: 'uppercase', color: tx2 }}>La diferencia es real</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 40 }}>
                <h2 className="s" style={{ fontSize: 'clamp(1.8rem, 4.5vw, 3rem)', fontStyle: 'italic', lineHeight: 1.15, color: tx1, margin: 0 }}>
                  ¿Por qué no una<br />suscripción mensual?
                </h2>
                <p style={{ fontSize: 13, lineHeight: 1.7, color: tx2, maxWidth: 280, margin: 0 }}>
                  Cada peso que pagas debe corresponder a valor generado. No a disponibilidad.
                </p>
              </div>

              {/* Table */}
              <div style={{ borderRadius: 18, border: `1px solid ${bdr}`, overflow: 'hidden', boxShadow: isDark ? '0 1px 40px rgba(0,0,0,.25)' : '0 1px 24px rgba(0,0,0,.06)' }}>

                {/* Header */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr 1fr' }}>
                  <div style={{ padding: '14px 24px', backgroundColor: isDark ? 'rgba(28,25,23,.8)' : 'rgba(250,249,248,.95)', borderBottom: `1px solid ${bdr}`, borderRight: `1px solid ${bdr}` }}>
                    <span style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: tx2 }}>Característica</span>
                  </div>
                  <div style={{ padding: '14px 24px', backgroundColor: isDark ? 'rgba(28,25,23,.8)' : 'rgba(250,249,248,.95)', borderBottom: `1px solid ${bdr}`, borderRight: `1px solid ${bdr}` }}>
                    <div className="flex items-center gap-2">
                      <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#f87171', flexShrink: 0 }} />
                      <span style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: tx2 }}>Sistema tradicional</span>
                    </div>
                  </div>
                  <div style={{ padding: '14px 24px', backgroundColor: isDark ? 'rgba(47,175,143,.07)' : 'rgba(47,175,143,.05)', borderBottom: `1px solid rgba(47,175,143,.2)` }}>
                    <div className="flex items-center gap-2">
                      <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#2FAF8F', flexShrink: 0 }} />
                      <span style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: '#2FAF8F' }}>GANDIA 7</span>
                    </div>
                  </div>
                </div>

                {/* Rows */}
                {[
                  ['Costo mínimo mensual', 'Cuota fija siempre activa', 'Exactamente $0 si no usas'],
                  ['Modelo de cobro', 'Suscripción fija independiente del uso', 'Solo por acción ejecutada'],
                  ['Transparencia de precio', 'Al contratar el plan', 'Antes de cada acción'],
                  ['Mes sin actividad', 'Pagas la cuota igual', 'Tu cargo es $0'],
                  ['Acceso de auditor', 'Requiere licencia de pago', 'Gratuito por ley institucional'],
                  ['Descuentos', 'Negociados individualmente', 'Automáticos por volumen real'],
                ].map(([feat, bad, good], i, arr) => {
                  const isLast = i === arr.length - 1
                  return (
                    <div key={i} className="rw" style={{
                      display: 'grid', gridTemplateColumns: '1.1fr 1fr 1fr',
                      animationDelay: `${i * 40}ms`,
                    }}>
                      {/* Feature */}
                      <div style={{
                        padding: '17px 24px',
                        borderBottom: !isLast ? `1px solid ${bdr}` : 'none',
                        borderRight: `1px solid ${bdr}`,
                        backgroundColor: 'transparent',
                        display: 'flex', alignItems: 'center',
                      }}>
                        <span style={{ fontSize: 13, fontWeight: 500, color: tx1, lineHeight: 1.4 }}>{feat}</span>
                      </div>
                      {/* Traditional */}
                      <div style={{
                        padding: '17px 24px',
                        borderBottom: !isLast ? `1px solid ${bdr}` : 'none',
                        borderRight: `1px solid ${bdr}`,
                        backgroundColor: 'transparent',
                        display: 'flex', alignItems: 'center', gap: 10,
                      }}>
                        <div style={{
                          width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                          backgroundColor: 'rgba(248,113,113,.12)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <svg style={{ width: 9, height: 9, color: '#f87171' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
                        </div>
                        <span style={{ fontSize: 12.5, color: tx2, lineHeight: 1.45 }}>{bad}</span>
                      </div>
                      {/* GANDIA 7 */}
                      <div style={{
                        padding: '17px 24px',
                        borderBottom: !isLast ? `1px solid rgba(47,175,143,.12)` : 'none',
                        backgroundColor: isDark ? 'rgba(47,175,143,.035)' : 'rgba(47,175,143,.028)',
                        display: 'flex', alignItems: 'center', gap: 10,
                      }}>
                        <div style={{
                          width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                          backgroundColor: 'rgba(47,175,143,.15)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <svg style={{ width: 9, height: 9, color: '#2FAF8F' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6 9 17l-5-5"/></svg>
                        </div>
                        <span style={{ fontSize: 12.5, fontWeight: 500, color: isDark ? '#6ee7b7' : '#065f46', lineHeight: 1.45 }}>{good}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── Roles comparison table ──────────────────────── */}
        <section style={{ maxWidth: 1152, margin: '0 auto', padding: '80px 32px' }}>
          <Reveal>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 36 }}>
              <div>
                <div className="flex items-center gap-2.5" style={{ marginBottom: 12 }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: '#2FAF8F' }} />
                  <span style={{ width: 16, height: 1, backgroundColor: 'rgba(47,175,143,.5)' }} />
                  <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.13em', textTransform: 'uppercase', color: tx2 }}>Comparativa de roles</span>
                </div>
                <h2 className="s" style={{ fontSize: 'clamp(1.9rem, 5vw, 3.2rem)', fontStyle: 'italic', lineHeight: 1.12, color: tx1, margin: 0 }}>
                  Cinco roles.<br /><span style={{ color: tx2 }}>Un principio.</span>
                </h2>
              </div>
              <p style={{ fontSize: 13, color: tx2, lineHeight: 1.7, maxWidth: 260, margin: 0 }}>
                Selecciona un rol para ver su modelo de costos en detalle.
              </p>
            </div>

            <div style={{ borderRadius: 18, border: `1px solid ${bdr}`, overflow: 'hidden', boxShadow: isDark ? '0 1px 40px rgba(0,0,0,.2)' : '0 1px 20px rgba(0,0,0,.05)' }}>
              {/* Header */}
              <div style={{
                display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 0.7fr',
                padding: '12px 22px',
                backgroundColor: isDark ? 'rgba(28,25,23,.9)' : 'rgba(249,248,247,.95)',
                borderBottom: `1px solid ${bdr}`,
              }}>
                {['Rol', 'Modelo', 'Costo base', ''].map((h, hi) => (
                  <span key={hi} style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: tx2 }}>{h}</span>
                ))}
              </div>

              {/* Rows */}
              {(Object.keys(ROLES) as RolType[]).map((r, i, arr) => {
                const c = ROLES[r]
                const active = r === rol
                const isLast = i === arr.length - 1

                const priceBadge = r === 'auditor'
                  ? { label: 'Gratuito', bg: 'rgba(255,59,48,.1)', color: '#FF3B30' }
                  : r === 'union'
                  ? { label: '$2,500/mes', bg: isDark ? 'rgba(175,82,222,.14)' : 'rgba(175,82,222,.1)', color: '#AF52DE' }
                  : { label: 'Por consumo', bg: isDark ? 'rgba(47,175,143,.12)' : 'rgba(47,175,143,.1)', color: '#2FAF8F' }

                return (
                  <button
                    key={r}
                    onClick={() => setRol(r)}
                    style={{
                      display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 0.7fr',
                      alignItems: 'center', padding: '16px 22px',
                      border: 'none',
                      borderBottom: !isLast ? `1px solid ${bdr}` : 'none',
                      borderLeft: `3px solid ${active ? c.color : 'transparent'}`,
                      backgroundColor: active
                        ? (isDark ? `${c.color}0d` : `${c.color}08`)
                        : 'transparent',
                      cursor: 'pointer',
                      color: 'inherit', textAlign: 'left', width: '100%',
                      transition: 'background-color 160ms ease',
                    }}
                  >
                    {/* Rol */}
                    <div className="flex items-center gap-3">
                      <div style={{
                        width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                        backgroundColor: `${c.color}18`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: active ? `1px solid ${c.color}40` : `1px solid transparent`,
                        transition: 'border-color 160ms ease',
                      }}>
                        <c.icono style={{ width: 13, height: 13, color: c.color }} strokeWidth={1.75} />
                      </div>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: active ? 600 : 500, color: active ? tx1 : tx1, margin: 0, lineHeight: 1.3 }}>{c.nombreCorto}</p>
                        <p style={{ fontSize: 11, color: tx2, margin: 0, marginTop: 2 }}>{c.tagline}</p>
                      </div>
                    </div>

                    {/* Modelo */}
                    <span style={{ fontSize: 12, color: tx2, lineHeight: 1.4 }}>
                      {r === 'auditor' ? 'Acceso institucional' : r === 'union' ? 'Licencia fija' : 'Por acción'}
                    </span>

                    {/* Precio badge */}
                    <div>
                      <span className="s" style={{
                        display: 'inline-flex', alignItems: 'center',
                        padding: '4px 10px', borderRadius: 999,
                        fontSize: 12.5, fontStyle: 'italic',
                        backgroundColor: priceBadge.bg,
                        color: priceBadge.color,
                        fontWeight: 500,
                      }}>
                        {priceBadge.label}
                      </span>
                    </div>

                    {/* CTA */}
                    <div className="flex items-center justify-end">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleVerDetalle(r) }}
                        style={{
                          fontSize: 11.5,
                          color: active ? c.color : tx2,
                          display: 'flex', alignItems: 'center', gap: 4,
                          transition: 'color 160ms ease',
                          background: 'none', border: 'none', cursor: 'pointer',
                          padding: '6px 10px', borderRadius: 8,
                          backgroundColor: active ? `${c.color}12` : 'transparent',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.color = c.color; e.currentTarget.style.backgroundColor = `${c.color}12` }}
                        onMouseLeave={e => { e.currentTarget.style.color = active ? c.color : tx2; e.currentTarget.style.backgroundColor = active ? `${c.color}12` : 'transparent' }}
                      >
                        Ver detalle
                        <svg style={{ width: 10, height: 10, transform: active ? 'translateX(2px)' : 'none', transition: 'transform 160ms ease' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                      </button>
                    </div>
                  </button>
                )
              })}
            </div>
          </Reveal>
        </section>

        {/* ── Stats strip ─────────────────────────────────── */}
        <section style={{ borderTop: `1px solid ${bdr}`, backgroundColor: bg2 }}>
          <div style={{ maxWidth: 1152, margin: '0 auto', padding: '72px 32px' }}>
            <Reveal>
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
                borderRadius: 18, overflow: 'hidden',
                border: `1px solid ${bdr}`,
                boxShadow: isDark ? '0 1px 32px rgba(0,0,0,.2)' : '0 1px 20px rgba(0,0,0,.05)',
              }}>
                {[
                  { n: '$0',  sub: 'si no usas nada este mes',    note: 'Sin cargos de inactividad', color: '#2FAF8F' },
                  { n: '48h', sub: 'certificación promedio',      note: 'De registro a documento',  color: '#007AFF' },
                  { n: '20%', sub: 'descuento máximo automático', note: 'A partir de 500 ops/mes',  color: '#AF52DE' },
                  { n: '∞',   sub: 'historial consultable',       note: 'Sin restricción de acceso', color: '#FF9500' },
                ].map((s, i, arr) => (
                  <div key={i} style={{
                    padding: '36px 28px',
                    textAlign: 'center',
                    backgroundColor: bg3,
                    borderRight: i < arr.length - 1 ? `1px solid ${bdr}` : 'none',
                    position: 'relative',
                    overflow: 'hidden',
                  }}>
                    {/* Subtle ambient glow */}
                    <div style={{
                      position: 'absolute', inset: 0, pointerEvents: 'none',
                      background: `radial-gradient(ellipse 80% 60% at 50% 0%, ${s.color}12 0%, transparent 70%)`,
                    }} />
                    <div className="s shimmer" style={{
                      fontSize: 42, fontStyle: 'italic', lineHeight: 1,
                      marginBottom: 12, position: 'relative',
                    }}>{s.n}</div>
                    <p style={{ fontSize: 12, fontWeight: 600, color: tx1, marginBottom: 5, lineHeight: 1.4, position: 'relative' }}>{s.sub}</p>
                    <p style={{ fontSize: 11, color: tx2, lineHeight: 1.5, position: 'relative' }}>{s.note}</p>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════
            FAQ
        ══════════════════════════════════════════════════════ */}
        <section style={{ borderTop: `1px solid ${bdr}` }}>
          <div style={{ maxWidth: 1152, margin: '0 auto', padding: '72px 32px' }}>
            <div style={{ maxWidth: 720, margin: '0 auto' }}>
            <Reveal>
              <div className="flex items-center gap-2.5" style={{ marginBottom: 12 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: '#2FAF8F' }} />
                <span style={{ width: 16, height: 1, backgroundColor: 'rgba(47,175,143,.5)' }} />
                <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.13em', textTransform: 'uppercase', color: tx2 }}>Preguntas frecuentes</span>
              </div>
              <h2 className="s" style={{ fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', fontStyle: 'italic', lineHeight: 1.15, marginBottom: 48, color: tx1 }}>
                Dudas sobre el modelo.
              </h2>
            </Reveal>
            <Reveal delay={80}>
              {FAQS.map((faq, i) => {
                const open = faqIdx === i
                return (
                  <div key={i} style={{ borderBottom: `1px solid ${bdr}` }}>
                    <button
                      onClick={() => setFaqIdx(open ? null : i)}
                      aria-expanded={open}
                      className="w-full py-5 flex items-center justify-between text-left group"
                    >
                      <span style={{
                        fontSize: 13.5, fontWeight: 500, lineHeight: 1.45,
                        color: open ? '#2FAF8F' : tx1,
                        transition: 'color 200ms ease',
                      }}>
                        {faq.q}
                      </span>
                      <span style={{
                        width: 24, height: 24, borderRadius: '50%', flexShrink: 0, marginLeft: 16,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: `1px solid ${open ? 'rgba(47,175,143,.4)' : bdr}`,
                        backgroundColor: open ? 'rgba(47,175,143,.12)' : 'transparent',
                        transition: 'all 280ms ease',
                      }}>
                        <ChevronDown style={{
                          width: 12, height: 12,
                          color: open ? '#2FAF8F' : tx2,
                          transform: open ? 'rotate(180deg)' : 'none',
                          transition: 'transform 300ms cubic-bezier(.4,0,.2,1), color 200ms ease',
                        }} strokeWidth={2} />
                      </span>
                    </button>
                    <div className="acc overflow-hidden" style={{ maxHeight: open ? 260 : 0, opacity: open ? 1 : 0 }}>
                      <p style={{ fontSize: 13, lineHeight: 1.78, color: tx2, paddingBottom: 20 }}>{faq.a}</p>
                    </div>
                  </div>
                )
              })}
            </Reveal>
            </div>
          </div>
        </section>
        {/* ══════════════════════════════════════════════════════
            CTA — closing statement
        ══════════════════════════════════════════════════════ */}
        <section style={{ borderTop: `1px solid ${bdr}` }}>
          <div style={{ maxWidth: 1152, margin: '0 auto', padding: '80px 32px 100px' }}>
            <Reveal>
              <div style={{ borderRadius: 24, border: `1px solid ${bdr}`, backgroundColor: bg2, overflow: 'hidden', position: 'relative' }}>
                {/* Ambient orbs */}
                <div className="ca1 absolute" style={{ width: 380, height: 380, borderRadius: '50%', backgroundColor: '#2FAF8F', filter: 'blur(72px)', top: -120, right: -80, zIndex: 0, pointerEvents: 'none' }} />
                <div className="ca2 absolute" style={{ width: 260, height: 260, borderRadius: '50%', backgroundColor: '#2FAF8F', filter: 'blur(56px)', bottom: -100, left: -40, zIndex: 0, pointerEvents: 'none' }} />

                <div style={{ position: 'relative', zIndex: 1, padding: '60px 48px', textAlign: 'center' }}>
                  <div style={{ width: 50, height: 50, borderRadius: 13, margin: '0 auto 26px', backgroundColor: 'rgba(47,175,143,.14)', border: '1px solid rgba(47,175,143,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg style={{ width: 22, height: 22, color: '#2FAF8F' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                      <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
                    </svg>
                  </div>
                  <h2 className="s" style={{ fontSize: 'clamp(2rem, 6vw, 3.8rem)', fontStyle: 'italic', lineHeight: 1.1, marginBottom: 14, color: tx1 }}>
                    Comienza a construir<br />certeza ganadera.
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
                    <button onClick={() => navigate('/contacto')} style={{
                      padding: '13px 30px', borderRadius: 12, cursor: 'pointer',
                      border: `1px solid ${bdr}`,
                      backgroundColor: isDark ? 'rgba(28,25,23,.6)' : 'rgba(255,255,255,.7)',
                      color: tx2, fontSize: 14, fontWeight: 500, transition: 'all 180ms ease',
                    }}
                      onMouseEnter={e => { e.currentTarget.style.color = tx1; e.currentTarget.style.borderColor = isDark ? '#78716c' : '#a8a29e' }}
                      onMouseLeave={e => { e.currentTarget.style.color = tx2; e.currentTarget.style.borderColor = bdr }}
                    >
                      Hablar con el equipo
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

        <Footer isDark={isDark} />
      </div>
    </>
  )
}