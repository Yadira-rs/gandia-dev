/**
 * useVinculaciones.ts
 * Hook central para el módulo de Vinculaciones.
 * Reemplaza todos los useState(MOCK_*) en VinculacionModulo y VinculacionAnima.
 */

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useUser } from '../context/UserContext'
import type { Vinculacion, VinculacionPendiente, VinculacionHistorial, VinculacionTipo } from '../artifacts/artifactTypes'
import {
  fetchVinculaciones,
  enviarSolicitud,
  aceptarVinculacion,
  rechazarVinculacion,
  revocarVinculacion,
  expirarVencidas,
} from '../services/vinculacionService'

// ─── ESTADO PÚBLICO DEL HOOK ──────────────────────────────────────────────────

export interface VinculacionesState {
  activas:    Vinculacion[]
  pendientes: VinculacionPendiente[]
  historial:  VinculacionHistorial[]
  loading:    boolean
  error:      string | null
  handleAceptar:  (id: string) => Promise<void>
  handleRechazar: (id: string) => Promise<void>
  handleRevocar:  (id: string) => Promise<void>
  handleEnviar:   (tipo: VinculacionTipo, receptorId: string, mensaje: string, expiraDias?: number) => Promise<void>
  refetch:        () => Promise<void>
}

// ─── HOOK ─────────────────────────────────────────────────────────────────────

export function useVinculaciones(): VinculacionesState {
  const { profile } = useUser()
  const userId = profile?.user_id ?? null

  const [activas,    setActivas]    = useState<Vinculacion[]>([])
  const [pendientes, setPendientes] = useState<VinculacionPendiente[]>([])
  const [historial,  setHistorial]  = useState<VinculacionHistorial[]>([])
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState<string | null>(null)

  // ── Carga principal ───────────────────────────────────────────────────────

  const load = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    setError(null)

    // Expirar vencidas antes de cargar (fire-and-forget)
    void expirarVencidas()

    const result = await fetchVinculaciones(userId)
    if (result.error) {
      setError(result.error)
    } else {
      setActivas(result.activas)
      setPendientes(result.pendientes)
      setHistorial(result.historial)
    }
    setLoading(false)
  }, [userId])

  useEffect(() => {
    void load()
  }, [load])

  // ── Realtime: escuchar cambios en la tabla ────────────────────────────────

  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel('vinculaciones-changes')
      .on(
        'postgres_changes',
        {
          event:  '*',
          schema: 'public',
          table:  'vinculaciones',
          filter: `solicitante_id=eq.${userId}`,
        },
        () => { void load() }
      )
      .on(
        'postgres_changes',
        {
          event:  '*',
          schema: 'public',
          table:  'vinculaciones',
          filter: `receptor_id=eq.${userId}`,
        },
        () => { void load() }
      )
      .subscribe()

    return () => { void supabase.removeChannel(channel) }
  }, [userId, load])

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleAceptar = useCallback(async (id: string) => {
    const { error: err } = await aceptarVinculacion(id)
    if (err) setError(err)
    else await load()
  }, [load])

  const handleRechazar = useCallback(async (id: string) => {
    const { error: err } = await rechazarVinculacion(id)
    if (err) setError(err)
    else await load()
  }, [load])

  const handleRevocar = useCallback(async (id: string) => {
    if (!userId) return
    const { error: err } = await revocarVinculacion(id, userId)
    if (err) setError(err)
    else await load()
  }, [userId, load])

  const handleEnviar = useCallback(async (
    tipo:       VinculacionTipo,
    receptorId: string,
    mensaje:    string,
    expiraDias?: number
  ) => {
    if (!userId) return
    const { error: err } = await enviarSolicitud({
      solicitanteId: userId,
      receptorId,
      tipo,
      mensaje,
      expiraDias,
    })
    if (err) setError(err)
    else await load()
  }, [userId, load])

  return {
    activas,
    pendientes,
    historial,
    loading,
    error,
    handleAceptar,
    handleRechazar,
    handleRevocar,
    handleEnviar,
    refetch: load,
  }
}
