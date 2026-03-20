// app/(app)/cfg-seguridad.tsx — Gandia 7 · Seguridad
import { useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  useColorScheme, TextInput, Alert,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Line, Polyline, Path, Circle } from 'react-native-svg'

const BRAND = '#2FAF8F'
const tk = (d: boolean) => ({
  bg:          d ? '#0c0a09' : '#f2f1f0',
  card:        d ? '#141210' : '#ffffff',
  border:      d ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)',
  divider:     d ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)',
  text:        d ? '#fafaf9' : '#1c1917',
  muted:       d ? '#78716c' : '#a8a29e',
  muted2:      d ? '#57534e' : '#c4bfba',
  input:       d ? '#1c1917' : '#f5f4f3',
  inputBorder: d ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.10)',
  danger:      '#ef4444',
  dangerBg:    d ? 'rgba(239,68,68,0.10)' : 'rgba(239,68,68,0.07)',
  sessionBg:   d ? '#1c1917' : '#f5f4f3',
  dot:         '#22c55e',
})

const si = { fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
const IcoBack = ({ c }: { c: string }) => (
  <Svg width={18} height={18} viewBox="0 0 24 24" {...si} stroke={c} strokeWidth="2">
    <Line x1="19" y1="12" x2="5" y2="12" /><Polyline points="12 19 5 12 12 5" />
  </Svg>
)
const IcoEye = ({ c }: { c: string }) => (
  <Svg width={18} height={18} viewBox="0 0 24 24" {...si} stroke={c} strokeWidth="1.75">
    <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><Circle cx="12" cy="12" r="3" />
  </Svg>
)
const IcoEyeOff = ({ c }: { c: string }) => (
  <Svg width={18} height={18} viewBox="0 0 24 24" {...si} stroke={c} strokeWidth="1.75">
    <Path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <Line x1="1" y1="1" x2="23" y2="23" />
  </Svg>
)

function SLabel({ label }: { label: string }) {
  return <Text style={sl.t}>{label.toUpperCase()}</Text>
}
const sl = StyleSheet.create({ t: { fontFamily: 'Geist-SemiBold', fontSize: 11, letterSpacing: 0.9, color: '#a8a29e', paddingHorizontal: 20, paddingTop: 22, paddingBottom: 7 } })

function Card({ children, isDark }: { children: React.ReactNode; isDark: boolean }) {
  const t = tk(isDark)
  return <View style={[cd.c, { backgroundColor: t.card, borderColor: t.border }]}>{children}</View>
}
const cd = StyleSheet.create({ c: { marginHorizontal: 16, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' } })

function PasswordInput({ label, value, onChange, isDark, last = false }: {
  label: string; value: string; onChange: (v: string) => void; isDark: boolean; last?: boolean
}) {
  const [show, setShow] = useState(false)
  const t = tk(isDark)
  return (
    <>
      <View style={pw.row}>
        <Text style={[pw.label, { color: t.muted }]}>{label.toUpperCase()}</Text>
        <View style={[pw.inputWrap, { backgroundColor: t.input, borderColor: t.inputBorder }]}>
          <TextInput
            value={value} onChangeText={onChange}
            secureTextEntry={!show}
            style={[pw.input, { color: t.text }]}
            placeholderTextColor={t.muted}
            autoCapitalize="none"
          />
          <TouchableOpacity onPress={() => setShow(p => !p)} activeOpacity={0.7} style={pw.eye}>
            {show ? <IcoEye c={t.muted} /> : <IcoEyeOff c={t.muted} />}
          </TouchableOpacity>
        </View>
      </View>
      {!last && <View style={[pw.div, { backgroundColor: t.divider }]} />}
    </>
  )
}
const pw = StyleSheet.create({
  row:      { paddingHorizontal: 16, paddingVertical: 12 },
  label:    { fontFamily: 'Geist-SemiBold', fontSize: 10, letterSpacing: 0.7, marginBottom: 7 },
  inputWrap:{ flexDirection: 'row', alignItems: 'center', borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10 },
  input:    { flex: 1, fontFamily: 'Geist-Regular', fontSize: 14 },
  eye:      { padding: 2 },
  div:      { height: StyleSheet.hairlineWidth, marginHorizontal: 16 },
})

export default function CfgSeguridad() {
  const isDark = useColorScheme() === 'dark'
  const t      = tk(isDark)
  const insets = useSafeAreaInsets()
  const router = useRouter()

  const [pwCurrent,  setPwCurrent]  = useState('')
  const [pwNew,      setPwNew]      = useState('')
  const [pwConfirm,  setPwConfirm]  = useState('')
  const [pwError,    setPwError]    = useState('')

  const handleUpdatePassword = () => {
    setPwError('')
    if (!pwCurrent || !pwNew || !pwConfirm) { setPwError('Completa todos los campos.'); return }
    if (pwNew !== pwConfirm) { setPwError('Las contraseñas no coinciden.'); return }
    if (pwNew.length < 8)    { setPwError('Mínimo 8 caracteres.'); return }
    // Tu compañero: supabase.auth.updateUser({ password: pwNew })
    setPwCurrent(''); setPwNew(''); setPwConfirm('')
    Alert.alert('Listo', 'Contraseña actualizada correctamente.')
  }

  const handleCloseAll = () =>
    Alert.alert('Cerrar sesiones', '¿Cerrar todas las sesiones en otros dispositivos?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar todas', style: 'destructive', onPress: () => {} },
    ])

  return (
    <View style={[s.root, { backgroundColor: t.bg }]}>
      <View style={[s.header, { paddingTop: insets.top + 10, borderBottomColor: t.divider }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.7}>
          <IcoBack c={t.muted} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: t.text }]}>Seguridad</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>

        {/* Cambiar contraseña */}
        <SLabel label="Cambiar contraseña" />
        <Card isDark={isDark}>
          <PasswordInput isDark={isDark} label="Contraseña actual"  value={pwCurrent} onChange={setPwCurrent} />
          <PasswordInput isDark={isDark} label="Nueva contraseña"   value={pwNew}     onChange={setPwNew} />
          <PasswordInput isDark={isDark} label="Confirmar contraseña" value={pwConfirm} onChange={setPwConfirm} last />
        </Card>

        {pwError ? (
          <Text style={s.errorText}>{pwError}</Text>
        ) : null}

        <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
          <TouchableOpacity
            style={[s.btn, { backgroundColor: isDark ? '#f5f5f4' : '#1c1917' }]}
            onPress={handleUpdatePassword} activeOpacity={0.85}>
            <Text style={[s.btnText, { color: isDark ? '#1c1917' : '#fff' }]}>Actualizar contraseña</Text>
          </TouchableOpacity>
        </View>

        {/* Sesión actual */}
        <SLabel label="Sesión actual" />
        <Card isDark={isDark}>
          <View style={ss.session}>
            <View style={[ss.sessionIcon, { backgroundColor: t.sessionBg }]}>
              <Text style={ss.sessionEmoji}>📱</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={ss.sessionRow}>
                <Text style={[ss.sessionName, { color: t.text }]}>Este dispositivo</Text>
                <View style={[ss.dot, { backgroundColor: t.dot }]} />
              </View>
              <Text style={[ss.sessionSub, { color: t.muted }]}>Activa ahora · Desde 1 mar 2026</Text>
            </View>
          </View>
        </Card>

        <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
          <TouchableOpacity
            style={[s.btn, { backgroundColor: t.dangerBg }]}
            onPress={handleCloseAll} activeOpacity={0.85}>
            <Text style={[s.btnText, { color: t.danger }]}>Cerrar todas las sesiones</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  )
}

const ss = StyleSheet.create({
  session:     { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  sessionIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  sessionEmoji:{ fontSize: 20 },
  sessionRow:  { flexDirection: 'row', alignItems: 'center', gap: 7 },
  sessionName: { fontFamily: 'Geist-SemiBold', fontSize: 14 },
  dot:         { width: 7, height: 7, borderRadius: 4 },
  sessionSub:  { fontFamily: 'Geist-Regular', fontSize: 12, marginTop: 3 },
})
const s = StyleSheet.create({
  root:       { flex: 1 },
  header:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  backBtn:    { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle:{ fontFamily: 'Geist-SemiBold', fontSize: 16, letterSpacing: -0.2 },
  errorText:  { fontFamily: 'Geist-Regular', fontSize: 12, color: '#ef4444', paddingHorizontal: 20, marginTop: 10 },
  btn:        { height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  btnText:    { fontFamily: 'Geist-SemiBold', fontSize: 15 },
})