/**
 * GANDIA — PerfilMVZEdit (React Native)
 * app/(app)/InstitucionalPerfil/MVZ/editar.tsx
 *
 * Edición de perfil MVZ — solo frontend.
 * TODO: conectar Supabase cuando proceda.
 */

import React, { useState, useEffect, useRef } from 'react'
import {
  View, Text, ScrollView, TextInput, Pressable, Switch,
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
    borderFocus: 'rgba(47,175,143,0.60)',
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
type UserRole = 'mvz_titular' | 'mvz_asociado' | 'admin_clinica' | 'auditor_inspector'
interface Perm {
  basicInfo:boolean; especialidades:boolean; formacion:boolean; experiencia:boolean
  certificaciones:boolean; clientes:boolean; servicios:boolean; indicadores:boolean; contacto:boolean
}
const PERMS: Record<UserRole, Perm> = {
  mvz_titular:       { basicInfo:true,  especialidades:true,  formacion:true,  experiencia:true,  certificaciones:true,  clientes:true,  servicios:true,  indicadores:true,  contacto:true  },
  mvz_asociado:      { basicInfo:false, especialidades:true,  formacion:true,  experiencia:true,  certificaciones:false, clientes:true,  servicios:true,  indicadores:false, contacto:false },
  admin_clinica:     { basicInfo:true,  especialidades:false, formacion:false, experiencia:false, certificaciones:false, clientes:true,  servicios:true,  indicadores:true,  contacto:true  },
  auditor_inspector: { basicInfo:false, especialidades:false, formacion:false, experiencia:false, certificaciones:true,  clientes:false, servicios:false, indicadores:true,  contacto:false },
}
const ROLE_LABELS: Record<UserRole, string> = {
  mvz_titular:'MVZ Titular', mvz_asociado:'MVZ Asociado',
  admin_clinica:'Admin Clínica', auditor_inspector:'Auditor / Inspector',
}

type EstudioTipo = 'licenciatura' | 'maestria' | 'diplomado'
type CertEstado  = 'vigente' | 'por-vencer' | 'vencido'
interface EstudioItem  { id:string; grado:string; institucion:string; periodo:string; tipo:EstudioTipo }
interface ExpItem      { id:string; cargo:string; empresa:string; periodo:string; descripcion:string; activo:boolean }
interface CertItem     { id:string; nombre:string; vence:string; estado:CertEstado }
interface ClienteItem  { id:string; nombre:string; municipio:string; cabezas:string; tipo:string }
interface ServicioItem { id:string; label:string; precio:string }
interface Form {
  nombre:string; titulo:string; ubicacion:string; cedula:string
  universidad:string; anioEgreso:string; aniosExp:string; descripcion:string
  celular:string; email:string; sitioWeb:string; disponibilidad:string
  diagnosticoAcertado:string; clientesContrato:string; certsAprobados:string
  visitasMes:string; certsEmitidos:string
}
const EMPTY_FORM: Form = {
  nombre:'', titulo:'', ubicacion:'', cedula:'',
  universidad:'', anioEgreso:'', aniosExp:'', descripcion:'',
  celular:'', email:'', sitioWeb:'', disponibilidad:'',
  diagnosticoAcertado:'', clientesContrato:'', certsAprobados:'',
  visitasMes:'', certsEmitidos:'',
}

// ─── ICONS ───────────────────────────────────────────────────────────────────
const SP = { strokeLinecap:'round' as const, strokeLinejoin:'round' as const }
const IArrow  = ({c='#a8a29e',z=14}) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Line x1="19" y1="12" x2="5" y2="12" stroke={c} strokeWidth={1.65} {...SP}/><Polyline points="12 19 5 12 12 5" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const ISave   = ({c='#fff',    z=14}) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" stroke={c} strokeWidth={1.65} {...SP}/><Polyline points="17 21 17 13 7 13 7 21" stroke={c} strokeWidth={1.65} {...SP}/><Polyline points="7 3 7 8 15 8" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const ISpark  = ({c='#2FAF8F',z=11}) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const ILock   = ({c='#a8a29e',z=11}) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Rect x="3" y="11" width="18" height="11" rx="2" stroke={c} strokeWidth={1.65} {...SP}/><Path d="M7 11V7a5 5 0 0 1 10 0v4" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const ICheck  = ({c='#fff',    z=11}) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Polyline points="20 6 9 17 4 12" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const IClose  = ({c='#a8a29e',z=14}) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Line x1="18" y1="6" x2="6" y2="18" stroke={c} strokeWidth={1.65} {...SP}/><Line x1="6" y1="6" x2="18" y2="18" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const IPlus   = ({c='#2FAF8F',z=14}) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Line x1="12" y1="5" x2="12" y2="19" stroke={c} strokeWidth={1.65} {...SP}/><Line x1="5" y1="12" x2="19" y2="12" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const IEdit   = ({c='#a8a29e',z=13}) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke={c} strokeWidth={1.65} {...SP}/><Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const ITrash  = ({c='#a8a29e',z=13}) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Polyline points="3 6 5 6 21 6" stroke={c} strokeWidth={1.65} {...SP}/><Path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const IInfo   = ({c='#2FAF8F',z=14}) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Circle cx="12" cy="12" r="10" stroke={c} strokeWidth={1.65} {...SP}/><Line x1="12" y1="16" x2="12" y2="12" stroke={c} strokeWidth={1.65} {...SP}/><Line x1="12" y1="8" x2="12.01" y2="8" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const IPerson = ({c='#2FAF8F',z=14}) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke={c} strokeWidth={1.65} {...SP}/><Circle cx="12" cy="7" r="4" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const IShield = ({c='#2FAF8F',z=14}) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const IBook   = ({c='#2FAF8F',z=14}) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Path d="M22 10v6M2 10l10-5 10 5-10 5z" stroke={c} strokeWidth={1.65} {...SP}/><Path d="M6 12v5c3 3 9 3 12 0v-5" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const IBrief  = ({c='#2FAF8F',z=14}) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Rect x="2" y="7" width="20" height="14" rx="2" stroke={c} strokeWidth={1.65} {...SP}/><Path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const IBadge  = ({c='#2FAF8F',z=14}) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke={c} strokeWidth={1.65} {...SP}/><Polyline points="22 4 12 14.01 9 11.01" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const IHome   = ({c='#2FAF8F',z=14}) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke={c} strokeWidth={1.65} {...SP}/><Polyline points="9 22 9 12 15 12 15 22" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const IDollar = ({c='#2FAF8F',z=14}) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Line x1="12" y1="1" x2="12" y2="23" stroke={c} strokeWidth={1.65} {...SP}/><Path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const ITrend  = ({c='#2FAF8F',z=14}) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Line x1="18" y1="20" x2="18" y2="10" stroke={c} strokeWidth={1.65} {...SP}/><Line x1="12" y1="20" x2="12" y2="4" stroke={c} strokeWidth={1.65} {...SP}/><Line x1="6" y1="20" x2="6" y2="14" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const IPhone  = ({c='#2FAF8F',z=14}) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.11 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3 1.31h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L7.09 9.09a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" stroke={c} strokeWidth={1.65} {...SP}/></Svg>

// ─── FIELD ───────────────────────────────────────────────────────────────────
function Field({
  label, value, onChange, placeholder, disabled=false,
  keyboardType='default', multiline=false, hint, required,
}: {
  label:string; value:string; onChange:(v:string)=>void
  placeholder?:string; disabled?:boolean
  keyboardType?:'default'|'numeric'|'email-address'|'phone-pad'|'url'
  multiline?:boolean; hint?:string; required?:boolean
}) {
  const isDark = useColorScheme() === 'dark'
  const t = isDark ? C.dark : C.light
  const [focus, setFocus] = useState(false)
  return (
    <View style={{marginBottom:14}}>
      <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:5}}>
        <Text style={{fontSize:10.5,fontWeight:'600',letterSpacing:0.7,textTransform:'uppercase',color:t.muted}}>
          {label}{required && <Text style={{color:C.brand}}> *</Text>}
        </Text>
        {disabled && (
          <View style={{flexDirection:'row',alignItems:'center',gap:3}}>
            <ILock c={t.sub} z={10}/><Text style={{fontSize:9.5,color:t.sub}}>Solo lectura</Text>
          </View>
        )}
      </View>
      <TextInput
        value={value} onChangeText={onChange} placeholder={placeholder}
        placeholderTextColor={t.sub} editable={!disabled}
        keyboardType={keyboardType} multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
        onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
        style={[s.input, {
          backgroundColor:t.input, borderColor: focus ? t.borderFocus : t.border,
          color:t.text, opacity: disabled ? 0.45 : 1,
          height: multiline ? 88 : 44,
          textAlignVertical: multiline ? 'top' : 'center',
          paddingTop: multiline ? 10 : 0,
        }]}
      />
      {hint && <Text style={{fontSize:11,color:t.sub,marginTop:4}}>{hint}</Text>}
    </View>
  )
}

