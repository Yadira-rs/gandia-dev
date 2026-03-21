  /**
   * VerificationItemWidget — Widget: verification:item
   * Detalle de un ítem de verificación.
   */

  import { useState } from 'react'
  import type { ItemVerificacion } from './VerificationColaWidget'

  interface Props {
    item:         ItemVerificacion
    onVerificar?: (id: number, observacion?: string) => void
    onRechazar?:  (id: number, motivo: string) => void
    onClose?:     () => void
  }

  const DOMINIO_LABEL: Record<string, string> = {
    monitoreo:     'Monitoreo',
    sanidad:       'Sanidad',
    certificacion: 'Certificación',
    gemelo:        'Gemelo Digital',
    biometria:     'Biometría',
    pasaporte:     'Pasaporte',
  }

  const CONTEXTO: Record<string, { descripcion: string; evidencia: string[] }> = {
    monitoreo: {
      descripcion: 'La IA detectó comportamiento inusual mediante análisis de video en tiempo real. El modelo comparó patrones de movimiento contra el baseline del hato para disparar esta alerta.',
      evidencia: ['Secuencia de video 00:12 — 00:34', 'Score de anomalía: 0.91 / 1.0', 'Distancia al hato: 18.3 m (umbral: 15 m)', 'Duración sin movimiento: 14 min'],
    },
    sanidad: {
      descripcion: 'El usuario registró manualmente un evento sanitario desde campo. El sistema requiere verificación antes de indexar el registro en el gemelo digital y calcular elegibilidad.',
      evidencia: ['Registro manual capturado', 'Sin fotografía adjunta', 'Sin firma digital del MVZ', 'GPS: UPP Rancho Morales'],
    },
    certificacion: {
      descripcion: 'El sistema recalculó automáticamente el score de elegibilidad tras la actualización de documentos. El nuevo puntaje puede afectar el estatus de certificación del animal.',
      evidencia: ['Score anterior: 68/100', 'Score nuevo: 74/100', 'Cambio: +6 puntos', 'Trigger: documento TB actualizado'],
    },
    gemelo: {
      descripcion: 'Se registró un nuevo evento en el gemelo digital del animal. El sistema requiere que un usuario autorizado confirme que la información es correcta antes de marcarla como verificada.',
      evidencia: ['Evento registrado por operador en campo', 'Timestamp verificado por GPS', 'Sin evidencia fotográfica adjunta'],
    },
    biometria: {
      descripcion: 'La IA realizó una identificación biométrica por huella de morro. El score de confianza está por debajo del umbral de verificación automática y requiere confirmación humana.',
      evidencia: ['Motor: Fingerprint CV + ResNet50', 'Score de confianza: 0.83 / 1.0', 'Umbral auto-verificación: 0.90', 'Candidato requiere confirmación humana'],
    },
    pasaporte: {
      descripcion: 'Se realizó una actualización en el pasaporte del animal. Como el pasaporte es un documento legal estático, cualquier modificación requiere verificación formal.',
      evidencia: ['Campo modificado: Fotografía oficial', 'Modificado por: Operador', 'Versión anterior conservada en historial'],
    },
  }

  const SEV_DOT: Record<string, string> = {
    alta:  'bg-red-400',
    media: 'bg-amber-400',
    baja:  'bg-stone-300 dark:bg-stone-600',
  }

  const SEV_TEXT: Record<string, string> = {
    alta:  'text-red-500 dark:text-red-400',
    media: 'text-amber-500 dark:text-amber-400',
    baja:  'text-stone-400 dark:text-stone-500',
  }

  export default function VerificationItemWidget({ item, onVerificar, onRechazar, onClose }: Props) {
    const [modo,        setModo]        = useState<'idle' | 'rechazar' | 'observacion'>('idle')
    const [motivo,      setMotivo]      = useState('')
    const [observacion, setObservacion] = useState('')
    const [done,        setDone]        = useState(false)
    const [resultado,   setResultado]   = useState<'verificado' | 'rechazado' | null>(null)

    const ctx = CONTEXTO[item.dominio] ?? CONTEXTO['monitoreo']

    const handleVerificar = () => {
      setDone(true)
      setResultado('verificado')
      setTimeout(() => onVerificar?.(item.id, observacion || undefined), 800)
    }

    const handleRechazar = () => {
      if (!motivo.trim()) return
      setDone(true)
      setResultado('rechazado')
      setTimeout(() => onRechazar?.(item.id, motivo), 800)
    }

    // ── Estado final ─────────────────────────────────────────────────────────

    if (done) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 py-14 px-6 text-center">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            resultado === 'verificado'
              ? 'bg-[#2FAF8F]/10 dark:bg-[#2FAF8F]/20'
              : 'bg-red-50 dark:bg-red-950/30'
          }`}>
            {resultado === 'verificado'
              ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2FAF8F" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
              : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            }
          </div>
          <div>
            <p className={`text-[14px] font-semibold mb-1 ${resultado === 'verificado' ? 'text-[#2FAF8F]' : 'text-red-500'}`}>
              {resultado === 'verificado' ? 'Acción verificada' : 'Acción rechazada'}
            </p>
            <p className="text-[12px] text-stone-400 dark:text-stone-500 max-w-[260px] leading-relaxed">
              {resultado === 'verificado'
                ? 'El registro fue confirmado y pasará al historial de verificaciones.'
                : 'El rechazo fue registrado. Se generará una inconsistencia para seguimiento.'
              }
            </p>
          </div>
        </div>
      )
    }

    // ── Vista principal ───────────────────────────────────────────────────────

    return (
      <div className="flex flex-col gap-5">

        {/* Encabezado */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            {/* Dot */}
            <div className="pt-[5px] shrink-0">
              <span className={`block w-[7px] h-[7px] rounded-full ${SEV_DOT[item.severidad]}`} />
            </div>
            <div>
              <p className="text-[15px] font-semibold text-stone-800 dark:text-stone-100 leading-snug mb-1.5">
                {item.accion}
              </p>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] text-stone-400 dark:text-stone-500">
                  {item.origen === 'ia' ? 'Acción de IA' : 'Acción de usuario'}
                </span>
                <span className="text-stone-200 dark:text-stone-700">·</span>
                <span className="text-[11px] text-stone-400 dark:text-stone-500">
                  {DOMINIO_LABEL[item.dominio] ?? item.dominio}
                </span>
                <span className="text-stone-200 dark:text-stone-700">·</span>
                <span className={`text-[11px] font-medium ${SEV_TEXT[item.severidad]}`}>
                  {item.severidad === 'alta' ? 'Urgente' : item.severidad === 'media' ? 'Media' : 'Baja'}
                </span>
              </div>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="w-7 h-7 shrink-0 flex items-center justify-center rounded-lg text-stone-300 dark:text-stone-600 hover:text-stone-500 dark:hover:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800/40 transition-all mt-0.5"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </div>

        {/* Metadatos — actor + animal */}
        <div className="flex items-center gap-4 pl-[19px]">
          <div>
            <p className="text-[10px] text-stone-300 dark:text-stone-600 uppercase tracking-[0.05em] mb-0.5">Origen</p>
            <p className="text-[12px] text-stone-600 dark:text-stone-300">{item.actor}</p>
          </div>
          {item.animal && (
            <div>
              <p className="text-[10px] text-stone-300 dark:text-stone-600 uppercase tracking-[0.05em] mb-0.5">Animal</p>
              <p className="text-[12px] text-stone-600 dark:text-stone-300">{item.animal} · {item.arete}</p>
            </div>
          )}
          <div>
            <p className="text-[10px] text-stone-300 dark:text-stone-600 uppercase tracking-[0.05em] mb-0.5">Registrado</p>
            <p className="text-[12px] text-stone-600 dark:text-stone-300">{item.ts}</p>
          </div>
        </div>

        {/* Divisor */}
        <div className="h-px bg-stone-100 dark:bg-stone-800/60" />

        {/* Contexto */}
        <div className="pl-[19px]">
          <p className="text-[10px] text-stone-300 dark:text-stone-600 uppercase tracking-[0.05em] mb-2">Contexto</p>
          <p className="text-[12.5px] text-stone-500 dark:text-stone-400 leading-relaxed">{ctx.descripcion}</p>
        </div>

        {/* Evidencia */}
        <div className="pl-[19px]">
          <p className="text-[10px] text-stone-300 dark:text-stone-600 uppercase tracking-[0.05em] mb-2">Evidencia</p>
          <div className="flex flex-col gap-1.5">
            {ctx.evidencia.map((e, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <span className="text-[10px] font-mono text-stone-300 dark:text-stone-600 w-4 text-right shrink-0">{String(i + 1).padStart(2, '0')}</span>
                <p className="text-[12px] text-stone-500 dark:text-stone-400">{e}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Divisor */}
        <div className="h-px bg-stone-100 dark:bg-stone-800/60" />

        {/* Zona de acción */}
        {modo === 'idle' && (
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <button
                onClick={() => setModo('observacion')}
                className="flex-1 h-9 rounded-[10px] border border-stone-200/80 dark:border-stone-700/60 bg-white dark:bg-stone-800/40 text-[12.5px] font-medium text-stone-500 dark:text-stone-400 cursor-pointer hover:border-stone-300 dark:hover:border-stone-600 hover:text-stone-700 dark:hover:text-stone-200 transition-all"
              >
                Agregar observación
              </button>
              <button
                onClick={handleVerificar}
                className="flex-1 h-9 flex items-center justify-center gap-1.5 rounded-[10px] bg-[#2FAF8F] hover:bg-[#27a07f] active:bg-[#1e9070] text-white text-[12.5px] font-semibold border-0 cursor-pointer transition-colors"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Verificar
              </button>
            </div>
            <button
              onClick={() => setModo('rechazar')}
              className="h-9 rounded-[10px] border border-stone-100 dark:border-stone-800/50 bg-white dark:bg-transparent text-[12.5px] font-medium text-stone-400 dark:text-stone-500 cursor-pointer hover:border-red-200 dark:hover:border-red-900/40 hover:text-red-500 dark:hover:text-red-400 transition-all"
            >
              Rechazar
            </button>
          </div>
        )}

        {modo === 'observacion' && (
          <div className="flex flex-col gap-2">
            <textarea
              value={observacion}
              onChange={e => setObservacion(e.target.value)}
              placeholder="Escribe tu observación antes de verificar..."
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-[10px] border border-stone-200/80 dark:border-stone-700/60 bg-stone-50 dark:bg-stone-800/30 text-[12.5px] text-stone-700 dark:text-stone-200 placeholder-stone-300 dark:placeholder-stone-600 outline-none focus:border-stone-300 dark:focus:border-stone-600 resize-none transition-colors"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setModo('idle')}
                className="flex-1 h-9 rounded-[10px] border border-stone-200/80 dark:border-stone-700/60 text-[12.5px] text-stone-400 dark:text-stone-500 cursor-pointer hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleVerificar}
                className="flex-1 h-9 rounded-[10px] bg-[#2FAF8F] hover:bg-[#27a07f] text-white text-[12.5px] font-semibold border-0 cursor-pointer transition-colors"
              >
                Verificar con observación
              </button>
            </div>
          </div>
        )}

        {modo === 'rechazar' && (
          <div className="flex flex-col gap-2">
            <textarea
              value={motivo}
              onChange={e => setMotivo(e.target.value)}
              placeholder="Motivo del rechazo (requerido)..."
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-[10px] border border-stone-200/80 dark:border-stone-700/60 bg-stone-50 dark:bg-stone-800/30 text-[12.5px] text-stone-700 dark:text-stone-200 placeholder-stone-300 dark:placeholder-stone-600 outline-none focus:border-red-300 dark:focus:border-red-800/60 resize-none transition-colors"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setModo('idle')}
                className="flex-1 h-9 rounded-[10px] border border-stone-200/80 dark:border-stone-700/60 text-[12.5px] text-stone-400 dark:text-stone-500 cursor-pointer hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleRechazar}
                disabled={!motivo.trim()}
                className="flex-1 h-9 rounded-[10px] bg-red-500 hover:bg-red-600 disabled:opacity-30 text-white text-[12.5px] font-semibold border-0 cursor-pointer transition-colors"
              >
                Confirmar rechazo
              </button>
            </div>
          </div>
        )}

        {/* Nota institucional */}
        <p className="text-[10.5px] text-stone-300 dark:text-stone-600 text-center pb-1">
          La decisión siempre es humana.
        </p>
      </div>
    )
  }