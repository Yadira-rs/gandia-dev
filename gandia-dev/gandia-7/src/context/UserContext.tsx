/**
 * GANDIA — UserContext
 */
import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import type { UserProfile, UserRole } from '../lib/authService'
import { supabase } from '../lib/supabaseClient'

// ─── TIPOS ────────────────────────────────────────────────────────────────────

export interface AppPreferences {
  theme: 'dark' | 'light'
  font:  'geist' | 'serif' | 'lora'
}

const FONT_FAMILIES: Record<AppPreferences['font'], string> = {
  geist: "'Geist', system-ui, sans-serif",
  serif: "'Instrument Serif', Georgia, serif",
  lora:  "'Lora', Georgia, serif",
}

const DEFAULT_PREFERENCES: AppPreferences = { theme: 'dark', font: 'geist' }

// ─── APPLY TO DOM ─────────────────────────────────────────────────────────────

function applyPreferencesToDOM(prefs: AppPreferences) {
  document.documentElement.classList.toggle('dark', prefs.theme === 'dark')
  document.documentElement.style.setProperty('--font-app', FONT_FAMILIES[prefs.font])
  localStorage.setItem('gandia-theme', prefs.theme)
  localStorage.setItem('gandia-font',  prefs.font)
}

// ─── CONTEXT ──────────────────────────────────────────────────────────────────

interface UserContextValue {
  profile:         UserProfile | null
  role:            UserRole | null
  preferences:     AppPreferences
  isLoading:       boolean
  isAuthenticated: boolean  // true si hay sesión Supabase activa (con o sin perfil en DB)
  hasProfile:      boolean  // true solo si el perfil ya fue creado en user_profiles
  refreshProfile:  () => Promise<void>
  clearProfile:    () => void
}

const UserContext = createContext<UserContextValue>({
  profile: null, role: null, isLoading: true, isAuthenticated: false, hasProfile: false,
  preferences: DEFAULT_PREFERENCES,
  refreshProfile: async () => {}, clearProfile: () => {},
})

async function fetchProfile(uid: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('user_profiles').select('*').eq('user_id', uid).maybeSingle()
  if (error || !data) return null
  return data as UserProfile
}

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [profile,     setProfile]  = useState<UserProfile | null>(null)
  const [preferences, setPrefs]    = useState<AppPreferences>(DEFAULT_PREFERENCES)
  const [isLoading,   setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuth] = useState(false) // sesión activa
  const [hasProfile,  setHasProfile] = useState(false)  // perfil en DB

  const applyProfile = useCallback((p: UserProfile | null, sessionActive = true) => {
    setProfile(p)
    setIsAuth(sessionActive)       // autenticado = hay sesión, independiente del perfil
    setHasProfile(!!p)             // perfil = existe registro en user_profiles
    setIsLoading(false)

    const prefs: AppPreferences = {
      theme: p?.preferences?.theme ?? DEFAULT_PREFERENCES.theme,
      font:  p?.preferences?.font  ?? DEFAULT_PREFERENCES.font,
    }
    setPrefs(prefs)
    applyPreferencesToDOM(prefs)
  }, [])

  const clearProfile = useCallback(() => {
    setProfile(null); setIsAuth(false); setHasProfile(false); setIsLoading(false)
    setPrefs(DEFAULT_PREFERENCES)
  }, [])

  const refreshProfile = useCallback(async () => {
    setIsLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user?.id) { clearProfile(); return }
    // Sesión existe aunque el perfil en DB aún no
    applyProfile(await fetchProfile(session.user.id), true)
  }, [applyProfile, clearProfile])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.id) {
        fetchProfile(session.user.id).then(p => applyProfile(p, true))
      } else {
        clearProfile()
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[UserContext]', event)
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.user?.id) applyProfile(await fetchProfile(session.user.id), true)
      }
      if (event === 'SIGNED_OUT') clearProfile()
    })

    return () => subscription.unsubscribe()
  }, [applyProfile, clearProfile])

  return (
    <UserContext.Provider value={{
      profile, role: profile?.role ?? null,
      preferences, isLoading, isAuthenticated, hasProfile,
      refreshProfile, clearProfile,
    }}>
      {children}
    </UserContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useUser = () => {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUser debe usarse dentro de <UserProvider>')
  return ctx
}

export default UserContext