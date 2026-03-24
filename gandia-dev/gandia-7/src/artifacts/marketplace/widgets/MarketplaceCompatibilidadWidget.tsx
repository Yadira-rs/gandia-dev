/**
 * MarketplaceCompatibilidadWidget.tsx
 * Muestra qué hardware/sensor es compatible con qué módulo de Gandia.
 * Datos reales desde Supabase.
 *
 * ARCHIVO → src/artifacts/marketplace/widgets/MarketplaceCompatibilidadWidget.tsx
 */

import { useState } from 'react'
import {
  useMarketplaceCompatibilidad,
  type CompatibilidadDB,
  type ProductDB,
  type PartnerDB,
} from '../../../hooks/useMarketplace'

// ─── MÓDULOS DE GANDIA ────────────────────────────────────────────────────────

const MODULO_LABEL: Record<string, string> = {
  passport: 'Ficha Ganadera',
  twins: 'Gemelo Digital',
  monitoring: 'Monitoreo',
  certification: 'Certificación',
  exportacion: 'Exportación',
  documentos: 'Documentos',
  sanidad: 'Sanidad',
  biometria: 'Biometría',
  vinculacion: 'Vinculación',
}

const MODULO_COLOR: Record<string, string> = {
  passport: '#2FAF8F',
  twins: '#6366f1',
  monitoring: '#f59e0b',
  certification: '#3b82f6',
  exportacion: '#f97316',
  documentos: '#3b82f6',
  sanidad: '#ef4444',
  biometria: '#6366f1',
  vinculacion: '#0ea5e9',
}

// ─── TIPOS COMBINADOS ─────────────────────────────────────────────────────────

type CompatItem = CompatibilidadDB & { product: ProductDB; partner: PartnerDB }

// ─── WIDGET ───────────────────────────────────────────────────────────────────

export default function MarketplaceCompatibilidadWidget() {
  const { items, loading, error } = useMarketplaceCompatibilidad()
  const [moduloFiltro, setModuloFiltro] = useState<string | null>(null)

  // Módulos únicos presentes en la data
  const modulos = [...new Set(items.map((i: CompatItem) => i.modulo_gandia))].sort()

  const filtrados = moduloFiltro
    ? items.filter((i: CompatItem) => i.modulo_gandia === moduloFiltro)
    : items

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
      <div>
        <p className="text-[12.5px] font-semibold text-stone-700 dark:text-stone-200">
          Compatibilidad de hardware
        </p>
        <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-0.5">
          Qué dispositivo se integra con qué módulo de Gandia
        </p>
      </div>

      {/* Filtros por módulo */}
      <div className="flex gap-1.5 flex-wrap overflow-x-auto pb-0.5">
        <button
          onClick={() => setModuloFiltro(null)}
          className={`px-2.5 py-1 rounded-full text-[10.5px] font-medium transition-all border cursor-pointer ${!moduloFiltro
              ? 'bg-stone-800 dark:bg-stone-100 text-white dark:text-stone-900 border-transparent'
              : 'bg-transparent text-stone-500 dark:text-stone-400 border-stone-200/70 dark:border-stone-700'
            }`}
        >
          Todos
        </button>
        {modulos.map((m: string) => {
          const color = MODULO_COLOR[m] ?? '#2FAF8F'
          const active = moduloFiltro === m
          return (
            <button
              key={m}
              onClick={() => setModuloFiltro(m)}
              className="px-2.5 py-1 rounded-full text-[10.5px] font-medium transition-all border cursor-pointer"
              style={{
                background: active ? color : 'transparent',
                color: active ? 'white' : '#78716c',
                borderColor: active ? 'transparent' : 'rgb(231 229 228 / 0.7)',
              }}
            >
              {MODULO_LABEL[m] ?? m}
            </button>
          )
        })}
      </div>

      {/* Lista de compatibilidades */}
      {filtrados.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <p className="text-[12px] text-stone-400 dark:text-stone-500">Sin compatibilidades registradas</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtrados.map((item: CompatItem) => {
            const moduloColor = MODULO_COLOR[item.modulo_gandia] ?? '#2FAF8F'
            return (
              <div
                key={item.id}
                className="flex items-start gap-3 p-3.5 rounded-[12px] border border-stone-200/70 dark:border-stone-800 bg-white dark:bg-[#1c1917] flex-wrap sm:flex-nowrap"
              >
                {/* Dot partner color */}
                <div
                  className="w-2 h-2 rounded-full mt-1 shrink-0"
                  style={{ background: item.partner?.color ?? '#2FAF8F' }}
                />

                <div className="flex-1 min-w-0 flex flex-col gap-1">
                  {/* Producto */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-[12.5px] font-semibold text-stone-700 dark:text-stone-200">
                      {item.product?.nombre ?? '—'}
                    </p>
                    <span
                      className="text-[9.5px] font-semibold uppercase tracking-wider"
                      style={{ color: item.partner?.color ?? '#2FAF8F' }}
                    >
                      {item.partner?.nombre ?? '—'}
                    </span>
                  </div>

                  {/* Descripción de la compatibilidad */}
                  <p className="text-[11.5px] text-stone-500 dark:text-stone-400 leading-[1.6]">
                    {item.descripcion}
                  </p>
                </div>

                {/* Badge módulo Gandia */}
                <div
                  className="shrink-0 flex items-center gap-1.5 px-2 py-1 rounded-[7px]"
                  style={{ background: `${moduloColor}10`, border: `1px solid ${moduloColor}25` }}
                >
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: moduloColor }} />
                  <span className="text-[9.5px] font-semibold" style={{ color: moduloColor }}>
                    {MODULO_LABEL[item.modulo_gandia] ?? item.modulo_gandia}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}