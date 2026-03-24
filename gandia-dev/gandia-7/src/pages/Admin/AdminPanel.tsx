import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import {
  Shield, CheckCircle, XCircle, Clock, User, Mail, Phone, MapPin,
  FileText, Eye, EyeOff, Lock, Key, AlertCircle, LogOut, Search,
  Filter, X as CloseIcon, Loader2, RefreshCw
} from 'lucide-react'

// ─────────────────────────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────────────────────────
const CONFIG = {
  SESSION_TIMEOUT_MS: 30 * 60 * 1000,
  REMEMBER_ME_DAYS: 7,
  TOAST_DURATION: 4000,
  RESEND_COOLDOWN: 60,
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION_MS: 15 * 60 * 1000,
  STORAGE_KEY: 'gandia_admin_session',
  ATTEMPTS_KEY: 'gandia_admin_attempts',
} as const

// ─────────────────────────────────────────────────────────────────────────────
// SESSION HELPERS
// ─────────────────────────────────────────────────────────────────────────────
interface StoredSession {
  authenticated: true; email: string; expiresAt: number; rememberMe: boolean
}

const SessionStore = {
  read(): StoredSession | null {
    try {
      const raw = localStorage.getItem(CONFIG.STORAGE_KEY) ?? sessionStorage.getItem(CONFIG.STORAGE_KEY)
      if (!raw) return null
      const parsed: StoredSession = JSON.parse(raw)
      if (!parsed.authenticated || !parsed.expiresAt) return null
      if (Date.now() > parsed.expiresAt) { SessionStore.clear(); return null }
      return parsed
    } catch { SessionStore.clear(); return null }
  },
  write(email: string, rememberMe: boolean): void {
    const expiresAt = rememberMe
      ? Date.now() + CONFIG.REMEMBER_ME_DAYS * 24 * 60 * 60 * 1000
      : Date.now() + CONFIG.SESSION_TIMEOUT_MS
    const payload: StoredSession = { authenticated: true, email, expiresAt, rememberMe }
    const json = JSON.stringify(payload)
    if (rememberMe) localStorage.setItem(CONFIG.STORAGE_KEY, json)
    else sessionStorage.setItem(CONFIG.STORAGE_KEY, json)
  },
  refresh(): void {
    const session = SessionStore.read()
    if (!session || session.rememberMe) return
    SessionStore.write(session.email, false)
  },
  clear(): void {
    localStorage.removeItem(CONFIG.STORAGE_KEY)
    sessionStorage.removeItem(CONFIG.STORAGE_KEY)
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// RATE LIMITER
// ─────────────────────────────────────────────────────────────────────────────
interface AttemptsRecord { count: number; lockedUntil: number | null }

const RateLimiter = {
  get(): AttemptsRecord {
    try { const raw = localStorage.getItem(CONFIG.ATTEMPTS_KEY); return raw ? JSON.parse(raw) : { count: 0, lockedUntil: null } }
    catch { return { count: 0, lockedUntil: null } }
  },
  isLocked(): boolean { const { lockedUntil } = RateLimiter.get(); return lockedUntil !== null && Date.now() < lockedUntil },
  lockoutRemainingSeconds(): number { const { lockedUntil } = RateLimiter.get(); if (!lockedUntil || Date.now() >= lockedUntil) return 0; return Math.ceil((lockedUntil - Date.now()) / 1000) },
  recordFailure(): void {
    const rec = RateLimiter.get(); const newCount = rec.count + 1
    const lockedUntil = newCount >= CONFIG.MAX_LOGIN_ATTEMPTS ? Date.now() + CONFIG.LOCKOUT_DURATION_MS : null
    localStorage.setItem(CONFIG.ATTEMPTS_KEY, JSON.stringify({ count: newCount, lockedUntil }))
  },
  reset(): void { localStorage.removeItem(CONFIG.ATTEMPTS_KEY) },
}

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
interface PendingUser {
  id: string
  account_id?: string
  created_at: string
  auth_method: 'email' | 'google' | 'apple' | 'microsoft'
  email: string
  personal_data: {
    fullName: string; birthdate: string; gender: string; curp: string
    phone: string; address: string; municipality: string; state: string
    postalCode: string; country: string; rfc: string
    role: 'producer' | 'mvz' | 'union' | 'exporter' | 'auditor'
  }
  institutional_data: Record<string, string>
  status: 'pending' | 'approved' | 'rejected'
  reviewed_by?: string; reviewed_at?: string; rejection_reason?: string
}

type AuthStep = 'credentials' | 'master-key' | '2fa' | 'authenticated'
type FilterType = 'all' | 'pending' | 'approved' | 'rejected'
type MainTab = 'usuarios' | 'creadores' | 'aportes' | 'moderadores'
interface Toast { id: string; type: 'success' | 'error' | 'info'; message: string }

interface CreatorRequest {
  id: string; user_id: string; creator_type: string; nivel: number
  status: string; estado_mx: string | null; region: string | null
  bio: string | null; especialidades: string[] | null
  trust_score: number; created_at: string; email?: string
}

interface Submission {
  id: string; user_id: string; tipo: string; titulo: string
  contenido: string; estado_mx: string | null; region: string | null
  source_links: string[] | null; status: string
  trust_index: number; created_at: string; email?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────
const ROLE_LABELS: Record<string, string> = {
  producer: 'Productor Ganadero', mvz: 'Médico Veterinario Zootecnista',
  union: 'Unión Ganadera', exporter: 'Exportador', auditor: 'Auditor / Inspector',
}
interface ModeratorApplication {
  id:        string
  user_id:   string | null
  tipo:      string
  nombre:    string
  correo:    string
  estado_mx: string | null
  bio:       string | null
  status:    string
  created_at: string
}

const CREATOR_TYPE_LABELS: Record<string, string> = {
  productor: 'Productor ganadero', mvz: 'Médico Veterinario', asociacion: 'Asociación ganadera',
  union: 'Unión Ganadera', exportador: 'Exportador', investigador: 'Investigador / Académico',
  auditor: 'Auditor / Inspector',
}
const SUBMISSION_TYPE_LABELS: Record<string, string> = {
  noticia: 'Noticia', alerta: 'Alerta sanitaria',
  reporte_campo: 'Reporte de campo', correccion: 'Corrección',
}
const FIELD_LABELS: Record<string, string> = {
  fullName: 'Nombre completo', birthdate: 'Fecha de nacimiento', gender: 'Género',
  curp: 'CURP', phone: 'Teléfono', address: 'Domicilio', municipality: 'Municipio',
  state: 'Estado', postalCode: 'Código postal', country: 'País', rfc: 'RFC', role: 'Rol',
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN SERVICE — todo real, incluido 2FA por email (Resend vía Supabase)
// ─────────────────────────────────────────────────────────────────────────────
class AdminService {
  async verifyAdminCredentials(email: string, password: string): Promise<string | null> {
    // 1. Limpiar sesión previa (OAuth de Google puede bloquear signInWithPassword)
    try { await supabase.auth.signOut() } catch { /* ignore */ }
    // Limpiar también el token de localStorage
    localStorage.removeItem('gandia-auth-token')

    // 2. Intentar login con SDK
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      // Si el SDK falla con 400, intentar con fetch directo
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY

      try {
        const resp = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseAnon,
          },
          body: JSON.stringify({ email, password }),
        })

        if (!resp.ok) {
          const errBody = await resp.json().catch(() => ({}))
          return errBody?.error_description || errBody?.msg || authError.message
        }

        // Guardar el token manualmente para que las llamadas RPC funcionen
        const tokenData = await resp.json()
        localStorage.setItem('gandia-auth-token', JSON.stringify(tokenData))

        // Establecer la sesión en el SDK
        if (tokenData.access_token && tokenData.refresh_token) {
          await supabase.auth.setSession({
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token,
          })
        }
      } catch {
        return authError.message
      }
    }

    // 3. Verificar que es admin
    const { data, error: rpcError } = await supabase.rpc('is_current_user_admin')
    if (rpcError) return `Error al verificar permisos: ${rpcError.message}`
    if (!data) return 'Este usuario no tiene permisos de administrador'
    return null
  }

  async fetchRegistrations(): Promise<PendingUser[]> {
    const { data, error } = await supabase.rpc('admin_get_all_profiles')
    if (error) throw new Error(error.message)
    return (data ?? []) as PendingUser[]
  }

  async approveRegistration(id: string): Promise<void> {
    const { error } = await supabase.rpc('approve_registration', { profile_id: id })
    if (error) throw new Error(error.message)
  }

  async rejectRegistration(id: string, reason?: string): Promise<void> {
    const { error } = await supabase.rpc('reject_registration', { profile_id: id, reason: reason ?? null })
    if (error) throw new Error(error.message)
  }

  async verifyMasterKey(key: string): Promise<boolean> {
    await new Promise(r => setTimeout(r, 300))
    return key === import.meta.env.VITE_ADMIN_MASTER_KEY
  }

  // 2FA real — OTP por email vía Supabase (Resend)
  async send2FA(email: string): Promise<void> {
    const { error } = await supabase.auth.signInWithOtp({ email })
    if (error) throw new Error(error.message)
  }

  async verify2FA(email: string, code: string): Promise<boolean> {
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'email',
    })
    return !error
  }
}

