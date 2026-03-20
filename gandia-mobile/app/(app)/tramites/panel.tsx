// app/(app)/tramites/panel.tsx — Gandia 7 · Panel de Trámites (union_ganadera)
// Todo simulado con mock data · tu compañero conecta Supabase después
import { useState, useMemo } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, useColorScheme, Modal, Alert,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, {
  Path, Line, Polyline, Circle, Rect, Polygon,
} from 'react-native-svg'

// ─── Constantes ──────────────────────────────────────────────────────────────

const BRAND = '#2FAF8F'

// ─── Tipos ───────────────────────────────────────────────────────────────────

type Vista         = 'municipios' | 'bandeja' | 'expediente'
type TramiteEstatus = 'en_revision' | 'con_observaciones' | 'documentacion_completa'
type TramiteTipo   = 'exportacion' | 'movilizacion' | 'regularizacion'
type FiltroEstatus = 'todos' | TramiteEstatus

interface Municipio {
  id: string
  nombre: string
  estado: string
  pendientes: number
  enRevision: number
  completados: number
}

interface Tramite {
  id: string
  upp: string
  tipo: TramiteTipo
  estatus: TramiteEstatus
  productor: string
  numAnimales: number
  fechaIngreso: string
  municipioId: string
}

interface ChecklistItem { id: string; label: string; checked: boolean }

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_MUNICIPIOS: Municipio[] = [
  { id: 'm1', nombre: 'Durango',      estado: 'Durango',   pendientes: 5, enRevision: 3, completados: 12 },
  { id: 'm2', nombre: 'Lerdo',        estado: 'Durango',   pendientes: 2, enRevision: 1, completados: 8  },
  { id: 'm3', nombre: 'Gómez Palacio',estado: 'Durango',   pendientes: 4, enRevision: 2, completados: 6  },
  { id: 'm4', nombre: 'Canatlán',     estado: 'Durango',   pendientes: 1, enRevision: 0, completados: 3  },
  { id: 'm5', nombre: 'Tepehuanes',   estado: 'Durango',   pendientes: 3, enRevision: 1, completados: 9  },
  { id: 'm6', nombre: 'Santiago Papasquiaro', estado: 'Durango', pendientes: 2, enRevision: 2, completados: 5 },
]

const MOCK_TRAMITES: Tramite[] = [
  { id: 't1', upp: 'UPP-DGO-00142', tipo: 'exportacion',    estatus: 'en_revision',            productor: 'Rancho El Mezquite',    numAnimales: 48,  fechaIngreso: '2026-02-18', municipioId: 'm1' },
  { id: 't2', upp: 'UPP-DGO-00219', tipo: 'movilizacion',   estatus: 'con_observaciones',      productor: 'Ganadería Los Alamos',  numAnimales: 120, fechaIngreso: '2026-02-20', municipioId: 'm1' },
  { id: 't3', upp: 'UPP-DGO-00331', tipo: 'regularizacion', estatus: 'documentacion_completa', productor: 'Rancho San Pedro',      numAnimales: 35,  fechaIngreso: '2026-02-22', municipioId: 'm1' },
  { id: 't4', upp: 'UPP-DGO-00415', tipo: 'exportacion',    estatus: 'en_revision',            productor: 'Finca La Esperanza',    numAnimales: 72,  fechaIngreso: '2026-02-14', municipioId: 'm1' },
  { id: 't5', upp: 'UPP-DGO-00508', tipo: 'movilizacion',   estatus: 'en_revision',            productor: 'Rancho Las Truchas',    numAnimales: 200, fechaIngreso: '2026-02-11', municipioId: 'm1' },
  { id: 't6', upp: 'UPP-DGO-00612', tipo: 'exportacion',    estatus: 'con_observaciones',      productor: 'Hacienda El Roble',     numAnimales: 55,  fechaIngreso: '2026-02-25', municipioId: 'm2' },
  { id: 't7', upp: 'UPP-DGO-00718', tipo: 'regularizacion', estatus: 'en_revision',            productor: 'Rancho Los Pinos',      numAnimales: 18,  fechaIngreso: '2026-02-27', municipioId: 'm3' },
]

const CHECKLIST_BASE: ChecklistItem[] = [
  { id: 'ch1', label: 'Identificación UPP',                  checked: false },
  { id: 'ch2', label: 'Documentación sanitaria',             checked: false },
  { id: 'ch3', label: 'Evidencia visual (fotografías)',      checked: false },
  { id: 'ch4', label: 'Correspondencia animales–documentos', checked: false },
  { id: 'ch5', label: 'Dictamen MVZ (si aplica)',            checked: false },
]

// ─── Tokens de color ──────────────────────────────────────────────────────────

const tk = (d: boolean) => ({
  bg:       d ? '#0c0a09' : '#f2f1f0',
  card:     d ? '#141210' : '#ffffff',
  card2:    d ? '#1c1917' : '#f5f4f3',
  border:   d ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)',
  divider:  d ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)',
  text:     d ? '#fafaf9' : '#1c1917',
  muted:    d ? '#78716c' : '#a8a29e',
  muted2:   d ? '#57534e' : '#c4bfba',
  input:    d ? '#1c1917' : '#ffffff',
  inputBorder: d ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.10)',
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

