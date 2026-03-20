// app/(app)/chat.tsx — Gandia 7 · fiel a la web
import { useState, useRef, useEffect, useCallback, ReactElement } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, KeyboardAvoidingView, Animated,
  useColorScheme, Keyboard, Modal, Pressable,
  Clipboard,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import Svg, { Path, Circle, Polyline, Line, Rect, G } from 'react-native-svg'

// ─── Types ────────────────────────────────────────────────────────────────────
type ChatMode  = 'asistente' | 'noticias' | 'investigacion'
type GenPhase  = 'logo' | 'thinking' | 'streaming' | 'idle'

type Message = {
  id:      string
  role:    'user' | 'assistant'
  content: string
  ts:      number
}

// ─── Tokens ───────────────────────────────────────────────────────────────────
const tk = (d: boolean) => ({
  bg:          d ? '#0c0a09' : '#fafaf9',
  surface:     d ? '#141210' : '#ffffff',
  surface2:    d ? '#1c1917' : '#ffffff',
  border:      d ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.10)',
  border2:     d ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.07)',
  text:        d ? '#fafaf9' : '#1c1917',
  text2:       d ? '#d6d3d1' : '#44403c',
  muted:       d ? '#78716c' : '#a8a29e',
  muted2:      d ? '#57534e' : '#c4bfba',
  inputBg:     d ? '#141210' : '#ffffff',
  placeholder: d ? '#57534e' : '#c4bfba',
})

// ─── Constantes ───────────────────────────────────────────────────────────────
const MODE_LABEL: Record<ChatMode, string> = {
  asistente:     'Asistente',
  noticias:      'Noticias',
  investigacion: 'Investigación',
}
const MODE_MODEL: Record<ChatMode, string> = {
  asistente:     'Siete 1.0',
  noticias:      'Claude',
  investigacion: 'Claude',
}
const MODE_HINT: Record<ChatMode, string> = {
  asistente:     'Siete 1.0 · Asistente de gestión ganadera',
  noticias:      'Normativa SENASICA · USDA · FDA · Precios SNIIM',
  investigacion: 'Búsqueda profunda · Fuentes verificadas · Análisis sectorial',
}
const MODE_PLACEHOLDER: Record<ChatMode, string> = {
  asistente:     'Pregunta sobre tu ganado, trámites o normativa…',
  noticias:      'Buscar y analizar noticias del sector…',
  investigacion: 'Investigar normativa, mercados o tendencias…',
}

const GREETINGS = [
  (n: string) => `¿Qué necesitas\nhoy, ${n}?`,
  (n: string) => `Hola, ${n}.\n¿Por dónde empezamos?`,
  (n: string) => `${n},\n¿en qué te ayudo?`,
  (n: string) => `Listo, ${n}.\n¿Qué resolvemos?`,
  (n: string) => `Buenas, ${n}.\n¿Qué hacemos?`,
  (n: string) => `¿Cómo puedo\nayudarte hoy, ${n}?`,
]

const QUICK_ACTIONS_BY_MODE: Record<ChatMode, { icon: string; label: string }[]> = {
  asistente: [
    { icon: 'passport', label: 'Pasaportes'  },
    { icon: 'price',    label: 'Precios'     },
    { icon: 'health',   label: 'Sanidad'     },
    { icon: 'export',   label: 'Exportación' },
  ],
  noticias: [
    { icon: 'price',    label: 'Mercados'   },
    { icon: 'health',   label: 'SENASICA'   },
    { icon: 'export',   label: 'Comercio'   },
    { icon: 'passport', label: 'Normativa'  },
  ],
  investigacion: [
    { icon: 'health',   label: 'NOM vigentes'    },
    { icon: 'export',   label: 'Tratados TLC'    },
    { icon: 'price',    label: 'Análisis precios' },
    { icon: 'passport', label: 'COFEPRIS'        },
  ],
}
const ROTATING_PHRASES = [
  '¿Qué pasa con los precios esta semana?',
  '¿Hay alertas sanitarias en mi zona?',
  '¿Cuándo vence mi próximo trámite?',
  '¿Cuáles son los nuevos requisitos de la FDA?',
  '¿Cómo afecta el clima a mi ganado?',
]
const THINKING_STEPS = [
  'Analizando tu consulta…',
  'Buscando información relevante…',
  'Revisando normativa vigente…',
  'Preparando respuesta…',
]
const MOCK: Record<string, string> = {
  passport: '**Pasaportes activos**\n\nTienes 3 pasaportes ganaderos activos:\n- Dos pendientes de validación SENASICA\n- Uno aprobado para exportación\n\n¿Quieres ver el detalle de alguno?',
  price:    '**Precios hoy en el norte**\n\nPrecio promedio: $32.50/kg en pie. Incremento del **3.2%** respecto al mes anterior según SNIIM.\n\n¿Quieres el desglose por plaza?',
  health:   '**Alertas sanitarias vigentes**\n\nAlerta activa en Sonora por brote reportado (zona de cuarentena). Durango y Chihuahua sin alertas.\n\nÚltima actualización: hace 2 horas.',
  export:   '**Requisitos FDA actualizados**\n\nNuevos requisitos vigentes desde marzo 2026. Incluyen certificación adicional de origen para exportación a EE.UU.\n\n¿Te preparo un resumen completo?',
  default:  'Entendido. Soy Siete 1.0, tu asistente de gestión ganadera. Puedo ayudarte con:\n- Pasaportes ganaderos\n- Precios de mercado\n- Alertas sanitarias SENASICA\n- Requisitos de exportación\n\n¿Por dónde empezamos?',
}

