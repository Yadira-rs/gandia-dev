/**
 * BiometriaHistorialWidget — datos REALES desde biometria_embeddings
 * ARCHIVO → src/artifacts/biometria/widgets/BiometriaHistorialWidget.tsx
 */
import { useState, useEffect, useCallback } from 'react'
import { useUser }    from '../../../context/UserContext'
import { useRanchoId } from '../../../hooks/useAnimales'
import { supabase }   from '../../../lib/supabaseClient'
import type { RegistroCaptura } from '../../../hooks/useBiometria'

export type { RegistroCaptura }

interface AnimalJoin {
  nombre:  string | null
  siniiga: string
  raza:    string
}

interface RegistroReal {
  id:          string
  animal_id:   string
  calidad:     number
  modo:        string
  created_at:  string
  animales?:   AnimalJoin | AnimalJoin[] | null
}

function getAnimal(a: AnimalJoin | AnimalJoin[] | null | undefined): AnimalJoin | null {
  if (!a) return null
  return Array.isArray(a) ? (a[0] ?? null) : a
}

interface Props {
  registros?:         RegistroCaptura[]   // capturas de sesión (opcional)
  loading?:           boolean
  onSelectRegistro?:  (r: RegistroCaptura) => void
}

const RESULTADO_COLOR = {
  match:     { dot: 'bg-[#2FAF8F]', label: 'Registrado', textColor: 'text-[#2FAF8F]'  },
  candidato: { dot: 'bg-amber-400', label: 'Candidato',  textColor: 'text-amber-500'  },
  nuevo:     { dot: 'bg-violet-400',label: 'Nuevo',      textColor: 'text-violet-500' },
  error:     { dot: 'bg-red-400',   label: 'Error',      textColor: 'text-red-500'    },
}

