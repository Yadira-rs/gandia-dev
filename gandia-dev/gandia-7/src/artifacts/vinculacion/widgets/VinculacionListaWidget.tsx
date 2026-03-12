/**
 * VinculacionListaWidget
 * Lista compacta de vinculaciones activas del rancho.
 * Inline en el chat o dentro del Módulo.
 */

import type { Vinculacion } from '../../artifactTypes'

const VIN_COLOR = '#0ea5e9'

const MOCK: Vinculacion[] = [
  { id: '1', entidad: 'MVZ Dr. García',       tipo: 'sanitario',  estado: 'activa',   fecha: '12 Ene 2025', expira: null },
  { id: '2', entidad: 'Exportadora Norte',    tipo: 'comercial',  estado: 'activa',   fecha: '01 Mar 2025', expira: 'Al cerrar lote' },
  { id: '3', entidad: 'Auditor SENASICA',     tipo: 'auditoria',  estado: 'activa',   fecha: '05 Mar 2025', expira: '04 Abr 2025' },
  { id: '4', entidad: 'Unión Ganadera DGO',   tipo: 'union',      estado: 'activa',   fecha: '10 Feb 2025', expira: null },
]

const TIPO_META: Record<Vinculacion['tipo'], { label: string; color: string; bg: string }> = {
  sanitario: { label: 'Sanitario', color: '#22c55e', bg: 'bg-green-50  dark:bg-green-950/20'  },
  comercial: { label: 'Comercial', color: '#f97316', bg: 'bg-orange-50 dark:bg-orange-950/20' },
  auditoria: { label: 'Auditoría', color: '#a855f7', bg: 'bg-purple-50 dark:bg-purple-950/20' },
  union:     { label: 'Unión',     color: VIN_COLOR, bg: 'bg-sky-50    dark:bg-sky-950/20'    },
}

interface Props {
  vinculaciones?: Vinculacion[]
  onExpand?:      () => void
  onNueva?:       () => void
  onRevocar?:     (id: string) => void
}

export default function VinculacionListaWidget({
  vinculaciones = MOCK,
  onExpand,
  onNueva,
  onRevocar,
}: Props) {
  const activas = vinculaciones.filter(v => v.estado === 'activa')

  return (
    <div className="flex flex-col gap-2">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: VIN_COLOR }}/>
          <p className="text-[12px] font-semibold text-stone-700 dark:text-stone-200">Vinculaciones activas</p>
          <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{ background: VIN_COLOR }}>
            {activas.length}
          </span>
        </div>
        {onNueva && (
          <button
            onClick={onNueva}
            className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-[6px] border-0 cursor-pointer text-white transition-all hover:opacity-90"
            style={{ background: VIN_COLOR }}
          >
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Nueva
          </button>
        )}
      </div>

      {/* Lista */}
      <div className="flex flex-col gap-1.5">
        {activas.map(v => {
          const meta = TIPO_META[v.tipo]
          return (
            <div
              key={v.id}
              className={`flex items-center justify-between px-3 py-2.5 rounded-[10px] border border-stone-100 dark:border-stone-800/60 ${meta.bg}`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: meta.color }}/>
                <div className="min-w-0">
                  <p className="text-[12px] font-medium text-stone-700 dark:text-stone-200 truncate">{v.entidad}</p>
                  <p className="text-[10px] text-stone-500 dark:text-stone-400">
                    {meta.label}{v.expira ? ` · exp. ${v.expira}` : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400"/>
                {onRevocar && (
                  <button
                    onClick={() => onRevocar(v.id)}
                    className="text-[9px] font-medium text-stone-400 dark:text-stone-500 hover:text-red-500 dark:hover:text-red-400 border-0 bg-transparent cursor-pointer transition-colors px-1"
                  >
                    Revocar
                  </button>
                )}
              </div>
            </div>
          )
        })}

        {activas.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d6d3d1" strokeWidth="1.5" strokeLinecap="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
            </svg>
            <p className="text-[11px] text-stone-400 dark:text-stone-500">Sin vinculaciones activas</p>
          </div>
        )}
      </div>

      {/* Ver módulo */}
      {onExpand && activas.length > 0 && (
        <button
          onClick={onExpand}
          className="flex items-center justify-center gap-1.5 py-2 rounded-[8px] text-[11px] text-stone-500 dark:text-stone-400 border border-stone-200 dark:border-stone-700/60 bg-white dark:bg-stone-800/40 cursor-pointer hover:text-stone-700 transition-all"
        >
          Gestionar vinculaciones
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/>
            <line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
          </svg>
        </button>
      )}
    </div>
  )
}