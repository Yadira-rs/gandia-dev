/**
 * VinculacionHistorialWidget
 * Vinculaciones pasadas: revocadas, expiradas, rechazadas.
 */

import type { VinculacionHistorial } from '../../artifactTypes'

const VIN_COLOR = '#0ea5e9'



const ESTADO_META: Record<VinculacionHistorial['estado'], { label: string; dot: string; text: string }> = {
  expirada:  { label: 'Expirada',  dot: 'bg-stone-400',  text: 'text-stone-500 dark:text-stone-400'  },
  revocada:  { label: 'Revocada',  dot: 'bg-red-400',    text: 'text-red-500 dark:text-red-400'      },
  rechazada: { label: 'Rechazada', dot: 'bg-amber-400',  text: 'text-amber-600 dark:text-amber-400'  },
}

const TIPO_COLOR: Record<VinculacionHistorial['tipo'], string> = {
  sanitario: '#22c55e',
  comercial: '#f97316',
  auditoria: '#a855f7',
  union:     VIN_COLOR,
}

const TIPO_LABEL: Record<VinculacionHistorial['tipo'], string> = {
  sanitario: 'Sanitario',
  comercial: 'Comercial',
  auditoria: 'Auditoría',
  union:     'Unión',
}

interface Props {
  historial?: VinculacionHistorial[]
}

export default function VinculacionHistorialWidget({ historial = [] }: Props) {
  return (
    <div className="flex flex-col gap-2">

      <p className="font-mono text-[9px] uppercase tracking-[1px] text-stone-400 dark:text-stone-500">
        Historial · {historial.length} registros
      </p>

      {historial.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <p className="text-[11px] text-stone-400 dark:text-stone-500">Sin registros históricos</p>
        </div>
      )}

      {historial.map(v => {
        const meta  = ESTADO_META[v.estado]
        const color = TIPO_COLOR[v.tipo]
        return (
          <div
            key={v.id}
            className="flex flex-col gap-1.5 px-3 py-2.5 rounded-[10px] border border-stone-100 dark:border-stone-800/50 bg-stone-50/40 dark:bg-stone-800/10 opacity-80"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-1.5 h-1.5 rounded-full shrink-0 mt-0.5" style={{ background: color }}/>
                <div className="min-w-0">
                  <p className="text-[12px] font-medium text-stone-600 dark:text-stone-300 truncate">{v.entidad}</p>
                  <p className="text-[10px] text-stone-400 dark:text-stone-500">{TIPO_LABEL[v.tipo]}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`}/>
                <span className={`text-[10px] ${meta.text}`}>{meta.label}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 pl-3.5">
              <p className="text-[9.5px] font-mono text-stone-400 dark:text-stone-500">
                {v.fechaInicio !== '—' ? `${v.fechaInicio} → ` : ''}{v.fechaFin}
              </p>
              {v.motivo && (
                <p className="text-[9.5px] text-stone-400 dark:text-stone-500 italic truncate">{v.motivo}</p>
              )}
            </div>
          </div>
        )
      })}

    </div>
  )
}