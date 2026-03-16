/**
 * BiometriaConfigWidget — Widget: biometria:config
 * ARCHIVO → src/artifacts/biometria/widgets/BiometriaConfigWidget.tsx
 */
import { useState } from 'react'
import { useUser }     from '../../../context/UserContext'
import { useRanchoId } from '../../../hooks/useAnimales'
import {
  PARAMS_DEFAULT,
  loadConfig,
  saveConfig,
  parseBiometriaConfig,
  type Parametro,
  type BiometriaConfig,
} from '../../../hooks/useBiometriaConfig'

interface Props {
  onGuardar?: (config: BiometriaConfig) => void
}

export default function BiometriaConfigWidget({ onGuardar }: Props) {
  const { profile }  = useUser()
  const userId       = profile?.user_id ?? null
  const { ranchoId } = useRanchoId(userId)

  // Inicialización lazy: carga desde localStorage en el primer render
  const [params,   setParams]   = useState<Parametro[]>(() => loadConfig(ranchoId))
  const [editando, setEditando] = useState<string | null>(null)
  const [saved,    setSaved]    = useState(false)
  const [dirty,    setDirty]    = useState(false)

  const update = (id: string, valor: string) => {
    setParams(p => p.map(pm => pm.id === id ? { ...pm, valor } : pm))
    setDirty(true)
  }

  const save = () => {
    if (!ranchoId) return
    saveConfig(ranchoId, params)
    setSaved(true)
    setDirty(false)
    onGuardar?.(parseBiometriaConfig(params))
    setTimeout(() => setSaved(false), 1800)
  }

  const reset = () => {
    setParams(PARAMS_DEFAULT)
    setDirty(true)
  }

  const grupos = [...new Set(params.map(p => p.grupo))]

  return (
    <div className="flex flex-col gap-4">

      {/* ── Estado del motor ── */}
      <div className="bg-white dark:bg-[#1c1917] border border-stone-200/60 dark:border-stone-800/50 rounded-[12px] px-4 py-3.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2FAF8F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
          </svg>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-stone-800 dark:text-stone-100 leading-tight">Motor Biométrico v2.1</p>
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2FAF8F] animate-pulse shrink-0"/>
              <p className="text-[11.5px] text-stone-400 dark:text-stone-500">Fingerprint CV + ResNet50 · Fusión 55/45</p>
              {ranchoId && (
                <span className="text-[10px] font-medium text-[#2FAF8F] bg-[#2FAF8F]/08 dark:bg-[#2FAF8F]/12 border border-[#2FAF8F]/20 px-1.5 py-0.5 rounded-[5px]">
                  Config guardada localmente
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {dirty && (
            <button
              onClick={reset}
              className="h-9 px-3.5 rounded-[8px] border border-stone-200 dark:border-stone-700/60 bg-white dark:bg-[#141210] text-[12px] text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 cursor-pointer transition-all"
            >
              Restablecer
            </button>
          )}
          <button
            onClick={save}
            disabled={!dirty}
            className={`h-9 px-5 rounded-[8px] border-0 text-white text-[12.5px] font-semibold transition-all shrink-0 ${
              saved
                ? 'bg-[#2FAF8F] opacity-70 cursor-default'
                : dirty
                ? 'bg-[#2FAF8F] hover:bg-[#27a07f] active:scale-[0.97] cursor-pointer'
                : 'bg-stone-300 dark:bg-stone-700 cursor-not-allowed'
            }`}
          >
            {saved ? 'Guardado ✓' : 'Guardar cambios'}
          </button>
        </div>
      </div>

      {/* ── Parámetros por grupo ── */}
      {grupos.map(grupo => (
        <div key={grupo} className="bg-white dark:bg-[#1c1917] border border-stone-200/60 dark:border-stone-800/50 rounded-[12px] overflow-hidden">
          <div className="px-4 py-3 border-b border-stone-100 dark:border-stone-800/40">
            <p className="text-[11px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-[0.07em]">{grupo}</p>
          </div>

          {params.filter(p => p.grupo === grupo).map((p, i, arr) => (
            <div
              key={p.id}
              className={`flex items-center gap-4 px-4 py-3.5 ${i < arr.length - 1 ? 'border-b border-stone-100 dark:border-stone-800/40' : ''}`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-[13px] font-medium text-stone-700 dark:text-stone-200">{p.label}</p>
                  {p.tag && (
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-[5px] border ${
                      p.tagOk
                        ? 'bg-[#2FAF8F]/08 dark:bg-[#2FAF8F]/12 text-[#2FAF8F] border-[#2FAF8F]/25'
                        : 'bg-amber-50 dark:bg-amber-950/25 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/30'
                    }`}>
                      {p.tag}
                    </span>
                  )}
                </div>
                <p className="text-[11.5px] text-stone-400 dark:text-stone-500 mt-0.5 leading-relaxed">{p.desc}</p>
              </div>

              {editando === p.id ? (
                <input
                  defaultValue={p.valor}
                  autoFocus
                  onChange={e => update(p.id, e.target.value)}
                  onBlur={() => setEditando(null)}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') setEditando(null) }}
                  className="w-20 h-9 px-3 rounded-[8px] border border-[#2FAF8F]/40 bg-white dark:bg-[#1c1917] text-[13px] font-bold text-[#2FAF8F] outline-none text-center"
                />
              ) : (
                <button
                  onClick={() => setEditando(p.id)}
                  className={`h-9 px-4 rounded-[8px] border text-[13px] font-bold min-w-[72px] text-center cursor-pointer transition-all ${
                    dirty
                      ? 'border-[#2FAF8F]/30 bg-[#2FAF8F]/05 dark:bg-[#2FAF8F]/08 text-[#2FAF8F]'
                      : 'border-stone-200 dark:border-stone-700/60 bg-stone-50 dark:bg-[#141210] text-stone-700 dark:text-stone-200 hover:border-[#2FAF8F]/40 hover:text-[#2FAF8F]'
                  }`}
                >
                  {p.valor}
                </button>
              )}
            </div>
          ))}
        </div>
      ))}

      {/* ── Aviso ── */}
      <div className="px-3.5 py-3 bg-stone-50 dark:bg-[#141210] border border-stone-200/60 dark:border-stone-800/50 rounded-[10px] flex items-start gap-2.5">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" className="text-stone-400 shrink-0 mt-0.5">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <p className="text-[12px] text-stone-500 dark:text-stone-400 leading-relaxed">
          Configuración guardada en este dispositivo. Los cambios en umbrales afectan la sensibilidad del motor — ajustar con criterio técnico veterinario.
        </p>
      </div>
    </div>
  )
}