/**
 * VerificationItemWidget — verification:item
 * v3 · Confirmación inline · Textarea autogrow · Evidencia copiable
 * La decisión siempre es humana.
 */

import { useState, useRef, useCallback } from 'react'
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

const CONTEXTO: Record<string, {
  descripcion: string
  evidencia: Array<{ label: string; valor: string; copiable?: boolean }>
}> = {
  monitoreo: {
    descripcion: 'La IA detectó comportamiento inusual mediante análisis de video en tiempo real. El modelo comparó patrones de movimiento contra el baseline del hato.',
    evidencia: [
      { label: 'Secuencia',  valor: '00:12 — 00:34'              },
      { label: 'Anomalía',   valor: '0.91 / 1.0',  copiable: true },
      { label: 'Distancia',  valor: '18.3 m  (umbral 15 m)'      },
      { label: 'Sin movim.', valor: '14 min'                      },
    ],
  },
  sanidad: {
    descripcion: 'El usuario registró manualmente un evento sanitario desde campo. Se requiere verificación antes de indexar en el gemelo digital.',
    evidencia: [
      { label: 'Origen',     valor: 'Registro manual'             },
      { label: 'Fotografía', valor: 'No adjunta'                  },
      { label: 'Firma MVZ',  valor: 'Pendiente'                   },
      { label: 'GPS',        valor: 'UPP Rancho Morales', copiable: true },
    ],
  },
  certificacion: {
    descripcion: 'El sistema recalculó el score de elegibilidad. El nuevo puntaje puede afectar el estatus de certificación del animal.',
    evidencia: [
      { label: 'Score ant.', valor: '68 / 100'                    },
      { label: 'Score nuevo',valor: '74 / 100'                    },
      { label: 'Cambio',     valor: '+6 puntos'                   },
      { label: 'Trigger',    valor: 'Doc. TB actualizado'         },
    ],
  },
  gemelo: {
    descripcion: 'Se registró un nuevo evento en el gemelo digital. Un usuario autorizado debe confirmar la información antes de marcarla como verificada.',
    evidencia: [
      { label: 'Operador',  valor: 'Campo'                        },
      { label: 'GPS',       valor: 'Verificado',    copiable: true },
      { label: 'Evidencia', valor: 'Sin fotografía'               },
    ],
  },
  biometria: {
    descripcion: 'La IA realizó una identificación biométrica por huella de morro. El score está por debajo del umbral de verificación automática.',
    evidencia: [
      { label: 'Motor',     valor: 'Fingerprint CV + ResNet50'    },
      { label: 'Confianza', valor: '0.83 / 1.0',   copiable: true },
      { label: 'Umbral',    valor: '0.90 (auto)'                  },
      { label: 'Estado',    valor: 'Confirmación requerida'       },
    ],
  },
  pasaporte: {
    descripcion: 'Se realizó una actualización en el pasaporte del animal. Por ser documento legal estático, cualquier modificación requiere verificación formal.',
    evidencia: [
      { label: 'Campo',      valor: 'Fotografía oficial'          },
      { label: 'Por',        valor: 'Operador'                    },
      { label: 'Versión',    valor: 'Conservada en historial'     },
    ],
  },
}

const SEV_DOT: Record<string, string> = {
  alta:  'bg-red-400',
  media: 'bg-amber-400',
  baja:  'bg-stone-300 dark:bg-stone-600',
}
const SEV_LABEL: Record<string, string> = { alta: 'Urgente', media: 'Media', baja: 'Baja' }
const SEV_TEXT:  Record<string, string>  = {
  alta:  'text-red-500 dark:text-red-400',
  media: 'text-amber-500 dark:text-amber-400',
  baja:  'text-stone-400 dark:text-stone-500',
}

// ── Campo del expediente ──────────────────────────────────────────────────────
function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-[3px]">
      <span className="text-[10px] font-mono uppercase tracking-[0.1em] text-stone-300 dark:text-stone-600 select-none">
        {label}
      </span>
      <span className="text-[13px] text-stone-600 dark:text-stone-300 leading-snug">{value}</span>
    </div>
  )
}

