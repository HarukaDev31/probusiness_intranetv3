import type {
  WaInboxWsMessageCreatedPayload,
  WaInboxWsMessageStatusPayload
} from '~/types/whatsapp-inbox-ws'
import type { WaInboxConversation, WaInboxMessage } from '~/types/whatsapp-inbox'
import { useWaInboxCache } from '~/composables/whatsapp-inbox/waInboxCache'
import {
  mergeDeliveryStatus,
  mergeWaInboxMessage,
  waMessageNumericId
} from '~/composables/whatsapp-inbox/waInboxMessageUtils'
import { waInboxLog } from '~/composables/whatsapp-inbox/waInboxWsLog'

function conversationPatchFromMessage(msg: WaInboxMessage): Partial<WaInboxConversation> {
  const body = msg.body?.trim()
  let preview = body ? body.slice(0, 200) : ''
  if (!preview && msg.media_url) {
    if (msg.message_type === 'image') preview = 'Foto'
    else if (msg.message_type === 'video') preview = 'Video'
    else preview = msg.media_filename || 'Adjunto'
  }
  if (!preview) preview = 'Mensaje'
  return {
    last_message_preview: preview,
    last_message_at: msg.sent_at || new Date().toISOString(),
    ...(msg.time_label ? { last_message_time_label: msg.time_label } : {})
  }
}

/** Chat abierto en la UI (null si el usuario no está en el inbox o no eligió conversación). */
let viewingConversationId: number | null = null

export function setWaInboxViewingConversationId(id: number | null) {
  viewingConversationId = id
}

export function getWaInboxViewingConversationId(): number | null {
  return viewingConversationId
}

function resolveIncomingDeliveryStatus(
  payload: WaInboxWsMessageStatusPayload
): string | null {
  const top = typeof payload.delivery_status === 'string'
    ? payload.delivery_status.trim()
    : ''
  if (top) return top
  const nested = typeof payload.message?.delivery_status === 'string'
    ? payload.message.delivery_status.trim()
    : ''
  return nested || null
}

function applyDeliveryStatusPatch(
  prev: WaInboxMessage,
  payload: WaInboxWsMessageStatusPayload,
  incomingStatus: string
): WaInboxMessage {
  const msgId = waMessageNumericId(payload.message_id) || waMessageNumericId(prev.id)
  const merged: WaInboxMessage = {
    ...prev,
    id: msgId,
    delivery_status:
      mergeDeliveryStatus(prev.delivery_status, incomingStatus)
      ?? incomingStatus
      ?? prev.delivery_status
  }
  const nested = payload.message
  if (nested?.meta_message_id) {
    merged.meta_message_id = nested.meta_message_id
  }
  if (nested?.failed_reason != null && nested.failed_reason !== '') {
    merged.failed_reason = nested.failed_reason
  }
  return merged
}

function upsertMessageInCache(convId: number, msg: WaInboxMessage) {
  const cache = useWaInboxCache()
  const msgId = waMessageNumericId(msg.id)
  if (!msgId) return

  const entry = cache.getMessages(convId)
  if (entry) {
    const mi = entry.messages.findIndex((m) => waMessageNumericId(m.id) === msgId)
    const list = [...entry.messages]
    if (mi >= 0) {
      list[mi] = mergeWaInboxMessage(list[mi], { ...msg, id: msgId })
    } else {
      list.push({ ...msg, id: msgId })
    }
    cache.setMessages(convId, list, entry.conversationPatch)
  } else {
    cache.setMessages(convId, [{ ...msg, id: msgId }])
  }
}

function patchStatusInCache(
  convId: number,
  messageId: number,
  payload: WaInboxWsMessageStatusPayload,
  incomingStatus: string
) {
  const cache = useWaInboxCache()
  const entry = cache.getMessages(convId)
  if (!entry) {
    if (payload.message) {
      cache.setMessages(
        convId,
        [
          applyDeliveryStatusPatch(
            { ...payload.message, id: messageId } as WaInboxMessage,
            payload,
            incomingStatus
          )
        ]
      )
    }
    return
  }

  const mi = entry.messages.findIndex((m) => waMessageNumericId(m.id) === messageId)
  if (mi < 0) {
    if (!payload.message) return
    const list = [...entry.messages]
    list.push(
      applyDeliveryStatusPatch(
        { ...payload.message, id: messageId } as WaInboxMessage,
        payload,
        incomingStatus
      )
    )
    cache.setMessages(convId, list, entry.conversationPatch)
    return
  }

  const list = [...entry.messages]
  list[mi] = applyDeliveryStatusPatch(list[mi], payload, incomingStatus)
  cache.setMessages(convId, list, entry.conversationPatch)
}

/**
 * Persiste en caché global eventos WS (lista + mensajes) aunque no haya vista montada.
 */
export function applyMessageCreatedToStore(payload: WaInboxWsMessageCreatedPayload) {
  const convId = Number(payload.conversation_id)
  if (!convId) return

  const cache = useWaInboxCache()
  const msg = payload.message
  const viewing = viewingConversationId === convId

  if (payload.conversation) {
    const patch = { ...payload.conversation } as WaInboxConversation
    if (viewing && msg?.direction === 'in') {
      patch.unread_count = 0
    }
    cache.upsertConversation(patch)
    waInboxLog('store.messageCreated', {
      convId,
      source: 'payload.conversation',
      viewing,
      direction: msg?.direction
    })
  } else if (msg) {
    const snap = cache.getConversationsSnapshot()
    const existing = snap.find((c) => c.id === convId)
    const previewPatch = conversationPatchFromMessage(msg as WaInboxMessage)
    if (existing) {
      const unread =
        msg.direction === 'in' && !viewing
          ? (existing.unread_count || 0) + 1
          : viewing && msg.direction === 'in'
            ? 0
            : existing.unread_count
      cache.patchConversation(convId, {
        ...previewPatch,
        ...(unread != null ? { unread_count: unread } : {})
      })
    } else if (previewPatch.last_message_preview) {
      cache.patchConversation(convId, previewPatch)
    }
    waInboxLog('store.messageCreated', {
      convId,
      source: 'patchFromMessage',
      viewing,
      direction: msg?.direction,
      hasExisting: Boolean(existing)
    })
  }

  if (!waMessageNumericId(msg?.id)) return
  upsertMessageInCache(convId, msg as WaInboxMessage)
}

export function applyStatusUpdatedToStore(payload: WaInboxWsMessageStatusPayload) {
  const convId = Number(payload.conversation_id)
  const messageId = waMessageNumericId(payload.message_id)
  if (!convId || !messageId) return

  const incomingStatus = resolveIncomingDeliveryStatus(payload)
  if (!incomingStatus) return

  patchStatusInCache(convId, messageId, payload, incomingStatus)
  waInboxLog('store.statusUpdated', {
    convId,
    messageId,
    status: incomingStatus,
    viewing: viewingConversationId === convId
  })
}

export function resolveWaInboxDeliveryStatus(payload: WaInboxWsMessageStatusPayload) {
  return resolveIncomingDeliveryStatus(payload)
}

export function mergeWaInboxStatusIntoMessage(
  prev: WaInboxMessage,
  payload: WaInboxWsMessageStatusPayload,
  incomingStatus: string
) {
  return applyDeliveryStatusPatch(prev, payload, incomingStatus)
}
