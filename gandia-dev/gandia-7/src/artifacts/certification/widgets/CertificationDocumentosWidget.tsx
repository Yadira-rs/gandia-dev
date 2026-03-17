/**
 * CertificationDocumentosWidget
 * v2 — hero con anillo, barra lateral por doc, criticidad prominente, hash elegante, botón de subir claro.
 */
export type EstadoDoc = 'ok' | 'pendiente' | 'faltante'
export type TipoDoc   = 'resultado_lab' | 'vacunacion' | 'reemo' | 'foto_oficial' | 'firma_mvz' | 'auditoria' | 'identificacion' | 'otro'

export interface Documento {
  id:      number
  tipo:    TipoDoc
  nombre:  string
  estado:  EstadoDoc
  fecha?:  string
  emisor?: string
  hash?:   string
  hashOk?: boolean
  critico: boolean
}

export interface DatosDocumentos {
  animal:      string
  arete:       string
  tipoCert:    string
  documentos:  Documento[]
  completitud: number
}

interface Props {
  datos:    DatosDocumentos
  onSubir?: (docId: number) => void
}

// ─── Config de estado ──────────────────────────────────────────────────────────

const EST: Record<EstadoDoc, { label: string; color: string; bg: string; text: string }> = {
  ok:        { label: 'Ok',        color: '#2FAF8F', bg: '#2FAF8F18', text: '#1a8c6e' },
  pendiente: { label: 'Pendiente', color: '#d97706', bg: '#fef3c7',   text: '#92400e' },
  faltante:  { label: 'Faltante',  color: '#e11d48', bg: '#ffe4e6',   text: '#9f1239' },
}

const CIRCUMFERENCE = 2 * Math.PI * 22

// ─── Score Ring ───────────────────────────────────────────────────────────────

function ScoreRing({ pct, color }: { pct: number; color: string }) {
  const offset = CIRCUMFERENCE * (1 - pct / 100)
  return (
    <svg width="56" height="56" viewBox="0 0 56 56">
      <circle cx="28" cy="28" r="22" fill="none"
        stroke="currentColor" className="text-stone-100 dark:text-stone-800"
        strokeWidth="5" />
      <circle cx="28" cy="28" r="22" fill="none"
        stroke={color} strokeWidth="5"
        strokeDasharray={CIRCUMFERENCE}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 28 28)"
        style={{ transition: 'stroke-dashoffset 0.7s ease' }}
      />
      <text x="28" y="32" textAnchor="middle" fontSize="12" fontWeight="500"
        fill={color} fontFamily="sans-serif">
        {pct}%
      </text>
    </svg>
  )
}

// ─── Componente ───────────────────────────────────────────────────────────────

