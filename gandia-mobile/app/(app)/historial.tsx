// app/(app)/historial.tsx — Gandia 7 · versión React Native
import { useState, useRef, useEffect, useCallback } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Animated, useColorScheme,
  StatusBar, ActivityIndicator, Alert, Modal, Pressable,
  KeyboardAvoidingView, Platform,
} from 'react-native'
import { BlurView } from 'expo-blur'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Path, Circle, Line, Polyline, Rect, G } from 'react-native-svg'

// ─── Types ────────────────────────────────────────────────────────────────────
type ViewMode  = 'list' | 'cards'
type FilterKey = 'todos' | 'asistente' | 'noticias' | 'investigacion'
type ChatMode  = 'asistente' | 'noticias' | 'investigacion'

type Conversation = {
  id:              string
  title:           string
  mode:            ChatMode
  message_count:   number
  is_pinned:       boolean
  created_at:      string
  last_message_at: string | null
}

// ─── Tokens ───────────────────────────────────────────────────────────────────
const tk = (d: boolean) => ({
  bg:       d ? '#0c0a09' : '#fafaf9',
  surface:  d ? '#141210' : '#ffffff',
  surface2: d ? '#1c1917' : '#ffffff',
  border:   d ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.10)',
  border2:  d ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.07)',
  divider:  d ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)',
  text:     d ? '#fafaf9' : '#1c1917',
  text2:    d ? '#d6d3d1' : '#44403c',
  muted:    d ? '#78716c' : '#a8a29e',
  muted2:   d ? '#57534e' : '#c4bfba',
  muted3:   d ? '#44403c' : '#d6d3d1',
  inputBg:  d ? '#1c1917' : '#ffffff',
  placeholder: d ? '#57534e' : '#c4bfba',
  skBase:   d ? '#1c1917' : '#f0efee',
  skShine:  d ? '#262220' : '#e8e7e5',
  sheetBg:  d ? '#1c1917' : '#ffffff',
})

// ─── Constants ────────────────────────────────────────────────────────────────
const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'todos',         label: 'Todos'         },
  { key: 'asistente',     label: 'Asistente'     },
  { key: 'noticias',      label: 'Noticias'      },
  { key: 'investigacion', label: 'Investigación' },
]

const MODE_COLOR: Record<ChatMode, string> = {
  asistente:     '#2FAF8F',
  noticias:      '#60a5fa',
  investigacion: '#a78bfa',
}
const MODE_LABEL: Record<ChatMode, string> = {
  asistente:     'Asistente',
  noticias:      'Noticias',
  investigacion: 'Investigación',
}
const GROUP_ORDER = ['Fijadas', 'Hoy', 'Ayer', 'Esta semana', 'Este mes', 'Antes']

