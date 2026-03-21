/**
 * FichaNuevoWidget — Registro real de animal a Supabase
 * 
 * ARCHIVO → src/artifacts/passport/widgets/FichaNuevoWidget.tsx
 * 
 * CAMBIOS vs versión mock:
 *   - Llama a registrarAnimal() que invoca la Edge Function generate-mrz
 *   - Muestra el QR del MRZ generado tras registrar exitosamente
 *   - Validación de SINIIGA formato mexicano
 */

import { useState } from 'react'
import { useUser } from '../../../context/UserContext'
import { registrarAnimal, dbToPassportData, useRanchoId, getAuthUserId, type NuevoAnimalInput, type AnimalDB } from '../../../hooks/useAnimales'
import FichaCard from './FichaCard'

// ─── PROPS ────────────────────────────────────────────────────────────────────

interface Props {
  onCancelar: () => void
  onGuardar:  () => void
}

// ─── CONSTANTES ───────────────────────────────────────────────────────────────

const ESTADOS_MX = [
  { code: 'AGS', label: 'Aguascalientes' }, { code: 'BC',  label: 'Baja California' },
  { code: 'BCS', label: 'Baja California Sur' }, { code: 'CAM', label: 'Campeche' },
  { code: 'CHI', label: 'Chihuahua' }, { code: 'CHS', label: 'Chiapas' },
  { code: 'COA', label: 'Coahuila' }, { code: 'COL', label: 'Colima' },
  { code: 'DGO', label: 'Durango' }, { code: 'GRO', label: 'Guerrero' },
  { code: 'GTO', label: 'Guanajuato' }, { code: 'HGO', label: 'Hidalgo' },
  { code: 'JAL', label: 'Jalisco' }, { code: 'MEX', label: 'Estado de México' },
  { code: 'MCH', label: 'Michoacán' }, { code: 'MOR', label: 'Morelos' },
  { code: 'NAY', label: 'Nayarit' }, { code: 'NL',  label: 'Nuevo León' },
  { code: 'OAX', label: 'Oaxaca' }, { code: 'PUE', label: 'Puebla' },
  { code: 'QRO', label: 'Querétaro' }, { code: 'QR',  label: 'Quintana Roo' },
  { code: 'SLP', label: 'San Luis Potosí' }, { code: 'SIN', label: 'Sinaloa' },
  { code: 'SON', label: 'Sonora' }, { code: 'TAB', label: 'Tabasco' },
  { code: 'TAM', label: 'Tamaulipas' }, { code: 'TLX', label: 'Tlaxcala' },
  { code: 'VER', label: 'Veracruz' }, { code: 'YUC', label: 'Yucatán' },
  { code: 'ZAC', label: 'Zacatecas' }, { code: 'CMX', label: 'CDMX' },
]

const RAZAS_BOVINAS = [
  'Angus', 'Brahman', 'Brangus', 'Charolais', 'Hereford', 'Limousin',
  'Salers', 'Simmental', 'Suizo Europeo', 'Suizo Americano',
  'Charolais × Suizo', 'Simmental × Brahman', 'Otra',
]

// ─── WIDGET ───────────────────────────────────────────────────────────────────

