// app/(app)/tramites/index.tsx — Gandia 7 · Trámites entry point
// Lee rol desde Supabase directamente (igual que la versión web)
//   union_ganadera  → /(app)/tramites/panel
//   todos los demás → /(app)/chat (contexto tramites)
import { useEffect, useRef } from 'react'
import { View, ActivityIndicator, useColorScheme } from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '../../../src/lib/supabaseClient'

export default function TramitesIndex() {
  const router      = useRouter()
  const colorScheme = useColorScheme()
  const isDark      = colorScheme === 'dark'
  const cancelled   = useRef(false)

  useEffect(() => {
    cancelled.current = false

    async function redirect() {
      // 1. Verificar sesión activa
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        if (!cancelled.current) router.replace('/(public)/login')
        return
      }

      // 2. Leer rol desde user_profiles
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle()

      if (cancelled.current) return

      const role = profile?.role ?? null

      if (role === 'union_ganadera') {
        router.replace('/(app)/tramites/panel')
      } else {
        router.replace({
          pathname: '/(app)/chat',
          params: { context: 'tramites' },
        })
      }
    }

    redirect()
    return () => { cancelled.current = true }
  }, [])

  return (
    <View style={{
      flex: 1,
      backgroundColor: isDark ? '#0c0a09' : '#f2f1f0',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <ActivityIndicator color="#2FAF8F" />
    </View>
  )
}