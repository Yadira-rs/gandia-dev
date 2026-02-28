import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { useUser } from '../../context/UserContext'
import { exportadorExtCache, setExportadorExtCache } from './perfilExportadorCache.ts'
import type { ExportadorExtendedCached } from './perfilExportadorCache.ts'

// ─── DEFAULT DATA ─────────────────────────────────────────────────────────────
const DEFAULT_EQUIPO = [
  { id:'1', nombre:'Carlos Javier Montes', cargo:'Director General',    email:'director@egn-exportadora.mx',   telefono:'+52 614 111 0001' },
  { id:'2', nombre:'Ing. Sofía Ríos',      cargo:'Dir. Operaciones',    email:'operaciones@egn-exportadora.mx', telefono:'+52 614 111 0002' },
  { id:'3', nombre:'Lic. Andrés Frías',    cargo:'Dir. Comercial',      email:'comercial@egn-exportadora.mx',   telefono:'+52 614 111 0003' },
  { id:'4', nombre:'MVZ Karina Salcedo',   cargo:'Dir. Sanidad Animal', email:'sanidad@egn-exportadora.mx',     telefono:'+52 614 111 0004' },
]
const DEFAULT_PROVEEDORES = [
  { id:'1', nombre:'Rancho Los Alamos',         estado:'Chihuahua', cabezas:'2,400', clase:'A' as const },
  { id:'2', nombre:'Ganadera del Bravo',         estado:'Chihuahua', cabezas:'3,100', clase:'A' as const },
  { id:'3', nombre:'Rancho El Búfalo Dorado',    estado:'Durango',   cabezas:'1,450', clase:'A' as const },
  { id:'4', nombre:'Productores Asociados Norte',estado:'Sonora',    cabezas:'5,200', clase:'B' as const },
]
const DEFAULT_CRUCES = [
  { id:'1', ciudad:'Palomas, Chih.',    destino:'Columbus, NM', activo:true },
  { id:'2', ciudad:'Cd. Juárez, Chih.', destino:'El Paso, TX',  activo:true },
  { id:'3', ciudad:'Ojinaga, Chih.',    destino:'Presidio, TX', activo:true },
  { id:'4', ciudad:'Agua Prieta, Son.', destino:'Douglas, AZ',  activo:true },
]
const DEFAULT_CERTS = [
  { id:'1', nombre:'Licencia USDA / APHIS',        numero:'MX-00451',      vencimiento:'31 Dic 2026',   estado:'vigente'    as const },
  { id:'2', nombre:'Habilitación SENASICA',         numero:'SEN-2003-0087', vencimiento:'30 Jun 2026',   estado:'vigente'    as const },
  { id:'3', nombre:'Certificado Bienestar Animal',  numero:'BA-MX-1142',    vencimiento:'15 Sep 2026',   estado:'vigente'    as const },
  { id:'4', nombre:'Sistema de Trazabilidad SINIIGA',numero:'TRZ-DGO-0055',vencimiento:'Permanente',    estado:'vigente'    as const },
  { id:'5', nombre:'Certificado NOM-051 Bienestar', numero:'NOM-2025-0312', vencimiento:'20 Mar 2026',   estado:'por-vencer' as const },
  { id:'6', nombre:'Registro CENAPRECE Sanitario',  numero:'CEN-0774-MX',   vencimiento:'01 Ene 2025',   estado:'vencido'    as const },
]
const DEFAULT_OPERACIONES = [
  { id:'1', destino:'Estados Unidos', bandera:'🇺🇸', cabezas:'38,200', porcentaje:79, estado:'Activo'        },
  { id:'2', destino:'Canadá',         bandera:'🇨🇦', cabezas:'7,400',  porcentaje:15, estado:'Activo'        },
  { id:'3', destino:'Japón',          bandera:'🇯🇵', cabezas:'2,900',  porcentaje:6,  estado:'En Desarrollo' },
]

const GRADIENTS = [
  'from-[#b45309] to-[#92400e]',
  'from-[#d97706] to-[#b45309]',
  'from-[#f59e0b] to-[#d97706]',
  'from-[#fbbf24] to-[#f59e0b]',
]

