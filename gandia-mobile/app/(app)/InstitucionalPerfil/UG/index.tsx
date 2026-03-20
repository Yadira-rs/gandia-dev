/**
 * GANDIA — PerfilUG (React Native)
 * app/(app)/InstitucionalPerfil/UG/index.tsx
 *
 * Perfil de Unión Ganadera — solo frontend.
 * TODO: conectar Supabase y UserContext cuando proceda.
 */

import React, { useState, useEffect, useRef } from 'react'
import {
  View, Text, ScrollView, Pressable,
  StyleSheet, useColorScheme, Linking, Animated,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import Svg, {
  Path, Polyline, Line, Rect, Circle, Defs, Pattern, Polygon,
} from 'react-native-svg'

// ─── DESIGN TOKENS ───────────────────────────────────────────────────────────
const C = {
  brand: '#2FAF8F',
  hero:  '#111210',
  dark: {
    bg:      '#0c0a09',
    surface: '#141210',
    border:  'rgba(255,255,255,0.09)',
    text:    '#fafaf9',
    muted:   'rgba(255,255,255,0.4)',
    dim:     'rgba(255,255,255,0.07)',
    sub:     'rgba(255,255,255,0.22)',
  },
  light: {
    bg:      '#fafaf9',
    surface: '#ffffff',
    border:  'rgba(0,0,0,0.08)',
    text:    '#1c1917',
    muted:   'rgba(0,0,0,0.42)',
    dim:     'rgba(0,0,0,0.05)',
    sub:     'rgba(0,0,0,0.25)',
  },
}

// ─── TYPES ───────────────────────────────────────────────────────────────────
interface UGCore {
  ugName:    string
  rfc:       string
  ubicacion: string
  fundacion: number | null
}
interface UGExtended {
  bio:                 string
  naturaleza:          string
  organismo_nacional:  string
  afil_sagarpa:        string
  socios_activos:      number | null
  municipios_count:    number | null
  cabezas_registradas: number | null
  anios_trayectoria:   number | null
  cuota_mensual:       number | null
  proxima_asamblea:    string
  socios_al_corriente: number | null
  tramites_mes:        number | null
  satisfaccion:        number | null
  tramites_activos:    number | null
  tramites_en_proceso: number | null
  telefono:            string
  email_contact:       string
  sitio_web:           string
  horario:             string
  direccion:           string
  directiva:           { id: string; nombre: string; cargo: string; periodo: string }[]
  zonas:               { id: string; zona: string; municipios: string; cabezas: string }[]
  afiliaciones:        { siglas: string; nombre: string; nivel: string }[]
}

const TABS = ['general', 'directiva', 'contacto'] as const
type Tab = typeof TABS[number]

// ─── ICONS ───────────────────────────────────────────────────────────────────
const SP = { strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

const IEdit    = ({ c='#fff',     z=14 }) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke={c} strokeWidth={1.65} {...SP}/><Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const IPin     = ({ c='#a8a29e', z=10 }) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke={c} strokeWidth={1.65} {...SP}/><Circle cx="12" cy="10" r="3" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const ICal     = ({ c='#a8a29e', z=10 }) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Rect x="3" y="4" width="18" height="18" rx="2" stroke={c} strokeWidth={1.65} {...SP}/><Line x1="16" y1="2" x2="16" y2="6" stroke={c} strokeWidth={1.65} {...SP}/><Line x1="8" y1="2" x2="8" y2="6" stroke={c} strokeWidth={1.65} {...SP}/><Line x1="3" y1="10" x2="21" y2="10" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const ISpark   = ({ c='#2FAF8F', z=12 }) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const ICheck   = ({ c='#2FAF8F', z=11 }) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Polyline points="20 6 9 17 4 12" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const IChevR   = ({ c='#a8a29e', z=14 }) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Polyline points="9 18 15 12 9 6" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const IPhone   = ({ c='#78716c', z=16 }) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.11 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3 1.31h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L7.09 9.09a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const IMail    = ({ c='#78716c', z=16 }) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke={c} strokeWidth={1.65} {...SP}/><Polyline points="22,6 12,13 2,6" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const IGlobe   = ({ c='#78716c', z=16 }) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Circle cx="12" cy="12" r="10" stroke={c} strokeWidth={1.65} {...SP}/><Line x1="2" y1="12" x2="22" y2="12" stroke={c} strokeWidth={1.65} {...SP}/><Path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10A15.3 15.3 0 0 1 12 2z" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const IClock   = ({ c='#78716c', z=16 }) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Circle cx="12" cy="12" r="10" stroke={c} strokeWidth={1.65} {...SP}/><Polyline points="12 6 12 12 16 14" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const IUsers   = ({ c='#2FAF8F', z=14 }) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke={c} strokeWidth={1.65} {...SP}/><Circle cx="9" cy="7" r="4" stroke={c} strokeWidth={1.65} {...SP}/><Path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke={c} strokeWidth={1.65} {...SP}/><Path d="M16 3.13a4 4 0 0 1 0 7.75" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const IMap     = ({ c='#2FAF8F', z=14 }) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" stroke={c} strokeWidth={1.65} {...SP}/><Line x1="8" y1="2" x2="8" y2="18" stroke={c} strokeWidth={1.65} {...SP}/><Line x1="16" y1="6" x2="16" y2="22" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const ILayers  = ({ c='#2FAF8F', z=14 }) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Path d="M12 2L2 7l10 5 10-5-10-5z" stroke={c} strokeWidth={1.65} {...SP}/><Path d="M2 17l10 5 10-5" stroke={c} strokeWidth={1.65} {...SP}/><Path d="M2 12l10 5 10-5" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const IShield  = ({ c='#a8a29e', z=14 }) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const IFile    = ({ c='#a8a29e', z=14 }) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke={c} strokeWidth={1.65} {...SP}/><Polyline points="14 2 14 8 20 8" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const IBook    = ({ c='#a8a29e', z=14 }) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" stroke={c} strokeWidth={1.65} {...SP}/><Path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const IDollar  = ({ c='#a8a29e', z=14 }) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Line x1="12" y1="1" x2="12" y2="23" stroke={c} strokeWidth={1.65} {...SP}/><Path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const IExtLink = ({ c='#78716c', z=13 }) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" stroke={c} strokeWidth={1.65} {...SP}/><Polyline points="15 3 21 3 21 9" stroke={c} strokeWidth={1.65} {...SP}/><Line x1="10" y1="14" x2="21" y2="3" stroke={c} strokeWidth={1.65} {...SP}/></Svg>

// ─── PRIMITIVES ──────────────────────────────────────────────────────────────

function Skeleton({ w, h, style }: { w?: number | `${number}%`; h: number; style?: object }) {
  const isDark  = useColorScheme() === 'dark'
  const opacity = useRef(new Animated.Value(1)).current
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.35, duration: 750, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1,    duration: 750, useNativeDriver: true }),
      ])
    )
    loop.start()
    return () => loop.stop()
  }, [])
  return (
    <Animated.View style={[{
      height: h, borderRadius: 8, opacity,
      backgroundColor: isDark ? 'rgba(255,255,255,0.09)' : '#e7e5e4',
      ...(w !== undefined ? { width: w } : {}),
    }, style]} />
  )
}

