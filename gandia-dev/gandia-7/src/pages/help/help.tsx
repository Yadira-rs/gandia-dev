import { useState } from 'react'

// ─── TYPES ────────────────────────────────────────────────────────────────────
type Category = 'all' | 'general' | 'pasaportes' | 'certificacion' | 'tramites' | 'tecnicos'

interface FAQItem {
  id: string
  question: string
  answer: string
  category: Exclude<Category, 'all'>
}

// ─── DATA ─────────────────────────────────────────────────────────────────────
const FAQS: FAQItem[] = [
  {
    id: '1',
    question: '¿Qué es Gandia 7?',
    answer: 'Gandia 7 es una infraestructura digital institucional de consulta, evidencia y trazabilidad del ecosistema ganadero. Permite gestionar pasaportes digitales, gemelos digitales, certificaciones y monitoreo de ganado con la IA como interfaz principal.',
    category: 'general',
  },
  {
    id: '2',
    question: '¿Cómo puedo cambiar mi contraseña?',
    answer: 'Ve a Configuraciones › Seguridad › Cambiar contraseña. Necesitarás tu contraseña actual y la nueva que desees establecer.',
    category: 'general',
  },
  {
    id: '3',
    question: '¿Cómo contacto con soporte técnico?',
    answer: 'Puedes escribirnos a soporte@gandia7.com o llamar al +52 (618) 123-4567. Nuestro horario de atención es lunes a viernes, 9:00 AM – 6:00 PM.',
    category: 'general',
  },
  {
    id: '4',
    question: '¿Cómo creo un nuevo pasaporte?',
    answer: 'Dirígete a Pasaportes y toca "Nuevo Pasaporte". Completa los datos del animal: identificadores, biometría, fotografías certificadas y origen. El sistema generará el código QR y RFID automáticamente.',
    category: 'pasaportes',
  },
  {
    id: '5',
    question: '¿Puedo editar un pasaporte ya creado?',
    answer: 'Sí, desde el detalle del pasaporte puedes editar campos no certificados. Los identificadores oficiales (arete, RFID) no son modificables una vez certificados por ser parte del acto legal.',
    category: 'pasaportes',
  },
  {
    id: '6',
    question: '¿Qué información requiere un pasaporte?',
    answer: 'Número de identificación, raza, sexo, fecha de nacimiento, peso, huella de morro, fotografías certificadas y origen de propiedad. El historial sanitario oficial se adjunta automáticamente desde REEMO.',
    category: 'pasaportes',
  },
  {
    id: '7',
    question: '¿Qué es la certificación?',
    answer: 'Es el proceso de validación que confirma la autenticidad del pasaporte. La IA guía el proceso y detecta inconsistencias, pero la certificación final siempre es una decisión humana.',
    category: 'certificacion',
  },
  {
    id: '8',
    question: '¿Cuánto tarda el proceso de certificación?',
    answer: 'Entre 24 y 48 horas hábiles. Recibirás una notificación en la plataforma y por correo cuando el proceso esté completo.',
    category: 'certificacion',
  },
  {
    id: '9',
    question: '¿Cómo inicio un trámite?',
    answer: 'En la sección Trámites selecciona el tipo que necesitas, completa el formulario y adjunta los documentos requeridos. La IA te guiará en cada paso.',
    category: 'tramites',
  },
  {
    id: '10',
    question: '¿Puedo consultar el estado de mis trámites?',
    answer: 'Sí, en Trámites puedes ver el estado de todos tus trámites: activos, completados o rechazados, con el historial completo de actualizaciones.',
    category: 'tramites',
  },
  {
    id: '11',
    question: 'No puedo subir fotografías, ¿qué hago?',
    answer: 'Verifica que las imágenes sean JPG o PNG y no excedan 5 MB. Si el problema persiste, limpia la caché del navegador o prueba desde otro dispositivo.',
    category: 'tecnicos',
  },
  {
    id: '12',
    question: '¿La plataforma funciona sin conexión?',
    answer: 'Gandia opera con capacidad offline para consulta de expedientes y captura de evidencias con GPS y marca de tiempo. La sincronización se realiza en cuanto se restablece la señal.',
    category: 'tecnicos',
  },
]

const CATEGORIES: { id: Category; label: string }[] = [
  { id: 'all',          label: 'Todas'         },
  { id: 'general',      label: 'General'       },
  { id: 'pasaportes',   label: 'Pasaportes'    },
  { id: 'certificacion',label: 'Certificación' },
  { id: 'tramites',     label: 'Trámites'      },
  { id: 'tecnicos',     label: 'Técnicos'      },
]

// ─── ICONS ────────────────────────────────────────────────────────────────────
const s = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '1.75', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