function PerfilExportador() {
  const navigate    = useNavigate()
  const { profile } = useUser()
  const [loading, setLoading] = useState(exportadorExtCache === null)
  const [ext,     setExt]     = useState<ExportadorExtendedCached | null>(exportadorExtCache)
  const didFetch = useRef(exportadorExtCache !== null)

  // ── Core del UserContext ────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pd  = (profile?.personal_data      as Record<string, any>) ?? {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const id_ = (profile?.institutional_data as Record<string, any>) ?? {}
  const expName = id_.companyName || id_.razonSocial || id_.nombre || ext?.razon_social || 'Exportadora'
  const expRFC  = id_.rfc || pd.rfc || ext?.rfc || '—'

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
          .from('exportador_extended_profiles')
          .select('*')
          .eq('user_id', uid)
          .maybeSingle()

        const extData: ExportadorExtendedCached = {
          razon_social:           me?.razon_social            ?? expName,
          naturaleza:             me?.naturaleza              ?? 'Sociedad Anónima',
          ubicacion:              me?.ubicacion               ?? id_.location ?? pd.municipality ?? 'México',
          fundacion:              me?.fundacion               ?? null,
          rfc:                    me?.rfc                     ?? expRFC,
          licencia_usda:          me?.licencia_usda           ?? '',
          descripcion:            me?.descripcion             ?? '',
          empleados:              me?.empleados               ?? null,
          rastros_tif:            me?.rastros_tif             ?? null,
          corrales_concentracion: me?.corrales_concentracion  ?? null,
          telefono:               me?.telefono                ?? pd.phone ?? '',
          email_contact:          me?.email_contact           ?? session?.user?.email ?? '',
          sitio_web:              me?.sitio_web               ?? '',
          horario:                me?.horario                 ?? '',
          tasa_rechazo:           me?.tasa_rechazo            ?? null,
          cabezas_embarque:       me?.cabezas_embarque        ?? null,
          cumplimiento_doc:       me?.cumplimiento_doc        ?? null,
          cabezas_anio:           me?.cabezas_anio            ?? null,
          paises_destino:         me?.paises_destino          ?? null,
          valor_exportado:        me?.valor_exportado         ?? null,
          equipo:                 me?.equipo?.length          ? me.equipo          : DEFAULT_EQUIPO,
          proveedores:            me?.proveedores?.length     ? me.proveedores     : DEFAULT_PROVEEDORES,
          cruces:                 me?.cruces?.length          ? me.cruces          : DEFAULT_CRUCES,
          certificaciones:        me?.certificaciones?.length ? me.certificaciones : DEFAULT_CERTS,
          operaciones:            me?.operaciones?.length     ? me.operaciones     : DEFAULT_OPERACIONES,
        }
        setExportadorExtCache(extData)
        setExt(extData)
      } catch (e) {
        console.error('PerfilExportador load error:', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="h-full overflow-y-auto bg-[#fafaf9] dark:bg-[#0c0a09]">

      {/* ── Banner corporativo ── */}
      <div className="relative h-48 md:h-64 lg:h-80 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#b45309] to-[#92400e]">
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `url('data:image/svg+xml,<svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"><g fill="%23ffffff" fill-opacity="0.4"><path d="M0 0h30v30H0zm30 30h30v30H30z"/></g></svg>')`,
              backgroundSize: '30px 30px',
            }}
          />
        </div>
      </div>

      {/* ── Logo empresa ── */}
      <div className="relative -mt-14 md:-mt-18 mb-4 px-4 md:px-8 z-10">
        <div className="w-28 h-28 md:w-36 md:h-36 rounded-2xl md:rounded-3xl bg-white dark:bg-[#1c1917] border-4 border-[#fafaf9] dark:border-[#0c0a09] shadow-xl flex items-center justify-center p-4">
          <div className="flex flex-col items-center gap-1">
            <GlobeCorpIcon className="w-10 h-10 md:w-14 md:h-14 text-[#b45309]" />
            <span className="text-[8px] md:text-[9px] font-extrabold text-[#b45309] tracking-widest uppercase">Export</span>
          </div>
        </div>
      </div>

      {/* ── Contenido principal ── */}
      <div className="px-4 md:px-8 pb-8">

        {/* Info básica */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#1c1917] dark:text-[#fafaf9]">
                    {ext?.razon_social ?? expName}
                  </h1>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#fef3c7] dark:bg-[#92400e]/30 text-[#b45309] dark:text-[#fcd34d]">
                  Exportador Certificado
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-[#78716c] dark:text-[#a8a29e]">
                <div className="flex items-center gap-1.5">
                  <MapPinIcon />
                  <span>{ext?.ubicacion ?? '—'}</span>
                </div>
                {ext?.fundacion && (
                  <div className="flex items-center gap-1.5">
                    <CalendarIcon />
                    <span>Fundada en {ext.fundacion}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <RegistroIcon />
                  <span>RFC: {ext?.rfc ?? expRFC}</span>
                </div>
                {ext?.licencia_usda && (
                  <div className="flex items-center gap-1.5">
                    <LicenciaIcon />
                    <span>Licencia USDA: {ext.licencia_usda}</span>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => navigate('/perfil/editar')}
              className="px-6 py-3 bg-[#b45309] hover:bg-[#92400e] text-white rounded-xl font-semibold transition-colors shadow-lg shadow-[#b45309]/20 self-start"
            >
              Editar Perfil
            </button>
          </div>

          <p className="text-base md:text-lg text-[#57534e] dark:text-[#a8a29e] max-w-4xl leading-relaxed">
            {ext?.descripcion || (loading ? 'Cargando...' : 'Sin descripción aún.')}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard value={ext?.cabezas_anio    != null ? ext.cabezas_anio.toLocaleString()                        : '—'} label="Cabezas / Año"      icon={<CattleStatIcon />} />
          <StatCard value={ext?.paises_destino  != null ? String(ext.paises_destino)                               : '—'} label="Países Destino"     icon={<GlobeStatIcon />}  />
          <StatCard value={ext?.valor_exportado != null ? `$${ext.valor_exportado}M`                               : '—'} label="Valor Exportado USD" icon={<DollarStatIcon />} />
          <StatCard value={ext?.fundacion       != null ? String(new Date().getFullYear() - ext.fundacion)          : '—'} label="Años de Operación"  icon={<CalendarStatIcon />} />
        </div>

        {/* Grid principal */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* ── Columna izquierda — 8 cols ── */}
          <div className="lg:col-span-8 space-y-6">

            <SectionCard title="Información Empresarial" icon={<BuildingCardIcon />}>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <InfoItem label="Razón Social"              value={ext?.razon_social           ?? '—'} />
                <InfoItem label="Tipo de Empresa"           value={ext?.naturaleza             ?? '—'} />
                <InfoItem label="Sector"                    value="Ganadería de Exportación"          />
                <InfoItem label="Empleados"                 value={ext?.empleados              != null ? `${ext.empleados} colaboradores` : '—'} />
                <InfoItem label="Rastros TIF Asociados"     value={ext?.rastros_tif            != null ? `${ext.rastros_tif} rastros`       : '—'} />
                <InfoItem label="Corrales de Concentración" value={ext?.corrales_concentracion != null ? `${ext.corrales_concentracion} instalaciones` : '—'} />
              </div>
            </SectionCard>

            <SectionCard title="Operaciones de Exportación" icon={<TruckCardIcon />}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {(ext?.operaciones ?? DEFAULT_OPERACIONES).map(op => (
                  <OperacionCard key={op.id} destino={op.destino} bandera={op.bandera} cabezas={op.cabezas} porcentaje={op.porcentaje} estado={op.estado} />
                ))}
              </div>

              {/* Tabla de envíos recientes */}
              <div className="rounded-xl border border-[#e7e5e4] dark:border-[#292524] overflow-hidden">
                <div className="bg-[#f5f5f4] dark:bg-[#292524] px-4 py-3">
                  <p className="text-sm font-bold text-[#1c1917] dark:text-[#fafaf9]">Últimos Envíos</p>
                </div>
                <div className="divide-y divide-[#e7e5e4] dark:divide-[#292524]">
                  <EnvioRow lote="ENV-2026-0231" destino="Douglas, AZ" cabezas="820" fecha="08 Feb 2026" estado="Completado" />
                  <EnvioRow lote="ENV-2026-0228" destino="El Paso, TX" cabezas="1,150" fecha="02 Feb 2026" estado="Completado" />
                  <EnvioRow lote="ENV-2026-0225" destino="Calexico, CA" cabezas="640" fecha="27 Ene 2026" estado="Completado" />
                  <EnvioRow lote="ENV-2026-0222" destino="Laredo, TX" cabezas="980" fecha="19 Ene 2026" estado="Completado" />
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Certificaciones y Cumplimiento" icon={<BadgeCardIcon />}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(ext?.certificaciones ?? DEFAULT_CERTS).map(c => (
                  <CertCard key={c.id} nombre={c.nombre} numero={c.numero} vencimiento={c.vencimiento} estado={c.estado} icon={<BadgeCardIcon />} />
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Indicadores Operativos" icon={<ChartCardIcon />}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <KPICard label="Tasa de Rechazo Frontera"   value={ext?.tasa_rechazo      != null ? `${ext.tasa_rechazo}%`        : '—'} change="" trend="down" good bars={[18,14,22,10,8]}  />
                <KPICard label="Cabezas / Embarque Prom."   value={ext?.cabezas_embarque  != null ? String(ext.cabezas_embarque)  : '—'} change="" trend="up"   good bars={[55,62,70,78,85]} />
                <KPICard label="Cumplimiento Documental"    value={ext?.cumplimiento_doc  != null ? `${ext.cumplimiento_doc}%`    : '—'} change="" trend="up"   good bars={[75,80,85,90,95]} />
              </div>
            </SectionCard>

            <SectionCard title="Actividad Reciente" icon={<ActivityCardIcon />}>
              <div className="space-y-3">
                {loading
                  ? <p className="text-sm text-[#78716c] dark:text-[#a8a29e]">Cargando actividad...</p>
                  : <p className="text-sm text-[#78716c] dark:text-[#a8a29e]">Sin actividad reciente.</p>
                }
              </div>
            </SectionCard>
          </div>

          {/* ── Columna derecha — 4 cols ── */}
          <div className="lg:col-span-4 space-y-6">

            <SectionCard title="Equipo Directivo" icon={<UsersCardIcon />}>
              <div className="space-y-3">
                {(ext?.equipo ?? DEFAULT_EQUIPO).map((d, i) => (
                  <DirectivoItem key={d.id} nombre={d.nombre} cargo={d.cargo} gradient={GRADIENTS[i % GRADIENTS.length]} />
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Proveedores Activos" icon={<ProveedoresIcon />}>
              <div className="space-y-3">
                {(ext?.proveedores ?? DEFAULT_PROVEEDORES).map(p => (
                  <ProveedorItem key={p.id} nombre={p.nombre} estado={p.estado} cabezas={p.cabezas} clase={p.clase} />
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between px-1">
                <span className="text-xs text-[#78716c] dark:text-[#a8a29e]">Total proveedores: <strong className="text-[#1c1917] dark:text-[#fafaf9]">{(ext?.proveedores ?? DEFAULT_PROVEEDORES).length}</strong></span>
              </div>
            </SectionCard>

            <SectionCard title="Cruces Fronterizos" icon={<FronteraIcon />}>
              <div className="space-y-3">
                {(ext?.cruces ?? DEFAULT_CRUCES).map(c => (
                  <CruceItem key={c.id} ciudad={c.ciudad} destino={c.destino} activo={c.activo} />
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Contacto Empresarial" icon={<ContactCardIcon />}>
              <div className="space-y-4">
                {ext?.telefono     && <ContactItem icon={<PhoneIcon />} label="Oficinas Centrales" value={ext.telefono}     />}
                {ext?.email_contact && <ContactItem icon={<MailIcon  />} label="Email Comercial"    value={ext.email_contact} />}
                {ext?.sitio_web    && <ContactItem icon={<GlobeIcon />} label="Sitio Web"           value={ext.sitio_web}    />}
                {ext?.horario      && <ContactItem icon={<ClockIcon />} label="Horario"             value={ext.horario}      />}
              </div>
              {ext?.email_contact && (
                <button className="mt-5 w-full py-3 px-4 rounded-xl bg-[#fef3c7] dark:bg-[#92400e]/20 hover:bg-[#fde68a] dark:hover:bg-[#92400e]/40 text-[#b45309] dark:text-[#fcd34d] font-semibold text-sm transition-all flex items-center justify-center gap-2">
                  <MailIcon />
                  Contactar Exportador
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
        <div className="w-10 h-10 rounded-xl bg-[#fef3c7] dark:bg-[#92400e]/20 flex items-center justify-center text-[#b45309] dark:text-[#fcd34d]">
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
      <div className="w-9 h-9 rounded-lg bg-[#fef3c7] dark:bg-[#92400e]/20 flex items-center justify-center text-[#b45309] dark:text-[#fcd34d] mb-3">
        {icon}
      </div>
      <p className="text-xl md:text-2xl font-extrabold text-[#1c1917] dark:text-[#fafaf9]">{value}</p>
      <p className="text-xs text-[#78716c] dark:text-[#a8a29e] mt-1 font-medium">{label}</p>
    </div>
  )
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-[#78716c] dark:text-[#a8a29e] mb-1">{label}</p>
      <p className="text-sm font-semibold text-[#1c1917] dark:text-[#fafaf9]">{value}</p>
    </div>
  )
}

function OperacionCard({ destino, bandera, cabezas, porcentaje, estado }: {
  destino: string; bandera: string; cabezas: string; porcentaje: number; estado: string
}) {
  const isActivo = estado === 'Activo'
  return (
    <div className="p-4 rounded-xl bg-[#f5f5f4] dark:bg-[#292524] border border-[#e7e5e4] dark:border-[#44403c]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{bandera}</span>
          <p className="text-sm font-bold text-[#1c1917] dark:text-[#fafaf9]">{destino}</p>
        </div>
        <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${isActivo ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'bg-[#fef3c7] dark:bg-[#92400e]/20 text-[#b45309] dark:text-[#fcd34d]'}`}>
          {estado}
        </span>
      </div>
      <p className="text-lg font-extrabold text-[#b45309] dark:text-[#fcd34d]">{cabezas}</p>
      <p className="text-xs text-[#78716c] dark:text-[#a8a29e] mb-2">cabezas / año</p>
      <div className="h-1.5 bg-[#e7e5e4] dark:bg-[#44403c] rounded-full overflow-hidden">
        <div className="h-full bg-[#b45309] dark:bg-[#fcd34d] rounded-full" style={{ width: `${porcentaje}%` }} />
      </div>
      <p className="text-[10px] text-[#78716c] dark:text-[#a8a29e] mt-1">{porcentaje}% del volumen total</p>
    </div>
  )
}

function EnvioRow({ lote, destino, cabezas, fecha, estado }: {
  lote: string; destino: string; cabezas: string; fecha: string; estado: string
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-[#fafaf9] dark:hover:bg-[#292524] transition-all">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-[#1c1917] dark:text-[#fafaf9]">{lote}</p>
        <p className="text-xs text-[#78716c] dark:text-[#a8a29e] truncate">{destino}</p>
      </div>
      <span className="text-xs font-semibold text-[#b45309] dark:text-[#fcd34d] whitespace-nowrap">{cabezas} cab.</span>
      <span className="text-xs text-[#78716c] dark:text-[#a8a29e] whitespace-nowrap hidden sm:block">{fecha}</span>
      <span className="text-[10px] px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 font-bold whitespace-nowrap">{estado}</span>
    </div>
  )
}

function CertCard({ nombre, numero, vencimiento, estado, icon }: {
  nombre: string; numero: string; vencimiento: string; estado: 'vigente' | 'por-vencer' | 'vencido'; icon: React.ReactNode
}) {
  const estilos = {
    vigente: { badge: 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400', label: 'Vigente', dot: 'bg-green-500' },
    'por-vencer': { badge: 'bg-[#fef3c7] dark:bg-[#92400e]/20 text-[#b45309] dark:text-[#fcd34d]', label: 'Por Vencer', dot: 'bg-[#f59e0b]' },
    vencido: { badge: 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400', label: 'Vencido', dot: 'bg-red-500' },
  }
  const s = estilos[estado]
  return (
    <div className="flex items-start gap-3 p-4 rounded-xl bg-[#f5f5f4] dark:bg-[#292524] border border-[#e7e5e4] dark:border-[#44403c] hover:bg-[#e7e5e4] dark:hover:bg-[#44403c] transition-all">
      <div className="w-10 h-10 rounded-lg bg-white dark:bg-[#1c1917] flex items-center justify-center text-[#b45309] flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className="text-xs font-bold text-[#1c1917] dark:text-[#fafaf9] leading-tight">{nombre}</p>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex-shrink-0 flex items-center gap-1 ${s.badge}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
            {s.label}
          </span>
        </div>
        <p className="text-xs text-[#78716c] dark:text-[#a8a29e]">{numero}</p>
        <p className="text-xs text-[#78716c] dark:text-[#a8a29e]">Vence: {vencimiento}</p>
      </div>
    </div>
  )
}

function KPICard({ label, value, change, trend, good, bars }: {
  label: string; value: string; change: string; trend: 'up' | 'down'; good: boolean; bars: number[]
}) {
  const isPositive = (trend === 'up' && good) || (trend === 'down' && good)
  const badgeClass = isPositive
    ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
    : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'

  return (
    <div className="border-l border-[#e7e5e4] dark:border-[#292524] pl-6 first:border-l-0 first:pl-0">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-xs font-medium text-[#78716c] dark:text-[#a8a29e] mb-2">{label}</p>
          <p className="text-2xl md:text-3xl font-extrabold text-[#1c1917] dark:text-[#fafaf9]">{value}</p>
        </div>
        <span className={`px-2.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 ${badgeClass}`}>
          {trend === 'up' ? '↑' : '↓'} {change}
        </span>
      </div>
      <div className="h-12 flex items-end gap-1">
        {bars.map((h, i) => (
          <div key={i} className="flex-1 bg-gradient-to-t from-[#b45309] to-[#fde68a] dark:to-[#fcd34d] rounded-t" style={{ height: `${h}%` }} />
        ))}
      </div>
    </div>
  )
}


function DirectivoItem({ nombre, cargo, gradient }: { nombre: string; cargo: string; gradient: string }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#f5f5f4] dark:hover:bg-[#292524] transition-all cursor-pointer">
      <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold flex-shrink-0`}>
        {nombre.charAt(0)}
      </div>
      <div>
        <p className="text-sm font-bold text-[#1c1917] dark:text-[#fafaf9]">{nombre}</p>
        <p className="text-xs text-[#b45309] dark:text-[#fcd34d] font-semibold">{cargo}</p>
      </div>
    </div>
  )
}

function ProveedorItem({ nombre, estado, cabezas, clase }: {
  nombre: string; estado: string; cabezas: string; clase: 'A' | 'B' | 'C'
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-[#f5f5f4] dark:bg-[#292524] hover:bg-[#e7e5e4] dark:hover:bg-[#44403c] transition-all cursor-pointer">
      <div className="w-2 h-2 rounded-full bg-[#b45309] flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-[#1c1917] dark:text-[#fafaf9] truncate">{nombre}</p>
        <p className="text-xs text-[#78716c] dark:text-[#a8a29e]">{estado} • {cabezas} cab.</p>
      </div>
      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex-shrink-0 ${clase === 'A' ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'bg-[#fef3c7] dark:bg-[#92400e]/20 text-[#b45309] dark:text-[#fcd34d]'}`}>
        Clase {clase}
      </span>
    </div>
  )
}

function CruceItem({ ciudad, destino, activo }: { ciudad: string; destino: string; activo: boolean }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-[#f5f5f4] dark:bg-[#292524] hover:bg-[#e7e5e4] dark:hover:bg-[#44403c] transition-all">
      <div className="w-8 h-8 rounded-lg bg-[#fef3c7] dark:bg-[#92400e]/20 flex items-center justify-center text-[#b45309] flex-shrink-0">
        <FronteraSmIcon />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-[#1c1917] dark:text-[#fafaf9] truncate">{ciudad}</p>
        <p className="text-xs text-[#78716c] dark:text-[#a8a29e] truncate">→ {destino}</p>
      </div>
      {activo && <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />}
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

function GlobeCorpIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  )
}

const MapPinIcon = () => (
  <svg className="w-4 h-4 text-[#b45309]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
  </svg>
)
const CalendarIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
  </svg>
)
const RegistroIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
  </svg>
)
const LicenciaIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
)
const CattleStatIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
  </svg>
)
const GlobeStatIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
)
const DollarStatIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
)
const CalendarStatIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
)
const BuildingCardIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="4" y="2" width="16" height="20" rx="2" /><path d="M9 22v-4h6v4" /><path d="M8 6h.01" /><path d="M16 6h.01" /><path d="M12 6h.01" /><path d="M12 10h.01" /><path d="M12 14h.01" />
  </svg>
)
const TruckCardIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
  </svg>
)
const BadgeCardIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
  </svg>
)
const ChartCardIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
  </svg>
)
const ActivityCardIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
)
const UsersCardIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)
const ProveedoresIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
  </svg>
)
const FronteraIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" /><line x1="8" y1="2" x2="8" y2="18" /><line x1="16" y1="6" x2="16" y2="22" />
  </svg>
)
const FronteraSmIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="5 12 19 12" /><polyline points="13 6 19 12 13 18" />
  </svg>
)
const ContactCardIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
)
const PhoneIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
)
const MailIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
  </svg>
)
const GlobeIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
)
const ClockIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
)

export default PerfilExportador