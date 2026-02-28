import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { invalidatePerfilRanchoCache } from './perfilRanchoCache'

// ─── TYPES ────────────────────────────────────────────────────────────────────
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

// ─── PERMISSIONS ──────────────────────────────────────────────────────────────
const PERMS: Record<UserRole, Perm> = {
  productor_ganadero:  { basicInfo:true,  capacity:true,  breeds:true,  certifications:false, infrastructure:true,  location:true,  team:true,  contact:true,  kpis:true  },
  medico_veterinario:  { basicInfo:false, capacity:false, breeds:true,  certifications:true,  infrastructure:false, location:false, team:false, contact:false, kpis:true  },
  union_ganadera:      { basicInfo:false, capacity:false, breeds:false, certifications:true,  infrastructure:false, location:false, team:false, contact:true,  kpis:false },
  exportador:          { basicInfo:false, capacity:false, breeds:false, certifications:true,  infrastructure:false, location:false, team:false, contact:true,  kpis:false },
  auditor_inspector:   { basicInfo:false, capacity:false, breeds:false, certifications:true,  infrastructure:false, location:false, team:false, contact:false, kpis:true  },
}

// Mapeo de roles del signup → UserRole del editor
const ROLE_MAP: Record<string, UserRole> = {
  producer: 'productor_ganadero',
  mvz:      'medico_veterinario',
  union:    'union_ganadera',
  exporter: 'exportador',
  auditor:  'auditor_inspector',
}

const ROLE_LABELS: Record<UserRole, string> = {
  productor_ganadero: 'Productor Ganadero', medico_veterinario: 'Médico Veterinario',
  union_ganadera: 'Unión Ganadera', exportador: 'Exportador', auditor_inspector: 'Auditor / Inspector',
}

// ─── ICONS ────────────────────────────────────────────────────────────────────
const SV = { viewBox:'0 0 24 24', fill:'none', stroke:'currentColor', strokeWidth:'1.65', strokeLinecap:'round' as const, strokeLinejoin:'round' as const }
type IP = { cls?: string }
const IcoArrow   = ({cls='w-4 h-4'}:IP) => <svg className={cls} {...SV}><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
const IcoSave    = ({cls='w-4 h-4'}:IP) => <svg className={cls} {...SV}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
const IcoSpark   = ({cls='w-3 h-3'}:IP) => <svg className={cls} {...SV}><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
const IcoLock    = ({cls='w-3.5 h-3.5'}:IP) => <svg className={cls} {...SV}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
const IcoCheck   = ({cls='w-4 h-4'}:IP) => <svg className={cls} {...SV}><polyline points="20 6 9 17 4 12"/></svg>
const IcoX       = ({cls='w-4 h-4'}:IP) => <svg className={cls} {...SV}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
const IcoPlus    = ({cls='w-4 h-4'}:IP) => <svg className={cls} {...SV}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
const IcoEdit    = ({cls='w-3.5 h-3.5'}:IP) => <svg className={cls} {...SV}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
const IcoTrash   = ({cls='w-3.5 h-3.5'}:IP) => <svg className={cls} {...SV}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
const IcoInfo    = ({cls='w-4 h-4'}:IP) => <svg className={cls} {...SV}><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
const IcoPin     = ({cls='w-4 h-4'}:IP) => <svg className={cls} {...SV}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
const IcoUsers   = ({cls='w-4 h-4'}:IP) => <svg className={cls} {...SV}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
const IcoBox     = ({cls='w-4 h-4'}:IP) => <svg className={cls} {...SV}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
const IcoTrend   = ({cls='w-4 h-4'}:IP) => <svg className={cls} {...SV}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
const IcoPhone   = ({cls='w-4 h-4'}:IP) => <svg className={cls} {...SV}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
const IcoShield  = ({cls='w-4 h-4'}:IP) => <svg className={cls} {...SV}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
const IcoLayers  = ({cls='w-4 h-4'}:IP) => <svg className={cls} {...SV}><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
const IcoSpinner = ({cls='w-4 h-4 animate-spin'}:IP) => <svg className={cls} viewBox="0 0 24 24" fill="none"><circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/><path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>

// ─── AVATAR HELPERS ───────────────────────────────────────────────────────────
const AVATAR_GRADIENTS = [
  'from-stone-600 to-stone-800', 'from-[#2FAF8F] to-[#1a9070]',
  'from-stone-500 to-stone-700', 'from-amber-500 to-amber-700',
  'from-slate-500 to-slate-700',
]
const getGradient = (idx: number) => AVATAR_GRADIENTS[idx % AVATAR_GRADIENTS.length]
const getInitials = (name: string) => name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()

