/**
 * MarketplaceModulo.tsx — Panel lateral del Marketplace
 * 4 tabs: Soluciones · Partners · Compatibilidad · Mi Equipo
 *
 * ARCHIVO → src/artifacts/marketplace/MarketplaceModulo.tsx
 */

import { useState } from 'react'
import MarketplaceKitsWidget from './widgets/MarketplaceKitsWidget'
import MarketplacePartnersWidget from './widgets/MarketplacePartnersWidget'
import MarketplaceCompatibilidadWidget from './widgets/MarketplaceCompatibilidadWidget'
import MarketplaceEquipamientoWidget from './widgets/MarketplaceEquipamientoWidget'

interface Props {
  onClose: () => void
  onEscalate: () => void
}

type TabId = 'soluciones' | 'partners' | 'compatibilidad' | 'equipamiento'

const TABS: { id: TabId; label: string }[] = [
  { id: 'soluciones', label: 'Soluciones' },
  { id: 'partners', label: 'Partners' },
  { id: 'compatibilidad', label: 'Compatibilidad' },
  { id: 'equipamiento', label: 'Mi Equipo' },
]

export default function MarketplaceModulo({ onClose, onEscalate }: Props) {
  const [tab, setTab] = useState<TabId>('soluciones')

  return (
    <div className="flex-1 flex flex-col bg-[#fafaf9] dark:bg-[#0c0a09] overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-4 h-12 border-b border-stone-200/70 dark:border-stone-800 shrink-0 bg-white dark:bg-[#1c1917]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#2FAF8F]" />
          <p className="text-[12px] font-bold text-stone-700 dark:text-stone-200">Marketplace Gandia 7</p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={onEscalate}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[8px] border border-stone-200/70 dark:border-stone-800/60 bg-white dark:bg-[#1c1917] text-[11px] text-stone-400 dark:text-stone-500 cursor-pointer hover:text-[#2FAF8F] hover:border-[#2FAF8F]/40 transition-all"
          >
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" />
              <line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" />
            </svg>
            Espacio Gandia
          </button>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-[8px] border border-stone-200/70 dark:border-stone-800/60 bg-white dark:bg-[#1c1917] text-stone-400 dark:text-stone-500 cursor-pointer hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-stone-200/70 dark:border-stone-800/60 bg-white dark:bg-[#1c1917] px-3.5 shrink-0 overflow-x-auto [&::-webkit-scrollbar]:hidden scrollbar-none">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-2.5 py-2.5 text-[11.5px] border-0 bg-transparent transition-all -mb-px shrink-0 cursor-pointer
              ${tab === t.id
                ? 'text-stone-700 dark:text-stone-200 font-semibold border-b-2 border-[#2FAF8F]'
                : 'text-stone-400 dark:text-stone-500 font-normal border-b-2 border-transparent hover:text-stone-600 dark:hover:text-stone-300'
              }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Contenido */}
      <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-[4px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-stone-200 dark:[&::-webkit-scrollbar-thumb]:bg-stone-700 [&::-webkit-scrollbar-thumb]:rounded-full">
        <div className="p-4">
          {tab === 'soluciones' && <MarketplaceKitsWidget onExpand={onEscalate} />}
          {tab === 'partners' && <MarketplacePartnersWidget />}
          {tab === 'compatibilidad' && <MarketplaceCompatibilidadWidget />}
          {tab === 'equipamiento' && <MarketplaceEquipamientoWidget />}
        </div>
      </div>
    </div>
  )
}