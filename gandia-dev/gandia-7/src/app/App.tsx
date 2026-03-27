import { useEffect } from 'react'
import { BrowserRouter, useNavigate, useLocation } from 'react-router-dom'
import Router from './Router'
import { UserProvider, useUser } from '../context/UserContext'
import { NotificationsProvider } from '../context/NotificationsContext'

const IGNORE_ROUTES  = ['/splash', '/home', '/blog', '/contacto', '/recursos',
                        '/legal', '/compliance', '/modelo-operativo', '/admin', '/signup', '/campo']

const PRIVATE_ROUTES = ['/chat', '/campo', '/historial', '/notificaciones', '/configuraciones',
                        '/voz', '/ayuda', '/plan', '/tramites', '/noticias', '/perfil',
                        '/onboarding', '/tour']

const SIGN_OUT_KEYS  = ['signup-auth-method', 'signup-email', 'signup-personal-data',
                        'signup-institutional-data', 'signup-completed', 'user-status',
                        'account-id', 'gandia-auth-token']

function AuthHandler() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const { authStatus, hasProfile, profile, profileReady } = useUser()

  useEffect(() => {
    // Esperar hasta que:
    // 1. Supabase resolvió la sesión (authStatus !== 'loading')
    // 2. fetchProfile terminó (profileReady === true)
    // Sin esto, AuthHandler ve hasProfile=false mientras el perfil
    // todavía está cargando y redirige a /signup/personal incorrectamente.
    if (authStatus === 'loading') return
    if (!profileReady) return

    if (authStatus === 'unauthenticated') {
      SIGN_OUT_KEYS.forEach(k => localStorage.removeItem(k))
      return
    }

    const path = location.pathname
    if (IGNORE_ROUTES.some(r => path.startsWith(r))) return
    if (PRIVATE_ROUTES.some(r => path.startsWith(r))) return

    // Desde /login u otras rutas de entrada → redirigir al destino correcto
    if (!hasProfile) {
      navigate('/signup/personal', { replace: true })
      return
    }

    if (profile?.status !== 'approved') {
      if (profile?.account_id) localStorage.setItem('account-id', profile.account_id)
      localStorage.setItem('signup-completed', 'true')
      localStorage.setItem('user-status', profile?.status ?? 'pending')
      navigate('/signup', { replace: true })
      return
    }

    navigate(profile.onboarding_completed ? '/chat' : '/onboarding', { replace: true })

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authStatus, profileReady, hasProfile, profile?.status, profile?.onboarding_completed, profile?.account_id])

  return null
}

function App() {
  return (
    <BrowserRouter>
      <UserProvider>
        <NotificationsProvider>
          <AuthHandler />
          <Router />
        </NotificationsProvider>
      </UserProvider>
    </BrowserRouter>
  )
}

export default App