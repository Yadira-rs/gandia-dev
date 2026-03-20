import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { useUser } from '../../context/UserContext'

type TipoSubmission = 'noticia' | 'alerta' | 'reporte_campo' | 'correccion'

const TIPOS: { id: TipoSubmission; label: string; desc: string }[] = [
  { id: 'noticia',       label: 'Noticia',          desc: 'Información relevante del sector'            },
  { id: 'alerta',        label: 'Alerta sanitaria', desc: 'Brote, riesgo o situación urgente'           },
  { id: 'reporte_campo', label: 'Reporte de campo', desc: 'Lo que estás viendo en tu rancho o región'  },
  { id: 'correccion',    label: 'Corrección',        desc: 'Un dato incorrecto en Handeia'              },
]

const ESTADOS_MX = [
  'Aguascalientes','Baja California','Baja California Sur','Campeche','Chiapas',
  'Chihuahua','Ciudad de México','Coahuila','Colima','Durango','Guanajuato',
  'Guerrero','Hidalgo','Jalisco','Estado de México','Michoacán','Morelos',
  'Nayarit','Nuevo León','Oaxaca','Puebla','Querétaro','Quintana Roo',
  'San Luis Potosí','Sinaloa','Sonora','Tabasco','Tamaulipas','Tlaxcala',
  'Veracruz','Yucatán','Zacatecas','Nacional','Internacional',
]

