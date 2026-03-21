// app/(app)/_layout.tsx — Gandia 7 mobile layout con sidebar como la web
import { useState, useEffect, useRef, ReactElement } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, Animated,
  useColorScheme, StatusBar, Modal, ScrollView,
  Platform, Dimensions, Pressable, PanResponder,
} from 'react-native'
import { Stack, useRouter, usePathname } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Path, Circle, Polyline, Line, Rect } from 'react-native-svg'

const { width: W } = Dimensions.get('window')
const SIDEBAR_W    = Math.min(W * 0.82, 280)

// ─── Tokens ───────────────────────────────────────────────────────────────────
const tokens = (isDark: boolean) => ({
  bg:         isDark ? '#0c0a09' : '#fafaf9',
  sidebar:    isDark ? '#141210' : '#ffffff',
  surface:    isDark ? '#1c1917' : '#f5f4f3',
  border:     isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
  borderSoft: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)',
  text:       isDark ? '#fafaf9' : '#1c1917',
  textSub:    isDark ? '#d6d3d1' : '#44403c',
  muted:      isDark ? '#78716c' : '#a8a29e',
  mutedLight: isDark ? '#44403c' : '#d6d3d1',
  headerBg:   isDark ? 'rgba(12,10,9,0.92)' : 'rgba(250,250,249,0.92)',
  navActive:  isDark ? 'rgba(47,175,143,0.12)' : 'rgba(47,175,143,0.08)',
  navHover:   isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
})

// ─── Ticker ───────────────────────────────────────────────────────────────────
const TICKER_ITEMS = [
  '🐄  IA detecta patrón atípico en vacunación — zona norte de Durango',
  '📋  Nuevos requisitos SENASICA para exportación a EE.UU. vigentes desde marzo 2026',
  '🌿  Modelo climático: temporada de lluvias favorable en Chihuahua y Durango',
  '✅  847 pasaportes ganaderos procesados hoy en la plataforma',
  '🔬  Protocolo aftosa 2026 actualizado — disponible en Trámites',
  '📈  Precio ganado en pie +3.2% respecto al mes anterior · SNIIM',
  '⚠️  Alerta sanitaria: brote reportado en Sonora — revisa tu plan preventivo',
]

// ─── Nav groups (igual que la web) ────────────────────────────────────────────
const NAV_GROUPS = [
  {
    label: 'Principal',
    items: [
      { label: 'Chat',       path: '/(app)/chat',      icon: 'chat'      },
      { label: 'Noticias',   path: '/(app)/noticias',   icon: 'newspaper' },
      { label: 'Pasaportes', path: '/(app)/pasaportes', icon: 'file'      },
      { label: 'Gemelos',    path: '/(app)/gemelos',    icon: 'copy'     },
    ],
  },
  {
    label: 'Operaciones',
    items: [
      { label: 'Monitoreo',     path: '/(app)/monitoreo',     icon: 'eye'          },
      { label: 'Certificación', path: '/(app)/certificacion',  icon: 'check-circle' },
      { label: 'Trámites',      path: '/(app)/tramites/panel', icon: 'tramites'     },
      { label: 'Verificación',  path: '/(app)/verificacion',   icon: 'verified'     },
    ],
  },
  {
    label: 'Registro',
    items: [
      { label: 'Historial', path: '/(app)/historial', icon: 'clock' },
    ],
  },
]

