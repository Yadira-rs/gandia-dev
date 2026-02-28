import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

type Role = 'producer' | 'mvz' | 'union' | 'exporter' | 'auditor'

interface Message {
  type: 'assistant' | 'user'
  text?: string
  customContent?: React.ReactNode
}

interface Question {
  key: string
  question: string
  hint?: string
  type: 'text' | 'options'
  options?: string[]
  optional?: boolean
  validation?: (value: string) => { valid: boolean; error?: string }
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

// ─── SUBCOMPONENTS — fuera del padre para que React los reconcilie correctamente ──

const OptionsGrid = ({
  options,
  onSelect
}: {
  options: string[]
  onSelect: (value: string) => void
}) => {
  const [selected, setSelected] = useState<string | null>(null)
  const [disabled, setDisabled] = useState(false)

  const handleSelect = (option: string) => {
    if (disabled) return
    setSelected(option)
    setDisabled(true)
    setTimeout(() => onSelect(option), 300)
  }

  return (
    <div className="grid grid-cols-1 gap-2 my-3 w-full">
      {options.map(option => (
        <button
          key={option}
          onClick={() => handleSelect(option)}
          disabled={disabled}
          className={`p-3.5 bg-white dark:bg-[#121212] border ${
            selected === option
              ? 'border-[#2FAF8F] bg-[#2FAF8F]/5 dark:bg-[#2FAF8F]/10 shadow-sm'
              : 'border-stone-300 dark:border-stone-700'
          } rounded-lg transition-all text-left text-stone-900 dark:text-stone-50 font-medium text-sm ${
            disabled && selected !== option ? 'opacity-50' : 'hover:border-stone-400 dark:hover:border-stone-600 hover:bg-stone-50 dark:hover:bg-stone-800/50 hover:shadow-md'
          } ${disabled ? 'cursor-not-allowed' : 'cursor-pointer active:scale-[0.98]'}`}
        >
          {option}
        </button>
      ))}
    </div>
  )
}

// ─── VALIDATORS ───────────────────────────────────────────────────────────────
const validators = {
  uppNumber: (value: string) => {
    if (value.toLowerCase() === 'pendiente') return { valid: true }
    if (!/^\d{2}-\d{3}-\d{6}-\d{1}$/.test(value))
      return { valid: false, error: 'Formato inválido. Debe ser XX-XXX-XXXXXX-X o "pendiente"' }
    return { valid: true }
  },
  cedulaProfesional: (value: string) => {
    if (!/^\d{7,8}$/.test(value))
      return { valid: false, error: 'La cédula profesional debe tener 7 u 8 dígitos' }
    return { valid: true }
  },
  year: (value: string) => {
    const year = parseInt(value)
    const currentYear = new Date().getFullYear()
    if (isNaN(year) || year < 1900 || year > currentYear)
      return { valid: false, error: `Año inválido. Debe estar entre 1900 y ${currentYear}` }
    return { valid: true }
  },
  rfc: (value: string) => {
    if (value.toLowerCase() === 'omitir') return { valid: true }
    if (!/^[A-ZÑ&]{3,4}\d{6}[A-Z\d]{3}$/i.test(value))
      return { valid: false, error: 'RFC inválido. Formato: XXX-XXXXXX-XXX o "omitir"' }
    return { valid: true }
  },
  email: (value: string) => {
    if (value.toLowerCase() === 'omitir' || value.toLowerCase() === 'ninguno') return { valid: true }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
      return { valid: false, error: 'Email inválido' }
    return { valid: true }
  },
  notEmpty: (value: string) => {
    if (value.trim().length < 3)
      return { valid: false, error: 'Respuesta muy corta. Mínimo 3 caracteres' }
    return { valid: true }
  },
  address: (value: string) => {
    if (value.length < 10)
      return { valid: false, error: 'Dirección muy corta. Proporciona más detalles (mínimo 10 caracteres)' }
    return { valid: true }
  }
}

// ─── QUESTION FLOWS ───────────────────────────────────────────────────────────
const questionFlows: Record<Role, Question[]> = {
  producer: [
    { key: 'ranchName', question: '¿Cuál es el nombre de tu rancho o UPP?', hint: 'Ej: Rancho El Mezquite, La Esperanza, etc.', type: 'text', validation: validators.notEmpty },
    { key: 'uppNumber', question: '¿Cuál es tu número de UPP registrado ante SAGARPA/SADER?', hint: 'Formato: XX-XXX-XXXXXX-X (escribe "pendiente" si aún no lo tienes)', type: 'text', validation: validators.uppNumber },
    { key: 'siniigaNumber', question: '¿Cuál es tu número de registro SINIIGA?', hint: 'Sistema Nacional de Identificación Individual de Ganado (escribe "pendiente" si no aplica)', type: 'text', optional: true },
    { key: 'operationType', question: '¿Qué tipo de operación realizas?', type: 'options', options: ['Cría (cow-calf)', 'Engorda (feedlot)', 'Mixto', 'Lechero', 'Doble propósito', 'Otro'] },
    { key: 'cattleType', question: '¿Qué tipo de ganado mantienes?', type: 'options', options: ['Bovino', 'Ovino', 'Caprino', 'Porcino', 'Mixto', 'Otro'] },
    { key: 'herdSize', question: '¿Cuál es el tamaño aproximado de tu hato?', type: 'options', options: ['Menos de 20', '20–100', '100–500', '500–1,000', 'Más de 1,000'] },
    { key: 'yearsOfOperation', question: '¿Cuántos años tiene operando el rancho?', type: 'options', options: ['Menos de 1 año', '1–5 años', '5–15 años', 'Más de 15 años'] },
    { key: 'ranchAddress', question: '¿Cuál es la ubicación del rancho?', hint: 'Ej: Carretera Durango-Mazatlán km 45, municipio de Canelas', type: 'text', validation: validators.address },
    { key: 'location', question: '¿En qué estado se encuentra tu rancho?', type: 'text', hint: 'Estado de la república', validation: validators.notEmpty },
    { key: 'sanitaryCertifications', question: '¿Cuentas con certificación sanitaria activa?', hint: 'Ej: PROGAN, Programa de Sanidad, etc. (escribe "ninguna" si no tienes)', type: 'text', optional: true },
    { key: 'officialRegistry', question: '¿Tienes registro oficial con alguna Unión Ganadera?', type: 'options', options: ['Sí, estoy afiliado', 'No, soy independiente', 'En proceso de afiliación'] }
  ],
  mvz: [
    { key: 'license', question: '¿Cuál es tu número de cédula profesional?', hint: '7 u 8 dígitos emitidos por la SEP', type: 'text', validation: validators.cedulaProfesional },
    { key: 'university', question: '¿De qué universidad egresaste?', hint: 'Ej: UJED, UNAM, UAZ, IPN, etc.', type: 'text', validation: validators.notEmpty },
    { key: 'graduationYear', question: '¿En qué año obtuviste tu título?', hint: 'Ej: 2015', type: 'text', validation: validators.year },
    { key: 'specialty', question: '¿Cuál es tu especialidad principal?', type: 'options', options: ['Bovinos', 'Ovinos/Caprinos', 'Porcinos', 'Salud pública veterinaria', 'Producción animal', 'General'] },
    { key: 'practiceMode', question: '¿Cuál es tu modalidad de ejercicio profesional?', type: 'options', options: ['Práctica privada independiente', 'Empleado en institución pública', 'Empleado en empresa privada', 'Ambas (pública y privada)'] },
    { key: 'stateOfPractice', question: '¿En qué estado ejerces principalmente?', type: 'text', hint: 'Estado de la república', validation: validators.notEmpty },
    { key: 'sanitaryRegistry', question: '¿Tienes número de registro sanitario SENASICA?', hint: 'Para emisión de dictámenes (escribe "no tengo" si aún no lo has tramitado)', type: 'text', optional: true },
    { key: 'college', question: '¿Perteneces a algún Colegio de Médicos Veterinarios?', hint: 'Nombre del colegio o "ninguno"', type: 'text', optional: true }
  ],
  union: [
    { key: 'unionName', question: '¿Cuál es el nombre oficial de tu Unión Ganadera?', hint: 'Nombre completo como aparece en el acta constitutiva', type: 'text', validation: (value) => { if (value.length < 5) return { valid: false, error: 'Nombre muy corto' }; return { valid: true } } },
    { key: 'officialRegistry', question: '¿Número de registro oficial ante SADER/SEDAGRO?', hint: 'Escribe el número o "en trámite" si está pendiente', type: 'text', validation: validators.notEmpty },
    { key: 'rfc', question: '¿Cuál es el RFC de la Unión Ganadera?', hint: 'Formato: XXX-XXXXXX-XXX (escribe "omitir" si no disponible)', type: 'text', optional: true, validation: validators.rfc },
    { key: 'region', question: '¿Qué estado o región representas?', type: 'text', hint: 'Estado o zona de cobertura', validation: validators.notEmpty },
    { key: 'affiliates', question: '¿Cuántos productores están afiliados aproximadamente?', type: 'options', options: ['Menos de 50', '50–200', '200–500', '500–1,000', 'Más de 1,000'] },
    { key: 'foundationYear', question: '¿En qué año fue fundada la Unión?', hint: 'Ej: 1972', type: 'text', validation: validators.year },
    { key: 'physicalAddress', question: '¿Dirección de la sede u oficina principal?', hint: 'Calle, colonia, municipio, estado', type: 'text', validation: validators.address },
    { key: 'legalStatus', question: '¿Estatus legal actual de la Unión?', type: 'options', options: ['Activa y en regla', 'En proceso de renovación', 'En proceso de constitución'] },
    { key: 'institutionalContact', question: '¿Correo institucional de la Unión?', hint: 'Correo oficial de la organización (opcional)', type: 'text', optional: true, validation: validators.email }
  ],
  exporter: [
    { key: 'companyName', question: '¿Nombre oficial de tu empresa exportadora?', type: 'text', validation: validators.notEmpty },
    { key: 'taxId', question: '¿RFC o Tax ID de la empresa?', hint: 'Para empresas con operaciones en México/EE.UU.', type: 'text', validation: validators.notEmpty },
    { key: 'fiscalAddress', question: '¿Dirección fiscal de la empresa?', hint: 'Calle, número, colonia, municipio, estado, CP', type: 'text', validation: validators.address },
    { key: 'sanitaryExporterRegistry', question: '¿Número de registro sanitario de exportador SENASICA?', hint: 'Escribe "en trámite" si está pendiente', type: 'text', validation: validators.notEmpty },
    { key: 'exportType', question: '¿Tipo principal de exportación?', type: 'options', options: ['Ganado en pie', 'Carne en canal', 'Carne procesada/empacada', 'Embriones y material genético', 'Mixto'] },
    { key: 'destination', question: '¿Principal destino de exportación?', type: 'options', options: ['Estados Unidos', 'Canadá', 'México (zona franca)', 'Otro país'] },
    { key: 'annualVolume', question: '¿Volumen aproximado anual de exportación?', type: 'options', options: ['Menos de 500 cabezas/ton', '500–2,000', '2,000–10,000', 'Más de 10,000'] },
    { key: 'borderCrossings', question: '¿Puertos fronterizos o puntos de cruce que utilizas?', hint: 'Ej: Ciudad Juárez, Nogales, Piedras Negras, etc.', type: 'text', validation: validators.notEmpty }
  ],
  auditor: [
    { key: 'entity', question: '¿Para qué entidad trabajas o estás acreditado?', type: 'options', options: ['SENASICA', 'Unión Ganadera', 'Entidad certificadora privada', 'Gobierno estatal', 'Otro'] },
    { key: 'auditType', question: '¿Tipo de auditorías o inspecciones que realizas?', type: 'options', options: ['Sanidad animal', 'Movilización y trazabilidad', 'Bienestar animal', 'Exportación/importación', 'Inocuidad alimentaria', 'General'] },
    { key: 'licenseNumber', question: '¿Número de licencia, cédula o acreditación oficial?', type: 'text', validation: validators.notEmpty },
    { key: 'certifyingInstitution', question: '¿Institución que emitió tu certificación?', hint: 'Ej: SENASICA, colegio profesional, entidad privada', type: 'text', validation: validators.notEmpty },
    { key: 'rankOrLevel', question: '¿Tu nivel o rango dentro de la entidad?', type: 'options', options: ['Inspector de campo', 'Auditor certificado', 'Auditor líder', 'Supervisor regional', 'Coordinador nacional'] },
    { key: 'operationRegion', question: '¿Región o estados donde operas principalmente?', hint: 'Ej: Durango, Chihuahua, Sonora / Región Norte', type: 'text', validation: validators.notEmpty }
  ]
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
const SignUpInstitutional = () => {
  const navigate = useNavigate()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const [messages, setMessages] = useState<Message[]>([])
  const [userInput, setUserInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [inputEnabled, setInputEnabled] = useState(false)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [institutionalData, setInstitutionalData] = useState<Record<string, string>>({})
  const [userRole, setUserRole] = useState<Role | null>(null)
  const initialized = useRef(false)

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

    const personalDataStr = localStorage.getItem('signup-personal-data')
    if (!personalDataStr) { navigate('/signup/personal'); return }

    try {
      const personalData = JSON.parse(personalDataStr)
      const role = personalData.role as Role
      if (!role || !questionFlows[role]) throw new Error('Rol inválido')

      setUserRole(role)

      const roleNames: Record<Role, string> = {
        producer: 'productor ganadero',
        mvz: 'médico veterinario zootecnista',
        union: 'representante de Unión Ganadera',
        exporter: 'exportador',
        auditor: 'auditor/inspector'
      }

      setTimeout(() => {
        setMessages([{
          type: 'assistant',
          text: `Perfecto, ${personalData.fullName?.split(' ')[0] || ''}. Ahora que sé que eres ${roleNames[role]}, necesito algunos datos específicos de tu actividad.`
        }])
        setTimeout(() => {
          setIsTyping(true)
          setTimeout(() => {
            setIsTyping(false)
            askQuestion(0, role, {})
          }, 800)
        }, 1200)
      }, 500)
    } catch (error: unknown) {
      console.error('Error cargando datos personales:', error)
      navigate('/signup/personal')
    }
  }, [navigate]) // eslint-disable-line react-hooks/exhaustive-deps

  const addMessage = (message: Message) => setMessages(prev => [...prev, message])
  const showTyping = () => setIsTyping(true)
  const hideTyping = () => setIsTyping(false)

  const handleBack = () => {
    showConfirm(
      '¿Regresar al paso anterior?',
      'Se perderá el progreso de tu información institucional.',
      'Sí, regresar',
      () => {
        closeModal()
        localStorage.removeItem('signup-institutional-data')
        navigate('/signup/personal')
      }
    )
  }

  const handleSend = () => {
    const value = userInput.trim()
    if (!value || !userRole) return

    const questions = questionFlows[userRole]
    const currentQ = questions[questionIndex]

    if (currentQ.validation && !currentQ.optional) {
      const validation = currentQ.validation(value)
      if (!validation.valid) {
        addMessage({ type: 'user', text: value })
        setUserInput('')
        showTyping()
        setTimeout(() => {
          hideTyping()
          addMessage({ type: 'assistant', text: validation.error || 'Respuesta inválida. Intenta de nuevo.' })
          setInputEnabled(true)
        }, 600)
        return
      }
    }

    const sanitizedValue = value.slice(0, 500)
    addMessage({ type: 'user', text: sanitizedValue })
    setUserInput('')
    setInputEnabled(false)

    const updatedData = { ...institutionalData, [currentQ.key]: sanitizedValue }
    setInstitutionalData(updatedData)

    showTyping()
    setTimeout(() => {
      hideTyping()
      const nextIndex = questionIndex + 1
      setQuestionIndex(nextIndex)
      if (nextIndex < questions.length) {
        askQuestion(nextIndex, userRole, updatedData)
      } else {
        finishFlow(updatedData)
      }
    }, 600)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (userInput.trim()) handleSend()
    }
  }

