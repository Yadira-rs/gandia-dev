// src/components/WikiCard.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Tarjeta inline que aparece en el chat cuando Siete usa un Hecho de Wiki Handeia
// Usar en ChatMessage.tsx y en el stream de Chat.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { useNavigate } from 'react-router-dom'

export interface WikiHechoMini {
  id:            string
  afirmacion:    string
  fuente_nombre: string
  hti:           number
  dominio:       string
}

function htiColor(hti: number) {
  if (hti >= 80) return '#2FAF8F'
  if (hti >= 60) return '#f59e0b'
  return '#ef4444'
}

const DOMINIO_ICON: Record<string, string> = {
  sanidad:     '🧬',
  exportacion: '✈️',
  regulacion:  '⚖️',
  razas:       '🐄',
  nutricion:   '🌾',
  mercado:     '📈',
  bienestar:   '❤️',
  clima:       '🌦️',
}

// ─── Tarjeta única ────────────────────────────────────────────────────────────

export function WikiCard({ hecho }: { hecho: WikiHechoMini }) {
  const navigate = useNavigate()

  return (
    <button
      onClick={() => navigate(`/wiki/hecho/${hecho.id}`)}
      className="group w-full text-left mt-3 p-3.5 rounded-xl border border-[#2FAF8F]/20 bg-[#2FAF8F]/04 dark:bg-[#2FAF8F]/07 hover:border-[#2FAF8F]/40 hover:bg-[#2FAF8F]/08 dark:hover:bg-[#2FAF8F]/12 transition-all duration-150"
    >
      <div className="flex items-start gap-2.5">
        {/* Ícono dominio */}
        <span className="text-[14px] shrink-0 mt-px">{DOMINIO_ICON[hecho.dominio] ?? '📋'}</span>

        {/* Contenido */}
        <div className="flex-1 min-w-0">
          {/* Label */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[9.5px] font-semibold text-[#2FAF8F] uppercase tracking-[0.08em]">
              Wiki Handeia
            </span>
            <span
              className="text-[9px] font-bold px-1.5 py-px rounded-full"
              style={{ color: htiColor(hecho.hti), background: `${htiColor(hecho.hti)}20` }}
            >
              HTI {hecho.hti}
            </span>
          </div>

          {/* Afirmación */}
          <p className="text-[12.5px] font-medium text-stone-700 dark:text-stone-300 leading-[1.5] line-clamp-2 group-hover:text-stone-900 dark:group-hover:text-white transition-colors">
            {hecho.afirmacion}
          </p>

          {/* Fuente */}
          <p className="text-[10.5px] text-stone-400 dark:text-stone-500 mt-1 flex items-center gap-1.5">
            <svg className="w-2.5 h-2.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            {hecho.fuente_nombre}
          </p>
        </div>

        {/* Flecha */}
        <svg
          className="w-3 h-3 text-[#2FAF8F]/40 group-hover:text-[#2FAF8F] transition-colors shrink-0 mt-1"
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
        >
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </div>
    </button>
  )
}

// ─── Conjunto de tarjetas (cuando hay varios Hechos) ─────────────────────────

export function WikiCardSet({ hechos }: { hechos: WikiHechoMini[] }) {
  if (!hechos || hechos.length === 0) return null

  return (
    <div className="mt-4 space-y-2">
      <p className="text-[10px] font-semibold text-stone-300 dark:text-stone-600 uppercase tracking-[0.08em]">
        Basado en Wiki Handeia
      </p>
      {hechos.map(h => <WikiCard key={h.id} hecho={h} />)}
    </div>
  )
}

// ─── INSTRUCCIONES DE USO ─────────────────────────────────────────────────────
//
// 1. En chatService.ts / useChat.ts — capturar wiki_hechos de la respuesta:
//
//    Cuando el backend responde, si parsed.wiki_hechos existe, guardarlos
//    en el UIMessage como:
//      wiki_hechos: parsed.wiki_hechos as WikiHechoMini[]
//
// 2. En chatTypes.ts — agregar al tipo UIMessage:
//      wiki_hechos?: WikiHechoMini[]
//
// 3. En ChatMessage.tsx — renderizar al final del mensaje assistant:
//      {msg.wiki_hechos && msg.wiki_hechos.length > 0 && (
//        <WikiCardSet hechos={msg.wiki_hechos} />
//      )}
//
// 4. En Chat.tsx — durante streaming, si la respuesta final tiene wiki_hechos:
//    Actualizar el mensaje con los hechos cuando el stream complete.
//
// ─────────────────────────────────────────────────────────────────────────────