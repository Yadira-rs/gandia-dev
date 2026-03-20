/**
 * ConfigCorralesWidget — v3
 * Agregar / editar corrales con posición en mapa interactivo.
 * El usuario hace click en el mini mapa para colocar el corral.
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import type { Corral } from './MapaVistaGeneralWidget'

interface Props {
  corrales?:    Corral[]
  onNuevaZona?: () => void
}

const E = {
  normal:     { dot: '#2FAF8F', bg: 'rgba(47,175,143,0.08)', border: 'rgba(47,175,143,0.2)',  txt: '#2FAF8F', label: 'NORMAL'     },
  atencion:   { dot: '#F5A623', bg: 'rgba(245,166,35,0.08)', border: 'rgba(245,166,35,0.22)', txt: '#F5A623', label: 'ATENCIÓN'   },
  cuarentena: { dot: '#E5484D', bg: 'rgba(229,72,77,0.08)',  border: 'rgba(229,72,77,0.22)',  txt: '#E5484D', label: 'CUARENTENA' },
}

const inputStyle = {
  width: '100%', padding: '8px 10px', borderRadius: 8,
  background: '#0A0A0A', border: '1px solid #222',
  color: '#F0F0F0', fontSize: 11, fontFamily: 'ui-monospace, monospace',
  outline: 'none', boxSizing: 'border-box' as const,
}

const labelStyle = {
  fontSize: 9, fontWeight: 700, color: '#555',
  fontFamily: 'ui-monospace, monospace', letterSpacing: '0.08em',
  display: 'block', marginBottom: 4,
}

// ─── Mini mapa interactivo ────────────────────────────────────────────────────

function MiniMapaPicker({
  corrales, posX, posY, onPick
}: {
  corrales: Corral[]
  posX: number | null
  posY: number | null
  onPick: (x: number, y: number) => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    onPick(Math.round(x * 100) / 100, Math.round(y * 100) / 100)
  }

  return (
    <div>
      <label style={labelStyle}>POSICIÓN EN EL RANCHO <span style={{ color: '#2FAF8F' }}>— haz clic para colocar</span></label>
      <div
        ref={ref}
        onClick={handleClick}
        style={{
          position: 'relative', width: '100%', height: 140,
          background: '#0A0A0A', border: '1px solid #333',
          borderRadius: 10, cursor: 'crosshair', overflow: 'hidden',
          backgroundImage: 'radial-gradient(circle, #1a1a1a 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      >
        {/* Label instrucción */}
        {posX === null && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            <span style={{ fontSize: 10, color: '#333', fontFamily: 'ui-monospace, monospace' }}>Click para posicionar el corral</span>
          </div>
        )}

        {/* Pins de corrales existentes (referencia) */}
        {corrales.filter(c => c.lat != null && c.lng != null).map(c => (
          <div key={c.id} style={{
            position: 'absolute',
            left: `${(c.lat! * 100)}%`,
            top: `${(c.lng! * 100)}%`,
            transform: 'translate(-50%, -50%)',
            width: 22, height: 22, borderRadius: '50%',
            background: E[c.estado].bg,
            border: `1px solid ${E[c.estado].border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: 0.6,
          }}>
            <span style={{ fontSize: 7, fontWeight: 800, color: E[c.estado].txt, fontFamily: 'ui-monospace, monospace' }}>{c.label}</span>
          </div>
        ))}

        {/* Pin del corral actual */}
        {posX !== null && posY !== null && (
          <div style={{
            position: 'absolute',
            left: `${posX * 100}%`,
            top: `${posY * 100}%`,
            transform: 'translate(-50%, -50%)',
            zIndex: 10,
          }}>
            {/* Pulso */}
            <div style={{
              position: 'absolute', inset: -6, borderRadius: '50%',
              background: 'rgba(47,175,143,0.15)',
              animation: 'pulse 1.5s ease-in-out infinite',
            }} />
            <div style={{
              width: 26, height: 26, borderRadius: '50%',
              background: '#2FAF8F', border: '2px solid #1a7a60',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 12px rgba(47,175,143,0.5)',
            }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="white" stroke="none">
                <circle cx="12" cy="10" r="4"/>
                <path d="M12 2C7.58 2 4 5.58 4 10c0 5.25 7 13 8 13s8-7.75 8-13c0-4.42-3.58-8-8-8z"/>
              </svg>
            </div>
          </div>
        )}
        <style>{`@keyframes pulse { 0%,100%{opacity:0.3;transform:scale(1)} 50%{opacity:0.8;transform:scale(1.3)} }`}</style>
      </div>
      {posX !== null && (
        <p style={{ fontSize: 9, color: '#2FAF8F', margin: '4px 0 0', fontFamily: 'ui-monospace, monospace' }}>
          Posición: {Math.round(posX * 100)}% X · {Math.round(posY! * 100)}% Y — haz clic de nuevo para mover
        </p>
      )}
    </div>
  )
}

// ─── WIDGET PRINCIPAL ─────────────────────────────────────────────────────────

export default function ConfigCorralesWidget({ corrales: corraleProp }: Props) {
  const [fetched,     setFetched]     = useState<Corral[]>([])
  const [ranchoId,    setRanchoId]    = useState<string | null>(null)
  const [showForm,    setShowForm]    = useState(false)
  const [confirmBaja, setConfirmBaja] = useState<number | null>(null)
  const [guardando,   setGuardando]   = useState(false)
  const [editando,    setEditando]    = useState<Corral | null>(null)
  const [error,       setError]       = useState<string | null>(null)
  const [form, setForm] = useState({
    label: '', capacidad: '', superficie_ha: '',
    estado: 'normal' as 'normal'|'atencion'|'cuarentena',
    tiene_camara: false,
    pos_x: null as number | null,
    pos_y: null as number | null,
    gps_lat: '',
    gps_lng: '',
  })

  const recargar = useCallback(async (rid?: string) => {
    const id = rid ?? ranchoId
    if (!id) return
    const { data: dbC } = await supabase.from('corrales').select('*').eq('rancho_id', id).eq('activo', true).order('label')
    if (dbC) setFetched(dbC.map((c: Record<string,unknown>, i: number) => ({
      id: i+1, label: c.label as string, animales: (c.animales as number) ?? 0,
      capacidad: c.capacidad as number, estado: c.estado as 'normal'|'atencion'|'cuarentena',
      temp: (c.temperatura as number) ?? 22, humedad: (c.humedad as number) ?? 60,
      camara: c.tiene_camara as boolean, _dbId: c.id as string,
      lat: c.pos_x as number | undefined,
      lng: c.pos_y as number | undefined,
    })))
  }, [ranchoId])

  useEffect(() => {
    if (corraleProp) return
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const { data: rancho } = await supabase.from('ranch_extended_profiles').select('id').eq('user_id', session.user.id).single()
      if (!rancho) return
      setRanchoId(rancho.id)
      await recargar(rancho.id)
    }
    load()
  }, [corraleProp, recargar])

  function abrirForm(c?: Corral) {
    setEditando(c ?? null)
    setForm(c ? {
      label: c.label, capacidad: String(c.capacidad), superficie_ha: '', estado: c.estado,
      tiene_camara: c.camara,
      pos_x: c.lat ?? null, pos_y: c.lng ?? null,
      gps_lat: '', gps_lng: '',
    } : { label: '', capacidad: '', superficie_ha: '', estado: 'normal', tiene_camara: false, pos_x: null, pos_y: null, gps_lat: '', gps_lng: '' })
    setError(null)
    setShowForm(true)
  }

  async function guardar() {
    if (!form.label.trim()) { setError('El nombre del corral es requerido'); return }
    if (!form.capacidad || isNaN(Number(form.capacidad))) { setError('Capacidad inválida'); return }

    // Si ranchoId no está cargado todavía, lo buscamos ahora
    let rid = ranchoId
    if (!rid) {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { setError('Sin sesión activa'); return }
      const { data: rancho } = await supabase.from('ranch_extended_profiles').select('id').eq('user_id', session.user.id).single()
      if (!rancho) { setError('Rancho no encontrado'); return }
      rid = rancho.id
      setRanchoId(rid)
    }

    setGuardando(true); setError(null)

    const payload = {
      label:         form.label.trim().toUpperCase(),
      capacidad:     parseInt(form.capacidad),
      superficie_ha: form.superficie_ha ? parseFloat(form.superficie_ha) : null,
      estado:        form.estado,
      tiene_camara:  form.tiene_camara,
      activo:        true,
      pos_x:         form.pos_x,
      pos_y:         form.pos_y,
      lat:           form.gps_lat ? parseFloat(form.gps_lat) : null,
      lng:           form.gps_lng ? parseFloat(form.gps_lng) : null,
    }

    if (editando?._dbId) {
      const { error: e } = await supabase.from('corrales').update(payload).eq('id', editando._dbId)
      if (e) { setError('Error: ' + e.message); setGuardando(false); return }
    } else {
      const { error: e } = await supabase.from('corrales').insert({ ...payload, rancho_id: rid, animales: 0 })
      if (e) { setError('Error: ' + e.message); setGuardando(false); return }
    }
    await recargar(rid ?? undefined); setShowForm(false); setGuardando(false)
  }

  async function darBaja(c: Corral) {
    if (!c._dbId) return
    await supabase.from('corrales').update({ activo: false }).eq('id', c._dbId)
    setConfirmBaja(null); await recargar()
  }

  const corrales = corraleProp ?? fetched

  return (
    <div style={{ background: '#111', border: '1px solid #222', borderRadius: 14, overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column', fontFamily: 'system-ui, sans-serif' }}>

      {/* Header */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #191919', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#F0F0F0', margin: 0 }}>Zonas y corrales</p>
          <p style={{ fontSize: 10, color: '#666', margin: '2px 0 0', fontFamily: 'ui-monospace, monospace' }}>{corrales.length} corrales registrados</p>
        </div>
        <button onClick={() => abrirForm()} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 13px', borderRadius: 8, background: '#2FAF8F', border: 'none', color: 'white', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
          <span style={{ fontSize: 15, lineHeight: 1, fontWeight: 300 }}>+</span> Nueva zona
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div style={{ padding: '14px 16px', borderBottom: '1px solid #222', background: '#0D0D0D', flexShrink: 0, overflowY: 'auto', maxHeight: 420 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#F0F0F0', margin: '0 0 12px' }}>{editando ? `Editar corral ${editando.label}` : 'Nuevo corral'}</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
            <div>
              <label style={labelStyle}>NOMBRE / CLAVE</label>
              <input style={inputStyle} placeholder="Ej: B1, Norte, Engorda" value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>CAPACIDAD (ANIMALES)</label>
              <input style={inputStyle} type="number" placeholder="Ej: 50" value={form.capacidad} onChange={e => setForm(f => ({ ...f, capacidad: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>SUPERFICIE (HA)</label>
              <input style={inputStyle} type="number" placeholder="Ej: 2.5" step="0.1" value={form.superficie_ha} onChange={e => setForm(f => ({ ...f, superficie_ha: e.target.value }))} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, marginBottom: 12 }}>
            <div>
              <label style={labelStyle}>ESTADO</label>
              <select style={inputStyle} value={form.estado} onChange={e => setForm(f => ({ ...f, estado: e.target.value as 'normal'|'atencion'|'cuarentena' }))}>
                <option value="normal">Normal</option>
                <option value="atencion">Atención</option>
                <option value="cuarentena">Cuarentena</option>
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <label style={{ ...labelStyle, marginBottom: 8 }}>CÁMARA</label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.tiene_camara} onChange={e => setForm(f => ({ ...f, tiene_camara: e.target.checked }))} />
                <span style={{ fontSize: 10, color: '#777', fontFamily: 'ui-monospace, monospace' }}>Tiene cámara</span>
              </label>
            </div>
          </div>

          {/* Mini mapa interactivo */}
          <div style={{ marginBottom: 10 }}>
            <MiniMapaPicker
              corrales={corrales.filter(c => c._dbId !== editando?._dbId)}
              posX={form.pos_x}
              posY={form.pos_y}
              onPick={(x, y) => setForm(f => ({ ...f, pos_x: x, pos_y: y }))}
            />
          </div>

          {/* Coordenadas GPS opcionales */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ ...labelStyle, marginBottom: 6 }}>
              COORDENADAS GPS <span style={{ color: '#555', fontWeight: 400 }}>— opcional, cópialas de Google Maps</span>
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8, alignItems: 'flex-end' }}>
              <div>
                <label style={{ ...labelStyle, color: '#444' }}>LATITUD</label>
                <input
                  style={inputStyle}
                  placeholder="Ej: 24.150832"
                  value={form.gps_lat}
                  onChange={e => setForm(f => ({ ...f, gps_lat: e.target.value }))}
                />
              </div>
              <div>
                <label style={{ ...labelStyle, color: '#444' }}>LONGITUD</label>
                <input
                  style={inputStyle}
                  placeholder="Ej: -104.600456"
                  value={form.gps_lng}
                  onChange={e => setForm(f => ({ ...f, gps_lng: e.target.value }))}
                />
              </div>
              <button
                onClick={() => {
                  const lat = parseFloat(form.gps_lat)
                  const lng = parseFloat(form.gps_lng)
                  if (isNaN(lat) || isNaN(lng)) { setError('Coordenadas inválidas'); return }
                  if (lat < -90 || lat > 90) { setError('Latitud debe ser entre -90 y 90'); return }
                  if (lng < -180 || lng > 180) { setError('Longitud debe ser entre -180 y 180'); return }
                  // Normaliza GPS a posición relativa 0-1 para el mapa visual
                  // Centro aproximado México: lat 23.6, lng -102.5 | rango ±15 grados
                  const normX = Math.max(0, Math.min(1, (lng - (-115)) / ((-87) - (-115))))
                  const normY = Math.max(0, Math.min(1, 1 - (lat - 14) / (33 - 14)))
                  setForm(f => ({ ...f, pos_x: Math.round(normX * 100) / 100, pos_y: Math.round(normY * 100) / 100 }))
                  setError(null)
                }}
                style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(47,175,143,0.12)', border: '1px solid rgba(47,175,143,0.3)', color: '#2FAF8F', fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'ui-monospace, monospace', whiteSpace: 'nowrap' }}
              >
                Colocar en mapa
              </button>
            </div>
            <p style={{ fontSize: 9, color: '#333', margin: '5px 0 0', fontFamily: 'ui-monospace, monospace' }}>
              En Google Maps: clic derecho sobre el rancho → copia las coordenadas
            </p>
          </div>

          {error && <p style={{ fontSize: 10, color: '#E5484D', marginBottom: 10, fontFamily: 'ui-monospace, monospace' }}>{error}</p>}

          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={guardar} disabled={guardando} style={{ flex: 1, padding: '9px', borderRadius: 8, background: guardando ? 'rgba(47,175,143,0.3)' : '#2FAF8F', border: 'none', color: 'white', fontSize: 11, fontWeight: 700, cursor: guardando ? 'default' : 'pointer' }}>
              {guardando ? 'Guardando…' : editando ? 'Actualizar corral' : 'Agregar corral'}
            </button>
            <button onClick={() => setShowForm(false)} style={{ padding: '9px 16px', borderRadius: 8, background: 'transparent', border: '1px solid #333', color: '#666', fontSize: 11, cursor: 'pointer' }}>Cancelar</button>
          </div>
        </div>
      )}

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {corrales.length === 0 && !showForm && (
          <div style={{ padding: 32, textAlign: 'center' }}>
            <p style={{ fontSize: 11, color: '#444', fontFamily: 'ui-monospace, monospace' }}>Sin corrales registrados</p>
            <p style={{ fontSize: 10, color: '#333', marginTop: 4 }}>Usa "+ Nueva zona" para agregar</p>
          </div>
        )}
        {corrales.map((c, i) => {
          const col = E[c.estado]
          const pct = c.capacidad > 0 ? Math.round(c.animales / c.capacidad * 100) : 0
          return (
            <div key={c.id} style={{ padding: '11px 16px', borderBottom: i < corrales.length - 1 ? '1px solid #161616' : 'none', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: 9, flexShrink: 0, background: col.bg, border: `1px solid ${col.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: col.txt, fontFamily: 'ui-monospace, monospace' }}>{c.label}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#F0F0F0', margin: 0, fontFamily: 'ui-monospace, monospace' }}>Corral {c.label}</p>
                  <span style={{ fontSize: 8, fontWeight: 700, background: col.bg, color: col.txt, border: `1px solid ${col.border}`, borderRadius: 4, padding: '2px 6px', fontFamily: 'ui-monospace, monospace' }}>{col.label}</span>
                  {c.lat != null && (
                    <span style={{ fontSize: 8, color: '#2FAF8F', fontFamily: 'ui-monospace, monospace' }}>📍 En mapa</span>
                  )}
                </div>
                <p style={{ fontSize: 10, color: '#666', margin: '0 0 5px', fontFamily: 'ui-monospace, monospace' }}>Cap. {c.capacidad} · {c.camara ? '● Cámara' : 'Sin cámara'}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ flex: 1, maxWidth: 80, height: 3, background: '#191919', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: col.dot, borderRadius: 2 }} />
                  </div>
                  <span style={{ fontSize: 9, color: '#666', fontFamily: 'ui-monospace, monospace' }}>{pct}%</span>
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <p style={{ fontSize: 20, fontWeight: 800, color: '#F0F0F0', lineHeight: 1, margin: '0 0 2px', fontFamily: 'ui-monospace, monospace' }}>{c.animales}</p>
                <p style={{ fontSize: 9, color: '#555', margin: 0, fontFamily: 'ui-monospace, monospace' }}>animales</p>
              </div>
              <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                {confirmBaja === c.id ? (
                  <>
                    <button onClick={() => darBaja(c)} style={{ padding: '5px 10px', borderRadius: 7, background: '#E5484D', border: 'none', color: 'white', fontSize: 10, cursor: 'pointer' }}>Confirmar</button>
                    <button onClick={() => setConfirmBaja(null)} style={{ padding: '5px 10px', borderRadius: 7, background: '#191919', border: '1px solid #222', color: '#777', fontSize: 10, cursor: 'pointer' }}>No</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => abrirForm(c)} style={{ padding: '6px 11px', borderRadius: 7, background: '#191919', border: '1px solid #222', color: '#777', fontSize: 10, cursor: 'pointer', fontFamily: 'ui-monospace, monospace' }}>Editar</button>
                    <button onClick={() => setConfirmBaja(c.id)} style={{ padding: '6px 11px', borderRadius: 7, background: 'transparent', border: '1px solid #E5484D', color: '#E5484D', fontSize: 10, cursor: 'pointer' }}>Baja</button>
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