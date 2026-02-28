import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Menu, X } from 'lucide-react'

interface HeaderProps {
  currentSection?: 'home' | 'precios' | 'recursos' | 'blog' | 'contacto'
  isDark?: boolean
}

export default function Header({ currentSection = 'home', isDark = false }: HeaderProps) {
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [footerVisible, setFooterVisible] = useState(false)

  useEffect(() => {
    const footer = document.querySelector('footer[role="contentinfo"]')
    if (!footer) return
    const obs = new IntersectionObserver(
      ([entry]) => setFooterVisible(entry.isIntersecting),
      { threshold: 0.08 }
    )
    obs.observe(footer)
    return () => obs.disconnect()
  }, [])

  type NavId = 'home' | 'precios' | 'recursos' | 'blog' | 'contacto'

  const navItems: { id: NavId; label: string; path: string }[] = [
    { id: 'home',     label: 'Inicio',   path: '/home' },
    { id: 'precios',  label: 'Precios',  path: '/modelo-operativo' },
    { id: 'recursos', label: 'Recursos', path: '/recursos' },
    { id: 'blog',     label: 'Blog',     path: '/blog' },
    { id: 'contacto', label: 'Contacto', path: '/contacto' },
  ]

  const isActive = (id: NavId) => currentSection === id

  /* ── Tokens ─────────────────────────────────────────────────────────────── */
  const bg = isDark
    ? 'bg-[#0c0a09]/80 border-[#ffffff08] shadow-[0_1px_0_0_rgba(255,255,255,0.04)]'
    : 'bg-white/80 border-[#00000008] shadow-[0_1px_0_0_rgba(0,0,0,0.04)]'

  const textBase  = isDark ? 'text-[#FAFAFA]' : 'text-[#171717]'
  const textMuted = isDark ? 'text-[#777]'    : 'text-[#808080]'
  const mobilePane = isDark
    ? 'bg-[#0c0a09]/96 border-[#ffffff08]'
    : 'bg-white/96 border-[#00000008]'

  return (
    <nav
      className={`
        sticky top-0 z-50 border-b
        backdrop-blur-2xl
        transition-all duration-500 ease-[cubic-bezier(.4,0,.2,1)]
        ${bg} ${textBase}
      `}
      style={{
        opacity: footerVisible ? 0 : 1,
        pointerEvents: footerVisible ? 'none' : 'auto',
        transform: footerVisible ? 'translateY(-6px)' : 'translateY(0)',
      }}
    >
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between h-[60px]">

          {/* ── Logo ─────────────────────────────────────────────────────── */}
          <button
            onClick={() => navigate('/home')}
            className="flex items-center gap-2.5 hover:opacity-60 transition-opacity duration-200"
            aria-label="GANDIA 7 — Inicio"
          >
            <svg
              className="w-[20px] h-[20px] text-[#2FAF8F] shrink-0"
              viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
            <span className="text-[14px] font-semibold tracking-tight">GANDIA 7</span>
          </button>

          {/* ── Desktop Nav ──────────────────────────────────────────────── */}
          <ul className="hidden md:flex items-center" role="list">
            {navItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => navigate(item.path)}
                  className={`
                    relative flex flex-col items-center gap-0 px-3.5 py-2
                    text-[13px] font-medium tracking-[0.01em]
                    transition-colors duration-200
                    ${isActive(item.id)
                      ? 'text-[#2FAF8F]'
                      : `${textMuted} hover:text-[${isDark ? '#FAFAFA' : '#171717'}]`
                    }
                  `}
                >
                  {item.label}
                  <span
                    className={`
                      absolute bottom-0 left-1/2 -translate-x-1/2
                      w-[3px] h-[3px] rounded-full bg-[#2FAF8F]
                      transition-all duration-300
                      ${isActive(item.id) ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}
                    `}
                  />
                </button>
              </li>
            ))}
          </ul>

          {/* ── Desktop Actions ──────────────────────────────────────────── */}
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={() => navigate('/signup')}
              className={`
                px-4 py-[7px] rounded-lg
                text-[13px] font-medium border
                transition-all duration-200
                ${isDark
                  ? 'border-[#ffffff22] text-[#aaa] hover:border-[#ffffff44]'
                  : 'border-[#00000018] text-[#666] hover:border-[#00000030]'
                }
              `}
            >
              Solicitar Acceso
            </button>

            <button
              onClick={() => navigate('/login')}
              className={`
                px-5 py-[7px] rounded-lg
                text-[13px] font-medium
                transition-all duration-200
                active:scale-[0.97]
                ${isDark
                  ? 'bg-[#F5F5F5] text-[#0c0a09] hover:bg-white shadow-[0_0_0_1px_rgba(255,255,255,0.1)] hover:shadow-[0_0_0_1px_rgba(255,255,255,0.1),0_2px_12px_rgba(0,0,0,0.25)]'
                  : 'bg-[#171717] text-white hover:bg-[#222] shadow-[0_1px_3px_rgba(0,0,0,0.12)] hover:shadow-[0_2px_12px_rgba(0,0,0,0.2)]'
                }
              `}
            >
              Iniciar Sesión
            </button>
          </div>

          {/* ── Mobile Hamburger ─────────────────────────────────────────── */}
          <button
            onClick={() => setMobileMenuOpen((v) => !v)}
            className={`
              md:hidden p-2 rounded-lg
              transition-colors duration-200
              ${isDark ? 'hover:bg-white/6' : 'hover:bg-black/5'}
            `}
            aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen
              ? <X    className="w-[18px] h-[18px]" />
              : <Menu className="w-[18px] h-[18px]" />
            }
          </button>
        </div>
      </div>

      {/* ── Mobile Menu — slide-down ────────────────────────────────────────── */}
      <div
        className={`
          md:hidden overflow-hidden border-t backdrop-blur-2xl
          transition-all duration-300 ease-[cubic-bezier(.4,0,.2,1)]
          ${mobilePane}
          ${mobileMenuOpen
            ? 'max-h-[480px] opacity-100'
            : 'max-h-0 opacity-0 border-transparent'
          }
        `}
      >
        <div className="px-4 pt-3 pb-4 flex flex-col gap-0.5">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { navigate(item.path); setMobileMenuOpen(false) }}
              className={`
                w-full text-left flex items-center justify-between
                px-4 py-2.5 rounded-lg
                text-[14px] font-medium
                transition-colors duration-150
                ${isActive(item.id)
                  ? 'text-[#2FAF8F]'
                  : `${textMuted} ${isDark ? 'hover:bg-white/5 hover:text-[#FAFAFA]' : 'hover:bg-black/4 hover:text-[#171717]'}`
                }
              `}
            >
              {item.label}
              {isActive(item.id) && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#2FAF8F]" />
              )}
            </button>
          ))}

          <div className={`my-2 h-px ${isDark ? 'bg-white/7' : 'bg-black/6'}`} />

          <button
            onClick={() => { navigate('/signup'); setMobileMenuOpen(false) }}
            className={`
              w-full text-center px-4 py-2.5 rounded-lg
              text-[14px] font-medium border
              transition-colors duration-150
              ${isDark
                ? 'border-[#ffffff12] text-[#aaa] hover:border-[#ffffff24] hover:text-white'
                : 'border-[#0000000f] text-[#666] hover:border-[#0000001c] hover:text-[#171717]'
              }
            `}
          >
            Solicitar Acceso
          </button>

          <button
            onClick={() => { navigate('/login'); setMobileMenuOpen(false) }}
            className={`
              w-full px-4 py-2.5 rounded-lg
              text-[14px] font-medium
              transition-all duration-150 active:scale-[0.98]
              ${isDark
                ? 'bg-[#F5F5F5] text-[#0c0a09] hover:bg-white'
                : 'bg-[#171717] text-white hover:bg-[#2a2a2a]'
              }
            `}
          >
            Iniciar Sesión
          </button>
        </div>
      </div>
    </nav>
  )
}