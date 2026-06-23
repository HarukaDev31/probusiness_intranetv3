import type { WaInboxWsMessageCreatedPayload } from '~/types/whatsapp-inbox-ws'
import type { WaInboxMessage } from '~/types/whatsapp-inbox'
import { WA_INBOX_ALLOWED_ROLES } from '~/constants/whatsappInboxAccess'
import { getWaInboxViewingConversationId } from '~/composables/whatsapp-inbox/waInboxRealtimeSync'
import { isWaInboxReactionNoise } from '~/composables/whatsapp-inbox/waInboxMessageUtils'
import {
  conversationPatchFromWaInboxMessage,
  getWaInboxSidebarPreviewMeta
} from '~/utils/whatsappInboxSidebarPreview'
import { mostrarNotificacionNavegadorWaInbox } from '~/utils/waInboxBrowserNotification'
import { reproducirSonidoWaInbox } from '~/utils/waInboxNotificationSound'

function usuarioTieneAccesoWaInbox(): boolean {
  if (typeof localStorage === 'undefined') return false
  try {
    const authUser = localStorage.getItem('auth_user')
    if (!authUser) return false
    const user = JSON.parse(authUser) as {
      raw?: { grupo?: { nombre?: string } }
      role?: string
    }
    const role = String(user?.raw?.grupo?.nombre || user?.role || '').trim()
    if (!role) return false
    const lower = role.toLowerCase()
    return WA_INBOX_ALLOWED_ROLES.some((r) => r.toLowerCase() === lower)
  } catch {
    return false
  }
}

function previewMensajeEntrante(
  msg: WaInboxMessage,
  payload: WaInboxWsMessageCreatedPayload
): string {
  const conv = payload.conversation
  const patch = conversationPatchFromWaInboxMessage(msg)
  const merged = {
    last_message_preview: conv?.last_message_preview ?? patch.last_message_preview ?? null,
    last_message_type: conv?.last_message_type ?? patch.last_message_type ?? msg.message_type ?? null,
    last_direction: 'in' as const,
    last_message_delivery_status: null
  }
  return getWaInboxSidebarPreviewMeta(merged).label
}

function nombreContacto(payload: WaInboxWsMessageCreatedPayload): string {
  const conv = payload.conversation
  if (conv?.contact_name?.trim()) return conv.contact_name.trim()
  if (conv?.phone_display?.trim()) return conv.phone_display.trim()
  return 'Contacto'
}

function debeNotificarMensajeEntrante(convId: number, msg: WaInboxMessage): boolean {
  if (!import.meta.client) return false
  if (!usuarioTieneAccesoWaInbox()) return false
  if (msg.direction !== 'in') return false
  if (isWaInboxReactionNoise(msg)) return false

  const viewing = getWaInboxViewingConversationId()
  const tabVisible = typeof document !== 'undefined' && document.visibilityState === 'visible'
  if (viewing === convId && tabVisible) return false

  return true
}

/**
 * Aviso de sistema + sonido para mensajes entrantes del WhatsApp Inbox.
 */
export function notifyWaInboxInboundMessage(payload: WaInboxWsMessageCreatedPayload): void {
  const convId = Number(payload.conversation_id)
  const msg = payload.message
  if (!convId || !msg) return
  if (!debeNotificarMensajeEntrante(convId, msg)) return

  reproducirSonidoWaInbox()

  void mostrarNotificacionNavegadorWaInbox({
    conversationId: convId,
    contactName: nombreContacto(payload),
    messagePreview: previewMensajeEntrante(msg, payload)
  })
}
