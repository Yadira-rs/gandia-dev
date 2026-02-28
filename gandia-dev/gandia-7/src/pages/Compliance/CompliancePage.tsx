import { useNavigate } from 'react-router-dom'
import { Shield, ArrowLeft, CheckCircle, FileText, Building2, Globe, Lock, Award } from 'lucide-react'

const CompliancePage = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-[#0c0a09] text-stone-900 dark:text-stone-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-stone-50/80 dark:bg-[#0c0a09]/80 backdrop-blur-xl border-b border-stone-200 dark:border-stone-800">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/home')}
              className="flex items-center gap-2 text-sm text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al inicio
            </button>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#2FAF8F]" />
              <span className="font-semibold">GANDIA</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#2FAF8F]/30 mb-6">
            <div className="w-2 h-2 rounded-full bg-[#2FAF8F]" />
            <span className="text-sm font-medium text-[#2FAF8F] uppercase tracking-wider">
              Cumplimiento Normativo
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-semibold mb-4">
            Marco Regulatorio y Gobernanza
          </h1>
          <p className="text-lg text-stone-600 dark:text-stone-400 max-w-3xl mx-auto">
            GANDIA opera en pleno cumplimiento de la normativa mexicana e internacional para trazabilidad ganadera, 
            manteniendo los más altos estándares de seguridad, transparencia y responsabilidad institucional.
          </p>
        </div>

        {/* Disclaimer Institucional */}
        <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/50 rounded-xl p-6 mb-12">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5 text-orange-600 dark:text-orange-400" strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="font-semibold text-orange-900 dark:text-orange-200 mb-2">
                Aviso de Responsabilidad Institucional
              </h3>
              <p className="text-sm text-orange-800 dark:text-orange-300 leading-relaxed">
                <strong>GANDIA NO sustituye los registros oficiales ante autoridades competentes.</strong> Opera como infraestructura 
                digital complementaria para la trazabilidad, documentación y certificación del ganado. Los certificados emitidos 
                por GANDIA tienen validez comercial cuando se acompañan de la documentación oficial requerida por SENASICA, 
                SAGARPA/SADER y demás autoridades sanitarias correspondientes.
              </p>
            </div>
          </div>
        </div>

        {/* Marco Normativo Mexicano */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <FileText className="w-6 h-6 text-[#2FAF8F]" strokeWidth={1.5} />
            <h2 className="text-3xl font-semibold">Marco Normativo Mexicano</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-[#2FAF8F]" strokeWidth={1.5} />
                Normativa Sanitaria
              </h3>
              <ul className="space-y-3 text-sm text-stone-600 dark:text-stone-400">
                <li className="flex items-start gap-2">
                  <span className="text-[#2FAF8F] mt-1">•</span>
                  <span><strong>NOM-001-ZOO-1994:</strong> Sistema Nacional de Identificación Animal para Bovinos</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#2FAF8F] mt-1">•</span>
                  <span><strong>NOM-051-ZOO-1995:</strong> Trato humanitario en movilización de animales</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#2FAF8F] mt-1">•</span>
                  <span><strong>NOM-046-ZOO-1995:</strong> Sistema Nacional de Vigilancia Epizootológica</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#2FAF8F] mt-1">•</span>
                  <span><strong>Acuerdo SENASICA:</strong> Lineamientos de trazabilidad para ganado destinado a exportación</span>
                </li>
              </ul>
            </div>

            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-[#2FAF8F]" strokeWidth={1.5} />
                Protección de Datos
              </h3>
              <ul className="space-y-3 text-sm text-stone-600 dark:text-stone-400">
                <li className="flex items-start gap-2">
                  <span className="text-[#2FAF8F] mt-1">•</span>
                  <span><strong>LFPDPPP:</strong> Ley Federal de Protección de Datos Personales en Posesión de Particulares</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#2FAF8F] mt-1">•</span>
                  <span><strong>INAI:</strong> Instituto Nacional de Transparencia, Acceso a la Información y Protección de Datos Personales</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#2FAF8F] mt-1">•</span>
                  <span><strong>Aviso de Privacidad:</strong> Cumplimiento integral según Art. 15-17 LFPDPPP</span>
                </li>
              </ul>
            </div>

            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-[#2FAF8F]" strokeWidth={1.5} />
                Regulación Comercial
              </h3>
              <ul className="space-y-3 text-sm text-stone-600 dark:text-stone-400">
                <li className="flex items-start gap-2">
                  <span className="text-[#2FAF8F] mt-1">•</span>
                  <span><strong>Ley Federal de Sanidad Animal:</strong> Movilización y comercialización de ganado</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#2FAF8F] mt-1">•</span>
                  <span><strong>Código Fiscal:</strong> Emisión de comprobantes fiscales digitales (CFDI)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#2FAF8F] mt-1">•</span>
                  <span><strong>SAGARPA:</strong> Registro de Unidades de Producción Pecuaria (UPP)</span>
                </li>
              </ul>
            </div>

            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-[#2FAF8F]" strokeWidth={1.5} />
                Certificación Digital
              </h3>
              <ul className="space-y-3 text-sm text-stone-600 dark:text-stone-400">
                <li className="flex items-start gap-2">
                  <span className="text-[#2FAF8F] mt-1">•</span>
                  <span><strong>NOM-151-SCFI-2016:</strong> Requisitos de firma electrónica avanzada</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#2FAF8F] mt-1">•</span>
                  <span><strong>Código de Comercio:</strong> Validez de mensajes de datos y documentos electrónicos</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#2FAF8F] mt-1">•</span>
                  <span><strong>Infraestructura PKI:</strong> Certificados digitales validados por autoridad certificadora</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Cumplimiento Internacional */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <Globe className="w-6 h-6 text-[#2FAF8F]" strokeWidth={1.5} />
            <h2 className="text-3xl font-semibold">Cumplimiento Internacional</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-6">
              <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center mb-4">
                <Globe className="w-6 h-6 text-blue-600 dark:text-blue-400" strokeWidth={1.5} />
              </div>
              <h3 className="font-semibold mb-2">Estados Unidos</h3>
              <p className="text-sm text-stone-600 dark:text-stone-400 mb-3">
                Cumplimiento de requisitos USDA-APHIS para importación de ganado mexicano
              </p>
              <ul className="space-y-2 text-xs text-stone-500 dark:text-stone-500">
                <li>• Certificación sanitaria oficial</li>
                <li>• Trazabilidad individual de animales</li>
                <li>• Documentación de origen verificable</li>
              </ul>
            </div>

            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-6">
              <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-950/30 flex items-center justify-center mb-4">
                <Globe className="w-6 h-6 text-green-600 dark:text-green-400" strokeWidth={1.5} />
              </div>
              <h3 className="font-semibold mb-2">Canadá</h3>
              <p className="text-sm text-stone-600 dark:text-stone-400 mb-3">
                Alineación con CFIA (Canadian Food Inspection Agency)
              </p>
              <ul className="space-y-2 text-xs text-stone-500 dark:text-stone-500">
                <li>• Sistema de identificación individual</li>
                <li>• Registros de movimiento</li>
                <li>• Certificados veterinarios</li>
              </ul>
            </div>

            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-6">
              <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-950/30 flex items-center justify-center mb-4">
                <Globe className="w-6 h-6 text-purple-600 dark:text-purple-400" strokeWidth={1.5} />
              </div>
              <h3 className="font-semibold mb-2">Unión Europea</h3>
              <p className="text-sm text-stone-600 dark:text-stone-400 mb-3">
                Preparación para estándares EU de trazabilidad bovina
              </p>
              <ul className="space-y-2 text-xs text-stone-500 dark:text-stone-500">
                <li>• Pasaporte ganadero electrónico</li>
                <li>• Base de datos centralizada</li>
                <li>• Trazabilidad "de la granja al tenedor"</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Seguridad Técnica */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <Lock className="w-6 h-6 text-[#2FAF8F]" strokeWidth={1.5} />
            <h2 className="text-3xl font-semibold">Seguridad y Protección de Datos</h2>
          </div>

          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold text-lg mb-4">Encriptación y Seguridad</h3>
                <ul className="space-y-3 text-sm text-stone-600 dark:text-stone-400">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-[#2FAF8F] shrink-0 mt-0.5" strokeWidth={1.5} />
                    <span><strong>AES-256:</strong> Encriptación de datos en reposo con estándar militar</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-[#2FAF8F] shrink-0 mt-0.5" strokeWidth={1.5} />
                    <span><strong>TLS 1.3:</strong> Comunicaciones encriptadas punto a punto</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-[#2FAF8F] shrink-0 mt-0.5" strokeWidth={1.5} />
                    <span><strong>MFA:</strong> Autenticación multifactor obligatoria para roles críticos</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-[#2FAF8F] shrink-0 mt-0.5" strokeWidth={1.5} />
                    <span><strong>HSM:</strong> Módulos de seguridad de hardware para claves criptográficas</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-4">Infraestructura Cloud Certificada</h3>
                <ul className="space-y-3 text-sm text-stone-600 dark:text-stone-400">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-[#2FAF8F] shrink-0 mt-0.5" strokeWidth={1.5} />
                    <span><strong>AWS / Google Cloud:</strong> Centros de datos con certificación SOC 2 Tipo II</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-[#2FAF8F] shrink-0 mt-0.5" strokeWidth={1.5} />
                    <span><strong>Respaldos automáticos:</strong> Backup incremental cada 6 horas, retención 90 días</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-[#2FAF8F] shrink-0 mt-0.5" strokeWidth={1.5} />
                    <span><strong>Geo-redundancia:</strong> Datos replicados en múltiples regiones</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-[#2FAF8F] shrink-0 mt-0.5" strokeWidth={1.5} />
                    <span><strong>DDoS Protection:</strong> Mitigación automática de ataques distribuidos</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-4">Control de Acceso</h3>
                <ul className="space-y-3 text-sm text-stone-600 dark:text-stone-400">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-[#2FAF8F] shrink-0 mt-0.5" strokeWidth={1.5} />
                    <span><strong>RBAC:</strong> Control de acceso basado en roles granulares</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-[#2FAF8F] shrink-0 mt-0.5" strokeWidth={1.5} />
                    <span><strong>Principio de mínimo privilegio:</strong> Acceso estricto según necesidad</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-[#2FAF8F] shrink-0 mt-0.5" strokeWidth={1.5} />
                    <span><strong>Sesiones temporales:</strong> Tokens JWT con expiración automática</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-[#2FAF8F] shrink-0 mt-0.5" strokeWidth={1.5} />
                    <span><strong>IP Whitelisting:</strong> Restricción geográfica para operaciones sensibles</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-4">Auditoría y Monitoreo</h3>
                <ul className="space-y-3 text-sm text-stone-600 dark:text-stone-400">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-[#2FAF8F] shrink-0 mt-0.5" strokeWidth={1.5} />
                    <span><strong>Logs inmutables:</strong> Registro de todas las operaciones críticas</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-[#2FAF8F] shrink-0 mt-0.5" strokeWidth={1.5} />
                    <span><strong>SIEM:</strong> Monitoreo 24/7 de eventos de seguridad</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-[#2FAF8F] shrink-0 mt-0.5" strokeWidth={1.5} />
                    <span><strong>Alertas en tiempo real:</strong> Notificación inmediata de anomalías</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-[#2FAF8F] shrink-0 mt-0.5" strokeWidth={1.5} />
                    <span><strong>Pentesting semestral:</strong> Auditorías de seguridad por terceros</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Gobernanza del Sistema */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <Building2 className="w-6 h-6 text-[#2FAF8F]" strokeWidth={1.5} />
            <h2 className="text-3xl font-semibold">Gobernanza del Sistema</h2>
          </div>

          <div className="space-y-6">
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-6">
              <h3 className="font-semibold text-lg mb-4">Supervisión y Validación</h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <div className="text-sm font-semibold text-[#2FAF8F] mb-2">Validación de Usuarios</div>
                  <p className="text-sm text-stone-600 dark:text-stone-400">
                    Todas las solicitudes de acceso son revisadas manualmente en 24-48 horas hábiles. 
                    Se validan credenciales oficiales, registros ante SAGARPA/SADER y documentación profesional.
                  </p>
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#2FAF8F] mb-2">Auditoría de Datos</div>
                  <p className="text-sm text-stone-600 dark:text-stone-400">
                    Los datos ingresados son validados contra registros oficiales. Las discrepancias activan 
                    alertas para revisión por personal certificado antes de emitir certificaciones.
                  </p>
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#2FAF8F] mb-2">Emisión de Certificados</div>
                  <p className="text-sm text-stone-600 dark:text-stone-400">
                    Los certificados digitales se emiten únicamente tras validación completa por MVZ certificados 
                    y revisión de coherencia entre pasaporte digital, gemelo digital y evidencias de monitoreo.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-6">
              <h3 className="font-semibold text-lg mb-4">Proceso de Certificación (ACIPE)</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-[#2FAF8F]/10 flex items-center justify-center shrink-0 text-sm font-semibold text-[#2FAF8F]">
                    1
                  </div>
                  <div>
                    <div className="font-semibold mb-1">Registro del Animal</div>
                    <p className="text-sm text-stone-600 dark:text-stone-400">
                      Creación de pasaporte digital con identificación biométrica (arete RFID, huella de morro, fotografías)
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-[#2FAF8F]/10 flex items-center justify-center shrink-0 text-sm font-semibold text-[#2FAF8F]">
                    2
                  </div>
                  <div>
                    <div className="font-semibold mb-1">Gemelo Digital Continuo</div>
                    <p className="text-sm text-stone-600 dark:text-stone-400">
                      Timeline cronológico de eventos: vacunaciones, tratamientos, movimientos, inspecciones veterinarias
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-[#2FAF8F]/10 flex items-center justify-center shrink-0 text-sm font-semibold text-[#2FAF8F]">
                    3
                  </div>
                  <div>
                    <div className="font-semibold mb-1">Monitoreo y Evidencias</div>
                    <p className="text-sm text-stone-600 dark:text-stone-400">
                      Registro multimedia: fotografías georeferenciadas, videos, documentos escaneados con timestamp verificable
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-[#2FAF8F]/10 flex items-center justify-center shrink-0 text-sm font-semibold text-[#2FAF8F]">
                    4
                  </div>
                  <div>
                    <div className="font-semibold mb-1">Validación Cruzada</div>
                    <p className="text-sm text-stone-600 dark:text-stone-400">
                      Sistema verifica coherencia entre pasaporte, gemelo y evidencias. Algoritmos de ML detectan anomalías
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-[#2FAF8F]/10 flex items-center justify-center shrink-0 text-sm font-semibold text-[#2FAF8F]">
                    5
                  </div>
                  <div>
                    <div className="font-semibold mb-1">Revisión Humana (MVZ/Auditor)</div>
                    <p className="text-sm text-stone-600 dark:text-stone-400">
                      Personal certificado revisa documentación completa y valida cumplimiento sanitario
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-[#2FAF8F]/10 flex items-center justify-center shrink-0 text-sm font-semibold text-[#2FAF8F]">
                    6
                  </div>
                  <div>
                    <div className="font-semibold mb-1">Emisión de Certificado Digital</div>
                    <p className="text-sm text-stone-600 dark:text-stone-400">
                      Documento firmado digitalmente con validez comercial e internacional, código QR verificable
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Entidades Colaboradoras */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <Award className="w-6 h-6 text-[#2FAF8F]" strokeWidth={1.5} />
            <h2 className="text-3xl font-semibold">Alineación Institucional</h2>
          </div>

          <div className="bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-8">
            <p className="text-sm text-stone-600 dark:text-stone-400 mb-6">
              GANDIA opera como infraestructura complementaria <strong>interoperable</strong> con sistemas oficiales. 
              No es una dependencia gubernamental ni está afiliado orgánicamente a las siguientes entidades, 
              pero mantiene alineación técnica y normativa:
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3">Autoridades Federales</h3>
                <ul className="space-y-2 text-sm text-stone-600 dark:text-stone-400">
                  <li className="flex items-start gap-2">
                    <span className="text-[#2FAF8F]">•</span>
                    <span><strong>SENASICA</strong> - Servicio Nacional de Sanidad, Inocuidad y Calidad Agroalimentaria</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#2FAF8F]">•</span>
                    <span><strong>SADER</strong> - Secretaría de Agricultura y Desarrollo Rural</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#2FAF8F]">•</span>
                    <span><strong>INAI</strong> - Instituto Nacional de Transparencia, Acceso a la Información y Protección de Datos Personales</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Organizaciones del Sector</h3>
                <ul className="space-y-2 text-sm text-stone-600 dark:text-stone-400">
                  <li className="flex items-start gap-2">
                    <span className="text-[#2FAF8F]">•</span>
                    <span><strong>CNOG</strong> - Confederación Nacional de Organizaciones Ganaderas</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#2FAF8F]">•</span>
                    <span><strong>Uniones Ganaderas Regionales</strong> - Durango, Chihuahua, Sonora, Coahuila</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#2FAF8F]">•</span>
                    <span><strong>Colegios de MVZ</strong> - Médicos Veterinarios Zootecnistas estatales</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Certificaciones y Estándares */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <Award className="w-6 h-6 text-[#2FAF8F]" strokeWidth={1.5} />
            <h2 className="text-3xl font-semibold">Certificaciones y Estándares Técnicos</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-6">
              <div className="font-semibold mb-2">Certificaciones Actuales</div>
              <ul className="space-y-2 text-sm text-stone-600 dark:text-stone-400">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[#2FAF8F]" strokeWidth={1.5} />
                  <span>SOC 2 Type II (infraestructura cloud)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[#2FAF8F]" strokeWidth={1.5} />
                  <span>TLS 1.3 / HTTPS obligatorio</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[#2FAF8F]" strokeWidth={1.5} />
                  <span>LFPDPPP compliance</span>
                </li>
              </ul>
            </div>

            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-6">
              <div className="font-semibold mb-2">En Proceso (2026)</div>
              <ul className="space-y-2 text-sm text-stone-600 dark:text-stone-400">
                <li className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-orange-500" />
                  <span>ISO 27001 (Seguridad de la Información)</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-orange-500" />
                  <span>ISO 9001 (Gestión de Calidad)</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-orange-500" />
                  <span>Auditoría SENASICA</span>
                </li>
              </ul>
            </div>

            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-6">
              <div className="font-semibold mb-2">Roadmap (2027+)</div>
              <ul className="space-y-2 text-sm text-stone-600 dark:text-stone-400">
                <li className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-stone-400 dark:border-stone-600" />
                  <span>ISO 22000 (Inocuidad Alimentaria)</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-stone-400 dark:border-stone-600" />
                  <span>GLOBALG.A.P. Livestock</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-stone-400 dark:border-stone-600" />
                  <span>Certificación Blockchain (trazabilidad)</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Contacto Legal */}
        <section>
          <div className="bg-[#2FAF8F]/5 dark:bg-[#2FAF8F]/10 border border-[#2FAF8F]/20 rounded-xl p-8">
            <h2 className="text-2xl font-semibold mb-6">Información Legal y Contacto</h2>
            <div className="grid md:grid-cols-2 gap-8 text-sm">
              <div>
                <h3 className="font-semibold mb-3">Razón Social</h3>
                <p className="text-stone-600 dark:text-stone-400 leading-relaxed">
                  <strong>GANDIA Technologies S.A. de C.V.</strong><br />
                  RFC: GAN260213ABC<br />
                  Blvd. Francisco Villa 1234<br />
                  Col. Tierra Blanca, C.P. 34080<br />
                  Durango, Durango, México
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Contacto Institucional</h3>
                <p className="text-stone-600 dark:text-stone-400 leading-relaxed">
                  <strong>Email:</strong> contacto@gandia.mx<br />
                  <strong>Legal:</strong> legal@gandia.mx<br />
                  <strong>Privacidad:</strong> privacidad@gandia.mx<br />
                  <strong>Soporte:</strong> soporte@gandia.mx<br />
                  <strong>Teléfono:</strong> +52 (618) 123-4567
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default CompliancePage