/**
 * useArtifacts.ts
 *
 * Hook central del sistema de artefactos Gandia.
 * Es el único lugar que sabe sobre artefactos en toda la app.
 *
 * Consumidores actuales:
 *   - Chat.tsx          → handleText, renderWidget, estado de simulación
 *   - CopiloAnima       → handleCopiloAction, openDirect
 *
 * Consumidores futuros:
 *   - AgenteChat.ts     → handleText (mismo contrato)
 *   - cualquier módulo  → openDirect(artifact) para navegación programática
 *
 * ── Para producción ────────────────────────────────────────────────────────────
 * 1. runSimulation en simulator.ts se reemplaza por llamada real al backend.
 * 2. detectIntent en intentDetector.ts se reemplaza por clasificación del modelo.
 * 3. Este hook NO cambia su interfaz pública.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useCallback, useRef }  from 'react'
import type { ReactNode }                  from 'react'
import { useUser }                         from '../../context/UserContext'

import {
  type ArtifactState,
  type ArtifactDomain,
  type WidgetArtifact,
  widgetToModule,
  domainToAnima,
} from '../../artifacts/artifactTypes'
import { detectIntent }                    from './artifactEngine/intentDetector'
import { runSimulation }                   from './artifactEngine/simulator'
import { renderWidget }                    from './artifactEngine/widgetMap'
import { useTwinsWrite }                   from '../../hooks/useTwinsWrite'   // ← nuevo

// ─── TIPOS ────────────────────────────────────────────────────────────────────

/**
 * Mensaje mínimo que el hook necesita inyectar en el chat.
 * Chat lo mapea a su propio UIMessage interno.
 */
export interface ArtifactMessage {
  role:     'assistant'
  content:  string
  thoughts: string[]
  artifact: { kind: 'widget'; id: string; domain: ArtifactDomain }
}

interface UseArtifactsOptions {
  /** Chat provee esta función para recibir mensajes generados por simulación */
  pushMessage: (msg: ArtifactMessage) => void
}

export interface UseArtifactsReturn {
  // ── Estado del artefacto activo ─────────────────────────────────────────
  artifact:   ArtifactState

  // ── Navegación ──────────────────────────────────────────────────────────
  /** Abre un artefacto directamente (para links directos, copiloto, agente) */
  openDirect: (state: ArtifactState) => void
  /** Widget → Módulo → Espacio Gandia */
  escalate:   () => void
  /** Un nivel atrás, o cierra si ya está en el primero */
  deescalate: () => void
  /** Cierra todo y limpia el historial */
  close:      () => void

  // ── Estado de simulación (Chat renderiza el ThinkingBlock con esto) ─────
  isSimulating: boolean
  simSteps:     string[]
  simIdx:       number
  simDone:      boolean

  // ── Entry points ────────────────────────────────────────────────────────
  /**
   * Punto de entrada principal desde el chat.
   * Devuelve true si detectó un artefacto y está manejando la respuesta.
   * Chat debe hacer return sin llamar al backend real cuando sea true.
   */
  handleText:         (text: string) => boolean
  /**
   * Punto de entrada desde CopiloAnima.
   * Recibe el actionId del copiloto y lo mapea al widget correspondiente.
   */
  handleCopiloAction: (actionId: string) => void

  // ── Render ──────────────────────────────────────────────────────────────
  /**
   * Renderiza el widget inline dado su ID.
   * Chat llama esto dentro del loop de mensajes.
   */
  renderInlineWidget: (widgetId: string) => ReactNode
}

// ─── MAPA: acciones del copiloto → widgetId ───────────────────────────────────
// Cuando el copiloto ejecuta una acción, se abre el widget correspondiente.

