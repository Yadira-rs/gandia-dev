/**
 * ExportacionModulo — Módulo (nivel awake / panel lateral)
 * Completamente conectado a Supabase vía useExportacion.
 * ARCHIVO → src/artifacts/exportacion/ExportacionModulo.tsx
 */

import { useState } from 'react'
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

type TabId = 'historial' | 'solicitud' | 'aretes' | 'validar' | 'scanner' | 'exportar'

const TABS: { id: TabId; label: string; needsSaved?: true }[] = [
  { id: 'historial', label: 'Historial'                    },
  { id: 'solicitud', label: 'Solicitud'                    },
  { id: 'aretes',    label: 'Aretes',    needsSaved: true  },
  { id: 'validar',   label: 'Validar',   needsSaved: true  },
  { id: 'scanner',   label: 'Escáner',   needsSaved: true  },
  { id: 'exportar',  label: 'Exportar',  needsSaved: true  },
]

export default function ExportacionModulo({ onClose, onEscalate }: Props) {
  const { profile } = useUser()
  const userId      = profile?.user_id ?? null
  const { ranchoId } = useRanchoId(userId)

  // ── Estado de la solicitud activa ──────────────────────────────────────────
  const [historialTrigger, setHistorialTrigger] = useState(0)
  const [tab,         setTab]         = useState<TabId>('historial')
  const [solicitudId, setSolicitudId] = useState<string | null>(null)
  const [solicitud,   setSolicitud]   = useState<SolicitudData>({ psg: '', upp: '', sexo: 'Macho', folioFactura: '' })
  const [rows,        setRows]        = useState<AreteRow[]>([])
  const [folioInt,    setFolioInt]    = useState<string>('')
  const [municipioId, setMunicipioId] = useState<string>('')
  const [saved,       setSaved]       = useState(false)
  const [nextId,      setNextId]      = useState(1)

  // Carga lazy del detalle cuando hay solicitudId
  const { solicitud: solDB, aretes: aretesDB } = useExportacionDetalle(solicitudId)

  // Sincronizar BD → estado local cuando cambia la solicitud seleccionada
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
    <div className="flex-1 flex flex-col bg-[#fafaf9] dark:bg-[#0c0a09] overflow-hidden">

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 h-12 border-b border-stone-200/70 dark:border-stone-800 shrink-0 bg-white dark:bg-[#1c1917]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full shrink-0" style={{ background: EXPORT_COLOR }}/>
          <p className="text-[12px] font-bold text-stone-700 dark:text-stone-200">Aretes Azules</p>
          {folioInt && (
            <span className="font-mono text-[10px] text-stone-400 dark:text-stone-500">{folioInt}</span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={onEscalate}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[8px] border border-stone-200/70 dark:border-stone-800/60 bg-white dark:bg-[#1c1917] text-[11px] text-stone-400 cursor-pointer hover:text-[#f97316] hover:border-[#f97316]/40 transition-all">
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/>
              <line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
            </svg>
            Espacio Gandia
          </button>
          <button onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-[8px] border border-stone-200/70 dark:border-stone-800/60 bg-white dark:bg-[#1c1917] text-stone-400 cursor-pointer hover:text-stone-600 dark:hover:text-stone-300 transition-colors">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex border-b border-stone-200/70 dark:border-stone-800/60 bg-white dark:bg-[#1c1917] px-3.5 shrink-0 overflow-x-auto [&::-webkit-scrollbar]:hidden">
        {TABS.map(t => {
          const isLocked = !!t.needsSaved && !saved
          const isActive = tab === t.id
          return (
            <button key={t.id} onClick={() => goTab(t.id)} disabled={isLocked}
              className={`relative flex items-center gap-1.5 px-2.5 py-2.5 text-[11.5px] border-0 bg-transparent transition-all -mb-px shrink-0 ${
                isLocked
                  ? 'text-stone-300 dark:text-stone-700 cursor-not-allowed border-b-2 border-transparent'
                  : isActive
                    ? 'text-stone-700 dark:text-stone-200 font-semibold border-b-2 cursor-pointer'
                    : 'text-stone-400 dark:text-stone-500 border-b-2 border-transparent hover:text-stone-600 dark:hover:text-stone-300 cursor-pointer'
              }`}
              style={isActive && !isLocked ? { borderBottomColor: EXPORT_COLOR } : {}}>
              {isLocked && (
                <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
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
              selectedId={solicitudId ?? undefined}
              onSelect={handleSelectHistorial}
              onNueva={() => { resetSolicitud(); setTab('solicitud') }}
              refreshTrigger={historialTrigger}
            />
          )}

          {tab === 'solicitud' && (
            <ExportacionSolicitudWidget
              data={solicitud}
              onChange={setSolicitud}
              solicitudId={solicitudId}
              ranchoId={ranchoId}
              userId={userId}
              onSave={d => { setSolicitud(d); setSaved(true) }}
              onCreated={id => { setSolicitudId(id); setSaved(true); setHistorialTrigger(t => t + 1) }}
              municipioId={municipioId}
              onMunicipioChange={setMunicipioId}
            />
          )}

          {tab === 'aretes' && (
            <>
              {/* Contexto de la solicitud */}
              <div className="flex items-center gap-2 flex-wrap mb-3 px-3 py-2 rounded-[8px] bg-stone-50 dark:bg-stone-800/40 border border-stone-200/70 dark:border-stone-800/60">
                <span className="font-mono text-[10.5px] text-stone-500 dark:text-stone-400">{solicitud.psg || '—'}</span>
                <span className="text-stone-300 dark:text-stone-700 text-[9px]">·</span>
                <span className="font-mono text-[10.5px] text-stone-500 dark:text-stone-400">{solicitud.folioFactura || '—'}</span>
                <span className="text-stone-300 dark:text-stone-700 text-[9px]">·</span>
                <span className="font-mono text-[10.5px] text-stone-500 dark:text-stone-400">{solicitud.sexo}</span>
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
              {/* Resumen antes de exportar */}
              <div className="flex items-center gap-2 flex-wrap mb-3 px-3 py-2 rounded-[8px] bg-stone-50 dark:bg-stone-800/40 border border-stone-200/70 dark:border-stone-800/60">
                <span className="font-mono text-[10.5px] font-semibold text-emerald-600 dark:text-emerald-400">{validos} válidos</span>
                {errores > 0 && (
                  <>
                    <span className="text-stone-300 dark:text-stone-700 text-[9px]">·</span>
                    <button onClick={() => setTab('validar')}
                      className="font-mono text-[10.5px] text-red-500 cursor-pointer bg-transparent border-0 p-0">
                      {errores} error{errores !== 1 ? 'es' : ''} — corregir →
                    </button>
                  </>
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
  )
}