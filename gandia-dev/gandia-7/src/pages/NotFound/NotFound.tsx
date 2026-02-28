import { useNavigate, useParams } from 'react-router-dom'

type ErrorType = '403' | '404' | '500' | 'no-connection' | 'maintenance'

interface ErrorConfig {
  code: string
  title: string
  message: string
  image: string
  buttonText: string
  buttonAction?: () => void
}

function NotFound() {
  const navigate = useNavigate()
  const { errorType } = useParams<{ errorType?: ErrorType }>()

  // Configuración de cada tipo de error
  const errorConfigs: Record<ErrorType, ErrorConfig> = {
    '403': {
      code: '403',
      title: 'Acceso denegado',
      message: 'No tienes los permisos necesarios para acceder a este recurso. Contacta al administrador del sistema si crees que esto es un error.',
      image: '/ternero404.png',
      buttonText: 'Volver al inicio',
    },
    '404': {
      code: '404',
      title: 'Recurso no encontrado',
      message: 'La ruta solicitada no corresponde a ningún recurso válido dentro del sistema.',
      image: '/ternero404.png',
      buttonText: 'Volver al sistema',
    },
    '500': {
      code: '500',
      title: 'Error del servidor',
      message: 'Algo salió mal en nuestros servidores. Nuestro equipo ya fue notificado y está trabajando para solucionar el problema. Por favor, intenta nuevamente más tarde.',
      image: '/ternero404.png',
      buttonText: 'Reintentar',
      buttonAction: () => window.location.reload(),
    },
    'no-connection': {
      code: 'OFF',
      title: 'Sin conexión a internet',
      message: 'No se puede establecer conexión con el servidor. Verifica tu conexión a internet e intenta nuevamente.',
      image: '/ternero404.png',
      buttonText: 'Reintentar',
      buttonAction: () => window.location.reload(),
    },
    'maintenance': {
      code: '503',
      title: 'Mantenimiento programado',
      message: 'Estamos realizando mejoras en el sistema para brindarte una mejor experiencia. Estaremos de vuelta pronto. Gracias por tu paciencia.',
      image: '/ternero404.png',
      buttonText: 'Verificar estado',
      buttonAction: () => window.location.reload(),
    },
  }

  // Obtener configuración del error (por defecto 404)
  const config = errorConfigs[errorType as ErrorType] || errorConfigs['404']

  const handleButtonClick = () => {
    if (config.buttonAction) {
      config.buttonAction()
    } else {
      navigate('/home')
    }
  }

  return (
    <main className="min-h-screen grid grid-cols-1 lg:grid-cols-2 items-center gap-16 px-6 lg:px-[8vw] bg-white dark:bg-[#0c0a09] text-neutral-900 dark:text-[#fafaf9]">
      
      {/* IMAGEN (IZQUIERDA EN DESKTOP / ARRIBA EN MOBILE) */}
      <section className="flex justify-center order-1">
        <img
          src={config.image}
          alt="Error"
          className="
            w-full
            max-w-[320px]
            lg:max-w-[560px]
            lg:translate-y-2
          "
        />
      </section>

      {/* INFO (DERECHA EN DESKTOP / ABAJO EN MOBILE) */}
      <section className="order-2 text-center lg:text-left">
        <h1 className="text-6xl font-semibold text-neutral-400">
          {config.code}
        </h1>

        <h2 className="mt-2 text-2xl font-medium">
          {config.title}
        </h2>

        <p className="mt-4 max-w-md mx-auto lg:mx-0 text-neutral-500 dark:text-neutral-400 leading-relaxed">
          {config.message}
        </p>

        <button
          onClick={handleButtonClick}
          className="
            inline-block
            mt-8
            rounded-full
            border
            border-neutral-300
            dark:border-neutral-700
            px-6
            py-2
            text-sm
            transition
            hover:bg-neutral-100
            dark:hover:bg-neutral-800
          "
        >
          {config.buttonText}
        </button>
      </section>
    </main>
  )
}

export default NotFound