function Card({ children, style }: { children: React.ReactNode; style?: object }) {
  const isDark = useColorScheme() === 'dark'
  return (
    <View style={[{
      backgroundColor: isDark ? C.dark.surface : C.light.surface,
      borderWidth: 1,
      borderColor:  isDark ? C.dark.border : C.light.border,
      borderRadius: 18,
      overflow: 'hidden',
      shadowColor:   isDark ? 'transparent' : '#000',
      shadowOpacity: 0.05,
      shadowRadius:  10,
      shadowOffset:  { width: 0, height: 2 },
      elevation:     isDark ? 0 : 2,
    }, style]}>
      {children}
    </View>
  )
}

function SectionLabel({ text }: { text: string }) {
  const isDark = useColorScheme() === 'dark'
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
      <ISpark c={C.brand} z={11} />
      <Text style={{ fontSize: 10, fontWeight: '600', letterSpacing: 1.2, textTransform: 'uppercase', color: isDark ? C.dark.muted : C.light.muted }}>
        {text}
      </Text>
      <View style={{ flex: 1, height: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#ede9e6' }} />
    </View>
  )
}

// ─── STAT PILL ───────────────────────────────────────────────────────────────
function StatPill({ label, value, icon }: { label: string; value: string; icon: string }) {
  const isDark = useColorScheme() === 'dark'
  const Icon = icon === 'users' ? IUsers : icon === 'map' ? IMap : icon === 'layers' ? ILayers : IClock
  return (
    <Card style={{ padding: 12, flex: 1 }}>
      <View style={{ position: 'absolute', left: 0, top: 10, bottom: 10, width: 3, borderRadius: 2, backgroundColor: `${C.brand}50` }} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <Icon c={C.brand} z={13} />
        <Text style={{ fontSize: 9, fontWeight: '600', letterSpacing: 0.9, textTransform: 'uppercase', color: isDark ? C.dark.muted : C.light.muted }}>
          {label}
        </Text>
      </View>
      <Text style={{ fontSize: 20, fontWeight: '600', letterSpacing: -0.5, color: isDark ? C.dark.text : C.light.text }}>
        {value}
      </Text>
    </Card>
  )
}

// ─── KPI BAR ─────────────────────────────────────────────────────────────────
function KPIBar({ label, value }: { label: string; value: number | null }) {
  const isDark = useColorScheme() === 'dark'
  if (value === null) return null
  return (
    <View style={{ marginBottom: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <Text style={{ fontSize: 12, fontWeight: '500', color: isDark ? C.dark.muted : C.light.muted }}>{label}</Text>
        <Text style={{ fontSize: 12, fontWeight: '600', color: C.brand }}>{value}%</Text>
      </View>
      <View style={{ height: 6, backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : '#f0eeec', borderRadius: 3, overflow: 'hidden' }}>
        <View style={{ height: 6, width: `${value}%`, backgroundColor: C.brand, borderRadius: 3 }} />
      </View>
    </View>
  )
}

// ─── SERVICE ITEM ────────────────────────────────────────────────────────────
function ServiceItem({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  const isDark = useColorScheme() === 'dark'
  const Icon = icon === 'file' ? IFile : icon === 'dollar' ? IDollar : icon === 'book' ? IBook : icon === 'globe' ? IGlobe : IShield
  const ic = isDark ? '#a8a29e' : '#78716c'
  return (
    <View style={{ flexDirection: 'row', gap: 12, paddingVertical: 14 }}>
      <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#f4f2ef', alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
        <Icon c={ic} z={14} />
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <Text style={{ fontSize: 13, fontWeight: '500', color: isDark ? C.dark.text : C.light.text }}>{title}</Text>
          <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: C.brand }} />
        </View>
        <Text style={{ fontSize: 12, color: isDark ? C.dark.muted : C.light.muted, lineHeight: 17 }} numberOfLines={2}>{desc}</Text>
      </View>
    </View>
  )
}

// ─── ZONA ITEM ───────────────────────────────────────────────────────────────
function ZonaItem({ zona, municipios, cabezas }: { zona: string; municipios: string; cabezas: string }) {
  const isDark = useColorScheme() === 'dark'
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 12 }}>
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: C.brand, marginTop: 6 }} />
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
          <Text style={{ fontSize: 13, fontWeight: '500', color: isDark ? C.dark.text : C.light.text }}>{zona}</Text>
          <Text style={{ fontSize: 12, fontWeight: '600', color: C.brand }}>{cabezas} cab.</Text>
        </View>
        <Text style={{ fontSize: 11.5, color: isDark ? C.dark.muted : C.light.muted }} numberOfLines={1}>{municipios}</Text>
      </View>
    </View>
  )
}

