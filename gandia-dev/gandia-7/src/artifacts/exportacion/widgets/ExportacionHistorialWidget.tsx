/**
 * ExportacionHistorialWidget — NUEVO
 * Lista de solicitudes guardadas. Standalone o con onSelect.
 */

import type { SolicitudGuardada } from '../../artifactTypes'

const EXPORT_COLOR = '#f97316'

const MOCK_HISTORIAL: SolicitudGuardada[] = [
  {
    id: '1', folio: 'SOL-2025-0041',
    solicitud: { psg: 'DGO-UPP-12345', upp: 'Rancho El Mezquite', sexo: 'Macho', folioFactura: 'FAC-2025-118' },
    rows: [], estado: 'borrador', fecha: '08 Mar 2025',
  },
  {
    id: '2', folio: 'SOL-2025-0038',
    solicitud: { psg: 'DGO-UPP-12345', upp: 'Rancho El Mezquite', sexo: 'Macho', folioFactura: 'FAC-2025-115' },
    rows: [], estado: 'lista', fecha: '01 Mar 2025',
  },
  {
    id: '3', folio: 'SOL-2025-0031',
    solicitud: { psg: 'DGO-UPP-12345', upp: 'Rancho El Mezquite', sexo: 'Hembra', folioFactura: 'FAC-2025-099' },
    rows: [], estado: 'exportada', fecha: '12 Feb 2025',
  },
  {
    id: '4', folio: 'SOL-2025-0024',
    solicitud: { psg: 'DGO-UPP-12345', upp: 'Rancho El Mezquite', sexo: 'Macho', folioFactura: 'FAC-2025-080' },
    rows: [], estado: 'exportada', fecha: '28 Ene 2025',
  },
]

const ESTADO_META: Record<SolicitudGuardada['estado'], { label: string; dot: string; text: string }> = {
  borrador:  { label: 'Borrador',  dot: 'bg-amber-400',  text: 'text-amber-600 dark:text-amber-400'  },
  lista:     { label: 'Lista',     dot: 'bg-green-400',  text: 'text-green-600 dark:text-green-400'  },
  exportada: { label: 'Exportada', dot: 'bg-stone-400',  text: 'text-stone-500 dark:text-stone-400'  },
}

interface Props {
  historial?:   SolicitudGuardada[]
  selectedId?:  string
  onSelect?:    (s: SolicitudGuardada) => void
  onNueva?:     () => void
}

export default function ExportacionHistorialWidget({
  historial = MOCK_HISTORIAL,
  selectedId,
  onSelect,
  onNueva,
}: Props) {
  return (
    <div className="flex flex-col">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100 dark:border-stone-800">
        <p className="text-[11px] font-semibold text-stone-600 dark:text-stone-300">Solicitudes</p>
        {onNueva && (
          <button
            onClick={onNueva}
            className="flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-[6px] border-0 cursor-pointer text-white transition-all hover:opacity-90"
            style={{ background: EXPORT_COLOR }}
          >
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Nueva
          </button>
        )}
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-[3px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-stone-200 dark:[&::-webkit-scrollbar-thumb]:bg-stone-700">
        {historial.map(s => {
          const meta   = ESTADO_META[s.estado]
          const active = s.id === selectedId
          return (
            <button
              key={s.id}
              onClick={() => onSelect?.(s)}
              className={`w-full text-left px-4 py-3 border-b border-stone-100/50 dark:border-stone-800/50 cursor-pointer transition-all border-0 bg-transparent
                ${active ? 'bg-orange-50/60 dark:bg-orange-950/15' : 'hover:bg-stone-50 dark:hover:bg-stone-800/20'}`}
              style={active ? { borderLeft: `2px solid ${EXPORT_COLOR}` } : { borderLeft: '2px solid transparent' }}
            >
              <p className="font-mono text-[10.5px] font-semibold text-stone-700 dark:text-stone-200 mb-1">
                {s.folio}
              </p>
              <div className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${meta.dot}`}/>
                <span className={`text-[10px] ${meta.text}`}>{meta.label}</span>
                <span className="text-stone-300 dark:text-stone-600 text-[9px]">·</span>
                <span className="text-[10px] text-stone-400 dark:text-stone-500">{s.solicitud.sexo}</span>
              </div>
              <p className="text-[9.5px] text-stone-400 dark:text-stone-500 mt-0.5">{s.fecha}</p>
            </button>
          )
        })}
      </div>
    </div>
  )
}