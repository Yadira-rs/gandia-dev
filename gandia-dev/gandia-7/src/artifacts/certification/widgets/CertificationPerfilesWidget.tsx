import { useState, useEffect } from 'react'

/**
 * CertificationPerfilesWidget — European Document v5
 * Drop-in replacement. Mismos tipos y exports.
 */

export type CertEstado = 'listo' | 'casi' | 'bloqueado'

export interface CertAnimalItem {
  arete:        string
  nombre?:      string
  lote:         string
  corral?:      string
  estado:       CertEstado
  score:        number
  tipoCert:     string
  diasVence?:   number
  bloqueantes?: number
  pendientes?:  number
}

interface Props {
  animales:  CertAnimalItem[]
  selected?: CertAnimalItem | null
  onSelect:  (item: CertAnimalItem) => void
}

// Status: left border only — no colored text
const STATUS: Record<CertEstado, { label: string; border: string }> = {
  listo:     { label: 'Listo',     border: '#2A7A5A' },
  casi:      { label: 'Casi',      border: '#8A6800' },
  bloqueado: { label: 'Bloqueado', border: '#8C1A1A' },
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

export default function CertificationPerfilesWidget({ animales, selected, onSelect }: Props) {
  const dark = useDark()
  const tk = dark
    ? { bg:'#0E0D0C', card:'#1C1917', b:'#2A2724', blt:'#221F1D', tx:'#F4F2EF', txMd:'#A19D97', txSm:'#58534E', acc:'#2FAF8F' }
    : { bg:'#FAFAF9', card:'#FFFFFF', b:'#E7E5E4', blt:'#F5F5F4', tx:'#1C1917', txMd:'#57534E', txSm:'#A8A29E', acc:'#2FAF8F' }

  const listos = animales.filter(a => a.estado === 'listo').length
  const casi   = animales.filter(a => a.estado === 'casi').length
  const bloq   = animales.filter(a => a.estado === 'bloqueado').length

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Sora:wght@400;500;600&display=swap');

        .cperf5 * { box-sizing:border-box; margin:0; padding:0; }
        .cperf5 {
          font-family:'Sora',ui-sans-serif,sans-serif; font-size:13px;
          color:var(--tx); background:var(--card); -webkit-font-smoothing:antialiased;
          border:1px solid var(--b); border-radius:2px; overflow:hidden; position:relative;
        }
        .cperf5::after {
          content:''; position:absolute; inset:0; pointer-events:none; z-index:10;
          background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");
        }
        .cperf5 > * { position:relative; z-index:1; }
        .cperf5-serif { font-family:'Cormorant Garamond',Georgia,serif; }
        .cperf5-mono  { font-family:ui-monospace,'Cascadia Code',monospace; }
        .cperf5-lbl   { font-size:9px; font-weight:600; letter-spacing:.11em; text-transform:uppercase; color:var(--tx-sm); }

        /* KPI strip — diagonal hatch */
        .cperf5-kpi {
          display:flex;
          background-color:var(--bg);
          background-image:repeating-linear-gradient(
            -45deg, transparent, transparent 5px,
            rgba(0,0,0,.022) 5px, rgba(0,0,0,.022) 6px
          );
          border-bottom:1px solid var(--b);
        }

        /* Table header */
        .cperf5-th {
          display:grid; grid-template-columns:38px 1fr 70px 12px;
          gap:0 10px; padding:6px 18px 5px;
          background:var(--bg); border-bottom:1px solid var(--blt);
        }

        /* Row button */
        .cperf5-row {
          width:100%; display:grid; grid-template-columns:38px 1fr 70px 12px;
          gap:0 10px; align-items:center; padding:11px 18px;
          border:none; background:transparent; cursor:pointer;
          transition:background .1s; text-align:left; font-family:'Sora',sans-serif;
          color:var(--tx);
        }
        .cperf5-row:hover  { background:var(--bg); }
        .cperf5-row.active { background:var(--bg); }

        .cperf5-score {
          width:32px; height:32px; margin:0 auto;
          border:1px solid var(--blt); border-radius:2px;
          display:flex; align-items:center; justify-content:center;
          background:var(--bg);
        }
        .cperf5-tag {
          display:inline-block; font-size:9px; font-weight:600;
          letter-spacing:.06em; text-transform:uppercase;
          border:1px solid var(--blt); border-radius:1px;
          padding:1px 5px; color:var(--tx-sm); background:var(--bg);
        }
      `}</style>

      <div className="cperf5" style={{ '--bg':tk.bg,'--card':tk.card,'--b':tk.b,'--blt':tk.blt,'--tx':tk.tx,'--tx-md':tk.txMd,'--tx-sm':tk.txSm,'--acc':tk.acc } as React.CSSProperties}>

        {/* ── KPI strip ── */}
        <div className="cperf5-kpi">
          {[
            { n: listos, label: 'Listos'     },
            { n: casi,   label: 'Casi listos' },
            { n: bloq,   label: 'Bloqueados'  },
          ].map((s, i) => (
            <div key={i} style={{
              flex:1, textAlign:'center', padding:'16px 8px',
              borderRight: i < 2 ? '1px solid var(--b)' : 'none',
            }}>
              <p className="cperf5-serif" style={{ fontSize:32, fontWeight:600, lineHeight:1, color:'var(--tx)', marginBottom:4, letterSpacing:'-.02em' }}>
                {s.n}
              </p>
              <p className="cperf5-lbl">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── Table header ── */}
        <div className="cperf5-th">
          {['', 'Animal / Cert.', 'Estado', ''].map((h, i) => (
            <p key={i} className="cperf5-lbl">{h}</p>
          ))}
        </div>

        {/* ── Rows ── */}
        {animales.map((item, idx) => {
          const s        = STATUS[item.estado]
          const isActive = selected?.arete === item.arete

          return (
            <div key={item.arete} style={{ borderBottom: idx < animales.length - 1 ? '1px solid var(--blt)' : 'none', borderLeft:`2px solid ${s.border}` }}>
              <button
                className={`cperf5-row${isActive ? ' active' : ''}`}
                onClick={() => onSelect(item)}
              >
                {/* Score */}
                <div className="cperf5-score">
                  <span className="cperf5-mono" style={{ fontSize:12, fontWeight:700, color:'var(--tx-md)' }}>
                    {item.score}
                  </span>
                </div>

                {/* Info */}
                <div style={{ minWidth:0 }}>
                  <div style={{ display:'flex', gap:7, alignItems:'center', marginBottom:2 }}>
                    <span className="cperf5-mono" style={{ fontSize:12.5, fontWeight:600, color:'var(--tx)' }}>
                      {item.arete}
                    </span>
                    {item.nombre && (
                      <span style={{ fontSize:11.5, color:'var(--tx-sm)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {item.nombre}
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize:11, color:'var(--tx-sm)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {item.tipoCert}
                    {item.lote && <span style={{ color:'var(--b)' }}> · {item.lote}</span>}
                  </p>
                </div>

                {/* Estado */}
                <div>
                  <p style={{ fontSize:11, fontWeight:500, color:'var(--tx-md)', marginBottom:3, whiteSpace:'nowrap' }}>
                    {s.label}
                  </p>
                  <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                    {item.diasVence !== undefined && item.diasVence <= 30 && (
                      <span className="cperf5-tag">
                        {item.diasVence <= 0 ? 'Vencido' : `${item.diasVence}d`}
                      </span>
                    )}
                    {(item.bloqueantes ?? 0) > 0 && (
                      <span className="cperf5-tag">
                        {item.bloqueantes} bloq.
                      </span>
                    )}
                  </div>
                </div>

                {/* Chevron */}
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--blt)" strokeWidth="2.5" strokeLinecap="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>
          )
        })}
      </div>
    </>
  )
}