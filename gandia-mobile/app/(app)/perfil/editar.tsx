// app/(app)/perfil/editar.tsx — Gandia · Editar perfil · Premium UI
import { useState, useRef, useEffect } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, useColorScheme, ActivityIndicator,
  KeyboardAvoidingView, Platform, Animated, Pressable,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Path, Line, Polyline, Circle, Rect, Defs, LinearGradient, Stop, ClipPath, G } from 'react-native-svg'
// TODO: import { supabase } from '../../../lib/supabaseClient'

// ─── TOKENS ──────────────────────────────────────────────────────────────────
const BRAND  = '#2FAF8F'
const BRAND2 = '#0d9e7e'

const tk = (d: boolean) => ({
  bg:         d ? '#0a0908' : '#f4f3f1',
  surface:    d ? '#111110' : '#ffffff',
  surfaceHov: d ? '#161513' : '#f9f8f8',
  border:     d ? 'rgba(255,255,255,0.065)' : 'rgba(0,0,0,0.075)',
  divider:    d ? 'rgba(255,255,255,0.042)' : 'rgba(0,0,0,0.055)',
  text:       d ? '#f5f4f2' : '#171512',
  text2:      d ? '#b8b3ae' : '#57534e',
  muted:      d ? '#6b6560' : '#a8a29e',
  muted2:     d ? '#44403c' : '#d4cfc9',
  label:      d ? '#6b6560' : '#a8a29e',
  locked:     d ? '#0e0d0c' : '#f0efee',
  focusBg:    d ? '#131211' : '#ffffff',
})

// ─── ICONS ────────────────────────────────────────────────────────────────────
const si = { fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

const IBack    = ({ c }: { c: string }) => <Svg width={17} height={17} viewBox="0 0 24 24" {...si} stroke={c} strokeWidth="1.9"><Line x1="19" y1="12" x2="5" y2="12" /><Polyline points="12 19 5 12 12 5" /></Svg>
const IUser    = ({ c }: { c: string }) => <Svg width={16} height={16} viewBox="0 0 24 24" {...si} stroke={c} strokeWidth="1.75"><Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><Circle cx="12" cy="7" r="4" /></Svg>
const IMail    = ({ c }: { c: string }) => <Svg width={16} height={16} viewBox="0 0 24 24" {...si} stroke={c} strokeWidth="1.75"><Path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><Polyline points="22,6 12,13 2,6" /></Svg>
const IPhone   = ({ c }: { c: string }) => <Svg width={16} height={16} viewBox="0 0 24 24" {...si} stroke={c} strokeWidth="1.75"><Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.59 1.22h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.83a16 16 0 0 0 6 6l.92-.92a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 21.71 16.92z" /></Svg>
const IShield  = ({ c }: { c: string }) => <Svg width={16} height={16} viewBox="0 0 24 24" {...si} stroke={c} strokeWidth="1.75"><Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></Svg>
const ILock    = ({ c }: { c: string }) => <Svg width={12} height={12} viewBox="0 0 24 24" {...si} stroke={c} strokeWidth="1.9"><Rect x="3" y="11" width="18" height="11" rx="2" /><Path d="M7 11V7a5 5 0 0 1 10 0v4" /></Svg>
const ICamera  = ({ c }: { c: string }) => <Svg width={14} height={14} viewBox="0 0 24 24" {...si} stroke={c} strokeWidth="1.75"><Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><Circle cx="12" cy="13" r="4" /></Svg>
const ICheck   = ({ c }: { c: string }) => <Svg width={15} height={15} viewBox="0 0 24 24" {...si} stroke={c} strokeWidth="2.2"><Polyline points="20 6 9 17 4 12" /></Svg>

// ─── ROLE MAP ─────────────────────────────────────────────────────────────────
const ROLE_LABELS: Record<string, string> = {
  producer: 'Productor Ganadero',
  mvz:      'Médico Veterinario Zootecnista',
  union:    'Unión Ganadera',
  exporter: 'Exportador',
  auditor:  'Auditor / Inspector',
}

// ─── AVATAR ──────────────────────────────────────────────────────────────────
function Avatar({ name, isDark }: { name: string; isDark: boolean }) {
  const initial = name.trim().charAt(0).toUpperCase() || '?'
  const pulse   = useRef(new Animated.Value(1)).current

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.06, duration: 2200, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1,    duration: 2200, useNativeDriver: true }),
      ])
    )
    loop.start()
    return () => loop.stop()
  }, [])

  return (
    <View style={av.container}>
      {/* Animated gradient ring */}
      <Animated.View style={[av.ring, { transform: [{ scale: pulse }] }]}>
        <Svg width={96} height={96} viewBox="0 0 96 96">
          <Defs>
            <LinearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor={BRAND} stopOpacity="0.9" />
              <Stop offset="50%" stopColor="#0ecf9e" stopOpacity="0.4" />
              <Stop offset="100%" stopColor={BRAND} stopOpacity="0.1" />
            </LinearGradient>
          </Defs>
          <Circle cx="48" cy="48" r="46" fill="none" stroke="url(#ringGrad)" strokeWidth="1.5" />
        </Svg>
      </Animated.View>

      {/* Avatar circle */}
      <View style={[av.circle, {
        backgroundColor: isDark ? '#1a1916' : '#f0faf7',
        borderColor: isDark ? `${BRAND}22` : `${BRAND}20`,
      }]}>
        <Text style={[av.initial, { color: BRAND }]}>{initial}</Text>
      </View>

      {/* Camera badge */}
      <View style={[av.badge, {
        backgroundColor: isDark ? '#1c1b19' : '#fff',
        borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)',
      }]}>
        <ICamera c={isDark ? '#a8a29e' : '#78716c'} />
      </View>
    </View>
  )
}

