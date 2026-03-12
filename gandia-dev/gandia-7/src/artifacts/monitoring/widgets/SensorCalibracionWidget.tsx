/**
 * SensorCalibracionWidget — REDISEÑO PRO
 */
import { useState } from 'react'

interface Parametro {
  id:       string
  label:    string
  desc:     string
  valor:    string
  tag?:     string
  tagType?: 'ok' | 'warn' | 'error'
}

const PARAMS: Parametro[] = [
  { id: 'sensibilidad', label: 'Sensibilidad de detección',    desc: 'Agresividad del modelo al detectar',    valor: 'Alta',       tag: 'Recomendado', tagType: 'ok'    },
  { id: 'fps',          label: 'FPS mínimo de procesamiento',  desc: 'Frames por segundo mínimos',           valor: '18 fps'                                        },
  { id: 'confianza',    label: 'Confianza mínima',             desc: 'Score mínimo para contar detección',   valor: '0.72'                                          },
  { id: 'nocturno',     label: 'Modo nocturno',                desc: 'Modelo alternativo infrarojo',          valor: 'Automático', tag: 'Activo',     tagType: 'ok'    },
  { id: 'cobertura',    label: 'Cobertura C-06',               desc: 'CAM-06 offline · Sin cobertura visual', valor: 'Sin señal',  tag: 'Revisar',    tagType: 'error' },
]

const TAG = {
  ok:    { bg: 'rgba(47,175,143,0.1)',  color: '#2FAF8F', border: 'rgba(47,175,143,0.25)' },
  warn:  { bg: 'rgba(245,166,35,0.1)',  color: '#F5A623', border: 'rgba(245,166,35,0.25)' },
  error: { bg: 'rgba(229,72,77,0.1)',   color: '#E5484D', border: 'rgba(229,72,77,0.25)'  },
}

interface Props { onRecalibrar?: () => void }

