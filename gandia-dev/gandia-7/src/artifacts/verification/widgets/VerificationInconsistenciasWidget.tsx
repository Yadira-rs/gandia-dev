import type { ReactNode } from 'react'

/**
 * VerificationInconsistenciasWidget
 * v2 — header impactante, KPIs tintados, cards con tipo visual, detalle legible, botón claro.
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

// ─── Config por tipo ──────────────────────────────────────────────────────────

const TIPO_CONFIG: Record<string, {
  label:  string
  color:  string
  bg:     string
  text:   string
  border: string
  track:  string
  icon:   ReactNode
}> = {
  sin_verificar: {
    label: 'Sin verificar', color: '#d97706', bg: '#fef3c7', text: '#92400e', border: '#fde68a', track: '#fde68a',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    ),
  },
  rechazado_sin_seguimiento: {
    label: 'Sin seguimiento', color: '#e11d48', bg: '#ffe4e6', text: '#9f1239', border: '#fca5a5', track: '#fecdd3',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e11d48" strokeWidth="2" strokeLinecap="round">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    ),
  },
  conflicto: {
    label: 'Conflicto', color: '#7c3aed', bg: '#f5f3ff', text: '#4c1d95', border: '#ddd6fe', track: '#ddd6fe',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    ),
  },
}

const CIRCUMFERENCE = 2 * Math.PI * 22

function Ring({ value, total, color }: { value: number; total: number; color: string }) {
  const offset = CIRCUMFERENCE * (1 - (total > 0 ? value / total : 0))
  return (
    <svg width="56" height="56" viewBox="0 0 56 56">
      <circle cx="28" cy="28" r="22" fill="none"
        stroke="currentColor" className="text-stone-100 dark:text-stone-800" strokeWidth="5" />
      <circle cx="28" cy="28" r="22" fill="none"
        stroke={color} strokeWidth="5"
        strokeDasharray={CIRCUMFERENCE}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 28 28)"
        style={{ transition: 'stroke-dashoffset 0.7s ease' }}
      />
      <text x="28" y="32" textAnchor="middle" fontSize="11" fontWeight="500"
        fill={color} fontFamily="sans-serif">
        {value}/{total}
      </text>
    </svg>
  )
}

// ─── Componente ───────────────────────────────────────────────────────────────

export default function VerificationInconsistenciasWidget({ inconsistencias, onAtender }: Props) {
  const criticas   = inconsistencias.filter(i => i.critico).length
  const sinVerif   = inconsistencias.filter(i => i.tipo === 'sin_verificar').length
  const sinSeg     = inconsistencias.filter(i => i.tipo === 'rechazado_sin_seguimiento').length
  const conflictos = inconsistencias.filter(i => i.tipo === 'conflicto').length
  const total      = inconsistencias.length
  const headerColor = criticas > 0 ? '#e11d48' : '#d97706'
  const headerBg    = criticas > 0 ? '#ffe4e6'  : '#fef3c7'
  const headerText  = criticas > 0 ? '#9f1239'  : '#92400e'

  return (
    <div className="flex flex-col h-full">

      {/* ── Header ── */}
      <div className="bg-white dark:bg-[#1c1917] border border-stone-200/60 dark:border-stone-800/50 rounded-[16px] overflow-hidden mb-3.5 shrink-0">
        <div className="h-[5px] w-full" style={{ background: headerColor }} />
        <div className="flex items-stretch">
          <div className="flex-1 px-5 pt-[18px] pb-4">
            <p className="text-[10px] text-stone-400 dark:text-stone-500 tracking-[0.07em] uppercase mb-2.5">
              Inconsistencias
            </p>
            <div className="flex items-flex-end gap-2 mb-2">
              <span className="text-[56px] font-medium leading-none tabular-nums" style={{ color: headerColor }}>
                {total}
              </span>
              <span className="text-[16px] text-stone-300 dark:text-stone-600 self-end mb-2">detectadas</span>
            </div>
            <p className="text-[11px] text-stone-400 dark:text-stone-500 mb-3">
              acciones sin atención o en conflicto
            </p>
            <div
              className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full"
              style={{ background: headerBg, color: headerText }}
            >
              <span className="w-1.5 h-1.5 rounded-full shrink-0 animate-pulse" style={{ background: headerColor }} />
              {criticas > 0
                ? `${criticas} crítica${criticas > 1 ? 's' : ''} · requieren acción inmediata`
                : 'Sin críticas'
              }
            </div>
          </div>
          <div className="w-[86px] flex flex-col items-center justify-center gap-1.5 px-4 border-l border-stone-100 dark:border-stone-800/40 bg-stone-50/70 dark:bg-stone-900/30">
            <Ring value={criticas} total={total} color={headerColor} />
            <span className="text-[10px] text-stone-400 dark:text-stone-500">críticas</span>
          </div>
        </div>
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-3 gap-2 mb-4 shrink-0">
        {[
          { n: sinVerif,   label: 'Sin verificar',   color: '#d97706', bg: '#fffbeb', text: '#92400e', track: '#fde68a' },
          { n: sinSeg,     label: 'Sin seguimiento', color: '#e11d48', bg: '#fff5f5', text: '#9f1239', track: '#fecdd3' },
          { n: conflictos, label: 'Conflictos',      color: '#7c3aed', bg: '#f5f3ff', text: '#4c1d95', track: '#ddd6fe' },
        ].map(k => (
          <div key={k.label} className="relative rounded-[12px] px-3.5 pt-5 pb-3 overflow-hidden"
            style={{ background: k.bg }}>
            <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: k.color }} />
            <p className="text-[28px] font-medium leading-none tabular-nums mb-1" style={{ color: k.text }}>{k.n}</p>
            <p className="text-[10.5px] mb-2" style={{ color: k.text }}>{k.label}</p>
            <div className="h-[3px] rounded-full overflow-hidden" style={{ background: k.track }}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${total > 0 ? (k.n / total) * 100 : 0}%`, background: k.color }} />
            </div>
          </div>
        ))}
      </div>

      {/* ── Lista ── */}
      <p className="text-[10px] text-stone-400 dark:text-stone-500 tracking-[0.07em] uppercase mb-2.5 px-0.5 shrink-0">
        Pendientes de atención
      </p>

      <div className="flex-1 min-h-0 overflow-y-auto
        [&::-webkit-scrollbar]:w-[3px]
        [&::-webkit-scrollbar-track]:bg-transparent
        [&::-webkit-scrollbar-thumb]:bg-stone-200
        [&::-webkit-scrollbar-thumb]:dark:bg-stone-700/80
        [&::-webkit-scrollbar-thumb]:rounded-full">

        {inconsistencias.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="1.5" strokeLinecap="round" className="text-stone-200 dark:text-stone-700">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <p className="text-[12px] text-stone-300 dark:text-stone-600">Sin inconsistencias</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {inconsistencias.map(inc => {
              const cfg    = TIPO_CONFIG[inc.tipo] ?? TIPO_CONFIG.sin_verificar
              const domLbl = DOMINIO_LABEL[inc.dominio] ?? inc.dominio

              return (
                <div key={inc.id} className="bg-white dark:bg-[#1c1917] border border-stone-200/60 dark:border-stone-800/50 rounded-[12px] overflow-hidden">

                  {/* Top */}
                  <div className="flex items-start gap-3 px-4 pt-3.5 pb-3">
                    <div className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0"
                      style={{ background: cfg.bg }}>
                      {cfg.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <p className="text-[13px] font-medium text-stone-800 dark:text-stone-100 leading-snug">
                          {inc.accion}
                        </p>
                        <span className="text-[10px] text-stone-300 dark:text-stone-600 whitespace-nowrap shrink-0 mt-0.5">
                          {inc.tiempoSinAtencion}
                        </span>
                      </div>
                      <div className="flex items-center flex-wrap gap-1.5">
                        <span
                          className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-[3px] rounded-full border"
                          style={{ background: cfg.bg, borderColor: cfg.border, color: cfg.text }}
                        >
                          {cfg.label}
                        </span>
                        <span className="inline-flex items-center text-[11px] px-2 py-[3px] rounded-full border bg-stone-50 dark:bg-stone-800/30 border-stone-200/60 dark:border-stone-700/40 text-stone-400 dark:text-stone-500">
                          {domLbl}
                        </span>
                        {(inc.animal || inc.arete) && (
                          <span className="font-mono text-[10.5px] text-stone-400 dark:text-stone-500">
                            {[inc.animal, inc.arete].filter(Boolean).join(' · ')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Detalle */}
                  <div className="px-4 pb-3">
                    <div
                      className="px-3 py-2.5 rounded-[8px] border-l-[3px]"
                      style={{
                        background:  `${cfg.color}08`,
                        borderColor: cfg.color,
                      }}
                    >
                      <p className="text-[10px] text-stone-400 dark:text-stone-500 mb-1">Detalle</p>
                      <p className="text-[12px] leading-relaxed text-stone-500 dark:text-stone-400">{inc.detalle}</p>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between px-4 pb-3.5 pt-1 border-t border-stone-100 dark:border-stone-800/40">
                    {inc.critico ? (
                      <span
                        className="inline-flex items-center gap-1 text-[10.5px] font-medium px-2.5 py-1 rounded-full"
                        style={{ background: '#ffe4e6', color: '#9f1239' }}
                      >
                        <span className="w-[5px] h-[5px] rounded-full shrink-0" style={{ background: '#e11d48' }} />
                        Crítico
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10.5px] font-medium px-2.5 py-1 rounded-full bg-stone-50 dark:bg-stone-800/30 text-stone-400 dark:text-stone-500">
                        <span className="w-[5px] h-[5px] rounded-full shrink-0 bg-stone-300 dark:bg-stone-600" />
                        No crítico
                      </span>
                    )}
                    {onAtender && (
                      <button
                        type="button"
                        onClick={() => onAtender(inc.id)}
                        className="text-[11.5px] font-medium px-3.5 py-1.5 rounded-[8px] border bg-transparent cursor-pointer transition-all"
                        style={{ color: '#2FAF8F', borderColor: '#2FAF8F55' }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background  = '#2FAF8F12'
                          e.currentTarget.style.borderColor = '#2FAF8F'
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background  = 'transparent'
                          e.currentTarget.style.borderColor = '#2FAF8F55'
                        }}
                      >
                        Atender →
                      </button>
                    )}
                  </div>

                </div>
              )
            })}
          </div>
        )}
      </div>

    </div>
  )
}