import type {
  WaInboxWsMessageCreatedPayload,
  WaInboxWsMessageStatusPayload
} from '~/types/whatsapp-inbox-ws'
import {
  parseWaInboxWsPayload,
  payloadConversationId,
  payloadMessageId
} from '~/composables/whatsapp-inbox/waInboxWsParse'

export type WaInboxRealtimeHandlers = {
  onMessageCreated?: (payload: WaInboxWsMessageCreatedPayload) => void
  onMessageStatusUpdated?: (payload: WaInboxWsMessageStatusPayload) => void
}

let activeHandlers: WaInboxRealtimeHandlers | null = null

export function setWaInboxRealtimeHandlers(handlers: WaInboxRealtimeHandlers | null) {
  activeHandlers = handlers
}

export function dispatchWaInboxMessageCreated(raw: unknown) {
  const p = parseWaInboxWsPayload<WaInboxWsMessageCreatedPayload>(raw)
  if (!payloadConversationId(p) || !p?.message) return
  activeHandlers?.onMessageCreated?.({
    ...p,
    conversation_id: payloadConversationId(p)
  })
}

export function dispatchWaInboxMessageStatusUpdated(raw: unknown) {
  const p = parseWaInboxWsPayload<WaInboxWsMessageStatusPayload>(raw)
  const conversationId = payloadConversationId(p)
  const messageId =
    payloadMessageId(p)
    || Number((p?.message as { id?: unknown } | undefined)?.id)
  if (!conversationId || !Number.isFinite(messageId) || messageId <= 0) return
  activeHandlers?.onMessageStatusUpdated?.({
    ...p!,
    conversation_id: conversationId,
    message_id: messageId
  })
}
