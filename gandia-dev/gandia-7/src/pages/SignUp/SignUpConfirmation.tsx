import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { createUserProfile, getCurrentProfile } from '../../lib/authService'
import { supabase } from '../../lib/supabaseClient'

type Role = 'producer' | 'mvz' | 'union' | 'exporter' | 'auditor'
interface Message { type: 'assistant' | 'user'; text?: string; customContent?: React.ReactNode }

const roleLabels: Record<Role, string> = {
  producer: 'Productor Ganadero', mvz: 'Médico Veterinario Zootecnista',
  union: 'Unión Ganadera', exporter: 'Exportador', auditor: 'Auditor / Inspector'
}

const fieldLabels: Record<string, string> = {
  fullName: 'Nombre completo', birthdate: 'Fecha de nacimiento', gender: 'Género',
  curp: 'CURP', phone: 'Teléfono', address: 'Domicilio', state: 'Estado',
  municipality: 'Municipio', postalCode: 'Código postal', rfc: 'RFC', country: 'País', role: 'Rol',
  ranchName: 'Nombre del rancho', uppNumber: 'Número UPP', siniigaNumber: 'Número SINIIGA',
  operationType: 'Tipo de operación', cattleType: 'Tipo de ganado', herdSize: 'Tamaño del hato',
  yearsOfOperation: 'Años en operación', ranchAddress: 'Dirección del rancho',
  location: 'Estado del rancho', sanitaryCertifications: 'Certificaciones sanitarias',
  officialRegistry: 'Registro oficial ganadero', license: 'Cédula profesional',
  university: 'Universidad', graduationYear: 'Año de titulación', specialty: 'Especialidad',
  practiceMode: 'Modalidad de ejercicio', stateOfPractice: 'Estado donde ejerce',
  sanitaryRegistry: 'Registro sanitario SENASICA', college: 'Colegio MVZ',
  unionName: 'Nombre de la Unión', region: 'Región', affiliates: 'Productores afiliados',
  foundationYear: 'Año de fundación', physicalAddress: 'Dirección física',
  legalStatus: 'Estatus legal', institutionalContact: 'Correo institucional',
  companyName: 'Nombre de la empresa', taxId: 'RFC/Tax ID', fiscalAddress: 'Dirección fiscal',
  sanitaryExporterRegistry: 'Registro sanitario exportador', exportType: 'Tipo de exportación',
  destination: 'Destino principal', annualVolume: 'Volumen anual', borderCrossings: 'Puntos fronterizos',
  entity: 'Entidad', auditType: 'Tipo de auditoría', licenseNumber: 'Número de licencia',
  certifyingInstitution: 'Institución certificadora', rankOrLevel: 'Nivel/rango',
  operationRegion: 'Región de operación'
}

const authMethodLabels: Record<string, string> = {
  google: 'Google', apple: 'Apple ID', microsoft: 'Microsoft', email: 'Correo electrónico'
}

