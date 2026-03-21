/**
 * AnomaliaFeedWidget — v4
 * Anomalías desde Gandia Vision API (primario) o Supabase (fallback).
 */
import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import { getVisionAnomalias } from '../../../lib/visionApi'

export interface Anomalia {
  id:        number | string
  ts:        string
  animal:    string
  corral:    string
  tipo:      string
  severidad: 'alta' | 'media'
  resuelto:  boolean
  _dbId?:    string
  notas?:    string
}

interface Props {
  anomalias?:         Anomalia[]
  onSelectAnomalia?:  (a: Anomalia) => void
  onAbrirCaso?:       (a: Anomalia) => void
  onRegistrar?:       () => void
}

export default function AnomaliaFeedWidget({ anomalias: anomaliasProp, onSelectAnomalia, onAbrirCaso, onRegistrar }: Props) {
  const [fetched, setFetched] = useState<Anomalia[]>([])

  useEffect(() => {
    if (anomaliasProp) return
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const { data: rancho } = await supabase.from('ranch_extended_profiles').select('id').eq('user_id', session.user.id).single()
      if (!rancho) return

      // Primario: Gandia Vision API
      const visionAnomalias = await getVisionAnomalias(rancho.id)
      if (visionAnomalias.length > 0) {
        const { data: corrales } = await supabase.from('corrales').select('id, label').eq('rancho_id', rancho.id)
        setFetched(visionAnomalias.map(a => {
          const corral = corrales?.find((c: Record<string,unknown>) => c.id === a.corral_id)
          const ts = new Date(a.created_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
          return {
            id:       a.id, ts,
            animal:   a.animal_id ? `#${a.animal_id.slice(-4).toUpperCase()}` : '—',
            corral:   (corral as Record<string,unknown>)?.label as string ?? '—',
            tipo:     a.tipo,
            severidad:(a.severidad === 'baja' ? 'media' : a.severidad) as 'alta'|'media',
            resuelto: a.resuelto,
            _dbId:    a.id,
          } as Anomalia
        }))
        return
      }

      // Fallback: Supabase directo
      const { data: corrales } = await supabase.from('corrales').select('id, label').eq('rancho_id', rancho.id)
      const { data: dbA } = await supabase.from('anomalias_monitoreo').select('*').eq('rancho_id', rancho.id).order('created_at', { ascending: false }).limit(30)
      if (dbA) {
        setFetched(dbA.map((a: Record<string,unknown>) => {
          const corral = corrales?.find((c: Record<string,unknown>) => c.id === a.corral_id)
          const ts = new Date(a.created_at as string).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
          return {
            id: a.id, ts,
            animal:    a.animal_id ? `#${(a.animal_id as string).slice(-4).toUpperCase()}` : '—',
            corral:    (corral as Record<string,unknown>)?.label as string ?? '—',
            tipo:      a.tipo as string,
            severidad: (a.severidad === 'baja' ? 'media' : a.severidad) as 'alta'|'media',
            resuelto:  a.resuelto as boolean,
            _dbId:     a.id as string,
          } as Anomalia
        }))
      }
    }
    load()
  }, [anomaliasProp])

  const anomalias = anomaliasProp ?? fetched
  const activas   = anomalias.filter(a => !a.resuelto)
  const resueltas = anomalias.filter(a =>  a.resuelto)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexShrink: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#F0F0F0', margin: 0 }}>Anomalías</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {activas.length > 0 && (
            <span style={{ fontSize: 11, color: '#E5484D', fontWeight: 600 }}>
              {activas.length} activa{activas.length > 1 ? 's' : ''}
            </span>
          )}
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#555' }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#2FAF8F', animation: 'apulse 2s ease-in-out infinite' }} />
            En vivo
          </span>
          {onRegistrar && (
            <button
              onClick={onRegistrar}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '5px 10px', borderRadius: 7,
                background: '#191919', border: '1px solid #222',
                color: '#777', fontSize: 10, fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.15s',
                fontFamily: 'monospace',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(47,175,143,0.4)'; e.currentTarget.style.color = '#2FAF8F' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#222'; e.currentTarget.style.color = '#777' }}
            >
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Registrar
            </button>
          )}
        </div>
      </div>

      {/* Feed */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>

        {activas.map(a => {
          const color = a.severidad === 'alta' ? '#E5484D' : '#F5A623'
          return (
            <div key={String(a.id)} style={{
              background: '#171717',
              border: '1px solid #252525',
              borderLeft: `3px solid ${color}`,
              borderRadius: 9,
              padding: '10px 12px',
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#1C1C1C' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#171717' }}>

              {/* Fila superior: click abre detalle */}
              <div
                onClick={() => onSelectAnomalia?.(a)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: color, animation: 'apulse 1.5s ease-in-out infinite', flexShrink: 0 }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#F0F0F0' }}>{a.corral}</span>
                  <span style={{ fontSize: 10, color, fontWeight: 600 }}>· {a.severidad}</span>
                </div>
                <span style={{ fontSize: 10, color: '#555' }}>{a.ts}</span>
              </div>

              <p
                onClick={() => onSelectAnomalia?.(a)}
                style={{ fontSize: 12, color: '#CCC', margin: '0 0 3px', lineHeight: 1.4 }}
              >
                {a.tipo}
              </p>
              <p
                onClick={() => onSelectAnomalia?.(a)}
                style={{ fontSize: 10, color: '#555', margin: '0 0 0' }}
              >
                Animal {a.animal}
              </p>

              {/* NUEVO: botón "Abrir caso" — solo en alertas altas */}
              {a.severidad === 'alta' && onAbrirCaso && (
                <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #1E1E1E' }}>
                  <button
                    onClick={e => { e.stopPropagation(); onAbrirCaso(a) }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '5px 10px', borderRadius: 7,
                      background: 'transparent',
                      border: '1px solid rgba(229,72,77,0.3)',
                      color: '#E5484D', fontSize: 10, fontWeight: 700,
                      cursor: 'pointer', transition: 'all 0.15s',
                      fontFamily: 'monospace', letterSpacing: '0.03em',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(229,72,77,0.08)'; e.currentTarget.style.borderColor = 'rgba(229,72,77,0.5)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(229,72,77,0.3)' }}
                  >
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                    </svg>
                    ABRIR CASO SANITARIO
                  </button>
                </div>
              )}
            </div>
          )
        })}

        {resueltas.length > 0 && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '6px 0 2px' }}>
              <span style={{ flex: 1, height: 1, background: '#222' }} />
              <span style={{ fontSize: 10, color: '#444' }}>Resueltas hoy</span>
              <span style={{ flex: 1, height: 1, background: '#222' }} />
            </div>
            {resueltas.map(a => (
              <div key={String(a.id)} style={{
                background: '#111', border: '1px solid #1E1E1E',
                borderRadius: 9, padding: '9px 12px', opacity: 0.5,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#2FAF8F" strokeWidth="2.5" strokeLinecap="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    <span style={{ fontSize: 11, color: '#555', fontWeight: 600 }}>{a.corral}</span>
                  </div>
                  <span style={{ fontSize: 10, color: '#444' }}>{a.ts}</span>
                </div>
                <p style={{ fontSize: 11, color: '#444', margin: 0 }}>{a.tipo}</p>
              </div>
            ))}
          </>
        )}

        {anomalias.length === 0 && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, paddingTop: 40 }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1.5" strokeLinecap="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <p style={{ fontSize: 12, color: '#444', margin: 0 }}>Sin anomalías hoy</p>
          </div>
        )}
      </div>

      <style>{`@keyframes apulse{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
    </div>
  )
}