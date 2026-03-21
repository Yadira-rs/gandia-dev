// app/(public)/signup/institutional.tsx
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  KeyboardAvoidingView, Platform, Animated,
  useColorScheme, StatusBar, Modal, FlatList,
  SafeAreaView,
} from 'react-native'
import { useRouter } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'
import Svg, { Path, Line, Polyline, Circle } from 'react-native-svg'

// ─── Types ────────────────────────────────────────────────────────────────────
type Role = 'producer' | 'mvz' | 'union' | 'exporter' | 'auditor'
type CustomType = 'options' | 'hint'

interface Message {
  type: 'assistant' | 'user'
  text?: string
  customType?: CustomType
  customData?: any
  id: number
}

interface Question {
  key: string
  question: string
  hint?: string
  type: 'text' | 'options'
  options?: string[]
  optional?: boolean
  validation?: (value: string) => { valid: boolean; error?: string }
  keyboardType?: 'default' | 'number-pad' | 'email-address'
  autoCapitalize?: 'none' | 'words' | 'sentences' | 'characters'
}

// ─── Tokens (idéntico al sistema de login/personal) ───────────────────────────
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
  hintBg:        isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
  hintBorder:    isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)',
  headerBg:      isDark ? 'rgba(12,10,9,0.97)' : 'rgba(250,250,249,0.97)',
  headerBorder:  isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)',
})

