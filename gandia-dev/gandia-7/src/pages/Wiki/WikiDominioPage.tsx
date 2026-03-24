// src/pages/Wiki/WikiDominioPage.tsx
import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'

interface WikiTema {
  id:     string
  slug:   string
  titulo: string
  descripcion: string | null
  hechos_count?: number
}

interface WikiHecho {
  id:            string
  afirmacion:    string
  hti:           number
  fuente_nombre: string
  verificado_at: string
  estado:        string
}

const DOMINIOS_CONFIG: Record<string, { label: string; color: string; desc: string }> = {
  sanidad:     { label: 'Sanidad Animal',     color: '#2FAF8F', desc: 'Enfermedades, vacunación, protocolos sanitarios y alertas zoosanitarias.' },
  exportacion: { label: 'Exportación',        color: '#2FAF8F', desc: 'Requisitos, cuarentena, certificación y protocolos para exportación de ganado.' },
  regulacion:  { label: 'Regulación Federal', color: '#2FAF8F', desc: 'NOMs, acuerdos, leyes y normativa federal aplicable al sector ganadero.' },
  razas:       { label: 'Razas y Genética',   color: '#2FAF8F', desc: 'Razas bovinas, parámetros productivos, genética y mejoramiento.' },
  nutricion:   { label: 'Nutrición',          color: '#2FAF8F', desc: 'Alimentación, suplementación, pastoreo y eficiencia alimenticia.' },
  mercado:     { label: 'Mercado y Precios',  color: '#2FAF8F', desc: 'Precios de referencia, indices, mercados y tendencias económicas.' },
  bienestar:   { label: 'Bienestar Animal',   color: '#2FAF8F', desc: 'Estándares de bienestar, densidad, manejo y certificaciones.' },
  clima:       { label: 'Clima y Riesgo',     color: '#2FAF8F', desc: 'Riesgos climáticos, sequía, temperaturas críticas y alertas regionales.' },
}

function htiColor(hti: number) {
  if (hti >= 80) return '#2FAF8F'
  if (hti >= 60) return '#f59e0b'
  return '#ef4444'
}


