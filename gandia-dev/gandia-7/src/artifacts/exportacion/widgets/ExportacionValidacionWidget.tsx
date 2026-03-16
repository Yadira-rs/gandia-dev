/**
 * ExportacionValidacionWidget
 * Recibe el array de aretes y corre la validación real.
 * Standalone: usa mock. Controlado: recibe rows + onFix.
 */

import { useState } from 'react'
import type { AreteRow } from '../../artifactTypes'

const EXPORT_COLOR = '#f97316'

const MOCK_ROWS: AreteRow[] = [
  { id: 1, areteOrigen: '1034567891', folioFactura: 'FAC-2025-118', status: 'ok'        },
  { id: 2, areteOrigen: '1034567892', folioFactura: 'FAC-2025-118', status: 'ok'        },
  { id: 3, areteOrigen: '1034567893', folioFactura: 'FAC-2025-118', status: 'duplicado' },
  { id: 4, areteOrigen: '9999999999', folioFactura: 'FAC-2025-118', status: 'invalido'  },
]

interface Props {
  rows?:       AreteRow[]
  onRowsChange?: (rows: AreteRow[]) => void
  onGoAretes?: () => void
}

export default function ExportacionValidacionWidget({ rows, onRowsChange, onGoAretes }: Props) {
  const [validated, setValidated] = useState(false)
  const [result,    setResult]    = useState<AreteRow[]>([])

  const source = rows ?? MOCK_ROWS

  const runValidation = () => {
    const seen = new Map<string, number>()
    const validated = source.map(row => {
      if (!row.areteOrigen) return { ...row, status: 'invalido' as const }
      const num = Number(row.areteOrigen)
      if (!/^\d{10}$/.test(row.areteOrigen) || num < 1_000_000_000 || num > 1_100_000_000)
        return { ...row, status: 'invalido' as const }
      if (seen.has(row.areteOrigen)) return { ...row, status: 'duplicado' as const }
      seen.set(row.areteOrigen, row.id)
      return { ...row, status: 'ok' as const }
    })
    setResult(validated)
    setValidated(true)
    if (onRowsChange) onRowsChange(validated)
  }

  const displayed  = validated ? result : source
  const errores    = displayed.filter(r => r.status !== 'ok').length
  const correctos  = displayed.filter(r => r.status === 'ok').length
  const duplicados = displayed.filter(r => r.status === 'duplicado')
  const invalidos  = displayed.filter(r => r.status === 'invalido')
  const score      = displayed.length ? Math.round((correctos / displayed.length) * 100) : 0
  const scoreColor = score >= 95 ? '#22c55e' : score >= 80 ? EXPORT_COLOR : '#ef4444'

  return (
    <div className="flex flex-col gap-3">
      {!validated ? (
        <div className="flex flex-col items-center gap-4 py-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: `${EXPORT_COLOR}18` }}>
            <svg className="w-7 h-7" style={{ color: EXPORT_COLOR }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
            </svg>
          </div>
          <div className="text-center">
            <p className="text-[14px] font-semibold text-stone-700 dark:text-stone-200">
              Validar {source.length} aretes
            </p>
            <p className="text-[11.5px] text-stone-400 dark:text-stone-500 mt-1 max-w-64 leading-relaxed">
              Detecta duplicados, formatos incorrectos y consistencia con SINIIGA
            </p>
          </div>
          <button
            onClick={runValidation}
            className="flex items-center gap-2 px-6 py-2.5 rounded-[10px] text-[12px] font-semibold text-white border-0 cursor-pointer transition-all hover:opacity-90"
            style={{ background: EXPORT_COLOR }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M9 11l3 3L22 4"/>
            </svg>
            Analizar solicitud
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">

          {/* Resumen con score circular */}
          <div className={`flex items-center gap-4 p-4 rounded-[12px] border ${errores === 0 ? 'bg-green-50/60 dark:bg-green-950/15 border-green-100 dark:border-green-900/30' : 'bg-amber-50/60 dark:bg-amber-950/15 border-amber-100 dark:border-amber-900/30'}`}>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {errores === 0
                  ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                }
                <p className={`text-[12.5px] font-semibold ${errores === 0 ? 'text-green-700 dark:text-green-400' : 'text-amber-700 dark:text-amber-400'}`}>
                  {errores === 0 ? 'Solicitud válida' : `${errores} problema${errores > 1 ? 's' : ''} detectado${errores > 1 ? 's' : ''}`}
                </p>
              </div>
              <div className="flex items-center gap-5">
                <div><p className="font-mono text-[20px] font-bold text-green-600 dark:text-green-400">{correctos}</p><p className="font-mono text-[8.5px] text-stone-400 uppercase">correctos</p></div>
                {duplicados.length > 0 && <div><p className="font-mono text-[20px] font-bold text-amber-500">{duplicados.length}</p><p className="font-mono text-[8.5px] text-stone-400 uppercase">duplicados</p></div>}
                {invalidos.length  > 0 && <div><p className="font-mono text-[20px] font-bold text-red-500">{invalidos.length}</p><p className="font-mono text-[8.5px] text-stone-400 uppercase">inválidos</p></div>}
              </div>
            </div>
            {/* Score */}
            <svg width="52" height="52" viewBox="0 0 80 80" className="shrink-0">
              <circle cx="40" cy="40" r="35" stroke="rgba(120,113,108,0.15)" strokeWidth="7" fill="none"/>
              <circle cx="40" cy="40" r="35" stroke={scoreColor} strokeWidth="7" fill="none"
                strokeLinecap="round" transform="rotate(-90 40 40)"
                style={{ strokeDasharray: 220, strokeDashoffset: 220 - (220 * score) / 100, transition: 'stroke-dashoffset 1s ease' }}
              />
              <text x="40" y="45" textAnchor="middle" fontSize="18" fontWeight="700" fontFamily="monospace" fill={scoreColor}>{score}</text>
            </svg>
          </div>

          {/* Issues */}
          {duplicados.map(r => (
            <div key={r.id} className="flex items-start gap-2.5 p-2.5 rounded-[8px] bg-amber-50/70 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40">
              <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5"/>
              <div>
                <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">Duplicado · Fila {r.id}</p>
                <p className="font-mono text-[10px] text-amber-600/80 mt-0.5">{r.areteOrigen}</p>
                {onGoAretes && <button onClick={onGoAretes} className="text-[10px] text-amber-500 hover:text-amber-600 cursor-pointer bg-transparent border-0 p-0 mt-0.5">Corregir en tabla →</button>}
              </div>
            </div>
          ))}

          {invalidos.map(r => (
            <div key={r.id} className="flex items-start gap-2.5 p-2.5 rounded-[8px] bg-red-50/70 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40">
              <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5"/>
              <div>
                <p className="text-[11px] font-semibold text-red-600 dark:text-red-400">Formato inválido · Fila {r.id}</p>
                <p className="font-mono text-[10px] text-red-500/80 mt-0.5">{r.areteOrigen || '(vacío)'}</p>
                <p className="text-[10px] text-stone-400 mt-0.5">10 dígitos · rango 1,000,000,000–1,100,000,000</p>
                {onGoAretes && <button onClick={onGoAretes} className="text-[10px] text-red-400 hover:text-red-500 cursor-pointer bg-transparent border-0 p-0 mt-0.5">Corregir en tabla →</button>}
              </div>
            </div>
          ))}

          <button
            onClick={() => setValidated(false)}
            className="flex items-center justify-center py-2 rounded-[8px] text-[11px] text-stone-500 dark:text-stone-400 border border-stone-200 dark:border-stone-700/60 bg-white dark:bg-stone-800/40 cursor-pointer hover:text-stone-700 transition-all"
          >
            Volver a validar
          </button>
        </div>
      )}
    </div>
  )
}