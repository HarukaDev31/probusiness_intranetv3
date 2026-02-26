// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/ui'],
  typescript: {
    strict: false,
    typeCheck: false,
    shim: false
  },
  ssr: false,
  
  // Optimizaciones de rendimiento y lazy load
  experimental: {
    payloadExtraction: false, // Mejora tiempos de carga inicial
    // Prefetch solo al hacer hover/focus, no al ser visible → carga inicial más rápida
    defaults: {
      nuxtLink: {
        prefetch: true,
        prefetchOn: { visibility: false, interaction: true },
      },
    },
  },
  // Carga diferida de rutas: cada página es un chunk que se descarga al navegar
  routeRules: {
    '/**': { prerender: false },
  },
  
  // Code splitting y minificación en producción (npm run build)
  vite: {
    build: {
      // Minificación JS (solo aplica en producción)
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
        },
        format: {
          comments: false,
        },
      },
      // Minificación CSS (por defecto true en prod; explícito para asegurar)
      cssMinify: 'esbuild',
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            // Separar vendor libraries
            if (id.includes('node_modules')) {
              // Chart.js y sus dependencias
              if (id.includes('chart.js') || id.includes('vue-chartjs')) {
                return 'chart'
              }
              // XLSX
              if (id.includes('xlsx')) {
                return 'xlsx'
              }
              // Pusher y Laravel Echo (WebSockets)
              if (id.includes('pusher') || id.includes('laravel-echo')) {
                return 'websocket'
              }
              // Otras dependencias grandes - dejar que Nuxt maneje Vue y UI por defecto
              return 'vendor'
            }
          }
        }
      },
      chunkSizeWarningLimit: 1000,
    },
    optimizeDeps: {
      include: ['vue', 'vue-router', '@nuxt/icon', 'defu'],
      exclude: ['chart.js', 'xlsx', 'pusher-js'], // Cargar bajo demanda
    }
  },
  
  // Configuración de CSS
  css: [
    '../assets/css/tailwind.css'
  ],
  app: {
    head: {
      htmlAttrs: {
        lang: 'es'
      },
      title: 'ProBusiness - Intranet | Sistema de gestion Interna',
      meta: [
        // Structured Data
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
        { name: 'apple-mobile-web-app-title', content: 'ProBusiness' },
        { name: 'format-detection', content: 'telephone=no' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: 'https://intranet.probusiness.pe/assets/img/logos/probusiness.png' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: 'https://intranet.probusiness.pe/assets/img/logos/probusiness.png' },
        { rel: 'icon', type: 'image/png', sizes: '16x16', href: 'https://intranet.probusiness.pe/assets/img/logos/probusiness.png' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: 'https://intranet.probusiness.pe/assets/img/logos/probusiness.png' },
        { rel: 'manifest', href: '/manifest.json' },
      ],

    },
  },
  ui: {
    theme: {
      colors: [
        'primary',
        'secondary',
        'success',
        'info',
        'warning',
        'error',
        'transparent'
      ],
    }
  },
  
  // Configuración de iconos
  icon: {
    // Usar solo colecciones realmente usadas en el app (tabler no se usa)
    collections: ['heroicons', 'fa', 'vscode-icons', 'mdi'],
    provider: 'iconify',
    // SVG mode: iconos servidos desde el servidor Nuxt local (lee @iconify-json/* instalados)
    // Funciona con nombres dinámicos (:name="variable") sin peticiones a API externa
    mode: 'svg',
    // Sin fallback a Iconify API - todos los iconos se resuelven desde paquetes locales
    fallbackToApi: false,
  },
 
  // Configuración de variables de entorno
  runtimeConfig: {
    // Variables privadas (solo servidor)
    apiSecret: process.env.API_SECRET,
    
    // Variables públicas (cliente y servidor)
    public: {
      apiBaseUrl: process.env.NUXT_API_BASE_URL || 'http://localhost:8000',
      appName: process.env.NUXT_PUBLIC_APP_NAME || 'Probusiness Intranet',
      appVersion: process.env.NUXT_PUBLIC_APP_VERSION || '2.0.0',
      pusherAppKey: process.env.NUXT_PUSHER_APP_KEY,
      pusherAppCluster: process.env.NUXT_PUSHER_APP_CLUSTER,
      pusherWsHost: process.env.NUXT_WEBSOCKETS_URL,
      whatsappApiUrl: process.env.NUXT_WHATSAPPV3_URL,
      whatsappApiKey: process.env.NUXT_WHATSAPPV3_API_KEY,
    }
  },

 
})