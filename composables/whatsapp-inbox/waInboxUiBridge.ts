import type { WaInboxRealtimeHandlers } from '~/composables/whatsapp-inbox/waInboxRealtimeBridge'
import { waInboxTrace } from '~/composables/whatsapp-inbox/waInboxWsLog'

/** Handlers de UI del inbox; independiente del ciclo de vida del componente. */
let inboxUiHandlers: WaInboxRealtimeHandlers | null = null

export function registerWaInboxUiHandlers(handlers: WaInboxRealtimeHandlers | null) {
  inboxUiHandlers = handlers
  waInboxTrace('ui.register', { hasHandlers: Boolean(handlers) })
}

export function getWaInboxUiHandlers(): WaInboxRealtimeHandlers | null {
  return inboxUiHandlers
}