  const askQuestion = (index: number, role: Role, currentData: Record<string, string>) => {
    const questions = questionFlows[role]
    if (index >= questions.length) { finishFlow(currentData); return }

    const question = questions[index]
    showTyping()
    setTimeout(() => {
      hideTyping()
      addMessage({ type: 'assistant', text: question.question })

      if (question.hint) {
        addMessage({
          type: 'assistant',
          customContent: (
            <div className="text-xs text-stone-500 dark:text-stone-500 mt-1 italic flex items-start gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-3.5 h-3.5 shrink-0 mt-0.5">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{question.hint}</span>
            </div>
          )
        })
      }

      if (question.type === 'options' && question.options) {
        addMessage({
          type: 'assistant',
          customContent: (
            <OptionsGrid
              options={question.options}
              onSelect={(value) => handleOptionSelect(value, index, role, currentData)}
            />
          )
        })
      } else {
        setInputEnabled(true)
      }
    }, 800)
  }

  const handleOptionSelect = (value: string, index: number, role: Role, currentData: Record<string, string>) => {
    const questions = questionFlows[role]
    const question = questions[index]
    addMessage({ type: 'user', text: value })

    const updatedData = { ...currentData, [question.key]: value }
    setInstitutionalData(updatedData)

    showTyping()
    setTimeout(() => {
      hideTyping()
      const nextIndex = index + 1
      setQuestionIndex(nextIndex)
      if (nextIndex < questions.length) {
        askQuestion(nextIndex, role, updatedData)
      } else {
        finishFlow(updatedData)
      }
    }, 600)
  }