const adminService = new AdminService()

// ─────────────────────────────────────────────────────────────────────────────
// HOOKS
// ─────────────────────────────────────────────────────────────────────────────
const useTheme = () => {
  const [isDark, setIsDark] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
  )
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const h = (e: MediaQueryListEvent) => setIsDark(e.matches)
    mq.addEventListener('change', h); return () => mq.removeEventListener('change', h)
  }, [])
  return { isDark }
}

// ─────────────────────────────────────────────────────────────────────────────
// SMALL COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────
const ToastContainer = ({ toasts, removeToast }: { toasts: Toast[]; removeToast: (id: string) => void }) => {
  const { isDark } = useTheme()
  return (
    <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className={`pointer-events-auto max-w-sm px-4 py-3.5 rounded-xl border shadow-2xl flex items-start gap-3 animate-[slideIn_0.3s] ${isDark ? 'bg-[#1A1A1A] border-[#2A2A2A]' : 'bg-white border-stone-200'}`}>
          <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${t.type === 'success' ? 'bg-[#2FAF8F]/10' : t.type === 'error' ? 'bg-red-500/10' : 'bg-blue-500/10'}`}>
            {t.type === 'success' ? <CheckCircle className="w-3.5 h-3.5 text-[#2FAF8F]" strokeWidth={2.5} /> : <AlertCircle className={`w-3.5 h-3.5 ${t.type === 'error' ? 'text-red-500' : 'text-blue-500'}`} strokeWidth={2.5} />}
          </div>
          <p className={`flex-1 text-sm font-medium ${isDark ? 'text-stone-50' : 'text-stone-900'}`}>{t.message}</p>
          <button onClick={() => removeToast(t.id)} className={`p-1 rounded-lg transition-colors ${isDark ? 'hover:bg-stone-800 text-stone-400' : 'hover:bg-stone-100 text-stone-500'}`}><CloseIcon className="w-3.5 h-3.5" strokeWidth={2} /></button>
        </div>
      ))}
      <style>{`@keyframes slideIn{from{opacity:0;transform:translateX(100%)}to{opacity:1;transform:translateX(0)}}`}</style>
    </div>
  )
}

const SkeletonLoader = ({ isDark }: { isDark: boolean }) => (
  <div className="space-y-3">
    {[1, 2, 3].map(i => (
      <div key={i} className={`p-5 rounded-xl border animate-pulse ${isDark ? 'bg-[#121212] border-[#2A2A2A]' : 'bg-[#F5F5F4] border-[#EAEAEA]'}`}>
        <div className="flex gap-4">
          <div className={`w-12 h-12 rounded-lg ${isDark ? 'bg-stone-800' : 'bg-stone-300'}`} />
          <div className="flex-1 space-y-3">
            <div className={`h-4 w-1/3 rounded ${isDark ? 'bg-stone-800' : 'bg-stone-300'}`} />
            <div className={`h-3 w-1/2 rounded ${isDark ? 'bg-stone-800' : 'bg-stone-300'}`} />
          </div>
        </div>
      </div>
    ))}
  </div>
)

const StatusBadge = ({ status }: { status: PendingUser['status'] }) => (
  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 ${status === 'approved' ? 'bg-[#2FAF8F]/10 text-[#2FAF8F]' : status === 'rejected' ? 'bg-red-500/10 text-red-500' : 'bg-orange-500/10 text-orange-500'}`}>
    {status === 'pending' && <Clock className="w-3 h-3" />}
    {status === 'approved' && <CheckCircle className="w-3 h-3" />}
    {status === 'rejected' && <XCircle className="w-3 h-3" />}
    {status === 'pending' ? 'Pendiente' : status === 'approved' ? 'Aprobada' : 'Rechazada'}
  </span>
)

const VerifiedBadge = ({ label, sub, isDark }: { label: string; sub: string; isDark: boolean }) => (
  <div className={`p-3.5 rounded-xl border flex items-center gap-3 ${isDark ? 'bg-[#0c0a09] border-[#2A2A2A]' : 'bg-stone-50 border-stone-200'}`}>
    <div className="w-8 h-8 bg-[#2FAF8F]/10 rounded-lg flex items-center justify-center shrink-0">
      <CheckCircle className="w-4 h-4 text-[#2FAF8F]" strokeWidth={2} />
    </div>
    <div><p className="text-sm font-medium leading-tight">{label}</p><p className="text-xs text-stone-500 mt-0.5">{sub}</p></div>
  </div>
)

const ErrorBanner = ({ message }: { message: string }) => (
  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm flex items-center gap-2">
    <AlertCircle className="w-4 h-4 shrink-0" strokeWidth={2} /><span>{message}</span>
  </div>
)

