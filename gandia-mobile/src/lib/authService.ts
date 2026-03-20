/**
 * GANDIA — Auth Service (React Native / Expo)
 * Capa de autenticación y gestión de perfiles sobre Supabase Auth.
 * Basado en la versión web — reemplaza:
 *   localStorage     → AsyncStorage
 *   import.meta.env  → process.env (EXPO_PUBLIC_)
 *   window.location  → Linking de Expo
 *   navigator.userAgent → Platform info
 */

import { supabase } from './supabaseClient'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Platform } from 'react-native'
import * as Linking from 'expo-linking'
import * as WebBrowser from 'expo-web-browser'
import Constants from 'expo-constants'
import type { User, AuthChangeEvent, Session, Provider } from '@supabase/supabase-js'

// ─────────────────────────────────────────────
// TIPOS (idénticos a la web)
// ─────────────────────────────────────────────

export interface VerificationResult {
  success: boolean
  code?: 'expired' | 'invalid' | 'already_used' | 'not_found'
  message?: string
  user?: User | null
}

export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue }
export type JsonRecord = Record<string, JsonValue>

export type UserRole = 'producer' | 'mvz' | 'union' | 'exporter' | 'auditor'

export interface UserProfilePayload {
  user_id?: string
  auth_method: string
  email: string
  role: UserRole
  personal_data: JsonRecord
  institutional_data: JsonRecord
  terms_accepted: {
    terms: boolean
    privacy: boolean
    notice: boolean
    accepted_at: string
  }
  notifications_preferences: {
    alerts: boolean
    newsletter: boolean
  }
  status?: 'pending' | 'approved' | 'rejected'
  metadata?: JsonRecord
}

export interface UserProfile {
  id: string
  user_id: string
  email: string
  auth_method: string
  role: UserRole | null
  personal_data: JsonRecord
  institutional_data: JsonRecord
  terms_accepted: JsonRecord
  notifications_preferences: JsonRecord
  status: 'pending' | 'approved' | 'rejected'
  account_id: string | null
  metadata: JsonRecord | null
  created_at: string
  updated_at: string
  approved_at: string | null
  approved_by: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  rejection_reason: string | null
  onboarding_completed: boolean
  preferences: {
    theme: 'dark' | 'light'
    font:  'geist' | 'serif' | 'lora'
  } | null
}

// ─────────────────────────────────────────────
// HELPERS INTERNOS
// ─────────────────────────────────────────────

const normalizePhone = (phone: string): string => {
  const cleaned = phone.replace(/[\s\-()]/g, '')
  return cleaned.startsWith('+') ? cleaned : `+52${cleaned}`
}

const normalizeEmail = (email: string): string =>
  email.trim().toLowerCase()

const parseSupabaseError = (error: { message?: string; error_description?: string } | null | unknown): string => {
  if (!error) return 'Error desconocido'

  const err = error as { message?: string; error_description?: string }
  const msg: string = err.message || err.error_description || JSON.stringify(error)

  const map: Record<string, string> = {
    'User already registered': 'Ya existe una cuenta con este correo electrónico.',
    'Invalid login credentials': 'Correo o contraseña incorrectos.',
    'Email not confirmed': 'Debes confirmar tu correo antes de continuar.',
    'Password should be at least 6 characters': 'La contraseña debe tener al menos 8 caracteres.',
    'Unable to validate email address': 'El correo electrónico no es válido.',
    'For security purposes, you can only request this after': 'Espera un momento antes de solicitar otro código.',
    'Token has expired or is invalid': 'El código ha expirado o es inválido.',
    'Email rate limit exceeded': 'Demasiados intentos. Espera unos minutos.',
    'Database error saving new user': 'Error al guardar el usuario. Contacta a soporte.',
    'duplicate key value violates unique constraint': 'Ya existe un perfil con este correo.',
  }

  for (const [key, value] of Object.entries(map)) {
    if (msg.includes(key)) return value
  }

  return msg
}