function diasDesde(f: string) {
  return Math.floor((Date.now() - new Date(f).getTime()) / 86_400_000)
}

function urgColor(d: number, isDark: boolean) {
  if (d > 10) return '#ef4444'
  if (d > 5)  return '#f59e0b'
  return isDark ? '#57534e' : '#a8a29e'
}

const TIPO_LABEL: Record<TramiteTipo, string> = {
  exportacion: 'Exportación', movilizacion: 'Movilización', regularizacion: 'Regularización',
}

function tipoCfg(t: TramiteTipo) {
  const map: Record<TramiteTipo, { bg: string; bgD: string; color: string }> = {
    exportacion:    { bg: 'rgba(59,130,246,0.10)',  bgD: 'rgba(59,130,246,0.15)',  color: '#3b82f6' },
    movilizacion:   { bg: 'rgba(47,175,143,0.10)',  bgD: 'rgba(47,175,143,0.15)',  color: BRAND     },
    regularizacion: { bg: 'rgba(245,158,11,0.10)',  bgD: 'rgba(245,158,11,0.15)',  color: '#f59e0b' },
  }
  return map[t]
}

function estatusCfg(e: TramiteEstatus) {
  const map: Record<TramiteEstatus, { label: string; color: string; bg: string; bgD: string; step: number }> = {
    en_revision:            { label: 'En revisión',    color: '#818cf8', bg: 'rgba(129,140,248,0.10)', bgD: 'rgba(129,140,248,0.15)', step: 0 },
    con_observaciones:      { label: 'Observaciones',  color: '#f59e0b', bg: 'rgba(245,158,11,0.10)',  bgD: 'rgba(245,158,11,0.15)',  step: 1 },
    documentacion_completa: { label: 'Docs. completa', color: BRAND,     bg: 'rgba(47,175,143,0.10)',  bgD: 'rgba(47,175,143,0.15)',  step: 2 },
  }
  return map[e]
}

function siguienteEstatus(e: TramiteEstatus): TramiteEstatus | null {
  const map: Record<TramiteEstatus, TramiteEstatus | null> = {
    en_revision: 'con_observaciones',
    con_observaciones: 'documentacion_completa',
    documentacion_completa: null,
  }
  return map[e]
}

// ─── SVG Icons ────────────────────────────────────────────────────────────────

