import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'

// Layouts
import PublicLayout from '../layout/PublicLayout'
import AppLayout from '../layout/AppLayout'

// Páginas públicas
import Splash from '../pages/Splash/Splash'
import Login from '../pages/Login/Login'
import SignUpAuth from '../pages/SignUp/SignUpAuth'
import SignUpPersonal from '../pages/SignUp/SignUpPersonal'
import SignUpInstitutional from '../pages/SignUp/SignUpInstitutional'
import SignUpConfirmation from '../pages/SignUp/SignUpConfirmation'

// Páginas legales
import LegalPage from '../pages/Legal/LegalPage'
import CompliancePage from '../pages/Compliance/CompliancePage'
import ModeloOperativoPage from '../pages/ModeloOperativo/ModeloOperativoPage'

// Blog
import BlogPage from '../pages/Blog/BlogPage'
import BlogPostPage from '../pages/Blog/BlogPostPage'

// Contacto
import ContactoPage from '../pages/Contacto/ContactoPage'

// Recursos
import RecursosPage from '../pages/Recursos/RecursosPage'

// Onboarding — solo primer login
import OnboardingPage from '../pages/Onboarding/OnboardingPage'
import TourPage from '../pages/Onboarding/TourPage'

// Páginas privadas
import Home from '../pages/Home/Home'
import Chat from '../pages/Chat/Chat'
import Historial from '../pages/Historial/Historial'
import NotificacionesPage from '../pages/Notificaciones/NotificacionesPage'
import Configuraciones from '../pages/Configuraciones/Configuraciones'
import Voz from '../pages/Voz/Voz'
import Ayuda from '../pages/help/help'
import Tramites from '../pages/tramites/tramites'
import TramitesPanel from '../pages/tramites/tramitesPanel'
import Plan from '../pages/Plan/Plan'

// Noticias IA
import NoticiasPage from '../pages/Noticias/NoticiasPage'
import NoticiaDetallePage from '../pages/Noticias/NoticiaDetallePage'

// Admin
import AdminPanel from '../pages/Admin/AdminPanel'

// ── Perfil unificado por rol ─────────────────────────────────────────────────
import { PerfilRouter, PerfilEditRouter } from '../pages/PerfilRancho/PerfilRouter'

// Página de errores
import NotFound from '../pages/NotFound/NotFound'

// ── Guard: solo usuarios con sesión activa ───────────────────────────────────
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const [checking, setChecking] = useState(true)
  const [allowed,  setAllowed]  = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setAllowed(true)
      } else {
        navigate('/login', { replace: true })
      }
      setChecking(false)
    })
  }, [navigate])

  if (checking) return null
  return allowed ? <>{children}</> : null
}

function Router() {
  return (
    <Routes>
      {/* ── RUTAS PÚBLICAS ────────────────────────────────────────── */}
      <Route element={<PublicLayout />}>
        <Route path="/splash"  element={<Splash />} />
        <Route path="/home"    element={<Home />} />
        <Route path="/login"   element={<Login />} />

        {/* Registro por pasos */}
        <Route path="/signup"               element={<SignUpAuth />} />
        <Route path="/signup/personal"      element={<SignUpPersonal />} />
        <Route path="/signup/institutional" element={<SignUpInstitutional />} />
        <Route path="/signup/confirmation"  element={<SignUpConfirmation />} />

        {/* Páginas legales e institucionales */}
        <Route path="/legal"            element={<LegalPage />} />
        <Route path="/compliance"       element={<CompliancePage />} />
        <Route path="/modelo-operativo" element={<ModeloOperativoPage />} />

        {/* Blog */}
        <Route path="/blog"       element={<BlogPage />} />
        <Route path="/blog/:slug" element={<BlogPostPage />} />

        {/* Contacto */}
        <Route path="/contacto" element={<ContactoPage />} />

        {/* Recursos */}
        <Route path="/recursos" element={<RecursosPage />} />

        {/* Onboarding — primer login, requiere sesión */}
        <Route
          path="/onboarding"
          element={
            <OnboardingGuard>
              <OnboardingPage />
            </OnboardingGuard>
          }
        />

        {/* Panel de administración */}
        <Route path="/admin/panel" element={<AdminPanel />} />
      </Route>

      {/* ── RUTAS PRIVADAS ────────────────────────────────────────── */}
      <Route element={<AppLayout />}>
        <Route path="/chat"            element={<Chat />} />
        <Route path="/tour"            element={<TourPage />} />
        <Route path="/historial"       element={<Historial />} />
        <Route path="/notificaciones"  element={<NotificacionesPage />} />
        <Route path="/configuraciones" element={<Configuraciones />} />
        <Route path="/voz"             element={<Voz />} />
        <Route path="/ayuda"           element={<Ayuda />} />
        <Route path="/plan"            element={<Plan />} />

        {/* ── Accesos directos a artefactos — abren chat con artefacto activo ── */}
        <Route path="/pasaportes"    element={<Navigate to="/chat?artifact=passport"      replace />} />
        <Route path="/gemelos"       element={<Navigate to="/chat?artifact=twins"         replace />} />
        <Route path="/monitoreo"     element={<Navigate to="/chat?artifact=monitoring"    replace />} />
        <Route path="/certificacion" element={<Navigate to="/chat?artifact=certification" replace />} />
        <Route path="/verificacion"  element={<Navigate to="/chat?artifact=verification"  replace />} />

        {/* ── Trámites ────────────────────────────────────────────── */}
        <Route path="/tramites"       element={<Tramites />} />
        <Route path="/tramites/panel" element={<TramitesPanel />} />

        {/* ── Noticias IA ─────────────────────────────────────────── */}
        <Route path="/noticias"     element={<NoticiasPage />} />
        <Route path="/noticias/:id" element={<NoticiaDetallePage />} />

        {/* ── Perfil unificado — detecta rol automáticamente ──────── */}
        <Route path="/perfil"        element={<PerfilRouter />} />
        <Route path="/perfil/editar" element={<PerfilEditRouter />} />

        {/* Redirects de compatibilidad — rutas viejas → /perfil */}
        <Route path="/perfil-rancho"             element={<Navigate to="/perfil" replace />} />
        <Route path="/perfil-rancho/editar"      element={<Navigate to="/perfil/editar" replace />} />
        <Route path="/perfil-mvz"                element={<Navigate to="/perfil" replace />} />
        <Route path="/perfil-mvz/editar"         element={<Navigate to="/perfil/editar" replace />} />
        <Route path="/perfil-ug"                 element={<Navigate to="/perfil" replace />} />
        <Route path="/perfil-ug/editar"          element={<Navigate to="/perfil/editar" replace />} />
        <Route path="/perfil-exportador"         element={<Navigate to="/perfil" replace />} />
        <Route path="/perfil-exportador/editar"  element={<Navigate to="/perfil/editar" replace />} />
        <Route path="/perfil-auditor"            element={<Navigate to="/perfil" replace />} />
        <Route path="/perfil-auditor/editar"     element={<Navigate to="/perfil/editar" replace />} />
      </Route>

      {/* ── ERRORES ───────────────────────────────────────────────── */}
      <Route path="/error/:errorType" element={<NotFound />} />

      {/* Redirección raíz */}
      <Route path="/" element={<Navigate to="/splash" replace />} />

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default Router