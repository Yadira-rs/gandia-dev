/**
 * PassportArtifact — reescrito completo
 * ✅ Solo clases Tailwind — sin inline style con colores
 * ✅ dark: variants en todo
 * ✅ Todas las interacciones funcionales
 * ✅ Diseño fiel al compañero (index.tsx + style.css)
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import type { PassportData } from './mockData'

// ─── TIPOS ────────────────────────────────────────────────────────────────────

interface Pasaporte {
  id:              string
  arete:           string
  nombre:          string
  raza:            string
  sexo:            'M' | 'H'
  fechaNacimiento: string
  peso:            number
  estado:          'activo' | 'pendiente' | 'vencido'
  corral:          string
  propietario:     string
  upp:             string
  vacunas:         number
  vacunasTotal:    number
  exportable:      boolean
}

type Vista    = 'grid' | 'lista'
type Filtro   = 'todos' | 'activo' | 'pendiente' | 'vencido'
type OrdenKey = 'arete' | 'nombre' | 'fechaNacimiento' | 'peso'

// ─── MOCK DATA ────────────────────────────────────────────────────────────────

const MOCK: Pasaporte[] = [
  { id:'1',  arete:'MX-001-2023', nombre:'Tornado',    raza:'Angus',     sexo:'M', fechaNacimiento:'2021-03-15', peso:480, estado:'activo',   corral:'C-01', propietario:'Jorge Paredes', upp:'UPP-12345-MX', vacunas:5, vacunasTotal:5, exportable:true  },
  { id:'2',  arete:'MX-002-2023', nombre:'Luna',       raza:'Hereford',  sexo:'H', fechaNacimiento:'2020-07-22', peso:410, estado:'activo',   corral:'C-01', propietario:'Jorge Paredes', upp:'UPP-12345-MX', vacunas:5, vacunasTotal:5, exportable:true  },
  { id:'3',  arete:'MX-003-2023', nombre:'Relámpago',  raza:'Angus',     sexo:'M', fechaNacimiento:'2022-01-10', peso:350, estado:'pendiente',corral:'C-02', propietario:'Jorge Paredes', upp:'UPP-12345-MX', vacunas:3, vacunasTotal:5, exportable:false },
  { id:'4',  arete:'MX-004-2023', nombre:'Estrella',   raza:'Charolais', sexo:'H', fechaNacimiento:'2019-11-05', peso:520, estado:'activo',   corral:'C-02', propietario:'Jorge Paredes', upp:'UPP-12345-MX', vacunas:5, vacunasTotal:5, exportable:true  },
  { id:'5',  arete:'MX-005-2023', nombre:'Fuego',      raza:'Brahman',   sexo:'M', fechaNacimiento:'2021-09-18', peso:460, estado:'vencido',  corral:'C-03', propietario:'Jorge Paredes', upp:'UPP-12345-MX', vacunas:2, vacunasTotal:5, exportable:false },
  { id:'6',  arete:'MX-006-2023', nombre:'Nube',       raza:'Hereford',  sexo:'H', fechaNacimiento:'2020-04-30', peso:390, estado:'activo',   corral:'C-03', propietario:'Jorge Paredes', upp:'UPP-12345-MX', vacunas:5, vacunasTotal:5, exportable:true  },
  { id:'7',  arete:'MX-007-2023', nombre:'Toro Negro', raza:'Angus',     sexo:'M', fechaNacimiento:'2018-06-12', peso:610, estado:'activo',   corral:'C-04', propietario:'Jorge Paredes', upp:'UPP-12345-MX', vacunas:5, vacunasTotal:5, exportable:true  },
  { id:'8',  arete:'MX-008-2023', nombre:'Paloma',     raza:'Simmental', sexo:'H', fechaNacimiento:'2022-08-25', peso:320, estado:'pendiente',corral:'C-04', propietario:'Jorge Paredes', upp:'UPP-12345-MX', vacunas:4, vacunasTotal:5, exportable:false },
  { id:'9',  arete:'MX-009-2023', nombre:'Rayo',       raza:'Brahman',   sexo:'M', fechaNacimiento:'2021-12-03', peso:430, estado:'activo',   corral:'C-01', propietario:'Jorge Paredes', upp:'UPP-12345-MX', vacunas:5, vacunasTotal:5, exportable:true  },
  { id:'10', arete:'MX-010-2023', nombre:'Canela',     raza:'Charolais', sexo:'H', fechaNacimiento:'2020-02-14', peso:445, estado:'vencido',  corral:'C-02', propietario:'Jorge Paredes', upp:'UPP-12345-MX', vacunas:1, vacunasTotal:5, exportable:false },
  { id:'11', arete:'MX-011-2023', nombre:'Huracán',    raza:'Angus',     sexo:'M', fechaNacimiento:'2019-05-20', peso:580, estado:'activo',   corral:'C-03', propietario:'Jorge Paredes', upp:'UPP-12345-MX', vacunas:5, vacunasTotal:5, exportable:true  },
  { id:'12', arete:'MX-012-2023', nombre:'Rosa',       raza:'Hereford',  sexo:'H', fechaNacimiento:'2022-10-08', peso:295, estado:'pendiente',corral:'C-04', propietario:'Jorge Paredes', upp:'UPP-12345-MX', vacunas:3, vacunasTotal:5, exportable:false },
]

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const fmtFecha = (iso: string) =>
  new Date(iso).toLocaleDateString('es-MX', { day:'2-digit', month:'short', year:'numeric' })

const calcEdad = (iso: string) => {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / (1000*60*60*24*30.44))
  return m >= 12 ? `${Math.floor(m/12)} año${Math.floor(m/12)>1?'s':''}` : `${m} meses`
}

function vacunaBarColor(pct: number) {
  if (pct === 100) return 'bg-gradient-to-r from-green-400 to-green-600'
  if (pct >= 60)   return 'bg-gradient-to-r from-amber-400 to-amber-600'
  return 'bg-gradient-to-r from-red-400 to-red-600'
}

// ─── BADGE ────────────────────────────────────────────────────────────────────

const ESTADO_CLS: Record<string, string> = {
  activo:   'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-700/50',
  pendiente:'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-700/50',
  vencido:  'bg-red-100   dark:bg-red-900/30   text-red-700   dark:text-red-400   border border-red-200   dark:border-red-700/50',
}

function EstadoBadge({ estado }: { estado: string }) {
  return (
    <span className={`inline-flex shrink-0 text-[10.5px] font-bold px-2.5 py-[3px] rounded-full ${ESTADO_CLS[estado]}`}>
      {estado.charAt(0).toUpperCase() + estado.slice(1)}
    </span>
  )
}

// ─── SVG ICONS ────────────────────────────────────────────────────────────────

const SvgCow = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
    <path d="M4.5 12.5c0-4.1 3.4-7.5 7.5-7.5s7.5 3.4 7.5 7.5v.5a1.5 1.5 0 0 1-3 0v-.5a4.5 4.5 0 1 0-9 0v.5a1.5 1.5 0 0 1-3 0v-.5z"/>
    <circle cx="12" cy="13" r="2"/>
  </svg>
)
const SvgX = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-3.5 h-3.5">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)
const SvgSearch = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-[16px] h-[16px] shrink-0">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
)
const SvgGrid = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
    <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
  </svg>
)
const SvgList = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4">
    <line x1="8" y1="6"  x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
    <line x1="3" y1="6"  x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
)
const SvgBack = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
)
const SvgExpand = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-3.5 h-3.5">
    <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/>
    <line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
  </svg>
)
const SvgCompress = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-3.5 h-3.5">
    <polyline points="8 3 3 3 3 8"/><polyline points="21 8 21 3 16 3"/>
    <polyline points="3 16 3 21 8 21"/><polyline points="16 21 21 21 21 16"/>
  </svg>
)
const SvgPlus = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-4 h-4">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
)
const SvgEye = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-3.5 h-3.5">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
)
const SvgEdit = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-3.5 h-3.5">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
)
const SvgCheck = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-3 h-3">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)
const SvgSyringe = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-3.5 h-3.5">
    <path d="m18 2 4 4"/><path d="m17 7 3-3"/><path d="M19 9 8.7 19.3c-1 1-2.5 1-3.4 0l-.6-.6c-1-1-1-2.5 0-3.4L15 5"/>
    <path d="m9 11 4 4"/><path d="m5 19-3 3"/><path d="m14 4 6 6"/>
  </svg>
)
const SvgBarChart = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-3.5 h-3.5">
    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6"  y1="20" x2="6"  y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
  </svg>
)
const SvgMap = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-3.5 h-3.5">
    <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
    <line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/>
  </svg>
)
const SvgScale = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-3.5 h-3.5">
    <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/>
    <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/>
    <path d="M7 21h10"/><path d="M12 3v18"/>
    <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/>
  </svg>
)
const SvgFileText = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-3.5 h-3.5">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
)
const SvgEmptyDoc = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="w-9 h-9">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
)

// ─── PROPS ────────────────────────────────────────────────────────────────────

interface Props {
  data:               PassportData
  onClose:            () => void
  fullscreen:         boolean
  onToggleFullscreen: () => void
}

// ─── MODAL DETALLE ────────────────────────────────────────────────────────────

function ModalDetalle({ p, onClose }: { p: Pasaporte; onClose: () => void }) {
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [onClose])

  const pct = (p.vacunas / p.vacunasTotal) * 100

  const infoFields = [
    { k:'Raza',       v:p.raza },
    { k:'Sexo',       v:p.sexo === 'M' ? 'Macho' : 'Hembra' },
    { k:'Edad',       v:calcEdad(p.fechaNacimiento) },
    { k:'Nacimiento', v:fmtFecha(p.fechaNacimiento) },
    { k:'Peso',       v:`${p.peso} kg` },
    { k:'Corral',     v:p.corral },
  ]

  return (
    <div
      className="fixed inset-0 z-[400] flex items-center justify-center p-4 sm:p-6"
      style={{ background:'rgba(0,0,0,0.55)', backdropFilter:'blur(6px)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[540px] max-h-[90vh] flex flex-col rounded-[18px] border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
        style={{ animation:'modalIn .3s cubic-bezier(.34,1.56,.64,1) both' }}
      >
        {/* Header */}
        <div className="flex items-center gap-3.5 px-6 py-5 border-b border-stone-100 dark:border-stone-800 bg-white dark:bg-stone-900 shrink-0">
          <div className="w-[52px] h-[52px] rounded-full bg-stone-700 dark:bg-stone-600 flex items-center justify-center text-white shrink-0">
            <div className="w-7 h-7"><SvgCow /></div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[20px] font-extrabold text-stone-900 dark:text-stone-50 tracking-tight truncate">{p.nombre}</p>
            <p className="font-mono text-[13px] text-stone-400 dark:text-stone-500 mt-0.5">{p.arete}</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-[10px] border border-stone-200 dark:border-stone-700 bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 flex items-center justify-center transition-all hover:rotate-90 duration-200 shrink-0"
          >
            <SvgX />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5 bg-white dark:bg-stone-900">

          {/* Info general */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-stone-400 dark:text-stone-500 mb-3">Información General</p>
            <div className="grid grid-cols-2 gap-2.5">
              {infoFields.map(f => (
                <div key={f.k} className="flex flex-col gap-0.5 px-3 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-100 dark:border-stone-700">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.04em] text-stone-400 dark:text-stone-500">{f.k}</p>
                  <p className="text-[13px] font-semibold text-stone-900 dark:text-stone-100">{f.v}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Trazabilidad */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-stone-400 dark:text-stone-500 mb-3">Trazabilidad</p>
            <div className="grid grid-cols-2 gap-2.5">
              {[{ k:'UPP', v:p.upp }, { k:'Propietario', v:p.propietario }].map(f => (
                <div key={f.k} className="flex flex-col gap-0.5 px-3 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-100 dark:border-stone-700">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.04em] text-stone-400 dark:text-stone-500">{f.k}</p>
                  <p className="text-[13px] font-semibold text-stone-900 dark:text-stone-100">{f.v}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Vacunación */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-stone-400 dark:text-stone-500 mb-3">Vacunación</p>
            <div className="px-3 py-3 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-100 dark:border-stone-700 flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <p className="text-[12px] font-semibold uppercase tracking-[0.04em] text-stone-400 dark:text-stone-500">Esquema completo</p>
                <p className="text-[13px] font-bold text-stone-900 dark:text-stone-100">{p.vacunas}/{p.vacunasTotal}</p>
              </div>
              <div className="h-2 rounded-full bg-stone-200 dark:bg-stone-700 overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-700 ${vacunaBarColor(pct)}`} style={{ width:`${pct}%` }} />
              </div>
            </div>
          </div>

          {/* Badges */}
          <div className="flex gap-2 flex-wrap">
            <EstadoBadge estado={p.estado} />
            {p.exportable && (
              <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700/50 px-2.5 py-[3px] rounded-full">
                <SvgCheck /> Exportable
              </span>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2.5 px-6 py-4 border-t border-stone-100 dark:border-stone-800 bg-white dark:bg-stone-900 shrink-0">
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold text-stone-700 dark:text-stone-200 bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:bg-stone-200 dark:hover:bg-stone-700 transition-all hover:-translate-y-px"
          >
            Cerrar
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold text-white bg-stone-700 dark:bg-stone-600 hover:bg-stone-800 dark:hover:bg-stone-500 transition-all hover:-translate-y-px shadow-sm"
          >
            <SvgEdit /> Editar Pasaporte
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── TARJETA GRID ─────────────────────────────────────────────────────────────

function TarjetaPasaporte({ p, onClick }: { p: Pasaporte; onClick: () => void }) {
  const pct = (p.vacunas / p.vacunasTotal) * 100

  return (
    <div
      onClick={onClick}
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onClick()}
      role="button"
      className="flex flex-col gap-3.5 p-[18px] rounded-[14px] border border-stone-200 dark:border-stone-700/60 bg-white dark:bg-stone-800/60 cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-stone-200/60 dark:hover:shadow-stone-900/60 hover:border-stone-300 dark:hover:border-stone-600 focus:outline-none focus:ring-2 focus:ring-[#2FAF8F]/40"
      style={{ animation:'cardIn .4s both' }}
    >
      {/* Top */}
      <div className="flex items-center gap-3">
        <div className="w-[46px] h-[46px] min-w-[46px] rounded-full bg-stone-100 dark:bg-stone-700 text-stone-500 dark:text-stone-400 flex items-center justify-center relative shrink-0">
          <div className="w-[26px] h-[26px]"><SvgCow /></div>
          <span className={`absolute bottom-[1px] right-[1px] w-[11px] h-[11px] rounded-full border-2 border-white dark:border-stone-800 ${p.sexo === 'M' ? 'bg-blue-500' : 'bg-pink-500'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-bold text-stone-900 dark:text-stone-50 truncate">{p.nombre}</p>
          <p className="font-mono text-[12px] text-stone-400 dark:text-stone-500 mt-0.5">{p.arete}</p>
        </div>
        <EstadoBadge estado={p.estado} />
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        {[
          { k:'Raza',   v:p.raza },
          { k:'Peso',   v:`${p.peso} kg` },
          { k:'Edad',   v:calcEdad(p.fechaNacimiento) },
          { k:'Corral', v:p.corral },
        ].map(f => (
          <div key={f.k}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.04em] text-stone-400 dark:text-stone-500">{f.k}</p>
            <p className="text-[13px] font-semibold text-stone-800 dark:text-stone-100 mt-0.5">{f.v}</p>
          </div>
        ))}
      </div>

      {/* Vacunación */}
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-[0.04em] text-stone-400 dark:text-stone-500">Vacunación</p>
          <p className="text-[12px] font-bold text-stone-700 dark:text-stone-300">{p.vacunas}/{p.vacunasTotal}</p>
        </div>
        <div className="h-1.5 rounded-full bg-stone-100 dark:bg-stone-700 overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-700 ${vacunaBarColor(pct)}`} style={{ width:`${pct}%` }} />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-stone-100 dark:border-stone-700/50">
        {p.exportable ? (
          <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700/50 px-2.5 py-[3px] rounded-full">
            <SvgCheck /> Exportable
          </span>
        ) : (
          <span className="text-[10.5px] font-semibold text-stone-400 dark:text-stone-500 bg-stone-100 dark:bg-stone-700/60 border border-stone-200 dark:border-stone-700 px-2.5 py-[3px] rounded-full">
            No exportable
          </span>
        )}
        <button
          onClick={e => { e.stopPropagation(); onClick() }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-600 bg-white dark:bg-stone-700 text-stone-600 dark:text-stone-300 text-[12px] font-semibold hover:bg-stone-700 dark:hover:bg-stone-500 hover:text-white dark:hover:text-white hover:border-transparent transition-all duration-200 hover:-translate-y-px"
        >
          <SvgEye /> Ver detalle
        </button>
      </div>
    </div>
  )
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

export default function PassportArtifact({ onClose, fullscreen, onToggleFullscreen }: Props) {
  const [vista,        setVista]        = useState<Vista>('grid')
  const [busqueda,     setBusqueda]     = useState('')
  const [filtro,       setFiltro]       = useState<Filtro>('todos')
  const [filtroRaza,   setFiltroRaza]   = useState('todas')
  const [ordenCampo,   setOrdenCampo]   = useState<OrdenKey>('arete')
  const [ordenAsc,     setOrdenAsc]     = useState(true)
  const [seleccionado, setSeleccionado] = useState<Pasaporte | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  // Ctrl+K → foco en búsqueda
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); searchRef.current?.focus() }
    }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [])

  const toggleOrden = useCallback((campo: OrdenKey) => {
    if (ordenCampo === campo) setOrdenAsc(a => !a)
    else { setOrdenCampo(campo); setOrdenAsc(true) }
  }, [ordenCampo])

  const razas = ['todas', ...Array.from(new Set(MOCK.map(p => p.raza)))]

  const filtrados = MOCK
    .filter(p => {
      const q = busqueda.toLowerCase()
      return (
        (!q || p.nombre.toLowerCase().includes(q) || p.arete.toLowerCase().includes(q) || p.raza.toLowerCase().includes(q)) &&
        (filtro === 'todos' || p.estado === filtro) &&
        (filtroRaza === 'todas' || p.raza === filtroRaza)
      )
    })
    .sort((a, b) => {
      let va: string | number = a[ordenCampo]
      let vb: string | number = b[ordenCampo]
      if (typeof va === 'string') va = va.toLowerCase()
      if (typeof vb === 'string') vb = vb.toLowerCase()
      return ordenAsc ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1)
    })

  const stats = {
    total:       MOCK.length,
    activos:     MOCK.filter(p => p.estado === 'activo').length,
    pendientes:  MOCK.filter(p => p.estado === 'pendiente').length,
    vencidos:    MOCK.filter(p => p.estado === 'vencido').length,
    exportables: MOCK.filter(p => p.exportable).length,
  }

  const STATS_CONFIG = [
    { key:'total',       label:'Total',       val:stats.total,
      chip:'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700',
      num:'text-stone-900 dark:text-stone-50' },
    { key:'activos',     label:'Activos',     val:stats.activos,
      chip:'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700/40',
      num:'text-green-700 dark:text-green-400' },
    { key:'pendientes',  label:'Pendientes',  val:stats.pendientes,
      chip:'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700/40',
      num:'text-yellow-700 dark:text-yellow-400' },
    { key:'vencidos',    label:'Vencidos',    val:stats.vencidos,
      chip:'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700/40',
      num:'text-red-700 dark:text-red-400' },
    { key:'exportables', label:'Exportables', val:stats.exportables,
      chip:'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700/40',
      num:'text-blue-700 dark:text-blue-400' },
  ]

  const SUGERENCIAS = [
    { icon:<SvgFileText />, label:'Crear pasaporte',   alert:false },
    { icon:<SvgSyringe  />, label:'Agendar vacunas',   alert:true  },
    { icon:<SvgBarChart />, label:'Exportar reporte',  alert:false },
    { icon:<SvgMap      />, label:'Ver trazabilidad',  alert:false },
    { icon:<SvgScale    />, label:'Actualizar pesos',  alert:false },
  ]

  return (
    <>
      {/* Keyframes — solo animaciones, no colores */}
      <style>{`
        @keyframes cardIn  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes modalIn { from{opacity:0;transform:scale(.92) translateY(16px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes partIn  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .part-in { animation: partIn .35s cubic-bezier(.16,1,.3,1) both; }
        .pa-scroll::-webkit-scrollbar { width:5px; }
        .pa-scroll::-webkit-scrollbar-thumb { background:#d6d3d1; border-radius:3px; }
        .dark .pa-scroll::-webkit-scrollbar-thumb { background:#44403c; }
        .pa-scroll::-webkit-scrollbar-track { background:transparent; }
      `}</style>

      <div className="part-in flex flex-col h-full bg-stone-50 dark:bg-stone-950">

        {/* ── HEADER ── */}
        <div className="shrink-0 flex items-center gap-3 px-4 sm:px-5 py-3 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900">
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-[10px] border border-stone-200 dark:border-stone-700 bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200 dark:hover:bg-stone-700 transition-all"
          >
            <SvgBack />
          </button>

          <div className="flex-1 min-w-0">
            <p className="font-mono text-[8.5px] text-stone-400 dark:text-stone-500 uppercase tracking-[2px]">Gandia · SENASICA</p>
            <p className="text-[14px] font-bold text-stone-900 dark:text-stone-50 leading-tight">Mis Pasaportes</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onToggleFullscreen}
              title={fullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
              className="w-8 h-8 flex items-center justify-center rounded-[10px] border border-stone-200 dark:border-stone-700 bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200 dark:hover:bg-stone-700 transition-all"
            >
              {fullscreen ? <SvgCompress /> : <SvgExpand />}
            </button>

            <button className="flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-[13px] font-semibold text-white bg-stone-700 dark:bg-stone-600 hover:bg-stone-800 dark:hover:bg-stone-500 transition-all hover:-translate-y-px shadow-sm">
              <SvgPlus /> <span className="hidden sm:inline">Nuevo Pasaporte</span>
            </button>
          </div>
        </div>

        {/* ── BODY ── */}
        <div className="pa-scroll flex-1 overflow-y-auto px-4 sm:px-5 py-4 flex flex-col gap-4">

          {/* STATS */}
          <div className="flex items-center gap-2 flex-wrap">
            {STATS_CONFIG.map(s => (
              <div
                key={s.key}
                className={`flex flex-col items-start px-3.5 py-2.5 rounded-xl border min-w-[70px] cursor-default transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${s.chip}`}
              >
                <span className={`text-[22px] font-extrabold leading-[1.1] tracking-tight ${s.num}`}>{s.val}</span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-stone-400 dark:text-stone-500 mt-0.5">{s.label}</span>
              </div>
            ))}
          </div>

          {/* TOOLBAR */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Search */}
            <div className="relative flex-1 min-w-[180px]">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 dark:text-stone-500 pointer-events-none">
                <SvgSearch />
              </span>
              <input
                ref={searchRef}
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre, arete o raza… (Ctrl+K)"
                className="w-full pl-10 pr-10 py-[11px] rounded-xl text-[14px] text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-600 bg-white dark:bg-stone-800 border-2 border-stone-200 dark:border-stone-700 outline-none focus:border-stone-500 dark:focus:border-stone-500 focus:shadow-[0_0_0_4px_rgba(120,113,108,0.15)] transition-all"
              />
              {busqueda && (
                <button
                  onClick={() => setBusqueda('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md flex items-center justify-center text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 bg-stone-100 dark:bg-stone-700 transition-all"
                >
                  <SvgX />
                </button>
              )}
            </div>

            {/* Selects */}
            <div className="flex gap-2 flex-wrap">
              <select
                value={filtro}
                onChange={e => setFiltro(e.target.value as Filtro)}
                className="pl-3 pr-8 py-[10px] rounded-xl text-[13px] font-medium text-stone-700 dark:text-stone-200 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 outline-none cursor-pointer hover:-translate-y-px transition-all appearance-none focus:border-stone-500 dark:focus:border-stone-500"
              >
                <option value="todos">Todos los estados</option>
                <option value="activo">Activo</option>
                <option value="pendiente">Pendiente</option>
                <option value="vencido">Vencido</option>
              </select>

              <select
                value={filtroRaza}
                onChange={e => setFiltroRaza(e.target.value)}
                className="pl-3 pr-8 py-[10px] rounded-xl text-[13px] font-medium text-stone-700 dark:text-stone-200 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 outline-none cursor-pointer hover:-translate-y-px transition-all appearance-none focus:border-stone-500 dark:focus:border-stone-500"
              >
                {razas.map(r => <option key={r} value={r}>{r === 'todas' ? 'Todas las razas' : r}</option>)}
              </select>
            </div>

            {/* Vista toggle */}
            <div className="flex gap-1 p-1 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-100 dark:bg-stone-800">
              {([['grid', <SvgGrid />], ['lista', <SvgList />]] as [Vista, React.ReactNode][]).map(([v, icon]) => (
                <button
                  key={v}
                  onClick={() => setVista(v)}
                  className={`w-[34px] h-[34px] rounded-lg flex items-center justify-center transition-all duration-150 ${
                    vista === v
                      ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-sm'
                      : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* COUNT */}
          <p className="text-[12px] font-semibold uppercase tracking-[0.05em] text-stone-400 dark:text-stone-500 -mt-1">
            {filtrados.length === MOCK.length
              ? `${filtrados.length} pasaportes`
              : `${filtrados.length} de ${MOCK.length} pasaportes`}
          </p>

          {/* HEADER LISTA */}
          {vista === 'lista' && (
            <div className="hidden sm:grid items-center px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-100 dark:bg-stone-800 text-[11px] font-bold uppercase tracking-[0.05em] text-stone-500 dark:text-stone-400"
              style={{ gridTemplateColumns:'2fr 1.4fr 1.2fr 1.2fr 0.8fr 1fr 1.4fr 0.6fr' }}>
              <span>Animal</span>
              {([
                ['arete','Arete'] as [OrdenKey,string],
                ['nombre','Nombre'] as [OrdenKey,string],
                ['fechaNacimiento','Nacimiento'] as [OrdenKey,string],
                ['peso','Peso'] as [OrdenKey,string],
              ]).map(([k,l]) => (
                <button key={k} onClick={() => toggleOrden(k)}
                  className={`flex items-center gap-0.5 text-left transition-colors hover:text-stone-900 dark:hover:text-stone-100 ${ordenCampo===k ? 'text-stone-800 dark:text-stone-200' : ''}`}>
                  {l} {ordenCampo===k ? (ordenAsc ? '↑' : '↓') : ''}
                </button>
              ))}
              <span>Estado</span>
              <span>Vacunación</span>
              <span></span>
            </div>
          )}

          {/* CONTENIDO */}
          {filtrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-5 text-center">
              <div className="w-[72px] h-[72px] rounded-[18px] bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center justify-center text-stone-400 dark:text-stone-500">
                <SvgEmptyDoc />
              </div>
              <div>
                <p className="text-[20px] font-bold text-stone-900 dark:text-stone-50 mb-2">No se encontraron pasaportes</p>
                <p className="text-[14px] text-stone-500 dark:text-stone-400">Intenta con otros filtros o términos de búsqueda.</p>
              </div>
              <button
                onClick={() => { setBusqueda(''); setFiltro('todos'); setFiltroRaza('todas') }}
                className="px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white bg-stone-700 dark:bg-stone-600 hover:bg-stone-800 dark:hover:bg-stone-500 transition-all hover:-translate-y-px shadow-sm"
              >
                Limpiar filtros
              </button>
            </div>

          ) : vista === 'grid' ? (
            <div className="grid gap-4" style={{ gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))' }}>
              {filtrados.map(p => (
                <TarjetaPasaporte key={p.id} p={p} onClick={() => setSeleccionado(p)} />
              ))}
            </div>

          ) : (
            <div className="flex flex-col gap-1.5">
              {filtrados.map(p => {
                const pct = (p.vacunas / p.vacunasTotal) * 100
                return (
                  <div
                    key={p.id}
                    onClick={() => setSeleccionado(p)}
                    tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && setSeleccionado(p)}
                    role="button"
                    className="grid items-center px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-700/60 bg-white dark:bg-stone-800/60 cursor-pointer transition-all duration-200 hover:translate-x-[3px] hover:border-stone-300 dark:hover:border-stone-600 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2FAF8F]/40"
                    style={{ gridTemplateColumns:'2fr 1.4fr 1.2fr 1.2fr 0.8fr 1fr 1.4fr 0.6fr', animation:'cardIn .3s both' }}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 min-w-[36px] rounded-full bg-stone-100 dark:bg-stone-700 text-stone-500 dark:text-stone-400 flex items-center justify-center relative">
                        <div className="w-5 h-5"><SvgCow /></div>
                        <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-stone-800 ${p.sexo === 'M' ? 'bg-blue-500' : 'bg-pink-500'}`} />
                      </div>
                      <span className="text-[14px] font-bold text-stone-900 dark:text-stone-50">{p.nombre}</span>
                    </div>
                    <span className="font-mono text-[12px] text-stone-500 dark:text-stone-400 font-medium">{p.arete}</span>
                    <span className="text-[13px] font-semibold text-stone-700 dark:text-stone-200">{p.raza}</span>
                    <span className="text-[13px] font-semibold text-stone-700 dark:text-stone-200">{fmtFecha(p.fechaNacimiento)}</span>
                    <span className="text-[13px] font-semibold text-stone-700 dark:text-stone-200">{p.peso} kg</span>
                    <EstadoBadge estado={p.estado} />
                    <div className="flex items-center gap-2 pr-2">
                      <div className="flex-1 h-1.5 rounded-full bg-stone-100 dark:bg-stone-700 overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-700 ${vacunaBarColor(pct)}`} style={{ width:`${pct}%` }} />
                      </div>
                      <span className="font-mono text-[11px] font-bold text-stone-600 dark:text-stone-300 shrink-0">{p.vacunas}/{p.vacunasTotal}</span>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); setSeleccionado(p) }}
                      className="flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-stone-600 bg-white dark:bg-stone-700 text-stone-600 dark:text-stone-300 text-[12px] font-semibold hover:bg-stone-700 dark:hover:bg-stone-500 hover:text-white dark:hover:text-white hover:border-transparent transition-all duration-150"
                    >
                      Ver
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── GANDIA SUGIERE ── */}
        <div className="shrink-0 border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 px-4 sm:px-5 py-3">
          <p className="font-mono text-[9px] text-stone-400 dark:text-stone-500 uppercase tracking-[1px] mb-2">Gandia sugiere</p>
          <div className="flex items-center gap-2 overflow-x-auto pb-0.5" style={{ scrollbarWidth:'none' }}>
            {SUGERENCIAS.map((s, i) => (
              <button
                key={i}
                className={`shrink-0 flex items-center gap-1.5 h-8 px-3 rounded-full text-[12px] font-semibold border transition-all hover:-translate-y-px hover:shadow-sm ${
                  s.alert
                    ? 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700/40 hover:bg-amber-100 dark:hover:bg-amber-900/40'
                    : 'text-stone-600 dark:text-stone-300 bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-700 hover:border-stone-300 dark:hover:border-stone-600'
                }`}
              >
                {s.icon}
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {seleccionado && (
        <ModalDetalle p={seleccionado} onClose={() => setSeleccionado(null)} />
      )}
    </>
  )
}