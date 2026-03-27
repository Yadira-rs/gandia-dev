/**
 * Campo.tsx
 * Agente de Campo Offline — GANDIA 7
 *
 * Pantalla única: esfera agente + input + cola offline.
 * Funciona sin internet: captura, guarda en IndexedDB,
 * sincroniza automáticamente cuando vuelve la conexión.
 */

import {
    useState,
    useEffect,
    useCallback,
    useRef,
} from 'react'
import { FieldSphere, type SphereState } from './FieldSphere'
import { FieldInput, type FieldInputValue } from './FieldInput'
import { QueueList } from './QueueList'
import {
    addToQueue,
    getAllItems,
    readOfflineContext,
    type QueueItem,
    type FieldContext,
    db,
} from '../../lib/fieldQueue'
import { SyncEngine, type SyncEvent } from '../../lib/syncEngine'

// ─── MENSAJES DEL AGENTE ──────────────────────────────────────────────────────

const AGENT_MESSAGES: Record<SphereState, string[]> = {
    idle: ['Listo para recibir reporte.', 'Esperando…'],
    listening: ['Escuchando…', 'Grabando audio…'],
    saving: ['Guardando…', 'Registrando evento…'],
    queued: ['Guardado. Sin conexión.', 'En cola · sincronizará al conectar.'],
    syncing: ['Sincronizando…', 'Enviando al servidor…'],
    error: ['Error al sincronizar.', 'Reintentando más tarde.'],
}

// ─── INDICADOR DE CONEXIÓN ────────────────────────────────────────────────────

function ConnDot({ online }: { online: boolean }) {
    return (
        <span className="relative flex w-2 h-2 shrink-0">
            {online && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2FAF8F] opacity-50" />
            )}
            <span className={`relative inline-flex rounded-full w-2 h-2 ${online ? 'bg-[#2FAF8F]' : 'bg-amber-400'}`} />
        </span>
    )
}

// ─── CAMPO ────────────────────────────────────────────────────────────────────

