import { getAllEventHandlers } from '~/config/websocket/channels'
import { WA_INBOX_WS_CHANNEL, WA_INBOX_WS_EVENTS } from '~/constants/whatsappInboxWs'
import { useEcho } from '~/composables/websocket/useEcho'
import {
  dispatchWaInboxMessageCreated,
  dispatchWaInboxMessageStatusUpdated
} from '~/composables/whatsapp-inbox/waInboxRealtimeBridge'
import { waInboxLog, waInboxWarn } from '~/composables/whatsapp-inbox/waInboxWsLog'

/**
 * Re-enlaza callbacks del canal inbox (p. ej. tras remount o si el plugin suscribió antes que los handlers).
 */
export function ensureWaInboxEchoChannel() {
  if (!import.meta.client) return

  const { subscribeToChannel, getEchoInstance, getChannelStatus } = useEcho()
  const echo = getEchoInstance()
  if (!echo) {
    waInboxLog('channel.ensure.skip', { reason: 'echoNotReady' })
    return
  }

  try {
    const allHandlers = getAllEventHandlers()
    const onCreated = allHandlers[WA_INBOX_WS_EVENTS.MESSAGE_CREATED] ?? dispatchWaInboxMessageCreated
    const onStatus =
      allHandlers[WA_INBOX_WS_EVENTS.MESSAGE_STATUS_UPDATED]
      ?? dispatchWaInboxMessageStatusUpdated

    subscribeToChannel({
      name: WA_INBOX_WS_CHANNEL,
      type: 'private',
      handlers: [
        { event: WA_INBOX_WS_EVENTS.MESSAGE_CREATED, callback: onCreated },
        { event: WA_INBOX_WS_EVENTS.MESSAGE_STATUS_UPDATED, callback: onStatus }
      ]
    })

    const status = getChannelStatus(WA_INBOX_WS_CHANNEL)
    waInboxLog('channel.ensure.ok', {
      channel: WA_INBOX_WS_CHANNEL,
      subscribed: status?.isSubscribed ?? false,
      usesRegistryCreated: Boolean(allHandlers[WA_INBOX_WS_EVENTS.MESSAGE_CREATED]),
      usesRegistryStatus: Boolean(allHandlers[WA_INBOX_WS_EVENTS.MESSAGE_STATUS_UPDATED])
    })
  } catch (err) {
    waInboxWarn('channel.ensure.error', { err: String(err) })
  }
}
