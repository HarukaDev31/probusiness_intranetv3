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
  
  // Optimizaciones de rendimiento
  experimental: {
    payloadExtraction: false, // Mejora tiempos de carga inicial
  },
  
  // Code splitting y optimización de bundles
  vite: {
    build: {
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: false,
        },
        format: {
          comments: false,
        },
      },
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            // Separar vendor libraries
            if (id.includes('node_modules')) {
              // @nuxt/icon debe estar en un chunk separado para evitar problemas de inicialización
              if (id.includes('@nuxt/icon')) {
                return 'icon'
              }
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
              // Vue core
              if (id.includes('vue') && !id.includes('vue-router')) {
                return 'vendor-vue'
              }
              // Vue Router
              if (id.includes('vue-router')) {
                return 'vendor-router'
              }
              // Nuxt UI y otras UI libraries - mantener juntas para evitar problemas de inicialización
              if (id.includes('@nuxt/ui') || id.includes('@headlessui') || id.includes('defu') || id.includes('unimport')) {
                return 'ui'
              }
              // Otras dependencias grandes
              return 'vendor'
            }
          },
          // Asegurar que los chunks se carguen en el orden correcto
          chunkFileNames: (chunkInfo) => {
            // Priorizar chunks críticos
            if (chunkInfo.name === 'ui' || chunkInfo.name === 'icon') {
              return 'assets/[name]-[hash].js'
            }
            return 'assets/[name]-[hash].js'
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
        // Preconnect para recursos externos
        { rel: 'preconnect', href: 'https://intranet.probusiness.pe' },
        { rel: 'dns-prefetch', href: 'https://intranet.probusiness.pe' },
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
    // Usar iconos locales instalados
    collections: ['heroicons', 'fa', 'vscode-icons', 'mdi', 'tabler'],
    provider: 'iconify',
    fallbackToApi: true,
    mode: 'css'
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