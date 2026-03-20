import { useNavigate } from 'react-router-dom'

export default function AlertasPage() {
  const navigate = useNavigate()

  const PROXIMAS = [
    { label: 'Alertas sanitarias por región'          },
    { label: 'Movimientos de precio del becerro'      },
    { label: 'Cambios normativos SENASICA / USDA'     },
    { label: 'Condiciones climáticas extremas'        },
    { label: 'Cierres o restricciones de exportación' },
  ]

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600&display=swap');
        .np, .np * { font-family: 'Geist', system-ui, sans-serif; -webkit-font-smoothing: antialiased; }
        .s { font-family: 'Instrument Serif', Georgia, serif; }
        @keyframes fu { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
        .fu { animation: fu 380ms cubic-bezier(.16,1,.3,1) both; }
        @keyframes pulse-ring {
          0%   { transform: scale(1);    opacity: 0.6; }
          100% { transform: scale(1.6);  opacity: 0;   }
        }
        .pulse-ring { animation: pulse-ring 2s ease-out infinite; }
      `}</style>

      <div className="np min-h-screen bg-[#fafaf9] dark:bg-[#0c0a09] flex items-center justify-center px-8 py-20">
        <div className="max-w-[460px] w-full fu">

          {/* Ícono animado */}
          <div className="relative w-16 h-16 mx-auto mb-8">
            <div className="absolute inset-0 rounded-2xl bg-[#2FAF8F]/10 pulse-ring" />
            <div className="relative w-16 h-16 rounded-2xl bg-[#2FAF8F]/10 flex items-center justify-center">
              <svg className="w-7 h-7 text-[#2FAF8F]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                <line x1="12" y1="2" x2="12" y2="4"/>
              </svg>
            </div>
          </div>

          <h1 className="s text-[26px] text-stone-900 dark:text-stone-50 text-center mb-3">
            Alertas inteligentes
          </h1>
          <p className="text-[14px] text-stone-400 dark:text-stone-500 text-center leading-[1.7] mb-10">
            Recibe notificaciones inmediatas sobre lo que importa para tu operación. Filtra por región, tipo y nivel de urgencia.
          </p>

          {/* Tipos de alertas próximas */}
          <div className="space-y-2 mb-10">
            {PROXIMAS.map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3.5 rounded-xl border border-stone-200/60 dark:border-stone-800/50 bg-white dark:bg-[#141210]"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-[#2FAF8F] shrink-0" />
                <span className="text-[13px] font-medium text-stone-700 dark:text-stone-300">
                  {item.label}
                </span>
                <span className="ml-auto text-[10px] font-semibold text-[#2FAF8F] px-2 py-0.5 bg-[#2FAF8F]/10 rounded-full">
                  Pronto
                </span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center space-y-3">
            <button
              onClick={() => navigate('/configuraciones')}
              className="w-full h-11 rounded-xl bg-[#2FAF8F] hover:bg-[#27a07f] text-white text-[13.5px] font-semibold transition-colors"
            >
              Configurar preferencias de notificación
            </button>
            <button
              onClick={() => navigate('/noticias')}
              className="w-full h-11 rounded-xl text-[13.5px] font-medium text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
            >
              Volver al Radar
            </button>
          </div>

          {/* Nota */}
          <p className="text-center text-[11px] text-stone-300 dark:text-stone-600 mt-8 leading-[1.6]">
            Las alertas llegarán por notificación push y por email según tus preferencias.
            El sistema priorizará según tu perfil y región.
          </p>
        </div>
      </div>
    </>
  )
}