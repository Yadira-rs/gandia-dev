import { useState, useMemo, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import {
  getMunicipios, getTramitesByMunicipio, getExpediente,
  cambiarEstatus, guardarRevision, seedMunicipiosIfEmpty,
  crearTramite,
} from '../../lib/tramitesService'
import type {
  MunicipioResumen, TramiteUI, EvidenciaUI, EventoUI,
  TramiteEstatus, TramiteTipo,
} from '../../lib/tramitesService'

// ─────────────────────────────────────────────────────────────────────────────
// TIPOS LOCALES
// ─────────────────────────────────────────────────────────────────────────────

type Vista        = 'municipios' | 'bandeja' | 'expediente'
type LayoutMuni   = 'grid' | 'list'
type OrdenBandeja = 'fecha' | 'estatus' | 'tipo'

interface ChecklistItem { id: string; label: string; checked: boolean }
interface HistorialEntry { id: string; fecha: string; revisor: string; observacion: string; checkCount: number; total: number; estatus: TramiteEstatus }

// ─────────────────────────────────────────────────────────────────────────────
// CHECKLIST BASE
// ─────────────────────────────────────────────────────────────────────────────

const CHECKLIST_BASE: ChecklistItem[] = [
  { id:'ch1', label:'Identificación UPP',                  checked:false },
  { id:'ch2', label:'Documentación sanitaria',             checked:false },
  { id:'ch3', label:'Evidencia visual (fotografías)',      checked:false },
  { id:'ch4', label:'Correspondencia animales–documentos', checked:false },
  { id:'ch5', label:'Dictamen MVZ (si aplica)',            checked:false },
]

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const TIPO_LABEL: Record<TramiteTipo, string> = {
  exportacion:'Exportación', movilizacion:'Movilización', regularizacion:'Regularización',
}

function tipoBadgeCls(t: TramiteTipo): string {
  const map: Record<TramiteTipo, string> = {
    exportacion:    'bg-blue-50 dark:bg-blue-950/30 text-blue-500 dark:text-blue-400 border-blue-100 dark:border-blue-900/40',
    movilizacion:   'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/40',
    regularizacion: 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/40',
  }
  return map[t]
}

function estatusCfg(e: TramiteEstatus) {
  const map: Record<TramiteEstatus, { label: string; cls: string; dot: string; step: number }> = {
    en_revision:            { label:'En revisión',       cls:'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-500 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/40', dot:'bg-indigo-400',  step:0 },
    con_observaciones:      { label:'Con observaciones', cls:'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/40',       dot:'bg-amber-400',   step:1 },
    documentacion_completa: { label:'Docs. completa',    cls:'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/40', dot:'bg-emerald-400', step:2 },
  }
  return map[e]
}

function diasDesde(f: string) {
  return Math.floor((Date.now() - new Date(f).getTime()) / 86_400_000)
}

function urgCls(d: number) {
  if (d > 10) return 'text-rose-500'
  if (d > 5)  return 'text-amber-500'
  return 'text-stone-400 dark:text-stone-500'
}

function notaLegal(tipo: TramiteTipo) {
  if (tipo === 'exportacion')    return 'Esta revisión es documental. La certificación final para exportación es competencia exclusiva de las autoridades SENASICA y USDA–APHIS.'
  if (tipo === 'movilizacion')   return 'Esta revisión no sustituye la guía REEMO ni los permisos de tránsito oficiales vigentes.'
  return 'Esta revisión es documental y no constituye autorización ni permiso oficial de regularización.'
}

function siguienteEstatus(e: TramiteEstatus): TramiteEstatus | null {
  const map: Record<TramiteEstatus, TramiteEstatus | null> = {
    en_revision: 'con_observaciones',
    con_observaciones: 'documentacion_completa',
    documentacion_completa: null,
  }
  return map[e]
}

// ─────────────────────────────────────────────────────────────────────────────
// SVG ICONS
// ─────────────────────────────────────────────────────────────────────────────

const sp = { fill:'none', stroke:'currentColor', strokeWidth:'1.6', strokeLinecap:'round' as const, strokeLinejoin:'round' as const }

const I = {
  Map:    () => <svg className="w-4 h-4" viewBox="0 0 24 24" {...sp}><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>,
  File:   () => <svg className="w-4 h-4" viewBox="0 0 24 24" {...sp}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/></svg>,
  Check:  ({ c='w-3.5 h-3.5' }:{c?:string}) => <svg className={c} viewBox="0 0 24 24" {...sp}><polyline points="20 6 9 17 4 12"/></svg>,
  Alert:  () => <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" {...sp}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><circle cx="12" cy="16" r=".5" fill="currentColor"/></svg>,
  Eye:    () => <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" {...sp}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  Dl:     () => <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" {...sp}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  Chev:   () => <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" {...sp}><polyline points="9 18 15 12 9 6"/></svg>,
  ChevD:  () => <svg className="w-3 h-3" viewBox="0 0 24 24" {...sp}><polyline points="6 9 12 15 18 9"/></svg>,
  Save:   () => <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" {...sp}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
  Search: () => <svg className="w-4 h-4" viewBox="0 0 24 24" {...sp}><circle cx="11" cy="11" r="7.5"/><line x1="20.5" y1="20.5" x2="16.1" y2="16.1"/></svg>,
  Grid:   () => <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" {...sp}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
  List:   () => <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" {...sp}><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
  Sort:   () => <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" {...sp}><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="9" y1="18" x2="15" y2="18"/></svg>,
  Clock:  () => <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" {...sp}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Arr:    () => <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" {...sp}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  Send:   () => <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" {...sp}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  PDF:    () => <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" {...sp}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="15" x2="15" y2="15"/><line x1="9" y1="11" x2="15" y2="11"/></svg>,
  X:      () => <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" {...sp}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Multi:  () => <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" {...sp}><polyline points="20 6 9 17 4 12"/><line x1="1" y1="11" x2="6" y2="16"/></svg>,
  Plus:   () => <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" {...sp}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Refresh:() => <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" {...sp}><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
}

// ─────────────────────────────────────────────────────────────────────────────
// ÁTOMOS
// ─────────────────────────────────────────────────────────────────────────────

function Badge({ children, cls }: { children: React.ReactNode; cls: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${cls}`}>
      {children}
    </span>
  )
}

function Crumb({ items }: { items: { label: string; onClick?: () => void }[] }) {
  return (
    <nav className="flex items-center gap-1.5 text-[11.5px] text-stone-400 dark:text-stone-500 mb-6 flex-wrap">
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <I.Chev />}
          {it.onClick
            ? <button onClick={it.onClick} className="hover:text-stone-700 dark:hover:text-stone-200 transition-colors font-medium">{it.label}</button>
            : <span className="text-stone-700 dark:text-stone-200 font-semibold">{it.label}</span>}
        </span>
      ))}
    </nav>
  )
}

function Toast({ msg, onClose }: { msg: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500)
    return () => clearTimeout(t)
  }, [onClose])
  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-300 pointer-events-none">
      <div className="tp-pop flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-stone-900 dark:bg-stone-50 text-white dark:text-stone-900 text-[13px] font-medium shadow-2xl pointer-events-auto">
        <I.Check c="w-3.5 h-3.5 text-[#2FAF8F]" />
        {msg}
        <button onClick={onClose} className="ml-2 opacity-40 hover:opacity-100 transition-opacity"><I.X /></button>
      </div>
    </div>
  )
}

function Spinner() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-3">
      <div className="w-6 h-6 rounded-full border-2 border-stone-200 dark:border-stone-700 border-t-[#2FAF8F] animate-spin" />
      <p className="text-[12px] text-stone-400 dark:text-stone-500">Cargando…</p>
    </div>
  )
}

function ErrorMsg({ msg, onRetry }: { msg: string; onRetry: () => void }) {
  return (
    <div className="py-16 text-center">
      <p className="text-[13px] text-rose-500 mb-3">{msg}</p>
      <button onClick={onRetry} className="flex items-center gap-1.5 mx-auto text-[12px] text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 transition-colors">
        <I.Refresh /> Reintentar
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// STEPPER
// ─────────────────────────────────────────────────────────────────────────────

function Stepper({ estatus, onAdvance }: { estatus: TramiteEstatus; onAdvance: (s: TramiteEstatus) => void }) {
  const steps: { key: TramiteEstatus; label: string }[] = [
    { key:'en_revision',            label:'En revisión'    },
    { key:'con_observaciones',      label:'Observaciones'  },
    { key:'documentacion_completa', label:'Docs. completa' },
  ]
  const cur = estatusCfg(estatus).step
  const sig = siguienteEstatus(estatus)

  return (
    <div>
      <div className="flex items-center mb-5">
        {steps.map((s, i) => {
          const done   = i < cur
          const active = i === cur
          return (
            <div key={s.key} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                  done   ? 'bg-[#2FAF8F] border-[#2FAF8F]' :
                  active ? 'bg-white dark:bg-[#1c1917] border-[#2FAF8F] shadow-[0_0_0_4px_rgba(47,175,143,0.12)]' :
                           'bg-white dark:bg-[#1c1917] border-stone-200 dark:border-stone-700 opacity-40'
                }`}>
                  {done ? <I.Check c="w-3 h-3 text-white" /> : <span className={`w-2 h-2 rounded-full ${active ? 'bg-[#2FAF8F]' : 'bg-stone-300 dark:bg-stone-600'}`} />}
                </div>
                <span className={`text-[10.5px] font-medium mt-1.5 whitespace-nowrap ${active ? 'text-[#2FAF8F]' : done ? 'text-stone-500 dark:text-stone-400' : 'text-stone-300 dark:text-stone-600'}`}>
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={`h-0.5 flex-1 mx-1 mb-5 rounded-full transition-colors duration-500 ${i < cur ? 'bg-[#2FAF8F]' : 'bg-stone-200 dark:bg-stone-700/50'}`} />
              )}
            </div>
          )
        })}
      </div>
      {sig && (
        <button onClick={() => onAdvance(sig)}
          className="flex items-center gap-2 text-[12px] font-semibold text-[#2FAF8F] hover:text-[#1a9070] transition-colors">
          <I.Arr /> Avanzar a "{estatusCfg(sig).label}"
        </button>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MODAL CONFIRMACIÓN
// ─────────────────────────────────────────────────────────────────────────────

function ModalConfirm({ tramite, sig, onOk, onCancel }: {
  tramite: TramiteUI; sig: TramiteEstatus; onOk: () => void; onCancel: () => void
}) {
  const cfg = estatusCfg(sig)
  return (
    <div className="fixed inset-0 z-200 flex items-center justify-center p-4">
      <div className="tp-fade absolute inset-0 bg-black/25 backdrop-blur-md" onClick={onCancel} />
      <div className="relative w-full max-w-90 bg-white dark:bg-[#1c1917] rounded-[22px] shadow-2xl border border-stone-200/70 dark:border-stone-800 overflow-hidden">
        <div className="h-0.5 bg-linear-to-r from-[#2FAF8F] to-[#1a9070]" />
        <div className="p-6">
          <p className="text-[10.5px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-widest mb-3">Cambio de estado</p>
          <h3 className="text-[15px] font-bold text-stone-900 dark:text-stone-50 tracking-tight mb-1.5">
            Mover a <span className={cfg.step === 2 ? 'text-emerald-500' : cfg.step === 1 ? 'text-amber-500' : 'text-indigo-500'}>{cfg.label}</span>
          </h3>
          <p className="text-[13px] text-stone-500 dark:text-stone-400 leading-relaxed">
            Este cambio quedará registrado en el historial del expediente <strong className="text-stone-700 dark:text-stone-300">{tramite.upp}</strong>. No puede deshacerse.
          </p>
          <div className="flex gap-2 mt-5">
            <button onClick={onCancel} className="flex-1 h-9 rounded-xl text-[13px] font-medium text-stone-600 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 active:scale-[0.98] transition-all">Cancelar</button>
            <button onClick={onOk}     className="flex-1 h-9 rounded-xl text-[13px] font-medium text-white bg-[#2FAF8F] hover:bg-[#27a07f] active:scale-[0.98] transition-all shadow-sm">Confirmar</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MODAL NUEVO TRÁMITE
// ─────────────────────────────────────────────────────────────────────────────

function ModalNuevoTramite({ municipioId, onClose, onCreado }: {
  municipioId: string; onClose: () => void; onCreado: (id: string) => void
}) {
  const [upp,         setUpp]         = useState('')
  const [tipo,        setTipo]        = useState<TramiteTipo>('exportacion')
  const [numAnimales, setNumAnimales] = useState('')
  const [productor,   setProductor]   = useState('')
  const [saving,      setSaving]      = useState(false)
  const [err,         setErr]         = useState<string | null>(null)

  const submit = async () => {
    if (!upp.trim() || !productor.trim() || !numAnimales) { setErr('Completa todos los campos'); return }
    setSaving(true); setErr(null)
    try {
      // Evitar congelamiento de Supabase SDK leyendo directo de localStorage
      const rawSession = localStorage.getItem('gandia-auth-token')
      let userIdStr = ''
      if (rawSession) {
        const session = JSON.parse(rawSession)
        userIdStr = session?.user?.id || ''
      }
      if (!userIdStr) throw new Error('No se encontró la sesión activa')

      const id = await crearTramite({
        upp: upp.trim(), tipo, numAnimales: parseInt(numAnimales),
        productor: productor.trim(), municipioId, userId: userIdStr,
      })
      onCreado(id)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error al crear trámite')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-200 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/25 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-105 bg-white dark:bg-[#1c1917] rounded-[22px] shadow-2xl border border-stone-200/70 dark:border-stone-800 overflow-hidden">
        <div className="h-0.5 bg-linear-to-r from-[#2FAF8F] to-[#1a9070]" />
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <p className="text-[14px] font-bold text-stone-900 dark:text-stone-50 tracking-tight">Nuevo trámite</p>
            <button onClick={onClose} className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"><I.X /></button>
          </div>

          <div className="space-y-3">
            {/* UPP */}
            <div>
              <label className="text-[11px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-widest block mb-1.5">Número UPP</label>
              <input value={upp} onChange={e => setUpp(e.target.value)} placeholder="UPP-DGO-2024-001"
                className="w-full h-9 px-3 rounded-xl border border-stone-200/80 dark:border-stone-700/50 bg-stone-50 dark:bg-stone-800/40 text-[13px] text-stone-800 dark:text-stone-100 placeholder-stone-300 dark:placeholder-stone-600 focus:border-[#2FAF8F]/50 transition-colors"
                style={{ outline:'none' }}
              />
            </div>

            {/* Tipo */}
            <div>
              <label className="text-[11px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-widest block mb-1.5">Tipo</label>
              <div className="flex gap-1.5">
                {(['exportacion','movilizacion','regularizacion'] as TramiteTipo[]).map(t => (
                  <button key={t} onClick={() => setTipo(t)}
                    className={`flex-1 h-8 rounded-lg text-[11px] font-semibold transition-all ${tipo === t ? 'bg-[#2FAF8F] text-white' : 'border border-stone-200/80 dark:border-stone-700/50 text-stone-500 dark:text-stone-400 hover:border-[#2FAF8F]/50'}`}
                  >{TIPO_LABEL[t]}</button>
                ))}
              </div>
            </div>

            {/* Productor */}
            <div>
              <label className="text-[11px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-widest block mb-1.5">Productor / Razón social</label>
              <input value={productor} onChange={e => setProductor(e.target.value)} placeholder="Rancho Las Ánimas"
                className="w-full h-9 px-3 rounded-xl border border-stone-200/80 dark:border-stone-700/50 bg-stone-50 dark:bg-stone-800/40 text-[13px] text-stone-800 dark:text-stone-100 placeholder-stone-300 dark:placeholder-stone-600 focus:border-[#2FAF8F]/50 transition-colors"
                style={{ outline:'none' }}
              />
            </div>

            {/* Animales */}
            <div>
              <label className="text-[11px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-widest block mb-1.5">Número de animales</label>
              <input value={numAnimales} onChange={e => setNumAnimales(e.target.value.replace(/\D/,''))} placeholder="0" type="number" min="1"
                className="w-full h-9 px-3 rounded-xl border border-stone-200/80 dark:border-stone-700/50 bg-stone-50 dark:bg-stone-800/40 text-[13px] text-stone-800 dark:text-stone-100 placeholder-stone-300 dark:placeholder-stone-600 focus:border-[#2FAF8F]/50 transition-colors"
                style={{ outline:'none' }}
              />
            </div>
          </div>

          {err && <p className="text-[12px] text-rose-500 mt-3">{err}</p>}

          <div className="flex gap-2 mt-5">
            <button onClick={onClose} className="flex-1 h-9 rounded-xl text-[13px] font-medium text-stone-600 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 transition-all">Cancelar</button>
            <button onClick={submit} disabled={saving}
              className="flex-1 h-9 rounded-xl text-[13px] font-medium text-white bg-[#2FAF8F] hover:bg-[#27a07f] disabled:opacity-60 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 shadow-sm">
              {saving ? <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : <I.Plus />}
              {saving ? 'Creando…' : 'Crear trámite'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// TIMELINE
// ─────────────────────────────────────────────────────────────────────────────

function Timeline({ eventos }: { eventos: EventoUI[] }) {
  const iconMap: Record<EventoUI['tipo'], React.ReactNode> = {
    ingreso:   <div className="w-5 h-5 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-400"><I.File /></div>,
    documento: <div className="w-5 h-5 rounded-full bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-blue-400"><I.File /></div>,
    revision:  <div className="w-5 h-5 rounded-full bg-[#2FAF8F]/10 flex items-center justify-center text-[#2FAF8F]"><I.Check c="w-2.5 h-2.5" /></div>,
    estado:    <div className="w-5 h-5 rounded-full bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center text-indigo-400"><I.Arr /></div>,
    alerta:    <div className="w-5 h-5 rounded-full bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center text-amber-400"><I.Alert /></div>,
  }
  if (!eventos.length) return <p className="text-[13px] text-stone-400 dark:text-stone-500 text-center py-8">Sin eventos registrados</p>
  return (
    <div className="relative pl-2.5">
      <div className="absolute left-4.5 top-3 bottom-3 w-px bg-stone-100 dark:bg-stone-800/60" />
      {eventos.map((ev, i) => (
        <div key={ev.id} className="tp-fade flex gap-3 pb-4" style={{ animationDelay:`${i*35}ms` }}>
          <div className="shrink-0 relative z-10 mt-0.5">{iconMap[ev.tipo]}</div>
          <div className="flex-1 min-w-0 pt-0.5">
            <p className="text-[12.5px] text-stone-700 dark:text-stone-200 leading-snug">{ev.descripcion}</p>
            <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-0.5">{ev.actor} · {ev.fecha}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// DOC CARD (evidencias)
// ─────────────────────────────────────────────────────────────────────────────

function DocCard({ ev, onReenvio }: { ev: EvidenciaUI; onReenvio: () => void }) {
  type EstadoKey = EvidenciaUI['estado']
  const cfgMap: Record<EstadoKey, { label: string; cls: string; icon: React.ReactNode; problem: boolean }> = {
    vigente:    { label:'Vigente',    cls:'text-emerald-500', icon:<I.Check c="w-3 h-3"/>, problem:false },
    presente:   { label:'Presente',   cls:'text-blue-500',    icon:<I.Check c="w-3 h-3"/>, problem:false },
    incompleto: { label:'Incompleto', cls:'text-amber-500',   icon:<I.Alert />,             problem:true  },
    ilegible:   { label:'Ilegible',   cls:'text-rose-500',    icon:<I.Alert />,             problem:true  },
    no_vigente: { label:'No vigente', cls:'text-rose-500',    icon:<I.Alert />,             problem:true  },
  }
  const cfg = cfgMap[ev.estado]

  return (
    <div className={`group/doc flex items-start gap-3 p-3.5 rounded-xl border transition-all ${cfg.problem ? 'border-rose-100 dark:border-rose-900/30 bg-rose-50/30 dark:bg-rose-950/10' : 'border-stone-100 dark:border-stone-800/50 bg-white dark:bg-[#1a1714] hover:border-stone-200 dark:hover:border-stone-700/50'}`}>
      <div className={`w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0 ${cfg.problem ? 'bg-rose-100 dark:bg-rose-950/30 text-rose-400' : 'bg-stone-50 dark:bg-stone-800/50 text-stone-400 dark:text-stone-500'}`}>
        <I.File />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[13px] font-semibold text-stone-800 dark:text-stone-100">{ev.nombre}</p>
            <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-0.5">{ev.tipo} · {ev.cargadoPor} · {ev.fechaCarga}</p>
          </div>
          <span className={`flex items-center gap-1 text-[11px] font-semibold shrink-0 ${cfg.cls}`}>{cfg.icon}{cfg.label}</span>
        </div>
        <div className="flex items-center gap-2 mt-2">
          {ev.archivoUrl && (
            <>
              <a href={ev.archivoUrl} target="_blank" rel="noreferrer"
                className="flex items-center gap-1 text-[11px] font-medium text-[#2FAF8F] hover:text-[#1a9070] transition-colors opacity-0 group-hover/doc:opacity-100">
                <I.Eye /> Ver
              </a>
              <a href={ev.archivoUrl} download
                className="flex items-center gap-1 text-[11px] font-medium text-[#2FAF8F] hover:text-[#1a9070] transition-colors opacity-0 group-hover/doc:opacity-100">
                <I.Dl /> Descargar
              </a>
            </>
          )}
          {cfg.problem && (
            <button onClick={onReenvio}
              className="ml-auto flex items-center gap-1 text-[11px] font-semibold text-rose-500 hover:text-rose-600 border border-rose-200 dark:border-rose-800/40 px-2 py-0.5 rounded-lg transition-colors">
              <I.Send /> Solicitar reenvío
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// VISTA: MUNICIPIOS
// ─────────────────────────────────────────────────────────────────────────────

function VistaMunicipios({ onSelect }: { onSelect: (id: string) => void }) {
  const [municipios, setMunicipios] = useState<MunicipioResumen[]>([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState<string | null>(null)
  const [query,      setQuery]      = useState('')
  const [layout,     setLayout]     = useState<LayoutMuni>('grid')
  const [orden,      setOrden]      = useState<'urgencia' | 'activos' | 'nombre'>('urgencia')

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      await seedMunicipiosIfEmpty()
      setMunicipios(await getMunicipios())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar municipios')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const totalActivos = municipios.reduce((a, m) => a + m.tramitesActivos, 0)
  const totalObs     = municipios.reduce((a, m) => a + m.conObservaciones, 0)
  const totalCompletos = municipios.reduce((a, m) => a + m.completos, 0)

  const lista = useMemo(() => {
    const l = municipios.filter(m => m.nombre.toLowerCase().includes(query.toLowerCase()))
    return [...l].sort((a, b) => {
      if (orden === 'urgencia') return (b.conObservaciones * 2 + b.sinRevisar) - (a.conObservaciones * 2 + a.sinRevisar)
      if (orden === 'activos')  return b.tramitesActivos - a.tramitesActivos
      return a.nombre.localeCompare(b.nombre)
    })
  }, [municipios, query, orden])

  if (loading) return <Spinner />
  if (error)   return <ErrorMsg msg={error} onRetry={load} />

  return (
    <div>
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
        {[
          { label:'Trámites activos',  val:totalActivos,   cls:'text-stone-900 dark:text-stone-50'  },
          { label:'Con observaciones', val:totalObs,        cls:'text-amber-500'                     },
          { label:'Completos',         val:totalCompletos,  cls:'text-emerald-500'                   },
          { label:'Municipios',        val:municipios.length, cls:'text-[#2FAF8F]'                   },
        ].map((k, i) => (
          <div key={i} className="tp-fade bg-white dark:bg-[#141210] border border-stone-200/70 dark:border-stone-800/50 rounded-2xl px-5 py-4" style={{ animationDelay:`${i*40}ms` }}>
            <p className="text-[10px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-widest mb-2">{k.label}</p>
            <p className={`text-[30px] font-bold leading-none tracking-tight ${k.cls}`}>{k.val}</p>
          </div>
        ))}
      </div>

      {/* Controles */}
      <div className="flex items-center gap-2 flex-wrap mb-6">
        <div className="flex-1 min-w-45 flex items-center gap-2.5 h-9 px-3 bg-white dark:bg-[#141210] border border-stone-200/80 dark:border-stone-800/60 rounded-xl text-stone-400 dark:text-stone-500 focus-within:border-[#2FAF8F]/50 transition-colors">
          <I.Search />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar municipio…"
            className="flex-1 bg-transparent text-[13px] text-stone-800 dark:text-stone-100 placeholder-stone-300 dark:placeholder-stone-600" style={{ outline:'none' }} />
          {query && <button onClick={() => setQuery('')} className="hover:text-stone-600 transition-colors"><I.X /></button>}
        </div>

        <div className="flex items-center gap-1.5 text-stone-400 dark:text-stone-500">
          <I.Sort />
          <select value={orden} onChange={e => setOrden(e.target.value as typeof orden)}
            className="text-[11.5px] font-medium text-stone-600 dark:text-stone-300 bg-transparent cursor-pointer" style={{ outline:'none', appearance:'none' }}>
            <option value="urgencia">Por urgencia</option>
            <option value="activos">Por activos</option>
            <option value="nombre">Por nombre</option>
          </select>
          <I.ChevD />
        </div>

        <div className="flex items-center gap-0.5 bg-stone-100 dark:bg-stone-800/60 rounded-lg p-0.5">
          {(['grid','list'] as const).map(v => (
            <button key={v} onClick={() => setLayout(v)}
              className={`w-7 h-7 flex items-center justify-center rounded-md transition-all ${layout === v ? 'bg-white dark:bg-stone-700 shadow-sm text-stone-700 dark:text-stone-200' : 'text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-200'}`}
            >{v === 'grid' ? <I.Grid /> : <I.List />}</button>
          ))}
        </div>

        <button onClick={load} className="h-9 w-9 flex items-center justify-center rounded-xl border border-stone-200/80 dark:border-stone-800/60 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors" title="Actualizar">
          <I.Refresh />
        </button>
      </div>

      {lista.length === 0 ? (
        <div className="py-20 text-center"><p className="text-[14px] text-stone-400 dark:text-stone-500">Sin municipios{query ? ' que coincidan' : ''}</p></div>
      ) : layout === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {lista.map((m, i) => {
            const urgente = m.conObservaciones > 0 || m.sinRevisar > 3
            const pctRev  = m.tramitesActivos > 0 ? Math.round(((m.tramitesActivos - m.sinRevisar) / m.tramitesActivos) * 100) : 0
            return (
              <button key={m.id} onClick={() => onSelect(m.id)}
                className="tp-fade group/card relative text-left bg-white dark:bg-[#141210] border border-stone-200/70 dark:border-stone-800/50 rounded-2xl p-5 hover:border-[#2FAF8F]/40 hover:shadow-[0_4px_24px_rgba(47,175,143,0.08)] active:scale-[0.98] transition-all"
                style={{ animationDelay:`${i*30}ms` }}>
                {urgente && <span className="absolute top-3.5 right-3.5 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-white dark:ring-[#141210]" />}
                <div className="w-8 h-8 rounded-xl bg-stone-50 dark:bg-stone-800/50 flex items-center justify-center text-stone-400 dark:text-stone-500 mb-3.5 group-hover/card:bg-[#2FAF8F]/10 group-hover/card:text-[#2FAF8F] transition-all">
                  <I.Map />
                </div>
                <p className="text-[14px] font-semibold tracking-tight text-stone-800 dark:text-stone-100 mb-3 leading-snug">{m.nombre}</p>
                <div className="flex items-end justify-between mb-3">
                  <div>
                    <span className="text-[26px] font-bold text-[#2FAF8F] leading-none tracking-tight">{m.tramitesActivos}</span>
                    <span className="text-[11px] text-stone-400 dark:text-stone-500 ml-1.5">activos</span>
                  </div>
                  {m.sinRevisar > 0 && (
                    <span className="text-[11px] font-semibold text-stone-400 dark:text-stone-500 bg-stone-100 dark:bg-stone-800/60 px-2 py-0.5 rounded-full">{m.sinRevisar} sin revisar</span>
                  )}
                </div>
                <div className="h-1 rounded-full bg-stone-100 dark:bg-stone-800/60 overflow-hidden mb-1.5">
                  <div className="h-full rounded-full bg-[#2FAF8F]/60 transition-all duration-500" style={{ width:`${pctRev}%` }} />
                </div>
                <p className="text-[10.5px] text-stone-400 dark:text-stone-500">{pctRev}% revisado</p>
                {m.conObservaciones > 0 && (
                  <p className="text-[11px] text-amber-500 font-semibold mt-1.5">{m.conObservaciones} con observaciones</p>
                )}
              </button>
            )
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-[#141210] border border-stone-200/70 dark:border-stone-800/50 rounded-2xl overflow-hidden">
          <div className="grid grid-cols-[1fr_72px_80px_64px_72px] px-5 py-3 border-b border-stone-100 dark:border-stone-800/50">
            {['Municipio','Activos','Sin revisar','Obs.','Completos'].map(h => (
              <p key={h} className="text-[10.5px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-widest">{h}</p>
            ))}
          </div>
          {lista.map((m, i) => (
            <button key={m.id} onClick={() => onSelect(m.id)}
              className="tp-fade w-full grid grid-cols-[1fr_72px_80px_64px_72px] px-5 py-4 border-b border-stone-50 dark:border-stone-800/30 last:border-0 hover:bg-stone-50/70 dark:hover:bg-stone-800/20 text-left transition-colors group/row"
              style={{ animationDelay:`${i*20}ms` }}>
              <p className="text-[13.5px] font-semibold text-stone-800 dark:text-stone-100 group-hover/row:text-[#2FAF8F] transition-colors">{m.nombre}</p>
              <p className="text-[13px] font-bold text-[#2FAF8F]">{m.tramitesActivos}</p>
              <p className="text-[13px] text-stone-500 dark:text-stone-400">{m.sinRevisar}</p>
              <p className={`text-[13px] font-semibold ${m.conObservaciones > 0 ? 'text-amber-500' : 'text-stone-300 dark:text-stone-600'}`}>{m.conObservaciones}</p>
              <p className="text-[13px] text-emerald-500 font-semibold">{m.completos}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// VISTA: BANDEJA
// ─────────────────────────────────────────────────────────────────────────────

function VistaBandeja({ municipioId, municipioNombre, onSelect, onBack }: {
  municipioId: string; municipioNombre: string; onSelect: (id: string) => void; onBack: () => void
}) {
  const [tramites,  setTramites]  = useState<TramiteUI[]>([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState<string | null>(null)
  const [filtroE,   setFiltroE]   = useState<'todos' | TramiteEstatus>('todos')
  const [orden,     setOrden]     = useState<OrdenBandeja>('fecha')
  const [sel,       setSel]       = useState<Set<string>>(new Set())
  const [toast,     setToast]     = useState<string | null>(null)
  const [showNuevo, setShowNuevo] = useState(false)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try { setTramites(await getTramitesByMunicipio(municipioId)) }
    catch (e) { setError(e instanceof Error ? e.message : 'Error') }
    finally { setLoading(false) }
  }, [municipioId])

  useEffect(() => { load() }, [load])

  const lista = useMemo(() => {
    const l = tramites.filter(t => filtroE === 'todos' || t.estatus === filtroE)
    return [...l].sort((a, b) => {
      if (orden === 'fecha')   return new Date(b.fechaIngreso).getTime() - new Date(a.fechaIngreso).getTime()
      if (orden === 'estatus') return a.estatus.localeCompare(b.estatus)
      return a.tipo.localeCompare(b.tipo)
    })
  }, [tramites, filtroE, orden])

  const toggleSel  = (id: string) => setSel(p => { const n = new Set(p); if (n.has(id)) n.delete(id); else n.add(id); return n })
  const allSel     = sel.size > 0 && sel.size === lista.length
  const toggleAll  = () => setSel(allSel ? new Set() : new Set(lista.map(t => t.id)))

  if (loading) return <Spinner />
  if (error)   return <ErrorMsg msg={error} onRetry={load} />

  return (
    <div className="tp-card">
      {toast && <Toast msg={toast} onClose={() => setToast(null)} />}
      {showNuevo && (
        <ModalNuevoTramite
          municipioId={municipioId}
          onClose={() => setShowNuevo(false)}
          onCreado={id => { setShowNuevo(false); setToast('Trámite creado correctamente'); load(); onSelect(id) }}
        />
      )}

      <Crumb items={[{ label:'Municipios', onClick: onBack }, { label: municipioNombre }]} />

      <div className="flex items-center gap-2 flex-wrap mb-5">
        <div className="flex items-center gap-1">
          {([
            { k:'todos', label:'Todos' },
            { k:'en_revision', label:'En revisión' },
            { k:'con_observaciones', label:'Con obs.' },
            { k:'documentacion_completa', label:'Completo' },
          ] as { k: string; label: string }[]).map(f => (
            <button key={f.k} onClick={() => setFiltroE(f.k as typeof filtroE)}
              className={`h-7 px-3 rounded-full text-[11.5px] font-medium transition-all ${filtroE === f.k ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900' : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-100 border border-stone-200/70 dark:border-stone-800/50'}`}
            >{f.label}</button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {sel.size > 0 && (
            <button onClick={() => { setSel(new Set()); setToast(`${sel.size} expedientes marcados`) }}
              className="flex items-center gap-1.5 h-7 px-3 rounded-lg text-[11.5px] font-semibold bg-[#2FAF8F] text-white hover:bg-[#27a07f] active:scale-[0.97] transition-all">
              <I.Multi /> Marcar {sel.size}
            </button>
          )}

          <div className="flex items-center gap-1.5 text-stone-400 dark:text-stone-500">
            <I.Sort />
            <select value={orden} onChange={e => setOrden(e.target.value as OrdenBandeja)}
              className="text-[11.5px] font-medium text-stone-600 dark:text-stone-300 bg-transparent cursor-pointer" style={{ outline:'none', appearance:'none' }}>
              <option value="fecha">Por fecha</option>
              <option value="estatus">Por estatus</option>
              <option value="tipo">Por tipo</option>
            </select>
          </div>
          <span className="text-[12px] text-stone-400 dark:text-stone-500">{lista.length} exp.</span>
          <button onClick={() => setShowNuevo(true)}
            className="flex items-center gap-1.5 h-7 px-3 rounded-lg text-[11.5px] font-semibold bg-[#2FAF8F] text-white hover:bg-[#27a07f] active:scale-[0.97] transition-all">
            <I.Plus /> Nuevo
          </button>
        </div>
      </div>

      {lista.length > 0 && (
        <button onClick={toggleAll} className="flex items-center gap-2 text-[11.5px] font-medium text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-200 transition-colors mb-3 px-1">
          <div className={`w-4 h-4 rounded-sm border flex items-center justify-center transition-all ${allSel ? 'bg-[#2FAF8F] border-[#2FAF8F]' : 'border-stone-300 dark:border-stone-600'}`}>
            {allSel && <I.Check c="w-2.5 h-2.5 text-white" />}
          </div>
          Seleccionar todos
        </button>
      )}

      {lista.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-[14px] text-stone-400 dark:text-stone-500 mb-4">Sin expedientes</p>
          <button onClick={() => setShowNuevo(true)}
            className="flex items-center gap-1.5 mx-auto text-[12px] font-semibold text-[#2FAF8F] hover:text-[#1a9070] transition-colors">
            <I.Plus /> Crear primer trámite
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {lista.map((t, i) => {
            const ecfg    = estatusCfg(t.estatus)
            const dias    = diasDesde(t.fechaIngreso)
            const selected = sel.has(t.id)
            return (
              <div key={t.id} className="tp-fade" style={{ animationDelay:`${i*25}ms` }}>
                <div className={`flex items-center gap-3 p-4 rounded-2xl border transition-all group/row ${selected ? 'border-[#2FAF8F]/40 bg-[#2FAF8F]/3' : 'border-stone-200/70 dark:border-stone-800/50 bg-white dark:bg-[#141210] hover:border-[#2FAF8F]/30 hover:shadow-[0_2px_12px_rgba(47,175,143,0.05)]'}`}>
                  <button onClick={() => toggleSel(t.id)} className="shrink-0">
                    <div className={`w-4 h-4 rounded-sm border flex items-center justify-center transition-all ${selected ? 'bg-[#2FAF8F] border-[#2FAF8F]' : 'border-stone-300 dark:border-stone-600 hover:border-[#2FAF8F]/60'}`}>
                      {selected && <I.Check c="w-2.5 h-2.5 text-white" />}
                    </div>
                  </button>
                  <div className="w-9 h-9 rounded-xl bg-stone-50 dark:bg-stone-800/50 flex items-center justify-center shrink-0 text-stone-400 dark:text-stone-500 group-hover/row:bg-[#2FAF8F]/10 group-hover/row:text-[#2FAF8F] transition-all">
                    <I.File />
                  </div>
                  <button onClick={() => onSelect(t.id)} className="flex-1 min-w-0 text-left">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <p className="text-[13.5px] font-semibold text-stone-800 dark:text-stone-100 tracking-tight">{t.upp}</p>
                      <Badge cls={tipoBadgeCls(t.tipo)}>{TIPO_LABEL[t.tipo]}</Badge>
                    </div>
                    <p className="text-[12px] text-stone-400 dark:text-stone-500">{t.productor} · {t.numAnimales} animales</p>
                  </button>
                  <div className="hidden sm:flex items-center gap-2 shrink-0">
                    <div className="w-14 h-1.5 rounded-full bg-stone-100 dark:bg-stone-800/60 overflow-hidden">
                      <div className="h-full rounded-full bg-[#2FAF8F] transition-all duration-500" style={{ width:`${t.checklistPct}%` }} />
                    </div>
                    <span className="text-[11px] text-stone-400 dark:text-stone-500 w-7 text-right">{t.checklistPct}%</span>
                  </div>
                  <Badge cls={ecfg.cls}>
                    <span className={`w-1.5 h-1.5 rounded-full ${ecfg.dot}`} />
                    {ecfg.label}
                  </Badge>
                  <span className={`hidden sm:flex items-center gap-1 text-[11px] font-semibold ${urgCls(dias)}`}>
                    <I.Clock />{dias}d
                  </span>
                  <button onClick={() => onSelect(t.id)}
                    className="text-stone-300 dark:text-stone-600 hover:text-[#2FAF8F] transition-colors">
                    <I.Chev />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// VISTA: EXPEDIENTE
// ─────────────────────────────────────────────────────────────────────────────

function VistaExpediente({ tramiteId, municipioNombre, onBackBandeja, onBackMunicipios }: {
  tramiteId: string; municipioNombre: string
  onBackBandeja: () => void; onBackMunicipios: () => void
}) {
  const [tramite,     setTramite]     = useState<TramiteUI | null>(null)
  const [eventos,     setEventos]     = useState<EventoUI[]>([])
  const [evidencias,  setEvidencias]  = useState<EvidenciaUI[]>([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState<string | null>(null)
  const [checklist,   setChecklist]   = useState<ChecklistItem[]>(CHECKLIST_BASE)
  const [historial,   setHistorial]   = useState<HistorialEntry[]>([])
  const [obs,         setObs]         = useState('')
  const [tabRight,    setTabRight]    = useState<'checklist' | 'historial' | 'timeline'>('checklist')
  const [confirmSig,  setConfirmSig]  = useState<TramiteEstatus | null>(null)
  const [saving,      setSaving]      = useState(false)
  const [toast,       setToast]       = useState<string | null>(null)
  const [userId,      setUserId]      = useState('')
  const [revisorName, setRevisorName] = useState('Revisor')

  const fire = (msg: string) => setToast(msg)
  const navigate = useNavigate()

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const det = await getExpediente(tramiteId)
      setTramite(det.tramite)
      setEventos(det.eventos)
      setEvidencias(det.evidencias)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar expediente')
    } finally {
      setLoading(false)
    }
  }, [tramiteId])

  useEffect(() => {
    load()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id)
    })
    // Obtener nombre del revisor
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('user_profiles').select('personal_data').eq('user_id', user.id).maybeSingle()
        .then(({ data }) => {
          const nombre = data?.personal_data?.nombre ?? data?.personal_data?.full_name ?? 'Revisor'
          setRevisorName(nombre)
        })
    })
  }, [load])

  const pct = Math.round((checklist.filter(i => i.checked).length / checklist.length) * 100)

  const guardar = async () => {
    if (!tramite) return
    setSaving(true)
    try {
      await guardarRevision(tramite, obs, checklist.filter(i => i.checked).length, checklist.length, userId)
      const entry: HistorialEntry = {
        id:         Date.now().toString(),
        fecha:      new Date().toLocaleString('es-MX'),
        revisor:    revisorName,
        observacion: obs || 'Sin observaciones adicionales',
        checkCount: checklist.filter(i => i.checked).length,
        total:      checklist.length,
        estatus:    tramite.estatus,
      }
      setHistorial(p => [entry, ...p])
      fire('Revisión guardada correctamente')
      setObs('')
    } catch {
      fire('Error al guardar — intenta de nuevo')
    } finally {
      setSaving(false)
    }
  }

  const confirmarAvance = async () => {
    if (!tramite || !confirmSig) return
    setSaving(true)
    try {
      await cambiarEstatus(tramite, confirmSig, obs, userId)
      setTramite((prev: TramiteUI | null) => prev ? { ...prev, estatus: confirmSig } : prev)
      fire(`Expediente avanzado a "${estatusCfg(confirmSig).label}"`)
      setObs('')
      await load()   // recargar eventos
    } catch {
      fire('Error al cambiar estado')
    } finally {
      setSaving(false)
      setConfirmSig(null)
    }
  }

  if (loading) return <Spinner />
  if (error || !tramite) return <ErrorMsg msg={error ?? 'Sin datos'} onRetry={load} />

  const dias   = diasDesde(tramite.fechaIngreso)
  const ecfg   = estatusCfg(tramite.estatus)

  return (
    <div className="tp-card">
      {toast && <Toast msg={toast} onClose={() => setToast(null)} />}
      {confirmSig && (
        <ModalConfirm
          tramite={tramite} sig={confirmSig}
          onOk={confirmarAvance}
          onCancel={() => setConfirmSig(null)}
        />
      )}

      <Crumb items={[
        { label:'Municipios', onClick: onBackMunicipios },
        { label: municipioNombre, onClick: onBackBandeja },
        { label: tramite.upp },
      ]} />

      {/* Header del expediente */}
      <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <h2 className="text-[18px] font-bold text-stone-900 dark:text-stone-50 tracking-tight">{tramite.upp}</h2>
            <Badge cls={tipoBadgeCls(tramite.tipo)}>{TIPO_LABEL[tramite.tipo]}</Badge>
            <Badge cls={ecfg.cls}>
              <span className={`w-1.5 h-1.5 rounded-full ${ecfg.dot}`} />
              {ecfg.label}
            </Badge>
          </div>
          <p className="text-[13px] text-stone-500 dark:text-stone-400">{tramite.productor} · {tramite.numAnimales} animales</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <span className={`flex items-center gap-1 text-[12px] font-semibold ${urgCls(dias)}`}><I.Clock /> {dias} días</span>
          <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200/70 dark:border-stone-700/40">
            <div className="w-7 h-7 rounded-full bg-linear-to-br from-[#2FAF8F] to-[#1a9070] flex items-center justify-center text-white text-[10px] font-bold shrink-0">
              {revisorName.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
            </div>
            <div>
              <p className="text-[11.5px] font-semibold text-stone-700 dark:text-stone-200 leading-none">{revisorName}</p>
              <p className="text-[10.5px] text-stone-400 dark:text-stone-500 mt-0.5 leading-none">Revisor activo</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/chat', { state: { openDocumentos: true, docFilter: tramite.productor } })}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11.5px] font-semibold border border-[#3b82f6]/30 text-[#3b82f6] bg-[#3b82f6]/06 hover:bg-[#3b82f6]/12 transition-all cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
            Ver documentos Gandia
          </button>
        </div>
      </div>

      {/* Stepper */}
      <div className="bg-white dark:bg-[#141210] border border-stone-200/70 dark:border-stone-800/50 rounded-2xl p-5 mb-5">
        <p className="text-[10.5px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-widest mb-5">Flujo del expediente</p>
        <Stepper estatus={tramite.estatus} onAdvance={s => setConfirmSig(s)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_316px] gap-5">
        {/* Columna izquierda */}
        <div className="space-y-4">
          {/* Info */}
          <div className="bg-white dark:bg-[#141210] border border-stone-200/70 dark:border-stone-800/50 rounded-2xl p-5">
            <p className="text-[10.5px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-widest mb-4">Información</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { l:'Municipio', v: municipioNombre },
                { l:'Tipo',      v: TIPO_LABEL[tramite.tipo] },
                { l:'Animales',  v: String(tramite.numAnimales) },
                { l:'Ingreso',   v: tramite.fechaIngreso ? new Date(tramite.fechaIngreso).toLocaleDateString('es-MX') : '—' },
              ].map(f => (
                <div key={f.l}>
                  <p className="text-[10.5px] text-stone-400 dark:text-stone-500 mb-1">{f.l}</p>
                  <p className="text-[13px] font-semibold text-stone-800 dark:text-stone-100">{f.v}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Evidencias / documentos */}
          <div className="bg-white dark:bg-[#141210] border border-stone-200/70 dark:border-stone-800/50 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10.5px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-widest">
                Documentos <span className="text-stone-300 dark:text-stone-600 normal-case font-normal ml-1">{evidencias.length} archivos</span>
              </p>
            </div>
            {evidencias.length > 0 ? (
              <div className="space-y-2.5">
                {evidencias.map(ev => (
                  <DocCard key={ev.id} ev={ev} onReenvio={() => fire('Solicitud enviada al productor')} />
                ))}
              </div>
            ) : (
              <p className="text-[13px] text-stone-400 dark:text-stone-500 py-6 text-center">Sin documentos cargados aún</p>
            )}
          </div>

          {/* Observaciones */}
          <div className="bg-white dark:bg-[#141210] border border-stone-200/70 dark:border-stone-800/50 rounded-2xl p-5">
            <p className="text-[10.5px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-widest mb-3">Observaciones</p>
            <textarea
              value={obs} onChange={e => setObs(e.target.value)}
              placeholder="Registre las observaciones de la revisión documental…" rows={4}
              className="w-full bg-stone-50 dark:bg-stone-800/30 border border-stone-200/70 dark:border-stone-700/40 rounded-xl px-3.5 py-2.5 text-[13px] text-stone-800 dark:text-stone-100 placeholder-stone-300 dark:placeholder-stone-600 resize-none leading-relaxed focus:border-[#2FAF8F]/50 transition-colors"
              style={{ outline:'none' }}
            />

            <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/30 rounded-xl">
              <p className="text-[11px] text-amber-700 dark:text-amber-400/80 leading-relaxed">
                <strong>Nota legal:</strong> {notaLegal(tramite.tipo)}
              </p>
            </div>

            <div className="flex gap-2 mt-4">
              <button onClick={guardar} disabled={saving}
                className="flex-1 h-9 rounded-xl text-[13px] font-semibold flex items-center justify-center gap-2 bg-[#2FAF8F] hover:bg-[#27a07f] disabled:opacity-60 text-white active:scale-[0.98] transition-all shadow-sm">
                {saving
                  ? <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  : <I.Save />
                }
                {saving ? 'Guardando…' : 'Guardar revisión'}
              </button>
              <button onClick={() => window.print()} title="Exportar resumen"
                className="h-9 w-9 rounded-xl flex items-center justify-center border border-stone-200/80 dark:border-stone-700/50 text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800/40 active:scale-[0.98] transition-all">
                <I.PDF />
              </button>
            </div>
          </div>
        </div>

        {/* Columna derecha */}
        <div className="space-y-4">
          {/* Tabs */}
          <div className="flex items-center gap-0.5 bg-stone-100/70 dark:bg-stone-800/50 rounded-xl p-1">
            {([
              { k:'checklist', label:'Checklist' },
              { k:'historial', label:`Historial${historial.length ? ` (${historial.length})` : ''}` },
              { k:'timeline',  label:`Timeline${eventos.length ? ` (${eventos.length})` : ''}` },
            ] as { k: string; label: string }[]).map(tab => (
              <button key={tab.k} onClick={() => setTabRight(tab.k as typeof tabRight)}
                className={`flex-1 h-8 rounded-[9px] text-[11.5px] font-semibold transition-all ${tabRight === tab.k ? 'bg-white dark:bg-[#1c1917] text-stone-800 dark:text-stone-100 shadow-sm' : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200'}`}
              >{tab.label}</button>
            ))}
          </div>

          {/* Checklist */}
          {tabRight === 'checklist' && (
            <div className="bg-white dark:bg-[#141210] border border-stone-200/70 dark:border-stone-800/50 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10.5px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-widest">Checklist documental</p>
                <span className={`text-[13px] font-bold ${pct === 100 ? 'text-[#2FAF8F]' : 'text-stone-500 dark:text-stone-400'}`}>{pct}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-stone-100 dark:bg-stone-800/60 mb-5 overflow-hidden">
                <div className="h-full rounded-full bg-[#2FAF8F] transition-all duration-500" style={{ width:`${pct}%` }} />
              </div>
              <div className="space-y-2.5">
                {checklist.map(item => (
                  <label key={item.id} className="flex items-center gap-3 cursor-pointer group/ch">
                    <div
                      onClick={() => setChecklist(p => p.map(i => i.id === item.id ? { ...i, checked: !i.checked } : i))}
                      className={`w-4.5 h-4.5 rounded-[5px] border flex items-center justify-center shrink-0 transition-all ${item.checked ? 'bg-[#2FAF8F] border-[#2FAF8F]' : 'border-stone-200 dark:border-stone-700/60 group-hover/ch:border-[#2FAF8F]/50'}`}
                    >
                      {item.checked && <I.Check c="w-2.5 h-2.5 text-white" />}
                    </div>
                    <span className={`text-[13px] leading-snug select-none transition-colors ${item.checked ? 'text-stone-400 dark:text-stone-500 line-through' : 'text-stone-700 dark:text-stone-200'}`}>
                      {item.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Historial */}
          {tabRight === 'historial' && (
            <div className="bg-white dark:bg-[#141210] border border-stone-200/70 dark:border-stone-800/50 rounded-2xl p-5">
              <p className="text-[10.5px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-widest mb-4">Historial de revisiones</p>
              {historial.length === 0 ? (
                <p className="text-[13px] text-stone-400 dark:text-stone-500 text-center py-8">Sin revisiones guardadas aún</p>
              ) : (
                <div className="space-y-3">
                  {historial.map((h, i) => (
                    <div key={h.id} className="tp-fade p-3.5 rounded-xl bg-stone-50 dark:bg-stone-800/30 border border-stone-100 dark:border-stone-800/50" style={{ animationDelay:`${i*30}ms` }}>
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-[11.5px] font-semibold text-stone-700 dark:text-stone-200">{h.revisor}</p>
                        <span className="text-[10.5px] text-stone-400 dark:text-stone-500">{h.fecha}</span>
                      </div>
                      <p className="text-[12.5px] text-stone-600 dark:text-stone-300 leading-relaxed">{h.observacion}</p>
                      <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-1.5">{h.checkCount}/{h.total} ítems · {estatusCfg(h.estatus).label}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Timeline */}
          {tabRight === 'timeline' && (
            <div className="bg-white dark:bg-[#141210] border border-stone-200/70 dark:border-stone-800/50 rounded-2xl p-5">
              <p className="text-[10.5px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-widest mb-5">Línea de tiempo</p>
              <Timeline eventos={eventos} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE RAÍZ
// ─────────────────────────────────────────────────────────────────────────────

export default function TramitesPanel() {
  const [vista,          setVista]          = useState<Vista>('municipios')
  const [municipioId,    setMunicipioId]    = useState<string | null>(null)
  const [municipioNombre,setMunicipioNombre]= useState<string>('')
  const [tramiteId,      setTramiteId]      = useState<string | null>(null)

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600;700&display=swap');
        .tp * { -webkit-font-smoothing:antialiased; }
        .tp { font-family:'Geist',system-ui,sans-serif; }
        .tp *:focus,.tp *:focus-visible { outline:none !important; }
        .tp textarea:focus,.tp input:focus { outline:none !important; }
        ::-webkit-scrollbar { width:3px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:#e7e5e4; border-radius:999px; }
        .dark ::-webkit-scrollbar-thumb { background:#3c3836; }
        @keyframes tp-in   { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes tp-fade { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
        @keyframes tp-pop  { from{opacity:0;transform:translate(-50%,6px)} to{opacity:1;transform:translate(-50%,0)} }
        .tp-card { animation:tp-in   320ms cubic-bezier(.16,1,.3,1) both; }
        .tp-fade { animation:tp-fade 280ms cubic-bezier(.16,1,.3,1) both; }
        .tp-pop  { animation:tp-pop  240ms cubic-bezier(.16,1,.3,1) both; }
      `}</style>

      <div className="tp min-h-screen bg-[#fafaf9] dark:bg-[#0c0a09]">
        <div className="max-w-275 mx-auto px-5 lg:px-10 pt-10 pb-24">

          <div className="mb-10">
            <p className="text-[10.5px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-widest mb-1">
              Unión Ganadera · Durango
            </p>
            <h1 style={{ fontFamily:"'Instrument Serif',Georgia,serif" }}
              className="text-[30px] sm:text-[36px] italic text-stone-900 dark:text-stone-50 leading-[1.15]">
              {vista === 'municipios' && 'Revisión documental'}
              {vista === 'bandeja'    && (municipioNombre || 'Bandeja')}
              {vista === 'expediente' && 'Expediente'}
            </h1>
          </div>

          {vista === 'municipios' && (
            <VistaMunicipios onSelect={id => {
              setMunicipioId(id)
              setVista('bandeja')
            }} />
          )}
          {vista === 'bandeja' && municipioId && (
            <VistaBandeja
              municipioId={municipioId}
              municipioNombre={municipioNombre}
              onSelect={id => { setTramiteId(id); setVista('expediente') }}
              onBack={() => { setVista('municipios'); setMunicipioId(null); setMunicipioNombre('') }}
            />
          )}
          {vista === 'expediente' && tramiteId && municipioId && (
            <VistaExpediente
              tramiteId={tramiteId}
              municipioNombre={municipioNombre}
              onBackBandeja={() => { setVista('bandeja'); setTramiteId(null) }}
              onBackMunicipios={() => { setVista('municipios'); setMunicipioId(null); setMunicipioNombre(''); setTramiteId(null) }}
            />
          )}

        </div>
      </div>
    </>
  )
}