// ─── CONFIRM MODAL ─────────────────────────────────────────────────────────────
const ConfirmModal = ({ open, title, description, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', onConfirm, onCancel }: {
  open: boolean; title: string; description: string
  confirmLabel?: string; cancelLabel?: string
  onConfirm: () => void; onCancel: () => void
}) => {
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (!open) return
      if (e.key === 'Escape') onCancel()
      if (e.key === 'Enter') onConfirm()
    }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [open, onConfirm, onCancel])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-md" onClick={onCancel} />
      <div className="relative w-full max-w-sm animate-[modalIn_0.25s_cubic-bezier(.16,1,.3,1)]">
        <div className="h-[2px] bg-gradient-to-r from-transparent via-[#2FAF8F]/60 to-transparent rounded-t-3xl" />
        <div className="bg-[#0f0f0e] border border-white/[0.08] rounded-b-3xl rounded-t-none px-6 pt-6 pb-5">
          <div className="mb-5">
            <h3 className="text-[15px] font-semibold text-stone-50 tracking-tight">{title}</h3>
            <p className="text-[13px] text-stone-500 mt-1.5 leading-relaxed">{description}</p>
          </div>
          <div className="flex gap-2.5">
            <button onClick={onCancel} className="flex-1 h-10 rounded-xl bg-white/5 hover:bg-white/10 text-[13px] font-medium text-stone-400 hover:text-stone-200 transition-all">
              {cancelLabel}
            </button>
            <button onClick={onConfirm} className="flex-1 h-10 rounded-xl bg-[#2FAF8F] hover:bg-[#27a07f] text-[13px] font-semibold text-white shadow-sm active:scale-[0.98] transition-all">
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── SUCCESS SCREEN ────────────────────────────────────────────────────────────
const SuccessScreen = ({ accountId, name, onDismiss }: { accountId: string; name: string; onDismiss: () => void }) => {
  const [visible, setVisible] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    const timers = [
      setTimeout(() => setVisible(true), 50),
      setTimeout(() => setStep(1), 600),
      setTimeout(() => setStep(2), 1100),
      setTimeout(() => setStep(3), 1600),
    ]
    return () => timers.forEach(clearTimeout)
  }, [])

  const checks = [
    'Información personal verificada',
    'Datos institucionales registrados',
    'Solicitud enviada al equipo GANDIA',
  ]

  return (
    <div className={`fixed inset-0 z-[300] flex items-center justify-center px-4 transition-opacity duration-500 ${visible ? 'opacity-100' : 'opacity-0'}`}>
      <div className="absolute inset-0 bg-black/85 backdrop-blur-xl" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] bg-[#2FAF8F]/6 rounded-full blur-3xl pointer-events-none" />

      <div className={`relative z-10 w-full max-w-sm transition-all duration-700 ${visible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
        <div className="h-[2px] bg-gradient-to-r from-transparent via-[#2FAF8F]/70 to-transparent rounded-t-3xl" />
        <div className="bg-[#0f0f0e] border border-white/[0.08] rounded-b-3xl rounded-t-none overflow-hidden">
          <div className="px-7 pt-8 pb-6 relative">
            <button onClick={onDismiss} className="absolute top-4 right-4 w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-3.5 h-3.5 text-stone-500">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="flex flex-col items-center text-center mb-6">
              <div className="relative mb-4">
                <div className="w-16 h-16 rounded-2xl bg-[#2FAF8F]/12 border border-[#2FAF8F]/20 flex items-center justify-center animate-[scaleIn_0.5s_cubic-bezier(0.34,1.56,0.64,1)_0.2s_both]">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#2FAF8F" className="w-8 h-8">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="absolute inset-0 rounded-2xl border border-[#2FAF8F]/25 animate-[ringPulse_2.5s_ease-out_infinite_0.8s]" />
              </div>
              <h2 className="text-[19px] font-bold text-white tracking-tight">¡Solicitud enviada!</h2>
              <p className="text-stone-500 text-[12.5px] mt-1">
                Hola <span className="text-stone-300 font-medium">{name}</span>, tu registro está en revisión
              </p>
            </div>

            <div className="bg-white/[0.04] border border-white/[0.07] rounded-2xl px-4 py-3.5 mb-5">
              <p className="text-[10px] text-stone-600 uppercase tracking-[0.14em] mb-1.5 text-center">N° de solicitud</p>
              {accountId ? (
                <p className="text-center text-[15px] font-mono font-bold text-[#2FAF8F] tracking-[0.22em]">{accountId}</p>
              ) : (
                <div className="flex justify-center py-1">
                  <div className="w-4 h-4 border-2 border-[#2FAF8F] border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            <div className="space-y-2.5">
              {checks.map((label, i) => (
                <div key={i} className={`flex items-center gap-3 transition-all duration-500 ${step > i ? 'opacity-100' : 'opacity-15'}`}>
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-all duration-400 ${step > i ? 'bg-[#2FAF8F]' : 'border border-stone-700'}`}>
                    {step > i && (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" className="w-2.5 h-2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className="text-[12px] text-stone-400">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Ticket tear */}
          <div className="relative h-[18px] bg-[#0f0f0e] border-x border-white/[0.06] overflow-hidden">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-dashed border-white/[0.08]" />
            </div>
            <div className="absolute -left-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-black" />
            <div className="absolute -right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-black" />
          </div>

          <div className="px-7 py-5">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-7 h-7 bg-[#2FAF8F]/10 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#2FAF8F" className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-[12px] text-stone-500 leading-relaxed">
                Revisión en <span className="text-white font-semibold">24–48 h hábiles</span>. Te avisaremos cuando tu cuenta esté activa.
              </p>
            </div>
            <button onClick={onDismiss} className="w-full h-10 rounded-xl bg-[#2FAF8F] hover:bg-[#26a079] text-white text-[13px] font-semibold transition-colors active:scale-[0.98]">
              Entendido
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── CHECKBOX ──────────────────────────────────────────────────────────────────
const Checkbox = ({ checked, onChange, label, sublabel, required }: {
  checked: boolean; onChange: () => void; label: string; sublabel?: string; required?: boolean
}) => (
  <label className="flex items-start gap-3 cursor-pointer group py-0.5">
    <div
      onClick={onChange}
      role="checkbox"
      aria-checked={checked}
      tabIndex={0}
      onKeyDown={e => e.key === ' ' && (e.preventDefault(), onChange())}
      className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#2FAF8F]/40 ${
        checked
          ? 'bg-[#2FAF8F] border-[#2FAF8F]'
          : 'bg-white dark:bg-[#1A1A1A] border-stone-300 dark:border-stone-700 group-hover:border-[#2FAF8F]/50'
      }`}
    >
      {checked && (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" className="w-2.5 h-2.5">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3.5} d="M5 13l4 4L19 7" />
        </svg>
      )}
    </div>
    <div className="flex-1 leading-relaxed">
      <span className="text-[13px] text-stone-700 dark:text-stone-300 select-none">{label}</span>
      {required && (
        <a href="/legal" target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="ml-1.5 text-[11.5px] text-[#2FAF8F] hover:underline">
          (leer)
        </a>
      )}
      {sublabel && <p className="text-[11px] text-[#2FAF8F]/80 font-medium mt-0.5">{sublabel}</p>}
    </div>
  </label>
)

// ─── TERMS SECTION ─────────────────────────────────────────────────────────────
const TermsSection = ({
  termsAccepted, setTermsAccepted, notifications, setNotifications,
  handleConfirm, isSubmitting, isSuccess, submitError, retryCount
}: {
  termsAccepted: { terms: boolean; privacy: boolean; notice: boolean }
  setTermsAccepted: React.Dispatch<React.SetStateAction<{ terms: boolean; privacy: boolean; notice: boolean }>>
  notifications: { alerts: boolean; newsletter: boolean }
  setNotifications: React.Dispatch<React.SetStateAction<{ alerts: boolean; newsletter: boolean }>>
  handleConfirm: () => void; isSubmitting: boolean; isSuccess: boolean
  submitError: string | null; retryCount: number
}) => {
  const allAccepted = termsAccepted.terms && termsAccepted.privacy && termsAccepted.notice
  const toggleTerm = (k: keyof typeof termsAccepted) => setTermsAccepted(p => ({ ...p, [k]: !p[k] }))
  const toggleNotif = (k: keyof typeof notifications) => setNotifications(p => ({ ...p, [k]: !p[k] }))

  return (
    <div className="w-full space-y-3">
      <div className="bg-white dark:bg-[#121212] border border-stone-200/70 dark:border-stone-800/60 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-[0.1em]">Requerido</span>
          <span className="text-[11px] text-red-400 font-medium">* Obligatorio</span>
        </div>
        <Checkbox checked={termsAccepted.terms} onChange={() => toggleTerm('terms')} label="Acepto los términos y condiciones de GANDIA" required />
        <Checkbox checked={termsAccepted.privacy} onChange={() => toggleTerm('privacy')} label="Acepto la política de privacidad (LFPDPPP)" required />
        <Checkbox checked={termsAccepted.notice} onChange={() => toggleTerm('notice')} label="He leído y acepto el aviso de privacidad" required />
      </div>

      <div className="bg-white dark:bg-[#121212] border border-stone-200/50 dark:border-stone-800/40 rounded-2xl p-4 space-y-3">
        <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-[0.1em] block">Notificaciones</span>
        <Checkbox checked={notifications.alerts} onChange={() => toggleNotif('alerts')} label="Recibir alertas sanitarias y avisos del sistema" sublabel="Recomendado" />
        <Checkbox checked={notifications.newsletter} onChange={() => toggleNotif('newsletter')} label="Recibir boletines del sector ganadero" />
      </div>

      {submitError && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-3.5 h-3.5 text-red-500">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-[13px] font-semibold text-red-600 dark:text-red-400 mb-0.5">Error al crear la cuenta</p>
              <p className="text-[12px] text-red-500 dark:text-red-500/80 leading-relaxed">{submitError}</p>
              {retryCount < 3 && (
                <button onClick={handleConfirm} className="mt-2.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-[11.5px] font-semibold transition-colors flex items-center gap-1.5">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-3 h-3">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Reintentar
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <button
        onClick={handleConfirm}
        disabled={!allAccepted || isSubmitting || isSuccess}
        className={`w-full h-12 rounded-xl font-semibold text-[13.5px] transition-all flex items-center justify-center gap-2.5 ${
          isSuccess
            ? 'bg-[#2FAF8F] text-white cursor-default'
            : allAccepted && !isSubmitting
              ? 'bg-[#2FAF8F] text-white hover:bg-[#26a079] active:scale-[0.98] shadow-[0_4px_20px_rgba(47,175,143,0.22)]'
              : 'bg-stone-100 dark:bg-stone-800/60 text-stone-300 dark:text-stone-600 cursor-not-allowed'
        }`}
      >
        {isSuccess ? (
          <><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>Cuenta registrada</>
        ) : isSubmitting ? (
          <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Creando cuenta...</>
        ) : (
          <><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>Crear mi cuenta en GANDIA</>
        )}
      </button>

      {!allAccepted && !isSubmitting && (
        <p className="text-center text-[11px] text-stone-400 dark:text-stone-600">
          Acepta los 3 términos requeridos para continuar
        </p>
      )}
    </div>
  )
}

// ─── SUMMARY CARD — fuera del padre para evitar remounts ──────────────────────
const SummaryCard = ({
  pData, iData, onEditPersonal, onEditInstitutional
}: {
  pData: Record<string, unknown>
  iData: Record<string, unknown>
  onEditPersonal: () => void
  onEditInstitutional: () => void
}) => {
  const authMethod = localStorage.getItem('signup-auth-method') || 'email'
  const email = localStorage.getItem('signup-email') || ''
  const [expanded, setExpanded] = useState<'personal' | 'institutional' | null>(null)

  const personalFields = [
    { key: 'fullName', value: String(pData.fullName || '') },
    { key: 'birthdate', value: String(pData.birthdate || '') },
    { key: 'gender', value: String(pData.gender || '') },
    { key: 'curp', value: String(pData.curp || '') },
    { key: 'phone', value: String(pData.phone || '') },
    { key: 'address', value: String(pData.address || '') },
    { key: 'municipality', value: String(pData.municipality || '') },
    { key: 'state', value: String(pData.state || '') },
    { key: 'postalCode', value: String(pData.postalCode || '') },
    { key: 'country', value: String(pData.country || 'México') },
    { key: 'rfc', value: String(pData.rfc || '') },
    { key: 'role', value: roleLabels[pData.role as Role] || String(pData.role || '') },
  ].filter(f => f.value && f.value !== 'undefined' && f.value.trim() !== '')

  const institutionalFields = Object.entries(iData)
    .filter(([, v]) => v !== undefined && v !== null && String(v).trim() !== '')
    .map(([key, value]) => ({ key, value: String(value) }))

  const displayedPersonal = expanded === 'personal' ? personalFields : personalFields.slice(0, 5)
  const displayedInstitutional = expanded === 'institutional' ? institutionalFields : institutionalFields.slice(0, 5)

  return (
    <div className="bg-white dark:bg-[#121212] border border-stone-200/70 dark:border-stone-800/60 rounded-2xl overflow-hidden w-full shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
      <div className="px-4 py-2.5 bg-[#2FAF8F]/6 dark:bg-[#2FAF8F]/4 border-b border-stone-200/50 dark:border-stone-800/40 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-3.5 h-3.5 text-[#2FAF8F] shrink-0">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        <span className="text-[12px] text-stone-500 dark:text-stone-500">
          Acceso: <span className="text-[#2FAF8F] font-semibold">{authMethodLabels[authMethod] || authMethod}</span>
          {email && <span className="text-stone-400 dark:text-stone-600 ml-1.5">· {email}</span>}
        </span>
      </div>

      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[13px] font-semibold text-stone-800 dark:text-stone-100">Datos Personales</span>
          <button onClick={onEditPersonal} className="flex items-center gap-1 text-[11.5px] text-[#2FAF8F] hover:text-[#26a079] font-medium transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-3 h-3">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Editar
          </button>
        </div>
        <div className="space-y-2">
          {displayedPersonal.map(f => (
            <div key={f.key} className="flex justify-between items-baseline gap-3 min-w-0">
              <span className="text-[12px] text-stone-400 dark:text-stone-500 shrink-0">{fieldLabels[f.key] || f.key}</span>
              <span className="text-[12.5px] text-stone-700 dark:text-stone-200 font-medium text-right break-all min-w-0">{f.value}</span>
            </div>
          ))}
        </div>
        {personalFields.length > 5 && (
          <button onClick={() => setExpanded(expanded === 'personal' ? null : 'personal')} className="mt-2.5 text-[11.5px] text-[#2FAF8F] hover:text-[#26a079] font-medium transition-colors">
            {expanded === 'personal' ? 'Ver menos ↑' : `+${personalFields.length - 5} más`}
          </button>
        )}
      </div>

      <div className="px-4 pt-3 pb-4 border-t border-stone-100 dark:border-stone-800/50">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[13px] font-semibold text-stone-800 dark:text-stone-100">Datos Institucionales</span>
          <button onClick={onEditInstitutional} className="flex items-center gap-1 text-[11.5px] text-[#2FAF8F] hover:text-[#26a079] font-medium transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-3 h-3">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Editar
          </button>
        </div>
        <div className="space-y-2">
          {displayedInstitutional.map(f => (
            <div key={f.key} className="flex justify-between items-baseline gap-3 min-w-0">
              <span className="text-[12px] text-stone-400 dark:text-stone-500 shrink-0">{fieldLabels[f.key] || f.key}</span>
              <span className="text-[12.5px] text-stone-700 dark:text-stone-200 font-medium text-right break-all min-w-0">{f.value}</span>
            </div>
          ))}
        </div>
        {institutionalFields.length > 5 && (
          <button onClick={() => setExpanded(expanded === 'institutional' ? null : 'institutional')} className="mt-2.5 text-[11.5px] text-[#2FAF8F] hover:text-[#26a079] font-medium transition-colors">
            {expanded === 'institutional' ? 'Ver menos ↑' : `+${institutionalFields.length - 5} más`}
          </button>
        )}
      </div>
    </div>
  )
}

// ─── MAIN ──────────────────────────────────────────────────────────────────────
const SignUpConfirmation = () => {
  const navigate = useNavigate()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [accountId, setAccountId] = useState('')
  const [retryCount, setRetryCount] = useState(0)
  const [showTerms, setShowTerms] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [termsAccepted, setTermsAccepted] = useState({ terms: false, privacy: false, notice: false })
  const [notifications, setNotifications] = useState({ alerts: true, newsletter: false })
  const [personalData, setPersonalData] = useState<Record<string, unknown> | null>(null)
  const [institutionalData, setInstitutionalData] = useState<Record<string, unknown> | null>(null)
  const initialized = useRef(false)
  const [modal, setModal] = useState<{ open: boolean; title: string; description: string; confirmLabel: string; onConfirm: () => void }>
    ({ open: false, title: '', description: '', confirmLabel: 'Confirmar', onConfirm: () => {} })

  const showConfirmModal = (title: string, description: string, confirmLabel: string, onConfirm: () => void) =>
    setModal({ open: true, title, description, confirmLabel, onConfirm })
  const closeModal = () => setModal(m => ({ ...m, open: false }))

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, showTerms])

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    const personalStr = localStorage.getItem('signup-personal-data')
    const institutionalStr = localStorage.getItem('signup-institutional-data')
    if (!personalStr || !institutionalStr) { navigate('/signup/personal'); return }

    try {
      const pData = JSON.parse(personalStr)
      const iData = JSON.parse(institutionalStr)
      if (!pData.fullName || !pData.role || !pData.phone) throw new Error('Datos personales incompletos')
      if (!iData || Object.keys(iData).length === 0) throw new Error('Datos institucionales vacíos')

      setPersonalData(pData)
      setInstitutionalData(iData)

      const firstName = String(pData.fullName).split(' ')[0]

      setTimeout(() => {
        setMessages([{ type: 'assistant', text: `¡Excelente, ${firstName}! Llegamos al último paso. Revisa que todo esté correcto:` }])
        setTimeout(() => {
          setMessages(prev => [...prev, {
            type: 'assistant',
            customContent: (
              <SummaryCard
                pData={pData}
                iData={iData}
                onEditPersonal={() => navigate('/signup/personal')}
                onEditInstitutional={() => navigate('/signup/institutional')}
              />
            )
          }])
          setTimeout(() => {
            setIsTyping(true)
            setTimeout(() => {
              setIsTyping(false)
              setMessages(prev => [...prev, { type: 'assistant', text: '¿Todo se ve bien? Acepta los términos para crear tu cuenta:' }])
              setTimeout(() => setShowTerms(true), 350)
            }, 800)
          }, 800)
        }, 1000)
      }, 500)
    } catch (err) {
      console.error('[SignUpConfirmation]', err)
      navigate('/signup/personal')
    }
  }, [navigate]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleBack = () => {
    if (isSubmitting || isSuccess) return
    showConfirmModal(
      '¿Regresar al paso anterior?',
      'Podrás editar tu información institucional antes de confirmar.',
      'Sí, regresar',
      () => { closeModal(); navigate('/signup/institutional') }
    )
  }

  const handleConfirm = async () => {
    if (isSubmitting || isSuccess || !personalData || !institutionalData) return
    setIsSubmitting(true)
    setIsTyping(true)
    setSubmitError(null)

    // Timeout de seguridad: si Supabase no responde en 20s, desbloquear UI
    const timeoutId = setTimeout(() => {
      setIsTyping(false)
      setIsSubmitting(false)
      setSubmitError('La solicitud tardó demasiado. Verifica tu conexión e intenta de nuevo.')
    }, 20000)

    try {
      const authMethod = localStorage.getItem('signup-auth-method') || 'email'
      const email = localStorage.getItem('signup-email') || String(personalData.email || '')

      // Obtener userId: primero de la sesión activa, luego de localStorage
      // Esto resuelve Google OAuth donde signup-user-id nunca se guarda
      const { data: { session: currentSession } } = await supabase.auth.getSession()
      const sessionUserId = currentSession?.user?.id
      const localUserId = localStorage.getItem('signup-user-id') || undefined
      const userId = sessionUserId || localUserId

      if (!userId) {
        // Último recurso: getUser() hace llamada directa a la API
        const { data: { user } } = await supabase.auth.getUser()
        if (!user?.id) throw new Error('No se pudo obtener la sesión. Recarga e intenta de nuevo.')
        localStorage.setItem('signup-user-id', user.id)
      } else {
        // Guardar para que authService lo encuentre en localStorage
        localStorage.setItem('signup-user-id', userId)
      }

      let serverAccountId = await createUserProfile({
        user_id: localStorage.getItem('signup-user-id') || undefined,
        auth_method: authMethod,
        email,
        role: personalData.role as Role,
        personal_data: personalData as Record<string, string | number | boolean | null>,
        institutional_data: institutionalData as Record<string, string | number | boolean | null>,
        terms_accepted: {
          terms: termsAccepted.terms,
          privacy: termsAccepted.privacy,
          notice: termsAccepted.notice,
          accepted_at: new Date().toISOString()
        },
        notifications_preferences: {
          alerts: notifications.alerts,
          newsletter: notifications.newsletter
        },
        status: 'pending',
        metadata: {
          user_agent: navigator.userAgent,
          signup_completed_at: new Date().toISOString(),
          retry_count: retryCount
        }
      })


      // Si el trigger de DB no generó account_id aún, intentar una vez más
      if (!serverAccountId) {
        try {
          const profile = await getCurrentProfile()
          serverAccountId = profile?.account_id || ''
        } catch (e) {
          console.warn('[SignUp] fallback getCurrentProfile falló:', e)
        }
      }

      clearTimeout(timeoutId)
      setIsTyping(false)
      setIsSuccess(true)
      setAccountId(serverAccountId)

      ;['signup-auth-method', 'signup-email', 'signup-user-id', 'signup-personal-data', 'signup-institutional-data']
        .forEach(k => localStorage.removeItem(k))
      localStorage.setItem('signup-completed', 'true')
      localStorage.setItem('user-status', 'pending')
      if (serverAccountId) localStorage.setItem('account-id', serverAccountId)

    } catch (err: unknown) {
      clearTimeout(timeoutId)
      // Log completo del error real para depuración
      console.error('[SignUp] ERROR:', err)

      setIsTyping(false)
      setIsSubmitting(false)
      const newRetry = retryCount + 1
      setRetryCount(newRetry)
      const msg = (err instanceof Error ? err.message : String(err)).toLowerCase()
      let userMessage = `Error: ${err instanceof Error ? err.message : 'Problema desconocido. Revisa la consola.'}`
      if (msg.includes('network') || msg.includes('fetch') || msg.includes('failed'))
        userMessage = 'Sin conexión a internet. Verifica tu red e intenta de nuevo.'
      else if (msg.includes('sesión') || msg.includes('session') || msg.includes('autenticar'))
        userMessage = 'Tu sesión expiró. Recarga la página e inicia de nuevo.'
      else if (msg.includes('ya existe') || msg.includes('duplicate') || msg.includes('unique') || msg.includes('23505'))
        userMessage = 'Esta cuenta ya fue registrada. Intenta iniciar sesión.'
      else if (msg.includes('42501') || msg.includes('rls') || msg.includes('acceso'))
        userMessage = 'Error de permisos. Recarga la página y vuelve a intentar.'
      if (newRetry >= 3)
        userMessage += ' Si el problema persiste, contacta soporte: soporte@gandia.mx'
      setSubmitError(userMessage)
    }
  }

  return (
    <div className="min-h-screen bg-[#fafaf9] dark:bg-[#0c0a09] text-stone-900 dark:text-stone-50 flex flex-col overflow-hidden font-sans">

      {isSuccess && personalData && (
        <SuccessScreen
          accountId={accountId}
          name={String(personalData.fullName || '').split(' ')[0]}
          onDismiss={() => navigate('/signup')}
        />
      )}

      <ConfirmModal
        open={modal.open} title={modal.title} description={modal.description}
        confirmLabel={modal.confirmLabel} cancelLabel="Cancelar"
        onConfirm={modal.onConfirm} onCancel={closeModal}
      />

      {/* ── HEADER ── */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <div className="h-[2px] bg-stone-100 dark:bg-stone-900">
          <div className="h-full bg-[#2FAF8F] w-full" />
        </div>
        <div className="bg-[#fafaf9]/96 dark:bg-[#0c0a09]/96 backdrop-blur-md border-b border-stone-200/40 dark:border-stone-800/40">
          <div className="flex items-center justify-between px-5 h-[54px]">
            <button
              onClick={handleBack}
              disabled={isSubmitting || isSuccess}
              className="flex items-center gap-1.5 text-stone-400 dark:text-stone-600 hover:text-stone-700 dark:hover:text-stone-300 transition-colors group disabled:opacity-30 disabled:pointer-events-none"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-[12px] font-medium">Volver</span>
            </button>

            <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
              <svg className="w-5 h-5 text-[#2FAF8F]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
              </svg>
              <span className="text-[13px] font-semibold text-stone-900 dark:text-stone-50 tracking-tight">GANDIA</span>
              <div className="w-px h-3 bg-stone-200 dark:bg-stone-800" />
              <span className="text-[11.5px] text-stone-400 dark:text-stone-600 font-medium">
                {isSuccess ? 'Registro completado ✓' : 'Confirmación final'}
              </span>
            </div>

            <span className="text-[11px] font-semibold tracking-[0.1em] uppercase text-[#2FAF8F]">
              04 / 04
            </span>
          </div>
        </div>
      </div>

      {/* ── MENSAJES ── */}
      <div className="flex-1 overflow-y-auto pt-[52px] pb-10 px-4" style={{ scrollBehavior: 'smooth' }}>
        <div className="max-w-2xl mx-auto flex flex-col gap-6 py-8">

          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center min-h-[55vh] animate-[fadeIn_0.4s_ease_both]">
              <div className="text-center">
                <h1 className="text-[2.1rem] font-serif italic text-stone-900 dark:text-stone-50 leading-[1.2] tracking-[-0.01em] mb-3">
                  Casi listo.
                </h1>
                <p className="text-sm text-stone-400 dark:text-stone-600">Paso 4 de 4 — Confirmación</p>
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'} animate-[fadeIn_0.22s_ease_both]`}>
              {msg.type === 'user' ? (
                <div className="max-w-[75%] bg-white dark:bg-[#1c1917] border border-stone-200/70 dark:border-stone-800/60 rounded-2xl rounded-br-sm px-4 py-3">
                  <p className="text-[14px] text-stone-800 dark:text-stone-100 leading-[1.7]">{msg.text}</p>
                </div>
              ) : (
                <div className="w-full max-w-[95%]">
                  {msg.customContent ? msg.customContent : (
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

          {showTerms && (
            <div className="w-full animate-[fadeIn_0.3s_ease_both]">
              <TermsSection
                termsAccepted={termsAccepted} setTermsAccepted={setTermsAccepted}
                notifications={notifications} setNotifications={setNotifications}
                handleConfirm={handleConfirm} isSubmitting={isSubmitting}
                isSuccess={isSuccess} submitError={submitError} retryCount={retryCount}
              />
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes modalIn { from { opacity: 0; transform: scale(0.95) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.5); } to { opacity: 1; transform: scale(1); } }
        @keyframes ringPulse { 0% { opacity: 1; transform: scale(1); } 100% { opacity: 0; transform: scale(1.6); } }
      `}</style>
    </div>
  )
}

export default SignUpConfirmation