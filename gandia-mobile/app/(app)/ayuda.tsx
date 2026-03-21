// app/(app)/ayuda.tsx — Gandia 7 · Centro de ayuda · React Native
import { useState, useRef, useEffect } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Animated, useColorScheme, Linking,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Circle, Line, Polyline, Path, Rect } from 'react-native-svg'

// ─── Types ────────────────────────────────────────────────────────────────────
type Category = 'all' | 'general' | 'pasaportes' | 'certificacion' | 'tramites' | 'tecnicos'

interface FAQItem {
  id:       string
  question: string
  answer:   string
  category: Exclude<Category, 'all'>
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const FAQS: FAQItem[] = [
  { id: '1',  category: 'general',       question: '¿Qué es Gandia 7?',                        answer: 'Gandia 7 es una infraestructura digital institucional de consulta, evidencia y trazabilidad del ecosistema ganadero. Permite gestionar pasaportes digitales, gemelos digitales, certificaciones y monitoreo de ganado con la IA como interfaz principal.' },
  { id: '2',  category: 'general',       question: '¿Cómo puedo cambiar mi contraseña?',       answer: 'Ve a Configuraciones › Seguridad › Cambiar contraseña. Necesitarás tu contraseña actual y la nueva que desees establecer.' },
  { id: '3',  category: 'general',       question: '¿Cómo contacto con soporte técnico?',      answer: 'Puedes escribirnos a soporte@gandia7.com o llamar al +52 (618) 123-4567. Nuestro horario de atención es lunes a viernes, 9:00 AM – 6:00 PM.' },
  { id: '4',  category: 'pasaportes',   question: '¿Cómo creo un nuevo pasaporte?',            answer: 'Dirígete a Pasaportes y toca "Nuevo Pasaporte". Completa los datos del animal: identificadores, biometría, fotografías certificadas y origen. El sistema generará el código QR y RFID automáticamente.' },
  { id: '5',  category: 'pasaportes',   question: '¿Puedo editar un pasaporte ya creado?',     answer: 'Sí, desde el detalle del pasaporte puedes editar campos no certificados. Los identificadores oficiales (arete, RFID) no son modificables una vez certificados por ser parte del acto legal.' },
  { id: '6',  category: 'pasaportes',   question: '¿Qué información requiere un pasaporte?',   answer: 'Número de identificación, raza, sexo, fecha de nacimiento, peso, huella de morro, fotografías certificadas y origen de propiedad. El historial sanitario oficial se adjunta automáticamente desde REEMO.' },
  { id: '7',  category: 'certificacion',question: '¿Qué es la certificación?',                 answer: 'Es el proceso de validación que confirma la autenticidad del pasaporte. La IA guía el proceso y detecta inconsistencias, pero la certificación final siempre es una decisión humana.' },
  { id: '8',  category: 'certificacion',question: '¿Cuánto tarda el proceso de certificación?',answer: 'Entre 24 y 48 horas hábiles. Recibirás una notificación en la plataforma y por correo cuando el proceso esté completo.' },
  { id: '9',  category: 'tramites',     question: '¿Cómo inicio un trámite?',                  answer: 'En la sección Trámites selecciona el tipo que necesitas, completa el formulario y adjunta los documentos requeridos. La IA te guiará en cada paso.' },
  { id: '10', category: 'tramites',     question: '¿Puedo consultar el estado de mis trámites?',answer: 'Sí, en Trámites puedes ver el estado de todos tus trámites: activos, completados o rechazados, con el historial completo de actualizaciones.' },
  { id: '11', category: 'tecnicos',     question: 'No puedo subir fotografías, ¿qué hago?',    answer: 'Verifica que las imágenes sean JPG o PNG y no excedan 5 MB. Si el problema persiste, limpia la caché de la app o prueba desde otro dispositivo.' },
  { id: '12', category: 'tecnicos',     question: '¿La plataforma funciona sin conexión?',      answer: 'Gandia opera con capacidad offline para consulta de expedientes y captura de evidencias con GPS y marca de tiempo. La sincronización se realiza en cuanto se restablece la señal.' },
]

const CATEGORIES: { id: Category; label: string }[] = [
  { id: 'all',           label: 'Todas'         },
  { id: 'general',       label: 'General'       },
  { id: 'pasaportes',    label: 'Pasaportes'    },
  { id: 'certificacion', label: 'Certificación' },
  { id: 'tramites',      label: 'Trámites'      },
  { id: 'tecnicos',      label: 'Técnicos'      },
]

const CAT_LABELS: Record<string, string> = {
  general: 'General', pasaportes: 'Pasaportes',
  certificacion: 'Certificación', tramites: 'Trámites', tecnicos: 'Técnicos',
}

// ─── Tokens ───────────────────────────────────────────────────────────────────
const BRAND = '#2FAF8F'

const tk = (d: boolean) => ({
  bg:       d ? '#0c0a09' : '#fafaf9',
  surface:  d ? '#141210' : '#ffffff',
  border:   d ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.09)',
  divider:  d ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.07)',
  text:     d ? '#fafaf9' : '#1c1917',
  text2:    d ? '#d6d3d1' : '#44403c',
  muted:    d ? '#78716c' : '#a8a29e',
  muted2:   d ? '#57534e' : '#c4bfba',
  muted3:   d ? '#44403c' : '#d6d3d1',
  inputBg:  d ? '#141210' : '#ffffff',
})

