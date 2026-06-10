import type {
  WaInboxWsConversationReadPayload,
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
import { conversationPatchFromWaInboxMessage } from '~/utils/whatsappInboxSidebarPreview'

/**
 * No leídos entrantes: incrementa en cliente y no deja que el WS pise con un valor menor (ej. siempre 1).
 */
function resolveUnreadCountForInbound(
  convId: number,
  msg: WaInboxMessage | undefined,
  serverUnread?: number | null
): number | undefined {
  if (msg?.direction !== 'in') return undefined

  if (viewingConversationId === convId) return 0

  const server = Number(serverUnread)
  if (Number.isFinite(server)) {
    if (server === 0) return 0
    const cache = useWaInboxCache()
    const existing = cache.getConversationsSnapshot().find((c) => c.id === convId)
    const localNext = (existing?.unread_count || 0) + 1
    return Math.max(server, localNext)
  }

  const cache = useWaInboxCache()
  const existing = cache.getConversationsSnapshot().find((c) => c.id === convId)
  return (existing?.unread_count || 0) + 1
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

  const entry = cache.getMessagesEntry(convId)
  if (entry) {
    const mi = entry.messages.findIndex((m) => waMessageNumericId(m.id) === msgId)
    const list = [...entry.messages]
    if (mi >= 0) {
      list[mi] = mergeWaInboxMessage(list[mi], { ...msg, id: msgId })
    } else {
      list.push({ ...msg, id: msgId })
    }
    cache.setMessages(convId, list, entry.conversationPatch, {
      fullHistory: entry.fullHistory !== false
    })
  } else {
    cache.setMessages(convId, [{ ...msg, id: msgId }], undefined, { fullHistory: false })
  }
}

function patchStatusInCache(
  convId: number,
  messageId: number,
  payload: WaInboxWsMessageStatusPayload,
  incomingStatus: string
) {
  const cache = useWaInboxCache()
  const entry = cache.getMessagesEntry(convId)
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
        ],
        undefined,
        { fullHistory: false }
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
    cache.setMessages(convId, list, entry.conversationPatch, {
      fullHistory: entry.fullHistory !== false
    })
    return
  }

  const list = [...entry.messages]
  list[mi] = applyDeliveryStatusPatch(list[mi], payload, incomingStatus)
  cache.setMessages(convId, list, entry.conversationPatch, {
    fullHistory: entry.fullHistory !== false
  })
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
    const unread = resolveUnreadCountForInbound(convId, msg as WaInboxMessage, patch.unread_count)
    if (unread != null) patch.unread_count = unread
    cache.upsertConversation(patch)
    waInboxLog('store.messageCreated', {
      convId,
      source: 'payload.conversation',
      viewing,
      direction: msg?.direction,
      unread: patch.unread_count
    })
  } else if (msg) {
    const snap = cache.getConversationsSnapshot()
    const existing = snap.find((c) => c.id === convId)
    const previewPatch = conversationPatchFromWaInboxMessage(msg as WaInboxMessage)
    const unread = resolveUnreadCountForInbound(convId, msg as WaInboxMessage, undefined)
    if (existing) {
      cache.patchConversation(convId, {
        ...previewPatch,
        ...(unread != null ? { unread_count: unread } : {})
      })
    } else if (previewPatch.last_message_preview) {
      cache.patchConversation(convId, {
        ...previewPatch,
        ...(unread != null ? { unread_count: unread } : {})
      })
    }
    waInboxLog('store.messageCreated', {
      convId,
      source: 'patchFromMessage',
      viewing,
      direction: msg?.direction,
      hasExisting: Boolean(existing),
      unread
    })
  }

  if (!waMessageNumericId(msg?.id)) return
  upsertMessageInCache(convId, msg as WaInboxMessage)
}

function patchConversationLastDeliveryInCache(
  convId: number,
  messageId: number,
  status: string
) {
  const cache = useWaInboxCache()
  const conv = cache.getConversationsSnapshot().find((c) => c.id === convId)
  if (!conv || conv.last_direction !== 'out' || conv.last_message_id !== messageId) return
  cache.patchConversation(convId, { last_message_delivery_status: status })
}

export function applyStatusUpdatedToStore(payload: WaInboxWsMessageStatusPayload) {
  const convId = Number(payload.conversation_id)
  const messageId = waMessageNumericId(payload.message_id)
  if (!convId || !messageId) return

  const incomingStatus = resolveIncomingDeliveryStatus(payload)
  if (!incomingStatus) return

  patchStatusInCache(convId, messageId, payload, incomingStatus)
  patchConversationLastDeliveryInCache(convId, messageId, incomingStatus)
  waInboxLog('store.statusUpdated', {
    convId,
    messageId,
    status: incomingStatus,
    viewing: viewingConversationId === convId
  })
}

export function applyConversationReadToStore(payload: WaInboxWsConversationReadPayload) {
  const convId = Number(payload.conversation_id)
  if (!convId) return

  const cache = useWaInboxCache()
  const patch: Partial<WaInboxConversation> = payload.conversation
    ? { ...payload.conversation, unread_count: 0 }
    : { unread_count: 0 }

  cache.patchConversation(convId, patch)
  waInboxLog('store.conversationRead', { convId, viewing: viewingConversationId === convId })
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
