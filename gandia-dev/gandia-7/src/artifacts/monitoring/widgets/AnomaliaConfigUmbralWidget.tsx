/**
 * AnomaliaConfigUmbralWidget — REDISEÑO PRO
 */
import { useState } from 'react'

interface Umbral {
  id:        string
  label:     string
  desc:      string
  valor:     string
  severidad: 'alta' | 'media'
  activo:    boolean
}

const UMBRALES_DEFAULT: Umbral[] = [
  { id: 'separacion',  label: 'Separación del hato',       desc: 'Animal a más de X metros del grupo',      valor: '15 m',    severidad: 'alta',  activo: true },
  { id: 'postura',     label: 'Postura caída',              desc: 'Animal sin movimiento detectado por',     valor: '20 min',  severidad: 'alta',  activo: true },
  { id: 'ingesta',     label: 'Sin ingesta',                desc: 'Sin acercarse al comedero en más de',     valor: '4 hrs',   severidad: 'media', activo: true },
  { id: 'temperatura', label: 'Temperatura corporal alta',  desc: 'Temperatura estimada mayor a',            valor: '39.5°C',  severidad: 'media', activo: true },
]

interface Props {
  onGuardar?: (umbrales: Umbral[]) => void
}

const Toggle = ({ value, onChange }: { value: boolean; onChange: () => void }) => (
  <button
    onClick={onChange}
    style={{
      width: 38, height: 20, borderRadius: 10,
      background: value ? '#2FAF8F' : '#222222',
      border: 'none', cursor: 'pointer', position: 'relative',
      transition: 'background 0.2s',
      flexShrink: 0,
    }}
  >
    <span style={{
      position: 'absolute', top: 2,
      left: value ? 20 : 2,
      width: 16, height: 16,
      borderRadius: '50%',
      background: 'white',
      boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
      transition: 'left 0.2s',
    }} />
  </button>
)

export default function AnomaliaConfigUmbralWidget({ onGuardar }: Props) {
  const [umbrales, setUmbrales] = useState(UMBRALES_DEFAULT)
  const [editando, setEditando] = useState<string | null>(null)
  const [saved, setSaved]       = useState(false)

  const toggle = (id: string) => setUmbrales(u => u.map(um => um.id === id ? { ...um, activo: !um.activo } : um))
  const update = (id: string, valor: string) => setUmbrales(u => u.map(um => um.id === id ? { ...um, valor } : um))
  const save   = () => {
    setSaved(true)
    setTimeout(() => { onGuardar?.(umbrales); setSaved(false) }, 1200)
  }

  return (
    <div style={{
      background: '#111111',
      border: '1px solid #222222',
      borderRadius: 14,
      overflow: 'hidden',
      fontFamily: 'system-ui, sans-serif',
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid #191919',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#F0F0F0', margin: 0 }}>
            Umbrales de alerta
          </p>
          <p style={{ fontSize: 10, color: '#666666', margin: '3px 0 0', fontFamily: 'ui-monospace, monospace' }}>
            La IA dispara alertas al superar estos valores
          </p>
        </div>
        <button
          onClick={save}
          style={{
            padding: '7px 16px',
            borderRadius: 8,
            background: saved ? 'rgba(47,175,143,0.15)' : '#2FAF8F',
            border: saved ? '1px solid rgba(47,175,143,0.3)' : 'none',
            color: saved ? '#2FAF8F' : 'white',
            fontSize: 11, fontWeight: 700, cursor: 'pointer',
            transition: 'all 0.2s',
            fontFamily: 'ui-monospace, monospace',
            letterSpacing: '0.03em',
          }}
        >
          {saved ? '✓ GUARDADO' : 'GUARDAR'}
        </button>
      </div>

      {/* Rows */}
      {umbrales.map((u, i) => {
        const isAlta  = u.severidad === 'alta'
        const color   = isAlta ? '#E5484D' : '#F5A623'
        const isLast  = i === umbrales.length - 1
        return (
          <div
            key={u.id}
            style={{
              padding: '12px 16px',
              borderBottom: isLast ? 'none' : '1px solid #161616',
              display: 'flex', alignItems: 'center', gap: 12,
              opacity: u.activo ? 1 : 0.4,
              transition: 'opacity 0.2s',
            }}
          >
            {/* Severity dot */}
            <span style={{
              width: 7, height: 7, borderRadius: '50%',
              background: color,
              boxShadow: u.activo && isAlta ? `0 0 6px ${color}` : 'none',
              flexShrink: 0,
            }} />

            {/* Label */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: '#F0F0F0', margin: '0 0 2px' }}>{u.label}</p>
              <p style={{ fontSize: 10, color: '#666666', margin: 0, fontFamily: 'ui-monospace, monospace' }}>{u.desc}</p>
            </div>

            {/* Value editor */}
            {editando === u.id ? (
              <input
                defaultValue={u.valor}
                autoFocus
                onChange={e => update(u.id, e.target.value)}
                onBlur={() => setEditando(null)}
                onKeyDown={e => e.key === 'Enter' && setEditando(null)}
                style={{
                  width: 80, padding: '5px 9px',
                  borderRadius: 7,
                  border: `1px solid rgba(47,175,143,0.4)`,
                  background: 'transparent',
                  color: '#2FAF8F', fontSize: 12, fontWeight: 700,
                  outline: 'none', textAlign: 'center',
                  fontFamily: 'ui-monospace, monospace',
                }}
              />
            ) : (
              <button
                onClick={() => setEditando(u.id)}
                style={{
                  padding: '5px 12px',
                  borderRadius: 7,
                  background: '#191919',
                  border: '1px solid #222222',
                  color: '#F0F0F0',
                  fontSize: 12, fontWeight: 700,
                  cursor: 'pointer', minWidth: 72, textAlign: 'center',
                  fontFamily: 'ui-monospace, monospace',
                  transition: 'border-color 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(47,175,143,0.35)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#222222' }}
              >
                {u.valor}
              </button>
            )}

            {/* Severity badge */}
            <span style={{
              fontSize: 8, fontWeight: 700,
              background: `${color}12`,
              color,
              border: `1px solid ${color}25`,
              borderRadius: 5,
              padding: '3px 7px',
              flexShrink: 0,
              fontFamily: 'ui-monospace, monospace',
              letterSpacing: '0.06em',
            }}>
              {u.severidad.toUpperCase()}
            </span>

            <Toggle value={u.activo} onChange={() => toggle(u.id)} />
          </div>
        )
      })}

      {/* Footer warning */}
      <div style={{
        padding: '10px 16px',
        borderTop: '1px solid #191919',
        background: 'transparent',
        display: 'flex', alignItems: 'flex-start', gap: 8,
      }}>
        <span style={{ fontSize: 11, flexShrink: 0 }}>⚠️</span>
        <p style={{ fontSize: 10, color: '#8a7a3a', margin: 0, lineHeight: 1.5, fontFamily: 'ui-monospace, monospace' }}>
          Cambios en umbrales afectan la sensibilidad del sistema. Ajustar con criterio veterinario.
        </p>
      </div>
    </div>
  )
}