// ─── Icons ────────────────────────────────────────────────────────────────────
const si = { fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

function IcoBack({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" {...si} stroke={color} strokeWidth="2">
      <Line x1="19" y1="12" x2="5" y2="12" /><Polyline points="12 19 5 12 12 5" />
    </Svg>
  )
}
function IcoSearch({ color, size = 17 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" {...si} stroke={color} strokeWidth="1.75">
      <Circle cx="11" cy="11" r="7.5" /><Line x1="20.5" y1="20.5" x2="16.1" y2="16.1" />
    </Svg>
  )
}
function IcoX({ color }: { color: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" {...si} stroke={color} strokeWidth="2">
      <Line x1="18" y1="6" x2="6" y2="18" /><Line x1="6" y1="6" x2="18" y2="18" />
    </Svg>
  )
}
function IcoChevron({ color }: { color: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" {...si} stroke={color} strokeWidth="2">
      <Polyline points="6 9 12 15 18 9" />
    </Svg>
  )
}
function IcoMail({ color }: { color: string }) {
  return (
    <Svg width={15} height={15} viewBox="0 0 24 24" {...si} stroke={color} strokeWidth="1.75">
      <Rect x="2" y="4" width="20" height="16" rx="2" />
      <Path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </Svg>
  )
}
function IcoPhone({ color }: { color: string }) {
  return (
    <Svg width={15} height={15} viewBox="0 0 24 24" {...si} stroke={color} strokeWidth="1.75">
      <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </Svg>
  )
}
function IcoSpark({ color }: { color: string }) {
  return (
    <Svg width={13} height={13} viewBox="0 0 24 24" {...si} stroke={color} strokeWidth="1.75">
      <Path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </Svg>
  )
}

// ─── FAQ Row ──────────────────────────────────────────────────────────────────
function FAQRow({ faq, isExpanded, onToggle, isLast, isDark }: {
  faq:        FAQItem
  isExpanded: boolean
  onToggle:   () => void
  isLast:     boolean
  isDark:     boolean
}) {
  const t        = tk(isDark)
  const chevronR = useRef(new Animated.Value(0)).current
  const bodyH    = useRef(new Animated.Value(0)).current
  const bodyOp   = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(chevronR, {
        toValue: isExpanded ? 1 : 0,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(bodyOp, {
        toValue: isExpanded ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start()
  }, [isExpanded])

  const chevronRotate = chevronR.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  })

  const scale = useRef(new Animated.Value(1)).current
  const press   = () => Animated.spring(scale, { toValue: 0.99, useNativeDriver: true, friction: 8 }).start()
  const release = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: true, friction: 8 }).start()

  return (
    <View style={[fr.wrap, !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.divider }]}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <TouchableOpacity
          style={fr.row}
          onPress={onToggle}
          onPressIn={press}
          onPressOut={release}
          activeOpacity={1}
        >
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[fr.cat, { color: BRAND }]}>{CAT_LABELS[faq.category].toUpperCase()}</Text>
            <Text style={[fr.question, { color: t.text2 }]}>{faq.question}</Text>
          </View>
          <Animated.View style={{ transform: [{ rotate: chevronRotate }], marginLeft: 10, marginTop: 2 }}>
            <IcoChevron color={t.muted2} />
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>

      {isExpanded && (
        <Animated.View style={[fr.body, { opacity: bodyOp }]}>
          <Text style={[fr.answer, { color: t.muted }]}>{faq.answer}</Text>
        </Animated.View>
      )}
    </View>
  )
}

