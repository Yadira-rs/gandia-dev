/**
 * artifactEngine/widgetMap.tsx
 */

import React from 'react'

import {
  MOCK_PASSPORT,
  MOCK_EVENTOS_TWINS,
  MOCK_AUDITORIAS_TWINS,
  MOCK_ALIMENTACION_TWINS,
} from './mockData'

// ── Ficha Ganadera ─────────────────────────────────────────────────────────────
import FichaCard from '../../../artifacts/Ficha/widgets/FichaCard'
import FichaPerfilesWidget from '../../../artifacts/Ficha/widgets/FichaPerfilesWidget'
import FichaDocumentosWidget from '../../../artifacts/Ficha/widgets/FichaDocumentosWidget'
import FichaHuellaWidget from '../../../artifacts/Ficha/widgets/FichaHuellaWidget'
import FichaNuevoWidget from '../../../artifacts/Ficha/widgets/FichaNuevoWidget'

// ── Monitoring widgets ────────────────────────────────────────────────────────
import MapaVistaGeneralWidget   from '../../../artifacts/monitoring/widgets/MapaVistaGeneralWidget'
import MapaCorralDetalleWidget  from '../../../artifacts/monitoring/widgets/MapaCorralDetalleWidget'
import SensorConteoLiveWidget   from '../../../artifacts/monitoring/widgets/SensorConteoLiveWidget'
import SensorCalibracionWidget  from '../../../artifacts/monitoring/widgets/SensorCalibracionWidget'
import AnomaliaFeedWidget       from '../../../artifacts/monitoring/widgets/AnomaliaFeedWidget'
import AnomaliaDetalleWidget    from '../../../artifacts/monitoring/widgets/AnomaliaDetalleWidget'
import AnomaliaConfigUmbralWidget from '../../../artifacts/monitoring/widgets/AnomaliaConfigUmbralWidget'
import AnomaliaRegistrarWidget  from '../../../artifacts/monitoring/widgets/AnomaliaRegistrarWidget'
import TrazabilidadWidget       from '../../../artifacts/monitoring/widgets/TrazabilidadWidget'
import ConfigDronesWidget       from '../../../artifacts/monitoring/widgets/ConfigDronesWidget'
import ReporteSanitarioWidget   from '../../../artifacts/monitoring/widgets/ReporteSanitarioWidget'
import CamaraListaWidget        from '../../../artifacts/monitoring/widgets/CamaraListaWidget'
import CamaraFeedWidget         from '../../../artifacts/monitoring/widgets/CamaraFeedWidget'
import CamaraConfigWidget       from '../../../artifacts/monitoring/widgets/CamaraConfigWidget'
import CamaraAgregarWidget      from '../../../artifacts/monitoring/widgets/CamaraAgregarWidget'
import ConfigCamarasWidget      from '../../../artifacts/monitoring/widgets/ConfigCamarasWidget'
import ConfigCorralesWidget     from '../../../artifacts/monitoring/widgets/ConfigCorralesWidget'

// ── Sanidad ───────────────────────────────────────────────────────────────────
import GusanoWidget from '../../../artifacts/sanidad/widgets/GusanoWidget'

// ── Gemelo Digital ────────────────────────────────────────────────────────────
import TwinsTimelineWidget from '../../../artifacts/twins/widgets/TwinsTimelineWidget'
import TwinsFeedWidget from '../../../artifacts/twins/widgets/TwinsFeedWidget'
import TwinsAlimentacionWidget from '../../../artifacts/twins/widgets/TwinsAlimentacionWidget'

// ── Biometría ─────────────────────────────────────────────────────────────────
import BiometriaCapturaWidget from '../../../artifacts/biometria/widgets/BiometriaCapturaWidget'
import BiometriaHistorialWidget from '../../../artifacts/biometria/widgets/BiometriaHistorialWidget'
import BiometriaEstadisticasWidget from '../../../artifacts/biometria/widgets/BiometriaEstadisticasWidget'
import BiometriaConfigWidget from '../../../artifacts/biometria/widgets/BiometriaConfigWidget'
import BiometriaRegistrarWidget from '../../../artifacts/biometria/widgets/BiometriaRegistrarWidget'
import { MOCK_REGISTROS_BIOMETRIA } from './mockData'

