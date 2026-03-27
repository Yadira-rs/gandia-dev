import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface Submission {
  id:          string
  user_id:     string
  tipo:        string
  titulo:      string
  contenido:   string
  estado_mx:   string | null
  region:      string | null
  source_links: string[] | null
  adjuntos:    unknown
  status:      string
  trust_index: number
  created_at:  string
}

interface LogEntry {
  id:          string
  accion:      string
  descripcion: string
  created_at:  string
}

interface WikiPropuesta {
  id:               string
  user_id:          string
  tipo_propuesta:   string
  afirmacion:       string
  contexto:         string | null
  dominio:          string
  tema_slug:        string | null
  fuente_nombre:    string
  fuente_articulo:  string | null
  fuente_url:       string | null
  status:           string
  notas_moderacion: string | null
  created_at:       string
}

const TIPO_PROP_LABELS: Record<string, string> = {
  nuevo:          'Hecho nuevo',
  correccion:     'Corrección',
  actualizacion:  'Actualización',
}

const TIPO_LABELS: Record<string, string> = {
  noticia:       'Noticia',
  alerta:        'Alerta sanitaria',
  reporte_campo: 'Reporte de campo',
  correccion:    'Corrección',
  pipeline_ia:   'Pipeline IA',
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3600000)
  const d = Math.floor(diff / 86400000)
  if (h < 1)  return 'hace menos de 1h'
  if (h < 24) return `hace ${h}h`
  return `hace ${d}d`
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function ModeradorPanelPage() {
  const navigate = useNavigate()

  const [checking,     setChecking]     = useState(true)
  const [authorized,   setAuthorized]   = useState(false)
  const [modNombre,    setModNombre]    = useState('')
  const [submissions,  setSubmissions]  = useState<Submission[]>([])
  const [loading,      setLoading]      = useState(false)
  const [selected,     setSelected]     = useState<Submission | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [toast,        setToast]        = useState('')
  const [filtro,       setFiltro]       = useState<'pendiente' | 'publicado' | 'rechazado'>('pendiente')
  // modUserId removed — unused
  const [activeTab,    setActiveTab]    = useState<'aportes' | 'wiki' | 'historial'>('aportes')
  const [log,          setLog]          = useState<LogEntry[]>([])
  const [propuestas,   setPropuestas]   = useState<WikiPropuesta[]>([])
  const [selectedProp, setSelectedProp] = useState<WikiPropuesta | null>(null)
  const [propFiltro,   setPropFiltro]   = useState<'pendiente' | 'aprobado' | 'rechazado'>('pendiente')

  // ── Verificar acceso ──────────────────────────────────────────────────────
  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { navigate('/moderador/acceso', { replace: true }); return }

      const { data: cp } = await supabase
        .from('creator_profiles')
        .select('nivel, status, bio, creator_type')
        .eq('user_id', user.id)
        .single()

      if (!cp || cp.nivel < 3 || cp.status !== 'activo') {
        navigate('/moderador/acceso', { replace: true })
        return
      }

      setModNombre(user.email ?? 'Moderador')
      setAuthorized(true)
      setChecking(false)
    }
    void check()
  }, [navigate])

  // ── Cargar submissions ────────────────────────────────────────────────────
  const loadSubmissions = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('user_submissions')
      .select('*')
      .order('created_at', { ascending: false })
    setSubmissions((data as Submission[]) ?? [])
    setLoading(false)
  }, [])

  const loadLog = useCallback(async () => {
    const { data } = await supabase
      .from('moderation_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
    setLog((data as LogEntry[]) ?? [])
  }, [])

  const loadPropuestas = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('wiki_propuestas')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) {
        console.error('[ModeradorPanel] loadPropuestas error:', error)
        showToast('Error cargando Wiki: ' + error.message)
      }
      setPropuestas((data as WikiPropuesta[]) ?? [])
    } catch (err) {
      console.error('[ModeradorPanel] loadPropuestas catch:', err)
      showToast('Error de conexión con la Wiki')
    }
  }, [])

  useEffect(() => {
    if (authorized) { void loadSubmissions(); void loadLog(); void loadPropuestas() }
  }, [authorized, loadSubmissions, loadLog, loadPropuestas])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3500)
  }

  // ── Acciones ─────────────────────────────────────────────────────────────
  const approve = async (s: Submission) => {
    setActionLoading(true)
    try {
      const slug = s.titulo.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').slice(0, 80)
        + '-' + Date.now().toString(36)

      // Leer metadatos del pipeline si existen
      let adj: Record<string, unknown> = {}
      try { if (s.adjuntos) adj = JSON.parse(s.adjuntos as unknown as string) } catch { /* ok */ }
      const hasMeta = adj.origen === 'pipeline_ia'

      const { error: insertErr } = await supabase.from('noticias').insert({
        slug,
        titulo:          s.titulo,
        cuerpo:          hasMeta ? (adj.resumen_general as string ?? s.contenido) : s.contenido,
        fuente:          hasMeta ? (adj.fuente as string ?? 'Handeia Radar') : 'Comunidad Handeia',
        fuente_origen:   'NEWSAPI',
        categoria:       hasMeta ? (adj.categoria as string ?? 'GENERAL') : 'GENERAL',
        urgente:         hasMeta ? (adj.urgente as boolean ?? false) : false,
        urgencia_nivel:  hasMeta ? String(adj.urgencia_nivel ?? 'baja').toLowerCase() : 'baja',
        resumenes_ia:    hasMeta ? (adj.resumenes_ia ?? { Productor: s.contenido.slice(0,200), Exportador: s.contenido.slice(0,200), MVZ: s.contenido.slice(0,200), Union: s.contenido.slice(0,200), Auditor: s.contenido.slice(0,200) }) : { Productor: s.contenido.slice(0,200), Exportador: s.contenido.slice(0,200), MVZ: s.contenido.slice(0,200), Union: s.contenido.slice(0,200), Auditor: s.contenido.slice(0,200) },
        resumen_general: hasMeta ? (adj.resumen_general as string ?? s.contenido.slice(0,300)) : s.contenido.slice(0,300),
        impacto_ia:      hasMeta ? (adj.impacto_ia as string ?? '') : '',
        acciones_ia:     '[]',
        relevancia:      hasMeta ? (adj.relevancia ?? { Productor:5, Exportador:5, MVZ:5, Union:5, Auditor:5 }) : { Productor:5, Exportador:5, MVZ:5, Union:5, Auditor:5 },
        relacionadas:    '{}',
        lectura_minutos: Math.max(1, Math.ceil(s.contenido.split(' ').length / 200)),
        activa:          true,
        procesada_ia:    hasMeta,
        publicada_en:    new Date().toISOString(),
        trust_index:     s.trust_index,
        url_original:    s.source_links?.[0] ?? null,
      })
      if (insertErr) throw new Error('INSERT noticias: ' + insertErr.message)
      await supabase.from('user_submissions').update({ status: 'publicado' }).eq('id', s.id)
      await supabase.from('moderation_log').insert({
        accion:      'aporte_publicado',
        descripcion: `"${s.titulo}" publicado en el feed`,
        moderador:   modNombre,
      })
      await loadSubmissions(); await loadLog()
      setSelected(null)
      showToast('Noticia publicada en el feed')
    } catch (err) {
      console.error('[ModeradorPanel] approve error:', err)
      showToast('Error al publicar: ' + (err instanceof Error ? err.message : JSON.stringify(err)))
    } finally { setActionLoading(false) }
  }

  const reject = async (id: string) => {
    setActionLoading(true)
    try {
      const sub = submissions.find(s => s.id === id)
      await supabase.from('user_submissions').update({ status: 'rechazado' }).eq('id', id)
      await supabase.from('moderation_log').insert({
        accion: 'aporte_rechazado',
        descripcion: `"${sub?.titulo ?? id}" rechazado`,
        moderador: modNombre,
      })
      await loadSubmissions(); await loadLog()
      setSelected(null)
      showToast('Aporte rechazado')
    } catch { showToast('Error al rechazar') }
    finally { setActionLoading(false) }
  }

  const updateHTI = async (id: string, newScore: number) => {
    await supabase.from('user_submissions').update({ trust_index: newScore }).eq('id', id)
    setSubmissions(prev => prev.map(s => s.id === id ? { ...s, trust_index: newScore } : s))
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, trust_index: newScore } : prev)
    showToast(`HTI actualizado a ${newScore}`)
  }

  const logout = async () => {
    await supabase.auth.signOut()
    navigate('/moderador/acceso', { replace: true })
  }

  const filtered = submissions.filter(s => s.status === filtro)

  const approveWiki = async (p: WikiPropuesta) => {
    setActionLoading(true)
    try {
      const { data: hecho, error: insertErr } = await supabase.from('wiki_hechos').insert({
        afirmacion:      p.afirmacion,
        contexto:        p.contexto,
        dominio:         p.dominio,
        tema:            p.tema_slug ?? p.dominio,
        fuente_nombre:   p.fuente_nombre,
        fuente_articulo: p.fuente_articulo,
        fuente_url:      p.fuente_url,
        calidad_fuente:  75,
        num_fuentes:     1,
        sin_conflictos:  true,
        origen:          'propuesta',
        estado:          'activo',
      }).select('id').single()
      if (insertErr) throw insertErr
      await supabase.from('wiki_propuestas').update({
        status:          'aprobado',
        hecho_creado_id: (hecho as { id: string }).id,
        revisado_at:     new Date().toISOString(),
      }).eq('id', p.id)
      await supabase.from('moderation_log').insert({
        accion:      'wiki_aprobado',
        descripcion: `Propuesta Wiki aprobada: "${p.afirmacion.slice(0, 60)}..."`,
        moderador:   modNombre,
      })
      void loadPropuestas(); void loadLog()
      setSelectedProp(null)
      showToast('Hecho publicado en Wiki Handeia')
    } catch (err) {
      showToast('Error: ' + (err instanceof Error ? err.message : 'desconocido'))
    } finally { setActionLoading(false) }
  }

  const rejectWiki = async (id: string) => {
    setActionLoading(true)
    await supabase.from('wiki_propuestas').update({
      status:      'rechazado',
      revisado_at: new Date().toISOString(),
    }).eq('id', id)
    await supabase.from('moderation_log').insert({
      accion:      'wiki_rechazado',
      descripcion: 'Propuesta Wiki rechazada',
      moderador:   modNombre,
    })
    void loadPropuestas(); void loadLog()
    setSelectedProp(null)
    showToast('Propuesta rechazada')
    setActionLoading(false)
  }

  // ── LOADING / AUTH CHECK ──────────────────────────────────────────────────
  if (checking) return (
    <div className="min-h-screen bg-[#0c0a09] flex items-center justify-center">
      <div className="w-5 h-5 border-2 border-[#2FAF8F] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!authorized) return null

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        * { -webkit-font-smoothing: antialiased; }
        body, * { font-family: 'Geist', system-ui, sans-serif; }
      `}</style>

      <div className="min-h-screen bg-[#0c0a09] text-[#FAFAFA]">

        {/* Header */}
        <div className="sticky top-0 z-50 border-b border-[#2A2A2A] bg-[#0c0a09]/95 backdrop-blur-xl">
          <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#2FAF8F]/15 flex items-center justify-center">
                <svg className="w-4 h-4 text-[#2FAF8F]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <div>
                <p className="text-[14px] font-semibold leading-tight">Panel Moderador</p>
                <p className="text-[11px] text-[#666]">{modNombre}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/noticias')}
                className="px-3 py-1.5 rounded-lg text-[12px] text-[#aaa] border border-[#2A2A2A] hover:bg-[#1A1A1A] transition-colors"
              >
                Ver Radar
              </button>
              <button
                onClick={logout}
                className="px-3 py-1.5 rounded-lg text-[12px] text-[#aaa] border border-[#2A2A2A] hover:bg-red-950/30 hover:border-red-500/30 hover:text-red-400 transition-colors"
              >
                Salir
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 py-8">

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            {[
              { label: 'Pendientes', val: submissions.filter(s => s.status === 'pendiente').length,  color: 'text-orange-400' },
              { label: 'Publicados', val: submissions.filter(s => s.status === 'publicado').length,  color: 'text-[#2FAF8F]' },
              { label: 'Rechazados', val: submissions.filter(s => s.status === 'rechazado').length,  color: 'text-red-400'    },
            ].map(m => (
              <div key={m.label} className="p-5 rounded-2xl border border-[#2A2A2A] bg-[#121212]">
                <p className="text-[12px] text-[#666] mb-1">{m.label}</p>
                <p className={`text-[28px] font-bold tabular-nums ${m.color}`}>{m.val}</p>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex p-1 rounded-xl border border-[#2A2A2A] bg-[#121212] gap-1 w-fit mb-6">
            {(['aportes', 'wiki', 'historial'] as const).map(t => (
              <button key={t} onClick={() => setActiveTab(t)}
                className={`px-4 py-1.5 rounded-lg text-[12px] font-medium transition-all capitalize ${
                  activeTab === t ? 'bg-[#2FAF8F] text-white shadow-md' : 'text-[#666] hover:text-white'
                }`}>
                {t === 'aportes' ? 'Aportes' : t === 'wiki' ? 'Wiki' : 'Historial'}
              </button>
            ))}
          </div>

          {/* ── APORTES ── */}
          {activeTab === 'aportes' && (
          <div>
            <div className="flex p-1 rounded-xl border border-[#2A2A2A] bg-[#121212] gap-1 w-fit mb-5">
            {(['pendiente', 'publicado', 'rechazado'] as const).map(f => (
              <button key={f} onClick={() => setFiltro(f)}
                className={`px-4 py-1.5 rounded-lg text-[12px] font-medium transition-all capitalize ${
                  filtro === f ? 'bg-[#2FAF8F] text-white shadow-md' : 'text-[#666] hover:text-white'
                }`}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
            </div>

          {/* Lista */}
          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => (
                <div key={i} className="h-20 rounded-2xl border border-[#2A2A2A] bg-[#121212] animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-20 rounded-2xl border border-[#2A2A2A] bg-[#121212] text-center">
              <p className="text-[#555]">Sin aportes en este estado</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(s => (
                <div key={s.id} className="p-4 rounded-2xl border border-[#2A2A2A] bg-[#121212] hover:border-[#3A3A3A] transition-all">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setSelected(s)}>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-[10px] font-semibold text-[#666] uppercase tracking-wide">
                          {TIPO_LABELS[s.tipo] ?? s.tipo}
                        </span>
                        {s.estado_mx && <span className="text-[10px] text-[#555]">· {s.estado_mx}</span>}
                        <span className="text-[10px] text-[#444]">· {timeAgo(s.created_at)}</span>
                      </div>
                      <p className="text-[14px] font-medium text-stone-200 truncate">{s.titulo}</p>
                      <p className="text-[12px] text-[#666] mt-0.5 line-clamp-1">{s.contenido}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-semibold text-[#2FAF8F] bg-[#2FAF8F]/10 px-2 py-0.5 rounded">
                        HTI {s.trust_index}
                      </span>
                      {s.status === 'pendiente' && (
                        <>
                          <button onClick={() => approve(s)} disabled={actionLoading}
                            className="p-2 rounded-lg bg-[#2FAF8F]/10 text-[#2FAF8F] hover:bg-[#2FAF8F]/25 transition-all disabled:opacity-50">
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                          </button>
                          <button onClick={() => reject(s.id)} disabled={actionLoading}
                            className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/25 transition-all disabled:opacity-50">
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          </div>
          )}


          {/* ── WIKI ── */}
          {activeTab === 'wiki' && (
            <div>
              <div className="flex p-1 rounded-xl border border-[#2A2A2A] bg-[#121212] gap-1 w-fit mb-5">
                {(['pendiente', 'aprobado', 'rechazado'] as const).map(f => (
                  <button key={f} onClick={() => setPropFiltro(f)}
                    className={`px-4 py-1.5 rounded-lg text-[12px] font-medium transition-all capitalize ${
                      propFiltro === f ? 'bg-[#2FAF8F] text-white shadow-md' : 'text-[#666] hover:text-white'
                    }`}>
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                  { label: 'Pendientes', val: propuestas.filter(p => p.status === 'pendiente').length,  color: 'text-orange-400' },
                  { label: 'Aprobadas',  val: propuestas.filter(p => p.status === 'aprobado').length,   color: 'text-[#2FAF8F]' },
                  { label: 'Rechazadas', val: propuestas.filter(p => p.status === 'rechazado').length,  color: 'text-red-400'   },
                ].map(m => (
                  <div key={m.label} className="p-4 rounded-2xl border border-[#2A2A2A] bg-[#121212]">
                    <p className="text-[11px] text-[#666] mb-1">{m.label}</p>
                    <p className={`text-[24px] font-bold tabular-nums ${m.color}`}>{m.val}</p>
                  </div>
                ))}
              </div>

              {propuestas.filter(p => p.status === propFiltro).length === 0 ? (
                <div className="py-20 rounded-2xl border border-[#2A2A2A] bg-[#121212] text-center">
                  <p className="text-[#555]">Sin propuestas en este estado</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {propuestas.filter(p => p.status === propFiltro).map(p => (
                    <div key={p.id}
                      className="p-4 rounded-2xl border border-[#2A2A2A] bg-[#121212] hover:border-[#3A3A3A] transition-all cursor-pointer"
                      onClick={() => setSelectedProp(p)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <span className="text-[9.5px] font-semibold text-[#2FAF8F] bg-[#2FAF8F]/10 px-2 py-0.5 rounded uppercase tracking-wide">
                              Wiki · {TIPO_PROP_LABELS[p.tipo_propuesta] ?? p.tipo_propuesta}
                            </span>
                            <span className="text-[10px] text-[#666] capitalize">{p.dominio}</span>
                            <span className="text-[10px] text-[#444]">· {timeAgo(p.created_at)}</span>
                          </div>
                          <p className="text-[13.5px] font-medium text-stone-200 leading-snug line-clamp-2">{p.afirmacion}</p>
                          <p className="text-[11.5px] text-[#555] mt-1 truncate">Fuente: {p.fuente_nombre}</p>
                        </div>
                        {p.status === 'pendiente' && (
                          <div className="flex items-center gap-2 shrink-0">
                            <button onClick={e => { e.stopPropagation(); void approveWiki(p) }} disabled={actionLoading}
                              className="p-2 rounded-lg bg-[#2FAF8F]/10 text-[#2FAF8F] hover:bg-[#2FAF8F]/25 transition-all disabled:opacity-50">
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                            </button>
                            <button onClick={e => { e.stopPropagation(); void rejectWiki(p.id) }} disabled={actionLoading}
                              className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/25 transition-all disabled:opacity-50">
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedProp && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-100 flex items-center justify-center p-4"
                     onClick={() => setSelectedProp(null)}>
                  <div className="w-full max-w-lg bg-[#0c0a09] border border-[#2A2A2A] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
                       onClick={e => e.stopPropagation()}>
                    <div className="px-6 py-5 border-b border-[#2A2A2A] flex items-start justify-between">
                      <div>
                        <p className="text-[11px] text-[#2FAF8F] uppercase tracking-wide mb-1">Wiki · {TIPO_PROP_LABELS[selectedProp.tipo_propuesta]}</p>
                        <p className="text-[10px] text-[#666] capitalize">{selectedProp.dominio}</p>
                      </div>
                      <button onClick={() => setSelectedProp(null)} className="p-1.5 rounded-lg hover:bg-[#1A1A1A] text-[#666]">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 space-y-5">
                      <div>
                        <p className="text-[10px] font-semibold text-[#555] uppercase tracking-wide mb-2">Afirmación</p>
                        <p className="text-[14px] text-stone-200 leading-[1.7] font-medium">{selectedProp.afirmacion}</p>
                      </div>
                      {selectedProp.contexto && (
                        <div>
                          <p className="text-[10px] font-semibold text-[#555] uppercase tracking-wide mb-2">Contexto</p>
                          <p className="text-[13px] text-stone-300 leading-[1.7]">{selectedProp.contexto}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-[10px] font-semibold text-[#555] uppercase tracking-wide mb-2">Fuente</p>
                        <p className="text-[13px] text-stone-300">{selectedProp.fuente_nombre}</p>
                        {selectedProp.fuente_articulo && <p className="text-[12px] text-[#666]">{selectedProp.fuente_articulo}</p>}
                        {selectedProp.fuente_url && (
                          <a href={selectedProp.fuente_url} target="_blank" rel="noopener noreferrer"
                             className="text-[12px] text-[#2FAF8F] hover:underline block mt-1 truncate">{selectedProp.fuente_url}</a>
                        )}
                      </div>
                    </div>
                    {selectedProp.status === 'pendiente' && (
                      <div className="px-6 py-4 border-t border-[#2A2A2A] flex gap-3">
                        <button onClick={() => void approveWiki(selectedProp)} disabled={actionLoading}
                          className="flex-1 h-11 bg-[#2FAF8F] text-white rounded-xl font-semibold text-[13px] hover:bg-[#278F75] disabled:opacity-50 flex items-center justify-center transition-colors">
                          {actionLoading ? <div className="w-4 h-4 border-[1.5px] border-white/30 border-t-white rounded-full animate-spin" /> : 'Publicar en Wiki'}
                        </button>
                        <button onClick={() => void rejectWiki(selectedProp.id)} disabled={actionLoading}
                          className="flex-1 h-11 bg-red-500 text-white rounded-xl font-semibold text-[13px] hover:bg-red-600 disabled:opacity-50 flex items-center justify-center transition-colors">
                          Rechazar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── HISTORIAL ── */}
          {activeTab === 'historial' && (
            <div className="space-y-2">
              {log.length === 0 ? (
                <div className="py-20 rounded-2xl border border-[#2A2A2A] bg-[#121212] text-center">
                  <p className="text-[#555]">Sin acciones registradas</p>
                </div>
              ) : log.map(entry => (
                <div key={entry.id} className="flex items-start gap-3 px-4 py-3 rounded-xl border border-[#2A2A2A] bg-[#121212]">
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                    entry.accion.includes('publicado') ? 'bg-[#2FAF8F]'
                    : entry.accion.includes('rechazado') ? 'bg-red-500'
                    : 'bg-orange-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-stone-300">{entry.descripcion}</p>
                    <p className="text-[11px] text-[#555] mt-0.5">{timeAgo(entry.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal detalle */}
        {selected && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-100 flex items-center justify-center p-4"
               onClick={() => setSelected(null)}>
            <div className="w-full max-w-lg bg-[#0c0a09] border border-[#2A2A2A] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
                 onClick={e => e.stopPropagation()}>
              <div className="px-6 py-5 border-b border-[#2A2A2A] flex items-start justify-between">
                <div>
                  <p className="text-[11px] text-[#666] uppercase tracking-wide mb-1">{TIPO_LABELS[selected.tipo] ?? selected.tipo}</p>
                  <h3 className="text-[16px] font-semibold text-stone-100">{selected.titulo}</h3>
                </div>
                <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg hover:bg-[#1A1A1A] text-[#666]">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                <div>
                  <p className="text-[10px] font-semibold text-[#555] uppercase tracking-wide mb-2">Contenido</p>
                  <p className="text-[13.5px] text-stone-300 leading-[1.75]">{selected.contenido}</p>
                </div>

                {selected.source_links && selected.source_links.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold text-[#555] uppercase tracking-wide mb-2">Fuentes</p>
                    {selected.source_links.map((l, i) => (
                      <a key={i} href={l} target="_blank" rel="noopener noreferrer"
                         className="block text-[12px] text-[#2FAF8F] hover:underline truncate mb-1">{l}</a>
                    ))}
                  </div>
                )}

                {/* HTI ajustable */}
                <div>
                  <p className="text-[10px] font-semibold text-[#555] uppercase tracking-wide mb-3">
                    HTI · {selected.trust_index}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {[35, 45, 55, 65, 75, 85].map(score => (
                      <button key={score} onClick={() => void updateHTI(selected.id, score)}
                        className={`h-7 px-3 rounded-lg text-[11.5px] font-medium transition-all ${
                          selected.trust_index === score
                            ? 'bg-[#2FAF8F] text-white'
                            : 'bg-[#1A1A1A] text-[#666] hover:text-white border border-[#2A2A2A]'
                        }`}>
                        {score}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {selected.status === 'pendiente' && (
                <div className="px-6 py-4 border-t border-[#2A2A2A] flex gap-3">
                  <button onClick={() => approve(selected)} disabled={actionLoading}
                    className="flex-1 h-11 bg-[#2FAF8F] text-white rounded-xl font-semibold text-[13px] hover:bg-[#278F75] disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
                    {actionLoading
                      ? <div className="w-4 h-4 border-[1.5px] border-white/30 border-t-white rounded-full animate-spin" />
                      : 'Publicar en feed'}
                  </button>
                  <button onClick={() => reject(selected.id)} disabled={actionLoading}
                    className="flex-1 h-11 bg-red-500 text-white rounded-xl font-semibold text-[13px] hover:bg-red-600 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
                    Rechazar
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Toast */}
        {toast && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-200 bg-[#1c1917] border border-[#2A2A2A] text-stone-200 text-[13px] font-medium px-5 py-3 rounded-2xl shadow-2xl">
            {toast}
          </div>
        )}
      </div>
    </>
  )
}