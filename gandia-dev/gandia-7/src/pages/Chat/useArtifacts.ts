/**
 * useArtifacts.ts
 * ARCHIVO → src/pages/Chat/useArtifacts.ts
 */

import { useState, useCallback, useRef } from 'react'
import type { ReactNode }                 from 'react'

import {
  type ArtifactState,
  type ArtifactDomain,
  type WidgetArtifact,
  widgetToModule,
  domainToAnima,
} from '../../artifacts/artifactTypes'
import { detectIntent }  from './artifactEngine/intentDetector'
import { runSimulation } from './artifactEngine/simulator'
import { renderWidget }  from './artifactEngine/widgetMap'
import { useTwinsWrite } from '../../hooks/useTwinsWrite'

// ─── TIPOS ────────────────────────────────────────────────────────────────────

export interface ArtifactMessage {
  role:     'assistant'
  content:  string
  thoughts: string[]
  artifact: { kind: 'widget'; id: string; domain: ArtifactDomain }
}

interface UseArtifactsOptions {
  pushMessage: (msg: ArtifactMessage) => void
}

export interface UseArtifactsReturn {
  artifact:           ArtifactState
  openDirect:         (state: ArtifactState) => void
  escalate:           () => void
  deescalate:         () => void
  close:              () => void
  isSimulating:       boolean
  simSteps:           string[]
  simIdx:             number
  simDone:            boolean
  handleText:         (text: string) => boolean
  handleCopiloAction: (actionId: string) => void
  renderInlineWidget: (widgetId: string) => ReactNode
}

// ─── MAPA: acciones del copiloto → widgetId ───────────────────────────────────

const COPILO_ACTION_MAP: Record<string, { widgetId: string; domain: ArtifactDomain }> = {
  view_alerts:        { widgetId: 'monitoring:anomalia',    domain: 'monitoring'  },
  refresh_sensors:    { widgetId: 'monitoring:sensor',      domain: 'monitoring'  },
  create_passport:    { widgetId: 'passport:card',          domain: 'passport'    },
  filter_eligible:    { widgetId: 'passport:card',          domain: 'passport'    },
  check_risk:         { widgetId: 'sanidad:gusano',         domain: 'sanidad'     },
  view_protocol:      { widgetId: 'sanidad:gusano',         domain: 'sanidad'     },
  nueva_vinculacion:  { widgetId: 'vinculacion:nueva',      domain: 'vinculacion' },
  ver_pendientes:     { widgetId: 'vinculacion:pendientes', domain: 'vinculacion' },
  ver_activas:        { widgetId: 'vinculacion:lista',      domain: 'vinculacion' },
  ver_historial_vinc: { widgetId: 'vinculacion:historial',  domain: 'vinculacion' },
  nueva_solicitud:    { widgetId: 'exportacion:solicitud',  domain: 'exportacion' },
  escanear_aretes:    { widgetId: 'exportacion:scanner',    domain: 'exportacion' },
  validar_aretes:     { widgetId: 'exportacion:validacion', domain: 'exportacion' },
  exportar_excel:     { widgetId: 'exportacion:export',     domain: 'exportacion' },
}

// ─── HOOK ─────────────────────────────────────────────────────────────────────

export function useArtifacts({ pushMessage }: UseArtifactsOptions): UseArtifactsReturn {

  const [artifact,     setArtifact]     = useState<ArtifactState>(null)
  const [isSimulating, setIsSimulating] = useState(false)
  const [simSteps,     setSimSteps]     = useState<string[]>([])
  const [simIdx,       setSimIdx]       = useState(0)
  const [simDone,      setSimDone]      = useState(false)
  const historyRef                      = useRef<ArtifactState[]>([])

  const { handleTwinsWrite } = useTwinsWrite()

  // ─── Navegación ─────────────────────────────────────────────────────────

  const openDirect = useCallback((state: ArtifactState) => {
    if (artifact) historyRef.current.push(artifact)
    setArtifact(state)
  }, [artifact])

  const escalate = useCallback(() => {
    if (!artifact) return
    if (artifact.kind === 'widget') {
      historyRef.current.push(artifact)
      setArtifact(widgetToModule(artifact.id))
    } else if (artifact.kind === 'module') {
      historyRef.current.push(artifact)
      setArtifact(domainToAnima(artifact.domain))
    }
  }, [artifact])

  const deescalate = useCallback(() => {
    const prev = historyRef.current.pop()
    setArtifact(prev ?? null)
  }, [])

  const close = useCallback(() => {
    historyRef.current = []
    setArtifact(null)
  }, [])

  // ─── Simulación ─────────────────────────────────────────────────────────

  const runArtifact = useCallback((widgetId: string, domain: ArtifactDomain) => {
    setIsSimulating(true)
    setSimDone(false)
    setSimSteps([])
    setSimIdx(0)

    runSimulation(widgetId, {
      onStep: (steps: string[], idx: number) => {
        setSimSteps(steps)
        setSimIdx(idx)
      },
      onComplete: ({ content, steps }: { content: string; steps: string[] }) => {
        setSimDone(true)
        setTimeout(() => {
          setIsSimulating(false)
          setSimDone(false)
          setSimSteps([])
          pushMessage({
            role:     'assistant',
            content,
            thoughts: steps,
            artifact: { kind: 'widget', id: widgetId, domain },
          })
        }, 700)
      },
    })
  }, [pushMessage])

  // ─── handleText ──────────────────────────────────────────────────────────

  const handleText = useCallback((text: string): boolean => {
    const intent = detectIntent(text)
    if (!intent) return false

    // Intent de ESCRITURA twins → guardar en Supabase
    if (intent.action === 'write' && intent.domain === 'twins') {
      void handleTwinsWrite(text).then((result: { ok: boolean; message: string }) => {
        pushMessage({
          role:     'assistant',
          content:  result.message,
          thoughts: [],
          artifact: { kind: 'widget', id: 'twins:timeline', domain: 'twins' },
        })
      })
      return true
    }

    // Intent de módulo → abrir directamente
    if (intent.level === 'module') {
      openDirect(widgetToModule(intent.widgetId as WidgetArtifact['id']))
      return true
    }

    // Intent de Espacio Gandia → abrir anima
    if (intent.level === 'anima') {
      openDirect(domainToAnima(intent.domain))
      return true
    }

    // Intent de widget → simular
    runArtifact(intent.widgetId, intent.domain)
    return true

  }, [runArtifact, openDirect, handleTwinsWrite, pushMessage])

  // ─── handleCopiloAction ──────────────────────────────────────────────────

  const handleCopiloAction = useCallback((actionId: string) => {
    const target = COPILO_ACTION_MAP[actionId]
    if (!target) return
    openDirect({
      kind:   'widget',
      id:     target.widgetId as WidgetArtifact['id'],
      domain: target.domain,
    })
  }, [openDirect])

  // ─── renderInlineWidget ──────────────────────────────────────────────────

  const renderInlineWidget = useCallback((widgetId: string): ReactNode => {
    return renderWidget(widgetId, {
      onExpand: () => {
        const mod = widgetToModule(widgetId as WidgetArtifact['id'])
        if (mod) openDirect(mod)
      },
    })
  }, [openDirect])

  // ─── Return ──────────────────────────────────────────────────────────────

  return {
    artifact,
    openDirect,
    escalate,
    deescalate,
    close,
    isSimulating,
    simSteps,
    simIdx,
    simDone,
    handleText,
    handleCopiloAction,
    renderInlineWidget,
  }
}