// ─── Helpers ──────────────────────────────────────────────────────────────────
function dateGroup(dateStr: string): string {
  const date = new Date(dateStr)
  const now  = new Date()
  const diff = Math.floor((now.getTime() - date.getTime()) / 86_400_000)
  if (diff === 0) return 'Hoy'
  if (diff === 1) return 'Ayer'
  if (diff <= 7)  return 'Esta semana'
  if (diff <= 30) return 'Este mes'
  return 'Antes'
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now  = new Date()
  const diff = Math.floor((now.getTime() - date.getTime()) / 86_400_000)
  const time = date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
  if (diff === 0) return `Hoy, ${time}`
  if (diff === 1) return `Ayer, ${time}`
  return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

// ─── Mock data (TODO: reemplazar con chatService.listConversations) ─────────
const MOCK_CONVERSATIONS: Conversation[] = [
  { id: '1', title: 'Requisitos FDA para exportación de carne bovina a EE.UU.', mode: 'investigacion', message_count: 12, is_pinned: true,  created_at: new Date(Date.now() - 86400000 * 0).toISOString(), last_message_at: new Date(Date.now() - 3600000).toISOString() },
  { id: '2', title: 'Precios del ganado en el norte esta semana',               mode: 'noticias',      message_count: 5,  is_pinned: false, created_at: new Date(Date.now() - 86400000 * 0).toISOString(), last_message_at: new Date(Date.now() - 7200000).toISOString() },
  { id: '3', title: 'Trámite de pasaporte ganadero para lote #4',               mode: 'asistente',     message_count: 8,  is_pinned: false, created_at: new Date(Date.now() - 86400000 * 1).toISOString(), last_message_at: new Date(Date.now() - 86400000).toISOString() },
  { id: '4', title: 'Alerta sanitaria en Sonora — brote confirmado',            mode: 'noticias',      message_count: 3,  is_pinned: false, created_at: new Date(Date.now() - 86400000 * 2).toISOString(), last_message_at: null },
  { id: '5', title: 'Normativa SENASICA actualizada para 2026',                 mode: 'investigacion', message_count: 20, is_pinned: false, created_at: new Date(Date.now() - 86400000 * 5).toISOString(), last_message_at: null },
  { id: '6', title: 'Consulta sobre certificado de origen',                     mode: 'asistente',     message_count: 6,  is_pinned: false, created_at: new Date(Date.now() - 86400000 * 10).toISOString(), last_message_at: null },
]

// ─── SVG Icons ────────────────────────────────────────────────────────────────
const sp = { fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

function IcoSearch({ color }: { color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <Circle cx="11" cy="11" r="7.5" />
      <Line x1="20.5" y1="20.5" x2="16.1" y2="16.1" />
    </Svg>
  )
}
function IcoList({ color }: { color: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="1.75" strokeLinecap="round">
      <Line x1="8" y1="6"  x2="21" y2="6"  />
      <Line x1="8" y1="12" x2="21" y2="12" />
      <Line x1="8" y1="18" x2="21" y2="18" />
      <Line x1="3" y1="6"  x2="3.01" y2="6"  />
      <Line x1="3" y1="12" x2="3.01" y2="12" />
      <Line x1="3" y1="18" x2="3.01" y2="18" />
    </Svg>
  )
}
function IcoCards({ color }: { color: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <Rect x="2" y="3" width="20" height="8" rx="2" />
      <Rect x="2" y="13" width="20" height="8" rx="2" />
    </Svg>
  )
}
function IcoPlus({ color }: { color: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="1.75" strokeLinecap="round">
      <Line x1="12" y1="5"  x2="12" y2="19" />
      <Line x1="5"  y1="12" x2="19" y2="12" />
    </Svg>
  )
}
function IcoArrowRight({ color }: { color: string }) {
  return (
    <Svg width={13} height={13} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <Line x1="5" y1="12" x2="19" y2="12" />
      <Polyline points="12 5 19 12 12 19" />
    </Svg>
  )
}
function IcoSpark({ color }: { color: string }) {
  return (
    <Svg width={11} height={11} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="1.5" strokeLinecap="round">
      <Path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </Svg>
  )
}
function IcoMsg({ color }: { color: string }) {
  return (
    <Svg width={11} height={11} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </Svg>
  )
}
function IcoX({ color }: { color: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2" strokeLinecap="round">
      <Line x1="18" y1="6"  x2="6"  y2="18" />
      <Line x1="6"  y1="6"  x2="18" y2="18" />
    </Svg>
  )
}
function IcoPin({ color }: { color: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <Line x1="12" y1="17" x2="12" y2="22" />
      <Path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17z" />
    </Svg>
  )
}
function IcoTrash({ color }: { color: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <Polyline points="3 6 5 6 21 6" />
      <Path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <Path d="M10 11v6" />
      <Path d="M14 11v6" />
      <Path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </Svg>
  )
}
function IcoArchive({ color }: { color: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <Polyline points="21 8 21 21 3 21 3 8" />
      <Rect x="1" y="3" width="22" height="5" />
      <Line x1="10" y1="12" x2="14" y2="12" />
    </Svg>
  )
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, isDark }: { msg: string; isDark: boolean }) {
  const op = useRef(new Animated.Value(0)).current
  const ty = useRef(new Animated.Value(6)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(op, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.timing(ty, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start()
  }, [])

  return (
    <Animated.View style={[s.toast, { opacity: op, transform: [{ translateY: ty }],
      backgroundColor: isDark ? '#f5f5f4' : '#1c1917',
    }]}>
      <Text style={[s.toastText, { color: isDark ? '#1c1917' : '#fafaf9' }]}>{msg}</Text>
    </Animated.View>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function SkeletonRow({ isDark }: { isDark: boolean }) {
  const t    = tk(isDark)
  const anim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 900, useNativeDriver: false }),
        Animated.timing(anim, { toValue: 0, duration: 900, useNativeDriver: false }),
      ])
    ).start()
  }, [])

  const bg = anim.interpolate({ inputRange: [0, 1], outputRange: [t.skBase, t.skShine] })

  return (
    <View style={[s.skRow, { borderBottomColor: t.divider }]}>
      <View style={{ flex: 1, gap: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Animated.View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: bg }} />
          <Animated.View style={{ height: 10, width: 64, borderRadius: 5, backgroundColor: bg }} />
        </View>
        <Animated.View style={{ height: 14, width: '72%', borderRadius: 5, backgroundColor: bg }} />
        <Animated.View style={{ height: 11, width: '90%', borderRadius: 5, backgroundColor: bg }} />
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 2 }}>
          <Animated.View style={{ height: 10, width: 28, borderRadius: 5, backgroundColor: bg }} />
          <Animated.View style={{ height: 10, width: 80, borderRadius: 5, backgroundColor: bg }} />
        </View>
      </View>
    </View>
  )
}