// ─── Logo ─────────────────────────────────────────────────────────────────────
function GandiaLogo({ size = 18 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2L2 7l10 5 10-5-10-5z" stroke="#2FAF8F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M2 17l10 5 10-5"            stroke="#2FAF8F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M2 12l10 5 10-5"            stroke="#2FAF8F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
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
function ConfirmModal({
  open, title, description, confirmLabel = 'Confirmar',
  onConfirm, onCancel, isDark,
}: {
  open: boolean; title: string; description: string; confirmLabel?: string
  onConfirm: () => void; onCancel: () => void; isDark: boolean
}) {
  const t     = tokens(isDark)
  const scale = useRef(new Animated.Value(0.94)).current
  const op    = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (open) {
      Animated.parallel([
        Animated.spring(scale, { toValue: 1,  friction: 7, tension: 100, useNativeDriver: true }),
        Animated.timing(op,   { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start()
    } else {
      scale.setValue(0.94)
      op.setValue(0)
    }
  }, [open])

  if (!open) return null

  return (
    <Modal visible={open} transparent animationType="none" statusBarTranslucent onRequestClose={onCancel}>
      <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' } as any} />
      <View
        style={{ ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 } as any}
        pointerEvents="box-none"
      >
        <Animated.View style={{ width: '100%', maxWidth: 360, borderRadius: 20, overflow: 'hidden', opacity: op, transform: [{ scale }] }}>
          <View style={{ height: 2, backgroundColor: '#2FAF8F', opacity: 0.6 }} />
          <View style={{
            backgroundColor: t.surface, borderWidth: 1, borderTopWidth: 0, borderColor: t.border,
            borderBottomLeftRadius: 20, borderBottomRightRadius: 20,
            paddingHorizontal: 22, paddingTop: 20, paddingBottom: 18,
          }}>
            <Text style={{ fontFamily: 'Geist-SemiBold', fontSize: 15, color: t.text, marginBottom: 6 }}>{title}</Text>
            <Text style={{ fontFamily: 'Geist-Regular', fontSize: 13, color: t.muted, lineHeight: 20, marginBottom: 18 }}>{description}</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                onPress={onCancel}
                style={{ flex: 1, height: 42, borderRadius: 12, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f5f5f4', alignItems: 'center', justifyContent: 'center' }}
              >
                <Text style={{ fontFamily: 'Geist-Medium', fontSize: 13, color: t.muted }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onConfirm}
                style={{ flex: 1, height: 42, borderRadius: 12, backgroundColor: '#2FAF8F', alignItems: 'center', justifyContent: 'center' }}
              >
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
// Componente estable — vive en FlatList con id fijo para evitar re-montajes
function OptionsGrid({ options, onSelect, isDark }: {
  options: string[]; onSelect: (val: string) => void; isDark: boolean
}) {
  const t = tokens(isDark)
  const [selected, setSelected] = useState<string | null>(null)
  const [disabled, setDisabled] = useState(false)

  const handle = (opt: string) => {
    if (disabled) return
    setSelected(opt)
    setDisabled(true)
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

// ─── HintBox ──────────────────────────────────────────────────────────────────
function HintBox({ text, isDark }: { text: string; isDark: boolean }) {
  const t = tokens(isDark)
  return (
    <View style={[w.hintWrap, { backgroundColor: t.hintBg, borderColor: t.hintBorder }]}>
      <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" style={{ marginTop: 1, flexShrink: 0 }}>
        <Circle cx="12" cy="12" r="10" stroke={t.muted} strokeWidth="1.75" />
        <Path d="M12 8h.01M12 12v4" stroke={t.muted} strokeWidth="1.75" strokeLinecap="round" />
      </Svg>
      <Text style={[w.hintTxt, { color: t.muted }]}>{text}</Text>
    </View>
  )
}

// ─── Validators ───────────────────────────────────────────────────────────────
const validators = {
  uppNumber: (value: string) => {
    if (value.toLowerCase() === 'pendiente') return { valid: true }
    if (!/^\d{2}-\d{3}-\d{6}-\d{1}$/.test(value))
      return { valid: false, error: 'Formato inválido. Debe ser XX-XXX-XXXXXX-X o escribe "pendiente"' }
    return { valid: true }
  },
  cedulaProfesional: (value: string) => {
    if (!/^\d{7,8}$/.test(value))
      return { valid: false, error: 'La cédula profesional debe tener 7 u 8 dígitos' }
    return { valid: true }
  },
  year: (value: string) => {
    const year = parseInt(value)
    const currentYear = new Date().getFullYear()
    if (isNaN(year) || year < 1900 || year > currentYear)
      return { valid: false, error: `Año inválido. Debe estar entre 1900 y ${currentYear}` }
    return { valid: true }
  },
  rfc: (value: string) => {
    if (value.toLowerCase() === 'omitir') return { valid: true }
    if (!/^[A-ZÑ&]{3,4}\d{6}[A-Z\d]{3}$/i.test(value))
      return { valid: false, error: 'RFC inválido. Formato: XXX-XXXXXX-XXX o escribe "omitir"' }
    return { valid: true }
  },
  email: (value: string) => {
    if (value.toLowerCase() === 'omitir' || value.toLowerCase() === 'ninguno') return { valid: true }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
      return { valid: false, error: 'Email inválido' }
    return { valid: true }
  },
  notEmpty: (value: string) => {
    if (value.trim().length < 3)
      return { valid: false, error: 'Respuesta muy corta. Mínimo 3 caracteres' }
    return { valid: true }
  },
  address: (value: string) => {
    if (value.trim().length < 10)
      return { valid: false, error: 'Dirección muy corta. Proporciona más detalles (mínimo 10 caracteres)' }
    return { valid: true }
  },
}

// ─── Question Flows ───────────────────────────────────────────────────────────
const questionFlows: Record<Role, Question[]> = {
  producer: [
    { key: 'ranchName',            question: '¿Cuál es el nombre de tu rancho o UPP?',                                    hint: 'Ej: Rancho El Mezquite, La Esperanza, etc.',                                               type: 'text',    validation: validators.notEmpty },
    { key: 'uppNumber',            question: '¿Cuál es tu número de UPP registrado ante SAGARPA/SADER?',                  hint: 'Formato: XX-XXX-XXXXXX-X (escribe "pendiente" si aún no lo tienes)',                       type: 'text',    validation: validators.uppNumber, autoCapitalize: 'none' },
    { key: 'siniigaNumber',        question: '¿Cuál es tu número de registro SINIIGA?',                                   hint: 'Sistema Nacional de Identificación Individual de Ganado (escribe "pendiente" si no aplica)', type: 'text',    optional: true },
    { key: 'operationType',        question: '¿Qué tipo de operación realizas?',                                          type: 'options', options: ['Cría (cow-calf)', 'Engorda (feedlot)', 'Mixto', 'Lechero', 'Doble propósito', 'Otro'] },
    { key: 'cattleType',           question: '¿Qué tipo de ganado mantienes?',                                            type: 'options', options: ['Bovino', 'Ovino', 'Caprino', 'Porcino', 'Mixto', 'Otro'] },
    { key: 'herdSize',             question: '¿Cuál es el tamaño aproximado de tu hato?',                                 type: 'options', options: ['Menos de 20', '20–100', '100–500', '500–1,000', 'Más de 1,000'] },
    { key: 'yearsOfOperation',     question: '¿Cuántos años tiene operando el rancho?',                                   type: 'options', options: ['Menos de 1 año', '1–5 años', '5–15 años', 'Más de 15 años'] },
    { key: 'ranchAddress',         question: '¿Cuál es la ubicación del rancho?',                                         hint: 'Ej: Carretera Durango-Mazatlán km 45, municipio de Canelas',                               type: 'text',    validation: validators.address },
    { key: 'location',             question: '¿En qué estado se encuentra tu rancho?',                                    hint: 'Estado de la república',                                                                    type: 'text',    validation: validators.notEmpty },
    { key: 'sanitaryCertifications', question: '¿Cuentas con certificación sanitaria activa?',                            hint: 'Ej: PROGAN, Programa de Sanidad, etc. (escribe "ninguna" si no tienes)',                  type: 'text',    optional: true },
    { key: 'officialRegistry',     question: '¿Tienes registro oficial con alguna Unión Ganadera?',                       type: 'options', options: ['Sí, estoy afiliado', 'No, soy independiente', 'En proceso de afiliación'] },
  ],
  mvz: [
    { key: 'license',          question: '¿Cuál es tu número de cédula profesional?',              hint: '7 u 8 dígitos emitidos por la SEP',                                             type: 'text',    validation: validators.cedulaProfesional, keyboardType: 'number-pad' },
    { key: 'university',       question: '¿De qué universidad egresaste?',                         hint: 'Ej: UJED, UNAM, UAZ, IPN, etc.',                                                type: 'text',    validation: validators.notEmpty },
    { key: 'graduationYear',   question: '¿En qué año obtuviste tu título?',                       hint: 'Ej: 2015',                                                                      type: 'text',    validation: validators.year, keyboardType: 'number-pad' },
    { key: 'specialty',        question: '¿Cuál es tu especialidad principal?',                    type: 'options', options: ['Bovinos', 'Ovinos/Caprinos', 'Porcinos', 'Salud pública veterinaria', 'Producción animal', 'General'] },
    { key: 'practiceMode',     question: '¿Cuál es tu modalidad de ejercicio profesional?',        type: 'options', options: ['Práctica privada independiente', 'Empleado en institución pública', 'Empleado en empresa privada', 'Ambas (pública y privada)'] },
    { key: 'stateOfPractice',  question: '¿En qué estado ejerces principalmente?',                 hint: 'Estado de la república',                                                        type: 'text',    validation: validators.notEmpty },
    { key: 'sanitaryRegistry', question: '¿Tienes número de registro sanitario SENASICA?',         hint: 'Para emisión de dictámenes (escribe "no tengo" si aún no lo has tramitado)',   type: 'text',    optional: true },
    { key: 'college',          question: '¿Perteneces a algún Colegio de Médicos Veterinarios?',   hint: 'Nombre del colegio o "ninguno"',                                                type: 'text',    optional: true },
  ],
  union: [
    { key: 'unionName',           question: '¿Cuál es el nombre oficial de tu Unión Ganadera?',        hint: 'Nombre completo como aparece en el acta constitutiva',            type: 'text',    validation: (v) => v.length < 5 ? { valid: false, error: 'Nombre muy corto' } : { valid: true } },
    { key: 'officialRegistry',    question: '¿Número de registro oficial ante SADER/SEDAGRO?',         hint: 'Escribe el número o "en trámite" si está pendiente',               type: 'text',    validation: validators.notEmpty },
    { key: 'rfc',                 question: '¿Cuál es el RFC de la Unión Ganadera?',                   hint: 'Formato: XXX-XXXXXX-XXX (escribe "omitir" si no disponible)',      type: 'text',    optional: true, validation: validators.rfc, autoCapitalize: 'characters' },
    { key: 'region',              question: '¿Qué estado o región representas?',                       hint: 'Estado o zona de cobertura',                                        type: 'text',    validation: validators.notEmpty },
    { key: 'affiliates',          question: '¿Cuántos productores están afiliados aproximadamente?',   type: 'options', options: ['Menos de 50', '50–200', '200–500', '500–1,000', 'Más de 1,000'] },
    { key: 'foundationYear',      question: '¿En qué año fue fundada la Unión?',                       hint: 'Ej: 1972',                                                          type: 'text',    validation: validators.year, keyboardType: 'number-pad' },
    { key: 'physicalAddress',     question: '¿Dirección de la sede u oficina principal?',              hint: 'Calle, colonia, municipio, estado',                                 type: 'text',    validation: validators.address },
    { key: 'legalStatus',         question: '¿Estatus legal actual de la Unión?',                      type: 'options', options: ['Activa y en regla', 'En proceso de renovación', 'En proceso de constitución'] },
    { key: 'institutionalContact', question: '¿Correo institucional de la Unión?',                     hint: 'Correo oficial de la organización (opcional)',                      type: 'text',    optional: true, validation: validators.email, keyboardType: 'email-address', autoCapitalize: 'none' },
  ],
  exporter: [
    { key: 'companyName',              question: '¿Nombre oficial de tu empresa exportadora?',              type: 'text',    validation: validators.notEmpty },
    { key: 'taxId',                    question: '¿RFC o Tax ID de la empresa?',                            hint: 'Para empresas con operaciones en México/EE.UU.',          type: 'text',    validation: validators.notEmpty, autoCapitalize: 'characters' },
    { key: 'fiscalAddress',            question: '¿Dirección fiscal de la empresa?',                        hint: 'Calle, número, colonia, municipio, estado, CP',           type: 'text',    validation: validators.address },
    { key: 'sanitaryExporterRegistry', question: '¿Número de registro sanitario de exportador SENASICA?',   hint: 'Escribe "en trámite" si está pendiente',                  type: 'text',    validation: validators.notEmpty },
    { key: 'exportType',               question: '¿Tipo principal de exportación?',                          type: 'options', options: ['Ganado en pie', 'Carne en canal', 'Carne procesada/empacada', 'Embriones y material genético', 'Mixto'] },
    { key: 'destination',              question: '¿Principal destino de exportación?',                       type: 'options', options: ['Estados Unidos', 'Canadá', 'México (zona franca)', 'Otro país'] },
    { key: 'annualVolume',             question: '¿Volumen aproximado anual de exportación?',                type: 'options', options: ['Menos de 500 cabezas/ton', '500–2,000', '2,000–10,000', 'Más de 10,000'] },
    { key: 'borderCrossings',          question: '¿Puertos fronterizos o puntos de cruce que utilizas?',    hint: 'Ej: Ciudad Juárez, Nogales, Piedras Negras, etc.',        type: 'text',    validation: validators.notEmpty },
  ],
  auditor: [
    { key: 'entity',               question: '¿Para qué entidad trabajas o estás acreditado?',        type: 'options', options: ['SENASICA', 'Unión Ganadera', 'Entidad certificadora privada', 'Gobierno estatal', 'Otro'] },
    { key: 'auditType',            question: '¿Tipo de auditorías o inspecciones que realizas?',       type: 'options', options: ['Sanidad animal', 'Movilización y trazabilidad', 'Bienestar animal', 'Exportación/importación', 'Inocuidad alimentaria', 'General'] },
    { key: 'licenseNumber',        question: '¿Número de licencia, cédula o acreditación oficial?',   type: 'text',    validation: validators.notEmpty },
    { key: 'certifyingInstitution', question: '¿Institución que emitió tu certificación?',            hint: 'Ej: SENASICA, colegio profesional, entidad privada',           type: 'text',    validation: validators.notEmpty },
    { key: 'rankOrLevel',          question: '¿Tu nivel o rango dentro de la entidad?',               type: 'options', options: ['Inspector de campo', 'Auditor certificado', 'Auditor líder', 'Supervisor regional', 'Coordinador nacional'] },
    { key: 'operationRegion',      question: '¿Región o estados donde operas principalmente?',        hint: 'Ej: Durango, Chihuahua, Sonora / Región Norte',                type: 'text',    validation: validators.notEmpty },
  ],
}

const roleLabels: Record<Role, string> = {
  producer: 'Productor',
  mvz: 'MVZ',
  union: 'Unión Ganadera',
  exporter: 'Exportador',
  auditor: 'Auditor',
}

const roleDisplayNames: Record<Role, string> = {
  producer: 'productor ganadero',
  mvz: 'médico veterinario zootecnista',
  union: 'representante de Unión Ganadera',
  exporter: 'exportador',
  auditor: 'auditor/inspector',
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function SignUpInstitutional() {
  const router      = useRouter()
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'
  const t      = useMemo(() => tokens(isDark), [isDark])

  const [messages,   setMessages]   = useState<Message[]>([])
  const [userInput,  setUserInput]  = useState('')
  const [isTyping,   setIsTyping]   = useState(false)
  const [inputEnabled, setInputEnabled] = useState(false)
  const [showTextInput, setShowTextInput] = useState(false)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [userRole,   setUserRole]   = useState<Role | null>(null)
  const [firstName,  setFirstName]  = useState('')
  const [progressPct, setProgressPct] = useState(0)

  // Refs para callbacks estables en closures
  const institutionalDataRef  = useRef<Record<string, string>>({})
  const questionIndexRef      = useRef(0)
  const userRoleRef           = useRef<Role | null>(null)
  const initialized           = useRef(false)
  const msgIdRef              = useRef(0)
  const listRef               = useRef<FlatList>(null)
  const inputRef              = useRef<TextInput>(null)
  // Callbacks de opciones keyed por msgId — nunca en estado, nunca causan re-renders
  const optionCallbacksRef    = useRef<Map<number, (val: string) => void>>(new Map())

  // Modal
  const [modal, setModal] = useState<{
    open: boolean; title: string; description: string; confirmLabel: string; onConfirm: () => void
  }>({ open: false, title: '', description: '', confirmLabel: 'Confirmar', onConfirm: () => {} })

  const showConfirm = (title: string, description: string, confirmLabel: string, onConfirm: () => void) =>
    setModal({ open: true, title, description, confirmLabel, onConfirm })
  const closeModal = () => setModal(m => ({ ...m, open: false }))

  // ── Helpers ────────────────────────────────────────────────────────────────
  const nextId = () => { msgIdRef.current += 1; return msgIdRef.current }

  // Agrega un mensaje y devuelve su id (útil para registrar callbacks de opciones)
  const addMsg = useCallback((msg: Omit<Message, 'id'>): number => {
    const id = nextId()
    setMessages(prev => [...prev, { ...msg, id }])
    return id
  }, [])

  const typing  = useCallback((on: boolean) => setIsTyping(on), [])
  const after   = (ms: number, fn: () => void) => setTimeout(fn, ms)

  const updateProgress = (index: number, total: number) => {
    if (total === 0) return
    setProgressPct(Math.round((Math.min(index, total) / total) * 100))
    setQuestionIndex(index)
  }

  useEffect(() => {
    if (isTyping || messages.length > 0) {
      after(100, () => listRef.current?.scrollToEnd({ animated: true }))
    }
  }, [messages, isTyping])

  useEffect(() => {
    if (showTextInput && inputEnabled) {
      after(200, () => inputRef.current?.focus())
    }
  }, [showTextInput, inputEnabled])

  // ── Init: leer AsyncStorage y arrancar el flow ─────────────────────────────
  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    const init = async () => {
      try {
        const raw = await AsyncStorage.getItem('signup-personal-data')
        if (!raw) { router.replace('/(public)/signup/personal' as any); return }

        const personalData = JSON.parse(raw)
        const role = personalData.role as Role
        if (!role || !questionFlows[role]) throw new Error('Rol inválido')

        userRoleRef.current = role
        setUserRole(role)

        const first = personalData.fullName?.split(' ')[0] || ''
        setFirstName(first)

        after(500, () => {
          addMsg({ type: 'assistant', text: `Perfecto, ${first}. Ahora que sé que eres ${roleDisplayNames[role]}, necesito algunos datos específicos de tu actividad.` })
          typing(true)
          after(1200, () => {
            typing(false)
            askQuestion(0, role, {})
          })
        })
      } catch {
        router.replace('/(public)/signup/personal' as any)
      }
    }

    init()
  }, [])

  // ── Ask question ──────────────────────────────────────────────────────────
  const askQuestion = useCallback((
    index: number,
    role: Role,
    currentData: Record<string, string>,
  ) => {
    const questions = questionFlows[role]
    if (index >= questions.length) { finishFlow(currentData, role); return }

    questionIndexRef.current = index
    updateProgress(index, questions.length)

    const q = questions[index]
    typing(true)

    after(800, () => {
      typing(false)
      addMsg({ type: 'assistant', text: q.question })

      if (q.hint) {
        addMsg({ type: 'assistant', customType: 'hint', customData: { text: q.hint } })
      }

      if (q.type === 'options' && q.options) {
        const cb = (val: string) => handleOptionSelect(val, index, role, currentData)
        const id = addMsg({
          type: 'assistant',
          customType: 'options',
          customData: { options: q.options },
        })
        optionCallbacksRef.current.set(id, cb)
        setShowTextInput(false)
      } else {
        setShowTextInput(true)
        setInputEnabled(true)
      }
    })
  }, [])

  // ── Option select ─────────────────────────────────────────────────────────
  const handleOptionSelect = useCallback((
    value: string,
    index: number,
    role: Role,
    currentData: Record<string, string>,
  ) => {
    const q = questionFlows[role][index]
    addMsg({ type: 'user', text: value })

    const updatedData = { ...currentData, [q.key]: value }
    institutionalDataRef.current = updatedData

    typing(true)
    after(600, () => {
      typing(false)
      const nextIndex = index + 1
      if (nextIndex < questionFlows[role].length) {
        askQuestion(nextIndex, role, updatedData)
      } else {
        finishFlow(updatedData, role)
      }
    })
  }, [])

  // ── Text send ─────────────────────────────────────────────────────────────
  const handleSend = useCallback(() => {
    const value = userInput.trim()
    const role  = userRoleRef.current
    if (!value || !role || !inputEnabled) return

    const index     = questionIndexRef.current
    const questions = questionFlows[role]
    const q         = questions[index]

    // Validación
    if (q.validation && !q.optional) {
      const result = q.validation(value)
      if (!result.valid) {
        // No imprimimos la burbuja del usuario para no generar visual de "pregunta repetida".
        // Solo limpiamos el input y mostramos el error como mensaje del asistente.
        setUserInput('')
        typing(true)
        after(500, () => {
          typing(false)
          addMsg({ type: 'assistant', text: result.error || 'Respuesta inválida. Intenta de nuevo.' })
          setInputEnabled(true)
        })
        return
      }
    }

    const sanitized = value.slice(0, 500)
    addMsg({ type: 'user', text: sanitized })
    setUserInput('')
    setInputEnabled(false)

    const updatedData = { ...institutionalDataRef.current, [q.key]: sanitized }
    institutionalDataRef.current = updatedData

    typing(true)
    after(600, () => {
      typing(false)
      const nextIndex = index + 1
      if (nextIndex < questions.length) {
        askQuestion(nextIndex, role, updatedData)
      } else {
        finishFlow(updatedData, role)
      }
    })
  }, [userInput, inputEnabled])

  // ── Finish flow ───────────────────────────────────────────────────────────
  const finishFlow = useCallback(async (finalData: Record<string, string>, role: Role) => {
    setShowTextInput(false)
    updateProgress(questionFlows[role].length, questionFlows[role].length)

    addMsg({ type: 'assistant', text: 'Perfecto. He registrado toda tu información institucional.' })

    after(500, () => {
      typing(true)
      after(800, () => {
        typing(false)
        addMsg({ type: 'assistant', text: 'En el siguiente paso revisaremos y confirmaremos todos tus datos antes de crear tu cuenta definitiva.' })
        AsyncStorage.setItem('signup-institutional-data', JSON.stringify(finalData)).catch(() => {})
        after(2000, () => router.replace('/(public)/signup/confirmation' as any))
      })
    })
  }, [])

  // ── Back ──────────────────────────────────────────────────────────────────
  const handleBack = () => {
    showConfirm(
      '¿Regresar al paso anterior?',
      'Se perderá el progreso de tu información institucional.',
      'Sí, regresar',
      async () => {
        closeModal()
        await AsyncStorage.removeItem('signup-institutional-data')
        router.replace('/(public)/signup/personal' as any)
      }
    )
  }

  // ── Render message ────────────────────────────────────────────────────────
  const renderMessage = useCallback(({ item: msg }: { item: Message }) => {
    if (msg.type === 'user') {
      return (
        <View style={s.rowUser}>
          <View style={[s.bubbleUser, { backgroundColor: t.msgUser, borderColor: t.msgUserBorder }]}>
            <Text style={[s.bubbleUserTxt, { color: t.text }]}>{msg.text}</Text>
          </View>
        </View>
      )
    }

    if (msg.customType === 'options') {
      const onSelect = optionCallbacksRef.current.get(msg.id) ?? (() => {})
      return (
        <View style={s.rowBot}>
          <View style={s.customWrap}>
            <OptionsGrid
              options={msg.customData.options}
              onSelect={onSelect}
              isDark={isDark}
            />
          </View>
        </View>
      )
    }

    if (msg.customType === 'hint') {
      return (
        <View style={s.rowBot}>
          <View style={s.customWrap}>
            <HintBox text={msg.customData.text} isDark={isDark} />
          </View>
        </View>
      )
    }

    // Mensaje de texto normal del asistente
    return (
      <View style={s.rowBot}>
        <Text style={[s.bubbleBot, { color: isDark ? '#a8a29e' : '#57534e' }]}>{msg.text}</Text>
      </View>
    )
  }, [isDark, t])

  const questionCount = userRole ? questionFlows[userRole].length : 0

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={[s.root, { backgroundColor: t.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={t.bg} />

      <ConfirmModal
        open={modal.open}
        title={modal.title}
        description={modal.description}
        confirmLabel={modal.confirmLabel}
        onConfirm={modal.onConfirm}
        onCancel={closeModal}
        isDark={isDark}
      />

      {/* ── Header ── */}
      <View style={[s.header, { backgroundColor: t.headerBg, borderBottomColor: t.headerBorder }]}>
        {/* Barra de progreso */}
        <View style={[s.progressTrack, { backgroundColor: isDark ? '#1c1917' : '#e7e5e4' }]}>
          <View style={[s.progressBar, { width: `${progressPct}%` as any }]} />
        </View>

        <View style={s.headerRow}>
          {/* Back */}
          <TouchableOpacity onPress={handleBack} activeOpacity={0.7} style={s.backBtn}>
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
              <Path d="M15 19l-7-7 7-7" stroke={t.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
            <Text style={[s.backTxt, { color: t.muted }]}>Volver</Text>
          </TouchableOpacity>

          {/* Centro: Logo + GANDIA + Datos Institucionales */}
          <View style={s.headerCenter} pointerEvents="none">
            <GandiaLogo size={16} />
            <Text style={[s.headerBrand, { color: t.text }]}>GANDIA</Text>
            <View style={[s.headerDivider, { backgroundColor: isDark ? '#292524' : '#e7e5e4' }]} />
            <Text style={[s.headerSub, { color: t.muted }]}>Datos Institucionales</Text>
          </View>

          {/* Derecha: step counter + rol */}
          <View style={s.headerRight}>
            {questionCount > 0 && (
              <>
                <Text style={[s.stepNum, { color: t.muted }]}>
                  {String(Math.min(questionIndex + 1, questionCount)).padStart(2, '0')} / {String(questionCount).padStart(2, '0')}
                </Text>
                <View style={[s.headerDivider, { backgroundColor: isDark ? '#292524' : '#e7e5e4' }]} />
              </>
            )}
            <Text style={[s.stepLabel, { color: isDark ? '#57534e' : '#a8a29e' }]}>
              {userRole ? roleLabels[userRole] : ''}
            </Text>
          </View>
        </View>
      </View>

      {/* ── Mensajes + Input ── */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 52 : 0}
      >
        <FlatList
          ref={listRef}
          style={{ flex: 1 }}
          data={messages}
          keyExtractor={item => String(item.id)}
          renderItem={renderMessage}
          contentContainerStyle={s.messages}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={[s.emptyTitle, { color: t.text }]}>
                {'Tu actividad\nnos importa.'}
              </Text>
              <Text style={[s.emptyHint, { color: t.muted }]}>Paso 3 de 4 — Datos institucionales</Text>
            </View>
          }
          ListFooterComponent={
            isTyping ? (
              <View style={[s.rowBot, s.typingRow]}>
                <TypingDot delay={0}   color={isDark ? '#44403c' : '#d6d3d1'} />
                <TypingDot delay={120} color={isDark ? '#44403c' : '#d6d3d1'} />
                <TypingDot delay={240} color={isDark ? '#44403c' : '#d6d3d1'} />
              </View>
            ) : null
          }
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />

        {/* ── Input de texto ── */}
        {showTextInput && (
          <View style={[s.inputWrap, { backgroundColor: t.bg }]}>
            <View style={[s.inputCard, { backgroundColor: t.inputBg, borderColor: t.inputBorder }]}>
              <TextInput
                ref={inputRef}
                style={[s.input, { color: t.text }]}
                placeholder="Escribe tu respuesta..."
                placeholderTextColor={t.subtext}
                value={userInput}
                onChangeText={setUserInput}
                onSubmitEditing={handleSend}
                editable
                keyboardType={
                  userRole && questionFlows[userRole][questionIndex]?.keyboardType
                    ? questionFlows[userRole][questionIndex].keyboardType
                    : 'default'
                }
                autoCapitalize={
                  userRole && questionFlows[userRole][questionIndex]?.autoCapitalize
                    ? questionFlows[userRole][questionIndex].autoCapitalize
                    : 'sentences'
                }
                autoCorrect={false}
                returnKeyType="send"
                multiline={
                  userRole
                    ? ['ranchAddress', 'physicalAddress', 'fiscalAddress', 'address'].includes(
                        questionFlows[userRole][questionIndex]?.key ?? ''
                      )
                    : false
                }
              />
              <View style={s.inputActions}>
                <TouchableOpacity
                  onPress={handleSend}
                  disabled={!userInput.trim() || !inputEnabled}
                  activeOpacity={0.8}
                  style={[s.sendBtn, (!userInput.trim() || !inputEnabled) && s.sendBtnDisabled]}
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

// ─── StyleSheet ───────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1 },

  // Header
  header:        { borderBottomWidth: 1 },
  progressTrack: { height: 2 },
  progressBar:   { height: 2, backgroundColor: '#2FAF8F' },
  headerRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 16, height: 50,
  },
  backBtn:      { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backTxt:      { fontSize: 12, fontFamily: 'Geist-Medium' },
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

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 40, gap: 10, minHeight: 380 },
  emptyTitle: {
    fontFamily: 'InstrumentSerif-Italic', fontSize: 34,
    lineHeight: 42, textAlign: 'center', letterSpacing: -0.5,
  },
  emptyHint: { fontFamily: 'Geist-Regular', fontSize: 13, textAlign: 'center' },

  rowUser:    { alignItems: 'flex-end' },
  rowBot:     { alignItems: 'flex-start' },
  customWrap: { width: '100%' },

  bubbleUser: {
    maxWidth: '75%', borderRadius: 16, borderBottomRightRadius: 4,
    borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  bubbleUserTxt: { fontSize: 14, fontFamily: 'Geist-Regular', lineHeight: 22 },
  bubbleBot:     { maxWidth: '85%', fontSize: 14, fontFamily: 'Geist-Regular', lineHeight: 24 },

  typingRow: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 4 },
  dot:       { width: 6, height: 6, borderRadius: 3 },

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

// Ref para TypingDot
const p = { dot: s.dot }

// ─── Widget styles ─────────────────────────────────────────────────────────────
const w = StyleSheet.create({
  // OptionsGrid — columna completa (mejor legibilidad que 2 columnas para textos largos)
  optGrid: { gap: 8, marginVertical: 6, width: '100%' },
  optBtn: {
    width: '100%', padding: 13, borderRadius: 12, borderWidth: 1,
    alignItems: 'flex-start', justifyContent: 'center',
  },
  optTxt: { fontSize: 13, fontFamily: 'Geist-Medium' },

  // HintBox
  hintWrap: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 7,
    borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9,
    marginTop: -8, marginBottom: 2,
  },
  hintTxt: { flex: 1, fontSize: 12, fontFamily: 'Geist-Regular', lineHeight: 18, fontStyle: 'italic' },
})