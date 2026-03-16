/**
 * FichaAnima — Ánima (nivel completo / pantalla entera)
 * ARCHIVO → src/artifacts/passport/FichaAnima.tsx
 *
 * Centro de control de Ficha Ganadera. Mismo patrón que MonitoreoAnima:
 *   Sidebar izq  → lista del hato filtrable
 *   Zona central → widget activo según tab
 *   Panel derecho fijo → alertas del hato (fichas incompletas, sin huella, por vencer)
 *   Copiloto flotante  → acciones sugeridas
 */

import { useState } from 'react'
import CopiloAnima from '../CopiloAnima'
import { useUser } from '../../context/UserContext'
import { useAnimalDetalle, dbToPassportData } from '../../hooks/useAnimales'

import FichaCard             from './widgets/FichaCard'
import FichaPerfilesWidget   from './widgets/FichaPerfilesWidget'
import FichaDocumentosWidget from './widgets/FichaDocumentosWidget'
import FichaHuellaWidget     from './widgets/FichaHuellaWidget'
import FichaNuevoWidget      from './widgets/FichaNuevoWidget'
import type { AnimalPerfil } from './widgets/FichaPerfilesWidget'

// ─── PROPS ────────────────────────────────────────────────────────────────────

interface Props {
  onClose:    () => void
  onEscalate: () => void
}

type TabId = 'perfiles' | 'documentos' | 'huella' | 'registrar'

const TABS: { id: TabId; label: string }[] = [
  { id: 'perfiles',   label: 'Perfiles'   },
  { id: 'documentos', label: 'Documentos' },
  { id: 'huella',     label: 'Huella'     },
  { id: 'registrar',  label: 'Registrar'  },
]

// ─── ÁNIMA ────────────────────────────────────────────────────────────────────

export default function FichaAnima({ onClose, onEscalate }: Props) {
  const [tab,           setTab]          = useState<TabId>('perfiles')
  const [animalSelecto, setAnimalSelecto] = useState<AnimalPerfil | null>(null)

  const { profile } = useUser()
  const pd           = (profile?.personal_data as Record<string, string> | null) ?? {}
  const propietario  = pd.fullName ?? pd.full_name ?? pd.nombre_completo ?? pd.nombre ?? '—'

  const { animal: animalData, loading: loadingAnimal } = useAnimalDetalle(animalSelecto?.id ?? null)

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#fafaf9] dark:bg-[#0c0a09]">

      {/* ── Topbar del Ánima ── */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-stone-200/70 dark:border-stone-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-[#2FAF8F]" />
          <p className="text-[13px] font-semibold text-stone-800 dark:text-stone-100">Ficha Ganadera</p>
          <span className="text-[9.5px] font-mono font-semibold px-2 py-0.5 rounded tracking-wider uppercase text-stone-400 dark:text-stone-500 bg-stone-100 dark:bg-stone-800/60 border border-stone-200/70 dark:border-stone-700/50">
            Espacio Gandia
          </span>
        </div>

        {/* Tabs topbar */}
        <div className="flex items-center gap-0.5 bg-stone-100 dark:bg-stone-800/60 rounded-[10px] p-1">
          {TABS.map(t => {
            const disabled = (t.id === 'documentos' || t.id === 'huella') && !animalSelecto
            return (
              <button
                key={t.id}
                onClick={() => !disabled && setTab(t.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[7px] text-[11.5px] font-medium transition-all border-0 ${
                  disabled
                    ? 'text-stone-300 dark:text-stone-700 cursor-not-allowed bg-transparent'
                    : tab === t.id
                      ? 'bg-white dark:bg-stone-700 text-stone-800 dark:text-stone-100 shadow-sm cursor-pointer'
                      : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 bg-transparent cursor-pointer'
                }`}
              >
                {t.label}
              </button>
            )
          })}
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
        {tab === 'perfiles' && (
          animalSelecto ? (
            <div className="flex flex-col gap-4 max-w-2xl mx-auto">
              <button
                onClick={() => setAnimalSelecto(null)}
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
              onSelectAnimal={a => setAnimalSelecto(a)}
              onNuevo={() => setTab('registrar')}
            />
          )
        )}

        {tab === 'documentos' && animalSelecto && (
          <div className="max-w-2xl mx-auto">
            <FichaDocumentosWidget
              animalId={animalSelecto.id}
              animalNombre={animalSelecto?.nombre}
              animalArete={animalSelecto?.arete}
            />
          </div>
        )}

        {tab === 'huella' && animalSelecto && (
          <div className="max-w-2xl mx-auto">
            <FichaHuellaWidget
              animalId={animalSelecto.id}
              animalNombre={animalSelecto.nombre}
              animalArete={animalSelecto.arete}
              onCapturar={() => {}}
            />
          </div>
        )}

        {tab === 'registrar' && (
          <div className="max-w-2xl mx-auto">
            <FichaNuevoWidget
              onCancelar={() => setTab('perfiles')}
              onGuardar={() => setTab('perfiles')}
            />
          </div>
        )}
      </div>

      {/* ── Copiloto flotante ── */}
      <CopiloAnima domain="passport" />
    </div>
  )
}