import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'

/**
 * /tramites — punto de entrada
 * Lee el rol real desde user_profiles en Supabase.
 *   union_ganadera  →  /tramites/panel
 *   todos los demás →  /chat (con contexto tramites)
 */
export default function Tramites() {
  const navigate = useNavigate()

  useEffect(() => {
    let cancelled = false

    async function redirect() {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        navigate('/login', { replace: true })
        return
      }

      // Intentar primero user_profiles (tabla principal)
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle()

      const role = profile?.role ?? null

      if (cancelled) return

      if (role === 'union_ganadera') {
        navigate('/tramites/panel', { replace: true })
      } else {
        navigate('/chat', { replace: true, state: { context: 'tramites' } })
      }
    }

    redirect()
    return () => { cancelled = true }
  }, [navigate])

  return null
}