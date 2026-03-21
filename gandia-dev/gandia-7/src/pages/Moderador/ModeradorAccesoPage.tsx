import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { useUser } from '../../context/UserContext'

type Vista = 'seleccion' | 'login' | 'aplicar' | 'enviado'

const TIPOS = [
  { id: 'mvz',          label: 'Médico Veterinario'      },
  { id: 'productor',    label: 'Productor ganadero'      },
  { id: 'exportador',   label: 'Exportador'              },
  { id: 'investigador', label: 'Investigador / Académico' },
  { id: 'auditor',      label: 'Auditor / Inspector'     },
  { id: 'asociacion',   label: 'Asociación ganadera'     },
]

const ESTADOS_MX = [
  'Aguascalientes','Baja California','Baja California Sur','Campeche','Chiapas',
  'Chihuahua','Ciudad de México','Coahuila','Colima','Durango','Guanajuato',
  'Guerrero','Hidalgo','Jalisco','Estado de México','Michoacán','Morelos',
  'Nayarit','Nuevo León','Oaxaca','Puebla','Querétaro','Quintana Roo',
  'San Luis Potosí','Sinaloa','Sonora','Tabasco','Tamaulipas','Tlaxcala',
  'Veracruz','Yucatán','Zacatecas','Nacional',
]

