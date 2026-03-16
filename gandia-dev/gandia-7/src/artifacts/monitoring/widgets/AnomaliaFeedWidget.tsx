/**
 * AnomaliaFeedWidget — REDISEÑO v2
 * Sin fondos de color en badges. Negro real. Clean.
 */
export interface Anomalia {
  id:        number
  ts:        string
  animal:    string
  corral:    string
  tipo:      string
  severidad: 'alta' | 'media'
  resuelto:  boolean
}

interface Props {
  anomalias:         Anomalia[]
  onSelectAnomalia?: (a: Anomalia) => void
}

export default function AnomaliaFeedWidget({ anomalias, onSelectAnomalia }: Props) {
  const activas   = anomalias.filter(a => !a.resuelto)
  const resueltas = anomalias.filter(a =>  a.resuelto)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexShrink: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#F0F0F0', margin: 0 }}>Anomalías</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {activas.length > 0 && (
            /* Badge: solo texto con color, sin fondo */
            <span style={{ fontSize: 11, color: '#E5484D', fontWeight: 600 }}>
              {activas.length} activa{activas.length > 1 ? 's' : ''}
            </span>
          )}
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#555' }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#2FAF8F', animation: 'apulse 2s ease-in-out infinite' }} />
            En vivo
          </span>
        </div>
      </div>

      {/* Feed */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>

        {activas.map(a => {
          const color = a.severidad === 'alta' ? '#E5484D' : '#F5A623'
          return (
            <div key={a.id} onClick={() => onSelectAnomalia?.(a)} style={{
              background: '#171717',
              border: '1px solid #252525',
              borderLeft: `3px solid ${color}`,
              borderRadius: 9,
              padding: '10px 12px',
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#1C1C1C' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#171717' }}>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: color, animation: 'apulse 1.5s ease-in-out infinite', flexShrink: 0 }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#F0F0F0' }}>{a.corral}</span>
                  {/* Severidad: solo texto con color, sin fondo */}
                  <span style={{ fontSize: 10, color, fontWeight: 600 }}>
                    · {a.severidad}
                  </span>
                </div>
                <span style={{ fontSize: 10, color: '#555' }}>{a.ts}</span>
              </div>

              <p style={{ fontSize: 12, color: '#CCC', margin: '0 0 3px', lineHeight: 1.4 }}>{a.tipo}</p>
              <p style={{ fontSize: 10, color: '#555', margin: 0 }}>Animal {a.animal}</p>
            </div>
          )
        })}

        {resueltas.length > 0 && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '6px 0 2px' }}>
              <span style={{ flex: 1, height: 1, background: '#222' }} />
              <span style={{ fontSize: 10, color: '#444' }}>Resueltas hoy</span>
              <span style={{ flex: 1, height: 1, background: '#222' }} />
            </div>
            {resueltas.map(a => (
              <div key={a.id} style={{
                background: '#111',
                border: '1px solid #1E1E1E',
                borderRadius: 9,
                padding: '9px 12px',
                opacity: 0.5,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#2FAF8F" strokeWidth="2.5" strokeLinecap="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    <span style={{ fontSize: 11, color: '#555', fontWeight: 600 }}>{a.corral}</span>
                  </div>
                  <span style={{ fontSize: 10, color: '#444' }}>{a.ts}</span>
                </div>
                <p style={{ fontSize: 11, color: '#444', margin: 0 }}>{a.tipo}</p>
              </div>
            ))}
          </>
        )}

        {anomalias.length === 0 && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, paddingTop: 40 }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1.5" strokeLinecap="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <p style={{ fontSize: 12, color: '#444', margin: 0 }}>Sin anomalías hoy</p>
          </div>
        )}
      </div>

      <style>{`@keyframes apulse{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
    </div>
  )
}