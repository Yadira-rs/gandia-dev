import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { useUser } from '../../context/UserContext'
import { auditorExtCache, setAuditorExtCache } from './perfilAuditorCache'
import type { AuditorExtendedCached } from './perfilAuditorCache'

// ─── DEFAULT DATA ─────────────────────────────────────────────────────────────
const DEFAULT_AMBITOS = [
  { id:'1', title:'Rastros TIF',                  description:'Verificación de instalaciones, procesos de sacrificio, higiene y cumplimiento de NOM-033',                              nivel:'Federal'        as const },
  { id:'2', title:'Transporte y Bienestar Animal', description:'Inspección de vehículos, densidad de carga, agua, alimento y condición animal en tránsito',                           nivel:'Federal'        as const },
  { id:'3', title:'Corrales de Exportación',       description:'Habilitación y verificación de corrales de concentración y cuarentena para exportación a EUA',                        nivel:'Internacional'   as const },
  { id:'4', title:'Trazabilidad SINIIGA',           description:'Auditoría de registros de aretes, movimientos, declaraciones y consistencia de inventarios',                          nivel:'Federal'        as const },
  { id:'5', title:'Sanidad e Inocuidad',            description:'Campañas zoosanitarias, muestreos serológicos y cumplimiento de programas de salud animal',                           nivel:'Federal'        as const },
  { id:'6', title:'Certificación para Exportación', description:'Emisión de certificados zoosanitarios internacionales y revisión pre-embarque en fronteras',                         nivel:'Internacional'   as const },
]
const DEFAULT_AUDITORIAS = [
  { id:'1', nombre:'Rastro TIF El Norte',     tipo:'Rastro TIF',      fecha:'10 Feb 2026', resultado:'aprobado'      as const, puntuacion:'96/100' },
  { id:'2', nombre:'Corrales Export. Juárez', tipo:'Corral Export.',  fecha:'05 Feb 2026', resultado:'aprobado'      as const, puntuacion:'91/100' },
  { id:'3', nombre:'Ganadera del Bravo S.A.', tipo:'Trazabilidad',    fecha:'28 Ene 2026', resultado:'observaciones' as const, puntuacion:'78/100' },
  { id:'4', nombre:'Exportadora Norte S.A.',  tipo:'Bienestar Animal',fecha:'20 Ene 2026', resultado:'aprobado'      as const, puntuacion:'88/100' },
  { id:'5', nombre:'Rancho Los Alamos',       tipo:'Sanidad',         fecha:'12 Ene 2026', resultado:'suspendido'    as const, puntuacion:'52/100' },
]
const DEFAULT_DICTAMENES = [
  { id:'1', folio:'DIC-2026-0089', titulo:'Dictamen de Habilitación — Corrales de Exportación Juárez',      tipo:'Habilitación',       fecha:'07 Feb 2026', estado:'favorable'    as const },
  { id:'2', folio:'DIC-2026-0081', titulo:'Informe de No Conformidad — Ganadera del Bravo (Trazabilidad)', tipo:'No Conformidad',     fecha:'29 Ene 2026', estado:'observaciones' as const },
  { id:'3', folio:'DIC-2026-0074', titulo:'Dictamen de Suspensión — Rancho Los Alamos (Sanidad)',           tipo:'Suspensión',         fecha:'13 Ene 2026', estado:'desfavorable'  as const },
  { id:'4', folio:'DIC-2026-0068', titulo:'Certificado Zoosanitario Internacional — Lote ENV-2026-0231',   tipo:'Certificado Export.', fecha:'09 Ene 2026', estado:'favorable'    as const },
]
const DEFAULT_NORMATIVAS = [
  { id:'1', clave:'NOM-033-SAG/ZOO',   desc:'Sacrificio humanitario de animales domésticos y silvestres' },
  { id:'2', clave:'NOM-051-ZOO',       desc:'Trato humanitario en movilización de animales' },
  { id:'3', clave:'NOM-059-ZOO',       desc:'Especificaciones para importación y exportación de animales' },
  { id:'4', clave:'NOM-009-ZOO',       desc:'Proceso sanitario de la carne' },
  { id:'5', clave:'CFR 9 Part 93',     desc:'USDA — Importación de animales vivos a Estados Unidos' },
  { id:'6', clave:'SINIIGA / SAGARPA', desc:'Sistema Nacional de Identificación Individual del Ganado' },
  { id:'7', clave:'NOM-030-ZOO',       desc:'Especificaciones y características de aretes de identificación' },
  { id:'8', clave:'OIE Código Terrestre', desc:'Normas internacionales de sanidad y bienestar animal' },
]
const DEFAULT_ACREDITACIONES = [
  { id:'1', nombre:'SENASICA — Auditora Oficial',      vence:'Jun 2027', estado:'vigente'    as const },
  { id:'2', nombre:'Inspector Tipo Inspección Federal', vence:'Dic 2026', estado:'vigente'    as const },
  { id:'3', nombre:'Certificador USDA / APHIS',         vence:'Mar 2026', estado:'por-vencer' as const },
  { id:'4', nombre:'OIE — Delegado Técnico MX',         vence:'Ene 2027', estado:'vigente'    as const },
  { id:'5', nombre:'Acreditación NOM-033 Oficial',      vence:'Ago 2026', estado:'vigente'    as const },
]

