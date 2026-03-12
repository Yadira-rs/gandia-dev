/**
 * FichaHuellaWidget — Widget: passport:biometria
 * ARCHIVO → src/artifacts/passport/widgets/FichaHuellaWidget.tsx
 *
 * Puente entre Ficha Ganadera y Biometría (NosePrint Bovino).
 * Muestra el estatus de la huella de morro vinculada a la ficha del animal.
 * 
 * Interconectado con BiometriaCapturaWidget para captura de huella
 */

import { useState } from 'react'
import BiometriaCapturaWidget, { type CapturaResult, type AnimalContext } from '../../biometria/widgets/BiometriaCapturaWidget'
import BiometriaResultadoWidget, { type BiometriaResultado } from '../../biometria/widgets/BiometriaResultadoWidget'

export type HuellaEstatus = 'capturada' | 'pendiente' | 'sin-registrar' | 'verificando'

export interface HuellaData {
  estatus:     HuellaEstatus
  score?:      number          // 0-1 · confianza del último match
  fechaCaptura?: string
  modo?:       'direct' | 'sheet'
  capturas?:   number          // total capturas históricas
  animalId?:   string
  animalNombre?: string
  animalArete?:  string
}

interface Props {
  data?:          HuellaData
  onCapturar?:   (result: CapturaResult) => void  // Callback cuando se completa la captura
  onVerHistorial?: () => void  // abre BiometriaHistorialWidget
  compact?:       boolean
}

const MOCK_HUELLA: HuellaData = {
  estatus:       'pendiente',
  score:         0.83,
  fechaCaptura:  '10 Feb 2025',
  modo:          'direct',
  capturas:      3,
  animalNombre:  'Canela',
  animalArete:   '#0089',
}

const STATUS_CONFIG: Record<HuellaEstatus, {
  color: string
  bg: string
  border: string
  label: string
  desc: string
  icon: React.FC<{ color: string }>
}> = {
  capturada: {
    color: '#2FAF8F',
    bg:    'bg-[#2FAF8F]/08 dark:bg-[#2FAF8F]/12',
    border:'border-[#2FAF8F]/25',
    label: 'Huella registrada',
    desc:  'Biometría de morro vinculada y activa',
    icon: ({ color }) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M3 9V6a1 1 0 0 1 1-1h3"/><path d="M21 9V6a1 1 0 0 0-1-1h-3"/>
        <path d="M3 15v3a1 1 0 0 0 1 1h3"/><path d="M21 15v3a1 1 0 0 1-1 1h-3"/>
        <polyline stroke={color} strokeWidth="2" points="8 12 11 15 16 9"/>
      </svg>
    ),
  },
  pendiente: {
    color: '#f59e0b',
    bg:    'bg-amber-50 dark:bg-amber-950/20',
    border:'border-amber-200 dark:border-amber-800/35',
    label: 'Verificación pendiente',
    desc:  'Captura realizada con score bajo — requiere confirmación',
    icon: ({ color }) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M3 9V6a1 1 0 0 1 1-1h3"/><path d="M21 9V6a1 1 0 0 0-1-1h-3"/>
        <path d="M3 15v3a1 1 0 0 0 1 1h3"/><path d="M21 15v3a1 1 0 0 1-1 1h-3"/>
      </svg>
    ),
  },
  'sin-registrar': {
    color: '#a8a29e',
    bg:    'bg-stone-50 dark:bg-[#141210]',
    border:'border-stone-200/70 dark:border-stone-800/60',
    label: 'Sin huella de morro',
    desc:  'Este animal aún no tiene biometría capturada',
    icon: ({ color }) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round">
        <circle cx="12" cy="12" r="3" strokeDasharray="3 2"/>
        <path d="M3 9V6a1 1 0 0 1 1-1h3" strokeOpacity="0.5"/>
        <path d="M21 9V6a1 1 0 0 0-1-1h-3" strokeOpacity="0.5"/>
        <path d="M3 15v3a1 1 0 0 0 1 1h3" strokeOpacity="0.5"/>
        <path d="M21 15v3a1 1 0 0 1-1 1h-3" strokeOpacity="0.5"/>
      </svg>
    ),
  },
  verificando: {
    color: '#6366f1',
    bg:    'bg-indigo-50 dark:bg-indigo-950/20',
    border:'border-indigo-200 dark:border-indigo-800/35',
    label: 'Verificando…',
    desc:  'Procesando captura en el motor biométrico',
    icon: ({ color }) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round">
        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
      </svg>
    ),
  },
}

