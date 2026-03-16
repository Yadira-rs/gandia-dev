/**
 * BiometriaEstadisticasWidget — datos REALES desde biometria_embeddings
 * ARCHIVO → src/artifacts/biometria/widgets/BiometriaEstadisticasWidget.tsx
 */
import { useState, useEffect, useCallback } from 'react'
import { useUser }     from '../../../context/UserContext'
import { useRanchoId } from '../../../hooks/useAnimales'
import { supabase }    from '../../../lib/supabaseClient'
import type { RegistroCaptura } from '../../../hooks/useBiometria'

interface Props {
  registros?: RegistroCaptura[]
}

interface EmbeddingRow {
  id:         string
  calidad:    number
  modo:       string
  created_at: string
}

export default function BiometriaEstadisticasWidget({ registros = [] }: Props) {
  const { profile }  = useUser()
  const userId       = profile?.user_id ?? null
  const { ranchoId } = useRanchoId(userId)

  const [embeddings, setEmbeddings] = useState<EmbeddingRow[]>([])
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!ranchoId) return
    setLoading(true)
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from('biometria_embeddings')
        .select('id, calidad, modo, created_at')
        .eq('rancho_id', ranchoId)
        .eq('activo', true)
        .order('created_at', { ascending: false })
        .limit(1000)
      if (err) throw err
      setEmbeddings((data ?? []) as EmbeddingRow[])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }, [ranchoId])

  useEffect(() => { fetchData() }, [fetchData])

  const total      = embeddings.length + registros.length
  const matches    = embeddings.length + registros.filter(r => r.resultado === 'match').length
  const candidatos = registros.filter(r => r.resultado === 'candidato').length
  const nuevos     = registros.filter(r => r.resultado === 'nuevo').length
  const errores    = registros.filter(r => r.resultado === 'error').length
  void matches

  const allScores = [
    ...embeddings.map(e => e.calidad ?? 0).filter(s => s > 0),
    ...registros.filter(r => r.score > 0).map(r => r.score),
  ]
  const avgScore = allScores.length > 0
    ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length * 100)
    : 0

  const directas = embeddings.filter(e => e.modo === 'direct').length
                 + registros.filter(r => r.modo === 'direct').length
  const hojas    = embeddings.filter(e => e.modo === 'sheet').length
                 + registros.filter(r => r.modo === 'sheet').length

  const alta  = embeddings.filter(e => e.calidad >= 0.7).length
  const media = embeddings.filter(e => e.calidad >= 0.3 && e.calidad < 0.7).length
  const baja  = embeddings.filter(e => e.calidad < 0.3).length

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <div className="w-5 h-5 border-2 border-[#2FAF8F] border-t-transparent rounded-full animate-spin"/>
    </div>
  )

  if (error) return (
    <div className="flex flex-col items-center gap-3 py-16 text-center px-8">
      <p className="text-[12px] text-stone-500 dark:text-stone-400">Error al cargar estadísticas</p>
      <p className="text-[11px] text-stone-400 font-mono">{error}</p>
      <button onClick={fetchData}
        className="mt-2 px-3 py-1.5 rounded-lg border border-stone-200/70 dark:border-stone-800 text-[11px] text-stone-500 hover:text-stone-700 transition-colors bg-transparent cursor-pointer">
        Reintentar
      </button>
    </div>
  )

  return (
    <div className="flex flex-col gap-4">

      {/* ── Encabezado ── */}
      <div className="flex items-center justify-between">
        <p className="text-[13.5px] font-semibold text-stone-800 dark:text-stone-100">Estadísticas del rancho</p>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2FAF8F] animate-pulse"/>
            <span className="text-[11px] text-stone-400 dark:text-stone-500">En vivo</span>
          </div>
          <button onClick={fetchData} title="Actualizar"
            className="w-7 h-7 flex items-center justify-center rounded-[7px] border border-stone-200/70 dark:border-stone-800 text-stone-400 hover:text-[#2FAF8F] transition-all cursor-pointer bg-transparent">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="23 4 23 10 17 10"/>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
          </button>
        </div>
      </div>

      {/* ── Huellas registradas ── */}
      <div className="bg-white dark:bg-[#1c1917] border border-stone-200/60 dark:border-stone-800/50 rounded-[12px] p-4">
        <div className="flex items-end justify-between mb-3">
          <div>
            <p className="text-[11px] font-medium text-stone-400 dark:text-stone-500 uppercase tracking-[0.06em]">Huellas registradas</p>
            <p className={`text-[40px] font-extrabold leading-none tabular-nums mt-1 ${
              total > 0 ? 'text-[#2FAF8F]' : 'text-stone-300 dark:text-stone-600'
            }`}>
              {total.toLocaleString()}
            </p>
          </div>
          <div className="text-right mb-1">
            <p className="text-[13px] text-stone-400 dark:text-stone-500">Score promedio</p>
            <p className={`text-[20px] font-bold tabular-nums ${
              avgScore >= 70 ? 'text-[#2FAF8F]' : avgScore > 0 ? 'text-amber-500' : 'text-stone-400'
            }`}>
              {avgScore > 0 ? `${avgScore}%` : '—'}
            </p>
          </div>
        </div>
        {total > 0 && (
          <>
            <div className="flex gap-0.5 h-2.5 rounded-full overflow-hidden">
              <div className="bg-[#2FAF8F] transition-all duration-700"
                style={{ width: `${Math.round(alta / total * 100)}%` }}/>
              <div className="bg-amber-400 transition-all duration-700"
                style={{ width: `${Math.round(media / total * 100)}%` }}/>
              <div className="bg-stone-200 dark:bg-stone-700 transition-all duration-700"
                style={{ width: `${Math.round(baja / total * 100)}%` }}/>
            </div>
            <div className="flex gap-4 mt-2">
              {[
                { label: 'Alta (≥70%)', value: alta,  color: 'text-[#2FAF8F]' },
                { label: 'Media',       value: media, color: 'text-amber-500' },
                { label: 'Baja (<30%)', value: baja,  color: 'text-stone-400' },
              ].map(q => (
                <div key={q.label} className="flex items-center gap-1">
                  <span className={`text-[11px] font-bold ${q.color}`}>{q.value}</span>
                  <span className="text-[10.5px] text-stone-400 dark:text-stone-500">{q.label}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Grid ── */}
      <div className="grid grid-cols-2 gap-2.5">
        {[
          { label: 'Total en BD',       value: embeddings.length, color: 'text-stone-800 dark:text-stone-100' },
          { label: 'Sesión actual',     value: registros.length,  color: registros.length > 0 ? 'text-[#2FAF8F]' : 'text-stone-400 dark:text-stone-500' },
          { label: 'Calidad alta',      value: alta,              color: 'text-[#2FAF8F]'  },
          { label: 'Calidad baja',      value: baja,              color: baja > 0 ? 'text-amber-500' : 'text-stone-400 dark:text-stone-500' },
          { label: 'Candidatos sesión', value: candidatos,        color: candidatos > 0 ? 'text-amber-500' : 'text-stone-400 dark:text-stone-500' },
          { label: 'Nuevos sesión',     value: nuevos,            color: nuevos > 0 ? 'text-violet-500' : 'text-stone-400 dark:text-stone-500' },
        ].map((s, i) => (
          <div key={i} className="bg-white dark:bg-[#1c1917] border border-stone-200/60 dark:border-stone-800/50 rounded-[10px] px-3.5 py-3">
            <p className={`text-[26px] font-extrabold leading-none tabular-nums ${s.color}`}>{s.value}</p>
            <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-1.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Modo de captura ── */}
      {total > 0 && (
        <div className="bg-white dark:bg-[#1c1917] border border-stone-200/60 dark:border-stone-800/50 rounded-[12px] p-4">
          <p className="text-[11px] font-medium text-stone-400 dark:text-stone-500 uppercase tracking-[0.06em] mb-3">Modo de captura</p>
          <div className="flex gap-5">
            {[
              { label: 'Cámara directa',   value: directas, bar: 'bg-[#2FAF8F]'  },
              { label: 'Hoja inteligente', value: hojas,    bar: 'bg-violet-400' },
            ].map(m => (
              <div key={m.label} className="flex-1">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className={`w-2 h-2 rounded-full ${m.bar}`}/>
                  <span className="text-[12px] text-stone-500 dark:text-stone-400">{m.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-stone-100 dark:bg-stone-800/50 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-700 ${m.bar}`}
                      style={{ width: total > 0 ? `${Math.round(m.value / total * 100)}%` : '0%' }}/>
                  </div>
                  <span className="text-[12px] font-bold text-stone-700 dark:text-stone-300 tabular-nums w-6 text-right">{m.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {total === 0 && (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <p className="text-[12px] text-stone-400 dark:text-stone-500">
            Las estadísticas aparecen en cuanto haya huellas registradas
          </p>
        </div>
      )}

      {errores > 0 && (
        <div className="px-3.5 py-2.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/30 rounded-[8px]">
          <p className="text-[12px] text-red-500 font-medium">
            {errores} captura{errores > 1 ? 's' : ''} con error — revisar calidad de imagen
          </p>
        </div>
      )}
    </div>
  )
}