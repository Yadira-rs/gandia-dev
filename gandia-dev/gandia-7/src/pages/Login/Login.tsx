import { useState, useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { getCurrentProfile } from '../../lib/authService'

// ===== THEME =====
const useTheme = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('gandia-theme')
    if (saved === 'light' || saved === 'dark') return saved
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })
  useEffect(() => {
    localStorage.setItem('gandia-theme', theme)
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const h = (e: MediaQueryListEvent) => { if (!localStorage.getItem('gandia-theme')) setTheme(e.matches ? 'dark' : 'light') }
    mq.addEventListener('change', h); return () => mq.removeEventListener('change', h)
  }, [])
}

// ===== TYPEWRITER =====
const TypewriterText = ({ text, speed = 50, delay = 0, onComplete }: { text: string; speed?: number; delay?: number; onComplete?: () => void }) => {
  const [displayed, setDisplayed] = useState('')
  const [showCursor, setShowCursor] = useState(true)
  const [started, setStarted] = useState(false)
  useEffect(() => {
    if (started) return
    const t = setTimeout(() => {
      setStarted(true)
      let i = 0
      const iv = setInterval(() => {
        if (i < text.length) { setDisplayed(text.slice(0, i + 1)); i++ }
        else { clearInterval(iv); setShowCursor(false); onComplete?.() }
      }, speed)
      return () => clearInterval(iv)
    }, delay)
    return () => clearTimeout(t)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  return <span className="inline-block">{displayed}{showCursor && <span className="inline-block w-0.5 h-5 bg-[#2FAF8F] ml-0.5 animate-pulse" />}</span>
}


// ===== COMING SOON BUTTON =====
const ComingSoonButton = ({ children, className = '' }: { children: ReactNode; className?: string }) => {
  const [hovered, setHovered] = useState(false)
  return (
    <div className="relative w-full" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <div
        className={`w-full h-12 flex items-center justify-center gap-3 rounded-xl text-[15px] font-medium cursor-not-allowed select-none transition-all duration-200 ${className} ${hovered ? 'opacity-60' : 'opacity-40'}`}
      >
        {children}
      </div>
      {/* Tooltip */}
      <div className={`absolute -top-10 left-1/2 -translate-x-1/2 z-50 pointer-events-none transition-all duration-150 ${hovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'}`}>
        <div className="relative bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-[11px] font-semibold tracking-[0.06em] uppercase px-3 py-1.5 rounded-lg whitespace-nowrap shadow-xl">
          Próximamente
          <div className="absolute -bottom-1.25 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-stone-900 dark:bg-white rotate-45 rounded-xs" />
        </div>
      </div>
    </div>
  )
}

// ===== CONFIRM MODAL =====
const ConfirmModal = ({ open, title, description, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', onConfirm, onCancel }: {
  open: boolean; title: string; description: string; confirmLabel?: string; cancelLabel?: string; onConfirm: () => void; onCancel: () => void
}) => {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (!open) return; if (e.key === 'Escape') onCancel(); if (e.key === 'Enter') onConfirm() }
    document.addEventListener('keydown', h); return () => document.removeEventListener('keydown', h)
  }, [open, onConfirm, onCancel])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-md" onClick={onCancel} />
      <div className="relative w-full max-w-sm animate-[modalIn_0.25s_cubic-bezier(.16,1,.3,1)]">
        <div className="h-[2px] bg-gradient-to-r from-transparent via-[#2FAF8F]/60 to-transparent rounded-t-3xl" />
        <div className="bg-[#0f0f0e] border border-white/8 rounded-b-3xl rounded-t-none px-6 pt-6 pb-5">
          <div className="mb-5">
            <h3 className="text-[15px] font-semibold text-stone-50 tracking-tight">{title}</h3>
            <p className="text-[13px] text-stone-500 mt-1.5 leading-relaxed">{description}</p>
          </div>
          <div className="flex gap-2.5">
            <button onClick={onCancel} className="flex-1 h-10 rounded-xl bg-white/5 hover:bg-white/10 text-[13px] font-medium text-stone-400 hover:text-stone-200 transition-all">{cancelLabel}</button>
            <button onClick={onConfirm} className="flex-1 h-10 rounded-xl bg-[#2FAF8F] hover:bg-[#27a07f] text-[13px] font-semibold text-white shadow-sm active:scale-[0.98] transition-all">{confirmLabel}</button>
          </div>
        </div>
      </div>
    </div>
  )
}