const av = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', width: 96, height: 96 },
  ring:      { position: 'absolute', width: 96, height: 96 },
  circle:    {
    width: 80, height: 80, borderRadius: 40,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5,
  },
  initial:   { fontFamily: 'Geist-SemiBold', fontSize: 30, letterSpacing: -0.5 },
  badge: {
    position: 'absolute', right: -2, bottom: 2,
    width: 26, height: 26, borderRadius: 13,
    borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
})

// ─── SECTION HEADER ───────────────────────────────────────────────────────────
function SectionHead({ label, num, isDark }: { label: string; num: string; isDark: boolean }) {
  const t = tk(isDark)
  return (
    <View style={sh.row}>
      <View style={[sh.num, { backgroundColor: isDark ? 'rgba(47,175,143,0.10)' : 'rgba(47,175,143,0.08)' }]}>
        <Text style={[sh.numText, { color: BRAND }]}>{num}</Text>
      </View>
      <Text style={[sh.label, { color: t.text2 }]}>{label}</Text>
      <View style={[sh.line, { backgroundColor: t.divider }]} />
    </View>
  )
}

const sh = StyleSheet.create({
  row:     { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingTop: 28, paddingBottom: 12 },
  num:     { width: 20, height: 20, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  numText: { fontFamily: 'Geist-SemiBold', fontSize: 10, letterSpacing: 0.3 },
  label:   { fontFamily: 'Geist-SemiBold', fontSize: 11.5, letterSpacing: 0.5, textTransform: 'uppercase' },
  line:    { flex: 1, height: StyleSheet.hairlineWidth },
})

// ─── PREMIUM FIELD ────────────────────────────────────────────────────────────
function Field({
  icon, label, value, onChange, keyboardType, autoCapitalize,
  readOnly = false, hint, isDark, last = false,
}: {
  icon: React.ReactNode; label: string; value: string
  onChange?: (v: string) => void
  keyboardType?: 'default' | 'email-address' | 'phone-pad'
  autoCapitalize?: 'none' | 'words' | 'sentences'
  readOnly?: boolean; hint?: string; isDark: boolean; last?: boolean
}) {
  const t      = tk(isDark)
  const [focused, setFocused] = useState(false)
  const focusAnim = useRef(new Animated.Value(0)).current
  const lineAnim  = useRef(new Animated.Value(0)).current

  const onFocus = () => {
    setFocused(true)
    Animated.parallel([
      Animated.timing(focusAnim, { toValue: 1, duration: 200, useNativeDriver: false }),
      Animated.timing(lineAnim,  { toValue: 1, duration: 240, useNativeDriver: false }),
    ]).start()
  }
  const onBlur = () => {
    setFocused(false)
    Animated.parallel([
      Animated.timing(focusAnim, { toValue: 0, duration: 180, useNativeDriver: false }),
      Animated.timing(lineAnim,  { toValue: 0, duration: 180, useNativeDriver: false }),
    ]).start()
  }

  const bgColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [readOnly ? t.locked : t.surface, readOnly ? t.locked : t.focusBg],
  })

  return (
    <View>
      <Animated.View style={[fld.wrap, { backgroundColor: bgColor }]}>
        {/* Left icon column */}
        <View style={[fld.iconCol, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.025)' }]}>
          <View style={{ opacity: focused && !readOnly ? 1 : 0.55 }}>{icon}</View>
        </View>

        {/* Content */}
        <View style={fld.content}>
          <Text style={[fld.label, { color: focused && !readOnly ? BRAND : t.label }]}>
            {label.toUpperCase()}
          </Text>

          {readOnly ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 }}>
              <Text style={[fld.value, { color: t.muted }]}>{value || '—'}</Text>
              <View style={[fld.lockBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
                <ILock c={t.muted} />
                <Text style={[fld.lockText, { color: t.muted }]}>Solo lectura</Text>
              </View>
            </View>
          ) : (
            <TextInput
              value={value}
              onChangeText={onChange}
              onFocus={onFocus}
              onBlur={onBlur}
              style={[fld.value, { color: t.text }]}
              keyboardType={keyboardType ?? 'default'}
              autoCapitalize={autoCapitalize ?? 'sentences'}
              autoCorrect={false}
              placeholderTextColor={t.muted2}
            />
          )}

          {hint && <Text style={[fld.hint, { color: t.muted }]}>{hint}</Text>}
        </View>
      </Animated.View>

      {/* Animated focus line */}
      {!readOnly && (
        <View style={[fld.baseLineTrack, { backgroundColor: t.divider, marginLeft: 52 }]}>
          <Animated.View style={[fld.focusLine, {
            width: lineAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
          }]} />
        </View>
      )}

      {/* Static divider for read-only */}
      {readOnly && !last && (
        <View style={[fld.baseLineTrack, { backgroundColor: t.divider, marginLeft: 52 }]} />
      )}
    </View>
  )
}

