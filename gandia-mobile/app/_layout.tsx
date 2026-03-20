// app/_layout.tsx — Root layout con fuentes + providers
import 'react-native-url-polyfill/auto'
import { useEffect } from 'react'
import { Stack, useRouter } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useFonts } from 'expo-font'
import * as SplashScreen from 'expo-splash-screen'
import * as Linking from 'expo-linking'
import * as WebBrowser from 'expo-web-browser'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { UserProvider } from '../src/context/UserContext'
import { NotificationsProvider } from '../src/context/NotificationsContext'
import { supabase } from '../src/lib/supabaseClient'

SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const router = useRouter()

  const [fontsLoaded, fontError] = useFonts({
    'InstrumentSerif-Italic': require('../assets/fonts/InstrumentSerif-Italic.ttf'),
    'Geist-Regular':          require('../assets/fonts/Geist-Regular.ttf'),
    'Geist-Medium':           require('../assets/fonts/Geist-Medium.ttf'),
    'Geist-SemiBold':         require('../assets/fonts/Geist-SemiBold.ttf'),
  })

  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync()
  }, [fontsLoaded, fontError])

  // ── Manejar deep links OAuth (dev build) ─────────────────────────────────
  // Con expo run:android, Chrome redirige a gandia-mobile://signup/personal?code=...
  // Android intercepta el scheme y abre la app con esa URL.
  useEffect(() => {
    const handleUrl = async (url: string) => {
      console.log('[DeepLink] URL recibida:', url)
      if (!url.includes('code=') && !url.includes('access_token=')) return

      try {
        WebBrowser.dismissBrowser()

        const { error } = await supabase.auth.exchangeCodeForSession(url)
        if (error) { console.error('[DeepLink] exchangeCodeForSession error:', error); return }

        console.log('[DeepLink] sesión OAuth establecida ✓')
        await AsyncStorage.setItem('signup-auth-method', 'google')
        router.replace('/(public)/signup/personal' as any)
      } catch (e) {
        console.error('[DeepLink] error:', e)
      }
    }

    Linking.getInitialURL().then(url => { if (url) handleUrl(url) })
    const sub = Linking.addEventListener('url', ({ url }) => handleUrl(url))
    return () => sub.remove()
  }, [])

  if (!fontsLoaded && !fontError) return null

  return (
    <UserProvider>
      <NotificationsProvider>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false }} />
      </NotificationsProvider>
    </UserProvider>
  )
}