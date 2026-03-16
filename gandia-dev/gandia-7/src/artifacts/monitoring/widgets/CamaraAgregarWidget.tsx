/**
 * CamaraAgregarWidget — REDISEÑO PRO
 */
import { useState } from 'react'
import type { Corral } from './MapaVistaGeneralWidget'

export interface NuevaCamara { label: string; corral: string; url: string; fps: number; alertas: boolean }

interface Props {
  corrales:    Corral[]
  onGuardar?:  (data: NuevaCamara) => void
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

const FPS_OPTIONS = [12, 18, 24, 30]

export default function CamaraAgregarWidget({ corrales, onGuardar, onCancelar }: Props) {
  const [form, setForm] = useState<NuevaCamara>({ label: '', corral: '', url: '', fps: 24, alertas: true })
  const [saved, setSaved] = useState(false)
  const valid = form.label.trim() && form.corral && form.url.trim()

  const handleGuardar = () => {
    if (!valid) return
    setSaved(true)
    setTimeout(() => { onGuardar?.(form); setSaved(false) }, 1200)
  }

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
            background: 'transparent',
            border: '1px solid #2FAF8F',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2FAF8F" strokeWidth="1.75" strokeLinecap="round">
              <path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2"/>
            </svg>
          </div>
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#F0F0F0', margin: 0 }}>Nueva cámara</p>
            <p style={{ fontSize: 10, color: '#666666', margin: '2px 0 0', fontFamily: 'ui-monospace, monospace' }}>Registrar en UPP Rancho Morales</p>
          </div>
        </div>
        {onCancelar && (
          <button onClick={onCancelar} style={{
            padding: '6px 12px', borderRadius: 7,
            background: '#191919', border: '1px solid #222222',
            color: '#777777', fontSize: 10, cursor: 'pointer',
          }}>
            Cancelar
          </button>
        )}
      </div>

      {/* Form */}
      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <label style={labelStyle}>NOMBRE DE LA CÁMARA</label>
          <input
            value={form.label}
            onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
            placeholder="Ej. CAM-07"
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
            <option value="">Seleccionar corral...</option>
            {corrales.map(c => (
              <option key={c.id} value={c.label}>{c.label} — {c.animales} animales</option>
            ))}
          </select>
        </div>

        <div>
          <label style={labelStyle}>URL / IP DEL STREAM</label>
          <input
            value={form.url}
            onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
            placeholder="rtsp://192.168.1.x:554/stream"
            style={inputStyle}
            onFocus={e => { e.currentTarget.style.borderColor = 'rgba(47,175,143,0.35)' }}
            onBlur={e => { e.currentTarget.style.borderColor = '#222222' }}
          />
        </div>

        <div>
          <label style={labelStyle}>FRECUENCIA DE ANÁLISIS (FPS)</label>
          <div style={{ display: 'flex', gap: 6 }}>
            {FPS_OPTIONS.map(fps => (
              <button
                key={fps}
                onClick={() => setForm(f => ({ ...f, fps }))}
                style={{
                  flex: 1, padding: '8px',
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

        {/* Toggle */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: '#0D0D0D', border: '1px solid #191919', borderRadius: 10, padding: '10px 12px',
        }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#F0F0F0', margin: '0 0 2px' }}>Detección de anomalías</p>
            <p style={{ fontSize: 10, color: '#666666', margin: 0, fontFamily: 'ui-monospace, monospace' }}>La IA alertará sobre comportamientos inusuales</p>
          </div>
          <button
            onClick={() => setForm(f => ({ ...f, alertas: !f.alertas }))}
            style={{
              width: 40, height: 22, borderRadius: 11,
              background: form.alertas ? '#2FAF8F' : '#222222',
              border: 'none', cursor: 'pointer', position: 'relative',
              transition: 'background 0.2s', flexShrink: 0,
            }}
          >
            <span style={{
              position: 'absolute', top: 3,
              left: form.alertas ? 21 : 3,
              width: 16, height: 16, borderRadius: '50%',
              background: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
              transition: 'left 0.2s',
            }} />
          </button>
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: '10px 16px', borderTop: '1px solid #191919', display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={handleGuardar}
          disabled={!valid || saved}
          style={{
            padding: '9px 20px', borderRadius: 9,
            background: valid && !saved ? '#2FAF8F' : '#191919',
            border: valid && !saved ? 'none' : '1px solid #222222',
            color: valid && !saved ? 'white' : '#555555',
            fontSize: 11, fontWeight: 700,
            cursor: valid && !saved ? 'pointer' : 'default',
            transition: 'all 0.15s',
            fontFamily: 'ui-monospace, monospace',
            letterSpacing: '0.03em',
          }}
          onMouseEnter={e => { if (valid && !saved) e.currentTarget.style.background = '#27A07F' }}
          onMouseLeave={e => { if (valid && !saved) e.currentTarget.style.background = '#2FAF8F' }}
        >
          {saved ? '✓ REGISTRADO' : 'REGISTRAR CÁMARA'}
        </button>
      </div>
    </div>
  )
}