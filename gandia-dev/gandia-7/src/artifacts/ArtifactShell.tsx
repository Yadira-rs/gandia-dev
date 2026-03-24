/**
 * ArtifactShell — contenedor genérico de artefactos Gandia.
 *
 * Gestiona los tres niveles:
 *   dormant  → no renderiza nada aquí (el widget vive inline en el chat)
 *   awake    → panel lateral derecho (split view)
 *   anima    → pantalla completa con copiloto flotante
 *
 * El shell no sabe qué datos contiene cada artefacto.
 * Solo sabe en qué nivel está y delega al componente correcto.
 */

import type {
  ArtifactState,
  ModuleArtifact,
  AnimaArtifact,
  ArtifactDomain,
} from './artifactTypes'

// ── Ficha Ganadera ─────────────────────────────────────────────────────────────
import FichaModulo from './Ficha/FichaModulo'
import FichaAnima  from './Ficha/FichaAnima'

// ── Monitoreo ──────────────────────────────────────────────────────────────────
import MonitoreoModulo from './monitoring/MonitoreoModulo'
import MonitoreoAnima  from './monitoring/MonitoreoAnima'

// ── Biometría ──────────────────────────────────────────────────────────────────
import BiometriaModulo from './biometria/BiometriaModulo'
import BiometriaAnima  from './biometria/BiometriaAnima'

// ── Certificación ──────────────────────────────────────────────────────────────
import CertificationModulo from './certification/CertificationModulo'
import CertificationAnima  from './certification/CertificationAnima'

// ── Verificación ───────────────────────────────────────────────────────────────
import VerificationModulo from './verification/VerificationModulo'
import VerificationAnima  from './verification/VerificationAnima'

// ── Gemelo Digital ─────────────────────────────────────────────────────────────
import GemelosModulo from './twins/GemelosModulo'
import GemelosAnima  from './twins/GemelosAnima'

// ── Exportación ────────────────────────────────────────────────────────────────
import ExportacionModulo from './exportacion/ExportacionModulo'
import ExportacionAnima  from './exportacion/ExportacionAnima'

// ── Vinculación ────────────────────────────────────────────────────────────────
import VinculacionModulo from './vinculacion/VinculacionModulo'
import VinculacionAnima  from './vinculacion/VinculacionAnima'

// ── Documentos ─────────────────────────────────────────────────────────────────
import DocumentosModulo from './documentos/DocumentosModulo'
import DocumentosAnima  from './documentos/DocumentosAnima'

// ── Marketplace ────────────────────────────────────────────────────────────────
import MarketplaceModulo from './marketplace/MarketplaceModulo'
import MarketplaceAnima  from './marketplace/MarketplaceAnima'

// ─── PROPS ────────────────────────────────────────────────────────────────────

interface Props {
  artifact:            ArtifactState
  onClose:             () => void
  onEscalate:          () => void
  onDeescalate:        () => void
}

// ─── SHELL ────────────────────────────────────────────────────────────────────

export default function ArtifactShell({
  artifact,
  onClose,
  onEscalate,
  onDeescalate,
}: Props) {
  if (!artifact) return null

  if (artifact.kind === 'module') {
    return (
      <AwakeShell
        artifact={artifact}
        onClose={onClose}
        onEscalate={onEscalate}
      />
    )
  }

  if (artifact.kind === 'anima') {
    return (
      <AnimaShell
        artifact={artifact}
        onClose={onClose}
        onDeescalate={onDeescalate}
      />
    )
  }

  return null
}

// ─── AWAKE SHELL ──────────────────────────────────────────────────────────────

function AwakeShell({
  artifact,
  onClose,
  onEscalate,
}: {
  artifact:    ModuleArtifact
  onClose:     () => void
  onEscalate:  () => void
}) {
  switch (artifact.id) {

    case 'passport:full':
      return (
        <FichaModulo
          onClose={onClose}
          onEscalate={onEscalate}
        />
      )

    case 'twins:historial':
    case 'twins:alimentacion':
      return (
        <GemelosModulo
          onClose={onClose}
          onEscalate={onEscalate}
        />
      )

    case 'monitoring:dashboard':
      return (
        <MonitoreoModulo
          onClose={onClose}
          onEscalate={onEscalate}
        />
      )

    case 'certification:detail':
    case 'certification:expediente':
      return (
        <CertificationModulo
          onClose={onClose}
          onEscalar={onEscalate}
        />
      )

    case 'tramites:detail':
      return (
        <DocumentosModulo
          onClose={onClose}
          onEscalate={onEscalate}
        />
      )

    case 'verification:panel':
    case 'verification:detail':
      return (
        <VerificationModulo
          onClose={onClose}
          onEscalate={onEscalate}
        />
      )

    case 'biometria:dashboard':
      return (
        <BiometriaModulo
          onClose={onClose}
          onEscalate={onEscalate}
        />
      )

    case 'exportacion:form':
      return (
        <ExportacionModulo
          onClose={onClose}
          onEscalate={onEscalate}
        />
      )

    case 'vinculacion:panel':
      return (
        <VinculacionModulo
          onClose={onClose}
          onEscalate={onEscalate}
        />
      )

    case 'documentos:panel':
      return (
        <DocumentosModulo
          onClose={onClose}
          onEscalate={onEscalate}
        />
      )

    case 'marketplace:panel':
      return (
        <MarketplaceModulo
          onClose={onClose}
          onEscalate={onEscalate}
        />
      )

    default:
      return null
  }
}

