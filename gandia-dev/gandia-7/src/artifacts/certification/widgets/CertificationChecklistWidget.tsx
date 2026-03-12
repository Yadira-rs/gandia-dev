import { useState, useEffect } from 'react'

/**
 * CertificationChecklistWidget — European Document v5
 * Drop-in replacement. Mismos tipos y exports.
 */

export type CatRequisito = 'identidad' | 'sanitario' | 'documental' | 'legal'

export interface Requisito {
  id:        string
  categoria: CatRequisito
  label:     string
  desc:      string
  estado:    'ok' | 'pendiente' | 'faltante' | 'bloqueante'
  fuente?:   string
  accion?:   string
}

export interface DatosChecklist {
  tipoCert:   string
  autoridad:  string
  animal:     string
  arete:      string
  requisitos: Requisito[]
}

interface Props {
  datos:     DatosChecklist
  onAccion?: (reqId: string) => void
}

const CAT_LABELS: Record<CatRequisito, string> = {
  identidad:  'Identidad',
  sanitario:  'Sanitario',
  documental: 'Documental',
  legal:      'Legal',
}

// Symbol only — no color on the symbol itself, color handled by parent
const SYM: Record<Requisito['estado'], string> = {
  ok:         '✓',
  pendiente:  '−',
  faltante:   '○',
  bloqueante: '✕',
}

