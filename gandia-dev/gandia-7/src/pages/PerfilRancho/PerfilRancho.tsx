import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { useUser } from '../../context/UserContext'
import {
  extCache, activityCache,
  setExtCache, setActivityCache,
} from './perfilRanchoCache'
import type { RanchExtendedCached, ActivityItemCached } from './perfilRanchoCache'

// ─── ICON SYSTEM ──────────────────────────────────────────────────────────────
const SV = {
  viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
  strokeWidth: '1.65', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
}
type IP = { cls?: string }
const Edit      = ({ cls = 'w-3.5 h-3.5' }: IP) => <svg className={cls} {...SV}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
const Pin       = ({ cls = 'w-3.5 h-3.5' }: IP) => <svg className={cls} {...SV}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
const Cal       = ({ cls = 'w-3.5 h-3.5' }: IP) => <svg className={cls} {...SV}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
const Spark     = ({ cls = 'w-3 h-3'    }: IP) => <svg className={cls} {...SV}><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
const Check     = ({ cls = 'w-3.5 h-3.5' }: IP) => <svg className={cls} {...SV}><polyline points="20 6 9 17 4 12"/></svg>
const TrendUp   = ({ cls = 'w-3 h-3'    }: IP) => <svg className={cls} {...SV}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
const TrendDown = ({ cls = 'w-3 h-3'    }: IP) => <svg className={cls} {...SV}><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>
const FlatLine  = ({ cls = 'w-3 h-3'    }: IP) => <svg className={cls} {...SV}><line x1="5" y1="12" x2="19" y2="12"/></svg>
const ChevRight = ({ cls = 'w-3.5 h-3.5' }: IP) => <svg className={cls} {...SV}><polyline points="9 18 15 12 9 6"/></svg>
const Phone     = ({ cls = 'w-4 h-4'    }: IP) => <svg className={cls} {...SV}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
const Mail      = ({ cls = 'w-4 h-4'    }: IP) => <svg className={cls} {...SV}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
const Globe     = ({ cls = 'w-4 h-4'    }: IP) => <svg className={cls} {...SV}><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
const FileIco   = ({ cls = 'w-4 h-4'    }: IP) => <svg className={cls} {...SV}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
const ShieldIco = ({ cls = 'w-4 h-4'    }: IP) => <svg className={cls} {...SV}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
const ChartIco  = ({ cls = 'w-4 h-4'    }: IP) => <svg className={cls} {...SV}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
const BoxIco    = ({ cls = 'w-4 h-4'    }: IP) => <svg className={cls} {...SV}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
const DropIco   = ({ cls = 'w-4 h-4'    }: IP) => <svg className={cls} {...SV}><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>
const HomeIco   = ({ cls = 'w-4 h-4'    }: IP) => <svg className={cls} {...SV}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
const ScaleIco  = ({ cls = 'w-4 h-4'    }: IP) => <svg className={cls} {...SV}><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
const ExtLink   = ({ cls = 'w-3.5 h-3.5' }: IP) => <svg className={cls} {...SV}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface RanchCore {
  ranchName:             string
  operationType:         string
  cattleType:            string
  herdSize:              string
  yearsOfOperation:      string
  location:              string
  sanitaryCertifications:string
  uppNumber:             string
  siniigaNumber:         string
  officialRegistry:      string
  phone:                 string
  role:                  string
}

interface RanchExtended {
  bio:            string
  surface_ha:     number | null
  capacity_heads: number | null
  active_heads:   number | null
  exportable_pct: number | null
  founded_year:   number | null
  address_street: string
  municipality:   string
  postal_code:    string
  lat:            number | null
  lng:            number | null
  email_contact:  string
  website:        string
  grazing_system: string
  supplementation:string
  water_supply:   string
  infrastructure: { key: string; label: string; value: string }[]
  certifications: { label: string; value: string }[]
  mortality_pct:  number | null
  weight_gain_kg: number | null
  team_members:   { name: string; role: string; ini: string }[]
  team_roles:     string[]
  linked_mvz:     { name: string; license: string; ini: string } | null
}

interface ActivityItem {
  id:          number
  title:       string
  desc:        string
  time:        string
  ico:         string
}

const ROLE_LABELS: Record<string, string> = {
  producer: 'Productor Ganadero',
  mvz:      'Médico Veterinario',
  union:    'Unión Ganadera',
  exporter: 'Exportador',
  auditor:  'Auditor / Inspector',
}

