/**
 * MonitoreoAnima.tsx — Nivel Ánima del dominio Monitoreo.
 * Solo importa y renderiza widgets. Nada de JSX propio aquí.
 */

import { useState, useCallback, useEffect } from 'react'
import { useUser }    from '../../context/UserContext'
import CopiloAnima    from '../CopiloAnima'

import {
  getRanchoPorUsuario, getCorrales, getCamaras, getUltimosConteos,
  getAnomalias, getAnimalesPorRancho, getResumenMonitoreo, calcularScore,
  resolverAnomalia, insertConteo, insertAnomalia, subscribeAnomalias,
  dbCorralToWidget, dbCamaraToWidget, dbAnomaliaToWidget,
  type DBCorral, type DBAnomalia, type DBAnimal, type DBConteo,
} from './monitoreoService'

import MapaVistaGeneralWidget,  { type Corral }   from './widgets/MapaVistaGeneralWidget'
import MapaCorralDetalleWidget                      from './widgets/MapaCorralDetalleWidget'
import CamaraListaWidget,       { type Camara }   from './widgets/CamaraListaWidget'
import CamaraFeedWidget                            from './widgets/CamaraFeedWidget'
import CamaraAgregarWidget                         from './widgets/CamaraAgregarWidget'
import CamaraConfigWidget                          from './widgets/CamaraConfigWidget'
import SensorConteoLiveWidget                      from './widgets/SensorConteoLiveWidget'
import SensorCalibracionWidget                     from './widgets/SensorCalibracionWidget'
import AnomaliaFeedWidget,      { type Anomalia } from './widgets/AnomaliaFeedWidget'
import AnomaliaDetalleWidget                       from './widgets/AnomaliaDetalleWidget'
import AnomaliaConfigUmbralWidget                  from './widgets/AnomaliaConfigUmbralWidget'
import ConfigCorralesWidget                        from './widgets/ConfigCorralesWidget'
import ConfigCamarasWidget                         from './widgets/ConfigCamarasWidget'
import TrazabilidadWidget                          from './widgets/TrazabilidadWidget'
import CasoSanitarioWidget, { type CasoSanitario } from './widgets/CasoSanitarioWidget'
import AnomaliaEmptyWidget                         from './widgets/AnomaliaEmptyWidget'
import AnomaliaRegistrarWidget, { type NuevaAnomalia } from './widgets/AnomaliaRegistrarWidget'
import ConfigDronesWidget                          from './widgets/ConfigDronesWidget'

// ─── TIPOS ────────────────────────────────────────────────────────────────────

type Tab = 'general' | 'vigilancia' | 'trazabilidad' | 'anomalias' | 'config'

export type ActiveWidget =
  | 'mapa:vista-general'
  | 'mapa:corral-detalle'
  | 'camara:feed'
  | 'camara:agregar'
  | 'camara:config'
  | 'sensor:conteo-live'
  | 'sensor:calibracion'
  | 'trazabilidad:tabla'
  | 'anomalia:feed'
  | 'anomalia:registrar'
  | 'anomalia:detalle'
  | 'anomalia:caso'
  | 'anomalia:config-umbral'
  | 'config:corrales'
  | 'config:camaras'
  | 'config:drones'

interface Props {
  onClose:    () => void
  onEscalate: () => void
}

const TABS: { id: Tab; label: string; icon: React.FC<{ size?: number }> }[] = [
  { id: 'general',      label: 'Vista General', icon: MapIcon    },
  { id: 'vigilancia',   label: 'Vigilancia',    icon: CamIcon    },
  { id: 'trazabilidad', label: 'Trazabilidad',  icon: TraceIcon  },
  { id: 'anomalias',    label: 'Anomalías',     icon: AlertIcon  },
  { id: 'config',       label: 'Configurar',    icon: ConfigIcon },
]

const TAB_DEFAULT: Record<Tab, ActiveWidget> = {
  general:      'mapa:vista-general',
  vigilancia:   'camara:feed',
  trazabilidad: 'trazabilidad:tabla',
  anomalias:    'anomalia:feed',
  config:       'config:camaras',
}

// ─── COMPONENTE ───────────────────────────────────────────────────────────────

