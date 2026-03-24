/**
 * ExportacionAnima — Ánima (pantalla completa) conectada a Supabase
 * ARCHIVO → src/artifacts/exportacion/ExportacionAnima.tsx
 */

import { useState } from 'react'
import CopiloAnima  from '../CopiloAnima'
import { useUser }    from '../../context/UserContext'
import { useRanchoId } from '../../hooks/useAnimales'
import {
  useExportacionDetalle,
  dbToAreteRow,
} from '../../hooks/useExportacion'
import type { SolicitudData, AreteRow, SolicitudGuardada } from '../artifactTypes'

import ExportacionHistorialWidget  from './widgets/ExportacionHistorialWidget'
import ExportacionSolicitudWidget  from './widgets/ExportacionSolicitudWidget'
import ExportacionTablaWidget      from './widgets/ExportacionTablaWidget'
import ExportacionValidacionWidget from './widgets/ExportacionValidacionWidget'
import ExportacionScannerWidget    from './widgets/ExportacionScannerWidget'
import ExportacionExportWidget     from './widgets/ExportacionExportWidget'

const EXPORT_COLOR = '#f97316'

interface Props {
  onClose:    () => void
  onEscalate: () => void
}

type TabId = 'solicitud' | 'aretes' | 'validar' | 'scanner' | 'exportar'

const TABS: { id: TabId; label: string; needsSaved?: true }[] = [
  { id: 'solicitud', label: 'Solicitud'                    },
  { id: 'aretes',    label: 'Aretes',    needsSaved: true  },
  { id: 'validar',   label: 'Validar',   needsSaved: true  },
  { id: 'scanner',   label: 'Escáner',   needsSaved: true  },
  { id: 'exportar',  label: 'Exportar',  needsSaved: true  },
]

