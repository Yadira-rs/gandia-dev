/**
 * DocExpedienteWidget — Vista de expedientes y sus documentos
 * ARCHIVO → src/artifacts/documentos/widgets/DocExpedienteWidget.tsx
 *
 * Ambos roles: lista expedientes, drill-in para ver docs, descarga individual.
 */

import { useState } from 'react'
import { useUser }  from '../../../context/UserContext'
import { useRanchoId } from '../../../hooks/useAnimales'
import { supabase }    from '../../../lib/supabaseClient'
import {
  useExpedientes,
  useExpedienteDocumentos,
  getDocExpedienteUrl,
  TRAMITE_LABEL,
  TRAMITE_COLOR,
  ESTADO_LABEL,
  ESTADO_STYLE,
  DOC_TIPO_LABEL,
  DOC_TIPO_COLOR,
  type EstadoExpediente,
  type ExpedienteDB,
  type ExpedienteDocumentoDB,
} from '../../../hooks/useDocumentos'

function fmt(b: number) {
  return b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(1)} MB`
}

const ESTADOS_FILTRO: { value: EstadoExpediente | 'todos'; label: string }[] = [
  { value: 'todos',       label: 'Todos'       },
  { value: 'borrador',    label: 'Borradores'  },
  { value: 'en_revision', label: 'En revisión' },
  { value: 'aprobado',    label: 'Aprobados'   },
  { value: 'rechazado',   label: 'Rechazados'  },
  { value: 'completado',  label: 'Completados' },
]

export default function DocExpedienteWidget() {
  const { profile, role } = useUser()
  const userId = profile?.user_id ?? null
  const { ranchoId } = useRanchoId(userId)

  const isUnion = role === 'union' || (role as string) === 'union_ganadera'
  const { expedientes, loading, error, refetch } = useExpedientes(isUnion ? null : ranchoId)

  const [filtroEstado, setFiltroEstado] = useState<EstadoExpediente | 'todos'>('todos')
  const [busqueda,     setBusqueda]     = useState('')
  const [seleccionado, setSeleccionado] = useState<ExpedienteDB | null>(null)

  const { documentos, loading: loadingDocs, refetch: refetchDocs } = useExpedienteDocumentos(seleccionado?.id ?? null)

  const filtrados = expedientes.filter(e => {
    const matchEstado  = filtroEstado === 'todos' || e.estado === filtroEstado
    const matchBusqueda = !busqueda.trim() || e.titulo.toLowerCase().includes(busqueda.toLowerCase())
    return matchEstado && matchBusqueda
  })

  const handleDescargar = async (storagePath: string, nombre: string) => {
    const url = await getDocExpedienteUrl(storagePath)
    if (!url) return
    const a = document.createElement('a')
    a.href = url; a.download = nombre; a.target = '_blank'; a.click()
  }

  // ── Borrar documento ──────────────────────────────────────────────────────
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDel, setConfirmDel] = useState<ExpedienteDocumentoDB | null>(null)

  const handleBorrar = async (doc: ExpedienteDocumentoDB) => {
    setDeletingId(doc.id)
    await supabase.storage.from('expediente-documentos').remove([doc.storage_path])
    await supabase.from('expediente_documentos').delete().eq('id', doc.id)
    setDeletingId(null)
    setConfirmDel(null)
    refetchDocs()
  }

  // ── Editar título del expediente ──────────────────────────────────────────
  const [editando,    setEditando]    = useState(false)
  const [nuevoTitulo, setNuevoTitulo] = useState('')
  const [savingTitle, setSavingTitle] = useState(false)

  const handleEditarTitulo = async () => {
    if (!seleccionado || !nuevoTitulo.trim()) return
    setSavingTitle(true)
    await supabase.from('expedientes').update({ titulo: nuevoTitulo.trim() }).eq('id', seleccionado.id)
    setSavingTitle(false)
    setEditando(false)
    refetch()
    setSeleccionado({ ...seleccionado, titulo: nuevoTitulo.trim() })
  }

  if (loading) return (
    <div className="flex justify-center py-12">
      <div className="w-4 h-4 border-2 border-[#2FAF8F] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (error) return (
    <div className="flex flex-col items-center gap-2 py-10 text-center">
      <p className="text-[12px] text-stone-500">Error al cargar expedientes</p>
      <button onClick={refetch} className="text-[11px] text-[#2FAF8F] bg-transparent border-0 cursor-pointer">Reintentar</button>
    </div>
  )

  // ── Vista de documentos de un expediente ──
  if (seleccionado) {
    return (
      <div className="flex flex-col gap-4">

        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <button
              onClick={() => setSeleccionado(null)}
              className="flex items-center gap-1.5 text-[11px] text-stone-400 hover:text-stone-600 transition-colors bg-transparent border-0 cursor-pointer mb-1"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polyline points="15 19 8 12 15 5"/>
              </svg>
              Todos los expedientes
            </button>

            {editando ? (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  value={nuevoTitulo}
                  onChange={e => setNuevoTitulo(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleEditarTitulo(); if (e.key === 'Escape') setEditando(false) }}
                  className="flex-1 px-2 py-1 text-[13px] font-semibold bg-stone-50 dark:bg-stone-800/60 border border-[#2FAF8F]/50 rounded-[6px] text-stone-700 dark:text-stone-200 outline-none"
                />
                <button onClick={handleEditarTitulo} disabled={savingTitle} className="text-[#2FAF8F] bg-transparent border-0 cursor-pointer">
                  {savingTitle ? <div className="w-3 h-3 border-2 border-[#2FAF8F] border-t-transparent rounded-full animate-spin" /> : (
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  )}
                </button>
                <button onClick={() => setEditando(false)} className="text-stone-400 bg-transparent border-0 cursor-pointer">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <p className="text-[13px] font-semibold text-stone-700 dark:text-stone-200 truncate">{seleccionado.titulo}</p>
                {!isUnion && (
                  <button
                    onClick={() => { setNuevoTitulo(seleccionado.titulo); setEditando(true) }}
                    className="text-stone-300 hover:text-stone-500 dark:hover:text-stone-400 bg-transparent border-0 cursor-pointer shrink-0"
                    title="Editar título"
                  >
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                )}
              </div>
            )}

            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] font-medium" style={{ color: TRAMITE_COLOR[seleccionado.tipo_tramite] }}>
                {TRAMITE_LABEL[seleccionado.tipo_tramite]}
              </span>
              <span className={`text-[9.5px] font-semibold px-1.5 py-0.5 rounded ${ESTADO_STYLE[seleccionado.estado]}`}>
                {ESTADO_LABEL[seleccionado.estado]}
              </span>
            </div>
          </div>
          <button
            onClick={refetchDocs}
            className="w-7 h-7 flex items-center justify-center rounded-[7px] text-stone-400 hover:text-stone-600 hover:bg-stone-100 dark:hover:bg-stone-800 transition-all bg-transparent border-0 cursor-pointer shrink-0"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
          </button>
        </div>

        {/* Descripción */}
        {seleccionado.descripcion && (
          <p className="text-[11.5px] text-stone-400 dark:text-stone-500 leading-relaxed">
            {seleccionado.descripcion}
          </p>
        )}

        {/* Documentos */}
        {loadingDocs ? (
          <div className="flex justify-center py-8">
            <div className="w-4 h-4 border-2 border-[#2FAF8F] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : documentos.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <svg className="w-8 h-8 text-stone-300 dark:text-stone-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
            </svg>
            <p className="text-[12px] text-stone-400 dark:text-stone-500">Sin documentos</p>
            <p className="text-[11px] text-stone-300 dark:text-stone-600 max-w-44 leading-relaxed">
              Sube documentos desde la pestaña "Subida"
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-[10.5px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider">
              {documentos.length} documento{documentos.length !== 1 ? 's' : ''}
            </p>

            {/* Modal confirmar borrado */}
            {confirmDel && (
              <div className="flex flex-col gap-2 p-3.5 rounded-[10px] bg-red-50 dark:bg-red-950/30 border border-red-200/70 dark:border-red-900/50">
                <p className="text-[12px] font-medium text-red-700 dark:text-red-300">¿Borrar este documento?</p>
                <p className="text-[11px] text-red-500 truncate">{confirmDel.nombre}</p>
                <div className="flex gap-2 mt-1">
                  <button onClick={() => setConfirmDel(null)} className="flex-1 py-1.5 rounded-[7px] text-[11.5px] text-stone-500 border border-stone-200/70 dark:border-stone-800 bg-transparent cursor-pointer">
                    Cancelar
                  </button>
                  <button
                    onClick={() => handleBorrar(confirmDel)}
                    disabled={!!deletingId}
                    className="flex-1 py-1.5 rounded-[7px] text-[11.5px] text-white bg-red-500 hover:bg-red-600 border-0 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {deletingId === confirmDel.id ? (
                      <><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />Borrando…</>
                    ) : 'Sí, borrar'}
                  </button>
                </div>
              </div>
            )}

            {documentos.map((doc: ExpedienteDocumentoDB) => (
              <div
                key={doc.id}
                className="flex items-center gap-3 p-3 rounded-[10px] border border-stone-200/70 dark:border-stone-800 bg-white dark:bg-[#1c1917]"
              >
                <span className={`text-[9.5px] font-semibold px-1.5 py-1 rounded-md shrink-0 ${DOC_TIPO_COLOR[doc.tipo] ?? 'text-stone-400 bg-stone-100'}`}>
                  {DOC_TIPO_LABEL[doc.tipo] ?? doc.tipo}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-medium text-stone-700 dark:text-stone-200 truncate">{doc.nombre}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {doc.emisor && <p className="text-[10px] text-stone-400 truncate">{doc.emisor}</p>}
                    {doc.fecha_documento && (
                      <p className="text-[10px] text-stone-300 dark:text-stone-600">
                        {new Date(doc.fecha_documento + 'T00:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    )}
                    {doc.tamano_bytes && <p className="text-[10px] text-stone-300 dark:text-stone-600">{fmt(doc.tamano_bytes)}</p>}
                  </div>
                </div>
                {/* Descargar */}
                <button
                  onClick={() => handleDescargar(doc.storage_path, doc.nombre)}
                  title="Descargar"
                  className="w-7 h-7 flex items-center justify-center rounded-[7px] text-stone-400 hover:text-[#2FAF8F] hover:bg-stone-50 dark:hover:bg-stone-800 transition-all bg-transparent border-0 cursor-pointer shrink-0"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                </button>
                {/* Borrar — solo productor */}
                {!isUnion && (
                  <button
                    onClick={() => setConfirmDel(doc)}
                    title="Borrar documento"
                    className="w-7 h-7 flex items-center justify-center rounded-[7px] text-stone-300 dark:text-stone-700 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all bg-transparent border-0 cursor-pointer shrink-0"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                      <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // ── Lista de expedientes ──
  return (
    <div className="flex flex-col gap-4">

      <div>
        <p className="text-[13px] font-semibold text-stone-700 dark:text-stone-200">Mis expedientes</p>
        <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-0.5">
          {filtrados.length} expediente{filtrados.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Barra de búsqueda */}
      <div className="relative">
        <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          type="text"
          placeholder="Buscar expediente…"
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          className="w-full pl-8 pr-3 py-2 text-[12px] bg-stone-50 dark:bg-stone-800/60 border border-stone-200/70 dark:border-stone-800 rounded-[8px] text-stone-700 dark:text-stone-200 placeholder-stone-300 dark:placeholder-stone-600 outline-none focus:border-[#2FAF8F]/50 transition-colors"
        />
      </div>

      {/* Filtros de estado */}
      <div className="flex gap-1.5 flex-wrap">
        {ESTADOS_FILTRO.map(f => (
          <button
            key={f.value}
            onClick={() => setFiltroEstado(f.value)}
            className={`px-2.5 py-1 rounded-full text-[10.5px] font-medium transition-all border-0 cursor-pointer ${
              filtroEstado === f.value
                ? 'bg-stone-800 dark:bg-stone-200 text-white dark:text-stone-900'
                : 'bg-stone-100 dark:bg-stone-800/60 text-stone-500 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Lista */}
      {filtrados.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <p className="text-[12px] text-stone-400 dark:text-stone-500">Sin expedientes</p>
          <p className="text-[11px] text-stone-300 dark:text-stone-600">Crea uno desde la pestaña "Subida"</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtrados.map(exp => (
            <button
              key={exp.id}
              onClick={() => setSeleccionado(exp)}
              className="flex items-center gap-3 p-3.5 rounded-[10px] border border-stone-200/70 dark:border-stone-800 bg-white dark:bg-[#1c1917] hover:border-[#2FAF8F]/40 hover:shadow-sm transition-all text-left cursor-pointer w-full"
            >
              {/* Icono de trámite */}
              <div
                className="w-8 h-8 rounded-[8px] flex items-center justify-center shrink-0"
                style={{ background: `${TRAMITE_COLOR[exp.tipo_tramite]}15` }}
              >
                <div className="w-2 h-2 rounded-full" style={{ background: TRAMITE_COLOR[exp.tipo_tramite] }} />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-[12.5px] font-semibold text-stone-700 dark:text-stone-200 truncate">{exp.titulo}</p>
                  <span className={`text-[9.5px] font-semibold px-1.5 py-0.5 rounded tracking-wide shrink-0 ${ESTADO_STYLE[exp.estado]}`}>
                    {ESTADO_LABEL[exp.estado]}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-[10.5px] text-stone-400 dark:text-stone-500">
                    {TRAMITE_LABEL[exp.tipo_tramite]}
                  </p>
                  <span className="text-stone-200 dark:text-stone-700 text-[9px]">·</span>
                  <p className="text-[10.5px] text-stone-300 dark:text-stone-600">
                    {new Date(exp.updated_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
                  </p>
                </div>
              </div>

              <svg className="w-3.5 h-3.5 text-stone-300 dark:text-stone-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}