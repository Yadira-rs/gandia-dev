import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { invalidatePerfilMVZCache } from './perfilMVZCache'

// ─── TYPES ────────────────────────────────────────────────────────────────────
type UserRole = 'mvz_titular' | 'mvz_asociado' | 'admin_clinica' | 'auditor_inspector'

interface Perm {
  basicInfo: boolean; especialidades: boolean; formacion: boolean; experiencia: boolean
  certificaciones: boolean; clientes: boolean; servicios: boolean; indicadores: boolean; contacto: boolean
}

const PERMS: Record<UserRole, Perm> = {
  mvz_titular:       { basicInfo:true,  especialidades:true,  formacion:true,  experiencia:true,  certificaciones:true,  clientes:true,  servicios:true,  indicadores:true,  contacto:true  },
  mvz_asociado:      { basicInfo:false, especialidades:true,  formacion:true,  experiencia:true,  certificaciones:false, clientes:true,  servicios:true,  indicadores:false, contacto:false },
  admin_clinica:     { basicInfo:true,  especialidades:false, formacion:false, experiencia:false, certificaciones:false, clientes:true,  servicios:true,  indicadores:true,  contacto:true  },
  auditor_inspector: { basicInfo:false, especialidades:false, formacion:false, experiencia:false, certificaciones:true,  clientes:false, servicios:false, indicadores:true,  contacto:false },
}

interface EstudioItem { id:string; grado:string; institucion:string; periodo:string; tipo:'licenciatura'|'maestria'|'diplomado' }
interface ExpItem      { id:string; cargo:string; empresa:string; periodo:string; descripcion:string; activo:boolean }
interface CertItem     { id:string; nombre:string; vence:string; estado:'vigente'|'por-vencer'|'vencido' }
interface ClienteItem  { id:string; nombre:string; municipio:string; cabezas:string; tipo:string }
interface ServicioItem { id:string; label:string; precio:string }

interface Form {
  nombre:string; titulo:string; ubicacion:string; cedula:string; universidad:string
  anioEgreso:string; aniosExp:string; descripcion:string; celular:string; email:string
  sitioWeb:string; disponibilidad:string; diagnosticoAcertado:string; clientesContrato:string
  certsAprobados:string; visitasMes:string; certsEmitidos:string
}

// ─── ICONS ────────────────────────────────────────────────────────────────────
const SV = { viewBox:'0 0 24 24', fill:'none', stroke:'currentColor', strokeWidth:'1.65', strokeLinecap:'round' as const, strokeLinejoin:'round' as const }
type IP = { cls?:string }
const IcoArrow   = ({cls='w-4 h-4'}:IP) => <svg className={cls} {...SV}><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
const IcoSave    = ({cls='w-4 h-4'}:IP) => <svg className={cls} {...SV}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
const IcoSpin    = ({cls='w-4 h-4'}:IP) => <svg className={cls+' animate-spin'} {...SV}><circle cx="12" cy="12" r="10" strokeOpacity=".25"/><path d="M4 12a8 8 0 018-8" strokeOpacity=".75"/></svg>
const IcoLock    = ({cls='w-3.5 h-3.5'}:IP) => <svg className={cls} {...SV}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
const IcoCheck   = ({cls='w-4 h-4'}:IP) => <svg className={cls} {...SV}><polyline points="20 6 9 17 4 12"/></svg>
const IcoX       = ({cls='w-3.5 h-3.5'}:IP) => <svg className={cls} {...SV}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
const IcoPlus    = ({cls='w-4 h-4'}:IP) => <svg className={cls} {...SV}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
const IcoEdit    = ({cls='w-3.5 h-3.5'}:IP) => <svg className={cls} {...SV}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
const IcoTrash   = ({cls='w-3.5 h-3.5'}:IP) => <svg className={cls} {...SV}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
const IcoPerson  = ({cls='w-4 h-4'}:IP) => <svg className={cls} {...SV}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
const IcoShield  = ({cls='w-4 h-4'}:IP) => <svg className={cls} {...SV}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
const IcoBook    = ({cls='w-4 h-4'}:IP) => <svg className={cls} {...SV}><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
const IcoBrief   = ({cls='w-4 h-4'}:IP) => <svg className={cls} {...SV}><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
const IcoBadge   = ({cls='w-4 h-4'}:IP) => <svg className={cls} {...SV}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
const IcoHome    = ({cls='w-4 h-4'}:IP) => <svg className={cls} {...SV}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
const IcoDollar  = ({cls='w-4 h-4'}:IP) => <svg className={cls} {...SV}><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
const IcoTrend   = ({cls='w-4 h-4'}:IP) => <svg className={cls} {...SV}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
const IcoPhone   = ({cls='w-4 h-4'}:IP) => <svg className={cls} {...SV}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
const IcoInfo    = ({cls='w-4 h-4'}:IP) => <svg className={cls} {...SV}><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>

// ─── PRIMITIVES ───────────────────────────────────────────────────────────────
function Card({ children, className='' }:{ children:React.ReactNode; className?:string }) {
  return (
    <div className={`bg-white dark:bg-[#141210] border border-stone-200/70 dark:border-stone-800/60 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] dark:shadow-none ${className}`}>
      {children}
    </div>
  )
}