// ── Certificación ─────────────────────────────────────────────────────────────
import CertificationCardWidget from '../../../artifacts/certification/widgets/CertificationCardWidget'
import CertificationElegibilidadWidget from '../../../artifacts/certification/widgets/CertificationElegibilidadWidget'
import CertificationChecklistWidget from '../../../artifacts/certification/widgets/CertificationChecklistWidget'
import CertificationDocumentosWidget from '../../../artifacts/certification/widgets/CertificationDocumentosWidget'
import CertificationVencimientosWidget from '../../../artifacts/certification/widgets/CertificationVencimientosWidget'

// ── Verificación ──────────────────────────────────────────────────────────────
import VerificationColaWidget from '../../../artifacts/verification/widgets/VerificationColaWidget'
import VerificationItemWidget from '../../../artifacts/verification/widgets/VerificationItemWidget'
import VerificationHistorialWidget from '../../../artifacts/verification/widgets/VerificationHistorialWidget'
import VerificationInconsistenciasWidget from '../../../artifacts/verification/widgets/VerificationInconsistenciasWidget'

// ── Exportación ───────────────────────────────────────────────────────────────
import ExportacionSolicitudWidget from '../../../artifacts/exportacion/widgets/ExportacionSolicitudWidget'
import ExportacionTablaWidget from '../../../artifacts/exportacion/widgets/ExportacionTablaWidget'
import ExportacionValidacionWidget from '../../../artifacts/exportacion/widgets/ExportacionValidacionWidget'
import ExportacionScannerWidget from '../../../artifacts/exportacion/widgets/ExportacionScannerWidget'

// ── Vinculación ───────────────────────────────────────────────────────────────
import VinculacionListaWidget from '../../../artifacts/vinculacion/widgets/VinculacionListaWidget'
import VinculacionPendientesWidget from '../../../artifacts/vinculacion/widgets/VinculacionPendientesWidget'
import VinculacionNuevaWidget from '../../../artifacts/vinculacion/widgets/VinculacionNuevaWidget'
import VinculacionHistorialWidget from '../../../artifacts/vinculacion/widgets/VinculacionHistorialWidget'

// ── Documentos ────────────────────────────────────────────────────────────────
import DocSubidaWidget       from '../../../artifacts/documentos/widgets/DocSubidaWidget'
import DocValidacionWidget   from '../../../artifacts/documentos/widgets/DocValidacionWidget'
import DocExpedienteWidget   from '../../../artifacts/documentos/widgets/DocExpedienteWidget'
import DocEmpaqueWidget      from '../../../artifacts/documentos/widgets/DocEmpaqueWidget'
import DocRevisionWidget     from '../../../artifacts/documentos/widgets/DocRevisionWidget'
import DocPanelGeneralWidget from '../../../artifacts/documentos/widgets/DocPanelGeneralWidget'

// ── Trámites ──────────────────────────────────────────────────────────────────
import TramiteNuevoWidget from '../../../artifacts/documentos/widgets/TramiteNuevoWidget'
import {
  MOCK_CERT_CARDS,
  MOCK_ELEGIBILIDAD,
  MOCK_CHECKLIST,
  MOCK_DOCUMENTOS,
  MOCK_VENCIMIENTOS,
  MOCK_VERIFICATION_COLA,
  MOCK_VERIFICATION_ITEM,
  MOCK_VERIFICATION_HISTORIAL,
  MOCK_VERIFICATION_INCONSISTENCIAS,
  MOCK_VINCULACIONES,
  MOCK_VINCULACIONES_PENDIENTES,
  MOCK_VINCULACIONES_HISTORIAL,
} from './mockData'

export interface WidgetCallbacks {
  onExpand: () => void
}

