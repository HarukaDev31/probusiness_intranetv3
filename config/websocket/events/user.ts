import { 
  registerEventHandler, 
  subscribeEventsToRole,
  WS_EVENTS 
} from '~/config/websocket/channels'
import { ROLES } from '~/constants/roles'

/**
 * Configuración de eventos para el rol User
 * Este archivo se ejecuta antes de la suscripción a los canales
 */
export const registerUserEvents = () => {
  // ============================================
  // HANDLERS PARA EVENTOS DE USER
  // ============================================
  
  registerEventHandler(WS_EVENTS.SYSTEM_GENERAL, (data) => {
    // Handler para notificación general del sistema
  })

  registerEventHandler(WS_EVENTS.SYSTEM_UPDATE, (data) => {
    // Handler para actualización del sistema
  })

  registerEventHandler(WS_EVENTS.SYSTEM_MAINTENANCE, (data) => {
    // Handler para alerta de mantenimiento
  })

  // ============================================
  // SUSCRIBIR EVENTOS AL ROL USER
  // ============================================
  
  subscribeEventsToRole(
    ROLES.USER,
    `${ROLES.USER}-notifications`,
    [
      WS_EVENTS.SYSTEM_GENERAL,
      WS_EVENTS.SYSTEM_UPDATE,
      WS_EVENTS.SYSTEM_MAINTENANCE
    ],
    'private'
  )

}

