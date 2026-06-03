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
  if (typeof data === 'string') {
    try {
      return JSON.parse(data) as T
    } catch {
      return null
    }
  }
  return data as T
}

let channelSubscribed = false
let activeHandlers: WaInboxWebSocketHandlers | null = null
let echoReadyListener: (() => void) | null = null

export function useWaInboxWebSocket() {
  const { subscribeToChannel, unsubscribeFromChannel } = useEcho()

  function trySubscribe(handlers: WaInboxWebSocketHandlers): boolean {
    if (channelSubscribed || !getEchoInstance()) {
      return channelSubscribed
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
            if (!p?.conversation_id || !p.message) return
            activeHandlers?.onMessageCreated?.(p)
          }
        },
        {
          event: WA_INBOX_WS_EVENTS.MESSAGE_STATUS_UPDATED,
          callback: (raw: unknown) => {
            const p = parsePayload<WaInboxWsMessageStatusPayload>(raw)
            if (!p?.conversation_id || !p.message_id) return
            activeHandlers?.onMessageStatusUpdated?.(p)
          }
        }
      ]
    })
    channelSubscribed = true
    return true
  }

  function connect(handlers: WaInboxWebSocketHandlers) {
    activeHandlers = handlers
    if (trySubscribe(handlers)) return

    if (typeof window === 'undefined') return

    if (echoReadyListener) {
      window.removeEventListener('echo-ready', echoReadyListener)
      echoReadyListener = null
    }

    echoReadyListener = () => {
      trySubscribe(handlers)
      if (echoReadyListener) {
        window.removeEventListener('echo-ready', echoReadyListener)
        echoReadyListener = null
      }
    }
    window.addEventListener('echo-ready', echoReadyListener)

    if (getEchoInstance()) {
      trySubscribe(handlers)
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
    if (channelSubscribed) {
      unsubscribeFromChannel(WA_INBOX_WS_CHANNEL)
    }
    channelSubscribed = false
    activeHandlers = null
  }

  function updateHandlers(handlers: WaInboxWebSocketHandlers) {
    activeHandlers = handlers
  }

  return { connect, disconnect, updateHandlers }
}