const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'hace un momento'
  if (m < 60) return `hace ${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `hace ${h}h`
  return `hace ${Math.floor(h / 24)}d`
}

interface PasswordInputProps {
  value: string; onChange: (v: string) => void; placeholder?: string; autoFocus?: boolean
  onKeyDown?: (e: React.KeyboardEvent) => void; className: string; iconClass: string
  mono?: boolean; LeftIcon?: React.ElementType
}

const PasswordInput = ({ value, onChange, placeholder, autoFocus, onKeyDown, className, iconClass, mono = false, LeftIcon = Lock }: PasswordInputProps) => {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <LeftIcon className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${iconClass}`} />
      <input
        type={show ? 'text' : 'password'} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} autoFocus={autoFocus} onKeyDown={onKeyDown}
        style={{ WebkitAppearance: 'none' }}
        className={`w-full pl-10 pr-10 py-3 rounded-xl border outline-none text-sm transition-colors [&::-ms-reveal]:hidden [&::-ms-clear]:hidden ${mono ? 'font-mono' : ''} ${className}`}
      />
      <button type="button" onClick={() => setShow(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-colors hover:opacity-80" tabIndex={-1}>
        {show ? <EyeOff className="w-4 h-4 text-stone-400" strokeWidth={2} /> : <Eye className="w-4 h-4 text-stone-400" strokeWidth={2} />}
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN PANEL
// ─────────────────────────────────────────────────────────────────────────────
const AdminPanel = () => {
  const navigate = useNavigate()
  const { isDark } = useTheme()
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const realtimeChannel = useRef<ReturnType<typeof supabase.channel> | null>(null)

  const [authStep, setAuthStep] = useState<AuthStep>(() => {
    const session = SessionStore.read()
    return session?.authenticated ? 'authenticated' : 'credentials'
  })
  const [adminEmail, setAdminEmail] = useState<string>(() => SessionStore.read()?.email ?? '')
  const [credentials, setCredentials] = useState({ email: '', password: '' })
  const [rememberMe, setRememberMe] = useState(false)
  const [masterKey, setMasterKey] = useState('')
  const [twoFACode, setTwoFACode] = useState('')
  const [authError, setAuthError] = useState('')
  const [isAuthLoading, setIsAuthLoading] = useState(false)
  const [resendCountdown, setResendCountdown] = useState(0)
  const [lockoutSeconds, setLockoutSeconds] = useState(() => RateLimiter.lockoutRemainingSeconds())

  const [users, setUsers] = useState<PendingUser[]>([])
  const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null)
  const [filter, setFilter] = useState<FilterType>('pending')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  const [toasts, setToasts] = useState<Toast[]>([])
  const [rejectionReason, setRejectionReason] = useState('')
  const [showRejectionModal, setShowRejectionModal] = useState<string | null>(null)

  // ── Tabs principales ──
  const [mainTab, setMainTab] = useState<MainTab>('usuarios')

  // ── Creadores ──
  const [creators, setCreators] = useState<CreatorRequest[]>([])
  const [selectedCreator, setSelectedCreator] = useState<CreatorRequest | null>(null)
  const [creatorsLoading, setCreatorsLoading] = useState(false)
  const [creatorFilter, setCreatorFilter] = useState<'pendiente' | 'activo' | 'rechazado' | 'todos'>('pendiente')

  // ── Moderadores ──
  const [modApps, setModApps] = useState<ModeratorApplication[]>([])
  const [modAppsLoading, setModAppsLoading] = useState(false)

  // ── Aportes ──
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [submissionsLoading, setSubmissionsLoading] = useState(false)
  const [submissionFilter, setSubmissionFilter] = useState<'pendiente' | 'publicado' | 'rechazado' | 'todos'>('pendiente')

  const showToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = Math.random().toString(36).substring(7)
    setToasts(p => [...p, { id, message, type }])
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), CONFIG.TOAST_DURATION)
  }, [])
  const removeToast = useCallback((id: string) => setToasts(p => p.filter(t => t.id !== id)), [])

  const loadUsers = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true)
    try {
      const data = await adminService.fetchRegistrations()
      setUsers(data)
      setLastRefresh(new Date())
      // Si hay un usuario seleccionado, actualizarlo también
      setSelectedUser(prev => prev ? (data.find(u => u.id === prev.id) ?? null) : null)
    } catch (err) {
      showToast('Error al cargar registros', 'error')
      console.error('[AdminPanel] loadUsers:', err)
    } finally { if (!silent) setIsLoading(false) }
  }, [showToast])

  // ── Load creator requests ──
  const loadCreators = async (silent = false) => {
    if (!silent) setCreatorsLoading(true)
    try {
      const { data } = await supabase
        .from('creator_profiles')
        .select('*')
        .order('created_at', { ascending: false })
      setCreators((data as CreatorRequest[]) ?? [])
    } catch (err) { console.error('[AdminPanel] loadCreators:', err) }
    finally { if (!silent) setCreatorsLoading(false) }
  }

  // ── Load submissions ──
  const loadSubmissions = async (silent = false) => {
    if (!silent) setSubmissionsLoading(true)
    try {
      const { data } = await supabase
        .from('user_submissions')
        .select('*')
        .order('created_at', { ascending: false })
      setSubmissions((data as Submission[]) ?? [])
    } catch (err) { console.error('[AdminPanel] loadSubmissions:', err) }
    finally { if (!silent) setSubmissionsLoading(false) }
  }

  // ── Realtime subscription: cualquier cambio en user_profiles → recarga ──
  const subscribeRealtime = useCallback(() => {
    if (realtimeChannel.current) {
      supabase.removeChannel(realtimeChannel.current)
    }
    realtimeChannel.current = supabase
      .channel('admin_profiles_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_profiles' }, () => {
        console.log('[AdminPanel] Realtime change detected — reloading...')
        loadUsers(true) // silent reload, no spinner
      })
      .subscribe()
  }, [loadUsers])

  const resetInactivityTimer = useCallback(() => {
    if (authStep !== 'authenticated') return
    const session = SessionStore.read()
    if (!session || session.rememberMe) return
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current)
    SessionStore.refresh()
    inactivityTimer.current = setTimeout(() => {
      handleLogout()
      showToast('Sesión expirada por inactividad', 'info')
    }, CONFIG.SESSION_TIMEOUT_MS)
  }, [authStep, showToast]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (authStep !== 'authenticated') return
    loadUsers()
    loadCreators()
    loadSubmissions()
    loadModApps()
    subscribeRealtime()
    resetInactivityTimer()
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart']
    events.forEach(ev => window.addEventListener(ev, resetInactivityTimer, { passive: true }))
    return () => {
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current)
      if (realtimeChannel.current) supabase.removeChannel(realtimeChannel.current)
      events.forEach(ev => window.removeEventListener(ev, resetInactivityTimer))
    }
  }, [authStep]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (resendCountdown <= 0) return
    const t = setTimeout(() => setResendCountdown(c => c - 1), 1000); return () => clearTimeout(t)
  }, [resendCountdown])

  useEffect(() => {
    if (lockoutSeconds <= 0) return
    const t = setTimeout(() => setLockoutSeconds(s => Math.max(0, s - 1)), 1000); return () => clearTimeout(t)
  }, [lockoutSeconds])

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setSelectedUser(null); setShowRejectionModal(null) }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); document.getElementById('search-input')?.focus() }
    }
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h)
  }, [])

  // ── AUTH ──
  const handleCredentialsSubmit = async () => {
    if (RateLimiter.isLocked()) { setLockoutSeconds(RateLimiter.lockoutRemainingSeconds()); return }
    setAuthError(''); setIsAuthLoading(true)
    try {
      const err = await adminService.verifyAdminCredentials(credentials.email.trim().toLowerCase(), credentials.password)
      if (err === null) {
        RateLimiter.reset()
        setAdminEmail(credentials.email.trim().toLowerCase())
        setAuthStep('master-key')
      } else {
        RateLimiter.recordFailure(); setLockoutSeconds(RateLimiter.lockoutRemainingSeconds())
        const remaining = CONFIG.MAX_LOGIN_ATTEMPTS - RateLimiter.get().count
        setAuthError(
          RateLimiter.isLocked() ? `Demasiados intentos. Intenta en ${Math.ceil(CONFIG.LOCKOUT_DURATION_MS / 60000)} min.`
            : remaining > 0 ? `${err} (${remaining} intento${remaining !== 1 ? 's' : ''} restante${remaining !== 1 ? 's' : ''})` : err
        )
      }
    } catch (e: unknown) { setAuthError(e instanceof Error ? e.message : 'Error de autenticación') }
    finally { setIsAuthLoading(false) }
  }

  const handleMasterKeySubmit = async () => {
    setAuthError(''); setIsAuthLoading(true)
    try {
      const ok = await adminService.verifyMasterKey(masterKey)
      if (!ok) { setAuthError('Llave maestra incorrecta'); setIsAuthLoading(false); return }
    } catch { setAuthError('Error al verificar llave'); setIsAuthLoading(false); return }
    try {
      await adminService.send2FA(adminEmail)
      setAuthStep('2fa'); setResendCountdown(CONFIG.RESEND_COOLDOWN)
      showToast('Código enviado — revisa tu correo', 'info')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al enviar el código 2FA'
      setAuthError(msg.includes('rate') ? 'Demasiados intentos. Espera unos minutos.' : `Error al enviar código: ${msg}`)
    } finally { setIsAuthLoading(false) }
  }

  const handle2FASubmit = async () => {
    setAuthError(''); setIsAuthLoading(true)
    try {
      const ok = await adminService.verify2FA(adminEmail, twoFACode)
      if (ok) { SessionStore.write(adminEmail, rememberMe); setAuthStep('authenticated'); showToast('Acceso concedido', 'success') }
      else { setAuthError('Código incorrecto') }
    } catch { setAuthError('Error al verificar código') }
    finally { setIsAuthLoading(false) }
  }

  const handleResend2FA = async () => {
    if (resendCountdown > 0) return
    try { await adminService.send2FA(adminEmail); setResendCountdown(CONFIG.RESEND_COOLDOWN); showToast('Código reenviado — revisa la consola', 'info') }
    catch { showToast('Error al reenviar', 'error') }
  }

  const handleLogout = useCallback(() => {
    SessionStore.clear()
    if (realtimeChannel.current) { supabase.removeChannel(realtimeChannel.current); realtimeChannel.current = null }
    setAuthStep('credentials'); setCredentials({ email: '', password: '' }); setAdminEmail('')
    setMasterKey(''); setTwoFACode(''); setUsers([]); setSelectedUser(null)
    supabase.auth.signOut()
  }, [])

  // ── ACTIONS ──
  const handleApprove = async (id: string) => {
    setIsActionLoading(true)
    try {
      await adminService.approveRegistration(id)
      await loadUsers(); setSelectedUser(null)
      showToast('Solicitud aprobada ✓', 'success')
    } catch (e: unknown) { showToast(e instanceof Error ? e.message : 'Error al aprobar', 'error') }
    finally { setIsActionLoading(false) }
  }

  const handleReject = async (id: string, reason?: string) => {
    setIsActionLoading(true)
    try {
      await adminService.rejectRegistration(id, reason)
      await loadUsers(); setSelectedUser(null); setShowRejectionModal(null); setRejectionReason('')
      showToast('Solicitud rechazada', 'success')
    } catch (e: unknown) { showToast(e instanceof Error ? e.message : 'Error al rechazar', 'error') }
    finally { setIsActionLoading(false) }
  }

  // ── Load moderator applications ──
  const loadModApps = async (silent = false) => {
    if (!silent) setModAppsLoading(true)
    try {
      const { data } = await supabase
        .from('moderator_applications')
        .select('*')
        .order('created_at', { ascending: false })
      setModApps((data as ModeratorApplication[]) ?? [])
    } catch (err) { console.error('[AdminPanel] loadModApps:', err) }
    finally { if (!silent) setModAppsLoading(false) }
  }

  // ── Creator actions ──
  const handleApproveCreator = async (id: string) => {
    setIsActionLoading(true)
    try {
      await supabase.from('creator_profiles').update({ status: 'activo' }).eq('id', id)
      await loadCreators(); setSelectedCreator(null)
      showToast('Perfil de creador aprobado', 'success')
    } catch { showToast('Error al aprobar', 'error') }
    finally { setIsActionLoading(false) }
  }

  const handleRejectCreator = async (id: string) => {
    setIsActionLoading(true)
    try {
      await supabase.from('creator_profiles').update({ status: 'rechazado' }).eq('id', id)
      await loadCreators(); setSelectedCreator(null)
      showToast('Solicitud de creador rechazada', 'success')
    } catch { showToast('Error al rechazar', 'error') }
    finally { setIsActionLoading(false) }
  }

  // ── Submission actions ──
  const handleApproveSubmission = async (id: string) => {
    setIsActionLoading(true)
    try {
      const sub = submissions.find(s => s.id === id)
      if (!sub) throw new Error('Aporte no encontrado')

      // Crear noticia en el feed
      const slug = sub.titulo.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').slice(0, 80)
        + '-' + Date.now().toString(36)

      await supabase.from('noticias').insert({
        slug,
        titulo:          sub.titulo,
        cuerpo:          sub.contenido,
        fuente:          'Comunidad Handeia',
        fuente_origen:   'MANUAL',
        categoria:       'GENERAL',
        urgente:         false,
        urgencia_nivel:  'BAJA',
        resumenes_ia:    { Productor: sub.contenido.slice(0, 200), Exportador: sub.contenido.slice(0, 200), MVZ: sub.contenido.slice(0, 200), Union: sub.contenido.slice(0, 200), Auditor: sub.contenido.slice(0, 200) },
        resumen_general: sub.contenido.slice(0, 300),
        acciones_ia:     '[]',
        relevancia:      { Productor: 5, Exportador: 5, MVZ: 5, Union: 5, Auditor: 5 },
        relacionadas:    '{}',
        lectura_minutos: Math.max(1, Math.ceil(sub.contenido.split(' ').length / 200)),
        activa:          true,
        procesada_ia:    false,
        publicada_en:    new Date().toISOString(),
        trust_index:     sub.trust_index,
        verification_status: 'comunitario',
      })

      // Marcar submission como publicada
      await supabase.from('user_submissions').update({ status: 'publicado' }).eq('id', id)
      await loadSubmissions()
      setSelectedSubmission(null)
      showToast('Aporte publicado en el feed', 'success')
    } catch (e: unknown) { showToast(e instanceof Error ? e.message : 'Error al publicar', 'error') }
    finally { setIsActionLoading(false) }
  }

  const handleRejectSubmission = async (id: string) => {
    setIsActionLoading(true)
    try {
      await supabase.from('user_submissions').update({ status: 'rechazado' }).eq('id', id)
      await loadSubmissions(); setSelectedSubmission(null)
      showToast('Aporte rechazado', 'success')
    } catch { showToast('Error al rechazar', 'error') }
    finally { setIsActionLoading(false) }
  }

  // ── Moderator application actions ──
  const handleApproveModApp = async (app: ModeratorApplication) => {
    setIsActionLoading(true)
    try {
      if (!app.user_id) throw new Error('Sin user_id — el usuario no completó el registro')

      // Llamar Edge Function que usa service role para bypassar RLS
      const { data: fnData, error: fnErr } = await supabase.functions.invoke('approve-moderator', {
        body: {
          app_id:    app.id,
          user_id:   app.user_id,
          tipo:      app.tipo,
          estado_mx: app.estado_mx,
          bio:       app.bio,
        },
      })
      if (fnErr || !fnData?.ok) throw new Error(fnErr?.message ?? 'Error en la Edge Function')

      await loadModApps()
      showToast(`Moderador activado · ${app.nombre} (${app.correo})`, 'success')
    } catch (e: unknown) { showToast(e instanceof Error ? e.message : 'Error al aprobar', 'error') }
    finally { setIsActionLoading(false) }
  }

  const handleRejectModApp = async (id: string) => {
    setIsActionLoading(true)
    try {
      await supabase.from('moderator_applications').update({ status: 'rechazado' }).eq('id', id)
      await loadModApps()
      showToast('Solicitud rechazada', 'success')
    } catch { showToast('Error al rechazar', 'error') }
    finally { setIsActionLoading(false) }
  }

  // ── COMPUTED ──
  const stats = useMemo(() => ({
    pending: users.filter(u => u.status === 'pending').length,
    approved: users.filter(u => u.status === 'approved').length,
    rejected: users.filter(u => u.status === 'rejected').length,
  }), [users])

  const filteredUsers = useMemo(() => {
    let list = filter === 'all' ? users : users.filter(u => u.status === filter)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter(u =>
        u.personal_data.fullName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.personal_data.state?.toLowerCase().includes(q) ||
        u.account_id?.toLowerCase().includes(q),
      )
    }
    return list
  }, [users, filter, searchQuery])

  // ── THEME ──
  const bg   = isDark ? 'bg-[#0c0a09] text-[#FAFAFA]' : 'bg-white text-[#171717]'
  const sec  = isDark ? 'text-[#A3A3A3]' : 'text-[#6E6E6E]'
  const card = isDark ? 'bg-[#121212] border-[#2A2A2A]' : 'bg-[#F5F5F4] border-[#EAEAEA]'
  const inp  = isDark
    ? 'bg-[#0c0a09] border-[#2A2A2A] focus:border-[#2FAF8F] text-stone-100 placeholder:text-stone-600'
    : 'bg-white border-[#EAEAEA] focus:border-[#2FAF8F] text-stone-900 placeholder:text-stone-400'
  const iconCls = isDark ? 'text-stone-500' : 'text-stone-400'
  const sessionInfo = SessionStore.read()

  // ═══════════════════════════════════════════════════════════════════════════
  // AUTH GATE
  // ═══════════════════════════════════════════════════════════════════════════
  if (authStep !== 'authenticated') {
    const steps = ['credentials', 'master-key', '2fa'] as const
    const currentIdx = steps.indexOf(authStep as typeof steps[number])
    return (
      <>
        <div className={`min-h-screen ${bg} flex items-center justify-center p-6`}>
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-[#2FAF8F] rounded-2xl inline-flex items-center justify-center mb-4 shadow-lg shadow-[#2FAF8F]/25">
                <Shield className="w-9 h-9 text-white" strokeWidth={1.5} />
              </div>
              <h1 className="text-2xl font-semibold mb-1">Panel de Administración</h1>
              <p className={sec}>
                {authStep === 'credentials' && 'Ingresa tus credenciales de acceso'}
                {authStep === 'master-key' && 'Verificación con llave maestra'}
                {authStep === '2fa' && 'Autenticación de dos factores'}
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 mb-7">
              {steps.map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${currentIdx >= i ? 'bg-[#2FAF8F] text-white' : isDark ? 'bg-[#2A2A2A] text-stone-600' : 'bg-stone-200 text-stone-500'}`}>
                    {currentIdx > i ? <CheckCircle className="w-4 h-4" /> : i + 1}
                  </div>
                  {i < 2 && <div className={`w-8 h-px transition-colors ${currentIdx > i ? 'bg-[#2FAF8F]' : isDark ? 'bg-[#2A2A2A]' : 'bg-stone-200'}`} />}
                </div>
              ))}
            </div>
            <div className={`p-8 rounded-2xl border shadow-xl ${card}`}>
              {authStep === 'credentials' && (
                <div className="space-y-4">
                  {lockoutSeconds > 0 && (
                    <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-500 text-sm flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      Cuenta bloqueada. Intenta en {Math.ceil(lockoutSeconds / 60)} min {lockoutSeconds % 60}s.
                    </div>
                  )}
                  <div>
                    <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${sec}`}>Correo electrónico</label>
                    <div className="relative">
                      <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${iconCls}`} />
                      <input type="email" value={credentials.email} onChange={e => setCredentials(p => ({ ...p, email: e.target.value }))}
                        placeholder="admin@gandia.mx" autoFocus disabled={lockoutSeconds > 0}
                        onKeyDown={e => e.key === 'Enter' && handleCredentialsSubmit()}
                        className={`w-full pl-10 pr-4 py-3 rounded-xl border outline-none text-sm transition-colors disabled:opacity-50 ${inp}`} />
                    </div>
                  </div>
                  <div>
                    <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${sec}`}>Contraseña</label>
                    <PasswordInput value={credentials.password} onChange={v => setCredentials(p => ({ ...p, password: v }))}
                      placeholder="••••••••" onKeyDown={e => e.key === 'Enter' && handleCredentialsSubmit()}
                      className={`${inp} ${lockoutSeconds > 0 ? 'opacity-50' : ''}`} iconClass={iconCls} />
                  </div>
                  <label className="flex items-center gap-2.5 cursor-pointer select-none group">
                    <div onClick={() => setRememberMe(r => !r)} className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-all ${rememberMe ? 'bg-[#2FAF8F] border-[#2FAF8F]' : isDark ? 'border-[#3A3A3A] group-hover:border-[#2FAF8F]/60' : 'border-stone-300 group-hover:border-[#2FAF8F]/60'}`}>
                      {rememberMe && <CheckCircle className="w-3 h-3 text-white" strokeWidth={3} />}
                    </div>
                    <span className={`text-sm ${sec}`}>Recordar sesión por {CONFIG.REMEMBER_ME_DAYS} días</span>
                  </label>
                  {authError && !lockoutSeconds && <ErrorBanner message={authError} />}
                  <button onClick={handleCredentialsSubmit} disabled={isAuthLoading || !credentials.email || !credentials.password || lockoutSeconds > 0}
                    className="w-full h-12 bg-[#2FAF8F] text-white rounded-xl font-semibold text-sm hover:bg-[#278F75] disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
                    {isAuthLoading ? <><Loader2 className="w-4 h-4 animate-spin" />Verificando...</> : 'Continuar →'}
                  </button>
                </div>
              )}
              {authStep === 'master-key' && (
                <div className="space-y-4">
                  <VerifiedBadge label="Credenciales verificadas" sub={adminEmail} isDark={isDark} />
                  <div>
                    <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${sec}`}>Llave maestra</label>
                    <PasswordInput value={masterKey} onChange={v => setMasterKey(v)} placeholder="GANDIA-MASTER-****" autoFocus
                      onKeyDown={e => e.key === 'Enter' && handleMasterKeySubmit()}
                      className={inp} iconClass={iconCls} mono LeftIcon={Key} />
                  </div>
                  {authError && <ErrorBanner message={authError} />}
                  <div className="flex gap-3">
                    <button onClick={() => { setAuthStep('credentials'); setMasterKey(''); setAuthError('') }}
                      className={`px-4 h-12 rounded-xl border text-sm font-medium transition-colors ${isDark ? 'border-[#2A2A2A] hover:bg-[#1A1A1A] text-stone-300' : 'border-[#EAEAEA] hover:bg-stone-50 text-stone-700'}`}>← Atrás</button>
                    <button onClick={handleMasterKeySubmit} disabled={isAuthLoading || !masterKey}
                      className="flex-1 h-12 bg-[#2FAF8F] text-white rounded-xl font-semibold text-sm hover:bg-[#278F75] disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
                      {isAuthLoading ? <><Loader2 className="w-4 h-4 animate-spin" />Verificando...</> : 'Verificar →'}
                    </button>
                  </div>
                </div>
              )}
              {authStep === '2fa' && (
                <div className="space-y-4">
                  <VerifiedBadge label="Llave verificada — código enviado" sub={adminEmail} isDark={isDark} />
                  <div>
                    <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${sec}`}>Código de 6 dígitos</label>
                    <input type="text" value={twoFACode} onChange={e => setTwoFACode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="000000" autoFocus maxLength={6}
                      onKeyDown={e => e.key === 'Enter' && twoFACode.length === 6 && handle2FASubmit()}
                      className={`w-full px-4 py-4 rounded-xl border outline-none font-mono text-center text-3xl tracking-[0.6em] transition-colors ${inp}`} />
                    <p className={`mt-2 text-xs ${sec}`}>
                      Revisa tu correo electrónico — el código expira en 10 minutos.
                    </p>
                  </div>
                  {authError && <ErrorBanner message={authError} />}
                  <button onClick={handleResend2FA} disabled={resendCountdown > 0}
                    className={`w-full text-xs transition-colors ${sec} hover:text-[#2FAF8F] disabled:opacity-40`}>
                    {resendCountdown > 0 ? `Reenviar en ${resendCountdown}s` : 'Reenviar código'}
                  </button>
                  <div className="flex gap-3">
                    <button onClick={() => { setAuthStep('master-key'); setTwoFACode(''); setAuthError('') }}
                      className={`px-4 h-12 rounded-xl border text-sm font-medium transition-colors ${isDark ? 'border-[#2A2A2A] hover:bg-[#1A1A1A] text-stone-300' : 'border-[#EAEAEA] hover:bg-stone-50 text-stone-700'}`}>← Atrás</button>
                    <button onClick={handle2FASubmit} disabled={isAuthLoading || twoFACode.length !== 6}
                      className="flex-1 h-12 bg-[#2FAF8F] text-white rounded-xl font-semibold text-sm hover:bg-[#278F75] disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
                      {isAuthLoading ? <><Loader2 className="w-4 h-4 animate-spin" />Verificando...</> : 'Acceder →'}
                    </button>
                  </div>
                </div>
              )}
            </div>
            <button onClick={() => navigate('/home')} className={`w-full mt-4 h-11 border rounded-xl text-sm transition-colors ${isDark ? 'border-[#2A2A2A] hover:bg-[#1A1A1A]' : 'border-[#EAEAEA] hover:bg-[#F5F5F4]'}`}>
              ← Volver al inicio
            </button>
          </div>
        </div>
        <ToastContainer toasts={toasts} removeToast={removeToast} />
        <style>{`@keyframes slideIn{from{opacity:0;transform:translateX(100%)}to{opacity:1;transform:translateX(0)}}`}</style>
      </>
    )
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DASHBOARD
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <>
      <div className={`min-h-screen ${bg}`}>
        {/* Header */}
        <div className={`sticky top-0 z-50 border-b ${isDark ? 'bg-[#0c0a09]/95 backdrop-blur-xl border-[#2A2A2A]' : 'bg-white/95 backdrop-blur-xl border-[#EAEAEA]'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 bg-[#2FAF8F] rounded-xl flex items-center justify-center shadow-lg shadow-[#2FAF8F]/20 shrink-0">
                <Shield className="w-6 h-6 text-white" strokeWidth={1.5} />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg font-semibold leading-tight truncate">Panel de Administración</h1>
                <p className={`text-xs truncate ${sec}`}>
                  {adminEmail && <span className="hidden sm:inline">{adminEmail} · </span>}
                  {sessionInfo?.rememberMe ? <span className="text-[#2FAF8F]">● Sesión recordada</span> : 'Sesión temporal'}
                  {' · '}{stats.pending} pendiente{stats.pending !== 1 ? 's' : ''}
                  {lastRefresh && <span className="hidden sm:inline"> · actualizado {timeAgo(lastRefresh.toISOString())}</span>}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {/* Indicador de realtime activo */}
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium"
                style={{ borderColor: isDark ? '#2A2A2A' : '#EAEAEA' }}>
                <div className="w-1.5 h-1.5 rounded-full bg-[#2FAF8F] animate-pulse" />
                <span className={sec}>En vivo</span>
              </div>
              <button onClick={() => loadUsers()} title="Actualizar"
                className={`p-2.5 rounded-xl border transition-all hover:scale-105 ${isDark ? 'border-[#2A2A2A] hover:bg-[#1A1A1A]' : 'border-[#EAEAEA] hover:bg-stone-50'}`}>
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#2FAF8F]' : ''}`} strokeWidth={2} />
              </button>
              <button onClick={handleLogout}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl border text-sm transition-all hover:scale-105 ${isDark ? 'border-[#2A2A2A] hover:bg-red-950/30 hover:border-red-500/30 hover:text-red-400' : 'border-[#EAEAEA] hover:bg-red-50 hover:border-red-200 hover:text-red-600'}`}>
                <LogOut className="w-4 h-4" strokeWidth={2} />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

          {/* ── MAIN TABS ── */}
          <div className={`flex items-center gap-1 p-1 rounded-xl border mb-6 w-fit ${ isDark ? 'bg-[#121212] border-[#2A2A2A]' : 'bg-white border-[#EAEAEA]'}`}>
            {(['usuarios', 'creadores', 'aportes', 'moderadores'] as MainTab[]).map(t => {
              const labels: Record<MainTab, string> = { usuarios: 'Usuarios', creadores: 'Creadores', aportes: 'Aportes', moderadores: 'Moderadores' }
              const counts: Record<MainTab, number> = {
                usuarios: users.filter(u => u.status === 'pending').length,
                creadores: creators.filter(c => c.status === 'pendiente').length,
                aportes: submissions.filter(s => s.status === 'pendiente').length,
                moderadores: modApps.filter(m => m.status === 'pendiente').length,
              }
              return (
                <button key={t} onClick={() => setMainTab(t)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                    mainTab === t ? 'bg-[#2FAF8F] text-white shadow-md' : sec
                  }`}>
                  {labels[t]}
                  {counts[t] > 0 && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      mainTab === t ? 'bg-white/20 text-white' : 'bg-orange-500/15 text-orange-500'
                    }`}>
                      {counts[t]}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* ══ USUARIOS ══ */}
          {mainTab === 'usuarios' && (<>
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
            {[
              { label: 'Pendientes', value: stats.pending, fk: 'pending' as FilterType, icon: Clock, color: 'orange' },
              { label: 'Aprobadas', value: stats.approved, fk: 'approved' as FilterType, icon: CheckCircle, color: 'green' },
              { label: 'Rechazadas', value: stats.rejected, fk: 'rejected' as FilterType, icon: XCircle, color: 'red' },
            ].map(({ label, value, fk, icon: Icon, color }) => (
              <div key={label} onClick={() => setFilter(fk)}
                className={`p-5 sm:p-6 rounded-2xl border cursor-pointer transition-all hover:scale-[1.02] ${card} ${filter === fk ? 'ring-1 ring-[#2FAF8F]/40' : ''}`}>
                <div className="flex items-center justify-between">
                  <div><p className={`text-sm ${sec} mb-1`}>{label}</p><p className="text-3xl font-bold tabular-nums">{value}</p></div>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color === 'orange' ? 'bg-orange-500/10' : color === 'green' ? 'bg-[#2FAF8F]/10' : 'bg-red-500/10'}`}>
                    <Icon className={`w-6 h-6 ${color === 'orange' ? 'text-orange-500' : color === 'green' ? 'text-[#2FAF8F]' : 'text-red-500'}`} strokeWidth={1.5} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Search + Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <div className="flex-1 relative">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${sec}`} />
              <input id="search-input" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar nombre, email, estado, N° solicitud… (⌘K)"
                className={`w-full pl-10 pr-10 py-2.5 rounded-xl border text-sm outline-none transition-colors ${card} ${isDark ? 'focus:border-[#2FAF8F] placeholder:text-stone-600' : 'focus:border-[#2FAF8F] placeholder:text-stone-400'}`} />
              {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1"><CloseIcon className="w-3.5 h-3.5" strokeWidth={2} /></button>}
            </div>
            <div className={`flex p-1 rounded-xl border gap-1 ${isDark ? 'bg-[#121212] border-[#2A2A2A]' : 'bg-white border-[#EAEAEA]'}`}>
              {([
                { key: 'all', label: 'Todas', icon: Filter },
                { key: 'pending', label: 'Pendientes', icon: Clock },
                { key: 'approved', label: 'Aprobadas', icon: CheckCircle },
                { key: 'rejected', label: 'Rechazadas', icon: XCircle },
              ] as const).map(f => (
                <button key={f.key} onClick={() => setFilter(f.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all inline-flex items-center gap-1.5 ${filter === f.key ? 'bg-[#2FAF8F] text-white shadow-md' : sec}`}>
                  <f.icon className="w-3.5 h-3.5" strokeWidth={2} />
                  <span className="hidden sm:inline">{f.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* User list */}
          {isLoading ? <SkeletonLoader isDark={isDark} /> :
           filteredUsers.length === 0 ? (
            <div className={`py-20 rounded-2xl border text-center ${card}`}>
              <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${isDark ? 'bg-stone-800' : 'bg-stone-200'}`}>
                <Search className={`w-8 h-8 ${sec}`} />
              </div>
              <p className="font-semibold text-lg mb-1">Sin resultados</p>
              <p className={`text-sm ${sec}`}>{searchQuery ? 'Prueba otros términos' : 'No hay solicitudes aquí'}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredUsers.map(user => (
                <div key={user.id} className={`p-4 sm:p-5 rounded-2xl border transition-all hover:scale-[1.002] hover:shadow-xl ${card}`}>
                  <div className="flex items-start justify-between gap-3 sm:gap-4">
                    <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                      <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0 ${user.status === 'approved' ? 'bg-[#2FAF8F]/10' : user.status === 'rejected' ? 'bg-red-500/10' : 'bg-orange-500/10'}`}>
                        <User className={`w-5 h-5 ${user.status === 'approved' ? 'text-[#2FAF8F]' : user.status === 'rejected' ? 'text-red-500' : 'text-orange-500'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <h3 className="font-semibold truncate text-sm sm:text-base">{user.personal_data.fullName}</h3>
                          <StatusBadge status={user.status} />
                        </div>
                        <p className={`text-xs mb-2 ${sec}`}>
                          {ROLE_LABELS[user.personal_data.role]}
                          {user.account_id && <span className="font-mono"> · {user.account_id}</span>}
                        </p>
                        <div className="flex flex-wrap gap-x-3 sm:gap-x-4 gap-y-1 text-xs">
                          <span className={`flex items-center gap-1 ${sec}`}><Mail className="w-3 h-3" /><span className="truncate max-w-[140px]">{user.email}</span></span>
                          <span className={`flex items-center gap-1 ${sec} hidden sm:flex`}><Phone className="w-3 h-3" />{user.personal_data.phone}</span>
                          <span className={`flex items-center gap-1 ${sec}`}><MapPin className="w-3 h-3" />{user.personal_data.state}</span>
                          <span className={`flex items-center gap-1 ${sec}`}><Clock className="w-3 h-3" />{timeAgo(user.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                      <button onClick={() => setSelectedUser(user)} title="Ver detalle"
                        className={`p-2.5 rounded-xl border transition-all hover:scale-110 ${isDark ? 'border-[#2A2A2A] hover:bg-[#1A1A1A]' : 'border-[#EAEAEA] hover:bg-stone-50'}`}>
                        <Eye className="w-4 h-4" strokeWidth={2} />
                      </button>
                      {user.status === 'pending' && (
                        <>
                          <button onClick={() => handleApprove(user.id)} disabled={isActionLoading} title="Aprobar"
                            className="p-2.5 rounded-xl bg-[#2FAF8F]/10 text-[#2FAF8F] hover:bg-[#2FAF8F]/25 transition-all hover:scale-110 disabled:opacity-50">
                            <CheckCircle className="w-4 h-4" strokeWidth={2} />
                          </button>
                          <button onClick={() => setShowRejectionModal(user.id)} disabled={isActionLoading} title="Rechazar"
                            className="p-2.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/25 transition-all hover:scale-110 disabled:opacity-50">
                            <XCircle className="w-4 h-4" strokeWidth={2} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          </>)}

          {/* ══ CREADORES ══ */}
          {mainTab === 'creadores' && (
            <div>
              <div className={`flex p-1 rounded-xl border gap-1 mb-5 w-fit ${ isDark ? 'bg-[#121212] border-[#2A2A2A]' : 'bg-white border-[#EAEAEA]'}`}>
                {(['pendiente','activo','rechazado','todos'] as const).map(f => (
                  <button key={f} onClick={() => setCreatorFilter(f)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${
                      creatorFilter === f ? 'bg-[#2FAF8F] text-white shadow-md' : sec
                    }`}>
                    {f === 'todos' ? 'Todos' : f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
              {creatorsLoading ? <SkeletonLoader isDark={isDark} /> : (
                <div className="space-y-3">
                  {creators
                    .filter(c => creatorFilter === 'todos' || c.status === creatorFilter)
                    .map(c => (
                      <div key={c.id} className={`p-4 sm:p-5 rounded-2xl border transition-all hover:scale-[1.002] ${card}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                              c.status === 'activo' ? 'bg-[#2FAF8F]/10' : c.status === 'rechazado' ? 'bg-red-500/10' : 'bg-orange-500/10'
                            }`}>
                              <User className={`w-5 h-5 ${
                                c.status === 'activo' ? 'text-[#2FAF8F]' : c.status === 'rechazado' ? 'text-red-500' : 'text-orange-500'
                              }`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                <h3 className="font-semibold text-sm">{CREATOR_TYPE_LABELS[c.creator_type] ?? c.creator_type}</h3>
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                  c.status === 'activo' ? 'bg-[#2FAF8F]/15 text-[#2FAF8F]'
                                  : c.status === 'rechazado' ? 'bg-red-500/15 text-red-500'
                                  : 'bg-orange-500/15 text-orange-500'
                                }`}>{c.status}</span>
                              </div>
                              <p className={`text-xs mb-1 ${sec}`}>
                                {c.estado_mx ?? ''}{c.region ? ` · ${c.region}` : ''}
                              </p>
                              {c.especialidades && c.especialidades.length > 0 && (
                                <p className={`text-xs ${sec}`}>{c.especialidades.join(', ')}</p>
                              )}
                              {c.bio && <p className={`text-xs mt-1 italic ${sec}`}>{c.bio}</p>}
                              <p className={`text-xs mt-1 ${sec}`}><Clock className="w-3 h-3 inline mr-1" />{timeAgo(c.created_at)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button onClick={() => setSelectedCreator(c)} title="Ver"
                              className={`p-2.5 rounded-xl border transition-all hover:scale-110 ${ isDark ? 'border-[#2A2A2A] hover:bg-[#1A1A1A]' : 'border-[#EAEAEA] hover:bg-stone-50'}`}>
                              <Eye className="w-4 h-4" strokeWidth={2} />
                            </button>
                            {c.status === 'pendiente' && (
                              <>
                                <button onClick={() => handleApproveCreator(c.id)} disabled={isActionLoading}
                                  className="p-2.5 rounded-xl bg-[#2FAF8F]/10 text-[#2FAF8F] hover:bg-[#2FAF8F]/25 transition-all hover:scale-110 disabled:opacity-50">
                                  <CheckCircle className="w-4 h-4" strokeWidth={2} />
                                </button>
                                <button onClick={() => handleRejectCreator(c.id)} disabled={isActionLoading}
                                  className="p-2.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/25 transition-all hover:scale-110 disabled:opacity-50">
                                  <XCircle className="w-4 h-4" strokeWidth={2} />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  }
                  {creators.filter(c => creatorFilter === 'todos' || c.status === creatorFilter).length === 0 && (
                    <div className={`py-20 rounded-2xl border text-center ${card}`}>
                      <p className="font-semibold text-lg mb-1">Sin solicitudes</p>
                      <p className={`text-sm ${sec}`}>No hay solicitudes de creador en este estado</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ══ APORTES ══ */}
          {mainTab === 'aportes' && (
            <div>
              <div className={`flex p-1 rounded-xl border gap-1 mb-5 w-fit ${ isDark ? 'bg-[#121212] border-[#2A2A2A]' : 'bg-white border-[#EAEAEA]'}`}>
                {(['pendiente','publicado','rechazado','todos'] as const).map(f => (
                  <button key={f} onClick={() => setSubmissionFilter(f)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      submissionFilter === f ? 'bg-[#2FAF8F] text-white shadow-md' : sec
                    }`}>
                    {f === 'todos' ? 'Todos' : f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
              {submissionsLoading ? <SkeletonLoader isDark={isDark} /> : (
                <div className="space-y-3">
                  {submissions
                    .filter(s => submissionFilter === 'todos' || s.status === submissionFilter)
                    .map(s => (
                      <div key={s.id} className={`p-4 sm:p-5 rounded-2xl border transition-all hover:scale-[1.002] ${card}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                              s.status === 'publicado' ? 'bg-[#2FAF8F]/10' : s.status === 'rechazado' ? 'bg-red-500/10' : 'bg-orange-500/10'
                            }`}>
                              <FileText className={`w-5 h-5 ${
                                s.status === 'publicado' ? 'text-[#2FAF8F]' : s.status === 'rechazado' ? 'text-red-500' : 'text-orange-500'
                              }`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                <h3 className="font-semibold text-sm truncate max-w-[400px]">{s.titulo}</h3>
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                                  s.status === 'publicado' ? 'bg-[#2FAF8F]/15 text-[#2FAF8F]'
                                  : s.status === 'rechazado' ? 'bg-red-500/15 text-red-500'
                                  : 'bg-orange-500/15 text-orange-500'
                                }`}>{s.status}</span>
                              </div>
                              <p className={`text-xs mb-1 ${sec}`}>
                                {SUBMISSION_TYPE_LABELS[s.tipo] ?? s.tipo}
                                {s.estado_mx ? ` · ${s.estado_mx}` : ''}
                                {s.region ? ` · ${s.region}` : ''}
                              </p>
                              <p className={`text-xs ${sec} line-clamp-2`}>{s.contenido}</p>
                              <p className={`text-xs mt-1 ${sec}`}><Clock className="w-3 h-3 inline mr-1" />{timeAgo(s.created_at)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button onClick={() => setSelectedSubmission(s)} title="Ver"
                              className={`p-2.5 rounded-xl border transition-all hover:scale-110 ${ isDark ? 'border-[#2A2A2A] hover:bg-[#1A1A1A]' : 'border-[#EAEAEA] hover:bg-stone-50'}`}>
                              <Eye className="w-4 h-4" strokeWidth={2} />
                            </button>
                            {s.status === 'pendiente' && (
                              <>
                                <button onClick={() => handleApproveSubmission(s.id)} disabled={isActionLoading}
                                  className="p-2.5 rounded-xl bg-[#2FAF8F]/10 text-[#2FAF8F] hover:bg-[#2FAF8F]/25 transition-all hover:scale-110 disabled:opacity-50">
                                  <CheckCircle className="w-4 h-4" strokeWidth={2} />
                                </button>
                                <button onClick={() => handleRejectSubmission(s.id)} disabled={isActionLoading}
                                  className="p-2.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/25 transition-all hover:scale-110 disabled:opacity-50">
                                  <XCircle className="w-4 h-4" strokeWidth={2} />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  }
                  {submissions.filter(s => submissionFilter === 'todos' || s.status === submissionFilter).length === 0 && (
                    <div className={`py-20 rounded-2xl border text-center ${card}`}>
                      <p className="font-semibold text-lg mb-1">Sin aportes</p>
                      <p className={`text-sm ${sec}`}>No hay aportes en este estado</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ══ MODERADORES ══ */}
          {mainTab === 'moderadores' && (
            <div>
              {modAppsLoading ? <SkeletonLoader isDark={isDark} /> : (
                <div className="space-y-3">
                  {modApps.filter(m => m.status === 'pendiente').map(m => (
                    <div key={m.id} className={`p-4 sm:p-5 rounded-2xl border transition-all hover:scale-[1.002] ${card}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-[#2FAF8F]/10 flex items-center justify-center shrink-0">
                            <User className="w-5 h-5 text-[#2FAF8F]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-0.5">
                              <h3 className="font-semibold text-sm">{m.nombre}</h3>
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-500">{m.status}</span>
                            </div>
                            <p className={`text-xs mb-1 ${sec}`}>{CREATOR_TYPE_LABELS[m.tipo] ?? m.tipo} · {m.correo}</p>
                            {m.estado_mx && <p className={`text-xs ${sec}`}>{m.estado_mx}</p>}
                            {m.bio && <p className={`text-xs italic ${sec} line-clamp-2 mt-1`}>{m.bio}</p>}
                            <p className={`text-xs mt-1 ${sec}`}><Clock className="w-3 h-3 inline mr-1" />{timeAgo(m.created_at)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button onClick={() => handleApproveModApp(m)} disabled={isActionLoading}
                            className="p-2.5 rounded-xl bg-[#2FAF8F]/10 text-[#2FAF8F] hover:bg-[#2FAF8F]/25 transition-all hover:scale-110 disabled:opacity-50">
                            <CheckCircle className="w-4 h-4" strokeWidth={2} />
                          </button>
                          <button onClick={() => handleRejectModApp(m.id)} disabled={isActionLoading}
                            className="p-2.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/25 transition-all hover:scale-110 disabled:opacity-50">
                            <XCircle className="w-4 h-4" strokeWidth={2} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {modApps.filter(m => m.status === 'pendiente').length === 0 && (
                    <div className={`py-20 rounded-2xl border text-center ${card}`}>
                      <p className="font-semibold text-lg mb-1">Sin solicitudes pendientes</p>
                      <p className={`text-sm ${sec}`}>No hay nuevas solicitudes de moderador</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Modal detalle creador */}
      {selectedCreator && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4" onClick={() => setSelectedCreator(null)}>
          <div onClick={(e: React.MouseEvent) => e.stopPropagation()} className={`w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden flex flex-col ${ isDark ? 'bg-[#0c0a09] border-[#2A2A2A]' : 'bg-white border-stone-200'}`}>
            <div className={`px-6 py-5 border-b flex items-start justify-between ${ isDark ? 'border-[#2A2A2A]' : 'border-stone-200'}`}>
              <div>
                <h2 className="text-lg font-semibold mb-0.5">{CREATOR_TYPE_LABELS[selectedCreator.creator_type] ?? selectedCreator.creator_type}</h2>
                <p className={`text-sm ${sec}`}>{selectedCreator.estado_mx ?? ''}{selectedCreator.region ? ` · ${selectedCreator.region}` : ''}</p>
              </div>
              <button onClick={() => setSelectedCreator(null)} className={`p-2 rounded-xl ${ isDark ? 'hover:bg-[#1A1A1A]' : 'hover:bg-stone-100'}`}>
                <CloseIcon className="w-5 h-5" strokeWidth={2} />
              </button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto">
              {selectedCreator.bio && (
                <div><p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${sec}`}>Bio</p>
                <p className="text-sm">{selectedCreator.bio}</p></div>
              )}
              {selectedCreator.especialidades && selectedCreator.especialidades.length > 0 && (
                <div><p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${sec}`}>Especialidades</p>
                <div className="flex flex-wrap gap-1.5">{selectedCreator.especialidades.map(e => (
                  <span key={e} className={`text-xs px-2.5 py-1 rounded-full border ${ isDark ? 'border-[#2A2A2A]' : 'border-stone-200'}`}>{e}</span>
                ))}</div></div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div><p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${sec}`}>Trust Score</p><p className="text-lg font-bold">{selectedCreator.trust_score}</p></div>
                <div><p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${sec}`}>Nivel</p><p className="text-lg font-bold">{selectedCreator.nivel}</p></div>
              </div>
            </div>
            {selectedCreator.status === 'pendiente' && (
              <div className={`px-6 py-4 border-t flex gap-3 ${ isDark ? 'border-[#2A2A2A]' : 'border-stone-200'}`}>
                <button onClick={() => handleApproveCreator(selectedCreator.id)} disabled={isActionLoading}
                  className="flex-1 h-11 bg-[#2FAF8F] text-white rounded-xl font-semibold text-sm hover:bg-[#278F75] disabled:opacity-50 flex items-center justify-center gap-2">
                  {isActionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle className="w-4 h-4" />Aprobar</>}
                </button>
                <button onClick={() => handleRejectCreator(selectedCreator.id)} disabled={isActionLoading}
                  className="flex-1 h-11 bg-red-500 text-white rounded-xl font-semibold text-sm hover:bg-red-600 disabled:opacity-50 flex items-center justify-center gap-2">
                  <XCircle className="w-4 h-4" />Rechazar
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal detalle aporte */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4" onClick={() => setSelectedSubmission(null)}>
          <div onClick={(e: React.MouseEvent) => e.stopPropagation()} className={`w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden flex flex-col ${ isDark ? 'bg-[#0c0a09] border-[#2A2A2A]' : 'bg-white border-stone-200'}`}>
            <div className={`px-6 py-5 border-b flex items-start justify-between ${ isDark ? 'border-[#2A2A2A]' : 'border-stone-200'}`}>
              <div>
                <h2 className={`text-lg font-semibold mb-0.5 ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>{selectedSubmission.titulo}</h2>
                <p className={`text-sm ${sec}`}>{SUBMISSION_TYPE_LABELS[selectedSubmission.tipo] ?? selectedSubmission.tipo}{selectedSubmission.estado_mx ? ` · ${selectedSubmission.estado_mx}` : ''}</p>
              </div>
              <button onClick={() => setSelectedSubmission(null)} className={`p-2 rounded-xl ${ isDark ? 'hover:bg-[#1A1A1A]' : 'hover:bg-stone-100'}`}>
                <CloseIcon className={`w-5 h-5 ${isDark ? 'text-stone-400' : 'text-stone-600'}`} strokeWidth={2} />
              </button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
              <div><p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${sec}`}>Contenido</p>
              <p className={`text-sm leading-relaxed ${isDark ? 'text-stone-200' : 'text-stone-800'}`}>{selectedSubmission.contenido}</p></div>
              {selectedSubmission.source_links && selectedSubmission.source_links.length > 0 && (
                <div><p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${sec}`}>Fuentes</p>
                {selectedSubmission.source_links.map((l: string, i: number) => (
                  <a key={i} href={l} target="_blank" rel="noopener noreferrer"
                    className="block text-xs text-[#2FAF8F] hover:underline truncate mb-1">{l}</a>
                ))}</div>
              )}
              <div><p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${sec}`}>HTI Inicial</p><p className={`text-lg font-bold ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>{selectedSubmission.trust_index}</p></div>
            </div>
            {selectedSubmission.status === 'pendiente' && (
              <div className={`px-6 py-4 border-t flex gap-3 ${ isDark ? 'border-[#2A2A2A]' : 'border-stone-200'}`}>
                <button onClick={() => handleApproveSubmission(selectedSubmission.id)} disabled={isActionLoading}
                  className="flex-1 h-11 bg-[#2FAF8F] text-white rounded-xl font-semibold text-sm hover:bg-[#278F75] disabled:opacity-50 flex items-center justify-center gap-2">
                  {isActionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle className="w-4 h-4" />Publicar</>}
                </button>
                <button onClick={() => handleRejectSubmission(selectedSubmission.id)} disabled={isActionLoading}
                  className="flex-1 h-11 bg-red-500 text-white rounded-xl font-semibold text-sm hover:bg-red-600 disabled:opacity-50 flex items-center justify-center gap-2">
                  <XCircle className="w-4 h-4" />Rechazar
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: detalle usuario */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-[fadeIn_0.2s]" onClick={() => setSelectedUser(null)}>
          <div onClick={e => e.stopPropagation()} className={`w-full max-w-3xl max-h-[90vh] rounded-2xl border shadow-2xl overflow-hidden flex flex-col ${isDark ? 'bg-[#0c0a09] border-[#2A2A2A]' : 'bg-white border-stone-200'}`}>
            <div className={`px-6 py-5 border-b flex items-start justify-between ${isDark ? 'border-[#2A2A2A]' : 'border-stone-200'}`}>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap mb-1">
                  <h2 className={`text-xl font-semibold ${isDark ? 'text-stone-50' : 'text-stone-900'}`}>{selectedUser.personal_data.fullName}</h2>
                  <StatusBadge status={selectedUser.status} />
                </div>
                <p className={`text-sm ${sec}`}>{ROLE_LABELS[selectedUser.personal_data.role]} · {selectedUser.email}</p>
                {selectedUser.account_id && (
                  <p className={`text-xs font-mono mt-1 font-semibold ${isDark ? 'text-[#2FAF8F]' : 'text-[#2FAF8F]'}`}>
                    N° Solicitud: {selectedUser.account_id}
                  </p>
                )}
              </div>
              <button onClick={() => setSelectedUser(null)} className={`p-2 rounded-xl shrink-0 ${isDark ? 'hover:bg-[#1A1A1A]' : 'hover:bg-stone-100'}`}>
                <CloseIcon className={`w-5 h-5 ${isDark ? 'text-stone-400' : 'text-stone-600'}`} strokeWidth={2} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6" style={{ scrollbarWidth: 'thin', scrollbarColor: isDark ? '#3A3A3A #1A1A1A' : '#D4D4D4 #F5F5F4' }}>
              <div>
                <h3 className={`text-sm font-semibold flex items-center gap-2 mb-3 ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>
                  <div className="w-7 h-7 rounded-lg bg-[#2FAF8F]/10 flex items-center justify-center"><User className="w-4 h-4 text-[#2FAF8F]" strokeWidth={2} /></div>
                  Información Personal
                </h3>
                <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#1A1A1A] border-[#2A2A2A]' : 'bg-stone-50 border-stone-200'}`}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {Object.entries(selectedUser.personal_data).map(([k, v]) => (
                      <div key={k}>
                        <p className={`text-[10px] font-semibold uppercase tracking-wider mb-1 ${sec}`}>{FIELD_LABELS[k] || k}</p>
                        <p className={`text-sm font-medium ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>{k === 'role' ? ROLE_LABELS[v] || v : v || '—'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <h3 className={`text-sm font-semibold flex items-center gap-2 mb-3 ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>
                  <div className="w-7 h-7 rounded-lg bg-[#2FAF8F]/10 flex items-center justify-center"><FileText className="w-4 h-4 text-[#2FAF8F]" strokeWidth={2} /></div>
                  Información Institucional
                </h3>
                <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#1A1A1A] border-[#2A2A2A]' : 'bg-stone-50 border-stone-200'}`}>
                  <div className="space-y-3">
                    {Object.entries(selectedUser.institutional_data).map(([k, v]) => (
                      <div key={k} className={`pb-3 border-b last:border-0 last:pb-0 ${isDark ? 'border-[#2A2A2A]' : 'border-stone-200'}`}>
                        <p className={`text-[10px] font-semibold uppercase tracking-wider mb-1 ${sec}`}>{k}</p>
                        <p className={`text-sm font-medium ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>{v}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {selectedUser.status === 'rejected' && selectedUser.rejection_reason && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                  <p className="text-xs font-semibold text-red-500 uppercase tracking-wider mb-1">Motivo de rechazo</p>
                  <p className="text-sm text-red-400">{selectedUser.rejection_reason}</p>
                </div>
              )}
            </div>
            {selectedUser.status === 'pending' && (
              <div className={`px-6 py-4 border-t ${isDark ? 'border-[#2A2A2A]' : 'border-stone-200'}`}>
                <div className="flex gap-3">
                  <button onClick={() => handleApprove(selectedUser.id)} disabled={isActionLoading}
                    className="flex-1 h-12 bg-[#2FAF8F] text-white rounded-xl font-semibold text-sm hover:bg-[#278F75] disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
                    {isActionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle className="w-5 h-5" />Aprobar</>}
                  </button>
                  <button onClick={() => { setShowRejectionModal(selectedUser.id); setSelectedUser(null) }} disabled={isActionLoading}
                    className="flex-1 h-12 bg-red-500 text-white rounded-xl font-semibold text-sm hover:bg-red-600 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
                    <XCircle className="w-5 h-5" />Rechazar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: rechazo */}
      {showRejectionModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[101] flex items-center justify-center p-6 animate-[fadeIn_0.2s]" onClick={() => { setShowRejectionModal(null); setRejectionReason('') }}>
          <div onClick={e => e.stopPropagation()} className={`w-full max-w-md rounded-2xl border shadow-2xl p-6 ${isDark ? 'bg-[#0c0a09] border-[#2A2A2A]' : 'bg-white border-stone-200'}`}>
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0"><XCircle className="w-6 h-6 text-red-500" strokeWidth={2} /></div>
              <div><h3 className="text-lg font-semibold mb-0.5">Rechazar solicitud</h3><p className={`text-sm ${sec}`}>Esta acción no se puede deshacer</p></div>
            </div>
            <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${sec}`}>Motivo (opcional)</label>
            <textarea value={rejectionReason} onChange={e => setRejectionReason(e.target.value)}
              placeholder="Ej. Documentación incompleta..." rows={3}
              className={`w-full px-4 py-3 rounded-xl border text-sm outline-none resize-none mb-5 transition-colors ${isDark ? 'bg-[#1A1A1A] border-[#2A2A2A] focus:border-red-500 text-stone-200 placeholder:text-stone-600' : 'bg-white border-[#EAEAEA] focus:border-red-500 text-stone-900 placeholder:text-stone-400'}`} />
            <div className="flex gap-3">
              <button onClick={() => { setShowRejectionModal(null); setRejectionReason('') }}
                className={`flex-1 h-11 rounded-xl border text-sm font-medium transition-colors ${isDark ? 'border-[#2A2A2A] hover:bg-[#1A1A1A] text-stone-300' : 'border-stone-200 hover:bg-stone-50 text-stone-900'}`}>Cancelar</button>
              <button onClick={() => handleReject(showRejectionModal!, rejectionReason || undefined)} disabled={isActionLoading}
                className="flex-1 h-11 bg-red-500 text-white rounded-xl font-semibold text-sm hover:bg-red-600 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
                {isActionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar rechazo'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <style>{`
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes slideIn{from{opacity:0;transform:translateX(100%)}to{opacity:1;transform:translateX(0)}}
      `}</style>
    </>
  )
}

export default AdminPanel