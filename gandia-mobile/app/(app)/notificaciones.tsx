// app/(app)/notificaciones.tsx — Gandia 7 · versión React Native
import { useState, useRef, useEffect } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Animated, useColorScheme, StatusBar, ActivityIndicator,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Path, Circle, Line, Polyline } from 'react-native-svg'

// ─── Types ────────────────────────────────────────────────────────────────────
type FilterState = 'todas' | 'no-leidas' | 'leidas'
type TypeFilter  = 'all' | NotifType
type NotifType   = 'approval' | 'tramite' | 'system'

type AppNotification = {
  id:         string
  type:       NotifType
  title:      string
  body:       string
  read:       boolean
  created_at: string
}

// ─── Tokens ───────────────────────────────────────────────────────────────────
const tk = (d: boolean) => ({
  bg:       d ? '#0c0a09' : '#fafaf9',
  surface:  d ? '#141210' : '#ffffff',
  border:   d ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.09)',
  divider:  d ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)',
  text:     d ? '#fafaf9' : '#1c1917',
  text2:    d ? '#d6d3d1' : '#44403c',
  muted:    d ? '#78716c' : '#a8a29e',
  muted2:   d ? '#57534e' : '#c4bfba',
  muted3:   d ? '#44403c' : '#d6d3d1',
  skBase:   d ? '#1c1917' : '#f0efee',
  skShine:  d ? '#262220' : '#e8e7e5',
})

// ─── Type config ──────────────────────────────────────────────────────────────
type TypeCfg = { accent: string; bgAlpha: string; label: string }

const TYPE_CFG: Record<NotifType, TypeCfg> = {
  approval: { accent: '#2FAF8F', bgAlpha: 'rgba(47,175,143,0.10)',  label: 'Aprobación' },
  tramite:  { accent: '#f59e0b', bgAlpha: 'rgba(245,158,11,0.10)',  label: 'Trámite'    },
  system:   { accent: '#818cf8', bgAlpha: 'rgba(129,140,248,0.10)', label: 'Sistema'    },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60)    return 'Hace un momento'
  if (diff < 3600)  return `Hace ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} h`
  if (diff < 172800) return 'Ayer'
  return new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatGroupDate(iso: string): string {
  const d     = new Date(iso)
  const now   = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const day   = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const diff  = (today.getTime() - day.getTime()) / 86400000
  if (diff === 0) return 'Hoy'
  if (diff === 1) return 'Ayer'
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
}

function groupByDate(list: AppNotification[]): Map<string, AppNotification[]> {
  const map = new Map<string, AppNotification[]>()
  list.forEach(n => {
    const key = formatGroupDate(n.created_at)
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(n)
  })
  return map
}

// ─── SVG Icons ────────────────────────────────────────────────────────────────
const sv = { fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

function IcoBell({ color, size = 18 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" {...sv} stroke={color} strokeWidth="1.6">
      <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <Path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </Svg>
  )
}
function IcoCheck({ color, size = 16 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" {...sv} stroke={color} strokeWidth="1.75">
      <Polyline points="20 6 9 17 4 12" />
    </Svg>
  )
}
function IcoWarn({ color, size = 16 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" {...sv} stroke={color} strokeWidth="1.6">
      <Path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <Line x1="12" y1="9" x2="12" y2="13" />
      <Line x1="12" y1="17" x2="12.01" y2="17" />
    </Svg>
  )
}
function IcoInfo({ color, size = 16 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" {...sv} stroke={color} strokeWidth="1.6">
      <Circle cx="12" cy="12" r="10" />
      <Line x1="12" y1="16" x2="12" y2="12" />
      <Line x1="12" y1="8" x2="12.01" y2="8" />
    </Svg>
  )
}
function IcoX({ color, size = 13 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" {...sv} stroke={color} strokeWidth="2">
      <Line x1="18" y1="6" x2="6" y2="18" />
      <Line x1="6" y1="6" x2="18" y2="18" />
    </Svg>
  )
}
function IcoSpark({ color }: { color: string }) {
  return (
    <Svg width={11} height={11} viewBox="0 0 24 24" {...sv} stroke={color} strokeWidth="1.5">
      <Path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </Svg>
  )
}

function NotifIcon({ type, size = 16 }: { type: NotifType; size?: number }) {
  const cfg = TYPE_CFG[type]
  if (type === 'approval') return <IcoCheck color={cfg.accent} size={size} />
  if (type === 'tramite')  return <IcoWarn  color={cfg.accent} size={size} />
  return                          <IcoInfo  color={cfg.accent} size={size} />
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function SkeletonItem({ isDark }: { isDark: boolean }) {
  const t    = tk(isDark)
  const anim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 850, useNativeDriver: false }),
        Animated.timing(anim, { toValue: 0, duration: 850, useNativeDriver: false }),
      ])
    ).start()
  }, [])

  const bg = anim.interpolate({ inputRange: [0, 1], outputRange: [t.skBase, t.skShine] })

  return (
    <View style={[s.skItem, { borderBottomColor: t.divider }]}>
      <Animated.View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: bg }} />
      <View style={{ flex: 1, gap: 7 }}>
        <Animated.View style={{ height: 10, width: '30%', borderRadius: 5, backgroundColor: bg }} />
        <Animated.View style={{ height: 13, width: '65%', borderRadius: 5, backgroundColor: bg }} />
        <Animated.View style={{ height: 10, width: '90%', borderRadius: 5, backgroundColor: bg }} />
      </View>
    </View>
  )
}