// ── Fila de evidencia ─────────────────────────────────────────────────────────
function EvidenciaRow({
  idx, label, valor, copiable,
}: { idx: number; label: string; valor: string; copiable?: boolean }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(valor).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }
  return (
    <div className="group flex items-center gap-3 px-3 py-[9px] border-b border-stone-100 dark:border-stone-800/40 last:border-0">
      <span className="text-[10px] font-mono text-stone-200 dark:text-stone-700 w-3 text-right shrink-0 select-none">
        {String(idx + 1).padStart(2, '0')}
      </span>
      <span className="text-[10px] font-mono uppercase tracking-[0.06em] text-stone-300 dark:text-stone-600 w-[72px] shrink-0">
        {label}
      </span>
      <span className="text-[12.5px] font-mono text-stone-500 dark:text-stone-400 flex-1 leading-snug">
        {valor}
      </span>
      {copiable && (
        <button
          onClick={copy}
          className={`shrink-0 transition-all duration-150 border-0 bg-transparent p-0 cursor-pointer ${
            copied
              ? 'text-[#2FAF8F]'
              : 'text-stone-200 dark:text-stone-700 opacity-0 group-hover:opacity-100 hover:text-stone-400 dark:hover:text-stone-500'
          }`}
        >
          {copied
            ? <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
            : <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          }
        </button>
      )}
    </div>
  )
}

