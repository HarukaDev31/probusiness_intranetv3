import {
  registerEventHandler,
  subscribeEventsToRole
} from '~/config/websocket/channels'
import { ROLES } from '~/constants/roles'
import { WA_COPILOTO_WS_CHANNEL, WA_COPILOTO_WS_EVENTS } from '~/constants/waCopilotoWs'
import {
  dispatchWaCopilotoMessageCreated,
  dispatchWaCopilotoMessageInsightsReady,
  dispatchWaCopilotoMessageStatusUpdated
} from '~/composables/wa-copiloto-inbox/waCopilotoRealtimeBridge'

const WA_COPILOTO_WS_EVENT_LIST = [
  WA_COPILOTO_WS_EVENTS.MESSAGE_CREATED,
  WA_COPILOTO_WS_EVENTS.MESSAGE_STATUS_UPDATED,
  WA_COPILOTO_WS_EVENTS.MESSAGE_INSIGHTS_READY
] as const

function registerWaCopilotoHandlers() {
  registerEventHandler(WA_COPILOTO_WS_EVENTS.MESSAGE_CREATED, dispatchWaCopilotoMessageCreated)
  registerEventHandler(
    WA_COPILOTO_WS_EVENTS.MESSAGE_STATUS_UPDATED,
    dispatchWaCopilotoMessageStatusUpdated
  )
  registerEventHandler(
    WA_COPILOTO_WS_EVENTS.MESSAGE_INSIGHTS_READY,
    dispatchWaCopilotoMessageInsightsReady
  )
}

function subscribeWaCopilotoChannelForRole(role: string) {
  subscribeEventsToRole(role, WA_COPILOTO_WS_CHANNEL, [...WA_COPILOTO_WS_EVENT_LIST], 'private')
}

/**
 * Canal privado Copiloto ventas (`whatsapp-copiloto.ventas`).
 * Cotizadores y admins que usan /copiloto deben estar suscritos para tiempo real.
 */
export const registerWaCopilotoEvents = () => {
  registerWaCopilotoHandlers()
  subscribeWaCopilotoChannelForRole(ROLES.COTIZADOR)
  subscribeWaCopilotoChannelForRole(ROLES.ADMIN)
}
