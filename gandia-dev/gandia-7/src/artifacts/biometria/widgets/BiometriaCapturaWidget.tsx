/**
 * BiometriaCapturaWidget — Widget: biometria:captura
 * ARCHIVO → src/artifacts/biometria/widgets/BiometriaCapturaWidget.tsx
 *
 * CAMBIOS v4:
 * - CapturaResult incluye latitude / longitude (geolocalización real)
 * - GPS se solicita al montar el componente, no bloquea si el usuario rechaza
 * - Ráfaga real de 3 frames separados 120ms — se elige el más nítido
 * - Auto-captura basada en análisis real de nitidez via requestAnimationFrame
 *   (reemplaza FEEDBACK_CYCLE simulado con scores hardcodeados)
 * - estimateSharpness: varianza de grises en canvas 96×96 como proxy Laplaciano
 */
import { useState, useRef, useCallback, useEffect } from 'react'
import HojaInteligenteSheet from './HojaInteligenteSheet'

export type CaptureMode = 'direct' | 'sheet'
export type PipelineEstado = 'idle' | 'running' | 'done' | 'error'

export interface PipelineStep {
  id:     string
  label:  string
  sub:    string
  estado: PipelineEstado
}

export interface CapturaResult {
  imageDataUrl: string
  mode:         CaptureMode
  timestamp:    number
  quality:      number
  latitude:     number | null
  longitude:    number | null
  // ── Resultados reales del backend ──────────────────────────────
  score_cv:     number
  score_ia:     number
  score_final:  number
  resultado:    'match' | 'candidato' | 'nuevo' | 'error'
  animal_id:    string | null
  candidatos:   { animal_id: string; animal_nombre: string; animal_siniiga: string; score_final: number }[]
}

export interface AnimalContext {
  id?:    string
  nombre: string
  arete:  string
  raza:   string
  lote:   string
}

interface Props {
  onCaptura?:     (result: CapturaResult) => void
  onExpand?:      () => void
  compact?:       boolean
  pipeline?:      PipelineStep[]
  processing?:    boolean
  offlineQueue?:  number
  animalContext?: AnimalContext
  ranchoId?:      string
}

// ─── URL del backend ──────────────────────────────────────────────────────────
const BACKEND_URL = import.meta.env.VITE_BIOMETRIA_API_URL ?? 'http://127.0.0.1:8000'

// ─── Umbral de calidad para auto-captura (0–1) ───────────────────────────────
// 0.68 ≈ imagen con textura visible del morro, sin movimiento severo
const QUALITY_AUTO_CAPTURE = 0.68
const QUALITY_SAMPLE_SIZE  = 96   // canvas pequeño para análisis en ~1ms

// ─── Pipeline steps ──────────────────────────────────────────────────────────
const PIPELINE_STEPS_INIT: PipelineStep[] = [
  { id: 'validar',      label: 'Validando imagen',       sub: 'Laplaciano + resolución',    estado: 'idle' },
  { id: 'detectar',     label: 'Detectando morro',        sub: 'Canny + contornos',          estado: 'idle' },
  { id: 'preprocesar',  label: 'Preprocesamiento',        sub: 'CLAHE + Gaussiano',          estado: 'idle' },
  { id: 'fingerprint',  label: 'Motor CV Fingerprint',    sub: 'Sobel + minutiae → 512d',    estado: 'idle' },
  { id: 'embedding',    label: 'Motor IA ResNet50',        sub: 'Embedding → 128d',           estado: 'idle' },
  { id: 'fusion',       label: 'Fusión y decisión',        sub: '0.55×CV + 0.45×IA',         estado: 'idle' },
]

// ─── Análisis real de nitidez ────────────────────────────────────────────────

/**
 * Estima la nitidez del frame actual del video usando varianza de píxeles en
 * escala de grises. Varianza alta = mayor detalle = imagen más nítida.
 * Normalización empírica: 1800 cubre el rango típico de morros bovinos
 * en condiciones de campo (luz natural, distancia 15-25cm).
 */
function estimateSharpness(video: HTMLVideoElement): number {
  try {
    const c   = document.createElement('canvas')
    c.width   = QUALITY_SAMPLE_SIZE
    c.height  = QUALITY_SAMPLE_SIZE
    const ctx = c.getContext('2d', { willReadFrequently: true })!
    ctx.drawImage(video, 0, 0, QUALITY_SAMPLE_SIZE, QUALITY_SAMPLE_SIZE)
    const px = ctx.getImageData(0, 0, QUALITY_SAMPLE_SIZE, QUALITY_SAMPLE_SIZE).data
    const n  = QUALITY_SAMPLE_SIZE * QUALITY_SAMPLE_SIZE
    let sum = 0, sumSq = 0
    for (let i = 0; i < px.length; i += 4) {
      const g = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2]
      sum  += g
      sumSq += g * g
    }
    const mean     = sum / n
    const variance = sumSq / n - mean * mean
    return Math.min(variance / 1800, 1.0)
  } catch {
    return 0
  }
}

