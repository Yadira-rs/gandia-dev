import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { useUser } from '../../context/UserContext'
import { mvzExtCache, setMVZExtCache } from './perfilMVZCache'
import type { MVZExtendedCached } from './perfilMVZCache'

// ─── ICONS ────────────────────────────────────────────────────────────────────
const SV = { viewBox:'0 0 24 24', fill:'none', stroke:'currentColor', strokeWidth:'1.65', strokeLinecap:'round' as const, strokeLinejoin:'round' as const }
type IP = { cls?: string }
const IcoPin      = ({cls='w-3.5 h-3.5'}:IP) => <svg className={cls} {...SV}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
const IcoEdit     = ({cls='w-3.5 h-3.5'}:IP) => <svg className={cls} {...SV}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
const IcoSpark    = ({cls='w-3 h-3'}:IP)     => <svg className={cls} {...SV}><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
const IcoChevR    = ({cls='w-3.5 h-3.5'}:IP) => <svg className={cls} {...SV}><polyline points="9 18 15 12 9 6"/></svg>

const IcoPhone    = ({cls='w-4 h-4'}:IP)     => <svg className={cls} {...SV}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
const IcoMail     = ({cls='w-4 h-4'}:IP)     => <svg className={cls} {...SV}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
const IcoGlobe    = ({cls='w-4 h-4'}:IP)     => <svg className={cls} {...SV}><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
const IcoClock    = ({cls='w-4 h-4'}:IP)     => <svg className={cls} {...SV}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
const IcoShield   = ({cls='w-4 h-4'}:IP)     => <svg className={cls} {...SV}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
const IcoHome     = ({cls='w-4 h-4'}:IP)     => <svg className={cls} {...SV}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
const IcoBriefcase= ({cls='w-4 h-4'}:IP)     => <svg className={cls} {...SV}><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
const IcoUsers    = ({cls='w-4 h-4'}:IP)     => <svg className={cls} {...SV}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
const IcoBadge    = ({cls='w-3.5 h-3.5'}:IP) => <svg className={cls} {...SV}><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>

