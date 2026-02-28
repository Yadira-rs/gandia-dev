import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { invalidatePerfilUGCache } from './perfilUGCache'

// ─── TYPES ────────────────────────────────────────────────────────────────────
type UserRole = 'directivo_ug' | 'secretario_ug' | 'tesorero_ug' | 'vocal_ug' | 'auditor_inspector'

interface Perm {
  basicInfo: boolean; contacto: boolean; servicios: boolean; cobertura: boolean
  directiva: boolean; afiliaciones: boolean; indicadores: boolean; actividad: boolean
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

// ─── PERMISSIONS ──────────────────────────────────────────────────────────────
const PERMS: Record<UserRole, Perm> = {
  directivo_ug:      { basicInfo:true,  contacto:true,  servicios:true,  cobertura:true,  directiva:true,  afiliaciones:true,  indicadores:true,  actividad:true  },
  secretario_ug:     { basicInfo:true,  contacto:true,  servicios:true,  cobertura:false, directiva:false, afiliaciones:false, indicadores:false, actividad:true  },
  tesorero_ug:       { basicInfo:false, contacto:true,  servicios:false, cobertura:false, directiva:false, afiliaciones:false, indicadores:true,  actividad:false },
  vocal_ug:          { basicInfo:false, contacto:false, servicios:true,  cobertura:true,  directiva:false, afiliaciones:false, indicadores:false, actividad:true  },
  auditor_inspector: { basicInfo:false, contacto:false, servicios:false, cobertura:false, directiva:false, afiliaciones:true,  indicadores:true,  actividad:false },
}
const ROLE_LABELS: Record<UserRole, string> = {
  directivo_ug: 'Directivo UG', secretario_ug: 'Secretario General',
  tesorero_ug: 'Tesorero', vocal_ug: 'Vocal', auditor_inspector: 'Auditor / Inspector',
}

// ─── ICONS ────────────────────────────────────────────────────────────────────
const SV = { viewBox:'0 0 24 24', fill:'none', stroke:'currentColor', strokeWidth:'1.65', strokeLinecap:'round' as const, strokeLinejoin:'round' as const }
type IP = { cls?: string }
const IcoArrow   = ({cls='w-4 h-4'}:IP) => <svg className={cls} {...SV}><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
const IcoSave    = ({cls='w-4 h-4'}:IP) => <svg className={cls} {...SV}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
const IcoSpark   = ({cls='w-3 h-3'}:IP) => <svg className={cls} {...SV}><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
const IcoLock    = ({cls='w-3.5 h-3.5'}:IP) => <svg className={cls} {...SV}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
const IcoCheck   = ({cls='w-3 h-3'}:IP) => <svg className={cls} {...SV}><polyline points="20 6 9 17 4 12"/></svg>
const IcoX       = ({cls='w-3.5 h-3.5'}:IP) => <svg className={cls} {...SV}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
const IcoPlus    = ({cls='w-3.5 h-3.5'}:IP) => <svg className={cls} {...SV}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
const IcoEdit    = ({cls='w-3.5 h-3.5'}:IP) => <svg className={cls} {...SV}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
const IcoTrash   = ({cls='w-3.5 h-3.5'}:IP) => <svg className={cls} {...SV}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
const IcoInfo    = ({cls='w-4 h-4'}:IP) => <svg className={cls} {...SV}><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
const IcoUsers   = ({cls='w-4 h-4'}:IP) => <svg className={cls} {...SV}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
const IcoMap     = ({cls='w-4 h-4'}:IP) => <svg className={cls} {...SV}><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>
const IcoTrend   = ({cls='w-4 h-4'}:IP) => <svg className={cls} {...SV}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
const IcoPhone   = ({cls='w-4 h-4'}:IP) => <svg className={cls} {...SV}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
const IcoChart   = ({cls='w-4 h-4'}:IP) => <svg className={cls} {...SV}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
const IcoCheck2  = ({cls='w-4 h-4'}:IP) => <svg className={cls} {...SV}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
const IcoSpinner = ({cls='w-4 h-4 animate-spin'}:IP) => <svg className={cls} viewBox="0 0 24 24" fill="none"><circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/><path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>

// ─── AVATAR HELPERS ───────────────────────────────────────────────────────────
const AVATAR_GRADIENTS = [
  'from-stone-700 to-stone-900',
  'from-[#2FAF8F] to-[#1a9070]',
  'from-stone-500 to-stone-700',
  'from-amber-500 to-amber-700',
  'from-slate-500 to-slate-700',
]
const getGradient = (i: number) => AVATAR_GRADIENTS[i % AVATAR_GRADIENTS.length]
const getInitials = (name: string) => name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()

// ─── NAV ITEMS ────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: 'sec-basic',       label: 'Información básica'  },
  { id: 'sec-stats',       label: 'Datos estadísticos'  },
  { id: 'sec-indicadores', label: 'Indicadores'         },
  { id: 'sec-directiva',   label: 'Mesa directiva'      },
  { id: 'sec-zonas',       label: 'Cobertura regional'  },
  { id: 'sec-servicios',   label: 'Servicios'           },
  { id: 'sec-contacto',    label: 'Contacto'            },
]

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