// ─── SHARED COMPONENTS ────────────────────────────────────────────────────────
function SectionLabel({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-5">
      <IcoSpark cls="w-3 h-3 text-[#2FAF8F] shrink-0" />
      <span className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400 leading-none">{text}</span>
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
      {rows
        ? <textarea value={value} rows={rows} disabled={disabled} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={`${base} resize-none`} />
        : <input type={type} value={value} disabled={disabled} step={step} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={base} />
      }
      {hint && <p className="text-[11px] text-stone-400 dark:text-stone-600 mt-1.5 leading-relaxed">{hint}</p>}
    </div>
  )
}

function Section({ id, label, icon, locked, children }: {
  id: string; label: string; icon: React.ReactNode; locked: boolean; children: React.ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <SectionLabel text={label} />
      <Card className={`overflow-hidden transition-opacity ${locked ? 'opacity-60' : ''}`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 dark:border-stone-800/50">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${locked ? 'bg-stone-100 dark:bg-stone-800/60 text-stone-400 dark:text-stone-500' : 'bg-[#2FAF8F]/[0.09] dark:bg-[#2FAF8F]/[0.13] text-[#2FAF8F]'}`}>
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
        <div className={`px-5 py-5 ${locked ? 'pointer-events-none select-none' : ''}`}>{children}</div>
      </Card>
    </section>
  )
}

function StatusChip({ status }: { status: Status }) {
  const s = { active:'text-[#2FAF8F] bg-[#2FAF8F]/[0.09] border-[#2FAF8F]/20', pending:'text-amber-500 bg-amber-50 dark:bg-amber-950/20 border-amber-200/50 dark:border-amber-800/30', inactive:'text-stone-400 dark:text-stone-500 bg-stone-100 dark:bg-stone-800/60 border-stone-200/70 dark:border-stone-700/40' }[status]
  const l = { active:'Activo', pending:'Pendiente', inactive:'Inactivo' }[status]
  return <span className={`inline-flex items-center h-5 px-2 rounded-full text-[10px] font-semibold border ${s}`}>{l}</span>
}

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
          <button onClick={onCancel} className="flex-1 py-3.5 text-[13px] font-medium text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800/30 transition-colors border-r border-stone-100 dark:border-stone-800/50">Cancelar</button>
          <button onClick={onConfirm} className="flex-1 py-3.5 text-[13px] font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors">Continuar</button>
        </div>
      </div>
    </div>
  )
}

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

function InfraItemRow({ item, onEdit, onDelete, canEdit }: { item: InfraItem; onEdit: () => void; onDelete: () => void; canEdit: boolean }) {
  return (
    <div className="flex items-center gap-3.5 py-3.5 group">
      <div className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-stone-800/60 flex items-center justify-center text-stone-400 dark:text-stone-500 shrink-0">
        <IcoBox cls="w-3.5 h-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-stone-700 dark:text-stone-200 leading-snug">{item.type}</p>
        <p className="text-[11.5px] text-stone-400 dark:text-stone-500 mt-0.5">{item.description}</p>
      </div>
      <span className="text-[12px] font-semibold text-[#2FAF8F] shrink-0">{item.quantity}</span>
      {canEdit && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button onClick={onEdit} className="w-7 h-7 rounded-lg flex items-center justify-center text-stone-400 hover:text-[#2FAF8F] hover:bg-[#2FAF8F]/[0.08] transition-all"><IcoEdit cls="w-3.5 h-3.5" /></button>
          <button onClick={onDelete} className="w-7 h-7 rounded-lg flex items-center justify-center text-stone-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all"><IcoTrash cls="w-3.5 h-3.5" /></button>
        </div>
      )}
    </div>
  )
}

