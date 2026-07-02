import { subscribeEventsToRole } from '~/config/websocket/channels'
import { ROLES } from '~/constants/roles'
import { WA_INBOX_WS_CHANNEL, WA_INBOX_WS_EVENTS } from '~/constants/whatsappInboxWs'

/** Suscripción WebSocket al WhatsApp Inbox para Jefe de Importaciones. */
export const registerJefeImportacionEvents = () => {
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