export default function FichaHuellaWidget({
  data = MOCK_HUELLA,
  onCapturar,
  onVerHistorial,
  compact = false,
}: Props) {
  const [showVerificar, setShowVerificar] = useState(false)
  const [showCaptura, setShowCaptura] = useState(false)
  const cfg = STATUS_CONFIG[data.estatus]
  const Icon = cfg.icon
  const scoreLabel = data.score ? `${Math.round(data.score * 100)}%` : null

  const animalContext: AnimalContext | undefined = data.animalNombre ? {
    nombre: data.animalNombre,
    arete: data.animalArete || '',
    raza: '',
    lote: '',
  } : undefined

  const handleCaptura = (result: CapturaResult) => {
    setCapturaResult(result)
    setShowCaptura(false)
    onCapturar?.(result)
  }

  // Si ya tiene captura y quiere verificar identidad - usar BiometriaResultadoWidget
  if (showVerificar && data.estatus === 'capturada') {
    const resultadoVerificar: BiometriaResultado = {
      tipo: 'match',
      captura: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2YzZjRmNiIvPjwvc3ZnPg==',
      match: {
        id: data.animalId || '1',
        nombre: data.animalNombre || 'Animal',
        raza: 'Simmental',
        lote: 'A1',
        arete: data.animalArete || '#0000',
        score: data.score || 0.95,
        scoreCV: 0.92,
        scoreIA: 0.98,
      },
      modo: 'direct',
      ms: 1250,
    }

    return (
      <div className="flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <p className="text-[14px] font-bold text-stone-800 dark:text-stone-100">Verificar identidad</p>
          <button 
            onClick={() => setShowVerificar(false)}
            className="text-[12px] text-stone-400 hover:text-stone-600 cursor-pointer border-0 bg-transparent"
          >
            Cerrar
          </button>
        </div>

        {/* Info del animal */}
        <div className="px-4 py-3 bg-[#2FAF8F]/10 dark:bg-[#2FAF8F]/15 border border-[#2FAF8F]/30 rounded-[12px]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#2FAF8F]/20 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2FAF8F" strokeWidth="1.5">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <div>
              <p className="text-[14px] font-semibold text-stone-800 dark:text-stone-100">{data.animalNombre}</p>
              <p className="text-[12px] text-stone-500 font-mono">{data.animalArete}</p>
            </div>
          </div>
        </div>

        {/* Widget de resultado para verificar */}
        <BiometriaResultadoWidget 
          resultado={resultadoVerificar}
          onConfirmar={(animal) => {
            console.log('Identidad verificada:', animal)
            setShowVerificar(false)
          }}
          onRechazar={() => {
            console.log('No es este animal')
            setShowVerificar(false)
          }}
        />
      </div>
    )
  }

  // Si muestra widget de captura (para registrar nueva huella o verificar)
  if (showCaptura) {
    return (
      <div className="flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <p className="text-[14px] font-bold text-stone-800 dark:text-stone-100">
            {data.estatus === 'sin-registrar' ? 'Registrar huella de morro' : 'Capturar huella'}
          </p>
          <button 
            onClick={() => setShowCaptura(false)}
            className="text-[12px] text-stone-400 hover:text-stone-600 cursor-pointer border-0 bg-transparent"
          >
            Cancelar
          </button>
        </div>

        {/* Info del animal */}
        {(data.animalNombre || data.animalArete) && (
          <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-[#1c1917] border border-stone-200 dark:border-stone-700 rounded-[8px]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a8a29e" strokeWidth="1.75">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
            <p className="text-[12px] text-stone-500">
              {data.animalNombre && <span className="font-semibold">{data.animalNombre}</span>}
              {data.animalArete && <span className="font-mono ml-1">{data.animalArete}</span>}
            </p>
          </div>
        )}

        {/* Widget de captura */}
        <BiometriaCapturaWidget 
          onCaptura={handleCaptura}
          compact
          animalContext={animalContext}
        />

        {/* Tips */}
        <div className="p-3 bg-stone-50 dark:bg-[#141210] border border-stone-100 dark:border-stone-800 rounded-[10px]">
          <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-2">Consejos para mejor captura</p>
          <div className="space-y-1.5 text-[11px] text-stone-500">
            <div className="flex items-center gap-2">☀️ <span>Evita luz directa del sol</span></div>
            <div className="flex items-center gap-2">💧 <span>El morro debe estar limpio y seco</span></div>
            <div className="flex items-center gap-2">📱 <span>Mantén la cámara estable</span></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">

      {/* ── Animal context - primero y prominente ── */}
      {(data.animalNombre || data.animalArete) && !compact && (
        <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-[#1c1917] border border-stone-200/70 dark:border-stone-800/60 rounded-[12px]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#2FAF8F]/15 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2FAF8F" strokeWidth="1.5" strokeLinecap="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M3 9V6a1 1 0 0 1 1-1h3"/><path d="M21 9V6a1 1 0 0 0-1-1h-3"/>
                <path d="M3 15v3a1 1 0 0 0 1 1h3"/><path d="M21 15v3a1 1 0 0 1-1 1h-3"/>
              </svg>
            </div>
            <div>
              <p className="text-[14px] font-bold text-stone-800 dark:text-stone-100">{data.animalNombre}</p>
              <p className="text-[12px] text-stone-500 font-mono">{data.animalArete}</p>
            </div>
          </div>
          {data.estatus === 'capturada' && scoreLabel && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#2FAF8F]/10 border border-[#2FAF8F]/30">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2FAF8F" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              <span className="text-[12px] font-bold text-[#2FAF8F]">{scoreLabel}</span>
            </div>
          )}
        </div>
      )}

      {/* ── Tarjeta de estado ── */}
      <div className={`rounded-[14px] border px-4 py-4 ${cfg.bg} ${cfg.border}`}>
        <div className="flex items-start gap-4">
          {/* Ícono grande */}
          <div className={`w-14 h-14 rounded-[12px] flex items-center justify-center shrink-0 border-2 ${cfg.border} ${cfg.bg}`}>
            <Icon color={cfg.color} />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-[16px] font-bold leading-tight" style={{ color: cfg.color }}>
                {cfg.label}
              </p>
              {data.estatus === 'verificando' && (
                <svg className="w-4 h-4 animate-spin" style={{ color: cfg.color }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
              )}
            </div>
            <p className="text-[13px] text-stone-500 dark:text-stone-400 leading-relaxed">{cfg.desc}</p>
            
            {/* Meta info - solo si tiene captura */}
            {data.estatus === 'capturada' && (
              <div className="flex items-center gap-4 mt-3">
                {data.fechaCaptura && (
                  <span className="flex items-center gap-1.5 text-[11px] text-stone-400">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    {data.fechaCaptura}
                  </span>
                )}
                {data.capturas && data.capturas > 0 && (
                  <span className="text-[11px] text-stone-400">
                    {data.capturas} captura{data.capturas > 1 ? 's' : ''} total{data.capturas > 1 ? 'es' : ''}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Acciones ── */}
      <div className="flex flex-col gap-2">
        {/* Botón principal */}
        {data.estatus === 'capturada' ? (
          <button
            onClick={() => setShowVerificar(true)}
            className="w-full h-12 flex items-center justify-center gap-2.5 rounded-[12px] text-[14px] font-semibold transition-all active:scale-[0.98] cursor-pointer border-0 bg-[#2FAF8F] hover:bg-[#27a07f] text-white shadow-[0_2px_12px_rgba(47,175,143,0.25)]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            Verificar identidad
          </button>
        ) : (
          <button
            onClick={() => setShowCaptura(true)}
            disabled={data.estatus === 'verificando'}
            className={`w-full h-12 flex items-center justify-center gap-2.5 rounded-[12px] text-[14px] font-semibold transition-all active:scale-[0.98] cursor-pointer border-0 ${
              data.estatus === 'verificando'
                ? 'bg-stone-200 dark:bg-stone-700 text-stone-400 cursor-not-allowed'
                : 'bg-[#2FAF8F] hover:bg-[#27a07f] text-white shadow-[0_2px_12px_rgba(47,175,143,0.25)]'
            }`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M3 9V6a1 1 0 0 1 1-1h3"/><path d="M21 9V6a1 1 0 0 0-1-1h-3"/>
              <path d="M3 15v3a1 1 0 0 0 1 1h3"/><path d="M21 15v3a1 1 0 0 1-1 1h-3"/>
            </svg>
            {data.estatus === 'pendiente' ? 'Completar verificación' :
             data.estatus === 'verificando' ? 'Procesando...' :
             'Registrar huella de morro'}
          </button>
        )}

        {/* Historial como enlace discreto */}
        {onVerHistorial && data.capturas && data.capturas > 0 && (
          <button
            onClick={onVerHistorial}
            className="w-full h-9 flex items-center justify-center gap-2 text-[12px] text-stone-400 hover:text-[#2FAF8F] transition-colors cursor-pointer border-0 bg-transparent"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            Ver historial de capturas
          </button>
        )}
      </div>

      {/* ── Aviso para sin-registrar (solo si no hay captura) ── */}
      {data.estatus === 'sin-registrar' && (
        <div className="flex items-start gap-3 px-4 py-3 bg-stone-50 dark:bg-[#141210] border border-stone-100 dark:border-stone-800/40 rounded-[12px]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a8a29e" strokeWidth="2" className="shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
          <p className="text-[12px] text-stone-500 dark:text-stone-400 leading-relaxed">
            La huella de morro es única para cada animal, como una huella digital.{' '}
            <span className="text-[#2FAF8F] font-medium">Funciona sin internet</span> y es ideal para el campo.
          </p>
        </div>
      )}
    </div>
  )
}