// ─── FIELD ────────────────────────────────────────────────────────────────────
function Field({
  label, value, onChange, placeholder, disabled = false,
  type = 'text', step, required, hint, rows,
}: {
  label: string; value: string; onChange: (v: string) => void
  placeholder?: string; disabled?: boolean; type?: string
  step?: string; required?: boolean; hint?: string; rows?: number
}) {
  const base = [
    'w-full px-3.5 py-2.5 rounded-xl text-[13px] text-stone-800 dark:text-stone-100',
    'bg-stone-50 dark:bg-[#1a1816] border border-stone-200 dark:border-stone-800/70',
    'placeholder-stone-300 dark:placeholder-stone-600 transition-all leading-snug',
    'focus:outline-none focus:ring-2 focus:ring-[#2FAF8F]/30 focus:border-[#2FAF8F]/60',
    'disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-stone-100 dark:disabled:bg-[#141210]',
  ].join(' ')

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-[11.5px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-[0.07em] leading-none">
          {label}{required && <span className="text-[#2FAF8F] ml-0.5">*</span>}
        </label>
        {disabled && (
          <span className="flex items-center gap-1 text-[10px] text-stone-300 dark:text-stone-600">
            <IcoLock cls="w-2.5 h-2.5" />Solo lectura
          </span>
        )}
      </div>
      {rows ? (
        <textarea value={value} rows={rows} disabled={disabled} onChange={e => onChange(e.target.value)}
          placeholder={placeholder} className={`${base} resize-none`} />
      ) : (
        <input type={type} value={value} disabled={disabled} step={step}
          onChange={e => onChange(e.target.value)} placeholder={placeholder} className={base} />
      )}
      {hint && <p className="text-[11px] text-stone-400 dark:text-stone-600 mt-1.5 leading-relaxed">{hint}</p>}
    </div>
  )
}

// ─── SECTION ──────────────────────────────────────────────────────────────────
function Section({ id, label, icon, locked, children }: {
  id: string; label: string; icon: React.ReactNode; locked: boolean; children: React.ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <SectionLabel text={label} />
      <Card className={`overflow-hidden transition-opacity ${locked ? 'opacity-60' : ''}`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 dark:border-stone-800/50">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
              locked
                ? 'bg-stone-100 dark:bg-stone-800/60 text-stone-400 dark:text-stone-500'
                : 'bg-[#2FAF8F]/[0.09] dark:bg-[#2FAF8F]/[0.13] text-[#2FAF8F]'
            }`}>
              {icon}
            </div>
            <h3 className="text-[13.5px] font-semibold text-stone-800 dark:text-stone-100 leading-none">{label}</h3>
          </div>
          {locked && (
            <div className="flex items-center gap-1.5 text-[10.5px] text-stone-400 dark:text-stone-500">
              <IcoLock cls="w-3 h-3" />Sin permisos
            </div>
          )}
        </div>
        <div className={`px-5 py-5 ${locked ? 'pointer-events-none select-none' : ''}`}>
          {children}
        </div>
      </Card>
    </section>
  )
}

// ─── ADD BUTTON ───────────────────────────────────────────────────────────────
function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-stone-200 dark:border-stone-800/60 text-[12.5px] font-medium text-stone-400 dark:text-stone-500 hover:border-[#2FAF8F]/50 hover:text-[#2FAF8F] hover:bg-[#2FAF8F]/[0.04] transition-all mt-2">
      <IcoPlus cls="w-3.5 h-3.5" />{label}
    </button>
  )
}

// ─── TOAST ────────────────────────────────────────────────────────────────────
function Toast({ show }: { show: boolean }) {
  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none'}`}>
      <div className="flex items-center gap-3 px-5 py-3.5 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-2xl shadow-xl shadow-black/20">
        <div className="w-5 h-5 rounded-full bg-[#2FAF8F] flex items-center justify-center shrink-0">
          <IcoCheck cls="w-3 h-3 text-white" />
        </div>
        <span className="text-[13px] font-medium">Cambios guardados correctamente</span>
      </div>
    </div>
  )
}