export default function SensorCalibracionWidget({ onRecalibrar }: Props) {
  const [recal,     setRecal]     = useState(false)
  const [editando,  setEditando]  = useState<string | null>(null)

  const handleRecal = () => {
    setRecal(true)
    setTimeout(() => { setRecal(false); onRecalibrar?.() }, 2200)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, height: '100%', fontFamily: 'system-ui, sans-serif' }}>

      {/* AI Status card */}
      <div style={{
        borderRadius: 12, padding: '12px 16px',
        background: recal
          ? 'rgba(245,166,35,0.06)'
          : 'rgba(47,175,143,0.06)',
        border: `1px solid ${recal ? 'rgba(245,166,35,0.2)' : 'rgba(47,175,143,0.15)'}`,
        display: 'flex', alignItems: 'center', gap: 12,
        transition: 'all 0.3s',
      }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10, flexShrink: 0,
          background: recal ? 'rgba(245,166,35,0.1)' : 'rgba(47,175,143,0.1)',
          border: `1px solid ${recal ? 'rgba(245,166,35,0.2)' : 'rgba(47,175,143,0.2)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {recal ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F5A623" strokeWidth="2" strokeLinecap="round"
              style={{ animation: 'calibSpin 1s linear infinite' }}>
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2FAF8F" strokeWidth="1.5" strokeLinecap="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 2v2m0 16v2M2 12h2m16 0h2"/>
              <circle cx="12" cy="12" r="8" strokeDasharray="3 2" opacity="0.4"/>
            </svg>
          )}
        </div>
        <div style={{ flex: 1 }}>
          <p style={{
            fontSize: 11, fontWeight: 700, margin: '0 0 2px',
            color: recal ? '#F5A623' : '#2FAF8F',
            fontFamily: 'ui-monospace, monospace',
            letterSpacing: '0.03em',
          }}>
            {recal ? 'RECALIBRANDO...' : 'AI PERCEPTION v7.4 · ACTIVO'}
          </p>
          <p style={{ fontSize: 10, color: '#666666', margin: 0, fontFamily: 'ui-monospace, monospace' }}>
            {recal ? 'Esto puede tardar unos segundos...' : 'Precisión: 98.2% · Última calibración: 3 días'}
          </p>
        </div>
        {!recal && (
          <button
            onClick={handleRecal}
            style={{
              padding: '7px 14px', borderRadius: 8,
              background: '#2FAF8F', border: 'none',
              color: 'white', fontSize: 10, fontWeight: 700,
              cursor: 'pointer', flexShrink: 0,
              transition: 'background 0.15s',
              fontFamily: 'ui-monospace, monospace',
              letterSpacing: '0.03em',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#27A07F' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#2FAF8F' }}
          >
            RECALIBRAR
          </button>
        )}
      </div>

      {/* Params table */}
      <div style={{
        flex: 1,
        background: '#111111',
        border: '1px solid #222222',
        borderRadius: 12,
        overflow: 'hidden', display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ padding: '10px 16px', borderBottom: '1px solid #191919', flexShrink: 0 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#F0F0F0', margin: 0 }}>Parámetros del modelo</p>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {PARAMS.map((p, i) => {
            const isLast = i === PARAMS.length - 1
            return (
              <div key={p.id} style={{
                padding: '10px 16px',
                borderBottom: isLast ? 'none' : '1px solid #161616',
                display: 'flex', alignItems: 'center', gap: 10,
                transition: 'background 0.15s',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = '#151515' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: '#F0F0F0', margin: '0 0 2px' }}>{p.label}</p>
                  <p style={{ fontSize: 10, color: '#666666', margin: 0, fontFamily: 'ui-monospace, monospace' }}>{p.desc}</p>
                </div>

                {editando === p.id ? (
                  <input
                    defaultValue={p.valor}
                    autoFocus
                    onBlur={() => setEditando(null)}
                    onKeyDown={e => e.key === 'Enter' && setEditando(null)}
                    style={{
                      width: 90, padding: '5px 9px',
                      borderRadius: 7,
                      border: '1px solid #2FAF8F',
                      background: 'transparent',
                      color: '#2FAF8F', fontSize: 11, fontWeight: 700,
                      outline: 'none',
                      fontFamily: 'ui-monospace, monospace',
                    }}
                  />
                ) : (
                  <span style={{
                    fontSize: 11, fontWeight: 700, color: '#F0F0F0',
                    fontFamily: 'ui-monospace, monospace',
                    minWidth: 80, textAlign: 'right',
                  }}>
                    {p.valor}
                  </span>
                )}

                {p.tag && p.tagType && (
                  <span style={{
                    fontSize: 8, fontWeight: 700,
                    background: TAG[p.tagType].bg,
                    color: TAG[p.tagType].color,
                    border: `1px solid ${TAG[p.tagType].border}`,
                    borderRadius: 4, padding: '2px 7px', flexShrink: 0,
                    fontFamily: 'ui-monospace, monospace', letterSpacing: '0.06em',
                  }}>
                    {p.tag.toUpperCase()}
                  </span>
                )}

                <button
                  onClick={() => setEditando(editando === p.id ? null : p.id)}
                  style={{
                    padding: '5px 10px', borderRadius: 6,
                    background: editando === p.id ? 'rgba(47,175,143,0.1)' : '#191919',
                    border: `1px solid ${editando === p.id ? 'rgba(47,175,143,0.3)' : '#222222'}`,
                    color: editando === p.id ? '#2FAF8F' : '#777777',
                    fontSize: 10, cursor: 'pointer',
                    transition: 'all 0.15s',
                    fontFamily: 'ui-monospace, monospace',
                  }}
                  onMouseEnter={e => { if (editando !== p.id) { e.currentTarget.style.borderColor = 'rgba(47,175,143,0.25)'; e.currentTarget.style.color = '#2FAF8F' } }}
                  onMouseLeave={e => { if (editando !== p.id) { e.currentTarget.style.borderColor = '#222222'; e.currentTarget.style.color = '#777777' } }}
                >
                  {editando === p.id ? 'Listo' : 'Editar'}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      <style>{`
        @keyframes calibSpin { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
      `}</style>
    </div>
  )
}