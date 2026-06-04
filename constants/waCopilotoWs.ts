/** Canal privado Laravel Echo: `private-whatsapp-copiloto.ventas` */
export const WA_COPILOTO_WS_CHANNEL = 'whatsapp-copiloto.ventas'

export const WA_COPILOTO_WS_EVENTS = {
  MESSAGE_CREATED: 'WaCopilotoMessageCreated',
  MESSAGE_STATUS_UPDATED: 'WaCopilotoMessageStatusUpdated',
  MESSAGE_INSIGHTS_READY: 'WaCopilotoMessageInsightsReady'
} as const