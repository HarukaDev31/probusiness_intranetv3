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