const fld = StyleSheet.create({
  wrap: {
    flexDirection: 'row', alignItems: 'stretch',
    minHeight: 66,
  },
  iconCol: {
    width: 52, alignItems: 'center', justifyContent: 'center',
  },
  content: {
    flex: 1, paddingRight: 18, paddingVertical: 14, justifyContent: 'center',
  },
  label: {
    fontFamily: 'Geist-SemiBold', fontSize: 9, letterSpacing: 1.1, marginBottom: 5,
  },
  value: {
    fontFamily: 'Geist-Medium', fontSize: 15, letterSpacing: -0.2, paddingVertical: 0,
  },
  hint: {
    fontFamily: 'Geist-Regular', fontSize: 10.5, marginTop: 4, letterSpacing: 0.1,
  },
  lockBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6,
  },
  lockText: {
    fontFamily: 'Geist-Medium', fontSize: 10, letterSpacing: 0.2,
  },
  baseLineTrack: { height: StyleSheet.hairlineWidth },
  focusLine:     { height: 1, backgroundColor: BRAND, borderRadius: 1 },
})

// ─── CARD WRAPPER ─────────────────────────────────────────────────────────────
function Card({ children, isDark }: { children: React.ReactNode; isDark: boolean }) {
  const t = tk(isDark)
  return (
    <View style={[crd.wrap, {
      backgroundColor: t.surface,
      borderColor: t.border,
      shadowColor: isDark ? 'transparent' : '#000',
    }]}>
      {children}
    </View>
  )
}

const crd = StyleSheet.create({
  wrap: {
    marginHorizontal: 16, borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    shadowOpacity: 0.06, shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 }, elevation: 2,
  },
})

// ─── SAVE BAR ────────────────────────────────────────────────────────────────
function SaveBar({
  visible, saving, onSave, isDark,
}: {
  visible: boolean; saving: boolean; onSave: () => void; isDark: boolean
}) {
  const slideY = useRef(new Animated.Value(80)).current
  const opacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideY,  { toValue: visible ? 0 : 80, useNativeDriver: true, damping: 20, stiffness: 200 }),
      Animated.timing(opacity, { toValue: visible ? 1 : 0,  duration: 200, useNativeDriver: true }),
    ]).start()
  }, [visible])

  return (
    <Animated.View style={[sb.container, { opacity, transform: [{ translateY: slideY }] }]}>
      <View style={[sb.inner, {
        backgroundColor: isDark ? 'rgba(17,17,16,0.95)' : 'rgba(255,255,255,0.95)',
        borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)',
      }]}>
        <View style={sb.textCol}>
          <Text style={[sb.title, { color: isDark ? '#f5f4f2' : '#171512' }]}>Cambios sin guardar</Text>
          <Text style={[sb.sub, { color: isDark ? '#6b6560' : '#a8a29e' }]}>Se perderán si sales ahora</Text>
        </View>

        <TouchableOpacity
          onPress={onSave}
          disabled={saving}
          activeOpacity={0.88}
          style={sb.btn}
        >
          <View style={[sb.btnInner, { backgroundColor: BRAND }]}>
            {saving
              ? <ActivityIndicator size="small" color="#fff" />
              : (
                <>
                  <ICheck c="#fff" />
                  <Text style={sb.btnText}>Guardar</Text>
                </>
              )
            }
          </View>
        </TouchableOpacity>
      </View>
    </Animated.View>
  )
}

