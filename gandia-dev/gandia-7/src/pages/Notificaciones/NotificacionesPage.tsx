import React, { useState } from 'react'
import { useNotifications } from '../../context/NotificationsContext'
import type { AppNotification, NotifType } from '../../context/NotificationsContext'

// ─── TYPES ────────────────────────────────────────────────────────────────────
type FilterState = 'todas' | 'no-leidas' | 'leidas'
type TypeFilter  = 'all' | NotifType

// ─── ICONS ────────────────────────────────────────────────────────────────────
const sv = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '1.6', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

const IcoBell   = ({ c = 'w-4 h-4' }: { c?: string }) => <svg className={c} {...sv}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
const IcoCheck  = ({ c = 'w-4 h-4' }: { c?: string }) => <svg className={c} {...sv}><polyline points="20 6 9 17 4 12"/></svg>
const IcoWarn   = ({ c = 'w-4 h-4' }: { c?: string }) => <svg className={c} {...sv}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
const IcoInfo   = ({ c = 'w-4 h-4' }: { c?: string }) => <svg className={c} {...sv}><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
const IcoX      = ({ c = 'w-3.5 h-3.5' }: { c?: string }) => <svg className={c} {...sv}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
const IcoSpark  = () => <svg className="w-2.5 h-2.5" {...sv}><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>

