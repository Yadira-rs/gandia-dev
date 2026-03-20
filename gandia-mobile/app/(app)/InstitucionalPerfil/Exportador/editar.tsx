/**
 * GANDIA — Editar Perfil Exportador (React Native)
 * app/(app)/InstitucionalPerfil/Exportador/editar.tsx
 *
 * Formulario de edición del perfil exportador.
 * TODO: conectar Supabase para cargar y guardar datos.
 * TODO: invalidatePerfilExportadorCache() tras guardar con éxito.
 */

import React, { useState, useRef } from 'react'
import {
  View, Text, ScrollView, TextInput, Pressable, TouchableOpacity,
  StyleSheet, useColorScheme, Modal, Animated,
  ActivityIndicator, KeyboardAvoidingView, Platform, Switch,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import Svg, { Path, Polyline, Line, Rect, Circle } from 'react-native-svg'

// ─── TOKENS ──────────────────────────────────────────────────────────────────
const BRAND      = '#b45309'
const BRAND_DARK = '#92400e'

const C = {
  dark: {
    bg:          '#0c0a09',
    surface:     '#141210',
    input:       '#1a1816',
    border:      'rgba(255,255,255,0.09)',
    borderFocus: 'rgba(180,83,9,0.6)',
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
    borderFocus: 'rgba(180,83,9,0.55)',
    text:        '#1c1917',
    muted:       '#78716c',
    sub:         'rgba(0,0,0,0.38)',
    dim:         'rgba(0,0,0,0.06)',
  },
}

// ─── TYPES ───────────────────────────────────────────────────────────────────
type UserRole = 'director_general' | 'dir_operaciones' | 'dir_comercial' | 'dir_sanidad' | 'auditor_inspector'

interface Perm {
  basicInfo: boolean; operaciones: boolean; kpis: boolean; certificaciones: boolean
  equipo: boolean; proveedores: boolean; cruces: boolean; contacto: boolean
}

const PERMS: Record<UserRole, Perm> = {
  director_general: { basicInfo:true,  operaciones:true,  kpis:true,  certificaciones:true,  equipo:true,  proveedores:true,  cruces:true,  contacto:true  },
  dir_operaciones:  { basicInfo:false, operaciones:true,  kpis:true,  certificaciones:true,  equipo:false, proveedores:true,  cruces:true,  contacto:false },
  dir_comercial:    { basicInfo:false, operaciones:true,  kpis:false, certificaciones:false, equipo:false, proveedores:true,  cruces:false, contacto:true  },
  dir_sanidad:      { basicInfo:false, operaciones:false, kpis:true,  certificaciones:true,  equipo:false, proveedores:false, cruces:false, contacto:false },
  auditor_inspector:{ basicInfo:false, operaciones:false, kpis:true,  certificaciones:true,  equipo:false, proveedores:false, cruces:false, contacto:false },
}

const ROLE_LABELS: Record<UserRole, string> = {
  director_general:  'Director General',
  dir_operaciones:   'Director de Operaciones',
  dir_comercial:     'Director Comercial',
  dir_sanidad:       'Director de Sanidad Animal',
  auditor_inspector: 'Auditor / Inspector',
}

interface DirectivoItem { id:string; nombre:string; cargo:string; email:string; telefono:string }
interface ProveedorItem  { id:string; nombre:string; estado:string; cabezas:string; clase:'A'|'B' }
interface CruceItem      { id:string; ciudad:string; destino:string; activo:boolean }
interface CertItem       { id:string; nombre:string; numero:string; vencimiento:string; estado:'vigente'|'por-vencer'|'vencido' }
interface OperacionItem  { id:string; destino:string; bandera:string; cabezas:string; porcentaje:string; estado:string }

interface Form {
  razonSocial:string; naturaleza:string; ubicacion:string; fundacion:string
  rfc:string; licenciaUSDA:string; descripcion:string; empleados:string
  rastrosTIF:string; corralesConcentracion:string
  telefono:string; email:string; sitioWeb:string; horario:string
  cabezasAnio:string; paisesDestino:string; valorExportado:string
  tasaRechazo:string; cabezasEmbarque:string; cumplimientoDoc:string
}

const EMPTY_FORM: Form = {
  razonSocial:'', naturaleza:'', ubicacion:'', fundacion:'',
  rfc:'', licenciaUSDA:'', descripcion:'', empleados:'',
  rastrosTIF:'', corralesConcentracion:'',
  telefono:'', email:'', sitioWeb:'', horario:'',
  cabezasAnio:'', paisesDestino:'', valorExportado:'',
  tasaRechazo:'', cabezasEmbarque:'', cumplimientoDoc:'',
}

// ─── ICONS ───────────────────────────────────────────────────────────────────
const SP = { strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
const IArrow  = ({ c='#a8a29e', z=14 }) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Line x1="19" y1="12" x2="5" y2="12" stroke={c} strokeWidth={1.65} {...SP}/><Polyline points="12 19 5 12 12 5" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const ISave   = ({ c='#fff',    z=14 }) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" stroke={c} strokeWidth={1.65} {...SP}/><Polyline points="17 21 17 13 7 13 7 21" stroke={c} strokeWidth={1.65} {...SP}/><Polyline points="7 3 7 8 15 8" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const ISpark  = ({ c=BRAND,     z=11 }) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const ILock   = ({ c='#a8a29e', z=11 }) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Rect x="3" y="11" width="18" height="11" rx="2" stroke={c} strokeWidth={1.65} {...SP}/><Path d="M7 11V7a5 5 0 0 1 10 0v4" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const IClose  = ({ c='#a8a29e', z=14 }) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Line x1="18" y1="6" x2="6" y2="18" stroke={c} strokeWidth={1.65} {...SP}/><Line x1="6" y1="6" x2="18" y2="18" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const IPlus   = ({ c=BRAND,     z=14 }) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Line x1="12" y1="5" x2="12" y2="19" stroke={c} strokeWidth={1.65} {...SP}/><Line x1="5" y1="12" x2="19" y2="12" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const IEdit   = ({ c='#a8a29e', z=13 }) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke={c} strokeWidth={1.65} {...SP}/><Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const ITrash  = ({ c='#a8a29e', z=13 }) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Polyline points="3 6 5 6 21 6" stroke={c} strokeWidth={1.65} {...SP}/><Path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const ICheck  = ({ c='#fff',    z=11 }) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Polyline points="20 6 9 17 4 12" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const IInfo   = ({ c=BRAND,     z=16 }) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Circle cx="12" cy="12" r="10" stroke={c} strokeWidth={1.65} {...SP}/><Line x1="12" y1="8" x2="12" y2="12" stroke={c} strokeWidth={1.65} {...SP}/><Line x1="12" y1="16" x2="12.01" y2="16" stroke={c} strokeWidth={2} {...SP}/></Svg>

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
  label, value, onChange, placeholder, multiline = false, keyboardType = 'default', required = false,
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string
  multiline?: boolean; keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad' | 'decimal-pad'
  required?: boolean
}) {
  const isDark  = useColorScheme() === 'dark'
  const t       = isDark ? C.dark : C.light
  const [focus, setFocus] = useState(false)
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ fontSize: 11, fontWeight: '600', color: t.muted, marginBottom: 7, letterSpacing: 0.3 }}>
        {label}{required ? <Text style={{ color: '#ef4444' }}> *</Text> : null}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.25)'}
        multiline={multiline}
        keyboardType={keyboardType}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        style={{
          backgroundColor: t.input,
          borderWidth: 1.5,
          borderColor: focus ? t.borderFocus : t.border,
          borderRadius: 12,
          paddingHorizontal: 14,
          paddingVertical: 11,
          fontSize: 14,
          color: t.text,
          minHeight: multiline ? 88 : undefined,
          textAlignVertical: multiline ? 'top' : 'center',
        }}
      />
    </View>
  )
}

