/**
 * DocPanelGeneralWidget — Panel general de productores para la Unión Ganadera
 * ARCHIVO → src/artifacts/documentos/widgets/DocPanelGeneralWidget.tsx
 *
 * Solo la unión ganadera. Ve todos los productores, sus expedientes y su estado.
 */

import { useMemo, useState } from 'react'
import {
  useAllExpedientes,
  TRAMITE_LABEL,
  TRAMITE_COLOR,
  ESTADO_LABEL,
  ESTADO_STYLE,
  type EstadoExpediente,
  type ExpedienteDB,
} from '../../../hooks/useDocumentos'
import { useUser } from '../../../context/UserContext'

type GroupedProducer = {
  ranchoNombre:      string
  propietarioNombre: string
  expedientes:       ExpedienteDB[]
  pendientes:        number
  aprobados:         number
  rechazados:        number
}

export default function DocPanelGeneralWidget() {
  const { role } = useUser()
  const isUnion  = role === 'union' || (role as string) === 'union_ganadera'

  const { expedientes, loading, error, refetch } = useAllExpedientes()
  const [busqueda,      setBusqueda]      = useState('')
  const [filtroEstado,  setFiltroEstado]  = useState<EstadoExpediente | 'todos'>('todos')
  const [expandedKey,   setExpandedKey]   = useState<string | null>(null)

  // Agrupar por rancho
  const grupos: GroupedProducer[] = useMemo(() => {
    const map = new Map<string, GroupedProducer>()

    expedientes.forEach(exp => {
      const key = exp.rancho_id
      if (!map.has(key)) {
        map.set(key, {
          ranchoNombre:      exp.rancho_nombre      ?? 'Rancho sin nombre',
          propietarioNombre: exp.propietario_nombre ?? '—',
          expedientes:       [],
          pendientes:        0,
          aprobados:         0,
          rechazados:        0,
        })
      }
      const g = map.get(key)!
      g.expedientes.push(exp)
      if (exp.estado === 'en_revision' || exp.estado === 'borrador') g.pendientes++
      if (exp.estado === 'aprobado')  g.aprobados++
      if (exp.estado === 'rechazado') g.rechazados++
    })

    return Array.from(map.values()).sort((a, b) => b.pendientes - a.pendientes)
  }, [expedientes])

  const gruposFiltrados = useMemo(() => {
    return grupos.filter(g => {
      const matchBusqueda = !busqueda.trim()
        || g.ranchoNombre.toLowerCase().includes(busqueda.toLowerCase())
        || g.propietarioNombre.toLowerCase().includes(busqueda.toLowerCase())

      const matchEstado = filtroEstado === 'todos'
        || g.expedientes.some(e => e.estado === filtroEstado)

      return matchBusqueda && matchEstado
    })
  }, [grupos, busqueda, filtroEstado])

  // Stats globales
  const stats = useMemo(() => ({
    total:       expedientes.length,
    pendientes:  expedientes.filter(e => e.estado === 'en_revision' || e.estado === 'borrador').length,
    aprobados:   expedientes.filter(e => e.estado === 'aprobado').length,
    rechazados:  expedientes.filter(e => e.estado === 'rechazado').length,
  }), [expedientes])

  if (!isUnion) return (
    <div className="flex items-center justify-center py-12">
      <p className="text-[12px] text-stone-400 dark:text-stone-500">Solo disponible para la Unión Ganadera</p>
    </div>
  )

  if (loading) return (
    <div className="flex justify-center py-12">
      <div className="w-4 h-4 border-2 border-[#2FAF8F] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (error) return (
    <div className="flex flex-col items-center gap-2 py-10 text-center">
      <p className="text-[12px] text-stone-500">Error al cargar expedientes</p>
      <button onClick={refetch} className="text-[11px] text-[#2FAF8F] bg-transparent border-0 cursor-pointer">Reintentar</button>
    </div>
  )

  return (
    <div className="flex flex-col gap-4">

      <div>
        <p className="text-[13px] font-semibold text-stone-700 dark:text-stone-200">Panel general</p>
        <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-0.5">
          {grupos.length} productor{grupos.length !== 1 ? 'es' : ''} · {expedientes.length} expediente{expedientes.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Stats rápidas */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Pendientes', value: stats.pendientes, color: '#f59e0b' },
          { label: 'Aprobados',  value: stats.aprobados,  color: '#2FAF8F' },
          { label: 'Rechazados', value: stats.rechazados, color: '#ef4444' },
        ].map(s => (
          <div
            key={s.label}
            className="flex flex-col gap-0.5 p-3 rounded-[10px] border border-stone-200/70 dark:border-stone-800 bg-white dark:bg-[#1c1917] text-center"
          >
            <p className="text-[18px] font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[10px] text-stone-400 dark:text-stone-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Búsqueda */}
      <div className="relative">
        <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          type="text"
          placeholder="Buscar productor o rancho…"
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          className="w-full pl-8 pr-3 py-2 text-[12px] bg-stone-50 dark:bg-stone-800/60 border border-stone-200/70 dark:border-stone-800 rounded-[8px] text-stone-700 dark:text-stone-200 placeholder-stone-300 dark:placeholder-stone-600 outline-none focus:border-[#2FAF8F]/50 transition-colors"
        />
      </div>

      {/* Filtros */}
      <div className="flex gap-1.5 flex-wrap">
        {[
          { value: 'todos',       label: 'Todos'       },
          { value: 'borrador',    label: 'Borradores'  },
          { value: 'en_revision', label: 'En revisión' },
          { value: 'aprobado',    label: 'Aprobados'   },
          { value: 'rechazado',   label: 'Rechazados'  },
        ].map(f => (
          <button
            key={f.value}
            onClick={() => setFiltroEstado(f.value as EstadoExpediente | 'todos')}
            className={`px-2.5 py-1 rounded-full text-[10.5px] font-medium border-0 cursor-pointer transition-all ${
              filtroEstado === f.value
                ? 'bg-stone-800 dark:bg-stone-200 text-white dark:text-stone-900'
                : 'bg-stone-100 dark:bg-stone-800/60 text-stone-500 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Lista de productores */}
      {gruposFiltrados.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <p className="text-[12px] text-stone-400 dark:text-stone-500">Sin resultados</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {gruposFiltrados.map(grupo => {
            const key      = grupo.ranchoNombre + grupo.propietarioNombre
            const expanded = expandedKey === key

            return (
              <div
                key={key}
                className="rounded-[10px] border border-stone-200/70 dark:border-stone-800 bg-white dark:bg-[#1c1917] overflow-hidden"
              >
                {/* Fila del productor */}
                <button
                  onClick={() => setExpandedKey(expanded ? null : key)}
                  className="w-full flex items-center gap-3 p-3.5 text-left cursor-pointer bg-transparent border-0 hover:bg-stone-50 dark:hover:bg-stone-800/40 transition-colors"
                >
                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-[8px] bg-stone-100 dark:bg-stone-800 flex items-center justify-center shrink-0">
                    <span className="text-[12px] font-bold text-stone-500 dark:text-stone-400">
                      {grupo.ranchoNombre[0]?.toUpperCase() ?? 'R'}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[12.5px] font-semibold text-stone-700 dark:text-stone-200 truncate">
                      {grupo.ranchoNombre}
                    </p>
                    <p className="text-[10.5px] text-stone-400 dark:text-stone-500 truncate">
                      {grupo.propietarioNombre}
                    </p>
                  </div>

                  {/* Mini stats */}
                  <div className="flex items-center gap-2 shrink-0">
                    {grupo.pendientes > 0 && (
                      <span className="text-[9.5px] font-semibold px-1.5 py-0.5 rounded text-amber-600 bg-amber-50 dark:bg-amber-950/30">
                        {grupo.pendientes} pend.
                      </span>
                    )}
                    {grupo.aprobados > 0 && (
                      <span className="text-[9.5px] font-semibold px-1.5 py-0.5 rounded text-[#2FAF8F] bg-[#2FAF8F]/10">
                        {grupo.aprobados} aprob.
                      </span>
                    )}
                  </div>

                  {/* Flecha */}
                  <svg
                    className={`w-3.5 h-3.5 text-stone-300 dark:text-stone-600 shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}
                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                  >
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>

                {/* Expedientes expandidos */}
                {expanded && (
                  <div className="border-t border-stone-100 dark:border-stone-800/60">
                    {grupo.expedientes.map(exp => (
                      <div
                        key={exp.id}
                        className="flex items-center gap-3 px-4 py-2.5 border-b border-stone-50 dark:border-stone-800/40 last:border-0"
                      >
                        <div
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ background: TRAMITE_COLOR[exp.tipo_tramite] }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-[11.5px] font-medium text-stone-600 dark:text-stone-300 truncate">
                            {exp.titulo}
                          </p>
                          <p className="text-[10px] text-stone-400 dark:text-stone-500">
                            {TRAMITE_LABEL[exp.tipo_tramite]} · {new Date(exp.updated_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
                          </p>
                        </div>
                        <span className={`text-[9.5px] font-semibold px-1.5 py-0.5 rounded shrink-0 ${ESTADO_STYLE[exp.estado]}`}>
                          {ESTADO_LABEL[exp.estado]}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}