/**
 * ConfigCorralesWidget — REDISEÑO PRO
 */
import { useState } from 'react'
import type { Corral } from './MapaVistaGeneralWidget'

interface Props {
  corrales:     Corral[]
  onEditar?:    (c: Corral) => void
  onBaja?:      (id: number) => void
  onNuevaZona?: () => void
}

const E = {
  normal:     { dot: '#2FAF8F', bg: 'rgba(47,175,143,0.08)',  border: 'rgba(47,175,143,0.2)',  txt: '#2FAF8F', label: 'NORMAL'     },
  atencion:   { dot: '#F5A623', bg: 'rgba(245,166,35,0.08)',  border: 'rgba(245,166,35,0.22)', txt: '#F5A623', label: 'ATENCIÓN'   },
  cuarentena: { dot: '#E5484D', bg: 'rgba(229,72,77,0.08)',   border: 'rgba(229,72,77,0.22)',  txt: '#E5484D', label: 'CUARENTENA' },
}

export default function ConfigCorralesWidget({ corrales, onEditar, onBaja, onNuevaZona }: Props) {
  const [confirmBaja, setConfirmBaja] = useState<number | null>(null)

  return (
    <div style={{
      background: '#111111',
      border: '1px solid #222222',
      borderRadius: 14, overflow: 'hidden',
      height: '100%', display: 'flex', flexDirection: 'column',
      fontFamily: 'system-ui, sans-serif',
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px', borderBottom: '1px solid #191919',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#F0F0F0', margin: 0 }}>Zonas y corrales</p>
          <p style={{ fontSize: 10, color: '#666666', margin: '2px 0 0', fontFamily: 'ui-monospace, monospace' }}>
            {corrales.length} corrales registrados
          </p>
        </div>
        <button
          onClick={onNuevaZona}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '7px 13px', borderRadius: 8,
            background: '#2FAF8F', border: 'none',
            color: 'white', fontSize: 11, fontWeight: 700,
            cursor: 'pointer', transition: 'background 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#27A07F' }}
          onMouseLeave={e => { e.currentTarget.style.background = '#2FAF8F' }}
        >
          <span style={{ fontSize: 15, lineHeight: 1, fontWeight: 300 }}>+</span>
          Nueva zona
        </button>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {corrales.map((c, i) => {
          const col    = E[c.estado]
          const pct    = Math.round(c.animales / c.capacidad * 100)
          const isLast = i === corrales.length - 1
          return (
            <div key={c.id} style={{
              padding: '11px 16px',
              borderBottom: isLast ? 'none' : '1px solid #161616',
              display: 'flex', alignItems: 'center', gap: 12,
              transition: 'background 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = '#151515' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
            >
              {/* Corral badge */}
              <div style={{
                width: 38, height: 38, borderRadius: 9, flexShrink: 0,
                background: col.bg, border: `1px solid ${col.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: col.txt, fontFamily: 'ui-monospace, monospace' }}>{c.label}</span>
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#F0F0F0', margin: 0, fontFamily: 'ui-monospace, monospace' }}>
                    Corral {c.label}
                  </p>
                  <span style={{
                    fontSize: 8, fontWeight: 700,
                    background: col.bg, color: col.txt, border: `1px solid ${col.border}`,
                    borderRadius: 4, padding: '2px 6px',
                    fontFamily: 'ui-monospace, monospace', letterSpacing: '0.06em',
                  }}>
                    {col.label}
                  </span>
                </div>
                <p style={{ fontSize: 10, color: '#666666', margin: '0 0 5px', fontFamily: 'ui-monospace, monospace' }}>
                  Cap. {c.capacidad} · {c.camara ? '● Cámara activa' : 'Sin cámara'}
                </p>
                {/* Ocupación bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ flex: 1, maxWidth: 80, height: 3, background: '#191919', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: `${pct}%`,
                      background: col.dot, borderRadius: 2,
                      transition: 'width 0.8s ease',
                    }} />
                  </div>
                  <span style={{ fontSize: 9, color: '#666666', fontFamily: 'ui-monospace, monospace' }}>{pct}%</span>
                </div>
              </div>

              {/* Animal count */}
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <p style={{ fontSize: 20, fontWeight: 800, color: '#F0F0F0', lineHeight: 1, margin: '0 0 2px', fontFamily: 'ui-monospace, monospace' }}>
                  {c.animales}
                </p>
                <p style={{ fontSize: 9, color: '#555555', margin: 0, fontFamily: 'ui-monospace, monospace' }}>animales</p>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                {confirmBaja === c.id ? (
                  <>
                    <button
                      onClick={() => { onBaja?.(c.id); setConfirmBaja(null) }}
                      style={{ padding: '5px 10px', borderRadius: 7, background: '#E5484D', border: 'none', color: 'white', fontSize: 10, cursor: 'pointer', fontFamily: 'ui-monospace, monospace' }}
                    >
                      Confirmar
                    </button>
                    <button
                      onClick={() => setConfirmBaja(null)}
                      style={{ padding: '5px 10px', borderRadius: 7, background: '#191919', border: '1px solid #222222', color: '#777777', fontSize: 10, cursor: 'pointer' }}
                    >
                      No
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => onEditar?.(c)}
                      style={{
                        padding: '6px 11px', borderRadius: 7,
                        background: '#191919', border: '1px solid #222222',
                        color: '#777777', fontSize: 10, cursor: 'pointer',
                        transition: 'all 0.15s',
                        fontFamily: 'ui-monospace, monospace',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(47,175,143,0.3)'; e.currentTarget.style.color = '#2FAF8F' }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = '#222222'; e.currentTarget.style.color = '#777777' }}
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => setConfirmBaja(c.id)}
                      style={{
                        padding: '6px 11px', borderRadius: 7,
                        background: 'transparent',
                        border: '1px solid #E5484D',
                        color: '#E5484D', fontSize: 10, cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(229,72,77,0.12)' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(229,72,77,0.06)' }}
                    >
                      Baja
                    </button>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}