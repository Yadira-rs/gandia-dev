/**
 * GANDIA — PerfilRanchoEdit (React Native)
 * src/components/perfil/rancho/PerfilRanchoEdit.tsx
 */

import React, { useState, useEffect, useRef } from 'react'
import {
  View, Text, ScrollView, TextInput, Pressable,
  StyleSheet, useColorScheme, Modal, Animated,
  TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import Svg, { Path, Polyline, Line, Rect, Circle } from 'react-native-svg'


// ─── TOKENS ──────────────────────────────────────────────────────────────────
const C = {
  brand:   '#2FAF8F',
  dark: {
    bg:      '#0c0a09',
    surface: '#141210',
    input:   '#1a1816',
    border:  'rgba(255,255,255,0.09)',
    borderFocus: 'rgba(47,175,143,0.6)',
    text:    '#fafaf9',
    muted:   '#a8a29e',
    sub:     'rgba(255,255,255,0.35)',
    dim:     'rgba(255,255,255,0.07)',
  },
  light: {
    bg:      '#fafaf9',
    surface: '#ffffff',
    input:   '#f5f4f3',
    border:  'rgba(0,0,0,0.10)',
    borderFocus: 'rgba(47,175,143,0.55)',
    text:    '#1c1917',
    muted:   '#78716c',
    sub:     'rgba(0,0,0,0.38)',
    dim:     'rgba(0,0,0,0.06)',
  },
}

// ─── TYPES ───────────────────────────────────────────────────────────────────
type UserRole = 'productor_ganadero' | 'medico_veterinario' | 'union_ganadera' | 'exportador' | 'auditor_inspector'
type Status   = 'active' | 'pending' | 'inactive'

interface Perm {
  basicInfo: boolean; capacity: boolean; breeds: boolean; certifications: boolean
  infrastructure: boolean; location: boolean; team: boolean; contact: boolean; kpis: boolean
}
interface InfraItem  { id: string; type: string; description: string; quantity: string }
interface TeamMember { id: string; name: string; email: string; role: string; phone: string; status: Status }
interface Form {
  name: string; location: string; foundedYear: string; description: string
  totalArea: string; installedCapacity: string; activeAnimals: string
  mainBreeds: string; productionType: string; certifications: string
  phone: string; email: string; website: string
  monthlyMortality: string; dailyWeightGain: string; exportableAnimals: string
  address: string; latitude: string; longitude: string; altitude: string
  grazingSystem: string; supplementation: string; waterSupply: string
}

const EMPTY_FORM: Form = {
  name:'', location:'', foundedYear:'', description:'',
  totalArea:'', installedCapacity:'', activeAnimals:'',
  mainBreeds:'', productionType:'', certifications:'',
  phone:'', email:'', website:'',
  monthlyMortality:'', dailyWeightGain:'', exportableAnimals:'',
  address:'', latitude:'', longitude:'', altitude:'',
  grazingSystem:'', supplementation:'', waterSupply:'',
}

const PERMS: Record<UserRole, Perm> = {
  productor_ganadero: { basicInfo:true,  capacity:true,  breeds:true,  certifications:false, infrastructure:true,  location:true,  team:true,  contact:true,  kpis:true  },
  medico_veterinario: { basicInfo:false, capacity:false, breeds:true,  certifications:true,  infrastructure:false, location:false, team:false, contact:false, kpis:true  },
  union_ganadera:     { basicInfo:false, capacity:false, breeds:false, certifications:true,  infrastructure:false, location:false, team:false, contact:true,  kpis:false },
  exportador:         { basicInfo:false, capacity:false, breeds:false, certifications:true,  infrastructure:false, location:false, team:false, contact:true,  kpis:false },
  auditor_inspector:  { basicInfo:false, capacity:false, breeds:false, certifications:true,  infrastructure:false, location:false, team:false, contact:false, kpis:true  },
}

const ROLE_MAP: Record<string, UserRole> = {
  producer: 'productor_ganadero', mvz: 'medico_veterinario',
  union: 'union_ganadera', exporter: 'exportador', auditor: 'auditor_inspector',
}

const ROLE_LABELS: Record<UserRole, string> = {
  productor_ganadero: 'Productor Ganadero', medico_veterinario: 'Médico Veterinario',
  union_ganadera: 'Unión Ganadera', exportador: 'Exportador', auditor_inspector: 'Auditor / Inspector',
}

const STATUS_LABELS: Record<Status, string> = { active: 'Activo', pending: 'Pendiente', inactive: 'Inactivo' }

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
const IBox    = ({ c='#a8a29e', z=14 }) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" stroke={c} strokeWidth={1.65} {...SP}/><Polyline points="3.27 6.96 12 12.01 20.73 6.96" stroke={c} strokeWidth={1.65} {...SP}/><Line x1="12" y1="22.08" x2="12" y2="12" stroke={c} strokeWidth={1.65} {...SP}/></Svg>

const getInitials = (name: string) => name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || '?'

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

function Divider() {
  const isDark = useColorScheme() === 'dark'
  return <View style={{ height: 1, backgroundColor: isDark ? C.dark.dim : C.light.dim }} />
}

function Field({
  label, value, onChange, placeholder, disabled = false,
  keyboardType = 'default', multiline = false, hint, required,
}: {
  label: string; value: string; onChange: (v: string) => void
  placeholder?: string; disabled?: boolean; keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad' | 'url'
  multiline?: boolean; hint?: string; required?: boolean
}) {
  const isDark  = useColorScheme() === 'dark'
  const t       = isDark ? C.dark : C.light
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
        {/* Section header */}
        <View style={[s.sectionHeader, { borderBottomColor: t.dim }]}>
          <View style={[s.sectionIconWrap, {
            backgroundColor: locked ? t.dim : `${C.brand}18`,
          }]}>
            {locked ? <ILock c={t.muted} z={13} /> : <ISpark c={C.brand} z={13} />}
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

function StatusChip({ status }: { status: Status }) {
  const colors = {
    active:   { bg: `${C.brand}14`, border: `${C.brand}30`, text: C.brand },
    pending:  { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', text: '#f59e0b' },
    inactive: { bg: 'rgba(0,0,0,0.06)', border: 'rgba(0,0,0,0.10)', text: '#a8a29e' },
  }[status]
  return (
    <View style={{ paddingHorizontal: 7, paddingVertical: 3, borderRadius: 99, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border }}>
      <Text style={{ fontSize: 10, fontWeight: '600', color: colors.text }}>{STATUS_LABELS[status]}</Text>
    </View>
  )
}

function AddButton({ label, onPress }: { label: string; onPress: () => void }) {
  const isDark = useColorScheme() === 'dark'
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

// ─── INFRA ROW ───────────────────────────────────────────────────────────────
function InfraItemRow({ item, onEdit, onDelete, canEdit }: {
  item: InfraItem; onEdit: () => void; onDelete: () => void; canEdit: boolean
}) {
  const isDark = useColorScheme() === 'dark'
  const t = isDark ? C.dark : C.light
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13 }}>
      <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: t.dim, alignItems: 'center', justifyContent: 'center' }}>
        <IBox c={t.muted} z={14} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 13, fontWeight: '500', color: t.text }}>{item.type}</Text>
        {!!item.description && <Text style={{ fontSize: 11.5, color: t.muted, marginTop: 2 }} numberOfLines={1}>{item.description}</Text>}
      </View>
      <Text style={{ fontSize: 12, fontWeight: '600', color: C.brand }}>{item.quantity}</Text>
      {canEdit && (
        <View style={{ flexDirection: 'row', gap: 4 }}>
          <Pressable onPress={onEdit}  style={s.rowIconBtn}><IEdit  c={t.muted} z={13} /></Pressable>
          <Pressable onPress={onDelete} style={s.rowIconBtn}><ITrash c={t.muted} z={13} /></Pressable>
        </View>
      )}
    </View>
  )
}