function Section({
  title, locked = false, children,
}: {
  title: string; locked?: boolean; children: React.ReactNode
}) {
  const isDark = useColorScheme() === 'dark'
  const t = isDark ? C.dark : C.light
  return (
    <View style={{
      backgroundColor: t.surface, borderWidth: 1, borderColor: t.border,
      borderRadius: 18, padding: 18, marginBottom: 16,
      opacity: locked ? 0.55 : 1,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 18 }}>
        {locked && <ILock c={t.muted} z={13} />}
        <Text style={{ fontSize: 14, fontWeight: '600', color: t.text, flex: 1 }}>{title}</Text>
        {locked && <Text style={{ fontSize: 10.5, color: t.muted }}>Sin permisos</Text>}
      </View>
      <View pointerEvents={locked ? 'none' : 'auto'}>
        {children}
      </View>
    </View>
  )
}

function ItemRow({
  label, sublabel, badge, onEdit, onDelete,
}: {
  label: string; sublabel?: string; badge?: { text: string; color: string; bg: string }
  onEdit: () => void; onDelete: () => void
}) {
  const isDark = useColorScheme() === 'dark'
  const t = isDark ? C.dark : C.light
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', gap: 10,
      padding: 12, borderRadius: 12, marginBottom: 8,
      backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#f7f5f3',
    }}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontSize: 13, fontWeight: '500', color: t.text }} numberOfLines={1}>{label}</Text>
        {!!sublabel && <Text style={{ fontSize: 11, color: t.muted, marginTop: 2 }} numberOfLines={1}>{sublabel}</Text>}
      </View>
      {badge && (
        <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99, backgroundColor: badge.bg }}>
          <Text style={{ fontSize: 10, fontWeight: '600', color: badge.color }}>{badge.text}</Text>
        </View>
      )}
      <TouchableOpacity onPress={onEdit} style={{ width: 30, height: 30, borderRadius: 8, borderWidth: 1, borderColor: t.border, alignItems: 'center', justifyContent: 'center' }}>
        <IEdit c={t.muted} z={12} />
      </TouchableOpacity>
      <TouchableOpacity onPress={onDelete} style={{ width: 30, height: 30, borderRadius: 8, borderWidth: 1, borderColor: t.border, alignItems: 'center', justifyContent: 'center' }}>
        <ITrash c="#ef4444" z={12} />
      </TouchableOpacity>
    </View>
  )
}

