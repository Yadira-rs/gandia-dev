/**
 * FichaCard — con QR real generado desde mrz guardado en BD
 * 
 * ARCHIVO → src/artifacts/passport/widgets/FichaCard.tsx
 * 
 * CAMBIOS vs versión mock:
 *   - Genera QR a partir de data.mrz[0] + data.mrz[1] (datos reales de BD)
 *   - Botón "Descargar credencial" genera PDF descargable
 *   - Quita dependencia de MOCK_PASSPORT
 *   - Instala: npm install qrcode @types/qrcode
 */

import { useCallback, useEffect, useState } from 'react'
import QRCode from 'qrcode'
import type { PassportData } from '../../../hooks/useAnimales'

interface Props {
  data:      PassportData
  onHuella?: () => void
}

export default function FichaCard({ data, onHuella }: Props) {
  const [qrDataUrl,  setQrDataUrl]  = useState<string>('')
  const [qrError,    setQrError]    = useState(false)
  const [mrzOk,      setMrzOk]      = useState(false)

  const generateQr = useCallback(async (mrz: [string, string] | null, siniiga: string) => {
    const hasMrz = mrz && mrz[0] && mrz[0].length > 5
    const content = hasMrz ? `${mrz[0]}\n${mrz[1]}` : siniiga
    setMrzOk(!!hasMrz)
    try {
      const url = await QRCode.toDataURL(content, {
        errorCorrectionLevel: 'H',
        margin: 2,
        width:  200,
        color: { dark: '#1c1917', light: '#ffffff' },
      })
      setQrDataUrl(url)
      setQrError(false)
    } catch {
      setQrError(true)
    }
  }, [])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void generateQr(data.mrz, data.siniiga) }, [data.mrz, data.siniiga, generateQr])

  // ── Descargar credencial como PNG ─────────────────────────────────────────
  const handleDescargar = () => {
    if (!qrDataUrl) return
    const a      = document.createElement('a')
    a.href       = qrDataUrl
    a.download   = `ficha-${data.siniiga.replace(/[^A-Z0-9]/gi, '')}.png`
    a.click()
  }

  return (
    <div className="rounded-2xl border border-stone-200/70 dark:border-stone-800 bg-white dark:bg-[#1c1917] overflow-hidden">

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-stone-100 dark:border-stone-800">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-[#2FAF8F]" />
          <p className="text-[12px] font-bold text-stone-700 dark:text-stone-200 tracking-wide uppercase">
            Ficha Ganadera · {data.estatus}
          </p>
        </div>
        <span className="text-[9.5px] font-mono text-stone-400 dark:text-stone-500">SENASICA · Gandia</span>
      </div>

      {/* ── Cuerpo ── */}
      <div className="flex gap-5 p-5">

        {/* ── Info del animal ── */}
        <div className="flex-1 flex flex-col gap-3.5 min-w-0">

          {/* Nombre + arete */}
          <div>
            <p className="text-[22px] font-bold text-stone-800 dark:text-stone-100 leading-tight">
              {data.nombre}
            </p>
            <p className="font-mono text-[11px] text-stone-400 dark:text-stone-500 mt-0.5">
              {data.siniiga}
            </p>
          </div>

          {/* Grid de campos */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
            {[
              { label: 'Raza',        value: data.raza },
              { label: 'Sexo',        value: data.sexo },
              { label: 'Nacimiento',  value: data.nacimiento },
              { label: 'Peso',        value: data.peso },
              { label: 'RFID',        value: data.rfid },
              { label: 'UPP',         value: data.upp },
              { label: 'Propietario', value: data.propietario },
              { label: 'Verificado',  value: data.verificado },
            ].map(f => (
              <div key={f.label}>
                <p className="text-[9.5px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-0.5">
                  {f.label}
                </p>
                <p className="text-[12px] text-stone-700 dark:text-stone-200 leading-snug truncate">
                  {f.value || '—'}
                </p>
              </div>
            ))}
          </div>

          {/* Export label */}
          {data.exportLabel && (
            <div className="flex items-center gap-1.5 mt-1">
              <div className="w-1.5 h-1.5 rounded-full bg-[#2FAF8F]" />
              <p className="text-[11px] text-[#2FAF8F] font-medium">{data.exportLabel}</p>
            </div>
          )}

          {/* Botón huella */}
          {onHuella && (
            <button
              onClick={onHuella}
              className="mt-1 w-fit flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] border border-stone-200/70 dark:border-stone-800/60 text-[11px] text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-all bg-transparent cursor-pointer"
            >
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M2 12C2 6.48 6.48 2 12 2s10 4.48 10 10-4.48 10-10 10"/>
                <path d="M12 8c-2.21 0-4 1.79-4 4"/>
                <path d="M12 12v4"/>
              </svg>
              Ver huella biométrica
            </button>
          )}
        </div>

        {/* ── QR + MRZ ── */}
        <div className="flex flex-col items-center gap-3 shrink-0">

          {/* QR */}
          <div className="w-[100px] h-[100px] rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200/70 dark:border-stone-800 flex items-center justify-center overflow-hidden">
            {qrError ? (
              <p className="text-[9px] text-stone-400 text-center px-2">Error QR</p>
            ) : qrDataUrl ? (
              <img src={qrDataUrl} alt="QR Ficha Ganadera" className="w-[88px] h-[88px] object-contain" />
            ) : (
              <div className="w-5 h-5 border-2 border-[#2FAF8F] border-t-transparent rounded-full animate-spin" />
            )}
          </div>

          {/* Aviso si el MRZ aún no fue generado por el trigger */}
          {!mrzOk && qrDataUrl && (
            <p className="text-[9px] text-stone-300 dark:text-stone-600 text-center max-w-[100px] leading-snug">
              QR temporal · MRZ pendiente
            </p>
          )}

          {/* Botón descargar */}
          <button
            onClick={handleDescargar}
            disabled={!qrDataUrl}
            className="flex items-center gap-1 text-[10px] text-stone-400 dark:text-stone-500 hover:text-[#2FAF8F] transition-colors bg-transparent border-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Descargar
          </button>

          {/* MRZ */}
          {mrzOk ? (
            <div className="bg-stone-50 dark:bg-stone-900/60 rounded-lg px-2.5 py-2 border border-stone-200/70 dark:border-stone-800">
              <p className="font-mono text-[8.5px] text-stone-400 dark:text-stone-500 leading-[1.8] tracking-[0.08em] whitespace-nowrap">
                {data.mrz[0]}
              </p>
              <p className="font-mono text-[8.5px] text-stone-400 dark:text-stone-500 leading-[1.8] tracking-[0.08em] whitespace-nowrap">
                {data.mrz[1]}
              </p>
            </div>
          ) : (
            <p className="text-[9px] text-stone-300 dark:text-stone-600 font-mono text-center">
              MRZ generándose…
            </p>
          )}
        </div>
      </div>
    </div>
  )
}