// Section wrapper with lock
function Section({ id, title, icon, locked, children }:{
  id?:string; title:string; icon:React.ReactNode; locked:boolean; children:React.ReactNode
}) {
  return (
    <section id={id} className={`mb-7 ${locked ? 'opacity-60' : ''}`}>
      <Card className="overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-stone-100 dark:border-stone-800/50">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${locked ? 'bg-stone-100 dark:bg-stone-800/50 text-stone-400 dark:text-stone-500' : 'bg-[#2FAF8F]/8 text-[#2FAF8F]'}`}>
            {icon}
          </div>
          <span className="text-[13.5px] font-semibold text-stone-800 dark:text-stone-100 flex-1">{title}</span>
          {locked && (
            <span className="inline-flex items-center gap-1.5 h-5 px-2 rounded-full text-[9.5px] font-semibold text-stone-400 dark:text-stone-500 bg-stone-100 dark:bg-stone-800/50 border border-stone-200/70 dark:border-stone-700/40">
              <IcoLock cls="w-2.5 h-2.5" /> Solo lectura
            </span>
          )}
        </div>
        <div className={`px-6 py-5 ${locked ? 'pointer-events-none' : ''}`}>{children}</div>
      </Card>
    </section>
  )
}

// Unified Field
function Field({ label, value, onChange, placeholder, type='text', hint, required=false, disabled=false, rows }:{
  label:string; value:string; onChange:(v:string)=>void; placeholder?:string; type?:string
  hint?:string; required?:boolean; disabled?:boolean; rows?:number
}) {
  const base = 'w-full px-3.5 py-2.5 rounded-xl border bg-white dark:bg-[#141210] text-[13px] text-stone-800 dark:text-stone-100 placeholder-stone-300 dark:placeholder-stone-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed'
  const border = 'border-stone-200/80 dark:border-stone-700/50 hover:border-[#2FAF8F]/35 focus:border-[#2FAF8F]/60 focus:ring-2 focus:ring-[#2FAF8F]/20 focus:outline-none'
  return (
    <div>
      <label className="block text-[10.5px] font-semibold uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1.5 leading-none">
        {label}{required && <span className="text-rose-400 ml-1">*</span>}
      </label>
      {rows ? (
        <textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
          disabled={disabled} rows={rows}
          className={`${base} ${border} resize-none`} />
      ) : (
        <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
          disabled={disabled}
          className={`${base} ${border}`} />
      )}
      {hint && <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-1.5 leading-snug">{hint}</p>}
    </div>
  )
}

// Row item in lists
function ItemRow({ children, actions }:{ children:React.ReactNode; actions:React.ReactNode }) {
  return (
    <div className="group flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800/20 transition-colors">
      <div className="flex-1 min-w-0">{children}</div>
      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        {actions}
      </div>
    </div>
  )
}

function ActionBtn({ onClick, variant }:{ onClick:()=>void; variant:'edit'|'delete' }) {
  return (
    <button
      onClick={onClick}
      className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-all ${
        variant==='edit'
          ? 'border-stone-200/70 dark:border-stone-700/40 text-stone-400 hover:text-[#2FAF8F] hover:border-[#2FAF8F]/40 hover:bg-[#2FAF8F]/8'
          : 'border-stone-200/70 dark:border-stone-700/40 text-stone-400 hover:text-rose-500 hover:border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/20'
      }`}
    >
      {variant==='edit' ? <IcoEdit/> : <IcoTrash/>}
    </button>
  )
}

function AddButton({ onClick, label }:{ onClick:()=>void; label:string }) {
  return (
    <button
      onClick={onClick}
      className="mt-3 w-full h-10 flex items-center justify-center gap-2 rounded-xl border border-dashed border-stone-200 dark:border-stone-700/50 text-[12.5px] font-medium text-stone-400 dark:text-stone-500 hover:border-[#2FAF8F]/50 hover:text-[#2FAF8F] hover:bg-[#2FAF8F]/5 transition-all"
    >
      <IcoPlus cls="w-3.5 h-3.5" />{label}
    </button>
  )
}

