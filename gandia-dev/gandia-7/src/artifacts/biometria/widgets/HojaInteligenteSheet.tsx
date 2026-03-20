import { useRef } from 'react'
import html2pdf from 'html2pdf.js'
import type { AnimalContext } from './BiometriaCapturaWidget'

interface Props {
  animal?: AnimalContext   // opcional: si viene de Registrar, prellenamos los campos
  onClose: () => void
}

export default function HojaInteligenteSheet({ animal, onClose }: Props) {

  const sheetRef = useRef<HTMLDivElement>(null)

  const APP_URL = import.meta.env.VITE_APP_URL ?? window.location.origin
  const qrTarget = animal?.id
    ? `${APP_URL}/animal/${animal.id}`
    : `${APP_URL}/biometria/registrar`
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&ecc=M&data=${encodeURIComponent(qrTarget)}`
  const qrLabel = animal?.id ? 'Escanear · Ver perfil' : 'Escanear · Registrar animal'

  const getHojaHTML = () => {
    const content = sheetRef.current?.outerHTML ?? ''
    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>NosePrint Bovino · Hoja Inteligente GP-BIO-001</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #fff; display: flex; justify-content: center; padding: 0; overflow: hidden; }
    html { overflow: hidden; }
    @page { size: A4 portrait; margin: 0; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>${content}</body>
</html>`
  }

  const handlePrint = () => {
    const win = window.open('', '_blank', 'width=900,height=700')
    if (!win) return
    win.document.write(getHojaHTML())
    win.document.close()
    win.focus()
    // Esperar a que cargue antes de imprimir
    win.onload = () => { win.print() }
    // Fallback por si onload no dispara (algunos browsers)
    setTimeout(() => { win.print() }, 600)
  }

  const handleDownload = () => {
    if (!sheetRef.current) return
    const filename = `hoja-noseprint${animal?.arete ? '-' + animal.arete.replace('#', '') : ''}.pdf`
    html2pdf()
      .set({
        margin:      0,
        filename,
        image:       { type: 'jpeg', quality: 1 },
        html2canvas: { scale: 3, useCORS: true, letterRendering: true },
        jsPDF:       { unit: 'mm', format: 'a4', orientation: 'portrait' },
      })
      .from(sheetRef.current)
      .save()
  }

  return (
    <>
      {/* ── Print styles inyectadas en head vía <style> ── */}
      <style>{`
        #hoja-print-root::-webkit-scrollbar        { width: 4px; }
        #hoja-print-root::-webkit-scrollbar-track  { background: transparent; }
        #hoja-print-root::-webkit-scrollbar-thumb  { background: rgba(255,255,255,0.18); border-radius: 99px; }
        #hoja-print-root::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.32); }
        @media print {
          body * { visibility: hidden !important; }
          .hoja-sheet, .hoja-sheet * { visibility: visible !important; }
          .hoja-sheet {
            position: fixed !important;
            top: 0 !important; left: 0 !important;
            width: 210mm !important;
            box-shadow: none !important;
            margin: 0 !important;
          }
          @page { size: A4 portrait; margin: 0; }
        }
      `}</style>

      {/* ── Overlay ── */}
      <div
        id="hoja-print-root"
        className="hoja-modal-overlay"
        style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(4px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: '24px 0 48px', gap: 16, overflowY: 'auto', overflowX: 'auto',
        }}
      >
        {/* Chrome bar */}
        <div
          className="hoja-modal-chrome"
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            width: '210mm', maxWidth: '210mm',
          }}
        >
          <span style={{ flex: 1, fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#aaa' }}>
            <strong style={{ color: '#fff' }}>NosePrint Bovino</strong> · Hoja Inteligente GP-BIO-001
          </span>
          <button
            onClick={handleDownload}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              background: 'rgba(255,255,255,0.1)', color: '#fff',
              border: '1px solid rgba(255,255,255,0.18)',
              borderRadius: 6, padding: '7px 14px',
              fontFamily: "'IBM Plex Mono', monospace", fontSize: 10,
              fontWeight: 600, letterSpacing: '0.06em', cursor: 'pointer',
            }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Descargar
          </button>
          <button
            onClick={handlePrint}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              background: '#fff', color: '#111', border: 'none',
              borderRadius: 6, padding: '7px 14px',
              fontFamily: "'IBM Plex Mono', monospace", fontSize: 10,
              fontWeight: 600, letterSpacing: '0.06em', cursor: 'pointer',
            }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 6 2 18 2 18 9"/>
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
              <rect x="6" y="14" width="12" height="8"/>
            </svg>
            Imprimir A4
          </button>
          <button
            onClick={onClose}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 30, height: 30, background: 'rgba(255,255,255,.1)',
              border: '1px solid rgba(255,255,255,.15)', borderRadius: 6,
              color: '#aaa', cursor: 'pointer',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* ── Hoja A4 ── */}
        <div
          ref={sheetRef}
          className="hoja-sheet"
          style={{
            width: '210mm', minHeight: '297mm', background: '#fff',
            display: 'flex', flexDirection: 'column',
            boxShadow: '0 4px 40px rgba(0,0,0,.35)',
            fontFamily: "'IBM Plex Mono', monospace",
          }}
        >
          {/* Top rule */}
          <div style={{ height: 3, background: '#0a0a0a', flexShrink: 0 }} />

          {/* Header */}
          <div style={{ height: '11mm', display: 'flex', alignItems: 'stretch', borderBottom: '1px solid #0a0a0a', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '0 14px', borderRight: '1px solid #0a0a0a', flexShrink: 0 }}>
              <div style={{ width: 3, height: 16, background: '#0a0a0a' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 8.5, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#0a0a0a', lineHeight: 1 }}>Gandia · NosePrint Bovino</span>
                <span style={{ fontSize: 6.5, letterSpacing: '0.08em', color: '#999', lineHeight: 1 }}>Sistema biométrico bovino</span>
              </div>
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '0 16px', gap: 22 }}>
              {[
                ['Tipo de documento', 'Hoja Inteligente'],
                ['Marcadores', 'ArUco 4×4 · IDs 0–3'],
                ['Formato', 'A4 · 210 × 297 mm'],
                ['Imprimir en', 'Papel bond 90 g · Sin escalar'],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: 5.5, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#bbb', lineHeight: 1 }}>{k}</span>
                  <span style={{ fontSize: 7, fontWeight: 500, color: '#0a0a0a', lineHeight: 1 }}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', padding: '0 12px', borderLeft: '1px solid #0a0a0a', flexShrink: 0 }}>
              <span style={{ fontSize: 7, letterSpacing: '0.1em', color: '#bbb' }}>GP-BIO-001</span>
            </div>
          </div>

          {/* Morro zone */}
          <div style={{ flex: 1, minHeight: '148mm', position: 'relative', borderBottom: '1px solid #0a0a0a' }}>

            {/* ArUco 0 — TL */}
            <svg style={{ position: 'absolute', top: 0, left: 0, width: '20mm', height: '20mm', display: 'block', imageRendering: 'pixelated' }} viewBox="0 0 6 6">
              <rect width="6" height="6" fill="#0a0a0a"/>
              <rect x=".5" y=".5" width="5" height="5" fill="white"/>
              <rect x="1" y="1" width="1" height="1" fill="#0a0a0a"/>
              <rect x="2" y="1" width="1" height="1" fill="#0a0a0a"/>
              <rect x="4" y="1" width="1" height="1" fill="#0a0a0a"/>
              <rect x="1" y="2" width="1" height="1" fill="#0a0a0a"/>
              <rect x="4" y="2" width="1" height="1" fill="#0a0a0a"/>
              <rect x="2" y="3" width="1" height="1" fill="#0a0a0a"/>
              <rect x="3" y="3" width="1" height="1" fill="#0a0a0a"/>
              <rect x="4" y="3" width="1" height="1" fill="#0a0a0a"/>
              <rect x="4" y="4" width="1" height="1" fill="#0a0a0a"/>
            </svg>
            <span style={{ position: 'absolute', top: '21mm', left: '2mm', fontSize: 5.5, letterSpacing: '0.06em', color: '#bbb' }}>ArUco 0</span>

            {/* ArUco 1 — TR */}
            <svg style={{ position: 'absolute', top: 0, right: 0, width: '20mm', height: '20mm', display: 'block', imageRendering: 'pixelated' }} viewBox="0 0 6 6">
              <rect width="6" height="6" fill="#0a0a0a"/>
              <rect x=".5" y=".5" width="5" height="5" fill="white"/>
              <rect x="1" y="1" width="1" height="1" fill="#0a0a0a"/>
              <rect x="3" y="1" width="1" height="1" fill="#0a0a0a"/>
              <rect x="4" y="1" width="1" height="1" fill="#0a0a0a"/>
              <rect x="2" y="2" width="1" height="1" fill="#0a0a0a"/>
              <rect x="4" y="2" width="1" height="1" fill="#0a0a0a"/>
              <rect x="1" y="3" width="1" height="1" fill="#0a0a0a"/>
              <rect x="2" y="3" width="1" height="1" fill="#0a0a0a"/>
              <rect x="1" y="4" width="1" height="1" fill="#0a0a0a"/>
              <rect x="3" y="4" width="1" height="1" fill="#0a0a0a"/>
            </svg>
            <span style={{ position: 'absolute', top: '21mm', right: '2mm', fontSize: 5.5, letterSpacing: '0.06em', color: '#bbb' }}>ArUco 1</span>

            {/* ArUco 2 — BL */}
            <svg style={{ position: 'absolute', bottom: 0, left: 0, width: '20mm', height: '20mm', display: 'block', imageRendering: 'pixelated' }} viewBox="0 0 6 6">
              <rect width="6" height="6" fill="#0a0a0a"/>
              <rect x=".5" y=".5" width="5" height="5" fill="white"/>
              <rect x="2" y="1" width="1" height="1" fill="#0a0a0a"/>
              <rect x="3" y="1" width="1" height="1" fill="#0a0a0a"/>
              <rect x="1" y="2" width="1" height="1" fill="#0a0a0a"/>
              <rect x="3" y="2" width="1" height="1" fill="#0a0a0a"/>
              <rect x="2" y="3" width="1" height="1" fill="#0a0a0a"/>
              <rect x="4" y="3" width="1" height="1" fill="#0a0a0a"/>
              <rect x="1" y="4" width="1" height="1" fill="#0a0a0a"/>
              <rect x="4" y="4" width="1" height="1" fill="#0a0a0a"/>
            </svg>
            <span style={{ position: 'absolute', bottom: '21mm', left: '2mm', fontSize: 5.5, letterSpacing: '0.06em', color: '#bbb' }}>ArUco 2</span>

            {/* ArUco 3 — BR */}
            <svg style={{ position: 'absolute', bottom: 0, right: 0, width: '20mm', height: '20mm', display: 'block', imageRendering: 'pixelated' }} viewBox="0 0 6 6">
              <rect width="6" height="6" fill="#0a0a0a"/>
              <rect x=".5" y=".5" width="5" height="5" fill="white"/>
              <rect x="1" y="1" width="1" height="1" fill="#0a0a0a"/>
              <rect x="4" y="1" width="1" height="1" fill="#0a0a0a"/>
              <rect x="2" y="2" width="1" height="1" fill="#0a0a0a"/>
              <rect x="3" y="2" width="1" height="1" fill="#0a0a0a"/>
              <rect x="1" y="3" width="1" height="1" fill="#0a0a0a"/>
              <rect x="2" y="3" width="1" height="1" fill="#0a0a0a"/>
              <rect x="3" y="4" width="1" height="1" fill="#0a0a0a"/>
              <rect x="4" y="4" width="1" height="1" fill="#0a0a0a"/>
            </svg>
            <span style={{ position: 'absolute', bottom: '21mm', right: '2mm', fontSize: 5.5, letterSpacing: '0.06em', color: '#bbb' }}>ArUco 3</span>

            {/* Oval guide */}
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', userSelect: 'none' }}>
              <div style={{ width: '102mm', height: '74mm', border: '1px dashed #ccc', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                  <svg style={{ opacity: 0.12 }} width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#0a0a0a" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 7V5a2 2 0 0 1 2-2h2"/>
                    <path d="M17 3h2a2 2 0 0 1 2 2v2"/>
                    <path d="M21 17v2a2 2 0 0 1-2 2h-2"/>
                    <path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
                    <circle cx="12" cy="12" r="3"/>
                    <line x1="2" y1="12" x2="22" y2="12"/>
                  </svg>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 8, fontWeight: 600, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#ccc' }}>Zona biométrica</div>
                    <div style={{ fontSize: 6.5, letterSpacing: '0.1em', color: '#d4d4d4', lineHeight: 1.9, marginTop: 4 }}>
                      Acercar morro del animal<br/>Distancia recomendada: 15 – 25 cm
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Zone badge */}
            <div style={{ position: 'absolute', bottom: '3mm', left: '22mm', display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 4, height: 4, background: '#0a0a0a', borderRadius: '50%' }} />
              <span style={{ fontSize: 6, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#aaa' }}>Zona biométrica · mantener limpia y sin obstrucciones</span>
            </div>
          </div>

          {/* Fields row */}
          <div style={{ height: '13mm', display: 'flex', borderBottom: '1px solid #0a0a0a', flexShrink: 0 }}>
            {[
              { label: 'Nombre del animal', value: animal?.nombre, flex: 1.8 },
              { label: 'Arete / ID',         value: animal?.arete  },
              { label: 'Raza',               value: animal?.raza   },
              { label: 'Lote',               value: animal?.lote   },
              { label: 'Operador',           value: undefined      },
              { label: 'Fecha',              value: undefined      },
            ].map(({ label, value, flex }, i, arr) => (
              <div key={label} style={{
                flex: flex ?? 1, borderRight: i < arr.length - 1 ? '1px solid #0a0a0a' : 'none',
                padding: '3.5mm 4.5mm 0', display: 'flex', flexDirection: 'column', gap: '2mm',
              }}>
                <span style={{ fontSize: 5.5, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#bbb', lineHeight: 1 }}>{label}</span>
                {value
                  ? <span style={{ fontSize: 8, fontWeight: 600, color: '#0a0a0a', lineHeight: 1 }}>{value}</span>
                  : <div style={{ height: 1, background: '#e2e2e2', width: '90%', marginTop: 2 }} />
                }
              </div>
            ))}
          </div>

          {/* Bottom row */}
          <div style={{ height: '34mm', display: 'flex', flexShrink: 0 }}>

            {/* QR Real — perfil del animal o link a registrar */}
            <div style={{ width: '34mm', borderRight: '1px solid #0a0a0a', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2mm', padding: '3mm' }}>
              <img
                src={qrImageUrl}
                alt="QR"
                style={{ width: '24mm', height: '24mm', imageRendering: 'pixelated', display: 'block' }}
                crossOrigin="anonymous"
              />
              <span style={{ fontSize: 5.5, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#888', textAlign: 'center', lineHeight: 1.6 }}>
                {qrLabel}
              </span>
            </div>

            {/* Instructions */}
            <div style={{ flex: 1, padding: '4mm 5mm 3mm', display: 'flex', flexDirection: 'column', gap: '2.5mm', borderRight: '1px solid #0a0a0a' }}>
              <span style={{ fontSize: 5.5, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#aaa' }}>Procedimiento de captura</span>
              <ol style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1.8mm' }}>
                {[
                  'Limpiar el morro con paño húmedo. Esperar 30 s antes de capturar.',
                  'Colocar la hoja en superficie firme o sostenerla con ambas manos.',
                  'Abrir Gandia → Biometría → Hoja inteligente. Esperar detección de los 4 marcadores ArUco.',
                  'Acercar el morro al óvalo. La captura es automática al alcanzar calidad ≥ 80%.',
                ].map((t, i) => (
                  <li key={i} style={{ display: 'flex', gap: 4, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 6, fontWeight: 600, color: '#d0d0d0', flexShrink: 0, lineHeight: 1.5, width: 12 }}>0{i + 1}</span>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 7, fontWeight: 400, color: '#555', lineHeight: 1.5 }}>{t}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Notes */}
            <div style={{ width: '38mm', flexShrink: 0, padding: '4mm', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 5.5, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#aaa' }}>Notas</span>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 6.5, color: '#aaa', lineHeight: 1.65 }}>Hoja reutilizable.<br/>No doblar ni plastificar: afecta la detección de marcadores.</span>
              <span style={{ fontSize: 5.5, letterSpacing: '0.1em', color: '#ccc' }}>GP-BIO-001 · v1.0 · 2025</span>
            </div>

          </div>

          {/* Footer */}
          <div style={{ height: '6.5mm', borderTop: '1px solid #e8e8e8', display: 'flex', alignItems: 'center', padding: '0 5mm', flexShrink: 0 }}>
            {[
              { t: 'Gandia 7 · Equipo Búfalos', align: 'left' as const },
              { t: 'NosePrint Bovino — Sistema de identificación biométrica bovina', align: 'center' as const },
              { t: 'Hoja Inteligente · Impresión sin escalar', align: 'right' as const },
            ].map(({ t, align }) => (
              <span key={t} style={{ flex: 1, fontSize: 6, letterSpacing: '0.09em', textTransform: 'uppercase', color: '#ccc', textAlign: align }}>{t}</span>
            ))}
          </div>

        </div>
      </div>
    </>
  )
}