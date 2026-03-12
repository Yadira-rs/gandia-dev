import { useState, useEffect } from 'react'

/**
 * CertificationDocumentosWidget — European Document v5
 * Drop-in replacement. Mismos tipos y exports.
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

// Status = left border + label.  No colored text.
const DOC_STATUS: Record<EstadoDoc, { label: string; border: string; opacity: number }> = {
  ok:        { label: 'Presentado', border: 'transparent', opacity: .55 },
  pendiente: { label: 'Pendiente',  border: '#8A6800',     opacity: 1   },
  faltante:  { label: 'Faltante',   border: '#8C1A1A',     opacity: 1   },
}

// Short type tag (text, not icon/emoji)
const TIPO_TAG: Record<TipoDoc, string> = {
  resultado_lab:  'Lab',
  vacunacion:     'Vac',
  reemo:          'REG',
  foto_oficial:   'Foto',
  firma_mvz:      'MVZ',
  auditoria:      'Aud',
  identificacion: 'ID',
  otro:           'Doc',
}

function useDark() {
  const [d, setD] = useState(() => typeof document !== 'undefined' && document.documentElement.classList.contains('dark'))
  useEffect(() => {
    const obs = new MutationObserver(() => setD(document.documentElement.classList.contains('dark')))
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [])
  return d
}

export default function CertificationDocumentosWidget({ datos, onSubir }: Props) {
  const dark = useDark()
  const tk = dark
    ? { bg:'#0E0D0C', card:'#1C1917', b:'#2A2724', blt:'#221F1D', tx:'#F4F2EF', txMd:'#A19D97', txSm:'#58534E', acc:'#2FAF8F' }
    : { bg:'#FAFAF9', card:'#FFFFFF', b:'#E7E5E4', blt:'#F5F5F4', tx:'#1C1917', txMd:'#57534E', txSm:'#A8A29E', acc:'#2FAF8F' }

  const presentes = datos.documentos.filter(d => d.estado === 'ok').length
  const criticos  = datos.documentos.filter(d => d.estado !== 'ok' && d.critico).length

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Sora:wght@400;500;600&display=swap');

        .cdoc5 * { box-sizing:border-box; margin:0; padding:0; }
        .cdoc5 {
          font-family:'Sora',ui-sans-serif,sans-serif; font-size:13px;
          color:var(--tx); background:var(--card); -webkit-font-smoothing:antialiased;
          border:1px solid var(--b); border-radius:2px; overflow:hidden; position:relative;
        }
        .cdoc5::after {
          content:''; position:absolute; inset:0; pointer-events:none; z-index:10;
          background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");
        }
        .cdoc5 > * { position:relative; z-index:1; }
        .cdoc5-serif { font-family:'Cormorant Garamond',Georgia,serif; }
        .cdoc5-mono  { font-family:ui-monospace,'Cascadia Code',monospace; }
        .cdoc5-lbl   { font-size:9px; font-weight:600; letter-spacing:.11em; text-transform:uppercase; color:var(--tx-sm); }

        .cdoc5-hero {
          background-color:var(--bg);
          background-image:repeating-linear-gradient(
            -45deg, transparent, transparent 5px,
            rgba(0,0,0,.022) 5px, rgba(0,0,0,.022) 6px
          );
          position:relative; overflow:hidden;
        }
        .cdoc5-ghost {
          position:absolute; right:-8px; bottom:-18px;
          font-family:'Cormorant Garamond',Georgia,serif;
          font-size:130px; font-weight:700; line-height:1; letter-spacing:-.04em;
          color:var(--tx); opacity:.04; user-select:none; pointer-events:none;
        }

        .cdoc5-hairline { height:1px; background:var(--blt); position:relative; overflow:hidden; }
        .cdoc5-fill { position:absolute; top:0; left:0; height:100%; background:var(--tx-md); transition:width .8s cubic-bezier(.16,1,.3,1); }

        .cdoc5-th { display:grid; grid-template-columns:32px 1fr 76px 88px; gap:0 10px; padding:6px 18px 5px; background:var(--bg); border-bottom:1px solid var(--blt); }
        .cdoc5-row { display:grid; grid-template-columns:32px 1fr 76px 88px; gap:0 10px; padding:10px 18px; border-bottom:1px solid var(--blt); align-items:start; transition:background .1s; }
        .cdoc5-row:last-child { border-bottom:none; }
        .cdoc5-row:hover { background:var(--bg); }

        .cdoc5-tag {
          display:inline-block; font-family:ui-monospace,monospace; font-size:8.5px;
          font-weight:700; letter-spacing:.06em; text-transform:uppercase;
          color:var(--tx-sm); border:1px solid var(--blt); border-radius:1px;
          padding:1px 4px; white-space:nowrap; line-height:1.5;
        }
        .cdoc5-upload {
          font-family:'Sora',sans-serif; font-size:10px; font-weight:600;
          color:var(--acc); background:none; border:none; cursor:pointer; padding:0;
          text-decoration:underline; text-underline-offset:2px;
          display:inline-flex; align-items:center; gap:3px; margin-top:5px;
        }
        .cdoc5-critical {
          display:inline-block; font-size:8.5px; font-weight:700; letter-spacing:.06em;
          text-transform:uppercase; color:var(--tx-sm);
          border:1px solid var(--b); border-radius:1px; padding:1px 4px;
          margin-left:4px; vertical-align:middle;
        }
      `}</style>

      <div className="cdoc5" style={{ '--bg':tk.bg,'--card':tk.card,'--b':tk.b,'--blt':tk.blt,'--tx':tk.tx,'--tx-md':tk.txMd,'--tx-sm':tk.txSm,'--acc':tk.acc } as React.CSSProperties}>

        {/* ── Hero ── */}
        <div className="cdoc5-hero" style={{ padding:'18px 18px 16px', borderBottom:'1px solid var(--b)' }}>
          <div className="cdoc5-ghost">{datos.completitud}</div>

          <p className="cdoc5-lbl" style={{ marginBottom:12, position:'relative' }}>Expediente · {datos.tipoCert}</p>

          <div style={{ display:'flex', alignItems:'baseline', gap:6, marginBottom:12, position:'relative' }}>
            <span className="cdoc5-serif" style={{ fontSize:48, fontWeight:600, color:'var(--tx)', lineHeight:1, letterSpacing:'-.02em' }}>
              {datos.completitud}
            </span>
            <span className="cdoc5-serif" style={{ fontSize:24, color:'var(--b)', lineHeight:1 }}>%</span>
            <span style={{ fontSize:11, color:'var(--tx-sm)', marginLeft:4 }}>
              {presentes}/{datos.documentos.length} documentos
            </span>
          </div>

          <div className="cdoc5-hairline" style={{ marginBottom:10, position:'relative' }}>
            <div className="cdoc5-fill" style={{ width:`${datos.completitud}%` }} />
          </div>

          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', position:'relative' }}>
            <p style={{ fontSize:11, color:'var(--tx-md)' }}>
              {datos.animal}{' '}
              <span className="cdoc5-mono" style={{ fontSize:10.5, color:'var(--tx-sm)' }}>{datos.arete}</span>
            </p>
            {criticos > 0 && (
              <p style={{ fontSize:10, color:'var(--tx-md)', fontWeight:500 }}>
                {criticos} crítico{criticos > 1 ? 's' : ''} sin presentar
              </p>
            )}
          </div>
        </div>

        {/* ── Table header ── */}
        <div className="cdoc5-th">
          {['Tipo', 'Documento', 'Emisión', 'Estado'].map((h, i) => (
            <p key={i} className="cdoc5-lbl" style={{ textAlign: i > 1 ? 'right' : 'left' }}>{h}</p>
          ))}
        </div>

        {/* ── Rows ── */}
        {datos.documentos.map(doc => {
          const ds = DOC_STATUS[doc.estado]
          return (
            <div key={doc.id} className="cdoc5-row"
              style={{ borderLeft: `2px solid ${ds.border}` }}
            >
              {/* Type tag */}
              <div style={{ paddingTop:2 }}>
                <span className="cdoc5-tag">{TIPO_TAG[doc.tipo]}</span>
              </div>

              {/* Info */}
              <div>
                <p style={{ fontSize:12.5, fontWeight: doc.estado === 'ok' ? 400 : 500, color:'var(--tx)', opacity:ds.opacity, marginBottom:2 }}>
                  {doc.nombre}
                  {doc.critico && doc.estado !== 'ok' && (
                    <span className="cdoc5-critical">crítico</span>
                  )}
                </p>
                {doc.emisor && <p style={{ fontSize:10.5, color:'var(--tx-sm)' }}>{doc.emisor}</p>}
                {doc.hash   && (
                  <p className="cdoc5-mono" style={{ fontSize:9.5, color:'var(--tx-sm)', marginTop:2 }}>
                    {doc.hash} {doc.hashOk ? '✓' : '✕'}
                  </p>
                )}
                {doc.estado !== 'ok' && onSubir && (
                  <button className="cdoc5-upload" onClick={() => onSubir(doc.id)}>
                    ↑ Subir
                  </button>
                )}
              </div>

              <p className="cdoc5-mono" style={{ fontSize:11, color:'var(--tx-sm)', textAlign:'right', paddingTop:2 }}>
                {doc.fecha ?? '—'}
              </p>
              <p style={{ fontSize:11, fontWeight:500, color:'var(--tx-md)', textAlign:'right', paddingTop:2, opacity:ds.opacity }}>
                {ds.label}
              </p>
            </div>
          )
        })}
      </div>
    </>
  )
}