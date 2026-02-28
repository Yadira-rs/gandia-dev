import { useState } from 'react'
import AmpliarCapacidad from './AmpliarCapacidad'
import AgregarTarjeta from './AgregarTarjeta'

// ─── TYPES ────────────────────────────────────────────────────────────────────
type RolUsuario = 'productor' | 'mvz' | 'union' | 'exportador' | 'auditor'

interface ConsumoItem {
  concepto: string
  cantidad: number
  unidad: string
}

interface Capacidad {
  titulo: string
  descripcion: string
  items: string[]
  generaConsumo: string[]
  disponible: boolean
}

// ─── ICONS ────────────────────────────────────────────────────────────────────
const sv = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '1.75', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

const IcoSpark   = ({ c = 'w-3.5 h-3.5' }: { c?: string }) => <svg className={c} {...sv}><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
const IcoCheck   = ({ c = 'w-3.5 h-3.5' }: { c?: string }) => <svg className={c} {...sv}><polyline points="20 6 9 17 4 12"/></svg>
const IcoLock    = ({ c = 'w-3.5 h-3.5' }: { c?: string }) => <svg className={c} {...sv}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
const IcoInfo    = ({ c = 'w-4 h-4'   }: { c?: string }) => <svg className={c} {...sv}><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
const IcoChevron = ({ open }: { open: boolean }) => (
  <svg className={`w-3.5 h-3.5 transition-transform duration-200 shrink-0 ${open ? 'rotate-180' : ''}`} {...sv}>
    <polyline points="6 9 12 15 18 9"/>
  </svg>
)
const IcoCreditCard = ({ c = 'w-4 h-4' }: { c?: string }) => <svg className={c} {...sv}><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
const IcoReceipt    = ({ c = 'w-4 h-4' }: { c?: string }) => <svg className={c} {...sv}><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="16" y2="14"/></svg>
const IcoClock      = ({ c = 'w-4 h-4' }: { c?: string }) => <svg className={c} {...sv}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>

