import type {
  WaCopilotoWsMessageCreatedPayload,
  WaCopilotoWsMessageInsightsPayload,
  WaCopilotoWsMessageStatusPayload
} from '~/types/wa-copiloto-ws'
import {
  parseWaCopilotoWsPayload,
  payloadConversationId,
  payloadMessageId
} from '~/composables/wa-copiloto-inbox/waCopilotoWsParse'
import {
  applyMessageCreatedToStore,
  applyStatusUpdatedToStore,
  getWaCopilotoViewingConversationId
} from '~/composables/wa-copiloto-inbox/waCopilotoRealtimeSync'
import { applyInsightsReadyToStore } from '~/composables/wa-copiloto-inbox/waCopilotoInsightsStore'
import { getWaCopilotoUiHandlers } from '~/composables/wa-copiloto-inbox/waCopilotoUiBridge'
import { getWaCopilotoLiveHandlers } from '~/composables/wa-copiloto-inbox/waCopilotoLiveBridge'
import { WaCopilotoLog, WaCopilotoTrace, waCopilotoWarn } from '~/composables/wa-copiloto-inbox/waCopilotoWsLog'

export type WaCopilotoRealtimeHandlers = {
  onMessageCreated?: (payload: WaCopilotoWsMessageCreatedPayload) => void
  onMessageStatusUpdated?: (payload: WaCopilotoWsMessageStatusPayload) => void
  onMessageInsightsReady?: (payload: WaCopilotoWsMessageInsightsPayload) => void
}

/** @deprecated Usar registerWaCopilotoUiHandlers; se mantiene por compatibilidad con useWaCopilotoWebSocket */
let activeHandlers: WaCopilotoRealtimeHandlers | null = null

export function setWaCopilotoRealtimeHandlers(handlers: WaCopilotoRealtimeHandlers | null) {
  activeHandlers = handlers
  WaCopilotoLog('bridge.setActiveHandlers', { hasHandlers: Boolean(handlers) })
}

function collectHandlerSets(): WaCopilotoRealtimeHandlers[] {
  const sets: WaCopilotoRealtimeHandlers[] = []
  const seen = new Set<WaCopilotoRealtimeHandlers>()
  for (const h of [getWaCopilotoLiveHandlers(), getWaCopilotoUiHandlers(), activeHandlers]) {
    if (!h || seen.has(h)) continue
    seen.add(h)
    sets.push(h)
  }
  return sets
}

function notifyUiHandlers(
  event: 'created' | 'status' | 'insights',
  fn: (h: WaCopilotoRealtimeHandlers) => void,
  meta: Record<string, unknown>
) {
  const sets = collectHandlerSets()
  WaCopilotoLog(`event.${event}`, {
    ...meta,
    handlerSets: sets.length,
    viewing: getWaCopilotoViewingConversationId()
  })
  if (sets.length === 0) {
    waCopilotoWarn(`event.${event}.noHandlers`, meta)
    return
  }
  for (const h of sets) {
    try {
      fn(h)
    } catch (err) {
      waCopilotoWarn(`event.${event}.handlerError`, { ...meta, err })
    }
  }
}

export function dispatchWaCopilotoMessageCreated(raw: unknown) {
  WaCopilotoTrace('dispatch.messageCreated.raw')
  const p = parseWaCopilotoWsPayload<WaCopilotoWsMessageCreatedPayload>(raw)
  const convId = payloadConversationId(p)
  if (!convId || !p?.message) {
    waCopilotoWarn('dispatch.messageCreated.parseFail', {
      hasPayload: Boolean(p),
      convId,
      hasMessage: Boolean(p?.message)
    })
    return
  }
  const payload = {
    ...p,
    conversation_id: convId
  } as WaCopilotoWsMessageCreatedPayload

  applyMessageCreatedToStore(payload)
  notifyUiHandlers('created', (h) => h.onMessageCreated?.(payload), {
    convId,
    messageId: payload.message?.id,
    direction: payload.message?.direction
  })
}

export function dispatchWaCopilotoMessageInsightsReady(raw: unknown) {
  WaCopilotoTrace('dispatch.messageInsights.raw')
  const p = parseWaCopilotoWsPayload<WaCopilotoWsMessageInsightsPayload>(raw)
  const convId = payloadConversationId(p)
  const messageId = payloadMessageId(p)
  if (!convId || !messageId || !Array.isArray(p?.insights)) {
    waCopilotoWarn('dispatch.messageInsights.parseFail', {
      convId,
      messageId,
      hasInsights: Array.isArray(p?.insights)
    })
    return
  }

  const payload = {
    ...p,
    conversation_id: convId,
    message_id: messageId
  } as WaCopilotoWsMessageInsightsPayload

  applyInsightsReadyToStore(payload)
  notifyUiHandlers('insights', (h) => h.onMessageInsightsReady?.(payload), {
    convId,
    messageId,
    insightCount: payload.insights.length
  })
}
export function dispatchWaCopilotoMessageStatusUpdated(raw: unknown) {
  WaCopilotoTrace('dispatch.statusUpdated.raw')
  const p = parseWaCopilotoWsPayload<WaCopilotoWsMessageStatusPayload>(raw)
  const conversationId = payloadConversationId(p)
  const messageId =
    payloadMessageId(p)
    || Number((p?.message as { id?: unknown } | undefined)?.id)
  if (!conversationId || !Number.isFinite(messageId) || messageId <= 0) {
    waCopilotoWarn('dispatch.statusUpdated.parseFail', {
      conversationId,
      messageId,
      hasPayload: Boolean(p)
    })
    return
  }
  const payload = {
    ...p!,
    conversation_id: conversationId,
    message_id: messageId
  } as WaCopilotoWsMessageStatusPayload

  applyStatusUpdatedToStore(payload)
  notifyUiHandlers('status', (h) => h.onMessageStatusUpdated?.(payload), {
    convId: conversationId,
    messageId,
    status: payload.delivery_status ?? payload.message?.delivery_status
  })
}
