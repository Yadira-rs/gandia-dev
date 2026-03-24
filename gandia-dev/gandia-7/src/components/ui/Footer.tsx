import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

// ─────────────────────────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────────────────────────
const FUNCTIONS_URL = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL as string

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────
const SOCIAL_LINKS = [
  {
    name: 'Instagram',
    url: 'https://instagram.com/gand.ia7/',
    icon: <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />,
  },
  {
    name: 'TikTok',
    url: 'https://www.tiktok.com/@gand.ia7',
    icon: <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />,
  },
  {
    name: 'YouTube',
    url: 'https://www.youtube.com/@Gandia7',
    icon: <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />,
  },
  {
    name: 'X',
    url: 'https://twitter.com/gandia7',
    icon: <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />,
  },
  {
    name: 'LinkedIn',
    url: 'https://linkedin.com/company/gandia7',
    icon: <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />,
  },
] as const

const NAV_LINKS = {
  legal: [
    ['Términos y Condiciones',      '/legal?section=terms'],
    ['Política de Privacidad',      '/legal?section=privacy'],
    ['Aviso de Privacidad LFPDPPP', '/legal?section=lfpdppp'],
    ['Política de Cookies',         '/legal?section=cookies'],
  ],
  recursos: [
    ['Blog',             '/blog'],
    ['Modelo Operativo', '/modelo-operativo'],
    ['Cumplimiento',     '/compliance'],
    ['Certificaciones',  '/compliance'],
  ],
  contacto: [
    ['contacto@gandia7.com', 'mailto:contacto@gandia7.com'],
    ['legal@gandia7.com',    'mailto:legal@gandia7.com'],
    ['soporte@gandia7.com',  'mailto:soporte@gandia7.com'],
    ['+52 (618) No disponible', '#'],
  ],
} as const

// ─────────────────────────────────────────────────────────────────────────────
// NEWSLETTER — lógica idéntica, presentación nueva
// ─────────────────────────────────────────────────────────────────────────────
type SubscribeStatus = 'idle' | 'loading' | 'success' | 'error' | 'invalid'