// ─── Leer sesión de AsyncStorage (equivalente al localStorage de la web) ───────
async function getSessionUserIdFromStorage(): Promise<{ userId: string; email: string } | null> {
  try {
    const raw = await AsyncStorage.getItem('gandia-auth-token')
    if (!raw) return null
    const parsed = JSON.parse(raw)
    const userId = parsed?.user?.id
    const email  = parsed?.user?.email || ''
    if (userId) return { userId, email }
  } catch { /* ignore */ }
  return null
}

async function getSessionSafe(timeoutMs = 3000): Promise<{ userId: string; email: string } | null> {
  // 1. Primero AsyncStorage (instantáneo, nunca cuelga)
  const fromStorage = await getSessionUserIdFromStorage()
  if (fromStorage) return fromStorage

  // 2. Fallback: SDK con timeout
  try {
    const sessionPromise = supabase.auth.getSession()
    const timeoutPromise = new Promise<null>(resolve => setTimeout(() => resolve(null), timeoutMs))
    const result = await Promise.race([sessionPromise, timeoutPromise])
    if (result && 'data' in result && result.data.session?.user) {
      return {
        userId: result.data.session.user.id,
        email:  result.data.session.user.email || '',
      }
    }
  } catch { /* ignore */ }
  return null
}

// ─────────────────────────────────────────────
// 1. OAUTH — usa expo-web-browser en lugar de redirect web
// ─────────────────────────────────────────────

export const signInWithOAuth = async (
  provider: 'google' | 'apple' | 'azure',
  onSuccess?: () => void
): Promise<void> => {
  const redirectTo = 'gandia-mobile://signup/personal'

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: provider as Provider,
    options: {
      redirectTo,
      skipBrowserRedirect: true,
      queryParams:
        provider === 'google'
          ? { access_type: 'offline', prompt: 'consent' }
          : undefined,
    },
  })

  if (error || !data?.url) throw new Error(parseSupabaseError(error))

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo)
  if (result.type !== 'success' || !result.url) return

  const { error: sessionError } = await supabase.auth.exchangeCodeForSession(result.url)
  if (sessionError) throw new Error(parseSupabaseError(sessionError))

  onSuccess?.()
}

// ─────────────────────────────────────────────
// 2. REGISTRO CON EMAIL + CONTRASEÑA
// ─────────────────────────────────────────────

export const registerUser = async (
  email: string,
  password: string
): Promise<{ userId: string; email: string }> => {
  const normalizedEmail = normalizeEmail(email)

  // En mobile el emailRedirectTo apunta al deep link de la app
  const redirectUrl = Linking.createURL('/signup/personal')

  const { data, error } = await supabase.auth.signUp({
    email: normalizedEmail,
    password,
    options: {
      emailRedirectTo: redirectUrl,
    },
  })

  if (error) {
    throw new Error(parseSupabaseError(error))
  }

  if (!data.user) {
    throw new Error('No se pudo crear el usuario. Intenta de nuevo.')
  }

  return {
    userId: data.user.id,
    email:  data.user.email ?? normalizedEmail,
  }
}

// ─────────────────────────────────────────────
// 3. VERIFICACIÓN OTP POR EMAIL
// ─────────────────────────────────────────────

export const sendVerificationCode = async (email: string): Promise<void> => {
  const normalizedEmail = normalizeEmail(email)

  const { error } = await supabase.auth.signInWithOtp({
    email: normalizedEmail,
    options: { shouldCreateUser: false },
  })

  if (error) {
    throw new Error(parseSupabaseError(error))
  }
}

export const verifyCode = async (
  email: string,
  token: string
): Promise<VerificationResult> => {
  const normalizedEmail = normalizeEmail(email)
  const cleanToken = token.trim()

  if (!/^\d{6}$/.test(cleanToken)) {
    return { success: false, code: 'invalid', message: 'El código debe ser de 6 dígitos numéricos.' }
  }

  const { data, error } = await supabase.auth.verifyOtp({
    email: normalizedEmail,
    token: cleanToken,
    type: 'email',
  })

  if (error) {
    const msg = error.message ?? ''
    if (msg.toLowerCase().includes('expired') || msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('token')) {
      return { success: false, code: 'expired', message: 'El código ha expirado o es inválido. Solicita uno nuevo.' }
    }
    return { success: false, code: 'invalid', message: parseSupabaseError(error) }
  }

  return { success: true, user: data.user }
}