// ─── TYPE CONFIG ──────────────────────────────────────────────────────────────
const T: Record<NotifType, { Icon: (p:{c?:string}) => React.ReactElement; accent: string; chip: string; label: string; stat: string }> = {
  approval: { Icon: IcoCheck, accent: '#2FAF8F', chip: 'bg-[#2FAF8F]/10 text-[#2FAF8F]',                           label: 'Aprobación',  stat: 'bg-[#2FAF8F]/10 dark:bg-[#2FAF8F]/15 text-[#2FAF8F]'       },
  tramite:  { Icon: IcoWarn,  accent: '#f59e0b', chip: 'bg-amber-50 dark:bg-amber-900/20 text-amber-500',           label: 'Trámite',     stat: 'bg-amber-50 dark:bg-amber-900/20 text-amber-500 dark:text-amber-400' },
  system:   { Icon: IcoInfo,  accent: '#818cf8', chip: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500',        label: 'Sistema',     stat: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 dark:text-indigo-400' },
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function formatDate(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diff = (now.getTime() - d.getTime()) / 1000

  if (diff < 60) return 'Hace un momento'
  if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} h`
  if (diff < 172800) return 'Ayer'
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatGroupDate(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const itemDay = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const diff = (today.getTime() - itemDay.getTime()) / 86400000

  if (diff === 0) return 'Hoy'
  if (diff === 1) return 'Ayer'
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
}

function groupByDate(list: AppNotification[]) {
  const map = new Map<string, AppNotification[]>()
  list.forEach(n => {
    const key = formatGroupDate(n.created_at)
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(n)
  })
  return map
}

// ─── SKELETON ─────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="bg-white dark:bg-[#141210] border border-stone-200/70 dark:border-stone-800/60 rounded-2xl overflow-hidden">
      {[1,2,3].map(i => (
        <div key={i} className="flex gap-4 px-5 py-4 border-b border-stone-100 dark:border-stone-800/40 last:border-b-0 animate-pulse">
          <div className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-stone-800 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-stone-100 dark:bg-stone-800 rounded w-1/3" />
            <div className="h-3.5 bg-stone-100 dark:bg-stone-800 rounded w-2/3" />
            <div className="h-3 bg-stone-100 dark:bg-stone-800 rounded w-full" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function NotificacionesPage() {
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead, deleteNotification } = useNotifications()

  const [filter, setFilter]         = useState<FilterState>('todas')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')

  let visible = notifications
  if (filter === 'no-leidas') visible = visible.filter(n => !n.read)
  if (filter === 'leidas')    visible = visible.filter(n =>  n.read)
  if (typeFilter !== 'all')   visible = visible.filter(n => n.type === typeFilter)

  const groups = groupByDate(visible)

  const FILTERS: { key: FilterState; label: string; count: number }[] = [
    { key: 'todas',     label: 'Todas',    count: notifications.length },
    { key: 'no-leidas', label: 'Sin leer', count: unreadCount },
    { key: 'leidas',    label: 'Leídas',   count: notifications.length - unreadCount },
  ]

  const TYPES: { key: TypeFilter; label: string }[] = [
    { key: 'all',      label: 'Todos'      },
    { key: 'approval', label: 'Aprobación' },
    { key: 'tramite',  label: 'Trámites'   },
    { key: 'system',   label: 'Sistema'    },
  ]

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600&display=swap');

        .np * { -webkit-font-smoothing: antialiased; }
        .np { font-family: 'Geist', system-ui, sans-serif; }
        .np-serif { font-family: 'Instrument Serif', Georgia, serif; }

        .np-scroll::-webkit-scrollbar { width: 3px; }
        .np-scroll::-webkit-scrollbar-track { background: transparent; }
        .np-scroll::-webkit-scrollbar-thumb { background: #e7e5e4; border-radius: 999px; }
        .dark .np-scroll::-webkit-scrollbar-thumb { background: #3c3836; }
        .np-scroll { scrollbar-width: thin; scrollbar-color: #e7e5e4 transparent; }

        @keyframes np-in {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
        .np-in { animation: np-in 320ms cubic-bezier(.16,1,.3,1) both; }

        .np-row { transition: background 120ms ease; }
        .np-row:hover { background: rgba(0,0,0,0.02); }
        .dark .np-row:hover { background: rgba(255,255,255,0.025); }

        .np-pill {
          height: 28px;
          padding: 0 12px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 500;
          transition: all 140ms ease;
          white-space: nowrap;
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }
      `}</style>

      <div className="np min-h-screen bg-[#fafaf9] dark:bg-[#0c0a09]">
        <div className="max-w-3xl mx-auto px-4 py-8 space-y-5">

          {/* ── HEADER ── */}
          <div className="np-in flex items-start justify-between gap-4">
            <div>
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-stone-400 dark:text-stone-500 mb-1.5">
                Centro de actividad
              </p>
              <div className="flex items-center gap-3">
                <h1 className="np-serif text-[28px] leading-tight tracking-[-0.01em] text-stone-900 dark:text-stone-50">
                  Notificaciones
                </h1>
                {unreadCount > 0 && (
                  <span className="inline-flex items-center justify-center h-6 min-w-6 px-2 rounded-full text-[11px] font-semibold border border-stone-300 dark:border-stone-600 text-stone-400 dark:text-stone-500">
                    {unreadCount}
                  </span>
                )}
              </div>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="shrink-0 mt-1 flex items-center gap-1.5 text-[12px] font-medium text-stone-400 dark:text-stone-500 hover:text-[#2FAF8F] transition-colors"
              >
                <IcoCheck c="w-3.5 h-3.5" />
                Marcar todas como leídas
              </button>
            )}
          </div>

          {/* ── FILTERS ── */}
          <div className="np-in flex items-center gap-2 flex-wrap" style={{ animationDelay: '70ms' }}>
            {/* Separador visual */}
            <div className="flex gap-1.5 flex-wrap">
              {FILTERS.map(f => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`np-pill ${
                    filter === f.key
                      ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-sm'
                      : 'bg-white dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/60 text-stone-500 dark:text-stone-400 hover:border-stone-300 dark:hover:border-stone-600'
                  }`}
                >
                  {f.label}
                  {f.count > 0 && (
                    <span className={`text-[10px] font-semibold ${filter === f.key ? 'opacity-60' : 'opacity-50'}`}>
                      {f.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="w-px h-4 bg-stone-200 dark:bg-stone-700/60 shrink-0" />

            <div className="flex gap-1.5 flex-wrap">
              {TYPES.filter(t => t.key !== 'all').map(t => {
                const cfg = T[t.key as NotifType]
                const isActive = typeFilter === t.key
                return (
                  <button
                    key={t.key}
                    onClick={() => setTypeFilter(isActive ? 'all' : t.key)}
                    className={`np-pill ${
                      isActive
                        ? 'shadow-sm'
                        : 'bg-white dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700/40 text-stone-400 dark:text-stone-500 hover:border-stone-300'
                    }`}
                    style={isActive ? { background: cfg.accent + '18', color: cfg.accent, border: `1px solid ${cfg.accent}40` } : {}}
                  >
                    {isActive && <cfg.Icon c="w-3 h-3" />}
                    {t.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* ── LIST ── */}
          <div className="np-in" style={{ animationDelay: '110ms' }}>
            {isLoading && notifications.length === 0 ? (
              <Skeleton />
            ) : visible.length === 0 ? (
              <div className="bg-white dark:bg-[#141210] border border-stone-200/70 dark:border-stone-800/60 rounded-2xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] dark:shadow-none flex flex-col items-center justify-center py-20 gap-3">
                <div className="w-12 h-12 rounded-2xl bg-stone-100 dark:bg-stone-800/50 flex items-center justify-center text-stone-300 dark:text-stone-600">
                  <IcoBell c="w-5 h-5" />
                </div>
                <div className="text-center">
                  <p className="text-[14px] font-medium text-stone-500 dark:text-stone-400 mb-0.5">Sin notificaciones</p>
                  <p className="text-[12px] text-stone-300 dark:text-stone-600">
                    {filter === 'no-leidas' ? 'Estás al día' : 'Ajusta los filtros para ver más'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-[#141210] border border-stone-200/70 dark:border-stone-800/60 rounded-2xl overflow-hidden shadow-[0_1px_8px_rgba(0,0,0,0.04)] dark:shadow-none">
                {Array.from(groups.entries()).map(([date, items], gi) => (
                  <div key={date}>
                    <div className={`px-5 py-2 ${gi > 0 ? 'border-t border-stone-100 dark:border-stone-800/40' : ''}`}>
                      <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-stone-300 dark:text-stone-600">
                        {date}
                      </p>
                    </div>

                    {items.map((n, i) => {
                      const cfg = T[n.type]
                      const Icon = cfg.Icon
                      const isLast = i === items.length - 1

                      return (
                        <div
                          key={n.id}
                          className={`np-row group relative flex gap-4 px-5 py-4 ${
                            !isLast ? 'border-b border-stone-100/80 dark:border-stone-800/30' : ''
                          }`}
                        >
                          {/* unread bar */}
                          {!n.read && (
                            <div
                              className="absolute left-0 top-4 bottom-4 w-[2.5px] rounded-r-full"
                              style={{ background: cfg.accent }}
                            />
                          )}

                          {/* icon */}
                          <div className={`shrink-0 w-10 h-10 rounded-xl ${cfg.chip} flex items-center justify-center transition-transform group-hover:scale-[1.04]`}>
                            <Icon c="w-4 h-4" />
                          </div>

                          {/* content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="text-[9.5px] font-semibold uppercase tracking-[0.08em]" style={{ color: cfg.accent }}>
                                {cfg.label}
                              </span>
                              <span className="w-[3px] h-[3px] rounded-full bg-stone-200 dark:bg-stone-700 shrink-0" />
                              <span className="text-[11px] text-stone-300 dark:text-stone-600">{formatDate(n.created_at)}</span>
                            </div>

                            <p className={`text-[13.5px] font-medium leading-snug mb-1 ${
                              n.read ? 'text-stone-500 dark:text-stone-400' : 'text-stone-800 dark:text-stone-100'
                            }`}>
                              {n.title}
                            </p>

                            <p className="text-[12.5px] text-stone-400 dark:text-stone-500 leading-[1.65]">
                              {n.body}
                            </p>

                            <div className="flex items-center gap-3 mt-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              {!n.read && (
                                <button
                                  onClick={() => markAsRead(n.id)}
                                  className="text-[11.5px] font-medium transition-colors"
                                  style={{ color: cfg.accent }}
                                >
                                  Marcar como leída
                                </button>
                              )}
                              {!n.read && <div className="w-px h-3 bg-stone-200 dark:bg-stone-700" />}
                              <button
                                onClick={() => deleteNotification(n.id)}
                                className="flex items-center gap-1 text-[11.5px] font-medium text-stone-300 dark:text-stone-600 hover:text-red-400 transition-colors"
                              >
                                <IcoX c="w-3 h-3" /> Eliminar
                              </button>
                            </div>
                          </div>

                          {/* unread dot */}
                          {!n.read && (
                            <div className="shrink-0 w-1.5 h-1.5 rounded-full mt-1.5" style={{ background: cfg.accent }} />
                          )}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── IA BADGE ── */}
          {!isLoading && notifications.length > 0 && (
            <div className="np-in flex justify-center" style={{ animationDelay: '160ms' }}>
              <div className="inline-flex items-center gap-1.5 text-[11px] font-medium text-stone-300 dark:text-stone-600">
                <IcoSpark />
                Notificaciones en tiempo real · Gandia IA
              </div>
            </div>
          )}

          <div className="h-8" />
        </div>
      </div>
    </>
  )
}