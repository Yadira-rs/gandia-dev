/**
 * GANDIA — PerfilMVZ (React Native)
 * app/(app)/InstitucionalPerfil/MVZ/index.tsx
 *
 * Perfil de Médico Veterinario Zootecnista — solo frontend.
 * TODO: conectar Supabase y UserContext cuando proceda.
 */

import React, { useState } from 'react'
import {
  View, Text, ScrollView, Pressable,
  StyleSheet, useColorScheme, Linking,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import Svg, {
  Path, Polyline, Line, Rect, Circle,
  Defs, Pattern as SvgPattern,
} from 'react-native-svg'

// ─── TOKENS ──────────────────────────────────────────────────────────────────
const BRAND = '#2FAF8F'
const HERO  = '#0e1e1a'

const DARK = {
  bg:      '#0c0a09',
  surface: '#141210',
  border:  'rgba(255,255,255,0.09)',
  text:    '#fafaf9',
  muted:   '#a8a29e',
  dim:     'rgba(255,255,255,0.07)',
}
const LIGHT = {
  bg:      '#fafaf9',
  surface: '#ffffff',
  border:  'rgba(0,0,0,0.08)',
  text:    '#1c1917',
  muted:   '#78716c',
  dim:     'rgba(0,0,0,0.055)',
}

// ─── DEFAULT DATA (fallback mientras no hay Supabase) ────────────────────────
type CertStatus  = 'vigente' | 'por-vencer' | 'vencido'
type EstudioTipo = 'licenciatura' | 'maestria' | 'diplomado'

const DEFAULT_ESTUDIOS = [
  { id:'1', grado:'Médico Veterinario Zootecnista',              institucion:'UACH',                periodo:'1999 – 2004', tipo:'licenciatura' as EstudioTipo },
  { id:'2', grado:'Maestría en Producción Animal',               institucion:'UNAM',                periodo:'2005 – 2007', tipo:'maestria'     as EstudioTipo },
  { id:'3', grado:'Diplomado en Bienestar Animal y Exportación', institucion:'FMVZ-UNAM / SENASICA',periodo:'2012',        tipo:'diplomado'    as EstudioTipo },
  { id:'4', grado:'Certificación Trazabilidad SINIIGA',          institucion:'SAGARPA / SENASICA',  periodo:'2015',        tipo:'diplomado'    as EstudioTipo },
]
const DEFAULT_EXPERIENCIAS = [
  { id:'1', cargo:'Consultor Veterinario Independiente', empresa:'Consultoría Vega MVZ',                       periodo:'2010 – Presente', descripcion:'Consultoría a productores del norte de México en sanidad, nutrición y certificación para exportación.', activo:true  },
  { id:'2', cargo:'Médico Veterinario de Planta',        empresa:'Exportadora Ganadera del Norte S.A. de C.V.',periodo:'2007 – 2010',     descripcion:'Responsable de sanidad animal, certificación zoosanitaria y normativas de exportación.',                   activo:false },
  { id:'3', cargo:'Veterinario de Campo',                empresa:'Unión Ganadera Regional de Chihuahua',       periodo:'2004 – 2007',     descripcion:'Atención a socios ganaderos, campañas de vacunación estatales y programas de salud herd.',                  activo:false },
]
const DEFAULT_CERTS = [
  { id:'1', nombre:'SENASICA — Médico Acreditado',            vence:'Dic 2026',   estado:'vigente'    as CertStatus },
  { id:'2', nombre:'Certificador Zoosanitario Internacional', vence:'Jun 2026',   estado:'vigente'    as CertStatus },
  { id:'3', nombre:'USDA / APHIS — Acreditado MX',           vence:'Mar 2026',   estado:'por-vencer' as CertStatus },
  { id:'4', nombre:'Bienestar Animal NOM-051',                vence:'Sep 2026',   estado:'vigente'    as CertStatus },
  { id:'5', nombre:'SINIIGA Trazabilidad',                    vence:'Permanente', estado:'vigente'    as CertStatus },
]
const DEFAULT_CLIENTES = [
  { id:'1', nombre:'Rancho El Búfalo Dorado', municipio:'Durango, Dgo.',     cabezas:'1,450', tipo:'Engorda'        },
  { id:'2', nombre:'Ganadera del Bravo',      municipio:'Cd. Juárez, Chih.', cabezas:'3,100', tipo:'Ciclo Completo' },
  { id:'3', nombre:'Rancho Los Álamos',       municipio:'Chihuahua, Chih.',  cabezas:'2,400', tipo:'Exportación'    },
  { id:'4', nombre:'Productores Norte S.C.',  municipio:'Delicias, Chih.',   cabezas:'5,200', tipo:'Engorda'        },
  { id:'5', nombre:'Rancho La Esperanza',     municipio:'Parral, Chih.',     cabezas:'890',   tipo:'Cría'           },
]
const DEFAULT_SERVICIOS = [
  { id:'1', label:'Consulta a domicilio',     precio:'$1,200 / visita' },
  { id:'2', label:'Certificado zoosanitario', precio:'$450 / lote'     },
  { id:'3', label:'Protocolo de vacunación',  precio:'Desde $8,000'    },
  { id:'4', label:'Diagnóstico laboratorial', precio:'Desde $600'      },
  { id:'5', label:'Asesoría nutricional',     precio:'$3,500 / mes'    },
  { id:'6', label:'Revisión pre-embarque',    precio:'$2,800 / lote'   },
]
const DEFAULT_ESPECIALIDADES = [
  'Bovinos de Carne','Producción Intensiva','Sanidad Preventiva',
  'Diagnóstico Clínico','Nutrición Animal','Bienestar Animal',
  'Certificación para Exportación','Reproducción Bovina',
  'Enfermedades Infecciosas','Parasitología',
]
const DEFAULT_ESTADOS = ['Chihuahua','Durango','Sonora','Sinaloa','Coahuila','Nuevo León']

// ─── ICONS ───────────────────────────────────────────────────────────────────
const SP = { strokeLinecap:'round' as const, strokeLinejoin:'round' as const }
const IEdit  = ({c='#fff', z=14}) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke={c} strokeWidth={1.65} {...SP}/><Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const IPin   = ({c=BRAND, z=11})  => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke={c} strokeWidth={1.65} {...SP}/><Circle cx="12" cy="10" r="3" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const ISpark = ({c=BRAND, z=11})  => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const IChevR = ({c='#a8a29e', z=14}) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Polyline points="9 18 15 12 9 6" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const IPhone = ({c='#78716c', z=15}) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.11 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3 1.31h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L7.09 9.09a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const IMail  = ({c='#78716c', z=15}) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke={c} strokeWidth={1.65} {...SP}/><Polyline points="22,6 12,13 2,6" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const IGlobe = ({c='#78716c', z=15}) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Circle cx="12" cy="12" r="10" stroke={c} strokeWidth={1.65} {...SP}/><Line x1="2" y1="12" x2="22" y2="12" stroke={c} strokeWidth={1.65} {...SP}/><Path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10A15.3 15.3 0 0 1 12 2z" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const IClock = ({c='#78716c', z=15}) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Circle cx="12" cy="12" r="10" stroke={c} strokeWidth={1.65} {...SP}/><Polyline points="12 6 12 12 16 14" stroke={c} strokeWidth={1.65} {...SP}/></Svg>
const IHome  = ({c='#78716c', z=14}) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none"><Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke={c} strokeWidth={1.65} {...SP}/><Polyline points="9 22 9 12 15 12 15 22" stroke={c} strokeWidth={1.65} {...SP}/></Svg>

// ─── PRIMITIVES ──────────────────────────────────────────────────────────────
function useT() {
  return useColorScheme() === 'dark' ? DARK : LIGHT
}

function Card({ children, style }: { children: React.ReactNode; style?: object }) {
  const t = useT()
  return (
    <View style={[{
      backgroundColor: t.surface,
      borderWidth: 1,
      borderColor: t.border,
      borderRadius: 16,
      overflow: 'hidden',
    }, style]}>
      {children}
    </View>
  )
}

function SectionLabel({ text }: { text: string }) {
  const t = useT()
  return (
    <View style={{ flexDirection:'row', alignItems:'center', gap:10, marginBottom:12 }}>
      <ISpark c={BRAND} z={11} />
      <Text style={{ fontSize:10, fontWeight:'600', letterSpacing:1.1, textTransform:'uppercase', color:t.muted }}>
        {text}
      </Text>
      <View style={{ flex:1, height:1, backgroundColor:t.dim }} />
    </View>
  )
}

function Divider() {
  const t = useT()
  return <View style={{ height:1, backgroundColor:t.dim }} />
}

function KPIBar({ label, value }: { label: string; value: number }) {
  const t = useT()
  return (
    <View style={{ marginBottom:14 }}>
      <View style={{ flexDirection:'row', justifyContent:'space-between', marginBottom:6 }}>
        <Text style={{ fontSize:12, color:t.muted }}>{label}</Text>
        <Text style={{ fontSize:12, fontWeight:'600', color:BRAND }}>{value}%</Text>
      </View>
      <View style={{ height:5, backgroundColor:t.dim, borderRadius:3, overflow:'hidden' }}>
        <View style={{ height:5, width:`${value}%` as any, backgroundColor:BRAND, borderRadius:3 }} />
      </View>
    </View>
  )
}

function CertRow({ nombre, vence, estado }: { nombre:string; vence:string; estado:CertStatus }) {
  const t   = useT()
  const col = estado==='vigente' ? BRAND : estado==='por-vencer' ? '#f59e0b' : '#f43f5e'
  const lbl = { vigente:'Vigente', 'por-vencer':'Por vencer', vencido:'Vencido' }[estado]
  return (
    <View style={{ flexDirection:'row', alignItems:'center', gap:12, paddingVertical:12, paddingHorizontal:16 }}>
      <View style={{ width:7, height:7, borderRadius:4, backgroundColor:col }} />
      <View style={{ flex:1 }}>
        <Text style={{ fontSize:13, fontWeight:'500', color:t.text }} numberOfLines={1}>{nombre}</Text>
        <Text style={{ fontSize:11, color:t.muted, marginTop:2 }}>Vence: {vence}</Text>
      </View>
      <View style={{ paddingHorizontal:8, paddingVertical:3, borderRadius:99, backgroundColor:`${col}14`, borderWidth:1, borderColor:`${col}30` }}>
        <Text style={{ fontSize:10, fontWeight:'600', color:col }}>{lbl}</Text>
      </View>
    </View>
  )
}

function TimelineItem({ title, sub, period, detail, last=false, badge }: {
  title:string; sub:string; period:string; detail?:string; last?:boolean; badge?:string
}) {
  const t = useT()
  return (
    <View style={{ flexDirection:'row', gap:14 }}>
      <View style={{ alignItems:'center', width:10 }}>
        <View style={{ width:10, height:10, borderRadius:5, backgroundColor:BRAND, marginTop:3 }} />
        {!last && <View style={{ width:1, flex:1, backgroundColor:t.dim, marginTop:4 }} />}
      </View>
      <View style={{ flex:1, paddingBottom: last ? 0 : 20 }}>
        <View style={{ flexDirection:'row', alignItems:'flex-start', justifyContent:'space-between', gap:8, marginBottom:2 }}>
          <Text style={{ flex:1, fontSize:13, fontWeight:'600', color:t.text, lineHeight:18 }}>{title}</Text>
          {badge && (
            <View style={{ paddingHorizontal:6, paddingVertical:2, borderRadius:99, backgroundColor:`${BRAND}14`, borderWidth:1, borderColor:`${BRAND}28` }}>
              <Text style={{ fontSize:9.5, fontWeight:'700', color:BRAND }}>{badge}</Text>
            </View>
          )}
        </View>
        <Text style={{ fontSize:12, fontWeight:'500', color:BRAND, marginBottom:2 }}>{sub}</Text>
        <Text style={{ fontSize:11.5, color:t.muted }}>{period}</Text>
        {detail ? <Text style={{ fontSize:12, color:t.muted, lineHeight:17, marginTop:5 }}>{detail}</Text> : null}
      </View>
    </View>
  )
}

function ServiceRow({ label, price }: { label:string; price:string }) {
  const t = useT()
  return (
    <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingVertical:13, paddingHorizontal:16 }}>
      <Text style={{ fontSize:13, color:t.muted, flex:1, marginRight:12 }}>{label}</Text>
      <Text style={{ fontSize:13, fontWeight:'600', color:BRAND }}>{price}</Text>
    </View>
  )
}

