import { useState, useRef, useEffect } from 'react'
import type { ReactElement } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNotifications } from '../../context/NotificationsContext'
import type { AppNotification, NotifType } from '../../context/NotificationsContext'

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface NotificacionesPanelProps {
  isOpen: boolean
  onClose: () => void
}

// ─── ICONS ────────────────────────────────────────────────────────────────────
const sv = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '1.6', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

const IcoBell  = ({ c = 'w-4 h-4' }: { c?: string }) => <svg className={c} {...sv}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
const IcoCheck = () => <svg className="w-3 h-3" {...sv}><polyline points="20 6 9 17 4 12"/></svg>
const IcoWarn  = () => <svg className="w-3 h-3" {...sv}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
const IcoInfo  = () => <svg className="w-3 h-3" {...sv}><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
const IcoX     = () => <svg className="w-3 h-3" {...sv}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
const IcoSpark = () => <svg className="w-2.5 h-2.5" {...sv}><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
const IcoArrow = () => <svg className="w-3 h-3" {...sv}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>

// ─── TYPE CONFIG ──────────────────────────────────────────────────────────────
const TYPE_CFG: Record<NotifType, {
  Icon: () => ReactElement
  accent: string
  glow: string
  label: string
}> = {
  approval: { Icon: IcoCheck, accent: '#2FAF8F', glow: 'rgba(47,175,143,0.35)', label: 'Aprobación' },
  tramite:  { Icon: IcoWarn,  accent: '#f59e0b', glow: 'rgba(245,158,11,0.35)', label: 'Trámite'    },
  system:   { Icon: IcoInfo,  accent: '#818cf8', glow: 'rgba(129,140,248,0.35)',label: 'Sistema'     },
}

// ─── HELPER ───────────────────────────────────────────────────────────────────
function formatTime(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60) return 'Ahora'
  if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} h`
  return 'Ayer'
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function NotificacionesPanel({ isOpen, onClose }: NotificacionesPanelProps) {
  const navigate  = useNavigate()
  const panelRef  = useRef<HTMLDivElement>(null)
  const [rendered, setRendered] = useState(false)
  const [removing, setRemoving] = useState<Set<string>>(new Set())

  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications()

  // Mostrar solo las 5 más recientes en el panel
  const visible = notifications.slice(0, 5)
  const noLeidas = unreadCount

  useEffect(() => {
    if (!isOpen) return
    const id = requestAnimationFrame(() => setRendered(true))
    return () => { cancelAnimationFrame(id); setRendered(false) }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const fn = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [isOpen, onClose])

  const handleEliminar = (id: string) => {
    setRemoving(s => new Set(s).add(id))
    setTimeout(() => {
      deleteNotification(id)
      setRemoving(s => { const ns = new Set(s); ns.delete(id); return ns })
    }, 300)
  }

  if (!isOpen && !rendered) return null

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600&display=swap');

        .di { font-family: 'Geist', system-ui, sans-serif; -webkit-font-smoothing: antialiased; }
        .di-serif { font-family: 'Instrument Serif', Georgia, serif; }

        /* ── island container ── */
        .di-island {
          position: absolute;
          top: calc(100% + 10px);
          right: 0;
          z-index: 60;
          width: 340px;
          max-width: calc(100vw - 1.5rem);

          background: #0a0a0a;
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 28px;
          box-shadow:
            0 0 0 0.5px rgba(255,255,255,0.06),
            0 24px 64px rgba(0,0,0,0.7),
            0 4px 16px rgba(0,0,0,0.4);

          overflow: hidden;

          /* closed → open */
          transform-origin: top right;
          transition:
            opacity        280ms cubic-bezier(.16,1,.3,1),
            transform      320ms cubic-bezier(.16,1,.3,1),
            border-radius  320ms cubic-bezier(.16,1,.3,1),
            max-height     380ms cubic-bezier(.16,1,.3,1);

          opacity:    0;
          transform:  scale(0.88) translateY(-8px);
          max-height: 0;
        }
        .di-island.di-open {
          opacity:    1;
          transform:  scale(1) translateY(0);
          max-height: 640px;
        }

        /* ── content fade ── */
        .di-content {
          opacity: 0;
          transform: translateY(6px);
          transition: opacity 220ms 120ms ease, transform 220ms 120ms ease;
        }
        .di-open .di-content {
          opacity: 1;
          transform: translateY(0);
        }

        /* ── row entrance ── */
        @keyframes di-row-in {
          from { opacity: 0; transform: translateX(-6px); }
          to   { opacity: 1; transform: translateX(0);    }
        }
        .di-row { animation: di-row-in 220ms cubic-bezier(.16,1,.3,1) both; }

        /* ── row dismiss ── */
        @keyframes di-dismiss {
          from { opacity: 1; max-height: 90px; transform: translateX(0) scale(1); }
          to   { opacity: 0; max-height: 0;   transform: translateX(16px) scale(0.96); padding: 0; }
        }
        .di-removing { animation: di-dismiss 300ms cubic-bezier(.4,0,1,1) both; overflow: hidden; }

        /* ── scroll ── */
        .di-scroll::-webkit-scrollbar { width: 2px; }
        .di-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 999px; }
        .di-scroll { scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.1) transparent; }

        /* ── unread dot pulse ── */
        @keyframes di-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(47,175,143,0.5); }
          50%       { box-shadow: 0 0 0 4px rgba(47,175,143,0); }
        }
        .di-pulse { animation: di-pulse 2s ease infinite; }

        /* ── glow chip ── */
        .di-chip {
          display: flex; align-items: center; justify-content: center;
          width: 28px; height: 28px;
          border-radius: 8px;
          flex-shrink: 0;
          transition: transform 150ms ease;
        }
        .di-row:hover .di-chip { transform: scale(1.08); }

        /* ── separator ── */
        .di-sep { height: 1px; background: rgba(255,255,255,0.06); margin: 0 16px; }
      `}</style>

      {/* ── ISLAND ── */}
      <div
        ref={panelRef}
        className={`di di-island ${rendered && isOpen ? 'di-open' : ''}`}
      >
        <div className="di-content">

          {/* ── TOP BAR ── */}
          <div className="flex items-center justify-between px-4 pt-4 pb-3.5">
            <div className="flex items-center gap-2">
              <span style={{ color: '#2FAF8F' }}><IcoSpark /></span>
              <span
                className="di-serif italic text-[15px] leading-none"
                style={{ color: 'rgba(255,255,255,0.75)' }}
              >
                Notificaciones
              </span>
              {noLeidas > 0 && (
                <span
                  className="text-[10px] font-semibold leading-none"
                  style={{ color: 'rgba(255,255,255,0.2)' }}
                >
                  · {noLeidas}
                </span>
              )}
            </div>

            {noLeidas > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-[10.5px] font-medium transition-colors"
                style={{ color: 'rgba(255,255,255,0.2)' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#2FAF8F')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.2)')}
              >
                Marcar leídas
              </button>
            )}
          </div>

          {/* ── DIVIDER ── */}
          <div className="di-sep" />

          {/* ── LIST ── */}
          <div className="di-scroll overflow-y-auto max-h-[400px] py-1.5">
            {visible.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <IcoBell c="w-5 h-5 text-white/25" />
                </div>
                <p className="text-[12px] text-white/30">Sin notificaciones</p>
              </div>
            ) : (
              visible.map((n, i) => (
                <NotifRow
                  key={n.id}
                  n={n}
                  delay={i * 32}
                  removing={removing.has(n.id)}
                  isLast={i === visible.length - 1}
                  onRead={() => markAsRead(n.id)}
                  onDel={() => handleEliminar(n.id)}
                />
              ))
            )}
          </div>

          {/* ── FOOTER ── */}
          <div className="di-sep" />
          <button
            onClick={() => { onClose(); navigate('/notificaciones') }}
            className="group w-full flex items-center justify-center gap-2 h-12 transition-colors"
            style={{ color: 'rgba(255,255,255,0.35)' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#2FAF8F')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}
          >
            <span className="text-[12.5px] font-medium">Ver historial completo</span>
            <IcoArrow />
          </button>

        </div>
      </div>
    </>
  )
}