function NewsletterInline({ isDark }: { isDark: boolean }) {
  const navigate = useNavigate()
  const [email, setEmail]   = useState('')
  const [status, setStatus] = useState<SubscribeStatus>('idle')
  const [errorMsg, setErrorMsg] = useState('Ingresa un email válido.')

  const isValidEmail = (val: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim())

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValidEmail(email)) {
      setErrorMsg('Ingresa un email válido.')
      setStatus('invalid')
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
      setEmail('')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error interno. Intenta de nuevo.'
      setErrorMsg(msg)
      setStatus('error')
      setTimeout(() => setStatus('idle'), 4000)
    }
  }

  const isErr = status === 'invalid' || status === 'error'

  return (
    <div
      className={`rounded-2xl p-6 border ${
        isDark
          ? 'bg-[#141210] border-white/[0.07] shadow-[0_4px_18px_rgba(0,0,0,0.4)]'
          : 'bg-white border-black/[0.07] shadow-[0_4px_18px_rgba(0,0,0,0.07)]'
      }`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <span className="w-1.5 h-1.5 rounded-full bg-[#2FAF8F]" aria-hidden="true"
          style={{ boxShadow: '0 0 6px rgba(47,175,143,0.6)' }} />
        <span className="text-[10px] font-bold tracking-[0.13em] uppercase text-[#2FAF8F]"
          style={{ fontFamily: "'Outfit', sans-serif" }}>
          Newsletter Mensual
        </span>
      </div>

      <p className={`text-[13px] font-semibold mb-1 leading-tight ${isDark ? 'text-stone-100' : 'text-stone-900'}`}
        style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
        Mantente al día
      </p>
      <p className={`text-[12px] leading-relaxed mb-4 ${isDark ? 'text-stone-500' : 'text-stone-400'}`}
        style={{ fontFamily: "'Outfit', sans-serif" }}>
        Análisis, normativas y tecnología ganadera cada mes.
      </p>

      {/* Form / Success */}
      {status === 'success' ? (
        <div className={`flex items-center gap-2.5 px-3.5 py-3 rounded-xl border ${
          isDark ? 'border-white/[0.07] bg-stone-900/40' : 'border-black/[0.06] bg-stone-50'
        }`}>
          <div className="w-5 h-5 rounded-full bg-[#2FAF8F]/15 flex items-center justify-center shrink-0">
            <svg className="w-3 h-3 text-[#2FAF8F]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
              <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className={`text-[12px] font-medium ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>
            ¡Listo! Revisa tu bandeja.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate aria-label="Suscripción al newsletter" className="space-y-2">
          {/* Input con ícono de email */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <path d="M22 6l-10 7L2 6"/>
            </svg>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (isErr) setStatus('idle')
              }}
              placeholder="tu@email.com"
              aria-label="Tu correo electrónico"
              autoComplete="email"
              disabled={status === 'loading'}
              className={`w-full pl-9 pr-4 py-2.5 rounded-xl text-[13px] border transition-all outline-none disabled:opacity-50
                focus:border-[#2FAF8F] focus:ring-2 focus:ring-[rgba(47,175,143,0.2)] ${
                isErr
                  ? 'border-red-400/50'
                  : isDark
                    ? 'bg-stone-900/60 border-white/[0.08] text-stone-100 placeholder-stone-600'
                    : 'bg-stone-50 border-black/[0.08] text-stone-900 placeholder-stone-400'
              }`}
              style={{ fontFamily: "'Outfit', sans-serif" }}
            />
          </div>

          <button
            type="submit"
            disabled={status === 'loading'}
            aria-label="Suscribirse al newsletter"
            className={`w-full flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl text-[13px] font-semibold transition-all duration-200 active:scale-[0.98] disabled:opacity-70 ${
              status === 'error'
                ? 'bg-rose-500 text-white'
                : isDark
                  ? 'bg-stone-50 text-stone-900 hover:bg-white shadow-sm hover:shadow-md'
                  : 'bg-stone-900 text-white hover:bg-stone-800 shadow-sm hover:shadow-md'
            }`}
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            {status === 'idle'    && <>Suscribirme <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg></>}
            {status === 'loading' && <><span className="w-3.5 h-3.5 rounded-full border-2 border-current/30 border-t-current animate-spin" />Procesando...</>}
            {status === 'error'   && 'Intentar de nuevo'}
          </button>

          {isErr && (
            <p className="text-red-400 text-[11px] pl-1" role="alert" aria-live="polite">{errorMsg}</p>
          )}
        </form>
      )}

      {/* Privacy */}
      <p className={`text-[10.5px] leading-relaxed mt-3 ${isDark ? 'text-stone-700' : 'text-stone-300'}`}
        style={{ fontFamily: "'Outfit', sans-serif" }}>
        Sin spam. Cancela cuando quieras.{' '}
        <button
          type="button"
          onClick={() => navigate('/legal?section=privacy')}
          className="underline underline-offset-2 hover:text-[#2FAF8F] transition-colors focus-visible:outline-none"
        >
          Privacidad
        </button>
      </p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// FOOTER PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
export default function Footer() {
  const isDark = true // Footer siempre oscuro
  const navigate = useNavigate()
  const [lang, setLang] = useState<'es' | 'en'>(() =>
    (localStorage.getItem('gandia-lang') as 'es' | 'en') ?? 'es'
  )

  const toggleLang = (next: 'es' | 'en') => {
    setLang(next)
    localStorage.setItem('gandia-lang', next)
  }

  const bg       = isDark ? '#0c0a09'   : '#F3F2EF'
  const divider  = isDark ? '#1C1C1C'   : '#E4E4E2'
  const textHead = isDark ? '#FAFAFA'   : '#171717'
  const textSec  = isDark ? '#A3A3A3'   : '#6E6E6E'
  const textMut  = isDark ? '#3A3A3A'   : '#C4C4C2'
  const textCol  = isDark ? '#666'      : '#ADADAD'

  return (
    <footer
      role="contentinfo"
      style={{ background: bg, fontFamily: "'Outfit', -apple-system, sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,700;0,9..144,800;1,9..144,400;1,9..144,700&family=Outfit:wght@300;400;500;600&display=swap');
        @keyframes pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(.75)} }
      `}</style>

      {/* ── STATEMENT EDITORIAL ─────────────────────────────────────────────── */}
      <div
        style={{ borderTop: `1px solid ${divider}` }}
        className="max-w-6xl mx-auto px-6 pt-16 pb-14"
      >
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-12 items-start">

          {/* Frase */}
          <div>
            <div className="flex items-center gap-2 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2FAF8F]" aria-hidden="true" />
              <div className="h-px w-6 bg-[rgba(47,175,143,0.4)]" aria-hidden="true" />
              <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-[#2FAF8F]">
                Sistema activo · México
              </span>
            </div>

            <h2
              className="leading-[1.0] tracking-[-0.04em]"
              style={{
                fontFamily: "'Fraunces', Georgia, serif",
                fontSize: 'clamp(36px, 5.5vw, 68px)',
                color: textHead,
              }}
            >
              Cada animal.{' '}
              <em
                className="font-normal"
                style={{
                  color: isDark ? '#555' : '#C4C4C2',
                  fontStyle: 'italic',
                }}
              >
                Su historia.
              </em>
              <br />
              Verificada.
            </h2>
          </div>

          {/* Newsletter */}
          <div className="pb-1">
            <NewsletterInline isDark={isDark} />
          </div>
        </div>
      </div>

      {/* ── NAV GRID ────────────────────────────────────────────────────────── */}
      <div
        className="max-w-6xl mx-auto px-6 py-12"
        style={{ borderTop: `1px solid ${divider}` }}
      >
        <div className="grid grid-cols-2 md:grid-cols-[1.6fr_1fr_1fr_1fr] gap-10">

          {/* Col 1 — Marca */}
          <div className="col-span-2 md:col-span-1 flex flex-col gap-5">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-5 h-5 text-[#2FAF8F]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
                <span className="text-[15px] font-semibold tracking-tight" style={{ color: textHead }}>
                  GANDIA 7
                </span>
              </div>
              <p className="text-[13px] leading-relaxed" style={{ color: textSec }}>
                Sistema Institucional de<br />Trazabilidad Ganadera
              </p>
            </div>

            <p className="text-[11.5px] leading-relaxed" style={{ color: textMut }}>
              <strong className="font-semibold" style={{ color: textSec }}>
                GANDIA 7 Technologies S.A. de C.V.
              </strong><br />
              RFC: No disponible<br />
              Durango, Durango, México
            </p>

          </div>

          {/* Col 2 — Legal */}
          <div>
            <h3 className="text-[9.5px] font-bold tracking-[0.12em] uppercase mb-4" style={{ color: textCol }}>
              Legal
            </h3>
            <ul className="flex flex-col gap-2.5">
              {NAV_LINKS.legal.map(([label, path]) => (
                <li key={path}>
                  <button
                    onClick={() => navigate(path)}
                    className="text-[13px] text-left leading-snug hover:text-[#2FAF8F] transition-colors duration-150 focus-visible:outline-none focus-visible:underline"
                    style={{ color: textSec }}
                  >
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3 — Recursos */}
          <div>
            <h3 className="text-[9.5px] font-bold tracking-[0.12em] uppercase mb-4" style={{ color: textCol }}>
              Recursos
            </h3>
            <ul className="flex flex-col gap-2.5">
              {NAV_LINKS.recursos.map(([label, path]) => (
                <li key={label}>
                  <button
                    onClick={() => navigate(path)}
                    className="text-[13px] text-left leading-snug hover:text-[#2FAF8F] transition-colors duration-150 focus-visible:outline-none focus-visible:underline"
                    style={{ color: textSec }}
                  >
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4 — Contacto */}
          <div>
            <h3 className="text-[9.5px] font-bold tracking-[0.12em] uppercase mb-4" style={{ color: textCol }}>
              Contacto
            </h3>
            <ul className="flex flex-col gap-2.5">
              {NAV_LINKS.contacto.map(([label, href]) => (
                <li key={href}>
                  <a
                    href={href}
                    className="text-[13px] leading-snug hover:text-[#2FAF8F] transition-colors duration-150 focus-visible:outline-none focus-visible:underline"
                    style={{ color: textSec }}
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

        </div>
      </div>

      {/* ── REDES + IDIOMA ──────────────────────────────────────────────────── */}
      <div
        className="max-w-6xl mx-auto px-6 py-8 flex items-center gap-16"
        style={{ borderTop: `1px solid ${divider}` }}
      >

        {/* Idioma */}
        <div>
          <p className="text-[9.5px] font-bold tracking-[0.12em] uppercase mb-2.5" style={{ color: textCol }}>
            Idioma
          </p>
          <div className="relative inline-flex items-center">
            <svg
              className="pointer-events-none absolute left-2.5 w-3.5 h-3.5 shrink-0"
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              aria-hidden="true" style={{ color: textMut }}
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            <select
              value={lang}
              onChange={e => toggleLang(e.target.value as 'es' | 'en')}
              aria-label="Seleccionar idioma"
              className="appearance-none pl-8 pr-7 py-1.5 rounded-lg text-[12px] font-medium cursor-pointer"
              style={{
                fontFamily: "'Outfit', sans-serif",
                color: textSec,
                background: isDark ? '#161412' : '#F0EFEC',
                border: `1px solid ${divider}`,
                outline: 'none',
                boxShadow: 'none',
              }}
            >
              <option value="es" style={{ background: isDark ? '#1a1816' : '#fff' }}>Español</option>
              <option value="en" style={{ background: isDark ? '#1a1816' : '#fff' }}>English</option>
            </select>
            <svg className="pointer-events-none absolute right-2 w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true" style={{ color: textMut }}>
              <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        {/* Síguenos */}
        <div>
          <p className="text-[9.5px] font-bold tracking-[0.12em] uppercase mb-2.5" style={{ color: textCol }}>
            Síguenos
          </p>
          <div className="flex items-center gap-1.5">
            {SOCIAL_LINKS.map((social) => (
              <a
                key={social.name}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                title={social.name}
                aria-label={`Visitar ${social.name}`}
                className="group flex items-center gap-2 px-2.5 h-8 rounded-lg border transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2FAF8F] focus-visible:ring-offset-1"
                style={{ borderColor: isDark ? '#242424' : '#E8E8E6' }}
                onMouseEnter={e => {
                  const el = e.currentTarget
                  el.style.borderColor = 'rgba(47,175,143,0.45)'
                  el.style.background = 'rgba(47,175,143,0.06)'
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget
                  el.style.borderColor = isDark ? '#242424' : '#E8E8E6'
                  el.style.background = 'transparent'
                }}
              >
                <svg
                  className="w-3.5 h-3.5 shrink-0 transition-colors duration-200 group-hover:text-[#2FAF8F]"
                  viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"
                  style={{ color: isDark ? '#3A3A3A' : '#C8C8C8' }}
                >
                  {social.icon}
                </svg>
                <span
                  className="hidden md:block text-[11px] font-medium transition-colors duration-200 group-hover:text-[#2FAF8F]"
                  style={{ color: textMut, fontFamily: "'Outfit', sans-serif" }}
                >
                  {social.name}
                </span>
              </a>
            ))}
          </div>
        </div>

      </div>

      {/* ── WORDMARK CURTAIN ────────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden"
        aria-hidden="true"
        style={{ borderTop: `1px solid ${divider}` }}
      >
        {/* Ambient orb detrás del wordmark */}
        <div
          className="absolute inset-x-0 bottom-0 pointer-events-none"
          style={{
            height: '200%',
            background: 'radial-gradient(ellipse 60% 50% at 50% 80%, rgba(47,175,143,0.09) 0%, transparent 70%)',
          }}
        />

        {/* Wordmark con máscara de desvanecimiento */}
        <div
          className="max-w-6xl mx-auto px-6 pt-8 pb-0 select-none"
          style={{
            WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 100%)',
            maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 100%)',
          }}
        >
          <span
            className="block font-bold tracking-[-0.05em] leading-none whitespace-nowrap overflow-hidden"
            style={{
              fontFamily: "'Fraunces', Georgia, serif",
              fontSize: 'clamp(72px, 14vw, 180px)',
              color: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
            }}
          >
            GANDIA 7
          </span>
        </div>
      </div>

      {/* ── BOTTOM BAR ──────────────────────────────────────────────────────── */}
      <div style={{ borderTop: `1px solid ${divider}` }}>
        <div className="max-w-6xl mx-auto px-6 py-5 flex flex-row items-center gap-4">
          <p className="text-[11.5px] text-center sm:text-left" style={{ color: textMut }}>
            © 2026 GANDIA 7 Technologies S.A. de C.V. — Infraestructura certificada bajo normas oficiales mexicanas
          </p>
          <div className="flex items-center gap-6 ml-auto">
            <button
              onClick={() => navigate('/admin/panel')}
              className="text-[11px] px-2 py-1 rounded opacity-20 hover:opacity-90 transition-opacity duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2FAF8F]"
              aria-label="Acceso administrativo"
              title="Panel de administración"
              style={{ color: textMut }}
            >
              • • •
            </button>

            <div className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z"
                  fill="#2FAF8F"
                  opacity="0.8"
                />
              </svg>
              <span
                className="text-[11px] font-medium whitespace-nowrap"
                style={{ color: '#2FAF8F', opacity: 0.65, fontFamily: "'Outfit', sans-serif", letterSpacing: '0.01em' }}
              >
                Hecho con amor por búfalos
              </span>
            </div>
          </div>
        </div>
      </div>

    </footer>
  )
}