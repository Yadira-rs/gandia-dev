import { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { fetchPostBySlug, fetchPosts, type BlogPost } from '../../services/payloadApi'

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS — lógica original preservada
// ─────────────────────────────────────────────────────────────────────────────
const CAT: Record<string, { label: string; color: string; bg: string }> = {
  trazabilidad: { label: 'Trazabilidad',   color: '#1A9E7A', bg: '#E8F8F3' },
  normativa:    { label: 'Normativa',      color: '#3B6FD4', bg: '#EBF1FB' },
  tecnologia:   { label: 'Tecnología',     color: '#C4622A', bg: '#FBEEE6' },
  'casos-exito':{ label: 'Casos de Éxito', color: '#7B42B8', bg: '#F3EAFB' },
  guias:        { label: 'Guías',          color: '#9A6C1A', bg: '#F9F1E1' },
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })

function parseToc(content: string) {
  return content.split('\n\n').filter(b => b.trim().startsWith('## ')).map(b => {
    const label = b.trim().slice(3).trim()
    const id = label.toLowerCase().replace(/[¿?]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    return { id, label }
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// INLINE FORMATTER — preservado
// ─────────────────────────────────────────────────────────────────────────────
function inlineFmt(text: string) {
  return text.split(/\*\*(.*?)\*\*/g).map((part, i) =>
    i % 2 === 1
      ? <strong key={i} className="font-bold text-stone-900 dark:text-stone-50">{part}</strong>
      : part
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
      className="rounded-full flex items-center justify-center text-white font-semibold shrink-0 select-none"
      style={{
        width: size, height: size,
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
// PULL QUOTE
// ─────────────────────────────────────────────────────────────────────────────
function PullQuote({ text }: { text: string }) {
  return (
    <blockquote className="relative my-10 px-8 py-7 rounded-2xl bg-linear-to-br from-stone-100 to-stone-200 dark:from-stone-900 dark:to-stone-800/60 border border-black/[0.07] dark:border-white/[0.07] overflow-hidden">
      <span
        className="absolute -top-5 left-4 text-[110px] font-bold leading-none text-[#2FAF8F] opacity-[0.13] select-none pointer-events-none"
        style={{ fontFamily: "'Fraunces', Georgia, serif" }}
        aria-hidden="true"
      >"</span>
      <p
        className="relative z-10 text-[clamp(18px,2.4vw,22px)] italic font-normal leading-[1.55] text-stone-800 dark:text-stone-100 tracking-[-0.022em]"
        style={{ fontFamily: "'Fraunces', Georgia, serif" }}
      >
        {inlineFmt(text)}
      </p>
    </blockquote>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// BULLET LIST
// ─────────────────────────────────────────────────────────────────────────────
function BulList({ raw }: { raw: string }) {
  return (
    <ul className="flex flex-col gap-3 mb-7 list-none">
      {raw.split('\n').filter(l => l.startsWith('- ')).map((item, i) => (
        <li key={i} className="flex gap-3.5 text-[clamp(16px,2vw,18.5px)] leading-[1.72] text-stone-600 dark:text-stone-300"
          style={{ fontFamily: "'Lora', Georgia, serif" }}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#2FAF8F] mt-2.75 shrink-0" aria-hidden="true" />
          <span>{inlineFmt(item.slice(2))}</span>
        </li>
      ))}
    </ul>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// BODY RENDERER — lógica original preservada
// ─────────────────────────────────────────────────────────────────────────────
function Body({ content }: { content: string }) {
  if (!content?.trim()) return null
  const blocks = content.split('\n\n').filter(b => b.trim())
  let firstParagraphIndex = -1
  blocks.forEach((block, idx) => {
    const t = block.trim()
    if (firstParagraphIndex === -1 && !t.startsWith('## ') && !t.startsWith('> ') && !t.startsWith('- ')) {
      firstParagraphIndex = idx
    }
  })

  return (
    <>
      {blocks.map((block, i) => {
        const t = block.trim()
        if (!t) return null
        if (t.startsWith('## ')) {
          const txt = t.slice(3).trim()
          const id = txt.toLowerCase().replace(/[¿?]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
          return (
            <h2
              key={i} id={id}
              className="mt-14 mb-5 pl-5 border-l-[3px] border-[#2FAF8F] text-[clamp(22px,3vw,30px)] font-bold tracking-[-0.04em] leading-[1.2] text-stone-900 dark:text-stone-50 scroll-mt-24"
              style={{ fontFamily: "'Fraunces', Georgia, serif" }}
            >
              {txt}
            </h2>
          )
        }
        if (t.startsWith('> ')) return <PullQuote key={i} text={t.slice(2)} />
        if (t.startsWith('- ')) return <BulList key={i} raw={t} />

        const isFirst = i === firstParagraphIndex
        return (
          <p
            key={i}
            className={`text-[clamp(16px,2vw,18.5px)] leading-[1.84] text-stone-600 dark:text-stone-300 mb-7 tracking-[0.002em] ${isFirst ? 'first-letter-drop' : ''}`}
            style={{ fontFamily: "'Lora', Georgia, serif" }}
          >
            {inlineFmt(t)}
          </p>
        )
      })}
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// LOADER — mismo estilo que BlogPage
// ─────────────────────────────────────────────────────────────────────────────
function Loader() {
  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-[#FAFAF8] dark:bg-[#0c0a09]">
      <div className="flex flex-col items-center gap-0">
        <div className="relative w-14 h-14 mb-7" style={{ animation: 'gl-in 0.6s ease 0.05s both' }}>
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#2FAF8F" strokeWidth="1.75"
            style={{ filter: 'drop-shadow(0 0 18px rgba(47,175,143,0.22))' }}>
            <path style={{ animation: 'gl-layer 2.4s ease-in-out infinite' }}       d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path style={{ animation: 'gl-layer 2.4s ease-in-out 0.3s infinite' }}  d="M2 12l10 5 10-5"/>
            <path style={{ animation: 'gl-layer 2.4s ease-in-out 0.6s infinite' }}  d="M2 17l10 5 10-5"/>
          </svg>
          <div className="absolute top-1/2 left-1/2 w-24 h-24 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle,rgba(47,175,143,0.18) 0%,transparent 70%)', filter: 'blur(16px)', transform: 'translate(-50%,-50%)', animation: 'gl-glow-pulse 2.4s ease-in-out infinite' }} />
        </div>
        <div className="flex items-baseline gap-1.5 mb-5" style={{ animation: 'gl-in 0.6s ease 0.12s both' }}>
          <span className="text-[22px] font-bold tracking-[0.06em] text-stone-900 dark:text-stone-100" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>GANDIA</span>
          <span className="text-[22px] font-normal italic text-[#2FAF8F]" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>7</span>
        </div>
        <div className="w-8 h-px mb-4 bg-linear-to-r from-transparent via-stone-300 dark:via-stone-700 to-transparent" style={{ animation: 'gl-in 0.6s ease 0.18s both' }} />
        <p className="text-[12px] font-medium tracking-[0.06em] uppercase text-stone-400 mb-4" style={{ fontFamily: "'Outfit', sans-serif", animation: 'gl-in 0.6s ease 0.24s both' }}>Cargando artículo</p>
        <div className="w-32 h-0.5 rounded-full overflow-hidden bg-stone-200 dark:bg-stone-800" style={{ animation: 'gl-in 0.6s ease 0.28s both' }}>
          <div className="h-full w-full rounded-full bg-[#2FAF8F]" style={{ animation: 'gl-bar-slide 1.8s cubic-bezier(0.4,0,0.2,1) infinite' }} />
        </div>
      </div>
      <style>{`
        @keyframes gl-layer { 0%,100%{opacity:1;transform:translateY(0) scale(1)} 50%{opacity:.45;transform:translateY(-5px) scale(.97)} }
        @keyframes gl-glow-pulse { 0%,100%{opacity:.5;transform:translate(-50%,-50%) scale(1)} 50%{opacity:1;transform:translate(-50%,-50%) scale(1.15)} }
        @keyframes gl-bar-slide { 0%{transform:translateX(-100%)} 60%{transform:translateX(0%)} 100%{transform:translateX(100%)} }
        @keyframes gl-in { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// NOT FOUND VIEW
// ─────────────────────────────────────────────────────────────────────────────
function NotFoundView({ onBack, message }: { onBack: () => void; message?: string | null }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#FAFAF8] dark:bg-[#0c0a09]">
      <p className="text-[72px] font-bold tracking-[-0.05em] leading-none text-stone-200 dark:text-stone-800"
        style={{ fontFamily: "'Fraunces', Georgia, serif" }}>404</p>
      <p className="text-[15px] text-stone-500 dark:text-stone-400">{message || 'Artículo no encontrado'}</p>
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-[13px] font-semibold text-[#2FAF8F] border border-[rgba(47,175,143,0.3)] rounded-full px-5 py-2.5 hover:bg-[rgba(47,175,143,0.08)] transition-all cursor-pointer bg-transparent"
        style={{ fontFamily: "'Outfit', sans-serif" }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        Volver al blog
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARE ICONS
// ─────────────────────────────────────────────────────────────────────────────
function IconShare() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"/></svg>
}
function IconCheck() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>
}

// ─────────────────────────────────────────────────────────────────────────────
// BACK TO TOP
// ─────────────────────────────────────────────────────────────────────────────
function BackToTop() {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const fn = () => setVisible(window.scrollY > 600)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])
  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Volver arriba"
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-11 h-11 rounded-full bg-stone-900 dark:bg-stone-50 text-white dark:text-stone-900 shadow-[0_4px_20px_rgba(0,0,0,0.25)] border border-white/10 dark:border-black/10 hover:scale-110 active:scale-95 transition-all duration-200"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(16px)',
        pointerEvents: visible ? 'auto' : 'none',
        transition: 'opacity 0.25s ease, transform 0.25s ease'
      }}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 15l-6-6-6 6"/></svg>
    </button>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function BlogPostPage() {
  const navigate = useNavigate()
  const { slug } = useParams<{ slug: string }>()

  const [post, setPost]         = useState<BlogPost | null>(null)
  const [related, setRelated]   = useState<BlogPost[]>([])
  const [loading, setLoading]   = useState(true)
  const [ready, setReady]     = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [pct, setPct]         = useState(0)
  const [parallaxY, setParallaxY] = useState(0)
  const [copied, setCopied]   = useState(false)
  const [activeH, setActiveH] = useState('')
  const [error, setError]     = useState<string | null>(null)
  const [isDark, setIsDark]   = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)').matches : false
  )
  const articleRef = useRef<HTMLElement>(null)

  // Dark mode listener
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const fn = (e: MediaQueryListEvent) => setIsDark(e.matches)
    mq.addEventListener('change', fn)
    return () => mq.removeEventListener('change', fn)
  }, [])

  // Fetch post — lógica original preservada
  useEffect(() => {
    async function loadPost() {
      if (!slug) { setError('Slug no válido'); setLoading(false); return }
      setLoading(true); setError(null)
      try {
        const data = await fetchPostBySlug(slug)
        setPost(data)
        if (!data) { setError('Artículo no encontrado'); return }

        // Fetch artículos relacionados — misma categoría, excluye el actual
        try {
          const all = await fetchPosts()
          const catSlug = String(data.category ?? '')
          const rel = all
            .filter((p: BlogPost) => p.slug !== slug && String(p.category ?? '') === catSlug)
            .slice(0, 3)
          setRelated(rel.length >= 2 ? rel : all.filter((p: BlogPost) => p.slug !== slug).slice(0, 3))
        } catch { /* silencioso */ }
      } catch (err) {
        console.error('Error loading post:', err)
        setError('Error al cargar el artículo')
      } finally {
        setLoading(false)
        requestAnimationFrame(() => setTimeout(() => setReady(true), 32))
      }
    }
    loadPost()
  }, [slug])

  // Scroll tracking — lógica original preservada + parallax
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 56)
      setParallaxY(window.scrollY * 0.35)
      if (!articleRef.current) return
      const { offsetTop, offsetHeight } = articleRef.current
      const total = offsetHeight + offsetTop - window.innerHeight
      setPct(Math.min(100, Math.max(0, ((window.scrollY - offsetTop) / total) * 100)))
      const hs = articleRef.current.querySelectorAll('h2[id]')
      let cur = ''
      hs.forEach(h => { if (h.getBoundingClientRect().top <= 120) cur = h.id })
      setActiveH(cur)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Share handler — lógica original preservada
  const handleShare = useCallback(async () => {
    if (navigator.share && post) {
      try { await navigator.share({ title: post.title, text: post.excerpt, url: window.location.href }) }
      catch (e) { console.log('Share cancelled', e) }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href)
        setCopied(true)
        setTimeout(() => setCopied(false), 2400)
      } catch (e) { console.error('Failed to copy', e) }
    }
  }, [post])

  const goSection = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  if (loading) return <Loader />
  if (error || !post) return <NotFoundView onBack={() => navigate('/blog')} message={error} />

  const cat = CAT[post.category]
  const toc = parseToc(post.content)

  return (
    <div
      className="min-h-screen bg-[#FAFAF8] dark:bg-[#0c0a09]"
      style={{ fontFamily: "'Outfit', -apple-system, sans-serif", WebkitFontSmoothing: 'antialiased' }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;0,9..144,700;0,9..144,800;1,9..144,400;1,9..144,600;1,9..144,700&family=Outfit:wght@300;400;500;600;700&family=Lora:ital,wght@0,400;0,500;0,600;1,400&display=swap');
        :root { --page-bg: #FAFAF8; }
        @media (prefers-color-scheme: dark) { :root { --page-bg: #0c0a09; } }
        .first-letter-drop::first-letter {
          float: left;
          font-family: 'Fraunces', Georgia, serif;
          font-size: 4.8em;
          font-weight: 700;
          line-height: 0.72;
          letter-spacing: -0.04em;
          color: #111110;
          margin: 0.04em 0.12em -0.04em 0;
        }
        @media (prefers-color-scheme: dark) {
          .first-letter-drop::first-letter { color: #F0EFE9; }
        }
        @keyframes hero-up {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes hero-img-in {
          from { opacity: 0; transform: translateX(24px) scale(0.97); }
          to   { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes line-grow {
          from { transform: scaleX(0); transform-origin: left; opacity: 0; }
          to   { transform: scaleX(1); transform-origin: left; opacity: 1; }
        }
        @media(prefers-reduced-motion:reduce){ *{animation-duration:.01ms!important;transition-duration:.01ms!important} }
      `}</style>

      {/* ── SUB-HEADER — mismo estilo que Header.tsx ─────────────── */}
      <div className={`sticky top-0 z-40 transition-colors backdrop-blur-xl shadow-sm border-b ${
        isDark
          ? 'bg-[#0c0a09]/60 border-[#2A2A2A]/40 text-[#FAFAFA]'
          : 'bg-white/60 border-[#EAEAEA]/40 text-[#171717]'
      }`}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-11 flex items-center gap-3">

          {/* Volver al blog */}
          <button
            onClick={() => navigate('/blog')}
            className={`flex items-center gap-1.5 text-[12px] font-medium transition-all bg-transparent border-none cursor-pointer shrink-0 group ${isDark ? 'text-[#A3A3A3] hover:text-[#2FAF8F]' : 'text-[#6E6E6E] hover:text-[#2FAF8F]'}`}
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              className="group-hover:-translate-x-0.5 transition-transform">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Blog
          </button>

          <span className={`text-[14px] ${isDark ? 'text-[#2A2A2A]' : 'text-[#EAEAEA]'}`} aria-hidden="true">/</span>

          {/* Título — fade in al scrollear */}
          <p
            className={`flex-1 text-[12px] font-medium truncate hidden sm:block transition-all duration-500 ${isDark ? 'text-[#A3A3A3]' : 'text-[#6E6E6E]'}`}
            style={{
              fontFamily: "'Fraunces', Georgia, serif",
              opacity: scrolled ? 1 : 0,
              transform: scrolled ? 'translateY(0)' : 'translateY(4px)',
            }}
          >
            {post.title}
          </p>

          {/* Progreso — fade in al scrollear */}
          <div className={`hidden sm:flex items-center gap-2 shrink-0 transition-all duration-300 ${scrolled ? 'opacity-100' : 'opacity-0'}`}>
            <div className={`w-14 h-1 rounded-full overflow-hidden ${isDark ? 'bg-[#2A2A2A]' : 'bg-stone-100'}`}>
              <div className="h-full bg-[#2FAF8F] rounded-full transition-[width] duration-100 ease-linear" style={{ width: `${pct}%` }} />
            </div>
            <span className={`text-[10px] font-semibold tabular-nums w-6 ${isDark ? 'text-[#A3A3A3]' : 'text-[#6E6E6E]'}`}
              style={{ fontFamily: "'Outfit', sans-serif" }}>
              {Math.round(pct)}%
            </span>
          </div>

          {/* Compartir */}
          <button
            onClick={handleShare}
            className={`shrink-0 flex items-center gap-1.5 text-[11.5px] font-semibold px-3.5 py-1.5 rounded-lg border transition-all duration-200 cursor-pointer ${
              copied
                ? 'border-[#2FAF8F]/40 text-[#2FAF8F] bg-[#2FAF8F]/08'
                : isDark
                  ? 'border-[#2A2A2A]/80 text-[#A3A3A3] bg-transparent hover:border-[#2FAF8F] hover:text-[#2FAF8F]'
                  : 'border-[#EAEAEA] text-[#6E6E6E] bg-transparent hover:border-[#2FAF8F] hover:text-[#2FAF8F]'
            }`}
            style={{ fontFamily: "'Outfit', sans-serif" }}
            aria-label={copied ? 'Copiado' : 'Compartir'}
          >
            {copied
              ? <><IconCheck /><span>Copiado</span></>
              : <><IconShare /><span className="hidden sm:inline">Compartir</span></>
            }
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          HERO — LUXURY EDITORIAL · concepto único
          Layout: fondo oscuro con textura, imagen flotante recortada,
          tipografía masiva, número de edición, línea verde estructural
      ══════════════════════════════════════════════════════════════ */}
      <section
        className={`relative overflow-hidden transition-opacity duration-700 ${ready ? 'opacity-100' : 'opacity-0'}`}
        style={{ background: isDark ? '#0a0908' : '#111110', minHeight: 640 }}
        aria-label={`Artículo: ${post.title}`}
      >
        {/* ── Noise texture overlay ── */}
        <div className="absolute inset-0 opacity-[0.035] pointer-events-none" aria-hidden="true"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`, backgroundSize: '180px' }} />

        {/* ── Línea verde estructural vertical — izquierda ── */}
        <div className="absolute left-0 top-0 bottom-0 w-0.75"
          style={{ background: 'linear-gradient(to bottom, transparent 0%, #2FAF8F 20%, #2FAF8F 80%, transparent 100%)' }}
          aria-hidden="true" />

        {/* ── Ambient glow verde ── */}
        <div className="absolute top-1/2 left-1/3 w-125 h-125 rounded-full pointer-events-none -translate-y-1/2 -translate-x-1/2"
          style={{ background: 'radial-gradient(circle, rgba(47,175,143,0.08) 0%, transparent 65%)', filter: 'blur(40px)' }}
          aria-hidden="true" />

        {/* ── LAYOUT PRINCIPAL ── */}
        <div className="max-w-7xl mx-auto px-8 md:px-12 lg:px-16"
          style={{ display: 'grid', gridTemplateColumns: '1fr', minHeight: 640 }}>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] xl:grid-cols-[1fr_460px] gap-0 items-stretch">

            {/* ── COLUMNA IZQUIERDA: texto ────────────────────────── */}
            <div className="flex flex-col justify-between py-12 lg:py-16 pr-0 lg:pr-12 xl:pr-16">

              {/* Top: categoría pill */}
              <div style={{ animation: ready ? 'hero-up 0.55s ease 0.06s both' : 'none' }}>
                {cat && (
                  <div className="inline-flex items-center gap-2 mb-8">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: cat.color }} aria-hidden="true" />
                    <span
                      className="text-[10.5px] font-bold uppercase tracking-[0.14em]"
                      style={{ color: cat.color, fontFamily: "'Outfit',sans-serif" }}
                    >
                      {cat.label}
                    </span>
                    <span className="text-white/20 mx-1 text-[11px]">·</span>
                    <span className="text-[10.5px] text-white/35 uppercase tracking-[0.08em]" style={{ fontFamily: "'Outfit',sans-serif" }}>
                      {post.readTime} de lectura
                    </span>
                  </div>
                )}
              </div>

              {/* Centro: título masivo */}
              <div className="flex-1 flex flex-col justify-center py-6">
                <h1
                  className="font-bold text-white leading-[0.97] tracking-[-0.052em] mb-0"
                  style={{
                    fontFamily: "'Fraunces', Georgia, serif",
                    fontSize: 'clamp(36px, 5.8vw, 76px)',
                    animation: ready ? 'hero-up 0.7s cubic-bezier(0.16,1,0.3,1) 0.1s both' : 'none',
                  }}
                >
                  {post.title}
                </h1>

                {/* Línea verde horizontal bajo el título */}
                <div
                  className="mt-7 mb-7 h-px"
                  style={{
                    background: 'linear-gradient(to right, #2FAF8F, rgba(47,175,143,0.15) 60%, transparent)',
                    animation: ready ? 'line-grow 0.9s ease 0.35s both' : 'none'
                  }}
                  aria-hidden="true"
                />

                {/* Lede */}
                <p
                  className="text-white/55 leading-[1.7] max-w-130"
                  style={{
                    fontFamily: "'Outfit',sans-serif",
                    fontSize: 'clamp(14px, 1.5vw, 17px)',
                    letterSpacing: '-0.008em',
                    animation: ready ? 'hero-up 0.65s ease 0.28s both' : 'none'
                  }}
                >
                  {post.excerpt}
                </p>
              </div>

              {/* Bottom: autor + fecha */}
              <div
                className="flex items-center gap-3 pt-6"
                style={{
                  borderTop: '1px solid rgba(255,255,255,0.07)',
                  animation: ready ? 'hero-up 0.6s ease 0.38s both' : 'none'
                }}
              >
                <Av name={post.author.name} size={38} />
                <div>
                  <p className="text-[13px] font-semibold text-white/85 tracking-[-0.01em]" style={{ fontFamily: "'Outfit',sans-serif" }}>
                    {post.author.name}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-[11px] text-white/35" style={{ fontFamily: "'Outfit',sans-serif" }}>{post.author.role}</p>
                    <span className="text-white/15 text-[10px]">·</span>
                    <time className="text-[11px] text-white/30" style={{ fontFamily: "'Outfit',sans-serif" }} dateTime={post.publishedAt}>
                      {fmtDate(post.publishedAt)}
                    </time>
                  </div>
                </div>
              </div>
            </div>

            {/* ── COLUMNA DERECHA: imagen ──────────────────────────── */}
            <div
              className="relative hidden lg:block"
              style={{ animation: ready ? 'hero-img-in 1s cubic-bezier(0.16,1,0.3,1) 0.18s both' : 'none' }}
            >
              {post.coverImage ? (
                <>
                  {/* Marco imagen con clip asimétrico */}
                  <div
                    className="absolute inset-y-0 left-0 right-0 overflow-hidden"
                    style={{ clipPath: 'polygon(8% 0%, 100% 0%, 100% 100%, 0% 100%)' }}
                  >
                    <img
                      src={post.coverImage}
                      alt={post.title}
                      className="w-full h-full object-cover"
                      loading="eager"
                      style={{
                        transform: `translateY(${parallaxY * 0.1}px) scale(1.06)`,
                        transition: 'transform 0s linear',
                        filter: 'brightness(0.82) contrast(1.05)',
                      }}
                    />
                    {/* Overlay verde sutil sobre imagen */}
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{ background: 'linear-gradient(135deg, rgba(47,175,143,0.12) 0%, transparent 50%)' }}
                      aria-hidden="true"
                    />
                    {/* Fade izquierda para integrar con texto */}
                    <div
                      className="absolute inset-y-0 left-0 w-24 pointer-events-none"
                      style={{ background: 'linear-gradient(to right, #0a0908, transparent)' }}
                      aria-hidden="true"
                    />
                  </div>

                  {/* Línea verde diagonal decorativa sobre la imagen */}
                  <div
                    className="absolute bottom-12 right-6 pointer-events-none"
                    aria-hidden="true"
                  >
                    <div className="flex flex-col items-end gap-1">
                      <div className="w-8 h-0.5 rounded-full bg-[#2FAF8F] opacity-70" />
                      <div className="w-5 h-0.5 rounded-full bg-[#2FAF8F] opacity-40" />
                      <div className="w-3 h-0.5 rounded-full bg-[#2FAF8F] opacity-20" />
                    </div>
                  </div>
                </>
              ) : (
                /* Fallback: patrón geométrico con inicial */
                <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-center"
                  style={{ clipPath: 'polygon(8% 0%, 100% 0%, 100% 100%, 0% 100%)', background: 'linear-gradient(135deg, #161412 0%, #1a1a17 100%)' }}>
                  <span
                    className="text-[180px] font-bold leading-none select-none"
                    style={{ fontFamily: "'Fraunces',serif", color: 'rgba(47,175,143,0.08)', letterSpacing: '-0.05em' }}
                    aria-hidden="true"
                  >
                    {post.title[0]}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Fade de transición hacia el fondo de la página ── */}
        <div
          className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none"
          style={{ background: `linear-gradient(to bottom, transparent, ${isDark ? '#0c0a09' : '#FAFAF8'})` }}
          aria-hidden="true"
        />
      </section>

      {/* ── ARTICLE LAYOUT ────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 pb-24"
        style={{ display: 'grid', gridTemplateColumns: toc.length > 0 ? '220px 1fr' : '1fr', gap: toc.length > 0 ? '56px' : '0', alignItems: 'start' }}>

        {/* ToC — sidebar izquierda */}
        {toc.length > 0 && (
          <aside
            className="sticky top-28 hidden lg:block"
            aria-label="Tabla de contenidos"
          >
            <div className="rounded-2xl border border-black/[0.07] dark:border-white/[0.07] bg-stone-50 dark:bg-[#141210] p-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-3 px-1"
                style={{ fontFamily: "'Outfit', sans-serif" }}>
                Contenido
              </p>
              <nav>
                {toc.map(item => (
                  <button
                    key={item.id}
                    onClick={() => goSection(item.id)}
                    aria-current={activeH === item.id ? 'location' : undefined}
                    className={`w-full text-left block px-2.5 py-2 rounded-lg text-[12.5px] leading-[1.4] border-none cursor-pointer transition-all duration-150 mb-0.5 ${
                      activeH === item.id
                        ? 'text-[#2FAF8F] font-medium bg-[rgba(47,175,143,0.1)]'
                        : 'text-stone-500 dark:text-stone-400 font-normal bg-transparent hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800/60'
                    }`}
                    style={{ fontFamily: "'Outfit', sans-serif" }}
                  >
                    {item.label}
                  </button>
                ))}
              </nav>

            </div>
          </aside>
        )}

        {/* Article — columna derecha */}
        <article
          ref={articleRef}
          className="pt-2 min-w-0 max-w-180"
          aria-label={post.title}
          style={toc.length === 0 ? { margin: '0 auto' } : {}}
        >
          {/* Tags — antes del contenido */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-10" aria-label="Etiquetas">
              {post.tags.map(t => (
                <span key={t}
                  className="text-[11px] font-medium px-3 py-1 rounded-full bg-stone-100 dark:bg-stone-800/60 border border-black/6 dark:border-white/6 text-stone-400 dark:text-stone-500 tracking-[0.02em]"
                  style={{ fontFamily: "'Outfit',sans-serif" }}>
                  {t}
                </span>
              ))}
            </div>
          )}

          {/* Body */}
          <div className="mb-16">
            <Body content={post.content} />
          </div>

          {/* Footer del artículo */}
          <footer className="flex items-center justify-between flex-wrap gap-4 pt-6 border-t border-black/[0.07] dark:border-white/[0.07] mb-10">
            <span className="text-[14px] text-stone-500 dark:text-stone-400"
              style={{ fontFamily: "'Outfit', sans-serif" }}>
              ¿Te resultó útil este artículo?
            </span>
            <button
              onClick={handleShare}
              className={`text-[13px] font-semibold px-5 py-2 rounded-full border transition-all cursor-pointer ${
                copied
                  ? 'border-[rgba(47,175,143,0.4)] text-[#2FAF8F] bg-[rgba(47,175,143,0.08)]'
                  : 'border-[rgba(47,175,143,0.3)] text-[#2FAF8F] bg-transparent hover:bg-[rgba(47,175,143,0.1)] hover:border-[#2FAF8F]'
              }`}
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              {copied ? '✓ Copiado' : 'Compartir artículo'}
            </button>
          </footer>

          {/* Author bio */}
          {post.author.bio && (
            <aside
              className="flex gap-5 p-6 rounded-2xl border border-black/[0.07] dark:border-white/[0.07] bg-stone-50 dark:bg-[#141210] mb-2 items-start"
              aria-label={`Sobre ${post.author.name}`}
            >
              <Av name={post.author.name} size={56} />
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-bold tracking-[-0.02em] text-stone-900 dark:text-stone-100 mb-0.5"
                  style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
                  {post.author.name}
                </p>
                <p className="text-[12px] text-stone-400 dark:text-stone-500 mb-3">{post.author.role}</p>
                <p className="text-[13.5px] leading-[1.7] text-stone-500 dark:text-stone-400"
                  style={{ fontFamily: "'Lora', Georgia, serif" }}>
                  {post.author.bio}
                </p>
              </div>
            </aside>
          )}

          {/* ── Más artículos ─────────────────────────────────────── */}
          {related.length > 0 && (
            <section className="mt-16 pt-10 border-t border-black/[0.07] dark:border-white/6" aria-label="Más artículos">

              {/* Encabezado */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-5 rounded-full bg-[#2FAF8F]" aria-hidden="true" />
                  <h2
                    className="text-[18px] font-bold tracking-[-0.03em] text-stone-900 dark:text-stone-50"
                    style={{ fontFamily: "'Fraunces', Georgia, serif" }}
                  >
                    Más artículos
                  </h2>
                </div>
                <button
                  onClick={() => navigate('/blog')}
                  className={`text-[12px] font-medium flex items-center gap-1 transition-colors ${isDark ? 'text-[#A3A3A3] hover:text-[#2FAF8F]' : 'text-[#6E6E6E] hover:text-[#2FAF8F]'}`}
                  style={{ fontFamily: "'Outfit', sans-serif" }}
                >
                  Ver todos
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </button>
              </div>

              {/* Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {related.map(r => {
                  const rCatSlug = String(r.category ?? '')
                  const rCat = rCatSlug ? CAT[rCatSlug] : null
                  return (
                    <button
                      key={r.slug}
                      onClick={() => { navigate(`/blog/${r.slug}`); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                      className={`text-left group rounded-2xl border overflow-hidden transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(0,0,0,0.1)] ${
                        isDark
                          ? 'bg-[#111110] border-white/6 hover:border-[#2FAF8F]/20'
                          : 'bg-white border-black/6 hover:border-[#2FAF8F]/30'
                      }`}
                    >
                      {/* Imagen o fallback */}
                      <div className="relative w-full overflow-hidden bg-stone-100 dark:bg-stone-900" style={{ aspectRatio: '16/9' }}>
                        {r.coverImage ? (
                          <img
                            src={r.coverImage}
                            alt={r.title}
                            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-stone-100 to-stone-200 dark:from-stone-800 dark:to-stone-900">
                            <span className="text-[48px] font-bold leading-none select-none opacity-10"
                              style={{ fontFamily: "'Fraunces',serif", color: '#2FAF8F' }}>
                              {r.title[0]}
                            </span>
                          </div>
                        )}
                        {/* Overlay en hover */}
                        <div className="absolute inset-0 bg-[#2FAF8F]/0 group-hover:bg-[#2FAF8F]/04 transition-all duration-300" aria-hidden="true" />
                      </div>

                      {/* Contenido */}
                      <div className="p-5">
                        {rCat && (
                          <span
                            className="inline-block text-[10px] font-bold uppercase tracking-widest mb-3 px-2 py-0.5 rounded"
                            style={{ color: rCat.color, background: rCat.bg }}
                          >
                            {rCat.label}
                          </span>
                        )}
                        <h3
                          className={`text-[15px] font-bold tracking-[-0.025em] leading-[1.3] mb-2 line-clamp-2 transition-colors group-hover:text-[#2FAF8F] ${
                            isDark ? 'text-stone-100' : 'text-stone-900'
                          }`}
                          style={{ fontFamily: "'Fraunces', Georgia, serif" }}
                        >
                          {r.title}
                        </h3>
                        <p
                          className={`text-[12.5px] leading-[1.6] line-clamp-2 mb-4 ${isDark ? 'text-[#A3A3A3]' : 'text-[#6E6E6E]'}`}
                          style={{ fontFamily: "'Outfit', sans-serif" }}
                        >
                          {r.excerpt}
                        </p>
                        <div className={`flex items-center gap-2 text-[11px] ${isDark ? 'text-[#A3A3A3]' : 'text-[#6E6E6E]'}`}
                          style={{ fontFamily: "'Outfit', sans-serif" }}>
                          <Av name={r.author?.name ?? '?'} size={20} />
                          <span>{r.author?.name}</span>
                          <span className="opacity-40">·</span>
                          <span>{r.readTime}</span>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </section>
          )}

        </article>
      </div>

      {/* ── CTA ───────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden border-t border-black/[0.07] dark:border-white/5 bg-[#F3F2EF] dark:bg-[#0f0d0b]"
        aria-label="Solicitar acceso"
      >
        {/* Orbs */}
        <div className="absolute -top-24 right-1/4 w-80 h-80 rounded-full bg-[#2FAF8F] opacity-[0.07] blur-[80px] pointer-events-none" aria-hidden="true" />
        <div className="absolute -bottom-20 left-1/4 w-64 h-64 rounded-full bg-[#2FAF8F] opacity-[0.05] blur-[60px] pointer-events-none" aria-hidden="true" />

        <div className="relative z-10 max-w-150 mx-auto px-6 py-24 text-center">
          <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-[#2FAF8F] mb-5"
            style={{ fontFamily: "'Outfit', sans-serif" }}>
            GANDIA 7
          </p>
          <h2
            className="text-[clamp(28px,4.5vw,46px)] font-bold tracking-[-0.042em] leading-[1.08] text-stone-900 dark:text-stone-50 mb-4"
            style={{ fontFamily: "'Fraunces', Georgia, serif" }}
          >
            ¿Listo para transformar<br />
            <em className="font-normal italic text-stone-400 dark:text-stone-500">tu operación ganadera?</em>
          </h2>
          <p className="text-[16px] text-stone-500 dark:text-stone-400 mb-10 leading-[1.65] tracking-[-0.01em]"
            style={{ fontFamily: "'Outfit', sans-serif" }}>
            Únete al ecosistema de trazabilidad digital más avanzado de México.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate('/signup')}
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-[13px] bg-[#2FAF8F] text-white text-[14px] font-bold border-none cursor-pointer shadow-[0_8px_24px_rgba(47,175,143,0.3)] hover:bg-[#27a07f] hover:-translate-y-0.5 hover:shadow-[0_14px_32px_rgba(47,175,143,0.4)] transition-all active:scale-[0.98]"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              Solicitar Acceso
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
            <button
              onClick={() => navigate('/blog')}
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-[13px] bg-transparent text-stone-500 dark:text-stone-400 text-[14px] font-medium border border-black/10 dark:border-white/10 cursor-pointer hover:bg-stone-100 dark:hover:bg-white/6 hover:text-stone-800 dark:hover:text-stone-200 transition-all active:scale-[0.98]"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
              Todos los artículos
            </button>
          </div>
        </div>
      </section>

      {/* ── BACK TO TOP ───────────────────────────────────────────── */}
      <BackToTop />
    </div>
  )
}