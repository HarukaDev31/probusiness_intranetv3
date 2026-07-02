import type { WaInboxRealtimeHandlers } from '~/composables/whatsapp-inbox/waInboxRealtimeBridge'
import { waInboxLog } from '~/composables/whatsapp-inbox/waInboxWsLog'

/** Handlers vivos del composable inbox (sobreviven a re-registros de UI). */
let liveHandlers: WaInboxRealtimeHandlers | null = null

export function bindWaInboxLiveHandlers(handlers: WaInboxRealtimeHandlers | null) {
  liveHandlers = handlers
  waInboxLog('live.bind', {
    hasHandlers: Boolean(handlers),
    hasCreated: Boolean(handlers?.onMessageCreated),
    hasStatus: Boolean(handlers?.onMessageStatusUpdated)
  })
}

export function getWaInboxLiveHandlers(): WaInboxRealtimeHandlers | null {
  return liveHandlers
}
