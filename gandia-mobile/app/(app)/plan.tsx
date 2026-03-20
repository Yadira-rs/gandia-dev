// app/(app)/plan.tsx — Gandia 7 · Plan y uso · React Native
// Vista de solo lectura — la compra de créditos se gestiona en la web
import { useRef, useEffect } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Animated, useColorScheme, Linking,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Path, Line, Polyline, Circle, Rect } from 'react-native-svg'

// ─── Tokens ───────────────────────────────────────────────────────────────────
const BRAND = '#2FAF8F'
const WEB_URL = 'https://gandia7.com/plan' // TODO: URL real

const tk = (d: boolean) => ({
  bg:      d ? '#0c0a09' : '#fafaf9',
  surface: d ? '#141210' : '#ffffff',
  surface2:d ? '#1c1917' : '#f2f1f0',
  border:  d ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.09)',
  divider: d ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.07)',
  text:    d ? '#fafaf9' : '#1c1917',
  text2:   d ? '#d6d3d1' : '#44403c',
  muted:   d ? '#78716c' : '#a8a29e',
  muted2:  d ? '#57534e' : '#c4bfba',
  muted3:  d ? '#44403c' : '#d6d3d1',
})

// ─── Mock data (TODO: reemplazar con contexto real) ───────────────────────────
const MOCK = {
  nombre:      'Fernando García',
  rol:         'Productor Ganadero',
  modo:        'Operativo',
  inicial:     'F',
  plan:        'Ganadero',
  mensaje:     'El productor paga por operar y consultar, no por certificarse.',
  consumo: [
    { concepto: 'Trámites iniciados',   cantidad: 12,  unidad: 'trámites'   },
    { concepto: 'Pasaportes generados', cantidad: 45,  unidad: 'documentos' },
    { concepto: 'Consultas a IA',       cantidad: 28,  unidad: 'consultas'  },
    { concepto: 'Archivos cargados',    cantidad: 156, unidad: 'MB'         },
  ],
  creditos: [
    { concepto: 'Trámites',       usados: 12,  total: 30,  unidad: 'trámites'   },
    { concepto: 'Pasaportes',     usados: 45,  total: 100, unidad: 'documentos' },
    { concepto: 'Consultas IA',   usados: 28,  total: 35,  unidad: 'consultas'  },
    { concepto: 'Almacenamiento', usados: 156, total: 500, unidad: 'MB'         },
  ],
  capacidades: ['Chat & Asistencia', 'Trámites', 'Pasaportes', 'Gemelos', 'Historial', 'Monitoreo'],
  cargos: [
    { fecha: '1 Feb 2025', concepto: 'Operación mensual',   monto: 1840 },
    { fecha: '1 Ene 2025', concepto: 'Operación mensual',   monto: 1620 },
    { fecha: '1 Dic 2024', concepto: 'Ampliación · IA ×15', monto: 270  },
  ],
}

