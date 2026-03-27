/**
 * src/lib/fieldQueue.ts
 * Cola offline para el Agente de Campo de GANDIA.
 * Usa Dexie (IndexedDB) — persiste aunque se cierre el navegador.
 * Cada item guarda el contexto completo del usuario y rancho
 * para que el agente lo procese correctamente al sincronizar.
 */

import Dexie, { type Table } from 'dexie'

// ─── TIPOS ────────────────────────────────────────────────────────────────────

export type QueueItemType = 'text' | 'audio' | 'image' | 'file'

export type QueueStatus =
    | 'queued'    // guardado localmente, esperando conexión
    | 'syncing'   // enviándose al servidor ahora mismo
    | 'synced'    // confirmado por el servidor
    | 'failed'    // falló después de reintentos

export interface FieldContext {
    userId: string
    ranchoId?: string
    ranchoNombre?: string
    operadorNombre?: string
    gps?: { lat: number; lng: number; accuracy: number }
}

export interface QueueItem {
    id: string
    type: QueueItemType
    content: string       // texto del mensaje, o descripción del archivo
    blob?: Blob         // datos del audio/imagen/archivo (no se serializa en JSON)
    mimeType?: string
    fileName?: string
    fileSize?: number
    durationSec?: number      // para audios
    context: FieldContext
    createdAt: string       // ISO string
    status: QueueStatus
    retries: number
    syncedAt?: string
    errorMsg?: string
}

// ─── BASE DE DATOS ────────────────────────────────────────────────────────────

class FieldQueueDB extends Dexie {
    queue!: Table<QueueItem, string>

    constructor() {
        super('gandia-field-queue')
        this.version(2).stores({
            // Índices: id (primary), status, createdAt, userId
            queue: 'id, status, createdAt, [context.userId+status]',
        })
    }
}

export const db = new FieldQueueDB()

// ─── HELPERS DE CONTEXTO OFFLINE ─────────────────────────────────────────────

/**
 * Lee el contexto del usuario desde localStorage.
 * Se persiste al cargar el perfil con conexión (ver UserContext.tsx).
 */
export function readOfflineContext(): FieldContext | null {
    try {
        const raw = localStorage.getItem('gandia-campo-context')
        if (!raw) return null
        return JSON.parse(raw) as FieldContext
    } catch {
        return null
    }
}

/**
 * Persiste el contexto para uso offline.
 * Llamado desde UserContext cuando carga el perfil.
 */
export function writeOfflineContext(ctx: FieldContext): void {
    try {
        localStorage.setItem('gandia-campo-context', JSON.stringify(ctx))
    } catch { /* ignore quota errors */ }
}

/**
 * Solicita coordenadas GPS (no bloqueante — retorna null si no disponible).
 */
export function requestGPS(): Promise<FieldContext['gps'] | null> {
    return new Promise((resolve) => {
        if (!navigator.geolocation) { resolve(null); return }
        const timeout = setTimeout(() => resolve(null), 4000)
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                clearTimeout(timeout)
                resolve({
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                    accuracy: pos.coords.accuracy,
                })
            },
            () => { clearTimeout(timeout); resolve(null) },
            { timeout: 3500, maximumAge: 60000 }
        )
    })
}

// ─── CRUD DE LA COLA ──────────────────────────────────────────────────────────

/**
 * Agrega un nuevo item a la cola offline.
 */
export async function addToQueue(
    item: Omit<QueueItem, 'id' | 'createdAt' | 'status' | 'retries'>
): Promise<QueueItem> {
    const entry: QueueItem = {
        ...item,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        status: 'queued',
        retries: 0,
    }
    await db.queue.add(entry)
    return entry
}

/**
 * Todos los items del usuario, orden cronológico inverso.
 */
export async function getAllItems(userId: string): Promise<QueueItem[]> {
    const items = await db.queue
        .where('createdAt')
        .above('')               // traer todos
        .toArray()
    return items
        .filter(i => i.context.userId === userId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

/**
 * Items pendientes de sincronizar (queued o failed con menos de 5 reintentos).
 */
export async function getPendingItems(): Promise<QueueItem[]> {
    const all = await db.queue.where('status').anyOf(['queued', 'failed']).toArray()
    return all.filter(i => i.retries < 5)
}

/**
 * Actualiza el estado de un item.
 */
export async function updateItemStatus(
    id: string,
    status: QueueStatus,
    extra?: Partial<Pick<QueueItem, 'retries' | 'syncedAt' | 'errorMsg'>>
): Promise<void> {
    await db.queue.update(id, { status, ...extra })
}

/**
 * Elimina los items ya sincronizados (limpieza periódica).
 */
export async function clearSynced(): Promise<number> {
    return db.queue.where('status').equals('synced').delete()
}

/**
 * Cuenta items en la cola por estado.
 */
export async function countByStatus(userId: string): Promise<Record<QueueStatus, number>> {
    const items = await getAllItems(userId)
    return {
        queued: items.filter(i => i.status === 'queued').length,
        syncing: items.filter(i => i.status === 'syncing').length,
        synced: items.filter(i => i.status === 'synced').length,
        failed: items.filter(i => i.status === 'failed').length,
    }
}