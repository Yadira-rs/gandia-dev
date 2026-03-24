/**
 * ExportacionExportWidget — genera XLSX real con SheetJS + cierra solicitud en BD
 * ARCHIVO → src/artifacts/exportacion/widgets/ExportacionExportWidget.tsx
 *
 * Requiere: npm install xlsx
 */

import { useState, useRef } from 'react'
import * as XLSX from 'xlsx'
import type { SolicitudData, AreteRow } from '../../artifactTypes'
import { marcarExportada } from '../../../hooks/useExportacion'
import { crearExpediente, subirDocExpediente } from '../../../hooks/useDocumentos'
import { crearTramite, agregarEvidencia } from '../../../lib/tramitesService'
import type { TramiteUI } from '../../../lib/tramitesService'
import { useUser }      from '../../../context/UserContext'
import { supabase }     from '../../../lib/supabaseClient'
import { getAuthUserId } from '../../../hooks/useAnimales'

const EXPORT_COLOR = '#f97316'

interface Props {
  solicitud?:    SolicitudData
  rows?:         AreteRow[]
  solicitudId?:  string | null
  ranchoId?:     string | null
  folioInterno?: string
  municipioId?:  string
}

const EMPTY_SOL: SolicitudData = { psg: '', upp: '', sexo: 'Macho', folioFactura: '' }

