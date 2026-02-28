/**
 * GANDIA — NotificationsContext
 * Contexto global de notificaciones con Supabase Realtime.
 * Se monta en App.tsx junto a UserProvider.
 */

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import { supabase } from '../lib/supabaseClient'
import { getCurrentUser } from '../lib/authService'

// ─────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────

export type NotifType = 'approval' | 'tramite' | 'system'

export interface AppNotification {
  id: string
  user_id: string
  title: string
  body: string
  type: NotifType
  read: boolean
  created_at: string
}

interface NotificationsContextValue {
  notifications: AppNotification[]
  unreadCount: number
  isLoading: boolean
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (id: string) => void           // optimista local
  refresh: () => Promise<void>
}

// ─────────────────────────────────────────────
// CONTEXTO
// ─────────────────────────────────────────────

const NotificationsContext = createContext<NotificationsContextValue>({
  notifications: [],
  unreadCount: 0,
  isLoading: true,
  markAsRead: async () => {},
  markAllAsRead: async () => {},
  deleteNotification: () => {},
  refresh: async () => {},
})

// ─────────────────────────────────────────────
// PROVIDER
// ─────────────────────────────────────────────

export const NotificationsProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [isLoading, setIsLoading]         = useState(true)
  const [userId, setUserId]               = useState<string | null>(null)

  // ── Carga notificaciones del usuario ─────────────────────────────────────
  const fetchNotifications = useCallback(async (uid: string) => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
      .limit(50)

    if (!error && data) {
      setNotifications(data as AppNotification[])
    }
    setIsLoading(false)
  }, [])

  const refresh = useCallback(async () => {
    if (userId) await fetchNotifications(userId)
  }, [userId, fetchNotifications])

  // ── Carga inicial + suscripción Realtime ─────────────────────────────────
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null

    const init = async () => {
      const user = await getCurrentUser()
      if (!user) {
        setIsLoading(false)
        return
      }

      setUserId(user.id)
      await fetchNotifications(user.id)

      // Escuchar INSERTs en tiempo real para este usuario
      channel = supabase
        .channel(`notifications:${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const newNotif = payload.new as AppNotification
            setNotifications(prev => [newNotif, ...prev])
          }
        )
        .subscribe()
    }

    init()

    // Limpiar canal cuando se desmonte
    return () => {
      if (channel) supabase.removeChannel(channel)
    }
  }, [fetchNotifications])

  // ── Limpiar al hacer sign out ─────────────────────────────────────────────
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setNotifications([])
        setUserId(null)
        setIsLoading(false)
      }
      if (event === 'SIGNED_IN') {
        setIsLoading(true)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  // ── Marcar una como leída ─────────────────────────────────────────────────
  const markAsRead = useCallback(async (id: string) => {
    // Actualización optimista
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    )

    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id)
  }, [])

  // ── Marcar todas como leídas ─────────────────────────────────────────────
  const markAllAsRead = useCallback(async () => {
    if (!userId) return

    setNotifications(prev => prev.map(n => ({ ...n, read: true })))

    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false)
  }, [userId])

  // ── Eliminar localmente (sin borrar en BD, opcional ampliarlo) ────────────
  const deleteNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        refresh,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  )
}

// ─────────────────────────────────────────────
// HOOK
// ─────────────────────────────────────────────

// eslint-disable-next-line react-refresh/only-export-components
export const useNotifications = () => {
  const ctx = useContext(NotificationsContext)
  if (!ctx) throw new Error('useNotifications debe usarse dentro de <NotificationsProvider>')
  return ctx
}

export default NotificationsContext