const routeAfterLogin = async (navigate: ReturnType<typeof useNavigate>) => {
  try {
    const profile = await getCurrentProfile()
    if (!profile) {
      navigate('/signup/personal', { replace: true })
      return
    }
    const status = profile.status as string
    if (status === 'approved') {
      navigate('/chat', { replace: true })
    } else {
      const accountId = profile?.account_id || ''
      localStorage.setItem('signup-completed', 'true')
      localStorage.setItem('user-status', status)
      if (accountId) localStorage.setItem('account-id', accountId)
      navigate('/signup', { replace: true })
    }
  } catch {
    navigate('/chat', { replace: true })
  }
}

// ===== MAIN =====
const Login = () => {
  const navigate = useNavigate()
  useTheme()

  const [showSubtitle, setShowSubtitle] = useState(false)
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null)
  const [showLoginChat, setShowLoginChat] = useState(false)

  const [messages, setMessages] = useState<Array<{ type: 'user' | 'bot'; content: string }>>([])
  const [userInput, setUserInput] = useState('')
  const [passwordInput, setPasswordInput] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [step, setStep] = useState<'email' | 'password'>('email')
  const [pendingEmail, setPendingEmail] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [modal, setModal] = useState<{ open: boolean; title: string; description: string; confirmLabel: string; onConfirm: () => void }>
    ({ open: false, title: '', description: '', confirmLabel: 'Confirmar', onConfirm: () => {} })
  const showConfirm = (title: string, description: string, confirmLabel: string, onConfirm: () => void) =>
    setModal({ open: true, title, description, confirmLabel, onConfirm })
  const closeModal = () => setModal(m => ({ ...m, open: false }))
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const passwordInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) routeAfterLogin(navigate)
    })
  }, [navigate])

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, isTyping])

  useEffect(() => {
    if (!showLoginChat) return
    if (messages.length === 0) {
      setMessages([{ type: 'bot', content: 'Hola 👋 Bienvenido de nuevo a GANDIA. Ingresa tu email para continuar.' }])
    }
    setTimeout(() => inputRef.current?.focus(), 400)
  }, [showLoginChat]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!showLoginChat) return
    setTimeout(() => {
      if (step === 'password') passwordInputRef.current?.focus()
      else inputRef.current?.focus()
    }, 100)
  }, [step, showLoginChat])

  const addMsg = (type: 'bot' | 'user', content: string) =>
    setMessages(p => [...p, { type, content }])

  const handleOAuth = async (provider: 'google' | 'apple' | 'azure') => {
    if (loadingProvider) return
    setLoadingProvider(provider)
    try {
      const supabaseProvider = provider === 'azure' ? 'azure' : provider
      const { error } = await supabase.auth.signInWithOAuth({
        provider: supabaseProvider as 'google' | 'apple' | 'azure',
        options: {
          redirectTo: `${window.location.origin}/login`,
          queryParams: provider === 'google' ? { access_type: 'offline', prompt: 'consent' } : undefined,
        },
      })
      if (error) throw error
    } catch (err) {
      console.error(err)
      setLoadingProvider(null)
    }
  }

  const handleSend = async () => {
    if (isProcessing) return

    if (step === 'email') {
      const value = userInput.trim()
      if (!value) return
      addMsg('user', value)
      setUserInput('')
      setIsProcessing(true); setIsTyping(true)
      setTimeout(() => {
        setIsTyping(false)
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          addMsg('bot', 'Ese email no parece válido. Intenta de nuevo.')
          setIsProcessing(false); return
        }
        setPendingEmail(value)
        setStep('password')
        addMsg('bot', `Ingresa tu contraseña para continuar.`)
        setIsProcessing(false)
      }, 700)
      return
    }

    if (step === 'password') {
      const value = passwordInput.trim()
      if (!value) return
      addMsg('user', '••••••••')
      setPasswordInput('')
      setIsProcessing(true); setIsTyping(true)
      setTimeout(async () => {
        setIsTyping(false)
        try {
          const { error } = await supabase.auth.signInWithPassword({
            email: pendingEmail,
            password: value,
          })
          if (error) {
            addMsg('bot', error.message.includes('Invalid login credentials')
              ? 'Email o contraseña incorrectos. Verifica tus datos o regístrate si aún no tienes cuenta.'
              : error.message)
            setIsProcessing(false); return
          }
          addMsg('bot', 'Contraseña verificada ✓\n\nValidando tu cuenta...')
          await routeAfterLogin(navigate)
        } catch (err: unknown) {
          addMsg('bot', `Error: ${err instanceof Error ? err.message : 'Inténtalo de nuevo.'}`)
          setIsProcessing(false)
        }
      }, 700)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (userInput.trim()) handleSend() }
  }
  const handlePasswordKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); if (passwordInput.trim()) handleSend() }
  }

  const handleBack = () => {
    if (showLoginChat) {
      showConfirm('¿Regresar?', 'Se perderá el progreso del inicio de sesión.', 'Sí, regresar', () => {
        closeModal(); setShowLoginChat(false); setMessages([]); setStep('email')
        setUserInput(''); setPasswordInput(''); setPendingEmail(''); setIsProcessing(false)
      })
    } else {
      navigate('/home')
    }
  }

  // ── CHAT VIEW ──
  if (showLoginChat) return (
    <div className="min-h-screen bg-[#fafaf9] dark:bg-[#0c0a09] text-stone-900 dark:text-stone-50 flex flex-col overflow-hidden font-sans">
      <ConfirmModal open={modal.open} title={modal.title} description={modal.description} confirmLabel={modal.confirmLabel} cancelLabel="Cancelar" onConfirm={modal.onConfirm} onCancel={closeModal} />

      {/* ── HEADER ── */}
      <div className="fixed top-0 left-0 right-0 z-50">
        {/* Barra de progreso top */}
        <div className="h-[2px] bg-stone-100 dark:bg-stone-900">
          <div
            className="h-full bg-[#2FAF8F] transition-all duration-700 ease-out"
            style={{ width: step === 'email' ? '50%' : '100%' }}
          />
        </div>
        <div className="bg-[#fafaf9]/96 dark:bg-[#0c0a09]/96 backdrop-blur-md border-b border-stone-200/40 dark:border-stone-800/40">
          <div className="flex items-center justify-between px-5 h-[54px]">
            {/* Back */}
            <button onClick={handleBack} className="flex items-center gap-1.5 text-stone-400 dark:text-stone-600 hover:text-stone-700 dark:hover:text-stone-300 transition-colors group">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              <span className="text-[12px] font-medium">Volver</span>
            </button>

            {/* Centro: logo + GANDIA */}
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
              <svg className="w-5 h-5 text-[#2FAF8F]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
              </svg>
              <span className="text-[13px] font-semibold text-stone-900 dark:text-stone-50 tracking-tight">GANDIA</span>
              <div className="w-px h-3 bg-stone-200 dark:bg-stone-800" />
              <span className="text-[11.5px] text-stone-400 dark:text-stone-600 font-medium">Iniciar Sesión</span>
            </div>

            {/* Derecha: step */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold tracking-[0.1em] uppercase text-stone-400 dark:text-stone-600">
                {step === 'email' ? '01' : '02'} / 02
              </span>
              <div className="w-px h-3 bg-stone-200 dark:bg-stone-800" />
              <span className="text-[12px] font-medium text-stone-600 dark:text-stone-400">
                {step === 'email' ? 'Correo' : 'Contraseña'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── MENSAJES ── */}
      <div className="flex-1 overflow-y-auto pt-[52px] pb-44 px-4" style={{ scrollBehavior: 'smooth' }}>
        <div className="max-w-2xl mx-auto flex flex-col gap-6 py-8">

          {/* Empty state */}
          {!messages.some(m => m.type === 'user') && (
            <div className="flex flex-col items-center justify-center min-h-[55vh] gap-6 animate-[fadeIn_0.4s_ease_both]">
              <div className="text-center">
                <h1 className="text-[2.1rem] font-serif italic text-stone-900 dark:text-stone-50 leading-[1.2] tracking-[-0.01em] mb-3">
                  Bienvenido<br />de nuevo.
                </h1>
                <p className="text-sm text-stone-400 dark:text-stone-600">Ingresa tu email para continuar.</p>
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'} animate-[fadeIn_0.22s_ease_both]`}>
              {msg.type === 'user' ? (
                <div className="max-w-[75%] bg-white dark:bg-[#1c1917] border border-stone-200/70 dark:border-stone-800/60 rounded-2xl rounded-br-sm px-4 py-3 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
                  <p className="text-[14px] text-stone-800 dark:text-stone-100 leading-[1.7]">{msg.content}</p>
                </div>
              ) : (
                <p className="max-w-[85%] text-[14.5px] text-stone-600 dark:text-stone-300 leading-[1.8]">{msg.content}</p>
              )}
            </div>
          ))}
          {isTyping && (
            <div className="flex gap-1.5 items-center pl-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-stone-300 dark:bg-stone-700 animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1.5 h-1.5 rounded-full bg-stone-300 dark:bg-stone-700 animate-bounce" style={{ animationDelay: '120ms' }} />
              <div className="w-1.5 h-1.5 rounded-full bg-stone-300 dark:bg-stone-700 animate-bounce" style={{ animationDelay: '240ms' }} />
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* ── INPUT ── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 pt-4 bg-gradient-to-t from-[#fafaf9] dark:from-[#0c0a09] from-80% to-transparent">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white dark:bg-[#141210] border border-stone-200/80 dark:border-stone-800/70 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_20px_rgba(0,0,0,0.25)]">
            {step === 'password' ? (
              <>
                <input
                  ref={passwordInputRef}
                  type={showPassword ? 'text' : 'password'}
                  value={passwordInput}
                  onChange={e => setPasswordInput(e.target.value)}
                  onKeyDown={handlePasswordKeyDown}
                  disabled={isProcessing}
                  placeholder="Tu contraseña..."
                  style={{ WebkitAppearance: 'none', outline: 'none', boxShadow: 'none' }}
                  className="w-full px-4 pt-3.5 pb-2 bg-transparent text-[14px] text-stone-800 dark:text-stone-100 placeholder-stone-300 dark:placeholder-stone-600 h-[50px] disabled:cursor-not-allowed [&::-ms-reveal]:hidden"
                />
                <div className="flex items-center justify-between px-3 pb-3 pt-0 gap-2">
                  <button type="button" tabIndex={-1} onClick={() => setShowPassword(p => !p)}
                    className="w-7 h-7 flex items-center justify-center rounded-full text-stone-300 dark:text-stone-600 hover:text-stone-500 dark:hover:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800/60 transition-all">
                    {showPassword
                      ? <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                      : <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}
                  </button>
                  <button onClick={handleSend} disabled={!passwordInput.trim() || isProcessing}
                    className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all active:scale-95 ${passwordInput.trim() && !isProcessing ? 'bg-[#2FAF8F] hover:bg-[#27a07f] text-white shadow-sm' : 'bg-stone-100 dark:bg-stone-800/60 text-stone-300 dark:text-stone-600 cursor-not-allowed'}`}>
                    {isProcessing
                      ? <div className="w-3.5 h-3.5 border-[1.5px] border-current border-t-transparent rounded-full animate-spin" />
                      : <svg className="w-[17px] h-[17px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>}
                  </button>
                </div>
              </>
            ) : (
              <>
                <textarea
                  ref={inputRef}
                  value={userInput}
                  onChange={e => { setUserInput(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px' }}
                  onKeyDown={handleKeyDown}
                  disabled={isProcessing}
                  placeholder="tu@email.com"
                  rows={1}
                  style={{ maxHeight: '160px', minHeight: '46px', outline: 'none', boxShadow: 'none' }}
                  className="w-full px-4 pt-3.5 pb-2 bg-transparent text-[14px] text-stone-800 dark:text-stone-100 placeholder-stone-300 dark:placeholder-stone-600 resize-none leading-relaxed disabled:cursor-not-allowed"
                />
                <div className="flex items-center justify-end px-3 pb-3 pt-0">
                  <button onClick={handleSend} disabled={!userInput.trim() || isProcessing}
                    className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all active:scale-95 ${userInput.trim() && !isProcessing ? 'bg-[#2FAF8F] hover:bg-[#27a07f] text-white shadow-sm' : 'bg-stone-100 dark:bg-stone-800/60 text-stone-300 dark:text-stone-600 cursor-not-allowed'}`}>
                    {isProcessing
                      ? <div className="w-3.5 h-3.5 border-[1.5px] border-current border-t-transparent rounded-full animate-spin" />
                      : <svg className="w-[17px] h-[17px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>}
                  </button>
                </div>
              </>
            )}
          </div>
          <p className="text-center text-[10.5px] text-stone-300 dark:text-stone-700 mt-2">GANDIA · Acceso seguro</p>
        </div>
      </div>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}@keyframes modalIn{from{opacity:0;transform:scale(0.95) translateY(8px)}to{opacity:1;transform:scale(1) translateY(0)}}`}</style>
    </div>
  )

  // ── AUTH VIEW ──
  return (
    <div className="min-h-screen bg-stone-50 dark:bg-[#0c0a09] text-stone-900 dark:text-stone-50 flex items-center justify-center overflow-hidden font-sans selection:bg-[#2FAF8F]/30">
      {/* Back button */}
      <button onClick={handleBack} className="fixed top-6 left-6 z-50 w-10 h-10 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-800 rounded-lg flex items-center justify-center hover:bg-stone-100 dark:hover:bg-stone-800 transition-all hover:-translate-x-0.5 group">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5 text-stone-600 dark:text-stone-400 group-hover:text-stone-900 dark:group-hover:text-stone-50 transition-colors"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
      </button>

      <div className="flex w-full max-w-350 h-screen">

        {/* ── Panel izquierdo ── */}
        <div className="hidden lg:flex lg:w-[45%] lg:min-w-125 bg-stone-950 dark:bg-[#080706] border-r border-stone-800 p-12 flex-col relative overflow-hidden opacity-0 animate-[fadeInLeft_0.8s_ease-out_0.2s_forwards]">

          {/* Ruido de textura sutil (overlay) */}
          <div className="absolute inset-0 opacity-[0.025] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 512 512\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")', backgroundSize: '200px' }} />

          {/* Orbe de luz GANDIA verde — fondo */}
          <div className="absolute -top-32 -left-32 w-120 h-120 rounded-full bg-[#2FAF8F]/10 blur-[120px] pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-75 h-75 rounded-full bg-[#2FAF8F]/5 blur-[100px] pointer-events-none" />

          {/* Línea lateral derecha */}
          <div className="absolute top-0 right-0 w-px h-full bg-linear-to-b from-transparent via-[#2FAF8F]/30 to-transparent" />

          {/* ── SECCIÓN TOP: eyebrow + quote ── */}
          <div className="relative z-10 pt-16">
            {/* Eyebrow */}
            <div className="flex items-center gap-2.5 mb-7">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2FAF8F] shrink-0" />
              <span className="w-5 h-px bg-[#2FAF8F]/50 shrink-0" />
              <span className="text-[11px] font-semibold tracking-[0.18em] text-stone-500 uppercase">Infraestructura Digital Oficial</span>
            </div>

            {/* Quote editorial */}
            <blockquote className="max-w-100">
              {/* Comilla decorativa grande */}
              <div className="text-[5rem] font-serif text-[#2FAF8F]/20 leading-none -mb-6 select-none">"</div>
              <p className="text-[1.55rem] font-serif text-stone-100 leading-[1.4] mb-5 tracking-[-0.01em]">
                El origen de un animal es su mayor valor. GANDIA lo certifica, lo protege y lo hace valer en cualquier mercado del mundo.
              </p>
              <footer className="flex items-center gap-3 text-sm text-stone-500 font-medium">
                <span className="w-6 h-px bg-[#2FAF8F]/50" />
                Visión GANDIA 2026
              </footer>
            </blockquote>
          </div>

          {/* ── SECCIÓN BOTTOM: tip + footer ── */}
          <div className="relative z-10 mt-12">
            {/* Tip de eficiencia */}
            <div className="relative group mb-6">
              <div className="absolute -inset-px rounded-xl bg-linear-to-br from-[#2FAF8F]/0 to-[#2FAF8F]/0 group-hover:from-[#2FAF8F]/20 group-hover:to-[#2FAF8F]/5 transition-all duration-400 blur-sm" />
              <div className="relative bg-white/4 group-hover:bg-white/8 border border-white/8 group-hover:border-[#2FAF8F]/35 rounded-xl p-5 transition-all duration-300 group-hover:shadow-[0_0_24px_rgba(47,175,143,0.08)]">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[#2FAF8F]/10 group-hover:bg-[#2FAF8F]/20 flex items-center justify-center shrink-0 text-[#2FAF8F] transition-all duration-300 group-hover:scale-105">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-stone-200 group-hover:text-white mb-1.5 tracking-tight transition-colors duration-300">Tip de Eficiencia</p>
                    <p className="text-[12.5px] text-stone-500 group-hover:text-stone-400 leading-relaxed transition-colors duration-300">
                      ¿Sin señal en el corral? Registra pesajes y biometría en{' '}
                      <span className="text-stone-300 group-hover:text-stone-200 font-medium transition-colors duration-300">modo offline</span>.
                      {' '}GANDIA sincronizará automáticamente al detectar conexión.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-auto pt-10 flex flex-col gap-4">
              {/* Línea decorativa */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-linear-to-r from-transparent via-white/10 to-transparent" />
                <span className="w-1 h-1 rounded-full bg-[#2FAF8F]/40 shrink-0" />
                <div className="flex-1 h-px bg-linear-to-r from-transparent via-white/10 to-transparent" />
              </div>
              <div className="flex items-center gap-4 flex-wrap text-[11.5px] text-stone-600">
              <div className="flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 text-stone-600 shrink-0">
                  <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-2.079 3.698-5.142 3.698-9.077a8.5 8.5 0 10-17 0c0 3.935 1.754 6.998 3.699 9.077a19.583 19.583 0 002.682 2.282 16.975 16.975 0 001.144.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                </svg>
                <span>Durango, México</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-stone-700" />
              <span>Validación UGRD</span>
              <div className="w-1 h-1 rounded-full bg-stone-700" />
              <span className="text-[#2FAF8F]">Sistema Seguro v7.0</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Panel derecho ── */}
        <div className="flex-1 flex items-center justify-center p-6 sm:p-10 md:p-16">
          <div className="w-full max-w-130">

            {/* Cabecera */}
            <div className="text-center mb-10">

              {/* Logo — solo icono */}
              <div className="inline-flex mb-7 opacity-0 animate-[fadeInUp_0.5s_ease-out_0.1s_forwards]">
                <svg className="w-9 h-9 text-[#2FAF8F]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
              </div>

              {/* Eyebrow premium — solo texto */}
              <div className="flex items-center justify-center mb-3">
                <span className="text-[11px] font-semibold tracking-[0.14em] uppercase text-stone-500 dark:text-stone-500">
                  {showSubtitle && <TypewriterText text="Sistema de trazabilidad de alta certeza" speed={30} delay={200} />}
                </span>
              </div>

              <h1 className="text-2xl font-semibold text-stone-900 dark:text-stone-50 tracking-tight">
                <TypewriterText text="Bienvenido de nuevo" speed={60} onComplete={() => setShowSubtitle(true)} />
              </h1>
            </div>

            {/* Card de acceso */}
            <div className="bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-800 rounded-2xl p-8 max-w-110 mx-auto relative opacity-0 animate-[generateCard_1.5s_ease-out_1.5s_forwards] overflow-hidden shadow-lg dark:shadow-none">
              <div className="absolute inset-0 bg-linear-to-r from-transparent via-[#2FAF8F]/10 to-transparent animate-[shimmer_2s_ease-out_2s] pointer-events-none rounded-2xl" style={{ backgroundSize: '200% 100%' }} />

              <div className="flex flex-col gap-3 mb-6">

                {/* Google — funcional */}
                <button
                  onClick={() => handleOAuth('google')}
                  disabled={loadingProvider !== null}
                  className={`w-full h-12 flex items-center justify-center gap-3 bg-white text-stone-900 border border-stone-300 rounded-xl text-[15px] font-medium transition-all hover:bg-stone-50 hover:border-stone-400 hover:translate-y-0.5 shadow-sm ${loadingProvider === 'google' ? 'opacity-60 pointer-events-none' : ''}`}
                >
                  {loadingProvider === 'google'
                    ? <div className="w-4 h-4 border-2 border-stone-900 border-t-transparent rounded-full animate-spin" />
                    : <>
                        <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        Continuar con Google
                      </>
                  }
                </button>

                {/* Apple — próximamente */}
                <ComingSoonButton className="bg-black text-white border border-stone-800">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 shrink-0">
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                  </svg>
                  Continuar con Apple
                </ComingSoonButton>

                {/* Microsoft / Azure — próximamente */}
                <ComingSoonButton className="bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-50 border border-stone-300 dark:border-zinc-700">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0">
                    <path fill="#0078d4" d="M3 3h8v8H3z"/>
                    <path fill="#107c10" d="M13 3h8v8h-8z"/>
                    <path fill="#ffc119" d="M3 13h8v8H3z"/>
                    <path fill="#ff8c00" d="M13 13h8v8h-8z"/>
                  </svg>
                  Continuar con Microsoft
                </ComingSoonButton>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-4 my-6 text-stone-500 dark:text-stone-600 text-[13px] font-medium">
                <div className="flex-1 h-px bg-stone-200 dark:bg-stone-800" />
                <span>o</span>
                <div className="flex-1 h-px bg-stone-200 dark:bg-stone-800" />
              </div>

              {/* Email */}
              <button
                onClick={() => { setShowLoginChat(true); setMessages([]); setStep('email'); setUserInput(''); setPasswordInput('') }}
                className="w-full h-12 flex items-center justify-center gap-3 bg-transparent text-stone-900 dark:text-stone-50 border border-stone-300 dark:border-stone-700 rounded-xl text-[15px] font-medium transition-all hover:bg-stone-50 dark:hover:bg-stone-800 hover:border-stone-400 mb-6"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                Continuar con Email
              </button>

              {/* Sign up link */}
              <div className="text-center text-[13px] text-stone-500 dark:text-stone-600 mt-6 pt-6 border-t border-stone-200 dark:border-stone-800">
                ¿Aún no tienes cuenta?{' '}
                <button onClick={() => navigate('/signup')} className="text-[#2FAF8F] font-medium hover:text-[#26a079] transition-colors">
                  Solicita acceso Beta
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeInLeft{from{opacity:0;transform:translateX(-30px)}to{opacity:1;transform:translateX(0)}}
        @keyframes fadeInUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes generateCard{0%{opacity:0;clip-path:inset(100% 0 0 0)}100%{opacity:1;clip-path:inset(0 0 0 0)}}
        @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
      `}</style>
    </div>
  )
}

export default Login