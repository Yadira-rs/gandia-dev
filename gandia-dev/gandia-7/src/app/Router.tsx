import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'

// Layouts
import PublicLayout  from '../layout/PublicLayout'
import AppLayout     from '../layout/AppLayout'

// Páginas públicas
import Splash               from '../pages/Splash/Splash'
import Login                from '../pages/Login/Login'
import SignUpAuth           from '../pages/SignUp/SignUpAuth'
import SignUpPersonal       from '../pages/SignUp/SignUpPersonal'
import SignUpInstitutional  from '../pages/SignUp/SignUpInstitutional'
import SignUpConfirmation   from '../pages/SignUp/SignUpConfirmation'
import LegalPage            from '../pages/Legal/LegalPage'
import CompliancePage       from '../pages/Compliance/CompliancePage'
import ModeloOperativoPage  from '../pages/ModeloOperativo/ModeloOperativoPage'
import BlogPage             from '../pages/Blog/BlogPage'
import BlogPostPage         from '../pages/Blog/BlogPostPage'
import CoursesPage          from '../pages/Courses/CoursesPage'
import ContactoPage         from '../pages/Contacto/ContactoPage'
import RecursosPage         from '../pages/Recursos/RecursosPage'
import OnboardingPage       from '../pages/Onboarding/OnboardingPage'
import TourPage             from '../pages/Onboarding/TourPage'
import Home                 from '../pages/Home/Home'

// Páginas privadas — existentes
import Chat                 from '../pages/Chat/Chat'
import Historial            from '../pages/Historial/Historial'
import NotificacionesPage   from '../pages/Notificaciones/NotificacionesPage'
import Configuraciones      from '../pages/Configuraciones/Configuraciones'
import Voz                  from '../pages/Voz/Voz'
import Ayuda                from '../pages/help/help'
import Tramites             from '../pages/tramites/tramites'
import TramitesPanel        from '../pages/tramites/tramitesPanel'
import Plan                 from '../pages/Plan/Plan'
import AdminPanel           from '../pages/Admin/AdminPanel'
import { PerfilRouter, PerfilEditRouter } from '../pages/PerfilRancho/PerfilRouter'
import NotFound             from '../pages/NotFound/NotFound'

// Páginas privadas — Radar (nuevas / modificadas)
import NoticiasPage         from '../pages/Noticias/NoticiasPage'
import NoticiaDetallePage   from '../pages/Noticias/NoticiaDetallePage'
import RadarSearchPage      from '../pages/Radar/RadarSearchPage'
import AlertasPage          from '../pages/Alertas/AlertasPage'

// Creadores (nuevas)
import CreadorHomePage      from '../pages/Creadores/CreadorHomePage'
import CreadorFormPage      from '../pages/Creadores/CreadorFormPage'
import CreadorSolicitarPage from '../pages/Creadores/Creadorsolicitarpage'
import { CreadorPerfilPage } from '../pages/Creadores/CreadorPerfilPage'
import ModeradorAccesoPage  from '../pages/Moderador/ModeradorAccesoPage'
import ModeradorPanelPage   from '../pages/Moderador/ModeradorPanelPage'

// ── Wiki Handeia ──────────────────────────────────────────────────────────────
import WikiHomePage         from '../pages/Wiki/WikiHomePage'
import WikiDominioPage      from '../pages/Wiki/WikiDominioPage'
import WikiHechoPage        from '../pages/Wiki/WikiHechoPage'
import CreadorWikiPage      from '../pages/Creadores/CreadorWikiPage'

import { useUser }  from '../context/UserContext'
import { useEffect } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// ProtectedLayout
// ─────────────────────────────────────────────────────────────────────────────
function ProtectedLayout() {
  const { authStatus } = useUser()
  const location = useLocation()

  if (authStatus === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0c0a09]">
        <div className="w-5 h-5 border-2 border-[#2FAF8F] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (authStatus === 'unauthenticated') {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <AppLayout />
}

// ─────────────────────────────────────────────────────────────────────────────
// OnboardingGuard
// ─────────────────────────────────────────────────────────────────────────────
function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { authStatus } = useUser()
  const navigate = useNavigate()

  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      navigate('/login', { replace: true })
    }
  }, [authStatus, navigate])

  if (authStatus === 'loading') return null
  return authStatus === 'authenticated' ? <>{children}</> : null
}