export default function MonitoreoAnima({ onClose, onEscalate }: Props) {
  const { profile } = useUser()

  // ── DB state ────────────────────────────────────────────────────────────────
  const [ranchoId,    setRanchoId]    = useState<string | null>(null)
  const [dbCorrales,  setDbCorrales]  = useState<DBCorral[]>([])
  const [dbCamaras,   setDbCamaras]   = useState<Camara[]>([])
  const [dbAnomalias, setDbAnomalias] = useState<DBAnomalia[]>([])
  const [dbAnimales,  setDbAnimales]  = useState<DBAnimal[]>([])
  const [dbConteos,   setDbConteos]   = useState<DBConteo[]>([])
  const [score,       setScore]       = useState<number | undefined>(undefined)
  const [loading,     setLoading]     = useState(true)

  // ── UI state ────────────────────────────────────────────────────────────────
  const [activeTab,        setActiveTab]       = useState<Tab>('general')
  const [activeWidget,     setActiveWidget]    = useState<ActiveWidget>('mapa:vista-general')
  const [selectedCorral,   setSelectedCorral]  = useState<Corral   | null>(null)
  const [selectedCamara,   setSelectedCamara]  = useState<Camara   | null>(null)
  const [selectedAnomalia, setSelectedAnomalia]= useState<Anomalia | null>(null)
  const [selectedCaso,     setSelectedCaso]    = useState<CasoSanitario | null>(null)

  // ── Derived ─────────────────────────────────────────────────────────────────
  const corrales       = dbCorrales.map(dbCorralToWidget)
  const anomalias      = dbAnomalias.map(a => dbAnomaliaToWidget(a, dbCorrales))
  const alertasActivas = anomalias.filter(a => !a.resuelto).length

  const sensorStats = dbCorrales.map(c => {
    const ult = dbConteos.find(ct => ct.corral_id === c.id)
    return {
      corral:     c.label,
      detectados: ult?.detectados ?? c.animales,
      inventario: ult?.inventario_esperado ?? c.capacidad,
      match:      ult?.match_pct ?? (c.capacidad > 0 ? Math.round(c.animales / c.capacidad * 100) : 0),
      activo:     !!dbCamaras.find(cam => cam.corral === c.label && cam.estado === 'online'),
    }
  })

  // ── Load ────────────────────────────────────────────────────────────────────

  const loadAll = useCallback(async (rid: string) => {
    setLoading(true)
    try {
      const [c, cams, an, anim, cont, resumen] = await Promise.all([
        getCorrales(rid),
        getCamaras(rid),
        getAnomalias(rid),
        getAnimalesPorRancho(rid),
        getUltimosConteos(rid),
        getResumenMonitoreo(rid),
      ])
      setDbCorrales(c)
      setDbCamaras(cams.map((cam, i) => dbCamaraToWidget(cam, c, i)))
      setDbAnomalias(an)
      setDbAnimales(anim)
      setDbConteos(cont)
      if (resumen) setScore(calcularScore(resumen))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!profile?.user_id) return
    getRanchoPorUsuario(profile.user_id)
      .then(r => { setRanchoId(r.id); loadAll(r.id) })
      .catch(console.error)
  }, [profile?.user_id, loadAll])

  useEffect(() => {
    if (!ranchoId) return
    const ch = subscribeAnomalias(ranchoId, () => {
      getAnomalias(ranchoId).then(setDbAnomalias)
    })
    return () => { ch.unsubscribe() }
  }, [ranchoId])

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleTabChange = useCallback((tab: Tab) => {
    setActiveTab(tab)
    setActiveWidget(TAB_DEFAULT[tab])
    setSelectedCorral(null); setSelectedCamara(null)
    setSelectedAnomalia(null); setSelectedCaso(null)
  }, [])

  const handleSelectCorral = useCallback((c: Corral) => {
    setSelectedCorral(c)
    if (c.camara) {
      const cam = dbCamaras.find(cam => cam.corral === c.label) ?? null
      setSelectedCamara(cam)
      setActiveTab('vigilancia')
      setActiveWidget('camara:feed')
    } else {
      setActiveWidget('mapa:corral-detalle')
    }
  }, [dbCamaras])

  const handleSelectAnomalia = useCallback((a: Anomalia) => {
    setSelectedAnomalia(a); setActiveWidget('anomalia:detalle')
  }, [])

  const handleAbrirCaso = useCallback((a: Anomalia) => {
    const dbId = (a as Anomalia & { _dbId?: string })._dbId
    const dbA  = dbAnomalias.find(d => d.id === dbId)
    if (dbA) { setSelectedCaso(dbA as CasoSanitario); setActiveWidget('anomalia:caso') }
  }, [dbAnomalias])

  const handleResolver = useCallback(async (id: number | string) => {
    if (!profile?.user_id || !ranchoId) return
    await resolverAnomalia(String(id), profile.user_id)
    const up = await getAnomalias(ranchoId); setDbAnomalias(up)
    setSelectedAnomalia(null); setActiveWidget(TAB_DEFAULT[activeTab])
  }, [profile?.user_id, ranchoId, activeTab])

  const handleCerrarCaso = useCallback(async (id: string, notas: string) => {
    if (!profile?.user_id || !ranchoId) return
    await resolverAnomalia(id, profile.user_id, notas)
    const up = await getAnomalias(ranchoId); setDbAnomalias(up)
    setSelectedCaso(null); setActiveWidget('anomalia:detalle')
  }, [profile?.user_id, ranchoId])

  const handleRegistrarConteo = useCallback(async (corralId: string, detectados: number, inventario: number) => {
    if (!ranchoId || !profile?.user_id) return
    await insertConteo({ rancho_id: ranchoId, corral_id: corralId, detectados, inventario_esperado: inventario, fuente: 'manual', registrado_por: profile.user_id })
    const up = await getUltimosConteos(ranchoId); setDbConteos(up)
  }, [ranchoId, profile?.user_id])

  const handleCopiloAction = useCallback((actionId: string) => {
    const map: Partial<Record<string, () => void>> = {
      view_alerts:     () => { setActiveTab('anomalias');    setActiveWidget('anomalia:feed')       },
      refresh_sensors: () => { setActiveTab('vigilancia');   setActiveWidget('sensor:conteo-live')  },
      view_map:        () => { setActiveTab('general');      setActiveWidget('mapa:vista-general')  },
      view_cameras:    () => { setActiveTab('vigilancia');   setActiveWidget('camara:feed')         },
      add_camera:      () => { setActiveWidget('camara:agregar') },
      calibrate:       () => { setActiveTab('vigilancia');   setActiveWidget('sensor:calibracion')  },
      config_corrales: () => { setActiveTab('config');       setActiveWidget('config:corrales')     },
      config_umbrales: () => { setActiveTab('config');       setActiveWidget('anomalia:config-umbral') },
      trazabilidad:    () => { setActiveTab('trazabilidad'); setActiveWidget('trazabilidad:tabla')  },
    }
    map[actionId]?.()
  }, [])

  // ── Widget central ───────────────────────────────────────────────────────────

  const renderCentral = () => {
    if (loading) return null

    switch (activeWidget) {

      case 'mapa:vista-general':
        return <MapaVistaGeneralWidget corrales={corrales} onSelectCorral={handleSelectCorral} scoreSanitario={score} />

      case 'mapa:corral-detalle':
        return selectedCorral ? (
          <MapaCorralDetalleWidget
            corral={selectedCorral}
            onVerCamara={() => {
              const cam = dbCamaras.find(c => c.corral === selectedCorral.label) ?? null
              setSelectedCamara(cam); setActiveTab('vigilancia'); setActiveWidget('camara:feed')
            }}
            onClose={() => setActiveWidget('mapa:vista-general')}
          />
        ) : null

      case 'camara:feed':
        return (
          <div className="flex flex-col md:flex-row gap-4 h-full">
            <div className="w-full md:w-50 shrink-0">
              <CamaraListaWidget
                camaras={dbCamaras}
                selectedId={selectedCamara?.id}
                onSelectCamara={(cam: Camara) => setSelectedCamara(cam)}
                onAgregar={() => setActiveWidget('camara:agregar')}
              />
            </div>
            <div className="flex-1 flex flex-col gap-4">
              <SensorConteoLiveWidget stats={sensorStats} />
              {(selectedCamara ?? dbCamaras.find(c => c.estado === 'online') ?? dbCamaras[0])
                ? <CamaraFeedWidget camara={selectedCamara ?? dbCamaras.find(c => c.estado === 'online') ?? dbCamaras[0]} />
                : (
                  <div style={{
                    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    gap: 10, background: '#111', border: '1px solid #1E1E1E', borderRadius: 14, padding: 32, minHeight: 180,
                  }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1.5" strokeLinecap="round">
                      <path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                    <p style={{ fontSize: 12, color: '#444', margin: 0 }}>Sin cámaras registradas</p>
                    <button onClick={() => setActiveWidget('camara:agregar')} style={{
                      padding: '7px 16px', borderRadius: 8, background: '#2FAF8F',
                      border: 'none', color: 'white', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                    }}>+ Agregar primera cámara</button>
                  </div>
                )
              }
            </div>
          </div>
        )

      case 'camara:agregar':
        return <CamaraAgregarWidget corrales={corrales} onGuardar={() => setActiveWidget('config:camaras')} onCancelar={() => setActiveWidget('config:camaras')} />

      case 'camara:config':
        return selectedCamara ? (
          <CamaraConfigWidget camara={selectedCamara} corrales={corrales} onGuardar={c => { setSelectedCamara(c); setActiveWidget('config:camaras') }} onEliminar={() => setActiveWidget('config:camaras')} onCancelar={() => setActiveWidget('config:camaras')} />
        ) : null

      case 'sensor:conteo-live':
        return <SensorConteoLiveWidget stats={sensorStats} />

      case 'sensor:calibracion':
        return <SensorCalibracionWidget />

      case 'trazabilidad:tabla':
        return <TrazabilidadWidget corrales={dbCorrales} animales={dbAnimales} conteos={dbConteos} loading={loading} onRegistrarConteo={handleRegistrarConteo} />

      case 'anomalia:feed':
        return anomalias.length === 0
          ? <AnomaliaEmptyWidget onRegistrar={() => setActiveWidget('anomalia:registrar')} />
          : <AnomaliaFeedWidget anomalias={anomalias} onSelectAnomalia={handleSelectAnomalia} onAbrirCaso={handleAbrirCaso} onRegistrar={() => setActiveWidget('anomalia:registrar')} />

      case 'anomalia:registrar':
        return (
          <AnomaliaRegistrarWidget
            corrales={dbCorrales}
            onGuardar={async (data: NuevaAnomalia) => {
              if (!ranchoId || !profile?.user_id) return
              await insertAnomalia({ ...data, rancho_id: ranchoId, registrado_por: profile.user_id })
              const up = await getAnomalias(ranchoId); setDbAnomalias(up)
              setActiveWidget('anomalia:feed')
            }}
            onCancelar={() => setActiveWidget('anomalia:feed')}
          />
        )

      case 'anomalia:detalle':
        return selectedAnomalia
          ? <AnomaliaDetalleWidget anomalia={selectedAnomalia} onResolver={handleResolver} onClose={() => { setSelectedAnomalia(null); setActiveWidget('anomalia:feed') }} />
          : <AnomaliaEmptyWidget onRegistrar={() => setActiveWidget('anomalia:registrar')} />

      case 'anomalia:caso':
        return selectedCaso
          ? <CasoSanitarioWidget caso={selectedCaso} onResolver={handleCerrarCaso} onClose={() => { setSelectedCaso(null); setActiveWidget('anomalia:feed') }} />
          : null

      case 'anomalia:config-umbral':
        return <AnomaliaConfigUmbralWidget />

      case 'config:corrales':
        return <ConfigCorralesWidget corrales={corrales} onBaja={() => ranchoId && loadAll(ranchoId)} />

      case 'config:camaras':
        return <ConfigCamarasWidget camaras={dbCamaras} onConfigurar={c => { setSelectedCamara(c); setActiveWidget('camara:config') }} onAgregar={() => setActiveWidget('camara:agregar')} />

      case 'config:drones':
        return <ConfigDronesWidget />

      default: return null
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 bg-stone-50 dark:bg-[#0c0a09] flex flex-col z-50">

      {/* TOPBAR */}
      <div className="h-13 flex items-center px-5 border-b border-stone-200/70 dark:border-stone-800/60 bg-white dark:bg-[#1c1917] shrink-0 relative gap-4">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#2FAF8F] animate-pulse" style={{ boxShadow: '0 0 0 3px rgba(47,175,143,0.15)' }} />
          <span className="text-[13px] font-bold text-stone-700 dark:text-stone-200">Monitoreo Sanitario</span>
          {score != null && (
            <span className="hidden md:inline text-[10px] font-bold px-2 py-0.5 rounded-md border ml-1"
              style={{
                color: score >= 85 ? '#2FAF8F' : score >= 65 ? '#F5A623' : '#E5484D',
                borderColor: score >= 85 ? 'rgba(47,175,143,0.3)' : score >= 65 ? 'rgba(245,166,35,0.3)' : 'rgba(229,72,77,0.3)',
                background: score >= 85 ? 'rgba(47,175,143,0.06)' : score >= 65 ? 'rgba(245,166,35,0.06)' : 'rgba(229,72,77,0.06)',
              }}>
              Score {score}/100
            </span>
          )}
          {alertasActivas > 0 && (
            <span className="hidden md:inline text-[10px] font-bold bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 px-2 py-0.5 rounded-md border border-red-200 dark:border-red-800/40 ml-1">
              {alertasActivas} alertas
            </span>
          )}
        </div>

        {/* Tabs centrados */}
        <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 gap-0.5 bg-stone-100 dark:bg-[#141210] border border-stone-200/70 dark:border-stone-800/60 rounded-[12px] p-[3px]">
          {TABS.map(tab => {
            const Icon   = tab.icon
            const active = activeTab === tab.id
            const badge  = tab.id === 'anomalias' && alertasActivas > 0
            return (
              <button key={tab.id} onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-[9px] border-0 cursor-pointer text-[12px] transition-all relative
                  ${active ? 'bg-white dark:bg-[#1c1917] text-stone-700 dark:text-stone-200 font-semibold shadow-sm' : 'bg-transparent text-stone-400 dark:text-stone-500 font-normal hover:text-stone-600 dark:hover:text-stone-300'}`}
              >
                <Icon size={13} />
                {tab.label}
                {badge && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-400 border border-stone-100 dark:border-[#141210]" />}
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <button onClick={onEscalate} className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-[10px] border border-stone-200/70 dark:border-stone-800/60 bg-white dark:bg-[#1c1917] text-[12px] text-stone-400 dark:text-stone-500 cursor-pointer hover:text-[#2FAF8F] hover:border-[#2FAF8F]/40 transition-all">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/>
              <line x1="10" y1="14" x2="17" y2="7"/><line x1="4" y1="20" x2="11" y2="13"/>
            </svg>
            Espacio Gandia
          </button>
          <button onClick={onClose} className="px-3.5 py-1.5 rounded-[10px] border border-stone-200/70 dark:border-stone-800/60 bg-white dark:bg-[#1c1917] text-[12px] text-stone-400 dark:text-stone-500 cursor-pointer hover:text-stone-600 dark:hover:text-stone-300 transition-colors">
            Chat
          </button>
        </div>
      </div>

      {/* Config sub-nav — fuera del body para que ocupe ancho completo */}
      {activeTab === 'config' && (
        <div className="flex gap-1 px-3.5 py-2 border-b border-stone-100 dark:border-stone-800/60 bg-stone-50/80 dark:bg-[#141210] shrink-0">
          {([
            { label: 'Cámaras',     widget: 'config:camaras'        as ActiveWidget },
            { label: 'Corrales',    widget: 'config:corrales'        as ActiveWidget },
            { label: 'Drones',      widget: 'config:drones'         as ActiveWidget },
            { label: 'Umbrales',    widget: 'anomalia:config-umbral' as ActiveWidget },
            { label: 'Calibración', widget: 'sensor:calibracion'    as ActiveWidget },
          ]).map(s => (
            <button
              key={s.widget}
              onClick={() => setActiveWidget(s.widget)}
              className={`px-3 py-1 rounded-[7px] text-[11px] cursor-pointer border-0 transition-all
                ${activeWidget === s.widget
                  ? 'bg-[#2FAF8F]/10 dark:bg-[#2FAF8F]/20 text-[#2FAF8F] font-semibold'
                  : 'text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300'
                }`}
            >{s.label}</button>
          ))}
        </div>
      )}

      {/* BODY */}
      <div className="flex-1 flex min-h-0">

        {/* Sidebar izquierdo */}
        <div className="hidden md:flex w-55 border-r border-stone-200/70 dark:border-stone-800/60 bg-white dark:bg-[#1c1917] flex-col p-4 gap-5 shrink-0 overflow-y-auto">
          <div>
            <p className="text-[10px] font-semibold text-stone-300 dark:text-stone-600 uppercase tracking-[0.06em] mb-2">Corrales</p>
            {corrales.map(c => {
              const dotColor = c.estado === 'normal' ? '#2FAF8F' : c.estado === 'atencion' ? '#f59e0b' : '#ef4444'
              const isActive = selectedCorral?.id === c.id
              return (
                <div key={c.id} onClick={() => handleSelectCorral(c)}
                  className={`flex items-center gap-2.5 px-2.5 py-2 rounded-[10px] cursor-pointer transition-colors mb-0.5 ${isActive ? 'bg-[#2FAF8F]/08 dark:bg-[#2FAF8F]/15' : 'bg-transparent hover:bg-stone-50 dark:hover:bg-[#141210]'}`}>
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: dotColor }} />
                  <span className="text-[12px] font-semibold text-stone-700 dark:text-stone-200 flex-1">{c.label}</span>
                  <span className="text-[11px] text-stone-400 dark:text-stone-500">{c.animales}</span>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-stone-300 dark:text-stone-600"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </div>
              )
            })}
          </div>

          <div>
            <p className="text-[10px] font-semibold text-stone-300 dark:text-stone-600 uppercase tracking-[0.06em] mb-2">Cámaras</p>
            {dbCamaras.map(cam => {
              const isActive = selectedCamara?.id === cam.id && activeWidget === 'camara:feed'
              return (
                <div key={cam.id} onClick={() => { setSelectedCamara(cam); setActiveTab('vigilancia'); setActiveWidget('camara:feed') }}
                  className={`flex items-center gap-2.5 px-2.5 py-2 rounded-[10px] cursor-pointer transition-colors mb-0.5 ${isActive ? 'bg-[#2FAF8F]/08 dark:bg-[#2FAF8F]/15' : 'bg-transparent hover:bg-stone-50 dark:hover:bg-[#141210]'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cam.estado === 'online' ? 'bg-[#2FAF8F] animate-pulse' : 'bg-stone-300 dark:bg-stone-600'}`} />
                  <span className="text-[12px] font-semibold text-stone-700 dark:text-stone-200 flex-1">{cam.label}</span>
                  <span className={`text-[10px] font-semibold ${cam.estado === 'online' ? 'text-[#2FAF8F]' : 'text-stone-300 dark:text-stone-600'}`}>
                    {cam.estado === 'online' ? 'Live' : 'Off'}
                  </span>
                </div>
              )
            })}
          </div>

          {score != null && (
            <div className="mt-auto pt-3 border-t border-stone-100 dark:border-stone-800/60">
              <p className="text-[10px] font-semibold text-stone-300 dark:text-stone-600 uppercase tracking-[0.06em] mb-2">Score Sanitario</p>
              <div style={{ height: 4, background: '#1E1E1E', borderRadius: 3, overflow: 'hidden', marginBottom: 6 }}>
                <div style={{ height: '100%', width: `${score}%`, background: score >= 85 ? '#2FAF8F' : score >= 65 ? '#F5A623' : '#E5484D', borderRadius: 3, transition: 'width 1.2s ease' }} />
              </div>
              <div className="flex items-center justify-between">
                <span style={{ fontSize: 20, fontWeight: 800, color: score >= 85 ? '#2FAF8F' : score >= 65 ? '#F5A623' : '#E5484D', fontFamily: 'monospace' }}>{score}</span>
                <span style={{ fontSize: 9, color: score >= 85 ? '#2FAF8F' : score >= 65 ? '#F5A623' : '#E5484D', fontFamily: 'monospace', fontWeight: 700, letterSpacing: '0.06em' }}>
                  {score >= 85 ? 'ÓPTIMO' : score >= 65 ? 'ACEPTABLE' : 'RIESGO'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Zona central */}
        <div className="flex-1 p-3 md:p-5 overflow-y-auto flex flex-col gap-3 pb-20 md:pb-5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {renderCentral()}
        </div>

        {/* Panel derecho: anomalías */}
        <div className="hidden md:flex md:flex-col w-65 border-l border-stone-200/70 dark:border-stone-800/60 bg-white dark:bg-[#1c1917] p-4 shrink-0 overflow-hidden">
          <AnomaliaFeedWidget
            anomalias={anomalias}
            onSelectAnomalia={handleSelectAnomalia}
            onAbrirCaso={handleAbrirCaso}
            onRegistrar={() => { setActiveTab('anomalias'); setActiveWidget('anomalia:registrar') }}
          />
        </div>
      </div>

      <CopiloAnima domain="monitoring" onAction={handleCopiloAction} />

      {/* Bottom nav móvil */}
      <div className="md:hidden flex border-t border-stone-200/70 dark:border-stone-800/60 bg-white dark:bg-[#1c1917] shrink-0">
        {TABS.map(tab => {
          const Icon   = tab.icon
          const active = activeTab === tab.id
          return (
            <button key={tab.id} onClick={() => handleTabChange(tab.id)}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 border-0 cursor-pointer transition-all ${active ? 'text-[#2FAF8F]' : 'bg-transparent text-stone-400 dark:text-stone-500'}`}>
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

function MapIcon({ size = 14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></svg>
}
function CamIcon({ size = 14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
}
function TraceIcon({ size = 14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
}
function AlertIcon({ size = 14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
}
function ConfigIcon({ size = 14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
}