// ─────────────────────────────────────────────
// 4. VERIFICACIÓN DE TELÉFONO (Twilio vía Supabase)
// ─────────────────────────────────────────────

export const sendPhoneVerificationCode = async (phone: string): Promise<void> => {
  const normalizedPhone = normalizePhone(phone)

  const { error } = await supabase.auth.signInWithOtp({ phone: normalizedPhone })

  if (error) {
    throw new Error(parseSupabaseError(error))
  }
}

export const verifyPhoneCode = async (
  phone: string,
  token: string
): Promise<VerificationResult> => {
  const normalizedPhone = normalizePhone(phone)
  const cleanToken = token.trim()

  if (!/^\d{6}$/.test(cleanToken)) {
    return { success: false, code: 'invalid', message: 'El código debe ser de 6 dígitos.' }
  }

  const { data, error } = await supabase.auth.verifyOtp({
    phone: normalizedPhone,
    token: cleanToken,
    type: 'sms',
  })

  if (error) {
    const msg = error.message ?? ''
    if (msg.toLowerCase().includes('expired') || msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('token')) {
      return { success: false, code: 'expired', message: 'El código ha expirado o es inválido. Solicita uno nuevo.' }
    }
    return { success: false, code: 'invalid', message: parseSupabaseError(error) }
  }

  return { success: true, user: data.user }
}

// ─────────────────────────────────────────────
// 5. PERFIL DE USUARIO
// ─────────────────────────────────────────────

export const checkProfileExists = async (email: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('email', normalizeEmail(email))
    .limit(1)
    .maybeSingle()

  if (error) return false
  return !!data
}

