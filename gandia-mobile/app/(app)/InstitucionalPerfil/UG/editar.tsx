/**
 * GANDIA — PerfilUGEdit (React Native)
 * app/(app)/InstitucionalPerfil/UG/editar.tsx
 *
 * Edición de perfil de Unión Ganadera — solo frontend.
 * TODO: conectar Supabase cuando proceda.
 */

import React, { useState, useEffect, useRef } from 'react'
import {
  View, Text, ScrollView, TextInput, Pressable,
  StyleSheet, useColorScheme, Modal, Animated,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import Svg, { Path, Polyline, Line, Rect, Circle } from 'react-native-svg'

// ─── TOKENS ──────────────────────────────────────────────────────────────────
const C = {
  brand: '#2FAF8F',
  dark: {
    bg:          '#0c0a09',
    surface:     '#141210',
    input:       '#1a1816',
    border:      'rgba(255,255,255,0.09)',
    borderFocus: 'rgba(47,175,143,0.6)',
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
    borderFocus: 'rgba(47,175,143,0.55)',
    text:        '#1c1917',
    muted:       '#78716c',
    sub:         'rgba(0,0,0,0.38)',
    dim:         'rgba(0,0,0,0.06)',
  },
}

// ─── TYPES ───────────────────────────────────────────────────────────────────
type UserRole = 'directivo_ug' | 'secretario_ug' | 'tesorero_ug' | 'vocal_ug' | 'auditor_inspector'

interface Perm {
  basicInfo: boolean; contacto: boolean; servicios: boolean; cobertura: boolean
  directiva: boolean; afiliaciones: boolean; indicadores: boolean
}
interface DirectivoItem { id: string; nombre: string; cargo: string; periodo: string; email: string; telefono: string }
interface ZonaItem      { id: string; zona: string; municipios: string; cabezas: string }
interface UGForm {
  nombre: string; naturaleza: string; ubicacion: string; fundacion: string
  rfc: string; descripcion: string; organismoNacional: string; afilSagarpa: string
  sociosActivos: string; municipios: string; cabezasRegistradas: string; aniosTrayectoria: string
  cuotaMensual: string; proximaAsamblea: string; sociosAlCorriente: string
  tramitesMes: string; satisfaccion: string; tramitesActivos: string; tramitesEnProceso: string
  telefono: string; email: string; sitioWeb: string; horario: string; direccion: string
}

const EMPTY_FORM: UGForm = {
  nombre: '', naturaleza: '', ubicacion: '', fundacion: '',
  rfc: '', descripcion: '', organismoNacional: '', afilSagarpa: '',
  sociosActivos: '', municipios: '', cabezasRegistradas: '', aniosTrayectoria: '',
  cuotaMensual: '', proximaAsamblea: '', sociosAlCorriente: '',
  tramitesMes: '', satisfaccion: '', tramitesActivos: '', tramitesEnProceso: '',
  telefono: '', email: '', sitioWeb: '', horario: '', direccion: '',
}

const PERMS: Record<UserRole, Perm> = {
  directivo_ug:      { basicInfo:true,  contacto:true,  servicios:true,  cobertura:true,  directiva:true,  afiliaciones:true,  indicadores:true  },
  secretario_ug:     { basicInfo:true,  contacto:true,  servicios:true,  cobertura:false, directiva:false, afiliaciones:false, indicadores:false },
  tesorero_ug:       { basicInfo:false, contacto:true,  servicios:false, cobertura:false, directiva:false, afiliaciones:false, indicadores:true  },
  vocal_ug:          { basicInfo:false, contacto:false, servicios:true,  cobertura:true,  directiva:false, afiliaciones:false, indicadores:false },
  auditor_inspector: { basicInfo:false, contacto:false, servicios:false, cobertura:false, directiva:false, afiliaciones:true,  indicadores:true  },
}

const getInitials = (name: string) => name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || '?'

// ─── ICONS ───────────────────────────────────────────────────────────────────
const SP = { strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
const IArrow  = ({ c='#a8a29e', z=14 }) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Line x1="19" y1="12" x2="5" y2="12" stroke={c} strokeWidth={1.65} {...SP}/><Polyline points="12 19 5 12 12 5" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const ISave   = ({ c='#fff',    z=14 }) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" stroke={c} strokeWidth={1.65} {...SP}/><Polyline points="17 21 17 13 7 13 7 21" stroke={c} strokeWidth={1.65} {...SP}/><Polyline points="7 3 7 8 15 8" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const ISpark  = ({ c='#2FAF8F', z=11 }) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const ILock   = ({ c='#a8a29e', z=11 }) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Rect x="3" y="11" width="18" height="11" rx="2" stroke={c} strokeWidth={1.65} {...SP}/><Path d="M7 11V7a5 5 0 0 1 10 0v4" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const ICheck  = ({ c='#fff',    z=11 }) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Polyline points="20 6 9 17 4 12" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const IClose  = ({ c='#a8a29e', z=14 }) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Line x1="18" y1="6" x2="6" y2="18" stroke={c} strokeWidth={1.65} {...SP}/><Line x1="6" y1="6" x2="18" y2="18" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const IPlus   = ({ c='#2FAF8F', z=14 }) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Line x1="12" y1="5" x2="12" y2="19" stroke={c} strokeWidth={1.65} {...SP}/><Line x1="5" y1="12" x2="19" y2="12" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const IEdit   = ({ c='#a8a29e', z=13 }) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke={c} strokeWidth={1.65} {...SP}/><Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const ITrash  = ({ c='#a8a29e', z=13 }) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Polyline points="3 6 5 6 21 6" stroke={c} strokeWidth={1.65} {...SP}/><Path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const IUsers  = ({ c='#2FAF8F', z=14 }) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke={c} strokeWidth={1.65} {...SP}/><Circle cx="9" cy="7" r="4" stroke={c} strokeWidth={1.65} {...SP}/><Path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke={c} strokeWidth={1.65} {...SP}/><Path d="M16 3.13a4 4 0 0 1 0 7.75" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const IMap    = ({ c='#2FAF8F', z=14 }) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Path d="M1 6l7-4 8 4 7-4v16l-7 4-8-4-7 4V6z" stroke={c} strokeWidth={1.65} {...SP}/><Line x1="8" y1="2" x2="8" y2="18" stroke={c} strokeWidth={1.65} {...SP}/><Line x1="16" y1="6" x2="16" y2="22" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const ITrend  = ({ c='#2FAF8F', z=14 }) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Polyline points="23 6 13.5 15.5 8.5 10.5 1 18" stroke={c} strokeWidth={1.65} {...SP}/><Polyline points="17 6 23 6 23 12" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const IPhone  = ({ c='#2FAF8F', z=14 }) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.11 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3 1.31h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L7.09 9.09a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const IInfo   = ({ c='#2FAF8F', z=14 }) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Circle cx="12" cy="12" r="10" stroke={c} strokeWidth={1.65} {...SP}/><Line x1="12" y1="16" x2="12" y2="12" stroke={c} strokeWidth={1.65} {...SP}/><Line x1="12" y1="8" x2="12.01" y2="8" stroke={c} strokeWidth={1.65} {...SP}/></Svg>

// ─── PRIMITIVES ──────────────────────────────────────────────────────────────
function SectionLabel({ text }: { text: string }) {
  const isDark = useColorScheme() === 'dark'
  const t = isDark ? C.dark : C.light
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
      <ISpark c={C.brand} z={11} />
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
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad' | 'url'
  multiline?: boolean; hint?: string; required?: boolean
}) {
  const isDark = useColorScheme() === 'dark'
  const t = isDark ? C.dark : C.light
  const [focus, setFocus] = useState(false)
  return (
    <View style={{ marginBottom: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
        <Text style={{ fontSize: 10.5, fontWeight: '600', letterSpacing: 0.7, textTransform: 'uppercase', color: t.muted }}>
          {label}{required && <Text style={{ color: C.brand }}> *</Text>}
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

function Section({ label, locked, icon, children }: {
  label: string; locked: boolean; icon: React.ReactNode; children: React.ReactNode
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
          <View style={[s.sectionIconWrap, {
            backgroundColor: locked ? t.dim : `${C.brand}18`,
          }]}>
            {locked ? <ILock c={t.muted} z={13} /> : icon}
          </View>
          <Text style={[s.sectionTitle, { color: t.text }]}>{label}</Text>
          {locked && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 'auto' }}>
              <ILock c={t.sub} z={11} />
              <Text style={{ fontSize: 10.5, color: t.sub }}>Sin permisos</Text>
            </View>
          )}
        </View>
        <View style={{ padding: 16, pointerEvents: locked ? 'none' : 'auto' } as any}>
          {children}
        </View>
      </View>
    </View>
  )
}

function AddButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [s.addBtn, {
        borderColor: `${C.brand}35`,
        backgroundColor: pressed ? `${C.brand}08` : 'transparent',
        marginTop: 10,
      }]}>
      <IPlus c={C.brand} z={14} />
      <Text style={{ fontSize: 12.5, fontWeight: '500', color: C.brand }}>{label}</Text>
    </Pressable>
  )
}

