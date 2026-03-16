/**
 * FichaHuellaWidget — con datos reales de Supabase
 * ARCHIVO → src/artifacts/passport/widgets/FichaHuellaWidget.tsx
 *
 * CAMBIOS vs mock:
 *   - Acepta animalId para cargar datos reales desde BD
 *   - useCapturasPorAnimal() para historial real del animal
 *   - biometria_status se lee del prop o de la BD
 *   - Al confirmar captura → persiste en BD via registrarCaptura + confirmarCaptura
 *
 * ACTUALIZAR en FichaModulo y FichaAnima:
 *   <FichaHuellaWidget animalId={selectedAnimal.id} ... />
 */

import { useState, useMemo } from 'react'
import { useUser }            from '../../../context/UserContext'
import { useRanchoId, getAuthUserId } from '../../../hooks/useAnimales'
import {
  useCapturasPorAnimal,
  registrarCaptura,
  confirmarCaptura,
  getCapturaUrl,
  type BiometriaCapturaDB,
  type ResultadoCaptura,
} from '../../../hooks/useBiometria'

import BiometriaCapturaWidget, {
  type CapturaResult,
  type AnimalContext,
} from '../../biometria/widgets/BiometriaCapturaWidget'

import BiometriaResultadoWidget, {
  type BiometriaResultado,
  type AnimalMatch,
} from '../../biometria/widgets/BiometriaResultadoWidget'

// ─── PROPS ────────────────────────────────────────────────────────────────────