// ─── DATA ─────────────────────────────────────────────────────────────────────
const ROLES_CONFIG = {
  productor: {
    nombre: 'Productor Ganadero',
    inicial: 'P',
    modo: 'Operativo',
    descripcion: 'Dueño o administrador de rancho o UPP',
    mensaje: 'El productor paga por operar y consultar, no por certificarse.',
    muestraIA: true,
    capacidadesActivas: ['Chat & Asistencia', 'Trámites', 'Pasaportes', 'Gemelos', 'Historial', 'Monitoreo'],
    consumoPeriodo: [
      { concepto: 'Trámites iniciados',    cantidad: 12,  unidad: 'trámites'  },
      { concepto: 'Pasaportes generados',  cantidad: 45,  unidad: 'documentos'},
      { concepto: 'Consultas a IA',        cantidad: 28,  unidad: 'consultas' },
      { concepto: 'Archivos cargados',     cantidad: 156, unidad: 'MB'        },
    ],
    creditos: [
      { concepto: 'Trámites',     usados: 12,  total: 30,  unidad: 'trámites'   },
      { concepto: 'Pasaportes',   usados: 45,  total: 100, unidad: 'documentos' },
      { concepto: 'Consultas IA', usados: 28,  total: 35,  unidad: 'consultas'  },
      { concepto: 'Almacenamiento', usados: 156, total: 500, unidad: 'MB'       },
    ],
    acciones: ['Ampliar capacidad', 'Contactar administración'],
  },
  mvz: {
    nombre: 'Médico Veterinario',
    inicial: 'M',
    modo: 'Profesional',
    descripcion: 'Profesional certificado',
    mensaje: 'El MVZ consume por acto profesional documentado.',
    muestraIA: true,
    capacidadesActivas: ['Chat', 'Dictámenes', 'Pasaportes', 'Historial Clínico', 'Vinculación'],
    consumoPeriodo: [
      { concepto: 'Dictámenes emitidos',      cantidad: 34, unidad: 'documentos'},
      { concepto: 'Documentos anexados',      cantidad: 89, unidad: 'archivos'  },
      { concepto: 'Consultas técnicas',       cantidad: 15, unidad: 'consultas' },
      { concepto: 'Vinculaciones a trámites', cantidad: 27, unidad: 'vínculos'  },
    ],
    creditos: [
      { concepto: 'Dictámenes',   usados: 34, total: 50,  unidad: 'documentos' },
      { concepto: 'Anexos',       usados: 89, total: 120, unidad: 'archivos'   },
      { concepto: 'Consultas IA', usados: 15, total: 20,  unidad: 'consultas'  },
      { concepto: 'Vinculaciones',usados: 27, total: 60,  unidad: 'vínculos'   },
    ],
    acciones: ['Solicitar habilitación', 'Contactar administración'],
  },
  union: {
    nombre: 'Unión Ganadera',
    inicial: 'U',
    modo: 'Institucional',
    descripcion: 'Coordinador regional o estatal',
    mensaje: 'La Unión registra revisiones; no contrata operación.',
    muestraIA: false,
    capacidadesActivas: ['Trámites', 'Revisión Documental', 'Constancias', 'Historial', 'Auditorías'],
    consumoPeriodo: [
      { concepto: 'Trámites revisados',      cantidad: 156, unidad: 'trámites'   },
      { concepto: 'Constancias documentales',cantidad: 89,  unidad: 'documentos' },
      { concepto: 'Municipios activos',      cantidad: 12,  unidad: 'municipios' },
      { concepto: 'Auditorías internas',     cantidad: 8,   unidad: 'auditorías' },
    ],
    creditos: [
      { concepto: 'Trámites revisados', usados: 156, total: 300, unidad: 'trámites'   },
      { concepto: 'Constancias',        usados: 89,  total: 200, unidad: 'documentos' },
      { concepto: 'Municipios',         usados: 12,  total: 20,  unidad: 'municipios' },
      { concepto: 'Auditorías',         usados: 8,   total: 15,  unidad: 'auditorías' },
    ],
    acciones: ['Ver convenio', 'Contactar administración'],
  },
  exportador: {
    nombre: 'Exportador',
    inicial: 'E',
    modo: 'Intensivo',
    descripcion: 'Empresa binacional',
    mensaje: 'El exportador paga por certeza y trazabilidad.',
    muestraIA: false,
    capacidadesActivas: ['Expedientes', 'Certificación', 'Verificación', 'Historial', 'Reportes'],
    consumoPeriodo: [
      { concepto: 'Expedientes de exportación',  cantidad: 23,  unidad: 'expedientes'   },
      { concepto: 'Verificaciones documentales', cantidad: 67,  unidad: 'verificaciones'},
      { concepto: 'Paquetes generados',          cantidad: 34,  unidad: 'paquetes'      },
      { concepto: 'Retención histórica',         cantidad: 2.4, unidad: 'GB'            },
    ],
    creditos: [
      { concepto: 'Expedientes',     usados: 23,  total: 30,  unidad: 'expedientes'    },
      { concepto: 'Verificaciones',  usados: 67,  total: 100, unidad: 'verificaciones' },
      { concepto: 'Paquetes',        usados: 34,  total: 50,  unidad: 'paquetes'       },
      { concepto: 'Almacenamiento',  usados: 2.4, total: 5,   unidad: 'GB'             },
    ],
    acciones: ['Ampliar capacidad', 'Contactar administración'],
  },
  auditor: {
    nombre: 'Auditor / Inspector',
    inicial: 'A',
    modo: 'Institucional',
    descripcion: 'SENASICA o certificadora',
    mensaje: 'El auditor accede por atribución, no por consumo.',
    muestraIA: false,
    capacidadesActivas: ['Verificación', 'Historial', 'Auditorías', 'Evidencia', 'Consulta'],
    consumoPeriodo: [
      { concepto: 'Auditorías realizadas',    cantidad: 18,  unidad: 'auditorías'   },
      { concepto: 'Expedientes consultados',  cantidad: 145, unidad: 'expedientes'  },
      { concepto: 'Verificaciones',           cantidad: 89,  unidad: 'verificaciones'},
      { concepto: 'Reportes generados',       cantidad: 12,  unidad: 'reportes'     },
    ],
    creditos: [
      { concepto: 'Auditorías',     usados: 18,  total: 40,  unidad: 'auditorías'    },
      { concepto: 'Expedientes',    usados: 145, total: 300, unidad: 'expedientes'   },
      { concepto: 'Verificaciones', usados: 89,  total: 200, unidad: 'verificaciones'},
      { concepto: 'Reportes',       usados: 12,  total: 30,  unidad: 'reportes'      },
    ],
    acciones: ['Ver atribuciones', 'Contactar administración'],
  },
}

