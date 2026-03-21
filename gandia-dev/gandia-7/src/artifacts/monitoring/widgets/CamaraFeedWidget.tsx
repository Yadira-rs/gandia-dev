/**
 * CamaraFeedWidget — REDISEÑO PRO
 * Si no recibe `camara`, fetcha la primera online de Supabase.
 */
import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import type { Camara } from './CamaraListaWidget'

interface Props { camara?: Camara }

const BOXES = [
  [8,28,9,28],[20,36,8,26],[34,26,10,32],
  [50,33,9,27],[64,28,11,30],[79,36,8,24]
]

export default function CamaraFeedWidget({ camara: camaraProp }: Props) {
  const [fetched, setFetched] = useState<Camara | null>(null)
  const [loaded,  setLoaded]  = useState(false)

  useEffect(() => {
    if (camaraProp) return
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { setLoaded(true); return }
      const { data: rancho } = await supabase.from('ranch_extended_profiles').select('id').eq('user_id', session.user.id).single()
      if (!rancho) { setLoaded(true); return }
      const { data: corrales } = await supabase.from('corrales').select('id, label').eq('rancho_id', rancho.id)
      const { data: cams } = await supabase.from('camaras').select('*').eq('rancho_id', rancho.id)
      if (cams && cams.length > 0) {
        const c = (cams as Record<string,unknown>[]).find(x => x.estado === 'online') ?? (cams as Record<string,unknown>[])[0]
        const corral = corrales?.find((cr: Record<string,unknown>) => cr.id === c.corral_id)
        setFetched({ id: 1, label: c.label as string, corral: (corral as Record<string,unknown>)?.label as string ?? '—', estado: c.estado as 'online'|'offline', detectados: (c.detectados as number) ?? 0, inventario: (c.inventario as number) ?? 0, fps: (c.fps_analisis as number) ?? 24 })
      }
      setLoaded(true)
    }
    load()
  }, [camaraProp])

  const camara = camaraProp ?? fetched

  if (!camaraProp && !loaded) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:180, background:'#111', border:'1px solid #1E1E1E', borderRadius:14 }}>
      <div style={{ width:20, height:20, border:'2px solid #2FAF8F', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (!camara) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:10, height:180, background:'#111', border:'1px solid #1E1E1E', borderRadius:14 }}>
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1.5" strokeLinecap="round">
        <path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2"/>
        <line x1="1" y1="1" x2="23" y2="23"/>
      </svg>
      <p style={{ fontSize:12, color:'#444', margin:0 }}>Sin cámaras registradas</p>
    </div>
  )

  const match      = camara.inventario > 0 ? Math.round(camara.detectados / camara.inventario * 100) : 0
  const diferencia = Math.abs(camara.detectados - camara.inventario)
  const matchColor = match === 100 ? '#2FAF8F' : match >= 90 ? '#F5A623' : '#E5484D'

  if (camara.estado === 'offline') {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', gap: 12,
        fontFamily: 'system-ui, sans-serif',
      }}>
        {/* Offline viewport */}
        <div style={{
          width: '100%', aspectRatio: '16/9', maxHeight: 340,
          borderRadius: 14,
          background: '#0D0D0D',
          border: '1px solid #222222',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 12,
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Noise texture simulation */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.04\'/%3E%3C/svg%3E")',
            opacity: 0.4,
          }} />

          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: 'transparent',
            border: '1px solid #E5484D',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#E5484D" strokeWidth="1.5" strokeLinecap="round">
              <line x1="1" y1="1" x2="23" y2="23"/>
              <path d="M21 21H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3m3-3h6l2 3h4a2 2 0 0 1 2 2v9.34"/>
            </svg>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#E5484D', fontFamily: 'ui-monospace, monospace', letterSpacing: '0.04em', margin: 0 }}>
              SIN SEÑAL
            </p>
            <p style={{ fontSize: 11, color: '#666666', marginTop: 4, fontFamily: 'ui-monospace, monospace', margin: '4px 0 0' }}>
              {camara.label} · Verificar conexión
            </p>
          </div>

          {/* Corner brackets */}
          {[
            { top: 12, left: 12,   borderTop: '2px solid rgba(229,72,77,0.3)', borderLeft: '2px solid rgba(229,72,77,0.3)' },
            { top: 12, right: 12,  borderTop: '2px solid rgba(229,72,77,0.3)', borderRight: '2px solid rgba(229,72,77,0.3)' },
            { bottom: 12, left: 12,  borderBottom: '2px solid rgba(229,72,77,0.3)', borderLeft: '2px solid rgba(229,72,77,0.3)' },
            { bottom: 12, right: 12, borderBottom: '2px solid rgba(229,72,77,0.3)', borderRight: '2px solid rgba(229,72,77,0.3)' },
          ].map((s, i) => (
            <div key={i} style={{ position: 'absolute', width: 16, height: 16, ...s }} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontFamily: 'system-ui, sans-serif' }}>

      {/* ── Main viewport ── */}
      <div style={{
        width: '100%', aspectRatio: '16/9', maxHeight: 340,
        borderRadius: 14, overflow: 'hidden',
        position: 'relative',
        background: '#080A09',
        border: '1px solid #222222',
      }}>
        <img
          src="https://images.unsplash.com/photo-1545468800-85cc9bc6ecf7?auto=format&fit=crop&q=80&w=1200"
          alt="camera feed"
          style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'saturate(0.4) contrast(1.15) brightness(0.6)' }}
        />

        {/* Scanlines overlay */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'repeating-linear-gradient(transparent 0, transparent 2px, rgba(0,0,0,0.06) 2px, rgba(0,0,0,0.06) 3px)',
          mixBlendMode: 'overlay',
        }} />

        {/* Vignette */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.55) 100%)',
        }} />

        {/* AI Bounding boxes */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
          {BOXES.slice(0, Math.min(camara.detectados, 6)).map(([x,y,w,h], i) => (
            <g key={i}>
              {/* Corner brackets instead of full rect */}
              <line x1={`${x}%`}         y1={`${y}%`}       x2={`${x+1.5}%`}   y2={`${y}%`}       stroke="rgba(47,175,143,0.8)" strokeWidth="1.5"/>
              <line x1={`${x}%`}         y1={`${y}%`}       x2={`${x}%`}       y2={`${y+3}%`}     stroke="rgba(47,175,143,0.8)" strokeWidth="1.5"/>
              <line x1={`${x+w-1.5}%`}   y1={`${y}%`}       x2={`${x+w}%`}     y2={`${y}%`}       stroke="rgba(47,175,143,0.8)" strokeWidth="1.5"/>
              <line x1={`${x+w}%`}       y1={`${y}%`}       x2={`${x+w}%`}     y2={`${y+3}%`}     stroke="rgba(47,175,143,0.8)" strokeWidth="1.5"/>
              <line x1={`${x}%`}         y1={`${y+h}%`}     x2={`${x+1.5}%`}   y2={`${y+h}%`}     stroke="rgba(47,175,143,0.8)" strokeWidth="1.5"/>
              <line x1={`${x}%`}         y1={`${y+h-3}%`}   x2={`${x}%`}       y2={`${y+h}%`}     stroke="rgba(47,175,143,0.8)" strokeWidth="1.5"/>
              <line x1={`${x+w-1.5}%`}   y1={`${y+h}%`}     x2={`${x+w}%`}     y2={`${y+h}%`}     stroke="rgba(47,175,143,0.8)" strokeWidth="1.5"/>
              <line x1={`${x+w}%`}       y1={`${y+h-3}%`}   x2={`${x+w}%`}     y2={`${y+h}%`}     stroke="rgba(47,175,143,0.8)" strokeWidth="1.5"/>
              {/* Label */}
              <rect x={`${x}%`} y={`calc(${y}% - 16px)`} width="24" height="13" fill="rgba(47,175,143,0.85)" rx="3"/>
              <text x={`calc(${x}% + 4px)`} y={`calc(${y}% - 5px)`} fontSize="8" fill="white" fontFamily="monospace" fontWeight="600">
                #{String(i+1).padStart(2,'0')}
              </text>
            </g>
          ))}

          {/* Crosshair center */}
          <line x1="49%" y1="46%" x2="51%" y2="46%" stroke="rgba(255,255,255,0.25)" strokeWidth="1"/>
          <line x1="50%" y1="45%" x2="50%" y2="47%" stroke="rgba(255,255,255,0.25)" strokeWidth="1"/>
          <circle cx="50%" cy="46%" r="1.5%" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5"/>
        </svg>

        {/* Top-left: camera badge */}
        <div style={{
          position: 'absolute', top: 12, left: 12,
          display: 'flex', alignItems: 'center', gap: 7,
          background: 'rgba(8,10,9,0.8)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 8,
          padding: '5px 10px',
        }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#E5484D', boxShadow: '0 0 6px #E5484D', animation: 'camPulse 1.5s ease-in-out infinite', flexShrink: 0 }} />
          <span style={{ fontSize: 9, fontWeight: 700, color: '#F0F0F0', fontFamily: 'ui-monospace, monospace', letterSpacing: '0.06em' }}>
            {camara.label}
          </span>
          <span style={{ fontSize: 9, color: '#666666', fontFamily: 'ui-monospace, monospace' }}>
            CORRAL {camara.corral}
          </span>
        </div>

        {/* Top-right: fps badge */}
        <div style={{
          position: 'absolute', top: 12, right: 12,
          background: 'rgba(8,10,9,0.8)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 8,
          padding: '5px 10px',
        }}>
          <span style={{ fontSize: 9, color: '#666666', fontFamily: 'ui-monospace, monospace', letterSpacing: '0.04em' }}>
            {camara.fps} FPS · AI v7.4
          </span>
        </div>

        {/* Bottom: AI count */}
        <div style={{
          position: 'absolute', bottom: 12, right: 12,
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'rgba(8,10,9,0.85)',
          backdropFilter: 'blur(10px)',
          border: `1px solid ${matchColor}30`,
          borderRadius: 8,
          padding: '6px 12px',
        }}>
          <span style={{ fontSize: 9, color: '#666666', fontFamily: 'ui-monospace, monospace' }}>DETECT</span>
          <span style={{ fontSize: 18, fontWeight: 800, color: matchColor, fontFamily: 'ui-monospace, monospace', lineHeight: 1 }}>{camara.detectados}</span>
          <span style={{ width: 1, height: 16, background: '#222222' }} />
          <span style={{ fontSize: 9, color: '#666666', fontFamily: 'ui-monospace, monospace' }}>MATCH</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: matchColor, fontFamily: 'ui-monospace, monospace' }}>{match}%</span>
        </div>
      </div>

      {/* ── Metrics row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
        {[
          { k: 'DETECTADOS',   v: camara.detectados, c: '#2FAF8F' },
          { k: 'INVENTARIO',   v: camara.inventario, c: '#F0F0F0' },
          { k: 'COINCIDENCIA', v: `${match}%`,       c: matchColor },
          { k: 'DIFERENCIA',   v: diferencia,        c: diferencia === 0 ? '#2FAF8F' : '#E5484D' },
        ].map((m, i) => (
          <div key={i} style={{
            background: '#111111',
            border: '1px solid #222222',
            borderRadius: 10,
            padding: '10px 12px',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.08em', color: '#555555', fontFamily: 'ui-monospace, monospace', marginBottom: 4 }}>{m.k}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: m.c, fontFamily: 'ui-monospace, monospace', lineHeight: 1 }}>{m.v}</div>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: `${m.c}20` }} />
          </div>
        ))}
      </div>

      <style>{`
        @keyframes camPulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>
    </div>
  )
}