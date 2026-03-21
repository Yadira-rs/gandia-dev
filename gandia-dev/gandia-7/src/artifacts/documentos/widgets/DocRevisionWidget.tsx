/**
 * DocRevisionWidget — Revisión de expedientes por la Unión Ganadera
 * ARCHIVO → src/artifacts/documentos/widgets/DocRevisionWidget.tsx
 *
 * Solo la unión ganadera lo usa.
 * Permite ver expedientes de productores, revisar docs, y dejar notas/aprobaciones.
 */

import { useState } from 'react'
import { useUser }  from '../../../context/UserContext'
import {
  useAllExpedientes,
  useExpedienteDocumentos,
  useExpedienteNotas,
  getDocExpedienteUrl,
  agregarNota,
  actualizarEstadoExpediente,
  TRAMITE_LABEL,
  TRAMITE_COLOR,
  ESTADO_LABEL,
  ESTADO_STYLE,
  DOC_TIPO_LABEL,
  DOC_TIPO_COLOR,
  type EstadoExpediente,
  type TipoNota,
  type ExpedienteDB,
} from '../../../hooks/useDocumentos'

const NOTA_TIPOS: { value: TipoNota; label: string; color: string }[] = [
  { value: 'comentario',  label: 'Comentario',           color: 'text-stone-600 dark:text-stone-300' },
  { value: 'correccion',  label: 'Solicitar corrección', color: 'text-amber-600 dark:text-amber-400' },
  { value: 'aprobacion',  label: 'Aprobar',              color: 'text-[#2FAF8F]'                     },
  { value: 'rechazo',     label: 'Rechazar',             color: 'text-red-500'                       },
]