export default function ExportacionExportWidget({
  solicitud = EMPTY_SOL, rows = [], solicitudId, ranchoId: ranchoIdProp, folioInterno, municipioId = '',
}: Props) {
  const { profile } = useUser()
  const userId = profile?.user_id ?? null
  const xlsxBlobRef = useRef<Blob | null>(null)
  const fileNameRef = useRef<string>('')

  const [exporting,     setExporting]     = useState(false)
  const [exported,      setExported]      = useState(false)
  const [fileName,      setFileName]      = useState('')
  const [exportErr,     setExportErr]     = useState<string | null>(null)
  const [guardarNube,   setGuardarNube]   = useState(true)
  const [nubeOk,        setNubeOk]        = useState(false)
  const [nubeErr,       setNubeErr]       = useState<string | null>(null)
  const [enviandoTramite, setEnviandoTramite] = useState(false)
  const [tramiteOk,     setTramiteOk]     = useState(false)
  const [tramiteErr,    setTramiteErr]    = useState<string | null>(null)

  const validRows = rows.filter(r => r.status === 'ok')
  const errores   = rows.filter(r => r.status !== 'ok').length
  const canExport = errores === 0 && validRows.length > 0

  const handleExportar = async () => {
    if (!canExport) return
    setExporting(true)
    setExportErr(null)

    try {
      // ── Generar XLSX ────────────────────────────────────────────────────────
      const wb = XLSX.utils.book_new()

      // Hoja 1: Encabezado + tabla de aretes (formato SENASICA)
      const encabezado = [
        ['SOLICITUD DE FOLIO PARA TRÁMITE DE ARETES AZULES', '', ''],
        ['', '', ''],
        ['PSG / Clave Ganadero:', solicitud.psg || '—', ''],
        ['UPP:',                  solicitud.upp || '—', ''],
        ['Sexo:',                 solicitud.sexo,        ''],
        ['No. Cabezas:',          validRows.length,      ''],
        ['Folio de Factura:',     solicitud.folioFactura || '—', ''],
        ['Folio Interno:',        folioInterno || '—',   ''],
        ['Fecha de generación:',  new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' }), ''],
        ['', '', ''],
        ['No.', 'Arete SINIIGA', 'Folio Factura'],
      ]

      const filas = validRows.map((r, i) => [i + 1, r.areteOrigen, r.folioFactura])
      const datos = [...encabezado, ...filas]

      const ws = XLSX.utils.aoa_to_sheet(datos)

      // Anchos de columna
      ws['!cols'] = [{ wch: 22 }, { wch: 18 }, { wch: 18 }]

      XLSX.utils.book_append_sheet(wb, ws, 'Solicitud')

      // Hoja 2: Solo la lista de aretes (para importar en otros sistemas)
      const wsAretes = XLSX.utils.aoa_to_sheet([
        ['Arete SINIIGA', 'Folio Factura'],
        ...validRows.map(r => [r.areteOrigen, r.folioFactura]),
      ])
      wsAretes['!cols'] = [{ wch: 18 }, { wch: 18 }]
      XLSX.utils.book_append_sheet(wb, wsAretes, 'Aretes')

      const nombre = `solicitud_aretes_${(solicitud.psg || 'SENASICA').replace(/[^A-Z0-9-]/gi, '_')}_${folioInterno ?? Date.now()}.xlsx`
      XLSX.writeFile(wb, nombre)
      setFileName(nombre)

      // Guardar blob para usarlo al enviar trámite
      const xlsxData = XLSX.write(wb, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer
      xlsxBlobRef.current = new Blob([xlsxData], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      fileNameRef.current = nombre

      // ── Guardar en BD ─────────────────────────────────────────────────────
      if (solicitudId && ranchoIdProp) {
        const { error } = await marcarExportada(solicitudId, ranchoIdProp, rows)
        if (error) throw new Error(error)
      }

      // ── Guardar en nube (Documentos) ─────────────────────────────────────
      if (guardarNube) {
        setNubeErr(null)
        try {
          const authUserId = await getAuthUserId()
          if (!authUserId) throw new Error('Sin sesión activa')

          // Obtener ranchoId directo desde BD
          const rId = ranchoIdProp ?? await (async () => {
            const { data } = await supabase
              .from('ranch_extended_profiles')
              .select('id')
              .eq('user_id', authUserId)
              .single()
            return data?.id ?? null
          })()
          if (!rId) throw new Error('No se encontró el rancho — completa tu perfil')

          // 1. Crear expediente
          const { expediente, error: expErr } = await crearExpediente({
            ranchoId:    rId,
            userId:      authUserId,
            tipoTramite: 'exportacion',
            titulo:      `Aretes Azules · ${folioInterno ?? solicitud.psg} · ${new Date().toLocaleDateString('es-MX')}`,
          })
          if (expErr || !expediente) throw new Error(expErr ?? 'Error al crear expediente')

          // 2. Subir el Excel
          const xlsxBlob = xlsxBlobRef.current ?? new Blob(
            [XLSX.write(wb, { bookType: 'xlsx', type: 'array' })],
            { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
          )
          const xlsxFile = new File([xlsxBlob], nombre, { type: xlsxBlob.type })
          const { error: subErr } = await subirDocExpediente({
            file:         xlsxFile,
            expedienteId: expediente.id,
            ranchoId:     rId,
            userId:       authUserId,
            tipo:         'otro',
          })
          if (subErr) throw new Error(subErr)
          setNubeOk(true)
        } catch (e) {
          setNubeErr(e instanceof Error ? e.message : 'Error al guardar en nube')
        }
      }

      setExported(true)
    } catch (e) {
      setExportErr(e instanceof Error ? e.message : 'Error al exportar')
    } finally {
      setExporting(false)
    }
  }

  const handleEnviarTramite = async () => {
    if (!userId) return
    if (!municipioId) {
      setTramiteErr('Selecciona el municipio en la pestaña Solicitud primero')
      return
    }
    setEnviandoTramite(true)
    setTramiteErr(null)
    try {
      const tramiteEntidadId = await crearTramite({
        upp:         solicitud.upp || solicitud.psg,
        tipo:        'exportacion',
        numAnimales: validRows.length,
        productor:   solicitud.upp || solicitud.psg,
        municipioId,
        userId,
      })

      // Subir el xlsx como evidencia si tenemos el blob generado
      if (xlsxBlobRef.current && tramiteEntidadId) {
        const nombre = fileNameRef.current || `solicitud_aretes_${solicitud.psg}.xlsx`
        const storagePath = `tramites/${tramiteEntidadId}/${crypto.randomUUID()}.xlsx`

        const { error: upErr } = await supabase.storage
          .from('expediente-documentos')
          .upload(storagePath, xlsxBlobRef.current, {
            contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            upsert: false,
          })

        if (!upErr) {
          const { data: signedData } = await supabase.storage
            .from('expediente-documentos')
            .createSignedUrl(storagePath, 60 * 60 * 24 * 365) // 1 año

          if (signedData?.signedUrl) {
            // Obtener estado activo del trámite recién creado
            const { data: estadoData } = await supabase
              .from('estados')
              .select('id')
              .eq('entidad_id', Number(tramiteEntidadId))
              .order('created_at', { ascending: false })
              .limit(1)
              .single()

            const fakeTramite: Pick<TramiteUI, '_entidadId' | '_estadoActivoId'> = {
              _entidadId:      Number(tramiteEntidadId),
              _estadoActivoId: estadoData?.id ?? '',
            }

            await agregarEvidencia(
              fakeTramite as TramiteUI,
              signedData.signedUrl,
              nombre,
              userId,
            )
          }
        }
      }

      setTramiteOk(true)
    } catch (e) {
      setTramiteErr(e instanceof Error ? e.message : 'Error al enviar trámite')
    } finally {
      setEnviandoTramite(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">

      {/* ── Preview documento ── */}
      <div className="rounded-[12px] border border-stone-200 dark:border-stone-700/60 overflow-hidden">

        {/* Membrete */}
        <div className="bg-[#18120a] px-4 py-3.5">
          <p className="font-mono text-[8px] tracking-[2.5px] uppercase text-white/25 mb-1">
            México · SENASICA · Gandia · Formato oficial
          </p>
          <p className="text-[13.5px] font-semibold text-white/90 leading-tight">
            SOLICITUD DE FOLIO<br/>
            <span className="text-[11px] font-normal text-white/50">TRÁMITE DE ARETES AZULES</span>
          </p>
        </div>

        {/* Datos */}
        <div className="p-4 bg-white dark:bg-stone-900/20">
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 mb-4">
            {[
              ['PSG / Clave',     solicitud.psg || '—'],
              ['UPP',             solicitud.upp || '—'],
              ['Sexo',            solicitud.sexo],
              ['No. Cabezas',     String(validRows.length)],
              ['Folio Factura',   solicitud.folioFactura || '—'],
              ['Folio Interno',   folioInterno || '—'],
            ].map(([k, v]) => (
              <div key={k}>
                <p className="font-mono text-[8px] text-stone-400 uppercase tracking-[0.5px] mb-0.5">{k}</p>
                <p className="text-[12px] font-medium text-stone-700 dark:text-stone-200 truncate">{v}</p>
              </div>
            ))}
          </div>

          {/* Tabla preview */}
          <div className="border border-stone-200 dark:border-stone-700/50 rounded-[7px] overflow-hidden">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="bg-stone-50 dark:bg-stone-800/40">
                  <th className="text-left px-3 py-1.5 font-mono text-[8px] text-stone-400 uppercase w-8">No.</th>
                  <th className="text-left px-2 py-1.5 font-mono text-[8px] text-stone-400 uppercase">Arete SINIIGA</th>
                  <th className="text-left px-2 py-1.5 font-mono text-[8px] text-stone-400 uppercase">Folio</th>
                </tr>
              </thead>
              <tbody>
                {validRows.slice(0, 5).map(row => (
                  <tr key={row.id} className="border-t border-stone-100 dark:border-stone-800/40">
                    <td className="px-3 py-1.5 font-mono text-stone-500">{row.id}</td>
                    <td className="px-2 py-1.5 font-mono text-stone-700 dark:text-stone-200">{row.areteOrigen}</td>
                    <td className="px-2 py-1.5 font-mono text-stone-400 dark:text-stone-500">{row.folioFactura}</td>
                  </tr>
                ))}
                {validRows.length > 5 && (
                  <tr className="border-t border-stone-100 dark:border-stone-800/40">
                    <td colSpan={3} className="px-3 py-1.5 text-[9px] font-mono text-stone-400 text-center">
                      + {validRows.length - 5} filas más
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Errores pendientes ── */}
      {errores > 0 && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-[10px] bg-red-50/60 dark:bg-red-950/15 border border-red-100 dark:border-red-900/30">
          <svg width="13" height="13" className="shrink-0 mt-0.5 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <p className="text-[11.5px] text-red-600 dark:text-red-400">
            {errores} error{errores !== 1 ? 'es' : ''} pendiente{errores !== 1 ? 's' : ''} — valida antes de exportar
          </p>
        </div>
      )}

      {exportErr && (
        <p className="text-[11.5px] text-red-500">{exportErr}</p>
      )}

      {/* ── Opciones previas a exportar ── */}
      {!exported && (
        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <div
            onClick={() => setGuardarNube(v => !v)}
            className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors shrink-0 ${
              guardarNube ? 'bg-[#f97316] border-[#f97316]' : 'border-stone-300 dark:border-stone-600'
            }`}>
            {guardarNube && <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
          </div>
          <div>
            <p className="text-[12px] font-medium text-stone-700 dark:text-stone-200">Guardar en nube</p>
            <p className="text-[10.5px] text-stone-400 dark:text-stone-500">Crea un expediente en Documentos con el Excel adjunto</p>
          </div>
        </label>
      )}

      {/* ── Botón / estado éxito ── */}
      {!exported ? (
        <button
          onClick={handleExportar}
          disabled={!canExport || exporting}
          className="flex items-center justify-center gap-2 py-3 rounded-[12px] text-[13px] font-semibold text-white border-0 cursor-pointer transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: EXPORT_COLOR }}
        >
          {exporting ? (
            <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Generando…</>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Descargar Excel oficial · {validRows.length} aretes
            </>
          )}
        </button>
      ) : (
        <div className="flex flex-col items-center gap-3 py-6 rounded-[12px] bg-emerald-50/60 dark:bg-emerald-950/15 border border-emerald-100 dark:border-emerald-900/30">
          <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <div className="text-center">
            <p className="text-[13px] font-semibold text-emerald-700 dark:text-emerald-400">Archivo descargado</p>
            <p className="text-[10.5px] text-stone-400 dark:text-stone-500 font-mono mt-1 max-w-[200px] break-all">{fileName}</p>
            {solicitudId && (
              <p className="text-[10.5px] text-emerald-600 dark:text-emerald-500 mt-1">Solicitud marcada como exportada</p>
            )}
          </div>

          {/* Nube status */}
          {guardarNube && nubeOk && (
            <div className="flex items-center gap-2 text-[11.5px] text-emerald-600 dark:text-emerald-400">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
              Guardado en Documentos
            </div>
          )}
          {nubeErr && (
            <p className="text-[11px] text-red-500">{nubeErr}</p>
          )}

          <button onClick={() => { setExported(false); setFileName('') }}
            className="flex items-center gap-1.5 text-[11px] font-medium text-stone-500 hover:text-stone-700 cursor-pointer bg-transparent border-0 p-0 transition-colors">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Descargar de nuevo
          </button>
        </div>
      )}

      {/* ── Enviar trámite a Unión — siempre visible ── */}
      <div className="flex flex-col gap-2 pt-1 border-t border-stone-100 dark:border-stone-800/60">
        {!tramiteOk ? (
          <button onClick={handleEnviarTramite} disabled={enviandoTramite || !canExport}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-[10px] text-[12px] font-semibold border cursor-pointer hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            style={{ color: EXPORT_COLOR, borderColor: `${EXPORT_COLOR}40`, background: `${EXPORT_COLOR}0d` }}>
            {enviandoTramite ? (
              <><div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"/>Enviando…</>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
                Enviar trámite a Unión Ganadera
              </>
            )}
          </button>
        ) : (
          <div className="flex items-center gap-2 py-2 text-[11.5px] text-emerald-600 dark:text-emerald-400">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
            Trámite enviado a la Unión Ganadera
          </div>
        )}
        {tramiteErr && <p className="text-[11px] text-red-500">{tramiteErr}</p>}
        <p className="text-[10px] text-stone-400 dark:text-stone-500">
          La Unión recibirá los datos de la solicitud para revisión y aprobación.
        </p>
      </div>
    </div>
  )
}