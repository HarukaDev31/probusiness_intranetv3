import { WA_COPILOTO_WS_CHANNEL, WA_COPILOTO_WS_EVENTS } from '~/constants/waCopilotoWs'
import { getEchoInstance, rebindChannelHandlers } from '~/composables/websocket/useEcho'
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
 * Re-enlaza callbacks del canal inbox (solo actualiza el mapa; no re-suscribe con echo.private).
 */
export function ensureWaCopilotoEchoChannel() {
  if (!import.meta.client) return

  if (!getEchoInstance()) {
    WaCopilotoLog('channel.ensure.skip', { reason: 'echoNotReady' })
    return
  }

  const rebound = rebindChannelHandlers(WA_COPILOTO_WS_CHANNEL, [...INBOX_HANDLERS])
  WaCopilotoTrace('channel.ensure.ok', {
    channel: WA_COPILOTO_WS_CHANNEL,
    rebound
  })
}
