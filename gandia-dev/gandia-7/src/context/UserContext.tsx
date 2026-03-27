/* eslint-disable react-hooks/set-state-in-effect */
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react'
import type { ReactNode } from 'react'
import type { UserProfile, UserRole } from '../lib/authService'
import { supabase } from '../lib/supabaseClient'

// ─── TIPOS ────────────────────────────────────────────────────────────────────

export interface AppPreferences {
  theme: 'dark' | 'light'
  font: 'geist' | 'serif' | 'lora'
}

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

const FONT_FAMILIES: Record<AppPreferences['font'], string> = {
  geist: "'Geist', system-ui, sans-serif",
  serif: "'Instrument Serif', Georgia, serif",
  lora: "'Lora', Georgia, serif",
}

const DEFAULT_PREFERENCES: AppPreferences = { theme: 'dark', font: 'geist' }

// ─── Lee localStorage síncronamente para no arrancar en 'loading' ─────────────
function getInitialAuthStatus(): AuthStatus {
  try {
    const raw = localStorage.getItem('gandia-auth-token')
    if (!raw) return 'unauthenticated'
    const parsed = JSON.parse(raw)
    // Si el token expiró, Supabase lo renovará con el refresh_token — igual hay sesión.
    // Solo devolvemos unauthenticated si no hay access_token en absoluto.
    return parsed?.access_token ? 'authenticated' : 'unauthenticated'
  } catch {
    return 'unauthenticated'
  }
}

// ─── DOM ──────────────────────────────────────────────────────────────────────

function applyPreferencesToDOM(prefs: AppPreferences) {
  // Respetar 'auto' — si el usuario lo eligió, no sobreescribir con el valor resuelto
  const current = localStorage.getItem('gandia-theme')
  if (current !== 'auto') {
    document.documentElement.classList.toggle('dark', prefs.theme === 'dark')
    localStorage.setItem('gandia-theme', prefs.theme)
  }
  document.documentElement.style.setProperty('--font-app', FONT_FAMILIES[prefs.font])
  localStorage.setItem('gandia-font', prefs.font)
}

// ─── CONTEXT ──────────────────────────────────────────────────────────────────

interface UserContextValue {
  profile: UserProfile | null
  role: UserRole | null
  preferences: AppPreferences
  authStatus: AuthStatus
  isLoading: boolean
  isAuthenticated: boolean
  hasProfile: boolean
  profileReady: boolean   // ← TRUE cuando fetchProfile terminó (con o sin resultado)
  refreshProfile: () => Promise<void>
  clearProfile: () => void
}

const UserContext = createContext<UserContextValue>({
  profile: null,
  role: null,
  authStatus: 'loading',
  isLoading: true,
  isAuthenticated: false,
  hasProfile: false,
  profileReady: false,
  preferences: DEFAULT_PREFERENCES,
  refreshProfile: async () => { },
  clearProfile: () => { },
})

// ─── HELPER ───────────────────────────────────────────────────────────────────

