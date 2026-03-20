// ─── CreadorPerfilPage ────────────────────────────────────────────────────────
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'

interface CreatorPublic {
  id:                      string
  user_id:                 string
  creator_type:            string
  region:                  string | null
  estado_mx:               string | null
  especialidades:          string[] | null
  bio:                     string | null
  reputation_score:        number
  trust_score:             number
  aportes_aceptados:       number
  total_contribuciones:    number
  nivel:                   number
  badges:                  string[] | null
}

interface SubmissionPublic {
  id:            string
  titulo:        string
  tipo:          string
  estado_mx:     string | null
  trust_index:   number
  created_at:    string
}

const TIPO_LABELS: Record<string, string> = {
  productor:    'Productor',
  mvz:          'MVZ',
  asociacion:   'Asociación',
  exportador:   'Exportador',
  investigador: 'Investigador',
  editor:       'Editor',
}

export function CreadorPerfilPage() {
  const { id }   = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [creator,  setCreator]  = useState<CreatorPublic | null>(null)
  const [aportes,  setAportes]  = useState<SubmissionPublic[]>([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    if (!id) return
    const fetch = async () => {
      const { data: c } = await supabase
        .from('creator_profiles')
        .select('id,user_id,creator_type,region,estado_mx,especialidades,bio,reputation_score,trust_score,aportes_aceptados,total_contribuciones,nivel,badges')
        .eq('id', id)
        .eq('status', 'activo')
        .single()

      if (c) {
        setCreator(c as CreatorPublic)
        const { data: a } = await supabase
          .from('user_submissions')
          .select('id,titulo,tipo,estado_mx,trust_index,created_at')
          .eq('user_id', (c as CreatorPublic).user_id)
          .eq('status', 'publicado')
          .order('created_at', { ascending: false })
          .limit(10)
        setAportes((a as SubmissionPublic[]) ?? [])
      }
      setLoading(false)
    }
    void fetch()
  }, [id])

  if (loading) return (
    <div className="min-h-screen bg-[#fafaf9] dark:bg-[#0c0a09] flex items-center justify-center">
      <div className="w-5 h-5 border-2 border-[#2FAF8F] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!creator) return (
    <div className="min-h-screen bg-[#fafaf9] dark:bg-[#0c0a09] flex items-center justify-center">
      <div className="text-center">
        <p className="text-[14px] text-stone-400 dark:text-stone-500 mb-4">Creador no encontrado.</p>
        <button onClick={() => navigate('/creadores')} className="text-[12px] font-medium text-[#2FAF8F]">
          Volver a Creadores
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#fafaf9] dark:bg-[#0c0a09]" style={{ fontFamily: "'Geist', system-ui, sans-serif" }}>
      <div className="max-w-[700px] mx-auto px-8 pt-10 pb-20">

        <button
          onClick={() => navigate('/creadores')}
          className="flex items-center gap-2 text-[12.5px] font-medium text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-200 transition-colors mb-8"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
          Creadores
        </button>

        {/* Perfil */}
        <div className="p-6 rounded-2xl border border-stone-200/70 dark:border-stone-800/60 bg-white dark:bg-[#141210] mb-6">
          <div className="flex items-start gap-4 mb-5">
            <div className="w-14 h-14 rounded-2xl bg-[#2FAF8F]/15 flex items-center justify-center shrink-0">
              <span className="text-[22px] font-bold text-[#2FAF8F]">
                {TIPO_LABELS[creator.creator_type]?.charAt(0) ?? 'C'}
              </span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[15px] font-semibold text-stone-800 dark:text-stone-100">
                  {TIPO_LABELS[creator.creator_type] ?? creator.creator_type}
                </span>
                <span className="text-[11px] font-semibold text-[#2FAF8F] px-2 py-0.5 bg-[#2FAF8F]/10 rounded-full">
                  Nivel {creator.nivel}
                </span>
              </div>
              {creator.estado_mx && (
                <p className="text-[12.5px] text-stone-400 dark:text-stone-500">
                  {creator.estado_mx}{creator.region ? ` · ${creator.region}` : ''}
                </p>
              )}
              {creator.bio && (
                <p className="text-[13px] text-stone-600 dark:text-stone-300 leading-[1.65] mt-2">
                  {creator.bio}
                </p>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { label: 'Trust Score',  val: creator.trust_score      },
              { label: 'Aceptados',    val: creator.aportes_aceptados },
              { label: 'Reputación',   val: creator.reputation_score  },
            ].map(m => (
              <div key={m.label} className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/40 text-center">
                <p className="text-[20px] font-semibold text-stone-800 dark:text-stone-100">{m.val}</p>
                <p className="text-[10.5px] text-stone-400 dark:text-stone-500">{m.label}</p>
              </div>
            ))}
          </div>

          {/* Especialidades */}
          {creator.especialidades && creator.especialidades.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {creator.especialidades.map((e, i) => (
                <span key={i} className="text-[11px] px-2.5 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800/50 text-stone-500 dark:text-stone-400">
                  {e}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Aportes publicados */}
        {aportes.length > 0 && (
          <div>
            <p className="text-[10.5px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-[0.1em] mb-4">
              Aportes publicados ({aportes.length})
            </p>
            <div className="divide-y divide-stone-100 dark:divide-stone-800/50">
              {aportes.map(a => (
                <div key={a.id} className="py-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10.5px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-[0.06em]">
                      {a.tipo.replace('_', ' ')}
                    </span>
                    {a.estado_mx && (
                      <>
                        <span className="text-stone-200 dark:text-stone-700">·</span>
                        <span className="text-[10.5px] text-stone-400 dark:text-stone-500">{a.estado_mx}</span>
                      </>
                    )}
                  </div>
                  <p className="text-[13.5px] font-medium text-stone-700 dark:text-stone-300">{a.titulo}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}