import { WA_INBOX_WS_CHANNEL, WA_INBOX_WS_EVENTS } from '~/constants/whatsappInboxWs'
import { useEcho } from '~/composables/websocket/useEcho'
import {
  dispatchWaInboxMessageCreated,
  dispatchWaInboxMessageStatusUpdated
} from '~/composables/whatsapp-inbox/waInboxRealtimeBridge'
import { waInboxLog, waInboxTrace, waInboxWarn } from '~/composables/whatsapp-inbox/waInboxWsLog'

/**
 * Re-enlaza callbacks del canal inbox (actualiza handler en bindChannelHandlers sin re-suscribir).
 */
export function ensureWaInboxEchoChannel() {
  if (!import.meta.client) return

  const { subscribeToChannel, getEchoInstance, getChannelStatus } = useEcho()
  const echo = getEchoInstance()
  if (!echo) {
    waInboxLog('channel.ensure.skip', { reason: 'echoNotReady' })
    return
  }

  if (typeof subscribeToChannel !== 'function') {
    waInboxWarn('channel.ensure.invalid', { reason: 'subscribeToChannel missing' })
    return
  }

  try {
    subscribeToChannel({
      name: WA_INBOX_WS_CHANNEL,
      type: 'private',
      handlers: [
        {
          event: WA_INBOX_WS_EVENTS.MESSAGE_CREATED,
          callback: dispatchWaInboxMessageCreated
        },
        {
          event: WA_INBOX_WS_EVENTS.MESSAGE_STATUS_UPDATED,
          callback: dispatchWaInboxMessageStatusUpdated
        }
      ]
    })

    const status = typeof getChannelStatus === 'function'
      ? getChannelStatus(WA_INBOX_WS_CHANNEL)
      : null
    waInboxTrace('channel.ensure.ok', {
      channel: WA_INBOX_WS_CHANNEL,
      subscribed: status?.isSubscribed ?? false
    })
  } catch (err) {
    waInboxWarn('channel.ensure.error', { err: String(err) })
    throw err
  }
}
