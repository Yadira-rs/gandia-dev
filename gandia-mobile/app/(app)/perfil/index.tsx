// app/(app)/perfil.tsx — Gandia 7 · Perfil
import { useState, useEffect } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, useColorScheme, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Path, Line, Polyline, Circle, Rect } from 'react-native-svg'
// TODO: import { supabase } from '../../../lib/supabaseClient'

const BRAND = '#2FAF8F'

const tk = (d: boolean) => ({
  bg:          d ? '#0c0a09' : '#f2f1f0',
  card:        d ? '#141210' : '#ffffff',
  border:      d ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)',
  divider:     d ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)',
  text:        d ? '#fafaf9' : '#1c1917',
  text2:       d ? '#d6d3d1' : '#44403c',
  muted:       d ? '#78716c' : '#a8a29e',
  muted2:      d ? '#57534e' : '#c4bfba',
  input:       d ? '#0c0a09' : '#f9f8f8',
  inputFocus:  d ? '#141210' : '#ffffff',
  label:       d ? '#78716c' : '#a8a29e',
  readOnly:    d ? '#1c1917' : '#f0efee',
  danger:      '#ef4444',
})

// ─── Icons ────────────────────────────────────────────────────────────────────
const si = { fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

const IcoBack  = ({ c }: { c: string }) => (
  <Svg width={18} height={18} viewBox="0 0 24 24" {...si} stroke={c} strokeWidth="2">
    <Line x1="19" y1="12" x2="5" y2="12" /><Polyline points="12 19 5 12 12 5" />
  </Svg>
)
const IcoUser  = ({ c }: { c: string }) => (
  <Svg width={18} height={18} viewBox="0 0 24 24" {...si} stroke={c} strokeWidth="1.75">
    <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><Circle cx="12" cy="7" r="4" />
  </Svg>
)
const IcoMail  = ({ c }: { c: string }) => (
  <Svg width={18} height={18} viewBox="0 0 24 24" {...si} stroke={c} strokeWidth="1.75">
    <Path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <Polyline points="22,6 12,13 2,6" />
  </Svg>
)
const IcoPhone = ({ c }: { c: string }) => (
  <Svg width={18} height={18} viewBox="0 0 24 24" {...si} stroke={c} strokeWidth="1.75">
    <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.59 1.22h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.83a16 16 0 0 0 6 6l.92-.92a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 21.71 16.92z" />
  </Svg>
)
const IcoBriefcase = ({ c }: { c: string }) => (
  <Svg width={18} height={18} viewBox="0 0 24 24" {...si} stroke={c} strokeWidth="1.75">
    <Rect x="2" y="7" width="20" height="14" rx="2" /><Path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </Svg>
)
const IcoLock = ({ c }: { c: string }) => (
  <Svg width={14} height={14} viewBox="0 0 24 24" {...si} stroke={c} strokeWidth="1.75">
    <Rect x="3" y="11" width="18" height="11" rx="2" /><Path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </Svg>
)

// ─── Role map ─────────────────────────────────────────────────────────────────
const ROLE_NAMES: Record<string, string> = {
  producer: 'Productor Ganadero',
  mvz:      'Médico Veterinario Zootecnista',
  union:    'Unión Ganadera',
  exporter: 'Exportador',
  auditor:  'Auditor / Inspector',
}

// ─── Input field component ────────────────────────────────────────────────────
function Field({
  icon, label, value, onChange, keyboardType, autoCapitalize,
  readOnly = false, hint, isDark, last = false,
}: {
  icon:            React.ReactNode
  label:           string
  value:           string
  onChange?:       (v: string) => void
  keyboardType?:   'default' | 'email-address' | 'phone-pad'
  autoCapitalize?: 'none' | 'words' | 'sentences'
  readOnly?:       boolean
  hint?:           string
  isDark:          boolean
  last?:           boolean
}) {
  const t = tk(isDark)
  const [focused, setFocused] = useState(false)

  return (
    <>
      <View style={[
        f.wrap,
        focused && !readOnly && { backgroundColor: t.inputFocus },
        readOnly && { backgroundColor: t.readOnly },
      ]}>
        {/* Left icon */}
        <View style={f.iconCol}>{icon}</View>

        {/* Content */}
        <View style={{ flex: 1 }}>
          <Text style={[f.label, { color: t.label }]}>{label.toUpperCase()}</Text>
          {readOnly ? (
            <View style={f.readOnlyRow}>
              <Text style={[f.readOnlyText, { color: t.muted }]}>{value || '—'}</Text>
              <View style={f.lockWrap}>
                <IcoLock c={t.muted2} />
              </View>
            </View>
          ) : (
            <TextInput
              value={value}
              onChangeText={onChange}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              style={[f.input, { color: t.text }]}
              keyboardType={keyboardType ?? 'default'}
              autoCapitalize={autoCapitalize ?? 'sentences'}
              autoCorrect={false}
              placeholderTextColor={t.muted2}
            />
          )}
          {hint ? <Text style={[f.hint, { color: t.muted2 }]}>{hint}</Text> : null}
        </View>
      </View>
      {!last && <View style={[f.div, { backgroundColor: t.divider, marginLeft: 56 }]} />}
    </>
  )
}
const f = StyleSheet.create({
  wrap:        { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 16, paddingVertical: 13, minHeight: 60 },
  iconCol:     { width: 24, marginRight: 16, paddingTop: 22 },
  label:       { fontFamily: 'Geist-SemiBold', fontSize: 9.5, letterSpacing: 0.9, marginBottom: 4 },
  input:       { fontFamily: 'Geist-Medium', fontSize: 14.5, letterSpacing: -0.1, paddingVertical: 0 },
  readOnlyRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  readOnlyText:{ fontFamily: 'Geist-Medium', fontSize: 14.5, letterSpacing: -0.1 },
  lockWrap:    { marginTop: 1 },
  hint:        { fontFamily: 'Geist-Regular', fontSize: 11, marginTop: 3 },
  div:         { height: StyleSheet.hairlineWidth },
})

// ─── Card wrapper ─────────────────────────────────────────────────────────────
function Card({ children, isDark }: { children: React.ReactNode; isDark: boolean }) {
  const t = tk(isDark)
  return (
    <View style={[cd.c, { backgroundColor: t.card, borderColor: t.border }]}>
      {children}
    </View>
  )
}
const cd = StyleSheet.create({
  c: { marginHorizontal: 16, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
})

function SLabel({ label, isDark }: { label: string; isDark: boolean }) {
  return <Text style={sl.t}>{label.toUpperCase()}</Text>
}
const sl = StyleSheet.create({
  t: { fontFamily: 'Geist-SemiBold', fontSize: 11, letterSpacing: 0.9, color: '#a8a29e', paddingHorizontal: 20, paddingTop: 22, paddingBottom: 7 },
})

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function PerfilScreen() {
  const isDark = useColorScheme() === 'dark'
  const t      = tk(isDark)
  const insets = useSafeAreaInsets()
  const router = useRouter()

  // TODO: const { profile } = useUser()
  // Mock data — reemplazar con supabase.auth.getSession() + user_profiles cuando esté listo
  const MOCK = {
    fullName:  'Fernando García',
    email:     'fernando@gandiaapp.com',
    phone:     '+52 618 123 4567',
    roleCode:  'producer',
  }

  const [loading,     setLoading]     = useState(false)
  const [saving,      setSaving]      = useState(false)
  const [hasChanges,  setHasChanges]  = useState(false)

  // Fields
  const [fullName, setFullName] = useState(MOCK.fullName)
  const [email,    setEmail]    = useState(MOCK.email)
  const [phone,    setPhone]    = useState(MOCK.phone)
  const [role,     setRole]     = useState(ROLE_NAMES[MOCK.roleCode] ?? '—')
  const [avatarLetter, setAvatarLetter] = useState(MOCK.fullName.charAt(0).toUpperCase())

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (saving || !hasChanges) return
    setSaving(true)
    // TODO: conectar con supabase.from('user_profiles').update(...)
    await new Promise(r => setTimeout(r, 600)) // simula latencia
    setHasChanges(false)
    setAvatarLetter(fullName.charAt(0).toUpperCase() || '?')
    Alert.alert('Listo', 'Perfil actualizado correctamente.')
    setSaving(false)
  }

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={[s.root, { backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={BRAND} />
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <View style={[s.root, { backgroundColor: t.bg }]}>

        {/* ── Header ── */}
        <View style={[s.header, { paddingTop: insets.top + 10, borderBottomColor: t.divider }]}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.7}>
            <IcoBack c={t.muted} />
          </TouchableOpacity>
          <Text style={[s.headerTitle, { color: t.text }]}>Perfil</Text>
          {/* Botón guardar inline en header */}
          <TouchableOpacity
            onPress={handleSave}
            style={[s.saveInline, { opacity: hasChanges && !saving ? 1 : 0.35 }]}
            activeOpacity={0.8}
            disabled={!hasChanges || saving}
          >
            {saving
              ? <ActivityIndicator size="small" color={BRAND} />
              : <Text style={s.saveInlineText}>Guardar</Text>
            }
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        >

          {/* ── Avatar ── */}
          <View style={s.avatarSection}>
            <View style={s.avatarWrap}>
              <View style={s.avatar}>
                <Text style={s.avatarText}>{avatarLetter}</Text>
              </View>
              <View style={s.avatarDot} />
            </View>
            <Text style={[s.avatarName,  { color: t.text }]}>{fullName || '—'}</Text>
            <Text style={[s.avatarRole,  { color: t.muted }]}>{role}</Text>
            <TouchableOpacity style={[s.avatarChangePill, { borderColor: t.border }]} activeOpacity={0.75}>
              <Text style={[s.avatarChangeText, { color: t.muted }]}>Cambiar foto</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.editPill, { backgroundColor: isDark ? '#1c1917' : '#f0efee' }]}
              onPress={() => router.push('/(app)/perfil/editar' as any)}
              activeOpacity={0.8}
            >
              <Text style={[s.editPillText, { color: BRAND }]}>Editar perfil</Text>
            </TouchableOpacity>
          </View>

          {/* ── Información personal ── */}
          <SLabel label="Información personal" isDark={isDark} />
          <Card isDark={isDark}>
            <Field
              isDark={isDark}
              icon={<IcoUser c={t.muted} />}
              label="Nombre completo"
              value={fullName}
              onChange={v => { setFullName(v); setHasChanges(true) }}
              autoCapitalize="words"
              hint="Nombre que aparece en tus documentos"
            />
            <Field
              isDark={isDark}
              icon={<IcoMail c={t.muted} />}
              label="Correo electrónico"
              value={email}
              readOnly
              hint="El correo no se puede cambiar desde aquí"
            />
            <Field
              isDark={isDark}
              icon={<IcoPhone c={t.muted} />}
              label="Teléfono"
              value={phone}
              onChange={v => { setPhone(v); setHasChanges(true) }}
              keyboardType="phone-pad"
              autoCapitalize="none"
              last
            />
          </Card>

          {/* ── Información institucional ── */}
          <SLabel label="Información institucional" isDark={isDark} />
          <Card isDark={isDark}>
            <Field
              isDark={isDark}
              icon={<IcoBriefcase c={t.muted} />}
              label="Rol"
              value={role}
              readOnly
              hint="Tu rol es definido por el administrador"
              last
            />
          </Card>

          {/* ── Zona de peligro ── */}
          <SLabel label="Cuenta" isDark={isDark} />
          <Card isDark={isDark}>
            <TouchableOpacity
              style={s.dangerRow}
              activeOpacity={0.8}
              onPress={() =>
                Alert.alert(
                  'Eliminar cuenta',
                  'Esta acción es irreversible. ¿Deseas continuar?',
                  [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Eliminar cuenta', style: 'destructive', onPress: () => {} },
                  ]
                )
              }
            >
              <Text style={[s.dangerText, { color: t.danger }]}>Eliminar cuenta</Text>
              <Text style={[s.dangerSub, { color: t.muted }]}>Permanente e irreversible</Text>
            </TouchableOpacity>
          </Card>

          {/* ── Botón guardar principal ── */}
          {hasChanges && (
            <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
              <TouchableOpacity
                style={[s.saveBtn, { backgroundColor: isDark ? '#f5f5f4' : '#1c1917' }]}
                onPress={handleSave}
                activeOpacity={0.85}
                disabled={saving}
              >
                {saving
                  ? <ActivityIndicator size="small" color={isDark ? '#1c1917' : '#fff'} />
                  : <Text style={[s.saveBtnText, { color: isDark ? '#1c1917' : '#fff' }]}>Guardar cambios</Text>
                }
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn:       { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle:   { fontFamily: 'Geist-SemiBold', fontSize: 16, letterSpacing: -0.2 },
  saveInline:    { paddingHorizontal: 4, minWidth: 60, alignItems: 'flex-end' },
  saveInlineText:{ fontFamily: 'Geist-SemiBold', fontSize: 14, color: BRAND },

  // Avatar
  avatarSection: { alignItems: 'center', paddingTop: 28, paddingBottom: 8, gap: 6 },
  avatarWrap:    { position: 'relative', marginBottom: 4 },
  avatar: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: BRAND,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: BRAND, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 6,
  },
  avatarText:    { color: '#fff', fontFamily: 'Geist-SemiBold', fontSize: 30 },
  avatarDot: {
    position: 'absolute', bottom: 4, right: 4,
    width: 13, height: 13, borderRadius: 7,
    backgroundColor: '#22c55e', borderWidth: 2.5, borderColor: '#fff',
  },
  avatarName:       { fontFamily: 'Geist-SemiBold', fontSize: 18, letterSpacing: -0.3, marginTop: 2 },
  avatarRole:       { fontFamily: 'Geist-Regular',  fontSize: 13 },
  avatarChangePill: { marginTop: 6, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 99, borderWidth: 1 },
  avatarChangeText: { fontFamily: 'Geist-Medium', fontSize: 12.5 },
  editPill:     { marginTop: 6, paddingHorizontal: 16, paddingVertical: 7, borderRadius: 99 },
  editPillText: { fontFamily: 'Geist-SemiBold', fontSize: 13 },

  // Danger
  dangerRow: { paddingHorizontal: 16, paddingVertical: 16 },
  dangerText:{ fontFamily: 'Geist-Medium', fontSize: 14 },
  dangerSub: { fontFamily: 'Geist-Regular', fontSize: 12, marginTop: 2 },

  // Save
  saveBtn:    { height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  saveBtnText:{ fontFamily: 'Geist-SemiBold', fontSize: 15 },
})