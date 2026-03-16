import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useUser } from '../../context/UserContext'
import type { AppPreferences } from '../../context/UserContext'

// ─── TYPES ────────────────────────────────────────────────────────────────────
type Section = 'profile' | 'notifications' | 'appearance' | 'security' | 'assistant' | 'accessibility'

interface NotifPrefs {
  alerts:        boolean
  newsletter:    boolean
  auditorias:    boolean
  certificaciones: boolean
  sistema:       boolean
  menciones:     boolean
  push:          boolean
  email:         boolean
  sms:           boolean
  dnd_from:      string
  dnd_to:        string
}

interface MetaData {
  theme:        'light' | 'dark' | 'auto'
  language:     'es' | 'en'
  dateFormat:   'DD/MM/YYYY' | 'MM/DD/YYYY'
  units:        'metric' | 'imperial'
  assistant:    {
    detailLevel: 'concise' | 'balanced' | 'detailed'
    tone:        'professional' | 'casual'
    suggestions: boolean
    reminders:   boolean
    history:     boolean
  }
  accessibility: {
    fontSizeIdx:     number
    highContrast:    boolean
    reduceMotion:    boolean
    keyboardShortcuts: boolean
    voiceNav:        boolean
  }
}

const DEFAULT_NOTIF: NotifPrefs = {
  alerts: true, newsletter: false, auditorias: true,
  certificaciones: true, sistema: false, menciones: true,
  push: true, email: true, sms: false,
  dnd_from: '22:00', dnd_to: '07:00',
}

const DEFAULT_META: MetaData = {
  theme: 'auto', language: 'es', dateFormat: 'DD/MM/YYYY', units: 'metric',
  assistant: { detailLevel: 'balanced', tone: 'professional', suggestions: true, reminders: true, history: true },
  accessibility: { fontSizeIdx: 2, highContrast: false, reduceMotion: false, keyboardShortcuts: true, voiceNav: false },
}

