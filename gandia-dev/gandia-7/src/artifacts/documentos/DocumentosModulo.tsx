/**
 * DocumentosModulo — Módulo (panel lateral) de la sección Documentos
 * ARCHIVO → src/artifacts/documentos/DocumentosModulo.tsx
 *
 * Productor: Subida · Validación · Expedientes · Empacar
 * Unión:     Panel General · Revisión · Validación · Expedientes
 */

import { useState } from 'react'
import { useUser }  from '../../context/UserContext'

import DocSubidaWidget      from './widgets/DocSubidaWidget'
import DocValidacionWidget  from './widgets/DocValidacionWidget'
import DocExpedienteWidget  from './widgets/DocExpedienteWidget'
import DocEmpaqueWidget     from './widgets/DocEmpaqueWidget'
import DocRevisionWidget    from './widgets/DocRevisionWidget'
import DocPanelGeneralWidget from './widgets/DocPanelGeneralWidget'
import TramiteNuevoWidget   from './widgets/TramiteNuevoWidget'

// ─── PROPS ────────────────────────────────────────────────────────────────────

interface Props {
  onClose:    () => void
  onEscalate: () => void
}

type TabProductor = 'subida' | 'validacion' | 'expedientes' | 'empacar' | 'tramite'
type TabUnion     = 'panel' | 'revision' | 'validacion' | 'expedientes'

const TABS_PRODUCTOR: { id: TabProductor; label: string }[] = [
  { id: 'subida',      label: 'Subida'      },
  { id: 'validacion',  label: 'Validación'  },
  { id: 'expedientes', label: 'Expedientes' },
  { id: 'empacar',     label: 'Empacar'     },
  { id: 'tramite',     label: 'Nuevo trámite' },
]

const TABS_UNION: { id: TabUnion; label: string }[] = [
  { id: 'panel',       label: 'Panel general' },
  { id: 'revision',    label: 'Revisión'      },
  { id: 'validacion',  label: 'Validación'    },
  { id: 'expedientes', label: 'Expedientes'   },
]

// ─── MÓDULO ───────────────────────────────────────────────────────────────────

export default function DocumentosModulo({ onClose, onEscalate }: Props) {
  const { role } = useUser()
  const isUnion  = role === 'union' || (role as string) === 'union_ganadera'

  const [tabProductor, setTabProductor] = useState<TabProductor>('subida')
  const [tabUnion,     setTabUnion]     = useState<TabUnion>('panel')

  const COLOR = '#3b82f6'  // azul documentos

  return (
    <div className="flex-1 flex flex-col bg-[#fafaf9] dark:bg-[#0c0a09] overflow-hidden">

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 h-12 border-b border-stone-200/70 dark:border-stone-800 shrink-0 bg-white dark:bg-[#1c1917]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: COLOR }} />
          <p className="text-[12px] font-bold text-stone-700 dark:text-stone-200">Documentos</p>
          <span className="text-[9.5px] font-mono text-stone-400 dark:text-stone-500 uppercase tracking-wider">
            {isUnion ? 'Unión Ganadera' : 'Gandia'}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={onEscalate}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[8px] border border-stone-200/70 dark:border-stone-800/60 bg-white dark:bg-[#1c1917] text-[11px] text-stone-400 dark:text-stone-500 cursor-pointer hover:text-[#3b82f6] hover:border-[#3b82f6]/40 transition-all"
          >
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/>
              <line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
            </svg>
            Espacio Gandia
          </button>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-[8px] border border-stone-200/70 dark:border-stone-800/60 bg-white dark:bg-[#1c1917] text-stone-400 dark:text-stone-500 cursor-pointer hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex border-b border-stone-200/70 dark:border-stone-800/60 bg-white dark:bg-[#1c1917] px-3.5 shrink-0 overflow-x-auto [&::-webkit-scrollbar]:hidden">
        {isUnion
          ? TABS_UNION.map(t => (
              <button
                key={t.id}
                onClick={() => setTabUnion(t.id)}
                className={`flex items-center px-2.5 py-2.5 text-[11.5px] border-0 bg-transparent transition-all -mb-px shrink-0 ${
                  tabUnion === t.id
                    ? 'text-stone-700 dark:text-stone-200 font-semibold border-b-2 cursor-pointer'
                    : 'text-stone-400 dark:text-stone-500 font-normal border-b-2 border-transparent hover:text-stone-600 dark:hover:text-stone-300 cursor-pointer'
                }`}
                style={tabUnion === t.id ? { borderColor: COLOR } : {}}
              >
                {t.label}
              </button>
            ))
          : TABS_PRODUCTOR.map(t => (
              <button
                key={t.id}
                onClick={() => setTabProductor(t.id)}
                className={`flex items-center px-2.5 py-2.5 text-[11.5px] border-0 bg-transparent transition-all -mb-px shrink-0 ${
                  tabProductor === t.id
                    ? 'text-stone-700 dark:text-stone-200 font-semibold border-b-2 cursor-pointer'
                    : 'text-stone-400 dark:text-stone-500 font-normal border-b-2 border-transparent hover:text-stone-600 dark:hover:text-stone-300 cursor-pointer'
                }`}
                style={tabProductor === t.id ? { borderColor: COLOR } : {}}
              >
                {t.label}
              </button>
            ))
        }
      </div>

      {/* ── Contenido ── */}
      <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-[4px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-stone-200 dark:[&::-webkit-scrollbar-thumb]:bg-stone-700 [&::-webkit-scrollbar-thumb]:rounded-full">
        <div className="p-4">
          {isUnion ? (
            <>
              {tabUnion === 'panel'       && <DocPanelGeneralWidget />}
              {tabUnion === 'revision'    && <DocRevisionWidget />}
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
    </div>
  )
}