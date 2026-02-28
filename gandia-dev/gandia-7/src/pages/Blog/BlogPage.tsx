import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchPosts, type BlogPost } from '../../services/payloadApi'
import Header from '../../components/ui/Header'
import Footer from '../../components/ui/Footer'

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────
const FUNCTIONS_URL = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL as string
const CAT: Record<string, { label: string; color: string; bg: string; darkBg: string }> = {
  trazabilidad: { label: 'Trazabilidad',   color: '#1A9E7A', bg: '#E8F8F3', darkBg: 'rgba(26,158,122,0.15)' },
  normativa:    { label: 'Normativa',      color: '#3B6FD4', bg: '#EBF1FB', darkBg: 'rgba(59,111,212,0.15)' },
  tecnologia:   { label: 'Tecnología',     color: '#C4622A', bg: '#FBEEE6', darkBg: 'rgba(196,98,42,0.15)'  },
  'casos-exito':{ label: 'Casos de Éxito', color: '#7B42B8', bg: '#F3EAFB', darkBg: 'rgba(123,66,184,0.15)' },
  guias:        { label: 'Guías',          color: '#9A6C1A', bg: '#F9F1E1', darkBg: 'rgba(154,108,26,0.15)' },
}
const CATS = [{ id: 'all', label: 'Todo' }, ...Object.entries(CAT).map(([id, { label }]) => ({ id, label }))]
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })

// ─────────────────────────────────────────────────────────────────────────────
// GHOST LOADER — preservado, mismo estilo que los demás archivos del proyecto
// ─────────────────────────────────────────────────────────────────────────────
function GhostLoader() {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#FAFAF8] dark:bg-[#0c0a09] overflow-hidden">
      {/* Centro */}
      <div className="flex flex-col items-center gap-0">
        {/* Logo animado */}
        <div className="relative w-14 h-14 mb-7" aria-hidden="true" style={{ animation: 'gl-in 0.6s ease 0.05s both' }}>
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#2FAF8F" strokeWidth="1.75"
            style={{ filter: 'drop-shadow(0 0 18px rgba(47,175,143,0.22))' }}>
            <path style={{ animation: 'gl-layer 2.4s ease-in-out infinite' }}          d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path style={{ animation: 'gl-layer 2.4s ease-in-out 0.3s infinite' }}     d="M2 12l10 5 10-5"/>
            <path style={{ animation: 'gl-layer 2.4s ease-in-out 0.6s infinite' }}     d="M2 17l10 5 10-5"/>
          </svg>
          <div className="absolute top-1/2 left-1/2 w-24 h-24 rounded-full pointer-events-none"
            style={{
              background: 'radial-gradient(circle, rgba(47,175,143,0.18) 0%, transparent 70%)',
              filter: 'blur(16px)',
              transform: 'translate(-50%,-50%)',
              animation: 'gl-glow-pulse 2.4s ease-in-out infinite'
            }}
          />
        </div>

        {/* Wordmark */}
        <div className="flex items-baseline gap-1.5 mb-5" aria-hidden="true"
          style={{ animation: 'gl-in 0.6s ease 0.12s both' }}>
          <span className="text-[22px] font-bold tracking-[0.06em] text-stone-900 dark:text-stone-100"
            style={{ fontFamily: "'Fraunces', Georgia, serif" }}>GANDIA</span>
          <span className="text-[22px] font-normal italic text-[#2FAF8F]"
            style={{ fontFamily: "'Fraunces', Georgia, serif" }}>7</span>
        </div>

        {/* Separador */}
        <div className="w-8 h-px mb-4 bg-gradient-to-r from-transparent via-stone-300 dark:via-stone-700 to-transparent"
          style={{ animation: 'gl-in 0.6s ease 0.18s both' }} aria-hidden="true" />

        {/* Status */}
        <p className="text-[12px] font-medium tracking-[0.06em] uppercase text-stone-400 mb-4"
          style={{ fontFamily: "'Outfit', sans-serif", animation: 'gl-in 0.6s ease 0.24s both' }}>
          Cargando contenido
        </p>

        {/* Barra de progreso */}
        <div className="w-32 h-0.5 rounded-full overflow-hidden bg-stone-200 dark:bg-stone-800"
          style={{ animation: 'gl-in 0.6s ease 0.28s both' }} aria-hidden="true">
          <div className="h-full w-full rounded-full bg-[#2FAF8F]"
            style={{ animation: 'gl-bar-slide 1.8s cubic-bezier(0.4,0,0.2,1) infinite' }} />
        </div>
      </div>

      {/* Esquinas decorativas */}
      {[
        { pos: 'top-5 left-5',     borderStyle: { borderTop: '2px solid rgba(47,175,143,0.55)', borderLeft: '2px solid rgba(47,175,143,0.55)' } },
        { pos: 'top-5 right-5',    borderStyle: { borderTop: '2px solid rgba(47,175,143,0.55)', borderRight: '2px solid rgba(47,175,143,0.55)' } },
        { pos: 'bottom-5 left-5',  borderStyle: { borderBottom: '2px solid rgba(47,175,143,0.55)', borderLeft: '2px solid rgba(47,175,143,0.55)' } },
        { pos: 'bottom-5 right-5', borderStyle: { borderBottom: '2px solid rgba(47,175,143,0.55)', borderRight: '2px solid rgba(47,175,143,0.55)' } },
      ].map((corner, i) => (
        <div key={i} className={`absolute ${corner.pos} w-8 h-8`}
          style={{
            ...corner.borderStyle,
            animation: `gl-corner-in 0.5s ease ${0.5 + i * 0.06}s both`
          }}
        />
      ))}

      <style>{`
        @keyframes gl-layer { 0%,100%{opacity:1;transform:translateY(0) scale(1)} 50%{opacity:.45;transform:translateY(-5px) scale(.97)} }
        @keyframes gl-glow-pulse { 0%,100%{opacity:.5;transform:translate(-50%,-50%) scale(1)} 50%{opacity:1;transform:translate(-50%,-50%) scale(1.15)} }
        @keyframes gl-bar-slide { 0%{transform:translateX(-100%)} 60%{transform:translateX(0%)} 100%{transform:translateX(100%)} }
        @keyframes gl-in { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes gl-corner-in { from{opacity:0;transform:scale(.7)} to{opacity:1;transform:scale(1)} }
        @media(prefers-reduced-motion:reduce){ *{animation-duration:.01ms!important;transition-duration:.01ms!important} }
      `}</style>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ERROR VIEW
// ─────────────────────────────────────────────────────────────────────────────
function ErrorView({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#FAFAF8] dark:bg-[#0c0a09]">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#C4622A" strokeWidth="2" opacity="0.4" aria-hidden="true">
        <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
      </svg>
      <p className="text-[15px] text-stone-500 dark:text-stone-400 max-w-xs text-center">{message}</p>
      <button
        onClick={onRetry}
        className="text-[13px] font-semibold text-[#2FAF8F] bg-transparent border border-[rgba(47,175,143,0.24)] rounded-full px-5 py-2 cursor-pointer hover:bg-[rgba(47,175,143,0.11)] hover:border-[#2FAF8F] transition-all"
      >
        Reintentar
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// AVATAR
// ─────────────────────────────────────────────────────────────────────────────
function Av({ name, size }: { name: string; size: number }) {
  const initials = name.trim().split(/\s+/).slice(0, 2).map(n => n[0].toUpperCase()).join('')
  return (
    <div
      aria-hidden="true"
      className="rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 select-none"
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.37),
        background: 'linear-gradient(135deg, #2FAF8F, #1A7A62)',
        fontFamily: "'Outfit', sans-serif"
      }}
    >
      {initials}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// FEATURED CARD
// ─────────────────────────────────────────────────────────────────────────────
function FeaturedCard({ post, onNav }: { post: BlogPost; onNav: () => void }) {
  const c = CAT[post.category]
  return (
    <article
      onClick={onNav}
      onKeyDown={e => e.key === 'Enter' && onNav()}
      tabIndex={0}
      role="article"
      aria-label={`Artículo destacado: ${post.title}`}
      className="group relative grid grid-cols-1 lg:grid-cols-2 rounded-2xl overflow-hidden border border-black/[0.07] dark:border-white/[0.07] bg-white dark:bg-[#141210] cursor-pointer mb-14 shadow-[0_4px_18px_rgba(0,0,0,0.07)] hover:shadow-[0_16px_48px_rgba(0,0,0,0.12)] dark:shadow-[0_4px_18px_rgba(0,0,0,0.4)] dark:hover:shadow-[0_16px_48px_rgba(0,0,0,0.55)] transition-all duration-300 focus-visible:outline-2 focus-visible:outline-[#2FAF8F] focus-visible:outline-offset-2"
    >
      {/* Visual */}
      <div className="relative min-h-[260px] lg:min-h-[400px] overflow-hidden">
        {post.coverImage
          ? <img src={post.coverImage} alt={post.title} loading="eager"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
          : <div className="absolute inset-0 bg-gradient-to-br from-stone-200 to-stone-300 dark:from-stone-800 dark:to-stone-900" />
        }
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-black/20" aria-hidden="true" />
        {/* Badge */}
        <div className="absolute top-4 left-4 flex items-center gap-2" aria-hidden="true">
          <span className="text-white/70 text-[11px] font-bold tracking-[0.08em] font-[Outfit,sans-serif]">01</span>
          <span className="text-white/50 text-[10px] uppercase tracking-[0.12em] font-[Outfit,sans-serif]">Destacado</span>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col justify-between p-8 lg:p-10">
        <div>
          <div className="flex items-center gap-3 mb-5 flex-wrap">
            {c && (
              <span className="text-[11px] font-semibold px-3 py-1 rounded-full tracking-[0.03em]"
                style={{ color: c.color, background: c.bg }}>
                {c.label}
              </span>
            )}
            <time className="text-[12px] text-stone-400 dark:text-stone-500" dateTime={post.publishedAt}>
              {fmtDate(post.publishedAt)}
            </time>
            <span className="text-[12px] text-stone-400 dark:text-stone-500">{post.readTime}</span>
          </div>

          <h2 className="text-[28px] lg:text-[34px] font-bold tracking-[-0.03em] leading-[1.18] text-stone-900 dark:text-stone-50 mb-4 group-hover:text-[#2FAF8F] transition-colors duration-200"
            style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
            {post.title}
          </h2>
          <p className="text-[15px] text-stone-500 dark:text-stone-400 leading-[1.72] mb-6 line-clamp-3">
            {post.excerpt}
          </p>

          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {post.tags.map(t => (
                <span key={t} className="text-[11px] px-2.5 py-1 rounded-md bg-stone-100 dark:bg-stone-800/60 text-stone-500 dark:text-stone-400 tracking-[0.02em]">
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-5 border-t border-black/[0.06] dark:border-white/[0.06]">
          <div className="flex items-center gap-3 min-w-0">
            <Av name={post.author.name} size={36} />
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-stone-800 dark:text-stone-200 truncate">{post.author.name}</p>
              <p className="text-[11px] text-stone-400 dark:text-stone-500 truncate">{post.author.role}</p>
            </div>
          </div>
          <span className="flex items-center gap-1.5 text-[13px] font-semibold text-[#2FAF8F] flex-shrink-0 group-hover:gap-2.5 transition-all duration-200" aria-hidden="true">
            Leer artículo
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </span>
        </div>
      </div>
    </article>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// POST CARD
// ─────────────────────────────────────────────────────────────────────────────
function PostCard({ post, index, onNav }: { post: BlogPost; index: number; onNav: () => void }) {
  const ref = useRef<HTMLElement>(null)
  const [vis, setVis] = useState(false)
  const c = CAT[post.category]

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVis(true); obs.disconnect() } }, { threshold: 0.05 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <article
      ref={ref}
      onClick={onNav}
      onKeyDown={e => e.key === 'Enter' && onNav()}
      tabIndex={0}
      role="listitem"
      aria-label={post.title}
      className="group relative flex flex-col rounded-xl overflow-hidden border border-black/[0.07] dark:border-white/[0.07] bg-white dark:bg-[#141210] cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.04),0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_44px_rgba(0,0,0,0.11),0_3px_8px_rgba(0,0,0,0.06)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),0_2px_8px_rgba(0,0,0,0.2)] dark:hover:shadow-[0_12px_44px_rgba(0,0,0,0.5)] hover:-translate-y-1 hover:border-[rgba(47,175,143,0.25)] transition-all duration-300 focus-visible:outline-2 focus-visible:outline-[#2FAF8F] focus-visible:outline-offset-2"
      style={{
        opacity: vis ? 1 : 0,
        transform: vis ? 'none' : 'translateY(20px)',
        transition: `opacity .48s ease ${(index % 3) * 75}ms, transform .48s ease ${(index % 3) * 75}ms, box-shadow .28s ease, border-color .28s ease`
      }}
    >
      {/* Top accent line */}
      <div className="absolute top-0 inset-x-0 h-px z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(47,175,143,0.6), transparent)' }}
        aria-hidden="true"
      />

      {/* Image */}
      <div className="relative aspect-[16/10] overflow-hidden flex-shrink-0">
        {post.coverImage
          ? <img src={post.coverImage} alt={post.title} loading="lazy"
              className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06]" />
          : <div className="w-full h-full bg-gradient-to-br from-stone-100 to-stone-200 dark:from-stone-800 dark:to-stone-900" />
        }
        {c && (
          <span className="absolute top-2.5 left-2.5 text-[10px] font-semibold px-2.5 py-1 rounded-full tracking-[0.03em] backdrop-blur-xl"
            style={{ color: c.color, background: c.bg }}>
            {c.label}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-col gap-2 p-5 flex-1">
        <div className="flex items-center gap-1.5">
          <time className="text-[11px] text-stone-400 dark:text-stone-500" dateTime={post.publishedAt}>
            {fmtDate(post.publishedAt)}
          </time>
          <span className="text-stone-300 dark:text-stone-600 text-[10px]">·</span>
          <span className="text-[11px] text-stone-400 dark:text-stone-500">{post.readTime}</span>
        </div>

        <h3 className="text-[16.5px] font-semibold tracking-[-0.028em] leading-[1.28] text-stone-900 dark:text-stone-50 line-clamp-2 group-hover:text-[#2FAF8F] transition-colors duration-200"
          style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
          {post.title}
        </h3>
        <p className="text-[13px] text-stone-500 dark:text-stone-400 leading-[1.66] line-clamp-3 flex-1">
          {post.excerpt}
        </p>

        <div className="flex items-center justify-between pt-3 border-t border-black/[0.05] dark:border-white/[0.05] mt-auto">
          <div className="flex items-center gap-1.5 min-w-0">
            <Av name={post.author.name} size={22} />
            <span className="text-[11.5px] text-stone-500 dark:text-stone-400 truncate">{post.author.name}</span>
          </div>
          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-400 flex-shrink-0 group-hover:bg-[#2FAF8F] group-hover:text-white transition-all duration-200 group-hover:translate-x-0.5"
            aria-hidden="true">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </div>
        </div>
      </div>
    </article>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// EMPTY STATE
// ─────────────────────────────────────────────────────────────────────────────
function Empty({ msg, onReset }: { msg: string; onReset: () => void }) {
  return (
    <div className="flex flex-col items-center py-24 gap-3 text-center" role="status" aria-live="polite">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.28" aria-hidden="true">
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
      </svg>
      <p className="text-[15px] text-stone-500 dark:text-stone-400">{msg}</p>
      <button
        onClick={onReset}
        className="text-[13px] font-semibold text-[#2FAF8F] bg-transparent border border-[rgba(47,175,143,0.24)] rounded-full px-5 py-2 cursor-pointer mt-1 hover:bg-[rgba(47,175,143,0.11)] hover:border-[#2FAF8F] transition-all"
      >
        Ver todos los artículos
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// NEWSLETTER SECTION — lógica idéntica, diseño rediseñado
// ─────────────────────────────────────────────────────────────────────────────
function NewsletterSection() {
  const navigate = useNavigate()
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
      const res = await fetch(`${FUNCTIONS_URL}/newsletter-subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error ?? 'Error desconocido')
      setStatus('success')
      setMessage('¡Suscripción exitosa! Revisa tu email.')
      setEmail('')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error interno. Intenta de nuevo.'
      setStatus('error')
      setMessage(msg)
      setTimeout(() => setStatus('idle'), 4000)
    }
  }

  return (
    <section aria-label="Suscríbete al newsletter"
      className="relative overflow-hidden border-t border-black/[0.07] dark:border-white/[0.05] bg-[#F3F2EF] dark:bg-[#0f0d0b]">
      {/* Ambient orbs */}
      <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-[#2FAF8F] opacity-[0.06] blur-[80px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-56 h-56 rounded-full bg-[#2FAF8F] opacity-[0.04] blur-[60px] pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-20 lg:py-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

          {/* Left: copy */}
          <div>
            <div className="inline-flex items-center gap-2 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2FAF8F]" />
              <span className="text-[11px] font-bold uppercase tracking-[0.13em] text-[#2FAF8F]"
                style={{ fontFamily: "'Outfit', sans-serif" }}>
                Newsletter Mensual
              </span>
            </div>
            <h2 className="text-[32px] lg:text-[40px] font-bold tracking-[-0.04em] leading-[1.08] text-stone-900 dark:text-stone-50 mb-4"
              style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
              Mantente al día con<br />
              <em className="font-normal italic text-stone-400 dark:text-stone-500">innovación agropecuaria</em>
            </h2>
            <p className="text-[15px] text-stone-500 dark:text-stone-400 leading-[1.72] mb-8">
              Análisis exclusivos, guías técnicas y casos de éxito sobre trazabilidad, normativas y tecnología directamente en tu bandeja cada mes.
            </p>
            <div className="flex flex-col gap-3">
              {[
                'Artículos exclusivos antes de publicación',
                'Alertas de cambios normativos',
                'Invitaciones a webinars y eventos'
              ].map(item => (
                <div key={item} className="flex items-center gap-2.5">
                  <div className="w-4 h-4 rounded-full flex items-center justify-center bg-[rgba(47,175,143,0.12)] flex-shrink-0">
                    <svg className="w-2.5 h-2.5 text-[#2FAF8F]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M20 6L9 17l-5-5"/>
                    </svg>
                  </div>
                  <span className="text-[13.5px] text-stone-600 dark:text-stone-400">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: form */}
          <div className="bg-white dark:bg-[#141210] rounded-2xl p-8 border border-black/[0.07] dark:border-white/[0.07] shadow-[0_4px_18px_rgba(0,0,0,0.07)] dark:shadow-[0_4px_18px_rgba(0,0,0,0.4)]">
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div className="relative">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <path d="M22 6l-10 7L2 6"/>
                </svg>
                <input
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  disabled={status === 'loading' || status === 'success'}
                  aria-label="Tu correo electrónico"
                  autoComplete="email"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-[14px] bg-stone-50 dark:bg-stone-900/60 border border-black/[0.08] dark:border-white/[0.08] text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:border-[#2FAF8F] focus:ring-2 focus:ring-[rgba(47,175,143,0.2)] transition-all disabled:opacity-50"
                  style={{ fontFamily: "'Outfit', sans-serif" }}
                />
              </div>

              <button
                type="submit"
                disabled={status === 'loading' || status === 'success'}
                aria-label="Suscribirse al newsletter"
                className={`w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl text-[14px] font-semibold transition-all duration-200 active:scale-[0.98] disabled:opacity-70
                  ${status === 'success'
                    ? 'bg-emerald-500 text-white'
                    : status === 'error'
                    ? 'bg-rose-500 text-white'
                    : 'bg-stone-900 dark:bg-stone-50 text-white dark:text-stone-900 hover:bg-stone-800 dark:hover:bg-stone-200 shadow-sm hover:shadow-md'
                  }`}
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                {status === 'idle' && (
                  <>Suscribirme <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg></>
                )}
                {status === 'loading' && (
                  <><span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Procesando...</>
                )}
                {status === 'success' && (
                  <><svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>¡Listo!</>
                )}
                {status === 'error' && 'Intentar de nuevo'}
              </button>

              {message && (
                <p role="alert" aria-live="polite"
                  className={`text-[12px] text-center ${status === 'success' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                  {message}
                </p>
              )}
            </form>

            <p className="text-[11px] text-stone-400 dark:text-stone-500 text-center mt-4">
              Sin spam. Cancela cuando quieras.{' '}
              <button
                onClick={() => navigate('/legal?section=privacy')}
                className="underline hover:text-[#2FAF8F] transition-colors bg-transparent border-none cursor-pointer text-[11px] text-stone-400 dark:text-stone-500"
              >
                Política de privacidad
              </button>
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SEARCH MODAL
// ─────────────────────────────────────────────────────────────────────────────
function SearchModal({
  posts, q, onClose, onChange, onNavigate
}: {
  posts: BlogPost[]
  q: string
  onClose: () => void
  onChange: (v: string) => void
  onNavigate: (slug: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 80)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const results = q.trim()
    ? posts.filter(p =>
        p.title.toLowerCase().includes(q.toLowerCase()) ||
        p.excerpt.toLowerCase().includes(q.toLowerCase())
      )
    : []

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center pt-16 px-4"
      style={{ backdropFilter: 'blur(8px)', background: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Buscar artículos"
    >
      <div
        className="w-full max-w-lg rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.3)] bg-white dark:bg-[#141210] border border-black/[0.07] dark:border-white/[0.07]"
        onClick={e => e.stopPropagation()}
      >
        {/* Input bar */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-black/[0.06] dark:border-white/[0.06]">
          <svg className="w-4.5 h-4.5 text-stone-400 flex-shrink-0" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            ref={inputRef}
            type="text"
            placeholder="Buscar en artículos..."
            value={q}
            onChange={e => onChange(e.target.value)}
            className="flex-1 text-[16px] bg-transparent border-none outline-none text-stone-900 dark:text-stone-100 placeholder-stone-400"
            style={{ fontFamily: "'Outfit', sans-serif" }}
            aria-label="Buscar artículos"
          />
          <button
            onClick={onClose}
            className="bg-transparent border-none cursor-pointer p-2 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 text-xl leading-none transition-colors"
            aria-label="Cerrar búsqueda"
          >
            ×
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {q.trim() ? (
            <div className="p-2">
              {results.map(p => (
                <button
                  key={p.id}
                  onClick={() => onNavigate(p.slug)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl text-left border-none bg-transparent cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-900/60 transition-colors"
                >
                  <div className="w-14 h-10 rounded-lg flex-shrink-0 overflow-hidden bg-stone-100 dark:bg-stone-800">
                    {p.coverImage && <img src={p.coverImage} alt="" className="w-full h-full object-cover" loading="lazy" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-semibold text-stone-900 dark:text-stone-100 truncate"
                      style={{ fontFamily: "'Fraunces', Georgia, serif" }}>{p.title}</div>
                    <div className="text-[12px] text-stone-400 truncate">{p.excerpt}</div>
                  </div>
                </button>
              ))}
              {results.length === 0 && (
                <div className="py-8 text-center text-[14px] text-stone-400">
                  Sin resultados para "<span className="text-stone-600 dark:text-stone-300">{q}</span>"
                </div>
              )}
            </div>
          ) : (
            <div className="p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-stone-400 mb-3"
                style={{ fontFamily: "'Outfit', sans-serif" }}>
                Sugerencias
              </p>
              {['trazabilidad', 'tecnología', 'normativa'].map(term => (
                <button
                  key={term}
                  onClick={() => onChange(term)}
                  className="flex w-full items-center gap-2.5 px-3 py-2.5 rounded-lg border-none bg-transparent cursor-pointer text-[14px] text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-900/60 transition-colors text-left"
                  style={{ fontFamily: "'Outfit', sans-serif" }}
                >
                  <svg className="w-3.5 h-3.5 text-stone-300 dark:text-stone-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                  </svg>
                  {term}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// TICKER BAR — franja exclusiva del blog, va entre Header y Hero
// ─────────────────────────────────────────────────────────────────────────────
const TICKER_ITEMS = [
  'Lanzamiento plataforma 2026',
  'Nueva guía de trazabilidad SENASICA publicada',
  'Webinar · Exportación a EE.UU. — 12 Feb',
  'Actualización normativa SINIIGA en vigor',
  'Nuevas integraciones RFID disponibles',
  'Casos de éxito · Rancho La Esperanza, Durango',
  'Certificación internacional en menos de 48h',
]

function TickerBar({ isDark }: { isDark: boolean }) {
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS] // duplicar para loop continuo
  return (
    <div
      className={`relative overflow-hidden border-b ${
        isDark
          ? 'bg-[#0f0d0b] border-white/[0.06]'
          : 'bg-[#F0F9F6] border-black/[0.06]'
      }`}
      style={{ height: 34 }}
      aria-label="Últimas noticias del blog"
      role="marquee"
    >
      {/* Fade edges */}
      <div className={`absolute left-0 top-0 h-full w-16 z-10 pointer-events-none ${
        isDark
          ? 'bg-gradient-to-r from-[#0f0d0b] to-transparent'
          : 'bg-gradient-to-r from-[#F0F9F6] to-transparent'
      }`} aria-hidden="true" />
      <div className={`absolute right-0 top-0 h-full w-16 z-10 pointer-events-none ${
        isDark
          ? 'bg-gradient-to-l from-[#0f0d0b] to-transparent'
          : 'bg-gradient-to-l from-[#F0F9F6] to-transparent'
      }`} aria-hidden="true" />

      {/* Scrolling track */}
      <div className="flex items-center h-full pl-4" aria-hidden="true">
        <div
          className="flex items-center gap-0 whitespace-nowrap"
          style={{ animation: 'ticker-scroll 38s linear infinite' }}
        >
          {items.map((item, i) => (
            <span key={i} className="flex items-center gap-4">
              <span className={`text-[11.5px] font-medium tracking-[-0.005em] ${
                isDark ? 'text-stone-400' : 'text-stone-500'
              }`} style={{ fontFamily: "'Outfit', sans-serif" }}>
                {item}
              </span>
              <span className={`text-[10px] ${isDark ? 'text-stone-700' : 'text-stone-300'} mx-2`}>·</span>
            </span>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes ticker-scroll {
          0%   { transform: translateX(0) }
          100% { transform: translateX(-50%) }
        }
        @media(prefers-reduced-motion:reduce){
          .ticker-track { animation: none !important }
        }
      `}</style>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// BACK TO TOP BUTTON
// ─────────────────────────────────────────────────────────────────────────────
function BackToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollUp = () => window.scrollTo({ top: 0, behavior: 'smooth' })

  return (
    <button
      onClick={scrollUp}
      aria-label="Volver arriba"
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-11 h-11 rounded-full bg-stone-900 dark:bg-stone-50 text-white dark:text-stone-900 shadow-[0_4px_20px_rgba(0,0,0,0.25)] hover:scale-110 hover:shadow-[0_8px_28px_rgba(0,0,0,0.3)] active:scale-95 transition-all duration-200 border border-white/10 dark:border-black/10"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.85)',
        pointerEvents: visible ? 'auto' : 'none',
        transition: 'opacity 0.25s ease, transform 0.25s ease, box-shadow 0.2s ease'
      }}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M18 15l-6-6-6 6"/>
      </svg>
    </button>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// STATS BAR
// ─────────────────────────────────────────────────────────────────────────────
function StatBar({ posts }: { posts: BlogPost[] }) {
  return (
    <div className="flex items-center gap-6 flex-wrap">
      {[
        { n: posts.length,           l: 'Artículos' },
        { n: Object.keys(CAT).length, l: 'Categorías' },
        { n: '2026',                  l: 'Edición' },
      ].map((s, i) => (
        <div key={i} className="flex items-center gap-3">
          {i > 0 && <div className="w-px h-5 bg-stone-200 dark:bg-stone-700" />}
          <div className="flex flex-col">
            <span className="text-[22px] font-bold tracking-[-0.03em] text-stone-900 dark:text-stone-50 leading-none"
              style={{ fontFamily: "'Fraunces', Georgia, serif" }}>{s.n}</span>
            <span className="text-[11px] text-stone-400 dark:text-stone-500 uppercase tracking-[0.06em] mt-0.5"
              style={{ fontFamily: "'Outfit', sans-serif" }}>{s.l}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function BlogPage() {
  const navigate = useNavigate()
  const [cat, setCat]       = useState('all')
  const [q, setQ]           = useState('')
  const [page, setPage]     = useState(1)
  const POSTS_PER_PAGE      = 9
  const [searchOpen, setSearchOpen] = useState(false)
  const [posts, setPosts]   = useState<BlogPost[]>([])
  const [loading, setLoad]  = useState(true)
  const [ready, setReady]   = useState(false)
  const [error, setError]   = useState<string | null>(null)
  const [isDark, setIsDark] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)').matches : false
  )

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const fn = (e: MediaQueryListEvent) => setIsDark(e.matches)
    mq.addEventListener('change', fn)
    return () => mq.removeEventListener('change', fn)
  }, [])

  useEffect(() => {
    let cancelled = false
    async function loadPosts() {
      setLoad(true)
      setError(null)
      try {
        const data = await fetchPosts()
        if (!cancelled) setPosts(data)
      } catch (err) {
        console.error('Error loading posts:', err)
        if (!cancelled) setError('Error al cargar artículos. Intenta de nuevo más tarde.')
      } finally {
        if (!cancelled) {
          setLoad(false)
          requestAnimationFrame(() => setTimeout(() => setReady(true), 32))
        }
      }
    }
    loadPosts()
    return () => { cancelled = true }
  }, [])

  const handleCatChange   = useCallback((id: string) => { setCat(id); setPage(1) }, [])
  const handleSearchChange = useCallback((v: string) => { setQ(v); setPage(1) }, [])
  const handleClearSearch = useCallback(() => { setQ(''); setPage(1) }, [])

  const featured = posts.find(p => p.featured)
  const rest = posts.filter(p => {
    if (p.id === featured?.id) return false
    const catOk = cat === 'all' || p.category === cat
    const sq = q.trim().toLowerCase()
    return catOk && (!sq || p.title.toLowerCase().includes(sq) || p.excerpt.toLowerCase().includes(sq))
  })
  const totalPages  = Math.ceil(rest.length / POSTS_PER_PAGE)
  const pagedRest   = rest.slice((page - 1) * POSTS_PER_PAGE, page * POSTS_PER_PAGE)

  if (loading) return <GhostLoader />
  if (error)   return <ErrorView message={error} onRetry={() => window.location.reload()} />

  return (
    <div className="min-h-screen bg-[#FAFAF8] dark:bg-[#0c0a09]"
      style={{ fontFamily: "'Outfit', -apple-system, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;0,9..144,700;0,9..144,800;1,9..144,400;1,9..144,600;1,9..144,700&family=Outfit:wght@300;400;500;600;700&display=swap');
        @media(prefers-reduced-motion:reduce){ *{animation-duration:.01ms!important;transition-duration:.01ms!important} }
      `}</style>

      {/* ── HEADER (componente existente) ─────────────────────────── */}
      <Header currentSection="blog" isDark={isDark} />

      {/* ── TICKER BAR — exclusivo del blog ───────────────────────── */}
      <TickerBar isDark={isDark} />

      {/* ── HERO ──────────────────────────────────────────────────── */}
      <section
        className={`relative overflow-hidden bg-[#FAFAF8] dark:bg-[#0c0a09] border-b border-black/[0.07] dark:border-white/[0.05] transition-all duration-700 ${ready ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}
      >
        {/* Subtle gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#FAFAF8] via-[#F3F2EF] to-[#FAFAF8] dark:from-[#0c0a09] dark:via-[#0f0d0b] dark:to-[#0c0a09]" aria-hidden="true" />
        {/* Ambient green glow */}
        <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full bg-[#2FAF8F] opacity-[0.04] blur-[100px] pointer-events-none" aria-hidden="true" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 pt-14 pb-14">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">

            {/* Left: headline */}
            <div>
              {/* Kicker */}
              <div className="flex items-center gap-2.5 mb-7">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2FAF8F]" aria-hidden="true" />
                <div className="h-px w-8 bg-[rgba(47,175,143,0.4)]" aria-hidden="true" />
                <span className="text-[11px] font-bold uppercase tracking-[0.13em] text-[#2FAF8F]">
                  Innovación Agropecuaria · México
                </span>
              </div>

              <h1 className="text-[clamp(48px,7vw,88px)] font-bold tracking-[-0.044em] leading-[0.98] text-stone-900 dark:text-stone-50 mb-6"
                style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
                Ideas que<br />
                <em className="font-normal italic text-stone-400 dark:text-stone-500">transforman</em><br />
                el campo
              </h1>

              <p className="text-[16px] text-stone-500 dark:text-stone-400 leading-[1.72] max-w-md mb-8">
                Análisis, guías y casos de éxito sobre inteligencia artificial, trazabilidad y tecnología para el ecosistema agropecuario mexicano.
              </p>

              <StatBar posts={posts} />
            </div>

            {/* Right: search + filter */}
            <div className="pb-10 lg:pb-0 lg:pt-6">
              {/* Search trigger */}
              <button
                onClick={() => setSearchOpen(true)}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-[#141210] text-stone-400 text-[14px] mb-4 hover:border-[#2FAF8F] hover:shadow-[0_0_0_3px_rgba(47,175,143,0.1)] transition-all cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
                role="search"
                aria-label="Abrir búsqueda de artículos"
              >
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
                <span className="flex-1 text-left">
                  {q ? <span className="text-stone-700 dark:text-stone-300">{q}</span> : 'Buscar artículos…'}
                </span>
                {q && (
                  <span
                    onClick={e => { e.stopPropagation(); handleClearSearch() }}
                    className="flex items-center justify-center w-5 h-5 rounded-full bg-stone-200 dark:bg-stone-700 text-stone-500 hover:bg-stone-300 dark:hover:bg-stone-600 transition-colors cursor-pointer"
                    role="button"
                    aria-label="Limpiar búsqueda"
                  >
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
                  </span>
                )}
                <kbd className="hidden sm:inline-flex items-center gap-1 ml-3 px-2 py-0.5 rounded-md border border-black/[0.08] dark:border-white/[0.08] bg-stone-100 dark:bg-stone-800 text-[11px] text-stone-400 font-mono">
                  ⌘K
                </kbd>
              </button>

              {/* Category filter */}
              <nav className="flex flex-wrap gap-2" aria-label="Filtrar por categoría">
                {CATS.map(c => (
                  <button
                    key={c.id}
                    onClick={() => handleCatChange(c.id)}
                    aria-pressed={cat === c.id}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12.5px] font-medium border transition-all duration-200 cursor-pointer
                      ${cat === c.id
                        ? 'bg-stone-900 dark:bg-stone-50 text-white dark:text-stone-900 border-stone-900 dark:border-stone-50 shadow-sm'
                        : 'bg-white dark:bg-[#141210] text-stone-500 dark:text-stone-400 border-black/[0.08] dark:border-white/[0.08] hover:border-stone-400 dark:hover:border-stone-500 hover:text-stone-700 dark:hover:text-stone-200'
                      }`}
                    style={{ fontFamily: "'Outfit', sans-serif" }}
                  >
                    {c.id !== 'all' && (
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ background: CAT[c.id]?.color }} aria-hidden="true" />
                    )}
                    {c.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 mt-10 pt-10 border-t border-black/[0.05] dark:border-white/[0.04]" aria-hidden="true">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-stone-200 dark:via-stone-800 to-transparent" />
            <span className="text-[11px] font-medium tracking-[0.08em] uppercase text-stone-300 dark:text-stone-600"
              style={{ fontFamily: "'Outfit', sans-serif" }}>Vol. I · 2026</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-stone-200 dark:via-stone-800 to-transparent" />
          </div>
        </div>
      </section>

      {/* ── SEARCH MODAL ──────────────────────────────────────────── */}
      {searchOpen && (
        <SearchModal
          posts={posts}
          q={q}
          onClose={() => setSearchOpen(false)}
          onChange={handleSearchChange}
          onNavigate={slug => { setSearchOpen(false); navigate(`/blog/${slug}`) }}
        />
      )}

      {/* ── MAIN CONTENT ──────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-14 md:py-20" id="content">

        {/* Featured */}
        {featured && <FeaturedCard post={featured} onNav={() => navigate(`/blog/${featured.slug}`)} />}

        {/* Section header */}
        {rest.length > 0 && (
          <div className="flex items-center gap-4 mb-10" aria-hidden="true">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-stone-200 dark:via-stone-700 to-transparent" />
            <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-stone-400 dark:text-stone-500 flex items-center gap-2"
              style={{ fontFamily: "'Outfit', sans-serif" }}>
              {cat === 'all' ? 'Más artículos' : CAT[cat]?.label}
              <span className="px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 text-[10px]">
                {rest.length}
              </span>
            </span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-stone-200 dark:via-stone-700 to-transparent" />
          </div>
        )}

        {/* Grid */}
        {rest.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5" role="list">
            {pagedRest.map((p, i) => (
              <PostCard key={p.id} post={p} index={i} onNav={() => navigate(`/blog/${p.slug}`)} />
            ))}
          </div>
        )}

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-14" role="navigation" aria-label="Paginación">
            {/* Anterior */}
            <button
              onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
              disabled={page === 1}
              aria-label="Página anterior"
              className="flex items-center justify-center w-9 h-9 rounded-full border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-[#141210] text-stone-500 dark:text-stone-400 disabled:opacity-30 hover:border-[#2FAF8F] hover:text-[#2FAF8F] transition-all duration-200 disabled:cursor-not-allowed"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M15 18l-6-6 6-6"/>
              </svg>
            </button>

            {/* Números */}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => {
              const isActive = n === page
              const isNear   = Math.abs(n - page) <= 1 || n === 1 || n === totalPages
              if (!isNear) {
                if (n === 2 && page > 3) return <span key={n} className="text-stone-400 text-[13px] px-1">…</span>
                if (n === totalPages - 1 && page < totalPages - 2) return <span key={n} className="text-stone-400 text-[13px] px-1">…</span>
                return null
              }
              return (
                <button
                  key={n}
                  onClick={() => { setPage(n); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                  aria-label={`Página ${n}`}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex items-center justify-center w-9 h-9 rounded-full text-[13px] font-semibold border transition-all duration-200
                    ${isActive
                      ? 'bg-stone-900 dark:bg-stone-50 text-white dark:text-stone-900 border-stone-900 dark:border-stone-50 shadow-sm'
                      : 'border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-[#141210] text-stone-500 dark:text-stone-400 hover:border-[#2FAF8F] hover:text-[#2FAF8F]'
                    }`}
                  style={{ fontFamily: "'Outfit', sans-serif" }}
                >
                  {n}
                </button>
              )
            })}

            {/* Siguiente */}
            <button
              onClick={() => { setPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
              disabled={page === totalPages}
              aria-label="Página siguiente"
              className="flex items-center justify-center w-9 h-9 rounded-full border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-[#141210] text-stone-500 dark:text-stone-400 disabled:opacity-30 hover:border-[#2FAF8F] hover:text-[#2FAF8F] transition-all duration-200 disabled:cursor-not-allowed"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </button>
          </div>
        )}

        {/* Empty states */}
        {rest.length === 0 && q !== '' && (
          <Empty msg={`Sin resultados para "${q}"`} onReset={() => { setQ(''); setCat('all') }} />
        )}
        {rest.length === 0 && q === '' && cat !== 'all' && featured && (
          <Empty msg="Sin artículos en esta categoría todavía." onReset={() => setCat('all')} />
        )}
        {posts.length === 0 && !loading && (
          <Empty msg="No hay artículos publicados todavía." onReset={() => navigate('/home')} />
        )}
      </main>

      {/* ── NEWSLETTER ────────────────────────────────────────────── */}
      <NewsletterSection />

      {/* ── CTA ───────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden border-t border-black/[0.07] dark:border-white/[0.05] bg-[#F3F2EF] dark:bg-[#0f0d0b]"
        aria-label="Solicitar acceso"
      >
        {/* Orbs */}
        <div className="absolute -top-32 -right-16 w-[400px] h-[400px] rounded-full bg-[#2FAF8F] opacity-[0.07] blur-[88px] pointer-events-none"
          style={{ animation: 'orb1 9s ease-in-out infinite' }} aria-hidden="true" />
        <div className="absolute -bottom-24 -left-10 w-72 h-72 rounded-full bg-[#2FAF8F] opacity-[0.05] blur-[70px] pointer-events-none"
          style={{ animation: 'orb2 12s ease-in-out 2s infinite' }} aria-hidden="true" />

        <div className="relative z-10 max-w-[680px] mx-auto px-6 py-24 lg:py-32 text-center">
          <div className="inline-flex items-center gap-2 mb-7">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2FAF8F]" />
            <div className="h-px w-4 bg-[rgba(47,175,143,0.5)]" />
            <span className="text-[10.5px] font-bold uppercase tracking-[0.13em] text-[#2FAF8F]"
              style={{ fontFamily: "'Outfit', sans-serif" }}>
              Sistema Activo · México
            </span>
          </div>

          <h2 className="text-[clamp(36px,5.5vw,68px)] font-bold tracking-[-0.044em] leading-[1.01] text-stone-900 dark:text-stone-50 mb-5"
            style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
            El ecosistema de<br />trazabilidad<br />
            <em className="font-normal italic text-stone-400 dark:text-stone-500">más avanzado de México</em>
          </h2>

          <p className="text-[16px] text-stone-500 dark:text-stone-400 leading-[1.72] mb-11 tracking-[-0.01em]"
            style={{ fontFamily: "'Outfit', sans-serif" }}>
            Comienza a operar con GANDIA 7 y transforma la gestión de tu operación ganadera.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
            <button
              onClick={() => navigate('/signup')}
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-[13px] bg-[#2FAF8F] text-white text-[14px] font-bold border-none cursor-pointer shadow-[0_8px_24px_rgba(47,175,143,0.3)] hover:bg-[#27a07f] hover:-translate-y-0.5 hover:shadow-[0_14px_32px_rgba(47,175,143,0.4)] transition-all active:scale-[0.98]"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              Solicitar Acceso
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
            <button
              onClick={() => navigate('/modelo-operativo')}
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-[13px] bg-transparent text-stone-500 dark:text-stone-400 text-[14px] font-medium border border-black/[0.1] dark:border-white/[0.1] cursor-pointer hover:bg-stone-100 dark:hover:bg-white/[0.06] hover:text-stone-700 dark:hover:text-stone-200 hover:border-black/[0.15] dark:hover:border-white/[0.2] transition-all active:scale-[0.98]"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              Ver Modelo Operativo
            </button>
          </div>

          <div className="flex flex-wrap justify-center gap-5 text-[12px] text-stone-400 dark:text-stone-500">
            {['Sin suscripción forzada', 'Pago por uso', 'Certificación en 48h'].map(t => (
              <div key={t} className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2FAF8F] flex-shrink-0" />
                {t}
              </div>
            ))}
          </div>
        </div>

        <style>{`
          @keyframes orb1 { 0%,100%{transform:scale(1);opacity:.07} 50%{transform:scale(1.1);opacity:.12} }
          @keyframes orb2 { 0%,100%{transform:scale(1.05);opacity:.05} 50%{transform:scale(.95);opacity:.09} }
        `}</style>
      </section>

      {/* ── FOOTER (componente existente) ─────────────────────────── */}
      <Footer isDark={isDark} />

      {/* ── BACK TO TOP ───────────────────────────────────────────── */}
      <BackToTop />
    </div>
  )
}
