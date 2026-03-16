/**
 * GANDIA — chatService.ts
 * Capa de datos para el chat: conversations + messages sobre Supabase.
 * El Chat.tsx nunca toca Supabase directamente — todo pasa por aquí.
 *
 * Uso:
 *   import { chatService } from '../lib/chatService'
 */

import { supabase } from './supabaseClient'

// ─────────────────────────────────────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────────────────────────────────────

export type ChatMode  = 'asistente' | 'noticias' | 'investigacion'
export type ChatModel = 'acipe' | 'acipe-slim' | 'claude' | 'gpt4o' | 'gemini'
export type MessageRole = 'user' | 'assistant' | 'system'

export interface AttachedFile {
  id:           string
  name:         string
  type:         string
  size:         number
  url:          string          // URL pública o firmada de Supabase Storage
  storage_path?: string        // path interno en el bucket (para gestionar)
}

export interface ChatMessage {
  id:              string
  conversation_id: string
  user_id:         string
  role:            MessageRole
  content:         string
  files:           AttachedFile[]
  thoughts:        string[]     // pasos de razonamiento de ACIPE
  model?:          ChatModel    // qué modelo respondió (solo assistant)
  tokens_used?:    number
  latency_ms?:     number
  is_error:        boolean
  metadata:        Record<string, unknown>
  created_at:      string
}

export interface Conversation {
  id:              string
  user_id:         string
  title:           string
  mode:            ChatMode
  model:           ChatModel
  message_count:   number
  is_pinned:       boolean
  is_archived:     boolean
  last_message_at: string | null
  metadata:        Record<string, unknown>
  created_at:      string
  updated_at:      string
}

// Payload para crear una conversación
export interface CreateConversationInput {
  mode:  ChatMode
  model: ChatModel
}

// Payload para guardar un mensaje
export interface SaveMessageInput {
  conversation_id: string
  role:            MessageRole
  content:         string
  files?:          AttachedFile[]
  thoughts?:       string[]
  model?:          ChatModel
  tokens_used?:    number
  latency_ms?:     number
  is_error?:       boolean
  metadata?:       Record<string, unknown>
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: obtener user_id activo (sin llamada HTTP — lee de localStorage)
// ─────────────────────────────────────────────────────────────────────────────

async function getActiveUserId(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user?.id) throw new Error('No hay sesión activa.')
  return session.user.id
}

// ─────────────────────────────────────────────────────────────────────────────
// CONVERSATIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Crea una nueva conversación vacía.
 * El título se actualiza automáticamente con el primer mensaje (trigger en BD).
 */
async function createConversation(
  input: CreateConversationInput
): Promise<Conversation> {
  const user_id = await getActiveUserId()

  const { data, error } = await supabase
    .from('conversations')
    .insert({
      user_id,
      mode:  input.mode,
      model: input.model,
      title: 'Nueva conversación',
    })
    .select('*')
    .single()

  if (error || !data) {
    throw new Error(`Error al crear conversación: ${error?.message}`)
  }

  return data as Conversation
}

/**
 * Lista todas las conversaciones del usuario activo.
 * Ordenadas por last_message_at DESC (más reciente primero).
 * Excluye archivadas por defecto.
 */
async function listConversations(options?: {
  includeArchived?: boolean
  limit?: number
}): Promise<Conversation[]> {
  const user_id = await getActiveUserId()

  let query = supabase
    .from('conversations')
    .select('*')
    .eq('user_id', user_id)
    .order('is_pinned',       { ascending: false })  // fijadas primero
    .order('last_message_at', { ascending: false })
    .limit(options?.limit ?? 50)

  if (!options?.includeArchived) {
    query = query.eq('is_archived', false)
  }

  const { data, error } = await query

  if (error) throw new Error(`Error al cargar historial: ${error.message}`)
  return (data ?? []) as Conversation[]
}

/**
 * Obtiene una conversación por ID (verifica que pertenezca al usuario activo via RLS).
 */
async function getConversation(id: string): Promise<Conversation | null> {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) throw new Error(`Error al obtener conversación: ${error.message}`)
  return data as Conversation | null
}

/**
 * Actualiza el título de una conversación (rename manual por el usuario).
 */