// ─── Icons ────────────────────────────────────────────────────────────────────
const sp = { fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

function NavIcon({ name, color, size = 17 }: { name: string; color: string; size?: number }): ReactElement {
  const p = { ...sp, stroke: color, strokeWidth: '1.75' }
  const s = size
  const icons: Record<string, ReactElement> = {
    chat: (
      <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <Path {...p} d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </Svg>
    ),
    file: (
      <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <Path {...p} d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <Polyline {...p} points="14 2 14 8 20 8" />
      </Svg>
    ),
    copy: (
      <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <Rect {...p} x="9" y="9" width="13" height="13" rx="2" />
        <Path {...p} d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
      </Svg>
    ),
    eye: (
      <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <Path {...p} d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <Circle {...p} cx="12" cy="12" r="3" />
      </Svg>
    ),
    'check-circle': (
      <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <Path {...p} d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <Polyline {...p} points="22 4 12 14.01 9 11.01" />
      </Svg>
    ),
    tramites: (
      <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <Path {...p} d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <Polyline {...p} points="14 2 14 8 20 8" />
        <Line {...p} x1="9" y1="15" x2="15" y2="15" />
        <Line {...p} x1="9" y1="11" x2="15" y2="11" />
      </Svg>
    ),
    verified: (
      <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <Path {...p} d="M9 11l3 3L22 4" />
        <Path {...p} d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </Svg>
    ),
    newspaper: (
      <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <Path {...p} d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
        <Line {...p} x1="18" y1="14" x2="12" y2="14" />
        <Line {...p} x1="18" y1="18" x2="12" y2="18" />
        <Path {...p} d="M18 6H12v4h6V6z" />
      </Svg>
    ),
    clock: (
      <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <Circle {...p} cx="12" cy="12" r="10" />
        <Polyline {...p} points="12 6 12 12 16 14" />
      </Svg>
    ),
    bell: (
      <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <Path {...p} d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <Path {...p} d="M13.73 21a2 2 0 0 1-3.46 0" />
      </Svg>
    ),
    logout: (
      <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <Path {...p} d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <Polyline {...p} points="16 17 21 12 16 7" />
        <Line {...p} x1="21" y1="12" x2="9" y2="12" />
      </Svg>
    ),
    settings: (
      <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <Circle {...p} cx="12" cy="12" r="3" />
        <Path {...p} d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </Svg>
    ),
    help: (
      <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <Circle {...p} cx="12" cy="12" r="10" />
        <Path {...p} d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <Circle cx="12" cy="17" r="1" fill={color} />
      </Svg>
    ),
  }
  return icons[name] ?? <></>
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ letter, size = 28 }: { letter: string; size?: number }) {
  return (
    <View style={{
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: '#2FAF8F',
      alignItems: 'center', justifyContent: 'center',
      shadowColor: '#2FAF8F', shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.35, shadowRadius: 4, elevation: 3,
    }}>
      <Text style={{ color: '#fff', fontFamily: 'Geist-SemiBold', fontSize: Math.round(size * 0.38) }}>
        {letter}
      </Text>
    </View>
  )
}

// ─── News Ticker ──────────────────────────────────────────────────────────────
function NewsTicker({ isDark }: { isDark: boolean }) {
  const t       = tokens(isDark)
  const tickerX = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const totalWidth = TICKER_ITEMS.length * 2 * 240
    Animated.loop(
      Animated.timing(tickerX, {
        toValue: -totalWidth / 2,
        duration: TICKER_ITEMS.length * 6000,
        useNativeDriver: true,
      })
    ).start()
  }, [])

  return (
    <View style={ss.tickerWrap}>
      <View style={ss.tickerLabel}>
        <View style={ss.tickerDot} />
        <Text style={[ss.tickerLabelText, { color: t.muted }]}>Noticias</Text>
      </View>
      <View style={ss.tickerScroll}>
        <Animated.View style={[ss.tickerRow, { transform: [{ translateX: tickerX }] }]}>
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <Text key={i} style={[ss.tickerItem, { color: t.muted, borderRightColor: t.borderSoft }]}>
              {item}
            </Text>
          ))}
        </Animated.View>
      </View>
    </View>
  )
}

