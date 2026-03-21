// app/(app)/voz.tsx — Gandia · Voz · diseño institucional
import { useState, useRef, useEffect, useCallback } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Animated, useColorScheme, StatusBar, Modal, Pressable,
  Clipboard,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Path, Line, Polyline, Rect, Circle, Polygon } from 'react-native-svg'

// ─── Types ────────────────────────────────────────────────────────────────────
type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking'
type MicMode    = 'idle' | 'active' | 'paused'
type ArtifactCard = {
  kind:     'passport' | 'doc' | 'record'
  title:    string
  subtitle: string
  fields:   { label: string; value: string }[]
}
type Turn = {
  role:     'user' | 'gandia'
  text:     string
  ts:       string
  artifact?: ArtifactCard
}

// ─── Tokens ───────────────────────────────────────────────────────────────────
const tk = (d: boolean) => ({
  bg:        d ? '#0c0a09' : '#fafaf9',
  surface:   d ? '#141210' : '#ffffff',
  surface2:  d ? '#1c1917' : '#f2f1f0',
  border:    d ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.09)',
  divider:   d ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)',
  text:      d ? '#fafaf9' : '#1c1917',
  text2:     d ? '#d6d3d1' : '#44403c',
  muted:     d ? '#78716c' : '#a8a29e',
  muted2:    d ? '#57534e' : '#c4bfba',
  muted3:    d ? '#44403c' : '#d6d3d1',
  userBg:    d ? '#1c1917' : '#f0efee',
  userText:  d ? '#d6d3d1' : '#44403c',
  gandiaText: d ? '#e7e5e4' : '#1c1917',
  sheetBg:   d ? '#1c1917' : '#ffffff',
})

// ─── Mock conversation ────────────────────────────────────────────────────────
const MOCK_TURNS: Turn[] = [
  {
    role: 'user',
    text: '¿Cuál es el pasaporte de la vaca con RFID 724-001-839482?',
    ts:   '09:14',
  },
  {
    role:     'gandia',
    text:     'Aquí está el pasaporte de la vaca. Registrada en 2021, actualmente activa. Próxima revisión sanitaria en 45 días.',
    ts:       '09:14',
    artifact: {
      kind:     'passport',
      title:    'Pasaporte Bovino',
      subtitle: 'RFID 724-001-839482',
      fields: [
        { label: 'Nombre',       value: 'Lola #47'      },
        { label: 'Raza',         value: 'Suizo Americano' },
        { label: 'Nacimiento',   value: '12 Mar 2021'   },
        { label: 'Estado',       value: 'Activa ✓'      },
        { label: 'Propietario',  value: 'Rancho El Mirador' },
      ],
    },
  },
]

const now = () =>
  new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })

// ─── State meta ───────────────────────────────────────────────────────────────
const STATE_META: Record<VoiceState, { label: string; sub: string }> = {
  idle:       { label: 'Listo',       sub: 'Toca el micrófono para hablar'  },
  listening:  { label: 'Escuchando…', sub: 'Habla con claridad'             },
  processing: { label: 'Procesando…', sub: 'Analizando tu solicitud'        },
  speaking:   { label: 'Respondiendo', sub: 'Escucha la respuesta'          },
}

