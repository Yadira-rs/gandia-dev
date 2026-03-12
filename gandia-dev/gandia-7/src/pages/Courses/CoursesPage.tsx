import { useState, useEffect, useRef } from 'react'
import Header from '../../components/ui/Header'
import Footer from '../../components/ui/Footer'
import { supabase } from '../../lib/supabaseClient'

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface CourseData {
    id: string
    title: string
    subtitle: string
    description: string
    level: string
    duration: string
    modules: number
    tags: string[]
    color: string        // accent color per card
    colorBg: string
    colorDarkBg: string
    index: string
}

// ─────────────────────────────────────────────────────────────────────────────
// CATALOG  — sin datos inventados
// ─────────────────────────────────────────────────────────────────────────────

const COURSES: CourseData[] = [
    {
        id: 'domina-gandia-7',
        index: '01',
        title: 'Domina GANDIA 7',
        subtitle: 'Operación completa de la plataforma',
        description:
            'Desde el registro de tu primer bovino hasta la generación de certificados y pasaportes. Un recorrido completo por cada módulo del sistema para que operes con autonomía desde el día uno.',
        level: 'Principiante',
        duration: 'Por definir',
        modules: 8,
        tags: ['Trazabilidad', 'Pasaportes', 'SINIIGA', 'Certificación'],
        color: '#2FAF8F',
        colorBg: 'rgba(47,175,143,0.09)',
        colorDarkBg: 'rgba(47,175,143,0.12)',
    },
    {
        id: 'ganaderia-inteligente',
        index: '02',
        title: 'Ganadería Inteligente',
        subtitle: 'IA, IoT y datos aplicados al rancho',
        description:
            'Inteligencia artificial, sensores y análisis predictivo integrados al día a día de la operación ganadera. Tecnología práctica para el campo mexicano.',
        level: 'Intermedio',
        duration: 'Por definir',
        modules: 6,
        tags: ['IA', 'IoT', 'Análisis', 'Automatización'],
        color: '#3B6FD4',
        colorBg: 'rgba(59,111,212,0.09)',
        colorDarkBg: 'rgba(59,111,212,0.12)',
    },
    {
        id: 'exportacion-normativa',
        index: '03',
        title: 'Exportación y Normativa',
        subtitle: 'SENASICA, NOM y mercados internacionales',
        description:
            'Todo lo que necesitas para exportar ganado con cumplimiento total: normativa sanitaria mexicana e internacional, certificación oficial y gestión documental.',
        level: 'Avanzado',
        duration: 'Por definir',
        modules: 7,
        tags: ['Exportación', 'SENASICA', 'NOM', 'Cumplimiento'],
        color: '#C4622A',
        colorBg: 'rgba(196,98,42,0.09)',
        colorDarkBg: 'rgba(196,98,42,0.12)',
    },
]

// ─────────────────────────────────────────────────────────────────────────────
// GHOST LOADER
// ─────────────────────────────────────────────────────────────────────────────

