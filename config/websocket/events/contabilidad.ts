import {
  registerEventHandler,
  subscribeEventsToRole,
  WS_EVENTS
} from '~/config/websocket/channels'
import { ROLES } from '~/constants/roles'
import { WA_INBOX_WS_CHANNEL, WA_INBOX_WS_EVENTS } from '~/constants/whatsappInboxWs'
import {
  wsShowSuccess,
  wsShowError,
  WS_NOTIFICATION_KEYS,
} from '~/composables/notifications/preferences'

/**
 * Configuración de eventos para el rol Contabilidad.
 */
export const registerContabilidadEvents = () => {
  registerEventHandler(WS_EVENTS.USUARIO_DATOS_FACTURACION_IMPORT_FINISHED, (data) => {
    const status = String(data?.status || '').toUpperCase()
    const title = status === 'COMPLETADO'
      ? 'Importacion de facturacion completada'
      : 'Importacion de facturacion con errores'
    const message = data?.message || 'La importacion de datos de facturacion ha finalizado.'

    if (status === 'COMPLETADO') {
      wsShowSuccess(WS_NOTIFICATION_KEYS.FACTURACION_IMPORTACION, title, message)
    } else {
      wsShowError(WS_NOTIFICATION_KEYS.FACTURACION_IMPORTACION, title, message)
    }

    if (process.client) {
      window.dispatchEvent(new CustomEvent('udf-import-finished', {
        detail: data
      }))
    }
  })

  registerEventHandler(WS_EVENTS.REMINDER_PAGO_WHATSAPP_FINISHED, (data) => {
    const ok = data?.success !== false
    const cliente = String(data?.cliente || '').trim()
    const title = ok ? 'Recordatorio de pago enviado' : 'No se pudo enviar el recordatorio'
    const message = data?.message
      || (ok
        ? (cliente ? `Se envió el recordatorio a ${cliente}.` : 'Se envió el recordatorio al cliente.')
        : 'No se pudo enviar el recordatorio de pago.')

    if (ok) {
      wsShowSuccess(WS_NOTIFICATION_KEYS.REMINDER_PAGO, title, message)
    } else {
      wsShowError(WS_NOTIFICATION_KEYS.REMINDER_PAGO, title, message)
    }
  })

  subscribeEventsToRole(
    ROLES.CONTABILIDAD,
    `${ROLES.CONTABILIDAD}-notifications`,
    [
      WS_EVENTS.USUARIO_DATOS_FACTURACION_IMPORT_FINISHED,
      WS_EVENTS.REMINDER_PAGO_WHATSAPP_FINISHED,
    ],
    'private'
  )

  subscribeEventsToRole(
    ROLES.CONTABILIDAD,
    WA_INBOX_WS_CHANNEL,
    [
      WA_INBOX_WS_EVENTS.MESSAGE_CREATED,
      WA_INBOX_WS_EVENTS.MESSAGE_STATUS_UPDATED,
      WA_INBOX_WS_EVENTS.CONVERSATION_READ
    ],
    'private'
  )
}
