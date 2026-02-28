import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { useUser } from '../../context/UserContext'
import { ugExtCache, setUGExtCache } from './perfilUGCache'
import type { UGExtendedCached } from './perfilUGCache'

// ─── ICON SYSTEM ──────────────────────────────────────────────────────────────
const SV = {
  viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
  strokeWidth: '1.65', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
}
type IP = { cls?: string }

const Edit      = ({ cls = 'w-3.5 h-3.5' }: IP) => <svg className={cls} {...SV}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
const Pin       = ({ cls = 'w-[10px] h-[10px]' }: IP) => <svg className={cls} {...SV}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
const Cal       = ({ cls = 'w-[10px] h-[10px]' }: IP) => <svg className={cls} {...SV}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
const Spark     = ({ cls = 'w-3 h-3' }: IP)    => <svg className={cls} {...SV}><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
const Check     = ({ cls = 'w-3 h-3' }: IP)    => <svg className={cls} {...SV}><polyline points="20 6 9 17 4 12"/></svg>
const ChevRight = ({ cls = 'w-3.5 h-3.5' }: IP)=> <svg className={cls} {...SV}><polyline points="9 18 15 12 9 6"/></svg>
const Users     = ({ cls = 'w-4 h-4' }: IP)    => <svg className={cls} {...SV}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
const MapIco    = ({ cls = 'w-4 h-4' }: IP)    => <svg className={cls} {...SV}><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>
const Layers    = ({ cls = 'w-4 h-4' }: IP)    => <svg className={cls} {...SV}><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
const Clock     = ({ cls = 'w-4 h-4' }: IP)    => <svg className={cls} {...SV}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
const Shield    = ({ cls = 'w-4 h-4' }: IP)    => <svg className={cls} {...SV}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
const Phone     = ({ cls = 'w-4 h-4' }: IP)    => <svg className={cls} {...SV}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
const Mail      = ({ cls = 'w-4 h-4' }: IP)    => <svg className={cls} {...SV}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
const Globe     = ({ cls = 'w-4 h-4' }: IP)    => <svg className={cls} {...SV}><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>

const FileIco   = ({ cls = 'w-4 h-4' }: IP)    => <svg className={cls} {...SV}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
const ExtLink   = ({ cls = 'w-3.5 h-3.5' }: IP)=> <svg className={cls} {...SV}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
const BookOpen  = ({ cls = 'w-4 h-4' }: IP)    => <svg className={cls} {...SV}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
const DollarSign= ({ cls = 'w-4 h-4' }: IP)    => <svg className={cls} {...SV}><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>

// ─── DEFAULT DATA (fallback mientras no hay BD) ───────────────────────────────
const DEFAULT_DIRECTIVA = [
  { id:'1', nombre: 'Ing. Roberto Medina Flores', cargo: 'Presidente',         periodo: '2023 – 2026', email: '', telefono: '' },
  { id:'2', nombre: 'Lic. Patricia Valles',        cargo: 'Secretaria General', periodo: '2023 – 2026', email: '', telefono: '' },
  { id:'3', nombre: 'C.P. Ernesto Aguirre',        cargo: 'Tesorero',           periodo: '2023 – 2026', email: '', telefono: '' },
  { id:'4', nombre: 'Ing. Lucía Hernández',        cargo: 'Vocal de Sanidad',   periodo: '2023 – 2026', email: '', telefono: '' },
]

const DEFAULT_ZONAS = [
  { id:'1', zona: 'Zona Norte',  municipios: 'Guanaceví, Tepehuanes, San Bernardo', cabezas: '128,000' },
  { id:'2', zona: 'Zona Centro', municipios: 'Durango, Nombre de Dios, Canatlán',   cabezas: '195,000' },
  { id:'3', zona: 'Zona Sur',    municipios: 'Mezquital, Pueblo Nuevo, Súchil',     cabezas: '98,000'  },
  { id:'4', zona: 'Zona Valles', municipios: 'El Salto, Otáez, Tamazula',           cabezas: '59,000'  },
]

