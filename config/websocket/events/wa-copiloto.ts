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

/** Roles autorizados en backend routes/channels.php para whatsapp-copiloto.ventas */
const WA_COPILOTO_WS_ROLES = [
  ROLES.COTIZADOR,
  ROLES.ADMINISTRACION,
  'GERENCIA',
  ROLES.ADMIN
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
 */
export const registerWaCopilotoEvents = () => {
  registerWaCopilotoHandlers()
  for (const role of WA_COPILOTO_WS_ROLES) {
    subscribeWaCopilotoChannelForRole(role)
  }
}