function AddButton({ label, onPress }: { label: string; onPress: () => void }) {
  const isDark = useColorScheme() === 'dark'
  const t = isDark ? C.dark : C.light
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, borderStyle: 'dashed', borderColor: isDark ? 'rgba(180,83,9,0.35)' : 'rgba(180,83,9,0.3)' }}>
      <IPlus c={BRAND} z={14} />
      <Text style={{ fontSize: 13, fontWeight: '500', color: BRAND }}>{label}</Text>
    </TouchableOpacity>
  )
}

function PickerRow<T extends string>({
  label, value, options, onChange,
}: {
  label: string; value: T; options: { label: string; value: T }[]; onChange: (v: T) => void
}) {
  const isDark = useColorScheme() === 'dark'
  const t = isDark ? C.dark : C.light
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ fontSize: 11, fontWeight: '600', color: t.muted, marginBottom: 7, letterSpacing: 0.3 }}>{label}</Text>
      <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
        {options.map(opt => {
          const active = value === opt.value
          return (
            <TouchableOpacity
              key={opt.value}
              onPress={() => onChange(opt.value)}
              style={{
                paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10,
                backgroundColor: active ? BRAND : (isDark ? 'rgba(255,255,255,0.06)' : '#f0ede9'),
                borderWidth: 1.5,
                borderColor: active ? BRAND : t.border,
              }}>
              <Text style={{ fontSize: 12.5, fontWeight: active ? '600' : '400', color: active ? '#fff' : t.muted }}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )
}

// ─── BOTTOM SHEET ─────────────────────────────────────────────────────────────

function BottomSheet({ visible, title, onClose, onSave, children }: {
  visible: boolean; title: string; onClose: () => void; onSave: () => void; children: React.ReactNode
}) {
  const isDark = useColorScheme() === 'dark'
  const t = isDark ? C.dark : C.light
  const anim = useRef(new Animated.Value(600)).current

  React.useEffect(() => {
    Animated.spring(anim, {
      toValue: visible ? 0 : 600,
      useNativeDriver: true,
      damping: 22, stiffness: 180,
    }).start()
  }, [visible])

  if (!visible) return null
  return (
    <Modal transparent animationType="none" statusBarTranslucent>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View style={{ transform: [{ translateY: anim }], backgroundColor: t.surface, borderTopLeftRadius: 26, borderTopRightRadius: 26, maxHeight: '85%' }}>
          {/* Handle */}
          <View style={{ alignItems: 'center', paddingTop: 12 }}>
            <View style={{ width: 36, height: 3, borderRadius: 2, backgroundColor: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.10)' }} />
          </View>
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: t.text }}>{title}</Text>
            <TouchableOpacity onPress={onClose}><IClose c={t.muted} z={16} /></TouchableOpacity>
          </View>
          {/* Content */}
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView style={{ paddingHorizontal: 20 }} showsVerticalScrollIndicator={false}>
              {children}
              <View style={{ height: 20 }} />
            </ScrollView>
          </KeyboardAvoidingView>
          {/* Save btn */}
          <View style={{ paddingHorizontal: 20, paddingVertical: 16, borderTopWidth: 1, borderTopColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)' }}>
            <TouchableOpacity
              onPress={onSave}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14, backgroundColor: BRAND }}>
              <ISave c="#fff" z={14} />
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>Guardar</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  )
}

// ─── CONFIRM DIALOG ───────────────────────────────────────────────────────────

