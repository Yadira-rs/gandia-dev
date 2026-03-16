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

// Mapa de tipo de notificación → clave en NotifPrefs
const TYPE_PREF_MAP: Record<NotifType, string> = {
  approval: 'certificaciones',
  tramite:  'auditorias',
  system:   'sistema',
}

interface NotifPrefs {
  alerts:         boolean
  newsletter:     boolean
  auditorias:     boolean
  certificaciones: boolean
  sistema:        boolean
  menciones:      boolean
  push:           boolean
  email:          boolean
  sms:            boolean
  dnd_from:       string
  dnd_to:         string
}

const DEFAULT_PREFS: NotifPrefs = {
  alerts: true, newsletter: false, auditorias: true,
  certificaciones: true, sistema: true, menciones: true,
  push: true, email: true, sms: false,
  dnd_from: '22:00', dnd_to: '07:00',
}

// ── Verificar si estamos en horario No Molestar ───────────────────────────────
function isInDND(prefs: NotifPrefs): boolean {
  const now  = new Date()
  const hhmm = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`
  const from = prefs.dnd_from
  const to   = prefs.dnd_to
  if (from === to) return false
  if (from < to) return hhmm >= from && hhmm < to
  return hhmm >= from || hhmm < to   // cruza medianoche
}

// ── Web Push: solicitar permiso y mostrar notificación nativa ─────────────────
async function showPushNotification(title: string, body: string) {
  try {
    if (!('Notification' in window)) return
    if (Notification.permission === 'denied') return
    if (Notification.permission === 'default') {
      const perm = await Notification.requestPermission()
      if (perm !== 'granted') return
    }
    new Notification(title, { body, icon: '/vite.svg', tag: 'gandia-notif' })
  } catch { /* browser sin soporte */ }
}

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
  const prefsRef = { current: DEFAULT_PREFS as NotifPrefs }

  // Leer prefs del localStorage (escritas por Configuraciones al guardar)
  const loadPrefs = (): NotifPrefs => {
    try {
      const raw = localStorage.getItem('gandia-notif-prefs')
      if (raw) return { ...DEFAULT_PREFS, ...JSON.parse(raw) }
    } catch { /* ignore */ }
    return DEFAULT_PREFS
  }
  prefsRef.current = loadPrefs()

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
            const prefs = loadPrefs()

            // ── Filtrar por tipo habilitado ───────────────────────────────
            const prefKey = TYPE_PREF_MAP[newNotif.type]
            if (prefKey && !(prefs as unknown as Record<string,boolean>)[prefKey]) return

            // ── No molestar ───────────────────────────────────────────────
            if (isInDND(prefs)) return

            // ── Web Push si está habilitado ───────────────────────────────
            if (prefs.push) {
              showPushNotification(newNotif.title, newNotif.body)
            }

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