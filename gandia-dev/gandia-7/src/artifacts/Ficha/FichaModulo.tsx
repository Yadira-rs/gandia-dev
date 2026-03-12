/**
 * FichaModulo — Módulo (nivel awake / panel lateral)
 * ARCHIVO → src/artifacts/passport/FichaModulo.tsx
 *
 * Panel lateral de Ficha Ganadera. Mismo patrón que GemelosModulo.
 * 4 tabs: Perfiles · Documentos · Huella · Registrar
 * Perfiles muestra la lista; al seleccionar un animal muestra FichaCard inline.
 * Documentos y Huella están deshabilitados hasta que se seleccione un animal.
 */

import { useState } from 'react'
import { useUser } from '../../context/UserContext'
import { useAnimalDetalle, dbToPassportData } from '../../hooks/useAnimales'

import FichaCard             from './widgets/FichaCard'
import FichaPerfilesWidget,  { type AnimalPerfil } from './widgets/FichaPerfilesWidget'
import FichaDocumentosWidget from './widgets/FichaDocumentosWidget'
import FichaHuellaWidget     from './widgets/FichaHuellaWidget'
import FichaNuevoWidget      from './widgets/FichaNuevoWidget'

// ─── PROPS ────────────────────────────────────────────────────────────────────

interface Props {
  onClose:    () => void
  onEscalate: () => void
  initialTab?: TabId
}

type TabId = 'perfiles' | 'documentos' | 'huella' | 'registrar'

const TABS: { id: TabId; label: string }[] = [
  { id: 'perfiles',   label: 'Perfiles'   },
  { id: 'documentos', label: 'Documentos' },
  { id: 'huella',     label: 'Huella'     },
  { id: 'registrar',  label: 'Registrar'  },
]

// ─── MÓDULO ───────────────────────────────────────────────────────────────────

export default function FichaModulo({ onClose, onEscalate, initialTab = 'perfiles' }: Props) {
  const [tab,             setTab]             = useState<TabId>(initialTab)
  const [selectedAnimal,  setSelectedAnimal]  = useState<AnimalPerfil | null>(null)

  const { profile } = useUser()
  const pd           = (profile?.personal_data as Record<string, string> | null) ?? {}
  const propietario  = pd.fullName ?? pd.full_name ?? pd.nombre_completo ?? pd.nombre ?? '—'

  const { animal: animalData, loading: loadingAnimal } = useAnimalDetalle(selectedAnimal?.id ?? null)

  const handleSelectAnimal = (a: AnimalPerfil) => {
    setSelectedAnimal(a)
  }

  return (
    <div className="flex-1 flex flex-col bg-[#fafaf9] dark:bg-[#0c0a09] overflow-hidden">

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 h-12 border-b border-stone-200/70 dark:border-stone-800 shrink-0 bg-white dark:bg-[#1c1917]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#2FAF8F]" />
          <p className="text-[12px] font-bold text-stone-700 dark:text-stone-200">Ficha Ganadera</p>
          {selectedAnimal ? (
            <>
              <span className="text-stone-300 dark:text-stone-700 text-[10px]">/</span>
              <span className="font-mono text-[11px] text-stone-500 dark:text-stone-400">{selectedAnimal.arete}</span>
              {selectedAnimal.nombre && (
                <span className="text-[11px] text-stone-400 dark:text-stone-500">{selectedAnimal.nombre}</span>
              )}
              <button
                onClick={() => { setSelectedAnimal(null); setTab('perfiles') }}
                className="flex items-center gap-1 text-[10.5px] text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 transition-colors bg-transparent border-0 cursor-pointer ml-1"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 19 8 12 15 5"/></svg>
                Lista
              </button>
            </>
          ) : (
            <span className="text-[9.5px] font-mono text-stone-400 dark:text-stone-500 uppercase tracking-wider">SENASICA · Gandia</span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={onEscalate}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[8px] border border-stone-200/70 dark:border-stone-800/60 bg-white dark:bg-[#1c1917] text-[11px] text-stone-400 dark:text-stone-500 cursor-pointer hover:text-[#2FAF8F] hover:border-[#2FAF8F]/40 transition-all"
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
        {TABS.map(t => {
          const disabled = (t.id === 'documentos' || t.id === 'huella') && !selectedAnimal
          const active   = tab === t.id
          return (
            <button
              key={t.id}
              onClick={() => !disabled && setTab(t.id)}
              className={`flex items-center gap-1.5 px-2.5 py-2.5 text-[11.5px] border-0 bg-transparent transition-all -mb-px shrink-0
                ${disabled
                  ? 'text-stone-300 dark:text-stone-700 cursor-not-allowed border-b-2 border-transparent'
                  : active
                    ? 'text-stone-700 dark:text-stone-200 font-semibold border-b-2 border-[#2FAF8F] cursor-pointer'
                    : 'text-stone-400 dark:text-stone-500 font-normal border-b-2 border-transparent hover:text-stone-600 dark:hover:text-stone-300 cursor-pointer'
                }`}
            >
              {t.label}
            </button>
          )
        })}
      </div>

      {/* ── Contenido ── */}
      <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-[4px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-stone-200 dark:[&::-webkit-scrollbar-thumb]:bg-stone-700 [&::-webkit-scrollbar-thumb]:rounded-full">
        <div className="p-4">

          {tab === 'perfiles' && (
            selectedAnimal ? (
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
                {loadingAnimal && (
                  <div className="flex justify-center py-8">
                    <div className="w-5 h-5 border-2 border-[#2FAF8F] border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                {!loadingAnimal && animalData && (
                  <FichaCard
                    data={dbToPassportData(animalData, propietario)}
                    onHuella={() => setTab('huella')}
                  />
                )}
              </div>
            ) : (
              <FichaPerfilesWidget
                onSelectAnimal={handleSelectAnimal}
                onNuevo={() => setTab('registrar')}
              />
            )
          )}

          {tab === 'documentos' && selectedAnimal && (
            <FichaDocumentosWidget
              animalId={selectedAnimal.id}
              animalNombre={selectedAnimal.nombre}
              animalArete={selectedAnimal.arete}
            />
          )}

          {tab === 'huella' && selectedAnimal && (
            <FichaHuellaWidget
              onCapturar={onEscalate}
              onVerHistorial={onEscalate}
            />
          )}

          {tab === 'registrar' && (
            <FichaNuevoWidget
              onCancelar={() => setTab('perfiles')}
              onGuardar={() => setTab('perfiles')}
            />
          )}

        </div>
      </div>
    </div>
  )
}