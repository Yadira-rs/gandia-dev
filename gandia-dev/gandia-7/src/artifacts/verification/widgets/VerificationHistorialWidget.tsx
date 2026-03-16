/**
 * VerificationHistorialWidget — verification:historial
 * v3 · Filtro resultado · Observación expandible · Firma institucional
 */

import { useState } from 'react'

export interface ItemHistorial {
  id:           number
  ts:           string
  tsFormal:     string
  origen:       'ia' | 'usuario'
  actor:        string
  verificador:  string
  accion:       string
  animal?:      string
  arete?:       string
  dominio:      string
  resultado:    'verificado' | 'rechazado'
  observacion?: string
}

interface Props {
  historial: ItemHistorial[]
}

const DOMINIO_LABEL: Record<string, string> = {
  monitoreo:     'Monitoreo',
  sanidad:       'Sanidad',
  certificacion: 'Certificación',
  gemelo:        'Gemelo',
  biometria:     'Biometría',
  pasaporte:     'Pasaporte',
}

function groupByDate(items: ItemHistorial[]): { label: string; items: ItemHistorial[] }[] {
  const map = new Map<string, ItemHistorial[]>()
  for (const item of items) {
    const label =
      item.ts === 'hoy' || item.ts === 'ayer' || item.ts.includes('ago')
        ? item.ts
        : item.tsFormal.split(' ').slice(0, 3).join(' ')
    if (!map.has(label)) map.set(label, [])
    map.get(label)!.push(item)
  }
  return Array.from(map.entries()).map(([label, items]) => ({ label, items }))
}

type FilterH = 'todas' | 'verificado' | 'rechazado'

