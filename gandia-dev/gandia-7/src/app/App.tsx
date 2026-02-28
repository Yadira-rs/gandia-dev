import { useEffect } from 'react'
import { BrowserRouter, useNavigate, useLocation } from 'react-router-dom'
import Router from './Router'
import { checkProfileExists, getCurrentProfile } from '../lib/authService'
import { UserProvider } from '../context/UserContext'
import { NotificationsProvider } from '../context/NotificationsContext'
import { supabase } from '../lib/supabaseClient'

const AuthHandler = () => {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔐 Auth event:', event, '@ path:', location.pathname)

      if (location.pathname.startsWith('/admin')) return
      if (location.pathname.startsWith('/signup')) return

      // ── Refresh de página o login: verificar si ya tiene perfil y redirigir ──
      if (
        (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') &&
        session?.user
      ) {
        const user  = session.user
        const email = user.email ?? ''

        // Si ya está en una ruta privada, no redirigir
        const privateRoutes = ['/chat', '/historial', '/notificaciones', '/configuraciones',
          '/voz', '/ayuda', '/plan', '/tramites', '/noticias', '/perfil', '/onboarding']
        const isAlreadyPrivate = privateRoutes.some(r => location.pathname.startsWith(r))
        if (isAlreadyPrivate) return

        const alreadyHasProfile = email ? await checkProfileExists(email) : false

        if (alreadyHasProfile) {
          try {
            const profile = await getCurrentProfile()
            if (profile?.status === 'approved') {
              // Primera vez en el sistema → pantalla de configuración
              const onboardingDone = profile?.onboarding_completed ?? true
              navigate(onboardingDone ? '/chat' : '/onboarding', { replace: true })
            } else {
              const accountId = profile?.account_id || ''
              localStorage.setItem('signup-completed', 'true')
              localStorage.setItem('user-status', profile?.status ?? 'pending')
              if (accountId) localStorage.setItem('account-id', accountId)
              navigate('/signup', { replace: true })
            }
          } catch {
            navigate('/chat', { replace: true })
          }
          return
        }

        // Usuario nuevo sin perfil
        const provider = (user.app_metadata?.provider as string | undefined) ?? 'email'
        localStorage.setItem('signup-auth-method', provider)
        if (email) localStorage.setItem('signup-email', email)
        navigate('/signup/personal', { replace: true })
      }

      if (event === 'SIGNED_OUT') {
        ;['signup-auth-method', 'signup-email', 'signup-personal-data',
          'signup-institutional-data', 'signup-completed', 'user-status', 'account-id',
        ].forEach(key => localStorage.removeItem(key))
        navigate('/login', { replace: true })
      }
    })

    return () => subscription.unsubscribe()
  }, [navigate, location.pathname])

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