// ─── Icons ────────────────────────────────────────────────────────────────────
const si = { fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

const IcoBack    = ({ c }: { c: string }) => <Svg width={18} height={18} viewBox="0 0 24 24" {...si} stroke={c} strokeWidth="2"><Line x1="19" y1="12" x2="5" y2="12"/><Polyline points="12 19 5 12 12 5"/></Svg>
const IcoSpark   = ({ c }: { c: string }) => <Svg width={13} height={13} viewBox="0 0 24 24" {...si} stroke={c} strokeWidth="1.75"><Path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></Svg>
const IcoCheck   = ({ c }: { c: string }) => <Svg width={11} height={11} viewBox="0 0 24 24" {...si} stroke={c} strokeWidth="2.5"><Polyline points="20 6 9 17 4 12"/></Svg>
const IcoExtLink = ({ c }: { c: string }) => <Svg width={14} height={14} viewBox="0 0 24 24" {...si} stroke={c} strokeWidth="2"><Path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><Polyline points="15 3 21 3 21 9"/><Line x1="10" y1="14" x2="21" y2="3"/></Svg>
const IcoInfo    = ({ c }: { c: string }) => <Svg width={14} height={14} viewBox="0 0 24 24" {...si} stroke={c} strokeWidth="1.75"><Circle cx="12" cy="12" r="10"/><Line x1="12" y1="16" x2="12" y2="12"/><Line x1="12" y1="8" x2="12.01" y2="8"/></Svg>
const IcoCard    = ({ c }: { c: string }) => <Svg width={18} height={18} viewBox="0 0 24 24" {...si} stroke={c} strokeWidth="1.75"><Rect x="1" y="4" width="22" height="16" rx="2"/><Line x1="1" y1="10" x2="23" y2="10"/></Svg>
const IcoClock   = ({ c }: { c: string }) => <Svg width={18} height={18} viewBox="0 0 24 24" {...si} stroke={c} strokeWidth="1.75"><Circle cx="12" cy="12" r="10"/><Polyline points="12 6 12 12 16 14"/></Svg>
const IcoReceipt = ({ c }: { c: string }) => <Svg width={15} height={15} viewBox="0 0 24 24" {...si} stroke={c} strokeWidth="1.75"><Path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><Line x1="8" y1="10" x2="16" y2="10"/><Line x1="8" y1="14" x2="16" y2="14"/></Svg>
const IcoGlobe   = ({ c }: { c: string }) => <Svg width={18} height={18} viewBox="0 0 24 24" {...si} stroke={c} strokeWidth="1.75"><Circle cx="12" cy="12" r="10"/><Line x1="2" y1="12" x2="22" y2="12"/><Path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></Svg>

// ─── Section label ────────────────────────────────────────────────────────────
function SLabel({ label, isDark }: { label: string; isDark: boolean }) {
  const t = tk(isDark)
  return (
    <View style={sl.wrap}>
      <IcoSpark c={BRAND} />
      <Text style={[sl.text, { color: t.muted }]}>{label.toUpperCase()}</Text>
      <View style={[sl.line, { backgroundColor: t.divider }]} />
    </View>
  )
}
const sl = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginTop: 28, marginBottom: 14 },
  text: { fontFamily: 'Geist-SemiBold', fontSize: 10, letterSpacing: 1.1 },
  line: { flex: 1, height: 1 },
})

