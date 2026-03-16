/**
 * VerificationColaWidget — verification:cola
 * v3 · Filtros internos + quick-verify inline + stat bar refinado
 */

import { useState } from 'react'

export interface ItemVerificacion {
  id:        number
  ts:        string
  origen:    'ia' | 'usuario'
  actor:     string
  dominio:   string
  accion:    string
  animal?:   string
  arete?:    string
  severidad: 'alta' | 'media' | 'baja'
  estado:    'pendiente' | 'verificado' | 'rechazado'
}

interface Props {
  items:          ItemVerificacion[]
  onSelectItem?:  (item: ItemVerificacion) => void
  onQuickVerify?: (item: ItemVerificacion) => void
}

const DOMINIO_LABEL: Record<string, string> = {
  monitoreo:     'Monitoreo',
  sanidad:       'Sanidad',
  certificacion: 'Certificación',
  gemelo:        'Gemelo',
  biometria:     'Biometría',
  pasaporte:     'Pasaporte',
}

const SEV: Record<string, { dot: string }> = {
  alta:  { dot: 'bg-red-400'                        },
  media: { dot: 'bg-amber-400'                      },
  baja:  { dot: 'bg-stone-300 dark:bg-stone-600'    },
}

const SEV_ORDER: Record<string, number> = { alta: 0, media: 1, baja: 2 }

type FilterKey = 'todas' | 'urgentes' | 'ia' | 'usuario'


