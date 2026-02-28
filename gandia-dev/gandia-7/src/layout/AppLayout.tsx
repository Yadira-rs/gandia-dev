import { useState, useRef, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import NotificacionesPanel from '../pages/Notificaciones/Notificaciones'
import { supabase } from '../lib/supabaseClient'
import { useNotifications } from '../context/NotificationsContext'
import { useUser } from '../context/UserContext'

// ─── Derived user display from UserContext ───────────────────────────────────
const ROLE_NAMES: Record<string, string> = {
  producer: 'Productor Ganadero',
  mvz:      'Médico Veterinario',
  union:    'Unión Ganadera',
  exporter: 'Exportador',
  auditor:  'Auditor / Inspector',
}

// ─── Ticker IA ────────────────────────────────────────────────────────────────
const TICKER_ITEMS = [
  '🐄  IA detecta patrón atípico en vacunación — zona norte de Durango',
  '📋  Nuevos requisitos SENASICA para exportación a EE.UU. vigentes desde marzo 2026',
  '🌿  Modelo climático: temporada de lluvias favorable en Chihuahua y Durango',
  '✅  847 pasaportes ganaderos procesados hoy en la plataforma',
  '🔬  Protocolo aftosa 2026 actualizado — disponible en Trámites',
  '📈  Precio ganado en pie +3.2% respecto al mes anterior · SNIIM',
  '🛰  Cobertura satelital alcanza 94% del territorio ganadero nacional',
  '⚠️  Alerta sanitaria: brote reportado en Sonora — revisa tu plan preventivo',
]

// ─── Nav groups ───────────────────────────────────────────────────────────────
const NAV_GROUPS = [
  {
    label: 'Principal',
    items: [
      { label: 'Chat',       path: '/chat',      icon: 'chat'         },
      { label: 'Pasaportes', path: '/home',       icon: 'file'         },
      { label: 'Gemelos',    path: '/home',       icon: 'copy'         },
    ],
  },
  {
    label: 'Operaciones',
    items: [
      { label: 'Monitoreo',     path: '/home',     icon: 'eye'          },
      { label: 'Certificación', path: '/home',     icon: 'check-circle' },
      { label: 'Trámites',      path: '/tramites', icon: 'tramites'     },
      { label: 'Verificación',  path: '/home',     icon: 'verified'     },
    ],
  },
  {
    label: 'Registro',
    items: [
      { label: 'Historial', path: '/historial', icon: 'clock' },
    ],
  },
]

// ─── AppLayout ────────────────────────────────────────────────────────────────
function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed]     = useState(false)
  const [mobileMenuOpen,   setMobileMenuOpen]       = useState(false)
  const [userMenuOpen,     setUserMenuOpen]         = useState(false)
  const [notificacionesOpen, setNotificacionesOpen] = useState(false)
  const [logoutConfirmOpen,  setLogoutConfirmOpen]  = useState(false)
  const [isLoggingOut,       setIsLoggingOut]       = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const navigate    = useNavigate()
  const location    = useLocation()
  const { profile, isLoading: profileLoading } = useUser()
  const { unreadCount } = useNotifications()

  // Derivar datos de display desde el perfil del contexto
  const pd  = (profile?.personal_data  as Record<string, string> | null) ?? {}
  const id_ = (profile?.institutional_data as Record<string, string> | null) ?? {}

  const displayName =
    pd.fullName || pd.full_name || pd.nombre_completo || pd.nombre ||
    profile?.email?.split('@')[0] || ''

  const roleCode  = profile?.role ?? pd.role ?? ''
  const ranchName = id_.ranchName || id_.ranch_name || id_.rancho || ''
  const subtitle  =
    roleCode === 'producer' && ranchName
      ? ranchName
      : ROLE_NAMES[roleCode] || roleCode

  const avatarLetter = (displayName || profile?.email || '').charAt(0).toUpperCase() || (profileLoading ? '' : '?')
  const ranchLetter  = (ranchName || displayName || profile?.email || '').charAt(0).toUpperCase() || (profileLoading ? '' : '?')

  const currentUser = { displayName, subtitle, email: profile?.email ?? '', avatarLetter, ranchLetter }

  const isActive = (path: string) =>
    path !== '/home' &&
    (location.pathname === path || location.pathname.startsWith(path + '/'))

  const toggleSidebar = () => {
    if (window.innerWidth >= 1024) setSidebarCollapsed(p => !p)
  }

  const handleNav = (path: string) => {
    navigate(path)
    setMobileMenuOpen(false)
  }

  // ─── LOGOUT CORREGIDO ─────────────────────────────────────────────────────
  const handleLogout = async () => {
    if (isLoggingOut) return
    setIsLoggingOut(true)
    setLogoutConfirmOpen(false)

    try {
      await supabase.auth.signOut()
    } catch (err) {
      console.error('Error al cerrar sesión:', err)
    } finally {
      // Limpieza manual como respaldo por si el evento SIGNED_OUT no dispara
      ;['signup-auth-method', 'signup-email', 'signup-personal-data',
        'signup-institutional-data', 'signup-completed', 'user-status', 'account-id',
      ].forEach(key => localStorage.removeItem(key))

      setIsLoggingOut(false)
      navigate('/login', { replace: true })
    }
  }

  // Click‑outside con AbortController
  useEffect(() => {
    const ctrl = new AbortController()
    if (userMenuOpen) {
      document.addEventListener('mousedown', (e: MouseEvent) => {
        if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node))
          setUserMenuOpen(false)
      }, { signal: ctrl.signal })
    }
    return () => ctrl.abort()
  }, [userMenuOpen])

  // Keyboard shortcuts (⌘1 Chat, ⌘7 Historial, ⌘8 Trámites)
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey) {
        const map: Record<string, string> = { '1': '/chat', '7': '/historial', '8': '/tramites' }
        if (map[e.key]) { e.preventDefault(); navigate(map[e.key]) }
      }
    }
    document.addEventListener('keydown', fn)
    return () => document.removeEventListener('keydown', fn)
  }, [navigate])

  return (
    <>
      {/* ── CSS ── */}
      <style>{`
        @keyframes gandia-ticker {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .g-ticker {
          animation: gandia-ticker 70s linear infinite;
          will-change: transform;
        }
        .g-ticker:hover { animation-play-state: paused; }

        @keyframes gandia-popup {
          from { opacity: 0; transform: scale(0.96) translateY(6px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);   }
        }
        .g-popup {
          animation: gandia-popup 160ms cubic-bezier(0.16,1,0.3,1) forwards;
          transform-origin: bottom left;
        }

        @keyframes gandia-fade {
          from { opacity: 0; } to { opacity: 1; }
        }
        .g-fade { animation: gandia-fade 200ms ease forwards; }

        /* Language inline dropdown */
        @keyframes lang-slide {
          from { opacity: 0; transform: translateY(-4px) scaleY(0.95); }
          to   { opacity: 1; transform: translateY(0)    scaleY(1);    }
        }
        .g-lang-panel {
          animation: lang-slide 150ms cubic-bezier(0.16,1,0.3,1) forwards;
          transform-origin: top center;
        }

        *:focus-visible {
          outline: 2px solid rgba(47,175,143,0.65) !important;
          outline-offset: 2px;
          border-radius: 8px;
        }
      `}</style>

      <div className="flex h-screen bg-[#fafaf9] dark:bg-[#0c0a09] overflow-hidden">

        {/* ─── Mobile overlay ──────────────────────────────── */}
        {mobileMenuOpen && (
          <div
            className="g-fade fixed inset-0 bg-black/20 backdrop-blur-[2px] z-40 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* ─── Logout confirm modal ─────────────────────────── */}
        {logoutConfirmOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
              className="g-fade absolute inset-0 bg-black/30 backdrop-blur-md"
              onClick={() => setLogoutConfirmOpen(false)}
            />
            <div className="relative w-full max-w-[316px] bg-white dark:bg-[#1c1917] rounded-[20px] shadow-2xl border border-stone-200/80 dark:border-stone-800 overflow-hidden">
              <div className="h-[3px] bg-gradient-to-r from-rose-500 via-rose-400 to-orange-400" />
              <div className="p-6">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center mb-4 shadow-sm">
                  <IcoLogout className="w-4.5 h-4.5 text-rose-500" />
                </div>
                <h3 className="text-[15px] font-semibold tracking-[-0.015em] text-stone-900 dark:text-stone-50 mb-1">
                  ¿Cerrar sesión?
                </h3>
                <p className="text-[13px] text-stone-500 dark:text-stone-400 leading-[1.5]">
                  Tu sesión se cerrará en este dispositivo. Podrás volver cuando quieras.
                </p>
                <div className="flex gap-2 mt-5">
                  <button
                    onClick={() => setLogoutConfirmOpen(false)}
                    className="flex-1 h-9 rounded-xl text-[13px] font-medium text-stone-600 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 active:scale-[0.98] transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="flex-1 h-9 rounded-xl text-[13px] font-medium text-white bg-rose-500 hover:bg-rose-600 active:scale-[0.98] transition-all shadow-sm disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isLoggingOut
                      ? <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />Saliendo...</>
                      : 'Cerrar sesión'
                    }
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── Sidebar ──────────────────────────────────────── */}
        <aside
          className={[
            sidebarCollapsed ? 'lg:w-[68px]' : 'lg:w-[256px]',
            'w-[256px] shrink-0',
            'bg-white dark:bg-[#141210]',
            'border-r border-stone-200/80 dark:border-stone-800/70',
            'flex flex-col',
            'transition-all duration-[240ms] ease-[cubic-bezier(0.4,0,0.2,1)]',
            'fixed lg:relative h-full z-50',
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          ].join(' ')}
          aria-label="Navegación principal"
        >
          {/* Sidebar header */}
          <div className={[
            'h-[58px] flex items-center gap-3 border-b border-stone-100 dark:border-stone-800/50',
            sidebarCollapsed ? 'px-4 lg:justify-center' : 'px-4',
          ].join(' ')}>

            {/* Toggle button — desktop */}
            <button
              onClick={toggleSidebar}
              className="hidden lg:flex w-8 h-8 items-center justify-center rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800/60 transition-colors group relative shrink-0"
              aria-label={sidebarCollapsed ? 'Expandir menú' : 'Colapsar menú'}
            >
              <svg
                className={`w-[18px] h-[18px] text-stone-400 dark:text-stone-500 transition-all duration-150 ${sidebarCollapsed ? 'group-hover:opacity-0 group-hover:scale-75' : ''}`}
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
              </svg>
              {sidebarCollapsed && (
                <svg
                  className="w-[18px] h-[18px] text-stone-400 dark:text-stone-500 absolute opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 transition-all duration-150"
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/>
                </svg>
              )}
            </button>

            {/* Logo — mobile only */}
            <div className="lg:hidden w-8 h-8 flex items-center justify-center shrink-0">
              <svg className="w-[18px] h-[18px] text-stone-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
              </svg>
            </div>

            {/* Brand */}
            <span className="lg:hidden text-[15px] font-semibold tracking-[-0.02em] text-stone-800 dark:text-stone-100">
              Gandia 7
            </span>
            {!sidebarCollapsed && (
              <span className="hidden lg:block text-[15px] font-semibold tracking-[-0.02em] text-stone-800 dark:text-stone-100 transition-all">
                Gandia 7
              </span>
            )}

            {/* Collapse button — desktop expanded */}
            {!sidebarCollapsed && (
              <button
                onClick={toggleSidebar}
                className="hidden lg:flex ml-auto w-7 h-7 items-center justify-center rounded-md text-stone-300 dark:text-stone-600 hover:text-stone-500 dark:hover:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800/60 transition-all"
                aria-label="Colapsar menú"
              >
                <svg className="w-[15px] h-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/>
                </svg>
              </button>
            )}

            {/* Close — mobile */}
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden ml-auto w-7 h-7 flex items-center justify-center rounded-md text-stone-400 hover:text-stone-600 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              aria-label="Cerrar menú"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2 px-2" aria-label="Menú">
            {NAV_GROUPS.map((g) => (
              <NavGroup
                key={g.label}
                label={g.label}
                items={g.items}
                collapsed={sidebarCollapsed}
                isActive={isActive}
                onNav={handleNav}
              />
            ))}
          </nav>

          {/* Footer */}
          <div
            className="relative border-t border-stone-100 dark:border-stone-800/50"
            ref={userMenuRef}
          >
            {/* User popup */}
            {userMenuOpen && (
              <div className={[
                'g-popup absolute bottom-full z-50 mb-2',
                sidebarCollapsed
                  ? 'hidden lg:block left-full ml-2 w-60'
                  : 'left-2 right-2',
              ].join(' ')}>
                <div className="bg-white dark:bg-[#1c1917] rounded-[16px] border border-stone-200/80 dark:border-stone-800 shadow-[0_8px_32px_rgba(0,0,0,0.10)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.45)] overflow-hidden">
                  <UserMenuContent
                    displayName={currentUser.displayName}
                    email={currentUser.email}
                    avatarLetter={currentUser.avatarLetter}
                    onNav={(p) => { setUserMenuOpen(false); navigate(p) }}
                    onLogout={() => { setUserMenuOpen(false); setLogoutConfirmOpen(true) }}
                  />
                </div>
              </div>
            )}

            {/* Footer button */}
            <button
              id="tour-target-perfil"
              onClick={() => setUserMenuOpen(p => !p)}
              aria-expanded={userMenuOpen}
              aria-label="Menú de usuario"
              className={[
                'w-full h-[54px] flex items-center gap-3 px-4',
                'hover:bg-stone-50 dark:hover:bg-stone-800/40 transition-colors',
                sidebarCollapsed ? 'lg:justify-center lg:px-0' : '',
              ].join(' ')}
            >
              <Avatar letter={currentUser.avatarLetter} size={28} />
              <span className={[
                'text-[13px] font-medium text-stone-700 dark:text-stone-200 truncate flex-1 text-left',
                sidebarCollapsed ? 'lg:hidden' : '',
              ].join(' ')}>
                {currentUser.displayName || <span className="opacity-40">Cargando...</span>}
              </span>
              {!sidebarCollapsed && (
                <svg
                  className={`w-3.5 h-3.5 text-stone-400 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`}
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                >
                  <polyline points="18 15 12 9 6 15"/>
                </svg>
              )}
            </button>
          </div>
        </aside>

        {/* ─── Main ─────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

          {/* ── Glassmorphic header ──────────────────────────── */}
          <header className="relative z-20 shrink-0 h-[54px] flex items-center gap-3 px-4 lg:px-5 bg-white/40 dark:bg-[#0c0a09]/40 backdrop-blur-2xl backdrop-saturate-[180%] border-b border-white/60 dark:border-white/[0.06] shadow-[0_1px_0_rgba(255,255,255,0.8),0_2px_12px_rgba(0,0,0,0.06)] dark:shadow-[0_1px_0_rgba(255,255,255,0.04),0_2px_16px_rgba(0,0,0,0.35)]">

            {/* Hamburger — mobile */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors shrink-0"
              aria-label="Abrir menú"
            >
              <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>

            {/* Ranch / profile identity */}
            <button
              onClick={() => navigate('/perfil-rancho')}
              className="flex items-center gap-2 group shrink-0"
              aria-label="Perfil del rancho"
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#2FAF8F] to-[#1a9070] flex items-center justify-center text-white text-[11px] font-bold shadow-sm transition-transform group-hover:scale-105">
                {currentUser.ranchLetter}
              </div>
              <span className="block text-[13px] font-semibold tracking-[-0.015em] text-stone-700 dark:text-stone-200 group-hover:text-[#2FAF8F] transition-colors">
                {currentUser.subtitle || currentUser.displayName}
              </span>
            </button>

            {/* Separator */}
            <div className="hidden md:block w-px h-3.5 bg-stone-200 dark:bg-stone-700/60 shrink-0 mx-0.5" />

            {/* ── News ticker ────────────────────────────────── */}
            <button
              onClick={() => navigate('/noticias')}
              className="hidden md:flex flex-1 items-center gap-2.5 min-w-0 overflow-hidden rounded-lg py-1 px-1 -mx-1 hover:bg-stone-100/60 dark:hover:bg-stone-800/30 transition-colors duration-150 group/ticker"
              aria-label="Ver todas las noticias"
            >
              <span className="shrink-0 inline-flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.10em] text-stone-400 dark:text-stone-500 group-hover/ticker:text-stone-600 dark:group-hover/ticker:text-stone-300 transition-colors">
                <span className="w-[5px] h-[5px] rounded-full bg-[#2FAF8F] animate-pulse shrink-0" />
                Noticias
              </span>
              <div className="flex-1 overflow-hidden relative">
                <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-5 bg-gradient-to-r from-transparent to-transparent z-10" />
                <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-transparent to-transparent z-10" />
                <div className="g-ticker flex whitespace-nowrap select-none" aria-label="Noticias de IA">
                  {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
                    <span
                      key={i}
                      className="shrink-0 text-[11.5px] text-stone-500 dark:text-stone-400 group-hover/ticker:text-stone-700 dark:group-hover/ticker:text-stone-300 px-5 border-r border-stone-200/50 dark:border-stone-700/40 last:border-r-0 transition-colors"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
              <svg className="shrink-0 w-3 h-3 text-stone-300 dark:text-stone-600 group-hover/ticker:text-[#2FAF8F] transition-colors mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>

            {/* Right: notifications */}
            <div className="ml-auto shrink-0 relative">
              <button
                id="tour-target-notificaciones"
                onClick={() => setNotificacionesOpen(p => !p)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-stone-400 hover:text-[#2FAF8F] hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors group relative"
                aria-label="Notificaciones"
                aria-expanded={notificacionesOpen}
              >
                <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[15px] h-[15px] bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1 leading-none shadow-sm">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>
              <NotificacionesPanel
                isOpen={notificacionesOpen}
                onClose={() => setNotificacionesOpen(false)}
              />
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </>
  )
}

// ─── NavGroup ─────────────────────────────────────────────────────────────────
function NavGroup({
  label,
  items,
  collapsed,
  isActive,
  onNav,
}: {
  label: string
  items: { label: string; path: string; icon: string }[]
  collapsed: boolean
  isActive: (p: string) => boolean
  onNav: (p: string) => void
}) {
  return (
    <div className="mb-0.5">
      {collapsed ? (
        <div className="mt-3 mb-1 mx-3 border-t border-stone-100 dark:border-stone-800/70 first:hidden" />
      ) : (
        <p className="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-stone-400 dark:text-stone-500 select-none">
          {label}
        </p>
      )}
      {items.map((item) => (
        <NavItem
          key={item.label}
          icon={item.icon}
          label={item.label}
          active={isActive(item.path)}
          collapsed={collapsed}
          onClick={() => onNav(item.path)}
          tourId={
            item.label === 'Chat'          ? 'tour-target-chat'           :
            item.label === 'Trámites'      ? 'tour-target-tramites'       :
            undefined
          }
        />
      ))}
    </div>
  )
}

// ─── NavItem ──────────────────────────────────────────────────────────────────
function NavItem({
  icon,
  label,
  active,
  collapsed,
  onClick,
  tourId,
}: {
  icon: string
  label: string
  active: boolean
  collapsed: boolean
  onClick: () => void
  tourId?: string
}) {
  return (
    <div className="group/tip relative">
      <button
        id={tourId}
        onClick={onClick}
        aria-current={active ? 'page' : undefined}
        aria-label={label}
        className={[
          'relative w-full flex items-center gap-2.5 px-3 py-2 rounded-xl mb-0.5',
          'text-[13px] font-medium transition-all duration-100 active:scale-[0.97]',
          collapsed ? 'lg:justify-center lg:px-2' : '',
          active
            ? 'bg-[#2FAF8F]/[0.09] dark:bg-[#2FAF8F]/[0.11] text-stone-900 dark:text-stone-50'
            : 'text-stone-500 dark:text-stone-400 hover:bg-stone-100/80 dark:hover:bg-stone-800/50 hover:text-stone-800 dark:hover:text-stone-100',
        ].join(' ')}
      >
        {active && (
          <span className="absolute left-0.5 top-1/2 -translate-y-1/2 w-[2.5px] h-[18px] rounded-full bg-[#2FAF8F]" />
        )}
        <span className={active ? 'text-[#2FAF8F]' : ''}>
          {getIcon(icon, active)}
        </span>
        <span className={`leading-none transition-all duration-[200ms] ${collapsed ? 'lg:hidden' : ''}`}>
          {label}
        </span>
      </button>

      {/* Tooltip — collapsed desktop only */}
      {collapsed && (
        <div
          className="pointer-events-none hidden lg:block absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50 opacity-0 group-hover/tip:opacity-100 transition-opacity duration-150 delay-[320ms]"
          role="tooltip"
        >
          <div className="relative bg-stone-900 dark:bg-stone-700 text-white text-[12px] font-medium px-2.5 py-[6px] rounded-lg shadow-xl whitespace-nowrap">
            {label}
            <span className="absolute right-full top-1/2 -translate-y-1/2 border-[5px] border-transparent border-r-stone-900 dark:border-r-stone-700" />
          </div>
        </div>
      )}
    </div>
  )
}

// ─── LANGUAGE SUBMENU ─────────────────────────────────────────────────────────
const LANGUAGES = [
  { code: 'es', label: 'Español', flag: '🇲🇽', native: 'Español' },
  { code: 'en', label: 'Inglés',  flag: '🇺🇸', native: 'English' },
]

function LangMenuItem({
  onSelect,
  currentLang,
}: {
  onSelect: (code: string) => void
  currentLang: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const fn = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(p => !p)}
        className={`w-full flex items-center gap-2.5 px-3 py-[9px] rounded-xl text-[13px] font-medium transition-colors duration-100 active:scale-[0.98] ${
          open
            ? 'bg-stone-100 dark:bg-stone-800/50 text-stone-800 dark:text-stone-100'
            : 'text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800/50'
        }`}
      >
        <span className={`shrink-0 ${open ? 'text-[#2FAF8F]' : 'text-stone-400 dark:text-stone-500'}`}>
          <IcoGlobe />
        </span>
        <span className="flex-1 text-left">Idioma</span>
        <span className="flex items-center gap-1.5">
          <span className="text-[12px] text-stone-400 dark:text-stone-500 font-normal">
            {LANGUAGES.find(l => l.code === currentLang)?.native}
          </span>
          <svg
            className={`w-3 h-3 transition-transform duration-200 ${open ? 'rotate-180 text-[#2FAF8F]' : 'text-stone-300 dark:text-stone-600'}`}
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          >
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </span>
      </button>

      {open && (
        <div className="g-lang-panel ml-[18px] pl-3 border-l border-stone-200 dark:border-stone-700/60 pb-1">
          {LANGUAGES.map((lang) => {
            const isSelected = currentLang === lang.code
            return (
              <button
                key={lang.code}
                onClick={() => { onSelect(lang.code); setOpen(false) }}
                className={`w-full flex items-center gap-3 px-2 py-2 rounded-xl text-[13px] font-medium transition-colors duration-100 active:scale-[0.98] ${
                  isSelected
                    ? 'text-[#2FAF8F]'
                    : 'text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800/50 hover:text-stone-800 dark:hover:text-stone-100'
                }`}
              >
                <span className="text-[16px] leading-none">{lang.flag}</span>
                <span>{lang.native}</span>
                {isSelected && (
                  <svg className="ml-auto w-3.5 h-3.5 text-[#2FAF8F] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── UserMenuContent ──────────────────────────────────────────────────────────
function UserMenuContent({
  displayName,
  email,
  avatarLetter,
  onNav,
  onLogout,
}: {
  displayName:  string
  email:        string
  avatarLetter: string
  onNav:    (p: string) => void
  onLogout: () => void
}) {
  const [currentLang, setCurrentLang] = useState('es')

  return (
    <>
      <div className="px-4 pt-[14px] pb-3 border-b border-stone-100 dark:border-stone-800">
        <div className="flex items-center gap-3">
          <Avatar letter={avatarLetter} size={36} />
          <div className="min-w-0">
            <p className="text-[13px] font-semibold tracking-[-0.01em] text-stone-800 dark:text-stone-100 truncate">
              {displayName || <span className="opacity-40 font-normal">Cargando...</span>}
            </p>
            <p className="text-[11px] text-stone-400 dark:text-stone-500 truncate leading-none mt-0.5">
              {email || <span className="opacity-40">—</span>}
            </p>
          </div>
        </div>
      </div>

      <div className="py-1.5 px-1.5">
        <UMenuItem icon={<IcoStar />}     label="Mejorar plan"    onClick={() => onNav('/plan')} />
        <UMenuItem icon={<IcoSettings />} label="Configuraciones" onClick={() => onNav('/configuraciones')} />
        <LangMenuItem
          currentLang={currentLang}
          onSelect={(code) => setCurrentLang(code)}
        />
        <UMenuItem icon={<IcoHelp />}     label="Ayuda"           onClick={() => onNav('/ayuda')} />
        <div className="my-1.5 mx-1 border-t border-stone-100 dark:border-stone-800" />
        <UMenuItem icon={<IcoLogout />} label="Cerrar sesión" onClick={onLogout} danger />
      </div>
    </>
  )
}

// ─── UMenuItem ────────────────────────────────────────────────────────────────
function UMenuItem({
  icon, label, onClick, danger = false,
}: {
  icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={[
        'w-full flex items-center gap-2.5 px-3 py-[9px] rounded-xl text-[13px] font-medium',
        'transition-colors duration-100 active:scale-[0.98]',
        danger
          ? 'text-rose-500 hover:bg-stone-100 dark:hover:bg-stone-800/50'
          : 'text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800/50',
      ].join(' ')}
    >
      <span className={`shrink-0 ${danger ? 'text-rose-500' : 'text-stone-400 dark:text-stone-500'}`}>
        {icon}
      </span>
      {label}
    </button>
  )
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ letter, size = 32 }: { letter: string; size?: number }) {
  return (
    <div
      className="rounded-full bg-gradient-to-br from-[#2FAF8F] to-[#1a9070] flex items-center justify-center text-white font-bold shrink-0 shadow-sm"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}
    >
      {letter}
    </div>
  )
}

// ─── Icon system ──────────────────────────────────────────────────────────────
function getIcon(name: string, active = false) {
  const cls = `w-[17px] h-[17px] shrink-0 transition-colors ${active ? 'text-[#2FAF8F]' : ''}`
  const s = { className: cls, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '1.75' } as const
  const map: Record<string, React.ReactNode> = {
    chat:          <svg {...s}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
    file:          <svg {...s}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
    copy:          <svg {...s}><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
    eye:           <svg {...s}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
    'check-circle':<svg {...s}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
    tramites:      <svg {...s}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="15" x2="15" y2="15"/><line x1="9" y1="11" x2="15" y2="11"/></svg>,
    verified:      <svg {...s}><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
    clock:         <svg {...s}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  }
  return map[name] ?? null
}

// ─── Inline icons (user menu) ─────────────────────────────────────────────────
const ico = { className: 'w-4 h-4', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '1.75', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
const IcoStar     = () => <svg {...ico}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
const IcoSettings = () => <svg {...ico}><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
const IcoGlobe    = () => <svg {...ico}><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
const IcoHelp     = () => <svg {...ico}><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><circle cx="12" cy="17" r="0.5" fill="currentColor"/></svg>
const IcoLogout   = ({ className = 'w-4 h-4' }: { className?: string }) =>
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>

export default AppLayout