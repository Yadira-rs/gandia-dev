/**
 * GANDIA — PerfilRouter
 * Lee el rol del UserContext y renderiza el componente de perfil correcto.
 * Usado en las rutas /perfil y /perfil/editar del AppLayout.
 */

import { useUser } from '../../context/UserContext'

// Vistas de perfil (view)
import PerfilRancho      from './PerfilRancho'
import PerfilMVZ         from '../PerfilMVZ/PerfilMVZ'
import PerfilUG          from '../PerfilUG/PerfilUG'
import PerfilExportador  from '../PerfilExportador/PerfilExportador'
import PerfilAuditor     from '../PerfilAuditor/PerfilAuditor'

// Vistas de edición
import PerfilRanchoEdit     from './PerfilRanchoEdit'
import PerfilMVZEdit        from '../PerfilMVZ/PerfilMVZEdit'
import PerfilUGEdit         from '../PerfilUG/PerfilUGEdit'
import PerfilExportadorEdit from '../PerfilExportador/PerfilExportadorEdit'
import PerfilAuditorEdit    from '../PerfilAuditor/PerfilAuditorEdit'

// ─────────────────────────────────────────────
// LOADING SKELETON
// ─────────────────────────────────────────────

const ProfileSkeleton = () => (
  <div className="min-h-screen bg-stone-50 dark:bg-[#0c0a09] flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="w-10 h-10 border-2 border-[#2FAF8F] border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-stone-500 dark:text-stone-400">Cargando perfil...</p>
    </div>
  </div>
)

// ─────────────────────────────────────────────
// ROL DESCONOCIDO
// ─────────────────────────────────────────────

const RolDesconocido = () => (
  <div className="min-h-screen bg-stone-50 dark:bg-[#0c0a09] flex items-center justify-center px-6">
    <div className="max-w-sm w-full bg-white dark:bg-[#1C1C1E] border border-stone-200 dark:border-stone-800 rounded-2xl p-8 text-center">
      <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center mx-auto mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6 text-amber-600 dark:text-amber-400">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h2 className="text-base font-semibold text-stone-900 dark:text-stone-50 mb-2">
        Perfil no configurado
      </h2>
      <p className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
        Tu cuenta no tiene un rol asignado. Contacta a soporte: <span className="text-[#2FAF8F] font-medium">soporte@gandia.mx</span>
      </p>
    </div>
  </div>
)

// ─────────────────────────────────────────────
// MAPA ROL → COMPONENTE
// ─────────────────────────────────────────────

const PERFIL_VIEW: Record<string, React.ComponentType> = {
  producer: PerfilRancho,
  mvz:      PerfilMVZ,
  union:    PerfilUG,
  exporter: PerfilExportador,
  auditor:  PerfilAuditor,
}

const PERFIL_EDIT: Record<string, React.ComponentType> = {
  producer: PerfilRanchoEdit,
  mvz:      PerfilMVZEdit,
  union:    PerfilUGEdit,
  exporter: PerfilExportadorEdit,
  auditor:  PerfilAuditorEdit,
}

// ─────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────

export const PerfilRouter = () => {
  const { role, isLoading, profile } = useUser()

  // Solo mostrar skeleton en la carga inicial (no al volver a la ruta)
  if (isLoading && !profile) return <ProfileSkeleton />

  const Component = role ? PERFIL_VIEW[role] : null
  if (!Component) return <RolDesconocido />

  return <Component />
}

export const PerfilEditRouter = () => {
  const { role, isLoading, profile } = useUser()

  if (isLoading && !profile) return <ProfileSkeleton />

  const Component = role ? PERFIL_EDIT[role] : null
  if (!Component) return <RolDesconocido />

  return <Component />
}