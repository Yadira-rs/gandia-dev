/**
 * BiometriaAnima.tsx
 * Nivel Ánima del dominio Biometría — CON DB REAL
 * ARCHIVO → src/artifacts/biometria/BiometriaAnima.tsx
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { useUser }        from '../../context/UserContext'
import { useRanchoId, getAuthUserId } from '../../hooks/useAnimales'
import { supabase }       from '../../lib/supabaseClient'
import { useOfflineQueue } from '../../hooks/useOfflineQueue'
import type { OfflineCapturaItem } from '../../hooks/useOfflineQueue'
import {
  useBiometriaCapturas,
  registrarCaptura,
  confirmarCaptura,
  registrarEmbedding,
  dbToRegistro,
  type RegistroCaptura,
  type ResultadoCaptura,
} from '../../hooks/useBiometria'

import CopiloAnima from '../CopiloAnima'

import BiometriaCapturaWidget,   { type CapturaResult }     from './widgets/BiometriaCapturaWidget'
import BiometriaResultadoWidget, { type BiometriaResultado,
                                   type AnimalMatch }       from './widgets/BiometriaResultadoWidget'
import BiometriaHistorialWidget                             from './widgets/BiometriaHistorialWidget'
import BiometriaEstadisticasWidget                          from './widgets/BiometriaEstadisticasWidget'
import BiometriaConfigWidget                                from './widgets/BiometriaConfigWidget'
import BiometriaRegistrarWidget                             from './widgets/BiometriaRegistrarWidget'
import type { AnimalContext } from './widgets/BiometriaCapturaWidget'

// ─── TIPOS ────────────────────────────────────────────────────────────────────

type Tab = 'identificar' | 'registrar' | 'estadisticas' | 'config'

type PipelineStep = {
  id:     string
  label:  string
  sub:    string
  estado: 'idle' | 'running' | 'done' | 'error'
}

interface Props {
  onClose:    () => void
  onEscalate: () => void
}

// ─── URL del backend ──────────────────────────────────────────────────────────

const BACKEND_URL = import.meta.env.VITE_BIOMETRIA_API_URL ?? 'http://127.0.0.1:8000'

// ─── Helper: datos completos del animal desde Supabase ────────────────────────

async function fetchAnimalData(animalId: string) {
  try {
    const { data } = await supabase
      .from('animales')
      .select('nombre, raza, upp, siniiga')
      .eq('id', animalId)
      .single()
    return data as { nombre: string | null; raza: string; upp: string | null; siniiga: string } | null
  } catch {
    return null
  }
}

// ─── PIPELINE VISUAL ─────────────────────────────────────────────────────────

const PIPELINE_BASE: PipelineStep[] = [
  { id: 'validar',     label: 'Validación',        sub: 'Formato · Resolución · Nitidez',     estado: 'idle' },
  { id: 'detectar',    label: 'Detección morro',   sub: 'Contornos Canny · Segmentación',     estado: 'idle' },
  { id: 'preproc',     label: 'Preprocesamiento',  sub: 'CLAHE · Gaussiano · Normalización',  estado: 'idle' },
  { id: 'fingerprint', label: 'Fingerprint CV',    sub: 'Gradientes Sobel · Minutiae · 512D', estado: 'idle' },
  { id: 'embedding',   label: 'IA Embedding',      sub: 'ResNet50 → PCA 128D',                estado: 'idle' },
  { id: 'fusion',      label: 'Fusión + Búsqueda', sub: 'Score 55/45 · pgvector coseno',      estado: 'idle' },
  { id: 'decision',    label: 'Decisión',          sub: 'Umbral 0.90 · 0.80 · 0.70',         estado: 'idle' },
]

const TABS: { id: Tab; label: string; icon: React.FC<{ size?: number }> }[] = [
  { id: 'identificar',  label: 'Identificar',  icon: MorroIcon  },
  { id: 'registrar',    label: 'Registrar',    icon: PlusIcon   },
  { id: 'estadisticas', label: 'Estadísticas', icon: ChartIcon  },
  { id: 'config',       label: 'Config',       icon: ConfigIcon },
]

// ─── COMPONENTE ───────────────────────────────────────────────────────────────

export default function BiometriaAnima({ onClose, onEscalate }: Props) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const { profile }  = useUser()
  const userId       = profile?.user_id ?? null
  const { ranchoId } = useRanchoId(userId)

  // ── Datos reales ──────────────────────────────────────────────────────────
  const { capturas, loading: loadingCapturas, refetch: refetchCapturas } = useBiometriaCapturas(ranchoId)
  const registros: RegistroCaptura[] = capturas.map(dbToRegistro)

  // ── Estado local ──────────────────────────────────────────────────────────
  const [activeTab,         setActiveTab]         = useState<Tab>('identificar')
  const [resultado,         setResultado]         = useState<BiometriaResultado | null>(null)
  const [pipeline,          setPipeline]          = useState<PipelineStep[]>(PIPELINE_BASE)
  const [processing,        setProcessing]        = useState(false)
  const [showCameraSheet,   setShowCameraSheet]   = useState(false)
  const [registrandoAnimal, setRegistrandoAnimal] = useState<AnimalContext | null>(null)
  const [dbError,           setDbError]           = useState<string | null>(null)

  const currentCapturaIdRef = useRef<string | null>(null)
  const pipelineRef         = useRef<ReturnType<typeof setTimeout>[]>([])
  const capturaResultRef    = useRef<CapturaResult | null>(null)
  const registrandoRef      = useRef<AnimalContext | null>(null)
  const pendingNuevoCaptureRef = useRef<string | null>(null)
  const pendingNuevoModoRef    = useRef<'direct' | 'sheet'>('direct')

  const pendientes = registros.filter(r => r.resultado === 'candidato' && !r.confirmado).length

  useEffect(() => () => pipelineRef.current.forEach(clearTimeout), [])

  // ── Cola offline ──────────────────────────────────────────────────────────
  const handleRetry = useCallback(async (item: OfflineCapturaItem): Promise<boolean> => {
    if (!ranchoId) return false
    try {
      const imgRes = await fetch(item.imageDataUrl)
      const blob   = await imgRes.blob()
      const form   = new FormData()
      form.append('image',     blob, 'morro.jpg')
      form.append('rancho_id', item.ranchoId)
      form.append('modo',      item.modo)
      const res = await fetch(`${BACKEND_URL}/identify`, { method: 'POST', body: form })
      return res.ok
    } catch {
      return false
    }
  }, [ranchoId])

  const { queue: offlineQueue, isOnline, enqueue: enqueueOffline } = useOfflineQueue({ onRetry: handleRetry })

  // ── Animación del pipeline ────────────────────────────────────────────────
  const animarPipeline = (onDone: () => void) => {
    pipelineRef.current.forEach(clearTimeout)
    pipelineRef.current = []
    setProcessing(true)
    setPipeline(PIPELINE_BASE.map(s => ({ ...s, estado: 'idle' as const })))

    PIPELINE_BASE.forEach((step, i) => {
      const t1 = setTimeout(() => {
        setPipeline(prev => prev.map(s => s.id === step.id ? { ...s, estado: 'running' as const } : s))
      }, i * 520)
      const t2 = setTimeout(() => {
        setPipeline(prev => prev.map(s => s.id === step.id ? { ...s, estado: 'done' as const } : s))
        if (i === PIPELINE_BASE.length - 1) { setProcessing(false); onDone() }
      }, i * 520 + 420)
      pipelineRef.current.push(t1, t2)
    })
  }

  // ── Recibir captura — usa resultado REAL del backend ─────────────────────
  const handleCaptura = (capturaResult: CapturaResult) => {
    // Si está offline, encolar
    if (!isOnline && ranchoId) {
      enqueueOffline({
        imageDataUrl: capturaResult.imageDataUrl,
        ranchoId,
        animalId:  registrandoAnimal?.id ?? null,
        modo:      capturaResult.mode,
        timestamp: Date.now(),
      })
      return
    }

    setResultado(null)
    currentCapturaIdRef.current = null
    capturaResultRef.current    = capturaResult
    registrandoRef.current      = registrandoAnimal

    animarPipeline(async () => {
      const cr    = capturaResultRef.current!
      const regAn = registrandoRef.current

      let res: BiometriaResultado

      if (cr.resultado === 'match' && cr.animal_id) {
        const animalData = await fetchAnimalData(cr.animal_id)
        res = {
          tipo:    'match',
          captura: cr.imageDataUrl,
          modo:    cr.mode,
          ms:      Date.now(),
          match: {
            id:      cr.animal_id,
            nombre:  animalData?.nombre  ?? regAn?.nombre ?? '—',
            raza:    animalData?.raza    ?? regAn?.raza   ?? '—',
            lote:    animalData?.upp     ?? regAn?.lote   ?? '—',
            arete:   animalData?.siniiga ?? regAn?.arete  ?? '—',
            score:   cr.score_final,
            scoreCV: cr.score_cv,
            scoreIA: cr.score_ia,
          },
        }
      } else if (cr.resultado === 'candidato') {
        const enriched = await Promise.all(
          cr.candidatos.map(async c => {
            const data = c.animal_id ? await fetchAnimalData(c.animal_id) : null
            return {
              id:      c.animal_id,
              nombre:  data?.nombre  ?? c.animal_nombre  ?? '—',
              raza:    data?.raza    ?? '—',
              lote:    data?.upp     ?? '—',
              arete:   data?.siniiga ?? c.animal_siniiga ?? '—',
              score:   c.score_final,
              scoreCV: 0,
              scoreIA: 0,
            }
          })
        )
        res = {
          tipo:       'candidato',
          captura:    cr.imageDataUrl,
          modo:       cr.mode,
          ms:         Date.now(),
          candidatos: enriched,
        }
      } else {
        res = { tipo: 'nuevo', captura: cr.imageDataUrl, modo: cr.mode, ms: Date.now() }
      }

      setResultado(res)

      // Persistir en BD
      const authUserId = await getAuthUserId()
      if (authUserId && ranchoId) {
        const animalId = cr.animal_id ?? regAn?.id ?? null
        const { captura: saved, error: saveErr } = await registrarCaptura({
          imageDataUrl: cr.imageDataUrl,
          ranchoId,
          userId:       authUserId,
          animalId,
          scoreCV:      cr.score_cv    || undefined,
          scoreIA:      cr.score_ia    || undefined,
          scoreFusion:  cr.score_final || undefined,
          resultado:    cr.resultado   as ResultadoCaptura,
          modo:         cr.mode,
          latitud:      cr.latitude    ?? undefined,
          longitud:     cr.longitude   ?? undefined,
        })
        if (saveErr) setDbError(saveErr)
        if (saved) { currentCapturaIdRef.current = saved.id; refetchCapturas() }
      }
    })
  }

  // ── Confirmar animal ──────────────────────────────────────────────────────
  const handleConfirmar = async (animal: AnimalMatch) => {
    const authUserId = await getAuthUserId()
    const capturaId  = currentCapturaIdRef.current

    if (authUserId && capturaId && animal.id) {
      // 1. Confirmar en BD
      const { error: confirmErr } = await confirmarCaptura({ capturaId, animalId: animal.id, userId: authUserId })
      if (confirmErr) setDbError(confirmErr)

      // 2. Registrar en backend Python → puebla biometria_embeddings
      if (resultado?.captura && ranchoId) {
        try {
          const imgRes = await fetch(resultado.captura)
          const blob   = await imgRes.blob()
          const form   = new FormData()
          form.append('image',     blob, 'morro.jpg')
          form.append('animal_id', animal.id)
          form.append('rancho_id', ranchoId)
          form.append('modo',      resultado.modo)
          await fetch(`${BACKEND_URL}/register`, { method: 'POST', body: form })
        } catch {
          setDbError('No se pudo registrar huella en el motor biométrico')
        }
      }

      // 3. Guardar en Supabase Storage como respaldo
      if (resultado?.captura && ranchoId && animal.score >= 0.85) {
        await registrarEmbedding({
          imageDataUrl: resultado.captura,
          animalId:     animal.id,
          ranchoId,
          userId:       authUserId,
          calidad:      animal.score,
        })
      }
    }

    currentCapturaIdRef.current = null
    setRegistrandoAnimal(null)
    setResultado(null)
    setPipeline(PIPELINE_BASE)
    refetchCapturas()
  }

  const handleNueva = () => {
    setResultado(null)
    setPipeline(PIPELINE_BASE)
    setRegistrandoAnimal(null)
    pendingNuevoCaptureRef.current = null
  }

  // ── Registrar captura 'nuevo' en animal existente sin nueva captura ───────
  const handleRegistrarExistingCapture = async (animal: AnimalContext) => {
    const imageDataUrl = pendingNuevoCaptureRef.current
    const modo         = pendingNuevoModoRef.current
    pendingNuevoCaptureRef.current = null
    const authUserId = await getAuthUserId()
    if (!authUserId || !ranchoId || !animal.id || !imageDataUrl) return

    const capturaId = currentCapturaIdRef.current
    if (capturaId) {
      const { error } = await confirmarCaptura({ capturaId, animalId: animal.id, userId: authUserId })
      if (error) setDbError(error)
    }
    try {
      const imgRes = await fetch(imageDataUrl)
      const blob   = await imgRes.blob()
      const form   = new FormData()
      form.append('image',     blob, 'morro.jpg')
      form.append('animal_id', animal.id)
      form.append('rancho_id', ranchoId)
      form.append('modo',      modo)
      await fetch(`${BACKEND_URL}/register`, { method: 'POST', body: form })
    } catch {
      setDbError('No se pudo registrar huella en el motor biométrico')
    }
    await registrarEmbedding({ imageDataUrl, animalId: animal.id, ranchoId, userId: authUserId, calidad: 0.85 })
    currentCapturaIdRef.current = null
    setResultado(null)
    setPipeline(PIPELINE_BASE)
    refetchCapturas()
  }

  const handleIniciarCaptura = (animal: AnimalContext) => {
    if (pendingNuevoCaptureRef.current && animal.id) {
      handleRegistrarExistingCapture(animal)
      return
    }
    setRegistrandoAnimal(animal)
    setResultado(null)
    setPipeline(PIPELINE_BASE)
    setActiveTab('identificar')
  }

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab)
    if (tab === 'estadisticas' || tab === 'registrar') refetchCapturas()
  }

  const handleCopiloAction = (actionId: string) => {
    const map: Partial<Record<string, () => void>> = {
      'nueva_captura': () => handleNueva(),
      'ver_historial': () => handleTabChange('estadisticas'),
      'modo_hoja':     () => handleNueva(),
    }
    map[actionId]?.()
  }

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-stone-50 dark:bg-[#0c0a09] flex flex-col z-50">

      {/* TOPBAR */}
      <div className="h-[52px] flex items-center px-5 border-b border-stone-200/70 dark:border-stone-800/60 bg-white dark:bg-[#1c1917] shrink-0 relative gap-4">
        <div className="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2FAF8F" strokeWidth="1.5" strokeLinecap="round" className="shrink-0">
            <circle cx="12" cy="12" r="3"/>
            <path d="M3 9V6a1 1 0 0 1 1-1h3"/><path d="M21 9V6a1 1 0 0 0-1-1h-3"/>
            <path d="M3 15v3a1 1 0 0 0 1 1h3"/><path d="M21 15v3a1 1 0 0 1-1 1h-3"/>
          </svg>
          <span className="text-[13px] font-bold text-stone-700 dark:text-stone-200">Biometría</span>
          <span className="hidden md:inline text-[12px] text-stone-300 dark:text-stone-600">·</span>
          <span className="hidden md:inline text-[12px] text-stone-400 dark:text-stone-500">Identificación bovina</span>
          {pendientes > 0 && (
            <span className="hidden md:inline text-[10px] font-medium text-amber-500 ml-1">
              · {pendientes} pendiente{pendientes > 1 ? 's' : ''}
            </span>
          )}
        </div>

        <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 gap-0.5 bg-stone-100 dark:bg-[#141210] border border-stone-200/70 dark:border-stone-800/60 rounded-[12px] p-[3px]">
          {TABS.map(tab => {
            const Icon   = tab.icon
            const active = activeTab === tab.id
            return (
              <button key={tab.id} onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-[9px] border-0 cursor-pointer text-[12px] transition-all ${
                  active
                    ? 'bg-white dark:bg-[#1c1917] text-stone-700 dark:text-stone-200 font-semibold shadow-sm'
                    : 'bg-transparent text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300'
                }`}
              ><Icon size={13} />{tab.label}</button>
            )
          })}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {dbError && (
            <button onClick={() => setDbError(null)} title={dbError}
              className="flex items-center gap-1 text-[10px] text-red-400 hover:text-red-600 transition-colors cursor-pointer bg-transparent border-0 px-1">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              DB error
            </button>
          )}
          <button onClick={onEscalate}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-[10px] border border-stone-200/70 dark:border-stone-800/60 bg-white dark:bg-[#1c1917] text-[12px] text-stone-400 dark:text-stone-500 cursor-pointer hover:text-[#2FAF8F] hover:border-[#2FAF8F]/40 transition-all">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/>
              <line x1="10" y1="14" x2="17" y2="7"/><line x1="4" y1="20" x2="11" y2="13"/>
            </svg>
            Espacio Gandia
          </button>
          <button onClick={onClose}
            className="px-3.5 py-1.5 rounded-[10px] border border-stone-200/70 dark:border-stone-800/60 bg-white dark:bg-[#1c1917] text-[12px] text-stone-400 dark:text-stone-500 cursor-pointer hover:text-stone-600 transition-colors">
            Chat
          </button>
        </div>
      </div>

      {/* BODY */}
      <div className="flex-1 flex min-h-0">

        {/* Zona central */}
        <div className="flex-1 flex flex-col p-4 md:p-6 overflow-y-auto gap-5 pb-20 md:pb-6
              [&::-webkit-scrollbar]:w-[3px] [&::-webkit-scrollbar-track]:bg-transparent
              [&::-webkit-scrollbar-thumb]:bg-stone-200 dark:[&::-webkit-scrollbar-thumb]:bg-stone-700/80
              [&::-webkit-scrollbar-thumb]:rounded-full">

          {activeTab === 'identificar' && (
            <div className={`flex flex-col ${resultado ? 'lg:flex-row' : ''} gap-5`}>
              <div className={resultado ? 'w-full lg:w-[400px] shrink-0' : 'w-full'}>
                <BiometriaCapturaWidget
                  onCaptura={handleCaptura}
                  compact
                  pipeline={pipeline}
                  processing={processing}
                  animalContext={registrandoAnimal ?? undefined}
                  ranchoId={ranchoId ?? undefined}
                  offlineQueue={offlineQueue.length}
                />
              </div>
              {resultado && (
                <div className="flex-1 flex flex-col gap-4 min-w-0">
                  <BiometriaResultadoWidget
                    resultado={resultado}
                    onConfirmar={handleConfirmar}
                    onRechazar={handleNueva}
                    onRegistrar={() => {
                      pendingNuevoCaptureRef.current = resultado.captura ?? null
                      pendingNuevoModoRef.current    = resultado.modo
                      handleTabChange('registrar')
                    }}
                    onNueva={handleNueva}
                  />
                </div>
              )}
            </div>
          )}

          {activeTab === 'estadisticas' && <BiometriaEstadisticasWidget registros={registros} />}
          {activeTab === 'registrar'    && <BiometriaRegistrarWidget onIniciarCaptura={handleIniciarCaptura} onRefetch={refetchCapturas} />}
          {activeTab === 'config'       && <BiometriaConfigWidget />}
        </div>

        {/* Panel historial fijo desktop */}
        <div className="hidden md:flex md:flex-col w-[320px] border-l border-stone-200/70 dark:border-stone-800/60 bg-white dark:bg-[#1c1917] p-4 shrink-0 overflow-hidden">
          <BiometriaHistorialWidget
            registros={registros}
            loading={loadingCapturas}
            onSelectRegistro={r => {
              if (r.resultado === 'candidato' && !r.confirmado) setActiveTab('identificar')
            }}
          />
        </div>
      </div>

      <CopiloAnima domain="biometria" onAction={handleCopiloAction} />

      {/* Bottom nav móvil */}
      <div className="md:hidden flex border-t border-stone-200/70 dark:border-stone-800/60 bg-white dark:bg-[#1c1917] shrink-0">
        {TABS.map(tab => {
          const Icon = tab.icon; const active = activeTab === tab.id
          return (
            <button key={tab.id} onClick={() => handleTabChange(tab.id)}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 border-0 cursor-pointer transition-all ${
                active ? 'text-[#2FAF8F]' : 'bg-transparent text-stone-400 dark:text-stone-500'}`}>
              <Icon size={18}/><span className="text-[9px] font-medium">{tab.label}</span>
            </button>
          )
        })}
        <button onClick={() => setShowCameraSheet(true)}
          className="relative flex-1 flex flex-col items-center gap-1 py-2.5 border-0 cursor-pointer transition-all text-stone-400 dark:text-stone-500 hover:text-[#2FAF8F] bg-transparent">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
          <span className="text-[9px] font-medium">Historial</span>
          {pendientes > 0 && <span className="absolute top-1.5 right-2 w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"/>}
        </button>
      </div>

      {/* Bottom sheet historial móvil */}
      {showCameraSheet && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={() => setShowCameraSheet(false)}/>
          <div className="relative bg-stone-50 dark:bg-[#0c0a09] rounded-t-[20px] overflow-hidden flex flex-col" style={{ maxHeight: '85vh' }}>
            <div className="flex items-center justify-between px-4 pt-3 pb-3 border-b border-stone-100 dark:border-stone-800/40 shrink-0">
              <div className="absolute left-1/2 -translate-x-1/2 top-2 w-10 h-1 rounded-full bg-stone-200 dark:bg-stone-700"/>
              <p className="text-[13px] font-semibold text-stone-800 dark:text-stone-100 mt-2">Historial del día</p>
              <button onClick={() => setShowCameraSheet(false)} className="mt-2 w-7 h-7 flex items-center justify-center rounded-full bg-stone-100 dark:bg-stone-800/60 text-stone-500 border-0 cursor-pointer">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto px-4 py-4 flex-1">
              <BiometriaHistorialWidget registros={registros} loading={loadingCapturas} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── ICONS ────────────────────────────────────────────────────────────────────

function MorroIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M3 9V6a1 1 0 0 1 1-1h3"/><path d="M21 9V6a1 1 0 0 0-1-1h-3"/>
      <path d="M3 15v3a1 1 0 0 0 1 1h3"/><path d="M21 15v3a1 1 0 0 1-1 1h-3"/>
    </svg>
  )
}
function PlusIcon({ size = 14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
}
function ChartIcon({ size = 14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
}
function ConfigIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  )
}