// ─── DIRECTIVO ROW ───────────────────────────────────────────────────────────
function DirectivoRow({ item, onEdit, onDelete, canEdit }: {
  item: DirectivoItem; onEdit: () => void; onDelete: () => void; canEdit: boolean
}) {
  const isDark = useColorScheme() === 'dark'
  const t = isDark ? C.dark : C.light
  const ini = getInitials(item.nombre)
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 }}>
      <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: isDark ? '#3c3836' : '#292524', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 11, fontWeight: '700', color: '#fff' }}>{ini}</Text>
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontSize: 13, fontWeight: '500', color: t.text }} numberOfLines={1}>{item.nombre}</Text>
        <Text style={{ fontSize: 11, color: C.brand, fontWeight: '500', marginTop: 1 }}>{item.cargo}</Text>
        <Text style={{ fontSize: 10.5, color: t.muted, marginTop: 1 }}>{item.periodo}</Text>
      </View>
      {canEdit && (
        <View style={{ flexDirection: 'row', gap: 4 }}>
          <Pressable onPress={onEdit}   style={s.rowIconBtn}><IEdit  c={t.muted} z={13} /></Pressable>
          <Pressable onPress={onDelete} style={s.rowIconBtn}><ITrash c={t.muted} z={13} /></Pressable>
        </View>
      )}
    </View>
  )
}

