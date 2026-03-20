// src/context/UserContext.tsx  (React Native / Expo)
// Basado en la versión web — reemplaza:
//   localStorage          → AsyncStorage
//   applyPreferencesToDOM → no-op (no hay DOM)
//   import.meta.env       → process.env (EXPO_PUBLIC_)
//   getInitialAuthStatus síncrono → empieza en 'loading' (AsyncStorage es async)

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react'
import type { ReactNode } from 'react'
import React from 'react'
import type { UserProfile, UserRole } from '../lib/authService'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { supabase } from '../lib/supabaseClient'

// ─── TIPOS (idénticos a la web) ───────────────────────────────────────────────

export interface AppPreferences {
  theme: 'dark' | 'light'
  font:  'geist' | 'serif' | 'lora'
}

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

const DEFAULT_PREFERENCES: AppPreferences = { theme: 'dark', font: 'geist' }

// ─── CONTEXT ──────────────────────────────────────────────────────────────────

interface UserContextValue {
  profile:         UserProfile | null
  role:            UserRole | null
  preferences:     AppPreferences
  authStatus:      AuthStatus
  isLoading:       boolean
  isAuthenticated: boolean
  hasProfile:      boolean
  profileReady:    boolean
  refreshProfile:  () => Promise<void>
  clearProfile:    () => void
}

const UserContext = createContext<UserContextValue>({
  profile:         null,
  role:            null,
  authStatus:      'loading',
  isLoading:       true,
  isAuthenticated: false,
  hasProfile:      false,
  profileReady:    false,
  preferences:     DEFAULT_PREFERENCES,
  refreshProfile:  async () => {},
  clearProfile:    () => {},
})

// ─── HELPER — fetchProfile (igual que la web pero con AsyncStorage) ────────────

async function fetchProfile(uid: string): Promise<UserProfile | null> {
  try {
    const rawSession = await AsyncStorage.getItem('gandia-auth-token')
    if (!rawSession) return null
    const session = JSON.parse(rawSession)
    const accessToken = session.access_token
    if (!accessToken) return null

    const supabaseUrl  = process.env.EXPO_PUBLIC_SUPABASE_URL!
    const supabaseAnon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

    const res = await fetch(`${supabaseUrl}/rest/v1/user_profiles?user_id=eq.${uid}`, {
      method: 'GET',
      headers: {
        'apikey':        supabaseAnon,
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type':  'application/json',
      },
    })

    if (!res.ok) return null
    const data = await res.json()
    return data && data.length > 0 ? (data[0] as UserProfile) : null
  } catch {
    return null
  }
}

// ─── PROVIDER ─────────────────────────────────────────────────────────────────

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [profile,      setProfile]      = useState<UserProfile | null>(null)
  const [preferences,  setPrefs]        = useState<AppPreferences>(DEFAULT_PREFERENCES)
  const [hasProfile,   setHasProfile]   = useState(false)
  const [profileReady, setProfileReady] = useState(false)
  // En mobile siempre arranca en 'loading' porque AsyncStorage es async
  const [authStatus,   setAuthStatus]   = useState<AuthStatus>('loading')

  const isLoading       = authStatus === 'loading'
  const isAuthenticated = authStatus === 'authenticated'

  // ── Setters ───────────────────────────────────────────────────────────────

  const applyProfile = useCallback((p: UserProfile | null, sessionActive: boolean) => {
    setProfile(p)
    setHasProfile(!!p)
    setAuthStatus(sessionActive ? 'authenticated' : 'unauthenticated')
    setProfileReady(true)
    const prefs: AppPreferences = {
      theme: p?.preferences?.theme ?? DEFAULT_PREFERENCES.theme,
      font:  p?.preferences?.font  ?? DEFAULT_PREFERENCES.font,
    }
    setPrefs(prefs)
    // En mobile no hay DOM — las preferencias se leen en los componentes via useUser()
  }, [])

  const clearProfile = useCallback(() => {
    setProfile(null)
    setHasProfile(false)
    setAuthStatus('unauthenticated')
    setProfileReady(true)
    setPrefs(DEFAULT_PREFERENCES)
  }, [])

  const refreshProfile = useCallback(async () => {
    setProfileReady(false)
    const rawSession = await AsyncStorage.getItem('gandia-auth-token')
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

    // Paso 1: resolver sesión desde AsyncStorage al arrancar
    const bootstrap = async () => {
      try {
        const rawSession = await AsyncStorage.getItem('gandia-auth-token')
        if (!rawSession) {
          if (!cancelled) clearProfile()
          return
        }
        const session = JSON.parse(rawSession)
        if (!session?.user?.id) {
          if (!cancelled) clearProfile()
          return
        }
        const p = await fetchProfile(session.user.id)
        if (!cancelled) applyProfile(p, true)
      } catch {
        if (!cancelled) clearProfile()
      }
    }

    bootstrap()

    // Paso 2: cambios futuros de sesión (SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[UserContext]', event)
        if (event === 'INITIAL_SESSION') return // ya manejado en bootstrap

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session?.user?.id) {
            applyProfile(await fetchProfile(session.user.id), true)
          }
          return
        }
        if (event === 'SIGNED_OUT') clearProfile()
      }
    )

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [applyProfile, clearProfile])

  return (
    <UserContext.Provider value={{
      profile,
      role:         profile?.role ?? null,
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

export const useUser = () => {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUser debe usarse dentro de <UserProvider>')
  return ctx
}

export default UserContext