/**
 * DocEmpaqueWidget — Preparar paquete de documentos para presentar
 * ARCHIVO → src/artifacts/documentos/widgets/DocEmpaqueWidget.tsx
 */

import { useState } from 'react'
import { useUser }  from '../../../context/UserContext'
import { useRanchoId } from '../../../hooks/useAnimales'
import {
  useExpedientes,
  useExpedienteDocumentos,
  getDocExpedienteUrl,
  evaluarCompletitud,
  TRAMITE_LABEL,
  TRAMITE_COLOR,
  ESTADO_LABEL,
  ESTADO_STYLE,
  DOC_TIPO_LABEL,
  DOC_TIPO_COLOR,
  type ExpedienteDB,
  type ExpedienteDocumentoDB,
} from '../../../hooks/useDocumentos'

function fmt(b: number) {
  return b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(1)} MB`
}

export default function DocEmpaqueWidget() {
  // ── TODOS los hooks primero ───────────────────────────────────────────
  const { profile, role } = useUser()
  const userId            = profile?.user_id ?? null
  const isUnion           = role === 'union' || (role as string) === 'union_ganadera'
  const { ranchoId }      = useRanchoId(userId)

  const { expedientes, loading } = useExpedientes(isUnion ? null : ranchoId)
  const [seleccionado,  setSeleccionado]  = useState<ExpedienteDB | null>(null)
  const { documentos, loading: loadingDocs } = useExpedienteDocumentos(seleccionado?.id ?? null)
  const [selecDocs,   setSelecDocs]   = useState<Set<string>>(new Set())
  const [descargando, setDescargando] = useState<string | null>(null)
  const [todosDesc,   setTodosDesc]   = useState(false)

  // ── Guardia de rol — DESPUÉS de todos los hooks ───────────────────────
  if (isUnion) return (
    <div className="flex items-center justify-center py-12">
      <p className="text-[12px] text-stone-400 dark:text-stone-500">Esta función es para productores</p>
    </div>
  )

  const completitud = seleccionado
    ? evaluarCompletitud(seleccionado.tipo_tramite, documentos)
    : null

  const toggleTodos = () => {
    if (selecDocs.size === documentos.length) setSelecDocs(new Set())
    else setSelecDocs(new Set(documentos.map((d: ExpedienteDocumentoDB) => d.id)))
  }

  const toggleDoc = (id: string) => {
    setSelecDocs(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleDescargarSeleccionados = async () => {
    const docs = documentos.filter((d: ExpedienteDocumentoDB) => selecDocs.has(d.id))
    setTodosDesc(false)
    for (const doc of docs) {
      setDescargando(doc.id)
      const url = await getDocExpedienteUrl(doc.storage_path)
      if (url) {
        const a = document.createElement('a')
        a.href = url; a.download = doc.nombre; a.target = '_blank'; a.click()
        await new Promise(r => setTimeout(r, 600))
      }
    }
    setDescargando(null)
    setTodosDesc(true)
    setTimeout(() => setTodosDesc(false), 2500)
  }

  if (loading) return (
    <div className="flex justify-center py-12">
      <div className="w-4 h-4 border-2 border-[#2FAF8F] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  // ── Sin expediente seleccionado ───────────────────────────────────────
  if (!seleccionado) {
    return (
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-[13px] font-semibold text-stone-700 dark:text-stone-200">Empacar documentos</p>
          <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-0.5">
            Selecciona los documentos que llevarás a la ventanilla
          </p>
        </div>

        {expedientes.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <div className="w-10 h-10 rounded-2xl bg-stone-100 dark:bg-stone-800/60 flex items-center justify-center">
              <svg className="w-5 h-5 text-stone-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              </svg>
            </div>
            <p className="text-[12px] text-stone-400 dark:text-stone-500">Sin expedientes</p>
            <p className="text-[11px] text-stone-300 dark:text-stone-600 max-w-48 leading-relaxed">
              Crea un expediente y sube tus documentos primero
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {expedientes.map((exp: ExpedienteDB) => (
              <button
                key={exp.id}
                onClick={() => { setSeleccionado(exp); setSelecDocs(new Set()) }}
                className="flex items-center gap-3 p-3.5 rounded-[10px] border border-stone-200/70 dark:border-stone-800 bg-white dark:bg-[#1c1917] hover:border-[#2FAF8F]/40 hover:shadow-sm transition-all text-left cursor-pointer w-full"
              >
                <div className="w-8 h-8 rounded-[8px] flex items-center justify-center shrink-0"
                  style={{ background: `${TRAMITE_COLOR[exp.tipo_tramite]}15` }}>
                  <div className="w-2 h-2 rounded-full" style={{ background: TRAMITE_COLOR[exp.tipo_tramite] }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12.5px] font-semibold text-stone-700 dark:text-stone-200 truncate">{exp.titulo}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-[10.5px] text-stone-400">{TRAMITE_LABEL[exp.tipo_tramite]}</p>
                    <span className={`text-[9.5px] font-semibold px-1.5 py-0.5 rounded ${ESTADO_STYLE[exp.estado]}`}>
                      {ESTADO_LABEL[exp.estado]}
                    </span>
                  </div>
                </div>
                <svg className="w-3.5 h-3.5 text-stone-300 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  // ── Expediente seleccionado ───────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-2">
        <button onClick={() => setSeleccionado(null)} className="mt-0.5 text-stone-400 hover:text-stone-600 transition-colors bg-transparent border-0 cursor-pointer shrink-0">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="15 19 8 12 15 5"/>
          </svg>
        </button>
        <div>
          <p className="text-[13px] font-semibold text-stone-700 dark:text-stone-200">{seleccionado.titulo}</p>
          <p className="text-[10.5px] text-stone-400">{TRAMITE_LABEL[seleccionado.tipo_tramite]}</p>
        </div>
      </div>

      {completitud && (
        <div className={`flex items-center gap-2.5 p-3 rounded-[10px] border ${
          completitud.tieneObligatorios
            ? 'bg-[#2FAF8F]/06 border-[#2FAF8F]/20'
            : 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200/50 dark:border-amber-900/30'
        }`}>
          {completitud.tieneObligatorios ? (
            <svg className="w-4 h-4 text-[#2FAF8F] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
          ) : (
            <svg className="w-4 h-4 text-amber-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-medium text-stone-700 dark:text-stone-200">
              {completitud.tieneObligatorios
                ? 'Expediente listo para presentar'
                : `Faltan documentos: ${completitud.faltantes.join(', ')}`}
            </p>
            <p className="text-[10.5px] text-stone-400 mt-0.5">
              {completitud.porcentaje}% completitud · {documentos.length} documento{documentos.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      )}

      <div className="flex items-start gap-2 p-3 rounded-[10px] bg-stone-50 dark:bg-stone-900/30 border border-stone-200/50 dark:border-stone-800/50">
        <svg className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <p className="text-[10.5px] text-stone-400 leading-relaxed">
          Gandia no genera ni certifica documentos oficiales. Descarga los que subiste y lleva los originales a la ventanilla.
        </p>
      </div>

      {loadingDocs ? (
        <div className="flex justify-center py-8">
          <div className="w-4 h-4 border-2 border-[#2FAF8F] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : documentos.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <p className="text-[12px] text-stone-400">Sin documentos en este expediente</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <button onClick={toggleTodos} className="flex items-center gap-2 text-[11.5px] text-stone-500 hover:text-stone-700 bg-transparent border-0 cursor-pointer">
              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                selecDocs.size === documentos.length ? 'bg-[#2FAF8F] border-[#2FAF8F]' : 'border-stone-300 dark:border-stone-700'
              }`}>
                {selecDocs.size === documentos.length && (
                  <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                )}
              </div>
              Seleccionar todos
            </button>
            <p className="text-[10.5px] text-stone-400">{selecDocs.size} seleccionado{selecDocs.size !== 1 ? 's' : ''}</p>
          </div>

          <div className="flex flex-col gap-2">
            {documentos.map((doc: ExpedienteDocumentoDB) => (
              <div
                key={doc.id}
                className={`flex items-center gap-3 p-3 rounded-[10px] border transition-all cursor-pointer ${
                  selecDocs.has(doc.id)
                    ? 'border-[#2FAF8F]/40 bg-[#2FAF8F]/04 dark:bg-[#2FAF8F]/06'
                    : 'border-stone-200/70 dark:border-stone-800 bg-white dark:bg-[#1c1917]'
                }`}
                onClick={() => toggleDoc(doc.id)}
              >
                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                  selecDocs.has(doc.id) ? 'bg-[#2FAF8F] border-[#2FAF8F]' : 'border-stone-300 dark:border-stone-700'
                }`}>
                  {selecDocs.has(doc.id) && (
                    <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  )}
                </div>
                <span className={`text-[9.5px] font-semibold px-1.5 py-0.5 rounded-md shrink-0 ${DOC_TIPO_COLOR[doc.tipo] ?? 'text-stone-400 bg-stone-100'}`}>
                  {DOC_TIPO_LABEL[doc.tipo] ?? doc.tipo}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-medium text-stone-700 dark:text-stone-200 truncate">{doc.nombre}</p>
                  {doc.tamano_bytes && <p className="text-[10px] text-stone-400">{fmt(doc.tamano_bytes)}</p>}
                </div>
                {descargando === doc.id && (
                  <div className="w-3.5 h-3.5 border-2 border-[#2FAF8F] border-t-transparent rounded-full animate-spin shrink-0" />
                )}
              </div>
            ))}
          </div>

          {todosDesc && (
            <div className="flex items-center gap-2 p-3 rounded-[10px] bg-[#2FAF8F]/08 border border-[#2FAF8F]/20">
              <svg className="w-3.5 h-3.5 text-[#2FAF8F] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
              <p className="text-[12px] font-medium text-stone-700 dark:text-stone-200">Documentos descargados</p>
            </div>
          )}

          <button
            onClick={handleDescargarSeleccionados}
            disabled={selecDocs.size === 0 || !!descargando}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-[10px] bg-[#2FAF8F] text-white text-[12px] font-semibold hover:bg-[#27a07f] transition-colors border-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {descargando ? (
              <><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />Descargando…</>
            ) : (
              <><svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>Descargar {selecDocs.size > 0 ? `${selecDocs.size} archivo${selecDocs.size !== 1 ? 's' : ''}` : 'seleccionados'}</>
            )}
          </button>
        </>
      )}
    </div>
  )
}