import { 
  registerEventHandler, 
  subscribeEventsToRole,
  WS_EVENTS 
} from '~/config/websocket/channels'
import { ROLES } from '~/constants/roles'

/**
 * Configuración de eventos para el rol Contenedor Consolidado
 * Este archivo se ejecuta antes de la suscripción a los canales
 */
export const registerContenedorConsolidadoEvents = () => {
  // ============================================
  // HANDLERS PARA EVENTOS DE CONTENEDOR CONSOLIDADO
  // ============================================
  
  registerEventHandler(WS_EVENTS.CONTAINER_STATUS_CHANGE, (data) => {
    // Handler para cambio de estado de contenedor
  })

  registerEventHandler(WS_EVENTS.CONTAINER_NEW, (data) => {
    // Handler para nuevo contenedor
  })

  registerEventHandler(WS_EVENTS.CONTAINER_ACTIVITY, (data) => {
    // Handler para actividad de contenedor
  })

  // ============================================
  // SUSCRIBIR EVENTOS AL ROL CONTENEDOR CONSOLIDADO
  // ============================================
  
  // Canal privado de notificaciones
  subscribeEventsToRole(
    ROLES.CONTENEDOR_CONSOLIDADO,
    `${ROLES.CONTENEDOR_CONSOLIDADO}-notifications`,
    [
      WS_EVENTS.CONTAINER_STATUS_CHANGE,
      WS_EVENTS.CONTAINER_NEW
    ],
    'private'
  )



  console.log('✅ Eventos del rol Contenedor Consolidado registrados')
}

