/**
 * AnomaliaDetalleWidget — REDISEÑO v2
 */
import type { Anomalia } from './AnomaliaFeedWidget'

interface Props {
  anomalia:    Anomalia
  onResolver?: (id: number) => void
  onClose?:    () => void
}

const SENALES: Record<string, string[]> = {
  'Separación del hato':    ['Separación del hato', 'Postura caída', 'Movimiento reducido', 'Sin ingesta'],
  'Postura caída':          ['Postura caída', 'Sin movimiento >20min', 'Sin ingesta'],
  'Movimiento reducido':    ['Movimiento reducido', 'Velocidad baja'],
  'Sin ingesta registrada': ['Sin acercamiento >4h', 'Postura inactiva'],
  'Temperatura elevada':    ['Temp. >39.5°C', 'Jadeo', 'Búsqueda de sombra'],
}

export default function AnomaliaDetalleWidget({ anomalia, onResolver, onClose }: Props) {
  const isAlta  = anomalia.severidad === 'alta'
  const color   = isAlta ? '#E5484D' : '#F5A623'
  const senales = SENALES[anomalia.tipo] ?? [anomalia.tipo]

  return (
    <div style={{
      background: '#171717',
      border: '1px solid #252525',
      borderLeft: `3px solid ${color}`,
      borderRadius: 12, overflow: 'hidden',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      {/* Header */}
      <div style={{ padding: '12px 14px', borderBottom: '1px solid #202020', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0,
            animation: anomalia.resuelto ? 'none' : 'apulse 1.5s ease-in-out infinite',
          }} />
          <p style={{ fontSize: 13, fontWeight: 600, color: '#F0F0F0', margin: 0 }}>{anomalia.tipo}</p>
          {/* Severidad: texto con color, sin fondo */}
          <span style={{ fontSize: 11, color, fontWeight: 600 }}>· {anomalia.severidad}</span>
        </div>
        {onClose && (
          <button onClick={onClose} style={{
            width: 26, height: 26, borderRadius: 6,
            background: '#222', border: '1px solid #2E2E2E',
            color: '#666', cursor: 'pointer', fontSize: 11,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'color 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = '#F0F0F0' }}
          onMouseLeave={e => { e.currentTarget.style.color = '#666' }}>✕</button>
        )}
      </div>

      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Animal */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#111', border: '1px solid #1E1E1E', borderRadius: 9, padding: '10px 12px' }}>
          <div style={{ width: 42, height: 42, borderRadius: 8, overflow: 'hidden', flexShrink: 0, border: '1px solid #222', filter: 'grayscale(60%) brightness(0.65)' }}>
            <img src="https://images.unsplash.com/photo-1546445317-29f4545e9d53?q=80&w=200" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#F0F0F0', margin: '0 0 2px', fontFamily: 'ui-monospace, monospace' }}>Ejemplar {anomalia.animal}</p>
            <p style={{ fontSize: 10, color: '#555', margin: 0 }}>{anomalia.corral} · {anomalia.ts}</p>
          </div>
        </div>

        {/* Señales */}
        <div>
          <p style={{ fontSize: 10, fontWeight: 600, color: '#555', letterSpacing: '0.05em', textTransform: 'uppercase', margin: '0 0 8px' }}>Señales detectadas</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {senales.map((s, i) => (
              /* Tags: border de color, fondo transparente */
              <span key={i} style={{
                fontSize: 11, fontWeight: 500,
                background: 'transparent',
                color: '#CCC',
                border: `1px solid #333`,
                borderRadius: 5,
                padding: '4px 9px',
              }}>{s}</span>
            ))}
          </div>
        </div>

        {/* Recomendación */}
        <div style={{ background: '#111', border: '1px solid #222', borderLeft: '2px solid #2FAF8F', borderRadius: 9, padding: '10px 12px' }}>
          <p style={{ fontSize: 10, fontWeight: 600, color: '#2FAF8F', letterSpacing: '0.05em', textTransform: 'uppercase', margin: '0 0 5px' }}>Recomendación</p>
          <p style={{ fontSize: 12, color: '#AAA', margin: '0 0 4px', lineHeight: 1.6 }}>
            Revisión visual en los próximos 30 min. Si se confirma postración, contactar MVZ de guardia.
          </p>
          <p style={{ fontSize: 11, color: '#2FAF8F', margin: 0, fontStyle: 'italic' }}>La IA alerta. El humano decide.</p>
        </div>

        {/* CTA */}
        {!anomalia.resuelto && onResolver && (
          <button onClick={() => onResolver(anomalia.id)} style={{
            width: '100%', padding: '11px',
            borderRadius: 9, background: '#2FAF8F', border: 'none',
            color: 'white', fontSize: 12, fontWeight: 600,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '0.85' }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            Marcar como resuelta
          </button>
        )}

        {anomalia.resuelto && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '10px', background: '#111', border: '1px solid #222', borderRadius: 9 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2FAF8F" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
            <span style={{ fontSize: 12, color: '#2FAF8F', fontWeight: 600 }}>Anomalía resuelta</span>
          </div>
        )}
      </div>
      <style>{`@keyframes apulse{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
    </div>
  )
}