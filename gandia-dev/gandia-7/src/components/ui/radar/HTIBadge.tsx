export type VerificationStatus =
  | 'oficial'
  | 'verificado'
  | 'en_revision'
  | 'comunitario'
  | 'no_verificado'

interface HTIBadgeProps {
  score:  number
  status: VerificationStatus
  size?:  'sm' | 'md'
  showTooltip?: boolean
}

// ── Mapa de colores y etiquetas ──────────────────────────────────────────────
const HTI_CONFIG: Record<VerificationStatus, {
  color:      string
  bgLight:    string
  label:      string
  description: string
}> = {
  oficial: {
    color:    '#2FAF8F',
    bgLight:  'rgba(47,175,143,0.12)',
    label:    'Oficial',
    description: 'Fuente gubernamental o institución oficial verificada',
  },
  verificado: {
    color:    '#d97706',
    bgLight:  'rgba(217,119,6,0.12)',
    label:    'Verificado',
    description: 'Verificado por editor + múltiples fuentes coincidentes',
  },
  en_revision: {
    color:    '#34d399',
    bgLight:  'rgba(52,211,153,0.10)',
    label:    'En revisión',
    description: 'Fuente razonable, pendiente de confirmación cruzada',
  },
  comunitario: {
    color:    '#78716c',
    bgLight:  'rgba(120,113,108,0.10)',
    label:    'Comunitario',
    description: 'Reporte de usuario con evidencia parcial',
  },
  no_verificado: {
    color:    '#ef4444',
    bgLight:  'rgba(239,68,68,0.10)',
    label:    'No verificado',
    description: 'Sin verificar — tomar con precaución',
  },
}

function getHTIConfig(score: number, status?: VerificationStatus) {
  if (status) return HTI_CONFIG[status]
  if (score >= 90) return HTI_CONFIG.oficial
  if (score >= 75) return HTI_CONFIG.verificado
  if (score >= 60) return HTI_CONFIG.en_revision
  if (score >= 40) return HTI_CONFIG.comunitario
  return HTI_CONFIG.no_verificado
}

function statusFromScore(score: number): VerificationStatus {
  if (score >= 90) return 'oficial'
  if (score >= 75) return 'verificado'
  if (score >= 60) return 'en_revision'
  if (score >= 40) return 'comunitario'
  return 'no_verificado'
}

// ── Componente ───────────────────────────────────────────────────────────────
export function HTIBadge({ score, status, size = 'sm', showTooltip = false }: HTIBadgeProps) {
  const cfg = getHTIConfig(score, status)
  const barW = `${Math.min(100, Math.max(0, score))}%`

  if (size === 'md') {
    return (
      <div className="flex items-center gap-2" title={showTooltip ? `${cfg.description} · HTI ${score}/100` : undefined}>
        {/* Barra */}
        <div
          className="w-10 h-1.5 rounded-full overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.08)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: barW, background: cfg.color }}
          />
        </div>
        {/* Score */}
        <span className="text-[11px] font-semibold" style={{ color: cfg.color }}>
          {score}
        </span>
        {/* Label */}
        <span
          className="text-[10px] font-semibold uppercase tracking-[0.05em] px-1.5 py-0.5 rounded"
          style={{ color: cfg.color, background: cfg.bgLight }}
        >
          {cfg.label}
        </span>
      </div>
    )
  }

  // size === 'sm' (default)
  return (
    <div
      className="flex items-center gap-1.5"
      title={showTooltip ? `HTI ${score}/100 · ${cfg.label}: ${cfg.description}` : undefined}
    >
      <div
        className="w-7 h-[3px] rounded-full overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.08)' }}
      >
        <div
          className="h-full rounded-full"
          style={{ width: barW, background: cfg.color }}
        />
      </div>
      <span className="text-[10px] font-bold" style={{ color: cfg.color }}>
        HTI {score}
      </span>
    </div>
  )
}

// ── Badge de estado (texto) ───────────────────────────────────────────────────
export function HTIStatusBadge({ status, score }: { status?: VerificationStatus; score?: number }) {
  const resolvedStatus = status ?? (score !== undefined ? statusFromScore(score) : 'en_revision')
  const cfg = HTI_CONFIG[resolvedStatus]

  if (resolvedStatus === 'oficial' || resolvedStatus === 'verificado') {
    return (
      <span className="flex items-center gap-1 text-[10px] font-semibold" style={{ color: cfg.color }}>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        {cfg.label}
      </span>
    )
  }

  return (
    <span className="text-[10px] font-medium" style={{ color: cfg.color }}>
      {cfg.label}
    </span>
  )
}

// ── Leyenda compacta (para el header del feed) ────────────────────────────────
export function HTILegend() {
  const items: { color: string; label: string }[] = [
    { color: '#2FAF8F', label: '90–100 Oficial'    },
    { color: '#d97706', label: '75–89 Verificado'  },
    { color: '#34d399', label: '60–74 En revisión' },
    { color: '#78716c', label: '<60 Comunitario'   },
  ]

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <span className="text-[9.5px] font-bold text-stone-500 dark:text-stone-600 uppercase tracking-[0.1em]">
        HTI
      </span>
      {items.map(i => (
        <div key={i.label} className="flex items-center gap-1.5">
          <div className="w-[7px] h-[7px] rounded-full shrink-0" style={{ background: i.color }} />
          <span className="text-[10px] text-stone-500 dark:text-stone-600">{i.label}</span>
        </div>
      ))}
    </div>
  )
}