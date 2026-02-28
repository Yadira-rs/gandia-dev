/**
 * ArtifactShell — contenedor genérico de artefactos Gandia.
 * Gestiona los tres estados: dormido (inline), vivo (split), fullscreen.
 */

import PassportArtifact from './passport/PassportArtifact'
import { MOCK_PASSPORT } from './passport/mockData'

export type ArtifactType = 'passport' | 'twins' | 'monitoring' | 'certification' | 'tramites' | 'verification'

interface Props {
  type:                ArtifactType
  onClose:             () => void
  fullscreen:          boolean
  onToggleFullscreen:  () => void
}

export default function ArtifactShell({ type, onClose, fullscreen, onToggleFullscreen }: Props) {
  switch (type) {
    case 'passport':
      return (
        <PassportArtifact
          data={MOCK_PASSPORT}
          onClose={onClose}
          fullscreen={fullscreen}
          onToggleFullscreen={onToggleFullscreen}
        />
      )

    case 'twins':
    case 'monitoring':
    case 'certification':
    case 'tramites':
    case 'verification':
      return (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 bg-[#fafaf9] dark:bg-[#0c0a09]">
          <div className="w-10 h-10 rounded-2xl bg-[#2FAF8F]/10 flex items-center justify-center">
            <svg className="w-5 h-5 text-[#2FAF8F]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
            </svg>
          </div>
          <p className="text-[13px] font-medium text-stone-600 dark:text-stone-400">
            Artefacto <span className="capitalize font-semibold text-stone-800 dark:text-stone-200">{type}</span> — próximamente
          </p>
          <button onClick={onClose} className="text-[12px] text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors underline-offset-2 hover:underline">
            Volver al chat
          </button>
        </div>
      )

    default:
      return null
  }
}