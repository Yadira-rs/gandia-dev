/**
 * useTwinsWrite.ts
 * ARCHIVO → src/hooks/useTwinsWrite.ts
 */

import { useCallback } from 'react'
import {
  parseTwinsAction,
  registrarPeso,
  registrarEvento,
  registrarAlimentacion,
} from '../lib/twinsService'

export interface TwinsWriteResult {
  ok:      boolean
  message: string
}

export function useTwinsWrite() {

  const handleTwinsWrite = useCallback(async (
    text: string
  ): Promise<TwinsWriteResult> => {

    const parsed = parseTwinsAction(text)

    if (!parsed) {
      return {
        ok:      false,
        message: 'No pude identificar el animal o los datos. Intenta: "registrar pesaje cattle_9801 450 kg"',
      }
    }

    if (parsed.action === 'peso') {
      const { ok, error } = await registrarPeso({
        siniiga: parsed.siniiga,
        peso:    parsed.data.peso as number,
      })
      if (!ok) return { ok: false, message: `Error al guardar el pesaje: ${error}` }
      return { ok: true, message: `✓ Pesaje registrado — ${parsed.siniiga}: ${parsed.data.peso as number} kg guardado correctamente.` }
    }

    if (parsed.action === 'evento') {
      const d = parsed.data as {
        tipo:       'pesaje' | 'vacunacion' | 'movilizacion' | 'tratamiento' | 'auditoria' | 'otro'
        titulo:     string
        valor?:     string
        cert?:      'completa' | 'parcial' | 'pendiente'
        ubicacion?: string
      }
      const { ok, error } = await registrarEvento({
        siniiga:   parsed.siniiga,
        tipo:      d.tipo,
        titulo:    d.titulo,
        valor:     d.valor,
        cert:      d.cert,
        ubicacion: d.ubicacion,
      })
      if (!ok) return { ok: false, message: `Error al guardar el evento: ${error}` }
      return { ok: true, message: `✓ Evento registrado — ${d.tipo} para ${parsed.siniiga} guardado correctamente.` }
    }

    if (parsed.action === 'alimentacion') {
      const d = parsed.data as {
        forraje_pct?:     number
        concentrado_pct?: number
        suplemento_pct?:  number
      }
      const { ok, error } = await registrarAlimentacion({
        siniiga:         parsed.siniiga,
        forraje_pct:     d.forraje_pct,
        concentrado_pct: d.concentrado_pct,
        suplemento_pct:  d.suplemento_pct,
      })
      if (!ok) return { ok: false, message: `Error al guardar el consumo: ${error}` }
      return { ok: true, message: `✓ Consumo semanal registrado para ${parsed.siniiga} guardado correctamente.` }
    }

    return { ok: false, message: 'Acción no reconocida.' }

  }, [])

  return { handleTwinsWrite }
}