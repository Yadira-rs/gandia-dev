/**
 * GANDIA — Editar Perfil Auditor (React Native)
 * app/(app)/Auditor/editar.tsx
 *
 * Formulario de edición del perfil de auditor.
 * TODO: conectar Supabase para cargar y guardar datos.
 * TODO: invalidatePerfilAuditorCache() tras guardar con éxito.
 */

import React, { useState, useEffect, useRef } from 'react'
import {
  View, Text, ScrollView, TextInput, Pressable, TouchableOpacity,
  StyleSheet, useColorScheme, Modal, Animated,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import Svg, { Path, Polyline, Line, Rect, Circle } from 'react-native-svg'

// ─── TOKENS ─────────────────────────────────────────────────────────────────
const BRAND = '#6d28d9'
const BRAND_DARK = '#4c1d95'

const C = {
  dark: {
    bg:          '#0c0a09',
    surface:     '#141210',
    input:       '#1a1816',
    border:      'rgba(255,255,255,0.09)',
    borderFocus: 'rgba(109,40,217,0.6)',
    text:        '#fafaf9',
    muted:       '#a8a29e',
    sub:         'rgba(255,255,255,0.35)',
    dim:         'rgba(255,255,255,0.07)',
  },
  light: {
    bg:          '#fafaf9',
    surface:     '#ffffff',
    input:       '#f5f4f3',
    border:      'rgba(0,0,0,0.10)',
    borderFocus: 'rgba(109,40,217,0.55)',
    text:        '#1c1917',
    muted:       '#78716c',
    sub:         'rgba(0,0,0,0.38)',
    dim:         'rgba(0,0,0,0.06)',
  },
}

// ─── TYPES ───────────────────────────────────────────────────────────────────
type UserRole = 'auditor_titular' | 'auditor_adjunto' | 'admin_senasica' | 'supervisor_regional'

interface Perm {
  basicInfo: boolean; ambito: boolean; auditorias: boolean; dictamenes: boolean
  normativas: boolean; acreditaciones: boolean; indicadores: boolean; contacto: boolean
}

const PERMS: Record<UserRole, Perm> = {
  auditor_titular:     { basicInfo:true,  ambito:true,  auditorias:true,  dictamenes:true,  normativas:true,  acreditaciones:true,  indicadores:true,  contacto:true  },
  auditor_adjunto:     { basicInfo:false, ambito:true,  auditorias:true,  dictamenes:false, normativas:false, acreditaciones:false, indicadores:false, contacto:false },
  admin_senasica:      { basicInfo:true,  ambito:false, auditorias:false, dictamenes:false, normativas:true,  acreditaciones:true,  indicadores:true,  contacto:true  },
  supervisor_regional: { basicInfo:false, ambito:true,  auditorias:true,  dictamenes:true,  normativas:false, acreditaciones:false, indicadores:true,  contacto:false },
}

const ROLE_LABELS: Record<UserRole, string> = {
  auditor_titular:     'Auditor Titular',
  auditor_adjunto:     'Auditor Adjunto',
  admin_senasica:      'Administrador SENASICA',
  supervisor_regional: 'Supervisor Regional',
}

interface AmbitoItem     { id:string; title:string; description:string; nivel:'Federal'|'Internacional' }
interface AuditoriaItem  { id:string; nombre:string; tipo:string; fecha:string; resultado:'aprobado'|'observaciones'|'suspendido'; puntuacion:string }
interface DictamenItem   { id:string; folio:string; titulo:string; tipo:string; fecha:string; estado:'favorable'|'observaciones'|'desfavorable' }
interface NormativaItem  { id:string; clave:string; desc:string }
interface AcredItem      { id:string; nombre:string; vence:string; estado:'vigente'|'por-vencer'|'vencido' }

interface Form {
  nombre:string; titulo:string; ubicacion:string; registroSenasica:string
  organizacion:string; aniosExp:string; descripcion:string
  telefono:string; email:string; sitioWeb:string; horario:string
  auditoriasRealizadas:string; cumplimientoProm:string; estadosCubiertos:string
  auditsMes:string; auditoriasAprobadas:string; dictamenesSinApelacion:string
  certsExportOK:string; dictamenesTotal:string
}

const EMPTY_FORM: Form = {
  nombre:'', titulo:'', ubicacion:'', registroSenasica:'',
  organizacion:'', aniosExp:'', descripcion:'',
  telefono:'', email:'', sitioWeb:'', horario:'',
  auditoriasRealizadas:'', cumplimientoProm:'', estadosCubiertos:'',
  auditsMes:'', auditoriasAprobadas:'', dictamenesSinApelacion:'',
  certsExportOK:'', dictamenesTotal:'',
}

// ─── ICONS ───────────────────────────────────────────────────────────────────
const SP = { strokeLinecap:'round' as const, strokeLinejoin:'round' as const }
const IArrow  = ({ c='#a8a29e', z=14 }) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Line x1="19" y1="12" x2="5" y2="12" stroke={c} strokeWidth={1.65} {...SP}/><Polyline points="12 19 5 12 12 5" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const ISave   = ({ c='#fff',    z=14 }) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" stroke={c} strokeWidth={1.65} {...SP}/><Polyline points="17 21 17 13 7 13 7 21" stroke={c} strokeWidth={1.65} {...SP}/><Polyline points="7 3 7 8 15 8" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const ISpark  = ({ c=BRAND,     z=11 }) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const ILock   = ({ c='#a8a29e', z=11 }) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Rect x="3" y="11" width="18" height="11" rx="2" stroke={c} strokeWidth={1.65} {...SP}/><Path d="M7 11V7a5 5 0 0 1 10 0v4" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const ICheck  = ({ c='#fff',    z=11 }) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Polyline points="20 6 9 17 4 12" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const IClose  = ({ c='#a8a29e', z=14 }) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Line x1="18" y1="6" x2="6" y2="18" stroke={c} strokeWidth={1.65} {...SP}/><Line x1="6" y1="6" x2="18" y2="18" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const IPlus   = ({ c=BRAND,     z=14 }) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Line x1="12" y1="5" x2="12" y2="19" stroke={c} strokeWidth={1.65} {...SP}/><Line x1="5" y1="12" x2="19" y2="12" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const IEdit   = ({ c='#a8a29e', z=13 }) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke={c} strokeWidth={1.65} {...SP}/><Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const ITrash  = ({ c='#a8a29e', z=13 }) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Polyline points="3 6 5 6 21 6" stroke={c} strokeWidth={1.65} {...SP}/><Path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke={c} strokeWidth={1.65} {...SP}/></Svg>

// ─── PRIMITIVES ──────────────────────────────────────────────────────────────

function SectionLabel({ text }: { text: string }) {
  const isDark = useColorScheme() === 'dark'
  const t = isDark ? C.dark : C.light
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
      <ISpark c={BRAND} z={11} />
      <Text style={{ fontSize: 10, fontWeight: '600', letterSpacing: 1.2, textTransform: 'uppercase', color: t.muted }}>
        {text}
      </Text>
      <View style={{ flex: 1, height: 1, backgroundColor: t.dim }} />
    </View>
  )
}

