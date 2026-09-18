/** Canal legado org 1: `private-whatsapp-inbox.coordinacion` */
export const WA_INBOX_WS_CHANNEL = 'whatsapp-inbox.coordinacion'

export function waInboxWsChannel(organizacionId: number): string {
  return `whatsapp-inbox.org.${organizacionId}`
}

export function resolveWaInboxOrganizacionId(): number {
  if (typeof localStorage === 'undefined') return 0
  try {
    const raw = localStorage.getItem('auth_user')
    if (!raw) return 0
    const user = JSON.parse(raw) as {
      raw?: { organizacion?: { id?: number } }
      organizacion?: { id?: number }
    }
    return Number(user.raw?.organizacion?.id || user.organizacion?.id || 0)
  } catch {
    return 0
  }
}

export function resolveWaInboxWsChannel(): string {
  const orgId = resolveWaInboxOrganizacionId()
  return orgId > 0 ? waInboxWsChannel(orgId) : WA_INBOX_WS_CHANNEL
}

export const WA_INBOX_WS_EVENTS = {
  MESSAGE_CREATED: 'WaInboxMessageCreated',
  MESSAGE_STATUS_UPDATED: 'WaInboxMessageStatusUpdated',
  CONVERSATION_READ: 'WaInboxConversationRead'
} as const
