/**
 * CertificationModulo — Nivel Módulo (panel lateral)
 * ARCHIVO → src/artifacts/certification/CertificationModulo.tsx
 */
import { useState } from 'react'

import CertificationPerfilesWidget,  { type CertAnimalItem }  from './widgets/CertificationPerfilesWidget'
import CertificationElegibilidadWidget                         from './widgets/CertificationElegibilidadWidget'
import CertificationChecklistWidget                            from './widgets/CertificationChecklistWidget'
import CertificationDocumentosWidget                           from './widgets/CertificationDocumentosWidget'
import CertificationVencimientosWidget                         from './widgets/CertificationVencimientosWidget'
import CertificationCardWidget                                 from './widgets/CertificationCardWidget'

import {
  MOCK_ELEGIBILIDAD,
  MOCK_ELEGIBILIDAD_BLOQUEADO,
  MOCK_CHECKLIST,
  MOCK_DOCUMENTOS,
  MOCK_VENCIMIENTOS,
  MOCK_CERT_CARDS,
} from '../../pages/Chat/artifactEngine/mockData'

// ─── MOCK ─────────────────────────────────────────────────────────────────────

const MOCK_ANIMALES_CERT: CertAnimalItem[] = [
  { arete: 'EJM-892', nombre: 'Lupita',    lote: 'Lote 4', corral: 'Corral 1', estado: 'casi',      score: 74,  tipoCert: 'Elegibilidad USDA',  pendientes: 2, diasVence: 14 },
  { arete: '#0089',   nombre: 'Canela',    lote: 'Lote 2', corral: 'Corral 2', estado: 'bloqueado', score: 31,  tipoCert: 'Elegibilidad USDA',  bloqueantes: 2               },
  { arete: '#0203',   nombre: 'Presumida', lote: 'Lote 1', corral: 'Corral 3', estado: 'listo',     score: 100, tipoCert: 'Cert. Sanitario TB', diasVence: 19                },
  { arete: '#0183',   lote:   'Lote 3',                                          estado: 'bloqueado', score: 20,  tipoCert: 'Elegibilidad USDA',  bloqueantes: 1, diasVence: -4},
]

// ─── TIPOS ────────────────────────────────────────────────────────────────────

type Tab = 'perfiles' | 'elegibilidad' | 'checklist' | 'expediente' | 'vencimientos'

interface Props {
  onClose?:   () => void
  onEscalar?: () => void
}

const TABS: { id: Tab; label: string; badge?: boolean }[] = [
  { id: 'perfiles',     label: 'Perfiles'     },
  { id: 'elegibilidad', label: 'Elegibilidad' },
  { id: 'checklist',    label: 'Checklist'    },
  { id: 'expediente',   label: 'Expediente'   },
  { id: 'vencimientos', label: 'Vencimientos', badge: true },
]

const vencUrgentes = MOCK_VENCIMIENTOS.filter(v => v.diasRestantes <= 14).length

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scoreColor(score: number) {
  return score >= 80 ? '#2FAF8F' : score >= 50 ? '#f59e0b' : '#f43f5e'
}

// ─── COMPONENTE ───────────────────────────────────────────────────────────────

