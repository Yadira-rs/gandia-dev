import { useState, useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import {
  signInWithOAuth, registerUser, getCurrentProfile,
} from '../../lib/authService'

// ─── COMING SOON BUTTON — igual que en Login ─────────────────────────────────
const ComingSoonButton = ({ children, className = '' }: { children: ReactNode; className?: string }) => {
  const [hovered, setHovered] = useState(false)
  return (
    <div className="relative w-full" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <div
        className={`w-full h-12 flex items-center justify-center gap-3 rounded-lg text-[15px] font-medium cursor-not-allowed select-none transition-all duration-200 ${className} ${hovered ? 'opacity-60' : 'opacity-40'}`}
      >
        {children}
      </div>
      <div className={`absolute -top-10 left-1/2 -translate-x-1/2 z-50 pointer-events-none transition-all duration-150 ${hovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'}`}>
        <div className="relative bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-[11px] font-semibold tracking-[0.06em] uppercase px-3 py-1.5 rounded-lg whitespace-nowrap shadow-xl">
          Próximamente
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-stone-900 dark:border-t-white" />
        </div>
      </div>
    </div>
  )
}

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
    mq.addEventListener('change', h)
    return () => mq.removeEventListener('change', h)
  }, [])
}

const TypewriterText = ({ text, speed = 70, delay = 0, onComplete }: { text: string; speed?: number; delay?: number; onComplete?: () => void }) => {
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

const CountdownDisplay = ({ days, hours, minutes, seconds }: { days: number; hours: number; minutes: number; seconds: number }) => {
  const units = [{ value: days, label: 'Días' }, { value: hours, label: 'Horas' }, { value: minutes, label: 'Minutos' }, { value: seconds, label: 'Segundos' }]
  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3">
      {units.map((unit, index) => (
        <div key={unit.label} className="flex items-center">
          <div className="relative group">
            <div className="bg-stone-200/80 dark:bg-stone-950/50 border border-stone-300 dark:border-stone-800/50 rounded-lg p-3 sm:p-4 backdrop-blur-sm min-w-17.5 sm:min-w-21.25 flex flex-col items-center shadow-lg">
              <div className="text-3xl sm:text-4xl font-bold text-[#2FAF8F] tracking-tight leading-none text-center mb-1 tabular-nums font-mono">{String(unit.value).padStart(2, '0')}</div>
              <div className="text-[10px] sm:text-xs font-medium text-stone-600 dark:text-stone-500 uppercase tracking-wider text-center">{unit.label}</div>
            </div>
            <div className="absolute -top-1 -right-1 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-[#2FAF8F]/20 rounded-full animate-pulse" />
          </div>
          {index < units.length - 1 && <div className="text-xl sm:text-2xl font-bold text-stone-500 dark:text-stone-700 mx-1 sm:mx-2 pb-2">:</div>}
        </div>
      ))}
    </div>
  )
}



const ConfirmModal = ({ open, title, description, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', onConfirm, onCancel }: {
  open: boolean; title: string; description: string; confirmLabel?: string; cancelLabel?: string; onConfirm: () => void; onCancel: () => void
}) => {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (!open) return; if (e.key === 'Escape') onCancel(); if (e.key === 'Enter') onConfirm() }
    document.addEventListener('keydown', h); return () => document.removeEventListener('keydown', h)
  }, [open, onConfirm, onCancel])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-200 flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-md" onClick={onCancel} />
      <div className="relative w-full max-w-sm animate-[modalIn_0.25s_cubic-bezier(.16,1,.3,1)]">
        {/* Línea verde top */}
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

