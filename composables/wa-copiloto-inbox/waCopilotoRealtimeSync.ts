import type {
  WaCopilotoWsMessageCreatedPayload,
  WaCopilotoWsMessageStatusPayload
} from '~/types/wa-copiloto-ws'
import type { WaCopilotoConversation, WaCopilotoMessage } from '~/types/wa-copiloto'
import { useWaCopilotoCache } from '~/composables/wa-copiloto-inbox/waCopilotoCache'
import {
  mergeDeliveryStatus,
  mergeWaCopilotoMessage,
  waMessageNumericId
} from '~/composables/wa-copiloto-inbox/waCopilotoMessageUtils'
import { WaCopilotoLog } from '~/composables/wa-copiloto-inbox/waCopilotoWsLog'
import { conversationPatchFromWaInboxMessage } from '~/utils/whatsappInboxSidebarPreview'

/**
 * No leídos entrantes: incrementa en cliente y no deja que el WS pise con un valor menor (ej. siempre 1).
 */
function resolveUnreadCountForInbound(
  convId: number,
  msg: WaCopilotoMessage | undefined,
  serverUnread?: number | null
): number | undefined {
  if (msg?.direction !== 'in') return undefined

  if (viewingConversationId === convId) return 0

  const cache = useWaCopilotoCache()
  const existing = cache.getConversationsSnapshot().find((c) => c.id === convId)
  const localNext = (existing?.unread_count || 0) + 1
  const server = Number(serverUnread)
  if (Number.isFinite(server) && server > 0) {
    return Math.max(server, localNext)
  }
  return localNext
}

/** Chat abierto en la UI (null si el usuario no está en el inbox o no eligió conversación). */
let viewingConversationId: number | null = null

export function setWaCopilotoViewingConversationId(id: number | null) {
  viewingConversationId = id
}

export function getWaCopilotoViewingConversationId(): number | null {
  return viewingConversationId
}

function resolveIncomingDeliveryStatus(
  payload: WaCopilotoWsMessageStatusPayload
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
  prev: WaCopilotoMessage,
  payload: WaCopilotoWsMessageStatusPayload,
  incomingStatus: string
): WaCopilotoMessage {
  const msgId = waMessageNumericId(payload.message_id) || waMessageNumericId(prev.id)
  const merged: WaCopilotoMessage = {
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

function upsertMessageInCache(convId: number, msg: WaCopilotoMessage) {
  const cache = useWaCopilotoCache()
  const msgId = waMessageNumericId(msg.id)
  if (!msgId) return

  const entry = cache.getMessagesEntry(convId)
  if (entry) {
    const mi = entry.messages.findIndex((m) => waMessageNumericId(m.id) === msgId)
    const list = [...entry.messages]
    if (mi >= 0) {
      list[mi] = mergeWaCopilotoMessage(list[mi], { ...msg, id: msgId })
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
  payload: WaCopilotoWsMessageStatusPayload,
  incomingStatus: string
) {
  const cache = useWaCopilotoCache()
  const entry = cache.getMessagesEntry(convId)
  if (!entry) {
    if (payload.message) {
      cache.setMessages(
        convId,
        [
          applyDeliveryStatusPatch(
            { ...payload.message, id: messageId } as WaCopilotoMessage,
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
        { ...payload.message, id: messageId } as WaCopilotoMessage,
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
export function applyMessageCreatedToStore(payload: WaCopilotoWsMessageCreatedPayload) {
  const convId = Number(payload.conversation_id)
  if (!convId) return

  const cache = useWaCopilotoCache()
  const msg = payload.message
  const viewing = viewingConversationId === convId

  if (payload.conversation) {
    const patch = { ...payload.conversation } as WaCopilotoConversation
    const unread = resolveUnreadCountForInbound(convId, msg as WaCopilotoMessage, patch.unread_count)
    if (unread != null) patch.unread_count = unread
    cache.upsertConversation(patch)
    WaCopilotoLog('store.messageCreated', {
      convId,
      source: 'payload.conversation',
      viewing,
      direction: msg?.direction,
      unread: patch.unread_count
    })
  } else if (msg) {
    const snap = cache.getConversationsSnapshot()
    const existing = snap.find((c) => c.id === convId)
    const previewPatch = conversationPatchFromWaInboxMessage(msg as WaCopilotoMessage)
    const unread = resolveUnreadCountForInbound(convId, msg as WaCopilotoMessage, undefined)
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
    WaCopilotoLog('store.messageCreated', {
      convId,
      source: 'patchFromMessage',
      viewing,
      direction: msg?.direction,
      hasExisting: Boolean(existing),
      unread
    })
  }

  if (!waMessageNumericId(msg?.id)) return
  upsertMessageInCache(convId, msg as WaCopilotoMessage)
}

function patchConversationLastDeliveryInCache(
  convId: number,
  messageId: number,
  status: string
) {
  const cache = useWaCopilotoCache()
  const conv = cache.getConversationsSnapshot().find((c) => c.id === convId)
  if (!conv || conv.last_direction !== 'out' || conv.last_message_id !== messageId) return
  cache.patchConversation(convId, { last_message_delivery_status: status })
}

export function applyStatusUpdatedToStore(payload: WaCopilotoWsMessageStatusPayload) {
  const convId = Number(payload.conversation_id)
  const messageId = waMessageNumericId(payload.message_id)
  if (!convId || !messageId) return

  const incomingStatus = resolveIncomingDeliveryStatus(payload)
  if (!incomingStatus) return

  patchStatusInCache(convId, messageId, payload, incomingStatus)
  patchConversationLastDeliveryInCache(convId, messageId, incomingStatus)
  WaCopilotoLog('store.statusUpdated', {
    convId,
    messageId,
    status: incomingStatus,
    viewing: viewingConversationId === convId
  })
}

export function resolveWaCopilotoDeliveryStatus(payload: WaCopilotoWsMessageStatusPayload) {
  return resolveIncomingDeliveryStatus(payload)
}

export function mergeWaCopilotoStatusIntoMessage(
  prev: WaCopilotoMessage,
  payload: WaCopilotoWsMessageStatusPayload,
  incomingStatus: string
) {
  return applyDeliveryStatusPatch(prev, payload, incomingStatus)
}