  const finishFlow = (finalData: Record<string, string>) => {
    addMessage({ type: 'assistant', text: 'Perfecto. He registrado toda tu información institucional.' })
    setTimeout(() => {
      showTyping()
      setTimeout(() => {
        hideTyping()
        addMessage({ type: 'assistant', text: 'En el siguiente paso revisaremos y confirmaremos todos tus datos antes de crear tu cuenta definitiva.' })
        try {
          localStorage.setItem('signup-institutional-data', JSON.stringify(finalData))
        } catch (e) {
          console.error('Error guardando datos institucionales:', e)
        }
        setTimeout(() => navigate('/signup/confirmation'), 2000)
      }, 800)
    }, 500)
  }

  const questionCount = userRole ? questionFlows[userRole].length : 0
  const progressPct = questionCount > 0
    ? Math.round(((Math.min(questionIndex, questionCount)) / questionCount) * 100)
    : 0

  const roleLabels: Record<Role, string> = {
    producer: 'Productor', mvz: 'MVZ', union: 'Unión Ganadera',
    exporter: 'Exportador', auditor: 'Auditor'
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
              <span className="text-[11.5px] text-stone-400 dark:text-stone-600 font-medium">Datos Institucionales</span>
            </div>

            {/* Derecha: step */}
            <div className="flex items-center gap-2">
              {questionCount > 0 && (
                <>
                  <span className="text-[11px] font-semibold tracking-[0.1em] uppercase text-stone-400 dark:text-stone-600">
                    {String(Math.min(questionIndex + 1, questionCount)).padStart(2, '0')} / {String(questionCount).padStart(2, '0')}
                  </span>
                  <div className="w-px h-3 bg-stone-200 dark:bg-stone-800" />
                </>
              )}
              <span className="text-[12px] font-medium text-stone-600 dark:text-stone-400">
                {userRole ? roleLabels[userRole] : ''}
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
                  Tu actividad<br />nos importa.
                </h1>
                <p className="text-sm text-stone-400 dark:text-stone-600">Paso 3 de 4 — Datos institucionales</p>
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
      {inputEnabled && (
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
                placeholder="Escribe tu respuesta..."
                rows={1}
                maxLength={500}
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
                  <svg className="w-[17px] h-[17px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>
                  </svg>
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

export default SignUpInstitutional