// ─── Notification item ────────────────────────────────────────────────────────
function NotifItem({ notif, onRead, onDelete, isDark, isLast }: {
  notif:    AppNotification
  onRead:   (id: string) => void
  onDelete: (id: string) => void
  isDark:   boolean
  isLast:   boolean
}) {
  const t   = tk(isDark)
  const cfg = TYPE_CFG[notif.type]

  const scale = useRef(new Animated.Value(1)).current
  const press   = () => Animated.spring(scale, { toValue: 0.985, useNativeDriver: true, friction: 6 }).start()
  const release = () => Animated.spring(scale, { toValue: 1,     useNativeDriver: true, friction: 6 }).start()

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        style={[
          s.notifRow,
          { borderBottomColor: t.divider },
          !isLast && { borderBottomWidth: StyleSheet.hairlineWidth },
        ]}
        onPress={() => { if (!notif.read) onRead(notif.id) }}
        onPressIn={press}
        onPressOut={release}
        activeOpacity={1}
      >
        {/* Barra izquierda de no leída */}
        {!notif.read && (
          <View style={[s.unreadBar, { backgroundColor: cfg.accent }]} />
        )}

        {/* Ícono */}
        <View style={[s.iconBox, { backgroundColor: cfg.bgAlpha }]}>
          <NotifIcon type={notif.type} size={17} />
        </View>

        {/* Contenido */}
        <View style={{ flex: 1, minWidth: 0 }}>
          {/* Tipo + tiempo */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <Text style={[s.typeLabel, { color: cfg.accent }]}>{cfg.label.toUpperCase()}</Text>
            <View style={[s.dotSep, { backgroundColor: t.muted3 }]} />
            <Text style={[s.timeText, { color: t.muted2 }]}>{formatDate(notif.created_at)}</Text>
          </View>

          {/* Título */}
          <Text style={[
            s.notifTitle,
            { color: notif.read ? t.muted : t.text },
          ]}>
            {notif.title}
          </Text>

          {/* Body */}
          <Text style={[s.notifBody, { color: t.muted }]}>
            {notif.body}
          </Text>

          {/* Acciones */}
          <View style={s.actionsRow}>
            {!notif.read && (
              <>
                <TouchableOpacity
                  onPress={() => onRead(notif.id)}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <Text style={[s.actionLink, { color: cfg.accent }]}>Marcar como leída</Text>
                </TouchableOpacity>
                <View style={[s.actionDiv, { backgroundColor: t.muted3 }]} />
              </>
            )}
            <TouchableOpacity
              onPress={() => onDelete(notif.id)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <IcoX color={t.muted2} size={11} />
              <Text style={[s.actionLink, { color: t.muted2 }]}>Eliminar</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Punto de no leída */}
        {!notif.read && (
          <View style={[s.unreadDot, { backgroundColor: cfg.accent }]} />
        )}
      </TouchableOpacity>
    </Animated.View>
  )
}