// ─── Logout Modal ─────────────────────────────────────────────────────────────
function LogoutModal({ open, onConfirm, onCancel, isDark }: {
  open: boolean; onConfirm: () => void; onCancel: () => void; isDark: boolean
}) {
  const t     = tokens(isDark)
  const scale = useRef(new Animated.Value(0.94)).current
  const op    = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (open) {
      Animated.parallel([
        Animated.spring(scale, { toValue: 1,  friction: 7, tension: 100, useNativeDriver: true }),
        Animated.timing(op,    { toValue: 1,  duration: 180, useNativeDriver: true }),
      ]).start()
    } else { scale.setValue(0.94); op.setValue(0) }
  }, [open])

  if (!open) return null
  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={onCancel}>
      <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' } as any} />
      <View style={{ ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 } as any} pointerEvents="box-none">
        <Animated.View style={{ width: '100%', maxWidth: 316, borderRadius: 20, overflow: 'hidden', opacity: op, transform: [{ scale }] }}>
          <View style={{ height: 3, backgroundColor: '#ef4444' }} />
          <View style={{ backgroundColor: t.sidebar, borderWidth: 1, borderTopWidth: 0, borderColor: t.border, borderBottomLeftRadius: 20, borderBottomRightRadius: 20, padding: 22 }}>
            <View style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: 'rgba(239,68,68,0.10)', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
              <NavIcon name="logout" color="#ef4444" size={17} />
            </View>
            <Text style={{ fontFamily: 'Geist-SemiBold', fontSize: 15, color: t.text, marginBottom: 6 }}>¿Cerrar sesión?</Text>
            <Text style={{ fontFamily: 'Geist-Regular', fontSize: 13, color: t.muted, lineHeight: 20, marginBottom: 20 }}>
              Tu sesión se cerrará en este dispositivo. Podrás volver cuando quieras.
            </Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity onPress={onCancel} style={{ flex: 1, height: 40, borderRadius: 12, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#f5f5f4', alignItems: 'center', justifyContent: 'center' }} activeOpacity={0.7}>
                <Text style={{ fontFamily: 'Geist-Medium', fontSize: 13, color: t.muted }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onConfirm} style={{ flex: 1, height: 40, borderRadius: 12, backgroundColor: '#ef4444', alignItems: 'center', justifyContent: 'center' }} activeOpacity={0.85}>
                <Text style={{ fontFamily: 'Geist-SemiBold', fontSize: 13, color: '#fff' }}>Cerrar sesión</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  )
}

