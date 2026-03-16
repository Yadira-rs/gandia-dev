/**
 * VinculacionModulo — Módulo (nivel awake / panel lateral)
 * Estado compartido de vinculaciones. Pasa props a cada widget.
 * Tabs: Activas · Pendientes · Nueva · Historial
 */

import { useState } from 'react'
import type { Vinculacion, VinculacionPendiente, VinculacionHistorial } from '../artifactTypes'

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

const TABS: { id: TabId; label: string }[] = [
  { id: 'activas',    label: 'Activas'    },
  { id: 'pendientes', label: 'Pendientes' },
  { id: 'nueva',      label: 'Nueva'      },
  { id: 'historial',  label: 'Historial'  },
]

// ── mock state ─────────────────────────────────────────────────────────────────

const MOCK_ACTIVAS: Vinculacion[] = [
  { id: '1', entidad: 'MVZ Dr. García',     tipo: 'sanitario', estado: 'activa', fecha: '12 Ene 2025', expira: null               },
  { id: '2', entidad: 'Exportadora Norte',  tipo: 'comercial', estado: 'activa', fecha: '01 Mar 2025', expira: 'Al cerrar lote'   },
  { id: '3', entidad: 'Auditor SENASICA',   tipo: 'auditoria', estado: 'activa', fecha: '05 Mar 2025', expira: '04 Abr 2025'      },
  { id: '4', entidad: 'Unión Ganadera DGO', tipo: 'union',     estado: 'activa', fecha: '10 Feb 2025', expira: null               },
]

const MOCK_PENDIENTES: VinculacionPendiente[] = [
  { id: '1', entidad: 'Exportadora Bajío',  tipo: 'comercial', direccion: 'recibida', fecha: 'Hace 2h', mensaje: 'Interesados en lote de becerros macho.' },
  { id: '2', entidad: 'MVZ Dra. Sánchez',   tipo: 'sanitario', direccion: 'enviada',  fecha: 'Ayer',    mensaje: null },
]

const MOCK_HISTORIAL: VinculacionHistorial[] = [
  { id: '1', entidad: 'Exportadora Sur',     tipo: 'comercial', estado: 'expirada',  fechaInicio: '10 Ene 2025', fechaFin: '15 Feb 2025', motivo: 'Lote cerrado' },
  { id: '2', entidad: 'Auditor Zona Sur',    tipo: 'auditoria', estado: 'expirada',  fechaInicio: '01 Dic 2024', fechaFin: '31 Dic 2024', motivo: 'Vencimiento automático' },
  { id: '3', entidad: 'MVZ Dr. López',       tipo: 'sanitario', estado: 'revocada',  fechaInicio: '05 Nov 2024', fechaFin: '20 Nov 2024', motivo: 'Revocado por el productor' },
]

// ─────────────────────────────────────────────────────────────────────────────

