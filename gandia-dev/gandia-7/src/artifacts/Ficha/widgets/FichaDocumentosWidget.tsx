/**
 * FichaDocumentosWidget — con Supabase Storage real
 * 
 * ARCHIVO → src/artifacts/passport/widgets/FichaDocumentosWidget.tsx
 * 
 * CAMBIOS vs versión mock:
 *   - useAnimalDocumentos() para cargar documentos reales
 *   - subirDocumento() para subir a Storage + insertar en BD
 *   - getDocumentoUrl() para descargar archivos con URL firmada
 */

import { useRef, useState } from 'react'
import {
  useAnimalDocumentos,
  subirDocumento,
  getDocumentoUrl,
  useRanchoId,
  getAuthUserId,
  type DocumentoDB,
} from '../../../hooks/useAnimales'
import { useUser } from '../../../context/UserContext'
import { fmt } from '../.././../pages/Chat/chatUtils'

// ─── PROPS ────────────────────────────────────────────────────────────────────
// IMPORTANTE: FichaModulo y FichaAnima deben pasar `animalId` (uuid de BD)
// además del nombre y arete ya existentes.

interface Props {
  animalId:     string          // ← NUEVO: uuid real de la tabla animales
  animalNombre: string
  animalArete:  string
}

// ─── TIPOS DE DOCUMENTO ───────────────────────────────────────────────────────

const TIPOS_DOC: { value: DocumentoDB['tipo']; label: string }[] = [
  { value: 'factura',      label: 'Factura'             },
  { value: 'cuvq',         label: 'CUVQ'                },
  { value: 'reemo',        label: 'Guía REEMO'          },
  { value: 'resultado_lab',label: 'Resultado laboratorio'},
  { value: 'vacunacion',   label: 'Vacunación'          },
  { value: 'foto_oficial', label: 'Foto oficial'        },
  { value: 'foto_campo',   label: 'Foto campo'          },
  { value: 'identificacion', label: 'Identificación'   },
  { value: 'firma_mvz',    label: 'Firma MVZ'           },
  { value: 'otro',         label: 'Otro'                },
]

const TIPO_LABEL: Record<string, string> = Object.fromEntries(TIPOS_DOC.map(t => [t.value, t.label]))
const TIPO_COLOR: Record<string, string> = {
  factura:       'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30',
  cuvq:          'text-blue-500 bg-blue-50 dark:bg-blue-950/30',
  reemo:         'text-orange-500 bg-orange-50 dark:bg-orange-950/30',
  resultado_lab: 'text-purple-500 bg-purple-50 dark:bg-purple-950/30',
  vacunacion:    'text-[#2FAF8F] bg-[#2FAF8F]/08 dark:bg-[#2FAF8F]/12',
  foto_oficial:  'text-stone-500 bg-stone-100 dark:bg-stone-800/60',
  foto_campo:    'text-stone-500 bg-stone-100 dark:bg-stone-800/60',
  identificacion:'text-blue-500 bg-blue-50 dark:bg-blue-950/30',
  firma_mvz:     'text-red-500 bg-red-50 dark:bg-red-950/30',
  otro:          'text-stone-400 bg-stone-100 dark:bg-stone-800/60',
}

// ─── WIDGET ───────────────────────────────────────────────────────────────────

