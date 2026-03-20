/**
 * MonitoreoModulo.tsx — v2
 * 4 paneles: Vista General · Vigilancia · Trazabilidad · Anomalías
 * Datos reales desde Supabase vía monitoreoService.
 */

import { useState, useCallback, useEffect } from 'react'
import { useUser } from '../../context/UserContext'

import {
  getRanchoPorUsuario, getCorrales, getCamaras, getUltimosConteos,
  getAnomalias, getAnimalesPorRancho, getResumenMonitoreo, calcularScore,
  resolverAnomalia, insertConteo, insertAnomalia, subscribeAnomalias,
  dbCorralToWidget, dbCamaraToWidget, dbAnomaliaToWidget,
  type DBCorral, type DBCamara, type DBAnomalia, type DBAnimal, type DBConteo,
} from './monitoreoService'

// ── Widgets existentes ────────────────────────────────────────────────────────
import MapaVistaGeneralWidget,  { type Corral }   from './widgets/MapaVistaGeneralWidget'
import MapaCorralDetalleWidget                      from './widgets/MapaCorralDetalleWidget'
import                          { type Camara }   from './widgets/CamaraListaWidget'
import CamaraListaWidget                           from './widgets/CamaraListaWidget'
import CamaraFeedWidget                            from './widgets/CamaraFeedWidget'
import CamaraAgregarWidget                         from './widgets/CamaraAgregarWidget'
import CamaraConfigWidget                          from './widgets/CamaraConfigWidget'
import SensorConteoLiveWidget                      from './widgets/SensorConteoLiveWidget'
import AnomaliaFeedWidget,      { type Anomalia } from './widgets/AnomaliaFeedWidget'
import AnomaliaDetalleWidget                       from './widgets/AnomaliaDetalleWidget'
import AnomaliaConfigUmbralWidget                  from './widgets/AnomaliaConfigUmbralWidget'
import ConfigCorralesWidget                        from './widgets/ConfigCorralesWidget'
import ConfigCamarasWidget                         from './widgets/ConfigCamarasWidget'
// ── Widgets nuevos ────────────────────────────────────────────────────────────
import TrazabilidadWidget                                            from './widgets/TrazabilidadWidget'
import CasoSanitarioWidget,       { type CasoSanitario }            from './widgets/CasoSanitarioWidget'
import AnomaliaEmptyWidget                                           from './widgets/AnomaliaEmptyWidget'
import AnomaliaRegistrarWidget,   { type NuevaAnomalia }            from './widgets/AnomaliaRegistrarWidget'
import ConfigDronesWidget                                            from './widgets/ConfigDronesWidget'

// ─── TIPOS ────────────────────────────────────────────────────────────────────

type Tab = 'general' | 'vigilancia' | 'trazabilidad' | 'anomalias' | 'config'

type ModuleWidget =
  | 'mapa:vista-general'
  | 'mapa:corral-detalle'
  | 'camara:lista-feed'
  | 'camara:agregar'
  | 'camara:config'
  | 'sensor:conteo-live'
  | 'trazabilidad:tabla'
  | 'anomalia:feed'
  | 'anomalia:detalle'
  | 'anomalia:caso'
  | 'anomalia:registrar'
  | 'anomalia:config-umbral'
  | 'config:corrales'
  | 'config:camaras'
  | 'config:drones'

interface Props {
  onClose:    () => void
  onEscalate: () => void
}

const TABS: { id: Tab; label: string }[] = [
  { id: 'general',      label: 'Vista General'  },
  { id: 'vigilancia',   label: 'Vigilancia'     },
  { id: 'trazabilidad', label: 'Trazabilidad'   },
  { id: 'anomalias',    label: 'Anomalías'      },
  { id: 'config',       label: 'Config'         },
]

const TAB_DEFAULT: Record<Tab, ModuleWidget> = {
  general:      'mapa:vista-general',
  vigilancia:   'camara:lista-feed',
  trazabilidad: 'trazabilidad:tabla',
  anomalias:    'anomalia:feed',
  config:       'config:camaras',
}

