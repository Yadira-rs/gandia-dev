/**
 * GANDIA — Perfil Exportador (React Native)
 * app/(app)/InstitucionalPerfil/Exportador/index.tsx
 *
 * Vista de perfil del exportador.
 * TODO: conectar UserContext y Supabase para poblar `ext`.
 */

import React, { useState, useEffect, useRef } from 'react'
import {
  View, Text, ScrollView, Pressable,
  StyleSheet, useColorScheme, Linking, Animated,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import Svg, { Path, Polyline, Line, Rect, Circle, Defs, Pattern } from 'react-native-svg'

// ─── TOKENS ──────────────────────────────────────────────────────────────────
const BRAND       = '#b45309'
const BRAND_LIGHT = '#fef3c7'
const BRAND_DARK  = '#92400e'

const C = {
  dark: {
    bg:      '#0c0a09',
    surface: '#141210',
    border:  'rgba(255,255,255,0.09)',
    text:    '#fafaf9',
    muted:   'rgba(255,255,255,0.40)',
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
interface DirectivoItem {
  id: string; nombre: string; cargo: string; email: string; telefono: string
}
interface ProveedorItem {
  id: string; nombre: string; estado: string; cabezas: string; clase: 'A' | 'B' | 'C'
}
interface CruceItem {
  id: string; ciudad: string; destino: string; activo: boolean
}
interface CertItem {
  id: string; nombre: string; numero: string; vencimiento: string
  estado: 'vigente' | 'por-vencer' | 'vencido'
}
interface OperacionItem {
  id: string; destino: string; bandera: string; cabezas: string
  porcentaje: number; estado: string
}
interface ExportadorExtended {
  razon_social:           string
  naturaleza:             string
  ubicacion:              string
  fundacion:              number | null
  rfc:                    string
  licencia_usda:          string
  descripcion:            string
  empleados:              number | null
  rastros_tif:            number | null
  corrales_concentracion: number | null
  telefono:               string
  email_contact:          string
  sitio_web:              string
  horario:                string
  tasa_rechazo:           number | null
  cabezas_embarque:       number | null
  cumplimiento_doc:       number | null
  cabezas_anio:           number | null
  paises_destino:         number | null
  valor_exportado:        number | null
  equipo:                 DirectivoItem[]
  proveedores:            ProveedorItem[]
  cruces:                 CruceItem[]
  certificaciones:        CertItem[]
  operaciones:            OperacionItem[]
}

const TABS = ['general', 'empresa', 'contacto'] as const
type Tab = typeof TABS[number]

const AMBER_GRADIENTS = [
  ['#b45309', '#92400e'],
  ['#d97706', '#b45309'],
  ['#f59e0b', '#d97706'],
  ['#fbbf24', '#f59e0b'],
]

// ─── ICONS ───────────────────────────────────────────────────────────────────
const SP = { strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
const IEdit    = ({ c = '#fff', z = 13 }) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke={c} strokeWidth={1.65} {...SP}/><Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const IPin     = ({ c = '#a8a29e', z = 10 }) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke={c} strokeWidth={1.65} {...SP}/><Circle cx="12" cy="10" r="3" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const ICalendar= ({ c = '#a8a29e', z = 10 }) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Rect x="3" y="4" width="18" height="18" rx="2" stroke={c} strokeWidth={1.65} {...SP}/><Line x1="16" y1="2" x2="16" y2="6" stroke={c} strokeWidth={1.65} {...SP}/><Line x1="8" y1="2" x2="8" y2="6" stroke={c} strokeWidth={1.65} {...SP}/><Line x1="3" y1="10" x2="21" y2="10" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const IDoc     = ({ c = '#a8a29e', z = 10 }) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke={c} strokeWidth={1.65} {...SP}/><Polyline points="14 2 14 8 20 8" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const IShield  = ({ c = '#a8a29e', z = 10 }) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const IGlobe   = ({ c = '#78716c', z = 16 }) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Circle cx="12" cy="12" r="10" stroke={c} strokeWidth={1.65} {...SP}/><Line x1="2" y1="12" x2="22" y2="12" stroke={c} strokeWidth={1.65} {...SP}/><Path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10A15.3 15.3 0 0 1 12 2z" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const IPhone   = ({ c = '#78716c', z = 16 }) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.11 12 19.79 19.79 0 0 1 1.04 3.33A2 2 0 0 1 3 1.31h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L7.09 9.09a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const IMail    = ({ c = '#78716c', z = 16 }) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke={c} strokeWidth={1.65} {...SP}/><Polyline points="22,6 12,13 2,6" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const IClock   = ({ c = '#78716c', z = 16 }) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Circle cx="12" cy="12" r="10" stroke={c} strokeWidth={1.65} {...SP}/><Polyline points="12 6 12 12 16 14" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const IChevR   = ({ c = '#a8a29e', z = 14 }) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Polyline points="9 18 15 12 9 6" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const ITruck   = ({ c = '#a8a29e', z = 14 }) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Rect x="1" y="3" width="15" height="13" stroke={c} strokeWidth={1.65} {...SP}/><Polyline points="16 8 20 8 23 11 23 16 16 16 16 8" stroke={c} strokeWidth={1.65} {...SP}/><Circle cx="5.5" cy="18.5" r="2.5" stroke={c} strokeWidth={1.65} {...SP}/><Circle cx="18.5" cy="18.5" r="2.5" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const IArrow   = ({ c = BRAND, z = 13 }) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Polyline points="5 12 19 12" stroke={c} strokeWidth={1.65} {...SP}/><Polyline points="13 6 19 12 13 18" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const ISpark   = ({ c = BRAND, z = 11 }) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const IUsers   = ({ c = '#a8a29e', z = 14 }) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke={c} strokeWidth={1.65} {...SP}/><Circle cx="9" cy="7" r="4" stroke={c} strokeWidth={1.65} {...SP}/><Path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke={c} strokeWidth={1.65} {...SP}/><Path d="M16 3.13a4 4 0 0 1 0 7.75" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const IBox     = ({ c = '#a8a29e', z = 14 }) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const IMap     = ({ c = '#a8a29e', z = 14 }) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Polyline points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" stroke={c} strokeWidth={1.65} {...SP}/><Line x1="8" y1="2" x2="8" y2="18" stroke={c} strokeWidth={1.65} {...SP}/><Line x1="16" y1="6" x2="16" y2="22" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const ICheck   = ({ c = '#16a34a', z = 14 }) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Polyline points="20 6 9 17 4 12" stroke={c} strokeWidth={1.65} {...SP}/></Svg>

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
  const t = isDark ? C.dark : C.light
  return (
    <View style={[{
      backgroundColor: t.surface, borderWidth: 1, borderColor: t.border,
      borderRadius: 18, overflow: 'hidden',
      shadowColor: isDark ? 'transparent' : '#000',
      shadowOpacity: 0.05, shadowRadius: 10,
      shadowOffset: { width: 0, height: 2 }, elevation: isDark ? 0 : 2,
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
  const t = isDark ? C.dark : C.light
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
      <ISpark c={BRAND} z={11} />
      <Text style={{ fontSize: 10, fontWeight: '600', letterSpacing: 1.2, textTransform: 'uppercase', color: t.muted }}>
        {text}
      </Text>
      <View style={{ flex: 1, height: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#ede9e6' }} />
    </View>
  )
}

function StatCard({ value, label }: { value: string; label: string }) {
  const isDark = useColorScheme() === 'dark'
  const t = isDark ? C.dark : C.light
  return (
    <Card style={{ padding: 12, flex: 1 }}>
      <View style={{ position: 'absolute', left: 0, top: 10, bottom: 10, width: 3, borderRadius: 2, backgroundColor: `${BRAND}50` }} />
      <Text style={{ fontSize: 9, fontWeight: '600', letterSpacing: 0.9, textTransform: 'uppercase', color: t.muted, marginBottom: 5 }}>
        {label}
      </Text>
      <Text style={{ fontSize: 18, fontWeight: '600', letterSpacing: -0.5, color: t.text }}>
        {value}
      </Text>
    </Card>
  )
}

function KPIBar({ label, value, reverse }: { label: string; value: number | null; reverse?: boolean }) {
  const isDark = useColorScheme() === 'dark'
  const t = isDark ? C.dark : C.light
  const isGood = reverse ? (value !== null && value <= 1) : (value !== null && value >= 80)
  const barColor = value === null ? t.muted : isGood ? '#16a34a' : BRAND
  if (value === null) return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
        <Text style={{ fontSize: 12, color: t.muted }}>{label}</Text>
        <Text style={{ fontSize: 12, color: t.muted }}>—</Text>
      </View>
      <View style={{ height: 6, backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : '#f0ede9', borderRadius: 3 }} />
    </View>
  )
  const pct = reverse ? Math.max(0, 100 - value * 20) : Math.min(value, 100)
  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
        <Text style={{ fontSize: 12, color: t.muted }}>{label}</Text>
        <Text style={{ fontSize: 12, fontWeight: '600', color: barColor }}>{reverse ? `${value}%` : `${value}%`}</Text>
      </View>
      <View style={{ height: 6, backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : '#f0ede9', borderRadius: 3, overflow: 'hidden' }}>
        <View style={{ height: '100%', width: `${pct}%`, backgroundColor: barColor, borderRadius: 3 }} />
      </View>
    </View>
  )
}

function CertChip({ estado }: { estado: 'vigente' | 'por-vencer' | 'vencido' }) {
  const cfg = {
    vigente:      { bg: 'rgba(34,197,94,0.12)',  text: '#16a34a', dot: '#16a34a', label: 'Vigente' },
    'por-vencer': { bg: 'rgba(245,158,11,0.12)', text: '#d97706', dot: '#f59e0b', label: 'Por vencer' },
    vencido:      { bg: 'rgba(239,68,68,0.12)',  text: '#dc2626', dot: '#ef4444', label: 'Vencido' },
  }[estado]
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99, backgroundColor: cfg.bg }}>
      <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: cfg.dot }} />
      <Text style={{ fontSize: 10, fontWeight: '600', color: cfg.text }}>{cfg.label}</Text>
    </View>
  )
}

function ClaseBadge({ clase }: { clase: 'A' | 'B' | 'C' }) {
  const isA = clase === 'A'
  return (
    <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99, backgroundColor: isA ? 'rgba(34,197,94,0.12)' : `${BRAND}15` }}>
      <Text style={{ fontSize: 10, fontWeight: '700', color: isA ? '#16a34a' : BRAND }}>Clase {clase}</Text>
    </View>
  )
}

