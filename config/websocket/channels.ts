import type { WebSocketRole } from '~/types/websocket/echo'
import { 
  WS_EVENTS, 
  getRoleEventsConfig, 
  getAllEventHandlers,
  registerRole,
  subscribeEventsToRole,
  subscribeEventToRole,
  registerEventHandler
} from './events-config'

// Re-exportar WS_EVENTS y funciones de registro para uso externo
export {
  WS_EVENTS,
  registerRole,
  subscribeEventsToRole,
  subscribeEventToRole,
  registerEventHandler,
  getAllEventHandlers
}

/**
 * Genera automáticamente la configuración de websocketRoles
 * leyendo desde events-config.ts
 * 
 * Este archivo ahora actúa como un punto de lectura que transforma
 * la configuración centralizada (base + dinámica) en la estructura esperada por el broadcasting
 * 
 * IMPORTANTE: Esta función se ejecuta cada vez que se accede a websocketRoles,
 * por lo que cualquier registro dinámico realizado antes de la suscripción será incluido
 */
const generateWebsocketRoles = (): Record<string, WebSocketRole> => {
  const roles: Record<string, WebSocketRole> = {}
  const roleEventsConfig = getRoleEventsConfig()
  const allEventHandlers = getAllEventHandlers()

  roleEventsConfig.forEach((roleConfig) => {
    roles[roleConfig.role] = {
      role: roleConfig.role,
      channels: roleConfig.channels.map((channelConfig) => ({
        name: channelConfig.name,
        type: channelConfig.type,
        handlers: channelConfig.events.map((eventName) => {
          // Obtener el handler del evento, o usar uno por defecto si no existe
          const handler = allEventHandlers[eventName] || ((data: any) => {
            console.log(`📨 Evento recibido: ${eventName}`, data)
          })

          return {
            event: eventName,
            callback: handler
          }
        })
      }))
    }
  })

  return roles
}

/**
 * Función para obtener la configuración de roles actualizada
 * Incluye cualquier registro dinámico realizado antes de la suscripción
 */
export const getWebsocketRoles = (): Record<string, WebSocketRole> => {
  return generateWebsocketRoles()
}

/**
 * Configuración de roles para WebSocket
 * Se regenera automáticamente incluyendo registros dinámicos
 * 
 * NOTA: Para obtener la versión más actualizada, usa getWebsocketRoles()
 * o accede directamente a websocketRoles después de hacer registros dinámicos
 */
export let websocketRoles: Record<string, WebSocketRole> = generateWebsocketRoles()

/**
 * Función para regenerar websocketRoles después de cambios dinámicos
 * Úsala después de registrar roles o eventos dinámicamente
 */
export const refreshWebsocketRoles = (): void => {
  websocketRoles = generateWebsocketRoles()
}