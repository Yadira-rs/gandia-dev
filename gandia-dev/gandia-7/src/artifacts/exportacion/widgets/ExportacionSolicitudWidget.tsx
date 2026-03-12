/**
 * ExportacionSolicitudWidget
 * Formulario editable: PSG, UPP, Sexo, Folio Factura.
 * Puede funcionar standalone (estado interno) o controlado (props).
 */

import { useState } from 'react'
import type { SolicitudData } from '../../artifactTypes'
export type { SolicitudData }

const EXPORT_COLOR = '#f97316'

const EMPTY: SolicitudData = { psg: '', upp: '', sexo: 'Macho', folioFactura: '' }

interface Props {
  data?:     SolicitudData
  onChange?: (data: SolicitudData) => void
  onSave?:   (data: SolicitudData) => void
}

export default function ExportacionSolicitudWidget({ data, onChange, onSave }: Props) {
  const [local, setLocal] = useState<SolicitudData>(data ?? EMPTY)
  const [saved, setSaved] = useState(false)

  const current = data ?? local

  const update = (field: keyof SolicitudData, value: string) => {
    const next = { ...current, [field]: value }
    if (onChange) onChange(next)
    else setLocal(next)
    setSaved(false)
  }

  const handleSave = () => {
    if (onSave) onSave(current)
    else if (onChange) onChange(current)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const label = 'block font-mono text-[9px] uppercase tracking-[1px] text-stone-400 dark:text-stone-500 mb-1'
  const input = 'w-full px-3 py-2 rounded-[8px] border border-stone-200 dark:border-stone-700/60 bg-white dark:bg-stone-800/40 text-[12px] text-stone-800 dark:text-stone-100 font-mono focus:outline-none focus:border-[#f97316]/60 focus:ring-1 focus:ring-[#f97316]/20 transition-all'

  return (
    <div className="flex flex-col gap-3">

      {/* Banner */}
      <div className="p-3.5 rounded-[12px] bg-orange-50/50 dark:bg-orange-950/10 border border-orange-100 dark:border-orange-900/30">
        <p className="text-[11px] font-semibold text-orange-700 dark:text-orange-400">
          Solicitud de Folio · Trámite de Aretes Azules SENASICA
        </p>
        <p className="text-[10.5px] text-stone-400 dark:text-stone-500 mt-0.5">
          Encabezado del documento oficial
        </p>
      </div>

      {/* PSG */}
      <div>
        <label className={label}>PSG / Clave Ganadero</label>
        <input
          className={input}
          value={current.psg}
          onChange={e => update('psg', e.target.value)}
          placeholder="DGO-UPP-00000"
        />
      </div>

      {/* UPP */}
      <div>
        <label className={label}>Unidad de Producción Pecuaria (UPP)</label>
        <input
          className={input}
          value={current.upp}
          onChange={e => update('upp', e.target.value)}
          placeholder="Nombre del rancho"
        />
      </div>

      {/* Sexo + Folio */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={label}>Sexo</label>
          <div className="flex gap-2">
            {(['Macho', 'Hembra'] as const).map(s => (
              <button
                key={s}
                onClick={() => update('sexo', s)}
                className="flex-1 py-2 rounded-[8px] text-[12px] font-medium border cursor-pointer transition-all"
                style={{
                  background:  current.sexo === s ? EXPORT_COLOR : 'transparent',
                  color:       current.sexo === s ? 'white' : '#78716c',
                  borderColor: current.sexo === s ? EXPORT_COLOR : '#e7e5e4',
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className={label}>No. Cabezas</label>
          <div className="px-3 py-2 rounded-[8px] border border-stone-200 dark:border-stone-700/60 bg-stone-50 dark:bg-stone-800/20 flex items-center gap-2 h-[36px]">
            <p className="font-mono text-[14px] font-bold" style={{ color: EXPORT_COLOR }}>—</p>
            <p className="text-[10px] text-stone-400 dark:text-stone-500">Automático</p>
          </div>
        </div>
      </div>

      {/* Folio factura */}
      <div>
        <label className={label}>Folio de Factura principal</label>
        <input
          className={input}
          value={current.folioFactura}
          onChange={e => update('folioFactura', e.target.value)}
          placeholder="FAC-2025-000"
        />
        <p className="mt-1 text-[10px] text-stone-400 dark:text-stone-500">
          Se pre-rellena al capturar aretes — puedes usar otros folios por arete.
        </p>
      </div>

      {/* Guardar */}
      <button
        onClick={handleSave}
        className="w-full py-2.5 rounded-[10px] text-[12px] font-semibold text-white border-0 cursor-pointer transition-all hover:opacity-90 flex items-center justify-center gap-2"
        style={{ background: EXPORT_COLOR }}
      >
        {saved
          ? <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>Guardado</>
          : 'Guardar encabezado'
        }
      </button>

    </div>
  )
}