function TeamMemberRow({ member, idx, onEdit, onDelete, canEdit }: { member: TeamMember; idx: number; onEdit: () => void; onDelete: () => void; canEdit: boolean }) {
  return (
    <div className="flex items-center gap-3.5 py-3.5 group">
      <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${getGradient(idx)} flex items-center justify-center text-white text-[11px] font-bold shrink-0 shadow-sm`}>
        {getInitials(member.name)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-[13px] font-medium text-stone-700 dark:text-stone-200 leading-none">{member.name}</p>
          <StatusChip status={member.status} />
        </div>
        <p className="text-[11.5px] text-stone-400 dark:text-stone-500">{member.role} · {member.email}</p>
      </div>
      {canEdit && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button onClick={onEdit} className="w-7 h-7 rounded-lg flex items-center justify-center text-stone-400 hover:text-[#2FAF8F] hover:bg-[#2FAF8F]/[0.08] transition-all"><IcoEdit cls="w-3.5 h-3.5" /></button>
          <button onClick={onDelete} className="w-7 h-7 rounded-lg flex items-center justify-center text-stone-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all"><IcoTrash cls="w-3.5 h-3.5" /></button>
        </div>
      )}
    </div>
  )
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-stone-200 dark:border-stone-800/60 text-[12.5px] font-medium text-stone-400 dark:text-stone-500 hover:border-[#2FAF8F]/50 hover:text-[#2FAF8F] hover:bg-[#2FAF8F]/[0.04] transition-all mt-2">
      <IcoPlus cls="w-3.5 h-3.5" />{label}
    </button>
  )
}

const NAV_ITEMS = [
  { id: 'sec-basic',    label: 'Información básica' },
  { id: 'sec-location', label: 'Ubicación'          },
  { id: 'sec-capacity', label: 'Capacidad'          },
  { id: 'sec-breeds',   label: 'Razas y producción' },
  { id: 'sec-certs',    label: 'Certificaciones'    },
  { id: 'sec-infra',    label: 'Infraestructura'    },
  { id: 'sec-team',     label: 'Equipo'             },
  { id: 'sec-contact',  label: 'Contacto'           },
  { id: 'sec-kpis',     label: 'Indicadores KPI'    },
]

const EMPTY_FORM: Form = {
  name:'', location:'', foundedYear:'', description:'',
  totalArea:'', installedCapacity:'', activeAnimals:'',
  mainBreeds:'', productionType:'', certifications:'',
  phone:'', email:'', website:'',
  monthlyMortality:'', dailyWeightGain:'', exportableAnimals:'',
  address:'', latitude:'', longitude:'', altitude:'',
  grazingSystem:'', supplementation:'', waterSupply:'',
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function PerfilRanchoEdit() {
  const navigate  = useNavigate()
  const scrollRef = useRef<HTMLDivElement>(null)

  const [loadingData, setLoadingData] = useState(true)
  const [userId,      setUserId]      = useState<string | null>(null)
  const [role,        setRole]        = useState<UserRole>('productor_ganadero')
  const perm = PERMS[role]

  const [form,  setForm]  = useState<Form>(EMPTY_FORM)
  const [infra, setInfra] = useState<InfraItem[]>([])
  const [team,  setTeam]  = useState<TeamMember[]>([])

  const [isSaving,   setIsSaving]   = useState(false)
  const [saveError,  setSaveError]  = useState('')
  const [showToast,  setShowToast]  = useState(false)
  const [activeNav,  setActiveNav]  = useState('sec-basic')

  const [infraPanel, setInfraPanel] = useState(false)
  const [teamPanel,  setTeamPanel]  = useState(false)
  const [editInfra,  setEditInfra]  = useState<InfraItem | null>(null)
  const [editTeamM,  setEditTeamM]  = useState<TeamMember | null>(null)

  const [confirm, setConfirm] = useState<{ show:boolean; title:string; message:string; onOk:()=>void }>({
    show:false, title:'', message:'', onOk:()=>{}
  })

  const [tmpInfra, setTmpInfra] = useState<InfraItem>({ id:'', type:'', description:'', quantity:'' })
  const [tmpTeam,  setTmpTeam]  = useState<TeamMember>({ id:'', name:'', email:'', role:'', phone:'', status:'active' })

  // ─── LOAD ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const uid = session?.user?.id
        if (!uid) { navigate('/login'); return }
        setUserId(uid)

        // 1. user_profiles → datos base del signup
        const { data: up } = await supabase
          .from('user_profiles')
          .select('personal_data, institutional_data, email')
          .eq('user_id', uid)
          .maybeSingle()

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pd  = (up?.personal_data      as Record<string, any>) ?? {}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const id_ = (up?.institutional_data as Record<string, any>) ?? {}

        // Determinar rol real
        const rawRole = pd.role || session?.user?.user_metadata?.role || ''
        const mappedRole: UserRole = ROLE_MAP[rawRole] ?? 'productor_ganadero'
        setRole(mappedRole)

        // 2. ranch_extended_profiles → datos extras ya guardados antes
        const { data: re } = await supabase
          .from('ranch_extended_profiles')
          .select('*')
          .eq('user_id', uid)
          .maybeSingle()

        // Fusionar: extended tiene prioridad sobre signup (el usuario ya editó)
        setForm({
          name:              re?.name              ?? id_.ranchName          ?? '',
          location:          re?.location          ?? id_.location           ?? '',
          foundedYear:       re?.founded_year      ? String(re.founded_year) : '',
          description:       re?.bio               ?? '',
          totalArea:         re?.surface_ha        ? String(re.surface_ha)        : '',
          installedCapacity: re?.capacity_heads    ? String(re.capacity_heads)    : '',
          activeAnimals:     re?.active_heads      ? String(re.active_heads)      : '',
          mainBreeds:        re?.main_breeds       ?? id_.cattleType          ?? '',
          productionType:    re?.production_type   ?? id_.operationType       ?? '',
          certifications:    re?.certifications_text ?? id_.sanitaryCertifications ?? '',
          phone:             re?.phone             ?? pd.phone                ?? '',
          email:             re?.email_contact     ?? up?.email               ?? session?.user?.email ?? '',
          website:           re?.website           ?? '',
          monthlyMortality:  re?.mortality_pct     ? String(re.mortality_pct)     : '',
          dailyWeightGain:   re?.weight_gain_kg    ? String(re.weight_gain_kg)    : '',
          exportableAnimals: re?.exportable_pct    ? String(re.exportable_pct)    : '',
          address:           re?.address_street    ?? id_.ranchAddress        ?? '',
          latitude:          re?.lat               ? String(re.lat)               : '',
          longitude:         re?.lng               ? String(re.lng)               : '',
          altitude:          re?.altitude          ? String(re.altitude)          : '',
          grazingSystem:     re?.grazing_system    ?? '',
          supplementation:   re?.supplementation   ?? '',
          waterSupply:       re?.water_supply      ?? '',
        })

        setInfra(Array.isArray(re?.infrastructure) ? re.infrastructure : [])
        setTeam(Array.isArray(re?.team_members)    ? re.team_members    : [])

      } catch (e) {
        console.error('PerfilRanchoEdit load error:', e)
      } finally {
        setLoadingData(false)
      }
    }
    load()
  }, [navigate])

  // ─── SCROLL SPY ───────────────────────────────────────────────────────────
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const handler = () => {
      const sections = NAV_ITEMS.map(n => document.getElementById(n.id)).filter(Boolean) as HTMLElement[]
      const top = el.scrollTop + 120
      let active = NAV_ITEMS[0].id
      for (const s of sections) { if (s.offsetTop <= top) active = s.id }
      setActiveNav(active)
    }
    el.addEventListener('scroll', handler, { passive: true })
    return () => el.removeEventListener('scroll', handler)
  }, [])

  const scrollTo = (id: string) => {
    const el = document.getElementById(id)
    if (el && scrollRef.current) scrollRef.current.scrollTo({ top: el.offsetTop - 90, behavior: 'smooth' })
  }

  const f = (k: keyof Form) => (v: string) => setForm(p => ({ ...p, [k]: v }))

  // ─── SAVE ─────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!userId || isSaving) return
    setIsSaving(true)
    setSaveError('')
    try {
      // Construir team_roles únicos a partir del equipo actual
      const teamRoles = [...new Set(team.map(m => m.role).filter(Boolean))]

      // Buscar MVZ en el equipo para linked_mvz
      const mvz = team.find(m => m.role.toLowerCase().includes('veterinario') || m.role.toLowerCase().includes('mvz'))
      const linkedMvz = mvz
        ? { name: mvz.name, license: '', ini: getInitials(mvz.name) }
        : null

      const payload = {
        user_id:              userId,

        // Básica
        name:                 form.name          || null,
        bio:                  form.description   || null,
        location:             form.location      || null,
        founded_year:         form.foundedYear   ? parseInt(form.foundedYear)    : null,

        // Capacidad / operación
        surface_ha:           form.totalArea         ? parseFloat(form.totalArea)        : null,
        capacity_heads:       form.installedCapacity ? parseInt(form.installedCapacity)  : null,
        active_heads:         form.activeAnimals     ? parseInt(form.activeAnimals)      : null,

        // Producción
        main_breeds:          form.mainBreeds        || null,
        production_type:      form.productionType    || null,
        certifications_text:  form.certifications    || null,

        // KPIs
        mortality_pct:        form.monthlyMortality  ? parseFloat(form.monthlyMortality)  : null,
        weight_gain_kg:       form.dailyWeightGain   ? parseFloat(form.dailyWeightGain)   : null,
        exportable_pct:       form.exportableAnimals ? parseFloat(form.exportableAnimals) : null,

        // Ubicación
        address_street:       form.address    || null,
        lat:                  form.latitude   ? parseFloat(form.latitude)  : null,
        lng:                  form.longitude  ? parseFloat(form.longitude) : null,
        altitude:             form.altitude   ? parseFloat(form.altitude)  : null,

        // Contacto
        phone:                form.phone    || null,
        email_contact:        form.email    || null,
        website:              form.website  || null,

        // Manejo
        grazing_system:       form.grazingSystem   || null,
        supplementation:      form.supplementation || null,
        water_supply:         form.waterSupply     || null,

        // JSON arrays
        infrastructure:       infra,
        team_members:         team,
        team_roles:           teamRoles,
        linked_mvz:           linkedMvz,

        updated_at:           new Date().toISOString(),
      }

      // Upsert: inserta si no existe, actualiza si ya existe (basado en user_id)
      const { error } = await supabase
        .from('ranch_extended_profiles')
        .upsert(payload, { onConflict: 'user_id' })

      if (error) throw error

      setShowToast(true)
      setTimeout(() => { setShowToast(false); invalidatePerfilRanchoCache(); navigate('/perfil') }, 2200)
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
      onOk: () => navigate('/perfil'),
    })
  }

  // ─── INFRA HANDLERS ───────────────────────────────────────────────────────
  const openAddInfra = () => {
    setEditInfra(null)
    setTmpInfra({ id: Date.now().toString(), type:'', description:'', quantity:'' })
    setInfraPanel(true)
  }
  const openEditInfra = (item: InfraItem) => { setEditInfra(item); setTmpInfra({...item}); setInfraPanel(true) }
  const saveInfra = () => {
    if (!tmpInfra.type || !tmpInfra.quantity) return
    setInfra(prev => editInfra ? prev.map(i => i.id === editInfra.id ? tmpInfra : i) : [...prev, tmpInfra])
    setInfraPanel(false)
  }
  const deleteInfra = (id: string) => {
    setConfirm({ show:true, title:'Eliminar infraestructura', message:'¿Eliminar este elemento?',
      onOk: () => { setInfra(p => p.filter(i => i.id !== id)); setConfirm(c => ({...c, show:false})) }
    })
  }

  // ─── TEAM HANDLERS ────────────────────────────────────────────────────────
  const openAddTeam = () => {
    setEditTeamM(null)
    setTmpTeam({ id: Date.now().toString(), name:'', email:'', role:'', phone:'', status:'active' })
    setTeamPanel(true)
  }
  const openEditTeam = (m: TeamMember) => { setEditTeamM(m); setTmpTeam({...m}); setTeamPanel(true) }
  const saveTeam = () => {
    if (!tmpTeam.name || !tmpTeam.email || !tmpTeam.role) return
    setTeam(prev => editTeamM ? prev.map(m => m.id === editTeamM.id ? tmpTeam : m) : [...prev, tmpTeam])
    setTeamPanel(false)
  }
  const deleteTeam = (id: string) => {
    setConfirm({ show:true, title:'Eliminar miembro', message:'¿Eliminar a este miembro del equipo?',
      onOk: () => { setTeam(p => p.filter(m => m.id !== id)); setConfirm(c => ({...c, show:false})) }
    })
  }

  // ─── LOADING SKELETON ─────────────────────────────────────────────────────
  if (loadingData) return (
    <div className="h-full flex items-center justify-center bg-[#fafaf9] dark:bg-[#0c0a09]">
      <div className="flex flex-col items-center gap-3">
        <IcoSpinner cls="w-6 h-6 text-[#2FAF8F] animate-spin" />
        <p className="text-[12px] text-stone-400">Cargando perfil…</p>
      </div>
    </div>
  )

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600&display=swap');
        .pe, .pe * { -webkit-font-smoothing: antialiased; font-family: 'Geist', system-ui, sans-serif; }
        .pe-s { font-family: 'Instrument Serif', Georgia, serif; }
        .pe *:focus, .pe *:focus-visible { outline: none !important; }
        .pe::-webkit-scrollbar { width: 3px; }
        .pe::-webkit-scrollbar-thumb { background: #e7e5e4; border-radius: 999px; }
        .dark .pe::-webkit-scrollbar-thumb { background: #3c3836; }
        .pe { scrollbar-width: thin; scrollbar-color: #e7e5e4 transparent; }
        .dark .pe { scrollbar-color: #3c3836 transparent; }
        @keyframes pe-rise { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .pe-rise { animation: pe-rise 360ms cubic-bezier(.16,1,.3,1) both; }
        .pe-field input:not(:disabled):hover, .pe-field textarea:not(:disabled):hover { border-color: rgba(47,175,143,0.35); }
        .pe-select { -webkit-appearance:none; appearance:none; background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23a8a29e' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E"); background-repeat:no-repeat; background-position:right 12px center; padding-right:32px; }
      `}</style>

      <div className="pe h-full flex flex-col overflow-hidden bg-[#fafaf9] dark:bg-[#0c0a09]">

        {/* ── HEADER ──────────────────────────────────────────── */}
        <header className="shrink-0 sticky top-0 z-30 bg-white/85 dark:bg-[#0c0a09]/90 backdrop-blur-xl border-b border-stone-200/70 dark:border-stone-800/50">
          <div className="flex items-center justify-between px-5 md:px-8 h-[60px] gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <button onClick={handleCancel} className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-stone-800/60 flex items-center justify-center text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-700 transition-all shrink-0">
                <IcoArrow cls="w-3.5 h-3.5" />
              </button>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-stone-400 dark:text-stone-500 leading-none mb-0.5">{ROLE_LABELS[role]}</p>
                <h1 className="pe-s italic text-[16px] text-stone-900 dark:text-stone-50 leading-none truncate">Editar perfil del rancho</h1>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {saveError && <p className="text-[11px] text-rose-500 hidden sm:block">{saveError}</p>}
              <button onClick={handleCancel} className="hidden sm:flex items-center h-8 px-3.5 rounded-xl text-[12px] font-medium text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800/60 transition-all">Cancelar</button>
              <button onClick={handleSave} disabled={isSaving}
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl text-[12.5px] font-semibold bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 hover:bg-stone-700 dark:hover:bg-white active:scale-[0.96] transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed">
                {isSaving ? <IcoSpinner cls="w-4 h-4 animate-spin" /> : <IcoSave cls="w-3.5 h-3.5" />}
                {isSaving ? 'Guardando…' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </header>

        {/* ── BODY ────────────────────────────────────────────── */}
        <div className="flex flex-1 overflow-hidden">

          {/* Sidebar nav */}
          <aside className="hidden lg:flex flex-col w-52 shrink-0 border-r border-stone-100 dark:border-stone-800/50 py-6 gap-0.5 overflow-y-auto px-3">
            {NAV_ITEMS.map(n => (
              <button key={n.id} onClick={() => scrollTo(n.id)}
                className={['text-left px-3 py-2 rounded-xl text-[12px] transition-all',
                  activeNav === n.id ? 'bg-stone-100 dark:bg-stone-800/60 text-stone-800 dark:text-stone-100 font-semibold' : 'text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 font-medium',
                ].join(' ')}>
                {n.label}
              </button>
            ))}
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

          {/* Main */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto pe">
            <div className="px-5 md:px-8 lg:px-10 py-8 space-y-8">

              {/* ── INFORMACIÓN BÁSICA ── */}
              <Section id="sec-basic" label="Información básica" icon={<IcoInfo cls="w-4 h-4" />} locked={!perm.basicInfo}>
                <div className="space-y-4 pe-field">
                  <Field label="Nombre del rancho" value={form.name} onChange={f('name')} placeholder="Rancho El Búfalo Dorado" disabled={!perm.basicInfo} required />
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Ubicación general" value={form.location} onChange={f('location')} placeholder="Durango, México" disabled={!perm.basicInfo} />
                    <Field label="Año de fundación" value={form.foundedYear} onChange={f('foundedYear')} placeholder="1998" type="number" disabled={!perm.basicInfo} />
                  </div>
                  <Field label="Descripción" value={form.description} onChange={f('description')} placeholder="Describe las características del rancho…" disabled={!perm.basicInfo} rows={4} />
                </div>
              </Section>

              {/* ── UBICACIÓN ── */}
              <Section id="sec-location" label="Ubicación" icon={<IcoPin cls="w-4 h-4" />} locked={!perm.location}>
                <div className="space-y-4 pe-field">
                  <Field label="Dirección completa" value={form.address} onChange={f('address')} placeholder="Carretera Durango-Mazatlán, Km 45" disabled={!perm.location} required />
                  <div className="grid grid-cols-3 gap-4">
                    <Field label="Latitud" value={form.latitude} onChange={f('latitude')} placeholder="24.5231" type="number" step="0.0001" disabled={!perm.location} hint="GPS N/S" />
                    <Field label="Longitud" value={form.longitude} onChange={f('longitude')} placeholder="-104.8042" type="number" step="0.0001" disabled={!perm.location} hint="GPS E/O" />
                    <Field label="Altitud (msnm)" value={form.altitude} onChange={f('altitude')} placeholder="1890" type="number" disabled={!perm.location} />
                  </div>
                </div>
              </Section>

              {/* ── CAPACIDAD ── */}
              <Section id="sec-capacity" label="Capacidad" icon={<IcoLayers cls="w-4 h-4" />} locked={!perm.capacity}>
                <div className="grid grid-cols-3 gap-4 pe-field">
                  <Field label="Superficie (ha)" value={form.totalArea} onChange={f('totalArea')} placeholder="500" type="number" disabled={!perm.capacity} required />
                  <Field label="Cap. instalada (cab)" value={form.installedCapacity} onChange={f('installedCapacity')} placeholder="2000" type="number" disabled={!perm.capacity} required />
                  <Field label="Activos (cab)" value={form.activeAnimals} onChange={f('activeAnimals')} placeholder="1450" type="number" disabled={!perm.capacity} required />
                </div>
              </Section>

              {/* ── RAZAS ── */}
              <Section id="sec-breeds" label="Razas y producción" icon={<IcoLayers cls="w-4 h-4" />} locked={!perm.breeds}>
                <div className="space-y-4 pe-field">
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Razas principales" value={form.mainBreeds} onChange={f('mainBreeds')} placeholder="Charolais, Angus" disabled={!perm.breeds} required />
                    <Field label="Tipo de producción" value={form.productionType} onChange={f('productionType')} placeholder="Engorda intensiva" disabled={!perm.breeds} required />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <Field label="Sistema de pastoreo" value={form.grazingSystem} onChange={f('grazingSystem')} placeholder="Rotacional" disabled={!perm.breeds} />
                    <Field label="Suplementación" value={form.supplementation} onChange={f('supplementation')} placeholder="TMR automatizada" disabled={!perm.breeds} />
                    <Field label="Abastecimiento agua" value={form.waterSupply} onChange={f('waterSupply')} placeholder="Perforación propia" disabled={!perm.breeds} />
                  </div>
                </div>
              </Section>

              {/* ── CERTIFICACIONES ── */}
              <Section id="sec-certs" label="Certificaciones" icon={<IcoShield cls="w-4 h-4" />} locked={!perm.certifications}>
                <div className="pe-field">
                  <Field label="Certificaciones activas" value={form.certifications} onChange={f('certifications')} placeholder="TIF, SAGARPA, ISO" disabled={!perm.certifications} hint="Separa cada certificación con comas" />
                </div>
              </Section>

              {/* ── INFRAESTRUCTURA ── */}
              <Section id="sec-infra" label="Infraestructura" icon={<IcoBox cls="w-4 h-4" />} locked={!perm.infrastructure}>
                {infra.length === 0 && !perm.infrastructure && (
                  <p className="text-[12.5px] text-stone-400 dark:text-stone-500 text-center py-4">Sin infraestructura registrada</p>
                )}
                {infra.length > 0 && (
                  <div className="divide-y divide-stone-100 dark:divide-stone-800/50">
                    {infra.map(item => (
                      <InfraItemRow key={item.id} item={item} canEdit={perm.infrastructure}
                        onEdit={() => openEditInfra(item)} onDelete={() => deleteInfra(item.id)} />
                    ))}
                  </div>
                )}
                {perm.infrastructure && <AddButton label="Agregar infraestructura" onClick={openAddInfra} />}
              </Section>

              {/* ── EQUIPO ── */}
              <Section id="sec-team" label="Equipo" icon={<IcoUsers cls="w-4 h-4" />} locked={!perm.team}>
                {team.length === 0 && !perm.team && (
                  <p className="text-[12.5px] text-stone-400 dark:text-stone-500 text-center py-4">Sin miembros registrados</p>
                )}
                {team.length > 0 && (
                  <div className="divide-y divide-stone-100 dark:divide-stone-800/50">
                    {team.map((m, i) => (
                      <TeamMemberRow key={m.id} member={m} idx={i} canEdit={perm.team}
                        onEdit={() => openEditTeam(m)} onDelete={() => deleteTeam(m.id)} />
                    ))}
                  </div>
                )}
                {perm.team && <AddButton label="Agregar miembro" onClick={openAddTeam} />}
              </Section>

              {/* ── CONTACTO ── */}
              <Section id="sec-contact" label="Contacto" icon={<IcoPhone cls="w-4 h-4" />} locked={!perm.contact}>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pe-field">
                  <Field label="Teléfono" value={form.phone} onChange={f('phone')} placeholder="+52 618 123 4567" type="tel" disabled={!perm.contact} />
                  <Field label="Correo electrónico" value={form.email} onChange={f('email')} placeholder="info@rancho.mx" type="email" disabled={!perm.contact} />
                  <Field label="Sitio web" value={form.website} onChange={f('website')} placeholder="www.rancho.mx" disabled={!perm.contact} />
                </div>
              </Section>

              {/* ── KPIs ── */}
              <Section id="sec-kpis" label="Indicadores KPI" icon={<IcoTrend cls="w-4 h-4" />} locked={!perm.kpis}>
                <div className="grid grid-cols-3 gap-4 pe-field">
                  <Field label="Mortalidad mensual (%)" value={form.monthlyMortality} onChange={f('monthlyMortality')} placeholder="1.2" type="number" step="0.1" disabled={!perm.kpis} />
                  <Field label="Ganancia peso/día (kg)"  value={form.dailyWeightGain}  onChange={f('dailyWeightGain')}  placeholder="0.9" type="number" step="0.1" disabled={!perm.kpis} />
                  <Field label="Exportables (%)"          value={form.exportableAnimals} onChange={f('exportableAnimals')} placeholder="65" type="number" disabled={!perm.kpis} />
                </div>
              </Section>

              {saveError && (
                <div className="px-4 py-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-900/40">
                  <p className="text-[12px] text-rose-600 dark:text-rose-400">{saveError}</p>
                </div>
              )}

              <div className="h-16" />
            </div>
          </div>
        </div>

        {/* ── SLIDE-OVER INFRAESTRUCTURA ── */}
        <SlideOver show={infraPanel} title={editInfra ? 'Editar infraestructura' : 'Nueva infraestructura'} onClose={() => setInfraPanel(false)}>
          <div className="space-y-4 pe-field">
            <Field label="Tipo *" value={tmpInfra.type} onChange={v => setTmpInfra(p => ({...p, type:v}))} placeholder="Corrales de engorda" required />
            <Field label="Descripción" value={tmpInfra.description} onChange={v => setTmpInfra(p => ({...p, description:v}))} placeholder="Corrales techados con comederos" />
            <Field label="Cantidad / Capacidad *" value={tmpInfra.quantity} onChange={v => setTmpInfra(p => ({...p, quantity:v}))} placeholder="12 unidades" required />
          </div>
          <div className="flex gap-3 pt-4">
            <button onClick={() => setInfraPanel(false)} className="flex-1 h-10 rounded-xl border border-stone-200 dark:border-stone-800/60 text-[12.5px] font-medium text-stone-500 hover:bg-stone-50 dark:hover:bg-stone-800/30 transition-all">Cancelar</button>
            <button onClick={saveInfra} disabled={!tmpInfra.type || !tmpInfra.quantity} className="flex-1 h-10 rounded-xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-[12.5px] font-semibold hover:bg-stone-700 dark:hover:bg-white active:scale-[0.97] transition-all disabled:opacity-40 disabled:cursor-not-allowed">Guardar</button>
          </div>
        </SlideOver>

        {/* ── SLIDE-OVER EQUIPO ── */}
        <SlideOver show={teamPanel} title={editTeamM ? 'Editar miembro' : 'Nuevo miembro del equipo'} onClose={() => setTeamPanel(false)}>
          <div className="space-y-4 pe-field">
            <Field label="Nombre completo *" value={tmpTeam.name} onChange={v => setTmpTeam(p => ({...p, name:v}))} placeholder="Juan Pérez" required />
            <Field label="Correo electrónico *" value={tmpTeam.email} onChange={v => setTmpTeam(p => ({...p, email:v}))} placeholder="juan@rancho.mx" type="email" required />
            <Field label="Rol / Puesto *" value={tmpTeam.role} onChange={v => setTmpTeam(p => ({...p, role:v}))} placeholder="Médico Veterinario" required />
            <Field label="Teléfono" value={tmpTeam.phone} onChange={v => setTmpTeam(p => ({...p, phone:v}))} placeholder="+52 618 123 4567" type="tel" />
            <div>
              <label className="block text-[11.5px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-[0.07em] mb-1.5 leading-none">Estado</label>
              <select value={tmpTeam.status} onChange={e => setTmpTeam(p => ({...p, status: e.target.value as Status}))}
                className="pe-select w-full px-3.5 py-2.5 rounded-xl text-[13px] text-stone-800 dark:text-stone-100 bg-stone-50 dark:bg-[#1a1816] border border-stone-200 dark:border-stone-800/70 transition-all focus:outline-none focus:ring-2 focus:ring-[#2FAF8F]/30 focus:border-[#2FAF8F]/60">
                <option value="active">Activo</option>
                <option value="pending">Pendiente</option>
                <option value="inactive">Inactivo</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button onClick={() => setTeamPanel(false)} className="flex-1 h-10 rounded-xl border border-stone-200 dark:border-stone-800/60 text-[12.5px] font-medium text-stone-500 hover:bg-stone-50 dark:hover:bg-stone-800/30 transition-all">Cancelar</button>
            <button onClick={saveTeam} disabled={!tmpTeam.name || !tmpTeam.email || !tmpTeam.role} className="flex-1 h-10 rounded-xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-[12.5px] font-semibold hover:bg-stone-700 dark:hover:bg-white active:scale-[0.97] transition-all disabled:opacity-40 disabled:cursor-not-allowed">Guardar</button>
          </div>
        </SlideOver>

        {/* ── CONFIRM ── */}
        <ConfirmDialog
          show={confirm.show} title={confirm.title} message={confirm.message}
          onConfirm={() => { confirm.onOk(); setConfirm(c => ({...c, show:false})) }}
          onCancel={() => setConfirm(c => ({...c, show:false}))}
        />

        {/* ── TOAST ── */}
        <Toast show={showToast} />
      </div>
    </>
  )
}