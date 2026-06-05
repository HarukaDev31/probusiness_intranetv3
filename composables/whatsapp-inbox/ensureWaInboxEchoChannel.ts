import { WA_INBOX_WS_CHANNEL, WA_INBOX_WS_EVENTS } from '~/constants/whatsappInboxWs'
import { getEchoInstance, rebindChannelHandlers, useEcho } from '~/composables/websocket/useEcho'
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

export function subscribeWaInboxEchoChannel(): boolean {
  if (!import.meta.client) return false

  if (!getEchoInstance()) {
    waInboxLog('channel.subscribe.skip', { reason: 'echoNotReady' })
    return false
  }

  try {
    const { subscribeToChannel } = useEcho()
    subscribeToChannel({
      name: WA_INBOX_WS_CHANNEL,
      type: 'private',
      handlers: [...INBOX_HANDLERS]
    })
    waInboxTrace('channel.subscribe.ok', { channel: WA_INBOX_WS_CHANNEL })
    return true
  } catch (err) {
    waInboxLog('channel.subscribe.fail', { err: String(err) })
    return false
  }
}

export function ensureWaInboxEchoChannel() {
  if (!import.meta.client) return

  if (!getEchoInstance()) {
    waInboxLog('channel.ensure.skip', { reason: 'echoNotReady' })
    return
  }

  const rebound = rebindChannelHandlers(WA_INBOX_WS_CHANNEL, [...INBOX_HANDLERS])
  if (!rebound) {
    subscribeWaInboxEchoChannel()
    return
  }

  waInboxTrace('channel.ensure.ok', {
    channel: WA_INBOX_WS_CHANNEL,
    rebound
  })
}
