import { useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'

function Splash() {
  const [progress, setProgress] = useState(0)
  const [fadeOut,  setFadeOut]  = useState(false)
  const navigate                = useNavigate()
  const done                    = useRef(false) // evita doble ejecución

  // ── Tema: siempre OS, nunca localStorage ───────────────────────────────────
  const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches

  // ── Barra de progreso ───────────────────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => {
      setProgress(p => {
        if (p >= 100) { clearInterval(id); return 100 }
        const inc = p < 60 ? Math.random() * 14 : Math.random() * 5
        return Math.min(p + inc, 100)
      })
    }, 180)
    return () => clearInterval(id)
  }, [])

  // ── Redirección cuando termina ─────────────────────────────────────────────
  useEffect(() => {
    if (progress < 100 || done.current) return
    done.current = true

    const go = (path: string) => {
      if (!isDark) {
        document.documentElement.style.background = '#F5F4F3'
        document.body.style.background = '#F5F4F3'
      }
      setFadeOut(true)
      setTimeout(() => navigate(path, { replace: true }), 650)
    }

    // Timeout de seguridad: si Supabase no responde en 3s, manda al home igual
    const fallback = setTimeout(() => go('/home'), 3000)

    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        clearTimeout(fallback)
        // Si hay sesión: si hay internet va al chat, si no hay internet va a campo
        const target = session?.user 
          ? (navigator.onLine ? '/chat' : '/campo') 
          : '/home'
        go(target)
      })
      .catch(() => {
        clearTimeout(fallback)
        go('/home')
      })
  }, [progress, navigate])

  /* ── Tokens de color ─────────────────────────────────────────────────────── */
  const bg         = isDark ? '#0c0a09' : '#F5F4F3'
  const textCorner = isDark ? '#57534e' : '#a8a29e'
  const titleColor = isDark ? '#fafaf9' : '#171717'
  const subColor   = isDark ? '#78716c' : '#a8a29e'
  const countColor = isDark ? '#78716c' : '#a8a29e'
  const countSufx  = isDark ? '#44403c' : '#d6d3d1'
  const progBg     = isDark ? 'rgba(47,175,143,0.4)' : 'rgba(47,175,143,0.3)'
  const glowColor  = isDark
    ? 'radial-gradient(ellipse 55% 45% at 50% 52%, rgba(47,175,143,0.12) 0%, transparent 70%)'
    : 'radial-gradient(ellipse 55% 45% at 50% 52%, rgba(47,175,143,0.10) 0%, transparent 70%)'

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500&display=swap');

        .sp-root  { font-family: 'Geist', system-ui, sans-serif; -webkit-font-smoothing: antialiased; }
        .sp-serif { font-family: 'Instrument Serif', Georgia, serif; }

        @keyframes sp-fade-in  { from{opacity:0} to{opacity:1} }
        @keyframes sp-up       { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes sp-layers-b { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-2px)} }
        @keyframes sp-layers-m { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-1.2px)} }
        @keyframes sp-layers-t { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-0.5px)} }
        @keyframes sp-logo-in  {
          0%  { opacity:0; transform:scale(0.88) }
          60% { opacity:1; transform:scale(1.02) }
          100%{ opacity:1; transform:scale(1) }
        }
        @keyframes sp-glow {
          0%,100%{ opacity:0.4; transform:scale(1) }
          50%    { opacity:0.7; transform:scale(1.08) }
        }
        @keyframes sp-noise {
          0%  { transform:translate(0,0) }    20%{ transform:translate(-1%,-1%) }
          40% { transform:translate(1%,-2%) } 60%{ transform:translate(-2%,1%) }
          80% { transform:translate(2%,2%) }  100%{ transform:translate(0,0) }
        }

        .sp-logo-wrap { animation: sp-logo-in  900ms cubic-bezier(.16,1,.3,1) 200ms both; }
        .sp-layer-b   { animation: sp-layers-b 3.6s ease-in-out 1.2s infinite; }
        .sp-layer-m   { animation: sp-layers-m 3.6s ease-in-out 1.5s infinite; }
        .sp-layer-t   { animation: sp-layers-t 3.6s ease-in-out 1.8s infinite; }
        .sp-title     { animation: sp-up 700ms cubic-bezier(.16,1,.3,1) 500ms both; }
        .sp-sub       { animation: sp-up 700ms cubic-bezier(.16,1,.3,1) 680ms both; }
        .sp-bottom    { animation: sp-up 700ms cubic-bezier(.16,1,.3,1) 820ms both; }
        .sp-glow-anim { animation: sp-glow 4s ease-in-out 1s infinite; }
        .sp-noise {
          position:absolute; inset:-20%; width:140%; height:140%;
          background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
          background-size:180px 180px;
          animation:sp-noise 8s steps(1) infinite;
          pointer-events:none; opacity:0.25;
        }
      `}</style>

      <div
        className="sp-root fixed inset-0 z-50 overflow-hidden"
        style={{
          background:    bg,
          opacity:       fadeOut ? 0 : 1,
          pointerEvents: fadeOut ? 'none' : 'auto',
          transition:    'opacity 650ms cubic-bezier(.4,0,.2,1)',
        }}
      >
        <div className="sp-noise" />

        <div className="sp-glow-anim absolute inset-0 pointer-events-none" style={{ background: glowColor }} />

        {/* Top-left */}
        <div className="absolute top-8 left-8" style={{ animation: 'sp-fade-in 600ms ease 300ms both' }}>
          <p className="sp-root text-[10px] font-medium tracking-[0.2em] uppercase" style={{ color: textCorner }}>
            Sistema Institucional
          </p>
        </div>

        {/* Top-right */}
        <div className="absolute top-8 right-8" style={{ animation: 'sp-fade-in 600ms ease 400ms both' }}>
          <p className="sp-root text-[10px] font-medium tracking-[0.2em] uppercase" style={{ color: textCorner }}>
            v7.0
          </p>
        </div>

        {/* Centro */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-6">
          <div className="sp-logo-wrap relative">
            <div className="absolute inset-0 pointer-events-none" style={{
              background: 'radial-gradient(circle, rgba(47,175,143,0.25) 0%, transparent 65%)',
              filter: 'blur(18px)', transform: 'scale(2.5)',
            }} />
            <svg width="52" height="52" viewBox="0 0 24 24" fill="none"
              stroke="#2FAF8F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
              className="relative"
            >
              <g className="sp-layer-b"><path d="M2 17l10 5 10-5" /></g>
              <g className="sp-layer-m"><path d="M2 12l10 5 10-5" /></g>
              <g className="sp-layer-t"><path d="M12 2L2 7l10 5 10-5-10-5z" /></g>
            </svg>
          </div>

          <div className="text-center">
            <h1 className="sp-title sp-serif italic leading-none tracking-tight"
              style={{ fontSize: 'clamp(3rem,8vw,5rem)', color: titleColor }}>
              GANDIA <span style={{ color: '#2FAF8F' }}>7</span>
            </h1>
            <p className="sp-sub sp-root text-[11px] tracking-[0.22em] uppercase mt-3 font-medium"
              style={{ color: subColor }}>
              Trazabilidad Ganadera
            </p>
          </div>
        </div>

        {/* Bottom */}
        <div className="sp-bottom absolute bottom-0 left-0 right-0 px-8 pb-8 flex items-end justify-between">
          <p className="sp-serif italic text-[13px]" style={{ color: subColor }}>
            Inicializando sistema
          </p>
          <p className="sp-serif italic text-[13px] tabular-nums" style={{ color: countColor }}>
            {Math.round(progress)}<span style={{ color: countSufx }}>%</span>
          </p>
        </div>

        {/* Progress line */}
        <div className="absolute bottom-0 left-0 h-0.5" style={{
          width: `${progress}%`,
          background: `linear-gradient(90deg, ${progBg} 0%, #2FAF8F 100%)`,
          transition: 'width 200ms ease-out',
          boxShadow: '0 0 8px rgba(47,175,143,0.6)',
        }} />
      </div>
    </>
  )
}

export default Splash