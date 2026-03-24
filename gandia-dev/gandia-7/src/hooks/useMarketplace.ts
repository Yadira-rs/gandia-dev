/**
 * useMarketplace.ts
 * Hook real de Supabase para el Marketplace Gandia.
 * Reemplaza completamente marketplaceData.ts como fuente de datos.
 *
 * ARCHIVO → src/hooks/useMarketplace.ts
 */

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useRanchoId } from './useAnimales'

// ─── TIPOS ────────────────────────────────────────────────────────────────────

export type PartnerId = string   // uuid de la BD

export interface PartnerDB {
  id: string
  nombre: string
  slogan: string
  descripcion: string
  aporte: string
  color: string
  url: string
  url_contacto: string
  activo: boolean
  created_at: string
}

export interface ProductDB {
  id: string
  partner_id: string
  nombre: string
  descripcion: string
  uso: string
  precio: string
  etiqueta: string
  url: string
  destacado: boolean
  tags: string[]
  activo: boolean
  created_at: string
}

export interface CompatibilidadDB {
  id: string
  product_id: string
  modulo_gandia: string
  descripcion: string
}

export interface EquipamientoDB {
  id: string
  rancho_id: string
  product_id: string
  cantidad: number
  notas: string | null
  fecha_adquisicion: string | null
  created_at: string
  // join
  product?: ProductDB
  partner?: PartnerDB
}