// ─── Mock data (TODO: conectar con useNotifications del context) ──────────────
const MOCK_NOTIFICATIONS: AppNotification[] = [
  { id: '1', type: 'approval', title: 'Pasaporte #GND-2041 aprobado',           body: 'El pasaporte ganadero del lote #4 fue validado por SENASICA y está listo para exportación.',  read: false, created_at: new Date(Date.now() - 1800000).toISOString()       },
  { id: '2', type: 'tramite',  title: 'Trámite vencimiento próximo',             body: 'El certificado de origen del lote #7 vence en 5 días. Renuévalo antes del 6 de marzo.',        read: false, created_at: new Date(Date.now() - 7200000).toISOString()       },
  { id: '3', type: 'system',   title: 'Actualización del sistema disponible',    body: 'GANDIA 7.1 incluye modo sin conexión y pasaporte ganadero exportable. Actualiza cuando puedas.', read: false, created_at: new Date(Date.now() - 86400000).toISOString()      },
  { id: '4', type: 'approval', title: 'Certificado de sanidad renovado',         body: 'El certificado sanitario del rancho La Esperanza fue renovado exitosamente.',                   read: true,  created_at: new Date(Date.now() - 86400000 * 2).toISOString()   },
  { id: '5', type: 'tramite',  title: 'Solicitud de exportación en revisión',    body: 'La FDA está revisando tu solicitud de exportación. Tiempo estimado: 3-5 días hábiles.',         read: true,  created_at: new Date(Date.now() - 86400000 * 3).toISOString()   },
  { id: '6', type: 'system',   title: 'Nuevo precio SNIIM disponible',           body: 'Los precios de referencia para ganado en pie del norte se actualizaron esta semana.',            read: true,  created_at: new Date(Date.now() - 86400000 * 5).toISOString()   },
]
export default function NotificacionesScreen() {
  const colorScheme = useColorScheme()
  const isDark      = colorScheme === 'dark'
  const t           = tk(isDark)
  const insets      = useSafeAreaInsets()

  // TODO: reemplazar con useNotifications() del context cuando esté listo
  const [notifications, setNotifications] = useState<AppNotification[]>(MOCK_NOTIFICATIONS)
  const [isLoading] = useState(false)
  const unreadCount = notifications.filter((n: AppNotification) => !n.read).length

  const markAsRead         = (id: string) => setNotifications(prev => prev.map((n: AppNotification) => n.id === id ? { ...n, read: true } : n))
  const markAllAsRead      = ()           => setNotifications(prev => prev.map((n: AppNotification) => ({ ...n, read: true })))
  const deleteNotification = (id: string) => setNotifications(prev => prev.filter((n: AppNotification) => n.id !== id))

  const [filter,     setFilter]     = useState<FilterState>('todas')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')

  // Entrance animation
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(10)).current
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 380, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 380, useNativeDriver: true }),
    ]).start()
  }, [])

  // Filter logic
  let visible = notifications
  if (filter === 'no-leidas') visible = visible.filter((n: AppNotification) => !n.read)
  if (filter === 'leidas')    visible = visible.filter((n: AppNotification) =>  n.read)
  if (typeFilter !== 'all')   visible = visible.filter((n: AppNotification) => n.type === typeFilter)

  const groups = groupByDate(visible)

  const READ_FILTERS: { key: FilterState; label: string; count: number }[] = [
    { key: 'todas',     label: 'Todas',    count: notifications.length },
    { key: 'no-leidas', label: 'Sin leer', count: unreadCount          },
    { key: 'leidas',    label: 'Leídas',   count: notifications.length - unreadCount },
  ]

  const TYPE_FILTERS: { key: TypeFilter; label: string }[] = [
    { key: 'approval', label: 'Aprobación' },
    { key: 'tramite',  label: 'Trámites'   },
    { key: 'system',   label: 'Sistema'    },
  ]

  return (
    <View style={[s.root, { backgroundColor: t.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={t.bg} />

      <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[
            s.scroll,
            { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 48 },
          ]}
          showsVerticalScrollIndicator={false}
        >

          {/* ── Header ── */}
          <View style={s.header}>
            <View>
              <Text style={[s.eyebrow, { color: t.muted }]}>Centro de actividad</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 }}>
                <Text style={[s.pageTitle, { color: t.text }]}>Notificaciones</Text>
                {unreadCount > 0 && (
                  <View style={[s.badge, { borderColor: t.muted2 }]}>
                    <Text style={[s.badgeText, { color: t.muted }]}>{unreadCount}</Text>
                  </View>
                )}
              </View>
            </View>
            {unreadCount > 0 && (
              <TouchableOpacity
                onPress={markAllAsRead}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 }}
                activeOpacity={0.7}
              >
                <IcoCheck color={t.muted} size={14} />
                <Text style={[s.markAllText, { color: t.muted }]}>Todas leídas</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* ── Filtros de estado ── */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.filtersRow}
            style={{ marginTop: 20 }}
          >
            {READ_FILTERS.map(f => {
              const active = filter === f.key
              return (
                <TouchableOpacity
                  key={f.key}
                  style={[
                    s.pill,
                    active
                      ? { backgroundColor: isDark ? '#f5f5f4' : '#1c1917', borderColor: 'transparent' }
                      : { backgroundColor: t.surface, borderColor: t.border },
                  ]}
                  onPress={() => setFilter(f.key)}
                  activeOpacity={0.75}
                >
                  <Text style={[s.pillText, { color: active ? (isDark ? '#1c1917' : '#fafaf9') : t.muted }]}>
                    {f.label}
                  </Text>
                  {f.count > 0 && (
                    <Text style={[s.pillCount, { color: active ? (isDark ? 'rgba(28,25,23,0.5)' : 'rgba(250,250,249,0.55)') : t.muted3 }]}>
                      {f.count}
                    </Text>
                  )}
                </TouchableOpacity>
              )
            })}

            {/* Separador */}
            <View style={[s.pillSep, { backgroundColor: t.muted3 }]} />

            {/* Filtros de tipo */}
            {TYPE_FILTERS.map(f => {
              const cfg    = TYPE_CFG[f.key as NotifType]
              const active = typeFilter === f.key
              return (
                <TouchableOpacity
                  key={f.key}
                  style={[
                    s.pill,
                    active
                      ? { backgroundColor: cfg.bgAlpha, borderColor: cfg.accent + '40' }
                      : { backgroundColor: t.surface, borderColor: t.border },
                  ]}
                  onPress={() => setTypeFilter(active ? 'all' : f.key)}
                  activeOpacity={0.75}
                >
                  {active && <NotifIcon type={f.key as NotifType} size={12} />}
                  <Text style={[s.pillText, { color: active ? cfg.accent : t.muted }]}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </ScrollView>

          {/* ── Lista ── */}
          <View style={{ marginTop: 16 }}>

            {/* Skeleton */}
            {isLoading && notifications.length === 0 && (
              <View style={[s.card, { backgroundColor: t.surface, borderColor: t.border }]}>
                {[0, 1, 2].map(i => (
                  <SkeletonItem key={i} isDark={isDark} />
                ))}
              </View>
            )}

            {/* Empty state */}
            {!isLoading && visible.length === 0 && (
              <View style={[s.card, s.emptyCard, { backgroundColor: t.surface, borderColor: t.border }]}>
                <View style={[s.emptyIcon, { backgroundColor: isDark ? '#1c1917' : '#f0efee' }]}>
                  <IcoBell color={t.muted3} size={22} />
                </View>
                <Text style={[s.emptyTitle, { color: t.muted }]}>Sin notificaciones</Text>
                <Text style={[s.emptyDesc, { color: t.muted2 }]}>
                  {filter === 'no-leidas' ? 'Estás al día' : 'Ajusta los filtros para ver más'}
                </Text>
              </View>
            )}

            {/* Notificaciones agrupadas */}
            {!isLoading && visible.length > 0 && (
              <View style={[s.card, { backgroundColor: t.surface, borderColor: t.border, overflow: 'hidden' }]}>
                {Array.from(groups.entries()).map(([date, items], gi) => (
                  <View key={date}>
                    {/* Group header */}
                    <View style={[
                      s.groupHeader,
                      gi > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.divider },
                    ]}>
                      <Text style={[s.groupLabel, { color: t.muted3 }]}>{date.toUpperCase()}</Text>
                    </View>

                    {/* Items */}
                    {items.map((n, i) => (
                      <NotifItem
                        key={n.id}
                        notif={n}
                        onRead={markAsRead}
                        onDelete={deleteNotification}
                        isDark={isDark}
                        isLast={i === items.length - 1 && gi === groups.size - 1}
                      />
                    ))}
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* ── Footer badge IA ── */}
          {!isLoading && notifications.length > 0 && (
            <View style={s.footer}>
              <IcoSpark color={t.muted3} />
              <Text style={[s.footerText, { color: t.muted3 }]}>
                Notificaciones en tiempo real · Gandia IA
              </Text>
            </View>
          )}

        </ScrollView>
      </Animated.View>
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:   { flex: 1 },
  scroll: { paddingHorizontal: 18 },

  // Header
  header:      { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  eyebrow:     { fontFamily: 'Geist-SemiBold', fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase' },
  pageTitle:   { fontFamily: 'InstrumentSerif-Italic', fontSize: 30, letterSpacing: -0.5, lineHeight: 36 },
  badge:       { height: 22, minWidth: 22, paddingHorizontal: 6, borderRadius: 11, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  badgeText:   { fontFamily: 'Geist-SemiBold', fontSize: 11 },
  markAllText: { fontFamily: 'Geist-Medium', fontSize: 12 },

  // Filters
  filtersRow: { paddingHorizontal: 0, gap: 6, alignItems: 'center', paddingBottom: 2 },
  pill:       { flexDirection: 'row', alignItems: 'center', gap: 5, height: 30, paddingHorizontal: 13, borderRadius: 999, borderWidth: 1 },
  pillText:   { fontFamily: 'Geist-Medium', fontSize: 12 },
  pillCount:  { fontFamily: 'Geist-SemiBold', fontSize: 10 },
  pillSep:    { width: 1, height: 14, marginHorizontal: 2, opacity: 0.5 },

  // Card
  card:    { borderRadius: 20, borderWidth: 1 },
  skItem:  { flexDirection: 'row', alignItems: 'flex-start', gap: 14, padding: 18, borderBottomWidth: StyleSheet.hairlineWidth },

  // Empty
  emptyCard:  { alignItems: 'center', justifyContent: 'center', paddingVertical: 64, gap: 10 },
  emptyIcon:  { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyTitle: { fontFamily: 'Geist-Medium', fontSize: 14 },
  emptyDesc:  { fontFamily: 'Geist-Regular', fontSize: 12.5 },

  // Group header
  groupHeader: { paddingHorizontal: 18, paddingVertical: 8 },
  groupLabel:  { fontFamily: 'Geist-SemiBold', fontSize: 9.5, letterSpacing: 1.0 },

  // Notification row
  notifRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingHorizontal: 18, paddingVertical: 16, gap: 13,
    position: 'relative',
  },
  unreadBar: {
    position: 'absolute', left: 0, top: 14, bottom: 14,
    width: 3, borderTopRightRadius: 4, borderBottomRightRadius: 4,
  },
  iconBox: {
    width: 42, height: 42, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  typeLabel:  { fontFamily: 'Geist-SemiBold', fontSize: 9.5, letterSpacing: 0.9 },
  dotSep:     { width: 3, height: 3, borderRadius: 2 },
  timeText:   { fontFamily: 'Geist-Regular', fontSize: 11 },
  notifTitle: { fontFamily: 'Geist-SemiBold', fontSize: 13.5, lineHeight: 20, marginBottom: 4 },
  notifBody:  { fontFamily: 'Geist-Regular', fontSize: 12.5, lineHeight: 19 },
  unreadDot:  { width: 7, height: 7, borderRadius: 4, marginTop: 5, flexShrink: 0 },

  // Actions
  actionsRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  actionLink: { fontFamily: 'Geist-Medium', fontSize: 11.5 },
  actionDiv:  { width: 1, height: 11 },

  // Footer
  footer:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 24 },
  footerText: { fontFamily: 'Geist-Medium', fontSize: 11 },
})