/**
 * ExportacionSolicitudWidget — crea o actualiza en Supabase
 * ARCHIVO → src/artifacts/exportacion/widgets/ExportacionSolicitudWidget.tsx
 */

import { useState, useEffect } from 'react'
import type { SolicitudData } from '../../artifactTypes'
import { crearSolicitud, actualizarSolicitud } from '../../../hooks/useExportacion'
import { supabase } from '../../../lib/supabaseClient'
export type { SolicitudData }

const EXPORT_COLOR = '#f97316'
const EMPTY: SolicitudData = { psg: '', upp: '', sexo: 'Macho', folioFactura: '' }

interface Props {
  data?:          SolicitudData
  onChange?:      (data: SolicitudData) => void
  solicitudId?:   string | null
  ranchoId?:      string | null
  userId?:        string | null
  onSave?:        (data: SolicitudData, municipioId: string) => void
  onCreated?:     (solicitudId: string) => void
  municipioId?:   string
  onMunicipioChange?: (id: string) => void
}

export default function ExportacionSolicitudWidget({
  data, onChange, solicitudId, ranchoId, userId, onSave, onCreated,
  municipioId: municipioIdProp, onMunicipioChange,
}: Props) {
  const [local,       setLocal]       = useState<SolicitudData>(data ?? EMPTY)
  const [saving,      setSaving]      = useState(false)
  const [saved,       setSaved]       = useState(false)
  const [dbError,     setDbError]     = useState<string | null>(null)
  const [municipioId, setMunicipioId] = useState(municipioIdProp ?? '')
  const [municipios,  setMunicipios]  = useState<{ id: string; nombre: string }[]>([])

  useEffect(() => {
    supabase.from('entidades').select('id, nombre').eq('tipo', 'municipio').order('nombre')
      .then(({ data }) => setMunicipios(data ?? []))
  }, [])

  const handleMunicipio = (id: string) => {
    setMunicipioId(id)
    onMunicipioChange?.(id)
  }

  const current = data ?? local

  const update = (field: keyof SolicitudData, value: string) => {
    const next = { ...current, [field]: value }
    if (onChange) onChange(next)
    else setLocal(next)
    setSaved(false)
    setDbError(null)
  }

  const handleSave = async () => {
    if (!current.psg.trim()) { setDbError('El PSG es obligatorio'); return }
    setSaving(true)
    setDbError(null)

    try {
      if (solicitudId) {
        // Actualizar solicitud existente
        const { error } = await actualizarSolicitud(solicitudId, current)
        if (error) throw new Error(error)
      } else if (ranchoId && userId) {
        // Crear nueva solicitud en BD
        const { solicitud: newSol, error } = await crearSolicitud(current, ranchoId, userId)
        if (error || !newSol) throw new Error(error ?? 'Error al crear')
        onCreated?.(newSol.id)
      }
      // Notificar al padre igual que antes
      onSave?.(current, municipioId)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e) {
      setDbError(e instanceof Error ? e.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const inp = 'w-full px-3 py-2.5 rounded-[8px] border border-stone-200 dark:border-stone-700/60 bg-white dark:bg-stone-900/60 text-[12.5px] text-stone-800 dark:text-stone-100 font-mono focus:outline-none focus:border-[#f97316]/60 focus:ring-1 focus:ring-[#f97316]/15 transition-all placeholder:text-stone-300 dark:placeholder:text-stone-600'
  const lbl = 'block text-[10px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-[0.06em] mb-1.5'

  const canSave = current.psg.trim().length > 0

  return (
    <div className="flex flex-col gap-4">

      {/* ── Encabezado ── */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[13px] font-semibold text-stone-800 dark:text-stone-100">Encabezado de solicitud</p>
          <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-0.5">Trámite Aretes Azules · SENASICA</p>
        </div>
        {solicitudId && (
          <span className="text-[9.5px] font-mono text-stone-400 dark:text-stone-500 bg-stone-100 dark:bg-stone-800/60 px-2 py-1 rounded-md">
            Guardada en BD
          </span>
        )}
      </div>

      {/* ── Campos ── */}
      <div className="flex flex-col gap-3.5">

        <div>
          <label className={lbl}>PSG / Clave Ganadero <span className="text-[#f97316]">*</span></label>
          <input className={inp} value={current.psg}
            onChange={e => update('psg', e.target.value)} placeholder="DGO-UPP-00000" />
        </div>

        <div>
          <label className={lbl}>Unidad de Producción Pecuaria (UPP)</label>
          <input className={inp} value={current.upp}
            onChange={e => update('upp', e.target.value)} placeholder="Nombre del rancho" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={lbl}>Sexo</label>
            <div className="flex gap-2">
              {(['Macho', 'Hembra'] as const).map(s => (
                <button key={s} onClick={() => update('sexo', s)}
                  className={`flex-1 py-2.5 rounded-[8px] text-[12px] font-semibold border cursor-pointer transition-all ${
                    current.sexo === s
                      ? 'text-white border-transparent'
                      : 'text-stone-400 dark:text-stone-500 border-stone-200 dark:border-stone-700/60 bg-transparent hover:border-stone-300'
                  }`}
                  style={current.sexo === s ? { background: EXPORT_COLOR } : {}}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className={lbl}>No. Cabezas</label>
            <div className="px-3 py-2.5 rounded-[8px] border border-stone-200 dark:border-stone-700/60 bg-stone-50 dark:bg-stone-900/40 flex items-center gap-2 h-[42px]">
              <p className="font-mono text-[15px] font-bold" style={{ color: EXPORT_COLOR }}>—</p>
              <p className="text-[10px] text-stone-400 dark:text-stone-500">auto</p>
            </div>
          </div>
        </div>

        <div>
          <label className={lbl}>Folio de Factura principal</label>
          <input className={inp} value={current.folioFactura}
            onChange={e => update('folioFactura', e.target.value)} placeholder="FAC-2025-000" />
          <p className="mt-1.5 text-[10px] text-stone-400 dark:text-stone-500">
            Se puede sobreescribir por arete individual en la tabla.
          </p>
        </div>
      </div>

      {/* ── Municipio ── */}
      <div>
        <label className={lbl}>Municipio <span className="text-[#f97316]">*</span></label>
        <select value={municipioId} onChange={e => handleMunicipio(e.target.value)}
          className={inp}>
          <option value="">Selecciona un municipio…</option>
          {municipios.map(m => (
            <option key={m.id} value={m.id}>{m.nombre}</option>
          ))}
        </select>
        {!municipioId && (
          <p className="mt-1.5 text-[10px] text-amber-500">Requerido para enviar el trámite a la Unión Ganadera</p>
        )}
      </div>

      {/* ── Error BD ── */}
      {dbError && (
        <p className="text-[11.5px] text-red-500 dark:text-red-400">{dbError}</p>
      )}

      {/* ── Botón guardar ── */}
      <button
        onClick={handleSave}
        disabled={saving || !canSave}
        className="w-full py-2.5 rounded-[10px] text-[12.5px] font-semibold text-white border-0 cursor-pointer transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        style={{ background: EXPORT_COLOR }}
      >
        {saving ? (
          <><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Guardando…</>
        ) : saved ? (
          <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>Guardado</>
        ) : (
          solicitudId ? 'Actualizar encabezado' : 'Guardar y continuar'
        )}
      </button>

    </div>
  )
}