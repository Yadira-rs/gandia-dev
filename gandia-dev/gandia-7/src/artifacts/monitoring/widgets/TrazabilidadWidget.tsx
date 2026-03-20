/**
 * TrazabilidadWidget — Panel de Trazabilidad Animal
 * Si no recibe props, fetcha de Supabase directamente.
 */

import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import type { DBAnimal, DBConteo, DBCorral } from '../monitoreoService'

// ─── TIPOS ────────────────────────────────────────────────────────────────────

interface Props {
  corrales?:           DBCorral[]
  animales?:           DBAnimal[]
  conteos?:            DBConteo[]
  loading?:            boolean
  onRegistrarConteo?:  (corralId: string, detectados: number, inventario: number) => Promise<void>
  onVerAnimal?:        (animal: DBAnimal) => void
}

type FiltroEstado = 'todos' | 'con_rfid' | 'sin_rfid'

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function calcEdad(fechaNac: string | null): string {
  if (!fechaNac) return '—'
  const diff = Date.now() - new Date(fechaNac).getTime()
  const meses = Math.floor(diff / (1000 * 60 * 60 * 24 * 30.44))
  if (meses < 24) return `${meses}m`
  return `${Math.floor(meses / 12)}a`
}

// ─── SUBCOMPONENTE: formulario de conteo manual ───────────────────────────────