// ─── User Menu (bottom of sidebar) ───────────────────────────────────────────
function UserMenu({ isDark, displayName, email, avatarLetter, onNav, onLogout }: {
  isDark: boolean; displayName: string; email: string; avatarLetter: string
  onNav: (p: string) => void; onLogout: () => void
}) {
  const t = tokens(isDark)
  const items = [
    { icon: 'settings', label: 'Configuraciones', path: '/(app)/configuraciones' },
    { icon: 'help',     label: 'Ayuda',            path: '/(app)/ayuda'           },
  ]
  return (
    <View style={[ss.userMenu, { backgroundColor: t.sidebar, borderColor: t.border }]}>
      {/* User info */}
      <View style={[ss.userMenuHeader, { borderBottomColor: t.borderSoft }]}>
        <Avatar letter={avatarLetter} size={34} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[ss.userMenuName, { color: t.text }]} numberOfLines={1}>{displayName || 'Rancho'}</Text>
          <Text style={[ss.userMenuEmail, { color: t.muted }]} numberOfLines={1}>{email || 'usuario@gandia.mx'}</Text>
        </View>
      </View>

      {/* Menu items */}
      <View style={{ paddingVertical: 6, paddingHorizontal: 6 }}>
        {items.map(item => (
          <TouchableOpacity
            key={item.path}
            style={[ss.userMenuItem, { borderRadius: 10 }]}
            onPress={() => onNav(item.path)}
            activeOpacity={0.7}
          >
            <NavIcon name={item.icon} color={t.muted} size={16} />
            <Text style={[ss.userMenuItemText, { color: t.textSub }]}>{item.label}</Text>
          </TouchableOpacity>
        ))}
        <View style={[{ height: 1, marginVertical: 6, marginHorizontal: 4, backgroundColor: t.borderSoft }]} />
        <TouchableOpacity
          style={[ss.userMenuItem, { borderRadius: 10 }]}
          onPress={onLogout}
          activeOpacity={0.7}
        >
          <NavIcon name="logout" color="#ef4444" size={16} />
          <Text style={[ss.userMenuItemText, { color: '#ef4444' }]}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────
function Sidebar({ open, onClose, isDark, pathname, onNav, displayName, email, avatarLetter, ranchName }: {
  open: boolean; onClose: () => void; isDark: boolean; pathname: string
  onNav: (p: string) => void; displayName: string; email: string
  avatarLetter: string; ranchName: string
}) {
  const t          = tokens(isDark)
  const insets     = useSafeAreaInsets()
  const slideX     = useRef(new Animated.Value(-SIDEBAR_W)).current
  const backdropOp = useRef(new Animated.Value(0)).current
  const isOpenRef  = useRef(false)

  useEffect(() => {
    isOpenRef.current = open
    Animated.parallel([
      Animated.spring(slideX, {
        toValue: open ? 0 : -SIDEBAR_W,
        friction: 8, tension: 70, useNativeDriver: true,
      }),
      Animated.timing(backdropOp, {
        toValue: open ? 1 : 0, duration: 220, useNativeDriver: true,
      }),
    ]).start()
  }, [open])

  const isActive = (path: string) => {
    const key = path.split('/').pop() ?? ''
    // Trámites tiene subpáginas — cualquier ruta dentro del folder activa el item
    if (key === 'panel' && pathname?.includes('tramites')) return true
    return pathname?.includes(key)
  }

  const handleNav = (path: string) => {
    onNav(path)
    onClose()
  }

  return (
    <>
      {/* Backdrop — siempre montado, invisible cuando cerrado */}
      <Animated.View
        pointerEvents={open ? 'auto' : 'none'}
        style={[StyleSheet.absoluteFillObject, {
          backgroundColor: 'rgba(0,0,0,0.40)',
          opacity: backdropOp,
          zIndex: 40,
        }]}
      >
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
      </Animated.View>

      {/* Drawer */}
      <Animated.View
        style={[ss.sidebar, {
          backgroundColor: t.sidebar,
          borderRightColor: t.border,
          width: SIDEBAR_W,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          transform: [{ translateX: slideX }],
          zIndex: 50,
        }]}
      >
        {/* Header */}
        <View style={[ss.sidebarHeader, { borderBottomColor: t.borderSoft }]}>
          <View style={ss.sidebarBrand}>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none"
              stroke="#2FAF8F" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <Path d="M12 2L2 7l10 5 10-5-10-5z" />
              <Path d="M2 17l10 5 10-5" />
              <Path d="M2 12l10 5 10-5" />
            </Svg>
            <Text style={[ss.sidebarBrandText, { color: t.text }]}>Gandia 7</Text>
          </View>

          {/* Minimizar sidebar */}
          <TouchableOpacity
            onPress={() => onClose()}
            activeOpacity={0.5}
            style={ss.closeBtn}
          >
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none"
              stroke={t.muted} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <Rect x="3" y="3" width="18" height="18" rx="2" stroke={t.muted} strokeWidth="1.75" fill="none" />
              <Line x1="9" y1="3" x2="9" y2="21" />
            </Svg>
          </TouchableOpacity>
        </View>

        {/* Nav */}
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingVertical: 8, paddingHorizontal: 8 }}
        >
          {NAV_GROUPS.map(group => (
            <View key={group.label} style={ss.navGroup}>
              <Text style={[ss.navGroupLabel, { color: t.mutedLight }]}>{group.label}</Text>
              {group.items.map(item => {
                const active = isActive(item.path)
                return (
                  <TouchableOpacity
                    key={item.path}
                    style={[ss.navItem, { backgroundColor: active ? t.navActive : 'transparent' }]}
                    onPress={() => handleNav(item.path)}
                    activeOpacity={0.7}
                  >
                    <NavIcon name={item.icon} color={active ? '#2FAF8F' : t.muted} size={17} />
                    <Text style={[ss.navItemText, { color: active ? '#2FAF8F' : t.textSub }]}>
                      {item.label}
                    </Text>
                    {active && <View style={ss.activePip} />}
                  </TouchableOpacity>
                )
              })}
            </View>
          ))}
        </ScrollView>

        {/* Footer — solo avatar + nombre + correo → va a configuraciones */}
        <TouchableOpacity
          style={[ss.sidebarFooter, { borderTopColor: t.borderSoft }]}
          onPress={() => handleNav('/(app)/configuraciones')}
          activeOpacity={0.75}
        >
          <Avatar letter={avatarLetter} size={32} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[ss.userFooterName, { color: t.text }]} numberOfLines={1}>
              {displayName || 'Usuario'}
            </Text>
            <Text style={[ss.userFooterSub, { color: t.muted }]} numberOfLines={1}>
              {email || 'usuario@gandia.mx'}
            </Text>
          </View>
          <Svg width={14} height={14} viewBox="0 0 24 24" fill="none"
            stroke={t.mutedLight} strokeWidth="2" strokeLinecap="round">
            <Polyline points="9 18 15 12 9 6" />
          </Svg>
        </TouchableOpacity>
      </Animated.View>
    </>
  )
}

