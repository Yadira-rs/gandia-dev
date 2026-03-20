// TODO: copiar de gandia-7/src/context/NotificationsContext.tsx
// Sin cambios necesarios — Supabase Realtime funciona igual en RN
import { createContext, useContext } from 'react'
import React from 'react'

const NotificationsContext = createContext<any>(null)

export const NotificationsProvider = ({ children }: { children: React.ReactNode }) => (
  <NotificationsContext.Provider value={{ notifications: [], unreadCount: 0 }}>
    {children}
  </NotificationsContext.Provider>
)

export const useNotifications = () => useContext(NotificationsContext)
export default NotificationsContext
