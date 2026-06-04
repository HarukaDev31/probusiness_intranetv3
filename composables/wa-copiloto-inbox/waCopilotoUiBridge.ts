import type { WaCopilotoRealtimeHandlers } from '~/composables/wa-copiloto-inbox/waCopilotoRealtimeBridge'
import { WaCopilotoTrace } from '~/composables/wa-copiloto-inbox/waCopilotoWsLog'

/** Handlers de UI del inbox; independiente del ciclo de vida del componente. */
let inboxUiHandlers: WaCopilotoRealtimeHandlers | null = null

export function registerWaCopilotoUiHandlers(handlers: WaCopilotoRealtimeHandlers | null) {
  inboxUiHandlers = handlers
  WaCopilotoTrace('ui.register', { hasHandlers: Boolean(handlers) })
}

export function getWaCopilotoUiHandlers(): WaCopilotoRealtimeHandlers | null {
  return inboxUiHandlers
}