export default function FichaNuevoWidget({ onCancelar, onGuardar }: Props) {
  const { profile } = useUser()
  const userId   = profile?.user_id ?? null
  const { ranchoId } = useRanchoId(userId)
  const pd          = (profile?.personal_data as Record<string, string> | null) ?? {}
  const propietario = pd.fullName ?? pd.full_name ?? pd.nombre_completo ?? pd.nombre ?? '—'

  const [form, setForm] = useState<NuevoAnimalInput>({
    siniiga:            '',
    rfid:               '',
    nombre:             '',
    raza:               '',
    especie:            'bovino',
    sexo:               'hembra',
    fecha_nacimiento:   '',
    peso_kg:            undefined,
    peso_nacimiento:    undefined,
    peso_meta:          undefined,
    ganancia_diaria_kg: undefined,
    upp:                '',
    estado_mx:          'NL',
    municipio:          '',
  })

  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState<string | null>(null)
  const [animalCreado, setAnimalCreado] = useState<AnimalDB | null>(null)

  // ── Validación de SINIIGA ─────────────────────────────────────────────────
  const siniigaValido = (s: string) => {
    // SINIIGA México: formato MX-XX-YYYY-NNNNNN o 15 dígitos numéricos
    const conGuiones = /^MX-[A-Z]{2,3}-\d{4}-\d{4,6}$/i
    const numerico   = /^\d{15}$/
    return conGuiones.test(s.trim()) || numerico.test(s.trim())
  }

  // ── Handlers ─────────────────────────────────────────────────────────────

  const set = (field: keyof NuevoAnimalInput, value: NuevoAnimalInput[keyof NuevoAnimalInput]) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const handleSubmit = async () => {
    const authUserId = await getAuthUserId()
    if (!authUserId || !ranchoId) {
      setError('Sin sesión o rancho activo. Recarga la página.')
      return
    }

    // Validaciones básicas
    if (!form.siniiga.trim())      return setError('El SINIIGA es obligatorio')
    if (!siniigaValido(form.siniiga)) return setError('Formato SINIIGA inválido (ej: MX-NL-2024-000142)')
    if (!form.raza)                return setError('Selecciona una raza')
    if (!form.fecha_nacimiento)    return setError('La fecha de nacimiento es obligatoria')
    if (!form.estado_mx)           return setError('Selecciona el estado')

    setLoading(true)
    setError(null)

    const { animal, error: err } = await registrarAnimal(
      {
        ...form,
        rfid:    form.rfid    || undefined,
        nombre:  form.nombre  || undefined,
        upp:     form.upp     || undefined,
        municipio: form.municipio || undefined,
      },
      ranchoId,
      authUserId
    )

    setLoading(false)

    if (err) {
      setError(err)
      return
    }

    setAnimalCreado(animal)
  }

  // ── Si ya se registró, mostrar FichaCard con el QR ───────────────────────
  if (animalCreado) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2.5 p-3 rounded-[10px] bg-[#2FAF8F]/08 dark:bg-[#2FAF8F]/10 border border-[#2FAF8F]/20">
          <svg className="w-4 h-4 text-[#2FAF8F] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <div>
            <p className="text-[12.5px] font-semibold text-stone-700 dark:text-stone-200">
              Animal registrado exitosamente
            </p>
            <p className="text-[11px] text-stone-400 dark:text-stone-500">
              El MRZ y QR han sido generados y guardados de forma permanente
            </p>
          </div>
        </div>

        <FichaCard data={dbToPassportData(animalCreado, propietario)} />

        <div className="flex gap-2 mt-2">
          <button
            onClick={onGuardar}
            className="flex-1 py-2.5 rounded-[10px] bg-[#2FAF8F] text-white text-[12px] font-semibold hover:bg-[#27a07f] transition-colors border-0 cursor-pointer"
          >
            Ver todos los animales
          </button>
        </div>
      </div>
    )
  }

  // ── Formulario ───────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-5">

      <div>
        <p className="text-[13px] font-semibold text-stone-700 dark:text-stone-200">Registrar animal</p>
        <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-0.5">
          El MRZ y código QR se generan automáticamente al guardar.
        </p>
      </div>

      {/* ── Sección: Identificación ── */}
      <Section label="Identificación">
        <Field label="SINIIGA *" hint="ej: MX-NL-2024-000142">
          <input
            type="text"
            placeholder="MX-NL-2024-000142"
            value={form.siniiga}
            onChange={e => set('siniiga', e.target.value.trim())}
            className={inputClass}
          />
        </Field>
        <Field label="RFID (transponder)" hint="15 dígitos del chip">
          <input
            type="text"
            placeholder="900115000234821"
            value={form.rfid}
            onChange={e => set('rfid', e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Nombre del animal" hint="opcional">
          <input
            type="text"
            placeholder="Lupita"
            value={form.nombre}
            onChange={e => set('nombre', e.target.value)}
            className={inputClass}
          />
        </Field>
      </Section>

      {/* ── Sección: Características ── */}
      <Section label="Características">
        <Field label="Raza *">
          <select value={form.raza} onChange={e => set('raza', e.target.value)} className={inputClass}>
            <option value="">Seleccionar…</option>
            {RAZAS_BOVINAS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </Field>
        <Field label="Sexo *">
          <div className="flex gap-2">
            {(['hembra', 'macho'] as const).map(s => (
              <button
                key={s}
                type="button"
                onClick={() => set('sexo', s)}
                className={`flex-1 py-2 rounded-[8px] text-[11.5px] font-medium border transition-all cursor-pointer ${
                  form.sexo === s
                    ? 'bg-[#2FAF8F] text-white border-[#2FAF8F]'
                    : 'bg-transparent text-stone-500 dark:text-stone-400 border-stone-200/70 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700'
                }`}
              >
                {s === 'hembra' ? 'Hembra' : 'Macho'}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Fecha de nacimiento *">
          <input
            type="date"
            value={form.fecha_nacimiento}
            onChange={e => set('fecha_nacimiento', e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Peso inicial (kg)" hint="opcional">
          <input
            type="number"
            placeholder="485"
            min={0}
            max={2000}
            value={form.peso_kg ?? ''}
            onChange={e => set('peso_kg', e.target.value ? Number(e.target.value) : undefined)}
            className={inputClass}
          />
        </Field>
        <Field label="Peso al nacer (kg)" hint="opcional">
          <input
            type="number"
            placeholder="38"
            min={0}
            max={200}
            value={form.peso_nacimiento ?? ''}
            onChange={e => set('peso_nacimiento', e.target.value ? Number(e.target.value) : undefined)}
            className={inputClass}
          />
        </Field>
        <Field label="Peso meta de engorda (kg)" hint="ej: 480 para exportación">
          <input
            type="number"
            placeholder="480"
            min={0}
            max={2000}
            value={form.peso_meta ?? ''}
            onChange={e => set('peso_meta', e.target.value ? Number(e.target.value) : undefined)}
            className={inputClass}
          />
        </Field>
        <Field label="Ganancia diaria esperada (kg/día)" hint="ej: 0.9">
          <input
            type="number"
            placeholder="0.9"
            min={0}
            max={5}
            step={0.1}
            value={form.ganancia_diaria_kg ?? ''}
            onChange={e => set('ganancia_diaria_kg', e.target.value ? Number(e.target.value) : undefined)}
            className={inputClass}
          />
        </Field>
      </Section>

      {/* ── Sección: Ubicación ── */}
      <Section label="Ubicación y UPP">
        <Field label="Estado *">
          <select value={form.estado_mx} onChange={e => set('estado_mx', e.target.value)} className={inputClass}>
            {ESTADOS_MX.map(e => (
              <option key={e.code} value={e.code}>{e.label}</option>
            ))}
          </select>
        </Field>
        <Field label="Municipio" hint="opcional">
          <input
            type="text"
            placeholder="Nombre del municipio"
            value={form.municipio}
            onChange={e => set('municipio', e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="UPP (Unidad de Producción Pecuaria)" hint="opcional">
          <input
            type="text"
            placeholder="UPP Rancho Morales"
            value={form.upp}
            onChange={e => set('upp', e.target.value)}
            className={inputClass}
          />
        </Field>
      </Section>

      {/* ── Error ── */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-[10px] bg-red-50 dark:bg-red-950/30 border border-red-200/70 dark:border-red-900/50">
          <svg className="w-3.5 h-3.5 text-red-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <p className="text-[11.5px] text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* ── Botones ── */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={onCancelar}
          disabled={loading}
          className="flex-1 py-2.5 rounded-[10px] border border-stone-200/70 dark:border-stone-800 text-[12px] text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors bg-transparent cursor-pointer disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="flex-1 py-2.5 rounded-[10px] bg-[#2FAF8F] text-white text-[12px] font-semibold hover:bg-[#27a07f] transition-colors border-0 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Generando MRZ…
            </>
          ) : (
            'Registrar y generar QR'
          )}
        </button>
      </div>
    </div>
  )
}

// ─── HELPERS DE DISEÑO ────────────────────────────────────────────────────────

const inputClass = `
  w-full px-3 py-2 text-[12px]
  bg-stone-50 dark:bg-stone-800/60
  border border-stone-200/70 dark:border-stone-800
  rounded-[8px]
  text-stone-700 dark:text-stone-200
  placeholder-stone-300 dark:placeholder-stone-600
  outline-none focus:border-[#2FAF8F]/50
  transition-colors
`.trim().replace(/\s+/g, ' ')

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-[10.5px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider">
        {label}
      </p>
      <div className="flex flex-col gap-2.5">
        {children}
      </div>
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline gap-1.5">
        <label className="text-[11px] font-medium text-stone-500 dark:text-stone-400">{label}</label>
        {hint && <span className="text-[10px] text-stone-300 dark:text-stone-600">{hint}</span>}
      </div>
      {children}
    </div>
  )
}