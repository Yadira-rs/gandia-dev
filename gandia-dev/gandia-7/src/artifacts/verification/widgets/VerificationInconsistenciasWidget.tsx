/**
 * VerificationInconsistenciasWidget — verification:inconsistencias
 * v4 · Cards 3D minimalistas estilo Pixel Point · Sin líneas de color
 */

export interface Inconsistencia {
  id:                number
  tipo:              'sin_verificar' | 'rechazado_sin_seguimiento' | 'conflicto'
  tiempoSinAtencion: string
  accion:            string
  actor:             string
  dominio:           string
  animal?:           string
  arete?:            string
  detalle:           string
  critico:           boolean
}

interface Props {
  inconsistencias: Inconsistencia[]
  onAtender?:      (id: number) => void
}

const DOMINIO_LABEL: Record<string, string> = {
  monitoreo:     'Monitoreo',
  sanidad:       'Sanidad',
  certificacion: 'Certificación',
  gemelo:        'Gemelo',
  biometria:     'Biometría',
  pasaporte:     'Pasaporte',
}

const TIPO: Record<string, { label: string; dot: string }> = {
  sin_verificar:             { label: 'Sin verificar',      dot: 'bg-amber-400'  },
  rechazado_sin_seguimiento: { label: 'Sin seguimiento',    dot: 'bg-red-400'    },
  conflicto:                 { label: 'Conflicto de datos', dot: 'bg-purple-400' },
}

// Aging: color del tiempo sin atención
function timeColor(t: string): string {
  if (t.includes('día') || (t.includes('hora') && parseInt(t) > 12)) return 'text-red-400 dark:text-red-500'
  if (t.includes('hora')) return 'text-amber-500 dark:text-amber-400'
  return 'text-stone-300 dark:text-stone-600'
}

// Sombra tipo Pixel Point — capas finas que crean profundidad
const CARD_SHADOW = {
  normal:   'box-shadow: 0 1px 0 rgba(255,255,255,0.9) inset, 0 1px 2px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.04)',
  critico:  'box-shadow: 0 1px 0 rgba(255,255,255,0.9) inset, 0 1px 2px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.05)',
}

// Icono dentro del badge según tipo e urgencia
function TipoIcon({ tipo, critico }: { tipo: string; critico: boolean }) {
  if (tipo === 'rechazado_sin_seguimiento' || critico) {
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-red-400 dark:text-red-500">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    )
  }
  if (tipo === 'sin_verificar') {
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-amber-400 dark:text-amber-500">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
    )
  }
  // conflicto
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-purple-400 dark:text-purple-500">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  )
}

