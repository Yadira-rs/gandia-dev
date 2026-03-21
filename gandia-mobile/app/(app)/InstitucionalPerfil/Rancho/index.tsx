/**
 * GANDIA — PerfilRancho (React Native)
 * src/components/perfil/PerfilRancho.tsx
 *
 * Versión móvil del perfil de rancho productor.
 * Misma lógica de datos que la web, UI nativa.
 */

import React, { useState, useEffect, useRef } from 'react'
import {
  View, Text, ScrollView, Pressable,
  StyleSheet, useColorScheme, Linking, Animated,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import Svg, {
  Path, Polyline, Line, Rect, Circle, Defs, Pattern,
} from 'react-native-svg'


// ─── MODULE-LEVEL CACHE (vacío hasta conectar Supabase) ──────────────────────

// ─── DESIGN TOKENS ───────────────────────────────────────────────────────────

const C = {
  brand:    '#2FAF8F',
  hero:     '#0e1e1a',
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

interface RanchCore {
  ranchName:              string
  operationType:          string
  cattleType:             string
  herdSize:               string
  yearsOfOperation:       string
  location:               string
  sanitaryCertifications: string
  uppNumber:              string
  siniigaNumber:          string
  officialRegistry:       string
  phone:                  string
  role:                   string
}

interface RanchExtended {
  bio:             string
  surface_ha:      number | null
  capacity_heads:  number | null
  active_heads:    number | null
  exportable_pct:  number | null
  founded_year:    number | null
  address_street:  string
  municipality:    string
  postal_code:     string
  lat:             number | null
  lng:             number | null
  email_contact:   string
  website:         string
  grazing_system:  string
  supplementation: string
  water_supply:    string
  infrastructure:  { key: string; label: string; value: string }[]
  certifications:  { label: string; value: string }[]
  mortality_pct:   number | null
  weight_gain_kg:  number | null
  team_members:    { name: string; role: string; ini: string }[]
  team_roles:      string[]
  linked_mvz:      { name: string; license: string; ini: string } | null
}

interface ActivityItem {
  id:    number
  title: string
  desc:  string
  time:  string
  ico:   string
}

const ROLE_LABELS: Record<string, string> = {
  producer: 'Productor Ganadero',
  mvz:      'Médico Veterinario',
  union:    'Unión Ganadera',
  exporter: 'Exportador',
  auditor:  'Auditor / Inspector',
}

const TABS = ['general', 'equipo', 'contacto'] as const
type Tab = typeof TABS[number]

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 60)  return `Hace ${m} min`
  const h = Math.floor(m / 60)
  if (h < 24)  return `Hace ${h} h`
  const d = Math.floor(h / 24)
  if (d === 1) return 'Ayer'
  return `Hace ${d} d`
}

// ─── ICONS ───────────────────────────────────────────────────────────────────

