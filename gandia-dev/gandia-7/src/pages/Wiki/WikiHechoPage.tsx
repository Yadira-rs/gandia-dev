// src/pages/Wiki/WikiHechoPage.tsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase }               from '../../lib/supabaseClient'
import { useUser }                from '../../context/UserContext'

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface WikiHecho {
  id:             string
  afirmacion:     string
  contexto:       string | null
  dominio:        string
  tema:           string
  jurisdiccion:   string
  fuente_nombre:  string
  fuente_articulo: string | null
  fuente_url:     string | null
  fuente_fecha:   string | null
  hti:            number
  calidad_fuente: number
  num_fuentes:    number
  sin_conflictos: boolean
  estado:         string
  vigente_desde:  string | null
  verificado_at:  string
  proxima_revision: string
  origen:         string
}

interface HechoRelacionado {
  id:          string
  afirmacion:  string
  hti:         number
  tipo:        string
}

interface NoticiaVinculada {
  id:     string
  titulo: string
  fuente: string
  publicada_en: string
}

// ─── Config ───────────────────────────────────────────────────────────────────

const DOMINIO_LABEL: Record<string, string> = {
  sanidad:     'Sanidad Animal',
  exportacion: 'Exportación',
  regulacion:  'Regulación Federal',
  razas:       'Razas y Genética',
  nutricion:   'Nutrición',
  mercado:     'Mercado y Precios',
  bienestar:   'Bienestar Animal',
  clima:       'Clima y Riesgo',
}

function htiColor(hti: number) {
  if (hti >= 80) return '#2FAF8F'
  if (hti >= 60) return '#f59e0b'
  return '#ef4444'
}

