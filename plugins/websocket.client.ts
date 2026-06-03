import { useEcho, getEchoInstance } from '../composables/websocket/useEcho'
import { getAllEventHandlers, getWebsocketRoles } from '../config/websocket/channels'
import { CALENDAR_EVENTS, getUserCalendarChannelName } from '../config/websocket/events/calendar'
import { buildEchoClientConfig } from '../utils/websocket-config'

export default defineNuxtPlugin({
  name: 'websocket',
  dependsOn: ['auth'],
  async setup() {
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

    const echoConfig = buildEchoClientConfig(authToken)
    
    

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

        if (typeof window !== 'undefined') {
          try {
            const { waInboxLog } = await import('~/composables/whatsapp-inbox/waInboxWsLog')
            waInboxLog('plugin.echo-ready')
          } catch {
            /* noop */
          }
          window.dispatchEvent(new CustomEvent('echo-ready'))
          const { sincronizarSalasGlobales } = await import(
            '~/composables/useSoporteTiChatGlobal'
          )
          await sincronizarSalasGlobales()
        }
        
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
            window.dispatchEvent(new CustomEvent('soporte-ti-chat-reset'))
            delete (window as any).Echo
          }
        } else {
          // Usuario se logueó
          
          initializeWebSockets()
        }
      }
    })
  }
  }
})
