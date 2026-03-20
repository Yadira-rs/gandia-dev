// app/(app)/cfg-apariencia.tsx — Gandia 7 · Apariencia
import { useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  useColorScheme,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Line, Polyline, Circle, Path, Rect } from 'react-native-svg'

const BRAND = '#2FAF8F'
const tk = (d: boolean) => ({
  bg:      d ? '#0c0a09' : '#f2f1f0',
  card:    d ? '#141210' : '#ffffff',
  border:  d ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)',
  divider: d ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)',
  text:    d ? '#fafaf9' : '#1c1917',
  muted:   d ? '#78716c' : '#a8a29e',
  muted2:  d ? '#57534e' : '#c4bfba',
  seg:     d ? '#1c1917' : '#f0efee',
  segActive: d ? '#2a2724' : '#ffffff',
})

const si = { fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
const IcoBack = ({ c }: { c: string }) => (
  <Svg width={18} height={18} viewBox="0 0 24 24" {...si} stroke={c} strokeWidth="2">
    <Line x1="19" y1="12" x2="5" y2="12" /><Polyline points="12 19 5 12 12 5" />
  </Svg>
)
const IcoCheck = ({ c }: { c: string }) => (
  <Svg width={14} height={14} viewBox="0 0 24 24" {...si} stroke={c} strokeWidth="2.5">
    <Polyline points="20 6 9 17 4 12" />
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

// Segmented control genérico
function SegControl<T extends string>({ options, value, onChange, isDark }: {
  options: { id: T; label: string }[]
  value: T
  onChange: (v: T) => void
  isDark: boolean
}) {
  const t = tk(isDark)
  return (
    <View style={[sg.wrap, { backgroundColor: t.seg }]}>
      {options.map(opt => {
        const active = opt.id === value
        return (
          <TouchableOpacity
            key={opt.id}
            style={[sg.option, active && [sg.optionActive, { backgroundColor: t.segActive, shadowColor: '#000' }]]}
            onPress={() => onChange(opt.id)}
            activeOpacity={0.8}
          >
            <Text style={[sg.optText, { color: active ? (isDark ? '#fafaf9' : '#1c1917') : t.muted }]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}
const sg = StyleSheet.create({
  wrap:        { flexDirection: 'row', borderRadius: 10, padding: 3, marginHorizontal: 16, marginVertical: 8 },
  option:      { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  optionActive:{ shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.12, shadowRadius: 4, elevation: 2 },
  optText:     { fontFamily: 'Geist-Medium', fontSize: 13 },
})

// Fuente card
function FontCard({ label, preview, sub, active, onPress, isDark }: {
  label: string; preview: string; sub: string; active: boolean; onPress: () => void; isDark: boolean
}) {
  const t = tk(isDark)
  return (
    <TouchableOpacity
      style={[fc.card, {
        backgroundColor: active ? (isDark ? 'rgba(47,175,143,0.10)' : 'rgba(47,175,143,0.07)') : t.card,
        borderColor: active ? BRAND : t.border,
      }]}
      onPress={onPress} activeOpacity={0.8}
    >
      <Text style={[fc.preview, { color: active ? BRAND : t.text }]}>{preview}</Text>
      <Text style={[fc.label, { color: active ? BRAND : t.text }]}>{label}</Text>
      <Text style={[fc.sub, { color: t.muted }]}>{sub}</Text>
      {active && (
        <View style={fc.checkWrap}>
          <IcoCheck c={BRAND} />
        </View>
      )}
    </TouchableOpacity>
  )
}
const fc = StyleSheet.create({
  card:     { flex: 1, borderRadius: 14, borderWidth: 1.5, padding: 14, alignItems: 'center', gap: 4, minHeight: 90, position: 'relative' },
  preview:  { fontSize: 24, lineHeight: 30 },
  label:    { fontFamily: 'Geist-SemiBold', fontSize: 12.5 },
  sub:      { fontFamily: 'Geist-Regular',  fontSize: 10.5, textAlign: 'center' },
  checkWrap:{ position: 'absolute', top: 8, right: 8 },
})

type Theme = 'light' | 'dark' | 'auto'
type Font  = 'geist' | 'serif' | 'lora'
type Lang  = 'es' | 'en'
type DateFmt = 'DD/MM/YYYY' | 'MM/DD/YYYY'
type Units   = 'metric' | 'imperial'

export default function CfgApariencia() {
  const isDark = useColorScheme() === 'dark'
  const t      = tk(isDark)
  const insets = useSafeAreaInsets()
  const router = useRouter()

  const [theme,   setTheme]   = useState<Theme>('auto')
  const [font,    setFont]    = useState<Font>('geist')
  const [lang,    setLang]    = useState<Lang>('es')
  const [dateFmt, setDateFmt] = useState<DateFmt>('DD/MM/YYYY')
  const [units,   setUnits]   = useState<Units>('metric')

  const handleSave = () => router.back()

  return (
    <View style={[s.root, { backgroundColor: t.bg }]}>
      <View style={[s.header, { paddingTop: insets.top + 10, borderBottomColor: t.divider }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.7}>
          <IcoBack c={t.muted} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: t.text }]}>Apariencia</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>

        {/* Tema */}
        <SLabel label="Tema" />
        <SegControl<Theme>
          isDark={isDark}
          value={theme} onChange={setTheme}
          options={[{ id: 'light', label: 'Claro' }, { id: 'dark', label: 'Oscuro' }, { id: 'auto', label: 'Auto' }]}
        />

        {/* Tipografía */}
        <SLabel label="Tipografía" />
        <View style={{ paddingHorizontal: 16, marginBottom: 4 }}>
          <Text style={[s.hint, { color: t.muted }]}>Fuente aplicada en toda la interfaz</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 16 }}>
          <FontCard isDark={isDark} preview="Aa" label="Geist"    sub="Moderna"   active={font === 'geist'} onPress={() => setFont('geist')} />
          <FontCard isDark={isDark} preview="Aa" label="Serif"    sub="Elegante"  active={font === 'serif'} onPress={() => setFont('serif')} />
          <FontCard isDark={isDark} preview="Aa" label="Lora"     sub="Editorial" active={font === 'lora'}  onPress={() => setFont('lora')} />
        </View>

        {/* Idioma y región */}
        <SLabel label="Idioma y región" />
        <Card isDark={isDark}>
          <View style={s.rowItem}>
            <Text style={[s.rowLabel, { color: t.text }]}>Idioma</Text>
            <SegControl<Lang>
              isDark={isDark} value={lang} onChange={setLang}
              options={[{ id: 'es', label: 'Español' }, { id: 'en', label: 'English' }]}
            />
          </View>
          <View style={[s.div, { backgroundColor: t.divider }]} />
          <View style={s.rowItem}>
            <Text style={[s.rowLabel, { color: t.text }]}>Formato de fecha</Text>
            <SegControl<DateFmt>
              isDark={isDark} value={dateFmt} onChange={setDateFmt}
              options={[{ id: 'DD/MM/YYYY', label: 'DD/MM' }, { id: 'MM/DD/YYYY', label: 'MM/DD' }]}
            />
          </View>
          <View style={[s.div, { backgroundColor: t.divider }]} />
          <View style={s.rowItem}>
            <Text style={[s.rowLabel, { color: t.text }]}>Unidades</Text>
            <SegControl<Units>
              isDark={isDark} value={units} onChange={setUnits}
              options={[{ id: 'metric', label: 'Kg / Ha' }, { id: 'imperial', label: 'Lb / Ac' }]}
            />
          </View>
        </Card>

        <View style={{ paddingHorizontal: 16, marginTop: 28 }}>
          <TouchableOpacity style={[s.saveBtn, { backgroundColor: isDark ? '#f5f5f4' : '#1c1917' }]}
            onPress={handleSave} activeOpacity={0.85}>
            <Text style={[s.saveBtnText, { color: isDark ? '#1c1917' : '#fff' }]}>Guardar cambios</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  root:       { flex: 1 },
  header:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  backBtn:    { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle:{ fontFamily: 'Geist-SemiBold', fontSize: 16, letterSpacing: -0.2 },
  hint:       { fontFamily: 'Geist-Regular', fontSize: 12, marginBottom: 10 },
  rowItem:    { paddingHorizontal: 16, paddingVertical: 12 },
  rowLabel:   { fontFamily: 'Geist-Medium', fontSize: 14, marginBottom: 8 },
  div:        { height: StyleSheet.hairlineWidth, marginHorizontal: 16 },
  saveBtn:    { height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  saveBtnText:{ fontFamily: 'Geist-SemiBold', fontSize: 15 },
})