// ─── Credit bar ───────────────────────────────────────────────────────────────
function CreditBar({ item, isDark }: {
  item: { concepto: string; usados: number; total: number; unidad: string }
  isDark: boolean
}) {
  const t        = tk(isDark)
  const pct      = Math.min((item.usados / item.total) * 100, 100)
  const restante = Math.max(item.total - item.usados, 0)
  const color    = pct >= 85 ? '#ef4444' : pct >= 65 ? '#f59e0b' : BRAND
  const label    = pct >= 85 ? 'Crítico' : pct >= 65 ? 'Moderado' : 'Disponible'

  const barW = useRef(new Animated.Value(0)).current
  useEffect(() => {
    Animated.timing(barW, { toValue: pct, duration: 700, useNativeDriver: false }).start()
  }, [])

  return (
    <View style={cb.wrap}>
      <View style={cb.header}>
        <Text style={[cb.name, { color: t.text2 }]}>{item.concepto}</Text>
        <View style={cb.right}>
          <Text style={[cb.status, { color }]}>{label}</Text>
          <Text style={[cb.counts, { color: t.muted }]}>
            {item.usados} / {item.total} {item.unidad}
          </Text>
        </View>
      </View>
      <View style={[cb.track, { backgroundColor: t.surface2 }]}>
        <Animated.View style={[cb.fill, {
          width: barW.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }),
          backgroundColor: color,
        }]} />
      </View>
      <Text style={[cb.rest, { color: t.muted }]}>
        Quedan{' '}
        <Text style={{ fontFamily: 'Geist-Medium', color: t.muted }}>
          {restante} {item.unidad}
        </Text>
      </Text>
    </View>
  )
}
const cb = StyleSheet.create({
  wrap:   { gap: 6 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name:   { fontFamily: 'Geist-Medium', fontSize: 13 },
  right:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  status: { fontFamily: 'Geist-SemiBold', fontSize: 10.5 },
  counts: { fontFamily: 'Geist-Regular', fontSize: 11 },
  track:  { height: 6, borderRadius: 3, overflow: 'hidden' },
  fill:   { height: '100%', borderRadius: 3 },
  rest:   { fontFamily: 'Geist-Regular', fontSize: 10.5 },
})

// ─── Web CTA card ─────────────────────────────────────────────────────────────
function WebCTACard({ isDark }: { isDark: boolean }) {
  const t = tk(isDark)

  return (
    <TouchableOpacity
      style={[wc.card, { borderColor: 'rgba(47,175,143,0.30)' }]}
      onPress={() => Linking.openURL(WEB_URL)}
      activeOpacity={0.85}
    >
      {/* Gradient accent top */}
      <View style={wc.accent} />

      <View style={wc.body}>
        {/* Icon + eyebrow */}
        <View style={wc.eyebrowRow}>
          <View style={wc.globeIcon}>
            <IcoGlobe c={BRAND} />
          </View>
          <View>
            <Text style={[wc.eyebrow, { color: t.muted }]}>Disponible en la web</Text>
            <Text style={[wc.eyebrowSub, { color: t.muted2 }]}>gandia7.com</Text>
          </View>
        </View>

        {/* Title */}
        <Text style={[wc.title, { color: t.text }]}>
          ¿Necesitas más créditos?{'\n'}
          <Text style={{ fontStyle: 'italic' }}>Gestiona tu plan en la web.</Text>
        </Text>

        {/* Features */}
        <View style={wc.features}>
          {[
            'Ampliar capacidad operativa',
            'Agregar método de pago',
            'Ver historial de cargos completo',
          ].map((f, i) => (
            <View key={i} style={wc.featureRow}>
              <View style={wc.featureDot}>
                <IcoCheck c={BRAND} />
              </View>
              <Text style={[wc.featureText, { color: t.text2 }]}>{f}</Text>
            </View>
          ))}
        </View>

        {/* Button */}
        <TouchableOpacity
          style={wc.btn}
          onPress={() => Linking.openURL(WEB_URL)}
          activeOpacity={0.85}
        >
          <Text style={wc.btnText}>Ir a gandia7.com</Text>
          <IcoExtLink c="#fff" />
        </TouchableOpacity>

        <Text style={[wc.hint, { color: t.muted3 }]}>
          Las compras se procesan en la plataforma web por políticas de App Store y Google Play.
        </Text>
      </View>
    </TouchableOpacity>
  )
}
const wc = StyleSheet.create({
  card:        { marginHorizontal: 16, borderRadius: 20, borderWidth: 1, overflow: 'hidden', backgroundColor: 'rgba(47,175,143,0.05)' },
  accent:      { height: 3, backgroundColor: BRAND },
  body:        { padding: 20, gap: 14 },
  eyebrowRow:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  globeIcon:   { width: 40, height: 40, borderRadius: 13, backgroundColor: 'rgba(47,175,143,0.12)', alignItems: 'center', justifyContent: 'center' },
  eyebrow:     { fontFamily: 'Geist-SemiBold', fontSize: 11, letterSpacing: 0.5 },
  eyebrowSub:  { fontFamily: 'Geist-Regular', fontSize: 11.5, color: BRAND, marginTop: 1 },
  title:       { fontFamily: 'InstrumentSerif-Regular', fontSize: 20, lineHeight: 27 },
  features:    { gap: 8 },
  featureRow:  { flexDirection: 'row', alignItems: 'center', gap: 9 },
  featureDot:  { width: 18, height: 18, borderRadius: 6, backgroundColor: 'rgba(47,175,143,0.12)', alignItems: 'center', justifyContent: 'center' },
  featureText: { fontFamily: 'Geist-Regular', fontSize: 13 },
  btn:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 46, borderRadius: 14, backgroundColor: BRAND },
  btnText:     { fontFamily: 'Geist-SemiBold', fontSize: 14, color: '#fff' },
  hint:        { fontFamily: 'Geist-Regular', fontSize: 10.5, textAlign: 'center', lineHeight: 16 },
})

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function PlanScreen() {
  const colorScheme = useColorScheme()
  const isDark      = colorScheme === 'dark'
  const t           = tk(isDark)
  const insets      = useSafeAreaInsets()
  const router      = useRouter()

  const fade  = useRef(new Animated.Value(0)).current
  const slide = useRef(new Animated.Value(8)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade,  { toValue: 1, duration: 340, useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 340, useNativeDriver: true }),
    ]).start()
  }, [])

  const cfg = MOCK

  return (
    <View style={[s.root, { backgroundColor: t.bg }]}>

      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + 10, borderBottomColor: t.divider }]}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <IcoBack c={t.muted} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: t.text }]}>Plan y uso</Text>
        <View style={{ width: 36 }} />
      </View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        style={{ flex: 1, opacity: fade, transform: [{ translateY: slide }] }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      >

        {/* ── Hero ── */}
        <View style={[s.hero, { backgroundColor: t.surface, borderColor: t.border }]}>
          <View style={s.heroInner}>
            <View style={s.avatar}>
              <Text style={s.avatarText}>{cfg.inicial}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.heroMode, { color: t.muted }]}>
                {cfg.modo.toUpperCase()} · {cfg.rol}
              </Text>
              <Text style={[s.heroName, { color: t.text }]}>{cfg.nombre}</Text>
              <Text style={[s.heroMsg, { color: t.muted }]}>{cfg.mensaje}</Text>
            </View>
          </View>

          {/* Plan badge */}
          <View style={s.planRow}>
            <View style={s.planBadge}>
              <Text style={s.planBadgeText}>{cfg.plan}</Text>
            </View>
            <Text style={[s.planHint, { color: t.muted }]}>Plan activo</Text>
          </View>
        </View>

        {/* ── Consumo del período ── */}
        <SLabel label="Consumo del período" isDark={isDark} />
        <View style={s.statsGrid}>
          {cfg.consumo.map((item, i) => (
            <View key={i} style={[s.statCard, { backgroundColor: t.surface, borderColor: t.border }]}>
              <Text style={[s.statLabel, { color: t.muted }]}>{item.concepto.toUpperCase()}</Text>
              <View style={s.statNumRow}>
                <Text style={[s.statNum, { color: t.text }]}>{item.cantidad}</Text>
                <Text style={[s.statUnit, { color: t.muted }]}>{item.unidad}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* ── Créditos disponibles ── */}
        <SLabel label="Créditos disponibles" isDark={isDark} />
        <View style={[s.card, { backgroundColor: t.surface, borderColor: t.border }]}>
          {cfg.creditos.map((item, i) => (
            <View key={i} style={[
              s.creditRow,
              i < cfg.creditos.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.divider },
            ]}>
              <CreditBar item={item} isDark={isDark} />
            </View>
          ))}
        </View>

        {/* ── Capacidades activas ── */}
        <SLabel label="Capacidades activas" isDark={isDark} />
        <View style={[s.card, { backgroundColor: t.surface, borderColor: t.border, paddingHorizontal: 16, paddingVertical: 14 }]}>
          <View style={s.pillsWrap}>
            {cfg.capacidades.map((cap, i) => (
              <View key={i} style={s.capPill}>
                <IcoCheck c={BRAND} />
                <Text style={s.capPillText}>{cap}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Historial de cargos (solo vista) ── */}
        <SLabel label="Historial de cargos" isDark={isDark} />
        <View style={[s.card, { backgroundColor: t.surface, borderColor: t.border }]}>
          {/* Header mini */}
          <View style={[s.cargoHeaderRow, { borderBottomColor: t.divider }]}>
            <View style={s.cargoHeaderLeft}>
              <IcoReceipt c={t.muted} />
              <Text style={[s.cargoHeaderText, { color: t.muted }]}>Últimos 3 meses</Text>
            </View>
            <Text style={[s.cargoHeaderHint, { color: t.muted2 }]}>Ver completo en la web</Text>
          </View>

          {cfg.cargos.map((cargo, i) => (
            <View key={i} style={[
              s.cargoRow,
              i < cfg.cargos.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.divider },
            ]}>
              <View style={[s.cargoDot, { backgroundColor: BRAND }]} />
              <View style={{ flex: 1 }}>
                <Text style={[s.cargoConcept, { color: t.text2 }]}>{cargo.concepto}</Text>
                <Text style={[s.cargoFecha, { color: t.muted }]}>{cargo.fecha}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[s.cargoMonto, { color: t.text2 }]}>
                  ${cargo.monto.toLocaleString('es-MX')}
                </Text>
                <Text style={s.cargoPagado}>Pagado</Text>
              </View>
            </View>
          ))}

          {/* Próximo cargo estimado */}
          <View style={[s.proximoRow, { backgroundColor: isDark ? 'rgba(47,175,143,0.05)' : 'rgba(47,175,143,0.04)', borderTopColor: t.divider }]}>
            <IcoClock c={t.muted} />
            <View style={{ flex: 1 }}>
              <Text style={[s.proximoLabel, { color: t.muted }]}>PRÓXIMO CARGO ESTIMADO</Text>
              <Text style={[s.proximoDate, { color: t.text2 }]}>
                1 de marzo · <Text style={{ color: BRAND }}>~$1,840 MXN</Text>
              </Text>
            </View>
          </View>
        </View>

        {/* ── Web CTA ── */}
        <SLabel label="Gestionar plan" isDark={isDark} />
        <WebCTACard isDark={isDark} />

        {/* ── Nota legal ── */}
        <View style={[s.legalRow, { marginTop: 24 }]}>
          <IcoInfo c={t.muted3} />
          <Text style={[s.legalText, { color: t.muted3 }]}>
            <Text style={{ fontFamily: 'Geist-SemiBold', color: t.muted2 }}>GANDIA</Text>{' '}
            no autoriza ni certifica. El sistema registra y gestiona información documental. Las decisiones son responsabilidad de las autoridades competentes.
          </Text>
        </View>

      </Animated.ScrollView>
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1 },

  // Header
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  backBtn:     { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: 'Geist-SemiBold', fontSize: 16, letterSpacing: -0.2 },

  // Hero card
  hero:      { marginHorizontal: 16, marginTop: 20, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  heroInner: { flexDirection: 'row', gap: 14, padding: 16, paddingBottom: 12 },
  avatar:    { width: 44, height: 44, borderRadius: 14, backgroundColor: BRAND, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarText:{ fontFamily: 'Geist-SemiBold', fontSize: 18, color: '#fff' },
  heroMode:  { fontFamily: 'Geist-SemiBold', fontSize: 9.5, letterSpacing: 0.8, marginBottom: 4 },
  heroName:  { fontFamily: 'Geist-SemiBold', fontSize: 15.5, letterSpacing: -0.2 },
  heroMsg:   { fontFamily: 'Geist-Regular', fontSize: 11.5, marginTop: 3, lineHeight: 17 },
  planRow:   { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(0,0,0,0.06)' },
  planBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 99, backgroundColor: 'rgba(47,175,143,0.10)' },
  planBadgeText: { fontFamily: 'Geist-SemiBold', fontSize: 12, color: BRAND },
  planHint:  { fontFamily: 'Geist-Regular', fontSize: 12 },

  // Stats grid
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 16 },
  statCard:  { flex: 1, minWidth: '46%', borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, padding: 16 },
  statLabel: { fontFamily: 'Geist-SemiBold', fontSize: 9.5, letterSpacing: 0.9, marginBottom: 12 },
  statNumRow:{ flexDirection: 'row', alignItems: 'baseline', gap: 5 },
  statNum:   { fontFamily: 'Geist-SemiBold', fontSize: 30, letterSpacing: -1.5, lineHeight: 34 },
  statUnit:  { fontFamily: 'Geist-Regular', fontSize: 12 },

  // Generic card
  card:      { marginHorizontal: 16, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  creditRow: { paddingHorizontal: 16, paddingVertical: 14 },

  // Capacidades pills
  pillsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  capPill:   { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 99, backgroundColor: 'rgba(47,175,143,0.09)', borderWidth: 1, borderColor: 'rgba(47,175,143,0.18)' },
  capPillText:{ fontFamily: 'Geist-Medium', fontSize: 12, color: BRAND },

  // Cargos
  cargoHeaderRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  cargoHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  cargoHeaderText: { fontFamily: 'Geist-SemiBold', fontSize: 10.5, letterSpacing: 0.5 },
  cargoHeaderHint: { fontFamily: 'Geist-Regular', fontSize: 10.5 },
  cargoRow:        { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 13 },
  cargoDot:        { width: 7, height: 7, borderRadius: 4, flexShrink: 0 },
  cargoConcept:    { fontFamily: 'Geist-Medium', fontSize: 13 },
  cargoFecha:      { fontFamily: 'Geist-Regular', fontSize: 11, marginTop: 2 },
  cargoMonto:      { fontFamily: 'Geist-SemiBold', fontSize: 13.5 },
  cargoPagado:     { fontFamily: 'Geist-Medium', fontSize: 10, color: BRAND, marginTop: 1 },
  proximoRow:      { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderTopWidth: StyleSheet.hairlineWidth },
  proximoLabel:    { fontFamily: 'Geist-SemiBold', fontSize: 9.5, letterSpacing: 0.8, marginBottom: 3 },
  proximoDate:     { fontFamily: 'Geist-Medium', fontSize: 13 },

  // Legal
  legalRow:  { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingHorizontal: 20, marginBottom: 8 },
  legalText: { flex: 1, fontFamily: 'Geist-Regular', fontSize: 11.5, lineHeight: 18 },
})