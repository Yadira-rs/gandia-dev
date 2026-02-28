import { useState } from 'react'
import type { ReactElement } from 'react'

// ─── TYPES ────────────────────────────────────────────────────────────────────
type RolUsuario = 'productor' | 'mvz' | 'union' | 'exportador' | 'auditor'
type Paso = 'inicial' | 'seleccion' | 'impacto' | 'confirmacion'

interface Capacidad {
  id: string
  nombre: string
  descripcion: string
  precioUnitario: number
  unidad: string
  estimadoMensual: number
}

interface AmpliarCapacidadProps {
  isOpen: boolean
  onClose: () => void
  rolUsuario: RolUsuario
}

// ─── DATA ─────────────────────────────────────────────────────────────────────
const CONFIG_ROLES = {
  productor: {
    nombre: 'Productor Ganadero',
    capacidades: [
      { id: 'tramites',       nombre: 'Trámites simultáneos',         descripcion: 'Incrementa el límite de trámites activos que puedes gestionar al mismo tiempo',   precioUnitario: 120, unidad: 'trámite',       estimadoMensual: 10 },
      { id: 'pasaportes',     nombre: 'Pasaportes y gemelos',          descripcion: 'Aumenta la capacidad de generación de documentos de identidad animal',             precioUnitario: 35,  unidad: 'registro',      estimadoMensual: 20 },
      { id: 'ia',             nombre: 'Consultas a IA especializada',  descripcion: 'Consultas con IA para nutrición, manejo sanitario y toma de decisiones',           precioUnitario: 18,  unidad: 'consulta',      estimadoMensual: 15 },
      { id: 'historial',      nombre: 'Retención histórica extendida', descripcion: 'Extiende el periodo de almacenamiento y acceso a registros históricos',            precioUnitario: 25,  unidad: 'mes adicional', estimadoMensual: 3 },
      { id: 'almacenamiento', nombre: 'Almacenamiento de archivos',    descripcion: 'Incrementa el espacio disponible para evidencias fotográficas y documentos',       precioUnitario: 15,  unidad: 'GB',            estimadoMensual: 5 },
    ] as Capacidad[],
  },
  mvz: {
    nombre: 'Médico Veterinario Zootecnista',
    capacidades: [
      { id: 'dictamenes', nombre: 'Dictámenes profesionales',    descripcion: 'Aumenta el límite de dictámenes que puedes emitir con validez legal por mes',    precioUnitario: 85, unidad: 'dictamen', estimadoMensual: 12 },
      { id: 'anexos',     nombre: 'Anexos documentales',         descripcion: 'Incrementa la capacidad de adjuntar documentación técnica por expediente',        precioUnitario: 25, unidad: 'anexo',    estimadoMensual: 20 },
      { id: 'consultas',  nombre: 'Consultas técnicas avanzadas',descripcion: 'Acceso a consultas de IA especializada para diagnóstico y casos complejos',       precioUnitario: 28, unidad: 'consulta', estimadoMensual: 8 },
    ] as Capacidad[],
  },
  exportador: {
    nombre: 'Exportador',
    capacidades: [
      { id: 'expedientes', nombre: 'Expedientes de exportación', descripcion: 'Gestión completa de expedientes certificados para procesos de exportación',       precioUnitario: 250, unidad: 'expediente',   estimadoMensual: 5 },
      { id: 'paquetes',    nombre: 'Paquetes documentales',      descripcion: 'Generación de paquetes certificados para presentación ante autoridades',          precioUnitario: 180, unidad: 'paquete',      estimadoMensual: 8 },
      { id: 'historial',   nombre: 'Historial extendido',        descripcion: 'Retención prolongada de registros para cumplimiento normativo binacional',        precioUnitario: 45,  unidad: 'mes adicional',estimadoMensual: 6 },
      { id: 'reportes',    nombre: 'Reportes y verificaciones',  descripcion: 'Generación de reportes especializados y verificaciones para aduanas',             precioUnitario: 95,  unidad: 'reporte',      estimadoMensual: 10 },
    ] as Capacidad[],
  },
  union:   { nombre: 'Unión Ganadera',    capacidades: [] as Capacidad[] },
  auditor: { nombre: 'Auditor / Inspector', capacidades: [] as Capacidad[] },
}

