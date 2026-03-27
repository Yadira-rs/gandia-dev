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

  const loadHechosGeneral = useCallback(async (dom: string) => {
    setLoadingH(true)
    const { data } = await supabase
      .from('wiki_hechos')
      .select('id,afirmacion,hti,fuente_nombre,verificado_at,estado')
      .eq('dominio', dom)
      .in('estado', ['activo', 'en_revision'])
      .order('hti', { ascending: false })
    setHechos((data as WikiHecho[]) ?? [])
    setLoadingH(false)
  }, [])

  const selectTema = async (tema: WikiTema) => {
    setTemaActivo(tema)
    if (tema.id === 'virtual-general') {
      await loadHechosGeneral(dominio ?? '')
    } else {
      await loadHechos(tema.slug, dominio ?? '')
    }
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
      
      let finalTemas = temasList

      // Si no hay temas definidos pero hay hechos, crear un tema virtual "General"
      if (temasList.length === 0) {
        const { count } = await supabase
          .from('wiki_hechos')
          .select('*', { count: 'exact', head: true })
          .eq('dominio', dominio)
          .eq('estado', 'activo')
        
        if ((count ?? 0) > 0) {
          finalTemas = [{
            id: 'virtual-general',
            slug: 'general',
            titulo: 'Información General',
            descripcion: 'Hechos verificados en este dominio.',
            hechos_count: count ?? 0
          }]
        }
      } else {
        // Contar hechos por tema (solo si hay temas reales)
        finalTemas = await Promise.all(
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
      }

      setTemas(finalTemas)

      // Si hay temas, cargar el primero
      if (finalTemas.length > 0) {
        setTemaActivo(finalTemas[0] ?? null)
        // Intentar cargar por el slug del tema activo
        // Pero si es el virtual, cargar todos los hechos del dominio que no tengan tema o sean del slug
        if (finalTemas[0].slug === 'general' && finalTemas[0].id === 'virtual-general') {
          await loadHechosGeneral(dominio)
        } else {
          await loadHechos(finalTemas[0]?.slug ?? '', dominio)
        }
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
            <div className="fu" style={{ animationDelay: '100ms' }}>
              {/* Selector de temas (Solo si hay más de 1) */}
              {temas.length > 1 && (
                <div className="mb-10 border-b border-stone-200 dark:border-stone-800">
                  <div className="flex gap-8 overflow-x-auto pb-px scrollbar-hide">
                    {temas.map(t => {
                      const isActive = temaActivo?.id === t.id;
                      return (
                        <button
                          key={t.id}
                          onClick={() => void selectTema(t)}
                          className={`pb-4 text-[13.5px] font-medium transition-all relative shrink-0 ${
                            isActive 
                              ? 'text-stone-900 dark:text-stone-50' 
                              : 'text-stone-400 dark:text-stone-600 hover:text-stone-600 dark:hover:text-stone-400'
                          }`}
                        >
                          {t.titulo}
                          {isActive && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-stone-900 dark:bg-stone-50" />
                          )}
                          {(t.hechos_count ?? 0) > 0 && (
                            <span className="ml-1.5 text-[10px] opacity-60">({t.hechos_count})</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Contenido — Hechos */}
              <div className="min-w-0">
                {temaActivo && (
                  <>
                    <div className="mb-8">
                      <h2 className="text-[18px] font-semibold text-stone-800 dark:text-stone-100 mb-1.5">
                        {temaActivo.titulo}
                      </h2>
                      {temaActivo.descripcion && (
                        <p className="text-[13px] text-stone-400 dark:text-stone-500 max-w-[600px] leading-relaxed">
                          {temaActivo.descripcion}
                        </p>
                      )}
                    </div>

                    {loadingH ? (
                      <div className="flex justify-center py-12">
                        <div className="w-5 h-5 border-[1.5px] border-stone-300 dark:border-stone-700 border-t-stone-900 dark:border-t-stone-50 rounded-full animate-spin" />
                      </div>
                    ) : hechos.length === 0 ? (
                      <div className="py-12 bg-white dark:bg-stone-900/20 rounded-2xl border border-stone-100 dark:border-stone-800/50 text-center">
                        <p className="text-[13px] text-stone-400 dark:text-stone-500">
                          Sin hechos verificados en este tema.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {hechos.map((h, i) => (
                          <button
                            key={h.id}
                            onClick={() => navigate(`/wiki/hecho/${h.id}`)}
                            className="w-full text-left p-5 rounded-2xl bg-white dark:bg-[#121212] border border-stone-100 dark:border-stone-900/50 hover:border-stone-200 dark:hover:border-stone-800 hover:shadow-sm transition-all group fu"
                            style={{ animationDelay: `${i * 40}ms` }}
                          >
                            <div className="flex items-start gap-4">
                              <div className="flex-1 min-w-0">
                                <p className="text-[14.5px] text-stone-700 dark:text-stone-300 leading-relaxed font-medium mb-3 group-hover:text-stone-900 dark:group-hover:text-stone-50 transition-colors">
                                  {h.afirmacion}
                                </p>
                                <div className="flex flex-wrap items-center gap-3">
                                  <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-stone-50 dark:bg-stone-800/50 border border-stone-100 dark:border-stone-800`}
                                    style={{ color: htiColor(h.hti) }}>
                                    HTI {h.hti}
                                  </div>
                                  <span className="text-stone-200 dark:text-stone-800 text-[10px]">|</span>
                                  <span className="text-[11px] text-stone-400 dark:text-stone-500 font-medium">
                                    {h.fuente_nombre}
                                  </span>
                                  {h.estado === 'en_revision' && (
                                    <>
                                      <span className="w-1 h-1 rounded-full bg-stone-300 dark:bg-stone-700" />
                                      <span className="text-[10px] font-bold text-amber-500/80 uppercase tracking-widest">Revisión</span>
                                    </>
                                  )}
                                </div>
                              </div>
                              <div className="mt-1 p-2 rounded-xl bg-stone-50 dark:bg-stone-950/50 group-hover:bg-stone-100 dark:group-hover:bg-stone-900 transition-colors">
                                <svg className="w-3.5 h-3.5 text-stone-300 dark:text-stone-700 group-hover:text-stone-500 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                  <polyline points="9 18 15 12 9 6"/>
                                </svg>
                              </div>
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