const EXPANDABLE_WIDGETS = new Set([
  // Ficha Ganadera
  'passport:card',
  'passport:perfiles',
  'passport:documentos',
  'passport:biometria',
  // Monitoring — todos
  'monitoring:mapa',
  'monitoring:sensor',
  'monitoring:anomalia',
  'monitoring:trazabilidad',
  'monitoring:anomalia:registrar',
  'monitoring:caso',
  'monitoring:drones',
  'monitoring:reporte',
  'mapa:corral-detalle',
  'anomalia:detalle',
  'anomalia:config-umbral',
  'camara:lista',
  'camara:feed',
  'camara:config',
  'camara:agregar',
  'config:camaras',
  'config:corrales',
  'sensor:calibracion',
  // Twins
  'twins:timeline',
  'twins:feed',
  'twins:alimentacion',
  // Biometría
  'biometria:captura',
  'biometria:resultado',
  'biometria:historial',
  'biometria:estadisticas',
  'biometria:config',
  'biometria:registrar',
  // Certificación
  'certification:card',
  'certification:elegibilidad',
  'certification:checklist',
  'certification:documentos',
  'certification:vencimientos',
  // Verificación
  'verification:cola',
  'verification:item',
  'verification:historial',
  'verification:inconsistencias',
  // Exportación
  'exportacion:solicitud',
  'exportacion:tabla',
  'exportacion:validacion',
  'exportacion:scanner',
  // Vinculación
  'vinculacion:lista',
  'vinculacion:pendientes',
  'vinculacion:nueva',
  'vinculacion:historial',
  // Documentos
  'documentos:subida',
  'documentos:validacion',
  'documentos:expedientes',
  'documentos:empacar',
  'documentos:revision',
  'documentos:panel',
  // Trámites
  'tramites:nuevo',
])

export function renderWidget(
  widgetId: string,
  { onExpand }: WidgetCallbacks,
): React.ReactNode {

  const node = getWidgetNode(widgetId, onExpand)
  if (!node) return null

  if (EXPANDABLE_WIDGETS.has(widgetId)) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {node}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1, height: '0.2px', background: 'rgba(231,229,228,0.5)' }} />
          <button
            onClick={onExpand}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 14px',
              borderRadius: 10,
              border: '1px solid rgba(231,229,228,0.9)',
              background: 'white',
              color: '#78716c',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 150ms ease',
            }}
            onMouseEnter={e => {
              const b = e.currentTarget as HTMLButtonElement
              b.style.color = '#44403c'
              b.style.borderColor = 'rgba(168,162,158,0.6)'
              b.style.background = '#f5f5f4'
              const ico = b.querySelector('svg') as SVGElement | null
              if (ico) ico.style.transform = 'scale(1.25) translate(1px,-1px)'
            }}
            onMouseLeave={e => {
              const b = e.currentTarget as HTMLButtonElement
              b.style.color = '#78716c'
              b.style.borderColor = 'rgba(231,229,228,0.9)'
              b.style.background = 'white'
              const ico = b.querySelector('svg') as SVGElement | null
              if (ico) ico.style.transform = 'scale(1) translate(0,0)'
            }}
          >
            Ver módulo completo
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'transform 200ms ease' }}>
              <polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" />
              <line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" />
            </svg>
          </button>
        </div>
      </div>
    )
  }

  return node
}

