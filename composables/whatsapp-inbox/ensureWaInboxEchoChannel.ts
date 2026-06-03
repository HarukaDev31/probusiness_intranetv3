import { getAllEventHandlers } from '~/config/websocket/channels'
import { WA_INBOX_WS_CHANNEL, WA_INBOX_WS_EVENTS } from '~/constants/whatsappInboxWs'
import { useEcho } from '~/composables/websocket/useEcho'
import {
  dispatchWaInboxMessageCreated,
  dispatchWaInboxMessageStatusUpdated
} from '~/composables/whatsapp-inbox/waInboxRealtimeBridge'

/**
 * Re-enlaza callbacks del canal inbox (p. ej. tras remount o si el plugin suscribió antes que los handlers).
 */
export function ensureWaInboxEchoChannel() {
  if (!import.meta.client) return

  const { subscribeToChannel, getEchoInstance } = useEcho()
  if (!getEchoInstance()) return

  const allHandlers = getAllEventHandlers()
  subscribeToChannel({
    name: WA_INBOX_WS_CHANNEL,
    type: 'private',
    handlers: [
      {
        event: WA_INBOX_WS_EVENTS.MESSAGE_CREATED,
        callback: allHandlers[WA_INBOX_WS_EVENTS.MESSAGE_CREATED] ?? dispatchWaInboxMessageCreated
      },
      {
        event: WA_INBOX_WS_EVENTS.MESSAGE_STATUS_UPDATED,
        callback:
          allHandlers[WA_INBOX_WS_EVENTS.MESSAGE_STATUS_UPDATED]
          ?? dispatchWaInboxMessageStatusUpdated
      }
    ]
  })
}
