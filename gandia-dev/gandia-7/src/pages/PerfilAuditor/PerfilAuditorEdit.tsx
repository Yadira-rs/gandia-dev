import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { invalidatePerfilAuditorCache } from './perfilAuditorCache'

type UserRole = 'auditor_titular' | 'auditor_adjunto' | 'admin_senasica' | 'supervisor_regional'

interface EditPermissions {
  basicInfo: boolean; ambito: boolean; auditorias: boolean; dictamenes: boolean
  normativas: boolean; acreditaciones: boolean; indicadores: boolean; contacto: boolean
}

const ROLE_PERMISSIONS: Record<UserRole, EditPermissions> = {
  auditor_titular:    { basicInfo: true,  ambito: true,  auditorias: true,  dictamenes: true,  normativas: true,  acreditaciones: true,  indicadores: true,  contacto: true  },
  auditor_adjunto:    { basicInfo: false, ambito: true,  auditorias: true,  dictamenes: false, normativas: false, acreditaciones: false, indicadores: false, contacto: false },
  admin_senasica:     { basicInfo: true,  ambito: false, auditorias: false, dictamenes: false, normativas: true,  acreditaciones: true,  indicadores: true,  contacto: true  },
  supervisor_regional:{ basicInfo: false, ambito: true,  auditorias: true,  dictamenes: true,  normativas: false, acreditaciones: false, indicadores: true,  contacto: false },
}

interface AmbitoItem     { id: string; title: string; description: string; nivel: 'Federal' | 'Internacional' }
interface AuditoriaItem  { id: string; nombre: string; tipo: string; fecha: string; resultado: 'aprobado' | 'observaciones' | 'suspendido'; puntuacion: string }
interface DictamenItem   { id: string; folio: string; titulo: string; tipo: string; fecha: string; estado: 'favorable' | 'observaciones' | 'desfavorable' }
interface NormativaItem  { id: string; clave: string; desc: string }
interface AcredItem      { id: string; nombre: string; vence: string; estado: 'vigente' | 'por-vencer' | 'vencido' }

interface AuditorFormData {
  nombre: string; titulo: string; ubicacion: string; registroSenasica: string
  organizacion: string; aniosExp: string; descripcion: string
  telefono: string; email: string; sitioWeb: string; horario: string
  auditoriasRealizadas: string; cumplimientoProm: string; estadosCubiertos: string
  auditsMes: string; auditoriasAprobadas: string; dictamenesSinApelacion: string
  certsExportOK: string; dictamenesTotal: string
}

