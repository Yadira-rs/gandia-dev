import type { AttachedFile, ChatModel } from '../../lib/chatService'
import type { WidgetArtifact } from '../../artifacts/artifactTypes'

export type UIMessage = {
  id:               string
  role:             'user' | 'assistant'
  content:          string
  files:            AttachedFile[]
  thoughts:         string[]
  thoughtsExpanded: boolean
  isError:          boolean
  model?:           ChatModel
  ts:               number
  artifact?:        WidgetArtifact
  pinned?:          boolean
  edited?:          boolean
  wiki_hechos?:     { id: string; afirmacion: string; fuente_nombre: string; hti: number; dominio: string }[]
}

export type Toast = { id: string; text: string; kind: 'error' | 'info' }