function relativeTime(ts: number) {
  const d = Math.floor((Date.now() - ts) / 1000)
  if (d < 10)   return 'ahora'
  if (d < 60)   return `hace ${d}s`
  if (d < 3600) return `hace ${Math.floor(d / 60)} min`
  return new Date(ts).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
}

// ─── SVG Icons ────────────────────────────────────────────────────────────────
const sp = { fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

function IcoClip({ color }: { color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </Svg>
  )
}
function IcoSend({ color }: { color: string }) {
  return (
    <Svg width={15} height={15} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Line x1="12" y1="19" x2="12" y2="5" />
      <Polyline points="5 12 12 5 19 12" />
    </Svg>
  )
}
function IcoStop({ color }: { color: string }) {
  return (
    <Svg width={11} height={11} viewBox="0 0 24 24" fill={color}>
      <Rect x="4" y="4" width="16" height="16" rx="2.5" />
    </Svg>
  )
}
function IcoMic({ color }: { color: string }) {
  return (
    <Svg width={15} height={15} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <Rect x="9" y="2" width="6" height="11" rx="3" />
      <Path d="M5 10a7 7 0 0 0 14 0" />
      <Line x1="12" y1="19" x2="12" y2="22" />
      <Line x1="9"  y1="22" x2="15" y2="22" />
    </Svg>
  )
}
function IcoChevDown({ color }: { color: string }) {
  return (
    <Svg width={9} height={9} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2.5" strokeLinecap="round">
      <Polyline points="6 9 12 15 18 9" />
    </Svg>
  )
}
function IcoChevUp({ color }: { color: string }) {
  return (
    <Svg width={9} height={9} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2.5" strokeLinecap="round">
      <Polyline points="18 15 12 9 6 15" />
    </Svg>
  )
}
function IcoArrow({ color }: { color: string }) {
  return (
    <Svg width={13} height={13} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <Line x1="5" y1="12" x2="19" y2="12" />
      <Polyline points="12 5 19 12 12 19" />
    </Svg>
  )
}
function IcoCopy({ color }: { color: string }) {
  return (
    <Svg width={13} height={13} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <Rect x="9" y="9" width="13" height="13" rx="2" />
      <Path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </Svg>
  )
}
function IcoCheck({ color }: { color: string }) {
  return (
    <Svg width={13} height={13} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <Polyline points="20 6 9 17 4 12" />
    </Svg>
  )
}
function IcoRefresh({ color }: { color: string }) {
  return (
    <Svg width={13} height={13} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M1 4v6h6" />
      <Path d="M3.51 15a9 9 0 1 0 .49-4" />
    </Svg>
  )
}
function IcoThumbUp({ color }: { color: string }) {
  return (
    <Svg width={13} height={13} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" />
      <Path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
    </Svg>
  )
}
function IcoThumbDown({ color }: { color: string }) {
  return (
    <Svg width={13} height={13} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z" />
      <Path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
    </Svg>
  )
}
function IcoEdit({ color }: { color: string }) {
  return (
    <Svg width={13} height={13} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </Svg>
  )
}

function ModeIcon({ mode, color, size = 13 }: { mode: ChatMode; color: string; size?: number }): ReactElement {
  const p = { ...sp, stroke: color, strokeWidth: '1.75' }
  if (mode === 'noticias') return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect {...p} x="2" y="3" width="20" height="18" rx="2" />
      <Line {...p} x1="7" y1="8" x2="17" y2="8" />
      <Line {...p} x1="7" y1="12" x2="17" y2="12" />
      <Line {...p} x1="7" y1="16" x2="12" y2="16" />
    </Svg>
  )
  if (mode === 'investigacion') return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle {...p} cx="11" cy="11" r="8" />
      <Line {...p} x1="21" y1="21" x2="16.65" y2="16.65" />
    </Svg>
  )
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path {...p} d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </Svg>
  )
}

