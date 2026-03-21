/**
 * GemelosModulo.tsx
 * ARCHIVO → src/artifacts/twins/GemelosModulo.tsx
 *
 * ✅ Conectado a Supabase via useTwinsData.ts
 * Cada widget recibe exactamente los datos que espera.
 */
import { useState, useEffect } from 'react'

import TwinsPerfilesWidget,     { type AnimalListItem }    from './widgets/TwinsPerfilesWidget'
import TwinsTimelineWidget                                 from './widgets/TwinsTimelineWidget'
import TwinsFeedWidget                                     from './widgets/TwinsFeedWidget'
import TwinsAlimentacionWidget                             from './widgets/TwinsAlimentacionWidget'
import TwinsHeroWidget                                     from './widgets/TwinsHeroWidget'
import TwinsPesoWidget                                     from './widgets/TwinsPesoWidget'

import {
  useTwinsAnimales,
  useTwinsPesos,
  useTwinsTimeline,
  useTwinsAlimentacion,
  useTwinsFeed,
} from '../../hooks/useTwinsData'

import { useRanchoId, getAuthUserId } from '../../hooks/useAnimales'

// ─── TIPOS ────────────────────────────────────────────────────────────────────

type Tab = 'perfiles' | 'timeline' | 'alimentacion' | 'auditorias'

interface Props {
  onClose:    () => void
  onEscalate: () => void
}

const TABS: { id: Tab; label: string }[] = [
  { id: 'perfiles',     label: 'Perfiles'     },
  { id: 'timeline',     label: 'Timeline'     },
  { id: 'alimentacion', label: 'Alimentación' },
  { id: 'auditorias',   label: 'Auditorías'   },
]

// ─── LOADING ──────────────────────────────────────────────────────────────────

function LoadingState({ mensaje }: { mensaje: string }) {
  return (
    <div className="flex items-center gap-2 py-10 justify-center">
      <span className="w-2 h-2 rounded-full bg-[#2FAF8F] animate-pulse" />
      <span className="text-[12px] text-stone-400 dark:text-stone-500">{mensaje}</span>
    </div>
  )
}

// ─── COMPONENTE ───────────────────────────────────────────────────────────────

