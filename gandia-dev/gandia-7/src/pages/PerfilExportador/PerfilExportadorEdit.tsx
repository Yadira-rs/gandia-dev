import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { invalidatePerfilExportadorCache } from './perfilExportadorCache.ts'

// ─── Roles ───
type UserRole =
  | 'director_general'
  | 'dir_operaciones'
  | 'dir_comercial'
  | 'dir_sanidad'
  | 'auditor_inspector'

interface EditPermissions {
  basicInfo: boolean
  operaciones: boolean
  certificaciones: boolean
  kpis: boolean
  equipo: boolean
  proveedores: boolean
  cruces: boolean
  contacto: boolean
}

const ROLE_PERMISSIONS: Record<UserRole, EditPermissions> = {
  director_general: {
    basicInfo: true, operaciones: true, certificaciones: true,
    kpis: true, equipo: true, proveedores: true, cruces: true, contacto: true,
  },
  dir_operaciones: {
    basicInfo: false, operaciones: true, certificaciones: true,
    kpis: true, equipo: false, proveedores: true, cruces: true, contacto: false,
  },
  dir_comercial: {
    basicInfo: false, operaciones: true, certificaciones: false,
    kpis: false, equipo: false, proveedores: true, cruces: false, contacto: true,
  },
  dir_sanidad: {
    basicInfo: false, operaciones: false, certificaciones: true,
    kpis: true, equipo: false, proveedores: false, cruces: false, contacto: false,
  },
  auditor_inspector: {
    basicInfo: false, operaciones: false, certificaciones: true,
    kpis: true, equipo: false, proveedores: false, cruces: false, contacto: false,
  },
}

// ─── Interfaces ───
interface DirectivoItem {
  id: string
  nombre: string
  cargo: string
  email: string
  telefono: string
}

interface ProveedorItem {
  id: string
  nombre: string
  estado: string
  cabezas: string
  clase: 'A' | 'B'
}

interface CruceItem {
  id: string
  ciudad: string
  destino: string
  activo: boolean
}

interface CertItem {
  id: string
  nombre: string
  numero: string
  vencimiento: string
  estado: 'vigente' | 'por-vencer' | 'vencido'
}

interface OperacionItem {
  id: string
  destino: string
  bandera: string
  cabezas: string
  porcentaje: number
  estado: string
}

interface ExportFormData {
  razonSocial: string
  naturaleza: string
  ubicacion: string
  fundacion: string
  rfc: string
  licenciaUSDA: string
  descripcion: string
  empleados: string
  rastrosTIF: string
  corralesConcentracion: string
  telefono: string
  email: string
  sitioWeb: string
  horario: string
  tasaRechazo: string
  cabezasEmbarque: string
  cumplimientoDoc: string
  cabezasAnio: string
  paisesDestino: string
  valorExportado: string
}