// ─── SECTION ─────────────────────────────────────────────────────────────────
function Section({label, locked, icon, children}: {
  label:string; locked:boolean; icon:React.ReactNode; children:React.ReactNode
}) {
  const isDark = useColorScheme() === 'dark'
  const t = isDark ? C.dark : C.light
  return (
    <View style={{marginBottom:24}}>
      <View style={{flexDirection:'row',alignItems:'center',gap:10,marginBottom:12}}>
        <ISpark c={C.brand} z={11}/>
        <Text style={{fontSize:10,fontWeight:'600',letterSpacing:1.2,textTransform:'uppercase',color:t.muted}}>{label}</Text>
        <View style={{flex:1,height:1,backgroundColor:t.dim}}/>
      </View>
      <View style={[s.card, {backgroundColor:t.surface,borderColor:t.border,opacity:locked?0.55:1}]}>
        <View style={[s.secHeader, {borderBottomColor:t.dim}]}>
          <View style={[s.secIconWrap, {backgroundColor:locked?t.dim:`${C.brand}18`}]}>
            {locked ? <ILock c={t.muted} z={13}/> : icon}
          </View>
          <Text style={[s.secTitle, {color:t.text}]}>{label}</Text>
          {locked && (
            <View style={{flexDirection:'row',alignItems:'center',gap:4,marginLeft:'auto'}}>
              <ILock c={t.sub} z={11}/>
              <Text style={{fontSize:10.5,color:t.sub}}>Sin permisos</Text>
            </View>
          )}
        </View>
        <View style={{padding:16}}>{children}</View>
      </View>
    </View>
  )
}

// ─── ROW ACTIONS ─────────────────────────────────────────────────────────────
function RowActions({onEdit, onDelete}: {onEdit:()=>void; onDelete:()=>void}) {
  const isDark = useColorScheme() === 'dark'
  return (
    <View style={{flexDirection:'row',gap:4,flexShrink:0}}>
      <Pressable onPress={onEdit}   style={[s.rowBtn, {backgroundColor: isDark?'rgba(255,255,255,0.06)':'#f4f2ef'}]}><IEdit  c={isDark?'#a8a29e':'#78716c'} z={13}/></Pressable>
      <Pressable onPress={onDelete} style={[s.rowBtn, {backgroundColor: isDark?'rgba(255,255,255,0.06)':'#f4f2ef'}]}><ITrash c={isDark?'#a8a29e':'#78716c'} z={13}/></Pressable>
    </View>
  )
}

// ─── ADD BUTTON ──────────────────────────────────────────────────────────────
function AddButton({label, onPress}: {label:string; onPress:()=>void}) {
  return (
    <Pressable onPress={onPress} style={({pressed}) => [s.addBtn, {
      borderColor:`${C.brand}35`, backgroundColor: pressed?`${C.brand}08`:'transparent', marginTop:10,
    }]}>
      <IPlus c={C.brand} z={14}/>
      <Text style={{fontSize:12.5,fontWeight:'500',color:C.brand}}>{label}</Text>
    </Pressable>
  )
}