// ─── ÁNIMA SHELL ──────────────────────────────────────────────────────────────

function AnimaShell({
  artifact,
  onClose,
  onDeescalate,
}: {
  artifact:      AnimaArtifact
  onClose:       () => void
  onDeescalate:  () => void
}) {
  switch (artifact.domain) {

    case 'passport':
      return (
        <FichaAnima
          onClose={onClose}
          onEscalate={onDeescalate}
        />
      )

    case 'twins':
      return (
        <GemelosAnima
          onClose={onClose}
          onEscalate={onDeescalate}
        />
      )

    case 'monitoring':
      return (
        <MonitoreoAnima
          onClose={onClose}
          onEscalate={onDeescalate}
        />
      )

    case 'certification':
      return (
        <CertificationAnima
          onClose={onClose}
          onEscalate={onDeescalate}
        />
      )

    case 'tramites':
      return (
        <ComingSoonAnima
          domain="tramites"
          label="Trámites · Espacio Gandia"
          onClose={onClose}
          onDeescalate={onDeescalate}
        />
      )

    case 'verification':
      return (
        <VerificationAnima
          onClose={onClose}
          onEscalate={onDeescalate}
        />
      )

    case 'biometria':
      return (
        <BiometriaAnima
          onClose={onClose}
          onEscalate={onDeescalate}
        />
      )

    case 'exportacion':
      return (
        <ExportacionAnima
          onClose={onClose}
          onEscalate={onDeescalate}
        />
      )

    case 'vinculacion':
      return (
        <VinculacionAnima
          onClose={onClose}
          onEscalate={onDeescalate}
        />
      )

    case 'documentos':
      return (
        <DocumentosAnima
          onClose={onClose}
          onEscalate={onDeescalate}
        />
      )

    case 'marketplace':
      return (
        <MarketplaceAnima
          onClose={onClose}
          onEscalate={onDeescalate}
        />
      )

    default:
      return null
  }
}

// ─── PLACEHOLDERS ─────────────────────────────────────────────────────────────

const DOMAIN_COLOR: Record<ArtifactDomain, string> = {
  passport:      '#2FAF8F',
  twins:         '#6366f1',
  monitoring:    '#f59e0b',
  certification: '#3b82f6',
  tramites:      '#8b5cf6',
  verification:  '#ec4899',
  sanidad:       '#ef4444',
  biometria:     '#6366f1',
  exportacion:   '#f97316',
  vinculacion:   '#0ea5e9',
  documentos:    '#3b82f6',
  marketplace:   '#2FAF8F',
}

function ComingSoonAnima({
  domain,
  label,
  onClose,
  onDeescalate,
}: {
  domain:        ArtifactDomain
  label:         string
  onClose:       () => void
  onDeescalate:  () => void
}) {
  const color = DOMAIN_COLOR[domain]
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#fafaf9] dark:bg-[#0c0a09]">
      <div className="flex items-center justify-between px-6 py-3 border-b border-stone-200/70 dark:border-stone-800">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: color }} />
          <p className="text-[13px] font-semibold text-stone-800 dark:text-stone-100">{label}</p>
          <span
            className="text-[9.5px] font-mono font-semibold px-2 py-0.5 rounded tracking-wider uppercase"
            style={{ color, background: `${color}14`, border: `1px solid ${color}30` }}
          >
            Espacio Gandia
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={onDeescalate}
            className="h-7 px-2.5 rounded-lg text-[11px] font-medium text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800/60 transition-all flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/>
              <line x1="10" y1="14" x2="17" y2="7"/><line x1="4" y1="20" x2="11" y2="13"/>
            </svg>
            Panel
          </button>
          <button
            onClick={onClose}
            className="h-7 px-2.5 rounded-lg text-[11px] font-medium text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800/60 transition-all"
          >
            Volver al chat
          </button>
        </div>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: `${color}14` }}>
          <svg className="w-6 h-6" style={{ color }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
          </svg>
        </div>
        <p className="text-[14px] font-semibold text-stone-700 dark:text-stone-300">{label}</p>
        <p className="text-[12px] text-stone-400 dark:text-stone-500 font-mono">Próximamente · Entorno operativo completo</p>
      </div>
      {/* <CopiloAnima domain={domain} /> */}
    </div>
  )
}