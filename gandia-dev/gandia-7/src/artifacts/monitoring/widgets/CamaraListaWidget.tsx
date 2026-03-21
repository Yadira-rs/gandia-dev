/**
 * CamaraListaWidget — REDISEÑO v2
 * Si no recibe `camaras`, las fetcha de Supabase.
 */
import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabaseClient'

export interface Camara {
  id:         number
  label:      string
  corral:     string
  estado:     'online' | 'offline'
  detectados: number
  inventario: number
  fps:        number
}

interface Props {
  camaras?:        Camara[]
  selectedId?:     number
  onSelectCamara?: (cam: Camara) => void
  onAgregar?:      () => void
}

export default function CamaraListaWidget({ camaras: camarasProp, selectedId, onSelectCamara, onAgregar }: Props) {
  const [fetched, setFetched] = useState<Camara[]>([])

  useEffect(() => {
    if (camarasProp) return
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const { data: rancho } = await supabase.from('ranch_extended_profiles').select('id').eq('user_id', session.user.id).single()
      if (!rancho) return
      const { data: corrales } = await supabase.from('corrales').select('id, label').eq('rancho_id', rancho.id)
      const { data: cams } = await supabase.from('camaras').select('*').eq('rancho_id', rancho.id)
      if (cams) {
        setFetched(cams.map((c: Record<string,unknown>, i: number) => {
          const corral = corrales?.find((cr: Record<string,unknown>) => cr.id === c.corral_id)
          return {
            id: i + 1, label: c.label as string,
            corral: (corral as Record<string,unknown>)?.label as string ?? '—',
            estado: c.estado as 'online'|'offline',
            detectados: (c.detectados as number) ?? 0,
            inventario: (c.inventario as number) ?? 0,
            fps: (c.fps_analisis as number) ?? 24,
          }
        }))
      }
    }
    load()
  }, [camarasProp])

  const camaras = camarasProp ?? fetched
  const online  = camaras.filter(c => c.estado === 'online').length
  const offline = camaras.length - online

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexShrink: 0 }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#F0F0F0', margin: '0 0 3px' }}>Cámaras</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 11, color: '#2FAF8F', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#2FAF8F', animation: 'dotPulse 2s ease-in-out infinite' }} />
              {online} online
            </span>
            {offline > 0 && (
              <span style={{ fontSize: 11, color: '#666' }}>{offline} offline</span>
            )}
          </div>
        </div>
        {onAgregar && (
          <button onClick={onAgregar} style={{
            height: 30, padding: '0 12px', borderRadius: 7,
            background: '#2FAF8F', border: 'none', color: 'white',
            fontSize: 11, fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 4, transition: 'opacity 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '0.85' }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}>
            <span style={{ fontSize: 16, lineHeight: 1, fontWeight: 300 }}>+</span>
            Agregar
          </button>
        )}
      </div>

      {/* List */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, overflowY: 'auto' }}>
        {camaras.map(cam => {
          const isSelected = cam.id === selectedId
          const isOnline   = cam.estado === 'online'
          const match      = cam.inventario > 0 ? Math.round(cam.detectados / cam.inventario * 100) : 0
          const matchColor = match === 100 ? '#2FAF8F' : match >= 90 ? '#F5A623' : '#E5484D'

          return (
            <div key={cam.id} onClick={() => isOnline && onSelectCamara?.(cam)} style={{
              borderRadius: 9, padding: '10px 12px',
              border: isSelected ? '1px solid #2FAF8F' : '1px solid #252525',
              background: isSelected ? 'rgba(47,175,143,0.04)' : '#171717',
              cursor: isOnline ? 'pointer' : 'default',
              opacity: isOnline ? 1 : 0.4,
              transition: 'border-color 0.15s, background 0.15s',
            }}
            onMouseEnter={e => { if (isOnline && !isSelected) { e.currentTarget.style.borderColor = '#333'; e.currentTarget.style.background = '#1C1C1C' } }}
            onMouseLeave={e => { if (!isSelected) { e.currentTarget.style.borderColor = '#252525'; e.currentTarget.style.background = '#171717' } }}>

              {/* Top row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isOnline ? 5 : 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                    stroke={isOnline ? '#2FAF8F' : '#444'} strokeWidth="2" strokeLinecap="round">
                    <path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2"/>
                  </svg>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#F0F0F0', fontFamily: 'ui-monospace, monospace' }}>
                    {cam.label}
                  </span>
                </div>
                {/* Status badge: solo dot + texto sin fondo de color */}
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: isOnline ? '#2FAF8F' : '#555' }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: isOnline ? '#2FAF8F' : '#444', animation: isOnline ? 'dotPulse 2s ease-in-out infinite' : 'none' }} />
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>

              <p style={{ fontSize: 11, color: '#555', margin: isOnline ? '0 0 7px' : '1px 0 0' }}>{cam.corral}</p>

              {isOnline && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, height: 2, background: '#2A2A2A', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${match}%`, background: matchColor, borderRadius: 2, transition: 'width 1s ease' }} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: matchColor, fontFamily: 'ui-monospace, monospace', flexShrink: 0 }}>
                    {cam.detectados} · {match}%
                  </span>
                </div>
              )}
            </div>
          )
        })}
      </div>
      <style>{`@keyframes dotPulse{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
    </div>
  )
}