export default function CertificationDocumentosWidget({ datos, onSubir }: Props) {
  const presentes = datos.documentos.filter(d => d.estado === 'ok').length
  const pendientes = datos.documentos.filter(d => d.estado === 'pendiente').length
  const faltantes  = datos.documentos.filter(d => d.estado === 'faltante').length
  const criticos   = datos.documentos.filter(d => d.estado !== 'ok' && d.critico).length
  const pctColor   = datos.completitud === 100 ? '#2FAF8F' : criticos > 0 ? '#d97706' : '#d97706'

  const estadoLabel = datos.completitud === 100
    ? 'Expediente completo'
    : criticos > 0
      ? `${criticos} documento${criticos > 1 ? 's' : ''} crítico${criticos > 1 ? 's' : ''} faltante${criticos > 1 ? 's' : ''}`
      : `${datos.documentos.length - presentes} documento${datos.documentos.length - presentes > 1 ? 's' : ''} pendiente${datos.documentos.length - presentes > 1 ? 's' : ''}`
  const estadoBg   = datos.completitud === 100 ? '#2FAF8F18' : criticos > 0 ? '#fef3c7' : '#fef3c7'
  const estadoText = datos.completitud === 100 ? '#1a8c6e'   : criticos > 0 ? '#92400e' : '#92400e'
  const estadoDot  = datos.completitud === 100 ? '#2FAF8F'   : criticos > 0 ? '#d97706' : '#d97706'

  return (
    <div className="flex flex-col">

      {/* ── Hero ── */}
      <div className="bg-white dark:bg-[#1c1917] border border-stone-200/60 dark:border-stone-800/50 rounded-[16px] overflow-hidden mb-3.5">
        <div className="flex items-stretch">

          {/* Izquierda */}
          <div className="flex-1 px-5 pt-[18px] pb-4">
            <p className="text-[10px] text-stone-400 dark:text-stone-500 tracking-[0.07em] uppercase mb-2.5">
              Expediente · {datos.tipoCert}
            </p>
            <div className="flex items-flex-end gap-2 mb-2">
              <span className="text-[56px] font-medium leading-none tabular-nums" style={{ color: pctColor }}>
                {datos.completitud}
              </span>
              <span className="text-[16px] text-stone-300 dark:text-stone-600 self-end mb-2">%</span>
            </div>
            <p className="text-[11px] text-stone-400 dark:text-stone-500 mb-3">
              {presentes} de {datos.documentos.length} documentos presentes
            </p>
            <div
              className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full"
              style={{ background: estadoBg, color: estadoText }}
            >
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: estadoDot }} />
              {estadoLabel}
            </div>
            <div className="mt-3 pt-3 border-t border-stone-100 dark:border-stone-800/40">
              <p className="text-[12.5px] font-medium text-stone-800 dark:text-stone-100">
                {datos.animal}{' '}
                <span className="font-mono font-normal text-stone-400 dark:text-stone-500 text-[11.5px]">{datos.arete}</span>
              </p>
            </div>
          </div>

          {/* Derecha — anillo */}
          <div className="w-[86px] flex flex-col items-center justify-center gap-1.5 px-4 border-l border-stone-100 dark:border-stone-800/40 bg-stone-50/70 dark:bg-stone-900/30">
            <ScoreRing pct={datos.completitud} color={pctColor} />
            <span className="text-[10px] text-stone-400 dark:text-stone-500">completitud</span>
          </div>
        </div>

        {/* Barra inferior */}
        <div className="flex items-center gap-3 px-5 py-3 bg-stone-50/70 dark:bg-stone-900/30 border-t border-stone-100 dark:border-stone-800/40">
          <span className="text-[11px] text-stone-400 dark:text-stone-500 shrink-0">Expediente</span>
          <div className="flex-1 h-[6px] bg-stone-100 dark:bg-stone-800/50 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${datos.completitud}%`, background: pctColor }} />
          </div>
          <span className="text-[11px] font-medium shrink-0" style={{ color: pctColor }}>{datos.completitud}%</span>
        </div>
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { n: presentes,  label: 'Presentes',  color: '#2FAF8F', bg: '#f0fdf4', text: '#166534' },
          { n: pendientes, label: 'Pendientes', color: '#d97706', bg: '#fffbeb', text: '#92400e' },
          { n: faltantes,  label: 'Faltantes',  color: '#e11d48', bg: '#fff5f5', text: '#9f1239' },
        ].map(k => (
          <div key={k.label} className="relative rounded-[12px] px-3.5 pt-5 pb-3 overflow-hidden"
            style={{ background: k.bg }}>
            <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: k.color }} />
            <p className="text-[28px] font-medium leading-none tabular-nums mb-1" style={{ color: k.text }}>{k.n}</p>
            <p className="text-[10.5px]" style={{ color: k.text }}>{k.label}</p>
          </div>
        ))}
      </div>

      {/* ── Documentos ── */}
      <p className="text-[10px] text-stone-400 dark:text-stone-500 tracking-[0.07em] uppercase mb-2.5 px-0.5">
        Documentos del expediente
      </p>

      <div className="flex flex-col gap-2">
        {datos.documentos.map(doc => {
          const est   = EST[doc.estado]
          const isOk  = doc.estado === 'ok'
          const isCrit = doc.critico && !isOk

          return (
            <div
              key={doc.id}
              className="bg-white dark:bg-[#1c1917] rounded-[12px] overflow-hidden"
              style={{
                border: isCrit
                  ? '0.5px solid #fca5a5'
                  : '0.5px solid var(--color-border-tertiary)',
              }}
            >
              <div className="flex items-stretch">

                {/* Barra lateral de estado */}
                <div className="w-1 shrink-0" style={{ background: est.color }} />

                {/* Contenido */}
                <div className="flex-1 px-4 py-3.5">

                  {/* Top — nombre + badges */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <p className="text-[12.5px] font-medium text-stone-800 dark:text-stone-100 leading-snug">
                      {doc.nombre}
                    </p>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {isCrit && (
                        <span className="text-[9.5px] font-bold tracking-[0.05em] uppercase px-1.5 py-0.5 rounded-[4px]"
                          style={{ background: '#ffe4e6', color: '#9f1239' }}>
                          Crítico
                        </span>
                      )}
                      <span
                        className="inline-flex items-center gap-1 text-[10.5px] font-medium px-2 py-0.5 rounded-full"
                        style={{ background: est.bg, color: est.text }}
                      >
                        <span className="w-[5px] h-[5px] rounded-full shrink-0" style={{ background: est.color }} />
                        {est.label}
                      </span>
                    </div>
                  </div>

                  {/* Meta */}
                  {(doc.fecha || doc.emisor) && (
                    <p className="text-[11px] text-stone-400 dark:text-stone-500 mb-2">
                      {[doc.fecha, doc.emisor].filter(Boolean).join(' · ')}
                    </p>
                  )}

                  {/* Hash */}
                  {doc.hash && (
                    <div
                      className="inline-flex items-center gap-1.5 font-mono text-[10px] px-2 py-1 rounded-[6px] border mb-2.5"
                      style={doc.hashOk
                        ? { background: '#f0fdf4', borderColor: '#86efac', color: '#166534' }
                        : { background: '#fff5f5', borderColor: '#fca5a5', color: '#9f1239' }
                      }
                    >
                      {doc.hashOk ? (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                      ) : (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      )}
                      sha256: {doc.hash}
                    </div>
                  )}

                  {/* Botón subir */}
                  {!isOk && onSubir && (
                    <button
                      type="button"
                      onClick={() => onSubir(doc.id)}
                      className="inline-flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-[8px] border bg-transparent cursor-pointer transition-all"
                      style={{ color: '#2FAF8F', borderColor: '#2FAF8F55' }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background    = '#2FAF8F12'
                        e.currentTarget.style.borderColor   = '#2FAF8F'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background    = 'transparent'
                        e.currentTarget.style.borderColor   = '#2FAF8F55'
                      }}
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <polyline points="16 16 12 12 8 16"/>
                        <line x1="12" y1="12" x2="12" y2="21"/>
                        <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/>
                      </svg>
                      Subir documento
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

    </div>
  )
}