export const createUserProfile = async (
  payload: UserProfilePayload
): Promise<string> => {

  console.log('[createUserProfile] ▶ INICIO')

  // ── 1. Resolver userId y email desde AsyncStorage ─────────────────────────
  let resolvedUserId = payload.user_id || ''
  let resolvedEmail  = payload.email   || ''

  // Leer de gandia-auth-token almacenado por Supabase en AsyncStorage
  try {
    const raw = await AsyncStorage.getItem('gandia-auth-token')
    if (raw) {
      const parsed = JSON.parse(raw)
      if (!resolvedUserId) resolvedUserId = parsed?.user?.id    || ''
      if (!resolvedEmail)  resolvedEmail  = parsed?.user?.email || ''
    }
  } catch { /* ignore */ }

  if (!resolvedUserId) resolvedUserId = await AsyncStorage.getItem('signup-user-id') ?? ''
  if (!resolvedEmail)  resolvedEmail  = await AsyncStorage.getItem('signup-email')   ?? ''

  if (!resolvedUserId) throw new Error('No se pudo obtener la sesión activa. Reinicia el registro.')
  const normalizedEmail = normalizeEmail(resolvedEmail)
  if (!normalizedEmail) throw new Error('No se pudo determinar el correo del usuario.')

  console.log('[createUserProfile] userId:', resolvedUserId, 'email:', normalizedEmail)

  // ── Obtener access_token para fetch directo ───────────────────────────────
  let accessToken = ''
  try {
    const raw = await AsyncStorage.getItem('gandia-auth-token')
    if (raw) accessToken = JSON.parse(raw)?.access_token || ''
  } catch { /* ignore */ }

  const supabaseUrl  = process.env.EXPO_PUBLIC_SUPABASE_URL!
  const supabaseAnon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
  const restUrl      = `${supabaseUrl}/rest/v1/user_profiles`

  const headers: Record<string, string> = {
    'Content-Type':  'application/json',
    'apikey':        supabaseAnon,
    'Authorization': `Bearer ${accessToken || supabaseAnon}`,
    'Prefer':        'return=minimal',
  }

  // ── 2. Verificar si ya existe (reintentos seguros) ────────────────────────
  try {
    console.log('[createUserProfile] 2. checkDuplicate...')
    const checkResp = await fetch(
      `${restUrl}?email=eq.${encodeURIComponent(normalizedEmail)}&select=account_id`,
      { method: 'GET', headers }
    )
    const checkData = await checkResp.json()
    console.log('[createUserProfile] 2. checkDuplicate result:', checkData)
    if (Array.isArray(checkData) && checkData.length > 0 && checkData[0].account_id) {
      console.log('[createUserProfile] ✓ Ya existe, account_id:', checkData[0].account_id)
      return checkData[0].account_id
    }
  } catch (e) {
    console.warn('[createUserProfile] 2. checkDuplicate falló:', e)
  }

  // ── 3. INSERT ──────────────────────────────────────────────────────────────
  const profileRow = {
    user_id:                    resolvedUserId,
    email:                      normalizedEmail,
    auth_method:                payload.auth_method,
    role:                       payload.role,
    personal_data:              payload.personal_data,
    institutional_data:         payload.institutional_data,
    terms_accepted:             payload.terms_accepted,
    notifications_preferences:  payload.notifications_preferences,
    status:                     payload.status ?? 'pending',
    onboarding_completed:       false,
    metadata: {
      ...(payload.metadata ?? {}),
      platform:            Platform.OS,
      platform_version:    Platform.Version,
      signup_completed_at: new Date().toISOString(),
    },
  }

  console.log('[createUserProfile] 3. INSERT...', JSON.stringify(profileRow).slice(0, 200))

  const insertResp = await fetch(restUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(profileRow),
  })

  console.log('[createUserProfile] 3. INSERT status:', insertResp.status, insertResp.statusText)

  if (!insertResp.ok) {
    const errBody = await insertResp.text()
    console.error('[createUserProfile] 3. INSERT error body:', errBody)

    if (insertResp.status === 409 || errBody.includes('23505')) {
      try {
        const dupResp = await fetch(
          `${restUrl}?email=eq.${encodeURIComponent(normalizedEmail)}&select=account_id`,
          { method: 'GET', headers }
        )
        const dupData = await dupResp.json()
        return Array.isArray(dupData) && dupData[0]?.account_id ? dupData[0].account_id : ''
      } catch { return '' }
    }

    if (insertResp.status === 403 || errBody.includes('42501')) {
      throw new Error('Sin permisos para crear el perfil (RLS). Reinicia el registro.')
    }

    throw new Error(`Error al guardar el perfil (${insertResp.status}): ${errBody.slice(0, 200)}`)
  }

  console.log('[createUserProfile] ✓ INSERT exitoso')

  // ── 4. Leer account_id generado por trigger ────────────────────────────────
  try {
    await new Promise(resolve => setTimeout(resolve, 500))
    console.log('[createUserProfile] 4. SELECT account_id...')
    const selectResp = await fetch(
      `${restUrl}?email=eq.${encodeURIComponent(normalizedEmail)}&select=account_id`,
      { method: 'GET', headers }
    )
    const selectData = await selectResp.json()
    console.log('[createUserProfile] 4. account_id:', selectData)
    return Array.isArray(selectData) && selectData[0]?.account_id ? selectData[0].account_id : ''
  } catch {
    console.warn('[createUserProfile] 4. No se pudo obtener account_id')
    return ''
  }
}

// ─────────────────────────────────────────────
// 6. SESIÓN Y UTILIDADES
// ─────────────────────────────────────────────

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return user
}

export const getCurrentProfile = async (): Promise<UserProfile | null> => {
  const safe = await getSessionSafe()
  const uid = safe?.userId
  if (!uid) return null

  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', uid)
    .maybeSingle()

  if (error || !data) return null
  return data as UserProfile
}

export const signOut = async (): Promise<void> => {
  const { error } = await supabase.auth.signOut()
  if (error) throw new Error(parseSupabaseError(error))

  await Promise.all([
    AsyncStorage.removeItem('signup-auth-method'),
    AsyncStorage.removeItem('signup-email'),
    AsyncStorage.removeItem('signup-personal-data'),
    AsyncStorage.removeItem('signup-institutional-data'),
    AsyncStorage.removeItem('signup-user-id'),
  ])
}

export const onAuthStateChange = (
  callback: (event: AuthChangeEvent, session: Session | null) => void
): (() => void) => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(callback)
  return () => subscription.unsubscribe()
}