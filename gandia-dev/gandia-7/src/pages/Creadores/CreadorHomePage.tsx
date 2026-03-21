import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { useUser } from '../../context/UserContext'

interface CreatorProfile {
  id:              string
  nivel:           number
  status:          string
  creator_type:    string
  reputation_score: number
  trust_score:     number
  aportes_aceptados: number
  total_contribuciones: number
  badges:          string[]
}

const NIVELES = [
  {
    nivel:       1,
    titulo:      'Usuario',
    subtitulo:   'Cualquier usuario registrado',
    descripcion: 'Puedes enviar borradores que quedan en revisión. La comunidad y los editores los evalúan antes de publicar.',
    color:       '#78716c',
    permisos:    ['Enviar borradores', 'Adjuntar evidencia', 'Reportar correcciones'],
    hti:         '35–45',
  },
  {
    nivel:       2,
    titulo:      'Colaborador',
    subtitulo:   'Validado por la comunidad',
    descripcion: 'Tus aportes se publican con sello "Comunidad Verificada" y pasan revisión posterior más ligera.',
    color:       '#34d399',
    permisos:    ['Publicación con sello comunitario', 'Prioridad en revisión', 'Historial de reputación'],
    hti:         '45–60',
  },
  {
    nivel:       3,
    titulo:      'Experto',
    subtitulo:   'Identidad y especialidad verificadas',
    descripcion: 'MVZ, productor, exportador o asociación con credenciales verificadas. Mayor visibilidad y HTI base alto.',
    color:       '#d97706',
    permisos:    ['HTI base 65–70', 'Badge de especialidad', 'Mayor visibilidad en feed', 'Responder consultas de Search'],
    hti:         '65–75',
  },
  {
    nivel:       4,
    titulo:      'Editor',
    subtitulo:   'Moderador del sistema',
    descripcion: 'Aprueba, corrige, fusiona y rechaza aportes. Puede elevar contenido comunitario a artículo verificado.',
    color:       '#2FAF8F',
    permisos:    ['Aprobar / rechazar submissions', 'Editar artículos', 'Fusionar duplicados', 'Asignar HTI manual'],
    hti:         '80–95',
  },
]

