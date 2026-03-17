/**
 * VerificationColaWidget
 * v2 — header impactante, KPIs tintados, filas con severidad visual, tags de dominio/origen.
 */
export interface ItemVerificacion {
  id:        number
  ts:        string
  origen:    'ia' | 'usuario'
  actor:     string
  dominio:   string
  accion:    string
  animal?:   string
  arete?:    string
  severidad: 'alta' | 'media' | 'baja'
  estado:    'pendiente' | 'verificado' | 'rechazado'
}

interface Props {
  items:         ItemVerificacion[]
  onSelectItem?: (item: ItemVerificacion) => void
}

const DOMINIO_LABEL: Record<string, string> = {
  monitoreo:     'Monitoreo',
  sanidad:       'Sanidad',
  certificacion: 'Certificación',
  gemelo:        'Gemelo',
  biometria:     'Biometría',
  pasaporte:     'Pasaporte',
}

// ─── Config severidad ─────────────────────────────────────────────────────────

const SEV_CONFIG: Record<string, { color: string; bg: string; text: string; icon: JSX.Element }> = {
  alta: {
    color: '#e11d48', bg: '#ffe4e6', text: '#9f1239',
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#e11d48" strokeWidth="2.5" strokeLinecap="round">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    ),
  },
  media: {
    color: '#d97706', bg: '#fef3c7', text: '#92400e',
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    ),
  },
  baja: {
    color: 'var(--color-text-tertiary)', bg: 'var(--color-background-secondary)', text: 'var(--color-text-secondary)',
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-stone-400 dark:text-stone-500">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    ),
  },
}