const SP = { strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

const IEdit    = ({ c='#fff',       z=14 }) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke={c} strokeWidth={1.65} {...SP}/><Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const IPin     = ({ c='#a8a29e',   z=10 }) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke={c} strokeWidth={1.65} {...SP}/><Circle cx="12" cy="10" r="3" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const ICal     = ({ c='#a8a29e',   z=10 }) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Rect x="3" y="4" width="18" height="18" rx="2" stroke={c} strokeWidth={1.65} {...SP}/><Line x1="16" y1="2" x2="16" y2="6" stroke={c} strokeWidth={1.65} {...SP}/><Line x1="8" y1="2" x2="8" y2="6" stroke={c} strokeWidth={1.65} {...SP}/><Line x1="3" y1="10" x2="21" y2="10" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const ISpark   = ({ c='#2FAF8F',   z=12 }) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const ICheck   = ({ c='#2FAF8F',   z=11 }) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Polyline points="20 6 9 17 4 12" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const ITrendUp = ({ c='#2FAF8F',   z=10 }) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Polyline points="23 6 13.5 15.5 8.5 10.5 1 18" stroke={c} strokeWidth={1.65} {...SP}/><Polyline points="17 6 23 6 23 12" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const ITrendDn = ({ c='#f43f5e',   z=10 }) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Polyline points="23 18 13.5 8.5 8.5 13.5 1 6" stroke={c} strokeWidth={1.65} {...SP}/><Polyline points="17 18 23 18 23 12" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const IFlat    = ({ c='#a8a29e',   z=10 }) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Line x1="5" y1="12" x2="19" y2="12" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const IChevR   = ({ c='#a8a29e',   z=14 }) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Polyline points="9 18 15 12 9 6" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const IPhone   = ({ c='#78716c',   z=16 }) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.11 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3 1.31h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L7.09 9.09a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const IMail    = ({ c='#78716c',   z=16 }) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke={c} strokeWidth={1.65} {...SP}/><Polyline points="22,6 12,13 2,6" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const IGlobe   = ({ c='#78716c',   z=16 }) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Circle cx="12" cy="12" r="10" stroke={c} strokeWidth={1.65} {...SP}/><Line x1="2" y1="12" x2="22" y2="12" stroke={c} strokeWidth={1.65} {...SP}/><Path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10A15.3 15.3 0 0 1 12 2z" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const IFile    = ({ c='#a8a29e',   z=14 }) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke={c} strokeWidth={1.65} {...SP}/><Polyline points="14 2 14 8 20 8" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const IShield  = ({ c='#a8a29e',   z=14 }) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const IChart   = ({ c='#a8a29e',   z=14 }) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Line x1="18" y1="20" x2="18" y2="10" stroke={c} strokeWidth={1.65} {...SP}/><Line x1="12" y1="20" x2="12" y2="4" stroke={c} strokeWidth={1.65} {...SP}/><Line x1="6" y1="20" x2="6" y2="14" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const IBox     = ({ c='#a8a29e',   z=14 }) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" stroke={c} strokeWidth={1.65} {...SP}/><Polyline points="3.27 6.96 12 12.01 20.73 6.96" stroke={c} strokeWidth={1.65} {...SP}/><Line x1="12" y1="22.08" x2="12" y2="12" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const IDrop    = ({ c='#a8a29e',   z=14 }) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const IHome    = ({ c='#a8a29e',   z=14 }) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke={c} strokeWidth={1.65} {...SP}/><Polyline points="9 22 9 12 15 12 15 22" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const IExtLink = ({ c='#78716c',   z=13 }) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" stroke={c} strokeWidth={1.65} {...SP}/><Polyline points="15 3 21 3 21 9" stroke={c} strokeWidth={1.65} {...SP}/><Line x1="10" y1="14" x2="21" y2="3" stroke={c} strokeWidth={1.65} {...SP}/></Svg>

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
    <Animated.View style={[
      { height: h, borderRadius: 8, opacity,
        backgroundColor: isDark ? 'rgba(255,255,255,0.09)' : '#e7e5e4',
        ...(w !== undefined ? { width: w } : {}),
      },
      style,
    ]} />
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

function Divider() {
  const isDark = useColorScheme() === 'dark'
  return <View style={{ height: 1, backgroundColor: isDark ? C.dark.dim : C.light.dim }} />
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

function StatPill({ label, value }: { label: string; value: string }) {
  const isDark = useColorScheme() === 'dark'
  return (
    <Card style={{ padding: 12, flex: 1 }}>
      <View style={{ position: 'absolute', left: 0, top: 10, bottom: 10, width: 3, borderRadius: 2, backgroundColor: `${C.brand}50` }} />
      <Text style={{ fontSize: 9, fontWeight: '600', letterSpacing: 0.9, textTransform: 'uppercase', color: isDark ? C.dark.muted : C.light.muted, marginBottom: 5 }}>
        {label}
      </Text>
      <Text style={{ fontSize: 20, fontWeight: '600', letterSpacing: -0.5, color: isDark ? C.dark.text : C.light.text }}>
        {value}
      </Text>
    </Card>
  )
}

// ─── KPI CARD ────────────────────────────────────────────────────────────────

function KPICard({ label, value, delta, dir, good, bars }: {
  label: string; value: string; delta: string
  dir: 'up' | 'down' | 'flat'; good: boolean | null
  bars: number[]
}) {
  const isDark   = useColorScheme() === 'dark'
  const barColor = good === true ? C.brand : good === false ? '#f43f5e' : '#a8a29e'
  const chipBg   = good === true  ? `${C.brand}18`
    : good === false ? 'rgba(244,63,94,0.12)'
    : isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'
  const chipTxt  = good === true ? C.brand : good === false ? '#f43f5e' : '#a8a29e'
  return (
    <Card style={{ padding: 16 }}>
      <Text style={{ fontSize: 10, fontWeight: '600', letterSpacing: 1.0, textTransform: 'uppercase', color: isDark ? C.dark.muted : C.light.muted, marginBottom: 10 }}>
        {label}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <Text style={{ fontSize: 28, fontWeight: '600', letterSpacing: -0.8, color: isDark ? C.dark.text : C.light.text }}>
          {value}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 99, backgroundColor: chipBg }}>
          {dir === 'up'   && <ITrendUp c={chipTxt} z={10} />}
          {dir === 'down' && <ITrendDn c={chipTxt} z={10} />}
          {dir === 'flat' && <IFlat    c={chipTxt} z={10} />}
          <Text style={{ fontSize: 10, fontWeight: '600', color: chipTxt }}>{delta}</Text>
        </View>
      </View>
      {/* Mini bar chart */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 36, gap: 3 }}>
        {bars.map((h, i) => {
          const isLast = i === bars.length - 1
          return (
            <View key={i} style={{
              flex: 1,
              height: Math.max(3, (36 * h) / 100),
              borderRadius: 3,
              backgroundColor: isLast ? barColor : `${barColor}40`,
              opacity: isLast ? 1 : 0.45 + i * 0.12,
            }} />
          )
        })}
      </View>
    </Card>
  )
}