const AlreadyRegisteredScreen = ({ status, accountId, rejectionReason, onGoHome, onGoLogin }: {
  status: 'pending' | 'approved' | 'rejected'; accountId: string; rejectionReason?: string; onGoHome: () => void; onGoLogin: () => void
}) => {
  const [visible, setVisible] = useState(false)
  const [step, setStep] = useState(0)
  useEffect(() => {
    setTimeout(() => setVisible(true), 50)
    if (status === 'pending') { setTimeout(() => setStep(1), 400); setTimeout(() => setStep(2), 800); setTimeout(() => setStep(3), 1200) }
  }, [status])

  if (status === 'approved') return (
    <div className={`fixed inset-0 z-300 flex items-center justify-center px-4 transition-opacity duration-500 ${visible ? 'opacity-100' : 'opacity-0'}`}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-125 h-125 bg-[#2FAF8F]/8 rounded-full blur-3xl pointer-events-none" />
      <div className={`relative z-10 w-full max-w-sm transition-all duration-700 ${visible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'}`}>
        <div className="bg-[#0f0f0f] border border-white/10 rounded-3xl px-7 pt-8 pb-7">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-[#2FAF8F]/15 border border-[#2FAF8F]/25 flex items-center justify-center mb-4 animate-[scaleIn_0.5s_cubic-bezier(0.34,1.56,0.64,1)_0.2s_both]">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#2FAF8F" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            </div>
            <div className="inline-flex items-center gap-2 bg-[#2FAF8F]/10 border border-[#2FAF8F]/20 rounded-full px-3 py-1 mb-3">
              <div className="w-1.5 h-1.5 rounded-full bg-[#2FAF8F] animate-pulse" /><span className="text-xs font-semibold text-[#2FAF8F]">Cuenta activa</span>
            </div>
            <h2 className="text-xl font-bold text-white mb-1">¡Tu cuenta está aprobada!</h2>
            <p className="text-stone-400 text-sm">Ya puedes acceder al sistema GANDIA.</p>
          </div>
          <div className="bg-white/4 border border-white/8 rounded-2xl px-4 py-3.5 mb-6 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-[#2FAF8F] shrink-0" />
            <p className="text-xs text-stone-300">N° de cuenta: <span className="font-mono font-bold text-[#2FAF8F]">{accountId}</span></p>
          </div>
          <button onClick={onGoLogin} className="w-full h-11 rounded-xl bg-[#2FAF8F] hover:bg-[#26a079] text-white text-sm font-semibold transition-colors mb-3">Ir a iniciar sesión</button>
          <button onClick={onGoHome} className="w-full h-11 rounded-xl bg-white/5 hover:bg-white/10 text-stone-400 hover:text-stone-200 text-sm font-medium transition-colors">Volver al inicio</button>
        </div>
      </div>
    </div>
  )

  if (status === 'rejected') return (
    <div className={`fixed inset-0 z-300 flex items-center justify-center px-4 transition-opacity duration-500 ${visible ? 'opacity-100' : 'opacity-0'}`}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-125 h-125 bg-red-500/6 rounded-full blur-3xl pointer-events-none" />
      <div className={`relative z-10 w-full max-w-sm transition-all duration-700 ${visible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'}`}>
        <div className="relative">
          <div className="bg-[#0f0f0f] border border-white/10 rounded-t-3xl px-7 pt-8 pb-6">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="relative mb-4">
                <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center animate-[scaleIn_0.5s_cubic-bezier(0.34,1.56,0.64,1)_0.2s_both]">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#ef4444" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div className="absolute inset-0 rounded-2xl border border-red-500/20 animate-[ringPulse_2.5s_ease-out_infinite_0.7s]" />
              </div>
              <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-full px-3 py-1 mb-3">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500" /><span className="text-xs font-semibold text-red-400">Solicitud rechazada</span>
              </div>
              <h2 className="text-xl font-bold text-white">Tu solicitud fue rechazada</h2>
              <p className="text-stone-500 text-xs mt-1.5 leading-relaxed max-w-55">El equipo GANDIA no pudo aprobar tu solicitud.</p>
            </div>
            <div className="bg-white/4 border border-white/8 rounded-2xl px-4 py-3.5 mb-5">
              <p className="text-[10px] text-stone-600 uppercase tracking-widest mb-1.5 text-center">N° de solicitud</p>
              <p className="text-center text-base font-mono font-bold text-red-400 tracking-[0.25em]">{accountId || '—'}</p>
            </div>
            {rejectionReason && (
              <div className="bg-red-500/8 border border-red-500/15 rounded-xl px-4 py-3 mb-5">
                <p className="text-[10px] text-red-500/70 uppercase tracking-widest mb-1.5">Motivo</p>
                <p className="text-sm text-red-400/90 leading-relaxed">{rejectionReason}</p>
              </div>
            )}
            <div className="space-y-2.5">
              {['Revisa que tu información sea correcta', 'Contacta soporte si crees que es un error', 'Puedes crear una nueva solicitud'].map((label, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 bg-red-500/20 border border-red-500/30">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#ef4444" className="w-2.5 h-2.5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 16h-1v-4h-1m1-4h.01" /></svg>
                  </div>
                  <span className="text-xs text-stone-400 leading-relaxed">{label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="relative h-4 bg-[#0f0f0f] border-x border-white/10 overflow-hidden">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-dashed border-white/10" /></div>
            <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black border border-white/10" />
            <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black border border-white/10" />
          </div>
          <div className="bg-[#0f0f0f] border border-t-0 border-white/10 rounded-b-3xl px-7 py-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-7 h-7 bg-red-500/10 rounded-xl flex items-center justify-center shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#ef4444" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              </div>
              <p className="text-xs text-stone-500">¿Dudas? <span className="text-white font-semibold">soporte@gandia.mx</span></p>
            </div>
            <button onClick={onGoHome} className="w-full h-10 rounded-xl bg-white/8 hover:bg-white/12 text-stone-300 hover:text-white text-sm font-semibold transition-colors">Volver al inicio</button>
          </div>
        </div>
      </div>
    </div>
  )

  // PENDIENTE
  return (
    <div className={`fixed inset-0 z-300 flex items-center justify-center px-4 transition-opacity duration-500 ${visible ? 'opacity-100' : 'opacity-0'}`}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-125 h-125 bg-[#2FAF8F]/8 rounded-full blur-3xl pointer-events-none" />
      <div className={`relative z-10 w-full max-w-sm transition-all duration-700 ${visible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'}`}>
        <div className="relative">
          <div className="bg-[#0f0f0f] border border-white/10 rounded-t-3xl px-7 pt-8 pb-6">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="relative mb-4">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center animate-[scaleIn_0.5s_cubic-bezier(0.34,1.56,0.64,1)_0.2s_both]">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#f59e0b" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div className="absolute inset-0 rounded-2xl border border-amber-500/25 animate-[ringPulse_2.5s_ease-out_infinite_0.7s]" />
              </div>
              <h2 className="text-xl font-bold text-white">Tu solicitud está en revisión</h2>
              <p className="text-stone-500 text-xs mt-1.5 leading-relaxed max-w-55">El equipo GANDIA está revisando tu solicitud.</p>
            </div>
            <div className="bg-white/4 border border-white/8 rounded-2xl px-4 py-3.5 mb-5">
              <p className="text-[10px] text-stone-600 uppercase tracking-widest mb-1.5 text-center">N° de solicitud</p>
              {accountId
                ? <p className="text-center text-base font-mono font-bold text-amber-400 tracking-[0.25em]">{accountId}</p>
                : <div className="flex justify-center py-1"><div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" /></div>}
            </div>
            <div className="space-y-2.5">
              {['Datos personales e institucionales recibidos', 'Solicitud en cola de revisión', 'Recibirás aviso cuando sea aprobada'].map((label, i) => (
                <div key={i} className={`flex items-center gap-3 transition-all duration-500 ${step > i ? 'opacity-100' : 'opacity-20'}`}>
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${step > i ? 'bg-amber-500' : 'border border-stone-700'}`}>
                    {step > i && <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" className="w-2.5 h-2.5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                  </div>
                  <span className="text-xs text-stone-400">{label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="relative h-4 bg-[#0f0f0f] border-x border-white/10 overflow-hidden">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-dashed border-white/10" /></div>
            <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black border border-white/10" />
            <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black border border-white/10" />
          </div>
          <div className="bg-[#0f0f0f] border border-t-0 border-white/10 rounded-b-3xl px-7 py-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-7 h-7 bg-amber-500/10 rounded-xl flex items-center justify-center shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#f59e0b" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <p className="text-xs text-stone-500">Revisión en <span className="text-white font-semibold">24–48 h hábiles</span>.</p>
            </div>
            <button onClick={onGoHome} className="w-full h-10 rounded-xl bg-white/8 hover:bg-white/12 text-stone-300 hover:text-white text-sm font-semibold transition-colors">Entendido, volver al inicio</button>
          </div>
        </div>
      </div>
    </div>
  )
}

const SIGNUP_PHRASES = [
  'Ingresa tu correo para comenzar.',
  'Sin tarjeta, sin compromiso.',
  'Proceso simple en 3 pasos.',
]

const RotatingSignupPhrase = () => {
  const [idx, setIdx] = useState(0)
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    const iv = setInterval(() => {
      setVisible(false)
      setTimeout(() => { setIdx(i => (i + 1) % SIGNUP_PHRASES.length); setVisible(true) }, 300)
    }, 3000)
    return () => clearInterval(iv)
  }, [])
  return (
    <p
      className="text-[14px] font-serif italic text-stone-400 dark:text-stone-600 leading-relaxed"
      style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(4px)', transition: 'opacity 300ms ease, transform 300ms ease', minHeight: '24px' }}
    >
      {SIGNUP_PHRASES[idx]}
    </p>
  )
}

const SignUpAuth = () => {
  const navigate = useNavigate()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const passwordInputRef = useRef<HTMLInputElement>(null)

  useTheme()

  const [existingStatus, setExistingStatus] = useState<'pending' | 'approved' | 'rejected' | null>(null)
  const [existingAccountId, setExistingAccountId] = useState('')
  const [existingRejectionReason, setExistingRejectionReason] = useState('')
  const [checkingProfile, setCheckingProfile] = useState(true)

  useEffect(() => {
    const checkProfile = async () => {
      try {
        // 1. localStorage rápido — solo si ya completó el registro
        const completed = localStorage.getItem('signup-completed')
        const localStatus = localStorage.getItem('user-status')
        const localAccountId = localStorage.getItem('account-id')
        if (completed === 'true' && (localStatus === 'pending' || localStatus === 'approved' || localStatus === 'rejected') && localAccountId) {
          setExistingStatus(localStatus as 'pending' | 'approved' | 'rejected')
          setExistingAccountId(localAccountId)
          setCheckingProfile(false)
          return
        }

        // 2. Verificar sesión en Supabase
        const { data: { session } } = await supabase.auth.getSession()

        // ─── SIN SESIÓN → mostrar formulario de auth (usuario nuevo) ──────
        if (!session?.user) {
          setCheckingProfile(false)
          return
        }

        // ─── CON SESIÓN → verificar si ya tiene perfil ────────────────────
        const profile = await getCurrentProfile()

        // SIN PERFIL → viene de OAuth o acaba de crear cuenta
        // Mandarlo directo al formulario de datos personales
        if (!profile) {
          const provider = session.user.app_metadata?.provider as string || 'email'
          const email = session.user.email || ''
          localStorage.setItem('signup-auth-method', provider)
          if (email) localStorage.setItem('signup-email', email)
          navigate('/signup/personal', { replace: true })
          return
        }

        // CON PERFIL → mostrar ticket según status
        const status = profile.status as 'pending' | 'approved' | 'rejected'
        if (status !== 'pending' && status !== 'approved' && status !== 'rejected') {
          setCheckingProfile(false)
          return
        }

        const accountId =
          (profile as unknown as Record<string, unknown>)?.account_id as string ||
          ((profile?.metadata as Record<string, string>)?.account_id) || ''
        const rejectionReason = (profile as unknown as Record<string, unknown>)?.rejection_reason as string || ''

        localStorage.setItem('signup-completed', 'true')
        localStorage.setItem('user-status', status)
        if (accountId) localStorage.setItem('account-id', accountId)

        setExistingStatus(status)
        setExistingAccountId(accountId)
        setExistingRejectionReason(rejectionReason)
      } catch (err) {
        console.log('[SignUpAuth] checkProfile error:', err)
      }
      setCheckingProfile(false)
    }

    checkProfile()
  }, [navigate])

  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  const [showSubtitle, setShowSubtitle] = useState(false)
  const [loadingProvider, setLoadingProvider] = useState<'google' | 'apple' | 'azure' | null>(null)
  const [showEmailChat, setShowEmailChat] = useState(false)
  const [emailStep, setEmailStep] = useState<'email' | 'password' | 'confirm-password'>('email')
  const [emailForm, setEmailForm] = useState({ email: '', password: '' })
  const [userInput, setUserInput] = useState('')
  const [passwordInput, setPasswordInput] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [messages, setMessages] = useState<Array<{ type: 'assistant' | 'user'; text: string }>>([])
  const [isTyping, setIsTyping] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [modal, setModal] = useState<{ open: boolean; title: string; description: string; confirmLabel: string; onConfirm: () => void }>
    ({ open: false, title: '', description: '', confirmLabel: 'Sí, salir', onConfirm: () => {} })

  const showConfirm = (title: string, description: string, confirmLabel: string, onConfirm: () => void) =>
    setModal({ open: true, title, description, confirmLabel, onConfirm })
  const closeModal = () => setModal(m => ({ ...m, open: false }))

  useEffect(() => {
    const targetDate = new Date('2026-03-29T00:00:00')
    const update = () => {
      const diff = targetDate.getTime() - Date.now()
      if (diff > 0) setCountdown({ days: Math.floor(diff / 86400000), hours: Math.floor((diff % 86400000) / 3600000), minutes: Math.floor((diff % 3600000) / 60000), seconds: Math.floor((diff % 60000) / 1000) })
      else setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 })
    }
    update()
    const iv = setInterval(update, 1000)
    return () => clearInterval(iv)
  }, [])


  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])
  useEffect(() => {
    if (!showEmailChat) return
    setTimeout(() => { if (emailStep === 'password' || emailStep === 'confirm-password') passwordInputRef.current?.focus(); else inputRef.current?.focus() }, 100)
  }, [showEmailChat, emailStep])

  const handleOAuth = async (provider: 'google' | 'apple' | 'azure') => {
    if (loadingProvider) return
    setLoadingProvider(provider)
    // Guardar antes del redirect — localStorage sobrevive el flujo OAuth
    localStorage.setItem('signup-auth-method', provider)
    try { await signInWithOAuth(provider) } catch (err) {
      console.error(err)
      localStorage.removeItem('signup-auth-method')
      setLoadingProvider(null)
    }
  }

  const handleEmail = () => {
    localStorage.removeItem('signup-user-id')
    setShowEmailChat(true); setMessages([]); setEmailStep('email')
    setEmailForm({ email: '', password: '' }); setUserInput(''); setPasswordInput('')
    setShowPassword(false); setShowConfirmPassword(false)
    setIsProcessing(false)
    setTimeout(() => setMessages([{ type: 'assistant', text: 'Perfecto. ¿Cuál es tu correo electrónico?' }]), 300)
  }

  // ─── helpers ─────────────────────────────────────────────────────────────────
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: '', color: '', pct: 0 }
    let score = 0
    if (pwd.length >= 8) score++
    if (pwd.length >= 12) score++
    if (/[A-Z]/.test(pwd)) score++
    if (/[0-9]/.test(pwd)) score++
    if (/[^A-Za-z0-9]/.test(pwd)) score++
    const map = [
      { label: '', color: '', pct: 0 },
      { label: 'Muy débil', color: '#ef4444', pct: 20 },
      { label: 'Débil', color: '#f97316', pct: 40 },
      { label: 'Media', color: '#eab308', pct: 60 },
      { label: 'Fuerte', color: '#22c55e', pct: 80 },
      { label: 'Muy fuerte', color: '#2FAF8F', pct: 100 },
    ]
    return { score, ...map[Math.min(score, 5)] }
  }

  const handleSend = async () => {
    const isPasswordStep = emailStep === 'password' || emailStep === 'confirm-password'
    const value = isPasswordStep ? passwordInput.trim() : userInput.trim()
    if (!value || isProcessing) return

    setMessages(prev => [...prev, { type: 'user', text: isPasswordStep ? '••••••••' : value }])
    if (isPasswordStep) setPasswordInput(''); else setUserInput('')
    setIsProcessing(true); setIsTyping(true)

    setTimeout(async () => {
      setIsTyping(false)
      try {
        // ── PASO 1: EMAIL ────────────────────────────────────────────────────
        if (emailStep === 'email') {
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            setMessages(p => [...p, { type: 'assistant', text: 'Email inválido. Intenta de nuevo.' }])
            setIsProcessing(false); return
          }
          setEmailForm(p => ({ ...p, email: value }))
          setEmailStep('password')
          setMessages(p => [...p, { type: 'assistant', text: `Correo: ${value}. Ahora crea una contraseña segura.` }])
          setIsProcessing(false); return
        }

        // ── PASO 2: CONTRASEÑA ───────────────────────────────────────────────
        if (emailStep === 'password') {
          const strength = getPasswordStrength(value)
          if (value.length < 8) {
            setMessages(p => [...p, { type: 'assistant', text: 'Mínimo 8 caracteres.' }])
            setIsProcessing(false); return
          }
          if (!/[A-Za-z]/.test(value) || !/[0-9]/.test(value)) {
            setMessages(p => [...p, { type: 'assistant', text: 'Incluye letras y al menos un número.' }])
            setIsProcessing(false); return
          }
          if (strength.score < 2) {
            setMessages(p => [...p, { type: 'assistant', text: 'Contraseña muy débil. Añade mayúsculas, números o símbolos.' }])
            setIsProcessing(false); return
          }
          setEmailForm(p => ({ ...p, password: value }))
          setEmailStep('confirm-password')
          setMessages(p => [...p, { type: 'assistant', text: 'Bien. Confirma tu contraseña para continuar.' }])
          setIsProcessing(false); return
        }

        // ── PASO 3: CONFIRMAR CONTRASEÑA + CREAR CUENTA + SESIÓN REAL ────────
        if (emailStep === 'confirm-password') {
          if (value !== emailForm.password) {
            setMessages(p => [...p, { type: 'assistant', text: 'Las contraseñas no coinciden. Intenta de nuevo.' }])
            setIsProcessing(false); return
          }
          setMessages(p => [...p, { type: 'assistant', text: 'Creando tu cuenta...' }])
          setIsTyping(true)

          // 1. Crear usuario en Supabase Auth
          const { userId, email } = await registerUser(emailForm.email, emailForm.password)
          localStorage.setItem('signup-user-id', userId)
          localStorage.setItem('signup-email', email)

          // 2. Establecer sesión real inmediatamente (evita RLS 401 en confirmation)
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: emailForm.email,
            password: emailForm.password,
          })
          if (signInError) {
            // Supabase tiene email confirmation ON — guardar creds de respaldo
            sessionStorage.setItem('signup-temp-email', emailForm.email)
            sessionStorage.setItem('signup-temp-pwd', emailForm.password)
          }

          setIsTyping(false)
          setMessages(p => [...p, { type: 'assistant', text: '¡Cuenta creada! Continuemos con tu perfil.' }])
          setTimeout(() => navigate('/signup/personal'), 1200)
          setIsProcessing(false); return
        }
      } catch (err: unknown) {
        setIsTyping(false)
        setMessages(p => [...p, { type: 'assistant', text: `Error: ${err instanceof Error ? err.message : 'Inténtalo de nuevo.'}` }])
        setIsProcessing(false)
      }
    }, 800)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (userInput.trim() && !isProcessing) handleSend() } }
  const handlePasswordKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') { e.preventDefault(); if (passwordInput.trim() && !isProcessing) handleSend() } }

  const handleBack = () => {
    if (showEmailChat) {
      showConfirm('¿Regresar?', 'Se perderá el progreso.', 'Sí, regresar', () => {
        closeModal(); setShowEmailChat(false); setMessages([]); setEmailStep('email')
        setEmailForm({ email: '', password: '' }); setPasswordInput(''); setShowPassword(false); setIsProcessing(false)
      })
    } else {
      showConfirm('¿Salir del registro?', 'Volverás al inicio.', 'Sí, salir', () => { closeModal(); navigate('/home') })
    }
  }

  if (checkingProfile) return <div className="min-h-screen bg-[#0c0a09]" />

  if (existingStatus) return (
    <>
      <div className="min-h-screen bg-[#0c0a09]" />
      <AlreadyRegisteredScreen status={existingStatus} accountId={existingAccountId} rejectionReason={existingRejectionReason} onGoHome={() => navigate('/home')} onGoLogin={() => navigate('/login')} />
      <style>{`@keyframes scaleIn{from{opacity:0;transform:scale(0.5)}to{opacity:1;transform:scale(1)}}@keyframes ringPulse{0%{opacity:1;transform:scale(1)}100%{opacity:0;transform:scale(1.6)}}`}</style>
    </>
  )

  if (showEmailChat) return (
    <div className="min-h-screen bg-[#fafaf9] dark:bg-[#0c0a09] text-stone-900 dark:text-stone-50 flex flex-col overflow-hidden font-sans">
      <ConfirmModal open={modal.open} title={modal.title} description={modal.description} confirmLabel={modal.confirmLabel} cancelLabel="Cancelar" onConfirm={modal.onConfirm} onCancel={closeModal} />

      {/* ── HEADER ── */}
      <div className="fixed top-0 left-0 right-0 z-50">
        {/* Barra de progreso top — full width */}
        <div className="h-[2px] bg-stone-100 dark:bg-stone-900">
          <div
            className="h-full bg-[#2FAF8F] transition-all duration-700 ease-out"
            style={{ width: emailStep === 'email' ? '33%' : emailStep === 'password' ? '66%' : '100%' }}
          />
        </div>
        <div className="bg-[#fafaf9]/96 dark:bg-[#0c0a09]/96 backdrop-blur-md border-b border-stone-200/40 dark:border-stone-800/40">
          <div className="flex items-center justify-between px-5 h-[54px]">

            {/* Back — pegado a la izquierda */}
            <button onClick={handleBack} className="flex items-center gap-1.5 text-stone-400 dark:text-stone-600 hover:text-stone-700 dark:hover:text-stone-300 transition-colors group">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              <span className="text-[12px] font-medium">Volver</span>
            </button>

            {/* Centro: logo + GANDIA + Registro */}
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
              <svg className="w-5 h-5 text-[#2FAF8F]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
              </svg>
              <span className="text-[13px] font-semibold text-stone-900 dark:text-stone-50 tracking-tight">GANDIA</span>
              <div className="w-px h-3 bg-stone-200 dark:bg-stone-800" />
              <span className="text-[11.5px] text-stone-400 dark:text-stone-600 font-medium">Registro</span>
            </div>

            {/* Derecha: step */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold tracking-[0.1em] uppercase text-stone-400 dark:text-stone-600">
                {emailStep === 'email' ? '01' : emailStep === 'password' ? '02' : '03'} / 03
              </span>
              <div className="w-px h-3 bg-stone-200 dark:bg-stone-800" />
              <span className="text-[12px] font-medium text-stone-600 dark:text-stone-400">
                {emailStep === 'email' ? 'Correo' : emailStep === 'password' ? 'Contraseña' : 'Confirmación'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── MENSAJES ── */}
      <div className="flex-1 overflow-y-auto pt-[52px] pb-44 px-4" style={{ scrollBehavior: 'smooth' }}>
        <div className="max-w-2xl mx-auto flex flex-col gap-6 py-8">

          {/* ── EMPTY STATE ── */}
          {!messages.some(m => m.type === 'user') && (
            <div className="flex flex-col items-center justify-center min-h-[55vh] gap-8 animate-[ec-in_0.4s_cubic-bezier(.16,1,.3,1)_both]">
              <div className="text-center">
                <h1 className="text-[2.1rem] font-serif italic text-stone-900 dark:text-stone-50 leading-[1.2] tracking-[-0.01em] mb-3">
                  Crea tu cuenta<br />en minutos.
                </h1>
                <RotatingSignupPhrase />
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {[
                  { icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />, label: 'Verificación segura' },
                  { icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />, label: 'Revisión 24–48 h' },
                  { icon: <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />, label: 'Acceso inmediato' },
                ].map((chip, i) => (
                  <div key={i} className="flex items-center gap-1.5 h-7 px-3 rounded-full border border-stone-200/80 dark:border-stone-800/60 bg-white dark:bg-[#141210] text-[11.5px] font-medium text-stone-400 dark:text-stone-600">
                    <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>{chip.icon}</svg>
                    {chip.label}
                  </div>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'} ec-msg`}>
              {msg.type === 'user' ? (
                <div className="max-w-[75%] bg-white dark:bg-[#1c1917] border border-stone-200/70 dark:border-stone-800/60 rounded-2xl rounded-br-sm px-4 py-3 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
                  <p className="text-[14px] text-stone-800 dark:text-stone-100 leading-[1.7]">{msg.text}</p>
                </div>
              ) : (
                <p className="max-w-[85%] text-[14.5px] text-stone-600 dark:text-stone-300 leading-[1.8]">{msg.text}</p>
              )}
            </div>
          ))}
          {isTyping && (
            <div className="flex gap-1.5 items-center pl-0.5 ec-msg">
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
            {(emailStep === 'password' || emailStep === 'confirm-password') ? (
              <>
                <input
                  ref={passwordInputRef}
                  type={emailStep === 'password' ? (showPassword ? 'text' : 'password') : (showConfirmPassword ? 'text' : 'password')}
                  value={passwordInput}
                  onChange={e => setPasswordInput(e.target.value)}
                  onKeyDown={handlePasswordKeyDown}
                  disabled={isProcessing}
                  placeholder={emailStep === 'password' ? 'Contraseña segura...' : 'Repite tu contraseña...'}
                  style={{ WebkitAppearance: 'none', outline: 'none', boxShadow: 'none' }}
                  className="w-full px-4 pt-3.5 pb-2 bg-transparent text-[14px] text-stone-800 dark:text-stone-100 placeholder-stone-300 dark:placeholder-stone-600 h-[50px] disabled:cursor-not-allowed [&::-ms-reveal]:hidden"
                />
                {/* Strength indicator — solo en paso password */}
                {emailStep === 'password' && passwordInput.length > 0 && (() => {
                  const s = getPasswordStrength(passwordInput)
                  return (
                    <div className="px-4 pb-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{ width: `${s.pct}%`, backgroundColor: s.color }}
                          />
                        </div>
                        <span className="text-[10.5px] font-medium transition-colors" style={{ color: s.color }}>
                          {s.label}
                        </span>
                      </div>
                      <div className="flex gap-3 mt-1.5">
                        {[
                          { ok: passwordInput.length >= 8, label: '8+ caracteres' },
                          { ok: /[A-Z]/.test(passwordInput), label: 'Mayúscula' },
                          { ok: /[0-9]/.test(passwordInput), label: 'Número' },
                          { ok: /[^A-Za-z0-9]/.test(passwordInput), label: 'Símbolo' },
                        ].map((r, i) => (
                          <span key={i} className={`text-[10px] font-medium transition-colors ${r.ok ? 'text-[#2FAF8F]' : 'text-stone-300 dark:text-stone-700'}`}>
                            {r.ok ? '✓' : '·'} {r.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  )
                })()}
                <div className="flex items-center justify-between px-3 pb-3 pt-0 gap-2">
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => emailStep === 'password' ? setShowPassword(p => !p) : setShowConfirmPassword(p => !p)}
                    className="w-7 h-7 flex items-center justify-center rounded-full text-stone-300 dark:text-stone-600 hover:text-stone-500 dark:hover:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800/60 transition-all"
                  >
                    {(emailStep === 'password' ? showPassword : showConfirmPassword)
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
                  placeholder='tu@correo.com'
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
          <p className="text-center text-[10.5px] text-stone-300 dark:text-stone-700 mt-2">GANDIA · Registro seguro</p>
        </div>
      </div>

      <style>{`
        @keyframes ec-in { from { opacity:0; transform:translateY(6px) } to { opacity:1; transform:translateY(0) } }
        .ec-msg { animation: ec-in 0.22s cubic-bezier(.16,1,.3,1) both; }
        @keyframes modalIn { from{opacity:0;transform:scale(0.95) translateY(8px)} to{opacity:1;transform:scale(1) translateY(0)} }
      `}</style>
    </div>
  )

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-[#0c0a09] text-stone-900 dark:text-stone-50 flex items-center justify-center overflow-hidden font-sans selection:bg-[#2FAF8F]/30">
      <ConfirmModal open={modal.open} title={modal.title} description={modal.description} confirmLabel={modal.confirmLabel} cancelLabel="Cancelar" onConfirm={modal.onConfirm} onCancel={closeModal} />
      <button onClick={handleBack} className="fixed top-6 left-6 z-50 w-10 h-10 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-800 rounded-lg flex items-center justify-center hover:bg-stone-100 dark:hover:bg-stone-800 transition-all">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5 text-stone-600 dark:text-stone-400"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
      </button>
      <div className="flex w-full max-w-350 h-screen">
        <div className="hidden lg:flex lg:w-[45%] lg:min-w-125 bg-stone-950 dark:bg-[#080706] border-r border-stone-800 p-12 flex-col justify-center relative overflow-hidden opacity-0 animate-[fadeInLeft_0.8s_ease-out_0.2s_forwards]">

          {/* Ruido de textura sutil */}
          <div className="absolute inset-0 opacity-[0.025] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 512 512\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")', backgroundSize: '200px' }} />

          {/* Orbes de luz verde */}
          <div className="absolute -top-32 -left-32 w-120 h-120 rounded-full bg-[#2FAF8F]/10 blur-[120px] pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-75 h-75 rounded-full bg-[#2FAF8F]/5 blur-[100px] pointer-events-none" />

          {/* Línea lateral derecha */}
          <div className="absolute top-0 right-0 w-px h-full bg-linear-to-b from-transparent via-[#2FAF8F]/30 to-transparent" />

          <div className="relative z-10 text-center">
            <div className="mb-14">
              <p className="text-[10.5px] font-semibold tracking-[0.2em] uppercase text-stone-600 mb-7">Lanzamiento Oficial</p>
              <CountdownDisplay days={countdown.days} hours={countdown.hours} minutes={countdown.minutes} seconds={countdown.seconds} />
            </div>

            <div className="max-w-md mx-auto w-full">
              <h2 className="text-[2.6rem] font-bold text-stone-50 mb-2 tracking-tight leading-none">GANDIA 7 — BETA</h2>
              <p className="text-[11px] font-semibold tracking-[0.16em] uppercase text-stone-600 mb-10">Acceso Restringido</p>

              <p className="text-[14.5px] text-stone-400 leading-relaxed mb-10">
                Validando profesionales del sector ganadero en Durango.
              </p>

              <div className="flex flex-wrap justify-center gap-x-7 gap-y-4 mb-12">
                {['Productores certificados', 'Médicos Veterinarios', 'Entidades oficiales', 'Uniones Ganaderas'].map((item, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-[12.5px] text-stone-500">
                    <svg className="w-3 h-3 text-[#2FAF8F] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    {item}
                  </div>
                ))}
              </div>

              <div className="border-t border-white/8 pt-7 text-[13px] text-stone-600">
                Revisión en <strong className="text-[#2FAF8F] font-medium">24–48 horas</strong>.
              </div>
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-6 sm:p-10 md:p-16">
          <div className="w-full max-w-130">
            <div className="text-center mb-10">
              {/* Logo — solo icono */}
              <div className="inline-flex mb-7 opacity-0 animate-[fadeInUp_0.5s_ease-out_0.1s_forwards]">
                <svg className="w-9 h-9 text-[#2FAF8F]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
              </div>

              {/* Eyebrow uppercase — igual que Login */}
              <div className="flex items-center justify-center mb-3">
                <span className="text-[11px] font-semibold tracking-[0.14em] uppercase text-stone-500 dark:text-stone-500">
                  {showSubtitle && <TypewriterText text="Sistema institucional de trazabilidad ganadera" speed={28} delay={200} />}
                </span>
              </div>

              <h1 className="text-2xl font-semibold text-stone-900 dark:text-stone-50 tracking-tight">
                <TypewriterText text="Bienvenido a GANDIA" speed={65} onComplete={() => setShowSubtitle(true)} />
              </h1>
            </div>
            <div className="bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-800 rounded-xl p-8 max-w-110 mx-auto relative opacity-0 animate-[generateCard_1.5s_ease-out_3.5s_forwards] overflow-hidden shadow-lg dark:shadow-none">
              <div className="absolute inset-0 bg-linear-to-r from-transparent via-[#2FAF8F]/10 to-transparent animate-[shimmer_1.5s_ease-out_3.5s] pointer-events-none rounded-xl" style={{ backgroundSize: '200% 100%' }} />
              <div className="flex flex-col gap-3 mb-6">
                <button onClick={() => handleOAuth('google')} disabled={loadingProvider !== null} className={`w-full h-12 flex items-center justify-center gap-3 bg-white text-stone-900 border border-stone-300 rounded-lg text-[15px] font-medium transition-all hover:bg-stone-50 hover:border-stone-400 hover:-translate-y-0.5 shadow-sm ${loadingProvider === 'google' ? 'opacity-60 pointer-events-none' : ''}`}>
                  {loadingProvider === 'google' ? <div className="w-4 h-4 border-2 border-stone-900 border-t-transparent rounded-full animate-spin" /> : <><svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>Continuar con Google</>}
                </button>
                {/* Apple — próximamente */}
                <ComingSoonButton className="bg-black text-white border border-stone-800">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 shrink-0">
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                  </svg>
                  Continuar con Apple
                </ComingSoonButton>

                {/* Microsoft — próximamente */}
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
              <div className="flex items-center gap-4 my-6 text-stone-500 dark:text-stone-600 text-[13px] font-medium">
                <div className="flex-1 h-px bg-stone-300 dark:bg-stone-800" /><span>o</span><div className="flex-1 h-px bg-stone-300 dark:bg-stone-800" />
              </div>
              <button onClick={handleEmail} disabled={loadingProvider !== null} className="w-full h-12 flex items-center justify-center gap-3 bg-transparent text-stone-900 dark:text-stone-50 border border-stone-300 dark:border-zinc-700 rounded-lg text-[15px] font-medium transition-all hover:bg-stone-50 dark:hover:bg-stone-800 hover:border-stone-400 mb-6 disabled:opacity-50 disabled:cursor-not-allowed">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                Continuar con Email
              </button>
              <div className="text-center text-[13px] text-stone-600 dark:text-stone-600 mt-6 pt-6 border-t border-stone-300 dark:border-stone-800">
                ¿Ya tienes una cuenta? <button onClick={() => navigate('/login')} className="text-[#2FAF8F] font-medium hover:text-[#26a079] transition-colors">Inicia sesión</button>
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
        @keyframes modalIn{from{opacity:0;transform:scale(0.95) translateY(8px)}to{opacity:1;transform:scale(1) translateY(0)}}
        @keyframes scaleIn{from{opacity:0;transform:scale(0.5)}to{opacity:1;transform:scale(1)}}
        @keyframes ringPulse{0%{opacity:1;transform:scale(1)}100%{opacity:0;transform:scale(1.6)}}
      `}</style>
    </div>
  )
}

export default SignUpAuth