async function renameConversation(id: string, title: string): Promise<void> {
  const { error } = await supabase
    .from('conversations')
    .update({ title: title.trim().slice(0, 120), updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new Error(`Error al renombrar: ${error.message}`)
}

/**
 * Fijar / desfijar una conversación.
 */
async function pinConversation(id: string, pinned: boolean): Promise<void> {
  const { error } = await supabase
    .from('conversations')
    .update({ is_pinned: pinned, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new Error(`Error al fijar conversación: ${error.message}`)
}

/**
 * Archivar / desarchivar una conversación.
 */
async function archiveConversation(id: string, archived: boolean): Promise<void> {
  const { error } = await supabase
    .from('conversations')
    .update({ is_archived: archived, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new Error(`Error al archivar conversación: ${error.message}`)
}

/**
 * Eliminar una conversación y todos sus mensajes (CASCADE en BD).
 */
async function deleteConversation(id: string): Promise<void> {
  const { error } = await supabase
    .from('conversations')
    .delete()
    .eq('id', id)

  if (error) throw new Error(`Error al eliminar conversación: ${error.message}`)
}

// ─────────────────────────────────────────────────────────────────────────────
// MESSAGES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Carga todos los mensajes de una conversación, ordenados cronológicamente.
 */
async function getMessages(conversationId: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  if (error) throw new Error(`Error al cargar mensajes: ${error.message}`)
  return (data ?? []) as ChatMessage[]
}

/**
 * Guarda un mensaje en BD.
 * Lo llamas:
 *   1) justo después de que el usuario envía (role: 'user')
 *   2) cuando el streaming termina (role: 'assistant')
 */
async function saveMessage(input: SaveMessageInput): Promise<ChatMessage> {
  const user_id = await getActiveUserId()

  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: input.conversation_id,
      user_id,
      role:            input.role,
      content:         input.content,
      files:           input.files      ?? [],
      thoughts:        input.thoughts   ?? [],
      model:           input.model      ?? null,
      tokens_used:     input.tokens_used ?? null,
      latency_ms:      input.latency_ms  ?? null,
      is_error:        input.is_error    ?? false,
      metadata:        input.metadata    ?? {},
    })
    .select('*')
    .single()

  if (error || !data) {
    throw new Error(`Error al guardar mensaje: ${error?.message}`)
  }

  return data as ChatMessage
}

/**
 * Marca un mensaje como error (útil si el stream falla a mitad).
 */
async function markMessageAsError(messageId: string): Promise<void> {
  const { error } = await supabase
    .from('messages')
    .update({ is_error: true })
    .eq('id', messageId)

  if (error) throw new Error(`Error al marcar mensaje: ${error.message}`)
}

// ─────────────────────────────────────────────────────────────────────────────
// STORAGE — archivos adjuntos
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sube un archivo al bucket 'chat-files' y devuelve la URL pública.
 * La ruta es: {user_id}/{conversation_id}/{file_id}_{filename}
 */
async function uploadFile(
  file: File,
  conversationId: string,
): Promise<AttachedFile> {
  const user_id  = await getActiveUserId()
  const fileId   = crypto.randomUUID()
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const path     = `${user_id}/${conversationId}/${fileId}_${safeName}`

  const { error: upErr } = await supabase.storage
    .from('chat-files')
    .upload(path, file, { cacheControl: '3600', upsert: false })

  if (upErr) throw new Error(`Error al subir archivo: ${upErr.message}`)

  // URL firmada válida por 1 hora (el bucket es privado)
  const { data: signed, error: signErr } = await supabase.storage
    .from('chat-files')
    .createSignedUrl(path, 3600)

  if (signErr || !signed?.signedUrl) {
    throw new Error(`Error al generar URL firmada: ${signErr?.message}`)
  }

  return {
    id:           fileId,
    name:         file.name,
    type:         file.type,
    size:         file.size,
    url:          signed.signedUrl,
    storage_path: path,
  }
}

/**
 * Elimina un archivo del bucket.
 */
async function deleteFile(storagePath: string): Promise<void> {
  const { error } = await supabase.storage
    .from('chat-files')
    .remove([storagePath])

  if (error) throw new Error(`Error al eliminar archivo: ${error.message}`)
}

// ─────────────────────────────────────────────────────────────────────────────
// API ACIPE — llamada al backend
// ─────────────────────────────────────────────────────────────────────────────

export interface AcipeRequestMessage {
  role:    MessageRole
  content: string
}

export interface AcipeResponse {
  content:    string
  thoughts:   string[]
  model:      ChatModel
  tokens_used?: number
  latency_ms?:  number
}

/**
 * Llama al backend de ACIPE con el historial completo de la conversación.
 *
 * El backend espera:
 * {
 *   messages: [{ role, content }],   // historial completo
 *   mode:     'asistente' | 'noticias' | 'investigacion',
 *   model:    'acipe' | 'claude' | 'gpt4o' | 'gemini',
 *   user_id:  string,
 * }
 *
 * Y devuelve:
 * {
 *   content:    string,
 *   thoughts:   string[],
 *   model:      ChatModel,
 *   tokens_used?: number,
 *   latency_ms?:  number,
 * }
 *
 * NOTA: cuando implementes streaming en el backend, reemplaza este fetch
 * por un ReadableStream / EventSource y actualiza el Chat.tsx para recibir
 * los chunks. La firma de esta función no cambia desde el punto de vista del Chat.
 */
// ─── Preferencias del asistente (leídas desde localStorage por useChat) ────────
export interface AssistantPrefs {
  detailLevel: 'concise' | 'balanced' | 'detailed'
  tone:        'professional' | 'casual'
}

async function callAcipe(
  messages:       AcipeRequestMessage[],
  mode:           ChatMode,
  model:          ChatModel,
  onChunk?:       (chunk: string) => void,
  assistantPrefs?: AssistantPrefs,
): Promise<AcipeResponse> {
  const user_id     = await getActiveUserId()
  const BACKEND_URL = import.meta.env.VITE_ACIPE_URL ?? ''

  if (!BACKEND_URL) {
    throw new Error('VITE_ACIPE_URL no está definida en .env')
  }

  const startTime = Date.now()

  // ── Sin streaming ──────────────────────────────────────────────────────────
  if (!onChunk) {
    const res = await fetch(`${BACKEND_URL}/api/chat`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ messages, mode, model, user_id, assistant_prefs: assistantPrefs }),
    })

    if (!res.ok) {
      const body = await res.text().catch(() => res.statusText)
      throw new Error(`Error del servidor (${res.status}): ${body}`)
    }

    const json = await res.json() as AcipeResponse
    return {
      ...json,
      latency_ms: json.latency_ms ?? (Date.now() - startTime),
    }
  }

  // ── Con streaming (Server-Sent Events / chunked transfer) ──────────────────
  const res = await fetch(`${BACKEND_URL}/api/chat/stream`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ messages, mode, model, user_id, assistant_prefs: assistantPrefs }),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => res.statusText)
    throw new Error(`Error del servidor (${res.status}): ${body}`)
  }

  if (!res.body) throw new Error('El servidor no devolvió un stream.')

  const reader  = res.body.getReader()
  const decoder = new TextDecoder()
  let fullText  = ''
  let metadata: Partial<AcipeResponse> = {}

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const raw = decoder.decode(value, { stream: true })

    // El backend envía líneas SSE: "data: <json>\n\n"
    for (const line of raw.split('\n')) {
      if (!line.startsWith('data: ')) continue
      const payload = line.slice(6).trim()
      if (payload === '[DONE]') break

      try {
        const parsed = JSON.parse(payload) as {
          type:    'chunk' | 'thoughts' | 'done'
          content?: string
          thoughts?: string[]
          model?:    ChatModel
          tokens_used?: number
          latency_ms?:  number
        }

        if (parsed.type === 'chunk' && parsed.content) {
          fullText += parsed.content
          onChunk(parsed.content)
        }

        if (parsed.type === 'done') {
          metadata = {
            thoughts:    parsed.thoughts   ?? [],
            model:       parsed.model      ?? model,
            tokens_used: parsed.tokens_used,
            latency_ms:  parsed.latency_ms  ?? (Date.now() - startTime),
          }
        }
      } catch {
        // línea malformada — ignorar
      }
    }
  }

  return {
    content:    fullText,
    thoughts:   metadata.thoughts    ?? [],
    model:      metadata.model       ?? model,
    tokens_used: metadata.tokens_used,
    latency_ms:  metadata.latency_ms ?? (Date.now() - startTime),
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORT — objeto único (fácil de mockear en tests)
// ─────────────────────────────────────────────────────────────────────────────

export const chatService = {
  // Conversations
  createConversation,
  listConversations,
  getConversation,
  renameConversation,
  pinConversation,
  archiveConversation,
  deleteConversation,

  // Messages
  getMessages,
  saveMessage,
  markMessageAsError,

  // Storage
  uploadFile,
  deleteFile,

  // ACIPE backend
  callAcipe: (messages: AcipeRequestMessage[], mode: ChatMode, model: ChatModel, onChunk?: (chunk: string) => void, assistantPrefs?: AssistantPrefs) => callAcipe(messages, mode, model, onChunk, assistantPrefs),
}