// ─── Componente principal ───
function PerfilExportadorEdit() {
  const navigate = useNavigate()
  const [currentUserRole] = useState<UserRole>('director_general')
  const [permissions, setPermissions] = useState<EditPermissions>(ROLE_PERMISSIONS.director_general)
  const [isSaving, setIsSaving] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // Modales
  const [showDirectivoModal, setShowDirectivoModal] = useState(false)
  const [showProveedorModal, setShowProveedorModal] = useState(false)
  const [showCruceModal, setShowCruceModal] = useState(false)
  const [showCertModal, setShowCertModal] = useState(false)
  const [showOperacionModal, setShowOperacionModal] = useState(false)
  const [editingDirectivo, setEditingDirectivo] = useState<DirectivoItem | null>(null)
  const [editingProveedor, setEditingProveedor] = useState<ProveedorItem | null>(null)
  const [editingCruce, setEditingCruce] = useState<CruceItem | null>(null)
  const [editingCert, setEditingCert] = useState<CertItem | null>(null)
  const [editingOperacion, setEditingOperacion] = useState<OperacionItem | null>(null)

  const [formData, setFormData] = useState<ExportFormData>({
    razonSocial: 'Exportadora Ganadera del Norte S.A. de C.V.',
    naturaleza: 'Sociedad Anónima de Capital Variable',
    ubicacion: 'Chihuahua, México',
    fundacion: '2003',
    rfc: 'EGN030822HJ5',
    licenciaUSDA: 'MX-00451',
    descripcion: 'Empresa especializada en la exportación de ganado bovino en pie hacia los mercados de Estados Unidos y Canadá. Con más de 20 años de experiencia, opera bajo estrictos estándares de bienestar animal, sanidad internacional y trazabilidad.',
    empleados: '87',
    rastrosTIF: '3',
    corralesConcentracion: '5',
    telefono: '+52 614 430 8800',
    email: 'ventas@egn-exportadora.mx',
    sitioWeb: 'www.egn-exportadora.mx',
    horario: 'Lun–Vie: 7:00–17:00',
    tasaRechazo: '0.4',
    cabezasEmbarque: '912',
    cumplimientoDoc: '98.7',
    cabezasAnio: '48500',
    paisesDestino: '3',
    valorExportado: '2.1',
  })

  const [equipo, setEquipo] = useState<DirectivoItem[]>([
    { id: '1', nombre: 'Carlos Javier Montes', cargo: 'Director General', email: 'director@egn-exportadora.mx', telefono: '+52 614 111 0001' },
    { id: '2', nombre: 'Ing. Sofía Ríos', cargo: 'Dir. Operaciones', email: 'operaciones@egn-exportadora.mx', telefono: '+52 614 111 0002' },
    { id: '3', nombre: 'Lic. Andrés Frías', cargo: 'Dir. Comercial', email: 'comercial@egn-exportadora.mx', telefono: '+52 614 111 0003' },
    { id: '4', nombre: 'MVZ Karina Salcedo', cargo: 'Dir. Sanidad Animal', email: 'sanidad@egn-exportadora.mx', telefono: '+52 614 111 0004' },
  ])

  const [proveedores, setProveedores] = useState<ProveedorItem[]>([
    { id: '1', nombre: 'Rancho Los Alamos', estado: 'Chihuahua', cabezas: '2,400', clase: 'A' },
    { id: '2', nombre: 'Ganadera del Bravo', estado: 'Chihuahua', cabezas: '3,100', clase: 'A' },
    { id: '3', nombre: 'Rancho El Búfalo Dorado', estado: 'Durango', cabezas: '1,450', clase: 'A' },
    { id: '4', nombre: 'Productores Asociados Norte', estado: 'Sonora', cabezas: '5,200', clase: 'B' },
  ])

  const [cruces, setCruces] = useState<CruceItem[]>([
    { id: '1', ciudad: 'Palomas, Chih.', destino: 'Columbus, NM', activo: true },
    { id: '2', ciudad: 'Cd. Juárez, Chih.', destino: 'El Paso, TX', activo: true },
    { id: '3', ciudad: 'Ojinaga, Chih.', destino: 'Presidio, TX', activo: true },
    { id: '4', ciudad: 'Agua Prieta, Son.', destino: 'Douglas, AZ', activo: true },
  ])

  const [certificaciones, setCertificaciones] = useState<CertItem[]>([
    { id: '1', nombre: 'Licencia USDA / APHIS', numero: 'MX-00451', vencimiento: '2026-12-31', estado: 'vigente' },
    { id: '2', nombre: 'Habilitación SENASICA', numero: 'SEN-2003-0087', vencimiento: '2026-06-30', estado: 'vigente' },
    { id: '3', nombre: 'Certificado Bienestar Animal', numero: 'BA-MX-1142', vencimiento: '2026-09-15', estado: 'vigente' },
    { id: '4', nombre: 'Sistema Trazabilidad SINIIGA', numero: 'TRZ-DGO-0055', vencimiento: 'Permanente', estado: 'vigente' },
    { id: '5', nombre: 'Certificado NOM-051 Bienestar', numero: 'NOM-2025-0312', vencimiento: '2026-03-20', estado: 'por-vencer' },
    { id: '6', nombre: 'Registro CENAPRECE Sanitario', numero: 'CEN-0774-MX', vencimiento: '2025-01-01', estado: 'vencido' },
  ])

  const [operaciones, setOperaciones] = useState<OperacionItem[]>([
    { id: '1', destino: 'Estados Unidos', bandera: '🇺🇸', cabezas: '38,200', porcentaje: 79, estado: 'Activo' },
    { id: '2', destino: 'Canadá', bandera: '🇨🇦', cabezas: '7,400', porcentaje: 15, estado: 'Activo' },
    { id: '3', destino: 'Japón', bandera: '🇯🇵', cabezas: '2,900', porcentaje: 6, estado: 'En Desarrollo' },
  ])

  useEffect(() => { setPermissions(ROLE_PERMISSIONS[currentUserRole]) }, [currentUserRole])
  useEffect(() => { setHasChanges(true) }, [formData, equipo, proveedores, cruces, certificaciones, operaciones])

  const handleInput = (field: keyof ExportFormData, value: string) =>
    setFormData(prev => ({ ...prev, [field]: value }))

  // ── Handlers genéricos ──
  const makeHandlers = <T extends { id: string }>(
    _list: T[], setList: React.Dispatch<React.SetStateAction<T[]>>,
    setEditing: (v: T | null) => void, setModal: (v: boolean) => void,
    emptyItem: T, confirmMsg: string
  ) => ({
    add: () => { setEditing({ ...emptyItem, id: Date.now().toString() }); setModal(true) },
    edit: (item: T) => { setEditing(item); setModal(true) },
    save: (item: T) => {
      setList(prev => prev.find(x => x.id === item.id) ? prev.map(x => x.id === item.id ? item : x) : [...prev, item])
      setModal(false); setEditing(null)
    },
    delete: (id: string) => { if (window.confirm(confirmMsg)) setList(prev => prev.filter(x => x.id !== id)) },
    close: () => { setModal(false); setEditing(null) },
  })

  const equipoH = makeHandlers(equipo, setEquipo, setEditingDirectivo, setShowDirectivoModal,
    { id: '', nombre: '', cargo: '', email: '', telefono: '' }, '¿Eliminar este directivo?')
  const provH = makeHandlers(proveedores, setProveedores, setEditingProveedor, setShowProveedorModal,
    { id: '', nombre: '', estado: '', cabezas: '', clase: 'A' as const }, '¿Eliminar este proveedor?')
  const cruceH = makeHandlers(cruces, setCruces, setEditingCruce, setShowCruceModal,
    { id: '', ciudad: '', destino: '', activo: true }, '¿Eliminar este cruce?')
  const certH = makeHandlers(certificaciones, setCertificaciones, setEditingCert, setShowCertModal,
    { id: '', nombre: '', numero: '', vencimiento: '', estado: 'vigente' as const }, '¿Eliminar esta certificación?')
  const opH = makeHandlers(operaciones, setOperaciones, setEditingOperacion, setShowOperacionModal,
    { id: '', destino: '', bandera: '', cabezas: '', porcentaje: 0, estado: 'Activo' }, '¿Eliminar este destino?')

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const uid = session?.user?.id
      if (!uid) throw new Error('Sin sesión')

      const { error } = await supabase
        .from('exportador_extended_profiles')
        .upsert({
          user_id:                uid,
          razon_social:           formData.razonSocial            || null,
          naturaleza:             formData.naturaleza             || null,
          ubicacion:              formData.ubicacion              || null,
          fundacion:              formData.fundacion              ? parseInt(formData.fundacion)              : null,
          rfc:                    formData.rfc                    || null,
          licencia_usda:          formData.licenciaUSDA           || null,
          descripcion:            formData.descripcion            || null,
          empleados:              formData.empleados              ? parseInt(formData.empleados)              : null,
          rastros_tif:            formData.rastrosTIF             ? parseInt(formData.rastrosTIF)             : null,
          corrales_concentracion: formData.corralesConcentracion  ? parseInt(formData.corralesConcentracion)  : null,
          telefono:               formData.telefono               || null,
          email_contact:          formData.email                  || null,
          sitio_web:              formData.sitioWeb               || null,
          horario:                formData.horario                || null,
          tasa_rechazo:           formData.tasaRechazo            ? parseFloat(formData.tasaRechazo)          : null,
          cabezas_embarque:       formData.cabezasEmbarque        ? parseInt(formData.cabezasEmbarque)        : null,
          cumplimiento_doc:       formData.cumplimientoDoc        ? parseFloat(formData.cumplimientoDoc)      : null,
          cabezas_anio:           formData.cabezasAnio            ? parseInt(formData.cabezasAnio)            : null,
          paises_destino:         formData.paisesDestino          ? parseInt(formData.paisesDestino)          : null,
          valor_exportado:        formData.valorExportado         ? parseFloat(formData.valorExportado)       : null,
          equipo,
          proveedores,
          cruces,
          certificaciones,
          operaciones,
          updated_at:             new Date().toISOString(),
        }, { onConflict: 'user_id' })

      if (error) throw error

      invalidatePerfilExportadorCache()
      setHasChanges(false)
      setShowSuccessModal(true)
      setTimeout(() => { setShowSuccessModal(false); navigate('/perfil') }, 2000)
    } catch (e: unknown) {
      console.error('Error al guardar perfil exportador:', e)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    if (hasChanges) { if (window.confirm('¿Descartar los cambios?')) navigate('/perfil') }
    else navigate('/perfil')
  }

  // ── Colores de estado cert ──
  const certEstadoColor = { vigente: 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400', 'por-vencer': 'bg-[#fef3c7] dark:bg-[#92400e]/20 text-[#b45309] dark:text-[#fcd34d]', vencido: 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400' }
  const certEstadoLabel = { vigente: 'Vigente', 'por-vencer': 'Por Vencer', vencido: 'Vencido' }

  return (
    <div className="h-full overflow-y-auto bg-[#fafaf9] dark:bg-[#0c0a09]">

      {/* ── Sticky Header ── */}
      <div className="sticky top-0 z-20 bg-white/80 dark:bg-[#1c1917]/80 backdrop-blur-xl border-b border-[#e7e5e4] dark:border-[#292524]">
        <div className="px-4 md:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={handleCancel} className="w-10 h-10 rounded-xl bg-[#f5f5f4] dark:bg-[#292524] hover:bg-[#e7e5e4] dark:hover:bg-[#44403c] flex items-center justify-center transition-all">
                <ArrowLeftIcon />
              </button>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-[#1c1917] dark:text-[#fafaf9]">Editar Perfil Exportador</h1>
                <p className="text-sm text-[#78716c] dark:text-[#a8a29e] mt-0.5">
                  Rol: <span className="font-semibold text-[#b45309] dark:text-[#fcd34d]">{getRoleLabel(currentUserRole)}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={handleCancel} className="px-5 py-2.5 rounded-xl border border-[#e7e5e4] dark:border-[#292524] text-[#1c1917] dark:text-[#fafaf9] font-semibold hover:bg-[#f5f5f4] dark:hover:bg-[#292524] transition-all hidden sm:block">
                Cancelar
              </button>
              <button onClick={handleSave} disabled={isSaving || !hasChanges} className="px-5 py-2.5 rounded-xl bg-[#b45309] hover:bg-[#92400e] text-white font-semibold transition-all shadow-lg shadow-[#b45309]/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                {isSaving ? <><SpinnerIcon /><span>Guardando...</span></> : <><SaveIcon /><span>Guardar Cambios</span></>}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Formulario ── */}
      <div className="px-4 md:px-8 py-8 max-w-5xl mx-auto">

        {/* Información Empresarial */}
        <FormSection title="Información Empresarial" icon={<BuildingIcon />} enabled={permissions.basicInfo}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormInput label="Razón Social" value={formData.razonSocial} onChange={v => handleInput('razonSocial', v)} placeholder="Ej: Exportadora Ganadera del Norte S.A. de C.V." enabled={permissions.basicInfo} required />
            <FormInput label="Naturaleza Jurídica" value={formData.naturaleza} onChange={v => handleInput('naturaleza', v)} placeholder="Ej: S.A. de C.V." enabled={permissions.basicInfo} />
            <FormInput label="Ubicación" value={formData.ubicacion} onChange={v => handleInput('ubicacion', v)} placeholder="Ej: Chihuahua, México" enabled={permissions.basicInfo} required />
            <FormInput label="Año de Fundación" value={formData.fundacion} onChange={v => handleInput('fundacion', v)} placeholder="Ej: 2003" enabled={permissions.basicInfo} type="number" />
            <FormInput label="RFC" value={formData.rfc} onChange={v => handleInput('rfc', v)} placeholder="Ej: EGN030822HJ5" enabled={permissions.basicInfo} />
            <FormInput label="Licencia USDA / APHIS" value={formData.licenciaUSDA} onChange={v => handleInput('licenciaUSDA', v)} placeholder="Ej: MX-00451" enabled={permissions.basicInfo} />
            <FormInput label="Número de Empleados" value={formData.empleados} onChange={v => handleInput('empleados', v)} placeholder="Ej: 87" enabled={permissions.basicInfo} type="number" />
            <FormInput label="Rastros TIF Asociados" value={formData.rastrosTIF} onChange={v => handleInput('rastrosTIF', v)} placeholder="Ej: 3" enabled={permissions.basicInfo} type="number" />
            <FormInput label="Corrales de Concentración" value={formData.corralesConcentracion} onChange={v => handleInput('corralesConcentracion', v)} placeholder="Ej: 5" enabled={permissions.basicInfo} type="number" />
          </div>
          <FormTextarea label="Descripción de la Empresa" value={formData.descripcion} onChange={v => handleInput('descripcion', v)} placeholder="Describe las operaciones y especialidad de la empresa..." enabled={permissions.basicInfo} rows={4} />
        </FormSection>

        {/* Destinos de Exportación */}
        <FormSection title="Destinos de Exportación" icon={<GlobeIcon />} enabled={permissions.operaciones}>
          <div className="space-y-3 mb-4">
            {operaciones.map(op => (
              <div key={op.id} className="flex items-center gap-4 p-4 rounded-xl bg-[#f5f5f4] dark:bg-[#292524] border border-[#e7e5e4] dark:border-[#44403c]">
                <span className="text-2xl flex-shrink-0">{op.bandera}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-[#1c1917] dark:text-[#fafaf9]">{op.destino}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${op.estado === 'Activo' ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'bg-[#fef3c7] dark:bg-[#92400e]/20 text-[#b45309] dark:text-[#fcd34d]'}`}>
                      {op.estado}
                    </span>
                  </div>
                  <p className="text-xs text-[#b45309] dark:text-[#fcd34d] font-semibold">{op.cabezas} cab./año · {op.porcentaje}% del volumen</p>
                </div>
                {permissions.operaciones && (
                  <div className="flex gap-2">
                    <IconBtn onClick={() => { setEditingOperacion(op); setShowOperacionModal(true) }} hover="amber"><EditIcon /></IconBtn>
                    <IconBtn onClick={() => opH.delete(op.id)} hover="red"><TrashIcon /></IconBtn>
                  </div>
                )}
              </div>
            ))}
          </div>
          {permissions.operaciones && (
            <AddBtn onClick={() => { setEditingOperacion({ id: Date.now().toString(), destino: '', bandera: '', cabezas: '', porcentaje: 0, estado: 'Activo' }); setShowOperacionModal(true) }} label="Agregar Destino" color="amber" />
          )}

          {/* KPIs operativos */}
          <div className="mt-6 pt-6 border-t border-[#e7e5e4] dark:border-[#292524]">
            <p className="text-sm font-semibold text-[#78716c] dark:text-[#a8a29e] mb-4">Métricas Globales de Exportación</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormInput label="Cabezas / Año" value={formData.cabezasAnio} onChange={v => handleInput('cabezasAnio', v)} placeholder="Ej: 48500" enabled={permissions.operaciones} type="number" />
              <FormInput label="Países Destino" value={formData.paisesDestino} onChange={v => handleInput('paisesDestino', v)} placeholder="Ej: 3" enabled={permissions.operaciones} type="number" />
              <FormInput label="Valor Exportado (M USD)" value={formData.valorExportado} onChange={v => handleInput('valorExportado', v)} placeholder="Ej: 2.1" enabled={permissions.operaciones} type="number" step="0.1" />
            </div>
          </div>
        </FormSection>

        {/* Indicadores Operativos */}
        <FormSection title="Indicadores Operativos" icon={<ChartIcon />} enabled={permissions.kpis}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormInput label="Tasa de Rechazo Frontera (%)" value={formData.tasaRechazo} onChange={v => handleInput('tasaRechazo', v)} placeholder="Ej: 0.4" enabled={permissions.kpis} type="number" step="0.1" helpText="Porcentaje de embarques rechazados en aduana" />
            <FormInput label="Cabezas / Embarque Prom." value={formData.cabezasEmbarque} onChange={v => handleInput('cabezasEmbarque', v)} placeholder="Ej: 912" enabled={permissions.kpis} type="number" helpText="Promedio de animales por embarque" />
            <FormInput label="Cumplimiento Documental (%)" value={formData.cumplimientoDoc} onChange={v => handleInput('cumplimientoDoc', v)} placeholder="Ej: 98.7" enabled={permissions.kpis} type="number" step="0.1" max="100" helpText="Documentación completa y correcta" />
          </div>
        </FormSection>

        {/* Certificaciones */}
        <FormSection title="Certificaciones y Cumplimiento" icon={<BadgeIcon />} enabled={permissions.certificaciones}>
          <div className="space-y-3 mb-4">
            {certificaciones.map(cert => (
              <div key={cert.id} className="flex items-center gap-4 p-4 rounded-xl bg-[#f5f5f4] dark:bg-[#292524] border border-[#e7e5e4] dark:border-[#44403c]">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="text-sm font-bold text-[#1c1917] dark:text-[#fafaf9] truncate">{cert.nombre}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex-shrink-0 ${certEstadoColor[cert.estado]}`}>
                      {certEstadoLabel[cert.estado]}
                    </span>
                  </div>
                  <p className="text-xs text-[#78716c] dark:text-[#a8a29e]">{cert.numero} · Vence: {cert.vencimiento}</p>
                </div>
                {permissions.certificaciones && (
                  <div className="flex gap-2">
                    <IconBtn onClick={() => { setEditingCert(cert); setShowCertModal(true) }} hover="amber"><EditIcon /></IconBtn>
                    <IconBtn onClick={() => certH.delete(cert.id)} hover="red"><TrashIcon /></IconBtn>
                  </div>
                )}
              </div>
            ))}
          </div>
          {permissions.certificaciones && (
            <AddBtn onClick={() => { setEditingCert({ id: Date.now().toString(), nombre: '', numero: '', vencimiento: '', estado: 'vigente' }); setShowCertModal(true) }} label="Agregar Certificación" color="amber" />
          )}
        </FormSection>

        {/* Equipo Directivo */}
        <FormSection title="Equipo Directivo" icon={<UsersIcon />} enabled={permissions.equipo}>
          <div className="space-y-3 mb-4">
            {equipo.map(d => (
              <div key={d.id} className="flex items-center gap-4 p-4 rounded-xl bg-[#f5f5f4] dark:bg-[#292524] border border-[#e7e5e4] dark:border-[#44403c]">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#b45309] to-[#92400e] flex items-center justify-center text-white font-bold flex-shrink-0">
                  {d.nombre.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#1c1917] dark:text-[#fafaf9]">{d.nombre}</p>
                  <p className="text-xs text-[#b45309] dark:text-[#fcd34d] font-semibold">{d.cargo}</p>
                  <p className="text-xs text-[#78716c] dark:text-[#a8a29e]">{d.email}</p>
                </div>
                {permissions.equipo && (
                  <div className="flex gap-2">
                    <IconBtn onClick={() => equipoH.edit(d)} hover="amber"><EditIcon /></IconBtn>
                    <IconBtn onClick={() => equipoH.delete(d.id)} hover="red"><TrashIcon /></IconBtn>
                  </div>
                )}
              </div>
            ))}
          </div>
          {permissions.equipo && (
            <AddBtn onClick={equipoH.add} label="Agregar Directivo" color="amber" />
          )}
        </FormSection>

        {/* Proveedores */}
        <FormSection title="Proveedores Ganaderos" icon={<ProveedoresIcon />} enabled={permissions.proveedores}>
          <div className="space-y-3 mb-4">
            {proveedores.map(p => (
              <div key={p.id} className="flex items-center gap-4 p-4 rounded-xl bg-[#f5f5f4] dark:bg-[#292524] border border-[#e7e5e4] dark:border-[#44403c]">
                <div className="w-2 h-2 rounded-full bg-[#b45309] flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#1c1917] dark:text-[#fafaf9] truncate">{p.nombre}</p>
                  <p className="text-xs text-[#78716c] dark:text-[#a8a29e]">{p.estado} · {p.cabezas} cab.</p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex-shrink-0 ${p.clase === 'A' ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'bg-[#fef3c7] dark:bg-[#92400e]/20 text-[#b45309] dark:text-[#fcd34d]'}`}>
                  Clase {p.clase}
                </span>
                {permissions.proveedores && (
                  <div className="flex gap-2">
                    <IconBtn onClick={() => provH.edit(p)} hover="amber"><EditIcon /></IconBtn>
                    <IconBtn onClick={() => provH.delete(p.id)} hover="red"><TrashIcon /></IconBtn>
                  </div>
                )}
              </div>
            ))}
          </div>
          {permissions.proveedores && (
            <AddBtn onClick={provH.add} label="Agregar Proveedor" color="amber" />
          )}
        </FormSection>

        {/* Cruces Fronterizos */}
        <FormSection title="Cruces Fronterizos" icon={<FronteraIcon />} enabled={permissions.cruces}>
          <div className="space-y-3 mb-4">
            {cruces.map(c => (
              <div key={c.id} className="flex items-center gap-4 p-4 rounded-xl bg-[#f5f5f4] dark:bg-[#292524] border border-[#e7e5e4] dark:border-[#44403c]">
                <div className="w-9 h-9 rounded-lg bg-[#fef3c7] dark:bg-[#92400e]/20 flex items-center justify-center text-[#b45309] flex-shrink-0">
                  <FronteraSmIcon />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#1c1917] dark:text-[#fafaf9] truncate">{c.ciudad}</p>
                  <p className="text-xs text-[#78716c] dark:text-[#a8a29e]">→ {c.destino}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${c.activo ? 'bg-green-500' : 'bg-[#a8a29e]'}`} />
                  <span className="text-xs text-[#78716c] dark:text-[#a8a29e]">{c.activo ? 'Activo' : 'Inactivo'}</span>
                </div>
                {permissions.cruces && (
                  <div className="flex gap-2">
                    <IconBtn onClick={() => cruceH.edit(c)} hover="amber"><EditIcon /></IconBtn>
                    <IconBtn onClick={() => cruceH.delete(c.id)} hover="red"><TrashIcon /></IconBtn>
                  </div>
                )}
              </div>
            ))}
          </div>
          {permissions.cruces && (
            <AddBtn onClick={cruceH.add} label="Agregar Cruce Fronterizo" color="amber" />
          )}
        </FormSection>

        {/* Contacto */}
        <FormSection title="Contacto Empresarial" icon={<PhoneIcon />} enabled={permissions.contacto}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormInput label="Teléfono" value={formData.telefono} onChange={v => handleInput('telefono', v)} placeholder="+52 614 430 8800" enabled={permissions.contacto} type="tel" />
            <FormInput label="Email Comercial" value={formData.email} onChange={v => handleInput('email', v)} placeholder="ventas@empresa.mx" enabled={permissions.contacto} type="email" />
            <FormInput label="Sitio Web" value={formData.sitioWeb} onChange={v => handleInput('sitioWeb', v)} placeholder="www.empresa.mx" enabled={permissions.contacto} />
            <FormInput label="Horario de Atención" value={formData.horario} onChange={v => handleInput('horario', v)} placeholder="Lun–Vie: 7:00–17:00" enabled={permissions.contacto} />
          </div>
        </FormSection>

        {/* Banner permisos */}
        <div className="mt-8 p-6 rounded-2xl bg-[#fef3c7] dark:bg-[#92400e]/10 border border-[#fde68a] dark:border-[#92400e]/30">
          <div className="flex gap-4">
            <div className="text-[#b45309] dark:text-[#fcd34d] flex-shrink-0 mt-0.5"><InfoIconSolid /></div>
            <div>
              <h4 className="text-sm font-bold text-[#92400e] dark:text-[#fcd34d] mb-1">Permisos de Edición</h4>
              <p className="text-sm text-[#b45309] dark:text-[#fcd34d]/80">
                Como <span className="font-semibold">{getRoleLabel(currentUserRole)}</span>, puedes editar:{' '}
                {getEnabledSections(permissions).join(', ')}.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Modales ── */}

      {showDirectivoModal && editingDirectivo && (
        <GenericModal title={editingDirectivo.nombre ? 'Editar Directivo' : 'Agregar Directivo'} onClose={equipoH.close} onSave={() => equipoH.save(editingDirectivo)}>
          <FormInput label="Nombre Completo" value={editingDirectivo.nombre} onChange={v => setEditingDirectivo({ ...editingDirectivo, nombre: v })} placeholder="Ej: Carlos Javier Montes" enabled required />
          <FormInput label="Cargo" value={editingDirectivo.cargo} onChange={v => setEditingDirectivo({ ...editingDirectivo, cargo: v })} placeholder="Ej: Director General" enabled required />
          <FormInput label="Email" value={editingDirectivo.email} onChange={v => setEditingDirectivo({ ...editingDirectivo, email: v })} placeholder="director@empresa.mx" enabled type="email" />
          <FormInput label="Teléfono" value={editingDirectivo.telefono} onChange={v => setEditingDirectivo({ ...editingDirectivo, telefono: v })} placeholder="+52 614 111 0001" enabled type="tel" />
        </GenericModal>
      )}

      {showProveedorModal && editingProveedor && (
        <GenericModal title={editingProveedor.nombre ? 'Editar Proveedor' : 'Agregar Proveedor'} onClose={provH.close} onSave={() => provH.save(editingProveedor)}>
          <FormInput label="Nombre del Rancho / Empresa" value={editingProveedor.nombre} onChange={v => setEditingProveedor({ ...editingProveedor, nombre: v })} placeholder="Ej: Rancho Los Alamos" enabled required />
          <FormInput label="Estado" value={editingProveedor.estado} onChange={v => setEditingProveedor({ ...editingProveedor, estado: v })} placeholder="Ej: Chihuahua" enabled />
          <FormInput label="Cabezas de Ganado" value={editingProveedor.cabezas} onChange={v => setEditingProveedor({ ...editingProveedor, cabezas: v })} placeholder="Ej: 2,400" enabled />
          <div>
            <label className="block text-sm font-semibold text-[#1c1917] dark:text-[#fafaf9] mb-2">Clasificación</label>
            <select value={editingProveedor.clase} onChange={e => setEditingProveedor({ ...editingProveedor, clase: e.target.value as 'A' | 'B' })}
              className="w-full px-4 py-3 rounded-xl border border-[#e7e5e4] dark:border-[#292524] bg-white dark:bg-[#1c1917] text-[#1c1917] dark:text-[#fafaf9] focus:outline-none focus:ring-2 focus:ring-[#b45309] transition-all">
              <option value="A">Clase A — Proveedor Certificado</option>
              <option value="B">Clase B — Proveedor en Proceso</option>
            </select>
          </div>
        </GenericModal>
      )}

      {showCruceModal && editingCruce && (
        <GenericModal title={editingCruce.ciudad ? 'Editar Cruce' : 'Agregar Cruce Fronterizo'} onClose={cruceH.close} onSave={() => cruceH.save(editingCruce)}>
          <FormInput label="Ciudad de Origen (México)" value={editingCruce.ciudad} onChange={v => setEditingCruce({ ...editingCruce, ciudad: v })} placeholder="Ej: Cd. Juárez, Chih." enabled required />
          <FormInput label="Ciudad de Destino (EUA)" value={editingCruce.destino} onChange={v => setEditingCruce({ ...editingCruce, destino: v })} placeholder="Ej: El Paso, TX" enabled />
          <div className="flex items-center gap-3 p-4 rounded-xl bg-[#f5f5f4] dark:bg-[#292524]">
            <input type="checkbox" id="cruceActivo" checked={editingCruce.activo} onChange={e => setEditingCruce({ ...editingCruce, activo: e.target.checked })}
              className="w-4 h-4 accent-[#b45309]" />
            <label htmlFor="cruceActivo" className="text-sm font-semibold text-[#1c1917] dark:text-[#fafaf9]">Cruce actualmente operativo</label>
          </div>
        </GenericModal>
      )}

      {showCertModal && editingCert && (
        <GenericModal title={editingCert.nombre ? 'Editar Certificación' : 'Agregar Certificación'} onClose={certH.close} onSave={() => certH.save(editingCert)}>
          <FormInput label="Nombre de la Certificación" value={editingCert.nombre} onChange={v => setEditingCert({ ...editingCert, nombre: v })} placeholder="Ej: Licencia USDA / APHIS" enabled required />
          <FormInput label="Número / Folio" value={editingCert.numero} onChange={v => setEditingCert({ ...editingCert, numero: v })} placeholder="Ej: MX-00451" enabled />
          <FormInput label="Fecha de Vencimiento" value={editingCert.vencimiento} onChange={v => setEditingCert({ ...editingCert, vencimiento: v })} placeholder="Ej: 2026-12-31" enabled type="date" />
          <div>
            <label className="block text-sm font-semibold text-[#1c1917] dark:text-[#fafaf9] mb-2">Estado</label>
            <select value={editingCert.estado} onChange={e => setEditingCert({ ...editingCert, estado: e.target.value as CertItem['estado'] })}
              className="w-full px-4 py-3 rounded-xl border border-[#e7e5e4] dark:border-[#292524] bg-white dark:bg-[#1c1917] text-[#1c1917] dark:text-[#fafaf9] focus:outline-none focus:ring-2 focus:ring-[#b45309] transition-all">
              <option value="vigente">Vigente</option>
              <option value="por-vencer">Por Vencer</option>
              <option value="vencido">Vencido</option>
            </select>
          </div>
        </GenericModal>
      )}

      {showOperacionModal && editingOperacion && (
        <GenericModal title={editingOperacion.destino ? 'Editar Destino' : 'Agregar Destino de Exportación'} onClose={opH.close} onSave={() => opH.save(editingOperacion)}>
          <FormInput label="País Destino" value={editingOperacion.destino} onChange={v => setEditingOperacion({ ...editingOperacion, destino: v })} placeholder="Ej: Estados Unidos" enabled required />
          <FormInput label="Bandera (emoji)" value={editingOperacion.bandera} onChange={v => setEditingOperacion({ ...editingOperacion, bandera: v })} placeholder="Ej: 🇺🇸" enabled helpText="Pega el emoji de la bandera del país" />
          <FormInput label="Cabezas / Año" value={editingOperacion.cabezas} onChange={v => setEditingOperacion({ ...editingOperacion, cabezas: v })} placeholder="Ej: 38,200" enabled />
          <FormInput label="Porcentaje del Volumen (%)" value={String(editingOperacion.porcentaje)} onChange={v => setEditingOperacion({ ...editingOperacion, porcentaje: Number(v) })} placeholder="Ej: 79" enabled type="number" max="100" />
          <div>
            <label className="block text-sm font-semibold text-[#1c1917] dark:text-[#fafaf9] mb-2">Estado</label>
            <select value={editingOperacion.estado} onChange={e => setEditingOperacion({ ...editingOperacion, estado: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-[#e7e5e4] dark:border-[#292524] bg-white dark:bg-[#1c1917] text-[#1c1917] dark:text-[#fafaf9] focus:outline-none focus:ring-2 focus:ring-[#b45309] transition-all">
              <option value="Activo">Activo</option>
              <option value="En Desarrollo">En Desarrollo</option>
              <option value="Suspendido">Suspendido</option>
            </select>
          </div>
        </GenericModal>
      )}

      {/* Modal éxito */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1c1917] rounded-2xl p-8 shadow-2xl max-w-md mx-4 text-center">
            <div className="w-16 h-16 rounded-full bg-[#fef3c7] dark:bg-[#92400e]/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircleIcon />
            </div>
            <h3 className="text-xl font-bold text-[#1c1917] dark:text-[#fafaf9] mb-2">¡Cambios Guardados!</h3>
            <p className="text-sm text-[#78716c] dark:text-[#a8a29e]">El perfil exportador ha sido actualizado exitosamente</p>
          </div>
        </div>
      )}
    </div>
  )
}

/* ────────────── COMPONENTES AUXILIARES ────────────── */

function FormSection({ title, icon, enabled, children }: {
  title: string; icon: React.ReactNode; enabled: boolean; children: React.ReactNode
}) {
  return (
    <div className={`mb-8 ${!enabled ? 'opacity-50' : ''}`}>
      <div className="bg-white dark:bg-[#1c1917] rounded-2xl border border-[#e7e5e4] dark:border-[#292524] p-6 md:p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${enabled ? 'bg-[#fef3c7] dark:bg-[#92400e]/20 text-[#b45309] dark:text-[#fcd34d]' : 'bg-[#f5f5f4] dark:bg-[#292524] text-[#78716c] dark:text-[#a8a29e]'}`}>
            {icon}
          </div>
          <div className="flex-1">
            <h3 className="text-lg md:text-xl font-bold text-[#1c1917] dark:text-[#fafaf9]">{title}</h3>
            {!enabled && <p className="text-xs text-[#78716c] dark:text-[#a8a29e] mt-0.5">No tienes permisos para editar esta sección</p>}
          </div>
          {!enabled && <LockIcon />}
        </div>
        <div className={!enabled ? 'pointer-events-none' : ''}>{children}</div>
      </div>
    </div>
  )
}

function FormInput({ label, value, onChange, placeholder, enabled, type = 'text', step, max, required = false, helpText }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; enabled: boolean;
  type?: string; step?: string; max?: string; required?: boolean; helpText?: string
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-[#1c1917] dark:text-[#fafaf9] mb-2">
        {label}{required && <span className="text-[#ef4444] ml-1">*</span>}
      </label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        disabled={!enabled} step={step} max={max}
        className="w-full px-4 py-3 rounded-xl border border-[#e7e5e4] dark:border-[#292524] bg-white dark:bg-[#1c1917] text-[#1c1917] dark:text-[#fafaf9] placeholder-[#a8a29e] focus:outline-none focus:ring-2 focus:ring-[#b45309] focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed" />
      {helpText && <p className="text-xs text-[#78716c] dark:text-[#a8a29e] mt-1.5">{helpText}</p>}
    </div>
  )
}

function FormTextarea({ label, value, onChange, placeholder, enabled, rows = 3 }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; enabled: boolean; rows?: number
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-[#1c1917] dark:text-[#fafaf9] mb-2">{label}</label>
      <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        disabled={!enabled} rows={rows}
        className="w-full px-4 py-3 rounded-xl border border-[#e7e5e4] dark:border-[#292524] bg-white dark:bg-[#1c1917] text-[#1c1917] dark:text-[#fafaf9] placeholder-[#a8a29e] focus:outline-none focus:ring-2 focus:ring-[#b45309] focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed resize-none" />
    </div>
  )
}

function GenericModal({ title, children, onSave, onClose }: {
  title: string; children: React.ReactNode; onSave: () => void; onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#1c1917] rounded-2xl p-6 md:p-8 shadow-2xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold text-[#1c1917] dark:text-[#fafaf9] mb-6">{title}</h3>
        <div className="space-y-4">{children}</div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 px-5 py-3 rounded-xl border border-[#e7e5e4] dark:border-[#292524] text-[#1c1917] dark:text-[#fafaf9] font-semibold hover:bg-[#f5f5f4] dark:hover:bg-[#292524] transition-all">Cancelar</button>
          <button onClick={onSave} className="flex-1 px-5 py-3 rounded-xl bg-[#b45309] hover:bg-[#92400e] text-white font-semibold transition-all">Guardar</button>
        </div>
      </div>
    </div>
  )
}

function IconBtn({ children, onClick, hover }: { children: React.ReactNode; onClick: () => void; hover: 'amber' | 'red' }) {
  const hoverClass = hover === 'amber'
    ? 'hover:text-[#b45309] hover:border-[#b45309]'
    : 'hover:text-[#ef4444] hover:border-[#ef4444]'
  return (
    <button onClick={onClick} className={`w-8 h-8 rounded-lg bg-white dark:bg-[#1c1917] border border-[#e7e5e4] dark:border-[#292524] flex items-center justify-center text-[#78716c] dark:text-[#a8a29e] ${hoverClass} transition-all`}>
      {children}
    </button>
  )
}

function AddBtn({ onClick, label }: { onClick: () => void; label: string; color?: 'amber' }) {
  return (
    <button onClick={onClick} className="w-full py-3 px-4 rounded-xl border-2 border-dashed border-[#e7e5e4] dark:border-[#292524] hover:border-[#b45309] dark:hover:border-[#b45309] text-[#78716c] dark:text-[#a8a29e] hover:text-[#b45309] dark:hover:text-[#fcd34d] font-semibold transition-all flex items-center justify-center gap-2">
      <PlusIcon />{label}
    </button>
  )
}

/* ────────────── HELPERS ────────────── */

function getRoleLabel(role: UserRole): string {
  const l: Record<UserRole, string> = {
    director_general: 'Director General',
    dir_operaciones: 'Director de Operaciones',
    dir_comercial: 'Director Comercial',
    dir_sanidad: 'Director de Sanidad Animal',
    auditor_inspector: 'Auditor / Inspector',
  }
  return l[role]
}

function getEnabledSections(p: EditPermissions): string[] {
  const map: Array<[keyof EditPermissions, string]> = [
    ['basicInfo', 'Información Empresarial'],
    ['operaciones', 'Destinos y Operaciones'],
    ['kpis', 'Indicadores Operativos'],
    ['certificaciones', 'Certificaciones'],
    ['equipo', 'Equipo Directivo'],
    ['proveedores', 'Proveedores'],
    ['cruces', 'Cruces Fronterizos'],
    ['contacto', 'Contacto'],
  ]
  return map.filter(([k]) => p[k]).map(([, v]) => v)
}

/* ────────────── ICONS ────────────── */

const ArrowLeftIcon = () => <svg className="w-5 h-5 text-[#78716c] dark:text-[#a8a29e]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
const SaveIcon = () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>
const SpinnerIcon = () => <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle className="opacity-25" cx="12" cy="12" r="10" /><path className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
const BuildingIcon = () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="2" width="16" height="20" rx="2" /><path d="M9 22v-4h6v4" /><path d="M8 6h.01" /><path d="M16 6h.01" /><path d="M12 6h.01" /><path d="M12 10h.01" /></svg>
const GlobeIcon = () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
const ChartIcon = () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>
const BadgeIcon = () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
const UsersIcon = () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
const ProveedoresIcon = () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /></svg>
const FronteraIcon = () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" /><line x1="8" y1="2" x2="8" y2="18" /><line x1="16" y1="6" x2="16" y2="22" /></svg>
const FronteraSmIcon = () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="5 12 19 12" /><polyline points="13 6 19 12 13 18" /></svg>
const PhoneIcon = () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
const EditIcon = () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
const TrashIcon = () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
const PlusIcon = () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
const LockIcon = () => <svg className="w-5 h-5 text-[#78716c] dark:text-[#a8a29e]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
const CheckCircleIcon = () => <svg className="w-10 h-10 text-[#b45309]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
const InfoIconSolid = () => <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" /></svg>

export default PerfilExportadorEdit