// ─── ROW ──────────────────────────────────────────────────────────────────────
function NotifRow({
  n, delay, removing, isLast, onRead, onDel,
}: {
  n: AppNotification
  delay: number
  removing: boolean
  isLast: boolean
  onRead: () => void
  onDel: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const cfg   = TYPE_CFG[n.type]
  const Icon  = cfg.Icon

  return (
    <div
      style={{ animationDelay: `${delay}ms` }}
      className={`di-row group relative flex items-start gap-3 px-4 py-3 transition-colors ${removing ? 'di-removing' : ''}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* hover bg */}
      {hovered && (
        <div className="absolute inset-0 rounded-none" style={{ background: 'rgba(255,255,255,0.04)' }} />
      )}

      {/* left accent line */}
      {!n.read && (
        <div
          className="absolute left-0 top-3.5 bottom-3.5 w-[2px] rounded-r-full"
          style={{ background: cfg.accent }}
        />
      )}

      {/* icon chip */}
      <div
        className="di-chip relative z-10"
        style={{
          background: `${cfg.accent}18`,
          boxShadow: hovered ? `0 0 10px ${cfg.glow}` : 'none',
          transition: 'box-shadow 200ms ease',
        }}
      >
        <span style={{ color: cfg.accent }}>
          <Icon />
        </span>
      </div>

      {/* content */}
      <div className="flex-1 min-w-0 relative z-10">
        {/* label + time */}
        <div className="flex items-center gap-1.5 mb-[3px]">
          <span
            className="text-[9.5px] font-semibold uppercase tracking-[0.08em]"
            style={{ color: cfg.accent }}
          >
            {cfg.label}
          </span>
          <span className="w-[3px] h-[3px] rounded-full" style={{ background: 'rgba(255,255,255,0.15)' }} />
          <span className="text-[10.5px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{formatTime(n.created_at)}</span>
        </div>

        {/* title */}
        <p
          className="text-[13px] font-medium leading-snug mb-1 pr-6 transition-colors"
          style={{ color: n.read ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.92)' }}
        >
          {n.title}
        </p>

        {/* message */}
        <p
          className="text-[11.5px] leading-[1.65] line-clamp-2"
          style={{ color: 'rgba(255,255,255,0.3)' }}
        >
          {n.body}
        </p>

        {/* mark read */}
        {!n.read && hovered && (
          <button
            onClick={onRead}
            className="mt-2 text-[11px] font-medium"
            style={{ color: '#2FAF8F' }}
          >
            Marcar como leída
          </button>
        )}
      </div>

      {/* unread dot */}
      {!n.read && !hovered && (
        <div
          className="di-pulse shrink-0 w-1.5 h-1.5 rounded-full mt-1.5 relative z-10"
          style={{ background: '#2FAF8F' }}
        />
      )}

      {/* dismiss */}
      {hovered && (
        <button
          onClick={onDel}
          className="absolute top-3 right-3 w-5 h-5 flex items-center justify-center rounded-md transition-colors z-10"
          style={{ color: 'rgba(255,255,255,0.2)' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.2)')}
        >
          <IcoX />
        </button>
      )}

      {/* row separator */}
      {!isLast && (
        <div className="absolute bottom-0 left-14 right-4 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />
      )}
    </div>
  )
}