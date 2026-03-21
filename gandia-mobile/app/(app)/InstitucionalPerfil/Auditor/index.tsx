/**
 * GANDIA — Perfil Auditor (React Native)
 * app/(app)/Auditor/index.tsx
 *
 * Vista de perfil del auditor.
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

// ─── DESIGN TOKENS ──────────────────────────────────────────────────────────
const BRAND = '#6d28d9'
const BRAND_LIGHT = '#ede9fe'
const BRAND_DIM = '#4c1d95'

const C = {
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

// ─── TYPES ──────────────────────────────────────────────────────────────────
interface AmbitoItem {
  id: string; title: string; description: string; nivel: 'Federal' | 'Internacional'
}
interface AuditoriaItem {
  id: string; nombre: string; tipo: string; fecha: string
  resultado: 'aprobado' | 'observaciones' | 'suspendido'; puntuacion: string
}
interface DictamenItem {
  id: string; folio: string; titulo: string; tipo: string; fecha: string
  estado: 'favorable' | 'observaciones' | 'desfavorable'
}
interface NormativaItem {
  id: string; clave: string; desc: string
}
interface AcredItem {
  id: string; nombre: string; vence: string; estado: 'vigente' | 'por-vencer' | 'vencido'
}
interface AuditorExtended {
  titulo:                   string
  ubicacion:                string
  registro_senasica:        string
  organizacion:             string
  anios_exp:                number | null
  descripcion:              string
  telefono:                 string
  email_contact:            string
  sitio_web:                string
  horario:                  string
  auditorias_realizadas:    number | null
  cumplimiento_prom:        number | null
  estados_cubiertos:        number | null
  audits_mes:               number | null
  auditorias_aprobadas:     number | null
  dictamenes_sin_apelacion: number | null
  certs_export_ok:          number | null
  dictamenes_total:         number | null
  ambitos:                  AmbitoItem[]
  auditorias:               AuditoriaItem[]
  dictamenes:               DictamenItem[]
  normativas:               NormativaItem[]
  acreditaciones:           AcredItem[]
}

const TABS = ['general', 'auditorias', 'contacto'] as const
type Tab = typeof TABS[number]

// ─── ICONS ───────────────────────────────────────────────────────────────────
const SP = { strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
const IEdit    = ({ c='#fff', z=13 }) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke={c} strokeWidth={1.65} {...SP}/><Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const IPin     = ({ c='#a8a29e', z=10 }) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke={c} strokeWidth={1.65} {...SP}/><Circle cx="12" cy="10" r="3" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const IShield  = ({ c='#a8a29e', z=14 }) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const ISearch  = ({ c='#a8a29e', z=14 }) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Circle cx="11" cy="11" r="8" stroke={c} strokeWidth={1.65} {...SP}/><Line x1="21" y1="21" x2="16.65" y2="16.65" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const IFile    = ({ c='#a8a29e', z=14 }) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke={c} strokeWidth={1.65} {...SP}/><Polyline points="14 2 14 8 20 8" stroke={c} strokeWidth={1.65} {...SP}/><Path d="M9 15l2 2 4-4" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const IChart   = ({ c='#a8a29e', z=14 }) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Line x1="18" y1="20" x2="18" y2="10" stroke={c} strokeWidth={1.65} {...SP}/><Line x1="12" y1="20" x2="12" y2="4" stroke={c} strokeWidth={1.65} {...SP}/><Line x1="6" y1="20" x2="6" y2="14" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const ICheck   = ({ c='#2FAF8F', z=11 }) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Polyline points="20 6 9 17 4 12" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const IChevR   = ({ c='#a8a29e', z=14 }) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Polyline points="9 18 15 12 9 6" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const IPhone   = ({ c='#78716c', z=16 }) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.11 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3 1.31h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L7.09 9.09a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const IMail    = ({ c='#78716c', z=16 }) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke={c} strokeWidth={1.65} {...SP}/><Polyline points="22,6 12,13 2,6" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const IGlobe   = ({ c='#78716c', z=16 }) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Circle cx="12" cy="12" r="10" stroke={c} strokeWidth={1.65} {...SP}/><Line x1="2" y1="12" x2="22" y2="12" stroke={c} strokeWidth={1.65} {...SP}/><Path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10A15.3 15.3 0 0 1 12 2z" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const IClock   = ({ c='#78716c', z=16 }) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Circle cx="12" cy="12" r="10" stroke={c} strokeWidth={1.65} {...SP}/><Polyline points="12 6 12 12 16 14" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const ISpark   = ({ c=BRAND, z=11 })     => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const IExtLink = ({ c='#78716c', z=13 }) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" stroke={c} strokeWidth={1.65} {...SP}/><Polyline points="15 3 21 3 21 9" stroke={c} strokeWidth={1.65} {...SP}/><Line x1="10" y1="14" x2="21" y2="3" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const IBuilding = ({ c='#a8a29e', z=14 }) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Rect x="4" y="2" width="16" height="20" rx="2" stroke={c} strokeWidth={1.65} {...SP}/><Path d="M9 22v-4h6v4" stroke={c} strokeWidth={1.65} {...SP}/><Path d="M8 6h.01" stroke={c} strokeWidth={2} {...SP}/><Path d="M16 6h.01" stroke={c} strokeWidth={2} {...SP}/><Path d="M12 6h.01" stroke={c} strokeWidth={2} {...SP}/><Path d="M12 10h.01" stroke={c} strokeWidth={2} {...SP}/></Svg>

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
      backgroundColor: t.surface,
      borderWidth: 1,
      borderColor: t.border,
      borderRadius: 18,
      overflow: 'hidden',
      shadowColor: isDark ? 'transparent' : '#000',
      shadowOpacity: 0.05,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 2 },
      elevation: isDark ? 0 : 2,
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

function KPIBar({ label, value }: { label: string; value: number | null }) {
  const isDark = useColorScheme() === 'dark'
  const t = isDark ? C.dark : C.light
  if (value === null) return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
        <Text style={{ fontSize: 12, color: t.muted }}>{label}</Text>
        <Text style={{ fontSize: 12, color: t.muted }}>—</Text>
      </View>
      <View style={{ height: 6, backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : '#f0ede9', borderRadius: 3 }} />
    </View>
  )
  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
        <Text style={{ fontSize: 12, color: t.muted }}>{label}</Text>
        <Text style={{ fontSize: 12, fontWeight: '600', color: BRAND }}>{value}%</Text>
      </View>
      <View style={{ height: 6, backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : '#f0ede9', borderRadius: 3, overflow: 'hidden' }}>
        <View style={{ height: '100%', width: `${value}%`, backgroundColor: BRAND, borderRadius: 3 }} />
      </View>
    </View>
  )
}

function AcredChip({ estado }: { estado: 'vigente' | 'por-vencer' | 'vencido' }) {
  const cfg = {
    vigente:     { bg: 'rgba(34,197,94,0.12)', text: '#16a34a', dot: '#16a34a', label: 'Vigente' },
    'por-vencer':{ bg: 'rgba(245,158,11,0.12)', text: '#d97706', dot: '#f59e0b', label: 'Por vencer' },
    vencido:     { bg: 'rgba(239,68,68,0.12)', text: '#dc2626', dot: '#ef4444', label: 'Vencido' },
  }[estado]
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99, backgroundColor: cfg.bg }}>
      <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: cfg.dot }} />
      <Text style={{ fontSize: 10, fontWeight: '600', color: cfg.text }}>{cfg.label}</Text>
    </View>
  )
}

function ResultBadge({ resultado }: { resultado: 'aprobado' | 'observaciones' | 'suspendido' }) {
  const cfg = {
    aprobado:     { bg: 'rgba(34,197,94,0.12)', text: '#16a34a', label: 'Aprobado' },
    observaciones:{ bg: 'rgba(245,158,11,0.12)', text: '#d97706', label: 'Obs.' },
    suspendido:   { bg: 'rgba(239,68,68,0.12)', text: '#dc2626', label: 'Suspendido' },
  }[resultado]
  return (
    <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99, backgroundColor: cfg.bg }}>
      <Text style={{ fontSize: 10, fontWeight: '600', color: cfg.text }}>{cfg.label}</Text>
    </View>
  )
}

function EstadoBadge({ estado }: { estado: 'favorable' | 'observaciones' | 'desfavorable' }) {
  const cfg = {
    favorable:    { bg: 'rgba(34,197,94,0.12)', text: '#16a34a', label: 'Favorable' },
    observaciones:{ bg: 'rgba(245,158,11,0.12)', text: '#d97706', label: 'Observaciones' },
    desfavorable: { bg: 'rgba(239,68,68,0.12)', text: '#dc2626', label: 'Desfavorable' },
  }[estado]
  return (
    <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99, backgroundColor: cfg.bg }}>
      <Text style={{ fontSize: 10, fontWeight: '600', color: cfg.text }}>{cfg.label}</Text>
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
      <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: isDark ? 'rgba(109,40,217,0.2)' : BRAND_LIGHT, alignItems: 'center', justifyContent: 'center' }}>
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

// ─── MAIN ────────────────────────────────────────────────────────────────────

export default function PerfilAuditor() {
  const router   = useRouter()
  const isDark   = useColorScheme() === 'dark'
  const insets   = useSafeAreaInsets()

  const [tab,     setTab]     = useState<Tab>('general')
  const [loading, setLoading] = useState(false)  // TODO: true when fetching
  const [ext,     setExt]     = useState<AuditorExtended | null>(null)

  // TODO: conectar UserContext — leer `profile.personal_data` y `profile.institutional_data`
  const auditorName = '—'          // profile?.personal_data?.fullName ?? '—'
  const auditorInitial = 'A'       // auditorName.charAt(0).toUpperCase()

  // TODO: conectar Supabase
  // useEffect(() => {
  //   const load = async () => {
  //     setLoading(true)
  //     const { data: { session } } = await supabase.auth.getSession()
  //     const uid = session?.user?.id
  //     if (!uid) { setLoading(false); return }
  //     const { data: me } = await supabase
  //       .from('auditor_extended_profiles').select('*').eq('user_id', uid).maybeSingle()
  //     if (me) { setAuditorExtCache(me); setExt(me) }
  //     setLoading(false)
  //   }
  //   load()
  // }, [])

  const t = isDark ? C.dark : C.light
  const ic = isDark ? '#a8a29e' : '#78716c'

  const stats: [string, string][] = [
    ['Auditorías', ext?.auditorias_realizadas != null ? `${ext.auditorias_realizadas}` : '—'],
    ['Cumplim.', ext?.cumplimiento_prom != null ? `${ext.cumplimiento_prom}%` : '—'],
    ['Estados', ext?.estados_cubiertos != null ? `${ext.estados_cubiertos}` : '—'],
    ['Años exp.', ext?.anios_exp != null ? `${ext.anios_exp}` : '—'],
  ]

  const contacts = [
    ext?.telefono      ? { icon: <IPhone c={ic} z={16} />, label: 'Teléfono',          value: ext.telefono,      href: `tel:${ext.telefono}` }      : null,
    ext?.email_contact ? { icon: <IMail  c={ic} z={16} />, label: 'Email institucional',value: ext.email_contact, href: `mailto:${ext.email_contact}` } : null,
    ext?.sitio_web     ? { icon: <IGlobe c={ic} z={16} />, label: 'Portal / Sitio web', value: ext.sitio_web,     href: ext.sitio_web.startsWith('http') ? ext.sitio_web : `https://${ext.sitio_web}` } : null,
    ext?.horario       ? { icon: <IClock c={ic} z={16} />, label: 'Horario',            value: ext.horario,       href: '#' } : null,
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
              <Pattern id="hexgrid" width="64" height="64" patternUnits="userSpaceOnUse">
                <Path d="M32 0 L64 16 L64 48 L32 64 L0 48 L0 16 Z" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.8"/>
              </Pattern>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#hexgrid)" />
          </Svg>
          {/* Glow */}
          <View style={s.heroGlow} />
          <View style={s.heroCircle1} />
          <View style={s.heroCircle2} />
          {/* Badge */}
          <View style={[s.heroBadgeRow, { top: insets.top + 14, right: 18 }]}>
            <View style={s.heroBadge}>
              <View style={s.heroDot} />
              <Text style={s.heroBadgeLabel}>Auditora Certificada</Text>
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
                {/* Avatar */}
                <View style={[s.avatar, { backgroundColor: t.surface }]}>
                  {loading
                    ? <Skeleton w={32} h={32} style={{ borderRadius: 8 }} />
                    : (
                      <View style={{ width: '100%', height: '100%', backgroundColor: BRAND_DIM, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 26, fontWeight: '700', color: '#fff' }}>{auditorInitial}</Text>
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
                          {ext?.titulo || 'Auditor Oficial'}
                        </Text>
                      </View>
                      <Text style={[s.nameText, { color: t.text }]} numberOfLines={1}>
                        {auditorName}
                      </Text>
                    </>
                  )}
                </View>
              </View>
              {/* Edit button */}
              <Pressable
                onPress={() => router.push('/(app)/InstitucionalPerfil/Auditor/editar' as any)}
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
                {!!ext?.organizacion && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <IBuilding c={t.muted} z={10} />
                    <Text style={{ fontSize: 11.5, color: t.muted }}>{ext.organizacion}</Text>
                  </View>
                )}
                {!!ext?.registro_senasica && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <IShield c={t.muted} z={10} />
                    <Text style={{ fontSize: 11.5, color: t.muted }}>Reg. {ext.registro_senasica}</Text>
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
                    fontWeight: tab === tb ? '600' : '400',
                  }]}>
                    {tb === 'general' ? 'General' : tb === 'auditorias' ? 'Historial' : 'Contacto'}
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

                {/* Bio */}
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

                {/* Ámbito de Inspección */}
                <View style={{ marginBottom: 24 }}>
                  <SectionLabel text="Ámbito de inspección" />
                  {loading
                    ? [0,1,2].map(i => <Skeleton key={i} h={64} style={{ borderRadius: 14, marginBottom: 8 }} />)
                    : (ext?.ambitos ?? []).length > 0
                      ? <View style={{ gap: 8 }}>
                          {ext!.ambitos.map(a => (
                            <Card key={a.id} style={{ padding: 14 }}>
                              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                                <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: `${BRAND}18`, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                  <ISearch c={BRAND} z={14} />
                                </View>
                                <View style={{ flex: 1 }}>
                                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                                    <Text style={{ fontSize: 13, fontWeight: '600', color: t.text }}>{a.title}</Text>
                                    <View style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 99, backgroundColor: a.nivel === 'Internacional' ? 'rgba(59,130,246,0.12)' : `${BRAND}14` }}>
                                      <Text style={{ fontSize: 9.5, fontWeight: '700', color: a.nivel === 'Internacional' ? '#3b82f6' : BRAND }}>{a.nivel}</Text>
                                    </View>
                                  </View>
                                  <Text style={{ fontSize: 12, color: t.muted, lineHeight: 18 }}>{a.description}</Text>
                                </View>
                              </View>
                            </Card>
                          ))}
                        </View>
                      : <Card style={{ padding: 32, alignItems: 'center' }}>
                          <Text style={{ fontSize: 12.5, color: t.muted }}>Sin ámbitos de inspección registrados</Text>
                        </Card>
                  }
                </View>

                {/* Acreditaciones */}
                <View style={{ marginBottom: 24 }}>
                  <SectionLabel text="Acreditaciones y certificaciones" />
                  {(ext?.acreditaciones ?? []).length > 0
                    ? <Card>
                        {ext!.acreditaciones.map((a, i) => (
                          <View key={a.id}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 }}>
                              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: BRAND, flexShrink: 0 }} />
                              <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 13, fontWeight: '500', color: t.text }}>{a.nombre}</Text>
                                <Text style={{ fontSize: 11, color: t.muted, marginTop: 2 }}>Vence: {a.vence}</Text>
                              </View>
                              <AcredChip estado={a.estado} />
                            </View>
                            {i < ext!.acreditaciones.length - 1 && <Divider />}
                          </View>
                        ))}
                      </Card>
                    : !loading && (
                        <Card style={{ padding: 32, alignItems: 'center' }}>
                          <Text style={{ fontSize: 12.5, color: t.muted }}>Sin acreditaciones registradas</Text>
                        </Card>
                      )
                  }
                </View>

                {/* Indicadores KPI */}
                <View style={{ marginBottom: 24 }}>
                  <SectionLabel text="Indicadores de desempeño" />
                  <Card style={{ padding: 16 }}>
                    <View style={{ gap: 16 }}>
                      <KPIBar label="Auditorías aprobadas"      value={ext?.auditorias_aprobadas     ?? null} />
                      <KPIBar label="Dictámenes sin apelación"  value={ext?.dictamenes_sin_apelacion  ?? null} />
                      <KPIBar label="Certs. exportación OK"     value={ext?.certs_export_ok          ?? null} />
                    </View>
                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
                      {[
                        ['Audits / mes', ext?.audits_mes        != null ? `${ext.audits_mes}`        : '—'],
                        ['Dictámenes',   ext?.dictamenes_total   != null ? `${ext.dictamenes_total}`   : '—'],
                      ].map(([lbl, val]) => (
                        <View key={lbl} style={{ flex: 1, padding: 12, borderRadius: 12, backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#f7f5f3', alignItems: 'center' }}>
                          <Text style={{ fontSize: 20, fontWeight: '600', color: t.text }}>{val}</Text>
                          <Text style={{ fontSize: 11, color: t.muted, marginTop: 4 }}>{lbl}</Text>
                        </View>
                      ))}
                    </View>
                  </Card>
                </View>

                {/* Dependencias */}
                <View style={{ marginBottom: 24 }}>
                  <SectionLabel text="Organismos y dependencias" />
                  <Card>
                    {[
                      { siglas: 'SENASICA', nombre: 'Servicio Nacional de Sanidad, Inocuidad y Calidad Agroalimentaria', nivel: 'Federal' },
                      { siglas: 'SAGARPA', nombre: 'Secretaría de Agricultura y Desarrollo Rural', nivel: 'Federal' },
                      { siglas: 'USDA',    nombre: 'U.S. Department of Agriculture — APHIS', nivel: 'Internacional' },
                      { siglas: 'OIE',     nombre: 'Organización Mundial de Sanidad Animal', nivel: 'Internacional' },
                    ].map((dep, i, arr) => (
                      <View key={dep.siglas}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 13 }}>
                          <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: BRAND_DIM, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Text style={{ fontSize: 8.5, fontWeight: '800', color: '#fff', textAlign: 'center', letterSpacing: -0.3 }}>{dep.siglas}</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 12.5, fontWeight: '500', color: t.text }} numberOfLines={2}>{dep.nombre}</Text>
                            <View style={{ marginTop: 4, alignSelf: 'flex-start', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 99, backgroundColor: dep.nivel === 'Internacional' ? 'rgba(59,130,246,0.12)' : `${BRAND}14` }}>
                              <Text style={{ fontSize: 9.5, fontWeight: '600', color: dep.nivel === 'Internacional' ? '#3b82f6' : BRAND }}>{dep.nivel}</Text>
                            </View>
                          </View>
                        </View>
                        {i < arr.length - 1 && <Divider />}
                      </View>
                    ))}
                  </Card>
                </View>

              </View>
            )}

            {/* ──────── HISTORIAL ──────── */}
            {tab === 'auditorias' && (
              <View>

                {/* Auditorías recientes */}
                <View style={{ marginBottom: 24 }}>
                  <SectionLabel text="Auditorías recientes" />
                  {(ext?.auditorias ?? []).length > 0
                    ? <Card>
                        {ext!.auditorias.map((a, i) => (
                          <View key={a.id}>
                            <View style={{ paddingHorizontal: 16, paddingVertical: 14 }}>
                              <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
                                <Text style={{ fontSize: 13, fontWeight: '600', color: t.text, flex: 1, marginRight: 10 }} numberOfLines={1}>{a.nombre}</Text>
                                <ResultBadge resultado={a.resultado} />
                              </View>
                              <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
                                <Text style={{ fontSize: 11.5, color: t.muted }}>{a.tipo}</Text>
                                <Text style={{ fontSize: 11.5, color: t.muted }}>·</Text>
                                <Text style={{ fontSize: 11.5, color: t.muted }}>{a.fecha}</Text>
                                <Text style={{ fontSize: 11.5, color: t.muted }}>·</Text>
                                <Text style={{ fontSize: 11.5, fontWeight: '600', color: BRAND }}>{a.puntuacion}</Text>
                              </View>
                            </View>
                            {i < ext!.auditorias.length - 1 && <Divider />}
                          </View>
                        ))}
                      </Card>
                    : <Card style={{ padding: 32, alignItems: 'center' }}>
                        <Text style={{ fontSize: 12.5, color: t.muted }}>Sin auditorías registradas</Text>
                      </Card>
                  }
                </View>

                {/* Dictámenes */}
                <View style={{ marginBottom: 24 }}>
                  <SectionLabel text="Dictámenes e informes" />
                  {(ext?.dictamenes ?? []).length > 0
                    ? <Card>
                        {ext!.dictamenes.map((d, i) => (
                          <View key={d.id}>
                            <View style={{ paddingHorizontal: 16, paddingVertical: 14 }}>
                              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                                <Text style={{ fontSize: 11, fontWeight: '700', color: BRAND }}>{d.folio}</Text>
                                <Text style={{ fontSize: 11, color: t.muted }}>{d.fecha}</Text>
                              </View>
                              <Text style={{ fontSize: 13, fontWeight: '500', color: t.text, marginBottom: 6 }} numberOfLines={2}>{d.titulo}</Text>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99, backgroundColor: `${BRAND}14` }}>
                                  <Text style={{ fontSize: 10, fontWeight: '600', color: BRAND }}>{d.tipo}</Text>
                                </View>
                                <EstadoBadge estado={d.estado} />
                              </View>
                            </View>
                            {i < ext!.dictamenes.length - 1 && <Divider />}
                          </View>
                        ))}
                      </Card>
                    : <Card style={{ padding: 32, alignItems: 'center' }}>
                        <Text style={{ fontSize: 12.5, color: t.muted }}>Sin dictámenes registrados</Text>
                      </Card>
                  }
                </View>

                {/* Marco normativo */}
                <View style={{ marginBottom: 24 }}>
                  <SectionLabel text="Marco normativo aplicado" />
                  {(ext?.normativas ?? []).length > 0
                    ? <View style={{ gap: 8 }}>
                        {ext!.normativas.map(n => (
                          <Card key={n.id} style={{ padding: 14 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                              <View style={{ paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8, backgroundColor: `${BRAND}14`, flexShrink: 0 }}>
                                <Text style={{ fontSize: 9.5, fontWeight: '800', color: BRAND, letterSpacing: 0.2 }}>{n.clave}</Text>
                              </View>
                              <Text style={{ flex: 1, fontSize: 12, color: t.muted, lineHeight: 18, paddingTop: 2 }}>{n.desc}</Text>
                            </View>
                          </Card>
                        ))}
                      </View>
                    : <Card style={{ padding: 32, alignItems: 'center' }}>
                        <Text style={{ fontSize: 12.5, color: t.muted }}>Sin normativas registradas</Text>
                      </Card>
                  }
                </View>

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
                  )
                  : (
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

                {/* Solicitar auditoría CTA */}
                {!!ext?.email_contact && (
                  <Pressable
                    onPress={() => Linking.openURL(`mailto:${ext.email_contact}?subject=Solicitud de Auditoría`)}
                    style={({ pressed }) => ({
                      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
                      paddingVertical: 15, borderRadius: 16,
                      backgroundColor: pressed ? BRAND_DIM : BRAND,
                      marginBottom: 24,
                    })}>
                    <IMail c="#fff" z={16} />
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>Solicitar Auditoría</Text>
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

// ─── STYLES ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1 },

  hero: {
    height: 190,
    backgroundColor: '#2e1065',
    overflow: 'hidden',
  },
  heroGlow: {
    position: 'absolute',
    left: -40, bottom: -40,
    width: 180, height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(109,40,217,0.35)',
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
  heroDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#c4b5fd' },
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
  nameText: { fontSize: 20, fontWeight: '600', letterSpacing: -0.4 },

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