function ContactRow({ icon, label, value, href }: {
  icon: React.ReactNode; label: string; value: string; href: string
}) {
  const isDark = useColorScheme() === 'dark'
  const t = isDark ? C.dark : C.light
  return (
    <Pressable
      onPress={() => Linking.openURL(href)}
      style={({ pressed }) => ({
        flexDirection: 'row', alignItems: 'center', gap: 14,
        paddingHorizontal: 16, paddingVertical: 14,
        backgroundColor: pressed ? (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)') : 'transparent',
      })}>
      <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: isDark ? `${BRAND}25` : BRAND_LIGHT, alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 9.5, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase', color: t.muted, marginBottom: 3 }}>
          {label}
        </Text>
        <Text style={{ fontSize: 13, fontWeight: '500', color: t.text }} numberOfLines={1}>
          {value}
        </Text>
      </View>
      <IChevR c={isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.14)'} z={14} />
    </Pressable>
  )
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

export default function PerfilExportador() {
  const router  = useRouter()
  const isDark  = useColorScheme() === 'dark'
  const insets  = useSafeAreaInsets()

  const [tab,     setTab]     = useState<Tab>('general')
  const [loading, setLoading] = useState(false) // TODO: true when fetching
  const [ext,     setExt]     = useState<ExportadorExtended | null>(null)

  // TODO: conectar UserContext — leer profile.personal_data e institutional_data
  const expName    = ext?.razon_social ?? '—'  // profile?.institutional_data?.companyName ?? ext?.razon_social ?? '—'
  const expInitial = expName.charAt(0).toUpperCase()

  // TODO: conectar Supabase
  // useEffect(() => {
  //   const load = async () => {
  //     setLoading(true)
  //     const { data: { session } } = await supabase.auth.getSession()
  //     const uid = session?.user?.id
  //     if (!uid) { setLoading(false); return }
  //     const { data: me } = await supabase
  //       .from('exportador_extended_profiles').select('*').eq('user_id', uid).maybeSingle()
  //     if (me) { setExportadorExtCache(me); setExt(me) }
  //     setLoading(false)
  //   }
  //   load()
  // }, [])

  const t  = isDark ? C.dark : C.light
  const ic = isDark ? '#a8a29e' : '#78716c'

  const stats: [string, string][] = [
    ['Cabezas / Año',   ext?.cabezas_anio    != null ? ext.cabezas_anio.toLocaleString() : '—'],
    ['Países Destino',  ext?.paises_destino  != null ? `${ext.paises_destino}`            : '—'],
    ['Valor (M USD)',   ext?.valor_exportado != null ? `$${ext.valor_exportado}M`          : '—'],
    ['Años operación',  ext?.fundacion       != null ? `${new Date().getFullYear() - ext.fundacion}` : '—'],
  ]

  const contacts = [
    ext?.telefono      ? { icon: <IPhone c={ic} z={16} />, label: 'Oficinas Centrales', value: ext.telefono,      href: `tel:${ext.telefono}` }       : null,
    ext?.email_contact ? { icon: <IMail  c={ic} z={16} />, label: 'Email Comercial',    value: ext.email_contact, href: `mailto:${ext.email_contact}` } : null,
    ext?.sitio_web     ? { icon: <IGlobe c={ic} z={16} />, label: 'Sitio Web',          value: ext.sitio_web,     href: ext.sitio_web.startsWith('http') ? ext.sitio_web : `https://${ext.sitio_web}` } : null,
    ext?.horario       ? { icon: <IClock c={ic} z={16} />, label: 'Horario',            value: ext.horario,       href: '#' }                          : null,
  ].filter(Boolean) as { icon: React.ReactNode; label: string; value: string; href: string }[]

  return (
    <View style={[s.root, { backgroundColor: t.bg }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 90 }}
        showsVerticalScrollIndicator={false}
        bounces
      >

        {/* ══════════════ HERO ══════════════ */}
        <View style={[s.hero, { paddingTop: insets.top }]}>
          <Svg style={StyleSheet.absoluteFillObject} width="100%" height="100%">
            <Defs>
              <Pattern id="checkgrid" width="30" height="30" patternUnits="userSpaceOnUse">
                <Rect x="0" y="0" width="15" height="15" fill="rgba(255,255,255,0.04)" />
                <Rect x="15" y="15" width="15" height="15" fill="rgba(255,255,255,0.04)" />
              </Pattern>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#checkgrid)" />
          </Svg>
          <View style={s.heroGlow} />
          <View style={s.heroCircle1} />
          <View style={s.heroCircle2} />
          {/* Badge */}
          <View style={[s.heroBadgeRow, { top: insets.top + 14, right: 18 }]}>
            <View style={s.heroBadge}>
              <View style={s.heroDot} />
              <Text style={s.heroBadgeLabel}>Exportador Certificado</Text>
            </View>
          </View>
        </View>

        {/* ══════════════ SHEET ══════════════ */}
        <View style={[s.sheet, { backgroundColor: t.bg }]}>

          {/* Handle */}
          <View style={{ alignItems: 'center', paddingTop: 10, paddingBottom: 2 }}>
            <View style={{ width: 32, height: 3, borderRadius: 2, backgroundColor: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.10)' }} />
          </View>

          <View style={s.sheetInner}>

            {/* ── Identity row ── */}
            <View style={s.identityRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 }}>
                {/* Logo / Avatar */}
                <View style={[s.avatar, { backgroundColor: t.surface }]}>
                  {loading
                    ? <Skeleton w={62} h={62} style={{ borderRadius: 16 }} />
                    : (
                      <View style={{ width: '100%', height: '100%', backgroundColor: BRAND_DARK, alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                        <IGlobe c="rgba(255,255,255,0.75)" z={22} />
                        <Text style={{ fontSize: 7, fontWeight: '800', color: 'rgba(255,255,255,0.65)', letterSpacing: 1.5 }}>EXPORT</Text>
                      </View>
                    )
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
                      <View style={[s.roleBadge, { backgroundColor: `${BRAND}18`, borderColor: `${BRAND}28` }]}>
                        <Text style={[s.roleBadgeText, { color: BRAND }]}>
                          {ext?.naturaleza || 'Exportadora Ganadera'}
                        </Text>
                      </View>
                      <Text style={[s.nameText, { color: t.text }]} numberOfLines={2}>
                        {expName}
                      </Text>
                    </>
                  )}
                </View>
              </View>
              {/* Edit button */}
              <Pressable
                onPress={() => router.push('/(app)/InstitucionalPerfil/Exportador/editar' as any)}
                style={({ pressed }) => [s.editBtn, {
                  backgroundColor: isDark ? '#fafaf9' : '#1c1917',
                  opacity: pressed ? 0.82 : 1,
                }]}>
                <IEdit c={isDark ? '#1c1917' : '#fafaf9'} z={13} />
                <Text style={[s.editBtnText, { color: isDark ? '#1c1917' : '#fafaf9' }]}>Editar</Text>
              </Pressable>
            </View>

            {/* Meta row */}
            {!loading && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 4 }}>
                {!!ext?.ubicacion && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <IPin c={t.muted} z={10} />
                    <Text style={{ fontSize: 11.5, color: t.muted }}>{ext.ubicacion}</Text>
                  </View>
                )}
                {!!ext?.fundacion && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <ICalendar c={t.muted} z={10} />
                    <Text style={{ fontSize: 11.5, color: t.muted }}>Fundada en {ext.fundacion}</Text>
                  </View>
                )}
                {!!ext?.rfc && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <IDoc c={t.muted} z={10} />
                    <Text style={{ fontSize: 11.5, color: t.muted }}>RFC: {ext.rfc}</Text>
                  </View>
                )}
                {!!ext?.licencia_usda && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <IShield c={t.muted} z={10} />
                    <Text style={{ fontSize: 11.5, color: t.muted }}>USDA: {ext.licencia_usda}</Text>
                  </View>
                )}
              </View>
            )}

            {/* Tab bar */}
            <View style={[s.tabBar, { borderBottomColor: t.border, marginTop: 18, marginBottom: 22 }]}>
              {TABS.map(tb => (
                <Pressable key={tb} onPress={() => setTab(tb)} style={s.tabBtn}>
                  <Text style={[s.tabText, {
                    color:      tab === tb ? t.text : t.muted,
                    fontWeight: tab === tb ? '600'  : '400',
                  }]}>
                    {tb === 'general' ? 'General' : tb === 'empresa' ? 'Empresa' : 'Contacto'}
                  </Text>
                  {tab === tb && <View style={[s.tabLine, { backgroundColor: BRAND }]} />}
                </Pressable>
              ))}
            </View>

          </View>

          {/* ══════════════ TAB CONTENT ══════════════ */}
          <View style={s.sheetInner}>

            {/* ──────── GENERAL ──────── */}
            {tab === 'general' && (
              <View>

                {/* Descripción */}
                {(loading || !!ext?.descripcion) && (
                  <View style={{ marginBottom: 20 }}>
                    {loading
                      ? <><Skeleton w="100%" h={14} style={{ marginBottom: 8 }} /><Skeleton w="70%" h={14} /></>
                      : <Text style={{ fontSize: 15, fontStyle: 'italic', color: isDark ? 'rgba(255,255,255,0.72)' : '#44403c', lineHeight: 26 }}>
                          {ext?.descripcion}
                        </Text>
                    }
                  </View>
                )}

                {/* Stats grid */}
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 24 }}>
                  {loading
                    ? [0,1,2,3].map(i => <Skeleton key={i} style={{ flex: 1, height: 68, borderRadius: 14 }} h={68} />)
                    : stats.map(([lbl, val]) => <StatCard key={lbl} label={lbl} value={val} />)
                  }
                </View>

                {/* Destinos de exportación */}
                <View style={{ marginBottom: 24 }}>
                  <SectionLabel text="Destinos de exportación" />
                  {loading
                    ? [0,1,2].map(i => <Skeleton key={i} h={90} style={{ borderRadius: 14, marginBottom: 8 }} />)
                    : (ext?.operaciones ?? []).length > 0
                      ? <View style={{ gap: 8 }}>
                          {ext!.operaciones.map(op => {
                            const isActivo = op.estado === 'Activo'
                            return (
                              <Card key={op.id} style={{ padding: 14 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <Text style={{ fontSize: 22 }}>{op.bandera}</Text>
                                    <Text style={{ fontSize: 14, fontWeight: '600', color: t.text }}>{op.destino}</Text>
                                  </View>
                                  <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99, backgroundColor: isActivo ? 'rgba(34,197,94,0.12)' : `${BRAND}15` }}>
                                    <Text style={{ fontSize: 10, fontWeight: '600', color: isActivo ? '#16a34a' : BRAND }}>{op.estado}</Text>
                                  </View>
                                </View>
                                <Text style={{ fontSize: 17, fontWeight: '700', color: BRAND, marginBottom: 2 }}>{op.cabezas}</Text>
                                <Text style={{ fontSize: 11, color: t.muted, marginBottom: 8 }}>cabezas / año</Text>
                                <View style={{ height: 5, backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : '#f0ede9', borderRadius: 3, overflow: 'hidden' }}>
                                  <View style={{ height: '100%', width: `${op.porcentaje}%`, backgroundColor: BRAND, borderRadius: 3 }} />
                                </View>
                                <Text style={{ fontSize: 10, color: t.muted, marginTop: 4 }}>{op.porcentaje}% del volumen total</Text>
                              </Card>
                            )
                          })}
                        </View>
                      : <Card style={{ padding: 32, alignItems: 'center' }}>
                          <Text style={{ fontSize: 12.5, color: t.muted }}>Sin destinos de exportación registrados</Text>
                        </Card>
                  }
                </View>

                {/* Certificaciones */}
                <View style={{ marginBottom: 24 }}>
                  <SectionLabel text="Certificaciones y cumplimiento" />
                  {(ext?.certificaciones ?? []).length > 0
                    ? <Card>
                        {ext!.certificaciones.map((c, i) => (
                          <View key={c.id}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 }}>
                              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: isDark ? `${BRAND}20` : BRAND_LIGHT, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <IShield c={BRAND} z={14} />
                              </View>
                              <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 12.5, fontWeight: '600', color: t.text }} numberOfLines={1}>{c.nombre}</Text>
                                <Text style={{ fontSize: 11, color: t.muted, marginTop: 1 }}>{c.numero} · Vence: {c.vencimiento}</Text>
                              </View>
                              <CertChip estado={c.estado} />
                            </View>
                            {i < ext!.certificaciones.length - 1 && <Divider />}
                          </View>
                        ))}
                      </Card>
                    : !loading && (
                        <Card style={{ padding: 32, alignItems: 'center' }}>
                          <Text style={{ fontSize: 12.5, color: t.muted }}>Sin certificaciones registradas</Text>
                        </Card>
                      )
                  }
                </View>

                {/* Indicadores operativos */}
                <View style={{ marginBottom: 24 }}>
                  <SectionLabel text="Indicadores operativos" />
                  <Card style={{ padding: 16 }}>
                    <View style={{ gap: 16 }}>
                      <KPIBar label="Tasa de rechazo frontera" value={ext?.tasa_rechazo    ?? null} reverse />
                      <KPIBar label="Cumplimiento documental"  value={ext?.cumplimiento_doc ?? null} />
                    </View>
                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
                      {[
                        ['Cab. / embarque', ext?.cabezas_embarque != null ? `${ext.cabezas_embarque}` : '—'],
                        ['Cabezas / año',   ext?.cabezas_anio     != null ? ext.cabezas_anio.toLocaleString() : '—'],
                      ].map(([lbl, val]) => (
                        <View key={lbl} style={{ flex: 1, padding: 12, borderRadius: 12, backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#f7f5f3', alignItems: 'center' }}>
                          <Text style={{ fontSize: 18, fontWeight: '600', color: t.text }}>{val}</Text>
                          <Text style={{ fontSize: 11, color: t.muted, marginTop: 4, textAlign: 'center' }}>{lbl}</Text>
                        </View>
                      ))}
                    </View>
                  </Card>
                </View>

              </View>
            )}

            {/* ──────── EMPRESA ──────── */}
            {tab === 'empresa' && (
              <View>

                {/* Equipo Directivo */}
                <View style={{ marginBottom: 24 }}>
                  <SectionLabel text="Equipo directivo" />
                  {(ext?.equipo ?? []).length > 0
                    ? <Card>
                        {ext!.equipo.map((d, i) => {
                          const [from, to] = AMBER_GRADIENTS[i % AMBER_GRADIENTS.length]
                          return (
                            <View key={d.id}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 }}>
                                <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: from, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                  <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff' }}>{d.nombre.charAt(0)}</Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                  <Text style={{ fontSize: 13, fontWeight: '600', color: t.text }}>{d.nombre}</Text>
                                  <Text style={{ fontSize: 11.5, color: BRAND, fontWeight: '500', marginTop: 1 }}>{d.cargo}</Text>
                                  {!!d.email && <Text style={{ fontSize: 11, color: t.muted, marginTop: 1 }}>{d.email}</Text>}
                                </View>
                              </View>
                              {i < ext!.equipo.length - 1 && <Divider />}
                            </View>
                          )
                        })}
                      </Card>
                    : <Card style={{ padding: 32, alignItems: 'center' }}>
                        <Text style={{ fontSize: 12.5, color: t.muted }}>Sin directivos registrados</Text>
                      </Card>
                  }
                </View>

                {/* Proveedores */}
                <View style={{ marginBottom: 24 }}>
                  <SectionLabel text="Proveedores ganaderos" />
                  {(ext?.proveedores ?? []).length > 0
                    ? <Card>
                        {ext!.proveedores.map((p, i) => (
                          <View key={p.id}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 }}>
                              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: BRAND, flexShrink: 0 }} />
                              <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 13, fontWeight: '500', color: t.text }}>{p.nombre}</Text>
                                <Text style={{ fontSize: 11, color: t.muted, marginTop: 2 }}>{p.estado} · {p.cabezas} cab.</Text>
                              </View>
                              <ClaseBadge clase={p.clase} />
                            </View>
                            {i < ext!.proveedores.length - 1 && <Divider />}
                          </View>
                        ))}
                      </Card>
                    : <Card style={{ padding: 32, alignItems: 'center' }}>
                        <Text style={{ fontSize: 12.5, color: t.muted }}>Sin proveedores registrados</Text>
                      </Card>
                  }
                </View>

                {/* Cruces Fronterizos */}
                <View style={{ marginBottom: 24 }}>
                  <SectionLabel text="Cruces fronterizos" />
                  {(ext?.cruces ?? []).length > 0
                    ? <View style={{ gap: 8 }}>
                        {ext!.cruces.map(c => (
                          <Card key={c.id} style={{ padding: 14 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                              <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: isDark ? `${BRAND}20` : BRAND_LIGHT, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <IArrow c={BRAND} z={13} />
                              </View>
                              <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 13, fontWeight: '600', color: t.text }}>{c.ciudad}</Text>
                                <Text style={{ fontSize: 11.5, color: t.muted, marginTop: 2 }}>→ {c.destino}</Text>
                              </View>
                              {c.activo && (
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                                  <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: '#16a34a' }} />
                                  <Text style={{ fontSize: 11, color: '#16a34a', fontWeight: '500' }}>Activo</Text>
                                </View>
                              )}
                            </View>
                          </Card>
                        ))}
                      </View>
                    : <Card style={{ padding: 32, alignItems: 'center' }}>
                        <Text style={{ fontSize: 12.5, color: t.muted }}>Sin cruces fronterizos registrados</Text>
                      </Card>
                  }
                </View>

                {/* Info empresarial adicional */}
                {ext && (ext.empleados != null || ext.rastros_tif != null || ext.corrales_concentracion != null) && (
                  <View style={{ marginBottom: 24 }}>
                    <SectionLabel text="Infraestructura" />
                    <Card>
                      {[
                        ext.empleados            != null ? ['Empleados',             `${ext.empleados} colaboradores`]       : null,
                        ext.rastros_tif          != null ? ['Rastros TIF',           `${ext.rastros_tif} rastros`]            : null,
                        ext.corrales_concentracion != null ? ['Corrales de concentración', `${ext.corrales_concentracion} instalaciones`] : null,
                      ].filter(Boolean).map((item, i, arr) => { const [lbl, val] = item as string[]; return (
                        <View key={lbl}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 13 }}>
                            <Text style={{ fontSize: 13, color: t.muted }}>{lbl}</Text>
                            <Text style={{ fontSize: 13, fontWeight: '600', color: t.text }}>{val}</Text>
                          </View>
                          {i < arr.length - 1 && <Divider />}
                        </View>
                      )})}
                    </Card>
                  </View>
                )}

              </View>
            )}

            {/* ──────── CONTACTO ──────── */}
            {tab === 'contacto' && (
              <View>

                {contacts.length > 0
                  ? (
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
                  ) : (
                    <View style={{ marginBottom: 24 }}>
                      <SectionLabel text="Información de contacto" />
                      <Card style={{ padding: 32, alignItems: 'center' }}>
                        <Text style={{ fontSize: 12.5, color: t.muted, textAlign: 'center' }}>
                          Agrega tu información de contacto{'\n'}desde "Editar perfil"
                        </Text>
                      </Card>
                    </View>
                  )
                }

                {/* CTA Contactar */}
                {!!ext?.email_contact && (
                  <Pressable
                    onPress={() => Linking.openURL(`mailto:${ext.email_contact}?subject=Contacto Comercial`)}
                    style={({ pressed }) => ({
                      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
                      paddingVertical: 15, borderRadius: 16,
                      backgroundColor: pressed ? BRAND_DARK : BRAND,
                      marginBottom: 24,
                    })}>
                    <IMail c="#fff" z={16} />
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>Contactar Exportador</Text>
                  </Pressable>
                )}

              </View>
            )}

          </View>
        </View>
      </ScrollView>
    </View>
  )
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1 },

  hero: {
    height: 190,
    backgroundColor: '#78350f',
    overflow: 'hidden',
  },
  heroGlow: {
    position: 'absolute',
    left: -40, bottom: -40,
    width: 180, height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(180,83,9,0.45)',
  },
  heroCircle1: {
    position: 'absolute',
    right: -55, top: -55,
    width: 230, height: 230,
    borderRadius: 115,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
  },
  heroCircle2: {
    position: 'absolute',
    right: -8, top: -8,
    width: 150, height: 150,
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
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 99,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
  heroDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fcd34d' },
  heroBadgeLabel: { fontSize: 10, fontWeight: '500', color: 'rgba(255,255,255,0.75)' },

  sheet: {
    marginTop: -22,
    borderTopLeftRadius: 26, borderTopRightRadius: 26,
    flexGrow: 1,
  },
  sheetInner: { paddingHorizontal: 20 },

  identityRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 12, marginBottom: 10, gap: 12,
  },
  avatar: {
    width: 62, height: 62, borderRadius: 16,
    overflow: 'hidden',
    shadowOpacity: 0.18, shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4, flexShrink: 0,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 99, borderWidth: 1,
    marginBottom: 6,
  },
  roleBadgeText: { fontSize: 9.5, fontWeight: '600', letterSpacing: 0.4 },
  nameText: { fontSize: 18, fontWeight: '600', letterSpacing: -0.4 },

  editBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: 12, flexShrink: 0,
  },
  editBtnText: { fontSize: 12.5, fontWeight: '500' },

  tabBar: { flexDirection: 'row', borderBottomWidth: 1 },
  tabBtn: { paddingHorizontal: 14, paddingBottom: 10, position: 'relative' },
  tabText: { fontSize: 12.5 },
  tabLine: { position: 'absolute', bottom: -1, left: 14, right: 14, height: 2, borderRadius: 2 },
})