const CAPACIDADES_BASE = [
  {
    titulo: 'Chat & Asistencia',
    descripcion: 'Consultas internas y externas sobre operación ganadera',
    items: ['Chat institucional interno', 'Consultas a IA externa', 'Historial de conversaciones', 'Notificaciones inteligentes'],
    generaConsumo: ['Consultas a IA externa', 'Consultas técnicas avanzadas'],
    key: 'chat',
  },
  {
    titulo: 'Trámites & Certificación',
    descripcion: 'Gestión completa de documentación oficial',
    items: ['Creación de trámites', 'Seguimiento de estatus', 'Vinculación de documentos', 'Constancias y certificaciones'],
    generaConsumo: ['Trámites adicionales creados', 'Dictámenes emitidos'],
    key: 'tramites',
  },
  {
    titulo: 'Pasaportes & Gemelos',
    descripcion: 'Identidad digital y trazabilidad animal',
    items: ['Generación de pasaportes', 'Creación de gemelos digitales', 'Actualización de datos', 'Consulta de historial'],
    generaConsumo: ['Pasaportes generados', 'Actualización de gemelos'],
    key: 'pasaportes',
  },
  {
    titulo: 'Monitoreo & Evidencia',
    descripcion: 'Seguimiento y respaldo documental',
    items: ['Carga de evidencias', 'Monitoreo de indicadores', 'Alertas automáticas', 'Reportes visuales'],
    generaConsumo: ['Archivos cargados', 'Verificaciones documentales'],
    key: 'monitoreo',
  },
  {
    titulo: 'Historial & Auditoría',
    descripcion: 'Registro y consulta histórica completa',
    items: ['Consulta de registros históricos', 'Trazabilidad completa', 'Exportación de datos', 'Retención configurable'],
    generaConsumo: ['Retención histórica extendida', 'Consultas masivas'],
    key: 'historial',
  },
]

// ─── STAT CARD ────────────────────────────────────────────────────────────────
function StatCard({ item }: { item: ConsumoItem }) {
  return (
    <div className="bg-white dark:bg-[#141210] border border-stone-200/70 dark:border-stone-800/60 rounded-2xl px-5 py-4 shadow-[0_1px_8px_rgba(0,0,0,0.04)] dark:shadow-none">
      <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-stone-400 dark:text-stone-500 mb-3">
        {item.concepto}
      </p>
      <div className="flex items-baseline gap-1.5">
        <span className="text-[32px] font-semibold tracking-[-0.03em] text-stone-900 dark:text-stone-50 leading-none">
          {item.cantidad}
        </span>
        <span className="text-[12px] text-stone-400 dark:text-stone-500">{item.unidad}</span>
      </div>
    </div>
  )
}

// ─── CREDIT BAR ───────────────────────────────────────────────────────────────
interface CreditoItem {
  concepto: string
  usados: number
  total: number
  unidad: string
}