function GhostLoader() {
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#FAFAF8] dark:bg-[#0c0a09] overflow-hidden">
            <div className="flex flex-col items-center">
                <div className="relative w-14 h-14 mb-7" style={{ animation: 'gl-in 0.6s ease 0.05s both' }}>
                    <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#2FAF8F" strokeWidth="1.75"
                        style={{ filter: 'drop-shadow(0 0 18px rgba(47,175,143,0.22))' }}>
                        <path style={{ animation: 'gl-layer 2.4s ease-in-out infinite' }} d="M12 2L2 7l10 5 10-5-10-5z" />
                        <path style={{ animation: 'gl-layer 2.4s ease-in-out 0.3s infinite' }} d="M2 12l10 5 10-5" />
                        <path style={{ animation: 'gl-layer 2.4s ease-in-out 0.6s infinite' }} d="M2 17l10 5 10-5" />
                    </svg>
                    <div className="absolute top-1/2 left-1/2 w-24 h-24 rounded-full pointer-events-none"
                        style={{ background: 'radial-gradient(circle,rgba(47,175,143,0.18) 0%,transparent 70%)', filter: 'blur(16px)', transform: 'translate(-50%,-50%)', animation: 'gl-glow 2.4s ease-in-out infinite' }} />
                </div>
                <div className="flex items-baseline gap-1.5 mb-5" style={{ animation: 'gl-in 0.6s ease 0.12s both' }}>
                    <span className="text-[22px] font-bold tracking-[0.06em] text-stone-900 dark:text-stone-100" style={{ fontFamily: "'Fraunces',Georgia,serif" }}>GANDIA</span>
                    <span className="text-[22px] font-normal italic text-[#2FAF8F]" style={{ fontFamily: "'Fraunces',Georgia,serif" }}>7</span>
                </div>
                <div className="w-8 h-px mb-4 bg-gradient-to-r from-transparent via-stone-300 dark:via-stone-700 to-transparent" style={{ animation: 'gl-in 0.6s ease 0.18s both' }} />
                <p className="text-[12px] font-medium tracking-[0.06em] uppercase text-stone-400 mb-4" style={{ fontFamily: "'Outfit',sans-serif", animation: 'gl-in 0.6s ease 0.24s both' }}>Academia</p>
                <div className="w-32 h-0.5 rounded-full overflow-hidden bg-stone-200 dark:bg-stone-800" style={{ animation: 'gl-in 0.6s ease 0.28s both' }}>
                    <div className="h-full bg-[#2FAF8F]" style={{ animation: 'gl-bar 1.8s cubic-bezier(0.4,0,0.2,1) infinite' }} />
                </div>
            </div>
            {[
                { p: 'top-5 left-5', s: { borderTop: '2px solid rgba(47,175,143,0.5)', borderLeft: '2px solid rgba(47,175,143,0.5)' } },
                { p: 'top-5 right-5', s: { borderTop: '2px solid rgba(47,175,143,0.5)', borderRight: '2px solid rgba(47,175,143,0.5)' } },
                { p: 'bottom-5 left-5', s: { borderBottom: '2px solid rgba(47,175,143,0.5)', borderLeft: '2px solid rgba(47,175,143,0.5)' } },
                { p: 'bottom-5 right-5', s: { borderBottom: '2px solid rgba(47,175,143,0.5)', borderRight: '2px solid rgba(47,175,143,0.5)' } },
            ].map((c, i) => (
                <div key={i} className={`absolute ${c.p} w-8 h-8`} style={{ ...c.s, animation: `gl-corner 0.5s ease ${0.5 + i * 0.06}s both` }} />
            ))}
            <style>{`
        @keyframes gl-layer { 0%,100%{opacity:1;transform:translateY(0) scale(1)} 50%{opacity:.45;transform:translateY(-5px) scale(.97)} }
        @keyframes gl-glow   { 0%,100%{opacity:.5;transform:translate(-50%,-50%) scale(1)} 50%{opacity:1;transform:translate(-50%,-50%) scale(1.15)} }
        @keyframes gl-bar    { 0%{transform:translateX(-100%)} 60%{transform:translateX(0%)} 100%{transform:translateX(100%)} }
        @keyframes gl-in     { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes gl-corner { from{opacity:0;transform:scale(.7)} to{opacity:1;transform:scale(1)} }
      `}</style>
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// SCROLL REVEAL
// ─────────────────────────────────────────────────────────────────────────────

function useReveal(threshold = 0.07) {
    const [visible, setVisible] = useState(false)
    const ref = useRef<HTMLDivElement>(null)
    useEffect(() => {
        const el = ref.current
        if (!el) return
        const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } }, { threshold })
        obs.observe(el)
        return () => obs.disconnect()
    }, [threshold])
    return { ref, visible }
}

// ─────────────────────────────────────────────────────────────────────────────
// COURSE CARD — estilo Pixel Point, capas con masks
// ─────────────────────────────────────────────────────────────────────────────

