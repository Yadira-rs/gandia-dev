import { useState, useRef } from 'react'

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface TarjetaGuardada {
  ultimos: string
  tipo: string
  vence: string
}

interface AgregarTarjetaProps {
  isOpen: boolean
  onClose: () => void
  onGuardar: (tarjeta: TarjetaGuardada) => void
}

// ─── ICONS ────────────────────────────────────────────────────────────────────
const sv = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '1.75', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

const IcoX          = () => <svg className="w-4 h-4" {...sv}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
const IcoInfo       = () => <svg className="w-3.5 h-3.5" {...sv}><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
const IcoLock       = () => <svg className="w-3 h-3" {...sv}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
const IcoCreditCard = () => <svg className="w-5 h-5" {...sv}><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
const IcoSpark      = () => <svg className="w-3 h-3" {...sv}><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const formatCardNumber = (val: string) =>
  val.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim()

const formatExpiry = (val: string) => {
  const digits = val.replace(/\D/g, '').slice(0, 4)
  if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return digits
}

const detectCardType = (num: string): string => {
  const n = num.replace(/\s/g, '')
  if (/^4/.test(n))          return 'Visa'
  if (/^5[1-5]/.test(n))     return 'Mastercard'
  if (/^3[47]/.test(n))      return 'Amex'
  if (/^6(?:011|5)/.test(n)) return 'Discover'
  return ''
}