// ─── ICONS ────────────────────────────────────────────────────────────────────
const sv = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '1.75', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

const IcoX      = () => <svg className="w-4 h-4" {...sv}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
const IcoCheck  = ({ c = 'w-3.5 h-3.5' }: { c?: string }) => <svg className={c} {...sv}><polyline points="20 6 9 17 4 12"/></svg>
const IcoMinus  = () => <svg className="w-3.5 h-3.5" {...sv}><line x1="5" y1="12" x2="19" y2="12"/></svg>
const IcoPlus   = () => <svg className="w-3.5 h-3.5" {...sv}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
const IcoInfo   = () => <svg className="w-3.5 h-3.5" {...sv}><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
const IcoSpark  = () => <svg className="w-3 h-3" {...sv}><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
const IcoChevronLeft = () => <svg className="w-3.5 h-3.5" {...sv}><polyline points="15 18 9 12 15 6"/></svg>

// Feature icons
const IcoBolt       = () => <svg className="w-4 h-4" {...sv}><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
const IcoBarChart   = () => <svg className="w-4 h-4" {...sv}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
const IcoUnlock     = () => <svg className="w-4 h-4" {...sv}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>
const IcoBuilding   = () => <svg className="w-4 h-4" {...sv}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
const IcoFileText   = () => <svg className="w-4 h-4" {...sv}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
const IcoCow        = () => <svg className="w-4 h-4" {...sv}><path d="M7 3h10l2 7H5L7 3z"/><path d="M5 10v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8"/><circle cx="9" cy="15" r="1"/><circle cx="15" cy="15" r="1"/></svg>
const IcoBrain      = () => <svg className="w-4 h-4" {...sv}><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.44-3.16Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.44-3.16Z"/></svg>
const IcoCalendar   = () => <svg className="w-4 h-4" {...sv}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
const IcoHardDrive  = () => <svg className="w-4 h-4" {...sv}><line x1="22" y1="12" x2="2" y2="12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/><line x1="6" y1="16" x2="6.01" y2="16"/><line x1="10" y1="16" x2="10.01" y2="16"/></svg>
const IcoClipboard  = () => <svg className="w-4 h-4" {...sv}><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg>
const IcoPaperclip  = () => <svg className="w-4 h-4" {...sv}><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
const IcoMicroscope = () => <svg className="w-4 h-4" {...sv}><path d="M6 18h8"/><path d="M3 22h18"/><path d="M14 22a7 7 0 1 0 0-14h-1"/><path d="M9 14h2"/><path d="M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2Z"/><path d="M12 6V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3"/></svg>
const IcoGlobe      = () => <svg className="w-4 h-4" {...sv}><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
const IcoPackage    = () => <svg className="w-4 h-4" {...sv}><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>

const IcoPieChart   = () => <svg className="w-4 h-4" {...sv}><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>

// Icon lookup map (after icon defs so components are in scope)
const CAP_ICON: Record<string, () => ReactElement> = {
  tramites:       IcoFileText,
  pasaportes:     IcoCow,
  ia:             IcoBrain,
  historial:      IcoCalendar,
  almacenamiento: IcoHardDrive,
  dictamenes:     IcoClipboard,
  anexos:         IcoPaperclip,
  consultas:      IcoMicroscope,
  expedientes:    IcoGlobe,
  paquetes:       IcoPackage,
  reportes:       IcoPieChart,
}