const si = { fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

const IcoBack   = ({ c }: { c: string }) => <Svg width={18} height={18} viewBox="0 0 24 24" {...si} stroke={c} strokeWidth="2"><Line x1="19" y1="12" x2="5" y2="12" /><Polyline points="12 19 5 12 12 5" /></Svg>
const IcoSearch = ({ c }: { c: string }) => <Svg width={16} height={16} viewBox="0 0 24 24" {...si} stroke={c} strokeWidth="1.75"><Circle cx="11" cy="11" r="7" /><Line x1="20.5" y1="20.5" x2="16.1" y2="16.1" /></Svg>
const IcoMap    = ({ c }: { c: string }) => <Svg width={16} height={16} viewBox="0 0 24 24" {...si} stroke={c} strokeWidth="1.75"><Polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" /><Line x1="8" y1="2" x2="8" y2="18" /><Line x1="16" y1="6" x2="16" y2="22" /></Svg>
const IcoFile   = ({ c }: { c: string }) => <Svg width={16} height={16} viewBox="0 0 24 24" {...si} stroke={c} strokeWidth="1.75"><Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><Polyline points="14 2 14 8 20 8" /><Line x1="9" y1="13" x2="15" y2="13" /><Line x1="9" y1="17" x2="13" y2="17" /></Svg>
const IcoChev   = ({ c }: { c: string }) => <Svg width={14} height={14} viewBox="0 0 24 24" {...si} stroke={c} strokeWidth="2"><Polyline points="9 18 15 12 9 6" /></Svg>
const IcoCheck  = ({ c, size = 14 }: { c: string; size?: number }) => <Svg width={size} height={size} viewBox="0 0 24 24" {...si} stroke={c} strokeWidth="2.5"><Polyline points="20 6 9 17 4 12" /></Svg>
const IcoClock  = ({ c }: { c: string }) => <Svg width={13} height={13} viewBox="0 0 24 24" {...si} stroke={c} strokeWidth="1.75"><Circle cx="12" cy="12" r="10" /><Polyline points="12 6 12 12 16 14" /></Svg>
const IcoPlus   = ({ c }: { c: string }) => <Svg width={15} height={15} viewBox="0 0 24 24" {...si} stroke={c} strokeWidth="2.5"><Line x1="12" y1="5" x2="12" y2="19" /><Line x1="5" y1="12" x2="19" y2="12" /></Svg>
const IcoX      = ({ c }: { c: string }) => <Svg width={16} height={16} viewBox="0 0 24 24" {...si} stroke={c} strokeWidth="2"><Line x1="18" y1="6" x2="6" y2="18" /><Line x1="6" y1="6" x2="18" y2="18" /></Svg>
const IcoArr    = ({ c }: { c: string }) => <Svg width={14} height={14} viewBox="0 0 24 24" {...si} stroke={c} strokeWidth="2"><Line x1="5" y1="12" x2="19" y2="12" /><Polyline points="12 5 19 12 12 19" /></Svg>

// ─── VISTA MUNICIPIOS ─────────────────────────────────────────────────────────

function VistaMunicipios({
  isDark, query, setQuery, onSelect,
}: {
  isDark: boolean; query: string; setQuery: (q: string) => void; onSelect: (m: Municipio) => void
}) {
  const t = tk(isDark)
  const filtered = MOCK_MUNICIPIOS.filter(m =>
    m.nombre.toLowerCase().includes(query.toLowerCase())
  )
  const totalPendientes = MOCK_MUNICIPIOS.reduce((a, m) => a + m.pendientes, 0)
  const totalRevision   = MOCK_MUNICIPIOS.reduce((a, m) => a + m.enRevision, 0)
  const totalCompletos  = MOCK_MUNICIPIOS.reduce((a, m) => a + m.completados, 0)

  return (
    <>
      {/* Stats globales */}
      <View style={vm.statsRow}>
        <StatPill label="Pendientes" value={totalPendientes} color="#818cf8" isDark={isDark} />
        <StatPill label="En revisión" value={totalRevision}   color="#f59e0b" isDark={isDark} />
        <StatPill label="Completados" value={totalCompletos}  color={BRAND}   isDark={isDark} />
      </View>

      {/* Buscador */}
      <View style={[vm.searchWrap, { backgroundColor: t.input, borderColor: t.inputBorder }]}>
        <IcoSearch c={t.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar municipio…"
          placeholderTextColor={t.muted}
          style={[vm.searchInput, { color: t.text }]}
        />
      </View>

      {/* Lista */}
      {filtered.map((m) => (
        <TouchableOpacity
          key={m.id}
          style={[vm.card, { backgroundColor: t.card, borderColor: t.border }]}
          onPress={() => onSelect(m)}
          activeOpacity={0.8}
        >
          <View style={vm.cardTop}>
            <View style={[vm.iconWrap, { backgroundColor: isDark ? '#1a2e28' : '#e6f7f2' }]}>
              <IcoMap c={BRAND} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[vm.nombre, { color: t.text }]}>{m.nombre}</Text>
              <Text style={[vm.estado, { color: t.muted }]}>{m.estado}</Text>
            </View>
            <IcoChev c={t.muted2} />
          </View>
          <View style={[vm.divider, { backgroundColor: t.divider }]} />
          <View style={vm.pills}>
            <MiniPill label={`${m.pendientes} pend.`}    color="#818cf8" isDark={isDark} />
            <MiniPill label={`${m.enRevision} rev.`}     color="#f59e0b" isDark={isDark} />
            <MiniPill label={`${m.completados} compl.`}  color={BRAND}   isDark={isDark} />
          </View>
        </TouchableOpacity>
      ))}
    </>
  )
}

function StatPill({ label, value, color, isDark }: { label: string; value: number; color: string; isDark: boolean }) {
  return (
    <View style={[sp2.wrap, { backgroundColor: isDark ? '#141210' : '#fff', borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)' }]}>
      <Text style={[sp2.value, { color }]}>{value}</Text>
      <Text style={[sp2.label, { color: isDark ? '#78716c' : '#a8a29e' }]}>{label}</Text>
    </View>
  )
}

function MiniPill({ label, color, isDark }: { label: string; color: string; isDark: boolean }) {
  return (
    <View style={[mp.wrap, { backgroundColor: `${color}18` }]}>
      <Text style={[mp.text, { color }]}>{label}</Text>
    </View>
  )
}

const sp2 = StyleSheet.create({
  wrap:  { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth },
  value: { fontFamily: 'Geist-SemiBold', fontSize: 20, letterSpacing: -0.5 },
  label: { fontFamily: 'Geist-Regular',  fontSize: 11, marginTop: 2 },
})
const mp = StyleSheet.create({
  wrap: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  text: { fontFamily: 'Geist-SemiBold', fontSize: 11 },
})
const vm = StyleSheet.create({
  statsRow:    { flexDirection: 'row', gap: 8, marginBottom: 16 },
  searchWrap:  { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12 },
  searchInput: { flex: 1, fontFamily: 'Geist-Regular', fontSize: 14 },
  card:        { borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, marginBottom: 10, overflow: 'hidden' },
  cardTop:     { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  iconWrap:    { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  nombre:      { fontFamily: 'Geist-SemiBold', fontSize: 14, letterSpacing: -0.2 },
  estado:      { fontFamily: 'Geist-Regular',  fontSize: 12, marginTop: 1 },
  divider:     { height: StyleSheet.hairlineWidth, marginHorizontal: 14 },
  pills:       { flexDirection: 'row', gap: 6, padding: 12, paddingTop: 10 },
})

// ─── VISTA BANDEJA ────────────────────────────────────────────────────────────

function VistaBandeja({
  isDark, municipio, tramites, onSelect, onNuevo,
}: {
  isDark: boolean; municipio: Municipio; tramites: Tramite[]
  onSelect: (t: Tramite) => void; onNuevo: () => void
}) {
  const t = tk(isDark)
  const [filtro, setFiltro] = useState<FiltroEstatus>('todos')
  const [query,  setQuery]  = useState('')

  const filtrados = useMemo(() => tramites.filter(tr => {
    const matchFiltro = filtro === 'todos' || tr.estatus === filtro
    const matchQuery  = query === '' ||
      tr.upp.toLowerCase().includes(query.toLowerCase()) ||
      tr.productor.toLowerCase().includes(query.toLowerCase())
    return matchFiltro && matchQuery
  }), [tramites, filtro, query])

  const FILTROS: { id: FiltroEstatus; label: string }[] = [
    { id: 'todos',                  label: 'Todos'       },
    { id: 'en_revision',            label: 'En revisión' },
    { id: 'con_observaciones',      label: 'Obs.'        },
    { id: 'documentacion_completa', label: 'Completos'   },
  ]

  return (
    <>
      {/* Subheader municipio */}
      <View style={[vb.muniCard, { backgroundColor: t.card, borderColor: t.border }]}>
        <View style={[vb.muniIcon, { backgroundColor: isDark ? '#1a2e28' : '#e6f7f2' }]}>
          <IcoMap c={BRAND} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[vb.muniNombre, { color: t.text }]}>{municipio.nombre}</Text>
          <Text style={[vb.muniSub, { color: t.muted }]}>{tramites.length} trámites</Text>
        </View>
        <TouchableOpacity
          style={[vb.nuevoBtn, { backgroundColor: isDark ? 'rgba(47,175,143,0.15)' : 'rgba(47,175,143,0.10)' }]}
          onPress={onNuevo} activeOpacity={0.8}
        >
          <IcoPlus c={BRAND} />
          <Text style={[vb.nuevoBtnText, { color: BRAND }]}>Nuevo</Text>
        </TouchableOpacity>
      </View>

      {/* Buscador */}
      <View style={[vb.searchWrap, { backgroundColor: t.input, borderColor: t.inputBorder }]}>
        <IcoSearch c={t.muted} />
        <TextInput
          value={query} onChangeText={setQuery}
          placeholder="Buscar UPP o productor…"
          placeholderTextColor={t.muted}
          style={[vb.searchInput, { color: t.text }]}
        />
      </View>

      {/* Filtros */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {FILTROS.map(f => {
            const active = filtro === f.id
            return (
              <TouchableOpacity
                key={f.id}
                style={[vb.chip, active && { backgroundColor: isDark ? 'rgba(47,175,143,0.15)' : 'rgba(47,175,143,0.10)', borderColor: BRAND },
                  !active && { borderColor: t.border, backgroundColor: t.card }]}
                onPress={() => setFiltro(f.id)} activeOpacity={0.8}
              >
                <Text style={[vb.chipText, { color: active ? BRAND : t.muted }]}>{f.label}</Text>
              </TouchableOpacity>
            )
          })}
        </View>
      </ScrollView>

      {/* Tramites */}
      {filtrados.length === 0 ? (
        <View style={vb.empty}>
          <IcoFile c={t.muted2} />
          <Text style={[vb.emptyText, { color: t.muted }]}>Sin resultados</Text>
        </View>
      ) : filtrados.map(tr => (
        <TramiteCard key={tr.id} tramite={tr} isDark={isDark} onPress={() => onSelect(tr)} />
      ))}
    </>
  )
}

function TramiteCard({ tramite: tr, isDark, onPress }: { tramite: Tramite; isDark: boolean; onPress: () => void }) {
  const t    = tk(isDark)
  const ec   = estatusCfg(tr.estatus)
  const tc   = tipoCfg(tr.tipo)
  const dias = diasDesde(tr.fechaIngreso)

  return (
    <TouchableOpacity
      style={[tc2.card, { backgroundColor: t.card, borderColor: t.border }]}
      onPress={onPress} activeOpacity={0.82}
    >
      <View style={tc2.top}>
        <Text style={[tc2.upp, { color: t.text }]}>{tr.upp}</Text>
        <View style={[tc2.badge, { backgroundColor: isDark ? ec.bgD : ec.bg }]}>
          <Text style={[tc2.badgeText, { color: ec.color }]}>{ec.label}</Text>
        </View>
      </View>

      <Text style={[tc2.productor, { color: t.muted }]}>{tr.productor}</Text>

      <View style={tc2.bottom}>
        <View style={[tc2.tipoPill, { backgroundColor: isDark ? tc.bgD : tc.bg }]}>
          <Text style={[tc2.tipoPillText, { color: tc.color }]}>{TIPO_LABEL[tr.tipo]}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <IcoClock c={urgColor(dias, isDark)} />
          <Text style={[tc2.dias, { color: urgColor(dias, isDark) }]}>{dias}d</Text>
        </View>
        <Text style={[tc2.animales, { color: t.muted }]}>{tr.numAnimales} animales</Text>
        <IcoChev c={t.muted2} />
      </View>
    </TouchableOpacity>
  )
}

const tc2 = StyleSheet.create({
  card:        { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, padding: 14, marginBottom: 10 },
  top:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  upp:         { fontFamily: 'Geist-SemiBold', fontSize: 13.5, letterSpacing: -0.2 },
  badge:       { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 7 },
  badgeText:   { fontFamily: 'Geist-SemiBold', fontSize: 10.5 },
  productor:   { fontFamily: 'Geist-Regular', fontSize: 12.5, marginBottom: 10 },
  bottom:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tipoPill:    { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  tipoPillText:{ fontFamily: 'Geist-Medium', fontSize: 11 },
  dias:        { fontFamily: 'Geist-Medium', fontSize: 11.5 },
  animales:    { fontFamily: 'Geist-Regular', fontSize: 11.5, marginLeft: 'auto' as any },
})
const vb = StyleSheet.create({
  muniCard:    { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, padding: 12, marginBottom: 14 },
  muniIcon:    { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  muniNombre:  { fontFamily: 'Geist-SemiBold', fontSize: 14 },
  muniSub:     { fontFamily: 'Geist-Regular',  fontSize: 12, marginTop: 1 },
  nuevoBtn:    { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10 },
  nuevoBtnText:{ fontFamily: 'Geist-SemiBold', fontSize: 12, color: BRAND },
  searchWrap:  { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12 },
  searchInput: { flex: 1, fontFamily: 'Geist-Regular', fontSize: 14 },
  chip:        { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1 },
  chipText:    { fontFamily: 'Geist-Medium', fontSize: 12.5 },
  empty:       { alignItems: 'center', gap: 8, paddingVertical: 32 },
  emptyText:   { fontFamily: 'Geist-Regular', fontSize: 13 },
})

// ─── STEPPER ──────────────────────────────────────────────────────────────────

function Stepper({ estatus, onAvanzar }: { estatus: TramiteEstatus; onAvanzar: (s: TramiteEstatus) => void }) {
  const STEPS: { key: TramiteEstatus; label: string }[] = [
    { key: 'en_revision',            label: 'En revisión'  },
    { key: 'con_observaciones',      label: 'Observaciones' },
    { key: 'documentacion_completa', label: 'Completado'    },
  ]
  const cur = estatusCfg(estatus).step
  const sig = siguienteEstatus(estatus)

  return (
    <View>
      <View style={stp.row}>
        {STEPS.map((s, i) => {
          const done   = i < cur
          const active = i === cur
          return (
            <View key={s.key} style={stp.step}>
              <View style={stp.stepTop}>
                <View style={[stp.circle,
                  done   && { backgroundColor: BRAND,     borderColor: BRAND },
                  active && { backgroundColor: 'transparent', borderColor: BRAND },
                  !done && !active && { opacity: 0.3 },
                ]}>
                  {done
                    ? <IcoCheck c="#fff" size={12} />
                    : <View style={[stp.dot, { backgroundColor: active ? BRAND : '#a8a29e' }]} />}
                </View>
                {i < STEPS.length - 1 && (
                  <View style={[stp.line, { backgroundColor: i < cur ? BRAND : 'rgba(168,162,158,0.3)' }]} />
                )}
              </View>
              <Text style={[stp.label, {
                color: active ? BRAND : done ? '#a8a29e' : '#57534e',
                fontFamily: active ? 'Geist-SemiBold' : 'Geist-Regular',
              }]}>
                {s.label}
              </Text>
            </View>
          )
        })}
      </View>
      {sig && (
        <TouchableOpacity style={stp.avanzarBtn} onPress={() => onAvanzar(sig)} activeOpacity={0.8}>
          <IcoArr c={BRAND} />
          <Text style={stp.avanzarText}>Avanzar a "{estatusCfg(sig).label}"</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const stp = StyleSheet.create({
  row:        { flexDirection: 'row', marginBottom: 12 },
  step:       { flex: 1, alignItems: 'center' },
  stepTop:    { flexDirection: 'row', alignItems: 'center', width: '100%' },
  circle:     { width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: '#a8a29e', alignItems: 'center', justifyContent: 'center' },
  dot:        { width: 8, height: 8, borderRadius: 4 },
  line:       { flex: 1, height: 2, borderRadius: 1, marginHorizontal: 2 },
  label:      { fontSize: 10, marginTop: 4, textAlign: 'center' },
  avanzarBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 4 },
  avanzarText:{ fontFamily: 'Geist-SemiBold', fontSize: 13, color: BRAND },
})

// ─── VISTA EXPEDIENTE ─────────────────────────────────────────────────────────

function VistaExpediente({
  isDark, tramite, onAvanzar,
}: {
  isDark: boolean; tramite: Tramite; onAvanzar: (id: string, sig: TramiteEstatus) => void
}) {
  const t  = tk(isDark)
  const ec = estatusCfg(tramite.estatus)
  const tc = tipoCfg(tramite.tipo)
  const [checklist, setChecklist] = useState<ChecklistItem[]>(CHECKLIST_BASE.map(c => ({ ...c })))
  const [obs, setObs] = useState('')

  const checkCount = checklist.filter(c => c.checked).length

  const toggle = (id: string) =>
    setChecklist(prev => prev.map(c => c.id === id ? { ...c, checked: !c.checked } : c))

  const handleAvanzar = (sig: TramiteEstatus) => onAvanzar(tramite.id, sig)

  const notaLegal = {
    exportacion:    'Revisión documental. Certificación final es competencia de SENASICA / USDA–APHIS.',
    movilizacion:   'Esta revisión no sustituye la guía REEMO ni los permisos de tránsito oficiales.',
    regularizacion: 'Revisión documental. No constituye autorización ni permiso oficial.',
  }[tramite.tipo]

  return (
    <>
      {/* Card principal */}
      <View style={[ve.card, { backgroundColor: t.card, borderColor: t.border }]}>
        <View style={ve.cardHeader}>
          <Text style={[ve.upp, { color: t.text }]}>{tramite.upp}</Text>
          <View style={[ve.badge, { backgroundColor: isDark ? ec.bgD : ec.bg }]}>
            <Text style={[ve.badgeText, { color: ec.color }]}>{ec.label}</Text>
          </View>
        </View>

        <View style={[ve.divider, { backgroundColor: t.divider }]} />

        <View style={ve.meta}>
          <MetaItem label="Productor"  value={tramite.productor} isDark={isDark} />
          <MetaItem label="Tipo"       value={TIPO_LABEL[tramite.tipo]} isDark={isDark} color={tc.color} />
          <MetaItem label="Animales"   value={`${tramite.numAnimales}`} isDark={isDark} />
          <MetaItem label="Ingreso"    value={tramite.fechaIngreso} isDark={isDark} />
        </View>
      </View>

      {/* Stepper */}
      <View style={[ve.section, { backgroundColor: t.card, borderColor: t.border }]}>
        <Text style={[ve.sectionTitle, { color: t.text }]}>Estado del trámite</Text>
        <Stepper estatus={tramite.estatus} onAvanzar={handleAvanzar} />
      </View>

      {/* Checklist */}
      <View style={[ve.section, { backgroundColor: t.card, borderColor: t.border }]}>
        <View style={ve.sectionHeaderRow}>
          <Text style={[ve.sectionTitle, { color: t.text }]}>Checklist documental</Text>
          <Text style={[ve.checkCount, { color: checkCount === checklist.length ? BRAND : t.muted }]}>
            {checkCount}/{checklist.length}
          </Text>
        </View>
        {checklist.map((item, i) => (
          <TouchableOpacity
            key={item.id}
            style={[ve.checkRow, i < checklist.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.divider }]}
            onPress={() => toggle(item.id)}
            activeOpacity={0.8}
          >
            <View style={[ve.checkbox, item.checked && { backgroundColor: BRAND, borderColor: BRAND }, !item.checked && { borderColor: t.muted2 }]}>
              {item.checked && <IcoCheck c="#fff" size={10} />}
            </View>
            <Text style={[ve.checkLabel, { color: item.checked ? t.text : t.muted, textDecorationLine: item.checked ? 'line-through' : 'none' }]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Observaciones */}
      <View style={[ve.section, { backgroundColor: t.card, borderColor: t.border }]}>
        <Text style={[ve.sectionTitle, { color: t.text }]}>Observaciones</Text>
        <TextInput
          value={obs}
          onChangeText={setObs}
          placeholder="Agregar observación…"
          placeholderTextColor={t.muted}
          multiline
          numberOfLines={4}
          style={[ve.obsInput, { color: t.text, backgroundColor: t.card2, borderColor: t.inputBorder }]}
        />
      </View>

      {/* Nota legal */}
      <View style={[ve.notaWrap, { backgroundColor: isDark ? 'rgba(245,158,11,0.08)' : 'rgba(245,158,11,0.06)', borderColor: 'rgba(245,158,11,0.2)' }]}>
        <Text style={[ve.notaText, { color: isDark ? '#f59e0b' : '#b45309' }]}>{notaLegal}</Text>
      </View>
    </>
  )
}

function MetaItem({ label, value, isDark, color }: { label: string; value: string; isDark: boolean; color?: string }) {
  const t = tk(isDark)
  return (
    <View style={mi.row}>
      <Text style={[mi.label, { color: t.muted }]}>{label}</Text>
      <Text style={[mi.value, { color: color ?? t.text }]}>{value}</Text>
    </View>
  )
}
const mi = StyleSheet.create({
  row:   { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  label: { fontFamily: 'Geist-Regular', fontSize: 13 },
  value: { fontFamily: 'Geist-SemiBold', fontSize: 13 },
})
const ve = StyleSheet.create({
  card:         { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, marginBottom: 12, overflow: 'hidden' },
  cardHeader:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14 },
  upp:          { fontFamily: 'Geist-SemiBold', fontSize: 15, letterSpacing: -0.3 },
  badge:        { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8 },
  badgeText:    { fontFamily: 'Geist-SemiBold', fontSize: 11 },
  divider:      { height: StyleSheet.hairlineWidth, marginHorizontal: 14 },
  meta:         { padding: 14, paddingTop: 10, gap: 2 },
  section:      { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, padding: 14, marginBottom: 12 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  sectionTitle: { fontFamily: 'Geist-SemiBold', fontSize: 13.5, marginBottom: 0 },
  checkCount:   { fontFamily: 'Geist-SemiBold', fontSize: 12 },
  checkRow:     { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 11 },
  checkbox:     { width: 20, height: 20, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  checkLabel:   { fontFamily: 'Geist-Regular', fontSize: 13.5, flex: 1 },
  obsInput:     { borderRadius: 10, borderWidth: 1, padding: 12, fontFamily: 'Geist-Regular', fontSize: 13.5, minHeight: 80, textAlignVertical: 'top' },
  notaWrap:     { borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 12 },
  notaText:     { fontFamily: 'Geist-Regular', fontSize: 12, lineHeight: 18 },
})

// ─── MODAL NUEVO TRÁMITE ──────────────────────────────────────────────────────

function ModalNuevoTramite({ isDark, municipioId, onClose, onCreado }: {
  isDark: boolean; municipioId: string; onClose: () => void; onCreado: () => void
}) {
  const t = tk(isDark)
  const [upp,         setUpp]         = useState('')
  const [tipo,        setTipo]        = useState<TramiteTipo>('exportacion')
  const [numAnimales, setNumAnimales] = useState('')
  const [productor,   setProductor]   = useState('')

  const TIPOS: { id: TramiteTipo; label: string }[] = [
    { id: 'exportacion',    label: 'Exportación'    },
    { id: 'movilizacion',   label: 'Movilización'   },
    { id: 'regularizacion', label: 'Regularización' },
  ]

  const submit = () => {
    if (!upp.trim() || !productor.trim() || !numAnimales) {
      Alert.alert('Campos incompletos', 'Completa todos los campos antes de continuar.')
      return
    }
    // Mock: tu compañero conecta con crearTramite()
    onCreado()
  }

  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <View style={mn.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={onClose} />
        <View style={[mn.sheet, { backgroundColor: t.card }]}>
          {/* Handle */}
          <View style={[mn.handle, { backgroundColor: t.muted2 }]} />

          <View style={mn.header}>
            <Text style={[mn.title, { color: t.text }]}>Nuevo trámite</Text>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
              <IcoX c={t.muted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* UPP */}
            <Text style={[mn.label, { color: t.muted }]}>UPP</Text>
            <TextInput
              value={upp} onChangeText={setUpp}
              placeholder="UPP-DGO-00000"
              placeholderTextColor={t.muted}
              autoCapitalize="characters"
              style={[mn.input, { backgroundColor: t.input, borderColor: t.inputBorder, color: t.text }]}
            />

            {/* Productor */}
            <Text style={[mn.label, { color: t.muted }]}>Productor</Text>
            <TextInput
              value={productor} onChangeText={setProductor}
              placeholder="Nombre del productor"
              placeholderTextColor={t.muted}
              style={[mn.input, { backgroundColor: t.input, borderColor: t.inputBorder, color: t.text }]}
            />

            {/* Núm. animales */}
            <Text style={[mn.label, { color: t.muted }]}>Número de animales</Text>
            <TextInput
              value={numAnimales} onChangeText={setNumAnimales}
              placeholder="0"
              placeholderTextColor={t.muted}
              keyboardType="number-pad"
              style={[mn.input, { backgroundColor: t.input, borderColor: t.inputBorder, color: t.text }]}
            />

            {/* Tipo */}
            <Text style={[mn.label, { color: t.muted }]}>Tipo de trámite</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 24 }}>
              {TIPOS.map(op => {
                const active = tipo === op.id
                const tc     = tipoCfg(op.id)
                return (
                  <TouchableOpacity
                    key={op.id}
                    style={[mn.tipoChip, {
                      backgroundColor: active ? (isDark ? tc.bgD : tc.bg) : (isDark ? '#1c1917' : '#f5f4f3'),
                      borderColor: active ? tc.color : 'transparent',
                      borderWidth: active ? 1.5 : 0,
                    }]}
                    onPress={() => setTipo(op.id)} activeOpacity={0.8}
                  >
                    <Text style={[mn.tipoChipText, { color: active ? tc.color : t.muted }]}>{op.label}</Text>
                  </TouchableOpacity>
                )
              })}
            </View>

            <TouchableOpacity
              style={[mn.submitBtn, { backgroundColor: isDark ? '#f5f5f4' : '#1c1917' }]}
              onPress={submit} activeOpacity={0.85}
            >
              <Text style={[mn.submitText, { color: isDark ? '#1c1917' : '#fff' }]}>Crear trámite</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}

const mn = StyleSheet.create({
  overlay:      { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet:        { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40, maxHeight: '85%' },
  handle:       { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  title:        { fontFamily: 'Geist-SemiBold', fontSize: 16 },
  label:        { fontFamily: 'Geist-SemiBold', fontSize: 10, letterSpacing: 0.7, textTransform: 'uppercase', marginBottom: 6, marginTop: 14 },
  input:        { borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 11, fontFamily: 'Geist-Regular', fontSize: 14 },
  tipoChip:     { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  tipoChipText: { fontFamily: 'Geist-SemiBold', fontSize: 12 },
  submitBtn:    { height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  submitText:   { fontFamily: 'Geist-SemiBold', fontSize: 15 },
})

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────

export default function TramitesPanel() {
  const isDark = useColorScheme() === 'dark'
  const t      = tk(isDark)
  const insets = useSafeAreaInsets()
  const router = useRouter()

  const [vista,           setVista]           = useState<Vista>('municipios')
  const [municipioActivo, setMunicipioActivo] = useState<Municipio | null>(null)
  const [tramiteActivo,   setTramiteActivo]   = useState<Tramite | null>(null)
  const [tramitesMock,    setTramitesMock]    = useState<Tramite[]>(MOCK_TRAMITES)
  const [searchMuni,      setSearchMuni]      = useState('')
  const [showNuevo,       setShowNuevo]       = useState(false)

  // Tramites del municipio activo
  const tramitesMunicipio = municipioActivo
    ? tramitesMock.filter(tr => tr.municipioId === municipioActivo.id)
    : []

  // Breadcrumb dinámica
  const crumbs = (() => {
    const items: { label: string; onPress?: () => void }[] = [
      { label: 'Municipios', onPress: vista !== 'municipios' ? () => { setVista('municipios'); setMunicipioActivo(null); setTramiteActivo(null) } : undefined },
    ]
    if (municipioActivo) items.push({ label: municipioActivo.nombre, onPress: vista === 'expediente' ? () => { setVista('bandeja'); setTramiteActivo(null) } : undefined })
    if (tramiteActivo)   items.push({ label: tramiteActivo.upp })
    return items
  })()

  // Cambiar estatus (mock)
  const handleAvanzar = (id: string, sig: TramiteEstatus) => {
    setTramitesMock(prev => prev.map(tr => tr.id === id ? { ...tr, estatus: sig } : tr))
    if (tramiteActivo?.id === id) {
      setTramiteActivo(prev => prev ? { ...prev, estatus: sig } : prev)
    }
  }

  const irBandeja = (m: Municipio) => { setMunicipioActivo(m); setVista('bandeja') }
  const irExpediente = (tr: Tramite) => { setTramiteActivo(tr); setVista('expediente') }

  return (
    <View style={[s.root, { backgroundColor: t.bg }]}>
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + 10, borderBottomColor: t.divider }]}>
        <TouchableOpacity
          onPress={vista === 'municipios' ? () => router.back() : () => {
            if (vista === 'expediente') { setVista('bandeja'); setTramiteActivo(null) }
            else { setVista('municipios'); setMunicipioActivo(null) }
          }}
          style={s.backBtn} activeOpacity={0.7}
        >
          <IcoBack c={t.muted} />
        </TouchableOpacity>

        <View style={{ flex: 1, marginHorizontal: 8 }}>
          <Text style={[s.headerTitle, { color: t.text }]}>Trámites</Text>
          {/* Breadcrumb */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={s.crumbRow}>
              {crumbs.map((crumb, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                  {i > 0 && <IcoChev c={t.muted2} />}
                  <TouchableOpacity onPress={crumb.onPress} disabled={!crumb.onPress} activeOpacity={0.7}>
                    <Text style={[s.crumbText, {
                      color: !crumb.onPress ? t.text : t.muted,
                      fontFamily: !crumb.onPress ? 'Geist-SemiBold' : 'Geist-Regular',
                    }]}>
                      {crumb.label}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Badge vista */}
        <View style={[s.vistaBadge, {
          backgroundColor: vista === 'municipios'
            ? (isDark ? '#1a2e28' : '#e6f7f2')
            : (isDark ? '#1a2035' : '#eef2ff'),
        }]}>
          {vista === 'municipios' ? <IcoMap c={BRAND} /> : <IcoFile c="#818cf8" />}
        </View>
      </View>

      {/* Contenido */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 32 }]}
      >
        {vista === 'municipios' && (
          <VistaMunicipios
            isDark={isDark}
            query={searchMuni}
            setQuery={setSearchMuni}
            onSelect={irBandeja}
          />
        )}

        {vista === 'bandeja' && municipioActivo && (
          <VistaBandeja
            isDark={isDark}
            municipio={municipioActivo}
            tramites={tramitesMunicipio}
            onSelect={irExpediente}
            onNuevo={() => setShowNuevo(true)}
          />
        )}

        {vista === 'expediente' && tramiteActivo && (
          <VistaExpediente
            isDark={isDark}
            tramite={tramiteActivo}
            onAvanzar={handleAvanzar}
          />
        )}
      </ScrollView>

      {/* Modal nuevo trámite */}
      {showNuevo && municipioActivo && (
        <ModalNuevoTramite
          isDark={isDark}
          municipioId={municipioActivo.id}
          onClose={() => setShowNuevo(false)}
          onCreado={() => {
            setShowNuevo(false)
            Alert.alert('Trámite creado', 'El trámite fue registrado. Tu compañero lo conectará con Supabase.')
          }}
        />
      )}
    </View>
  )
}

const s = StyleSheet.create({
  root:       { flex: 1 },
  header:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  backBtn:    { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle:{ fontFamily: 'Geist-SemiBold', fontSize: 15, letterSpacing: -0.2 },
  crumbRow:   { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 1 },
  crumbText:  { fontSize: 11 },
  vistaBadge: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  content:    { padding: 16 },
})