import { resolveWaInboxWsChannel, WA_INBOX_WS_EVENTS } from '~/constants/whatsappInboxWs'
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
    const channel = resolveWaInboxWsChannel()
    subscribeToChannel({
      name: channel,
      type: 'private',
      handlers: [...INBOX_HANDLERS]
    })
    waInboxTrace('channel.subscribe.ok', { channel })
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

  const channel = resolveWaInboxWsChannel()
  const rebound = rebindChannelHandlers(channel, [...INBOX_HANDLERS])
  if (!rebound) {
    subscribeWaInboxEchoChannel()
    return
  }

  waInboxTrace('channel.ensure.ok', {
    channel,
    rebound
  })
}