// ─── ZONA ROW ────────────────────────────────────────────────────────────────
function ZonaRow({ item, onEdit, onDelete, canEdit }: {
  item: ZonaItem; onEdit: () => void; onDelete: () => void; canEdit: boolean
}) {
  const isDark = useColorScheme() === 'dark'
  const t = isDark ? C.dark : C.light
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 }}>
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: C.brand, marginLeft: 6 }} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
          <Text style={{ fontSize: 13, fontWeight: '500', color: t.text }}>{item.zona}</Text>
          <Text style={{ fontSize: 12, fontWeight: '600', color: C.brand }}>{item.cabezas} cab.</Text>
        </View>
        <Text style={{ fontSize: 11.5, color: t.muted }} numberOfLines={1}>{item.municipios}</Text>
      </View>
      {canEdit && (
        <View style={{ flexDirection: 'row', gap: 4 }}>
          <Pressable onPress={onEdit}   style={s.rowIconBtn}><IEdit  c={t.muted} z={13} /></Pressable>
          <Pressable onPress={onDelete} style={s.rowIconBtn}><ITrash c={t.muted} z={13} /></Pressable>
        </View>
      )}
    </View>
  )
}

// ─── TOAST ───────────────────────────────────────────────────────────────────
function Toast({ show }: { show: boolean }) {
  const isDark     = useColorScheme() === 'dark'
  const opacity    = useRef(new Animated.Value(0)).current
  const translateY = useRef(new Animated.Value(20)).current
  useEffect(() => {
    if (show) {
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0,  useNativeDriver: true, tension: 80, friction: 10 }),
        Animated.timing(opacity,    { toValue: 1,  duration: 200, useNativeDriver: true }),
      ]).start()
    } else {
      Animated.parallel([
        Animated.timing(translateY, { toValue: 20, duration: 200, useNativeDriver: true }),
        Animated.timing(opacity,    { toValue: 0,  duration: 200, useNativeDriver: true }),
      ]).start()
    }
  }, [show])
  return (
    <Animated.View style={[s.toast, {
      backgroundColor: isDark ? '#fafaf9' : '#1c1917',
      opacity, transform: [{ translateY }],
    }]} pointerEvents="none">
      <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: C.brand, alignItems: 'center', justifyContent: 'center' }}>
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
          <ScrollView style={{ maxHeight: 420 }} contentContainerStyle={{ padding: 16 }}>
            {children}
          </ScrollView>
        </KeyboardAvoidingView>
      </Animated.View>
    </Modal>
  )
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function PerfilUGEdit() {
  const router  = useRouter()
  const isDark  = useColorScheme() === 'dark'
  const insets  = useSafeAreaInsets()
  const t       = isDark ? C.dark : C.light

  const goBack = () => router.back()

  const [role]      = useState<UserRole>('directivo_ug')
  const [isSaving,  setIsSaving]  = useState(false)
  const [saveError, setSaveError] = useState('')
  const [showToast, setShowToast] = useState(false)
  const [form,      setForm]      = useState<UGForm>(EMPTY_FORM)
  const [directiva, setDirectiva] = useState<DirectivoItem[]>([])
  const [zonas,     setZonas]     = useState<ZonaItem[]>([])

  const [directivaPanel, setDirectivaPanel] = useState(false)
  const [zonaPanel,      setZonaPanel]      = useState(false)
  const [editDir,        setEditDir]        = useState<DirectivoItem | null>(null)
  const [editZona,       setEditZona]       = useState<ZonaItem | null>(null)
  const [tmpDir,         setTmpDir]         = useState<DirectivoItem>({ id:'', nombre:'', cargo:'', periodo:'', email:'', telefono:'' })
  const [tmpZona,        setTmpZona]        = useState<ZonaItem>({ id:'', zona:'', municipios:'', cabezas:'' })

  const [confirm, setConfirm] = useState<{ show:boolean; title:string; message:string; onOk:()=>void }>({
    show: false, title: '', message: '', onOk: () => {}
  })

  // TODO: conectar Supabase — cargar union_extended_profiles aquí y poblar form, directiva, zonas

  const perm = PERMS[role]
  const f = (k: keyof UGForm) => (v: string) => setForm(p => ({ ...p, [k]: v }))

  // ── Save ─────────────────────────────────────────────────────────────────
  // TODO: conectar Supabase — upsert a union_extended_profiles aquí
  const handleSave = async () => {
    if (isSaving) return
    setIsSaving(true)
    setSaveError('')
    try {
      // Payload listo para entregar a Supabase:
      const _payload = {
        bio:                 form.descripcion      || null,
        naturaleza:          form.naturaleza        || null,
        ubicacion:           form.ubicacion         || null,
        fundacion:           form.fundacion         ? parseInt(form.fundacion)         : null,
        rfc:                 form.rfc               || null,
        organismo_nacional:  form.organismoNacional || null,
        afil_sagarpa:        form.afilSagarpa       || null,
        socios_activos:      form.sociosActivos      ? parseInt(form.sociosActivos)      : null,
        municipios_count:    form.municipios         ? parseInt(form.municipios)         : null,
        cabezas_registradas: form.cabezasRegistradas ? parseInt(form.cabezasRegistradas) : null,
        anios_trayectoria:   form.aniosTrayectoria   ? parseInt(form.aniosTrayectoria)   : null,
        cuota_mensual:       form.cuotaMensual       ? parseFloat(form.cuotaMensual)     : null,
        proxima_asamblea:    form.proximaAsamblea    || null,
        socios_al_corriente: form.sociosAlCorriente  ? parseInt(form.sociosAlCorriente)  : null,
        tramites_mes:        form.tramitesMes        ? parseInt(form.tramitesMes)        : null,
        satisfaccion:        form.satisfaccion       ? parseInt(form.satisfaccion)       : null,
        tramites_activos:    form.tramitesActivos    ? parseInt(form.tramitesActivos)    : null,
        tramites_en_proceso: form.tramitesEnProceso  ? parseInt(form.tramitesEnProceso)  : null,
        telefono:            form.telefono           || null,
        email_contact:       form.email             || null,
        sitio_web:           form.sitioWeb           || null,
        horario:             form.horario            || null,
        direccion:           form.direccion          || null,
        directiva,
        zonas,
        updated_at:          new Date().toISOString(),
      }
      // await supabase.from('union_extended_profiles').upsert(_payload, { onConflict: 'user_id' })
      setShowToast(true)
      setTimeout(() => { setShowToast(false); goBack() }, 2200)
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
      message: 'Si sales ahora perderás todos los cambios no guardados.',
      onOk: () => goBack(),
    })
  }

  // ── Directiva handlers ────────────────────────────────────────────────────
  const openAddDir  = () => { setEditDir(null); setTmpDir({ id: Date.now().toString(), nombre:'', cargo:'', periodo:'', email:'', telefono:'' }); setDirectivaPanel(true) }
  const openEditDir = (item: DirectivoItem) => { setEditDir(item); setTmpDir({...item}); setDirectivaPanel(true) }
  const saveDir     = () => {
    if (!tmpDir.nombre || !tmpDir.cargo) return
    if (editDir) setDirectiva(d => d.map(x => x.id === editDir.id ? tmpDir : x))
    else         setDirectiva(d => [...d, tmpDir])
    setDirectivaPanel(false)
  }
  const deleteDir = (id: string) => {
    setConfirm({ show:true, title:'Eliminar directivo', message:'¿Confirmas que deseas eliminar este miembro de la directiva?',
      onOk: () => setDirectiva(d => d.filter(x => x.id !== id))
    })
  }

  // ── Zona handlers ─────────────────────────────────────────────────────────
  const openAddZona  = () => { setEditZona(null); setTmpZona({ id: Date.now().toString(), zona:'', municipios:'', cabezas:'' }); setZonaPanel(true) }
  const openEditZona = (item: ZonaItem) => { setEditZona(item); setTmpZona({...item}); setZonaPanel(true) }
  const saveZona     = () => {
    if (!tmpZona.zona) return
    if (editZona) setZonas(z => z.map(x => x.id === editZona.id ? tmpZona : x))
    else          setZonas(z => [...z, tmpZona])
    setZonaPanel(false)
  }
  const deleteZona = (id: string) => {
    setConfirm({ show:true, title:'Eliminar zona', message:'¿Confirmas que deseas eliminar esta zona?',
      onOk: () => setZonas(z => z.filter(x => x.id !== id))
    })
  }

  return (
    <View style={[s.root, { backgroundColor: t.bg }]}>
      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <View style={[s.header, { paddingTop: insets.top, backgroundColor: t.surface, borderBottomColor: t.border }]}>
        <View style={s.headerRow}>
          <Pressable onPress={handleCancel} style={[s.iconBtn, { backgroundColor: t.dim }]}>
            <IArrow c={t.muted} z={14} />
          </Pressable>
          <Text style={{ flex: 1, textAlign: 'center', fontSize: 14, fontWeight: '600', color: t.text }}>
            Editar perfil UG
          </Text>
          <Pressable
            onPress={handleSave}
            disabled={isSaving}
            style={[s.saveBtn, { opacity: isSaving ? 0.6 : 1 }]}>
            {isSaving
              ? <ActivityIndicator size="small" color="#fff" />
              : <ISave c="#fff" z={14} />
            }
            <Text style={s.saveBtnText}>{isSaving ? 'Guardando…' : 'Guardar'}</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {saveError ? (
          <View style={{ marginBottom: 16, padding: 12, borderRadius: 12, backgroundColor: 'rgba(239,68,68,0.10)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.25)' }}>
            <Text style={{ fontSize: 12.5, color: '#ef4444' }}>{saveError}</Text>
          </View>
        ) : null}

        {/* ── INFORMACIÓN BÁSICA ─────────────────────────────────────── */}
        <Section label="Información básica" locked={!perm.basicInfo} icon={<IInfo c={C.brand} z={13} />}>
          <Field label="Nombre de la unión *"    value={form.nombre}       onChange={f('nombre')}       placeholder="Unión Ganadera Regional de Durango" required disabled={!perm.basicInfo} />
          <View style={s.row2}>
            <View style={{ flex: 1 }}>
              <Field label="Naturaleza jurídica" value={form.naturaleza}   onChange={f('naturaleza')}   placeholder="Asociación Civil"    disabled={!perm.basicInfo} />
            </View>
            <View style={{ flex: 1 }}>
              <Field label="Año de fundación"    value={form.fundacion}    onChange={f('fundacion')}    placeholder="1942"                keyboardType="numeric" disabled={!perm.basicInfo} />
            </View>
          </View>
          <View style={s.row2}>
            <View style={{ flex: 1 }}>
              <Field label="RFC"                 value={form.rfc}          onChange={f('rfc')}          placeholder="UGRD421015AB3"        disabled={!perm.basicInfo} />
            </View>
            <View style={{ flex: 1 }}>
              <Field label="Ubicación"           value={form.ubicacion}    onChange={f('ubicacion')}    placeholder="Durango, México"      disabled={!perm.basicInfo} />
            </View>
          </View>
          <View style={s.row2}>
            <View style={{ flex: 1 }}>
              <Field label="Organismo nacional"  value={form.organismoNacional} onChange={f('organismoNacional')} placeholder="CNG" disabled={!perm.basicInfo} />
            </View>
            <View style={{ flex: 1 }}>
              <Field label="Afil. SAGARPA"       value={form.afilSagarpa}  onChange={f('afilSagarpa')}  placeholder="Autorizada"           disabled={!perm.basicInfo} />
            </View>
          </View>
          <Field label="Descripción institucional" value={form.descripcion} onChange={f('descripcion')} placeholder="Organización gremial que representa y defiende los intereses del sector ganadero…" multiline disabled={!perm.basicInfo} />
        </Section>

        {/* ── DATOS ESTADÍSTICOS ─────────────────────────────────────── */}
        <Section label="Datos estadísticos" locked={!perm.basicInfo} icon={<IUsers c={C.brand} z={13} />}>
          <View style={s.row2}>
            <View style={{ flex: 1 }}>
              <Field label="Socios activos"      value={form.sociosActivos}      onChange={f('sociosActivos')}      placeholder="1240"   keyboardType="numeric" disabled={!perm.basicInfo} />
            </View>
            <View style={{ flex: 1 }}>
              <Field label="Municipios"          value={form.municipios}         onChange={f('municipios')}         placeholder="38"     keyboardType="numeric" disabled={!perm.basicInfo} />
            </View>
          </View>
          <View style={s.row2}>
            <View style={{ flex: 1 }}>
              <Field label="Cabezas registradas" value={form.cabezasRegistradas} onChange={f('cabezasRegistradas')} placeholder="480000" keyboardType="numeric" disabled={!perm.basicInfo} />
            </View>
            <View style={{ flex: 1 }}>
              <Field label="Años trayectoria"    value={form.aniosTrayectoria}   onChange={f('aniosTrayectoria')}   placeholder="82"     keyboardType="numeric" disabled={!perm.basicInfo} />
            </View>
          </View>
          <View style={s.row2}>
            <View style={{ flex: 1 }}>
              <Field label="Cuota mensual (MXN)" value={form.cuotaMensual}       onChange={f('cuotaMensual')}       placeholder="850"    keyboardType="numeric" disabled={!perm.basicInfo} />
            </View>
            <View style={{ flex: 1 }}>
              <Field label="Próxima asamblea"    value={form.proximaAsamblea}    onChange={f('proximaAsamblea')}    placeholder="2026-03-15" disabled={!perm.basicInfo} />
            </View>
          </View>
        </Section>

        {/* ── INDICADORES ───────────────────────────────────────────── */}
        <Section label="Indicadores gremiales" locked={!perm.indicadores} icon={<ITrend c={C.brand} z={13} />}>
          <View style={s.row2}>
            <View style={{ flex: 1 }}>
              <Field label="Socios al corriente (%)" value={form.sociosAlCorriente} onChange={f('sociosAlCorriente')} placeholder="87" keyboardType="numeric" disabled={!perm.indicadores} />
            </View>
            <View style={{ flex: 1 }}>
              <Field label="Trámites/mes (%)"        value={form.tramitesMes}       onChange={f('tramitesMes')}       placeholder="94" keyboardType="numeric" disabled={!perm.indicadores} />
            </View>
          </View>
          <View style={s.row2}>
            <View style={{ flex: 1 }}>
              <Field label="Satisfacción (%)"        value={form.satisfaccion}      onChange={f('satisfaccion')}      placeholder="91" keyboardType="numeric" disabled={!perm.indicadores} />
            </View>
            <View style={{ flex: 1 }}>
              <Field label="Trámites activos"        value={form.tramitesActivos}   onChange={f('tramitesActivos')}   placeholder="142" keyboardType="numeric" disabled={!perm.indicadores} />
            </View>
          </View>
          <View style={{ width: '50%', paddingRight: 5 }}>
            <Field label="En proceso"               value={form.tramitesEnProceso} onChange={f('tramitesEnProceso')} placeholder="38" keyboardType="numeric" disabled={!perm.indicadores} />
          </View>
        </Section>

        {/* ── MESA DIRECTIVA ────────────────────────────────────────── */}
        <Section label="Mesa directiva" locked={!perm.directiva} icon={<IUsers c={C.brand} z={13} />}>
          {directiva.length === 0 ? (
            <Text style={{ fontSize: 13, color: t.muted, textAlign: 'center', paddingVertical: 8 }}>
              Sin miembros — agrega el primero
            </Text>
          ) : (
            <View>
              {directiva.map((d, i) => (
                <View key={d.id}>
                  <DirectivoRow item={d} canEdit={perm.directiva}
                    onEdit={() => openEditDir(d)}
                    onDelete={() => deleteDir(d.id)} />
                  {i < directiva.length - 1 && <View style={{ height: 1, backgroundColor: t.dim }} />}
                </View>
              ))}
            </View>
          )}
          {perm.directiva && <AddButton label="Agregar miembro a la directiva" onPress={openAddDir} />}
        </Section>

        {/* ── COBERTURA REGIONAL ────────────────────────────────────── */}
        <Section label="Cobertura regional" locked={!perm.cobertura} icon={<IMap c={C.brand} z={13} />}>
          {zonas.length === 0 ? (
            <Text style={{ fontSize: 13, color: t.muted, textAlign: 'center', paddingVertical: 8 }}>
              Sin zonas — agrega la primera
            </Text>
          ) : (
            <View>
              {zonas.map((z, i) => (
                <View key={z.id}>
                  <ZonaRow item={z} canEdit={perm.cobertura}
                    onEdit={() => openEditZona(z)}
                    onDelete={() => deleteZona(z.id)} />
                  {i < zonas.length - 1 && <View style={{ height: 1, backgroundColor: t.dim }} />}
                </View>
              ))}
            </View>
          )}
          {perm.cobertura && <AddButton label="Agregar zona ganadera" onPress={openAddZona} />}
        </Section>

        {/* ── SERVICIOS (informativo) ────────────────────────────────── */}
        <Section label="Servicios para socios" locked={!perm.servicios} icon={<IInfo c={C.brand} z={13} />}>
          <View style={{ padding: 12, borderRadius: 12, backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#f5f4f3', borderWidth: 1, borderColor: t.dim, marginBottom: 14 }}>
            <Text style={{ fontSize: 12, color: t.muted, lineHeight: 18 }}>
              La configuración detallada de servicios se administra desde el panel de gestión institucional.
            </Text>
          </View>
          {['Gestión de Trámites', 'Certificación Sanitaria', 'Asesoría Legal', 'Crédito Ganadero', 'Capacitación', 'Vinculación Exportadora'].map((sv, i, arr) => (
            <View key={sv}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 11 }}>
                <Text style={{ fontSize: 13, fontWeight: '500', color: t.text }}>{sv}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99, backgroundColor: `${C.brand}12`, borderWidth: 1, borderColor: `${C.brand}28` }}>
                  <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: C.brand }} />
                  <Text style={{ fontSize: 10, fontWeight: '600', color: C.brand }}>Activo</Text>
                </View>
              </View>
              {i < arr.length - 1 && <View style={{ height: 1, backgroundColor: t.dim }} />}
            </View>
          ))}
        </Section>

        {/* ── CONTACTO ──────────────────────────────────────────────── */}
        <Section label="Contacto institucional" locked={!perm.contacto} icon={<IPhone c={C.brand} z={13} />}>
          <View style={s.row2}>
            <View style={{ flex: 1 }}>
              <Field label="Teléfono"           value={form.telefono} onChange={f('telefono')} placeholder="+52 618 825 3100"         keyboardType="phone-pad"    disabled={!perm.contacto} />
            </View>
            <View style={{ flex: 1 }}>
              <Field label="Correo electrónico" value={form.email}    onChange={f('email')}    placeholder="contacto@ugdurango.org.mx" keyboardType="email-address" disabled={!perm.contacto} />
            </View>
          </View>
          <View style={s.row2}>
            <View style={{ flex: 1 }}>
              <Field label="Sitio web"          value={form.sitioWeb} onChange={f('sitioWeb')} placeholder="www.ugdurango.org.mx"     keyboardType="url"          disabled={!perm.contacto} />
            </View>
            <View style={{ flex: 1 }}>
              <Field label="Horario"            value={form.horario}  onChange={f('horario')}  placeholder="Lun–Vie: 8:00–15:00"                                  disabled={!perm.contacto} />
            </View>
          </View>
          <Field label="Dirección de oficinas *" value={form.direccion} onChange={f('direccion')} placeholder="Av. 20 de Noviembre 615, Victoria de Durango" required disabled={!perm.contacto} />
        </Section>

      </ScrollView>

      {/* ── BOTTOM SHEET: DIRECTIVA ──────────────────────────────────── */}
      <BottomSheet show={directivaPanel} title={editDir ? 'Editar directivo' : 'Nuevo miembro de la directiva'} onClose={() => setDirectivaPanel(false)}>
        <Field label="Nombre completo *"  value={tmpDir.nombre}   onChange={v => setTmpDir(p => ({...p, nombre:v}))}   placeholder="Ing. Roberto Medina" required />
        <Field label="Cargo *"            value={tmpDir.cargo}    onChange={v => setTmpDir(p => ({...p, cargo:v}))}    placeholder="Presidente" required />
        <Field label="Período"            value={tmpDir.periodo}  onChange={v => setTmpDir(p => ({...p, periodo:v}))}  placeholder="2023 – 2026" />
        <Field label="Correo electrónico" value={tmpDir.email}    onChange={v => setTmpDir(p => ({...p, email:v}))}    placeholder="nombre@ugdurango.org.mx" keyboardType="email-address" />
        <Field label="Teléfono"           value={tmpDir.telefono} onChange={v => setTmpDir(p => ({...p, telefono:v}))} placeholder="+52 618 111 0001" keyboardType="phone-pad" />
        <View style={s.sheetActions}>
          <Pressable onPress={() => setDirectivaPanel(false)} style={[s.sheetCancelBtn, { borderColor: isDark ? C.dark.border : C.light.border }]}>
            <Text style={{ fontSize: 12.5, fontWeight: '500', color: t.muted }}>Cancelar</Text>
          </Pressable>
          <Pressable onPress={saveDir} disabled={!tmpDir.nombre || !tmpDir.cargo}
            style={[s.sheetConfirmBtn, { opacity: (!tmpDir.nombre || !tmpDir.cargo) ? 0.4 : 1 }]}>
            <Text style={{ fontSize: 12.5, fontWeight: '600', color: isDark ? '#1c1917' : '#fafaf9' }}>Guardar</Text>
          </Pressable>
        </View>
      </BottomSheet>

      {/* ── BOTTOM SHEET: ZONA ───────────────────────────────────────── */}
      <BottomSheet show={zonaPanel} title={editZona ? 'Editar zona' : 'Nueva zona ganadera'} onClose={() => setZonaPanel(false)}>
        <Field label="Nombre de la zona *" value={tmpZona.zona}       onChange={v => setTmpZona(p => ({...p, zona:v}))}       placeholder="Zona Norte" required />
        <Field label="Municipios"           value={tmpZona.municipios} onChange={v => setTmpZona(p => ({...p, municipios:v}))} placeholder="Guanaceví, Tepehuanes…" />
        <Field label="Cabezas de ganado"    value={tmpZona.cabezas}   onChange={v => setTmpZona(p => ({...p, cabezas:v}))}   placeholder="128,000" keyboardType="numeric" />
        <View style={s.sheetActions}>
          <Pressable onPress={() => setZonaPanel(false)} style={[s.sheetCancelBtn, { borderColor: isDark ? C.dark.border : C.light.border }]}>
            <Text style={{ fontSize: 12.5, fontWeight: '500', color: t.muted }}>Cancelar</Text>
          </Pressable>
          <Pressable onPress={saveZona} disabled={!tmpZona.zona}
            style={[s.sheetConfirmBtn, { opacity: !tmpZona.zona ? 0.4 : 1 }]}>
            <Text style={{ fontSize: 12.5, fontWeight: '600', color: isDark ? '#1c1917' : '#fafaf9' }}>Guardar</Text>
          </Pressable>
        </View>
      </BottomSheet>

      {/* ── CONFIRM ──────────────────────────────────────────────────── */}
      <ConfirmDialog
        show={confirm.show}
        title={confirm.title}
        message={confirm.message}
        onConfirm={() => { confirm.onOk(); setConfirm(c => ({...c, show:false})) }}
        onCancel={() => setConfirm(c => ({...c, show:false}))}
      />

      {/* ── TOAST ────────────────────────────────────────────────────── */}
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
    backgroundColor: '#1c1917',
  },
  saveBtnText: { fontSize: 12.5, fontWeight: '600', color: '#fff' },
  card: { borderWidth: 1, borderRadius: 18, overflow: 'hidden' },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1,
  },
  sectionIconWrap: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: 13, fontWeight: '600' },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 13, fontSize: 13 },
  row2: { flexDirection: 'row', gap: 10 },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 11, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed',
  },
  rowIconBtn: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
  },
  sheetHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1,
  },
  closeBtn: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  sheetActions: { flexDirection: 'row', gap: 10, marginTop: 6 },
  sheetCancelBtn: { flex: 1, height: 42, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  sheetConfirmBtn: { flex: 1, height: 42, borderRadius: 12, backgroundColor: '#1c1917', alignItems: 'center', justifyContent: 'center' },
  dialog: {
    marginHorizontal: 28, borderRadius: 20, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 20, elevation: 10,
  },
  dialogActions: { flexDirection: 'row', borderTopWidth: 1 },
  dialogBtn:     { flex: 1, paddingVertical: 14, alignItems: 'center' },
  toast: {
    position: 'absolute', bottom: 32, alignSelf: 'center',
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 18, paddingVertical: 12, borderRadius: 18,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 16, elevation: 8,
  },
})