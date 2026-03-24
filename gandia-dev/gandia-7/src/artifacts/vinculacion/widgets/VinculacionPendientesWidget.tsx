/**
 * VinculacionPendientesWidget
 * Solicitudes de vinculación recibidas o enviadas, esperando respuesta.
 */

import { useState } from 'react'
import type { VinculacionPendiente } from '../../artifactTypes'

const VIN_COLOR = '#0ea5e9'



const TIPO_META: Record<VinculacionPendiente['tipo'], { label: string; color: string }> = {
  sanitario: { label: 'Sanitario', color: '#22c55e' },
  comercial: { label: 'Comercial', color: '#f97316' },
  auditoria: { label: 'Auditoría', color: '#a855f7' },
  union:     { label: 'Unión',     color: VIN_COLOR  },
}

interface Props {
  pendientes?: VinculacionPendiente[]
  onAceptar?:  (id: string) => void | Promise<void>
  onRechazar?: (id: string) => void | Promise<void>
}

export default function VinculacionPendientesWidget({
  pendientes = [],
  onAceptar,
  onRechazar,
}: Props) {
  const [resueltos, setResueltos] = useState<Set<string>>(new Set())
  const [respuestas, setRespuestas] = useState<Record<string, 'aceptada' | 'rechazada'>>({})

  const resolver = (id: string, accion: 'aceptada' | 'rechazada') => {
    setResueltos(s => new Set([...s, id]))
    setRespuestas(r => ({ ...r, [id]: accion }))
    if (accion === 'aceptada') onAceptar?.(id)
    else onRechazar?.(id)
  }

  const visibles = pendientes.filter(p => !resueltos.has(p.id))
  const recibidas = visibles.filter(p => p.direccion === 'recibida')
  const enviadas  = visibles.filter(p => p.direccion === 'enviada')

  return (
    <div className="flex flex-col gap-3">

      {pendientes.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d6d3d1" strokeWidth="1.5" strokeLinecap="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <p className="text-[11px] text-stone-400 dark:text-stone-500">Sin solicitudes pendientes</p>
        </div>
      )}

      {/* Recibidas */}
      {recibidas.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="font-mono text-[9px] uppercase tracking-[1px] text-stone-400 dark:text-stone-500">Recibidas</p>
          {recibidas.map(p => {
            const meta = TIPO_META[p.tipo]
            return (
              <div key={p.id} className="flex flex-col gap-2 p-3 rounded-[10px] border border-stone-200 dark:border-stone-700/60 bg-white dark:bg-stone-800/20">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-1.5 h-1.5 rounded-full shrink-0 mt-0.5" style={{ background: meta.color }}/>
                    <div className="min-w-0">
                      <p className="text-[12px] font-medium text-stone-700 dark:text-stone-200 truncate">{p.entidad}</p>
                      <p className="text-[10px] text-stone-400">{meta.label} · {p.fecha}</p>
                    </div>
                  </div>
                </div>
                {p.mensaje && (
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 italic pl-3.5 border-l-2 border-stone-100 dark:border-stone-700">
                    "{p.mensaje}"
                  </p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => resolver(p.id, 'aceptada')}
                    className="flex-1 py-1.5 rounded-[7px] text-[11px] font-semibold text-white border-0 cursor-pointer hover:opacity-90 transition-all"
                    style={{ background: VIN_COLOR }}
                  >
                    Aceptar
                  </button>
                  <button
                    onClick={() => resolver(p.id, 'rechazada')}
                    className="flex-1 py-1.5 rounded-[7px] text-[11px] font-medium text-stone-500 border border-stone-200 dark:border-stone-700/60 bg-transparent cursor-pointer hover:text-red-500 hover:border-red-200 transition-all"
                  >
                    Rechazar
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Enviadas */}
      {enviadas.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="font-mono text-[9px] uppercase tracking-[1px] text-stone-400 dark:text-stone-500">Enviadas · esperando respuesta</p>
          {enviadas.map(p => {
            const meta = TIPO_META[p.tipo]
            return (
              <div key={p.id} className="flex items-center justify-between px-3 py-2.5 rounded-[10px] border border-stone-100 dark:border-stone-800/60 bg-stone-50/50 dark:bg-stone-800/10">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-1.5 h-1.5 rounded-full shrink-0 bg-amber-400"/>
                  <div className="min-w-0">
                    <p className="text-[12px] font-medium text-stone-700 dark:text-stone-200 truncate">{p.entidad}</p>
                    <p className="text-[10px] text-stone-400">{meta.label} · {p.fecha}</p>
                  </div>
                </div>
                <span className="font-mono text-[9px] text-amber-500 dark:text-amber-400 shrink-0">Pendiente</span>
              </div>
            )
          })}
        </div>
      )}

      {/* Resueltas en esta sesión */}
      {Object.entries(respuestas).map(([id, accion]) => {
        const p = pendientes.find(x => x.id === id)!
        return (
          <div key={id} className="flex items-center gap-2 px-3 py-2 rounded-[8px] bg-stone-50 dark:bg-stone-800/20 opacity-60">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={accion === 'aceptada' ? '#22c55e' : '#ef4444'} strokeWidth="2.5" strokeLinecap="round">
              {accion === 'aceptada'
                ? <polyline points="20 6 9 17 4 12"/>
                : <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
              }
            </svg>
            <p className="text-[11px] text-stone-400">{p?.entidad} · {accion}</p>
          </div>
        )
      })}

    </div>
  )
}