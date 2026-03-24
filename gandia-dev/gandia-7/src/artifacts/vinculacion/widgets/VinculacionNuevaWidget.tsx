/**
 * VinculacionNuevaWidget
 * Formulario para solicitar una nueva vinculación.
 * Busca entidades reales en user_profiles via Supabase.
 * onEnviar recibe: tipo, receptorId (UUID), mensaje, expiraDias?
 */

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import type { VinculacionTipo } from '../../artifactTypes'
import { buscarEntidades } from '../../../services/vinculacionService'
import type { EntidadBuscable } from '../../../services/vinculacionService'
import { useUser } from '../../../context/UserContext'

const VIN_COLOR = '#0ea5e9'

const TIPOS: { id: VinculacionTipo; label: string; desc: string; color: string }[] = [
  { id: 'sanitario', label: 'Sanitario',  desc: 'MVZ para registrar eventos de salud',    color: '#22c55e' },
  { id: 'comercial', label: 'Comercial',  desc: 'Exportador para compra de un lote',      color: '#f97316' },
  { id: 'auditoria', label: 'Auditoría',  desc: 'Auditor con acceso temporal de lectura', color: '#a855f7' },
  { id: 'union',     label: 'Unión',      desc: 'Unión Ganadera para reportes',            color: VIN_COLOR },
]

const ROLE_LABEL: Record<string, string> = {
  productor_ganadero: 'Productor',
  producer:           'Productor',
  mvz:                'MVZ',
  exportador:         'Exportador',
  exporter:           'Exportador',
  auditor:            'Auditor',
  union_ganadera:     'Unión Ganadera',
  union:              'Unión Ganadera',
  admin:              'Admin',
}

interface Props {
  onEnviar?: (tipo: VinculacionTipo, receptorId: string, mensaje: string, expiraDias?: number) => Promise<void>
}

export default function VinculacionNuevaWidget({ onEnviar }: Props) {
  const { profile } = useUser()
  const currentUserId = profile?.user_id ?? ''
  const [busqueda,    setBusqueda]    = useState('')
  const [resultados,  setResultados]  = useState<EntidadBuscable[]>([])
  const [buscando,    setBuscando]    = useState(false)
  const [entidad,     setEntidad]     = useState<EntidadBuscable | null>(null)
  const [tipo,        setTipo]        = useState<VinculacionTipo | null>(null)
  const [mensaje,     setMensaje]     = useState('')
  const [expiraDias,  setExpiraDias]  = useState('30')
  const [enviado,     setEnviado]     = useState(false)
  const [enviando,    setEnviando]    = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  
  // ── Portal position ───────────────────────────────────────────────────────
  const inputRef = useRef<HTMLInputElement>(null)
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({})

  useEffect(() => {
    if ((buscando || resultados.length > 0) && inputRef.current) {
      const updatePosition = () => {
        if (!inputRef.current) return
        const rect = inputRef.current.getBoundingClientRect()
        const newStyle: React.CSSProperties = {
          position: 'fixed',
          top: rect.bottom + 4,
          left: rect.left,
          width: rect.width,
          zIndex: 99999, // Super alto
          pointerEvents: 'auto',
          visibility: rect.top === 0 ? 'hidden' : 'visible' // Evitar mostrar en 0,0 antes de calcular
        }
        setDropdownStyle(newStyle)
      }
      
      updatePosition()
      // Pequeño delay para asegurar que el DOM se asentó
      const t = setTimeout(updatePosition, 50)
      
      window.addEventListener('resize', updatePosition)
      window.addEventListener('scroll', updatePosition, true)
      return () => {
        clearTimeout(t)
        window.removeEventListener('resize', updatePosition)
        window.removeEventListener('scroll', updatePosition, true)
      }
    }
  }, [buscando, resultados.length, busqueda]) // Añadido busqueda como dep

  // ── Búsqueda con debounce de 300ms ────────────────────────────────────────

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!busqueda || busqueda.length < 2) {
      setResultados([])
      return
    }
    debounceRef.current = setTimeout(async () => {
      setBuscando(true)
      const found = await buscarEntidades(busqueda, currentUserId)
      setResultados(found)
      setBuscando(false)
    }, 300)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [busqueda, currentUserId])

  const handleEnviar = async () => {
    if (!entidad || !tipo) return
    setEnviando(true)
    await onEnviar?.(
      tipo,
      entidad.user_id,
      mensaje,
      tipo === 'auditoria' ? parseInt(expiraDias) : undefined
    )
    setEnviando(false)
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
          {entidad?.nombre} recibirá la solicitud y podrá aceptar o rechazar.
        </p>
        <button
          onClick={() => {
            setEnviado(false)
            setEntidad(null)
            setTipo(null)
            setMensaje('')
            setBusqueda('')
            setResultados([])
          }}
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
              <div>
                <p className="text-[12px] font-medium text-stone-700 dark:text-stone-200">{entidad.nombre}</p>
                <p className="text-[9.5px] text-stone-400 dark:text-stone-500">{ROLE_LABEL[entidad.role] ?? entidad.role}</p>
              </div>
            </div>
            <button
              onClick={() => { setEntidad(null); setBusqueda(''); setResultados([]) }}
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
              ref={inputRef}
              className={input}
              placeholder="Nombre de la entidad…"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
            />

            {/* Dropdown de resultados (Portal) */}
            {(buscando || resultados.length > 0) && createPortal(
              <div
                style={dropdownStyle}
                className="rounded-[8px] border border-stone-200 dark:border-stone-700/60 bg-white dark:bg-stone-800 shadow-lg overflow-hidden"
              >
                {buscando && (
                  <div className="px-3 py-2.5 text-[11px] text-stone-400 dark:text-stone-500 flex items-center gap-2">
                    <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                    </svg>
                    Buscando…
                  </div>
                )}
                {!buscando && resultados.length === 0 && busqueda.length >= 2 && (
                  <div className="px-3 py-2.5 text-[11px] text-stone-400 dark:text-stone-500">
                    Sin resultados para "{busqueda}"
                  </div>
                )}
                {resultados.map(r => (
                  <button
                    key={r.user_id}
                    onClick={() => { setEntidad(r); setBusqueda(''); setResultados([]) }}
                    className="w-full text-left px-3 py-2.5 hover:bg-stone-50 dark:hover:bg-stone-700/40 cursor-pointer border-0 bg-transparent transition-colors"
                  >
                    <p className="text-[12px] text-stone-700 dark:text-stone-200">{r.nombre}</p>
                    <p className="text-[9.5px] text-stone-400 dark:text-stone-500 mt-0.5">
                      {ROLE_LABEL[r.role] ?? r.role}
                    </p>
                  </button>
                ))}
              </div>,
              document.body
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
        disabled={!entidad || !tipo || enviando}
        className="flex items-center justify-center gap-2 py-2.5 rounded-[10px] text-[12px] font-semibold text-white border-0 cursor-pointer hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        style={{ background: VIN_COLOR }}
      >
        {enviando ? (
          <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
          </svg>
        ) : (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        )}
        {enviando ? 'Enviando…' : 'Enviar solicitud'}
      </button>

    </div>
  )
}