export default function CreadorFormPage() {
  const navigate = useNavigate()
  const { profile } = useUser()

  const [tipo,        setTipo]        = useState<TipoSubmission>('reporte_campo')
  const [titulo,      setTitulo]      = useState('')
  const [contenido,   setContenido]   = useState('')
  const [estadoMx,    setEstadoMx]    = useState('')
  const [region,      setRegion]      = useState('')
  const [sourceLinks, setSourceLinks] = useState('')
  const [submitting,  setSubmitting]  = useState(false)
  const [submitted,   setSubmitted]   = useState(false)
  const [error,       setError]       = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!titulo.trim() || !contenido.trim()) return
    if (!profile?.user_id) { setError('Debes iniciar sesión para enviar un aporte.'); return }

    setSubmitting(true)
    setError(null)

    try {
      const links = sourceLinks
        .split('\n')
        .map(l => l.trim())
        .filter(Boolean)

      const { error: err } = await supabase.from('user_submissions').insert({
        user_id:     profile.user_id,
        tipo,
        titulo:      titulo.trim(),
        contenido:   contenido.trim(),
        estado_mx:   estadoMx || null,
        region:      region.trim() || null,
        source_links: links.length > 0 ? links : null,
        status:      'pendiente',
      })

      if (err) throw err
      setSubmitted(true)
    } catch (err) {
      console.error('Error al enviar aporte:', err)
      setError('No se pudo enviar el aporte. Intenta de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Estado enviado ──────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen bg-[#fafaf9] dark:bg-[#0c0a09] flex items-center justify-center px-8">
        <div className="max-w-[400px] w-full text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#2FAF8F]/10 flex items-center justify-center mx-auto mb-5">
            <svg className="w-7 h-7 text-[#2FAF8F]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h2 className="text-[18px] font-semibold text-stone-900 dark:text-stone-50 mb-2">
            Aporte enviado
          </h2>
          <p className="text-[13px] text-stone-400 dark:text-stone-500 leading-[1.7] mb-8">
            Tu aporte quedó en revisión. El equipo de Handeia lo revisará y te notificaremos cuando cambie su estado.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => navigate('/noticias')}
              className="h-9 px-5 rounded-xl text-[13px] font-medium text-stone-600 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
            >
              Ir a Noticias
            </button>
            <button
              onClick={() => { setSubmitted(false); setTitulo(''); setContenido(''); setSourceLinks('') }}
              className="h-9 px-5 rounded-xl text-[13px] font-medium text-white bg-[#2FAF8F] hover:bg-[#27a07f] transition-colors"
            >
              Enviar otro
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
        .np textarea:focus, .np input:focus, .np select:focus { outline: none !important; }
        @keyframes fu { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
        .fu { animation: fu 380ms cubic-bezier(.16,1,.3,1) both; }
      `}</style>

      <div className="np min-h-screen bg-[#fafaf9] dark:bg-[#0c0a09]">
        <div className="max-w-[640px] mx-auto px-8 pt-10 pb-20">

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
            Nuevo aporte
          </h1>
          <p className="text-[13px] text-stone-400 dark:text-stone-500 mb-8">
            Comparte información relevante con la comunidad ganadera de México.
          </p>

          {/* Tipo */}
          <div className="mb-6">
            <label className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-[0.08em] mb-3 block">
              Tipo de aporte
            </label>
            <div className="grid grid-cols-2 gap-2">
              {TIPOS.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTipo(t.id)}
                  className={`p-3.5 rounded-xl border text-left transition-all duration-150 ${
                    tipo === t.id
                      ? 'border-[#2FAF8F]/60 bg-[#2FAF8F]/08 dark:bg-[#2FAF8F]/10'
                      : 'border-stone-200 dark:border-stone-800/60 bg-white dark:bg-[#141210] hover:border-stone-300 dark:hover:border-stone-700'
                  }`}
                >
                  <span className={`text-[13px] font-semibold block mb-0.5 ${
                    tipo === t.id ? 'text-[#2FAF8F]' : 'text-stone-800 dark:text-stone-100'
                  }`}>
                    {t.label}
                  </span>
                  <span className="text-[11.5px] text-stone-400 dark:text-stone-500 leading-snug">
                    {t.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Título */}
          <div className="mb-5">
            <label className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-[0.08em] mb-2 block">
              Título
            </label>
            <input
              type="text"
              value={titulo}
              onChange={e => setTitulo(e.target.value)}
              placeholder="Un título claro y descriptivo..."
              className="w-full h-11 px-4 rounded-xl border border-stone-200 dark:border-stone-800/60 bg-white dark:bg-[#141210] text-[14px] text-stone-800 dark:text-stone-100 placeholder-stone-300 dark:placeholder-stone-600 transition-colors focus:border-stone-300 dark:focus:border-stone-700"
              style={{ outline: 'none' }}
            />
          </div>

          {/* Contenido */}
          <div className="mb-5">
            <label className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-[0.08em] mb-2 block">
              Descripción
            </label>
            <textarea
              value={contenido}
              onChange={e => setContenido(e.target.value)}
              placeholder="Describe con detalle lo que observaste o la información que quieres compartir..."
              rows={6}
              className="w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-800/60 bg-white dark:bg-[#141210] text-[14px] text-stone-800 dark:text-stone-100 placeholder-stone-300 dark:placeholder-stone-600 resize-none transition-colors focus:border-stone-300 dark:focus:border-stone-700 leading-[1.7]"
              style={{ outline: 'none' }}
            />
          </div>

          {/* Ubicación */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div>
              <label className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-[0.08em] mb-2 block">
                Estado
              </label>
              <select
                value={estadoMx}
                onChange={e => setEstadoMx(e.target.value)}
                className="w-full h-11 px-4 rounded-xl border border-stone-200 dark:border-stone-800/60 bg-white dark:bg-[#141210] text-[13.5px] text-stone-800 dark:text-stone-100 transition-colors focus:border-stone-300 dark:focus:border-stone-700"
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
                placeholder="Ej. Nombre, Durango"
                className="w-full h-11 px-4 rounded-xl border border-stone-200 dark:border-stone-800/60 bg-white dark:bg-[#141210] text-[13.5px] text-stone-800 dark:text-stone-100 placeholder-stone-300 dark:placeholder-stone-600 transition-colors focus:border-stone-300 dark:focus:border-stone-700"
                style={{ outline: 'none' }}
              />
            </div>
          </div>

          {/* Links de fuente */}
          <div className="mb-8">
            <label className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-[0.08em] mb-2 block">
              Links de fuente{' '}
              <span className="normal-case font-normal tracking-normal text-stone-300 dark:text-stone-600">
                (opcional, uno por línea)
              </span>
            </label>
            <textarea
              value={sourceLinks}
              onChange={e => setSourceLinks(e.target.value)}
              placeholder="https://senasica.gob.mx/noticia/..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-800/60 bg-white dark:bg-[#141210] text-[13px] text-stone-800 dark:text-stone-100 placeholder-stone-300 dark:placeholder-stone-600 resize-none transition-colors focus:border-stone-300 dark:focus:border-stone-700 font-mono"
              style={{ outline: 'none' }}
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-[12.5px] text-rose-500 mb-4">{error}</p>
          )}

          {/* Aviso HTI */}
          <div className="mb-6 p-4 rounded-xl bg-stone-50 dark:bg-stone-900/50 border border-stone-200/60 dark:border-stone-800/50">
            <p className="text-[12px] text-stone-500 dark:text-stone-400 leading-[1.65]">
              Tu aporte quedará en estado <strong className="font-semibold text-stone-700 dark:text-stone-300">Pendiente</strong> hasta ser revisado.
              El HTI inicial será bajo y aumentará conforme se verifique la información.
              Adjuntar links de fuentes oficiales mejora la puntuación.
            </p>
          </div>

          {/* Botones */}
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/creadores')}
              className="flex-1 h-11 rounded-xl text-[13px] font-medium text-stone-600 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => void handleSubmit()}
              disabled={submitting || !titulo.trim() || !contenido.trim()}
              className="flex-1 h-11 rounded-xl text-[13px] font-medium text-white bg-[#2FAF8F] hover:bg-[#27a07f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-[1.5px] border-white/30 border-t-white rounded-full animate-spin" />
                  Enviando...
                </>
              ) : 'Enviar aporte'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}