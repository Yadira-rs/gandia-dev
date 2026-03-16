/**
 * CamaraConfigWidget — REDISEÑO PRO
 */
import { useState } from 'react'
import type { Camara } from './CamaraListaWidget'
import type { Corral } from './MapaVistaGeneralWidget'

interface Props {
  camara:      Camara
  corrales:    Corral[]
  onGuardar?:  (cam: Camara) => void
  onEliminar?: (id: number) => void
  onCancelar?: () => void
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 11px',
  borderRadius: 9,
  border: '1px solid #222222',
  background: '#0D0D0D',
  color: '#F0F0F0', fontSize: 12,
  outline: 'none', boxSizing: 'border-box',
  fontFamily: 'system-ui, sans-serif',
  transition: 'border-color 0.15s',
}

const labelStyle: React.CSSProperties = {
  fontSize: 9, fontWeight: 700, letterSpacing: '0.08em',
  color: '#555555', display: 'block', marginBottom: 6,
  fontFamily: 'ui-monospace, monospace',
}

export function CamaraConfigWidget({ camara, corrales, onGuardar, onEliminar, onCancelar }: Props) {
  const [form,    setForm]    = useState({ ...camara })
  const [alertas, setAlertas] = useState(true)
  const [saved,   setSaved]   = useState(false)
  const [confirm, setConfirm] = useState(false)

  const save = () => {
    setSaved(true)
    setTimeout(() => { onGuardar?.(form); setSaved(false) }, 1100)
  }

  const isOnline = camara.estado === 'online'

  return (
    <div style={{
      background: '#111111',
      border: '1px solid #222222',
      borderRadius: 14, overflow: 'hidden',
      fontFamily: 'system-ui, sans-serif',
    }}>
      {/* Header */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #191919', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 9,
            background: '#191919', border: '1px solid #222222',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.75" strokeLinecap="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </div>
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#F0F0F0', margin: 0 }}>Configurar {camara.label}</p>
            <p style={{ fontSize: 10, color: '#666666', margin: '2px 0 0', fontFamily: 'ui-monospace, monospace' }}>
              Corral {camara.corral} · {camara.fps > 0 ? `${camara.fps} fps` : 'Sin señal'}
            </p>
          </div>
        </div>
        <span style={{
          fontSize: 8, fontWeight: 700,
          background: '#111',
          color: isOnline ? '#2FAF8F' : '#E5484D',
          border: '1px solid #252525',
          borderRadius: 5, padding: '3px 8px',
          fontFamily: 'ui-monospace, monospace', letterSpacing: '0.06em',
        }}>
          {camara.estado.toUpperCase()}
        </span>
      </div>

      {/* Form */}
      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>NOMBRE</label>
            <input
              value={form.label}
              onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
              style={inputStyle}
              onFocus={e => { e.currentTarget.style.borderColor = 'rgba(47,175,143,0.35)' }}
              onBlur={e => { e.currentTarget.style.borderColor = '#222222' }}
            />
          </div>
          <div>
            <label style={labelStyle}>CORRAL ASIGNADO</label>
            <select
              value={form.corral}
              onChange={e => setForm(f => ({ ...f, corral: e.target.value }))}
              style={{ ...inputStyle, cursor: 'pointer' }}
            >
              {corrales.map(c => <option key={c.id} value={c.label}>{c.label}</option>)}
            </select>
          </div>
        </div>

        {/* FPS */}
        <div>
          <label style={labelStyle}>FPS DE ANÁLISIS</label>
          <div style={{ display: 'flex', gap: 6 }}>
            {[12,18,24,30].map(fps => (
              <button
                key={fps}
                onClick={() => setForm(f => ({ ...f, fps }))}
                style={{
                  flex: 1, padding: '7px',
                  borderRadius: 8,
                  border: `1px solid ${form.fps === fps ? 'rgba(47,175,143,0.4)' : '#222222'}`,
                  background: form.fps === fps ? 'rgba(47,175,143,0.08)' : '#1A1A1A',
                  color: form.fps === fps ? '#2FAF8F' : '#777777',
                  fontSize: 11, fontWeight: form.fps === fps ? 700 : 500,
                  cursor: 'pointer', transition: 'all 0.15s',
                  fontFamily: 'ui-monospace, monospace',
                }}
              >
                {fps}
              </button>
            ))}
          </div>
        </div>

        {/* Anomaly detection toggle */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: '#0D0D0D', border: '1px solid #191919', borderRadius: 10, padding: '10px 12px',
        }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#F0F0F0', margin: '0 0 2px' }}>Detección de anomalías</p>
            <p style={{ fontSize: 10, color: '#666666', margin: 0, fontFamily: 'ui-monospace, monospace' }}>Alertas automáticas por comportamiento</p>
          </div>
          <button
            onClick={() => setAlertas(a => !a)}
            style={{
              width: 40, height: 22, borderRadius: 11,
              background: alertas ? '#2FAF8F' : '#222222',
              border: 'none', cursor: 'pointer', position: 'relative',
              transition: 'background 0.2s', flexShrink: 0,
            }}
          >
            <span style={{
              position: 'absolute', top: 3,
              left: alertas ? 21 : 3,
              width: 16, height: 16, borderRadius: '50%',
              background: 'white',
              boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
              transition: 'left 0.2s',
            }} />
          </button>
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: '10px 16px', borderTop: '1px solid #191919', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {!confirm ? (
          <button
            onClick={() => setConfirm(true)}
            style={{
              padding: '6px 12px', borderRadius: 7,
              background: 'transparent',
              border: '1px solid #E5484D',
              color: '#E5484D', fontSize: 10, cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(229,72,77,0.06)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
          >
            Eliminar
          </button>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 10, color: '#E5484D', fontFamily: 'ui-monospace, monospace' }}>¿Confirmar?</span>
            <button onClick={() => { onEliminar?.(camara.id); setConfirm(false) }}
              style={{ padding: '5px 10px', borderRadius: 7, background: '#E5484D', border: 'none', color: 'white', fontSize: 10, cursor: 'pointer' }}>
              Sí
            </button>
            <button onClick={() => setConfirm(false)}
              style={{ padding: '5px 10px', borderRadius: 7, background: '#191919', border: '1px solid #222222', color: '#777777', fontSize: 10, cursor: 'pointer' }}>
              No
            </button>
          </div>
        )}

        <div style={{ display: 'flex', gap: 7 }}>
          {onCancelar && (
            <button onClick={onCancelar} style={{
              padding: '7px 13px', borderRadius: 8, background: '#191919',
              border: '1px solid #222222', color: '#777777', fontSize: 10, cursor: 'pointer',
            }}>
              Cancelar
            </button>
          )}
          <button onClick={save} style={{
            padding: '7px 16px', borderRadius: 8,
            background: saved ? 'rgba(47,175,143,0.1)' : '#2FAF8F',
            border: saved ? '1px solid rgba(47,175,143,0.3)' : 'none',
            color: saved ? '#2FAF8F' : 'white',
            fontSize: 10, fontWeight: 700, cursor: 'pointer',
            transition: 'all 0.2s',
            fontFamily: 'ui-monospace, monospace',
          }}>
            {saved ? '✓ GUARDADO' : 'GUARDAR'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default CamaraConfigWidget