/**
 * VerificationHistorialWidget
 * v2 — header impactante, KPIs tintados, timeline expresivo, metadatos en grid, observaciones legibles.
 */
export interface ItemHistorial {
  id:           number
  ts:           string
  tsFormal:     string
  origen:       'ia' | 'usuario'
  actor:        string
  verificador:  string
  accion:       string
  animal?:      string
  arete?:       string
  dominio:      string
  resultado:    'verificado' | 'rechazado'
  observacion?: string
}

interface Props {
  historial: ItemHistorial[]
}

const DOMINIO_LABEL: Record<string, string> = {
  monitoreo:     'Monitoreo',
  sanidad:       'Sanidad',
  certificacion: 'Certificación',
  gemelo:        'Gemelo',
  biometria:     'Biometría',
  pasaporte:     'Pasaporte',
}

const CIRCUMFERENCE = 2 * Math.PI * 22

function Ring({ pct, color }: { pct: number; color: string }) {
  const offset = CIRCUMFERENCE * (1 - pct / 100)
  return (
    <svg width="56" height="56" viewBox="0 0 56 56">
      <circle cx="28" cy="28" r="22" fill="none"
        stroke="currentColor" className="text-stone-100 dark:text-stone-800"
        strokeWidth="5" />
      <circle cx="28" cy="28" r="22" fill="none"
        stroke={color} strokeWidth="5"
        strokeDasharray={CIRCUMFERENCE}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 28 28)"
        style={{ transition: 'stroke-dashoffset 0.7s ease' }}
      />
      <text x="28" y="32" textAnchor="middle" fontSize="11" fontWeight="500"
        fill={color} fontFamily="sans-serif">
        {pct}%
      </text>
    </svg>
  )
}

// ─── Componente ───────────────────────────────────────────────────────────────