function SkeletonCard({ isDark }: { isDark: boolean }) {
  const t    = tk(isDark)
  const anim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 900, useNativeDriver: false }),
        Animated.timing(anim, { toValue: 0, duration: 900, useNativeDriver: false }),
      ])
    ).start()
  }, [])

  const bg = anim.interpolate({ inputRange: [0, 1], outputRange: [t.skBase, t.skShine] })

  return (
    <View style={[s.gridCard, { backgroundColor: t.surface, borderColor: t.border2 }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Animated.View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: bg }} />
        <Animated.View style={{ height: 10, width: 64, borderRadius: 5, backgroundColor: bg }} />
      </View>
      <Animated.View style={{ height: 13, width: '80%', borderRadius: 5, backgroundColor: bg, marginTop: 8 }} />
      <View style={{ gap: 5, marginTop: 8 }}>
        <Animated.View style={{ height: 10, width: '100%', borderRadius: 5, backgroundColor: bg }} />
        <Animated.View style={{ height: 10, width: '100%', borderRadius: 5, backgroundColor: bg }} />
        <Animated.View style={{ height: 10, width: '60%',  borderRadius: 5, backgroundColor: bg }} />
      </View>
      <View style={[s.gridFooter, { borderTopColor: t.divider, marginTop: 12 }]}>
        <Animated.View style={{ height: 10, width: 80, borderRadius: 5, backgroundColor: bg }} />
        <Animated.View style={{ height: 10, width: 32, borderRadius: 5, backgroundColor: bg }} />
      </View>
    </View>
  )
}

// ─── Conversation Row (list view) ─────────────────────────────────────────────
function ConvRow({ conv, onOpen, onMenu, isDark }: {
  conv:    Conversation
  onOpen:  (id: string) => void
  onMenu:  (conv: Conversation) => void
  isDark:  boolean
}) {
  const t = tk(isDark)
  const scale = useRef(new Animated.Value(1)).current

  const press   = () => Animated.spring(scale, { toValue: 0.985, useNativeDriver: true, friction: 6 }).start()
  const release = () => Animated.spring(scale, { toValue: 1,     useNativeDriver: true, friction: 6 }).start()

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        style={[s.listRow, { borderBottomColor: t.divider }]}
        onPress={() => onOpen(conv.id)}
        onLongPress={() => onMenu(conv)}
        onPressIn={press}
        onPressOut={release}
        activeOpacity={1}
      >
        {/* Left content */}
        <View style={{ flex: 1, minWidth: 0 }}>
          {/* Mode badge */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 5 }}>
            <View style={[s.modeDot, { backgroundColor: MODE_COLOR[conv.mode] }]} />
            <Text style={[s.modeLabel, { color: t.muted }]}>{MODE_LABEL[conv.mode].toUpperCase()}</Text>
            {conv.is_pinned && (
              <Text style={[s.modeLabel, { color: '#2FAF8F' }]}>· Fijada</Text>
            )}
          </View>

          {/* Title */}
          <Text style={[s.rowTitle, { color: t.text2 }]} numberOfLines={2}>
            {conv.title}
          </Text>

          {/* Meta */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <IcoMsg color={t.muted3} />
              <Text style={[s.metaText, { color: t.muted3 }]}>{conv.message_count}</Text>
            </View>
            <Text style={{ color: t.muted3, fontSize: 10 }}>·</Text>
            <Text style={[s.metaText, { color: t.muted }]}>
              {formatDate(conv.last_message_at ?? conv.created_at)}
            </Text>
          </View>
        </View>

        {/* Dots button */}
        <TouchableOpacity
          style={s.dotsBtn}
          onPress={() => onMenu(conv)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={[s.dotsText, { color: t.muted }]}>⋯</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  )
}

