/**
 * MarketplaceEquipamientoWidget.tsx
 * Hardware registrado del rancho del usuario autenticado.
 * Permite registrar y eliminar equipamiento. Datos reales de Supabase.
 *
 * ARCHIVO → src/artifacts/marketplace/widgets/MarketplaceEquipamientoWidget.tsx
 */

import { useState } from 'react'
import { useUser } from '../../../context/UserContext'
import {
  useMarketplaceEquipamiento,
  useMarketplacePartners,
  registrarEquipamiento,
  eliminarEquipamiento,
  type EquipamientoWithDetails,
  type ProductDB,
  type PartnerConProductos,
} from '../../../hooks/useMarketplace'

// ─── WIDGET ───────────────────────────────────────────────────────────────────

export default function MarketplaceEquipamientoWidget() {
  const { profile } = useUser()
  const userId = profile?.user_id ?? null

  const { items, loading, error, refetch, ranchoId } = useMarketplaceEquipamiento(userId)
  const { partners } = useMarketplacePartners()

  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Form state
  const [selectedProductId, setSelectedProductId] = useState('')
  const [cantidad, setCantidad] = useState(1)
  const [notas, setNotas] = useState('')
  const [fechaAdq, setFechaAdq] = useState('')

  // Todos los productos de todos los partners (para el select)
  const allProducts: ProductDB[] = partners.flatMap((p: PartnerConProductos) => p.productos)

  const handleGuardar = async () => {
    if (!ranchoId || !selectedProductId) return
    setSaving(true)
    setSaveError(null)
    const { ok, error: err } = await registrarEquipamiento({
      ranchoId,
      productId: selectedProductId,
      cantidad,
      notas: notas || undefined,
      fechaAdquisicion: fechaAdq || undefined,
    })
    setSaving(false)
    if (!ok) { setSaveError(err); return }
    setShowForm(false)
    setSelectedProductId('')
    setCantidad(1)
    setNotas('')
    setFechaAdq('')
    refetch()
  }

  const handleEliminar = async (id: string) => {
    setDeletingId(id)
    await eliminarEquipamiento(id)
    setDeletingId(null)
    refetch()
  }

  if (loading) return (
    <div className="flex justify-center py-10">
      <div className="w-5 h-5 border-2 border-[#2FAF8F] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (error) return (
    <p className="text-[12px] text-red-500 text-center py-6">{error}</p>
  )

  return (
    <div className="flex flex-col gap-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[12.5px] font-semibold text-stone-700 dark:text-stone-200">Mi Equipamiento</p>
          <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-0.5">
            Hardware registrado en este rancho
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-[#2FAF8F] text-white text-[11px] font-semibold hover:bg-[#27a07f] transition-colors border-0 cursor-pointer"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Registrar
        </button>
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="flex flex-col gap-3 p-4 rounded-[12px] border border-stone-200/70 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/40">
          <p className="text-[11.5px] font-semibold text-stone-600 dark:text-stone-300">Nuevo equipamiento</p>

          {/* Producto */}
          <div className="flex flex-col gap-1">
            <label className="text-[10.5px] font-medium text-stone-400 dark:text-stone-500">Producto</label>
            <select
              value={selectedProductId}
              onChange={e => setSelectedProductId(e.target.value)}
              className="px-2.5 py-2 text-[12px] bg-white dark:bg-stone-800/80 border border-stone-200/70 dark:border-stone-700 rounded-[8px] text-stone-700 dark:text-stone-200 outline-none focus:border-[#2FAF8F]/50"
            >
              <option value="">Selecciona un producto…</option>
              {partners.map((partner: PartnerConProductos) => (
                <optgroup key={partner.id} label={partner.nombre}>
                  {partner.productos.map((p: ProductDB) => (
                    <option key={p.id} value={p.id}>{p.nombre}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Cantidad */}
          <div className="flex flex-col gap-1">
            <label className="text-[10.5px] font-medium text-stone-400 dark:text-stone-500">Cantidad</label>
            <input
              type="number"
              min={1}
              value={cantidad}
              onChange={e => setCantidad(Number(e.target.value))}
              className="px-2.5 py-2 text-[12px] bg-white dark:bg-stone-800/80 border border-stone-200/70 dark:border-stone-700 rounded-[8px] text-stone-700 dark:text-stone-200 outline-none focus:border-[#2FAF8F]/50 w-24"
            />
          </div>

          {/* Fecha adquisición */}
          <div className="flex flex-col gap-1">
            <label className="text-[10.5px] font-medium text-stone-400 dark:text-stone-500">Fecha de adquisición (opcional)</label>
            <input
              type="date"
              value={fechaAdq}
              onChange={e => setFechaAdq(e.target.value)}
              className="px-2.5 py-2 text-[12px] bg-white dark:bg-stone-800/80 border border-stone-200/70 dark:border-stone-700 rounded-[8px] text-stone-700 dark:text-stone-200 outline-none focus:border-[#2FAF8F]/50"
            />
          </div>

          {/* Notas */}
          <div className="flex flex-col gap-1">
            <label className="text-[10.5px] font-medium text-stone-400 dark:text-stone-500">Notas (opcional)</label>
            <textarea
              rows={2}
              placeholder="Corral norte, instalado por técnico…"
              value={notas}
              onChange={e => setNotas(e.target.value)}
              className="px-2.5 py-2 text-[12px] bg-white dark:bg-stone-800/80 border border-stone-200/70 dark:border-stone-700 rounded-[8px] text-stone-700 dark:text-stone-200 placeholder-stone-300 dark:placeholder-stone-600 outline-none focus:border-[#2FAF8F]/50 resize-none"
            />
          </div>

          {saveError && <p className="text-[11px] text-red-500">{saveError}</p>}

          <div className="flex gap-2">
            <button
              onClick={() => { setShowForm(false); setSaveError(null) }}
              className="flex-1 py-2 rounded-[8px] border border-stone-200/70 dark:border-stone-800 text-[11.5px] text-stone-500 hover:text-stone-700 transition-colors bg-transparent cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={handleGuardar}
              disabled={saving || !selectedProductId}
              className="flex-1 py-2 rounded-[8px] bg-[#2FAF8F] text-white text-[11.5px] font-semibold hover:bg-[#27a07f] transition-colors border-0 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {saving ? (
                <><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />Guardando…</>
              ) : 'Guardar'}
            </button>
          </div>
        </div>
      )}

      {/* Lista vacía */}
      {items.length === 0 && !showForm && (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <div className="w-10 h-10 rounded-2xl bg-stone-100 dark:bg-stone-800/60 flex items-center justify-center">
            <svg className="w-5 h-5 text-stone-400 dark:text-stone-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <path d="M8 21h8M12 17v4" />
            </svg>
          </div>
          <p className="text-[12.5px] text-stone-500 dark:text-stone-400">Sin equipamiento registrado</p>
          <p className="text-[11px] text-stone-400 dark:text-stone-500 max-w-52 leading-relaxed">
            Registra el hardware que tienes en tu rancho para mantener un inventario tecnológico
          </p>
        </div>
      )}

      {/* Lista de equipamiento */}
      {items.length > 0 && (
        <div className="flex flex-col gap-2">
          {items.map((item: EquipamientoWithDetails) => {
            const partnerColor = item.partner?.color ?? '#2FAF8F'
            return (
              <div
                key={item.id}
                className="flex items-start gap-3 p-3.5 rounded-[12px] border border-stone-200/70 dark:border-stone-800 bg-white dark:bg-[#1c1917] flex-wrap sm:flex-nowrap"
              >
                {/* Dot color partner */}
                <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: partnerColor }} />

                <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[9.5px] font-semibold uppercase tracking-wider" style={{ color: partnerColor }}>
                      {item.partner?.nombre ?? '—'}
                    </span>
                    {item.cantidad > 1 && (
                      <span className="text-[10px] font-mono text-stone-400 dark:text-stone-500">
                        ×{item.cantidad}
                      </span>
                    )}
                  </div>
                  {item.notas && (
                    <p className="text-[11px] text-stone-400 dark:text-stone-500">{item.notas}</p>
                  )}
                  {item.fecha_adquisicion && (
                    <p className="text-[10px] text-stone-300 dark:text-stone-600">
                      Adquirido: {new Date(item.fecha_adquisicion + 'T00:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  )}
                </div>

                {/* Eliminar */}
                <button
                  onClick={() => handleEliminar(item.id)}
                  disabled={deletingId === item.id}
                  className="w-7 h-7 flex items-center justify-center rounded-[7px] text-stone-300 dark:text-stone-600 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all bg-transparent border-0 cursor-pointer shrink-0 disabled:opacity-40"
                >
                  {deletingId === item.id ? (
                    <div className="w-3 h-3 border-2 border-stone-300 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                      <path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                    </svg>
                  )}
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Nota de privacidad */}
      {items.length > 0 && (
        <p className="text-[10.5px] text-stone-300 dark:text-stone-600 text-center pt-1 leading-relaxed">
          Solo tú ves el equipamiento de tu rancho
        </p>
      )}
    </div>
  )
}