function ClienteRow({ nombre, municipio, cabezas, tipo }: { nombre:string; municipio:string; cabezas:string; tipo:string }) {
  const t = useT()
  return (
    <View style={{ flexDirection:'row', alignItems:'center', gap:12, paddingVertical:12, paddingHorizontal:16 }}>
      <View style={{ width:34, height:34, borderRadius:10, backgroundColor:t.dim, alignItems:'center', justifyContent:'center' }}>
        <IHome c={t.muted} z={14} />
      </View>
      <View style={{ flex:1 }}>
        <Text style={{ fontSize:13, fontWeight:'500', color:t.text }} numberOfLines={1}>{nombre}</Text>
        <Text style={{ fontSize:11.5, color:t.muted, marginTop:2 }}>{municipio} · {cabezas} cab.</Text>
      </View>
      <View style={{ paddingHorizontal:8, paddingVertical:3, borderRadius:99, backgroundColor:t.dim }}>
        <Text style={{ fontSize:10.5, fontWeight:'500', color:t.muted }}>{tipo}</Text>
      </View>
    </View>
  )
}

function ContactRow({ icon, label, value, href }: { icon:React.ReactNode; label:string; value:string; href:string }) {
  const t      = useT()
  const isDark = useColorScheme() === 'dark'
  return (
    <Pressable
      onPress={() => href !== '#' && Linking.openURL(href)}
      style={({ pressed }) => ({
        flexDirection:'row', alignItems:'center', gap:14,
        paddingHorizontal:16, paddingVertical:14,
        backgroundColor: pressed ? t.dim : 'transparent',
      })}
    >
      <View style={{ width:34, height:34, borderRadius:10, backgroundColor:t.dim, alignItems:'center', justifyContent:'center' }}>
        {icon}
      </View>
      <View style={{ flex:1 }}>
        <Text style={{ fontSize:9.5, fontWeight:'600', letterSpacing:0.8, textTransform:'uppercase', color:t.muted, marginBottom:3 }}>{label}</Text>
        <Text style={{ fontSize:13, fontWeight:'500', color:t.text }} numberOfLines={1}>{value}</Text>
      </View>
      <IChevR c={isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.14)'} z={14} />
    </Pressable>
  )
}

