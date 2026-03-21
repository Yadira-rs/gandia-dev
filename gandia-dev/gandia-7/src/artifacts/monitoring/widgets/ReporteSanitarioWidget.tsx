/**
 * ReporteSanitarioWidget
 * Genera y descarga un reporte PDF del estado sanitario del rancho.
 * Usa jspdf — importado desde npm (ya incluido en el proyecto o agregar:
 *   npm install jspdf
 */

import { useState } from 'react'
import { supabase } from '../../../lib/supabaseClient'

// ─── TIPOS ────────────────────────────────────────────────────────────────────

interface ReporteData {
  rancho:      string
  fecha:       string
  score:       number
  corrales:    { label: string; animales: number; capacidad: number; estado: string }[]
  anomalias:   { tipo: string; severidad: string; corral: string; ts: string; resuelto: boolean }[]
  camaras:     { label: string; estado: string; corral: string }[]
  totalAnimales: number
  totalCapacidad: number
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function scoreLabel(s: number) {
  if (s >= 85) return 'ÓPTIMO'
  if (s >= 65) return 'ACEPTABLE'
  return 'RIESGO'
}

async function fetchReporteData(): Promise<ReporteData | null> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null

  const { data: rancho } = await supabase
    .from('ranch_extended_profiles')
    .select('id, nombre_upp, razon_social')
    .eq('user_id', session.user.id)
    .single()
  if (!rancho) return null

  const [{ data: corrales }, { data: anomalias }, { data: camaras }, { data: resumen }] = await Promise.all([
    supabase.from('corrales').select('label, animales, capacidad, estado').eq('rancho_id', rancho.id).eq('activo', true).order('label'),
    supabase.from('anomalias_monitoreo').select('tipo, severidad, corral_id, created_at, resuelto').eq('rancho_id', rancho.id).order('created_at', { ascending: false }).limit(50),
    supabase.from('camaras').select('label, estado, corral_id').eq('rancho_id', rancho.id),
    supabase.from('v_monitoreo_rancho').select('*').eq('rancho_id', rancho.id).single(),
  ])

  let score = 70
  if (resumen) {
    const s1 = resumen.anomalias_alta   === 0 ? 40 : Math.max(0, 40 - resumen.anomalias_alta * 8)
    const s2 = resumen.corrales_alerta  === 0 ? 30 : Math.max(0, 30 - resumen.corrales_alerta * 6)
    const s3 = Math.round((resumen.camaras_online / Math.max(resumen.total_corrales, 1)) * 20)
    const s4 = resumen.animales_total   > 0 ? 10 : 0
    score = Math.min(100, s1 + s2 + s3 + s4)
  }

  // Mapear corral_id a label para anomalías y cámaras
  const corralMap: Record<string, string> = {}
  corrales?.forEach((c: Record<string, unknown>) => { corralMap[c.id as string] = c.label as string })

  return {
    rancho:     (rancho.nombre_upp || rancho.razon_social || 'UPP sin nombre') as string,
    fecha:      new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' }),
    score,
    corrales:   (corrales ?? []).map((c: Record<string, unknown>) => ({ label: c.label as string, animales: c.animales as number, capacidad: c.capacidad as number, estado: c.estado as string })),
    anomalias:  (anomalias ?? []).map((a: Record<string, unknown>) => ({ tipo: a.tipo as string, severidad: a.severidad as string, corral: corralMap[a.corral_id as string] ?? '—', ts: new Date(a.created_at as string).toLocaleDateString('es-MX'), resuelto: a.resuelto as boolean })),
    camaras:    (camaras ?? []).map((c: Record<string, unknown>) => ({ label: c.label as string, estado: c.estado as string, corral: corralMap[c.corral_id as string] ?? '—' })),
    totalAnimales:  (corrales ?? []).reduce((s, c) => s + ((c as Record<string,unknown>).animales as number), 0),
    totalCapacidad: (corrales ?? []).reduce((s, c) => s + ((c as Record<string,unknown>).capacidad as number), 0),
  }
}

