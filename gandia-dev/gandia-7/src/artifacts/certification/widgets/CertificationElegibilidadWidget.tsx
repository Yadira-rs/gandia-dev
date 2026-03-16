import { useState, useEffect } from 'react'

/**
 * CertificationElegibilidadWidget — European Document v5
 * Drop-in replacement. Mismos tipos y exports.
 */

export type EstadoElegibilidad = 'listo' | 'casi' | 'bloqueado'

export interface DominioCheck {
  dominio:  'pasaporte' | 'gemelo' | 'monitoreo' | 'sanidad'
  label:    string
  ok:       boolean
  items:    { texto: string; ok: boolean; critico?: boolean }[]
}

export interface DatosElegibilidad {
  animal:      string
  arete:       string
  lote:        string
  tipoCert:    string
  estado:      EstadoElegibilidad
  score:       number
  dominios:    DominioCheck[]
  bloqueantes: string[]
  pendientes:  string[]
  fechaCorte?: string
}

interface Props {
  datos:         DatosElegibilidad
  onExpedir?:    () => void
  onVerDetalle?: () => void
}

// Status: left border ONLY. Label text is neutral.
const STATUS: Record<EstadoElegibilidad, { label: string; border: string }> = {
  listo:     { label: 'Listo para certificar', border: '#2A7A5A' },
  casi:      { label: 'Casi listo',             border: '#8A6800' },
  bloqueado: { label: 'Bloqueado',              border: '#8C1A1A' },
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

export default function CertificationElegibilidadWidget({ datos, onExpedir, onVerDetalle }: Props) {
  const dark = useDark()
  const tk = dark
    ? { bg:'#0E0D0C', card:'#1C1917', b:'#2A2724', blt:'#221F1D', tx:'#F4F2EF', txMd:'#A19D97', txSm:'#58534E', acc:'#2FAF8F' }
    : { bg:'#FAFAF9', card:'#FFFFFF', b:'#E7E5E4', blt:'#F5F5F4', tx:'#1C1917', txMd:'#57534E', txSm:'#A8A29E', acc:'#2FAF8F' }

  const s     = STATUS[datos.estado]
  const marks = [0, 25, 50, 75, 100]

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Sora:wght@400;500;600&display=swap');

        .cel5 * { box-sizing:border-box; margin:0; padding:0; }
        .cel5 {
          font-family:'Sora',ui-sans-serif,sans-serif; font-size:13px;
          color:var(--tx); background:var(--card); -webkit-font-smoothing:antialiased;
          border:1px solid var(--b); border-radius:2px; overflow:hidden; position:relative;
        }
        .cel5::after {
          content:''; position:absolute; inset:0; pointer-events:none; z-index:10;
          background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");
        }
        .cel5 > * { position:relative; z-index:1; }
        .cel5-serif { font-family:'Cormorant Garamond',Georgia,serif; }
        .cel5-mono  { font-family:ui-monospace,'Cascadia Code',monospace; }
        .cel5-lbl   { font-size:9px; font-weight:600; letter-spacing:.11em; text-transform:uppercase; color:var(--tx-sm); }

        .cel5-hero {
          background-color:var(--bg);
          background-image:repeating-linear-gradient(
            -45deg, transparent, transparent 5px,
            rgba(0,0,0,.022) 5px, rgba(0,0,0,.022) 6px
          );
          position:relative; overflow:hidden;
        }
        .cel5-ghost {
          position:absolute; right:-12px; bottom:-24px;
          font-family:'Cormorant Garamond',Georgia,serif;
          font-size:160px; font-weight:700; line-height:1; letter-spacing:-.04em;
          color:var(--tx); opacity:.04; user-select:none; pointer-events:none;
        }

        .cel5-status {
          display:inline-flex; align-items:center; gap:5px;
          border-left:2px solid; padding:2px 0 2px 8px;
        }

        .cel5-btn-ghost {
          font-family:'Sora',sans-serif; font-size:11px; font-weight:500; letter-spacing:.04em;
          padding:7px 0; flex:1; border:1px solid var(--b); border-radius:2px;
          background:transparent; color:var(--tx-md); cursor:pointer;
          transition:border-color .12s, color .12s;
        }
        .cel5-btn-ghost:hover { border-color:var(--tx-md); color:var(--tx); }
        .cel5-btn-solid {
          font-family:'Sora',sans-serif; font-size:11px; font-weight:600; letter-spacing:.04em;
          padding:7px 0; flex:1; border:1px solid var(--tx); border-radius:2px;
          background:var(--tx); color:var(--card); cursor:pointer; transition:opacity .12s;
        }
        .cel5-btn-solid:hover { opacity:.82; }

        .cel5-chip {
          display:inline-flex; align-items:center; gap:4px;
          font-size:10px; padding:2px 7px; border-radius:1px;
          border:1px solid var(--blt); color:var(--tx-md);
          background:var(--bg); font-weight:400;
        }
        .cel5-chip.pending { border-color:var(--b); font-weight:500; }
      `}</style>

      <div className="cel5" style={{ '--bg':tk.bg,'--card':tk.card,'--b':tk.b,'--blt':tk.blt,'--tx':tk.tx,'--tx-md':tk.txMd,'--tx-sm':tk.txSm,'--acc':tk.acc, borderLeft:`2px solid ${s.border}` } as React.CSSProperties}>

        {/* ── Hero ── */}
        <div className="cel5-hero" style={{ padding:'18px 18px 16px', borderBottom:'1px solid var(--b)' }}>
          <div className="cel5-ghost">{datos.score}</div>

          <p className="cel5-lbl" style={{ marginBottom:14, position:'relative' }}>{datos.tipoCert}</p>

          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', gap:12, marginBottom:16, position:'relative' }}>
            <div>
              <div style={{ display:'flex', alignItems:'baseline', gap:6, marginBottom:10 }}>
                <span className="cel5-serif" style={{ fontSize:60, fontWeight:600, color:'var(--tx)', lineHeight:1, letterSpacing:'-.03em' }}>
                  {datos.score}
                </span>
                <span className="cel5-serif" style={{ fontSize:26, color:'var(--b)', lineHeight:1 }}>/100</span>
              </div>
              {/* Status — left border line, neutral text */}
              <div className="cel5-status" style={{ borderLeftColor: s.border }}>
                <span style={{ fontSize:11, fontWeight:500, color:'var(--tx-md)' }}>{s.label}</span>
              </div>
            </div>

            <div style={{ textAlign:'right', paddingBottom:4 }}>
              <p style={{ fontSize:13, fontWeight:600, color:'var(--tx)', marginBottom:3 }}>{datos.animal}</p>
              <p className="cel5-mono" style={{ fontSize:11.5, color:'var(--tx-sm)' }}>{datos.arete}</p>
              <p style={{ fontSize:11, color:'var(--tx-sm)', marginTop:2 }}>{datos.lote}</p>
            </div>
          </div>

          {/* Score bar — thin, dark fill */}
          <div style={{ height:1, background:'var(--blt)', borderRadius:99, overflow:'hidden', marginBottom:5, position:'relative' }}>
            <div style={{ position:'absolute', top:0, left:0, height:'100%', width:`${datos.score}%`, background:'var(--tx-md)', borderRadius:99, transition:'width .8s cubic-bezier(.16,1,.3,1)' }} />
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', position:'relative' }}>
            {marks.map(m => (
              <span key={m} className="cel5-mono" style={{ fontSize:8.5, color:'var(--blt)' }}>{m}</span>
            ))}
          </div>

          {/* Fecha corte */}
          {datos.fechaCorte && (
            <p style={{ fontSize:10.5, color:'var(--tx-sm)', marginTop:10, position:'relative' }}>
              Fecha límite de certificación: <strong style={{ color:'var(--tx-md)', fontWeight:600 }}>{datos.fechaCorte}</strong>
            </p>
          )}

          {/* Bloqueantes */}
          {datos.bloqueantes.length > 0 && (
            <div style={{ marginTop:12, paddingTop:12, borderTop:'1px solid var(--blt)', position:'relative' }}>
              {datos.bloqueantes.map((b, i) => (
                <div key={i} style={{ display:'flex', gap:8, marginBottom: i < datos.bloqueantes.length - 1 ? 6 : 0 }}>
                  <span className="cel5-mono" style={{ fontSize:11, color:'var(--tx-sm)', flexShrink:0, marginTop:2 }}>✕</span>
                  <p style={{ fontSize:12, color:'var(--tx)', fontWeight:500, lineHeight:1.45 }}>{b}</p>
                </div>
              ))}
            </div>
          )}

          {/* Pendientes */}
          {datos.pendientes.length > 0 && datos.estado !== 'bloqueado' && (
            <div style={{ marginTop:8, position:'relative' }}>
              {datos.pendientes.map((p, i) => (
                <div key={i} style={{ display:'flex', gap:8, marginBottom: i < datos.pendientes.length - 1 ? 5 : 0 }}>
                  <span style={{ fontSize:7, color:'var(--tx-sm)', flexShrink:0, marginTop:5 }}>●</span>
                  <p style={{ fontSize:12, color:'var(--tx-md)', lineHeight:1.45 }}>{p}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Dominios ── */}
        <div>
          <div style={{ padding:'6px 18px 5px', background:'var(--bg)', borderBottom:'1px solid var(--blt)' }}>
            <span className="cel5-lbl">Verificación por dominio</span>
          </div>

          {datos.dominios.map((d, i) => {
            const fail = d.items.filter(x => !x.ok)
            return (
              <div key={i} style={{ padding:'11px 18px', borderBottom: i < datos.dominios.length - 1 ? '1px solid var(--blt)' : 'none' }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                  <p style={{ fontSize:12.5, fontWeight:500, color:'var(--tx)' }}>{d.label}</p>
                  <p style={{ fontSize:10.5, color:'var(--tx-sm)' }}>
                    {d.ok ? `${d.items.length}/${d.items.length}` : `${fail.length} pendiente${fail.length > 1 ? 's' : ''}`}
                  </p>
                </div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                  {d.items.map((item, j) => (
                    <span key={j} className={`cel5-chip${!item.ok ? ' pending' : ''}`}
                      style={{ opacity: item.ok ? .6 : 1 }}
                    >
                      {item.ok ? '✓' : '○'} {item.texto}
                    </span>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* ── Actions ── */}
        {(onVerDetalle || onExpedir) && (
          <div style={{ display:'flex', gap:8, padding:'12px 18px', borderTop:'1px solid var(--b)' }}>
            {onVerDetalle && <button className="cel5-btn-ghost" onClick={onVerDetalle}>Ver checklist</button>}
            {onExpedir && datos.estado !== 'bloqueado' && (
              <button className="cel5-btn-solid" onClick={onExpedir}>Preparar expediente</button>
            )}
          </div>
        )}
      </div>
    </>
  )
}