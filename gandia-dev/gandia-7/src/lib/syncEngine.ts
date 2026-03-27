/**
 * src/lib/syncEngine.ts
 * Motor de sincronización offline→online para GANDIA Campo.
 *
 * Escucha el evento 'online' del navegador y procesa la cola de Dexie.
 * Reintenta con backoff exponencial.
 * Soporta Background Sync API cuando está disponible.
 *
 * Uso:
 *   import { SyncEngine } from './syncEngine'
 *   SyncEngine.start()   // una sola vez en main.tsx o Campo.tsx
 *   SyncEngine.stop()
 *   SyncEngine.sync()    // forzar sync manual
 */

import { supabase } from './supabaseClient'
import {
    getPendingItems,
    updateItemStatus,
    type QueueItem,
} from './fieldQueue'

// ─── TIPOS ────────────────────────────────────────────────────────────────────

type SyncListener = (event: SyncEvent) => void

export type SyncEvent =
    | { type: 'start' }
    | { type: 'item_ok'; id: string }
    | { type: 'item_fail'; id: string; error: string }
    | { type: 'done'; synced: number; failed: number }
    | { type: 'online' }
    | { type: 'offline' }

const BACKGROUND_SYNC_TAG = 'gandia-campo-sync'

// ─── UPLOAD de blob a Supabase Storage ───────────────────────────────────────

async function uploadBlob(item: QueueItem): Promise<string | null> {
    if (!item.blob) return null
    try {
        const ext = item.mimeType?.split('/')[1] ?? 'bin'
        const path = `campo/${item.context.userId}/${item.id}.${ext}`
        const { error } = await supabase.storage
            .from('campo-evidencia')
            .upload(path, item.blob, {
                contentType: item.mimeType ?? 'application/octet-stream',
                upsert: true,
            })
        if (error) return null
        const { data } = supabase.storage
            .from('campo-evidencia')
            .getPublicUrl(path)
        return data.publicUrl
    } catch {
        // Si falla el upload (bucket no existe, sin red, etc.), continuamos sin adjunto
        return null
    }
}

// ─── ENVIAR un item al backend ────────────────────────────────────────────────

async function sendItem(item: QueueItem): Promise<void> {
    // 1. Subir blob si existe
    const attachmentUrl = await uploadBlob(item)

    // Helper para convertir string vacío a null (campos UUID en Supabase)
    const uuidOrNull = (v?: string) => (v && v.trim() !== '' ? v : null)

    // 2. Insertar evento en tabla campo_eventos
    const payload = {
        id: item.id,
        user_id: uuidOrNull(item.context.userId),
        rancho_id: uuidOrNull(item.context.ranchoId),
        input_type: item.type,
        content: item.content ?? '',
        attachment_url: attachmentUrl ?? null,
        mime_type: item.mimeType ?? null,
        file_name: item.fileName ?? null,
        file_size: item.fileSize ?? null,
        duration_sec: item.durationSec ?? null,
        gps_lat: item.context.gps?.lat ?? null,
        gps_lng: item.context.gps?.lng ?? null,
        gps_accuracy: item.context.gps?.accuracy ?? null,
        operador_nombre: item.context.operadorNombre ?? null,
        created_at_local: item.createdAt,
    }

    const { error } = await supabase
        .from('campo_eventos')
        .upsert(payload, { onConflict: 'id' })

    if (error) throw new Error(error.message)
}

// ─── SYNC ENGINE ──────────────────────────────────────────────────────────────

class _SyncEngine {
    private listeners: SyncListener[] = []
    private running = false
    private initialized = false

    // ── Suscripción a eventos ─────────────────────────────────────────────────

    on(fn: SyncListener) { this.listeners.push(fn) }
    off(fn: SyncListener) { this.listeners = this.listeners.filter(l => l !== fn) }

    private emit(ev: SyncEvent) {
        this.listeners.forEach(l => l(ev))
    }

    // ── Inicializar ───────────────────────────────────────────────────────────

    start() {
        if (this.initialized) return
        this.initialized = true

        // Escuchar cambios de conexión
        window.addEventListener('online', () => { this.emit({ type: 'online' }); void this.sync() })
        window.addEventListener('offline', () => { this.emit({ type: 'offline' }) })

        // Registrar Background Sync si está disponible
        void this.registerBackgroundSync()

        // Si arrancamos con internet, sincronizar pendientes
        if (navigator.onLine) void this.sync()
    }

    stop() {
        this.initialized = false
        this.listeners = []
    }

    // ── Background Sync API ───────────────────────────────────────────────────

    private async registerBackgroundSync() {
        try {
            if (!('serviceWorker' in navigator)) return
            const reg = await navigator.serviceWorker.ready
            // @ts-expect-error — Background Sync API no está en todos los tipos
            if ('sync' in reg) await reg.sync.register(BACKGROUND_SYNC_TAG)
        } catch { /* no disponible en este navegador */ }
    }

    // ── Proceso de sincronización ─────────────────────────────────────────────

    async sync(): Promise<void> {
        if (this.running) return
        if (!navigator.onLine) return

        this.running = true
        this.emit({ type: 'start' })

        let synced = 0
        let failed = 0

        try {
            const pending = await getPendingItems()
            if (pending.length === 0) {
                this.emit({ type: 'done', synced: 0, failed: 0 })
                return
            }

            for (const item of pending) {
                // Marcar como sincronizando
                await updateItemStatus(item.id, 'syncing')

                try {
                    await this.sendWithRetry(item)
                    await updateItemStatus(item.id, 'synced', { syncedAt: new Date().toISOString() })
                    this.emit({ type: 'item_ok', id: item.id })
                    synced++
                } catch (err) {
                    const errorMsg = err instanceof Error ? err.message : String(err)
                    const retries = item.retries + 1
                    await updateItemStatus(item.id, 'failed', { retries, errorMsg })
                    this.emit({ type: 'item_fail', id: item.id, error: errorMsg })
                    failed++
                }
            }
        } finally {
            this.running = false
            this.emit({ type: 'done', synced, failed })
        }
    }

    // ── Reintentos con backoff exponencial ────────────────────────────────────

    private async sendWithRetry(item: QueueItem, maxAttempts = 3): Promise<void> {
        let lastError: Error | null = null
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            try {
                await sendItem(item)
                return
            } catch (err) {
                lastError = err instanceof Error ? err : new Error(String(err))
                if (attempt < maxAttempts - 1) {
                    // Backoff: 1s, 2s, 4s
                    await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000))
                }
            }
        }
        throw lastError ?? new Error('Error desconocido')
    }
}

export const SyncEngine = new _SyncEngine()