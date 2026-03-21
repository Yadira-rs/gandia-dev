// app/(app)/cfg-asistente.tsx — Gandia 7 · Asistente IA
import { useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Switch, useColorScheme,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Line, Polyline } from 'react-native-svg'

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

function SLabel({ label }: { label: string }) {
  return <Text style={sl.t}>{label.toUpperCase()}</Text>
}
const sl = StyleSheet.create({ t: { fontFamily: 'Geist-SemiBold', fontSize: 11, letterSpacing: 0.9, color: '#a8a29e', paddingHorizontal: 20, paddingTop: 22, paddingBottom: 7 } })

function Card({ children, isDark }: { children: React.ReactNode; isDark: boolean }) {
  const t = tk(isDark)
  return <View style={[cd.c, { backgroundColor: t.card, borderColor: t.border }]}>{children}</View>
}
const cd = StyleSheet.create({ c: { marginHorizontal: 16, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' } })

type DetailLevel = 'concise' | 'balanced' | 'detailed'
type Tone = 'professional' | 'casual'

// Selector horizontal de chips
function ChipGroup<T extends string>({ options, value, onChange, isDark }: {
  options: { id: T; label: string; sub?: string }[]
  value: T
  onChange: (v: T) => void
  isDark: boolean
}) {
  const t = tk(isDark)
  return (
    <View style={cg.row}>
      {options.map(opt => {
        const active = opt.id === value
        return (
          <TouchableOpacity
            key={opt.id}
            style={[cg.chip, {
              backgroundColor: active ? (isDark ? 'rgba(47,175,143,0.14)' : 'rgba(47,175,143,0.10)') : t.seg,
              borderColor: active ? BRAND : 'transparent',
              borderWidth: active ? 1.5 : 0,
            }]}
            onPress={() => onChange(opt.id)}
            activeOpacity={0.8}
          >
            <Text style={[cg.chipLabel, { color: active ? BRAND : t.muted }]}>{opt.label}</Text>
            {opt.sub ? <Text style={[cg.chipSub, { color: active ? BRAND : t.muted2 }]}>{opt.sub}</Text> : null}
          </TouchableOpacity>
        )
      })}
    </View>
  )
}
const cg = StyleSheet.create({
  row:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, paddingVertical: 12 },
  chip:      { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
  chipLabel: { fontFamily: 'Geist-Medium',  fontSize: 13 },
  chipSub:   { fontFamily: 'Geist-Regular', fontSize: 10.5, marginTop: 2 },
})

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

export default function CfgAsistente() {
  const isDark = useColorScheme() === 'dark'
  const t      = tk(isDark)
  const insets = useSafeAreaInsets()
  const router = useRouter()

  const [detail,      setDetail]      = useState<DetailLevel>('balanced')
  const [tone,        setTone]        = useState<Tone>('professional')
  const [sugerencias, setSugerencias] = useState(true)
  const [recordatorios, setRecordatorios] = useState(true)
  const [historial,   setHistorial]   = useState(true)

  const handleSave = () => router.back()

  return (
    <View style={[s.root, { backgroundColor: t.bg }]}>
      <View style={[s.header, { paddingTop: insets.top + 10, borderBottomColor: t.divider }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.7}>
          <IcoBack c={t.muted} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: t.text }]}>Asistente IA</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>

        {/* Comportamiento */}
        <SLabel label="Comportamiento" />

        {/* Nivel de detalle */}
        <View style={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 2 }}>
          <Text style={[s.subLabel, { color: t.muted }]}>Nivel de detalle</Text>
        </View>
        <Card isDark={isDark}>
          <ChipGroup<DetailLevel>
            isDark={isDark} value={detail} onChange={setDetail}
            options={[
              { id: 'concise',  label: 'Conciso',    sub: 'Directo'    },
              { id: 'balanced', label: 'Balanceado', sub: 'Recomendado'},
              { id: 'detailed', label: 'Detallado',  sub: 'Completo'   },
            ]}
          />
        </Card>

        {/* Tono */}
        <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 2 }}>
          <Text style={[s.subLabel, { color: t.muted }]}>Tono</Text>
        </View>
        <Card isDark={isDark}>
          <ChipGroup<Tone>
            isDark={isDark} value={tone} onChange={setTone}
            options={[
              { id: 'professional', label: 'Profesional' },
              { id: 'casual',       label: 'Casual'       },
            ]}
          />
        </Card>

        {/* Funciones */}
        <SLabel label="Funciones" />
        <Card isDark={isDark}>
          <ToggleRow isDark={isDark} label="Sugerencias automáticas"  desc="Acciones relevantes según el contexto" value={sugerencias}    onChange={setSugerencias} />
          <ToggleRow isDark={isDark} label="Recordatorios inteligentes" desc="Basados en tu actividad"            value={recordatorios}  onChange={setRecordatorios} />
          <ToggleRow isDark={isDark} label="Mantener historial"         desc="Guardar conversaciones"             value={historial}      onChange={setHistorial} last />
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
  subLabel:   { fontFamily: 'Geist-Medium', fontSize: 12.5, marginBottom: 8 },
  saveBtn:    { height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  saveBtnText:{ fontFamily: 'Geist-SemiBold', fontSize: 15 },
})