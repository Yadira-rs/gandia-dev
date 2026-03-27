/**
 * QueueList.tsx
 * Cards de la cola offline — compactas, con estado visual y animación de sync.
 */

import { useEffect, useRef, useState } from 'react'
import type { QueueItem, QueueStatus } from '../../lib/fieldQueue'

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function relTime(iso: string): string {
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
    if (diff < 10) return 'ahora'
    if (diff < 60) return `${diff}s`
    if (diff < 3600) return `${Math.floor(diff / 60)} min`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`
    return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })
}

function fmtSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)} KB`
    return `${(bytes / 1048576).toFixed(1)} MB`
}

// ─── ÍCONOS DE TIPO ───────────────────────────────────────────────────────────

function TypeIcon({ type }: { type: QueueItem['type'] }) {
    const cls = 'w-4 h-4 shrink-0'
    const s = { className: cls, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '1.75', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
    if (type === 'audio') return (
        <svg {...s}>
            <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="22" />
        </svg>
    )
    if (type === 'image') return (
        <svg {...s}>
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
        </svg>
    )
    if (type === 'file') return (
        <svg {...s}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
        </svg>
    )
    // text
    return (
        <svg {...s}>
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
    )
}

// ─── STATUS BADGE ─────────────────────────────────────────────────────────────

const STATUS_STYLE: Record<QueueStatus, { label: string; cls: string; dot: string }> = {
    queued: { label: 'En cola', cls: 'text-amber-500', dot: 'bg-amber-400' },
    syncing: { label: 'Enviando…', cls: 'text-[#2FAF8F]', dot: 'bg-[#2FAF8F] animate-pulse' },
    synced: { label: 'Sincronizado', cls: 'text-stone-400 dark:text-stone-500', dot: 'bg-stone-300 dark:bg-stone-600' },
    failed: { label: 'Error', cls: 'text-rose-500', dot: 'bg-rose-500' },
}

function StatusBadge({ status }: { status: QueueStatus }) {
    const s = STATUS_STYLE[status]
    return (
        <span className={`flex items-center gap-1 text-[10.5px] font-medium ${s.cls}`}>
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.dot}`} />
            {s.label}
        </span>
    )
}

// ─── QUEUE CARD ───────────────────────────────────────────────────────────────

function QueueCard({ item, animate }: { item: QueueItem; animate?: boolean }) {
    const cardRef = useRef<HTMLDivElement>(null)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        // Entrada suave
        requestAnimationFrame(() => setMounted(true))
    }, [])

    // Animación de "despegue" al sincronizar
    useEffect(() => {
        if (item.status === 'synced' && cardRef.current) {
            cardRef.current.style.transition = 'all 0.5s cubic-bezier(0.4,0,0.2,1)'
            cardRef.current.style.opacity = '0'
            cardRef.current.style.transform = 'translateY(-8px) scale(0.97)'
        }
    }, [item.status])

    const content = item.content.length > 52
        ? item.content.slice(0, 52) + '…'
        : item.content

    const typeColor: Record<QueueItem['type'], string> = {
        text: 'bg-stone-100 dark:bg-stone-800/60 text-stone-400 dark:text-stone-500',
        audio: 'bg-purple-50 dark:bg-purple-950/30 text-purple-400',
        image: 'bg-[#2FAF8F]/08 text-[#2FAF8F]',
        file: 'bg-blue-50 dark:bg-blue-950/30 text-blue-400',
    }

    return (
        <div
            ref={cardRef}
            style={{
                opacity: mounted ? 1 : 0,
                transform: mounted ? 'translateY(0)' : 'translateY(6px)',
                transition: animate ? 'opacity 0.3s ease, transform 0.3s ease' : 'none',
            }}
            className={[
                'flex items-start gap-3 px-3 py-2.5',
                'bg-white dark:bg-[#1c1917]',
                'border border-stone-100 dark:border-stone-800/50',
                'rounded-[14px] shadow-[0_1px_4px_rgba(0,0,0,0.06)]',
            ].join(' ')}
        >
            {/* Ícono de tipo */}
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${typeColor[item.type]}`}>
                <TypeIcon type={item.type} />
            </div>

            {/* Contenido */}
            <div className="flex-1 min-w-0">
                <p className="text-[12.5px] text-stone-700 dark:text-stone-200 leading-snug truncate">
                    {content}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10.5px] text-stone-400 dark:text-stone-600">
                        {relTime(item.createdAt)}
                    </span>
                    {item.fileSize && (
                        <span className="text-[10.5px] text-stone-300 dark:text-stone-700">
                            · {fmtSize(item.fileSize)}
                        </span>
                    )}
                </div>
            </div>

            {/* Status badge */}
            <div className="shrink-0 mt-0.5">
                <StatusBadge status={item.status} />
            </div>
        </div>
    )
}

// ─── QUEUE LIST ───────────────────────────────────────────────────────────────

interface QueueListProps {
    items: QueueItem[]
    loading?: boolean
    className?: string
}

export function QueueList({ items, loading, className = '' }: QueueListProps) {
    if (loading) {
        return (
            <div className={`flex items-center justify-center py-6 ${className}`}>
                <div className="w-4 h-4 border-2 border-[#2FAF8F] border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    // Solo mostrar los últimos 8 y los no sincronizados
    const visible = items
        .filter(i => i.status !== 'synced')
        .slice(0, 8)

    const syncedCount = items.filter(i => i.status === 'synced').length

    if (visible.length === 0 && syncedCount === 0) {
        return null
    }
    return (
        <div className={`space-y-2 ${className}`}>
            {/* Cards */}
            {visible.map((item, i) => (
                <QueueCard key={item.id} item={item} animate={i < 3} />
            ))}
        </div>
    )
}