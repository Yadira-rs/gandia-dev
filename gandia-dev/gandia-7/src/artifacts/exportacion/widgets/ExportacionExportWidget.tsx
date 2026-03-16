/**
 * ExportacionExportWidget — NUEVO
 * Preview del documento oficial SENASICA + botón de descarga Excel.
 * Standalone: usa mock. Controlado: recibe solicitud + rows reales.
 */

import { useState } from 'react'
import type { SolicitudData, AreteRow } from '../../artifactTypes'

const EXPORT_COLOR = '#f97316'

const MOCK_SOLICITUD: SolicitudData = {
  psg:          'DGO-UPP-12345',
  upp:          'Rancho El Mezquite',
  sexo:         'Macho',
  folioFactura: 'FAC-2025-118',
}

const MOCK_ROWS: AreteRow[] = [
  { id: 1, areteOrigen: '1034567891', folioFactura: 'FAC-2025-118', status: 'ok' },
  { id: 2, areteOrigen: '1034567892', folioFactura: 'FAC-2025-118', status: 'ok' },
  { id: 3, areteOrigen: '1034567893', folioFactura: 'FAC-2025-118', status: 'ok' },
  { id: 4, areteOrigen: '1034567894', folioFactura: 'FAC-2025-118', status: 'ok' },
  { id: 5, areteOrigen: '1034567895', folioFactura: 'FAC-2025-118', status: 'ok' },
]

interface Props {
  solicitud?: SolicitudData
  rows?:      AreteRow[]
}

export default function ExportacionExportWidget({ solicitud = MOCK_SOLICITUD, rows = MOCK_ROWS }: Props) {
  const [exported, setExported] = useState(false)

  const validRows = rows.filter(r => r.status === 'ok')
  const errores   = rows.filter(r => r.status !== 'ok').length
  const canExport = errores === 0 && rows.length > 0

  return (
    <div className="flex flex-col gap-3">

      {/* Preview documento oficial */}
      <div className="border border-stone-200 dark:border-stone-700/60 rounded-[12px] overflow-hidden">

        {/* Banda oscura tipo membrete */}
        <div className="bg-[#1c1917] px-4 py-3">
          <p className="font-mono text-[8px] tracking-[2.5px] uppercase text-white/30">
            México · SENASICA · Gandia · Formato oficial
          </p>
          <p className="text-[14px] font-semibold text-white mt-0.5 tracking-tight">
            SOLICITUD DE FOLIO PARA TRÁMITE DE ARETES AZULES
          </p>
        </div>

        {/* Datos del encabezado */}
        <div className="p-4 bg-white dark:bg-stone-900/30">
          <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 mb-4">
            {[
              ['PSG / Clave:',    solicitud.psg          || '—'],
              ['UPP:',           solicitud.upp          || '—'],
              ['Sexo:',          solicitud.sexo],
              ['No. Cabezas:',   String(validRows.length)],
              ['Folio Factura:', solicitud.folioFactura || '—'],
            ].map(([k, v], i) => (
              <div key={i}>
                <p className="font-mono text-[8px] text-stone-400 uppercase tracking-[.5px]">{k}</p>
                <p className="text-[12px] font-medium text-stone-700 dark:text-stone-200">{v}</p>
              </div>
            ))}
          </div>

          {/* Tabla preview */}
          <div className="border border-stone-200 dark:border-stone-700/50 rounded-[6px] overflow-hidden">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="bg-stone-50 dark:bg-stone-800/40">
                  <th className="text-left px-3 py-2 font-mono text-[8px] text-stone-400 uppercase w-8">No.</th>
                  <th className="text-left px-2 py-2 font-mono text-[8px] text-stone-400 uppercase">Arete SINIIGA</th>
                  <th className="text-left px-2 py-2 font-mono text-[8px] text-stone-400 uppercase">Folio Factura</th>
                </tr>
              </thead>
              <tbody>
                {validRows.slice(0, 5).map(row => (
                  <tr key={row.id} className="border-t border-stone-100 dark:border-stone-800/50">
                    <td className="px-3 py-1.5 font-mono text-stone-500">{row.id}</td>
                    <td className="px-2 py-1.5 font-mono text-stone-700 dark:text-stone-200">{row.areteOrigen}</td>
                    <td className="px-2 py-1.5 font-mono text-stone-500">{row.folioFactura}</td>
                  </tr>
                ))}
                {validRows.length > 5 && (
                  <tr className="border-t border-stone-100 dark:border-stone-800/50">
                    <td colSpan={3} className="px-3 py-1.5 font-mono text-[9px] text-stone-400 text-center">
                      + {validRows.length - 5} filas más
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Bloqueo por errores */}
      {errores > 0 && (
        <div className="flex items-start gap-2 p-3.5 rounded-[10px] bg-red-50/60 dark:bg-red-950/15 border border-red-100 dark:border-red-900/30">
          <svg width="13" height="13" className="shrink-0 mt-0.5 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <p className="text-[11.5px] text-red-600 dark:text-red-400">
            {errores} error{errores > 1 ? 'es' : ''} pendiente{errores > 1 ? 's' : ''} — valida la solicitud antes de exportar
          </p>
        </div>
      )}

      {/* Botón exportar / éxito */}
      {!exported ? (
        <button
          onClick={() => canExport && setExported(true)}
          disabled={!canExport}
          className="flex items-center justify-center gap-2 py-3 rounded-[12px] text-[13px] font-semibold text-white border-0 cursor-pointer transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: EXPORT_COLOR }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Exportar Excel oficial · {validRows.length} aretes
        </button>
      ) : (
        <div className="flex flex-col items-center gap-3 py-5 rounded-[12px] bg-green-50/60 dark:bg-green-950/15 border border-green-100 dark:border-green-900/30">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <p className="text-[13px] font-semibold text-green-700 dark:text-green-400">Archivo generado</p>
          <p className="text-[11px] text-stone-400 dark:text-stone-500 font-mono">
            solicitud_aretes_{solicitud.psg || 'SENASICA'}.xlsx
          </p>
          <button
            onClick={() => setExported(false)}
            className="flex items-center gap-1.5 text-[11px] font-medium text-stone-500 hover:text-stone-700 cursor-pointer bg-transparent border-0 p-0 transition-colors"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Descargar de nuevo
          </button>
        </div>
      )}
    </div>
  )
}