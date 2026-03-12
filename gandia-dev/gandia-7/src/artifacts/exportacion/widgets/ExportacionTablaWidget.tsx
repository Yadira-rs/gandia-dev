/**
 * ExportacionTablaWidget
 * Tabla editable de aretes. Controlada desde Módulo/Ánima.
 * Standalone: usa estado interno con mock.
 */

import { useState } from 'react'
import type { AreteRow } from '../../artifactTypes'
export type { AreteRow }

const EXPORT_COLOR = '#f97316'

const MOCK_ROWS: AreteRow[] = [
  { id: 1, areteOrigen: '1034567891', folioFactura: 'FAC-2025-118', status: 'ok'        },
  { id: 2, areteOrigen: '1034567892', folioFactura: 'FAC-2025-118', status: 'ok'        },
  { id: 3, areteOrigen: '1034567893', folioFactura: 'FAC-2025-118', status: 'duplicado' },
  { id: 4, areteOrigen: '1034567894', folioFactura: 'FAC-2025-118', status: 'ok'        },
  { id: 5, areteOrigen: '9999999999', folioFactura: 'FAC-2025-118', status: 'invalido'  },
]

interface Props {
  rows?:     AreteRow[]
  onChange?: (rows: AreteRow[]) => void
}

export default function ExportacionTablaWidget({ rows, onChange }: Props) {
  const [local,     setLocal]     = useState<AreteRow[]>(MOCK_ROWS)
  const [nextId,    setNextId]    = useState(MOCK_ROWS.length + 1)
  const [showForm,  setShowForm]  = useState(false)
  const [formMode,  setFormMode]  = useState<'arete' | 'folio'>('arete')
  const [formArete, setFormArete] = useState('')
  const [formFolio, setFormFolio] = useState('')

  const current = rows ?? local

  const emit = (next: AreteRow[]) => {
    if (onChange) onChange(next)
    else setLocal(next)
  }

  // Folios únicos ya usados en la tabla
  const foliosExistentes = [...new Set(current.map(r => r.folioFactura).filter(Boolean))]

  const openFormArete = () => {
    setFormMode('arete')
    setFormFolio(foliosExistentes[0] ?? '')
    setFormArete('')
    setShowForm(true)
  }

  const openFormFolio = () => {
    setFormMode('folio')
    setFormFolio('')
    setFormArete('')
    setShowForm(true)
  }

  const submitForm = () => {
    if (!formArete.trim()) return
    emit([...current, { id: nextId, areteOrigen: formArete.trim(), folioFactura: formFolio.trim(), status: 'ok' }])
    setNextId(n => n + 1)
    setFormArete('')
    // En modo arete mantenemos el folio seleccionado para captura rápida
    if (formMode === 'folio') setFormMode('arete')
  }

  const removeRow = (id: number) => emit(current.filter(r => r.id !== id))

  const updateRow = (id: number, field: 'areteOrigen' | 'folioFactura', value: string) =>
    emit(current.map(r => r.id === id ? { ...r, [field]: value, status: 'ok' as const } : r))

  const errores  = current.filter(r => r.status !== 'ok').length
  const cellCls  = 'w-full px-1.5 py-1 text-[11px] font-mono bg-transparent border-0 focus:outline-none focus:ring-1 focus:ring-[#f97316]/30 rounded focus:bg-orange-50/20 dark:focus:bg-orange-950/20 transition-all text-stone-700 dark:text-stone-200'

  return (
    <div className="flex flex-col gap-3">

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-[11.5px] text-stone-500 dark:text-stone-400">
            <span className="font-semibold text-stone-700 dark:text-stone-200">{current.length}</span> aretes
          </p>
          {errores > 0 && (
            <span className="text-[10px] font-mono font-semibold text-red-500 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/40 px-2 py-0.5 rounded-full">
              {errores} error{errores > 1 ? 'es' : ''}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {current.length === 0 ? (
            <button
              onClick={openFormFolio}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[7px] text-[11px] font-medium text-white border-0 cursor-pointer transition-all hover:opacity-90"
              style={{ background: EXPORT_COLOR }}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Agregar
            </button>
          ) : (
            <>
              <button
                onClick={openFormArete}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[7px] text-[11px] font-medium text-white border-0 cursor-pointer transition-all hover:opacity-90"
                style={{ background: EXPORT_COLOR }}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Agregar arete
              </button>
              <button
                onClick={openFormFolio}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[7px] text-[11px] font-medium border cursor-pointer transition-all hover:opacity-80"
                style={{ color: EXPORT_COLOR, borderColor: `${EXPORT_COLOR}50`, background: `${EXPORT_COLOR}10` }}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                Nuevo folio
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tabla */}
      <div className="border border-stone-200 dark:border-stone-700/60 rounded-[10px] overflow-hidden">
        <table className="w-full text-[11.5px]">
          <thead>
            <tr className="bg-stone-50 dark:bg-stone-800/40 border-b border-stone-200 dark:border-stone-700/60">
              <th className="text-left px-3 py-2 font-mono text-[8.5px] text-stone-400 uppercase tracking-[1px] w-8">No.</th>
              <th className="text-left px-2 py-2 font-mono text-[8.5px] text-stone-400 uppercase tracking-[1px]">Arete SINIIGA</th>
              <th className="text-left px-2 py-2 font-mono text-[8.5px] text-stone-400 uppercase tracking-[1px]">Folio Factura</th>
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {current.map(row => (
              <tr
                key={row.id}
                className={`border-b border-stone-100 dark:border-stone-800/50 last:border-0 transition-colors
                  ${row.status === 'duplicado' ? 'bg-amber-50/40 dark:bg-amber-950/10' : ''}
                  ${row.status === 'invalido'  ? 'bg-red-50/40 dark:bg-red-950/10'     : ''}
                `}
              >
                <td className="px-3 py-1 font-mono text-[10px] text-stone-400 dark:text-stone-500">{row.id}</td>
                <td className="px-2 py-1">
                  <input
                    className={`${cellCls} ${row.status === 'duplicado' ? '!text-amber-600 dark:!text-amber-400' : row.status === 'invalido' ? '!text-red-500 dark:!text-red-400' : ''}`}
                    value={row.areteOrigen}
                    onChange={e => updateRow(row.id, 'areteOrigen', e.target.value)}
                    placeholder="1034567891"
                  />
                </td>
                <td className="px-2 py-1">
                  <input
                    className={cellCls}
                    value={row.folioFactura}
                    onChange={e => updateRow(row.id, 'folioFactura', e.target.value)}
                    placeholder="FAC-0000-000"
                  />
                </td>
                <td className="px-2 py-1">
                  <button
                    onClick={() => removeRow(row.id)}
                    className="w-5 h-5 flex items-center justify-center rounded text-stone-300 dark:text-stone-600 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer border-0 bg-transparent transition-all"
                  >
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-[10.5px] text-stone-400 dark:text-stone-500">
        Rango válido: 1,000,000,000 – 1,100,000,000 · Solo dígitos · Máx 140 aretes
      </p>

      {/* ── Formulario nuevo arete ── */}
      {showForm && (
        <div className="flex flex-col gap-2.5 p-3.5 rounded-[10px] border border-orange-200 dark:border-orange-900/40 bg-orange-50/50 dark:bg-orange-950/10">
          <p className="text-[11px] font-semibold text-stone-600 dark:text-stone-300">
            {formMode === 'arete' ? 'Agregar arete' : 'Nuevo folio'}
          </p>

          {/* Folio: dropdown si modo arete, input libre si modo folio */}
          <div>
            <label className="block font-mono text-[9px] uppercase tracking-[1px] text-stone-400 mb-1">Folio Factura</label>
            {formMode === 'arete' ? (
              <select
                className="w-full px-3 py-2 rounded-[8px] border border-stone-200 dark:border-stone-700/60 bg-white dark:bg-stone-800/40 text-[12px] font-mono text-stone-800 dark:text-stone-100 focus:outline-none focus:border-[#f97316]/60 transition-all cursor-pointer"
                value={formFolio}
                onChange={e => setFormFolio(e.target.value)}
              >
                {foliosExistentes.map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            ) : (
              <input
                autoFocus
                className="w-full px-3 py-2 rounded-[8px] border border-stone-200 dark:border-stone-700/60 bg-white dark:bg-stone-800/40 text-[12px] font-mono text-stone-800 dark:text-stone-100 focus:outline-none focus:border-[#f97316]/60 focus:ring-1 focus:ring-[#f97316]/20 transition-all"
                placeholder="FAC-2025-000"
                value={formFolio}
                onChange={e => setFormFolio(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submitForm()}
              />
            )}
          </div>

          <div>
            <label className="block font-mono text-[9px] uppercase tracking-[1px] text-stone-400 mb-1">Arete SINIIGA</label>
            <input
              autoFocus={formMode === 'arete'}
              className="w-full px-3 py-2 rounded-[8px] border border-stone-200 dark:border-stone-700/60 bg-white dark:bg-stone-800/40 text-[12px] font-mono text-stone-800 dark:text-stone-100 focus:outline-none focus:border-[#f97316]/60 focus:ring-1 focus:ring-[#f97316]/20 transition-all"
              placeholder="1034567891"
              value={formArete}
              onChange={e => setFormArete(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submitForm()}
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={submitForm}
              className="flex-1 py-2 rounded-[8px] text-[12px] font-semibold text-white border-0 cursor-pointer hover:opacity-90 transition-all"
              style={{ background: EXPORT_COLOR }}
            >
              Agregar
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-[8px] text-[12px] text-stone-500 border border-stone-200 dark:border-stone-700/60 bg-white dark:bg-stone-800/40 cursor-pointer hover:text-stone-700 transition-all"
            >
              Cerrar
            </button>
          </div>
          {formMode === 'arete' && (
            <p className="text-[10px] text-stone-400 dark:text-stone-500">
              El folio se mantiene entre capturas — solo cambia el arete cada vez.
            </p>
          )}
        </div>
      )}
    </div>
  )
}