function StatPill({ label, value }: { label:string; value:string }) {
  const t = useT()
  return (
    <Card style={{ flex:1, padding:14 }}>
      <View style={{ position:'absolute', left:0, top:12, bottom:12, width:3, borderTopRightRadius:2, borderBottomRightRadius:2, backgroundColor:`${BRAND}45` }} />
      <Text style={{ fontSize:20, fontWeight:'600', letterSpacing:-0.5, color:t.text, marginBottom:4 }}>{value}</Text>
      <Text style={{ fontSize:10, fontWeight:'500', color:t.muted, lineHeight:14 }}>{label}</Text>
    </Card>
  )
}

// ─── TABS ─────────────────────────────────────────────────────────────────────
const TABS = ['general','servicios','contacto'] as const
type Tab = typeof TABS[number]

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function PerfilMVZ() {
  const router = useRouter()
  const t      = useT()
  const isDark = useColorScheme() === 'dark'
  const insets = useSafeAreaInsets()

  const [activeTab, setActiveTab] = useState<Tab>('general')

  // TODO: conectar UserContext — reemplazar constantes con datos del perfil
  // TODO: conectar Supabase — cargar mvz_extended_profiles; reemplazar defaults por datos reales

  const mvzNombre    = 'Dr. Alejandro Vega Morales'
  const mvzUbicacion = 'Chihuahua, México'
  const mvzCedula    = '4872310'
  const mvzTitulo    = 'Médico Veterinario Zootecnista'
  const mvzBio       = 'MVZ especializado en bovinos de carne y producción intensiva. Amplia experiencia en sanidad preventiva, diagnóstico clínico, nutrición animal y programas de bienestar animal para exportación. Consultor certificado ante SENASICA y acreditado para emisión de certificados zoosanitarios internacionales.'

  const estudios        = DEFAULT_ESTUDIOS
  const experiencias    = DEFAULT_EXPERIENCIAS
  const certificaciones = DEFAULT_CERTS
  const clientes        = DEFAULT_CLIENTES
  const servicios       = DEFAULT_SERVICIOS
  const especialidades  = DEFAULT_ESPECIALIDADES
  const estadosCobertura= DEFAULT_ESTADOS

  const kpi = {
    diagnostico_acertado: 96,
    clientes_contrato:    72,
    certs_aprobados:      99,
    visitas_mes:          48,
    certs_emitidos:       124,
  }

  const registroGrid: [string,string][] = [
    ['Cédula Prof.', mvzCedula],
    ['SENASICA',     '1234567'],
    ['Egreso',       '2004'],
    ['Ejercicio',    '21 años'],
  ]

  const ic = isDark ? '#a8a29e' : '#78716c'

  const contactRows = [
    { icon:<IPhone c={ic} z={15}/>, label:'Celular / WhatsApp', value:'+52 614 555 7890',    href:'tel:+526145557890'          },
    { icon:<IMail  c={ic} z={15}/>, label:'Email',              value:'dr.vega@mvz-norte.mx', href:'mailto:dr.vega@mvz-norte.mx' },
    { icon:<IGlobe c={ic} z={15}/>, label:'Sitio web',          value:'www.mvz-norte.mx',     href:'https://www.mvz-norte.mx'    },
    { icon:<IClock c={ic} z={15}/>, label:'Disponibilidad',     value:'Lun–Sáb: 7:00–18:00', href:'#'                          },
  ]

  return (
    <View style={[s.root, { backgroundColor:t.bg }]}>
      <ScrollView
        style={{ flex:1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >

        {/* ══ HERO ══════════════════════════════════════════════ */}
        <View style={[s.hero, { paddingTop: insets.top + 10 }]}>
          <View style={StyleSheet.absoluteFillObject}>
            <Svg width="100%" height="100%" viewBox="0 0 390 190">
              <Defs>
                <SvgPattern id="mvzgrid" width="28" height="28" patternUnits="userSpaceOnUse">
                  <Path d="M 28 0 L 0 0 0 28" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="0.6" />
                </SvgPattern>
              </Defs>
              <Rect width="390" height="190" fill="url(#mvzgrid)" />
            </Svg>
          </View>
          <View style={s.heroGlowR} />
          <View style={s.heroGlowL} />
          <View style={s.heroCirc1} />
          <View style={s.heroCirc2} />
          <View style={[s.heroBadgeRow, { top: insets.top + 12 }]}>
            <View style={s.heroBadge}>
              <View style={s.heroDot} />
              <Text style={s.heroBadgeText}>MVZ Activo</Text>
            </View>
            <View style={s.heroBadge}>
              <Text style={s.heroBadgeText}>SENASICA Acreditado</Text>
            </View>
          </View>
        </View>

        {/* ══ SHEET ═════════════════════════════════════════════ */}
        <View style={[s.sheet, { backgroundColor:t.bg }]}>
          <View style={{ alignItems:'center', paddingTop:10, paddingBottom:4 }}>
            <View style={{ width:32, height:3, borderRadius:2, backgroundColor: isDark?'rgba(255,255,255,0.14)':'rgba(0,0,0,0.10)' }} />
          </View>

          <View style={s.inner}>

            {/* ── IDENTITY ROW ─────────────────────────────── */}
            <View style={s.identityRow}>
              <View style={{ flexDirection:'row', alignItems:'center', gap:14, flex:1, minWidth:0 }}>
                <View style={[s.avatar, { backgroundColor:`${BRAND}22` }]}>
                  <Text style={[s.avatarLabel, { color:BRAND }]}>Dr</Text>
                </View>
                <View style={{ flex:1, minWidth:0 }}>
                  <View style={[s.roleBadge, { backgroundColor:`${BRAND}18`, borderColor:`${BRAND}28` }]}>
                    <Text style={[s.roleBadgeText, { color:BRAND }]}>{mvzTitulo}</Text>
                  </View>
                  <Text style={[s.mvzName, { color:t.text }]} numberOfLines={2}>{mvzNombre}</Text>
                </View>
              </View>
              <Pressable
                onPress={() => router.push('/(app)/InstitucionalPerfil/MVZ/editar' as any)}
                style={({ pressed }) => [s.editBtn, {
                  backgroundColor: isDark ? '#fafaf9' : '#1c1917',
                  opacity: pressed ? 0.8 : 1,
                }]}
              >
                <IEdit c={isDark ? '#1c1917' : '#fafaf9'} z={13} />
                <Text style={[s.editBtnText, { color: isDark ? '#1c1917' : '#fafaf9' }]}>Editar</Text>
              </Pressable>
            </View>

            {/* ubicación */}
            <View style={{ flexDirection:'row', alignItems:'center', gap:5, marginBottom:20 }}>
              <IPin c={t.muted} z={11} />
              <Text style={{ fontSize:12, color:t.muted }}>{mvzUbicacion}</Text>
            </View>

            {/* ── TABS ─────────────────────────────────────── */}
            <View style={[s.tabBar, { borderBottomColor:t.border }]}>
              {TABS.map(tb => (
                <Pressable key={tb} onPress={() => setActiveTab(tb)} style={s.tabBtn}>
                  <Text style={[s.tabText, {
                    color:      activeTab===tb ? t.text : t.muted,
                    fontWeight: activeTab===tb ? '600'  : '400',
                  }]}>
                    {tb.charAt(0).toUpperCase() + tb.slice(1)}
                  </Text>
                  {activeTab===tb && <View style={[s.tabLine, { backgroundColor:BRAND }]} />}
                </Pressable>
              ))}
            </View>

            {/* ══ GENERAL ══════════════════════════════════════ */}
            {activeTab === 'general' && (
              <View style={{ paddingTop:20 }}>

                {/* Stats 2 × 2 */}
                <View style={{ flexDirection:'row', gap:10, marginBottom:10 }}>
                  <StatPill label="Ranchos atendidos" value="38"  />
                  <StatPill label="Animales / año"    value="12k" />
                </View>
                <View style={{ flexDirection:'row', gap:10, marginBottom:24 }}>
                  <StatPill label="Visitas / mes"      value="48" />
                  <StatPill label="Años experiencia"   value="21" />
                </View>

                {/* Bio */}
                <View style={{ marginBottom:24 }}>
                  <SectionLabel text="Sobre el MVZ" />
                  <Card style={{ padding:16 }}>
                    <Text style={{ fontSize:13, lineHeight:20, color: isDark?'rgba(255,255,255,0.65)':'#57534e' }}>
                      {mvzBio}
                    </Text>
                  </Card>
                </View>

                {/* Especialidades */}
                <View style={{ marginBottom:24 }}>
                  <SectionLabel text="Especialidades" />
                  <View style={{ flexDirection:'row', flexWrap:'wrap', gap:8 }}>
                    {especialidades.map(e => (
                      <View key={e} style={{
                        paddingHorizontal:10, paddingVertical:5, borderRadius:99,
                        backgroundColor:`${BRAND}10`, borderWidth:1, borderColor:`${BRAND}25`,
                      }}>
                        <Text style={{ fontSize:11.5, fontWeight:'500', color:BRAND }}>{e}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Formación */}
                <View style={{ marginBottom:24 }}>
                  <SectionLabel text="Formación académica" />
                  <Card style={{ padding:16 }}>
                    {estudios.map((e, i) => {
                      const badge = { licenciatura:'Lic.', maestria:'Mtra.', diplomado:'Dip.' }[e.tipo]
                      return (
                        <TimelineItem
                          key={e.id} title={e.grado} sub={e.institucion}
                          period={e.periodo} badge={badge}
                          last={i === estudios.length - 1}
                        />
                      )
                    })}
                  </Card>
                </View>

                {/* Experiencia */}
                <View style={{ marginBottom:24 }}>
                  <SectionLabel text="Experiencia profesional" />
                  <Card style={{ padding:16 }}>
                    {experiencias.map((e, i) => (
                      <TimelineItem
                        key={e.id} title={e.cargo} sub={e.empresa}
                        period={e.periodo} detail={e.descripcion}
                        badge={e.activo ? 'Actual' : undefined}
                        last={i === experiencias.length - 1}
                      />
                    ))}
                  </Card>
                </View>

                {/* Certificaciones */}
                <View style={{ marginBottom:24 }}>
                  <SectionLabel text="Certificaciones" />
                  <Card>
                    {certificaciones.map((c, i) => (
                      <View key={c.id}>
                        <CertRow nombre={c.nombre} vence={c.vence} estado={c.estado} />
                        {i < certificaciones.length - 1 && <Divider />}
                      </View>
                    ))}
                  </Card>
                </View>

                {/* Indicadores */}
                <View style={{ marginBottom:24 }}>
                  <SectionLabel text="Indicadores de práctica" />
                  <Card style={{ padding:16 }}>
                    <KPIBar label="Diagnóstico acertado"        value={kpi.diagnostico_acertado} />
                    <KPIBar label="Clientes con contrato anual" value={kpi.clientes_contrato}    />
                    <KPIBar label="Certs. sin rechazo"          value={kpi.certs_aprobados}      />
                    <View style={{ flexDirection:'row', gap:10, marginTop:4 }}>
                      {([['Visitas / mes', kpi.visitas_mes],['Certs. emitidos', kpi.certs_emitidos]] as [string,number][]).map(([l,v]) => (
                        <View key={l} style={{
                          flex:1, backgroundColor:t.dim, borderRadius:12,
                          padding:12, alignItems:'center',
                        }}>
                          <Text style={{ fontSize:20, fontWeight:'600', letterSpacing:-0.5, color:t.text }}>{v}</Text>
                          <Text style={{ fontSize:10.5, color:t.muted, marginTop:4, textAlign:'center' }}>{l}</Text>
                        </View>
                      ))}
                    </View>
                  </Card>
                </View>

                {/* Clientes */}
                <View style={{ marginBottom:24 }}>
                  <SectionLabel text="Ranchos / clientes" />
                  <Card>
                    {clientes.map((cl, i) => (
                      <View key={cl.id}>
                        <ClienteRow {...cl} />
                        {i < clientes.length - 1 && <Divider />}
                      </View>
                    ))}
                  </Card>
                </View>

              </View>
            )}

            {/* ══ SERVICIOS ════════════════════════════════════ */}
            {activeTab === 'servicios' && (
              <View style={{ paddingTop:20 }}>

                <View style={{ marginBottom:24 }}>
                  <SectionLabel text="Servicios profesionales" />
                  <Card>
                    {servicios.map((sv, i) => (
                      <View key={sv.id}>
                        <ServiceRow label={sv.label} price={sv.precio} />
                        {i < servicios.length - 1 && <Divider />}
                      </View>
                    ))}
                  </Card>
                </View>

                <View style={{ marginBottom:24 }}>
                  <SectionLabel text="Zona de cobertura" />
                  <View style={{ flexDirection:'row', flexWrap:'wrap', gap:8 }}>
                    {estadosCobertura.map(est => (
                      <View key={est} style={{
                        flexDirection:'row', alignItems:'center', gap:6,
                        paddingHorizontal:12, paddingVertical:8, borderRadius:12,
                        backgroundColor:t.surface, borderWidth:1, borderColor:t.border,
                      }}>
                        <IPin c={BRAND} z={10} />
                        <Text style={{ fontSize:12.5, color:t.muted }}>{est}</Text>
                      </View>
                    ))}
                  </View>
                </View>

              </View>
            )}

            {/* ══ CONTACTO ════════════════════════════════════ */}
            {activeTab === 'contacto' && (
              <View style={{ paddingTop:20 }}>

                <View style={{ marginBottom:24 }}>
                  <SectionLabel text="Información de contacto" />
                  <Card>
                    {contactRows.map((cr, i) => (
                      <View key={cr.label}>
                        <ContactRow {...cr} />
                        {i < contactRows.length - 1 && <Divider />}
                      </View>
                    ))}
                  </Card>
                  <Pressable
                    onPress={() => Linking.openURL('tel:+526145557890')}
                    style={({ pressed }) => ({
                      marginTop:12, flexDirection:'row', alignItems:'center',
                      justifyContent:'center', gap:8, height:44, borderRadius:12,
                      borderWidth:1, borderColor:`${BRAND}30`,
                      backgroundColor: pressed ? `${BRAND}12` : `${BRAND}08`,
                    })}
                  >
                    <IPhone c={BRAND} z={15} />
                    <Text style={{ fontSize:13, fontWeight:'600', color:BRAND }}>Agendar consulta</Text>
                  </Pressable>
                </View>

                <View style={{ marginBottom:24 }}>
                  <SectionLabel text="Datos de registro" />
                  <Card style={{ padding:16 }}>
                    <Text style={{ fontSize:13, fontWeight:'500', color:t.text, marginBottom:2 }}>
                      {mvzUbicacion}
                    </Text>
                    <Text style={{ fontSize:12, color:t.muted, marginBottom:16 }}>
                      Cobertura en {estadosCobertura.length} estados
                    </Text>
                    <View style={{
                      flexDirection:'row', flexWrap:'wrap', gap:1,
                      borderRadius:12, overflow:'hidden', backgroundColor:t.border,
                    }}>
                      {registroGrid.map(([l, v]) => (
                        <View key={l} style={{ width:'50%', backgroundColor:t.surface, padding:12 }}>
                          <Text style={{ fontSize:9.5, fontWeight:'600', letterSpacing:0.8, textTransform:'uppercase', color:t.muted, marginBottom:4 }}>{l}</Text>
                          <Text style={{ fontSize:12.5, fontWeight:'500', color:t.text }}>{v}</Text>
                        </View>
                      ))}
                    </View>
                  </Card>
                </View>

              </View>
            )}

          </View>
        </View>
      </ScrollView>
    </View>
  )
}

// ─── STYLESHEET ───────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:          { flex:1 },
  hero:          { height:190, backgroundColor:HERO, overflow:'hidden' },
  heroGlowR:     { position:'absolute', right:-30, top:-30, width:200, height:200, borderRadius:100, backgroundColor:'rgba(47,175,143,0.40)' },
  heroGlowL:     { position:'absolute', left:-40, bottom:-40, width:160, height:160, borderRadius:80, backgroundColor:'rgba(26,144,112,0.28)' },
  heroCirc1:     { position:'absolute', right:-55, top:-55, width:230, height:230, borderRadius:115, borderWidth:1, borderColor:'rgba(255,255,255,0.055)' },
  heroCirc2:     { position:'absolute', right:-8, top:-8, width:150, height:150, borderRadius:75, borderWidth:1, borderColor:'rgba(255,255,255,0.055)' },
  heroBadgeRow:  { position:'absolute', right:16, flexDirection:'row', gap:8 },
  heroBadge:     { flexDirection:'row', alignItems:'center', gap:6, paddingHorizontal:10, paddingVertical:4, borderRadius:99, backgroundColor:'rgba(255,255,255,0.10)', borderWidth:1, borderColor:'rgba(255,255,255,0.12)' },
  heroDot:       { width:6, height:6, borderRadius:3, backgroundColor:'#34d399' },
  heroBadgeText: { fontSize:10, fontWeight:'500', color:'rgba(255,255,255,0.65)' },
  sheet:         { marginTop:-22, borderTopLeftRadius:26, borderTopRightRadius:26 },
  inner:         { paddingHorizontal:18 },
  identityRow:   { flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginTop:8, marginBottom:8, gap:12 },
  avatar:        { width:62, height:62, borderRadius:16, alignItems:'center', justifyContent:'center', flexShrink:0 },
  avatarLabel:   { fontSize:22, fontWeight:'700', fontStyle:'italic' },
  roleBadge:     { alignSelf:'flex-start', paddingHorizontal:8, paddingVertical:3, borderRadius:99, borderWidth:1, marginBottom:5 },
  roleBadgeText: { fontSize:9.5, fontWeight:'600', letterSpacing:0.4 },
  mvzName:       { fontSize:17, fontWeight:'600', letterSpacing:-0.4, fontStyle:'italic', lineHeight:22 },
  editBtn:       { flexDirection:'row', alignItems:'center', gap:6, paddingHorizontal:14, paddingVertical:9, borderRadius:12, flexShrink:0 },
  editBtnText:   { fontSize:12.5, fontWeight:'500' },
  tabBar:        { flexDirection:'row', borderBottomWidth:1 },
  tabBtn:        { paddingHorizontal:14, paddingBottom:10, position:'relative' },
  tabText:       { fontSize:13 },
  tabLine:       { position:'absolute', bottom:-1, left:14, right:14, height:2, borderRadius:2 },
})