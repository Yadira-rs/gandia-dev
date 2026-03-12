/**
 * ExportacionScannerWidget
 * Escáner de aretes por cámara. Standalone o conectado a tabla.
 * onScan(arete) → el Módulo empuja el arete al array de aretes.
 *
 * Flujo realista:
 * 1. Elige folio (dropdown si ya hay aretes, input libre si es nuevo)
 * 2. Activa cámara → visor en vivo
 * 3. Detección automática cada ~2s sin tocar nada
 * 4. Flash + beep visual al detectar
 * 5. Auto-listo para el siguiente arete
 */

import { useState, useEffect, useRef } from 'react'

const EXPORT_COLOR = '#f97316'

interface ScannedArete {
  arete:     string
  folio:     string
  timestamp: string
  isDup:     boolean
}

interface Props {
  existingAretes?: string[]
  existingFolios?: string[]
  onScan?:         (arete: string, folio: string) => void
}

export default function ExportacionScannerWidget({ existingAretes = [], existingFolios = [], onScan }: Props) {
  const [camActive,  setCamActive]  = useState(false)
  const [phase,      setPhase]      = useState<'buscando' | 'detectando' | 'ok' | 'dup'>('buscando')
  const [lastArete,  setLastArete]  = useState<ScannedArete | null>(null)
  const [history,    setHistory]    = useState<ScannedArete[]>([])
  const [count,      setCount]      = useState(0)
  const [folio,      setFolio]      = useState(existingFolios[0] ?? '')
  const [folioInput, setFolioInput] = useState(existingFolios[0] ?? '')
  const [manualMode, setManualMode] = useState(false)
  const [manualVal,  setManualVal]  = useState('')
  const scanRef  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const countRef = useRef(count)
  countRef.current = count

  // Auto-detección mientras cámara está activa
  useEffect(() => {
    if (!camActive) return
    const loop = () => {
      setPhase('detectando')
      scanRef.current = setTimeout(() => {
        const base  = 1_034_567_890 + countRef.current + 1
        const arete = String(base)
        fireDetection(arete)
      }, 1200 + Math.random() * 600)
    }
    // Pequeño delay antes del primer scan
    scanRef.current = setTimeout(loop, 900)
    return () => { if (scanRef.current) clearTimeout(scanRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camActive, folio])

  const fireDetection = (arete: string) => {
    const isDup = existingAretes.includes(arete)
    const scanned: ScannedArete = {
      arete,
      folio,
      timestamp: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      isDup,
    }
    setPhase(isDup ? 'dup' : 'ok')
    setLastArete(scanned)
    setCount(c => c + 1)
    setHistory(h => [scanned, ...h.slice(0, 9)])
    if (!isDup && onScan) onScan(arete, folio)

    // Auto-reset a buscando después de mostrar resultado
    scanRef.current = setTimeout(() => {
      setPhase('buscando')
      // Siguiente detección automática
      scanRef.current = setTimeout(() => {
        setPhase('detectando')
        scanRef.current = setTimeout(() => {
          const nextBase  = 1_034_567_890 + countRef.current + 1
          fireDetection(String(nextBase))
        }, 1200 + Math.random() * 600)
      }, 600)
    }, 2000)
  }

  const handleManual = () => {
    if (!manualVal.trim()) return
    fireDetection(manualVal.trim())
    setManualVal('')
  }

  const activarCamara = () => {
    const f = existingFolios.length > 0 ? folio : folioInput.trim()
    if (!f) return
    setFolio(f)
    setPhase('buscando')
    setCamActive(true)
  }

  const detenerCamara = () => {
    if (scanRef.current) clearTimeout(scanRef.current)
    setCamActive(false)
    setPhase('buscando')
  }

  useEffect(() => () => { if (scanRef.current) clearTimeout(scanRef.current) }, [])

  return (
    <>
      <style>{`
        @keyframes sc-scan  { 0%,100%{transform:translateY(0)}   50%{transform:translateY(72px)} }
        @keyframes sc-ping  { 0%{transform:scale(1);opacity:.8}  100%{transform:scale(2);opacity:0} }
        @keyframes sc-flash { 0%{opacity:.35} 100%{opacity:0} }
        @keyframes sc-blink { 0%,100%{opacity:1} 50%{opacity:.25} }
        @keyframes sc-slide { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
        .sc-scan  { animation: sc-scan  1.6s ease-in-out infinite; }
        .sc-ping  { animation: sc-ping  .7s ease-out forwards; }
        .sc-flash { animation: sc-flash .35s ease-out forwards; }
        .sc-blink { animation: sc-blink 1s ease-in-out infinite; }
        .sc-slide { animation: sc-slide .2s ease-out; }
      `}</style>

      <div className="flex flex-col gap-3">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#1c1917] rounded-[12px]">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: EXPORT_COLOR }}/>
            <p className="text-[12px] font-semibold text-white">Escáner SINIIGA</p>
          </div>
          <div className="flex items-center gap-1.5 rounded-full px-2.5 py-1 bg-stone-800/60 border border-stone-700/50">
            <span
              className={`w-1.5 h-1.5 rounded-full ${camActive && phase === 'buscando' ? 'sc-blink' : ''}`}
              style={{ background: !camActive ? '#52525b' : phase === 'ok' ? '#22c55e' : phase === 'dup' ? '#f59e0b' : phase === 'detectando' ? EXPORT_COLOR : '#22c55e' }}
            />
            <span className="font-mono text-[9.5px] text-stone-400 uppercase tracking-[.5px]">
              {!camActive ? 'Inactivo' : phase === 'buscando' ? 'Buscando…' : phase === 'detectando' ? 'Leyendo…' : phase === 'ok' ? 'Capturado' : 'Duplicado'}
            </span>
          </div>
        </div>

        {/* ── Selector de folio (solo cuando cámara inactiva) ── */}
        {!camActive && (
          <div className="flex flex-col gap-2 p-3.5 rounded-[10px] border border-stone-200 dark:border-stone-700/60 bg-stone-50 dark:bg-stone-800/20">
            <p className="font-mono text-[9px] uppercase tracking-[1px] text-stone-400">Folio a asignar</p>
            {existingFolios.length > 0 ? (
              <select
                className="w-full px-3 py-2 rounded-[8px] border border-stone-200 dark:border-stone-700/60 bg-white dark:bg-stone-800/40 text-[12px] font-mono text-stone-800 dark:text-stone-100 focus:outline-none focus:border-[#f97316]/60 transition-all cursor-pointer"
                value={folio}
                onChange={e => setFolio(e.target.value)}
              >
                {existingFolios.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            ) : (
              <input
                className="w-full px-3 py-2 rounded-[8px] border border-stone-200 dark:border-stone-700/60 bg-white dark:bg-stone-800/40 text-[12px] font-mono text-stone-800 dark:text-stone-100 focus:outline-none focus:border-[#f97316]/60 focus:ring-1 focus:ring-[#f97316]/20 transition-all"
                placeholder="FAC-2025-000"
                value={folioInput}
                onChange={e => setFolioInput(e.target.value)}
              />
            )}
            <button
              onClick={activarCamara}
              disabled={existingFolios.length === 0 && !folioInput.trim()}
              className="flex items-center justify-center gap-2 py-2.5 rounded-[10px] text-[12px] font-semibold text-white border-0 cursor-pointer hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              style={{ background: EXPORT_COLOR }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
              Activar cámara
            </button>
          </div>
        )}

        {/* ── Visor de cámara ── */}
        {camActive && (
          <div className="flex flex-col gap-2">

            {/* Folio activo */}
            <div className="flex items-center justify-between px-3 py-1.5 rounded-[8px] bg-orange-50/60 dark:bg-orange-950/10 border border-orange-100 dark:border-orange-900/30">
              <div className="flex items-center gap-1.5">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                <span className="font-mono text-[10px] text-stone-500 dark:text-stone-400">{folio}</span>
              </div>
              <span className="font-mono text-[10px] font-bold" style={{ color: EXPORT_COLOR }}>{count} cap.</span>
            </div>

            {/* Visor */}
            <div className="relative bg-stone-900 rounded-[12px] overflow-hidden border border-stone-800" style={{ height: 180 }}>

              {/* Simulación de "ruido de cámara" */}
              <div className="absolute inset-0 opacity-[0.04]" style={{
                backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,.3) 2px, rgba(255,255,255,.3) 4px)',
              }}/>

              {/* Flash al detectar */}
              {(phase === 'ok' || phase === 'dup') && (
                <div className="sc-flash absolute inset-0 rounded-[12px]"
                  style={{ background: phase === 'ok' ? '#22c55e' : '#f59e0b' }}
                />
              )}

              {/* Esquinas del visor */}
              {(['top-2 left-2', 'top-2 right-2', 'bottom-2 left-2', 'bottom-2 right-2'] as const).map((pos, i) => (
                <div key={i} className={`absolute ${pos} w-5 h-5`}>
                  <div className="absolute top-0 left-0 w-full h-[2px]" style={{ background: EXPORT_COLOR, opacity: .8 }}/>
                  <div className="absolute top-0 left-0 h-full w-[2px]" style={{ background: EXPORT_COLOR, opacity: .8 }}/>
                </div>
              ))}

              {/* Línea de escaneo activa */}
              {phase === 'buscando' && (
                <div className="sc-scan absolute left-4 right-4 h-[2px]"
                  style={{ background: `linear-gradient(to right, transparent, ${EXPORT_COLOR}, transparent)`, opacity: .9 }}
                />
              )}

              {/* Zona central de detección */}
              {phase === 'detectando' && (
                <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-10 flex items-center justify-center">
                  <div className="w-full h-[1.5px] sc-blink" style={{ background: `linear-gradient(to right, transparent, ${EXPORT_COLOR}, transparent)` }}/>
                </div>
              )}

              {/* Resultado */}
              {(phase === 'ok' || phase === 'dup') && lastArete && (
                <div className="sc-slide absolute inset-0 flex flex-col items-center justify-center gap-1.5">
                  <div className="relative">
                    {phase === 'ok' && <div className="sc-ping absolute inset-[-4px] rounded-full" style={{ background: '#22c55e40' }}/>}
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center relative"
                      style={{ background: phase === 'ok' ? '#22c55e20' : '#f59e0b20', border: `1.5px solid ${phase === 'ok' ? '#22c55e60' : '#f59e0b60'}` }}
                    >
                      {phase === 'ok'
                        ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                        : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      }
                    </div>
                  </div>
                  <p className="font-mono text-[15px] font-bold text-white tracking-wider">{lastArete.arete}</p>
                  <p className="font-mono text-[9px]" style={{ color: phase === 'ok' ? '#4ade80' : '#fbbf24' }}>
                    {phase === 'ok' ? '✓ Agregado a tabla' : '⚠ Ya capturado — ignorado'}
                  </p>
                </div>
              )}

              {/* Estado buscando */}
              {phase === 'buscando' && (
                <div className="absolute bottom-3 left-0 right-0 flex justify-center">
                  <span className="font-mono text-[8px] text-stone-500 uppercase tracking-widest">Apunta al arete</span>
                </div>
              )}
            </div>

            {/* Controles activos */}
            <div className="flex gap-2">
              {/* Entrada manual */}
              <div className="flex-1 flex gap-1.5">
                {manualMode ? (
                  <>
                    <input
                      autoFocus
                      className="flex-1 px-2.5 py-1.5 rounded-[8px] border border-stone-200 dark:border-stone-700/60 bg-white dark:bg-stone-800/40 text-[11px] font-mono text-stone-800 dark:text-stone-100 focus:outline-none focus:border-[#f97316]/60 transition-all"
                      placeholder="Escribe el arete"
                      value={manualVal}
                      onChange={e => setManualVal(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { handleManual(); setManualMode(false) } if (e.key === 'Escape') setManualMode(false) }}
                    />
                    <button onClick={() => { handleManual(); setManualMode(false) }}
                      className="px-2.5 py-1.5 rounded-[8px] text-[11px] font-semibold text-white border-0 cursor-pointer"
                      style={{ background: EXPORT_COLOR }}>OK</button>
                  </>
                ) : (
                  <button onClick={() => setManualMode(true)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[8px] text-[11px] text-stone-500 dark:text-stone-400 border border-stone-200 dark:border-stone-700/60 bg-white dark:bg-stone-800/40 cursor-pointer hover:text-stone-700 transition-all">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Manual
                  </button>
                )}
              </div>
              <button onClick={detenerCamara}
                className="px-3 py-1.5 rounded-[8px] text-[11px] font-medium text-stone-500 border border-stone-200 dark:border-stone-700/60 bg-white dark:bg-stone-800/40 cursor-pointer hover:text-red-500 hover:border-red-200 transition-all">
                Detener
              </button>
            </div>
          </div>
        )}

        {/* ── Historial de capturas ── */}
        {history.length > 0 && (
          <div className="border border-stone-100 dark:border-stone-800 rounded-[10px] overflow-hidden">
            <p className="px-3 pt-2 pb-1 font-mono text-[8.5px] text-stone-400 dark:text-stone-500 uppercase tracking-[1px]">
              Capturas recientes
            </p>
            {history.map((h, i) => (
              <div key={i} className="sc-slide flex items-center justify-between px-3 py-1.5 border-t border-stone-50 dark:border-stone-800/50">
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${h.isDup ? 'bg-amber-400' : 'bg-green-400'}`}/>
                  <span className="font-mono text-[10.5px] text-stone-600 dark:text-stone-300">{h.arete}</span>
                  <span className="font-mono text-[9px] text-stone-400">{h.folio}</span>
                  {h.isDup && <span className="text-[9px] text-amber-500 font-medium">dup</span>}
                </div>
                <span className="font-mono text-[9.5px] text-stone-400">{h.timestamp}</span>
              </div>
            ))}
          </div>
        )}

      </div>
    </>
  )
}