async function generarPDF(data: ReporteData) {
  // Import dinámico para no bloquear el bundle
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  const W = 210, M = 18
  let y = 0

  // ── HEADER ──────────────────────────────────────────────────────────────────
  doc.setFillColor(12, 10, 9)
  doc.rect(0, 0, W, 42, 'F')

  doc.setTextColor(47, 175, 143)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.text('GANDIA 7  ·  REPORTE SANITARIO', M, 14)

  doc.setTextColor(240, 240, 240)
  doc.setFontSize(18)
  doc.text(data.rancho.toUpperCase(), M, 25)

  doc.setTextColor(120, 120, 120)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text(`Generado el ${data.fecha}`, M, 34)

  // Score badge
  const sc = data.score >= 85 ? [47,175,143] : data.score >= 65 ? [245,166,35] : [229,72,77]
  doc.setFillColor(sc[0], sc[1], sc[2])
  doc.roundedRect(W - M - 30, 10, 30, 22, 3, 3, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text(String(data.score), W - M - 15, 24, { align: 'center' })
  doc.setFontSize(6)
  doc.text(scoreLabel(data.score), W - M - 15, 30, { align: 'center' })

  y = 52

  // ── KPIs ────────────────────────────────────────────────────────────────────
  const kpis = [
    { label: 'ANIMALES',   value: String(data.totalAnimales) },
    { label: 'CAPACIDAD',  value: String(data.totalCapacidad) },
    { label: 'CORRALES',   value: String(data.corrales.length) },
    { label: 'CÁMARAS',    value: String(data.camaras.length) },
    { label: 'ANOMALÍAS',  value: String(data.anomalias.filter(a => !a.resuelto).length) },
  ]
  const kW = (W - M * 2) / kpis.length
  kpis.forEach((k, i) => {
    const x = M + i * kW
    doc.setFillColor(23, 23, 23)
    doc.roundedRect(x, y, kW - 3, 18, 2, 2, 'F')
    doc.setTextColor(85, 85, 85)
    doc.setFontSize(6)
    doc.setFont('helvetica', 'bold')
    doc.text(k.label, x + (kW - 3) / 2, y + 6, { align: 'center' })
    doc.setTextColor(240, 240, 240)
    doc.setFontSize(14)
    doc.text(k.value, x + (kW - 3) / 2, y + 14, { align: 'center' })
  })

  y += 26

  // ── CORRALES ────────────────────────────────────────────────────────────────
  doc.setTextColor(85, 85, 85)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.text('CORRALES Y OCUPACIÓN', M, y)
  y += 5

  data.corrales.forEach(c => {
    const pct = c.capacidad > 0 ? Math.round(c.animales / c.capacidad * 100) : 0
    const color = c.estado === 'normal' ? [47,175,143] : c.estado === 'atencion' ? [245,166,35] : [229,72,77]

    doc.setFillColor(23, 23, 23)
    doc.roundedRect(M, y, W - M * 2, 10, 1.5, 1.5, 'F')

    doc.setFillColor(color[0], color[1], color[2])
    doc.circle(M + 5, y + 5, 2, 'F')

    doc.setTextColor(240, 240, 240)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.text(c.label, M + 10, y + 6.5)

    doc.setTextColor(120, 120, 120)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.text(`${c.animales} / ${c.capacidad} animales`, M + 45, y + 6.5)

    // Barra de ocupación
    const barX = M + 100, barW = 50
    doc.setFillColor(40, 40, 40)
    doc.roundedRect(barX, y + 3.5, barW, 3, 1, 1, 'F')
    doc.setFillColor(color[0], color[1], color[2])
    doc.roundedRect(barX, y + 3.5, barW * pct / 100, 3, 1, 1, 'F')

    doc.setTextColor(color[0], color[1], color[2])
    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    doc.text(`${pct}%`, barX + barW + 3, y + 6.5)

    y += 13
    if (y > 260) { doc.addPage(); y = 20 }
  })

  y += 4

  // ── ANOMALÍAS ACTIVAS ────────────────────────────────────────────────────────
  const activas = data.anomalias.filter(a => !a.resuelto)
  doc.setTextColor(85, 85, 85)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.text(`ANOMALÍAS ACTIVAS (${activas.length})`, M, y)
  y += 5

  if (activas.length === 0) {
    doc.setFillColor(23, 23, 23)
    doc.roundedRect(M, y, W - M * 2, 10, 1.5, 1.5, 'F')
    doc.setTextColor(47, 175, 143)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.text('✓ Sin anomalías activas', M + 5, y + 6.5)
    y += 14
  } else {
    activas.forEach(a => {
      const color = a.severidad === 'alta' ? [229,72,77] : [245,166,35]
      doc.setFillColor(23, 23, 23)
      doc.roundedRect(M, y, W - M * 2, 10, 1.5, 1.5, 'F')
      doc.setFillColor(color[0], color[1], color[2])
      doc.roundedRect(M, y, 2, 10, 0.5, 0.5, 'F')
      doc.setTextColor(240, 240, 240)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'bold')
      doc.text(a.tipo, M + 6, y + 4.5)
      doc.setTextColor(120, 120, 120)
      doc.setFontSize(7)
      doc.setFont('helvetica', 'normal')
      doc.text(`${a.corral}  ·  ${a.ts}`, M + 6, y + 8)
      doc.setTextColor(color[0], color[1], color[2])
      doc.setFontSize(6)
      doc.setFont('helvetica', 'bold')
      doc.text(a.severidad.toUpperCase(), W - M - 5, y + 6.5, { align: 'right' })
      y += 13
      if (y > 260) { doc.addPage(); y = 20 }
    })
  }

  // ── CÁMARAS ────────────────────────────────────────────────────────────────
  if (data.camaras.length > 0) {
    y += 4
    doc.setTextColor(85, 85, 85)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    doc.text(`CÁMARAS (${data.camaras.filter(c => c.estado === 'online').length}/${data.camaras.length} online)`, M, y)
    y += 5

    data.camaras.forEach(c => {
      const online = c.estado === 'online'
      doc.setFillColor(23, 23, 23)
      doc.roundedRect(M, y, W - M * 2, 8, 1.5, 1.5, 'F')
      doc.setFillColor(online ? 47 : 85, online ? 175 : 85, online ? 143 : 85)
      doc.circle(M + 5, y + 4, 1.5, 'F')
      doc.setTextColor(240, 240, 240)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'bold')
      doc.text(c.label, M + 10, y + 5.5)
      doc.setTextColor(120, 120, 120)
      doc.setFontSize(7)
      doc.text(c.corral, M + 50, y + 5.5)
      doc.setTextColor(online ? 47 : 85, online ? 175 : 85, online ? 143 : 85)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(6)
      doc.text(online ? 'ONLINE' : 'OFFLINE', W - M - 5, y + 5.5, { align: 'right' })
      y += 11
    })
  }

  // ── FOOTER ──────────────────────────────────────────────────────────────────
  const totalPages = (doc as unknown as { internal: { pages: unknown[] } }).internal.pages.length - 1
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFillColor(12, 10, 9)
    doc.rect(0, 285, W, 12, 'F')
    doc.setTextColor(60, 60, 60)
    doc.setFontSize(6)
    doc.setFont('helvetica', 'normal')
    doc.text('Gandia 7  ·  Sistema de Gestión Ganadera', M, 292)
    doc.text(`Pág. ${i} / ${totalPages}`, W - M, 292, { align: 'right' })
  }

  doc.save(`reporte-sanitario-${new Date().toISOString().split('T')[0]}.pdf`)
}

