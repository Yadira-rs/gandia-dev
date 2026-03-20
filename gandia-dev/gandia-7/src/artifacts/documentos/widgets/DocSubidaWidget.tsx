/**
 * DocSubidaWidget — Subir y clasificar documentos a un expediente
 * ARCHIVO → src/artifacts/documentos/widgets/DocSubidaWidget.tsx
 */

import { useRef, useState } from 'react'
import { useUser }           from '../../../context/UserContext'
import { useRanchoId, getAuthUserId } from '../../../hooks/useAnimales'
import {
  useExpedientes,
  crearExpediente,
  subirDocExpediente,
  TIPOS_DOC_EXP,
  TRAMITE_LABEL,
  ESTADO_LABEL,
  ESTADO_STYLE,
  type TipoTramite,
  type TipoDocExpediente,
  type ExpedienteDB,
} from '../../../hooks/useDocumentos'

const TRAMITES_OPTS: { value: TipoTramite; label: string }[] = [
  { value: 'movilizacion',  label: 'Movilización'  },
  { value: 'exportacion',   label: 'Exportación'   },
  { value: 'certificacion', label: 'Certificación' },
  { value: 'sanitario',     label: 'Sanitario'     },
  { value: 'comercial',     label: 'Comercial'     },
  { value: 'otro',          label: 'Otro'          },
]

