import { useState, useEffect } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

export function useTheme() {
  const [isDark, setIsDark] = useState(true)

  useEffect(() => {
    AsyncStorage.getItem('gandia-theme').then(v => {
      if (v) setIsDark(v === 'dark')
    })
  }, [])

  const toggle = async () => {
    const next = !isDark
    setIsDark(next)
    await AsyncStorage.setItem('gandia-theme', next ? 'dark' : 'light')
  }

  return { isDark, toggle }
}