export default function VerificationHistorialWidget({ historial }: Props) {
  const verificados = historial.filter(i => i.resultado === 'verificado').length
  const rechazados  = historial.filter(i => i.resultado === 'rechazado').length
  const total       = historial.length
  const pctAprobado = total > 0 ? Math.round((verificados / total) * 100) : 0
  const headerColor = rechazados === 0 ? '#2FAF8F' : rechazados / total > 0.5 ? '#e11d48' : '#d97706'
  const headerBg    = rechazados === 0 ? '#2FAF8F18' : rechazados / total > 0.5 ? '#ffe4e6' : '#fef3c7'
  const headerText  = rechazados === 0 ? '#1a8c6e'   : rechazados / total > 0.5 ? '#9f1239' : '#92400e'

  return (
    <div className="flex flex-col h-full">

      {/* ── Header ── */}
      <div className="bg-white dark:bg-[#1c1917] border border-stone-200/60 dark:border-stone-800/50 rounded-[16px] overflow-hidden mb-3.5 shrink-0">
        <div className="h-[5px] w-full" style={{ background: headerColor }} />
        <div className="flex items-stretch">
          <div className="flex-1 px-5 pt-[18px] pb-4">
            <p className="text-[10px] text-stone-400 dark:text-stone-500 tracking-[0.07em] uppercase mb-2.5">
              Historial de verificación
            </p>
            <div className="flex items-flex-end gap-2 mb-2">
              <span className="text-[56px] font-medium leading-none tabular-nums" style={{ color: headerColor }}>
                {total}
              </span>
              <span className="text-[16px] text-stone-300 dark:text-stone-600 self-end mb-2">revisiones</span>
            </div>
            <p className="text-[11px] text-stone-400 dark:text-stone-500 mb-3">
              acciones procesadas por verificación humana
            </p>
            <div
              className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full"
              style={{ background: headerBg, color: headerText }}
            >
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: headerColor }} />
              {verificados} verificada{verificados !== 1 ? 's' : ''} · {rechazados} rechazada{rechazados !== 1 ? 's' : ''}
            </div>
          </div>
          <div className="w-[86px] flex flex-col items-center justify-center gap-1.5 px-4 border-l border-stone-100 dark:border-stone-800/40 bg-stone-50/70 dark:bg-stone-900/30">
            <Ring pct={pctAprobado} color={headerColor} />
            <span className="text-[10px] text-stone-400 dark:text-stone-500">aprobadas</span>
          </div>
        </div>
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 gap-2 mb-4 shrink-0">
        {[
          { n: verificados, label: 'Verificadas', color: '#2FAF8F', bg: '#f0fdf4', text: '#166534', track: '#bbf7d0', pct: total > 0 ? (verificados / total) * 100 : 0 },
          { n: rechazados,  label: 'Rechazadas',  color: '#e11d48', bg: '#fff5f5', text: '#9f1239', track: '#fecdd3', pct: total > 0 ? (rechazados  / total) * 100 : 0 },
        ].map(k => (
          <div key={k.label} className="relative rounded-[12px] px-3.5 pt-5 pb-3 overflow-hidden"
            style={{ background: k.bg }}>
            <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: k.color }} />
            <p className="text-[28px] font-medium leading-none tabular-nums mb-1" style={{ color: k.text }}>{k.n}</p>
            <p className="text-[10.5px] mb-2" style={{ color: k.text }}>{k.label}</p>
            <div className="h-[3px] rounded-full overflow-hidden" style={{ background: k.track }}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${k.pct}%`, background: k.color }} />
            </div>
          </div>
        ))}
      </div>

      {/* ── Timeline ── */}
      <p className="text-[10px] text-stone-400 dark:text-stone-500 tracking-[0.07em] uppercase mb-3 px-0.5 shrink-0">
        Línea de tiempo
      </p>

      <div className="flex-1 min-h-0 overflow-y-auto
        [&::-webkit-scrollbar]:w-[3px]
        [&::-webkit-scrollbar-track]:bg-transparent
        [&::-webkit-scrollbar-thumb]:bg-stone-200
        [&::-webkit-scrollbar-thumb]:dark:bg-stone-700/80
        [&::-webkit-scrollbar-thumb]:rounded-full">

        {historial.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12">
            <p className="text-[12px] text-stone-300 dark:text-stone-600">Sin verificaciones aún</p>
          </div>
        ) : (
          <div className="relative">
            {/* Línea vertical */}
            {historial.length > 1 && (
              <div className="absolute left-[19px] top-6 bottom-6 w-px bg-stone-100 dark:bg-stone-800/60" />
            )}

            <div className="flex flex-col gap-0">
              {historial.map(item => {
                const esVerif = item.resultado === 'verificado'
                const resColor = esVerif ? '#2FAF8F' : '#e11d48'
                const resBg    = esVerif ? '#2FAF8F18' : '#e11d4812'
                const resPillBg = esVerif ? '#2FAF8F18' : '#ffe4e6'
                const resPillText = esVerif ? '#1a8c6e' : '#9f1239'
                const domLbl   = DOMINIO_LABEL[item.dominio] ?? item.dominio

                return (
                  <div key={item.id} className="relative flex gap-3.5 pb-5 last:pb-0">

                    {/* Ícono */}
                    <div className="shrink-0 z-10">
                      <div
                        className="w-[38px] h-[38px] rounded-full flex items-center justify-center border-2"
                        style={{ background: resBg, borderColor: resColor }}
                      >
                        {esVerif ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={resColor} strokeWidth="2.5" strokeLinecap="round">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={resColor} strokeWidth="2.5" strokeLinecap="round">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                        )}
                      </div>
                    </div>

                    {/* Cuerpo */}
                    <div className="flex-1 min-w-0 pt-1.5">

                      {/* Top — pill + timestamp */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span
                          className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full"
                          style={{ background: resPillBg, color: resPillText }}
                        >
                          <span className="w-[5px] h-[5px] rounded-full shrink-0" style={{ background: resColor }} />
                          {esVerif ? 'Verificado' : 'Rechazado'}
                        </span>
                        <span className="text-[10px] text-stone-300 dark:text-stone-600 whitespace-nowrap">{item.ts}</span>
                      </div>

                      {/* Acción */}
                      <p className="text-[13px] font-medium text-stone-800 dark:text-stone-100 leading-snug mb-2.5">
                        {item.accion}
                      </p>

                      {/* Metadatos en grid */}
                      <div className="grid grid-cols-2 gap-x-3 gap-y-2 px-3 py-2.5 bg-stone-50/70 dark:bg-stone-900/30 border border-stone-100 dark:border-stone-800/40 rounded-[8px] mb-2.5">
                        {[
                          { label: 'Dominio',     value: domLbl,                               mono: false },
                          { label: 'Origen',      value: item.origen === 'ia' ? 'IA' : 'Usuario', mono: false },
                          { label: 'Verificador', value: item.verificador,                     mono: false },
                          { label: 'Animal',      value: item.animal ? `${item.animal}${item.arete ? ` · ${item.arete}` : ''}` : '—', mono: true },
                        ].map(m => (
                          <div key={m.label}>
                            <p className="text-[10px] text-stone-400 dark:text-stone-500 mb-0.5">{m.label}</p>
                            <p className={`text-[11.5px] font-medium text-stone-600 dark:text-stone-300 ${m.mono ? 'font-mono font-normal' : ''}`}>
                              {m.value}
                            </p>
                          </div>
                        ))}
                      </div>

                      {/* Observación */}
                      {item.observacion && (
                        <div
                          className="px-3 py-2.5 rounded-[8px] border-l-[3px]"
                          style={{
                            background:   esVerif ? '#f0fdf4' : '#fff5f5',
                            borderColor:  resColor,
                          }}
                        >
                          <p className={`text-[11.5px] leading-relaxed italic ${
                            esVerif ? 'text-[#166534]' : 'text-[#9f1239]'
                          }`}>
                            {item.observacion}
                          </p>
                        </div>
                      )}

                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

    </div>
  )
}