import { useEffect } from 'react'
import { useRouter } from 'expo-router'

export default function PerfilRouter() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/(app)/InstitucionalPerfil/Rancho' as any)
  }, [])

  return null
}