/**
 * VerificationAnima.tsx
 * Nivel Ánima del dominio Verificación.
 *
 * Layout:
 *   Topbar       → título izq · tabs centrados · acciones der
 *   Zona central → widget activo
 *   Panel der    → VerificationInconsistenciasWidget siempre visible
 */

import { useState, useCallback } from 'react'
import CopiloAnima from '../CopiloAnima'

import VerificationColaWidget,           { type ItemVerificacion } from './widgets/VerificationColaWidget'
import VerificationItemWidget                                       from './widgets/VerificationItemWidget'
import VerificationHistorialWidget,       { type ItemHistorial }   from './widgets/VerificationHistorialWidget'
import VerificationInconsistenciasWidget, { type Inconsistencia }  from './widgets/VerificationInconsistenciasWidget'

// ─── TIPOS ────────────────────────────────────────────────────────────────────

type Tab          = 'cola' | 'historial' | 'inconsistencias'
type ActiveWidget = 'cola' | 'item' | 'historial' | 'inconsistencias'

interface Props {
  onClose:    () => void
  onEscalate: () => void
}

// ─── TABS ─────────────────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string; icon: React.FC<{ size?: number }> }[] = [
  { id: 'cola',            label: 'Pendientes',      icon: ColaIcon      },
  { id: 'historial',       label: 'Historial',       icon: HistorialIcon },
  { id: 'inconsistencias', label: 'Inconsistencias', icon: InconsistIcon },
]

const TAB_DEFAULT_WIDGET: Record<Tab, ActiveWidget> = {
  cola:            'cola',
  historial:       'historial',
  inconsistencias: 'inconsistencias',
}

// ─── MOCK DATA ────────────────────────────────────────────────────────────────

const INIT_COLA: ItemVerificacion[] = [
  { id: 1, ts: 'hace 12 min', origen: 'ia',      actor: 'IA Perception v7.4',   dominio: 'monitoreo',     accion: 'Separación del hato detectada · Corral B1',           animal: 'Ejemplar #0247', arete: '#0247',   severidad: 'alta',  estado: 'pendiente' },
  { id: 2, ts: 'hace 3 días', origen: 'usuario', actor: 'Operador campo',        dominio: 'gemelo',        accion: 'Registro de vacunación 2026 sin firma ni foto',       animal: 'Lupita',         arete: 'EJM-892', severidad: 'alta',  estado: 'pendiente' },
  { id: 3, ts: 'hace 34 min', origen: 'ia',      actor: 'IA Perception v7.4',   dominio: 'monitoreo',     accion: 'Sin ingesta registrada · Corral C1',                  animal: 'Ejemplar #0183', arete: '#0183',   severidad: 'media', estado: 'pendiente' },
  { id: 4, ts: 'hace 1 hr',   origen: 'ia',      actor: 'Motor Fingerprint CV', dominio: 'biometria',     accion: 'Identificación biométrica con confianza baja (0.83)', animal: 'Canela',         arete: '#0089',   severidad: 'media', estado: 'pendiente' },
  { id: 5, ts: 'hace 2 hrs',  origen: 'usuario', actor: 'MVZ Carlos Mendoza',   dominio: 'certificacion', accion: 'Score de elegibilidad USDA recalculado a 74/100',     animal: 'Lupita',         arete: 'EJM-892', severidad: 'baja',  estado: 'pendiente' },
]