// ─── TIPO PICKER (replace <select> for estudios) ─────────────────────────────
function TipoPicker({value, onChange}: {value:EstudioTipo; onChange:(v:EstudioTipo)=>void}) {
  const isDark = useColorScheme() === 'dark'
  const t = isDark ? C.dark : C.light
  const opts: {val:EstudioTipo; label:string; color:string}[] = [
    {val:'licenciatura', label:'Licenciatura', color:'#0d9488'},
    {val:'maestria',     label:'Maestría / Esp.',  color:'#7c3aed'},
    {val:'diplomado',    label:'Diplomado / Cert.', color:'#d97706'},
  ]
  return (
    <View style={{marginBottom:14}}>
      <Text style={{fontSize:10.5,fontWeight:'600',letterSpacing:0.7,textTransform:'uppercase',color:t.muted,marginBottom:8}}>Tipo</Text>
      <View style={{flexDirection:'row',gap:8}}>
        {opts.map(o => (
          <Pressable key={o.val} onPress={() => onChange(o.val)}
            style={{
              flex:1, paddingVertical:8, borderRadius:10, alignItems:'center',
              backgroundColor: value===o.val ? `${o.color}18` : t.dim,
              borderWidth:1, borderColor: value===o.val ? `${o.color}40` : 'transparent',
            }}>
            <Text style={{fontSize:11,fontWeight:'600',color: value===o.val ? o.color : t.sub}}>{o.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  )
}

// ─── CERT ESTADO PICKER ──────────────────────────────────────────────────────
function EstadoPicker({value, onChange}: {value:CertEstado; onChange:(v:CertEstado)=>void}) {
  const isDark = useColorScheme() === 'dark'
  const t = isDark ? C.dark : C.light
  const opts: {val:CertEstado; label:string; color:string}[] = [
    {val:'vigente',     label:'Vigente',     color:C.brand},
    {val:'por-vencer',  label:'Por vencer',  color:'#f59e0b'},
    {val:'vencido',     label:'Vencido',     color:'#f43f5e'},
  ]
  return (
    <View style={{marginBottom:14}}>
      <Text style={{fontSize:10.5,fontWeight:'600',letterSpacing:0.7,textTransform:'uppercase',color:t.muted,marginBottom:8}}>Estado</Text>
      <View style={{flexDirection:'row',gap:8}}>
        {opts.map(o => (
          <Pressable key={o.val} onPress={() => onChange(o.val)}
            style={{
              flex:1, paddingVertical:8, borderRadius:10, alignItems:'center',
              backgroundColor: value===o.val ? `${o.color}18` : t.dim,
              borderWidth:1, borderColor: value===o.val ? `${o.color}40` : 'transparent',
            }}>
            <Text style={{fontSize:11,fontWeight:'600',color: value===o.val ? o.color : t.sub}}>{o.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  )
}

// ─── TOAST ───────────────────────────────────────────────────────────────────
function Toast({show}: {show:boolean}) {
  const isDark     = useColorScheme() === 'dark'
  const opacity    = useRef(new Animated.Value(0)).current
  const translateY = useRef(new Animated.Value(20)).current
  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateY, {toValue: show?0:20,  useNativeDriver:true, tension:80, friction:10}),
      Animated.timing(opacity,    {toValue: show?1:0,   duration:200,         useNativeDriver:true}),
    ]).start()
  }, [show])
  return (
    <Animated.View style={[s.toast, {
      backgroundColor: isDark?'#fafaf9':'#1c1917',
      opacity, transform:[{translateY}],
    }]} pointerEvents="none">
      <View style={{width:20,height:20,borderRadius:10,backgroundColor:C.brand,alignItems:'center',justifyContent:'center'}}>
        <ICheck c="#fff" z={11}/>
      </View>
      <Text style={{fontSize:13,fontWeight:'500',color:isDark?'#1c1917':'#fafaf9'}}>Cambios guardados correctamente</Text>
    </Animated.View>
  )
}

// ─── CONFIRM DIALOG ──────────────────────────────────────────────────────────
function ConfirmDialog({show, title, message, onConfirm, onCancel, confirmLabel='Eliminar', danger=true}: {
  show:boolean; title:string; message:string; onConfirm:()=>void; onCancel:()=>void
  confirmLabel?:string; danger?:boolean
}) {
  const isDark = useColorScheme() === 'dark'
  const t = isDark ? C.dark : C.light
  return (
    <Modal visible={show} transparent animationType="fade">
      <View style={[s.overlay, {justifyContent:'center'}]}>
        <View style={[s.dialog, {backgroundColor: isDark?'#1c1917':'#fff'}]}>
          <View style={{padding:20,paddingBottom:16}}>
            <Text style={{fontSize:14,fontWeight:'600',color:t.text,marginBottom:6}}>{title}</Text>
            <Text style={{fontSize:12.5,color:t.muted,lineHeight:19}}>{message}</Text>
          </View>
          <View style={[s.dialogActions, {borderTopColor:t.dim}]}>
            <Pressable onPress={onCancel}  style={[s.dialogBtn, {borderRightWidth:1,borderRightColor:t.dim}]}>
              <Text style={{fontSize:13,fontWeight:'500',color:t.muted}}>Cancelar</Text>
            </Pressable>
            <Pressable onPress={onConfirm} style={s.dialogBtn}>
              <Text style={{fontSize:13,fontWeight:'600',color: danger?'#ef4444':C.brand}}>{confirmLabel}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  )
}

// ─── BOTTOM SHEET ────────────────────────────────────────────────────────────
function BottomSheet({show, title, onClose, onSave, saveLabel='Guardar', children}: {
  show:boolean; title:string; onClose:()=>void; onSave:()=>void
  saveLabel?:string; children:React.ReactNode
}) {
  const isDark     = useColorScheme() === 'dark'
  const insets     = useSafeAreaInsets()
  const t          = isDark ? C.dark : C.light
  const translateY = useRef(new Animated.Value(700)).current
  useEffect(() => {
    Animated.spring(translateY, {
      toValue: show ? 0 : 700,
      useNativeDriver:true, tension:65, friction:12,
    }).start()
  }, [show])
  if (!show) return null
  return (
    <Modal visible={show} transparent animationType="none">
      <Pressable style={s.overlay} onPress={onClose}/>
      <Animated.View style={[s.sheet, {
        backgroundColor:t.surface, paddingBottom: insets.bottom+16,
        transform:[{translateY}],
      }]}>
        <View style={{alignItems:'center',paddingVertical:10}}>
          <View style={{width:32,height:3,borderRadius:2,backgroundColor:t.border}}/>
        </View>
        <View style={[s.sheetHeader, {borderBottomColor:t.dim}]}>
          <Text style={{fontSize:14,fontWeight:'600',color:t.text}}>{title}</Text>
          <Pressable onPress={onClose} style={[s.closeBtn, {backgroundColor:t.dim}]}>
            <IClose c={t.muted} z={14}/>
          </Pressable>
        </View>
        <KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':undefined}>
          <ScrollView style={{maxHeight:430}} contentContainerStyle={{padding:16}} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
        </KeyboardAvoidingView>
        {/* Footer */}
        <View style={[s.sheetFooter, {borderTopColor:t.dim}]}>
          <Pressable onPress={onClose} style={[s.sheetCancelBtn, {borderColor:t.border}]}>
            <Text style={{fontSize:12.5,fontWeight:'500',color:t.muted}}>Cancelar</Text>
          </Pressable>
          <Pressable onPress={onSave} style={s.sheetSaveBtn}>
            <Text style={{fontSize:12.5,fontWeight:'600',color:'#fff'}}>{saveLabel}</Text>
          </Pressable>
        </View>
      </Animated.View>
    </Modal>
  )
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function PerfilMVZEdit() {
  const router  = useRouter()
  const isDark  = useColorScheme() === 'dark'
  const insets  = useSafeAreaInsets()
  const t       = isDark ? C.dark : C.light

  const goBack = () => router.back()

  const [role]      = useState<UserRole>('mvz_titular')
  const perm        = PERMS[role]
  const [isSaving,  setIsSaving]  = useState(false)
  const [saveError, setSaveError] = useState('')
  const [showToast, setShowToast] = useState(false)
  const [form,      setForm]      = useState<Form>(EMPTY_FORM)

  // Lists
  const [especialidades,  setEspecialidades]  = useState<string[]>([])
  const [estudios,        setEstudios]        = useState<EstudioItem[]>([])
  const [experiencias,    setExperiencias]    = useState<ExpItem[]>([])
  const [certificaciones, setCertificaciones] = useState<CertItem[]>([])
  const [clientes,        setClientes]        = useState<ClienteItem[]>([])
  const [servicios,       setServicios]       = useState<ServicioItem[]>([])
  const [newEsp,          setNewEsp]          = useState('')

  // TODO: conectar Supabase — cargar mvz_extended_profiles y poblar form + listas aquí

  // Panels
  const [estudioPanel,  setEstudioPanel]  = useState(false)
  const [expPanel,      setExpPanel]      = useState(false)
  const [certPanel,     setCertPanel]     = useState(false)
  const [clientePanel,  setClientePanel]  = useState(false)
  const [servicioPanel, setServicioPanel] = useState(false)

  const [editEstudio,  setEditEstudio]  = useState<EstudioItem|null>(null)
  const [editExp,      setEditExp]      = useState<ExpItem|null>(null)
  const [editCert,     setEditCert]     = useState<CertItem|null>(null)
  const [editCliente,  setEditCliente]  = useState<ClienteItem|null>(null)
  const [editServicio, setEditServicio] = useState<ServicioItem|null>(null)

  const [tmpEstudio,  setTmpEstudio]  = useState<EstudioItem>({id:'',grado:'',institucion:'',periodo:'',tipo:'licenciatura'})
  const [tmpExp,      setTmpExp]      = useState<ExpItem>({id:'',cargo:'',empresa:'',periodo:'',descripcion:'',activo:false})
  const [tmpCert,     setTmpCert]     = useState<CertItem>({id:'',nombre:'',vence:'',estado:'vigente'})
  const [tmpCliente,  setTmpCliente]  = useState<ClienteItem>({id:'',nombre:'',municipio:'',cabezas:'',tipo:''})
  const [tmpServicio, setTmpServicio] = useState<ServicioItem>({id:'',label:'',precio:''})

  const [confirm, setConfirm] = useState<{show:boolean;title:string;message:string;onOk:()=>void}>({
    show:false, title:'', message:'', onOk:()=>{}
  })

  const f = (k: keyof Form) => (v:string) => setForm(p=>({...p,[k]:v}))
  const uid = () => Date.now().toString()

  // ── Especialidades ────────────────────────────────────────────────────────
  const addEsp = () => {
    const esp = newEsp.trim()
    if (esp && !especialidades.includes(esp)) {
      setEspecialidades(p => [...p, esp])
      setNewEsp('')
    }
  }
  const removeEsp = (e: string) => setEspecialidades(p => p.filter(x => x !== e))

  // ── Open helpers ──────────────────────────────────────────────────────────
  const openEstudio  = (item?:EstudioItem)  => { setEditEstudio(item||null);  setTmpEstudio(item  ?? {id:uid(),grado:'',institucion:'',periodo:'',tipo:'licenciatura'}); setEstudioPanel(true)  }
  const openExp      = (item?:ExpItem)      => { setEditExp(item||null);      setTmpExp(item      ?? {id:uid(),cargo:'',empresa:'',periodo:'',descripcion:'',activo:false}); setExpPanel(true)  }
  const openCert     = (item?:CertItem)     => { setEditCert(item||null);     setTmpCert(item     ?? {id:uid(),nombre:'',vence:'',estado:'vigente'}); setCertPanel(true)     }
  const openCliente  = (item?:ClienteItem)  => { setEditCliente(item||null);  setTmpCliente(item  ?? {id:uid(),nombre:'',municipio:'',cabezas:'',tipo:''}); setClientePanel(true)  }
  const openServicio = (item?:ServicioItem) => { setEditServicio(item||null); setTmpServicio(item ?? {id:uid(),label:'',precio:''}); setServicioPanel(true) }

  // ── Save helpers ──────────────────────────────────────────────────────────
  const saveEstudio  = () => { if (!tmpEstudio.grado) return;  const it={...tmpEstudio,id:editEstudio?.id??uid()};  setEstudios(p=>editEstudio?p.map(x=>x.id===it.id?it:x):[...p,it]);  setEstudioPanel(false)  }
  const saveExp      = () => { if (!tmpExp.cargo) return;      const it={...tmpExp,id:editExp?.id??uid()};          setExperiencias(p=>editExp?p.map(x=>x.id===it.id?it:x):[...p,it]);  setExpPanel(false)      }
  const saveCert     = () => { if (!tmpCert.nombre) return;    const it={...tmpCert,id:editCert?.id??uid()};        setCertificaciones(p=>editCert?p.map(x=>x.id===it.id?it:x):[...p,it]); setCertPanel(false)  }
  const saveCliente  = () => { if (!tmpCliente.nombre) return; const it={...tmpCliente,id:editCliente?.id??uid()};  setClientes(p=>editCliente?p.map(x=>x.id===it.id?it:x):[...p,it]);  setClientePanel(false)  }
  const saveServicio = () => { if (!tmpServicio.label) return; const it={...tmpServicio,id:editServicio?.id??uid()};setServicios(p=>editServicio?p.map(x=>x.id===it.id?it:x):[...p,it]); setServicioPanel(false) }

  // ── Delete helpers ────────────────────────────────────────────────────────
  const askDel = (title:string, msg:string, onOk:()=>void) =>
    setConfirm({show:true, title, message:msg, onOk})

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (isSaving) return
    setIsSaving(true); setSaveError('')
    try {
      // Payload listo para Supabase:
      const _payload = {
        bio:                  form.descripcion          || null,
        titulo:               form.titulo               || null,
        ubicacion:            form.ubicacion            || null,
        cedula:               form.cedula               || null,
        universidad:          form.universidad          || null,
        anio_egreso:          form.anioEgreso           ? parseInt(form.anioEgreso)          : null,
        anios_exp:            form.aniosExp             ? parseInt(form.aniosExp)             : null,
        celular:              form.celular              || null,
        email_contact:        form.email                || null,
        sitio_web:            form.sitioWeb             || null,
        disponibilidad:       form.disponibilidad       || null,
        diagnostico_acertado: form.diagnosticoAcertado  ? parseInt(form.diagnosticoAcertado)  : null,
        clientes_contrato:    form.clientesContrato      ? parseInt(form.clientesContrato)      : null,
        certs_aprobados:      form.certsAprobados        ? parseInt(form.certsAprobados)        : null,
        visitas_mes:          form.visitasMes            ? parseInt(form.visitasMes)            : null,
        certs_emitidos:       form.certsEmitidos         ? parseInt(form.certsEmitidos)         : null,
        especialidades,
        estudios,
        experiencias,
        certificaciones,
        clientes,
        servicios,
        updated_at: new Date().toISOString(),
      }
      // await supabase.from('mvz_extended_profiles').upsert(_payload, { onConflict:'user_id' })
      setShowToast(true)
      setTimeout(() => { setShowToast(false); goBack() }, 2200)
    } catch (e:unknown) {
      setSaveError(e instanceof Error ? e.message : 'Error al guardar')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => setConfirm({
    show:true, title:'Descartar cambios',
    message:'Los cambios no guardados se perderán.',
    onOk: goBack,
  })

  // ── Cert helpers ──────────────────────────────────────────────────────────
  const certDotColor = (e:CertEstado) => e==='vigente'?C.brand:e==='por-vencer'?'#f59e0b':'#f43f5e'
  const certLabel    = {vigente:'Vigente','por-vencer':'Por vencer',vencido:'Vencido'}
  const tipoBg       = {licenciatura:'#0d9488',maestria:'#7c3aed',diplomado:'#d97706'}
  const tipoLbl      = {licenciatura:'Lic.',maestria:'Mtra.',diplomado:'Dip.'}

  return (
    <View style={[s.root, {backgroundColor:t.bg}]}>

      {/* ── HEADER ────────────────────────────────────────── */}
      <View style={[s.header, {paddingTop:insets.top, backgroundColor:t.surface, borderBottomColor:t.border}]}>
        <View style={s.headerRow}>
          <Pressable onPress={handleCancel} style={[s.iconBtn, {backgroundColor:t.dim}]}>
            <IArrow c={t.muted} z={14}/>
          </Pressable>
          <Text style={{flex:1,textAlign:'center',fontSize:14,fontWeight:'600',color:t.text}}>
            Editar perfil MVZ
          </Text>
          <Pressable onPress={handleSave} disabled={isSaving}
            style={[s.saveBtn, {opacity:isSaving?0.6:1}]}>
            {isSaving
              ? <ActivityIndicator size="small" color="#fff"/>
              : <ISave c="#fff" z={14}/>}
            <Text style={s.saveBtnText}>{isSaving?'Guardando…':'Guardar'}</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView style={{flex:1}}
        contentContainerStyle={{padding:20, paddingBottom:insets.bottom+40}}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">

        {saveError ? (
          <View style={{marginBottom:16,padding:12,borderRadius:12,backgroundColor:'rgba(239,68,68,0.10)',borderWidth:1,borderColor:'rgba(239,68,68,0.25)'}}>
            <Text style={{fontSize:12.5,color:'#ef4444'}}>{saveError}</Text>
          </View>
        ) : null}

        {/* ── INFORMACIÓN PERSONAL ─────────────────────────── */}
        <Section label="Información personal" locked={!perm.basicInfo} icon={<IPerson c={C.brand} z={13}/>}>
          <Field label="Nombre completo *"     value={form.nombre}      onChange={f('nombre')}      placeholder="Dr. Alejandro Vega Morales" required   disabled={!perm.basicInfo}/>
          <Field label="Título profesional"    value={form.titulo}      onChange={f('titulo')}      placeholder="Médico Veterinario Zootecnista"          disabled={!perm.basicInfo}/>
          <View style={s.row2}>
            <View style={{flex:1}}><Field label="Ubicación"   value={form.ubicacion}   onChange={f('ubicacion')}   placeholder="Chihuahua, México"     disabled={!perm.basicInfo}/></View>
            <View style={{flex:1}}><Field label="Cédula Prof." value={form.cedula}     onChange={f('cedula')}      placeholder="4872310"               disabled={!perm.basicInfo}/></View>
          </View>
          <Field label="Universidad de egreso" value={form.universidad} onChange={f('universidad')} placeholder="UACH"                                   disabled={!perm.basicInfo}/>
          <View style={s.row2}>
            <View style={{flex:1}}><Field label="Año de egreso" value={form.anioEgreso} onChange={f('anioEgreso')} placeholder="2004" keyboardType="numeric" disabled={!perm.basicInfo}/></View>
            <View style={{flex:1}}><Field label="Años de exp."  value={form.aniosExp}   onChange={f('aniosExp')}   placeholder="21"   keyboardType="numeric" disabled={!perm.basicInfo}/></View>
          </View>
          <Field label="Descripción profesional" value={form.descripcion} onChange={f('descripcion')} placeholder="Médico Veterinario Zootecnista especializado en…" multiline disabled={!perm.basicInfo}/>
        </Section>

        {/* ── ESPECIALIDADES ───────────────────────────────── */}
        <Section label="Especialidades" locked={!perm.especialidades} icon={<IShield c={C.brand} z={13}/>}>
          <View style={{flexDirection:'row',flexWrap:'wrap',gap:8,marginBottom:14}}>
            {especialidades.map(e => (
              <View key={e} style={{flexDirection:'row',alignItems:'center',gap:5,paddingHorizontal:10,paddingVertical:5,borderRadius:99,backgroundColor:`${C.brand}12`,borderWidth:1,borderColor:`${C.brand}28`}}>
                <Text style={{fontSize:11.5,fontWeight:'500',color:C.brand}}>{e}</Text>
                {perm.especialidades && (
                  <Pressable onPress={() => removeEsp(e)} hitSlop={8}>
                    <IClose c={C.brand} z={10}/>
                  </Pressable>
                )}
              </View>
            ))}
            {especialidades.length === 0 && (
              <Text style={{fontSize:13,color:t.muted}}>Sin especialidades — añade la primera</Text>
            )}
          </View>
          {perm.especialidades && (
            <View style={{flexDirection:'row',gap:8}}>
              <TextInput
                value={newEsp} onChangeText={setNewEsp}
                placeholder="Nueva especialidad…" placeholderTextColor={t.sub}
                onSubmitEditing={addEsp} returnKeyType="done"
                style={[s.input, {flex:1,height:40,backgroundColor:t.input,borderColor:t.border,color:t.text}]}
              />
              <Pressable onPress={addEsp} style={[s.addInlineBtn, {opacity:newEsp.trim()?1:0.4}]}>
                <IPlus c="#fff" z={14}/>
              </Pressable>
            </View>
          )}
        </Section>

        {/* ── FORMACIÓN ACADÉMICA ──────────────────────────── */}
        <Section label="Formación académica" locked={!perm.formacion} icon={<IBook c={C.brand} z={13}/>}>
          {estudios.map((e,i) => (
            <View key={e.id}>
              <View style={{flexDirection:'row',alignItems:'center',gap:10,paddingVertical:11}}>
                <View style={{width:32,height:32,borderRadius:8,backgroundColor:tipoBg[e.tipo],alignItems:'center',justifyContent:'center',flexShrink:0}}>
                  <Text style={{fontSize:9,fontWeight:'800',color:'#fff'}}>{tipoLbl[e.tipo]}</Text>
                </View>
                <View style={{flex:1,minWidth:0}}>
                  <Text style={{fontSize:13,fontWeight:'500',color:t.text}} numberOfLines={1}>{e.grado}</Text>
                  <Text style={{fontSize:11.5,color:t.muted}}>{e.institucion} · {e.periodo}</Text>
                </View>
                {perm.formacion && <RowActions onEdit={()=>openEstudio(e)} onDelete={()=>askDel('¿Eliminar estudio?','Esta acción no se puede deshacer.',()=>setEstudios(p=>p.filter(x=>x.id!==e.id)))}/>}
              </View>
              {i < estudios.length-1 && <View style={{height:1,backgroundColor:t.dim}}/>}
            </View>
          ))}
          {estudios.length===0 && <Text style={{fontSize:13,color:t.muted,paddingVertical:6}}>Sin estudios registrados</Text>}
          {perm.formacion && <AddButton label="Agregar estudio" onPress={()=>openEstudio()}/>}
        </Section>

        {/* ── EXPERIENCIA PROFESIONAL ──────────────────────── */}
        <Section label="Experiencia profesional" locked={!perm.experiencia} icon={<IBrief c={C.brand} z={13}/>}>
          {experiencias.map((e,i) => (
            <View key={e.id}>
              <View style={{flexDirection:'row',alignItems:'center',gap:10,paddingVertical:11}}>
                <View style={{width:8,height:8,borderRadius:4,marginLeft:4,
                  backgroundColor: e.activo ? C.brand : 'transparent',
                  borderWidth:2, borderColor: e.activo ? C.brand : isDark?'#57534e':'#a8a29e',
                  flexShrink:0}}/>
                <View style={{flex:1,minWidth:0}}>
                  <View style={{flexDirection:'row',alignItems:'center',gap:6,marginBottom:1}}>
                    <Text style={{fontSize:13,fontWeight:'500',color:t.text,flex:1}} numberOfLines={1}>{e.cargo}</Text>
                    {e.activo && (
                      <View style={{paddingHorizontal:6,paddingVertical:2,borderRadius:99,backgroundColor:`${C.brand}12`,borderWidth:1,borderColor:`${C.brand}28`}}>
                        <Text style={{fontSize:9,fontWeight:'700',color:C.brand}}>Actual</Text>
                      </View>
                    )}
                  </View>
                  <Text style={{fontSize:11.5,fontWeight:'500',color:C.brand}} numberOfLines={1}>{e.empresa}</Text>
                  <Text style={{fontSize:11,color:t.muted}}>{e.periodo}</Text>
                </View>
                {perm.experiencia && <RowActions onEdit={()=>openExp(e)} onDelete={()=>askDel('¿Eliminar experiencia?','Esta acción no se puede deshacer.',()=>setExperiencias(p=>p.filter(x=>x.id!==e.id)))}/>}
              </View>
              {i < experiencias.length-1 && <View style={{height:1,backgroundColor:t.dim}}/>}
            </View>
          ))}
          {experiencias.length===0 && <Text style={{fontSize:13,color:t.muted,paddingVertical:6}}>Sin experiencias registradas</Text>}
          {perm.experiencia && <AddButton label="Agregar experiencia" onPress={()=>openExp()}/>}
        </Section>

        {/* ── CERTIFICACIONES ──────────────────────────────── */}
        <Section label="Certificaciones y habilitaciones" locked={!perm.certificaciones} icon={<IBadge c={C.brand} z={13}/>}>
          {certificaciones.map((c,i) => (
            <View key={c.id}>
              <View style={{flexDirection:'row',alignItems:'center',gap:10,paddingVertical:11}}>
                <View style={{width:7,height:7,borderRadius:4,marginLeft:4,backgroundColor:certDotColor(c.estado),flexShrink:0}}/>
                <View style={{flex:1,minWidth:0}}>
                  <Text style={{fontSize:13,fontWeight:'500',color:t.text}} numberOfLines={1}>{c.nombre}</Text>
                  <Text style={{fontSize:11,color:t.muted}}>Vence: {c.vence}</Text>
                </View>
                <View style={{paddingHorizontal:7,paddingVertical:3,borderRadius:99,backgroundColor:`${certDotColor(c.estado)}12`,borderWidth:1,borderColor:`${certDotColor(c.estado)}30`}}>
                  <Text style={{fontSize:10,fontWeight:'600',color:certDotColor(c.estado)}}>{certLabel[c.estado]}</Text>
                </View>
                {perm.certificaciones && <RowActions onEdit={()=>openCert(c)} onDelete={()=>askDel('¿Eliminar certificación?','Esta acción no se puede deshacer.',()=>setCertificaciones(p=>p.filter(x=>x.id!==c.id)))}/>}
              </View>
              {i < certificaciones.length-1 && <View style={{height:1,backgroundColor:t.dim}}/>}
            </View>
          ))}
          {certificaciones.length===0 && <Text style={{fontSize:13,color:t.muted,paddingVertical:6}}>Sin certificaciones registradas</Text>}
          {perm.certificaciones && <AddButton label="Agregar certificación" onPress={()=>openCert()}/>}
        </Section>

        {/* ── CLIENTES GANADEROS ───────────────────────────── */}
        <Section label="Clientes ganaderos activos" locked={!perm.clientes} icon={<IHome c={C.brand} z={13}/>}>
          {clientes.map((cl,i) => (
            <View key={cl.id}>
              <View style={{flexDirection:'row',alignItems:'center',gap:10,paddingVertical:11}}>
                <View style={{width:34,height:34,borderRadius:10,backgroundColor:isDark?'rgba(255,255,255,0.06)':'#f4f2ef',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                  <IHome c={isDark?'#a8a29e':'#78716c'} z={14}/>
                </View>
                <View style={{flex:1,minWidth:0}}>
                  <Text style={{fontSize:13,fontWeight:'500',color:t.text}} numberOfLines={1}>{cl.nombre}</Text>
                  <Text style={{fontSize:11.5,color:t.muted}}>{cl.municipio} · {cl.cabezas} cab. · {cl.tipo}</Text>
                </View>
                {perm.clientes && <RowActions onEdit={()=>openCliente(cl)} onDelete={()=>askDel('¿Eliminar cliente?','Esta acción no se puede deshacer.',()=>setClientes(p=>p.filter(x=>x.id!==cl.id)))}/>}
              </View>
              {i < clientes.length-1 && <View style={{height:1,backgroundColor:t.dim}}/>}
            </View>
          ))}
          {clientes.length===0 && <Text style={{fontSize:13,color:t.muted,paddingVertical:6}}>Sin clientes registrados</Text>}
          {perm.clientes && <AddButton label="Agregar cliente" onPress={()=>openCliente()}/>}
        </Section>

        {/* ── SERVICIOS PROFESIONALES ──────────────────────── */}
        <Section label="Servicios profesionales" locked={!perm.servicios} icon={<IDollar c={C.brand} z={13}/>}>
          {servicios.map((sv,i) => (
            <View key={sv.id}>
              <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingVertical:11,gap:10}}>
                <Text style={{fontSize:13,fontWeight:'500',color:t.text,flex:1}} numberOfLines={1}>{sv.label}</Text>
                <Text style={{fontSize:13,fontWeight:'600',color:C.brand,flexShrink:0}}>{sv.precio}</Text>
                {perm.servicios && <RowActions onEdit={()=>openServicio(sv)} onDelete={()=>askDel('¿Eliminar servicio?','Esta acción no se puede deshacer.',()=>setServicios(p=>p.filter(x=>x.id!==sv.id)))}/>}
              </View>
              {i < servicios.length-1 && <View style={{height:1,backgroundColor:t.dim}}/>}
            </View>
          ))}
          {servicios.length===0 && <Text style={{fontSize:13,color:t.muted,paddingVertical:6}}>Sin servicios registrados</Text>}
          {perm.servicios && <AddButton label="Agregar servicio" onPress={()=>openServicio()}/>}
        </Section>

        {/* ── INDICADORES ──────────────────────────────────── */}
        <Section label="Indicadores de práctica" locked={!perm.indicadores} icon={<ITrend c={C.brand} z={13}/>}>
          <View style={s.row2}>
            <View style={{flex:1}}><Field label="Diagnóstico acertado (%)" value={form.diagnosticoAcertado} onChange={f('diagnosticoAcertado')} placeholder="96" keyboardType="numeric" disabled={!perm.indicadores}/></View>
            <View style={{flex:1}}><Field label="Clientes con contrato (%)" value={form.clientesContrato}   onChange={f('clientesContrato')}   placeholder="72" keyboardType="numeric" disabled={!perm.indicadores}/></View>
          </View>
          <View style={s.row2}>
            <View style={{flex:1}}><Field label="Certs. sin rechazo (%)"   value={form.certsAprobados}      onChange={f('certsAprobados')}      placeholder="99" keyboardType="numeric" disabled={!perm.indicadores}/></View>
            <View style={{flex:1}}><Field label="Visitas / mes"            value={form.visitasMes}          onChange={f('visitasMes')}          placeholder="48" keyboardType="numeric" disabled={!perm.indicadores}/></View>
          </View>
          <View style={{width:'50%',paddingRight:5}}>
            <Field label="Certs. emitidos (acum.)" value={form.certsEmitidos} onChange={f('certsEmitidos')} placeholder="124" keyboardType="numeric" disabled={!perm.indicadores}/>
          </View>
        </Section>

        {/* ── CONTACTO ─────────────────────────────────────── */}
        <Section label="Contacto" locked={!perm.contacto} icon={<IPhone c={C.brand} z={13}/>}>
          <View style={s.row2}>
            <View style={{flex:1}}><Field label="Celular / WhatsApp" value={form.celular}        onChange={f('celular')}        placeholder="+52 614 555 7890"     keyboardType="phone-pad"     disabled={!perm.contacto}/></View>
            <View style={{flex:1}}><Field label="Email"              value={form.email}          onChange={f('email')}          placeholder="dr.vega@mvz-norte.mx" keyboardType="email-address" disabled={!perm.contacto}/></View>
          </View>
          <View style={s.row2}>
            <View style={{flex:1}}><Field label="Sitio web"          value={form.sitioWeb}       onChange={f('sitioWeb')}       placeholder="www.mvz-norte.mx"     keyboardType="url"           disabled={!perm.contacto}/></View>
            <View style={{flex:1}}><Field label="Disponibilidad"     value={form.disponibilidad} onChange={f('disponibilidad')} placeholder="Lun–Sáb: 7:00–18:00"                              disabled={!perm.contacto}/></View>
          </View>
        </Section>

        {/* Permisos banner */}
        <View style={{flexDirection:'row',alignItems:'flex-start',gap:12,padding:14,borderRadius:16,backgroundColor:`${C.brand}09`,borderWidth:1,borderColor:`${C.brand}18`,marginBottom:10}}>
          <IInfo c={C.brand} z={14}/>
          <Text style={{flex:1,fontSize:12,color:t.muted,lineHeight:18}}>
            Editando como <Text style={{fontWeight:'600',color:t.text}}>{ROLE_LABELS[role]}</Text>. Las secciones bloqueadas están marcadas con el ícono de candado.
          </Text>
        </View>
      </ScrollView>

      {/* ── BOTTOM SHEET: ESTUDIO ────────────────────────── */}
      <BottomSheet show={estudioPanel} title={editEstudio?'Editar estudio':'Agregar estudio'} onClose={()=>setEstudioPanel(false)} onSave={saveEstudio}>
        <Field label="Grado / Título *"  value={tmpEstudio.grado}       onChange={v=>setTmpEstudio(p=>({...p,grado:v}))}       placeholder="Ej: Maestría en Producción Animal" required/>
        <Field label="Institución"       value={tmpEstudio.institucion} onChange={v=>setTmpEstudio(p=>({...p,institucion:v}))} placeholder="Ej: UNAM"/>
        <Field label="Período"           value={tmpEstudio.periodo}     onChange={v=>setTmpEstudio(p=>({...p,periodo:v}))}     placeholder="Ej: 2005 – 2007"/>
        <TipoPicker value={tmpEstudio.tipo} onChange={v=>setTmpEstudio(p=>({...p,tipo:v}))}/>
      </BottomSheet>

      {/* ── BOTTOM SHEET: EXPERIENCIA ────────────────────── */}
      <BottomSheet show={expPanel} title={editExp?'Editar experiencia':'Agregar experiencia'} onClose={()=>setExpPanel(false)} onSave={saveExp}>
        <Field label="Cargo / Puesto *"          value={tmpExp.cargo}       onChange={v=>setTmpExp(p=>({...p,cargo:v}))}       placeholder="Ej: Consultor Veterinario" required/>
        <Field label="Empresa / Organización"    value={tmpExp.empresa}     onChange={v=>setTmpExp(p=>({...p,empresa:v}))}     placeholder="Ej: Consultoría Vega MVZ"/>
        <Field label="Período"                   value={tmpExp.periodo}     onChange={v=>setTmpExp(p=>({...p,periodo:v}))}     placeholder="Ej: 2010 – Presente"/>
        <Field label="Descripción"               value={tmpExp.descripcion} onChange={v=>setTmpExp(p=>({...p,descripcion:v}))} placeholder="Describe las responsabilidades del cargo…" multiline/>
        <Pressable onPress={() => setTmpExp(p=>({...p,activo:!p.activo}))}
          style={{flexDirection:'row',alignItems:'center',gap:12,padding:12,borderRadius:12,backgroundColor:isDark?'rgba(255,255,255,0.04)':'#f5f4f3',marginBottom:6}}>
          <Switch
            value={tmpExp.activo} onValueChange={v=>setTmpExp(p=>({...p,activo:v}))}
            trackColor={{false:isDark?'#3c3836':'#d6d3d1', true:`${C.brand}55`}}
            thumbColor={tmpExp.activo?C.brand:'#a8a29e'} ios_backgroundColor={isDark?'#3c3836':'#d6d3d1'}/>
          <Text style={{fontSize:12.5,fontWeight:'500',color:isDark?C.dark.text:C.light.text}}>Puesto actual (trabajo vigente)</Text>
        </Pressable>
      </BottomSheet>

      {/* ── BOTTOM SHEET: CERTIFICACIÓN ──────────────────── */}
      <BottomSheet show={certPanel} title={editCert?'Editar certificación':'Agregar certificación'} onClose={()=>setCertPanel(false)} onSave={saveCert}>
        <Field label="Nombre de la certificación *" value={tmpCert.nombre} onChange={v=>setTmpCert(p=>({...p,nombre:v}))} placeholder="Ej: SENASICA — Médico Acreditado" required/>
        <Field label="Fecha de vencimiento"         value={tmpCert.vence}  onChange={v=>setTmpCert(p=>({...p,vence:v}))}  placeholder="Ej: Dic 2026 o Permanente"/>
        <EstadoPicker value={tmpCert.estado} onChange={v=>setTmpCert(p=>({...p,estado:v}))}/>
      </BottomSheet>

      {/* ── BOTTOM SHEET: CLIENTE ────────────────────────── */}
      <BottomSheet show={clientePanel} title={editCliente?'Editar cliente':'Agregar cliente'} onClose={()=>setClientePanel(false)} onSave={saveCliente}>
        <Field label="Nombre del rancho / empresa *" value={tmpCliente.nombre}    onChange={v=>setTmpCliente(p=>({...p,nombre:v}))}    placeholder="Ej: Rancho El Búfalo Dorado" required/>
        <Field label="Municipio y estado"            value={tmpCliente.municipio} onChange={v=>setTmpCliente(p=>({...p,municipio:v}))} placeholder="Ej: Durango, Dgo."/>
        <Field label="Cabezas de ganado"             value={tmpCliente.cabezas}   onChange={v=>setTmpCliente(p=>({...p,cabezas:v}))}   placeholder="Ej: 1,450" keyboardType="numeric"/>
        <Field label="Tipo de operación"             value={tmpCliente.tipo}      onChange={v=>setTmpCliente(p=>({...p,tipo:v}))}      placeholder="Ej: Engorda, Exportación, Cría"/>
      </BottomSheet>

      {/* ── BOTTOM SHEET: SERVICIO ───────────────────────── */}
      <BottomSheet show={servicioPanel} title={editServicio?'Editar servicio':'Agregar servicio'} onClose={()=>setServicioPanel(false)} onSave={saveServicio}>
        <Field label="Nombre del servicio *" value={tmpServicio.label}  onChange={v=>setTmpServicio(p=>({...p,label:v}))}  placeholder="Ej: Consulta a domicilio" required/>
        <Field label="Precio / Tarifa *"     value={tmpServicio.precio} onChange={v=>setTmpServicio(p=>({...p,precio:v}))} placeholder="Ej: $1,200 / visita"     required/>
      </BottomSheet>

      {/* ── CONFIRM ──────────────────────────────────────── */}
      <ConfirmDialog
        show={confirm.show} title={confirm.title} message={confirm.message}
        onConfirm={() => { confirm.onOk(); setConfirm(c=>({...c,show:false})) }}
        onCancel={() => setConfirm(c=>({...c,show:false}))}
      />

      {/* ── TOAST ────────────────────────────────────────── */}
      <Toast show={showToast}/>
    </View>
  )
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:      {flex:1},
  header:    {borderBottomWidth:1},
  headerRow: {flexDirection:'row',alignItems:'center',paddingHorizontal:14,paddingBottom:10,minHeight:54},
  iconBtn:   {width:34,height:34,borderRadius:10,alignItems:'center',justifyContent:'center'},
  saveBtn:   {flexDirection:'row',alignItems:'center',gap:6,paddingHorizontal:14,paddingVertical:9,borderRadius:12,backgroundColor:'#1c1917'},
  saveBtnText:{fontSize:12.5,fontWeight:'600',color:'#fff'},
  card:      {borderWidth:1,borderRadius:18,overflow:'hidden'},
  secHeader: {flexDirection:'row',alignItems:'center',gap:10,paddingHorizontal:14,paddingVertical:12,borderBottomWidth:1},
  secIconWrap:{width:30,height:30,borderRadius:8,alignItems:'center',justifyContent:'center'},
  secTitle:  {fontSize:13,fontWeight:'600'},
  input:     {borderWidth:1,borderRadius:12,paddingHorizontal:13,fontSize:13},
  row2:      {flexDirection:'row',gap:10},
  addBtn:    {flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8,paddingVertical:11,borderRadius:12,borderWidth:1,borderStyle:'dashed'},
  addInlineBtn:{width:40,height:40,borderRadius:12,backgroundColor:C.brand,alignItems:'center',justifyContent:'center'},
  rowBtn:    {width:30,height:30,borderRadius:8,alignItems:'center',justifyContent:'center'},
  overlay:   {...StyleSheet.absoluteFillObject,backgroundColor:'rgba(0,0,0,0.45)',justifyContent:'flex-end'},
  sheet:     {position:'absolute',bottom:0,left:0,right:0,borderTopLeftRadius:24,borderTopRightRadius:24},
  sheetHeader:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:16,paddingBottom:12,borderBottomWidth:1},
  closeBtn:  {width:32,height:32,borderRadius:8,alignItems:'center',justifyContent:'center'},
  sheetFooter:{flexDirection:'row',gap:10,paddingHorizontal:16,paddingTop:12,borderTopWidth:1},
  sheetCancelBtn:{flex:1,height:42,borderRadius:12,borderWidth:1,alignItems:'center',justifyContent:'center'},
  sheetSaveBtn:  {flex:1,height:42,borderRadius:12,backgroundColor:C.brand,alignItems:'center',justifyContent:'center'},
  dialog:    {marginHorizontal:28,borderRadius:20,overflow:'hidden',shadowColor:'#000',shadowOpacity:0.2,shadowRadius:20,elevation:10},
  dialogActions:{flexDirection:'row',borderTopWidth:1},
  dialogBtn: {flex:1,paddingVertical:14,alignItems:'center'},
  toast:     {position:'absolute',bottom:32,alignSelf:'center',flexDirection:'row',alignItems:'center',gap:12,paddingHorizontal:18,paddingVertical:12,borderRadius:18,shadowColor:'#000',shadowOpacity:0.15,shadowRadius:16,elevation:8},
})