// Partner con sus productos embebidos (para la UI)
export interface PartnerConProductos extends PartnerDB {
  productos: ProductDB[]
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function errMsg(e: unknown): string {
  if (e instanceof Error) return e.message
  if (typeof e === 'object' && e !== null && 'message' in e) return String((e as { message: unknown }).message)
  return String(e)
}

// ─── HOOK: todos los partners con sus productos ───────────────────────────────

export function useMarketplacePartners() {
  const [partners, setPartners] = useState<PartnerConProductos[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // Traer partners activos
      const { data: partnersData, error: pErr } = await supabase
        .from('marketplace_partners')
        .select('*')
        .eq('activo', true)
        .order('created_at', { ascending: true })

      if (pErr) throw pErr

      // Traer productos activos
      const { data: productsData, error: prErr } = await supabase
        .from('marketplace_products')
        .select('*')
        .eq('activo', true)
        .order('created_at', { ascending: true })

      if (prErr) throw prErr

      // Combinar
      const combined: PartnerConProductos[] = (partnersData ?? []).map((p: PartnerDB) => ({
        ...p,
        productos: (productsData ?? []).filter((pr: ProductDB) => pr.partner_id === p.id),
      }))

      setPartners(combined)
    } catch (e) {
      setError(errMsg(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void fetch() }, [fetch])

  return { partners, loading, error, refetch: fetch }
}

// ─── HOOK: productos destacados ───────────────────────────────────────────────

export function useMarketplaceDestacados() {
  const [products, setProducts] = useState<ProductDB[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from('marketplace_products')
        .select('*')
        .eq('activo', true)
        .eq('destacado', true)
        .order('created_at', { ascending: true })

      if (err) throw err
      setProducts(data ?? [])
    } catch (e) {
      setError(errMsg(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void fetch() }, [fetch])

  return { products, loading, error }
}

// ─── HOOK: productos por tag ──────────────────────────────────────────────────

export function useMarketplaceByTag(tag: string | null) {
  const [products, setProducts] = useState<ProductDB[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    if (!tag) { setProducts([]); return }
    setLoading(true)
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from('marketplace_products')
        .select('*')
        .eq('activo', true)
        .contains('tags', [tag])
        .order('destacado', { ascending: false })

      if (err) throw err
      setProducts(data ?? [])
    } catch (e) {
      setError(errMsg(e))
    } finally {
      setLoading(false)
    }
  }, [tag])

  useEffect(() => { void fetch() }, [fetch])

  return { products, loading, error }
}

// ─── HOOK: compatibilidad por módulo ─────────────────────────────────────────

export function useMarketplaceCompatibilidad() {
  const [items, setItems] = useState<(CompatibilidadDB & { product: ProductDB; partner: PartnerDB })[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // Traer compatibilidad con producto y partner en un solo query via join manual
      const { data: compatData, error: cErr } = await supabase
        .from('marketplace_compatibilidad')
        .select('*')
        .order('modulo_gandia', { ascending: true })

      if (cErr) throw cErr

      const { data: productsData, error: prErr } = await supabase
        .from('marketplace_products')
        .select('*')
        .eq('activo', true)

      if (prErr) throw prErr

      const { data: partnersData, error: pErr } = await supabase
        .from('marketplace_partners')
        .select('*')
        .eq('activo', true)

      if (pErr) throw pErr

      const combined = (compatData ?? []).map((c: CompatibilidadDB) => {
        const product = (productsData ?? []).find((p: ProductDB) => p.id === c.product_id)
        const partner = (partnersData ?? []).find((p: PartnerDB) => p.id === product?.partner_id)
        return { ...c, product, partner }
      }).filter((c: { product: ProductDB | undefined }) => c.product)

      setItems(combined as (CompatibilidadDB & { product: ProductDB; partner: PartnerDB })[])
    } catch (e) {
      setError(errMsg(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void fetch() }, [fetch])

  return { items, loading, error }
}

// ─── HOOK: equipamiento del rancho ────────────────────────────────────────────

export function useMarketplaceEquipamiento(userId: string | null) {
  const { ranchoId } = useRanchoId(userId)
  const [items, setItems] = useState<EquipamientoWithDetails[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    if (!ranchoId) return
    setLoading(true)
    setError(null)
    try {
      const { data: equipData, error: eErr } = await supabase
        .from('marketplace_equipamiento')
        .select('*')
        .eq('rancho_id', ranchoId)
        .order('created_at', { ascending: false })

      if (eErr) throw eErr

      if (!equipData?.length) { setItems([]); setLoading(false); return }

      const productIds = [...new Set(equipData.map((e: EquipamientoDB) => e.product_id))]

      const { data: productsData, error: prErr } = await supabase
        .from('marketplace_products')
        .select('*')
        .in('id', productIds)

      if (prErr) throw prErr

      const partnerIds = [...new Set((productsData ?? []).map((p: ProductDB) => p.partner_id))]

      const { data: partnersData, error: pErr } = await supabase
        .from('marketplace_partners')
        .select('*')
        .in('id', partnerIds)

      if (pErr) throw pErr

      const combined: EquipamientoWithDetails[] = equipData.map((e: EquipamientoDB) => {
        const product = (productsData ?? []).find((p: ProductDB) => p.id === e.product_id)
        const partner = (partnersData ?? []).find((p: PartnerDB) => p.id === product?.partner_id)
        return { ...e, product, partner }
      })

      setItems(combined)
    } catch (e) {
      setError(errMsg(e))
    } finally {
      setLoading(false)
    }
  }, [ranchoId])

  useEffect(() => { void fetch() }, [fetch])

  return { items, loading, error, refetch: fetch, ranchoId }
}

export interface EquipamientoWithDetails extends EquipamientoDB {
  product?: ProductDB
  partner?: PartnerDB
}

// ─── ACCIÓN: registrar equipamiento ──────────────────────────────────────────

export async function registrarEquipamiento(params: {
  ranchoId: string
  productId: string
  cantidad: number
  notas?: string
  fechaAdquisicion?: string
}): Promise<{ ok: boolean; error: string | null }> {
  try {
    const { error } = await supabase
      .from('marketplace_equipamiento')
      .insert({
        rancho_id: params.ranchoId,
        product_id: params.productId,
        cantidad: params.cantidad,
        notas: params.notas ?? null,
        fecha_adquisicion: params.fechaAdquisicion ?? null,
      })
    if (error) throw error
    return { ok: true, error: null }
  } catch (e) {
    return { ok: false, error: errMsg(e) }
  }
}

// ─── ACCIÓN: eliminar equipamiento ───────────────────────────────────────────

export async function eliminarEquipamiento(equipamientoId: string): Promise<{ ok: boolean; error: string | null }> {
  try {
    const { error } = await supabase
      .from('marketplace_equipamiento')
      .delete()
      .eq('id', equipamientoId)
    if (error) throw error
    return { ok: true, error: null }
  } catch (e) {
    return { ok: false, error: errMsg(e) }
  }
}

// ─── NECESIDADES (estático — no cambia seguido) ───────────────────────────────

export const NECESIDADES: { id: string; label: string; tags: string[] }[] = [
  { id: 'exportar', label: 'Quiero exportar', tags: ['exportacion', 'trazabilidad'] },
  { id: 'monitorear', label: 'Monitorear mi hato', tags: ['monitoreo', 'vision', 'salud'] },
  { id: 'conectar', label: 'Mejorar conectividad', tags: ['conectividad', 'internet', 'rural'] },
  { id: 'trazabilidad', label: 'Trazabilidad completa', tags: ['trazabilidad', 'gemelo', 'iot'] },
  { id: 'infraestructura', label: 'Infraestructura rural', tags: ['infraestructura', 'energia', 'edge'] },
]