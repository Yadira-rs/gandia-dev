/**
 * BiometriaModulo.tsx — Nivel Módulo del dominio Biometría CON DB REAL
 * ARCHIVO → src/artifacts/biometria/BiometriaModulo.tsx
 *
 * CAMBIOS vs mock:
 *   - useBiometriaCapturas() para historial real
 *   - registrarCaptura()   → persiste cada escaneo en BD + Storage
 *   - confirmarCaptura()   → confirma en BD (trigger actualiza biometria_status)
 *   - registrarEmbedding() → guarda imagen de referencia
 *   - useRanchoId() + getAuthUserId() para autenticación
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { useUser }       from '../../context/UserContext'
import { useRanchoId, getAuthUserId } from '../../hooks/useAnimales'
import { supabase }      from '../../lib/supabaseClient'
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

import BiometriaCapturaWidget,   { type CapturaResult }       from './widgets/BiometriaCapturaWidget'
import BiometriaResultadoWidget, { type BiometriaResultado,
                                   type AnimalMatch }          from './widgets/BiometriaResultadoWidget'
import BiometriaHistorialWidget                                from './widgets/BiometriaHistorialWidget'
import BiometriaEstadisticasWidget                             from './widgets/BiometriaEstadisticasWidget'
import BiometriaConfigWidget                                   from './widgets/BiometriaConfigWidget'
import BiometriaRegistrarWidget                                from './widgets/BiometriaRegistrarWidget'
import type { AnimalContext } from './widgets/BiometriaCapturaWidget'

// ─── TIPOS ────────────────────────────────────────────────────────────────────

type ModuleWidget =
  | 'biometria:captura'
  | 'biometria:resultado'
  | 'biometria:historial'
  | 'biometria:registrar'
  | 'biometria:estadisticas'
  | 'biometria:config'

type Tab = 'captura' | 'historial' | 'registrar' | 'estadisticas' | 'config'

interface Props {
  onClose:    () => void
  onEscalate: () => void
}

const BACKEND_URL = import.meta.env.VITE_BIOMETRIA_API_URL ?? 'http://127.0.0.1:8000'

// ─── Helper: obtener datos completos de un animal desde Supabase ──────────────

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

const TAB_DEFAULT: Record<Tab, ModuleWidget> = {
  captura:      'biometria:captura',
  historial:    'biometria:historial',
  registrar:    'biometria:registrar',
  estadisticas: 'biometria:estadisticas',
  config:       'biometria:config',
}

const TABS: { id: Tab; label: string }[] = [
  { id: 'captura',      label: 'Captura'      },
  { id: 'historial',    label: 'Historial'    },
  { id: 'registrar',    label: 'Registrar'    },
  { id: 'estadisticas', label: 'Estadísticas' },
  { id: 'config',       label: 'Config'       },
]

// ─── COMPONENTE ───────────────────────────────────────────────────────────────

export default function BiometriaModulo({ onClose, onEscalate }: Props) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const { profile }    = useUser()
  const userId         = profile?.user_id ?? null
  const { ranchoId }   = useRanchoId(userId)

  // ── Datos reales ──────────────────────────────────────────────────────────
  const { capturas, loading: loadingCapturas, refetch: refetchCapturas } = useBiometriaCapturas(ranchoId)
  const registros: RegistroCaptura[] = capturas.map(dbToRegistro)

  // ── Estado local ──────────────────────────────────────────────────────────
  const [activeTab,          setActiveTab]          = useState<Tab>('captura')
  const [activeWidget,       setActiveWidget]       = useState<ModuleWidget>('biometria:captura')
  const [resultado,          setResultado]          = useState<BiometriaResultado | null>(null)
  const [registrandoAnimal,  setRegistrandoAnimal]  = useState<AnimalContext | null>(null)
  const [dbError,            setDbError]            = useState<string | null>(null)

  // Referencia al capturaId más reciente (para confirmar)
  const currentCapturaIdRef    = useRef<string | null>(null)
  // Guarda la imagen de una captura 'nuevo' para registrarla sin nueva captura
  const pendingNuevoCaptureRef = useRef<string | null>(null)
  const pendingNuevoModoRef    = useRef<'direct' | 'sheet'>('direct')

  const pendientes = registros.filter(r => r.resultado === 'candidato' && !r.confirmado).length

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

  // Badge offline en header cuando hay capturas en cola
  useEffect(() => {
    if (isOnline && offlineQueue.length === 0) return
  }, [isOnline, offlineQueue.length])

  // ── Cambio de tab ─────────────────────────────────────────────────────────
  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab)
    setActiveWidget(TAB_DEFAULT[tab])
    if (tab === 'historial' || tab === 'estadisticas') refetchCapturas()
  }

  // ── Captura recibida del widget — usa resultado REAL del backend ─────────
  const handleCaptura = async (capturaResult: CapturaResult) => {
    const now = capturaResult.timestamp   // timestamp ya viene del widget (Date.now() en el momento de captura)

    // Si está offline encolar para retry automático
    if (!isOnline && ranchoId) {
      enqueueOffline({
        imageDataUrl: capturaResult.imageDataUrl,
        ranchoId,
        animalId:  registrandoAnimal?.id ?? null,
        modo:      capturaResult.mode,
        timestamp: now,
      })
      return
    }

    let res: BiometriaResultado

    if (capturaResult.resultado === 'match' && capturaResult.animal_id) {
      // Lookup para obtener datos completos aunque registrandoAnimal sea null
      const animalData = await fetchAnimalData(capturaResult.animal_id)
      res = {
        tipo:    'match',
        captura: capturaResult.imageDataUrl,
        modo:    capturaResult.mode,
        ms:      now,
        match: {
          id:      capturaResult.animal_id,
          nombre:  animalData?.nombre  ?? registrandoAnimal?.nombre ?? '—',
          raza:    animalData?.raza    ?? registrandoAnimal?.raza   ?? '—',
          lote:    animalData?.upp     ?? registrandoAnimal?.lote   ?? '—',
          arete:   animalData?.siniiga ?? registrandoAnimal?.arete  ?? '—',
          score:   capturaResult.score_final,
          scoreCV: capturaResult.score_cv,
          scoreIA: capturaResult.score_ia,
        },
      }
    } else if (capturaResult.resultado === 'candidato') {
      // Enriquecer candidatos con datos de Supabase en paralelo
      const enriched = await Promise.all(
        capturaResult.candidatos.map(async c => {
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
        captura:    capturaResult.imageDataUrl,
        modo:       capturaResult.mode,
        ms:         now,
        candidatos: enriched,
      }
    } else {
      res = {
        tipo:    'nuevo',
        captura: capturaResult.imageDataUrl,
        modo:    capturaResult.mode,
        ms:      now,
      }
    }

    setResultado(res)
    setActiveWidget('biometria:resultado')

    // Persistir en BD (sin bloquear UI)
    const authUserId = await getAuthUserId()
    if (authUserId && ranchoId) {
      const animalId =
        capturaResult.animal_id ??
        registrandoAnimal?.id   ??
        null

      const { captura: saved, error: saveErr } = await registrarCaptura({
        imageDataUrl: capturaResult.imageDataUrl,
        ranchoId,
        userId:       authUserId,
        animalId,
        scoreCV:      capturaResult.score_cv    || undefined,
        scoreIA:      capturaResult.score_ia    || undefined,
        scoreFusion:  capturaResult.score_final || undefined,
        resultado:    capturaResult.resultado   as ResultadoCaptura,
        modo:         capturaResult.mode,
        latitud:      capturaResult.latitude    ?? undefined,
        longitud:     capturaResult.longitude   ?? undefined,
      })

      if (saveErr) setDbError(saveErr)
      if (saved)   currentCapturaIdRef.current = saved.id
    }
  }

  // ── Confirmación de animal ────────────────────────────────────────────────
  const handleConfirmar = async (animal: AnimalMatch) => {
    const authUserId = await getAuthUserId()
    const capturaId  = currentCapturaIdRef.current

    if (authUserId && capturaId && animal.id) {
      // 1. Confirmar captura en BD → trigger actualiza biometria_status
      const { error: confirmErr } = await confirmarCaptura({
        capturaId,
        animalId: animal.id,
        userId:   authUserId,
      })
      if (confirmErr) setDbError(confirmErr)

      // 2. Llamar al backend Python /register para guardar fingerprint + embedding
      //    Esto es lo que puebla biometria_embeddings y permite /identify comparar
      if (resultado?.captura && ranchoId) {
        try {
          const imgRes  = await fetch(resultado.captura)
          const blob    = await imgRes.blob()
          const form    = new FormData()
          form.append('image',     blob, 'morro.jpg')
          form.append('animal_id', animal.id)
          form.append('rancho_id', ranchoId)
          form.append('modo',      resultado.modo)
          await fetch(`${BACKEND_URL}/register`, { method: 'POST', body: form })
        } catch {
          setDbError('No se pudo registrar huella en el motor biométrico')
        }
      }

      // 3. Guardar imagen de referencia en Supabase Storage (respaldo)
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

    // Actualizar UI
    currentCapturaIdRef.current = null
    setRegistrandoAnimal(null)
    setTimeout(() => {
      refetchCapturas()
      setActiveWidget('biometria:historial')
      setActiveTab('historial')
    }, 600)
  }

  const handleRechazar = () => {
    setActiveWidget('biometria:captura')
    setActiveTab('captura')
  }

  const handleNueva = () => {
    setActiveWidget('biometria:captura')
    setActiveTab('captura')
    setRegistrandoAnimal(null)
    pendingNuevoCaptureRef.current = null
  }

  // ── Registrar captura 'nuevo' en un animal existente (sin nueva captura) ──
  const handleRegistrarExistingCapture = async (animal: AnimalContext) => {
    const imageDataUrl = pendingNuevoCaptureRef.current
    const modo         = pendingNuevoModoRef.current
    pendingNuevoCaptureRef.current = null

    const authUserId = await getAuthUserId()
    if (!authUserId || !ranchoId || !animal.id || !imageDataUrl) return

    // 1. Confirmar en BD
    const capturaId = currentCapturaIdRef.current
    if (capturaId) {
      const { error } = await confirmarCaptura({ capturaId, animalId: animal.id, userId: authUserId })
      if (error) setDbError(error)
    }

    // 2. Registrar huella en backend Python
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

    // 3. Guardar en Supabase Storage como respaldo
    await registrarEmbedding({
      imageDataUrl,
      animalId: animal.id,
      ranchoId,
      userId:   authUserId,
      calidad:  0.85,
    })

    currentCapturaIdRef.current = null
    setResultado(null)
    setTimeout(() => {
      refetchCapturas()
      setActiveWidget('biometria:historial')
      setActiveTab('historial')
    }, 400)
  }

  const handleIniciarCaptura = (animal: AnimalContext) => {
    // Si venimos de un resultado 'nuevo', registrar la captura existente
    if (pendingNuevoCaptureRef.current && animal.id) {
      handleRegistrarExistingCapture(animal)
      return
    }
    // Normal: iniciar nueva captura con contexto del animal
    setRegistrandoAnimal(animal)
    setActiveWidget('biometria:captura')
    setActiveTab('captura')
  }

  // ── Widget activo ─────────────────────────────────────────────────────────
  const renderWidget = () => {
    switch (activeWidget) {

      case 'biometria:captura':
        return (
          <BiometriaCapturaWidget
            onCaptura={handleCaptura}
            animalContext={registrandoAnimal ?? undefined}
            ranchoId={ranchoId ?? undefined}
            offlineQueue={offlineQueue.length}
          />
        )

      case 'biometria:resultado':
        return resultado ? (
          <BiometriaResultadoWidget
            resultado={resultado}
            onConfirmar={handleConfirmar}
            onRechazar={handleRechazar}
            onRegistrar={() => {
              // Guardar imagen y modo para registrar sin nueva captura
              pendingNuevoCaptureRef.current = resultado.captura ?? null
              pendingNuevoModoRef.current    = resultado.modo
              setActiveWidget('biometria:registrar')
              setActiveTab('registrar')
            }}
            onNueva={handleNueva}
          />
        ) : null

      case 'biometria:historial':
        return (
          <BiometriaHistorialWidget
            registros={registros}
            loading={loadingCapturas}
            onSelectRegistro={r => {
              if (r.resultado === 'candidato' && !r.confirmado) {
                setActiveWidget('biometria:resultado')
                setActiveTab('captura')
              }
            }}
          />
        )

      case 'biometria:registrar':
        return <BiometriaRegistrarWidget onIniciarCaptura={handleIniciarCaptura} onRefetch={refetchCapturas} />

      case 'biometria:estadisticas':
        return <BiometriaEstadisticasWidget registros={registros} />

      case 'biometria:config':
        return <BiometriaConfigWidget />

      default:
        return null
    }
  }

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 flex flex-col bg-stone-50 dark:bg-[#0c0a09] min-h-0">

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 h-12 border-b border-stone-200/70 dark:border-stone-800/60 bg-white dark:bg-[#1c1917] shrink-0">
        <div className="flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2FAF8F" strokeWidth="1.5" strokeLinecap="round" className="shrink-0">
            <circle cx="12" cy="12" r="3"/>
            <path d="M3 9V6a1 1 0 0 1 1-1h3"/><path d="M21 9V6a1 1 0 0 0-1-1h-3"/>
            <path d="M3 15v3a1 1 0 0 0 1 1h3"/><path d="M21 15v3a1 1 0 0 1-1 1h-3"/>
          </svg>
          <span className="text-[12px] font-bold text-stone-700 dark:text-stone-200">Biometría</span>
          {pendientes > 0 && (
            <span className="flex items-center gap-1 text-[10px] font-medium text-amber-500">
              <span className="w-1 h-1 rounded-full bg-amber-400 animate-pulse"/>
              {pendientes} pendiente{pendientes > 1 ? 's' : ''}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {/* Error de BD — discreto */}
          {dbError && (
            <button
              onClick={() => setDbError(null)}
              title={dbError}
              className="flex items-center gap-1 text-[10px] text-red-400 hover:text-red-600 transition-colors cursor-pointer bg-transparent border-0 px-1"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              DB error
            </button>
          )}
          <button
            onClick={onEscalate}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[8px] border border-stone-200/70 dark:border-stone-800/60 bg-white dark:bg-[#1c1917] text-[11px] text-stone-400 dark:text-stone-500 cursor-pointer hover:text-[#2FAF8F] hover:border-[#2FAF8F]/40 transition-all"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/>
              <line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
            </svg>
            Espacio Gandia
          </button>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-[8px] border border-stone-200/70 dark:border-stone-800/60 bg-white dark:bg-[#1c1917] text-stone-400 cursor-pointer hover:text-stone-600 transition-colors"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex border-b border-stone-200/70 dark:border-stone-800/60 bg-white dark:bg-[#1c1917] px-3.5 shrink-0">
        {TABS.map(tab => {
          const active  = activeTab === tab.id
          const isBadge = tab.id === 'historial' && pendientes > 0
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-1.5 px-2.5 py-2.5 text-[11.5px] cursor-pointer border-0 bg-transparent transition-all -mb-px shrink-0 ${
                active
                  ? 'text-stone-700 dark:text-stone-200 font-semibold border-b-2 border-[#2FAF8F]'
                  : 'text-stone-400 dark:text-stone-500 font-normal border-b-2 border-transparent hover:text-stone-600 dark:hover:text-stone-300'
              }`}
            >
              {tab.label}
              {isBadge && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"/>}
            </button>
          )
        })}
      </div>

      {/* ── Zona widget ── */}
      <div className="flex-1 min-h-0 overflow-y-auto
        [&::-webkit-scrollbar]:w-[3px]
        [&::-webkit-scrollbar-track]:bg-transparent
        [&::-webkit-scrollbar-thumb]:bg-stone-200
        dark:[&::-webkit-scrollbar-thumb]:bg-stone-700/80
        [&::-webkit-scrollbar-thumb]:rounded-full">
        <div className="p-3.5">
          {renderWidget()}
        </div>
      </div>
    </div>
  )
}