/**
 * FichaPerfilesWidget — con datos reales de Supabase
 * 
 * ARCHIVO → src/artifacts/passport/widgets/FichaPerfilesWidget.tsx
 * 
 * CAMBIOS vs versión mock:
 *   - Usa useAnimalesList() para cargar desde BD
 *   - Usa useUser() para obtener el rancho_id del usuario activo
 *   - Muestra loading y estado vacío reales
 */

import { useMemo, useState } from 'react'
import { useUser } from '../../../context/UserContext'
import { useAnimalesList, useRanchoId, type AnimalDB } from '../../../hooks/useAnimales'

// ─── TIPO PÚBLICO (compatibilidad con FichaModulo y FichaAnima) ───────────────

export interface AnimalPerfil {
  id:     string
  arete:  string    // = siniiga
  nombre: string
  raza:   string
  sexo:   string
  estado: string
}

function dbToAnimalPerfil(a: AnimalDB): AnimalPerfil {
  return {
    id:     a.id,
    arete:  a.siniiga,
    nombre: a.nombre ?? '—',
    raza:   a.raza,
    sexo:   a.sexo === 'hembra' ? 'Hembra' : 'Macho',
    estado: a.estatus,
  }
}

// ─── PROPS ────────────────────────────────────────────────────────────────────

interface Props {
  onSelectAnimal: (a: AnimalPerfil) => void
  onNuevo:        () => void
}

// ─── WIDGET ───────────────────────────────────────────────────────────────────

export default function FichaPerfilesWidget({ onSelectAnimal, onNuevo }: Props) {
  const { profile } = useUser()
  const [busqueda,  setBusqueda]  = useState('')

  const userId   = profile?.user_id ?? null
  const { ranchoId } = useRanchoId(userId)

  const { animales, loading, error, refetch } = useAnimalesList(ranchoId)

  const perfiles = useMemo(() => animales.map(dbToAnimalPerfil), [animales])

  const filtrados = useMemo(() => {
    if (!busqueda.trim()) return perfiles
    const q = busqueda.toLowerCase()
    return perfiles.filter(a =>
      a.nombre.toLowerCase().includes(q) ||
      a.arete.toLowerCase().includes(q)  ||
      a.raza.toLowerCase().includes(q)
    )
  }, [perfiles, busqueda])

  // ── Loading ──
  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <div className="flex flex-col items-center gap-3">
        <div className="w-5 h-5 border-2 border-[#2FAF8F] border-t-transparent rounded-full animate-spin" />
        <p className="text-[12px] text-stone-400 dark:text-stone-500">Cargando hato…</p>
      </div>
    </div>
  )

  // ── Error ──
  if (error) return (
    <div className="flex items-center justify-center py-16 text-center px-8">
      <div className="flex flex-col items-center gap-3">
        <p className="text-[13px] text-stone-500 dark:text-stone-400">No se pudo cargar el hato</p>
        <p className="text-[11px] text-stone-400 dark:text-stone-500 font-mono">{error}</p>
        <button
          onClick={refetch}
          className="mt-2 px-3 py-1.5 rounded-lg border border-stone-200/70 dark:border-stone-800 text-[11px] text-stone-500 hover:text-stone-700 transition-colors bg-transparent cursor-pointer"
        >
          Reintentar
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col gap-4">

      {/* ── Barra superior: búsqueda + nuevo ── */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            placeholder="Buscar por nombre, arete o raza…"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-[12px] bg-stone-50 dark:bg-stone-800/60 border border-stone-200/70 dark:border-stone-800 rounded-[8px] text-stone-700 dark:text-stone-200 placeholder-stone-300 dark:placeholder-stone-600 outline-none focus:border-[#2FAF8F]/50 transition-colors"
          />
        </div>
        <button
          onClick={onNuevo}
          className="flex items-center gap-1.5 px-3 py-2 rounded-[8px] bg-[#2FAF8F] text-white text-[11px] font-semibold hover:bg-[#27a07f] transition-colors border-0 cursor-pointer shrink-0"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Registrar
        </button>
      </div>

      {/* ── Contador ── */}
      <div className="flex items-center gap-1.5">
        <p className="text-[11px] text-stone-400 dark:text-stone-500">
          {filtrados.length} {filtrados.length === 1 ? 'animal' : 'animales'}
          {busqueda ? ` · buscando "${busqueda}"` : ' en el hato'}
        </p>
      </div>

      {/* ── Lista vacía ── */}
      {filtrados.length === 0 && !busqueda && (
        <div className="flex flex-col items-center gap-3 py-14 text-center">
          <div className="w-10 h-10 rounded-2xl bg-stone-100 dark:bg-stone-800/60 flex items-center justify-center">
            <svg className="w-5 h-5 text-stone-400 dark:text-stone-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <p className="text-[13px] text-stone-500 dark:text-stone-400">Sin animales registrados</p>
          <p className="text-[11px] text-stone-400 dark:text-stone-500 max-w-48 leading-relaxed">
            Registra tu primer animal para comenzar a gestionar el hato
          </p>
          <button
            onClick={onNuevo}
            className="mt-2 px-4 py-2 rounded-[8px] bg-[#2FAF8F] text-white text-[12px] font-semibold hover:bg-[#27a07f] transition-colors border-0 cursor-pointer"
          >
            Registrar animal
          </button>
        </div>
      )}

      {/* ── Lista de animales ── */}
      {filtrados.length > 0 && (
        <div className="flex flex-col gap-2">
          {filtrados.map(a => (
            <button
              key={a.id}
              onClick={() => onSelectAnimal(a)}
              className="flex items-center gap-3 p-3 rounded-[10px] border border-stone-200/70 dark:border-stone-800 bg-white dark:bg-[#1c1917] hover:border-[#2FAF8F]/40 hover:shadow-sm transition-all text-left cursor-pointer w-full"
            >
              {/* Avatar */}
              <div className="w-9 h-9 rounded-[8px] bg-[#2FAF8F]/10 dark:bg-[#2FAF8F]/15 flex items-center justify-center shrink-0">
                <span className="text-[13px] font-bold text-[#2FAF8F]">
                  {(a.nombre && a.nombre !== '—') ? a.nombre[0].toUpperCase() : '#'}
                </span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-[12.5px] font-semibold text-stone-700 dark:text-stone-200 truncate">
                    {a.nombre && a.nombre !== '—' ? a.nombre : a.arete}
                  </p>
                  <span className={`text-[9.5px] font-mono font-semibold px-1.5 py-0.5 rounded tracking-wider uppercase shrink-0 ${
                    a.estado === 'activo'
                      ? 'text-[#2FAF8F] bg-[#2FAF8F]/10'
                      : 'text-stone-400 bg-stone-100 dark:bg-stone-800/60'
                  }`}>
                    {a.estado}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="font-mono text-[10.5px] text-stone-400 dark:text-stone-500 truncate">{a.arete}</p>
                  <span className="text-stone-200 dark:text-stone-700 text-[9px]">·</span>
                  <p className="text-[10.5px] text-stone-400 dark:text-stone-500 truncate">{a.raza}</p>
                  <span className="text-stone-200 dark:text-stone-700 text-[9px]">·</span>
                  <p className="text-[10.5px] text-stone-400 dark:text-stone-500">{a.sexo}</p>
                </div>
              </div>

              <svg className="w-3.5 h-3.5 text-stone-300 dark:text-stone-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}