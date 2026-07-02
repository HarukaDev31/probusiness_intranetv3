import { WA_COPILOTO_WS_CHANNEL, WA_COPILOTO_WS_EVENTS } from '~/constants/waCopilotoWs'
import { getEchoInstance, rebindChannelHandlers, useEcho } from '~/composables/websocket/useEcho'
import {
  dispatchWaCopilotoMessageCreated,
  dispatchWaCopilotoMessageInsightsReady,
  dispatchWaCopilotoMessageStatusUpdated
} from '~/composables/wa-copiloto-inbox/waCopilotoRealtimeBridge'
import { WaCopilotoLog, WaCopilotoTrace } from '~/composables/wa-copiloto-inbox/waCopilotoWsLog'

const INBOX_HANDLERS = [
  {
    event: WA_COPILOTO_WS_EVENTS.MESSAGE_CREATED,
    callback: dispatchWaCopilotoMessageCreated
  },
  {
    event: WA_COPILOTO_WS_EVENTS.MESSAGE_STATUS_UPDATED,
    callback: dispatchWaCopilotoMessageStatusUpdated
  },
  {
    event: WA_COPILOTO_WS_EVENTS.MESSAGE_INSIGHTS_READY,
    callback: dispatchWaCopilotoMessageInsightsReady
  }
] as const

/**
 * Suscribe el canal privado Copiloto (idempotente si ya existe).
 */
export function subscribeWaCopilotoEchoChannel(): boolean {
  if (!import.meta.client) return false

  if (!getEchoInstance()) {
    WaCopilotoLog('channel.subscribe.skip', { reason: 'echoNotReady' })
    return false
  }

  try {
    const { subscribeToChannel } = useEcho()
    subscribeToChannel({
      name: WA_COPILOTO_WS_CHANNEL,
      type: 'private',
      handlers: [...INBOX_HANDLERS]
    })
    WaCopilotoTrace('channel.subscribe.ok', { channel: WA_COPILOTO_WS_CHANNEL })
    return true
  } catch (err) {
    WaCopilotoLog('channel.subscribe.fail', { err: String(err) })
    return false
  }
}

/**
 * Re-enlaza callbacks o suscribe el canal si aún no está en Echo.
 */
export function ensureWaCopilotoEchoChannel() {
  if (!import.meta.client) return

  if (!getEchoInstance()) {
    WaCopilotoLog('channel.ensure.skip', { reason: 'echoNotReady' })
    return
  }

  const rebound = rebindChannelHandlers(WA_COPILOTO_WS_CHANNEL, [...INBOX_HANDLERS])
  if (!rebound) {
    subscribeWaCopilotoEchoChannel()
    return
  }

  WaCopilotoTrace('channel.ensure.ok', {
    channel: WA_COPILOTO_WS_CHANNEL,
    rebound
  })
}
