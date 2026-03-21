import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { useUser } from '../../context/UserContext'

type CreatorType = 'productor' | 'mvz' | 'asociacion' | 'exportador' | 'investigador' | 'union' | 'auditor'

const TIPOS: { id: CreatorType; label: string; desc: string }[] = [
  { id: 'productor',    label: 'Productor ganadero',      desc: 'Rancho, unidad de producción'                  },
  { id: 'mvz',          label: 'Médico Veterinario',      desc: 'MVZ certificado o en ejercicio'                },
  { id: 'asociacion',   label: 'Asociación ganadera',     desc: 'Organización ganadera regional o nacional'     },
  { id: 'union',        label: 'Unión Ganadera',          desc: 'Unión ganadera regional o local'               },
  { id: 'exportador',   label: 'Exportador',              desc: 'Empresa o agente de exportación bovina'        },
  { id: 'investigador', label: 'Investigador / Académico', desc: 'Institución educativa o de investigación'     },
  { id: 'auditor',      label: 'Auditor / Inspector',     desc: 'Inspector sanitario, auditor de certificación' },
]

const ESTADOS_MX = [
  'Aguascalientes','Baja California','Baja California Sur','Campeche','Chiapas',
  'Chihuahua','Ciudad de México','Coahuila','Colima','Durango','Guanajuato',
  'Guerrero','Hidalgo','Jalisco','Estado de México','Michoacán','Morelos',
  'Nayarit','Nuevo León','Oaxaca','Puebla','Querétaro','Quintana Roo',
  'San Luis Potosí','Sinaloa','Sonora','Tabasco','Tamaulipas','Tlaxcala',
  'Veracruz','Yucatán','Zacatecas','Nacional',
]

const ESPECIALIDADES_OPCIONES = [
  'Sanidad animal', 'Nutrición bovina', 'Reproducción', 'Exportación',
  'Normativa SENASICA', 'Precios y mercados', 'Clima y pastizales',
  'Bienestar animal', 'Trazabilidad', 'Genética bovina',
]

