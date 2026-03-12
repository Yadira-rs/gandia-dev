/**
 * VinculacionNuevaWidget
 * Formulario para solicitar una nueva vinculación.
 * Busca entidad por nombre/clave, elige tipo, mensaje opcional.
 */

import { useState } from 'react'
import type { Vinculacion } from '../../artifactTypes'

const VIN_COLOR = '#0ea5e9'

const TIPOS: { id: Vinculacion['tipo']; label: string; desc: string; color: string }[] = [
  { id: 'sanitario', label: 'Sanitario',  desc: 'MVZ para registrar eventos de salud',   color: '#22c55e' },
  { id: 'comercial', label: 'Comercial',  desc: 'Exportador para compra de un lote',     color: '#f97316' },
  { id: 'auditoria', label: 'Auditoría',  desc: 'Auditor con acceso temporal de lectura', color: '#a855f7' },
  { id: 'union',     label: 'Unión',      desc: 'Unión Ganadera para reportes',           color: VIN_COLOR },
]

// Mock de entidades buscables
const ENTIDADES_MOCK = [
  'MVZ Dr. García',
  'MVZ Dra. Sánchez',
  'Exportadora Norte',
  'Exportadora Bajío',
  'Auditor SENASICA',
  'Unión Ganadera DGO',
  'Unión Ganadera CHI',
]

interface Props {
  onEnviar?: (tipo: Vinculacion['tipo'], entidad: string, mensaje: string) => void
}

export default function VinculacionNuevaWidget({ onEnviar }: Props) {
  const [busqueda,   setBusqueda]   = useState('')
  const [entidad,    setEntidad]    = useState('')
  const [tipo,       setTipo]       = useState<Vinculacion['tipo'] | null>(null)
  const [mensaje,    setMensaje]    = useState('')
  const [enviado,    setEnviado]    = useState(false)
  const [expiraDias, setExpiraDias] = useState('30')

  const sugerencias = busqueda.length > 1
    ? ENTIDADES_MOCK.filter(e => e.toLowerCase().includes(busqueda.toLowerCase()) && e !== entidad)
    : []

  const handleEnviar = () => {
    if (!entidad || !tipo) return
    onEnviar?.(tipo, entidad, mensaje)
    setEnviado(true)
  }

  if (enviado) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: `${VIN_COLOR}18` }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={VIN_COLOR} strokeWidth="2" strokeLinecap="round">
            <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </div>
        <p className="text-[13px] font-semibold text-stone-700 dark:text-stone-200">Solicitud enviada</p>
        <p className="text-[11px] text-stone-400 dark:text-stone-500 max-w-56 leading-relaxed">
          {entidad} recibirá la solicitud y podrá aceptar o rechazar.
        </p>
        <button
          onClick={() => { setEnviado(false); setEntidad(''); setTipo(null); setMensaje(''); setBusqueda('') }}
          className="text-[11px] font-medium cursor-pointer bg-transparent border-0 p-0 transition-colors"
          style={{ color: VIN_COLOR }}
        >
          Nueva solicitud
        </button>
      </div>
    )
  }

  const label = 'block font-mono text-[9px] uppercase tracking-[1px] text-stone-400 dark:text-stone-500 mb-1.5'
  const input = 'w-full px-3 py-2 rounded-[8px] border border-stone-200 dark:border-stone-700/60 bg-white dark:bg-stone-800/40 text-[12px] text-stone-800 dark:text-stone-100 focus:outline-none focus:border-sky-400/60 focus:ring-1 focus:ring-sky-400/20 transition-all'

  return (
    <div className="flex flex-col gap-3">

      {/* Banner */}
      <div className="p-3 rounded-[10px] bg-sky-50/60 dark:bg-sky-950/10 border border-sky-100 dark:border-sky-900/30">
        <p className="text-[11px] font-semibold text-sky-700 dark:text-sky-400">Nueva vinculación</p>
        <p className="text-[10.5px] text-stone-400 dark:text-stone-500 mt-0.5">
          Solo entidades formalmente vinculadas pueden acceder a tu información.
        </p>
      </div>

      {/* Buscar entidad */}
      <div className="relative">
        <label className={label}>Buscar entidad</label>
        {entidad ? (
          <div className="flex items-center justify-between px-3 py-2 rounded-[8px] border border-sky-200 dark:border-sky-800/60 bg-sky-50/50 dark:bg-sky-950/10">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: VIN_COLOR }}/>
              <p className="text-[12px] font-medium text-stone-700 dark:text-stone-200">{entidad}</p>
            </div>
            <button
              onClick={() => { setEntidad(''); setBusqueda('') }}
              className="text-stone-400 hover:text-stone-600 cursor-pointer bg-transparent border-0 p-0"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        ) : (
          <>
            <input
              className={input}
              placeholder="Nombre o clave de la entidad…"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
            />
            {sugerencias.length > 0 && (
              <div className="absolute z-10 left-0 right-0 mt-1 rounded-[8px] border border-stone-200 dark:border-stone-700/60 bg-white dark:bg-stone-800 shadow-lg overflow-hidden">
                {sugerencias.map(s => (
                  <button
                    key={s}
                    onClick={() => { setEntidad(s); setBusqueda('') }}
                    className="w-full text-left px-3 py-2.5 text-[12px] text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-700/40 cursor-pointer border-0 bg-transparent transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Tipo */}
      <div>
        <label className={label}>Tipo de vinculación</label>
        <div className="grid grid-cols-2 gap-2">
          {TIPOS.map(t => (
            <button
              key={t.id}
              onClick={() => setTipo(t.id)}
              className="flex flex-col gap-0.5 p-2.5 rounded-[8px] border text-left cursor-pointer transition-all"
              style={{
                borderColor: tipo === t.id ? t.color : 'rgba(231,229,228,0.8)',
                background:  tipo === t.id ? `${t.color}12` : 'transparent',
              }}
            >
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: t.color }}/>
                <p className="text-[11.5px] font-semibold text-stone-700 dark:text-stone-200">{t.label}</p>
              </div>
              <p className="text-[9.5px] text-stone-400 dark:text-stone-500 leading-snug pl-3">{t.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Expiración solo para auditoría */}
      {tipo === 'auditoria' && (
        <div>
          <label className={label}>Días de acceso</label>
          <div className="flex gap-2">
            {['15', '30', '60', '90'].map(d => (
              <button
                key={d}
                onClick={() => setExpiraDias(d)}
                className="flex-1 py-2 rounded-[7px] text-[12px] font-medium border cursor-pointer transition-all"
                style={{
                  background:  expiraDias === d ? VIN_COLOR : 'transparent',
                  color:       expiraDias === d ? 'white' : '#78716c',
                  borderColor: expiraDias === d ? VIN_COLOR : '#e7e5e4',
                }}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Mensaje opcional */}
      <div>
        <label className={label}>Mensaje (opcional)</label>
        <textarea
          className={`${input} resize-none`}
          rows={2}
          placeholder="Motivo de la solicitud…"
          value={mensaje}
          onChange={e => setMensaje(e.target.value)}
        />
      </div>

      <button
        onClick={handleEnviar}
        disabled={!entidad || !tipo}
        className="flex items-center justify-center gap-2 py-2.5 rounded-[10px] text-[12px] font-semibold text-white border-0 cursor-pointer hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        style={{ background: VIN_COLOR }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
        </svg>
        Enviar solicitud
      </button>

    </div>
  )
}