import { useState, useEffect } from 'react'

/**
 * CertificationVencimientosWidget — European Document v5
 * Drop-in replacement. Mismos tipos y exports.
 */

export interface Vencimiento {
  id:            number
  animal:        string
  arete:         string
  tipoCert:      string
  autoridad:     string
  fechaVence:    string
  diasRestantes: number
  lote?:         string
}

interface Props {
  vencimientos: Vencimiento[]
  onVerCert?:   (v: Vencimiento) => void
  onRenovar?:   (v: Vencimiento) => void
}

// ESLint: typed, no `any`
interface KpiStat {
  n:     number
  label: string
}

// Left border urgency — neutral dark shades, no bright colors
const urgBorder = (dias: number): string => {
  if (dias < 0)   return '#8C1A1A'
  if (dias <= 7)  return '#8C1A1A'
  if (dias <= 30) return '#8A6800'
  return '#C8C2BB'
}

const diasLabel = (dias: number): string => {
  if (dias < 0)   return `−${Math.abs(dias)}`
  if (dias <= 30) return `${dias}`
  return '✓'
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

export default function CertificationVencimientosWidget({ vencimientos, onVerCert, onRenovar }: Props) {
  const dark = useDark()
  const tk = dark
    ? { bg:'#0E0D0C', card:'#1C1917', b:'#2A2724', blt:'#221F1D', tx:'#F4F2EF', txMd:'#A19D97', txSm:'#58534E', acc:'#2FAF8F' }
    : { bg:'#FAFAF9', card:'#FFFFFF', b:'#E7E5E4', blt:'#F5F5F4', tx:'#1C1917', txMd:'#57534E', txSm:'#A8A29E', acc:'#2FAF8F' }

  const sorted   = [...vencimientos].sort((a, b) => a.diasRestantes - b.diasRestantes)
  const vencidos = sorted.filter(v => v.diasRestantes < 0)
  const urgentes = sorted.filter(v => v.diasRestantes >= 0 && v.diasRestantes <= 7)
  const proximos = sorted.filter(v => v.diasRestantes > 7  && v.diasRestantes <= 30)
  const ok       = sorted.filter(v => v.diasRestantes > 30)
  const totalUrg = vencidos.length + urgentes.length

  // Typed array — no `any`
  const kpiStats: KpiStat[] = [
    ...(vencidos.length > 0 ? [{ n: vencidos.length, label: 'Vencidos'     }] : []),
    ...(urgentes.length > 0 ? [{ n: urgentes.length, label: 'Esta semana'  }] : []),
    ...(proximos.length > 0 ? [{ n: proximos.length, label: 'Próximos 30d' }] : []),
    ...(totalUrg === 0      ? [{ n: ok.length,       label: 'Vigentes'     }] : []),
  ]

  const renderGroup = (items: Vencimiento[], titulo: string) => {
    if (!items.length) return null
    return (
      <div key={titulo}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 18px 5px', background:'var(--bg)', borderBottom:'1px solid var(--blt)' }}>
          <span style={{ fontSize:9, fontWeight:600, letterSpacing:'.11em', textTransform:'uppercase' as const, color:'var(--tx-sm)' }}>
            {titulo}
          </span>
          <span style={{ fontSize:10, color:'var(--tx-sm)' }}>{items.length}</span>
        </div>

        {items.map((v, idx) => {
          const border = urgBorder(v.diasRestantes)
          return (
            <div
              key={v.id}
              onClick={() => onVerCert?.(v)}
              style={{
                display:'grid', gridTemplateColumns:'48px 1fr auto',
                gap:'0 12px', alignItems:'center', padding:'10px 18px',
                borderBottom: idx < items.length - 1 ? '1px solid var(--blt)' : 'none',
                borderLeft:`2px solid ${border}`,
                cursor: onVerCert ? 'pointer' : 'default', transition:'background .1s',
              }}
              onMouseEnter={e => { if (onVerCert) (e.currentTarget as HTMLElement).style.background = 'var(--bg)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            >
              {/* Days counter — no color, just typography */}
              <div style={{ textAlign:'center', borderRight:'1px solid var(--blt)', paddingRight:12 }}>
                <p style={{ fontFamily:'ui-monospace,monospace', fontSize:16, fontWeight:700, color:'var(--tx)', lineHeight:1, letterSpacing:'-.01em' }}>
                  {diasLabel(v.diasRestantes)}
                </p>
                {v.diasRestantes <= 30 && (
                  <p style={{ fontSize:8.5, color:'var(--tx-sm)', fontWeight:500, letterSpacing:'.05em', marginTop:2, textTransform:'uppercase' as const }}>
                    días
                  </p>
                )}
              </div>

              {/* Info */}
              <div style={{ minWidth:0 }}>
                <p style={{ fontSize:12.5, fontWeight:600, color:'var(--tx)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:3 }}>
                  {v.animal || v.arete}
                </p>
                <p style={{ fontSize:11, color:'var(--tx-sm)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {v.tipoCert}<span style={{ color:'var(--blt)' }}> · </span>{v.autoridad}
                  {v.lote && <span style={{ color:'var(--blt)' }}> · {v.lote}</span>}
                </p>
              </div>

              {/* Fecha + acción */}
              <div style={{ textAlign:'right', flexShrink:0 }}>
                <p style={{ fontFamily:'ui-monospace,monospace', fontSize:11.5, color:'var(--tx-md)', fontWeight:500, marginBottom: onRenovar && v.diasRestantes <= 30 ? 4 : 0 }}>
                  {v.fechaVence}
                </p>
                {onRenovar && v.diasRestantes <= 30 && (
                  <button
                    onClick={e => { e.stopPropagation(); onRenovar(v) }}
                    style={{
                      fontFamily:'Sora,sans-serif', fontSize:10.5, fontWeight:600,
                      color:'var(--acc)', background:'none', border:'none', cursor:'pointer',
                      padding:0, textDecoration:'underline', textUnderlineOffset:'2px',
                      display:'block', marginLeft:'auto',
                    }}
                  >
                    Renovar →
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Sora:wght@400;500;600&display=swap');

        .cven5 * { box-sizing:border-box; margin:0; padding:0; }
        .cven5 {
          font-family:'Sora',ui-sans-serif,sans-serif; font-size:13px;
          color:var(--tx); background:var(--card); -webkit-font-smoothing:antialiased;
          border:1px solid var(--b); border-radius:2px; overflow:hidden; position:relative;
        }
        .cven5::after {
          content:''; position:absolute; inset:0; pointer-events:none; z-index:10;
          background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");
        }
        .cven5 > * { position:relative; z-index:1; }
        .cven5-serif { font-family:'Cormorant Garamond',Georgia,serif; }

        .cven5-kpi {
          display:flex;
          background-color:var(--bg);
          background-image:repeating-linear-gradient(
            -45deg, transparent, transparent 5px,
            rgba(0,0,0,.022) 5px, rgba(0,0,0,.022) 6px
          );
          border-bottom:1px solid var(--b);
        }
      `}</style>

      <div className="cven5" style={{ '--bg':tk.bg,'--card':tk.card,'--b':tk.b,'--blt':tk.blt,'--tx':tk.tx,'--tx-md':tk.txMd,'--tx-sm':tk.txSm,'--acc':tk.acc } as React.CSSProperties}>

        {/* ── KPI header ── */}
        <div className="cven5-kpi">
          <div style={{ padding:'14px 18px 12px', borderBottom:'1px solid var(--blt)', width:'100%' }}>
            <p style={{ fontSize:9, fontWeight:600, letterSpacing:'.11em', textTransform:'uppercase', color:'var(--tx-sm)', marginBottom:12 }}>
              Vencimientos
            </p>
            <div style={{ display:'flex' }}>
              {kpiStats.map((s, i) => (
                <div key={i} style={{
                  flex:1, textAlign:'center',
                  borderRight: i < kpiStats.length - 1 ? '1px solid var(--b)' : 'none',
                }}>
                  <p className="cven5-serif" style={{ fontSize:32, fontWeight:600, color:'var(--tx)', lineHeight:1, letterSpacing:'-.02em', marginBottom:4 }}>
                    {s.n}
                  </p>
                  <p style={{ fontSize:9, fontWeight:600, letterSpacing:'.09em', textTransform:'uppercase', color:'var(--tx-sm)' }}>
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {renderGroup(vencidos, 'Vencidos')}
        {renderGroup(urgentes, 'Esta semana')}
        {renderGroup(proximos, 'Próximos 30 días')}
        {renderGroup(ok, 'Vigentes')}
      </div>
    </>
  )
}