// ─── SECTIONS NAV ─────────────────────────────────────────────────────────────
const SECTIONS: { id: Section; label: string; desc: string; icon: React.ReactNode }[] = [
  { id: 'profile',       label: 'Perfil',         desc: 'Información personal',
    icon: <svg className="w-[15px] h-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
  { id: 'notifications', label: 'Notificaciones', desc: 'Canales y eventos',
    icon: <svg className="w-[15px] h-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg> },
  { id: 'appearance',    label: 'Apariencia',     desc: 'Tema y visualización',
    icon: <svg className="w-[15px] h-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg> },
  { id: 'security',      label: 'Seguridad',      desc: 'Contraseña y sesiones',
    icon: <svg className="w-[15px] h-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> },
  { id: 'assistant',     label: 'Asistente IA',   desc: 'Comportamiento y datos',
    icon: <svg className="w-[15px] h-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg> },
  { id: 'accessibility', label: 'Accesibilidad',  desc: 'Texto y navegación',
    icon: <svg className="w-[15px] h-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg> },
]

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function Configuraciones() {
  const { profile, refreshProfile } = useUser()
  const [active,     setActive]     = useState<Section>('profile')
  const [loading,    setLoading]    = useState(true)
  const [hasChanges, setHasChanges] = useState(false)
  const [saving,     setSaving]     = useState(false)
  const [saved,      setSaved]      = useState(false)
  const [error,      setError]      = useState('')

  // ── Profile state ──
  const [fullName,  setFullName]  = useState('')
  const [email,     setEmail]     = useState('')
  const [phone,     setPhone]     = useState('')
  const [role,      setRole]      = useState('—')
  const [avatarLetter, setAvatarLetter] = useState('?')

  // ── Notifications state ──
  const [notif, setNotif] = useState<NotifPrefs>(DEFAULT_NOTIF)

  // ── Meta state (appearance + assistant + accessibility) ──
  const [meta, setMeta] = useState<MetaData>(DEFAULT_META)

  // ── Auth method state ──
  const [authMethod, setAuthMethod] = useState<string>('')

  // ── Password state ──
  const [pwCurrent,  setPwCurrent]  = useState('')
  const [pwNew,      setPwNew]      = useState('')
  const [pwConfirm,  setPwConfirm]  = useState('')
  const [pwError,    setPwError]    = useState('')
  const [pwSuccess,  setPwSuccess]  = useState('')
  const [pwSaving,   setPwSaving]   = useState(false)

  // ── Font preference ──
  const [font, setFontState] = useState<AppPreferences['font']>('geist')

  // ── Session state ──
  const [sessionInfo, setSessionInfo] = useState<{ browser: string; os: string; since: string } | null>(null)

  // ── Seed font from UserContext when profile loads ─────────────────────────
  useEffect(() => {
    const savedFont = (profile?.preferences as AppPreferences | null)?.font
    if (savedFont) setFontState(savedFont)
  }, [profile])

  // ─── LOAD DATA ────────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        console.log('🔐 session:', session?.user?.id, sessionError)

        const authUser = session?.user
        if (!authUser) {
          console.warn('No hay sesión activa')
          setLoading(false)
          return
        }

        // Auth method — leer de user_profiles y de identities de Supabase
        const { data: upAuth } = await supabase
          .from('user_profiles')
          .select('auth_method')
          .eq('user_id', authUser.id)
          .maybeSingle()
        const method = upAuth?.auth_method || authUser.app_metadata?.provider || 'email'
        setAuthMethod(method)

        // Session info — browser detection in correct precedence order
        const ua = navigator.userAgent
        const browser =
          ua.includes('Edg/')       ? 'Edge'    :
          ua.includes('OPR/')       ? 'Opera'   :
          ua.includes('Brave')      ? 'Brave'   :
          ua.includes('YaBrowser')  ? 'Yandex'  :
          ua.includes('SamsungBrowser') ? 'Samsung Browser' :
          ua.includes('Firefox')    ? 'Firefox' :
          ua.includes('Chrome/')    ? 'Chrome'  :
          ua.includes('Safari/')    ? 'Safari'  : 'Navegador'

        const os =
          /iPhone|iPad|iPod/.test(ua)            ? 'iOS'     :
          ua.includes('Android')                  ? 'Android' :
          ua.includes('Win')                      ? 'Windows' :
          ua.includes('Mac')                      ? 'macOS'   :
          ua.includes('Linux')                    ? 'Linux'   : ''

        setSessionInfo({
          browser,
          os,
          since: new Date(authUser.last_sign_in_at ?? '').toLocaleDateString('es-MX', {
            day: 'numeric', month: 'short', year: 'numeric',
          }),
        })

        // 1. Buscar en user_profiles (user_id = auth.uid) — tabla principal
        const { data: userProfile } = await supabase
          .from('user_profiles')
          .select('personal_data, institutional_data, notifications_preferences, metadata, email')
          .eq('user_id', authUser.id)
          .maybeSingle()

        // 2. Si no está en user_profiles, buscar en profiles (id = auth.uid)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let profile: Record<string, any> | null = userProfile

        if (!userProfile) {
          const { data: p } = await supabase
            .from('profiles')
            .select('full_name, email, personal_data, institutional_data, notifications_preferences, metadata')
            .eq('id', authUser.id)
            .maybeSingle()
          profile = p
        }

        console.log('👤 profile encontrado:', JSON.stringify(profile, null, 2))

        const pd  = (profile?.personal_data  as Record<string, string> | null) ?? {}
        const id_ = (profile?.institutional_data as Record<string, string> | null) ?? {}

        console.log('📦 personal_data:', JSON.stringify(pd, null, 2))
        console.log('🏢 institutional_data:', JSON.stringify(id_, null, 2))

        // Mapa de códigos de rol a nombres legibles (igual que en SignUpPersonal)
        const roleNames: Record<string, string> = {
          producer: 'Productor Ganadero',
          mvz:      'Médico Veterinario Zootecnista',
          union:    'Unión Ganadera',
          exporter: 'Exportador',
          auditor:  'Auditor / Inspector',
        }

        const name  = profile?.full_name || pd.full_name || pd.nombre || (authUser.user_metadata?.full_name as string) || authUser.email?.split('@')[0] || ''
        const mail  = profile?.email || authUser.email || ''

        // phone está en personal_data.phone (guardado por SignUpPersonal)
        const tel   = pd.phone || pd.telefono || pd.tel || ''

        // role está en personal_data.role (guardado por SignUpPersonal como 'producer', 'mvz', etc.)
        // también puede estar en institutional_data para otros casos
        const roleCode = pd.role || id_.role || id_.rol || id_.cargo || (authUser.user_metadata?.role as string) || ''
        const rol = roleNames[roleCode] || roleCode || '—'

        setFullName(name)
        setEmail(mail)
        setPhone(tel)
        setRole(rol)
        setAvatarLetter((name || mail).charAt(0).toUpperCase() || '?')

        // Notifications
        const np = profile?.notifications_preferences as Partial<NotifPrefs> | null
        if (np) {
          const merged = { ...DEFAULT_NOTIF, ...np }
          setNotif(merged)
          localStorage.setItem('gandia-notif-prefs', JSON.stringify(merged))
        }

        // Metadata
        const mt = profile?.metadata as Partial<MetaData> | null
        if (mt) {
          const merged = {
            theme:         mt.theme         ?? DEFAULT_META.theme,
            language:      mt.language      ?? DEFAULT_META.language,
            dateFormat:    mt.dateFormat    ?? DEFAULT_META.dateFormat,
            units:         mt.units         ?? DEFAULT_META.units,
            assistant:     { ...DEFAULT_META.assistant,     ...(mt.assistant     ?? {}) },
            accessibility: { ...DEFAULT_META.accessibility, ...(mt.accessibility ?? {}) },
          }
          setMeta(merged)
          applyTheme(merged.theme)
          applyAccessibility({ ...DEFAULT_META.accessibility, ...(mt.accessibility ?? {}) })
          // Persistir prefs del asistente para useChat
          localStorage.setItem('gandia-assistant-prefs', JSON.stringify(merged.assistant))
        }

        // Preferencias de onboarding (font)
        const savedFont = (profile?.preferences as AppPreferences | null)?.font
        if (savedFont) setFontState(savedFont)
      } catch (e) {
        console.error('❌ Error en Configuraciones load:', e)
        setError('No se pudo cargar la configuración')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  // ─── THEME APPLY ──────────────────────────────────────────────────────────
  const applyTheme = (t: 'light' | 'dark' | 'auto') => {
    localStorage.setItem('gandia-theme', t)
    const root = document.documentElement
    const isDark =
      t === 'dark' ? true :
      t === 'light' ? false :
      window.matchMedia('(prefers-color-scheme: dark)').matches
    if (isDark) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }

  // ─── Escuchar cambios del sistema cuando tema es 'auto' ─────────────────────
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => {
      if (meta.theme === 'auto') {
        if (e.matches) {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
      }
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [meta.theme])

  // ─── FONT APPLY ───────────────────────────────────────────────────────────
  const FONT_FAMILIES: Record<AppPreferences['font'], string> = {
    geist: "'Geist', system-ui, sans-serif",
    serif: "'Instrument Serif', Georgia, serif",
    lora:  "'Lora', Georgia, serif",
  }

  const applyFont = (f: AppPreferences['font']) => {
    document.documentElement.style.setProperty('--font-app', FONT_FAMILIES[f])
    localStorage.setItem('gandia-font', f)
  }

  const setFont = (f: AppPreferences['font']) => {
    setFontState(f); applyFont(f); mark()
  }

  // ─── ACCESSIBILITY APPLY ─────────────────────────────────────────────────
  const FONT_SIZES = [12, 14, 16, 18, 20]
  const applyAccessibility = (a: MetaData['accessibility']) => {
    const root = document.documentElement
    // Font size → CSS var usada por la app
    root.style.setProperty('--font-size-base', `${FONT_SIZES[a.fontSizeIdx ?? 2]}px`)
    // High contrast → clase en <html>
    root.classList.toggle('high-contrast', !!a.highContrast)
    // Reduce motion → clase en <html>
    root.classList.toggle('reduce-motion', !!a.reduceMotion)
    localStorage.setItem('gandia-accessibility', JSON.stringify(a))
  }

  // ─── MARK CHANGES ─────────────────────────────────────────────────────────
  const mark = useCallback(() => { setHasChanges(true); setSaved(false) }, [])

  // ─── SAVE ALL ─────────────────────────────────────────────────────────────
  const save = async () => {
    if (saving) return
    setSaving(true)
    setError('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) throw new Error('Sin sesión')

      // Leer personal_data actual para no perder otros campos
      const { data: currentUp } = await supabase
        .from('user_profiles')
        .select('personal_data')
        .eq('user_id', session.user.id)
        .maybeSingle()

      const currentPd = (currentUp?.personal_data as Record<string, string> | null) ?? {}

      // Intentar actualizar user_profiles primero
      const { data: updatedProfiles, error: upErr1 } = await supabase
        .from('user_profiles')
        .update({
          personal_data:             { ...currentPd, phone },
          notifications_preferences: notif,
          metadata:                  meta,
          preferences:               { theme: meta.theme === 'auto' ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : meta.theme, font },
        })
        .eq('user_id', session.user.id)
        .select('user_id')

      // Si no había fila en user_profiles, actualizar profiles
      let upErr = upErr1
      if (!upErr1 && (!updatedProfiles || updatedProfiles.length === 0)) {
        const { data: currentP } = await supabase
          .from('profiles')
          .select('personal_data')
          .eq('id', session.user.id)
          .maybeSingle()
        const currentPd2 = (currentP?.personal_data as Record<string, string> | null) ?? {}
        const { error: upErr2 } = await supabase
          .from('profiles')
          .update({
            full_name:                 fullName,
            personal_data:             { ...currentPd2, phone },
            notifications_preferences: notif,
            metadata:                  meta,
            preferences:               { theme: meta.theme === 'auto' ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : meta.theme, font },
          })
          .eq('id', session.user.id)
        upErr = upErr2
      }

      if (upErr) throw upErr

      // Guardar prefs de notificaciones en localStorage para acceso inmediato
      localStorage.setItem('gandia-notif-prefs', JSON.stringify(notif))
      // Guardar prefs del asistente para useChat y Chat.tsx
      localStorage.setItem('gandia-assistant-prefs', JSON.stringify(meta.assistant))
      applyTheme(meta.theme)
      applyAccessibility(meta.accessibility)
      // Activar/desactivar voz en caliente sin recargar página
      window.dispatchEvent(new CustomEvent('gandia:voice-toggle', { detail: { enabled: meta.accessibility.voiceNav } }))
      // Sincronizar UserContext para que no sobreescriba el tema al recargar preferencias
      await refreshProfile()
      setHasChanges(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 2400)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const discard = () => setHasChanges(false)

  // ─── CHANGE PASSWORD ──────────────────────────────────────────────────────
  const isOAuth = authMethod && authMethod !== 'email' && authMethod !== 'password'

  const changePassword = async () => {
    setPwError('')
    setPwSuccess('')
    if (!pwNew)     { setPwError('Ingresa una contraseña'); return }
    if (pwNew !== pwConfirm) { setPwError('Las contraseñas no coinciden'); return }
    if (pwNew.length < 8)    { setPwError('Mínimo 8 caracteres'); return }
    if (!isOAuth && !pwCurrent) { setPwError('Ingresa tu contraseña actual'); return }
    if (!isOAuth && pwNew === pwCurrent) { setPwError('La nueva contraseña debe ser diferente a la actual'); return }
    setPwSaving(true)
    try {
      if (!isOAuth) {
        // Verificar contraseña actual
        const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password: pwCurrent })
        if (signInErr) { setPwError('La contraseña actual es incorrecta'); return }
      }
      const { error: updateErr } = await supabase.auth.updateUser({ password: pwNew })
      if (updateErr) throw updateErr
      setPwSuccess(isOAuth ? 'Contraseña configurada. Ahora puedes iniciar sesión con email.' : 'Contraseña actualizada correctamente')
      setPwCurrent(''); setPwNew(''); setPwConfirm('')
      if (isOAuth) setAuthMethod('email')  // ahora tiene ambos métodos
      setTimeout(() => setPwSuccess(''), 4000)
    } catch (e: unknown) {
      setPwError(e instanceof Error ? e.message : 'Error al cambiar contraseña')
    } finally {
      setPwSaving(false)
    }
  }

  // ─── SIGN OUT ALL ─────────────────────────────────────────────────────────
  const signOutAll = async () => {
    await supabase.auth.signOut({ scope: 'global' })
    window.location.href = '/login'
  }

  // ─── HELPERS ──────────────────────────────────────────────────────────────
  const setN = <K extends keyof NotifPrefs>(k: K, v: NotifPrefs[K]) => {
    setNotif(p => ({ ...p, [k]: v })); mark()
  }
  const setAssistant = <K extends keyof MetaData['assistant']>(k: K, v: MetaData['assistant'][K]) => {
    setMeta(p => ({ ...p, assistant: { ...p.assistant, [k]: v } })); mark()
  }
  const setAccess = <K extends keyof MetaData['accessibility']>(k: K, v: MetaData['accessibility'][K]) => {
    setMeta(p => ({ ...p, accessibility: { ...p.accessibility, [k]: v } })); mark()
  }
  const setAppearance = <K extends 'theme' | 'language' | 'dateFormat' | 'units'>(k: K, v: MetaData[K]) => {
    setMeta(p => ({ ...p, [k]: v })); mark()
  }

  // ─── RENDER ───────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="h-full flex items-center justify-center bg-[#fafaf9] dark:bg-[#0c0a09]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-6 h-6 border-2 border-[#2FAF8F] border-t-transparent rounded-full animate-spin" />
        <p className="text-[12px] text-stone-400">Cargando configuración…</p>
      </div>
    </div>
  )

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600&display=swap');
        .cfg * { -webkit-font-smoothing: antialiased; }
        .cfg { font-family: 'Geist', system-ui, sans-serif; }
        .cfg *:focus, .cfg *:focus-visible { outline: none !important; box-shadow: none !important; }
        .cfg-sc::-webkit-scrollbar { width: 3px; }
        .cfg-sc::-webkit-scrollbar-track { background: transparent; }
        .cfg-sc::-webkit-scrollbar-thumb { background: #e7e5e4; border-radius: 999px; }
        .dark .cfg-sc::-webkit-scrollbar-thumb { background: #3c3836; }
        .cfg-sc { scrollbar-width: thin; scrollbar-color: #e7e5e4 transparent; }
        .dark .cfg-sc { scrollbar-color: #3c3836 transparent; }
        /* Mobile tab row */
        .cfg-tabs { overflow-x: auto; }
        .cfg-tabs::-webkit-scrollbar { display: none; }
        .cfg-tabs { scrollbar-width: none; }
        @keyframes cfg-in { from{opacity:0;transform:translateY(7px)} to{opacity:1;transform:translateY(0)} }
        .cfg-in { animation: cfg-in 340ms cubic-bezier(.16,1,.3,1) both; }
        @keyframes cfg-bar { from{transform:translateY(100%)} to{transform:translateY(0)} }
        .cfg-bar { animation: cfg-bar 180ms cubic-bezier(.16,1,.3,1) both; }
        @keyframes cfg-toast { 0%{opacity:0;transform:translateY(10px) scale(.96)} 14%{opacity:1;transform:translateY(0) scale(1)} 80%{opacity:1;transform:translateY(0) scale(1)} 100%{opacity:0;transform:translateY(-6px) scale(.96)} }
        .cfg-toast { animation: cfg-toast 2.4s cubic-bezier(.16,1,.3,1) both; }
      `}</style>

      {/* AppLayout ya provee flex-1 overflow-y-auto en <main> — no wrappear scroll aquí */}
      <div className="cfg min-h-full w-full bg-[#fafaf9] dark:bg-[#0c0a09]">

        {/* ── MOBILE TAB ROW (solo en < md) ── */}
        <div className="md:hidden sticky top-0 z-10 border-b border-stone-200/70 dark:border-stone-800/60 bg-white/95 dark:bg-[#141210]/95 backdrop-blur-xl">
          <div className="cfg-tabs flex">
            {SECTIONS.map((s) => (
              <button key={s.id} onClick={() => setActive(s.id)}
                className={`relative flex flex-col items-center gap-1 pt-3 pb-2.5 px-3 shrink-0 transition-colors ${
                  active === s.id
                    ? 'text-stone-900 dark:text-stone-50'
                    : 'text-stone-400 dark:text-stone-500'
                }`}>
                <span className={active === s.id ? 'text-[#2FAF8F]' : ''}>{s.icon}</span>
                <span className="text-[10.5px] font-medium whitespace-nowrap">{s.label}</span>
                {active === s.id && (
                  <span className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full bg-[#2FAF8F]" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── LAYOUT: card izquierda (desktop) + contenido ── */}
        <div className="flex items-start gap-0 md:gap-5 max-w-[960px] mx-auto px-4 md:px-6 lg:px-8 py-5 md:py-7 pb-28">

          {/* Card nav izquierda — solo desktop, sticky dentro del scroll de AppLayout */}
          <div className="hidden md:block w-[176px] shrink-0 self-start sticky top-6">
            <div className="bg-white dark:bg-[#141210] rounded-2xl border border-stone-200/70 dark:border-stone-800/60 shadow-[0_2px_12px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_16px_rgba(0,0,0,0.20)] overflow-hidden transition-shadow duration-300 hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_4px_24px_rgba(0,0,0,0.30)]">
              <div className="p-1.5">
                {SECTIONS.map((s) => (
                  <button key={s.id} onClick={() => setActive(s.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-[9px] rounded-xl text-[12.5px] font-medium transition-all duration-150 ${
                      active === s.id
                        ? 'bg-stone-100 dark:bg-stone-800/60 text-stone-900 dark:text-stone-50'
                        : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800/30'
                    }`}>
                    <span className={`shrink-0 ${active === s.id ? 'text-[#2FAF8F]' : ''}`}>{s.icon}</span>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Contenido principal */}
          <div className="flex-1 min-w-0">

              {/* Section header */}
              <div className="cfg-in mb-6">
                <h1 className="text-[15px] font-semibold tracking-[-0.022em] text-stone-900 dark:text-stone-50">
                  {SECTIONS.find(s => s.id === active)?.label}
                </h1>
                <p className="text-[11.5px] text-stone-400 dark:text-stone-500 mt-0.5">
                  {SECTIONS.find(s => s.id === active)?.desc}
                </p>
              </div>

              {/* ════ PERFIL ════ */}
              {active === 'profile' && (
                <div className="space-y-5 cfg-in">
                  {/* Avatar + nombre */}
                  <div className="flex items-center gap-4 p-4 sm:p-5 bg-white dark:bg-[#141210] rounded-2xl border border-stone-200/70 dark:border-stone-800/60">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-[#2FAF8F] to-[#1a9070] flex items-center justify-center text-white text-xl font-bold shadow-sm shrink-0">
                      {avatarLetter}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13.5px] font-semibold text-stone-800 dark:text-stone-100 leading-none mb-0.5 truncate">
                        {fullName || email}
                      </p>
                      <p className="text-[11.5px] text-stone-400 dark:text-stone-500 truncate">
                        {role !== '—' ? `${role} · ` : ''}{email}
                      </p>
                    </div>
                  </div>

                  {/* Fields */}
                  <div className="bg-white dark:bg-[#141210] rounded-2xl border border-stone-200/70 dark:border-stone-800/60 divide-y divide-stone-100 dark:divide-stone-800/50 overflow-hidden">
                    <CfgField
                      label="Nombre completo" type="text"
                      value={fullName}
                      onChange={v => { setFullName(v); mark() }}
                    />
                    <CfgField
                      label="Correo electrónico" type="email"
                      value={email}
                      onChange={() => {}}
                      hint="Para cambiar el email contacta a soporte"
                      readOnly
                    />
                    <CfgField
                      label="Teléfono" type="tel"
                      value={phone}
                      onChange={v => { setPhone(v); mark() }}
                    />
                    <div className="px-5 py-4">
                      <p className="text-[11px] font-medium text-stone-400 dark:text-stone-500 uppercase tracking-[0.08em] mb-2">Rol</p>
                      <span className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-stone-600 dark:text-stone-300 bg-stone-100 dark:bg-stone-800/60 px-2.5 py-1 rounded-lg">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#2FAF8F]" />
                        {role}
                      </span>
                    </div>
                  </div>
                  <SaveBtn onClick={save} loading={saving} />
                </div>
              )}

              {/* ════ NOTIFICACIONES ════ */}
              {active === 'notifications' && (
                <div className="space-y-5 cfg-in">
                  <CfgCard title="Tipos de eventos">
                    <CfgToggle title="Alertas técnicas"   desc="Monitoreo, cámaras y drones"    checked={notif.alerts}          onChange={v => setN('alerts', v)} />
                    <CfgToggle title="Auditorías"         desc="Actualizaciones de procesos"     checked={notif.auditorias}       onChange={v => setN('auditorias', v)} />
                    <CfgToggle title="Certificaciones"    desc="Estado y renovaciones"           checked={notif.certificaciones}  onChange={v => setN('certificaciones', v)} />
                    <CfgToggle title="Sistema"            desc="Actualizaciones y mantenimiento" checked={notif.sistema}          onChange={v => setN('sistema', v)} />
                    <CfgToggle title="Menciones en chat"  desc="Cuando alguien te menciona"     checked={notif.menciones}        onChange={v => setN('menciones', v)} last />
                  </CfgCard>

                  <CfgCard title="Canales de entrega">
                    <CfgToggle title="Push"               desc="Alertas en el navegador"        checked={notif.push}    onChange={v => setN('push', v)} />
                    <CfgToggle title="Correo electrónico" desc="Resúmenes diarios y urgentes"   checked={notif.email}   onChange={v => setN('email', v)} />
                    <CfgToggle title="SMS"                desc="Solo alertas críticas"          checked={notif.sms}     onChange={v => setN('sms', v)} last />
                  </CfgCard>

                  <CfgCard title="No molestar">
                    <div className="px-5 py-4 grid grid-cols-2 gap-3">
                      {([['Desde', 'dnd_from'], ['Hasta', 'dnd_to']] as const).map(([lbl, key]) => (
                        <div key={key}>
                          <p className="text-[11px] text-stone-400 dark:text-stone-500 mb-1.5">{lbl}</p>
                          <input type="time" value={notif[key]}
                            onChange={e => setN(key, e.target.value)}
                            className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-900/60 border border-stone-200/70 dark:border-stone-800/60 rounded-xl text-[13px] text-stone-700 dark:text-stone-200" />
                        </div>
                      ))}
                    </div>
                  </CfgCard>
                  <SaveBtn onClick={save} loading={saving} />
                </div>
              )}

              {/* ════ APARIENCIA ════ */}
              {active === 'appearance' && (
                <div className="space-y-5 cfg-in">
                  <CfgCard title="Tema">
                    <div className="px-5 py-4 grid grid-cols-3 gap-2.5">
                      {([
                        { value: 'light', label: 'Claro',  icon: <SunIco /> },
                        { value: 'dark',  label: 'Oscuro', icon: <MoonIco /> },
                        { value: 'auto',  label: 'Auto',   icon: <MonitorIco /> },
                      ] as const).map((t) => (
                        <button key={t.value}
                          onClick={() => { setAppearance('theme', t.value); applyTheme(t.value) }}
                          className={`flex flex-col items-center gap-2 py-3 rounded-xl border transition-all ${
                            meta.theme === t.value
                              ? 'border-[#2FAF8F]/40 bg-[#2FAF8F]/[0.06] dark:bg-[#2FAF8F]/[0.12]'
                              : 'border-stone-200/70 dark:border-stone-800/60 bg-stone-50 dark:bg-stone-900/40 hover:border-stone-300 dark:hover:border-stone-700'
                          }`}>
                          <span className={meta.theme === t.value ? 'text-[#2FAF8F]' : 'text-stone-400 dark:text-stone-500'}>{t.icon}</span>
                          <span className={`text-[11.5px] font-semibold ${meta.theme === t.value ? 'text-stone-700 dark:text-stone-200' : 'text-stone-400 dark:text-stone-500'}`}>{t.label}</span>
                        </button>
                      ))}
                    </div>
                  </CfgCard>

                  <CfgCard title="Tipografía">
                    <div className="px-5 py-4">
                      <p className="text-[11px] text-stone-400 dark:text-stone-500 mb-3">
                        Fuente aplicada en toda la interfaz
                      </p>
                      <div className="grid grid-cols-3 gap-2.5">
                        {([
                          { value: 'geist', label: 'Geist',  desc: 'Moderna',   sample: 'Aa', style: { fontFamily: "'Geist', system-ui, sans-serif", fontWeight: 500 } },
                          { value: 'serif', label: 'Serif',  desc: 'Elegante',  sample: 'Aa', style: { fontFamily: "'Instrument Serif', Georgia, serif", fontStyle: 'italic' } },
                          { value: 'lora',  label: 'Lora',   desc: 'Editorial', sample: 'Aa', style: { fontFamily: "'Lora', Georgia, serif" } },
                        ] as const).map(f => (
                          <button key={f.value} onClick={() => setFont(f.value)}
                            className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border transition-all ${
                              font === f.value
                                ? 'border-[#2FAF8F]/40 bg-[#2FAF8F]/[0.06] dark:bg-[#2FAF8F]/[0.12]'
                                : 'border-stone-200/70 dark:border-stone-800/60 bg-stone-50 dark:bg-stone-900/40 hover:border-stone-300 dark:hover:border-stone-700'
                            }`}>
                            <span style={{ ...f.style, fontSize: 22, lineHeight: 1 }}
                              className={font === f.value ? 'text-[#2FAF8F]' : 'text-stone-700 dark:text-stone-200'}>
                              {f.sample}
                            </span>
                            <span className={`text-[11.5px] font-semibold ${font === f.value ? 'text-stone-700 dark:text-stone-200' : 'text-stone-400 dark:text-stone-500'}`}>
                              {f.label}
                            </span>
                            <span className={`text-[10px] ${font === f.value ? 'text-[#2FAF8F]' : 'text-stone-300 dark:text-stone-600'}`}>
                              {f.desc}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </CfgCard>

                  <CfgCard title="Idioma y región">
                    <div className="px-5 py-4 space-y-4">
                      <div>
                        <p className="text-[11px] text-stone-400 dark:text-stone-500 mb-1.5">Idioma</p>
                        <select value={meta.language} onChange={e => setAppearance('language', e.target.value as 'es' | 'en')}
                          className="w-full px-3 py-2.5 bg-stone-50 dark:bg-stone-900/60 border border-stone-200/70 dark:border-stone-800/60 rounded-xl text-[13px] text-stone-700 dark:text-stone-200 appearance-none">
                          <option value="es">Español</option>
                          <option value="en">English</option>
                        </select>
                      </div>
                      <div>
                        <p className="text-[11px] text-stone-400 dark:text-stone-500 mb-2">Formato de fecha</p>
                        <div className="flex gap-2">
                          {(['DD/MM/YYYY', 'MM/DD/YYYY'] as const).map(f => (
                            <label key={f} className={`flex items-center gap-2 flex-1 px-3 py-2 border rounded-xl cursor-pointer transition-colors ${
                              meta.dateFormat === f ? 'border-[#2FAF8F]/40' : 'border-stone-200/70 dark:border-stone-800/60 hover:border-stone-300 dark:hover:border-stone-700'
                            }`}>
                              <input type="radio" name="date-fmt" checked={meta.dateFormat === f}
                                onChange={() => setAppearance('dateFormat', f)} className="accent-[#2FAF8F]" />
                              <span className="text-[12px] text-stone-600 dark:text-stone-300">{f}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-[11px] text-stone-400 dark:text-stone-500 mb-2">Unidades</p>
                        <div className="flex gap-2">
                          {([['metric', 'Kg / Ha'], ['imperial', 'Lb / Ac']] as const).map(([val, lbl]) => (
                            <label key={val} className={`flex items-center gap-2 flex-1 px-3 py-2 border rounded-xl cursor-pointer transition-colors ${
                              meta.units === val ? 'border-[#2FAF8F]/40' : 'border-stone-200/70 dark:border-stone-800/60 hover:border-stone-300 dark:hover:border-stone-700'
                            }`}>
                              <input type="radio" name="units" checked={meta.units === val}
                                onChange={() => setAppearance('units', val)} className="accent-[#2FAF8F]" />
                              <span className="text-[12px] text-stone-600 dark:text-stone-300">{lbl}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CfgCard>
                  <SaveBtn onClick={save} loading={saving} />
                </div>
              )}

              {/* ════ SEGURIDAD ════ */}
              {active === 'security' && (
                <div className="space-y-5 cfg-in">

                  {/* ── Método de acceso ── */}
                  <CfgCard title="Método de acceso">
                    <div className="px-5 py-4 flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        authMethod === 'google' ? 'bg-white border border-stone-200/70 dark:border-stone-700/50 shadow-sm' :
                        authMethod === 'apple'  ? 'bg-black' :
                        authMethod === 'azure'  ? 'bg-[#0078d4]' :
                        'bg-stone-100 dark:bg-stone-800/60'
                      }`}>
                        {authMethod === 'google' && (
                          <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                        )}
                        {authMethod === 'apple' && (
                          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                        )}
                        {(authMethod === 'email' || authMethod === 'password' || !authMethod) && (
                          <svg className="w-4 h-4 text-stone-400 dark:text-stone-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 8l10 6 10-6"/></svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-stone-700 dark:text-stone-200 leading-none mb-0.5">
                          {authMethod === 'google' ? 'Google' :
                           authMethod === 'apple'  ? 'Apple' :
                           authMethod === 'azure'  ? 'Microsoft' :
                           'Correo y contraseña'}
                        </p>
                        <p className="text-[11.5px] text-stone-400 dark:text-stone-500">
                          {isOAuth
                            ? `Iniciaste sesión con ${authMethod === 'google' ? 'Google' : authMethod === 'apple' ? 'Apple' : 'Microsoft'} · ${email}`
                            : email}
                        </p>
                      </div>
                    </div>
                  </CfgCard>

                  {/* ── Contraseña ── */}
                  <CfgCard title={isOAuth ? 'Agregar contraseña' : 'Cambiar contraseña'}>
                    {isOAuth && (
                      <div className="px-5 pt-4 pb-2">
                        <p className="text-[12px] text-stone-400 dark:text-stone-500 leading-relaxed">
                          Agrega una contraseña para poder iniciar sesión también con tu correo, además de con {authMethod === 'google' ? 'Google' : authMethod === 'apple' ? 'Apple' : 'Microsoft'}.
                        </p>
                      </div>
                    )}
                    <div className="px-5 py-4 space-y-3">
                      {!isOAuth && <PwInput label="Contraseña actual" value={pwCurrent} onChange={setPwCurrent} />}
                      <PwInput label={isOAuth ? 'Nueva contraseña' : 'Nueva contraseña'} value={pwNew} onChange={setPwNew} />
                      <PwInput label="Confirmar contraseña" value={pwConfirm} onChange={setPwConfirm} />
                      {pwError   && <p className="text-[11.5px] text-rose-500">{pwError}</p>}
                      {pwSuccess && <p className="text-[11.5px] text-[#2FAF8F]">{pwSuccess}</p>}
                      <button onClick={changePassword} disabled={pwSaving}
                        className="w-full h-9 rounded-xl text-[12.5px] font-semibold text-white bg-[#1c1917] dark:bg-[#f5f5f4] dark:text-[#1c1917] hover:bg-stone-800 dark:hover:bg-white active:scale-[0.97] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                        {pwSaving
                          ? <><div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />Guardando…</>
                          : isOAuth ? 'Agregar contraseña' : 'Actualizar contraseña'
                        }
                      </button>
                    </div>
                  </CfgCard>

                  <CfgCard title="Sesión actual">
                    <div className="px-5 py-4 space-y-3">
                      {sessionInfo && (
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-stone-50 dark:bg-stone-900/40 border border-stone-200/50 dark:border-stone-800/50">
                          <div className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-stone-800/60 flex items-center justify-center text-stone-400 shrink-0">
                            <MonitorIco />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[12.5px] font-semibold text-stone-700 dark:text-stone-200 leading-none mb-0.5">
                              {sessionInfo.browser}{sessionInfo.os ? ` · ${sessionInfo.os}` : ''}
                            </p>
                            <div className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#2FAF8F] animate-pulse shrink-0" />
                              <p className="text-[11px] text-[#2FAF8F]">Activa ahora · Desde {sessionInfo.since}</p>
                            </div>
                          </div>
                        </div>
                      )}
                      <button onClick={signOutAll}
                        className="w-full py-2 text-[12px] font-medium text-rose-500 hover:text-rose-600 border border-rose-200/60 dark:border-rose-900/40 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all">
                        Cerrar todas las sesiones
                      </button>
                    </div>
                  </CfgCard>
                </div>
              )}

              {/* ════ ASISTENTE IA ════ */}
              {active === 'assistant' && (
                <div className="space-y-5 cfg-in">
                  <CfgCard title="Comportamiento">
                    <div className="px-5 py-4 space-y-4">
                      <div>
                        <p className="text-[11px] text-stone-400 dark:text-stone-500 mb-2">Nivel de detalle</p>
                        <div className="flex gap-2">
                          {([
                            { value: 'concise',  label: 'Conciso',    sub: 'Directo' },
                            { value: 'balanced', label: 'Balanceado', sub: 'Recomendado' },
                            { value: 'detailed', label: 'Detallado',  sub: 'Completo' },
                          ] as const).map(o => (
                            <label key={o.value} onClick={() => setAssistant('detailLevel', o.value)}
                              className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 px-2 rounded-xl border cursor-pointer transition-all ${
                                meta.assistant.detailLevel === o.value
                                  ? 'border-[#2FAF8F]/40 bg-[#2FAF8F]/[0.06] dark:bg-[#2FAF8F]/[0.12]'
                                  : 'border-stone-200/70 dark:border-stone-800/60 hover:border-stone-300 dark:hover:border-stone-700'
                              }`}>
                              <span className={`text-[12px] font-semibold ${meta.assistant.detailLevel === o.value ? 'text-stone-800 dark:text-stone-100' : 'text-stone-500 dark:text-stone-400'}`}>{o.label}</span>
                              <span className={`text-[10px] ${meta.assistant.detailLevel === o.value ? 'text-[#2FAF8F]' : 'text-stone-300 dark:text-stone-600'}`}>{o.sub}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-[11px] text-stone-400 dark:text-stone-500 mb-2">Tono</p>
                        <div className="flex gap-2">
                          {([['professional', 'Profesional'], ['casual', 'Casual']] as const).map(([val, lbl]) => (
                            <label key={val} onClick={() => setAssistant('tone', val)}
                              className={`flex-1 flex items-center justify-center py-2 rounded-xl border cursor-pointer transition-all ${
                                meta.assistant.tone === val
                                  ? 'border-[#2FAF8F]/40 bg-[#2FAF8F]/[0.06] dark:bg-[#2FAF8F]/[0.12]'
                                  : 'border-stone-200/70 dark:border-stone-800/60 hover:border-stone-300 dark:hover:border-stone-700'
                              }`}>
                              <span className={`text-[12.5px] font-medium ${meta.assistant.tone === val ? 'text-stone-700 dark:text-stone-200' : 'text-stone-400 dark:text-stone-500'}`}>{lbl}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CfgCard>

                  <CfgCard title="Funciones">
                    <CfgToggle title="Sugerencias automáticas"    desc="Acciones relevantes según el contexto" checked={meta.assistant.suggestions} onChange={v => setAssistant('suggestions', v)} />
                    <CfgToggle title="Recordatorios inteligentes" desc="Basados en tu actividad"              checked={meta.assistant.reminders}   onChange={v => setAssistant('reminders', v)} />
                    <CfgToggle title="Mantener historial"         desc="Guardar conversaciones"               checked={meta.assistant.history}     onChange={v => setAssistant('history', v)} last />
                  </CfgCard>
                  <SaveBtn onClick={save} loading={saving} />
                </div>
              )}

              {/* ════ ACCESIBILIDAD ════ */}
              {active === 'accessibility' && (
                <div className="space-y-5 cfg-in">
                  <CfgCard title="Tamaño de texto">
                    <div className="px-5 py-4">
                      <div className="flex items-center gap-2 mb-3">
                        {[12, 14, 16, 18, 20].map((sz, i) => (
                          <button key={sz} onClick={() => setAccess('fontSizeIdx', i)}
                            className={`flex-1 flex items-center justify-center h-10 rounded-xl border font-semibold transition-all ${
                              meta.accessibility.fontSizeIdx === i
                                ? 'border-[#2FAF8F]/40 bg-[#2FAF8F]/[0.06] dark:bg-[#2FAF8F]/[0.12] text-stone-800 dark:text-stone-100'
                                : 'border-stone-200/70 dark:border-stone-800/60 text-stone-400 dark:text-stone-500 hover:border-stone-300 dark:hover:border-stone-700'
                            }`}
                            style={{ fontSize: sz }}>A</button>
                        ))}
                      </div>
                      <p className="text-[11.5px] text-stone-400 dark:text-stone-500">
                        Tamaño actual: {[12, 14, 16, 18, 20][meta.accessibility.fontSizeIdx]}px
                      </p>
                    </div>
                  </CfgCard>

                  <CfgCard title="Visual">
                    <CfgToggle title="Contraste alto"     desc="Mayor legibilidad en pantalla"      checked={meta.accessibility.highContrast}   onChange={v => setAccess('highContrast', v)} />
                    <CfgToggle title="Reducir movimiento" desc="Minimiza animaciones"               checked={meta.accessibility.reduceMotion}   onChange={v => setAccess('reduceMotion', v)} last />
                  </CfgCard>

                  <CfgCard title="Navegación">
                    <CfgToggle title="Atajos de teclado"  desc="Navegación rápida con el teclado"  checked={meta.accessibility.keyboardShortcuts} onChange={v => setAccess('keyboardShortcuts', v)} />
                    {(() => {
                      const voiceSupported = !!(
                        typeof window !== 'undefined' &&
                        ((window as unknown as Record<string, unknown>).SpeechRecognition ||
                         (window as unknown as Record<string, unknown>).webkitSpeechRecognition)
                      )
                      return voiceSupported
                        ? <CfgToggle title="Navegación por voz" desc="Controla la interfaz con comandos de voz" checked={meta.accessibility.voiceNav} onChange={v => setAccess('voiceNav', v)} last />
                        : (
                          <div className="flex items-center justify-between px-5 py-4 gap-4 opacity-50 select-none">
                            <div className="flex-1 min-w-0">
                              <p className="text-[13px] font-medium text-stone-700 dark:text-stone-200 leading-none mb-0.5">Navegación por voz</p>
                              <p className="text-[11.5px] text-stone-400 dark:text-stone-500">Controla la interfaz con comandos de voz</p>
                            </div>
                            <span className="text-[10.5px] font-semibold px-2 py-0.5 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-400 dark:text-stone-500 shrink-0">
                              No disponible en este navegador
                            </span>
                          </div>
                        )
                    })()}
                  </CfgCard>
                  <SaveBtn onClick={save} loading={saving} />
                </div>
              )}

              {/* Error global */}
              {error && (
                <div className="mt-4 px-4 py-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-900/40">
                  <p className="text-[12px] text-rose-600 dark:text-rose-400">{error}</p>
                </div>
              )}

          </div>
        </div>

        {/* ── SAVE BAR ── */}
        {hasChanges && (
          <div className="cfg-bar fixed bottom-0 inset-x-0 z-40 bg-[#fafaf9]/96 dark:bg-[#0c0a09]/96 backdrop-blur-xl border-t border-stone-200/70 dark:border-stone-800/60 px-5 sm:px-8 py-3 flex items-center justify-between gap-4">
            <p className="text-[12.5px] text-stone-500 dark:text-stone-400 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
              Cambios sin guardar
            </p>
            <div className="flex items-center gap-2">
              <button onClick={discard}
                className="h-8 px-4 rounded-xl text-[12.5px] font-medium text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 border border-stone-200/70 dark:border-stone-700/50 transition-colors">
                Descartar
              </button>
              <button onClick={save} disabled={saving}
                className="h-8 px-5 rounded-xl text-[12.5px] font-semibold text-white bg-[#1c1917] dark:bg-[#f5f5f4] dark:text-[#1c1917] hover:bg-stone-800 dark:hover:bg-white active:scale-[0.97] transition-all shadow-sm disabled:opacity-50 flex items-center gap-2">
                {saving
                  ? <><div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />Guardando…</>
                  : 'Guardar'
                }
              </button>
            </div>
          </div>
        )}

        {/* ── TOAST ── */}
        {saved && (
          <div className="cfg-toast fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#1c1917] dark:bg-stone-100 shadow-xl pointer-events-none">
            <span className="w-3.5 h-3.5 rounded-full bg-[#2FAF8F] flex items-center justify-center shrink-0">
              <svg className="w-2 h-2" viewBox="0 0 10 10" fill="none"><path d="M2 5l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </span>
            <span className="text-[12.5px] font-medium text-white dark:text-stone-900 whitespace-nowrap">Cambios guardados</span>
          </div>
        )}
      </div>
    </>
  )
}

// ─── SHARED COMPONENTS ────────────────────────────────────────────────────────

function CfgCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-[#141210] rounded-2xl border border-stone-200/70 dark:border-stone-800/60 overflow-hidden">
      <div className="px-5 pt-4 pb-1">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.10em] text-stone-400 dark:text-stone-500">{title}</p>
      </div>
      {children}
    </div>
  )
}

function CfgField({ label, type, value, onChange, hint, readOnly = false }: {
  label: string; type: string; value: string
  onChange: (v: string) => void; hint?: string; readOnly?: boolean
}) {
  return (
    <div className="px-5 py-4">
      <p className="text-[11px] font-medium text-stone-400 dark:text-stone-500 uppercase tracking-[0.08em] mb-1.5">{label}</p>
      <input type={type} value={value} readOnly={readOnly}
        onChange={e => onChange(e.target.value)}
        className={`w-full bg-transparent text-[13.5px] font-medium text-stone-700 dark:text-stone-200 ${readOnly ? 'opacity-60 cursor-default' : ''}`}
        style={{ outline: 'none', boxShadow: 'none' }}
      />
      {hint && <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-1 leading-snug">{hint}</p>}
    </div>
  )
}

function PwInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [show, setShow] = useState(false)
  return (
    <div>
      <p className="text-[11px] font-medium text-stone-400 dark:text-stone-500 uppercase tracking-[0.08em] mb-1.5">{label}</p>
      <div className="relative">
        <input type={show ? 'text' : 'password'} value={value} onChange={e => onChange(e.target.value)}
          className="w-full px-3 py-2.5 pr-10 bg-stone-50 dark:bg-stone-900/60 border border-stone-200/70 dark:border-stone-800/60 rounded-xl text-[13px] text-stone-700 dark:text-stone-200"
          style={{ outline: 'none' }}
        />
        <button type="button" tabIndex={-1} onClick={() => setShow(p => !p)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors">
          {show
            ? <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
            : <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          }
        </button>
      </div>
    </div>
  )
}

function CfgToggle({ title, desc, checked, onChange, last = false }: {
  title: string; desc: string; checked: boolean; onChange: (v: boolean) => void; last?: boolean
}) {
  return (
    <div className={`flex items-center justify-between px-5 py-4 gap-4 ${!last ? 'border-b border-stone-100 dark:border-stone-800/50' : ''}`}>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-stone-700 dark:text-stone-200 leading-none mb-0.5">{title}</p>
        <p className="text-[11.5px] text-stone-400 dark:text-stone-500">{desc}</p>
      </div>
      <button role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
        className={`relative shrink-0 w-11 h-6 rounded-full transition-colors duration-200 ${
          checked ? 'bg-[#1c1917] dark:bg-[#f0efee]' : 'bg-stone-200 dark:bg-stone-700'
        }`}>
        <span className={`absolute top-[3px] left-[3px] w-[18px] h-[18px] rounded-full shadow-sm transition-all duration-200 ${
          checked ? 'translate-x-5 bg-white dark:bg-[#1c1917]' : 'translate-x-0 bg-white dark:bg-stone-400'
        }`} />
      </button>
    </div>
  )
}

function SaveBtn({ onClick, loading }: { onClick: () => void; loading: boolean }) {
  return (
    <div className="pt-2">
      <button onClick={onClick} disabled={loading}
        className="h-10 px-6 rounded-2xl text-[13px] font-semibold text-white bg-[#1c1917] dark:bg-[#f5f5f4] dark:text-[#1c1917] hover:bg-stone-800 dark:hover:bg-white active:scale-[0.97] transition-all shadow-sm disabled:opacity-50 flex items-center gap-2">
        {loading
          ? <><div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />Guardando…</>
          : 'Guardar cambios'
        }
      </button>
    </div>
  )
}

// ─── ICONS ────────────────────────────────────────────────────────────────────
const SunIco = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
)
const MoonIco = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
)
const MonitorIco = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
    <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
  </svg>
)