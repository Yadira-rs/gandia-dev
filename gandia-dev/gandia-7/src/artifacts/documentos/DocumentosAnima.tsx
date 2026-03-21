/**
 * DocumentosAnima — Ánima (pantalla completa) de la sección Documentos
 * ARCHIVO → src/artifacts/documentos/DocumentosAnima.tsx
 *
 * Igual que FichaAnima: top bar + tabs + contenido + copiloto flotante.
 * Productor: Subida · Validación · Expedientes · Empacar
 * Unión:     Panel General · Revisión · Validación · Expedientes
 */

import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useUser }  from '../../context/UserContext'
import CopiloAnima  from '../CopiloAnima'

import DocSubidaWidget       from './widgets/DocSubidaWidget'
import DocValidacionWidget   from './widgets/DocValidacionWidget'
import DocExpedienteWidget   from './widgets/DocExpedienteWidget'
import DocEmpaqueWidget      from './widgets/DocEmpaqueWidget'
import DocRevisionWidget     from './widgets/DocRevisionWidget'
import DocPanelGeneralWidget from './widgets/DocPanelGeneralWidget'
import TramiteNuevoWidget    from './widgets/TramiteNuevoWidget'

// ─── PROPS ────────────────────────────────────────────────────────────────────

interface Props {
  onClose:    () => void
  onEscalate: () => void  // = onDeescalate (volver al módulo)
}

type TabProductor = 'subida' | 'validacion' | 'expedientes' | 'empacar' | 'tramite'
type TabUnion     = 'panel' | 'revision' | 'validacion' | 'expedientes'

const TABS_PRODUCTOR: { id: TabProductor; label: string }[] = [
  { id: 'subida',      label: 'Subida'        },
  { id: 'validacion',  label: 'Validación'    },
  { id: 'expedientes', label: 'Expedientes'   },
  { id: 'empacar',     label: 'Empacar'       },
  { id: 'tramite',     label: 'Nuevo trámite' },
]

const TABS_UNION: { id: TabUnion; label: string }[] = [
  { id: 'panel',       label: 'Panel general' },
  { id: 'revision',    label: 'Revisión'      },
  { id: 'validacion',  label: 'Validación'    },
  { id: 'expedientes', label: 'Expedientes'   },
]

const COLOR = '#3b82f6'

// ─── ÁNIMA ────────────────────────────────────────────────────────────────────

export default function DocumentosAnima({ onClose, onEscalate }: Props) {
  const { role } = useUser()
  const isUnion  = role === 'union' || (role as string) === 'union_ganadera'
  const location = useLocation()
  const docFilter = (location.state as { docFilter?: string } | null)?.docFilter ?? null

  const [tabProductor, setTabProductor] = useState<TabProductor>('subida')
  const [tabUnion,     setTabUnion]     = useState<TabUnion>(docFilter ? 'revision' : 'panel')

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#fafaf9] dark:bg-[#0c0a09]">

      {/* ── Topbar ── */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-stone-200/70 dark:border-stone-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full" style={{ background: COLOR }} />
          <p className="text-[13px] font-semibold text-stone-800 dark:text-stone-100">Documentos</p>
          <span
            className="text-[9.5px] font-mono font-semibold px-2 py-0.5 rounded tracking-wider uppercase"
            style={{ color: COLOR, background: `${COLOR}14`, border: `1px solid ${COLOR}30` }}
          >
            Espacio Gandia
          </span>
          {isUnion && (
            <span className="text-[9.5px] font-mono text-stone-400 dark:text-stone-500">
              Unión Ganadera
            </span>
          )}
        </div>

        {/* Tabs en el topbar */}
        <div className="flex items-center gap-0.5 bg-stone-100 dark:bg-stone-800/60 rounded-[10px] p-1">
          {isUnion
            ? TABS_UNION.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTabUnion(t.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[7px] text-[11.5px] font-medium transition-all border-0 cursor-pointer ${
                    tabUnion === t.id
                      ? 'bg-white dark:bg-stone-700 text-stone-800 dark:text-stone-100 shadow-sm'
                      : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 bg-transparent'
                  }`}
                >
                  {t.label}
                </button>
              ))
            : TABS_PRODUCTOR.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTabProductor(t.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[7px] text-[11.5px] font-medium transition-all border-0 cursor-pointer ${
                    tabProductor === t.id
                      ? 'bg-white dark:bg-stone-700 text-stone-800 dark:text-stone-100 shadow-sm'
                      : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 bg-transparent'
                  }`}
                >
                  {t.label}
                </button>
              ))
          }
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onEscalate}
            className="h-7 px-2.5 rounded-lg text-[11px] font-medium text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800/60 transition-all flex items-center gap-1.5 cursor-pointer border-0 bg-transparent"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/>
              <line x1="10" y1="14" x2="17" y2="7"/><line x1="4" y1="20" x2="11" y2="13"/>
            </svg>
            Panel
          </button>
          <button
            onClick={onClose}
            className="h-7 px-2.5 rounded-lg text-[11px] font-medium text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800/60 transition-all cursor-pointer border-0 bg-transparent"
          >
            Volver al chat
          </button>
        </div>
      </div>

      {/* ── Contenido ── */}
      <div className="flex-1 overflow-y-auto px-6 py-5 [&::-webkit-scrollbar]:w-[4px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-stone-200 dark:[&::-webkit-scrollbar-thumb]:bg-stone-700 [&::-webkit-scrollbar-thumb]:rounded-full">
        <div className="max-w-2xl mx-auto">
          {isUnion ? (
            <>
              {tabUnion === 'panel'       && <DocPanelGeneralWidget />}
              {tabUnion === 'revision'    && <DocRevisionWidget filterNombre={docFilter} />}
              {tabUnion === 'validacion'  && <DocValidacionWidget />}
              {tabUnion === 'expedientes' && <DocExpedienteWidget />}
            </>
          ) : (
            <>
              {tabProductor === 'subida'      && <DocSubidaWidget />}
              {tabProductor === 'validacion'  && <DocValidacionWidget />}
              {tabProductor === 'expedientes' && <DocExpedienteWidget />}
              {tabProductor === 'empacar'     && <DocEmpaqueWidget />}
              {tabProductor === 'tramite'     && <TramiteNuevoWidget />}
            </>
          )}
        </div>
      </div>

      {/* ── Copiloto flotante ── */}
      <CopiloAnima domain="documentos" />
    </div>
  )
}