// ─── ACTIVITY ROW ────────────────────────────────────────────────────────────

function ActivityRow({ title, desc, time, ico }: ActivityItem) {
  const isDark = useColorScheme() === 'dark'
  const Icon   = ico === 'file' ? IFile : ico === 'shield' ? IShield : ico === 'chart' ? IChart : ICheck
  const ic     = isDark ? '#a8a29e' : '#78716c'
  return (
    <View style={{ flexDirection: 'row', gap: 12, paddingVertical: 14 }}>
      <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#f4f2ef', alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
        <Icon c={ic} z={14} />
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 3 }}>
          <Text style={{ flex: 1, fontSize: 13, fontWeight: '500', color: isDark ? C.dark.text : C.light.text, marginRight: 8 }} numberOfLines={1}>
            {title}
          </Text>
          <Text style={{ fontSize: 10.5, color: isDark ? C.dark.sub : C.light.sub }}>{time}</Text>
        </View>
        <Text style={{ fontSize: 12, color: isDark ? C.dark.muted : C.light.muted, lineHeight: 17 }} numberOfLines={2}>
          {desc}
        </Text>
      </View>
    </View>
  )
}

// ─── INFRA ROW ───────────────────────────────────────────────────────────────

function InfraRow({ label, value, iconKey }: { label: string; value: string; iconKey: string }) {
  const isDark = useColorScheme() === 'dark'
  const Icon   = iconKey === 'drop' ? IDrop : iconKey === 'home' ? IHome : IBox
  const ic     = isDark ? '#a8a29e' : '#78716c'
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13 }}>
      <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#f4f2ef', alignItems: 'center', justifyContent: 'center' }}>
        <Icon c={ic} z={14} />
      </View>
      <Text style={{ flex: 1, fontSize: 13, color: isDark ? 'rgba(255,255,255,0.55)' : '#57534e' }}>{label}</Text>
      <Text style={{ fontSize: 13, fontWeight: '600', color: isDark ? C.dark.text : C.light.text }}>{value}</Text>
    </View>
  )
}

// ─── TEAM ROW ────────────────────────────────────────────────────────────────

function TeamRow({ name, role, ini }: { name: string; role: string; ini: string }) {
  const isDark = useColorScheme() === 'dark'
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 }}>
      <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: C.brand, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 11, fontWeight: '700', color: '#fff' }}>{ini}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 13, fontWeight: '500', color: isDark ? C.dark.text : C.light.text }}>{name}</Text>
        <Text style={{ fontSize: 11, color: isDark ? C.dark.muted : C.light.muted, marginTop: 2 }}>{role}</Text>
      </View>
      <IChevR c={isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.14)'} z={14} />
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

