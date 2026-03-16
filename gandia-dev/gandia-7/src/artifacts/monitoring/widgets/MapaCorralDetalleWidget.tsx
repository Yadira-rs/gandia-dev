/**
 * MapaCorralDetalleWidget — REDISEÑO PRO
 */
import type { Corral } from './MapaVistaGeneralWidget'

interface Props {
  corral:       Corral
  onVerCamara?: () => void
  onClose?:     () => void
}

const E = {
  normal:     { dot: '#2FAF8F', label: 'NORMAL',     bg: 'rgba(47,175,143,0.08)',  border: 'rgba(47,175,143,0.20)', txt: '#2FAF8F'   },
  atencion:   { dot: '#F5A623', label: 'ATENCIÓN',   bg: 'rgba(245,166,35,0.08)',  border: 'rgba(245,166,35,0.22)', txt: '#F5A623'   },
  cuarentena: { dot: '#E5484D', label: 'CUARENTENA', bg: 'rgba(229,72,77,0.08)',   border: 'rgba(229,72,77,0.22)',  txt: '#E5484D'   },
}

export function MapaCorralDetalleWidget({ corral, onVerCamara, onClose }: Props) {
  const col     = E[corral.estado]
  const ocupPct = Math.round(corral.animales / corral.capacidad * 100)

  return (
    <div style={{
      background: '#111111',
      border: `1px solid ${col.border}`,
      borderLeft: `3px solid ${col.dot}`,
      borderRadius: 14, overflow: 'hidden',
      fontFamily: 'system-ui, sans-serif',
      position: 'relative',
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, ${col.dot}30, transparent)` }} />

      {/* Header */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #191919', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 9,
            background: col.bg, border: `1px solid ${col.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: col.txt, fontFamily: 'ui-monospace, monospace' }}>{corral.label}</span>
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#F0F0F0', margin: 0 }}>Corral {corral.label}</p>
            <p style={{ fontSize: 10, color: '#666666', margin: '2px 0 0', fontFamily: 'ui-monospace, monospace' }}>UPP RANCHO MORALES</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: 8, fontWeight: 700,
            background: col.bg, color: col.txt, border: `1px solid ${col.border}`,
            borderRadius: 5, padding: '3px 8px',
            fontFamily: 'ui-monospace, monospace', letterSpacing: '0.06em',
          }}>
            {col.label}
          </span>
          {onClose && (
            <button onClick={onClose} style={{
              width: 26, height: 26, borderRadius: 7,
              background: '#191919', border: '1px solid #222222',
              color: '#666666', cursor: 'pointer', fontSize: 11,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s',
            }}>✕</button>
          )}
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)' }}>
        {[
          { label: 'ANIMALES',    value: corral.animales,      sub: `cap. ${corral.capacidad}`, color: corral.animales > corral.capacidad * 0.9 ? '#F5A623' : '#F0F0F0' },
          { label: 'TEMPERATURA', value: `${corral.temp}°C`,   sub: 'sensor ambiental',         color: corral.temp > 24 ? '#F5A623' : '#F0F0F0' },
          { label: 'HUMEDAD',     value: `${corral.humedad}%`, sub: 'relativa',                 color: '#F0F0F0' },
        ].map((s, i) => (
          <div key={i} style={{
            padding: '12px 16px',
            borderRight: i < 2 ? '1px solid #161616' : 'none',
          }}>
            <p style={{ fontSize: 8, fontWeight: 700, color: '#555555', letterSpacing: '0.08em', margin: '0 0 5px', fontFamily: 'ui-monospace, monospace' }}>{s.label}</p>
            <p style={{ fontSize: 22, fontWeight: 800, color: s.color, lineHeight: 1, margin: '0 0 3px', fontFamily: 'ui-monospace, monospace' }}>{s.value}</p>
            <p style={{ fontSize: 9, color: '#555555', margin: 0, fontFamily: 'ui-monospace, monospace' }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Ocupación bar */}
      <div style={{ padding: '4px 16px 12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span style={{ fontSize: 9, color: '#666666', fontFamily: 'ui-monospace, monospace', letterSpacing: '0.05em' }}>OCUPACIÓN</span>
          <span style={{ fontSize: 10, fontWeight: 700, color: col.txt, fontFamily: 'ui-monospace, monospace' }}>{ocupPct}%</span>
        </div>
        <div style={{ height: 4, background: '#191919', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${ocupPct}%`,
            background: col.dot,
            borderRadius: 4,
            boxShadow: corral.estado !== 'normal' ? `0 0 8px ${col.dot}60` : 'none',
            transition: 'width 1s ease',
          }} />
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: '10px 16px', borderTop: '1px solid #191919', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: corral.camara ? '#2FAF8F' : '#555555' }} />
          <span style={{ fontSize: 10, color: corral.camara ? '#2FAF8F' : '#666666', fontFamily: 'ui-monospace, monospace' }}>
            {corral.camara ? 'Cámara activa' : 'Sin cámara'}
          </span>
        </div>
        {corral.camara && onVerCamara && (
          <button
            onClick={onVerCamara}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 13px', borderRadius: 8,
              background: '#2FAF8F', border: 'none',
              color: 'white', fontSize: 10, fontWeight: 700,
              cursor: 'pointer', transition: 'background 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#27A07F' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#2FAF8F' }}
          >
            Ver feed
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}

export default MapaCorralDetalleWidget