function Field({
  label, value, onChange, placeholder, disabled = false,
  keyboardType = 'default', multiline = false, hint, required,
}: {
  label: string; value: string; onChange: (v: string) => void
  placeholder?: string; disabled?: boolean
  keyboardType?: 'default'|'numeric'|'email-address'|'phone-pad'|'url'
  multiline?: boolean; hint?: string; required?: boolean
}) {
  const isDark = useColorScheme() === 'dark'
  const t = isDark ? C.dark : C.light
  const [focus, setFocus] = useState(false)
  return (
    <View style={{ marginBottom: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
        <Text style={{ fontSize: 10.5, fontWeight: '600', letterSpacing: 0.7, textTransform: 'uppercase', color: t.muted }}>
          {label}{required && <Text style={{ color: BRAND }}> *</Text>}
        </Text>
        {disabled && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
            <ILock c={t.sub} z={10} />
            <Text style={{ fontSize: 9.5, color: t.sub }}>Solo lectura</Text>
          </View>
        )}
      </View>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={t.sub}
        editable={!disabled}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        style={[s.input, {
          backgroundColor: t.input,
          borderColor: focus ? t.borderFocus : t.border,
          color: t.text,
          opacity: disabled ? 0.45 : 1,
          height: multiline ? 88 : 44,
          textAlignVertical: multiline ? 'top' : 'center',
          paddingTop: multiline ? 10 : 0,
        }]}
      />
      {hint && <Text style={{ fontSize: 11, color: t.sub, marginTop: 4 }}>{hint}</Text>}
    </View>
  )
}

function Section({ label, locked, children }: {
  label: string; locked: boolean; children: React.ReactNode
}) {
  const isDark = useColorScheme() === 'dark'
  const t = isDark ? C.dark : C.light
  return (
    <View style={{ marginBottom: 24 }}>
      <SectionLabel text={label} />
      <View style={[s.card, {
        backgroundColor: t.surface,
        borderColor: t.border,
        opacity: locked ? 0.55 : 1,
      }]}>
        <View style={[s.sectionHeader, { borderBottomColor: t.dim }]}>
          <View style={[s.sectionIconWrap, { backgroundColor: locked ? t.dim : `${BRAND}18` }]}>
            {locked ? <ILock c={t.muted} z={13} /> : <ISpark c={BRAND} z={13} />}
          </View>
          <Text style={[s.sectionTitle, { color: t.text }]}>{label}</Text>
          {locked && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 'auto' }}>
              <ILock c={t.sub} z={11} />
              <Text style={{ fontSize: 10.5, color: t.sub }}>Sin permisos</Text>
            </View>
          )}
        </View>
        <View style={{ padding: 16, ...(locked ? { pointerEvents: 'none' } : {}) } as any}>
          {children}
        </View>
      </View>
    </View>
  )
}

function ItemRow({ children, onEdit, onDelete, canEdit }: {
  children: React.ReactNode; onEdit: () => void; onDelete: () => void; canEdit: boolean
}) {
  const isDark = useColorScheme() === 'dark'
  const t = isDark ? C.dark : C.light
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: t.dim }}>
      <View style={{ flex: 1 }}>{children}</View>
      {canEdit && (
        <View style={{ flexDirection: 'row', gap: 4 }}>
          <Pressable onPress={onEdit}   style={s.rowIconBtn}><IEdit  c={t.muted} z={13} /></Pressable>
          <Pressable onPress={onDelete} style={s.rowIconBtn}><ITrash c={t.muted} z={13} /></Pressable>
        </View>
      )}
    </View>
  )
}

function AddButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [s.addBtn, {
        borderColor: `${BRAND}35`,
        backgroundColor: pressed ? `${BRAND}08` : 'transparent',
        marginTop: 10,
      }]}>
      <IPlus c={BRAND} z={14} />
      <Text style={{ fontSize: 12.5, fontWeight: '500', color: BRAND }}>{label}</Text>
    </Pressable>
  )
}

// ─── BADGE CHIPS ─────────────────────────────────────────────────────────────

function NivelChip({ nivel }: { nivel: 'Federal' | 'Internacional' }) {
  const isInt = nivel === 'Internacional'
  return (
    <View style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 99, backgroundColor: isInt ? 'rgba(59,130,246,0.12)' : `${BRAND}14` }}>
      <Text style={{ fontSize: 9.5, fontWeight: '700', color: isInt ? '#3b82f6' : BRAND }}>{nivel}</Text>
    </View>
  )
}

function StatusBadge({ value, type }: {
  value: string
  type: 'resultado' | 'estado' | 'acred'
}) {
  const cfgMap: Record<string, { bg: string; text: string }> = {
    aprobado:     { bg: 'rgba(34,197,94,0.12)', text: '#16a34a' },
    observaciones:{ bg: 'rgba(245,158,11,0.12)', text: '#d97706' },
    suspendido:   { bg: 'rgba(239,68,68,0.12)', text: '#dc2626' },
    favorable:    { bg: 'rgba(34,197,94,0.12)', text: '#16a34a' },
    desfavorable: { bg: 'rgba(239,68,68,0.12)', text: '#dc2626' },
    vigente:      { bg: 'rgba(34,197,94,0.12)', text: '#16a34a' },
    'por-vencer': { bg: 'rgba(245,158,11,0.12)', text: '#d97706' },
    vencido:      { bg: 'rgba(239,68,68,0.12)', text: '#dc2626' },
  }
  const labels: Record<string, string> = {
    aprobado:'Aprobado', observaciones:'Observaciones', suspendido:'Suspendido',
    favorable:'Favorable', desfavorable:'Desfavorable',
    vigente:'Vigente', 'por-vencer':'Por vencer', vencido:'Vencido',
  }
  const cfg = cfgMap[value] ?? { bg: '#f5f5f4', text: '#78716c' }
  return (
    <View style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 99, backgroundColor: cfg.bg }}>
      <Text style={{ fontSize: 9.5, fontWeight: '600', color: cfg.text }}>{labels[value] ?? value}</Text>
    </View>
  )
}

// ─── PICKER ROW ──────────────────────────────────────────────────────────────