function PerfilAuditorEdit() {
  const navigate = useNavigate()
  const [currentUserRole] = useState<UserRole>('auditor_titular')
  const [permissions, setPermissions] = useState<EditPermissions>(ROLE_PERMISSIONS.auditor_titular)
  const [isSaving, setIsSaving] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  const [showAmbitoModal,    setShowAmbitoModal]    = useState(false)
  const [showAuditoriaModal, setShowAuditoriaModal] = useState(false)
  const [showDictamenModal,  setShowDictamenModal]  = useState(false)
  const [showNormativaModal, setShowNormativaModal] = useState(false)
  const [showAcredModal,     setShowAcredModal]     = useState(false)

  const [editingAmbito,    setEditingAmbito]    = useState<AmbitoItem | null>(null)
  const [editingAuditoria, setEditingAuditoria] = useState<AuditoriaItem | null>(null)
  const [editingDictamen,  setEditingDictamen]  = useState<DictamenItem | null>(null)
  const [editingNormativa, setEditingNormativa] = useState<NormativaItem | null>(null)
  const [editingAcred,     setEditingAcred]     = useState<AcredItem | null>(null)

  const [formData, setFormData] = useState<AuditorFormData>({
    nombre: 'Ing. Fernanda Cisneros Leal', titulo: 'Auditora e Inspectora Oficial',
    ubicacion: 'Monterrey, Nuevo León', registroSenasica: 'AUD-2009-0312',
    organizacion: 'SENASICA / SAGARPA', aniosExp: '15',
    descripcion: 'Auditora e Inspectora oficial certificada ante SENASICA, especializada en verificación de rastros TIF, bienestar animal en transporte y corrales de exportación, trazabilidad ganadera y cumplimiento de normativas internacionales para la exportación de ganado bovino en pie.',
    telefono: '+52 81 8358 2200', email: 'f.cisneros@senasica.gob.mx',
    sitioWeb: 'www.gob.mx/senasica', horario: 'Lun–Vie: 8:00–15:00',
    auditoriasRealizadas: '620', cumplimientoProm: '94', estadosCubiertos: '18',
    auditsMes: '14', auditoriasAprobadas: '82', dictamenesSinApelacion: '91',
    certsExportOK: '99', dictamenesTotal: '620',
  })

  const [ambitos, setAmbitos] = useState<AmbitoItem[]>([
    { id: '1', title: 'Rastros TIF',               description: 'Verificación de instalaciones, procesos de sacrificio, higiene y cumplimiento de NOM-033', nivel: 'Federal' },
    { id: '2', title: 'Transporte y Bienestar',     description: 'Inspección de vehículos, densidad de carga, agua, alimento y condición animal en tránsito', nivel: 'Federal' },
    { id: '3', title: 'Corrales de Exportación',    description: 'Habilitación y verificación de corrales de concentración y cuarentena para exportación a EUA', nivel: 'Internacional' },
    { id: '4', title: 'Trazabilidad SINIIGA',       description: 'Auditoría de registros de aretes, movimientos, declaraciones y consistencia de inventarios', nivel: 'Federal' },
    { id: '5', title: 'Sanidad e Inocuidad',        description: 'Campañas zoosanitarias, muestreos serológicos y cumplimiento de programas de salud animal', nivel: 'Federal' },
    { id: '6', title: 'Certificación para Exportación', description: 'Emisión de certificados zoosanitarios internacionales y revisión pre-embarque en fronteras', nivel: 'Internacional' },
  ])

  const [auditorias, setAuditorias] = useState<AuditoriaItem[]>([
    { id: '1', nombre: 'Rastro TIF El Norte',      tipo: 'Rastro TIF',      fecha: '2026-02-10', resultado: 'aprobado',      puntuacion: '96/100' },
    { id: '2', nombre: 'Corrales Export. Juárez',  tipo: 'Corral Export.',  fecha: '2026-02-05', resultado: 'aprobado',      puntuacion: '91/100' },
    { id: '3', nombre: 'Ganadera del Bravo S.A.',  tipo: 'Trazabilidad',    fecha: '2026-01-28', resultado: 'observaciones', puntuacion: '78/100' },
    { id: '4', nombre: 'Exportadora Norte S.A.',   tipo: 'Bienestar Animal',fecha: '2026-01-20', resultado: 'aprobado',      puntuacion: '88/100' },
    { id: '5', nombre: 'Rancho Los Alamos',        tipo: 'Sanidad',         fecha: '2026-01-12', resultado: 'suspendido',    puntuacion: '52/100' },
  ])

  const [dictamenes, setDictamenes] = useState<DictamenItem[]>([
    { id: '1', folio: 'DIC-2026-0089', titulo: 'Dictamen de Habilitación — Corrales de Exportación Juárez',        tipo: 'Habilitación',      fecha: '2026-02-07', estado: 'favorable'    },
    { id: '2', folio: 'DIC-2026-0081', titulo: 'Informe de No Conformidad — Ganadera del Bravo (Trazabilidad)',    tipo: 'No Conformidad',    fecha: '2026-01-29', estado: 'observaciones' },
    { id: '3', folio: 'DIC-2026-0074', titulo: 'Dictamen de Suspensión — Rancho Los Alamos (Sanidad)',             tipo: 'Suspensión',        fecha: '2026-01-13', estado: 'desfavorable'  },
    { id: '4', folio: 'DIC-2026-0068', titulo: 'Certificado Zoosanitario Internacional — Lote ENV-2026-0231',      tipo: 'Certificado Export.',fecha: '2026-01-09', estado: 'favorable'    },
  ])

  const [normativas, setNormativas] = useState<NormativaItem[]>([
    { id: '1', clave: 'NOM-033-SAG/ZOO',  desc: 'Sacrificio humanitario de animales domésticos y silvestres' },
    { id: '2', clave: 'NOM-051-ZOO',      desc: 'Trato humanitario en movilización de animales' },
    { id: '3', clave: 'NOM-059-ZOO',      desc: 'Especificaciones para importación y exportación de animales' },
    { id: '4', clave: 'NOM-009-ZOO',      desc: 'Proceso sanitario de la carne' },
    { id: '5', clave: 'CFR 9 Part 93',    desc: 'USDA — Importación de animales vivos a Estados Unidos' },
    { id: '6', clave: 'SINIIGA / SAGARPA',desc: 'Sistema Nacional de Identificación Individual del Ganado' },
    { id: '7', clave: 'NOM-030-ZOO',      desc: 'Especificaciones y características de aretes de identificación' },
    { id: '8', clave: 'OIE Código Terrestre', desc: 'Normas internacionales de sanidad y bienestar animal' },
  ])

  const [acreditaciones, setAcreditaciones] = useState<AcredItem[]>([
    { id: '1', nombre: 'SENASICA — Auditora Oficial',       vence: 'Jun 2027', estado: 'vigente'    },
    { id: '2', nombre: 'Inspector Tipo Federal',            vence: 'Dic 2026', estado: 'vigente'    },
    { id: '3', nombre: 'Certificador USDA / APHIS',         vence: 'Mar 2026', estado: 'por-vencer' },
    { id: '4', nombre: 'OIE — Delegado Técnico MX',         vence: 'Ene 2027', estado: 'vigente'    },
    { id: '5', nombre: 'Acreditación NOM-033 Oficial',      vence: 'Ago 2026', estado: 'vigente'    },
  ])

  useEffect(() => { setPermissions(ROLE_PERMISSIONS[currentUserRole]) }, [currentUserRole])
  useEffect(() => { setHasChanges(true) }, [formData, ambitos, auditorias, dictamenes, normativas, acreditaciones])

  const handleInput = (field: keyof AuditorFormData, value: string) =>
    setFormData(prev => ({ ...prev, [field]: value }))

  const makeHandlers = <T extends { id: string }>(
    setList: React.Dispatch<React.SetStateAction<T[]>>,
    setEditing: (v: T | null) => void,
    setModal: (v: boolean) => void,
    emptyItem: T, confirmMsg: string
  ) => ({
    add:    ()        => { setEditing({ ...emptyItem, id: Date.now().toString() }); setModal(true) },
    edit:   (item: T) => { setEditing(item); setModal(true) },
    save:   (item: T) => {
      setList(prev => prev.find(x => x.id === item.id) ? prev.map(x => x.id === item.id ? item : x) : [...prev, item])
      setModal(false); setEditing(null)
    },
    delete: (id: string) => { if (window.confirm(confirmMsg)) setList(prev => prev.filter(x => x.id !== id)) },
    close:  ()           => { setModal(false); setEditing(null) },
  })

  const ambitoH = makeHandlers<AmbitoItem>(setAmbitos, setEditingAmbito, setShowAmbitoModal,
    { id: '', title: '', description: '', nivel: 'Federal' }, '¿Eliminar este ámbito?')
  const audH = makeHandlers<AuditoriaItem>(setAuditorias, setEditingAuditoria, setShowAuditoriaModal,
    { id: '', nombre: '', tipo: '', fecha: '', resultado: 'aprobado', puntuacion: '' }, '¿Eliminar esta auditoría?')
  const dictH = makeHandlers<DictamenItem>(setDictamenes, setEditingDictamen, setShowDictamenModal,
    { id: '', folio: '', titulo: '', tipo: '', fecha: '', estado: 'favorable' }, '¿Eliminar este dictamen?')
  const normH = makeHandlers<NormativaItem>(setNormativas, setEditingNormativa, setShowNormativaModal,
    { id: '', clave: '', desc: '' }, '¿Eliminar esta normativa?')
  const acredH = makeHandlers<AcredItem>(setAcreditaciones, setEditingAcred, setShowAcredModal,
    { id: '', nombre: '', vence: '', estado: 'vigente' }, '¿Eliminar esta acreditación?')

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const uid = session?.user?.id
      if (!uid) throw new Error('Sin sesión')

      const { error } = await supabase
        .from('auditor_extended_profiles')
        .upsert({
          user_id:                  uid,
          titulo:                   formData.titulo                   || null,
          ubicacion:                formData.ubicacion                || null,
          registro_senasica:        formData.registroSenasica         || null,
          organizacion:             formData.organizacion             || null,
          anios_exp:                formData.aniosExp                 ? parseInt(formData.aniosExp)                 : null,
          descripcion:              formData.descripcion              || null,
          telefono:                 formData.telefono                 || null,
          email_contact:            formData.email                    || null,
          sitio_web:                formData.sitioWeb                 || null,
          horario:                  formData.horario                  || null,
          auditorias_realizadas:    formData.auditoriasRealizadas     ? parseInt(formData.auditoriasRealizadas)     : null,
          cumplimiento_prom:        formData.cumplimientoProm         ? parseFloat(formData.cumplimientoProm)       : null,
          estados_cubiertos:        formData.estadosCubiertos         ? parseInt(formData.estadosCubiertos)         : null,
          audits_mes:               formData.auditsMes                ? parseInt(formData.auditsMes)                : null,
          auditorias_aprobadas:     formData.auditoriasAprobadas      ? parseInt(formData.auditoriasAprobadas)      : null,
          dictamenes_sin_apelacion: formData.dictamenesSinApelacion   ? parseInt(formData.dictamenesSinApelacion)   : null,
          certs_export_ok:          formData.certsExportOK            ? parseInt(formData.certsExportOK)            : null,
          dictamenes_total:         formData.dictamenesTotal          ? parseInt(formData.dictamenesTotal)          : null,
          ambitos,
          auditorias,
          dictamenes,
          normativas,
          acreditaciones,
          updated_at:               new Date().toISOString(),
        }, { onConflict: 'user_id' })

      if (error) throw error

      invalidatePerfilAuditorCache()
      setHasChanges(false)
      setShowSuccessModal(true)
      setTimeout(() => { setShowSuccessModal(false); navigate('/perfil') }, 2000)
    } catch (e: unknown) {
      console.error('Error al guardar perfil auditor:', e)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    if (hasChanges) { if (window.confirm('¿Descartar los cambios?')) navigate('/perfil') }
    else navigate('/perfil')
  }

  const resultadoColor = {
    aprobado:      'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400',
    observaciones: 'bg-[#fef3c7] dark:bg-[#92400e]/20 text-[#b45309] dark:text-[#fcd34d]',
    suspendido:    'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400',
  }
  const resultadoLabel = { aprobado: 'Aprobado', observaciones: 'Observaciones', suspendido: 'Suspendido' }

  const estadoColor = {
    favorable:     'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400',
    observaciones: 'bg-[#fef3c7] dark:bg-[#92400e]/20 text-[#b45309] dark:text-[#fcd34d]',
    desfavorable:  'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400',
  }
  const estadoLabel = { favorable: 'Favorable', observaciones: 'Observaciones', desfavorable: 'Desfavorable' }

  const acredColor = {
    vigente:      'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400',
    'por-vencer': 'bg-[#fef3c7] dark:bg-[#92400e]/20 text-[#b45309] dark:text-[#fcd34d]',
    vencido:      'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400',
  }
  const acredLabel = { vigente: 'Vigente', 'por-vencer': 'Por Vencer', vencido: 'Vencido' }

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
                <h1 className="text-xl md:text-2xl font-bold text-[#1c1917] dark:text-[#fafaf9]">Editar Perfil Auditor</h1>
                <p className="text-sm text-[#78716c] dark:text-[#a8a29e] mt-0.5">
                  Rol: <span className="font-semibold text-[#6d28d9] dark:text-[#c4b5fd]">{getRoleLabel(currentUserRole)}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={handleCancel} className="px-5 py-2.5 rounded-xl border border-[#e7e5e4] dark:border-[#292524] text-[#1c1917] dark:text-[#fafaf9] font-semibold hover:bg-[#f5f5f4] dark:hover:bg-[#292524] transition-all hidden sm:block">
                Cancelar
              </button>
              <button onClick={handleSave} disabled={isSaving || !hasChanges} className="px-5 py-2.5 rounded-xl bg-[#6d28d9] hover:bg-[#4c1d95] text-white font-semibold transition-all shadow-lg shadow-[#6d28d9]/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                {isSaving ? <><SpinnerIcon /><span>Guardando...</span></> : <><SaveIcon /><span>Guardar Cambios</span></>}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Formulario ── */}
      <div className="px-4 md:px-8 py-8 max-w-5xl mx-auto">

        {/* Información Personal */}
        <FormSection title="Información Personal" icon={<PersonIcon />} enabled={permissions.basicInfo}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormInput label="Nombre Completo" value={formData.nombre} onChange={v => handleInput('nombre', v)} placeholder="Ej: Ing. Fernanda Cisneros Leal" enabled={permissions.basicInfo} required />
            <FormInput label="Título / Cargo" value={formData.titulo} onChange={v => handleInput('titulo', v)} placeholder="Ej: Auditora e Inspectora Oficial" enabled={permissions.basicInfo} />
            <FormInput label="Ubicación" value={formData.ubicacion} onChange={v => handleInput('ubicacion', v)} placeholder="Ej: Monterrey, Nuevo León" enabled={permissions.basicInfo} required />
            <FormInput label="Registro SENASICA" value={formData.registroSenasica} onChange={v => handleInput('registroSenasica', v)} placeholder="Ej: AUD-2009-0312" enabled={permissions.basicInfo} />
            <FormInput label="Organización / Dependencia" value={formData.organizacion} onChange={v => handleInput('organizacion', v)} placeholder="Ej: SENASICA / SAGARPA" enabled={permissions.basicInfo} />
            <FormInput label="Años de Ejercicio" value={formData.aniosExp} onChange={v => handleInput('aniosExp', v)} placeholder="Ej: 15" enabled={permissions.basicInfo} type="number" />
          </div>
          <FormTextarea label="Descripción del Perfil" value={formData.descripcion} onChange={v => handleInput('descripcion', v)} placeholder="Describe tu especialización y ámbito de actuación..." enabled={permissions.basicInfo} rows={4} />
        </FormSection>

        {/* Ámbito de Inspección */}
        <FormSection title="Ámbito de Inspección" icon={<AmbitoIcon />} enabled={permissions.ambito}>
          <div className="space-y-3 mb-4">
            {ambitos.map(a => (
              <div key={a.id} className="flex items-center gap-4 p-4 rounded-xl bg-[#f5f5f4] dark:bg-[#292524] border border-[#e7e5e4] dark:border-[#44403c]">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-bold text-[#1c1917] dark:text-[#fafaf9] truncate">{a.title}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex-shrink-0 ${a.nivel === 'Internacional' ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' : 'bg-[#ede9fe] dark:bg-[#4c1d95]/20 text-[#6d28d9] dark:text-[#c4b5fd]'}`}>
                      {a.nivel}
                    </span>
                  </div>
                  <p className="text-xs text-[#78716c] dark:text-[#a8a29e] truncate">{a.description}</p>
                </div>
                {permissions.ambito && (
                  <div className="flex gap-2 flex-shrink-0">
                    <IconBtn onClick={() => ambitoH.edit(a)} hover="purple"><EditIcon /></IconBtn>
                    <IconBtn onClick={() => ambitoH.delete(a.id)} hover="red"><TrashIcon /></IconBtn>
                  </div>
                )}
              </div>
            ))}
          </div>
          {permissions.ambito && <AddBtn onClick={ambitoH.add} label="Agregar Ámbito" />}
        </FormSection>

        {/* Auditorías Recientes */}
        <FormSection title="Auditorías Recientes" icon={<HistorialIcon />} enabled={permissions.auditorias}>
          <div className="space-y-3 mb-4">
            {auditorias.map(a => (
              <div key={a.id} className="flex items-center gap-4 p-4 rounded-xl bg-[#f5f5f4] dark:bg-[#292524] border border-[#e7e5e4] dark:border-[#44403c]">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="text-sm font-bold text-[#1c1917] dark:text-[#fafaf9] truncate">{a.nombre}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex-shrink-0 ${resultadoColor[a.resultado]}`}>
                      {resultadoLabel[a.resultado]}
                    </span>
                  </div>
                  <p className="text-xs text-[#78716c] dark:text-[#a8a29e]">
                    {a.tipo} · {a.fecha} · <span className="font-semibold text-[#6d28d9] dark:text-[#c4b5fd]">{a.puntuacion}</span>
                  </p>
                </div>
                {permissions.auditorias && (
                  <div className="flex gap-2 flex-shrink-0">
                    <IconBtn onClick={() => audH.edit(a)} hover="purple"><EditIcon /></IconBtn>
                    <IconBtn onClick={() => audH.delete(a.id)} hover="red"><TrashIcon /></IconBtn>
                  </div>
                )}
              </div>
            ))}
          </div>
          {permissions.auditorias && <AddBtn onClick={audH.add} label="Agregar Auditoría" />}
        </FormSection>

        {/* Dictámenes */}
        <FormSection title="Dictámenes e Informes" icon={<DictamenIcon />} enabled={permissions.dictamenes}>
          <div className="space-y-3 mb-4">
            {dictamenes.map(d => (
              <div key={d.id} className="flex items-center gap-4 p-4 rounded-xl bg-[#f5f5f4] dark:bg-[#292524] border border-[#e7e5e4] dark:border-[#44403c]">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="text-xs font-bold text-[#6d28d9] dark:text-[#c4b5fd]">{d.folio}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex-shrink-0 ${estadoColor[d.estado]}`}>
                      {estadoLabel[d.estado]}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-[#1c1917] dark:text-[#fafaf9] truncate">{d.titulo}</p>
                  <p className="text-xs text-[#78716c] dark:text-[#a8a29e]">{d.tipo} · {d.fecha}</p>
                </div>
                {permissions.dictamenes && (
                  <div className="flex gap-2 flex-shrink-0">
                    <IconBtn onClick={() => dictH.edit(d)} hover="purple"><EditIcon /></IconBtn>
                    <IconBtn onClick={() => dictH.delete(d.id)} hover="red"><TrashIcon /></IconBtn>
                  </div>
                )}
              </div>
            ))}
          </div>
          {permissions.dictamenes && <AddBtn onClick={dictH.add} label="Agregar Dictamen" />}
        </FormSection>

        {/* Marco Normativo */}
        <FormSection title="Marco Normativo Aplicado" icon={<NormaIcon />} enabled={permissions.normativas}>
          <div className="space-y-3 mb-4">
            {normativas.map(n => (
              <div key={n.id} className="flex items-center gap-3 p-4 rounded-xl bg-[#f5f5f4] dark:bg-[#292524] border border-[#e7e5e4] dark:border-[#44403c]">
                <span className="text-[10px] font-extrabold text-[#6d28d9] dark:text-[#c4b5fd] bg-[#ede9fe] dark:bg-[#4c1d95]/30 px-2 py-1.5 rounded-lg flex-shrink-0 leading-tight whitespace-nowrap">
                  {n.clave}
                </span>
                <p className="flex-1 text-xs text-[#57534e] dark:text-[#a8a29e] min-w-0 truncate">{n.desc}</p>
                {permissions.normativas && (
                  <div className="flex gap-2 flex-shrink-0">
                    <IconBtn onClick={() => normH.edit(n)} hover="purple"><EditIcon /></IconBtn>
                    <IconBtn onClick={() => normH.delete(n.id)} hover="red"><TrashIcon /></IconBtn>
                  </div>
                )}
              </div>
            ))}
          </div>
          {permissions.normativas && <AddBtn onClick={normH.add} label="Agregar Normativa" />}
        </FormSection>

        {/* Acreditaciones */}
        <FormSection title="Acreditaciones y Certificaciones" icon={<AcredIcon />} enabled={permissions.acreditaciones}>
          <div className="space-y-3 mb-4">
            {acreditaciones.map(a => (
              <div key={a.id} className="flex items-center gap-4 p-4 rounded-xl bg-[#f5f5f4] dark:bg-[#292524] border border-[#e7e5e4] dark:border-[#44403c]">
                <div className="w-2 h-2 rounded-full bg-[#6d28d9] flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-[#1c1917] dark:text-[#fafaf9] truncate">{a.nombre}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex-shrink-0 ${acredColor[a.estado]}`}>
                      {acredLabel[a.estado]}
                    </span>
                  </div>
                  <p className="text-xs text-[#78716c] dark:text-[#a8a29e]">Vence: {a.vence}</p>
                </div>
                {permissions.acreditaciones && (
                  <div className="flex gap-2 flex-shrink-0">
                    <IconBtn onClick={() => acredH.edit(a)} hover="purple"><EditIcon /></IconBtn>
                    <IconBtn onClick={() => acredH.delete(a.id)} hover="red"><TrashIcon /></IconBtn>
                  </div>
                )}
              </div>
            ))}
          </div>
          {permissions.acreditaciones && <AddBtn onClick={acredH.add} label="Agregar Acreditación" />}
        </FormSection>

        {/* Indicadores */}
        <FormSection title="Indicadores de Desempeño" icon={<IndicadoresIcon />} enabled={permissions.indicadores}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
            <FormInput label="Auditorías Realizadas" value={formData.auditoriasRealizadas} onChange={v => handleInput('auditoriasRealizadas', v)} placeholder="Ej: 620" enabled={permissions.indicadores} type="number" />
            <FormInput label="Cumplimiento Prom. (%)" value={formData.cumplimientoProm} onChange={v => handleInput('cumplimientoProm', v)} placeholder="Ej: 94" enabled={permissions.indicadores} type="number" max="100" />
            <FormInput label="Estados Cubiertos" value={formData.estadosCubiertos} onChange={v => handleInput('estadosCubiertos', v)} placeholder="Ej: 18" enabled={permissions.indicadores} type="number" />
            <FormInput label="Audits / Mes" value={formData.auditsMes} onChange={v => handleInput('auditsMes', v)} placeholder="Ej: 14" enabled={permissions.indicadores} type="number" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormInput label="Auditorías Aprobadas (%)" value={formData.auditoriasAprobadas} onChange={v => handleInput('auditoriasAprobadas', v)} placeholder="Ej: 82" enabled={permissions.indicadores} type="number" max="100" helpText="% de audits con resultado favorable" />
            <FormInput label="Dictámenes sin Apelación (%)" value={formData.dictamenesSinApelacion} onChange={v => handleInput('dictamenesSinApelacion', v)} placeholder="Ej: 91" enabled={permissions.indicadores} type="number" max="100" helpText="% de dictámenes no impugnados" />
            <FormInput label="Certs. Export. OK (%)" value={formData.certsExportOK} onChange={v => handleInput('certsExportOK', v)} placeholder="Ej: 99" enabled={permissions.indicadores} type="number" max="100" helpText="% sin rechazo en frontera" />
          </div>
        </FormSection>

        {/* Contacto */}
        <FormSection title="Contacto Oficial" icon={<ContactIcon />} enabled={permissions.contacto}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormInput label="Teléfono Oficial" value={formData.telefono} onChange={v => handleInput('telefono', v)} placeholder="+52 81 8358 2200" enabled={permissions.contacto} type="tel" />
            <FormInput label="Email Institucional" value={formData.email} onChange={v => handleInput('email', v)} placeholder="usuario@senasica.gob.mx" enabled={permissions.contacto} type="email" />
            <FormInput label="Portal / Sitio Web" value={formData.sitioWeb} onChange={v => handleInput('sitioWeb', v)} placeholder="www.gob.mx/senasica" enabled={permissions.contacto} />
            <FormInput label="Horario de Atención" value={formData.horario} onChange={v => handleInput('horario', v)} placeholder="Lun–Vie: 8:00–15:00" enabled={permissions.contacto} />
          </div>
        </FormSection>

        {/* Banner permisos */}
        <div className="mt-8 p-6 rounded-2xl bg-[#ede9fe] dark:bg-[#4c1d95]/10 border border-[#ddd6fe] dark:border-[#6d28d9]/30">
          <div className="flex gap-4">
            <div className="text-[#6d28d9] dark:text-[#c4b5fd] flex-shrink-0 mt-0.5"><InfoIconSolid /></div>
            <div>
              <h4 className="text-sm font-bold text-[#4c1d95] dark:text-[#c4b5fd] mb-1">Permisos de Edición</h4>
              <p className="text-sm text-[#6d28d9] dark:text-[#c4b5fd]/80">
                Como <span className="font-semibold">{getRoleLabel(currentUserRole)}</span>, puedes editar:{' '}
                {getEnabledSections(permissions).join(', ')}.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Modales ── */}

      {showAmbitoModal && editingAmbito && (
        <GenericModal title={editingAmbito.title ? 'Editar Ámbito' : 'Agregar Ámbito'} onClose={ambitoH.close} onSave={() => ambitoH.save(editingAmbito)}>
          <FormInput label="Título del Ámbito" value={editingAmbito.title} onChange={v => setEditingAmbito({ ...editingAmbito, title: v })} placeholder="Ej: Rastros TIF" enabled required />
          <FormTextarea label="Descripción" value={editingAmbito.description} onChange={v => setEditingAmbito({ ...editingAmbito, description: v })} placeholder="Describe el alcance de este ámbito..." enabled rows={3} />
          <div>
            <label className="block text-sm font-semibold text-[#1c1917] dark:text-[#fafaf9] mb-2">Nivel</label>
            <select value={editingAmbito.nivel} onChange={e => setEditingAmbito({ ...editingAmbito, nivel: e.target.value as AmbitoItem['nivel'] })}
              className="w-full px-4 py-3 rounded-xl border border-[#e7e5e4] dark:border-[#292524] bg-white dark:bg-[#1c1917] text-[#1c1917] dark:text-[#fafaf9] focus:outline-none focus:ring-2 focus:ring-[#6d28d9] transition-all">
              <option value="Federal">Federal</option>
              <option value="Internacional">Internacional</option>
            </select>
          </div>
        </GenericModal>
      )}

      {showAuditoriaModal && editingAuditoria && (
        <GenericModal title={editingAuditoria.nombre ? 'Editar Auditoría' : 'Agregar Auditoría'} onClose={audH.close} onSave={() => audH.save(editingAuditoria)}>
          <FormInput label="Establecimiento / Empresa" value={editingAuditoria.nombre} onChange={v => setEditingAuditoria({ ...editingAuditoria, nombre: v })} placeholder="Ej: Rastro TIF El Norte" enabled required />
          <FormInput label="Tipo de Auditoría" value={editingAuditoria.tipo} onChange={v => setEditingAuditoria({ ...editingAuditoria, tipo: v })} placeholder="Ej: Rastro TIF, Bienestar Animal..." enabled />
          <FormInput label="Fecha" value={editingAuditoria.fecha} onChange={v => setEditingAuditoria({ ...editingAuditoria, fecha: v })} placeholder="Ej: 2026-02-10" enabled type="date" />
          <FormInput label="Puntuación" value={editingAuditoria.puntuacion} onChange={v => setEditingAuditoria({ ...editingAuditoria, puntuacion: v })} placeholder="Ej: 96/100" enabled />
          <div>
            <label className="block text-sm font-semibold text-[#1c1917] dark:text-[#fafaf9] mb-2">Resultado</label>
            <select value={editingAuditoria.resultado} onChange={e => setEditingAuditoria({ ...editingAuditoria, resultado: e.target.value as AuditoriaItem['resultado'] })}
              className="w-full px-4 py-3 rounded-xl border border-[#e7e5e4] dark:border-[#292524] bg-white dark:bg-[#1c1917] text-[#1c1917] dark:text-[#fafaf9] focus:outline-none focus:ring-2 focus:ring-[#6d28d9] transition-all">
              <option value="aprobado">Aprobado</option>
              <option value="observaciones">Con Observaciones</option>
              <option value="suspendido">Suspendido</option>
            </select>
          </div>
        </GenericModal>
      )}

      {showDictamenModal && editingDictamen && (
        <GenericModal title={editingDictamen.folio ? 'Editar Dictamen' : 'Agregar Dictamen'} onClose={dictH.close} onSave={() => dictH.save(editingDictamen)}>
          <FormInput label="Folio / Número" value={editingDictamen.folio} onChange={v => setEditingDictamen({ ...editingDictamen, folio: v })} placeholder="Ej: DIC-2026-0089" enabled required />
          <FormTextarea label="Título / Descripción" value={editingDictamen.titulo} onChange={v => setEditingDictamen({ ...editingDictamen, titulo: v })} placeholder="Ej: Dictamen de Habilitación — Corrales..." enabled rows={2} />
          <FormInput label="Tipo de Dictamen" value={editingDictamen.tipo} onChange={v => setEditingDictamen({ ...editingDictamen, tipo: v })} placeholder="Ej: Habilitación, Suspensión, No Conformidad..." enabled />
          <FormInput label="Fecha" value={editingDictamen.fecha} onChange={v => setEditingDictamen({ ...editingDictamen, fecha: v })} placeholder="Ej: 2026-02-07" enabled type="date" />
          <div>
            <label className="block text-sm font-semibold text-[#1c1917] dark:text-[#fafaf9] mb-2">Estado</label>
            <select value={editingDictamen.estado} onChange={e => setEditingDictamen({ ...editingDictamen, estado: e.target.value as DictamenItem['estado'] })}
              className="w-full px-4 py-3 rounded-xl border border-[#e7e5e4] dark:border-[#292524] bg-white dark:bg-[#1c1917] text-[#1c1917] dark:text-[#fafaf9] focus:outline-none focus:ring-2 focus:ring-[#6d28d9] transition-all">
              <option value="favorable">Favorable</option>
              <option value="observaciones">Con Observaciones</option>
              <option value="desfavorable">Desfavorable</option>
            </select>
          </div>
        </GenericModal>
      )}

      {showNormativaModal && editingNormativa && (
        <GenericModal title={editingNormativa.clave ? 'Editar Normativa' : 'Agregar Normativa'} onClose={normH.close} onSave={() => normH.save(editingNormativa)}>
          <FormInput label="Clave / Identificador" value={editingNormativa.clave} onChange={v => setEditingNormativa({ ...editingNormativa, clave: v })} placeholder="Ej: NOM-033-SAG/ZOO" enabled required />
          <FormTextarea label="Descripción" value={editingNormativa.desc} onChange={v => setEditingNormativa({ ...editingNormativa, desc: v })} placeholder="Ej: Sacrificio humanitario de animales..." enabled rows={2} />
        </GenericModal>
      )}

      {showAcredModal && editingAcred && (
        <GenericModal title={editingAcred.nombre ? 'Editar Acreditación' : 'Agregar Acreditación'} onClose={acredH.close} onSave={() => acredH.save(editingAcred)}>
          <FormInput label="Nombre de la Acreditación" value={editingAcred.nombre} onChange={v => setEditingAcred({ ...editingAcred, nombre: v })} placeholder="Ej: SENASICA — Auditora Oficial" enabled required />
          <FormInput label="Fecha de Vencimiento" value={editingAcred.vence} onChange={v => setEditingAcred({ ...editingAcred, vence: v })} placeholder="Ej: Jun 2027 o Permanente" enabled />
          <div>
            <label className="block text-sm font-semibold text-[#1c1917] dark:text-[#fafaf9] mb-2">Estado</label>
            <select value={editingAcred.estado} onChange={e => setEditingAcred({ ...editingAcred, estado: e.target.value as AcredItem['estado'] })}
              className="w-full px-4 py-3 rounded-xl border border-[#e7e5e4] dark:border-[#292524] bg-white dark:bg-[#1c1917] text-[#1c1917] dark:text-[#fafaf9] focus:outline-none focus:ring-2 focus:ring-[#6d28d9] transition-all">
              <option value="vigente">Vigente</option>
              <option value="por-vencer">Por Vencer</option>
              <option value="vencido">Vencido</option>
            </select>
          </div>
        </GenericModal>
      )}

      {/* Modal éxito */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1c1917] rounded-2xl p-8 shadow-2xl max-w-md mx-4 text-center">
            <div className="w-16 h-16 rounded-full bg-[#ede9fe] dark:bg-[#4c1d95]/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircleIcon />
            </div>
            <h3 className="text-xl font-bold text-[#1c1917] dark:text-[#fafaf9] mb-2">¡Cambios Guardados!</h3>
            <p className="text-sm text-[#78716c] dark:text-[#a8a29e]">El perfil de auditor ha sido actualizado exitosamente</p>
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
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${enabled ? 'bg-[#ede9fe] dark:bg-[#4c1d95]/30 text-[#6d28d9] dark:text-[#c4b5fd]' : 'bg-[#f5f5f4] dark:bg-[#292524] text-[#78716c] dark:text-[#a8a29e]'}`}>
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

function FormInput({ label, value, onChange, placeholder, enabled, type = 'text', max, required = false, helpText }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; enabled: boolean;
  type?: string; max?: string; required?: boolean; helpText?: string
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-[#1c1917] dark:text-[#fafaf9] mb-2">
        {label}{required && <span className="text-[#ef4444] ml-1">*</span>}
      </label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} disabled={!enabled} max={max}
        className="w-full px-4 py-3 rounded-xl border border-[#e7e5e4] dark:border-[#292524] bg-white dark:bg-[#1c1917] text-[#1c1917] dark:text-[#fafaf9] placeholder-[#a8a29e] focus:outline-none focus:ring-2 focus:ring-[#6d28d9] focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed" />
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
        className="w-full px-4 py-3 rounded-xl border border-[#e7e5e4] dark:border-[#292524] bg-white dark:bg-[#1c1917] text-[#1c1917] dark:text-[#fafaf9] placeholder-[#a8a29e] focus:outline-none focus:ring-2 focus:ring-[#6d28d9] focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed resize-none" />
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
          <button onClick={onSave} className="flex-1 px-5 py-3 rounded-xl bg-[#6d28d9] hover:bg-[#4c1d95] text-white font-semibold transition-all">Guardar</button>
        </div>
      </div>
    </div>
  )
}

function IconBtn({ children, onClick, hover }: { children: React.ReactNode; onClick: () => void; hover: 'purple' | 'red' }) {
  const hoverClass = hover === 'purple' ? 'hover:text-[#6d28d9] hover:border-[#6d28d9]' : 'hover:text-[#ef4444] hover:border-[#ef4444]'
  return (
    <button onClick={onClick} className={`w-8 h-8 rounded-lg bg-white dark:bg-[#1c1917] border border-[#e7e5e4] dark:border-[#292524] flex items-center justify-center text-[#78716c] dark:text-[#a8a29e] ${hoverClass} transition-all`}>
      {children}
    </button>
  )
}

function AddBtn({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button onClick={onClick} className="w-full py-3 px-4 rounded-xl border-2 border-dashed border-[#e7e5e4] dark:border-[#292524] hover:border-[#6d28d9] dark:hover:border-[#6d28d9] text-[#78716c] dark:text-[#a8a29e] hover:text-[#6d28d9] dark:hover:text-[#c4b5fd] font-semibold transition-all flex items-center justify-center gap-2">
      <PlusIcon />{label}
    </button>
  )
}

/* ────────────── HELPERS ────────────── */

function getRoleLabel(role: UserRole): string {
  const l: Record<UserRole, string> = {
    auditor_titular:     'Auditor Titular',
    auditor_adjunto:     'Auditor Adjunto',
    admin_senasica:      'Administrador SENASICA',
    supervisor_regional: 'Supervisor Regional',
  }
  return l[role]
}

function getEnabledSections(p: EditPermissions): string[] {
  const map: Array<[keyof EditPermissions, string]> = [
    ['basicInfo',       'Información Personal'],
    ['ambito',          'Ámbito de Inspección'],
    ['auditorias',      'Auditorías'],
    ['dictamenes',      'Dictámenes'],
    ['normativas',      'Marco Normativo'],
    ['acreditaciones',  'Acreditaciones'],
    ['indicadores',     'Indicadores'],
    ['contacto',        'Contacto'],
  ]
  return map.filter(([k]) => p[k]).map(([, v]) => v)
}

/* ────────────── ICONS ────────────── */
const ArrowLeftIcon   = () => <svg className="w-5 h-5 text-[#78716c] dark:text-[#a8a29e]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
const SaveIcon        = () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
const SpinnerIcon     = () => <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle className="opacity-25" cx="12" cy="12" r="10"/><path className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
const PersonIcon      = () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
const AmbitoIcon      = () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
const HistorialIcon   = () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="15" y2="17"/></svg>
const DictamenIcon    = () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M9 15l2 2 4-4"/></svg>
const NormaIcon       = () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
const AcredIcon       = () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
const IndicadoresIcon = () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
const ContactIcon     = () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
const EditIcon        = () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
const TrashIcon       = () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
const PlusIcon        = () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
const LockIcon        = () => <svg className="w-5 h-5 text-[#78716c] dark:text-[#a8a29e]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
const CheckCircleIcon = () => <svg className="w-10 h-10 text-[#6d28d9]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
const InfoIconSolid   = () => <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>

export default PerfilAuditorEdit