export default function VerificationInconsistenciasWidget({ inconsistencias, onAtender }: Props) {
  const criticas = inconsistencias.filter(i => i.critico).length

  const sorted = [...inconsistencias].sort((a, b) => {
    if (a.critico && !b.critico) return -1
    if (!a.critico && b.critico) return 1
    return 0
  })

  return (
    <div className="flex flex-col gap-0">

      {/* ── Stat bar ─────────────────────────────────────────────────── */}
      <div className="flex items-end gap-3 pb-5">
        <span className="text-[30px] font-semibold tracking-tight text-stone-800 dark:text-stone-100 leading-none tabular-nums">
          {inconsistencias.length}
        </span>
        <div className="flex items-center gap-3 pb-[3px]">
          <span className="text-[12px] text-stone-400 dark:text-stone-500">
            {inconsistencias.length === 1 ? 'inconsistencia' : 'inconsistencias'}
          </span>
          {criticas > 0 && (
            <>
              <span className="text-stone-200 dark:text-stone-700 text-[10px] select-none">·</span>
              <div className="flex items-center gap-1.5">
                <span className="w-[6px] h-[6px] rounded-full bg-red-400 shrink-0" />
                <span className="text-[12px] text-red-400 dark:text-red-500 tabular-nums">
                  {criticas} crítica{criticas > 1 ? 's' : ''}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Divisor ──────────────────────────────────────────────────── */}
      <div className="h-px bg-stone-100 dark:bg-stone-800/60 mb-3" />

      {/* ── Cards ────────────────────────────────────────────────────── */}
      {inconsistencias.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-14">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-stone-200 dark:text-stone-700">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <p className="text-[11.5px] text-stone-300 dark:text-stone-600 tracking-wide">Sin inconsistencias</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5 pt-1">
          {sorted.map(inc => {
            const tipo = TIPO[inc.tipo]
            return (
              <div
                key={inc.id}
                className="rounded-[14px] bg-white dark:bg-stone-800 overflow-hidden"
                style={{
                  boxShadow: inc.critico
                    ? '0 0 0 1px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.06), 0 8px 20px rgba(0,0,0,0.07)'
                    : '0 0 0 1px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.04), 0 6px 16px rgba(0,0,0,0.05)',
                }}
              >
                {/* ── Header: icono badge + accion + ts ── */}
                <div className="flex items-center gap-3 px-4 pt-4 pb-3.5">
                  {/* Icon badge */}
                  <div
                    className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 bg-stone-100 dark:bg-stone-700"
                    style={{
                      boxShadow: '0 0 0 1px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.05)',
                    }}
                  >
                    <TipoIcon tipo={inc.tipo} critico={inc.critico} />
                  </div>

                  {/* Título + subtítulo */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[13.5px] font-semibold text-stone-800 dark:text-stone-100 leading-snug truncate">
                      {inc.accion}
                    </p>
                    <p className="text-[11.5px] text-stone-400 dark:text-stone-500 mt-[1px]">
                      {tipo.label} · {DOMINIO_LABEL[inc.dominio] ?? inc.dominio}
                    </p>
                  </div>
                </div>

                {/* ── Divisor ── */}
                <div className="h-px bg-stone-100 dark:bg-stone-800/60 mx-4" />

                {/* ── Filas de datos (estilo Pixel Point) ── */}
                <div className="px-4 py-3 flex flex-col gap-0">

                  {/* Tiempo sin atención */}
                  <div className="flex items-center justify-between py-[7px]">
                    <div className="flex items-center gap-2">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="text-stone-300 dark:text-stone-600">
                        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                      </svg>
                      <span className="text-[12px] text-stone-400 dark:text-stone-500">Sin atención</span>
                    </div>
                    <span className={`text-[12px] font-semibold font-mono tabular-nums ${timeColor(inc.tiempoSinAtencion)}`}>
                      {inc.tiempoSinAtencion}
                    </span>
                  </div>

                  {/* Animal (si existe) */}
                  {inc.animal && (
                    <>
                      <div className="h-px bg-stone-100 dark:bg-stone-800/40" />
                      <div className="flex items-center justify-between py-[7px]">
                        <div className="flex items-center gap-2">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="text-stone-300 dark:text-stone-600">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
                          </svg>
                          <span className="text-[12px] text-stone-400 dark:text-stone-500">Animal</span>
                        </div>
                        <span className="text-[12px] font-semibold text-stone-600 dark:text-stone-300 font-mono">
                          {inc.animal}
                        </span>
                      </div>
                    </>
                  )}

                  {/* Detalle */}
                  <div className="h-px bg-stone-100 dark:bg-stone-800/40" />
                  <div className="flex items-start gap-2 py-[7px]">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="text-stone-300 dark:text-stone-600 mt-[2px] shrink-0">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    <span className="text-[12px] text-stone-400 dark:text-stone-500 leading-relaxed">
                      {inc.detalle}
                    </span>
                  </div>
                </div>

                {/* ── CTA footer ── */}
                {onAtender && (
                  <>
                    <div className="h-px bg-stone-100 dark:bg-stone-800/60 mx-4" />
                    <div className="px-4 py-3">
                      <button
                        onClick={() => onAtender(inc.id)}
                        className="text-[12px] font-medium text-stone-400 dark:text-stone-500 hover:text-stone-800 dark:hover:text-stone-100 underline underline-offset-2 decoration-stone-200 dark:decoration-stone-700 hover:decoration-stone-400 dark:hover:decoration-stone-500 bg-transparent border-0 p-0 cursor-pointer transition-all duration-150"
                      >
                        Atender →
                      </button>
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}