export default function VerificationColaWidget({ items, onSelectItem, onQuickVerify }: Props) {
  const [hovered,  setHovered]  = useState<number | null>(null)
  const [filter,   setFilter]   = useState<FilterKey>('todas')
  const [verified, setVerified] = useState<Set<number>>(new Set())

  const pendientes = items
    .filter(i => i.estado === 'pendiente' && !verified.has(i.id))
    .sort((a, b) => SEV_ORDER[a.severidad] - SEV_ORDER[b.severidad])

  const alta  = pendientes.filter(i => i.severidad === 'alta').length
  const media = pendientes.filter(i => i.severidad === 'media').length
  const baja  = pendientes.filter(i => i.severidad === 'baja').length
  const total = pendientes.length

  const filtered = pendientes.filter(i => {
    if (filter === 'urgentes') return i.severidad === 'alta'
    if (filter === 'ia')       return i.origen === 'ia'
    if (filter === 'usuario')  return i.origen === 'usuario'
    return true
  })

  const handleQuickVerify = (e: React.MouseEvent, item: ItemVerificacion) => {
    e.stopPropagation()
    setVerified(prev => new Set([...prev, item.id]))
    onQuickVerify?.(item)
  }

  return (
    <div className="flex flex-col gap-0 select-none">

      {/* ── Header compacto ──────────────────────────────────────────── */}
      <div className="flex items-end justify-between pb-4">
        <div className="flex items-end gap-3">
          <span className="text-[30px] font-semibold tracking-tight text-stone-800 dark:text-stone-100 leading-none tabular-nums">
            {total}
          </span>
          <div className="flex items-center gap-2.5 pb-[3px]">
            {alta > 0 && (
              <button
                onClick={() => setFilter(f => f === 'urgentes' ? 'todas' : 'urgentes')}
                className="flex items-center gap-1.5 cursor-pointer border-0 bg-transparent p-0 group"
              >
                <span className={`w-[6px] h-[6px] rounded-full bg-red-400 shrink-0 transition-transform duration-150 ${filter === 'urgentes' ? 'scale-125' : 'group-hover:scale-110'}`} />
                <span className={`text-[12px] tabular-nums transition-colors duration-150 ${filter === 'urgentes' ? 'text-stone-700 dark:text-stone-200 font-medium' : 'text-stone-400 dark:text-stone-500'}`}>
                  {alta}u
                </span>
              </button>
            )}
            {media > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="w-[6px] h-[6px] rounded-full bg-amber-400 shrink-0" />
                <span className="text-[12px] text-stone-400 dark:text-stone-500 tabular-nums">{media}m</span>
              </div>
            )}
            {baja > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="w-[6px] h-[6px] rounded-full bg-stone-300 dark:bg-stone-600 shrink-0" />
                <span className="text-[12px] text-stone-400 dark:text-stone-500 tabular-nums">{baja}b</span>
              </div>
            )}
            {total === 0 && (
              <span className="text-[12px] text-stone-300 dark:text-stone-600 pb-[3px]">pendientes</span>
            )}
          </div>
        </div>

        {/* Filtro origen — pill toggle derecho */}
        <div className="flex items-center gap-[2px] pb-[3px]">
          {(['todas','ia','usuario'] as FilterKey[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`h-[24px] px-3 rounded-full text-[11.5px] font-medium cursor-pointer border-0 transition-all duration-150 capitalize ${
                filter === f
                  ? 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-200'
                  : 'bg-transparent text-stone-300 dark:text-stone-600 hover:text-stone-500 dark:hover:text-stone-400'
              }`}
            >
              {f === 'todas' ? 'Todas' : f === 'ia' ? 'IA' : 'Usuario'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Progress bar total (sutil) ────────────────────────────────── */}
      {total > 0 && (
        <div className="flex gap-[2px] mb-4 h-[2px] rounded-full overflow-hidden">
          {alta  > 0 && <div className="bg-red-400/60"    style={{ flex: alta  }} />}
          {media > 0 && <div className="bg-amber-400/50"  style={{ flex: media }} />}
          {baja  > 0 && <div className="bg-stone-200 dark:bg-stone-700" style={{ flex: baja  }} />}
        </div>
      )}

      {/* ── Divisor ──────────────────────────────────────────────────── */}
      <div className="h-px bg-stone-100 dark:bg-stone-800/60 mb-1" />

      {/* ── Lista ────────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-12">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-stone-200 dark:text-stone-700">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <p className="text-[11px] text-stone-300 dark:text-stone-600 tracking-wide">
            {filter === 'todas' ? 'Cola vacía' : `Sin elementos · ${filter}`}
          </p>
        </div>
      ) : (
        <div className="flex flex-col">
          {filtered.map((item, idx) => {
            const isHov = hovered === item.id
            return (
              <div key={item.id}>
                <div
                  onClick={() => onSelectItem?.(item)}
                  onMouseEnter={() => setHovered(item.id)}
                  onMouseLeave={() => setHovered(null)}
                  className="relative flex items-center gap-3 py-[13px] -mx-2 px-2 rounded-[8px] cursor-pointer transition-all duration-150"
                  style={{ background: isHov ? 'rgba(0,0,0,0.022)' : 'transparent' }}
                >
                  {/* Dot severidad */}
                  <div className="shrink-0">
                    <span className={`block w-[6px] h-[6px] rounded-full ${SEV[item.severidad].dot}`} />
                  </div>

                  {/* Contenido */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-[13.5px] font-medium leading-snug mb-[4px] transition-colors duration-150 truncate ${
                      isHov ? 'text-stone-900 dark:text-stone-50' : 'text-stone-700 dark:text-stone-200'
                    }`}>
                      {item.accion}
                    </p>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11.5px] font-mono text-stone-400 dark:text-stone-500">
                        {item.origen === 'ia' ? 'IA' : 'USR'}
                      </span>
                      <span className="text-stone-200 dark:text-stone-700 text-[10px]">·</span>
                      <span className="text-[11.5px] text-stone-400 dark:text-stone-500">
                        {DOMINIO_LABEL[item.dominio] ?? item.dominio}
                      </span>
                      {item.animal && (
                        <>
                          <span className="text-stone-200 dark:text-stone-700 text-[10px]">·</span>
                          <span className="text-[11.5px] text-stone-400 dark:text-stone-500 truncate">{item.animal}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Right — tiempo + acciones en hover */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[11px] font-mono transition-opacity duration-150 ${
                      isHov ? 'opacity-0 w-0 overflow-hidden' : 'text-stone-300 dark:text-stone-600'
                    }`}>
                      {item.ts}
                    </span>

                    {/* Quick actions — aparecen en hover */}
                    <div className={`flex items-center gap-1.5 transition-all duration-150 ${
                      isHov ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2 pointer-events-none'
                    }`}>
                      {/* Ver detalle — botón limpio con borde */}
                      <div
                        className="h-7 px-3 flex items-center rounded-[6px] border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 text-[11.5px] font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 hover:border-stone-400 dark:hover:border-stone-500 transition-all duration-100 cursor-pointer select-none"
                        onClick={(e) => { e.stopPropagation(); onSelectItem?.(item) }}
                      >
                        Ver
                      </div>
                      {/* Verificar — botón sólido, sin transparencia */}
                      <div
                        className="h-7 px-3 flex items-center gap-1.5 rounded-[6px] border border-stone-800 dark:border-stone-200 bg-stone-800 dark:bg-stone-100 text-[11.5px] font-semibold text-white dark:text-stone-900 hover:bg-stone-700 dark:hover:bg-white transition-all duration-100 cursor-pointer select-none"
                        onClick={(e) => handleQuickVerify(e, item)}
                      >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        Verificar
                      </div>
                    </div>

                    {/* Flecha */}
                    <svg
                      width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                      strokeWidth="2" strokeLinecap="round"
                      className={`transition-all duration-150 ${
                        isHov ? 'text-stone-400 dark:text-stone-500 translate-x-0.5' : 'text-stone-200 dark:text-stone-700'
                      }`}
                    >
                      <line x1="5" y1="12" x2="19" y2="12"/>
                      <polyline points="12 5 19 12 12 19"/>
                    </svg>
                  </div>
                </div>

                {idx < filtered.length - 1 && (
                  <div className="h-px bg-stone-100/80 dark:bg-stone-800/40 ml-[18px]" />
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}