const TABS = ['general', 'equipo', 'contacto'] as const
type Tab = typeof TABS[number]

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 60)   return `Hace ${m} min`
  const h = Math.floor(m / 60)
  if (h < 24)   return `Hace ${h} h`
  const d = Math.floor(h / 24)
  if (d === 1)  return 'Ayer'
  return `Hace ${d} d`
}

// ─── SHARED PRIMITIVES ────────────────────────────────────────────────────────
function SectionLabel({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-5">
      <Spark cls="w-3 h-3 text-[#2FAF8F] shrink-0" />
      <span className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400 leading-none">
        {text}
      </span>
      <div className="flex-1 h-px bg-stone-100 dark:bg-stone-800/50" />
    </div>
  )
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white dark:bg-[#141210] border border-stone-200/70 dark:border-stone-800/60 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] dark:shadow-none ${className}`}>
      {children}
    </div>
  )
}

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-stone-100 dark:bg-stone-800/60 rounded-lg ${className}`} />
}

// ─── KPI CARD ─────────────────────────────────────────────────────────────────
function KPICard({
  label, value, delta, dir, good, bars,
}: {
  label: string; value: string; delta: string
  dir: 'up' | 'down' | 'flat'; good: boolean | null
  bars: number[]
}) {
  const chipCls =
    good === true
      ? 'text-[#2FAF8F] bg-[#2FAF8F]/[0.09] dark:bg-[#2FAF8F]/[0.13] border-[#2FAF8F]/20'
      : good === false
        ? 'text-rose-500 bg-rose-50 dark:bg-rose-950/30 border-rose-200/50 dark:border-rose-900/40'
        : 'text-stone-400 dark:text-stone-500 bg-stone-100 dark:bg-stone-800/60 border-stone-200/60 dark:border-stone-700/40'
  const barAccent = good === true ? '#2FAF8F' : good === false ? '#f43f5e' : '#a8a29e'

  return (
    <Card className="p-5">
      <p className="text-[10.5px] font-semibold uppercase tracking-[0.09em] text-stone-400 dark:text-stone-500 mb-3 leading-none">{label}</p>
      <div className="flex items-start justify-between gap-2 mb-5">
        <p className="text-[26px] font-semibold tracking-[-0.03em] text-stone-900 dark:text-stone-50 leading-none">{value}</p>
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold border shrink-0 mt-0.5 ${chipCls}`}>
          {dir === 'up'   && <TrendUp />}
          {dir === 'down' && <TrendDown />}
          {dir === 'flat' && <FlatLine />}
          {delta}
        </span>
      </div>
      <div className="flex items-end gap-[3px]" style={{ height: 36 }}>
        {bars.map((h, i) => {
          const isLast = i === bars.length - 1
          return (
            <div key={i} className="flex-1 rounded-[3px]"
              style={{
                height: `${h}%`,
                backgroundColor: isLast ? barAccent : good === null ? 'rgba(0,0,0,0.08)' : `${barAccent}28`,
                opacity: isLast ? 1 : 0.5 + i * 0.13,
              }}
            />
          )
        })}
      </div>
    </Card>
  )
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <Card className="px-4 py-4 relative overflow-hidden">
      <div className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full bg-[#2FAF8F]/40" />
      <p className="text-[10px] font-semibold uppercase tracking-[0.09em] text-stone-400 dark:text-stone-500 mb-2 leading-none">{label}</p>
      <p className="text-[22px] font-semibold tracking-[-0.03em] text-stone-900 dark:text-stone-50 leading-none">{value}</p>
    </Card>
  )
}