// ─── DIRECTIVO ROW ───────────────────────────────────────────────────────────
function DirectivoRow({ nombre, cargo, periodo }: { nombre: string; cargo: string; periodo: string }) {
  const isDark = useColorScheme() === 'dark'
  const ini = nombre.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 }}>
      <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: isDark ? '#3c3836' : '#292524', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 11, fontWeight: '700', color: '#fff' }}>{ini}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 13, fontWeight: '500', color: isDark ? C.dark.text : C.light.text }}>{nombre}</Text>
        <Text style={{ fontSize: 11, color: C.brand, fontWeight: '500', marginTop: 2 }}>{cargo}</Text>
        <Text style={{ fontSize: 10.5, color: isDark ? C.dark.muted : C.light.muted, marginTop: 1 }}>{periodo}</Text>
      </View>
      <IChevR c={isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.14)'} z={14} />
    </View>
  )
}

// ─── AFILIA ROW ──────────────────────────────────────────────────────────────
function AfiliaRow({ siglas, nombre, nivel }: { siglas: string; nombre: string; nivel: string }) {
  const isDark = useColorScheme() === 'dark'
  const badgeColor =
    nivel === 'Internacional' ? C.brand
    : nivel === 'Nacional'   ? '#f59e0b'
    : '#a8a29e'
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 }}>
      <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: isDark ? '#fafaf9' : '#1c1917', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 8.5, fontWeight: '900', color: isDark ? '#1c1917' : '#fff', textAlign: 'center' }}>{siglas}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 13, fontWeight: '500', color: isDark ? C.dark.text : C.light.text }} numberOfLines={1}>{nombre}</Text>
        <View style={{ alignSelf: 'flex-start', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 99, borderWidth: 1, borderColor: `${badgeColor}30`, backgroundColor: `${badgeColor}12`, marginTop: 3 }}>
          <Text style={{ fontSize: 10, fontWeight: '600', color: badgeColor }}>{nivel}</Text>
        </View>
      </View>
      <ICheck c={C.brand} z={11} />
    </View>
  )
}

