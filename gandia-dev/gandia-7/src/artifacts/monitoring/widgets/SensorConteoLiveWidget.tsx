/**
 * SensorConteoLiveWidget — REDISEÑO PRO
 */
interface SensorStat {
  corral:      string
  detectados:  number
  inventario:  number
  match:       number
  activo:      boolean
}

interface Props {
  stats:                SensorStat[]
  ultimaActualizacion?: string
}

export default function SensorConteoLiveWidget({ stats, ultimaActualizacion = 'hace 2 min' }: Props) {
  const activos     = stats.filter(s => s.activo)
  const totalDetect = stats.reduce((s, c) => s + c.detectados, 0)
  const totalInvent = stats.reduce((s, c) => s + c.inventario, 0)
  const matchGlobal = activos.length > 0
    ? Math.round(activos.reduce((s, c) => s + c.match, 0) / activos.length) : 0
  const matchColor  = matchGlobal === 100 ? '#2FAF8F' : matchGlobal >= 90 ? '#F5A623' : '#E5484D'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontFamily: 'system-ui, sans-serif' }}>

      {/* Top metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
        {[
          { label: 'DETECTADO',  value: totalDetect, accent: '#2FAF8F' },
          { label: 'INVENTARIO', value: totalInvent, accent: '#F0F0F0' },
          { label: 'MATCH GLOBAL', value: `${matchGlobal}%`, accent: matchColor },
        ].map((s, i) => (
          <div key={i} style={{
            background: '#171717',
            border: '1px solid #222222',
            borderRadius: 12,
            padding: '12px 16px',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${s.accent}50, transparent)` }} />
            <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.08em', color: '#555555', marginBottom: 6, fontFamily: 'ui-monospace, monospace' }}>
              {s.label}
            </div>
            <div style={{ fontSize: 30, fontWeight: 800, lineHeight: 1, color: s.accent, fontFamily: 'ui-monospace, monospace', letterSpacing: '-0.02em' }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{
        background: '#171717',
        border: '1px solid #222222',
        borderRadius: 12,
        overflow: 'hidden',
      }}>
        {/* Table header */}
        <div style={{
          display: 'grid', gridTemplateColumns: '60px 1fr 80px 50px',
          gap: 8, padding: '10px 16px',
          borderBottom: '1px solid #191919',
          alignItems: 'center',
        }}>
          <span style={{ fontSize: 8, fontWeight: 700, color: '#555555', letterSpacing: '0.08em', fontFamily: 'ui-monospace, monospace' }}>CORRAL</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 8, fontWeight: 700, color: '#555555', letterSpacing: '0.08em', fontFamily: 'ui-monospace, monospace' }}>MATCH</span>
          </div>
          <span style={{ fontSize: 8, fontWeight: 700, color: '#555555', letterSpacing: '0.08em', textAlign: 'center', fontFamily: 'ui-monospace, monospace' }}>DET / INV</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#2FAF8F', animation: 'sensorPulse 2s ease-in-out infinite' }} />
            <span style={{ fontSize: 8, color: '#555555', fontFamily: 'ui-monospace, monospace' }}>%</span>
          </div>
        </div>

        {stats.map((s, i) => {
          const barColor  = s.match === 100 ? '#2FAF8F' : s.match >= 90 ? '#F5A623' : '#E5484D'
          const txtColor  = s.activo ? barColor : '#555555'
          const isLast    = i === stats.length - 1
          return (
            <div key={i} style={{
              display: 'grid',
              gridTemplateColumns: '60px 1fr 80px 50px',
              gap: 8,
              padding: '11px 16px',
              borderBottom: isLast ? 'none' : '1px solid #161616',
              alignItems: 'center',
              opacity: s.activo ? 1 : 0.4,
              transition: 'background 0.15s',
            }}
              onMouseEnter={e => { if (s.activo) e.currentTarget.style.background = '#151515' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
            >
              <span style={{
                fontSize: 11, fontWeight: 700,
                color: s.activo ? '#F0F0F0' : '#555555',
                fontFamily: 'ui-monospace, monospace',
              }}>
                {s.corral}
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  flex: 1, height: 4,
                  background: '#191919',
                  borderRadius: 4, overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%', width: `${s.match}%`,
                    background: barColor,
                    borderRadius: 4,
                    boxShadow: s.match === 100 ? `0 0 6px ${barColor}60` : 'none',
                    transition: 'width 1s ease',
                  }} />
                </div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: 11, color: '#F0F0F0', fontFamily: 'ui-monospace, monospace', fontWeight: 700 }}>{s.detectados}</span>
                <span style={{ fontSize: 10, color: '#555555', fontFamily: 'ui-monospace, monospace' }}> / {s.inventario}</span>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: txtColor, fontFamily: 'ui-monospace, monospace' }}>
                  {s.activo ? `${s.match}%` : '—'}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* AI status */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        background: 'transparent',
        border: '1px solid #222',
        borderRadius: 10,
        padding: '10px 14px',
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 9,
          background: 'transparent',
          border: '1px solid #2FAF8F',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2FAF8F" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 2v3m0 14v3M2 12h3m14 0h3"/>
          </svg>
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#2FAF8F', margin: '0 0 2px', fontFamily: 'ui-monospace, monospace', letterSpacing: '0.03em' }}>
            AI PERCEPTION v7.4
          </p>
          <p style={{ fontSize: 10, color: '#666666', margin: 0, fontFamily: 'ui-monospace, monospace' }}>
            Precisión: 98.2% · Act. {ultimaActualizacion}
            {stats.filter(s => !s.activo).length > 0 && (
              <span style={{ color: '#F5A623' }}> · {stats.filter(s => !s.activo).length} corral(es) sin cobertura</span>
            )}
          </p>
        </div>
        <div style={{
          fontSize: 9, fontWeight: 700,
          background: 'transparent',
          color: '#2FAF8F',
          border: '1px solid #2FAF8F',
          borderRadius: 5,
          padding: '3px 8px',
          fontFamily: 'ui-monospace, monospace',
          letterSpacing: '0.06em',
        }}>
          ACTIVO
        </div>
      </div>

      <style>{`
        @keyframes sensorPulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
      `}</style>
    </div>
  )
}