const NOTA_ICON: Record<TipoNota, React.ReactNode> = {
  comentario: (
    <svg className="w-3 h-3 text-stone-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  ),
  correccion: (
    <svg className="w-3 h-3 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  ),
  aprobacion: (
    <svg className="w-3 h-3 text-[#2FAF8F]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  rechazo: (
    <svg className="w-3 h-3 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
}

const NOTA_TO_ESTADO: Partial<Record<TipoNota, EstadoExpediente>> = {
  aprobacion: 'aprobado',
  rechazo:    'rechazado',
  correccion: 'en_revision',
}

export default function DocRevisionWidget({ filterNombre }: { filterNombre?: string | null }) {
  const { profile, role } = useUser()
  const userId = profile?.user_id ?? null
  const isUnion = role === 'union' || (role as string) === 'union_ganadera'

  const { expedientes, loading, refetch } = useAllExpedientes()

  // Pre-filtrar por nombre de productor/rancho si vino de tramitesPanel
  const expedientesFiltrados = filterNombre
    ? expedientes.filter(e =>
        e.rancho_nombre?.toLowerCase().includes(filterNombre.toLowerCase()) ||
        e.propietario_nombre?.toLowerCase().includes(filterNombre.toLowerCase())
      )
    : expedientes
  const [seleccionado, setSeleccionado] = useState<ExpedienteDB | null>(null)
  const { documentos, loading: loadingDocs } = useExpedienteDocumentos(seleccionado?.id ?? null)
  const { notas, loading: loadingNotas, refetch: refetchNotas } = useExpedienteNotas(seleccionado?.id ?? null)

  const [tipoNota,    setTipoNota]    = useState<TipoNota>('comentario')
  const [contenido,   setContenido]   = useState('')
  const [enviando,    setEnviando]    = useState(false)
  const [enviandoErr, setEnviandoErr] = useState<string | null>(null)

  if (!isUnion) return (
    <div className="flex items-center justify-center py-12">
      <p className="text-[12px] text-stone-400 dark:text-stone-500">Solo disponible para la Unión Ganadera</p>
    </div>
  )

  if (loading) return (
    <div className="flex justify-center py-12">
      <div className="w-4 h-4 border-2 border-[#2FAF8F] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const handleDescargar = async (storagePath: string, nombre: string) => {
    const url = await getDocExpedienteUrl(storagePath)
    if (!url) return
    const a = document.createElement('a')
    a.href = url; a.download = nombre; a.target = '_blank'; a.click()
  }

  const handleEnviarNota = async () => {
    if (!userId || !seleccionado || !contenido.trim()) return
    setEnviando(true)
    setEnviandoErr(null)

    const { error } = await agregarNota({
      expedienteId: seleccionado.id,
      autorId:      userId,
      tipo:         tipoNota,
      contenido:    contenido.trim(),
    })

    if (error) { setEnviandoErr(error); setEnviando(false); return }

    // Si la nota implica cambio de estado, actualizar
    const nuevoEstado = NOTA_TO_ESTADO[tipoNota]
    if (nuevoEstado) {
      await actualizarEstadoExpediente(seleccionado.id, nuevoEstado)
      await refetch()
    }

    setContenido('')
    setEnviando(false)
    refetchNotas()
  }

  // ── Sin expediente seleccionado ──
  if (!seleccionado) {
    const pendientes = expedientesFiltrados.filter((e: ExpedienteDB) => e.estado === 'en_revision' || e.estado === 'borrador')
    return (
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-[13px] font-semibold text-stone-700 dark:text-stone-200">Revisar expedientes</p>
          <div className="flex items-center gap-2 mt-0.5">
            {filterNombre ? (
              <span className="text-[10.5px] font-medium text-[#3b82f6] bg-[#3b82f6]/10 px-2 py-0.5 rounded-full">
                {filterNombre}
              </span>
            ) : (
              <p className="text-[11px] text-stone-400 dark:text-stone-500">
                {pendientes.length} pendiente{pendientes.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>

        {expedientesFiltrados.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <p className="text-[12px] text-stone-400 dark:text-stone-500">Sin expedientes para revisar</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {expedientesFiltrados.map(exp => (
              <button
                key={exp.id}
                onClick={() => setSeleccionado(exp)}
                className="flex items-center gap-3 p-3.5 rounded-[10px] border border-stone-200/70 dark:border-stone-800 bg-white dark:bg-[#1c1917] hover:border-[#2FAF8F]/40 hover:shadow-sm transition-all text-left cursor-pointer w-full"
              >
                <div
                  className="w-8 h-8 rounded-[8px] flex items-center justify-center shrink-0"
                  style={{ background: `${TRAMITE_COLOR[exp.tipo_tramite]}15` }}
                >
                  <div className="w-2 h-2 rounded-full" style={{ background: TRAMITE_COLOR[exp.tipo_tramite] }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12.5px] font-semibold text-stone-700 dark:text-stone-200 truncate">{exp.titulo}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {exp.rancho_nombre && (
                      <p className="text-[10.5px] text-stone-400 truncate">{exp.rancho_nombre}</p>
                    )}
                    <span className={`text-[9.5px] font-semibold px-1.5 py-0.5 rounded shrink-0 ${ESTADO_STYLE[exp.estado]}`}>
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

  // ── Revisión de un expediente ──
  return (
    <div className="flex flex-col gap-4">

      {/* Header */}
      <div className="flex items-start gap-2">
        <button
          onClick={() => setSeleccionado(null)}
          className="mt-0.5 text-stone-400 hover:text-stone-600 transition-colors bg-transparent border-0 cursor-pointer"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="15 19 8 12 15 5"/>
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-stone-700 dark:text-stone-200 truncate">{seleccionado.titulo}</p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {seleccionado.rancho_nombre && (
              <p className="text-[10.5px] text-stone-400">{seleccionado.rancho_nombre}</p>
            )}
            <span className={`text-[9.5px] font-semibold px-1.5 py-0.5 rounded ${ESTADO_STYLE[seleccionado.estado]}`}>
              {ESTADO_LABEL[seleccionado.estado]}
            </span>
            <span className="text-[10px] text-stone-300 dark:text-stone-600">
              {TRAMITE_LABEL[seleccionado.tipo_tramite]}
            </span>
          </div>
        </div>
      </div>

      {/* Documentos del expediente */}
      <div>
        <p className="text-[10.5px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-2">
          Documentos ({documentos.length})
        </p>
        {loadingDocs ? (
          <div className="flex justify-center py-4">
            <div className="w-3.5 h-3.5 border-2 border-[#2FAF8F] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : documentos.length === 0 ? (
          <p className="text-[11.5px] text-stone-400 dark:text-stone-500">Sin documentos subidos</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {documentos.map(doc => (
              <div
                key={doc.id}
                className="flex items-center gap-2.5 p-2.5 rounded-[8px] border border-stone-200/70 dark:border-stone-800 bg-white dark:bg-[#1c1917]"
              >
                <span className={`text-[9.5px] font-semibold px-1.5 py-0.5 rounded-md shrink-0 ${DOC_TIPO_COLOR[doc.tipo] ?? 'text-stone-400 bg-stone-100'}`}>
                  {DOC_TIPO_LABEL[doc.tipo] ?? doc.tipo}
                </span>
                <p className="text-[11.5px] text-stone-600 dark:text-stone-300 flex-1 truncate">{doc.nombre}</p>
                <button
                  onClick={() => handleDescargar(doc.storage_path, doc.nombre)}
                  className="w-6 h-6 flex items-center justify-center rounded text-stone-400 hover:text-[#2FAF8F] transition-colors bg-transparent border-0 cursor-pointer shrink-0"
                >
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Notas anteriores */}
      {!loadingNotas && notas.length > 0 && (
        <div>
          <p className="text-[10.5px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-2">
            Historial de revisión
          </p>
          <div className="flex flex-col gap-2">
            {notas.map(nota => (
              <div key={nota.id} className="flex items-start gap-2.5 p-2.5 rounded-[8px] bg-stone-50 dark:bg-stone-900/30">
                <div className="mt-0.5 shrink-0">{NOTA_ICON[nota.tipo]}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[10.5px] font-semibold text-stone-600 dark:text-stone-300">
                      {nota.autor_nombre ?? 'Unión'}
                    </p>
                    <p className="text-[10px] text-stone-300 dark:text-stone-600">
                      {new Date(nota.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <p className="text-[11.5px] text-stone-500 dark:text-stone-400 mt-0.5 leading-relaxed">
                    {nota.contenido}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Agregar nota */}
      <div className="flex flex-col gap-3 p-3.5 rounded-[10px] border border-stone-200/70 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/30">
        <p className="text-[10.5px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
          Dejar nota
        </p>

        {/* Tipo de nota */}
        <div className="flex gap-1.5 flex-wrap">
          {NOTA_TIPOS.map(t => (
            <button
              key={t.value}
              onClick={() => setTipoNota(t.value)}
              className={`px-2.5 py-1 rounded-full text-[10.5px] font-medium border-0 cursor-pointer transition-all ${
                tipoNota === t.value
                  ? `${t.color} bg-stone-200 dark:bg-stone-700`
                  : 'text-stone-400 dark:text-stone-500 bg-stone-100 dark:bg-stone-800/60 hover:bg-stone-200 dark:hover:bg-stone-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <textarea
          placeholder="Escribe tu nota aquí…"
          value={contenido}
          onChange={e => setContenido(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 text-[12px] bg-white dark:bg-stone-800/60 border border-stone-200/70 dark:border-stone-700 rounded-[8px] text-stone-700 dark:text-stone-200 placeholder-stone-300 dark:placeholder-stone-600 outline-none focus:border-[#2FAF8F]/50 resize-none transition-colors"
        />

        {enviandoErr && <p className="text-[11px] text-red-500">{enviandoErr}</p>}

        <button
          onClick={handleEnviarNota}
          disabled={enviando || !contenido.trim()}
          className="w-full py-2 rounded-[8px] bg-stone-800 dark:bg-stone-200 text-white dark:text-stone-900 text-[11.5px] font-semibold hover:bg-stone-700 dark:hover:bg-stone-300 transition-colors border-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {enviando ? 'Enviando…' : 'Enviar nota'}
        </button>
      </div>
    </div>
  )
}