// ─── Icons ────────────────────────────────────────────────────────────────────
const si = { fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

function IcoMic({ color, size = 22 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" {...si} stroke={color} strokeWidth="1.75">
      <Path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <Path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <Line x1="12" y1="19" x2="12" y2="23" />
      <Line x1="8"  y1="23" x2="16" y2="23" />
    </Svg>
  )
}
function IcoPause({ color, size = 20 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" {...si} stroke={color} strokeWidth="2">
      <Rect x="6" y="4" width="4" height="16" />
      <Rect x="14" y="4" width="4" height="16" />
    </Svg>
  )
}
function IcoPlay({ color, size = 20 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" {...si} stroke={color} strokeWidth="2">
      <Polygon points="5 3 19 12 5 21 5 3" />
    </Svg>
  )
}
function IcoDoc({ color, size = 18 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" {...si} stroke={color} strokeWidth="1.75">
      <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <Polyline points="14 2 14 8 20 8" />
      <Line x1="9" y1="13" x2="15" y2="13" />
      <Line x1="9" y1="17" x2="13" y2="17" />
    </Svg>
  )
}
function IcoX({ color, size = 16 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" {...si} stroke={color} strokeWidth="2.2">
      <Line x1="18" y1="6"  x2="6"  y2="18" />
      <Line x1="6"  y1="6"  x2="18" y2="18" />
    </Svg>
  )
}
function IcoSpark({ color }: { color: string }) {
  return (
    <Svg width={12} height={12} viewBox="0 0 24 24" {...si} stroke={color} strokeWidth="1.5">
      <Path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </Svg>
  )
}
function IcoCopy({ color }: { color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" {...si} stroke={color} strokeWidth="1.75">
      <Rect x="9" y="9" width="13" height="13" rx="2" />
      <Path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </Svg>
  )
}
function IcoChat({ color }: { color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" {...si} stroke={color} strokeWidth="1.75">
      <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </Svg>
  )
}

// ─── Waveform bars ────────────────────────────────────────────────────────────
function LiveWaveform({ active, color }: { active: boolean; color: string }) {
  const anims = useRef(
    Array.from({ length: 20 }, () => new Animated.Value(0.15))
  ).current

  useEffect(() => {
    if (!active) {
      anims.forEach(a =>
        Animated.timing(a, { toValue: 0.15, duration: 300, useNativeDriver: false }).start()
      )
      return
    }
    const loops = anims.map((a, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(a, {
            toValue: 0.2 + Math.abs(Math.sin(i * 0.72)) * 0.8,
            duration: 400 + (i % 5) * 80,
            useNativeDriver: false,
          }),
          Animated.timing(a, {
            toValue: 0.15 + Math.random() * 0.2,
            duration: 400 + (i % 4) * 60,
            useNativeDriver: false,
          }),
        ])
      )
    )
    loops.forEach(l => l.start())
    return () => loops.forEach(l => l.stop())
  }, [active])

  return (
    <View style={wvs.wrap}>
      {anims.map((a, i) => (
        <Animated.View
          key={i}
          style={[wvs.bar, {
            backgroundColor: color,
            transform: [{ scaleY: a }],
            opacity: active ? 1 : 0.25,
          }]}
        />
      ))}
    </View>
  )
}
const wvs = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3, height: 32 },
  bar:  { width: 2.5, height: 24, borderRadius: 2 },
})

// ─── Typing dots ──────────────────────────────────────────────────────────────
function TypingDots({ color }: { color: string }) {
  const dots = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current

  useEffect(() => {
    const loops = dots.map((d, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 160),
          Animated.timing(d, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(d, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.delay(400),
        ])
      )
    )
    loops.forEach(l => l.start())
    return () => loops.forEach(l => l.stop())
  }, [])

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 4 }}>
      {dots.map((d, i) => (
        <Animated.View key={i} style={{
          width: 5, height: 5, borderRadius: 2.5,
          backgroundColor: color,
          transform: [{ translateY: d.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) }],
        }} />
      ))}
    </View>
  )
}

// ─── Status indicator (Apple-style, verde Gandía) ────────────────────────────
const BRAND = '#2FAF8F'

const STATE_LABELS: Record<VoiceState, string> = {
  idle:       '',
  listening:  'Escuchando',
  processing: 'Procesando',
  speaking:   'Respondiendo',
}

