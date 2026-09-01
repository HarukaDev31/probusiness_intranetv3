import { registerEventHandler, subscribeEventsToRole, WS_EVENTS } from '~/config/websocket/channels'
import { ROLES, rolesJefeImportacionEquiv } from '~/constants/roles'
import { WA_INBOX_WS_CHANNEL, WA_INBOX_WS_EVENTS } from '~/constants/whatsappInboxWs'
import { handleFacturaComercialBatchFinished } from '~/composables/cargaconsolidada/documentacion/facturaComercialBatchRealtime'

/** Suscripción WebSocket para Jefe de Importaciones. */
export const registerJefeImportacionEvents = () => {
  registerEventHandler(WS_EVENTS.FACTURA_COMERCIAL_BATCH_FINISHED, handleFacturaComercialBatchFinished)

  for (const role of rolesJefeImportacionEquiv()) {
    subscribeEventsToRole(
      role,
      'JefeImportacion-notifications',
      [WS_EVENTS.FACTURA_COMERCIAL_BATCH_FINISHED],
      'private'
    )

    subscribeEventsToRole(
      role,
      WA_INBOX_WS_CHANNEL,
      [
        WA_INBOX_WS_EVENTS.MESSAGE_CREATED,
        WA_INBOX_WS_EVENTS.MESSAGE_STATUS_UPDATED,
        WA_INBOX_WS_EVENTS.CONVERSATION_READ
      ],
      'private'
    )
  }
}