export default function GemelosModulo({ onClose, onEscalate }: Props) {
  const [activeTab,      setActiveTab]      = useState<Tab>('perfiles')
  const [selectedAnimal, setSelectedAnimal] = useState<AnimalListItem | null>(null)
  const [userId,         setUserId]         = useState<string | null>(null)

  // 1. userId de la sesión activa
  useEffect(() => { getAuthUserId().then(setUserId) }, [])

  // 2. ranchoId del usuario
  const { ranchoId } = useRanchoId(userId)

  // 3. Lista de animales → TwinsPerfilesWidget + TwinsHeroWidget
  const { animales, loading: loadingAnimales } = useTwinsAnimales(ranchoId)

  // 4. Siniiga del animal seleccionado (todos los hooks twins usan siniiga)
  const animalSiniiga = selectedAnimal?.perfil.arete ?? null

  // 5. Datos por widget del animal seleccionado
  // NOTA: twins_pesos y twins_alimentacion usan siniiga como animal_id (no UUID)
  const { registros, loading: loadingPesos  } = useTwinsPesos(animalSiniiga)
  const { eventos,   loading: loadingTimeline } = useTwinsTimeline(animalSiniiga)
  const { datos,     loading: loadingAlim    } = useTwinsAlimentacion(
    animalSiniiga,
    selectedAnimal?.perfil.pesoActual,
    selectedAnimal?.perfil.pesoMeta,
    selectedAnimal?.perfil.gananciaDiaria,
  )
  const { auditorias, completitud } = useTwinsFeed(animalSiniiga)

  const pendientesAudit = auditorias.filter(a => a.estado === 'incompleto').length

  // ── Render por tab ────────────────────────────────────────────────────────

  const renderWidget = () => {
    switch (activeTab) {

      case 'perfiles':
        if (loadingAnimales) return <LoadingState mensaje="Cargando animales..." />
        if (selectedAnimal) return (
          <div className="flex flex-col gap-4">
            <button
              onClick={() => setSelectedAnimal(null)}
              className="flex items-center gap-1.5 text-[12px] text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 transition-colors bg-transparent border-0 cursor-pointer w-fit"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polyline points="15 19 8 12 15 5"/>
              </svg>
              Todos los animales
            </button>

            {/* Hero del animal seleccionado */}
            <TwinsHeroWidget perfil={selectedAnimal.perfil} />

            {/* Curva de peso */}
            {loadingPesos
              ? <LoadingState mensaje="Cargando curva de peso..." />
              : registros.length > 0
                ? <TwinsPesoWidget
                    registros={registros}
                    pesoMeta={selectedAnimal.perfil.pesoMeta}
                    gananciaDiaria={selectedAnimal.perfil.gananciaDiaria}
                  />
                : <EmptyState mensaje="Sin registros de peso aún" />
            }
          </div>
        )
        return (
          <TwinsPerfilesWidget
            animales={animales}
            selected={selectedAnimal}
            onSelect={setSelectedAnimal}
          />
        )

      case 'timeline':
        if (loadingTimeline) return <LoadingState mensaje="Cargando historial..." />
        if (!eventos.length)  return <EmptyState mensaje="Sin eventos registrados" />
        return (
          <TwinsTimelineWidget
            eventos={eventos}
            ubicacionActual={selectedAnimal?.perfil.corral ?? '—'}
            siniiga={animalSiniiga ?? undefined}
          />
        )

      case 'alimentacion':
        if (loadingAlim) return <LoadingState mensaje="Cargando alimentación..." />
        if (!datos) return (
          <TwinsAlimentacionWidget
            datos={{ semanas: [], caActual: 0, caObjetivo: 7.0, caIndustria: 8.2, proyDias: 0, proyFecha: '—', pesoMeta: selectedAnimal?.perfil.pesoMeta ?? 500, pesoActual: selectedAnimal?.perfil.pesoActual ?? 0 }}
            siniiga={animalSiniiga ?? undefined}
          />
        )
        return <TwinsAlimentacionWidget datos={datos} siniiga={animalSiniiga ?? undefined} />

      case 'auditorias':
        return (
          <TwinsFeedWidget
            auditorias={auditorias}
            completitud={completitud}
          />
        )

      default:
        return null
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-stone-50 dark:bg-[#0c0a09] min-h-0">

      {/* Header */}
      <div className="flex items-center justify-between px-4 h-12 border-b border-stone-200/70 dark:border-stone-800/60 bg-white dark:bg-[#1c1917] shrink-0">
        <div className="flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2FAF8F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
            <rect x="9" y="9" width="13" height="13" rx="2"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
          <span className="text-[12px] font-bold text-stone-700 dark:text-stone-200">Gemelo Digital</span>
          {selectedAnimal ? (
            <>
              <span className="text-stone-300 dark:text-stone-700 text-[10px]">/</span>
              <span className="font-mono text-[11px] text-stone-500 dark:text-stone-400">{selectedAnimal.perfil.arete}</span>
              {selectedAnimal.perfil.nombre && (
                <span className="text-[11px] text-stone-400 dark:text-stone-500">{selectedAnimal.perfil.nombre}</span>
              )}
              <button
                onClick={() => { setSelectedAnimal(null); setActiveTab('perfiles') }}
                className="flex items-center gap-1 text-[10.5px] text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 transition-colors bg-transparent border-0 cursor-pointer ml-1"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 19 8 12 15 5"/></svg>
                Lista
              </button>
            </>
          ) : (
            pendientesAudit > 0 && (
              <span className="flex items-center gap-1 text-[10px] font-medium text-amber-500 dark:text-amber-400">
                <span className="w-1 h-1 rounded-full bg-amber-400 animate-pulse" />
                {pendientesAudit} alerta{pendientesAudit > 1 ? 's' : ''}
              </span>
            )
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onEscalate}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[8px] border border-stone-200/70 dark:border-stone-800/60 bg-white dark:bg-[#1c1917] text-[11px] text-stone-400 dark:text-stone-500 cursor-pointer hover:text-[#2FAF8F] hover:border-[#2FAF8F]/40 transition-all"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
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

      {/* Tabs */}
      <div className="flex border-b border-stone-200/70 dark:border-stone-800/60 bg-white dark:bg-[#1c1917] px-3.5 shrink-0 overflow-x-auto [&::-webkit-scrollbar]:hidden">
        {TABS.map(tab => {
          const active   = activeTab === tab.id
          const isBadge  = tab.id === 'auditorias' && pendientesAudit > 0
          const disabled = tab.id !== 'perfiles' && !selectedAnimal
          return (
            <button
              key={tab.id}
              onClick={() => !disabled && setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-2.5 py-2.5 text-[11.5px] border-0 bg-transparent transition-all -mb-px shrink-0
                ${disabled
                  ? 'text-stone-300 dark:text-stone-700 cursor-not-allowed border-b-2 border-transparent'
                  : active
                    ? 'text-stone-700 dark:text-stone-200 font-semibold border-b-2 border-[#2FAF8F] cursor-pointer'
                    : 'text-stone-400 dark:text-stone-500 font-normal border-b-2 border-transparent hover:text-stone-600 dark:hover:text-stone-300 cursor-pointer'
                }`}
            >
              {tab.label}
              {isBadge && !disabled && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />}
            </button>
          )
        })}
      </div>

      {/* Zona widget */}
      <div className="flex-1 min-h-0 overflow-y-auto
        [&::-webkit-scrollbar]:w-[3px]
        [&::-webkit-scrollbar-track]:bg-transparent
        [&::-webkit-scrollbar-thumb]:bg-stone-200
        [&::-webkit-scrollbar-thumb]:dark:bg-stone-700/80
        [&::-webkit-scrollbar-thumb]:rounded-full
        [&::-webkit-scrollbar-thumb:hover]:bg-[#2FAF8F]/60
        [&::-webkit-scrollbar-thumb:hover]:dark:bg-[#2FAF8F]/50">
        <div className="p-3.5">
          {renderWidget()}
        </div>
      </div>
    </div>
  )
}

// ─── EMPTY STATE ──────────────────────────────────────────────────────────────

function EmptyState({ mensaje }: { mensaje: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-10">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-stone-300 dark:text-stone-700">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <span className="text-[12px] text-stone-400 dark:text-stone-500">{mensaje}</span>
    </div>
  )
}