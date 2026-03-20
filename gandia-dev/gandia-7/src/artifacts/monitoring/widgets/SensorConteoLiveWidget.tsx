/**
 * SensorConteoLiveWidget — REDISEÑO PRO
 * Si no recibe `stats`, los fetcha de Supabase directamente.
 */
import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import CamaraFeedWidget from './CamaraFeedWidget'
import type { Camara } from './CamaraListaWidget'

interface SensorStat {
  corral:      string
  detectados:  number
  inventario:  number
  match:       number
  activo:      boolean
}

interface Props {
  stats?:               SensorStat[]
  ultimaActualizacion?: string
}

export default function SensorConteoLiveWidget({ stats: statsProp, ultimaActualizacion = 'hace 2 min' }: Props) {
  const [fetched,  setFetched]  = useState<SensorStat[]>([])
  const [camara,   setCamara]   = useState<Camara | null>(null)

  useEffect(() => {
    if (statsProp) return
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const { data: rancho } = await supabase.from('ranch_extended_profiles').select('id').eq('user_id', session.user.id).single()
      if (!rancho) return
      const { data: corrales } = await supabase.from('corrales').select('id, label, animales, capacidad').eq('rancho_id', rancho.id).eq('activo', true).order('label')
      const { data: conteos }  = await supabase.from('conteos').select('corral_id, detectados, inventario_esperado, match_pct').eq('rancho_id', rancho.id).order('created_at', { ascending: false }).limit(50)
      const { data: camaras }  = await supabase.from('camaras').select('id, label, corral_id, estado, detectados, inventario, fps_analisis').eq('rancho_id', rancho.id)
      if (corrales) {
        setFetched(corrales.map((c: Record<string,unknown>) => {
          const ult = conteos?.find((ct: Record<string,unknown>) => ct.corral_id === c.id)
          return {
            corral:     c.label as string,
            detectados: (ult?.detectados as number) ?? (c.animales as number),
            inventario: (ult?.inventario_esperado as number) ?? (c.capacidad as number),
            match:      (ult?.match_pct as number) ?? ((c.capacidad as number) > 0 ? Math.round((c.animales as number) / (c.capacidad as number) * 100) : 0),
            activo:     camaras?.some((cam: Record<string,unknown>) => cam.corral_id === c.id && cam.estado === 'online') ?? false,
          }
        }))
      }
      if (camaras && camaras.length > 0) {
        const online = (camaras as Record<string,unknown>[]).find(c => c.estado === 'online') ?? (camaras as Record<string,unknown>[])[0]
        const corral = corrales?.find((c: Record<string,unknown>) => c.id === online.corral_id)
        setCamara({
          id: 1, label: online.label as string,
          corral: (corral as Record<string,unknown>)?.label as string ?? '—',
          estado: online.estado as 'online'|'offline',
          detectados: (online.detectados as number) ?? 0,
          inventario: (online.inventario as number) ?? 0,
          fps: (online.fps_analisis as number) ?? 24,
        })
      }
    }
    load()
  }, [statsProp])

  const stats = statsProp ?? fetched
  const activos     = stats.filter(s => s.activo)
  const totalDetect = stats.reduce((s, c) => s + c.detectados, 0)
  const totalInvent = stats.reduce((s, c) => s + c.inventario, 0)
  const matchGlobal = activos.length > 0
    ? Math.round(activos.reduce((s, c) => s + c.match, 0) / activos.length) : 0
  const matchColor  = matchGlobal === 100 ? '#2FAF8F' : matchGlobal >= 90 ? '#F5A623' : '#E5484D'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontFamily: 'system-ui, sans-serif' }}>

      {/* Top metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
        {[
          { label: 'DETECTADO',  value: totalDetect, accent: '#2FAF8F' },
          { label: 'INVENTARIO', value: totalInvent, accent: '#F0F0F0' },
          { label: 'MATCH GLOBAL', value: `${matchGlobal}%`, accent: matchColor },
        ].map((s, i) => (
          <div key={i} style={{
            background: '#171717',
            border: '1px solid #222222',
            borderRadius: 12,
            padding: '12px 16px',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${s.accent}50, transparent)` }} />
            <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.08em', color: '#555555', marginBottom: 6, fontFamily: 'ui-monospace, monospace' }}>
              {s.label}
            </div>
            <div style={{ fontSize: 30, fontWeight: 800, lineHeight: 1, color: s.accent, fontFamily: 'ui-monospace, monospace', letterSpacing: '-0.02em' }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{
        background: '#171717',
        border: '1px solid #222222',
        borderRadius: 12,
        overflow: 'hidden',
      }}>
        {/* Table header */}
        <div style={{
          display: 'grid', gridTemplateColumns: '60px 1fr 80px 50px',
          gap: 8, padding: '10px 16px',
          borderBottom: '1px solid #191919',
          alignItems: 'center',
        }}>
          <span style={{ fontSize: 8, fontWeight: 700, color: '#555555', letterSpacing: '0.08em', fontFamily: 'ui-monospace, monospace' }}>CORRAL</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 8, fontWeight: 700, color: '#555555', letterSpacing: '0.08em', fontFamily: 'ui-monospace, monospace' }}>MATCH</span>
          </div>
          <span style={{ fontSize: 8, fontWeight: 700, color: '#555555', letterSpacing: '0.08em', textAlign: 'center', fontFamily: 'ui-monospace, monospace' }}>DET / INV</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#2FAF8F', animation: 'sensorPulse 2s ease-in-out infinite' }} />
            <span style={{ fontSize: 8, color: '#555555', fontFamily: 'ui-monospace, monospace' }}>%</span>
          </div>
        </div>

        {stats.map((s, i) => {
          const barColor  = s.match === 100 ? '#2FAF8F' : s.match >= 90 ? '#F5A623' : '#E5484D'
          const txtColor  = s.activo ? barColor : '#555555'
          const isLast    = i === stats.length - 1
          return (
            <div key={i} style={{
              display: 'grid',
              gridTemplateColumns: '60px 1fr 80px 50px',
              gap: 8,
              padding: '11px 16px',
              borderBottom: isLast ? 'none' : '1px solid #161616',
              alignItems: 'center',
              opacity: s.activo ? 1 : 0.4,
              transition: 'background 0.15s',
            }}
              onMouseEnter={e => { if (s.activo) e.currentTarget.style.background = '#151515' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
            >
              <span style={{
                fontSize: 11, fontWeight: 700,
                color: s.activo ? '#F0F0F0' : '#555555',
                fontFamily: 'ui-monospace, monospace',
              }}>
                {s.corral}
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  flex: 1, height: 4,
                  background: '#191919',
                  borderRadius: 4, overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%', width: `${s.match}%`,
                    background: barColor,
                    borderRadius: 4,
                    boxShadow: s.match === 100 ? `0 0 6px ${barColor}60` : 'none',
                    transition: 'width 1s ease',
                  }} />
                </div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: 11, color: '#F0F0F0', fontFamily: 'ui-monospace, monospace', fontWeight: 700 }}>{s.detectados}</span>
                <span style={{ fontSize: 10, color: '#555555', fontFamily: 'ui-monospace, monospace' }}> / {s.inventario}</span>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: txtColor, fontFamily: 'ui-monospace, monospace' }}>
                  {s.activo ? `${s.match}%` : '—'}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* AI status */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        background: 'transparent',
        border: '1px solid #222',
        borderRadius: 10,
        padding: '10px 14px',
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 9,
          background: 'transparent',
          border: '1px solid #2FAF8F',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2FAF8F" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 2v3m0 14v3M2 12h3m14 0h3"/>
          </svg>
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#2FAF8F', margin: '0 0 2px', fontFamily: 'ui-monospace, monospace', letterSpacing: '0.03em' }}>
            AI PERCEPTION v7.4
          </p>
          <p style={{ fontSize: 10, color: '#666666', margin: 0, fontFamily: 'ui-monospace, monospace' }}>
            Precisión: 98.2% · Act. {ultimaActualizacion}
            {stats.filter(s => !s.activo).length > 0 && (
              <span style={{ color: '#F5A623' }}> · {stats.filter(s => !s.activo).length} corral(es) sin cobertura</span>
            )}
          </p>
        </div>
        <div style={{
          fontSize: 9, fontWeight: 700,
          background: 'transparent',
          color: '#2FAF8F',
          border: '1px solid #2FAF8F',
          borderRadius: 5,
          padding: '3px 8px',
          fontFamily: 'ui-monospace, monospace',
          letterSpacing: '0.06em',
        }}>
          ACTIVO
        </div>
      </div>

      <style>{`
        @keyframes sensorPulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
      `}</style>

      {/* Cámara — solo en modo chat (sin statsProp) */}
      {!statsProp && (
        camara
          ? <CamaraFeedWidget camara={camara} />
          : (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 10, background: '#111', border: '1px solid #1E1E1E', borderRadius: 14, padding: 32, minHeight: 160,
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1.5" strokeLinecap="round">
                <path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
              <p style={{ fontSize: 12, color: '#444', margin: 0 }}>Sin cámaras registradas</p>
            </div>
          )
      )}
    </div>
  )
}