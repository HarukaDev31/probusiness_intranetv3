import type {
  WaInboxWsMessageCreatedPayload,
  WaInboxWsMessageStatusPayload
} from '~/types/whatsapp-inbox-ws'
import {
  parseWaInboxWsPayload,
  payloadConversationId,
  payloadMessageId
} from '~/composables/whatsapp-inbox/waInboxWsParse'
import {
  applyMessageCreatedToStore,
  applyStatusUpdatedToStore,
  getWaInboxViewingConversationId
} from '~/composables/whatsapp-inbox/waInboxRealtimeSync'
import { getWaInboxUiHandlers } from '~/composables/whatsapp-inbox/waInboxUiBridge'
import { getWaInboxLiveHandlers } from '~/composables/whatsapp-inbox/waInboxLiveBridge'
import { waInboxLog, waInboxTrace, waInboxWarn } from '~/composables/whatsapp-inbox/waInboxWsLog'

export type WaInboxRealtimeHandlers = {
  onMessageCreated?: (payload: WaInboxWsMessageCreatedPayload) => void
  onMessageStatusUpdated?: (payload: WaInboxWsMessageStatusPayload) => void
}

/** @deprecated Usar registerWaInboxUiHandlers; se mantiene por compatibilidad con useWaInboxWebSocket */
let activeHandlers: WaInboxRealtimeHandlers | null = null

export function setWaInboxRealtimeHandlers(handlers: WaInboxRealtimeHandlers | null) {
  activeHandlers = handlers
  waInboxLog('bridge.setActiveHandlers', { hasHandlers: Boolean(handlers) })
}

function collectHandlerSets(): WaInboxRealtimeHandlers[] {
  const sets: WaInboxRealtimeHandlers[] = []
  const seen = new Set<WaInboxRealtimeHandlers>()
  for (const h of [getWaInboxLiveHandlers(), getWaInboxUiHandlers(), activeHandlers]) {
    if (!h || seen.has(h)) continue
    seen.add(h)
    sets.push(h)
  }
  return sets
}

function notifyUiHandlers(
  event: 'created' | 'status',
  fn: (h: WaInboxRealtimeHandlers) => void,
  meta: Record<string, unknown>
) {
  const sets = collectHandlerSets()
  waInboxLog(`event.${event}`, {
    ...meta,
    handlerSets: sets.length,
    viewing: getWaInboxViewingConversationId()
  })
  if (sets.length === 0) {
    waInboxWarn(`event.${event}.noHandlers`, meta)
    return
  }
  for (const h of sets) {
    try {
      fn(h)
    } catch (err) {
      waInboxWarn(`event.${event}.handlerError`, { ...meta, err })
    }
  }
}

export function dispatchWaInboxMessageCreated(raw: unknown) {
  waInboxTrace('dispatch.messageCreated.raw')
  const p = parseWaInboxWsPayload<WaInboxWsMessageCreatedPayload>(raw)
  const convId = payloadConversationId(p)
  if (!convId || !p?.message) {
    waInboxWarn('dispatch.messageCreated.parseFail', {
      hasPayload: Boolean(p),
      convId,
      hasMessage: Boolean(p?.message)
    })
    return
  }
  const payload = {
    ...p,
    conversation_id: convId
  } as WaInboxWsMessageCreatedPayload

  applyMessageCreatedToStore(payload)
  notifyUiHandlers('created', (h) => h.onMessageCreated?.(payload), {
    convId,
    messageId: payload.message?.id,
    direction: payload.message?.direction
  })
}

export function dispatchWaInboxMessageStatusUpdated(raw: unknown) {
  waInboxTrace('dispatch.statusUpdated.raw')
  const p = parseWaInboxWsPayload<WaInboxWsMessageStatusPayload>(raw)
  const conversationId = payloadConversationId(p)
  const messageId =
    payloadMessageId(p)
    || Number((p?.message as { id?: unknown } | undefined)?.id)
  if (!conversationId || !Number.isFinite(messageId) || messageId <= 0) {
    waInboxWarn('dispatch.statusUpdated.parseFail', {
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
  } as WaInboxWsMessageStatusPayload

  applyStatusUpdatedToStore(payload)
  notifyUiHandlers('status', (h) => h.onMessageStatusUpdated?.(payload), {
    convId: conversationId,
    messageId,
    status: payload.delivery_status ?? payload.message?.delivery_status
  })
}
