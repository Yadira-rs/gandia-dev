/**
 * MapaCorralDetalleWidget — v2
 * Temperatura y humedad reales desde Open-Meteo usando lat/lng del rancho.
 */
import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import type { Corral } from './MapaVistaGeneralWidget'

interface Props {
  corral?:      Corral
  onVerCamara?: () => void
  onClose?:     () => void
}

const E = {
  normal:     { dot: '#2FAF8F', label: 'NORMAL',     bg: 'rgba(47,175,143,0.08)',  border: 'rgba(47,175,143,0.20)', txt: '#2FAF8F' },
  atencion:   { dot: '#F5A623', label: 'ATENCIÓN',   bg: 'rgba(245,166,35,0.08)',  border: 'rgba(245,166,35,0.22)', txt: '#F5A623' },
  cuarentena: { dot: '#E5484D', label: 'CUARENTENA', bg: 'rgba(229,72,77,0.08)',   border: 'rgba(229,72,77,0.22)',  txt: '#E5484D' },
}

interface Weather {
  temp:     number
  humedad:  number
  viento:   number
  fuente:   'open-meteo' | 'default'
}

async function fetchWeather(lat: number, lng: number): Promise<Weather | null> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,wind_speed_10m&wind_speed_unit=kmh&timezone=auto`
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json()
    const c = data.current
    return {
      temp:    Math.round(c.temperature_2m),
      humedad: Math.round(c.relative_humidity_2m),
      viento:  Math.round(c.wind_speed_10m),
      fuente:  'open-meteo',
    }
  } catch {
    return null
  }
}

export function MapaCorralDetalleWidget({ corral: corralProp, onVerCamara, onClose }: Props) {
  const [fetched,     setFetched]     = useState<Corral | null>(null)
  const [loaded,      setLoaded]      = useState(false)
  const [weather,     setWeather]     = useState<Weather | null>(null)
  const [superficie,  setSuperficie]  = useState<number | null>(null)
  const [weatherLoad, setWeatherLoad] = useState(false)

  useEffect(() => {
    if (corralProp) return
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { setLoaded(true); return }
      const { data: rancho } = await supabase.from('ranch_extended_profiles')
        .select('id, lat, lng').eq('user_id', session.user.id).single()
      if (!rancho) { setLoaded(true); return }

      const { data: dbC } = await supabase.from('corrales')
        .select('*').eq('rancho_id', rancho.id).eq('activo', true).order('estado').limit(1)
      if (dbC && dbC.length > 0) {
        const c = dbC[0] as Record<string,unknown>
        setFetched({
          id: 1, label: c.label as string, animales: c.animales as number,
          capacidad: c.capacidad as number, estado: c.estado as 'normal'|'atencion'|'cuarentena',
          temp: 22, humedad: 60, camara: c.tiene_camara as boolean, _dbId: c.id as string,
        })
        setSuperficie((c.superficie_ha as number) ?? null)
      }

      // Clima real desde Open-Meteo
      if (rancho.lat && rancho.lng) {
        setWeatherLoad(true)
        const w = await fetchWeather(rancho.lat, rancho.lng)
        setWeather(w)
        setWeatherLoad(false)
      }
      setLoaded(true)
    }
    load()
  }, [corralProp])

  // Si viene el corral por props, igual busca el clima
  useEffect(() => {
    if (!corralProp) return
    async function loadWeather() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const { data: rancho } = await supabase.from('ranch_extended_profiles')
        .select('lat, lng').eq('user_id', session.user.id).single()
      if (!rancho?.lat || !rancho?.lng) return
      setWeatherLoad(true)
      const w = await fetchWeather(rancho.lat, rancho.lng)
      setWeather(w)
      setWeatherLoad(false)
    }
    loadWeather()
  }, [corralProp])

  const corral = corralProp ?? fetched

  if (!corralProp && !loaded) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:180, background:'#111', border:'1px solid #1E1E1E', borderRadius:14 }}>
      <div style={{ width:20, height:20, border:'2px solid #2FAF8F', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (!corral) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:10, height:180, background:'#111', border:'1px solid #1E1E1E', borderRadius:14 }}>
      <p style={{ fontSize:12, color:'#444', margin:0 }}>Sin corrales registrados</p>
    </div>
  )

  const col     = E[corral.estado]
  const ocupPct = corral.capacidad > 0 ? Math.round(corral.animales / corral.capacidad * 100) : 0

  const temp    = weather?.temp    ?? 22
  const humedad = weather?.humedad ?? 60
  const viento  = weather?.viento  ?? 0

  const tempColor  = temp > 30 ? '#E5484D' : temp > 26 ? '#F5A623' : '#F0F0F0'
  const humColor   = humedad > 80 ? '#F5A623' : '#F0F0F0'

  return (
    <div style={{
      background: '#111111', border: `1px solid ${col.border}`,
      borderLeft: `3px solid ${col.dot}`, borderRadius: 14,
      overflow: 'hidden', fontFamily: 'system-ui, sans-serif', position: 'relative',
    }}>
      <div style={{ position:'absolute', top:0, left:0, right:0, height:1, background:`linear-gradient(90deg, ${col.dot}30, transparent)` }} />

      {/* Header */}
      <div style={{ padding:'12px 16px', borderBottom:'1px solid #191919', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:36, height:36, borderRadius:9, background:col.bg, border:`1px solid ${col.border}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <span style={{ fontSize:11, fontWeight:800, color:col.txt, fontFamily:'ui-monospace, monospace' }}>{corral.label}</span>
          </div>
          <div>
            <p style={{ fontSize:13, fontWeight:700, color:'#F0F0F0', margin:0 }}>Corral {corral.label}</p>
            <p style={{ fontSize:10, color:'#666', margin:'2px 0 0', fontFamily:'ui-monospace, monospace' }}>
              CORRAL · {corral.label}
              {superficie ? ` · ${superficie} ha` : ''}
            </p>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:8, fontWeight:700, background:col.bg, color:col.txt, border:`1px solid ${col.border}`, borderRadius:5, padding:'3px 8px', fontFamily:'ui-monospace, monospace', letterSpacing:'0.06em' }}>{col.label}</span>
          {onClose && (
            <button onClick={onClose} style={{ width:26, height:26, borderRadius:7, background:'#191919', border:'1px solid #222', color:'#666', cursor:'pointer', fontSize:11, display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
          )}
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)' }}>
        {[
          { label:'ANIMALES',    value: corral.animales, sub:`cap. ${corral.capacidad}`, color: corral.animales > corral.capacidad * 0.9 ? '#F5A623' : '#F0F0F0' },
          { label:'TEMPERATURA', value: weatherLoad ? '…°C' : `${temp}°C`, sub: weather ? 'Open-Meteo · real' : 'cargando…', color: tempColor },
          { label:'HUMEDAD',     value: weatherLoad ? '…%'  : `${humedad}%`, sub:'relativa exterior', color: humColor },
          { label:'VIENTO',      value: weatherLoad ? '…'   : `${viento}km/h`, sub:'velocidad', color:'#F0F0F0' },
        ].map((s, i) => (
          <div key={i} style={{ padding:'12px 14px', borderRight: i < 3 ? '1px solid #161616' : 'none' }}>
            <p style={{ fontSize:8, fontWeight:700, color:'#555', letterSpacing:'0.08em', margin:'0 0 5px', fontFamily:'ui-monospace, monospace' }}>{s.label}</p>
            <p style={{ fontSize:20, fontWeight:800, color:s.color, lineHeight:1, margin:'0 0 3px', fontFamily:'ui-monospace, monospace' }}>{s.value}</p>
            <p style={{ fontSize:9, color:'#555', margin:0, fontFamily:'ui-monospace, monospace' }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Fuente del clima */}
      {weather && (
        <div style={{ padding:'4px 16px', borderTop:'1px solid #151515' }}>
          <p style={{ fontSize:8, color:'#333', margin:0, fontFamily:'ui-monospace, monospace' }}>
            🌤 Clima exterior real · Open-Meteo API · actualizado ahora
          </p>
        </div>
      )}

      {/* Ocupación bar */}
      <div style={{ padding:'4px 16px 12px', borderTop:'1px solid #151515' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
          <p style={{ fontSize:8, fontWeight:700, color:'#555', letterSpacing:'0.08em', margin:0, fontFamily:'ui-monospace, monospace' }}>OCUPACIÓN</p>
          <p style={{ fontSize:8, color: ocupPct > 90 ? '#F5A623' : '#555', fontFamily:'ui-monospace, monospace', margin:0, fontWeight:700 }}>{ocupPct}%</p>
        </div>
        <div style={{ height:4, background:'#191919', borderRadius:3, overflow:'hidden' }}>
          <div style={{ height:'100%', width:`${ocupPct}%`, background: ocupPct > 90 ? '#F5A623' : col.dot, borderRadius:3, transition:'width 0.8s ease' }} />
        </div>
      </div>

      {/* Acciones */}
      <div style={{ padding:'0 16px 14px', display:'flex', gap:8 }}>
        {corral.camara && (
          <button onClick={onVerCamara} style={{ flex:1, padding:'9px', borderRadius:9, background:'rgba(47,175,143,0.08)', border:'1px solid rgba(47,175,143,0.2)', color:'#2FAF8F', fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'ui-monospace, monospace' }}>
            Ver cámara
          </button>
        )}
        <button style={{ flex:1, padding:'9px', borderRadius:9, background:'#191919', border:'1px solid #222', color:'#777', fontSize:11, cursor:'pointer', fontFamily:'ui-monospace, monospace' }}>
          Ver historial
        </button>
      </div>
    </div>
  )
}

export default MapaCorralDetalleWidget