// ─── Main Layout ──────────────────────────────────────────────────────────────
export default function AppLayout() {
  const colorScheme = useColorScheme()
  const isDark      = colorScheme === 'dark'
  const t           = tokens(isDark)
  const router      = useRouter()
  const pathname    = usePathname()
  const insets      = useSafeAreaInsets()

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(2)

  // Datos simulados — tu compañero los conectará a UserContext
  const displayName  = 'Fernando García'
  const email        = 'fernando@gandia.mx'
  const ranchName    = 'Las Delicias'
  const avatarLetter = 'F'

  // Swipe para abrir/cerrar sidebar
  const swipeResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => {
        // Swipe derecha desde el borde izquierdo → abrir
        if (!sidebarOpen && g.dx > 20 && Math.abs(g.dy) < 40 && g.moveX < 40) return true
        // Swipe izquierda cuando está abierto → cerrar
        if (sidebarOpen && g.dx < -20 && Math.abs(g.dy) < 40) return true
        return false
      },
      onPanResponderRelease: (_, g) => {
        if (!sidebarOpen && g.dx > 50) setSidebarOpen(true)
        if (sidebarOpen  && g.dx < -50) setSidebarOpen(false)
      },
    })
  ).current

  const handleNav = (path: string) => {
    router.push(path as any)
  }

  return (
    <View style={[ss.root, { backgroundColor: t.bg }]} {...swipeResponder.panHandlers}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <View style={[ss.header, {
        backgroundColor: t.headerBg,
        borderBottomColor: t.border,
        paddingTop: insets.top + 6,
      }]}>
        <View style={ss.headerRow}>

          {/* Expandir sidebar */}
          <TouchableOpacity onPress={() => setSidebarOpen(true)} style={ss.iconBtn} activeOpacity={0.7}>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none"
              stroke={t.muted} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <Rect x="3" y="3" width="18" height="18" rx="2" fill="none" stroke={t.muted} strokeWidth="1.75" />
              <Line x1="9" y1="3" x2="9" y2="21" />
            </Svg>
          </TouchableOpacity>

          {/* Ranch identity */}
          <TouchableOpacity style={ss.identity} activeOpacity={0.75} onPress={() => router.push('/(app)/perfil/PerfilRouter' as any)}>
            <View style={ss.ranchAvatar}>
              <Text style={ss.ranchAvatarText}>{ranchName.charAt(0).toUpperCase()}</Text>
            </View>
            <Text style={[ss.ranchName, { color: t.text }]} numberOfLines={1}>{ranchName}</Text>
          </TouchableOpacity>

          {/* Spacer */}
          <View style={{ flex: 1 }} />

          {/* Notifications */}
          <TouchableOpacity
            onPress={() => router.push('/(app)/notificaciones' as any)}
            style={ss.iconBtn}
            activeOpacity={0.7}
          >
            <Svg width={19} height={19} viewBox="0 0 24 24" fill="none"
              stroke={t.muted} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <Path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </Svg>
            {unreadCount > 0 && (
              <View style={ss.badge}>
                <Text style={ss.badgeTxt}>{unreadCount > 99 ? '99+' : String(unreadCount)}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Content ────────────────────────────────────────────────────── */}
      <View style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="chat" />
          <Stack.Screen name="noticias" />
          <Stack.Screen name="historial" />
          <Stack.Screen name="tramites/index" />
          <Stack.Screen name="tramites/panel" />
          <Stack.Screen name="notificaciones" />
          <Stack.Screen name="perfil/index" />
          <Stack.Screen name="perfil/PerfilRouter" />
          <Stack.Screen name="perfil/editar" />
          <Stack.Screen name="InstitucionalPerfil/Rancho/index" />
          <Stack.Screen name="InstitucionalPerfil/Rancho/editar" />
          <Stack.Screen name="pasaportes" />
          <Stack.Screen name="gemelos" />
          <Stack.Screen name="monitoreo" />
          <Stack.Screen name="certificacion" />
          <Stack.Screen name="verificacion" />
          <Stack.Screen name="configuraciones" />
          <Stack.Screen name="cfg-notificaciones" />
          <Stack.Screen name="cfg-apariencia" />
          <Stack.Screen name="cfg-seguridad" />
          <Stack.Screen name="cfg-asistente" />
          <Stack.Screen name="cfg-accesibilidad" />
          <Stack.Screen name="ayuda" />
        </Stack>
      </View>

      {/* ── Sidebar Drawer ─────────────────────────────────────────────── */}
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isDark={isDark}
        pathname={pathname}
        onNav={handleNav}
        displayName={displayName}
        email={email}
        avatarLetter={avatarLetter}
        ranchName={ranchName}
      />
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const ss = StyleSheet.create({
  root: { flex: 1 },

  // Header
  header:    { borderBottomWidth: 1 },
  headerRow: {
    height: 50, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, gap: 8,
  },
  iconBtn: {
    width: 34, height: 34,
    alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ranchAvatar: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: '#2FAF8F',
    alignItems: 'center', justifyContent: 'center',
  },
  ranchAvatarText: { color: '#fff', fontFamily: 'Geist-SemiBold', fontSize: 11 },
  ranchName: { fontFamily: 'Geist-SemiBold', fontSize: 13, letterSpacing: -0.2 },
  ranchSub:  { fontFamily: 'Geist-Regular',  fontSize: 10, marginTop: 1 },
  sep:       { width: 1, height: 14, opacity: 0.6 },

  // Badge
  badge: {
    position: 'absolute', top: 3, right: 3,
    minWidth: 14, height: 14, borderRadius: 7,
    backgroundColor: '#ef4444',
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeTxt: { fontFamily: 'Geist-SemiBold', fontSize: 8, color: '#fff' },

  // Ticker
  tickerWrap:      { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tickerLabel:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  tickerDot:       { width: 5, height: 5, borderRadius: 3, backgroundColor: '#2FAF8F' },
  tickerLabelText: { fontFamily: 'Geist-SemiBold', fontSize: 9, letterSpacing: 1, textTransform: 'uppercase' },
  tickerScroll:    { flex: 1, overflow: 'hidden' },
  tickerRow:       { flexDirection: 'row' },
  tickerItem:      { fontFamily: 'Geist-Regular', fontSize: 11, paddingHorizontal: 12, borderRightWidth: 1, width: 220 },

  // Sidebar
  sidebar: {
    position: 'absolute', top: 0, bottom: 0, left: 0,
    borderRightWidth: 1,
    flexDirection: 'column',
    shadowColor: '#000', shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.15, shadowRadius: 20, elevation: 20,
  },
  sidebarHeader: {
    height: 56, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, borderBottomWidth: 1,
  },
  sidebarBrand: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  sidebarBrandText: { fontFamily: 'Geist-SemiBold', fontSize: 15, letterSpacing: -0.2 },
  closeBtn: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },

  // Nav
  navGroup:      { marginBottom: 8 },
  navGroupLabel: {
    fontFamily: 'Geist-SemiBold', fontSize: 9.5,
    letterSpacing: 1.2, textTransform: 'uppercase',
    paddingHorizontal: 10, paddingVertical: 6, marginBottom: 2,
  },
  navItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 10, paddingVertical: 9, borderRadius: 10,
  },
  navItemText:  { fontFamily: 'Geist-Medium', fontSize: 13, flex: 1 },
  activePip:    { width: 5, height: 5, borderRadius: 3, backgroundColor: '#2FAF8F' },

  // Sidebar footer — solo user row
  sidebarFooter: {
    borderTopWidth: 1,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingVertical: 14,
  },
  userFooterName: { fontFamily: 'Geist-Medium',  fontSize: 13 },
  userFooterSub:  { fontFamily: 'Geist-Regular', fontSize: 10, marginTop: 1 },

  // User menu popup
  userMenu: {
    marginHorizontal: 8, marginBottom: 4,
    borderRadius: 16, borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12, shadowRadius: 16, elevation: 8,
    overflow: 'hidden',
  },
  userMenuHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1,
  },
  userMenuName:     { fontFamily: 'Geist-SemiBold', fontSize: 13 },
  userMenuEmail:    { fontFamily: 'Geist-Regular',  fontSize: 11, marginTop: 2 },
  userMenuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 10, paddingVertical: 9,
  },
  userMenuItemText: { fontFamily: 'Geist-Medium', fontSize: 13 },
})