interface Props {
  animalId?:       string
  animalNombre?:   string
  animalArete?:    string
  animalRaza?:     string
  onCapturar?:     (result: CapturaResult) => void
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function dbToStatus(capturas: BiometriaCapturaDB[]): 'capturada' | 'pendiente' | 'sin-registrar' {
  if (capturas.length === 0) return 'sin-registrar'
  if (capturas.some(c => c.confirmado))    return 'capturada'
  if (capturas.some(c => c.resultado === 'candidato')) return 'pendiente'
  if (capturas.some(c => c.resultado === 'match'))     return 'capturada'
  return 'sin-registrar'
}

function bestScore(capturas: BiometriaCapturaDB[]): number | null {
  const confirmed = capturas.filter(c => c.confirmado && c.score_fusion)
  if (confirmed.length > 0) return Math.max(...confirmed.map(c => c.score_fusion!))
  const withScore = capturas.filter(c => c.score_fusion)
  if (withScore.length > 0) return Math.max(...withScore.map(c => c.score_fusion!))
  return null
}

const STATUS_CONFIG = {
  capturada: {
    color: '#2FAF8F',
    bg:    'bg-[#2FAF8F]/08 dark:bg-[#2FAF8F]/12',
    border:'border-[#2FAF8F]/25',
    label: 'Huella registrada',
    desc:  'Biometría de morro vinculada y activa',
  },
  pendiente: {
    color: '#f59e0b',
    bg:    'bg-amber-50 dark:bg-amber-950/20',
    border:'border-amber-200 dark:border-amber-800/35',
    label: 'Verificación pendiente',
    desc:  'Captura realizada con score bajo — requiere confirmación',
  },
  'sin-registrar': {
    color: '#a8a29e',
    bg:    'bg-stone-50 dark:bg-[#141210]',
    border:'border-stone-200/70 dark:border-stone-800/60',
    label: 'Sin huella de morro',
    desc:  'Este animal aún no tiene biometría capturada',
  },
}

// ─── WIDGET ───────────────────────────────────────────────────────────────────

export default function FichaHuellaWidget({
  animalId,
  animalNombre,
  animalArete,
  animalRaza,
  onCapturar,
}: Props) {
  const { profile }  = useUser()
  const userId       = profile?.user_id ?? null
  const { ranchoId } = useRanchoId(userId)

  const { capturas, loading, refetch } = useCapturasPorAnimal(animalId ?? null)

  const estatus   = useMemo(() => dbToStatus(capturas), [capturas])
  const score     = useMemo(() => bestScore(capturas),  [capturas])
  const cfg       = STATUS_CONFIG[estatus]
  const scoreLabel = score ? `${Math.round(score * 100)}%` : null

  const [showCaptura,    setShowCaptura]    = useState(false)
  const [showHistorial,  setShowHistorial]  = useState(false)
  const [resultado,      setResultado]      = useState<BiometriaResultado | null>(null)
  const [saving,         setSaving]         = useState(false)
  const [dbError,        setDbError]        = useState<string | null>(null)
  const [capturaIdRef,   setCapturaIdRef]   = useState<string | null>(null)

  const animalContext: AnimalContext | undefined = animalNombre ? {
    id:     animalId,
    nombre: animalNombre,
    arete:  animalArete ?? '',
    raza:   animalRaza  ?? '',
    lote:   '',
  } : undefined

  // ── Recibir captura del widget ────────────────────────────────────────────
  const handleCaptura = async (result: CapturaResult) => {
    setShowCaptura(false)
    const score = result.quality

    // Simular resultado
    const res: BiometriaResultado =
      score >= 0.88
        ? {
            tipo: 'match', captura: result.imageDataUrl, modo: result.mode,
            ms: Math.round(900 + Math.random() * 500),
            match: {
              id:      animalId ?? 'm1',
              nombre:  animalNombre ?? 'Animal',
              raza:    animalRaza   ?? '—',
              lote:    '—',
              arete:   animalArete  ?? '—',
              score,
              scoreCV: score - 0.03,
              scoreIA: score + 0.02,
            },
          }
        : score >= 0.72
        ? {
            tipo: 'candidato', captura: result.imageDataUrl, modo: result.mode,
            ms: Math.round(900 + Math.random() * 600),
            candidatos: [{
              id:      animalId ?? 'c1',
              nombre:  animalNombre ?? 'Animal',
              raza:    animalRaza   ?? '—',
              lote:    '—',
              arete:   animalArete  ?? '—',
              score,
              scoreCV: score - 0.03,
              scoreIA: score + 0.02,
            }],
          }
        : {
            tipo: 'nuevo', captura: result.imageDataUrl, modo: result.mode,
            ms: Math.round(700 + Math.random() * 400),
          }

    setResultado(res)

    // Persistir en BD
    setSaving(true)
    const authUserId = await getAuthUserId()
    if (authUserId && ranchoId) {
      const { captura: saved, error: saveErr } = await registrarCaptura({
        imageDataUrl: result.imageDataUrl,
        ranchoId,
        userId:       authUserId,
        animalId:     animalId ?? null,
        scoreFusion:  score > 0 ? score : undefined,
        resultado:    res.tipo as ResultadoCaptura,
        modo:         result.mode,
      })
      if (saveErr) setDbError(saveErr)
      if (saved)   setCapturaIdRef(saved.id)
    }
    setSaving(false)

    onCapturar?.(result)
  }

  // ── Confirmar identidad ───────────────────────────────────────────────────
  const handleConfirmar = async (animal: AnimalMatch) => {
    const authUserId = await getAuthUserId()
    if (authUserId && capturaIdRef && animal.id) {
      const { error: err } = await confirmarCaptura({
        capturaId: capturaIdRef,
        animalId:  animal.id,
        userId:    authUserId,
      })
      if (err) setDbError(err)
    }
    setCapturaIdRef(null)
    setResultado(null)
    refetch()
  }

  // ── Vista: resultado de captura ───────────────────────────────────────────
  if (resultado) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-[13px] font-semibold text-stone-700 dark:text-stone-200">Resultado de captura</p>
          {saving && (
            <div className="flex items-center gap-1.5 text-[11px] text-stone-400">
              <div className="w-3 h-3 border border-stone-300 border-t-transparent rounded-full animate-spin"/>
              Guardando…
            </div>
          )}
        </div>
        <BiometriaResultadoWidget
          resultado={resultado}
          onConfirmar={handleConfirmar}
          onRechazar={() => setResultado(null)}
          onRegistrar={() => setResultado(null)}
          onNueva={() => { setResultado(null); setShowCaptura(true) }}
        />
        {dbError && (
          <p className="text-[11px] text-red-500 bg-red-50 dark:bg-red-950/20 px-3 py-2 rounded-[8px]">
            {dbError}
          </p>
        )}
      </div>
    )
  }

  // ── Vista: cámara activa ──────────────────────────────────────────────────
  if (showCaptura) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-[13px] font-semibold text-stone-700 dark:text-stone-200">
            {estatus === 'sin-registrar' ? 'Registrar huella de morro' : 'Nueva captura'}
          </p>
          <button
            onClick={() => setShowCaptura(false)}
            className="text-[12px] text-stone-400 hover:text-stone-600 cursor-pointer border-0 bg-transparent"
          >
            Cancelar
          </button>
        </div>
        <BiometriaCapturaWidget
          onCaptura={handleCaptura}
          compact
          animalContext={animalContext}
        />
        <div className="p-3 bg-stone-50 dark:bg-[#141210] border border-stone-100 dark:border-stone-800 rounded-[10px]">
          <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-2">Consejos</p>
          <div className="flex flex-col gap-1.5 text-[11.5px] text-stone-500 dark:text-stone-400">
            <span>☀️ Evita luz directa del sol</span>
            <span>💧 El morro debe estar limpio y seco</span>
            <span>📱 Mantén la cámara estable a 10–15 cm</span>
          </div>
        </div>
      </div>
    )
  }

  // ── Vista: historial de capturas ──────────────────────────────────────────
  if (showHistorial) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-[13px] font-semibold text-stone-700 dark:text-stone-200">
            Historial de capturas
          </p>
          <button
            onClick={() => setShowHistorial(false)}
            className="text-[12px] text-stone-400 hover:text-stone-600 cursor-pointer border-0 bg-transparent"
          >
            Cerrar
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-5 h-5 border-2 border-[#2FAF8F] border-t-transparent rounded-full animate-spin"/>
          </div>
        ) : capturas.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <p className="text-[12px] text-stone-400 dark:text-stone-500">Sin capturas registradas</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-[#1c1917] border border-stone-200/60 dark:border-stone-800/50 rounded-[12px] overflow-hidden">
            {capturas.map((c, i) => (
              <CapturaRow
                key={c.id}
                captura={c}
                hasBorder={i < capturas.length - 1}
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  // ── Vista: estado principal ───────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-3">

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-8">
          <div className="w-5 h-5 border-2 border-[#2FAF8F] border-t-transparent rounded-full animate-spin"/>
        </div>
      )}

      {/* Tarjeta de estado */}
      {!loading && (
        <div className={`rounded-[12px] border px-4 py-4 ${cfg.bg} ${cfg.border}`}>
          <div className="flex items-start gap-4">
            {/* Ícono */}
            <div className={`w-12 h-12 rounded-[10px] flex items-center justify-center shrink-0 border ${cfg.border} ${cfg.bg}`}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={cfg.color} strokeWidth="1.5" strokeLinecap="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M3 9V6a1 1 0 0 1 1-1h3"/><path d="M21 9V6a1 1 0 0 0-1-1h-3"/>
                <path d="M3 15v3a1 1 0 0 0 1 1h3"/><path d="M21 15v3a1 1 0 0 1-1 1h-3"/>
                {estatus === 'capturada' && (
                  <polyline stroke={cfg.color} strokeWidth="2" points="8 12 11 15 16 9"/>
                )}
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-[15px] font-bold leading-tight" style={{ color: cfg.color }}>
                {cfg.label}
              </p>
              <p className="text-[12.5px] text-stone-500 dark:text-stone-400 mt-0.5 leading-relaxed">{cfg.desc}</p>
              {estatus === 'capturada' && capturas.length > 0 && (
                <div className="flex items-center gap-3 mt-2">
                  {scoreLabel && (
                    <span className="text-[12px] font-bold text-[#2FAF8F]">{scoreLabel} confianza</span>
                  )}
                  <span className="text-[11px] text-stone-400">
                    {capturas.length} captura{capturas.length > 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Acciones */}
      {!loading && (
        <div className="flex flex-col gap-2">
          <button
            onClick={() => setShowCaptura(true)}
            className="w-full h-11 flex items-center justify-center gap-2 rounded-[10px] bg-[#2FAF8F] hover:bg-[#27a07f] text-white text-[13px] font-semibold transition-colors border-0 cursor-pointer active:scale-[0.98]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M3 9V6a1 1 0 0 1 1-1h3"/><path d="M21 9V6a1 1 0 0 0-1-1h-3"/>
              <path d="M3 15v3a1 1 0 0 0 1 1h3"/><path d="M21 15v3a1 1 0 0 1-1 1h-3"/>
            </svg>
            {estatus === 'capturada' ? 'Nueva captura' : estatus === 'pendiente' ? 'Completar verificación' : 'Registrar huella de morro'}
          </button>

          {capturas.length > 0 && (
            <button
              onClick={() => setShowHistorial(true)}
              className="w-full h-9 flex items-center justify-center gap-2 text-[12px] text-stone-400 hover:text-[#2FAF8F] transition-colors cursor-pointer border-0 bg-transparent"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              Ver historial ({capturas.length} capturas)
            </button>
          )}
        </div>
      )}

      {/* Aviso sin huella */}
      {!loading && estatus === 'sin-registrar' && (
        <div className="flex items-start gap-3 px-3.5 py-3 bg-stone-50 dark:bg-[#141210] border border-stone-100 dark:border-stone-800/40 rounded-[10px]">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a8a29e" strokeWidth="2" className="shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
          <p className="text-[11.5px] text-stone-500 dark:text-stone-400 leading-relaxed">
            La huella de morro es única para cada animal, como una huella digital.{' '}
            <span className="text-[#2FAF8F] font-medium">Funciona sin internet</span> y es ideal para el campo.
          </p>
        </div>
      )}
    </div>
  )
}

// ─── FILA DE HISTORIAL ────────────────────────────────────────────────────────

function CapturaRow({ captura: c, hasBorder }: { captura: BiometriaCapturaDB; hasBorder: boolean }) {
  const [url, setUrl] = useState<string | null>(null)

  const loadUrl = async () => {
    if (url) return
    const signed = await getCapturaUrl(c.imagen_path)
    setUrl(signed)
  }

  const fecha = new Date(c.created_at).toLocaleString('es-MX', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
  })

  const resultado = c.resultado as ResultadoCaptura

  const dotColor = {
    match:     'bg-[#2FAF8F]',
    candidato: 'bg-amber-400',
    nuevo:     'bg-violet-400',
    error:     'bg-red-400',
  }[resultado]

  const textColor = {
    match:     'text-[#2FAF8F]',
    candidato: 'text-amber-500',
    nuevo:     'text-violet-500',
    error:     'text-red-500',
  }[resultado]

  const label = {
    match: 'Match', candidato: 'Candidato', nuevo: 'Nuevo', error: 'Error',
  }[resultado]

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 hover:bg-stone-50 dark:hover:bg-stone-800/20 cursor-pointer transition-colors ${
        hasBorder ? 'border-b border-stone-100 dark:border-stone-800/40' : ''
      }`}
      onClick={loadUrl}
    >
      <span className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`}/>
      <div className="flex-1 min-w-0">
        <p className={`text-[12px] font-medium ${textColor}`}>{label}</p>
        <p className="text-[10.5px] text-stone-400 dark:text-stone-500 mt-0.5">
          {c.modo === 'direct' ? 'Cámara directa' : 'Hoja inteligente'}
          {c.confirmado && ' · Confirmado'}
        </p>
      </div>
      {c.score_fusion != null && (
        <span className={`text-[13px] font-bold tabular-nums ${textColor}`}>
          {Math.round(c.score_fusion * 100)}%
        </span>
      )}
      <span className="text-[10px] text-stone-300 dark:text-stone-600 shrink-0">{fecha}</span>
    </div>
  )
}