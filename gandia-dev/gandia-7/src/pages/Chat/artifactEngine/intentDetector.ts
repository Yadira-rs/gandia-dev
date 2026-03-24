/**
 * artifactEngine/intentDetector.ts
 *
 * Cambios respecto a la versión anterior:
 *   - DetectedIntent ahora incluye `action?: 'read' | 'write'`
 *   - Se agregan 4 intents de ESCRITURA para Gemelo Digital (twins):
 *       registrar pesaje, registrar vacunación, registrar traslado,
 *       registrar consumo/alimentación
 */

import {
  detectArtifactIntent,
  type ArtifactDomain,
} from '../../../artifacts/artifactTypes'

export interface DetectedIntent {
  widgetId: string
  domain:   ArtifactDomain
  level:    'widget' | 'module' | 'anima'
  action?:  'read' | 'write'   // ← nuevo: distingue lectura vs escritura
}

const EXTENDED_RULES: Array<{
  keywords: string[]
  widgetId: string
  domain:   ArtifactDomain
  level:    'widget' | 'module' | 'anima'
  action?:  'read' | 'write'
}> = [

  // ══════════════════════════════════════════════════════════════════
  // TWINS — INTENTS DE ESCRITURA (registro desde chat)  ← NUEVO
  // ══════════════════════════════════════════════════════════════════

  // Registrar pesaje
  {
    keywords: [
      'registrar pesaje', 'registrar peso', 'nuevo pesaje', 'anotar pesaje',
      'pesar animal', 'pesé al animal', 'pesó', 'actualizár peso', 'actualizar peso',
    ],
    widgetId: 'twins:registro-peso',
    domain:   'twins',
    level:    'widget',
    action:   'write',
  },

  // Registrar vacunación
  {
    keywords: [
      'registrar vacuna', 'registrar vacunación', 'registrar vacunacion',
      'anotar vacuna', 'vacuné', 'se vacunó', 'aplicar vacuna', 'apliqué vacuna',
      'registrar dosis', 'anotar dosis',
    ],
    widgetId: 'twins:registro-evento',
    domain:   'twins',
    level:    'widget',
    action:   'write',
  },

  // Registrar traslado
  {
    keywords: [
      'registrar traslado', 'registrar movilización', 'registrar movilizacion',
      'anotar traslado', 'trasladé', 'moví al animal', 'mover animal',
      'cambiar de corral', 'cambié de corral', 'registrar movimiento',
    ],
    widgetId: 'twins:registro-evento',
    domain:   'twins',
    level:    'widget',
    action:   'write',
  },

  // Registrar consumo / alimentación
  {
    keywords: [
      'registrar consumo', 'anotar consumo', 'registrar alimentación', 'registrar alimentacion',
      'consumo de esta semana', 'consumo semanal', 'anotar forraje',
      'registrar forraje', 'registrar concentrado',
    ],
    widgetId: 'twins:registro-alimentacion',
    domain:   'twins',
    level:    'widget',
    action:   'write',
  },

  // ══════════════════════════════════════════════════════════════════
  // FICHA GANADERA (passport)
  // ══════════════════════════════════════════════════════════════════

  // ── Espacio Gandia Ficha Ganadera (anima) ── máxima prioridad
  { keywords: ['espacio gandia ficha', 'espacio ficha ganadera', 'abrir espacio ficha', 'espacio de fichas'],      widgetId: 'passport:perfiles', domain: 'passport', level: 'anima'  },
  // ── Módulo Ficha Ganadera ──
  { keywords: ['módulo ficha', 'modulo ficha', 'abrir módulo ficha', 'abrir modulo ficha', 'ficha completa', 'abrir ficha completa'], widgetId: 'passport:perfiles', domain: 'passport', level: 'module' },
  // ── Ficha · perfiles / hato ──
  { keywords: ['ver hato', 'todo el hato', 'lista del hato', 'animales del rancho', 'todos los animales',
      'cuántos animales tengo', 'mis bovinos', 'inventario bovinos'],                                              widgetId: 'passport:perfiles',  domain: 'passport', level: 'widget' },
  // ── Ficha · nueva ──
  { keywords: ['nueva ficha', 'crear ficha', 'nueva ficha ganadera', 'dar de alta bovino',
      'registrar nuevo bovino', 'nuevo bovino', 'dar de alta animal', 'registro de animal'],                       widgetId: 'passport:nuevo',     domain: 'passport', level: 'widget' },
  // ── Ficha · huella de morro (puente biometría) ──
  { keywords: ['huella de morro', 'ver huella', 'morro del animal', 'noseprint',
      'biometría del animal', 'huella bovina'],                                                                    widgetId: 'passport:biometria', domain: 'passport', level: 'widget' },
  // ── Ficha · documentos de identificación ──
  { keywords: ['documentos de identificación', 'documentos del animal', 'papeles del animal',
      'acta de herrado', 'certificado de origen', 'constancia sanitaria del animal'],                             widgetId: 'passport:documentos',domain: 'passport', level: 'widget' },
  // ── Ficha · catch-all (frases simples y plurales) ──
  { keywords: ['ver ficha', 'abrir ficha', 'mi ficha', 'fichas ganaderas', 'las fichas',
      'ficha del bovino', 'abrir pasaporte', 'ver pasaporte', 'mis pasaportes',
      'el pasaporte', 'ficha animal'],                                                                            widgetId: 'passport:card',      domain: 'passport', level: 'widget' },

  // ══════════════════════════════════════════════════════════════════
  // MONITOREO
  // ══════════════════════════════════════════════════════════════════

  // ── Espacio Gandia (anima) ── máxima prioridad
  { keywords: ['espacio gandia monitoreo', 'espacio gandia monitoring', 'abrir espacio monitoreo', 'espacio de gandia monitoreo'],  widgetId: 'monitoring:mapa', domain: 'monitoring', level: 'anima'  },
  { keywords: ['espacio gandia sanidad',   'abrir espacio sanidad'],                                                                widgetId: 'sanidad:gusano',  domain: 'sanidad',    level: 'anima'  },
  { keywords: ['espacio gandia certif', 'espacio certif', 'abrir espacio certif', 'espacio de certificacion', 'espacio certificacion'], widgetId: 'certification:elegibilidad', domain: 'certification', level: 'anima' },
  { keywords: ['espacio gandia',           'abrir espacio gandia', 'espacio completo'],                                             widgetId: 'monitoring:mapa', domain: 'monitoring', level: 'anima'  },
  // ── Módulo ──
  { keywords: ['abrir módulo monitoreo', 'abrir modulo monitoreo', 'módulo de monitoreo', 'modulo de monitoreo', 'ir al módulo', 'ir al modulo monitoreo', 'abrir monitoreo completo'], widgetId: 'monitoring:mapa', domain: 'monitoring', level: 'module' },
  { keywords: ['módulo de sanidad', 'modulo de sanidad', 'abrir módulo sanidad', 'abrir modulo sanidad'],                          widgetId: 'sanidad:gusano',  domain: 'sanidad',    level: 'module' },
  { keywords: ['módulo certif', 'modulo certif', 'abrir módulo certif', 'abrir modulo certif', 'certif completo', 'abrir certif completo'], widgetId: 'certification:elegibilidad', domain: 'certification', level: 'module' },
  // Cámaras
  { keywords: ['agregar cámara', 'agregar camara', 'nueva cámara', 'nueva camara', 'registrar cámara', 'registrar camara'], widgetId: 'camara:agregar',   domain: 'monitoring', level: 'widget' },
  { keywords: ['configurar cámara', 'configurar camara', 'ajustar cámara', 'ajustar camara', 'config cámara', 'config camara'],                   widgetId: 'camara:config',    domain: 'monitoring', level: 'widget' },
  { keywords: ['feed cámara', 'feed camara', 'video cámara', 'video camara', 'stream', 'en vivo cámara', 'en vivo camara'],                        widgetId: 'camara:feed',      domain: 'monitoring', level: 'widget' },
  { keywords: ['lista cámara', 'lista camara', 'ver cámaras', 'ver camaras', 'cámaras activas', 'camaras activas'],                                widgetId: 'camara:lista',     domain: 'monitoring', level: 'widget' },
  { keywords: ['gestionar cámaras', 'gestionar camaras', 'administrar cámaras', 'administrar camaras', 'config camaras', 'config cámaras'],         widgetId: 'config:camaras',   domain: 'monitoring', level: 'widget' },
  // Corrales
  { keywords: ['gestionar corrales', 'administrar corrales', 'config corrales', 'zonas corrales'],                                                  widgetId: 'config:corrales',  domain: 'monitoring', level: 'widget' },
  { keywords: ['detalle corral', 'info corral', 'ver corral', 'corral b1', 'corral a1', 'corral c1'],                                              widgetId: 'mapa:corral-detalle', domain: 'monitoring', level: 'widget' },
  // Trazabilidad
  { keywords: ['trazabilidad', 'conteo manual', 'registrar conteo', 'conteos corrales', 'conteo de animales', 'registro de conteo'], widgetId: 'monitoring:trazabilidad', domain: 'monitoring', level: 'widget' },
  // Registrar anomalía manual
  { keywords: ['registrar anomalía', 'registrar anomalia', 'nueva anomalía', 'nueva anomalia', 'anomalía manual', 'anomalia manual', 'reportar anomalía', 'reportar anomalia'], widgetId: 'monitoring:anomalia:registrar', domain: 'monitoring', level: 'widget' },
  // Caso sanitario
  { keywords: ['caso sanitario', 'abrir caso', 'caso clínico', 'caso clinico', 'expediente sanitario', 'iniciar caso'], widgetId: 'monitoring:caso', domain: 'monitoring', level: 'widget' },
  // Reporte PDF
  { keywords: ['reporte', 'reporte sanitario', 'reporte pdf', 'exportar reporte', 'generar reporte', 'imprimir reporte', 'descargar reporte'], widgetId: 'monitoring:reporte', domain: 'monitoring', level: 'widget' },
  // Drones
  { keywords: ['drones', 'drone', 'configurar drones', 'config drones', 'vuelo drone', 'cobertura aérea', 'cobertura aerea', 'vigilancia aérea', 'vigilancia aerea'], widgetId: 'monitoring:drones', domain: 'monitoring', level: 'widget' },
  // Anomalías
  { keywords: ['detalle anomalía', 'detalle anomalia', 'ver anomalía', 'ver anomalia', 'info anomalía', 'info anomalia'],                           widgetId: 'anomalia:detalle',       domain: 'monitoring', level: 'widget' },
  { keywords: ['umbral', 'configurar alerta', 'sensibilidad alerta', 'config umbral', 'umbrales de alerta'],                                       widgetId: 'anomalia:config-umbral', domain: 'monitoring', level: 'widget' },
  // Sanidad
  { keywords: ['gusano', 'barrenador', 'cochliomyia', 'riesgo sanitario', 'plaga', 'senasica riesgo', 'alerta sanitaria', 'sanidad zona'],         widgetId: 'sanidad:gusano',         domain: 'sanidad',    level: 'widget' },

  // ══════════════════════════════════════════════════════════════════
  // TWINS — INTENTS DE LECTURA
  // ══════════════════════════════════════════════════════════════════

  // ── Espacio Gandia Gemelos (anima) ──
  { keywords: ['espacio gandia gemelo', 'espacio gemelo', 'abrir espacio gemelo'],                                                                              widgetId: 'twins:timeline',      domain: 'twins',     level: 'anima'  },
  // ── Módulo Gemelos ──
  { keywords: ['módulo gemelo', 'modulo gemelo', 'abrir módulo gemelo', 'abrir modulo gemelo', 'gemelo completo', 'abrir gemelo'],                              widgetId: 'twins:timeline',      domain: 'twins',     level: 'module' },
  // ── Timeline / movilizaciones ──
  { keywords: ['movilizacion', 'movilización', 'traslado', 'ruta histórica', 'ruta historica', 'dónde ha estado', 'donde ha estado', 'historial corral'],      widgetId: 'twins:timeline',      domain: 'twins',     level: 'widget' },
  // ── Feed / auditorías ──
  { keywords: ['auditoria', 'auditoría', 'evidencia', 'hash ipfs', 'completitud documental', 'firma digital', 'certificacion documental'],                     widgetId: 'twins:feed',          domain: 'twins',     level: 'widget' },
  // ── Alimentación / consumo ──
  { keywords: ['consumo semanal', 'historial consumo', 'historial de consumo', 'forraje', 'concentrado', 'suplemento mineral'],                                widgetId: 'twins:alimentacion',  domain: 'twins',     level: 'widget' },
  // ── Conversión alimenticia ──
  { keywords: ['conversion alimenticia', 'conversión alimenticia', 'ca actual', 'kg por kg', 'proyeccion salida', 'proyección salida', 'dias para salida'],     widgetId: 'twins:alimentacion',  domain: 'twins',     level: 'widget' },

  // ══════════════════════════════════════════════════════════════════
  // BIOMETRÍA DE MORRO
  // ══════════════════════════════════════════════════════════════════

  // ── Biometría de morro ── máxima especificidad primero
  { keywords: ['espacio gandia biometria', 'espacio gandia biometría', 'espacio biometria', 'espacio biometría'],                                   widgetId: 'biometria:captura',      domain: 'biometria',  level: 'anima'  },
  { keywords: ['módulo biometria', 'modulo biometria', 'módulo biometría', 'modulo biometría', 'abrir biometria completo', 'abrir biometría completo'], widgetId: 'biometria:captura',   domain: 'biometria',  level: 'module' },
  { keywords: ['historial capturas', 'historial biometria', 'historial biometría', 'capturas hoy', 'capturas del día'],                             widgetId: 'biometria:historial',    domain: 'biometria',  level: 'widget' },
  { keywords: ['identificar vaca', 'identificar animal', 'identificar bovino', 'identificar res'],                                                  widgetId: 'biometria:captura',      domain: 'biometria',  level: 'widget' },
  { keywords: ['huella morro', 'escanear morro', 'escanear vaca', 'escanear animal'],                                                              widgetId: 'biometria:captura',      domain: 'biometria',  level: 'widget' },
  { keywords: ['captura morro', 'capturar morro', 'foto morro', 'fotografiar morro'],                                                              widgetId: 'biometria:captura',      domain: 'biometria',  level: 'widget' },
  { keywords: ['registrar vaca', 'registrar animal', 'registrar bovino', 'nuevo animal biometria', 'nuevo animal biometría'],                      widgetId: 'biometria:captura',      domain: 'biometria',  level: 'widget' },
  { keywords: ['hoja inteligente', 'hoja morro', 'aruco', 'modo hoja'],                                                                            widgetId: 'biometria:captura',      domain: 'biometria',  level: 'widget' },
  { keywords: ['biometria', 'biometría'],                                                                                                          widgetId: 'biometria:captura',      domain: 'biometria',  level: 'widget' },

  // ══════════════════════════════════════════════════════════════════
  // CERTIFICACIÓN
  // ══════════════════════════════════════════════════════════════════

  { keywords: ['espacio gandia certif', 'espacio certif', 'abrir espacio certif', 'espacio de certificacion', 'espacio certificacion'],                            widgetId: 'certification:elegibilidad', domain: 'certification', level: 'anima'  },
  { keywords: ['módulo certif', 'modulo certif', 'abrir módulo certif', 'certif completo', 'abrir certif completo'],                                               widgetId: 'certification:elegibilidad', domain: 'certification', level: 'module' },
  { keywords: ['elegibil', 'listo para export', 'listo para certif', 'puede salir', 'apto para certif', 'score certif', 'precertif', 'pre-certif', 'expediente elegib'], widgetId: 'certification:elegibilidad', domain: 'certification', level: 'widget' },
  { keywords: ['checklist', 'check list', 'requisitos certif', 'qué le falta para certif', 'que le falta para certif', 'qué falta para certif', 'que falta para certif'], widgetId: 'certification:checklist',    domain: 'certification', level: 'widget' },
  { keywords: ['expediente certif', 'documentos certif', 'documentos export', 'hashes certif', 'ipfs certif', 'papeles certif'],                                   widgetId: 'certification:documentos',   domain: 'certification', level: 'widget' },
  { keywords: ['vencimiento', 'por vencer', 'certificado vencido', 'renovar certif'],                                                                              widgetId: 'certification:vencimientos', domain: 'certification', level: 'widget' },
  { keywords: ['certificación', 'certificacion', 'certificado sanitario', 'cert sanitario'],                                                                       widgetId: 'certification:card',         domain: 'certification', level: 'widget' },

  // ══════════════════════════════════════════════════════════════════
  // VERIFICACIÓN
  // ══════════════════════════════════════════════════════════════════

  { keywords: ['espacio gandia verificacion', 'espacio verificacion', 'abrir espacio verificacion'],                                                               widgetId: 'verification:cola',          domain: 'verification',  level: 'anima'  },
  { keywords: ['módulo verificacion', 'modulo verificacion', 'abrir módulo verificacion', 'abrir verificacion completo'],                                          widgetId: 'verification:cola',          domain: 'verification',  level: 'module' },
  { keywords: ['cola de verificacion', 'cola verificacion', 'pendientes de verificar', 'qué falta verificar', 'que falta verificar', 'pendientes verificacion'],   widgetId: 'verification:cola',          domain: 'verification',  level: 'widget' },
  { keywords: ['historial verificacion', 'historial de verificacion', 'ya verificado', 'verificaciones anteriores'],                                               widgetId: 'verification:historial',     domain: 'verification',  level: 'widget' },
  { keywords: ['inconsistencias', 'inconsistencia', 'sin verificar', 'rechazado sin seguimiento', 'conflicto de datos'],                                           widgetId: 'verification:inconsistencias', domain: 'verification', level: 'widget' },
  { keywords: ['verificar', 'verificacion', 'verificación', 'confirmar accion', 'confirmar acción', 'revisar lo que hizo la ia', 'revisar acciones'],              widgetId: 'verification:cola',          domain: 'verification',  level: 'widget' },

  // ══════════════════════════════════════════════════════════════════
  // VINCULACIÓN
  // ══════════════════════════════════════════════════════════════════

  // ── máxima prioridad primero
  { keywords: ['espacio gandia vinculacion', 'espacio vinculacion', 'abrir espacio vinculacion'],                                                                   widgetId: 'vinculacion:lista',      domain: 'vinculacion', level: 'anima'  },
  { keywords: ['módulo vinculacion', 'modulo vinculacion', 'abrir módulo vinculacion', 'vinculacion completo', 'abrir vinculacion completo'],                        widgetId: 'vinculacion:lista',      domain: 'vinculacion', level: 'module' },
  { keywords: ['aceptar vinculacion', 'rechazar vinculacion', 'solicitudes pendientes vinculacion', 'pendientes de vinculacion', 'vinculaciones pendientes'],        widgetId: 'vinculacion:pendientes', domain: 'vinculacion', level: 'widget' },
  { keywords: ['nueva vinculacion', 'solicitar vinculacion', 'vincularme con', 'vincular con', 'agregar vinculacion', 'conectar con entidad'],                      widgetId: 'vinculacion:nueva',      domain: 'vinculacion', level: 'widget' },
  { keywords: ['historial vinculacion', 'vinculaciones anteriores', 'vinculaciones revocadas', 'entidades revocadas'],                                              widgetId: 'vinculacion:historial',  domain: 'vinculacion', level: 'widget' },
  { keywords: ['mis vinculaciones', 'ver vinculaciones', 'entidades vinculadas', 'quién tiene acceso', 'quien tiene acceso', 'accesos activos', 'vinculacion'],     widgetId: 'vinculacion:lista',      domain: 'vinculacion', level: 'widget' },

  // ══════════════════════════════════════════════════════════════════
  // EXPORTACIÓN
  // ══════════════════════════════════════════════════════════════════

  // ── máxima prioridad primero
  { keywords: ['espacio gandia exportacion', 'espacio exportacion', 'abrir espacio exportacion', 'espacio de exportacion'],                                        widgetId: 'exportacion:solicitud', domain: 'exportacion', level: 'anima'  },
  { keywords: ['módulo exportacion', 'modulo exportacion', 'abrir módulo exportacion', 'exportacion completo', 'abrir exportacion completo'],                      widgetId: 'exportacion:solicitud', domain: 'exportacion', level: 'module' },
  { keywords: ['escanear aretes', 'escanear arete', 'scan arete', 'cámara aretes', 'camara aretes', 'leer arete'],                                                widgetId: 'exportacion:scanner',   domain: 'exportacion', level: 'widget' },
  { keywords: ['validar aretes', 'validar solicitud', 'validar exportacion', 'verificar aretes', 'revisar duplicados', 'duplicados aretes', 'errores aretes'],     widgetId: 'exportacion:validacion', domain: 'exportacion', level: 'widget' },
  { keywords: ['tabla de aretes', 'tabla aretes', 'llenar tabla', 'capturar aretes', 'lista de aretes', 'aretes capturados'],                                     widgetId: 'exportacion:tabla',     domain: 'exportacion', level: 'widget' },
  { keywords: ['solicitud de aretes', 'solicitud aretes', 'nueva solicitud exportacion', 'aretes de exportacion', 'aretes de exportación', 'psg exportacion', 'psg exportación', 'exportar ganado', 'exportar bovinos', 'solicitud senasica aretes'], widgetId: 'exportacion:solicitud', domain: 'exportacion', level: 'widget' },

  // ══════════════════════════════════════════════════════════════════
  // DOCUMENTOS
  // ══════════════════════════════════════════════════════════════════

  // ── máxima prioridad primero
  { keywords: ['espacio gandia documentos', 'espacio documentos', 'abrir espacio documentos'],                                                                   widgetId: 'documentos:subida',      domain: 'documentos', level: 'anima'  },
  { keywords: ['módulo documentos', 'modulo documentos', 'abrir módulo documentos', 'documentos completo'],                                                      widgetId: 'documentos:subida',      domain: 'documentos', level: 'module' },
  { keywords: ['panel general documentos', 'ver todos los productores', 'productores con expediente', 'panel union'],                                            widgetId: 'documentos:panel',       domain: 'documentos', level: 'widget' },
  { keywords: ['revisar expediente', 'revisar documentos de', 'aprobar expediente', 'rechazar expediente', 'dejar nota expediente'],                             widgetId: 'documentos:revision',    domain: 'documentos', level: 'widget' },
  { keywords: ['empacar documentos', 'descargar documentos', 'preparar paquete', 'documentos para ventanilla', 'mis archivos para tramite'],                     widgetId: 'documentos:empacar',     domain: 'documentos', level: 'widget' },
  { keywords: ['subir documento', 'subir archivo', 'cargar documento', 'nuevo expediente', 'crear expediente'],                                                  widgetId: 'documentos:subida',      domain: 'documentos', level: 'widget' },
  { keywords: ['qué me falta', 'que me falta', 'documentos faltantes', 'checklist tramite', 'validar documentos', 'tengo todo para'],                            widgetId: 'documentos:validacion',  domain: 'documentos', level: 'widget' },
  { keywords: ['mis expedientes', 'ver expedientes', 'mis documentos', 'expediente de tramite', 'historial expedientes'],                                        widgetId: 'documentos:expedientes', domain: 'documentos', level: 'widget' },

  // ══════════════════════════════════════════════════════════════════
  // TRÁMITES
  // ══════════════════════════════════════════════════════════════════

  // ── Trámites: nuevo ──
  { keywords: ['nuevo trámite', 'nuevo tramite', 'crear trámite', 'crear tramite', 'iniciar trámite', 'iniciar tramite', 'solicitar trámite', 'solicitar tramite', 'abrir trámite', 'abrir tramite'], widgetId: 'tramites:nuevo', domain: 'tramites', level: 'widget' },

  // ══════════════════════════════════════════════════════════════════
  // MARKETPLACE
  // ══════════════════════════════════════════════════════════════════

  // ── Espacio Gandia Marketplace (anima) ── máxima prioridad
  { keywords: ['espacio gandia marketplace', 'espacio marketplace', 'abrir espacio marketplace', 'ecosistema gandia'],                                                widgetId: 'marketplace:kits',     domain: 'marketplace', level: 'anima'  },
  // ── Módulo Marketplace ──
  { keywords: ['módulo marketplace', 'modulo marketplace', 'abrir marketplace', 'ver marketplace', 'marketplace completo'],                                          widgetId: 'marketplace:kits',     domain: 'marketplace', level: 'module' },
  // ── Partners ──
  { keywords: ['ver partners', 'partners gandia', 'aliados gandia', 'quiénes son los partners', 'quienes son los partners', 'partners estratégicos', 'partners estrategicos', 'nvidia gandia', 'fermaca gandia', 'iot gandia'], widgetId: 'marketplace:partners', domain: 'marketplace', level: 'widget' },
  // ── Kits / soluciones ──
  { keywords: ['kit rancho', 'kits ganaderos', 'soluciones hardware', 'hardware ganadero', 'comprar hardware', 'necesito hardware', 'quiero sensores', 'sensores ganaderos', 'collar inteligente', 'cámara corral', 'camara corral', 'jetson', 'nvidia rancho', 'fermaca conectividad', 'internet rancho', 'iot rancho', 'conectividad rancho', 'sensores iot', 'báscula inteligente', 'bascula inteligente', 'gateway lora'], widgetId: 'marketplace:kits',     domain: 'marketplace', level: 'widget' },
]

const PRODUCTOR_ONLY_WIDGETS = new Set([
  'documentos:subida',
  'documentos:empacar',
  'tramites:nuevo',
])

const UNION_ONLY_WIDGETS = new Set([
  'documentos:revision',
  'documentos:panel',
])

export function detectIntent(text: string, role?: string | null): DetectedIntent | null {
  const lower   = text.toLowerCase()
  const isUnion = role === 'union' || role === 'union_ganadera'

  for (const rule of EXTENDED_RULES) {
    if (rule.keywords.some(kw => lower.includes(kw))) {
      // Bloquear widgets de productor si es unión
      if (isUnion && PRODUCTOR_ONLY_WIDGETS.has(rule.widgetId)) return null
      // Bloquear widgets de unión si es productor
      if (!isUnion && role && UNION_ONLY_WIDGETS.has(rule.widgetId)) return null
      return {
        widgetId: rule.widgetId,
        domain:   rule.domain,
        level:    rule.level,
        action:   rule.action ?? 'read',
      }
    }
  }

  const primary = detectArtifactIntent(text)
  if (primary) {
    return { widgetId: primary.id, domain: primary.domain, level: 'widget', action: 'read' }
  }

  return null
}