export default function VinculacionModulo({ onClose, onEscalate }: Props) {
  const [tab,        setTab]        = useState<TabId>('activas')
  const [activas,    setActivas]    = useState<Vinculacion[]>(MOCK_ACTIVAS)
  const [pendientes, setPendientes] = useState<VinculacionPendiente[]>(MOCK_PENDIENTES)
  const [historial,  setHistorial]  = useState<VinculacionHistorial[]>(MOCK_HISTORIAL)

  const pendiCount = pendientes.length

  // Aceptar solicitud → mueve a activas
  const handleAceptar = (id: string) => {
    const p = pendientes.find(x => x.id === id)
    if (!p) return
    const nueva: Vinculacion = {
      id:     `a-${Date.now()}`,
      entidad: p.entidad,
      tipo:    p.tipo,
      estado:  'activa',
      fecha:   'Hoy',
      expira:  p.tipo === 'auditoria' ? '+30 días' : null,
    }
    setActivas(a => [...a, nueva])
    setPendientes(prev => prev.filter(x => x.id !== id))
  }

  // Rechazar solicitud → mueve a historial
  const handleRechazar = (id: string) => {
    const p = pendientes.find(x => x.id === id)
    if (!p) return
    const arch: VinculacionHistorial = {
      id:          `h-${Date.now()}`,
      entidad:     p.entidad,
      tipo:        p.tipo,
      estado:      'rechazada',
      fechaInicio: '—',
      fechaFin:    'Hoy',
      motivo:      'Solicitud rechazada',
    }
    setHistorial(h => [arch, ...h])
    setPendientes(prev => prev.filter(x => x.id !== id))
  }

  // Revocar vinculación activa → mueve a historial
  const handleRevocar = (id: string) => {
    const v = activas.find(x => x.id === id)
    if (!v) return
    const arch: VinculacionHistorial = {
      id:          `h-${Date.now()}`,
      entidad:     v.entidad,
      tipo:        v.tipo,
      estado:      'revocada',
      fechaInicio: v.fecha,
      fechaFin:    'Hoy',
      motivo:      'Revocado por el productor',
    }
    setHistorial(h => [arch, ...h])
    setActivas(prev => prev.filter(x => x.id !== id))
  }

  // Nueva solicitud enviada → a pendientes
  const handleEnviar = (tipo: Vinculacion['tipo'], entidad: string, mensaje: string) => {
    const nueva: VinculacionPendiente = {
      id:        `p-${Date.now()}`,
      entidad,
      tipo,
      direccion: 'enviada',
      fecha:     'Ahora',
      mensaje:   mensaje || null,
    }
    setPendientes(p => [...p, nueva])
    setTab('pendientes')
  }

  return (
    <div className="flex-1 flex flex-col bg-[#fafaf9] dark:bg-[#0c0a09] overflow-hidden">

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 h-12 border-b border-stone-200/70 dark:border-stone-800 shrink-0 bg-white dark:bg-[#1c1917]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: VIN_COLOR }}/>
          <p className="text-[12px] font-bold text-stone-700 dark:text-stone-200">Vinculaciones</p>
          <span className="text-[9.5px] font-mono text-stone-400 dark:text-stone-500 uppercase tracking-wider">
            Red de acceso
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={onEscalate}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[8px] border border-stone-200/70 dark:border-stone-800/60 bg-white dark:bg-[#1c1917] text-[11px] text-stone-400 dark:text-stone-500 cursor-pointer hover:border-sky-400/40 transition-all"
            style={{ '--hover-color': VIN_COLOR } as React.CSSProperties}
          >
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/>
              <line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
            </svg>
            Espacio Gandia
          </button>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-[8px] border border-stone-200/70 dark:border-stone-800/60 bg-white dark:bg-[#1c1917] text-stone-400 cursor-pointer hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex border-b border-stone-200/70 dark:border-stone-800/60 bg-white dark:bg-[#1c1917] px-3.5 shrink-0 overflow-x-auto [&::-webkit-scrollbar]:hidden">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`relative flex items-center gap-1.5 px-2.5 py-2.5 text-[11.5px] border-0 bg-transparent transition-all -mb-px shrink-0
              ${tab === t.id
                ? 'text-stone-700 dark:text-stone-200 font-semibold border-b-2 cursor-pointer'
                : 'text-stone-400 dark:text-stone-500 font-normal border-b-2 border-transparent hover:text-stone-600 dark:hover:text-stone-300 cursor-pointer'
              }`}
            style={tab === t.id ? { borderBottomColor: VIN_COLOR } : {}}
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

      {/* ── Contenido ── */}
      <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-[4px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-stone-200 dark:[&::-webkit-scrollbar-thumb]:bg-stone-700 [&::-webkit-scrollbar-thumb]:rounded-full">
        <div className="p-4">

          {tab === 'activas' && (
            <VinculacionListaWidget
              vinculaciones={activas}
              onRevocar={handleRevocar}
              onNueva={() => setTab('nueva')}
            />
          )}

          {tab === 'pendientes' && (
            <VinculacionPendientesWidget
              pendientes={pendientes}
              onAceptar={handleAceptar}
              onRechazar={handleRechazar}
            />
          )}

          {tab === 'nueva' && (
            <VinculacionNuevaWidget
              onEnviar={handleEnviar}
            />
          )}

          {tab === 'historial' && (
            <VinculacionHistorialWidget
              historial={historial}
            />
          )}

        </div>
      </div>
    </div>
  )
}