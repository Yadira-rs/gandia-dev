// HOC: redirige a login si no hay sesion
import { useEffect } from 'react'
import { useRouter } from 'expo-router'
import { useUser } from '../../context/UserContext'
import React from 'react'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/(public)/login')
    }
  }, [isAuthenticated, isLoading])

  if (isLoading || !isAuthenticated) return null
  return <>{children}</>
}