export default function PerfilRancho({ onEdit }: { onEdit?: () => void }) {
  const router      = useRouter()
  const isDark      = useColorScheme() === 'dark'
  const insets      = useSafeAreaInsets()

  const [tab,      setTab]      = useState<Tab>('general')
  const [loading,  setLoading]  = useState(false)
  const [core,     setCore]     = useState<RanchCore | null>(null)
  const [ext,      setExt]      = useState<RanchExtended | null>(null)
  const [activity, setActivity] = useState<ActivityItem[]>([])

  const bg     = isDark ? C.dark.bg     : C.light.bg
  const surface= isDark ? C.dark.surface: C.light.surface
  const text   = isDark ? C.dark.text   : C.light.text
  const muted  = isDark ? C.dark.muted  : C.light.muted
  const border = isDark ? C.dark.border : C.light.border
  const dim    = isDark ? C.dark.dim    : C.light.dim
  const ic     = isDark ? '#a8a29e'     : '#78716c'

  // TODO: conectar UserContext — poblar `core` con personal_data / institutional_data del perfil
  // TODO: conectar Supabase — cargar ranch_extended_profiles y eventos aquí

  // ── Derived ──────────────────────────────────────────────────────────────
  const ranchInitial = core?.ranchName?.charAt(0).toUpperCase() ?? 'R'
  const roleLabel    = ROLE_LABELS[core?.role ?? ''] ?? core?.role ?? ''

  const kpis = [
    { label: 'Mortalidad mensual',     value: ext?.mortality_pct  != null ? `${ext.mortality_pct}%`   : '—', delta: '—', dir: 'flat' as const, good: null as null, bars: [62, 74, 55, 68, 38] },
    { label: 'Ganancia de peso / día', value: ext?.weight_gain_kg != null ? `${ext.weight_gain_kg} kg`: '—', delta: '—', dir: 'flat' as const, good: null as null, bars: [38, 52, 64, 60, 80] },
    { label: 'Animales exportables',   value: ext?.exportable_pct != null ? `${ext.exportable_pct}%`  : '—', delta: '—', dir: 'flat' as const, good: null as null, bars: [54, 57, 61, 64, 65] },
  ]

  const infoGrid: [string, string][] = [
    ['Superficie',      ext?.surface_ha     ? `${ext.surface_ha} ha`      : '—'],
    ['Cap. instalada',  ext?.capacity_heads ? `${ext.capacity_heads} cab.` : '—'],
    ['Activos',         ext?.active_heads   ? `${ext.active_heads} cab.`   : core?.herdSize ?? '—'],
    ['Tipo de ganado',  core?.cattleType    ?? '—'],
    ['Producción',      core?.operationType ?? '—'],
    ['Certificaciones', core?.sanitaryCertifications ?? '—'],
    ['Pastoreo',        ext?.grazing_system  ?? '—'],
    ['Suplementación',  ext?.supplementation ?? '—'],
    ['Agua',            ext?.water_supply    ?? '—'],
  ]

  const contacts = [
    core?.phone && core.phone !== '—'
      ? { icon: <IPhone c={ic} z={16} />, label: 'Teléfono',  value: core.phone,          href: `tel:${core.phone}` }
      : null,
    ext?.email_contact
      ? { icon: <IMail  c={ic} z={16} />, label: 'Correo',    value: ext.email_contact,   href: `mailto:${ext.email_contact}` }
      : null,
    ext?.website
      ? { icon: <IGlobe c={ic} z={16} />, label: 'Sitio web', value: ext.website,         href: ext.website.startsWith('http') ? ext.website : `https://${ext.website}` }
      : null,
  ].filter(Boolean) as { icon: React.ReactNode; label: string; value: string; href: string }[]

  const certRows: [string, string][] = [
    ['Número UPP',       core?.uppNumber     ?? '—'],
    ['Registro SINIIGA', core?.siniigaNumber ?? '—'],
    ...(ext?.certifications.map(c => [c.label, c.value] as [string, string]) ?? []),
  ]

  // ── Render ───────────────────────────────────────────────────────────────
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

          {/* SVG grid pattern */}
          <Svg style={StyleSheet.absoluteFillObject} width="100%" height="100%">
            <Defs>
              <Pattern id="grid" width="28" height="28" patternUnits="userSpaceOnUse">
                <Path d="M 28 0 L 0 0 0 28" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="0.6"/>
              </Pattern>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#grid)" />
          </Svg>

          {/* Glow único sutil derecho-arriba */}
          <View style={s.heroGlowRight} />

          {/* Círculos decorativos */}
          <View style={s.heroCircle1} />
          <View style={s.heroCircle2} />

          {/* Badge Activo */}
          <View style={[s.heroBadgeRow, { top: insets.top + 14, right: 18 }]}>
            <View style={s.heroBadge}>
              <View style={s.heroDot} />
              <Text style={s.heroBadgeLabel}>Activo</Text>
            </View>
          </View>
        </View>

        {/* ══════════════ SHEET ══════════════ */}
        <View style={[s.sheet, { backgroundColor: bg }]}>

          {/* Handle bar */}
          <View style={{ alignItems: 'center', paddingTop: 10, paddingBottom: 2 }}>
            <View style={{ width: 32, height: 3, borderRadius: 2, backgroundColor: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.10)' }} />
          </View>

          <View style={s.sheetInner}>

            {/* ── Identity row ─────────────────────────────────────────── */}
            <View style={s.identityRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 }}>
                {/* Avatar */}
                <View style={[s.avatar, { backgroundColor: surface }]}>
                  {loading
                    ? <Skeleton w={32} h={32} style={{ borderRadius: 8 }} />
                    : <Text style={[s.avatarLetter, { color: C.brand }]}>{ranchInitial}</Text>
                  }
                </View>
                {/* Name + role */}
                <View style={{ flex: 1, minWidth: 0 }}>
                  {loading ? (
                    <>
                      <Skeleton w={80} h={12} style={{ marginBottom: 8 }} />
                      <Skeleton w="85%" h={18} />
                    </>
                  ) : (
                    <>
                      <View style={[s.roleBadge, { backgroundColor: `${C.brand}18`, borderColor: `${C.brand}28` }]}>
                        <Text style={[s.roleBadgeText, { color: C.brand }]}>
                          {roleLabel || 'Productor Ganadero'}
                        </Text>
                      </View>
                      <Text style={[s.ranchName, { color: text }]} numberOfLines={1}>
                        {core?.ranchName ?? '—'}
                      </Text>
                    </>
                  )}
                </View>
              </View>
              {/* Edit button */}
              <Pressable
                onPress={() => router.push('/(app)/InstitucionalPerfil/Rancho/editar' as any)}
                style={({ pressed }) => [s.editBtn, {
                  backgroundColor: isDark ? '#fafaf9' : '#1c1917',
                  opacity: pressed ? 0.82 : 1,
                }]}>
                <IEdit c={isDark ? '#1c1917' : '#fafaf9'} z={13} />
                <Text style={[s.editBtnText, { color: isDark ? '#1c1917' : '#fafaf9' }]}>Editar</Text>
              </Pressable>
            </View>

            {/* ── Meta row ─────────────────────────────────────────────── */}
            {!loading && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 4 }}>
                {core?.location && core.location !== '—' && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <IPin c={muted} z={10} />
                    <Text style={{ fontSize: 11.5, color: muted }}>{core.location}, México</Text>
                  </View>
                )}
                {ext?.founded_year && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <ICal c={muted} z={10} />
                    <Text style={{ fontSize: 11.5, color: muted }}>Fundado en {ext.founded_year}</Text>
                  </View>
                )}
                {core?.yearsOfOperation && core.yearsOfOperation !== '—' && !ext?.founded_year && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <ICal c={muted} z={10} />
                    <Text style={{ fontSize: 11.5, color: muted }}>{core.yearsOfOperation} de operación</Text>
                  </View>
                )}
              </View>
            )}

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

          </View>

          {/* ══════════════ TAB CONTENT ══════════════ */}
          <View style={s.sheetInner}>

            {/* ──────────── GENERAL ──────────── */}
            {tab === 'general' && (
              <View>

                {/* Bio */}
                {(loading || ext?.bio) && (
                  <View style={{ marginBottom: 20 }}>
                    {loading
                      ? <><Skeleton w="100%" h={14} style={{ marginBottom: 8 }} /><Skeleton w="70%" h={14} /></>
                      : <Text style={{ fontSize: 16.5, fontStyle: 'italic', color: isDark ? 'rgba(255,255,255,0.72)' : '#44403c', lineHeight: 28 }}>
                          {ext?.bio}
                        </Text>
                    }
                  </View>
                )}

                {/* Quick stats row */}
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 24 }}>
                  {loading
                    ? [0,1,2,3].map(i => <Skeleton key={i} style={{ flex: 1, height: 68, borderRadius: 14 }} h={68} />)
                    : <>
                        <StatPill label="Ha"       value={ext?.surface_ha     ? `${ext.surface_ha}`      : '—'} />
                        <StatPill label="Cap."     value={ext?.capacity_heads ? `${ext.capacity_heads}`  : '—'} />
                        <StatPill label="Activos"  value={ext?.active_heads   ? `${ext.active_heads}`    : core?.herdSize ?? '—'} />
                        <StatPill label="Export."  value={ext?.exportable_pct ? `${ext.exportable_pct}%` : '—'} />
                      </>
                  }
                </View>

                {/* KPIs */}
                <View style={{ marginBottom: 24 }}>
                  <SectionLabel text="Indicadores clave" />
                  {loading
                    ? [0,1,2].map(i => <Skeleton key={i} h={118} style={{ borderRadius: 16, marginBottom: 10 }} />)
                    : kpis.map((k, i) => (
                        <View key={i} style={{ marginBottom: 10 }}>
                          <KPICard {...k} />
                        </View>
                      ))
                  }
                </View>

                {/* Info grid */}
                <View style={{ marginBottom: 24 }}>
                  <SectionLabel text="Datos del rancho" />
                  <Card>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                      {infoGrid.map(([lbl, val], i) => (
                        <View key={lbl} style={[s.infoCell, {
                          width: '50%',
                          borderBottomWidth: i < infoGrid.length - 2 ? 1 : 0,
                          borderRightWidth:  i % 2 === 0 ? 1 : 0,
                          borderColor: dim,
                        }]}>
                          <Text style={{ fontSize: 9.5, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase', color: muted, marginBottom: 5 }}>
                            {lbl}
                          </Text>
                          <Text style={{ fontSize: 13, fontWeight: '600', color: text }} numberOfLines={1}>
                            {val}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </Card>
                </View>

                {/* Infrastructure */}
                {(ext?.infrastructure ?? []).length > 0 && (
                  <View style={{ marginBottom: 24 }}>
                    <SectionLabel text="Infraestructura" />
                    <Card style={{ paddingHorizontal: 16 }}>
                      {ext!.infrastructure.map((item, i) => (
                        <View key={item.key}>
                          <InfraRow label={item.label} value={item.value} iconKey={item.key} />
                          {i < ext!.infrastructure.length - 1 && <Divider />}
                        </View>
                      ))}
                    </Card>
                  </View>
                )}

                {/* Activity */}
                <View style={{ marginBottom: 24 }}>
                  <SectionLabel text="Actividad reciente" />
                  {loading
                    ? <Card style={{ paddingHorizontal: 16 }}>
                        {[0,1,2].map(i => <Skeleton key={i} h={48} style={{ marginVertical: 8, borderRadius: 12 }} />)}
                      </Card>
                    : activity.length > 0
                      ? <Card style={{ paddingHorizontal: 16 }}>
                          {activity.map((item, i) => (
                            <View key={item.id}>
                              <ActivityRow {...item} />
                              {i < activity.length - 1 && <Divider />}
                            </View>
                          ))}
                        </Card>
                      : <Card style={{ padding: 32, alignItems: 'center' }}>
                          <Text style={{ fontSize: 12.5, color: muted }}>Sin actividad registrada aún</Text>
                        </Card>
                  }
                </View>

              </View>
            )}

            {/* ──────────── EQUIPO ──────────── */}
            {tab === 'equipo' && (
              <View>

                {/* Team members */}
                <View style={{ marginBottom: 24 }}>
                  <SectionLabel text="Miembros del equipo" />
                  {loading
                    ? <Card style={{ paddingHorizontal: 16 }}>
                        {[0,1,2].map(i => <Skeleton key={i} h={48} style={{ marginVertical: 8 }} />)}
                      </Card>
                    : (ext?.team_members ?? []).length > 0
                      ? <Card style={{ paddingHorizontal: 16 }}>
                          {ext!.team_members.map((m, i) => (
                            <View key={i}>
                              <TeamRow {...m} />
                              {i < ext!.team_members.length - 1 && <Divider />}
                            </View>
                          ))}
                        </Card>
                      : <Card style={{ padding: 32, alignItems: 'center' }}>
                          <Text style={{ fontSize: 12.5, color: muted }}>Agrega miembros desde "Editar perfil"</Text>
                        </Card>
                  }
                </View>

                {/* Active roles */}
                {(ext?.team_roles ?? []).length > 0 && (
                  <View style={{ marginBottom: 24 }}>
                    <SectionLabel text="Roles activos" />
                    <Card style={{ padding: 16 }}>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                        {ext!.team_roles.map(r => (
                          <View key={r} style={[s.chip, { backgroundColor: `${C.brand}14`, borderColor: `${C.brand}30` }]}>
                            <ICheck c={C.brand} z={10} />
                            <Text style={{ fontSize: 11.5, fontWeight: '500', color: C.brand }}>{r}</Text>
                          </View>
                        ))}
                      </View>
                    </Card>
                  </View>
                )}

                {/* MVZ vinculado */}
                <View style={{ marginBottom: 24 }}>
                  <SectionLabel text="MVZ certificado vinculado" />
                  {ext?.linked_mvz
                    ? <Card style={{ padding: 14 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                          <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: C.brand, alignItems: 'center', justifyContent: 'center' }}>
                            <Text style={{ fontSize: 11, fontWeight: '700', color: '#fff' }}>{ext.linked_mvz.ini}</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 13, fontWeight: '500', color: text }}>{ext.linked_mvz.name}</Text>
                            <Text style={{ fontSize: 11, color: muted, marginTop: 2 }}>
                              Cédula {ext.linked_mvz.license} · SENASICA verificado
                            </Text>
                          </View>
                          <View style={[s.chip, { backgroundColor: `${C.brand}14`, borderColor: `${C.brand}30` }]}>
                            <ICheck c={C.brand} z={10} />
                            <Text style={{ fontSize: 10.5, fontWeight: '600', color: C.brand }}>Activa</Text>
                          </View>
                        </View>
                      </Card>
                    : !loading && (
                        <Card style={{ padding: 32, alignItems: 'center' }}>
                          <Text style={{ fontSize: 12.5, color: muted }}>Sin MVZ vinculado aún</Text>
                        </Card>
                      )
                  }
                </View>

              </View>
            )}

            {/* ──────────── CONTACTO ──────────── */}
            {tab === 'contacto' && (
              <View>

                {/* Contact links */}
                {contacts.length > 0 && (
                  <View style={{ marginBottom: 24 }}>
                    <SectionLabel text="Información de contacto" />
                    <Card>
                      {contacts.map((c, i) => (
                        <View key={c.label}>
                          <ContactRow {...c} />
                          {i < contacts.length - 1 && (
                            <View style={{ height: 1, marginHorizontal: 16, backgroundColor: dim }} />
                          )}
                        </View>
                      ))}
                    </Card>
                  </View>
                )}

                {/* Location */}
                {(ext?.address_street || ext?.lat) && (
                  <View style={{ marginBottom: 24 }}>
                    <SectionLabel text="Ubicación" />
                    <Card style={{ padding: 16 }}>
                      {ext?.address_street && (
                        <Text style={{ fontSize: 13, fontWeight: '500', color: text, marginBottom: 3 }}>
                          {ext.address_street}
                        </Text>
                      )}
                      <Text style={{ fontSize: 12, color: muted, marginBottom: 14 }}>
                        {[core?.location, 'México', ext?.postal_code].filter(Boolean).join(' · ')}
                      </Text>
                      {ext?.lat && ext?.lng && (
                        <>
                          <View style={{ flexDirection: 'row', gap: 6, marginBottom: 12 }}>
                            {[['Lat', `${ext.lat}° N`], ['Lng', `${ext.lng}° W`], ['Municipio', ext.municipality || '—']].map(([l, v]) => (
                              <View key={l} style={[s.coordCell, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#f7f6f3', flex: 1 }]}>
                                <Text style={{ fontSize: 9.5, fontWeight: '600', letterSpacing: 0.7, textTransform: 'uppercase', color: muted, marginBottom: 4 }}>{l}</Text>
                                <Text style={{ fontSize: 11.5, fontWeight: '600', color: text }} numberOfLines={1}>{v}</Text>
                              </View>
                            ))}
                          </View>
                          <Pressable
                            onPress={() => Linking.openURL(`https://maps.google.com/?q=${ext!.lat},${ext!.lng}`)}
                            style={({ pressed }) => [s.mapsBtn, {
                              backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : '#f0ede9',
                              opacity: pressed ? 0.7 : 1,
                            }]}>
                            <IExtLink c={isDark ? 'rgba(255,255,255,0.45)' : '#78716c'} z={13} />
                            <Text style={{ fontSize: 12.5, fontWeight: '500', color: isDark ? 'rgba(255,255,255,0.55)' : '#57534e' }}>
                              Abrir en Google Maps
                            </Text>
                          </Pressable>
                        </>
                      )}
                    </Card>
                  </View>
                )}

                {/* Certifications */}
                <View style={{ marginBottom: 24 }}>
                  <SectionLabel text="Certificaciones y registro oficial" />
                  <Card>
                    {certRows.map(([k, v], i) => (
                      <View key={k}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, gap: 12 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            <View style={{ width: 24, height: 24, borderRadius: 7, backgroundColor: `${C.brand}14`, alignItems: 'center', justifyContent: 'center' }}>
                              <ICheck c={C.brand} z={11} />
                            </View>
                            <Text style={{ fontSize: 12.5, color: isDark ? 'rgba(255,255,255,0.58)' : '#57534e' }}>{k}</Text>
                          </View>
                          <Text style={{ fontSize: 12, fontWeight: '600', color: muted, textAlign: 'right', flexShrink: 1 }} numberOfLines={1}>{v}</Text>
                        </View>
                        {i < certRows.length - 1 && (
                          <View style={{ height: 1, marginHorizontal: 16, backgroundColor: dim }} />
                        )}
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
  root: {
    flex: 1,
  },
  hero: {
    height: 190,
    backgroundColor: C.hero,
    overflow: 'hidden',
  },
  heroGlowRight: {
    position: 'absolute',
    left: -40,
    bottom: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(47,175,143,0.13)',
  },
  heroCircle1: {
    position: 'absolute',
    right: -55,
    top: -55,
    width: 230,
    height: 230,
    borderRadius: 115,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
  },
  heroCircle2: {
    position: 'absolute',
    right: -8,
    top: -8,
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  heroBadgeRow: {
    position: 'absolute',
    flexDirection: 'row',
    gap: 8,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
    backgroundColor: 'rgba(255,255,255,0.09)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  heroDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34d399',
  },
  heroBadgeLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.6)',
  },
  sheet: {
    marginTop: -22,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    elevation: 0,
    flexGrow: 1,
  },
  sheetInner: {
    paddingHorizontal: 20,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 10,
    gap: 12,
  },
  avatar: {
    width: 62,
    height: 62,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    flexShrink: 0,
  },
  avatarLetter: {
    fontSize: 26,
    fontWeight: '400',
    fontStyle: 'italic',
    lineHeight: 32,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
    borderWidth: 1,
    marginBottom: 6,
  },
  roleBadgeText: {
    fontSize: 9.5,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  ranchName: {
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: -0.4,
    fontStyle: 'italic',
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    flexShrink: 0,
  },
  editBtnText: {
    fontSize: 12.5,
    fontWeight: '500',
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tabBtn: {
    paddingHorizontal: 14,
    paddingBottom: 10,
    position: 'relative',
  },
  tabText: {
    fontSize: 12.5,
  },
  tabLine: {
    position: 'absolute',
    bottom: -1,
    left: 14,
    right: 14,
    height: 2,
    borderRadius: 2,
  },
  infoCell: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 99,
    borderWidth: 1,
  },
  coordCell: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 10,
  },
  mapsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 38,
    borderRadius: 12,
  },
})