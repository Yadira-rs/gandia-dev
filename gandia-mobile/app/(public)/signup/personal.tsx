// app/(public)/signup/personal.tsx
import { useState, useEffect, useRef } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  KeyboardAvoidingView, Platform, Animated,
  useColorScheme, StatusBar, Modal, ScrollView,
  SafeAreaView, FlatList, ActivityIndicator,
} from 'react-native'
import { useRouter } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'
import Svg, { Path, Line, Polyline } from 'react-native-svg'

// ─── Types ────────────────────────────────────────────────────────────────────
type SubStep =
  | 'name' | 'birthdate' | 'gender' | 'curp' | 'phone'
  | 'code' | 'address' | 'state' | 'municipality' | 'postalCode' | 'rfc' | 'role'

type Role = 'producer' | 'mvz' | 'union' | 'exporter' | 'auditor'

// En lugar de React.ReactNode en state, usamos un discriminador tipado.
// Esto evita el bug del web donde los componentes se re-montaban en cada render.
type CustomType = 'options' | 'state' | 'municipality' | 'code' | 'role'

interface Message {
  type: 'assistant' | 'user'
  text?: string
  customType?: CustomType
  customData?: any   // datos necesarios para renderizar el custom widget
  id: number         // id fijo para que FlatList no re-monte widgets
}

// ─── Tokens (idéntico al sistema de login/SignUpAuth) ─────────────────────────
const tokens = (isDark: boolean) => ({
  bg:            isDark ? '#0c0a09' : '#fafaf9',
  surface:       isDark ? '#141210' : '#ffffff',
  border:        isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.10)',
  text:          isDark ? '#fafaf9' : '#1c1917',
  muted:         isDark ? '#78716c' : '#a8a29e',
  subtext:       isDark ? '#57534e' : '#a8a29e',
  msgUser:       isDark ? '#1c1917' : '#ffffff',
  msgUserBorder: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
  inputBg:       isDark ? '#141210' : '#ffffff',
  inputBorder:   isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.12)',
  optionBg:      isDark ? '#1c1917' : '#ffffff',
  optionBorder:  isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.12)',
  searchBg:      isDark ? '#1a1918' : '#ffffff',
})

// ─── Logo ─────────────────────────────────────────────────────────────────────
function GandiaLogo({ size = 18 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2L2 7l10 5 10-5-10-5z" stroke="#2FAF8F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M2 17l10 5 10-5"             stroke="#2FAF8F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M2 12l10 5 10-5"             stroke="#2FAF8F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

// ─── Typing dots ──────────────────────────────────────────────────────────────
function TypingDot({ delay, color }: { delay: number; color: string }) {
  const anim = useRef(new Animated.Value(0)).current
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.delay(delay),
      Animated.timing(anim, { toValue: -4, duration: 300, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 0,  duration: 300, useNativeDriver: true }),
      Animated.delay(600),
    ])).start()
  }, [])
  return <Animated.View style={[p.dot, { backgroundColor: color, transform: [{ translateY: anim }] }]} />
}

