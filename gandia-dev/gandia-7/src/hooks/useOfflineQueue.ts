/**
 * useOfflineQueue.ts
 * Cola offline para capturas biométricas.
 * Almacena capturas en memoria cuando no hay conexión
 * y las reintenta automáticamente al volver online.
 *
 * ARCHIVO → src/hooks/useOfflineQueue.ts
 */

import { useState, useEffect, useCallback, useRef } from 'react'

export interface OfflineCapturaItem {
  id:           string
  imageDataUrl: string
  ranchoId:     string
  animalId:     string | null
  modo:         'direct' | 'sheet'
  timestamp:    number
  retries:      number
}

interface UseOfflineQueueOptions {
  /** Se llama por cada item al volver la conexión. Devuelve true si el retry fue exitoso. */
  onRetry: (item: OfflineCapturaItem) => Promise<boolean>
}

export function useOfflineQueue({ onRetry }: UseOfflineQueueOptions) {
  const [queue,    setQueue]    = useState<OfflineCapturaItem[]>([])
  const [isOnline, setIsOnline] = useState(() => navigator.onLine)
  const retryingRef             = useRef(false)
  const onRetryRef              = useRef(onRetry)

  // Mantener ref actualizada sin re-triggerar el effect
  useEffect(() => { onRetryRef.current = onRetry }, [onRetry])

  // Detectar cambios de conectividad
  useEffect(() => {
    const goOnline  = () => setIsOnline(true)
    const goOffline = () => setIsOnline(false)
    window.addEventListener('online',  goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online',  goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  // Auto-retry cuando vuelve la conexión
  useEffect(() => {
    if (!isOnline || queue.length === 0 || retryingRef.current) return

    const retryAll = async () => {
      retryingRef.current = true
      // Copiar la cola para no iterar sobre estado mutable
      const pending = [...queue]
      for (const item of pending) {
        try {
          const ok = await onRetryRef.current(item)
          if (ok) {
            setQueue(prev => prev.filter(i => i.id !== item.id))
          } else {
            setQueue(prev => prev.map(i =>
              i.id === item.id ? { ...i, retries: i.retries + 1 } : i
            ))
          }
        } catch {
          setQueue(prev => prev.map(i =>
            i.id === item.id ? { ...i, retries: i.retries + 1 } : i
          ))
        }
      }
      retryingRef.current = false
    }

    retryAll()
  }, [isOnline, queue])

  const enqueue = useCallback((item: Omit<OfflineCapturaItem, 'id' | 'retries'>) => {
    setQueue(prev => [...prev, { ...item, id: crypto.randomUUID(), retries: 0 }])
  }, [])

  const dequeue = useCallback((id: string) => {
    setQueue(prev => prev.filter(i => i.id !== id))
  }, [])

  const clearQueue = useCallback(() => setQueue([]), [])

  return { queue, isOnline, enqueue, dequeue, clearQueue }
}