function QuickIcon({ icon, color }: { icon: string; color: string }): ReactElement {
  const p = { ...sp, stroke: color, strokeWidth: '1.5' }
  if (icon === 'passport') return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Rect {...p} x="4" y="2" width="16" height="20" rx="2" />
      <Circle {...p} cx="12" cy="11" r="3" />
      <Path {...p} d="M9 17c0-1.66 1.34-3 3-3s3 1.34 3 3" />
    </Svg>
  )
  if (icon === 'price') return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Polyline {...p} points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <Polyline {...p} points="17 6 23 6 23 12" />
    </Svg>
  )
  if (icon === 'health') return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path {...p} d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </Svg>
  )
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Circle {...p} cx="12" cy="12" r="10" />
      <Line {...p} x1="2" y1="12" x2="22" y2="12" />
      <Path {...p} d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </Svg>
  )
}

// ─── Logo animado Gandia ──────────────────────────────────────────────────────
function GandiaLogoAnim() {
  const b = useRef(new Animated.Value(0)).current
  const m = useRef(new Animated.Value(0)).current
  const t = useRef(new Animated.Value(0)).current
  const op = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(op, { toValue: 1, duration: 200, useNativeDriver: true }).start()
    const bounce = (val: Animated.Value, delay: number) =>
      Animated.loop(Animated.sequence([
        Animated.delay(delay),
        Animated.timing(val, { toValue: -4, duration: 400, useNativeDriver: true }),
        Animated.timing(val, { toValue: 0,  duration: 400, useNativeDriver: true }),
        Animated.delay(1400),
      ]))
    bounce(b, 0).start()
    bounce(m, 200).start()
    bounce(t, 400).start()
  }, [])

  return (
    <Animated.View style={{ opacity: op, paddingVertical: 4 }}>
      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
        {/* Layer bottom */}
        <Animated.View style={{ transform: [{ translateY: b }] }}>
          <Path d="M2 17l10 5 10-5" stroke="#2FAF8F" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </Animated.View>
        {/* Layer mid */}
        <Animated.View style={{ transform: [{ translateY: m }] }}>
          <Path d="M2 12l10 5 10-5" stroke="#2FAF8F" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </Animated.View>
        {/* Layer top */}
        <Animated.View style={{ transform: [{ translateY: t }] }}>
          <Path d="M12 2L2 7l10 5 10-5-10-5z" stroke="#2FAF8F" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </Animated.View>
      </Svg>
    </Animated.View>
  )
}

// ─── Gandia Logo con capas separadas (workaround SVG animado en RN) ───────────
function GandiaLogoAnimRN() {
  const b  = useRef(new Animated.Value(0)).current
  const m  = useRef(new Animated.Value(0)).current
  const tp = useRef(new Animated.Value(0)).current
  const op = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(op, { toValue: 1, duration: 200, useNativeDriver: true }).start()
    const bounce = (val: Animated.Value, delay: number) =>
      Animated.loop(Animated.sequence([
        Animated.delay(delay),
        Animated.timing(val, { toValue: -3.5, duration: 380, useNativeDriver: true }),
        Animated.timing(val, { toValue: 0,    duration: 380, useNativeDriver: true }),
        Animated.delay(1600),
      ]))
    bounce(b,  0  ).start()
    bounce(m,  200).start()
    bounce(tp, 400).start()
  }, [])

  const sw = { stroke: '#2FAF8F', strokeWidth: '1.65', fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

  return (
    <Animated.View style={{ opacity: op, paddingVertical: 4, width: 22, height: 22 }}>
      {/* bottom layer */}
      <Animated.View style={[StyleSheet.absoluteFillObject, { transform: [{ translateY: b }] }]}>
        <Svg width={22} height={22} viewBox="0 0 24 24">
          <Path {...sw} d="M2 17l10 5 10-5" />
        </Svg>
      </Animated.View>
      {/* mid layer */}
      <Animated.View style={[StyleSheet.absoluteFillObject, { transform: [{ translateY: m }] }]}>
        <Svg width={22} height={22} viewBox="0 0 24 24">
          <Path {...sw} d="M2 12l10 5 10-5" />
        </Svg>
      </Animated.View>
      {/* top layer */}
      <Animated.View style={[StyleSheet.absoluteFillObject, { transform: [{ translateY: tp }] }]}>
        <Svg width={22} height={22} viewBox="0 0 24 24">
          <Path {...sw} d="M12 2L2 7l10 5 10-5-10-5z" />
        </Svg>
      </Animated.View>
    </Animated.View>
  )
}