function PerfilAuditor() {
  const navigate    = useNavigate()
  const { profile } = useUser()
  const [loading, setLoading] = useState(auditorExtCache === null)
  const [ext,     setExt]     = useState<AuditorExtendedCached | null>(auditorExtCache)
  const didFetch = useRef(auditorExtCache !== null)

  // ── Core del UserContext ────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pd  = (profile?.personal_data      as Record<string, any>) ?? {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const id_ = (profile?.institutional_data as Record<string, any>) ?? {}
  const auditorName = pd.fullName || pd.full_name || pd.nombre || 'Auditor'
  const auditorUbic = id_.location || pd.municipality || ext?.ubicacion || 'México'

  // ── Fetch extended (con caché) ──────────────────────────────────────────────
  useEffect(() => {
    if (didFetch.current) return
    didFetch.current = true

    const load = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const uid = session?.user?.id
        if (!uid) { setLoading(false); return }

        const { data: me } = await supabase
          .from('auditor_extended_profiles')
          .select('*')
          .eq('user_id', uid)
          .maybeSingle()

        const extData: AuditorExtendedCached = {
          titulo:                   me?.titulo                    ?? 'Auditor e Inspector Oficial',
          ubicacion:                me?.ubicacion                 ?? auditorUbic,
          registro_senasica:        me?.registro_senasica         ?? '',
          organizacion:             me?.organizacion              ?? 'SENASICA / SAGARPA',
          anios_exp:                me?.anios_exp                 ?? null,
          descripcion:              me?.descripcion               ?? '',
          telefono:                 me?.telefono                  ?? pd.phone ?? '',
          email_contact:            me?.email_contact             ?? session?.user?.email ?? '',
          sitio_web:                me?.sitio_web                 ?? '',
          horario:                  me?.horario                   ?? '',
          auditorias_realizadas:    me?.auditorias_realizadas     ?? null,
          cumplimiento_prom:        me?.cumplimiento_prom         ?? null,
          estados_cubiertos:        me?.estados_cubiertos         ?? null,
          audits_mes:               me?.audits_mes                ?? null,
          auditorias_aprobadas:     me?.auditorias_aprobadas      ?? null,
          dictamenes_sin_apelacion: me?.dictamenes_sin_apelacion  ?? null,
          certs_export_ok:          me?.certs_export_ok           ?? null,
          dictamenes_total:         me?.dictamenes_total          ?? null,
          ambitos:                  me?.ambitos?.length           ? me.ambitos        : DEFAULT_AMBITOS,
          auditorias:               me?.auditorias?.length        ? me.auditorias     : DEFAULT_AUDITORIAS,
          dictamenes:               me?.dictamenes?.length        ? me.dictamenes     : DEFAULT_DICTAMENES,
          normativas:               me?.normativas?.length        ? me.normativas     : DEFAULT_NORMATIVAS,
          acreditaciones:           me?.acreditaciones?.length    ? me.acreditaciones : DEFAULT_ACREDITACIONES,
        }
        setAuditorExtCache(extData)
        setExt(extData)
      } catch (e) {
        console.error('PerfilAuditor load error:', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="h-full overflow-y-auto bg-[#fafaf9] dark:bg-[#0c0a09]">

      {/* ── Banner ── */}
      <div className="relative h-48 md:h-64 lg:h-80 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#6d28d9] to-[#4c1d95]">
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `url('data:image/svg+xml,<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><path fill="%23ffffff" fill-opacity="0.3" d="M32 0 L64 16 L64 48 L32 64 L0 48 L0 16 Z"/></svg>')`,
              backgroundSize: '64px 64px',
            }}
          />
        </div>
      </div>

      {/* ── Avatar ── */}
      <div className="relative -mt-14 md:-mt-18 mb-4 px-4 md:px-8 z-10">
        <div className="w-28 h-28 md:w-36 md:h-36 rounded-full bg-white dark:bg-[#1c1917] border-4 border-[#fafaf9] dark:border-[#0c0a09] shadow-xl flex items-center justify-center overflow-hidden">
          <div className="w-full h-full bg-gradient-to-br from-[#6d28d9] to-[#4c1d95] flex items-center justify-center">
            <span className="text-4xl md:text-5xl font-extrabold text-white">AI</span>
          </div>
        </div>
      </div>

      {/* ── Contenido ── */}
      <div className="px-4 md:px-8 pb-8">

        {/* Info básica */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-3">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#1c1917] dark:text-[#fafaf9]">
                    {auditorName}
                  </h1>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#ede9fe] dark:bg-[#4c1d95]/40 text-[#6d28d9] dark:text-[#c4b5fd]">
                  Auditora Certificada
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-[#78716c] dark:text-[#a8a29e]">
                <div className="flex items-center gap-1.5">
                  <MapPinIcon />
                  <span>{ext?.ubicacion ?? auditorUbic}</span>
                </div>
                {ext?.registro_senasica && (
                  <div className="flex items-center gap-1.5">
                    <RegistroIcon />
                    <span>Registro SENASICA: {ext.registro_senasica}</span>
                  </div>
                )}
                {ext?.organizacion && (
                  <div className="flex items-center gap-1.5">
                    <OrgIcon />
                    <span>{ext.organizacion}</span>
                  </div>
                )}
                {ext?.anios_exp != null && (
                  <div className="flex items-center gap-1.5">
                    <ExpIcon />
                    <span>{ext.anios_exp} años de ejercicio</span>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => navigate('/perfil/editar')}
              className="px-6 py-3 bg-[#6d28d9] hover:bg-[#4c1d95] text-white rounded-xl font-semibold transition-colors shadow-lg shadow-[#6d28d9]/20 self-start"
            >
              Editar Perfil
            </button>
          </div>

          <p className="text-base md:text-lg text-[#57534e] dark:text-[#a8a29e] max-w-4xl leading-relaxed">
            {ext?.descripcion || (loading ? 'Cargando...' : 'Sin descripción aún.')}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard value={ext?.auditorias_realizadas != null ? `${ext.auditorias_realizadas}+` : '—'} label="Auditorías Realizadas"  icon={<AuditStatIcon />} />
          <StatCard value={ext?.cumplimiento_prom    != null ? `${ext.cumplimiento_prom}%`       : '—'} label="Cumplimiento Promedio"  icon={<CumplStatIcon />} />
          <StatCard value={ext?.estados_cubiertos    != null ? String(ext.estados_cubiertos)      : '—'} label="Estados Cubiertos"      icon={<MapStatIcon />}  />
          <StatCard value={ext?.anios_exp            != null ? String(ext.anios_exp)              : '—'} label="Años de Ejercicio"      icon={<ExpStatIcon />}  />
        </div>

        {/* Grid principal */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* ── Columna izquierda — 8 cols ── */}
          <div className="lg:col-span-8 space-y-6">

            <SectionCard title="Ámbito de Inspección" icon={<AmbitoIcon />}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(ext?.ambitos ?? DEFAULT_AMBITOS).map(a => (
                  <AmbitoItem key={a.id} icon={<AmbitoIcon />} title={a.title} description={a.description} nivel={a.nivel} />
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Auditorías Recientes" icon={<HistorialIcon />}>
              <div className="rounded-xl border border-[#e7e5e4] dark:border-[#292524] overflow-hidden">
                <div className="bg-[#f5f5f4] dark:bg-[#292524] px-4 py-3 grid grid-cols-12 gap-2">
                  <span className="col-span-4 text-xs font-bold text-[#78716c] dark:text-[#a8a29e]">Establecimiento</span>
                  <span className="col-span-3 text-xs font-bold text-[#78716c] dark:text-[#a8a29e] hidden sm:block">Tipo</span>
                  <span className="col-span-2 text-xs font-bold text-[#78716c] dark:text-[#a8a29e] hidden md:block">Fecha</span>
                  <span className="col-span-3 text-xs font-bold text-[#78716c] dark:text-[#a8a29e]">Resultado</span>
                </div>
                <div className="divide-y divide-[#e7e5e4] dark:divide-[#292524]">
                  {(ext?.auditorias ?? DEFAULT_AUDITORIAS).map(a => (
                    <AuditoriaRow key={a.id} nombre={a.nombre} tipo={a.tipo} fecha={a.fecha} resultado={a.resultado} puntuacion={a.puntuacion} />
                  ))}
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Dictámenes e Informes Recientes" icon={<DictamenIcon />}>
              <div className="space-y-3">
                {(ext?.dictamenes ?? DEFAULT_DICTAMENES).map(d => (
                  <DictamenItem key={d.id} folio={d.folio} titulo={d.titulo} tipo={d.tipo} fecha={d.fecha} estado={d.estado} />
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Marco Normativo Aplicado" icon={<NormaIcon />}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(ext?.normativas ?? DEFAULT_NORMATIVAS).map(n => (
                  <div key={n.id} className="flex items-start gap-3 p-3 rounded-xl bg-[#f5f5f4] dark:bg-[#292524] hover:bg-[#e7e5e4] dark:hover:bg-[#44403c] transition-all">
                    <span className="text-[10px] font-extrabold text-[#6d28d9] dark:text-[#c4b5fd] bg-[#ede9fe] dark:bg-[#4c1d95]/30 px-2 py-1 rounded-lg flex-shrink-0 leading-tight">{n.clave}</span>
                    <p className="text-xs text-[#57534e] dark:text-[#a8a29e] leading-relaxed pt-0.5">{n.desc}</p>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>

          {/* ── Columna derecha — 4 cols ── */}
          <div className="lg:col-span-4 space-y-6">

            <SectionCard title="Acreditaciones" icon={<AcredCardIcon />}>
              <div className="space-y-3">
                {(ext?.acreditaciones ?? DEFAULT_ACREDITACIONES).map(a => (
                  <CertItem key={a.id} nombre={a.nombre} vence={a.vence} estado={a.estado} />
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Indicadores de Desempeño" icon={<IndicadoresIcon />}>
              <div className="space-y-4">
                <KPIBar label="Auditorías aprobadas"     value={ext?.auditorias_aprobadas     ?? null} />
                <KPIBar label="Dictámenes sin apelación" value={ext?.dictamenes_sin_apelacion  ?? null} />
                <KPIBar label="Certs. export. emitidos OK" value={ext?.certs_export_ok         ?? null} />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <MiniStat label="Audits / mes" value={ext?.audits_mes       != null ? String(ext.audits_mes)       : '—'} />
                <MiniStat label="Dictámenes"   value={ext?.dictamenes_total != null ? String(ext.dictamenes_total) : '—'} />
              </div>
            </SectionCard>

            {/* Organismos y dependencias */}
            <SectionCard title="Dependencias" icon={<DepIcon />}>
              <div className="space-y-3">
                <DepItem siglas="SENASICA" nombre="Servicio Nacional de Sanidad, Inocuidad y Calidad Agroalimentaria" nivel="Federal" />
                <DepItem siglas="SAGARPA" nombre="Secretaría de Agricultura y Desarrollo Rural" nivel="Federal" />
                <DepItem siglas="USDA" nombre="U.S. Department of Agriculture — APHIS" nivel="Internacional" />
                <DepItem siglas="OIE" nombre="Organización Mundial de Sanidad Animal" nivel="Internacional" />
              </div>
            </SectionCard>

            <SectionCard title="Contacto Oficial" icon={<ContactCardIcon />}>
              <div className="space-y-4">
                {ext?.telefono      && <ContactItem icon={<PhoneIcon />} label="Teléfono Oficial"    value={ext.telefono}      />}
                {ext?.email_contact && <ContactItem icon={<MailIcon  />} label="Email Institucional" value={ext.email_contact} />}
                {ext?.sitio_web     && <ContactItem icon={<GlobeIcon />} label="Portal / Sitio web"  value={ext.sitio_web}     />}
                {ext?.horario       && <ContactItem icon={<ClockIcon />} label="Horario"             value={ext.horario}       />}
              </div>
              {ext?.email_contact && (
                <button className="mt-5 w-full py-3 px-4 rounded-xl bg-[#ede9fe] dark:bg-[#4c1d95]/20 hover:bg-[#ddd6fe] dark:hover:bg-[#4c1d95]/40 text-[#6d28d9] dark:text-[#c4b5fd] font-semibold text-sm transition-all flex items-center justify-center gap-2">
                  <MailIcon />
                  Solicitar Auditoría
                </button>
              )}
            </SectionCard>

          </div>
        </div>
      </div>
    </div>
  )
}

/* ────────────── SUBCOMPONENTES ────────────── */

function SectionCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-[#1c1917] rounded-2xl border border-[#e7e5e4] dark:border-[#292524] p-6 md:p-8 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[#ede9fe] dark:bg-[#4c1d95]/30 flex items-center justify-center text-[#6d28d9] dark:text-[#c4b5fd]">
          {icon}
        </div>
        <h3 className="text-lg md:text-xl font-bold text-[#1c1917] dark:text-[#fafaf9]">{title}</h3>
      </div>
      {children}
    </div>
  )
}

function StatCard({ value, label, icon }: { value: string; label: string; icon: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-[#1c1917] rounded-2xl border border-[#e7e5e4] dark:border-[#292524] p-4 md:p-5 shadow-sm">
      <div className="w-9 h-9 rounded-lg bg-[#ede9fe] dark:bg-[#4c1d95]/30 flex items-center justify-center text-[#6d28d9] dark:text-[#c4b5fd] mb-3">
        {icon}
      </div>
      <p className="text-xl md:text-2xl font-extrabold text-[#1c1917] dark:text-[#fafaf9]">{value}</p>
      <p className="text-xs text-[#78716c] dark:text-[#a8a29e] mt-1 font-medium">{label}</p>
    </div>
  )
}

function AmbitoItem({ icon, title, description, nivel }: {
  icon: React.ReactNode; title: string; description: string; nivel: string
}) {
  const nivelColor = nivel === 'Internacional'
    ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
    : 'bg-[#ede9fe] dark:bg-[#4c1d95]/20 text-[#6d28d9] dark:text-[#c4b5fd]'

  return (
    <div className="flex items-start gap-3 p-4 rounded-xl bg-[#f5f5f4] dark:bg-[#292524] hover:bg-[#e7e5e4] dark:hover:bg-[#44403c] transition-all cursor-pointer group">
      <div className="w-10 h-10 rounded-lg bg-[#ede9fe] dark:bg-[#4c1d95]/20 flex items-center justify-center text-[#6d28d9] dark:text-[#c4b5fd] flex-shrink-0 group-hover:bg-[#ddd6fe] dark:group-hover:bg-[#4c1d95]/40 transition-colors">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-sm font-bold text-[#1c1917] dark:text-[#fafaf9]">{title}</p>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex-shrink-0 ${nivelColor}`}>{nivel}</span>
        </div>
        <p className="text-xs text-[#78716c] dark:text-[#a8a29e] leading-relaxed">{description}</p>
      </div>
    </div>
  )
}

function AuditoriaRow({ nombre, tipo, fecha, resultado, puntuacion }: {
  nombre: string; tipo: string; fecha: string
  resultado: 'aprobado' | 'observaciones' | 'suspendido'; puntuacion: string
}) {
  const r = {
    aprobado: { badge: 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400', label: 'Aprobado' },
    observaciones: { badge: 'bg-[#fef3c7] dark:bg-[#92400e]/20 text-[#b45309] dark:text-[#fcd34d]', label: 'Obs.' },
    suspendido: { badge: 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400', label: 'Suspendido' },
  }[resultado]

  return (
    <div className="grid grid-cols-12 gap-2 px-4 py-3 hover:bg-[#fafaf9] dark:hover:bg-[#292524] transition-all items-center">
      <div className="col-span-4 min-w-0">
        <p className="text-xs font-bold text-[#1c1917] dark:text-[#fafaf9] truncate">{nombre}</p>
        <p className="text-[10px] text-[#6d28d9] dark:text-[#c4b5fd] font-semibold">{puntuacion}</p>
      </div>
      <span className="col-span-3 text-xs text-[#78716c] dark:text-[#a8a29e] truncate hidden sm:block">{tipo}</span>
      <span className="col-span-2 text-xs text-[#78716c] dark:text-[#a8a29e] whitespace-nowrap hidden md:block">{fecha}</span>
      <span className={`col-span-3 text-[10px] px-2 py-1 rounded-full font-bold text-center ${r.badge}`}>{r.label}</span>
    </div>
  )
}

function DictamenItem({ folio, titulo, tipo, fecha, estado }: {
  folio: string; titulo: string; tipo: string; fecha: string
  estado: 'favorable' | 'observaciones' | 'desfavorable'
}) {
  const s = {
    favorable: { badge: 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400', dot: 'bg-green-500', icon: <FavorableIcon /> },
    observaciones: { badge: 'bg-[#fef3c7] dark:bg-[#92400e]/20 text-[#b45309] dark:text-[#fcd34d]', dot: 'bg-[#f59e0b]', icon: <ObsIcon /> },
    desfavorable: { badge: 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400', dot: 'bg-red-500', icon: <DesfavIcon /> },
  }[estado]

  return (
    <div className="flex items-start gap-3 p-4 rounded-xl hover:bg-[#f5f5f4] dark:hover:bg-[#292524] transition-all cursor-pointer">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${s.badge}`}>
        {s.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className="text-xs font-bold text-[#6d28d9] dark:text-[#c4b5fd]">{folio}</p>
          <span className="text-xs text-[#78716c] dark:text-[#a8a29e] whitespace-nowrap">{fecha}</span>
        </div>
        <p className="text-sm font-semibold text-[#1c1917] dark:text-[#fafaf9] leading-snug mb-1">{titulo}</p>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#ede9fe] dark:bg-[#4c1d95]/20 text-[#6d28d9] dark:text-[#c4b5fd] font-bold">{tipo}</span>
      </div>
    </div>
  )
}

function CertItem({ nombre, vence, estado }: {
  nombre: string; vence: string; estado: 'vigente' | 'por-vencer' | 'vencido'
}) {
  const s = {
    vigente: { badge: 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400', dot: 'bg-green-500', label: 'Vigente' },
    'por-vencer': { badge: 'bg-[#fef3c7] dark:bg-[#92400e]/20 text-[#b45309] dark:text-[#fcd34d]', dot: 'bg-[#f59e0b]', label: 'Por Vencer' },
    vencido: { badge: 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400', dot: 'bg-red-500', label: 'Vencido' },
  }[estado]
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-[#f5f5f4] dark:bg-[#292524] hover:bg-[#e7e5e4] dark:hover:bg-[#44403c] transition-all">
      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${s.dot}`} />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-[#1c1917] dark:text-[#fafaf9] truncate">{nombre}</p>
        <p className="text-xs text-[#78716c] dark:text-[#a8a29e]">Vence: {vence}</p>
      </div>
      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex-shrink-0 ${s.badge}`}>{s.label}</span>
    </div>
  )
}

function KPIBar({ label, value }: { label: string; value: number | null }) {
  if (value === null) return null
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-medium text-[#78716c] dark:text-[#a8a29e]">{label}</span>
        <span className="text-xs font-bold text-[#6d28d9] dark:text-[#c4b5fd]">{value}%</span>
      </div>
      <div className="h-2 bg-[#f5f5f4] dark:bg-[#292524] rounded-full overflow-hidden">
        <div className="h-full bg-[#6d28d9] rounded-full" style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 rounded-xl bg-[#f5f5f4] dark:bg-[#292524] text-center">
      <p className="text-xl font-extrabold text-[#1c1917] dark:text-[#fafaf9]">{value}</p>
      <p className="text-xs text-[#78716c] dark:text-[#a8a29e] mt-0.5">{label}</p>
    </div>
  )
}

function DepItem({ siglas, nombre, nivel }: { siglas: string; nombre: string; nivel: string }) {
  const nivelColors: Record<string, string> = {
    Federal: 'bg-[#ede9fe] dark:bg-[#4c1d95]/20 text-[#6d28d9] dark:text-[#c4b5fd]',
    Internacional: 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400',
  }
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-[#f5f5f4] dark:bg-[#292524] hover:bg-[#e7e5e4] dark:hover:bg-[#44403c] transition-all">
      <div className="w-10 h-10 rounded-lg bg-[#6d28d9] flex items-center justify-center flex-shrink-0">
        <span className="text-white text-[9px] font-extrabold tracking-tight leading-none px-0.5 text-center">{siglas}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-[#1c1917] dark:text-[#fafaf9] truncate">{nombre}</p>
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${nivelColors[nivel]}`}>{nivel}</span>
      </div>
    </div>
  )
}

function ContactItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="text-[#78716c] dark:text-[#a8a29e] mt-0.5">{icon}</div>
      <div>
        <p className="text-xs font-medium text-[#78716c] dark:text-[#a8a29e] mb-0.5">{label}</p>
        <p className="text-sm font-semibold text-[#1c1917] dark:text-[#fafaf9]">{value}</p>
      </div>
    </div>
  )
}

/* ────────────── ICONS ────────────── */
const MapPinIcon = () => <svg className="w-4 h-4 text-[#6d28d9]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
const RegistroIcon = () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg>
const OrgIcon = () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="2" width="16" height="20" rx="2" /><path d="M9 22v-4h6v4" /><path d="M8 6h.01" /><path d="M16 6h.01" /><path d="M12 6h.01" /></svg>
const ExpIcon = () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
const AuditStatIcon = () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
const CumplStatIcon = () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>
const MapStatIcon = () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" /><line x1="8" y1="2" x2="8" y2="18" /><line x1="16" y1="6" x2="16" y2="22" /></svg>
const ExpStatIcon = () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /></svg>
const AmbitoIcon = () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
const HistorialIcon = () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="9" y1="13" x2="15" y2="13" /><line x1="9" y1="17" x2="15" y2="17" /></svg>
const DictamenIcon = () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><path d="M9 15l2 2 4-4" /></svg>
const NormaIcon = () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>
const AcredCardIcon = () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
const IndicadoresIcon = () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>
const DepIcon = () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="2" width="16" height="20" rx="2" /><path d="M9 22v-4h6v4" /><path d="M8 6h.01" /><path d="M16 6h.01" /><path d="M12 6h.01" /><path d="M12 10h.01" /></svg>
const ContactCardIcon = () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
const FavorableIcon = () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
const ObsIcon = () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
const DesfavIcon = () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
const PhoneIcon = () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
const MailIcon = () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
const GlobeIcon = () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
const ClockIcon = () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>

export default PerfilAuditor