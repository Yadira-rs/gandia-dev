/**
 * ExportacionScannerWidget — cámara real con @zxing/browser
 * ARCHIVO → src/artifacts/exportacion/widgets/ExportacionScannerWidget.tsx
 *
 * npm install @zxing/browser @zxing/library
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'
import type { IScannerControls } from '@zxing/browser'

const EXPORT_COLOR = '#f97316'

function esSINIIGAValido(s: string): boolean {
  if (!/^\d{10}$/.test(s)) return false
  const n = Number(s)
  return n >= 1_000_000_000 && n <= 1_100_000_000
}

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
  const [modo,       setModo]       = useState<'pistola' | 'camara'>('pistola')
  const [streaming,  setStreaming]  = useState(false)
  const [phase,      setPhase]      = useState<'buscando' | 'ok' | 'dup' | 'invalido'>('buscando')
  const [lastArete,  setLastArete]  = useState<ScannedArete | null>(null)
  const [history,    setHistory]    = useState<ScannedArete[]>([])
  const [count,      setCount]      = useState(0)
  const [folio,      setFolio]      = useState(existingFolios[0] ?? '')
  const [folioInput, setFolioInput] = useState(existingFolios[0] ?? '')
  const [manualMode, setManualMode] = useState(false)
  const [manualVal,  setManualVal]  = useState('')
  const [camError,   setCamError]   = useState<string | null>(null)
  const [pistolaVal, setPistolaVal] = useState('')
  const [pistolaErr, setPistolaErr] = useState<string | null>(null)
  const [nuevoFolio, setNuevoFolio] = useState(false)

  const pistolaRef   = useRef<HTMLInputElement>(null)

  const videoRef     = useRef<HTMLVideoElement>(null)
  const streamRef    = useRef<MediaStream | null>(null)
  const controlsRef  = useRef<IScannerControls | null>(null)
  const cooldownRef  = useRef(false)
  const folioRef     = useRef(folio)
  useEffect(() => { folioRef.current = folio }, [folio])

  const fireDetection = useCallback((arete: string) => {
    const isDup = existingAretes.includes(arete)
    const scanned: ScannedArete = {
      arete,
      folio:     folioRef.current,
      timestamp: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      isDup,
    }
    setPhase(isDup ? 'dup' : 'ok')
    setLastArete(scanned)
    setCount(c => c + 1)
    setHistory(h => [scanned, ...h.slice(0, 9)])
    if (!isDup && onScan) onScan(arete, folioRef.current)
    setTimeout(() => { cooldownRef.current = false; setPhase('buscando') }, 2500)
  }, [existingAretes, onScan])

  const pendingStreamRef = useRef<MediaStream | null>(null)

  // Asignar stream al video DESPUÉS de que el elemento esté en el DOM
  useEffect(() => {
    if (streaming && videoRef.current && pendingStreamRef.current) {
      videoRef.current.srcObject = pendingStreamRef.current
      videoRef.current.play().then(() => {
        const stream = pendingStreamRef.current!
        setTimeout(async () => {
          const reader = new BrowserMultiFormatReader()
          const controls = await reader.decodeFromStream(stream, videoRef.current!, (result, err, ctrl) => {
            controlsRef.current = ctrl
            if (cooldownRef.current || !result) { void err; return }
            const raw = result.getText().trim()
            if (!raw) return
            cooldownRef.current = true
            if (!esSINIIGAValido(raw)) {
              setPhase('invalido')
              setTimeout(() => { cooldownRef.current = false; setPhase('buscando') }, 1200)
              return
            }
            fireDetection(raw)
          })
          controlsRef.current = controls
        }, 700)
      }).catch(console.error)
    }
  }, [streaming, fireDetection])

  const startCamera = useCallback(async () => {
    setCamError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      })
      streamRef.current = stream
      pendingStreamRef.current = stream
      setStreaming(true)   // el useEffect asigna srcObject cuando el <video> monta
      setPhase('buscando')
    } catch (err) {
      console.error('[Scanner]', err)
      const msg = err instanceof Error ? err.message : String(err)
      if (msg.includes('Permission') || msg.includes('NotAllowed')) {
        setCamError('Permiso de cámara denegado — actívalo en la configuración del navegador')
      } else if (msg.includes('NotFound') || msg.includes('DevicesNotFound')) {
        setCamError('No se encontró cámara en este dispositivo')
      } else {
        setCamError(`Error: ${msg}`)
      }
    }
  }, [])

  const stopCamera = useCallback(() => {
    controlsRef.current?.stop()
    controlsRef.current = null
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    pendingStreamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setStreaming(false)
    setPhase('buscando')
    cooldownRef.current = false
  }, [])

  useEffect(() => () => stopCamera(), [stopCamera])

  const activarCamara = async () => {
    const f = existingFolios.length > 0 ? folio : folioInput.trim()
    if (!f) return
    setFolio(f)
    await startCamera()
  }

  const handleManual = () => {
    const s = manualVal.trim()
    if (!s || !esSINIIGAValido(s)) { setManualVal(''); return }
    fireDetection(s)
    setManualVal('')
    setManualMode(false)
  }

  // ── Pistola: dispara en Enter (igual que teclado HID) ────────────────────
  const handlePistola = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return
    const s = pistolaVal.trim()
    setPistolaVal('')
    setPistolaErr(null)
    if (!s) return
    if (!esSINIIGAValido(s)) {
      setPistolaErr(`"${s}" no es un arete SINIIGA válido — 10 dígitos, rango 1,000,000,000–1,100,000,000`)
      return
    }
    fireDetection(s)
  }

  // Mantener foco en el input de pistola mientras está en ese modo
  useEffect(() => {
    if (modo === 'pistola') pistolaRef.current?.focus()
  }, [modo])

  return (
    <>
      <style>{`
        @keyframes sc-scan  { 0%,100%{transform:translateY(0)}  50%{transform:translateY(72px)} }
        @keyframes sc-ping  { 0%{transform:scale(1);opacity:.8} 100%{transform:scale(2);opacity:0} }
        @keyframes sc-flash { 0%{opacity:.4} 100%{opacity:0} }
        @keyframes sc-blink { 0%,100%{opacity:1} 50%{opacity:.25} }
        @keyframes sc-slide { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
        .sc-scan  { animation: sc-scan  1.6s ease-in-out infinite; }
        .sc-ping  { animation: sc-ping  .7s ease-out forwards; }
        .sc-flash { animation: sc-flash .4s ease-out forwards; }
        .sc-blink { animation: sc-blink 1s ease-in-out infinite; }
        .sc-slide { animation: sc-slide .2s ease-out; }
      `}</style>

      <div className="flex flex-col gap-3">

        {/* ── Header + selector de modo ── */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#1c1917] rounded-[12px]">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: EXPORT_COLOR }}/>
            <p className="text-[12px] font-semibold text-white">Escáner SINIIGA</p>
          </div>
          {/* Selector pistola / cámara */}
          <div className="flex items-center gap-0.5 bg-stone-800/60 rounded-[8px] p-0.5">
            {(['pistola', 'camara'] as const).map(m => (
              <button key={m} onClick={() => { setModo(m); if (streaming) stopCamera() }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-[10.5px] font-medium border-0 cursor-pointer transition-all ${
                  modo === m ? 'bg-white/10 text-white' : 'text-stone-500 hover:text-stone-300'
                }`}>
                {m === 'pistola'
                  ? <><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2v-4M9 21H5a2 2 0 0 1-2-2v-4m0 0h18"/></svg>Pistola</>
                  : <><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>Cámara</>
                }
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5 rounded-full px-2.5 py-1 bg-stone-800/60 border border-stone-700/50">
            <span
              className={`w-1.5 h-1.5 rounded-full ${(streaming || modo === 'pistola') && phase === 'buscando' ? 'sc-blink' : ''}`}
              style={{
                background: phase === 'ok'      ? '#22c55e'
                  : phase === 'dup'             ? '#f59e0b'
                  : phase === 'invalido'        ? '#ef4444'
                  : (streaming || modo === 'pistola') ? '#22c55e' : '#52525b',
              }}
            />
            <span className="font-mono text-[9.5px] text-stone-400 uppercase tracking-[.5px]">
              {phase === 'ok' ? 'Capturado' : phase === 'dup' ? 'Duplicado' : phase === 'invalido' ? 'Inválido'
                : modo === 'pistola' ? 'Listo' : !streaming ? 'Inactivo' : 'Buscando…'}
            </span>
          </div>
        </div>

        {/* ── MODO PISTOLA ── */}
        {modo === 'pistola' && (
          <div className="flex flex-col gap-3">

            {/* Setup info */}
            <div className="flex flex-col gap-2 px-3.5 py-3 rounded-[10px] bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700/60">
              <p className="text-[11.5px] font-semibold text-stone-700 dark:text-stone-200">¿Cómo conectar tu pistola lectora?</p>
              <ol className="flex flex-col gap-1">
                {[
                  'Enciende la pistola y activa Bluetooth',
                  'En tu dispositivo: Configuración → Bluetooth → Emparejar nuevo dispositivo',
                  'Selecciona la pistola en la lista',
                  'Regresa aquí, haz clic en el campo de captura y escanea',
                ].map((paso, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-[9.5px] font-bold mt-0.5 shrink-0" style={{ color: EXPORT_COLOR }}>{i + 1}.</span>
                    <span className="text-[10.5px] text-stone-500 dark:text-stone-400 leading-snug">{paso}</span>
                  </li>
                ))}
              </ol>
              <p className="text-[10px] text-stone-400 dark:text-stone-500 border-t border-stone-200 dark:border-stone-700/60 pt-2 mt-0.5">
                La pistola funciona como teclado — no requiere app ni driver adicional.
              </p>
            </div>

            {/* Folio */}
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[9px] uppercase tracking-[1px] text-stone-400">Folio a asignar</label>
              {existingFolios.length > 0 && !nuevoFolio ? (
                <div className="flex gap-1.5">
                  <select value={folio} onChange={e => setFolio(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-[8px] border border-stone-200 dark:border-stone-700/60 bg-white dark:bg-stone-800/40 text-[12px] font-mono text-stone-800 dark:text-stone-100 focus:outline-none focus:border-[#f97316]/60 transition-all cursor-pointer">
                    {existingFolios.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                  <button
                    onClick={() => { setNuevoFolio(true); setFolioInput(''); pistolaRef.current?.blur() }}
                    title="Nuevo folio"
                    className="flex items-center justify-center w-9 rounded-[8px] border border-stone-200 dark:border-stone-700/60 bg-white dark:bg-stone-800/40 text-stone-400 hover:text-[#f97316] hover:border-[#f97316]/40 cursor-pointer transition-all shrink-0">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                  </button>
                </div>
              ) : (
                <div className="flex gap-1.5">
                  <input value={folioInput} onChange={e => setFolioInput(e.target.value)}
                    onBlur={() => { if (folioInput.trim()) setFolio(folioInput.trim()) }}
                    placeholder="FAC-2025-000"
                    autoFocus={nuevoFolio}
                    className="flex-1 px-3 py-2 rounded-[8px] border border-stone-200 dark:border-stone-700/60 bg-white dark:bg-stone-800/40 text-[12px] font-mono focus:outline-none focus:border-[#f97316]/60 transition-all" />
                  {existingFolios.length > 0 && (
                    <button onClick={() => { setNuevoFolio(false); setFolio(existingFolios[0]) }}
                      className="flex items-center justify-center w-9 rounded-[8px] border border-stone-200 dark:border-stone-700/60 bg-white dark:bg-stone-800/40 text-stone-400 hover:text-stone-600 cursor-pointer transition-all shrink-0">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <polyline points="15 19 8 12 15 5"/>
                      </svg>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Input pistola — siempre enfocado */}
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[9px] uppercase tracking-[1px] text-stone-400">Campo de captura</label>
              <div className="relative">
                <input
                  ref={pistolaRef}
                  value={pistolaVal}
                  onChange={e => { setPistolaVal(e.target.value); setPistolaErr(null) }}
                  onKeyDown={handlePistola}
                  onBlur={e => {
                    const next = e.relatedTarget as HTMLElement | null
                    // No robar foco si el usuario está interactuando con folio
                    if (next && (next.tagName === 'SELECT' || next.tagName === 'INPUT' || next.tagName === 'BUTTON')) return
                    setTimeout(() => pistolaRef.current?.focus(), 150)
                  }}
                  placeholder="Apunta y escanea aquí…"
                  className={`w-full px-3 py-3 rounded-[9px] border-2 bg-white dark:bg-stone-900/60 text-[13px] font-mono focus:outline-none transition-all ${
                    pistolaErr
                      ? 'border-red-400 dark:border-red-500'
                      : phase === 'ok'
                        ? 'border-emerald-400 dark:border-emerald-500'
                        : 'border-[#f97316]/60 dark:border-[#f97316]/40'
                  } text-stone-800 dark:text-stone-100`}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#f97316] sc-blink inline-block"/>
                </div>
              </div>
              {pistolaErr && (
                <p className="text-[10.5px] text-red-500 leading-snug">{pistolaErr}</p>
              )}
              <p className="text-[10px] text-stone-400 dark:text-stone-500">
                {count > 0 ? `${count} arete${count !== 1 ? 's' : ''} capturado${count !== 1 ? 's' : ''} · ` : ''}
                Folio activo: <span className="font-mono">{folio || folioInput || '—'}</span>
              </p>
            </div>
          </div>
        )}

        {/* ── MODO CÁMARA ── */}
        {modo === 'camara' && (<>

        {/* ── Error ── */}
        {camError !== null && (
          <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-[9px] bg-red-50/70 dark:bg-red-950/15 border border-red-200 dark:border-red-800/40">
            <svg width="12" height="12" className="shrink-0 mt-0.5 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <p className="text-[11px] text-red-600 dark:text-red-400 leading-snug">{camError}</p>
          </div>
        )}

        {/* ── Selector de folio (cámara inactiva) ── */}
        {!streaming && (
          <div className="flex flex-col gap-2 p-3.5 rounded-[10px] border border-stone-200 dark:border-stone-700/60 bg-stone-50 dark:bg-stone-800/20">
            <p className="font-mono text-[9px] uppercase tracking-[1px] text-stone-400">Folio a asignar</p>
            {existingFolios.length > 0 && !nuevoFolio ? (
              <div className="flex gap-1.5">
                <select value={folio} onChange={e => setFolio(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-[8px] border border-stone-200 dark:border-stone-700/60 bg-white dark:bg-stone-800/40 text-[12px] font-mono text-stone-800 dark:text-stone-100 focus:outline-none focus:border-[#f97316]/60 transition-all cursor-pointer">
                  {existingFolios.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
                <button onClick={() => { setNuevoFolio(true); setFolioInput('') }} title="Nuevo folio"
                  className="flex items-center justify-center w-9 rounded-[8px] border border-stone-200 dark:border-stone-700/60 bg-white dark:bg-stone-800/40 text-stone-400 hover:text-[#f97316] hover:border-[#f97316]/40 cursor-pointer transition-all shrink-0">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                </button>
              </div>
            ) : (
              <div className="flex gap-1.5">
                <input value={folioInput} onChange={e => setFolioInput(e.target.value)}
                  placeholder="FAC-2025-000" autoFocus={nuevoFolio}
                  className="flex-1 px-3 py-2 rounded-[8px] border border-stone-200 dark:border-stone-700/60 bg-white dark:bg-stone-800/40 text-[12px] font-mono text-stone-800 dark:text-stone-100 focus:outline-none focus:border-[#f97316]/60 focus:ring-1 focus:ring-[#f97316]/20 transition-all" />
                {existingFolios.length > 0 && (
                  <button onClick={() => { setNuevoFolio(false); setFolio(existingFolios[0]) }}
                    className="flex items-center justify-center w-9 rounded-[8px] border border-stone-200 dark:border-stone-700/60 bg-white dark:bg-stone-800/40 text-stone-400 hover:text-stone-600 cursor-pointer transition-all shrink-0">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <polyline points="15 19 8 12 15 5"/>
                    </svg>
                  </button>
                )}
              </div>
            )}
            <button onClick={activarCamara}
              disabled={existingFolios.length === 0 && !folioInput.trim()}
              className="flex items-center justify-center gap-2 py-2.5 rounded-[10px] text-[12px] font-semibold text-white border-0 cursor-pointer hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
              style={{ background: EXPORT_COLOR }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
              Activar cámara
            </button>
          </div>
        )}

        {/* ── Visor activo ── */}
        {streaming && (
          <div className="flex flex-col gap-2">

            {/* Folio activo */}
            <div className="flex items-center justify-between px-3 py-1.5 rounded-[8px] bg-orange-50/60 dark:bg-orange-950/10 border border-orange-100 dark:border-orange-900/30">
              <div className="flex items-center gap-1.5">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                </svg>
                <span className="font-mono text-[10px] text-stone-500 dark:text-stone-400">{folio}</span>
              </div>
              <span className="font-mono text-[10px] font-bold" style={{ color: EXPORT_COLOR }}>{count} cap.</span>
            </div>

            {/* Video */}
            <div className="relative bg-stone-900 rounded-[12px] overflow-hidden border border-stone-800" style={{ height: 220 }}>
              <video ref={videoRef} muted playsInline
                className="absolute inset-0 w-full h-full object-cover" />

              {/* Flash */}
              {(phase === 'ok' || phase === 'dup' || phase === 'invalido') && (
                <div className="sc-flash absolute inset-0 pointer-events-none"
                  style={{ background: phase === 'ok' ? '#22c55e' : phase === 'dup' ? '#f59e0b' : '#ef4444' }} />
              )}

              {/* Esquinas */}
              {(['top-3 left-3', 'top-3 right-3', 'bottom-3 left-3', 'bottom-3 right-3'] as const).map((pos, i) => (
                <div key={i} className={`absolute ${pos} w-5 h-5 pointer-events-none`}>
                  <div className="absolute top-0 left-0 w-full h-[2px]" style={{ background: EXPORT_COLOR, opacity: .9 }}/>
                  <div className="absolute top-0 left-0 h-full w-[2px]" style={{ background: EXPORT_COLOR, opacity: .9 }}/>
                </div>
              ))}

              {/* Línea de escaneo */}
              {phase === 'buscando' && (
                <div className="sc-scan absolute left-6 right-6 h-[2px] pointer-events-none"
                  style={{ background: `linear-gradient(to right, transparent, ${EXPORT_COLOR}, transparent)`, opacity: .9 }} />
              )}

              {/* Resultado */}
              {(phase === 'ok' || phase === 'dup' || phase === 'invalido') && lastArete !== null && (
                <div className="sc-slide absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black/50">
                  <div className="relative">
                    {phase === 'ok' && <div className="sc-ping absolute inset-[-4px] rounded-full" style={{ background: '#22c55e40' }}/>}
                    <div className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{
                        background: phase === 'ok' ? '#22c55e20' : phase === 'dup' ? '#f59e0b20' : '#ef444420',
                        border: `1.5px solid ${phase === 'ok' ? '#22c55e60' : phase === 'dup' ? '#f59e0b60' : '#ef444460'}`,
                      }}>
                      {phase === 'ok'
                        ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                        : phase === 'dup'
                          ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                          : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      }
                    </div>
                  </div>
                  <p className="font-mono text-[15px] font-bold text-white tracking-wider">{lastArete.arete}</p>
                  <p className="font-mono text-[9px]" style={{ color: phase === 'ok' ? '#4ade80' : phase === 'dup' ? '#fbbf24' : '#f87171' }}>
                    {phase === 'ok' ? '✓ Agregado' : phase === 'dup' ? '⚠ Ya capturado' : '✕ No es arete SINIIGA'}
                  </p>
                </div>
              )}

              {phase === 'buscando' && (
                <div className="absolute bottom-3 left-0 right-0 flex justify-center pointer-events-none">
                  <span className="font-mono text-[8px] text-stone-400 uppercase tracking-widest">
                    Apunta al código de barras del arete
                  </span>
                </div>
              )}
            </div>

            {/* Controles */}
            <div className="flex gap-2">
              <div className="flex-1 flex gap-1.5">
                {manualMode ? (
                  <>
                    <input autoFocus value={manualVal}
                      onChange={e => setManualVal(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleManual(); if (e.key === 'Escape') setManualMode(false) }}
                      placeholder="1034567891"
                      className="flex-1 px-2.5 py-1.5 rounded-[8px] border border-stone-200 dark:border-stone-700/60 bg-white dark:bg-stone-800/40 text-[11px] font-mono text-stone-800 dark:text-stone-100 focus:outline-none focus:border-[#f97316]/60 transition-all" />
                    <button onClick={handleManual}
                      className="px-2.5 py-1.5 rounded-[8px] text-[11px] font-semibold text-white border-0 cursor-pointer hover:opacity-90"
                      style={{ background: EXPORT_COLOR }}>OK</button>
                    <button onClick={() => setManualMode(false)}
                      className="px-2.5 py-1.5 rounded-[8px] text-[11px] text-stone-400 border border-stone-200 dark:border-stone-700/60 bg-transparent cursor-pointer hover:text-stone-600 transition-all">✕</button>
                  </>
                ) : (
                  <button onClick={() => setManualMode(true)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[8px] text-[11px] text-stone-500 dark:text-stone-400 border border-stone-200 dark:border-stone-700/60 bg-white dark:bg-stone-800/40 cursor-pointer hover:text-stone-700 transition-all">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    Manual
                  </button>
                )}
              </div>
              <button onClick={stopCamera}
                className="px-3 py-1.5 rounded-[8px] text-[11px] font-medium text-stone-500 border border-stone-200 dark:border-stone-700/60 bg-white dark:bg-stone-800/40 cursor-pointer hover:text-red-500 hover:border-red-200 transition-all">
                Detener
              </button>
            </div>
          </div>
        )}

        </>)}

        {/* ── Historial ── */}
        {history.length > 0 && (
          <div className="border border-stone-100 dark:border-stone-800 rounded-[10px] overflow-hidden">
            <p className="px-3 pt-2.5 pb-1.5 font-mono text-[8.5px] text-stone-400 dark:text-stone-500 uppercase tracking-[1px]">
              Capturas recientes
            </p>
            {history.map((h, i) => (
              <div key={i} className="sc-slide flex items-center justify-between px-3 py-2 border-t border-stone-50 dark:border-stone-800/50">
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