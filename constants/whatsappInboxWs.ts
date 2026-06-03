/** Canal privado Laravel Echo: `private-whatsapp-inbox.coordinacion` */
export const WA_INBOX_WS_CHANNEL = 'whatsapp-inbox.coordinacion'

export const WA_INBOX_WS_EVENTS = {
  MESSAGE_CREATED: 'WaInboxMessageCreated',
  MESSAGE_STATUS_UPDATED: 'WaInboxMessageStatusUpdated'
} as const