// ─────────────────────────────────────────────────────────────────────────────
// Router
// ─────────────────────────────────────────────────────────────────────────────
function Router() {
  return (
    <Routes>

      {/* ── RUTAS PÚBLICAS ───────────────────────────────────────── */}
      <Route element={<PublicLayout />}>
        <Route path="/splash"  element={<Splash />} />
        <Route path="/home"    element={<Home />} />
        <Route path="/login"   element={<Login />} />

        <Route path="/signup"                element={<SignUpAuth />} />
        <Route path="/signup/personal"       element={<SignUpPersonal />} />
        <Route path="/signup/institutional"  element={<SignUpInstitutional />} />
        <Route path="/signup/confirmation"   element={<SignUpConfirmation />} />

        <Route path="/legal"             element={<LegalPage />} />
        <Route path="/compliance"        element={<CompliancePage />} />
        <Route path="/modelo-operativo"  element={<ModeloOperativoPage />} />
        <Route path="/moderador/acceso"  element={<ModeradorAccesoPage />} />
        <Route path="/moderador/panel"   element={<ModeradorPanelPage />} />

        <Route path="/blog"        element={<BlogPage />} />
        <Route path="/blog/:slug"  element={<BlogPostPage />} />

        <Route path="/cursos"    element={<CoursesPage />} />
        <Route path="/contacto"  element={<ContactoPage />} />
        <Route path="/recursos"  element={<RecursosPage />} />

        <Route path="/onboarding" element={
          <OnboardingGuard><OnboardingPage /></OnboardingGuard>
        } />

        <Route path="/admin/panel" element={<AdminPanel />} />
      </Route>

      {/* ── RUTAS PRIVADAS ───────────────────────────────────────── */}
      <Route element={<ProtectedLayout />}>

        {/* Chat */}
        <Route path="/chat"   element={<Chat />} />
        <Route path="/tour"   element={<TourPage />} />

        {/* Historial / Notificaciones / Config */}
        <Route path="/historial"       element={<Historial />} />
        <Route path="/notificaciones"  element={<NotificacionesPage />} />
        <Route path="/configuraciones" element={<Configuraciones />} />
        <Route path="/voz"             element={<Voz />} />
        <Route path="/ayuda"           element={<Ayuda />} />
        <Route path="/plan"            element={<Plan />} />

        {/* Trámites */}
        <Route path="/tramites"        element={<Tramites />} />
        <Route path="/tramites/panel"  element={<TramitesPanel />} />

        {/* ── RADAR / NOTICIAS ───────────────────────────── */}
        <Route path="/noticias"          element={<NoticiasPage />} />
        <Route path="/noticias/search"   element={<RadarSearchPage />} />
        <Route path="/noticias/:id"      element={<NoticiaDetallePage />} />

        {/* ── ALERTAS ────────────────────────────────────── */}
        <Route path="/alertas"  element={<AlertasPage />} />

        {/* ── WIKI HANDEIA ───────────────────────────────── */}
        <Route path="/wiki"                  element={<WikiHomePage />} />
        <Route path="/wiki/dominio/:dominio" element={<WikiDominioPage />} />
        <Route path="/wiki/hecho/:id"        element={<WikiHechoPage />} />

        {/* ── CREADORES ──────────────────────────────────── */}
        <Route path="/creadores"               element={<CreadorHomePage />} />
        <Route path="/creadores/nuevo"         element={<CreadorFormPage />} />
        <Route path="/creadores/solicitar"     element={<CreadorSolicitarPage />} />
        <Route path="/creadores/wiki/nuevo"    element={<CreadorWikiPage />} />
        <Route path="/creadores/:id"           element={<CreadorPerfilPage />} />

        {/* Redirects artefactos */}
        <Route path="/pasaportes"    element={<Navigate to="/chat?artifact=passport"      replace />} />
        <Route path="/gemelos"       element={<Navigate to="/chat?artifact=twins"         replace />} />
        <Route path="/monitoreo"     element={<Navigate to="/chat?artifact=monitoring"    replace />} />
        <Route path="/certificacion" element={<Navigate to="/chat?artifact=certification" replace />} />
        <Route path="/verificacion"  element={<Navigate to="/chat?artifact=verification"  replace />} />

        {/* Perfil */}
        <Route path="/perfil"        element={<PerfilRouter />} />
        <Route path="/perfil/editar" element={<PerfilEditRouter />} />

        {/* Redirects perfil legacy */}
        <Route path="/perfil-rancho"          element={<Navigate to="/perfil"         replace />} />
        <Route path="/perfil-rancho/editar"   element={<Navigate to="/perfil/editar"  replace />} />
        <Route path="/perfil-mvz"             element={<Navigate to="/perfil"         replace />} />
        <Route path="/perfil-mvz/editar"      element={<Navigate to="/perfil/editar"  replace />} />
        <Route path="/perfil-ug"              element={<Navigate to="/perfil"         replace />} />
        <Route path="/perfil-ug/editar"       element={<Navigate to="/perfil/editar"  replace />} />
        <Route path="/perfil-exportador"      element={<Navigate to="/perfil"         replace />} />
        <Route path="/perfil-exportador/editar" element={<Navigate to="/perfil/editar" replace />} />
        <Route path="/perfil-auditor"         element={<Navigate to="/perfil"         replace />} />
        <Route path="/perfil-auditor/editar"  element={<Navigate to="/perfil/editar"  replace />} />
      </Route>

      {/* ── ERRORES ──────────────────────────────────────── */}
      <Route path="/error/:errorType"  element={<NotFound />} />
      <Route path="/"                  element={<Navigate to="/splash" replace />} />
      <Route path="*"                  element={<NotFound />} />

    </Routes>
  )
}

export default Router