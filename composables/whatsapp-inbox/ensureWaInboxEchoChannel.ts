import { WA_INBOX_WS_CHANNEL, WA_INBOX_WS_EVENTS } from '~/constants/whatsappInboxWs'
import { getEchoInstance, rebindChannelHandlers } from '~/composables/websocket/useEcho'
import {
  dispatchWaInboxMessageCreated,
  dispatchWaInboxMessageStatusUpdated
} from '~/composables/whatsapp-inbox/waInboxRealtimeBridge'
import { waInboxLog, waInboxTrace } from '~/composables/whatsapp-inbox/waInboxWsLog'

const INBOX_HANDLERS = [
  {
    event: WA_INBOX_WS_EVENTS.MESSAGE_CREATED,
    callback: dispatchWaInboxMessageCreated
  },
  {
    event: WA_INBOX_WS_EVENTS.MESSAGE_STATUS_UPDATED,
    callback: dispatchWaInboxMessageStatusUpdated
  }
] as const

/**
 * Re-enlaza callbacks del canal inbox (solo actualiza el mapa; no re-suscribe con echo.private).
 */
export function ensureWaInboxEchoChannel() {
  if (!import.meta.client) return

  if (!getEchoInstance()) {
    waInboxLog('channel.ensure.skip', { reason: 'echoNotReady' })
    return
  }

  const rebound = rebindChannelHandlers(WA_INBOX_WS_CHANNEL, [...INBOX_HANDLERS])
  waInboxTrace('channel.ensure.ok', {
    channel: WA_INBOX_WS_CHANNEL,
    rebound
  })
}
