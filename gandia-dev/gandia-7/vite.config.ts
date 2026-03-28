import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',

      // ── Manifest ───────────────────────────────────────────────────────────
      manifest: false, // usamos public/manifest.json propio

      // ── Service Worker ─────────────────────────────────────────────────────
      workbox: {
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024, // 10 MB para evitar el error con archivos grandes
        // Estrategia: Network First con fallback a cache
        // Ideal para GANDIA: intenta red, si falla usa cache local
        runtimeCaching: [
          {
            // App shell (rutas SPA)
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'gandia-pages',
              networkTimeoutSeconds: 5,
              cacheableResponse: { statuses: [200] },
            },
          },
          {
            // Assets estáticos (JS, CSS, fonts)
            urlPattern: /\.(js|css|woff2?|ttf|otf)$/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'gandia-assets',
              expiration: { maxEntries: 60, maxAgeSeconds: 30 * 24 * 60 * 60 },
            },
          },
          {
            // Imágenes y SVG
            urlPattern: /\.(png|jpg|jpeg|svg|gif|webp|ico)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gandia-images',
              expiration: { maxEntries: 40, maxAgeSeconds: 7 * 24 * 60 * 60 },
            },
          },
        ],
        // Precachear todo el build
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // Ignorar sourcemaps en producción
        globIgnores: ['**/*.map'],
        // Limpiar caches viejos automáticamente
        cleanupOutdatedCaches: true,
        // Skip waiting — actualiza de inmediato
        skipWaiting: true,
        clientsClaim: true,
      },

      // ── DevOptions ─────────────────────────────────────────────────────────
      devOptions: {
        enabled: true,            // activo en dev para poder probar
        type: 'module',
        navigateFallback: 'index.html',
      },
    }),
  ],

  // ── Alias (mantener igual que tu configuración actual si tienes alguno) ───
  resolve: {
    alias: {},
  },
})