function htiLabel(hti: number) {
  if (hti >= 85) return 'Regulación oficial'
  if (hti >= 70) return 'Fuente verificada'
  if (hti >= 55) return 'En revisión'
  return 'Confianza baja'
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-MX', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

function relativeDate(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  if (diff === 0) return 'hoy'
  if (diff === 1) return 'ayer'
  if (diff < 30)  return `hace ${diff} días`
  return formatDate(iso)
}

// ─── Componente ───────────────────────────────────────────────────────────────

export default function WikiHechoPage() {
  const { id }     = useParams<{ id: string }>()
  const navigate   = useNavigate()
  const { profile } = useUser()

  const [hecho,       setHecho]       = useState<WikiHecho | null>(null)
  const [relacionados, setRelacionados] = useState<HechoRelacionado[]>([])
  const [noticias,    setNoticias]    = useState<NoticiaVinculada[]>([])
  const [loading,     setLoading]     = useState(true)
  const [copied,      setCopied]      = useState(false)

  const canPropose = ((profile?.role as string) === 'editor' || (profile?.role as string) === 'admin') ||
    false // Se podría extender con creator nivel 3+

  useEffect(() => {
    if (!id) return
    const load = async () => {
      const [{ data: h }, { data: rel }, { data: notLinks }] = await Promise.all([
        supabase.from('wiki_hechos').select('*').eq('id', id).single(),
        supabase
          .from('wiki_hecho_relaciones')
          .select('hecho_destino,tipo')
          .eq('hecho_origen', id)
          .limit(4),
        supabase
          .from('wiki_hecho_noticias')
          .select('noticia_id')
          .eq('hecho_id', id)
          .limit(5),
      ])

      setHecho(h as WikiHecho)

      // Hechos relacionados
      if (rel && rel.length > 0) {
        const ids = rel.map((r: { hecho_destino: string; tipo: string }) => r.hecho_destino)
        const { data: hechoRel } = await supabase
          .from('wiki_hechos')
          .select('id,afirmacion,hti')
          .in('id', ids)
          .eq('estado', 'activo')
        if (hechoRel) {
          const conTipo = (hechoRel as Omit<HechoRelacionado, 'tipo'>[]).map(hr => ({
            ...hr,
            tipo: (rel as { hecho_destino: string; tipo: string }[]).find(r => r.hecho_destino === hr.id)?.tipo ?? 'complementa',
          }))
          setRelacionados(conTipo)
        }
      }

      // Noticias vinculadas
      if (notLinks && notLinks.length > 0) {
        const notIds = (notLinks as { noticia_id: string }[]).map(n => n.noticia_id)
        const { data: nots } = await supabase
          .from('noticias')
          .select('id,titulo,fuente,publicada_en')
          .in('id', notIds)
        setNoticias((nots as NoticiaVinculada[]) ?? [])
      }

      setLoading(false)
    }
    void load()
  }, [id])

  const copyLink = () => {
    void navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return (
    <div className="min-h-screen bg-[#fafaf9] dark:bg-[#0c0a09] flex items-center justify-center">
      <div className="w-5 h-5 border-2 border-[#2FAF8F] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!hecho) return (
    <div className="min-h-screen bg-[#fafaf9] dark:bg-[#0c0a09] flex items-center justify-center">
      <div className="text-center">
        <p className="text-[14px] text-stone-400 dark:text-stone-500 mb-4">Hecho no encontrado.</p>
        <button onClick={() => navigate('/wiki')} className="text-[12.5px] font-medium text-[#2FAF8F]">
          ← Volver a Wiki
        </button>
      </div>
    </div>
  )

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
        <div className="max-w-[720px] mx-auto px-6 pt-10 pb-24">

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-8 text-[12.5px] flex-wrap fu">
            <button onClick={() => navigate('/wiki')}
              className="text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-200 transition-colors">
              Wiki Handeia
            </button>
            <span className="text-stone-300 dark:text-stone-700">/</span>
            <button onClick={() => navigate(`/wiki/dominio/${hecho.dominio}`)}
              className="text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-200 transition-colors">
              {DOMINIO_LABEL[hecho.dominio] ?? hecho.dominio}
            </button>
            <span className="text-stone-300 dark:text-stone-700">/</span>
            <span className="text-stone-500 dark:text-stone-400 truncate max-w-[200px]">
              {hecho.tema.replace(/-/g, ' ')}
            </span>
          </div>

          {/* Banner en revisión */}
          {hecho.estado === 'en_revision' && (
            <div className="fu mb-6 flex items-center gap-3 p-3.5 rounded-xl bg-amber-500/08 dark:bg-amber-500/10 border border-amber-500/20"
              style={{ animationDelay: '40ms' }}>
              <svg className="w-4 h-4 text-amber-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <p className="text-[12.5px] text-amber-700 dark:text-amber-400">
                Este Hecho tiene una propuesta de actualización en revisión editorial.
              </p>
            </div>
          )}

          {/* La afirmación — el corazón */}
          <div className="fu mb-6" style={{ animationDelay: '60ms' }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10.5px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-[0.08em]">
                {DOMINIO_LABEL[hecho.dominio]} · {hecho.tema.replace(/-/g, ' ')}
              </span>
              {hecho.jurisdiccion !== 'MX' && (
                <>
                  <span className="text-stone-300 dark:text-stone-700">·</span>
                  <span className="text-[10.5px] text-stone-400 dark:text-stone-500">{hecho.jurisdiccion}</span>
                </>
              )}
            </div>

            <h1 className="wks text-[22px] leading-[1.35] text-stone-900 dark:text-stone-50 mb-6">
              {hecho.afirmacion}
            </h1>

            {/* Barra de confianza */}
            <div className="flex items-center gap-4 py-3.5 px-0 border-b border-stone-100 dark:border-stone-800/50">
              {/* HTI */}
              <div className="flex items-center gap-2.5 shrink-0">
                <span
                  className="text-[20px] font-semibold tabular-nums leading-none"
                  style={{ color: htiColor(hecho.hti) }}
                >
                  {hecho.hti}
                </span>
                <div>
                  <p className="text-[11.5px] font-semibold text-stone-700 dark:text-stone-300 leading-tight">
                    {htiLabel(hecho.hti)}
                  </p>
                  <p className="text-[10px] text-stone-400 dark:text-stone-500 leading-tight mt-0.5">
                    Índice de confianza
                  </p>
                </div>
              </div>

              <div className="h-6 w-px bg-stone-200 dark:bg-stone-800" />

              {/* Fuente */}
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-stone-700 dark:text-stone-300 truncate">
                  {hecho.fuente_nombre}
                  {hecho.fuente_articulo && (
                    <span className="font-normal text-stone-400 dark:text-stone-500 ml-1">· {hecho.fuente_articulo}</span>
                  )}
                </p>
                <p className="text-[10.5px] text-stone-400 dark:text-stone-500">
                  Verificado {relativeDate(hecho.verificado_at)}
                  {' · '}Próxima revisión {formatDate(hecho.proxima_revision)}
                </p>
              </div>

              {/* Link oficial */}
              {hecho.fuente_url && (
                <a
                  href={hecho.fuente_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 flex items-center gap-1.5 text-[11px] font-medium text-[#2FAF8F] hover:underline"
                >
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                    <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                  Fuente oficial
                </a>
              )}
            </div>
          </div>

          {/* Contexto */}
          {hecho.contexto && (
            <div className="fu mb-8" style={{ animationDelay: '120ms' }}>
              <p className="text-[10.5px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-[0.08em] mb-3">
                Contexto
              </p>
              <p className="text-[14px] text-stone-600 dark:text-stone-300 leading-[1.8]">
                {hecho.contexto}
              </p>
            </div>
          )}

          {/* Metadatos del Hecho */}
          <div
            className="fu mb-8 grid grid-cols-3 gap-3"
            style={{ animationDelay: '160ms' }}
          >
            {[
              { label: 'Fuentes',     val: `${hecho.num_fuentes} ${hecho.num_fuentes === 1 ? 'fuente' : 'fuentes'}` },
              { label: 'Origen',      val: hecho.origen === 'scraper' ? 'Scraper oficial' : hecho.origen === 'propuesta' ? 'Propuesta Creador' : 'Editorial' },
              { label: 'Conflictos',  val: hecho.sin_conflictos ? 'Sin conflictos' : 'Tiene conflictos' },
            ].map(m => (
              <div key={m.label} className="p-3 rounded-xl bg-stone-50 dark:bg-stone-900/50 border border-stone-200/50 dark:border-stone-800/40">
                <p className="text-[10.5px] text-stone-400 dark:text-stone-500 mb-0.5">{m.label}</p>
                <p className="text-[13px] font-medium text-stone-700 dark:text-stone-300">{m.val}</p>
              </div>
            ))}
          </div>

          {/* Noticias vinculadas */}
          {noticias.length > 0 && (
            <div className="fu mb-8" style={{ animationDelay: '200ms' }}>
              <p className="text-[10.5px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-[0.08em] mb-3">
                Noticias relacionadas
              </p>
              <div className="space-y-2">
                {noticias.map(n => (
                  <button
                    key={n.id}
                    onClick={() => navigate(`/noticias/${n.id}`)}
                    className="w-full text-left p-3.5 rounded-xl border border-stone-200/70 dark:border-stone-800/50 bg-white dark:bg-[#141210] hover:border-stone-300 dark:hover:border-stone-700 transition-all group"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium text-stone-700 dark:text-stone-300 group-hover:text-stone-900 dark:group-hover:text-white transition-colors truncate">
                          {n.titulo}
                        </p>
                        <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-0.5">
                          {n.fuente} · {relativeDate(n.publicada_en)}
                        </p>
                      </div>
                      <svg className="w-3.5 h-3.5 shrink-0 text-stone-300 dark:text-stone-700 group-hover:text-stone-400 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <polyline points="9 18 15 12 9 6"/>
                      </svg>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Hechos relacionados */}
          {relacionados.length > 0 && (
            <div className="fu mb-8" style={{ animationDelay: '240ms' }}>
              <p className="text-[10.5px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-[0.08em] mb-3">
                Hechos relacionados
              </p>
              <div className="divide-y divide-stone-100 dark:divide-stone-800/40">
                {relacionados.map(r => (
                  <button
                    key={r.id}
                    onClick={() => navigate(`/wiki/hecho/${r.id}`)}
                    className="w-full text-left py-3 group flex items-start gap-3"
                  >
                    <div className="shrink-0 mt-[5px] w-1.5 h-1.5 rounded-full bg-stone-300 dark:bg-stone-700 group-hover:bg-[#2FAF8F] transition-colors" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-[0.06em] mb-0.5">
                        {r.tipo}
                      </p>
                      <p className="text-[13px] text-stone-700 dark:text-stone-300 leading-[1.5] line-clamp-2 group-hover:text-stone-900 dark:group-hover:text-stone-100 transition-colors">
                        {r.afirmacion}
                      </p>
                    </div>
                    <svg className="w-3 h-3 shrink-0 text-stone-300 dark:text-stone-700 group-hover:text-stone-400 transition-colors mt-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Acciones */}
          <div className="fu flex items-center gap-3 pt-6 border-t border-stone-200/60 dark:border-stone-800/50" style={{ animationDelay: '280ms' }}>
            <button
              onClick={copyLink}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12px] font-medium text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-stone-800/50 hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors"
            >
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
              {copied ? 'Copiado' : 'Copiar enlace'}
            </button>

            {canPropose && (
              <button
                onClick={() => navigate(`/creadores/wiki/nuevo?hecho=${hecho.id}&tipo=actualizacion`)}
                className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12px] font-medium text-[#2FAF8F] border border-[#2FAF8F]/30 hover:bg-[#2FAF8F]/10 transition-colors"
              >
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                Proponer actualización
              </button>
            )}

            <button
              onClick={() => navigate(`/creadores/wiki/nuevo?hecho=${hecho.id}&tipo=correccion`)}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12px] font-medium text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors ml-auto"
            >
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              Reportar error
            </button>
          </div>

        </div>
      </div>
    </>
  )
}