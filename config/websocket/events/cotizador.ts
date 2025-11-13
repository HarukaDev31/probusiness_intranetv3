import { 
  registerEventHandler, 
  subscribeEventsToRole,
  WS_EVENTS 
} from '~/config/websocket/channels'
import { ROLES } from '~/constants/roles'
import { useModal } from '~/composables/commons/useModal'
import { useUserRole } from '~/composables/auth/useUserRole'
const { currentId } = useUserRole()
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
    if(data.usuario_id == currentId.value) {
      return
    }
    const { showSuccess } = useModal()
    showSuccess(
      'Contacto con China', 
      data.message || 'Se ha contactado con China para la cotización.'
    )
  })

  // Handler para CotizacionChangeContainer
  registerEventHandler(WS_EVENTS.COTIZACION_CHANGE_CONTAINER, (data) => {
    if(data.usuario_id == currentId.value) {
      return
    }
    const { showSuccess } = useModal()
    showSuccess('Cambio de Contenedor', data.message || 'Se ha cambiado el contenedor de la cotización.')
  })

  // Handler para CotizacionChinaReceived
  registerEventHandler(WS_EVENTS.COTIZACION_CHINA_RECEIVED, (data) => {
    if(data.usuario_id == currentId.value) {
      return
    }
    const { showSuccess } = useModal()
    showSuccess('Cotización Recibida', data.message || 'Se ha recibido la cotización.')
  })

  // Handler for CotizacionChinaInspected
  registerEventHandler(WS_EVENTS.COTIZACION_CHINA_INSPECTIONED, (data) => {
    if(data.usuario_id == currentId.value) {
      return
    }
    const { showSuccess } = useModal()
    showSuccess('Cotización Inspectada', data.message || 'Se ha inspeccionado la cotización.')
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
      WS_EVENTS.COTIZACION_CHINA_CONTACTED,
      WS_EVENTS.COTIZACION_CHANGE_CONTAINER
    ],
    'private'
  )

  console.log('✅ Eventos del rol Cotizador registrados')
}