const DEFAULT_SERVICIOS = [
  { icon: 'file',    title: 'Gestión de Trámites',    desc: 'Asesoría y tramitación ante SENASICA, SAGARPA y dependencias estatales' },
  { icon: 'shield',  title: 'Certificación Sanitaria', desc: 'Emisión de certificados zoosanitarios para movilización y exportación'  },
  { icon: 'shield2', title: 'Asesoría Legal',           desc: 'Representación jurídica en conflictos agrarios y comerciales'           },
  { icon: 'dollar',  title: 'Crédito Ganadero',        desc: 'Acceso preferente a financiamiento con FIRA y Bancomext'               },
  { icon: 'book',    title: 'Capacitación',             desc: 'Cursos de manejo ganadero, nutrición y buenas prácticas'               },
  { icon: 'globe',   title: 'Vinculación Exportadora',  desc: 'Conexión con exportadores certificados y rastros TIF'                  },
]

const DEFAULT_AFILIACIONES = [
  { siglas: 'CNG',      nombre: 'Confederación Nacional Ganadera',  nivel: 'Nacional'      },
  { siglas: 'SAGARPA',  nombre: 'Secretaría de Agricultura',         nivel: 'Federal'       },
  { siglas: 'SENASICA', nombre: 'Servicio Nacional de Sanidad',      nivel: 'Federal'       },
  { siglas: 'OIE',      nombre: 'Organización Mundial de Sanidad',   nivel: 'Internacional' },
]

const TABS = ['general', 'directiva', 'contacto'] as const
type Tab  = typeof TABS[number]

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

