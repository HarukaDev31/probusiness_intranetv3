import type { WaInboxRealtimeHandlers } from '~/composables/whatsapp-inbox/waInboxRealtimeBridge'

/** Handlers de UI del inbox; independiente del ciclo de vida del componente. */
let inboxUiHandlers: WaInboxRealtimeHandlers | null = null

export function registerWaInboxUiHandlers(handlers: WaInboxRealtimeHandlers | null) {
  inboxUiHandlers = handlers
}

export function getWaInboxUiHandlers(): WaInboxRealtimeHandlers | null {
  return inboxUiHandlers
}
