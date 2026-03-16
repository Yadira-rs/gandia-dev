/**
 * ExportacionModulo — Módulo (nivel awake / panel lateral)
 * Estado compartido de solicitud + aretes. Pasa props a cada widget.
 * Mismo patrón que FichaModulo.
 */

import { useState } from 'react'
import type { SolicitudData, AreteRow } from '../artifactTypes'

import ExportacionSolicitudWidget  from './widgets/ExportacionSolicitudWidget'
import ExportacionTablaWidget      from './widgets/ExportacionTablaWidget'
import ExportacionValidacionWidget from './widgets/ExportacionValidacionWidget'
import ExportacionScannerWidget    from './widgets/ExportacionScannerWidget'
import ExportacionExportWidget     from './widgets/ExportacionExportWidget'
import ExportacionHistorialWidget  from './widgets/ExportacionHistorialWidget'

const EXPORT_COLOR = '#f97316'

interface Props {
  onClose:    () => void
  onEscalate: () => void
}

type TabId = 'historial' | 'solicitud' | 'aretes' | 'validar' | 'scanner' | 'exportar'

const TABS: { id: TabId; label: string; locked?: true }[] = [
  { id: 'historial', label: 'Historial'                   },
  { id: 'solicitud', label: 'Solicitud'                   },
  { id: 'aretes',    label: 'Aretes',   locked: true      },
  { id: 'validar',   label: 'Validar',  locked: true      },
  { id: 'scanner',   label: 'Escáner',  locked: true      },
  { id: 'exportar',  label: 'Exportar', locked: true      },
]