export default function Campo() {
    const [sphereState, setSphereState] = useState<SphereState>('idle')
    const [volume, setVolume] = useState(0)
    const [agentMsg, setAgentMsg] = useState('Listo para recibir reporte.')
    const [online, setOnline] = useState(navigator.onLine)
    const [items, setItems] = useState<QueueItem[]>([])
    const [loadingQueue, setLoadingQueue] = useState(true)
    const [queueExpanded, setQueueExpanded] = useState(false)

    const contextRef = useRef<FieldContext | null>(null)
    const agentMsgTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    // ── Leer contexto offline ──────────────────────────────────────────────
    useEffect(() => {
        contextRef.current = readOfflineContext()
    }, [])

    // ── Cargar cola ────────────────────────────────────────────────────────
    const refreshQueue = useCallback(async () => {
        const ctx = contextRef.current
        if (!ctx?.userId) { setLoadingQueue(false); return }
        const all = await getAllItems(ctx.userId)
        setItems(all)
        setLoadingQueue(false)
    }, [])

    useEffect(() => {
        void refreshQueue()
    }, [refreshQueue])

    // ── Limpiar toda la cola local ────────────────────────────────────────────
    const handleClearQueue = useCallback(async () => {
        if (!confirm('¿Limpiar toda la cola local? Esto no borra nada en la nube.')) return
        await db.queue.clear()
        setItems([])
        setSphereState('idle')
        setMsg('Cola local limpiada.', 3000)
    }, [])

    // ── Iniciar sync engine ────────────────────────────────────────────────
    useEffect(() => {
        SyncEngine.start()

        const onSyncEvent = (ev: SyncEvent) => {
            if (ev.type === 'online') { setOnline(true); setSphereState('syncing') }
            if (ev.type === 'offline') { setOnline(false); setSphereState('queued') }
            if (ev.type === 'start') { setSphereState('syncing'); setMsg('Sincronizando…') }
            if (ev.type === 'done') {
                const { synced, failed } = ev as { type: 'done'; synced: number; failed: number }
                if (failed > 0) {
                    const isNetworkError = items.some(i => i.status === 'failed' && i.errorMsg?.includes('Failed to fetch'))
                    if (isNetworkError || !navigator.onLine) {
                        setSphereState('queued')
                        setMsg(`Guardado localmente. Esperando conexión…`)
                    } else {
                        setSphereState('error')
                        setMsg(`${failed} error${failed > 1 ? 'es' : ''} · reintentando.`)
                    }
                } else if (synced > 0) {
                    setSphereState('idle')
                    setMsg(`${synced} evento${synced > 1 ? 's' : ''} sincronizado${synced > 1 ? 's' : ''}.`)
                    setTimeout(() => { setSphereState('idle'); setMsg('Listo para recibir reporte.') }, 3000)
                } else {
                    setSphereState(navigator.onLine ? 'idle' : 'queued')
                }
                void refreshQueue()
            }
        }

        SyncEngine.on(onSyncEvent)

        return () => SyncEngine.off(onSyncEvent)
    }, [refreshQueue])

    // ── Online/offline del navegador ───────────────────────────────────────
    useEffect(() => {
        const onOnline = () => { setOnline(true) }
        const onOffline = () => { setOnline(false); setSphereState('queued') }
        window.addEventListener('online', onOnline)
        window.addEventListener('offline', onOffline)
        return () => {
            window.removeEventListener('online', onOnline)
            window.removeEventListener('offline', onOffline)
        }
    }, [])

    // ── Helper para mensaje con auto-reset ─────────────────────────────────
    const setMsg = useCallback((msg: string, resetAfter?: number) => {
        setAgentMsg(msg)
        if (agentMsgTimerRef.current) clearTimeout(agentMsgTimerRef.current)
        if (resetAfter) {
            agentMsgTimerRef.current = setTimeout(() => {
                setAgentMsg('Listo para recibir reporte.')
            }, resetAfter)
        }
    }, [])

    // ── Manejar envío desde FieldInput ─────────────────────────────────────
    const handleSend = useCallback(async (value: FieldInputValue) => {
        const ctx = contextRef.current
        if (!ctx?.userId) return

        // Límite de 30 mensajes offline solicitado por el usuario
        if (items.length >= 30) {
            setMsg('Límite de 30 reportes offline alcanzado.', 4000)
            return
        }

        setSphereState('saving')
        setMsg('Guardando…')

        try {
            // Capturar GPS en background (no bloqueante)
            let gps: FieldContext['gps'] | undefined
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    p => { gps = { lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy } },
                    () => { },
                    { timeout: 3000, maximumAge: 60000 }
                )
            }

            const item = await addToQueue({
                type: value.type,
                content: value.text,
                blob: value.blob,
                mimeType: value.mimeType,
                fileName: value.fileName,
                fileSize: value.fileSize,
                durationSec: value.durationSec,
                context: { ...ctx, gps },
            })

            // Actualizar UI inmediatamente
            setItems(prev => [item, ...prev])
            setQueueExpanded(true)

            if (navigator.onLine) {
                setSphereState('syncing')
                setMsg('Enviando…')
                void SyncEngine.sync().then(() => void refreshQueue())
            } else {
                setSphereState('queued')
                setMsg('Guardado. Sin conexión · sincronizará al conectar.', 4000)
            }
        } catch {
            setSphereState('error')
            setMsg('Error al guardar. Intenta de nuevo.', 4000)
            setTimeout(() => setSphereState('idle'), 4000)
        }
    }, [setMsg, refreshQueue])

    // ── Handlers de rec ────────────────────────────────────────────────────
    const handleRecStart = useCallback(() => {
        setSphereState('listening')
        setMsg('Escuchando…')
    }, [setMsg])

    const handleRecStop = useCallback(() => {
        setSphereState('saving')
        setMsg('Procesando audio…')
    }, [setMsg])

    // ── Pending count ──────────────────────────────────────────────────────
    const pendingCount = items.filter(i => i.status === 'queued' || i.status === 'failed').length

    // ── Nombre de rancho / operador ────────────────────────────────────────
    const ctx = contextRef.current

    return (
        <>
            {/* CSS específico de la página */}
            <style>{`
        @keyframes campo-fade-in {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .campo-fade { animation: campo-fade-in 0.4s cubic-bezier(0.16,1,0.3,1) forwards; }

        @keyframes agent-msg-in {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .agent-msg { animation: agent-msg-in 0.25s ease forwards; }

        @keyframes queue-slide {
          from { opacity: 0; max-height: 0; }
          to   { opacity: 1; max-height: 600px; }
        }
        .queue-slide {
          animation: queue-slide 0.35s cubic-bezier(0.16,1,0.3,1) forwards;
          overflow: hidden;
        }
      `}</style>

            <div className="flex flex-col h-full bg-[#fafaf9] dark:bg-[#0c0a09] overflow-hidden">
                {/* ── Barra de contexto (Ancho completo) ───────────────────────── */}
                <div className="campo-fade flex items-center justify-between gap-4 px-5 pt-5 pb-3">

                    {/* Izquierda: Rancho / operador */}
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#2FAF8F] to-[#1a9070] flex items-center justify-center text-white text-[12px] font-bold shadow-sm shrink-0">
                            {(ctx?.ranchoNombre || 'G').charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                            <p className="text-[14px] font-bold text-stone-800 dark:text-stone-100 truncate leading-tight">
                                {ctx?.ranchoNombre ?? 'Sin rancho'}
                            </p>
                            <p className="text-[11px] font-medium text-stone-400 dark:text-stone-500 truncate mt-0.5">
                                {ctx?.operadorNombre ?? 'Operador'}
                            </p>
                        </div>
                    </div>

                    {/* Derecha: Estado / Pendientes */}
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <div className="flex items-center gap-1.5">
                            <ConnDot online={online} />
                            <span className={`text-[11px] font-bold uppercase tracking-wider ${online ? 'text-[#2FAF8F]' : 'text-amber-500'}`}>
                                {online ? 'En línea' : 'Desconectado'}
                            </span>
                        </div>
                        {pendingCount > 0 && (
                            <div className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/40">
                                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                                    {pendingCount} PENDIENTE{pendingCount > 1 ? 'S' : ''}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex-1 flex flex-col w-full max-w-2xl mx-auto overflow-hidden">

                {/* ── Zona central — esfera ─────────────────────────────────────── */}
                <div className="flex-1 flex flex-col items-center justify-center px-6 min-h-0">

                    {/* Esfera */}
                    <div
                        className="campo-fade relative"
                        style={{ animationDelay: '80ms' }}
                    >
                        <FieldSphere
                            state={sphereState}
                            volume={volume}
                            size={200}
                        />
                    </div>

                    {/* Mensaje del agente */}
                    <div
                        key={agentMsg}
                        className="agent-msg mt-5 text-center"
                    >
                        <p className="text-[13.5px] font-medium text-stone-600 dark:text-stone-300 leading-snug">
                            {agentMsg}
                        </p>
                        {/* Subtexto de estado */}
                        <p className="text-[11.5px] text-stone-400 dark:text-stone-600 mt-1">
                            {sphereState === 'queued' && pendingCount > 0
                                ? `${pendingCount} evento${pendingCount > 1 ? 's' : ''} en cola`
                                : sphereState === 'idle' && !online
                                    ? 'Modo offline activo'
                                    : sphereState === 'syncing'
                                        ? 'Procesando eventos…'
                                        : AGENT_MESSAGES[sphereState]?.[1] ?? ''}
                        </p>
                    </div>

                    {/* Divisor */}
                    <div className="w-8 h-px bg-stone-200 dark:bg-stone-800 mt-6 mb-4" />
                </div>

                {/* ── Cola (expandible) ────────────────────────────────────────── */}
                {items.length > 0 && (
                    <div className="px-4 pb-3 flex flex-col">
                        {/* Fila: Cola + botón limpiar */}
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setQueueExpanded(p => !p)}
                                className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800/40 transition-colors"
                            >
                                <span className="text-[11px] font-medium text-stone-400 dark:text-stone-500 uppercase tracking-wider">
                                    Cola
                                </span>
                                {pendingCount > 0 && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 font-medium">
                                        {pendingCount}
                                    </span>
                                )}
                                <svg
                                    className={`w-3 h-3 text-stone-400 dark:text-stone-600 ml-auto transition-transform duration-200 ${queueExpanded ? 'rotate-180' : ''}`}
                                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                                >
                                    <polyline points="6 9 12 15 18 9" />
                                </svg>
                            </button>
                            {/* Botón limpiar cola */}
                            <button
                                onClick={() => void handleClearQueue()}
                                title="Limpiar cola local"
                                className="p-2 rounded-xl text-stone-300 dark:text-stone-700 hover:text-rose-400 dark:hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors shrink-0"
                            >
                                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                    <polyline points="3 6 5 6 21 6"></polyline>
                                    <path d="M19 6l-1 14H6L5 6"></path>
                                    <path d="M10 11v6M14 11v6"></path>
                                </svg>
                            </button>
                        </div>

                        {queueExpanded && (
                            <div className="queue-slide max-h-[260px] overflow-y-auto space-y-2 pr-1 mt-1">
                                <QueueList
                                    items={items}
                                    loading={loadingQueue}
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* ── Input bar ────────────────────────────────────────────────── */}
                <div
                    className="campo-fade pb-6 pt-1"
                    style={{ animationDelay: '160ms' }}
                >
                    <FieldInput
                        onSend={handleSend}
                        onVolume={setVolume}
                        onRecStart={handleRecStart}
                        onRecStop={handleRecStop}
                    />
                </div>

                </div>
            </div>
        </>
    )
}