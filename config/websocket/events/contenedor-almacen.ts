import { 
  registerEventHandler, 
  subscribeEventsToRole,
  WS_EVENTS 
} from '~/config/websocket/channels'
import { ROLES } from '~/constants/roles'

/**
 * Configuración de eventos para el rol Contenedor Almacen
 * Este archivo se ejecuta antes de la suscripción a los canales
 */
export const registerContenedorAlmacenEvents = () => {
  // ============================================
  // HANDLERS PARA EVENTOS DE CONTENEDOR ALMACÉN
  // ============================================
  
  registerEventHandler(WS_EVENTS.STOCK_UPDATE, (data) => {
    // Handler para actualización de stock
  })

  registerEventHandler(WS_EVENTS.WAREHOUSE_ALERT, (data) => {
    // Handler para alerta de almacén
  })

  // ============================================
  // SUSCRIBIR EVENTOS AL ROL CONTENEDOR ALMACÉN
  // ============================================
  
  subscribeEventsToRole(
    ROLES.CONTENEDOR_ALMACEN,
    `${ROLES.CONTENEDOR_ALMACEN}-notifications`,
    [
      WS_EVENTS.STOCK_UPDATE,
      WS_EVENTS.WAREHOUSE_ALERT
    ],
    'private'
  )

  console.log('✅ Eventos del rol Contenedor Almacen registrados')
}