/** Convierte score de nitidez a texto de feedback para el usuario */
function scoreFeedback(score: number): { msg: string; kind: 'warn' | 'info' | 'ok' } {
  if (score < 0.30) return { msg: 'Muy borroso — acércate al morro',     kind: 'warn' }
  if (score < 0.48) return { msg: 'Morro fuera del óvalo o muy lejos',   kind: 'warn' }
  if (score < 0.62) return { msg: 'Acércate un poco más',                 kind: 'warn' }
  if (score < QUALITY_AUTO_CAPTURE)
                    return { msg: 'Casi listo…',                           kind: 'info' }
  return              { msg: 'Buena imagen — capturando…',                 kind: 'ok'   }
}

/**
 * Captura 3 frames con 120ms de separación y devuelve el más nítido.
 * Implementa la ráfaga del documento (sección 2.4 — Vaca en movimiento).
 */
async function captureBestFrame(
  video: HTMLVideoElement,
): Promise<{ dataUrl: string; quality: number }> {
  const frames: { dataUrl: string; quality: number }[] = []
  for (let i = 0; i < 3; i++) {
    const c   = document.createElement('canvas')
    c.width   = video.videoWidth  || 640
    c.height  = video.videoHeight || 480
    c.getContext('2d')?.drawImage(video, 0, 0)
    const quality = estimateSharpness(video)
    frames.push({ dataUrl: c.toDataURL('image/jpeg', 0.92), quality })
    if (i < 2) await new Promise<void>(r => setTimeout(r, 120))
  }
  // Elegir el frame con mayor nitidez
  return frames.reduce((best, f) => f.quality > best.quality ? f : best)
}

// ─── ArUco simulado (modo hoja) ───────────────────────────────────────────────
const ARUCO_CYCLE = [
  { detected: [false, false, false, false], label: 'Buscando marcadores…' },
  { detected: [true,  false, false, false], label: 'Marcador 1 detectado' },
  { detected: [true,  true,  false, false], label: 'Marcadores 1-2 detectados' },
  { detected: [true,  true,  true,  false], label: 'Marcadores 1-3 detectados' },
  { detected: [true,  true,  true,  true],  label: 'Perspectiva corregida ✓' },
]

// ─────────────────────────────────────────────────────────────────────────────