async function fetchProfile(uid: string): Promise<UserProfile | null> {
  try {
    const rawSession = localStorage.getItem('gandia-auth-token')
    if (!rawSession) return null
    const session = JSON.parse(rawSession)
    const accessToken = session.access_token

    if (!accessToken) return null

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY

    const res = await fetch(`${supabaseUrl}/rest/v1/user_profiles?user_id=eq.${uid}`, {
      method: 'GET',
      headers: {
        'apikey': supabaseAnon,
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (!res.ok) return null
    const data = await res.json()
    return data && data.length > 0 ? (data[0] as UserProfile) : null
  } catch {
    // Fallback offline: si falla la red, intentar cargar contexto mínimo guardado
    try {
      const raw = localStorage.getItem('gandia-campo-context')
      if (raw) {
        const ctx = JSON.parse(raw)
        return {
          user_id: uid,
          role: 'producer',
          status: 'approved',
          onboarding_completed: true,
          personal_data: { nombre: ctx.operadorNombre, fullName: ctx.operadorNombre },
          institutional_data: { rancho: ctx.ranchoNombre, ranchName: ctx.ranchoNombre, rancho_id: ctx.ranchoId, ranchId: ctx.ranchoId },
          preferences: { theme: 'dark', font: 'geist' }
        } as unknown as UserProfile
      }
    } catch { /* ignore */ }
    return null
  }
}

// ─── PROVIDER ─────────────────────────────────────────────────────────────────

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [preferences, setPrefs] = useState<AppPreferences>(DEFAULT_PREFERENCES)
  const [hasProfile, setHasProfile] = useState(false)
  const [profileReady, setProfileReady] = useState(false)  // ← nuevo flag
  const [authStatus, setAuthStatus] = useState<AuthStatus>(getInitialAuthStatus)

  const isLoading = authStatus === 'loading'
  const isAuthenticated = authStatus === 'authenticated'

  // ── Setters ───────────────────────────────────────────────────────────────

  const applyProfile = useCallback((p: UserProfile | null, sessionActive: boolean) => {
    setProfile(p)
    setHasProfile(!!p)
    setAuthStatus(sessionActive ? 'authenticated' : 'unauthenticated')
    setProfileReady(true)   // ← perfil resuelto (con o sin datos)
    const prefs: AppPreferences = {
      theme: p?.preferences?.theme ?? DEFAULT_PREFERENCES.theme,
      font: p?.preferences?.font ?? DEFAULT_PREFERENCES.font,
    }
    setPrefs(prefs)
    applyPreferencesToDOM(prefs)

    // Persistir contexto para uso offline en Campo
    if (p) {
      const pd_ = (p.personal_data as Record<string, string> | null) ?? {}
      const id__ = (p.institutional_data as Record<string, string> | null) ?? {}
      const offlineCtx = {
        userId: (p as unknown as Record<string, string>).user_id ?? '',
        ranchoId: id__.ranchId ?? id__.rancho_id ?? '',
        ranchoNombre: id__.ranchName ?? id__.rancho ?? '',
        operadorNombre: pd_.fullName ?? pd_.nombre ?? '',
      }
      try { localStorage.setItem('gandia-campo-context', JSON.stringify(offlineCtx)) } catch { /* quota */ }
    }
  }, [])

  const clearProfile = useCallback(() => {
    setProfile(null)
    setHasProfile(false)
    setAuthStatus('unauthenticated')
    setProfileReady(true)   // ← también resuelto: sabemos que no hay sesión
    setPrefs(DEFAULT_PREFERENCES)
    applyPreferencesToDOM(DEFAULT_PREFERENCES)
  }, [])

  const refreshProfile = useCallback(async () => {
    setProfileReady(false)
    const rawSession = localStorage.getItem('gandia-auth-token')
    if (!rawSession) { clearProfile(); return }
    try {
      const session = JSON.parse(rawSession)
      if (!session?.user?.id) { clearProfile(); return }
      applyProfile(await fetchProfile(session.user.id), true)
    } catch {
      clearProfile()
    }
  }, [applyProfile, clearProfile])

  // ── Auth listener ─────────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false

    // Paso 1: resolver sesión y cargar perfil desde localStorage
    const rawSession = localStorage.getItem('gandia-auth-token')
    if (rawSession) {
      try {
        const session = JSON.parse(rawSession)
        if (session?.user?.id) {
          fetchProfile(session.user.id).then(p => {
            if (cancelled) return
            applyProfile(p, true)
          }).catch(() => {
            if (!cancelled) clearProfile()
          })
        } else {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          if (!cancelled) clearProfile()
        }
      } catch {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (!cancelled) clearProfile()
      }
    } else {
      clearProfile()
    }

    // Paso 2: cambios futuros de sesión (mantenemos events del onAuthStateChange como fallback)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[UserContext]', event)
        if (event === 'INITIAL_SESSION') return 

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session?.user?.id) {
            applyProfile(await fetchProfile(session.user.id), true)
          }
          return
        }
        
        // NO limpiar sesión si estamos offline
        if (event === 'SIGNED_OUT' && navigator.onLine) {
          clearProfile()
        }
      }
    )

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [applyProfile, clearProfile])

  // ─── Escuchar cambios del sistema OS cuando tema es 'auto' ───────────────────
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => {
      const savedTheme = localStorage.getItem('gandia-theme')
      if (!savedTheme || savedTheme === 'auto') {
        if (e.matches) {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
      }
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  return (
    <UserContext.Provider value={{
      profile,
      role: profile?.role ?? null,
      preferences,
      authStatus,
      isLoading,
      isAuthenticated,
      hasProfile,
      profileReady,
      refreshProfile,
      clearProfile,
    }}>
      {children}
    </UserContext.Provider>
  )
}

// ─── HOOK ─────────────────────────────────────────────────────────────────────

// eslint-disable-next-line react-refresh/only-export-components
export const useUser = () => {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUser debe usarse dentro de <UserProvider>')
  return ctx
}

export default UserContext