// ─── Conversation Card (cards view — 1 columna con acento de color) ───────────
function ConvCard({ conv, onMenu, isDark }: {
  conv:    Conversation
  onMenu:  (conv: Conversation) => void
  isDark:  boolean
}) {
  const t     = tk(isDark)
  const scale = useRef(new Animated.Value(1)).current
  const press   = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, friction: 6 }).start()
  const release = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: true, friction: 6 }).start()

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        style={[s.compactCard, { backgroundColor: t.surface, borderColor: t.border2 }]}
        onPress={() => {}}
        onLongPress={() => onMenu(conv)}
        onPressIn={press}
        onPressOut={release}
        activeOpacity={1}
      >
        {/* Barra de color lateral */}
        <View style={[s.compactAccent, { backgroundColor: MODE_COLOR[conv.mode] }]} />

        <View style={{ flex: 1, paddingLeft: 14 }}>
          {/* Top: mode + dots */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={[s.modeLabel, { color: MODE_COLOR[conv.mode] }]}>
                {MODE_LABEL[conv.mode].toUpperCase()}
              </Text>
              {conv.is_pinned && (
                <Text style={[s.modeLabel, { color: t.muted2 }]}>· Fijada</Text>
              )}
            </View>
            <TouchableOpacity
              style={s.dotsBtn}
              onPress={() => onMenu(conv)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={[s.dotsText, { color: t.muted }]}>⋯</Text>
            </TouchableOpacity>
          </View>

          {/* Title */}
          <Text style={[s.cardTitle, { color: t.text2 }]} numberOfLines={2}>
            {conv.title}
          </Text>

          {/* Meta */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
              <IcoMsg color={t.muted3} />
              <Text style={[s.metaText, { color: t.muted3 }]}>{conv.message_count}</Text>
            </View>
            <Text style={{ color: t.muted3, fontSize: 10 }}>·</Text>
            <Text style={[s.metaText, { color: t.muted }]}>
              {formatDate(conv.last_message_at ?? conv.created_at)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  )
}

// ─── Action Bottom Sheet ──────────────────────────────────────────────────────
function ActionSheet({ conv, onClose, onOpen, onPin, onArchive, onDelete, isDark }: {
  conv:      Conversation | null
  onClose:   () => void
  onOpen:    (id: string) => void
  onPin:     (conv: Conversation) => void
  onArchive: (conv: Conversation) => void
  onDelete:  (id: string) => void
  isDark:    boolean
}) {
  const t      = tk(isDark)
  const insets = useSafeAreaInsets()
  const slideY = useRef(new Animated.Value(400)).current
  const bdOp   = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (conv) {
      Animated.parallel([
        Animated.spring(slideY, { toValue: 0,   friction: 8, tension: 80, useNativeDriver: true }),
        Animated.timing(bdOp,   { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start()
    } else {
      slideY.setValue(400)
      bdOp.setValue(0)
    }
  }, [conv])

  const close = () => {
    Animated.parallel([
      Animated.timing(slideY, { toValue: 400, duration: 240, useNativeDriver: true }),
      Animated.timing(bdOp,   { toValue: 0,   duration: 200, useNativeDriver: true }),
    ]).start(() => onClose())
  }

  if (!conv) return null

  const actions = [
    {
      label: 'Abrir conversación',
      icon:  <IcoArrowRight color={t.text} />,
      color: t.text,
      onPress: () => { close(); setTimeout(() => onOpen(conv.id), 260) },
    },
    {
      label: conv.is_pinned ? 'Desfijar' : 'Fijar',
      icon:  <IcoPin color={conv.is_pinned ? '#2FAF8F' : t.text} />,
      color: conv.is_pinned ? '#2FAF8F' : t.text,
      onPress: () => { close(); setTimeout(() => onPin(conv), 260) },
    },
    {
      label: 'Archivar',
      icon:  <IcoArchive color={t.text} />,
      color: t.text,
      onPress: () => { close(); setTimeout(() => onArchive(conv), 260) },
    },
    {
      label: 'Eliminar',
      icon:  <IcoTrash color="#ef4444" />,
      color: '#ef4444',
      onPress: () => { close(); setTimeout(() => onDelete(conv.id), 260) },
    },
  ]

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={close}>
      <Animated.View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.38)', opacity: bdOp }]}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={close} />
      </Animated.View>

      <Animated.View style={[s.sheet, {
        backgroundColor: t.sheetBg,
        borderColor:     t.border,
        paddingBottom:   insets.bottom + 12,
        transform: [{ translateY: slideY }],
      }]}>
        {/* Handle */}
        <View style={[s.sheetHandle, { backgroundColor: t.muted2 }]} />

        {/* Conversation preview */}
        <View style={[s.sheetPreview, { borderBottomColor: t.divider }]}>
          <View style={[s.modeDot, { backgroundColor: MODE_COLOR[conv.mode] }]} />
          <View style={{ flex: 1 }}>
            <Text style={[s.modeLabel, { color: t.muted }]}>{MODE_LABEL[conv.mode].toUpperCase()}</Text>
            <Text style={[s.sheetTitle, { color: t.text }]} numberOfLines={2}>{conv.title}</Text>
          </View>
        </View>

        {/* Actions */}
        {actions.map((a, i) => (
          <TouchableOpacity
            key={i}
            style={[s.sheetAction, { borderBottomColor: t.divider, borderBottomWidth: i < actions.length - 1 ? StyleSheet.hairlineWidth : 0 }]}
            onPress={a.onPress}
            activeOpacity={0.65}
          >
            <View style={s.sheetActionIcon}>{a.icon}</View>
            <Text style={[s.sheetActionLabel, { color: a.color }]}>{a.label}</Text>
          </TouchableOpacity>
        ))}
      </Animated.View>
    </Modal>
  )
}

// ─── Group Header ─────────────────────────────────────────────────────────────
function GroupHeader({ label, isDark }: { label: string; isDark: boolean }) {
  const t = tk(isDark)
  return (
    <View style={s.groupHeader}>
      {label === 'Fijadas' && (
        <IcoPin color="#2FAF8F" />
      )}
      <Text style={[s.groupLabel, { color: t.muted }]}>{label.toUpperCase()}</Text>
      <View style={[s.groupLine, { backgroundColor: t.divider }]} />
    </View>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function HistorialScreen() {
  const colorScheme = useColorScheme()
  const isDark      = colorScheme === 'dark'
  const t           = tk(isDark)
  const router      = useRouter()
  const insets      = useSafeAreaInsets()

  const [view,          setView]          = useState<ViewMode>('list')
  const [filter,        setFilter]        = useState<FilterKey>('todos')
  const [query,         setQuery]         = useState('')
  const [focused,       setFocused]       = useState(false)
  const searchElevation = useRef(new Animated.Value(0)).current
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isLoading,     setIsLoading]     = useState(true)
  const [error,         setError]         = useState<string | null>(null)
  const [deletingId,    setDeletingId]    = useState<string | null>(null)
  const [toastMsg,      setToastMsg]      = useState<string | null>(null)
  const [selectedConv,  setSelectedConv]  = useState<Conversation | null>(null)

  const inputRef  = useRef<TextInput>(null)
  const scrollRef = useRef<ScrollView>(null)

  // ── Toast ──────────────────────────────────────────────────────────────────
  const showToast = useCallback((msg: string) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 2600)
  }, [])

  const handleSearchFocus = () => {
    setFocused(true)
    Animated.timing(searchElevation, { toValue: 1, duration: 250, useNativeDriver: false }).start()
  }
  const handleSearchBlur = () => {
    setFocused(false)
    Animated.timing(searchElevation, { toValue: 0, duration: 250, useNativeDriver: false }).start()
  }

  // ── Cargar conversaciones ──────────────────────────────────────────────────
  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      // TODO: reemplazar con chatService.listConversations({ limit: 100 })
      await new Promise(r => setTimeout(r, 900)) // simula fetch
      setConversations(MOCK_CONVERSATIONS)
    } catch {
      setError('No se pudieron cargar las conversaciones. Intenta de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // ── Abrir conversación ─────────────────────────────────────────────────────
  const handleOpen = (id: string) => {
    // TODO: pasar conversationId al chat
    router.push('/(app)/chat' as any)
  }

  // ── Pin ────────────────────────────────────────────────────────────────────
  const handlePin = async (conv: Conversation) => {
    try {
      // TODO: chatService.pinConversation(conv.id, !conv.is_pinned)
      setConversations(prev =>
        prev.map(c => c.id === conv.id ? { ...c, is_pinned: !conv.is_pinned } : c)
      )
      showToast(conv.is_pinned ? 'Conversación desfijada' : 'Conversación fijada')
    } catch {
      showToast('Error al fijar')
    }
  }

  // ── Archivar ───────────────────────────────────────────────────────────────
  const handleArchive = async (conv: Conversation) => {
    try {
      // TODO: chatService.archiveConversation(conv.id, true)
      setConversations(prev => prev.filter(c => c.id !== conv.id))
      showToast('Conversación archivada')
    } catch {
      showToast('Error al archivar')
    }
  }

  // ── Eliminar ───────────────────────────────────────────────────────────────
  const handleDelete = (id: string) => {
    Alert.alert(
      'Eliminar conversación',
      '¿Estás seguro? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar', style: 'destructive',
          onPress: async () => {
            setDeletingId(id)
            try {
              // TODO: chatService.deleteConversation(id)
              await new Promise(r => setTimeout(r, 500))
              setConversations(prev => prev.filter(c => c.id !== id))
              showToast('Conversación eliminada')
            } catch {
              showToast('Error al eliminar')
            } finally {
              setDeletingId(null)
            }
          },
        },
      ]
    )
  }

  // ── Filtrar + buscar ───────────────────────────────────────────────────────
  const filtered = conversations.filter(conv => {
    const matchesFilter = filter === 'todos' || conv.mode === filter
    const q = query.toLowerCase()
    const matchesQuery  = !q || conv.title.toLowerCase().includes(q)
    return matchesFilter && matchesQuery
  })

  const sorted = [...filtered].sort((a, b) => {
    if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1
    const ta = a.last_message_at ?? a.created_at
    const tb = b.last_message_at ?? b.created_at
    return new Date(tb).getTime() - new Date(ta).getTime()
  })

  const groups = sorted.reduce<Record<string, Conversation[]>>((acc, conv) => {
    const g = conv.is_pinned ? 'Fijadas' : dateGroup(conv.last_message_at ?? conv.created_at)
    if (!acc[g]) acc[g] = []
    acc[g].push(conv)
    return acc
  }, {})

  const activeGroups = GROUP_ORDER.filter(g => groups[g])

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <View style={[s.root, { backgroundColor: t.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={t.bg} />

      {/* Toast */}
      {toastMsg && (
        <View style={[s.toastWrap, { bottom: insets.bottom + 80 }]}>
          <Toast msg={toastMsg} isDark={isDark} />
        </View>
      )}

      {/* ── Scrollable area ── */}
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={[
          s.scrollContent,
          { paddingBottom: insets.bottom + 120, paddingTop: insets.top + 16 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Header ── */}
        <View style={s.header}>
          <View>
            <Text style={[s.pageTitle, { color: t.text }]}>Historial</Text>
            <Text style={[s.pageSubtitle, { color: t.muted }]}>
              {isLoading
                ? 'Cargando conversaciones…'
                : `${conversations.length} conversación${conversations.length !== 1 ? 'es' : ''} · Recientes`}
            </Text>
          </View>

          {/* View toggle + New */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TouchableOpacity
              style={[s.iconCircle, { borderColor: t.border, backgroundColor: t.surface }]}
              onPress={() => router.push('/(app)/chat' as any)}
              activeOpacity={0.7}
            >
              <IcoPlus color={t.muted} />
            </TouchableOpacity>
            <View style={[s.viewToggle, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#f0efee' }]}>
              {(['list', 'cards'] as ViewMode[]).map(v => (
                <TouchableOpacity
                  key={v}
                  style={[
                    s.viewToggleBtn,
                    view === v && { backgroundColor: t.surface, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: isDark ? 0.3 : 0.1, shadowRadius: 3, elevation: 2 },
                  ]}
                  onPress={() => setView(v)}
                  activeOpacity={0.7}
                >
                  {v === 'list'
                    ? <IcoList  color={view === v ? t.text : t.muted} />
                    : <IcoCards color={view === v ? t.text : t.muted} />
                  }
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* ── Filter pills ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.filtersRow}
          style={{ marginTop: 16 }}
        >
          {FILTERS.map(f => {
            const active = filter === f.key
            return (
              <TouchableOpacity
                key={f.key}
                style={[
                  s.filterPill,
                  active
                    ? { backgroundColor: isDark ? '#f5f5f4' : '#1c1917' }
                    : { backgroundColor: 'transparent' },
                ]}
                onPress={() => setFilter(f.key)}
                activeOpacity={0.7}
              >
                <Text style={[
                  s.filterPillText,
                  { color: active ? (isDark ? '#1c1917' : '#fafaf9') : t.muted },
                ]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>

        {/* ── Error ── */}
        {error && (
          <View style={s.centerState}>
            <Text style={[s.errorText, { color: '#f87171' }]}>{error}</Text>
            <TouchableOpacity onPress={load} style={{ marginTop: 12 }}>
              <Text style={{ fontFamily: 'Geist-Medium', fontSize: 13, color: '#2FAF8F' }}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Loading skeleton ── */}
        {!error && isLoading && (
          view === 'list' ? (
            <View style={{ marginTop: 24 }}>
              {[0, 1].map(gi => (
                <View key={gi} style={{ marginBottom: 32 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <View style={{ height: 8, width: 48, borderRadius: 4, backgroundColor: t.skBase }} />
                    <View style={[{ flex: 1, height: 1 }, { backgroundColor: t.divider }]} />
                  </View>
                  {[0, 1, 2].map(i => <SkeletonRow key={i} isDark={isDark} />)}
                </View>
              ))}
            </View>
          ) : (
            <View style={s.gridWrap}>
              {[0, 1, 2, 3].map(i => (
                <View key={i} style={{ flex: 1, minWidth: 0 }}>
                  <SkeletonCard isDark={isDark} />
                </View>
              ))}
            </View>
          )
        )}

        {/* ── Empty state ── */}
        {!error && !isLoading && filtered.length === 0 && (
          <View style={s.centerState}>
            <View style={[s.emptyIcon, { backgroundColor: isDark ? '#1c1917' : '#f0efee' }]}>
              <IcoMsg color={t.muted3} />
            </View>
            <Text style={[s.emptyTitle, { color: t.text2 }]}>Sin resultados</Text>
            <Text style={[s.emptyDesc, { color: t.muted }]}>
              {query
                ? `No hay conversaciones para "${query}"`
                : conversations.length === 0
                ? 'Aún no tienes conversaciones. ¡Empieza una!'
                : 'No hay conversaciones en esta categoría'}
            </Text>
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 20 }}
              onPress={() => router.push('/(app)/chat' as any)}
              activeOpacity={0.7}
            >
              <Text style={{ fontFamily: 'Geist-Medium', fontSize: 13, color: '#2FAF8F' }}>
                Iniciar nueva conversación
              </Text>
              <IcoArrowRight color="#2FAF8F" />
            </TouchableOpacity>
          </View>
        )}

        {/* ── List view ── */}
        {!error && !isLoading && filtered.length > 0 && view === 'list' && (
          <View style={{ marginTop: 20 }}>
            {activeGroups.map(group => (
              <View key={group} style={{ marginBottom: 28 }}>
                <GroupHeader label={group} isDark={isDark} />
                {groups[group].map(conv => (
                  <ConvRow
                    key={conv.id}
                    conv={conv}
                    onOpen={handleOpen}
                    onMenu={setSelectedConv}
                    isDark={isDark}
                  />
                ))}
              </View>
            ))}
          </View>
        )}

        {/* ── Cards view — 1 columna con acento lateral ── */}
        {!error && !isLoading && filtered.length > 0 && view === 'cards' && (
          <View style={{ marginTop: 20 }}>
            {activeGroups.map(group => (
              <View key={group} style={{ marginBottom: 28 }}>
                <GroupHeader label={group} isDark={isDark} />
                <View style={{ gap: 10 }}>
                  {groups[group].map(conv => (
                    <ConvCard
                      key={conv.id}
                      conv={conv}
                      onMenu={setSelectedConv}
                      isDark={isDark}
                    />
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* ── Action sheet ── */}
      <ActionSheet
        conv={selectedConv}
        onClose={() => setSelectedConv(null)}
        onOpen={handleOpen}
        onPin={handlePin}
        onArchive={handleArchive}
        onDelete={handleDelete}
        isDark={isDark}
      />

      {/* ── Search bar flotante ── */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
        style={s.searchFloat}
      >
        <BlurView
          intensity={isDark ? 60 : 80}
          tint={isDark ? 'dark' : 'light'}
          style={s.searchBlur}
        >
          <View style={[s.searchInner, { paddingBottom: insets.bottom > 0 ? insets.bottom + 8 : 16 }]}>
            <Animated.View style={[s.searchCard, {
              backgroundColor: isDark ? 'rgba(28,25,23,0.95)' : 'rgba(255,255,255,0.98)',
              borderColor: t.border,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: searchElevation.interpolate({ inputRange: [0, 1], outputRange: [isDark ? 0.25 : 0.08, isDark ? 0.45 : 0.14] }),
              shadowRadius: searchElevation.interpolate({ inputRange: [0, 1], outputRange: [12, 20] }),
              elevation: 8,
            }]}>
              <IcoSearch color={t.muted} />
              <TextInput
                ref={inputRef}
                style={[s.searchInput, { color: t.text }]}
                placeholder="Buscar conversaciones…"
                placeholderTextColor={t.placeholder}
                value={query}
                onChangeText={setQuery}
                onFocus={() => handleSearchFocus()}
                onBlur={() => handleSearchBlur()}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
              />
              {query.length > 0 && (
                <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <IcoX color={t.muted} />
                </TouchableOpacity>
              )}
            </Animated.View>
            <Text style={[s.searchHint, { color: isDark ? '#44403c' : '#d6d3d1' }]}>
              Siete · Historial de conversaciones
            </Text>
          </View>
        </BlurView>
      </KeyboardAvoidingView>
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1 },

  scrollContent: { paddingHorizontal: 20 },

  // Header
  header:      { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  pageTitle:   { fontFamily: 'Geist-SemiBold', fontSize: 17, letterSpacing: -0.3 },
  pageSubtitle:{ fontFamily: 'Geist-Regular',  fontSize: 11.5, marginTop: 3 },

  iconCircle: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1,
  },
  viewToggle: {
    flexDirection: 'row', borderRadius: 9, padding: 2, gap: 2,
  },
  viewToggleBtn: {
    width: 28, height: 28, borderRadius: 7,
    alignItems: 'center', justifyContent: 'center',
  },

  // Filters
  filtersRow: { paddingHorizontal: 0, gap: 4, paddingBottom: 2 },
  filterPill: {
    height: 28, paddingHorizontal: 14, borderRadius: 999,
    alignItems: 'center', justifyContent: 'center',
  },
  filterPillText: { fontFamily: 'Geist-Medium', fontSize: 12 },

  // Group
  groupHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2, paddingBottom: 6 },
  groupLabel:  { fontFamily: 'Geist-SemiBold', fontSize: 9.5, letterSpacing: 1.2 },
  groupLine:   { flex: 1, height: 1 },

  // List row
  listRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, borderBottomWidth: 1, gap: 8,
  },
  skRow: {
    flexDirection: 'row', paddingVertical: 18,
    borderBottomWidth: 1, gap: 12,
  },
  rowTitle: { fontFamily: 'Geist-SemiBold', fontSize: 14.5, lineHeight: 21, letterSpacing: -0.2 },

  // Grid card
  gridWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  gridCard: {
    borderRadius: 18, borderWidth: 1,
    padding: 16, flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  gridFooter: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12, borderTopWidth: 1, marginTop: 'auto',
  },
  cardTitle: {
    fontFamily: 'Geist-SemiBold', fontSize: 13.5,
    lineHeight: 20, letterSpacing: -0.2, marginTop: 8,
  },

  // Mode badge
  modeDot:   { width: 6, height: 6, borderRadius: 3 },
  modeLabel: { fontFamily: 'Geist-SemiBold', fontSize: 10, letterSpacing: 0.8 },

  // Meta
  metaText:  { fontFamily: 'Geist-Regular', fontSize: 10.5 },

  // Compact card (cards view)
  compactCard: {
    flexDirection: 'row', alignItems: 'stretch',
    borderRadius: 16, borderWidth: 1,
    overflow: 'hidden', paddingVertical: 16, paddingRight: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  compactAccent: { width: 3, borderRadius: 2, marginLeft: 14, marginRight: 0 },

  // Dots button
  dotsBtn:  { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  dotsText: { fontSize: 18, lineHeight: 22, letterSpacing: 1, marginTop: -2 },

  // Action sheet
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderWidth: 1, borderBottomWidth: 0,
    paddingHorizontal: 16, paddingTop: 10,
  },
  sheetHandle:      { alignSelf: 'center', width: 36, height: 4, borderRadius: 2, marginBottom: 14 },
  sheetPreview:     { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingBottom: 14, marginBottom: 6, borderBottomWidth: StyleSheet.hairlineWidth },
  sheetTitle:       { fontFamily: 'Geist-SemiBold', fontSize: 13, lineHeight: 19, marginTop: 3 },
  sheetAction:      { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, gap: 14 },
  sheetActionIcon:  { width: 28, alignItems: 'center' },
  sheetActionLabel: { fontFamily: 'Geist-Medium', fontSize: 14 },

  // States
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 80, gap: 8 },
  emptyIcon:   { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  emptyTitle:  { fontFamily: 'Geist-SemiBold', fontSize: 14 },
  emptyDesc:   { fontFamily: 'Geist-Regular',  fontSize: 12.5, textAlign: 'center', maxWidth: 260 },
  errorText:   { fontFamily: 'Geist-Regular',  fontSize: 13, textAlign: 'center' },

  // Search bar flotante
  searchFloat: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  searchBlur:  { overflow: 'hidden' },
  searchInner: { paddingTop: 10, paddingHorizontal: 16 },
  searchCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 18, borderWidth: 1,
    paddingHorizontal: 14, height: 48,
  },
  searchInput: {
    flex: 1, fontFamily: 'Geist-Regular', fontSize: 14,
    paddingVertical: 0,
  },
  searchHint: {
    fontFamily: 'Geist-Regular', fontSize: 10,
    textAlign: 'center', letterSpacing: 0.2, marginTop: 6,
  },

  // Toast
  toastWrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center', zIndex: 50 },
  toast:     { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20 },
  toastText: { fontFamily: 'Geist-Medium', fontSize: 12.5 },
})