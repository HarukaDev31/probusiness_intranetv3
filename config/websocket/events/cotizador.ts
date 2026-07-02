import { 
  registerEventHandler, 
  subscribeEventsToRole,
  WS_EVENTS 
} from '~/config/websocket/channels'
import { ROLES } from '~/constants/roles'
import { useUserRole } from '~/composables/auth/useUserRole'
import { wsShowSuccess, WS_NOTIFICATION_KEYS } from '~/composables/notifications/preferences'

const { currentId } = useUserRole()

function esUsuarioQueDisparo(data: { usuario_id?: number | string }): boolean {
  return data?.usuario_id != null && data.usuario_id == currentId.value
}

/**
 * Configuración de eventos para el rol Cotizador
 */
export const registerCotizadorEvents = () => {
  registerEventHandler(WS_EVENTS.COTIZACION_STATUS_UPDATED, (data) => {
    wsShowSuccess(
      WS_NOTIFICATION_KEYS.COTIZACION_ESTADO,
      'Cotización Actualizada',
      data.message || 'La cotización se ha actualizado exitosamente.'
    )
  })

  registerEventHandler(WS_EVENTS.COTIZACION_NEW_REQUEST, (_data) => {
    // Sin UI por ahora; la clave queda en el catálogo para cuando se implemente.
  })

  registerEventHandler(WS_EVENTS.COTIZACION_CHINA_CONTACTED, (data) => {
    if (esUsuarioQueDisparo(data)) return
    wsShowSuccess(
      WS_NOTIFICATION_KEYS.COTIZACION_CHINA_CONTACTADO,
      'Contacto con China',
      data.message || 'Se ha contactado con China para la cotización.'
    )
  })

  registerEventHandler(WS_EVENTS.COTIZACION_CHANGE_CONTAINER, (data) => {
    if (esUsuarioQueDisparo(data)) return
    wsShowSuccess(
      WS_NOTIFICATION_KEYS.COTIZACION_CARGA_ROLEADA,
      'Cambio de Contenedor',
      data.message || 'Se ha cambiado el contenedor de la cotización.'
    )
  })

  registerEventHandler(WS_EVENTS.COTIZACION_CHINA_RECEIVED, (data) => {
    if (esUsuarioQueDisparo(data)) return
    wsShowSuccess(
      WS_NOTIFICATION_KEYS.COTIZACION_CHINA_RECIBIDA,
      'Cotización Recibida',
      data.message || 'Se ha recibido la cotización.'
    )
  })

  registerEventHandler(WS_EVENTS.COTIZACION_CHINA_INSPECTIONED, (data) => {
    if (esUsuarioQueDisparo(data)) return
    wsShowSuccess(
      WS_NOTIFICATION_KEYS.COTIZACION_CHINA_INSPECCIONADA,
      'Cotización Inspectada',
      data.message || 'Se ha inspeccionado la cotización.'
    )
  })

  subscribeEventsToRole(
    ROLES.COTIZADOR,
    `${ROLES.COTIZADOR}-notifications`,
    [
      WS_EVENTS.COTIZACION_NEW_REQUEST,
      WS_EVENTS.COTIZACION_STATUS_UPDATED,
      WS_EVENTS.COTIZACION_CHINA_CONTACTED,
      WS_EVENTS.COTIZACION_CHANGE_CONTAINER,
      WS_EVENTS.COTIZACION_CHINA_RECEIVED,
      WS_EVENTS.COTIZACION_CHINA_INSPECTIONED
    ],
    'private'
  )
}