// Card network logo (minimal SVG badges)
function CardBadge({ tipo }: { tipo: string }) {
  if (!tipo) return null
  const colors: Record<string, string> = {
    Visa: '#1a1f71', Mastercard: '#eb001b', Amex: '#007bc1', Discover: '#f76f20',
  }
  return (
    <span
      className="inline-flex items-center h-5 px-2 rounded text-[9px] font-bold text-white tracking-wide"
      style={{ backgroundColor: colors[tipo] ?? '#888' }}
    >
      {tipo.toUpperCase()}
    </span>
  )
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function AgregarTarjeta({ isOpen, onClose, onGuardar }: AgregarTarjetaProps) {
  const [numero,    setNumero]    = useState('')
  const [titular,   setTitular]   = useState('')
  const [vencimiento, setVencimiento] = useState('')
  const [cvv,       setCvv]       = useState('')
  const [cvvVisible, setCvvVisible] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  const refTitular = useRef<HTMLInputElement>(null)
  const refVence   = useRef<HTMLInputElement>(null)
  const refCvv     = useRef<HTMLInputElement>(null)

  const tipo    = detectCardType(numero)
  const digitos = numero.replace(/\s/g, '')

  const limpiar = () => {
    setNumero(''); setTitular(''); setVencimiento(''); setCvv('')
    setError(null); setGuardando(false); setCvvVisible(false)
  }

  const cerrar = () => { limpiar(); onClose() }

  const handleNumero = (val: string) => {
    setNumero(formatCardNumber(val))
    if (val.replace(/\D/g, '').length === 16) refTitular.current?.focus()
  }

  const handleVence = (val: string) => {
    setVencimiento(formatExpiry(val))
    if (val.replace(/\D/g, '').length === 4) refCvv.current?.focus()
  }

  const validar = (): string | null => {
    if (digitos.length < 13) return 'Número de tarjeta inválido'
    if (!titular.trim())     return 'Ingresa el nombre del titular'
    const [mm, yy] = vencimiento.split('/')
    const mes = parseInt(mm); const anio = parseInt('20' + yy)
    const ahora = new Date()
    if (!mm || !yy || mes < 1 || mes > 12 || new Date(anio, mes - 1) < ahora)
      return 'Fecha de vencimiento inválida'
    if (cvv.length < 3) return 'CVV inválido'
    return null
  }

  const handleGuardar = async () => {
    const err = validar()
    if (err) { setError(err); return }
    setError(null)
    setGuardando(true)
    await new Promise(r => setTimeout(r, 900)) // simula request
    const [mm, yy] = vencimiento.split('/')
    onGuardar({
      ultimos: digitos.slice(-4),
      tipo:    tipo || 'Tarjeta',
      vence:   `${mm}/${yy}`,
    })
    limpiar()
  }

  if (!isOpen) return null

  const isAmex = tipo === 'Amex'

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600&display=swap');

        .at * { -webkit-font-smoothing: antialiased; }
        .at { font-family: 'Geist', system-ui, sans-serif; }
        .at-serif { font-family: 'Instrument Serif', Georgia, serif; }
        .at *:focus-visible { outline: none !important; }

        @keyframes at-overlay { from { opacity: 0; } to { opacity: 1; } }
        @keyframes at-modal {
          from { opacity: 0; transform: translateY(14px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
        .at-overlay { animation: at-overlay 180ms ease both; }
        .at-modal   { animation: at-modal   280ms cubic-bezier(.16,1,.3,1) both; }

        .at-input {
          width: 100%;
          height: 44px;
          padding: 0 14px;
          background: transparent;
          border: 1.5px solid;
          border-radius: 12px;
          font-size: 14px;
          font-family: 'Geist', system-ui, sans-serif;
          transition: border-color 150ms, box-shadow 150ms;
          -webkit-font-smoothing: antialiased;
        }
        .at-input::placeholder { color: #a8a29e; }
        .at-input:focus { outline: none; }

        /* light */
        .at-input {
          border-color: #e7e5e4;
          color: #1c1917;
          box-shadow: none;
        }
        .at-input:focus {
          border-color: #2FAF8F;
          box-shadow: 0 0 0 3px rgba(47,175,143,0.12);
        }

        /* dark */
        .dark .at-input {
          border-color: #3c3836;
          color: #fafaf9;
          background: transparent;
        }
        .dark .at-input:focus {
          border-color: #2FAF8F;
          box-shadow: 0 0 0 3px rgba(47,175,143,0.15);
        }

        /* card number monospace feel */
        .at-card-num {
          font-variant-numeric: tabular-nums;
          letter-spacing: 0.08em;
          font-size: 15px;
        }

        @keyframes at-shake {
          0%,100% { transform: translateX(0); }
          20%,60%  { transform: translateX(-4px); }
          40%,80%  { transform: translateX(4px); }
        }
        .at-shake { animation: at-shake 320ms ease; }
      `}</style>

      <div
        className="at at-overlay fixed inset-0 z-[60] bg-black/40 backdrop-blur-[3px] flex items-end sm:items-center justify-center p-0 sm:p-4"
        onClick={e => e.target === e.currentTarget && cerrar()}
      >
        <div className="at-modal bg-[#fafaf9] dark:bg-[#111009] w-full sm:max-w-[420px] sm:rounded-2xl rounded-t-2xl border border-stone-200/70 dark:border-stone-800/60 shadow-[0_24px_64px_rgba(0,0,0,0.2)]">

          {/* ── HEADER ── */}
          <div className="px-5 pt-5 pb-4 border-b border-stone-100 dark:border-stone-800/50">
            <div className="w-8 h-1 rounded-full bg-stone-200 dark:bg-stone-700 mx-auto mb-4 sm:hidden" />
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[#2FAF8F]"><IcoSpark /></span>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-stone-400 dark:text-stone-500">
                    Método de pago
                  </p>
                </div>
                <h2 className="at-serif italic text-[19px] text-stone-900 dark:text-stone-50 leading-snug">
                  Agregar tarjeta
                </h2>
              </div>
              <button
                onClick={cerrar}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800/60 transition-all mt-0.5"
              >
                <IcoX />
              </button>
            </div>
          </div>

          {/* ── CARD PREVIEW ── */}
          <div className="px-5 pt-5">
            <div
              className="relative rounded-2xl p-5 overflow-hidden"
              style={{
                background: digitos.length > 0
                  ? 'linear-gradient(135deg, #1c1917 0%, #292524 100%)'
                  : 'linear-gradient(135deg, #e7e5e4 0%, #d6d3d1 100%)',
                transition: 'background 400ms ease',
              }}
            >
              {/* subtle pattern */}
              <div className="absolute inset-0 opacity-[0.06]" style={{
                backgroundImage: 'radial-gradient(circle at 20% 80%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)',
                backgroundSize: '32px 32px',
              }} />

              <div className="relative">
                {/* card icon + type */}
                <div className="flex items-center justify-between mb-6">
                  <div className={`${digitos.length > 0 ? 'text-white/60' : 'text-stone-400'}`}>
                    <IcoCreditCard />
                  </div>
                  {tipo && <CardBadge tipo={tipo} />}
                </div>

                {/* number */}
                <p className={`at-card-num text-[17px] font-medium mb-4 tracking-[0.14em] ${
                  digitos.length > 0 ? 'text-white' : 'text-stone-400'
                }`}>
                  {numero || '•••• •••• •••• ••••'}
                </p>

                {/* titular + vence */}
                <div className="flex items-end justify-between">
                  <div>
                    <p className={`text-[9px] font-semibold uppercase tracking-[0.1em] mb-0.5 ${
                      digitos.length > 0 ? 'text-white/50' : 'text-stone-400'
                    }`}>Titular</p>
                    <p className={`text-[13px] font-medium uppercase tracking-wide ${
                      digitos.length > 0 ? 'text-white' : 'text-stone-400'
                    }`}>
                      {titular || 'NOMBRE APELLIDO'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-[9px] font-semibold uppercase tracking-[0.1em] mb-0.5 ${
                      digitos.length > 0 ? 'text-white/50' : 'text-stone-400'
                    }`}>Vence</p>
                    <p className={`text-[13px] font-medium ${
                      digitos.length > 0 ? 'text-white' : 'text-stone-400'
                    }`}>
                      {vencimiento || 'MM/AA'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── FORM ── */}
          <div className="px-5 pt-5 pb-2 space-y-3">

            {/* número */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-stone-400 dark:text-stone-500 mb-1.5">
                Número de tarjeta
              </label>
              <input
                className="at-input at-card-num"
                placeholder="1234 5678 9012 3456"
                inputMode="numeric"
                maxLength={19}
                value={numero}
                onChange={e => handleNumero(e.target.value)}
              />
            </div>

            {/* titular */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-stone-400 dark:text-stone-500 mb-1.5">
                Nombre del titular
              </label>
              <input
                ref={refTitular}
                className="at-input"
                placeholder="Como aparece en la tarjeta"
                value={titular}
                onChange={e => setTitular(e.target.value.toUpperCase())}
              />
            </div>

            {/* vencimiento + cvv */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-stone-400 dark:text-stone-500 mb-1.5">
                  Vencimiento
                </label>
                <input
                  ref={refVence}
                  className="at-input"
                  placeholder="MM/AA"
                  inputMode="numeric"
                  maxLength={5}
                  value={vencimiento}
                  onChange={e => handleVence(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-stone-400 dark:text-stone-500 mb-1.5">
                  CVV
                </label>
                <div className="relative">
                  <input
                    ref={refCvv}
                    className="at-input pr-10"
                    placeholder={isAmex ? '4 dígitos' : '3 dígitos'}
                    inputMode="numeric"
                    maxLength={isAmex ? 4 : 3}
                    type={cvvVisible ? 'text' : 'password'}
                    value={cvv}
                    onChange={e => setCvv(e.target.value.replace(/\D/g, '').slice(0, isAmex ? 4 : 3))}
                  />
                  <button
                    onClick={() => setCvvVisible(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-300 hover:text-stone-500 dark:hover:text-stone-400 transition-colors"
                    tabIndex={-1}
                  >
                    {cvvVisible
                      ? <svg className="w-4 h-4" {...sv}><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      : <svg className="w-4 h-4" {...sv}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    }
                  </button>
                </div>
              </div>
            </div>

            {/* error */}
            {error && (
              <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200/70 dark:border-red-800/50">
                <span className="text-red-400 shrink-0"><IcoInfo /></span>
                <p className="text-[12px] text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}
          </div>

          {/* ── FOOTER ── */}
          <div className="px-5 pb-5 pt-3">
            <button
              onClick={handleGuardar}
              disabled={guardando}
              className="w-full h-11 rounded-xl text-[13.5px] font-medium text-white bg-[#2FAF8F] hover:bg-[#27a07f] disabled:opacity-60 disabled:cursor-not-allowed transition-all active:scale-[0.98] shadow-sm mb-3"
            >
              {guardando ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" {...sv}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                  Guardando…
                </span>
              ) : 'Guardar tarjeta'}
            </button>

            {/* security note */}
            <div className="flex items-center justify-center gap-1.5">
              <span className="text-stone-300 dark:text-stone-600"><IcoLock /></span>
              <p className="text-[10.5px] text-stone-300 dark:text-stone-600">
                Cifrado SSL · No almacenamos datos sensibles de la tarjeta
              </p>
            </div>
          </div>

        </div>
      </div>
    </>
  )
}