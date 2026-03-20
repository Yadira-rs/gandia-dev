// app/(app)/cfg-notificaciones.tsx — Gandia 7 · Notificaciones
import { useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Switch, useColorScheme, TextInput,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Path, Line, Polyline } from 'react-native-svg'

const BRAND = '#2FAF8F'
const tk = (d: boolean) => ({
  bg:      d ? '#0c0a09' : '#f2f1f0',
  card:    d ? '#141210' : '#ffffff',
  border:  d ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)',
  divider: d ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)',
  text:    d ? '#fafaf9' : '#1c1917',
  text2:   d ? '#d6d3d1' : '#44403c',
  muted:   d ? '#78716c' : '#a8a29e',
  muted2:  d ? '#57534e' : '#c4bfba',
  input:   d ? '#1c1917' : '#f5f4f3',
  inputBorder: d ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.10)',
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
          <Text style={[tr.desc, { color: t.muted }]}>{desc}</Text>
        </View>
        <Switch
          value={value} onValueChange={onChange}
          trackColor={{ false: isDark ? '#44403c' : '#d6d3d1', true: BRAND }}
          thumbColor="#fff"
          ios_backgroundColor={isDark ? '#44403c' : '#d6d3d1'}
        />
      </View>
      {!last && <View style={[tr.div, { backgroundColor: t.divider, marginLeft: 16 }]} />}
    </>
  )
}
const tr = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, minHeight: 56 },
  label: { fontFamily: 'Geist-Medium',  fontSize: 14, letterSpacing: -0.1 },
  desc:  { fontFamily: 'Geist-Regular', fontSize: 12, marginTop: 2 },
  div:   { height: StyleSheet.hairlineWidth },
})

export default function CfgNotificaciones() {
  const isDark = useColorScheme() === 'dark'
  const t      = tk(isDark)
  const insets = useSafeAreaInsets()
  const router = useRouter()

  // Tipos de eventos
  const [alertas,         setAlertas]         = useState(true)
  const [auditorias,      setAuditorias]       = useState(true)
  const [certificaciones, setCertificaciones]  = useState(true)
  const [sistema,         setSistema]          = useState(false)
  const [menciones,       setMenciones]        = useState(true)

  // Canales
  const [push,  setPush]  = useState(true)
  const [email, setEmail] = useState(true)
  const [sms,   setSms]   = useState(false)

  // No molestar
  const [dndDesde, setDndDesde] = useState('22:00')
  const [dndHasta, setDndHasta] = useState('07:00')

  const handleSave = () => {
    // Tu compañero: guardar en Supabase
    router.back()
  }

  return (
    <View style={[s.root, { backgroundColor: t.bg }]}>
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + 10, borderBottomColor: t.divider }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.7}>
          <IcoBack c={t.muted} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: t.text }]}>Notificaciones</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>

        {/* Tipos de eventos */}
        <SLabel label="Tipos de eventos" />
        <Card isDark={isDark}>
          <ToggleRow isDark={isDark} label="Alertas técnicas"    desc="Monitoreo, cámaras y drones"      value={alertas}         onChange={setAlertas} />
          <ToggleRow isDark={isDark} label="Auditorías"          desc="Actualizaciones de procesos"      value={auditorias}      onChange={setAuditorias} />
          <ToggleRow isDark={isDark} label="Certificaciones"     desc="Estado y renovaciones"            value={certificaciones} onChange={setCertificaciones} />
          <ToggleRow isDark={isDark} label="Sistema"             desc="Actualizaciones y mantenimiento"  value={sistema}         onChange={setSistema} />
          <ToggleRow isDark={isDark} label="Menciones en chat"   desc="Cuando alguien te menciona"       value={menciones}       onChange={setMenciones} last />
        </Card>

        {/* Canales de entrega */}
        <SLabel label="Canales de entrega" />
        <Card isDark={isDark}>
          <ToggleRow isDark={isDark} label="Push"                desc="Alertas en el dispositivo"        value={push}  onChange={setPush} />
          <ToggleRow isDark={isDark} label="Correo electrónico"  desc="Resúmenes diarios y urgentes"     value={email} onChange={setEmail} />
          <ToggleRow isDark={isDark} label="SMS"                 desc="Solo alertas críticas"            value={sms}   onChange={setSms} last />
        </Card>

        {/* No molestar */}
        <SLabel label="No molestar" />
        <Card isDark={isDark}>
          <View style={nd.row}>
            <Text style={[nd.label, { color: t.text }]}>Desde</Text>
            <TextInput
              value={dndDesde} onChangeText={setDndDesde}
              style={[nd.input, { backgroundColor: t.input, borderColor: t.inputBorder, color: t.text }]}
              placeholderTextColor={t.muted}
              keyboardType="numbers-and-punctuation"
            />
          </View>
          <View style={[nd.div, { backgroundColor: t.divider, marginLeft: 16 }]} />
          <View style={nd.row}>
            <Text style={[nd.label, { color: t.text }]}>Hasta</Text>
            <TextInput
              value={dndHasta} onChangeText={setDndHasta}
              style={[nd.input, { backgroundColor: t.input, borderColor: t.inputBorder, color: t.text }]}
              placeholderTextColor={t.muted}
              keyboardType="numbers-and-punctuation"
            />
          </View>
        </Card>

        {/* Guardar */}
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

const nd = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  label: { fontFamily: 'Geist-Medium', fontSize: 14 },
  input: { fontFamily: 'Geist-Medium', fontSize: 14, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, borderWidth: 1, minWidth: 80, textAlign: 'center' },
  div:   { height: StyleSheet.hairlineWidth },
})
const s = StyleSheet.create({
  root:   { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  backBtn:{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: 'Geist-SemiBold', fontSize: 16, letterSpacing: -0.2 },
  saveBtn:     { height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { fontFamily: 'Geist-SemiBold', fontSize: 15 },
})