// ─── TEAM ROW ────────────────────────────────────────────────────────────────
function TeamMemberRow({ member, onEdit, onDelete, canEdit }: {
  member: TeamMember; onEdit: () => void; onDelete: () => void; canEdit: boolean
}) {
  const isDark = useColorScheme() === 'dark'
  const t = isDark ? C.dark : C.light
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 }}>
      <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: C.brand, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 11, fontWeight: '700', color: '#fff' }}>{getInitials(member.name)}</Text>
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <Text style={{ fontSize: 13, fontWeight: '500', color: t.text }} numberOfLines={1}>{member.name}</Text>
          <StatusChip status={member.status} />
        </View>
        <Text style={{ fontSize: 11.5, color: t.muted }} numberOfLines={1}>{member.role} · {member.email}</Text>
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
  const isDark  = useColorScheme() === 'dark'
  const opacity = useRef(new Animated.Value(0)).current
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
      opacity,
      transform: [{ translateY }],
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

// ─── BOTTOM SHEET / SLIDE OVER ───────────────────────────────────────────────
function BottomSheet({ show, title, onClose, children }: {
  show: boolean; title: string; onClose: () => void; children: React.ReactNode
}) {
  const isDark   = useColorScheme() === 'dark'
  const insets   = useSafeAreaInsets()
  const t        = isDark ? C.dark : C.light
  const translateY = useRef(new Animated.Value(600)).current

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: show ? 0 : 600,
      useNativeDriver: true,
      tension: 65,
      friction: 12,
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
        {/* Handle */}
        <View style={{ alignItems: 'center', paddingVertical: 10 }}>
          <View style={{ width: 32, height: 3, borderRadius: 2, backgroundColor: t.border }} />
        </View>
        {/* Header */}
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

// ─── STATUS PICKER ───────────────────────────────────────────────────────────
function StatusPicker({ value, onChange }: { value: Status; onChange: (v: Status) => void }) {
  const isDark = useColorScheme() === 'dark'
  const t = isDark ? C.dark : C.light
  const options: Status[] = ['active', 'pending', 'inactive']
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ fontSize: 10.5, fontWeight: '600', letterSpacing: 0.7, textTransform: 'uppercase', color: t.muted, marginBottom: 8 }}>Estado</Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {options.map(o => (
          <Pressable key={o} onPress={() => onChange(o)} style={[s.statusOpt, {
            backgroundColor: value === o ? `${C.brand}18` : t.dim,
            borderColor:     value === o ? `${C.brand}40` : t.border,
          }]}>
            <Text style={{ fontSize: 12, fontWeight: '500', color: value === o ? C.brand : t.muted }}>
              {STATUS_LABELS[o]}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  )
}

// ─── MAIN ────────────────────────────────────────────────────────────────────
export default function PerfilRanchoEdit({ onBack }: { onBack?: () => void }) {
  const goBack = () => router.back()
  const router   = useRouter()
  const isDark   = useColorScheme() === 'dark'
  const insets   = useSafeAreaInsets()
  const t        = isDark ? C.dark : C.light

  const [role,        setRole]        = useState<UserRole>('productor_ganadero')
  const [loadingData, setLoadingData] = useState(false)
  const [isSaving,    setIsSaving]    = useState(false)
  const [saveError,   setSaveError]   = useState('')
  const [showToast,   setShowToast]   = useState(false)
  const [form,        setForm]        = useState<Form>(EMPTY_FORM)
  const [infra,       setInfra]       = useState<InfraItem[]>([])
  const [team,        setTeam]        = useState<TeamMember[]>([])

  const [infraPanel, setInfraPanel] = useState(false)
  const [teamPanel,  setTeamPanel]  = useState(false)
  const [editInfra,  setEditInfra]  = useState<InfraItem | null>(null)
  const [editTeamM,  setEditTeamM]  = useState<TeamMember | null>(null)
  const [tmpInfra,   setTmpInfra]   = useState<InfraItem>({ id:'', type:'', description:'', quantity:'' })
  const [tmpTeam,    setTmpTeam]    = useState<TeamMember>({ id:'', name:'', email:'', role:'', phone:'', status:'active' })

  const [confirm, setConfirm] = useState<{ show:boolean; title:string; message:string; onOk:()=>void }>({
    show: false, title: '', message: '', onOk: () => {}
  })

  const perm = PERMS[role]

  // ── Load ─────────────────────────────────────────────────────────────────
  // TODO: conectar Supabase — cargar user_profiles y ranch_extended_profiles aquí

  const f = (k: keyof Form) => (v: string) => setForm(p => ({ ...p, [k]: v }))

  // ── Save ─────────────────────────────────────────────────────────────────
  // TODO: conectar Supabase — upsert a ranch_extended_profiles aquí
  const handleSave = async () => {
    if (isSaving) return
    setIsSaving(true)
    setSaveError('')
    try {
      // Payload listo para entregar a Supabase:
      const teamRoles  = [...new Set(team.map(m => m.role).filter(Boolean))]
      const mvz        = team.find(m => m.role.toLowerCase().includes('veterinario') || m.role.toLowerCase().includes('mvz'))
      const linkedMvz  = mvz ? { name: mvz.name, license: '', ini: getInitials(mvz.name) } : null
      const _payload = {
        name: form.name, bio: form.description, location: form.location,
        founded_year: form.foundedYear ? parseInt(form.foundedYear) : null,
        surface_ha: form.totalArea ? parseFloat(form.totalArea) : null,
        capacity_heads: form.installedCapacity ? parseInt(form.installedCapacity) : null,
        active_heads: form.activeAnimals ? parseInt(form.activeAnimals) : null,
        main_breeds: form.mainBreeds, production_type: form.productionType,
        certifications_text: form.certifications,
        mortality_pct: form.monthlyMortality ? parseFloat(form.monthlyMortality) : null,
        weight_gain_kg: form.dailyWeightGain ? parseFloat(form.dailyWeightGain) : null,
        exportable_pct: form.exportableAnimals ? parseFloat(form.exportableAnimals) : null,
        address_street: form.address,
        lat: form.latitude ? parseFloat(form.latitude) : null,
        lng: form.longitude ? parseFloat(form.longitude) : null,
        altitude: form.altitude ? parseFloat(form.altitude) : null,
        phone: form.phone, email_contact: form.email, website: form.website,
        grazing_system: form.grazingSystem, supplementation: form.supplementation,
        water_supply: form.waterSupply, infrastructure: infra,
        team_members: team, team_roles: teamRoles, linked_mvz: linkedMvz,
        updated_at: new Date().toISOString(),
      }
      // await supabase.from('ranch_extended_profiles').upsert(_payload, { onConflict: 'user_id' })
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

  // ── Infra handlers ────────────────────────────────────────────────────────
  const openAddInfra  = () => { setEditInfra(null); setTmpInfra({ id: Date.now().toString(), type:'', description:'', quantity:'' }); setInfraPanel(true) }
  const openEditInfra = (item: InfraItem)  => { setEditInfra(item); setTmpInfra({...item}); setInfraPanel(true) }
  const saveInfra     = () => {
    if (!tmpInfra.type || !tmpInfra.quantity) return
    setInfra(prev => editInfra ? prev.map(i => i.id === editInfra.id ? tmpInfra : i) : [...prev, tmpInfra])
    setInfraPanel(false)
  }
  const deleteInfra   = (id: string) => setConfirm({
    show: true, title: 'Eliminar infraestructura', message: '¿Eliminar este elemento?',
    onOk: () => { setInfra(p => p.filter(i => i.id !== id)); setConfirm(c => ({...c, show:false})) }
  })

  // ── Team handlers ─────────────────────────────────────────────────────────
  const openAddTeam  = () => { setEditTeamM(null); setTmpTeam({ id: Date.now().toString(), name:'', email:'', role:'', phone:'', status:'active' }); setTeamPanel(true) }
  const openEditTeam = (m: TeamMember) => { setEditTeamM(m); setTmpTeam({...m}); setTeamPanel(true) }
  const saveTeam     = () => {
    if (!tmpTeam.name || !tmpTeam.email || !tmpTeam.role) return
    setTeam(prev => editTeamM ? prev.map(m => m.id === editTeamM.id ? tmpTeam : m) : [...prev, tmpTeam])
    setTeamPanel(false)
  }
  const deleteTeam   = (id: string) => setConfirm({
    show: true, title: 'Eliminar miembro', message: '¿Eliminar a este miembro del equipo?',
    onOk: () => { setTeam(p => p.filter(m => m.id !== id)); setConfirm(c => ({...c, show:false})) }
  })

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loadingData) return (
    <View style={[s.center, { backgroundColor: t.bg }]}>
      <ActivityIndicator color={C.brand} />
      <Text style={{ fontSize: 12, color: t.muted, marginTop: 10 }}>Cargando perfil…</Text>
    </View>
  )

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={[s.root, { backgroundColor: t.bg }]}>

      {/* ── HEADER ─────────────────────────────────────────────── */}
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
            <Text style={{ fontSize: 15, fontWeight: '600', fontStyle: 'italic', color: t.text }} numberOfLines={1}>
              Editar perfil del rancho
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

      {/* ── CONTENT ────────────────────────────────────────────── */}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 100 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          {/* Información básica */}
          <Section label="Información básica" locked={!perm.basicInfo}>
            <Field label="Nombre del rancho" value={form.name} onChange={f('name')} placeholder="Rancho El Búfalo Dorado" disabled={!perm.basicInfo} required />
            <View style={s.row2}>
              <View style={{ flex: 1 }}>
                <Field label="Ubicación general" value={form.location} onChange={f('location')} placeholder="Durango, México" disabled={!perm.basicInfo} />
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Año de fundación" value={form.foundedYear} onChange={f('foundedYear')} placeholder="1998" keyboardType="numeric" disabled={!perm.basicInfo} />
              </View>
            </View>
            <Field label="Descripción" value={form.description} onChange={f('description')} placeholder="Describe las características del rancho…" disabled={!perm.basicInfo} multiline />
          </Section>

          {/* Ubicación */}
          <Section label="Ubicación" locked={!perm.location}>
            <Field label="Dirección completa" value={form.address} onChange={f('address')} placeholder="Carretera Durango-Mazatlán, Km 45" disabled={!perm.location} required />
            <View style={s.row3}>
              <View style={{ flex: 1 }}>
                <Field label="Latitud" value={form.latitude} onChange={f('latitude')} placeholder="24.5231" keyboardType="numeric" disabled={!perm.location} hint="GPS N/S" />
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Longitud" value={form.longitude} onChange={f('longitude')} placeholder="-104.8" keyboardType="numeric" disabled={!perm.location} hint="GPS E/O" />
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Altitud (m)" value={form.altitude} onChange={f('altitude')} placeholder="1890" keyboardType="numeric" disabled={!perm.location} />
              </View>
            </View>
          </Section>

          {/* Capacidad */}
          <Section label="Capacidad" locked={!perm.capacity}>
            <View style={s.row3}>
              <View style={{ flex: 1 }}>
                <Field label="Superficie (ha)" value={form.totalArea} onChange={f('totalArea')} placeholder="500" keyboardType="numeric" disabled={!perm.capacity} required />
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Cap. instalada" value={form.installedCapacity} onChange={f('installedCapacity')} placeholder="2000" keyboardType="numeric" disabled={!perm.capacity} required />
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Activos (cab)" value={form.activeAnimals} onChange={f('activeAnimals')} placeholder="1450" keyboardType="numeric" disabled={!perm.capacity} required />
              </View>
            </View>
          </Section>

          {/* Razas y producción */}
          <Section label="Razas y producción" locked={!perm.breeds}>
            <View style={s.row2}>
              <View style={{ flex: 1 }}>
                <Field label="Razas principales" value={form.mainBreeds} onChange={f('mainBreeds')} placeholder="Charolais, Angus" disabled={!perm.breeds} required />
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Tipo de producción" value={form.productionType} onChange={f('productionType')} placeholder="Engorda intensiva" disabled={!perm.breeds} required />
              </View>
            </View>
            <View style={s.row3}>
              <View style={{ flex: 1 }}>
                <Field label="Pastoreo" value={form.grazingSystem} onChange={f('grazingSystem')} placeholder="Rotacional" disabled={!perm.breeds} />
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Suplementación" value={form.supplementation} onChange={f('supplementation')} placeholder="TMR" disabled={!perm.breeds} />
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Agua" value={form.waterSupply} onChange={f('waterSupply')} placeholder="Perforación" disabled={!perm.breeds} />
              </View>
            </View>
          </Section>

          {/* Certificaciones */}
          <Section label="Certificaciones" locked={!perm.certifications}>
            <Field label="Certificaciones activas" value={form.certifications} onChange={f('certifications')} placeholder="TIF, SAGARPA, ISO" disabled={!perm.certifications} hint="Separa cada certificación con comas" />
          </Section>

          {/* Infraestructura */}
          <Section label="Infraestructura" locked={!perm.infrastructure}>
            {infra.length === 0 && !perm.infrastructure && (
              <Text style={{ fontSize: 12.5, color: t.muted, textAlign: 'center', paddingVertical: 12 }}>Sin infraestructura registrada</Text>
            )}
            {infra.map((item, i) => (
              <View key={item.id}>
                <InfraItemRow item={item} canEdit={perm.infrastructure} onEdit={() => openEditInfra(item)} onDelete={() => deleteInfra(item.id)} />
                {i < infra.length - 1 && <Divider />}
              </View>
            ))}
            {perm.infrastructure && <AddButton label="Agregar infraestructura" onPress={openAddInfra} />}
          </Section>

          {/* Equipo */}
          <Section label="Equipo" locked={!perm.team}>
            {team.length === 0 && !perm.team && (
              <Text style={{ fontSize: 12.5, color: t.muted, textAlign: 'center', paddingVertical: 12 }}>Sin miembros registrados</Text>
            )}
            {team.map((m, i) => (
              <View key={m.id}>
                <TeamMemberRow member={m} canEdit={perm.team} onEdit={() => openEditTeam(m)} onDelete={() => deleteTeam(m.id)} />
                {i < team.length - 1 && <Divider />}
              </View>
            ))}
            {perm.team && <AddButton label="Agregar miembro" onPress={openAddTeam} />}
          </Section>

          {/* Contacto */}
          <Section label="Contacto" locked={!perm.contact}>
            <Field label="Teléfono" value={form.phone} onChange={f('phone')} placeholder="+52 618 123 4567" keyboardType="phone-pad" disabled={!perm.contact} />
            <Field label="Correo electrónico" value={form.email} onChange={f('email')} placeholder="info@rancho.mx" keyboardType="email-address" disabled={!perm.contact} />
            <Field label="Sitio web" value={form.website} onChange={f('website')} placeholder="www.rancho.mx" keyboardType="url" disabled={!perm.contact} />
          </Section>

          {/* KPIs */}
          <Section label="Indicadores KPI" locked={!perm.kpis}>
            <View style={s.row3}>
              <View style={{ flex: 1 }}>
                <Field label="Mortalidad (%)" value={form.monthlyMortality} onChange={f('monthlyMortality')} placeholder="1.2" keyboardType="numeric" disabled={!perm.kpis} />
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Peso/día (kg)" value={form.dailyWeightGain} onChange={f('dailyWeightGain')} placeholder="0.9" keyboardType="numeric" disabled={!perm.kpis} />
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Exportables (%)" value={form.exportableAnimals} onChange={f('exportableAnimals')} placeholder="65" keyboardType="numeric" disabled={!perm.kpis} />
              </View>
            </View>
          </Section>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── BOTTOM SHEET: INFRA ──────────────────────────────── */}
      <BottomSheet show={infraPanel} title={editInfra ? 'Editar infraestructura' : 'Nueva infraestructura'} onClose={() => setInfraPanel(false)}>
        <Field label="Tipo *" value={tmpInfra.type} onChange={v => setTmpInfra(p => ({...p, type:v}))} placeholder="Corrales de engorda" required />
        <Field label="Descripción" value={tmpInfra.description} onChange={v => setTmpInfra(p => ({...p, description:v}))} placeholder="Corrales techados con comederos" />
        <Field label="Cantidad / Capacidad *" value={tmpInfra.quantity} onChange={v => setTmpInfra(p => ({...p, quantity:v}))} placeholder="12 unidades" required />
        <View style={s.sheetActions}>
          <Pressable onPress={() => setInfraPanel(false)} style={[s.sheetCancelBtn, { borderColor: isDark ? C.dark.border : C.light.border }]}>
            <Text style={{ fontSize: 12.5, fontWeight: '500', color: t.muted }}>Cancelar</Text>
          </Pressable>
          <Pressable
            onPress={saveInfra}
            disabled={!tmpInfra.type || !tmpInfra.quantity}
            style={[s.sheetConfirmBtn, { opacity: (!tmpInfra.type || !tmpInfra.quantity) ? 0.4 : 1 }]}>
            <Text style={{ fontSize: 12.5, fontWeight: '600', color: isDark ? '#1c1917' : '#fafaf9' }}>Guardar</Text>
          </Pressable>
        </View>
      </BottomSheet>

      {/* ── BOTTOM SHEET: EQUIPO ─────────────────────────────── */}
      <BottomSheet show={teamPanel} title={editTeamM ? 'Editar miembro' : 'Nuevo miembro del equipo'} onClose={() => setTeamPanel(false)}>
        <Field label="Nombre completo *" value={tmpTeam.name} onChange={v => setTmpTeam(p => ({...p, name:v}))} placeholder="Juan Pérez" required />
        <Field label="Correo electrónico *" value={tmpTeam.email} onChange={v => setTmpTeam(p => ({...p, email:v}))} placeholder="juan@rancho.mx" keyboardType="email-address" required />
        <Field label="Rol / Puesto *" value={tmpTeam.role} onChange={v => setTmpTeam(p => ({...p, role:v}))} placeholder="Médico Veterinario" required />
        <Field label="Teléfono" value={tmpTeam.phone} onChange={v => setTmpTeam(p => ({...p, phone:v}))} placeholder="+52 618 123 4567" keyboardType="phone-pad" />
        <StatusPicker value={tmpTeam.status} onChange={v => setTmpTeam(p => ({...p, status:v}))} />
        <View style={s.sheetActions}>
          <Pressable onPress={() => setTeamPanel(false)} style={[s.sheetCancelBtn, { borderColor: isDark ? C.dark.border : C.light.border }]}>
            <Text style={{ fontSize: 12.5, fontWeight: '500', color: t.muted }}>Cancelar</Text>
          </Pressable>
          <Pressable
            onPress={saveTeam}
            disabled={!tmpTeam.name || !tmpTeam.email || !tmpTeam.role}
            style={[s.sheetConfirmBtn, { opacity: (!tmpTeam.name || !tmpTeam.email || !tmpTeam.role) ? 0.4 : 1 }]}>
            <Text style={{ fontSize: 12.5, fontWeight: '600', color: isDark ? '#1c1917' : '#fafaf9' }}>Guardar</Text>
          </Pressable>
        </View>
      </BottomSheet>

      {/* ── CONFIRM ──────────────────────────────────────────── */}
      <ConfirmDialog
        show={confirm.show}
        title={confirm.title}
        message={confirm.message}
        onConfirm={() => { confirm.onOk(); setConfirm(c => ({...c, show:false})) }}
        onCancel={() => setConfirm(c => ({...c, show:false}))}
      />

      {/* ── TOAST ────────────────────────────────────────────── */}
      <Toast show={showToast} />

    </View>
  )
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:   { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header:    { borderBottomWidth: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingBottom: 10, minHeight: 54 },
  iconBtn:   { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },

  saveBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12,
    backgroundColor: '#1c1917',
  },
  saveBtnText: { fontSize: 12.5, fontWeight: '600', color: '#fff' },

  card: {
    borderWidth: 1,
    borderRadius: 18,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    borderBottomWidth: 1,
  },
  sectionIconWrap: {
    width: 30, height: 30, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  sectionTitle: { fontSize: 13, fontWeight: '600' },

  input: {
    borderWidth: 1, borderRadius: 12,
    paddingHorizontal: 13,
    fontSize: 13,
  },

  row2: { flexDirection: 'row', gap: 10 },
  row3: { flexDirection: 'row', gap: 8 },

  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 11, borderRadius: 12,
    borderWidth: 1, borderStyle: 'dashed',
  },

  rowIconBtn: {
    width: 30, height: 30, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },

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
  sheetCancelBtn: {
    flex: 1, height: 42, borderRadius: 12, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  sheetConfirmBtn: {
    flex: 1, height: 42, borderRadius: 12,
    backgroundColor: '#1c1917',
    alignItems: 'center', justifyContent: 'center',
  },

  statusOpt: {
    flex: 1, paddingVertical: 9, borderRadius: 10, borderWidth: 1,
    alignItems: 'center',
  },

  dialog: {
    marginHorizontal: 28, borderRadius: 20, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 20, elevation: 10,
  },
  dialogActions: { flexDirection: 'row', borderTopWidth: 1 },
  dialogBtn: { flex: 1, paddingVertical: 14, alignItems: 'center' },

  toast: {
    position: 'absolute', bottom: 32, alignSelf: 'center',
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 18, paddingVertical: 12,
    borderRadius: 18,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 16, elevation: 8,
  },
})