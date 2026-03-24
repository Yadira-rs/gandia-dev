/**
 * ExportacionTablaWidget — tabla editable con persistencia en Supabase
 * ARCHIVO → src/artifacts/exportacion/widgets/ExportacionTablaWidget.tsx
 */

import { useState } from 'react'
import type { AreteRow } from '../../artifactTypes'
import { upsertAretes } from '../../../hooks/useExportacion'
export type { AreteRow }

const EXPORT_COLOR = '#f97316'

interface Props {
  rows?:        AreteRow[]
  onChange?:    (rows: AreteRow[]) => void
  solicitudId?: string | null
  ranchoId?:    string | null
}

// ── Validación inline de un arete ────────────────────────────────────────────
function validarArete(arete: string, existentes: string[]): 'ok' | 'duplicado' | 'invalido' {
  const s = arete.trim()
  if (!s) return 'invalido'
  const num = Number(s)
  if (!/^\d{10}$/.test(s) || num < 1_000_000_000 || num > 1_100_000_000) return 'invalido'
  if (existentes.includes(s)) return 'duplicado'
  return 'ok'
}

// ── Validación de folio de factura ────────────────────────────────────────────
// Acepta: FAC-2025-001, FAC-25-001, FACT-2025-0001, etc.
// Regla: letras-dígitos-dígitos, sin espacios, mín 5 chars.
function validarFolio(folio: string): string | null {
  const s = folio.trim()
  if (!s) return 'El folio es obligatorio'
  if (s.length < 5) return 'Folio muy corto'
  if (/\s/.test(s)) return 'Sin espacios'
  if (!/^[A-Z0-9]+-\d+-\d+$/i.test(s)) return 'Formato: FAC-2025-001'
  return null
}