export default function WikiDominioPage() {
  const { dominio }  = useParams<{ dominio: string }>()
  const navigate     = useNavigate()
  const config       = DOMINIOS_CONFIG[dominio ?? '']

  const [temas,       setTemas]       = useState<WikiTema[]>([])
  const [temaActivo,  setTemaActivo]  = useState<WikiTema | null>(null)
  const [hechos,      setHechos]      = useState<WikiHecho[]>([])
  const [loading,     setLoading]     = useState(true)
  const [loadingH,    setLoadingH]    = useState(false)

  const loadHechos = useCallback(async (temaSlug: string, dom: string) => {
    setLoadingH(true)
    const { data } = await supabase
      .from('wiki_hechos')
      .select('id,afirmacion,hti,fuente_nombre,verificado_at,estado')
      .eq('dominio', dom)
      .eq('tema', temaSlug)
      .in('estado', ['activo', 'en_revision'])
      .order('hti', { ascending: false })
    setHechos((data as WikiHecho[]) ?? [])
    setLoadingH(false)
  }, [])

  const selectTema = async (tema: WikiTema) => {
    setTemaActivo(tema)
    await loadHechos(tema.slug, dominio ?? '')
  }

  useEffect(() => {
    if (!dominio) return
    const load = async () => {
      // Cargar temas del dominio
      const { data: temasData } = await supabase
        .from('wiki_temas')
        .select('id,slug,titulo,descripcion')
        .eq('dominio', dominio)
        .eq('activo', true)
        .order('orden')

      const temasList = (temasData as WikiTema[]) ?? []

      // Contar hechos por tema
      const temasConConteo = await Promise.all(
        temasList.map(async t => {
          const { count } = await supabase
            .from('wiki_hechos')
            .select('*', { count: 'exact', head: true })
            .eq('dominio', dominio)
            .eq('tema', t.slug)
            .eq('estado', 'activo')
          return { ...t, hechos_count: count ?? 0 }
        })
      )

      setTemas(temasConConteo)

      // Si hay temas, cargar el primero
      if (temasConConteo.length > 0) {
        setTemaActivo(temasConConteo[0] ?? null)
        await loadHechos(temasConConteo[0]?.slug ?? '', dominio)
      }

      setLoading(false)
    }
    void load()
  }, [dominio, loadHechos])

  if (!config) {
    return (
      <div className="min-h-screen bg-[#fafaf9] dark:bg-[#0c0a09] flex items-center justify-center">
        <p className="text-[14px] text-stone-400">Dominio no encontrado.</p>
      </div>
    )
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600&display=swap');
        .wk  { font-family: 'Geist', system-ui, sans-serif; -webkit-font-smoothing: antialiased; }
        .wks { font-family: 'Instrument Serif', Georgia, serif; }
        @keyframes fu { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
        .fu { animation: fu 380ms cubic-bezier(.16,1,.3,1) both; }
      `}</style>

      <div className="wk min-h-screen bg-[#fafaf9] dark:bg-[#0c0a09]">
        <div className="max-w-[960px] mx-auto px-6 pt-10 pb-24">

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-8 text-[12.5px]">
            <button
              onClick={() => navigate('/wiki')}
              className="text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
            >
              Wiki Handeia
            </button>
            <span className="text-stone-300 dark:text-stone-700">/</span>
            <span className="font-medium text-stone-700 dark:text-stone-300">{config.label}</span>
          </div>

          {/* Header dominio */}
          <div className="flex items-start gap-4 mb-8 fu">
            <div className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-stone-800/60 flex items-center justify-center shrink-0 text-stone-500 dark:text-stone-400">
              <svg className="w-4.5 h-4.5 w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
              </svg>
            </div>
            <div>
              <h1 className="wks text-[24px] text-stone-900 dark:text-stone-50 mb-1">
                {config.label}
              </h1>
              <p className="text-[13px] text-stone-400 dark:text-stone-500 max-w-[480px]">
                {config.desc}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-5 h-5 border-2 border-[#2FAF8F] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : temas.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-[14px] text-stone-400 dark:text-stone-500 mb-2">
                Aún no hay hechos verificados en este dominio.
              </p>
              <button
                onClick={() => navigate('/creadores')}
                className="text-[12.5px] font-medium text-[#2FAF8F] hover:underline"
              >
                Proponer un hecho →
              </button>
            </div>
          ) : (
            /* Layout split: temas izq, hechos der */
            <div className="flex gap-6 fu" style={{ animationDelay: '100ms' }}>

              {/* Panel izquierdo — Temas */}
              <div className="w-[220px] shrink-0">
                <p className="text-[10.5px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-[0.08em] mb-3">
                  Temas ({temas.length})
                </p>
                <div className="space-y-1">
                  {temas.map(t => (
                    <button
                      key={t.id}
                      onClick={() => void selectTema(t)}
                      className={`w-full text-left px-3 py-2.5 rounded-xl transition-all duration-150 ${
                        temaActivo?.id === t.id
                          ? 'bg-[#2FAF8F]/10 border border-[#2FAF8F]/30'
                          : 'hover:bg-stone-100 dark:hover:bg-stone-800/50 border border-transparent'
                      }`}
                    >
                      <p className={`text-[13px] font-medium leading-snug ${
                        temaActivo?.id === t.id
                          ? 'text-[#2FAF8F]'
                          : 'text-stone-700 dark:text-stone-300'
                      }`}>
                        {t.titulo}
                      </p>
                      {(t.hechos_count ?? 0) > 0 && (
                        <p className="text-[10.5px] text-stone-400 dark:text-stone-500 mt-0.5">
                          {t.hechos_count} {(t.hechos_count ?? 0) === 1 ? 'hecho' : 'hechos'}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Panel derecho — Hechos */}
              <div className="flex-1 min-w-0">
                {temaActivo && (
                  <>
                    <div className="mb-5">
                      <h2 className="text-[16px] font-semibold text-stone-800 dark:text-stone-100 mb-0.5">
                        {temaActivo.titulo}
                      </h2>
                      {temaActivo.descripcion && (
                        <p className="text-[12.5px] text-stone-400 dark:text-stone-500">
                          {temaActivo.descripcion}
                        </p>
                      )}
                    </div>

                    {loadingH ? (
                      <div className="flex justify-center py-10">
                        <div className="w-4 h-4 border-[1.5px] border-[#2FAF8F] border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : hechos.length === 0 ? (
                      <p className="text-[13px] text-stone-400 dark:text-stone-500 py-8 text-center">
                        Sin hechos en este tema aún.
                      </p>
                    ) : (
                      <div className="divide-y divide-stone-100 dark:divide-stone-800/40">
                        {hechos.map((h, i) => (
                          <button
                            key={h.id}
                            onClick={() => navigate(`/wiki/hecho/${h.id}`)}
                            className="w-full text-left py-3.5 group fu"
                            style={{ animationDelay: `${i * 40}ms` }}
                          >
                            <div className="flex items-start gap-3">
                              <div className="shrink-0 mt-[5px] w-1.5 h-1.5 rounded-full bg-stone-300 dark:bg-stone-700 group-hover:bg-[#2FAF8F] transition-colors" />
                              <div className="flex-1 min-w-0">
                                <p className="text-[13.5px] text-stone-700 dark:text-stone-300 leading-[1.55] group-hover:text-stone-900 dark:group-hover:text-stone-100 transition-colors mb-1.5">
                                  {h.afirmacion}
                                </p>
                                <div className="flex items-center gap-2.5">
                                  <span
                                    className="text-[10.5px] font-semibold tabular-nums"
                                    style={{ color: htiColor(h.hti) }}
                                  >
                                    HTI {h.hti}
                                  </span>
                                  <span className="text-stone-200 dark:text-stone-700">·</span>
                                  <span className="text-[10.5px] text-stone-400 dark:text-stone-500 truncate">
                                    {h.fuente_nombre}
                                  </span>
                                  {h.estado === 'en_revision' && (
                                    <>
                                      <span className="text-stone-200 dark:text-stone-700">·</span>
                                      <span className="text-[9.5px] font-semibold text-amber-500">En revisión</span>
                                    </>
                                  )}
                                </div>
                              </div>
                              <svg className="w-3 h-3 shrink-0 text-stone-300 dark:text-stone-700 group-hover:text-stone-400 transition-colors mt-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <polyline points="9 18 15 12 9 6"/>
                              </svg>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}