// ─── COMPONENTE ───────────────────────────────────────────────────────────────

export default function MonitoreoModulo({ onClose, onEscalate }: Props) {
  const { profile } = useUser()

  // ── Estado DB ─────────────────────────────────────────────────────────────
  const [ranchoId,      setRanchoId]      = useState<string | null>(null)
  const [dbCorrales,    setDbCorrales]    = useState<DBCorral[]>([])
  const [dbCamaras,     setDbCamaras]     = useState<DBCamara[]>([])
  const [dbAnomalias,   setDbAnomalias]   = useState<DBAnomalia[]>([])
  const [dbAnimales,    setDbAnimales]    = useState<DBAnimal[]>([])
  const [dbConteos,     setDbConteos]     = useState<DBConteo[]>([])
  const [score,         setScore]         = useState<number | undefined>(undefined)
  const [loadingData,   setLoadingData]   = useState(true)

  // ── Estado UI ─────────────────────────────────────────────────────────────
  const [activeTab,        setActiveTab]        = useState<Tab>('general')
  const [activeWidget,     setActiveWidget]     = useState<ModuleWidget>('mapa:vista-general')
  const [selectedCorral,   setSelectedCorral]   = useState<Corral   | null>(null)
  const [selectedCamara,   setSelectedCamara]   = useState<Camara   | null>(null)
  const [selectedAnomalia, setSelectedAnomalia] = useState<Anomalia | null>(null)
  const [selectedCaso,     setSelectedCaso]     = useState<CasoSanitario | null>(null)

  // ── Mappers a tipos de widgets ─────────────────────────────────────────────
  const corrales  = dbCorrales.map(dbCorralToWidget)
  const camaras   = dbCamaras.map((c, i) => dbCamaraToWidget(c, dbCorrales, i))
  const anomalias = dbAnomalias.map(a => dbAnomaliaToWidget(a, dbCorrales))

  const alertasActivas = anomalias.filter(a => !a.resuelto).length

  const sensorStats = dbCorrales.map(c => {
    const ult = dbConteos.find(ct => ct.corral_id === c.id)
    return {
      corral:     c.label,
      detectados: ult?.detectados ?? c.animales,
      inventario: ult?.inventario_esperado ?? c.capacidad,
      match:      ult?.match_pct ?? (c.capacidad > 0 ? Math.round(c.animales / c.capacidad * 100) : 0),
      activo:     !!dbCamaras.find(cam => cam.corral_id === c.id && cam.estado === 'online'),
    }
  })

  // ── Carga inicial ──────────────────────────────────────────────────────────

  const loadAll = useCallback(async (rid: string) => {
    setLoadingData(true)
    try {
      const [corralesData, camarasData, anomaliasData, animalesData, conteosData, resumen] = await Promise.all([
        getCorrales(rid),
        getCamaras(rid),
        getAnomalias(rid),
        getAnimalesPorRancho(rid),
        getUltimosConteos(rid),
        getResumenMonitoreo(rid),
      ])
      setDbCorrales(corralesData)
      setDbCamaras(camarasData)
      setDbAnomalias(anomaliasData)
      setDbAnimales(animalesData)
      setDbConteos(conteosData)
      if (resumen) setScore(calcularScore(resumen))
    } catch (e) {
      console.error('[MonitoreoModulo] Error cargando datos:', e)
    } finally {
      setLoadingData(false)
    }
  }, [])

  useEffect(() => {
    if (!profile?.user_id) return
    getRanchoPorUsuario(profile.user_id)
      .then(r => {
        setRanchoId(r.id)
        loadAll(r.id)
      })
      .catch(console.error)
  }, [profile?.user_id, loadAll])

  // Realtime anomalías
  useEffect(() => {
    if (!ranchoId) return
    const channel = subscribeAnomalias(ranchoId, () => {
      getAnomalias(ranchoId).then(setDbAnomalias).catch(console.error)
    })
    return () => { channel.unsubscribe() }
  }, [ranchoId])

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleTabChange = useCallback((tab: Tab) => {
    setActiveTab(tab)
    setActiveWidget(TAB_DEFAULT[tab])
    setSelectedCorral(null)
    setSelectedCamara(null)
    setSelectedAnomalia(null)
    setSelectedCaso(null)
  }, [])

  const handleSelectCorral = useCallback((c: Corral) => {
    setSelectedCorral(c)
    if (c.camara) {
      const cam = camaras.find(cam => cam.corral === c.label) ?? null
      setSelectedCamara(cam)
      setActiveTab('vigilancia')
      setActiveWidget('camara:lista-feed')
    } else {
      setActiveWidget('mapa:corral-detalle')
    }
  }, [camaras])

  const handleSelectAnomalia = useCallback((a: Anomalia) => {
    setSelectedAnomalia(a)
    setActiveWidget('anomalia:detalle')
  }, [])

  const handleAbrirCaso = useCallback((a: Anomalia) => {
    const dbId = (a as Anomalia & { _dbId?: string })._dbId
    const dbA  = dbAnomalias.find(d => d.id === dbId)
    if (dbA) {
      setSelectedCaso(dbA as CasoSanitario)
      setActiveWidget('anomalia:caso')
    }
  }, [dbAnomalias])

  const handleResolverAnomalia = useCallback(async (id: number | string) => {
    if (!profile?.user_id || !ranchoId) return
    const dbId = typeof id === 'string' ? id : dbAnomalias.find((_, i) => i + 1 === id)?.id
    if (!dbId) return
    await resolverAnomalia(dbId, profile.user_id)
    const updated = await getAnomalias(ranchoId)
    setDbAnomalias(updated)
    setSelectedAnomalia(null)
    setActiveWidget('anomalia:feed')
  }, [profile?.user_id, ranchoId, dbAnomalias])

  const handleCerrarCaso = useCallback(async (id: string, notas: string) => {
    if (!profile?.user_id || !ranchoId) return
    await resolverAnomalia(id, profile.user_id, notas)
    const updated = await getAnomalias(ranchoId)
    setDbAnomalias(updated)
    setSelectedCaso(null)
    setActiveWidget('anomalia:feed')
  }, [profile?.user_id, ranchoId])

  const handleRegistrarConteo = useCallback(async (corralId: string, detectados: number, inventario: number) => {
    if (!ranchoId || !profile?.user_id) return
    await insertConteo({
      rancho_id:           ranchoId,
      corral_id:           corralId,
      detectados,
      inventario_esperado: inventario,
      fuente:              'manual',
      registrado_por:      profile.user_id,
    })
    const updated = await getUltimosConteos(ranchoId)
    setDbConteos(updated)
  }, [ranchoId, profile?.user_id])

  // ── Render widget ──────────────────────────────────────────────────────────

  const renderWidget = () => {
    if (loadingData) return null

    switch (activeWidget) {

      // ── PANEL 1: Vista General ──────────────────────────────────────────────
      case 'mapa:vista-general':
        return (
          <MapaVistaGeneralWidget
            corrales={corrales}
            onSelectCorral={handleSelectCorral}
            scoreSanitario={score}
          />
        )

      case 'mapa:corral-detalle':
        return selectedCorral ? (
          <MapaCorralDetalleWidget
            corral={selectedCorral}
            onVerCamara={() => {
              const cam = camaras.find(c => c.corral === selectedCorral.label) ?? null
              setSelectedCamara(cam)
              setActiveTab('vigilancia')
              setActiveWidget('camara:lista-feed')
            }}
            onClose={() => setActiveWidget('mapa:vista-general')}
          />
        ) : null

      // ── PANEL 2: Vigilancia ─────────────────────────────────────────────────
      case 'camara:lista-feed': {
        const camaraActiva = selectedCamara ?? camaras.find(c => c.estado === 'online') ?? camaras[0]
        return (
          <div className="flex flex-col gap-3 h-full">
            <SensorConteoLiveWidget stats={sensorStats} />
            {camaraActiva
              ? <CamaraFeedWidget camara={camaraActiva} />
              : <CamaraListaWidget camaras={[]} onAgregar={() => setActiveWidget('camara:agregar')} />
            }
          </div>
        )
      }

      case 'sensor:conteo-live':
        return <SensorConteoLiveWidget stats={sensorStats} />

      case 'camara:agregar':
        return (
          <CamaraAgregarWidget
            corrales={corrales}
            onGuardar={() => { setActiveTab('vigilancia'); setActiveWidget('camara:lista-feed') }}
            onCancelar={() => setActiveWidget('config:camaras')}
          />
        )

      case 'camara:config':
        return selectedCamara ? (
          <CamaraConfigWidget
            camara={selectedCamara}
            corrales={corrales}
            onGuardar={cam => {
              setSelectedCamara(cam)
              setActiveWidget('config:camaras')
            }}
            onEliminar={() => { setActiveWidget('config:camaras') }}
            onCancelar={() => setActiveWidget('config:camaras')}
          />
        ) : null

      // ── PANEL 3: Trazabilidad ───────────────────────────────────────────────
      case 'trazabilidad:tabla':
        return (
          <TrazabilidadWidget
            corrales={dbCorrales}
            animales={dbAnimales}
            conteos={dbConteos}
            loading={loadingData}
            onRegistrarConteo={handleRegistrarConteo}
          />
        )

      // ── PANEL 4: Anomalías ──────────────────────────────────────────────────
      case 'anomalia:feed':
        return anomalias.length === 0
          ? <AnomaliaEmptyWidget onRegistrar={() => setActiveWidget('anomalia:registrar')} />
          : (
            <AnomaliaFeedWidget
              anomalias={anomalias}
              onSelectAnomalia={handleSelectAnomalia}
              onAbrirCaso={handleAbrirCaso}
              onRegistrar={() => setActiveWidget('anomalia:registrar')}
            />
          )

      case 'anomalia:detalle':
        return selectedAnomalia ? (
          <AnomaliaDetalleWidget
            anomalia={selectedAnomalia}
            onResolver={handleResolverAnomalia}
            onClose={() => { setSelectedAnomalia(null); setActiveWidget('anomalia:feed') }}
          />
        ) : null

      case 'anomalia:caso':
        return selectedCaso ? (
          <CasoSanitarioWidget
            caso={selectedCaso}
            onResolver={handleCerrarCaso}
            onClose={() => { setSelectedCaso(null); setActiveWidget('anomalia:feed') }}
          />
        ) : null

      case 'anomalia:registrar':
        return (
          <AnomaliaRegistrarWidget
            corrales={dbCorrales}
            onGuardar={async (data: NuevaAnomalia) => {
              if (!ranchoId || !profile?.user_id) return
              await insertAnomalia({ ...data, rancho_id: ranchoId, registrado_por: profile.user_id })
              const updated = await getAnomalias(ranchoId)
              setDbAnomalias(updated)
              setActiveWidget('anomalia:feed')
            }}
            onCancelar={() => setActiveWidget('anomalia:feed')}
          />
        )

      case 'anomalia:config-umbral':
        return <AnomaliaConfigUmbralWidget />

      // ── Config ──────────────────────────────────────────────────────────────
      case 'config:corrales':
        return (
          <ConfigCorralesWidget
            corrales={corrales}
            onBaja={() => ranchoId && loadAll(ranchoId)}
            onNuevaZona={() => {}}
          />
        )

      case 'config:camaras':
        return (
          <ConfigCamarasWidget
            camaras={camaras}
            onConfigurar={cam => { setSelectedCamara(cam); setActiveWidget('camara:config') }}
            onAgregar={() => setActiveWidget('camara:agregar')}
          />
        )

      case 'config:drones':
        return <ConfigDronesWidget />

      default:
        return null
    }
  }

  // ── RENDER ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex-1 flex flex-col bg-stone-50 dark:bg-[#0c0a09] min-h-0">

      {/* Header */}
      <div className="flex items-center justify-between px-4 h-12 border-b border-stone-200/70 dark:border-stone-800/60 bg-white dark:bg-[#1c1917] shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#2FAF8F] animate-pulse" />
          <span className="text-[12px] font-bold text-stone-700 dark:text-stone-200">Monitoreo Sanitario</span>
          {score != null && (
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
              style={{
                color: score >= 85 ? '#2FAF8F' : score >= 65 ? '#F5A623' : '#E5484D',
                borderColor: score >= 85 ? 'rgba(47,175,143,0.3)' : score >= 65 ? 'rgba(245,166,35,0.3)' : 'rgba(229,72,77,0.3)',
                background: score >= 85 ? 'rgba(47,175,143,0.08)' : score >= 65 ? 'rgba(245,166,35,0.08)' : 'rgba(229,72,77,0.08)',
              }}
            >
              Score {score}/100
            </span>
          )}
          {alertasActivas > 0 && (
            <span className="flex items-center gap-1 text-[10px] font-medium bg-red-50 dark:bg-red-950/30 text-red-500 dark:text-red-400 px-2 py-0.5 rounded-full border border-red-100 dark:border-red-900/40">
              <span className="w-1 h-1 rounded-full bg-red-400 animate-pulse" />
              {alertasActivas} alertas
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={onEscalate}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-stone-200/70 dark:border-stone-800/60 bg-white dark:bg-[#1c1917] text-[11px] text-stone-400 dark:text-stone-500 cursor-pointer hover:text-[#2FAF8F] hover:border-[#2FAF8F]/40 transition-all"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/>
              <line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
            </svg>
            Espacio Gandia
          </button>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-stone-200/70 dark:border-stone-800/60 bg-white dark:bg-[#1c1917] text-stone-400 dark:text-stone-500 cursor-pointer hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-stone-200/70 dark:border-stone-800/60 bg-white dark:bg-[#1c1917] px-3.5 shrink-0 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {TABS.map(tab => {
          const active  = activeTab === tab.id
          const isBadge = tab.id === 'anomalias' && alertasActivas > 0
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-1.5 px-2.5 py-2.5 text-[11.5px] cursor-pointer border-0 bg-transparent transition-all -mb-px shrink-0
                ${active
                  ? 'text-stone-700 dark:text-stone-200 font-semibold border-b-2 border-[#2FAF8F]'
                  : 'text-stone-400 dark:text-stone-500 font-normal border-b-2 border-transparent hover:text-stone-600 dark:hover:text-stone-300'
                }`}
            >
              {tab.label}
              {isBadge && <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />}
            </button>
          )
        })}
      </div>

      {/* Config sub-nav */}
      {activeTab === 'config' && (
        <div className="flex gap-1 px-3.5 py-2 border-b border-stone-100 dark:border-stone-800/60 bg-stone-50/80 dark:bg-[#141210] shrink-0">
          {([
            { label: 'Cámaras',     widget: 'config:camaras'        as ModuleWidget },
            { label: 'Corrales',    widget: 'config:corrales'        as ModuleWidget },
            { label: 'Drones',      widget: 'config:drones'         as ModuleWidget },
            { label: 'Umbrales',    widget: 'anomalia:config-umbral' as ModuleWidget },
            { label: 'Calibración', widget: 'sensor:conteo-live'    as ModuleWidget },
          ] as const).map(s => (
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

      {/* Widget zone */}
      <div className="flex-1 p-3.5 overflow-y-auto flex flex-col
        [&::-webkit-scrollbar]:w-1.25
        [&::-webkit-scrollbar-track]:bg-transparent
        [&::-webkit-scrollbar-thumb]:bg-stone-200
        [&::-webkit-scrollbar-thumb]:dark:bg-stone-700
        [&::-webkit-scrollbar-thumb]:rounded-full">
        {renderWidget()}
      </div>
    </div>
  )
}