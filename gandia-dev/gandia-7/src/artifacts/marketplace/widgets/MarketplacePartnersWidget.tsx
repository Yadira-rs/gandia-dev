/**
 * MarketplacePartnersWidget.tsx
 * Ficha de cada partner con datos reales desde Supabase.
 *
 * ARCHIVO → src/artifacts/marketplace/widgets/MarketplacePartnersWidget.tsx
 */

import { useState } from 'react'
import {
  useMarketplacePartners,
  type PartnerConProductos,
  type ProductDB,
} from '../../../hooks/useMarketplace'

// ─── ÍCONO POR PARTNER (por nombre, no por ID hardcodeado) ───────────────────

function PartnerIcon({ nombre, color }: { nombre: string; color: string }) {
  const cls = 'w-5 h-5'
  const style = { color }
  const n = nombre.toLowerCase()

  if (n.includes('nvidia')) return (
    <svg className={cls} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
  if (n.includes('fermaca')) return (
    <svg className={cls} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )
  return (
    <svg className={cls} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" />
    </svg>
  )
}

// ─── PRODUCT ROW ──────────────────────────────────────────────────────────────

function ProductRow({ product, color }: { product: ProductDB; color: string }) {
  return (
    <a
      href={product.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-2 sm:gap-3 p-3 rounded-[10px] border border-stone-200/70 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 bg-white dark:bg-[#1c1917] transition-all no-underline"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-[12px] font-semibold text-stone-700 dark:text-stone-200 truncate">{product.nombre}</p>
          {product.destacado && (
            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded shrink-0" style={{ color, background: `${color}15` }}>
              Destacado
            </span>
          )}
        </div>
        <p className="text-[11px] text-stone-400 dark:text-stone-500 truncate mt-0.5">{product.uso}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <p className="text-[11px] font-semibold text-stone-600 dark:text-stone-300">{product.precio}</p>
        <svg
          className="w-3 h-3 text-stone-300 dark:text-stone-600 group-hover:text-stone-500 dark:group-hover:text-stone-400 transition-colors"
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
        >
          <line x1="7" y1="17" x2="17" y2="7" /><polyline points="7 7 17 7 17 17" />
        </svg>
      </div>
    </a>
  )
}

// ─── PARTNER CARD ─────────────────────────────────────────────────────────────

function PartnerCard({
  partner,
  expanded,
  onToggle,
}: {
  partner: PartnerConProductos
  expanded: boolean
  onToggle: () => void
}) {
  const { color } = partner

  return (
    <div
      className="rounded-[14px] border overflow-hidden transition-all duration-200"
      style={{ borderColor: expanded ? `${color}40` : 'rgb(231 229 228 / 0.7)' }}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-start gap-3 sm:gap-4 p-4 bg-white dark:bg-[#1c1917] hover:bg-stone-50 dark:hover:bg-stone-900/40 transition-colors text-left cursor-pointer border-0"
        style={{ borderBottom: expanded ? `1px solid ${color}20` : undefined }}
      >
        <div className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0" style={{ background: `${color}15` }}>
          <PartnerIcon nombre={partner.nombre} color={color} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-[13.5px] font-bold text-stone-800 dark:text-stone-100">{partner.nombre}</p>
            <span className="text-[9.5px] font-mono font-semibold px-1.5 py-0.5 rounded tracking-wider uppercase" style={{ color, background: `${color}12` }}>
              Partner
            </span>
          </div>
          <p className="text-[11.5px] text-stone-500 dark:text-stone-400 truncate mt-0.5">{partner.slogan}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10.5px] text-stone-400 dark:text-stone-500">{partner.productos.length} productos</span>
          <svg
            className={`w-4 h-4 text-stone-300 dark:text-stone-600 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </button>

      {expanded && (
        <div className="flex flex-col gap-4 p-4 bg-stone-50/50 dark:bg-stone-900/20">
          <div className="flex flex-col gap-2">
            <p className="text-[12px] text-stone-600 dark:text-stone-300 leading-[1.7]">{partner.descripcion}</p>
            <div className="flex items-start gap-2 p-2.5 rounded-[8px]" style={{ background: `${color}08`, border: `1px solid ${color}20` }}>
              <svg className="w-3 h-3 mt-0.5 shrink-0" style={{ color }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              <p className="text-[11px] leading-[1.6]" style={{ color }}>{partner.aporte}</p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-[10.5px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider">Catálogo</p>
            <div className="flex flex-col gap-1.5">
              {partner.productos.map((p: ProductDB) => (
                <ProductRow key={p.id} product={p} color={color} />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1 flex-wrap">
            <a
              href={partner.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-[9px] text-[11.5px] font-semibold text-white no-underline transition-opacity hover:opacity-90"
              style={{ background: color }}
            >
              Visitar {partner.nombre}
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="7" y1="17" x2="17" y2="7" /><polyline points="7 7 17 7 17 17" />
              </svg>
            </a>
            <a
              href={partner.url_contacto}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-[9px] text-[11.5px] font-medium text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 no-underline transition-colors border border-stone-200/70 dark:border-stone-800"
            >
              Contactar
            </a>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── WIDGET PRINCIPAL ─────────────────────────────────────────────────────────

export default function MarketplacePartnersWidget() {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const { partners, loading, error } = useMarketplacePartners()

  const toggle = (id: string) => setExpandedId((prev: string | null) => (prev === id ? null : id))

  if (loading) return (
    <div className="flex justify-center py-10">
      <div className="w-5 h-5 border-2 border-[#2FAF8F] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (error) return (
    <p className="text-[12px] text-red-500 text-center py-6">{error}</p>
  )

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-[#2FAF8F]" />
        <p className="text-[12px] font-semibold text-stone-700 dark:text-stone-200">Partners estratégicos</p>
        <span className="text-[9.5px] font-mono text-stone-400 dark:text-stone-500 uppercase tracking-wider">
          {partners.length} aliados
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {partners.map((partner: PartnerConProductos) => (
          <PartnerCard
            key={partner.id}
            partner={partner}
            expanded={expandedId === partner.id}
            onToggle={() => toggle(partner.id)}
          />
        ))}
      </div>

      <p className="text-[10.5px] text-stone-300 dark:text-stone-600 text-center pt-1 leading-relaxed">
        Gandia no procesa pagos. Los links redirigen al sitio oficial de cada partner.
      </p>
    </div>
  )
}