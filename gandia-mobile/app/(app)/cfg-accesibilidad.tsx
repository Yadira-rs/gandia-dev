// app/(app)/cfg-accesibilidad.tsx — Gandia 7 · Accesibilidad
import { useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Switch, useColorScheme,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Line, Polyline } from 'react-native-svg'

const BRAND = '#2FAF8F'
const FONT_SIZES = [12, 14, 16, 18, 20]
const FONT_LABELS = ['A', 'A', 'A', 'A', 'A']

const tk = (d: boolean) => ({
  bg:      d ? '#0c0a09' : '#f2f1f0',
  card:    d ? '#141210' : '#ffffff',
  border:  d ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)',
  divider: d ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)',
  text:    d ? '#fafaf9' : '#1c1917',
  muted:   d ? '#78716c' : '#a8a29e',
  muted2:  d ? '#57534e' : '#c4bfba',
  track:   d ? '#1c1917' : '#f0efee',
})

const si = { fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
const IcoBack = ({ c }: { c: string }) => (
  <Svg width={18} height={18} viewBox="0 0 24 24" {...si} stroke={c} strokeWidth="2">
    <Line x1="19" y1="12" x2="5" y2="12" /><Polyline points="12 19 5 12 12 5" />
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

function ToggleRow({ label, desc, value, onChange, last = false, isDark }: {
  label: string; desc: string; value: boolean; onChange: (v: boolean) => void; last?: boolean; isDark: boolean
}) {
  const t = tk(isDark)
  return (
    <>
      <View style={tr.row}>
        <View style={{ flex: 1, paddingRight: 12 }}>
          <Text style={[tr.label, { color: t.text }]}>{label}</Text>
          <Text style={[tr.desc,  { color: t.muted }]}>{desc}</Text>
        </View>
        <Switch value={value} onValueChange={onChange}
          trackColor={{ false: isDark ? '#44403c' : '#d6d3d1', true: BRAND }}
          thumbColor="#fff" ios_backgroundColor={isDark ? '#44403c' : '#d6d3d1'} />
      </View>
      {!last && <View style={[tr.div, { backgroundColor: t.divider, marginLeft: 16 }]} />}
    </>
  )
}
const tr = StyleSheet.create({
  row:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, minHeight: 56 },
  label:{ fontFamily: 'Geist-Medium',  fontSize: 14, letterSpacing: -0.1 },
  desc: { fontFamily: 'Geist-Regular', fontSize: 12, marginTop: 2 },
  div:  { height: StyleSheet.hairlineWidth },
})

export default function CfgAccesibilidad() {
  const isDark = useColorScheme() === 'dark'
  const t      = tk(isDark)
  const insets = useSafeAreaInsets()
  const router = useRouter()

  const [fontSizeIdx,    setFontSizeIdx]    = useState(2) // default 16px
  const [highContrast,   setHighContrast]   = useState(false)
  const [reduceMotion,   setReduceMotion]   = useState(false)
  const [kbShortcuts,    setKbShortcuts]    = useState(true)
  const [voiceNav,       setVoiceNav]       = useState(false)

  const currentSize = FONT_SIZES[fontSizeIdx]

  const handleSave = () => router.back()

  return (
    <View style={[s.root, { backgroundColor: t.bg }]}>
      <View style={[s.header, { paddingTop: insets.top + 10, borderBottomColor: t.divider }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.7}>
          <IcoBack c={t.muted} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: t.text }]}>Accesibilidad</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>

        {/* Tamaño de texto */}
        <SLabel label="Tamaño de texto" />
        <Card isDark={isDark}>
          <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
            {/* Botones A */}
            <View style={fs.row}>
              {FONT_LABELS.map((lbl, i) => {
                const active = i === fontSizeIdx
                return (
                  <TouchableOpacity
                    key={i}
                    style={[fs.btn, active && { borderColor: BRAND, backgroundColor: isDark ? 'rgba(47,175,143,0.12)' : 'rgba(47,175,143,0.08)' }, { borderColor: active ? BRAND : t.border }]}
                    onPress={() => setFontSizeIdx(i)}
                    activeOpacity={0.8}
                  >
                    <Text style={{ fontSize: 10 + i * 2.5, color: active ? BRAND : t.muted, fontFamily: 'Geist-SemiBold' }}>
                      {lbl}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </View>
            {/* Track visual */}
            <View style={[fs.track, { backgroundColor: t.track }]}>
              <View style={[fs.fill, { width: `${(fontSizeIdx / (FONT_SIZES.length - 1)) * 100}%`, backgroundColor: BRAND }]} />
            </View>
            <Text style={[fs.hint, { color: t.muted }]}>Tamaño actual: {currentSize}px</Text>
          </View>
        </Card>

        {/* Visual */}
        <SLabel label="Visual" />
        <Card isDark={isDark}>
          <ToggleRow isDark={isDark} label="Contraste alto"   desc="Mayor legibilidad en pantalla" value={highContrast} onChange={setHighContrast} />
          <ToggleRow isDark={isDark} label="Reducir movimiento" desc="Minimiza animaciones"       value={reduceMotion} onChange={setReduceMotion} last />
        </Card>

        {/* Navegación */}
        <SLabel label="Navegación" />
        <Card isDark={isDark}>
          <ToggleRow isDark={isDark} label="Atajos de teclado"   desc="Navegación rápida con el teclado"        value={kbShortcuts} onChange={setKbShortcuts} />
          <ToggleRow isDark={isDark} label="Navegación por voz"  desc="Controla la interfaz con comandos"        value={voiceNav}    onChange={setVoiceNav} last />
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

const fs = StyleSheet.create({
  row:   { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  btn:   { width: 44, height: 44, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  track: { height: 4, borderRadius: 2, marginBottom: 10 },
  fill:  { height: '100%', borderRadius: 2 },
  hint:  { fontFamily: 'Geist-Regular', fontSize: 12, textAlign: 'center', paddingBottom: 8 },
})
const s = StyleSheet.create({
  root:       { flex: 1 },
  header:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  backBtn:    { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle:{ fontFamily: 'Geist-SemiBold', fontSize: 16, letterSpacing: -0.2 },
  saveBtn:    { height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  saveBtnText:{ fontFamily: 'Geist-SemiBold', fontSize: 15 },
})