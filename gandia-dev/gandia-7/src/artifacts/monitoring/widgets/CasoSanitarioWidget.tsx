/**
 * CasoSanitarioWidget — Gestión de Casos Sanitarios
 * Flujo completo: apertura → revisión → dictamen → cierre.
 */

import { useState } from 'react'
import type { DBAnomalia } from '../monitoreoService'

// ─── TIPOS ────────────────────────────────────────────────────────────────────

type EstadoCaso = 'abierto' | 'en_revision' | 'cerrado'

export interface CasoSanitario extends DBAnomalia {
  estado_caso?: EstadoCaso
}

interface Props {
  caso:       CasoSanitario
  onResolver: (id: string, notas: string) => Promise<void>
  onEscalar?: (id: string) => void
  onClose:    () => void
}

// ─── CONSTANTES ───────────────────────────────────────────────────────────────

const TIPOS_SOSPECHA = [
  'Herida abierta / lesión visible',
  'Secreción anormal',
  'Inflamación localizada',
  'Comportamiento anómalo persistente',
  'Posible miasis (gusano barrenador)',
  'Otro (especificar en notas)',
]

const ACCIONES_RECOMENDADAS: Record<string, string> = {
  separacion_hato:     'Revisión visual inmediata. Verificar signos vitales y posibles lesiones.',
  postura_caida:       'Inspección física urgente. Llamar MVZ si no se incorpora en 10 minutos.',
  sin_ingesta:         'Verificar acceso a agua y alimento. Revisar estado dental y salud bucal.',
  temperatura_alta:    'Suministrar sombra y agua fresca. Tomar temperatura rectal. Llamar MVZ si >40°C.',
  movimiento_reducido: 'Inspeccionar pezuñas. Revisar posibles cojeras o lesiones en extremidades.',
  herida_sospechosa:   'URGENTE: Aislamiento inmediato. Llamar MVZ. Posible caso de miasis.',
  faltante_rfid:       'Verificar presencia física del animal. Revisar lector RFID si aplica.',
  sobrepoblacion:      'Redistribuir animales entre corrales. Revisar inventario.',
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function formatFecha(iso: string): string {
  return new Date(iso).toLocaleString('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// ─── EstadoBadge — fuera del componente para no re-crearse en cada render ─────

const ESTADO_MAP: Record<EstadoCaso, { color: string; label: string; bg: string; border: string }> = {
  abierto:     { color: '#E5484D', label: 'ABIERTO',     bg: 'rgba(229,72,77,0.1)',  border: 'rgba(229,72,77,0.3)'  },
  en_revision: { color: '#F5A623', label: 'EN REVISIÓN', bg: 'rgba(245,166,35,0.1)', border: 'rgba(245,166,35,0.3)' },
  cerrado:     { color: '#2FAF8F', label: 'CERRADO',     bg: 'rgba(47,175,143,0.1)', border: 'rgba(47,175,143,0.3)' },
}

function EstadoBadge({ estado }: { estado: EstadoCaso }) {
  const s = ESTADO_MAP[estado]
  return (
    <span style={{
      fontSize: 8, fontWeight: 700,
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      borderRadius: 5, padding: '3px 8px',
      fontFamily: 'monospace', letterSpacing: '0.07em',
    }}>{s.label}</span>
  )
}

// ─── COMPONENTE ───────────────────────────────────────────────────────────────

export default function CasoSanitarioWidget({ caso, onResolver, onEscalar, onClose }: Props) {
  const [notas,        setNotas]        = useState(caso.notas ?? '')
  const [tipoCierre,   setTipoCierre]   = useState('')
  const [saving,       setSaving]       = useState(false)
  const [confirmClose, setConfirmClose] = useState(false)

  const isAlta = caso.severidad === 'alta'
  const color  = isAlta ? '#E5484D' : '#F5A623'
  const estado = caso.resuelto ? 'cerrado' : (caso.estado_caso ?? 'abierto')
  const accion = ACCIONES_RECOMENDADAS[caso.tipo.toLowerCase().replace(/ /g, '_')] ?? null

  const handleCerrar = async () => {
    if (!notas.trim()) return
    setSaving(true)
    await onResolver(caso.id, notas)
    setSaving(false)
    setConfirmClose(false)
  }

  return (
    <div style={{
      background: '#111',
      border: '1px solid #252525',
      borderLeft: `3px solid ${color}`,
      borderRadius: 14, overflow: 'hidden',
      fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{ height: 1, background: `linear-gradient(90deg, ${color}40, transparent)` }} />

      {/* Header */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #1E1E1E', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 9,
            background: `${color}12`, border: `1px solid ${color}25`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#F0F0F0', margin: 0 }}>Caso Sanitario</p>
              <EstadoBadge estado={estado} />
            </div>
            <p style={{ fontSize: 10, color: '#555', margin: '2px 0 0', fontFamily: 'monospace' }}>
              {formatFecha(caso.created_at)}
            </p>
          </div>
        </div>
        <button onClick={onClose} style={{
          width: 28, height: 28, borderRadius: 7,
          background: '#191919', border: '1px solid #222',
          color: '#666', cursor: 'pointer', fontSize: 11,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.color = '#F0F0F0' }}
        onMouseLeave={e => { e.currentTarget.style.color = '#666' }}>✕</button>
      </div>

      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Datos del caso */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div style={{ background: '#0D0D0D', border: '1px solid #1E1E1E', borderRadius: 9, padding: '10px 12px' }}>
            <p style={{ fontSize: 9, fontWeight: 700, color: '#555', letterSpacing: '0.07em', margin: '0 0 5px', fontFamily: 'monospace' }}>TIPO</p>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#F0F0F0', margin: 0, lineHeight: 1.4 }}>{caso.tipo}</p>
          </div>
          <div style={{ background: '#0D0D0D', border: '1px solid #1E1E1E', borderRadius: 9, padding: '10px 12px' }}>
            <p style={{ fontSize: 9, fontWeight: 700, color: '#555', letterSpacing: '0.07em', margin: '0 0 5px', fontFamily: 'monospace' }}>ANIMAL</p>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#F0F0F0', margin: 0, fontFamily: 'monospace' }}>
              {caso.animal_id ? `#${caso.animal_id.slice(-6).toUpperCase()}` : '— Sin identificar'}
            </p>
          </div>
        </div>

        {/* Severidad + fuente */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}70`, flexShrink: 0 }} />
          <span style={{ fontSize: 11, fontWeight: 600, color }}>{caso.severidad.toUpperCase()}</span>
          <span style={{ color: '#222' }}>·</span>
          <span style={{ fontSize: 11, color: '#555', fontFamily: 'monospace' }}>Fuente: {caso.fuente}</span>
          {caso.evidencia_url && (
            <>
              <span style={{ color: '#222' }}>·</span>
              <a href={caso.evidencia_url} target="_blank" rel="noreferrer"
                style={{ fontSize: 11, color: '#2FAF8F', fontFamily: 'monospace', textDecoration: 'none' }}>
                Ver evidencia →
              </a>
            </>
          )}
        </div>

        {/* Recomendación IA */}
        {accion && (
          <div style={{
            background: 'transparent', border: '1px solid #1E1E1E',
            borderLeft: '2px solid #2FAF8F', borderRadius: 9, padding: '10px 12px',
          }}>
            <p style={{ fontSize: 9, fontWeight: 700, color: '#2FAF8F', letterSpacing: '0.07em', margin: '0 0 5px', fontFamily: 'monospace' }}>
              RECOMENDACIÓN IA
            </p>
            <p style={{ fontSize: 12, color: '#AAA', margin: '0 0 3px', lineHeight: 1.6 }}>{accion}</p>
            <p style={{ fontSize: 10, color: '#2FAF8F', margin: 0, fontStyle: 'italic' }}>La IA alerta. El humano decide.</p>
          </div>
        )}

        {/* Línea de tiempo */}
        <div>
          <p style={{ fontSize: 9, fontWeight: 700, color: '#555', letterSpacing: '0.07em', margin: '0 0 10px', fontFamily: 'monospace' }}>CRONOLOGÍA DEL CASO</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, position: 'relative', paddingLeft: 20 }}>
            <div style={{ position: 'absolute', left: 6, top: 8, bottom: 8, width: 1, background: '#222' }} />

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, position: 'relative' }}>
              <div style={{ position: 'absolute', left: -14, width: 13, height: 13, borderRadius: '50%', background: '#E5484D', border: '2px solid #111', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'white' }} />
              </div>
              <div>
                <p style={{ fontSize: 11, fontWeight: 600, color: '#F0F0F0', margin: '0 0 2px' }}>Caso abierto</p>
                <p style={{ fontSize: 10, color: '#555', margin: 0, fontFamily: 'monospace' }}>{formatFecha(caso.created_at)}</p>
              </div>
            </div>

            {caso.notas && !caso.resuelto && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, position: 'relative' }}>
                <div style={{ position: 'absolute', left: -14, width: 13, height: 13, borderRadius: '50%', background: '#F5A623', border: '2px solid #111' }} />
                <div>
                  <p style={{ fontSize: 11, fontWeight: 600, color: '#F0F0F0', margin: '0 0 2px' }}>Nota registrada</p>
                  <p style={{ fontSize: 10, color: '#AAA', margin: 0, lineHeight: 1.5 }}>{caso.notas}</p>
                </div>
              </div>
            )}

            {caso.resuelto && caso.resuelto_at && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, position: 'relative' }}>
                <div style={{ position: 'absolute', left: -14, width: 13, height: 13, borderRadius: '50%', background: '#2FAF8F', border: '2px solid #111', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 600, color: '#2FAF8F', margin: '0 0 2px' }}>Caso cerrado</p>
                  <p style={{ fontSize: 10, color: '#555', margin: 0, fontFamily: 'monospace' }}>{formatFecha(caso.resuelto_at)}</p>
                  {caso.notas && <p style={{ fontSize: 10, color: '#AAA', margin: '3px 0 0', lineHeight: 1.5 }}>{caso.notas}</p>}
                </div>
              </div>
            )}

            {!caso.resuelto && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative' }}>
                <div style={{ position: 'absolute', left: -14, width: 13, height: 13, borderRadius: '50%', background: '#222', border: '2px solid #333', animation: 'cssoPulse 2s ease-in-out infinite' }} />
                <p style={{ fontSize: 10, color: '#444', margin: 0, fontStyle: 'italic', fontFamily: 'monospace' }}>Pendiente de resolución…</p>
              </div>
            )}
          </div>
        </div>

        {/* Tipo de sospecha — solo en alertas altas abiertas */}
        {!caso.resuelto && isAlta && (
          <div>
            <p style={{ fontSize: 9, fontWeight: 700, color: '#555', letterSpacing: '0.07em', margin: '0 0 8px', fontFamily: 'monospace' }}>TIPO DE SOSPECHA CLÍNICA</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {TIPOS_SOSPECHA.map((t, i) => (
                <button key={i} onClick={() => setTipoCierre(tipoCierre === t ? '' : t)} style={{
                  padding: '5px 10px', borderRadius: 7, fontSize: 10, cursor: 'pointer',
                  border: tipoCierre === t ? `1px solid ${color}` : '1px solid #222',
                  background: tipoCierre === t ? `${color}12` : '#191919',
                  color: tipoCierre === t ? color : '#666',
                  transition: 'all 0.15s',
                }}>{t}</button>
              ))}
            </div>
          </div>
        )}

        {/* Notas / dictamen */}
        {!caso.resuelto && (
          <div>
            <p style={{ fontSize: 9, fontWeight: 700, color: '#555', letterSpacing: '0.07em', margin: '0 0 6px', fontFamily: 'monospace' }}>
              NOTAS / DICTAMEN VETERINARIO
            </p>
            <textarea
              value={notas}
              onChange={e => setNotas(e.target.value)}
              placeholder="Describe hallazgos, diagnóstico presuntivo, acciones tomadas…"
              rows={3}
              style={{
                width: '100%', padding: '10px 12px', borderRadius: 9, border: '1px solid #222',
                background: '#0D0D0D', color: '#F0F0F0', fontSize: 12, lineHeight: 1.6,
                outline: 'none', boxSizing: 'border-box', fontFamily: 'system-ui, sans-serif',
                resize: 'none', transition: 'border-color 0.15s',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = 'rgba(47,175,143,0.4)' }}
              onBlur={e => { e.currentTarget.style.borderColor = '#222' }}
            />
          </div>
        )}

        {/* Acciones */}
        {!caso.resuelto ? (
          <div style={{ display: 'flex', gap: 8 }}>
            {onEscalar && (
              <button onClick={() => onEscalar(caso.id)} style={{
                flex: 1, padding: '10px', borderRadius: 9, background: 'transparent',
                border: `1px solid ${color}`, color, fontSize: 11, fontWeight: 700,
                cursor: 'pointer', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = `${color}12` }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
                Escalar a MVZ
              </button>
            )}
            {!confirmClose ? (
              <button onClick={() => setConfirmClose(true)} disabled={!notas.trim()} style={{
                flex: 2, padding: '10px', borderRadius: 9,
                background: notas.trim() ? '#2FAF8F' : '#191919',
                border: notas.trim() ? 'none' : '1px solid #222',
                color: notas.trim() ? 'white' : '#444',
                fontSize: 11, fontWeight: 700,
                cursor: notas.trim() ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { if (notas.trim()) e.currentTarget.style.background = '#27A07F' }}
              onMouseLeave={e => { if (notas.trim()) e.currentTarget.style.background = '#2FAF8F' }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Cerrar caso
              </button>
            ) : (
              <div style={{ flex: 2, display: 'flex', gap: 6 }}>
                <button onClick={() => setConfirmClose(false)} style={{ flex: 1, padding: '10px', borderRadius: 9, background: '#191919', border: '1px solid #222', color: '#777', fontSize: 11, cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button onClick={handleCerrar} disabled={saving} style={{
                  flex: 2, padding: '10px', borderRadius: 9,
                  background: saving ? 'rgba(47,175,143,0.15)' : '#2FAF8F',
                  border: saving ? '1px solid rgba(47,175,143,0.3)' : 'none',
                  color: saving ? '#2FAF8F' : 'white',
                  fontSize: 11, fontWeight: 700, cursor: saving ? 'default' : 'pointer',
                  fontFamily: 'monospace',
                }}>
                  {saving ? 'GUARDANDO…' : '✓ CONFIRMAR CIERRE'}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '11px', background: 'rgba(47,175,143,0.06)',
            border: '1px solid rgba(47,175,143,0.2)', borderRadius: 9,
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2FAF8F" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <span style={{ fontSize: 12, color: '#2FAF8F', fontWeight: 700 }}>Caso cerrado — evidencia registrada</span>
          </div>
        )}
      </div>

      <style>{`@keyframes cssoPulse{0%,100%{opacity:1;box-shadow:none}50%{opacity:.5;box-shadow:0 0 0 4px rgba(245,166,35,0.15)}}`}</style>
    </div>
  )
}