import { useEcho, getEchoInstance } from '../composables/websocket/useEcho'
import { getAllEventHandlers, getWebsocketRoles } from '../config/websocket/channels'
import { CALENDAR_EVENTS, getUserCalendarChannelName } from '../config/websocket/events/calendar'

export default defineNuxtPlugin(async () => {
  // Solo ejecutar en el cliente
  if (process.server) return

  // Variable para evitar inicialización múltiple
  let isInitializing = false
  let isInitialized = false

  const { initializeEcho, resetEcho, subscribeToChannel, subscribeToRoleChannels } = useEcho()

  // Función para inicializar websockets cuando el usuario esté autenticado
  const initializeWebSockets = async () => {
    
    
    // Evitar inicialización múltiple
    if (isInitializing || isInitialized) {
      return
    }

    // No hacer reset aquí: provoca cierre y reconexión. Solo se hace reset en logout (storage).

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

        const user = JSON.parse(authUser) as {
          id?: number | string
          raw?: { ID_Usuario?: number; id?: number; grupo?: { nombre?: string } }
        }
        const userId = user?.id ?? user?.raw?.ID_Usuario ?? user?.raw?.id
        const role = user?.raw?.grupo?.nombre

        // 1) Canal del usuario (calendario): private-App.Models.Usuario.{id} — siempre que haya userId
        if (userId != null) {
          try {
            const channelName = getUserCalendarChannelName(userId)
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
          } catch (e) {
            console.warn('Calendar user channel:', e)
          }
        }

        // 2) Canales por rol (Coordinación, Documentación, etc.) desde auth_user, no useUserRole (puede no estar cargado al recargar)
        if (role) {
          const roleConfig = getWebsocketRoles()[role]
          if (roleConfig) {
            try {
              subscribeToRoleChannels(roleConfig)
            } catch (e) {
              console.warn('Role channels:', e)
            }
          }
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
