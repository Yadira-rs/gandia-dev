/**
 * MarketplaceKitsWidget.tsx
 * Widget inline del chat — cards de productos con link externo.
 * Datos reales desde Supabase via useMarketplace.
 *
 * ARCHIVO → src/artifacts/marketplace/widgets/MarketplaceKitsWidget.tsx
 */

import { useState } from 'react'
import {
  useMarketplaceDestacados,
  useMarketplaceByTag,
  useMarketplacePartners,
  NECESIDADES,
  type ProductDB,
} from '../../../hooks/marketplaceData'

// ─── PROPS ────────────────────────────────────────────────────────────────────

interface Props {
  filterTag?: string
  onExpand?:  () => void
}

// ─── CARD DE PRODUCTO ─────────────────────────────────────────────────────────

function ProductCard({
  product,
  partnerColor,
  partnerNombre,
}: {
  product:       ProductDB
  partnerColor:  string
  partnerNombre: string
}) {
  const handleClick = () => window.open(product.url, '_blank', 'noopener,noreferrer')

  return (
    <div
      className="group relative flex flex-col gap-3 p-4 rounded-[14px] border border-stone-200/70 dark:border-stone-800 bg-white dark:bg-[#1c1917] hover:border-stone-300 dark:hover:border-stone-700 hover:shadow-md dark:hover:shadow-black/20 transition-all duration-200 cursor-pointer"
      onClick={handleClick}
    >
      {/* Partner + badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: partnerColor }} />
          <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: partnerColor }}>
            {partnerNombre}
          </span>
        </div>
        <span
          className="text-[9.5px] font-semibold px-2 py-0.5 rounded-md"
          style={{ color: partnerColor, background: `${partnerColor}15`, border: `1px solid ${partnerColor}30` }}
        >
          {product.etiqueta}
        </span>
      </div>

      {/* Nombre + descripción */}
      <div className="flex flex-col gap-1">
        <p className="text-[13.5px] font-semibold text-stone-800 dark:text-stone-100 leading-snug group-hover:text-stone-900 dark:group-hover:text-white transition-colors">
          {product.nombre}
        </p>
        <p className="text-[11.5px] text-stone-500 dark:text-stone-400 leading-[1.6] line-clamp-2">
          {product.descripcion}
        </p>
      </div>

      {/* Uso ganadero */}
      <div className="flex items-start gap-2 px-2.5 py-2 rounded-[8px] bg-stone-50 dark:bg-stone-900/50">
        <svg className="w-3 h-3 mt-0.5 shrink-0 text-[#2FAF8F]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-[1.5]">{product.uso}</p>
      </div>

      {/* Precio + CTA */}
      <div className="flex items-center justify-between mt-auto pt-1">
        <p className="text-[12px] font-semibold text-stone-700 dark:text-stone-200">{product.precio}</p>
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[11px] font-semibold text-white transition-all"
          style={{ background: partnerColor }}
        >
          Ver producto
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/>
          </svg>
        </div>
      </div>
    </div>
  )
}

// ─── WIDGET ───────────────────────────────────────────────────────────────────

export default function MarketplaceKitsWidget({ filterTag, onExpand }: Props) {
  const [necesidad, setNecesidad] = useState<string | null>(filterTag ?? null)

  const { products: destacados, loading: loadDest } = useMarketplaceDestacados()
  const { products: byTag,      loading: loadTag  } = useMarketplaceByTag(necesidad)
  const { partners }                                 = useMarketplacePartners()

  const products = necesidad ? byTag      : destacados
  const loading  = necesidad ? loadTag    : loadDest

  // Map partner_id → color/nombre
  const partnerMap = Object.fromEntries(
    partners.map(p => [p.id, { color: p.color, nombre: p.nombre }])
  )

  return (
    <div className="flex flex-col gap-3 w-full max-w-[560px]">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#2FAF8F]" />
          <p className="text-[12px] font-semibold text-stone-700 dark:text-stone-200">Ecosistema Gandia</p>
          <span className="text-[9.5px] font-mono text-stone-400 dark:text-stone-500 uppercase tracking-wider">
            {products.length} soluciones
          </span>
        </div>
        {onExpand && (
          <button
            onClick={onExpand}
            className="flex items-center gap-1 text-[11px] text-stone-400 dark:text-stone-500 hover:text-[#2FAF8F] transition-colors bg-transparent border-0 cursor-pointer"
          >
            Ver todo
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        )}
      </div>

      {/* Filtros por necesidad */}
      <div className="flex gap-1.5 flex-wrap">
        <button
          onClick={() => setNecesidad(null)}
          className={`px-2.5 py-1 rounded-full text-[10.5px] font-medium transition-all border cursor-pointer ${
            !necesidad
              ? 'bg-stone-800 dark:bg-stone-100 text-white dark:text-stone-900 border-transparent'
              : 'bg-transparent text-stone-500 dark:text-stone-400 border-stone-200/70 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600'
          }`}
        >
          Destacados
        </button>
        {NECESIDADES.map((n: { id: string; label: string; tags: string[] }) => (
          <button
            key={n.id}
            onClick={() => setNecesidad(n.tags[0])}
            className={`px-2.5 py-1 rounded-full text-[10.5px] font-medium transition-all border cursor-pointer ${
              necesidad === n.tags[0]
                ? 'bg-[#2FAF8F] text-white border-transparent'
                : 'bg-transparent text-stone-500 dark:text-stone-400 border-stone-200/70 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600'
            }`}
          >
            {n.label}
          </button>
        ))}
      </div>

      {/* Grid de productos */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-5 h-5 border-2 border-[#2FAF8F] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {products.map((p: ProductDB) => (
            <ProductCard
              key={p.id}
              product={p}
              partnerColor={partnerMap[p.partner_id]?.color ?? '#2FAF8F'}
              partnerNombre={partnerMap[p.partner_id]?.nombre ?? '—'}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <p className="text-[12px] text-stone-400 dark:text-stone-500">Sin soluciones para ese filtro</p>
        </div>
      )}

      {/* Footer partners */}
      <div className="flex items-center gap-3 pt-1 border-t border-stone-100 dark:border-stone-800/60">
        <p className="text-[10px] text-stone-300 dark:text-stone-600">Partners:</p>
        {partners.map(p => (
          <span key={p.id} className="text-[10px] font-semibold" style={{ color: p.color }}>
            {p.nombre}
          </span>
        ))}
      </div>
    </div>
  )
}