import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

// Genera código numérico de 6 dígitos localmente (simulación hasta integrar Twilio)
const generateSimulatedCode = (): string =>
  Array.from({ length: 6 }, () => Math.floor(Math.random() * 10)).join('')

type PersonalSubStep = 'name' | 'birthdate' | 'gender' | 'curp' | 'phone' | 'code' | 'address' | 'state' | 'municipality' | 'postalCode' | 'rfc' | 'role'
type Role = 'producer' | 'mvz' | 'union' | 'exporter' | 'auditor'

interface Message {
  type: 'assistant' | 'user'
  text?: string
  customContent?: React.ReactNode
}

// ─── CONFIRM MODAL ────────────────────────────────────────────────────────────
interface ConfirmModalProps {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

const ConfirmModal = ({
  open, title, description,
  confirmLabel = 'Confirmar', cancelLabel = 'Cancelar',
  onConfirm, onCancel
}: ConfirmModalProps) => {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!open) return
      if (e.key === 'Escape') onCancel()
      if (e.key === 'Enter') onConfirm()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onConfirm, onCancel])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-md" onClick={onCancel} />
      <div className="relative w-full max-w-sm animate-[modalIn_0.25s_cubic-bezier(.16,1,.3,1)]">
        <div className="h-[2px] bg-gradient-to-r from-transparent via-[#2FAF8F]/60 to-transparent rounded-t-3xl" />
        <div className="bg-[#0f0f0e] border border-white/8 rounded-b-3xl rounded-t-none px-6 pt-6 pb-5">
          <div className="mb-5">
            <h3 className="text-[15px] font-semibold text-stone-50 tracking-tight">{title}</h3>
            <p className="text-[13px] text-stone-500 mt-1.5 leading-relaxed">{description}</p>
          </div>
          <div className="flex gap-2.5">
            <button onClick={onCancel} className="flex-1 h-10 rounded-xl bg-white/5 hover:bg-white/10 text-[13px] font-medium text-stone-400 hover:text-stone-200 transition-all">{cancelLabel}</button>
            <button onClick={onConfirm} className="flex-1 h-10 rounded-xl bg-[#2FAF8F] hover:bg-[#27a07f] text-[13px] font-semibold text-white shadow-sm active:scale-[0.98] transition-all">{confirmLabel}</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── OPTIONS GRID ─────────────────────────────────────────────────────────────