function ActivityRow({ title, desc, time, ico }: ActivityItem) {
  const Ic = ico === 'file' ? FileIco : ico === 'shield' ? ShieldIco : ico === 'chart' ? ChartIco : Check
  return (
    <div className="flex items-start gap-3.5 py-4 group cursor-pointer">
      <div className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-stone-800/60 flex items-center justify-center text-stone-400 dark:text-stone-500 group-hover:bg-[#2FAF8F]/[0.09] group-hover:text-[#2FAF8F] transition-all shrink-0 mt-0.5">
        <Ic cls="w-3.5 h-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2 mb-0.5">
          <p className="text-[13px] font-medium text-stone-700 dark:text-stone-200 group-hover:text-stone-900 dark:group-hover:text-stone-50 transition-colors leading-snug">{title}</p>
          <span className="text-[10.5px] text-stone-300 dark:text-stone-600 shrink-0">{time}</span>
        </div>
        <p className="text-[12px] text-stone-400 dark:text-stone-500 leading-relaxed">{desc}</p>
      </div>
    </div>
  )
}

function InfraRow({ label, value, iconKey }: { label: string; value: string; iconKey: string }) {
  const Ic = iconKey === 'drop' ? DropIco : iconKey === 'scal' ? ScaleIco : iconKey === 'home' ? HomeIco : BoxIco
  return (
    <div className="flex items-center gap-3.5 py-3.5">
      <div className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-stone-800/60 flex items-center justify-center text-stone-400 dark:text-stone-500 shrink-0">
        <Ic cls="w-3.5 h-3.5" />
      </div>
      <p className="flex-1 text-[13px] text-stone-600 dark:text-stone-400 leading-snug">{label}</p>
      <p className="text-[13px] font-semibold text-stone-700 dark:text-stone-200 leading-snug">{value}</p>
    </div>
  )
}

function TeamRow({ name, role, ini }: { name: string; role: string; ini: string }) {
  return (
    <div className="flex items-center gap-3 py-3.5 group cursor-pointer">
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#2FAF8F] to-[#1a9070] flex items-center justify-center text-white text-[11px] font-bold shrink-0 shadow-sm">
        {ini}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-stone-700 dark:text-stone-200 group-hover:text-stone-900 dark:group-hover:text-stone-50 transition-colors leading-snug">{name}</p>
        <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-0.5 leading-none">{role}</p>
      </div>
      <ChevRight cls="w-3.5 h-3.5 text-stone-200 dark:text-stone-700 group-hover:text-stone-400 dark:group-hover:text-stone-500 transition-colors" />
    </div>
  )
}

function ContactLink({ icon, label, value, href }: { icon: React.ReactNode; label: string; value: string; href: string }) {
  const isExternal = href.startsWith('http')
  return (
    <a href={href} target={isExternal ? '_blank' : undefined} rel={isExternal ? 'noopener noreferrer' : undefined}
      className="flex items-center gap-4 px-5 py-4 group hover:bg-stone-50/60 dark:hover:bg-stone-800/20 transition-colors">
      <div className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-stone-800/60 flex items-center justify-center text-stone-400 dark:text-stone-500 group-hover:bg-[#2FAF8F]/[0.09] group-hover:text-[#2FAF8F] transition-all shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-stone-400 dark:text-stone-500 mb-0.5 leading-none">{label}</p>
        <p className="text-[13px] font-medium text-stone-700 dark:text-stone-200 group-hover:text-[#2FAF8F] transition-colors truncate">{value}</p>
      </div>
      <ChevRight cls="w-3.5 h-3.5 text-stone-200 dark:text-stone-700 group-hover:text-[#2FAF8F] transition-colors shrink-0" />
    </a>
  )
}



// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function PerfilRancho() {
  const navigate    = useNavigate()
  const { profile } = useUser()
  const [tab,      setTab]      = useState<Tab>('general')
  const [loading,  setLoading]  = useState(extCache === null)
  const [core,     setCore]     = useState<RanchCore | null>(null)
  const [ext,      setExt]      = useState<RanchExtended | null>(extCache as RanchExtended | null)
  const [activity, setActivity] = useState<ActivityItem[]>(activityCache as ActivityItem[])
  const didFetch    = useRef(extCache !== null)

  // ─── LOAD ───────────────────────────────────────────────────────────────────

  // Core: leer directo del UserContext (ya está en memoria, sin fetch)
  useEffect(() => {
    if (!profile) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pd  = (profile.personal_data      as Record<string, any>) ?? {}
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const id_ = (profile.institutional_data as Record<string, any>) ?? {}
    setCore({
      ranchName:              id_.ranchName              || '—',
      operationType:          id_.operationType          || '—',
      cattleType:             id_.cattleType             || '—',
      herdSize:               id_.herdSize               || '—',
      yearsOfOperation:       id_.yearsOfOperation       || '—',
      location:               id_.location               || '—',
      sanitaryCertifications: id_.sanitaryCertifications || 'Ninguna',
      uppNumber:              id_.uppNumber              || '—',
      siniigaNumber:          id_.siniigaNumber          || '—',
      officialRegistry:       id_.officialRegistry       || '—',
      phone:                  pd.phone                   || '—',
      role:                   pd.role                    || '',
    })
  }, [profile])

  useEffect(() => {
    // Si ya tenemos caché del extended, no volvemos a fetchear
    if (didFetch.current) return
    didFetch.current = true

    const load = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const uid = session?.user?.id
        if (!uid) { setLoading(false); return }

        // ── 2. Extended from ranch_extended_profiles ────────────────────────
        const { data: re } = await supabase
          .from('ranch_extended_profiles')
          .select('*')
          .eq('user_id', uid)
          .maybeSingle()

        const extData: RanchExtended = {
          bio:            re?.bio            ?? '',
          surface_ha:     re?.surface_ha     ?? null,
          capacity_heads: re?.capacity_heads ?? null,
          active_heads:   re?.active_heads   ?? null,
          exportable_pct: re?.exportable_pct ?? null,
          founded_year:   re?.founded_year   ?? null,
          address_street: re?.address_street ?? '',
          municipality:   re?.municipality   ?? '',
          postal_code:    re?.postal_code    ?? '',
          lat:            re?.lat            ?? null,
          lng:            re?.lng            ?? null,
          email_contact:  re?.email_contact  ?? session?.user?.email ?? '',
          website:        re?.website        ?? '',
          grazing_system: re?.grazing_system ?? '—',
          supplementation:re?.supplementation?? '—',
          water_supply:   re?.water_supply   ?? '—',
          infrastructure: re?.infrastructure ?? [],
          certifications: re?.certifications ?? [],
          mortality_pct:  re?.mortality_pct  ?? null,
          weight_gain_kg: re?.weight_gain_kg ?? null,
          team_members:   re?.team_members   ?? [],
          team_roles:     re?.team_roles     ?? [],
          linked_mvz:     re?.linked_mvz     ?? null,
        }
        setExtCache(extData as RanchExtendedCached)
        setExt(extData)

        // ── 3. Recent activity from eventos ─────────────────────────────────
        const { data: evs } = await supabase
          .from('eventos')
          .select('id, tipo, descripcion, created_at')
          .eq('ejecutado_por', uid)
          .order('created_at', { ascending: false })
          .limit(4)

        const ICO_MAP: Record<string, string> = {
          vacunacion: 'shield', peso: 'chart', pasaporte: 'check', inventario: 'file',
        }

        if (evs && evs.length > 0) {
          const acts = evs.map(e => ({
            id:    e.id,
            title: e.tipo        || 'Evento',
            desc:  e.descripcion || '',
            time:  timeAgo(e.created_at),
            ico:   ICO_MAP[e.tipo?.toLowerCase()] ?? 'file',
          }))
          setActivityCache(acts as ActivityItemCached[])
          setActivity(acts)
        }
      } catch (e) {
        console.error('PerfilRancho load error:', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // ─── DERIVED ────────────────────────────────────────────────────────────────
  const ranchInitial = core?.ranchName?.charAt(0).toUpperCase() ?? 'R'
  const roleLabel    = ROLE_LABELS[core?.role ?? ''] ?? core?.role ?? ''

  const kpis = [
    {
      label: 'Mortalidad mensual',
      value: ext?.mortality_pct  != null ? `${ext.mortality_pct}%`  : '—',
      delta: '—', dir: 'flat' as const, good: null as null,
      bars: [62, 74, 55, 68, 38],
    },
    {
      label: 'Ganancia de peso / día',
      value: ext?.weight_gain_kg != null ? `${ext.weight_gain_kg} kg` : '—',
      delta: '—', dir: 'flat' as const, good: null as null,
      bars: [38, 52, 64, 60, 80],
    },
    {
      label: 'Animales exportables',
      value: ext?.exportable_pct != null ? `${ext.exportable_pct}%` : '—',
      delta: '—', dir: 'flat' as const, good: null as null,
      bars: [54, 57, 61, 64, 65],
    },
  ]

  // INFO_GRID built from real data
  const infoGrid: [string, string][] = [
    ['Superficie total',    ext?.surface_ha     ? `${ext.surface_ha} ha`       : '—'],
    ['Cap. instalada',      ext?.capacity_heads ? `${ext.capacity_heads} cab.`  : '—'],
    ['Animales activos',    ext?.active_heads   ? `${ext.active_heads} cab.`    : core?.herdSize ?? '—'],
    ['Tipo de ganado',      core?.cattleType    ?? '—'],
    ['Tipo de producción',  core?.operationType ?? '—'],
    ['Certificaciones',     core?.sanitaryCertifications ?? '—'],
    ['Sistema de pastoreo', ext?.grazing_system  ?? '—'],
    ['Suplementación',      ext?.supplementation ?? '—'],
    ['Abastecimiento agua', ext?.water_supply    ?? '—'],
  ]

  const contacts = [
    core?.phone && core.phone !== '—'
      ? { icon: <Phone />, label: 'Teléfono', value: core.phone, href: `tel:${core.phone}` }
      : null,
    ext?.email_contact
      ? { icon: <Mail />, label: 'Correo', value: ext.email_contact, href: `mailto:${ext.email_contact}` }
      : null,
    ext?.website
      ? { icon: <Globe />, label: 'Sitio web', value: ext.website, href: ext.website.startsWith('http') ? ext.website : `https://${ext.website}` }
      : null,
  ].filter(Boolean) as { icon: React.ReactNode; label: string; value: string; href: string }[]

  const certRows: [string, string][] = [
    ['Número UPP',        core?.uppNumber    ?? '—'],
    ['Registro SINIIGA',  core?.siniigaNumber ?? '—'],
    ...(ext?.certifications.map(c => [c.label, c.value] as [string, string]) ?? []),
  ]

  // ─── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600&display=swap');
        .pr, .pr * { -webkit-font-smoothing: antialiased; }
        .pr        { font-family: 'Geist', system-ui, sans-serif; }
        .pr-s      { font-family: 'Instrument Serif', Georgia, serif; }
        .pr *:focus, .pr *:focus-visible { outline: none !important; box-shadow: none !important; }
        .pr::-webkit-scrollbar { width: 3px; }
        .pr::-webkit-scrollbar-track { background: transparent; }
        .pr::-webkit-scrollbar-thumb { background: #e7e5e4; border-radius: 999px; }
        .dark .pr::-webkit-scrollbar-thumb { background: #3c3836; }
        .pr { scrollbar-width: thin; scrollbar-color: #e7e5e4 transparent; }
        .dark .pr { scrollbar-color: #3c3836 transparent; }
        @keyframes pr-rise { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .pr-rise { animation: pr-rise 400ms cubic-bezier(.16,1,.3,1) both; }
        @keyframes pr-fade { from{opacity:0} to{opacity:1} }
        .pr-fade { animation: pr-fade 200ms ease both; }
        .pr-hero {
          background:
            radial-gradient(ellipse 80% 70% at 75% -5%, rgba(47,175,143,.50) 0%, transparent 65%),
            radial-gradient(ellipse 55% 90% at 5% 105%, rgba(26,144,112,.38) 0%, transparent 60%),
            #0e1e1a;
        }
        .pr-tab-line { position:absolute; inset-inline:0; bottom:-1px; height:2px; border-radius:2px 2px 0 0; background:#2FAF8F; }
      `}</style>

      <div className="pr h-full overflow-y-auto bg-[#fafaf9] dark:bg-[#0c0a09]">

        {/* HERO */}
        <div className="pr-hero relative h-44 md:h-56 shrink-0 overflow-hidden select-none">
          <svg className="absolute inset-0 w-full h-full opacity-[0.05]" xmlns="http://www.w3.org/2000/svg">
            <defs><pattern id="pr-grid" width="28" height="28" patternUnits="userSpaceOnUse"><path d="M 28 0 L 0 0 0 28" fill="none" stroke="white" strokeWidth="0.5"/></pattern></defs>
            <rect width="100%" height="100%" fill="url(#pr-grid)" />
          </svg>
          <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full border border-white/[0.05]" />
          <div className="absolute -right-4  -top-4  w-44 h-44 rounded-full border border-white/[0.05]" />
          <div className="absolute right-0 bottom-0 w-80 h-40 rounded-full bg-[#2FAF8F]/[0.06] blur-3xl" />
          <div className="absolute top-4 right-5 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 h-[22px] px-2.5 rounded-full bg-white/[0.09] backdrop-blur-sm border border-white/[0.10] text-white/60 text-[10px] font-medium">
              <span className="w-[6px] h-[6px] rounded-full bg-emerald-400 shrink-0" />
              Activo
            </span>
            {core?.sanitaryCertifications && core.sanitaryCertifications !== '—' && core.sanitaryCertifications !== 'Ninguna' && (
              <span className="hidden sm:inline-flex items-center h-[22px] px-2.5 rounded-full bg-white/[0.09] backdrop-blur-sm border border-white/[0.10] text-white/60 text-[10px] font-medium">
                {core.sanitaryCertifications}
              </span>
            )}
          </div>
        </div>

        {/* IDENTITY CARD SHEET */}
        <div className="relative -mt-5 bg-[#fafaf9] dark:bg-[#0c0a09] rounded-t-[28px] z-10 shadow-[0_-4px_24px_rgba(0,0,0,0.10)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.40)]">
          <div className="flex justify-center pt-3 pb-0">
            <div className="w-8 h-[3px] rounded-full bg-stone-200 dark:bg-stone-700" />
          </div>

          <div className="px-5 md:px-8 pt-4 pb-0">

            {/* Avatar + identity */}
            <div className="pr-rise flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-[64px] h-[64px] md:w-[72px] md:h-[72px] rounded-[18px] bg-white dark:bg-[#1c1917] flex items-center justify-center shrink-0"
                  style={{ boxShadow: '0 6px 24px rgba(0,0,0,0.18)' }}>
                  {loading
                    ? <Skeleton className="w-8 h-8 rounded-lg" />
                    : <span className="pr-s italic text-[26px] md:text-[30px] text-[#2FAF8F] leading-none select-none">{ranchInitial}</span>
                  }
                </div>
                <div className="min-w-0">
                  {loading
                    ? <><Skeleton className="w-28 h-4 mb-2" /><Skeleton className="w-48 h-6" /></>
                    : <>
                        <span className="inline-flex items-center gap-1.5 h-[20px] px-2 rounded-full text-[9.5px] font-semibold tracking-[0.05em] text-[#2FAF8F] bg-[#2FAF8F]/[0.10] dark:bg-[#2FAF8F]/[0.15] border border-[#2FAF8F]/25 mb-1.5">
                          {roleLabel || 'Productor Ganadero'}
                        </span>
                        <h1 className="pr-s italic text-[20px] sm:text-[23px] text-stone-900 dark:text-stone-50 leading-[1.15] tracking-[-0.01em] truncate">
                          {core?.ranchName ?? '—'}
                        </h1>
                      </>
                  }
                </div>
              </div>
              <button onClick={() => navigate('/perfil/editar')}
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl text-[12.5px] font-medium bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 hover:bg-stone-700 dark:hover:bg-white active:scale-[0.96] transition-all shadow-sm shrink-0">
                <Edit cls="w-3.5 h-3.5" />
                Editar perfil
              </button>
            </div>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 mt-3 mb-0">
              {loading
                ? <Skeleton className="w-40 h-3" />
                : <>
                    {core?.location && core.location !== '—' && (
                      <span className="flex items-center gap-1 text-[11.5px] text-stone-400 dark:text-stone-500">
                        <Pin cls="w-[10px] h-[10px] shrink-0" />{core.location}, México
                      </span>
                    )}
                    {ext?.founded_year && (
                      <>
                        <span className="text-stone-200 dark:text-stone-700">·</span>
                        <span className="flex items-center gap-1 text-[11.5px] text-stone-400 dark:text-stone-500">
                          <Cal cls="w-[10px] h-[10px] shrink-0" />Fundado en {ext.founded_year}
                        </span>
                      </>
                    )}
                    {core?.yearsOfOperation && core.yearsOfOperation !== '—' && !ext?.founded_year && (
                      <>
                        <span className="text-stone-200 dark:text-stone-700">·</span>
                        <span className="flex items-center gap-1 text-[11.5px] text-stone-400 dark:text-stone-500">
                          <Cal cls="w-[10px] h-[10px] shrink-0" />{core.yearsOfOperation} de operación
                        </span>
                      </>
                    )}
                  </>
              }
            </div>

            {/* TAB BAR */}
            <div className="pr-rise flex items-center border-b border-stone-200/70 dark:border-stone-800/50 mt-5 mb-8" style={{ animationDelay: '55ms' }}>
              {TABS.map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={['relative h-10 px-4 text-[12.5px] font-medium capitalize transition-colors',
                    tab === t ? 'text-stone-900 dark:text-stone-50' : 'text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-300',
                  ].join(' ')}>
                  {t}
                  {tab === t && <span className="pr-tab-line" aria-hidden />}
                </button>
              ))}
            </div>

            {/* ══ GENERAL ══ */}
            {tab === 'general' && (
              <div className="pr-fade">

                {/* Bio */}
                {(loading || ext?.bio) && (
                  <div className="pr-rise mb-6">
                    {loading
                      ? <><Skeleton className="w-full h-4 mb-2" /><Skeleton className="w-4/5 h-4" /></>
                      : <p className="pr-s italic text-[17.5px] text-stone-700 dark:text-stone-300 leading-[1.75]">{ext?.bio}</p>
                    }
                  </div>
                )}

                {/* Quick stats */}
                <div className="pr-rise grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8" style={{ animationDelay: '50ms' }}>
                  {loading
                    ? Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)
                    : <>
                        <StatPill label="Superficie"     value={ext?.surface_ha     ? `${ext.surface_ha} ha`       : '—'} />
                        <StatPill label="Cap. instalada" value={ext?.capacity_heads ? `${ext.capacity_heads} cab.`  : '—'} />
                        <StatPill label="Activos"        value={ext?.active_heads   ? `${ext.active_heads} cab.`    : core?.herdSize ?? '—'} />
                        <StatPill label="Exportables"    value={ext?.exportable_pct ? `${ext.exportable_pct}%`      : '—'} />
                      </>
                  }
                </div>

                {/* KPIs */}
                <section className="pr-rise mb-8" style={{ animationDelay: '75ms' }}>
                  <SectionLabel text="Indicadores clave" />
                  {loading
                    ? <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">{Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-36 rounded-2xl" />)}</div>
                    : <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {kpis.map((k, i) => <KPICard key={i} {...k} />)}
                      </div>
                  }
                </section>

                {/* Datos generales */}
                <section className="pr-rise mb-8" style={{ animationDelay: '100ms' }}>
                  <SectionLabel text="Datos del rancho" />
                  <Card>
                    <div className="grid grid-cols-2 sm:grid-cols-3 divide-x divide-y divide-stone-100 dark:divide-stone-800/50">
                      {infoGrid.map(([lbl, val]) => (
                        <div key={lbl} className="px-5 py-4 hover:bg-stone-50/60 dark:hover:bg-stone-800/20 transition-colors">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-stone-400 dark:text-stone-500 mb-1.5 leading-none">{lbl}</p>
                          <p className="text-[13px] font-semibold text-stone-700 dark:text-stone-200 leading-snug">{val}</p>
                        </div>
                      ))}
                    </div>
                  </Card>
                </section>

                {/* Infraestructura */}
                {(ext?.infrastructure ?? []).length > 0 && (
                  <section className="pr-rise mb-8" style={{ animationDelay: '125ms' }}>
                    <SectionLabel text="Infraestructura" />
                    <Card className="px-5">
                      <div className="divide-y divide-stone-100 dark:divide-stone-800/50">
                        {ext!.infrastructure.map(item => (
                          <InfraRow key={item.key} label={item.label} value={item.value} iconKey={item.key} />
                        ))}
                      </div>
                    </Card>
                  </section>
                )}

                {/* Actividad */}
                <section className="pr-rise mb-14" style={{ animationDelay: '150ms' }}>
                  <SectionLabel text="Actividad reciente" />
                  {loading
                    ? <Card className="px-5">{Array(3).fill(0).map((_, i) => <div key={i} className="py-4"><Skeleton className="w-full h-10" /></div>)}</Card>
                    : activity.length > 0
                      ? <Card className="px-5">
                          <div className="divide-y divide-stone-100 dark:divide-stone-800/50">
                            {activity.map(item => <ActivityRow key={item.id} {...item} />)}
                          </div>
                        </Card>
                      : <Card className="px-5 py-8 text-center">
                          <p className="text-[12.5px] text-stone-400 dark:text-stone-500">Sin actividad registrada aún</p>
                        </Card>
                  }
                </section>
              </div>
            )}

            {/* ══ EQUIPO ══ */}
            {tab === 'equipo' && (
              <div className="pr-fade">

                {/* Miembros */}
                <section className="pr-rise mb-8">
                  <SectionLabel text="Miembros del equipo" />
                  {loading
                    ? <Card className="px-5">{Array(3).fill(0).map((_, i) => <div key={i} className="py-4"><Skeleton className="w-full h-10" /></div>)}</Card>
                    : (ext?.team_members ?? []).length > 0
                      ? <Card className="px-5">
                          <div className="divide-y divide-stone-100 dark:divide-stone-800/50">
                            {ext!.team_members.map((m, i) => <TeamRow key={i} {...m} />)}
                          </div>
                        </Card>
                      : <Card className="px-5 py-8 text-center">
                          <p className="text-[12.5px] text-stone-400 dark:text-stone-500">Agrega miembros desde "Editar perfil"</p>
                        </Card>
                  }
                </section>

                {/* Roles activos */}
                {(ext?.team_roles ?? []).length > 0 && (
                  <section className="pr-rise mb-8" style={{ animationDelay: '45ms' }}>
                    <SectionLabel text="Roles activos" />
                    <Card className="px-5 py-5">
                      <div className="flex flex-wrap gap-2">
                        {ext!.team_roles.map(r => (
                          <span key={r}
                            className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full text-[11.5px] font-medium text-[#2FAF8F] bg-[#2FAF8F]/[0.08] dark:bg-[#2FAF8F]/[0.12] border border-[#2FAF8F]/20">
                            <Check cls="w-3 h-3" />
                            {r}
                          </span>
                        ))}
                      </div>
                    </Card>
                  </section>
                )}

                {/* MVZ vinculado */}
                {ext?.linked_mvz && (
                  <section className="pr-rise mb-14" style={{ animationDelay: '70ms' }}>
                    <SectionLabel text="MVZ certificado vinculado" />
                    <Card className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#2FAF8F] to-[#1a9070] flex items-center justify-center text-white text-[11px] font-bold shrink-0 shadow-sm">
                          {ext.linked_mvz.ini}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-medium text-stone-700 dark:text-stone-200 leading-snug">
                            {ext.linked_mvz.name}
                          </p>
                          <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-0.5 leading-none">
                            Cédula {ext.linked_mvz.license} · SENASICA verificado
                          </p>
                        </div>
                        <span className="inline-flex items-center gap-1 h-6 px-2.5 rounded-full text-[10.5px] font-semibold text-[#2FAF8F] bg-[#2FAF8F]/[0.09] border border-[#2FAF8F]/20 shrink-0">
                          <Check cls="w-2.5 h-2.5" />
                          Activa
                        </span>
                      </div>
                    </Card>
                  </section>
                )}

                {!ext?.linked_mvz && !loading && (
                  <section className="pr-rise mb-14" style={{ animationDelay: '70ms' }}>
                    <SectionLabel text="MVZ certificado vinculado" />
                    <Card className="px-5 py-8 text-center">
                      <p className="text-[12.5px] text-stone-400 dark:text-stone-500">Sin MVZ vinculado aún</p>
                    </Card>
                  </section>
                )}
              </div>
            )}

            {/* ══ CONTACTO ══ */}
            {tab === 'contacto' && (
              <div className="pr-fade">

                {contacts.length > 0 && (
                  <section className="pr-rise mb-8">
                    <SectionLabel text="Información de contacto" />
                    <Card className="overflow-hidden divide-y divide-stone-100 dark:divide-stone-800/50">
                      {contacts.map(c => <ContactLink key={c.label} {...c} />)}
                    </Card>
                  </section>
                )}

                {/* Ubicación */}
                {(ext?.address_street || ext?.lat) && (
                  <section className="pr-rise mb-8" style={{ animationDelay: '45ms' }}>
                    <SectionLabel text="Ubicación" />
                    <Card className="p-5">
                      {ext.address_street && (
                        <p className="text-[13px] font-medium text-stone-700 dark:text-stone-200 mb-0.5 leading-snug">{ext.address_street}</p>
                      )}
                      <p className="text-[12px] text-stone-400 dark:text-stone-500 mb-5">
                        {[core?.location, 'México', ext.postal_code].filter(Boolean).join(' · ')}
                      </p>

                      {ext.lat && ext.lng && (
                        <>
                          <div className="grid grid-cols-3 gap-px bg-stone-100 dark:bg-stone-800/50 rounded-xl overflow-hidden mb-4">
                            {[['Latitud', `${ext.lat}° N`], ['Longitud', `${ext.lng}° W`], ['Municipio', ext.municipality || '—']].map(([l, v]) => (
                              <div key={l} className="bg-white dark:bg-[#141210] px-4 py-3.5">
                                <p className="text-[9.5px] font-semibold uppercase tracking-[0.09em] text-stone-400 dark:text-stone-500 mb-1.5 leading-none">{l}</p>
                                <p className="text-[12px] font-mono font-medium text-stone-700 dark:text-stone-200 leading-none">{v}</p>
                              </div>
                            ))}
                          </div>
                          <a href={`https://maps.google.com/?q=${ext.lat},${ext.lng}`} target="_blank" rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 h-9 w-full rounded-xl text-[12.5px] font-medium text-stone-600 dark:text-stone-300 bg-stone-100 dark:bg-stone-800/60 hover:bg-stone-200 dark:hover:bg-stone-700 active:scale-[0.97] transition-all">
                            <ExtLink cls="w-3.5 h-3.5" />
                            Abrir en Google Maps
                          </a>
                        </>
                      )}
                    </Card>
                  </section>
                )}

                {/* Certificaciones */}
                <section className="pr-rise mb-14" style={{ animationDelay: '70ms' }}>
                  <SectionLabel text="Certificaciones y registro oficial" />
                  <Card className="overflow-hidden divide-y divide-stone-100 dark:divide-stone-800/50">
                    {certRows.map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between px-5 py-4 gap-4 hover:bg-stone-50/60 dark:hover:bg-stone-800/20 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-lg bg-[#2FAF8F]/[0.09] dark:bg-[#2FAF8F]/[0.13] flex items-center justify-center shrink-0">
                            <Check cls="w-3 h-3 text-[#2FAF8F]" />
                          </div>
                          <p className="text-[12.5px] text-stone-600 dark:text-stone-300">{k}</p>
                        </div>
                        <p className="text-[12px] font-mono font-medium text-stone-500 dark:text-stone-400 text-right tabular-nums">{v}</p>
                      </div>
                    ))}
                  </Card>
                </section>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  )
}