function ConteoManualForm({
  corral,
  inventario,
  onGuardar,
  onCancelar,
}: {
  corral: DBCorral
  inventario: number
  onGuardar: (detectados: number) => void
  onCancelar: () => void
}) {
  const [val, setVal] = useState(String(inventario))
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    const n = parseInt(val)
    if (isNaN(n) || n < 0) return
    setSaving(true)
    await new Promise(r => setTimeout(r, 400))
    onGuardar(n)
    setSaving(false)
  }

  return (
    <div style={{
      background: '#0D0D0D',
      border: '1px solid rgba(47,175,143,0.3)',
      borderRadius: 12,
      padding: '14px 16px',
      display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#2FAF8F', flexShrink: 0 }} />
        <p style={{ fontSize: 12, fontWeight: 700, color: '#F0F0F0', margin: 0 }}>
          Conteo manual — Corral {corral.label}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div>
          <p style={{ fontSize: 9, color: '#555', fontFamily: 'monospace', letterSpacing: '0.06em', margin: '0 0 5px' }}>INVENTARIO ESPERADO</p>
          <p style={{ fontSize: 24, fontWeight: 800, color: '#555', fontFamily: 'monospace', margin: 0 }}>{inventario}</p>
        </div>
        <div>
          <p style={{ fontSize: 9, color: '#555', fontFamily: 'monospace', letterSpacing: '0.06em', margin: '0 0 5px' }}>DETECTADOS HOY</p>
          <input
            type="number"
            value={val}
            onChange={e => setVal(e.target.value)}
            min={0}
            style={{
              width: '100%', padding: '6px 10px',
              borderRadius: 8, border: '1px solid rgba(47,175,143,0.4)',
              background: 'transparent', color: '#2FAF8F',
              fontSize: 22, fontWeight: 800, fontFamily: 'monospace',
              outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      {parseInt(val) !== inventario && !isNaN(parseInt(val)) && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'rgba(229,72,77,0.08)', border: '1px solid rgba(229,72,77,0.2)',
          borderRadius: 8, padding: '8px 12px',
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#E5484D" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span style={{ fontSize: 11, color: '#E5484D', fontFamily: 'monospace' }}>
            Diferencia de {Math.abs(parseInt(val) - inventario)} animal{Math.abs(parseInt(val) - inventario) !== 1 ? 'es' : ''}
          </span>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button onClick={onCancelar} style={{
          padding: '7px 14px', borderRadius: 8,
          background: '#191919', border: '1px solid #222',
          color: '#777', fontSize: 10, cursor: 'pointer',
        }}>Cancelar</button>
        <button onClick={handleSave} disabled={saving} style={{
          padding: '7px 18px', borderRadius: 8,
          background: saving ? 'rgba(47,175,143,0.15)' : '#2FAF8F',
          border: saving ? '1px solid rgba(47,175,143,0.3)' : 'none',
          color: saving ? '#2FAF8F' : 'white',
          fontSize: 10, fontWeight: 700, cursor: saving ? 'default' : 'pointer',
          fontFamily: 'monospace', letterSpacing: '0.04em',
          transition: 'all 0.2s',
        }}>
          {saving ? '✓ GUARDANDO…' : 'REGISTRAR'}
        </button>
      </div>
    </div>
  )
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────

export default function TrazabilidadWidget({
  corrales:   corralesProp,
  animales:   animalesProp,
  conteos:    conteosProp,
  loading:    loadingProp = false,
  onRegistrarConteo,
  onVerAnimal,
}: Props) {
  const [fetchedCorrales, setFetchedCorrales] = useState<DBCorral[]>([])
  const [fetchedAnimales, setFetchedAnimales] = useState<DBAnimal[]>([])
  const [fetchedConteos,  setFetchedConteos]  = useState<DBConteo[]>([])
  const [fetching,        setFetching]        = useState(!corralesProp)

  useEffect(() => {
    if (corralesProp) return
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { setFetching(false); return }
      const { data: rancho } = await supabase.from('ranch_extended_profiles').select('id').eq('user_id', session.user.id).single()
      if (!rancho) { setFetching(false); return }
      const [{ data: c }, { data: a }, { data: ct }] = await Promise.all([
        supabase.from('corrales').select('*').eq('rancho_id', rancho.id).eq('activo', true).order('label'),
        supabase.from('animales').select('*').eq('rancho_id', rancho.id),
        supabase.from('conteos').select('*').eq('rancho_id', rancho.id).order('created_at', { ascending: false }).limit(100),
      ])
      if (c) setFetchedCorrales(c as DBCorral[])
      if (a) setFetchedAnimales(a as DBAnimal[])
      if (ct) setFetchedConteos(ct as DBConteo[])
      setFetching(false)
    }
    load()
  }, [corralesProp])

  const corrales = corralesProp ?? fetchedCorrales
  const animales = animalesProp ?? fetchedAnimales
  const conteos  = conteosProp  ?? fetchedConteos
  const loading  = loadingProp || fetching

  const [corralSeleccionado, setCorralSeleccionado] = useState<DBCorral | null>(() => corrales[0] ?? null)
  const [filtro,             setFiltro]             = useState<FiltroEstado>('todos')
  const [conteoForm,         setConteoForm]         = useState(false)


  const corralActual = corralSeleccionado ?? corrales[0]

  const animalesDelCorral = corralActual
    ? animales.filter(a => a.corral_id === corralActual.id)
    : animales

  const ultimoConteo = corralActual
    ? conteos.filter(c => c.corral_id === corralActual.id)[0]
    : null

  const conRfid    = animalesDelCorral.filter(a => !!a.rfid).length
  const sinRfid    = animalesDelCorral.filter(a => !a.rfid).length
  const inventario = corralActual?.capacidad ?? 0
  const detectados = ultimoConteo?.detectados ?? animalesDelCorral.length
  const faltantes  = Math.max(0, inventario - detectados)
  const matchPct   = inventario > 0 ? Math.round((detectados / inventario) * 100) : 0
  const matchColor = matchPct === 100 ? '#2FAF8F' : matchPct >= 90 ? '#F5A623' : '#E5484D'

  const animalesFiltrados = animalesDelCorral.filter(a => {
    if (filtro === 'con_rfid') return !!a.rfid
    if (filtro === 'sin_rfid') return !a.rfid
    return true
  })

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
      <div style={{ fontSize: 11, color: '#555', fontFamily: 'monospace' }}>Cargando trazabilidad…</div>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%', fontFamily: 'system-ui, sans-serif' }}>

      {/* ── Selector de corral ── */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', flexShrink: 0, paddingBottom: 2 }}>
        {corrales.map(c => {
          const sel = corralActual?.id === c.id
          const dotC = c.estado === 'normal' ? '#2FAF8F' : c.estado === 'atencion' ? '#F5A623' : '#E5484D'
          return (
            <button
              key={c.id}
              onClick={() => { setCorralSeleccionado(c); setConteoForm(false); setFiltro('todos') }}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 13px', borderRadius: 9, flexShrink: 0,
                border: sel ? `1px solid ${dotC}` : '1px solid #222',
                background: sel ? `${dotC}12` : '#111',
                color: sel ? dotC : '#777',
                fontSize: 11, fontWeight: sel ? 700 : 500,
                cursor: 'pointer', transition: 'all 0.15s',
                fontFamily: 'monospace',
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: dotC }} />
              {c.label}
              <span style={{ fontSize: 10, opacity: 0.7 }}>{c.animales}</span>
            </button>
          )
        })}
      </div>

      {/* ── Métricas del corral ── */}
      {corralActual && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, flexShrink: 0 }}>
          {[
            { label: 'DETECTADOS', value: detectados, color: '#2FAF8F' },
            { label: 'INVENTARIO', value: inventario, color: '#F0F0F0' },
            { label: 'MATCH',      value: `${matchPct}%`, color: matchColor },
            { label: 'FALTANTES',  value: faltantes, color: faltantes === 0 ? '#2FAF8F' : '#E5484D' },
          ].map((m, i) => (
            <div key={i} style={{
              background: '#171717', border: '1px solid #252525', borderRadius: 10,
              padding: '10px 12px', position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${m.color}50, transparent)` }} />
              <div style={{ fontSize: 8, fontWeight: 700, color: '#555', fontFamily: 'monospace', letterSpacing: '0.08em', marginBottom: 5 }}>{m.label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: m.color, fontFamily: 'monospace', lineHeight: 1 }}>{m.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Botones de acción ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['todos', 'con_rfid', 'sin_rfid'] as FiltroEstado[]).map(f => {
            const labels = { todos: 'Todos', con_rfid: `Con RFID (${conRfid})`, sin_rfid: `Sin RFID (${sinRfid})` }
            return (
              <button
                key={f}
                onClick={() => setFiltro(f)}
                style={{
                  padding: '5px 10px', borderRadius: 7,
                  border: filtro === f ? '1px solid rgba(47,175,143,0.4)' : '1px solid #222',
                  background: filtro === f ? 'rgba(47,175,143,0.08)' : '#111',
                  color: filtro === f ? '#2FAF8F' : '#666',
                  fontSize: 10, cursor: 'pointer', fontWeight: filtro === f ? 700 : 400,
                  fontFamily: 'monospace', transition: 'all 0.15s',
                }}
              >
                {labels[f]}
              </button>
            )
          })}
        </div>

        {onRegistrarConteo && corralActual && (
          <button
            onClick={() => setConteoForm(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 13px', borderRadius: 8,
              background: '#2FAF8F', border: 'none',
              color: 'white', fontSize: 10, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'monospace',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#27A07F' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#2FAF8F' }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Conteo manual
          </button>
        )}
      </div>

      {/* ── Formulario de conteo ── */}
      {conteoForm && corralActual && onRegistrarConteo && (
        <ConteoManualForm
          corral={corralActual}
          inventario={inventario}
          onGuardar={async (det) => {
            await onRegistrarConteo(corralActual.id, det, inventario)
            setConteoForm(false)
          }}
          onCancelar={() => setConteoForm(false)}
        />
      )}

      {/* ── Tabla de animales ── */}
      <div style={{
        flex: 1, background: '#111', border: '1px solid #1E1E1E',
        borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column',
      }}>
        {/* Header tabla */}
        <div style={{
          display: 'grid', gridTemplateColumns: '90px 80px 70px 70px 1fr 60px',
          padding: '8px 14px', borderBottom: '1px solid #1A1A1A',
          background: '#0D0D0D', flexShrink: 0,
        }}>
          {['SINIIGA', 'RFID', 'SEXO', 'EDAD', 'RAZA', 'STATUS'].map((h, i) => (
            <span key={i} style={{ fontSize: 8, fontWeight: 700, color: '#555', fontFamily: 'monospace', letterSpacing: '0.08em' }}>{h}</span>
          ))}
        </div>

        {/* Filas */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {animalesFiltrados.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 120, gap: 8 }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1.5" strokeLinecap="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              <p style={{ fontSize: 11, color: '#444', margin: 0 }}>
                {animales.length === 0 ? 'Sin animales registrados en este corral' : 'Sin resultados para este filtro'}
              </p>
            </div>
          ) : (
            animalesFiltrados.map((a, i) => {
              const tieneRfid  = !!a.rfid
              const isLast     = i === animalesFiltrados.length - 1
              return (
                <div
                  key={a.id}
                  onClick={() => onVerAnimal?.(a)}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '90px 80px 70px 70px 1fr 60px',
                    padding: '9px 14px',
                    borderBottom: isLast ? 'none' : '1px solid #161616',
                    cursor: onVerAnimal ? 'pointer' : 'default',
                    transition: 'background 0.12s',
                  }}
                  onMouseEnter={e => { if (onVerAnimal) e.currentTarget.style.background = '#151515' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                >
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#F0F0F0', fontFamily: 'monospace' }}>
                    {a.siniiga ?? '—'}
                  </span>
                  <span style={{
                    fontSize: 9, fontWeight: 700,
                    color: tieneRfid ? '#2FAF8F' : '#555',
                    fontFamily: 'monospace',
                    display: 'flex', alignItems: 'center', gap: 5,
                  }}>
                    <span style={{
                      width: 5, height: 5, borderRadius: '50%',
                      background: tieneRfid ? '#2FAF8F' : '#444',
                      flexShrink: 0,
                    }} />
                    {tieneRfid ? a.rfid!.slice(-6) : 'Sin RFID'}
                  </span>
                  <span style={{ fontSize: 11, color: '#777', fontFamily: 'monospace' }}>
                    {a.sexo === 'M' ? '♂' : a.sexo === 'F' ? '♀' : '—'}
                  </span>
                  <span style={{ fontSize: 11, color: '#777', fontFamily: 'monospace' }}>
                    {calcEdad(a.fecha_nacimiento)}
                  </span>
                  <span style={{ fontSize: 10, color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {a.raza ?? '—'}
                  </span>
                  <span style={{
                    fontSize: 8, fontWeight: 700,
                    color: a.estatus === 'activo' ? '#2FAF8F' : '#F5A623',
                    fontFamily: 'monospace', textTransform: 'uppercase',
                  }}>
                    {a.estatus ?? '—'}
                  </span>
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '7px 14px', borderTop: '1px solid #191919',
          display: 'flex', justifyContent: 'space-between', flexShrink: 0,
          background: '#0D0D0D',
        }}>
          <span style={{ fontSize: 9, color: '#555', fontFamily: 'monospace' }}>
            {animalesFiltrados.length} animal{animalesFiltrados.length !== 1 ? 'es' : ''} mostrados
          </span>
          {ultimoConteo && (
            <span style={{ fontSize: 9, color: '#444', fontFamily: 'monospace' }}>
              Último conteo: {ultimoConteo.fuente} · {new Date(ultimoConteo.created_at).toLocaleDateString('es-MX')}
            </span>
          )}
        </div>
      </div>

      {/* RFID legend */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 16,
        padding: '8px 12px', background: '#0D0D0D',
        border: '1px solid #191919', borderRadius: 9, flexShrink: 0,
      }}>
        <span style={{ fontSize: 9, color: '#555', fontFamily: 'monospace' }}>COBERTURA RFID:</span>
        <div style={{ flex: 1, height: 3, background: '#191919', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${animalesDelCorral.length > 0 ? Math.round(conRfid / animalesDelCorral.length * 100) : 0}%`,
            background: '#2FAF8F', borderRadius: 2,
            transition: 'width 1s ease',
          }} />
        </div>
        <span style={{ fontSize: 10, fontWeight: 700, color: '#2FAF8F', fontFamily: 'monospace' }}>
          {animalesDelCorral.length > 0
            ? `${Math.round(conRfid / animalesDelCorral.length * 100)}%`
            : '—'}
        </span>
        <span style={{ fontSize: 9, color: '#444', fontFamily: 'monospace' }}>
          {conRfid}/{animalesDelCorral.length} animales
        </span>
      </div>
    </div>
  )
}