// SlideOver panel
function SlideOver({ open, title, onClose, onSave, saveLabel='Guardar', children }:{
  open:boolean; title:string; onClose:()=>void; onSave:()=>void; saveLabel?:string; children:React.ReactNode
}) {
  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/20 dark:bg-black/40 backdrop-blur-[2px] transition-opacity ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      />
      {/* Panel */}
      <div
        className={`fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-white dark:bg-[#0f0d0c] border-l border-stone-200/70 dark:border-stone-800/60 shadow-2xl flex flex-col transition-transform duration-300 ease-[cubic-bezier(.16,1,.3,1)] ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 dark:border-stone-800/50 shrink-0">
          <h3 className="text-[14px] font-semibold text-stone-800 dark:text-stone-100">{title}</h3>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors">
            <IcoX/>
          </button>
        </div>
        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">{children}</div>
        {/* Footer */}
        <div className="flex items-center gap-3 px-5 py-4 border-t border-stone-100 dark:border-stone-800/50 shrink-0">
          <button onClick={onClose} className="flex-1 h-9 rounded-xl text-[12.5px] font-medium border border-stone-200/80 dark:border-stone-700/50 text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800/40 transition-all">
            Cancelar
          </button>
          <button onClick={onSave} className="flex-1 h-9 rounded-xl text-[12.5px] font-semibold bg-[#2FAF8F] hover:bg-[#259d7f] text-white transition-all shadow-sm shadow-[#2FAF8F]/20 active:scale-[0.97]">
            {saveLabel}
          </button>
        </div>
      </div>
    </>
  )
}

// Confirm dialog (inline, not window.confirm)
interface ConfirmState { open:boolean; title:string; msg:string; onOk:()=>void }
function ConfirmDialog({ state, onCancel }:{ state:ConfirmState; onCancel:()=>void }) {
  if (!state.open) return null
  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/20 dark:bg-black/50 backdrop-blur-[3px]" onClick={onCancel} />
      <div className="relative bg-white dark:bg-[#1a1714] rounded-2xl overflow-hidden shadow-2xl w-full max-w-sm">
        <div className="px-5 pt-5 pb-4">
          <p className="text-[14px] font-semibold text-stone-800 dark:text-stone-100 mb-1">{state.title}</p>
          <p className="text-[12.5px] text-stone-500 dark:text-stone-400 leading-relaxed">{state.msg}</p>
        </div>
        <div className="flex border-t border-stone-100 dark:border-stone-800/50">
          <button onClick={onCancel} className="flex-1 py-3 text-[13px] font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800/40 transition-colors border-r border-stone-100 dark:border-stone-800/50">
            Cancelar
          </button>
          <button onClick={state.onOk} className="flex-1 py-3 text-[13px] font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors">
            Eliminar
          </button>
        </div>
      </div>
    </div>
  )
}

// Toast
function Toast({ visible }:{ visible:boolean }) {
  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-70 flex items-center gap-2.5 h-10 px-4 rounded-full bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-[12.5px] font-medium shadow-lg transition-all duration-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
      <div className="w-4 h-4 rounded-full bg-[#2FAF8F] flex items-center justify-center shrink-0">
        <IcoCheck cls="w-2.5 h-2.5 text-white" />
      </div>
      Cambios guardados correctamente
    </div>
  )
}

// Select
function FieldSelect({ label, value, onChange, children }:{
  label:string; value:string; onChange:(v:string)=>void; children:React.ReactNode
}) {
  return (
    <div>
      <label className="block text-[10.5px] font-semibold uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1.5 leading-none">{label}</label>
      <div className="relative">
        <select
          value={value} onChange={e=>onChange(e.target.value)}
          className="w-full appearance-none px-3.5 py-2.5 pr-9 rounded-xl border border-stone-200/80 dark:border-stone-700/50 bg-white dark:bg-[#141210] text-[13px] text-stone-800 dark:text-stone-100 hover:border-[#2FAF8F]/35 focus:border-[#2FAF8F]/60 focus:ring-2 focus:ring-[#2FAF8F]/20 focus:outline-none transition-all"
        >
          {children}
        </select>
        <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
      </div>
    </div>
  )
}

// Role label helper
function roleLabel(r:UserRole) {
  return { mvz_titular:'MVZ Titular', mvz_asociado:'MVZ Asociado', admin_clinica:'Admin Clínica', auditor_inspector:'Auditor / Inspector' }[r]
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id:'sec-basic', label:'Informacion personal' },
  { id:'sec-esp',   label:'Especialidades' },
  { id:'sec-form',  label:'Formacionn academica' },
  { id:'sec-exp',   label:'Experiencia' },
  { id:'sec-cert',  label:'Certificaciones' },
  { id:'sec-cli',   label:'Clientes' },
  { id:'sec-svc',   label:'Servicios' },
  { id:'sec-kpi',   label:'Indicadores' },
  { id:'sec-ctc',   label:'Contacto' },
]

export default function PerfilMVZEdit() {
  const navigate = useNavigate()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [role] = useState<UserRole>('mvz_titular')
  const perm = PERMS[role]

  const [isSaving,  setIsSaving]  = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [activeNav, setActiveNav] = useState('sec-basic')
  const [confirm, setConfirm]     = useState<ConfirmState>({ open:false, title:'', msg:'', onOk:()=>{} })

  // SlideOver panels
  const [estudioPanel,   setEstudioPanel]   = useState(false)
  const [expPanel,       setExpPanel]       = useState(false)
  const [certPanel,      setCertPanel]      = useState(false)
  const [clientePanel,   setClientePanel]   = useState(false)
  const [servicioPanel,  setServicioPanel]  = useState(false)

  // Editing items (null = new)
  const [editEstudio,  setEditEstudio]  = useState<EstudioItem|null>(null)
  const [editExp,      setEditExp]      = useState<ExpItem|null>(null)
  const [editCert,     setEditCert]     = useState<CertItem|null>(null)
  const [editCliente,  setEditCliente]  = useState<ClienteItem|null>(null)
  const [editServicio, setEditServicio] = useState<ServicioItem|null>(null)

  // Temp slide-over state
  const [tmpEstudio,  setTmpEstudio]  = useState<EstudioItem>({ id:'', grado:'', institucion:'', periodo:'', tipo:'licenciatura' })
  const [tmpExp,      setTmpExp]      = useState<ExpItem>({ id:'', cargo:'', empresa:'', periodo:'', descripcion:'', activo:false })
  const [tmpCert,     setTmpCert]     = useState<CertItem>({ id:'', nombre:'', vence:'', estado:'vigente' })
  const [tmpCliente,  setTmpCliente]  = useState<ClienteItem>({ id:'', nombre:'', municipio:'', cabezas:'', tipo:'' })
  const [tmpServicio, setTmpServicio] = useState<ServicioItem>({ id:'', label:'', precio:'' })

  const [especialidades, setEspecialidades] = useState<string[]>([
    'Bovinos de Carne','Producción Intensiva','Sanidad Preventiva','Diagnóstico Clínico',
    'Nutrición Animal','Bienestar Animal','Certificación para Exportación','Reproducción Bovina',
    'Enfermedades Infecciosas','Parasitología','Farmacología Veterinaria',
  ])
  const [newEsp, setNewEsp] = useState('')

  const [form, setForm] = useState<Form>({
    nombre:'Dr. Alejandro Vega Morales', titulo:'Médico Veterinario Zootecnista',
    ubicacion:'Chihuahua, México', cedula:'4872310',
    universidad:'Universidad Autónoma de Chihuahua (UACH)', anioEgreso:'2004', aniosExp:'21',
    descripcion:'Médico Veterinario Zootecnista especializado en bovinos de carne y producción intensiva. Amplia experiencia en sanidad preventiva, diagnóstico clínico, nutrición animal y programas de bienestar animal para exportación. Consultor certificado ante SENASICA y acreditado para emisión de certificados zoosanitarios internacionales.',
    celular:'+52 614 555 7890', email:'dr.vega@mvz-norte.mx', sitioWeb:'www.mvz-norte.mx',
    disponibilidad:'Lun–Sáb: 7:00–18:00', diagnosticoAcertado:'96', clientesContrato:'72',
    certsAprobados:'99', visitasMes:'48', certsEmitidos:'124',
  })

  const [estudios, setEstudios] = useState<EstudioItem[]>([
    { id:'1', grado:'Médico Veterinario Zootecnista', institucion:'UACH', periodo:'1999 – 2004', tipo:'licenciatura' },
    { id:'2', grado:'Maestría en Producción Animal', institucion:'UNAM', periodo:'2005 – 2007', tipo:'maestria' },
    { id:'3', grado:'Diplomado en Bienestar Animal y Exportación', institucion:'FMVZ-UNAM / SENASICA', periodo:'2012', tipo:'diplomado' },
    { id:'4', grado:'Certificación Trazabilidad Ganadera (SINIIGA)', institucion:'SAGARPA / SENASICA', periodo:'2015', tipo:'diplomado' },
  ])
  const [experiencias, setExperiencias] = useState<ExpItem[]>([
    { id:'1', cargo:'Consultor Veterinario Independiente', empresa:'Consultoría Vega MVZ', periodo:'2010 – Presente', descripcion:'Consultoría a productores ganaderos del norte de México en sanidad, nutrición y certificación para exportación.', activo:true },
    { id:'2', cargo:'Médico Veterinario de Planta', empresa:'Exportadora Ganadera del Norte S.A. de C.V.', periodo:'2007 – 2010', descripcion:'Responsable del área de sanidad animal, certificación zoosanitaria y normativas de exportación.', activo:false },
    { id:'3', cargo:'Veterinario de Campo', empresa:'Unión Ganadera Regional de Chihuahua', periodo:'2004 – 2007', descripcion:'Atención a socios ganaderos, campañas de vacunación estatales y programas de salud herd.', activo:false },
  ])
  const [certificaciones, setCertificaciones] = useState<CertItem[]>([
    { id:'1', nombre:'SENASICA — Médico Acreditado', vence:'Dic 2026', estado:'vigente' },
    { id:'2', nombre:'Certificador Zoosanitario Internacional', vence:'Jun 2026', estado:'vigente' },
    { id:'3', nombre:'USDA / APHIS — Acreditado MX', vence:'Mar 2026', estado:'por-vencer' },
    { id:'4', nombre:'Bienestar Animal NOM-051', vence:'Sep 2026', estado:'vigente' },
    { id:'5', nombre:'SINIIGA Trazabilidad', vence:'Permanente', estado:'vigente' },
  ])
  const [clientes, setClientes] = useState<ClienteItem[]>([
    { id:'1', nombre:'Rancho El Búfalo Dorado', municipio:'Durango, Dgo.', cabezas:'1,450', tipo:'Engorda' },
    { id:'2', nombre:'Ganadera del Bravo', municipio:'Cd. Juárez, Chih.', cabezas:'3,100', tipo:'Ciclo Completo' },
    { id:'3', nombre:'Rancho Los Álamos', municipio:'Chihuahua, Chih.', cabezas:'2,400', tipo:'Exportación' },
    { id:'4', nombre:'Productores Norte S.C.', municipio:'Delicias, Chih.', cabezas:'5,200', tipo:'Engorda' },
  ])
  const [servicios, setServicios] = useState<ServicioItem[]>([
    { id:'1', label:'Consulta a domicilio', precio:'$1,200 / visita' },
    { id:'2', label:'Certificado zoosanitario', precio:'$450 / lote' },
    { id:'3', label:'Protocolo vacunación', precio:'Desde $8,000' },
    { id:'4', label:'Diagnóstico laboratorial', precio:'Desde $600' },
    { id:'5', label:'Asesoría nutricional', precio:'$3,500 / mes' },
    { id:'6', label:'Revisión pre-embarque', precio:'$2,800 / lote' },
  ])

  const makeSnapshot = () => JSON.stringify({
    form, especialidades, estudios, experiencias, certificaciones, clientes, servicios
  })
  const [savedSnapshot, setSavedSnapshot] = useState(() => makeSnapshot())
  const hasChanges = makeSnapshot() !== savedSnapshot

  const set = (k:keyof Form) => (v:string) => setForm(p=>({...p,[k]:v}))

  // ── Open helpers ──
  const openEstudio = (item?:EstudioItem) => {
    const e = item ?? { id:'', grado:'', institucion:'', periodo:'', tipo:'licenciatura' as const }
    setEditEstudio(item||null); setTmpEstudio(e); setEstudioPanel(true)
  }
  const openExp = (item?:ExpItem) => {
    const e = item ?? { id:'', cargo:'', empresa:'', periodo:'', descripcion:'', activo:false }
    setEditExp(item||null); setTmpExp(e); setExpPanel(true)
  }
  const openCert = (item?:CertItem) => {
    const e = item ?? { id:'', nombre:'', vence:'', estado:'vigente' as const }
    setEditCert(item||null); setTmpCert(e); setCertPanel(true)
  }
  const openCliente = (item?:ClienteItem) => {
    const e = item ?? { id:'', nombre:'', municipio:'', cabezas:'', tipo:'' }
    setEditCliente(item||null); setTmpCliente(e); setClientePanel(true)
  }
  const openServicio = (item?:ServicioItem) => {
    const e = item ?? { id:'', label:'', precio:'' }
    setEditServicio(item||null); setTmpServicio(e); setServicioPanel(true)
  }

  // ── Save helpers ──
  const saveEstudio = () => {
    const item = { ...tmpEstudio, id: editEstudio ? editEstudio.id : Date.now().toString() }
    setEstudios(p => editEstudio ? p.map(x=>x.id===item.id?item:x) : [...p, item])
    setEstudioPanel(false)
  }
  const saveExp = () => {
    const item = { ...tmpExp, id: editExp ? editExp.id : Date.now().toString() }
    setExperiencias(p => editExp ? p.map(x=>x.id===item.id?item:x) : [...p, item])
    setExpPanel(false)
  }
  const saveCert = () => {
    const item = { ...tmpCert, id: editCert ? editCert.id : Date.now().toString() }
    setCertificaciones(p => editCert ? p.map(x=>x.id===item.id?item:x) : [...p, item])
    setCertPanel(false)
  }
  const saveCliente = () => {
    const item = { ...tmpCliente, id: editCliente ? editCliente.id : Date.now().toString() }
    setClientes(p => editCliente ? p.map(x=>x.id===item.id?item:x) : [...p, item])
    setClientePanel(false)
  }
  const saveServicio = () => {
    const item = { ...tmpServicio, id: editServicio ? editServicio.id : Date.now().toString() }
    setServicios(p => editServicio ? p.map(x=>x.id===item.id?item:x) : [...p, item])
    setServicioPanel(false)
  }

  // ── Delete helpers ──
  const askDelete = (title:string, msg:string, onOk:()=>void) =>
    setConfirm({ open:true, title, msg, onOk: () => { onOk(); setConfirm(p=>({...p,open:false})) } })

  // ── Save / Cancel ──
  const handleSave = async () => {
    setIsSaving(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const uid = session?.user?.id
      if (!uid) throw new Error('Sin sesión')

      const { error } = await supabase
        .from('mvz_extended_profiles')
        .upsert({
          user_id:              uid,
          bio:                  form.descripcion         || null,
          titulo:               form.titulo              || null,
          ubicacion:            form.ubicacion           || null,
          cedula:               form.cedula              || null,
          universidad:          form.universidad         || null,
          anio_egreso:          form.anioEgreso          ? parseInt(form.anioEgreso)          : null,
          anios_exp:            form.aniosExp            ? parseInt(form.aniosExp)            : null,
          celular:              form.celular             || null,
          email_contact:        form.email               || null,
          sitio_web:            form.sitioWeb            || null,
          disponibilidad:       form.disponibilidad      || null,
          diagnostico_acertado: form.diagnosticoAcertado ? parseInt(form.diagnosticoAcertado) : null,
          clientes_contrato:    form.clientesContrato    ? parseInt(form.clientesContrato)    : null,
          certs_aprobados:      form.certsAprobados      ? parseInt(form.certsAprobados)      : null,
          visitas_mes:          form.visitasMes          ? parseInt(form.visitasMes)          : null,
          certs_emitidos:       form.certsEmitidos       ? parseInt(form.certsEmitidos)       : null,
          especialidades,
          estudios,
          experiencias,
          certificaciones,
          clientes,
          servicios,
          updated_at:           new Date().toISOString(),
        }, { onConflict: 'user_id' })

      if (error) throw error

      invalidatePerfilMVZCache()
      setSavedSnapshot(makeSnapshot())
      setShowToast(true)
      setTimeout(() => { setShowToast(false); navigate('/perfil') }, 2200)
    } catch (e: unknown) {
      console.error('Error al guardar perfil MVZ:', e)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    if (!hasChanges) { navigate('/perfil'); return }
    askDelete('¿Descartar cambios?', 'Los cambios no guardados se perderán.', () => navigate('/perfil'))
  }

  const cancelConfirm = () => setConfirm(p=>({...p,open:false}))

  // ── Tipo badges ──
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const handler = () => {
      const scrollTop = el.scrollTop + 120
      let active = NAV_ITEMS[0].id
      for (const n of NAV_ITEMS) {
        const section = document.getElementById(n.id)
        if (section && section.offsetTop <= scrollTop) active = n.id
      }
      setActiveNav(active)
    }
    handler()
    el.addEventListener('scroll', handler, { passive:true })
    return () => el.removeEventListener('scroll', handler)
  }, [])

  const scrollTo = (id:string) => {
    const section = document.getElementById(id)
    const container = scrollRef.current
    if (section && container) {
      container.scrollTo({ top: section.offsetTop - 90, behavior:'smooth' })
    }
  }

  const tipoBg = { licenciatura:'bg-teal-600', maestria:'bg-violet-600', diplomado:'bg-amber-500' }
  const tipoLbl = { licenciatura:'Lic.', maestria:'Mtra.', diplomado:'Dip.' }
  const certDot = { vigente:'bg-[#2FAF8F]', 'por-vencer':'bg-amber-400', vencido:'bg-rose-400' }
  const certChip = {
    vigente: 'text-[#2FAF8F] bg-[#2FAF8F]/8 border-[#2FAF8F]/20',
    'por-vencer': 'text-amber-500 bg-amber-50 dark:bg-amber-950/20 border-amber-200/40',
    vencido: 'text-rose-500 bg-rose-50 dark:bg-rose-950/20 border-rose-200/40',
  }
  const certLbl = { vigente:'Vigente', 'por-vencer':'Por vencer', vencido:'Vencido' }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600&display=swap');
        .mve, .mve * { -webkit-font-smoothing:antialiased; font-family:'Geist',system-ui,sans-serif; }
        .mve-s { font-family:'Instrument Serif',Georgia,serif; }
        .mve *:focus, .mve *:focus-visible { outline:none !important; }
        .mve::-webkit-scrollbar { width:3px; }
        .mve::-webkit-scrollbar-thumb { background:#e7e5e4; border-radius:999px; }
        .dark .mve::-webkit-scrollbar-thumb { background:#3c3836; }
        .mve { scrollbar-width:thin; scrollbar-color:#e7e5e4 transparent; }
      `}</style>

      <div className="h-full flex flex-col overflow-hidden bg-[#fafaf9] dark:bg-[#0c0a09]">

        {/* ── STICKY HEADER ───────────────────────────────── */}
        <div className="sticky top-0 z-30 bg-white/80 dark:bg-[#0c0a09]/80 backdrop-blur-xl border-b border-stone-200/70 dark:border-stone-800/50 h-15 flex items-center px-5 md:px-8">
          <button
            onClick={handleCancel}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800/60 transition-colors mr-3 shrink-0"
          >
            <IcoArrow cls="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-400 dark:text-stone-500 leading-none mb-0.5">{roleLabel(role)}</p>
            <h1 className="mve-s italic text-[17px] text-stone-900 dark:text-stone-50 leading-none tracking-[-0.01em] truncate">Editar perfil MVZ</h1>
          </div>
          <div className="flex items-center gap-2.5 ml-3">
            <button
              onClick={handleCancel}
              className="hidden sm:flex h-8 px-3.5 rounded-xl text-[12.5px] font-medium border border-stone-200/80 dark:border-stone-700/50 text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800/40 items-center transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || !hasChanges}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl text-[12.5px] font-semibold bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 hover:bg-stone-700 dark:hover:bg-white active:scale-[0.96] transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSaving ? <IcoSpin cls="w-3.5 h-3.5" /> : <IcoSave cls="w-3.5 h-3.5" />}
              <span>{isSaving ? 'Guardando…' : 'Guardar cambios'}</span>
            </button>
          </div>
        </div>

        {/* ── FORM BODY ────────────────────────────────────── */}
        <div className="flex flex-1 overflow-hidden">
          <aside className="hidden lg:flex flex-col w-56 shrink-0 border-r border-stone-100 dark:border-stone-800/50 py-6 gap-0.5 overflow-y-auto px-3">
            {NAV_ITEMS.map(n => (
              <button
                key={n.id}
                onClick={() => scrollTo(n.id)}
                className={[
                  'text-left px-3 py-2 rounded-xl text-[12px] transition-all',
                  activeNav === n.id
                    ? 'bg-stone-100 dark:bg-stone-800/60 text-stone-800 dark:text-stone-100 font-semibold'
                    : 'text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 font-medium',
                ].join(' ')}
              >
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
                  Rol: <span className="font-medium text-stone-600 dark:text-stone-300">{roleLabel(role)}</span>
                </p>
              </div>
            </div>
          </aside>

          <div ref={scrollRef} className="mve flex-1 overflow-y-auto">
            <div className="px-5 md:px-8 py-8">

          {/* ── Información personal ── */}
          <Section id="sec-basic" title="Información personal" icon={<IcoPerson/>} locked={!perm.basicInfo}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <Field label="Nombre completo" value={form.nombre}    onChange={set('nombre')}    placeholder="Dr. Alejandro Vega Morales" required disabled={!perm.basicInfo} />
              <Field label="Título profesional" value={form.titulo} onChange={set('titulo')}    placeholder="Médico Veterinario Zootecnista" disabled={!perm.basicInfo} />
              <Field label="Ubicación"        value={form.ubicacion} onChange={set('ubicacion')} placeholder="Chihuahua, México" required disabled={!perm.basicInfo} />
              <Field label="Cédula profesional" value={form.cedula} onChange={set('cedula')}    placeholder="4872310" disabled={!perm.basicInfo} />
              <Field label="Universidad de egreso" value={form.universidad} onChange={set('universidad')} placeholder="UACH" disabled={!perm.basicInfo} />
              <Field label="Año de egreso" value={form.anioEgreso} onChange={set('anioEgreso')} type="number" placeholder="2004" disabled={!perm.basicInfo} />
              <Field label="Años de experiencia" value={form.aniosExp} onChange={set('aniosExp')} type="number" placeholder="21" disabled={!perm.basicInfo} />
            </div>
            <Field label="Descripción profesional" value={form.descripcion} onChange={set('descripcion')} placeholder="Describe tu perfil, especialidades y enfoque profesional…" rows={4} disabled={!perm.basicInfo} />
          </Section>

          {/* ── Especialidades ── */}
          <Section id="sec-esp" title="Áreas de especialización" icon={<IcoShield/>} locked={!perm.especialidades}>
            <div className="flex flex-wrap gap-2 mb-4">
              {especialidades.map(tag => (
                <span key={tag} className="inline-flex items-center gap-1.5 h-7 pl-3 pr-2 rounded-full text-[11.5px] font-medium text-[#2FAF8F] bg-[#2FAF8F]/8 dark:bg-[#2FAF8F]/12 border border-[#2FAF8F]/20">
                  {tag}
                  {perm.especialidades && (
                    <button
                      onClick={() => setEspecialidades(p=>p.filter(e=>e!==tag))}
                      className="w-4 h-4 rounded-full flex items-center justify-center text-[#2FAF8F]/60 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all"
                    >
                      <IcoX cls="w-2.5 h-2.5" />
                    </button>
                  )}
                </span>
              ))}
            </div>
            {perm.especialidades && (
              <div className="flex gap-2">
                <input
                  type="text" value={newEsp} onChange={e=>setNewEsp(e.target.value)}
                  onKeyDown={e=>{ if(e.key==='Enter'){ e.preventDefault(); const t=newEsp.trim(); if(t&&!especialidades.includes(t)){ setEspecialidades(p=>[...p,t]); setNewEsp('') } } }}
                  placeholder="Agregar especialidad — Enter para añadir"
                  className="flex-1 px-3.5 py-2.5 rounded-xl text-[13px] border border-stone-200/80 dark:border-stone-700/50 bg-white dark:bg-[#141210] text-stone-800 dark:text-stone-100 placeholder-stone-300 dark:placeholder-stone-600 hover:border-[#2FAF8F]/35 focus:border-[#2FAF8F]/60 focus:ring-2 focus:ring-[#2FAF8F]/20 focus:outline-none transition-all"
                />
                <button
                  onClick={() => { const t=newEsp.trim(); if(t&&!especialidades.includes(t)){ setEspecialidades(p=>[...p,t]); setNewEsp('') } }}
                  className="h-10 px-4 rounded-xl text-[12.5px] font-semibold bg-[#2FAF8F] hover:bg-[#259d7f] text-white transition-all flex items-center gap-1.5 shrink-0"
                >
                  <IcoPlus cls="w-3.5 h-3.5" /><span className="hidden sm:block">Añadir</span>
                </button>
              </div>
            )}
          </Section>

          {/* ── Formación académica ── */}
          <Section id="sec-form" title="Formación académica" icon={<IcoBook/>} locked={!perm.formacion}>
            <div className="divide-y divide-stone-100 dark:divide-stone-800/50 -mx-1">
              {estudios.map(e => (
                <ItemRow key={e.id} actions={<>
                  <ActionBtn onClick={()=>openEstudio(e)} variant="edit" />
                  <ActionBtn onClick={()=>askDelete('¿Eliminar estudio?','Esta acción no se puede deshacer.',()=>setEstudios(p=>p.filter(x=>x.id!==e.id)))} variant="delete" />
                </>}>
                  <div className="flex items-start gap-3">
                    <span className={`mt-0.5 inline-flex items-center justify-center w-8 h-8 rounded-lg text-[9px] font-bold text-white shrink-0 ${tipoBg[e.tipo]}`}>{tipoLbl[e.tipo]}</span>
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-stone-800 dark:text-stone-100 leading-snug">{e.grado}</p>
                      <p className="text-[11.5px] text-stone-400 dark:text-stone-500">{e.institucion} · {e.periodo}</p>
                    </div>
                  </div>
                </ItemRow>
              ))}
            </div>
            {perm.formacion && <AddButton onClick={()=>openEstudio()} label="Agregar estudio" />}
          </Section>

          {/* ── Experiencia profesional ── */}
          <Section id="sec-exp" title="Experiencia profesional" icon={<IcoBrief/>} locked={!perm.experiencia}>
            <div className="divide-y divide-stone-100 dark:divide-stone-800/50 -mx-1">
              {experiencias.map(e => (
                <ItemRow key={e.id} actions={<>
                  <ActionBtn onClick={()=>openExp(e)} variant="edit" />
                  <ActionBtn onClick={()=>askDelete('¿Eliminar experiencia?','Esta acción no se puede deshacer.',()=>setExperiencias(p=>p.filter(x=>x.id!==e.id)))} variant="delete" />
                </>}>
                  <div className="flex items-start gap-3">
                    <div className={`mt-2 w-2 h-2 rounded-full shrink-0 border-2 ${e.activo ? 'bg-[#2FAF8F] border-[#2FAF8F]' : 'bg-transparent border-stone-300 dark:border-stone-600'}`} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-[13px] font-medium text-stone-800 dark:text-stone-100 leading-snug truncate">{e.cargo}</p>
                        {e.activo && <span className="inline-flex items-center h-4 px-1.5 rounded-full text-[9px] font-semibold text-[#2FAF8F] bg-[#2FAF8F]/8 border border-[#2FAF8F]/20 shrink-0">Actual</span>}
                      </div>
                      <p className="text-[11.5px] font-medium text-[#2FAF8F] truncate">{e.empresa}</p>
                      <p className="text-[11px] text-stone-400 dark:text-stone-500">{e.periodo}</p>
                    </div>
                  </div>
                </ItemRow>
              ))}
            </div>
            {perm.experiencia && <AddButton onClick={()=>openExp()} label="Agregar experiencia" />}
          </Section>

          {/* ── Certificaciones ── */}
          <Section id="sec-cert" title="Certificaciones y habilitaciones" icon={<IcoBadge/>} locked={!perm.certificaciones}>
            <div className="divide-y divide-stone-100 dark:divide-stone-800/50 -mx-1">
              {certificaciones.map(c => (
                <ItemRow key={c.id} actions={<>
                  <ActionBtn onClick={()=>openCert(c)} variant="edit" />
                  <ActionBtn onClick={()=>askDelete('¿Eliminar certificación?','Esta acción no se puede deshacer.',()=>setCertificaciones(p=>p.filter(x=>x.id!==c.id)))} variant="delete" />
                </>}>
                  <div className="flex items-center gap-3">
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${certDot[c.estado]}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-stone-800 dark:text-stone-100 leading-snug truncate">{c.nombre}</p>
                      <p className="text-[11px] text-stone-400 dark:text-stone-500">Vence: {c.vence}</p>
                    </div>
                    <span className={`inline-flex items-center h-5 px-2 rounded-full text-[10px] font-semibold border shrink-0 ${certChip[c.estado]}`}>{certLbl[c.estado]}</span>
                  </div>
                </ItemRow>
              ))}
            </div>
            {perm.certificaciones && <AddButton onClick={()=>openCert()} label="Agregar certificación" />}
          </Section>

          {/* ── Clientes ganaderos ── */}
          <Section id="sec-cli" title="Clientes ganaderos activos" icon={<IcoHome/>} locked={!perm.clientes}>
            <div className="divide-y divide-stone-100 dark:divide-stone-800/50 -mx-1">
              {clientes.map(c => (
                <ItemRow key={c.id} actions={<>
                  <ActionBtn onClick={()=>openCliente(c)} variant="edit" />
                  <ActionBtn onClick={()=>askDelete('¿Eliminar cliente?','Esta acción no se puede deshacer.',()=>setClientes(p=>p.filter(x=>x.id!==c.id)))} variant="delete" />
                </>}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-stone-800/50 flex items-center justify-center text-stone-400 dark:text-stone-500 shrink-0">
                      <IcoHome cls="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-stone-800 dark:text-stone-100 leading-snug truncate">{c.nombre}</p>
                      <p className="text-[11.5px] text-stone-400 dark:text-stone-500">{c.municipio} · {c.cabezas} cab. · {c.tipo}</p>
                    </div>
                  </div>
                </ItemRow>
              ))}
            </div>
            {perm.clientes && <AddButton onClick={()=>openCliente()} label="Agregar cliente" />}
          </Section>

          {/* ── Servicios ── */}
          <Section id="sec-svc" title="Servicios profesionales" icon={<IcoDollar/>} locked={!perm.servicios}>
            <div className="divide-y divide-stone-100 dark:divide-stone-800/50 -mx-1">
              {servicios.map(s => (
                <ItemRow key={s.id} actions={<>
                  <ActionBtn onClick={()=>openServicio(s)} variant="edit" />
                  <ActionBtn onClick={()=>askDelete('¿Eliminar servicio?','Esta acción no se puede deshacer.',()=>setServicios(p=>p.filter(x=>x.id!==s.id)))} variant="delete" />
                </>}>
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-[13px] font-medium text-stone-800 dark:text-stone-100 leading-snug">{s.label}</p>
                    <span className="text-[13px] font-semibold text-[#2FAF8F] shrink-0">{s.precio}</span>
                  </div>
                </ItemRow>
              ))}
            </div>
            {perm.servicios && <AddButton onClick={()=>openServicio()} label="Agregar servicio" />}
          </Section>

          {/* ── Indicadores ── */}
          <Section id="sec-kpi" title="Indicadores de práctica" icon={<IcoTrend/>} locked={!perm.indicadores}>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <Field label="Diagnóstico acertado (%)"     value={form.diagnosticoAcertado} onChange={set('diagnosticoAcertado')} type="number" placeholder="96"  disabled={!perm.indicadores} />
              <Field label="Clientes con contrato (%)"    value={form.clientesContrato}    onChange={set('clientesContrato')}    type="number" placeholder="72"  disabled={!perm.indicadores} />
              <Field label="Certs. sin rechazo (%)"       value={form.certsAprobados}      onChange={set('certsAprobados')}      type="number" placeholder="99"  disabled={!perm.indicadores} />
              <Field label="Visitas / mes"                value={form.visitasMes}          onChange={set('visitasMes')}          type="number" placeholder="48"  disabled={!perm.indicadores} />
              <Field label="Certificados emitidos (acum.)" value={form.certsEmitidos}     onChange={set('certsEmitidos')}       type="number" placeholder="124" disabled={!perm.indicadores} />
            </div>
          </Section>

          {/* ── Contacto ── */}
          <Section id="sec-ctc" title="Contacto" icon={<IcoPhone/>} locked={!perm.contacto}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Celular / WhatsApp" value={form.celular}        onChange={set('celular')}        type="tel"   placeholder="+52 614 555 7890"     disabled={!perm.contacto} />
              <Field label="Email"              value={form.email}          onChange={set('email')}          type="email" placeholder="dr.vega@mvz-norte.mx" disabled={!perm.contacto} />
              <Field label="Sitio web"          value={form.sitioWeb}       onChange={set('sitioWeb')}                    placeholder="www.mvz-norte.mx"      disabled={!perm.contacto} />
              <Field label="Disponibilidad"     value={form.disponibilidad} onChange={set('disponibilidad')}              placeholder="Lun–Sáb: 7:00–18:00"   disabled={!perm.contacto} />
            </div>
          </Section>

          {/* ── Permisos banner ── */}
          <div className="mb-10 flex items-start gap-3 px-4 py-4 rounded-2xl bg-[#2FAF8F]/6 border border-[#2FAF8F]/15">
            <IcoInfo cls="w-4 h-4 text-[#2FAF8F] shrink-0 mt-0.5" />
            <p className="text-[12px] text-stone-500 dark:text-stone-400 leading-relaxed">
              Editando como <span className="font-semibold text-stone-700 dark:text-stone-200">{roleLabel(role)}</span>.
              Las secciones bloqueadas están marcadas con el ícono de candado y no pueden modificarse con este rol.
            </p>
          </div>
        </div>
      </div>

      {/* ── SLIDE-OVERS ─────────────────────────────────────── */}

      </div>
    </div>

      {/* Estudio */}
      <SlideOver open={estudioPanel} title={editEstudio ? 'Editar estudio' : 'Agregar estudio'} onClose={()=>setEstudioPanel(false)} onSave={saveEstudio}>
        <Field label="Grado / Título" value={tmpEstudio.grado} onChange={v=>setTmpEstudio(p=>({...p,grado:v}))} placeholder="Ej: Maestría en Producción Animal" required />
        <Field label="Institución" value={tmpEstudio.institucion} onChange={v=>setTmpEstudio(p=>({...p,institucion:v}))} placeholder="Ej: UNAM" />
        <Field label="Período" value={tmpEstudio.periodo} onChange={v=>setTmpEstudio(p=>({...p,periodo:v}))} placeholder="Ej: 2005 – 2007" />
        <FieldSelect label="Tipo" value={tmpEstudio.tipo} onChange={v=>setTmpEstudio(p=>({...p,tipo:v as EstudioItem['tipo']}))}>
          <option value="licenciatura">Licenciatura</option>
          <option value="maestria">Maestría / Especialidad</option>
          <option value="diplomado">Diplomado / Certificación</option>
        </FieldSelect>
      </SlideOver>

      {/* Experiencia */}
      <SlideOver open={expPanel} title={editExp ? 'Editar experiencia' : 'Agregar experiencia'} onClose={()=>setExpPanel(false)} onSave={saveExp}>
        <Field label="Cargo / Puesto" value={tmpExp.cargo} onChange={v=>setTmpExp(p=>({...p,cargo:v}))} placeholder="Ej: Consultor Veterinario" required />
        <Field label="Empresa / Organización" value={tmpExp.empresa} onChange={v=>setTmpExp(p=>({...p,empresa:v}))} placeholder="Ej: Consultoría Vega MVZ" />
        <Field label="Período" value={tmpExp.periodo} onChange={v=>setTmpExp(p=>({...p,periodo:v}))} placeholder="Ej: 2010 – Presente" />
        <Field label="Descripción" value={tmpExp.descripcion} onChange={v=>setTmpExp(p=>({...p,descripcion:v}))} placeholder="Describe las responsabilidades del cargo…" rows={3} />
        <label className="flex items-center gap-3 px-4 py-3 rounded-xl bg-stone-50 dark:bg-stone-800/30 cursor-pointer">
          <input type="checkbox" checked={tmpExp.activo} onChange={e=>setTmpExp(p=>({...p,activo:e.target.checked}))} className="w-4 h-4 accent-[#2FAF8F]" />
          <span className="text-[12.5px] font-medium text-stone-700 dark:text-stone-200">Puesto actual (trabajo vigente)</span>
        </label>
      </SlideOver>

      {/* Certificación */}
      <SlideOver open={certPanel} title={editCert ? 'Editar certificación' : 'Agregar certificación'} onClose={()=>setCertPanel(false)} onSave={saveCert}>
        <Field label="Nombre de la certificación" value={tmpCert.nombre} onChange={v=>setTmpCert(p=>({...p,nombre:v}))} placeholder="Ej: SENASICA — Médico Acreditado" required />
        <Field label="Fecha de vencimiento" value={tmpCert.vence} onChange={v=>setTmpCert(p=>({...p,vence:v}))} placeholder="Ej: Dic 2026 o Permanente" />
        <FieldSelect label="Estado" value={tmpCert.estado} onChange={v=>setTmpCert(p=>({...p,estado:v as CertItem['estado']}))}>
          <option value="vigente">Vigente</option>
          <option value="por-vencer">Por vencer</option>
          <option value="vencido">Vencido</option>
        </FieldSelect>
      </SlideOver>

      {/* Cliente */}
      <SlideOver open={clientePanel} title={editCliente ? 'Editar cliente' : 'Agregar cliente'} onClose={()=>setClientePanel(false)} onSave={saveCliente}>
        <Field label="Nombre del rancho / empresa" value={tmpCliente.nombre} onChange={v=>setTmpCliente(p=>({...p,nombre:v}))} placeholder="Ej: Rancho El Búfalo Dorado" required />
        <Field label="Municipio y estado" value={tmpCliente.municipio} onChange={v=>setTmpCliente(p=>({...p,municipio:v}))} placeholder="Ej: Durango, Dgo." />
        <Field label="Cabezas de ganado" value={tmpCliente.cabezas} onChange={v=>setTmpCliente(p=>({...p,cabezas:v}))} placeholder="Ej: 1,450" />
        <Field label="Tipo de operación" value={tmpCliente.tipo} onChange={v=>setTmpCliente(p=>({...p,tipo:v}))} placeholder="Ej: Engorda, Exportación, Cría" />
      </SlideOver>

      {/* Servicio */}
      <SlideOver open={servicioPanel} title={editServicio ? 'Editar servicio' : 'Agregar servicio'} onClose={()=>setServicioPanel(false)} onSave={saveServicio}>
        <Field label="Nombre del servicio" value={tmpServicio.label} onChange={v=>setTmpServicio(p=>({...p,label:v}))} placeholder="Ej: Consulta a domicilio" required />
        <Field label="Precio / Tarifa" value={tmpServicio.precio} onChange={v=>setTmpServicio(p=>({...p,precio:v}))} placeholder="Ej: $1,200 / visita" required />
      </SlideOver>

      {/* ── CONFIRM + TOAST ──────────────────────────────────── */}
      <ConfirmDialog state={confirm} onCancel={cancelConfirm} />
      <Toast visible={showToast} />
    </>
  )
}