export default function BiometriaHistorialWidget({ registros = [], loading: loadingProp, onSelectRegistro }: Props) {
  const { profile }  = useUser()
  const userId       = profile?.user_id ?? null
  const { ranchoId } = useRanchoId(userId)

  const [embeddings, setEmbeddings]   = useState<RegistroReal[]>([])
  const [loadingDB,  setLoadingDB]    = useState(false)
  const [error,      setError]        = useState<string | null>(null)
  const [busqueda,   setBusqueda]     = useState('')

  const fetchEmbeddings = useCallback(async () => {
    if (!ranchoId) return
    setLoadingDB(true)
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from('biometria_embeddings')
        .select(`
          id,
          animal_id,
          calidad,
          modo,
          created_at,
          animales (
            nombre,
            siniiga,
            raza
          )
        `)
        .eq('rancho_id', ranchoId)
        .eq('activo', true)
        .order('created_at', { ascending: false })
        .limit(300)

      if (err) throw err
      setEmbeddings((data ?? []) as unknown as RegistroReal[])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar historial')
    } finally {
      setLoadingDB(false)
    }
  }, [ranchoId])

  useEffect(() => { fetchEmbeddings() }, [fetchEmbeddings])

  const loading = loadingProp || loadingDB

  // Combinar capturas de sesión + embeddings de BD
  // Las capturas de sesión van primero (son más recientes y ya tienen resultado)
  const sesionIds = new Set(registros.map(r => r.animal))

  const embeddingsComoRegistro: RegistroCaptura[] = embeddings
    .filter(e => {
      const anim   = getAnimal(e.animales)
      const nombre = anim?.nombre ?? anim?.siniiga ?? e.animal_id
      return !sesionIds.has(nombre)
    })
    .map(e => {
      const anim = getAnimal(e.animales)
      return {
        id:         0,
        capturaId:  e.id,
        animal:     anim?.nombre ?? anim?.siniiga ?? '—',
        arete:      anim?.siniiga ?? '—',
        lote:       '—',
        resultado:  'match' as const,
        score:      e.calidad ?? 0,
        modo:       (e.modo as 'direct' | 'sheet') ?? 'direct',
        ts:         new Date(e.created_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
        confirmado: true,
      }
    })

  const todos = [...registros, ...embeddingsComoRegistro]

  // Búsqueda
  const lower = busqueda.toLowerCase()
  const filtrados = busqueda.trim()
    ? todos.filter(r =>
        r.animal.toLowerCase().includes(lower) ||
        r.arete.toLowerCase().includes(lower)
      )
    : todos

  const matches    = todos.filter(r => r.resultado === 'match').length
  const total      = todos.length
  const precision  = total > 0 ? Math.round((matches / total) * 100) : 0
  const pendientes = todos.filter(r => r.resultado === 'candidato' && !r.confirmado)

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <div className="w-5 h-5 border-2 border-[#2FAF8F] border-t-transparent rounded-full animate-spin"/>
    </div>
  )

  if (error) return (
    <div className="flex flex-col items-center gap-3 py-16 text-center px-8">
      <p className="text-[12px] text-stone-500 dark:text-stone-400">Error al cargar historial</p>
      <p className="text-[11px] text-stone-400 font-mono">{error}</p>
      <button onClick={fetchEmbeddings}
        className="mt-2 px-3 py-1.5 rounded-lg border border-stone-200/70 dark:border-stone-800 text-[11px] text-stone-500 hover:text-stone-700 transition-colors bg-transparent cursor-pointer">
        Reintentar
      </button>
    </div>
  )

  return (
    <div className="flex flex-col gap-3">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-semibold text-stone-800 dark:text-stone-100">
          Huellas registradas
        </p>
        <div className="flex items-center gap-2">
          {pendientes.length > 0 && (
            <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/25 border border-amber-200 dark:border-amber-800/30 px-2 py-0.5 rounded-[6px]">
              {pendientes.length} pendiente{pendientes.length > 1 ? 's' : ''}
            </span>
          )}
          <button onClick={fetchEmbeddings} title="Actualizar"
            className="w-7 h-7 flex items-center justify-center rounded-[7px] border border-stone-200/70 dark:border-stone-800 text-stone-400 hover:text-[#2FAF8F] transition-all cursor-pointer bg-transparent">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="23 4 23 10 17 10"/>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
          </button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Total',     value: total,           color: 'text-stone-800 dark:text-stone-100' },
          { label: 'Match',     value: matches,          color: 'text-[#2FAF8F]'  },
          { label: 'Precisión', value: `${precision}%`,  color: precision >= 90 ? 'text-[#2FAF8F]' : precision > 0 ? 'text-amber-500' : 'text-stone-400' },
        ].map((s, i) => (
          <div key={i} className="bg-stone-50 dark:bg-[#141210] rounded-[8px] px-2 py-2.5 text-center border border-stone-100 dark:border-stone-800/40">
            <p className={`text-[18px] font-extrabold leading-none tabular-nums ${s.color}`}>{s.value}</p>
            <p className="text-[10.5px] text-stone-400 dark:text-stone-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Búsqueda ── */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
          width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          type="text"
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre o arete…"
          className="w-full h-9 pl-9 pr-8 rounded-[8px] border border-stone-200 dark:border-stone-700/60 bg-white dark:bg-[#1c1917] text-[12px] text-stone-700 dark:text-stone-300 placeholder:text-stone-400 outline-none focus:border-[#2FAF8F]/50 transition-all"
        />
        {busqueda && (
          <button onClick={() => setBusqueda('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-300 hover:text-stone-500 transition-colors cursor-pointer bg-transparent border-0 p-0">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        )}
      </div>

      {/* ── Lista ── */}
      <div className="bg-white dark:bg-[#1c1917] border border-stone-200/60 dark:border-stone-800/50 rounded-[12px] overflow-hidden">

        {/* Pendientes primero */}
        {pendientes.length > 0 && (
          <div className="border-b border-stone-100 dark:border-stone-800/40">
            <p className="text-[10.5px] font-semibold text-amber-500 uppercase tracking-[0.06em] px-4 pt-3 pb-1.5">
              Pendientes de confirmación
            </p>
            {pendientes.map((r, i) => (
              <RegistroRow key={r.capturaId} registro={r} onClick={onSelectRegistro}
                hasBorder={i < pendientes.length - 1} highlight />
            ))}
          </div>
        )}

        {filtrados
          .filter(r => !(r.resultado === 'candidato' && !r.confirmado))
          .map((r, i, arr) => (
            <RegistroRow key={r.capturaId} registro={r} onClick={onSelectRegistro}
              hasBorder={i < arr.length - 1} />
          ))}

        {filtrados.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2.5 py-12">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" className="text-stone-300 dark:text-stone-700">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <p className="text-[12.5px] text-stone-400 dark:text-stone-500">
              {busqueda ? `Sin resultados para "${busqueda}"` : 'Sin huellas registradas'}
            </p>
          </div>
        )}
      </div>

      {filtrados.length > 0 && (
        <p className="text-[11px] text-stone-400 dark:text-stone-500">
          {filtrados.length} huella{filtrados.length !== 1 ? 's' : ''} encontrada{filtrados.length !== 1 ? 's' : ''}
          {busqueda ? ` para "${busqueda}"` : ''}
        </p>
      )}
    </div>
  )
}

// ── FILA ──────────────────────────────────────────────────────────────────────

function RegistroRow({ registro: r, onClick, hasBorder, highlight }: {
  registro:   RegistroCaptura
  onClick?:   (r: RegistroCaptura) => void
  hasBorder?: boolean
  highlight?: boolean
}) {
  const cfg = RESULTADO_COLOR[r.resultado as keyof typeof RESULTADO_COLOR] ?? RESULTADO_COLOR.match

  return (
    <div
      onClick={() => onClick?.(r)}
      className={`flex items-center gap-3 py-2.5 cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-800/20 transition-colors px-4 ${
        hasBorder ? 'border-b border-stone-100 dark:border-stone-800/40' : ''
      } ${highlight ? 'bg-amber-50/40 dark:bg-amber-950/10' : ''}`}
    >
      <span className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot} ${
        r.resultado === 'candidato' && !r.confirmado ? 'animate-pulse' : ''
      }`}/>

      <div className="flex-1 min-w-0">
        <p className="text-[12.5px] font-semibold text-stone-700 dark:text-stone-200 truncate leading-tight">
          {r.resultado === 'nuevo' ? 'Sin registro' : r.animal}
          {r.arete && r.arete !== '—' && (
            <span className="font-normal text-stone-400 dark:text-stone-500 ml-1.5 font-mono text-[11px]">{r.arete}</span>
          )}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={`text-[10.5px] font-medium ${cfg.textColor}`}>{cfg.label}</span>
          {r.confirmado && <span className="text-[10.5px] text-[#2FAF8F]">· Confirmado</span>}
          <span className="text-[10.5px] text-stone-300 dark:text-stone-600">
            {r.modo === 'direct' ? 'Cámara' : 'Hoja'}
          </span>
        </div>
      </div>

      <div className="text-right shrink-0">
        {r.score > 0 && (
          <p className={`text-[13px] font-bold leading-tight tabular-nums ${
            r.score >= 0.80 ? 'text-[#2FAF8F]' : r.score >= 0.50 ? 'text-amber-500' : 'text-red-400'
          }`}>
            {Math.round(r.score * 100)}%
          </p>
        )}
        <p className="text-[10px] text-stone-400 dark:text-stone-500 mt-0.5">{r.ts}</p>
      </div>
    </div>
  )
}