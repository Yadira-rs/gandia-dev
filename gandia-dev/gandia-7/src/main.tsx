import ReactDOM from 'react-dom/client'
import App from './app/App'
import './index.css'

// Registro del Service Worker para modo Offline (PWA)
import { registerSW } from 'virtual:pwa-register'
registerSW({ immediate: true })

// StrictMode eliminado en producción para evitar doble montaje
// que rompe INITIAL_SESSION de Supabase en desarrollo
ReactDOM.createRoot(document.getElementById('root')!).render(
  <App />
)