/**
 * artifactEngine/intentDetector.ts
 */

import {
  detectArtifactIntent,
  type ArtifactDomain,
} from '../../../artifacts/artifactTypes'

export interface DetectedIntent {
  widgetId: string
  domain:   ArtifactDomain
  level:    'widget' | 'module' | 'anima'
}

const EXTENDED_RULES: Array<{ keywords: string[]; widgetId: string; domain: ArtifactDomain; level: 'widget' | 'module' | 'anima' }> = [

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
  // Sensor / calibración
  { keywords: ['calibr', 'precisión sensor', 'precision sensor', 'parámetros ia', 'parametros ia', 'modelo ia'],                                   widgetId: 'sensor:calibracion', domain: 'monitoring', level: 'widget' },
  // Anomalías
  { keywords: ['detalle anomalía', 'detalle anomalia', 'ver anomalía', 'ver anomalia', 'info anomalía', 'info anomalia'],                           widgetId: 'anomalia:detalle',       domain: 'monitoring', level: 'widget' },
  { keywords: ['umbral', 'configurar alerta', 'sensibilidad alerta', 'config umbral', 'umbrales de alerta'],                                       widgetId: 'anomalia:config-umbral', domain: 'monitoring', level: 'widget' },
  // Sanidad
  { keywords: ['gusano', 'barrenador', 'cochliomyia', 'riesgo sanitario', 'plaga', 'senasica riesgo', 'alerta sanitaria', 'sanidad zona'],         widgetId: 'sanidad:gusano',         domain: 'sanidad',    level: 'widget' },

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

  // ── Certificación ──
  { keywords: ['espacio gandia certif', 'espacio certif', 'abrir espacio certif', 'espacio de certificacion', 'espacio certificacion'],                            widgetId: 'certification:elegibilidad', domain: 'certification', level: 'anima'  },
  { keywords: ['módulo certif', 'modulo certif', 'abrir módulo certif', 'certif completo', 'abrir certif completo'],                                               widgetId: 'certification:elegibilidad', domain: 'certification', level: 'module' },
  { keywords: ['elegibil', 'listo para export', 'listo para certif', 'puede salir', 'apto para certif', 'score certif', 'precertif', 'pre-certif', 'expediente elegib'], widgetId: 'certification:elegibilidad', domain: 'certification', level: 'widget' },
  { keywords: ['checklist', 'check list', 'requisitos certif', 'qué le falta para certif', 'que le falta para certif', 'qué falta para certif', 'que falta para certif'], widgetId: 'certification:checklist',    domain: 'certification', level: 'widget' },
  { keywords: ['expediente certif', 'documentos certif', 'documentos export', 'hashes certif', 'ipfs certif', 'papeles certif'],                                   widgetId: 'certification:documentos',   domain: 'certification', level: 'widget' },
  { keywords: ['vencimiento', 'por vencer', 'certificado vencido', 'renovar certif'],                                                                              widgetId: 'certification:vencimientos', domain: 'certification', level: 'widget' },
  { keywords: ['certificación', 'certificacion', 'certificado sanitario', 'cert sanitario'],                                                                       widgetId: 'certification:card',         domain: 'certification', level: 'widget' },

  // ── Verificación ──
  { keywords: ['espacio gandia verificacion', 'espacio verificacion', 'abrir espacio verificacion'],                                                               widgetId: 'verification:cola',          domain: 'verification',  level: 'anima'  },
  { keywords: ['módulo verificacion', 'modulo verificacion', 'abrir módulo verificacion', 'abrir verificacion completo'],                                          widgetId: 'verification:cola',          domain: 'verification',  level: 'module' },
  { keywords: ['cola de verificacion', 'cola verificacion', 'pendientes de verificar', 'qué falta verificar', 'que falta verificar', 'pendientes verificacion'],   widgetId: 'verification:cola',          domain: 'verification',  level: 'widget' },
  { keywords: ['historial verificacion', 'historial de verificacion', 'ya verificado', 'verificaciones anteriores'],                                               widgetId: 'verification:historial',     domain: 'verification',  level: 'widget' },
  { keywords: ['inconsistencias', 'inconsistencia', 'sin verificar', 'rechazado sin seguimiento', 'conflicto de datos'],                                           widgetId: 'verification:inconsistencias', domain: 'verification', level: 'widget' },
  { keywords: ['verificar', 'verificacion', 'verificación', 'confirmar accion', 'confirmar acción', 'revisar lo que hizo la ia', 'revisar acciones'],              widgetId: 'verification:cola',          domain: 'verification',  level: 'widget' },

  // ── Vinculación ── máxima prioridad primero
  { keywords: ['espacio gandia vinculacion', 'espacio vinculacion', 'abrir espacio vinculacion'],                                                                   widgetId: 'vinculacion:lista',      domain: 'vinculacion', level: 'anima'  },
  { keywords: ['módulo vinculacion', 'modulo vinculacion', 'abrir módulo vinculacion', 'vinculacion completo', 'abrir vinculacion completo'],                        widgetId: 'vinculacion:lista',      domain: 'vinculacion', level: 'module' },
  { keywords: ['aceptar vinculacion', 'rechazar vinculacion', 'solicitudes pendientes vinculacion', 'pendientes de vinculacion', 'vinculaciones pendientes'],        widgetId: 'vinculacion:pendientes', domain: 'vinculacion', level: 'widget' },
  { keywords: ['nueva vinculacion', 'solicitar vinculacion', 'vincularme con', 'vincular con', 'agregar vinculacion', 'conectar con entidad'],                      widgetId: 'vinculacion:nueva',      domain: 'vinculacion', level: 'widget' },
  { keywords: ['historial vinculacion', 'vinculaciones anteriores', 'vinculaciones revocadas', 'entidades revocadas'],                                              widgetId: 'vinculacion:historial',  domain: 'vinculacion', level: 'widget' },
  { keywords: ['mis vinculaciones', 'ver vinculaciones', 'entidades vinculadas', 'quién tiene acceso', 'quien tiene acceso', 'accesos activos', 'vinculacion'],     widgetId: 'vinculacion:lista',      domain: 'vinculacion', level: 'widget' },

  // ── Exportación ── máxima prioridad primero
  { keywords: ['espacio gandia exportacion', 'espacio exportacion', 'abrir espacio exportacion', 'espacio de exportacion'],                                        widgetId: 'exportacion:solicitud', domain: 'exportacion', level: 'anima'  },
  { keywords: ['módulo exportacion', 'modulo exportacion', 'abrir módulo exportacion', 'exportacion completo', 'abrir exportacion completo'],                      widgetId: 'exportacion:solicitud', domain: 'exportacion', level: 'module' },
  { keywords: ['escanear aretes', 'escanear arete', 'scan arete', 'cámara aretes', 'camara aretes', 'leer arete'],                                                widgetId: 'exportacion:scanner',   domain: 'exportacion', level: 'widget' },
  { keywords: ['validar aretes', 'validar solicitud', 'validar exportacion', 'verificar aretes', 'revisar duplicados', 'duplicados aretes', 'errores aretes'],     widgetId: 'exportacion:validacion', domain: 'exportacion', level: 'widget' },
  { keywords: ['tabla de aretes', 'tabla aretes', 'llenar tabla', 'capturar aretes', 'lista de aretes', 'aretes capturados'],                                     widgetId: 'exportacion:tabla',     domain: 'exportacion', level: 'widget' },
  { keywords: ['solicitud de aretes', 'solicitud aretes', 'nueva solicitud exportacion', 'aretes de exportacion', 'aretes de exportación', 'psg exportacion', 'psg exportación', 'exportar ganado', 'exportar bovinos', 'solicitud senasica aretes'], widgetId: 'exportacion:solicitud', domain: 'exportacion', level: 'widget' },
]

export function detectIntent(text: string): DetectedIntent | null {
  const lower = text.toLowerCase()

  for (const rule of EXTENDED_RULES) {
    if (rule.keywords.some(kw => lower.includes(kw))) {
      return { widgetId: rule.widgetId, domain: rule.domain, level: rule.level }
    }
  }

  const primary = detectArtifactIntent(text)
  if (primary) {
    return { widgetId: primary.id, domain: primary.domain, level: 'widget' }
  }

  return null
}