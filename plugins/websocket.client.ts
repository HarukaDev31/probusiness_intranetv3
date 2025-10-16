import { useWebSocketRole } from '../composables/websocket/useWebSocketRole'
import { useEcho, getEchoInstance } from '../composables/websocket/useEcho'

export default defineNuxtPlugin(async () => {
  // Solo ejecutar en el cliente
  if (process.server) return

  

  // Variable para evitar inicialización múltiple
  let isInitializing = false
  let isInitialized = false

  const { initializeEcho, resetEcho } = useEcho()
  const { setupRoleChannels } = useWebSocketRole()

  // Función para inicializar websockets cuando el usuario esté autenticado
  const initializeWebSockets = async () => {
    
    
    // Evitar inicialización múltiple
    if (isInitializing || isInitialized) {
      
      return
    }

    // Resetear estado si es necesario
    if (typeof window !== 'undefined' && (window as any).Echo) {
      
      resetEcho()
    }

    // Verificar si el usuario está autenticado
    const authToken = localStorage.getItem('auth_token')
    const authUser = localStorage.getItem('auth_user')
    
    console.log('🔌 Verificando autenticación:', {
      hasToken: !!authToken,
      hasUser: !!authUser,
      tokenLength: authToken?.length || 0
    })
    
    if (!authToken || !authUser) {
      
      return
    }

    isInitializing = true

    // Obtener configuración de Nuxt
    const config = useRuntimeConfig()
    
    // Debug: Mostrar valores de configuración
    console.log('🔧 Configuración WebSocket:', {
      pusherWsHost: config.public.pusherWsHost,
      pusherAppCluster: config.public.pusherAppCluster,
      pusherAppKey: config.public.pusherAppKey
    })
    
    // Configuración de Echo para Pusher
    const echoConfig = {
      broadcaster: 'pusher',
      key: config.public.pusherAppKey,
      cluster: config.public.pusherAppCluster || 'mt1',
      wsHost: config.public.pusherWsHost,
      // Si usamos wsHost personalizado, no especificar wsPort ni forceTLS
      enabledTransports: ['ws', 'wss'],
      authEndpoint: config.public.pusherWsHost ? `https://${config.public.pusherWsHost}/api/broadcasting/auth` : undefined,
      auth: {
        headers: {
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
          'Authorization': `Bearer ${authToken}`,
          'Accept': 'application/json'
        }
      }
    }
    
    console.log('🔧 Configuración Echo:', echoConfig)

          try {
        // Inicializar Echo
        await initializeEcho(echoConfig)

        // Hacer Echo disponible globalmente
        if (typeof window !== 'undefined') {
          const echoInstance = getEchoInstance()
          if (echoInstance) {
            ;(window as any).Echo = echoInstance
            
          }
        }

        // Configurar canales según el rol del usuario
        await setupRoleChannels()

        isInitialized = true
        
      } catch (error) {
        console.error('❌ Error inicializando WebSocket:', error)
      } finally {
        isInitializing = false
      }
  }

  // Intentar inicializar inmediatamente
  await initializeWebSockets()

  // Escuchar cambios en el localStorage para detectar login/logout
  if (process.client) {
    window.addEventListener('storage', (event) => {
      if (event.key === 'auth_token' || event.key === 'auth_user') {
        const authToken = localStorage.getItem('auth_token')
        const authUser = localStorage.getItem('auth_user')
        
        if (!authToken || !authUser) {
          // Usuario se deslogueó
          
          resetEcho()
          isInitialized = false
          isInitializing = false
          if (typeof window !== 'undefined') {
            delete (window as any).Echo
          }
        } else {
          // Usuario se logueó
          
          initializeWebSockets()
        }
      }
    })
  }
})
