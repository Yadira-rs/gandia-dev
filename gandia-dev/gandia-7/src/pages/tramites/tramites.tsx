import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../../context/UserContext'

/**
 * /tramites — punto de entrada
 * Utiliza el rol global que ya proporciona UserContext.
 *   union_ganadera  →  /tramites/panel
 *   todos los demás →  /chat (con contexto tramites)
 */
export default function Tramites() {
  const navigate = useNavigate()
  const { role, profileReady, authStatus } = useUser()

  useEffect(() => {
    // Si aún no sabemos quién es o no ha cargado el rol de la BDD, esperamos.
    if (!profileReady && authStatus !== 'unauthenticated') return

    if (authStatus === 'unauthenticated') {
      navigate('/login', { replace: true })
      return
    }

    if (role === 'union' || (role as string) === 'union_ganadera') {
      navigate('/tramites/panel', { replace: true })
    } else {
      // Para mvz, productor, exportador, auditor, y otros sin panel propio:
      navigate('/chat', { replace: true, state: { openDocumentos: true } })
    }
  }, [navigate, role, profileReady, authStatus])

  return null
}