export default function CreadorSolicitarPage() {
  const navigate     = useNavigate()
  const { profile }  = useUser()

  const [tipo,           setTipo]           = useState<CreatorType>('productor')
  const [estadoMx,       setEstadoMx]       = useState('')
  const [region,         setRegion]         = useState('')
  const [bio,            setBio]            = useState('')
  const [especialidades, setEspecialidades] = useState<string[]>([])
  const [submitting,     setSubmitting]     = useState(false)
  const [submitted,      setSubmitted]      = useState(false)
  const [error,          setError]          = useState<string | null>(null)

  const toggleEsp = (e: string) =>
    setEspecialidades(prev =>
      prev.includes(e) ? prev.filter(x => x !== e) : [...prev, e]
    )

  const handleSubmit = async () => {
    if (!profile?.user_id) return
    if (!estadoMx) { setError('Selecciona tu estado.'); return }
    setSubmitting(true)
    setError(null)

    try {
      // Verificar si ya tiene solicitud
      const { data: existing } = await supabase
        .from('creator_profiles')
        .select('id, status')
        .eq('user_id', profile.user_id)
        .single()

      if (existing) {
        const msg = existing.status === 'pendiente'
          ? 'Ya tienes una solicitud en revisión.'
          : existing.status === 'activo'
          ? 'Tu perfil de creador ya está activo.'
          : 'Ya existe una solicitud para esta cuenta.'
        setError(msg)
        setSubmitting(false)
        return
      }

      const { error: err } = await supabase.from('creator_profiles').insert({
        user_id:      profile.user_id,
        creator_type: tipo,
        estado_mx:    estadoMx,
        region:       region.trim() || null,
        bio:          bio.trim() || null,
        especialidades: especialidades.length > 0 ? especialidades : null,
        nivel:        1,
        status:       'pendiente',
        trust_score:  40,
      })

      if (err) throw err
      setSubmitted(true)
    } catch (err) {
      console.error(err)
      setError('No se pudo enviar la solicitud. Intenta de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#fafaf9] dark:bg-[#0c0a09] flex items-center justify-center px-8"
           style={{ fontFamily: "'Geist', system-ui, sans-serif" }}>
        <div className="max-w-[400px] w-full text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#2FAF8F]/10 flex items-center justify-center mx-auto mb-5">
            <svg className="w-7 h-7 text-[#2FAF8F]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h2 className="text-[18px] font-semibold text-stone-900 dark:text-stone-50 mb-2">
            Solicitud enviada
          </h2>
          <p className="text-[13px] text-stone-400 dark:text-stone-500 leading-[1.7] mb-8">
            El equipo de Handeia revisará tu solicitud. Te notificaremos cuando sea aprobada o si necesitamos más información.
          </p>
          <button
            onClick={() => navigate('/creadores')}
            className="h-9 px-6 rounded-xl text-[13px] font-medium text-white bg-[#2FAF8F] hover:bg-[#27a07f] transition-colors"
          >
            Volver a Creadores
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <style>{`
        .np, .np * { font-family: 'Geist', system-ui, sans-serif; -webkit-font-smoothing: antialiased; }
        .np input:focus, .np select:focus, .np textarea:focus { outline: none !important; }
        @keyframes fu { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
        .fu { animation: fu 380ms cubic-bezier(.16,1,.3,1) both; }
      `}</style>

      <div className="np min-h-screen bg-[#fafaf9] dark:bg-[#0c0a09]">
        <div className="max-w-[640px] mx-auto px-8 pt-10 pb-20">

          <button
            onClick={() => navigate('/creadores')}
            className="flex items-center gap-1.5 text-[12.5px] font-medium text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-200 transition-colors mb-8"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
            Creadores
          </button>

          <h1 className="text-[20px] font-semibold text-stone-900 dark:text-stone-50 mb-1">
            Solicitar perfil de creador
          </h1>
          <p className="text-[13px] text-stone-400 dark:text-stone-500 mb-8">
            El equipo de Handeia verificará tu información antes de activar el perfil.
          </p>

          {/* Tipo */}
          <div className="mb-6">
            <label className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-[0.08em] mb-3 block">
              Tipo de perfil
            </label>
            <div className="grid grid-cols-1 gap-2">
              {TIPOS.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTipo(t.id)}
                  className={`p-3.5 rounded-xl border text-left transition-all duration-150 flex items-center gap-3 ${
                    tipo === t.id
                      ? 'border-[#2FAF8F]/60 bg-[#2FAF8F]/[0.06] dark:bg-[#2FAF8F]/10'
                      : 'border-stone-200 dark:border-stone-800/60 bg-white dark:bg-[#141210] hover:border-stone-300 dark:hover:border-stone-700'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full shrink-0 ${tipo === t.id ? 'bg-[#2FAF8F]' : 'bg-stone-200 dark:bg-stone-700'}`} />
                  <div>
                    <span className={`text-[13px] font-semibold block ${tipo === t.id ? 'text-[#2FAF8F]' : 'text-stone-800 dark:text-stone-100'}`}>
                      {t.label}
                    </span>
                    <span className="text-[11.5px] text-stone-400 dark:text-stone-500">{t.desc}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Ubicación */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div>
              <label className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-[0.08em] mb-2 block">
                Estado <span className="text-rose-400">*</span>
              </label>
              <select
                value={estadoMx}
                onChange={e => setEstadoMx(e.target.value)}
                className="w-full h-11 px-4 rounded-xl border border-stone-200 dark:border-stone-800/60 bg-white dark:bg-[#141210] text-[13.5px] text-stone-800 dark:text-stone-100 transition-colors"
                style={{ outline: 'none' }}
              >
                <option value="">Seleccionar...</option>
                {ESTADOS_MX.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-[0.08em] mb-2 block">
                Municipio / Región
              </label>
              <input
                type="text"
                value={region}
                onChange={e => setRegion(e.target.value)}
                placeholder="Ej. Nombre, Dgo."
                className="w-full h-11 px-4 rounded-xl border border-stone-200 dark:border-stone-800/60 bg-white dark:bg-[#141210] text-[13.5px] text-stone-800 dark:text-stone-100 placeholder-stone-300 dark:placeholder-stone-600"
                style={{ outline: 'none' }}
              />
            </div>
          </div>

          {/* Especialidades */}
          <div className="mb-5">
            <label className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-[0.08em] mb-3 block">
              Especialidades{' '}
              <span className="normal-case font-normal tracking-normal text-stone-300 dark:text-stone-600">
                (selecciona las que apliquen)
              </span>
            </label>
            <div className="flex flex-wrap gap-2">
              {ESPECIALIDADES_OPCIONES.map(e => (
                <button
                  key={e}
                  onClick={() => toggleEsp(e)}
                  className={`h-7 px-3 rounded-full text-[11.5px] font-medium transition-all border ${
                    especialidades.includes(e)
                      ? 'border-[#2FAF8F]/50 bg-[#2FAF8F]/10 text-[#2FAF8F]'
                      : 'border-stone-200 dark:border-stone-700/60 text-stone-500 dark:text-stone-400 hover:border-stone-300'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Bio */}
          <div className="mb-8">
            <label className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-[0.08em] mb-2 block">
              Descripción breve{' '}
              <span className="normal-case font-normal tracking-normal text-stone-300 dark:text-stone-600">
                (opcional)
              </span>
            </label>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="Cuéntanos brevemente tu experiencia en el sector ganadero..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-800/60 bg-white dark:bg-[#141210] text-[14px] text-stone-800 dark:text-stone-100 placeholder-stone-300 dark:placeholder-stone-600 resize-none leading-[1.7]"
              style={{ outline: 'none' }}
            />
          </div>

          {error && (
            <p className="text-[12.5px] text-rose-500 mb-4">{error}</p>
          )}

          <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-900/50 border border-stone-200/60 dark:border-stone-800/50 mb-6">
            <p className="text-[12px] text-stone-500 dark:text-stone-400 leading-[1.65]">
              Tu solicitud quedará en estado <strong className="font-semibold text-stone-700 dark:text-stone-300">Pendiente</strong> mientras la revisamos. No cambia tu cuenta actual ni te restringe ningún acceso.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => navigate('/creadores')}
              className="flex-1 h-11 rounded-xl text-[13px] font-medium text-stone-600 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => void handleSubmit()}
              disabled={submitting || !estadoMx}
              className="flex-1 h-11 rounded-xl text-[13px] font-medium text-white bg-[#2FAF8F] hover:bg-[#27a07f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-[1.5px] border-white/30 border-t-white rounded-full animate-spin" />
                  Enviando...
                </>
              ) : 'Enviar solicitud'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}