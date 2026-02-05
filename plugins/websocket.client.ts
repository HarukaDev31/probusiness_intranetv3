import { useWebSocketRole } from '../composables/websocket/useWebSocketRole'
import { useEcho, getEchoInstance } from '../composables/websocket/useEcho'
import { getAllEventHandlers } from '../config/websocket/channels'
import { CALENDAR_EVENTS, getUserCalendarChannelName } from '../config/websocket/events/calendar'

export default defineNuxtPlugin(async () => {
  // Solo ejecutar en el cliente
  if (process.server) return

  // Variable para evitar inicialización múltiple
  let isInitializing = false
  let isInitialized = false

  const { initializeEcho, resetEcho, subscribeToChannel } = useEcho()
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
    
    
    if (!authToken || !authUser) {
      
      return
    }

    isInitializing = true

    // Obtener configuración de Nuxt
    const config = useRuntimeConfig()
    
    
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

        // Suscripción al canal privado del usuario para eventos de calendario (por usuario)
        try {
          const user = JSON.parse(authUser) as { id?: number | string }
          if (user?.id != null) {
            const channelName = getUserCalendarChannelName(user.id)
            const allHandlers = getAllEventHandlers()
            const handlers = CALENDAR_EVENTS.map((event) => ({
              event,
              callback: allHandlers[event] ?? (() => {})
            }))
            subscribeToChannel({
              name: channelName,
              type: 'private',
              handlers
            })
          }
        } catch (e) {
          console.debug('Calendar user channel: skip', e)
        }

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
