/**
 * AnomaliaRegistrarWidget — Formulario para registrar anomalía manual.
 * Guarda directo a Supabase via callback del padre.
 */

import { useState } from 'react'
import type { DBCorral } from '../monitoreoService'

// ─── TIPOS ────────────────────────────────────────────────────────────────────

export interface NuevaAnomalia {
  corral_id: string
  tipo:      string
  severidad: 'alta' | 'media' | 'baja'
  fuente:    'manual'
  notas?:    string
}

interface Props {
  corrales:   DBCorral[]
  onGuardar:  (data: NuevaAnomalia) => Promise<void>
  onCancelar: () => void
}

// ─── CONSTANTES ───────────────────────────────────────────────────────────────

const TIPOS = [
  'Separación del hato',
  'Postura caída',
  'Sin ingesta registrada',
  'Movimiento reducido',
  'Temperatura elevada',
  'Herida sospechosa',
  'Faltante RFID',
  'Sobrepoblación',
  'Otro',
]

// ─── COMPONENTE ───────────────────────────────────────────────────────────────

export default function AnomaliaRegistrarWidget({ corrales, onGuardar, onCancelar }: Props) {
  const [corralId,  setCorralId]  = useState(corrales[0]?.id ?? '')
  const [tipo,      setTipo]      = useState(TIPOS[0])
  const [severidad, setSeveridad] = useState<'alta' | 'media' | 'baja'>('media')
  const [notas,     setNotas]     = useState('')
  const [saving,    setSaving]    = useState(false)

  const sColor = severidad === 'alta' ? '#E5484D' : severidad === 'media' ? '#F5A623' : '#2FAF8F'

  const handleSave = async () => {
    if (!corralId) return
    setSaving(true)
    await onGuardar({ corral_id: corralId, tipo, severidad, fuente: 'manual', notas: notas.trim() || undefined })
    setSaving(false)
  }

  return (
    <div style={{
      background: '#111', border: '1px solid #1E1E1E',
      borderRadius: 14, overflow: 'hidden',
      fontFamily: 'system-ui, sans-serif',
    }}>
      {/* Header */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #191919', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 7,
            background: 'rgba(229,72,77,0.1)', border: '1px solid rgba(229,72,77,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#E5484D" strokeWidth="2" strokeLinecap="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
          </div>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#F0F0F0', margin: 0 }}>Registrar anomalía manual</p>
        </div>
        <button onClick={onCancelar} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>✕</button>
      </div>

      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 13 }}>

        {/* Corral */}
        <div>
          <p style={{ fontSize: 9, fontWeight: 700, color: '#555', letterSpacing: '0.07em', margin: '0 0 6px', fontFamily: 'monospace' }}>CORRAL</p>
          <select
            value={corralId}
            onChange={e => setCorralId(e.target.value)}
            style={{ width: '100%', padding: '8px 10px', borderRadius: 9, border: '1px solid #222', background: '#0D0D0D', color: '#F0F0F0', fontSize: 12, outline: 'none', cursor: 'pointer' }}
          >
            {corrales.map(c => <option key={c.id} value={c.id}>{c.label} — {c.animales} animales</option>)}
          </select>
        </div>

        {/* Tipo */}
        <div>
          <p style={{ fontSize: 9, fontWeight: 700, color: '#555', letterSpacing: '0.07em', margin: '0 0 6px', fontFamily: 'monospace' }}>TIPO DE ANOMALÍA</p>
          <select
            value={tipo}
            onChange={e => setTipo(e.target.value)}
            style={{ width: '100%', padding: '8px 10px', borderRadius: 9, border: '1px solid #222', background: '#0D0D0D', color: '#F0F0F0', fontSize: 12, outline: 'none', cursor: 'pointer' }}
          >
            {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {/* Severidad */}
        <div>
          <p style={{ fontSize: 9, fontWeight: 700, color: '#555', letterSpacing: '0.07em', margin: '0 0 6px', fontFamily: 'monospace' }}>SEVERIDAD</p>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['baja', 'media', 'alta'] as const).map(s => {
              const c = s === 'alta' ? '#E5484D' : s === 'media' ? '#F5A623' : '#2FAF8F'
              const sel = severidad === s
              return (
                <button
                  key={s}
                  onClick={() => setSeveridad(s)}
                  style={{
                    flex: 1, padding: '8px', borderRadius: 8, cursor: 'pointer',
                    fontSize: 10, fontWeight: 700, fontFamily: 'monospace', textTransform: 'uppercase',
                    border: sel ? `1px solid ${c}` : '1px solid #222',
                    background: sel ? `${c}12` : '#191919',
                    color: sel ? c : '#555',
                    transition: 'all 0.15s',
                  }}
                >
                  {s}
                </button>
              )
            })}
          </div>
        </div>

        {/* Notas */}
        <div>
          <p style={{ fontSize: 9, fontWeight: 700, color: '#555', letterSpacing: '0.07em', margin: '0 0 6px', fontFamily: 'monospace' }}>NOTAS (opcional)</p>
          <textarea
            value={notas}
            onChange={e => setNotas(e.target.value)}
            rows={3}
            placeholder="Describe lo que observaste: animal, ubicación, comportamiento…"
            style={{
              width: '100%', padding: '9px 11px', borderRadius: 9,
              border: '1px solid #222', background: '#0D0D0D', color: '#F0F0F0',
              fontSize: 12, lineHeight: 1.6, outline: 'none', resize: 'none',
              boxSizing: 'border-box', fontFamily: 'system-ui, sans-serif',
              transition: 'border-color 0.15s',
            }}
            onFocus={e => { e.currentTarget.style.borderColor = `${sColor}50` }}
            onBlur={e => { e.currentTarget.style.borderColor = '#222' }}
          />
        </div>

        {/* Acciones */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 2 }}>
          <button
            onClick={onCancelar}
            style={{ padding: '8px 16px', borderRadius: 8, background: '#191919', border: '1px solid #222', color: '#666', fontSize: 11, cursor: 'pointer', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#AAA' }}
            onMouseLeave={e => { e.currentTarget.style.color = '#666' }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !corralId}
            style={{
              padding: '8px 20px', borderRadius: 8,
              background: saving ? 'rgba(47,175,143,0.15)' : '#2FAF8F',
              border: saving ? '1px solid rgba(47,175,143,0.3)' : 'none',
              color: saving ? '#2FAF8F' : 'white',
              fontSize: 11, fontWeight: 700,
              cursor: saving || !corralId ? 'default' : 'pointer',
              fontFamily: 'monospace', letterSpacing: '0.03em',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { if (!saving && corralId) e.currentTarget.style.background = '#27A07F' }}
            onMouseLeave={e => { if (!saving && corralId) e.currentTarget.style.background = '#2FAF8F' }}
          >
            {saving ? '✓ GUARDANDO…' : 'REGISTRAR'}
          </button>
        </div>
      </div>
    </div>
  )
}