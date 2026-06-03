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
  applyStatusUpdatedToStore
} from '~/composables/whatsapp-inbox/waInboxRealtimeSync'
import { getWaInboxUiHandlers } from '~/composables/whatsapp-inbox/waInboxUiBridge'

export type WaInboxRealtimeHandlers = {
  onMessageCreated?: (payload: WaInboxWsMessageCreatedPayload) => void
  onMessageStatusUpdated?: (payload: WaInboxWsMessageStatusPayload) => void
}

/** @deprecated Usar registerWaInboxUiHandlers; se mantiene por compatibilidad con useWaInboxWebSocket */
let activeHandlers: WaInboxRealtimeHandlers | null = null

export function setWaInboxRealtimeHandlers(handlers: WaInboxRealtimeHandlers | null) {
  activeHandlers = handlers
}

function notifyUiHandlers(fn: (h: WaInboxRealtimeHandlers) => void) {
  const ui = getWaInboxUiHandlers()
  if (ui) fn(ui)
  if (activeHandlers && activeHandlers !== ui) fn(activeHandlers)
}

export function dispatchWaInboxMessageCreated(raw: unknown) {
  const p = parseWaInboxWsPayload<WaInboxWsMessageCreatedPayload>(raw)
  if (!payloadConversationId(p) || !p?.message) return
  const payload = {
    ...p,
    conversation_id: payloadConversationId(p)
  } as WaInboxWsMessageCreatedPayload
  applyMessageCreatedToStore(payload)
  notifyUiHandlers((h) => h.onMessageCreated?.(payload))
}

export function dispatchWaInboxMessageStatusUpdated(raw: unknown) {
  const p = parseWaInboxWsPayload<WaInboxWsMessageStatusPayload>(raw)
  const conversationId = payloadConversationId(p)
  const messageId =
    payloadMessageId(p)
    || Number((p?.message as { id?: unknown } | undefined)?.id)
  if (!conversationId || !Number.isFinite(messageId) || messageId <= 0) return
  const payload = {
    ...p!,
    conversation_id: conversationId,
    message_id: messageId
  } as WaInboxWsMessageStatusPayload
  applyStatusUpdatedToStore(payload)
  notifyUiHandlers((h) => h.onMessageStatusUpdated?.(payload))
}