// ─── Thinking block ───────────────────────────────────────────────────────────
function ThinkingBlock({ step, muted }: { step: string; muted: string }) {
  const op = useRef(new Animated.Value(0)).current
  const x  = useRef(new Animated.Value(-4)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(op, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.timing(x,  { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start()
  }, [step])

  return (
    <Animated.View style={[s.thinkRow, { opacity: op, transform: [{ translateX: x }] }]}>
      <Svg width={13} height={13} viewBox="0 0 24 24" fill="none"
        stroke="#2FAF8F" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M12 2L2 7l10 5 10-5-10-5z" />
        <Path d="M2 17l10 5 10-5" />
        <Path d="M2 12l10 5 10-5" />
      </Svg>
      <Text style={[s.thinkText, { color: muted }]}>{step}</Text>
    </Animated.View>
  )
}

// ─── Rotating phrase ──────────────────────────────────────────────────────────
function RotatingPhrase({ onSelect, color, arrowColor }: {
  onSelect: (q: string) => void; color: string; arrowColor: string
}) {
  const [idx, setIdx] = useState(0)
  const op = useRef(new Animated.Value(1)).current
  const ty = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const iv = setInterval(() => {
      Animated.parallel([
        Animated.timing(op, { toValue: 0, duration: 260, useNativeDriver: true }),
        Animated.timing(ty, { toValue: 5, duration: 260, useNativeDriver: true }),
      ]).start(() => {
        setIdx(i => (i + 1) % ROTATING_PHRASES.length)
        ty.setValue(-3)
        Animated.parallel([
          Animated.timing(op, { toValue: 1, duration: 280, useNativeDriver: true }),
          Animated.timing(ty, { toValue: 0, duration: 280, useNativeDriver: true }),
        ]).start()
      })
    }, 3200)
    return () => clearInterval(iv)
  }, [])

  return (
    <TouchableOpacity onPress={() => onSelect(ROTATING_PHRASES[idx])} activeOpacity={0.7}>
      <Animated.View style={[s.rotatingRow, { opacity: op, transform: [{ translateY: ty }] }]}>
        <Text style={[s.rotatingText, { color }]}>{ROTATING_PHRASES[idx]}</Text>
        <IcoArrow color={arrowColor} />
      </Animated.View>
    </TouchableOpacity>
  )
}

// ─── Markdown renderer ────────────────────────────────────────────────────────
function RenderContent({ text, color, color2 }: { text: string; color: string; color2: string }) {
  const lines    = text.split('\n')
  const elements: ReactElement[] = []
  let key = 0, i = 0
  while (i < lines.length) {
    const line = lines[i]
    if (!line.trim()) { elements.push(<View key={key++} style={{ height: 10 }} />); i++; continue }
    if (line.match(/^[-•]\s/)) {
      const items: string[] = []
      while (i < lines.length && lines[i].match(/^[-•]\s/)) {
        items.push(lines[i].replace(/^[-•]\s/, ''))
        i++
      }
      elements.push(
        <View key={key++} style={{ gap: 4, marginVertical: 2 }}>
          {items.map((item, ii) => (
            <View key={ii} style={s.bulletRow}>
              <View style={[s.bulletDot, { backgroundColor: '#2FAF8F' }]} />
              <Text style={[s.msgText, { color: color2 }]}>{item}</Text>
            </View>
          ))}
        </View>
      )
      continue
    }
    if (line.match(/^\*\*[^*]+\*\*$/)) {
      elements.push(
        <Text key={key++} style={[s.msgBold, { color, marginTop: key > 1 ? 12 : 0 }]}>
          {line.slice(2, -2)}
        </Text>
      )
      i++; continue
    }
    const parts = line.split(/(\*\*[^*]+\*\*)/g)
    elements.push(
      <Text key={key++} style={[s.msgText, { color: color2 }]}>
        {parts.map((p, pi) =>
          p.startsWith('**') && p.endsWith('**')
            ? <Text key={pi} style={{ color, fontFamily: 'Geist-SemiBold' }}>{p.slice(2, -2)}</Text>
            : p
        )}
      </Text>
    )
    i++
  }
  return <View style={{ gap: 2 }}>{elements}</View>
}

