/**
 * ConfigDronesWidget — Configuración de drones y cobertura aérea.
 * Placeholder hasta que el módulo de vuelos esté listo.
 */

export default function ConfigDronesWidget() {
  return (
    <div style={{
      background: '#111', border: '1px solid #1E1E1E',
      borderRadius: 14, overflow: 'hidden',
      fontFamily: 'system-ui, sans-serif',
    }}>
      {/* Header */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #191919', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: 'rgba(47,175,143,0.08)', border: '1px solid rgba(47,175,143,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2FAF8F" strokeWidth="1.5" strokeLinecap="round">
            <path d="M12 2L8 6H4v4l-2 2 2 2v4h4l4 4 4-4h4v-4l2-2-2-2V6h-4L12 2z"/>
            <circle cx="12" cy="12" r="2"/>
          </svg>
        </div>
        <div>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#F0F0F0', margin: 0 }}>Drones y cobertura aérea</p>
          <p style={{ fontSize: 10, color: '#555', margin: '2px 0 0', fontFamily: 'monospace' }}>
            Integración con módulo de vuelos — próximamente
          </p>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{
          width: 64, height: 64, borderRadius: 16,
          background: 'rgba(47,175,143,0.05)', border: '1px solid rgba(47,175,143,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2FAF8F" strokeWidth="1.2" strokeLinecap="round">
            <path d="M12 2L8 6H4v4l-2 2 2 2v4h4l4 4 4-4h4v-4l2-2-2-2V6h-4L12 2z"/>
            <circle cx="12" cy="12" r="2.5"/>
          </svg>
        </div>

        <div style={{ textAlign: 'center', maxWidth: 340 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#F0F0F0', margin: '0 0 8px' }}>
            Módulo de Drones
          </p>
          <p style={{ fontSize: 11, color: '#555', margin: 0, lineHeight: 1.7, fontFamily: 'monospace' }}>
            Configura flotas de drones para vigilancia aérea del rancho, rutas automatizadas por potrero y análisis inteligente de hallazgos georreferenciados.
          </p>
        </div>

        {/* Feature list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 340 }}>
          {[
            { label: 'Registro de drones por UPP',                 soon: false },
            { label: 'Rutas de vuelo automatizadas',               soon: false },
            { label: 'Cobertura visual por corral / potrero',      soon: false },
            { label: 'Análisis georreferenciado de hallazgos',     soon: false },
            { label: 'Integración con anomalías sanitarias',       soon: false },
            { label: 'Exportación de evidencia para autoridades',  soon: false },
          ].map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#333', flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: '#444', flex: 1 }}>{f.label}</span>
              <span style={{ fontSize: 8, fontWeight: 700, color: '#444', fontFamily: 'monospace', letterSpacing: '0.06em' }}>
                PRONTO
              </span>
            </div>
          ))}
        </div>

        <div style={{
          marginTop: 8, padding: '10px 20px',
          background: 'rgba(47,175,143,0.04)', border: '1px solid rgba(47,175,143,0.1)',
          borderRadius: 10,
        }}>
          <p style={{ fontSize: 10, color: '#555', margin: 0, textAlign: 'center', fontFamily: 'monospace' }}>
            ¿Tienes drones en tu UPP? Escríbenos para acceso anticipado.
          </p>
        </div>
      </div>
    </div>
  )
}