function StatusIndicator({ state, micMode, isDark }: {
  state:   VoiceState
  micMode: MicMode
  isDark:  boolean
}) {
  const t     = tk(isDark)
  const op    = useRef(new Animated.Value(0)).current
  const pulse = useRef(new Animated.Value(1)).current
  const key   = `${state}-${micMode}`

  useEffect(() => {
    op.setValue(0)
    Animated.timing(op, { toValue: 1, duration: 300, useNativeDriver: true }).start()
  }, [key])

  // Pulso suave en listening/speaking
  useEffect(() => {
    if (state === 'listening' || state === 'speaking') {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.4, duration: 900, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1,   duration: 900, useNativeDriver: true }),
        ])
      )
      loop.start()
      return () => loop.stop()
    } else {
      pulse.setValue(1)
    }
  }, [state])

  if (micMode === 'idle' && state === 'idle') return null

  const label     = micMode === 'paused' ? 'En pausa' : STATE_LABELS[state]
  const dotColor  = micMode === 'paused' ? tk(isDark).muted : BRAND
  const textColor = dotColor

  if (!label) return null

  return (
    <Animated.View style={[pi.wrap, { opacity: op }]}>
      {/* Dot con halo pulsante */}
      <View style={pi.dotWrap}>
        <Animated.View style={[
          pi.halo,
          { backgroundColor: dotColor, transform: [{ scale: pulse }], opacity: 0.22 },
        ]} />
        <View style={[pi.dot, { backgroundColor: dotColor }]} />
      </View>
      <Text style={[pi.label, { color: textColor }]}>{label}</Text>
    </Animated.View>
  )
}
const pi = StyleSheet.create({
  wrap:    { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 4 },
  dotWrap: { width: 14, height: 14, alignItems: 'center', justifyContent: 'center' },
  halo:    { position: 'absolute', width: 14, height: 14, borderRadius: 7 },
  dot:     { width: 7, height: 7, borderRadius: 3.5 },
  label:   { fontFamily: 'Geist-Medium', fontSize: 13.5, letterSpacing: -0.2 },
})

// ─── Dormant artifact card (archivos dormidos) ────────────────────────────────
function IcoPassport({ color }: { color: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none"
      strokeLinecap="round" strokeLinejoin="round" stroke={color} strokeWidth="1.75">
      <Rect x="3" y="3" width="18" height="18" rx="3" />
      <Circle cx="12" cy="10" r="3" />
      <Path d="M7 21v-1a5 5 0 0 1 10 0v1" />
    </Svg>
  )
}