// ─── Mode Sheet ───────────────────────────────────────────────────────────────
function ModeSheet({ open, current, onSelect, onClose, isDark }: {
  open: boolean; current: ChatMode; onSelect: (m: ChatMode) => void
  onClose: () => void; isDark: boolean
}) {
  const t       = tk(isDark)
  const slideY  = useRef(new Animated.Value(400)).current
  const bdOp    = useRef(new Animated.Value(0)).current
  const insets  = useSafeAreaInsets()

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideY, { toValue: open ? 0 : 400, friction: 8, tension: 80, useNativeDriver: true }),
      Animated.timing(bdOp,   { toValue: open ? 1 : 0,   duration: 200, useNativeDriver: true }),
    ]).start()
  }, [open])

  const MODES: { id: ChatMode; label: string; desc: string; model: string }[] = [
    { id: 'asistente',     label: 'Asistente',     desc: 'Gestión ganadera',       model: 'Siete 1.0' },
    { id: 'noticias',      label: 'Noticias',       desc: 'Analizar el sector',     model: 'Claude'    },
    { id: 'investigacion', label: 'Investigación',  desc: 'Normativa y tendencias', model: 'Claude'    },
  ]

  if (!open) return null
  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <Animated.View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.35)', opacity: bdOp }]}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
      </Animated.View>
      <Animated.View style={[s.sheet, {
        backgroundColor: t.surface2,
        borderColor:     t.border,
        paddingBottom:   insets.bottom + 14,
        transform: [{ translateY: slideY }],
      }]}>
        <View style={[s.sheetHandle, { backgroundColor: t.muted2 }]} />
        <Text style={[s.sheetTitle, { color: t.muted }]}>Modo de conversación</Text>

        {MODES.map(m => {
          const active = current === m.id
          return (
            <TouchableOpacity
              key={m.id}
              style={[s.sheetOption, {
                backgroundColor: active
                  ? (isDark ? 'rgba(47,175,143,0.10)' : 'rgba(47,175,143,0.07)')
                  : 'transparent',
                borderColor: active ? 'rgba(47,175,143,0.22)' : t.border2,
              }]}
              onPress={() => { onSelect(m.id); onClose() }}
              activeOpacity={0.7}
            >
              <View style={[s.sheetIconBox, {
                backgroundColor: active
                  ? 'rgba(47,175,143,0.12)'
                  : (isDark ? 'rgba(255,255,255,0.05)' : '#f5f4f3'),
              }]}>
                <ModeIcon mode={m.id} color={active ? '#2FAF8F' : t.muted} size={16} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.sheetOptionLabel, { color: active ? '#2FAF8F' : t.text }]}>{m.label}</Text>
                <Text style={[s.sheetOptionDesc, { color: t.muted }]}>{m.desc}</Text>
              </View>
              {/* Model badge en el sheet */}
              <View style={[s.sheetModelBadge, {
                backgroundColor: active ? 'rgba(47,175,143,0.10)' : (isDark ? 'rgba(255,255,255,0.05)' : '#f0efee'),
                borderColor: active ? 'rgba(47,175,143,0.20)' : t.border2,
              }]}>
                <Text style={[s.sheetModelText, { color: active ? '#2FAF8F' : t.muted }]}>{m.model}</Text>
              </View>
            </TouchableOpacity>
          )
        })}
      </Animated.View>
    </Modal>
  )
}

// ─── Action button ────────────────────────────────────────────────────────────
function ActionBtn({ onPress, children }: { onPress: () => void; children: ReactElement }) {
  return (
    <TouchableOpacity onPress={onPress} style={s.actionBtn} activeOpacity={0.6}>
      {children}
    </TouchableOpacity>
  )
}