export default function ExportacionModulo({ onClose, onEscalate }: Props) {
  const [tab,       setTab]       = useState<TabId>('historial')
  const [solicitud, setSolicitud] = useState<SolicitudData>({ psg: '', upp: '', sexo: 'Macho', folioFactura: '' })
  const [saved,     setSaved]     = useState(false)
  const [rows,      setRows]      = useState<AreteRow[]>([])
  const [nextId,    setNextId]    = useState(1)

  const errores = rows.filter(r => r.status !== 'ok').length
  const validos = rows.filter(r => r.status === 'ok').length

  const goTab = (id: TabId) => {
    const t = TABS.find(t => t.id === id)
    if (t?.locked && !saved) return
    setTab(id)
  }

  // Escáner empuja arete a la tabla
  const handleScan = (arete: string, folio: string) => {
    setRows(r => [...r, { id: nextId, areteOrigen: arete, folioFactura: folio, status: 'ok' }])
    setNextId(n => n + 1)
  }

  return (
    <div className="flex-1 flex flex-col bg-[#fafaf9] dark:bg-[#0c0a09] overflow-hidden">

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 h-12 border-b border-stone-200/70 dark:border-stone-800 shrink-0 bg-white dark:bg-[#1c1917]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: EXPORT_COLOR }}/>
          <p className="text-[12px] font-bold text-stone-700 dark:text-stone-200">Aretes Azules</p>
          <span className="text-[9.5px] font-mono text-stone-400 dark:text-stone-500 uppercase tracking-wider">
            SENASICA · Exportación
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={onEscalate}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[8px] border border-stone-200/70 dark:border-stone-800/60 bg-white dark:bg-[#1c1917] text-[11px] text-stone-400 dark:text-stone-500 cursor-pointer hover:text-[#f97316] hover:border-[#f97316]/40 transition-all"
          >
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/>
              <line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
            </svg>
            Espacio Gandia
          </button>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-[8px] border border-stone-200/70 dark:border-stone-800/60 bg-white dark:bg-[#1c1917] text-stone-400 cursor-pointer hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex border-b border-stone-200/70 dark:border-stone-800/60 bg-white dark:bg-[#1c1917] px-3.5 shrink-0 overflow-x-auto [&::-webkit-scrollbar]:hidden">
        {TABS.map(t => {
          const isLocked = !!t.locked && !saved
          return (
            <button
              key={t.id}
              onClick={() => goTab(t.id)}
              disabled={isLocked}
              title={isLocked ? 'Guarda la solicitud primero' : undefined}
              className={`relative flex items-center gap-1.5 px-2.5 py-2.5 text-[11.5px] border-0 bg-transparent transition-all -mb-px shrink-0
                ${isLocked
                  ? 'text-stone-300 dark:text-stone-700 cursor-not-allowed'
                  : tab === t.id
                    ? 'text-stone-700 dark:text-stone-200 font-semibold border-b-2 border-[#f97316] cursor-pointer'
                    : 'text-stone-400 dark:text-stone-500 font-normal border-b-2 border-transparent hover:text-stone-600 dark:hover:text-stone-300 cursor-pointer'
                }`}
            >
              {isLocked && (
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              )}
              {t.label}
              {t.id === 'validar' && !isLocked && errores > 0 && (
                <span className="w-3.5 h-3.5 rounded-full bg-red-400 text-white font-bold text-[8px] flex items-center justify-center">
                  {errores}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* ── Contenido ── */}
      <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-[4px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-stone-200 dark:[&::-webkit-scrollbar-thumb]:bg-stone-700 [&::-webkit-scrollbar-thumb]:rounded-full">
        <div className="p-4">

          {tab === 'historial' && (
            <ExportacionHistorialWidget
              onSelect={(s) => {
                setSolicitud(s.solicitud)
                setRows(s.rows ?? [])
                setNextId((s.rows?.length ?? 0) + 1)
                setSaved(true)
                setTab('solicitud')
              }}
              onNueva={() => {
                setSolicitud({ psg: '', upp: '', sexo: 'Macho', folioFactura: '' })
                setRows([])
                setNextId(1)
                setSaved(false)
                setTab('solicitud')
              }}
            />
          )}

          {tab === 'solicitud' && (
            <ExportacionSolicitudWidget
              data={solicitud}
              onChange={setSolicitud}
              onSave={(d) => { setSolicitud(d); setSaved(true) }}
            />
          )}

          {tab === 'aretes' && (
            <>
              <div className="flex items-center gap-2 flex-wrap mb-3 px-3 py-2 rounded-[8px] bg-orange-50/60 dark:bg-orange-950/10 border border-orange-100 dark:border-orange-900/30">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                <span className="font-mono text-[10px] text-stone-500">{solicitud.psg || '—'}</span>
                <span className="text-stone-300 text-[9px]">·</span>
                <span className="font-mono text-[10px] text-stone-500">{solicitud.folioFactura || '—'}</span>
                <span className="text-stone-300 text-[9px]">·</span>
                <span className="font-mono text-[10px] text-stone-500">{solicitud.sexo}</span>
                {solicitud.upp && <><span className="text-stone-300 text-[9px]">·</span><span className="font-mono text-[10px] text-stone-400 truncate max-w-[120px]">{solicitud.upp}</span></>}
              </div>
              <ExportacionTablaWidget rows={rows} onChange={setRows} />
            </>
          )}

          {tab === 'validar' && (
            <ExportacionValidacionWidget
              rows={rows}
              onRowsChange={setRows}
              onGoAretes={() => setTab('aretes')}
            />
          )}

          {tab === 'scanner' && (
            <ExportacionScannerWidget
              existingAretes={rows.map(r => r.areteOrigen)}
              existingFolios={[...new Set(rows.map(r => r.folioFactura).filter(Boolean)), solicitud.folioFactura].filter(Boolean)}
              onScan={(arete, folio) => handleScan(arete, folio)}
            />
          )}

          {tab === 'exportar' && (
            <>
              <div className="flex flex-col gap-1.5 mb-3 px-3 py-2.5 rounded-[10px] bg-orange-50/60 dark:bg-orange-950/10 border border-orange-100 dark:border-orange-900/30">
                <div className="flex items-center gap-2 flex-wrap">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  <span className="font-mono text-[10px] text-stone-500">{solicitud.psg || '—'}</span>
                  <span className="text-stone-300 text-[9px]">·</span>
                  <span className="font-mono text-[10px] text-stone-500">{solicitud.folioFactura || '—'}</span>
                  <span className="text-stone-300 text-[9px]">·</span>
                  <span className="font-mono text-[10px] text-stone-500">{solicitud.upp || '—'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-green-600 dark:text-green-400 font-semibold">{validos} válidos</span>
                  {errores > 0 && (
                    <><span className="text-stone-300 text-[9px]">·</span>
                    <button onClick={() => setTab('validar')} className="font-mono text-[10px] text-red-500 cursor-pointer bg-transparent border-0 p-0">
                      {errores} error{errores > 1 ? 'es' : ''} — corregir →
                    </button></>
                  )}
                </div>
              </div>
              <ExportacionExportWidget solicitud={solicitud} rows={rows} />
            </>
          )}

        </div>
      </div>
    </div>
  )
}