function DormantCard({ card, isDark, isNew }: { card: ArtifactCard; isDark: boolean; isNew?: boolean }) {
  const t     = tk(isDark)
  const [expanded, setExpanded] = useState(false)
  const slideY = useRef(new Animated.Value(isNew ? 8 : 0)).current
  const op     = useRef(new Animated.Value(isNew ? 0 : 1)).current

  useEffect(() => {
    if (!isNew) return
    Animated.parallel([
      Animated.timing(op,     { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.spring(slideY, { toValue: 0, friction: 9, tension: 80, useNativeDriver: true }),
    ]).start()
  }, [])

  const accentColor = BRAND
  const borderColor = isDark ? 'rgba(47,175,143,0.20)' : 'rgba(47,175,143,0.25)'
  const cardBg      = isDark ? '#141210' : '#ffffff'

  return (
    <Animated.View style={{ opacity: op, transform: [{ translateY: slideY }], marginBottom: 10 }}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => setExpanded(e => !e)}
        style={[dc.card, { backgroundColor: cardBg, borderColor }]}
      >
        {/* Accent stripe */}
        <View style={[dc.stripe, { backgroundColor: accentColor }]} />

        <View style={dc.inner}>
          {/* Header row */}
          <View style={dc.headerRow}>
            <View style={[dc.iconWrap, { backgroundColor: isDark ? 'rgba(47,175,143,0.12)' : 'rgba(47,175,143,0.10)' }]}>
              <IcoPassport color={accentColor} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[dc.title, { color: t.text }]}>{card.title}</Text>
              <Text style={[dc.subtitle, { color: t.muted }]}>{card.subtitle}</Text>
            </View>
            <Text style={[dc.toggle, { color: t.muted2 }]}>{expanded ? '▲' : '▼'}</Text>
          </View>

          {/* Fields — expanded */}
          {expanded && (
            <View style={[dc.fields, { borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)' }]}>
              {card.fields.map((f, i) => (
                <View key={i} style={dc.field}>
                  <Text style={[dc.fieldLabel, { color: t.muted }]}>{f.label}</Text>
                  <Text style={[dc.fieldValue, { color: t.text }]}>{f.value}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  )
}
const dc = StyleSheet.create({
  card:       { borderRadius: 14, borderWidth: 1, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 2 },
  stripe:     { height: 3 },
  inner:      { padding: 14 },
  headerRow:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconWrap:   { width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  title:      { fontFamily: 'Geist-SemiBold', fontSize: 13, letterSpacing: -0.1 },
  subtitle:   { fontFamily: 'Geist-Regular',  fontSize: 11, marginTop: 1 },
  toggle:     { fontSize: 9 },
  fields:     { marginTop: 12, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, gap: 8 },
  field:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  fieldLabel: { fontFamily: 'Geist-Regular',  fontSize: 12, flex: 1 },
  fieldValue: { fontFamily: 'Geist-Medium',   fontSize: 12, flexShrink: 1, textAlign: 'right' },
})

// ─── Transcript entry (sin burbujas, sin avatar) ──────────────────────────────
function TurnEntry({ turn, isDark, isNew }: { turn: Turn; isNew?: boolean; isDark: boolean }) {
  const t      = tk(isDark)
  const slideY = useRef(new Animated.Value(isNew ? 10 : 0)).current
  const op     = useRef(new Animated.Value(isNew ? 0  : 1)).current

  useEffect(() => {
    if (!isNew) return
    Animated.parallel([
      Animated.timing(op,     { toValue: 1, duration: 280, useNativeDriver: true }),
      Animated.spring(slideY, { toValue: 0, friction: 9, tension: 80, useNativeDriver: true }),
    ]).start()
  }, [])

  const isUser = turn.role === 'user'

  return (
    <Animated.View
      style={[
        ts.entry,
        isUser ? ts.entryUser : ts.entryGandia,
        { opacity: op, transform: [{ translateY: slideY }] },
      ]}
    >
      <Text style={[ts.role, { color: isUser ? t.muted : '#2FAF8F' }]}>
        {isUser ? 'TÚ' : 'GANDIA'}
      </Text>

      {/* Artifact card arriba del texto de Gandia */}
      {!isUser && turn.artifact && (
        <View style={{ alignSelf: 'stretch', marginBottom: 8 }}>
          <DormantCard card={turn.artifact} isDark={isDark} isNew={isNew} />
        </View>
      )}

      <View style={[
        ts.textBlock,
        isUser
          ? [ts.textBlockUser, { backgroundColor: t.userBg }]
          : ts.textBlockGandia,
      ]}>
        <Text style={[
          ts.text,
          isUser
            ? { color: t.userText, fontFamily: 'Geist-Regular', fontSize: 14, lineHeight: 21 }
            : { color: t.gandiaText, fontFamily: 'InstrumentSerif-Italic', fontSize: 15.5, lineHeight: 24 },
        ]}>
          {turn.text}
        </Text>
      </View>
      <Text style={[ts.ts, { color: t.muted3 }, isUser && { textAlign: 'right' }]}>
        {turn.ts}
      </Text>
    </Animated.View>
  )
}
const ts = StyleSheet.create({
  entry:          { marginBottom: 20 },
  entryUser:      { alignItems: 'flex-end' },
  entryGandia:    { alignItems: 'stretch' },
  role:           { fontFamily: 'Geist-SemiBold', fontSize: 9, letterSpacing: 1.4, marginBottom: 5 },
  textBlock:      { maxWidth: '85%' },
  textBlockUser:  { borderRadius: 14, borderBottomRightRadius: 4, paddingHorizontal: 14, paddingVertical: 10 },
  textBlockGandia:{ paddingHorizontal: 0 },
  text:           { },
  ts:             { fontFamily: 'Geist-Regular', fontSize: 10, marginTop: 4, color: '#78716c' },
})

// ─── Summary sheet ────────────────────────────────────────────────────────────
function SummarySheet({ open, onClose, turns, isDark }: {
  open:    boolean
  onClose: () => void
  turns:   Turn[]
  isDark:  boolean
}) {
  const t      = tk(isDark)
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const slideY = useRef(new Animated.Value(500)).current
  const bdOp   = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (open) {
      Animated.parallel([
        Animated.spring(slideY, { toValue: 0, friction: 9, tension: 90, useNativeDriver: true }),
        Animated.timing(bdOp,   { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start()
    } else {
      Animated.parallel([
        Animated.timing(slideY, { toValue: 500, duration: 260, useNativeDriver: true }),
        Animated.timing(bdOp,   { toValue: 0,   duration: 200, useNativeDriver: true }),
      ]).start()
    }
  }, [open])

  const handleCopy = () => {
    const text = turns
      .map(turn => `${turn.role === 'gandia' ? 'Gandia' : 'Tú'}: ${turn.text}`)
      .join('\n\n')
    Clipboard.setString(text)
  }

  const handleContinue = () => {
    onClose()
    setTimeout(() => router.push('/(app)/chat' as any), 260)
  }

  if (!open) return null

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <Animated.View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.40)', opacity: bdOp }]}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
      </Animated.View>

      <Animated.View style={[sm.sheet, {
        backgroundColor: t.sheetBg,
        borderColor:     t.border,
        paddingBottom:   insets.bottom + 16,
        transform:       [{ translateY: slideY }],
      }]}>
        <View style={sm.accent} />
        <View style={[sm.handle, { backgroundColor: t.muted3 }]} />

        <View style={[sm.header, { borderBottomColor: t.divider }]}>
          <View>
            <Text style={[sm.headerTitle, { color: t.text }]}>Resumen de sesión</Text>
            <Text style={[sm.headerSub, { color: t.muted }]}>
              {turns.length} turno{turns.length !== 1 ? 's' : ''} · {turns[turns.length - 1]?.ts ?? '—'}
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={sm.closeBtn} activeOpacity={0.7}>
            <IcoX color={t.muted} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={{ maxHeight: 300 }}
          contentContainerStyle={{ padding: 20, gap: 16 }}
          showsVerticalScrollIndicator={false}
        >
          {turns.map((turn, i) => (
            <TurnEntry key={i} turn={turn} isDark={isDark} />
          ))}
        </ScrollView>

        <View style={[sm.actions, { borderTopColor: t.divider }]}>
          <TouchableOpacity
            style={[sm.btn, { backgroundColor: t.surface2 }]}
            onPress={handleCopy}
            activeOpacity={0.75}
          >
            <IcoCopy color={t.text2} />
            <Text style={[sm.btnText, { color: t.text2 }]}>Copiar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[sm.btn, { backgroundColor: '#2FAF8F' }]}
            onPress={handleContinue}
            activeOpacity={0.85}
          >
            <IcoChat color="#fff" />
            <Text style={[sm.btnText, { color: '#fff' }]}>Continuar en chat</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  )
}
const sm = StyleSheet.create({
  sheet:       { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, borderBottomWidth: 0, overflow: 'hidden' },
  accent:      { height: 3, backgroundColor: '#2FAF8F' },
  handle:      { alignSelf: 'center', width: 32, height: 4, borderRadius: 2, marginTop: 10, marginBottom: 4 },
  header:      { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  headerTitle: { fontFamily: 'Geist-SemiBold', fontSize: 14.5, letterSpacing: -0.15 },
  headerSub:   { fontFamily: 'Geist-Regular', fontSize: 11.5, marginTop: 2 },
  closeBtn:    { width: 30, height: 30, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
  actions:     { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 14, borderTopWidth: StyleSheet.hairlineWidth },
  btn:         { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, height: 44, borderRadius: 14 },
  btnText:     { fontFamily: 'Geist-Medium', fontSize: 13.5 },
})

// ─── Side button (Resumen / Salir) ────────────────────────────────────────────
function SideBtn({ onPress, label, badge, isDark, children }: {
  onPress:  () => void
  label:    string
  badge?:   string
  isDark:   boolean
  children: React.ReactNode
}) {
  const t     = tk(isDark)
  const scale = useRef(new Animated.Value(1)).current

  return (
    <Animated.View style={{ alignItems: 'center', transform: [{ scale }] }}>
      <TouchableOpacity
        style={[sb.btn, { backgroundColor: t.surface, borderColor: t.border }]}
        onPress={onPress}
        onPressIn={() =>
          Animated.spring(scale, { toValue: 0.91, useNativeDriver: true, friction: 5 }).start()
        }
        onPressOut={() =>
          Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 5 }).start()
        }
        accessibilityLabel={label}
        activeOpacity={1}
      >
        {children}
        {badge && (
          <View style={sb.badge}>
            <Text style={sb.badgeText}>{badge}</Text>
          </View>
        )}
      </TouchableOpacity>
      <Text style={[sb.label, { color: t.muted2 }]}>{label}</Text>
    </Animated.View>
  )
}
const sb = StyleSheet.create({
  btn:       { width: 48, height: 48, borderRadius: 15, borderWidth: 1, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 1 },
  badge:     { position: 'absolute', top: -4, right: -4, minWidth: 17, height: 17, backgroundColor: '#2FAF8F', borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  badgeText: { fontFamily: 'Geist-SemiBold', fontSize: 9, color: '#fff' },
  label:     { fontFamily: 'Geist-Regular', fontSize: 10.5, textAlign: 'center', marginTop: 5 },
})

// ─── Mic button central (idle / active / paused) ──────────────────────────────
function CentralMicBtn({ micMode, voiceState, onPress, isDark }: {
  micMode:    MicMode
  voiceState: VoiceState
  onPress:    () => void
  isDark:     boolean
}) {
  const t      = tk(isDark)
  const scale  = useRef(new Animated.Value(1)).current
  const glowOp = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const glow = micMode === 'active' && voiceState === 'listening'
    Animated.timing(glowOp, { toValue: glow ? 1 : 0, duration: 400, useNativeDriver: false }).start()
  }, [micMode, voiceState])

  const isProcessing = voiceState === 'processing' || voiceState === 'speaking'

  // Colores según estado
  const btnBg =
    micMode === 'idle'   ? (isDark ? '#f5f5f4' : '#1c1917')
    : micMode === 'active'  ? '#2FAF8F'
    : isDark             ? '#1c1917' : '#f0efee' // paused → muted

  const iconColor =
    micMode === 'idle'   ? (isDark ? '#1c1917' : '#fff')
    : micMode === 'active'  ? '#fff'
    : t.muted

  // Qué ícono mostrar
  const icon = micMode === 'active'
    ? <IcoPause color={iconColor} size={20} />
    : micMode === 'paused'
      ? <IcoPlay color={iconColor} size={20} />
      : <IcoMic  color={iconColor} size={22} />

  const micLabel =
    micMode === 'idle'   ? 'Iniciar'
    : micMode === 'active'  ? 'Pausar'
    : 'Reanudar'

  return (
    <View style={{ alignItems: 'center' }}>
      <Animated.View style={[
        mb.glow,
        { shadowOpacity: glowOp.interpolate({ inputRange: [0, 1], outputRange: [0, 0.5] }) },
      ]}>
        <Animated.View style={{ transform: [{ scale }] }}>
          <TouchableOpacity
            style={[mb.btn, { backgroundColor: btnBg, opacity: isProcessing ? 0.6 : 1 }]}
            onPress={onPress}
            onPressIn={() =>
              Animated.spring(scale, { toValue: 0.91, useNativeDriver: true, friction: 5 }).start()
            }
            onPressOut={() =>
              Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 5 }).start()
            }
            disabled={isProcessing}
            activeOpacity={1}
          >
            {icon}
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
      <Text style={[mb.label, { color: tk(isDark).muted2 }]}>{micLabel}</Text>
    </View>
  )
}
const mb = StyleSheet.create({
  glow:  { borderRadius: 22, shadowColor: '#2FAF8F', shadowOffset: { width: 0, height: 4 }, shadowRadius: 20, elevation: 10 },
  btn:   { width: 66, height: 66, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  label: { fontFamily: 'Geist-Regular', fontSize: 10.5, textAlign: 'center', marginTop: 5 },
})

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function VozScreen() {
  const colorScheme = useColorScheme()
  const isDark      = colorScheme === 'dark'
  const t           = tk(isDark)
  const insets      = useSafeAreaInsets()
  const router      = useRouter()

  const [voiceState, setVoiceState] = useState<VoiceState>('idle')
  const [micMode,    setMicMode]    = useState<MicMode>('idle')
  const [sheetOpen,  setSheetOpen]  = useState(false)
  const [turns,      setTurns]      = useState<Turn[]>([])
  const [showTyping, setShowTyping] = useState(false)

  const timerRef  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const scrollRef = useRef<ScrollView>(null)

  const scrollToEnd = useCallback(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80)
  }, [])

  // Demo flow
  const runDemo = useCallback(() => {
    setVoiceState('listening')
    setMicMode('active')

    timerRef.current = setTimeout(() => {
      const userTurn: Turn = { role: 'user', text: MOCK_TURNS[0].text, ts: now() }
      setTurns(prev => [...prev, userTurn])
      setVoiceState('processing')
      scrollToEnd()

      timerRef.current = setTimeout(() => {
        setVoiceState('speaking')
        setShowTyping(true)
        scrollToEnd()

        timerRef.current = setTimeout(() => {
          setShowTyping(false)
          const gandiaTurn: Turn = { ...MOCK_TURNS[1], ts: now() }
          setTurns(prev => [...prev, gandiaTurn])
          scrollToEnd()

          timerRef.current = setTimeout(() => {
            setVoiceState('idle')
            setMicMode('idle')
          }, 2800)
        }, 1800)
      }, 1800)
    }, 2400)
  }, [scrollToEnd])

  useEffect(() => {
    const t = setTimeout(runDemo, 700)
    return () => {
      clearTimeout(t)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [runDemo])

  // Mic central — 3 estados
  const handleMic = () => {
    if (timerRef.current) clearTimeout(timerRef.current)

    if (micMode === 'idle') {
      runDemo()
    } else if (micMode === 'active') {
      // Pausar
      setMicMode('paused')
      setVoiceState('idle')
      setShowTyping(false)
    } else {
      // Reanudar
      runDemo()
    }
  }

  return (
    <View style={[r.root, { backgroundColor: t.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={t.bg} />

      {/* ── Área de transcripción ── */}
      <View style={{ flex: 1, paddingTop: 8 }}>
        {turns.length === 0 && voiceState === 'idle' && micMode !== 'paused' ? (
          <View style={r.emptyState}>
            <View style={[r.emptyIcon, { backgroundColor: isDark ? '#1c1917' : '#f0efee' }]}>
              <IcoSpark color={t.muted3} />
            </View>
            <Text style={[r.emptyTitle, { color: t.text2 }]}>Gandia está lista</Text>
            <Text style={[r.emptyDesc, { color: t.muted }]}>
              Toca el micrófono para iniciar{'\n'}una conversación por voz
            </Text>
          </View>
        ) : (
          <ScrollView
            ref={scrollRef}
            style={{ flex: 1 }}
            contentContainerStyle={[r.transcript, { paddingBottom: 24 }]}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={scrollToEnd}
          >
            {/* Línea divisoria de sesión */}
            <View style={r.sessionDivider}>
              <View style={[r.divLine, { backgroundColor: t.divider }]} />
              <Text style={[r.divText, { color: t.muted3 }]}>{now()} · Sesión iniciada</Text>
              <View style={[r.divLine, { backgroundColor: t.divider }]} />
            </View>

            {turns.map((turn, i) => (
              <TurnEntry
                key={i}
                turn={turn}
                isDark={isDark}
                isNew={i === turns.length - 1 && i > 0}
              />
            ))}

            {/* Typing indicator sin avatar */}
            {showTyping && (
              <View style={{ marginBottom: 16 }}>
                <Text style={[ts.role, { color: '#2FAF8F' }]}>GANDIA</Text>
                <TypingDots color={t.muted2} />
              </View>
            )}
          </ScrollView>
        )}
      </View>

      {/* ── Bottom controls ── */}
      <View style={[r.controls, {
        backgroundColor: t.bg,
        borderTopColor:  t.divider,
        paddingBottom:   insets.bottom > 0 ? insets.bottom + 8 : 20,
      }]}>
        {/* Status + waveform */}
        <View style={r.statusArea}>
          <StatusIndicator state={voiceState} micMode={micMode} isDark={isDark} />
          <LiveWaveform
            active={micMode === 'active' && voiceState === 'listening'}
            color={BRAND}
          />
        </View>

        {/* 3 botones: Resumen | Mic | Salir */}
        <View style={r.btnRow}>
          {/* Resumen */}
          <SideBtn
            onPress={() => setSheetOpen(true)}
            label="Resumen"
            badge={turns.length > 0 ? String(turns.length) : undefined}
            isDark={isDark}
          >
            <IcoDoc color={t.text2} />
          </SideBtn>

          {/* Mic central */}
          <CentralMicBtn
            micMode={micMode}
            voiceState={voiceState}
            onPress={handleMic}
            isDark={isDark}
          />

          {/* Salir */}
          <SideBtn
            onPress={() => router.back()}
            label="Salir"
            isDark={isDark}
          >
            <IcoX color={t.text2} />
          </SideBtn>
        </View>

        <Text style={[r.footerHint, { color: t.muted3 }]}>
          GANDIA 7 · Asistente ganadero
        </Text>
      </View>

      {/* ── Summary sheet ── */}
      <SummarySheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        turns={turns.length > 0 ? turns : MOCK_TURNS.map(m => ({ ...m, ts: now() }))}
        isDark={isDark}
      />
    </View>
  )
}

// ─── Root styles ──────────────────────────────────────────────────────────────
const r = StyleSheet.create({
  root: { flex: 1 },

  // Empty state
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 40 },
  emptyIcon:  { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyTitle: { fontFamily: 'Geist-SemiBold', fontSize: 15 },
  emptyDesc:  { fontFamily: 'Geist-Regular',  fontSize: 13, textAlign: 'center', lineHeight: 20 },

  // Transcript
  transcript:     { paddingHorizontal: 20, paddingTop: 20 },
  sessionDivider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 28 },
  divLine:        { flex: 1, height: 1 },
  divText:        { fontFamily: 'Geist-Regular', fontSize: 10, letterSpacing: 0.3 },

  // Controls
  controls:   { paddingTop: 14, paddingHorizontal: 24, borderTopWidth: StyleSheet.hairlineWidth },
  statusArea: { alignItems: 'center', gap: 8, marginBottom: 18 },
  btnRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 32 },
  footerHint: { fontFamily: 'Geist-Regular', fontSize: 10, textAlign: 'center', marginTop: 14, letterSpacing: 0.5 },
})