import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

function Splash() {
  const [progress, setProgress]   = useState(0)
  const [phase, setPhase]         = useState<'in' | 'hold' | 'out'>('in')
  const navigate                  = useNavigate()

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setPhase('out')
          setTimeout(() => navigate('/home'), 700)
          return 100
        }
        const inc = prev < 60 ? Math.random() * 14 : Math.random() * 5
        return Math.min(prev + inc, 100)
      })
    }, 180)
    return () => clearInterval(interval)
  }, [navigate])

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500&display=swap');

        .sp-root { font-family: 'Geist', system-ui, sans-serif; -webkit-font-smoothing: antialiased; }
        .sp-serif { font-family: 'Instrument Serif', Georgia, serif; }

        @keyframes sp-fade-in  { from { opacity:0 } to { opacity:1 } }
        @keyframes sp-fade-out { from { opacity:1 } to { opacity:0 } }
        @keyframes sp-up       { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
        @keyframes sp-layers-b { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-2px)} }
        @keyframes sp-layers-m { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-1.2px)} }
        @keyframes sp-layers-t { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-0.5px)} }
        @keyframes sp-logo-in  {
          0%   { opacity:0; transform:scale(0.88) }
          60%  { opacity:1; transform:scale(1.02) }
          100% { opacity:1; transform:scale(1) }
        }
        @keyframes sp-glow {
          0%,100% { opacity:0.4; transform:scale(1) }
          50%     { opacity:0.7; transform:scale(1.08) }
        }
        @keyframes sp-line { from { width:0 } to { width:100% } }
        @keyframes sp-noise {
          0%   { transform:translate(0,0) }
          20%  { transform:translate(-1%,-1%) }
          40%  { transform:translate(1%,-2%) }
          60%  { transform:translate(-2%,1%) }
          80%  { transform:translate(2%,2%) }
          100% { transform:translate(0,0) }
        }

        .sp-logo-wrap { animation: sp-logo-in 900ms cubic-bezier(.16,1,.3,1) 200ms both; }
        .sp-layer-b   { animation: sp-layers-b 3.6s ease-in-out 1.2s infinite; }
        .sp-layer-m   { animation: sp-layers-m 3.6s ease-in-out 1.5s infinite; }
        .sp-layer-t   { animation: sp-layers-t 3.6s ease-in-out 1.8s infinite; }
        .sp-title     { animation: sp-up 700ms cubic-bezier(.16,1,.3,1) 500ms both; }
        .sp-sub       { animation: sp-up 700ms cubic-bezier(.16,1,.3,1) 680ms both; }
        .sp-bottom    { animation: sp-up 700ms cubic-bezier(.16,1,.3,1) 820ms both; }
        .sp-glow      { animation: sp-glow 4s ease-in-out 1s infinite; }
        .sp-noise {
          position: absolute; inset: -20%;
          width: 140%; height: 140%;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
          background-size: 180px 180px;
          animation: sp-noise 8s steps(1) infinite;
          pointer-events: none;
          opacity: 0.35;
        }
      `}</style>

      <div
        className="sp-root fixed inset-0 z-50 overflow-hidden"
        style={{
          background: '#0c0a09',
          opacity: phase === 'out' ? 0 : 1,
          transition: 'opacity 700ms cubic-bezier(.4,0,.2,1)',
        }}
      >
        {/* Noise grain */}
        <div className="sp-noise" />

        {/* Radial glow */}
        <div className="sp-glow absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse 55% 45% at 50% 52%, rgba(47,175,143,0.12) 0%, transparent 70%)',
        }} />

        {/* Top-left corner tag */}
        <div
          className="absolute top-8 left-8"
          style={{ animation: 'sp-fade-in 600ms ease 300ms both' }}
        >
          <p className="text-[10px] font-medium tracking-[0.2em] uppercase text-stone-600">
            Sistema Institucional
          </p>
        </div>

        {/* Top-right version tag */}
        <div
          className="absolute top-8 right-8"
          style={{ animation: 'sp-fade-in 600ms ease 400ms both' }}
        >
          <p className="text-[10px] font-medium tracking-[0.2em] uppercase text-stone-600">
            v7.0
          </p>
        </div>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-6">

          {/* Logo mark */}
          <div className="sp-logo-wrap relative">
            {/* Soft glow behind logo */}
            <div className="absolute inset-0 pointer-events-none" style={{
              background: 'radial-gradient(circle, rgba(47,175,143,0.25) 0%, transparent 65%)',
              filter: 'blur(18px)',
              transform: 'scale(2.5)',
            }} />
            <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#2FAF8F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="relative">
              <g className="sp-layer-b"><path d="M2 17l10 5 10-5"/></g>
              <g className="sp-layer-m"><path d="M2 12l10 5 10-5"/></g>
              <g className="sp-layer-t"><path d="M12 2L2 7l10 5 10-5-10-5z"/></g>
            </svg>
          </div>

          {/* Wordmark */}
          <div className="text-center">
            <h1 className="sp-title sp-serif italic text-[clamp(3rem,8vw,5rem)] leading-none tracking-tight text-stone-50">
              GANDIA <span style={{ color: '#2FAF8F' }}>7</span>
            </h1>
            <p className="sp-sub text-[11px] tracking-[0.22em] uppercase text-stone-500 mt-3 font-medium">
              Trazabilidad Ganadera
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="sp-bottom absolute bottom-0 left-0 right-0 px-8 pb-8 flex items-end justify-between">

          {/* Progress label */}
          <p className="sp-serif italic text-[13px] text-stone-600">
            Inicializando sistema
          </p>

          {/* Counter */}
          <p className="sp-serif italic text-[13px] text-stone-500 tabular-nums">
            {Math.round(progress)}<span className="text-stone-700">%</span>
          </p>
        </div>

        {/* Progress line */}
        <div
          className="absolute bottom-0 left-0 h-[2px]"
          style={{
            width: `${progress}%`,
            background: 'linear-gradient(90deg, rgba(47,175,143,0.4) 0%, #2FAF8F 100%)',
            transition: 'width 200ms ease-out',
            boxShadow: '0 0 8px rgba(47,175,143,0.6)',
          }}
        />
      </div>
    </>
  )
}

export default Splash