export default function CreadorHomePage() {
  const navigate = useNavigate()
  const { profile } = useUser()

  const [creatorProfile, setCreatorProfile] = useState<CreatorProfile | null>(null)
  const [loading,        setLoading]        = useState(true)

  useEffect(() => {
    const fetchCreator = async () => {
      if (!profile?.user_id) { setLoading(false); return }
      const { data } = await supabase
        .from('creator_profiles')
        .select('*')
        .eq('user_id', profile.user_id)
        .single()
      setCreatorProfile(data as CreatorProfile ?? null)
      setLoading(false)
    }
    void fetchCreator()
  }, [profile?.user_id])

  const handleSolicitarCreador = () => {
    navigate('/creadores/solicitar')
  }

  const handleNuevoAporte = () => {
    navigate('/creadores/nuevo')
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600&display=swap');
        .np * { -webkit-font-smoothing: antialiased; }
        .np, .np * { font-family: 'Geist', system-ui, sans-serif; }
        .s { font-family: 'Instrument Serif', Georgia, serif; }
        @keyframes fu { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
        .fu { animation: fu 380ms cubic-bezier(.16,1,.3,1) both; }
      `}</style>

      <div className="np min-h-screen bg-[#fafaf9] dark:bg-[#0c0a09]">
        <div className="max-w-[800px] mx-auto px-8 pt-10 pb-20">

          {/* Back */}
          <button
            onClick={() => navigate('/noticias')}
            className="flex items-center gap-1.5 text-[12.5px] font-medium text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-200 transition-colors mb-8"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
            Noticias
          </button>

          {/* Header */}
          <div className="mb-10">
            <h1 className="s text-[22px] text-stone-900 dark:text-stone-50 mb-1">
              Creadores
            </h1>
            <p className="text-[13px] text-stone-400 dark:text-stone-500">
              Contribuye al sistema de inteligencia agropecuaria de Handeia
            </p>
          </div>

          {/* Estado del usuario actual */}
          {!loading && (
            <div className="mb-10 fu">
              {creatorProfile ? (
                <div className="p-6 rounded-2xl border border-stone-200/70 dark:border-stone-800/60 bg-white dark:bg-[#141210]">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-[10.5px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-[0.1em] mb-1">
                        Tu perfil de creador
                      </p>
                      <div className="flex items-center gap-2">
                        <span
                          className="text-[13px] font-semibold"
                          style={{ color: NIVELES[creatorProfile.nivel - 1]?.color ?? '#2FAF8F' }}
                        >
                          {NIVELES[creatorProfile.nivel - 1]?.titulo ?? 'Creador'}
                        </span>
                        <span className="text-[11.5px] text-stone-400 dark:text-stone-500">
                          · Nivel {creatorProfile.nivel}
                        </span>
                        {creatorProfile.status === 'pendiente' && (
                          <span className="text-[10px] font-semibold text-amber-500 px-2 py-0.5 bg-amber-500/10 rounded-full">
                            En revisión
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[22px] font-semibold text-stone-800 dark:text-stone-100">
                        {creatorProfile.trust_score}
                      </p>
                      <p className="text-[10.5px] text-stone-400 dark:text-stone-500">Trust Score</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {[
                      { label: 'Aportes totales', val: creatorProfile.total_contribuciones },
                      { label: 'Aceptados',        val: creatorProfile.aportes_aceptados   },
                      { label: 'Reputación',       val: creatorProfile.reputation_score    },
                    ].map(m => (
                      <div key={m.label} className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/40">
                        <p className="text-[18px] font-semibold text-stone-800 dark:text-stone-100">{m.val}</p>
                        <p className="text-[10.5px] text-stone-400 dark:text-stone-500">{m.label}</p>
                      </div>
                    ))}
                  </div>

                  {creatorProfile.status === 'activo' && (
                    <div className="flex gap-2">
                      <button
                        onClick={handleNuevoAporte}
                        className="flex-1 h-10 rounded-xl bg-[#2FAF8F] hover:bg-[#27a07f] text-white text-[13px] font-semibold transition-colors"
                      >
                        Enviar nuevo aporte
                      </button>
                      <button
                        onClick={() => navigate(`/creadores/${creatorProfile.id}`)}
                        className="h-10 px-4 rounded-xl border border-stone-200 dark:border-stone-700/60 text-[13px] font-medium text-stone-600 dark:text-stone-300 hover:border-stone-300 transition-colors"
                      >
                        Ver perfil
                      </button>
                    </div>
                  )}

                  {/* Acceso al panel de moderación — solo nivel 4 */}
                  {creatorProfile.nivel >= 4 && creatorProfile.status === 'activo' && (
                    <button
                      onClick={() => navigate('/moderador/panel')}
                      className="mt-3 w-full h-9 rounded-xl border border-stone-200 dark:border-stone-800/60 text-[12.5px] font-medium text-stone-500 dark:text-stone-400 hover:text-[#2FAF8F] hover:border-[#2FAF8F]/40 transition-all flex items-center justify-center gap-2"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                      </svg>
                      Panel de moderación
                    </button>
                  )}
                </div>
              ) : (
                <div className="p-6 rounded-2xl border border-stone-200/70 dark:border-stone-800/60 bg-white dark:bg-[#141210] text-center">
                  <div className="w-12 h-12 rounded-2xl bg-[#2FAF8F]/10 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-5 h-5 text-[#2FAF8F]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
                    </svg>
                  </div>
                  <p className="text-[15px] font-semibold text-stone-800 dark:text-stone-100 mb-1">
                    Conviértete en creador
                  </p>
                  <p className="text-[13px] text-stone-400 dark:text-stone-500 mb-5 max-w-[320px] mx-auto">
                    Comparte tus conocimientos y reportes del campo con la comunidad ganadera de México.
                  </p>
                  <button
                    onClick={handleSolicitarCreador}
                    className="h-10 px-6 rounded-xl bg-[#2FAF8F] hover:bg-[#27a07f] text-white text-[13px] font-semibold transition-colors"
                  >
                    Solicitar ser creador
                  </button>
                </div>
              )}
            </div>
          )}

          {/* También puedes enviar sin ser creador */}
          {!loading && !creatorProfile && (
            <div className="mb-8 p-4 rounded-xl border border-stone-200/60 dark:border-stone-800/50 bg-stone-50 dark:bg-stone-900/40 flex items-center justify-between gap-4">
              <p className="text-[12.5px] text-stone-500 dark:text-stone-400">
                ¿Tienes una noticia o alerta de campo? Puedes enviarla aunque no seas creador. Quedará en revisión.
              </p>
              <button
                onClick={handleNuevoAporte}
                className="shrink-0 h-8 px-4 rounded-lg text-[12px] font-medium text-[#2FAF8F] border border-[#2FAF8F]/30 hover:bg-[#2FAF8F]/10 transition-colors whitespace-nowrap"
              >
                Enviar aporte
              </button>
            </div>
          )}

          {/* Niveles del sistema */}
          <div>
            <p className="text-[10.5px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-[0.1em] mb-5">
              Sistema de niveles
            </p>

            <div className="space-y-3">
              {NIVELES.map((n, i) => (
                <div
                  key={n.nivel}
                  className="fu p-5 rounded-2xl border border-stone-200/70 dark:border-stone-800/60 bg-white dark:bg-[#141210]"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-[13px] font-bold text-white"
                      style={{ background: n.color }}
                    >
                      {n.nivel}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[14px] font-semibold text-stone-800 dark:text-stone-100">
                          {n.titulo}
                        </span>
                        <span className="text-[11px] text-stone-400 dark:text-stone-500">
                          · {n.subtitulo}
                        </span>
                      </div>
                      <p className="text-[12.5px] text-stone-500 dark:text-stone-400 leading-[1.65] mb-3">
                        {n.descripcion}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {n.permisos.map((p, j) => (
                          <span
                            key={j}
                            className="text-[10.5px] font-medium px-2 py-0.5 rounded-full"
                            style={{ color: n.color, background: `${n.color}15` }}
                          >
                            {p}
                          </span>
                        ))}
                        <span className="text-[10.5px] font-medium px-2 py-0.5 rounded-full text-stone-400 dark:text-stone-500 bg-stone-100 dark:bg-stone-800/50">
                          HTI base {n.hti}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}