export default function ExportacionTablaWidget({ rows, onChange, solicitudId, ranchoId }: Props) {
  const [local,           setLocal]          = useState<AreteRow[]>([])
  const [nextId,          setNextId]         = useState(1)
  const [showForm,        setShowForm]       = useState(false)
  const [formMode,        setFormMode]       = useState<'arete' | 'folio'>('arete')
  const [formArete,       setFormArete]      = useState('')
  const [formFolio,       setFormFolio]      = useState('')
  const [formError,       setFormError]      = useState<string | null>(null)
  const [formFolioError,  setFormFolioError] = useState<string | null>(null)
  const [saving,          setSaving]         = useState(false)
  const [saveOk,          setSaveOk]         = useState(false)
  const [saveErr,         setSaveErr]        = useState<string | null>(null)

  const current = rows ?? local

  const emit = (next: AreteRow[]) => {
    if (onChange) onChange(next)
    else setLocal(next)
    setSaveOk(false)
  }

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
    const s = formArete.trim()

    const folioErr = validarFolio(formFolio)
    if (folioErr) { setFormFolioError(folioErr); return }

    if (!s) { setFormError('Ingresa un número de arete'); return }

    const existentes = current.map(r => r.areteOrigen)
    const status = validarArete(s, existentes)

    if (status === 'invalido') {
      setFormError('Formato inválido — debe ser 10 dígitos entre 1,000,000,000 y 1,100,000,000')
      return
    }
    if (status === 'duplicado') {
      setFormError(`El arete ${s} ya está en la lista`)
      return
    }

    setFormError(null)
    setFormFolioError(null)
    const next: AreteRow[] = [...current, {
      id: nextId, areteOrigen: s, folioFactura: formFolio.trim(), status: 'ok',
    }]
    emit(next)
    setNextId(n => n + 1)
    setFormArete('')
    if (formMode === 'folio') setFormMode('arete')
  }

  const removeRow = (id: number) => emit(current.filter(r => r.id !== id))

  const updateRow = (id: number, field: 'areteOrigen' | 'folioFactura', value: string) => {
    emit(current.map(r => {
      if (r.id !== id) return r
      const updated = { ...r, [field]: value }
      if (field === 'areteOrigen') {
        const otrosAretes = current.filter(x => x.id !== id).map(x => x.areteOrigen)
        updated.status = validarArete(value, otrosAretes)
      }
      return updated
    }))
  }

  const handleGuardar = async () => {
    if (!solicitudId || !ranchoId) return
    setSaving(true)
    setSaveErr(null)
    const { error } = await upsertAretes(solicitudId, ranchoId, current)
    setSaving(false)
    if (error) { setSaveErr(error); return }
    setSaveOk(true)
    setTimeout(() => setSaveOk(false), 2500)
  }

  const errores = current.filter(r => r.status !== 'ok').length
  const cellCls = 'w-full px-1.5 py-1.5 text-[11.5px] font-mono bg-transparent border-0 focus:outline-none focus:ring-1 focus:ring-[#f97316]/25 rounded-[4px] transition-all text-stone-700 dark:text-stone-200 placeholder:text-stone-300 dark:placeholder:text-stone-600'

  return (
    <div className="flex flex-col gap-3">

      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-[12px] font-semibold text-stone-700 dark:text-stone-200">
            {current.length} <span className="font-normal text-stone-400 dark:text-stone-500">aretes</span>
          </p>
          {errores > 0 && (
            <span className="text-[10px] font-semibold text-red-500 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/40 px-2 py-0.5 rounded-full">
              {errores} con error
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {current.length === 0 ? (
            <button onClick={openFormFolio}
              className="flex items-center gap-1.5 h-8 px-3 rounded-[7px] text-[11px] font-semibold text-white border-0 cursor-pointer hover:opacity-85 transition-all"
              style={{ background: EXPORT_COLOR }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Agregar
            </button>
          ) : (
            <>
              <button onClick={openFormArete}
                className="flex items-center gap-1.5 h-8 px-3 rounded-[7px] text-[11px] font-semibold text-white border-0 cursor-pointer hover:opacity-85 transition-all"
                style={{ background: EXPORT_COLOR }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Arete
              </button>
              <button onClick={openFormFolio}
                className="flex items-center gap-1.5 h-8 px-3 rounded-[7px] text-[11px] font-semibold border cursor-pointer hover:opacity-80 transition-all"
                style={{ color: EXPORT_COLOR, borderColor: `${EXPORT_COLOR}40`, background: `${EXPORT_COLOR}0d` }}>
                Nuevo folio
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Tabla ── */}
      {current.length > 0 ? (
        <div className="border border-stone-200 dark:border-stone-700/60 rounded-[10px] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-stone-50 dark:bg-stone-800/40 border-b border-stone-200 dark:border-stone-700/60">
                <th className="text-left px-3 py-2 font-mono text-[8.5px] text-stone-400 uppercase tracking-[1px] w-8">#</th>
                <th className="text-left px-2 py-2 font-mono text-[8.5px] text-stone-400 uppercase tracking-[1px]">Arete SINIIGA</th>
                <th className="text-left px-2 py-2 font-mono text-[8.5px] text-stone-400 uppercase tracking-[1px]">Folio</th>
                <th className="w-7"/>
              </tr>
            </thead>
            <tbody>
              {current.map(row => (
                <tr key={row.id}
                  className={`border-b border-stone-100 dark:border-stone-800/40 last:border-0 transition-colors
                    ${row.status === 'duplicado' ? 'bg-amber-50/50 dark:bg-amber-950/10' : ''}
                    ${row.status === 'invalido'  ? 'bg-red-50/50 dark:bg-red-950/10'     : ''}
                  `}>
                  <td className="px-3 py-1 font-mono text-[10px] text-stone-400 dark:text-stone-500">{row.id}</td>
                  <td className="px-2 py-1">
                    <input className={`${cellCls} ${
                      row.status === 'duplicado' ? 'text-amber-600 dark:text-amber-400' :
                      row.status === 'invalido'  ? 'text-red-500 dark:text-red-400' : ''
                    }`}
                      value={row.areteOrigen} placeholder="1034567891"
                      onChange={e => updateRow(row.id, 'areteOrigen', e.target.value)} />
                  </td>
                  <td className="px-2 py-1">
                    <input className={cellCls} value={row.folioFactura} placeholder="FAC-000"
                      onChange={e => updateRow(row.id, 'folioFactura', e.target.value)} />
                  </td>
                  <td className="px-1.5 py-1">
                    <button onClick={() => removeRow(row.id)}
                      className="w-5 h-5 flex items-center justify-center rounded text-stone-300 dark:text-stone-600 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer border-0 bg-transparent transition-all">
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
      ) : (
        <div className="flex flex-col items-center gap-2 py-10 border border-dashed border-stone-200 dark:border-stone-700/60 rounded-[10px]">
          <p className="text-[12px] text-stone-400 dark:text-stone-500">Sin aretes aún</p>
          <p className="text-[10.5px] text-stone-300 dark:text-stone-600">Rango válido: 1,000,000,000 – 1,100,000,000</p>
        </div>
      )}

      {current.length > 0 && (
        <p className="text-[10.5px] text-stone-400 dark:text-stone-500">
          10 dígitos · rango 1,000,000,000–1,100,000,000 · máx 140 aretes
        </p>
      )}

      {/* ── Guardar en BD ── */}
      {solicitudId && current.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {saveErr && <p className="text-[11px] text-red-500">{saveErr}</p>}
          <button onClick={handleGuardar} disabled={saving}
            className="flex items-center justify-center gap-2 py-2.5 rounded-[9px] text-[12px] font-semibold border cursor-pointer transition-all disabled:opacity-50"
            style={saveOk
              ? { color: '#22c55e', borderColor: '#22c55e40', background: '#22c55e0d' }
              : { color: EXPORT_COLOR, borderColor: `${EXPORT_COLOR}40`, background: `${EXPORT_COLOR}0d` }}>
            {saving ? (
              <><div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"/>Guardando…</>
            ) : saveOk ? (
              <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>Aretes guardados</>
            ) : (
              `Guardar ${current.length} aretes`
            )}
          </button>
        </div>
      )}

      {/* ── Formulario ── */}
      {showForm && (
        <div className="flex flex-col gap-3 p-3.5 rounded-[10px] border border-stone-200 dark:border-stone-700/60 bg-stone-50/60 dark:bg-stone-900/40">
          <p className="text-[11.5px] font-semibold text-stone-700 dark:text-stone-200">
            {formMode === 'arete' ? 'Agregar arete' : 'Nuevo folio'}
          </p>

          <div>
            <label className="block text-[9.5px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-[0.06em] mb-1.5">Folio Factura</label>
            {formMode === 'arete' ? (
              <select value={formFolio} onChange={e => { setFormFolio(e.target.value); setFormFolioError(null) }}
                className="w-full px-3 py-2 rounded-[8px] border border-stone-200 dark:border-stone-700/60 bg-white dark:bg-stone-800/40 text-[12px] font-mono text-stone-800 dark:text-stone-100 focus:outline-none focus:border-[#f97316]/50 transition-all cursor-pointer">
                {foliosExistentes.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            ) : (
              <input autoFocus value={formFolio}
                onChange={e => { setFormFolio(e.target.value); setFormFolioError(null) }}
                onKeyDown={e => e.key === 'Enter' && submitForm()}
                placeholder="FAC-2025-000"
                className={`w-full px-3 py-2 rounded-[8px] border bg-white dark:bg-stone-800/40 text-[12px] font-mono text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-1 transition-all ${
                  formFolioError
                    ? 'border-red-400 dark:border-red-500 focus:border-red-400 focus:ring-red-400/15'
                    : 'border-stone-200 dark:border-stone-700/60 focus:border-[#f97316]/50 focus:ring-[#f97316]/15'
                }`} />
            )}
            {formFolioError && (
              <p className="mt-1.5 text-[10.5px] text-red-500 leading-snug">{formFolioError}</p>
            )}
            {!formFolioError && formMode !== 'arete' && (
              <p className="mt-1 text-[9.5px] text-stone-400 dark:text-stone-500">Ej: FAC-2025-001</p>
            )}
          </div>

          <div>
            <label className="block text-[9.5px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-[0.06em] mb-1.5">Arete SINIIGA</label>
            <input autoFocus={formMode === 'arete'} value={formArete}
              onChange={e => { setFormArete(e.target.value); setFormError(null) }}
              onKeyDown={e => e.key === 'Enter' && submitForm()}
              placeholder="1034567891"
              className={`w-full px-3 py-2 rounded-[8px] border bg-white dark:bg-stone-800/40 text-[12px] font-mono text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-1 transition-all ${
                formError
                  ? 'border-red-400 dark:border-red-500 focus:border-red-400 focus:ring-red-400/15'
                  : 'border-stone-200 dark:border-stone-700/60 focus:border-[#f97316]/50 focus:ring-[#f97316]/15'
              }`} />
            {formError && (
              <p className="mt-1.5 text-[10.5px] text-red-500 leading-snug">{formError}</p>
            )}
          </div>

          <div className="flex gap-2">
            <button onClick={submitForm}
              className="flex-1 py-2 rounded-[8px] text-[12px] font-semibold text-white border-0 cursor-pointer hover:opacity-90 transition-all active:scale-[0.98]"
              style={{ background: EXPORT_COLOR }}>
              Agregar
            </button>
            <button onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-[8px] text-[12px] text-stone-500 border border-stone-200 dark:border-stone-700/60 bg-white dark:bg-stone-800/40 cursor-pointer hover:text-stone-700 transition-all">
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}