export default function ModeradorAccesoPage() {
  const navigate = useNavigate()
  const { profile, authStatus } = useUser()
  const [vista, setVista] = useState<Vista>('seleccion')
  const [googleLoading, setGoogleLoading] = useState(false)

  // Si ya hay sesión activa verificar si es moderador
  useEffect(() => {
    if (authStatus !== 'authenticated' || !profile?.user_id) return
    const check = async () => {
      const { data: cp } = await supabase
        .from('creator_profiles')
        .select('nivel, status')
        .eq('user_id', profile.user_id)
        .single()
      if (cp && cp.nivel >= 3 && cp.status === 'activo') {
        navigate('/moderador/panel', { replace: true })
      }
    }
    void check()
  }, [authStatus, profile?.user_id, navigate])

  // Login
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPwd,  setShowPwd]  = useState(false)
  const [loginErr, setLoginErr] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)

  // Aplicar
  const [tipo,      setTipo]      = useState('mvz')
  const [nombre,    setNombre]    = useState('')
  const [correo,    setCorreo]    = useState('')
  const [estadoMx,    setEstadoMx]    = useState('')
  const [bio,         setBio]         = useState('')
  const [newPwd,      setNewPwd]      = useState('')
  const [confirmPwd,  setConfirmPwd]  = useState('')
  const [showNewPwd,  setShowNewPwd]  = useState(false)
  const [applying,    setApplying]    = useState(false)
  const [applyErr,    setApplyErr]    = useState('')

  const fuerzaPassword = (pwd: string) => {
    let s = 0
    if (pwd.length >= 8)           s++
    if (pwd.length >= 12)          s++
    if (/[A-Z]/.test(pwd))         s++
    if (/[0-9]/.test(pwd))         s++
    if (/[^A-Za-z0-9]/.test(pwd))  s++
    if (s <= 1) return { nivel: 1, texto: 'Muy débil', color: '#ef4444' }
    if (s <= 2) return { nivel: 2, texto: 'Débil',     color: '#f97316' }
    if (s <= 3) return { nivel: 3, texto: 'Regular',   color: '#eab308' }
    if (s <= 4) return { nivel: 4, texto: 'Fuerte',    color: '#2FAF8F' }
    return              { nivel: 5, texto: 'Muy fuerte', color: '#2FAF8F' }
  }

  // ── Login ────────────────────────────────────────────────────────────────────
  const handleLogin = async () => {
    if (!email.trim() || !password) return
    setLoginLoading(true)
    setLoginErr('')
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      })
      if (error) { setLoginErr('Usuario no registrado o contraseña incorrecta.'); return }

      // Verificar que sea moderador (creator_profile nivel >= 3)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoginErr('No se pudo obtener el usuario.'); return }

      const { data: cp } = await supabase
        .from('creator_profiles')
        .select('nivel, status')
        .eq('user_id', user.id)
        .single()

      if (!cp || cp.nivel < 3 || cp.status !== 'activo') {
        setLoginErr('Tu cuenta aún no tiene acceso de moderador. Si enviaste una solicitud, espera la aprobación.')
        await supabase.auth.signOut()
        return
      }

      navigate('/moderador/panel', { replace: true })
    } catch {
      setLoginErr('Error al iniciar sesión. Intenta de nuevo.')
    } finally {
      setLoginLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setGoogleLoading(true)
    try {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/moderador/acceso`,
          queryParams: { access_type: 'offline', prompt: 'consent' },
        },
      })
    } catch { setLoginErr('Error al iniciar con Google.') }
    finally { setGoogleLoading(false) }
  }
  const handleAplicar = async () => {
    if (!nombre.trim() || !correo.trim() || !estadoMx || !bio.trim()) {
      setApplyErr('Completa todos los campos.')
      return
    }
    if (!correo.includes('@') || !correo.includes('.')) {
      setApplyErr('Ingresa un correo válido.')
      return
    }
    if (newPwd.length < 8) {
      setApplyErr('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    if (newPwd !== confirmPwd) {
      setApplyErr('Las contraseñas no coinciden.')
      return
    }
    setApplying(true)
    setApplyErr('')
    try {
      let userId: string | null = null

      // Intentar crear cuenta nueva
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email:    correo.trim().toLowerCase(),
        password: newPwd,
        options: { data: { nombre: nombre.trim() } },
      })

      if (authErr) {
        // Si ya existe la cuenta, hacer login para obtener el user_id
        if (authErr.message.toLowerCase().includes('already registered') ||
            authErr.message.toLowerCase().includes('already been registered')) {
          setApplyErr('Ya tienes una cuenta en Handeia. Inicia sesión en la plataforma y solicita ser moderador desde tu perfil de Creadores.')
          return
        } else {
          setApplyErr('Error al crear la cuenta: ' + authErr.message)
          return
        }
      } else {
        userId = authData.user?.id ?? null
      }

      if (!userId) { setApplyErr('No se pudo obtener el usuario. Intenta de nuevo.'); return }

      // Verificar que no tenga ya una solicitud pendiente
      const { data: existing } = await supabase
        .from('moderator_applications')
        .select('id, status')
        .eq('user_id', userId)
        .single()

      if (existing) {
        const msgs: Record<string, string> = {
          pendiente: 'Ya tienes una solicitud en revisión. Te contactaremos en 24-72 horas.',
          aprobado:  'Tu solicitud ya fue aprobada. Usa el login de moderador para entrar.',
          rechazado: 'Tu solicitud anterior fue rechazada. Contacta a soporte.',
        }
        setApplyErr(msgs[existing.status] ?? 'Ya tienes una solicitud registrada.')
        return
      }

      const { error } = await supabase.from('moderator_applications').insert({
        tipo,
        nombre:    nombre.trim(),
        correo:    correo.trim().toLowerCase(),
        estado_mx: estadoMx,
        bio:       bio.trim(),
        user_id:   userId,
        status:    'pendiente',
      })
      if (error) throw error
      setVista('enviado')
    } catch {
      setApplyErr('No se pudo enviar la solicitud. Intenta de nuevo.')
    } finally {
      setApplying(false)
    }
  }

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600&display=swap');
        .np, .np * { font-family: 'Geist', system-ui, sans-serif; -webkit-font-smoothing: antialiased; }
        .s { font-family: 'Instrument Serif', Georgia, serif; }
        .np input:focus, .np select:focus, .np textarea:focus { outline: none !important; box-shadow: none !important; }
        @keyframes fu { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
        .fu { animation: fu 380ms cubic-bezier(.16,1,.3,1) both; }
      `}</style>

      <div className="np min-h-screen bg-[#fafaf9] dark:bg-[#0c0a09] flex flex-col">

        {/* Header mínimo */}
        <div className="px-8 pt-8 pb-0 flex items-center justify-between">
          <button
            onClick={() => navigate('/home')}
            className="flex items-center gap-1.5 text-[12.5px] font-medium text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
            Volver al inicio
          </button>
          <button
            onClick={() => navigate('/home')}
            className="flex items-center gap-2 hover:opacity-60 transition-opacity"
          >
            <svg className="w-5 h-5 text-[#2FAF8F]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
            </svg>
            <span className="text-[13px] font-semibold text-stone-800 dark:text-stone-100 tracking-tight">GANDIA 7</span>
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center px-8 py-16">
          <div className="w-full max-w-[420px]">

            {/* SELECCIÓN */}
            {vista === 'seleccion' && (
              <div className="fu">
                <h1 className="s text-[28px] text-stone-900 dark:text-stone-50 mb-2">
                  Moderadores<span style={{ color: '#2FAF8F' }}>.</span>
                </h1>
                <p className="text-[13px] text-stone-400 dark:text-stone-500 mb-10 leading-[1.65]">
                  Expertos del sector ganadero que ayudan a verificar y mejorar el contenido de Handeia Radar.
                </p>

                <div className="space-y-3">
                  <button
                    onClick={() => setVista('login')}
                    className="w-full p-4 rounded-xl border border-stone-200 dark:border-stone-800/60 bg-white dark:bg-[#141210] hover:border-stone-300 dark:hover:border-stone-700 text-left transition-all group"
                  >
                    <p className="text-[13.5px] font-semibold text-stone-800 dark:text-stone-100 mb-0.5 group-hover:text-[#2FAF8F] transition-colors">
                      Ya tengo cuenta
                    </p>
                    <p className="text-[12px] text-stone-400 dark:text-stone-500">
                      Iniciar sesión con mis credenciales de moderador
                    </p>
                  </button>

                  <button
                    onClick={() => setVista('aplicar')}
                    className="w-full p-4 rounded-xl border border-stone-200 dark:border-stone-800/60 bg-white dark:bg-[#141210] hover:border-stone-300 dark:hover:border-stone-700 text-left transition-all group"
                  >
                    <p className="text-[13.5px] font-semibold text-stone-800 dark:text-stone-100 mb-0.5 group-hover:text-[#2FAF8F] transition-colors">
                      Quiero unirme
                    </p>
                    <p className="text-[12px] text-stone-400 dark:text-stone-500">
                      Enviar solicitud para ser moderador verificado
                    </p>
                  </button>
                </div>

                <p className="text-center text-[11.5px] text-stone-300 dark:text-stone-600 mt-8">
                  El acceso es revisado y aprobado manualmente por el equipo de Handeia.
                </p>
              </div>
            )}

            {/* LOGIN */}
            {vista === 'login' && (
              <div className="fu">
                <button
                  onClick={() => setVista('seleccion')}
                  className="flex items-center gap-1.5 text-[12px] text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors mb-8"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
                    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
                  </svg>
                  Volver
                </button>

                <h1 className="s text-[24px] text-stone-900 dark:text-stone-50 mb-1">Iniciar sesión</h1>
                <p className="text-[13px] text-stone-400 dark:text-stone-500 mb-8">Acceso exclusivo para moderadores verificados</p>

                <div className="space-y-3 mb-6">
                  <div>
                    <label className="text-[11px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-[0.08em] mb-2 block">
                      Correo electrónico
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="tu@correo.com"
                      className="w-full h-11 px-4 rounded-xl border border-stone-200 dark:border-stone-800/60 bg-white dark:bg-[#141210] text-[14px] text-stone-800 dark:text-stone-100 placeholder-stone-300 dark:placeholder-stone-600"
                      style={{ outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-[0.08em] mb-2 block">
                      Contraseña
                    </label>
                    <div className="relative">
                      <input
                        type={showPwd ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') void handleLogin() }}
                        placeholder="••••••••"
                        className="w-full h-11 px-4 pr-10 rounded-xl border border-stone-200 dark:border-stone-800/60 bg-white dark:bg-[#141210] text-[14px] text-stone-800 dark:text-stone-100 placeholder-stone-300 dark:placeholder-stone-600"
                        style={{ outline: 'none' }}
                      />
                      <button
                        onMouseDown={e => { e.preventDefault(); setShowPwd(p => !p) }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-300 dark:text-stone-600 hover:text-stone-500 transition-colors"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
                          {showPwd
                            ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></>
                            : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
                          }
                        </svg>
                      </button>
                    </div>
                    {/* indicador de fuerza solo en registro, no aquí */}
                  </div>
                </div>

                {loginErr && (
                  <p className="text-[12px] text-rose-500 mb-4">{loginErr}</p>
                )}

                <button
                  onClick={() => void handleLogin()}
                  disabled={loginLoading || !email.trim() || !password}
                  className="w-full h-11 rounded-xl bg-[#2FAF8F] hover:bg-[#27a07f] text-white text-[13.5px] font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mb-3"
                >
                  {loginLoading ? (
                    <div className="w-4 h-4 border-[1.5px] border-white/30 border-t-white rounded-full animate-spin" />
                  ) : 'Entrar'}
                </button>

                <div className="flex items-center gap-3 mb-3">
                  <div className="flex-1 h-px bg-stone-100 dark:bg-stone-800/60" />
                  <span className="text-[11px] text-stone-300 dark:text-stone-600">o</span>
                  <div className="flex-1 h-px bg-stone-100 dark:bg-stone-800/60" />
                </div>

                <button
                  onClick={() => void handleGoogleLogin()}
                  disabled={googleLoading}
                  className="w-full h-11 rounded-xl border border-stone-200 dark:border-stone-800/60 bg-white dark:bg-[#141210] text-[13px] font-medium text-stone-700 dark:text-stone-300 hover:border-stone-300 dark:hover:border-stone-700 transition-all flex items-center justify-center gap-2.5 disabled:opacity-50"
                >
                  {googleLoading ? (
                    <div className="w-4 h-4 border-[1.5px] border-stone-300 border-t-stone-600 rounded-full animate-spin" />
                  ) : (
                    <>
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                      Continuar con Google
                    </>
                  )}
                </button>
              </div>
            )}

            {/* APLICAR */}
            {vista === 'aplicar' && (
              <div className="fu">
                <button
                  onClick={() => setVista('seleccion')}
                  className="flex items-center gap-1.5 text-[12px] text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors mb-8"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
                    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
                  </svg>
                  Volver
                </button>

                <h1 className="s text-[24px] text-stone-900 dark:text-stone-50 mb-1">Solicitar acceso</h1>
                <p className="text-[13px] text-stone-400 dark:text-stone-500 mb-8 leading-[1.6]">
                  El equipo de Handeia revisará tu solicitud. Te contactaremos por correo.
                </p>

                <div className="space-y-4 mb-6">
                  {/* Tipo */}
                  <div>
                    <label className="text-[11px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-[0.08em] mb-2 block">
                      Especialidad
                    </label>
                    <select
                      value={tipo}
                      onChange={e => setTipo(e.target.value)}
                      className="w-full h-11 px-4 rounded-xl border border-stone-200 dark:border-stone-800/60 bg-white dark:bg-[#141210] text-[13.5px] text-stone-800 dark:text-stone-100"
                      style={{ outline: 'none' }}
                    >
                      {TIPOS.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                    </select>
                  </div>

                  {/* Nombre */}
                  <div>
                    <label className="text-[11px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-[0.08em] mb-2 block">
                      Nombre completo
                    </label>
                    <input
                      type="text"
                      value={nombre}
                      onChange={e => setNombre(e.target.value)}
                      placeholder="Dr. Juan García Hernández"
                      className="w-full h-11 px-4 rounded-xl border border-stone-200 dark:border-stone-800/60 bg-white dark:bg-[#141210] text-[13.5px] text-stone-800 dark:text-stone-100 placeholder-stone-300 dark:placeholder-stone-600"
                      style={{ outline: 'none' }}
                    />
                  </div>

                  {/* Correo */}
                  <div>
                    <label className="text-[11px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-[0.08em] mb-2 block">
                      Correo de contacto
                    </label>
                    <input
                      type="email"
                      value={correo}
                      onChange={e => setCorreo(e.target.value)}
                      placeholder="tu@correo.com"
                      className="w-full h-11 px-4 rounded-xl border border-stone-200 dark:border-stone-800/60 bg-white dark:bg-[#141210] text-[13.5px] text-stone-800 dark:text-stone-100 placeholder-stone-300 dark:placeholder-stone-600"
                      style={{ outline: 'none' }}
                    />
                  </div>

                  {/* Estado */}
                  <div>
                    <label className="text-[11px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-[0.08em] mb-2 block">
                      Estado
                    </label>
                    <select
                      value={estadoMx}
                      onChange={e => setEstadoMx(e.target.value)}
                      className="w-full h-11 px-4 rounded-xl border border-stone-200 dark:border-stone-800/60 bg-white dark:bg-[#141210] text-[13.5px] text-stone-800 dark:text-stone-100"
                      style={{ outline: 'none' }}
                    >
                      <option value="">Seleccionar...</option>
                      {ESTADOS_MX.map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                  </div>

                  {/* Bio */}
                  <div>
                    <label className="text-[11px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-[0.08em] mb-2 block">
                      Experiencia y motivación
                    </label>
                    <textarea
                      value={bio}
                      onChange={e => setBio(e.target.value)}
                      placeholder="Cuéntanos brevemente tu experiencia en el sector y por qué quieres ser moderador..."
                      rows={4}
                      className="w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-800/60 bg-white dark:bg-[#141210] text-[13.5px] text-stone-800 dark:text-stone-100 placeholder-stone-300 dark:placeholder-stone-600 resize-none leading-[1.7]"
                      style={{ outline: 'none' }}
                    />
                  </div>

                  {/* Contraseña */}
                  <div>
                    <label className="text-[11px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-[0.08em] mb-2 block">
                      Contraseña
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPwd ? 'text' : 'password'}
                        value={newPwd}
                        onChange={e => setNewPwd(e.target.value)}
                        placeholder="Mínimo 8 caracteres"
                        className="w-full h-11 px-4 pr-10 rounded-xl border border-stone-200 dark:border-stone-800/60 bg-white dark:bg-[#141210] text-[13.5px] text-stone-800 dark:text-stone-100 placeholder-stone-300 dark:placeholder-stone-600"
                        style={{ outline: 'none' }}
                      />
                      <button onMouseDown={e => { e.preventDefault(); setShowNewPwd(p => !p) }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-300 dark:text-stone-600 hover:text-stone-500 transition-colors">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
                          {showNewPwd
                            ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></>
                            : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
                          }
                        </svg>
                      </button>
                    </div>
                    {newPwd.length > 0 && (() => {
                      const f = fuerzaPassword(newPwd)
                      return (
                        <div className="mt-2">
                          <div className="flex gap-1 mb-1">
                            {[1,2,3,4,5].map(i => (
                              <div key={i} className="flex-1 h-[3px] rounded-full transition-all duration-300"
                                style={{ background: i <= f.nivel ? f.color : '#e5e7eb' }} />
                            ))}
                          </div>
                          <p className="text-[10.5px] font-medium" style={{ color: f.color }}>{f.texto}</p>
                        </div>
                      )
                    })()}
                  </div>

                  {/* Confirmar contraseña */}
                  <div>
                    <label className="text-[11px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-[0.08em] mb-2 block">
                      Confirmar contraseña
                    </label>
                    <input
                      type="password"
                      value={confirmPwd}
                      onChange={e => setConfirmPwd(e.target.value)}
                      placeholder="Repite la contraseña"
                      className={`w-full h-11 px-4 rounded-xl border bg-white dark:bg-[#141210] text-[13.5px] text-stone-800 dark:text-stone-100 placeholder-stone-300 dark:placeholder-stone-600 transition-colors ${
                        confirmPwd.length > 0
                          ? newPwd === confirmPwd ? 'border-[#2FAF8F]/60' : 'border-red-400/60'
                          : 'border-stone-200 dark:border-stone-800/60'
                      }`}
                      style={{ outline: 'none' }}
                    />
                    {confirmPwd.length > 0 && newPwd !== confirmPwd && (
                      <p className="text-[10.5px] text-red-500 mt-1.5">Las contraseñas no coinciden</p>
                    )}
                  </div>
                </div>

                {applyErr && (
                  <p className="text-[12px] text-rose-500 mb-4">{applyErr}</p>
                )}

                <button
                  onClick={() => void handleAplicar()}
                  disabled={applying || !nombre.trim() || !correo.trim() || !estadoMx || !bio.trim() || newPwd.length < 8 || newPwd !== confirmPwd}
                  className="w-full h-11 rounded-xl bg-[#2FAF8F] hover:bg-[#27a07f] text-white text-[13.5px] font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {applying ? (
                    <div className="w-4 h-4 border-[1.5px] border-white/30 border-t-white rounded-full animate-spin" />
                  ) : 'Enviar solicitud'}
                </button>

                <p className="text-center text-[11px] text-stone-300 dark:text-stone-600 mt-4">
                  No compartiremos tu información con terceros.
                </p>
              </div>
            )}

            {/* ENVIADO */}
            {vista === 'enviado' && (
              <div className="fu text-center">
                <div className="w-14 h-14 rounded-2xl bg-[#2FAF8F]/10 flex items-center justify-center mx-auto mb-5">
                  <svg className="w-7 h-7 text-[#2FAF8F]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <h2 className="text-[18px] font-semibold text-stone-900 dark:text-stone-50 mb-2">
                  Solicitud enviada
                </h2>
                <p className="text-[13px] text-stone-400 dark:text-stone-500 leading-[1.7] mb-8 max-w-[320px] mx-auto">
                  Revisaremos tu solicitud y te contactaremos al correo que proporcionaste. El proceso toma entre 24 y 72 horas.
                </p>
                <button
                  onClick={() => navigate('/home')}
                  className="h-9 px-6 rounded-xl text-[13px] font-medium text-stone-600 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
                >
                  Volver al inicio
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  )
}