const INIT_HISTORIAL: ItemHistorial[] = [
  { id: 1, ts: 'hace 2 hrs',   tsFormal: '07 MAR 2026 · 12:14', origen: 'ia',      actor: 'IA Perception v7.4',   verificador: 'MVZ Carlos Mendoza', accion: 'Anomalía resuelta · Movimiento reducido A2',   animal: 'Ejemplar #0091', arete: '#0091',   dominio: 'monitoreo',     resultado: 'verificado', observacion: 'Animal revisado en campo. Sin patología aparente.' },
  { id: 2, ts: 'ayer · 18:32', tsFormal: '06 MAR 2026 · 18:32', origen: 'usuario', actor: 'Operador campo',        verificador: 'MVZ Carlos Mendoza', accion: 'Pesaje semanal Lupita — 437 kg',                animal: 'Lupita',         arete: 'EJM-892', dominio: 'gemelo',        resultado: 'verificado' },
  { id: 3, ts: 'ayer · 14:10', tsFormal: '06 MAR 2026 · 14:10', origen: 'ia',      actor: 'Motor Fingerprint CV',  verificador: 'Auditor Flores',     accion: 'Identificación biométrica — score 0.71',        animal: 'Desconocido',    arete: '—',       dominio: 'biometria',     resultado: 'rechazado', observacion: 'Score bajo el umbral mínimo. Repetir captura.' },
  { id: 4, ts: 'ayer · 10:05', tsFormal: '06 MAR 2026 · 10:05', origen: 'usuario', actor: 'MVZ Carlos Mendoza',    verificador: 'Auditor Flores',     accion: 'Resultado TB negativo · SENASICA',              animal: 'Lupita',         arete: 'EJM-892', dominio: 'certificacion', resultado: 'verificado' },
  { id: 5, ts: 'hace 2 días',  tsFormal: '05 MAR 2026 · 09:41', origen: 'ia',      actor: 'IA Perception v7.4',   verificador: 'MVZ Carlos Mendoza', accion: 'Conteo biométrico Corral A1 — 42 animales',                                dominio: 'monitoreo',     resultado: 'verificado' },
]

const INIT_INCONSISTENCIAS: Inconsistencia[] = [
  { id: 1, tipo: 'sin_verificar',             tiempoSinAtencion: '3 días', accion: 'Registro de vacunación 2026 sin firma ni foto',           actor: 'Operador campo',       dominio: 'gemelo',    animal: 'Lupita',      arete: 'EJM-892', detalle: 'Bloquea elegibilidad USDA. 3 días sin atención.',                 critico: true  },
  { id: 2, tipo: 'rechazado_sin_seguimiento', tiempoSinAtencion: '22 hrs', accion: 'Identificación biométrica rechazada — sin nueva captura', actor: 'Motor Fingerprint CV', dominio: 'biometria', animal: 'Desconocido', arete: '—',        detalle: 'Captura rechazada (0.71). No se ha repetido el procedimiento.', critico: false },
  { id: 3, tipo: 'conflicto',                 tiempoSinAtencion: '1 día',  accion: 'Conteo C2 vs inventario SINIIGA — diferencia de 4',      actor: 'IA Perception v7.4',   dominio: 'monitoreo',                                         detalle: 'CAM-06 offline puede estar afectando el conteo.',               critico: false },
]

// ─── COMPONENTE ───────────────────────────────────────────────────────────────