function getWidgetNode(widgetId: string, onExpand: () => void): React.ReactNode {
  switch (widgetId) {

    // ── Ficha Ganadera ──
    case 'passport:card':
      return (
        <FichaCard
          data={MOCK_PASSPORT}
          onHuella={onExpand}
        />
      )

    case 'passport:perfiles':
      return <FichaPerfilesWidget onNuevo={onExpand} onSelectAnimal={onExpand} />

    case 'passport:documentos':
      return <FichaDocumentosWidget animalId="" animalNombre="—" animalArete="—" />

    case 'passport:biometria':
      return <FichaHuellaWidget />

    case 'passport:nuevo':
      return <FichaNuevoWidget onCancelar={onExpand} onGuardar={onExpand} />

    // ── Mapa ──
    case 'monitoring:mapa':
      return <MapaVistaGeneralWidget />

    case 'mapa:corral-detalle':
      return <MapaCorralDetalleWidget />

    // ── Sensor ──
    case 'monitoring:sensor':
      return <SensorConteoLiveWidget />

    case 'sensor:calibracion':
      return <SensorCalibracionWidget />

    // ── Anomalía ──
    case 'monitoring:anomalia':
      return <AnomaliaFeedWidget />

    case 'monitoring:anomalia:registrar':
      return <AnomaliaRegistrarWidget corrales={[]} onGuardar={async () => {}} onCancelar={() => {}} />

    case 'monitoring:caso':
      return <AnomaliaFeedWidget />

    case 'anomalia:detalle':
      return <AnomaliaDetalleWidget />

    case 'anomalia:config-umbral':
      return <AnomaliaConfigUmbralWidget />

    // ── Trazabilidad ──
    case 'monitoring:trazabilidad':
      return <TrazabilidadWidget />

    // ── Drones ──
    case 'monitoring:drones':
      return <ConfigDronesWidget />

    // ── Reporte PDF ──
    case 'monitoring:reporte':
      return <ReporteSanitarioWidget />

    // ── Cámara ──
    case 'camara:lista':
      return <CamaraListaWidget />

    case 'camara:feed':
      return <CamaraFeedWidget />

    case 'camara:config':
      return <CamaraConfigWidget />

    case 'camara:agregar':
      return <CamaraAgregarWidget />

    case 'config:camaras':
      return <ConfigCamarasWidget />

    case 'config:corrales':
      return <ConfigCorralesWidget />

    // ── Trámites ──
    case 'tramites:nuevo':
      return <TramiteNuevoWidget />

    // ── Sanidad ──
    case 'sanidad:gusano':
      return <GusanoWidget />

    // ── Gemelo Digital ──
    case 'twins:timeline':
      return <TwinsTimelineWidget eventos={MOCK_EVENTOS_TWINS} ubicacionActual="Corral 1" />

    case 'twins:feed':
      return <TwinsFeedWidget auditorias={MOCK_AUDITORIAS_TWINS} completitud={78} />

    case 'twins:alimentacion':
      return <TwinsAlimentacionWidget datos={MOCK_ALIMENTACION_TWINS} />

    // ── Biometría ──
    case 'biometria:captura':
      return <BiometriaCapturaWidget compact />

    case 'biometria:resultado':
      return null

    case 'biometria:historial':
      return <BiometriaHistorialWidget registros={MOCK_REGISTROS_BIOMETRIA} />

    case 'biometria:estadisticas':
      return <BiometriaEstadisticasWidget registros={MOCK_REGISTROS_BIOMETRIA} />

    case 'biometria:config':
      return <BiometriaConfigWidget />

    case 'biometria:registrar':
      return <BiometriaRegistrarWidget />

    // ── Certificación ──
    case 'certification:card':
      return <CertificationCardWidget data={MOCK_CERT_CARDS[0]} onExpand={onExpand} onVerCheck={onExpand} />

    case 'certification:elegibilidad':
      return <CertificationElegibilidadWidget datos={MOCK_ELEGIBILIDAD} onExpedir={onExpand} onVerDetalle={onExpand} />

    case 'certification:checklist':
      return <CertificationChecklistWidget datos={MOCK_CHECKLIST} />

    case 'certification:documentos':
      return <CertificationDocumentosWidget datos={MOCK_DOCUMENTOS} />

    case 'certification:vencimientos':
      return <CertificationVencimientosWidget vencimientos={MOCK_VENCIMIENTOS} />

    // ── Verificación ──
    case 'verification:cola':
      return <VerificationColaWidget items={MOCK_VERIFICATION_COLA} />

    case 'verification:item':
      return <VerificationItemWidget item={MOCK_VERIFICATION_ITEM} />

    case 'verification:historial':
      return <VerificationHistorialWidget historial={MOCK_VERIFICATION_HISTORIAL} />

    case 'verification:inconsistencias':
      return <VerificationInconsistenciasWidget inconsistencias={MOCK_VERIFICATION_INCONSISTENCIAS} />

    // ── Exportación ──
    case 'exportacion:solicitud':
      return <ExportacionSolicitudWidget />

    case 'exportacion:tabla':
      return <ExportacionTablaWidget />

    case 'exportacion:validacion':
      return <ExportacionValidacionWidget />

    case 'exportacion:scanner':
      return <ExportacionScannerWidget />

    // ── Vinculación ──
    case 'vinculacion:lista':
      return <VinculacionListaWidget vinculaciones={MOCK_VINCULACIONES} />

    case 'vinculacion:pendientes':
      return <VinculacionPendientesWidget pendientes={MOCK_VINCULACIONES_PENDIENTES} />

    case 'vinculacion:nueva':
      return <VinculacionNuevaWidget />

    case 'vinculacion:historial':
      return <VinculacionHistorialWidget historial={MOCK_VINCULACIONES_HISTORIAL} />

    // ── Documentos ──
    case 'documentos:subida':
      return <DocSubidaWidget />

    case 'documentos:validacion':
      return <DocValidacionWidget />

    case 'documentos:expedientes':
      return <DocExpedienteWidget />

    case 'documentos:empacar':
      return <DocEmpaqueWidget />

    case 'documentos:revision':
      return <DocRevisionWidget />

    case 'documentos:panel':
      return <DocPanelGeneralWidget />

    default:
      return null
  }
}