export default function FichaDocumentosWidget({ animalId, animalNombre, animalArete }: Props) {
  const { profile }  = useUser()
  const userId       = profile?.user_id ?? null
  const { ranchoId } = useRanchoId(userId)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { documentos, loading, error, refetch } = useAnimalDocumentos(animalId)

  const [uploading,   setUploading]   = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  // Form para nuevo documento
  const [tipoSel,   setTipoSel]   = useState<DocumentoDB['tipo']>('otro')
  const [emisorSel, setEmisorSel] = useState('')
  const [fechaDoc,  setFechaDoc]  = useState('')
  const [filesSel,  setFilesSel]  = useState<File[]>([])
  const [showForm,  setShowForm]  = useState(false)

  // ── Subir documentos ────────────────────────────────────────────────────
  const handleSubir = async () => {
    const authUserId = await getAuthUserId()
    if (!authUserId || !ranchoId || filesSel.length === 0) return
    setUploading(true)
    setUploadError(null)

    for (const file of filesSel) {
      const { error: err } = await subirDocumento({
        file,
        animalId,
        ranchoId,
        userId:   authUserId,
        tipo:     tipoSel,
        emisor:   emisorSel || undefined,
        fechaDoc: fechaDoc || undefined,
      })
      if (err) { setUploadError(err); break }
    }

    setUploading(false)
    setFilesSel([])
    setShowForm(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
    refetch()
  }

  // ── Descargar documento ─────────────────────────────────────────────────
  const handleDescargar = async (doc: DocumentoDB) => {
    const url = await getDocumentoUrl(doc.storage_path)
    if (!url) return
    const a   = document.createElement('a')
    a.href    = url
    a.download = doc.nombre
    a.target  = '_blank'
    a.click()
  }

  // ── Loading ──
  if (loading) return (
    <div className="flex items-center justify-center py-12">
      <div className="w-5 h-5 border-2 border-[#2FAF8F] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="flex flex-col gap-4">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[12.5px] font-semibold text-stone-700 dark:text-stone-200">
            Documentos · {animalNombre}
          </p>
          <p className="font-mono text-[10.5px] text-stone-400 dark:text-stone-500 mt-0.5">{animalArete}</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-[#2FAF8F] text-white text-[11px] font-semibold hover:bg-[#27a07f] transition-colors border-0 cursor-pointer"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Subir
        </button>
      </div>

      {/* ── Formulario de subida ── */}
      {showForm && (
        <div className="flex flex-col gap-3 p-4 rounded-[12px] border border-stone-200/70 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/40">
          <p className="text-[11.5px] font-semibold text-stone-600 dark:text-stone-300">Nuevo documento</p>

          {/* Tipo */}
          <div className="flex flex-col gap-1">
            <label className="text-[10.5px] font-medium text-stone-400 dark:text-stone-500">Tipo de documento</label>
            <select
              value={tipoSel}
              onChange={e => setTipoSel(e.target.value as DocumentoDB['tipo'])}
              className="px-2.5 py-2 text-[12px] bg-white dark:bg-stone-800/80 border border-stone-200/70 dark:border-stone-700 rounded-[8px] text-stone-700 dark:text-stone-200 outline-none focus:border-[#2FAF8F]/50"
            >
              {TIPOS_DOC.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          {/* Emisor */}
          <div className="flex flex-col gap-1">
            <label className="text-[10.5px] font-medium text-stone-400 dark:text-stone-500">Emisor (opcional)</label>
            <input
              type="text"
              placeholder="SENASICA, MVZ García…"
              value={emisorSel}
              onChange={e => setEmisorSel(e.target.value)}
              className="px-2.5 py-2 text-[12px] bg-white dark:bg-stone-800/80 border border-stone-200/70 dark:border-stone-700 rounded-[8px] text-stone-700 dark:text-stone-200 placeholder-stone-300 dark:placeholder-stone-600 outline-none focus:border-[#2FAF8F]/50"
            />
          </div>

          {/* Fecha documento */}
          <div className="flex flex-col gap-1">
            <label className="text-[10.5px] font-medium text-stone-400 dark:text-stone-500">Fecha del documento (opcional)</label>
            <input
              type="date"
              value={fechaDoc}
              onChange={e => setFechaDoc(e.target.value)}
              className="px-2.5 py-2 text-[12px] bg-white dark:bg-stone-800/80 border border-stone-200/70 dark:border-stone-700 rounded-[8px] text-stone-700 dark:text-stone-200 outline-none focus:border-[#2FAF8F]/50"
            />
          </div>

          {/* Selector de archivo */}
          <div
            className="border-2 border-dashed border-stone-200 dark:border-stone-700 rounded-[10px] p-5 text-center cursor-pointer hover:border-[#2FAF8F]/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              onChange={e => setFilesSel(Array.from(e.target.files ?? []))}
            />
            {filesSel.length > 0 ? (
              <div className="flex flex-col gap-1">
                {filesSel.map((f, i) => (
                  <p key={i} className="text-[11.5px] text-stone-600 dark:text-stone-300 font-medium">
                    {f.name} <span className="text-stone-400">({fmt(f.size)})</span>
                  </p>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <svg className="w-6 h-6 text-stone-300 dark:text-stone-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                <p className="text-[11.5px] text-stone-400 dark:text-stone-500">
                  Click para seleccionar archivos<br/>
                  <span className="text-[10px]">PDF, JPG, PNG · máx 20 MB</span>
                </p>
              </div>
            )}
          </div>

          {uploadError && (
            <p className="text-[11px] text-red-500">{uploadError}</p>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => { setShowForm(false); setFilesSel([]); setUploadError(null) }}
              className="flex-1 py-2 rounded-[8px] border border-stone-200/70 dark:border-stone-800 text-[11.5px] text-stone-500 hover:text-stone-700 transition-colors bg-transparent cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubir}
              disabled={uploading || filesSel.length === 0}
              className="flex-1 py-2 rounded-[8px] bg-[#2FAF8F] text-white text-[11.5px] font-semibold hover:bg-[#27a07f] transition-colors border-0 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {uploading ? (
                <><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />Subiendo…</>
              ) : (
                `Subir ${filesSel.length > 1 ? `${filesSel.length} archivos` : 'archivo'}`
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── Lista de documentos ── */}
      {error && (
        <p className="text-[11px] text-red-500 text-center py-4">{error}</p>
      )}

      {!error && documentos.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <svg className="w-8 h-8 text-stone-300 dark:text-stone-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
          </svg>
          <p className="text-[12px] text-stone-400 dark:text-stone-500">Sin documentos aún</p>
          <p className="text-[11px] text-stone-300 dark:text-stone-600 max-w-52 leading-relaxed">
            Sube facturas, CUVQ, resultados de laboratorio y más
          </p>
        </div>
      )}

      {documentos.length > 0 && (
        <div className="flex flex-col gap-2">
          {documentos.map(doc => (
            <div
              key={doc.id}
              className="flex items-center gap-3 p-3 rounded-[10px] border border-stone-200/70 dark:border-stone-800 bg-white dark:bg-[#1c1917]"
            >
              {/* Tipo badge */}
              <span className={`text-[9.5px] font-semibold px-2 py-1 rounded-md shrink-0 ${TIPO_COLOR[doc.tipo] ?? 'text-stone-400 bg-stone-100 dark:bg-stone-800/60'}`}>
                {TIPO_LABEL[doc.tipo] ?? doc.tipo}
              </span>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-medium text-stone-700 dark:text-stone-200 truncate">{doc.nombre}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  {doc.emisor && (
                    <p className="text-[10px] text-stone-400 dark:text-stone-500 truncate">{doc.emisor}</p>
                  )}
                  {doc.fecha_documento && (
                    <p className="text-[10px] text-stone-300 dark:text-stone-600">
                      {new Date(doc.fecha_documento + 'T00:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  )}
                  {doc.tamano_bytes && (
                    <p className="text-[10px] text-stone-300 dark:text-stone-600">{fmt(doc.tamano_bytes)}</p>
                  )}
                </div>
              </div>

              {/* Descargar */}
              <button
                onClick={() => handleDescargar(doc)}
                title="Descargar documento"
                className="w-7 h-7 flex items-center justify-center rounded-[7px] text-stone-400 hover:text-[#2FAF8F] hover:bg-stone-50 dark:hover:bg-stone-800/60 transition-all bg-transparent border-0 cursor-pointer shrink-0"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}