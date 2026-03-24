/**
 * MarketplaceAnima.tsx — Ánima (pantalla completa) del Marketplace
 * 4 tabs + sidebar de filtros + copiloto.
 *
 * ARCHIVO → src/artifacts/marketplace/MarketplaceAnima.tsx
 */

import { useState } from 'react'
import CopiloAnima from '../CopiloAnima'
import MarketplaceKitsWidget from './widgets/MarketplaceKitsWidget'
import MarketplacePartnersWidget from './widgets/MarketplacePartnersWidget'
import MarketplaceCompatibilidadWidget from './widgets/MarketplaceCompatibilidadWidget'
import MarketplaceEquipamientoWidget from './widgets/MarketplaceEquipamientoWidget'
import {
  useMarketplacePartners,
  NECESIDADES,
  type PartnerConProductos,
} from '../../hooks/useMarketplace'

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

export default function MarketplaceAnima({ onClose, onEscalate }: Props) {
  const [tab, setTab] = useState<TabId>('soluciones')
  const [filterTag, setFilterTag] = useState<string | null>(null)
  const [filterPartner, setFilterPartner] = useState<string | null>(null)

  const { partners } = useMarketplacePartners()

  const activeTag = filterTag ?? (filterPartner ? filterPartner : undefined)

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#fafaf9] dark:bg-[#0c0a09]">

      {/* Topbar */}
      <div className="flex items-center justify-between px-3 sm:px-6 py-2 sm:py-3 border-b border-stone-200/70 dark:border-stone-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-[#2FAF8F]" />
          <p className="text-[13px] font-semibold text-stone-800 dark:text-stone-100">Marketplace Gandia 7</p>
        </div>

        {/* Tabs topbar */}
        <div className="hidden sm:flex items-center gap-0.5 bg-stone-100 dark:bg-stone-800/60 rounded-[10px] p-1 overflow-x-auto [&::-webkit-scrollbar]:hidden">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[7px] text-[11.5px] font-medium transition-all border-0 cursor-pointer
                ${tab === t.id
                  ? 'bg-white dark:bg-stone-700 text-stone-800 dark:text-stone-100 shadow-sm'
                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 bg-transparent'
                }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onEscalate}
            className="h-7 px-2.5 rounded-lg text-[11px] font-medium text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800/60 transition-all flex items-center gap-1.5 cursor-pointer border-0 bg-transparent"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="4 14 10 14 10 20" /><polyline points="20 10 14 10 14 4" />
              <line x1="10" y1="14" x2="17" y2="7" /><line x1="4" y1="20" x2="11" y2="13" />
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

      {/* Layout */}
      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar — solo visible en tab soluciones */}
        {tab === 'soluciones' && (
          <aside className="hidden sm:flex w-56 shrink-0 border-r border-stone-200/70 dark:border-stone-800 flex-col overflow-y-auto [&::-webkit-scrollbar]:w-[4px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-stone-200 dark:[&::-webkit-scrollbar-thumb]:bg-stone-700 [&::-webkit-scrollbar-thumb]:rounded-full bg-white dark:bg-[#1c1917]">
            <div className="p-4 flex flex-col gap-5">

              {/* Por necesidad */}
              <div className="flex flex-col gap-2">
                <p className="text-[9.5px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider">Por necesidad</p>
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => { setFilterTag(null); setFilterPartner(null) }}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-[7px] text-[11.5px] text-left transition-colors border-0 cursor-pointer
                      ${!filterTag && !filterPartner
                        ? 'bg-stone-100 dark:bg-stone-800/60 text-stone-700 dark:text-stone-200 font-medium'
                        : 'bg-transparent text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200'
                      }`}
                  >
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                    Destacados
                  </button>
                  {NECESIDADES.map((n: { id: string; label: string; tags: string[] }) => (
                    <button
                      key={n.id}
                      onClick={() => { setFilterTag(n.tags[0]); setFilterPartner(null) }}
                      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-[7px] text-[11.5px] text-left transition-colors border-0 cursor-pointer
                        ${filterTag === n.tags[0]
                          ? 'bg-[#2FAF8F]/10 text-[#2FAF8F] font-medium'
                          : 'bg-transparent text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200'
                        }`}
                    >
                      <span className="w-1 h-1 rounded-full bg-current shrink-0" />
                      {n.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Por partner */}
              {partners.length > 0 && (
                <div className="flex flex-col gap-2">
                  <p className="text-[9.5px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider">Por partner</p>
                  <div className="flex flex-col gap-0.5">
                    {partners.map((p: PartnerConProductos) => (
                      <button
                        key={p.id}
                        onClick={() => { setFilterPartner(p.id); setFilterTag(null) }}
                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-[7px] text-[11.5px] text-left transition-colors border-0 cursor-pointer
                          ${filterPartner === p.id
                            ? 'font-medium'
                            : 'bg-transparent text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200'
                          }`}
                        style={filterPartner === p.id ? { background: `${p.color}12`, color: p.color } : {}}
                      >
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
                        {p.nombre}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>
        )}

        {/* Zona central */}
        <main className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-[4px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-stone-200 dark:[&::-webkit-scrollbar-thumb]:bg-stone-700 [&::-webkit-scrollbar-thumb]:rounded-full">
          <div className="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-6">

            {tab === 'soluciones' && (
              <div className="flex flex-col gap-4">
                <div>
                  <h2 className="text-[18px] font-bold text-stone-800 dark:text-stone-100">
                    {filterPartner
                      ? partners.find((p: PartnerConProductos) => p.id === filterPartner)?.nombre
                      : filterTag
                        ? NECESIDADES.find((n: { id: string; label: string; tags: string[] }) => n.tags[0] === filterTag)?.label
                        : 'Soluciones destacadas'
                    }
                  </h2>
                  <p className="text-[12px] text-stone-400 dark:text-stone-500 mt-0.5">
                    Hardware, conectividad e IoT curado para ganadería inteligente
                  </p>
                </div>
                <MarketplaceKitsWidget filterTag={activeTag as string | undefined} />
              </div>
            )}

            {tab === 'partners' && (
              <div className="flex flex-col gap-4">
                <div>
                  <h2 className="text-[18px] font-bold text-stone-800 dark:text-stone-100">Partners estratégicos</h2>
                  <p className="text-[12px] text-stone-400 dark:text-stone-500 mt-0.5">Las empresas que hacen posible el ecosistema tecnológico Gandia</p>
                </div>
                <MarketplacePartnersWidget />
              </div>
            )}

            {tab === 'compatibilidad' && (
              <div className="flex flex-col gap-4">
                <div>
                  <h2 className="text-[18px] font-bold text-stone-800 dark:text-stone-100">Compatibilidad</h2>
                  <p className="text-[12px] text-stone-400 dark:text-stone-500 mt-0.5">Qué hardware se integra con qué módulo de Gandia</p>
                </div>
                <MarketplaceCompatibilidadWidget />
              </div>
            )}

            {tab === 'equipamiento' && (
              <div className="flex flex-col gap-4">
                <div>
                  <h2 className="text-[18px] font-bold text-stone-800 dark:text-stone-100">Mi Equipamiento</h2>
                  <p className="text-[12px] text-stone-400 dark:text-stone-500 mt-0.5">Hardware registrado en este rancho</p>
                </div>
                <MarketplaceEquipamientoWidget />
              </div>
            )}

          </div>
        </main>
      </div>

      {/* Copiloto flotante */}
      <CopiloAnima domain="marketplace" />

      {/* ── Bottom navbar — solo móvil ── */}
      <div className="sm:hidden flex items-center border-t border-stone-200/70 dark:border-stone-800 bg-white dark:bg-[#1c1917] shrink-0">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-all border-0 cursor-pointer
              ${tab === t.id
                ? 'text-[#2FAF8F] bg-transparent'
                : 'text-stone-400 dark:text-stone-500 bg-transparent'
              }`}
          >
            <div className={`w-1 h-1 rounded-full transition-all ${tab === t.id ? 'bg-[#2FAF8F]' : 'bg-transparent'}`} />
            {t.label}
          </button>
        ))}
      </div>
    </div>
  )
}