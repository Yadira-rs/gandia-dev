/**
 * ExportacionValidacionWidget — usa validateAretes del hook + persiste en BD
 * ARCHIVO → src/artifacts/exportacion/widgets/ExportacionValidacionWidget.tsx
 */

import { useState } from 'react'
import type { AreteRow } from '../../artifactTypes'
import { validateAretes, upsertAretes } from '../../../hooks/useExportacion'

const EXPORT_COLOR = '#f97316'

interface Props {
  rows?:          AreteRow[]
  onRowsChange?:  (rows: AreteRow[]) => void
  onGoAretes?:    () => void
  solicitudId?:   string | null
  ranchoId?:      string | null
}

export default function ExportacionValidacionWidget({
  rows, onRowsChange, onGoAretes, solicitudId, ranchoId,
}: Props) {
  const [validated, setValidated] = useState(false)
  const [result,    setResult]    = useState<AreteRow[]>([])
  const [saving,    setSaving]    = useState(false)
  const [saveOk,    setSaveOk]    = useState(false)
  const [saveErr,   setSaveErr]   = useState<string | null>(null)

  const source = rows ?? []

  const runValidation = async () => {
    const validated = validateAretes(source)
    setResult(validated)
    setValidated(true)
    onRowsChange?.(validated)

    // Persistir automáticamente si hay solicitudId
    if (solicitudId && ranchoId) {
      setSaving(true)
      setSaveErr(null)
      const { error } = await upsertAretes(solicitudId, ranchoId, validated)
      setSaving(false)
      if (error) setSaveErr(error)
      else setSaveOk(true)
    }
  }

  const displayed  = validated ? result : source
  const errores    = displayed.filter(r => r.status !== 'ok').length
  const correctos  = displayed.filter(r => r.status === 'ok').length
  const duplicados = displayed.filter(r => r.status === 'duplicado')
  const invalidos  = displayed.filter(r => r.status === 'invalido')
  const score      = displayed.length ? Math.round((correctos / displayed.length) * 100) : 0
  const scoreColor = score >= 95 ? '#22c55e' : score >= 80 ? EXPORT_COLOR : '#ef4444'

  if (source.length === 0) return (
    <div className="flex flex-col items-center gap-3 py-14 text-center">
      <div className="w-10 h-10 rounded-2xl bg-stone-100 dark:bg-stone-800/60 flex items-center justify-center">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-stone-400">
          <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
        </svg>
      </div>
      <p className="text-[12.5px] text-stone-500 dark:text-stone-400">Sin aretes que validar</p>
      {onGoAretes && (
        <button onClick={onGoAretes}
          className="text-[11px] font-semibold cursor-pointer bg-transparent border-0 p-0"
          style={{ color: EXPORT_COLOR }}>
          Ir a la tabla →
        </button>
      )}
    </div>
  )

  return (
    <div className="flex flex-col gap-3">

      {!validated ? (
        /* ── Estado inicial ── */
        <div className="flex flex-col items-center gap-5 py-10">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: `${EXPORT_COLOR}12` }}>
            <svg width="26" height="26" style={{ color: EXPORT_COLOR }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
            </svg>
          </div>
          <div className="text-center">
            <p className="text-[14px] font-semibold text-stone-800 dark:text-stone-100">
              {source.length} aretes listos para validar
            </p>
            <p className="text-[11.5px] text-stone-400 dark:text-stone-500 mt-1 max-w-56 leading-relaxed mx-auto">
              Detecta duplicados, formatos inválidos y verifica el rango SINIIGA
            </p>
          </div>
          <button onClick={runValidation}
            className="flex items-center gap-2 px-6 py-2.5 rounded-[10px] text-[12.5px] font-semibold text-white border-0 cursor-pointer transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ background: EXPORT_COLOR }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M9 11l3 3L22 4"/>
            </svg>
            Analizar solicitud
          </button>
        </div>

      ) : (
        /* ── Resultado ── */
        <div className="flex flex-col gap-3">

          {/* Resumen */}
          <div className={`flex items-center gap-4 p-4 rounded-[12px] border ${
            errores === 0
              ? 'bg-emerald-50/60 dark:bg-emerald-950/15 border-emerald-100 dark:border-emerald-900/30'
              : 'bg-amber-50/60 dark:bg-amber-950/15 border-amber-100 dark:border-amber-900/30'
          }`}>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2.5">
                {errores === 0
                  ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                }
                <p className={`text-[12.5px] font-semibold ${errores === 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'}`}>
                  {errores === 0 ? '¡Solicitud válida!' : `${errores} problema${errores !== 1 ? 's' : ''} encontrado${errores !== 1 ? 's' : ''}`}
                </p>
              </div>
              <div className="flex items-center gap-5">
                <div>
                  <p className="font-mono text-[22px] font-extrabold leading-none text-emerald-600 dark:text-emerald-400 tabular-nums">{correctos}</p>
                  <p className="font-mono text-[8.5px] text-stone-400 uppercase mt-0.5">ok</p>
                </div>
                {duplicados.length > 0 && (
                  <div>
                    <p className="font-mono text-[22px] font-extrabold leading-none text-amber-500 tabular-nums">{duplicados.length}</p>
                    <p className="font-mono text-[8.5px] text-stone-400 uppercase mt-0.5">dup.</p>
                  </div>
                )}
                {invalidos.length > 0 && (
                  <div>
                    <p className="font-mono text-[22px] font-extrabold leading-none text-red-500 tabular-nums">{invalidos.length}</p>
                    <p className="font-mono text-[8.5px] text-stone-400 uppercase mt-0.5">inv.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Score circular */}
            <svg width="52" height="52" viewBox="0 0 80 80" className="shrink-0">
              <circle cx="40" cy="40" r="32" stroke="rgba(120,113,108,0.12)" strokeWidth="8" fill="none"/>
              <circle cx="40" cy="40" r="32" stroke={scoreColor} strokeWidth="8" fill="none"
                strokeLinecap="round" transform="rotate(-90 40 40)"
                style={{ strokeDasharray: 201, strokeDashoffset: 201 - (201 * score) / 100, transition: 'stroke-dashoffset 0.9s ease' }}/>
              <text x="40" y="46" textAnchor="middle" fontSize="17" fontWeight="800" fontFamily="monospace" fill={scoreColor}>{score}</text>
            </svg>
          </div>

          {/* Guardado en BD */}
          {solicitudId && (
            saving ? (
              <div className="flex items-center gap-2 text-[11px] text-stone-400">
                <div className="w-3 h-3 border-2 border-[#f97316] border-t-transparent rounded-full animate-spin"/>
                Guardando en BD…
              </div>
            ) : saveOk ? (
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-500">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                Aretes actualizados en BD
              </div>
            ) : saveErr ? (
              <p className="text-[11px] text-red-500">{saveErr}</p>
            ) : null
          )}

          {/* Issues */}
          {duplicados.map(r => (
            <div key={r.id} className="flex items-start gap-2.5 p-3 rounded-[9px] bg-amber-50/70 dark:bg-amber-950/15 border border-amber-100 dark:border-amber-900/40">
              <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5"/>
              <div className="flex-1 min-w-0">
                <p className="text-[11.5px] font-semibold text-amber-700 dark:text-amber-400">Duplicado · fila {r.id}</p>
                <p className="font-mono text-[10.5px] text-amber-600/80 dark:text-amber-400/60 mt-0.5 truncate">{r.areteOrigen}</p>
                {onGoAretes && (
                  <button onClick={onGoAretes} className="text-[10px] text-amber-500 hover:text-amber-700 cursor-pointer bg-transparent border-0 p-0 mt-0.5">
                    Corregir en tabla →
                  </button>
                )}
              </div>
            </div>
          ))}

          {invalidos.map(r => (
            <div key={r.id} className="flex items-start gap-2.5 p-3 rounded-[9px] bg-red-50/70 dark:bg-red-950/15 border border-red-100 dark:border-red-900/40">
              <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5"/>
              <div className="flex-1 min-w-0">
                <p className="text-[11.5px] font-semibold text-red-600 dark:text-red-400">Inválido · fila {r.id}</p>
                <p className="font-mono text-[10.5px] text-red-500/80 mt-0.5 truncate">{r.areteOrigen || '(vacío)'}</p>
                <p className="text-[10px] text-stone-400 mt-0.5">10 dígitos · 1,000,000,000 – 1,100,000,000</p>
                {onGoAretes && (
                  <button onClick={onGoAretes} className="text-[10px] text-red-400 hover:text-red-600 cursor-pointer bg-transparent border-0 p-0 mt-0.5">
                    Corregir en tabla →
                  </button>
                )}
              </div>
            </div>
          ))}

          <button onClick={() => { setValidated(false); setSaveOk(false) }}
            className="flex items-center justify-center py-2 rounded-[8px] text-[11.5px] text-stone-500 dark:text-stone-400 border border-stone-200 dark:border-stone-700/60 bg-white dark:bg-stone-800/40 cursor-pointer hover:text-stone-700 transition-all">
            Volver a validar
          </button>
        </div>
      )}
    </div>
  )
}