// ─── CONFIRM DIALOG ───────────────────────────────────────────────────────────
function ConfirmDialog({ show, title, message, onConfirm, onCancel }: {
  show: boolean; title: string; message: string; onConfirm: () => void; onCancel: () => void
}) {
  if (!show) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
      <div className="bg-white dark:bg-[#1c1917] rounded-2xl shadow-2xl max-w-sm w-full mx-4 overflow-hidden">
        <div className="px-6 pt-6 pb-5">
          <p className="text-[14px] font-semibold text-stone-800 dark:text-stone-100 mb-1.5">{title}</p>
          <p className="text-[12.5px] text-stone-500 dark:text-stone-400 leading-relaxed">{message}</p>
        </div>
        <div className="flex border-t border-stone-100 dark:border-stone-800/50">
          <button onClick={onCancel} className="flex-1 py-3.5 text-[13px] font-medium text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800/30 transition-colors border-r border-stone-100 dark:border-stone-800/50">
            Cancelar
          </button>
          <button onClick={onConfirm} className="flex-1 py-3.5 text-[13px] font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors">
            Continuar
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── SLIDE-OVER ───────────────────────────────────────────────────────────────
function SlideOver({ show, title, onClose, children }: {
  show: boolean; title: string; onClose: () => void; children: React.ReactNode
}) {
  return (
    <>
      <div className={`fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] transition-opacity duration-200 ${show ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose} />
      <div className={`fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-white dark:bg-[#141210] shadow-2xl flex flex-col transition-transform duration-300 ease-out ${show ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-stone-100 dark:border-stone-800/50 shrink-0">
          <h3 className="text-[14px] font-semibold text-stone-800 dark:text-stone-100">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-stone-800/60 flex items-center justify-center text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors">
            <IcoX cls="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">{children}</div>
      </div>
    </>
  )
}

// ─── DIRECTIVO ROW ────────────────────────────────────────────────────────────
function DirectivoRow({ item, idx, onEdit, onDelete, canEdit }: {
  item: DirectivoItem; idx: number; onEdit: () => void; onDelete: () => void; canEdit: boolean
}) {
  return (
    <div className="flex items-center gap-3.5 py-3.5 group">
      <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${getGradient(idx)} flex items-center justify-center text-white text-[11px] font-bold shrink-0 shadow-sm`}>
        {getInitials(item.nombre)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-stone-700 dark:text-stone-200 leading-snug">{item.nombre}</p>
        <p className="text-[11px] text-[#2FAF8F] font-medium mt-0.5 leading-none">{item.cargo}</p>
        <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-0.5">{item.email} · {item.periodo}</p>
      </div>
      {canEdit && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button onClick={onEdit} className="w-7 h-7 rounded-lg flex items-center justify-center text-stone-400 hover:text-[#2FAF8F] hover:bg-[#2FAF8F]/[0.08] transition-all">
            <IcoEdit cls="w-3.5 h-3.5" />
          </button>
          <button onClick={onDelete} className="w-7 h-7 rounded-lg flex items-center justify-center text-stone-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all">
            <IcoTrash cls="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}

// ─── ZONA ROW ─────────────────────────────────────────────────────────────────
function ZonaRow({ item, onEdit, onDelete, canEdit }: {
  item: ZonaItem; onEdit: () => void; onDelete: () => void; canEdit: boolean
}) {
  return (
    <div className="flex items-center gap-3.5 py-3.5 group">
      <div className="w-[6px] h-[6px] rounded-full bg-[#2FAF8F] shrink-0 ml-1.5" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <p className="text-[13px] font-medium text-stone-700 dark:text-stone-200 leading-none">{item.zona}</p>
          <span className="text-[12px] font-semibold text-[#2FAF8F] shrink-0">{item.cabezas} cab.</span>
        </div>
        <p className="text-[11.5px] text-stone-400 dark:text-stone-500 truncate">{item.municipios}</p>
      </div>
      {canEdit && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button onClick={onEdit} className="w-7 h-7 rounded-lg flex items-center justify-center text-stone-400 hover:text-[#2FAF8F] hover:bg-[#2FAF8F]/[0.08] transition-all">
            <IcoEdit cls="w-3.5 h-3.5" />
          </button>
          <button onClick={onDelete} className="w-7 h-7 rounded-lg flex items-center justify-center text-stone-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all">
            <IcoTrash cls="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function PerfilUGEdit() {
  const navigate  = useNavigate()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [role]    = useState<UserRole>('directivo_ug')
  const perm      = PERMS[role]

  const [form, setForm] = useState<UGForm>({
    nombre: 'Unión Ganadera Regional de Durango', naturaleza: 'Asociación Civil',
    ubicacion: 'Durango, México', fundacion: '1942', rfc: 'UGRD421015AB3',
    descripcion: 'Organización gremial que representa y defiende los intereses del sector ganadero en el estado de Durango. Agrupa a productores ganaderos, gestiona trámites ante dependencias oficiales y promueve el desarrollo sustentable de la ganadería regional con más de 80 años de trayectoria.',
    organismoNacional: 'CNG', afilSagarpa: 'Autorizada',
    sociosActivos: '1240', municipios: '38', cabezasRegistradas: '480000', aniosTrayectoria: '82',
    cuotaMensual: '850', proximaAsamblea: '2026-03-15', sociosAlCorriente: '87',
    tramitesMes: '94', satisfaccion: '91', tramitesActivos: '142', tramitesEnProceso: '38',
    telefono: '+52 618 825 3100', email: 'contacto@ugdurango.org.mx',
    sitioWeb: 'www.ugdurango.org.mx', horario: 'Lun–Vie: 8:00–15:00',
    direccion: 'Av. 20 de Noviembre 615, Victoria de Durango',
  })

  const [directiva, setDirectiva] = useState<DirectivoItem[]>([
    { id:'1', nombre:'Ing. Roberto Medina Flores', cargo:'Presidente',        periodo:'2023 – 2026', email:'presidente@ugdurango.org.mx', telefono:'+52 618 111 0001' },
    { id:'2', nombre:'Lic. Patricia Valles',       cargo:'Secretaria General', periodo:'2023 – 2026', email:'secretaria@ugdurango.org.mx',  telefono:'+52 618 111 0002' },
    { id:'3', nombre:'C.P. Ernesto Aguirre',       cargo:'Tesorero',           periodo:'2023 – 2026', email:'tesorero@ugdurango.org.mx',    telefono:'+52 618 111 0003' },
    { id:'4', nombre:'Ing. Lucía Hernández',       cargo:'Vocal de Sanidad',   periodo:'2023 – 2026', email:'vocal@ugdurango.org.mx',       telefono:'+52 618 111 0004' },
  ])

  const [zonas, setZonas] = useState<ZonaItem[]>([
    { id:'1', zona:'Zona Norte',  municipios:'Guanaceví, Tepehuanes, San Bernardo', cabezas:'128,000' },
    { id:'2', zona:'Zona Centro', municipios:'Durango, Nombre de Dios, Canatlán',   cabezas:'195,000' },
    { id:'3', zona:'Zona Sur',    municipios:'Mezquital, Pueblo Nuevo, Súchil',     cabezas:'98,000'  },
    { id:'4', zona:'Zona Valles', municipios:'El Salto, Otáez, Tamazula',           cabezas:'59,000'  },
  ])

  const [isSaving, setIsSaving]   = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [activeNav, setActiveNav] = useState('sec-basic')

  // Slide-overs
  const [directivaPanel, setDirectivaPanel] = useState(false)
  const [zonaPanel, setZonaPanel]           = useState(false)
  const [editDirectivo, setEditDirectivo]   = useState<DirectivoItem | null>(null)
  const [editZona, setEditZona]             = useState<ZonaItem | null>(null)
  const [tmpDirectivo, setTmpDirectivo]     = useState<DirectivoItem>({ id:'', nombre:'', cargo:'', periodo:'', email:'', telefono:'' })
  const [tmpZona, setTmpZona]               = useState<ZonaItem>({ id:'', zona:'', municipios:'', cabezas:'' })

  // Confirm dialog
  const [confirm, setConfirm] = useState<{ show:boolean; title:string; message:string; onOk:()=>void }>({
    show:false, title:'', message:'', onOk: () => {}
  })

  const f = (k: keyof UGForm) => (v: string) => setForm(p => ({ ...p, [k]: v }))

  // Track active section on scroll
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const handler = () => {
      const sections = NAV_ITEMS.map(n => document.getElementById(n.id)).filter(Boolean) as HTMLElement[]
      const scrollTop = el.scrollTop + 120
      let active = NAV_ITEMS[0].id
      for (const s of sections) { if (s.offsetTop <= scrollTop) active = s.id }
      setActiveNav(active)
    }
    el.addEventListener('scroll', handler, { passive: true })
    return () => el.removeEventListener('scroll', handler)
  }, [])

  const scrollTo = (id: string) => {
    const el = document.getElementById(id)
    const container = scrollRef.current
    if (el && container) container.scrollTo({ top: el.offsetTop - 90, behavior: 'smooth' })
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const uid = session?.user?.id
      if (!uid) throw new Error('Sin sesión')

      const { error } = await supabase
        .from('union_extended_profiles')
        .upsert({
          user_id:             uid,
          bio:                 form.descripcion      || null,
          naturaleza:          form.naturaleza        || null,
          ubicacion:           form.ubicacion         || null,
          fundacion:           form.fundacion         ? parseInt(form.fundacion) : null,
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
        }, { onConflict: 'user_id' })

      if (error) throw error

      invalidatePerfilUGCache()
      setShowToast(true)
      setTimeout(() => { setShowToast(false); navigate('/perfil') }, 2200)
    } catch (e: unknown) {
      console.error('Error al guardar perfil UG:', e)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setConfirm({ show:true, title:'Descartar cambios', message:'Si sales ahora perderás todos los cambios no guardados.', onOk: () => navigate('/perfil') })
  }

  // Directiva handlers
  const openAddDirectivo = () => {
    setEditDirectivo(null)
    setTmpDirectivo({ id: Date.now().toString(), nombre:'', cargo:'', periodo:'', email:'', telefono:'' })
    setDirectivaPanel(true)
  }
  const openEditDirectivo = (d: DirectivoItem) => { setEditDirectivo(d); setTmpDirectivo({ ...d }); setDirectivaPanel(true) }
  const saveDirectivo = () => {
    if (!tmpDirectivo.nombre || !tmpDirectivo.cargo) return
    setDirectiva(prev => editDirectivo ? prev.map(d => d.id === editDirectivo.id ? tmpDirectivo : d) : [...prev, tmpDirectivo])
    setDirectivaPanel(false)
  }
  const deleteDirectivo = (id: string) => {
    setConfirm({ show:true, title:'Eliminar directivo', message:'¿Estás seguro de que quieres eliminar a este miembro?', onOk: () => { setDirectiva(p => p.filter(d => d.id !== id)); setConfirm(c => ({...c, show:false})) } })
  }

  // Zona handlers
  const openAddZona = () => {
    setEditZona(null)
    setTmpZona({ id: Date.now().toString(), zona:'', municipios:'', cabezas:'' })
    setZonaPanel(true)
  }
  const openEditZona = (z: ZonaItem) => { setEditZona(z); setTmpZona({ ...z }); setZonaPanel(true) }
  const saveZona = () => {
    if (!tmpZona.zona) return
    setZonas(prev => editZona ? prev.map(z => z.id === editZona.id ? tmpZona : z) : [...prev, tmpZona])
    setZonaPanel(false)
  }
  const deleteZona = (id: string) => {
    setConfirm({ show:true, title:'Eliminar zona', message:'¿Estás seguro de que quieres eliminar esta zona?', onOk: () => { setZonas(p => p.filter(z => z.id !== id)); setConfirm(c => ({...c, show:false})) } })
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600&display=swap');
        .ue, .ue * { -webkit-font-smoothing: antialiased; font-family: 'Geist', system-ui, sans-serif; }
        .ue-s { font-family: 'Instrument Serif', Georgia, serif; }
        .ue *:focus, .ue *:focus-visible { outline: none !important; }
        .ue::-webkit-scrollbar { width: 3px; }
        .ue::-webkit-scrollbar-thumb { background: #e7e5e4; border-radius: 999px; }
        .dark .ue::-webkit-scrollbar-thumb { background: #3c3836; }
        .ue { scrollbar-width: thin; scrollbar-color: #e7e5e4 transparent; }
        .dark .ue { scrollbar-color: #3c3836 transparent; }

        @keyframes ue-rise { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .ue-rise { animation: ue-rise 360ms cubic-bezier(.16,1,.3,1) both; }

        .ue-field input:not(:disabled):hover,
        .ue-field textarea:not(:disabled):hover { border-color: rgba(47,175,143,0.35); }

        .ue-select {
          -webkit-appearance: none; appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23a8a29e' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
          background-repeat: no-repeat; background-position: right 12px center; padding-right: 32px;
        }
      `}</style>

      <div className="ue h-full flex flex-col overflow-hidden bg-[#fafaf9] dark:bg-[#0c0a09]">

        {/* ── STICKY HEADER ─────────────────────────────────────── */}
        <header className="shrink-0 sticky top-0 z-30 bg-white/85 dark:bg-[#0c0a09]/90 backdrop-blur-xl border-b border-stone-200/70 dark:border-stone-800/50">
          <div className="flex items-center justify-between px-5 md:px-8 h-[60px] gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <button onClick={handleCancel}
                className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-stone-800/60 flex items-center justify-center text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-700 transition-all shrink-0">
                <IcoArrow cls="w-3.5 h-3.5" />
              </button>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-stone-400 dark:text-stone-500 leading-none mb-0.5">
                  {ROLE_LABELS[role]}
                </p>
                <h1 className="ue-s italic text-[16px] text-stone-900 dark:text-stone-50 leading-none truncate">
                  Editar perfil de la Unión Ganadera
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={handleCancel}
                className="hidden sm:flex items-center h-8 px-3.5 rounded-xl text-[12px] font-medium text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800/60 transition-all">
                Cancelar
              </button>
              <button onClick={handleSave} disabled={isSaving}
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl text-[12.5px] font-semibold bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 hover:bg-stone-700 dark:hover:bg-white active:scale-[0.96] transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed">
                {isSaving ? <IcoSpinner cls="w-4 h-4 animate-spin" /> : <IcoSave cls="w-3.5 h-3.5" />}
                {isSaving ? 'Guardando…' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </header>

        {/* ── BODY ──────────────────────────────────────────────── */}
        <div className="flex flex-1 overflow-hidden">

          {/* Sidebar nav — desktop */}
          <aside className="hidden lg:flex flex-col w-52 shrink-0 border-r border-stone-100 dark:border-stone-800/50 py-6 gap-0.5 overflow-y-auto px-3">
            {NAV_ITEMS.map(n => (
              <button key={n.id} onClick={() => scrollTo(n.id)}
                className={[
                  'text-left px-3 py-2 rounded-xl text-[12px] transition-all',
                  activeNav === n.id
                    ? 'bg-stone-100 dark:bg-stone-800/60 text-stone-800 dark:text-stone-100 font-semibold'
                    : 'text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 font-medium',
                ].join(' ')}>
                {n.label}
              </button>
            ))}

            {/* Rol / permisos info */}
            <div className="mt-auto pt-6 px-1">
              <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-900/40 border border-stone-100 dark:border-stone-800/40">
                <div className="flex items-center gap-1.5 mb-2">
                  <IcoInfo cls="w-3 h-3 text-stone-400" />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-stone-400 dark:text-stone-500">Permisos</span>
                </div>
                <p className="text-[10.5px] text-stone-400 dark:text-stone-500 leading-relaxed">
                  Rol: <span className="font-medium text-stone-600 dark:text-stone-300">{ROLE_LABELS[role]}</span>
                </p>
              </div>
            </div>
          </aside>

          {/* Main scroll area */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto ue">
            <div className="px-5 md:px-8 lg:px-10 py-8 space-y-8">

              {/* ── INFORMACIÓN BÁSICA ────────────────────────── */}
              <Section id="sec-basic" label="Información básica" icon={<IcoInfo cls="w-4 h-4" />} locked={!perm.basicInfo}>
                <div className="space-y-4 ue-field">
                  <Field label="Nombre de la organización" value={form.nombre} onChange={f('nombre')} placeholder="Unión Ganadera Regional de Durango" disabled={!perm.basicInfo} required />
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Naturaleza jurídica" value={form.naturaleza} onChange={f('naturaleza')} placeholder="Asociación Civil" disabled={!perm.basicInfo} />
                    <Field label="Organismo nacional" value={form.organismoNacional} onChange={f('organismoNacional')} placeholder="CNG" disabled={!perm.basicInfo} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Ubicación general" value={form.ubicacion} onChange={f('ubicacion')} placeholder="Durango, México" disabled={!perm.basicInfo} />
                    <Field label="Año de fundación" value={form.fundacion} onChange={f('fundacion')} placeholder="1942" type="number" disabled={!perm.basicInfo} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="RFC" value={form.rfc} onChange={f('rfc')} placeholder="UGRD421015AB3" disabled={!perm.basicInfo} />
                    <Field label="Afiliación SAGARPA" value={form.afilSagarpa} onChange={f('afilSagarpa')} placeholder="Autorizada" disabled={!perm.basicInfo} />
                  </div>
                  <Field label="Descripción institucional" value={form.descripcion} onChange={f('descripcion')} placeholder="Misión y trayectoria de la organización…" disabled={!perm.basicInfo} rows={4} />
                </div>
              </Section>

              {/* ── DATOS ESTADÍSTICOS ───────────────────────── */}
              <Section id="sec-stats" label="Datos estadísticos" icon={<IcoChart cls="w-4 h-4" />} locked={!perm.indicadores}>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 ue-field">
                  <Field label="Socios activos"       value={form.sociosActivos}       onChange={f('sociosActivos')}       placeholder="1240"   type="number" disabled={!perm.indicadores} />
                  <Field label="Municipios cubiertos" value={form.municipios}           onChange={f('municipios')}          placeholder="38"     type="number" disabled={!perm.indicadores} />
                  <Field label="Cabezas registradas"  value={form.cabezasRegistradas}   onChange={f('cabezasRegistradas')}  placeholder="480000" type="number" disabled={!perm.indicadores} />
                  <Field label="Años de trayectoria"  value={form.aniosTrayectoria}     onChange={f('aniosTrayectoria')}    placeholder="82"     type="number" disabled={!perm.indicadores} />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4 ue-field">
                  <Field label="Cuota mensual (MXN)"  value={form.cuotaMensual}         onChange={f('cuotaMensual')}        placeholder="850"    type="number" disabled={!perm.indicadores} />
                  <Field label="Próxima asamblea"      value={form.proximaAsamblea}      onChange={f('proximaAsamblea')}     placeholder="2026-03-15" type="date" disabled={!perm.indicadores} />
                  <Field label="Socios al corriente (%)" value={form.sociosAlCorriente} onChange={f('sociosAlCorriente')}   placeholder="87"     type="number" disabled={!perm.indicadores} />
                </div>
              </Section>

              {/* ── INDICADORES DE GESTIÓN ───────────────────── */}
              <Section id="sec-indicadores" label="Indicadores de gestión" icon={<IcoTrend cls="w-4 h-4" />} locked={!perm.indicadores}>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 ue-field">
                  <Field label="Trámites resueltos (%)" value={form.tramitesMes}       onChange={f('tramitesMes')}       placeholder="94" type="number" disabled={!perm.indicadores} hint="Del mes actual" />
                  <Field label="Satisfacción socios (%)" value={form.satisfaccion}     onChange={f('satisfaccion')}     placeholder="91" type="number" disabled={!perm.indicadores} hint="Encuestas" />
                  <Field label="Trámites activos"        value={form.tramitesActivos}  onChange={f('tramitesActivos')}  placeholder="142" type="number" disabled={!perm.indicadores} hint="Total en proceso" />
                  <Field label="En proceso"              value={form.tramitesEnProceso} onChange={f('tramitesEnProceso')} placeholder="38" type="number" disabled={!perm.indicadores} hint="Pendientes" />
                </div>
              </Section>

              {/* ── MESA DIRECTIVA ───────────────────────────── */}
              <Section id="sec-directiva" label="Mesa directiva" icon={<IcoUsers cls="w-4 h-4" />} locked={!perm.directiva}>
                <div className="divide-y divide-stone-100 dark:divide-stone-800/50">
                  {directiva.map((d, i) => (
                    <DirectivoRow key={d.id} item={d} idx={i} canEdit={perm.directiva}
                      onEdit={() => openEditDirectivo(d)}
                      onDelete={() => deleteDirectivo(d.id)} />
                  ))}
                </div>
                {perm.directiva && <AddButton label="Agregar miembro a la directiva" onClick={openAddDirectivo} />}
              </Section>

              {/* ── COBERTURA REGIONAL ───────────────────────── */}
              <Section id="sec-zonas" label="Cobertura regional" icon={<IcoMap cls="w-4 h-4" />} locked={!perm.cobertura}>
                <div className="divide-y divide-stone-100 dark:divide-stone-800/50">
                  {zonas.map(z => (
                    <ZonaRow key={z.id} item={z} canEdit={perm.cobertura}
                      onEdit={() => openEditZona(z)}
                      onDelete={() => deleteZona(z.id)} />
                  ))}
                </div>
                {perm.cobertura && <AddButton label="Agregar zona ganadera" onClick={openAddZona} />}
              </Section>

              {/* ── SERVICIOS ────────────────────────────────── */}
              <Section id="sec-servicios" label="Servicios para socios" icon={<IcoCheck2 cls="w-4 h-4" />} locked={!perm.servicios}>
                <div className="mb-4 px-4 py-3 rounded-xl bg-stone-50 dark:bg-stone-900/40 border border-stone-100 dark:border-stone-800/40">
                  <p className="text-[12px] text-stone-500 dark:text-stone-400 leading-relaxed">
                    La configuración detallada de servicios se administra desde el panel de gestión institucional.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-stone-100 dark:bg-stone-800/50 rounded-xl overflow-hidden">
                  {[
                    'Gestión de Trámites', 'Certificación Sanitaria',
                    'Asesoría Legal', 'Crédito Ganadero',
                    'Capacitación', 'Vinculación Exportadora',
                  ].map(s => (
                    <div key={s} className="flex items-center justify-between px-4 py-3.5 bg-white dark:bg-[#141210]">
                      <span className="text-[13px] font-medium text-stone-700 dark:text-stone-200">{s}</span>
                      <span className="inline-flex items-center gap-1.5 h-5 px-2 rounded-full text-[10px] font-semibold text-[#2FAF8F] bg-[#2FAF8F]/[0.09] border border-[#2FAF8F]/20">
                        <span className="w-[5px] h-[5px] rounded-full bg-[#2FAF8F]" />Activo
                      </span>
                    </div>
                  ))}
                </div>
              </Section>

              {/* ── CONTACTO ─────────────────────────────────── */}
              <Section id="sec-contacto" label="Contacto institucional" icon={<IcoPhone cls="w-4 h-4" />} locked={!perm.contacto}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 ue-field">
                  <Field label="Teléfono"             value={form.telefono} onChange={f('telefono')} placeholder="+52 618 825 3100"          type="tel"   disabled={!perm.contacto} />
                  <Field label="Correo electrónico"   value={form.email}    onChange={f('email')}    placeholder="contacto@ugdurango.org.mx" type="email" disabled={!perm.contacto} />
                  <Field label="Sitio web"            value={form.sitioWeb} onChange={f('sitioWeb')} placeholder="www.ugdurango.org.mx"                   disabled={!perm.contacto} />
                  <Field label="Horario de atención"  value={form.horario}  onChange={f('horario')}  placeholder="Lun–Vie: 8:00–15:00"                   disabled={!perm.contacto} />
                </div>
                <div className="mt-4 ue-field">
                  <Field label="Dirección de oficinas" value={form.direccion} onChange={f('direccion')} placeholder="Av. 20 de Noviembre 615, Victoria de Durango" disabled={!perm.contacto} required />
                </div>
              </Section>

              <div className="h-16" />
            </div>
          </div>
        </div>

        {/* ── SLIDE-OVER: DIRECTIVA ─────────────────────────────── */}
        <SlideOver show={directivaPanel} title={editDirectivo ? 'Editar directivo' : 'Nuevo miembro de la directiva'} onClose={() => setDirectivaPanel(false)}>
          <div className="space-y-4 ue-field">
            <Field label="Nombre completo *"    value={tmpDirectivo.nombre}   onChange={v => setTmpDirectivo(p => ({...p, nombre:v}))}   placeholder="Ing. Roberto Medina" disabled={false} required />
            <Field label="Cargo *"              value={tmpDirectivo.cargo}    onChange={v => setTmpDirectivo(p => ({...p, cargo:v}))}    placeholder="Presidente"         disabled={false} required />
            <Field label="Período"              value={tmpDirectivo.periodo}  onChange={v => setTmpDirectivo(p => ({...p, periodo:v}))}  placeholder="2023 – 2026"        disabled={false} />
            <Field label="Correo electrónico"   value={tmpDirectivo.email}    onChange={v => setTmpDirectivo(p => ({...p, email:v}))}    placeholder="nombre@ugdurango.org.mx" type="email" disabled={false} />
            <Field label="Teléfono"             value={tmpDirectivo.telefono} onChange={v => setTmpDirectivo(p => ({...p, telefono:v}))} placeholder="+52 618 111 0001"   type="tel" disabled={false} />
          </div>
          <div className="flex gap-3 pt-4">
            <button onClick={() => setDirectivaPanel(false)} className="flex-1 h-10 rounded-xl border border-stone-200 dark:border-stone-800/60 text-[12.5px] font-medium text-stone-500 hover:bg-stone-50 dark:hover:bg-stone-800/30 transition-all">Cancelar</button>
            <button onClick={saveDirectivo} disabled={!tmpDirectivo.nombre || !tmpDirectivo.cargo} className="flex-1 h-10 rounded-xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-[12.5px] font-semibold hover:bg-stone-700 dark:hover:bg-white active:scale-[0.97] transition-all disabled:opacity-40 disabled:cursor-not-allowed">Guardar</button>
          </div>
        </SlideOver>

        {/* ── SLIDE-OVER: ZONA ──────────────────────────────────── */}
        <SlideOver show={zonaPanel} title={editZona ? 'Editar zona' : 'Nueva zona ganadera'} onClose={() => setZonaPanel(false)}>
          <div className="space-y-4 ue-field">
            <Field label="Nombre de la zona *" value={tmpZona.zona}       onChange={v => setTmpZona(p => ({...p, zona:v}))}       placeholder="Zona Norte"                       disabled={false} required />
            <Field label="Municipios"           value={tmpZona.municipios} onChange={v => setTmpZona(p => ({...p, municipios:v}))} placeholder="Guanaceví, Tepehuanes, San Bernardo" disabled={false} />
            <Field label="Cabezas de ganado"    value={tmpZona.cabezas}   onChange={v => setTmpZona(p => ({...p, cabezas:v}))}   placeholder="128,000"                          disabled={false} />
          </div>
          <div className="flex gap-3 pt-4">
            <button onClick={() => setZonaPanel(false)} className="flex-1 h-10 rounded-xl border border-stone-200 dark:border-stone-800/60 text-[12.5px] font-medium text-stone-500 hover:bg-stone-50 dark:hover:bg-stone-800/30 transition-all">Cancelar</button>
            <button onClick={saveZona} disabled={!tmpZona.zona} className="flex-1 h-10 rounded-xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-[12.5px] font-semibold hover:bg-stone-700 dark:hover:bg-white active:scale-[0.97] transition-all disabled:opacity-40 disabled:cursor-not-allowed">Guardar</button>
          </div>
        </SlideOver>

        {/* ── CONFIRM ───────────────────────────────────────────── */}
        <ConfirmDialog
          show={confirm.show} title={confirm.title} message={confirm.message}
          onConfirm={() => { confirm.onOk(); setConfirm(c => ({...c, show:false})) }}
          onCancel={() => setConfirm(c => ({...c, show:false}))} />

        {/* ── TOAST ─────────────────────────────────────────────── */}
        <Toast show={showToast} />
      </div>
    </>
  )
}