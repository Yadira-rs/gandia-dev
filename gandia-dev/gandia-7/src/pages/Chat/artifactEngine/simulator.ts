/**
 * artifactEngine/simulator.ts
 */

export interface SimulationCallbacks {
  onStep:     (steps: string[], idx: number) => void
  onComplete: (result: SimulationResult) => void
}

export interface SimulationResult {
  widgetId: string
  domain:   string
  content:  string
  steps:    string[]
}

interface SimConfig {
  domain:  string
  steps:   string[]
  content: string
}

const CONFIGS: Record<string, SimConfig> = {

  // ── Ficha Ganadera ──
  'passport:card': {
    domain:  'passport',
    steps:   ['Consultando ficha ganadera...', 'Verificando elegibilidad USDA/SENASICA...', 'Estatus: ELEGIBLE · Arete Azul activo · Sin alertas'],
    content: 'Ficha Ganadera del Ejemplar #892 lista.',
  },
  'passport:perfiles': {
    domain:  'passport',
    steps:   ['Cargando hato de la UPP...', 'Verificando estatus de fichas...', 'Revisando biometría pendiente...', '8 animales · 4 activos · 3 sin huella de morro'],
    content: 'Aquí está el listado de animales registrados en tu UPP. Tienes 3 animales con captura de huella pendiente.',
  },
  'passport:documentos': {
    domain:  'passport',
    steps:   ['Recuperando documentos adjuntos...', 'Verificando vigencias y hashes...', '5 documentos · 1 constancia por vencer'],
    content: 'Documentos de identificación del animal cargados. Hay una constancia sanitaria por vencer en agosto.',
  },
  'passport:biometria': {
    domain:  'passport',
    steps:   ['Consultando registro biométrico...', 'Cargando estatus NosePrint...', 'Huella de morro: verificación pendiente · Score 83%'],
    content: 'El animal tiene una captura de huella de morro con score de 83%. Está pendiente de confirmación.',
  },
  'passport:nuevo': {
    domain:  'passport',
    steps:   ['Preparando formulario de registro...', 'Cargando catálogos de razas y UPP...', 'Listo para registrar nuevo animal'],
    content: 'Formulario de nueva ficha ganadera listo. Te guío paso a paso.',
  },

  // ── Mapa ──
  'monitoring:mapa': {
    domain:  'monitoring',
    steps:   ['Consultando inventario de corrales...', 'Cruzando con registros SINIIGA...', 'Detectando estados activos...', 'Mapa generado · 225 animales · 2 corrales requieren atención'],
    content: 'Aquí está el mapa en vivo de tu UPP. Corrales B1 y C1 requieren atención.',
  },

  // ── Sensor ──
  'monitoring:sensor': {
    domain:  'monitoring',
    steps:   ['Estableciendo conexión con sensores...', 'Extrayendo descriptores biométricos...', 'Cruzando telemetría con SINIIGA...', '239 animales detectados · Match global 98.8%'],
    content: 'Conteo en tiempo real activo. La IA Perception v7.4 detecta 239 animales con 98.8% de coincidencia.',
  },

  // ── Anomalía feed ──
  'monitoring:anomalia': {
    domain:  'monitoring',
    steps:   ['Analizando señales de comportamiento...', 'Detectando patrones inusuales...', 'Cruzando con historial sanitario...', '2 anomalías activas · Severidad alta en C1'],
    content: 'Hay 2 anomalías activas. El Ejemplar #0247 lleva 12 min separado del hato en B1.',
  },

  // ── Mapa corral detalle ──
  'mapa:corral-detalle': {
    domain:  'monitoring',
    steps:   ['Consultando datos del Corral B1...', 'Leyendo sensores ambientales...', 'Corral B1 · Estado de atención'],
    content: 'Corral B1 en estado de atención. Temperatura elevada (26.7°C) y 47 de 50 animales presentes.',
  },

  // ── Cámara lista ──
  'camara:lista': {
    domain:  'monitoring',
    steps:   ['Consultando cámaras registradas...', 'Verificando estado de conexión...', '4 online · 2 offline'],
    content: 'Tienes 6 cámaras registradas. CAM-03 y CAM-06 están sin señal.',
  },

  // ── Cámara feed ──
  'camara:feed': {
    domain:  'monitoring',
    steps:   ['Estableciendo conexión con CAM-01...', 'Inicializando stream de video...', 'Feed activo · 42 animales detectados · Match 100%'],
    content: 'Feed en vivo de CAM-01 activo. Corral A1 con 42 animales, coincidencia perfecta con inventario.',
  },

  // ── Cámara config ──
  'camara:config': {
    domain:  'monitoring',
    steps:   ['Cargando configuración de CAM-01...', 'Verificando parámetros activos...', 'Configuración cargada · 24 fps · Anomalías activas'],
    content: 'Configuración de CAM-01 lista para editar.',
  },

  // ── Cámara agregar ──
  'camara:agregar': {
    domain:  'monitoring',
    steps:   ['Preparando formulario de registro...', 'Cargando corrales disponibles...', 'Listo para registrar nueva cámara'],
    content: 'Formulario de registro listo. Puedes asignar la nueva cámara a cualquier corral.',
  },

  // ── Config cámaras ──
  'config:camaras': {
    domain:  'monitoring',
    steps:   ['Cargando inventario de cámaras...', 'Verificando cobertura por corral...', '6 cámaras · 4/6 corrales con cobertura activa'],
    content: 'Panel de gestión de cámaras. CAM-03 y CAM-06 requieren revisión de conexión.',
  },

  // ── Config corrales ──
  'config:corrales': {
    domain:  'monitoring',
    steps:   ['Cargando zonas y corrales...', 'Verificando estados y capacidades...', '6 corrales · 1 en cuarentena · 1 en atención'],
    content: 'Panel de gestión de corrales. C1 en cuarentena y B1 en atención requieren seguimiento.',
  },

  // ── Sensor calibración ──
  'sensor:calibracion': {
    domain:  'monitoring',
    steps:   ['Conectando con AI Perception v7.4...', 'Leyendo parámetros actuales del modelo...', 'Precisión: 98.2% · Última calibración hace 3 días'],
    content: 'AI Perception v7.4 activo. Precisión de 98.2%. CAM-06 offline afecta la cobertura del Corral C2.',
  },

  // ── Anomalía detalle ──
  'anomalia:detalle': {
    domain:  'monitoring',
    steps:   ['Cargando detalle de anomalía activa...', 'Cruzando señales biométricas...', 'Anomalía alta severidad confirmada · Acción requerida'],
    content: 'Anomalía de severidad alta en Corral B1. El Ejemplar #0247 lleva 12 min separado del hato. Revisión visual recomendada.',
  },

  // ── Anomalía config umbral ──
  'anomalia:config-umbral': {
    domain:  'monitoring',
    steps:   ['Cargando umbrales configurados...', 'Verificando sensibilidad del sistema...', '4 umbrales activos · 2 alta severidad · 2 media'],
    content: 'Umbrales de alerta del sistema. Puedes ajustar los valores con criterio veterinario.',
  },

  // ── Sanidad ──
  'sanidad:gusano': {
    domain:  'sanidad',
    steps:   ['Consultando alertas SENASICA para la zona...', 'Cruzando reportes regionales con tu UPP...', 'Riesgo ALTO detectado en Durango-Norte (87%)'],
    content: 'Tu zona tiene riesgo alto (87%) para Gusano Barrenador. Revisa el protocolo de 4 pasos.',
  },

  // ── Gemelo Digital ──
  'twins:timeline': {
    domain:  'twins',
    steps:   ['Consultando REEMO y ledger de movilizaciones...', 'Verificando GPS y firma digital por evento...', '3 movilizaciones · 2 certificadas · Ubicación actual: Corral 1'],
    content: 'El Ejemplar #892 tiene 3 movilizaciones registradas. Actualmente en Corral 1 (engorda final). Las 2 primeras tienen certificación completa.',
  },

  'twins:feed': {
    domain:  'twins',
    steps:   ['Recuperando auditorías del ledger institucional...', 'Verificando hashes IPFS y firmas digitales...', '3 auditorías · 2 completas · 1 pendiente · 78%'],
    content: 'El Ejemplar #892 tiene 3 auditorías registradas con 78% de completitud. La vacunación del 02-FEB no tiene foto ni firma — requiere atención.',
  },

  'twins:alimentacion': {
    domain:  'twins',
    steps:   ['Recuperando registros de consumo por semana...', 'Calculando promedios y desviaciones...', 'Calculando conversión alimenticia vs benchmark...', 'CA: 6.8 · Mejor que P-07 (7.1) · Proyección: ~38 días'],
    content: 'Forraje y concentrado sólidos (93% y 89%). El suplemento mineral muestra caída de 91% a 62%. CA de 6.8 supera el objetivo P-07. Proyección de salida a 500 kg en ~38 días.',
  },

  // ── Biometría de morro ──
  'biometria:captura': {
    domain:  'biometria',
    steps:   ['Inicializando módulo biométrico...', 'Cargando motor Fingerprint CV...', 'Cargando IA ResNet50 + pgvector...', 'Listo · Abre la cámara y enfoca el morro'],
    content: 'Módulo de identificación por huella de morro listo. Abre la cámara, enfoca el morro del animal y captura.',
  },

  'biometria:resultado': {
    domain:  'biometria',
    steps:   ['Extrayendo textura del morro...', 'Motor Fingerprint CV → vector 512D...', 'IA Embedding → PCA 128D...', 'Fusión 55/45 · Búsqueda pgvector...', 'Animal identificado con 94.2% de confianza'],
    content: 'Identificación completada. Lupita · Simmental · Lote A1 · Score 94.2%.',
  },

  'biometria:historial': {
    domain:  'biometria',
    steps:   ['Consultando capturas del día...', 'Calculando precisión del hato...', '4 capturas · 2 confirmadas · 1 pendiente'],
    content: 'Historial del día: 4 capturas registradas, precisión del 75%. Hay 1 candidato pendiente de confirmar.',
  },

  // ── Certification card ──
  'certification:card': {
    domain:  'certification',
    steps:   ['Consultando certificaciones del animal...', 'Verificando vigencias y folios SENASICA...', 'Cert. Sanitario vigente · Elegibilidad USDA en proceso · 74%'],
    content: 'Lupita tiene 2 certificaciones. El Certificado Sanitario TB/Brucela está vigente hasta ENE 2027. La Elegibilidad USDA está al 74% — le falta foto de vacunación y firma del MVZ.',
  },

  'certification:elegibilidad': {
    domain:  'certification',
    steps:   ['Cruzando pasaporte con gemelo digital...', 'Verificando resultados sanitarios SENASICA...', 'Revisando monitoreo y anomalías activas...', 'Consultando zona de riesgo sanitario...', 'Score 74/100 · CASI LISTO · 2 pendientes menores'],
    content: 'Lupita está casi lista para certificación USDA con score 74/100. Pasaporte, monitoreo y sanidad están completos. Falta foto de vacunación y firma digital del MVZ en el evento del 02-FEB.',
  },

  'certification:checklist': {
    domain:  'certification',
    steps:   ['Cargando requisitos USDA APHIS...', 'Verificando cada criterio contra el expediente...', '9 de 12 requisitos completos · 2 faltantes · 1 pendiente'],
    content: 'Checklist USDA: 9/12 requisitos cumplidos. Faltantes: foto de vacunación y firma MVZ. El resto — TB, Brucelosis, SINIIGA, REEMO, fotografías oficiales — está en orden.',
  },

  'certification:documentos': {
    domain:  'certification',
    steps:   ['Recuperando expediente documental...', 'Verificando hashes IPFS y firmas digitales...', '6 documentos presentes · 2 faltantes · Completitud 74%'],
    content: 'Expediente al 74%. Los resultados de TB, Brucelosis, SINIIGA y REEMO están verificados con hash IPFS. Faltan: fotografía de la vacunación y firma digital del MVZ del 02-FEB.',
  },

  'certification:vencimientos': {
    domain:  'certification',
    steps:   ['Consultando fechas de vencimiento de la UPP...', 'Ordenando por urgencia...', '1 certificación vencida · 2 vencen en menos de 30 días'],
    content: 'Hay 1 certificación vencida (#0183 · Elegibilidad USDA) y 2 próximas a vencer: Canela en 14 días y Presumida en 19 días. Requieren renovación antes de fin de marzo.',
  },

  // ── Verificación ──
  'verification:cola': {
    domain:  'verification',
    steps:   ['Consultando cola de verificaciones pendientes...', 'Clasificando por origen: IA y usuario...', 'Ordenando por severidad...', '5 pendientes · 2 alta prioridad · 3 de IA'],
    content: 'Tienes 5 acciones pendientes de verificación. 2 son de alta prioridad: la alerta de separación del hato en B1 (IA) y el registro de vacunación del 02-FEB (usuario). La decisión es tuya.',
  },

  'verification:item': {
    domain:  'verification',
    steps:   ['Cargando detalle de la acción...', 'Recuperando evidencia asociada...', 'Preparando contexto para verificación humana...'],
    content: 'Detalle listo para revisión. La IA detectó separación del hato en Corral B1 — Ejemplar #0247, 12 min aislado. Puedes verificar, rechazar o dejar una observación.',
  },

  'verification:historial': {
    domain:  'verification',
    steps:   ['Consultando historial de verificaciones...', 'Cargando quién verificó cada acción...', '12 verificadas · 1 rechazada · Últimas 7 días'],
    content: 'Historial de la última semana: 12 acciones verificadas, 1 rechazada. El rechazo fue por una captura biométrica de baja confianza que el auditor invalidó manualmente.',
  },

  'verification:inconsistencias': {
    domain:  'verification',
    steps:   ['Buscando acciones sin verificar por más de 24 hrs...', 'Detectando rechazos sin seguimiento...', 'Identificando conflictos de datos...', '3 inconsistencias · 1 crítica'],
    content: 'Hay 3 inconsistencias activas. La más crítica: el registro de vacunación del 02-FEB lleva 3 días sin verificar y bloquea la elegibilidad USDA de Lupita.',
  },

  // ── Vinculación ──
  'vinculacion:lista': {
    domain:  'vinculacion',
    steps:   ['Consultando vinculaciones activas...', 'Verificando estados y permisos...', '4 activas · 1 suspendida · 2 pendientes de respuesta'],
    content: 'Tienes 4 vinculaciones activas. La auditoría SENASICA · Flores vence el 30 de marzo. Hay 2 solicitudes pendientes de tu atención.',
  },
  'vinculacion:pendientes': {
    domain:  'vinculacion',
    steps:   ['Cargando solicitudes entrantes y salientes...', 'Verificando identidad institucional de las entidades...', '1 solicitud entrante · 1 solicitud saliente en espera'],
    content: 'Exportadora SurAgro Ltda. solicitó vinculación comercial hace 2 horas. Tu solicitud a la MVZ Dra. Sánchez Ruiz sigue en espera de respuesta.',
  },
  'vinculacion:nueva': {
    domain:  'vinculacion',
    steps:   ['Preparando formulario de solicitud...', 'Cargando catálogo de tipos de vinculación...', 'Listo para enviar solicitud'],
    content: 'Formulario de nueva vinculación listo. Ingresa el identificador de la entidad y selecciona el tipo de relación institucional.',
  },
  'vinculacion:historial': {
    domain:  'vinculacion',
    steps:   ['Recuperando historial de vinculaciones...', 'Ordenando por fecha...', '5 eventos · 2 revocadas · 1 rechazada · 2 aceptadas'],
    content: 'Historial: 5 eventos en los últimos 3 meses. Frigorífico del Norte fue revocado en febrero y el Laboratorio Diagnos. Vet. rechazó tu solicitud en enero.',
  },

  // ── Exportación ──
  'exportacion:solicitud': {
    domain:  'exportacion',
    steps:   ['Consultando solicitudes activas de la UPP...', 'Verificando PSG registrado en SENASICA...', 'Cargando progreso de captura...', '1 solicitud en borrador · 28 de 35 aretes capturados'],
    content: 'Tienes una solicitud activa (SOL-2025-0041) con 28 de 35 aretes capturados. Faltan 7 aretes y hay 2 errores detectados que debes corregir antes de exportar.',
  },

  'exportacion:tabla': {
    domain:  'exportacion',
    steps:   ['Cargando aretes registrados en la solicitud...', 'Verificando formato SINIIGA...', 'Detectando duplicados...', '28 aretes · 1 duplicado · 1 formato inválido'],
    content: 'Tabla de aretes lista. Se detectaron 2 problemas: un arete duplicado en la fila 3 y un formato inválido en la fila 5. Corrígelos para poder exportar.',
  },

  'exportacion:validacion': {
    domain:  'exportacion',
    steps:   ['Analizando tabla de aretes...', 'Cruzando con base de datos SINIIGA...', 'Revisando folios de factura...', 'Verificando consistencia de cabezas declaradas...', '32 correctos · 1 duplicado · 1 formato inválido · Score 91'],
    content: 'Análisis completado. Score 91/100: 32 aretes correctos, 1 duplicado en fila 3 y 1 formato inválido en fila 5. Corrígelos para llegar a 100 y exportar.',
  },

  'exportacion:scanner': {
    domain:  'exportacion',
    steps:   ['Inicializando motor OCR de aretes...', 'Cargando modelos de detección...', 'Listo para escanear · Apunta al arete'],
    content: 'Escáner de aretes listo. Activa la cámara y apunta al arete para capturarlo automáticamente. Los duplicados se detectan en tiempo real.',
  },
}

const STEP_INTERVAL_MS = 850

export function runSimulation(widgetId: string, callbacks: SimulationCallbacks): void {
  const cfg = CONFIGS[widgetId] ?? CONFIGS['monitoring:mapa']
  const { onStep, onComplete } = callbacks

  cfg.steps.forEach((_, i) => {
    setTimeout(() => {
      onStep(cfg.steps.slice(0, i + 1), i)

      if (i === cfg.steps.length - 1) {
        setTimeout(() => {
          onComplete({
            widgetId,
            domain:  cfg.domain,
            content: cfg.content,
            steps:   cfg.steps,
          })
        }, 400)
      }
    }, i * STEP_INTERVAL_MS)
  })
}