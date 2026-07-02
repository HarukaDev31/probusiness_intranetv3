import { 
  registerEventHandler, 
  subscribeEventsToRole,
  WS_EVENTS 
} from '~/config/websocket/channels'
import { ROLES } from '~/constants/roles'
import { WA_INBOX_WS_CHANNEL, WA_INBOX_WS_EVENTS } from '~/constants/whatsappInboxWs'
import {
  dispatchWaInboxMessageCreated,
  dispatchWaInboxMessageStatusUpdated,
  dispatchWaInboxConversationRead
} from '~/composables/whatsapp-inbox/waInboxRealtimeBridge'
import { useUserRole } from '~/composables/auth/useUserRole'
import {
  wsShowSuccess,
  wsShowError,
  WS_NOTIFICATION_KEYS,
} from '~/composables/notifications/preferences'

/**
 * Configuración de eventos para el rol Coordinación
 */
export const registerCoordinacionEvents = () => {
  const { currentId } = useUserRole()

  registerEventHandler(WS_EVENTS.TASK_ASSIGNMENT, (_data) => {
    // Sin UI por ahora
  })

  registerEventHandler(WS_EVENTS.SCHEDULE_UPDATE, (_data) => {
    // Sin UI por ahora
  })

  registerEventHandler(WS_EVENTS.COTIZACION_CHINA_CONTACTED, (data) => {
    wsShowSuccess(
      WS_NOTIFICATION_KEYS.COTIZACION_CHINA_CONTACTADO,
      'Contacto con China',
      data.message || 'Se ha contactado con China para la cotización.'
    )
  })

  registerEventHandler(WS_EVENTS.COTIZACION_CHANGE_CONTAINER, (data) => {
    wsShowSuccess(
      WS_NOTIFICATION_KEYS.COTIZACION_CARGA_ROLEADA,
      'Cambio de Contenedor',
      data.message || 'Se ha cambiado el contenedor de la cotización.'
    )
  })

  registerEventHandler(WS_EVENTS.COTIZACION_CHINA_RECEIVED, (data) => {
    if (data.usuario_id == currentId.value) return
    wsShowSuccess(
      WS_NOTIFICATION_KEYS.COTIZACION_CHINA_RECIBIDA,
      'Cotización Recibida',
      data.message || 'Se ha recibido la cotización.'
    )
  })

  registerEventHandler(WS_EVENTS.COTIZACION_CHINA_INSPECTIONED, (data) => {
    if (data.usuario_id == currentId.value) return
    wsShowSuccess(
      WS_NOTIFICATION_KEYS.COTIZACION_CHINA_INSPECCIONADA,
      'Cotización Inspectada',
      data.message || 'Se ha inspeccionado la cotización.'
    )
  })

  registerEventHandler(WA_INBOX_WS_EVENTS.MESSAGE_CREATED, dispatchWaInboxMessageCreated)
  registerEventHandler(WA_INBOX_WS_EVENTS.MESSAGE_STATUS_UPDATED, dispatchWaInboxMessageStatusUpdated)
  registerEventHandler(WA_INBOX_WS_EVENTS.CONVERSATION_READ, dispatchWaInboxConversationRead)

  registerEventHandler(WS_EVENTS.PLANTILLA_FINAL_BATCH_FINISHED, (data) => {
    const estado = String(data?.estado || '').toUpperCase()
    const title = estado === 'COMPLETED'
      ? 'Plantillas finales listas'
      : 'Plantillas finales con error'
    const message = data?.message || 'La generación masiva de plantillas finales ha finalizado.'

    if (estado === 'COMPLETED') {
      wsShowSuccess(WS_NOTIFICATION_KEYS.PLANTILLA_FINAL_LOTE, title, message)
    } else {
      wsShowError(WS_NOTIFICATION_KEYS.PLANTILLA_FINAL_LOTE, title, message)
    }

    if (process.client) {
      window.dispatchEvent(new CustomEvent('plantilla-final-batch-finished', { detail: data }))
    }
  })

  subscribeEventsToRole(
    'Coordinación',
    `${'Coordinacion'}-notifications`,
    [
      WS_EVENTS.TASK_ASSIGNMENT,
      WS_EVENTS.SCHEDULE_UPDATE,
      WS_EVENTS.COTIZACION_CHINA_CONTACTED,
      WS_EVENTS.COTIZACION_CHANGE_CONTAINER,
      WS_EVENTS.COTIZACION_CHINA_RECEIVED,
      WS_EVENTS.COTIZACION_CHINA_INSPECTIONED,
      WS_EVENTS.PLANTILLA_FINAL_BATCH_FINISHED
    ],
    'private'
  )

  subscribeEventsToRole(
    ROLES.COORDINACION,
    WA_INBOX_WS_CHANNEL,
    [
      WA_INBOX_WS_EVENTS.MESSAGE_CREATED,
      WA_INBOX_WS_EVENTS.MESSAGE_STATUS_UPDATED,
      WA_INBOX_WS_EVENTS.CONVERSATION_READ
    ],
    'private'
  )
}