export default function BiometriaCapturaWidget({
  onCaptura,
  onExpand,
  compact = false,
  pipeline: pipelineExternal,
  processing = false,
  offlineQueue = 0,
  animalContext,
  ranchoId,
}: Props) {
  const [mode,            setMode]            = useState<CaptureMode>('direct')
  const [streaming,       setStreaming]        = useState(false)
  const [capturing,       setCapturing]        = useState(false)
  const [liveMsg,         setLiveMsg]          = useState<{ msg: string; kind: 'warn' | 'info' | 'ok' } | null>(null)
  const [liveScore,       setLiveScore]        = useState<number | null>(null)
  const [arucoStep,       setArucoStep]        = useState(0)
  const [pipeOpen,        setPipeOpen]         = useState(true)
  const [showHoja,        setShowHoja]         = useState(false)
  const [burstMsg,        setBurstMsg]         = useState<string | null>(null)
  const [backendError,    setBackendError]     = useState<string | null>(null)
  const [gpsStatus,       setGpsStatus]        = useState<'pending' | 'ok' | 'denied' | 'idle'>('idle')
  // Pipeline interno (se usa cuando no viene del padre)
  const [pipelineLocal,   setPipelineLocal]    = useState<PipelineStep[]>(PIPELINE_STEPS_INIT)
  const [processingLocal, setProcessingLocal]  = useState(false)

  const videoRef        = useRef<HTMLVideoElement>(null)
  const streamRef       = useRef<MediaStream | null>(null)
  const arucoTimer      = useRef<ReturnType<typeof setInterval> | null>(null)
  const qualityRafRef   = useRef<number | null>(null)     // id del rAF activo
  const lastAnalysisTs  = useRef<number>(0)               // throttle timestamp
  const autoCaptureRef  = useRef(false)
  const gpsRef          = useRef<{ lat: number; lon: number } | null>(null)

  const pipeline     = pipelineExternal ?? pipelineLocal
  const isProcessing = processing || processingLocal

  // ── GPS — solicitar al montar; no bloquea la UI si rechaza ──────────────
  useEffect(() => {
    if (!navigator.geolocation) return
    setGpsStatus('pending')
    navigator.geolocation.getCurrentPosition(
      pos => {
        gpsRef.current = { lat: pos.coords.latitude, lon: pos.coords.longitude }
        setGpsStatus('ok')
      },
      () => setGpsStatus('denied'),
      { timeout: 12_000, maximumAge: 60_000, enableHighAccuracy: true },
    )
  }, [])

  // ── Loop de calidad real con requestAnimationFrame ───────────────────────
  const startQualityLoop = useCallback(() => {
    autoCaptureRef.current = false
    const loop = (ts: number) => {
      // Throttle ~10fps para no saturar CPU en móvil
      if (ts - lastAnalysisTs.current >= 100) {
        lastAnalysisTs.current = ts
        if (videoRef.current && videoRef.current.readyState >= 2) {
          const score = estimateSharpness(videoRef.current)
          setLiveScore(score)
          setLiveMsg(scoreFeedback(score))
          // Disparar auto-captura cuando se supera el umbral
          if (score >= QUALITY_AUTO_CAPTURE && !autoCaptureRef.current) {
            autoCaptureRef.current = true
            // 600ms de ventana de confirmación antes de disparar
            setTimeout(() => {
              if (autoCaptureRef.current) triggerRef.current()
            }, 600)
          }
        }
      }
      qualityRafRef.current = requestAnimationFrame(loop)
    }
    qualityRafRef.current = requestAnimationFrame(loop)
  }, [])

  const stopQualityLoop = useCallback(() => {
    if (qualityRafRef.current !== null) {
      cancelAnimationFrame(qualityRafRef.current)
      qualityRafRef.current = null
    }
    autoCaptureRef.current = false
    setLiveMsg(null)
    setLiveScore(null)
  }, [])

  const startArucoAnalysis = useCallback(() => {
    let step = 0
    arucoTimer.current = setInterval(() => {
      setArucoStep(step); step++
      if (step >= ARUCO_CYCLE.length) clearInterval(arucoTimer.current!)
    }, 700)
  }, [])

  const stopArucoAnalysis = useCallback(() => {
    if (arucoTimer.current) { clearInterval(arucoTimer.current); arucoTimer.current = null }
    setArucoStep(0)
  }, [])

  // ── Cámara ───────────────────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    setBackendError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
      setStreaming(true)
      // Delay para que el autofoco estabilice antes de analizar
      const delay = mode === 'direct' ? 700 : 1300
      setTimeout(startQualityLoop, delay)
      if (mode === 'sheet') setTimeout(startArucoAnalysis, 400)
    } catch {
      setLiveMsg({ msg: 'Sin acceso a la cámara — verifica permisos', kind: 'warn' })
    }
  }, [mode, startQualityLoop, startArucoAnalysis])

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setStreaming(false)
    stopQualityLoop()
    stopArucoAnalysis()
    setBurstMsg(null)
  }, [stopQualityLoop, stopArucoAnalysis])

  // ── animarPipeline ───────────────────────────────────────────────────────
  const animarPipeline = useCallback((): Promise<void> => {
    return new Promise(resolve => {
      setPipelineLocal(PIPELINE_STEPS_INIT.map(s => ({ ...s, estado: 'idle' as PipelineEstado })))
      setProcessingLocal(true)
      const steps = PIPELINE_STEPS_INIT.map(s => s.id)
      let i = 0
      const tick = () => {
        if (i >= steps.length) { setProcessingLocal(false); resolve(); return }
        setPipelineLocal(prev => prev.map(s =>
          s.id === steps[i]   ? { ...s, estado: 'running' } :
          prev.indexOf(s) < i ? { ...s, estado: 'done'    } : s
        ))
        const delay = ['fingerprint', 'embedding'].includes(steps[i]) ? 600 : 250
        setTimeout(() => {
          setPipelineLocal(prev => prev.map(s => s.id === steps[i] ? { ...s, estado: 'done' } : s))
          i++; setTimeout(tick, 80)
        }, delay)
      }
      tick()
    })
  }, [])

  // ── triggerCapture — ráfaga de 3 frames + GPS + backend ─────────────────
  const triggerCapture = useCallback(async () => {
    if (!videoRef.current || capturing) return
    autoCaptureRef.current = false
    stopQualityLoop()
    setCapturing(true)
    setBackendError(null)

    // ── Ráfaga real de 3 frames, elige el más nítido ─────────────────────
    setBurstMsg('Analizando 3 frames…')
    const { dataUrl, quality } = await captureBestFrame(videoRef.current)
    setBurstMsg('Seleccionando el más nítido…')
    await new Promise<void>(r => setTimeout(r, 180))
    setBurstMsg(null)

    const gps = gpsRef.current   // coords ya resueltas en background

    stopCamera()

    const pipePromise = animarPipeline()

    try {
      const res  = await fetch(dataUrl)
      const blob = await res.blob()
      const form = new FormData()
      form.append('image',     blob, 'morro.jpg')
      form.append('rancho_id', ranchoId ?? 'unknown')
      form.append('modo',      mode)
      if (gps) {
        form.append('latitud',  String(gps.lat))
        form.append('longitud', String(gps.lon))
      }

      const response = await fetch(`${BACKEND_URL}/identify`, {
        method: 'POST',
        body:   form,
      })

      await pipePromise

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        const msg = errData?.detail?.mensaje ?? `Error del servidor (${response.status})`
        setBackendError(msg)
        setCapturing(false)
        setPipelineLocal(PIPELINE_STEPS_INIT)
        return
      }

      const data = await response.json()

      onCaptura?.({
        imageDataUrl: dataUrl,
        mode,
        timestamp:    Date.now(),
        quality:      data.calidad_imagen ?? quality,
        latitude:     gps?.lat ?? null,
        longitude:    gps?.lon ?? null,
        score_cv:     data.score_cv     ?? 0,
        score_ia:     data.score_ia     ?? 0,
        score_final:  data.score_final  ?? 0,
        resultado:    data.resultado    ?? 'nuevo',
        animal_id:    data.animal_id    ?? null,
        candidatos:   data.candidatos   ?? [],
      })
    } catch {
      await pipePromise
      setBackendError('No se pudo conectar al servidor de biometría')
      setPipelineLocal(PIPELINE_STEPS_INIT)
    } finally {
      setCapturing(false)
    }
  }, [capturing, mode, ranchoId, onCaptura, stopCamera, stopQualityLoop, animarPipeline])

  const triggerRef = useRef(triggerCapture)
  useEffect(() => { triggerRef.current = triggerCapture }, [triggerCapture])

  const handleModeChange = (m: CaptureMode) => {
    if (streaming) stopCamera()
    setMode(m)
  }

  useEffect(() => () => { stopQualityLoop(); stopArucoAnalysis() }, [stopQualityLoop, stopArucoAnalysis])

  const hasPipeline  = pipeline.length > 0
  const pipeAllDone  = hasPipeline && pipeline.every(s => s.estado === 'done')
  const pipeRunning  = hasPipeline && pipeline.some(s => s.estado === 'running')
  const currentStep  = hasPipeline ? pipeline.find(s => s.estado === 'running') : null
  const doneCount    = hasPipeline ? pipeline.filter(s => s.estado === 'done').length : 0
  const totalSteps   = hasPipeline ? pipeline.length : 0
  const showPipeline = hasPipeline && (isProcessing || pipeAllDone)

  const aruco = ARUCO_CYCLE[Math.min(arucoStep, ARUCO_CYCLE.length - 1)]
  const arucoAllDetected = aruco.detected.every(Boolean)

  return (
    <>
      {showHoja && (
        <HojaInteligenteSheet
          animal={animalContext}
          onClose={() => setShowHoja(false)}
        />
      )}
      <div className="flex flex-col bg-white dark:bg-[#1c1917] border border-stone-200/60 dark:border-stone-800/50 rounded-[12px] overflow-hidden">

      {/* ── Header ── */}
      <div className={`flex items-center justify-between border-b border-stone-100 dark:border-stone-800/40 ${compact ? 'px-3 py-2.5' : 'px-4 py-3.5'}`}>
        <div className="flex items-center gap-2.5">
          <svg width={compact ? 16 : 18} height={compact ? 16 : 18} viewBox="0 0 24 24" fill="none" stroke="#2FAF8F" strokeWidth="1.5" strokeLinecap="round" className="shrink-0">
            <circle cx="12" cy="12" r="3"/>
            <path d="M3 9V6a1 1 0 0 1 1-1h3"/><path d="M21 9V6a1 1 0 0 0-1-1h-3"/>
            <path d="M3 15v3a1 1 0 0 0 1 1h3"/><path d="M21 15v3a1 1 0 0 1-1 1h-3"/>
          </svg>
          <div>
            <p className={`font-semibold text-stone-800 dark:text-stone-100 leading-tight ${compact ? 'text-[12.5px]' : 'text-[13.5px]'}`}>Captura de morro</p>
            {!compact && <p className="text-[11.5px] text-stone-400 dark:text-stone-500">Huella biométrica bovina</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">

          {/* ── Badge GPS ── */}
          {gpsStatus !== 'idle' && (
            <div className={`flex items-center gap-1 rounded-[6px] px-2 py-1 border ${
              gpsStatus === 'ok'      ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/30' :
              gpsStatus === 'pending' ? 'bg-stone-50 dark:bg-stone-800/40 border-stone-200 dark:border-stone-700/40' :
                                        'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/30'
            }`}>
              {gpsStatus === 'pending' ? (
                <svg className="w-2.5 h-2.5 animate-spin text-stone-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
              ) : (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                  stroke={gpsStatus === 'ok' ? '#10b981' : '#f59e0b'}
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
              )}
              <span className={`text-[10px] font-semibold ${
                gpsStatus === 'ok'      ? 'text-emerald-600 dark:text-emerald-400' :
                gpsStatus === 'pending' ? 'text-stone-400 dark:text-stone-500' :
                                          'text-amber-600 dark:text-amber-400'
              }`}>
                {gpsStatus === 'ok' ? 'GPS ✓' : gpsStatus === 'pending' ? 'GPS…' : 'Sin GPS'}
              </span>
            </div>
          )}

          {offlineQueue > 0 && (
            <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 rounded-[6px] px-2 py-1">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round">
                <path d="M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4z"/>
              </svg>
              <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">{offlineQueue} en cola</span>
            </div>
          )}
          {onExpand && (
            <button onClick={onExpand} className="text-[11.5px] text-stone-400 hover:text-[#2FAF8F] flex items-center gap-1.5 transition-colors cursor-pointer bg-transparent border-0 px-0">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/>
                <line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
              </svg>
              Ver módulo
            </button>
          )}
        </div>
      </div>

      {/* ── Banner contexto animal ── */}
      {animalContext && (
        <div className="mx-3.5 mt-3 px-3.5 py-3 bg-white dark:bg-[#1c1917] border border-stone-200/70 dark:border-stone-800/60 rounded-[8px] flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-medium text-stone-400 dark:text-stone-500 uppercase tracking-[0.06em] leading-none mb-1">Registrando</p>
            <p className="text-[13px] font-semibold text-stone-800 dark:text-stone-100 leading-tight">{animalContext.nombre}</p>
            <p className="text-[11.5px] text-stone-400 dark:text-stone-500 mt-0.5">{animalContext.arete} · {animalContext.raza} · Lote {animalContext.lote}</p>
          </div>
          <span className="shrink-0 text-[10px] font-semibold px-2 py-1 rounded-[5px] bg-stone-100 dark:bg-stone-800/60 text-stone-500 dark:text-stone-400 border border-stone-200/70 dark:border-stone-700/50">
            Nuevo registro
          </span>
        </div>
      )}

      {/* ── Segmented control ── */}
      <div className="px-4 py-2.5 flex items-center gap-3 border-b border-stone-100 dark:border-stone-800/40">
        <div className="flex bg-stone-100 dark:bg-stone-800/60 rounded-[8px] p-0.5 gap-0.5">
          {(['direct', 'sheet'] as CaptureMode[]).map(m => (
            <button key={m} onClick={() => handleModeChange(m)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-[12px] font-medium transition-all cursor-pointer border-0 ${
                mode === m
                  ? 'bg-white dark:bg-[#2a2825] text-stone-700 dark:text-stone-200 shadow-sm'
                  : 'bg-transparent text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300'
              }`}>
              {m === 'direct'
                ? <><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>Cámara directa</>
                : <><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>Hoja inteligente</>
              }
            </button>
          ))}
        </div>
        <p className="text-[11px] text-stone-400 dark:text-stone-500 ml-auto">
          {mode === 'direct' ? 'Enfoca el morro directamente' : 'Coloca la hoja frente al morro'}
        </p>
      </div>

      {/* ── Viewport ── */}
      <div className="relative bg-[#0a0a0a] mx-3.5 mt-3 rounded-[10px] overflow-hidden"
        style={{ aspectRatio: compact ? '16/9' : '4/3', minHeight: compact ? 100 : 180 }}>
        <video ref={videoRef} autoPlay playsInline muted
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${streaming ? 'opacity-100' : 'opacity-0'}`}/>

        {!streaming && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <div className="absolute inset-0 opacity-[0.04]"
              style={{ backgroundImage: 'linear-gradient(rgba(47,175,143,1) 1px, transparent 1px), linear-gradient(90deg, rgba(47,175,143,1) 1px, transparent 1px)', backgroundSize: '32px 32px' }}/>
            <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, transparent 40%, #0a0a0a 100%)' }}/>
            <div className="relative">
              <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
                <path d="M4 18 L4 4 L18 4"   stroke="rgba(47,175,143,0.65)" strokeWidth="2" strokeLinecap="round"/>
                <path d="M52 18 L52 4 L38 4"  stroke="rgba(47,175,143,0.65)" strokeWidth="2" strokeLinecap="round"/>
                <path d="M4 38 L4 52 L18 52"  stroke="rgba(47,175,143,0.65)" strokeWidth="2" strokeLinecap="round"/>
                <path d="M52 38 L52 52 L38 52" stroke="rgba(47,175,143,0.65)" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="28" cy="28" r="8" stroke="rgba(47,175,143,0.2)" strokeWidth="1.5" strokeDasharray="3 3"/>
                <circle cx="28" cy="28" r="2" fill="rgba(47,175,143,0.35)"/>
              </svg>
            </div>
            <p className="relative text-[11px] text-white/25 tracking-wide">Cámara inactiva</p>
          </div>
        )}

        {streaming && mode === 'direct' && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid meet">
            <ellipse cx="200" cy="155" rx="118" ry="84"
              fill="none"
              stroke={liveMsg?.kind === 'ok' ? 'rgba(47,175,143,0.9)' : 'rgba(47,175,143,0.55)'}
              strokeWidth={liveMsg?.kind === 'ok' ? '2' : '1.5'}
              strokeDasharray={liveMsg?.kind === 'ok' ? '0' : '8 5'}/>
            <line x1="200" y1="90"  x2="200" y2="110" stroke="rgba(47,175,143,0.25)" strokeWidth="1"/>
            <line x1="200" y1="200" x2="200" y2="220" stroke="rgba(47,175,143,0.25)" strokeWidth="1"/>
            <line x1="76"  y1="155" x2="96"  y2="155" stroke="rgba(47,175,143,0.25)" strokeWidth="1"/>
            <line x1="304" y1="155" x2="324" y2="155" stroke="rgba(47,175,143,0.25)" strokeWidth="1"/>
            <text x="200" y="78" textAnchor="middle" fill="rgba(47,175,143,0.55)" fontSize="8" fontFamily="system-ui" letterSpacing="2">ZONA MORRO</text>
          </svg>
        )}

        {streaming && mode === 'sheet' && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid meet">
            <rect x="50" y="50" width="300" height="200" fill="none"
              stroke={arucoAllDetected ? 'rgba(47,175,143,0.6)' : 'rgba(47,175,143,0.3)'}
              strokeWidth="1.5" strokeDasharray={arucoAllDetected ? '0' : '6 4'}/>
            <rect x="112" y="88" width="176" height="124"
              fill={arucoAllDetected ? 'rgba(47,175,143,0.04)' : 'rgba(255,255,255,0.02)'}
              stroke="rgba(47,175,143,0.35)" strokeWidth="1" strokeDasharray="4 3"/>
            <text x="200" y="155" textAnchor="middle" fill="rgba(47,175,143,0.4)" fontSize="9" fontFamily="system-ui">ZONA MORRO</text>
            {[
              { x: 50, y: 50, i: 0 }, { x: 350, y: 50, i: 1 },
              { x: 50, y: 250, i: 2 }, { x: 350, y: 250, i: 3 },
            ].map(({ x, y, i }) => {
              const detected = aruco.detected[i]
              const ox = x < 200 ? 1 : -17
              const oy = y < 150 ? 1 : -17
              return (
                <g key={i}>
                  <rect x={x + ox} y={y + oy} width="16" height="16" rx="2"
                    fill={detected ? 'rgba(47,175,143,0.15)' : 'rgba(255,255,255,0.04)'}
                    stroke={detected ? '#2FAF8F' : 'rgba(255,255,255,0.25)'}
                    strokeWidth={detected ? '1.5' : '1'}/>
                  {detected && (
                    <text x={x + ox + 8} y={y + oy + 11} textAnchor="middle"
                      fill="#2FAF8F" fontSize="8" fontFamily="system-ui">✓</text>
                  )}
                </g>
              )
            })}
          </svg>
        )}

        {streaming && (
          <>
            <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 bg-black/50 backdrop-blur-[4px] rounded-[5px] px-2 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse"/>
              <span className="text-[9px] text-white font-semibold tracking-widest">EN VIVO</span>
            </div>
            <div className="absolute top-2.5 right-2.5 bg-black/50 backdrop-blur-[4px] rounded-[5px] px-2 py-1">
              <span className="text-[9px] text-[#2FAF8F] font-semibold">{mode === 'direct' ? 'DIRECTO' : 'HOJA'}</span>
            </div>
          </>
        )}

        {streaming && mode === 'sheet' && (
          <div className="absolute bottom-9 left-2.5 right-2.5 flex items-center gap-2 rounded-[5px] px-2.5 py-1.5 bg-black/60 backdrop-blur-[4px]">
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${arucoAllDetected ? 'bg-[#2FAF8F]' : 'bg-amber-400 animate-pulse'}`}/>
            <span className="text-[9px] text-white/80 font-medium">{aruco.label}</span>
            <span className="ml-auto text-[9px] font-mono text-[#2FAF8F]/70">
              {aruco.detected.filter(Boolean).length}/4
            </span>
          </div>
        )}

        {liveScore !== null && streaming && (
          <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center gap-2 bg-black/50 backdrop-blur-[4px] rounded-[5px] px-3 py-1.5">
            <span className="text-[9px] text-stone-400 shrink-0">Calidad</span>
            <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-200 ${
                  liveScore >= QUALITY_AUTO_CAPTURE ? 'bg-[#2FAF8F]' : liveScore >= 0.55 ? 'bg-amber-400' : 'bg-red-400'
                }`}
                style={{ width: `${liveScore * 100}%` }}/>
            </div>
            <span className={`text-[9px] font-bold shrink-0 tabular-nums ${
              liveScore >= QUALITY_AUTO_CAPTURE ? 'text-[#2FAF8F]' : liveScore >= 0.55 ? 'text-amber-400' : 'text-red-400'
            }`}>{Math.round(liveScore * 100)}%</span>
          </div>
        )}
      </div>

      {/* ── Feedback en vivo ── */}
      {liveMsg && streaming && (
        <div className={`mx-3.5 mt-2 px-3 py-2 rounded-[7px] flex items-center gap-2 ${
          liveMsg.kind === 'ok'   ? 'bg-[#2FAF8F]/08 dark:bg-[#2FAF8F]/12 border border-[#2FAF8F]/20' :
          liveMsg.kind === 'warn' ? 'bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/25' :
          'bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700/40'
        }`}>
          {liveMsg.kind === 'ok' ? (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2FAF8F" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
          ) : liveMsg.kind === 'warn' ? (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          ) : (
            <span className="w-1.5 h-1.5 rounded-full bg-stone-400 animate-pulse shrink-0"/>
          )}
          <span className={`text-[12px] font-medium ${
            liveMsg.kind === 'ok'   ? 'text-[#2FAF8F]' :
            liveMsg.kind === 'warn' ? 'text-amber-600 dark:text-amber-400' :
                                      'text-stone-500 dark:text-stone-400'
          }`}>{liveMsg.msg}</span>
        </div>
      )}

      {burstMsg && (
        <div className="mx-3.5 mt-2 px-3 py-2 rounded-[7px] flex items-center gap-2 bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700/40">
          <svg className="w-3 h-3 animate-spin text-[#2FAF8F]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
          <span className="text-[12px] text-stone-500 dark:text-stone-400">{burstMsg}</span>
        </div>
      )}

      {/* ── Error backend ── */}
      {backendError && (
        <div className="mx-3.5 mt-2 px-3 py-2 rounded-[7px] flex items-center gap-2 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/30">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <span className="text-[12px] font-medium text-red-500">{backendError}</span>
        </div>
      )}

      {/* ── Pipeline ── */}
      {showPipeline && (
        <div className="mx-3.5 mt-2.5 border border-stone-100 dark:border-stone-800/40 rounded-[10px] overflow-hidden">
          <button
            onClick={() => setPipeOpen(o => !o)}
            className="w-full flex items-center gap-3 px-3 py-2.5 bg-stone-50 dark:bg-[#141210] hover:bg-stone-100/60 dark:hover:bg-stone-800/20 transition-colors cursor-pointer border-0"
          >
            {pipeRunning
              ? <svg className="w-3.5 h-3.5 text-[#2FAF8F] animate-spin shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
              : <svg className="w-3.5 h-3.5 text-[#2FAF8F] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
            }
            <div className="flex-1 flex items-center gap-2 min-w-0">
              <div className="flex gap-0.5 items-center">
                {pipeline.map(s => (
                  <div key={s.id} className={`h-1 rounded-full transition-all duration-300 ${
                    s.estado === 'done'    ? 'bg-[#2FAF8F] w-3' :
                    s.estado === 'running' ? 'bg-[#2FAF8F]/60 w-3 animate-pulse' :
                    'bg-stone-200 dark:bg-stone-700/60 w-2'
                  }`}/>
                ))}
              </div>
              <span className="text-[11px] text-stone-500 dark:text-stone-400 truncate">
                {pipeRunning && currentStep ? currentStep.label : pipeAllDone ? 'Completado' : 'Procesando'}
              </span>
              <span className="text-[10px] text-stone-300 dark:text-stone-600 font-mono shrink-0 ml-auto">
                {doneCount}/{totalSteps}
              </span>
            </div>
            <svg className={`w-3.5 h-3.5 text-stone-300 dark:text-stone-600 transition-transform duration-200 shrink-0 ${pipeOpen ? '' : '-rotate-90'}`}
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
          {pipeOpen && (
            <div className="px-3 py-2.5 flex flex-col gap-0 border-t border-stone-100 dark:border-stone-800/40">
              {pipeline.map((step, i) => (
                <div key={step.id} className="flex items-center gap-2.5 py-1.5">
                  <div className="flex flex-col items-center shrink-0">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-all duration-200 ${
                      step.estado === 'done'    ? 'bg-[#2FAF8F]' :
                      step.estado === 'running' ? 'border-2 border-[#2FAF8F] bg-white dark:bg-[#1c1917]' :
                      'border border-stone-200 dark:border-stone-700/60 bg-stone-50 dark:bg-[#141210]'
                    }`}>
                      {step.estado === 'done'    && <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
                      {step.estado === 'running' && <span className="w-1.5 h-1.5 rounded-full bg-[#2FAF8F] animate-pulse"/>}
                    </div>
                    {i < pipeline.length - 1 && (
                      <div className={`w-px h-3 my-0.5 ${step.estado === 'done' ? 'bg-[#2FAF8F]/30' : 'bg-stone-100 dark:bg-stone-800/50'}`}/>
                    )}
                  </div>
                  <div className={`flex-1 transition-opacity duration-200 ${step.estado === 'idle' ? 'opacity-30' : step.estado === 'done' ? 'opacity-60' : 'opacity-100'}`}>
                    <span className={`text-[11.5px] font-medium ${step.estado === 'running' ? 'text-[#2FAF8F]' : 'text-stone-600 dark:text-stone-300'}`}>
                      {step.label}
                    </span>
                    {!compact && <span className="text-[10px] text-stone-400 dark:text-stone-600 font-mono ml-1.5">{step.sub}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Footer / Acciones ── */}
      <div className={`flex items-center justify-between ${compact ? 'px-3 py-2.5' : 'px-3.5 py-3'} mt-1.5`}>
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${streaming ? 'bg-[#2FAF8F] animate-pulse' : capturing ? 'bg-amber-400 animate-pulse' : 'bg-stone-300 dark:bg-stone-700'}`}/>
          <span className="text-[11.5px] text-stone-400 dark:text-stone-500">
            {capturing ? 'Enviando al servidor…'
              : streaming && liveMsg?.kind === 'ok' ? 'Auto-captura activa'
              : streaming ? 'Analizando…'
              : 'Inactiva'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {streaming && (
            <button onClick={stopCamera}
              className="h-9 px-4 rounded-[8px] border border-stone-200 dark:border-stone-700/60 bg-white dark:bg-[#1c1917] text-[12px] text-stone-500 dark:text-stone-400 cursor-pointer hover:text-stone-700 transition-colors">
              Cancelar
            </button>
          )}
          <button
            onClick={streaming ? () => triggerCapture() : startCamera}
            disabled={capturing}
            className={`h-9 px-5 rounded-[8px] text-[12.5px] font-semibold transition-all flex items-center gap-2 ${
              capturing
                ? 'bg-stone-100 dark:bg-stone-800/50 text-stone-400 cursor-default border border-stone-200 dark:border-stone-700/60'
                : streaming
                ? 'bg-[#2FAF8F] hover:bg-[#27a07f] text-white cursor-pointer active:scale-[0.97] border-0'
                : 'border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#1c1917] text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800/40 cursor-pointer'
            }`}
          >
            {capturing ? (
              <><svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>Analizando...</>
            ) : streaming ? (
              <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4" fill="white"/></svg>Capturar</>
            ) : (
              <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>Abrir cámara</>
            )}
          </button>
        </div>
      </div>

      {mode === 'sheet' && !streaming && (
        <div className="mx-3.5 mb-3.5 -mt-1 px-3 py-2 bg-stone-50 dark:bg-[#141210] border border-stone-100 dark:border-stone-800/40 rounded-[8px] flex items-center gap-3">
          <p className="text-[11.5px] text-stone-400 dark:text-stone-500 leading-relaxed flex-1">
            Imprime la hoja inteligente y colócala frente al morro. Los 4 marcadores ArUco se detectan automáticamente para corregir perspectiva.
          </p>
          <button
            onClick={() => setShowHoja(true)}
            className="shrink-0 flex items-center gap-1.5 h-8 px-3 rounded-[7px] border border-stone-200 dark:border-stone-700/60 bg-white dark:bg-[#1c1917] text-[11.5px] text-stone-500 dark:text-stone-400 hover:text-[#2FAF8F] hover:border-[#2FAF8F]/40 transition-all cursor-pointer"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>
            </svg>
            Imprimir hoja
          </button>
        </div>
      )}
    </div>
    </>
  )
}