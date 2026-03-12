/**
 * artifactEngine/mockData.ts
 *
 * Datos simulados centralizados para todos los artefactos.
 * Cada constante está tipada con el tipo real del widget que la consume.
 *
 * ── Para pasar a producción ────────────────────────────────────────────────────
 * Reemplazar cada constante por una llamada a Supabase / API:
 *   export const CORRALES = await supabase.from('corrales').select()
 * El resto del sistema (hook, widgetMap, simulador) no cambia.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { Corral } from '../../../artifacts/monitoring/widgets/MapaVistaGeneralWidget'

type CorralExt = Corral & { anchoM: number; largoM: number }

import type { Camara } from '../../../artifacts/monitoring/widgets/CamaraListaWidget'
import type { Anomalia } from '../../../artifacts/monitoring/widgets/AnomaliaFeedWidget'

// ─── FICHA GANADERA ───────────────────────────────────────────────────────────

export interface PassportData {
  nombre: string
  siniiga: string
  rfid: string
  raza: string
  sexo: string
  peso: string
  nacimiento: string
  upp: string
  propietario: string
  exportLabel: string
  verificado: string
  estatus: string
  mrz: [string, string]
}

export const MOCK_PASSPORT: PassportData = {
  nombre: 'Lupita',
  siniiga: 'MX-NL-2024-000142',
  rfid: '900115000234821',
  raza: 'Simmental',
  sexo: 'Hembra',
  peso: '485 kg',
  nacimiento: '14 Mar 2021',
  upp: 'UPP Rancho Morales',
  propietario: 'Carlos Morales Hdez.',
  exportLabel: 'Elegible EEUU · TIF',
  verificado: 'SENASICA · 2024',
  estatus: 'ACTIVO',
  mrz: [
    'MXBOV<<LUPITA<<<<<<<<<<<<<<<<<<<<<<<<<<<',
    'MXN000142<3NL20210314F0000000MX<<<<<<<<',
  ],
}

// ─── CORRALES ─────────────────────────────────────────────────────────────────
export const CORRALES: CorralExt[] = [
  { id: 1, label: 'A1', animales: 42, capacidad: 50, estado: 'normal', temp: 22.1, humedad: 58, camara: true, lat: 24.1540, lng: -104.6045, anchoM: 65, largoM: 85 },
  { id: 2, label: 'A2', animales: 38, capacidad: 50, estado: 'normal', temp: 23.4, humedad: 60, camara: true, lat: 24.1530, lng: -104.5995, anchoM: 65, largoM: 85 },
  { id: 3, label: 'B1', animales: 47, capacidad: 50, estado: 'atencion', temp: 26.7, humedad: 55, camara: false, lat: 24.1500, lng: -104.5970, anchoM: 80, largoM: 100 },
  { id: 4, label: 'B2', animales: 15, capacidad: 50, estado: 'normal', temp: 21.2, humedad: 62, camara: true, lat: 24.1550, lng: -104.6065, anchoM: 55, largoM: 75 },
  { id: 5, label: 'C1', animales: 50, capacidad: 50, estado: 'cuarentena', temp: 24.3, humedad: 57, camara: true, lat: 24.1470, lng: -104.6010, anchoM: 75, largoM: 95 },
  { id: 6, label: 'C2', animales: 33, capacidad: 50, estado: 'normal', temp: 22.8, humedad: 59, camara: false, lat: 24.1480, lng: -104.5950, anchoM: 60, largoM: 80 },
]

export const CORRAL_DETALLE: Corral = CORRALES[2]

// ─── CÁMARAS ──────────────────────────────────────────────────────────────────
export const CAMARAS: Camara[] = [
  { id: 1, label: 'CAM-01', corral: 'A1', estado: 'online', detectados: 42, inventario: 42, fps: 24 },
  { id: 2, label: 'CAM-02', corral: 'A2', estado: 'online', detectados: 37, inventario: 38, fps: 18 },
  { id: 3, label: 'CAM-03', corral: 'B1', estado: 'offline', detectados: 0, inventario: 47, fps: 0 },
  { id: 4, label: 'CAM-04', corral: 'B2', estado: 'online', detectados: 15, inventario: 15, fps: 24 },
  { id: 5, label: 'CAM-05', corral: 'C1', estado: 'online', detectados: 50, inventario: 50, fps: 30 },
  { id: 6, label: 'CAM-06', corral: 'C2', estado: 'offline', detectados: 0, inventario: 33, fps: 0 },
]

export const CAMARA_ACTIVA: Camara = CAMARAS[0]

// ─── ANOMALÍAS ────────────────────────────────────────────────────────────────
export const ANOMALIAS: Anomalia[] = [
  { id: 1, ts: 'hace 12 min', animal: '#0247', corral: 'B1', tipo: 'Separación del hato', severidad: 'alta', resuelto: false },
  { id: 2, ts: 'hace 34 min', animal: '#0183', corral: 'C1', tipo: 'Sin ingesta registrada', severidad: 'media', resuelto: false },
  { id: 3, ts: 'hace 2 hrs', animal: '#0091', corral: 'A2', tipo: 'Movimiento reducido', severidad: 'media', resuelto: true },
]

export const ANOMALIA_DETALLE: Anomalia = ANOMALIAS[0]

// ─── SENSOR STATS ─────────────────────────────────────────────────────────────
export const SENSOR_STATS = [
  { corral: 'A1', detectados: 42, inventario: 42, match: 100, activo: true },
  { corral: 'A2', detectados: 37, inventario: 38, match: 97, activo: true },
  { corral: 'B1', detectados: 45, inventario: 47, match: 96, activo: true },
  { corral: 'B2', detectados: 15, inventario: 15, match: 100, activo: true },
  { corral: 'C1', detectados: 50, inventario: 50, match: 100, activo: true },
  { corral: 'C2', detectados: 0, inventario: 33, match: 0, activo: false },
]

// ─── BIOMETRÍA ────────────────────────────────────────────────────────────────
import type { RegistroCaptura } from '../../../artifacts/biometria/widgets/BiometriaHistorialWidget'

export const MOCK_REGISTROS_BIOMETRIA: RegistroCaptura[] = [
  { id: 1, ts: 'hace 5 min', animal: 'Lupita', arete: '#0142', lote: 'A1', score: 0.94, resultado: 'match', modo: 'direct', confirmado: true },
  { id: 2, ts: 'hace 18 min', animal: 'Canela', arete: '#0089', lote: 'B2', score: 0.83, resultado: 'candidato', modo: 'direct', confirmado: false },
  { id: 3, ts: 'hace 31 min', animal: 'Presumida', arete: '#0203', lote: 'A1', score: 0.91, resultado: 'match', modo: 'sheet', confirmado: true },
  { id: 4, ts: 'hace 1 hr', animal: '—', arete: '—', lote: '—', score: 0, resultado: 'nuevo', modo: 'direct', confirmado: false },
]

// ─── GEMELO DIGITAL ───────────────────────────────────────────────────────────
import type { EventoTimeline } from '../../../artifacts/twins/widgets/TwinsTimelineWidget'
import type { Auditoria } from '../../../artifacts/twins/widgets/TwinsFeedWidget'
import type { DatosAlimentacion } from '../../../artifacts/twins/widgets/TwinsAlimentacionWidget'
import type { AnimalPerfil } from '../../../artifacts/twins/widgets/TwinsHeroWidget'
import type { RegistroPeso } from '../../../artifacts/twins/widgets/TwinsPesoWidget'

export { MOCK_EVENTOS_TWINS as MOCK_MOVILIZACIONES }

export const MOCK_PERFIL_TWINS: AnimalPerfil = {
  arete: 'EJM-892',
  nombre: 'Lupita',
  raza: 'Charolais × Suizo Europeo',
  sexo: 'Hembra',
  edadMeses: 24,
  lote: 'Lote 4',
  corral: 'Corral 1',
  upp: 'UPP San Jacinto',
  pesoActual: 437,
  pesoNacimiento: 38,
  pesoMeta: 500,
  gananciaDiaria: 0.82,
  estado: 'engorda',
  alertas: 1,
}

export const MOCK_PESOS_TWINS: RegistroPeso[] = [
  { fecha: '02 MAR 24', peso: 38, objetivo: 38 },
  { fecha: '01 JUN 24', peso: 120, objetivo: 115 },
  { fecha: '01 SEP 24', peso: 210, objetivo: 200 },
  { fecha: '01 DIC 24', peso: 298, objetivo: 295 },
  { fecha: '01 FEB 25', peso: 340, objetivo: 345 },
  { fecha: '01 MAY 25', peso: 385, objetivo: 390 },
  { fecha: '01 AGO 25', peso: 410, objetivo: 430 },
  { fecha: '01 NOV 25', peso: 425, objetivo: 460 },
  { fecha: '24 FEB 26', peso: 437, objetivo: 480 },
]

export const MOCK_EVENTOS_TWINS: EventoTimeline[] = [
  { id: 1, fecha: '18 FEB 26', tipo: 'movilizacion', titulo: 'Traslado a Corral 1 — Engorda final', detalle: 'Movimiento autorizado por operador campo. Registro REEMO pendiente de firma digital del MVZ.', valor: 'Corral 2 → Corral 1', cert: 'parcial', ubicacion: 'Corral 1' },
  { id: 2, fecha: '10 FEB 26', tipo: 'pesaje', titulo: 'Pesaje semanal', valor: '437 kg · +12 kg vs semana anterior', cert: 'completa', ubicacion: 'Báscula A' },
  { id: 3, fecha: '02 FEB 26', tipo: 'vacunacion', titulo: 'Vacunación anual 2026', detalle: 'Protocolo anual complejo viral-clostridial. Dosis: 2 ml IM. Fotografía pendiente.', valor: 'Dosis 2 ml IM', cert: 'pendiente', ubicacion: 'Manga Corral 1' },
  { id: 4, fecha: '17 ENE 26', tipo: 'pesaje', titulo: 'Pesaje mensual', valor: '425 kg', cert: 'completa', ubicacion: 'Báscula A' },
  { id: 5, fecha: '14 ENE 26', tipo: 'auditoria', titulo: 'Auditoría sanitaria SENASICA', detalle: 'Campaña Nacional TB y Brucelosis 2024–2025. Resultado negativo. Firma MVZ registrada.', valor: 'Resultado negativo', cert: 'completa', ubicacion: 'UPP San Jacinto' },
  { id: 6, fecha: '10 NOV 25', tipo: 'movilizacion', titulo: 'Traslado a Corral 2 — Cambio de etapa', valor: 'Corral 3 → Corral 2', cert: 'completa', ubicacion: 'Corral 2' },
  { id: 7, fecha: '15 OCT 25', tipo: 'tratamiento', titulo: 'Tratamiento antiparasitario', detalle: 'Ivermectina 1% subcutánea. Dosis: 4.4 ml. Sin periodo de retiro activo.', valor: 'Ivermectina 4.4 ml SC', cert: 'completa', ubicacion: 'Manga Corral 2' },
  { id: 8, fecha: '02 MAR 24', tipo: 'movilizacion', titulo: 'Ingreso — Destete maternidad', valor: 'Maternidad → Corral 3', cert: 'completa', ubicacion: 'Corral 3' },
]

export const MOCK_AUDITORIAS_TWINS: Auditoria[] = [
  {
    id: 1,
    nombre: 'Auditoría sanitaria · SENASICA', sub: 'Campaña TB y Brucelosis 2024–2025',
    fecha: '14 ENE 2026', estado: 'aprobado',
    pills: [
      { label: 'Foto vacunación', ok: true },
      { label: 'Firma MVZ digital', ok: true },
      { label: 'SINIIGA verificado', ok: true },
      { label: 'Resultado negativo', ok: true },
    ],
    hash: '0x3fa8c219…d7c291 · IPFS · verificado', hashOk: true,
  },
  {
    id: 2,
    nombre: 'Verificación de inventario · UPP', sub: 'Conteo biométrico Corral 1',
    fecha: '17 FEB 2026', estado: 'coincide',
    pills: [
      { label: 'Lectura biométrica', ok: true },
      { label: 'Foto corral', ok: true },
      { label: 'GPS registrado', ok: true },
    ],
    hash: '0xb11d9a4c…f7e004 · IPFS · verificado', hashOk: true,
  },
  {
    id: 3,
    nombre: 'Registro vacunación 2026', sub: 'Protocolo anual · Operador en campo',
    fecha: '02 FEB 2026', estado: 'incompleto',
    pills: [
      { label: 'Registro manual', ok: true },
      { label: 'Sin fotografía', ok: false },
      { label: 'Firma pendiente', ok: false },
    ],
    hash: 'Sin indexar · evidencia incompleta', hashOk: false,
  },
]

export const MOCK_ALIMENTACION_TWINS: DatosAlimentacion = {
  semanas: [
    { fecha: '24 FEB', forraje: 95, concentrado: 88, suplemento: 62 },
    { fecha: '17 FEB', forraje: 92, concentrado: 91, suplemento: 84 },
    { fecha: '10 FEB', forraje: 97, concentrado: 93, suplemento: 89 },
    { fecha: '03 FEB', forraje: 90, concentrado: 85, suplemento: 91 },
  ],
  caActual: 6.8,
  caObjetivo: 7.1,
  caIndustria: 8.2,
  proyDias: 38,
  proyFecha: '08 ABR 2026',
  pesoMeta: 500,
  pesoActual: 437,
}

// ─── CERTIFICACIÓN ────────────────────────────────────────────────────────────
import type { DatosElegibilidad } from '../../../artifacts/certification/widgets/CertificationElegibilidadWidget'
import type { DatosChecklist } from '../../../artifacts/certification/widgets/CertificationChecklistWidget'
import type { DatosCertCard } from '../../../artifacts/certification/widgets/CertificationCardWidget'
import type { DatosDocumentos } from '../../../artifacts/certification/widgets/CertificationDocumentosWidget'
import type { Vencimiento } from '../../../artifacts/certification/widgets/CertificationVencimientosWidget'

export const MOCK_ELEGIBILIDAD: DatosElegibilidad = {
  animal: 'Lupita',
  arete: 'EJM-892',
  lote: 'Lote 4',
  tipoCert: 'Elegibilidad USDA · Exportación EE.UU.',
  estado: 'casi',
  score: 74,
  dominios: [
    {
      dominio: 'pasaporte', label: 'Pasaporte', ok: true,
      items: [
        { texto: 'Arete RFID', ok: true },
        { texto: 'Biometría morro', ok: true },
        { texto: 'Foto oficial', ok: true },
        { texto: 'SINIIGA verificado', ok: true },
      ],
    },
    {
      dominio: 'gemelo', label: 'Gemelo Digital', ok: false,
      items: [
        { texto: 'TB negativo', ok: true },
        { texto: 'Brucelosis negativo', ok: true },
        { texto: 'Vacunación 2026', ok: false, critico: false },
        { texto: 'Firma MVZ', ok: false, critico: true },
        { texto: 'REEMO firmado', ok: true },
      ],
    },
    {
      dominio: 'monitoreo', label: 'Monitoreo', ok: true,
      items: [
        { texto: 'Sin anomalías activas', ok: true },
        { texto: 'Corral sin cuarentena', ok: true },
        { texto: 'Comportamiento normal', ok: true },
      ],
    },
    {
      dominio: 'sanidad', label: 'Sanidad', ok: true,
      items: [
        { texto: 'Zona sin riesgo activo', ok: true },
        { texto: 'Protocolo gusano ok', ok: true },
      ],
    },
  ],
  bloqueantes: [],
  pendientes: [
    'Foto de vacunación 2026 no adjunta',
    'Firma digital del MVZ pendiente en evento 02-FEB',
  ],
  fechaCorte: '30 ABR 2026',
}

export const MOCK_ELEGIBILIDAD_BLOQUEADO: DatosElegibilidad = {
  animal: 'Canela',
  arete: '#0089',
  lote: 'Lote 2',
  tipoCert: 'Elegibilidad USDA · Exportación EE.UU.',
  estado: 'bloqueado',
  score: 31,
  dominios: [
    {
      dominio: 'pasaporte', label: 'Pasaporte', ok: true,
      items: [
        { texto: 'Arete RFID', ok: true },
        { texto: 'Biometría morro', ok: false, critico: false },
        { texto: 'Foto oficial', ok: true },
      ],
    },
    {
      dominio: 'gemelo', label: 'Gemelo Digital', ok: false,
      items: [
        { texto: 'TB negativo', ok: false, critico: true },
        { texto: 'Brucelosis negativo', ok: false, critico: true },
        { texto: 'REEMO firmado', ok: true },
      ],
    },
    {
      dominio: 'monitoreo', label: 'Monitoreo', ok: false,
      items: [
        { texto: 'Corral en cuarentena', ok: false, critico: true },
        { texto: 'Anomalía activa', ok: false, critico: true },
      ],
    },
    {
      dominio: 'sanidad', label: 'Sanidad', ok: true,
      items: [
        { texto: 'Zona sin riesgo activo', ok: true },
      ],
    },
  ],
  bloqueantes: [
    'Corral B2 en cuarentena activa — no se puede certificar hasta levantar cuarentena',
    'Resultados de TB y Brucelosis no registrados en el gemelo digital',
  ],
  pendientes: [],
}

export const MOCK_CHECKLIST: DatosChecklist = {
  tipoCert: 'Elegibilidad USDA · Exportación EE.UU.',
  autoridad: 'USDA APHIS',
  animal: 'Lupita',
  arete: 'EJM-892',
  requisitos: [
    { id: 'rfid', categoria: 'identidad', label: 'Arete RFID activo', desc: 'Número de arete registrado y verificado en SINIIGA', estado: 'ok', fuente: 'Pasaporte' },
    { id: 'siniiga', categoria: 'identidad', label: 'SINIIGA verificado', desc: 'Animal confirmado en base de datos nacional', estado: 'ok', fuente: 'Pasaporte' },
    { id: 'biometria', categoria: 'identidad', label: 'Biometría de morro', desc: 'Huella de morro capturada y vinculada al pasaporte', estado: 'ok', fuente: 'Biometría' },
    { id: 'tb', categoria: 'sanitario', label: 'Tuberculosis negativo', desc: 'Resultado oficial TB < 12 meses', estado: 'ok', fuente: 'Gemelo Digital' },
    { id: 'brucela', categoria: 'sanitario', label: 'Brucelosis negativo', desc: 'Resultado oficial Brucelosis < 12 meses', estado: 'ok', fuente: 'Gemelo Digital' },
    { id: 'vacuna', categoria: 'sanitario', label: 'Vacunación anual 2026', desc: 'Protocolo viral-clostridial con firma MVZ', estado: 'pendiente', fuente: 'Gemelo Digital', accion: 'Registrar' },
    { id: 'foto_vac', categoria: 'documental', label: 'Fotografía de vacunación', desc: 'Foto del evento de vacunación adjunta al gemelo', estado: 'faltante', fuente: 'Gemelo Digital', accion: 'Subir foto' },
    { id: 'firma_mvz', categoria: 'documental', label: 'Firma digital MVZ', desc: 'Firma electrónica del MVZ responsable en el evento', estado: 'faltante', fuente: 'Gemelo Digital', accion: 'Solicitar' },
    { id: 'reemo', categoria: 'documental', label: 'Guía REEMO firmada', desc: 'Última movilización con guía oficial firmada', estado: 'ok', fuente: 'Gemelo Digital' },
    { id: 'foto_of', categoria: 'documental', label: 'Fotografías oficiales', desc: 'Fotos de frente y perfil en pasaporte', estado: 'ok', fuente: 'Pasaporte' },
    { id: 'upp_legal', categoria: 'legal', label: 'UPP con estatus legal vigente', desc: 'La UPP no tiene alertas legales activas', estado: 'ok', fuente: 'Sistema' },
    { id: 'exportador', categoria: 'legal', label: 'Exportador autorizado', desc: 'Entidad exportadora en lista aprobados SENASICA', estado: 'ok', fuente: 'Sistema' },
  ],
}

export const MOCK_CERT_CARDS: DatosCertCard[] = [
  {
    id: 'cert-001', tipo: 'Certificado Sanitario TB/Brucela', autoridad: 'SENASICA',
    animal: 'Lupita', arete: 'EJM-892', lote: 'Lote 4',
    estado: 'vigente', folio: 'CSN-2025-03847',
    fechaEmision: '14 ENE 2026', fechaVence: '14 ENE 2027',
    diasParaVencer: 313, completitud: 100, expedidor: 'MVZ Carlos Mendoza',
  },
  {
    id: 'cert-002', tipo: 'Elegibilidad USDA · Exportación', autoridad: 'USDA APHIS',
    animal: 'Lupita', arete: 'EJM-892', lote: 'Lote 4',
    estado: 'en_proceso', completitud: 74, expedidor: 'Expediente en preparación',
  },
  {
    id: 'cert-003', tipo: 'Certificado Sanitario TB/Brucela', autoridad: 'SENASICA',
    animal: 'Canela', arete: '#0089', lote: 'Lote 2',
    estado: 'por_vencer', folio: 'CSN-2025-02113',
    fechaEmision: '20 MAR 2025', fechaVence: '20 MAR 2026',
    diasParaVencer: 14, completitud: 100, expedidor: 'MVZ Carlos Mendoza',
  },
]

export const MOCK_DOCUMENTOS: DatosDocumentos = {
  animal: 'Lupita', arete: 'EJM-892', tipoCert: 'Elegibilidad USDA', completitud: 74,
  documentos: [
    { id: 1, tipo: 'resultado_lab', nombre: 'Resultado TB · SENASICA', estado: 'ok', fecha: '14 ENE 2026', emisor: 'SENASICA', hash: '0x3fa8c219…d7c291', hashOk: true, critico: true },
    { id: 2, tipo: 'resultado_lab', nombre: 'Resultado Brucelosis · SENASICA', estado: 'ok', fecha: '14 ENE 2026', emisor: 'SENASICA', hash: '0xb11d9a4c…f7e004', hashOk: true, critico: true },
    { id: 3, tipo: 'identificacion', nombre: 'Registro SINIIGA · EJM-892', estado: 'ok', fecha: '02 MAR 2024', emisor: 'SINIIGA Nacional', critico: true },
    { id: 4, tipo: 'foto_oficial', nombre: 'Fotografías oficiales · Pasaporte', estado: 'ok', fecha: '02 MAR 2024', critico: false },
    { id: 5, tipo: 'reemo', nombre: 'Guía REEMO · Traslado 18 FEB', estado: 'ok', fecha: '18 FEB 2026', emisor: 'Operador campo', hash: '0xc22f1b90…a3d118', hashOk: true, critico: true },
    { id: 6, tipo: 'vacunacion', nombre: 'Protocolo vacunación 2026', estado: 'pendiente', fecha: '02 FEB 2026', emisor: 'Registro manual', critico: false },
    { id: 7, tipo: 'foto_oficial', nombre: 'Fotografía vacunación 2026', estado: 'faltante', critico: false },
    { id: 8, tipo: 'firma_mvz', nombre: 'Firma digital MVZ · Vacunación', estado: 'faltante', emisor: 'MVZ Carlos Mendoza', critico: true },
  ],
}

export const MOCK_VENCIMIENTOS: Vencimiento[] = [
  { id: 1, animal: 'Canela', arete: '#0089', tipoCert: 'Cert. Sanitario TB/Brucela', autoridad: 'SENASICA', fechaVence: '20 MAR 2026', diasRestantes: 14, lote: 'Lote 2' },
  { id: 2, animal: 'Presumida', arete: '#0203', tipoCert: 'Cert. Sanitario TB/Brucela', autoridad: 'SENASICA', fechaVence: '25 MAR 2026', diasRestantes: 19, lote: 'Lote 1' },
  { id: 3, animal: 'Lupita', arete: 'EJM-892', tipoCert: 'Cert. Sanitario TB/Brucela', autoridad: 'SENASICA', fechaVence: '14 ENE 2027', diasRestantes: 313, lote: 'Lote 4' },
  { id: 4, animal: '#0183', arete: '#0183', tipoCert: 'Elegibilidad USDA', autoridad: 'USDA APHIS', fechaVence: '02 MAR 2026', diasRestantes: -4 },
]

// ─── VERIFICACIÓN ─────────────────────────────────────────────────────────────
import type { ItemVerificacion } from '../../../artifacts/verification/widgets/VerificationColaWidget'
import type { ItemHistorial } from '../../../artifacts/verification/widgets/VerificationHistorialWidget'
import type { Inconsistencia } from '../../../artifacts/verification/widgets/VerificationInconsistenciasWidget'

export const MOCK_VERIFICATION_COLA: ItemVerificacion[] = [
  { id: 1, ts: 'hace 12 min', origen: 'ia', actor: 'IA Perception v7.4', dominio: 'monitoreo', accion: 'Separación del hato detectada · Corral B1', animal: 'Ejemplar #0247', arete: '#0247', severidad: 'alta', estado: 'pendiente' },
  { id: 2, ts: 'hace 3 días', origen: 'usuario', actor: 'Operador campo', dominio: 'gemelo', accion: 'Registro de vacunación 2026 sin firma ni foto', animal: 'Lupita', arete: 'EJM-892', severidad: 'alta', estado: 'pendiente' },
  { id: 3, ts: 'hace 34 min', origen: 'ia', actor: 'IA Perception v7.4', dominio: 'monitoreo', accion: 'Sin ingesta registrada · Corral C1', animal: 'Ejemplar #0183', arete: '#0183', severidad: 'media', estado: 'pendiente' },
  { id: 4, ts: 'hace 1 hr', origen: 'ia', actor: 'Motor Fingerprint CV', dominio: 'biometria', accion: 'Identificación biométrica con confianza baja (0.83)', animal: 'Canela', arete: '#0089', severidad: 'media', estado: 'pendiente' },
  { id: 5, ts: 'hace 2 hrs', origen: 'usuario', actor: 'MVZ Carlos Mendoza', dominio: 'certificacion', accion: 'Score de elegibilidad USDA recalculado a 74/100', animal: 'Lupita', arete: 'EJM-892', severidad: 'baja', estado: 'pendiente' },
]

export const MOCK_VERIFICATION_ITEM: ItemVerificacion = MOCK_VERIFICATION_COLA[0]

export const MOCK_VERIFICATION_HISTORIAL: ItemHistorial[] = [
  { id: 1, ts: 'hace 2 hrs', tsFormal: '07 MAR 2026 · 12:14', origen: 'ia', actor: 'IA Perception v7.4', verificador: 'MVZ Carlos Mendoza', accion: 'Anomalía resuelta · Movimiento reducido Corral A2', animal: 'Ejemplar #0091', arete: '#0091', dominio: 'monitoreo', resultado: 'verificado', observacion: 'Animal revisado en campo. Sin patología aparente.' },
  { id: 2, ts: 'ayer · 18:32', tsFormal: '06 MAR 2026 · 18:32', origen: 'usuario', actor: 'Operador campo', verificador: 'MVZ Carlos Mendoza', accion: 'Pesaje semanal Lupita — 437 kg', animal: 'Lupita', arete: 'EJM-892', dominio: 'gemelo', resultado: 'verificado' },
  { id: 3, ts: 'ayer · 14:10', tsFormal: '06 MAR 2026 · 14:10', origen: 'ia', actor: 'Motor Fingerprint CV', verificador: 'Auditor Flores', accion: 'Identificación biométrica — score 0.71', animal: 'Desconocido', arete: '—', dominio: 'biometria', resultado: 'rechazado', observacion: 'Score por debajo del umbral mínimo. Repetir captura.' },
  { id: 4, ts: 'ayer · 10:05', tsFormal: '06 MAR 2026 · 10:05', origen: 'usuario', actor: 'MVZ Carlos Mendoza', verificador: 'Auditor Flores', accion: 'Resultado TB negativo registrado · SENASICA', animal: 'Lupita', arete: 'EJM-892', dominio: 'certificacion', resultado: 'verificado' },
]

export const MOCK_VERIFICATION_INCONSISTENCIAS: Inconsistencia[] = [
  { id: 1, tipo: 'sin_verificar', tiempoSinAtencion: '3 días', accion: 'Registro de vacunación 2026 sin firma ni foto', actor: 'Operador campo', dominio: 'gemelo', animal: 'Lupita', arete: 'EJM-892', detalle: 'Este registro bloquea la elegibilidad USDA. Lleva 3 días sin ser verificado por ningún usuario autorizado.', critico: true },
  { id: 2, tipo: 'rechazado_sin_seguimiento', tiempoSinAtencion: '22 hrs', accion: 'Identificación biométrica rechazada — sin nueva captura', actor: 'Motor Fingerprint CV', dominio: 'biometria', animal: 'Desconocido', arete: '—', detalle: 'La captura fue rechazada por baja confianza (0.71) pero nadie ha repetido el procedimiento.', critico: false },
  { id: 3, tipo: 'conflicto', tiempoSinAtencion: '1 día', accion: 'Conteo biométrico C2 vs inventario SINIIGA — diferencia de 4 animales', actor: 'IA Perception v7.4', dominio: 'monitoreo', detalle: 'La IA detectó 29 animales en C2 pero el inventario registra 33. La cámara CAM-06 está offline y puede estar afectando el conteo.', critico: false },
]
// ── Vinculación ───────────────────────────────────────────────────────────────
import type { Vinculacion, VinculacionPendiente, VinculacionHistorial } from '../../../artifacts/artifactTypes'

export const MOCK_VINCULACIONES: Vinculacion[] = [
  { id: 'v-001', entidad: 'MVZ Dr. García Hdez.', tipo: 'sanitario', estado: 'activa', fecha: '10 ENE 2026', expira: null },
  { id: 'v-002', entidad: 'Exportadora Nortecom S.A.', tipo: 'comercial', estado: 'activa', fecha: '20 FEB 2026', expira: null },
  { id: 'v-003', entidad: 'Unión Ganadera Regional DGO', tipo: 'union', estado: 'activa', fecha: '05 MAR 2025', expira: null },
  { id: 'v-004', entidad: 'Auditor SENASICA · Flores', tipo: 'auditoria', estado: 'activa', fecha: '01 MAR 2026', expira: '30 MAR 2026' },
  { id: 'v-005', entidad: 'Frigorífico del Norte S.A.', tipo: 'comercial', estado: 'suspendida', fecha: '15 DIC 2025', expira: null },
]

export const MOCK_VINCULACIONES_PENDIENTES: VinculacionPendiente[] = [
  { id: 'p-001', entidad: 'Exportadora SurAgro Ltda.', tipo: 'comercial', direccion: 'recibida', fecha: 'hace 2 hrs', mensaje: 'Interesados en ganado del lote 4. Solicitamos vinculación comercial.' },
  { id: 'p-002', entidad: 'MVZ Dra. Sánchez Ruiz', tipo: 'sanitario', direccion: 'enviada', fecha: 'hace 1 día', mensaje: null },
  { id: 'p-003', entidad: 'Frigorífico Central S.A.', tipo: 'comercial', direccion: 'recibida', fecha: 'hace 3 días', mensaje: null },
]

export const MOCK_VINCULACIONES_HISTORIAL: VinculacionHistorial[] = [
  { id: 'h-001', entidad: 'Auditor IMPI · Reyes', tipo: 'auditoria', estado: 'expirada', fechaInicio: '01 ENE 2026', fechaFin: '28 FEB 2026', motivo: 'Auditoría completada, plazo vencido' },
  { id: 'h-002', entidad: 'Frigorífico del Norte S.A.', tipo: 'comercial', estado: 'revocada', fechaInicio: '15 DIC 2025', fechaFin: '14 FEB 2026', motivo: 'Incumplimiento de términos comerciales' },
  { id: 'h-003', entidad: 'MVZ Dr. García Hdez.', tipo: 'sanitario', estado: 'aceptada', fechaInicio: '10 ENE 2026', fechaFin: '—', motivo: 'Vinculación activa' },
  { id: 'h-004', entidad: 'Exportadora Nortecom S.A.', tipo: 'comercial', estado: 'aceptada', fechaInicio: '20 FEB 2026', fechaFin: '—', motivo: 'Vinculación activa' },
  { id: 'h-005', entidad: 'Laboratorio Diagnos. Vet.', tipo: 'sanitario', estado: 'rechazada', fechaInicio: '03 ENE 2026', fechaFin: '03 ENE 2026', motivo: 'Entidad no reconocida por SENASICA' },
]