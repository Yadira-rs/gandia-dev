/**
 * artifactTypes.ts — Arquitectura de Artefactos Gandia
 *
 * Tres niveles jerárquicos:
 *   Widget  → card inline en el chat
 *   Módulo → panel lateral derecho (split)
 *   Ánima    → pantalla completa con copiloto flotante
 *
 * Cada dominio define qué módulos lo componen.
 */

// ─── DOMINIOS ─────────────────────────────────────────────────────────────────

export type ArtifactDomain =
  | 'passport'       // Ficha Ganadera
  | 'twins'          // Gemelo digital
  | 'monitoring'     // Monitoreo y sensores
  | 'certification'  // Certificaciones
  | 'tramites'        // Trámites SENASICA / REEMO
  | 'verification'   // Verificaciones y auditorías
  | 'sanidad'        // Sanidad y riesgos epidemiológicos
  | 'biometria'      // Identificación por huella de morro
  | 'exportacion'    // Solicitud de aretes de exportación SENASICA
  | 'vinculacion'    // Vinculaciones entre entidades institucionales
  | 'documentos'     // Gestión documental y expedientes

// ─── NIVEL 1 · DORMIDO ────────────────────────────────────────────────────────

export type WidgetArtifactId =
  // Ficha Ganadera
  | 'passport:card'
  | 'passport:perfiles'
  | 'passport:documentos'
  | 'passport:biometria'
  | 'passport:nuevo'
  // Gemelo digital
  | 'twins:timeline'
  | 'twins:feed'
  | 'twins:alimentacion'
  // Monitoring
  | 'monitoring:mapa'
  | 'monitoring:sensor'
  | 'monitoring:anomalia'
  | 'monitoring:trazabilidad'
  | 'monitoring:anomalia:registrar'
  | 'monitoring:caso'
  | 'monitoring:drones'
  | 'monitoring:reporte'
  | 'mapa:corral-detalle'
  | 'anomalia:detalle'
  | 'anomalia:config-umbral'
  | 'camara:lista'
  | 'camara:feed'
  | 'camara:config'
  | 'camara:agregar'
  | 'config:camaras'
  | 'config:corrales'
  | 'sensor:calibracion'
  // Certification
  | 'certification:card'
  // Trámites
  | 'tramites:status'
  | 'tramites:nuevo'
  // Sanidad
  | 'sanidad:gusano'
  // Biometría de morro
  | 'biometria:captura'
  | 'biometria:resultado'
  | 'biometria:historial'
  // Certificación (widgets completos)
  | 'certification:elegibilidad'
  | 'certification:checklist'
  | 'certification:documentos'
  | 'certification:vencimientos'
  // Verificación
  | 'verification:cola'
  | 'verification:item'
  | 'verification:historial'
  | 'verification:inconsistencias'
  // Exportación
  | 'exportacion:solicitud'
  | 'exportacion:tabla'
  | 'exportacion:validacion'
  | 'exportacion:scanner'
  | 'exportacion:export'
  | 'exportacion:historial'
  // Vinculación
  | 'vinculacion:lista'
  | 'vinculacion:pendientes'
  | 'vinculacion:nueva'
  | 'vinculacion:historial'
  // Documentos
  | 'documentos:subida'
  | 'documentos:validacion'
  | 'documentos:expedientes'
  | 'documentos:empacar'
  | 'documentos:revision'
  | 'documentos:panel'

export interface WidgetArtifact {
  kind: 'widget'
  id: WidgetArtifactId
  domain: ArtifactDomain
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any
}

// ─── NIVEL 2 · DESPIERTO ──────────────────────────────────────────────────────

export type ModuleArtifactId =
  // Ficha Ganadera
  | 'passport:full'
  // Gemelo digital
  | 'twins:historial'
  | 'twins:alimentacion'
  // Monitoring
  | 'monitoring:dashboard'
  // Certification
  | 'certification:detail'
  | 'certification:expediente'
  // Trámites
  | 'tramites:detail'
  // Verification
  | 'verification:detail'
  | 'sanidad:detail'
  | 'verification:panel'
  // Biometría de morro
  | 'biometria:dashboard'
  // Exportación
  | 'exportacion:form'
  // Vinculación
  | 'vinculacion:panel'
  // Documentos
  | 'documentos:panel'

