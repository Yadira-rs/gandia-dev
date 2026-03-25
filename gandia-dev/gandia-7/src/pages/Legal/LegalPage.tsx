import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Shield, ArrowLeft, FileText, Lock, Cookie, Scale } from 'lucide-react'

type Section = 'terms' | 'privacy' | 'cookies' | 'lfpdppp'

const LegalPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialSection = (searchParams.get('section') as Section) || 'terms'
  const [activeSection, setActiveSection] = useState<Section>(initialSection)

  const sections = [
    { id: 'terms' as Section, label: 'Términos y Condiciones', icon: FileText },
    { id: 'privacy' as Section, label: 'Política de Privacidad', icon: Lock },
    { id: 'lfpdppp' as Section, label: 'Aviso de Privacidad LFPDPPP', icon: Scale },
    { id: 'cookies' as Section, label: 'Política de Cookies', icon: Cookie }
  ]

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
              <span className="font-semibold">GANDIA 7</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-2">
              <h2 className="text-sm font-semibold text-stone-500 dark:text-stone-600 uppercase tracking-wider mb-4">
                Documentos Legales
              </h2>
              {sections.map(section => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${
                    activeSection === section.id
                      ? 'bg-[#2FAF8F]/10 text-[#2FAF8F] font-medium'
                      : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-900'
                  }`}
                >
                  <section.icon className="w-4 h-4" strokeWidth={1.5} />
                  <span className="text-sm">{section.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <div className="prose prose-stone dark:prose-invert max-w-none">
              {activeSection === 'terms' && <TermsContent />}
              {activeSection === 'privacy' && <PrivacyContent />}
              {activeSection === 'lfpdppp' && <LFPDPPPContent />}
              {activeSection === 'cookies' && <CookiesContent />}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ==========================================
// TÉRMINOS Y CONDICIONES
// ==========================================

const TermsContent = () => (
  <div>
    <h1>Términos y Condiciones de Uso</h1>
    <p className="text-sm text-stone-500 dark:text-stone-600">Última actualización: 24 de marzo de 2026</p>

    <h2>1. Aceptación de los Términos</h2>
    <p>
      Al acceder y utilizar la plataforma GANDIA 7 (en adelante, "la Plataforma"), usted acepta estar sujeto a estos Términos y Condiciones, 
      así como a todas las leyes y regulaciones aplicables en los Estados Unidos Mexicanos. Si no está de acuerdo con alguno de estos términos, 
      no debe utilizar esta Plataforma.
    </p>

    <h2>2. Definiciones</h2>
    <ul>
      <li><strong>GANDIA 7:</strong> Sistema Institucional de Trazabilidad Ganadera, infraestructura digital operada por GANDIA Technologies S.A. de C.V.</li>
      <li><strong>Usuario:</strong> Persona física o moral autorizada para acceder a la Plataforma.</li>
      <li><strong>Rancho:</strong> Unidad de Producción Pecuaria registrada en la Plataforma.</li>
      <li><strong>Pasaporte Digital:</strong> Documento electrónico oficial que contiene la identificación y trazabilidad del ganado.</li>
      <li><strong>Gemelo Digital:</strong> Registro cronológico continuo de eventos y evidencias del animal.</li>
    </ul>

    <h2>3. Naturaleza del Servicio</h2>
    <p>
      GANDIA 7 es una infraestructura digital complementaria que NO sustituye los registros oficiales ante autoridades competentes. 
      Opera como herramienta de apoyo para la trazabilidad, documentación y certificación del ganado bovino, ovino y caprino.
    </p>
    <p>
      Los certificados emitidos por GANDIA 7 tienen validez para fines comerciales y de exportación, siempre y cuando estén acompañados 
      de la documentación oficial requerida por las autoridades sanitarias correspondientes.
    </p>

    <h2>4. Acceso Institucional Controlado</h2>
    <p>El acceso a GANDIA 7 está restringido a:</p>
    <ul>
      <li>Productores ganaderos con registro oficial ante SAGARPA/SADER</li>
      <li>Médicos Veterinarios Zootecnistas certificados (MVZ)</li>
      <li>Uniones Ganaderas Regionales reconocidas</li>
      <li>Empresas exportadoras autorizadas</li>
      <li>Autoridades sanitarias oficiales (SENASICA, SEDAGRO estatal)</li>
      <li>Organismos certificadores acreditados</li>
    </ul>
    <p>
      Las solicitudes de acceso son revisadas y aprobadas en un plazo de 24 a 48 horas hábiles. 
      GANDIA 7 se reserva el derecho de aceptar o rechazar cualquier solicitud sin obligación de justificar su decisión.
    </p>

    <h2>5. Obligaciones del Usuario</h2>
    <p>Al utilizar GANDIA 7, el Usuario se compromete a:</p>
    <ul>
      <li>Proporcionar información veraz, exacta y actualizada</li>
      <li>Mantener la confidencialidad de sus credenciales de acceso</li>
      <li>No compartir su cuenta con terceros no autorizados</li>
      <li>Utilizar la Plataforma exclusivamente para fines legales y autorizados</li>
      <li>Cumplir con todas las normativas sanitarias y ganaderas aplicables</li>
      <li>Notificar inmediatamente cualquier uso no autorizado de su cuenta</li>
      <li>No intentar acceder a áreas restringidas o datos de otros usuarios</li>
    </ul>

    <h2>6. Propiedad Intelectual</h2>
    <p>
      Todos los derechos de propiedad intelectual sobre GANDIA 7, incluyendo pero no limitado a software, diseño, marca, 
      logotipos, contenido y documentación, son propiedad exclusiva de GANDIA Technologies S.A. de C.V.
    </p>
    <p>
      Los datos ingresados por el Usuario permanecen como propiedad del Usuario, quien otorga a GANDIA 7 una licencia 
      no exclusiva para procesarlos, almacenarlos y utilizarlos únicamente para la prestación del servicio.
    </p>

    <h2>7. Responsabilidad y Limitaciones</h2>
    <p>
      GANDIA 7 opera bajo el principio de "mejor esfuerzo" y no garantiza la disponibilidad ininterrumpida del servicio. 
      La Plataforma puede experimentar mantenimiento programado o interrupciones técnicas.
    </p>
    <p>GANDIA 7 NO es responsable por:</p>
    <ul>
      <li>Pérdida de datos debido a fallas técnicas, desastres naturales o caso fortuito</li>
      <li>Decisiones comerciales, sanitarias o legales basadas en la información de la Plataforma</li>
      <li>Rechazos de certificación por parte de autoridades oficiales</li>
      <li>Daños indirectos, consecuenciales o incidentales derivados del uso de la Plataforma</li>
      <li>Errores en la información proporcionada por el Usuario o terceros</li>
    </ul>

    <h2>8. Seguridad de la Información</h2>
    <p>
      GANDIA 7 implementa medidas de seguridad técnicas y organizativas para proteger la información del Usuario, 
      incluyendo encriptación AES-256, autenticación multifactor y auditoría de logs.
    </p>
    <p>
      Sin embargo, ningún sistema de transmisión o almacenamiento electrónico es 100% seguro. 
      El Usuario reconoce y acepta los riesgos inherentes al uso de plataformas digitales.
    </p>

    <h2>9. Modificaciones al Servicio</h2>
    <p>
      GANDIA 7 se reserva el derecho de modificar, suspender o descontinuar cualquier parte de la Plataforma en cualquier momento, 
      con o sin previo aviso. Las actualizaciones de estos Términos serán notificadas a través de la Plataforma.
    </p>

    <h2>10. Terminación de Acceso</h2>
    <p>GANDIA 7 puede suspender o terminar el acceso del Usuario en caso de:</p>
    <ul>
      <li>Incumplimiento de estos Términos</li>
      <li>Uso fraudulento o malintencionado de la Plataforma</li>
      <li>Solicitud del Usuario</li>
      <li>Requerimiento de autoridad competente</li>
      <li>Cese de operaciones del Usuario</li>
    </ul>

    <h2>11. Jurisdicción y Ley Aplicable</h2>
    <p>
      Estos Términos se rigen por las leyes de los Estados Unidos Mexicanos. Cualquier controversia derivada de estos Términos 
      será sometida a la jurisdicción de los tribunales competentes en Durango, Durango, renunciando las partes a cualquier 
      otra jurisdicción que pudiera corresponderles por razón de sus domicilios presentes o futuros.
    </p>

    <h2>12. Contacto</h2>
    <p>Para consultas sobre estos Términos, contacte a:</p>
    <p>
      <strong>GANDIA Technologies S.A. de C.V.</strong><br />
      Carretera Durango – Mezquital, Km. 4.5<br />
      C.P. 34308, Durango, Durango<br />
      RFC: Próximamente<br />
      Email: legal@gandia7.com<br />
      Teléfono: No disponible
    </p>
  </div>
)

// ==========================================
// POLÍTICA DE PRIVACIDAD
// ==========================================

const PrivacyContent = () => (
  <div>
    <h1>Política de Privacidad</h1>
    <p className="text-sm text-stone-500 dark:text-stone-600">Última actualización: 24 de marzo de 2026</p>

    <h2>1. Responsable del Tratamiento</h2>
    <p>
      <strong>GANDIA Technologies S.A. de C.V.</strong> (en adelante "GANDIA 7"), con domicilio en Carretera Durango – Mezquital, Km. 4.5, 
      C.P. 34308, Durango, Durango, es responsable del tratamiento de sus datos personales.
    </p>

    <h2>2. Datos Personales Recopilados</h2>
    
    <h3>2.1 Datos de Identificación</h3>
    <ul>
      <li>Nombre completo</li>
      <li>Fecha de nacimiento</li>
      <li>CURP</li>
      <li>RFC</li>
      <li>Género (opcional)</li>
      <li>Fotografía (en su caso)</li>
    </ul>

    <h3>2.2 Datos de Contacto</h3>
    <ul>
      <li>Correo electrónico</li>
      <li>Teléfono móvil</li>
      <li>Domicilio completo</li>
    </ul>

    <h3>2.3 Datos Profesionales e Institucionales</h3>
    <ul>
      <li>Cédula profesional (MVZ)</li>
      <li>Número de UPP / SINIIGA</li>
      <li>Registro sanitario</li>
      <li>Información de rancho o entidad</li>
      <li>Documentación oficial</li>
    </ul>

    <h3>2.4 Datos Técnicos</h3>
    <ul>
      <li>Dirección IP</li>
      <li>Cookies de sesión</li>
      <li>Registros de actividad (logs)</li>
      <li>Dispositivo y navegador</li>
      <li>Geolocalización (con consentimiento)</li>
    </ul>

    <h2>3. Finalidades del Tratamiento</h2>
    
    <h3>3.1 Finalidades Primarias (necesarias para el servicio)</h3>
    <ul>
      <li>Validación de identidad y autorización de acceso</li>
      <li>Prestación de servicios de trazabilidad ganadera</li>
      <li>Emisión de certificados digitales</li>
      <li>Cumplimiento de obligaciones legales</li>
      <li>Auditoría y seguimiento de operaciones</li>
      <li>Comunicaciones oficiales del sistema</li>
    </ul>

    <h3>3.2 Finalidades Secundarias (opcionales, requieren consentimiento)</h3>
    <ul>
      <li>Envío de boletines informativos del sector ganadero</li>
      <li>Notificaciones de actualizaciones y nuevas funcionalidades</li>
      <li>Análisis estadístico para mejora del servicio</li>
      <li>Estudios de mercado y desarrollo de nuevos productos</li>
    </ul>
    <p>
      Usted puede oponerse al tratamiento de sus datos para finalidades secundarias en cualquier momento, 
      sin que ello afecte el servicio principal.
    </p>

    <h2>4. Compartición de Datos</h2>
    <p>GANDIA 7 puede compartir sus datos personales con:</p>
    <ul>
      <li><strong>Autoridades Sanitarias:</strong> SENASICA, SEDAGRO, cuando sea requerido por normativa</li>
      <li><strong>Organismos Certificadores:</strong> Para validación de certificados de exportación</li>
      <li><strong>Proveedores de Servicios:</strong> Infraestructura cloud, procesamiento de pagos, servicios de soporte técnico</li>
      <li><strong>Autoridades Judiciales:</strong> Cuando sea ordenado por mandato legal</li>
    </ul>
    <p>
      Todos los terceros están obligados contractualmente a mantener la confidencialidad y seguridad de los datos.
    </p>

    <h2>5. Transferencias Internacionales</h2>
    <p>
      Los datos personales pueden ser almacenados en servidores ubicados en Estados Unidos (infraestructura cloud). 
      GANDIA garantiza que dichas transferencias cumplen con los estándares de protección establecidos en la 
      Ley Federal de Protección de Datos Personales en Posesión de los Particulares.
    </p>

    <h2>6. Medidas de Seguridad</h2>
    <p>GANDIA implementa las siguientes medidas de seguridad:</p>
    <ul>
      <li>Encriptación AES-256 para datos en reposo</li>
      <li>Encriptación TLS 1.3 para datos en tránsito</li>
      <li>Autenticación multifactor (2FA)</li>
      <li>Control de acceso basado en roles</li>
      <li>Auditoría completa de logs</li>
      <li>Respaldos automáticos diarios</li>
      <li>Monitoreo de seguridad 24/7</li>
      <li>Pruebas de penetración periódicas</li>
    </ul>

    <h2>7. Conservación de Datos</h2>
    <p>
      Los datos personales serán conservados durante el tiempo que el Usuario mantenga su cuenta activa, 
      más un período adicional de 5 años para cumplimiento de obligaciones fiscales y regulatorias.
    </p>
    <p>
      Los datos de trazabilidad del ganado se conservan permanentemente como registro histórico oficial, 
      según lo establecido en la normativa sanitaria mexicana.
    </p>

    <h2>8. Derechos ARCO</h2>
    <p>Usted tiene derecho a:</p>
    <ul>
      <li><strong>Acceder</strong> a sus datos personales en nuestro poder</li>
      <li><strong>Rectificar</strong> datos inexactos o incompletos</li>
      <li><strong>Cancelar</strong> sus datos cuando considere que no son necesarios</li>
      <li><strong>Oponerse</strong> al tratamiento para fines específicos</li>
    </ul>
    <p>
      Para ejercer sus derechos ARCO, envíe solicitud a: <strong>privacidad@gandia7.com</strong>
    </p>
    <p>Incluya:</p>
    <ul>
      <li>Nombre completo y correo electrónico registrado</li>
      <li>Descripción clara del derecho que desea ejercer</li>
      <li>Documentos que acrediten su identidad</li>
    </ul>
    <p>Responderemos en un plazo máximo de 20 días hábiles.</p>

    <h2>9. Revocación del Consentimiento</h2>
    <p>
      Puede revocar su consentimiento para el tratamiento de datos en cualquier momento, 
      enviando solicitud a privacidad@gandia7.com. La revocación no tendrá efectos retroactivos.
    </p>

    <h2>10. Cambios a esta Política</h2>
    <p>
      GANDIA 7 se reserva el derecho de actualizar esta Política de Privacidad. Las modificaciones se notificarán 
      a través de la Plataforma y por correo electrónico con 10 días de anticipación.
    </p>

    <h2>11. Contacto</h2>
    <p>
      Oficial de Privacidad: Diego Frías Ramírez<br />
      Email: privacidad@gandia7.com<br />
      Teléfono: No disponible
    </p>
  </div>
)

// ==========================================
// AVISO DE PRIVACIDAD LFPDPPP
// ==========================================

const LFPDPPPContent = () => (
  <div>
    <h1>Aviso de Privacidad</h1>
    <p className="text-sm text-stone-500 dark:text-stone-600">
      En cumplimiento de la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP)
    </p>

    <h2>Identidad y Domicilio del Responsable</h2>
    <p>
      <strong>GANDIA Technologies S.A. de C.V.</strong>, con domicilio en Carretera Durango – Mezquital, Km. 4.5, 
      C.P. 34308, Durango, Durango, México, es responsable del tratamiento 
      (obtención, uso, divulgación o almacenamiento) de sus datos personales.
    </p>

    <h2>Datos Personales que Recabamos</h2>
    <p>
      Para las finalidades señaladas en este aviso de privacidad, podemos recabar sus datos personales de distintas formas:
    </p>
    <ul>
      <li>Cuando nos los proporciona directamente durante el registro</li>
      <li>Cuando visita nuestro sitio web o utiliza nuestros servicios</li>
      <li>Cuando nos los proporciona a través de terceros autorizados</li>
    </ul>

    <p>Los datos que recabamos incluyen:</p>
    
    <h3>Datos de Identificación y Contacto:</h3>
    <ul>
      <li>Nombre completo</li>
      <li>Fecha de nacimiento</li>
      <li>Género</li>
      <li>CURP</li>
      <li>RFC</li>
      <li>Correo electrónico</li>
      <li>Teléfono móvil</li>
      <li>Domicilio completo</li>
      <li>Fotografía</li>
    </ul>

    <h3>Datos Profesionales:</h3>
    <ul>
      <li>Cédula profesional (en caso de MVZ)</li>
      <li>Institución educativa</li>
      <li>Número de registro ante autoridades sanitarias</li>
      <li>Especialidad médica veterinaria</li>
    </ul>

    <h3>Datos Patrimoniales y Financieros:</h3>
    <ul>
      <li>Información de facturación</li>
      <li>Datos bancarios para pagos (procesados a través de terceros certificados)</li>
    </ul>

    <h3>Datos del Rancho o Unidad de Producción:</h3>
    <ul>
      <li>Nombre del rancho</li>
      <li>Número de UPP (Unidad de Producción Pecuaria)</li>
      <li>Número SINIIGA</li>
      <li>Ubicación geográfica del rancho</li>
      <li>Tipo de operación ganadera</li>
      <li>Tamaño del hato</li>
    </ul>

    <h3>Datos Técnicos y de Navegación:</h3>
    <ul>
      <li>Dirección IP</li>
      <li>Tipo de navegador</li>
      <li>Sistema operativo</li>
      <li>Cookies y tecnologías de rastreo</li>
      <li>Registros de actividad (logs)</li>
    </ul>

    <h2>Finalidades del Tratamiento</h2>
    
    <h3>Finalidades Primarias (necesarias para la relación jurídica):</h3>
    <ol>
      <li>Validar su identidad y autorizar su acceso al sistema</li>
      <li>Proveer los servicios de trazabilidad ganadera contratados</li>
      <li>Generar y emitir certificados digitales de ganado</li>
      <li>Mantener registros de gemelos digitales y pasaportes de animales</li>
      <li>Gestionar procesos de auditoría y certificación</li>
      <li>Cumplir con obligaciones derivadas de la relación jurídica</li>
      <li>Dar cumplimiento a obligaciones fiscales y legales</li>
      <li>Atender requerimientos de autoridades competentes</li>
      <li>Proteger la seguridad de usuarios y del sistema</li>
    </ol>

    <h3>Finalidades Secundarias (requieren su consentimiento):</h3>
    <ol>
      <li>Envío de boletines informativos del sector ganadero</li>
      <li>Notificaciones sobre actualizaciones del sistema</li>
      <li>Ofrecimiento de nuevos productos y servicios</li>
      <li>Realización de estudios de mercado</li>
      <li>Análisis estadístico y mejora continua del servicio</li>
      <li>Marketing y prospección comercial</li>
    </ol>

    <p>
      <strong>En caso de no desear que sus datos personales sean tratados para estas finalidades secundarias, 
      puede manifestarlo enviando un correo a: privacidad@gandia7.com</strong>
    </p>
    <p>
      La negativa para el uso de sus datos personales para estas finalidades no podrá ser un motivo para 
      negarle los servicios solicitados o dar por terminada la relación establecida con nosotros.
    </p>

    <h2>Opciones para Limitar el Uso o Divulgación</h2>
    <p>Usted puede limitar el uso o divulgación de sus datos personales mediante:</p>
    <ul>
      <li>Su inscripción en el Registro Público para Evitar Publicidad (REPEP) de la PROFECO</li>
      <li>Enviando solicitud a privacidad@gandia7.com indicando qué finalidades desea limitar</li>
      <li>Configurando las preferencias de privacidad dentro de su cuenta en la plataforma</li>
    </ul>

    <h2>Medios para Ejercer Derechos ARCO</h2>
    <p>
      Usted tiene derecho a conocer qué datos personales tenemos de usted, para qué los utilizamos y las condiciones 
      del uso que les damos (Acceso). Asimismo, es su derecho solicitar la corrección de su información personal en caso 
      de que esté desactualizada, sea inexacta o incompleta (Rectificación); que la eliminemos de nuestros registros o 
      bases de datos cuando considere que la misma no está siendo utilizada adecuadamente (Cancelación); así como oponerse 
      al uso de sus datos personales para fines específicos (Oposición).
    </p>

    <p>Para ejercer los derechos ARCO, debe enviar solicitud a:</p>
    <p>
      <strong>Email:</strong> privacidad@gandia7.com<br />
      <strong>Domicilio:</strong> Carretera Durango – Mezquital, Km. 4.5, C.P. 34308, Durango, Durango
    </p>

    <p>Su solicitud deberá contener:</p>
    <ol>
      <li>Nombre completo del titular y domicilio u otro medio para comunicarle la respuesta</li>
      <li>Documentos que acrediten su identidad (INE/IFE o pasaporte)</li>
      <li>Descripción clara y precisa de los datos respecto de los que busca ejercer alguno de los derechos ARCO</li>
      <li>Cualquier elemento que facilite la localización de sus datos personales</li>
    </ol>

    <p>
      <strong>Plazo de respuesta:</strong> 20 días hábiles<br />
      <strong>Plazo de ejecución:</strong> 15 días hábiles siguientes a la fecha en que se comunique la respuesta
    </p>

    <h2>Revocación del Consentimiento</h2>
    <p>
      En todo momento, usted puede revocar el consentimiento que nos ha otorgado para el tratamiento de sus datos personales, 
      a fin de que dejemos de hacer uso de los mismos. Para ello, debe enviar su solicitud siguiendo el mismo procedimiento 
      establecido para el ejercicio de derechos ARCO.
    </p>
    <p>
      Su solicitud deberá ir acompañada de la siguiente información: nombre completo, domicilio, documentos que acrediten 
      su identidad y la descripción clara del consentimiento que desea revocar.
    </p>

    <h2>Uso de Cookies y Tecnologías de Rastreo</h2>
    <p>
      Le informamos que en nuestra página de internet utilizamos cookies, web beacons y otras tecnologías a través de las 
      cuales es posible monitorear su comportamiento como usuario de internet, brindarle un mejor servicio y experiencia 
      de usuario al navegar en nuestra página, así como ofrecerle nuevos productos y servicios basados en sus preferencias.
    </p>
    <p>
      Los datos personales que obtenemos de estas tecnologías de rastreo son: horario de navegación, tiempo de navegación, 
      secciones consultadas, y páginas de internet accedidas previo a la nuestra.
    </p>
    <p>
      Puede deshabilitar o bloquear estas tecnologías en su navegador. Para más información, consulte nuestra 
      Política de Cookies.
    </p>

    <h2>Transferencias de Datos Personales</h2>
    <p>
      Le informamos que sus datos personales pueden ser compartidos dentro y fuera del país con las siguientes personas, 
      empresas, organizaciones o autoridades distintas a nosotros, para los siguientes fines:
    </p>

    <table className="min-w-full border-collapse border border-stone-300 dark:border-stone-700">
      <thead>
        <tr>
          <th className="border border-stone-300 dark:border-stone-700 px-4 py-2">Destinatario</th>
          <th className="border border-stone-300 dark:border-stone-700 px-4 py-2">Finalidad</th>
          <th className="border border-stone-300 dark:border-stone-700 px-4 py-2">Requiere Consentimiento</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td className="border border-stone-300 dark:border-stone-700 px-4 py-2">SENASICA</td>
          <td className="border border-stone-300 dark:border-stone-700 px-4 py-2">Cumplimiento de normativa sanitaria</td>
          <td className="border border-stone-300 dark:border-stone-700 px-4 py-2">No</td>
        </tr>
        <tr>
          <td className="border border-stone-300 dark:border-stone-700 px-4 py-2">SEDAGRO Estatal</td>
          <td className="border border-stone-300 dark:border-stone-700 px-4 py-2">Registro y trazabilidad oficial</td>
          <td className="border border-stone-300 dark:border-stone-700 px-4 py-2">No</td>
        </tr>
        <tr>
          <td className="border border-stone-300 dark:border-stone-700 px-4 py-2">Organismos Certificadores</td>
          <td className="border border-stone-300 dark:border-stone-700 px-4 py-2">Validación de certificados</td>
          <td className="border border-stone-300 dark:border-stone-700 px-4 py-2">No</td>
        </tr>
        <tr>
          <td className="border border-stone-300 dark:border-stone-700 px-4 py-2">Proveedores de Cloud (AWS, Google Cloud)</td>
          <td className="border border-stone-300 dark:border-stone-700 px-4 py-2">Almacenamiento y procesamiento</td>
          <td className="border border-stone-300 dark:border-stone-700 px-4 py-2">Sí</td>
        </tr>
        <tr>
          <td className="border border-stone-300 dark:border-stone-700 px-4 py-2">Procesadores de Pago</td>
          <td className="border border-stone-300 dark:border-stone-700 px-4 py-2">Procesamiento de transacciones</td>
          <td className="border border-stone-300 dark:border-stone-700 px-4 py-2">Sí</td>
        </tr>
      </tbody>
    </table>

    <p className="mt-4">
      Si usted no manifiesta su oposición para que sus datos personales sean transferidos en los casos que requieren 
      su consentimiento, se entenderá que ha otorgado su consentimiento para ello.
    </p>

    <h2>Cambios al Aviso de Privacidad</h2>
    <p>
      El presente aviso de privacidad puede sufrir modificaciones, cambios o actualizaciones derivadas de nuevos 
      requerimientos legales; de nuestras propias necesidades por los productos o servicios que ofrecemos; de nuestras 
      prácticas de privacidad; de cambios en nuestro modelo de negocio, o por otras causas.
    </p>
    <p>
      Nos comprometemos a mantenerlo informado sobre los cambios que pueda sufrir el presente aviso de privacidad, a través de:
    </p>
    <ul>
      <li>Notificación por correo electrónico</li>
      <li>Aviso en la plataforma web al iniciar sesión</li>
      <li>Publicación en la sección de Avisos Legales</li>
    </ul>

    <h2>Autoridad Competente</h2>
    <p>
      Si usted considera que su derecho de protección de datos personales ha sido lesionado por alguna conducta de 
      nuestros empleados o de nuestras actuaciones o respuestas, presume que en el tratamiento de sus datos personales 
      existe alguna violación a las disposiciones previstas en la Ley Federal de Protección de Datos Personales en 
      Posesión de los Particulares, podrá interponer la queja o denuncia correspondiente ante el INAI.
    </p>
    <p>
      <strong>Instituto Nacional de Transparencia, Acceso a la Información y Protección de Datos Personales (INAI)</strong><br />
      Sitio web: <a href="http://www.inai.org.mx" target="_blank" rel="noopener noreferrer">www.inai.org.mx</a><br />
      Teléfono: 01800 835 4324
    </p>

    <h2>Consentimiento</h2>
    <p>
      Consiento que mis datos personales sean tratados de conformidad con los términos y condiciones del presente 
      aviso de privacidad.
    </p>

    <p className="mt-8 text-sm text-stone-600 dark:text-stone-500">
      <strong>Fecha de última actualización:</strong> 24 de marzo de 2026<br />
      <strong>Responsable:</strong> GANDIA Technologies S.A. de C.V.
    </p>
  </div>
)

// ==========================================
// POLÍTICA DE COOKIES
// ==========================================

const CookiesContent = () => (
  <div>
    <h1>Política de Cookies</h1>
    <p className="text-sm text-stone-500 dark:text-stone-600">Última actualización: 24 de marzo de 2026</p>

    <h2>¿Qué son las Cookies?</h2>
    <p>
      Las cookies son pequeños archivos de texto que se almacenan en su dispositivo (ordenador, tablet o móvil) 
      cuando visita un sitio web. Permiten que el sitio web reconozca su dispositivo y recuerde información sobre 
      su visita, como su idioma preferido y otras configuraciones.
    </p>

    <h2>¿Qué Cookies Utiliza GANDIA 7?</h2>
    
    <h3>1. Cookies Estrictamente Necesarias</h3>
    <p>
      Estas cookies son esenciales para que pueda navegar por la plataforma y utilizar sus funciones. 
      Sin ellas, servicios como el inicio de sesión o la seguridad no funcionarían correctamente.
    </p>
    <table className="min-w-full border-collapse border border-stone-300 dark:border-stone-700 mt-4">
      <thead>
        <tr>
          <th className="border border-stone-300 dark:border-stone-700 px-4 py-2">Cookie</th>
          <th className="border border-stone-300 dark:border-stone-700 px-4 py-2">Propósito</th>
          <th className="border border-stone-300 dark:border-stone-700 px-4 py-2">Duración</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td className="border border-stone-300 dark:border-stone-700 px-4 py-2">gandia_session</td>
          <td className="border border-stone-300 dark:border-stone-700 px-4 py-2">Mantener su sesión activa</td>
          <td className="border border-stone-300 dark:border-stone-700 px-4 py-2">Sesión</td>
        </tr>
        <tr>
          <td className="border border-stone-300 dark:border-stone-700 px-4 py-2">gandia_csrf</td>
          <td className="border border-stone-300 dark:border-stone-700 px-4 py-2">Protección contra ataques CSRF</td>
          <td className="border border-stone-300 dark:border-stone-700 px-4 py-2">Sesión</td>
        </tr>
        <tr>
          <td className="border border-stone-300 dark:border-stone-700 px-4 py-2">gandia_auth</td>
          <td className="border border-stone-300 dark:border-stone-700 px-4 py-2">Token de autenticación</td>
          <td className="border border-stone-300 dark:border-stone-700 px-4 py-2">30 días</td>
        </tr>
      </tbody>
    </table>

    <h3>2. Cookies de Preferencias</h3>
    <p>
      Estas cookies permiten que el sitio web recuerde sus preferencias (como idioma, tema oscuro/claro) 
      para proporcionarle una experiencia más personalizada.
    </p>
    <table className="min-w-full border-collapse border border-stone-300 dark:border-stone-700 mt-4">
      <thead>
        <tr>
          <th className="border border-stone-300 dark:border-stone-700 px-4 py-2">Cookie</th>
          <th className="border border-stone-300 dark:border-stone-700 px-4 py-2">Propósito</th>
          <th className="border border-stone-300 dark:border-stone-700 px-4 py-2">Duración</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td className="border border-stone-300 dark:border-stone-700 px-4 py-2">gandia_theme</td>
          <td className="border border-stone-300 dark:border-stone-700 px-4 py-2">Tema visual (claro/oscuro)</td>
          <td className="border border-stone-300 dark:border-stone-700 px-4 py-2">1 año</td>
        </tr>
        <tr>
          <td className="border border-stone-300 dark:border-stone-700 px-4 py-2">gandia_lang</td>
          <td className="border border-stone-300 dark:border-stone-700 px-4 py-2">Idioma preferido</td>
          <td className="border border-stone-300 dark:border-stone-700 px-4 py-2">1 año</td>
        </tr>
      </tbody>
    </table>

    <h3>3. Cookies de Análisis (Opcional - Requiere Consentimiento)</h3>
    <p>
      Estas cookies nos ayudan a entender cómo los usuarios interactúan con la plataforma, permitiéndonos 
      mejorar la experiencia del usuario.
    </p>
    <table className="min-w-full border-collapse border border-stone-300 dark:border-stone-700 mt-4">
      <thead>
        <tr>
          <th className="border border-stone-300 dark:border-stone-700 px-4 py-2">Cookie</th>
          <th className="border border-stone-300 dark:border-stone-700 px-4 py-2">Proveedor</th>
          <th className="border border-stone-300 dark:border-stone-700 px-4 py-2">Propósito</th>
          <th className="border border-stone-300 dark:border-stone-700 px-4 py-2">Duración</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td className="border border-stone-300 dark:border-stone-700 px-4 py-2">_ga</td>
          <td className="border border-stone-300 dark:border-stone-700 px-4 py-2">Google Analytics</td>
          <td className="border border-stone-300 dark:border-stone-700 px-4 py-2">Análisis de tráfico</td>
          <td className="border border-stone-300 dark:border-stone-700 px-4 py-2">2 años</td>
        </tr>
        <tr>
          <td className="border border-stone-300 dark:border-stone-700 px-4 py-2">_gid</td>
          <td className="border border-stone-300 dark:border-stone-700 px-4 py-2">Google Analytics</td>
          <td className="border border-stone-300 dark:border-stone-700 px-4 py-2">Análisis de sesión</td>
          <td className="border border-stone-300 dark:border-stone-700 px-4 py-2">24 horas</td>
        </tr>
      </tbody>
    </table>

    <h2>¿Cómo Gestionar las Cookies?</h2>
    
    <h3>Panel de Consentimiento</h3>
    <p>
      Al acceder a GANDIA 7 por primera vez, verá un banner de cookies donde puede aceptar o rechazar 
      cookies no esenciales. Puede cambiar sus preferencias en cualquier momento desde la configuración 
      de su cuenta.
    </p>

    <h3>Configuración del Navegador</h3>
    <p>La mayoría de navegadores permiten gestionar cookies desde su configuración:</p>
    <ul>
      <li><strong>Google Chrome:</strong> Configuración → Privacidad y seguridad → Cookies</li>
      <li><strong>Mozilla Firefox:</strong> Preferencias → Privacidad y seguridad → Cookies</li>
      <li><strong>Safari:</strong> Preferencias → Privacidad → Cookies</li>
      <li><strong>Microsoft Edge:</strong> Configuración → Privacidad → Cookies</li>
    </ul>

    <p>
      <strong>Nota:</strong> Si bloquea todas las cookies, algunas funcionalidades de GANDIA pueden no funcionar correctamente.
    </p>

    <h2>Cookies de Terceros</h2>
    <p>
      GANDIA 7 puede utilizar servicios de terceros que establecen sus propias cookies. Estos terceros tienen 
      sus propias políticas de privacidad:
    </p>
    <ul>
      <li><strong>Google Analytics:</strong> <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Política de Privacidad</a></li>
      <li><strong>Cloudflare (CDN):</strong> <a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noopener noreferrer">Política de Privacidad</a></li>
    </ul>

    <h2>Actualizaciones de esta Política</h2>
    <p>
      Esta Política de Cookies puede actualizarse periódicamente. La fecha de la última actualización 
      se indica en la parte superior del documento. Le recomendamos revisarla regularmente.
    </p>

    <h2>Contacto</h2>
    <p>
      Si tiene preguntas sobre el uso de cookies en GANDIA 7, puede contactarnos en:<br />
      <strong>Email:</strong> privacidad@gandia7.com<br />
      <strong>Teléfono:</strong> No disponible
    </p>
  </div>
)

export default LegalPage