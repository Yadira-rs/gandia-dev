/**
 * VinculacionModulo — Módulo (nivel awake / panel lateral)
 * Datos reales desde Supabase via useVinculaciones().
 * Tabs: Activas · Pendientes · Nueva · Historial
 */

import { useState } from 'react'
import { useVinculaciones } from '../../hooks/useVinculaciones'
import type { VinculacionTipo } from '../artifactTypes'

import VinculacionListaWidget      from './widgets/VinculacionListaWidget'
import VinculacionPendientesWidget from './widgets/VinculacionPendientesWidget'
import VinculacionNuevaWidget      from './widgets/VinculacionNuevaWidget'
import VinculacionHistorialWidget  from './widgets/VinculacionHistorialWidget'

const VIN_COLOR = '#0ea5e9'

interface Props {
  onClose:    () => void
  onEscalate: () => void
}

type TabId = 'activas' | 'pendientes' | 'nueva' | 'historial'

const TABS: { id: TabId; label: string }[] = [
  { id: 'activas',    label: 'Activas'    },
  { id: 'pendientes', label: 'Pendientes' },
  { id: 'nueva',      label: 'Nueva'      },
  { id: 'historial',  label: 'Historial'  },
]

// ─────────────────────────────────────────────────────────────────────────────

export default function VinculacionModulo({ onClose, onEscalate }: Props) {
  const [tab, setTab] = useState<TabId>('activas')

  const {
    activas,
    pendientes,
    historial,
    loading,
    error,
    handleAceptar,
    handleRechazar,
    handleRevocar,
    handleEnviar,
  } = useVinculaciones()

  const pendiCount = pendientes.length

  // Wrapper para VinculacionNuevaWidget que adapta la firma
  const onEnviar = async (tipo: VinculacionTipo, receptorId: string, mensaje: string, expiraDias?: number) => {
    await handleEnviar(tipo, receptorId, mensaje, expiraDias)
    setTab('pendientes')
  }

  return (
    <div className="flex-1 flex flex-col bg-[#fafaf9] dark:bg-[#0c0a09] overflow-hidden">

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 h-12 border-b border-stone-200/70 dark:border-stone-800 shrink-0 bg-white dark:bg-[#1c1917]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: VIN_COLOR }}/>
          <p className="text-[12px] font-bold text-stone-700 dark:text-stone-200">Vinculaciones</p>
          <span className="text-[9.5px] font-mono text-stone-400 dark:text-stone-500 uppercase tracking-wider">
            Red de acceso
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={onEscalate}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[8px] border border-stone-200/70 dark:border-stone-800/60 bg-white dark:bg-[#1c1917] text-[11px] text-stone-400 dark:text-stone-500 cursor-pointer hover:border-sky-400/40 transition-all"
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
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`relative flex items-center gap-1.5 px-2.5 py-2.5 text-[11.5px] border-0 bg-transparent transition-all -mb-px shrink-0
              ${tab === t.id
                ? 'text-stone-700 dark:text-stone-200 font-semibold border-b-2 cursor-pointer'
                : 'text-stone-400 dark:text-stone-500 font-normal border-b-2 border-transparent hover:text-stone-600 dark:hover:text-stone-300 cursor-pointer'
              }`}
            style={tab === t.id ? { borderBottomColor: VIN_COLOR } : {}}
          >
            {t.label}
            {t.id === 'pendientes' && pendiCount > 0 && (
              <span
                className="w-3.5 h-3.5 rounded-full text-white font-bold text-[8px] flex items-center justify-center"
                style={{ background: VIN_COLOR }}
              >
                {pendiCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Contenido ── */}
      <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-[4px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-stone-200 dark:[&::-webkit-scrollbar-thumb]:bg-stone-700 [&::-webkit-scrollbar-thumb]:rounded-full">
        <div className="p-4">

          {/* Error banner */}
          {error && (
            <div className="mb-3 p-2.5 rounded-[8px] bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 text-[11px] text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Loading skeleton */}
          {loading && (
            <div className="flex flex-col gap-2.5">
              {[1,2,3].map(i => (
                <div key={i} className="h-16 rounded-[10px] bg-stone-100 dark:bg-stone-800/40 animate-pulse"/>
              ))}
            </div>
          )}

          {!loading && tab === 'activas' && (
            <VinculacionListaWidget
              vinculaciones={activas}
              onRevocar={handleRevocar}
              onNueva={() => setTab('nueva')}
            />
          )}

          {!loading && tab === 'pendientes' && (
            <VinculacionPendientesWidget
              pendientes={pendientes}
              onAceptar={handleAceptar}
              onRechazar={handleRechazar}
            />
          )}

          {!loading && tab === 'nueva' && (
            <VinculacionNuevaWidget
              onEnviar={onEnviar}
            />
          )}

          {!loading && tab === 'historial' && (
            <VinculacionHistorialWidget
              historial={historial}
            />
          )}

        </div>
      </div>
    </div>
  )
}