// ─── Confirm Modal ────────────────────────────────────────────────────────────
function ConfirmModal({ open, title, description, confirmLabel = 'Confirmar', onConfirm, onCancel, isDark }: {
  open: boolean; title: string; description: string; confirmLabel?: string
  onConfirm: () => void; onCancel: () => void; isDark: boolean
}) {
  const t = tokens(isDark)
  const scale = useRef(new Animated.Value(0.94)).current
  const op    = useRef(new Animated.Value(0)).current
  useEffect(() => {
    if (open) {
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, friction: 7, tension: 100, useNativeDriver: true }),
        Animated.timing(op, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start()
    } else { scale.setValue(0.94); op.setValue(0) }
  }, [open])
  if (!open) return null
  return (
    <Modal visible={open} transparent animationType="none" statusBarTranslucent onRequestClose={onCancel}>
      <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' } as any} />
      <View style={{ ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 } as any} pointerEvents="box-none">
        <Animated.View style={{ width: '100%', maxWidth: 360, borderRadius: 20, overflow: 'hidden', opacity: op, transform: [{ scale }] }}>
          <View style={{ height: 2, backgroundColor: '#2FAF8F', opacity: 0.6 }} />
          <View style={{ backgroundColor: t.surface, borderWidth: 1, borderTopWidth: 0, borderColor: t.border, borderBottomLeftRadius: 20, borderBottomRightRadius: 20, paddingHorizontal: 22, paddingTop: 20, paddingBottom: 18 }}>
            <Text style={{ fontFamily: 'Geist-SemiBold', fontSize: 15, color: t.text, marginBottom: 6 }}>{title}</Text>
            <Text style={{ fontFamily: 'Geist-Regular', fontSize: 13, color: t.muted, lineHeight: 20, marginBottom: 18 }}>{description}</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity onPress={onCancel}  style={{ flex: 1, height: 42, borderRadius: 12, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f5f5f4', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontFamily: 'Geist-Medium', fontSize: 13, color: t.muted }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onConfirm} style={{ flex: 1, height: 42, borderRadius: 12, backgroundColor: '#2FAF8F', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontFamily: 'Geist-SemiBold', fontSize: 13, color: '#fff' }}>{confirmLabel}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  )
}

// ─── OptionsGrid ──────────────────────────────────────────────────────────────
// Se mantiene montado porque vive en el array de mensajes con id fijo.
function OptionsGrid({ options, onSelect, isDark }: {
  options: string[]; onSelect: (val: string) => void; isDark: boolean
}) {
  const t = tokens(isDark)
  const [selected, setSelected] = useState<string | null>(null)
  const [disabled, setDisabled] = useState(false)

  const handle = (opt: string) => {
    if (disabled) return
    setSelected(opt); setDisabled(true)
    setTimeout(() => onSelect(opt), 300)
  }

  return (
    <View style={w.optGrid}>
      {options.map(opt => (
        <TouchableOpacity
          key={opt}
          onPress={() => handle(opt)}
          disabled={disabled}
          activeOpacity={0.7}
          style={[
            w.optBtn,
            { backgroundColor: t.optionBg, borderColor: selected === opt ? '#2FAF8F' : t.optionBorder },
            selected === opt && { backgroundColor: 'rgba(47,175,143,0.08)' },
            disabled && selected !== opt && { opacity: 0.4 },
          ]}
        >
          <Text style={[w.optTxt, { color: selected === opt ? '#2FAF8F' : t.text }]}>{opt}</Text>
        </TouchableOpacity>
      ))}
    </View>
  )
}

// ─── StateSelector ────────────────────────────────────────────────────────────
function StateSelector({ states, onSelect, isDark }: {
  states: string[]; onSelect: (val: string) => void; isDark: boolean
}) {
  const t = tokens(isDark)
  const [query, setQuery]       = useState('')
  const [selected, setSelected] = useState<string | null>(null)
  const [disabled, setDisabled] = useState(false)
  const filtered = states.filter(s => s.toLowerCase().includes(query.toLowerCase()))

  const handle = (state: string) => {
    if (disabled) return
    setSelected(state); setDisabled(true)
    setTimeout(() => onSelect(state), 300)
  }

  return (
    <View style={w.searchWrap}>
      {/* Search input */}
      <View style={[w.searchRow, { backgroundColor: t.searchBg, borderColor: t.inputBorder }]}>
        <Svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={t.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </Svg>
        <TextInput
          style={[w.searchInput, { color: t.text }]}
          placeholder="Buscar estado..."
          placeholderTextColor={t.subtext}
          value={query}
          onChangeText={setQuery}
          editable={!disabled}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>
      {/* List */}
      <View style={[w.listBox, { borderColor: t.border }]}>
        {filtered.length > 0 ? (
          filtered.map(state => (
            <TouchableOpacity
              key={state}
              onPress={() => handle(state)}
              disabled={disabled}
              activeOpacity={0.7}
              style={[
                w.listItem,
                { borderBottomColor: t.border, backgroundColor: t.optionBg },
                selected === state && { backgroundColor: 'rgba(47,175,143,0.08)' },
                disabled && selected !== state && { opacity: 0.4 },
              ]}
            >
              <Text style={[w.listItemTxt, { color: selected === state ? '#2FAF8F' : t.text }, selected === state && { fontFamily: 'Geist-SemiBold' }]}>
                {state}
              </Text>
            </TouchableOpacity>
          ))
        ) : (
          <View style={w.emptyList}>
            <Text style={[w.emptyListTxt, { color: t.muted }]}>No se encontraron resultados</Text>
          </View>
        )}
      </View>
    </View>
  )
}

// ─── MunicipalitySelector ─────────────────────────────────────────────────────
function MunicipalitySelector({ municipalities, onSelect, isDark }: {
  municipalities: string[]; onSelect: (val: string) => void; isDark: boolean
}) {
  const t = tokens(isDark)
  const [query, setQuery]       = useState('')
  const [selected, setSelected] = useState<string | null>(null)
  const [disabled, setDisabled] = useState(false)
  const filtered = municipalities.filter(m => m.toLowerCase().includes(query.toLowerCase()))

  const handle = (mun: string) => {
    if (disabled) return
    setSelected(mun); setDisabled(true)
    setTimeout(() => onSelect(mun), 300)
  }

  const useCustom = () => {
    if (!query.trim() || disabled) return
    handle(query.trim())
  }

  return (
    <View style={w.searchWrap}>
      <View style={[w.searchRow, { backgroundColor: t.searchBg, borderColor: t.inputBorder }]}>
        <Svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={t.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </Svg>
        <TextInput
          style={[w.searchInput, { color: t.text }]}
          placeholder="Buscar municipio..."
          placeholderTextColor={t.subtext}
          value={query}
          onChangeText={setQuery}
          editable={!disabled}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>
      <View style={[w.listBox, { borderColor: t.border }]}>
        {filtered.length > 0 ? (
          filtered.map(mun => (
            <TouchableOpacity
              key={mun}
              onPress={() => handle(mun)}
              disabled={disabled}
              activeOpacity={0.7}
              style={[
                w.listItem,
                { borderBottomColor: t.border, backgroundColor: t.optionBg },
                selected === mun && { backgroundColor: 'rgba(47,175,143,0.08)' },
                disabled && selected !== mun && { opacity: 0.4 },
              ]}
            >
              <Text style={[w.listItemTxt, { color: selected === mun ? '#2FAF8F' : t.text }, selected === mun && { fontFamily: 'Geist-SemiBold' }]}>
                {mun}
              </Text>
            </TouchableOpacity>
          ))
        ) : (
          <View style={w.emptyList}>
            <Text style={[w.emptyListTxt, { color: t.muted }]}>No se encontró el municipio</Text>
            {query.trim().length > 0 && (
              <TouchableOpacity onPress={useCustom} style={{ marginTop: 6 }}>
                <Text style={{ fontSize: 12, fontFamily: 'Geist-Medium', color: '#2FAF8F' }}>Usar "{query}"</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </View>
  )
}

// ─── CodeInput ────────────────────────────────────────────────────────────────
function CodeInputWithResend({ onComplete, onResend, isDark }: {
  onComplete: (code: string) => void; onResend: () => void; isDark: boolean
}) {
  const t = tokens(isDark)
  const [code, setCode]           = useState(['', '', '', '', '', ''])
  const [countdown, setCountdown] = useState(60)
  const [disabled, setDisabled]   = useState(false)
  const inputsRef = useRef<(TextInput | null)[]>([])

  useEffect(() => {
    if (countdown <= 0) return
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown])

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const newCode = [...code]
    newCode[index] = value
    setCode(newCode)
    if (value && index < 5) inputsRef.current[index + 1]?.focus()
    if (newCode.every(d => d !== '')) {
      setDisabled(true)
      onComplete(newCode.join(''))
    }
  }

  const handleKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && !code[index] && index > 0) {
      inputsRef.current[index - 1]?.focus()
    }
  }

  const handleResend = () => {
    setCountdown(60)
    setCode(['', '', '', '', '', ''])
    setDisabled(false)
    onResend()
    setTimeout(() => inputsRef.current[0]?.focus(), 100)
  }

  return (
    <View style={w.codeWrap}>
      <View style={w.codeRow}>
        {code.map((digit, i) => (
          <TextInput
            key={i}
            ref={el => { inputsRef.current[i] = el }}
            style={[
              w.codeInput,
              {
                backgroundColor: t.searchBg,
                borderColor: digit ? '#2FAF8F' : t.inputBorder,
                color: t.text,
              },
            ]}
            value={digit}
            onChangeText={v => handleChange(i, v)}
            onKeyPress={({ nativeEvent }) => handleKeyPress(i, nativeEvent.key)}
            keyboardType="number-pad"
            maxLength={1}
            editable={!disabled}
            selectTextOnFocus
            textAlign="center"
          />
        ))}
      </View>
      <View style={w.codeFooter}>
        {countdown > 0 ? (
          <Text style={[w.codeCountdown, { color: t.muted }]}>Reenviar código en {countdown}s</Text>
        ) : (
          <TouchableOpacity onPress={handleResend}>
            <Text style={w.codeResend}>Reenviar código</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

// ─── RoleGrid ─────────────────────────────────────────────────────────────────
const ROLES = [
  { value: 'producer' as Role, title: 'Productor Ganadero',            desc: 'Dueño o administrador de rancho/UPP',      path: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { value: 'mvz'      as Role, title: 'Médico Veterinario Zootecnista', desc: 'Profesional certificado para dictámenes',   path: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { value: 'union'    as Role, title: 'Unión Ganadera',                 desc: 'Coordinador regional o estatal',           path: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
  { value: 'exporter' as Role, title: 'Exportador',                     desc: 'Empresa de exportación binacional',        path: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { value: 'auditor'  as Role, title: 'Auditor / Inspector',            desc: 'SENASICA o entidad certificadora',         path: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
]

function RoleGrid({ onSelect, isDark }: { onSelect: (value: Role, title: string) => void; isDark: boolean }) {
  const t = tokens(isDark)
  const [selected, setSelected] = useState<Role | null>(null)

  const handle = (role: typeof ROLES[0]) => {
    if (selected) return
    setSelected(role.value)
    setTimeout(() => onSelect(role.value, role.title), 300)
  }

  return (
    <View style={w.roleGrid}>
      {ROLES.map(role => (
        <TouchableOpacity
          key={role.value}
          onPress={() => handle(role)}
          disabled={selected !== null}
          activeOpacity={0.75}
          style={[
            w.roleBtn,
            { backgroundColor: t.optionBg, borderColor: selected === role.value ? '#2FAF8F' : t.optionBorder },
            selected === role.value && { backgroundColor: 'rgba(47,175,143,0.08)' },
            selected !== null && selected !== role.value && { opacity: 0.4 },
          ]}
        >
          <View style={w.roleIcon}>
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#2FAF8F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <Path d={role.path} />
            </Svg>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[w.roleTitle, { color: t.text }]}>{role.title}</Text>
            <Text style={[w.roleDesc,  { color: t.muted }]}>{role.desc}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  )
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const ESTADOS = [
  'Aguascalientes','Baja California','Baja California Sur','Campeche','Chiapas',
  'Chihuahua','Ciudad de México','Coahuila','Colima','Durango','Estado de México',
  'Guanajuato','Guerrero','Hidalgo','Jalisco','Michoacán','Morelos','Nayarit',
  'Nuevo León','Oaxaca','Puebla','Querétaro','Quintana Roo','San Luis Potosí',
  'Sinaloa','Sonora','Tabasco','Tamaulipas','Tlaxcala','Veracruz','Yucatán','Zacatecas',
]

const MUNICIPIOS: Record<string, string[]> = {
  'Durango': [
    'Canatlán','Canelas','Coneto de Comonfort','Cuencamé','Durango',
    'El Oro','Gómez Palacio','Guadalupe Victoria','Guanaceví','Lerdo',
    'Mapimí','Mezquital','Nombre de Dios','Nuevo Ideal','Ocampo',
    'Otáez','Pánuco de Coronado','Peñón Blanco','Poanas','Pueblo Nuevo',
    'Rodeo','San Bernardo','San Dimas','San Juan de Guadalupe','San Juan del Río',
    'San Luis del Cordero','San Pedro del Gallo','Santa Clara','Santiago Papasquiaro',
    'Súchil','Tamazula','Tepehuanes','Tlahualilo','Topia','Vicente Guerrero',
  ],
}

const generateCode = () => Array.from({ length: 6 }, () => Math.floor(Math.random() * 10)).join('')

// ─── STEPS config ─────────────────────────────────────────────────────────────
const STEPS: SubStep[] = [
  'name','birthdate','gender','curp','phone','code',
  'address','state','municipality','postalCode','rfc','role',
]
const STEP_LABELS: Record<SubStep, string> = {
  name:'Nombre', birthdate:'Nacimiento', gender:'Género', curp:'CURP',
  phone:'Teléfono', code:'Verificación', address:'Domicilio',
  state:'Estado', municipality:'Municipio', postalCode:'C.P.', rfc:'RFC', role:'Rol',
}
const PLACEHOLDERS: Partial<Record<SubStep, string>> = {
  name:       'Juan Pérez García',
  birthdate:  '15/03/1985',
  curp:       'PEGJ850315HDFRNN09 o "omitir"',
  phone:      '+52 614 123 4567',
  address:    'Calle Revolución #123, Col. Centro',
  postalCode: '34000',
  rfc:        'PEGJ850315ABC o "omitir"',
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function SignUpPersonal() {
  const router      = useRouter()
  const colorScheme = useColorScheme()
  const isDark      = colorScheme === 'dark'
  const t           = tokens(isDark)

  const [messages,       setMessages]       = useState<Message[]>([])
  const [userInput,      setUserInput]       = useState('')
  const [isTyping,       setIsTyping]        = useState(false)
  const [inputEnabled,   setInputEnabled]    = useState(false)
  const [subStep,        setSubStep]         = useState<SubStep>('name')
  const [userData,       setUserData]        = useState({
    fullName: '', birthdate: '', gender: '', curp: '', phone: '',
    address: '', state: '', municipality: '', postalCode: '', rfc: '',
    role: '' as Role | '', country: 'México',
  })

  const scrollRef      = useRef<ScrollView>(null)
  const inputRef       = useRef<TextInput>(null)
  const initialized    = useRef(false)
  const simCodeRef     = useRef('')
  const msgId          = useRef(0)
  const subStepRef     = useRef<SubStep>('name')  // ref para closures async
  const userDataRef    = useRef(userData)

  // Sync refs
  useEffect(() => { subStepRef.current = subStep }, [subStep])
  useEffect(() => { userDataRef.current = userData }, [userData])

  const [modal, setModal] = useState({ open: false, title: '', description: '', confirmLabel: 'Confirmar', onConfirm: () => {} })
  const showConfirm = (title: string, desc: string, label: string, fn: () => void) =>
    setModal({ open: true, title, description: desc, confirmLabel: label, onConfirm: fn })
  const closeModal  = () => setModal(m => ({ ...m, open: false }))

  // ── Scroll to bottom ────────────────────────────────────────────────────────
  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120)
  }, [messages, isTyping])

  // ── Focus input — only when step changes, not when processing ──────────────
  const prevSubStep = useRef<SubStep>('name')
  useEffect(() => {
    if (subStep !== prevSubStep.current) {
      prevSubStep.current = subStep
      if (showTextInput) setTimeout(() => inputRef.current?.focus(), 150)
    }
  }, [subStep])

  // ── Init ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    checkAuthAndStart()
  }, [])

  const checkAuthAndStart = async () => {
    const method = await AsyncStorage.getItem('signup-auth-method')
    if (!method) { router.replace('/(public)/signup' as any); return }

    setTimeout(() => {
      addMsg({ type: 'assistant', text: 'Bienvenido a GANDIA. Para comenzar el registro, necesito conocerte mejor.' })
      setTimeout(() => {
        addMsg({ type: 'assistant', text: '¿Cuál es tu nombre completo?' })
        setInputEnabled(true)
      }, 800)
    }, 500)
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const nextId = () => { msgId.current += 1; return msgId.current }

  const addMsg = (msg: Omit<Message, 'id'>) =>
    setMessages(prev => [...prev, { ...msg, id: nextId() }])

  const typing = (on: boolean) => setIsTyping(on)

  const after = (ms: number, fn: () => void) => setTimeout(fn, ms)

  // ── Back ─────────────────────────────────────────────────────────────────────
  const handleBack = () => {
    showConfirm(
      '¿Regresar?',
      'Se perderá el progreso del registro.',
      'Sí, regresar',
      async () => {
        closeModal()
        await AsyncStorage.removeItem('signup-personal-data')
        router.replace('/(public)/signup' as any)
      }
    )
  }

  // ── Send ────────────────────────────────────────────────────────────────────
  const handleSend = () => {
    const value = userInput.trim()
    if (!value || !inputEnabled) return
    addMsg({ type: 'user', text: value })
    setUserInput('')
    // Don't disable input - keeps keyboard open. Processing state handled by inputEnabled from processInput.
    processInput(value)
  }

  // ── Process ─────────────────────────────────────────────────────────────────
  const processInput = async (value: string) => {
    setInputEnabled(false)  // disable send button only - TextInput stays editable
    typing(true)
    await new Promise(r => setTimeout(r, 600))
    typing(false)

    const step = subStepRef.current

    try {
      switch (step) {

        case 'name': {
          const parts = value.trim().split(/\s+/)
          if (parts.length < 2) {
            addMsg({ type: 'assistant', text: 'Por favor ingresa tu nombre completo (nombre y al menos un apellido).' })
            setInputEnabled(true); return
          }
          if (parts.some(p => p.length < 2)) {
            addMsg({ type: 'assistant', text: 'Cada parte del nombre debe tener al menos 2 caracteres.' })
            setInputEnabled(true); return
          }
          if (!/^[a-záéíóúñüA-ZÁÉÍÓÚÑÜ\s]+$/.test(value)) {
            addMsg({ type: 'assistant', text: 'El nombre solo puede contener letras y espacios.' })
            setInputEnabled(true); return
          }
          setUserData(prev => ({ ...prev, fullName: value }))
          addMsg({ type: 'assistant', text: `Un gusto, ${parts[0]}.` })
          after(400, () => {
            typing(true)
            after(700, () => {
              typing(false)
              addMsg({ type: 'assistant', text: '¿Cuál es tu fecha de nacimiento? (DD/MM/AAAA)' })
              setSubStep('birthdate')
              setInputEnabled(true)
            })
          })
          break
        }

        case 'birthdate': {
          const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
          if (!match) {
            addMsg({ type: 'assistant', text: 'Formato inválido. Usa DD/MM/AAAA, por ejemplo: 15/03/1985' })
            setInputEnabled(true); return
          }
          const [, dd, mm, yyyy] = match
          const d = new Date(+yyyy, +mm - 1, +dd)
          if (d.getDate() !== +dd || d.getMonth() !== +mm - 1) {
            addMsg({ type: 'assistant', text: 'La fecha no es válida. Verifica el día y mes.' })
            setInputEnabled(true); return
          }
          const now = new Date()
          const age = now.getFullYear() - d.getFullYear() -
            (now < new Date(now.getFullYear(), d.getMonth(), d.getDate()) ? 1 : 0)
          if (d > now) {
            addMsg({ type: 'assistant', text: 'La fecha no puede ser futura.' })
            setInputEnabled(true); return
          }
          if (age < 18) {
            addMsg({ type: 'assistant', text: 'Debes ser mayor de 18 años para registrarte.' })
            setInputEnabled(true); return
          }
          if (age > 110) {
            addMsg({ type: 'assistant', text: 'La fecha parece incorrecta. Verifica el año.' })
            setInputEnabled(true); return
          }
          setUserData(prev => ({ ...prev, birthdate: value }))
          addMsg({ type: 'assistant', text: 'Perfecto.' })
          after(400, () => {
            typing(true)
            after(700, () => {
              typing(false)
              addMsg({ type: 'assistant', text: '¿Cuál es tu género? (opcional)' })
              addMsg({
                type: 'assistant',
                customType: 'options',
                customData: { options: ['Masculino', 'Femenino', 'No binario', 'Prefiero no decirlo'] },
              })
              setSubStep('gender')
            })
          })
          break
        }

        case 'curp': {
          if (value.toUpperCase() !== 'OMITIR') {
            if (!/^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z\d]\d$/i.test(value)) {
              addMsg({ type: 'assistant', text: 'La CURP debe tener 18 caracteres con formato correcto. Escribe "omitir" si no la tienes.' })
              setInputEnabled(true); return
            }
          }
          setUserData(prev => ({ ...prev, curp: value.toUpperCase() === 'OMITIR' ? '' : value.toUpperCase() }))
          goToPhone()
          break
        }

        case 'phone': {
          const clean = value.replace(/[\s\-()+]/g, '')
          if (!/^\d{10,15}$/.test(clean)) {
            addMsg({ type: 'assistant', text: 'Formato inválido. Ingresa solo dígitos, ej: +52 614 123 4567' })
            setInputEnabled(true); return
          }
          const digits = clean.replace(/^52/, '')
          if (digits.length < 10) {
            addMsg({ type: 'assistant', text: 'El número debe tener al menos 10 dígitos. Incluye el código de área.' })
            setInputEnabled(true); return
          }
          setUserData(prev => ({ ...prev, phone: value }))
          sendVerification(value)
          break
        }

        case 'address': {
          if (value.trim().length < 10) {
            addMsg({ type: 'assistant', text: 'Por favor proporciona una dirección más completa (ej: Calle Hidalgo #123, Col. Centro).' })
            setInputEnabled(true); return
          }
          setUserData(prev => ({ ...prev, address: value }))
          addMsg({ type: 'assistant', text: 'Anotado.' })
          after(400, () => {
            typing(true)
            after(700, () => {
              typing(false)
              addMsg({ type: 'assistant', text: '¿En qué estado de México te encuentras?' })
              addMsg({ type: 'assistant', customType: 'state', customData: { states: ESTADOS } })
              setSubStep('state')
            })
          })
          break
        }

        case 'municipality': {
          if (value.trim().length < 3) {
            addMsg({ type: 'assistant', text: 'El nombre del municipio parece muy corto.' })
            setInputEnabled(true); return
          }
          setUserData(prev => ({ ...prev, municipality: value }))
          addMsg({ type: 'assistant', text: 'Perfecto.' })
          after(400, () => {
            typing(true)
            after(700, () => {
              typing(false)
              addMsg({ type: 'assistant', text: '¿Cuál es tu código postal?' })
              setSubStep('postalCode')
              setInputEnabled(true)
            })
          })
          break
        }

        case 'postalCode': {
          if (!/^\d{5}$/.test(value)) {
            addMsg({ type: 'assistant', text: 'El código postal debe tener exactamente 5 dígitos.' })
            setInputEnabled(true); return
          }
          setUserData(prev => ({ ...prev, postalCode: value }))
          goToRFC()
          break
        }

        case 'rfc': {
          if (value.toUpperCase() !== 'OMITIR') {
            if (!/^[A-ZÑ&]{3,4}\d{6}[A-Z\d]{3}$/i.test(value)) {
              addMsg({ type: 'assistant', text: 'RFC inválido. Debe tener 12-13 caracteres. Escribe "omitir" para continuar.' })
              setInputEnabled(true); return
            }
          }
          setUserData(prev => ({ ...prev, rfc: value.toUpperCase() === 'OMITIR' ? '' : value.toUpperCase() }))
          goToRoleSelection()
          break
        }

        default: break
      }
    } catch (err: unknown) {
      typing(false)
      addMsg({ type: 'assistant', text: `Error: ${err instanceof Error ? err.message : 'Inténtalo de nuevo.'}` })
      setInputEnabled(true)
    }
  }

  // ── Option handlers ──────────────────────────────────────────────────────────
  const handleOptionSelect = (value: string, step: SubStep) => {
    addMsg({ type: 'user', text: value })
    setInputEnabled(false)

    if (step === 'gender') {
      setUserData(prev => ({ ...prev, gender: value }))
      typing(true)
      after(700, () => {
        typing(false)
        addMsg({ type: 'assistant', text: 'Gracias. Ahora necesito tu CURP para validar tu identidad (escribe "omitir" si no la tienes a la mano).' })
        setSubStep('curp')
        setInputEnabled(true)
      })
    }

    if (step === 'state') {
      setUserData(prev => ({ ...prev, state: value }))
      typing(true)
      after(700, () => {
        typing(false)
        const munis = MUNICIPIOS[value]
        if (munis) {
          addMsg({ type: 'assistant', text: 'Selecciona tu municipio:' })
          addMsg({ type: 'assistant', customType: 'municipality', customData: { municipalities: munis } })
          setSubStep('municipality')
        } else {
          addMsg({ type: 'assistant', text: '¿Cuál es tu municipio o ciudad?' })
          setSubStep('municipality')
          setInputEnabled(true)
        }
      })
    }
  }

  const handleMunicipalitySelect = (value: string) => {
    addMsg({ type: 'user', text: value })
    setUserData(prev => ({ ...prev, municipality: value }))
    typing(true)
    after(600, () => {
      typing(false)
      addMsg({ type: 'assistant', text: 'Perfecto.' })
      after(400, () => {
        typing(true)
        after(700, () => {
          typing(false)
          addMsg({ type: 'assistant', text: '¿Cuál es tu código postal?' })
          setSubStep('postalCode')
          setInputEnabled(true)
        })
      })
    })
  }

  // ── Phone verification ───────────────────────────────────────────────────────
  const goToPhone = () => {
    typing(true)
    after(700, () => {
      typing(false)
      addMsg({ type: 'assistant', text: 'Para asegurar tu cuenta, necesito verificar tu número de teléfono móvil.' })
      after(600, () => {
        addMsg({ type: 'assistant', text: 'Ingresa tu número con código de país (ej: +52 614 123 4567):' })
        setSubStep('phone')
        setInputEnabled(true)
      })
    })
  }

  const sendVerification = (phone: string) => {
    typing(true)
    const code = generateCode()
    simCodeRef.current = code
    // SMS simulado — integrar sendPhoneVerificationCode(phone) de authService cuando Twilio esté activo
    console.info(`[GANDIA SMS SIMULADO] Código para ${phone}: ${code}`)
    after(800, () => {
      typing(false)
      addMsg({ type: 'assistant', text: `Te he enviado un código de 6 dígitos vía SMS a ${phone}.` })
      after(400, () => {
        addMsg({
          type: 'assistant',
          customType: 'code',
          customData: { phone },
        })
        setSubStep('code')
      })
    })
  }

  const verifyCode = (code: string) => {
    setInputEnabled(false)
    typing(true)
    after(600, () => {
      typing(false)
      if (code !== simCodeRef.current) {
        addMsg({ type: 'assistant', text: 'Código incorrecto. Verifica e intenta de nuevo.' })
        return
      }
      simCodeRef.current = ''
      setUserData(prev => ({ ...prev }))
      addMsg({ type: 'assistant', text: '¡Número verificado correctamente! ✓' })
      after(400, () => {
        typing(true)
        after(700, () => {
          typing(false)
          addMsg({ type: 'assistant', text: 'Ahora necesito tu domicilio completo.' })
          after(600, () => {
            addMsg({ type: 'assistant', text: '¿Cuál es tu calle, número y colonia?' })
            setSubStep('address')
            setInputEnabled(true)
          })
        })
      })
    })
  }

  const goToRFC = () => {
    typing(true)
    after(700, () => {
      typing(false)
      addMsg({ type: 'assistant', text: 'Último dato fiscal: ¿cuál es tu RFC? (escribe "omitir" si no aplica)' })
      setSubStep('rfc')
      setInputEnabled(true)
    })
  }

  const goToRoleSelection = () => {
    typing(true)
    after(500, () => {
      typing(false)
      addMsg({ type: 'assistant', text: 'Excelente. Ya casi terminamos con tu perfil personal.' })
      after(400, () => {
        typing(true)
        after(700, () => {
          typing(false)
          addMsg({ type: 'assistant', text: '¿Cuál es tu rol principal en el ecosistema ganadero?' })
          addMsg({ type: 'assistant', customType: 'role', customData: {} })
          setSubStep('role')
        })
      })
    })
  }

  const selectRole = async (value: Role, title: string) => {
    const updated = { ...userDataRef.current, role: value }
    setUserData(updated)
    addMsg({ type: 'user', text: title })
    typing(true)
    after(800, async () => {
      typing(false)
      addMsg({ type: 'assistant', text: '¡Perfecto! He guardado tu información personal. Continuaremos con los datos de tu actividad.' })
      await AsyncStorage.setItem('signup-personal-data', JSON.stringify(updated))
      after(2000, () => router.push('/(public)/signup/institutional' as any))
    })
  }

  // ── Progress ─────────────────────────────────────────────────────────────────
  const stepIndex  = STEPS.indexOf(subStep)
  const progressPct = Math.round(((stepIndex + 1) / STEPS.length) * 100)

  // ── Show text input ──────────────────────────────────────────────────────────
  const showTextInput = inputEnabled &&
    subStep !== 'gender' &&
    subStep !== 'state' &&
    subStep !== 'code' &&
    subStep !== 'role'

  // ── Render message custom widget ─────────────────────────────────────────────
  const renderCustom = (msg: Message) => {
    if (!msg.customType) return null
    switch (msg.customType) {
      case 'options':
        return <OptionsGrid options={msg.customData.options} onSelect={v => handleOptionSelect(v, 'gender')} isDark={isDark} />
      case 'state':
        return <StateSelector states={msg.customData.states} onSelect={v => handleOptionSelect(v, 'state')} isDark={isDark} />
      case 'municipality':
        return <MunicipalitySelector municipalities={msg.customData.municipalities} onSelect={handleMunicipalitySelect} isDark={isDark} />
      case 'code':
        return <CodeInputWithResend onComplete={verifyCode} onResend={() => sendVerification(msg.customData.phone)} isDark={isDark} />
      case 'role':
        return <RoleGrid onSelect={selectRole} isDark={isDark} />
      default:
        return null
    }
  }

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={[s.root, { backgroundColor: t.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={t.bg} />

      <ConfirmModal
        open={modal.open} title={modal.title} description={modal.description}
        confirmLabel={modal.confirmLabel} onConfirm={modal.onConfirm} onCancel={closeModal}
        isDark={isDark}
      />

      {/* ── Header ── */}
      <View style={[s.header, { backgroundColor: t.bg, borderBottomColor: t.border }]}>
        {/* Progress bar */}
        <View style={[s.progressTrack, { backgroundColor: isDark ? '#1c1917' : '#e7e5e4' }]}>
          <View style={[s.progressBar, { width: `${progressPct}%` as any }]} />
        </View>
        <View style={s.headerRow}>
          {/* Back */}
          <TouchableOpacity style={s.backBtn} onPress={handleBack} activeOpacity={0.6}>
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={t.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <Path d="M15 19l-7-7 7-7" />
            </Svg>
            <Text style={[s.backTxt, { color: t.muted }]}>Volver</Text>
          </TouchableOpacity>

          {/* Center */}
          <View style={s.headerCenter}>
            <GandiaLogo size={17} />
            <Text style={[s.headerBrand, { color: t.text }]}>GANDIA</Text>
            <View style={[s.headerDivider, { backgroundColor: t.border }]} />
            <Text style={[s.headerSub, { color: t.muted }]}>Datos Personales</Text>
          </View>

          {/* Right: step */}
          <View style={s.headerRight}>
            <Text style={[s.stepNum, { color: t.muted }]}>
              {String(stepIndex + 1).padStart(2, '0')} / {String(STEPS.length).padStart(2, '0')}
            </Text>
            <View style={[s.headerDivider, { backgroundColor: t.border }]} />
            <Text style={[s.stepLabel, { color: t.muted }]}>{STEP_LABELS[subStep]}</Text>
          </View>
        </View>
      </View>

      {/* ── Messages ── */}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={[s.messages, messages.length === 0 && { flex: 1 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Empty state */}
          {messages.length === 0 && (
            <View style={s.empty}>
              <Text style={[s.emptyTitle, { color: t.text }]}>{'Cuéntanos\nsobre ti.'}</Text>
              <Text style={[s.emptyHint, { color: t.muted }]}>Paso 2 de 4 — Datos personales</Text>
            </View>
          )}

          {/* Messages */}
          {messages.map(msg => (
            <View key={msg.id} style={msg.type === 'user' ? s.rowUser : s.rowBot}>
              {msg.type === 'user' ? (
                <View style={[s.bubbleUser, { backgroundColor: t.msgUser, borderColor: t.msgUserBorder }]}>
                  <Text style={[s.bubbleUserTxt, { color: t.text }]}>{msg.text}</Text>
                </View>
              ) : msg.customType ? (
                <View style={s.customWrap}>{renderCustom(msg)}</View>
              ) : (
                <Text style={[s.bubbleBot, { color: isDark ? '#a8a29e' : '#57534e' }]}>{msg.text}</Text>
              )}
            </View>
          ))}

          {/* Typing */}
          {isTyping && (
            <View style={[s.rowBot, s.typingRow]}>
              <TypingDot delay={0}   color={isDark ? '#44403c' : '#d6d3d1'} />
              <TypingDot delay={120} color={isDark ? '#44403c' : '#d6d3d1'} />
              <TypingDot delay={240} color={isDark ? '#44403c' : '#d6d3d1'} />
            </View>
          )}
        </ScrollView>

        {/* ── Input ── */}
        {showTextInput && (
          <View style={[s.inputWrap, { backgroundColor: t.bg }]}>
            <View style={[s.inputCard, { backgroundColor: t.inputBg, borderColor: t.inputBorder }]}>
              <TextInput
                ref={inputRef}
                style={[s.input, { color: t.text }]}
                placeholder={PLACEHOLDERS[subStep] ?? 'Escribe tu respuesta...'}
                placeholderTextColor={t.subtext}
                value={userInput}
                onChangeText={setUserInput}
                onSubmitEditing={handleSend}
                editable={true}
                keyboardType={subStep === 'phone' ? 'phone-pad' : subStep === 'postalCode' ? 'number-pad' : 'default'}
                autoCapitalize={subStep === 'curp' || subStep === 'rfc' ? 'characters' : 'words'}
                autoCorrect={false}
                returnKeyType="send"
                multiline={subStep === 'address'}
              />
              <View style={s.inputActions}>
                <TouchableOpacity
                  onPress={handleSend}
                  disabled={!userInput.trim() || !inputEnabled}
                  style={[s.sendBtn, (!userInput.trim() || !inputEnabled) && s.sendBtnDisabled]}
                  activeOpacity={0.8}
                >
                  <Svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <Line x1="12" y1="19" x2="12" y2="5" />
                    <Polyline points="5 12 12 5 19 12" />
                  </Svg>
                </TouchableOpacity>
              </View>
            </View>
            <Text style={[s.hint, { color: t.subtext }]}>GANDIA · Registro seguro</Text>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

// ─── StyleSheet: main ─────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:    { flex: 1 },

  // Header
  header:        { borderBottomWidth: 1 },
  progressTrack: { height: 2 },
  progressBar:   { height: 2, backgroundColor: '#2FAF8F' },
  headerRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 16, height: 50,
  },
  backBtn:    { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backTxt:    { fontSize: 12, fontFamily: 'Geist-Medium' },
  headerCenter: {
    position: 'absolute', left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  headerBrand:   { fontSize: 13, fontFamily: 'Geist-SemiBold', letterSpacing: 0.5 },
  headerDivider: { width: 1, height: 12 },
  headerSub:     { fontSize: 11, fontFamily: 'Geist-Medium' },
  headerRight:   { flexDirection: 'row', alignItems: 'center', gap: 5 },
  stepNum:       { fontSize: 10, fontFamily: 'Geist-SemiBold', letterSpacing: 1 },
  stepLabel:     { fontSize: 11, fontFamily: 'Geist-Medium' },

  // Messages
  messages: { padding: 20, gap: 20, paddingBottom: 24 },

  empty:      { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 40, gap: 10 },
  emptyTitle: { fontFamily: 'InstrumentSerif-Italic', fontSize: 34, lineHeight: 42, textAlign: 'center', letterSpacing: -0.5 },
  emptyHint:  { fontFamily: 'Geist-Regular', fontSize: 13, textAlign: 'center' },

  rowUser: { alignItems: 'flex-end' },
  rowBot:  { alignItems: 'flex-start' },

  bubbleUser: {
    maxWidth: '75%', borderRadius: 16, borderBottomRightRadius: 4,
    borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  bubbleUserTxt: { fontSize: 14, fontFamily: 'Geist-Regular', lineHeight: 22 },
  bubbleBot:     { maxWidth: '85%', fontSize: 14, fontFamily: 'Geist-Regular', lineHeight: 24 },

  customWrap:  { width: '100%' },

  typingRow: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 4 },
  dot:       { width: 6, height: 6, borderRadius: 3 },  // referenced by TypingDot

  // Input
  inputWrap: { padding: 12, paddingBottom: Platform.OS === 'ios' ? 28 : 24 },
  inputCard: {
    borderRadius: 16, borderWidth: 1, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 2,
  },
  input: {
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8,
    fontSize: 14, fontFamily: 'Geist-Regular', minHeight: 50,
  },
  inputActions: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end',
    paddingHorizontal: 10, paddingBottom: 10,
  },
  sendBtn:         { width: 32, height: 32, borderRadius: 10, backgroundColor: '#2FAF8F', alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { backgroundColor: 'rgba(47,175,143,0.25)' },
  hint:            { textAlign: 'center', fontSize: 10, fontFamily: 'Geist-Medium', letterSpacing: 0.5, marginTop: 8 },
})

// ─── StyleSheet: widgets ──────────────────────────────────────────────────────
const w = StyleSheet.create({
  // OptionsGrid
  optGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 6, width: '100%' },
  optBtn:  { flex: 1, minWidth: '45%', padding: 12, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  optTxt:  { fontSize: 13, fontFamily: 'Geist-Medium', textAlign: 'center' },

  // Search (State & Municipality)
  searchWrap:  { width: '100%', marginVertical: 6 },
  searchRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, height: 42, marginBottom: 8 },
  searchInput: { flex: 1, fontSize: 13, fontFamily: 'Geist-Regular', height: 40 },
  listBox:     { borderRadius: 10, borderWidth: 1, maxHeight: 220, overflow: 'hidden' },
  listItem:    { paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: 1 },
  listItemTxt: { fontSize: 13, fontFamily: 'Geist-Regular' },
  emptyList:   { paddingHorizontal: 16, paddingVertical: 20, alignItems: 'center' },
  emptyListTxt:{ fontSize: 13, fontFamily: 'Geist-Regular' },

  // CodeInput
  codeWrap:      { width: '100%', marginVertical: 6 },
  codeRow:       { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 12 },
  codeInput:     { width: 44, height: 52, borderRadius: 10, borderWidth: 1.5, fontSize: 24, fontFamily: 'Geist-SemiBold' },
  codeFooter:    { alignItems: 'center', marginTop: 4 },
  codeCountdown: { fontSize: 11, fontFamily: 'Geist-Regular' },
  codeResend:    { fontSize: 11, fontFamily: 'Geist-Medium', color: '#2FAF8F' },

  // RoleGrid
  roleGrid:  { width: '100%', gap: 10, marginVertical: 6 },
  roleBtn:   { flexDirection: 'row', alignItems: 'flex-start', gap: 14, padding: 14, borderRadius: 14, borderWidth: 1 },
  roleIcon:  { width: 40, height: 40, borderRadius: 10, backgroundColor: 'rgba(47,175,143,0.15)', alignItems: 'center', justifyContent: 'center' },
  roleTitle: { fontSize: 14, fontFamily: 'Geist-SemiBold', marginBottom: 3 },
  roleDesc:  { fontSize: 12, fontFamily: 'Geist-Regular', lineHeight: 17 },
})

// Re-export for TypingDot style reference
const p = { dot: s.dot }