function CreditBar({ item }: { item: CreditoItem }) {
  const pct     = Math.min((item.usados / item.total) * 100, 100)
  const restante = Math.max(item.total - item.usados, 0)
  const color   = pct >= 85 ? '#ef4444' : pct >= 65 ? '#f59e0b' : '#2FAF8F'
  const label   = pct >= 85 ? 'Crítico' : pct >= 65 ? 'Moderado' : 'Disponible'

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-[12.5px] font-medium text-stone-700 dark:text-stone-200">
          {item.concepto}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-[10.5px] font-semibold" style={{ color }}>
            {label}
          </span>
          <span className="text-[11px] text-stone-400 dark:text-stone-500">
            {item.usados} / {item.total} {item.unidad}
          </span>
        </div>
      </div>
      {/* Track */}
      <div className="h-1.5 w-full rounded-full bg-stone-100 dark:bg-stone-800/60 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <p className="text-[10.5px] text-stone-400 dark:text-stone-500 mt-1">
        Quedan <span className="font-medium text-stone-500 dark:text-stone-400">{restante} {item.unidad}</span>
      </p>
    </div>
  )
}

// ─── CAPACITY ROW ─────────────────────────────────────────────────────────────
interface CapRowItem {
  titulo: string
  descripcion: string
  items: string[]
  generaConsumo: string[]
}

