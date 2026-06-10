import { subscribeEventsToRole } from '~/config/websocket/channels'
import { ROLES } from '~/constants/roles'
import { WA_INBOX_WS_CHANNEL, WA_INBOX_WS_EVENTS } from '~/constants/whatsappInboxWs'

/** Suscripción WebSocket al WhatsApp Inbox para Administración. */
export const registerAdministracionEvents = () => {
  subscribeEventsToRole(
    ROLES.ADMINISTRACION,
    WA_INBOX_WS_CHANNEL,
    [
      WA_INBOX_WS_EVENTS.MESSAGE_CREATED,
      WA_INBOX_WS_EVENTS.MESSAGE_STATUS_UPDATED
    ],
    'private'
  )
}