export default function ExportacionAnima({ onClose, onEscalate }: Props) {
  const { profile } = useUser()
  const userId      = profile?.user_id ?? null
  const { ranchoId } = useRanchoId(userId)

  const [historialTrigger, setHistorialTrigger] = useState(0)
  const [tab,         setTab]         = useState<TabId>('solicitud')
  const [solicitudId, setSolicitudId] = useState<string | null>(null)
  const [solicitud,   setSolicitud]   = useState<SolicitudData>({ psg: '', upp: '', sexo: 'Macho', folioFactura: '' })
  const [rows,        setRows]        = useState<AreteRow[]>([])
  const [folioInt,    setFolioInt]    = useState('')
  const [municipioId, setMunicipioId] = useState<string>('')
  const [saved,       setSaved]       = useState(false)
  const [nextId,      setNextId]      = useState(1)

  const { solicitud: solDB, aretes: aretesDB } = useExportacionDetalle(solicitudId)

  // Sincronizar desde BD cuando carga el detalle
  if (solDB && saved && rows.length === 0 && aretesDB.length > 0) {
    setRows(aretesDB.map(dbToAreteRow))
    setNextId(aretesDB.length + 1)
  }

  const errores = rows.filter(r => r.status !== 'ok').length
  const validos = rows.filter(r => r.status === 'ok').length

  const goTab = (id: TabId) => {
    const t = TABS.find(t => t.id === id)
    if (t?.needsSaved && !saved) return
    setTab(id)
  }

  const resetSolicitud = () => {
    setSolicitudId(null)
    setSolicitud({ psg: '', upp: '', sexo: 'Macho', folioFactura: '' })
    setRows([])
    setNextId(1)
    setSaved(false)
    setFolioInt('')
    setTab('solicitud')
  }

  const handleSelectHistorial = (s: SolicitudGuardada) => {
    setSolicitudId(s.id)
    setSolicitud(s.solicitud)
    setRows(s.rows ?? [])
    setNextId((s.rows?.length ?? 0) + 1)
    setSaved(true)
    setFolioInt(s.folio)
    setTab('solicitud')
  }

  const handleScan = (arete: string, folio: string) => {
    setRows(r => [...r, { id: nextId, areteOrigen: arete, folioFactura: folio, status: 'ok' }])
    setNextId(n => n + 1)
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#fafaf9] dark:bg-[#0c0a09]">

      {/* ── Topbar ── */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-stone-200/70 dark:border-stone-800 shrink-0">

        {/* Título */}
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full shrink-0" style={{ background: EXPORT_COLOR }}/>
          <p className="text-[13px] font-semibold text-stone-800 dark:text-stone-100">Aretes Azules</p>
          {folioInt ? (
            <span className="font-mono text-[10.5px] text-stone-400 dark:text-stone-500">{folioInt}</span>
          ) : (
            <span className="hidden sm:inline text-[9.5px] font-mono font-semibold px-2 py-0.5 rounded tracking-wider uppercase"
              style={{ color: EXPORT_COLOR, background: `${EXPORT_COLOR}12`, border: `1px solid ${EXPORT_COLOR}28` }}>
              SENASICA
            </span>
          )}
        </div>

        {/* Tabs desktop */}
        <div className="hidden sm:flex items-center gap-0.5 bg-stone-100 dark:bg-stone-800/60 rounded-[10px] p-1">
          {TABS.map(t => {
            const isLocked = !!t.needsSaved && !saved
            const isActive = tab === t.id
            return (
              <button key={t.id} onClick={() => goTab(t.id)} disabled={isLocked}
                className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-[7px] text-[11.5px] font-medium transition-all border-0 whitespace-nowrap ${
                  isLocked
                    ? 'text-stone-300 dark:text-stone-600 cursor-not-allowed bg-transparent'
                    : isActive
                      ? 'bg-white dark:bg-stone-700 text-stone-800 dark:text-stone-100 shadow-sm cursor-pointer'
                      : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 bg-transparent cursor-pointer'
                }`}>
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
          <button onClick={onEscalate}
            className="h-7 px-2.5 rounded-lg text-[11px] font-medium text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800/60 transition-all flex items-center gap-1.5 cursor-pointer border-0 bg-transparent">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/>
              <line x1="10" y1="14" x2="17" y2="7"/><line x1="4" y1="20" x2="11" y2="13"/>
            </svg>
            <span className="hidden sm:inline">Panel</span>
          </button>
          <button onClick={onClose}
            className="h-7 px-2.5 rounded-lg text-[11px] font-medium text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800/60 transition-all cursor-pointer border-0 bg-transparent whitespace-nowrap">
            Volver al chat
          </button>
        </div>
      </div>

      {/* ── Layout principal ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── Sidebar historial izquierdo (solo desktop) ── */}
        <div className="hidden lg:flex lg:flex-col w-60 shrink-0 border-r border-stone-200/70 dark:border-stone-800 bg-white dark:bg-[#111110]">
          <ExportacionHistorialWidget
            selectedId={solicitudId ?? undefined}
            onSelect={handleSelectHistorial}
            onNueva={resetSolicitud}
            refreshTrigger={historialTrigger}
          />
        </div>

        {/* ── Zona central ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 pb-[72px] sm:pb-5 [&::-webkit-scrollbar]:w-[4px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-stone-200 dark:[&::-webkit-scrollbar-thumb]:bg-stone-700 [&::-webkit-scrollbar-thumb]:rounded-full">
          <div className="max-w-2xl mx-auto">

            {tab === 'solicitud' && (
              <ExportacionSolicitudWidget
                data={solicitud} onChange={setSolicitud}
                solicitudId={solicitudId} ranchoId={ranchoId} userId={userId}
                onSave={d => { setSolicitud(d); setSaved(true) }}
                onCreated={id => { setSolicitudId(id); setSaved(true); setHistorialTrigger(t => t + 1) }}
                municipioId={municipioId}
                onMunicipioChange={setMunicipioId}
              />
            )}

            {tab === 'aretes' && (
              <>
                <div className="flex items-center gap-2 flex-wrap mb-4 px-3 py-2 rounded-[8px] bg-stone-50 dark:bg-stone-800/40 border border-stone-200/70 dark:border-stone-800/60">
                  <span className="font-mono text-[10.5px] text-stone-500 dark:text-stone-400">{solicitud.psg || '—'}</span>
                  <span className="text-stone-300 dark:text-stone-700 text-[9px]">·</span>
                  <span className="font-mono text-[10.5px] text-stone-500 dark:text-stone-400">{solicitud.folioFactura || '—'}</span>
                  <span className="text-stone-300 dark:text-stone-700 text-[9px]">·</span>
                  <span className="font-mono text-[10.5px] text-stone-500 dark:text-stone-400">{solicitud.sexo}</span>
                  {solicitud.upp && (
                    <><span className="text-stone-300 dark:text-stone-700 text-[9px]">·</span>
                    <span className="font-mono text-[10.5px] text-stone-400 dark:text-stone-500 truncate max-w-[140px]">{solicitud.upp}</span></>
                  )}
                </div>
                <ExportacionTablaWidget
                  rows={rows} onChange={setRows}
                  solicitudId={solicitudId} ranchoId={ranchoId}
                />
              </>
            )}

            {tab === 'validar' && (
              <ExportacionValidacionWidget
                rows={rows} onRowsChange={setRows}
                onGoAretes={() => setTab('aretes')}
                solicitudId={solicitudId} ranchoId={ranchoId}
              />
            )}

            {tab === 'scanner' && (
              <ExportacionScannerWidget
                existingAretes={rows.map(r => r.areteOrigen)}
                existingFolios={[...new Set([...rows.map(r => r.folioFactura), solicitud.folioFactura].filter(Boolean))]}
                onScan={handleScan}
              />
            )}

            {tab === 'exportar' && (
              <>
                <div className="flex items-center gap-2 flex-wrap mb-4 px-3 py-2 rounded-[8px] bg-stone-50 dark:bg-stone-800/40 border border-stone-200/70 dark:border-stone-800/60">
                  <span className="font-mono text-[10.5px] font-semibold text-emerald-600 dark:text-emerald-400">{validos} válidos</span>
                  {errores > 0 && (
                    <><span className="text-stone-300 dark:text-stone-700 text-[9px]">·</span>
                    <button onClick={() => goTab('validar')}
                      className="font-mono text-[10.5px] text-red-500 cursor-pointer bg-transparent border-0 p-0">
                      {errores} error{errores !== 1 ? 'es' : ''} — corregir →
                    </button></>
                  )}
                </div>
                <ExportacionExportWidget
                  solicitud={solicitud} rows={rows}
                  solicitudId={solicitudId} ranchoId={ranchoId}
                  folioInterno={folioInt}
                  municipioId={municipioId}
                />
              </>
            )}

          </div>
        </div>

      </div>

      {/* ── Bottom nav móvil ── */}
      <div
        className="sm:hidden fixed bottom-0 left-0 right-0 z-[60] flex items-center border-t border-stone-200/70 dark:border-stone-800 bg-white dark:bg-[#1c1917]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {TABS.map(t => {
          const isLocked = !!t.needsSaved && !saved
          const isActive = tab === t.id
          const icons: Record<TabId, React.ReactNode> = {
            solicitud: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
            aretes:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="9" x2="9" y2="21"/></svg>,
            validar:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
            scanner:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>,
            exportar:  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
          }
          return (
            <button key={t.id}
              onClick={() => !isLocked && goTab(t.id)}
              className={`relative flex-1 flex items-center justify-center py-3 border-0 bg-transparent transition-all ${
                isLocked ? 'opacity-25 cursor-not-allowed' : 'cursor-pointer'
              }`}
              style={isActive && !isLocked ? { color: EXPORT_COLOR } : { color: '#a8a29e' }}>
              {isActive && !isLocked && (
                <div className="absolute top-0 left-[25%] right-[25%] h-[2px] rounded-b-full" style={{ background: EXPORT_COLOR }}/>
              )}
              {icons[t.id]}
              {t.id === 'validar' && errores > 0 && !isLocked && (
                <span className="absolute top-1.5 right-[22%] w-3.5 h-3.5 rounded-full bg-red-400 text-white font-bold text-[8px] flex items-center justify-center">
                  {errores}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* ── Copiloto ── */}
      <CopiloAnima domain="exportacion" />
    </div>
  )
}