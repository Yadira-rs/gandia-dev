/**
 * CertificationVencimientosWidget
 * v2 — hero ligero, anillos SVG de tiempo, headers refinados, filas con aire, botones pill.
 */
export interface Vencimiento {
  id:            number
  animal:        string
  arete:         string
  tipoCert:      string
  autoridad:     string
  fechaVence:    string
  diasRestantes: number
  lote?:         string
  corral?:       string
}

interface Props {
  vencimientos: Vencimiento[]
  onVerCert?:   (v: Vencimiento) => void
  onRenovar?:   (v: Vencimiento) => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CIRCUMFERENCE = 2 * Math.PI * 20 // r=20 → 125.7

function diasOffset(dias: number): number {
  if (dias < 0)   return CIRCUMFERENCE
  if (dias <= 30) return CIRCUMFERENCE * (1 - dias / 30)
  return 0
}

function diasColor(dias: number): string {
  if (dias < 0)   return '#e11d48'
  if (dias <= 7)  return '#e11d48'
  if (dias <= 30) return '#d97706'
  return '#2FAF8F'
}

function diasTrack(dias: number): string {
  if (dias < 0)   return '#ffe4e6'
  if (dias <= 7)  return '#ffe4e6'
  if (dias <= 30) return '#fef3c7'
  return '#2FAF8F18'
}

// ─── Anillo de días ───────────────────────────────────────────────────────────

function DiasRing({ dias }: { dias: number }) {
  const color  = diasColor(dias)
  const track  = diasTrack(dias)
  const offset = diasOffset(dias)
  const label  = dias < 0 ? String(dias) : dias > 99 ? String(dias) : String(dias)

  return (
    <div className="relative w-[52px] h-[52px]">
      <svg width="52" height="52" viewBox="0 0 52 52" className="absolute inset-0">
        <circle cx="26" cy="26" r="20" fill="none" stroke={track} strokeWidth="4" />
        <circle cx="26" cy="26" r="20" fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 26 26)"
          style={{ transition: 'stroke-dashoffset 0.7s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-0">
        <span
          className="font-medium leading-none tabular-nums"
          style={{ color, fontSize: label.length > 3 ? '11px' : '16px' }}
        >
          {dias < 0 ? dias : dias}
        </span>
        <span className="text-[8.5px] text-stone-400 dark:text-stone-500 mt-0.5">días</span>
      </div>
    </div>
  )
}

// ─── Componente ───────────────────────────────────────────────────────────────

export default function CertificationVencimientosWidget({ vencimientos, onVerCert, onRenovar }: Props) {
  const sorted   = [...vencimientos].sort((a, b) => a.diasRestantes - b.diasRestantes)
  const vencidos = sorted.filter(v => v.diasRestantes < 0)
  const urgentes = sorted.filter(v => v.diasRestantes >= 0 && v.diasRestantes <= 7)
  const proximos = sorted.filter(v => v.diasRestantes > 7  && v.diasRestantes <= 30)
  const ok       = sorted.filter(v => v.diasRestantes > 30)
  const total    = vencimientos.length

  const renderFila = (v: Vencimiento) => {
    const color   = diasColor(v.diasRestantes)
    const isUrgent = v.diasRestantes <= 30

    return (
      <div
        key={v.id}
        onClick={() => onVerCert?.(v)}
        className="grid gap-3.5 px-4 py-4 bg-white dark:bg-[#1c1917] border-b border-stone-100 dark:border-stone-800/40 cursor-pointer transition-colors hover:bg-stone-50/80 dark:hover:bg-stone-900/30 last:border-b-0"
        style={{ gridTemplateColumns: '60px 1fr auto', alignItems: 'center' }}
      >
        {/* Anillo */}
        <div className="flex justify-center">
          <DiasRing dias={v.diasRestantes} />
        </div>

        {/* Info */}
        <div className="min-w-0">
          <p className="font-mono text-[10.5px] text-stone-400 dark:text-stone-500 mb-0.5">{v.arete}</p>
          <p className="text-[13.5px] font-medium text-stone-800 dark:text-stone-100 truncate mb-0.5">
            {v.animal || <span className="italic text-stone-400">Sin nombre</span>}
          </p>
          <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate mb-0.5">{v.tipoCert}</p>
          {(v.lote || v.corral) && (
            <p className="font-mono text-[10px] text-stone-300 dark:text-stone-600">
              {[v.lote, v.corral].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>

        {/* Acciones */}
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <span className="text-[11px] text-stone-400 dark:text-stone-500 whitespace-nowrap">{v.fechaVence}</span>
          {isUrgent && onRenovar ? (
            <button
              type="button"
              onClick={e => { e.stopPropagation(); onRenovar(v) }}
              className="inline-flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-full border bg-transparent cursor-pointer transition-all"
              style={{ color: '#2FAF8F', borderColor: '#2FAF8F55' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#2FAF8F12'; e.currentTarget.style.borderColor = '#2FAF8F' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#2FAF8F55' }}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="23 4 23 10 17 10"/>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
              </svg>
              Renovar
            </button>
          ) : onVerCert ? (
            <button
              type="button"
              onClick={e => { e.stopPropagation(); onVerCert(v) }}
              className="inline-flex items-center text-[11px] font-medium px-3 py-1.5 rounded-full border bg-transparent cursor-pointer transition-all border-stone-200/70 dark:border-stone-700/60 text-stone-400 dark:text-stone-500"
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-background-secondary)'; e.currentTarget.style.color = 'var(--color-text-primary)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '' }}
            >
              Ver cert.
            </button>
          ) : null}
        </div>
      </div>
    )
  }

  const renderGroup = (
    items: Vencimiento[],
    label: string,
    dotColor: string,
    badgeBg: string,
    badgeText: string,
    headStyle?: React.CSSProperties,
    bodyBorder?: string,
  ) => {
    if (!items.length) return null
    return (
      <div className="mb-3">
        <div
          className="flex items-center gap-2 px-3.5 py-2.5 rounded-t-[12px] border border-b-0"
          style={{ borderColor: bodyBorder ?? 'var(--color-border-tertiary)', background: 'var(--color-background-secondary)', ...headStyle }}
        >
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: dotColor }} />
          <span className="text-[12px] font-medium text-stone-600 dark:text-stone-300 flex-1">{label}</span>
          <span
            className="text-[10px] font-medium px-2 py-0.5 rounded-full"
            style={{ background: badgeBg, color: badgeText }}
          >
            {items.length} cert{items.length > 1 ? 's' : ''}.
          </span>
        </div>
        <div
          className="rounded-b-[12px] overflow-hidden border border-t-0"
          style={{ borderColor: bodyBorder ?? 'var(--color-border-tertiary)' }}
        >
          {items.map(renderFila)}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col">

      {/* ── Hero ── */}
      <div className="bg-white dark:bg-[#1c1917] border border-stone-200/60 dark:border-stone-800/50 rounded-[16px] overflow-hidden mb-4">
        <div className="px-5 pt-[18px] pb-4">
          <p className="text-[10px] text-stone-400 dark:text-stone-500 tracking-[0.07em] uppercase mb-4">
            Vencimientos · {total} certificacion{total !== 1 ? 'es' : ''}
          </p>
          <div className="grid grid-cols-4 gap-0">
            {[
              { n: vencidos.length,  label: 'Vencido',      color: '#e11d48' },
              { n: urgentes.length,  label: 'Esta semana',  color: '#e11d48' },
              { n: proximos.length,  label: 'Próximos 30d', color: '#d97706' },
              { n: ok.length,        label: 'Vigentes',     color: '#2FAF8F' },
            ].map((k, i) => (
              <div
                key={k.label}
                className="flex flex-col gap-1.5 py-1"
                style={{ paddingLeft: i > 0 ? '16px' : 0, borderLeft: i > 0 ? '0.5px solid var(--color-border-tertiary)' : 'none' }}
              >
                <span className="text-[36px] font-medium leading-none tabular-nums" style={{ color: k.color }}>{k.n}</span>
                <span className="text-[10px] text-stone-400 dark:text-stone-500">{k.label}</span>
              </div>
            ))}
          </div>
        </div>
        {/* Barra proporcional */}
        <div className="flex h-[4px] border-t border-stone-100 dark:border-stone-800/40">
          {[
            { n: vencidos.length,  color: '#e11d48' },
            { n: urgentes.length,  color: '#ef4444' },
            { n: proximos.length,  color: '#d97706' },
            { n: ok.length,        color: '#2FAF8F' },
          ].map((s, i) => (
            <div
              key={i}
              className="h-full transition-all duration-700"
              style={{ width: `${total > 0 ? (s.n / total) * 100 : 0}%`, background: s.color }}
            />
          ))}
        </div>
      </div>

      {/* ── Grupos ── */}
      <p className="text-[10px] text-stone-400 dark:text-stone-500 tracking-[0.07em] uppercase mb-2.5 px-0.5">
        Por urgencia
      </p>

      {renderGroup(vencidos, 'Vencidos',         '#e11d48', '#ffe4e6', '#9f1239', { background: '#fff8f8', borderColor: '#fca5a5' }, '#fca5a5')}
      {renderGroup(urgentes, 'Esta semana',       '#e11d48', '#ffe4e6', '#9f1239', { background: '#fff8f8', borderColor: '#fca5a5' }, '#fca5a5')}
      {renderGroup(proximos, 'Próximos 30 días',  '#d97706', '#fef3c7', '#92400e', { background: '#fffdf5', borderColor: '#fde68a' }, '#fde68a')}
      {renderGroup(ok,       'Vigentes',          '#2FAF8F', '#2FAF8F18', '#1a8c6e')                                                           }

    </div>
  )
}