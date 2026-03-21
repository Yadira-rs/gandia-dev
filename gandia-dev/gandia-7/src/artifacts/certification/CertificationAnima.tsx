/**
 * CertificationAnima — Nivel Ánima (pantalla completa)
 * ARCHIVO → src/artifacts/certification/CertificationAnima.tsx
 */
import { useState } from 'react'
import CopiloAnima from '../CopiloAnima'

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

// ─── TIPOS ────────────────────────────────────────────────────────────────────

type Tab = 'perfiles' | 'elegibilidad' | 'checklist' | 'expediente' | 'vencimientos'

interface Props {
  onClose:    () => void
  onEscalate: () => void
}

// ─── MOCK DATA ────────────────────────────────────────────────────────────────

const MOCK_ANIMALES_CERT: CertAnimalItem[] = [
  { arete: 'EJM-892', nombre: 'Lupita',    lote: 'Lote 4', corral: 'Corral 1', estado: 'casi',      score: 74,  tipoCert: 'Elegibilidad USDA',  pendientes: 2, diasVence: 14 },
  { arete: '#0089',   nombre: 'Canela',    lote: 'Lote 2', corral: 'Corral 2', estado: 'bloqueado', score: 31,  tipoCert: 'Elegibilidad USDA',  bloqueantes: 2               },
  { arete: '#0203',   nombre: 'Presumida', lote: 'Lote 1', corral: 'Corral 3', estado: 'listo',     score: 100, tipoCert: 'Cert. Sanitario TB', diasVence: 19                },
  { arete: '#0183',   lote:   'Lote 3',                                          estado: 'bloqueado', score: 20,  tipoCert: 'Elegibilidad USDA',  bloqueantes: 1, diasVence: -4},
]

const TABS: { key: Tab; label: string; alerta?: boolean }[] = [
  { key: 'perfiles',     label: 'Perfiles'     },
  { key: 'elegibilidad', label: 'Elegibilidad' },
  { key: 'checklist',    label: 'Checklist'    },
  { key: 'expediente',   label: 'Expediente'   },
  { key: 'vencimientos', label: 'Vencimientos', alerta: true },
]

const vencUrgentes = MOCK_VENCIMIENTOS.filter(v => v.diasRestantes <= 14).length

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scoreColor(score: number) {
  return score >= 80 ? '#2FAF8F' : score >= 50 ? '#f59e0b' : '#f43f5e'
}

// ─── Ícono dominio ────────────────────────────────────────────────────────────

function IcoCert() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2FAF8F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
    </svg>
  )
}

// ─── COMPONENTE ───────────────────────────────────────────────────────────────