const fr = StyleSheet.create({
  wrap:     {},
  row:      { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 16 },
  cat:      { fontFamily: 'Geist-SemiBold', fontSize: 9.5, letterSpacing: 0.9, marginBottom: 5 },
  question: { fontFamily: 'Geist-Medium', fontSize: 13.5, lineHeight: 20, letterSpacing: -0.1 },
  body:     { paddingHorizontal: 18, paddingBottom: 18, paddingTop: 0 },
  answer:   { fontFamily: 'Geist-Regular', fontSize: 13, lineHeight: 22 },
})

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AyudaScreen() {
  const colorScheme = useColorScheme()
  const isDark      = colorScheme === 'dark'
  const t           = tk(isDark)
  const insets      = useSafeAreaInsets()
  const router      = useRouter()

  const [activeCategory, setActiveCategory] = useState<Category>('all')
  const [searchQuery,    setSearchQuery]    = useState('')
  const [expandedFAQ,    setExpandedFAQ]    = useState<string | null>(null)

  // Entrance animation
  const fade  = useRef(new Animated.Value(0)).current
  const slide = useRef(new Animated.Value(8)).current
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade,  { toValue: 1, duration: 360, useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 360, useNativeDriver: true }),
    ]).start()
  }, [])

  const filtered = FAQS.filter(f => {
    const matchCat = activeCategory === 'all' || f.category === activeCategory
    const q        = searchQuery.toLowerCase()
    const matchQ   = !q || f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q)
    return matchCat && matchQ
  })

  const count = (cat: Exclude<Category, 'all'>) => FAQS.filter(f => f.category === cat).length

  return (
    <View style={[s.root, { backgroundColor: t.bg }]}>

      <Animated.ScrollView
        style={{ flex: 1, opacity: fade, transform: [{ translateY: slide }] }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[s.scroll, { paddingTop: insets.top + 6, paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Back row ── */}
        <TouchableOpacity style={s.backRow} onPress={() => router.back()} activeOpacity={0.7}>
          <IcoBack color={t.muted} />
          <Text style={[s.backLabel, { color: t.muted }]}>Volver</Text>
        </TouchableOpacity>

        {/* ── Hero ── */}
        <View style={s.hero}>
          <Text style={[s.eyebrow, { color: t.muted }]}>Centro de ayuda</Text>
          <Text style={[s.heroTitle, { color: t.text }]}>
            ¿En qué podemos{'\n'}ayudarte?
          </Text>
        </View>

        {/* ── Search ── */}
        <View style={[s.searchCard, { backgroundColor: t.inputBg, borderColor: t.border }]}>
          <IcoSearch color={t.muted2} />
          <TextInput
            style={[s.searchInput, { color: t.text }]}
            placeholder="Buscar en preguntas frecuentes…"
            placeholderTextColor={t.muted2}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <IcoX color={t.muted2} />
            </TouchableOpacity>
          )}
        </View>

        {/* ── Category pills ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.pillsRow}
          style={{ marginTop: 16 }}
        >
          {CATEGORIES.map(cat => {
            const cnt    = cat.id === 'all' ? FAQS.length : count(cat.id as Exclude<Category, 'all'>)
            const active = activeCategory === cat.id
            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  s.pill,
                  active
                    ? { backgroundColor: isDark ? '#f5f5f4' : '#1c1917', borderColor: 'transparent' }
                    : { backgroundColor: t.surface, borderColor: t.border },
                ]}
                onPress={() => { setActiveCategory(cat.id); setExpandedFAQ(null) }}
                activeOpacity={0.75}
              >
                <Text style={[s.pillText, { color: active ? (isDark ? '#1c1917' : '#fff') : t.muted }]}>
                  {cat.label}
                </Text>
                <Text style={[s.pillCount, { color: active ? (isDark ? 'rgba(28,25,23,0.5)' : 'rgba(255,255,255,0.55)') : t.muted3 }]}>
                  {cnt}
                </Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>

        {/* ── FAQ list ── */}
        <View style={{ marginTop: 20 }}>
          {filtered.length === 0 ? (

            /* Empty state */
            <View style={s.emptyState}>
              <View style={[s.emptyIcon, { backgroundColor: isDark ? '#1c1917' : '#f0efee' }]}>
                <IcoSearch color={t.muted3} size={22} />
              </View>
              <Text style={[s.emptyTitle, { color: t.text2 }]}>
                Sin resultados para "{searchQuery}"
              </Text>
              <TouchableOpacity
                onPress={() => { setSearchQuery(''); setActiveCategory('all') }}
                activeOpacity={0.7}
              >
                <Text style={s.emptyLink}>Ver todas las preguntas</Text>
              </TouchableOpacity>
            </View>

          ) : (

            <View style={[s.faqCard, { backgroundColor: t.surface, borderColor: t.border }]}>
              {filtered.map((faq, i) => (
                <FAQRow
                  key={faq.id}
                  faq={faq}
                  isExpanded={expandedFAQ === faq.id}
                  onToggle={() => setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)}
                  isLast={i === filtered.length - 1}
                  isDark={isDark}
                />
              ))}
            </View>

          )}
        </View>

        {/* ── Contact card ── */}
        <View style={[s.contactCard, { backgroundColor: t.surface, borderColor: t.border }]}>
          {/* Top accent */}
          <View style={s.contactAccent} />

          <View style={s.contactBody}>
            <View style={s.contactEyebrowRow}>
              <IcoSpark color={BRAND} />
              <Text style={[s.contactEyebrow, { color: t.muted }]}>Soporte directo</Text>
            </View>

            <Text style={[s.contactTitle, { color: t.text }]}>
              ¿No encuentras lo que buscas?{'\n'}
              <Text style={{ fontStyle: 'italic' }}>Nuestro equipo está listo.</Text>
            </Text>

            <TouchableOpacity
              style={s.contactBtnPrimary}
              onPress={() => Linking.openURL('mailto:soporte@gandia7.com')}
              activeOpacity={0.85}
            >
              <IcoMail color="#fff" />
              <Text style={s.contactBtnPrimaryText}>soporte@gandia7.com</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.contactBtnSecondary, { backgroundColor: isDark ? '#1c1917' : '#f0efee' }]}
              activeOpacity={0.65}
              disabled
            >
              <IcoPhone color={t.muted2} />
              <Text style={[s.contactBtnSecondaryText, { color: t.muted2 }]}>No disponible</Text>
            </TouchableOpacity>

            <Text style={[s.contactHint, { color: t.muted3 }]}>
              Lunes a viernes · 9:00 AM – 6:00 PM
            </Text>
          </View>
        </View>

      </Animated.ScrollView>
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 16 },

  // Back row
  backRow:   { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  backLabel: { fontFamily: 'Geist-Medium', fontSize: 13 },

  // Hero
  hero:      { paddingTop: 28, paddingBottom: 20 },
  eyebrow:   { fontFamily: 'Geist-SemiBold', fontSize: 10.5, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 8 },
  heroTitle: { fontFamily: 'InstrumentSerif-Italic', fontSize: 32, lineHeight: 40, letterSpacing: -0.5 },

  // Search
  searchCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    height: 46, paddingHorizontal: 14, borderRadius: 14,
    borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  searchInput: { flex: 1, fontFamily: 'Geist-Regular', fontSize: 13.5 },

  // Pills
  pillsRow: { gap: 6, paddingHorizontal: 0, paddingBottom: 2 },
  pill:     { flexDirection: 'row', alignItems: 'center', gap: 5, height: 30, paddingHorizontal: 13, borderRadius: 999, borderWidth: 1 },
  pillText: { fontFamily: 'Geist-Medium', fontSize: 12 },
  pillCount:{ fontFamily: 'Geist-SemiBold', fontSize: 10 },

  // FAQ card
  faqCard: { borderRadius: 20, borderWidth: 1, overflow: 'hidden' },

  // Empty
  emptyState: { alignItems: 'center', paddingVertical: 56, gap: 10 },
  emptyIcon:  { width: 50, height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyTitle: { fontFamily: 'Geist-Medium', fontSize: 14, textAlign: 'center' },
  emptyLink:  { fontFamily: 'Geist-Medium', fontSize: 12.5, color: BRAND, marginTop: 2 },

  // Contact card
  contactCard:   { marginTop: 16, borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
  contactAccent: { height: 3, backgroundColor: BRAND },
  contactBody:   { padding: 20, gap: 10 },
  contactEyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  contactEyebrow:    { fontFamily: 'Geist-SemiBold', fontSize: 10.5, letterSpacing: 1.0, textTransform: 'uppercase' },
  contactTitle:      { fontFamily: 'InstrumentSerif-Regular', fontSize: 17, lineHeight: 25, marginBottom: 6 },
  contactBtnPrimary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 44, borderRadius: 13, backgroundColor: BRAND },
  contactBtnPrimaryText:   { fontFamily: 'Geist-Medium', fontSize: 13, color: '#fff' },
  contactBtnSecondary:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 44, borderRadius: 13 },
  contactBtnSecondaryText: { fontFamily: 'Geist-Medium', fontSize: 13 },
  contactHint: { fontFamily: 'Geist-Regular', fontSize: 10.5, textAlign: 'center', marginTop: 2 },
})