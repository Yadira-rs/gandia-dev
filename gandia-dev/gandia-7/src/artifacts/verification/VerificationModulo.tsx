/**
 * VerificationModulo.tsx
 * Nivel Módulo del dominio Verificación.
 * Panel lateral derecho — split view con el chat.
 *
 * Tabs: Cola · Historial · Inconsistencias
 * El ítem seleccionado de la cola se abre en VerificationItemWidget.
 */

import { useState, useCallback } from 'react'

import VerificationColaWidget,            { type ItemVerificacion } from './widgets/VerificationColaWidget'
import VerificationItemWidget                                        from './widgets/VerificationItemWidget'
import VerificationHistorialWidget,        { type ItemHistorial }    from './widgets/VerificationHistorialWidget'
import VerificationInconsistenciasWidget,  { type Inconsistencia }   from './widgets/VerificationInconsistenciasWidget'

// ─── TIPOS ────────────────────────────────────────────────────────────────────

type Tab = 'cola' | 'historial' | 'inconsistencias'

interface Props {
  onClose:    () => void
  onEscalate: () => void
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
  { id: 1, ts: 'hace 2 hrs',   tsFormal: '07 MAR 2026 · 12:14', origen: 'ia',      actor: 'IA Perception v7.4',   verificador: 'MVZ Carlos Mendoza', accion: 'Anomalía resuelta · Movimiento reducido Corral A2',  animal: 'Ejemplar #0091', arete: '#0091',   dominio: 'monitoreo',     resultado: 'verificado', observacion: 'Animal revisado en campo. Sin patología aparente.' },
  { id: 2, ts: 'ayer · 18:32', tsFormal: '06 MAR 2026 · 18:32', origen: 'usuario', actor: 'Operador campo',        verificador: 'MVZ Carlos Mendoza', accion: 'Pesaje semanal Lupita — 437 kg',                      animal: 'Lupita',         arete: 'EJM-892', dominio: 'gemelo',        resultado: 'verificado' },
  { id: 3, ts: 'ayer · 14:10', tsFormal: '06 MAR 2026 · 14:10', origen: 'ia',      actor: 'Motor Fingerprint CV',  verificador: 'Auditor Flores',     accion: 'Identificación biométrica — score 0.71',              animal: 'Desconocido',    arete: '—',       dominio: 'biometria',     resultado: 'rechazado', observacion: 'Score por debajo del umbral mínimo. Repetir captura.' },
  { id: 4, ts: 'ayer · 10:05', tsFormal: '06 MAR 2026 · 10:05', origen: 'usuario', actor: 'MVZ Carlos Mendoza',    verificador: 'Auditor Flores',     accion: 'Resultado TB negativo registrado · SENASICA',         animal: 'Lupita',         arete: 'EJM-892', dominio: 'certificacion', resultado: 'verificado' },
  { id: 5, ts: 'hace 2 días',  tsFormal: '05 MAR 2026 · 09:41', origen: 'ia',      actor: 'IA Perception v7.4',   verificador: 'MVZ Carlos Mendoza', accion: 'Conteo biométrico Corral A1 — 42 animales · 100%',                              dominio: 'monitoreo',     resultado: 'verificado' },
]

const INIT_INCONSISTENCIAS: Inconsistencia[] = [
  { id: 1, tipo: 'sin_verificar',             tiempoSinAtencion: '3 días',  accion: 'Registro de vacunación 2026 sin firma ni foto',            actor: 'Operador campo',       dominio: 'gemelo',    animal: 'Lupita',      arete: 'EJM-892', detalle: 'Este registro bloquea la elegibilidad USDA. Lleva 3 días sin verificación autorizada.',           critico: true  },
  { id: 2, tipo: 'rechazado_sin_seguimiento', tiempoSinAtencion: '22 hrs',  accion: 'Identificación biométrica rechazada — sin nueva captura',  actor: 'Motor Fingerprint CV', dominio: 'biometria', animal: 'Desconocido', arete: '—',        detalle: 'La captura fue rechazada por baja confianza (0.71) pero nadie ha repetido el procedimiento.',  critico: false },
  { id: 3, tipo: 'conflicto',                 tiempoSinAtencion: '1 día',   accion: 'Conteo biométrico C2 vs inventario SINIIGA — diferencia de 4', actor: 'IA Perception v7.4', dominio: 'monitoreo', detalle: 'La IA detectó 29 animales en C2 pero el inventario registra 33. CAM-06 offline puede afectar el conteo.', critico: false },
]

const TABS: { id: Tab; label: string }[] = [
  { id: 'cola',             label: 'Pendientes'      },
  { id: 'historial',        label: 'Historial'       },
  { id: 'inconsistencias',  label: 'Inconsistencias' },
]

// ─── COMPONENTE ───────────────────────────────────────────────────────────────