const COPILO_ACTION_MAP: Record<string, { widgetId: string; domain: ArtifactDomain }> = {
  // monitoring
  view_alerts:     { widgetId: 'monitoring:anomalia',    domain: 'monitoring' },
  refresh_sensors: { widgetId: 'monitoring:sensor',      domain: 'monitoring' },
  // passport
  create_passport: { widgetId: 'passport:card',          domain: 'passport'   },
  filter_eligible: { widgetId: 'passport:card',          domain: 'passport'   },
  // sanidad
  check_risk:           { widgetId: 'sanidad:gusano',           domain: 'sanidad'      },
  view_protocol:        { widgetId: 'sanidad:gusano',           domain: 'sanidad'      },
  // vinculacion
  nueva_vinculacion:    { widgetId: 'vinculacion:nueva',        domain: 'vinculacion'  },
  ver_pendientes:       { widgetId: 'vinculacion:pendientes',   domain: 'vinculacion'  },
  ver_activas:          { widgetId: 'vinculacion:lista',        domain: 'vinculacion'  },
  ver_historial_vinc:   { widgetId: 'vinculacion:historial',    domain: 'vinculacion'  },
  // exportacion
  nueva_solicitud:      { widgetId: 'exportacion:solicitud',    domain: 'exportacion'  },
  escanear_aretes:      { widgetId: 'exportacion:scanner',      domain: 'exportacion'  },
  validar_aretes:       { widgetId: 'exportacion:validacion',   domain: 'exportacion'  },
  exportar_excel:       { widgetId: 'exportacion:export',       domain: 'exportacion'  },
  // documentos — productor
  subir_documento:      { widgetId: 'documentos:subida',        domain: 'documentos'   },
  mis_expedientes:      { widgetId: 'documentos:expedientes',   domain: 'documentos'   },
  validar_docs:         { widgetId: 'documentos:validacion',    domain: 'documentos'   },
  empacar_docs:         { widgetId: 'documentos:empacar',       domain: 'documentos'   },
  // documentos — unión
  panel_union_docs:     { widgetId: 'documentos:panel',         domain: 'documentos'   },
  revisar_expediente:   { widgetId: 'documentos:revision',      domain: 'documentos'   },
  // marketplace
  ver_soluciones:       { widgetId: 'marketplace:kits',         domain: 'marketplace'  },
  ver_partners:         { widgetId: 'marketplace:partners',     domain: 'marketplace'  },
  kit_vision_ia:        { widgetId: 'marketplace:kits',         domain: 'marketplace'  },
  kit_conectividad:     { widgetId: 'marketplace:kits',         domain: 'marketplace'  },
  kit_sensores:         { widgetId: 'marketplace:kits',         domain: 'marketplace'  },
}

// ─── HOOK ─────────────────────────────────────────────────────────────────────

export function useArtifacts({ pushMessage }: UseArtifactsOptions): UseArtifactsReturn {

  const { role } = useUser()

  // ── Estado del artefacto activo ────────────────────────────────────────
  const [artifact,      setArtifact]      = useState<ArtifactState>(null)

  // ── Estado de simulación ───────────────────────────────────────────────
  const [isSimulating,  setIsSimulating]  = useState(false)
  const [simSteps,      setSimSteps]      = useState<string[]>([])
  const [simIdx,        setSimIdx]        = useState(0)
  const [simDone,       setSimDone]       = useState(false)

  // ── Historial de navegación (stack) ───────────────────────────────────
  const historyRef = useRef<ArtifactState[]>([])

  // ── Twins write ────────────────────────────────────────────────────────
  const { handleTwinsWrite } = useTwinsWrite()   // ← nuevo

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
    // 'anima' ya es el tope — no hace nada
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
      onStep: (steps, idx) => {
        setSimSteps(steps)
        setSimIdx(idx)
      },
      onComplete: ({ content, steps }) => {
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

  // ─── Entry points ────────────────────────────────────────────────────────

  const handleText = useCallback((text: string): boolean => {
    const intent = detectIntent(text, role)
    if (!intent) return false

    // Intent de ESCRITURA twins → guardar en Supabase   ← nuevo
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

    if (intent.level === 'module') {
      // Abrir módulo directamente — sin simulación
      const mod = widgetToModule(intent.widgetId as WidgetArtifact['id'])
      openDirect(mod)
      return true
    }

    if (intent.level === 'anima') {
      // Abrir Espacio Gandia directamente — sin simulación
      const anima = domainToAnima(intent.domain)
      openDirect(anima)
      return true
    }

    runArtifact(intent.widgetId, intent.domain)
    return true
  }, [runArtifact, openDirect, handleTwinsWrite, pushMessage, role])

  const handleCopiloAction = useCallback((actionId: string) => {
    const target = COPILO_ACTION_MAP[actionId]
    if (!target) return
    // El copiloto abre el widget directamente (sin simulación de chat)
    openDirect({
      kind:     'widget',
      id:       target.widgetId as WidgetArtifact['id'],
      domain:   target.domain,
    })
  }, [openDirect])

  // ─── Render ──────────────────────────────────────────────────────────────

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