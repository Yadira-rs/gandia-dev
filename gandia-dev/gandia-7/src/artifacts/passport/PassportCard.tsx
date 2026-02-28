/**
 * PassportCard — estado DORMIDO
 * Inline en el chat. Sin thinking propio — el chat ya lo maneja.
 * Full width, sin max-w restrictivo.
 */

import { useState, useEffect } from 'react'
import type { PassportData } from './mockData'

interface Props {
  data:     PassportData
  onExpand: () => void
}

export default function PassportCard({ data, onExpand }: Props) {
  const [fields,      setFields]      = useState<boolean[]>([false, false, false, false, false])
  const [cardVisible, setCardVisible] = useState(false)
  const [ctaVisible,  setCtaVisible]  = useState(false)

  useEffect(() => {
    const t0 = setTimeout(() => setCardVisible(true), 100)
    const t1 = setTimeout(() => setFields([true, true, false, false, false]), 300)
    const t2 = setTimeout(() => setFields([true, true, true, true, false]),   700)
    const t3 = setTimeout(() => setFields([true, true, true, true, true]),   1100)
    const t4 = setTimeout(() => setCtaVisible(true), 1500)
    return () => [t0, t1, t2, t3, t4].forEach(clearTimeout)
  }, [])

  const rows: { k: string; v: string; mono: boolean; green: boolean; gold: boolean }[][] = [
    [
      { k: 'SINIIGA',      v: data.siniiga,     mono: true,  green: true,  gold: false },
      { k: 'RFID / Arete', v: data.rfid,        mono: true,  green: false, gold: false },
    ],
    [
      { k: 'Raza',         v: data.raza,         mono: false, green: false, gold: false },
      { k: 'Sexo',         v: data.sexo,         mono: false, green: false, gold: false },
    ],
    [
      { k: 'Peso',         v: data.peso,         mono: false, green: false, gold: false },
      { k: 'Nacimiento',   v: data.nacimiento,   mono: false, green: false, gold: false },
    ],
    [
      { k: 'UPP',          v: data.upp,          mono: false, green: false, gold: false },
      { k: 'Propietario',  v: data.propietario,  mono: false, green: false, gold: false },
    ],
    [
      { k: 'Export',       v: data.exportLabel,  mono: false, green: false, gold: true  },
      { k: 'Verificado',   v: data.verificado,   mono: true,  green: false, gold: false },
    ],
  ]

  return (
    <>
      <style>{`
        @keyframes pc-in    { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pc-scan  { 0%{top:0%;opacity:0} 5%{opacity:.8} 95%{opacity:.8} 100%{top:100%;opacity:0} }
        @keyframes pc-cta   { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pc-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.35;transform:scale(.78)} }
        .pc-in    { animation: pc-in   .45s cubic-bezier(.16,1,.3,1) both; }
        .pc-cta   { animation: pc-cta  .4s  cubic-bezier(.16,1,.3,1) both; }
        .pc-pulse { animation: pc-pulse 2s ease-in-out infinite; }
        .pc-scanline { animation: pc-scan 1.8s ease-in-out 1 forwards; position:absolute;left:0;right:0;height:1px;background:linear-gradient(to right,transparent,#2FAF8F,transparent);top:0; }
      `}</style>

      {cardVisible && (
        <div className="pc-in mt-3 w-full border border-stone-200/70 dark:border-stone-800 rounded-2xl overflow-hidden bg-white dark:bg-[#141210]">

          {/* Banda institucional */}
          <div className="bg-[#1c1917] px-4 py-3 flex items-center justify-between">
            <div>
              <p className="font-mono text-[8.5px] tracking-[2.5px] uppercase text-white/30">México · SENASICA</p>
              <p className="text-[15px] font-semibold text-white tracking-tight mt-0.5">PASAPORTE</p>
              <p className="font-mono text-[8.5px] text-white/20 uppercase tracking-[1.5px]">Ganado Bovino · Infraestructura Gandia</p>
            </div>
            <div className="flex items-center gap-1.5 bg-[#2FAF8F]/12 border border-[#2FAF8F]/25 rounded-full px-3 py-1.5">
              <span className="pc-pulse w-1.5 h-1.5 rounded-full bg-[#2FAF8F] shrink-0" />
              <span className="font-mono text-[9.5px] font-semibold text-[#2FAF8F] uppercase tracking-[1px]">{data.estatus}</span>
            </div>
          </div>

          {/* Foto + campos */}
          <div className="flex">
            <div className="w-28 shrink-0 border-r border-stone-100 dark:border-stone-800 overflow-hidden relative" style={{ minHeight: 170 }}>
              <img src={data.photo} alt={data.id} className="w-full h-full object-cover" style={{ filter: 'grayscale(.15) contrast(1.05)' }} />
              <div className="pc-scanline" />
            </div>
            <div className="flex-1 px-4 py-2 flex flex-col divide-y divide-stone-50 dark:divide-stone-800/50">
              {rows.map((row, i) => (
                <div
                  key={i}
                  className="grid grid-cols-2 gap-x-3 py-1.5"
                  style={{
                    opacity:    fields[i] ? 1 : 0,
                    transform:  fields[i] ? 'none' : 'translateX(-4px)',
                    transition: `opacity .35s ease ${i * 55}ms, transform .35s ease ${i * 55}ms`,
                  }}
                >
                  {row.map((f, j) => (
                    <div key={j}>
                      <p className="font-mono text-[8px] text-stone-400 dark:text-stone-500 uppercase tracking-[1px] mb-0.5">{f.k}</p>
                      {f.gold ? (
                        <span className="inline-flex items-center gap-1 font-mono text-[9px] font-semibold text-amber-700 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 px-1.5 py-0.5 rounded tracking-[.5px]">
                          {f.v}
                        </span>
                      ) : (
                        <p className={`text-[12px] font-medium leading-snug ${f.green ? 'text-[#2FAF8F]' : 'text-stone-800 dark:text-stone-100'} ${f.mono ? 'font-mono text-[11px]' : ''}`}>
                          {f.v}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* MRZ */}
          <div className="bg-stone-50 dark:bg-stone-900/40 border-t border-stone-100 dark:border-stone-800 px-4 py-2">
            <p className="font-mono text-[8px] text-stone-300 dark:text-stone-600 tracking-[2px] leading-[1.9]">
              {data.mrz[0]}<br />{data.mrz[1]}
            </p>
          </div>

          {/* CTA */}
          {ctaVisible && (
            <div className="pc-cta px-4 py-2.5 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between gap-3">
              <p className="text-[11.5px] text-stone-500 dark:text-stone-400">
                Trazabilidad completa · <span className="text-[#2FAF8F] font-medium">Arete Azul activo</span>
              </p>
              <button
                onClick={onExpand}
                className="shrink-0 flex items-center gap-1.5 h-7 px-3 rounded-lg bg-[#2FAF8F] hover:bg-[#27a07f] active:scale-95 text-white text-[11.5px] font-semibold transition-all shadow-sm"
              >
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/>
                  <line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
                </svg>
                Ver expediente completo
              </button>
            </div>
          )}
        </div>
      )}
    </>
  )
}