/**
 * VinculacionAnima — Ánima (nivel completo / pantalla entera)
 * Datos reales desde Supabase via useVinculaciones().
 * Sidebar con activas en desktop. Tabs en topbar. Móvil: barra de tabs fija en la parte inferior.
 */

import { useState } from 'react'
import CopiloAnima from '../CopiloAnima'
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

const DESKTOP_TABS: { id: TabId; label: string }[] = [
  { id: 'activas',    label: 'Activas'    },
  { id: 'pendientes', label: 'Pendientes' },
  { id: 'nueva',      label: 'Nueva'      },
  { id: 'historial',  label: 'Historial'  },
]

// ─────────────────────────────────────────────────────────────────────────────

export default function VinculacionAnima({ onClose, onEscalate }: Props) {
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

  const onEnviar = async (tipo: VinculacionTipo, receptorId: string, mensaje: string, expiraDias?: number) => {
    await handleEnviar(tipo, receptorId, mensaje, expiraDias)
    setTab('pendientes')
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#fafaf9] dark:bg-[#0c0a09]">

      {/* ── Topbar ── */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-stone-200/70 dark:border-stone-800 shrink-0">

        {/* Título */}
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full animate-pulse shrink-0" style={{ background: VIN_COLOR }}/>
          <p className="text-[13px] font-semibold text-stone-800 dark:text-stone-100">Vinculaciones</p>
          <span
            className="hidden sm:inline text-[9.5px] font-mono font-semibold px-2 py-0.5 rounded tracking-wider uppercase"
            style={{ color: VIN_COLOR, background: `${VIN_COLOR}14`, border: `1px solid ${VIN_COLOR}30` }}
          >
            Espacio Gandia
          </span>
        </div>

        {/* Tabs centrados — ocultos en móvil */}
        <div className="hidden sm:flex items-center gap-0.5 bg-stone-100 dark:bg-stone-800/60 rounded-[10px] p-1">
          {DESKTOP_TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-[7px] text-[11.5px] font-medium transition-all border-0 cursor-pointer whitespace-nowrap
                ${tab === t.id
                  ? 'bg-white dark:bg-stone-700 text-stone-800 dark:text-stone-100 shadow-sm'
                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 bg-transparent'
                }`}
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

            {/* Error banner */}
            {error && (
              <div className="mb-4 p-3 rounded-[10px] bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 text-[11.5px] text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            {/* Loading skeleton */}
            {loading && (
              <div className="flex flex-col gap-3">
                {[1,2,3].map(i => (
                  <div key={i} className="h-20 rounded-[12px] bg-stone-100 dark:bg-stone-800/40 animate-pulse"/>
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

      {/* ── Bottom nav móvil ── */}
      <div
        className="sm:hidden fixed bottom-0 left-0 right-0 z-[60] flex items-center border-t border-stone-200/70 dark:border-stone-800 bg-white dark:bg-[#1c1917]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <MobileNavBtn id="activas"    active={tab} onClick={setTab} badge={0}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
          </svg>
        </MobileNavBtn>
        <MobileNavBtn id="pendientes" active={tab} onClick={setTab} badge={pendiCount}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
        </MobileNavBtn>
        <MobileNavBtn id="nueva"      active={tab} onClick={setTab} badge={0}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </MobileNavBtn>
        <MobileNavBtn id="historial"  active={tab} onClick={setTab} badge={0}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
        </MobileNavBtn>
      </div>

      {/* ── Copiloto flotante ── */}
      <CopiloAnima domain="vinculacion" onAction={(actionId) => {
        if (actionId === 'nueva_vinculacion') setTab('nueva')
        if (actionId === 'ver_pendientes')   setTab('pendientes')
        if (actionId === 'ver_activas')      setTab('activas')
        if (actionId === 'ver_historial')    setTab('historial')
      }} />

    </div>
  )
}

// ── MobileNavBtn ───────────────────────────────────────────────────────────────

function MobileNavBtn({
  id, active, onClick, badge, children,
}: {
  id:       TabId
  active:   TabId
  onClick:  (id: TabId) => void
  badge:    number
  children: React.ReactNode
}) {
  const isActive = id === active
  return (
    <button
      onClick={() => onClick(id)}
      className={`relative flex-1 flex items-center justify-center py-3 border-0 transition-all bg-transparent cursor-pointer
        ${isActive ? '' : 'text-stone-400 dark:text-stone-500'}`}
      style={isActive ? { color: VIN_COLOR } : {}}
    >
      {isActive && (
        <div className="absolute top-0 left-[25%] right-[25%] h-[2px] rounded-b-full" style={{ background: VIN_COLOR }}/>
      )}
      {children}
      {badge > 0 && (
        <span
          className="absolute top-1.5 right-[22%] w-3.5 h-3.5 rounded-full text-white font-bold text-[8px] flex items-center justify-center"
          style={{ background: VIN_COLOR }}
        >
          {badge}
        </span>
      )}
    </button>
  )
}