export default function CertificationModulo({ onClose, onEscalar }: Props) {
  const [tab,            setTab]            = useState<Tab>('perfiles')
  const [selectedAnimal, setSelectedAnimal] = useState<CertAnimalItem | null>(null)

  const elegibilidadActual = selectedAnimal?.arete === '#0089'
    ? MOCK_ELEGIBILIDAD_BLOQUEADO
    : MOCK_ELEGIBILIDAD

  const renderContent = () => {
    switch (tab) {

      case 'perfiles':
        return selectedAnimal ? (
          <div className="flex flex-col gap-3.5">

            {/* Back */}
            <button
              type="button"
              onClick={() => setSelectedAnimal(null)}
              className="flex items-center gap-1.5 text-[12px] text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 transition-colors bg-transparent border-0 cursor-pointer w-fit"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polyline points="15 19 8 12 15 5"/>
              </svg>
              Todos los animales
            </button>

            {/* Hero score card */}
            <div className="bg-white dark:bg-[#1c1917] border border-stone-200/60 dark:border-stone-800/50 rounded-[14px] overflow-hidden">
              <div className="h-[5px] w-full" style={{ background: scoreColor(selectedAnimal.score) }} />
              <div className="px-4 pt-3.5 pb-3.5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-mono text-[15px] font-semibold text-stone-900 dark:text-stone-50">
                        {selectedAnimal.arete}
                      </span>
                      {selectedAnimal.nombre && (
                        <span className="text-[12px] text-stone-400 dark:text-stone-500">{selectedAnimal.nombre}</span>
                      )}
                    </div>
                    <p className="text-[11px] text-stone-400 dark:text-stone-500">
                      {selectedAnimal.tipoCert} · {selectedAnimal.lote}
                      {selectedAnimal.corral && ` · ${selectedAnimal.corral}`}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[32px] font-medium leading-none tabular-nums"
                      style={{ color: scoreColor(selectedAnimal.score) }}>
                      {selectedAnimal.score}
                    </p>
                    <p className="text-[10px] text-stone-400 dark:text-stone-500">/ 100</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="flex-1 h-[5px] bg-stone-100 dark:bg-stone-800/50 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${selectedAnimal.score}%`, background: scoreColor(selectedAnimal.score) }}
                    />
                  </div>
                  <span className="text-[10.5px] font-medium tabular-nums shrink-0"
                    style={{ color: scoreColor(selectedAnimal.score) }}>
                    {selectedAnimal.score}%
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setTab('elegibilidad')}
                  className="w-full py-2 rounded-[9px] text-[11.5px] font-medium text-white border-0 cursor-pointer transition-colors"
                  style={{ background: '#2FAF8F' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#27a07f')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#2FAF8F')}
                >
                  Ver elegibilidad →
                </button>
              </div>
            </div>

            {/* Certificaciones activas */}
            <div>
              <p className="text-[10px] text-stone-400 dark:text-stone-500 tracking-[0.07em] uppercase mb-2.5 px-0.5">
                Certificaciones activas
              </p>
              <div className="flex flex-col gap-2">
                {MOCK_CERT_CARDS.filter(c => c.arete === selectedAnimal.arete).map(card => (
                  <CertificationCardWidget
                    key={card.id}
                    data={card}
                    onVerCheck={() => setTab('checklist')}
                    onExpand={() => setTab('expediente')}
                  />
                ))}
                {MOCK_CERT_CARDS.filter(c => c.arete === selectedAnimal.arete).length === 0 && (
                  <p className="text-[12px] text-stone-400 dark:text-stone-500 py-5 text-center">
                    Sin certificaciones registradas.
                  </p>
                )}
              </div>
            </div>

          </div>
        ) : (
          <CertificationPerfilesWidget
            animales={MOCK_ANIMALES_CERT}
            selected={selectedAnimal}
            onSelect={item => { setSelectedAnimal(item) }}
          />
        )

      case 'elegibilidad':
        return (
          <CertificationElegibilidadWidget
            datos={elegibilidadActual}
            onExpedir={() => setTab('expediente')}
            onVerDetalle={() => setTab('checklist')}
          />
        )

      case 'checklist':
        return <CertificationChecklistWidget datos={MOCK_CHECKLIST} />

      case 'expediente':
        return <CertificationDocumentosWidget datos={MOCK_DOCUMENTOS} />

      case 'vencimientos':
        return <CertificationVencimientosWidget vencimientos={MOCK_VENCIMIENTOS} />

      default:
        return null
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-stone-50 dark:bg-[#0c0a09] min-h-0">

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 h-12 border-b border-stone-200/70 dark:border-stone-800/60 bg-white dark:bg-[#1c1917] shrink-0">
        <div className="flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2FAF8F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
            <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
          </svg>
          <span className="text-[12px] font-bold text-stone-700 dark:text-stone-200">Certificación</span>
          {selectedAnimal ? (
            <>
              <span className="text-stone-300 dark:text-stone-700 text-[10px]">/</span>
              <span className="font-mono text-[11px] text-stone-500 dark:text-stone-400">{selectedAnimal.arete}</span>
              {selectedAnimal.nombre && (
                <span className="text-[11px] text-stone-400 dark:text-stone-500">{selectedAnimal.nombre}</span>
              )}
              <button
                type="button"
                onClick={() => { setSelectedAnimal(null); setTab('perfiles') }}
                className="flex items-center gap-1 text-[10.5px] text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 transition-colors bg-transparent border-0 cursor-pointer ml-1"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 19 8 12 15 5"/></svg>
                Lista
              </button>
            </>
          ) : (
            vencUrgentes > 0 && (
              <span className="flex items-center gap-1 text-[10px] font-medium text-amber-500 dark:text-amber-400">
                <span className="w-1 h-1 rounded-full bg-amber-400 animate-pulse" />
                {vencUrgentes} por vencer
              </span>
            )
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onEscalar}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[8px] border border-stone-200/70 dark:border-stone-800/60 bg-white dark:bg-[#1c1917] text-[11px] text-stone-400 dark:text-stone-500 cursor-pointer hover:text-[#2FAF8F] hover:border-[#2FAF8F]/40 transition-all"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/>
              <line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
            </svg>
            Espacio Gandia
          </button>
          <button
            type="button"
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
          const disabled = t.id !== 'perfiles' && !selectedAnimal
          const active   = tab === t.id
          return (
            <button
              key={t.id}
              type="button"
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
              {t.badge && !disabled && vencUrgentes > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              )}
            </button>
          )
        })}
      </div>

      {/* ── Contenido ── */}
      <div className="flex-1 min-h-0 overflow-y-auto
        [&::-webkit-scrollbar]:w-[3px]
        [&::-webkit-scrollbar-track]:bg-transparent
        [&::-webkit-scrollbar-thumb]:bg-stone-200
        [&::-webkit-scrollbar-thumb]:dark:bg-stone-700/80
        [&::-webkit-scrollbar-thumb]:rounded-full
        [&::-webkit-scrollbar-thumb:hover]:bg-[#2FAF8F]/60
        [&::-webkit-scrollbar-thumb:hover]:dark:bg-[#2FAF8F]/50">
        <div className="p-3.5">
          {renderContent()}
        </div>
      </div>

    </div>
  )
}