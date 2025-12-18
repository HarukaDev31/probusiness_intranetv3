import { 
  registerEventHandler, 
  subscribeEventsToRole,
  WS_EVENTS 
} from '~/config/websocket/channels'
import { ROLES } from '~/constants/roles'

/**
 * Configuración de eventos para el rol Admin
 * Este archivo se ejecuta antes de la suscripción a los canales
 */
export const registerAdminEvents = () => {
  // ============================================
  // HANDLERS PARA EVENTOS DE ADMIN
  // ============================================
  
  registerEventHandler(WS_EVENTS.SYSTEM_UPDATE, (data) => {
    // Handler para actualización del sistema
  })

  registerEventHandler(WS_EVENTS.USER_ACTIVITY, (data) => {
    // Handler para actividad de usuario
  })

  registerEventHandler(WS_EVENTS.DASHBOARD_UPDATE, (data) => {
    // Handler para actualización del dashboard
  })

  // ============================================
  // SUSCRIBIR EVENTOS AL ROL ADMIN
  // ============================================
  
  // Canal privado de notificaciones
  subscribeEventsToRole(
    ROLES.ADMIN,
    `${ROLES.ADMIN}-notifications`,
    [
      WS_EVENTS.SYSTEM_UPDATE,
      WS_EVENTS.USER_ACTIVITY
    ],
    'private'
  )

  // Canal de presencia para dashboard
  subscribeEventsToRole(
    ROLES.ADMIN,
    `presence-${ROLES.ADMIN}-dashboard`,
    [
      WS_EVENTS.DASHBOARD_UPDATE
    ],
    'presence'
  )

}

