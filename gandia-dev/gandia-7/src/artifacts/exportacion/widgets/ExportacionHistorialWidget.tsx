/**
 * ExportacionHistorialWidget — datos reales desde v_exportacion_historial
 * ARCHIVO → src/artifacts/exportacion/widgets/ExportacionHistorialWidget.tsx
 */

import { useEffect } from 'react'
import { useUser }    from '../../../context/UserContext'
import { useRanchoId } from '../../../hooks/useAnimales'
import {
  useExportacionHistorial,
  dbToSolicitudGuardada,
  eliminarSolicitud,
  type SolicitudConConteos,
} from '../../../hooks/useExportacion'
import type { SolicitudGuardada } from '../../artifactTypes'

const EXPORT_COLOR = '#f97316'

const ESTADO_META = {
  borrador:  { label: 'Borrador',  cls: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/40' },
  lista:     { label: 'Lista',     cls: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/40' },
  exportada: { label: 'Exportada', cls: 'text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-stone-800/60 border-stone-200 dark:border-stone-700/50' },
}

interface Props {
  selectedId?:     string
  onSelect?:       (s: SolicitudGuardada) => void
  onNueva?:        () => void
  refreshTrigger?: number   // incrementar para forzar refetch
}

export default function ExportacionHistorialWidget({ selectedId, onSelect, onNueva, refreshTrigger }: Props) {
  const { profile }  = useUser()
  const userId       = profile?.user_id ?? null
  const { ranchoId } = useRanchoId(userId)

  const { solicitudes, loading, error, refetch } = useExportacionHistorial(ranchoId)

  useEffect(() => { if (refreshTrigger !== undefined) refetch() }, [refreshTrigger]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleEliminar = async (e: React.MouseEvent, s: SolicitudConConteos) => {
    e.stopPropagation()
    if (!confirm(`¿Eliminar borrador ${s.folio_interno}?`)) return
    await eliminarSolicitud(s.id)
    refetch()
  }

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <div className="w-4 h-4 border-2 border-[#f97316] border-t-transparent rounded-full animate-spin"/>
    </div>
  )

  if (error) return (
    <div className="flex flex-col items-center gap-3 py-12 text-center px-6">
      <p className="text-[12px] text-stone-500 dark:text-stone-400">Error al cargar historial</p>
      <button onClick={refetch} className="text-[11px] text-[#f97316] cursor-pointer bg-transparent border-0">Reintentar</button>
    </div>
  )

  return (
    <div className="flex flex-col h-full">

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100 dark:border-stone-800/60 shrink-0">
        <div className="flex items-center gap-2">
          <p className="text-[12px] font-semibold text-stone-700 dark:text-stone-200">Solicitudes</p>
          {solicitudes.length > 0 && (
            <span className="text-[10px] font-mono text-stone-400 dark:text-stone-500 bg-stone-100 dark:bg-stone-800/60 px-1.5 py-0.5 rounded-md">
              {solicitudes.length}
            </span>
          )}
        </div>
        {onNueva && (
          <button
            onClick={onNueva}
            className="flex items-center gap-1 h-7 px-2.5 rounded-[7px] text-[11px] font-semibold text-white border-0 cursor-pointer transition-all hover:opacity-85 active:scale-[0.97]"
            style={{ background: EXPORT_COLOR }}
          >
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Nueva
          </button>
        )}
      </div>

      {/* ── Lista ── */}
      <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-[3px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-stone-200 dark:[&::-webkit-scrollbar-thumb]:bg-stone-700">

        {solicitudes.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-14 text-center px-6">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${EXPORT_COLOR}14` }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={EXPORT_COLOR} strokeWidth="1.75" strokeLinecap="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
              </svg>
            </div>
            <p className="text-[12px] text-stone-500 dark:text-stone-400">Sin solicitudes aún</p>
            {onNueva && (
              <button onClick={onNueva}
                className="text-[11px] font-semibold cursor-pointer bg-transparent border-0 p-0"
                style={{ color: EXPORT_COLOR }}>
                Crear primera solicitud
              </button>
            )}
          </div>
        )}

        {solicitudes.map(s => {
          const meta   = ESTADO_META[s.estado]
          const active = s.id === selectedId
          const sg     = dbToSolicitudGuardada(s)
          return (
            <button
              key={s.id}
              onClick={() => onSelect?.(sg)}
              className={`w-full text-left px-4 py-3.5 border-b border-stone-100/60 dark:border-stone-800/40 cursor-pointer transition-all bg-transparent border-l-2 group
                ${active
                  ? 'bg-orange-50/50 dark:bg-orange-950/10'
                  : 'hover:bg-stone-50 dark:hover:bg-stone-800/20 border-l-transparent'
                }`}
              style={active ? { borderLeftColor: EXPORT_COLOR } : {}}
            >
              {/* Folio + delete */}
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <p className="font-mono text-[11px] font-semibold text-stone-700 dark:text-stone-200">
                  {s.folio_interno}
                </p>
                <div className="flex items-center gap-1.5">
                  {/* Conteo de aretes */}
                  {s.total_aretes > 0 && (
                    <span className="font-mono text-[9.5px] font-semibold text-stone-400 dark:text-stone-500">
                      {s.total_aretes} aretes
                    </span>
                  )}
                  {/* Borrar borrador */}
                  {s.estado === 'borrador' && (
                    <span
                      onClick={e => handleEliminar(e, s)}
                      className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center rounded text-stone-300 hover:text-red-400 transition-all cursor-pointer"
                    >
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </span>
                  )}
                </div>
              </div>

              {/* Estado + sexo */}
              <div className="flex items-center gap-2">
                <span className={`text-[9.5px] font-semibold px-1.5 py-0.5 rounded-[5px] border ${meta.cls}`}>
                  {meta.label}
                </span>
                <span className="text-[10px] text-stone-400 dark:text-stone-500">{s.sexo}</span>
                {s.aretes_invalido > 0 && (
                  <span className="text-[9.5px] font-semibold text-red-500">
                    {s.aretes_invalido} inv.
                  </span>
                )}
              </div>

              {/* Fecha + PSG */}
              <div className="flex items-center gap-2 mt-1">
                <p className="text-[9.5px] text-stone-400 dark:text-stone-500">{sg.fecha}</p>
                {s.psg && (
                  <p className="text-[9.5px] font-mono text-stone-300 dark:text-stone-600 truncate">{s.psg}</p>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}