// ─── PRIMITIVES ───────────────────────────────────────────────────────────────
function SectionLabel({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-5">
      <IcoSpark cls="w-3 h-3 text-[#2FAF8F] shrink-0" />
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

// ─── CERT ITEM ────────────────────────────────────────────────────────────────
type CertStatus = 'vigente' | 'por-vencer' | 'vencido'
function CertRow({ name, expires, status }: { name: string; expires: string; status: CertStatus }) {
  const chip =
    status === 'vigente'    ? 'text-[#2FAF8F] bg-[#2FAF8F]/[0.09] border-[#2FAF8F]/20' :
    status === 'por-vencer' ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/20 border-amber-200/40 dark:border-amber-800/30' :
                              'text-rose-500 bg-rose-50 dark:bg-rose-950/20 border-rose-200/40 dark:border-rose-800/30'
  const dot =
    status === 'vigente'    ? 'bg-[#2FAF8F]' :
    status === 'por-vencer' ? 'bg-amber-400' : 'bg-rose-400'
  const label = { vigente: 'Vigente', 'por-vencer': 'Por vencer', vencido: 'Vencido' }[status]

  return (
    <div className="flex items-center gap-3.5 py-3.5 group">
      <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-stone-700 dark:text-stone-200 leading-snug truncate">{name}</p>
        <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-0.5">Vence: {expires}</p>
      </div>
      <span className={`inline-flex items-center h-5 px-2 rounded-full text-[10px] font-semibold border shrink-0 ${chip}`}>
        {label}
      </span>
    </div>
  )
}

// ─── KPI BAR ─────────────────────────────────────────────────────────────────
function KPIBar({ label, value }: { label: string; value: number | null }) {
  if (value === null) return null
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[12px] text-stone-500 dark:text-stone-400">{label}</span>
        <span className="text-[12px] font-semibold text-[#2FAF8F]">{value}%</span>
      </div>
      <div className="h-[5px] bg-stone-100 dark:bg-stone-800/50 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-[#2FAF8F]"
          style={{ width: `${value}%`, transition: 'width 0.8s cubic-bezier(.16,1,.3,1)' }}
        />
      </div>
    </div>
  )
}


// ─── CONTACT ROW ─────────────────────────────────────────────────────────────
function ContactRow({ icon, label, value, href }: { icon: React.ReactNode; label: string; value: string; href: string }) {
  const isExt = href.startsWith('http')
  return (
    <a
      href={href} target={isExt ? '_blank' : undefined} rel={isExt ? 'noopener noreferrer' : undefined}
      className="flex items-center gap-4 px-5 py-4 group hover:bg-stone-50/60 dark:hover:bg-stone-800/20 transition-colors"
    >
      <div className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-stone-800/60 flex items-center justify-center text-stone-400 group-hover:bg-[#2FAF8F]/[0.09] group-hover:text-[#2FAF8F] transition-all shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-stone-400 dark:text-stone-500 mb-0.5 leading-none">{label}</p>
        <p className="text-[13px] font-medium text-stone-700 dark:text-stone-200 group-hover:text-[#2FAF8F] transition-colors truncate">{value}</p>
      </div>
      <IcoChevR cls="w-3.5 h-3.5 text-stone-200 dark:text-stone-700 group-hover:text-[#2FAF8F] transition-colors" />
    </a>
  )
}

// ─── CLIENTE ROW ──────────────────────────────────────────────────────────────
function ClienteRow({ name, location, head, tipo }: { name: string; location: string; head: string; tipo: string }) {
  return (
    <div className="flex items-center gap-3 py-3.5 group cursor-pointer">
      <div className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-stone-800/60 flex items-center justify-center text-stone-400 dark:text-stone-500 group-hover:bg-[#2FAF8F]/[0.09] group-hover:text-[#2FAF8F] transition-all shrink-0">
        <IcoHome cls="w-3.5 h-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-stone-700 dark:text-stone-200 group-hover:text-stone-900 dark:group-hover:text-stone-50 transition-colors truncate leading-snug">
          {name}
        </p>
        <p className="text-[11.5px] text-stone-400 dark:text-stone-500 mt-0.5">{location} · {head} cab.</p>
      </div>
      <span className="text-[10.5px] font-medium text-stone-400 dark:text-stone-500 bg-stone-100 dark:bg-stone-800/60 px-2.5 h-5 rounded-full flex items-center shrink-0">{tipo}</span>
      <IcoChevR cls="w-3 h-3 text-stone-200 dark:text-stone-700 group-hover:text-stone-400 transition-colors" />
    </div>
  )
}

// ─── SERVICE ROW ──────────────────────────────────────────────────────────────
function ServiceRow({ label, price }: { label: string; price: string }) {
  return (
    <div className="flex items-center justify-between py-3.5 group">
      <p className="text-[13px] text-stone-600 dark:text-stone-300">{label}</p>
      <span className="text-[13px] font-semibold text-[#2FAF8F]">{price}</span>
    </div>
  )
}

// ─── STAT PILL ────────────────────────────────────────────────────────────────
function StatPill({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <Card className="px-4 py-4 relative overflow-hidden">
      <div className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full bg-[#2FAF8F]/40" />
      <div className="w-7 h-7 rounded-lg bg-stone-100 dark:bg-stone-800/60 flex items-center justify-center text-stone-400 dark:text-stone-500 mb-2.5">
        {icon}
      </div>
      <p className="text-[22px] font-semibold tracking-[-0.03em] text-stone-900 dark:text-stone-50 leading-none">
        {value}
      </p>
      <p className="text-[10.5px] font-medium text-stone-400 dark:text-stone-500 mt-1.5 leading-snug">{label}</p>
    </Card>
  )
}

// ─── TIMELINE ITEM ────────────────────────────────────────────────────────────
function TimelineItem({ title, sub, period, detail, last = false, badge }: {
  title: string; sub: string; period: string; detail?: string; last?: boolean; badge?: string
}) {
  return (
    <div className="flex gap-4">
      {/* Timeline axis */}
      <div className="flex flex-col items-center shrink-0">
        <div className="w-2.5 h-2.5 rounded-full bg-[#2FAF8F] shrink-0 mt-1.5" />
        {!last && <div className="w-px flex-1 bg-stone-100 dark:bg-stone-800/50 mt-1.5" />}
      </div>
      {/* Content */}
      <div className={`${last ? 'pb-0' : 'pb-6'} flex-1 min-w-0`}>
        <div className="flex items-start justify-between gap-2 mb-0.5">
          <p className="text-[13px] font-semibold text-stone-800 dark:text-stone-100 leading-snug">{title}</p>
          {badge && (
            <span className="inline-flex items-center h-5 px-2 rounded-full text-[9.5px] font-bold text-[#2FAF8F] bg-[#2FAF8F]/[0.09] border border-[#2FAF8F]/20 shrink-0">
              {badge}
            </span>
          )}
        </div>
        <p className="text-[12px] font-medium text-[#2FAF8F] leading-snug">{sub}</p>
        <p className="text-[11.5px] text-stone-400 dark:text-stone-500 mt-0.5">{period}</p>
        {detail && <p className="text-[12px] text-stone-500 dark:text-stone-400 leading-relaxed mt-2">{detail}</p>}
      </div>
    </div>
  )
}

// ─── DEFAULT DATA ─────────────────────────────────────────────────────────────
const DEFAULT_ESTUDIOS = [
  { id:'1', grado:'Médico Veterinario Zootecnista',                    institucion:'UACH',                   periodo:'1999 – 2004', tipo:'licenciatura' as const },
  { id:'2', grado:'Maestría en Producción Animal',                     institucion:'UNAM',                   periodo:'2005 – 2007', tipo:'maestria'     as const },
  { id:'3', grado:'Diplomado en Bienestar Animal y Exportación',       institucion:'FMVZ-UNAM / SENASICA',   periodo:'2012',        tipo:'diplomado'    as const },
  { id:'4', grado:'Certificación Trazabilidad Ganadera SINIIGA',       institucion:'SAGARPA / SENASICA',     periodo:'2015',        tipo:'diplomado'    as const },
]
const DEFAULT_EXPERIENCIAS = [
  { id:'1', cargo:'Consultor Veterinario Independiente', empresa:'Consultoría Vega MVZ',                      periodo:'2010 – Presente', descripcion:'Consultoría a productores del norte de México en sanidad, nutrición y certificación para exportación.',         activo:true  },
  { id:'2', cargo:'Médico Veterinario de Planta',        empresa:'Exportadora Ganadera del Norte S.A. de C.V.', periodo:'2007 – 2010',     descripcion:'Responsable de sanidad animal, certificación zoosanitaria y cumplimiento de normativas de exportación.',         activo:false },
  { id:'3', cargo:'Veterinario de Campo',                empresa:'Unión Ganadera Regional de Chihuahua',        periodo:'2004 – 2007',     descripcion:'Atención a socios ganaderos, campañas de vacunación estatales y programas de salud herd.',                       activo:false },
]
const DEFAULT_CERTS = [
  { id:'1', nombre:'SENASICA — Médico Acreditado',            vence:'Dic 2026',   estado:'vigente'    as const },
  { id:'2', nombre:'Certificador Zoosanitario Internacional', vence:'Jun 2026',   estado:'vigente'    as const },
  { id:'3', nombre:'USDA / APHIS — Acreditado MX',           vence:'Mar 2026',   estado:'por-vencer' as const },
  { id:'4', nombre:'Bienestar Animal NOM-051',                vence:'Sep 2026',   estado:'vigente'    as const },
  { id:'5', nombre:'SINIIGA Trazabilidad',                    vence:'Permanente', estado:'vigente'    as const },
]
const DEFAULT_CLIENTES = [
  { id:'1', nombre:'Rancho El Búfalo Dorado',  municipio:'Durango, Dgo.',     cabezas:'1,450', tipo:'Engorda'        },
  { id:'2', nombre:'Ganadera del Bravo',        municipio:'Cd. Juárez, Chih.', cabezas:'3,100', tipo:'Ciclo Completo' },
  { id:'3', nombre:'Rancho Los Álamos',         municipio:'Chihuahua, Chih.',  cabezas:'2,400', tipo:'Exportación'    },
  { id:'4', nombre:'Productores Norte S.C.',    municipio:'Delicias, Chih.',   cabezas:'5,200', tipo:'Engorda'        },
  { id:'5', nombre:'Rancho La Esperanza',       municipio:'Parral, Chih.',     cabezas:'890',   tipo:'Cría'           },
  { id:'6', nombre:'Ganadera Juárez S.A.',      municipio:'Ojinaga, Chih.',    cabezas:'1,700', tipo:'Exportación'    },
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
  'Bovinos de Carne','Producción Intensiva','Sanidad Preventiva','Diagnóstico Clínico',
  'Nutrición Animal','Bienestar Animal','Certificación para Exportación','Reproducción Bovina',
  'Enfermedades Infecciosas','Parasitología','Farmacología Veterinaria',
]
const DEFAULT_ESTADOS = ['Chihuahua','Durango','Sonora','Sinaloa','Coahuila','Nuevo León']

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function PerfilMVZ() {
  const navigate    = useNavigate()
  const { profile } = useUser()
  const [tab, setTab] = useState<'general' | 'servicios' | 'contacto'>('general')
  const [loading,  setLoading]  = useState(mvzExtCache === null)
  const [ext,      setExt]      = useState<MVZExtendedCached | null>(mvzExtCache)
  const didFetch = useRef(mvzExtCache !== null)

  // ── Core del UserContext ────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pd  = (profile?.personal_data      as Record<string, any>) ?? {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const id_ = (profile?.institutional_data as Record<string, any>) ?? {}
  const mvzName     = pd.fullName || pd.full_name || pd.nombre || ext?.bio?.split('\n')[0] || 'Médico Veterinario'
  const mvzUbicacion = id_.location || pd.municipality || ext?.ubicacion || 'México'
  const mvzCedula    = id_.cedula   || pd.cedula        || ext?.cedula    || '—'

  // ── Fetch extended (con caché) ──────────────────────────────────────────────
  useEffect(() => {
    if (didFetch.current) return
    didFetch.current = true

    const load = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const uid = session?.user?.id
        if (!uid) { setLoading(false); return }

        const { data: me } = await supabase
          .from('mvz_extended_profiles')
          .select('*')
          .eq('user_id', uid)
          .maybeSingle()

        const extData: MVZExtendedCached = {
          bio:                  me?.bio                  ?? '',
          titulo:               me?.titulo               ?? 'Médico Veterinario Zootecnista',
          ubicacion:            me?.ubicacion            ?? mvzUbicacion,
          cedula:               me?.cedula               ?? mvzCedula,
          senasica_num:         me?.senasica_num         ?? '',
          universidad:          me?.universidad          ?? '',
          anio_egreso:          me?.anio_egreso          ?? null,
          anios_exp:            me?.anios_exp            ?? null,
          celular:              me?.celular              ?? pd.phone ?? '',
          email_contact:        me?.email_contact        ?? session?.user?.email ?? '',
          sitio_web:            me?.sitio_web            ?? '',
          disponibilidad:       me?.disponibilidad       ?? '',
          diagnostico_acertado: me?.diagnostico_acertado ?? null,
          clientes_contrato:    me?.clientes_contrato    ?? null,
          certs_aprobados:      me?.certs_aprobados      ?? null,
          visitas_mes:          me?.visitas_mes          ?? null,
          certs_emitidos:       me?.certs_emitidos       ?? null,
          ranchos_atendidos:    me?.ranchos_atendidos    ?? null,
          animales_anio:        me?.animales_anio        ?? null,
          estados_cobertura:    me?.estados_cobertura?.length ? me.estados_cobertura : DEFAULT_ESTADOS,
          especialidades:       me?.especialidades?.length    ? me.especialidades    : DEFAULT_ESPECIALIDADES,
          estudios:             me?.estudios?.length          ? me.estudios          : DEFAULT_ESTUDIOS,
          experiencias:         me?.experiencias?.length      ? me.experiencias      : DEFAULT_EXPERIENCIAS,
          certificaciones:      me?.certificaciones?.length   ? me.certificaciones   : DEFAULT_CERTS,
          clientes:             me?.clientes?.length          ? me.clientes          : DEFAULT_CLIENTES,
          servicios:            me?.servicios?.length         ? me.servicios         : DEFAULT_SERVICIOS,
        }
        setMVZExtCache(extData)
        setExt(extData)
      } catch (e) {
        console.error('PerfilMVZ load error:', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600&display=swap');
        .mvz, .mvz * { -webkit-font-smoothing: antialiased; font-family: 'Geist', system-ui, sans-serif; }
        .mvz-s { font-family: 'Instrument Serif', Georgia, serif; }
        .mvz *:focus, .mvz *:focus-visible { outline: none !important; }
        .mvz::-webkit-scrollbar { width: 3px; }
        .mvz::-webkit-scrollbar-thumb { background: #e7e5e4; border-radius: 999px; }
        .dark .mvz::-webkit-scrollbar-thumb { background: #3c3836; }
        .mvz { scrollbar-width: thin; scrollbar-color: #e7e5e4 transparent; }

        @keyframes mvz-rise {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .mvz-rise { animation: mvz-rise 400ms cubic-bezier(.16,1,.3,1) both; }

        .mvz-hero {
          background:
            radial-gradient(ellipse 80% 70% at 75% -5%, rgba(47,175,143,.45) 0%, transparent 65%),
            radial-gradient(ellipse 55% 90% at 5%  105%, rgba(26,144,112,.32) 0%, transparent 60%),
            #0e1e1a;
        }

        .mvz-tab-line {
          position: absolute; inset-inline: 0; bottom: -1px;
          height: 2px; border-radius: 2px 2px 0 0; background: #2FAF8F;
        }
      `}</style>

      <div className="mvz h-full overflow-y-auto bg-[#fafaf9] dark:bg-[#0c0a09]">

        {/* ── HERO ──────────────────────────────────────────── */}
        <div className="mvz-hero relative h-44 md:h-56 shrink-0 overflow-hidden select-none">
          <svg className="absolute inset-0 w-full h-full opacity-[0.05]" xmlns="http://www.w3.org/2000/svg">
            <defs><pattern id="mvz-grid" width="28" height="28" patternUnits="userSpaceOnUse"><path d="M 28 0 L 0 0 0 28" fill="none" stroke="white" strokeWidth="0.5"/></pattern></defs>
            <rect width="100%" height="100%" fill="url(#mvz-grid)" />
          </svg>
          <div className="absolute -right-14 -top-14 w-60 h-60 rounded-full border border-white/[0.055]" />
          <div className="absolute -right-4  -top-4  w-40 h-40 rounded-full border border-white/[0.055]" />
          <div className="absolute right-0 bottom-0 w-80 h-40 rounded-full bg-[#2FAF8F]/[0.06] blur-3xl" />

          {/* Chips top-right */}
          <div className="absolute top-4 right-5 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 h-[22px] px-2.5 rounded-full bg-white/[0.09] backdrop-blur-sm border border-white/[0.10] text-white/60 text-[10px] font-medium">
              <span className="w-[6px] h-[6px] rounded-full bg-emerald-400 shrink-0" />
              MVZ Activo
            </span>
            <span className="hidden sm:inline-flex items-center h-[22px] px-2.5 rounded-full bg-white/[0.09] backdrop-blur-sm border border-white/[0.10] text-white/60 text-[10px] font-medium">
              SENASICA Acreditado
            </span>
          </div>
        </div>

        {/* ── IDENTITY CARD SHEET ────────────────────────────── */}
        <div className="relative -mt-5 bg-[#fafaf9] dark:bg-[#0c0a09] rounded-t-[28px] z-10 shadow-[0_-4px_24px_rgba(0,0,0,0.10)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.40)]">
          <div className="flex justify-center pt-3">
            <div className="w-8 h-[3px] rounded-full bg-stone-200 dark:bg-stone-700" />
          </div>

          <div className="px-5 md:px-8 pt-4">

            {/* Avatar + name row */}
            <div className="mvz-rise flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                {/* Avatar */}
                <div
                  className="w-[64px] h-[64px] md:w-[72px] md:h-[72px] rounded-[18px] bg-gradient-to-br from-[#2FAF8F] to-[#1a9070] flex items-center justify-center shrink-0"
                  style={{ boxShadow: '0 6px 24px rgba(0,0,0,0.18)' }}
                >
                  <span className="mvz-s italic text-[24px] md:text-[28px] text-white leading-none select-none font-bold">Dr</span>
                </div>
                {/* Name + role */}
                <div className="min-w-0">
                  <span className="inline-flex items-center gap-1.5 h-[20px] px-2 rounded-full text-[9.5px] font-semibold text-[#2FAF8F] bg-[#2FAF8F]/[0.10] dark:bg-[#2FAF8F]/[0.15] border border-[#2FAF8F]/25 mb-1.5">
                    Médico Veterinario Zootecnista
                  </span>
                  <h1 className="mvz-s italic text-[20px] sm:text-[23px] text-stone-900 dark:text-stone-50 leading-[1.15] tracking-[-0.01em]">
                    {mvzName}
                  </h1>
                </div>
              </div>
              <button
                onClick={() => navigate('/perfil/editar')}
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl text-[12.5px] font-medium bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 hover:bg-stone-700 dark:hover:bg-white active:scale-[0.96] transition-all shadow-sm shrink-0"
              >
                <IcoEdit cls="w-3.5 h-3.5" />
                Editar perfil
              </button>
            </div>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 mt-3 mb-0">
              <span className="flex items-center gap-1 text-[11.5px] text-stone-400 dark:text-stone-500">
                <IcoPin cls="w-[10px] h-[10px] shrink-0" />
                {ext?.ubicacion ?? mvzUbicacion}
              </span>
              <span className="text-stone-200 dark:text-stone-700">·</span>
              <span className="flex items-center gap-1 text-[11.5px] text-stone-400 dark:text-stone-500">
                <IcoBadge cls="w-[10px] h-[10px] shrink-0" />
                {ext?.cedula ? `Cédula ${ext.cedula}` : mvzCedula !== '—' ? `Cédula ${mvzCedula}` : 'Sin cédula'}
              </span>
              <span className="text-stone-200 dark:text-stone-700">·</span>
              <span className="flex items-center gap-1 text-[11.5px] text-stone-400 dark:text-stone-500">
                <IcoBriefcase cls="w-[10px] h-[10px] shrink-0" />
                {ext?.anios_exp != null ? `${ext.anios_exp} años de experiencia` : 'Experiencia —'}
              </span>
            </div>

            {/* Divider */}
            <div className="h-px bg-stone-100 dark:bg-stone-800/50 mt-5" />

            {/* ── TAB BAR ──────────────────────────────────── */}
            <div className="flex items-center border-b border-stone-200/70 dark:border-stone-800/50">
              {(['general', 'servicios', 'contacto'] as const).map(t => (
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
                  {tab === t && <span className="mvz-tab-line" aria-hidden />}
                </button>
              ))}
            </div>
          </div>

          {/* ── BODY ─────────────────────────────────────────── */}
          <div className="px-5 md:px-8 pt-7 pb-14">

            {/* ════ GENERAL ════ */}
            {tab === 'general' && (
              <div key="general">

                <div className="mvz-rise mb-8" style={{ animationDelay: '25ms' }}>
                  <p className="mvz-s italic text-[17.5px] text-stone-700 dark:text-stone-300 leading-[1.75]">
                    {ext?.bio || (loading ? 'Cargando...' : 'Sin descripción aún.')}
                  </p>
                </div>

                <div className="mvz-rise grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10" style={{ animationDelay: '50ms' }}>
                  <StatPill value={ext?.ranchos_atendidos != null ? `${ext.ranchos_atendidos}+` : '—'} label="Ranchos atendidos" icon={<IcoHome cls="w-3.5 h-3.5" />} />
                  <StatPill value={ext?.animales_anio    != null ? (ext.animales_anio >= 1000 ? `${(ext.animales_anio/1000).toFixed(0)}k` : String(ext.animales_anio)) : '—'} label="Animales / año" icon={<IcoUsers cls="w-3.5 h-3.5" />} />
                  <StatPill value={ext?.certificaciones?.length != null ? String(ext.certificaciones.length) : '—'} label="Certificaciones"   icon={<IcoShield cls="w-3.5 h-3.5" />} />
                  <StatPill value={ext?.anios_exp != null ? String(ext.anios_exp) : '—'} label="Años de ejercicio" icon={<IcoBriefcase cls="w-3.5 h-3.5" />} />
                </div>

                <section className="mvz-rise mb-10" style={{ animationDelay: '75ms' }}>
                  <SectionLabel text="Áreas de especialización" />
                  <div className="flex flex-wrap gap-2">
                    {(ext?.especialidades ?? DEFAULT_ESPECIALIDADES).map(tag => (
                      <span key={tag} className="inline-flex items-center h-7 px-3 rounded-full text-[11.5px] font-medium text-[#2FAF8F] bg-[#2FAF8F]/8 dark:bg-[#2FAF8F]/12 border border-[#2FAF8F]/20">{tag}</span>
                    ))}
                  </div>
                </section>

                <div className="mvz-rise grid grid-cols-1 lg:grid-cols-12 gap-6" style={{ animationDelay: '100ms' }}>
                  <div className="lg:col-span-8 space-y-6">

                    <section>
                      <SectionLabel text="Formación académica" />
                      <Card className="px-5 py-5">
                        {(ext?.estudios ?? DEFAULT_ESTUDIOS).map((e, i, arr) => (
                          <TimelineItem key={e.id} title={e.grado} sub={e.institucion} period={e.periodo} last={i === arr.length - 1} />
                        ))}
                      </Card>
                    </section>

                    <section>
                      <SectionLabel text="Experiencia profesional" />
                      <Card className="px-5 py-5">
                        {(ext?.experiencias ?? DEFAULT_EXPERIENCIAS).map((e, i, arr) => (
                          <TimelineItem key={e.id} title={e.cargo} sub={e.empresa} period={e.periodo} detail={e.descripcion} badge={e.activo ? 'Actual' : undefined} last={i === arr.length - 1} />
                        ))}
                      </Card>
                    </section>

                    <section>
                      <SectionLabel text="Clientes ganaderos activos" />
                      <Card className="px-5">
                        <div className="divide-y divide-stone-100 dark:divide-stone-800/50">
                          {(ext?.clientes ?? DEFAULT_CLIENTES).map(c => (
                            <ClienteRow key={c.id} name={c.nombre} location={c.municipio} head={c.cabezas} tipo={c.tipo} />
                          ))}
                        </div>
                        <div className="flex items-center justify-between py-3.5 border-t border-stone-100 dark:border-stone-800/50">
                          <span className="text-[11.5px] text-stone-400 dark:text-stone-500">Total activos: <span className="font-semibold text-stone-700 dark:text-stone-200">{(ext?.clientes ?? DEFAULT_CLIENTES).length} ranchos</span></span>
                        </div>
                      </Card>
                    </section>

                    <section>
                      <SectionLabel text="Actividad reciente" />
                      <Card className="px-5 py-4">
                        <p className="text-[12px] text-stone-400 dark:text-stone-600">
                          {loading ? 'Cargando actividad...' : 'Sin actividad reciente.'}
                        </p>
                      </Card>
                    </section>
                  </div>

                  <div className="lg:col-span-4 space-y-6">
                    <section>
                      <SectionLabel text="Certificaciones" />
                      <Card className="px-5">
                        <div className="divide-y divide-stone-100 dark:divide-stone-800/50">
                          {(ext?.certificaciones ?? DEFAULT_CERTS).map(c => (
                            <CertRow key={c.id} name={c.nombre} expires={c.vence} status={c.estado} />
                          ))}
                        </div>
                      </Card>
                    </section>

                    <section>
                      <SectionLabel text="Indicadores de práctica" />
                      <Card className="p-5">
                        <div className="space-y-4 mb-5">
                          <KPIBar label="Diagnóstico acertado"        value={ext?.diagnostico_acertado ?? null} />
                          <KPIBar label="Clientes con contrato anual" value={ext?.clientes_contrato    ?? null} />
                          <KPIBar label="Certs. sin rechazo"          value={ext?.certs_aprobados      ?? null} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            ['Visitas / mes',   ext?.visitas_mes    != null ? String(ext.visitas_mes)    : '—'],
                            ['Certs. emitidos', ext?.certs_emitidos != null ? String(ext.certs_emitidos) : '—'],
                          ].map(([l, v]) => (
                            <div key={l} className="bg-stone-50 dark:bg-stone-900/40 rounded-xl px-4 py-3 text-center">
                              <p className="text-[20px] font-semibold tracking-[-0.03em] text-stone-900 dark:text-stone-50 leading-none">{v}</p>
                              <p className="text-[10.5px] text-stone-400 dark:text-stone-500 mt-1.5 leading-snug">{l}</p>
                            </div>
                          ))}
                        </div>
                      </Card>
                    </section>
                  </div>
                </div>
              </div>
            )}

            {/* ════ SERVICIOS ════ */}
            {tab === 'servicios' && (
              <div key="servicios">
                <section className="mvz-rise mb-8" style={{ animationDelay: '25ms' }}>
                  <SectionLabel text="Servicios profesionales" />
                  <Card className="px-5">
                    <div className="divide-y divide-stone-100 dark:divide-stone-800/50">
                      {(ext?.servicios ?? DEFAULT_SERVICIOS).map(s => (
                        <ServiceRow key={s.id} label={s.label} price={s.precio} />
                      ))}
                    </div>
                  </Card>
                </section>

                <section className="mvz-rise mb-14" style={{ animationDelay: '50ms' }}>
                  <SectionLabel text="Zona de cobertura" />
                  <Card className="p-5">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {(ext?.estados_cobertura ?? DEFAULT_ESTADOS).map(estado => (
                        <div key={estado} className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-900/40">
                          <IcoPin cls="w-3 h-3 text-[#2FAF8F] shrink-0" />
                          <span className="text-[12.5px] text-stone-600 dark:text-stone-300">{estado}</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                </section>
              </div>
            )}

            {/* ════ CONTACTO ════ */}
            {tab === 'contacto' && (
              <div key="contacto">
                <section className="mvz-rise mb-8" style={{ animationDelay: '25ms' }}>
                  <SectionLabel text="Información de contacto" />
                  <Card className="overflow-hidden divide-y divide-stone-100 dark:divide-stone-800/50">
                    {ext?.celular       && <ContactRow icon={<IcoPhone />} label="Celular / WhatsApp" value={ext.celular}       href={`tel:${ext.celular}`}                 />}
                    {ext?.email_contact && <ContactRow icon={<IcoMail  />} label="Email"              value={ext.email_contact} href={`mailto:${ext.email_contact}`}        />}
                    {ext?.sitio_web     && <ContactRow icon={<IcoGlobe />} label="Sitio web"          value={ext.sitio_web}     href={ext.sitio_web.startsWith('http') ? ext.sitio_web : `https://${ext.sitio_web}`} />}
                    {ext?.disponibilidad && <ContactRow icon={<IcoClock />} label="Disponibilidad"    value={ext.disponibilidad} href="#" />}
                  </Card>
                  {ext?.celular && (
                    <button className="mt-3 w-full flex items-center justify-center gap-2 h-10 rounded-xl text-[12.5px] font-semibold text-[#2FAF8F] bg-[#2FAF8F]/8 dark:bg-[#2FAF8F]/12 border border-[#2FAF8F]/20 hover:bg-[#2FAF8F]/13 active:scale-[0.97] transition-all">
                      <IcoPhone cls="w-3.5 h-3.5" />
                      Agendar consulta
                    </button>
                  )}
                </section>

                <section className="mvz-rise mb-14" style={{ animationDelay: '50ms' }}>
                  <SectionLabel text="Datos de registro" />
                  <Card className="p-5">
                    <p className="text-[13px] font-medium text-stone-700 dark:text-stone-200 mb-0.5">{ext?.ubicacion ?? mvzUbicacion}</p>
                    <p className="text-[12px] text-stone-400 dark:text-stone-500 mb-4">
                      Cobertura en {(ext?.estados_cobertura ?? DEFAULT_ESTADOS).length} estados
                    </p>
                    <div className="grid grid-cols-2 gap-px bg-stone-100 dark:bg-stone-800/50 rounded-xl overflow-hidden">
                      {[
                        ['Cédula Prof.',  ext?.cedula       || mvzCedula],
                        ['SENASICA',      ext?.senasica_num || '—'],
                        ['Egreso',        ext?.universidad && ext?.anio_egreso ? `${ext.universidad.split(' ').find(w => w.length <= 6) ?? ext.universidad.slice(0,6)} ${ext.anio_egreso}` : ext?.anio_egreso ? String(ext.anio_egreso) : '—'],
                        ['Ejercicio',     ext?.anios_exp != null ? `${ext.anios_exp} años` : '—'],
                      ].map(([l, v]) => (
                        <div key={l} className="bg-white dark:bg-[#141210] px-4 py-3.5">
                          <p className="text-[9.5px] font-semibold uppercase tracking-[0.09em] text-stone-400 dark:text-stone-500 mb-1.5 leading-none">{l}</p>
                          <p className="text-[12px] font-mono font-medium text-stone-700 dark:text-stone-200 leading-none">{v}</p>
                        </div>
                      ))}
                    </div>
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