const DOMINIO_ICON: Record<string, JSX.Element> = {
  sanidad: (
    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
    </svg>
  ),
  monitoreo: (
    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  ),
  certificacion: (
    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
    </svg>
  ),
  gemelo: (
    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
    </svg>
  ),
  biometria: (
    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  pasaporte: (
    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
    </svg>
  ),
  default: (
    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <circle cx="12" cy="12" r="10"/>
    </svg>
  ),
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

export default function VerificationColaWidget({ items, onSelectItem }: Props) {
  const pendientes  = items.filter(i => i.estado === 'pendiente')
  const altaCount   = pendientes.filter(i => i.severidad === 'alta').length
  const mediaCount  = pendientes.filter(i => i.severidad === 'media').length
  const bajaCount   = pendientes.filter(i => i.severidad === 'baja').length
  const headerColor = altaCount > 0 ? '#e11d48' : mediaCount > 0 ? '#d97706' : '#2FAF8F'
  const headerBg    = altaCount > 0 ? '#ffe4e6'  : mediaCount > 0 ? '#fef3c7'  : '#2FAF8F18'
  const headerText  = altaCount > 0 ? '#9f1239'  : mediaCount > 0 ? '#92400e'  : '#1a8c6e'

  return (
    <div className="flex flex-col h-full">

      {/* ── Header ── */}
      <div className="bg-white dark:bg-[#1c1917] border border-stone-200/60 dark:border-stone-800/50 rounded-[16px] overflow-hidden mb-3.5 shrink-0">
        <div className="h-[5px] w-full" style={{ background: headerColor }} />
        <div className="flex items-stretch">
          <div className="flex-1 px-5 pt-[18px] pb-4">
            <p className="text-[10px] text-stone-400 dark:text-stone-500 tracking-[0.07em] uppercase mb-2.5">
              Cola de verificación
            </p>
            <div className="flex items-flex-end gap-2 mb-2">
              <span className="text-[56px] font-medium leading-none tabular-nums" style={{ color: headerColor }}>
                {pendientes.length}
              </span>
              <span className="text-[16px] text-stone-300 dark:text-stone-600 self-end mb-2">pendientes</span>
            </div>
            <p className="text-[11px] text-stone-400 dark:text-stone-500 mb-3">
              acciones que requieren verificación humana
            </p>
            <div
              className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full"
              style={{ background: headerBg, color: headerText }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0 animate-pulse"
                style={{ background: headerColor }}
              />
              {altaCount > 0
                ? `${altaCount} urgente${altaCount > 1 ? 's' : ''} · acción requerida`
                : 'Sin urgentes'
              }
            </div>
          </div>
          <div className="w-[86px] flex flex-col items-center justify-center gap-1.5 px-4 border-l border-stone-100 dark:border-stone-800/40 bg-stone-50/70 dark:bg-stone-900/30">
            <Ring value={pendientes.length} total={items.length} color={headerColor} />
            <span className="text-[10px] text-stone-400 dark:text-stone-500">del total</span>
          </div>
        </div>
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-3 gap-2 mb-4 shrink-0">
        {[
          { n: altaCount,  label: 'Alta',  color: '#e11d48', bg: '#fff5f5', text: '#9f1239', track: '#fecdd3' },
          { n: mediaCount, label: 'Media', color: '#d97706', bg: '#fffbeb', text: '#92400e', track: '#fde68a' },
          { n: bajaCount,  label: 'Baja',  color: 'var(--color-text-secondary)', bg: 'var(--color-background-secondary)', text: 'var(--color-text-secondary)', track: 'var(--color-border-tertiary)' },
        ].map(k => (
          <div key={k.label} className="relative rounded-[12px] px-3.5 pt-5 pb-3 overflow-hidden"
            style={{ background: k.bg }}>
            <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: k.color }} />
            <p className="text-[28px] font-medium leading-none tabular-nums mb-1" style={{ color: k.text }}>{k.n}</p>
            <p className="text-[10.5px] mb-2" style={{ color: k.text }}>{k.label} severidad</p>
            <div className="h-[3px] rounded-full overflow-hidden" style={{ background: k.track }}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pendientes.length > 0 ? (k.n / pendientes.length) * 100 : 0}%`, background: k.color }} />
            </div>
          </div>
        ))}
      </div>

      {/* ── Lista ── */}
      <p className="text-[10px] text-stone-400 dark:text-stone-500 tracking-[0.07em] uppercase mb-2.5 px-0.5 shrink-0">
        Pendientes de revisión
      </p>

      <div className="flex-1 min-h-0 overflow-y-auto
        [&::-webkit-scrollbar]:w-[3px]
        [&::-webkit-scrollbar-track]:bg-transparent
        [&::-webkit-scrollbar-thumb]:bg-stone-200
        [&::-webkit-scrollbar-thumb]:dark:bg-stone-700/80
        [&::-webkit-scrollbar-thumb]:rounded-full">

        {pendientes.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="1.5" strokeLinecap="round" className="text-stone-200 dark:text-stone-700">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <p className="text-[12px] text-stone-300 dark:text-stone-600">Todo verificado</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {pendientes.map(item => {
              const sev    = SEV_CONFIG[item.severidad] ?? SEV_CONFIG.baja
              const domIco = DOMINIO_ICON[item.dominio]  ?? DOMINIO_ICON.default
              const domLbl = DOMINIO_LABEL[item.dominio] ?? item.dominio
              const isSevColor = item.severidad !== 'baja'

              return (
                <div
                  key={item.id}
                  onClick={() => onSelectItem?.(item)}
                  className="flex items-start gap-3 px-4 py-3.5 bg-white dark:bg-[#1c1917] border border-stone-200/60 dark:border-stone-800/50 rounded-[12px] cursor-pointer transition-all hover:border-stone-300 dark:hover:border-stone-700 hover:bg-stone-50/80 dark:hover:bg-[#1a1917]/80"
                >
                  {/* Severidad */}
                  <div className="flex flex-col items-center gap-1 shrink-0 pt-0.5">
                    <div className="w-[28px] h-[28px] rounded-[8px] flex items-center justify-center"
                      style={{ background: sev.bg }}>
                      {sev.icon}
                    </div>
                    <span className="text-[9px] font-medium tracking-wide uppercase"
                      style={{ color: sev.color }}>
                      {item.severidad}
                    </span>
                  </div>

                  {/* Cuerpo */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-stone-800 dark:text-stone-100 leading-snug mb-2">
                      {item.accion}
                    </p>
                    <div className="flex items-center flex-wrap gap-1.5">
                      <span
                        className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-[3px] rounded-full border"
                        style={isSevColor
                          ? { background: sev.bg, borderColor: sev.color + '55', color: sev.text }
                          : { background: 'var(--color-background-secondary)', borderColor: 'var(--color-border-tertiary)', color: 'var(--color-text-secondary)' }
                        }
                      >
                        {domIco}{domLbl}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] px-2 py-[3px] rounded-full border bg-stone-50 dark:bg-stone-800/30 border-stone-200/60 dark:border-stone-700/40 text-stone-400 dark:text-stone-500">
                        {item.origen === 'ia' ? (
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
                          </svg>
                        ) : (
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
                          </svg>
                        )}
                        {item.origen === 'ia' ? 'IA' : 'Usuario'}
                      </span>
                      {item.animal && (
                        <span className="font-mono text-[10.5px] text-stone-400 dark:text-stone-500">
                          {item.animal}{item.arete ? ` · ${item.arete}` : ''}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Derecha */}
                  <div className="flex flex-col items-end justify-between gap-3 shrink-0 self-stretch">
                    <span className="text-[10px] text-stone-300 dark:text-stone-600 whitespace-nowrap">{item.ts}</span>
                    <div className="w-6 h-6 rounded-[6px] bg-stone-100 dark:bg-stone-800/50 flex items-center justify-center">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        strokeWidth="2" strokeLinecap="round" className="text-stone-400 dark:text-stone-500">
                        <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                      </svg>
                    </div>
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