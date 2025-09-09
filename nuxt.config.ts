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
  
  // Configuración de CSS
  css: [
    '../assets/css/tailwind.css'
  ],
  app: {
    head: {
      title: 'ProBusiness - Intranet | Sistema de gestion Interna',
      
      link: [
        { rel: 'icon', type: 'image/x-icon', href: 'https://intranet.probusiness.pe/assets/img/logos/probusiness.png' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: 'https://intranet.probusiness.pe/assets/img/logos/probusiness.png' },
        { rel: 'icon', type: 'image/png', sizes: '16x16', href: 'https://intranet.probusiness.pe/assets/img/logos/probusiness.png' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: 'https://intranet.probusiness.pe/assets/img/logos/probusiness.png' },
        { rel: 'manifest', href: 'https://intranet.probusiness.pe/assets/img/logos/probusiness.png' },
       
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
    },
    icons: {
      // Precargar colecciones completas
      dynamic: true,
      // O especificar iconos individuales para optimizar el tamaño del bundle
      families: {
        // Heroicons (los más usados en tu proyecto)
        heroicons: [
          'arrow-path',
          'archive-box',
          'chevron-down',
          'bell',
          'moon',
          'arrow-right-on-rectangle',
          'arrow-up-tray',
          'trash',
          'plus',
          'x-mark',
          'check-circle',
          'x-circle',
          'exclamation-triangle',
          'information-circle',
          'question-mark-circle',
          'magnifying-glass',
          'funnel',
          'inbox',
          'document-text',
          'document',
          'minus',
          'arrow-down-tray',
          'arrow-top-right-on-square',
          'presentation-chart-line',
          'arrow-left',
          'chat-bubble-left-ellipsis',
          'photo',
          'folder-open',
          'check',
          'cloud-arrow-up',
          'home',
          'chevron-right',
          'document-check',
          'eye',
          'building-office'
        ],
        // Font Awesome
        fa: [
          'solid-user',
          'solid-cog',
          'solid-bell',
          'solid-home',
          'solid-search',
          'solid-download',
          'solid-upload',
          'solid-trash'
        ],
        // VS Code icons
        vscode: [
          'file-code',
          'file-pdf',
          'file-word',
          'file-excel',
          'file-image'
        ]
      }
    }
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
    }
  },

 
})