// ─── COMPONENTE ───────────────────────────────────────────────────────────────

export default function ReporteSanitarioWidget() {
  const [estado, setEstado] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')

  const handleGenerar = async () => {
    setEstado('loading')
    try {
      const data = await fetchReporteData()
      if (!data) { setEstado('error'); return }
      await generarPDF(data)
      setEstado('done')
      setTimeout(() => setEstado('idle'), 3000)
    } catch {
      setEstado('error')
      setTimeout(() => setEstado('idle'), 3000)
    }
  }

  const btnColor = estado === 'done' ? '#2FAF8F' : estado === 'error' ? '#E5484D' : '#2FAF8F'
  const btnText  = estado === 'loading' ? 'Generando…' : estado === 'done' ? '✓ Descargado' : estado === 'error' ? 'Error — reintentar' : 'Generar reporte PDF'

  return (
    <div style={{ background: '#111', border: '1px solid #1E1E1E', borderRadius: 14, overflow: 'hidden', fontFamily: 'system-ui, sans-serif' }}>

      {/* Header */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #191919', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(47,175,143,0.08)', border: '1px solid rgba(47,175,143,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2FAF8F" strokeWidth="1.5" strokeLinecap="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
        </div>
        <div>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#F0F0F0', margin: 0 }}>Reporte Sanitario</p>
          <p style={{ fontSize: 10, color: '#555', margin: '2px 0 0', fontFamily: 'monospace' }}>
            PDF · Corrales · Anomalías · Cámaras · Score
          </p>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '16px' }}>
        <p style={{ fontSize: 11, color: '#666', margin: '0 0 14px', lineHeight: 1.6, fontFamily: 'monospace' }}>
          Genera un reporte PDF con el estado sanitario actual del rancho: score, corrales, anomalías activas y estado de cámaras. Listo para imprimir o enviar a autoridades.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          {[
            'Score sanitario 0–100',
            'Ocupación por corral',
            'Anomalías activas',
            'Estado de cámaras',
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#2FAF8F', flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: '#555' }}>{item}</span>
            </div>
          ))}
        </div>

        <button
          onClick={handleGenerar}
          disabled={estado === 'loading'}
          style={{
            width: '100%', padding: '11px', borderRadius: 10,
            background: estado === 'loading' ? 'rgba(47,175,143,0.12)' : btnColor,
            border: estado === 'loading' ? '1px solid rgba(47,175,143,0.3)' : 'none',
            color: estado === 'loading' ? '#2FAF8F' : 'white',
            fontSize: 12, fontWeight: 700, cursor: estado === 'loading' ? 'default' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'all 0.2s', fontFamily: 'monospace', letterSpacing: '0.03em',
          }}
        >
          {estado === 'loading' ? (
            <>
              <div style={{ width: 12, height: 12, border: '2px solid #2FAF8F', borderTopColor: 'transparent', borderRadius: '50%', animation: 'rspin 0.8s linear infinite' }} />
              {btnText}
            </>
          ) : (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              {btnText}
            </>
          )}
        </button>
      </div>

      <style>{`@keyframes rspin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}