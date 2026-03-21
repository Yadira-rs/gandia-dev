/**
 * TramiteNuevoWidget — Crear trámite + subir documentos
 * ARCHIVO → src/artifacts/documentos/widgets/TramiteNuevoWidget.tsx
 *
 * Flujo:
 *   Paso 1 — Formulario del trámite (tipo, UPP desde BD, municipio, animales)
 *   Paso 2 — Subir documentos o ver los ya subidos (reutiliza DocSubidaWidget / DocExpedienteWidget)
 */

import { useState, useEffect } from 'react'
import { useUser }              from '../../../context/UserContext'
import { supabase }             from '../../../lib/supabaseClient'
import { crearTramite }         from '../../../lib/tramitesService'
import type { TramiteTipo }     from '../../../lib/tramitesService'
import { useRanchoId }          from '../../../hooks/useAnimales'
import DocSubidaWidget          from './DocSubidaWidget'
import DocExpedienteWidget      from './DocExpedienteWidget'

// ─── TIPOS LOCALES ────────────────────────────────────────────────────────────

interface MunicipioOpt { id: string; nombre: string }
interface UppOpt       { value: string; label: string; source: 'rancho' | 'animal' }

type Paso = 'form' | 'documentos'
type DocTab = 'subir' | 'existentes'

// ─── TIPOS DE TRÁMITE ─────────────────────────────────────────────────────────

const TIPOS: { value: TramiteTipo; label: string; color: string; desc: string }[] = [
  { value: 'exportacion',    label: 'Exportación',    color: '#3b82f6', desc: 'Aretes azules SENASICA'      },
  { value: 'movilizacion',   label: 'Movilización',   color: '#2FAF8F', desc: 'Guía REEMO / traslado'       },
  { value: 'regularizacion', label: 'Regularización', color: '#f59e0b', desc: 'Corrección de registros'     },
]

// ─── WIDGET ───────────────────────────────────────────────────────────────────

