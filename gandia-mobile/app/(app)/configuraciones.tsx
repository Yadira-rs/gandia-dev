// app/(app)/configuraciones.tsx — Gandia 7 · Configuraciones (índice)
import { useRef } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  useColorScheme, Alert, Animated,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Path, Line, Circle, Polyline, Rect } from 'react-native-svg'

const BRAND = '#2FAF8F'
const tk = (d: boolean) => ({
  bg:       d ? '#0c0a09' : '#f2f1f0',
  card:     d ? '#141210' : '#ffffff',
  border:   d ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)',
  divider:  d ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)',
  text:     d ? '#fafaf9' : '#1c1917',
  muted:    d ? '#78716c' : '#a8a29e',
  muted2:   d ? '#57534e' : '#c4bfba',
  danger:   '#ef4444',
  dangerBg: d ? 'rgba(239,68,68,0.10)' : 'rgba(239,68,68,0.07)',
})

const si = { fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
const IcoChevron = ({ c }: { c: string }) => (<Svg width={14} height={14} viewBox="0 0 24 24" {...si} stroke={c} strokeWidth="2"><Polyline points="9 18 15 12 9 6" /></Svg>)
const IcoBell    = ({ c }: { c: string }) => (<Svg width={17} height={17} viewBox="0 0 24 24" {...si} stroke={c} strokeWidth="1.75"><Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><Path d="M13.73 21a2 2 0 0 1-3.46 0" /></Svg>)
const IcoSun     = ({ c }: { c: string }) => (<Svg width={17} height={17} viewBox="0 0 24 24" {...si} stroke={c} strokeWidth="1.75"><Circle cx="12" cy="12" r="5" /><Line x1="12" y1="1" x2="12" y2="3" /><Line x1="12" y1="21" x2="12" y2="23" /><Line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><Line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><Line x1="1" y1="12" x2="3" y2="12" /><Line x1="21" y1="12" x2="23" y2="12" /></Svg>)
const IcoShield  = ({ c }: { c: string }) => (<Svg width={17} height={17} viewBox="0 0 24 24" {...si} stroke={c} strokeWidth="1.75"><Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></Svg>)
const IcoSpark   = ({ c }: { c: string }) => (<Svg width={17} height={17} viewBox="0 0 24 24" {...si} stroke={c} strokeWidth="1.75"><Path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></Svg>)
const IcoEye     = ({ c }: { c: string }) => (<Svg width={17} height={17} viewBox="0 0 24 24" {...si} stroke={c} strokeWidth="1.75"><Circle cx="12" cy="12" r="10" /><Path d="M8 14s1.5 2 4 2 4-2 4-2" /><Line x1="9" y1="9" x2="9.01" y2="9" /><Line x1="15" y1="9" x2="15.01" y2="9" /></Svg>)
const IcoHelp    = ({ c }: { c: string }) => (<Svg width={17} height={17} viewBox="0 0 24 24" {...si} stroke={c} strokeWidth="1.75"><Circle cx="12" cy="12" r="10" /><Path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><Circle cx="12" cy="17" r="1" fill={c} /></Svg>)
const IcoLogout  = ({ c }: { c: string }) => (<Svg width={17} height={17} viewBox="0 0 24 24" {...si} stroke={c} strokeWidth="1.75"><Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><Polyline points="16 17 21 12 16 7" /><Line x1="21" y1="12" x2="9" y2="12" /></Svg>)

function Badge({ bg, children }: { bg: string; children: React.ReactNode }) {
  return <View style={[bd.w, { backgroundColor: bg }]}>{children}</View>
}
const bd = StyleSheet.create({ w: { width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center' } })

function Row({ icon, label, sub, value, onPress, last = false, danger = false, isDark }: {
  icon: React.ReactNode; label: string; sub?: string; value?: string
  onPress?: () => void; last?: boolean; danger?: boolean; isDark: boolean
}) {
  const t = tk(isDark)
  const sc = useRef(new Animated.Value(1)).current
  return (
    <>
      <Animated.View style={{ transform: [{ scale: sc }] }}>
        <TouchableOpacity style={rw.row} activeOpacity={1} disabled={!onPress} onPress={onPress}
          onPressIn={() => Animated.spring(sc, { toValue: 0.98, useNativeDriver: true, friction: 8 }).start()}
          onPressOut={() => Animated.spring(sc, { toValue: 1,    useNativeDriver: true, friction: 8 }).start()}>
          <View style={rw.left}>
            {icon}
            <View style={{ flex: 1 }}>
              <Text style={[rw.label, { color: danger ? t.danger : t.text }]}>{label}</Text>
              {sub ? <Text style={[rw.sub, { color: t.muted }]}>{sub}</Text> : null}
            </View>
          </View>
          <View style={rw.right}>
            {value ? <Text style={[rw.val, { color: t.muted }]}>{value}</Text> : null}
            {onPress ? <IcoChevron c={t.muted2} /> : null}
          </View>
        </TouchableOpacity>
      </Animated.View>
      {!last && <View style={[rw.div, { backgroundColor: t.divider, marginLeft: 56 }]} />}
    </>
  )
}
const rw = StyleSheet.create({
  row:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 13, minHeight: 54 },
  left: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  right:{ flexDirection: 'row', alignItems: 'center', gap: 6 },
  label:{ fontFamily: 'Geist-Medium',  fontSize: 14, letterSpacing: -0.1 },
  sub:  { fontFamily: 'Geist-Regular', fontSize: 12, marginTop: 1 },
  val:  { fontFamily: 'Geist-Regular', fontSize: 13 },
  div:  { height: StyleSheet.hairlineWidth },
})

function SLabel({ label }: { label: string }) {
  return <Text style={sl.t}>{label.toUpperCase()}</Text>
}
const sl = StyleSheet.create({ t: { fontFamily: 'Geist-SemiBold', fontSize: 11, letterSpacing: 0.9, color: '#a8a29e', paddingHorizontal: 20, paddingTop: 22, paddingBottom: 7 } })

function Card({ children, isDark }: { children: React.ReactNode; isDark: boolean }) {
  const t = tk(isDark)
  return <View style={[cd.c, { backgroundColor: t.card, borderColor: t.border }]}>{children}</View>
}
const cd = StyleSheet.create({ c: { marginHorizontal: 16, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' } })

export default function ConfiguracionesScreen() {
  const isDark = useColorScheme() === 'dark'
  const t      = tk(isDark)
  const insets = useSafeAreaInsets()
  const router = useRouter()

  const displayName  = 'Fernando García'
  const email        = 'fernando@gandiaapp.com'
  const avatarLetter = 'F'
  const plan         = 'Ganadero'
  const uso          = '1,240 tokens este mes'

  const go = (path: string) => router.push(path as any)

  const handleSignOut = () =>
    Alert.alert('Cerrar sesión', '¿Seguro que quieres cerrar sesión?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar sesión', style: 'destructive', onPress: () => router.replace('/(public)/login' as any) },
    ])

  return (
    <View style={[s.root, { backgroundColor: t.bg }]}>
      <ScrollView showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>

        <Text style={[s.title, { color: t.text }]}>Configuración</Text>

        {/* Perfil */}
        <View style={[s.profileCard, { backgroundColor: t.card, borderColor: t.border }]}>
          <TouchableOpacity style={s.profileInner} onPress={() => go('/(app)/perfil')} activeOpacity={0.8}>
            <View style={s.avatar}>
              <Text style={s.avatarTxt}>{avatarLetter}</Text>
              <View style={s.dot} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.pName,  { color: t.text }]}>{displayName}</Text>
              <Text style={[s.pEmail, { color: t.muted }]}>{email}</Text>
              <Text style={[s.pHint,  { color: BRAND }]}>Ver y editar perfil →</Text>
            </View>
            <IcoChevron c={t.muted2} />
          </TouchableOpacity>
        </View>

        {/* Plan */}
        <SLabel label="Plan" />
        <Card isDark={isDark}>
          <TouchableOpacity style={s.planRow} onPress={() => go('/(app)/plan')} activeOpacity={0.8}>
            <View style={{ gap: 4 }}>
              <View style={[s.planBadge, { backgroundColor: isDark ? 'rgba(47,175,143,0.15)' : 'rgba(47,175,143,0.10)' }]}>
                <Text style={s.planBadgeText}>{plan}</Text>
              </View>
              <Text style={[s.planUsage, { color: t.muted }]}>{uso}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <Text style={[s.planCta, { color: BRAND }]}>Ver uso</Text>
              <IcoChevron c={BRAND} />
            </View>
          </TouchableOpacity>
        </Card>

        {/* Preferencias */}
        <SLabel label="Preferencias" />
        <Card isDark={isDark}>
          <Row isDark={isDark} icon={<Badge bg={isDark ? '#1a2e28' : '#e6f7f2'}><IcoBell  c={BRAND}    /></Badge>} label="Notificaciones" sub="Canales y eventos"          onPress={() => go('/(app)/cfg-notificaciones')} />
          <Row isDark={isDark} icon={<Badge bg={isDark ? '#1a2035' : '#eef2ff'}><IcoSun   c="#818cf8"  /></Badge>} label="Apariencia"    sub="Tema, tipografía e idioma"   onPress={() => go('/(app)/cfg-apariencia')} />
          <Row isDark={isDark} icon={<Badge bg={isDark ? '#2a1a1a' : '#fef2f2'}><IcoShield c="#f87171" /></Badge>} label="Seguridad"     sub="Contraseña y sesiones"        onPress={() => go('/(app)/cfg-seguridad')} />
          <Row isDark={isDark} icon={<Badge bg={isDark ? '#1c1a10' : '#fffbeb'}><IcoSpark  c="#f59e0b" /></Badge>} label="Asistente IA"  sub="Comportamiento y datos"        onPress={() => go('/(app)/cfg-asistente')} />
          <Row isDark={isDark} icon={<Badge bg={isDark ? '#1a2035' : '#eef2ff'}><IcoEye    c="#818cf8" /></Badge>} label="Accesibilidad" sub="Texto y navegación"            onPress={() => go('/(app)/cfg-accesibilidad')} last />
        </Card>

        {/* Soporte */}
        <SLabel label="Soporte" />
        <Card isDark={isDark}>
          <Row isDark={isDark} icon={<Badge bg={isDark ? '#1a2035' : '#eef2ff'}><IcoHelp c="#818cf8" /></Badge>} label="Ayuda y soporte" onPress={() => go('/(app)/ayuda')} last />
        </Card>

        {/* Sesión */}
        <SLabel label="Sesión" />
        <Card isDark={isDark}>
          <Row isDark={isDark} icon={<Badge bg={t.dangerBg}><IcoLogout c={t.danger} /></Badge>} label="Cerrar sesión" onPress={handleSignOut} danger last />
        </Card>

        <Text style={[s.footer, { color: t.muted2 }]}>Gandia 7 · v1.0.0</Text>
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  root:  { flex: 1 },
  title: { fontFamily: 'Geist-SemiBold', fontSize: 26, letterSpacing: -0.5, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 4 },
  profileCard:  { marginHorizontal: 16, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, marginTop: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  profileInner: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  avatar:    { width: 52, height: 52, borderRadius: 16, backgroundColor: BRAND, alignItems: 'center', justifyContent: 'center', shadowColor: BRAND, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 4 },
  avatarTxt: { color: '#fff', fontFamily: 'Geist-SemiBold', fontSize: 20 },
  dot:       { position: 'absolute', bottom: 2, right: 2, width: 10, height: 10, borderRadius: 5, backgroundColor: '#22c55e', borderWidth: 2, borderColor: '#fff' },
  pName:     { fontFamily: 'Geist-SemiBold', fontSize: 15.5, letterSpacing: -0.2 },
  pEmail:    { fontFamily: 'Geist-Regular',  fontSize: 12.5, marginTop: 2 },
  pHint:     { fontFamily: 'Geist-Medium',   fontSize: 12, marginTop: 4 },
  planRow:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  planBadge:     { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 99 },
  planBadgeText: { fontFamily: 'Geist-SemiBold', fontSize: 12, color: BRAND },
  planUsage:     { fontFamily: 'Geist-Regular', fontSize: 12 },
  planCta:       { fontFamily: 'Geist-Medium', fontSize: 13 },
  footer: { fontFamily: 'Geist-Regular', fontSize: 11.5, textAlign: 'center', marginTop: 28, letterSpacing: 0.2 },
})