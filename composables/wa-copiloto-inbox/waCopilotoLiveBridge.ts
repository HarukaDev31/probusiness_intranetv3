import type { WaCopilotoRealtimeHandlers } from '~/composables/wa-copiloto-inbox/waCopilotoRealtimeBridge'
import { WaCopilotoLog } from '~/composables/wa-copiloto-inbox/waCopilotoWsLog'

/** Handlers vivos del composable inbox (sobreviven a re-registros de UI). */
let liveHandlers: WaCopilotoRealtimeHandlers | null = null

export function bindWaCopilotoLiveHandlers(handlers: WaCopilotoRealtimeHandlers | null) {
  liveHandlers = handlers
  WaCopilotoLog('live.bind', {
    hasHandlers: Boolean(handlers),
    hasCreated: Boolean(handlers?.onMessageCreated),
    hasStatus: Boolean(handlers?.onMessageStatusUpdated)
  })
}

export function getWaCopilotoLiveHandlers(): WaCopilotoRealtimeHandlers | null {
  return liveHandlers
}
