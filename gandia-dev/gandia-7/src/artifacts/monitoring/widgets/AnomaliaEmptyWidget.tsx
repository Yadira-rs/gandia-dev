/**
 * AnomaliaEmptyWidget — Estado vacío del panel de anomalías.
 * Se muestra cuando no hay anomalías activas ni historial.
 */

interface Props {
  onRegistrar?: () => void
}

export default function AnomaliaEmptyWidget({ onRegistrar }: Props) {
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 14,
      background: '#111', border: '1px solid #1E1E1E', borderRadius: 14,
      padding: 32, minHeight: 200,
      fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: 13,
        background: 'rgba(47,175,143,0.06)', border: '1px solid rgba(47,175,143,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2FAF8F" strokeWidth="1.5" strokeLinecap="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </div>

      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: '#F0F0F0', margin: '0 0 5px' }}>
          Sin anomalías activas
        </p>
        <p style={{ fontSize: 11, color: '#555', margin: 0, fontFamily: 'monospace', lineHeight: 1.6 }}>
          El hato está dentro de parámetros normales.<br/>
          Puedes registrar una observación manual.
        </p>
      </div>

      {onRegistrar && (
        <button
          onClick={onRegistrar}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '9px 18px', borderRadius: 9,
            background: 'transparent', border: '1px solid #333',
            color: '#777', fontSize: 11, cursor: 'pointer',
            transition: 'all 0.15s', fontFamily: 'monospace',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(47,175,143,0.35)'; e.currentTarget.style.color = '#2FAF8F' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#333'; e.currentTarget.style.color = '#777' }}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Registrar anomalía manual
        </button>
      )}
    </div>
  )
}