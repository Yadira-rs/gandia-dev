/**
 * MapaVistaGeneralWidget — REDISEÑO v2
 * Negro real, sin tintes verdes en fondos
 */
export interface Corral {
  id:        number
  label:     string
  animales:  number
  capacidad: number
  estado:    'normal' | 'atencion' | 'cuarentena'
  temp:      number
  humedad:   number
  camara:    boolean
  lat?:      number
  lng?:      number
}

interface Props {
  corrales:        Corral[]
  onSelectCorral?: (corral: Corral) => void
}

const E = {
  normal:     { dot: '#2FAF8F', label: 'Normal'     },
  atencion:   { dot: '#F5A623', label: 'Atención'   },
  cuarentena: { dot: '#E5484D', label: 'Cuarentena' },
}

const PIN_POS: Record<number, { top: string; left: string }> = {
  1: { top: '28%', left: '22%' }, 2: { top: '22%', left: '42%' },
  3: { top: '35%', left: '61%' }, 4: { top: '55%', left: '30%' },
  5: { top: '60%', left: '52%' }, 6: { top: '48%', left: '74%' },
}

export default function MapaVistaGeneralWidget({ corrales, onSelectCorral }: Props) {
  const total    = corrales.reduce((s, c) => s + c.animales, 0)
  const cap      = corrales.reduce((s, c) => s + c.capacidad, 0)
  const pctOcup  = cap > 0 ? Math.round(total / cap * 100) : 0
  const alertas  = corrales.filter(c => c.estado !== 'normal').length
  const normales = corrales.filter(c => c.estado === 'normal').length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, height: '100%', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* Stats bar — negro limpio */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
        {[
          { label: 'Animales',  value: total,          sub: `/ ${cap}`,            accent: '#F0F0F0' },
          { label: 'Ocupación', value: `${pctOcup}%`,  sub: 'capacidad total',     accent: pctOcup > 90 ? '#F5A623' : '#F0F0F0' },
          { label: 'Alertas',   value: alertas,        sub: 'corrales',            accent: alertas > 0 ? '#E5484D' : '#F0F0F0' },
          { label: 'Activos',   value: normales,       sub: `de ${corrales.length}`, accent: '#F0F0F0' },
        ].map((s, i) => (
          <div key={i} style={{
            background: '#171717',
            border: '1px solid #252525',
            borderRadius: 10,
            padding: '10px 14px',
          }}>
            <div style={{ fontSize: 10, color: '#555', marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, lineHeight: 1, color: s.accent, fontFamily: 'ui-monospace, monospace' }}>{s.value}</div>
            <div style={{ fontSize: 10, color: '#444', marginTop: 3 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Map */}
      <div style={{ flex: 1, borderRadius: 12, overflow: 'hidden', position: 'relative', border: '1px solid #252525', minHeight: 240 }}>
        <iframe
          title="Mapa UPP"
          width="100%" height="100%"
          style={{ display: 'block', border: 'none', filter: 'saturate(0.6) brightness(0.7)' }}
          src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d8000!2d-104.6!3d24.15!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e1!3m2!1ses!2smx!4v1700000000000!5m2!1ses!2smx"
          allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade"
        />
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', boxShadow: 'inset 0 0 40px rgba(0,0,0,0.5)' }} />

        {/* Pins */}
        {corrales.map(c => {
          const pos = PIN_POS[c.id]
          const col = E[c.estado]
          if (!pos) return null
          const pct = Math.round(c.animales / c.capacidad * 100)
          return (
            <div key={c.id} onClick={() => onSelectCorral?.(c)}
              style={{ position: 'absolute', top: pos.top, left: pos.left, transform: 'translate(-50%, -100%)', cursor: 'pointer', zIndex: 10, transition: 'transform 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translate(-50%, -100%) scale(1.1)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translate(-50%, -100%) scale(1)' }}>
              <div style={{
                background: 'rgba(10,10,10,0.92)',
                border: `1.5px solid ${col.dot}`,
                borderRadius: 7,
                padding: '5px 10px',
                display: 'flex', alignItems: 'center', gap: 6,
                whiteSpace: 'nowrap',
                backdropFilter: 'blur(8px)',
              }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: col.dot, flexShrink: 0,
                  animation: c.estado !== 'normal' ? 'mpulse 1.5s ease-in-out infinite' : 'none',
                }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: '#F0F0F0', fontFamily: 'ui-monospace, monospace' }}>{c.label}</span>
                <span style={{ fontSize: 10, color: col.dot, fontFamily: 'ui-monospace, monospace', fontWeight: 600 }}>{c.animales}</span>
                <span style={{ fontSize: 9, color: '#777', fontFamily: 'ui-monospace, monospace' }}>{pct}%</span>
              </div>
              <div style={{ width: 0, height: 0, margin: '0 auto', marginTop: -1, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: `6px solid ${col.dot}` }} />
            </div>
          )
        })}

        {/* Live badge */}
        <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 20, display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(10,10,10,0.88)', backdropFilter: 'blur(10px)', border: '1px solid #2A2A2A', borderRadius: 7, padding: '6px 12px' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2FAF8F', animation: 'mpulse 2s ease-in-out infinite' }} />
          <span style={{ fontSize: 10, fontWeight: 600, color: '#F0F0F0', fontFamily: 'ui-monospace, monospace' }}>EN VIVO</span>
          <span style={{ fontSize: 9, color: '#555', fontFamily: 'ui-monospace, monospace' }}>UPP RANCHO MORALES</span>
        </div>

        {/* Legend */}
        <div style={{ position: 'absolute', bottom: 12, left: 12, zIndex: 20, display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(10,10,10,0.88)', backdropFilter: 'blur(10px)', border: '1px solid #2A2A2A', borderRadius: 7, padding: '6px 12px' }}>
          {Object.entries(E).map(([key, v]) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: v.dot }} />
              <span style={{ fontSize: 9, color: '#888' }}>{v.label}</span>
            </div>
          ))}
        </div>

        <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 20, background: 'rgba(10,10,10,0.88)', backdropFilter: 'blur(10px)', border: '1px solid #2A2A2A', borderRadius: 7, padding: '6px 12px' }}>
          <span style={{ fontSize: 9, color: '#555', fontFamily: 'ui-monospace, monospace' }}>{corrales.length} CORRALES</span>
        </div>
      </div>

      <style>{`@keyframes mpulse{0%,100%{opacity:1}50%{opacity:0.35}}`}</style>
    </div>
  )
}