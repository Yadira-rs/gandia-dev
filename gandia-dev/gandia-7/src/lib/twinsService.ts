/**
 * twinsService.ts
 * Capa de escritura para el módulo Gemelo Digital.
 * ARCHIVO → src/lib/twinsService.ts
 */

import { supabase } from './supabaseClient'

// ─── TIPOS ────────────────────────────────────────────────────────────────────

export interface NuevoPesoInput {
  siniiga:   string
  peso:      number
  objetivo?: number
  fecha?:    string
}

export interface NuevoEventoInput {
  siniiga:    string
  tipo:       'pesaje' | 'vacunacion' | 'movilizacion' | 'tratamiento' | 'auditoria' | 'otro'
  titulo:     string
  valor?:     string
  cert?:      'completa' | 'parcial' | 'pendiente'
  ubicacion?: string
  fecha?:     string
}

export interface NuevaAlimentacionInput {
  siniiga:          string
  semana_inicio?:   string
  forraje_pct?:     number
  concentrado_pct?: number
  suplemento_pct?:  number
  ca_valor?:        number
}

function hoy(): string {
  return new Date().toISOString().split('T')[0]
}

function lunesDeEstaSemana(): string {
  const d   = new Date()
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return d.toISOString().split('T')[0]
}

// ─── REGISTRAR PESAJE ─────────────────────────────────────────────────────────

export async function registrarPeso(
  input: NuevoPesoInput
): Promise<{ ok: boolean; error: string | null }> {
  try {
    const fecha = input.fecha ?? hoy()
    const { error } = await supabase
      .from('twins_pesos')
      .upsert({
        animal_id: input.siniiga,
        peso:      input.peso,
        objetivo:  input.objetivo ?? input.peso,
        fecha,
      }, { onConflict: 'animal_id,fecha' })
    if (error) throw error

    await supabase
      .from('animales')
      .update({ peso_kg: input.peso, updated_at: new Date().toISOString() })
      .eq('siniiga', input.siniiga)

    return { ok: true, error: null }
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}

// ─── REGISTRAR EVENTO ─────────────────────────────────────────────────────────

export async function registrarEvento(
  input: NuevoEventoInput
): Promise<{ ok: boolean; error: string | null }> {
  try {
    const fecha = input.fecha ?? hoy()
    const { error } = await supabase
      .from('twins_eventos')
      .insert({
        animal_id: input.siniiga,
        tipo:      input.tipo,
        fecha:     new Date(fecha).toISOString(),
        data: {
          titulo:    input.titulo,
          valor:     input.valor    ?? '',
          cert:      input.cert     ?? 'pendiente',
          ubicacion: input.ubicacion ?? '',
        },
      })
    if (error) throw error
    return { ok: true, error: null }
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}

// ─── REGISTRAR ALIMENTACIÓN ───────────────────────────────────────────────────

export async function registrarAlimentacion(
  input: NuevaAlimentacionInput
): Promise<{ ok: boolean; error: string | null }> {
  try {
    const semana = input.semana_inicio ?? lunesDeEstaSemana()
    const { error } = await supabase
      .from('twins_alimentacion')
      .upsert({
        animal_id:       input.siniiga,
        semana_inicio:   semana,
        forraje_pct:     input.forraje_pct,
        concentrado_pct: input.concentrado_pct,
        suplemento_pct:  input.suplemento_pct,
        ca_valor:        input.ca_valor,
      }, { onConflict: 'animal_id,semana_inicio' })
    if (error) throw error
    return { ok: true, error: null }
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}

// ─── PARSER ───────────────────────────────────────────────────────────────────

export interface ParsedTwinsAction {
  action:  'peso' | 'evento' | 'alimentacion'
  siniiga: string
  data:    Record<string, unknown>
}

export function parseTwinsAction(text: string): ParsedTwinsAction | null {
  const lower = text.toLowerCase()

  const siniiagaMatch =
    text.match(/cattle_\d+/i) ??
    text.match(/arete[:\s]+([A-Z0-9_-]+)/i) ??
    text.match(/animal[:\s]+([A-Z0-9_-]+)/i)

  const siniiga = siniiagaMatch?.[1] ?? siniiagaMatch?.[0] ?? ''
  if (!siniiga) return null

  const pesoMatch = text.match(/(\d{2,3}(?:\.\d+)?)\s*kg/i)
  if (pesoMatch && (lower.includes('pes') || lower.includes('kg'))) {
    return { action: 'peso', siniiga, data: { peso: parseFloat(pesoMatch[1]) } }
  }

  if (lower.includes('vacu') || lower.includes('dosis')) {
    const dosis = text.match(/\d+(?:\.\d+)?\s*ml/i)?.[0] ?? ''
    return { action: 'evento', siniiga, data: { tipo: 'vacunacion', titulo: 'Vacunación registrada desde chat', valor: dosis, cert: 'pendiente' } }
  }

  if (lower.includes('traslad') || lower.includes('movili')) {
    const corrales = text.match(/corral\s+\d+/gi) ?? []
    const valor    = corrales.length >= 2 ? `${corrales[0]} → ${corrales[1]}` : corrales[0] ?? ''
    return { action: 'evento', siniiga, data: { tipo: 'movilizacion', titulo: 'Traslado registrado desde chat', valor, cert: 'parcial', ubicacion: corrales[corrales.length - 1] ?? '' } }
  }

  if (lower.includes('consumo') || lower.includes('forraje') || lower.includes('concentrado')) {
    return {
      action: 'alimentacion', siniiga,
      data: {
        forraje_pct:     text.match(/forraje[:\s]+(\d+)/i)     ? parseFloat(text.match(/forraje[:\s]+(\d+)/i)![1])     : undefined,
        concentrado_pct: text.match(/concentrado[:\s]+(\d+)/i) ? parseFloat(text.match(/concentrado[:\s]+(\d+)/i)![1]) : undefined,
        suplemento_pct:  text.match(/suplemento[:\s]+(\d+)/i)  ? parseFloat(text.match(/suplemento[:\s]+(\d+)/i)![1])  : undefined,
      },
    }
  }

  return null
}