// ─── Main Chat ────────────────────────────────────────────────────────────────
export default function ChatScreen() {
  const colorScheme = useColorScheme()
  const isDark      = colorScheme === 'dark'
  const t           = tk(isDark)
  const insets      = useSafeAreaInsets()
  const router      = useRouter()
  const scrollRef   = useRef<ScrollView>(null)
  const inputRef    = useRef<TextInput>(null)
  const stopRef     = useRef(false)

  const [messages,     setMessages]     = useState<Message[]>([])
  const [input,        setInput]        = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [genPhase,     setGenPhase]     = useState<GenPhase>('idle')
  const [thinkStep,    setThinkStep]    = useState('')
  const [mode,         setMode]         = useState<ChatMode>('asistente')
  const [modeOpen,     setModeOpen]     = useState(false)
  const [copiedId,     setCopiedId]     = useState<string | null>(null)
  const [greeting]                      = useState(() => GREETINGS[Math.floor(Math.random() * GREETINGS.length)])

  const isActiveMode = mode !== 'asistente'
  const canSend      = input.trim().length > 0
  const headerOffset = insets.top + 56

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80)
  }, [messages, genPhase])

  const simulateReply = useCallback(async (userText: string, mockKey?: string) => {
    const replyText = MOCK[mockKey ?? 'default']
    const botId     = `bot-${Date.now()}`
    stopRef.current = false

    // 1. Logo animado
    setIsGenerating(true)
    setGenPhase('logo')
    await new Promise(r => setTimeout(r, 900))
    if (stopRef.current) { setIsGenerating(false); setGenPhase('idle'); return }

    // 2. Thinking steps
    setGenPhase('thinking')
    for (const step of THINKING_STEPS) {
      if (stopRef.current) break
      setThinkStep(step)
      await new Promise(r => setTimeout(r, 520))
    }
    if (stopRef.current) { setIsGenerating(false); setGenPhase('idle'); return }

    // 3. Streaming
    setGenPhase('streaming')
    let acc = ''
    for (const char of replyText) {
      if (stopRef.current) break
      acc += char
      setMessages(prev => {
        const exists = prev.find(m => m.id === botId)
        if (exists) return prev.map(m => m.id === botId ? { ...m, content: acc } : m)
        return [...prev, { id: botId, role: 'assistant', content: acc, ts: Date.now() }]
      })
      await new Promise(r => setTimeout(r, 13))
    }

    setIsGenerating(false)
    setGenPhase('idle')
  }, [])

  const handleSend = useCallback(() => {
    const text = input.trim()
    if (!text || isGenerating) return
    setInput('')
    Keyboard.dismiss()
    setMessages(prev => [...prev, { id: `u-${Date.now()}`, role: 'user', content: text, ts: Date.now() }])
    simulateReply(text)
  }, [input, isGenerating, simulateReply])

  const handleQuick = (action: { icon: string; label: string }) => {
    setMessages([{ id: `u-${Date.now()}`, role: 'user', content: action.label, ts: Date.now() }])
    simulateReply(action.label, action.icon)
  }

  const handleStop = () => { stopRef.current = true; setIsGenerating(false); setGenPhase('idle') }
  const handleNew  = () => { if (isGenerating) handleStop(); setMessages([]); setInput('') }
  const handleModeChange = (m: ChatMode) => setMode(m)

  const handleCopy = (text: string, id: string) => {
    Clipboard.setString(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleRegenerate = useCallback((idx: number) => {
    const prevMsgs   = messages.slice(0, idx)
    const lastUser   = [...prevMsgs].reverse().find(m => m.role === 'user')
    if (!lastUser) return
    setMessages(prevMsgs)
    simulateReply(lastUser.content)
  }, [messages, simulateReply])

  return (
    <View style={[s.root, { backgroundColor: t.bg }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior="padding"
        keyboardVerticalOffset={headerOffset}
      >
        {/* ── Messages ── */}
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={[s.scrollContent, messages.length === 0 && s.scrollCenter]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Empty state */}
          {messages.length === 0 && (
            <View style={s.empty}>
              <Text style={[s.emptyTitle, { color: t.text }]}>{greeting('Fernando')}</Text>
              <View style={s.phraseWrap}>
                <RotatingPhrase onSelect={q => { setInput(q); setTimeout(() => inputRef.current?.focus(), 60) }} color={t.muted} arrowColor={t.muted2} />
              </View>
              <View style={s.pillsRow}>
                {QUICK_ACTIONS_BY_MODE[mode].map(qa => (
                  <TouchableOpacity
                    key={qa.icon}
                    style={[s.pill, { backgroundColor: t.surface, borderColor: t.border }]}
                    onPress={() => handleQuick(qa)}
                    activeOpacity={0.75}
                  >
                    <QuickIcon icon={qa.icon} color={t.muted2} />
                    <Text style={[s.pillText, { color: t.muted }]}>{qa.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Messages */}
          {messages.map((msg, i) => {
            const isUser = msg.role === 'user'
            const isLast = i === messages.length - 1
            const copyId = `msg-${msg.ts}`
            return (
              <View key={msg.id} style={[s.msgWrap, isUser ? s.msgUser : s.msgBot]}>
                {isUser ? (
                  <View style={[s.bubbleUser, { backgroundColor: t.surface2, borderColor: t.border }]}>
                    <Text style={[s.msgText, { color: t.text }]}>{msg.content}</Text>
                  </View>
                ) : (
                  <View style={s.bubbleBot}>
                    <RenderContent
                      text={msg.content + (genPhase === 'streaming' && isLast ? '▍' : '')}
                      color={t.text}
                      color2={t.text2}
                    />
                  </View>
                )}

                {/* Acciones — solo cuando no está generando este mensaje */}
                {!(isGenerating && isLast) && (
                  <View style={[s.actionsRow, isUser ? { alignSelf: 'flex-end' } : { alignSelf: 'flex-start' }]}>
                    <Text style={[s.ts, { color: t.muted2 }]}>{relativeTime(msg.ts)}</Text>

                    {isUser ? (
                      <>
                        <ActionBtn onPress={() => setInput(msg.content)}>
                          <IcoEdit color={t.muted2} />
                        </ActionBtn>
                        <ActionBtn onPress={() => handleCopy(msg.content, copyId)}>
                          {copiedId === copyId
                            ? <IcoCheck color="#2FAF8F" />
                            : <IcoCopy color={t.muted2} />}
                        </ActionBtn>
                      </>
                    ) : (
                      <>
                        <ActionBtn onPress={() => handleRegenerate(i)}>
                          <IcoRefresh color={t.muted2} />
                        </ActionBtn>
                        <ActionBtn onPress={() => handleCopy(msg.content, copyId)}>
                          {copiedId === copyId
                            ? <IcoCheck color="#2FAF8F" />
                            : <IcoCopy color={t.muted2} />}
                        </ActionBtn>
                        <View style={[s.actionsDivider, { backgroundColor: t.border }]} />
                        <ActionBtn onPress={() => {}}>
                          <IcoThumbUp color={t.muted2} />
                        </ActionBtn>
                        <ActionBtn onPress={() => {}}>
                          <IcoThumbDown color={t.muted2} />
                        </ActionBtn>
                      </>
                    )}
                  </View>
                )}
              </View>
            )
          })}

          {/* Generando: logo → thinking → streaming en mensajes existentes */}
          {isGenerating && genPhase !== 'streaming' && (
            <View style={[s.msgWrap, s.msgBot]}>
              {genPhase === 'logo' && <GandiaLogoAnimRN />}
              {genPhase === 'thinking' && <ThinkingBlock step={thinkStep} muted={t.muted} />}
            </View>
          )}

        </ScrollView>

        {/* ── Input ── */}
        <View style={[s.inputArea, { paddingBottom: insets.bottom > 0 ? insets.bottom : 12 }]}>
          <View style={[s.inputCard, { backgroundColor: t.inputBg, borderColor: t.border }]}>
            <TextInput
              ref={inputRef}
              style={[s.input, { color: t.text }]}
              placeholderTextColor={t.placeholder}
              placeholder={MODE_PLACEHOLDER[mode]}
              value={input}
              onChangeText={v => setInput(v.slice(0, 4000))}
              multiline
              editable={!isGenerating}
            />
            {input.length > 3200 && (
              <Text style={[s.charCount, { color: input.length >= 4000 ? '#ef4444' : t.muted }]}>
                {input.length}/4000
              </Text>
            )}
            <View style={s.inputRow}>
              {/* Left — clip + sep + mode pill (con modelo integrado) */}
              <View style={s.inputLeft}>
                <TouchableOpacity style={s.iconBtn} activeOpacity={0.7}>
                  <IcoClip color={t.muted} />
                </TouchableOpacity>
                <View style={[s.divider, { backgroundColor: t.border }]} />
                <TouchableOpacity
                  style={[s.modePill, {
                    backgroundColor: isActiveMode
                      ? 'rgba(47,175,143,0.10)'
                      : (isDark ? 'rgba(255,255,255,0.05)' : '#f5f4f3'),
                    borderColor: isActiveMode ? 'rgba(47,175,143,0.22)' : t.border2,
                  }]}
                  onPress={() => setModeOpen(true)}
                  activeOpacity={0.7}
                >
                  <ModeIcon mode={mode} color={isActiveMode ? '#2FAF8F' : t.muted} size={12} />
                  <Text style={[s.modePillText, { color: isActiveMode ? '#2FAF8F' : t.muted }]}>
                    {MODE_LABEL[mode]}
                  </Text>
                  {modeOpen
                    ? <IcoChevUp   color={isActiveMode ? '#2FAF8F' : t.muted} />
                    : <IcoChevDown color={isActiveMode ? '#2FAF8F' : t.muted} />
                  }
                </TouchableOpacity>
              </View>

              {/* Right — new + mic + send */}
              <View style={s.inputRight}>
                {messages.length > 0 && !isGenerating && (
                  <TouchableOpacity onPress={handleNew} style={s.iconBtn} activeOpacity={0.7}>
                    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none"
                      stroke={t.muted} strokeWidth="1.75" strokeLinecap="round">
                      <Line x1="12" y1="5" x2="12" y2="19" />
                      <Line x1="5"  y1="12" x2="19" y2="12" />
                    </Svg>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={s.iconBtn}
                  onPress={() => router.push('/(app)/voz' as any)}
                  activeOpacity={0.7}
                >
                  <IcoMic color={t.muted} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={isGenerating ? handleStop : handleSend}
                  disabled={!isGenerating && !canSend}
                  style={[s.sendBtn, {
                    backgroundColor: isGenerating
                      ? (isDark ? '#e7e5e4' : '#1c1917')
                      : canSend
                      ? '#2FAF8F'
                      : (isDark ? '#1c1917' : '#ebe9e7'),
                  }]}
                  activeOpacity={0.8}
                >
                  {isGenerating
                    ? <IcoStop color={isDark ? '#1c1917' : '#fff'} />
                    : <IcoSend color={canSend ? '#fff' : (isDark ? '#3c3836' : '#c4bfba')} />
                  }
                </TouchableOpacity>
              </View>
            </View>
          </View>
          <Text style={[s.hint, { color: isDark ? '#44403c' : '#d6d3d1' }]}>
            {MODE_HINT[mode]}
          </Text>
        </View>
      </KeyboardAvoidingView>

      <ModeSheet
        open={modeOpen}
        current={mode}
        onSelect={handleModeChange}
        onClose={() => setModeOpen(false)}
        isDark={isDark}
      />
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  scrollCenter:  { flexGrow: 1, justifyContent: 'center' },

  empty:        { alignItems: 'center', paddingHorizontal: 8 },
  emptyTitle:   { fontFamily: 'InstrumentSerif-Italic', fontSize: 36, lineHeight: 44, textAlign: 'center', letterSpacing: -0.5, marginBottom: 16 },
  phraseWrap:   { marginBottom: 28, minHeight: 30 },
  rotatingRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center' },
  rotatingText: { fontFamily: 'InstrumentSerif-Italic', fontSize: 16, lineHeight: 22, textAlign: 'center' },

  pillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  pill:     { flexDirection: 'row', alignItems: 'center', gap: 6, height: 34, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 },
  pillText: { fontFamily: 'Geist-Medium', fontSize: 12 },

  msgWrap: { marginBottom: 20 },
  msgUser: { alignItems: 'flex-end' },
  msgBot:  { alignItems: 'flex-start' },

  bubbleUser: { maxWidth: '80%', borderRadius: 18, borderBottomRightRadius: 5, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 11, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  bubbleBot:  { maxWidth: '92%' },

  msgText: { fontFamily: 'Geist-Regular', fontSize: 14, lineHeight: 24 },
  msgBold: { fontFamily: 'Geist-SemiBold', fontSize: 14, lineHeight: 22 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  bulletDot: { width: 5, height: 5, borderRadius: 3, marginTop: 9, opacity: 0.7 },

  // Actions
  actionsRow:    { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 6, paddingHorizontal: 2 },
  ts:            { fontFamily: 'Geist-Regular', fontSize: 10, marginRight: 4 },
  actionBtn:     { width: 24, height: 24, alignItems: 'center', justifyContent: 'center', borderRadius: 6 },
  actionsDivider:{ width: 1, height: 12, marginHorizontal: 2 },

  // Thinking
  thinkRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  thinkText: { fontFamily: 'InstrumentSerif-Italic', fontSize: 13 },

  inputArea: { paddingTop: 8, paddingHorizontal: 14 },
  inputCard:  { borderRadius: 18, borderWidth: 1, marginBottom: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 },
  input:      { fontFamily: 'Geist-Regular', fontSize: 14, lineHeight: 22, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4, minHeight: 50, maxHeight: 140 },
  charCount:  { fontFamily: 'Geist-Regular', fontSize: 10, textAlign: 'right', paddingHorizontal: 14, paddingBottom: 2 },

  inputRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10, paddingBottom: 10, paddingTop: 2, gap: 6 },
  inputLeft:  { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 },
  inputRight: { flexDirection: 'row', alignItems: 'center', gap: 5 },

  divider:   { width: 1, height: 16, marginHorizontal: 2 },
  iconBtn:   { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },

  modePill:      { flexDirection: 'row', alignItems: 'center', gap: 4, height: 28, paddingHorizontal: 10, borderRadius: 999, borderWidth: 1, minWidth: 0, flexShrink: 1 },
  modePillText:  { fontFamily: 'Geist-Medium', fontSize: 11 },
  modePillModel: { fontFamily: 'Geist-Regular', fontSize: 10, flexShrink: 1 },

  sendBtn: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  hint:    { fontFamily: 'Geist-Regular', fontSize: 10, textAlign: 'center', letterSpacing: 0.2 },

  sheet:           { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopLeftRadius: 22, borderTopRightRadius: 22, borderWidth: 1, borderBottomWidth: 0, paddingHorizontal: 16, paddingTop: 12, gap: 8 },
  sheetHandle:     { alignSelf: 'center', width: 36, height: 4, borderRadius: 2, marginBottom: 6 },
  sheetTitle:      { fontFamily: 'Geist-SemiBold', fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 2 },
  sheetOption:     { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 14, borderWidth: 1 },
  sheetIconBox:    { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  sheetOptionLabel:{ fontFamily: 'Geist-SemiBold', fontSize: 14 },
  sheetOptionDesc: { fontFamily: 'Geist-Regular',  fontSize: 11, marginTop: 2 },
  sheetModelBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  sheetModelText:  { fontFamily: 'Geist-Medium', fontSize: 10 },
})