// ─── CONTACT ROW ─────────────────────────────────────────────────────────────
function ContactRow({ icon, label, value, href }: {
  icon: React.ReactNode; label: string; value: string; href: string
}) {
  const isDark = useColorScheme() === 'dark'
  return (
    <Pressable
      onPress={() => Linking.openURL(href)}
      style={({ pressed }) => ({
        flexDirection: 'row', alignItems: 'center', gap: 14,
        paddingHorizontal: 16, paddingVertical: 14,
        backgroundColor: pressed
          ? (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)')
          : 'transparent',
      })}>
      <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#f4f2ef', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 9.5, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase', color: isDark ? C.dark.muted : C.light.muted, marginBottom: 3 }}>
          {label}
        </Text>
        <Text style={{ fontSize: 13, fontWeight: '500', color: isDark ? C.dark.text : C.light.text }} numberOfLines={1}>
          {value}
        </Text>
      </View>
      <IChevR c={isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.14)'} z={14} />
    </Pressable>
  )
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function PerfilUG() {
  const router  = useRouter()
  const isDark  = useColorScheme() === 'dark'
  const insets  = useSafeAreaInsets()

  const [tab,  setTab]  = useState<Tab>('general')
  const [core, setCore] = useState<UGCore | null>(null)
  const [ext,  setExt]  = useState<UGExtended | null>(null)

  // TODO: conectar UserContext — poblar `core` con institutional_data del perfil
  // TODO: conectar Supabase — cargar union_extended_profiles aquí

  const bg     = isDark ? C.dark.bg     : C.light.bg
  const surface= isDark ? C.dark.surface: C.light.surface
  const text   = isDark ? C.dark.text   : C.light.text
  const muted  = isDark ? C.dark.muted  : C.light.muted
  const border = isDark ? C.dark.border : C.light.border
  const ic     = isDark ? '#a8a29e'     : '#78716c'

  const ugName   = core?.ugName    ?? 'Unión Ganadera'
  const ugRFC    = core?.rfc       ?? '—'
  const ugUbic   = core?.ubicacion ?? '—'
  const ugFund   = core?.fundacion ?? null
  const ugInitial = ugName.charAt(0).toUpperCase()

  const quickStats = [
    { label: 'Socios Activos',      value: ext?.socios_activos      != null ? ext.socios_activos.toLocaleString() : '—', icon: 'users'  },
    { label: 'Municipios',          value: ext?.municipios_count    != null ? String(ext.municipios_count)        : '—', icon: 'map'    },
    { label: 'Cabezas Reg.',        value: ext?.cabezas_registradas != null ? (ext.cabezas_registradas >= 1000 ? `${Math.round(ext.cabezas_registradas / 1000)}k` : String(ext.cabezas_registradas)) : '—', icon: 'layers' },
    { label: 'Años de Trayectoria', value: ext?.anios_trayectoria   != null ? String(ext.anios_trayectoria)      : '—', icon: 'clock'  },
  ]

  const infoGrid: [string, string][] = [
    ['Naturaleza jurídica',  ext?.naturaleza         || '—'],
    ['Organismo nacional',   ext?.organismo_nacional  || '—'],
    ['Afiliación SAGARPA',   ext?.afil_sagarpa        || '—'],
    ['Municipios cubiertos', ext?.municipios_count    != null ? `${ext.municipios_count} municipios` : '—'],
    ['Cuota mensual',        ext?.cuota_mensual       != null ? `$${ext.cuota_mensual} MXN` : '—'],
    ['RFC',                  ugRFC],
  ]

  const kpisGremiales = [
    { label: 'Socios al corriente',      value: ext?.socios_al_corriente ?? null },
    { label: 'Trámites resueltos (mes)', value: ext?.tramites_mes        ?? null },
    { label: 'Satisfacción de socios',   value: ext?.satisfaccion        ?? null },
  ]

  const SERVICES = [
    { icon: 'file',    title: 'Gestión de Trámites',    desc: 'Asesoría y tramitación ante SENASICA, SAGARPA y dependencias estatales' },
    { icon: 'shield',  title: 'Certificación Sanitaria', desc: 'Emisión de certificados zoosanitarios para movilización y exportación'  },
    { icon: 'shield',  title: 'Asesoría Legal',           desc: 'Representación jurídica en conflictos agrarios y comerciales'           },
    { icon: 'dollar',  title: 'Crédito Ganadero',        desc: 'Acceso preferente a financiamiento con FIRA y Bancomext'               },
    { icon: 'book',    title: 'Capacitación',             desc: 'Cursos de manejo ganadero, nutrición y buenas prácticas'               },
    { icon: 'globe',   title: 'Vinculación Exportadora',  desc: 'Conexión con exportadores certificados y rastros TIF'                  },
  ]

  const contacts = [
    ext?.telefono     ? { icon: <IPhone c={ic} z={16} />, label: 'Teléfono',  value: ext.telefono,      href: `tel:${ext.telefono}` }         : null,
    ext?.email_contact? { icon: <IMail  c={ic} z={16} />, label: 'Email',     value: ext.email_contact, href: `mailto:${ext.email_contact}` }  : null,
    ext?.sitio_web    ? { icon: <IGlobe c={ic} z={16} />, label: 'Sitio web', value: ext.sitio_web,     href: ext.sitio_web.startsWith('http') ? ext.sitio_web : `https://${ext.sitio_web}` } : null,
    ext?.horario      ? { icon: <IClock c={ic} z={16} />, label: 'Horario',   value: ext.horario,       href: '#' }                            : null,
  ].filter(Boolean) as { icon: React.ReactNode; label: string; value: string; href: string }[]

  const ROLES_INSTITUCIONALES = [
    'Presidente', 'Secretaria General', 'Tesorero',
    'Vocal de Sanidad', 'Vocal de Producción', 'Vocal de Exportación',
  ]

  const REGISTROS: [string, string][] = [
    ['RFC',               ugRFC !== '—' ? ugRFC : '—'],
    ['Registro SENASICA', '—'],
    ['Folio CNG',         '—'],
    ['Afiliación SAGARPA','—'],
  ]

  return (
    <View style={[s.root, { backgroundColor: bg }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 90 }}
        showsVerticalScrollIndicator={false}
        bounces
      >
        {/* ══════════════ HERO ══════════════ */}
        <View style={[s.hero, { paddingTop: insets.top }]}>
          {/* Grid */}
          <Svg style={StyleSheet.absoluteFillObject} width="100%" height="100%">
            <Defs>
              <Pattern id="grid" width="28" height="28" patternUnits="userSpaceOnUse">
                <Path d="M 28 0 L 0 0 0 28" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="0.6"/>
              </Pattern>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#grid)" />
          </Svg>
          {/* Teal glow */}
          <View style={s.heroGlowTL} />
          <View style={s.heroGlowBR} />
          <View style={s.heroCircle1} />
          <View style={s.heroCircle2} />
          {/* Badge */}
          <View style={[s.heroBadgeRow, { top: insets.top + 14, right: 18 }]}>
            <View style={s.heroBadge}>
              <View style={s.heroDot} />
              <Text style={s.heroBadgeLabel}>Activo</Text>
            </View>
          </View>
        </View>

        {/* ══════════════ SHEET ══════════════ */}
        <View style={[s.sheet, { backgroundColor: bg }]}>
          {/* Handle */}
          <View style={{ alignItems: 'center', paddingTop: 10, paddingBottom: 2 }}>
            <View style={{ width: 32, height: 3, borderRadius: 2, backgroundColor: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.10)' }} />
          </View>

          <View style={s.sheetInner}>
            {/* ── Identity row ─────────────────────────────────────────── */}
            <View style={s.identityRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 }}>
                {/* Avatar */}
                <View style={[s.avatar, { backgroundColor: surface }]}>
                  <Text style={[s.avatarLetter, { color: C.brand }]}>{ugInitial}</Text>
                </View>
                {/* Name + role */}
                <View style={{ flex: 1, minWidth: 0 }}>
                  <View style={[s.roleBadge, { backgroundColor: `${C.brand}18`, borderColor: `${C.brand}28` }]}>
                    <Text style={[s.roleBadgeText, { color: C.brand }]}>Unión Ganadera</Text>
                  </View>
                  <Text style={[s.ugName, { color: text }]} numberOfLines={2}>
                    {ugName}
                  </Text>
                </View>
              </View>
              {/* Edit button */}
              <Pressable
                onPress={() => router.push('/(app)/InstitucionalPerfil/UG/editar' as any)}
                style={({ pressed }) => [s.editBtn, {
                  backgroundColor: isDark ? '#fafaf9' : '#1c1917',
                  opacity: pressed ? 0.82 : 1,
                }]}>
                <IEdit c={isDark ? '#1c1917' : '#fafaf9'} z={13} />
                <Text style={[s.editBtnText, { color: isDark ? '#1c1917' : '#fafaf9' }]}>Editar</Text>
              </Pressable>
            </View>

            {/* ── Meta row ─────────────────────────────────────────────── */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 4 }}>
              {ugUbic !== '—' && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <IPin c={muted} z={10} />
                  <Text style={{ fontSize: 11.5, color: muted }}>{ugUbic}</Text>
                </View>
              )}
              {ugFund && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <ICal c={muted} z={10} />
                  <Text style={{ fontSize: 11.5, color: muted }}>Fundada en {ugFund}</Text>
                </View>
              )}
            </View>

            {/* ── Tab bar ──────────────────────────────────────────────── */}
            <View style={[s.tabBar, { borderBottomColor: border, marginTop: 18, marginBottom: 22 }]}>
              {TABS.map(t => (
                <Pressable key={t} onPress={() => setTab(t)} style={s.tabBtn}>
                  <Text style={[s.tabText, {
                    color:      tab === t ? text : muted,
                    fontWeight: tab === t ? '600' : '400',
                  }]}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </Text>
                  {tab === t && <View style={[s.tabLine, { backgroundColor: C.brand }]} />}
                </Pressable>
              ))}
            </View>

            {/* ══════════ GENERAL TAB ══════════ */}
            {tab === 'general' && (
              <View>
                {/* Stats 2x2 */}
                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
                  <StatPill {...quickStats[0]} />
                  <StatPill {...quickStats[1]} />
                </View>
                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 24 }}>
                  <StatPill {...quickStats[2]} />
                  <StatPill {...quickStats[3]} />
                </View>

                {/* Bio */}
                {ext?.bio ? (
                  <View style={{ marginBottom: 24 }}>
                    <SectionLabel text="Sobre la unión" />
                    <Card style={{ padding: 16 }}>
                      <Text style={{ fontSize: 13, lineHeight: 20, color: isDark ? 'rgba(255,255,255,0.7)' : '#57534e' }}>
                        {ext.bio}
                      </Text>
                    </Card>
                  </View>
                ) : null}

                {/* Info grid */}
                <View style={{ marginBottom: 24 }}>
                  <SectionLabel text="Datos institucionales" />
                  <Card>
                    {infoGrid.map(([k, v], i) => (
                      <View key={k}>
                        <View style={s.infoCell}>
                          <Text style={{ fontSize: 10, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase', color: muted, marginBottom: 4 }}>{k}</Text>
                          <Text style={{ fontSize: 13, fontWeight: '500', color: text }}>{v}</Text>
                        </View>
                        {i < infoGrid.length - 1 && <View style={{ height: 1, marginHorizontal: 16, backgroundColor: isDark ? C.dark.dim : C.light.dim }} />}
                      </View>
                    ))}
                  </Card>
                </View>

                {/* KPI Gremiales */}
                {kpisGremiales.some(k => k.value !== null) && (
                  <View style={{ marginBottom: 24 }}>
                    <SectionLabel text="Indicadores gremiales" />
                    <Card style={{ padding: 16 }}>
                      {kpisGremiales.map(k => <KPIBar key={k.label} {...k} />)}
                    </Card>
                  </View>
                )}

                {/* Zonas */}
                {(ext?.zonas?.length ?? 0) > 0 && (
                  <View style={{ marginBottom: 24 }}>
                    <SectionLabel text="Cobertura regional" />
                    <Card style={{ paddingHorizontal: 16 }}>
                      {ext!.zonas.map((z, i) => (
                        <View key={z.id}>
                          <ZonaItem {...z} />
                          {i < ext!.zonas.length - 1 && <View style={{ height: 1, backgroundColor: isDark ? C.dark.dim : C.light.dim }} />}
                        </View>
                      ))}
                    </Card>
                  </View>
                )}

                {/* Servicios */}
                <View style={{ marginBottom: 24 }}>
                  <SectionLabel text="Servicios para socios" />
                  <Card style={{ paddingHorizontal: 16 }}>
                    {SERVICES.map((s, i) => (
                      <View key={s.title}>
                        <ServiceItem {...s} />
                        {i < SERVICES.length - 1 && <View style={{ height: 1, backgroundColor: isDark ? C.dark.dim : C.light.dim }} />}
                      </View>
                    ))}
                  </Card>
                </View>
              </View>
            )}

            {/* ══════════ DIRECTIVA TAB ══════════ */}
            {tab === 'directiva' && (
              <View>
                {/* Mesa directiva */}
                <View style={{ marginBottom: 24 }}>
                  <SectionLabel text="Mesa directiva 2023 – 2026" />
                  <Card style={{ paddingHorizontal: 16 }}>
                    {(ext?.directiva?.length ? ext.directiva : []).map((d, i, arr) => (
                      <View key={d.id}>
                        <DirectivoRow {...d} />
                        {i < arr.length - 1 && <View style={{ height: 1, backgroundColor: isDark ? C.dark.dim : C.light.dim }} />}
                      </View>
                    ))}
                  </Card>
                </View>

                {/* Roles institucionales */}
                <View style={{ marginBottom: 24 }}>
                  <SectionLabel text="Roles institucionales activos" />
                  <Card style={{ padding: 16 }}>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                      {ROLES_INSTITUCIONALES.map(r => (
                        <View key={r} style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99, backgroundColor: `${C.brand}12`, borderWidth: 1, borderColor: `${C.brand}28` }}>
                          <ICheck c={C.brand} z={10} />
                          <Text style={{ fontSize: 11.5, fontWeight: '500', color: C.brand }}>{r}</Text>
                        </View>
                      ))}
                    </View>
                  </Card>
                </View>

                {/* Afiliaciones */}
                <View style={{ marginBottom: 24 }}>
                  <SectionLabel text="Afiliaciones y organismos" />
                  <Card style={{ paddingHorizontal: 16 }}>
                    {(ext?.afiliaciones?.length ? ext.afiliaciones : []).map((a, i, arr) => (
                      <View key={a.siglas}>
                        <AfiliaRow {...a} />
                        {i < arr.length - 1 && <View style={{ height: 1, backgroundColor: isDark ? C.dark.dim : C.light.dim }} />}
                      </View>
                    ))}
                  </Card>
                </View>
              </View>
            )}

            {/* ══════════ CONTACTO TAB ══════════ */}
            {tab === 'contacto' && (
              <View>
                {/* Contacto */}
                {contacts.length > 0 && (
                  <View style={{ marginBottom: 24 }}>
                    <SectionLabel text="Información de contacto" />
                    <Card>
                      {contacts.map((c, i) => (
                        <View key={c.label}>
                          <ContactRow {...c} />
                          {i < contacts.length - 1 && <View style={{ height: 1, marginHorizontal: 16, backgroundColor: isDark ? C.dark.dim : C.light.dim }} />}
                        </View>
                      ))}
                    </Card>
                  </View>
                )}

                {/* Sede */}
                <View style={{ marginBottom: 24 }}>
                  <SectionLabel text="Sede institucional" />
                  <Card style={{ padding: 16 }}>
                    <Text style={{ fontSize: 13, fontWeight: '500', color: text, marginBottom: 3 }}>
                      {ext?.direccion || 'Av. 20 de Noviembre 615'}
                    </Text>
                    <Text style={{ fontSize: 12, color: muted, marginBottom: 16 }}>Victoria de Durango, Dgo. · México</Text>

                    {/* Coords grid */}
                    <View style={{ flexDirection: 'row', gap: 1, borderRadius: 12, overflow: 'hidden', backgroundColor: isDark ? C.dark.border : '#e7e5e4', marginBottom: 12 }}>
                      {[['Latitud', '24.0277° N'], ['Longitud', '104.6532° W'], ['Altitud', '1,889 msnm']].map(([l, v]) => (
                        <View key={l} style={{ flex: 1, backgroundColor: isDark ? C.dark.surface : '#fff', padding: 10 }}>
                          <Text style={{ fontSize: 9.5, fontWeight: '600', letterSpacing: 0.9, textTransform: 'uppercase', color: muted, marginBottom: 4 }}>{l}</Text>
                          <Text style={{ fontSize: 11.5, fontWeight: '500', color: text }}>{v}</Text>
                        </View>
                      ))}
                    </View>

                    <Pressable
                      onPress={() => Linking.openURL('https://maps.google.com/?q=24.0277,-104.6532')}
                      style={({ pressed }) => ({
                        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
                        height: 38, borderRadius: 12,
                        backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : '#f0eeec',
                        opacity: pressed ? 0.7 : 1,
                      })}>
                      <IExtLink c={ic} z={13} />
                      <Text style={{ fontSize: 12.5, fontWeight: '500', color: isDark ? C.dark.muted : '#57534e' }}>Abrir en Google Maps</Text>
                    </Pressable>
                  </Card>
                </View>

                {/* Registros oficiales */}
                <View style={{ marginBottom: 24 }}>
                  <SectionLabel text="Registros y certificaciones oficiales" />
                  <Card>
                    {REGISTROS.map(([k, v], i) => (
                      <View key={k}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, gap: 12 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            <View style={{ width: 24, height: 24, borderRadius: 8, backgroundColor: `${C.brand}12`, alignItems: 'center', justifyContent: 'center' }}>
                              <ICheck c={C.brand} z={11} />
                            </View>
                            <Text style={{ fontSize: 12.5, color: isDark ? C.dark.muted : '#57534e' }}>{k}</Text>
                          </View>
                          <Text style={{ fontSize: 12, fontWeight: '500', color: muted, textAlign: 'right' }}>{v}</Text>
                        </View>
                        {i < REGISTROS.length - 1 && <View style={{ height: 1, marginHorizontal: 16, backgroundColor: isDark ? C.dark.dim : C.light.dim }} />}
                      </View>
                    ))}
                  </Card>
                </View>
              </View>
            )}

          </View>
        </View>
      </ScrollView>
    </View>
  )
}