function ConfirmDialog({ visible, message, onConfirm, onCancel }: {
  visible: boolean; message: string; onConfirm: () => void; onCancel: () => void
}) {
  const isDark = useColorScheme() === 'dark'
  const t = isDark ? C.dark : C.light
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 32 }}>
        <View style={{ backgroundColor: t.surface, borderRadius: 22, padding: 24, width: '100%' }}>
          <Text style={{ fontSize: 15, fontWeight: '600', color: t.text, marginBottom: 8 }}>¿Confirmar acción?</Text>
          <Text style={{ fontSize: 13.5, color: t.muted, marginBottom: 22, lineHeight: 20 }}>{message}</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity onPress={onCancel} style={{ flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.10)', alignItems: 'center' }}>
              <Text style={{ fontSize: 14, fontWeight: '500', color: t.muted }}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onConfirm} style={{ flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: '#ef4444', alignItems: 'center' }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>Confirmar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

// ─── TOAST ────────────────────────────────────────────────────────────────────

function Toast({ visible }: { visible: boolean }) {
  const anim = useRef(new Animated.Value(0)).current
  React.useEffect(() => {
    Animated.spring(anim, { toValue: visible ? 1 : 0, useNativeDriver: true, damping: 18 }).start()
  }, [visible])
  return (
    <Animated.View style={{
      position: 'absolute', bottom: 40, alignSelf: 'center',
      flexDirection: 'row', alignItems: 'center', gap: 10,
      paddingHorizontal: 20, paddingVertical: 12,
      backgroundColor: '#1c1917', borderRadius: 99,
      opacity: anim, transform: [{ scale: anim }],
      shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 8,
    }}>
      <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#16a34a', alignItems: 'center', justifyContent: 'center' }}>
        <ICheck c="#fff" z={11} />
      </View>
      <Text style={{ fontSize: 13.5, fontWeight: '500', color: '#fafaf9' }}>Perfil guardado correctamente</Text>
    </Animated.View>
  )
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

export default function PerfilExportadorEdit() {
  const router  = useRouter()
  const isDark  = useColorScheme() === 'dark'
  const insets  = useSafeAreaInsets()
  const t       = isDark ? C.dark : C.light

  // Role — TODO: leer de UserContext
  const [role] = useState<UserRole>('director_general')
  const perm   = PERMS[role]

  // Form
  const [form, setForm] = useState<Form>(EMPTY_FORM)
  const set = (k: keyof Form) => (v: string) => setForm(prev => ({ ...prev, [k]: v }))

  // Lists
  const [operaciones,    setOperaciones]    = useState<OperacionItem[]>([])
  const [certificaciones, setCertificaciones] = useState<CertItem[]>([])
  const [equipo,         setEquipo]         = useState<DirectivoItem[]>([])
  const [proveedores,    setProveedores]    = useState<ProveedorItem[]>([])
  const [cruces,         setCruces]         = useState<CruceItem[]>([])

  // Save / UI state
  const [saving,      setSaving]      = useState(false)
  const [showToast,   setShowToast]   = useState(false)
  const [confirmData, setConfirmData] = useState<{ msg: string; onConfirm: () => void } | null>(null)

  // ── BottomSheet state ──────────────────────────────────────────────────────

  // Operacion
  const [sheetOp,  setSheetOp]  = useState(false)
  const [editOp,   setEditOp]   = useState<OperacionItem>({ id:'', destino:'', bandera:'', cabezas:'', porcentaje:'', estado:'Activo' })

  // Cert
  const [sheetCert,  setSheetCert]  = useState(false)
  const [editCert,   setEditCert]   = useState<CertItem>({ id:'', nombre:'', numero:'', vencimiento:'', estado:'vigente' })

  // Directivo
  const [sheetDir,   setSheetDir]   = useState(false)
  const [editDir,    setEditDir]    = useState<DirectivoItem>({ id:'', nombre:'', cargo:'', email:'', telefono:'' })

  // Proveedor
  const [sheetProv,  setSheetProv]  = useState(false)
  const [editProv,   setEditProv]   = useState<ProveedorItem>({ id:'', nombre:'', estado:'', cabezas:'', clase:'A' })

  // Cruce
  const [sheetCruce, setSheetCruce] = useState(false)
  const [editCruce,  setEditCruce]  = useState<CruceItem>({ id:'', ciudad:'', destino:'', activo:true })

  // ── Generic list helpers ───────────────────────────────────────────────────
  function saveItem<T extends { id: string }>(list: T[], setList: (l: T[]) => void, item: T) {
    setList(list.find(x => x.id === item.id) ? list.map(x => x.id === item.id ? item : x) : [...list, item])
  }
  function deleteItem<T extends { id: string }>(list: T[], setList: (l: T[]) => void, id: string) {
    setConfirmData({ msg: '¿Eliminar este elemento?', onConfirm: () => { setList(list.filter(x => x.id !== id)); setConfirmData(null) } })
  }
  const newId = () => Date.now().toString()

  // ── handleSave ─────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true)
    try {
      // TODO: conectar Supabase
      // const { data: { session } } = await supabase.auth.getSession()
      // const uid = session?.user?.id
      // if (!uid) throw new Error('Sin sesión')
      // const { error } = await supabase.from('exportador_extended_profiles').upsert({
      //   user_id:                uid,
      //   razon_social:           form.razonSocial           || null,
      //   naturaleza:             form.naturaleza            || null,
      //   ubicacion:              form.ubicacion             || null,
      //   fundacion:              form.fundacion             ? parseInt(form.fundacion)             : null,
      //   rfc:                    form.rfc                   || null,
      //   licencia_usda:          form.licenciaUSDA          || null,
      //   descripcion:            form.descripcion           || null,
      //   empleados:              form.empleados             ? parseInt(form.empleados)             : null,
      //   rastros_tif:            form.rastrosTIF            ? parseInt(form.rastrosTIF)            : null,
      //   corrales_concentracion: form.corralesConcentracion ? parseInt(form.corralesConcentracion) : null,
      //   telefono:               form.telefono              || null,
      //   email_contact:          form.email                 || null,
      //   sitio_web:              form.sitioWeb              || null,
      //   horario:                form.horario               || null,
      //   cabezas_anio:           form.cabezasAnio           ? parseInt(form.cabezasAnio)           : null,
      //   paises_destino:         form.paisesDestino         ? parseInt(form.paisesDestino)         : null,
      //   valor_exportado:        form.valorExportado        ? parseFloat(form.valorExportado)      : null,
      //   tasa_rechazo:           form.tasaRechazo           ? parseFloat(form.tasaRechazo)         : null,
      //   cabezas_embarque:       form.cabezasEmbarque       ? parseInt(form.cabezasEmbarque)       : null,
      //   cumplimiento_doc:       form.cumplimientoDoc       ? parseFloat(form.cumplimientoDoc)     : null,
      //   operaciones, certificaciones, equipo, proveedores, cruces,
      //   updated_at: new Date().toISOString(),
      // }, { onConflict: 'user_id' })
      // if (error) throw error
      // invalidatePerfilExportadorCache()   // TODO: import desde perfilExportadorCache.ts

      await new Promise(r => setTimeout(r, 700)) // remove when wiring Supabase
      setShowToast(true)
      setTimeout(() => { setShowToast(false); router.back() }, 2200)
    } catch (e) {
      console.error('PerfilExportadorEdit save error:', e)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setConfirmData({ msg: '¿Descartar los cambios?', onConfirm: () => { setConfirmData(null); router.back() } })
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <View style={[s.root, { backgroundColor: t.bg }]}>

      {/* ── Sticky header ── */}
      <View style={[s.header, { paddingTop: insets.top + 12, backgroundColor: isDark ? 'rgba(20,18,16,0.94)' : 'rgba(250,250,249,0.94)', borderBottomColor: t.border }]}>
        <TouchableOpacity onPress={handleCancel} style={[s.backBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : '#f0ede9' }]}>
          <IArrow c={t.muted} z={14} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginHorizontal: 12 }}>
          <Text style={[s.headerTitle, { color: t.text }]}>Editar perfil exportador</Text>
          <Text style={{ fontSize: 11, color: BRAND, fontWeight: '500' }}>{ROLE_LABELS[role]}</Text>
        </View>
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          style={[s.saveBtn, { backgroundColor: saving ? BRAND_DARK : BRAND, opacity: saving ? 0.7 : 1 }]}>
          {saving
            ? <ActivityIndicator size="small" color="#fff" />
            : <><ISave c="#fff" z={14} /><Text style={s.saveBtnText}>Guardar</Text></>
          }
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingTop: 12, paddingBottom: insets.bottom + 90 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >

        {/* ── 1. Información empresarial ── */}
        <Section title="Información empresarial" locked={!perm.basicInfo}>
          <SectionLabel text="Datos de la empresa" />
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 2 }}><Field label="Razón Social" value={form.razonSocial} onChange={set('razonSocial')} placeholder="Exportadora Ganadera del Norte S.A. de C.V." required /></View>
            <View style={{ flex: 1 }}><Field label="Naturaleza" value={form.naturaleza} onChange={set('naturaleza')} placeholder="S.A. de C.V." /></View>
          </View>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}><Field label="Ubicación" value={form.ubicacion} onChange={set('ubicacion')} placeholder="Chihuahua, México" required /></View>
            <View style={{ flex: 1 }}><Field label="Fundación" value={form.fundacion} onChange={set('fundacion')} placeholder="2003" keyboardType="numeric" /></View>
          </View>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}><Field label="RFC" value={form.rfc} onChange={set('rfc')} placeholder="EGN030822HJ5" /></View>
            <View style={{ flex: 1 }}><Field label="Licencia USDA" value={form.licenciaUSDA} onChange={set('licenciaUSDA')} placeholder="MX-00451" /></View>
          </View>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}><Field label="Empleados" value={form.empleados} onChange={set('empleados')} placeholder="87" keyboardType="numeric" /></View>
            <View style={{ flex: 1 }}><Field label="Rastros TIF" value={form.rastrosTIF} onChange={set('rastrosTIF')} placeholder="3" keyboardType="numeric" /></View>
            <View style={{ flex: 1 }}><Field label="Corrales" value={form.corralesConcentracion} onChange={set('corralesConcentracion')} placeholder="5" keyboardType="numeric" /></View>
          </View>
          <Field label="Descripción" value={form.descripcion} onChange={set('descripcion')} placeholder="Descripción de las operaciones de la empresa..." multiline />
        </Section>

        {/* ── 2. Destinos de exportación ── */}
        <Section title="Destinos de exportación" locked={!perm.operaciones}>
          <SectionLabel text="Destinos activos" />
          {operaciones.map(op => (
            <ItemRow
              key={op.id}
              label={`${op.bandera} ${op.destino}`}
              sublabel={`${op.cabezas} cab/año · ${op.porcentaje}% del volumen · ${op.estado}`}
              onEdit={() => { setEditOp(op); setSheetOp(true) }}
              onDelete={() => deleteItem(operaciones, setOperaciones, op.id)}
            />
          ))}
          <AddButton label="Agregar destino" onPress={() => { setEditOp({ id: newId(), destino:'', bandera:'', cabezas:'', porcentaje:'', estado:'Activo' }); setSheetOp(true) }} />
          <View style={{ height: 14 }} />
          <SectionLabel text="Métricas globales" />
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}><Field label="Cabezas / Año" value={form.cabezasAnio} onChange={set('cabezasAnio')} placeholder="48500" keyboardType="numeric" /></View>
            <View style={{ flex: 1 }}><Field label="Países destino" value={form.paisesDestino} onChange={set('paisesDestino')} placeholder="3" keyboardType="numeric" /></View>
            <View style={{ flex: 1 }}><Field label="Valor (M USD)" value={form.valorExportado} onChange={set('valorExportado')} placeholder="2.1" keyboardType="decimal-pad" /></View>
          </View>
        </Section>

        {/* ── 3. Indicadores operativos ── */}
        <Section title="Indicadores operativos" locked={!perm.kpis}>
          <SectionLabel text="KPIs de exportación" />
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}><Field label="Tasa rechazo (%)" value={form.tasaRechazo} onChange={set('tasaRechazo')} placeholder="0.4" keyboardType="decimal-pad" /></View>
            <View style={{ flex: 1 }}><Field label="Cab. / embarque" value={form.cabezasEmbarque} onChange={set('cabezasEmbarque')} placeholder="912" keyboardType="numeric" /></View>
            <View style={{ flex: 1 }}><Field label="Cumplim. doc. (%)" value={form.cumplimientoDoc} onChange={set('cumplimientoDoc')} placeholder="98.7" keyboardType="decimal-pad" /></View>
          </View>
        </Section>

        {/* ── 4. Certificaciones ── */}
        <Section title="Certificaciones y cumplimiento" locked={!perm.certificaciones}>
          <SectionLabel text="Certificados vigentes" />
          {certificaciones.map(c => {
            const cfg = { vigente: { bg:'rgba(34,197,94,0.12)', color:'#16a34a', label:'Vigente' }, 'por-vencer': { bg:`${BRAND}15`, color:BRAND, label:'Por vencer' }, vencido: { bg:'rgba(239,68,68,0.12)', color:'#ef4444', label:'Vencido' } }[c.estado]
            return (
              <ItemRow
                key={c.id}
                label={c.nombre}
                sublabel={`${c.numero} · Vence: ${c.vencimiento}`}
                badge={{ text: cfg.label, color: cfg.color, bg: cfg.bg }}
                onEdit={() => { setEditCert(c); setSheetCert(true) }}
                onDelete={() => deleteItem(certificaciones, setCertificaciones, c.id)}
              />
            )
          })}
          <AddButton label="Agregar certificación" onPress={() => { setEditCert({ id:newId(), nombre:'', numero:'', vencimiento:'', estado:'vigente' }); setSheetCert(true) }} />
        </Section>

        {/* ── 5. Equipo directivo ── */}
        <Section title="Equipo directivo" locked={!perm.equipo}>
          <SectionLabel text="Directivos" />
          {equipo.map(d => (
            <ItemRow
              key={d.id}
              label={d.nombre}
              sublabel={`${d.cargo}${d.email ? ` · ${d.email}` : ''}`}
              onEdit={() => { setEditDir(d); setSheetDir(true) }}
              onDelete={() => deleteItem(equipo, setEquipo, d.id)}
            />
          ))}
          <AddButton label="Agregar directivo" onPress={() => { setEditDir({ id:newId(), nombre:'', cargo:'', email:'', telefono:'' }); setSheetDir(true) }} />
        </Section>

        {/* ── 6. Proveedores ── */}
        <Section title="Proveedores ganaderos" locked={!perm.proveedores}>
          <SectionLabel text="Proveedores activos" />
          {proveedores.map(p => (
            <ItemRow
              key={p.id}
              label={p.nombre}
              sublabel={`${p.estado} · ${p.cabezas} cab.`}
              badge={{ text: `Clase ${p.clase}`, color: p.clase === 'A' ? '#16a34a' : BRAND, bg: p.clase === 'A' ? 'rgba(34,197,94,0.12)' : `${BRAND}15` }}
              onEdit={() => { setEditProv(p); setSheetProv(true) }}
              onDelete={() => deleteItem(proveedores, setProveedores, p.id)}
            />
          ))}
          <AddButton label="Agregar proveedor" onPress={() => { setEditProv({ id:newId(), nombre:'', estado:'', cabezas:'', clase:'A' }); setSheetProv(true) }} />
        </Section>

        {/* ── 7. Cruces fronterizos ── */}
        <Section title="Cruces fronterizos" locked={!perm.cruces}>
          <SectionLabel text="Puntos de cruce" />
          {cruces.map(c => (
            <ItemRow
              key={c.id}
              label={c.ciudad}
              sublabel={`→ ${c.destino} · ${c.activo ? 'Activo' : 'Inactivo'}`}
              badge={c.activo ? { text: 'Activo', color: '#16a34a', bg: 'rgba(34,197,94,0.12)' } : undefined}
              onEdit={() => { setEditCruce(c); setSheetCruce(true) }}
              onDelete={() => deleteItem(cruces, setCruces, c.id)}
            />
          ))}
          <AddButton label="Agregar cruce fronterizo" onPress={() => { setEditCruce({ id:newId(), ciudad:'', destino:'', activo:true }); setSheetCruce(true) }} />
        </Section>

        {/* ── 8. Contacto ── */}
        <Section title="Contacto empresarial" locked={!perm.contacto}>
          <SectionLabel text="Datos de contacto" />
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}><Field label="Teléfono" value={form.telefono} onChange={set('telefono')} placeholder="+52 614 430 8800" keyboardType="phone-pad" /></View>
            <View style={{ flex: 1 }}><Field label="Email comercial" value={form.email} onChange={set('email')} placeholder="ventas@empresa.mx" keyboardType="email-address" /></View>
          </View>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}><Field label="Sitio Web" value={form.sitioWeb} onChange={set('sitioWeb')} placeholder="www.empresa.mx" /></View>
            <View style={{ flex: 1 }}><Field label="Horario" value={form.horario} onChange={set('horario')} placeholder="Lun–Vie: 7:00–17:00" /></View>
          </View>
        </Section>

        {/* ── Banner permisos ── */}
        <View style={{ padding: 16, borderRadius: 16, backgroundColor: isDark ? `${BRAND}12` : '#fef3c7', borderWidth: 1, borderColor: isDark ? `${BRAND}25` : '#fde68a', flexDirection: 'row', gap: 12, marginBottom: 8 }}>
          <IInfo c={BRAND} z={16} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12.5, fontWeight: '600', color: BRAND_DARK, marginBottom: 4 }}>Permisos de edición</Text>
            <Text style={{ fontSize: 12, color: isDark ? '#fcd34d' : BRAND_DARK, lineHeight: 18 }}>
              Como <Text style={{ fontWeight: '700' }}>{ROLE_LABELS[role]}</Text> puedes editar:{' '}
              {Object.entries(perm).filter(([, v]) => v).map(([k]) => ({
                basicInfo: 'Información empresarial', operaciones: 'Destinos', kpis: 'Indicadores',
                certificaciones: 'Certificaciones', equipo: 'Equipo', proveedores: 'Proveedores',
                cruces: 'Cruces', contacto: 'Contacto',
              }[k])).filter(Boolean).join(', ')}.
            </Text>
          </View>
        </View>

      </ScrollView>

      {/* ══════════════ BOTTOM SHEETS ══════════════ */}

      {/* Operación */}
      <BottomSheet visible={sheetOp} title={editOp.destino ? 'Editar destino' : 'Nuevo destino'} onClose={() => setSheetOp(false)} onSave={() => { saveItem(operaciones, setOperaciones, editOp); setSheetOp(false) }}>
        <Field label="País destino" value={editOp.destino} onChange={v => setEditOp(p => ({...p, destino: v}))} placeholder="Estados Unidos" required />
        <Field label="Bandera (emoji)" value={editOp.bandera} onChange={v => setEditOp(p => ({...p, bandera: v}))} placeholder="🇺🇸" />
        <Field label="Cabezas / año" value={editOp.cabezas} onChange={v => setEditOp(p => ({...p, cabezas: v}))} placeholder="38,200" />
        <Field label="Porcentaje del volumen" value={editOp.porcentaje} onChange={v => setEditOp(p => ({...p, porcentaje: v}))} placeholder="79" keyboardType="numeric" />
        <PickerRow label="Estado" value={editOp.estado as any} options={[{ label:'Activo', value:'Activo' }, { label:'En desarrollo', value:'En Desarrollo' }, { label:'Suspendido', value:'Suspendido' }]} onChange={v => setEditOp(p => ({...p, estado: v}))} />
      </BottomSheet>

      {/* Certificación */}
      <BottomSheet visible={sheetCert} title={editCert.nombre ? 'Editar certificación' : 'Nueva certificación'} onClose={() => setSheetCert(false)} onSave={() => { saveItem(certificaciones, setCertificaciones, editCert); setSheetCert(false) }}>
        <Field label="Nombre" value={editCert.nombre} onChange={v => setEditCert(p => ({...p, nombre: v}))} placeholder="Licencia USDA / APHIS" required />
        <Field label="Número / Folio" value={editCert.numero} onChange={v => setEditCert(p => ({...p, numero: v}))} placeholder="MX-00451" />
        <Field label="Fecha de vencimiento" value={editCert.vencimiento} onChange={v => setEditCert(p => ({...p, vencimiento: v}))} placeholder="2026-12-31" />
        <PickerRow label="Estado" value={editCert.estado} options={[{ label:'Vigente', value:'vigente' }, { label:'Por vencer', value:'por-vencer' }, { label:'Vencido', value:'vencido' }]} onChange={v => setEditCert(p => ({...p, estado: v}))} />
      </BottomSheet>

      {/* Directivo */}
      <BottomSheet visible={sheetDir} title={editDir.nombre ? 'Editar directivo' : 'Nuevo directivo'} onClose={() => setSheetDir(false)} onSave={() => { saveItem(equipo, setEquipo, editDir); setSheetDir(false) }}>
        <Field label="Nombre completo" value={editDir.nombre} onChange={v => setEditDir(p => ({...p, nombre: v}))} placeholder="Carlos Javier Montes" required />
        <Field label="Cargo" value={editDir.cargo} onChange={v => setEditDir(p => ({...p, cargo: v}))} placeholder="Director General" required />
        <Field label="Email" value={editDir.email} onChange={v => setEditDir(p => ({...p, email: v}))} placeholder="director@empresa.mx" keyboardType="email-address" />
        <Field label="Teléfono" value={editDir.telefono} onChange={v => setEditDir(p => ({...p, telefono: v}))} placeholder="+52 614 111 0001" keyboardType="phone-pad" />
      </BottomSheet>

      {/* Proveedor */}
      <BottomSheet visible={sheetProv} title={editProv.nombre ? 'Editar proveedor' : 'Nuevo proveedor'} onClose={() => setSheetProv(false)} onSave={() => { saveItem(proveedores, setProveedores, editProv); setSheetProv(false) }}>
        <Field label="Nombre del rancho / empresa" value={editProv.nombre} onChange={v => setEditProv(p => ({...p, nombre: v}))} placeholder="Rancho Los Alamos" required />
        <Field label="Estado" value={editProv.estado} onChange={v => setEditProv(p => ({...p, estado: v}))} placeholder="Chihuahua" />
        <Field label="Cabezas de ganado" value={editProv.cabezas} onChange={v => setEditProv(p => ({...p, cabezas: v}))} placeholder="2,400" />
        <PickerRow label="Clasificación" value={editProv.clase} options={[{ label:'Clase A — Certificado', value:'A' }, { label:'Clase B — En proceso', value:'B' }]} onChange={v => setEditProv(p => ({...p, clase: v}))} />
      </BottomSheet>

      {/* Cruce */}
      <BottomSheet visible={sheetCruce} title={editCruce.ciudad ? 'Editar cruce' : 'Nuevo cruce fronterizo'} onClose={() => setSheetCruce(false)} onSave={() => { saveItem(cruces, setCruces, editCruce); setSheetCruce(false) }}>
        <Field label="Ciudad origen (México)" value={editCruce.ciudad} onChange={v => setEditCruce(p => ({...p, ciudad: v}))} placeholder="Cd. Juárez, Chih." required />
        <Field label="Ciudad destino (EUA)" value={editCruce.destino} onChange={v => setEditCruce(p => ({...p, destino: v}))} placeholder="El Paso, TX" />
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderRadius: 12, backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#f7f5f3', marginBottom: 14 }}>
          <Text style={{ fontSize: 13, fontWeight: '500', color: t.text }}>Cruce actualmente operativo</Text>
          <Switch
            value={editCruce.activo}
            onValueChange={v => setEditCruce(p => ({...p, activo: v}))}
            trackColor={{ false: isDark ? '#444' : '#d1d5db', true: BRAND }}
            thumbColor="#fff"
          />
        </View>
      </BottomSheet>

      {/* Confirm dialog */}
      {confirmData && (
        <ConfirmDialog
          visible
          message={confirmData.msg}
          onConfirm={confirmData.onConfirm}
          onCancel={() => setConfirmData(null)}
        />
      )}

      {/* Toast */}
      <Toast visible={showToast} />

    </View>
  )
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:        { flex: 1 },
  header:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingBottom: 14, borderBottomWidth: 1 },
  backBtn:     { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '600' },
  saveBtn:     { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 16, paddingVertical: 9, borderRadius: 12 },
  saveBtnText: { fontSize: 13.5, fontWeight: '600', color: '#fff' },
})