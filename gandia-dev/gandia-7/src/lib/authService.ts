/**
 * GANDIA — Auth Service
 * Capa de autenticación y gestión de perfiles sobre Supabase Auth.
 */

import { supabase } from './supabaseClient'
import type { User, AuthChangeEvent, Session, Provider } from '@supabase/supabase-js'

// ─────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────

export interface VerificationResult {
  success: boolean
  code?: 'expired' | 'invalid' | 'already_used' | 'not_found'
  message?: string
  user?: User | null
}

export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue }
export type JsonRecord = Record<string, JsonValue>

// ── CAMBIO 1: Se agrega `role` como campo requerido ──────────────────────────
export type UserRole = 'producer' | 'mvz' | 'union' | 'exporter' | 'auditor'

export interface UserProfilePayload {
  user_id?: string
  auth_method: string
  email: string
  role: UserRole                  // ← NUEVO
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

// Tipo de retorno tipado para getCurrentProfile
export interface UserProfile {
  id: string
  user_id: string
  email: string
  auth_method: string
  role: UserRole | null           // ← NUEVO
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
// CONSTANTES
// ─────────────────────────────────────────────

const OTP_EXPIRY_MINUTES = 10
const SIMULATED_CODE_LENGTH = 6

// ─────────────────────────────────────────────
// HELPERS INTERNOS
// ─────────────────────────────────────────────

const generateNumericCode = (length = SIMULATED_CODE_LENGTH): string =>
  Array.from({ length }, () => Math.floor(Math.random() * 10)).join('')

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

// ─────────────────────────────────────────────
// 1. OAUTH
// ─────────────────────────────────────────────

export const signInWithOAuth = async (
  provider: 'google' | 'apple' | 'azure'
): Promise<void> => {
  const supabaseProvider = provider === 'azure' ? 'azure' : provider

  const { error } = await supabase.auth.signInWithOAuth({
    provider: supabaseProvider as Provider,
    options: {
      redirectTo: `${window.location.origin}/signup/personal`,
      queryParams:
        provider === 'google'
          ? { access_type: 'offline', prompt: 'consent' }
          : undefined,
    },
  })

  if (error) {
    throw new Error(parseSupabaseError(error))
  }
}

// ─────────────────────────────────────────────
// 2. REGISTRO CON EMAIL + CONTRASEÑA
// ─────────────────────────────────────────────

export const registerUser = async (
  email: string,
  password: string
): Promise<{ userId: string; email: string }> => {
  const normalizedEmail = normalizeEmail(email)

  const { data, error } = await supabase.auth.signUp({
    email: normalizedEmail,
    password,
    options: {
      emailRedirectTo: undefined,
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
    email: data.user.email ?? normalizedEmail,
  }
}

// ─────────────────────────────────────────────
// 3. VERIFICACIÓN OTP POR EMAIL
// ─────────────────────────────────────────────

export const sendVerificationCode = async (email: string): Promise<void> => {
  const normalizedEmail = normalizeEmail(email)

  const { error } = await supabase.auth.signInWithOtp({
    email: normalizedEmail,
    options: {
      shouldCreateUser: false,
    },
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
    return {
      success: false,
      code: 'invalid',
      message: 'El código debe ser de 6 dígitos numéricos.',
    }
  }

  const { data, error } = await supabase.auth.verifyOtp({
    email: normalizedEmail,
    token: cleanToken,
    type: 'email',
  })

  if (error) {
    const msg = error.message ?? ''

    if (
      msg.toLowerCase().includes('expired') ||
      msg.toLowerCase().includes('invalid') ||
      msg.toLowerCase().includes('token')
    ) {
      return {
        success: false,
        code: 'expired',
        message: 'El código ha expirado o es inválido. Solicita uno nuevo.',
      }
    }

    return {
      success: false,
      code: 'invalid',
      message: parseSupabaseError(error),
    }
  }

  return {
    success: true,
    user: data.user,
  }
}

// ─────────────────────────────────────────────
// 4. VERIFICACIÓN DE TELÉFONO (SIMULADA)
// ─────────────────────────────────────────────

export const sendPhoneVerificationCode = async (phone: string): Promise<void> => {
  const normalizedPhone = normalizePhone(phone)
  const code = generateNumericCode()
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000).toISOString()

  await supabase
    .from('verification_codes')
    .update({ used: true })
    .eq('phone', normalizedPhone)
    .eq('used', false)

  const { error } = await supabase
    .from('verification_codes')
    .insert([
      {
        phone: normalizedPhone,
        code,
        type: 'sms',
        expires_at: expiresAt,
        used: false,
      },
    ])

  if (error) {
    throw new Error(`Error al generar código de verificación: ${parseSupabaseError(error)}`)
  }

  console.info(
    `%c[GANDIA SMS SIMULADO] Código para ${normalizedPhone}: ${code}`,
    'background:#2FAF8F;color:white;padding:4px 8px;border-radius:4px;font-weight:bold'
  )
}

export const verifyPhoneCode = async (
  phone: string,
  token: string
): Promise<VerificationResult> => {
  const normalizedPhone = normalizePhone(phone)
  const cleanToken = token.trim()

  if (!/^\d{6}$/.test(cleanToken)) {
    return {
      success: false,
      code: 'invalid',
      message: 'El código debe ser de 6 dígitos.',
    }
  }

  const { data, error } = await supabase
    .from('verification_codes')
    .select('id, code, expires_at, used')
    .eq('phone', normalizedPhone)
    .eq('type', 'sms')
    .eq('used', false)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) {
    return {
      success: false,
      code: 'not_found',
      message: 'No se encontró un código activo. Solicita uno nuevo.',
    }
  }

  if (new Date(data.expires_at) < new Date()) {
    return {
      success: false,
      code: 'expired',
      message: 'El código ha expirado. Solicita uno nuevo.',
    }
  }

  if (data.code !== cleanToken) {
    return {
      success: false,
      code: 'invalid',
      message: 'Código incorrecto. Verifica e intenta de nuevo.',
    }
  }

  await supabase
    .from('verification_codes')
    .update({ used: true })
    .eq('id', data.id)

  return { success: true }
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

/**
 * Crea el perfil del usuario en user_profiles.
 * El account_id es generado automáticamente por el trigger del servidor.
 * Retorna el account_id generado por Supabase.
 */

// Envuelve cualquier promesa con un timeout para que NUNCA cuelgue indefinidamente
function withTimeout<T>(thenable: PromiseLike<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    Promise.resolve(thenable),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout (${ms}ms) en: ${label}`)), ms)
    ),
  ])
}

export const createUserProfile = async (
  payload: UserProfilePayload
): Promise<string> => {

  // ── 1. Obtener UID del usuario ────────────────────────────────────────────
  // Prioridad: payload.user_id (ya resuelto en SignUpConfirmation) > getSession > getUser
  let resolvedUserId = payload.user_id || ''
  let sessionEmail   = ''

  if (!resolvedUserId) {
    // getSession() lee de caché/localStorage
    const { data: { session } } = await withTimeout(supabase.auth.getSession(), 6000, 'getSession')
    if (session?.user) {
      resolvedUserId = session.user.id
      sessionEmail   = session.user.email ?? ''
    }
  }

  if (!resolvedUserId) {
    // getUser() hace llamada directa a la API — más confiable con múltiples instancias
    const { data: { user } } = await withTimeout(supabase.auth.getUser(), 8000, 'getUser')
    if (user) {
      resolvedUserId = user.id
      sessionEmail   = user.email ?? ''
    }
  }

  if (!resolvedUserId) {
    // Último recurso: userId guardado en localStorage
    resolvedUserId = typeof window !== 'undefined'
      ? localStorage.getItem('signup-user-id') ?? ''
      : ''
  }

  if (!resolvedUserId) {
    throw new Error('No se pudo obtener la sesión activa. Recarga la página e intenta de nuevo.')
  }

  const normalizedEmail = normalizeEmail(payload.email || sessionEmail || '')
  if (!normalizedEmail) {
    throw new Error('No se pudo determinar el correo del usuario.')
  }

  // ── 2. Verificar si ya existe (para reintentos seguros) ──────────────────
  const dupResult = await withTimeout(
    Promise.resolve(
      supabase.from('user_profiles').select('account_id').eq('email', normalizedEmail).maybeSingle()
    ),
    8000,
    'checkDuplicate'
  )
  const dupCheck = (dupResult as { data: { account_id: string } | null }).data

  if (dupCheck) {
      return dupCheck.account_id || ''
  }

  // ── 3. INSERT ─────────────────────────────────────────────────────────
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
      user_agent: navigator.userAgent,
      signup_completed_at: new Date().toISOString(),
    },
  }

  const insertResult = await withTimeout(
    Promise.resolve(supabase.from('user_profiles').insert([profileRow])),
    10000,
    'INSERT user_profiles'
  )
  const insertError = (insertResult as { error: { code: string; message: string } | null }).error


  if (insertError) {
    if (insertError.code === '23505') {
      const dup = await supabase.from('user_profiles').select('account_id').eq('email', normalizedEmail).maybeSingle()
      return (dup.data as { account_id: string } | null)?.account_id || ''
    }
    if (insertError.code === '42501') {
      throw new Error('Sin permisos para crear el perfil (RLS). Recarga la página y vuelve a intentar.')
    }
    throw new Error(`Error al guardar el perfil: ${parseSupabaseError(insertError)}`)
  }

  // ── 5. Leer account_id generado por trigger ───────────────────────────────
  await new Promise(resolve => setTimeout(resolve, 500))

  const selectResult = await withTimeout(
    Promise.resolve(
      supabase.from('user_profiles').select('account_id').eq('email', normalizedEmail).maybeSingle()
    ),
    8000,
    'SELECT account_id'
  )
  const created = (selectResult as { data: { account_id: string } | null }).data

  return created?.account_id || ''
}

// ─────────────────────────────────────────────
// 6. SESIÓN Y UTILIDADES
// ─────────────────────────────────────────────

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return user
}

// ── CAMBIO 3: getCurrentProfile retorna UserProfile tipado con role ──────────
export const getCurrentProfile = async (): Promise<UserProfile | null> => {
  // Usar getSession() en lugar de getUser() — lee de localStorage, no hace HTTP
  const { data: { session } } = await supabase.auth.getSession()
  const uid = session?.user?.id
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

  ;[
    'signup-auth-method',
    'signup-email',
    'signup-personal-data',
    'signup-institutional-data',
  ].forEach((key) => localStorage.removeItem(key))
}

export const onAuthStateChange = (
  callback: (event: AuthChangeEvent, session: Session | null) => void
): (() => void) => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(callback)
  return () => subscription.unsubscribe()
}