// ─── STYLESHEET ──────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:  { flex: 1 },
  hero: {
    height: 190,
    backgroundColor: C.hero,
    overflow: 'hidden',
  },
  heroGlowTL: {
    position: 'absolute',
    right: -30,
    top: -30,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(47,175,143,0.30)',
  },
  heroGlowBR: {
    position: 'absolute',
    left: -40,
    bottom: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(26,144,112,0.22)',
  },
  heroCircle1: {
    position: 'absolute', right: -55, top: -55,
    width: 230, height: 230, borderRadius: 115,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)',
  },
  heroCircle2: {
    position: 'absolute', right: -8, top: -8,
    width: 150, height: 150, borderRadius: 75,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
  },
  heroBadgeRow: {
    position: 'absolute',
    flexDirection: 'row',
    gap: 8,
  },
  heroBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99,
    backgroundColor: 'rgba(255,255,255,0.09)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
  },
  heroDot:      { width: 6, height: 6, borderRadius: 3, backgroundColor: '#34d399' },
  heroBadgeLabel: { fontSize: 10, fontWeight: '500', color: 'rgba(255,255,255,0.6)' },
  sheet: {
    marginTop: -22,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    flexGrow: 1,
  },
  sheetInner:   { paddingHorizontal: 20 },
  identityRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 12, marginBottom: 10, gap: 12,
  },
  avatar: {
    width: 62, height: 62, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    shadowOpacity: 0.18, shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4, flexShrink: 0,
  },
  avatarLetter: {
    fontSize: 26, fontWeight: '400', fontStyle: 'italic', lineHeight: 32,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 99, borderWidth: 1, marginBottom: 6,
  },
  roleBadgeText: { fontSize: 9.5, fontWeight: '600', letterSpacing: 0.4 },
  ugName: {
    fontSize: 18, fontWeight: '600', letterSpacing: -0.4, fontStyle: 'italic', lineHeight: 24,
  },
  editBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: 12, flexShrink: 0,
  },
  editBtnText: { fontSize: 12.5, fontWeight: '500' },
  tabBar:  { flexDirection: 'row', borderBottomWidth: 1 },
  tabBtn:  { paddingHorizontal: 14, paddingBottom: 10, position: 'relative' },
  tabText: { fontSize: 12.5 },
  tabLine: {
    position: 'absolute', bottom: -1, left: 14, right: 14,
    height: 2, borderRadius: 2,
  },
  infoCell: { paddingHorizontal: 16, paddingVertical: 14 },
})