import {
  setWaInboxRealtimeHandlers,
  type WaInboxRealtimeHandlers
} from '~/composables/whatsapp-inbox/waInboxRealtimeBridge'

export type WaInboxWebSocketHandlers = WaInboxRealtimeHandlers

/** Solo enlaza handlers; el canal se suscribe una vez con el rol Coordinación (sin unsubscribe al salir del inbox). */
export function useWaInboxWebSocket() {
  function connect(handlers: WaInboxWebSocketHandlers) {
    setWaInboxRealtimeHandlers(handlers)
  }

  function disconnect() {
    setWaInboxRealtimeHandlers(null)
  }

  function updateHandlers(handlers: WaInboxWebSocketHandlers) {
    setWaInboxRealtimeHandlers(handlers)
  }

  return { connect, disconnect, updateHandlers }
}
