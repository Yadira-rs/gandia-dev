// src/pages/Creadores/CreadorWikiPage.tsx
import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase }                      from '../../lib/supabaseClient'
import { useUser }                       from '../../context/UserContext'

type TipoPropuesta = 'nuevo' | 'correccion' | 'actualizacion'

const DOMINIOS = [
  { id: 'sanidad',     label: 'Sanidad Animal'     },
  { id: 'exportacion', label: 'Exportación'        },
  { id: 'regulacion',  label: 'Regulación Federal' },
  { id: 'razas',       label: 'Razas y Genética'   },
  { id: 'nutricion',   label: 'Nutrición'          },
  { id: 'mercado',     label: 'Mercado y Precios'  },
  { id: 'bienestar',   label: 'Bienestar Animal'   },
  { id: 'clima',       label: 'Clima y Riesgo'     },
]

export default function CreadorWikiPage() {
  const navigate       = useNavigate()
  const [params]       = useSearchParams()
  const { profile }    = useUser()

  const hechoRef     = params.get('hecho')
  const tipoParsed   = (params.get('tipo') as TipoPropuesta) ?? 'nuevo'

  const [tipo,         setTipo]         = useState<TipoPropuesta>(tipoParsed)
  const [dominio,      setDominio]      = useState('')
  const [afirmacion,   setAfirmacion]   = useState('')
  const [contexto,     setContexto]     = useState('')
  const [temaSlug,     setTemaSlug]     = useState('')
  const [temaNuevo,    setTemaNuevo]     = useState('')
  const [jurisdiccion, setJurisdiccion] = useState('MX')
  const [fuenteNombre, setFuenteNombre] = useState('')
  const [fuenteArt,    setFuenteArt]    = useState('')
  const [fuenteUrl,    setFuenteUrl]    = useState('')
  const [fuenteFecha,  setFuenteFecha]  = useState('')

  const [temas,       setTemas]       = useState<{ slug: string; titulo: string }[]>([])
  const [hechoOrig,   setHechoOrig]   = useState<{ afirmacion: string; dominio: string } | null>(null)
  const [submitting,  setSubmitting]  = useState(false)
  const [submitted,   setSubmitted]   = useState(false)
  const [error,       setError]       = useState<string | null>(null)

  // Cargar Hecho original si es corrección/actualización
  useEffect(() => {
    if (!hechoRef) return
    const load = async () => {
      const { data } = await supabase
        .from('wiki_hechos')
        .select('afirmacion,dominio,tema')
        .eq('id', hechoRef)
        .single()
      if (data) {
        setHechoOrig(data as { afirmacion: string; dominio: string })
        setDominio((data as { dominio: string }).dominio)
      }
    }
    void load()
  }, [hechoRef])

  // Cargar temas del dominio seleccionado
  useEffect(() => {
    if (!dominio) return
    const load = async () => {
      const { data } = await supabase
        .from('wiki_temas')
        .select('slug,titulo')
        .eq('dominio', dominio)
        .eq('activo', true)
        .order('orden')
      setTemas((data as { slug: string; titulo: string }[]) ?? [])
    }
    void load()
  }, [dominio])

  const handleSubmit = async () => {
    if (!afirmacion.trim() || !fuenteNombre.trim() || !dominio) {
      setError('Completa los campos obligatorios: afirmación, fuente y dominio.')
      return
    }
    if (!profile?.user_id) { setError('Debes iniciar sesión.'); return }

    setSubmitting(true)
    setError(null)

    try {
      const { data: creator } = await supabase
        .from('creator_profiles')
        .select('id')
        .eq('user_id', profile.user_id)
        .single()

      const { error: err } = await supabase.from('wiki_propuestas').insert({
        user_id:         profile.user_id,
        creator_id:      creator?.id ?? null,
        tipo_propuesta:  tipo,
        afirmacion:      afirmacion.trim(),
        contexto:        contexto.trim() || null,
        dominio,
        tema_slug:       temaSlug || null,
        tema_nuevo:      temaNuevo.trim() || null,
        jurisdiccion:    jurisdiccion || 'MX',
        fuente_nombre:   fuenteNombre.trim(),
        fuente_articulo: fuenteArt.trim() || null,
        fuente_url:      fuenteUrl.trim() || null,
        fuente_fecha:    fuenteFecha || null,
        hecho_id:        hechoRef ?? null,
        status:          'pendiente',
      })

      if (err) throw err
      setSubmitted(true)
    } catch (err) {
      console.error(err)
      setError('No se pudo enviar la propuesta. Intenta de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Estado enviado ──────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen bg-[#fafaf9] dark:bg-[#0c0a09] flex items-center justify-center px-8" style={{ fontFamily: "'Geist', system-ui, sans-serif" }}>
        <div className="max-w-[400px] w-full text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#2FAF8F]/10 flex items-center justify-center mx-auto mb-5">
            <svg className="w-7 h-7 text-[#2FAF8F]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h2 className="text-[18px] font-semibold text-stone-900 dark:text-stone-50 mb-2">
            Propuesta enviada
          </h2>
          <p className="text-[13px] text-stone-400 dark:text-stone-500 leading-[1.7] mb-8">
            Tu propuesta quedó en revisión editorial. El equipo de Handeia la evaluará y si se aprueba, aparecerá en Wiki Handeia con tu crédito.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => navigate('/wiki')}
              className="h-9 px-5 rounded-xl text-[13px] font-medium text-stone-600 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
            >
              Ver Wiki
            </button>
            <button
              onClick={() => { setSubmitted(false); setAfirmacion(''); setContexto('') }}
              className="h-9 px-5 rounded-xl text-[13px] font-medium text-white bg-[#2FAF8F] hover:bg-[#27a07f] transition-colors"
            >
              Proponer otro
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600&display=swap');
        .np, .np * { font-family: 'Geist', system-ui, sans-serif; -webkit-font-smoothing: antialiased; }
        .np input:focus, .np textarea:focus, .np select:focus { outline: none !important; }
      `}</style>

      <div className="np min-h-screen bg-[#fafaf9] dark:bg-[#0c0a09]">
        <div className="max-w-[640px] mx-auto px-8 pt-10 pb-24">

          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <button
              onClick={() => navigate('/creadores')}
              className="text-[12.5px] font-medium text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-200 transition-colors flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
                <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
              </svg>
              Creadores
            </button>
          </div>

          <h1 className="text-[20px] font-semibold text-stone-900 dark:text-stone-50 mb-1">
            Proponer a Wiki Handeia
          </h1>
          <p className="text-[13px] text-stone-400 dark:text-stone-500 mb-8">
            Cada propuesta es revisada por el equipo editorial antes de publicarse. Se requiere fuente oficial.
          </p>

          {/* Hecho original si es corrección */}
          {hechoOrig && (
            <div className="mb-6 p-4 rounded-xl bg-stone-50 dark:bg-stone-900/50 border border-stone-200/60 dark:border-stone-800/50">
              <p className="text-[10.5px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-[0.08em] mb-1.5">
                Hecho original
              </p>
              <p className="text-[13px] text-stone-700 dark:text-stone-300 leading-[1.6]">
                {hechoOrig.afirmacion}
              </p>
            </div>
          )}

          {/* Tipo de propuesta */}
          {!hechoRef && (
            <div className="mb-6">
              <label className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-[0.08em] mb-3 block">
                Tipo de propuesta
              </label>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { id: 'nuevo',        label: 'Hecho nuevo',    desc: 'Agregar información nueva' },
                  { id: 'correccion',   label: 'Corrección',     desc: 'Dato incorrecto en la wiki' },
                  { id: 'actualizacion',label: 'Actualización',  desc: 'Regulación cambió' },
                ] as { id: TipoPropuesta; label: string; desc: string }[]).map(t => (
                  <button
                    key={t.id}
                    onClick={() => setTipo(t.id)}
                    className={`p-3.5 rounded-xl border text-left transition-all duration-150 ${
                      tipo === t.id
                        ? 'border-[#2FAF8F]/60 bg-[#2FAF8F]/08 dark:bg-[#2FAF8F]/10'
                        : 'border-stone-200 dark:border-stone-800/60 bg-white dark:bg-[#141210]'
                    }`}
                  >
                    <span className={`text-[12.5px] font-semibold block mb-0.5 ${tipo === t.id ? 'text-[#2FAF8F]' : 'text-stone-800 dark:text-stone-100'}`}>
                      {t.label}
                    </span>
                    <span className="text-[11px] text-stone-400 dark:text-stone-500">{t.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Dominio */}
          <div className="mb-5">
            <label className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-[0.08em] mb-2 block">
              Dominio <span className="text-rose-400">*</span>
            </label>
            <select
              value={dominio}
              onChange={e => { setDominio(e.target.value); setTemaSlug('') }}
              className="w-full h-11 px-4 rounded-xl border border-stone-200 dark:border-stone-800/60 bg-white dark:bg-[#141210] text-[13.5px] text-stone-800 dark:text-stone-100 transition-colors focus:border-stone-300 dark:focus:border-stone-700"
              style={{ outline: 'none' }}
            >
              <option value="">Seleccionar dominio...</option>
              {DOMINIOS.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
            </select>
          </div>

          {/* Tema */}
          {dominio && (
            <div className="mb-5">
              <label className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-[0.08em] mb-2 block">
                Tema
              </label>
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={temaSlug}
                  onChange={e => setTemaSlug(e.target.value)}
                  className="h-11 px-4 rounded-xl border border-stone-200 dark:border-stone-800/60 bg-white dark:bg-[#141210] text-[13px] text-stone-800 dark:text-stone-100 transition-colors focus:border-stone-300 dark:focus:border-stone-700"
                  style={{ outline: 'none' }}
                >
                  <option value="">Tema existente...</option>
                  {temas.map(t => <option key={t.slug} value={t.slug}>{t.titulo}</option>)}
                </select>
                <input
                  value={temaNuevo}
                  onChange={e => setTemaNuevo(e.target.value)}
                  placeholder="O escribe un tema nuevo"
                  className="h-11 px-4 rounded-xl border border-stone-200 dark:border-stone-800/60 bg-white dark:bg-[#141210] text-[13px] text-stone-800 dark:text-stone-100 placeholder-stone-300 dark:placeholder-stone-600 transition-colors focus:border-stone-300 dark:focus:border-stone-700"
                  style={{ outline: 'none' }}
                />
              </div>
            </div>
          )}

          {/* Afirmación */}
          <div className="mb-5">
            <label className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-[0.08em] mb-2 block">
              Afirmación verificable <span className="text-rose-400">*</span>
            </label>
            <textarea
              value={afirmacion}
              onChange={e => setAfirmacion(e.target.value)}
              placeholder="Una oración clara y verificable. Ej: 'El período de cuarentena para bovinos exportados a EE.UU. es de 30 días calendario.'"
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-800/60 bg-white dark:bg-[#141210] text-[14px] text-stone-800 dark:text-stone-100 placeholder-stone-300 dark:placeholder-stone-600 resize-none transition-colors focus:border-stone-300 dark:focus:border-stone-700 leading-[1.7]"
              style={{ outline: 'none' }}
            />
            <p className="text-[11px] text-stone-300 dark:text-stone-700 mt-1.5">
              Debe ser verdadera o falsa — no una opinión ni un hecho general.
            </p>
          </div>

          {/* Contexto */}
          <div className="mb-5">
            <label className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-[0.08em] mb-2 block">
              Contexto{' '}
              <span className="normal-case font-normal tracking-normal text-stone-300 dark:text-stone-600">(opcional, para el lector humano)</span>
            </label>
            <textarea
              value={contexto}
              onChange={e => setContexto(e.target.value)}
              placeholder="Explicación breve de por qué aplica este hecho, casos de uso, excepciones..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-800/60 bg-white dark:bg-[#141210] text-[13.5px] text-stone-800 dark:text-stone-100 placeholder-stone-300 dark:placeholder-stone-600 resize-none transition-colors focus:border-stone-300 dark:focus:border-stone-700 leading-[1.7]"
              style={{ outline: 'none' }}
            />
          </div>

          {/* Fuente */}
          <div className="mb-5">
            <label className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-[0.08em] mb-2 block">
              Fuente oficial <span className="text-rose-400">*</span>
            </label>
            <div className="space-y-2">
              <input
                value={fuenteNombre}
                onChange={e => setFuenteNombre(e.target.value)}
                placeholder="Nombre exacto — ej. NOM-051-ZOO-1995, DOF Acuerdo 23-Feb-2024"
                className="w-full h-11 px-4 rounded-xl border border-stone-200 dark:border-stone-800/60 bg-white dark:bg-[#141210] text-[13.5px] text-stone-800 dark:text-stone-100 placeholder-stone-300 dark:placeholder-stone-600 transition-colors focus:border-stone-300 dark:focus:border-stone-700"
                style={{ outline: 'none' }}
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  value={fuenteArt}
                  onChange={e => setFuenteArt(e.target.value)}
                  placeholder="Artículo (ej. Art. 7.3)"
                  className="h-11 px-4 rounded-xl border border-stone-200 dark:border-stone-800/60 bg-white dark:bg-[#141210] text-[13px] text-stone-800 dark:text-stone-100 placeholder-stone-300 dark:placeholder-stone-600 transition-colors focus:border-stone-300 dark:focus:border-stone-700"
                  style={{ outline: 'none' }}
                />
                <input
                  type="date"
                  value={fuenteFecha}
                  onChange={e => setFuenteFecha(e.target.value)}
                  className="h-11 px-4 rounded-xl border border-stone-200 dark:border-stone-800/60 bg-white dark:bg-[#141210] text-[13px] text-stone-800 dark:text-stone-100 transition-colors focus:border-stone-300 dark:focus:border-stone-700"
                  style={{ outline: 'none' }}
                />
              </div>
              <input
                value={fuenteUrl}
                onChange={e => setFuenteUrl(e.target.value)}
                placeholder="URL de la fuente oficial (dof.gob.mx, gob.mx/senasica, etc.)"
                className="w-full h-11 px-4 rounded-xl border border-stone-200 dark:border-stone-800/60 bg-white dark:bg-[#141210] text-[13px] text-stone-800 dark:text-stone-100 placeholder-stone-300 dark:placeholder-stone-600 font-mono transition-colors focus:border-stone-300 dark:focus:border-stone-700"
                style={{ outline: 'none' }}
              />
            </div>
          </div>

          {/* Jurisdicción */}
          <div className="mb-8">
            <label className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-[0.08em] mb-2 block">
              Jurisdicción
            </label>
            <select
              value={jurisdiccion}
              onChange={e => setJurisdiccion(e.target.value)}
              className="w-full h-11 px-4 rounded-xl border border-stone-200 dark:border-stone-800/60 bg-white dark:bg-[#141210] text-[13.5px] text-stone-800 dark:text-stone-100 transition-colors focus:border-stone-300 dark:focus:border-stone-700"
              style={{ outline: 'none' }}
            >
              <option value="MX">Nacional (México)</option>
              <option value="MX-US">México → EE.UU.</option>
              <option value="MX-CA">México → Canadá</option>
              <option value="INTL">Internacional</option>
              {['AGU','BCN','BCS','CAM','CHP','CHH','CMX','COA','COL','DGO','GUA','GRO','HID','JAL','MEX','MIC','MOR','NAY','NLE','OAX','PUE','QUE','ROO','SLP','SIN','SON','TAB','TAM','TLA','VER','YUC','ZAC'].map(e => (
                <option key={e} value={`MX-${e}`}>Estatal — {e}</option>
              ))}
            </select>
          </div>

          {error && <p className="text-[12.5px] text-rose-500 mb-4">{error}</p>}

          {/* Aviso */}
          <div className="mb-6 p-4 rounded-xl bg-stone-50 dark:bg-stone-900/50 border border-stone-200/60 dark:border-stone-800/50">
            <p className="text-[12px] text-stone-500 dark:text-stone-400 leading-[1.65]">
              Las propuestas sin fuente oficial verificable serán rechazadas. Si se aprueba, aparecerá en tu perfil de Creador como aporte a Wiki Handeia.
            </p>
          </div>

          {/* Botones */}
          <div className="flex gap-3">
            <button
              onClick={() => navigate(-1)}
              className="flex-1 h-11 rounded-xl text-[13px] font-medium text-stone-600 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => void handleSubmit()}
              disabled={submitting || !afirmacion.trim() || !fuenteNombre.trim() || !dominio}
              className="flex-1 h-11 rounded-xl text-[13px] font-medium text-white bg-[#2FAF8F] hover:bg-[#27a07f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-[1.5px] border-white/30 border-t-white rounded-full animate-spin" />
                  Enviando...
                </>
              ) : 'Enviar propuesta'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}