function CapacidadRow({
  cap, disponible, isLast,
}: {
  cap: CapRowItem; disponible: boolean; isLast: boolean
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className={!isLast ? 'border-b border-stone-100 dark:border-stone-800/50' : ''}>
      <button
        onClick={() => disponible && setOpen(p => !p)}
        className={`w-full flex items-center justify-between gap-4 px-5 py-4 text-left transition-colors ${
          disponible
            ? 'hover:bg-stone-50/60 dark:hover:bg-stone-800/20 group'
            : 'cursor-default opacity-50'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
            disponible
              ? 'bg-[#2FAF8F]/10 dark:bg-[#2FAF8F]/15 text-[#2FAF8F]'
              : 'bg-stone-100 dark:bg-stone-800/60 text-stone-300 dark:text-stone-600'
          }`}>
            {disponible ? <IcoCheck /> : <IcoLock />}
          </div>
          <div className="min-w-0">
            <p className="text-[13.5px] font-medium tracking-[-0.01em] text-stone-700 dark:text-stone-200 group-hover:text-stone-900 dark:group-hover:text-stone-50 transition-colors">
              {cap.titulo}
            </p>
            <p className="text-[11.5px] text-stone-400 dark:text-stone-500 leading-none mt-0.5">
              {cap.descripcion}
            </p>
          </div>
        </div>
        {disponible && (
          <span className="text-stone-300 dark:text-stone-600 shrink-0">
            <IcoChevron open={open} />
          </span>
        )}
      </button>

      {open && disponible && (
        <div className="px-5 pt-1 pb-5 pl-14 border-t border-stone-100 dark:border-stone-800/50">
          <div className="pt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 mb-4">
            {cap.items.map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-[12.5px] text-stone-500 dark:text-stone-400">
                <span className="text-[#2FAF8F] shrink-0"><IcoCheck c="w-3 h-3" /></span>
                {item}
              </div>
            ))}
          </div>
          {cap.generaConsumo.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-stone-400 dark:text-stone-500 mb-2">
                Genera consumo
              </p>
              <div className="flex flex-wrap gap-1.5">
                {cap.generaConsumo.map((g, i) => (
                  <span key={i} className="h-6 px-2.5 rounded-full text-[11px] text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-stone-800/60 border border-stone-200/70 dark:border-stone-700/50">
                    {g}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function Plan() {
  const [rolActual, setRolActual]               = useState<RolUsuario>('productor')
  const [modalAmpliarOpen, setModalAmpliarOpen] = useState(false)
  const [modalTarjetaOpen, setModalTarjetaOpen] = useState(false)
  const [tarjetaGuardada, setTarjetaGuardada]   = useState<{ ultimos: string; tipo: string; vence: string } | null>(null)

  const cfg = ROLES_CONFIG[rolActual]
  const esInstitucional = rolActual === 'union' || rolActual === 'auditor'

  const capacidades: Capacidad[] = CAPACIDADES_BASE.map(cap => ({
    ...cap,
    disponible: cfg.capacidadesActivas.some(a =>
      a.toLowerCase().includes(cap.key) ||
      cap.titulo.toLowerCase().includes(a.toLowerCase().split(' ')[0])
    ),
  }))

  const iaConsultas = cfg.consumoPeriodo.find(c =>
    c.concepto.toLowerCase().includes('ia') || c.concepto.toLowerCase().includes('técnicas')
  )

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600&display=swap');

        .pl * { -webkit-font-smoothing: antialiased; }
        .pl { font-family: 'Geist', system-ui, sans-serif; }
        .pl-serif { font-family: 'Instrument Serif', Georgia, serif; }
        .pl *:focus-visible { outline: none !important; box-shadow: none !important; }

        .pl-scroll::-webkit-scrollbar { width: 3px; }
        .pl-scroll::-webkit-scrollbar-track { background: transparent; }
        .pl-scroll::-webkit-scrollbar-thumb { background: #e7e5e4; border-radius: 999px; }
        .dark .pl-scroll::-webkit-scrollbar-thumb { background: #3c3836; }
        .pl-scroll { scrollbar-width: thin; scrollbar-color: #e7e5e4 transparent; }

        @keyframes pl-in {
          from { opacity: 0; transform: translateY(7px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
        .pl-in { animation: pl-in 360ms cubic-bezier(.16,1,.3,1) both; }
      `}</style>

      <div className="pl pl-scroll h-full overflow-y-auto bg-[#fafaf9] dark:bg-[#0c0a09]">
        <div className="max-w-[780px] mx-auto px-5 lg:px-8 pt-9 pb-24">

          {/* ── DEMO ROLE SWITCHER ─────────────────────────── */}
          <div className="pl-in mb-8 rounded-2xl border border-stone-200/70 dark:border-stone-800/60 bg-white dark:bg-[#141210] px-4 py-3.5 shadow-[0_1px_8px_rgba(0,0,0,0.03)] dark:shadow-none">
            <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-stone-400 dark:text-stone-500 mb-2.5">
              Demo · Cambiar rol
            </p>
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(ROLES_CONFIG) as RolUsuario[]).map(rol => (
                <button
                  key={rol}
                  onClick={() => setRolActual(rol)}
                  className={`h-7 px-3 rounded-full text-[11.5px] font-medium transition-all duration-150 ${
                    rolActual === rol
                      ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900'
                      : 'bg-stone-100 dark:bg-stone-800/60 text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200'
                  }`}
                >
                  {ROLES_CONFIG[rol].nombre}
                </button>
              ))}
            </div>
          </div>

          {/* ── HEADER ────────────────────────────────────── */}
          <div className="pl-in mb-9" style={{ animationDelay: '40ms' }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-xl bg-[#2FAF8F] flex items-center justify-center text-white text-[13px] font-bold shadow-sm shrink-0">
                {cfg.inicial}
              </div>
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-stone-400 dark:text-stone-500">
                {cfg.modo} · {cfg.descripcion}
              </p>
            </div>
            <h1 className="pl-serif italic text-[32px] sm:text-[38px] text-stone-900 dark:text-stone-50 leading-[1.18]">
              {cfg.nombre}
            </h1>
            <p className="text-[13px] text-stone-400 dark:text-stone-500 mt-2 leading-relaxed">
              {cfg.mensaje}
            </p>
          </div>

          {/* ── CONSUMPTION STATS ─────────────────────────── */}
          <section className="pl-in mb-8" style={{ animationDelay: '80ms' }}>
            <div className="flex items-center gap-3 mb-4">
              <IcoSpark c="w-3 h-3 text-[#2FAF8F]" />
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-stone-400 dark:text-stone-500">
                Consumo del periodo
              </p>
              <div className="flex-1 h-px bg-stone-100 dark:bg-stone-800/60" />
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {cfg.consumoPeriodo.map((item, i) => (
                <StatCard key={i} item={item} />
              ))}
            </div>
          </section>

          {/* ── CREDITS / CAPACITY PROGRESS ───────────────── */}
          <section className="pl-in mb-8" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center gap-3 mb-4">
              <IcoSpark c="w-3 h-3 text-[#2FAF8F]" />
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-stone-400 dark:text-stone-500">
                Créditos disponibles
              </p>
              <div className="flex-1 h-px bg-stone-100 dark:bg-stone-800/60" />
            </div>
            <div className="bg-white dark:bg-[#141210] border border-stone-200/70 dark:border-stone-800/60 rounded-2xl px-5 py-5 shadow-[0_1px_8px_rgba(0,0,0,0.04)] dark:shadow-none space-y-5">
              {cfg.creditos.map((c, i) => (
                <CreditBar key={i} item={c} />
              ))}
            </div>
          </section>

          {/* ── ACTIVE CAPABILITIES PILLS ─────────────────── */}
          <section className="pl-in mb-8" style={{ animationDelay: '110ms' }}>
            <div className="bg-white dark:bg-[#141210] border border-stone-200/70 dark:border-stone-800/60 rounded-2xl px-5 py-4 shadow-[0_1px_8px_rgba(0,0,0,0.04)] dark:shadow-none">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-stone-400 dark:text-stone-500 mb-3">
                Capacidades activas
              </p>
              <div className="flex flex-wrap gap-1.5">
                {cfg.capacidadesActivas.map((cap, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full text-[11.5px] font-medium text-[#2FAF8F] bg-[#2FAF8F]/[0.09] dark:bg-[#2FAF8F]/[0.12] border border-[#2FAF8F]/20"
                  >
                    <IcoCheck c="w-3 h-3" />
                    {cap}
                  </span>
                ))}
              </div>
            </div>
          </section>

          {/* ── AI EXTERNAL (if applicable) ───────────────── */}
          {cfg.muestraIA && (
            <section className="pl-in mb-8" style={{ animationDelay: '130ms' }}>
              <div className="bg-white dark:bg-[#141210] border border-stone-200/70 dark:border-stone-800/60 rounded-2xl px-5 py-5 shadow-[0_1px_8px_rgba(0,0,0,0.04)] dark:shadow-none">
                <div className="flex items-center gap-2 mb-1">
                  <IcoSpark c="w-3 h-3 text-[#2FAF8F]" />
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-stone-400 dark:text-stone-500">
                    IA externa
                  </p>
                </div>
                <p className="pl-serif italic text-[17px] text-stone-800 dark:text-stone-100 leading-snug mt-1 mb-4">
                  Consultas especializadas bajo demanda.
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-stone-50 dark:bg-stone-800/40 rounded-xl px-4 py-3 border border-stone-100 dark:border-stone-800/50">
                    <p className="text-[10.5px] text-stone-400 dark:text-stone-500 mb-1">Consultas este mes</p>
                    <p className="text-[26px] font-semibold tracking-[-0.03em] text-stone-900 dark:text-stone-50 leading-none">
                      {iaConsultas?.cantidad ?? 0}
                    </p>
                  </div>
                  <div className="flex-1 bg-stone-50 dark:bg-stone-800/40 rounded-xl px-4 py-3 border border-stone-100 dark:border-stone-800/50">
                    <p className="text-[10.5px] text-stone-400 dark:text-stone-500 mb-1">Estado</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#2FAF8F]" />
                      <p className="text-[13px] font-medium text-stone-700 dark:text-stone-200">Activo</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ── FACTURACIÓN & PAGO ────────────────────────── */}
          {!esInstitucional && (
            <section className="pl-in mb-8" style={{ animationDelay: '145ms' }}>
              <div className="flex items-center gap-3 mb-4">
                <IcoSpark c="w-3 h-3 text-[#2FAF8F]" />
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-stone-400 dark:text-stone-500">
                  Facturación y pago
                </p>
                <div className="flex-1 h-px bg-stone-100 dark:bg-stone-800/60" />
              </div>

              <div className="bg-white dark:bg-[#141210] border border-stone-200/70 dark:border-stone-800/60 rounded-2xl overflow-hidden shadow-[0_1px_8px_rgba(0,0,0,0.04)] dark:shadow-none">

                {/* método de pago */}
                <div className="px-5 py-4 border-b border-stone-100 dark:border-stone-800/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-stone-100 dark:bg-stone-800/60 flex items-center justify-center text-stone-400 dark:text-stone-500 shrink-0">
                        <IcoCreditCard c="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-stone-400 dark:text-stone-500 mb-0.5">
                          Método de pago
                        </p>
                        {tarjetaGuardada ? (
                          <p className="text-[13px] font-medium text-stone-700 dark:text-stone-200">
                            {tarjetaGuardada.tipo} ···· {tarjetaGuardada.ultimos}
                            <span className="text-stone-400 dark:text-stone-500 font-normal ml-2">
                              Vence {tarjetaGuardada.vence}
                            </span>
                          </p>
                        ) : (
                          <p className="text-[13px] text-stone-400 dark:text-stone-500">
                            Sin método de pago registrado
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => setModalTarjetaOpen(true)}
                      className="text-[12px] font-medium text-[#2FAF8F] hover:text-[#1a9070] transition-colors shrink-0"
                    >
                      {tarjetaGuardada ? 'Cambiar' : 'Agregar'}
                    </button>
                  </div>
                </div>

                {/* próximo cargo */}
                <div className="px-5 py-4 border-b border-stone-100 dark:border-stone-800/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-stone-100 dark:bg-stone-800/60 flex items-center justify-center text-stone-400 dark:text-stone-500 shrink-0">
                        <IcoClock c="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-stone-400 dark:text-stone-500 mb-0.5">
                          Próximo cargo estimado
                        </p>
                        <p className="text-[13px] font-medium text-stone-700 dark:text-stone-200">
                          1 de marzo · <span className="text-[#2FAF8F]">~${cfg.consumoPeriodo.reduce((a, c) => a + c.cantidad, 0).toLocaleString('es-MX')} MXN</span>
                        </p>
                      </div>
                    </div>
                    <span className="text-[10.5px] text-stone-300 dark:text-stone-600">basado en uso actual</span>
                  </div>
                </div>

                {/* historial de cargos */}
                <div className="px-5 py-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <IcoReceipt c="w-3.5 h-3.5 text-stone-400 dark:text-stone-500" />
                      <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-stone-400 dark:text-stone-500">
                        Historial de cargos
                      </p>
                    </div>
                    <button className="text-[11.5px] font-medium text-[#2FAF8F] hover:text-[#1a9070] transition-colors">
                      Ver todos
                    </button>
                  </div>
                  <div className="space-y-2.5">
                    {[
                      { fecha: '1 Feb 2025', concepto: 'Operación mensual',  monto: 1840, estado: 'Pagado'   },
                      { fecha: '1 Ene 2025', concepto: 'Operación mensual',  monto: 1620, estado: 'Pagado'   },
                      { fecha: '1 Dic 2024', concepto: 'Ampliación · IA ×15',monto:  270, estado: 'Pagado'   },
                    ].map((cargo, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#2FAF8F] shrink-0" />
                          <div className="min-w-0">
                            <p className="text-[12.5px] text-stone-600 dark:text-stone-300 truncate">{cargo.concepto}</p>
                            <p className="text-[10.5px] text-stone-400 dark:text-stone-500">{cargo.fecha}</p>
                          </div>
                        </div>
                        <div className="text-right shrink-0 ml-4">
                          <p className="text-[13px] font-medium text-stone-700 dark:text-stone-200">
                            ${cargo.monto.toLocaleString('es-MX')}
                          </p>
                          <p className="text-[10px] font-medium text-[#2FAF8F]">{cargo.estado}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </section>
          )}

          {/* ── SYSTEM CAPABILITIES ───────────────────────── */}
          <section className="pl-in mb-8" style={{ animationDelay: '160ms' }}>
            <div className="flex items-center gap-3 mb-4">
              <IcoSpark c="w-3 h-3 text-[#2FAF8F]" />
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-stone-400 dark:text-stone-500">
                Módulos del sistema
              </p>
              <div className="flex-1 h-px bg-stone-100 dark:bg-stone-800/60" />
            </div>
            <div className="bg-white dark:bg-[#141210] border border-stone-200/70 dark:border-stone-800/60 rounded-2xl overflow-hidden shadow-[0_1px_8px_rgba(0,0,0,0.04)] dark:shadow-none">
              {capacidades.map((cap, i) => (
                <CapacidadRow
                  key={i}
                  cap={cap}
                  disponible={cap.disponible}
                  isLast={i === capacidades.length - 1}
                />
              ))}
            </div>
          </section>

          {/* ── ACTIONS ───────────────────────────────────── */}
          <section className="pl-in mb-8" style={{ animationDelay: '190ms' }}>
            <div className="bg-white dark:bg-[#141210] border border-stone-200/70 dark:border-stone-800/60 rounded-2xl px-5 py-5 shadow-[0_1px_8px_rgba(0,0,0,0.04)] dark:shadow-none">
              <div className="flex items-center gap-2 mb-1">
                <IcoSpark c="w-3 h-3 text-[#2FAF8F]" />
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-stone-400 dark:text-stone-500">
                  Acciones disponibles
                </p>
              </div>
              <p className="pl-serif italic text-[17px] text-stone-800 dark:text-stone-100 leading-snug mt-1 mb-4">
                Gestiona tu acceso y operación.
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                {cfg.acciones.map((accion, i) => (
                  <button
                    key={i}
                    onClick={() => accion === 'Ampliar capacidad' && setModalAmpliarOpen(true)}
                    className={`flex-1 h-10 px-5 rounded-xl text-[13px] font-medium transition-all active:scale-[0.98] ${
                      i === 0
                        ? 'bg-[#2FAF8F] hover:bg-[#27a07f] text-white shadow-sm'
                        : 'bg-stone-100 dark:bg-stone-800/60 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
                    }`}
                  >
                    {accion}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* ── LEGAL NOTE ────────────────────────────────── */}
          <div className="pl-in" style={{ animationDelay: '220ms' }}>
            <div className="flex items-start gap-3 px-1">
              <span className="text-stone-300 dark:text-stone-600 shrink-0 mt-0.5"><IcoInfo /></span>
              <p className="text-[12px] text-stone-400 dark:text-stone-500 leading-[1.7]">
                <span className="font-semibold text-stone-500 dark:text-stone-400">GANDIA</span> no autoriza, certifica ni toma decisiones. El sistema registra, gestiona y resguarda información documental conforme a la normativa vigente. Las decisiones y certificaciones son responsabilidad de las autoridades competentes y profesionales acreditados.
              </p>
            </div>
          </div>

        </div>
      </div>

      <AmpliarCapacidad
        isOpen={modalAmpliarOpen}
        onClose={() => setModalAmpliarOpen(false)}
        rolUsuario={rolActual}
      />
      <AgregarTarjeta
        isOpen={modalTarjetaOpen}
        onClose={() => setModalTarjetaOpen(false)}
        onGuardar={(t) => { setTarjetaGuardada(t); setModalTarjetaOpen(false) }}
      />
    </>
  )
}