const OptionsGrid = ({ options, onSelect }: { options: string[]; onSelect: (value: string) => void }) => {
  const [selected, setSelected] = useState<string | null>(null)
  const [disabled, setDisabled] = useState(false)

  const handleSelect = (opt: string) => {
    if (disabled) return
    setSelected(opt)
    setDisabled(true)
    setTimeout(() => onSelect(opt), 300)
  }

  return (
    <div className="grid grid-cols-2 gap-2 my-3 w-full">
      {options.map(opt => (
        <button
          key={opt}
          onClick={() => handleSelect(opt)}
          disabled={disabled}
          className={`p-3 bg-white dark:bg-[#121212] border ${
            selected === opt ? 'border-[#2FAF8F] bg-[#2FAF8F]/5 dark:bg-[#2FAF8F]/10' : 'border-stone-300 dark:border-stone-700'
          } rounded-lg transition-all text-left text-stone-900 dark:text-stone-50 font-medium text-sm ${
            disabled && selected !== opt ? 'opacity-50' : 'hover:border-stone-400 dark:hover:border-stone-600 hover:bg-stone-50 dark:hover:bg-stone-800/50'
          } ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}

// ─── STATE SELECTOR ───────────────────────────────────────────────────────────
// Movido fuera del padre → React preserva su estado interno entre renders.
// Antes estaba adentro y cada re-render del padre lo desmontaba/remontaba,
// reseteando el campo de búsqueda a vacío con cada pulsación de tecla.
const StateSelector = ({ states, onSelect }: { states: string[]; onSelect: (value: string) => void }) => {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<string | null>(null)
  const [disabled, setDisabled] = useState(false)
  const filtered = states.filter(s => s.toLowerCase().includes(query.toLowerCase()))

  const handleSelect = (state: string) => {
    if (disabled) return
    setSelected(state)
    setDisabled(true)
    setTimeout(() => onSelect(state), 300)
  }

  return (
    <div className="my-3 w-full">
      <div className="relative mb-2">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Buscar estado..."
          disabled={disabled}
          autoComplete="off"
          className="w-full px-3 py-2.5 pl-10 bg-white dark:bg-[#1A1A1A] border border-stone-300 dark:border-stone-700 rounded-lg text-sm text-stone-900 dark:text-stone-50 placeholder-stone-500 dark:placeholder-stone-600 outline-none focus:border-[#2FAF8F] focus:ring-2 focus:ring-[#2FAF8F]/20 transition-all disabled:cursor-not-allowed"
        />
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <div
        className="max-h-60 overflow-y-auto rounded-lg border border-stone-200 dark:border-stone-800 divide-y divide-stone-100 dark:divide-stone-800 shadow-sm"
        style={{ scrollbarWidth: 'thin', scrollbarColor: '#2FAF8F rgba(0,0,0,0.1)' }}
      >
        {filtered.length > 0 ? (
          filtered.map(state => (
            <button
              key={state}
              onClick={() => handleSelect(state)}
              disabled={disabled}
              className={`w-full text-left px-4 py-3 text-sm transition-all ${
                selected === state ? 'bg-[#2FAF8F]/10 text-[#2FAF8F] font-semibold' : 'bg-white dark:bg-[#121212] text-stone-800 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800/50'
              } ${disabled && selected !== state ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {state}
            </button>
          ))
        ) : (
          <div className="px-4 py-6 text-center text-sm text-stone-500 dark:text-stone-600">
            No se encontraron resultados
          </div>
        )}
      </div>
      <style>{`
        div::-webkit-scrollbar { width: 6px; }
        div::-webkit-scrollbar-track { background: rgba(0,0,0,0.05); border-radius: 10px; }
        div::-webkit-scrollbar-thumb { background: #2FAF8F; border-radius: 10px; }
        div::-webkit-scrollbar-thumb:hover { background: #26a079; }
      `}</style>
    </div>
  )
}

// ─── MUNICIPALITY SELECTOR ────────────────────────────────────────────────────
const MunicipalitySelector = ({ municipalities, onSelect }: { municipalities: string[]; onSelect: (value: string) => void }) => {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<string | null>(null)
  const [disabled, setDisabled] = useState(false)
  const filtered = municipalities.filter(m => m.toLowerCase().includes(query.toLowerCase()))

  const handleSelect = (municipality: string) => {
    if (disabled) return
    setSelected(municipality)
    setDisabled(true)
    setTimeout(() => onSelect(municipality), 300)
  }

  return (
    <div className="my-3 w-full">
      <div className="relative mb-2">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Buscar municipio..."
          disabled={disabled}
          autoComplete="off"
          className="w-full px-3 py-2.5 pl-10 bg-white dark:bg-[#1A1A1A] border border-stone-300 dark:border-stone-700 rounded-lg text-sm text-stone-900 dark:text-stone-50 placeholder-stone-500 dark:placeholder-stone-600 outline-none focus:border-[#2FAF8F] focus:ring-2 focus:ring-[#2FAF8F]/20 transition-all disabled:cursor-not-allowed"
        />
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <div className="max-h-60 overflow-y-auto rounded-lg border border-stone-200 dark:border-stone-800 divide-y divide-stone-100 dark:divide-stone-800 shadow-sm">
        {filtered.length > 0 ? (
          filtered.map(municipality => (
            <button
              key={municipality}
              onClick={() => handleSelect(municipality)}
              disabled={disabled}
              className={`w-full text-left px-4 py-3 text-sm transition-all ${
                selected === municipality ? 'bg-[#2FAF8F]/10 text-[#2FAF8F] font-semibold' : 'bg-white dark:bg-[#121212] text-stone-800 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800/50'
              } ${disabled && selected !== municipality ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {municipality}
            </button>
          ))
        ) : (
          <div className="px-4 py-6 text-center">
            <p className="text-sm text-stone-600 dark:text-stone-400 mb-2">No se encontró el municipio</p>
            <button
              onClick={() => {
                if (!query.trim()) return
                setSelected(query)
                setDisabled(true)
                setTimeout(() => onSelect(query), 300)
              }}
              className="text-xs text-[#2FAF8F] hover:text-[#26a079] font-medium"
            >
              Usar "{query}"
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── CODE INPUT WITH RESEND ───────────────────────────────────────────────────
// El contador se maneja internamente para evitar que quede congelado
// al capturarse como customContent en el array de mensajes.
const CodeInputWithResend = ({
  onComplete,
  onResend,
  initialCountdown = 60,
}: {
  onComplete: (code: string) => void
  onResend: () => void
  initialCountdown?: number
}) => {
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [countdown, setCountdown] = useState(initialCountdown)
  const inputsRef = useRef<(HTMLInputElement | null)[]>([])

  // Countdown interno — no depende del estado del padre
  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const newCode = [...code]
    newCode[index] = value
    setCode(newCode)
    if (value && index < 5) inputsRef.current[index + 1]?.focus()
    if (newCode.every(d => d !== '')) onComplete(newCode.join(''))
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) inputsRef.current[index - 1]?.focus()
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const newCode = [...code]
    pastedData.split('').forEach((digit, i) => { newCode[i] = digit })
    setCode(newCode)
    if (pastedData.length === 6) onComplete(pastedData)
  }

  const handleResend = () => {
    setCountdown(60)
    setCode(['', '', '', '', '', ''])
    onResend()
  }

  useEffect(() => { inputsRef.current[0]?.focus() }, [])

  return (
    <div className="w-full">
      <div className="flex gap-2 justify-center my-4" onPaste={handlePaste}>
        {code.map((digit, index) => (
          <input
            key={index}
            ref={el => { if (el) inputsRef.current[index] = el }}
            type="tel"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={e => handleChange(index, e.target.value)}
            onKeyDown={e => handleKeyDown(index, e)}
            className="w-11 h-13 bg-white dark:bg-[#1A1A1A] border border-stone-300 dark:border-stone-700 rounded-lg text-center text-2xl font-bold text-stone-900 dark:text-stone-50 focus:outline-none focus:border-[#2FAF8F] focus:ring-2 focus:ring-[#2FAF8F]/30 transition-all"
          />
        ))}
      </div>
      <div className="flex justify-center items-center gap-2 mt-3">
        {countdown > 0 ? (
          <span className="text-xs text-stone-500 dark:text-stone-600">
            Reenviar código en {countdown}s
          </span>
        ) : (
          <button
            onClick={handleResend}
            className="text-xs text-[#2FAF8F] hover:text-[#26a079] font-medium transition-colors"
          >
            Reenviar código
          </button>
        )}
      </div>
    </div>
  )
}

// ─── ROLE GRID ────────────────────────────────────────────────────────────────
const roles = [
  {
    value: 'producer' as Role,
    title: 'Productor Ganadero',
    description: 'Dueño o administrador de rancho/UPP',
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />,
  },
  {
    value: 'mvz' as Role,
    title: 'Médico Veterinario Zootecnista',
    description: 'Profesional certificado para dictámenes',
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
  },
  {
    value: 'union' as Role,
    title: 'Unión Ganadera',
    description: 'Coordinador regional o estatal',
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />,
  },
  {
    value: 'exporter' as Role,
    title: 'Exportador',
    description: 'Empresa de exportación binacional',
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
  },
  {
    value: 'auditor' as Role,
    title: 'Auditor / Inspector',
    description: 'SENASICA o entidad certificadora',
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />,
  },
]

const RoleGrid = ({ onSelectRole }: { onSelectRole: (value: Role, title: string) => void }) => {
  const [selected, setSelected] = useState<Role | null>(null)

  const handleSelect = (role: typeof roles[0]) => {
    setSelected(role.value)
    setTimeout(() => onSelectRole(role.value, role.title), 300)
  }

  return (
    <div className="grid grid-cols-1 gap-3 my-4 w-full">
      {roles.map(role => (
        <button
          key={role.value}
          onClick={() => handleSelect(role)}
          disabled={selected !== null}
          className={`flex items-start gap-4 p-4 bg-white dark:bg-[#121212] border ${
            selected === role.value ? 'border-[#2FAF8F] bg-[#2FAF8F]/5 dark:bg-[#2FAF8F]/10 shadow-md' : 'border-stone-300 dark:border-stone-700'
          } rounded-xl ${selected === null ? 'hover:border-stone-400 dark:hover:border-stone-600 hover:bg-stone-50 dark:hover:bg-stone-800/50 hover:shadow-lg cursor-pointer' : selected !== role.value ? 'opacity-50 cursor-not-allowed' : 'cursor-default'} transition-all text-left group`}
        >
          <div className="shrink-0 w-10 h-10 bg-[#2FAF8F]/20 rounded-lg flex items-center justify-center group-hover:bg-[#2FAF8F]/30 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6 text-[#2FAF8F]">
              {role.icon}
            </svg>
          </div>
          <div className="flex-1">
            <div className="font-semibold text-stone-900 dark:text-stone-50 text-base mb-1">{role.title}</div>
            <div className="text-sm text-stone-600 dark:text-stone-400">{role.description}</div>
          </div>
        </button>
      ))}
    </div>
  )
}

// ─── DATA ─────────────────────────────────────────────────────────────────────
const ESTADOS_MEXICO = [
  'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche', 'Chiapas',
  'Chihuahua', 'Ciudad de México', 'Coahuila', 'Colima', 'Durango', 'Estado de México',
  'Guanajuato', 'Guerrero', 'Hidalgo', 'Jalisco', 'Michoacán', 'Morelos', 'Nayarit',
  'Nuevo León', 'Oaxaca', 'Puebla', 'Querétaro', 'Quintana Roo', 'San Luis Potosí',
  'Sinaloa', 'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz', 'Yucatán', 'Zacatecas'
]

const MUNICIPIOS_POR_ESTADO: Record<string, string[]> = {
  'Durango': [
    'Canatlán', 'Canelas', 'Coneto de Comonfort', 'Cuencamé', 'Durango',
    'El Oro', 'Gómez Palacio', 'Guadalupe Victoria', 'Guanaceví', 'Lerdo',
    'Mapimí', 'Mezquital', 'Nombre de Dios', 'Nuevo Ideal', 'Ocampo',
    'Otáez', 'Pánuco de Coronado', 'Peñón Blanco', 'Poanas', 'Pueblo Nuevo',
    'Rodeo', 'San Bernardo', 'San Dimas', 'San Juan de Guadalupe', 'San Juan del Río',
    'San Luis del Cordero', 'San Pedro del Gallo', 'Santa Clara', 'Santiago Papasquiaro',
    'Súchil', 'Tamazula', 'Tepehuanes', 'Tlahualilo', 'Topia', 'Vicente Guerrero'
  ]
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
const SignUpPersonal = () => {
  const navigate = useNavigate()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const [messages, setMessages] = useState<Message[]>([])
  const [userInput, setUserInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [inputEnabled, setInputEnabled] = useState(false)
  const [personalSubStep, setPersonalSubStep] = useState<PersonalSubStep>('name')
  const [userData, setUserData] = useState({
    fullName: '',
    birthdate: '',
    gender: '',
    curp: '',
    phone: '',
    verificationCode: '',
    address: '',
    state: '',
    municipality: '',
    postalCode: '',
    rfc: '',
    role: '' as Role | '',
    country: 'México'
  })
  const initialized = useRef(false)
  const simulatedCodeRef = useRef<string>('')

  const [modal, setModal] = useState<{
    open: boolean
    title: string
    description: string
    confirmLabel: string
    onConfirm: () => void
  }>({ open: false, title: '', description: '', confirmLabel: 'Confirmar', onConfirm: () => {} })

  const showConfirm = (title: string, description: string, confirmLabel: string, onConfirm: () => void) =>
    setModal({ open: true, title, description, confirmLabel, onConfirm })

  const closeModal = () => setModal(m => ({ ...m, open: false }))

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (inputEnabled && inputRef.current) inputRef.current.focus()
  }, [inputEnabled])

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    const authMethod = localStorage.getItem('signup-auth-method')
    if (!authMethod) {
      navigate('/signup')
      return
    }

    setTimeout(() => {
      setMessages([{ type: 'assistant', text: 'Bienvenido a GANDIA. Para comenzar el registro, necesito conocerte mejor.' }])
      setTimeout(() => {
        setMessages(prev => [...prev, { type: 'assistant', text: '¿Cuál es tu nombre completo?' }])
        setInputEnabled(true)
      }, 800)
    }, 500)
  }, [navigate])

  const addMessage = (message: Message) => setMessages(prev => [...prev, message])
  const showTyping = () => setIsTyping(true)
  const hideTyping = () => setIsTyping(false)

  const handleBack = () => {
    showConfirm(
      '¿Regresar a opciones de autenticación?',
      'Se perderá el progreso de tu registro actual.',
      'Sí, regresar',
      () => {
        closeModal()
        localStorage.removeItem('signup-personal-data')
        navigate('/signup')
      }
    )
  }

  const handleSend = () => {
    const value = userInput.trim()
    if (!value) return
    addMessage({ type: 'user', text: value })
    setUserInput('')
    setInputEnabled(false)
    processInput(value)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (userInput.trim()) handleSend()
    }
  }

  const processInput = async (value: string) => {
    showTyping()

    try {
      await new Promise(resolve => setTimeout(resolve, 600))
      hideTyping()

      switch (personalSubStep) {
        case 'name': {
          const nameParts = value.trim().split(/\s+/)
          if (nameParts.length < 2) {
            addMessage({ type: 'assistant', text: 'Por favor ingresa tu nombre completo (nombre y al menos un apellido).' })
            setInputEnabled(true); return
          }
          if (nameParts.some(p => p.length < 2)) {
            addMessage({ type: 'assistant', text: 'Cada parte del nombre debe tener al menos 2 caracteres.' })
            setInputEnabled(true); return
          }
          if (!/^[a-záéíóúñüA-ZÁÉÍÓÚÑÜ\s]+$/.test(value)) {
            addMessage({ type: 'assistant', text: 'El nombre solo puede contener letras y espacios.' })
            setInputEnabled(true); return
          }
          if (value.trim().length > 80) {
            addMessage({ type: 'assistant', text: 'El nombre parece demasiado largo. Verifica e intenta de nuevo.' })
            setInputEnabled(true); return
          }
          setUserData(prev => ({ ...prev, fullName: value }))
          addMessage({ type: 'assistant', text: `Un gusto, ${nameParts[0]}.` })
          setTimeout(() => {
            showTyping()
            setTimeout(() => {
              hideTyping()
              addMessage({ type: 'assistant', text: '¿Cuál es tu fecha de nacimiento? (DD/MM/AAAA)' })
              setPersonalSubStep('birthdate')
              setInputEnabled(true)
            }, 700)
          }, 400)
          break
        }

        case 'birthdate': {
          const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/
          const match = value.match(dateRegex)
          if (!match) {
            addMessage({ type: 'assistant', text: 'Formato inválido. Usa DD/MM/AAAA, por ejemplo: 15/03/1985' })
            setInputEnabled(true); return
          }
          const [, day, month, year] = match
          const d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
          if (d.getDate() !== parseInt(day) || d.getMonth() !== parseInt(month) - 1) {
            addMessage({ type: 'assistant', text: 'La fecha no es válida. Verifica el día y mes.' })
            setInputEnabled(true); return
          }
          const now = new Date()
          const age = now.getFullYear() - d.getFullYear() -
            (now.getMonth() < d.getMonth() || (now.getMonth() === d.getMonth() && now.getDate() < d.getDate()) ? 1 : 0)
          if (d > now) {
            addMessage({ type: 'assistant', text: 'La fecha no puede ser futura.' })
            setInputEnabled(true); return
          }
          if (age > 110) {
            addMessage({ type: 'assistant', text: 'La fecha parece incorrecta. Verifica el año.' })
            setInputEnabled(true); return
          }
          if (age < 18) {
            addMessage({ type: 'assistant', text: 'Debes ser mayor de 18 años para registrarte.' })
            setInputEnabled(true); return
          }
          setUserData(prev => ({ ...prev, birthdate: value }))
          addMessage({ type: 'assistant', text: 'Perfecto.' })
          setTimeout(() => {
            showTyping()
            setTimeout(() => {
              hideTyping()
              addMessage({ type: 'assistant', text: '¿Cuál es tu género? (opcional)' })
              addMessage({
                type: 'assistant',
                customContent: (
                  <OptionsGrid
                    options={['Masculino', 'Femenino', 'No binario', 'Prefiero no decirlo']}
                    onSelect={(val) => handleOptionSelect(val, 'gender')}
                  />
                )
              })
              setPersonalSubStep('gender')
            }, 700)
          }, 400)
          break
        }

        case 'curp':
          if (value.toUpperCase() !== 'OMITIR') {
            const curpRegex = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z\d]\d$/i
            if (!curpRegex.test(value)) {
              addMessage({ type: 'assistant', text: 'La CURP debe tener 18 caracteres con el formato correcto. Escribe "omitir" si no la tienes.' })
              setInputEnabled(true); return
            }
          }
          setUserData(prev => ({ ...prev, curp: value.toUpperCase() === 'OMITIR' ? '' : value.toUpperCase() }))
          goToPhone()
          break

        case 'phone': {
          const cleanPhone = value.replace(/[\s\-()]/g, '')
          if (!/^\+?\d{10,15}$/.test(cleanPhone)) {
            addMessage({ type: 'assistant', text: 'Formato inválido. Ingresa solo dígitos, ej: +52 614 123 4567 o 6141234567' })
            setInputEnabled(true); return
          }
          const digits = cleanPhone.replace(/^\+52/, '').replace(/^\+/, '')
          if (digits.length < 10) {
            addMessage({ type: 'assistant', text: 'El número debe tener al menos 10 dígitos. Incluye el código de área.' })
            setInputEnabled(true); return
          }
          setUserData(prev => ({ ...prev, phone: value }))
          sendVerification(value)
          break
        }

        case 'code':
          verifyPhoneCodeHandler(value)
          break

        case 'address':
          if (value.trim().length < 10) {
            addMessage({ type: 'assistant', text: 'Por favor proporciona una dirección más completa (ej: Calle Hidalgo #123, Col. Centro).' })
            setInputEnabled(true); return
          }
          if (value.trim().length > 200) {
            addMessage({ type: 'assistant', text: 'La dirección es demasiado larga. Resúmela e intenta de nuevo.' })
            setInputEnabled(true); return
          }
          setUserData(prev => ({ ...prev, address: value }))
          addMessage({ type: 'assistant', text: 'Anotado.' })
          setTimeout(() => {
            showTyping()
            setTimeout(() => {
              hideTyping()
              addMessage({ type: 'assistant', text: '¿En qué estado de México te encuentras?' })
              addMessage({
                type: 'assistant',
                customContent: (
                  <StateSelector
                    states={ESTADOS_MEXICO}
                    onSelect={(val) => handleOptionSelect(val, 'state')}
                  />
                )
              })
              setPersonalSubStep('state')
            }, 700)
          }, 400)
          break

        case 'municipality':
          if (value.trim().length < 3) {
            addMessage({ type: 'assistant', text: 'El nombre del municipio parece muy corto. Verifica e intenta de nuevo.' })
            setInputEnabled(true); return
          }
          if (value.trim().length > 80) {
            addMessage({ type: 'assistant', text: 'El nombre del municipio parece demasiado largo. Verifica e intenta de nuevo.' })
            setInputEnabled(true); return
          }
          if (!/^[a-záéíóúñüA-ZÁÉÍÓÚÑÜ\s\-.]+$/.test(value.trim())) {
            addMessage({ type: 'assistant', text: 'El municipio solo puede contener letras, espacios y guiones.' })
            setInputEnabled(true); return
          }
          setUserData(prev => ({ ...prev, municipality: value }))
          addMessage({ type: 'assistant', text: 'Perfecto.' })
          setTimeout(() => {
            showTyping()
            setTimeout(() => {
              hideTyping()
              addMessage({ type: 'assistant', text: '¿Cuál es tu código postal?' })
              setPersonalSubStep('postalCode')
              setInputEnabled(true)
            }, 700)
          }, 400)
          break

        case 'postalCode':
          if (!/^\d{5}$/.test(value)) {
            addMessage({ type: 'assistant', text: 'El código postal debe tener exactamente 5 dígitos numéricos.' })
            setInputEnabled(true); return
          }
          setUserData(prev => ({ ...prev, postalCode: value }))
          goToRFC()
          break

        case 'rfc':
          if (value.toUpperCase() !== 'OMITIR') {
            const rfcRegex = /^[A-ZÑ&]{3,4}\d{6}[A-Z\d]{3}$/i
            if (!rfcRegex.test(value)) {
              addMessage({ type: 'assistant', text: 'RFC inválido. Debe tener 12-13 caracteres. Escribe "omitir" para continuar sin RFC.' })
              setInputEnabled(true); return
            }
          }
          setUserData(prev => ({ ...prev, rfc: value.toUpperCase() === 'OMITIR' ? '' : value.toUpperCase() }))
          goToRoleSelection()
          break
      }
    } catch (error: unknown) {
      hideTyping()
      const msg = error instanceof Error ? error.message : 'Ocurrió un problema. Intenta de nuevo.'
      addMessage({ type: 'assistant', text: `Error: ${msg}` })
      setInputEnabled(true)
    }
  }

  const handleOptionSelect = (value: string, step: PersonalSubStep) => {
    addMessage({ type: 'user', text: value })
    setInputEnabled(false)

    if (step === 'gender') {
      setUserData(prev => ({ ...prev, gender: value }))
      showTyping()
      setTimeout(() => {
        hideTyping()
        addMessage({ type: 'assistant', text: 'Gracias. Ahora necesito tu CURP para validar tu identidad (escribe "omitir" si no la tienes a la mano).' })
        setPersonalSubStep('curp')
        setInputEnabled(true)
      }, 700)
      return
    }

    if (step === 'state') {
      setUserData(prev => ({ ...prev, state: value }))
      showTyping()
      setTimeout(() => {
        hideTyping()
        const municipios = MUNICIPIOS_POR_ESTADO[value]
        if (municipios) {
          addMessage({ type: 'assistant', text: 'Selecciona tu municipio:' })
          addMessage({
            type: 'assistant',
            customContent: (
              <MunicipalitySelector
                municipalities={municipios}
                onSelect={(val) => handleMunicipalitySelect(val)}
              />
            )
          })
        } else {
          addMessage({ type: 'assistant', text: '¿Cuál es tu municipio o ciudad?' })
          setPersonalSubStep('municipality')
          setInputEnabled(true)
        }
      }, 700)
      return
    }
  }

  const handleMunicipalitySelect = (value: string) => {
    addMessage({ type: 'user', text: value })
    setUserData(prev => ({ ...prev, municipality: value }))
    showTyping()
    setTimeout(() => {
      hideTyping()
      addMessage({ type: 'assistant', text: 'Perfecto.' })
      setTimeout(() => {
        showTyping()
        setTimeout(() => {
          hideTyping()
          addMessage({ type: 'assistant', text: '¿Cuál es tu código postal?' })
          setPersonalSubStep('postalCode')
          setInputEnabled(true)
        }, 700)
      }, 400)
    }, 600)
  }

  const goToPhone = () => {
    showTyping()
    setTimeout(() => {
      hideTyping()
      addMessage({ type: 'assistant', text: 'Para asegurar tu cuenta, necesito verificar tu número de teléfono móvil.' })
      setTimeout(() => {
        addMessage({ type: 'assistant', text: 'Ingresa tu número con código de país (ej: +52 614 123 4567):' })
        setPersonalSubStep('phone')
        setInputEnabled(true)
      }, 600)
    }, 700)
  }

  const sendVerification = (phone: string) => {
    showTyping()
    const code = generateSimulatedCode()
    simulatedCodeRef.current = code
    console.info(
      `%c[GANDIA SMS SIMULADO] Código para ${phone}: ${code}`,
      'background:#2FAF8F;color:white;padding:4px 8px;border-radius:4px;font-weight:bold'
    )
    setTimeout(() => {
      hideTyping()
      addMessage({ type: 'assistant', text: `Te he enviado un código de 6 dígitos vía SMS a ${phone}.` })
      setTimeout(() => {
        addMessage({
          type: 'assistant',
          customContent: (
            <CodeInputWithResend
              onComplete={verifyPhoneCodeHandler}
              onResend={() => sendVerification(phone)}
              initialCountdown={60}
            />
          )
        })
        setPersonalSubStep('code')
      }, 400)
    }, 800)
  }

  const verifyPhoneCodeHandler = (code: string) => {
    setInputEnabled(false)
    showTyping()
    setTimeout(() => {
      hideTyping()
      if (code !== simulatedCodeRef.current) {
        addMessage({ type: 'assistant', text: 'Código incorrecto. Verifica e intenta de nuevo.' })
        setInputEnabled(true)
        return
      }
      simulatedCodeRef.current = ''
      setUserData(prev => ({ ...prev, verificationCode: code }))
      addMessage({ type: 'assistant', text: '¡Número verificado correctamente! ✓' })
      setTimeout(() => {
        showTyping()
        setTimeout(() => {
          hideTyping()
          addMessage({ type: 'assistant', text: 'Ahora necesito tu domicilio completo.' })
          setTimeout(() => {
            addMessage({ type: 'assistant', text: '¿Cuál es tu calle, número y colonia?' })
            setPersonalSubStep('address')
            setInputEnabled(true)
          }, 600)
        }, 700)
      }, 400)
    }, 600)
  }

  const goToRFC = () => {
    showTyping()
    setTimeout(() => {
      hideTyping()
      addMessage({ type: 'assistant', text: 'Último dato fiscal: ¿cuál es tu RFC? (escribe "omitir" si no aplica)' })
      setPersonalSubStep('rfc')
      setInputEnabled(true)
    }, 700)
  }

  const goToRoleSelection = () => {
    showTyping()
    setTimeout(() => {
      hideTyping()
      addMessage({ type: 'assistant', text: 'Excelente. Ya casi terminamos con tu perfil personal.' })
      setTimeout(() => {
        showTyping()
        setTimeout(() => {
          hideTyping()
          addMessage({ type: 'assistant', text: '¿Cuál es tu rol principal en el ecosistema ganadero?' })
          addMessage({
            type: 'assistant',
            customContent: <RoleGrid onSelectRole={selectRole} />
          })
          setPersonalSubStep('role')
        }, 700)
      }, 400)
    }, 500)
  }

  const selectRole = (value: Role, title: string) => {
    const updatedUserData = { ...userData, role: value }
    setUserData(updatedUserData)
    addMessage({ type: 'user', text: title })
    showTyping()
    setTimeout(() => {
      hideTyping()
      addMessage({ type: 'assistant', text: '¡Perfecto! He guardado tu información personal. Continuaremos con los datos específicos de tu actividad.' })
      localStorage.setItem('signup-personal-data', JSON.stringify(updatedUserData))
      setTimeout(() => navigate('/signup/institutional'), 2000)
    }, 800)
  }

  const placeholders: Partial<Record<PersonalSubStep, string>> = {
    name:       'Juan Pérez García',
    birthdate:  '15/03/1985',
    curp:       'PEGJ850315HDFRNN09 o "omitir"',
    phone:      '+52 614 123 4567',
    address:    'Calle Revolución #123, Col. Centro',
    postalCode: '34000',
    rfc:        'PEGJ850315ABC o "omitir"',
  }
  const inputPlaceholder = placeholders[personalSubStep] ?? 'Escribe tu respuesta...'

  const showTextInput = inputEnabled &&
    personalSubStep !== 'gender' &&
    personalSubStep !== 'state' &&
    personalSubStep !== 'code' &&
    personalSubStep !== 'role'

  // Progreso real basado en subStep
  const STEPS: PersonalSubStep[] = ['name', 'birthdate', 'gender', 'curp', 'phone', 'code', 'address', 'state', 'municipality', 'postalCode', 'rfc', 'role']
  const stepIndex = STEPS.indexOf(personalSubStep)
  const progressPct = Math.round(((stepIndex + 1) / STEPS.length) * 100)

  const stepLabels: Partial<Record<PersonalSubStep, string>> = {
    name: 'Nombre', birthdate: 'Nacimiento', gender: 'Género', curp: 'CURP',
    phone: 'Teléfono', code: 'Verificación', address: 'Domicilio',
    state: 'Estado', municipality: 'Municipio', postalCode: 'C.P.', rfc: 'RFC', role: 'Rol'
  }

  return (
    <div className="min-h-screen bg-[#fafaf9] dark:bg-[#0c0a09] text-stone-900 dark:text-stone-50 flex flex-col overflow-hidden font-sans">

      <ConfirmModal
        open={modal.open}
        title={modal.title}
        description={modal.description}
        confirmLabel={modal.confirmLabel}
        cancelLabel="Cancelar"
        onConfirm={modal.onConfirm}
        onCancel={closeModal}
      />

      {/* ── HEADER ── */}
      <div className="fixed top-0 left-0 right-0 z-50">
        {/* Barra de progreso top */}
        <div className="h-[2px] bg-stone-100 dark:bg-stone-900">
          <div
            className="h-full bg-[#2FAF8F] transition-all duration-700 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="bg-[#fafaf9]/96 dark:bg-[#0c0a09]/96 backdrop-blur-md border-b border-stone-200/40 dark:border-stone-800/40">
          <div className="flex items-center justify-between px-5 h-[54px]">
            {/* Back */}
            <button onClick={handleBack} className="flex items-center gap-1.5 text-stone-400 dark:text-stone-600 hover:text-stone-700 dark:hover:text-stone-300 transition-colors group">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              <span className="text-[12px] font-medium">Volver</span>
            </button>

            {/* Centro: logo + GANDIA */}
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
              <svg className="w-5 h-5 text-[#2FAF8F]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
              </svg>
              <span className="text-[13px] font-semibold text-stone-900 dark:text-stone-50 tracking-tight">GANDIA</span>
              <div className="w-px h-3 bg-stone-200 dark:bg-stone-800" />
              <span className="text-[11.5px] text-stone-400 dark:text-stone-600 font-medium">Datos Personales</span>
            </div>

            {/* Derecha: step actual */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold tracking-[0.1em] uppercase text-stone-400 dark:text-stone-600">
                {String(stepIndex + 1).padStart(2, '0')} / {String(STEPS.length).padStart(2, '0')}
              </span>
              <div className="w-px h-3 bg-stone-200 dark:bg-stone-800" />
              <span className="text-[12px] font-medium text-stone-600 dark:text-stone-400">
                {stepLabels[personalSubStep] ?? ''}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── MENSAJES ── */}
      <div className="flex-1 overflow-y-auto pt-[52px] pb-44 px-4" style={{ scrollBehavior: 'smooth' }}>
        <div className="max-w-2xl mx-auto flex flex-col gap-6 py-8">

          {/* Empty state */}
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center min-h-[55vh] gap-6 animate-[fadeIn_0.4s_ease_both]">
              <div className="text-center">
                <h1 className="text-[2.1rem] font-serif italic text-stone-900 dark:text-stone-50 leading-[1.2] tracking-[-0.01em] mb-3">
                  Cuéntanos<br />sobre ti.
                </h1>
                <p className="text-sm text-stone-400 dark:text-stone-600">Paso 2 de 4 — Datos personales</p>
              </div>
            </div>
          )}

          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'} animate-[fadeIn_0.22s_ease_both]`}>
              {msg.type === 'user' ? (
                <div className="max-w-[75%] bg-white dark:bg-[#1c1917] border border-stone-200/70 dark:border-stone-800/60 rounded-2xl rounded-br-sm px-4 py-3 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
                  <p className="text-[14px] text-stone-800 dark:text-stone-100 leading-[1.7]">{msg.text}</p>
                </div>
              ) : (
                <div className="max-w-[85%]">
                  {msg.customContent ? (
                    msg.customContent
                  ) : (
                    <p className="text-[14.5px] text-stone-600 dark:text-stone-300 leading-[1.8]">{msg.text}</p>
                  )}
                </div>
              )}
            </div>
          ))}
          {isTyping && (
            <div className="flex gap-1.5 items-center pl-0.5 animate-[fadeIn_0.2s_ease_both]">
              <div className="w-1.5 h-1.5 rounded-full bg-stone-300 dark:bg-stone-700 animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1.5 h-1.5 rounded-full bg-stone-300 dark:bg-stone-700 animate-bounce" style={{ animationDelay: '120ms' }} />
              <div className="w-1.5 h-1.5 rounded-full bg-stone-300 dark:bg-stone-700 animate-bounce" style={{ animationDelay: '240ms' }} />
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* ── INPUT ── */}
      {showTextInput && (
        <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 pt-4 bg-gradient-to-t from-[#fafaf9] dark:from-[#0c0a09] from-80% to-transparent">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white dark:bg-[#141210] border border-stone-200/80 dark:border-stone-800/70 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_20px_rgba(0,0,0,0.25)]">
              <textarea
                ref={inputRef}
                value={userInput}
                onChange={e => {
                  setUserInput(e.target.value)
                  e.target.style.height = 'auto'
                  e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px'
                }}
                onKeyDown={handleKeyDown}
                placeholder={inputPlaceholder}
                rows={1}
                style={{ maxHeight: '160px', minHeight: '46px', outline: 'none', boxShadow: 'none' }}
                className="w-full px-4 pt-3.5 pb-2 bg-transparent text-[14px] text-stone-800 dark:text-stone-100 placeholder-stone-300 dark:placeholder-stone-600 resize-none leading-relaxed"
              />
              <div className="flex items-center justify-end px-3 pb-3 pt-0">
                <button
                  onClick={handleSend}
                  disabled={!userInput.trim()}
                  className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all active:scale-95 ${
                    userInput.trim()
                      ? 'bg-[#2FAF8F] hover:bg-[#27a07f] text-white shadow-sm'
                      : 'bg-stone-100 dark:bg-stone-800/60 text-stone-300 dark:text-stone-600 cursor-not-allowed'
                  }`}
                >
                  <svg className="w-[17px] h-[17px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>
                </button>
              </div>
            </div>
            <p className="text-center text-[10.5px] text-stone-300 dark:text-stone-700 mt-2">GANDIA · Registro seguro</p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes modalIn { from { opacity: 0; transform: scale(0.95) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
      `}</style>
    </div>
  )
}

export default SignUpPersonal