export default function TramiteNuevoWidget() {
  const { profile } = useUser()
  const userId      = profile?.user_id ?? null
  const { ranchoId } = useRanchoId(userId)

  const pd         = (profile?.personal_data as Record<string, string> | null) ?? {}
  const nombreProd = pd.fullName ?? pd.full_name ?? pd.nombre_completo ?? pd.nombre ?? ''

  // ── Datos del formulario ───────────────────────────────────────────────────
  const [tipo,        setTipo]        = useState<TramiteTipo>('exportacion')
  const [uppSel,      setUppSel]      = useState('')
  const [uppCustom,   setUppCustom]   = useState('')
  const [usarCustom,  setUsarCustom]  = useState(false)
  const [municipioId, setMunicipioId] = useState('')
  const [numAnimales, setNumAnimales] = useState<number | ''>('')
  const [productor,   setProductor]   = useState(nombreProd)

  // ── Opciones cargadas ──────────────────────────────────────────────────────
  const [municipios,  setMunicipios]  = useState<MunicipioOpt[]>([])
  const [uppOpts,     setUppOpts]     = useState<UppOpt[]>([])
  const [loadingOpts, setLoadingOpts] = useState(false)

  // ── Estado del flujo ───────────────────────────────────────────────────────
  const [paso,       setPaso]       = useState<Paso>('form')
  const [docTab,     setDocTab]     = useState<DocTab>('subir')
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState<string | null>(null)
  const [tramiteId,  setTramiteId]  = useState<string | null>(null)

  // ── Cargar municipios y UPPs ───────────────────────────────────────────────
  useEffect(() => {
    if (!ranchoId) return
    setLoadingOpts(true)

    Promise.all([
      // Municipios
      supabase.from('entidades').select('id, nombre').eq('tipo', 'municipio').order('nombre'),
      // UPP del rancho
      supabase.from('ranch_extended_profiles').select('id').eq('id', ranchoId).maybeSingle(),
      // UPPs únicas de los animales del rancho
      supabase.from('animales').select('upp').eq('rancho_id', ranchoId).neq('estatus', 'baja').not('upp', 'is', null),
    ]).then(([muniRes, ranchoRes, animalesRes]) => {
      setMunicipios((muniRes.data ?? []).map(m => ({ id: String(m.id), nombre: m.nombre ?? '' })))

      // UPPs únicas desde animales
      const uppsAnimales = [...new Set(
        (animalesRes.data ?? []).map((a: { upp: string | null }) => a.upp).filter(Boolean) as string[]
      )].map(u => ({ value: u, label: u, source: 'animal' as const }))

      // Si el rancho tiene UPP propia
      const uppsRancho: UppOpt[] = ranchoRes.data
        ? [{ value: ranchoId, label: `UPP Rancho (${ranchoId.slice(0,8)}…)`, source: 'rancho' as const }]
        : []

      const todas = [...uppsRancho, ...uppsAnimales]
      setUppOpts(todas)
      if (todas.length > 0) setUppSel(todas[0].value)

      setLoadingOpts(false)
    })
  }, [ranchoId])

  // ── Crear trámite ──────────────────────────────────────────────────────────
  const handleCrear = async () => {
    if (!userId) { setError('Sin sesión activa'); return }
    const uppFinal = usarCustom ? uppCustom.trim() : uppSel
    if (!uppFinal)             { setError('Selecciona o escribe una UPP'); return }
    if (!municipioId)          { setError('Selecciona un municipio'); return }
    if (!numAnimales || Number(numAnimales) < 1) { setError('Ingresa número de animales'); return }
    if (!productor.trim())     { setError('El nombre del productor es obligatorio'); return }

    setLoading(true)
    setError(null)
    try {
      const id = await crearTramite({
        upp:         uppFinal,
        tipo,
        numAnimales: Number(numAnimales),
        productor:   productor.trim(),
        municipioId,
        userId,
      })
      setTramiteId(id)
      setPaso('documentos')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al crear el trámite')
    } finally {
      setLoading(false)
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PASO 1 — FORMULARIO
  // ══════════════════════════════════════════════════════════════════════════

  if (paso === 'form') {
    return (
      <div className="flex flex-col gap-4">

        <div>
          <p className="text-[13px] font-semibold text-stone-700 dark:text-stone-200">Nuevo trámite</p>
          <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-0.5">
            Se enviará a revisión de la Unión Ganadera
          </p>
        </div>

        {/* ── Tipo de trámite ── */}
        <div className="flex flex-col gap-1.5">
          <label className={lbl}>Tipo de trámite</label>
          <div className="flex flex-col gap-1.5">
            {TIPOS.map(t => (
              <button
                key={t.value}
                onClick={() => setTipo(t.value)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-[10px] border transition-all cursor-pointer text-left"
                style={tipo === t.value
                  ? { background: `${t.color}10`, borderColor: `${t.color}40` }
                  : { background: 'transparent', borderColor: 'rgba(214,211,208,0.5)' }
                }
              >
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: t.color }} />
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-stone-700 dark:text-stone-200">{t.label}</p>
                  <p className="text-[10.5px] text-stone-400 dark:text-stone-500">{t.desc}</p>
                </div>
                {tipo === t.value && (
                  <svg className="w-3.5 h-3.5 shrink-0" style={{ color: t.color }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── UPP ── */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className={lbl}>UPP</label>
            <button
              onClick={() => setUsarCustom(!usarCustom)}
              className="text-[10.5px] text-[#2FAF8F] bg-transparent border-0 cursor-pointer"
            >
              {usarCustom ? 'Usar existente' : 'Escribir manualmente'}
            </button>
          </div>

          {loadingOpts ? (
            <div className="flex items-center gap-2 h-9">
              <div className="w-3 h-3 border-2 border-[#2FAF8F] border-t-transparent rounded-full animate-spin" />
              <p className="text-[12px] text-stone-400">Cargando UPPs…</p>
            </div>
          ) : usarCustom ? (
            <input
              type="text"
              placeholder="UPP-DGO-2024-001"
              value={uppCustom}
              onChange={e => setUppCustom(e.target.value)}
              className={inp}
            />
          ) : uppOpts.length > 0 ? (
            <select value={uppSel} onChange={e => setUppSel(e.target.value)} className={inp}>
              {uppOpts.map(u => (
                <option key={u.value} value={u.value}>{u.label}</option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              placeholder="UPP-DGO-2024-001"
              value={uppCustom}
              onChange={e => setUppCustom(e.target.value)}
              className={inp}
            />
          )}
        </div>

        {/* ── Municipio ── */}
        <div className="flex flex-col gap-1">
          <label className={lbl}>Municipio</label>
          <select value={municipioId} onChange={e => setMunicipioId(e.target.value)} className={inp}>
            <option value="">Seleccionar…</option>
            {municipios.map(m => (
              <option key={m.id} value={m.id}>{m.nombre}</option>
            ))}
          </select>
        </div>

        {/* ── Animales + Productor ── */}
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1">
            <label className={lbl}>No. de animales</label>
            <input
              type="number" min={1} placeholder="45"
              value={numAnimales}
              onChange={e => setNumAnimales(e.target.value ? Number(e.target.value) : '')}
              className={inp}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className={lbl}>Productor</label>
            <input
              type="text" placeholder="Nombre o rancho"
              value={productor}
              onChange={e => setProductor(e.target.value)}
              className={inp}
            />
          </div>
        </div>

        {/* ── Aviso ── */}
        <div className="flex items-start gap-2 p-3 rounded-[10px] bg-stone-50 dark:bg-stone-900/30 border border-stone-200/50 dark:border-stone-800/50">
          <svg className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <p className="text-[10.5px] text-stone-400 leading-relaxed">
            Gandia organiza tu documentación. La autorización oficial es competencia de SENASICA.
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-[10px] bg-red-50 dark:bg-red-950/30 border border-red-200/70">
            <svg className="w-3.5 h-3.5 text-red-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <p className="text-[11.5px] text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <button
          onClick={handleCrear}
          disabled={loading}
          className="w-full py-2.5 rounded-[10px] bg-[#2FAF8F] text-white text-[12px] font-semibold hover:bg-[#27a07f] transition-colors border-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creando trámite…</>
          ) : 'Crear trámite →'}
        </button>
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PASO 2 — DOCUMENTOS
  // ══════════════════════════════════════════════════════════════════════════

  const tipoLabel = TIPOS.find(t => t.value === tipo)?.label ?? tipo
  const tipoColor = TIPOS.find(t => t.value === tipo)?.color ?? '#2FAF8F'
  const uppFinal  = usarCustom ? uppCustom : uppSel

  return (
    <div className="flex flex-col gap-4">

      {/* Banner de éxito */}
      <div
        className="flex items-center gap-3 p-3.5 rounded-[12px] border"
        style={{ background: `${tipoColor}08`, borderColor: `${tipoColor}25` }}
      >
        <svg className="w-4 h-4 shrink-0" style={{ color: tipoColor }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        <div className="min-w-0">
          <p className="text-[12.5px] font-semibold text-stone-700 dark:text-stone-200">
            Trámite creado · {tipoLabel}
          </p>
          <p className="text-[10.5px] text-stone-400 dark:text-stone-500 mt-0.5 truncate">
            {uppFinal} · Folio #{tramiteId}
          </p>
        </div>
      </div>

      {/* Tabs subir / existentes */}
      <div className="flex gap-1 bg-stone-100 dark:bg-stone-800/60 rounded-[10px] p-1">
        {([
          { id: 'subir',      label: 'Subir documentos' },
          { id: 'existentes', label: 'Mis documentos'   },
        ] as { id: DocTab; label: string }[]).map(t => (
          <button
            key={t.id}
            onClick={() => setDocTab(t.id)}
            className={`flex-1 py-1.5 rounded-[7px] text-[11.5px] font-medium transition-all border-0 cursor-pointer ${
              docTab === t.id
                ? 'bg-white dark:bg-stone-700 text-stone-800 dark:text-stone-100 shadow-sm'
                : 'text-stone-500 dark:text-stone-400 bg-transparent'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Widget correspondiente */}
      {docTab === 'subir'      && <DocSubidaWidget />}
      {docTab === 'existentes' && <DocExpedienteWidget />}

      {/* Volver */}
      <button
        onClick={() => { setPaso('form'); setTramiteId(null); setError(null) }}
        className="text-[11px] text-stone-400 hover:text-stone-600 transition-colors bg-transparent border-0 cursor-pointer w-fit mx-auto"
      >
        ← Crear otro trámite
      </button>

      {/* Cancelar trámite */}
      <CancelarTramite tramiteId={tramiteId} onCancelado={() => { setPaso('form'); setTramiteId(null) }} />
    </div>
  )
}

const inp = 'w-full px-3 py-2 text-[12px] bg-stone-50 dark:bg-stone-800/60 border border-stone-200/70 dark:border-stone-800 rounded-[8px] text-stone-700 dark:text-stone-200 placeholder-stone-300 dark:placeholder-stone-600 outline-none focus:border-[#2FAF8F]/50 transition-colors'
const lbl = 'text-[10.5px] font-medium text-stone-400 dark:text-stone-500'

// ─── Cancelar trámite ─────────────────────────────────────────────────────────

function CancelarTramite({ tramiteId, onCancelado }: { tramiteId: string | null; onCancelado: () => void }) {
  const [confirm,   setConfirm]   = useState(false)
  const [canceling, setCanceling] = useState(false)

  if (!tramiteId) return null

  const handleCancelar = async () => {
    setCanceling(true)
    const tid = parseInt(tramiteId)
    // Borrar en orden: eventos → estados → entidad
    const evRes = await supabase.from('eventos').select('id').eq('entidad_id', tid)
    const evIds = (evRes.data ?? []).map((e: { id: number }) => e.id)
    if (evIds.length) {
      await supabase.from('evidencias').delete().in('evento_id', evIds)
      await supabase.from('decisiones').delete().in('evento_id', evIds)
      await supabase.from('eventos').delete().eq('entidad_id', tid)
    }
    await supabase.from('estados').delete().eq('entidad_id', tid)
    await supabase.from('entidades').delete().eq('id', tid)
    setCanceling(false)
    onCancelado()
  }

  if (!confirm) return (
    <button
      onClick={() => setConfirm(true)}
      className="text-[11px] text-red-400 hover:text-red-600 transition-colors bg-transparent border-0 cursor-pointer w-fit mx-auto block"
    >
      Cancelar este trámite
    </button>
  )

  return (
    <div className="flex flex-col gap-2 p-3.5 rounded-[10px] bg-red-50 dark:bg-red-950/30 border border-red-200/70 dark:border-red-900/50">
      <p className="text-[12px] font-medium text-red-700 dark:text-red-300">¿Cancelar el trámite?</p>
      <p className="text-[11px] text-red-500 dark:text-red-400">Esta acción borrará el trámite recién creado de la BD.</p>
      <div className="flex gap-2 mt-1">
        <button onClick={() => setConfirm(false)} className="flex-1 py-1.5 rounded-[7px] text-[11.5px] text-stone-500 border border-stone-200/70 dark:border-stone-800 bg-transparent cursor-pointer">
          No, continuar
        </button>
        <button
          onClick={handleCancelar}
          disabled={canceling}
          className="flex-1 py-1.5 rounded-[7px] text-[11.5px] text-white bg-red-500 hover:bg-red-600 border-0 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
        >
          {canceling ? <><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />Cancelando…</> : 'Sí, cancelar'}
        </button>
      </div>
    </div>
  )
}