function PickerRow<T extends string>({
  label, options, value, onChange, labelMap,
}: {
  label: string; options: T[]; value: T; onChange: (v: T) => void; labelMap: Record<T, string>
}) {
  const isDark = useColorScheme() === 'dark'
  const t = isDark ? C.dark : C.light
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ fontSize: 10.5, fontWeight: '600', letterSpacing: 0.7, textTransform: 'uppercase', color: t.muted, marginBottom: 8 }}>{label}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {options.map(o => (
          <Pressable key={o} onPress={() => onChange(o)} style={[s.statusOpt, {
            backgroundColor: value === o ? `${BRAND}18` : t.dim,
            borderColor:     value === o ? `${BRAND}40` : t.border,
          }]}>
            <Text style={{ fontSize: 12, fontWeight: '500', color: value === o ? BRAND : t.muted }}>
              {labelMap[o]}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  )
}

// ─── TOAST ───────────────────────────────────────────────────────────────────

function Toast({ show }: { show: boolean }) {
  const isDark     = useColorScheme() === 'dark'
  const opacity    = useRef(new Animated.Value(0)).current
  const translateY = useRef(new Animated.Value(20)).current

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateY, { toValue: show ? 0 : 20, useNativeDriver: true, tension: 80, friction: 10 }),
      Animated.timing(opacity,    { toValue: show ? 1 : 0, duration: 200, useNativeDriver: true }),
    ]).start()
  }, [show])

  return (
    <Animated.View
      style={[s.toast, {
        backgroundColor: isDark ? '#fafaf9' : '#1c1917',
        opacity, transform: [{ translateY }],
      }]}
      pointerEvents="none"
    >
      <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: BRAND, alignItems: 'center', justifyContent: 'center' }}>
        <ICheck c="#fff" z={11} />
      </View>
      <Text style={{ fontSize: 13, fontWeight: '500', color: isDark ? '#1c1917' : '#fafaf9' }}>
        Cambios guardados correctamente
      </Text>
    </Animated.View>
  )
}

// ─── CONFIRM DIALOG ──────────────────────────────────────────────────────────

function ConfirmDialog({ show, title, message, onConfirm, onCancel }: {
  show: boolean; title: string; message: string; onConfirm: () => void; onCancel: () => void
}) {
  const isDark = useColorScheme() === 'dark'
  const t = isDark ? C.dark : C.light
  return (
    <Modal visible={show} transparent animationType="fade">
      <View style={[s.overlay, { justifyContent: 'center' }]}>
        <View style={[s.dialog, { backgroundColor: isDark ? '#1c1917' : '#fff' }]}>
          <View style={{ padding: 20, paddingBottom: 16 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: t.text, marginBottom: 6 }}>{title}</Text>
            <Text style={{ fontSize: 12.5, color: t.muted, lineHeight: 19 }}>{message}</Text>
          </View>
          <View style={[s.dialogActions, { borderTopColor: t.dim }]}>
            <Pressable onPress={onCancel}  style={[s.dialogBtn, { borderRightWidth: 1, borderRightColor: t.dim }]}>
              <Text style={{ fontSize: 13, fontWeight: '500', color: t.muted }}>Cancelar</Text>
            </Pressable>
            <Pressable onPress={onConfirm} style={s.dialogBtn}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#ef4444' }}>Continuar</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  )
}

// ─── BOTTOM SHEET ────────────────────────────────────────────────────────────

function BottomSheet({ show, title, onClose, children }: {
  show: boolean; title: string; onClose: () => void; children: React.ReactNode
}) {
  const isDark     = useColorScheme() === 'dark'
  const insets     = useSafeAreaInsets()
  const t          = isDark ? C.dark : C.light
  const translateY = useRef(new Animated.Value(600)).current

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: show ? 0 : 600,
      useNativeDriver: true, tension: 65, friction: 12,
    }).start()
  }, [show])

  if (!show) return null
  return (
    <Modal visible={show} transparent animationType="none">
      <Pressable style={s.overlay} onPress={onClose} />
      <Animated.View style={[s.sheet, {
        backgroundColor: t.surface,
        paddingBottom: insets.bottom + 16,
        transform: [{ translateY }],
      }]}>
        <View style={{ alignItems: 'center', paddingVertical: 10 }}>
          <View style={{ width: 32, height: 3, borderRadius: 2, backgroundColor: t.border }} />
        </View>
        <View style={[s.sheetHeader, { borderBottomColor: t.dim }]}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: t.text }}>{title}</Text>
          <Pressable onPress={onClose} style={[s.closeBtn, { backgroundColor: t.dim }]}>
            <IClose c={t.muted} z={14} />
          </Pressable>
        </View>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView style={{ maxHeight: 430 }} contentContainerStyle={{ padding: 16 }}>
            {children}
          </ScrollView>
        </KeyboardAvoidingView>
      </Animated.View>
    </Modal>
  )
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