export default function VerificationAnima({ onClose, onEscalate }: Props) {
  const [cola,            setCola]            = useState<ItemVerificacion[]>(INIT_COLA)
  const [historial,       setHistorial]       = useState<ItemHistorial[]>(INIT_HISTORIAL)
  const [inconsistencias, setInconsistencias] = useState<Inconsistencia[]>(INIT_INCONSISTENCIAS)
  const [activeTab,       setActiveTab]       = useState<Tab>('cola')
  const [activeWidget,    setActiveWidget]    = useState<ActiveWidget>('cola')
  const [selectedItem,    setSelectedItem]    = useState<ItemVerificacion | null>(null)

  const altaCount   = cola.filter(i => i.estado === 'pendiente' && i.severidad === 'alta').length
  const incCriticas = inconsistencias.filter(i => i.critico).length

  const handleTabChange = useCallback((tab: Tab) => {
    setActiveTab(tab)
    setActiveWidget(TAB_DEFAULT_WIDGET[tab])
    setSelectedItem(null)
  }, [])

  const handleSelectItem = useCallback((item: ItemVerificacion) => {
    setSelectedItem(item)
    setActiveWidget('item')
  }, [])

  const handleVerificar = useCallback((id: number, observacion?: string) => {
    const item = cola.find(i => i.id === id)
    setCola(prev => prev.map(i => i.id === id ? { ...i, estado: 'verificado' as const } : i))
    if (item) {
      setHistorial(prev => [{
        id:          Date.now(),
        ts:          'ahora',
        tsFormal:    new Date().toLocaleString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        origen:      item.origen,
        actor:       item.actor,
        verificador: 'Tú',
        accion:      item.accion,
        animal:      item.animal,
        arete:       item.arete,
        dominio:     item.dominio,
        resultado:   'verificado',
        observacion,
      }, ...prev])
    }
    setSelectedItem(null)
    setActiveWidget('cola')
    setActiveTab('cola')
  }, [cola])

  const handleRechazar = useCallback((id: number, motivo: string) => {
    const item = cola.find(i => i.id === id)
    setCola(prev => prev.map(i => i.id === id ? { ...i, estado: 'rechazado' as const } : i))
    if (item) {
      setInconsistencias(prev => [{
        id:                  Date.now(),
        tipo:                'rechazado_sin_seguimiento',
        tiempoSinAtencion:   'ahora',
        accion:              item.accion,
        actor:               item.actor,
        dominio:             item.dominio,
        animal:              item.animal,
        arete:               item.arete,
        detalle:             `Rechazado: ${motivo}`,
        critico:             item.severidad === 'alta',
      }, ...prev])
    }
    setSelectedItem(null)
    setActiveWidget('cola')
    setActiveTab('cola')
  }, [cola])

  const handleAtenderInconsistencia = useCallback((id: number) => {
    const inc = inconsistencias.find(i => i.id === id)
    if (!inc) return
    const nuevoItem: ItemVerificacion = {
      id:        Date.now(),
      ts:        'ahora',
      origen:    'usuario',
      actor:     inc.actor,
      dominio:   inc.dominio,
      accion:    inc.accion,
      animal:    inc.animal,
      arete:     inc.arete,
      severidad: inc.critico ? 'alta' : 'media',
      estado:    'pendiente',
    }
    setInconsistencias(prev => prev.filter(i => i.id !== id))
    setCola(prev => [nuevoItem, ...prev])
    setSelectedItem(nuevoItem)
    setActiveWidget('item')
    setActiveTab('cola')
  }, [inconsistencias])

  // ── Widget central ────────────────────────────────────────────────────────

  const renderCentralWidget = () => {
    switch (activeWidget) {
      case 'cola':
        return <VerificationColaWidget items={cola} onSelectItem={handleSelectItem} />
      case 'item':
        return selectedItem ? (
          <VerificationItemWidget
            item={selectedItem}
            onVerificar={handleVerificar}
            onRechazar={handleRechazar}
            onClose={() => { setSelectedItem(null); setActiveWidget('cola') }}
          />
        ) : null
      case 'historial':
        return <VerificationHistorialWidget historial={historial} />
      case 'inconsistencias':
        return (
          <VerificationInconsistenciasWidget
            inconsistencias={inconsistencias}
            onAtender={handleAtenderInconsistencia}
          />
        )
      default:
        return null
    }
  }

  // ── RENDER ────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 bg-stone-50 dark:bg-[#0c0a09] flex flex-col z-50">

      {/* ── TOPBAR ──────────────────────────────────────────────────────────── */}
      <div className="h-[52px] flex items-center px-5 border-b border-stone-200/70 dark:border-stone-800/60 bg-white dark:bg-[#1c1917] shrink-0 relative gap-4">

        {/* Título izquierda */}
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#ec4899]" style={{ boxShadow: '0 0 0 3px rgba(236,72,153,0.15)' }} />
          <span className="text-[13px] font-bold text-stone-700 dark:text-stone-200">Verificación</span>
          {altaCount > 0 && (
            <span className="hidden md:inline text-[10px] font-semibold text-stone-500 dark:text-stone-400 px-2 py-0.5 rounded-[6px] border border-stone-200/80 dark:border-stone-700/60 ml-1">
              {altaCount} alta prioridad
            </span>
          )}
        </div>

        {/* Tabs — centrados absolutamente */}
        <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 gap-0.5 bg-stone-100 dark:bg-[#141210] border border-stone-200/70 dark:border-stone-800/60 rounded-[12px] p-[3px]">
          {TABS.map(tab => {
            const Icon   = tab.icon
            const active = activeTab === tab.id && activeWidget !== 'item'
            const badge  = tab.id === 'inconsistencias' && incCriticas > 0
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-[9px] border-0 cursor-pointer text-[12px] transition-all
                  ${active
                    ? 'bg-white dark:bg-[#1c1917] text-stone-700 dark:text-stone-200 font-semibold shadow-sm'
                    : 'bg-transparent text-stone-400 dark:text-stone-500 font-normal hover:text-stone-600 dark:hover:text-stone-300'
                  }`}
              >
                <Icon size={13} />
                {tab.label}
                {badge && <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />}
              </button>
            )
          })}
        </div>

        {/* Acciones derecha */}
        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={onEscalate}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-[10px] border border-stone-200/70 dark:border-stone-800/60 bg-white dark:bg-[#1c1917] text-[12px] text-stone-400 dark:text-stone-500 cursor-pointer hover:text-[#ec4899] hover:border-[#ec4899]/40 transition-all"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/>
              <line x1="10" y1="14" x2="17" y2="7"/><line x1="4" y1="20" x2="11" y2="13"/>
            </svg>
            Panel
          </button>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-[10px] border border-stone-200/70 dark:border-stone-800/60 bg-white dark:bg-[#1c1917] text-[12px] text-stone-400 dark:text-stone-500 cursor-pointer hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
          >
            Chat
          </button>
        </div>
      </div>

      {/* ── BODY ────────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex min-h-0">

        {/* Zona central */}
        <div className="flex-1 p-5 overflow-y-auto flex flex-col pb-20 md:pb-5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {renderCentralWidget()}
        </div>

        {/* Panel derecho — Inconsistencias siempre visibles (salvo cuando ya están en el central) */}
        {activeWidget !== 'inconsistencias' && (
          <div className="hidden md:flex md:flex-col w-[280px] border-l border-stone-200/70 dark:border-stone-800/60 bg-white dark:bg-[#1c1917] p-4 shrink-0 overflow-y-auto [&::-webkit-scrollbar]:w-[3px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-stone-200 dark:[&::-webkit-scrollbar-thumb]:bg-stone-700 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-stone-300 dark:hover:[&::-webkit-scrollbar-thumb]:bg-stone-600">
            <VerificationInconsistenciasWidget
              inconsistencias={inconsistencias}
              onAtender={handleAtenderInconsistencia}
            />
          </div>
        )}
      </div>

      {/* Copiloto flotante */}
      <CopiloAnima domain="verification" />

      {/* ── BOTTOM NAV (solo móvil) ──────────────────────────────────────── */}
      <div className="md:hidden flex border-t border-stone-200/70 dark:border-stone-800/60 bg-white dark:bg-[#1c1917] shrink-0">
        {TABS.map(tab => {
          const Icon   = tab.icon
          const active = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 border-0 cursor-pointer transition-all
                ${active ? 'text-[#ec4899]' : 'bg-transparent text-stone-400 dark:text-stone-500'}`}
            >
              <Icon size={18} />
              <span className="text-[9px] font-medium">{tab.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── ICONS ────────────────────────────────────────────────────────────────────

function ColaIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
      <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
    </svg>
  )
}

function HistorialIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  )
}

function InconsistIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  )
}