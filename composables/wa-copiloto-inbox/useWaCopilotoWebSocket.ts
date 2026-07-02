import {
  setWaCopilotoRealtimeHandlers,
  type WaCopilotoRealtimeHandlers
} from '~/composables/wa-copiloto-inbox/waCopilotoRealtimeBridge'

export type WaCopilotoWebSocketHandlers = WaCopilotoRealtimeHandlers

/** Solo enlaza handlers; el canal se suscribe una vez con el rol Coordinación (sin unsubscribe al salir del inbox). */
export function useWaCopilotoWebSocket() {
  function connect(handlers: WaCopilotoWebSocketHandlers) {
    setWaCopilotoRealtimeHandlers(handlers)
  }

  function disconnect() {
    setWaCopilotoRealtimeHandlers(null)
  }

  function updateHandlers(handlers: WaCopilotoWebSocketHandlers) {
    setWaCopilotoRealtimeHandlers(handlers)
  }

  return { connect, disconnect, updateHandlers }
}