export default function EditarPerfilAuditor() {
  const router  = useRouter()
  const isDark  = useColorScheme() === 'dark'
  const insets  = useSafeAreaInsets()
  const t       = isDark ? C.dark : C.light

  // ── Estado general ────────────────────────────────────────────────────────
  const [role,      setRole]      = useState<UserRole>('auditor_titular')
  const [isSaving,  setIsSaving]  = useState(false)
  const [saveError, setSaveError] = useState('')
  const [showToast, setShowToast] = useState(false)
  const [form,      setForm]      = useState<Form>(EMPTY_FORM)

  // ── Listas ────────────────────────────────────────────────────────────────
  const [ambitos,      setAmbitos]      = useState<AmbitoItem[]>([])
  const [auditorias,   setAuditorias]   = useState<AuditoriaItem[]>([])
  const [dictamenes,   setDictamenes]   = useState<DictamenItem[]>([])
  const [normativas,   setNormativas]   = useState<NormativaItem[]>([])
  const [acreditaciones, setAcreditaciones] = useState<AcredItem[]>([])

  // ── Bottom sheet state ────────────────────────────────────────────────────
  const [ambitoPanel,    setAmbitoPanel]    = useState(false)
  const [audPanel,       setAudPanel]       = useState(false)
  const [dictPanel,      setDictPanel]      = useState(false)
  const [normPanel,      setNormPanel]      = useState(false)
  const [acredPanel,     setAcredPanel]     = useState(false)

  const [tmpAmbito,  setTmpAmbito]  = useState<AmbitoItem>({ id:'', title:'', description:'', nivel:'Federal' })
  const [tmpAud,     setTmpAud]     = useState<AuditoriaItem>({ id:'', nombre:'', tipo:'', fecha:'', resultado:'aprobado', puntuacion:'' })
  const [tmpDict,    setTmpDict]    = useState<DictamenItem>({ id:'', folio:'', titulo:'', tipo:'', fecha:'', estado:'favorable' })
  const [tmpNorm,    setTmpNorm]    = useState<NormativaItem>({ id:'', clave:'', desc:'' })
  const [tmpAcred,   setTmpAcred]   = useState<AcredItem>({ id:'', nombre:'', vence:'', estado:'vigente' })

  const [editingAmbito,  setEditingAmbito]  = useState<AmbitoItem   | null>(null)
  const [editingAud,     setEditingAud]     = useState<AuditoriaItem| null>(null)
  const [editingDict,    setEditingDict]    = useState<DictamenItem  | null>(null)
  const [editingNorm,    setEditingNorm]    = useState<NormativaItem | null>(null)
  const [editingAcred,   setEditingAcred]   = useState<AcredItem     | null>(null)

  const [confirm, setConfirm] = useState<{ show:boolean; title:string; message:string; onOk:()=>void }>({
    show:false, title:'', message:'', onOk: () => {}
  })

  const perm = PERMS[role]
  const f = (k: keyof Form) => (v: string) => setForm(p => ({ ...p, [k]: v }))

  // TODO: conectar Supabase — cargar auditor_extended_profiles aquí
  // useEffect(() => {
  //   const load = async () => {
  //     const { data: { session } } = await supabase.auth.getSession()
  //     const uid = session?.user?.id
  //     if (!uid) return
  //     const { data: me } = await supabase.from('auditor_extended_profiles').select('*').eq('user_id', uid).maybeSingle()
  //     if (me) {
  //       setForm({ nombre: me.nombre ?? '', titulo: me.titulo ?? '', ... })
  //       setAmbitos(me.ambitos ?? [])
  //       setAuditorias(me.auditorias ?? [])
  //       setDictamenes(me.dictamenes ?? [])
  //       setNormativas(me.normativas ?? [])
  //       setAcreditaciones(me.acreditaciones ?? [])
  //     }
  //   }
  //   load()
  // }, [])

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (isSaving) return
    setIsSaving(true)
    setSaveError('')
    try {
      // TODO: conectar Supabase — descomentar el bloque siguiente
      // const { data: { session } } = await supabase.auth.getSession()
      // const uid = session?.user?.id
      // if (!uid) throw new Error('Sin sesión activa')
      // const { error } = await supabase.from('auditor_extended_profiles').upsert({
      //   user_id:                  uid,
      //   titulo:                   form.titulo                || null,
      //   ubicacion:                form.ubicacion             || null,
      //   registro_senasica:        form.registroSenasica      || null,
      //   organizacion:             form.organizacion          || null,
      //   anios_exp:                form.aniosExp              ? parseInt(form.aniosExp)              : null,
      //   descripcion:              form.descripcion           || null,
      //   telefono:                 form.telefono              || null,
      //   email_contact:            form.email                 || null,
      //   sitio_web:                form.sitioWeb              || null,
      //   horario:                  form.horario               || null,
      //   auditorias_realizadas:    form.auditoriasRealizadas  ? parseInt(form.auditoriasRealizadas)  : null,
      //   cumplimiento_prom:        form.cumplimientoProm      ? parseFloat(form.cumplimientoProm)    : null,
      //   estados_cubiertos:        form.estadosCubiertos      ? parseInt(form.estadosCubiertos)      : null,
      //   audits_mes:               form.auditsMes             ? parseInt(form.auditsMes)             : null,
      //   auditorias_aprobadas:     form.auditoriasAprobadas   ? parseInt(form.auditoriasAprobadas)   : null,
      //   dictamenes_sin_apelacion: form.dictamenesSinApelacion? parseInt(form.dictamenesSinApelacion): null,
      //   certs_export_ok:          form.certsExportOK         ? parseInt(form.certsExportOK)         : null,
      //   dictamenes_total:         form.dictamenesTotal       ? parseInt(form.dictamenesTotal)       : null,
      //   ambitos, auditorias, dictamenes, normativas, acreditaciones,
      //   updated_at: new Date().toISOString(),
      // }, { onConflict: 'user_id' })
      // if (error) throw error
      // invalidatePerfilAuditorCache()

      setShowToast(true)
      setTimeout(() => {
        setShowToast(false)
        router.back()
      }, 2200)
    } catch (e: unknown) {
      setSaveError(e instanceof Error ? e.message : 'Error al guardar')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setConfirm({
      show: true,
      title: 'Descartar cambios',
      message: 'Si sales ahora perderás los cambios no guardados.',
      onOk: () => router.back(),
    })
  }

  // ── Generic list handlers factory ────────────────────────────────────────
  function makeHandlers<I extends { id: string }>(
    setList: React.Dispatch<React.SetStateAction<I[]>>,
    setEditing: (v: I | null) => void,
    setTmp: (v: I) => void,
    setPanel: (v: boolean) => void,
    empty: I,
  ) {
    return {
      openAdd:  () => { const item = { ...empty, id: Date.now().toString() }; setEditing(null); setTmp(item); setPanel(true) },
      openEdit: (item: I) => { setEditing(item); setTmp({ ...item }); setPanel(true) },
      save: (tmp: I) => {
        if (editingAmbito !== null || editingAud !== null || editingDict !== null || editingNorm !== null || editingAcred !== null) {
          setList(prev => prev.map(x => x.id === tmp.id ? tmp : x))
        } else {
          setList(prev => {
            const exists = prev.find(x => x.id === tmp.id)
            return exists ? prev.map(x => x.id === tmp.id ? tmp : x) : [...prev, tmp]
          })
        }
        setPanel(false); setEditing(null)
      },
      delete: (id: string) => {
        setConfirm({
          show: true, title: 'Eliminar elemento', message: '¿Estás seguro? Esta acción no se puede deshacer.',
          onOk: () => { setList(p => p.filter(x => x.id !== id)); setConfirm(c => ({ ...c, show: false })) },
        })
      },
    }
  }

  // ── Ámbito handlers ───────────────────────────────────────────────────────
  const openAddAmbito  = () => { setEditingAmbito(null); setTmpAmbito({ id: Date.now().toString(), title:'', description:'', nivel:'Federal' }); setAmbitoPanel(true) }
  const openEditAmbito = (item: AmbitoItem) => { setEditingAmbito(item); setTmpAmbito({...item}); setAmbitoPanel(true) }
  const saveAmbito = () => {
    setAmbitos(prev => editingAmbito ? prev.map(x => x.id === editingAmbito.id ? tmpAmbito : x) : [...prev, tmpAmbito])
    setAmbitoPanel(false); setEditingAmbito(null)
  }
  const deleteAmbito = (id: string) => setConfirm({ show:true, title:'Eliminar ámbito', message:'¿Eliminar este ámbito de inspección?', onOk: () => { setAmbitos(p => p.filter(x => x.id !== id)); setConfirm(c => ({...c, show:false})) } })

  // ── Auditoría handlers ────────────────────────────────────────────────────
  const openAddAud  = () => { setEditingAud(null); setTmpAud({ id: Date.now().toString(), nombre:'', tipo:'', fecha:'', resultado:'aprobado', puntuacion:'' }); setAudPanel(true) }
  const openEditAud = (item: AuditoriaItem) => { setEditingAud(item); setTmpAud({...item}); setAudPanel(true) }
  const saveAud = () => {
    setAuditorias(prev => editingAud ? prev.map(x => x.id === editingAud.id ? tmpAud : x) : [...prev, tmpAud])
    setAudPanel(false); setEditingAud(null)
  }
  const deleteAud = (id: string) => setConfirm({ show:true, title:'Eliminar auditoría', message:'¿Eliminar este registro de auditoría?', onOk: () => { setAuditorias(p => p.filter(x => x.id !== id)); setConfirm(c => ({...c, show:false})) } })

  // ── Dictamen handlers ────────────────────────────────────────────────────
  const openAddDict  = () => { setEditingDict(null); setTmpDict({ id: Date.now().toString(), folio:'', titulo:'', tipo:'', fecha:'', estado:'favorable' }); setDictPanel(true) }
  const openEditDict = (item: DictamenItem) => { setEditingDict(item); setTmpDict({...item}); setDictPanel(true) }
  const saveDict = () => {
    setDictamenes(prev => editingDict ? prev.map(x => x.id === editingDict.id ? tmpDict : x) : [...prev, tmpDict])
    setDictPanel(false); setEditingDict(null)
  }
  const deleteDict = (id: string) => setConfirm({ show:true, title:'Eliminar dictamen', message:'¿Eliminar este dictamen?', onOk: () => { setDictamenes(p => p.filter(x => x.id !== id)); setConfirm(c => ({...c, show:false})) } })

  // ── Normativa handlers ────────────────────────────────────────────────────
  const openAddNorm  = () => { setEditingNorm(null); setTmpNorm({ id: Date.now().toString(), clave:'', desc:'' }); setNormPanel(true) }
  const openEditNorm = (item: NormativaItem) => { setEditingNorm(item); setTmpNorm({...item}); setNormPanel(true) }
  const saveNorm = () => {
    setNormativas(prev => editingNorm ? prev.map(x => x.id === editingNorm.id ? tmpNorm : x) : [...prev, tmpNorm])
    setNormPanel(false); setEditingNorm(null)
  }
  const deleteNorm = (id: string) => setConfirm({ show:true, title:'Eliminar normativa', message:'¿Eliminar esta normativa?', onOk: () => { setNormativas(p => p.filter(x => x.id !== id)); setConfirm(c => ({...c, show:false})) } })

  // ── Acred handlers ────────────────────────────────────────────────────────
  const openAddAcred  = () => { setEditingAcred(null); setTmpAcred({ id: Date.now().toString(), nombre:'', vence:'', estado:'vigente' }); setAcredPanel(true) }
  const openEditAcred = (item: AcredItem) => { setEditingAcred(item); setTmpAcred({...item}); setAcredPanel(true) }
  const saveAcred = () => {
    setAcreditaciones(prev => editingAcred ? prev.map(x => x.id === editingAcred.id ? tmpAcred : x) : [...prev, tmpAcred])
    setAcredPanel(false); setEditingAcred(null)
  }
  const deleteAcred = (id: string) => setConfirm({ show:true, title:'Eliminar acreditación', message:'¿Eliminar esta acreditación?', onOk: () => { setAcreditaciones(p => p.filter(x => x.id !== id)); setConfirm(c => ({...c, show:false})) } })

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={[s.root, { backgroundColor: t.bg }]}>

      {/* ── HEADER ── */}
      <View style={[s.header, {
        backgroundColor: isDark ? 'rgba(12,10,9,0.96)' : 'rgba(250,250,249,0.96)',
        borderBottomColor: t.border,
        paddingTop: insets.top + 6,
      }]}>
        <View style={s.headerRow}>
          <TouchableOpacity onPress={handleCancel} style={[s.iconBtn, { backgroundColor: t.dim }]} activeOpacity={0.7}>
            <IArrow c={t.muted} z={14} />
          </TouchableOpacity>
          <View style={{ flex: 1, marginHorizontal: 12 }}>
            <Text style={{ fontSize: 9.5, fontWeight: '600', letterSpacing: 0.9, textTransform: 'uppercase', color: t.muted, marginBottom: 2 }}>
              {ROLE_LABELS[role]}
            </Text>
            <Text style={{ fontSize: 15, fontWeight: '600', color: t.text }} numberOfLines={1}>
              Editar perfil de auditor
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleSave}
            disabled={isSaving}
            activeOpacity={0.8}
            style={[s.saveBtn, { opacity: isSaving ? 0.6 : 1 }]}>
            {isSaving
              ? <ActivityIndicator color="#fff" size="small" />
              : <ISave c="#fff" z={14} />
            }
            <Text style={s.saveBtnText}>{isSaving ? 'Guardando…' : 'Guardar'}</Text>
          </TouchableOpacity>
        </View>
        {!!saveError && (
          <Text style={{ fontSize: 11, color: '#ef4444', paddingHorizontal: 16, paddingBottom: 8 }}>{saveError}</Text>
        )}
      </View>

      {/* ── CONTENT ── */}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 100 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          {/* Información personal */}
          <Section label="Información personal" locked={!perm.basicInfo}>
            <View style={s.row2}>
              <View style={{ flex: 1 }}>
                <Field label="Nombre completo" value={form.nombre} onChange={f('nombre')} placeholder="Ej: Ing. Fernanda Cisneros" disabled={!perm.basicInfo} required />
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Título / Cargo" value={form.titulo} onChange={f('titulo')} placeholder="Auditora Oficial" disabled={!perm.basicInfo} />
              </View>
            </View>
            <View style={s.row2}>
              <View style={{ flex: 1 }}>
                <Field label="Ubicación" value={form.ubicacion} onChange={f('ubicacion')} placeholder="Monterrey, NL" disabled={!perm.basicInfo} required />
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Registro SENASICA" value={form.registroSenasica} onChange={f('registroSenasica')} placeholder="AUD-2009-0312" disabled={!perm.basicInfo} />
              </View>
            </View>
            <View style={s.row2}>
              <View style={{ flex: 1 }}>
                <Field label="Organización" value={form.organizacion} onChange={f('organizacion')} placeholder="SENASICA / SAGARPA" disabled={!perm.basicInfo} />
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Años de ejercicio" value={form.aniosExp} onChange={f('aniosExp')} placeholder="15" keyboardType="numeric" disabled={!perm.basicInfo} />
              </View>
            </View>
            <Field label="Descripción del perfil" value={form.descripcion} onChange={f('descripcion')} placeholder="Especialización y ámbito de actuación..." disabled={!perm.basicInfo} multiline />
          </Section>

          {/* Ámbito de inspección */}
          <Section label="Ámbito de inspección" locked={!perm.ambito}>
            {ambitos.length === 0 && (
              <Text style={{ fontSize: 12.5, color: t.muted, textAlign: 'center', paddingVertical: 12 }}>
                Sin ámbitos de inspección
              </Text>
            )}
            {ambitos.map(a => (
              <ItemRow key={a.id} canEdit={perm.ambito} onEdit={() => openEditAmbito(a)} onDelete={() => deleteAmbito(a.id)}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: t.text }}>{a.title}</Text>
                  <NivelChip nivel={a.nivel} />
                </View>
                <Text style={{ fontSize: 12, color: t.muted }} numberOfLines={2}>{a.description}</Text>
              </ItemRow>
            ))}
            {perm.ambito && <AddButton label="Agregar ámbito" onPress={openAddAmbito} />}
          </Section>

          {/* Auditorías recientes */}
          <Section label="Auditorías recientes" locked={!perm.auditorias}>
            {auditorias.length === 0 && (
              <Text style={{ fontSize: 12.5, color: t.muted, textAlign: 'center', paddingVertical: 12 }}>
                Sin auditorías registradas
              </Text>
            )}
            {auditorias.map(a => (
              <ItemRow key={a.id} canEdit={perm.auditorias} onEdit={() => openEditAud(a)} onDelete={() => deleteAud(a.id)}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: t.text, flex: 1, marginRight: 8 }} numberOfLines={1}>{a.nombre}</Text>
                  <StatusBadge value={a.resultado} type="resultado" />
                </View>
                <Text style={{ fontSize: 12, color: t.muted }}>
                  {a.tipo} · {a.fecha} · <Text style={{ color: BRAND, fontWeight: '600' }}>{a.puntuacion}</Text>
                </Text>
              </ItemRow>
            ))}
            {perm.auditorias && <AddButton label="Agregar auditoría" onPress={openAddAud} />}
          </Section>

          {/* Dictámenes */}
          <Section label="Dictámenes e informes" locked={!perm.dictamenes}>
            {dictamenes.length === 0 && (
              <Text style={{ fontSize: 12.5, color: t.muted, textAlign: 'center', paddingVertical: 12 }}>
                Sin dictámenes registrados
              </Text>
            )}
            {dictamenes.map(d => (
              <ItemRow key={d.id} canEdit={perm.dictamenes} onEdit={() => openEditDict(d)} onDelete={() => deleteDict(d.id)}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: BRAND }}>{d.folio}</Text>
                  <StatusBadge value={d.estado} type="estado" />
                </View>
                <Text style={{ fontSize: 13, fontWeight: '500', color: t.text, marginBottom: 3 }} numberOfLines={1}>{d.titulo}</Text>
                <Text style={{ fontSize: 11.5, color: t.muted }}>{d.tipo} · {d.fecha}</Text>
              </ItemRow>
            ))}
            {perm.dictamenes && <AddButton label="Agregar dictamen" onPress={openAddDict} />}
          </Section>

          {/* Marco normativo */}
          <Section label="Marco normativo aplicado" locked={!perm.normativas}>
            {normativas.length === 0 && (
              <Text style={{ fontSize: 12.5, color: t.muted, textAlign: 'center', paddingVertical: 12 }}>
                Sin normativas registradas
              </Text>
            )}
            {normativas.map(n => (
              <ItemRow key={n.id} canEdit={perm.normativas} onEdit={() => openEditNorm(n)} onDelete={() => deleteNorm(n.id)}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                  <View style={{ paddingHorizontal: 7, paddingVertical: 4, borderRadius: 8, backgroundColor: `${BRAND}14`, flexShrink: 0 }}>
                    <Text style={{ fontSize: 9.5, fontWeight: '800', color: BRAND }}>{n.clave}</Text>
                  </View>
                  <Text style={{ flex: 1, fontSize: 12, color: t.muted, paddingTop: 2 }} numberOfLines={2}>{n.desc}</Text>
                </View>
              </ItemRow>
            ))}
            {perm.normativas && <AddButton label="Agregar normativa" onPress={openAddNorm} />}
          </Section>

          {/* Acreditaciones */}
          <Section label="Acreditaciones y certificaciones" locked={!perm.acreditaciones}>
            {acreditaciones.length === 0 && (
              <Text style={{ fontSize: 12.5, color: t.muted, textAlign: 'center', paddingVertical: 12 }}>
                Sin acreditaciones registradas
              </Text>
            )}
            {acreditaciones.map(a => (
              <ItemRow key={a.id} canEdit={perm.acreditaciones} onEdit={() => openEditAcred(a)} onDelete={() => deleteAcred(a.id)}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 13, fontWeight: '500', color: t.text, flex: 1, marginRight: 8 }} numberOfLines={1}>{a.nombre}</Text>
                  <StatusBadge value={a.estado} type="acred" />
                </View>
                <Text style={{ fontSize: 11.5, color: t.muted, marginTop: 2 }}>Vence: {a.vence}</Text>
              </ItemRow>
            ))}
            {perm.acreditaciones && <AddButton label="Agregar acreditación" onPress={openAddAcred} />}
          </Section>

          {/* Indicadores */}
          <Section label="Indicadores de desempeño" locked={!perm.indicadores}>
            <View style={s.row2}>
              <View style={{ flex: 1 }}>
                <Field label="Auditorías realizadas" value={form.auditoriasRealizadas} onChange={f('auditoriasRealizadas')} placeholder="620" keyboardType="numeric" disabled={!perm.indicadores} />
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Cumplimiento prom. (%)" value={form.cumplimientoProm} onChange={f('cumplimientoProm')} placeholder="94" keyboardType="numeric" disabled={!perm.indicadores} />
              </View>
            </View>
            <View style={s.row2}>
              <View style={{ flex: 1 }}>
                <Field label="Estados cubiertos" value={form.estadosCubiertos} onChange={f('estadosCubiertos')} placeholder="18" keyboardType="numeric" disabled={!perm.indicadores} />
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Audits / mes" value={form.auditsMes} onChange={f('auditsMes')} placeholder="14" keyboardType="numeric" disabled={!perm.indicadores} />
              </View>
            </View>
            <View style={s.row3}>
              <View style={{ flex: 1 }}>
                <Field label="Aprobadas (%)" value={form.auditoriasAprobadas} onChange={f('auditoriasAprobadas')} placeholder="82" keyboardType="numeric" disabled={!perm.indicadores} hint="% con resultado favorable" />
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Sin apelación (%)" value={form.dictamenesSinApelacion} onChange={f('dictamenesSinApelacion')} placeholder="91" keyboardType="numeric" disabled={!perm.indicadores} hint="% no impugnados" />
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Export. OK (%)" value={form.certsExportOK} onChange={f('certsExportOK')} placeholder="99" keyboardType="numeric" disabled={!perm.indicadores} hint="Sin rechazo en frontera" />
              </View>
            </View>
          </Section>

          {/* Contacto */}
          <Section label="Contacto oficial" locked={!perm.contacto}>
            <View style={s.row2}>
              <View style={{ flex: 1 }}>
                <Field label="Teléfono" value={form.telefono} onChange={f('telefono')} placeholder="+52 81 8358 2200" keyboardType="phone-pad" disabled={!perm.contacto} />
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Email institucional" value={form.email} onChange={f('email')} placeholder="usuario@senasica.gob.mx" keyboardType="email-address" disabled={!perm.contacto} />
              </View>
            </View>
            <View style={s.row2}>
              <View style={{ flex: 1 }}>
                <Field label="Portal / Sitio web" value={form.sitioWeb} onChange={f('sitioWeb')} placeholder="www.gob.mx/senasica" keyboardType="url" disabled={!perm.contacto} />
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Horario de atención" value={form.horario} onChange={f('horario')} placeholder="Lun–Vie: 8:00–15:00" disabled={!perm.contacto} />
              </View>
            </View>
          </Section>

          {/* Permisos banner */}
          <View style={{ marginBottom: 24, padding: 16, borderRadius: 16, backgroundColor: `${BRAND}10`, borderWidth: 1, borderColor: `${BRAND}25` }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: BRAND, marginBottom: 4 }}>Permisos de edición</Text>
            <Text style={{ fontSize: 11.5, color: isDark ? 'rgba(196,181,253,0.8)' : BRAND_DARK, lineHeight: 17 }}>
              Rol actual: <Text style={{ fontWeight: '600' }}>{ROLE_LABELS[role]}</Text>
            </Text>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* ─── BOTTOM SHEET: ÁMBITO ── */}
      <BottomSheet show={ambitoPanel} title={editingAmbito ? 'Editar ámbito' : 'Nuevo ámbito'} onClose={() => { setAmbitoPanel(false); setEditingAmbito(null) }}>
        <Field label="Título *" value={tmpAmbito.title} onChange={v => setTmpAmbito(p => ({...p, title:v}))} placeholder="Ej: Rastros TIF" required />
        <Field label="Descripción" value={tmpAmbito.description} onChange={v => setTmpAmbito(p => ({...p, description:v}))} placeholder="Describe el alcance..." multiline />
        <PickerRow<'Federal'|'Internacional'>
          label="Nivel" options={['Federal','Internacional']} value={tmpAmbito.nivel}
          onChange={v => setTmpAmbito(p => ({...p, nivel:v}))}
          labelMap={{ Federal:'Federal', Internacional:'Internacional' }}
        />
        <View style={s.sheetActions}>
          <Pressable onPress={() => { setAmbitoPanel(false); setEditingAmbito(null) }} style={[s.sheetCancelBtn, { borderColor: t.border }]}>
            <Text style={{ fontSize: 12.5, fontWeight: '500', color: t.muted }}>Cancelar</Text>
          </Pressable>
          <Pressable onPress={saveAmbito} disabled={!tmpAmbito.title} style={[s.sheetConfirmBtn, { opacity: !tmpAmbito.title ? 0.4 : 1 }]}>
            <Text style={{ fontSize: 12.5, fontWeight: '600', color: isDark ? '#1c1917' : '#fafaf9' }}>Guardar</Text>
          </Pressable>
        </View>
      </BottomSheet>

      {/* ─── BOTTOM SHEET: AUDITORÍA ── */}
      <BottomSheet show={audPanel} title={editingAud ? 'Editar auditoría' : 'Nueva auditoría'} onClose={() => { setAudPanel(false); setEditingAud(null) }}>
        <Field label="Establecimiento *" value={tmpAud.nombre} onChange={v => setTmpAud(p => ({...p, nombre:v}))} placeholder="Rastro TIF El Norte" required />
        <Field label="Tipo de auditoría" value={tmpAud.tipo} onChange={v => setTmpAud(p => ({...p, tipo:v}))} placeholder="Rastro TIF, Bienestar Animal..." />
        <Field label="Fecha" value={tmpAud.fecha} onChange={v => setTmpAud(p => ({...p, fecha:v}))} placeholder="2026-02-10" />
        <Field label="Puntuación" value={tmpAud.puntuacion} onChange={v => setTmpAud(p => ({...p, puntuacion:v}))} placeholder="96/100" />
        <PickerRow<'aprobado'|'observaciones'|'suspendido'>
          label="Resultado" options={['aprobado','observaciones','suspendido']} value={tmpAud.resultado}
          onChange={v => setTmpAud(p => ({...p, resultado:v}))}
          labelMap={{ aprobado:'Aprobado', observaciones:'Observaciones', suspendido:'Suspendido' }}
        />
        <View style={s.sheetActions}>
          <Pressable onPress={() => { setAudPanel(false); setEditingAud(null) }} style={[s.sheetCancelBtn, { borderColor: t.border }]}>
            <Text style={{ fontSize: 12.5, fontWeight: '500', color: t.muted }}>Cancelar</Text>
          </Pressable>
          <Pressable onPress={saveAud} disabled={!tmpAud.nombre} style={[s.sheetConfirmBtn, { opacity: !tmpAud.nombre ? 0.4 : 1 }]}>
            <Text style={{ fontSize: 12.5, fontWeight: '600', color: isDark ? '#1c1917' : '#fafaf9' }}>Guardar</Text>
          </Pressable>
        </View>
      </BottomSheet>

      {/* ─── BOTTOM SHEET: DICTAMEN ── */}
      <BottomSheet show={dictPanel} title={editingDict ? 'Editar dictamen' : 'Nuevo dictamen'} onClose={() => { setDictPanel(false); setEditingDict(null) }}>
        <Field label="Folio *" value={tmpDict.folio} onChange={v => setTmpDict(p => ({...p, folio:v}))} placeholder="DIC-2026-0089" required />
        <Field label="Título / Descripción" value={tmpDict.titulo} onChange={v => setTmpDict(p => ({...p, titulo:v}))} placeholder="Dictamen de Habilitación..." multiline />
        <Field label="Tipo de dictamen" value={tmpDict.tipo} onChange={v => setTmpDict(p => ({...p, tipo:v}))} placeholder="Habilitación, Suspensión..." />
        <Field label="Fecha" value={tmpDict.fecha} onChange={v => setTmpDict(p => ({...p, fecha:v}))} placeholder="2026-02-07" />
        <PickerRow<'favorable'|'observaciones'|'desfavorable'>
          label="Estado" options={['favorable','observaciones','desfavorable']} value={tmpDict.estado}
          onChange={v => setTmpDict(p => ({...p, estado:v}))}
          labelMap={{ favorable:'Favorable', observaciones:'Observaciones', desfavorable:'Desfavorable' }}
        />
        <View style={s.sheetActions}>
          <Pressable onPress={() => { setDictPanel(false); setEditingDict(null) }} style={[s.sheetCancelBtn, { borderColor: t.border }]}>
            <Text style={{ fontSize: 12.5, fontWeight: '500', color: t.muted }}>Cancelar</Text>
          </Pressable>
          <Pressable onPress={saveDict} disabled={!tmpDict.folio} style={[s.sheetConfirmBtn, { opacity: !tmpDict.folio ? 0.4 : 1 }]}>
            <Text style={{ fontSize: 12.5, fontWeight: '600', color: isDark ? '#1c1917' : '#fafaf9' }}>Guardar</Text>
          </Pressable>
        </View>
      </BottomSheet>

      {/* ─── BOTTOM SHEET: NORMATIVA ── */}
      <BottomSheet show={normPanel} title={editingNorm ? 'Editar normativa' : 'Nueva normativa'} onClose={() => { setNormPanel(false); setEditingNorm(null) }}>
        <Field label="Clave / Identificador *" value={tmpNorm.clave} onChange={v => setTmpNorm(p => ({...p, clave:v}))} placeholder="NOM-033-SAG/ZOO" required />
        <Field label="Descripción" value={tmpNorm.desc} onChange={v => setTmpNorm(p => ({...p, desc:v}))} placeholder="Sacrificio humanitario de animales..." multiline />
        <View style={s.sheetActions}>
          <Pressable onPress={() => { setNormPanel(false); setEditingNorm(null) }} style={[s.sheetCancelBtn, { borderColor: t.border }]}>
            <Text style={{ fontSize: 12.5, fontWeight: '500', color: t.muted }}>Cancelar</Text>
          </Pressable>
          <Pressable onPress={saveNorm} disabled={!tmpNorm.clave} style={[s.sheetConfirmBtn, { opacity: !tmpNorm.clave ? 0.4 : 1 }]}>
            <Text style={{ fontSize: 12.5, fontWeight: '600', color: isDark ? '#1c1917' : '#fafaf9' }}>Guardar</Text>
          </Pressable>
        </View>
      </BottomSheet>

      {/* ─── BOTTOM SHEET: ACREDITACIÓN ── */}
      <BottomSheet show={acredPanel} title={editingAcred ? 'Editar acreditación' : 'Nueva acreditación'} onClose={() => { setAcredPanel(false); setEditingAcred(null) }}>
        <Field label="Nombre *" value={tmpAcred.nombre} onChange={v => setTmpAcred(p => ({...p, nombre:v}))} placeholder="SENASICA — Auditora Oficial" required />
        <Field label="Fecha de vencimiento" value={tmpAcred.vence} onChange={v => setTmpAcred(p => ({...p, vence:v}))} placeholder="Jun 2027 o Permanente" />
        <PickerRow<'vigente'|'por-vencer'|'vencido'>
          label="Estado" options={['vigente','por-vencer','vencido']} value={tmpAcred.estado}
          onChange={v => setTmpAcred(p => ({...p, estado:v}))}
          labelMap={{ vigente:'Vigente', 'por-vencer':'Por vencer', vencido:'Vencido' }}
        />
        <View style={s.sheetActions}>
          <Pressable onPress={() => { setAcredPanel(false); setEditingAcred(null) }} style={[s.sheetCancelBtn, { borderColor: t.border }]}>
            <Text style={{ fontSize: 12.5, fontWeight: '500', color: t.muted }}>Cancelar</Text>
          </Pressable>
          <Pressable onPress={saveAcred} disabled={!tmpAcred.nombre} style={[s.sheetConfirmBtn, { opacity: !tmpAcred.nombre ? 0.4 : 1 }]}>
            <Text style={{ fontSize: 12.5, fontWeight: '600', color: isDark ? '#1c1917' : '#fafaf9' }}>Guardar</Text>
          </Pressable>
        </View>
      </BottomSheet>

      {/* ─── CONFIRM ── */}
      <ConfirmDialog
        show={confirm.show}
        title={confirm.title}
        message={confirm.message}
        onConfirm={() => { confirm.onOk(); setConfirm(c => ({ ...c, show: false })) }}
        onCancel={() => setConfirm(c => ({ ...c, show: false }))}
      />

      {/* ─── TOAST ── */}
      <Toast show={showToast} />

    </View>
  )
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:   { flex: 1 },

  header:    { borderBottomWidth: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingBottom: 10, minHeight: 54 },
  iconBtn:   { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },

  saveBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12,
    backgroundColor: BRAND,
  },
  saveBtnText: { fontSize: 12.5, fontWeight: '600', color: '#fff' },

  card: { borderWidth: 1, borderRadius: 18, overflow: 'hidden' },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    borderBottomWidth: 1,
  },
  sectionIconWrap: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: 13, fontWeight: '600' },

  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 13, fontSize: 13 },

  row2: { flexDirection: 'row', gap: 10 },
  row3: { flexDirection: 'row', gap: 8 },

  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 11, borderRadius: 12,
    borderWidth: 1, borderStyle: 'dashed',
  },

  rowIconBtn: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },

  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  sheetHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1,
  },
  closeBtn: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },

  sheetActions: { flexDirection: 'row', gap: 10, marginTop: 6 },
  sheetCancelBtn: { flex: 1, height: 42, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  sheetConfirmBtn: { flex: 1, height: 42, borderRadius: 12, backgroundColor: BRAND, alignItems: 'center', justifyContent: 'center' },

  statusOpt: { flex: 1, paddingVertical: 9, borderRadius: 10, borderWidth: 1, alignItems: 'center', minWidth: 80 },

  dialog: { marginHorizontal: 28, borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 20, elevation: 10 },
  dialogActions: { flexDirection: 'row', borderTopWidth: 1 },
  dialogBtn: { flex: 1, paddingVertical: 14, alignItems: 'center' },

  toast: {
    position: 'absolute', bottom: 32, alignSelf: 'center',
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 18, paddingVertical: 12, borderRadius: 18,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 16, elevation: 8,
  },
})