export default function CertificationAnima({ onClose, onEscalate }: Props) {
  const [activeTab,      setActiveTab]      = useState<Tab>('perfiles')
  const [selectedAnimal, setSelectedAnimal] = useState<CertAnimalItem | null>(null)

  const elegibilidadActual = selectedAnimal?.arete === '#0089'
    ? MOCK_ELEGIBILIDAD_BLOQUEADO
    : MOCK_ELEGIBILIDAD

  return (
    <div className="fixed inset-0 flex flex-col z-50 bg-stone-50 dark:bg-[#0e0d0c]">

      {/* ── TOPBAR ── */}
      <div className="h-[52px] flex items-center px-5 border-b border-stone-200/70 dark:border-stone-800/60 bg-white dark:bg-[#1c1917] shrink-0 relative gap-4">

        {/* Breadcrumb izquierda */}
        <div className="flex items-center gap-2">
          <IcoCert />
          <span className="text-[13px] font-bold text-stone-700 dark:text-stone-200">Certificación</span>
          {selectedAnimal ? (
            <>
              <span className="hidden md:inline text-[12px] text-stone-300 dark:text-stone-600">·</span>
              <span className="hidden md:inline font-mono text-[12px] text-stone-400 dark:text-stone-500">{selectedAnimal.arete}</span>
              {selectedAnimal.nombre && (
                <span className="hidden md:inline text-[12px] text-stone-400 dark:text-stone-500">{selectedAnimal.nombre}</span>
              )}
              {(selectedAnimal.bloqueantes ?? 0) > 0 && (
                <span className="hidden md:inline text-[10px] font-medium text-rose-500 dark:text-rose-400 ml-1">
                  · {selectedAnimal.bloqueantes} bloqueante{(selectedAnimal.bloqueantes ?? 0) > 1 ? 's' : ''}
                </span>
              )}
            </>
          ) : (
            vencUrgentes > 0 && (
              <>
                <span className="hidden md:inline text-[12px] text-stone-300 dark:text-stone-600">·</span>
                <span className="hidden md:inline text-[10px] font-medium text-amber-500 dark:text-amber-400">
                  {vencUrgentes} por vencer
                </span>
              </>
            )
          )}
        </div>

        {/* Tabs centrados (desktop) */}
        <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 gap-0.5 bg-stone-100 dark:bg-[#141210] border border-stone-200/70 dark:border-stone-800/60 rounded-[12px] p-[3px]">
          {TABS.map(t => {
            const disabled = (t.key === 'elegibilidad' || t.key === 'checklist' || t.key === 'expediente') && !selectedAnimal
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => !disabled && setActiveTab(t.key)}
                className={`relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-[9px] border-0 text-[12px] transition-all
                  ${disabled
                    ? 'text-stone-300 dark:text-stone-700 cursor-not-allowed bg-transparent'
                    : activeTab === t.key
                      ? 'bg-white dark:bg-[#1c1917] text-stone-700 dark:text-stone-200 font-semibold shadow-sm cursor-pointer'
                      : 'bg-transparent text-stone-400 dark:text-stone-500 font-normal hover:text-stone-600 dark:hover:text-stone-300 cursor-pointer'
                  }`}
              >
                {t.label}
                {t.alerta && !disabled && vencUrgentes > 0 && (
                  <span className="absolute -top-[3px] -right-[3px] w-[7px] h-[7px] rounded-full bg-amber-400 border-[1.5px] border-white dark:border-[#141210]" />
                )}
              </button>
            )
          })}
        </div>

        {/* Acciones derecha */}
        <div className="flex items-center gap-2 ml-auto">
          <button
            type="button"
            onClick={onEscalate}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-[10px] border border-stone-200/70 dark:border-stone-800/60 bg-white dark:bg-[#1c1917] text-[12px] text-stone-400 dark:text-stone-500 cursor-pointer hover:text-[#2FAF8F] hover:border-[#2FAF8F]/40 transition-all"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/>
              <line x1="10" y1="14" x2="17" y2="7"/><line x1="4" y1="20" x2="11" y2="13"/>
            </svg>
            Espacio Gandia
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-[10px] border border-stone-200/70 dark:border-stone-800/60 bg-white dark:bg-[#1c1917] text-[12px] text-stone-400 dark:text-stone-500 cursor-pointer hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
          >
            Chat
          </button>
        </div>
      </div>

      {/* ── BODY ── */}
      <div className="flex-1 min-h-0 overflow-y-auto
        [&::-webkit-scrollbar]:w-[3px]
        [&::-webkit-scrollbar-track]:bg-transparent
        [&::-webkit-scrollbar-thumb]:bg-stone-200
        [&::-webkit-scrollbar-thumb]:dark:bg-stone-700/80
        [&::-webkit-scrollbar-thumb]:rounded-full
        [&::-webkit-scrollbar-thumb:hover]:bg-[#2FAF8F]/60
        [&::-webkit-scrollbar-thumb:hover]:dark:bg-[#2FAF8F]/50">
        <div className="max-w-2xl mx-auto px-4 py-5">

          {/* ── PERFILES ── */}
          {activeTab === 'perfiles' && (
            selectedAnimal ? (
              <div className="flex flex-col gap-4">

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

                {/* Hero score */}
                <div className="bg-white dark:bg-[#1c1917] border border-stone-200/60 dark:border-stone-800/50 rounded-[16px] overflow-hidden">
                  <div className="h-[5px] w-full" style={{ background: scoreColor(selectedAnimal.score) }} />
                  <div className="px-5 pt-4 pb-4">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2.5 mb-1">
                          <span className="font-mono text-[20px] font-semibold text-stone-900 dark:text-stone-50">
                            {selectedAnimal.arete}
                          </span>
                          {selectedAnimal.nombre && (
                            <span className="text-[14px] text-stone-400 dark:text-stone-500">{selectedAnimal.nombre}</span>
                          )}
                        </div>
                        <p className="text-[11.5px] text-stone-400 dark:text-stone-500">
                          {selectedAnimal.tipoCert} · {selectedAnimal.lote}
                          {selectedAnimal.corral && ` · ${selectedAnimal.corral}`}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-[42px] font-medium leading-none tabular-nums"
                          style={{ color: scoreColor(selectedAnimal.score) }}>
                          {selectedAnimal.score}
                        </p>
                        <p className="text-[11px] text-stone-400 dark:text-stone-500">/ 100</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex-1 h-[6px] bg-stone-100 dark:bg-stone-800/50 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${selectedAnimal.score}%`, background: scoreColor(selectedAnimal.score) }}
                        />
                      </div>
                      <span className="text-[11px] font-medium tabular-nums shrink-0"
                        style={{ color: scoreColor(selectedAnimal.score) }}>
                        {selectedAnimal.score}%
                      </span>
                    </div>
                    <div className="flex gap-2.5">
                      <button
                        type="button"
                        onClick={() => setActiveTab('elegibilidad')}
                        className="flex-1 py-2.5 rounded-[10px] text-[12px] font-medium text-white border-0 cursor-pointer transition-colors"
                        style={{ background: '#2FAF8F' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#27a07f')}
                        onMouseLeave={e => (e.currentTarget.style.background = '#2FAF8F')}
                      >
                        Ver elegibilidad
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('checklist')}
                        className="flex-1 py-2.5 rounded-[10px] border border-stone-200/70 dark:border-stone-800/60 bg-white dark:bg-[#1c1917] text-stone-600 dark:text-stone-300 text-[12px] font-medium cursor-pointer hover:border-[#2FAF8F]/40 transition-colors"
                      >
                        Checklist
                      </button>
                    </div>
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
                        onVerCheck={() => setActiveTab('checklist')}
                        onExpand={() => setActiveTab('expediente')}
                      />
                    ))}
                    {MOCK_CERT_CARDS.filter(c => c.arete === selectedAnimal.arete).length === 0 && (
                      <p className="text-[12px] text-stone-400 dark:text-stone-500 py-6 text-center">
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
                onSelect={item => setSelectedAnimal(item)}
              />
            )
          )}

          {/* ── ELEGIBILIDAD ── */}
          {activeTab === 'elegibilidad' && (
            <CertificationElegibilidadWidget
              datos={elegibilidadActual}
              onExpedir={() => setActiveTab('expediente')}
              onVerDetalle={() => setActiveTab('checklist')}
            />
          )}

          {/* ── CHECKLIST ── */}
          {activeTab === 'checklist' && (
            <CertificationChecklistWidget datos={MOCK_CHECKLIST} />
          )}

          {/* ── EXPEDIENTE ── */}
          {activeTab === 'expediente' && (
            <CertificationDocumentosWidget datos={MOCK_DOCUMENTOS} />
          )}

          {/* ── VENCIMIENTOS ── */}
          {activeTab === 'vencimientos' && (
            <CertificationVencimientosWidget vencimientos={MOCK_VENCIMIENTOS} />
          )}

        </div>
      </div>

      {/* ── NAV MÓVIL ── */}
      <div className="md:hidden shrink-0 flex items-center bg-white dark:bg-[#141210] border-t border-stone-200/60 dark:border-stone-800/50">
        {TABS.map(t => {
          const disabled = (t.key === 'elegibilidad' || t.key === 'checklist' || t.key === 'expediente') && !selectedAnimal
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => !disabled && setActiveTab(t.key)}
              className={`relative flex-1 py-3 text-[11px] font-medium transition-colors bg-transparent border-0
                ${disabled
                  ? 'text-stone-300 dark:text-stone-700 cursor-not-allowed'
                  : activeTab === t.key
                    ? 'text-stone-800 dark:text-stone-100 cursor-pointer'
                    : 'text-stone-400 dark:text-stone-500 cursor-pointer'
                }`}
            >
              {t.label}
              {activeTab === t.key && !disabled && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-[#2FAF8F] rounded-full" />
              )}
              {t.alerta && !disabled && vencUrgentes > 0 && (
                <span className="absolute top-2 right-1/2 translate-x-3 w-[5px] h-[5px] rounded-full bg-amber-400" />
              )}
            </button>
          )
        })}
      </div>

      {/* ── COPILOTO ── */}
      <CopiloAnima domain="certification" />
    </div>
  )
}