export interface ModuleArtifact {
  kind: 'module'
  id: ModuleArtifactId
  domain: ArtifactDomain
  dormants: WidgetArtifactId[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any
}

// ─── NIVEL 3 · ÁNIMA ──────────────────────────────────────────────────────────

export interface AnimaArtifact {
  kind: 'anima'
  domain: ArtifactDomain
  awakes: ModuleArtifactId[]
}

// ─── UNION TYPE ───────────────────────────────────────────────────────────────

export type ArtifactState =
  | WidgetArtifact
  | ModuleArtifact
  | AnimaArtifact
  | null

export type ArtifactLevel = 'widget' | 'module' | 'anima'

// ─── HELPERS ─────────────────────────────────────────────────────────────────

export function getArtifactLevel(state: ArtifactState): ArtifactLevel | null {
  if (!state) return null
  return state.kind
}

export function getArtifactDomain(state: ArtifactState): ArtifactDomain | null {
  if (!state) return null
  return state.domain
}

export function detectArtifactIntent(text: string): WidgetArtifact | null {
  const lower = text.toLowerCase()

  // ── Ficha Ganadera · perfiles / hato ──
  const fichaHatoKw = ['hato', 'lista de animales', 'mis animales', 'ver animales',
    'cuántos animales', 'bovinos registrados', 'inventario animales', 'todos mis bovinos']
  if (fichaHatoKw.some(k => lower.includes(k))) {
    return { kind: 'widget', id: 'passport:perfiles', domain: 'passport' }
  }

  // ── Ficha Ganadera · nueva ──
  const fichaNuevaKw = ['registrar animal', 'nueva ficha', 'crear ficha',
    'dar de alta animal', 'nuevo bovino', 'nuevo animal', 'registrar bovino', 'alta de animal']
  if (fichaNuevaKw.some(k => lower.includes(k))) {
    return { kind: 'widget', id: 'passport:nuevo', domain: 'passport' }
  }

  // ── Ficha Ganadera · huella de morro ──
  const fichaHuellaKw = ['huella de morro', 'biometría de', 'noseprint', 'huella bovina', 'verificar identidad biométrica']
  if (fichaHuellaKw.some(k => lower.includes(k))) {
    return { kind: 'widget', id: 'passport:biometria', domain: 'passport' }
  }

  // ── Ficha Ganadera · documentos ──
  const fichaDocKw = ['documentos del animal', 'papeles del animal', 'certificado de origen',
    'acta de herrado', 'constancia sanitaria', 'documentos de identificación']
  if (fichaDocKw.some(k => lower.includes(k))) {
    return { kind: 'widget', id: 'passport:documentos', domain: 'passport' }
  }

  // ── Ficha Ganadera · card ──
  const passportKw = ['pasaporte', 'passport', 'ficha ganadera', 'ficha del animal', 'ejm', 'siniiga',
    'arete azul', 'trazabilidad', 'expediente', 'bovino', 'exportar animal']
  if (passportKw.some(k => lower.includes(k))) {
    return { kind: 'widget', id: 'passport:card', domain: 'passport' }
  }

  // ── Gemelo / timeline ──
  const twinsTimelineKw = ['gemelo', 'timeline', 'historial', 'cronología', 'línea de tiempo']
  if (twinsTimelineKw.some(k => lower.includes(k))) {
    return { kind: 'widget', id: 'twins:timeline', domain: 'twins' }
  }

  // ── Gemelo / feed ──
  const twinsFeedKw = ['actividad reciente', 'eventos recientes', 'feed']
  if (twinsFeedKw.some(k => lower.includes(k))) {
    return { kind: 'widget', id: 'twins:feed', domain: 'twins' }
  }

  // ── Gemelo / alimentación ──
  const twinsAlimentKw = ['alimentación', 'alimentacion', 'dieta', 'racion', 'ración', 'nutrición', 'nutricion']
  if (twinsAlimentKw.some(k => lower.includes(k))) {
    return { kind: 'widget', id: 'twins:alimentacion', domain: 'twins' }
  }

  // ── Monitoreo · mapa ──
  const monitoreoMapaKw = ['mapa', 'corrales', 'upp', 'distribución', 'inventario upp', 'cuántos corrales']
  if (monitoreoMapaKw.some(k => lower.includes(k))) {
    return { kind: 'widget', id: 'monitoring:mapa', domain: 'monitoring' }
  }

  // ── Monitoreo · sensor ──
  const monitoreoSensorKw = ['sensor', 'cámara', 'camara', 'detección', 'contar animales', 'visión', 'vision ia', 'biometría']
  if (monitoreoSensorKw.some(k => lower.includes(k))) {
    return { kind: 'widget', id: 'monitoring:sensor', domain: 'monitoring' }
  }

  // ── Monitoreo · anomalía ──
  const monitoreoAnomaliaKw = ['anomalía', 'anomalia', 'alerta', 'animal separado', 'comportamiento', 'postura', 'enfermo']
  if (monitoreoAnomaliaKw.some(k => lower.includes(k))) {
    return { kind: 'widget', id: 'monitoring:anomalia', domain: 'monitoring' }
  }

  // ── Sanidad · gusano ──
  const gusanoKw = ['gusano', 'barrenador', 'cochliomyia', 'parásito', 'parasito', 'riesgo sanitario', 'senasica', 'plaga']
  if (gusanoKw.some(k => lower.includes(k))) {
    return { kind: 'widget', id: 'sanidad:gusano', domain: 'sanidad' }
  }

  return null
}

export function widgetToModule(dormantId: WidgetArtifactId): ModuleArtifact {
  const map: Record<WidgetArtifactId, ModuleArtifact> = {
    // Ficha Ganadera
    'passport:card': { kind: 'module', id: 'passport:full', domain: 'passport', dormants: ['passport:card', 'passport:perfiles', 'passport:documentos', 'passport:biometria'] },
    'passport:perfiles': { kind: 'module', id: 'passport:full', domain: 'passport', dormants: ['passport:perfiles', 'passport:card', 'passport:nuevo'] },
    'passport:documentos': { kind: 'module', id: 'passport:full', domain: 'passport', dormants: ['passport:card', 'passport:documentos'] },
    'passport:biometria': { kind: 'module', id: 'passport:full', domain: 'passport', dormants: ['passport:card', 'passport:biometria'] },
    'passport:nuevo': { kind: 'module', id: 'passport:full', domain: 'passport', dormants: ['passport:nuevo'] },
    // Gemelo digital
    'twins:timeline': { kind: 'module', id: 'twins:historial', domain: 'twins', dormants: ['twins:timeline', 'twins:feed'] },
    'twins:feed': { kind: 'module', id: 'twins:historial', domain: 'twins', dormants: ['twins:timeline', 'twins:feed'] },
    'twins:alimentacion': { kind: 'module', id: 'twins:alimentacion', domain: 'twins', dormants: ['twins:alimentacion'] },
    // Monitoring
    'monitoring:mapa':               { kind: 'module', id: 'monitoring:dashboard', domain: 'monitoring', dormants: ['monitoring:mapa', 'monitoring:sensor', 'monitoring:anomalia'] },
    'monitoring:sensor':             { kind: 'module', id: 'monitoring:dashboard', domain: 'monitoring', dormants: ['monitoring:mapa', 'monitoring:sensor', 'monitoring:anomalia'] },
    'monitoring:anomalia':           { kind: 'module', id: 'monitoring:dashboard', domain: 'monitoring', dormants: ['monitoring:mapa', 'monitoring:sensor', 'monitoring:anomalia'] },
    'monitoring:trazabilidad':       { kind: 'module', id: 'monitoring:dashboard', domain: 'monitoring', dormants: ['monitoring:trazabilidad'] },
    'monitoring:anomalia:registrar': { kind: 'module', id: 'monitoring:dashboard', domain: 'monitoring', dormants: ['monitoring:anomalia', 'monitoring:anomalia:registrar'] },
    'monitoring:caso':               { kind: 'module', id: 'monitoring:dashboard', domain: 'monitoring', dormants: ['monitoring:anomalia', 'monitoring:caso'] },
    'monitoring:drones':             { kind: 'module', id: 'monitoring:dashboard', domain: 'monitoring', dormants: ['monitoring:drones'] },
    'monitoring:reporte':            { kind: 'module', id: 'monitoring:dashboard', domain: 'monitoring', dormants: ['monitoring:reporte'] },
    'mapa:corral-detalle':           { kind: 'module', id: 'monitoring:dashboard', domain: 'monitoring', dormants: ['monitoring:mapa', 'mapa:corral-detalle'] },
    'anomalia:detalle':              { kind: 'module', id: 'monitoring:dashboard', domain: 'monitoring', dormants: ['monitoring:anomalia', 'anomalia:detalle'] },
    'anomalia:config-umbral':        { kind: 'module', id: 'monitoring:dashboard', domain: 'monitoring', dormants: ['monitoring:anomalia', 'anomalia:config-umbral'] },
    'camara:lista':                  { kind: 'module', id: 'monitoring:dashboard', domain: 'monitoring', dormants: ['monitoring:sensor', 'camara:lista'] },
    'camara:feed':                   { kind: 'module', id: 'monitoring:dashboard', domain: 'monitoring', dormants: ['monitoring:sensor', 'camara:feed'] },
    'camara:config':                 { kind: 'module', id: 'monitoring:dashboard', domain: 'monitoring', dormants: ['monitoring:sensor', 'camara:config'] },
    'camara:agregar':                { kind: 'module', id: 'monitoring:dashboard', domain: 'monitoring', dormants: ['monitoring:sensor', 'camara:agregar'] },
    'config:camaras':                { kind: 'module', id: 'monitoring:dashboard', domain: 'monitoring', dormants: ['monitoring:sensor', 'config:camaras'] },
    'config:corrales':               { kind: 'module', id: 'monitoring:dashboard', domain: 'monitoring', dormants: ['monitoring:mapa', 'config:corrales'] },
    'sensor:calibracion':            { kind: 'module', id: 'monitoring:dashboard', domain: 'monitoring', dormants: ['monitoring:sensor', 'sensor:calibracion'] },
    'sanidad:gusano': { kind: 'module', id: 'sanidad:detail', domain: 'sanidad', dormants: ['sanidad:gusano'] },
    'certification:card': { kind: 'module', id: 'certification:detail', domain: 'certification', dormants: ['certification:card', 'certification:elegibilidad', 'certification:checklist'] },
    'certification:elegibilidad': { kind: 'module', id: 'certification:detail', domain: 'certification', dormants: ['certification:card', 'certification:elegibilidad', 'certification:checklist'] },
    'certification:checklist': { kind: 'module', id: 'certification:detail', domain: 'certification', dormants: ['certification:checklist', 'certification:documentos'] },
    'certification:documentos': { kind: 'module', id: 'certification:expediente', domain: 'certification', dormants: ['certification:documentos', 'certification:checklist'] },
    'certification:vencimientos': { kind: 'module', id: 'certification:detail', domain: 'certification', dormants: ['certification:vencimientos'] },
    'tramites:status': { kind: 'module', id: 'tramites:detail', domain: 'tramites', dormants: ['tramites:status'] },
    'tramites:nuevo':  { kind: 'module', id: 'tramites:detail', domain: 'tramites', dormants: ['tramites:nuevo'] },
    'biometria:captura': { kind: 'module', id: 'biometria:dashboard', domain: 'biometria', dormants: ['biometria:captura', 'biometria:resultado', 'biometria:historial'] },
    'biometria:resultado': { kind: 'module', id: 'biometria:dashboard', domain: 'biometria', dormants: ['biometria:captura', 'biometria:resultado', 'biometria:historial'] },
    'biometria:historial': { kind: 'module', id: 'biometria:dashboard', domain: 'biometria', dormants: ['biometria:captura', 'biometria:resultado', 'biometria:historial'] },
    'verification:cola': { kind: 'module', id: 'verification:panel', domain: 'verification', dormants: ['verification:cola', 'verification:item', 'verification:historial', 'verification:inconsistencias'] },
    'verification:item': { kind: 'module', id: 'verification:panel', domain: 'verification', dormants: ['verification:cola', 'verification:item', 'verification:historial', 'verification:inconsistencias'] },
    'verification:historial': { kind: 'module', id: 'verification:panel', domain: 'verification', dormants: ['verification:cola', 'verification:item', 'verification:historial', 'verification:inconsistencias'] },
    'verification:inconsistencias': { kind: 'module', id: 'verification:panel', domain: 'verification', dormants: ['verification:cola', 'verification:item', 'verification:historial', 'verification:inconsistencias'] },
    // Exportación
    'exportacion:solicitud': { kind: 'module', id: 'exportacion:form', domain: 'exportacion', dormants: ['exportacion:solicitud', 'exportacion:tabla', 'exportacion:validacion', 'exportacion:scanner', 'exportacion:export', 'exportacion:historial'] },
    'exportacion:tabla': { kind: 'module', id: 'exportacion:form', domain: 'exportacion', dormants: ['exportacion:solicitud', 'exportacion:tabla', 'exportacion:validacion', 'exportacion:scanner', 'exportacion:export', 'exportacion:historial'] },
    'exportacion:validacion': { kind: 'module', id: 'exportacion:form', domain: 'exportacion', dormants: ['exportacion:solicitud', 'exportacion:tabla', 'exportacion:validacion', 'exportacion:scanner', 'exportacion:export', 'exportacion:historial'] },
    'exportacion:scanner': { kind: 'module', id: 'exportacion:form', domain: 'exportacion', dormants: ['exportacion:solicitud', 'exportacion:tabla', 'exportacion:validacion', 'exportacion:scanner', 'exportacion:export', 'exportacion:historial'] },
    'exportacion:export': { kind: 'module', id: 'exportacion:form', domain: 'exportacion', dormants: ['exportacion:solicitud', 'exportacion:tabla', 'exportacion:validacion', 'exportacion:scanner', 'exportacion:export', 'exportacion:historial'] },
    'exportacion:historial': { kind: 'module', id: 'exportacion:form', domain: 'exportacion', dormants: ['exportacion:solicitud', 'exportacion:tabla', 'exportacion:validacion', 'exportacion:scanner', 'exportacion:export', 'exportacion:historial'] },
    // Vinculación
    'vinculacion:lista': { kind: 'module', id: 'vinculacion:panel', domain: 'vinculacion', dormants: ['vinculacion:lista', 'vinculacion:pendientes', 'vinculacion:nueva', 'vinculacion:historial'] },
    'vinculacion:pendientes': { kind: 'module', id: 'vinculacion:panel', domain: 'vinculacion', dormants: ['vinculacion:lista', 'vinculacion:pendientes', 'vinculacion:nueva', 'vinculacion:historial'] },
    'vinculacion:nueva': { kind: 'module', id: 'vinculacion:panel', domain: 'vinculacion', dormants: ['vinculacion:lista', 'vinculacion:pendientes', 'vinculacion:nueva', 'vinculacion:historial'] },
    'vinculacion:historial': { kind: 'module', id: 'vinculacion:panel', domain: 'vinculacion', dormants: ['vinculacion:lista', 'vinculacion:pendientes', 'vinculacion:nueva', 'vinculacion:historial'] },
    // Documentos
    'documentos:subida':      { kind: 'module', id: 'documentos:panel', domain: 'documentos', dormants: ['documentos:subida', 'documentos:validacion', 'documentos:expedientes', 'documentos:empacar'] },
    'documentos:validacion':  { kind: 'module', id: 'documentos:panel', domain: 'documentos', dormants: ['documentos:subida', 'documentos:validacion', 'documentos:expedientes', 'documentos:empacar'] },
    'documentos:expedientes': { kind: 'module', id: 'documentos:panel', domain: 'documentos', dormants: ['documentos:subida', 'documentos:validacion', 'documentos:expedientes', 'documentos:empacar'] },
    'documentos:empacar':     { kind: 'module', id: 'documentos:panel', domain: 'documentos', dormants: ['documentos:subida', 'documentos:validacion', 'documentos:expedientes', 'documentos:empacar'] },
    'documentos:revision':    { kind: 'module', id: 'documentos:panel', domain: 'documentos', dormants: ['documentos:panel', 'documentos:revision', 'documentos:validacion', 'documentos:expedientes'] },
    'documentos:panel':       { kind: 'module', id: 'documentos:panel', domain: 'documentos', dormants: ['documentos:panel', 'documentos:revision', 'documentos:validacion', 'documentos:expedientes'] },
  }
  return map[dormantId]
}

// ─── TIPOS DE DOMINIO: EXPORTACIÓN ───────────────────────────────────────────

export interface SolicitudData {
  psg: string
  upp: string
  sexo: 'Macho' | 'Hembra'
  folioFactura: string
}

export interface AreteRow {
  id: number
  areteOrigen: string
  folioFactura: string
  status: 'ok' | 'duplicado' | 'invalido'
}

export interface SolicitudGuardada {
  id: string
  folio: string
  solicitud: SolicitudData
  rows: AreteRow[]
  estado: 'borrador' | 'lista' | 'exportada'
  fecha: string
}

// ─── TIPOS DE DOMINIO: VINCULACIÓN ───────────────────────────────────────────

export type VinculacionTipo = 'sanitario' | 'comercial' | 'auditoria' | 'union'

export interface Vinculacion {
  id: string
  entidad: string                   // nombre de la entidad vinculada
  tipo: VinculacionTipo
  estado: 'activa' | 'suspendida'
  fecha: string                   // fecha de inicio
  expira: string | null            // null = sin fecha de expiración
}

export interface VinculacionPendiente {
  id: string
  entidad: string
  tipo: VinculacionTipo
  direccion: 'recibida' | 'enviada'
  fecha: string
  mensaje: string | null
}

export interface VinculacionHistorial {
  id: string
  entidad: string
  tipo: VinculacionTipo
  estado: string               // 'creada' | 'aceptada' | 'rechazada' | 'revocada' | 'expirada'
  fechaInicio: string
  fechaFin: string
  motivo: string
}

export function domainToAnima(domain: ArtifactDomain): AnimaArtifact {
  const map: Record<ArtifactDomain, AnimaArtifact> = {
    passport: { kind: 'anima', domain: 'passport', awakes: ['passport:full'] },
    twins: { kind: 'anima', domain: 'twins', awakes: ['twins:historial', 'twins:alimentacion'] },
    monitoring: { kind: 'anima', domain: 'monitoring', awakes: ['monitoring:dashboard'] },
    certification: { kind: 'anima', domain: 'certification', awakes: ['certification:detail', 'certification:expediente'] },
    tramites: { kind: 'anima', domain: 'tramites', awakes: ['tramites:detail'] },
    verification: { kind: 'anima', domain: 'verification', awakes: ['verification:panel'] },
    sanidad: { kind: 'anima', domain: 'sanidad', awakes: ['sanidad:detail'] },
    biometria: { kind: 'anima', domain: 'biometria', awakes: ['biometria:dashboard'] },
    exportacion: { kind: 'anima', domain: 'exportacion', awakes: ['exportacion:form'] },
    vinculacion: { kind: 'anima', domain: 'vinculacion', awakes: ['vinculacion:panel'] },
    documentos:  { kind: 'anima', domain: 'documentos',  awakes: ['documentos:panel'] },
  }
  return map[domain]
}