export default function VerificationItemWidget({ item, onVerificar, onRechazar, onClose }: Props) {
  const [modo,        setModo]        = useState<'idle' | 'rechazar' | 'observacion'>('idle')
  const [motivo,      setMotivo]      = useState('')
  const [observacion, setObservacion] = useState('')
  const [confirming,  setConfirming]  = useState<'verificar' | 'rechazar' | null>(null)
  const [done,        setDone]        = useState(false)
  const [resultado,   setResultado]   = useState<'verificado' | 'rechazado' | null>(null)
  const taRef = useRef<HTMLTextAreaElement>(null)

  const ctx = CONTEXTO[item.dominio] ?? CONTEXTO['monitoreo']

  const autoGrow = useCallback(() => {
    const el = taRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [])

  const commitVerificar = () => {
    setDone(true); setResultado('verificado')
    setTimeout(() => onVerificar?.(item.id, observacion || undefined), 900)
  }
  const commitRechazar = () => {
    if (!motivo.trim()) return
    setDone(true); setResultado('rechazado')
    setTimeout(() => onRechazar?.(item.id, motivo), 900)
  }

  // ── Estado final ──────────────────────────────────────────────────────────
  if (done) {
    const ok = resultado === 'verificado'
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
        <div className={`w-11 h-11 rounded-full flex items-center justify-center border-2 ${
          ok ? 'border-[#2FAF8F]/40' : 'border-red-300/40 dark:border-red-800/40'
        }`}>
          {ok
            ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2FAF8F" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
            : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          }
        </div>
        <div>
          <p className={`text-[14px] font-semibold mb-1.5 ${ok ? 'text-[#2FAF8F]' : 'text-red-500'}`}>
            {ok ? 'Verificado' : 'Rechazado'}
          </p>
          <p className="text-[11.5px] text-stone-400 dark:text-stone-500 max-w-[220px] leading-relaxed">
            {ok
              ? 'Confirmado. El registro pasa al historial de verificaciones.'
              : 'Rechazo registrado. Se generará una inconsistencia para seguimiento.'
            }
          </p>
        </div>
      </div>
    )
  }

  // ── Pantalla de confirmación inline ──────────────────────────────────────
  if (confirming) {
    const isVer = confirming === 'verificar'
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center border ${
            isVer ? 'border-[#2FAF8F]/30' : 'border-red-300/30 dark:border-red-800/30'
          }`}>
            {isVer
              ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2FAF8F" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
              : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            }
          </div>
          <div>
            <p className="text-[13px] font-semibold text-stone-700 dark:text-stone-200 mb-1">
              {isVer ? '¿Confirmar verificación?' : '¿Confirmar rechazo?'}
            </p>
            <p className="text-[11px] text-stone-400 dark:text-stone-500 max-w-[200px] leading-relaxed">
              {isVer
                ? 'Esta acción quedará firmada con tu usuario y timestamp.'
                : 'El rechazo generará una inconsistencia para seguimiento.'
              }
            </p>
          </div>

          {/* Resumen de la nota/motivo */}
          {((isVer && observacion) || (!isVer && motivo)) && (
            <div className="w-full max-w-[260px] px-3 py-2 rounded-[7px] bg-stone-50 dark:bg-stone-800/30 text-left">
              <p className="text-[9.5px] font-mono uppercase tracking-[0.07em] text-stone-300 dark:text-stone-600 mb-1">
                {isVer ? 'Nota' : 'Motivo'}
              </p>
              <p className="text-[11.5px] text-stone-500 dark:text-stone-400 italic leading-snug">
                {isVer ? observacion : motivo}
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setConfirming(null)}
            className="flex-1 h-9 rounded-[9px] border border-stone-200/80 dark:border-stone-700/60 bg-transparent text-[12px] text-stone-400 dark:text-stone-500 cursor-pointer hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
          >
            Volver
          </button>
          <button
            onClick={isVer ? commitVerificar : commitRechazar}
            className={`flex-[2] h-9 rounded-[9px] text-[12px] font-semibold border cursor-pointer transition-all active:scale-[0.98] ${
              isVer
                ? 'bg-[#2FAF8F] hover:bg-[#27a07f] text-white border-transparent'
                : 'border-red-200 dark:border-red-900/40 bg-transparent text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20'
            }`}
          >
            {isVer ? 'Sí, verificar' : 'Sí, rechazar'}
          </button>
        </div>
      </div>
    )
  }

  // ── Vista principal ───────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-0">

      {/* Encabezado */}
      <div className="flex items-start justify-between gap-3 pb-4">
        <div className="flex items-start gap-3">
          <div className="pt-[5px] shrink-0">
            <span className={`block w-[7px] h-[7px] rounded-full ${SEV_DOT[item.severidad]}`} />
          </div>
          <div>
            <p className="text-[15.5px] font-semibold text-stone-800 dark:text-stone-100 leading-snug mb-1.5">
              {item.accion}
            </p>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11.5px] font-mono text-stone-400 dark:text-stone-500">
                {item.origen === 'ia' ? 'Acción IA' : 'Acción usuario'}
              </span>
              <span className="text-stone-200 dark:text-stone-700 text-[10px]">·</span>
              <span className="text-[11.5px] text-stone-400 dark:text-stone-500">
                {DOMINIO_LABEL[item.dominio] ?? item.dominio}
              </span>
              <span className="text-stone-200 dark:text-stone-700 text-[10px]">·</span>
              <span className={`text-[11.5px] font-medium ${SEV_TEXT[item.severidad]}`}>
                {SEV_LABEL[item.severidad]}
              </span>
            </div>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="w-7 h-7 shrink-0 flex items-center justify-center rounded-lg text-stone-300 dark:text-stone-600 hover:text-stone-500 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800/40 transition-all mt-0.5"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        )}
      </div>

      <div className="h-px bg-stone-100 dark:bg-stone-800/60 mb-4" />

      {/* Expediente */}
      <div className="grid grid-cols-3 gap-4 mb-4 pl-[19px]">
        <Field label="Origen"     value={item.actor} />
        {item.animal
          ? <Field label="Animal" value={`${item.animal} · ${item.arete}`} />
          : <div />
        }
        <Field label="Registrado" value={item.ts} />
      </div>

      <div className="h-px bg-stone-100 dark:bg-stone-800/60 mb-4" />

      {/* Contexto */}
      <div className="pl-[19px] mb-4">
        <p className="text-[10px] font-mono uppercase tracking-[0.1em] text-stone-300 dark:text-stone-600 mb-2 select-none">
          Contexto
        </p>
        <p className="text-[13px] text-stone-500 dark:text-stone-400 leading-relaxed">
          {ctx.descripcion}
        </p>
      </div>

      {/* Evidencia */}
      <div className="pl-[19px] mb-5">
        <p className="text-[10px] font-mono uppercase tracking-[0.1em] text-stone-300 dark:text-stone-600 mb-2 select-none">
          Evidencia
        </p>
        <div className="border border-stone-100 dark:border-stone-800/60 rounded-[9px] overflow-hidden">
          {ctx.evidencia.map((e, i) => (
            <EvidenciaRow key={i} idx={i} label={e.label} valor={e.valor} copiable={e.copiable} />
          ))}
        </div>
      </div>

      <div className="h-px bg-stone-100 dark:bg-stone-800/60 mb-4" />

      {/* Zona de decisión */}
      {modo === 'idle' && (
        <div className="flex flex-col gap-1.5">
          <div className="flex gap-2">
            <button
              onClick={() => setModo('observacion')}
              className="flex-1 h-10 rounded-[9px] border border-stone-200/80 dark:border-stone-700/60 bg-transparent text-[12.5px] font-medium text-stone-400 dark:text-stone-500 cursor-pointer hover:text-stone-700 dark:hover:text-stone-200 hover:border-stone-300 dark:hover:border-stone-500 transition-all duration-150"
            >
              + Nota
            </button>
            <button
              onClick={() => setConfirming('verificar')}
              className="flex-[2] h-10 flex items-center justify-center gap-2 rounded-[9px] bg-[#2FAF8F] hover:bg-[#27a07f] active:scale-[0.98] text-white text-[13px] font-semibold border-0 cursor-pointer transition-all duration-150"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Verificar
            </button>
          </div>
          <button
            onClick={() => setModo('rechazar')}
            className="h-9 border-0 bg-transparent text-[12.5px] font-medium text-stone-300 dark:text-stone-600 cursor-pointer hover:text-red-400 dark:hover:text-red-500 transition-colors duration-150"
          >
            Rechazar
          </button>
        </div>
      )}

      {modo === 'observacion' && (
        <div className="flex flex-col gap-2">
          <textarea
            ref={taRef}
            value={observacion}
            onChange={e => { setObservacion(e.target.value); autoGrow() }}
            placeholder="Observación antes de verificar…"
            rows={2}
            autoFocus
            className="w-full px-3.5 py-3 rounded-[9px] border border-stone-200/80 dark:border-stone-700/60 bg-stone-50 dark:bg-stone-800/30 text-[13px] text-stone-700 dark:text-stone-200 placeholder-stone-300 dark:placeholder-stone-600 outline-none focus:border-stone-300 dark:focus:border-stone-600 resize-none overflow-hidden transition-colors min-h-[64px]"
            style={{ height: 'auto' }}
          />
          <div className="flex gap-2">
            <button onClick={() => setModo('idle')}
              className="flex-1 h-10 rounded-[9px] border border-stone-200/80 dark:border-stone-700/60 text-[12.5px] text-stone-400 dark:text-stone-500 cursor-pointer hover:text-stone-600 dark:hover:text-stone-300 transition-colors">
              Cancelar
            </button>
            <button onClick={() => setConfirming('verificar')}
              className="flex-[2] h-10 rounded-[9px] bg-[#2FAF8F] hover:bg-[#27a07f] text-white text-[13px] font-semibold border-0 cursor-pointer transition-colors">
              Verificar con nota
            </button>
          </div>
        </div>
      )}

      {modo === 'rechazar' && (
        <div className="flex flex-col gap-2">
          <textarea
            ref={taRef}
            value={motivo}
            onChange={e => { setMotivo(e.target.value); autoGrow() }}
            placeholder="Motivo del rechazo (requerido)…"
            rows={2}
            autoFocus
            className="w-full px-3.5 py-3 rounded-[9px] border border-stone-200/80 dark:border-stone-700/60 bg-stone-50 dark:bg-stone-800/30 text-[13px] text-stone-700 dark:text-stone-200 placeholder-stone-300 dark:placeholder-stone-600 outline-none focus:border-red-300 dark:focus:border-red-800/60 resize-none overflow-hidden transition-colors min-h-[64px]"
            style={{ height: 'auto' }}
          />
          <div className="flex gap-2">
            <button onClick={() => setModo('idle')}
              className="flex-1 h-10 rounded-[9px] border border-stone-200/80 dark:border-stone-700/60 text-[12.5px] text-stone-400 dark:text-stone-500 cursor-pointer hover:text-stone-600 dark:hover:text-stone-300 transition-colors">
              Cancelar
            </button>
            <button
              onClick={() => { if (motivo.trim()) setConfirming('rechazar') }}
              disabled={!motivo.trim()}
              className="flex-[2] h-10 rounded-[9px] border border-red-200 dark:border-red-900/40 bg-transparent text-[13px] font-semibold text-red-500 dark:text-red-400 cursor-pointer hover:bg-red-50 dark:hover:bg-red-950/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              Continuar
            </button>
          </div>
        </div>
      )}

      {/* Firma institucional */}
      <p className="text-[9px] font-mono text-stone-200 dark:text-stone-700 text-center mt-5 select-none tracking-widest uppercase">
        La decisión siempre es humana
      </p>
    </div>
  )
}