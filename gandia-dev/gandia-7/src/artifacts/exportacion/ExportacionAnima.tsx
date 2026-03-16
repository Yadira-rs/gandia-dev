/**
 * ExportacionAnima — Ánima (nivel completo / pantalla entera)
 * Estado compartido. Sidebar con historial. Tabs centrados en topbar.
 * Móvil: barra de tabs fija en la parte inferior.
 * Mismo patrón que FichaAnima.
 */

import { useState } from 'react'
import CopiloAnima from '../CopiloAnima'
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

type TabId = 'solicitud' | 'aretes' | 'validar' | 'scanner' | 'exportar' | 'historial'

const DESKTOP_TABS: { id: TabId; label: string; locked?: true }[] = [
  { id: 'solicitud', label: 'Solicitud'                   },
  { id: 'aretes',    label: 'Aretes',   locked: true      },
  { id: 'validar',   label: 'Validar',  locked: true      },
  { id: 'scanner',   label: 'Escáner',  locked: true      },
  { id: 'exportar',  label: 'Exportar', locked: true      },
]

export default function ExportacionAnima({ onClose, onEscalate }: Props) {
  const [tab,       setTab]       = useState<TabId>('solicitud')
  const [solicitud, setSolicitud] = useState<SolicitudData>({ psg: '', upp: '', sexo: 'Macho', folioFactura: '' })
  const [saved,     setSaved]     = useState(false)
  const [rows,      setRows]      = useState<AreteRow[]>([])
  const [nextId,    setNextId]    = useState(1)

  const errores = rows.filter(r => r.status !== 'ok').length
  const validos = rows.filter(r => r.status === 'ok').length

  const goTab = (id: TabId) => {
    const t = DESKTOP_TABS.find(t => t.id === id)
    if (t?.locked && !saved) return
    setTab(id)
  }

  const handleScan = (arete: string, folio: string) => {
    setRows(r => [...r, { id: nextId, areteOrigen: arete, folioFactura: folio, status: 'ok' }])
    setNextId(n => n + 1)
  }

  const handleSelectHistorial = (s: { solicitud: SolicitudData; rows?: AreteRow[] }) => {
    setSolicitud(s.solicitud)
    setRows(s.rows ?? [])
    setNextId((s.rows?.length ?? 0) + 1)
    setSaved(true)
    setTab('solicitud')
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#fafaf9] dark:bg-[#0c0a09]">

      {/* ── Topbar ── */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-stone-200/70 dark:border-stone-800 shrink-0">

        {/* Título */}
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full animate-pulse shrink-0" style={{ background: EXPORT_COLOR }}/>
          <p className="text-[13px] font-semibold text-stone-800 dark:text-stone-100">Aretes Azules</p>
          <span
            className="hidden sm:inline text-[9.5px] font-mono font-semibold px-2 py-0.5 rounded tracking-wider uppercase"
            style={{ color: EXPORT_COLOR, background: `${EXPORT_COLOR}14`, border: `1px solid ${EXPORT_COLOR}30` }}
          >
            Espacio Gandia
          </span>
        </div>

        {/* Tabs centrados — ocultos en móvil */}
        <div className="hidden sm:flex items-center gap-0.5 bg-stone-100 dark:bg-stone-800/60 rounded-[10px] p-1">
          {DESKTOP_TABS.map(t => {
            const isLocked = !!t.locked && !saved
            return (
              <button
                key={t.id}
                onClick={() => goTab(t.id)}
                disabled={isLocked}
                title={isLocked ? 'Guarda la solicitud primero' : undefined}
                className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-[7px] text-[11.5px] font-medium transition-all border-0 cursor-pointer whitespace-nowrap
                  ${isLocked
                    ? 'text-stone-300 dark:text-stone-600 cursor-not-allowed bg-transparent'
                    : tab === t.id
                      ? 'bg-white dark:bg-stone-700 text-stone-800 dark:text-stone-100 shadow-sm'
                      : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 bg-transparent'
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

        {/* Acciones */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onEscalate}
            className="h-7 px-2.5 rounded-lg text-[11px] font-medium text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800/60 transition-all flex items-center gap-1.5 cursor-pointer border-0 bg-transparent"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/>
              <line x1="10" y1="14" x2="17" y2="7"/><line x1="4" y1="20" x2="11" y2="13"/>
            </svg>
            <span className="hidden sm:inline">Panel</span>
          </button>
          <button
            onClick={onClose}
            className="h-7 px-2.5 rounded-lg text-[11px] font-medium text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800/60 transition-all cursor-pointer border-0 bg-transparent whitespace-nowrap"
          >
            Volver al chat
          </button>
        </div>
      </div>

      {/* ── Layout principal ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── Zona central ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 pb-[72px] sm:pb-5 [&::-webkit-scrollbar]:w-[4px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-stone-200 dark:[&::-webkit-scrollbar-thumb]:bg-stone-700 [&::-webkit-scrollbar-thumb]:rounded-full">
          <div className="max-w-2xl mx-auto">

            {tab === 'historial' && (
              <ExportacionHistorialWidget
                onSelect={handleSelectHistorial}
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
                <div className="flex items-center gap-2 flex-wrap mb-4 px-3 py-2 rounded-[8px] bg-orange-50/60 dark:bg-orange-950/10 border border-orange-100 dark:border-orange-900/30">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  <span className="font-mono text-[10px] text-stone-500">{solicitud.psg || '—'}</span>
                  <span className="text-stone-300 text-[9px]">·</span>
                  <span className="font-mono text-[10px] text-stone-500">{solicitud.folioFactura || '—'}</span>
                  <span className="text-stone-300 text-[9px]">·</span>
                  <span className="font-mono text-[10px] text-stone-500">{solicitud.sexo}</span>
                  {solicitud.upp && <><span className="text-stone-300 text-[9px]">·</span><span className="font-mono text-[10px] text-stone-400 truncate max-w-[140px]">{solicitud.upp}</span></>}
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
                <div className="flex flex-col gap-1.5 mb-4 px-3 py-2.5 rounded-[10px] bg-orange-50/60 dark:bg-orange-950/10 border border-orange-100 dark:border-orange-900/30">
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
                      <button onClick={() => goTab('validar')} className="font-mono text-[10px] text-red-500 cursor-pointer bg-transparent border-0 p-0">
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

        {/* ── Sidebar historial derecho (solo desktop) ── */}
        <div className="hidden lg:flex lg:flex-col w-60 shrink-0 border-l border-stone-200/70 dark:border-stone-800 bg-white dark:bg-[#111110]">
          <ExportacionHistorialWidget
            selectedId="1"
            onSelect={handleSelectHistorial}
            onNueva={() => {
              setSolicitud({ psg: '', upp: '', sexo: 'Macho', folioFactura: '' })
              setRows([])
              setTab('solicitud')
            }}
          />
        </div>

      </div>

      {/* ── Bottom nav móvil — fijo al fondo, solo iconos ── */}
      <div
        className="sm:hidden fixed bottom-0 left-0 right-0 z-[60] flex items-center border-t border-stone-200/70 dark:border-stone-800 bg-white dark:bg-[#1c1917]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {/* Historial — primero en móvil */}
        <MobileNavBtn id="historial" active={tab} onClick={setTab} errores={errores}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        </MobileNavBtn>
        {/* Solicitud */}
        <MobileNavBtn id="solicitud" active={tab} onClick={setTab} errores={errores}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
        </MobileNavBtn>
        {/* Aretes */}
        <MobileNavBtn id="aretes" active={tab} onClick={goTab} errores={errores} locked={!saved}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="9" x2="9" y2="21"/></svg>
        </MobileNavBtn>
        {/* Validar */}
        <MobileNavBtn id="validar" active={tab} onClick={goTab} errores={errores} locked={!saved}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
        </MobileNavBtn>
        {/* Escáner */}
        <MobileNavBtn id="scanner" active={tab} onClick={goTab} errores={errores} locked={!saved}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
        </MobileNavBtn>
        {/* Exportar */}
        <MobileNavBtn id="exportar" active={tab} onClick={goTab} errores={errores} locked={!saved}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        </MobileNavBtn>
      </div>

      {/* ── Copiloto flotante ── */}
      <CopiloAnima domain="exportacion" />
    </div>
  )
}

// ── MobileNavBtn ──────────────────────────────────────────────────────────────

function MobileNavBtn({
  id, active, onClick, errores, locked = false, children,
}: {
  id:       TabId
  active:   TabId
  onClick:  (id: TabId) => void
  errores:  number
  locked?:  boolean
  children: React.ReactNode
}) {
  const isActive = id === active
  return (
    <button
      onClick={() => !locked && onClick(id)}
      className={`relative flex-1 flex items-center justify-center py-3 border-0 transition-all bg-transparent
        ${locked ? 'opacity-25 cursor-not-allowed' : 'cursor-pointer'}
        ${isActive && !locked ? '' : 'text-stone-400 dark:text-stone-500'}`}
      style={isActive && !locked ? { color: EXPORT_COLOR } : {}}
    >
      {isActive && (
        <div className="absolute top-0 left-[25%] right-[25%] h-[2px] rounded-b-full" style={{ background: EXPORT_COLOR }}/>
      )}
      {children}
      {id === 'validar' && errores > 0 && (
        <span className="absolute top-1.5 right-[22%] w-3.5 h-3.5 rounded-full bg-red-400 text-white font-bold text-[8px] flex items-center justify-center">
          {errores}
        </span>
      )}
    </button>
  )
}