function fmt(b: number) {
  return b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(1)} MB`
}

export default function DocSubidaWidget() {
  // ── TODOS los hooks primero ──────────────────────────────────────────
  const { profile, role } = useUser()
  const userId            = profile?.user_id ?? null
  const isUnion           = role === 'union' || (role as string) === 'union_ganadera'
  const { ranchoId }      = useRanchoId(userId)

  const { expedientes, loading: loadingExp, refetch } = useExpedientes(isUnion ? null : ranchoId)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [paso,           setPaso]           = useState<'expediente' | 'archivo'>('expediente')
  const [expedienteId,   setExpedienteId]   = useState<string | null>(null)
  const [creandoNuevo,   setCreandoNuevo]   = useState(false)
  const [nuevoTramite,   setNuevoTramite]   = useState<TipoTramite>('movilizacion')
  const [nuevoTitulo,    setNuevoTitulo]    = useState('')
  const [creandoLoading, setCreandoLoading] = useState(false)
  const [creandoError,   setCreandoError]   = useState<string | null>(null)
  const [tipoSel,        setTipoSel]        = useState<TipoDocExpediente>('otro')
  const [emisorSel,      setEmisorSel]      = useState('')
  const [fechaDoc,       setFechaDoc]       = useState('')
  const [filesSel,       setFilesSel]       = useState<File[]>([])
  const [dragging,       setDragging]       = useState(false)
  const [uploading,      setUploading]      = useState(false)
  const [uploadOk,       setUploadOk]       = useState(false)
  const [uploadError,    setUploadError]    = useState<string | null>(null)

  // ── Guardia de rol — DESPUÉS de todos los hooks ───────────────────────
  if (isUnion) return (
    <div className="flex items-center justify-center py-12">
      <p className="text-[12px] text-stone-400 dark:text-stone-500">Esta función es para productores</p>
    </div>
  )

  const expedienteActivo = expedientes.find((e: ExpedienteDB) => e.id === expedienteId)

  const handleCrearExpediente = async () => {
    const authUserId = await getAuthUserId()
    if (!authUserId || !ranchoId || !nuevoTitulo.trim()) return
    setCreandoLoading(true)
    setCreandoError(null)
    const { expediente, error } = await crearExpediente({
      ranchoId, userId: authUserId,
      tipoTramite: nuevoTramite,
      titulo: nuevoTitulo.trim(),
    })
    setCreandoLoading(false)
    if (error) { setCreandoError(error); return }
    if (expediente) {
      await refetch()
      setExpedienteId(expediente.id)
      setCreandoNuevo(false)
      setPaso('archivo')
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    setFilesSel(prev => [...prev, ...Array.from(e.dataTransfer.files)])
  }

  const handleSubir = async () => {
    const authUserId = await getAuthUserId()
    if (!authUserId || !ranchoId || !expedienteId || filesSel.length === 0) return
    setUploading(true)
    setUploadError(null)
    for (const file of filesSel) {
      const { error } = await subirDocExpediente({
        file, expedienteId, ranchoId, userId: authUserId,
        tipo: tipoSel,
        emisor:   emisorSel || undefined,
        fechaDoc: fechaDoc  || undefined,
      })
      if (error) { setUploadError(error); setUploading(false); return }
    }
    setUploading(false)
    setUploadOk(true)
    setFilesSel([])
    if (fileInputRef.current) fileInputRef.current.value = ''
    setTimeout(() => setUploadOk(false), 2500)
  }

  // ── Paso 1: seleccionar/crear expediente ──────────────────────────────
  if (paso === 'expediente') {
    return (
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-[13px] font-semibold text-stone-700 dark:text-stone-200">Subir documentos</p>
          <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-0.5">Selecciona o crea un expediente primero</p>
        </div>

        {loadingExp ? (
          <div className="flex justify-center py-8">
            <div className="w-4 h-4 border-2 border-[#2FAF8F] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {expedientes.map((exp: ExpedienteDB) => (
              <button
                key={exp.id}
                onClick={() => { setExpedienteId(exp.id); setPaso('archivo') }}
                className="flex items-center gap-3 p-3 rounded-[10px] border border-stone-200/70 dark:border-stone-800 bg-white dark:bg-[#1c1917] hover:border-[#2FAF8F]/40 transition-all text-left cursor-pointer w-full"
              >
                <div className="w-2 h-2 rounded-full bg-[#2FAF8F] shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[12.5px] font-semibold text-stone-700 dark:text-stone-200 truncate">{exp.titulo}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-stone-400">{TRAMITE_LABEL[exp.tipo_tramite]}</span>
                    <span className={`text-[9.5px] font-semibold px-1.5 py-0.5 rounded tracking-wide ${ESTADO_STYLE[exp.estado]}`}>
                      {ESTADO_LABEL[exp.estado]}
                    </span>
                  </div>
                </div>
                <svg className="w-3.5 h-3.5 text-stone-300 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>
            ))}

            {!creandoNuevo ? (
              <button
                onClick={() => setCreandoNuevo(true)}
                className="flex items-center gap-2 p-3 rounded-[10px] border border-dashed border-stone-200 dark:border-stone-800 hover:border-[#2FAF8F]/50 text-stone-400 hover:text-[#2FAF8F] transition-all cursor-pointer w-full text-[12px]"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Nuevo expediente
              </button>
            ) : (
              <div className="flex flex-col gap-3 p-4 rounded-[12px] border border-stone-200/70 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/40">
                <p className="text-[11.5px] font-semibold text-stone-600 dark:text-stone-300">Nuevo expediente</p>
                <div className="flex flex-col gap-2">
                  <select value={nuevoTramite} onChange={e => setNuevoTramite(e.target.value as TipoTramite)} className={inputClass}>
                    {TRAMITES_OPTS.map((t: { value: TipoTramite; label: string }) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Título del expediente…"
                    value={nuevoTitulo}
                    onChange={e => setNuevoTitulo(e.target.value)}
                    className={inputClass}
                  />
                </div>
                {creandoError && <p className="text-[11px] text-red-500">{creandoError}</p>}
                <div className="flex gap-2">
                  <button onClick={() => setCreandoNuevo(false)} className={btnSecundario}>Cancelar</button>
                  <button onClick={handleCrearExpediente} disabled={creandoLoading || !nuevoTitulo.trim()} className={btnPrimario}>
                    {creandoLoading ? 'Creando…' : 'Crear'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  // ── Paso 2: subir archivo ──────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <button onClick={() => { setPaso('expediente'); setFilesSel([]) }} className="text-stone-400 hover:text-stone-600 transition-colors bg-transparent border-0 cursor-pointer">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="15 19 8 12 15 5"/>
          </svg>
        </button>
        <div>
          <p className="text-[12.5px] font-semibold text-stone-700 dark:text-stone-200">{expedienteActivo?.titulo ?? 'Expediente'}</p>
          <p className="text-[10.5px] text-stone-400">{expedienteActivo ? TRAMITE_LABEL[expedienteActivo.tipo_tramite] : ''}</p>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[10.5px] font-medium text-stone-400">Tipo de documento</label>
        <select value={tipoSel} onChange={e => setTipoSel(e.target.value as TipoDocExpediente)} className={inputClass}>
          {TIPOS_DOC_EXP.map((t: { value: TipoDocExpediente; label: string }) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-[10.5px] font-medium text-stone-400">Emisor (opcional)</label>
          <input type="text" placeholder="SENASICA, MVZ…" value={emisorSel} onChange={e => setEmisorSel(e.target.value)} className={inputClass} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10.5px] font-medium text-stone-400">Fecha doc.</label>
          <input type="date" value={fechaDoc} onChange={e => setFechaDoc(e.target.value)} className={inputClass} />
        </div>
      </div>

      <div
        className={`border-2 border-dashed rounded-[12px] p-6 text-center cursor-pointer transition-all ${dragging ? 'border-[#2FAF8F] bg-[#2FAF8F]/05' : 'border-stone-200 dark:border-stone-700 hover:border-[#2FAF8F]/50'}`}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <input ref={fileInputRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx" className="hidden"
          onChange={e => setFilesSel(Array.from(e.target.files ?? []))} />
        {filesSel.length > 0 ? (
          <div className="flex flex-col gap-1.5">
            {filesSel.map((f: File, i: number) => (
              <div key={i} className="flex items-center justify-between">
                <p className="text-[12px] text-stone-600 dark:text-stone-300 truncate">{f.name}</p>
                <p className="text-[10px] text-stone-400 ml-2 shrink-0">{fmt(f.size)}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2.5">
            <svg className="w-6 h-6 text-stone-300 dark:text-stone-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            <div>
              <p className="text-[12px] text-stone-500 font-medium">Arrastra o click para seleccionar</p>
              <p className="text-[10.5px] text-stone-300 mt-0.5">PDF, JPG, PNG, DOC, XLS · máx 20 MB</p>
            </div>
          </div>
        )}
      </div>

      {uploadOk && (
        <div className="flex items-center gap-2 p-3 rounded-[10px] bg-[#2FAF8F]/08 border border-[#2FAF8F]/20">
          <svg className="w-3.5 h-3.5 text-[#2FAF8F] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
          <p className="text-[12px] font-medium text-stone-700 dark:text-stone-200">Documentos subidos exitosamente</p>
        </div>
      )}
      {uploadError && <p className="text-[11px] text-red-500">{uploadError}</p>}

      <button onClick={handleSubir} disabled={uploading || filesSel.length === 0} className={btnPrimario}>
        {uploading ? (
          <span className="flex items-center justify-center gap-2">
            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />Subiendo…
          </span>
        ) : `Subir ${filesSel.length > 0 ? `${filesSel.length} ${filesSel.length === 1 ? 'archivo' : 'archivos'}` : 'archivos'}`}
      </button>
    </div>
  )
}

const inputClass = 'w-full px-3 py-2 text-[12px] bg-stone-50 dark:bg-stone-800/60 border border-stone-200/70 dark:border-stone-800 rounded-[8px] text-stone-700 dark:text-stone-200 placeholder-stone-300 dark:placeholder-stone-600 outline-none focus:border-[#2FAF8F]/50 transition-colors'
const btnPrimario   = 'w-full py-2.5 rounded-[10px] bg-[#2FAF8F] text-white text-[12px] font-semibold hover:bg-[#27a07f] transition-colors border-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
const btnSecundario = 'flex-1 py-2 rounded-[8px] border border-stone-200/70 dark:border-stone-800 text-[11.5px] text-stone-500 hover:text-stone-700 transition-colors bg-transparent cursor-pointer'