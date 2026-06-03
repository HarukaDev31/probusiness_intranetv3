import { WA_INBOX_WS_CHANNEL, WA_INBOX_WS_EVENTS } from '~/constants/whatsappInboxWs'
import { useEcho, getEchoInstance } from '~/composables/websocket/useEcho'
import type {
  WaInboxWsMessageCreatedPayload,
  WaInboxWsMessageStatusPayload
} from '~/types/whatsapp-inbox-ws'

export type WaInboxWebSocketHandlers = {
  onMessageCreated?: (payload: WaInboxWsMessageCreatedPayload) => void
  onMessageStatusUpdated?: (payload: WaInboxWsMessageStatusPayload) => void
}

function parsePayload<T>(data: unknown): T | null {
  if (!data) return null
  let parsed: unknown = data
  if (typeof data === 'string') {
    try {
      parsed = JSON.parse(data)
    } catch {
      return null
    }
  }
  if (parsed && typeof parsed === 'object' && 'data' in parsed) {
    const top = parsed as Record<string, unknown>
    const hasTopLevelIds =
      payloadConversationId(top as { conversation_id?: unknown })
      || payloadMessageId(top as { message_id?: unknown })
      || (top.message != null && typeof top.message === 'object')
    if (!hasTopLevelIds) {
      const inner = top.data
      if (inner && typeof inner === 'object') {
        parsed = inner
      } else if (typeof inner === 'string') {
        try {
          parsed = JSON.parse(inner)
        } catch {
          return null
        }
      }
    }
  }
  return parsed as T
}

function payloadConversationId(payload: { conversation_id?: unknown } | null): number {
  const n = Number(payload?.conversation_id)
  return Number.isFinite(n) && n > 0 ? n : 0
}

function payloadMessageId(payload: { message_id?: unknown } | null): number {
  const n = Number(payload?.message_id)
  return Number.isFinite(n) && n > 0 ? n : 0
}

let activeHandlers: WaInboxWebSocketHandlers | null = null
let echoReadyListener: (() => void) | null = null

export function useWaInboxWebSocket() {
  const { subscribeToChannel, unsubscribeFromChannel } = useEcho()

  function bindInboxChannel(handlers: WaInboxWebSocketHandlers): boolean {
    if (!getEchoInstance()) {
      return false
    }

    activeHandlers = handlers

    subscribeToChannel({
      name: WA_INBOX_WS_CHANNEL,
      type: 'private',
      handlers: [
        {
          event: WA_INBOX_WS_EVENTS.MESSAGE_CREATED,
          callback: (raw: unknown) => {
            const p = parsePayload<WaInboxWsMessageCreatedPayload>(raw)
            if (!payloadConversationId(p) || !p?.message) return
            activeHandlers?.onMessageCreated?.({
              ...p,
              conversation_id: payloadConversationId(p)
            })
          }
        },
        {
          event: WA_INBOX_WS_EVENTS.MESSAGE_STATUS_UPDATED,
          callback: (raw: unknown) => {
            const p = parsePayload<WaInboxWsMessageStatusPayload>(raw)
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
        }
      ]
    })

    return true
  }

  function connect(handlers: WaInboxWebSocketHandlers) {
    activeHandlers = handlers

    const tryBind = () => {
      if (!getEchoInstance()) return false
      unsubscribeFromChannel(WA_INBOX_WS_CHANNEL)
      return bindInboxChannel(handlers)
    }

    if (tryBind()) return

    if (typeof window === 'undefined') return

    if (echoReadyListener) {
      window.removeEventListener('echo-ready', echoReadyListener)
      echoReadyListener = null
    }

    echoReadyListener = () => {
      tryBind()
      if (echoReadyListener) {
        window.removeEventListener('echo-ready', echoReadyListener)
        echoReadyListener = null
      }
    }
    window.addEventListener('echo-ready', echoReadyListener)

    if (getEchoInstance()) {
      tryBind()
      if (echoReadyListener) {
        window.removeEventListener('echo-ready', echoReadyListener)
        echoReadyListener = null
      }
    }
  }

  function disconnect() {
    if (typeof window !== 'undefined' && echoReadyListener) {
      window.removeEventListener('echo-ready', echoReadyListener)
      echoReadyListener = null
    }
    unsubscribeFromChannel(WA_INBOX_WS_CHANNEL)
    activeHandlers = null
  }

  function updateHandlers(handlers: WaInboxWebSocketHandlers) {
    activeHandlers = handlers
  }

  return { connect, disconnect, updateHandlers }
}