const sb = StyleSheet.create({
  container: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 16, paddingBottom: 28, paddingTop: 10,
  },
  inner: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderRadius: 20, borderWidth: 1,
    shadowColor: '#000', shadowOpacity: 0.14,
    shadowRadius: 20, shadowOffset: { width: 0, height: -4 },
    elevation: 8,
    gap: 14,
  },
  textCol:  { flex: 1 },
  title:    { fontFamily: 'Geist-SemiBold', fontSize: 13.5, letterSpacing: -0.2 },
  sub:      { fontFamily: 'Geist-Regular', fontSize: 11.5, marginTop: 2 },
  btn:      {},
  btnInner: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    paddingHorizontal: 20, paddingVertical: 11, borderRadius: 13,
    minWidth: 94, justifyContent: 'center',
  },
  btnText:  { fontFamily: 'Geist-SemiBold', fontSize: 13.5, color: '#fff', letterSpacing: -0.1 },
})

// ─── SCREEN ───────────────────────────────────────────────────────────────────
export default function EditarPerfilScreen() {
  const isDark = useColorScheme() === 'dark'
  const t      = tk(isDark)
  const insets = useSafeAreaInsets()
  const router = useRouter()

  const [saving,     setSaving]     = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [saved,      setSaved]      = useState(false)

  // Mock data — TODO: reemplazar con Supabase
  const [fullName, setFullName] = useState('Fernando García')
  const [email]                 = useState('fernando@gandiaapp.com')
  const [phone,    setPhone]    = useState('+52 618 123 4567')
  const [role]                  = useState(ROLE_LABELS['producer'] ?? '—')

  const mark = (setter: (v: string) => void) => (v: string) => {
    setter(v)
    setHasChanges(true)
    setSaved(false)
  }

  const handleSave = async () => {
    if (saving || !hasChanges) return
    setSaving(true)
    // TODO: await supabase.from('user_profiles').update({ full_name: fullName, phone })...
    await new Promise(r => setTimeout(r, 700))
    setSaving(false)
    setHasChanges(false)
    setSaved(true)
    setTimeout(() => router.back(), 500)
  }

  const handleBack = () => {
    if (hasChanges) {
      // Could show a confirm dialog — for now just go back
    }
    router.back()
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[scr.root, { backgroundColor: t.bg }]}>

        {/* ── Header ── */}
        <View style={[scr.header, {
          paddingTop: insets.top + 8,
          backgroundColor: isDark ? 'rgba(10,9,8,0.92)' : 'rgba(244,243,241,0.92)',
          borderBottomColor: t.divider,
        }]}>
          <TouchableOpacity onPress={handleBack} activeOpacity={0.7} style={[scr.backBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.055)' : 'rgba(0,0,0,0.055)' }]}>
            <IBack c={t.text2} />
          </TouchableOpacity>

          <View style={{ flex: 1, marginHorizontal: 14 }}>
            <Text style={[scr.headerTitle, { color: t.text }]}>Editar perfil</Text>
          </View>

          {/* Inline save pill */}
          <Pressable
            onPress={handleSave}
            disabled={!hasChanges || saving}
            style={({ pressed }) => [scr.savePill, {
              backgroundColor: hasChanges ? BRAND : isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
              opacity: pressed ? 0.82 : 1,
            }]}>
            {saving
              ? <ActivityIndicator size="small" color={hasChanges ? '#fff' : t.muted} />
              : saved
                ? <ICheck c={hasChanges ? '#fff' : t.muted} />
                : <Text style={[scr.savePillText, { color: hasChanges ? '#fff' : t.muted }]}>Guardar</Text>
            }
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
        >

          {/* ── Avatar hero ── */}
          <View style={[scr.hero, { backgroundColor: isDark ? '#0d0c0b' : '#edecea' }]}>
            {/* Subtle noise pattern via dots */}
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
              {[...Array(6)].map((_, i) => (
                <View key={i} style={[scr.noiseDot, {
                  top: [18, 48, 22, 60, 10, 42][i],
                  left: [30, 80, 140, 200, 260, 310][i],
                  opacity: isDark ? 0.08 : 0.06,
                  backgroundColor: BRAND,
                  width: [3, 4, 3, 5, 3, 4][i],
                  height: [3, 4, 3, 5, 3, 4][i],
                }]} />
              ))}
            </View>

            <Avatar name={fullName} isDark={isDark} />

            <View style={{ alignItems: 'center', marginTop: 14 }}>
              <Text style={[scr.heroName, { color: t.text }]}>{fullName || '—'}</Text>
              <View style={[scr.rolePill, { backgroundColor: isDark ? `${BRAND}14` : `${BRAND}12`, borderColor: isDark ? `${BRAND}22` : `${BRAND}18` }]}>
                <View style={[scr.roleDot, { backgroundColor: BRAND }]} />
                <Text style={[scr.roleText, { color: BRAND }]}>{role}</Text>
              </View>
            </View>
          </View>

          {/* ── 01 Personal ── */}
          <SectionHead label="Información personal" num="01" isDark={isDark} />
          <Card isDark={isDark}>
            <Field
              isDark={isDark} icon={<IUser c={t.muted} />}
              label="Nombre completo" value={fullName}
              onChange={mark(setFullName)}
              autoCapitalize="words"
              hint="Aparece en tus documentos y reportes"
            />
            <Field
              isDark={isDark} icon={<IMail c={t.muted} />}
              label="Correo electrónico" value={email}
              readOnly
              hint="Vinculado a tu cuenta — contacta soporte para cambiar"
            />
            <Field
              isDark={isDark} icon={<IPhone c={t.muted} />}
              label="Teléfono" value={phone}
              onChange={mark(setPhone)}
              keyboardType="phone-pad"
              autoCapitalize="none"
              last
            />
          </Card>

          {/* ── 02 Institucional ── */}
          <SectionHead label="Institucional" num="02" isDark={isDark} />
          <Card isDark={isDark}>
            <Field
              isDark={isDark} icon={<IShield c={t.muted} />}
              label="Rol" value={role}
              readOnly
              hint="Asignado por el administrador de tu organización"
              last
            />
          </Card>

          {/* ── Disclaimer ── */}
          <View style={[scr.disclaimer, {
            backgroundColor: isDark ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.025)',
            borderColor: t.divider,
          }]}>
            <ILock c={t.muted} />
            <Text style={[scr.disclaimerText, { color: t.muted }]}>
              Los campos bloqueados solo pueden modificarse por un administrador o a través del soporte de Gandia.
            </Text>
          </View>

        </ScrollView>

        {/* ── Floating save bar ── */}
        <SaveBar
          visible={hasChanges}
          saving={saving}
          onSave={handleSave}
          isDark={isDark}
        />

      </View>
    </KeyboardAvoidingView>
  )
}