export default function VerificationModulo({ onClose, onEscalate }: Props) {
  const [cola,              setCola]              = useState<ItemVerificacion[]>(INIT_COLA)
  const [historial,         setHistorial]         = useState<ItemHistorial[]>(INIT_HISTORIAL)
  const [inconsistencias,   setInconsistencias]   = useState<Inconsistencia[]>(INIT_INCONSISTENCIAS)
  const [activeTab,         setActiveTab]         = useState<Tab>('cola')
  const [selectedItem,      setSelectedItem]      = useState<ItemVerificacion | null>(null)

  const pendientesCount       = cola.filter(i => i.estado === 'pendiente').length
  const altaCount             = cola.filter(i => i.estado === 'pendiente' && i.severidad === 'alta').length
  const inconsistenciasCriticas = inconsistencias.filter(i => i.critico).length

  const handleSelectItem = useCallback((item: ItemVerificacion) => {
    setSelectedItem(item)
  }, [])

  const handleVerificar = useCallback((id: number, observacion?: string) => {
    setCola(prev => prev.map(i => i.id === id ? { ...i, estado: 'verificado' as const } : i))

    // Añadir al historial
    const item = cola.find(i => i.id === id)
    if (item) {
      const nuevoHistorial: ItemHistorial = {
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
      }
      setHistorial(prev => [nuevoHistorial, ...prev])
    }

    setSelectedItem(null)
  }, [cola])

  const handleRechazar = useCallback((id: number, motivo: string) => {
    setCola(prev => prev.map(i => i.id === id ? { ...i, estado: 'rechazado' as const } : i))

    // Añadir inconsistencia automáticamente
    const item = cola.find(i => i.id === id)
    if (item) {
      const nuevaInc: Inconsistencia = {
        id:                  Date.now(),
        tipo:                'rechazado_sin_seguimiento',
        tiempoSinAtencion:   'ahora',
        accion:              item.accion,
        actor:               item.actor,
        dominio:             item.dominio,
        animal:              item.animal,
        arete:               item.arete,
        detalle:             `Rechazado por: ${motivo}`,
        critico:             item.severidad === 'alta',
      }
      setInconsistencias(prev => [nuevaInc, ...prev])
    }

    setSelectedItem(null)
  }, [cola])

  const renderContent = () => {
    // Si hay un ítem seleccionado, mostrar su detalle
    if (selectedItem) {
      return (
        <VerificationItemWidget
          item={selectedItem}
          onVerificar={handleVerificar}
          onRechazar={handleRechazar}
          onClose={() => setSelectedItem(null)}
        />
      )
    }

    switch (activeTab) {
      case 'cola':
        return (
          <VerificationColaWidget
            items={cola}
            onSelectItem={handleSelectItem}
          />
        )
      case 'historial':
        return <VerificationHistorialWidget historial={historial} />
      case 'inconsistencias':
        return (
          <VerificationInconsistenciasWidget
            inconsistencias={inconsistencias}
            onAtender={id => {
              const inc = inconsistencias.find(i => i.id === id)
              if (!inc) return
              // Convertir en ítem de la cola para atender
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
              setCola(prev => [nuevoItem, ...prev])
              setInconsistencias(prev => prev.filter(i => i.id !== id))
              setActiveTab('cola')
              setSelectedItem(nuevoItem)
            }}
          />
        )
      default:
        return null
    }
  }

  // ── RENDER ────────────────────────────────────────────────────────────────

  return (
    <div className="flex-1 flex flex-col bg-stone-50 dark:bg-[#0c0a09] min-h-0">

      {/* Header */}
      <div className="flex items-center justify-between px-4 h-12 border-b border-stone-200/70 dark:border-stone-800/60 bg-white dark:bg-[#1c1917] shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#ec4899]" />
          <span className="text-[12px] font-bold text-stone-700 dark:text-stone-200">Verificación</span>
          {pendientesCount > 0 && (
            <span className="flex items-center gap-1 text-[10px] font-medium text-stone-500 dark:text-stone-400 px-2 py-0.5 rounded-full border border-stone-200/80 dark:border-stone-700/60">
              {pendientesCount} pendientes
              {altaCount > 0 && <span className="w-1 h-1 rounded-full bg-red-400" />}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={onEscalate}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[8px] border border-stone-200/70 dark:border-stone-800/60 bg-white dark:bg-[#1c1917] text-[11px] text-stone-400 dark:text-stone-500 cursor-pointer hover:text-[#ec4899] hover:border-[#ec4899]/40 transition-all"
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

      {/* Tabs — solo cuando no hay ítem seleccionado */}
      {!selectedItem && (
        <div className="flex border-b border-stone-200/70 dark:border-stone-800/60 bg-white dark:bg-[#1c1917] px-3.5 shrink-0">
          {TABS.map(tab => {
            const active = activeTab === tab.id
            const badge  = tab.id === 'inconsistencias' && inconsistenciasCriticas > 0
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-2.5 py-2.5 text-[11.5px] cursor-pointer border-0 bg-transparent transition-all -mb-px shrink-0
                  ${active
                    ? 'text-stone-700 dark:text-stone-200 font-semibold border-b-2 border-[#ec4899]'
                    : 'text-stone-400 dark:text-stone-500 font-normal border-b-2 border-transparent hover:text-stone-600 dark:hover:text-stone-300'
                  }`}
              >
                {tab.label}
                {badge && <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />}
              </button>
            )
          })}
        </div>
      )}

      {/* Breadcrumb cuando hay ítem seleccionado */}
      {selectedItem && (
        <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#1c1917] border-b border-stone-100 dark:border-stone-800/40 shrink-0">
          <button
            onClick={() => setSelectedItem(null)}
            className="flex items-center gap-1.5 text-[11px] text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 transition-colors cursor-pointer"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Cola
          </button>
          <span className="text-stone-200 dark:text-stone-700 text-[10px]">/</span>
          <span className="text-[11px] text-stone-500 dark:text-stone-400 truncate">Detalle</span>
        </div>
      )}

      {/* Contenido */}
      <div className="flex-1 p-3.5 overflow-y-auto flex flex-col
        [&::-webkit-scrollbar]:w-[5px]
        [&::-webkit-scrollbar-track]:bg-transparent
        [&::-webkit-scrollbar-thumb]:bg-stone-200
        [&::-webkit-scrollbar-thumb]:dark:bg-stone-700
        [&::-webkit-scrollbar-thumb]:rounded-full
        [&::-webkit-scrollbar-thumb:hover]:bg-stone-300
        [&::-webkit-scrollbar-thumb:hover]:dark:bg-stone-600">
        {renderContent()}
      </div>
    </div>
  )
}