export default function VerificationHistorialWidget({ historial }: Props) {
  const [filter,   setFilter]   = useState<FilterH>('todas')
  const [expanded, setExpanded] = useState<Set<number>>(new Set())

  const verificados = historial.filter(i => i.resultado === 'verificado').length
  const rechazados  = historial.filter(i => i.resultado === 'rechazado').length

  const filtered = historial.filter(i =>
    filter === 'todas' ? true : i.resultado === filter
  )
  const groups = groupByDate(filtered)

  const toggleExpand = (id: number) =>
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })

  return (
    <div className="flex flex-col gap-0 select-none">

      {/* ── Header ───────────────────────────────────────────────────── */}
      <div className="flex items-end justify-between pb-4">
        <div className="flex items-end gap-3">
          <span className="text-[30px] font-semibold tracking-tight text-stone-800 dark:text-stone-100 leading-none tabular-nums">
            {historial.length}
          </span>
          <div className="flex items-center gap-2.5 pb-[3px]">
            {verificados > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="w-[5px] h-[5px] rounded-full bg-[#2FAF8F] shrink-0" />
                <span className="text-[10.5px] text-stone-400 dark:text-stone-500 tabular-nums">{verificados}v</span>
              </div>
            )}
            {rechazados > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="w-[5px] h-[5px] rounded-full bg-red-400 shrink-0" />
                <span className="text-[10.5px] text-stone-400 dark:text-stone-500 tabular-nums">{rechazados}r</span>
              </div>
            )}
          </div>
        </div>

        {/* Filtro resultado */}
        <div className="flex items-center gap-[2px] pb-[3px]">
          {(['todas', 'verificado', 'rechazado'] as FilterH[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`h-[24px] px-3 rounded-full text-[11.5px] font-medium cursor-pointer border-0 transition-all duration-150 ${
                filter === f
                  ? 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-200'
                  : 'bg-transparent text-stone-300 dark:text-stone-600 hover:text-stone-500 dark:hover:text-stone-400'
              }`}
            >
              {f === 'todas' ? 'Todas' : f === 'verificado' ? '✓' : '✕'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Progress bar ─────────────────────────────────────────────── */}
      {historial.length > 0 && (
        <div className="flex gap-[2px] mb-4 h-[2px] rounded-full overflow-hidden">
          <div className="bg-[#2FAF8F]/45" style={{ flex: verificados }} />
          {rechazados > 0 && <div className="bg-red-400/45" style={{ flex: rechazados }} />}
        </div>
      )}

      {/* ── Divisor ──────────────────────────────────────────────────── */}
      <div className="h-px bg-stone-100 dark:bg-stone-800/60 mb-4" />

      {/* ── Timeline ─────────────────────────────────────────────────── */}
      <style>{`
        .hist-scroll::-webkit-scrollbar { width: 3px }
        .hist-scroll::-webkit-scrollbar-track { background: transparent }
        .hist-scroll::-webkit-scrollbar-thumb { background: rgba(120,113,108,0.18); border-radius: 99px }
        .hist-scroll::-webkit-scrollbar-thumb:hover { background: rgba(120,113,108,0.38) }
        .dark .hist-scroll::-webkit-scrollbar-thumb { background: rgba(168,162,158,0.12) }
        .dark .hist-scroll::-webkit-scrollbar-thumb:hover { background: rgba(168,162,158,0.28) }
        .hist-scroll { scrollbar-width: thin; scrollbar-color: rgba(120,113,108,0.18) transparent }
      `}</style>
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-12">
          <p className="text-[11px] text-stone-300 dark:text-stone-600 tracking-wide">Sin registros</p>
        </div>
      ) : (
        <div className="hist-scroll overflow-y-auto max-h-[420px] pr-3 -mr-1 flex flex-col gap-6">
          {groups.map(({ label, items: groupItems }) => (
            <div key={label}>

              {/* Etiqueta de fecha */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[9.5px] font-mono uppercase tracking-[0.09em] text-stone-300 dark:text-stone-600 select-none whitespace-nowrap">
                  {label}
                </span>
                <div className="flex-1 h-px bg-stone-100 dark:bg-stone-800/60" />
              </div>

              {/* Items */}
              <div className="relative flex flex-col gap-0">
                {groupItems.length > 1 && (
                  <div className="absolute left-[9px] top-[18px] bottom-5 w-px bg-stone-100 dark:bg-stone-800/40" />
                )}

                {groupItems.map(item => {
                  const ok  = item.resultado === 'verificado'
                  const exp = expanded.has(item.id)
                  return (
                    <div key={item.id} className="relative flex gap-3.5 pb-4">

                      {/* Nodo timeline */}
                      <div className="shrink-0 z-10 mt-0.5">
                        <div className={`w-[19px] h-[19px] rounded-full flex items-center justify-center border ${
                          ok
                            ? 'border-[#2FAF8F]/35 bg-white dark:bg-stone-900'
                            : 'border-red-300/40 dark:border-red-800/40 bg-white dark:bg-stone-900'
                        }`}>
                          {ok
                            ? <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#2FAF8F" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                            : <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                          }
                        </div>
                      </div>

                      {/* Contenido */}
                      <div className="flex-1 min-w-0 pt-0.5">

                        {/* Acción + timestamp */}
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <p className="text-[13.5px] font-medium text-stone-700 dark:text-stone-200 leading-snug">
                            {item.accion}
                          </p>
                          <span className="text-[11px] font-mono text-stone-300 dark:text-stone-600 shrink-0 mt-0.5">
                            {item.ts}
                          </span>
                        </div>

                        {/* Meta */}
                        <div className="flex items-center gap-1.5 flex-wrap mb-2.5">
                          <span className="text-[11.5px] text-stone-400 dark:text-stone-500">
                            {DOMINIO_LABEL[item.dominio] ?? item.dominio}
                          </span>
                          <span className="text-stone-200 dark:text-stone-700 text-[10px]">·</span>
                          <span className="text-[11.5px] font-mono text-stone-400 dark:text-stone-500">
                            {item.origen === 'ia' ? 'IA' : 'USR'}: {item.actor}
                          </span>
                          {item.animal && (
                            <>
                              <span className="text-stone-200 dark:text-stone-700 text-[10px]">·</span>
                              <span className="text-[11.5px] text-stone-400 dark:text-stone-500">{item.animal}</span>
                            </>
                          )}
                        </div>

                        {/* Firma verificador */}
                        <div className="flex items-center gap-2 py-1.5 border-t border-stone-100 dark:border-stone-800/40">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-stone-300 dark:text-stone-600 shrink-0">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                            <circle cx="12" cy="7" r="4"/>
                          </svg>
                          <span className="text-[11.5px] font-medium text-stone-500 dark:text-stone-400">
                            {item.verificador}
                          </span>
                          <span className="text-stone-200 dark:text-stone-700 text-[10px]">·</span>
                          <span className="text-[11px] font-mono text-stone-300 dark:text-stone-600">
                            {item.tsFormal}
                          </span>

                          {/* Toggle nota */}
                          {item.observacion && (
                            <button
                              onClick={() => toggleExpand(item.id)}
                              className="ml-auto flex items-center gap-1 text-[11px] text-stone-300 dark:text-stone-600 hover:text-stone-500 dark:hover:text-stone-400 cursor-pointer border-0 bg-transparent p-0 transition-colors duration-150"
                            >
                              <svg
                                width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                strokeWidth="2.5" strokeLinecap="round"
                                className={`transition-transform duration-200 ${exp ? 'rotate-180' : ''}`}
                              >
                                <polyline points="6 9 12 15 18 9"/>
                              </svg>
                              nota
                            </button>
                          )}
                        </div>

                        {/* Observación expandible */}
                        {item.observacion && exp && (
                          <div className="mt-2 pl-3 border-l border-stone-200 dark:border-stone-700/50">
                            <p className="text-[12px] text-stone-400 dark:text-stone-500 leading-relaxed italic">
                              "{item.observacion}"
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}