// ─── STAT PILL ────────────────────────────────────────────────────────────────
function StatPill({ label, value, icon }: { label: string; value: string; icon: string }) {
  const Ic = icon === 'users' ? Users : icon === 'map' ? MapIco : icon === 'layers' ? Layers : Clock
  return (
    <Card className="px-4 py-4 relative overflow-hidden">
      <div className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full bg-[#2FAF8F]/40" />
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[#2FAF8F]"><Ic cls="w-3.5 h-3.5" /></span>
        <p className="text-[10px] font-semibold uppercase tracking-[0.09em] text-stone-400 dark:text-stone-500 leading-none">
          {label}
        </p>
      </div>
      <p className="text-[22px] font-semibold tracking-[-0.03em] text-stone-900 dark:text-stone-50 leading-none">
        {value}
      </p>
    </Card>
  )
}

// ─── SERVICE ITEM ─────────────────────────────────────────────────────────────
function ServiceItem({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  const Ic = icon === 'file' ? FileIco : icon === 'dollar' ? DollarSign : icon === 'book' ? BookOpen : icon === 'globe' ? Globe : Shield
  return (
    <div className="flex items-start gap-3.5 py-4 group cursor-pointer">
      <div className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-stone-800/60 flex items-center justify-center text-stone-400 dark:text-stone-500 group-hover:bg-[#2FAF8F]/[0.09] group-hover:text-[#2FAF8F] transition-all shrink-0 mt-0.5">
        <Ic cls="w-3.5 h-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-[13px] font-medium text-stone-700 dark:text-stone-200 group-hover:text-stone-900 dark:group-hover:text-stone-50 transition-colors leading-snug">
            {title}
          </p>
          <span className="w-[5px] h-[5px] rounded-full bg-[#2FAF8F] shrink-0" />
        </div>
        <p className="text-[12px] text-stone-400 dark:text-stone-500 leading-relaxed">{desc}</p>
      </div>
    </div>
  )
}

// ─── ZONA ITEM ────────────────────────────────────────────────────────────────
function ZonaItem({ zona, municipios, cabezas }: { zona: string; municipios: string; cabezas: string }) {
  return (
    <div className="flex items-start gap-3.5 py-3.5 group">
      <div className="w-[6px] h-[6px] rounded-full bg-[#2FAF8F] shrink-0 mt-[7px]" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <p className="text-[13px] font-medium text-stone-700 dark:text-stone-200 leading-none">{zona}</p>
          <span className="text-[12px] font-semibold text-[#2FAF8F] shrink-0">{cabezas} cab.</span>
        </div>
        <p className="text-[11.5px] text-stone-400 dark:text-stone-500 truncate">{municipios}</p>
      </div>
    </div>
  )
}

// ─── ACTIVITY ROW ─────────────────────────────────────────────────────────────

// ─── KPI BAR ──────────────────────────────────────────────────────────────────
function KPIBar({ label, value }: { label: string; value: number | null }) {
  if (value === null) return null
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[12px] text-stone-500 dark:text-stone-400 font-medium">{label}</span>
        <span className="text-[12px] font-semibold text-[#2FAF8F]">{value}%</span>
      </div>
      <div className="h-1.5 bg-stone-100 dark:bg-stone-800/60 rounded-full overflow-hidden">
        <div
          className="h-full bg-[#2FAF8F] rounded-full transition-all"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}

// ─── DIRECTIVO ROW ────────────────────────────────────────────────────────────
function DirectivoRow({ nombre, cargo, periodo }: { nombre: string; cargo: string; periodo: string; id?: string; email?: string; telefono?: string }) {
  const ini = nombre.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
  return (
    <div className="flex items-center gap-3.5 py-3.5 group cursor-pointer">
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-stone-600 to-stone-800 flex items-center justify-center text-white text-[11px] font-bold shrink-0 shadow-sm">
        {ini}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-stone-700 dark:text-stone-200 group-hover:text-stone-900 dark:group-hover:text-stone-50 transition-colors leading-snug">
          {nombre}
        </p>
        <p className="text-[11px] text-[#2FAF8F] font-medium mt-0.5 leading-none">{cargo}</p>
        <p className="text-[10.5px] text-stone-400 dark:text-stone-500 mt-0.5 leading-none">{periodo}</p>
      </div>
      <ChevRight cls="w-3.5 h-3.5 text-stone-200 dark:text-stone-700 group-hover:text-stone-400 dark:group-hover:text-stone-500 transition-colors" />
    </div>
  )
}

// ─── AFILIA ROW ───────────────────────────────────────────────────────────────
function AfiliaRow({ siglas, nombre, nivel }: { siglas: string; nombre: string; nivel: string }) {
  const nivelCls =
    nivel === 'Internacional'
      ? 'text-[#2FAF8F] bg-[#2FAF8F]/[0.09] border-[#2FAF8F]/20'
      : nivel === 'Nacional'
        ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 border-amber-200/50 dark:border-amber-800/30'
        : 'text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-stone-800/60 border-stone-200/60 dark:border-stone-700/40'

  return (
    <div className="flex items-center gap-3.5 py-3.5 group hover:bg-stone-50/60 dark:hover:bg-stone-800/20 -mx-5 px-5 transition-colors">
      <div className="w-9 h-9 rounded-xl bg-stone-900 dark:bg-stone-100 flex items-center justify-center shrink-0">
        <span className="text-white dark:text-stone-900 text-[8.5px] font-extrabold tracking-tight text-center leading-none px-0.5">{siglas}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-stone-700 dark:text-stone-200 leading-snug truncate">{nombre}</p>
        <span className={`inline-flex items-center h-[18px] px-2 rounded-full text-[10px] font-semibold border mt-0.5 ${nivelCls}`}>
          {nivel}
        </span>
      </div>
      <Check cls="w-3 h-3 text-[#2FAF8F] shrink-0" />
    </div>
  )
}

// ─── CONTACT LINK ─────────────────────────────────────────────────────────────
function ContactLink({ icon, label, value, href }: { icon: string; label: string; value: string; href: string }) {
  const Ic = icon === 'phone' ? Phone : icon === 'mail' ? Mail : icon === 'globe' ? Globe : Clock
  const isExt = href.startsWith('http')
  return (
    <a
      href={href}
      target={isExt ? '_blank' : undefined}
      rel={isExt ? 'noopener noreferrer' : undefined}
      className="flex items-center gap-4 px-5 py-4 group hover:bg-stone-50/60 dark:hover:bg-stone-800/20 transition-colors"
    >
      <div className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-stone-800/60 flex items-center justify-center text-stone-400 dark:text-stone-500 group-hover:bg-[#2FAF8F]/[0.09] group-hover:text-[#2FAF8F] transition-all shrink-0">
        <Ic cls="w-3.5 h-3.5" />
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
export default function PerfilUG() {
  const navigate    = useNavigate()
  const { profile } = useUser()
  const [tab,     setTab]     = useState<Tab>('general')
  const [loading, setLoading] = useState(ugExtCache === null)
  const [ext,     setExt]     = useState<UGExtendedCached | null>(ugExtCache)
  const didFetch = useRef(ugExtCache !== null)

  // ── Core del UserContext (sin fetch extra) ──────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pd  = (profile?.personal_data      as Record<string, any>) ?? {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const id_ = (profile?.institutional_data as Record<string, any>) ?? {}
  const ugName = id_.unionName || id_.nombre || id_.name || 'Unión Ganadera'
  const ugRFC  = id_.rfc      || pd.rfc      || ext?.rfc || '—'
  const ugUbicacion = id_.location || id_.ubicacion || ext?.ubicacion || 'México'
  const ugFundacion = id_.foundedYear || id_.fundacion || ext?.fundacion || null

  // ── Fetch extended (con caché) ──────────────────────────────────────────────
  useEffect(() => {
    if (didFetch.current) return
    didFetch.current = true

    const load = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const uid = session?.user?.id
        if (!uid) { setLoading(false); return }

        const { data: ue } = await supabase
          .from('union_extended_profiles')
          .select('*')
          .eq('user_id', uid)
          .maybeSingle()

        const extData: UGExtendedCached = {
          bio:                 ue?.bio                ?? '',
          naturaleza:          ue?.naturaleza         ?? 'Asociación Civil',
          ubicacion:           ue?.ubicacion          ?? ugUbicacion,
          fundacion:           ue?.fundacion          ?? ugFundacion,
          rfc:                 ue?.rfc                ?? ugRFC,
          organismo_nacional:  ue?.organismo_nacional ?? 'CNG',
          afil_sagarpa:        ue?.afil_sagarpa       ?? 'Autorizada',
          socios_activos:      ue?.socios_activos      ?? null,
          municipios_count:    ue?.municipios_count    ?? null,
          cabezas_registradas: ue?.cabezas_registradas ?? null,
          anios_trayectoria:   ue?.anios_trayectoria   ?? null,
          cuota_mensual:       ue?.cuota_mensual       ?? null,
          proxima_asamblea:    ue?.proxima_asamblea    ?? '',
          socios_al_corriente: ue?.socios_al_corriente ?? null,
          tramites_mes:        ue?.tramites_mes        ?? null,
          satisfaccion:        ue?.satisfaccion        ?? null,
          tramites_activos:    ue?.tramites_activos    ?? null,
          tramites_en_proceso: ue?.tramites_en_proceso ?? null,
          telefono:            ue?.telefono            ?? pd.phone ?? '',
          email_contact:       ue?.email_contact       ?? session?.user?.email ?? '',
          sitio_web:           ue?.sitio_web           ?? '',
          horario:             ue?.horario             ?? '',
          direccion:           ue?.direccion           ?? '',
          directiva:           ue?.directiva?.length   ? ue.directiva    : DEFAULT_DIRECTIVA,
          zonas:               ue?.zonas?.length       ? ue.zonas        : DEFAULT_ZONAS,
          servicios:           ue?.servicios?.length   ? ue.servicios    : DEFAULT_SERVICIOS,
          afiliaciones:        ue?.afiliaciones?.length? ue.afiliaciones : DEFAULT_AFILIACIONES,
        }
        setUGExtCache(extData)
        setExt(extData)
      } catch (e) {
        console.error('PerfilUG load error:', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Derived display ─────────────────────────────────────────────────────────
  const quickStats = [
    { label: 'Socios Activos',      value: ext?.socios_activos      != null ? ext.socios_activos.toLocaleString()      : '—', icon: 'users'  },
    { label: 'Municipios',          value: ext?.municipios_count    != null ? String(ext.municipios_count)             : '—', icon: 'map'    },
    { label: 'Cabezas Registradas', value: ext?.cabezas_registradas != null ? (ext.cabezas_registradas >= 1000 ? `${(ext.cabezas_registradas/1000).toFixed(0)}k` : String(ext.cabezas_registradas)) : '—', icon: 'layers' },
    { label: 'Años de Trayectoria', value: ext?.anios_trayectoria   != null ? String(ext.anios_trayectoria)            : '—', icon: 'clock'  },
  ]

  const infoGrid: [string, string][] = [
    ['Naturaleza jurídica',  ext?.naturaleza        || '—'],
    ['Organismo nacional',   ext?.organismo_nacional || '—'],
    ['Afiliación SAGARPA',   ext?.afil_sagarpa       || '—'],
    ['Municipios cubiertos', ext?.municipios_count   != null ? `${ext.municipios_count} municipios` : '—'],
    ['Cuota mensual',        ext?.cuota_mensual      != null ? `$${ext.cuota_mensual} MXN`          : '—'],
    ['Próxima asamblea',     ext?.proxima_asamblea ? new Date(ext.proxima_asamblea).toLocaleDateString('es-MX', { day:'numeric', month:'short', year:'numeric' }) : '—'],
    ['RFC',                  ugRFC],
    ['Tipo de registro',     'Gremio ganadero'],
  ]

  const kpisGremiales = [
    { label: 'Socios al corriente',      value: ext?.socios_al_corriente ?? null, good: true  },
    { label: 'Trámites resueltos (mes)', value: ext?.tramites_mes        ?? null, good: true  },
    { label: 'Satisfacción de socios',   value: ext?.satisfaccion        ?? null, good: true  },
  ]

  const contactos = [
    { icon: 'phone', label: 'Teléfono',  value: ext?.telefono     || '—', href: ext?.telefono ? `tel:${ext.telefono}` : '#'                             },
    { icon: 'mail',  label: 'Email',     value: ext?.email_contact || '—', href: ext?.email_contact ? `mailto:${ext.email_contact}` : '#'               },
    { icon: 'globe', label: 'Sitio web', value: ext?.sitio_web    || '—', href: ext?.sitio_web ? (ext.sitio_web.startsWith('http') ? ext.sitio_web : `https://${ext.sitio_web}`) : '#' },
    { icon: 'clock', label: 'Horario',   value: ext?.horario      || '—', href: '#'                                                                       },
  ].filter(c => c.value !== '—')

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600&display=swap');

        .ug, .ug * { -webkit-font-smoothing: antialiased; }
        .ug        { font-family: 'Geist', system-ui, sans-serif; }
        .ug-s      { font-family: 'Instrument Serif', Georgia, serif; }

        .ug *:focus, .ug *:focus-visible {
          outline: none !important; box-shadow: none !important;
        }

        .ug::-webkit-scrollbar        { width: 3px; }
        .ug::-webkit-scrollbar-track  { background: transparent; }
        .ug::-webkit-scrollbar-thumb  { background: #e7e5e4; border-radius: 999px; }
        .dark .ug::-webkit-scrollbar-thumb { background: #3c3836; }
        .ug { scrollbar-width: thin; scrollbar-color: #e7e5e4 transparent; }
        .dark .ug { scrollbar-color: #3c3836 transparent; }

        @keyframes ug-rise {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        .ug-rise { animation: ug-rise 400ms cubic-bezier(.16,1,.3,1) both; }

        @keyframes ug-fade { from { opacity: 0; } to { opacity: 1; } }
        .ug-fade { animation: ug-fade 200ms ease both; }

        /* Hero — dark stone mesh, same language as PerfilRancho but with a slight teal bias */
        .ug-hero {
          background:
            radial-gradient(ellipse 80% 70% at 80% -10%, rgba(47,175,143,.35) 0%, transparent 60%),
            radial-gradient(ellipse 50% 80% at 0% 110%, rgba(26,144,112,.28) 0%, transparent 55%),
            radial-gradient(ellipse 60% 50% at 50% 50%,  rgba(28,25,23,.0)   0%, transparent 100%),
            #111210;
        }

        .ug-tab-line {
          position: absolute;
          inset-inline: 0;
          bottom: -1px;
          height: 2px;
          border-radius: 2px 2px 0 0;
          background: #2FAF8F;
        }
      `}</style>

      <div className="ug h-full overflow-y-auto bg-[#fafaf9] dark:bg-[#0c0a09]">

        {/* ════════════════════════════════════════════════════════
            HERO BANNER
        ════════════════════════════════════════════════════════ */}
        <div className="ug-hero relative h-44 md:h-56 shrink-0 overflow-hidden select-none">

          {/* Grid overlay */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.045]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="ug-grid" width="28" height="28" patternUnits="userSpaceOnUse">
                <path d="M 28 0 L 0 0 0 28" fill="none" stroke="white" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#ug-grid)" />
          </svg>

          {/* Decorative rings */}
          <div className="absolute -right-20 -top-20 w-72 h-72 rounded-full border border-white/[0.04]" />
          <div className="absolute -right-8  -top-8  w-52 h-52 rounded-full border border-white/[0.04]" />
          <div className="absolute right-0 bottom-0 w-96 h-48 rounded-full bg-[#2FAF8F]/[0.05] blur-3xl" />

          {/* Status chips */}
          <div className="absolute top-4 right-5 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 h-[22px] px-2.5 rounded-full bg-white/[0.08] backdrop-blur-sm border border-white/[0.09] text-white/55 text-[10px] font-medium">
              <span className="w-[6px] h-[6px] rounded-full bg-[#2FAF8F] shrink-0" />
              Activa
            </span>
            <span className="hidden sm:inline-flex items-center h-[22px] px-2.5 rounded-full bg-white/[0.08] backdrop-blur-sm border border-white/[0.09] text-white/55 text-[10px] font-medium">
              CNG · SENASICA
            </span>
          </div>


        </div>

        {/* ════════════════════════════════════════════════════════
            IDENTITY CARD SHEET
        ════════════════════════════════════════════════════════ */}
        <div className="relative -mt-5 bg-[#fafaf9] dark:bg-[#0c0a09] rounded-t-[28px] z-10 shadow-[0_-4px_24px_rgba(0,0,0,0.10)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.40)]">

          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-0">
            <div className="w-8 h-[3px] rounded-full bg-stone-200 dark:bg-stone-700" />
          </div>

          <div className="px-5 md:px-8 pt-4 pb-0">

            {/* Avatar + identity */}
            <div className="ug-rise flex items-center justify-between gap-4">

              <div className="flex items-center gap-4 min-w-0">
                {/* UG Shield Avatar */}
                <div
                  className="w-[64px] h-[64px] md:w-[72px] md:h-[72px] rounded-[18px] bg-white dark:bg-[#1c1917] flex flex-col items-center justify-center shrink-0 gap-0.5"
                  style={{ boxShadow: '0 6px 24px rgba(0,0,0,0.18)' }}
                >
                  <Shield cls="w-7 h-7 text-[#2FAF8F]" />
                </div>

                {/* Name + badge */}
                <div className="min-w-0">
                  <span className="inline-flex items-center gap-1.5 h-[20px] px-2 rounded-full text-[9.5px] font-semibold tracking-[0.05em] text-[#2FAF8F] bg-[#2FAF8F]/[0.10] dark:bg-[#2FAF8F]/[0.15] border border-[#2FAF8F]/25 mb-1.5">
                    Unión Ganadera · {ext?.naturaleza ?? 'A.C.'}
                  </span>
                  <h1 className="ug-s italic text-[19px] sm:text-[22px] text-stone-900 dark:text-stone-50 leading-[1.15] tracking-[-0.01em]">
                    {ugName}
                  </h1>
                </div>
              </div>

              {/* Edit button */}
              <button
                onClick={() => navigate('/perfil/editar')}
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl text-[12.5px] font-medium bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 hover:bg-stone-700 dark:hover:bg-white active:scale-[0.96] transition-all shadow-sm shrink-0"
              >
                <Edit cls="w-3.5 h-3.5" />
                Editar perfil
              </button>
            </div>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 mt-3 mb-0">
              <span className="flex items-center gap-1 text-[11.5px] text-stone-400 dark:text-stone-500">
                <Pin />{ext?.ubicacion ?? ugUbicacion}
              </span>
              <span className="text-stone-200 dark:text-stone-700">·</span>
              <span className="flex items-center gap-1 text-[11.5px] text-stone-400 dark:text-stone-500">
                <Cal />Fundada en {ext?.fundacion ?? ugFundacion ?? '—'}
              </span>
              <span className="text-stone-200 dark:text-stone-700">·</span>
              <span className="text-[11.5px] text-stone-400 dark:text-stone-500 font-mono">
                RFC: {ugRFC}
              </span>
            </div>

            {/* ── TAB BAR ─────────────────────────────────────────── */}
            <div
              className="ug-rise flex items-center border-b border-stone-200/70 dark:border-stone-800/50 mt-5 mb-8"
              style={{ animationDelay: '55ms' }}
            >
              {TABS.map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={[
                    'relative h-10 px-4 text-[12.5px] font-medium capitalize transition-colors',
                    tab === t
                      ? 'text-stone-900 dark:text-stone-50'
                      : 'text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-300',
                  ].join(' ')}
                >
                  {t}
                  {tab === t && <span className="ug-tab-line" aria-hidden />}
                </button>
              ))}
            </div>

            {/* ════════════════════════════════════════════════════
                GENERAL TAB
            ════════════════════════════════════════════════════ */}
            {tab === 'general' && (
              <div className="ug-fade">

                {/* Bio */}
                <div className="ug-rise mb-6" style={{ animationDelay: '25ms' }}>
                  <p className="ug-s italic text-[17px] text-stone-700 dark:text-stone-300 leading-[1.75]">
                    Organización gremial que representa y defiende los intereses del sector ganadero
                    en Durango. Agrupa a productores, gestiona trámites ante dependencias oficiales
                    y promueve el desarrollo sustentable de la ganadería regional con más de 80 años
                    de trayectoria.
                  </p>
                </div>

                {/* Quick stats */}
                <div className="ug-rise grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8" style={{ animationDelay: '50ms' }}>
                  {quickStats.map(s => <StatPill key={s.label} {...s} />)}
                </div>

                {/* Indicadores gremiales */}
                <section className="ug-rise mb-8" style={{ animationDelay: '75ms' }}>
                  <SectionLabel text="Indicadores gremiales" />
                  <Card className="p-5">
                    <div className="space-y-4">
                      {kpisGremiales.map(k => <KPIBar key={k.label} label={k.label} value={k.value} />)}
                    </div>
                    <div className="mt-5 grid grid-cols-2 gap-3 pt-4 border-t border-stone-100 dark:border-stone-800/50">
                      <div className="text-center">
                        <p className="text-[22px] font-semibold tracking-[-0.03em] text-stone-900 dark:text-stone-50 leading-none">142</p>
                        <p className="text-[10.5px] font-semibold uppercase tracking-[0.07em] text-stone-400 dark:text-stone-500 mt-1.5 leading-none">Trámites activos</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[22px] font-semibold tracking-[-0.03em] text-stone-900 dark:text-stone-50 leading-none">38</p>
                        <p className="text-[10.5px] font-semibold uppercase tracking-[0.07em] text-stone-400 dark:text-stone-500 mt-1.5 leading-none">En proceso</p>
                      </div>
                    </div>
                  </Card>
                </section>

                {/* Datos institucionales */}
                <section className="ug-rise mb-8" style={{ animationDelay: '100ms' }}>
                  <SectionLabel text="Datos institucionales" />
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

                {/* Servicios para socios */}
                <section className="ug-rise mb-8" style={{ animationDelay: '125ms' }}>
                  <SectionLabel text="Servicios para socios" />
                  <Card className="px-5">
                    <div className="divide-y divide-stone-100 dark:divide-stone-800/50">
                      {(ext?.servicios ?? DEFAULT_SERVICIOS).map(s => <ServiceItem key={s.title} {...s} />)}
                    </div>
                  </Card>
                </section>

                {/* Cobertura regional */}
                <section className="ug-rise mb-8" style={{ animationDelay: '150ms' }}>
                  <SectionLabel text="Cobertura regional" />
                  <Card className="px-5">
                    <div className="divide-y divide-stone-100 dark:divide-stone-800/50">
                      {(ext?.zonas ?? DEFAULT_ZONAS).map(z => <ZonaItem key={z.zona} {...z} />)}
                    </div>
                  </Card>
                </section>

                {/* Actividad reciente */}
                <section className="ug-rise mb-14" style={{ animationDelay: '175ms' }}>
                  <SectionLabel text="Actividad institucional reciente" />
                  <Card className="px-5">
                    <div className="divide-y divide-stone-100 dark:divide-stone-800/50">
                      {loading
                        ? <p className="text-[12px] text-stone-400 dark:text-stone-600 py-4">Cargando actividad...</p>
                        : <p className="text-[12px] text-stone-400 dark:text-stone-600 py-4">Sin actividad reciente.</p>
                      }
                    </div>
                  </Card>
                </section>
              </div>
            )}

            {/* ════════════════════════════════════════════════════
                DIRECTIVA TAB
            ════════════════════════════════════════════════════ */}
            {tab === 'directiva' && (
              <div className="ug-fade">

                {/* Mesa directiva */}
                <section className="ug-rise mb-8">
                  <SectionLabel text="Mesa directiva 2023 – 2026" />
                  <Card className="px-5">
                    <div className="divide-y divide-stone-100 dark:divide-stone-800/50">
                      {(ext?.directiva ?? DEFAULT_DIRECTIVA).map((d, i) => <DirectivoRow key={d.id ?? i} {...d} />)}
                    </div>
                  </Card>
                </section>

                {/* Roles activos */}
                <section className="ug-rise mb-8" style={{ animationDelay: '45ms' }}>
                  <SectionLabel text="Roles institucionales activos" />
                  <Card className="px-5 py-5">
                    <div className="flex flex-wrap gap-2">
                      {['Presidente', 'Secretaria General', 'Tesorero', 'Vocal de Sanidad', 'Vocal de Producción', 'Vocal de Exportación'].map(r => (
                        <span
                          key={r}
                          className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full text-[11.5px] font-medium text-[#2FAF8F] bg-[#2FAF8F]/[0.08] dark:bg-[#2FAF8F]/[0.12] border border-[#2FAF8F]/20"
                        >
                          <Check cls="w-3 h-3" />
                          {r}
                        </span>
                      ))}
                    </div>
                  </Card>
                </section>

                {/* Afiliaciones */}
                <section className="ug-rise mb-14" style={{ animationDelay: '70ms' }}>
                  <SectionLabel text="Afiliaciones y organismos" />
                  <Card className="px-5">
                    <div className="divide-y divide-stone-100 dark:divide-stone-800/50">
                      {(ext?.afiliaciones ?? DEFAULT_AFILIACIONES).map((a, i) => <AfiliaRow key={i} {...a} />)}
                    </div>
                  </Card>
                </section>
              </div>
            )}

            {/* ════════════════════════════════════════════════════
                CONTACTO TAB
            ════════════════════════════════════════════════════ */}
            {tab === 'contacto' && (
              <div className="ug-fade">

                {/* Contacto */}
                <section className="ug-rise mb-8">
                  <SectionLabel text="Información de contacto" />
                  <Card className="overflow-hidden divide-y divide-stone-100 dark:divide-stone-800/50">
                    {contactos.map(c => <ContactLink key={c.label} {...c} />)}
                  </Card>
                </section>

                {/* Ubicación */}
                <section className="ug-rise mb-8" style={{ animationDelay: '45ms' }}>
                  <SectionLabel text="Sede institucional" />
                  <Card className="p-5">
                    <p className="text-[13px] font-medium text-stone-700 dark:text-stone-200 mb-0.5 leading-snug">
                      Av. 20 de Noviembre 615
                    </p>
                    <p className="text-[12px] text-stone-400 dark:text-stone-500 mb-5">
                      Victoria de Durango, Dgo. · México · C.P. 34000
                    </p>

                    <div className="grid grid-cols-3 gap-px bg-stone-100 dark:bg-stone-800/50 rounded-xl overflow-hidden mb-4">
                      {[
                        ['Latitud',   '24.0277° N'],
                        ['Longitud',  '104.6532° W'],
                        ['Altitud',   '1,889 msnm'],
                      ].map(([l, v]) => (
                        <div key={l} className="bg-white dark:bg-[#141210] px-4 py-3.5">
                          <p className="text-[9.5px] font-semibold uppercase tracking-[0.09em] text-stone-400 dark:text-stone-500 mb-1.5 leading-none">{l}</p>
                          <p className="text-[12px] font-mono font-medium text-stone-700 dark:text-stone-200 leading-none">{v}</p>
                        </div>
                      ))}
                    </div>

                    <a
                      href="https://maps.google.com/?q=24.0277,-104.6532"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 h-9 w-full rounded-xl text-[12.5px] font-medium text-stone-600 dark:text-stone-300 bg-stone-100 dark:bg-stone-800/60 hover:bg-stone-200 dark:hover:bg-stone-700 active:scale-[0.97] transition-all"
                    >
                      <ExtLink cls="w-3.5 h-3.5" />
                      Abrir en Google Maps
                    </a>
                  </Card>
                </section>

                {/* Registros oficiales */}
                <section className="ug-rise mb-14" style={{ animationDelay: '70ms' }}>
                  <SectionLabel text="Registros y certificaciones oficiales" />
                  <Card className="overflow-hidden divide-y divide-stone-100 dark:divide-stone-800/50">
                    {[
                      ['RFC',              'UGRD421015AB3'],
                      ['Registro SENASICA','UG-DGO-0001'  ],
                      ['Folio CNG',        'CNG-2001-DGO' ],
                      ['Afiliación SAGARPA','SAG-UG-00934'],
                    ].map(([k, v]) => (
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

          </div>{/* end px wrapper */}
        </div>{/* end identity card sheet */}
      </div>
    </>
  )
}