// Step indicator
const PASOS: Paso[] = ['inicial', 'seleccion', 'impacto', 'confirmacion']
const PASO_LABELS = ['Inicio', 'Selección', 'Impacto', 'Confirmación']

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function AmpliarCapacidad({ isOpen, onClose, rolUsuario }: AmpliarCapacidadProps) {
  const [paso, setPaso]           = useState<Paso>('inicial')
  const [seleccionados, setSeleccionados] = useState<string[]>([])
  const [cantidades, setCantidades]       = useState<Record<string, number>>({})

  const cfg               = CONFIG_ROLES[rolUsuario]
  const esInstitucional   = rolUsuario === 'union' || rolUsuario === 'auditor'
  const pasoIdx           = PASOS.indexOf(paso)

  // ── helpers ──
  const toggle = (id: string) => {
    if (seleccionados.includes(id)) {
      setSeleccionados(s => s.filter(x => x !== id))
      setCantidades(c => { const n = { ...c }; delete n[id]; return n })
    } else {
      const cap = cfg.capacidades.find(c => c.id === id)
      setSeleccionados(s => [...s, id])
      setCantidades(c => ({ ...c, [id]: cap?.estimadoMensual ?? 1 }))
    }
  }

  const setCant = (id: string, val: number) =>
    setCantidades(c => ({ ...c, [id]: Math.max(1, val) }))

  const total = () =>
    seleccionados.reduce((acc, id) => {
      const cap = cfg.capacidades.find(c => c.id === id)
      return cap ? acc + cap.precioUnitario * (cantidades[id] ?? cap.estimadoMensual) : acc
    }, 0)

  const continuar = () => setPaso(PASOS[pasoIdx + 1] as Paso)
  const volver    = () => setPaso(PASOS[pasoIdx - 1] as Paso)

  const cerrar = () => {
    setPaso('inicial')
    setSeleccionados([])
    setCantidades({})
    onClose()
  }

  if (!isOpen) return null

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600&display=swap');

        .ac * { -webkit-font-smoothing: antialiased; }
        .ac { font-family: 'Geist', system-ui, sans-serif; }
        .ac-serif { font-family: 'Instrument Serif', Georgia, serif; }
        .ac *:focus-visible { outline: none !important; box-shadow: none !important; }

        .ac-scroll::-webkit-scrollbar { width: 3px; }
        .ac-scroll::-webkit-scrollbar-track { background: transparent; }
        .ac-scroll::-webkit-scrollbar-thumb { background: #e7e5e4; border-radius: 999px; }
        .dark .ac-scroll::-webkit-scrollbar-thumb { background: #3c3836; }
        .ac-scroll { scrollbar-width: thin; scrollbar-color: #e7e5e4 transparent; }

        @keyframes ac-overlay-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes ac-modal-in {
          from { opacity: 0; transform: translateY(12px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
        .ac-overlay { animation: ac-overlay-in 180ms ease both; }
        .ac-modal   { animation: ac-modal-in   280ms cubic-bezier(.16,1,.3,1) both; }

        @keyframes ac-step-in {
          from { opacity: 0; transform: translateX(10px); }
          to   { opacity: 1; transform: translateX(0);    }
        }
        .ac-step { animation: ac-step-in 240ms cubic-bezier(.16,1,.3,1) both; }
      `}</style>

      {/* ── OVERLAY ── */}
      <div
        className="ac ac-overlay fixed inset-0 z-50 bg-black/40 backdrop-blur-[3px] flex items-end sm:items-center justify-center p-0 sm:p-4"
        onClick={e => e.target === e.currentTarget && cerrar()}
      >
        {/* ── MODAL ── */}
        <div className="ac-modal bg-[#fafaf9] dark:bg-[#111009] w-full sm:max-w-[560px] sm:rounded-2xl rounded-t-2xl max-h-[94vh] flex flex-col border border-stone-200/70 dark:border-stone-800/60 shadow-[0_24px_64px_rgba(0,0,0,0.18)]">

          {/* ── HEADER ── */}
          <div className="shrink-0 px-5 pt-5 pb-4 border-b border-stone-100 dark:border-stone-800/50">

            {/* drag handle (mobile) */}
            <div className="w-8 h-1 rounded-full bg-stone-200 dark:bg-stone-700 mx-auto mb-4 sm:hidden" />

            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[#2FAF8F]"><IcoSpark /></span>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-stone-400 dark:text-stone-500">
                    {cfg.nombre}
                  </p>
                </div>
                <h2 className="ac-serif italic text-[20px] text-stone-900 dark:text-stone-50 leading-snug">
                  Ampliar capacidad operativa
                </h2>
              </div>
              <button
                onClick={cerrar}
                className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800/60 transition-all mt-0.5"
              >
                <IcoX />
              </button>
            </div>

            {/* ── STEP INDICATOR ── */}
            {paso !== 'confirmacion' && (
              <div className="flex items-center mt-4">
                {PASOS.slice(0, 3).map((p, i) => {
                  const done    = pasoIdx > i
                  const current = pasoIdx === i
                  return (
                    <div key={p} className={`flex items-center ${i < 2 ? 'flex-1' : ''}`}>
                      {/* circle + label */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all shrink-0 ${
                          done    ? 'bg-[#2FAF8F] text-white' :
                          current ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900' :
                                    'bg-stone-100 dark:bg-stone-800 text-stone-400 dark:text-stone-500'
                        }`}>
                          {done ? <IcoCheck c="w-2.5 h-2.5" /> : i + 1}
                        </div>
                        <p className={`text-[10.5px] font-medium whitespace-nowrap ${
                          current ? 'text-stone-700 dark:text-stone-200' : 'text-stone-400 dark:text-stone-500'
                        }`}>
                          {PASO_LABELS[i]}
                        </p>
                      </div>
                      {/* line between steps */}
                      {i < 2 && (
                        <div className={`flex-1 h-px mx-2 transition-colors ${done ? 'bg-[#2FAF8F]' : 'bg-stone-200 dark:bg-stone-800'}`} />
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* ── BODY ── */}
          <div className="ac-scroll flex-1 overflow-y-auto px-5 py-5">

            {/* ─── PASO 1: INICIO ─────────────────────────── */}
            {paso === 'inicial' && (
              <div className="ac-step space-y-5">

                <div className="rounded-2xl border border-stone-200/70 dark:border-stone-800/60 bg-white dark:bg-[#141210] px-5 py-4">
                  <p className="text-[13.5px] text-stone-600 dark:text-stone-300 leading-[1.72]">
                    La ampliación habilita funciones adicionales conforme a tus necesidades reales de operación.
                    <span className="font-medium text-stone-800 dark:text-stone-100"> No existen cargos fijos elevados — solo pagas por lo que efectivamente utilizas.</span>
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  {([
                    { Icon: IcoBolt,     titulo: 'Inmediato',      sub: 'Se activa al momento de uso' },
                    { Icon: IcoBarChart, titulo: 'Por uso real',   sub: 'Solo facturas lo que operas' },
                    { Icon: IcoUnlock,   titulo: 'Sin contratos',  sub: 'Ajusta cuando lo necesites'  },
                  ] as { Icon: () => ReactElement; titulo: string; sub: string }[]).map(({ Icon, titulo, sub }) => (
                    <div key={titulo} className="rounded-2xl border border-stone-200/70 dark:border-stone-800/60 bg-white dark:bg-[#141210] px-3 py-3.5 text-center">
                      <div className="w-7 h-7 rounded-lg bg-stone-100 dark:bg-stone-800/60 flex items-center justify-center text-stone-400 dark:text-stone-500 mx-auto mb-2.5"><Icon /></div>
                      <p className="text-[12px] font-semibold text-stone-700 dark:text-stone-200 mb-0.5">{titulo}</p>
                      <p className="text-[10.5px] text-stone-400 dark:text-stone-500 leading-snug">{sub}</p>
                    </div>
                  ))}
                </div>

                {/* Resumen rápido de qué hay disponible */}
                {!esInstitucional && cfg.capacidades.length > 0 && (
                  <div className="rounded-2xl border border-stone-200/70 dark:border-stone-800/60 bg-white dark:bg-[#141210] px-5 py-4">
                    <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-stone-400 dark:text-stone-500 mb-3">
                      Capacidades disponibles para ampliar
                    </p>
                    <div className="space-y-2">
                      {cfg.capacidades.map(cap => (
                        <div key={cap.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-stone-400 dark:text-stone-500">{CAP_ICON[cap.id] ? <>{(CAP_ICON[cap.id])()}</> : null}</span>
                            <span className="text-[12.5px] text-stone-600 dark:text-stone-300">{cap.nombre}</span>
                          </div>
                          <span className="text-[11.5px] font-medium text-stone-400 dark:text-stone-500">
                            ${cap.precioUnitario} / {cap.unidad}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {esInstitucional && (
                  <div className="rounded-2xl border border-stone-200/70 dark:border-stone-800/60 bg-white dark:bg-[#141210] px-5 py-4 text-center">
                    <div className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-stone-800/60 flex items-center justify-center text-stone-400 dark:text-stone-500 mx-auto mb-3"><IcoBuilding /></div>
                    <p className="text-[13.5px] font-medium text-stone-700 dark:text-stone-200 mb-1">Habilitación institucional</p>
                    <p className="text-[12px] text-stone-400 dark:text-stone-500 leading-relaxed">
                      Tu acceso está determinado por atribución institucional. Las funciones disponibles corresponden a tu convenio de colaboración.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ─── PASO 2: SELECCIÓN ──────────────────────── */}
            {paso === 'seleccion' && (
              <div className="ac-step space-y-3">

                {esInstitucional ? (
                  <div className="rounded-2xl border border-stone-200/70 dark:border-stone-800/60 bg-white dark:bg-[#141210] px-5 py-6 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-stone-100 dark:bg-stone-800/60 flex items-center justify-center text-stone-400 dark:text-stone-500 mx-auto mb-4"><IcoBuilding /></div>
                    <p className="ac-serif italic text-[18px] text-stone-800 dark:text-stone-100 mb-2">Atribución institucional</p>
                    <p className="text-[13px] text-stone-400 dark:text-stone-500 leading-relaxed">
                      Las capacidades para tu rol están determinadas por convenio. No se requiere selección manual.
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="text-[12px] text-stone-400 dark:text-stone-500 pb-1">
                      Selecciona una o más capacidades y ajusta tu estimado mensual.
                    </p>

                    {cfg.capacidades.map(cap => {
                      const sel  = seleccionados.includes(cap.id)
                      const cant = cantidades[cap.id] ?? cap.estimadoMensual
                      const sub  = cap.precioUnitario * cant

                      return (
                        <div
                          key={cap.id}
                          onClick={() => toggle(cap.id)}
                          className={`rounded-2xl border transition-all cursor-pointer ${
                            sel
                              ? 'border-[#2FAF8F]/50 bg-[#2FAF8F]/[0.06] dark:bg-[#2FAF8F]/[0.09]'
                              : 'border-stone-200/70 dark:border-stone-800/60 bg-white dark:bg-[#141210] hover:border-stone-300 dark:hover:border-stone-700'
                          }`}
                        >
                          {/* top row */}
                          <div className="flex items-start gap-3 px-4 pt-4 pb-3">
                            <div className="shrink-0 mt-0.5 text-stone-400 dark:text-stone-500">{CAP_ICON[cap.id] ? <>{(CAP_ICON[cap.id])()}</> : null}</div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-[13.5px] font-medium tracking-[-0.01em] text-stone-800 dark:text-stone-100">
                                  {cap.nombre}
                                </p>
                                {/* checkbox */}
                                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                                  sel
                                    ? 'border-[#2FAF8F] bg-[#2FAF8F]'
                                    : 'border-stone-300 dark:border-stone-600'
                                }`}>
                                  {sel && <IcoCheck c="w-2.5 h-2.5 text-white" />}
                                </div>
                              </div>
                              <p className="text-[11.5px] text-stone-400 dark:text-stone-500 leading-relaxed mt-0.5">
                                {cap.descripcion}
                              </p>
                            </div>
                          </div>

                          {/* price + stepper */}
                          <div
                            className={`flex items-center justify-between gap-3 px-4 pb-4 ${sel ? '' : 'opacity-50'}`}
                            onClick={e => e.stopPropagation()}
                          >
                            <div className="flex items-baseline gap-1">
                              <span className="text-[15px] font-semibold tracking-tight text-stone-700 dark:text-stone-200">
                                ${cap.precioUnitario}
                              </span>
                              <span className="text-[11px] text-stone-400 dark:text-stone-500">
                                MXN / {cap.unidad}
                              </span>
                            </div>

                            {sel && (
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] text-stone-400 dark:text-stone-500">Estimado:</span>
                                <div className="flex items-center bg-white dark:bg-[#1c1917] border border-stone-200/70 dark:border-stone-700/60 rounded-xl overflow-hidden">
                                  <button
                                    onClick={() => setCant(cap.id, cant - 1)}
                                    className="w-8 h-8 flex items-center justify-center text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800/60 transition-colors"
                                  >
                                    <IcoMinus />
                                  </button>
                                  <span className="w-12 text-center text-[13px] font-semibold text-stone-800 dark:text-stone-100 border-x border-stone-200/70 dark:border-stone-700/60">
                                    {cant}
                                  </span>
                                  <button
                                    onClick={() => setCant(cap.id, cant + 1)}
                                    className="w-8 h-8 flex items-center justify-center text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800/60 transition-colors"
                                  >
                                    <IcoPlus />
                                  </button>
                                </div>
                                <span className="text-[12px] font-semibold text-[#2FAF8F] min-w-[64px] text-right">
                                  ${sub.toLocaleString('es-MX')}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}

                    {seleccionados.length === 0 && (
                      <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200/70 dark:border-stone-800/60">
                        <span className="text-stone-300 dark:text-stone-600"><IcoInfo /></span>
                        <p className="text-[12px] text-stone-400 dark:text-stone-500">
                          Selecciona al menos una capacidad para continuar
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ─── PASO 3: IMPACTO ────────────────────────── */}
            {paso === 'impacto' && (
              <div className="ac-step space-y-4">

                {esInstitucional ? (
                  <div className="rounded-2xl border border-stone-200/70 dark:border-stone-800/60 bg-white dark:bg-[#141210] px-5 py-6 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-[#2FAF8F]/10 dark:bg-[#2FAF8F]/15 flex items-center justify-center text-[#2FAF8F] mx-auto mb-4"><IcoCheck c="w-6 h-6" /></div>
                    <p className="ac-serif italic text-[18px] text-stone-800 dark:text-stone-100 mb-2">Sin impacto económico directo</p>
                    <p className="text-[13px] text-stone-400 dark:text-stone-500 leading-relaxed">
                      Tu acceso está habilitado por atribución institucional. No se generan cargos por uso individual.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Desglose */}
                    <div className="rounded-2xl border border-stone-200/70 dark:border-stone-800/60 bg-white dark:bg-[#141210] overflow-hidden">
                      <div className="px-5 py-3.5 border-b border-stone-100 dark:border-stone-800/50">
                        <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-stone-400 dark:text-stone-500">
                          Desglose de costos
                        </p>
                      </div>
                      <div className="divide-y divide-stone-100 dark:divide-stone-800/50">
                        {seleccionados.map(id => {
                          const cap  = cfg.capacidades.find(c => c.id === id)
                          if (!cap) return null
                          const cant = cantidades[id] ?? cap.estimadoMensual
                          const sub  = cap.precioUnitario * cant

                          return (
                            <div key={id} className="px-5 py-3.5 flex items-center justify-between gap-4">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="text-stone-500 dark:text-stone-400">{CAP_ICON[cap.id] ? <>{(CAP_ICON[cap.id])()}</> : null}</span>
                                <div className="min-w-0">
                                  <p className="text-[13px] font-medium text-stone-700 dark:text-stone-200 truncate">
                                    {cap.nombre}
                                  </p>
                                  <p className="text-[11px] text-stone-400 dark:text-stone-500">
                                    ${cap.precioUnitario} × {cant} {cap.unidad}{cant > 1 ? 's' : ''}
                                  </p>
                                </div>
                              </div>
                              <span className="text-[15px] font-semibold text-stone-800 dark:text-stone-100 shrink-0">
                                ${sub.toLocaleString('es-MX')}
                              </span>
                            </div>
                          )
                        })}
                      </div>

                      {/* Total */}
                      <div className="px-5 py-4 border-t border-stone-100 dark:border-stone-800/50 bg-stone-50/50 dark:bg-stone-800/20">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-[12.5px] font-medium text-stone-600 dark:text-stone-300">
                              Estimado mensual
                            </p>
                            <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-0.5">
                              El costo real depende del uso efectivo
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-[24px] font-semibold tracking-[-0.02em] text-[#2FAF8F]">
                              ~${total().toLocaleString('es-MX')}
                            </p>
                            <p className="text-[11px] text-stone-400 dark:text-stone-500">MXN / mes</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Nota */}
                    <div className="flex items-start gap-2.5 px-4 py-3.5 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200/70 dark:border-stone-800/60">
                      <span className="text-stone-400 dark:text-stone-500 shrink-0 mt-0.5"><IcoInfo /></span>
                      <p className="text-[12px] text-stone-500 dark:text-stone-400 leading-[1.68]">
                        <span className="font-semibold text-stone-600 dark:text-stone-300">No se cobra por acceso.</span>{' '}
                        Solo se factura la operación efectivamente realizada. Los montos mostrados son estimaciones basadas en uso promedio histórico.
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ─── PASO 4: CONFIRMACIÓN ───────────────────── */}
            {paso === 'confirmacion' && (
              <div className="ac-step">

                {/* Success */}
                <div className="text-center py-6">
                  <div className="w-14 h-14 rounded-2xl bg-[#2FAF8F]/10 dark:bg-[#2FAF8F]/15 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-7 h-7 text-[#2FAF8F]" {...sv}><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <p className="ac-serif italic text-[22px] text-stone-900 dark:text-stone-50 leading-snug mb-2">
                    Solicitud registrada
                  </p>
                  <p className="text-[13px] text-stone-400 dark:text-stone-500 leading-relaxed max-w-xs mx-auto">
                    Las capacidades se habilitan al momento de su primer uso. No hay cargos previos.
                  </p>
                </div>

                {/* Resumen */}
                <div className="rounded-2xl border border-stone-200/70 dark:border-stone-800/60 bg-white dark:bg-[#141210] overflow-hidden mb-4">
                  <div className="px-5 py-3.5 border-b border-stone-100 dark:border-stone-800/50">
                    <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-stone-400 dark:text-stone-500">
                      Resumen de solicitud
                    </p>
                  </div>
                  <div className="divide-y divide-stone-100 dark:divide-stone-800/50">
                    <div className="px-5 py-3 flex items-center justify-between">
                      <span className="text-[12.5px] text-stone-400 dark:text-stone-500">Rol</span>
                      <span className="text-[12.5px] font-medium text-stone-700 dark:text-stone-200">{cfg.nombre}</span>
                    </div>
                    <div className="px-5 py-3 flex items-center justify-between">
                      <span className="text-[12.5px] text-stone-400 dark:text-stone-500">Capacidades</span>
                      <span className="text-[12.5px] font-medium text-stone-700 dark:text-stone-200">
                        {esInstitucional ? 'Atribución institucional' : `${seleccionados.length} habilitada${seleccionados.length !== 1 ? 's' : ''}`}
                      </span>
                    </div>
                    {!esInstitucional && (
                      <div className="px-5 py-3 flex items-center justify-between">
                        <span className="text-[12.5px] text-stone-400 dark:text-stone-500">Estimado mensual</span>
                        <span className="text-[14px] font-semibold text-[#2FAF8F]">
                          ~${total().toLocaleString('es-MX')} MXN
                        </span>
                      </div>
                    )}
                  </div>

                  {!esInstitucional && seleccionados.length > 0 && (
                    <div className="px-5 pb-4 pt-1 border-t border-stone-100 dark:border-stone-800/50">
                      <div className="space-y-2 pt-3">
                        {seleccionados.map(id => {
                          const cap  = cfg.capacidades.find(c => c.id === id)
                          if (!cap) return null
                          const cant = cantidades[id] ?? cap.estimadoMensual
                          return (
                            <div key={id} className="flex items-center gap-2.5">
                              <span className="text-[#2FAF8F] shrink-0"><IcoCheck c="w-3 h-3" /></span>
                              <span className="text-[12px] text-stone-500 dark:text-stone-400">
                                {cap.nombre}
                                <span className="text-stone-400 dark:text-stone-500 ml-1">
                                  · {cant} {cap.unidad}{cant > 1 ? 's' : ''}
                                </span>
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Próximos pasos */}
                <div className="rounded-2xl border border-stone-200/70 dark:border-stone-800/60 bg-white dark:bg-[#141210] px-5 py-4 mb-4">
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-stone-400 dark:text-stone-500 mb-3">
                    Próximos pasos
                  </p>
                  <div className="space-y-2.5">
                    {[
                      'Recibirás confirmación por correo en los próximos minutos',
                      'Las capacidades se activan al primer uso operativo',
                      'Puedes revisar el consumo en tiempo real desde esta sección',
                    ].map((txt, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <div className="w-4 h-4 rounded-full border border-stone-200 dark:border-stone-700 flex items-center justify-center text-[9px] font-bold text-stone-400 dark:text-stone-500 shrink-0 mt-0.5">
                          {i + 1}
                        </div>
                        <p className="text-[12px] text-stone-500 dark:text-stone-400 leading-relaxed">{txt}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── FOOTER ── */}
          <div className="shrink-0 px-5 pb-5 pt-3 border-t border-stone-100 dark:border-stone-800/50 space-y-3">

            {/* action buttons */}
            <div className="flex gap-2">
              {paso !== 'inicial' && paso !== 'confirmacion' && (
                <button
                  onClick={volver}
                  className="flex items-center gap-1.5 h-10 px-4 rounded-xl text-[13px] font-medium text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-stone-800/60 hover:bg-stone-200 dark:hover:bg-stone-700 transition-all active:scale-[0.98]"
                >
                  <IcoChevronLeft /> Volver
                </button>
              )}

              {paso !== 'confirmacion' ? (
                <button
                  onClick={continuar}
                  disabled={paso === 'seleccion' && !esInstitucional && seleccionados.length === 0}
                  className="flex-1 h-10 rounded-xl text-[13px] font-medium text-white bg-[#2FAF8F] hover:bg-[#27a07f] disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98] shadow-sm"
                >
                  {paso === 'impacto' ? 'Confirmar solicitud' : 'Continuar'}
                </button>
              ) : (
                <button
                  onClick={cerrar}
                  className="flex-1 h-10 rounded-xl text-[13px] font-medium text-white bg-[#2FAF8F] hover:bg-[#27a07f] transition-all active:scale-[0.98] shadow-sm"
                >
                  Volver al sistema
                </button>
              )}
            </div>

            {/* legal */}
            <div className="flex items-start gap-2">
              <span className="text-stone-300 dark:text-stone-600 shrink-0 mt-0.5"><IcoInfo /></span>
              <p className="text-[10.5px] text-stone-300 dark:text-stone-600 leading-[1.65]">
                <span className="font-semibold text-stone-400 dark:text-stone-500">GANDIA</span> no autoriza ni certifica.
                Las decisiones corresponden a las autoridades competentes.
              </p>
            </div>
          </div>

        </div>
      </div>
    </>
  )
}