function CourseCard({ course, delay = 0, isDark, onNotify }: { course: CourseData; delay?: number; isDark: boolean; onNotify: () => void }) {
    const { ref, visible } = useReveal()

    return (
        <div
            ref={ref}
            className="group relative rounded-2xl overflow-hidden border border-black/[0.07] dark:border-white/[0.07] bg-white dark:bg-[#141210] shadow-[0_2px_12px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.3)] hover:shadow-[0_16px_48px_rgba(0,0,0,0.11)] dark:hover:shadow-[0_16px_48px_rgba(0,0,0,0.5)] hover:-translate-y-1 hover:border-black/[0.12] dark:hover:border-white/[0.12] transition-all duration-400"
            style={{
                opacity: visible ? 1 : 0,
                transform: visible ? 'none' : 'translateY(22px)',
                transition: `opacity .55s ease ${delay}ms, transform .55s ease ${delay}ms, box-shadow .3s ease, border-color .3s ease`,
            }}
        >
            {/* Top accent line on hover */}
            <div className="absolute top-0 inset-x-0 h-px z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: `linear-gradient(90deg, transparent, ${course.color}80, transparent)` }} aria-hidden="true" />

            {/* Visual header — masked grid Pixel Point style */}
            <div className="relative h-[160px] overflow-hidden"
                style={{ background: isDark ? '#0d0b0a' : '#f7f6f3' }}>

                {/* Layer 1: dot grid, radial-masked */}
                <div aria-hidden="true" className="absolute inset-0"
                    style={{
                        backgroundImage: `radial-gradient(circle, ${course.color}28 1px, transparent 1px)`,
                        backgroundSize: '22px 22px',
                        maskImage: 'radial-gradient(ellipse 90% 100% at 50% 100%, black 30%, transparent 80%)',
                        WebkitMaskImage: 'radial-gradient(ellipse 90% 100% at 50% 100%, black 30%, transparent 80%)',
                    }}
                />

                {/* Layer 2: line grid, center-masked */}
                <div aria-hidden="true" className="absolute inset-0"
                    style={{
                        backgroundImage: `linear-gradient(${course.color}12 1px, transparent 1px), linear-gradient(90deg, ${course.color}12 1px, transparent 1px)`,
                        backgroundSize: '36px 36px',
                        maskImage: 'radial-gradient(ellipse 70% 80% at 50% 50%, black 10%, transparent 70%)',
                        WebkitMaskImage: 'radial-gradient(ellipse 70% 80% at 50% 50%, black 10%, transparent 70%)',
                    }}
                />

                {/* Glow orb */}
                <div aria-hidden="true" className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-32 h-32 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                        style={{ background: `radial-gradient(circle, ${course.color}22 0%, transparent 70%)`, filter: 'blur(20px)' }} />
                </div>

                {/* Index + level */}
                <div className="absolute top-5 left-5 flex items-center gap-2.5">
                    <span className="text-[11px] font-bold tracking-[0.1em] text-stone-400 dark:text-stone-600"
                        style={{ fontFamily: "'Outfit',sans-serif" }}>
                        {course.index}
                    </span>
                    <span className="w-px h-3 bg-stone-300 dark:bg-stone-700" />
                    <span className="text-[11px] font-semibold tracking-[0.04em] px-2.5 py-0.5 rounded-full"
                        style={{ color: course.color, background: isDark ? course.colorDarkBg : course.colorBg, fontFamily: "'Outfit',sans-serif" }}>
                        {course.level}
                    </span>
                </div>

                {/* Próximamente badge */}
                <div className="absolute top-5 right-5">
                    <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-stone-400 dark:text-stone-500"
                        style={{ fontFamily: "'Outfit',sans-serif" }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                        Próximamente
                    </span>
                </div>

                {/* Module count — center bottom */}
                <div className="absolute bottom-5 left-5">
                    <span className="text-[12px] text-stone-400 dark:text-stone-500 flex items-center gap-1.5"
                        style={{ fontFamily: "'Outfit',sans-serif" }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                        </svg>
                        {course.modules} módulos
                    </span>
                </div>
            </div>

            {/* Body */}
            <div className="p-6">
                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                    {course.tags.slice(0, 3).map(t => (
                        <span key={t} className="text-[10.5px] px-2.5 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800/60 text-stone-500 dark:text-stone-400 tracking-[0.02em]"
                            style={{ fontFamily: "'Outfit',sans-serif" }}>
                            {t}
                        </span>
                    ))}
                </div>

                <h3 className="text-[20px] font-bold tracking-[-0.028em] leading-[1.2] text-stone-900 dark:text-stone-50 mb-1 group-hover:text-[#2FAF8F] transition-colors duration-200"
                    style={{ fontFamily: "'Fraunces',Georgia,serif" }}>
                    {course.title}
                </h3>
                <p className="text-[12.5px] mb-3" style={{ color: course.color, fontFamily: "'Outfit',sans-serif", fontWeight: 600 }}>
                    {course.subtitle}
                </p>
                <p className="text-[13px] text-stone-500 dark:text-stone-400 leading-[1.7]"
                    style={{ fontFamily: "'Outfit',sans-serif" }}>
                    {course.description}
                </p>

                {/* Footer */}
                <div className="flex items-center justify-between pt-5 mt-5 border-t border-black/[0.05] dark:border-white/[0.05]">
                    <span className="text-[12px] text-stone-400 dark:text-stone-500" style={{ fontFamily: "'Outfit',sans-serif" }}>
                        {course.duration}
                    </span>
                    <span className="flex items-center gap-1.5 text-[12px] font-semibold cursor-pointer" style={{ color: course.color, fontFamily: "'Outfit',sans-serif" }} onClick={onNotify} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && onNotify()}>
                        Avísame
                        <span className="w-5 h-5 rounded-full flex items-center justify-center transition-all duration-200 group-hover:translate-x-0.5"
                            style={{ background: isDark ? course.colorDarkBg : course.colorBg }}>
                            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                <path d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                        </span>
                    </span>
                </div>
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// WAITLIST SECTION — exactamente como el newsletter del Blog
// ─────────────────────────────────────────────────────────────────────────────

function WaitlistSection({ sectionRef }: { isDark?: boolean; sectionRef: React.RefObject<HTMLElement | null> }) {
    const [email, setEmail] = useState('')
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
    const [message, setMessage] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            setStatus('error')
            setMessage('Por favor ingresa un email válido')
            setTimeout(() => setStatus('idle'), 3000)
            return
        }
        setStatus('loading')
        try {
            const { error } = await supabase
                .from('course_waitlist')
                .insert({ email: email.trim().toLowerCase(), source: 'courses_page' })

            if (error) {
                // Email duplicado → tratarlo como éxito silencioso
                if (error.code === '23505') {
                    setStatus('success')
                    setMessage('¡Ya estás en la lista! Te avisamos cuando abran.')
                    setEmail('')
                    return
                }
                throw error
            }

            setStatus('success')
            setMessage('¡Listo! Te avisamos cuando abran los cursos.')
            setEmail('')
        } catch {
            setStatus('error')
            setMessage('Error al guardar. Intenta de nuevo.')
            setTimeout(() => setStatus('idle'), 4000)
        }
    }

    return (
        <section
            ref={sectionRef}
            aria-label="Avísame cuando abran los cursos"
            className="relative overflow-hidden border-t border-black/[0.07] dark:border-white/[0.05] bg-[#F3F2EF] dark:bg-[#0f0d0b]"
        >
            {/* Ambient orbs — igual que newsletter del blog */}
            <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-[#2FAF8F] opacity-[0.06] blur-[80px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-56 h-56 rounded-full bg-[#2FAF8F] opacity-[0.04] blur-[60px] pointer-events-none" />

            <div className="relative z-10 max-w-4xl mx-auto px-6 py-20 lg:py-28">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

                    {/* Left — copy */}
                    <div>
                        <div className="flex items-center gap-2 mb-6">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#2FAF8F]" />
                            <span className="w-[18px] h-px bg-[#2FAF8F]/50" />
                            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#2FAF8F]"
                                style={{ fontFamily: "'Outfit',sans-serif" }}>
                                Acceso anticipado
                            </span>
                        </div>

                        <h2 className="text-[32px] lg:text-[40px] font-bold tracking-[-0.04em] leading-[1.08] text-stone-900 dark:text-stone-50 mb-4"
                            style={{ fontFamily: "'Fraunces',Georgia,serif" }}>
                            Sé el primero en<br />
                            <em className="font-normal italic text-stone-400 dark:text-stone-500">acceder cuando abran</em>
                        </h2>

                        <p className="text-[15px] text-stone-500 dark:text-stone-400 leading-[1.72] mb-8"
                            style={{ fontFamily: "'Outfit',sans-serif" }}>
                            Los cursos están en producción. Deja tu correo y te avisamos en cuanto el primero esté disponible — sin spam, solo una notificación.
                        </p>

                        <div className="flex flex-col gap-3">
                            {[
                                'Acceso antes de la apertura oficial',
                                'Notificación inmediata cuando esté listo',
                                'Sin obligación ni cargo alguno',
                            ].map(item => (
                                <div key={item} className="flex items-center gap-2.5">
                                    <div className="w-4 h-4 rounded-full flex items-center justify-center bg-[rgba(47,175,143,0.12)] shrink-0">
                                        <svg className="w-2.5 h-2.5 text-[#2FAF8F]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                            <path d="M20 6L9 17l-5-5" />
                                        </svg>
                                    </div>
                                    <span className="text-[13.5px] text-stone-600 dark:text-stone-400"
                                        style={{ fontFamily: "'Outfit',sans-serif" }}>
                                        {item}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right — form card, igual que newsletter */}
                    <div className="bg-white dark:bg-[#141210] rounded-2xl p-8 border border-black/[0.07] dark:border-white/[0.07] shadow-[0_4px_18px_rgba(0,0,0,0.07)] dark:shadow-[0_4px_18px_rgba(0,0,0,0.4)]">
                        <form onSubmit={handleSubmit} noValidate className="space-y-4">

                            {/* Eyebrow */}
                            <div className="mb-6">
                                <p className="text-[16px] font-bold tracking-[-0.02em] text-stone-900 dark:text-stone-100 mb-1"
                                    style={{ fontFamily: "'Fraunces',Georgia,serif" }}>
                                    Avísame cuando abran
                                </p>
                                <p className="text-[12.5px] text-stone-500 dark:text-stone-400"
                                    style={{ fontFamily: "'Outfit',sans-serif" }}>
                                    3 cursos en camino — empieza por el tuyo.
                                </p>
                            </div>

                            <div className="relative">
                                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="2" y="4" width="20" height="16" rx="2" /><path d="M2 7l10 7 10-7" />
                                </svg>
                                <input
                                    type="email"
                                    placeholder="tu@correo.com"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    disabled={status === 'loading' || status === 'success'}
                                    aria-label="Tu correo electrónico"
                                    autoComplete="email"
                                    required
                                    className="w-full pl-10 pr-4 py-3 rounded-xl text-[14px] bg-stone-50 dark:bg-stone-900/60 border border-black/[0.08] dark:border-white/[0.08] text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:border-[#2FAF8F] focus:ring-2 focus:ring-[rgba(47,175,143,0.2)] transition-all disabled:opacity-50"
                                    style={{ fontFamily: "'Outfit',sans-serif" }}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={status === 'loading' || status === 'success'}
                                className={`w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl text-[14px] font-semibold transition-all duration-200 active:scale-[0.98] disabled:opacity-70
                  ${status === 'success'
                                        ? 'bg-emerald-500 text-white'
                                        : status === 'error'
                                            ? 'bg-rose-500 text-white'
                                            : 'bg-stone-900 dark:bg-stone-50 text-white dark:text-stone-900 hover:bg-stone-800 dark:hover:bg-stone-200 shadow-sm hover:shadow-md'
                                    }`}
                                style={{ fontFamily: "'Outfit',sans-serif" }}
                            >
                                {status === 'idle' && (
                                    <>Avisarme <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg></>
                                )}
                                {status === 'loading' && (
                                    <><span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Guardando...</>
                                )}
                                {status === 'success' && (
                                    <><svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5" /></svg> ¡Te avisamos!</>
                                )}
                                {status === 'error' && 'Intentar de nuevo'}
                            </button>

                            {message && (
                                <p role="alert" aria-live="polite"
                                    className={`text-[12px] text-center ${status === 'success' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}
                                    style={{ fontFamily: "'Outfit',sans-serif" }}>
                                    {message}
                                </p>
                            )}
                        </form>

                        <p className="text-[11px] text-stone-400 dark:text-stone-500 text-center mt-4"
                            style={{ fontFamily: "'Outfit',sans-serif" }}>
                            Sin spam. Solo un correo cuando esté listo.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function CoursesPage() {
    const [ready, setReady] = useState(false)
    const waitlistRef = useRef<HTMLElement>(null)
    const [isDark, setIsDark] = useState(() =>
        typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)').matches : false
    )

    const scrollToWaitlist = () =>
        waitlistRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })

    useEffect(() => {
        const mq = window.matchMedia('(prefers-color-scheme: dark)')
        const fn = (e: MediaQueryListEvent) => setIsDark(e.matches)
        mq.addEventListener('change', fn)
        return () => mq.removeEventListener('change', fn)
    }, [])

    useEffect(() => {
        const t = setTimeout(() => setReady(true), 680)
        return () => clearTimeout(t)
    }, [])

    if (!ready) return <GhostLoader />

    return (
        <div className="min-h-screen bg-[#FAFAF8] dark:bg-[#0c0a09] text-stone-900 dark:text-stone-100">
            <Header currentSection="cursos" isDark={isDark} />

            {/* ── HERO ──────────────────────────────────────────────────────── */}
            <section
                className="relative overflow-hidden border-b border-black/[0.06] dark:border-white/[0.05]"
                style={{ background: isDark ? '#0c0a09' : '#FAFAF8' }}
            >
                {/* Pixel Point: dot grid radial mask — centrado arriba */}
                <div aria-hidden="true" className="absolute inset-0"
                    style={{
                        backgroundImage: `radial-gradient(circle, ${isDark ? 'rgba(255,255,255,0.045)' : 'rgba(0,0,0,0.06)'} 1px, transparent 1px)`,
                        backgroundSize: '28px 28px',
                        maskImage: 'radial-gradient(ellipse 80% 70% at 50% 0%, black 0%, transparent 100%)',
                        WebkitMaskImage: 'radial-gradient(ellipse 80% 70% at 50% 0%, black 0%, transparent 100%)',
                    }}
                />

                {/* Línea grid secundaria */}
                <div aria-hidden="true" className="absolute inset-0"
                    style={{
                        backgroundImage: `linear-gradient(rgba(47,175,143,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(47,175,143,0.05) 1px, transparent 1px)`,
                        backgroundSize: '80px 80px',
                        maskImage: 'radial-gradient(ellipse 60% 55% at 50% 0%, black 0%, transparent 100%)',
                        WebkitMaskImage: 'radial-gradient(ellipse 60% 55% at 50% 0%, black 0%, transparent 100%)',
                    }}
                />

                <div className="relative z-10 max-w-6xl mx-auto px-6 pt-20 pb-16 lg:pt-28 lg:pb-24">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

                        {/* LEFT — copy */}
                        <div>
                            {/* Eyebrow */}
                            <div className="flex items-center gap-2.5 mb-6" style={{ animation: 'fu 0.65s ease both' }}>
                                <span className="w-1.5 h-1.5 rounded-full bg-[#2FAF8F] shrink-0" />
                                <span className="w-[18px] h-px bg-[#2FAF8F]/50 shrink-0" />
                                <span className="text-[11px] font-semibold tracking-[0.14em] uppercase text-stone-400 dark:text-stone-500"
                                    style={{ fontFamily: "'Outfit',sans-serif" }}>
                                    Academia GANDIA 7
                                </span>
                            </div>

                            <h1
                                className="text-[clamp(42px,5.8vw,76px)] font-bold tracking-[-0.05em] leading-[0.96] text-stone-900 dark:text-stone-50 mb-6"
                                style={{ fontFamily: "'Fraunces',Georgia,serif", animation: 'fu 0.72s ease 0.07s both' }}
                            >
                                El campo del<br />
                                futuro se<br />
                                <em className="font-normal italic text-[#2FAF8F]">aprende aquí.</em>
                            </h1>

                            <p
                                className="text-[15.5px] text-stone-500 dark:text-stone-400 leading-[1.74] mb-8"
                                style={{ fontFamily: "'Outfit',sans-serif", animation: 'fu 0.72s ease 0.14s both' }}
                            >
                                Cursos diseñados por el equipo GANDIA para ganaderos que quieren operar con tecnología de clase mundial. Tres cursos en producción — apertura próxima.
                            </p>

                            <div className="flex flex-wrap gap-3" style={{ animation: 'fu 0.72s ease 0.2s both' }}>
                                {['3 cursos en camino', 'Acceso gratuito', 'Certificación oficial'].map(t => (
                                    <span key={t}
                                        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[12px] font-medium border border-black/[0.08] dark:border-white/[0.08] text-stone-600 dark:text-stone-400 bg-white/80 dark:bg-white/[0.04]"
                                        style={{ fontFamily: "'Outfit',sans-serif" }}>
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#2FAF8F]" />
                                        {t}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* RIGHT — visual card de impacto */}
                        <div className="hidden lg:block" style={{ animation: 'fu 0.8s ease 0.28s both' }}>
                            <div className={`relative rounded-2xl overflow-hidden border blur-reveal-parent ${isDark ? 'border-white/[0.08] bg-[#141210]' : 'border-black/[0.07] bg-white'} shadow-[0_4px_32px_rgba(0,0,0,0.07)] dark:shadow-[0_4px_32px_rgba(0,0,0,0.4)] p-8`}>

                                {/* Orb de fondo */}
                                <div aria-hidden="true" className="absolute -top-10 -right-10 w-48 h-48 rounded-full pointer-events-none"
                                    style={{ background: 'radial-gradient(circle, rgba(47,175,143,0.12) 0%, transparent 70%)', filter: 'blur(24px)' }} />

                                {/* Eyebrow */}
                                <div className="flex items-center gap-2 mb-8">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#2FAF8F] animate-pulse" />
                                    <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#2FAF8F]"
                                        style={{ fontFamily: "'Outfit',sans-serif" }}>
                                        En producción
                                    </span>
                                </div>

                                {/* Cita central */}
                                <blockquote className="blur-reveal mb-8">
                                    <p className="text-[22px] font-bold tracking-[-0.032em] leading-[1.22] text-stone-900 dark:text-stone-50"
                                        style={{ fontFamily: "'Fraunces',Georgia,serif" }}>
                                        "El ganadero que entiende su plataforma{' '}
                                        <em className="font-normal italic text-[#2FAF8F]">no depende de nadie más."</em>
                                    </p>
                                    <footer className="mt-4 text-[12px] text-stone-400 dark:text-stone-500"
                                        style={{ fontFamily: "'Outfit',sans-serif" }}>
                                        — Filosofía GANDIA 7
                                    </footer>
                                </blockquote>

                                {/* Separador */}
                                <div className="h-px bg-black/[0.06] dark:bg-white/[0.06] mb-6" />

                                {/* 3 disciplinas */}
                                <div className="blur-reveal flex flex-col gap-2.5">
                                    {[
                                        { num: '01', label: 'Trazabilidad y operación', color: '#2FAF8F', bg: 'rgba(47,175,143,0.09)', darkBg: 'rgba(47,175,143,0.12)' },
                                        { num: '02', label: 'Ganadería e inteligencia artificial', color: '#3B6FD4', bg: 'rgba(59,111,212,0.09)', darkBg: 'rgba(59,111,212,0.12)' },
                                        { num: '03', label: 'Exportación y normativa', color: '#C4622A', bg: 'rgba(196,98,42,0.09)', darkBg: 'rgba(196,98,42,0.12)' },
                                    ].map(({ num, label, color, bg, darkBg }) => (
                                        <div key={num} className="flex items-center gap-3">
                                            <span className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0"
                                                style={{ color, background: isDark ? darkBg : bg, fontFamily: "'Outfit',sans-serif" }}>
                                                {num}
                                            </span>
                                            <span className="text-[12.5px] text-stone-600 dark:text-stone-400"
                                                style={{ fontFamily: "'Outfit',sans-serif" }}>
                                                {label}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                {/* Bottom — texto plano sin badge */}
                                <div className="blur-reveal mt-6 pt-5 border-t border-black/[0.06] dark:border-white/[0.06] flex items-center gap-2">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#2FAF8F] shrink-0">
                                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                    </svg>
                                    <span className="text-[12px] text-stone-500 dark:text-stone-400"
                                        style={{ fontFamily: "'Outfit',sans-serif" }}>
                                        Acceso gratuito para usuarios GANDIA 7
                                    </span>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            {/* ── CATALOG ───────────────────────────────────────────────────── */}
            <main className="max-w-6xl mx-auto px-6 py-16 lg:py-20">

                {/* Section heading */}
                <div className="flex items-end justify-between mb-10">
                    <div>
                        <div className="flex items-center gap-2.5 mb-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#2FAF8F]" />
                            <span className="w-[18px] h-px bg-[#2FAF8F]/50" />
                            <span className="text-[11px] font-semibold tracking-[0.14em] uppercase text-stone-400 dark:text-stone-500"
                                style={{ fontFamily: "'Outfit',sans-serif" }}>
                                Catálogo
                            </span>
                        </div>
                        <h2 className="text-[26px] font-bold tracking-[-0.03em] text-stone-900 dark:text-stone-100"
                            style={{ fontFamily: "'Fraunces',Georgia,serif" }}>
                            Todos los cursos
                        </h2>
                    </div>

                    <span className="hidden sm:flex items-center gap-2 text-[12px] text-stone-400 dark:text-stone-500"
                        style={{ fontFamily: "'Outfit',sans-serif" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
                        </svg>
                        Abriendo próximamente
                    </span>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {COURSES.map((c, i) => (
                        <CourseCard key={c.id} course={c} delay={i * 80} isDark={isDark} onNotify={scrollToWaitlist} />
                    ))}
                </div>

            </main>

            {/* ── WHAT'S INCLUDED STRIP ─────────────────────────────────────── */}
            <section className="border-t border-b border-black/[0.06] dark:border-white/[0.05] bg-white dark:bg-[#0e0c0b]">
                <div className="max-w-6xl mx-auto px-6 py-8">
                    <div className="flex flex-wrap items-center justify-between gap-y-5 gap-x-4">
                        <p className="text-[10.5px] font-bold uppercase tracking-[0.15em] text-stone-400 shrink-0"
                            style={{ fontFamily: "'Outfit',sans-serif" }}>
                            Todos los cursos incluirán
                        </p>
                        <div className="flex flex-wrap gap-x-7 gap-y-3">
                            {[
                                { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 12c-2-2.5-4-4-6-4a4 4 0 0 0 0 8c2 0 4-1.5 6-4z" /><path d="M12 12c2 2.5 4 4 6 4a4 4 0 0 0 0-8c-2 0-4 1.5-6 4z" /></svg>, label: 'Acceso de por vida' },
                                { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2" /><line x1="12" y1="18" x2="12.01" y2="18" /></svg>, label: 'Todos los dispositivos' },
                                { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="6" /><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" /></svg>, label: 'Certificado oficial' },
                                { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>, label: 'Comunidad activa' },
                            ].map(({ icon, label }) => (
                                <div key={label} className="flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-lg flex items-center justify-center text-[#2FAF8F] shrink-0"
                                        style={{ background: 'rgba(47,175,143,0.10)' }}>
                                        {icon}
                                    </span>
                                    <span className="text-[12.5px] font-medium text-stone-600 dark:text-stone-400"
                                        style={{ fontFamily: "'Outfit',sans-serif" }}>
                                        {label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ── WAITLIST — estilo newsletter blog ─────────────────────────── */}
            <WaitlistSection isDark={isDark} sectionRef={waitlistRef} />

            {/* ── CTA FINAL ─────────────────────────────────────────────────── */}
            <section className="border-t border-black/[0.07] dark:border-white/[0.05] bg-white dark:bg-[#0e0c0b]">
                <div className="max-w-6xl mx-auto px-6 py-14 lg:py-16">
                    <div className={`relative overflow-hidden rounded-2xl px-8 py-10 lg:px-12 lg:py-12 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 ${isDark ? 'bg-[#141210] border border-white/[0.07]' : 'bg-[#F3F2EF] border border-black/[0.06]'}`}>

                        {/* Subtle dot grid inside card */}
                        <div aria-hidden="true" className="absolute inset-0 pointer-events-none rounded-2xl overflow-hidden"
                            style={{
                                backgroundImage: `radial-gradient(circle, ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'} 1px, transparent 1px)`,
                                backgroundSize: '24px 24px',
                                maskImage: 'radial-gradient(ellipse 80% 100% at 100% 50%, black 0%, transparent 65%)',
                                WebkitMaskImage: 'radial-gradient(ellipse 80% 100% at 100% 50%, black 0%, transparent 65%)',
                            }}
                        />

                        {/* Left */}
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#2FAF8F] animate-pulse" />
                                <span className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[#2FAF8F]"
                                    style={{ fontFamily: "'Outfit',sans-serif" }}>
                                    Disponible hoy
                                </span>
                            </div>
                            <h2 className="text-[24px] lg:text-[30px] font-bold tracking-[-0.038em] leading-[1.15] text-stone-900 dark:text-stone-100 mb-2"
                                style={{ fontFamily: "'Fraunces',Georgia,serif" }}>
                                La plataforma ya está activa.<br />
                                <em className="font-normal italic text-stone-400 dark:text-stone-500">Los cursos llegan pronto.</em>
                            </h2>
                            <p className="text-[13.5px] text-stone-500 dark:text-stone-400 max-w-[400px]"
                                style={{ fontFamily: "'Outfit',sans-serif" }}>
                                Mientras los cursos se producen, empieza a operar GANDIA 7 hoy — sin currículo, con acceso completo.
                            </p>
                        </div>

                        {/* Right — inline buttons */}
                        <div className="relative z-10 flex flex-col sm:flex-row gap-3 shrink-0">
                            <a
                                href="/home"
                                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-[13.5px] font-semibold bg-stone-900 dark:bg-stone-50 text-white dark:text-stone-900 hover:bg-stone-700 dark:hover:bg-white shadow-[0_2px_10px_rgba(0,0,0,0.15)] hover:shadow-[0_6px_22px_rgba(0,0,0,0.22)] active:scale-[0.98] transition-all"
                                style={{ fontFamily: "'Outfit',sans-serif" }}
                            >
                                Conocer GANDIA 7
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path d="M5 12h14M12 5l7 7-7 7" />
                                </svg>
                            </a>
                            <a
                                href="/signup"
                                className={`inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-[13.5px] font-semibold border active:scale-[0.98] transition-all
                  ${isDark
                                        ? 'border-white/[0.12] text-stone-300 hover:bg-white/[0.05] hover:border-white/[0.22]'
                                        : 'border-black/[0.12] text-stone-700 hover:bg-black/[0.04] hover:border-black/[0.2]'
                                    }`}
                                style={{ fontFamily: "'Outfit',sans-serif" }}
                            >
                                Solicitar acceso
                            </a>
                        </div>

                    </div>
                </div>
            </section>

            <Footer />

            {/* Global keyframes */}
            <style>{`
        @keyframes fu {
          from { opacity:0; transform:translateY(16px); }
          to   { opacity:1; transform:translateY(0); }
        }
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
        @media (prefers-reduced-motion:reduce) {
          * { animation-duration:.01ms!important; transition-duration:.01ms!important; }
        }
      `}</style>
        </div>
    )
}