const IcoSearch  = ({ c = 'w-4 h-4' }: { c?: string }) => <svg className={c} {...s}><circle cx="11" cy="11" r="7.5"/><line x1="20.5" y1="20.5" x2="16.1" y2="16.1"/></svg>
const IcoChevron = ({ open }: { open: boolean }) => (
  <svg className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} {...s}>
    <polyline points="6 9 12 15 18 9"/>
  </svg>
)
const IcoMail    = () => <svg className="w-4 h-4" {...s}><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
const IcoPhone   = () => <svg className="w-4 h-4" {...s}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
const IcoX       = () => <svg className="w-3.5 h-3.5" {...s}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
const IcoSpark   = () => <svg className="w-3.5 h-3.5" {...s}><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function Ayuda() {
  const [activeCategory, setActiveCategory] = useState<Category>('all')
  const [searchQuery,    setSearchQuery]    = useState('')
  const [expandedFAQ,    setExpandedFAQ]    = useState<string | null>(null)

  const filtered = FAQS.filter(f => {
    const matchCat = activeCategory === 'all' || f.category === activeCategory
    const matchQ   = !searchQuery ||
      f.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.answer.toLowerCase().includes(searchQuery.toLowerCase())
    return matchCat && matchQ
  })

  const count = (cat: Exclude<Category, 'all'>) => FAQS.filter(f => f.category === cat).length

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600&display=swap');

        .ay * { -webkit-font-smoothing: antialiased; }
        .ay { font-family: 'Geist', system-ui, sans-serif; }
        .ay-serif { font-family: 'Instrument Serif', Georgia, serif; }

        .ay *:focus-visible { outline: none !important; box-shadow: none !important; }

        @keyframes ay-in {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
        .ay-in { animation: ay-in 320ms cubic-bezier(.16,1,.3,1) both; }

        @keyframes ay-expand {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        .ay-expand { animation: ay-expand 200ms cubic-bezier(.16,1,.3,1) both; }

        .ay-scroll::-webkit-scrollbar { width: 3px; }
        .ay-scroll::-webkit-scrollbar-track { background: transparent; }
        .ay-scroll::-webkit-scrollbar-thumb { background: #e7e5e4; border-radius: 999px; }
        .dark .ay-scroll::-webkit-scrollbar-thumb { background: #3c3836; }
        .ay-scroll { scrollbar-width: thin; scrollbar-color: #e7e5e4 transparent; }
      `}</style>

      <div className="ay ay-scroll h-full overflow-y-auto bg-[#fafaf9] dark:bg-[#0c0a09]">
        <div className="max-w-[720px] mx-auto px-5 lg:px-8 pt-9 pb-20">

          {/* ── HEADER ─────────────────────────────────────────── */}
          <div className="ay-in mb-9">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-stone-400 dark:text-stone-500 mb-2">
              Centro de ayuda
            </p>
            <h1 className="ay-serif italic text-[32px] sm:text-[38px] text-stone-900 dark:text-stone-50 leading-[1.18]">
              ¿En qué podemos<br className="hidden sm:block" /> ayudarte?
            </h1>
          </div>

          {/* ── SEARCH ─────────────────────────────────────────── */}
          <div className="ay-in mb-6" style={{ animationDelay: '60ms' }}>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-300 dark:text-stone-600 pointer-events-none">
                <IcoSearch c="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Buscar en preguntas frecuentes…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full h-11 pl-10 pr-10 bg-white dark:bg-[#141210] border border-stone-200/80 dark:border-stone-800/70 rounded-xl text-[13.5px] text-stone-800 dark:text-stone-100 placeholder-stone-300 dark:placeholder-stone-600 shadow-[0_1px_8px_rgba(0,0,0,0.04)] dark:shadow-none transition-shadow focus:shadow-[0_2px_16px_rgba(0,0,0,0.08)]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-300 hover:text-stone-500 dark:hover:text-stone-400 transition-colors"
                >
                  <IcoX />
                </button>
              )}
            </div>
          </div>

          {/* ── CATEGORY PILLS ─────────────────────────────────── */}
          <div className="ay-in flex flex-wrap gap-1.5 mb-8" style={{ animationDelay: '100ms' }}>
            {CATEGORIES.map(cat => {
              const cnt = cat.id === 'all' ? FAQS.length : count(cat.id as Exclude<Category,'all'>)
              const active = activeCategory === cat.id
              return (
                <button
                  key={cat.id}
                  onClick={() => { setActiveCategory(cat.id); setExpandedFAQ(null) }}
                  className={`h-7 px-3.5 rounded-full text-[11.5px] font-medium transition-all duration-150 ${
                    active
                      ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900'
                      : 'bg-white dark:bg-[#141210] border border-stone-200/80 dark:border-stone-800/60 text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:border-stone-300 dark:hover:border-stone-600'
                  }`}
                >
                  {cat.label}
                  <span className={`ml-1.5 text-[10px] ${active ? 'opacity-60' : 'opacity-40'}`}>{cnt}</span>
                </button>
              )
            })}
          </div>

          {/* ── FAQ LIST ───────────────────────────────────────── */}
          <div className="ay-in" style={{ animationDelay: '140ms' }}>
            {filtered.length === 0 ? (

              <div className="text-center py-20">
                <div className="w-10 h-10 mx-auto mb-4 rounded-2xl bg-stone-100 dark:bg-stone-800/60 flex items-center justify-center text-stone-300 dark:text-stone-600">
                  <IcoSearch c="w-5 h-5" />
                </div>
                <p className="text-[14px] font-medium text-stone-500 dark:text-stone-400">
                  Sin resultados para "{searchQuery}"
                </p>
                <button
                  onClick={() => { setSearchQuery(''); setActiveCategory('all') }}
                  className="mt-3 text-[12px] text-[#2FAF8F] hover:text-[#1a9070] transition-colors font-medium"
                >
                  Ver todas las preguntas
                </button>
              </div>

            ) : (

              <div className="bg-white dark:bg-[#141210] border border-stone-200/70 dark:border-stone-800/60 rounded-2xl overflow-hidden shadow-[0_1px_12px_rgba(0,0,0,0.04)] dark:shadow-none">
                {filtered.map((faq, i) => (
                  <FAQRow
                    key={faq.id}
                    faq={faq}
                    isExpanded={expandedFAQ === faq.id}
                    onToggle={() => setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)}
                    isLast={i === filtered.length - 1}
                  />
                ))}
              </div>

            )}
          </div>

          {/* ── CONTACT CARD ───────────────────────────────────── */}
          <div className="ay-in mt-6" style={{ animationDelay: '200ms' }}>
            <div className="rounded-2xl border border-stone-200/70 dark:border-stone-800/60 bg-white dark:bg-[#141210] px-6 py-5 shadow-[0_1px_12px_rgba(0,0,0,0.04)] dark:shadow-none">

              <div className="flex items-center gap-2 mb-1">
                <span className="text-[#2FAF8F]"><IcoSpark /></span>
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-stone-400 dark:text-stone-500">
                  Soporte directo
                </p>
              </div>

              <p className="ay-serif italic text-[17px] text-stone-800 dark:text-stone-100 leading-snug mt-1 mb-4">
                ¿No encuentras lo que buscas?<br />Nuestro equipo está listo.
              </p>

              <div className="flex flex-col sm:flex-row gap-2">
                <a
                  href="mailto:soporte@gandia7.com"
                  className="flex-1 flex items-center justify-center gap-2 h-9 px-4 rounded-xl text-[12.5px] font-medium text-white bg-[#2FAF8F] hover:bg-[#27a07f] active:scale-[0.98] transition-all shadow-sm"
                >
                  <IcoMail />
                  soporte@gandia7.com
                </a>
                <a
                  href="tel:+526181234567"
                  className="flex-1 flex items-center justify-center gap-2 h-9 px-4 rounded-xl text-[12.5px] font-medium text-stone-600 dark:text-stone-300 bg-stone-100 dark:bg-stone-800/60 hover:bg-stone-200 dark:hover:bg-stone-700 active:scale-[0.98] transition-all"
                >
                  <IcoPhone />
                  +52 (618) 123-4567
                </a>
              </div>

              <p className="text-[10.5px] text-stone-300 dark:text-stone-600 mt-3">
                Lunes a viernes · 9:00 AM – 6:00 PM
              </p>
            </div>
          </div>

        </div>
      </div>
    </>
  )
}

// ─── FAQ ROW ──────────────────────────────────────────────────────────────────
const CAT_LABELS: Record<string, string> = {
  general: 'General', pasaportes: 'Pasaportes',
  certificacion: 'Certificación', tramites: 'Trámites', tecnicos: 'Técnicos',
}

function FAQRow({
  faq, isExpanded, onToggle, isLast,
}: {
  faq: FAQItem; isExpanded: boolean; onToggle: () => void; isLast: boolean
}) {
  return (
    <div className={`${!isLast ? 'border-b border-stone-100 dark:border-stone-800/50' : ''}`}>
      <button
        onClick={onToggle}
        aria-expanded={isExpanded}
        className="w-full flex items-start justify-between gap-4 px-5 py-4 text-left group transition-colors hover:bg-stone-50/60 dark:hover:bg-stone-800/20"
      >
        <div className="min-w-0 flex-1">
          <span className="block text-[10px] font-semibold uppercase tracking-[0.08em] text-[#2FAF8F] mb-1">
            {CAT_LABELS[faq.category]}
          </span>
          <span className="block text-[13.5px] font-medium tracking-[-0.01em] text-stone-700 dark:text-stone-200 group-hover:text-stone-900 dark:group-hover:text-stone-50 transition-colors leading-snug">
            {faq.question}
          </span>
        </div>
        <span className="shrink-0 mt-0.5 text-stone-300 dark:text-stone-600 group-hover:text-stone-400 dark:group-hover:text-stone-500 transition-colors">
          <IcoChevron open={isExpanded} />
        </span>
      </button>

      {isExpanded && (
        <div className="ay-expand px-5 pb-5 -mt-1">
          <p className="text-[13px] text-stone-500 dark:text-stone-400 leading-[1.75] pl-0">
            {faq.answer}
          </p>
        </div>
      )}
    </div>
  )
}