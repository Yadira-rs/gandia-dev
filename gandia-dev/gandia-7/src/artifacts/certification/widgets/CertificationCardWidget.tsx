import { useState, useEffect } from 'react'

export type EstadoCert = 'vigente' | 'por_vencer' | 'vencido' | 'en_proceso' | 'rechazado'

export interface DatosCertCard {
  id:              string
  tipo:            string
  autoridad:       string
  animal:          string
  arete:           string
  lote?:           string
  estado:          EstadoCert
  folio?:          string
  fechaEmision?:   string
  fechaVence?:     string
  diasParaVencer?: number
  completitud:     number
  expedidor?:      string
}

interface Props {
  data:        DatosCertCard
  onExpand?:   () => void
  onVerCheck?: () => void
}

// Status → left border color + short label only.  NO colored text anywhere.
const STATUS: Record<EstadoCert, { border: string; label: string }> = {
  vigente:    { border: '#2A7A5A', label: 'Vigente'    },
  por_vencer: { border: '#8A6800', label: 'Por vencer' },
  vencido:    { border: '#8C1A1A', label: 'Vencido'    },
  en_proceso: { border: '#1A3870', label: 'En proceso' },
  rechazado:  { border: '#C8C2BB', label: 'Rechazado'  },
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

export default function CertificationCardWidget({ data, onExpand, onVerCheck }: Props) {
  const dark = useDark()
  const tk = dark
    ? { bg:'#0E0D0C', card:'#1C1917', b:'#2A2724', blt:'#221F1D', tx:'#F4F2EF', txMd:'#A19D97', txSm:'#58534E', acc:'#2FAF8F' }
    : { bg:'#FAFAF9', card:'#FFFFFF', b:'#E7E5E4', blt:'#F5F5F4', tx:'#1C1917', txMd:'#57534E', txSm:'#A8A29E', acc:'#2FAF8F' }

  const s   = STATUS[data.estado]
  const pct = data.completitud

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Sora:wght@400;500;600&display=swap');

        .ccw5 * { box-sizing:border-box; margin:0; padding:0; }
        .ccw5 {
          font-family:'Sora',ui-sans-serif,sans-serif; font-size:13px;
          color:var(--tx); background:var(--card); -webkit-font-smoothing:antialiased;
          border:1px solid var(--b); border-radius:2px; overflow:hidden; position:relative;
        }
        /* Noise paper texture */
        .ccw5::after {
          content:''; position:absolute; inset:0; pointer-events:none; z-index:10; border-radius:2px;
          background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");
        }
        .ccw5-serif  { font-family:'Cormorant Garamond',Georgia,serif; }
        .ccw5-mono   { font-family:ui-monospace,'Cascadia Code',monospace; }
        .ccw5-lbl    { font-size:9px; font-weight:600; letter-spacing:.11em; text-transform:uppercase; color:var(--tx-sm); }

        /* Section header strip — diagonal hatching for depth */
        .ccw5-strip {
          background-color:var(--bg);
          background-image:repeating-linear-gradient(
            -45deg, transparent, transparent 5px,
            rgba(0,0,0,.022) 5px, rgba(0,0,0,.022) 6px
          );
        }

        .ccw5-btn-ghost {
          font-family:'Sora',sans-serif; font-size:11px; font-weight:500; letter-spacing:.04em;
          padding:6px 15px; border:1px solid var(--b); border-radius:2px;
          background:transparent; color:var(--tx-md); cursor:pointer;
          transition:border-color .12s, color .12s;
        }
        .ccw5-btn-ghost:hover { border-color:var(--tx-md); color:var(--tx); }

        .ccw5-btn-solid {
          font-family:'Sora',sans-serif; font-size:11px; font-weight:600; letter-spacing:.04em;
          padding:6px 15px; border:1px solid var(--tx); border-radius:2px;
          background:var(--tx); color:var(--card); cursor:pointer; transition:opacity .12s;
        }
        .ccw5-btn-solid:hover { opacity:.82; }

        .ccw5-divider { height:1px; background:var(--blt); }
      `}</style>

      <div className="ccw5" style={{ '--bg':tk.bg,'--card':tk.card,'--b':tk.b,'--blt':tk.blt,'--tx':tk.tx,'--tx-md':tk.txMd,'--tx-sm':tk.txSm,'--acc':tk.acc, borderLeft:`2px solid ${s.border}` } as React.CSSProperties}>

        {/* ── Header strip ── */}
        <div className="ccw5-strip" style={{ padding:'14px 18px 12px', borderBottom:'1px solid var(--blt)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12 }}>
            <div style={{ minWidth:0 }}>
              <p className="ccw5-serif" style={{ fontSize:18, fontWeight:600, color:'var(--tx)', lineHeight:1.2, marginBottom:3 }}>
                {data.tipo}
              </p>
              <p style={{ fontSize:11, color:'var(--tx-sm)' }}>{data.autoridad}</p>
            </div>
            {/* Status: label only, no pill background */}
            <div style={{ flexShrink:0, display:'flex', alignItems:'center', gap:5, paddingTop:2 }}>
              <div style={{ width:4, height:4, borderRadius:'50%', background:s.border, flexShrink:0 }} />
              <span style={{ fontSize:10, fontWeight:600, color:'var(--tx-md)', letterSpacing:'.05em' }}>
                {s.label}
              </span>
            </div>
          </div>
        </div>

        {/* ── Animal ── */}
        <div style={{ padding:'13px 18px', borderBottom:'1px solid var(--blt)' }}>
          <p style={{ fontSize:13.5, fontWeight:600, color:'var(--tx)', marginBottom:4 }}>{data.animal}</p>
          <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
            <span className="ccw5-mono" style={{ fontSize:11.5, color:'var(--tx-md)', letterSpacing:'.04em' }}>{data.arete}</span>
            {data.lote  && <><span style={{ color:'var(--b)' }}>·</span><span className="ccw5-mono" style={{ fontSize:11, color:'var(--tx-sm)' }}>{data.lote}</span></>}
            {data.folio && <span className="ccw5-mono" style={{ marginLeft:'auto', fontSize:10.5, color:'var(--tx-sm)' }}># {data.folio}</span>}
          </div>
        </div>

        {/* ── Data grid ── */}
        <div style={{ padding:'13px 18px 0', display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'10px 20px', marginBottom:14 }}>
          {data.fechaEmision && (
            <div>
              <p className="ccw5-lbl" style={{ marginBottom:4 }}>Emisión</p>
              <p className="ccw5-mono" style={{ fontSize:11.5, color:'var(--tx-md)' }}>{data.fechaEmision}</p>
            </div>
          )}
          {data.fechaVence && (
            <div>
              <p className="ccw5-lbl" style={{ marginBottom:4 }}>Vence</p>
              <p className="ccw5-mono" style={{ fontSize:11.5, fontWeight:600, color:'var(--tx)' }}>
                {data.fechaVence}
              </p>
            </div>
          )}
          <div>
            <p className="ccw5-lbl" style={{ marginBottom:4 }}>Expediente</p>
            <p className="ccw5-mono" style={{ fontSize:11.5, fontWeight:600, color:'var(--tx)' }}>{pct}%</p>
          </div>
          {data.expedidor && (
            <div style={{ gridColumn:'1/-1', paddingTop:4, borderTop:'1px solid var(--blt)' }}>
              <p className="ccw5-lbl" style={{ marginBottom:4 }}>Expedidor</p>
              <p style={{ fontSize:11.5, color:'var(--tx-md)', lineHeight:1.5 }}>{data.expedidor}</p>
            </div>
          )}
        </div>

        {/* ── Progress hairline ── */}
        <div style={{ padding:'0 18px 0' }}>
          <div style={{ height:1, background:'var(--blt)', position:'relative' }}>
            <div style={{ position:'absolute', top:0, left:0, height:'100%', width:`${pct}%`, background:'var(--tx-md)', transition:'width .8s cubic-bezier(.16,1,.3,1)' }} />
          </div>
        </div>

        {/* ── Actions ── */}
        {(onVerCheck || onExpand) && (
          <div style={{ display:'flex', gap:6, justifyContent:'flex-end', padding:'10px 18px' }}>
            {onVerCheck && <button className="ccw5-btn-ghost" onClick={onVerCheck}>Checklist</button>}
            {onExpand   && <button className="ccw5-btn-solid" onClick={onExpand}>Ver expediente</button>}
          </div>
        )}
      </div>
    </>
  )
}