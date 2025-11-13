import { 
  registerEventHandler, 
  subscribeEventsToRole,
  WS_EVENTS 
} from '~/config/websocket/channels'
import { ROLES } from '~/constants/roles'
import { useModal } from '~/composables/commons/useModal'

/**
 * Configuración de eventos para el rol Cotizador
 * Este archivo se ejecuta antes de la suscripción a los canales
 */
export const registerCotizadorEvents = () => {
  // ============================================
  // HANDLERS PARA EVENTOS DE COTIZACIÓN
  // ============================================
  
  // Handler para CotizacionStatusUpdated
  registerEventHandler(WS_EVENTS.COTIZACION_STATUS_UPDATED, (data) => {
    const { showSuccess } = useModal()
    showSuccess('Cotización Actualizada', data.message || 'La cotización se ha actualizado exitosamente.')
  })

  // Handler para CotizacionNewRequest
  registerEventHandler(WS_EVENTS.COTIZACION_NEW_REQUEST, (data) => {
    // Handler para nueva solicitud de cotización
  })

  // Handler para CotizacionChinaContacted
  registerEventHandler(WS_EVENTS.COTIZACION_CHINA_CONTACTED, (data) => {
    const { showSuccess } = useModal()
    showSuccess(
      'Contacto con China', 
      data.message || 'Se ha contactado con China para la cotización.'
    )
  })

  // ============================================
  // SUSCRIBIR EVENTOS AL ROL COTIZADOR
  // ============================================
  
  subscribeEventsToRole(
    ROLES.COTIZADOR,
    `${ROLES.COTIZADOR}-notifications`,
    [
      WS_EVENTS.COTIZACION_NEW_REQUEST,
      WS_EVENTS.COTIZACION_STATUS_UPDATED,
      WS_EVENTS.COTIZACION_CHINA_CONTACTED
    ],
    'private'
  )

  console.log('✅ Eventos del rol Cotizador registrados')
}