// Left border per estado (subtle indicator, not colorful background)
const ESTADO_BORDER: Record<Requisito['estado'], string> = {
  ok:         'transparent',
  pendiente:  '#8A6800',
  faltante:   '#8A6800',
  bloqueante: '#8C1A1A',
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

export default function CertificationChecklistWidget({ datos, onAccion }: Props) {
  const dark = useDark()
  const tk = dark
    ? { bg:'#0E0D0C', card:'#1C1917', b:'#2A2724', blt:'#221F1D', tx:'#F4F2EF', txMd:'#A19D97', txSm:'#58534E', acc:'#2FAF8F' }
    : { bg:'#FAFAF9', card:'#FFFFFF', b:'#E7E5E4', blt:'#F5F5F4', tx:'#1C1917', txMd:'#57534E', txSm:'#A8A29E', acc:'#2FAF8F' }

  const total = datos.requisitos.length
  const ok    = datos.requisitos.filter(r => r.estado === 'ok').length
  const pct   = Math.round((ok / total) * 100)

  const cats = (['identidad','sanitario','documental','legal'] as CatRequisito[])
    .filter(c => datos.requisitos.some(r => r.categoria === c))

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Sora:wght@400;500;600&display=swap');

        .ckl5 * { box-sizing:border-box; margin:0; padding:0; }
        .ckl5 {
          font-family:'Sora',ui-sans-serif,sans-serif; font-size:13px;
          color:var(--tx); background:var(--card); -webkit-font-smoothing:antialiased;
          border:1px solid var(--b); border-radius:2px; overflow:hidden; position:relative;
        }
        .ckl5::after {
          content:''; position:absolute; inset:0; pointer-events:none; z-index:10;
          background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");
        }
        .ckl5 > * { position:relative; z-index:1; }
        .ckl5-serif { font-family:'Cormorant Garamond',Georgia,serif; }
        .ckl5-mono  { font-family:ui-monospace,'Cascadia Code',monospace; }
        .ckl5-lbl   { font-size:9px; font-weight:600; letter-spacing:.11em; text-transform:uppercase; color:var(--tx-sm); }

        /* Diagonal hatching for hero area */
        .ckl5-hero {
          background-color:var(--bg);
          background-image:repeating-linear-gradient(
            -45deg, transparent, transparent 5px,
            rgba(0,0,0,.022) 5px, rgba(0,0,0,.022) 6px
          );
          position:relative; overflow:hidden;
        }
        /* Ghost watermark number behind hero */
        .ckl5-ghost {
          position:absolute; right:-10px; bottom:-20px;
          font-family:'Cormorant Garamond',Georgia,serif;
          font-size:140px; font-weight:700; line-height:1;
          color:var(--tx); opacity:.04; user-select:none; pointer-events:none;
          letter-spacing:-.04em;
        }

        .ckl5-hairline { height:1px; background:var(--blt); position:relative; overflow:hidden; }
        .ckl5-fill { position:absolute; top:0; left:0; height:100%; background:var(--tx-md); transition:width .8s cubic-bezier(.16,1,.3,1); }

        .ckl5-cat-hd {
          display:flex; justify-content:space-between; align-items:center;
          padding:6px 18px 5px; background:var(--bg); border-bottom:1px solid var(--blt);
        }
        .ckl5-row {
          display:flex; align-items:flex-start; gap:10px; padding:10px 18px;
          border-bottom:1px solid var(--blt); transition:background .1s; cursor:default;
        }
        .ckl5-row:last-child { border-bottom:none; }
        .ckl5-row:hover { background:var(--bg); }

        .ckl5-action {
          font-family:'Sora',sans-serif; font-size:10px; font-weight:600;
          color:var(--acc); background:none; border:none; padding:0;
          cursor:pointer; text-decoration:underline; text-underline-offset:2px;
          flex-shrink:0; margin-top:2px; letter-spacing:.02em;
        }
      `}</style>

      <div className="ckl5" style={{ '--bg':tk.bg,'--card':tk.card,'--b':tk.b,'--blt':tk.blt,'--tx':tk.tx,'--tx-md':tk.txMd,'--tx-sm':tk.txSm,'--acc':tk.acc } as React.CSSProperties}>

        {/* ── Hero ── */}
        <div className="ckl5-hero" style={{ padding:'18px 18px 16px', borderBottom:'1px solid var(--b)' }}>
          {/* Ghost watermark */}
          <div className="ckl5-ghost">{pct}</div>

          <p className="ckl5-lbl" style={{ marginBottom:12, position:'relative' }}>
            {datos.tipoCert} · {datos.autoridad}
          </p>

          <div style={{ display:'flex', alignItems:'baseline', gap:6, marginBottom:12, position:'relative' }}>
            <span className="ckl5-serif" style={{ fontSize:48, fontWeight:600, color:'var(--tx)', lineHeight:1, letterSpacing:'-.02em' }}>
              {ok}
            </span>
            <span className="ckl5-serif" style={{ fontSize:24, color:'var(--b)', lineHeight:1 }}>/{total}</span>
            <span style={{ fontSize:11, color:'var(--tx-sm)', marginLeft:4 }}>requisitos completados</span>
          </div>

          {/* Hairline progress */}
          <div className="ckl5-hairline" style={{ marginBottom:10, position:'relative' }}>
            <div className="ckl5-fill" style={{ width:`${pct}%` }} />
          </div>

          <p style={{ fontSize:11, color:'var(--tx-md)', position:'relative' }}>
            {datos.animal}{' '}
            <span className="ckl5-mono" style={{ fontSize:10.5, color:'var(--tx-sm)' }}>{datos.arete}</span>
          </p>
        </div>

        {/* ── Checklist ── */}
        {cats.map(cat => {
          const reqs   = datos.requisitos.filter(r => r.categoria === cat)
          const catOk  = reqs.filter(r => r.estado === 'ok').length
          const allOk  = catOk === reqs.length

          return (
            <div key={cat}>
              <div className="ckl5-cat-hd">
                <span className="ckl5-lbl">{CAT_LABELS[cat]}</span>
                <span style={{ fontSize:10, fontWeight:600, color: allOk ? 'var(--tx-md)' : 'var(--tx-sm)' }}>
                  {catOk}/{reqs.length}
                </span>
              </div>

              {reqs.map(req => (
                <div key={req.id} className="ckl5-row"
                  style={{ borderLeft: req.estado !== 'ok' ? `2px solid ${ESTADO_BORDER[req.estado]}` : '2px solid transparent' }}
                >
                  {/* Symbol — always neutral color */}
                  <span className="ckl5-mono" style={{
                    fontSize:11, fontWeight:700, color:'var(--tx-sm)',
                    flexShrink:0, width:12, textAlign:'center', marginTop:1.5,
                  }}>
                    {SYM[req.estado]}
                  </span>

                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{
                      fontSize:12.5,
                      fontWeight: req.estado === 'ok' ? 400 : 500,
                      color: 'var(--tx)',
                      opacity: req.estado === 'ok' ? .65 : 1,
                      marginBottom: req.desc || req.fuente ? 3 : 0,
                      lineHeight:1.4,
                    }}>
                      {req.label}
                    </p>
                    {req.desc && (
                      <p style={{ fontSize:10.5, color:'var(--tx-sm)', lineHeight:1.5, marginBottom: req.fuente ? 2 : 0 }}>
                        {req.desc}
                      </p>
                    )}
                    {req.fuente && (
                      <p className="ckl5-mono" style={{ fontSize:9.5, color:'var(--b)', marginTop:2 }}>
                        ← {req.fuente}
                      </p>
                    )}
                  </div>

                  {req.accion && req.estado !== 'ok' && onAccion && (
                    <button className="ckl5-action" onClick={() => onAccion(req.id)}>
                      {req.accion} →
                    </button>
                  )}
                </div>
              ))}
            </div>
          )
        })}

        {/* ── Footer ── */}
        <div style={{ padding:'8px 18px', borderTop:'1px solid var(--blt)', background:'var(--bg)' }}>
          <p style={{ fontSize:9.5, color:'var(--tx-sm)', fontStyle:'italic' }}>
            Emitido por {datos.autoridad}
          </p>
        </div>
      </div>
    </>
  )
}