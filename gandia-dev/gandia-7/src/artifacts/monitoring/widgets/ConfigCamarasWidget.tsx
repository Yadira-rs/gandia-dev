/**
 * ConfigCamarasWidget — REDISEÑO PRO
 */
import type { Camara } from './CamaraListaWidget'

interface Props {
  camaras:       Camara[]
  onConfigurar?: (cam: Camara) => void
  onAgregar?:    () => void
}

export default function ConfigCamarasWidget({ camaras, onConfigurar, onAgregar }: Props) {
  const online  = camaras.filter(c => c.estado === 'online').length
  const offline = camaras.length - online

  return (
    <div style={{
      background: '#111111',
      border: '1px solid #222222',
      borderRadius: 14,
      overflow: 'hidden',
      height: '100%',
      display: 'flex', flexDirection: 'column',
      fontFamily: 'system-ui, sans-serif',
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid #191919',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#F0F0F0', margin: 0 }}>Cámaras registradas</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
            <span style={{ fontSize: 10, color: '#2FAF8F', fontFamily: 'ui-monospace, monospace', fontWeight: 600 }}>● {online} online</span>
            {offline > 0 && <span style={{ fontSize: 10, color: '#E5484D', fontFamily: 'ui-monospace, monospace', fontWeight: 600 }}>● {offline} offline</span>}
          </div>
        </div>
        <button
          onClick={onAgregar}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '7px 13px',
            borderRadius: 8,
            background: '#2FAF8F',
            border: 'none',
            color: 'white',
            fontSize: 11, fontWeight: 700,
            cursor: 'pointer',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#27A07F' }}
          onMouseLeave={e => { e.currentTarget.style.background = '#2FAF8F' }}
        >
          <span style={{ fontSize: 15, lineHeight: 1, fontWeight: 300 }}>+</span>
          Agregar cámara
        </button>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {camaras.map((cam, i) => {
          const match    = cam.inventario > 0 ? Math.round(cam.detectados / cam.inventario * 100) : 0
          const isOnline = cam.estado === 'online'
          const matchC   = match === 100 ? '#2FAF8F' : '#F5A623'
          const isLast   = i === camaras.length - 1
          return (
            <div key={cam.id} style={{
              padding: '11px 16px',
              borderBottom: isLast ? 'none' : '1px solid #161616',
              display: 'flex', alignItems: 'center', gap: 12,
              opacity: isOnline ? 1 : 0.5,
              transition: 'background 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = '#151515' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
            >
              {/* Icon */}
              <div style={{
                width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                background: '#111',
                border: '1px solid #222',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke={isOnline ? '#2FAF8F' : '#555555'} strokeWidth="1.75" strokeLinecap="round">
                  <path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2"/>
                </svg>
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#F0F0F0', margin: '0 0 3px', fontFamily: 'ui-monospace, monospace' }}>
                  {cam.label}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 10, color: '#666666', fontFamily: 'ui-monospace, monospace' }}>Corral {cam.corral}</span>
                  {isOnline && (
                    <>
                      <span style={{ color: '#222222' }}>·</span>
                      <span style={{ fontSize: 10, color: '#666666', fontFamily: 'ui-monospace, monospace' }}>{cam.fps} fps</span>
                      <span style={{ color: '#222222' }}>·</span>
                      <span style={{ fontSize: 10, color: matchC, fontFamily: 'ui-monospace, monospace', fontWeight: 600 }}>{match}% match</span>
                    </>
                  )}
                  {!isOnline && (
                    <span style={{ fontSize: 10, color: '#E5484D', fontFamily: 'ui-monospace, monospace', fontWeight: 600 }}>Sin señal</span>
                  )}
                </div>
              </div>

              {/* Status badge */}
              <span style={{
                fontSize: 8, fontWeight: 700,
                background: isOnline ? 'rgba(47,175,143,0.08)' : 'rgba(229,72,77,0.08)',
                color: isOnline ? '#2FAF8F' : '#E5484D',
                border: `1px solid ${isOnline ? 'rgba(47,175,143,0.2)' : 'rgba(229,72,77,0.2)'}`,
                borderRadius: 5, padding: '3px 7px', flexShrink: 0,
                fontFamily: 'ui-monospace, monospace', letterSpacing: '0.06em',
              }}>
                {cam.estado.toUpperCase()}
              </span>

              <button
                onClick={() => onConfigurar?.(cam)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 7,
                  background: '#191919',
                  border: '1px solid #222222',
                  color: '#909090',
                  fontSize: 10, cursor: 'pointer', flexShrink: 0,
                  transition: 'all 0.15s',
                  fontFamily: 'ui-monospace, monospace',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(47,175,143,0.3)'; e.currentTarget.style.color = '#2FAF8F' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#222222'; e.currentTarget.style.color = '#909090' }}
              >
                Config
              </button>
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div style={{
        padding: '8px 16px',
        borderTop: '1px solid #191919',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 9, color: '#555555', fontFamily: 'ui-monospace, monospace' }}>
          {camaras.length} cámara{camaras.length !== 1 ? 's' : ''} · AI Perception v7.4
        </span>
        <span style={{ fontSize: 9, color: '#666666', fontFamily: 'ui-monospace, monospace' }}>
          {online}/{camaras.length} activas
        </span>
      </div>
    </div>
  )
}