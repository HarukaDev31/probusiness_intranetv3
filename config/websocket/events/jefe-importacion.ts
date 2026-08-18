import { registerEventHandler, subscribeEventsToRole, WS_EVENTS } from '~/config/websocket/channels'
import { ROLES } from '~/constants/roles'
import { WA_INBOX_WS_CHANNEL, WA_INBOX_WS_EVENTS } from '~/constants/whatsappInboxWs'
import { handleFacturaComercialBatchFinished } from '~/composables/cargaconsolidada/documentacion/facturaComercialBatchRealtime'

/** Suscripción WebSocket para Jefe de Importaciones. */
export const registerJefeImportacionEvents = () => {
  registerEventHandler(WS_EVENTS.FACTURA_COMERCIAL_BATCH_FINISHED, handleFacturaComercialBatchFinished)

  subscribeEventsToRole(
    ROLES.JEFE_IMPORTACIONES,
    'JefeImportacion-notifications',
    [WS_EVENTS.FACTURA_COMERCIAL_BATCH_FINISHED],
    'private'
  )

  subscribeEventsToRole(
    ROLES.JEFE_IMPORTACIONES,
    WA_INBOX_WS_CHANNEL,
    [
      WA_INBOX_WS_EVENTS.MESSAGE_CREATED,
      WA_INBOX_WS_EVENTS.MESSAGE_STATUS_UPDATED,
      WA_INBOX_WS_EVENTS.CONVERSATION_READ
    ],
    'private'
  )
}