// ─── SCREEN STYLES ─────────────────────────────────────────────────────────────
const scr = StyleSheet.create({
  root: { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    width: 34, height: 34, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'Geist-SemiBold', fontSize: 16, letterSpacing: -0.3,
  },
  savePill: {
    paddingHorizontal: 16, paddingVertical: 7, borderRadius: 10,
    minWidth: 70, alignItems: 'center', justifyContent: 'center',
    minHeight: 32,
  },
  savePillText: { fontFamily: 'Geist-SemiBold', fontSize: 13.5, letterSpacing: -0.1 },

  // Hero
  hero: {
    marginHorizontal: 16, marginTop: 16,
    borderRadius: 24, paddingVertical: 28,
    alignItems: 'center', overflow: 'hidden',
  },
  noiseDot:  { position: 'absolute', borderRadius: 99 },
  heroName:  { fontFamily: 'Geist-SemiBold', fontSize: 20, letterSpacing: -0.5, marginBottom: 8 },
  rolePill:  {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 11, paddingVertical: 5,
    borderRadius: 99, borderWidth: 1,
  },
  roleDot:   { width: 6, height: 6, borderRadius: 3 },
  roleText:  { fontFamily: 'Geist-Medium', fontSize: 12, letterSpacing: 0.1 },

  // Disclaimer
  disclaimer: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    marginHorizontal: 16, marginTop: 20,
    padding: 14, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth,
  },
  disclaimerText: {
    flex: 1, fontFamily: 'Geist-Regular', fontSize: 11.5, lineHeight: 17,
  },
})