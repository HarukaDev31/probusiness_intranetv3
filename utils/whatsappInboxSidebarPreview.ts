import type { WaInboxConversation, WaInboxMessage } from '~/types/whatsapp-inbox'

const MEDIA_TYPES = new Set(['image', 'video', 'audio', 'document', 'sticker'])

export type WaInboxSidebarPreviewMeta = {
  label: string
  icon: string | null
  showMediaIcon: boolean
  showTicks: boolean
  tickSymbol: string
  tickClass: string
}

function inferTypeFromPreview(preview?: string | null): string | null {
  const p = (preview || '').trim().toLowerCase()
  if (!p) return null
  if (p === 'foto' || p.startsWith('[image') || p.startsWith('[imagen')) return 'image'
  if (p === 'video' || p.startsWith('[video')) return 'video'
  if (p === 'audio' || p.startsWith('[audio')) return 'audio'
  if (p === 'documento' || p.startsWith('[document')) return 'document'
  if (p === 'sticker' || p.startsWith('[sticker')) return 'sticker'
  if (p.includes('plantilla') || p.startsWith('[template')) return 'template'
  return null
}

export function resolveWaInboxLastMessageType(
  conv: Pick<WaInboxConversation, 'last_message_type' | 'last_message_preview'>
): string | null {
  const t = conv.last_message_type?.toLowerCase().trim()
  if (t) return t
  return inferTypeFromPreview(conv.last_message_preview)
}

function mediaIcon(type: string | null): string | null {
  if (!type || !MEDIA_TYPES.has(type)) return null
  if (type === 'image' || type === 'sticker') return 'i-heroicons-photo'
  if (type === 'video') return 'i-heroicons-video-camera'
  if (type === 'audio') return 'i-heroicons-microphone'
  if (type === 'document') return 'i-heroicons-document'
  return null
}

function mediaLabel(type: string | null, preview?: string | null): string {
  if (type === 'image') return 'Foto'
  if (type === 'sticker') return 'Sticker'
  if (type === 'video') return 'Video'
  if (type === 'audio') return 'Audio'
  if (type === 'document') return 'Documento'
  if (type === 'template') return 'Plantilla'
  const text = (preview || '').trim()
  if (text && !text.startsWith('[')) return text
  return 'Mensaje'
}

function tickMeta(status?: string | null): Pick<WaInboxSidebarPreviewMeta, 'tickSymbol' | 'tickClass'> {
  const s = (status || '').toLowerCase()
  if (s === 'failed') {
    return { tickSymbol: '✗', tickClass: 'text-error' }
  }
  if (s === 'read') {
    return { tickSymbol: '✓✓', tickClass: 'text-info' }
  }
  if (s === 'delivered') {
    return { tickSymbol: '✓✓', tickClass: 'text-muted' }
  }
  if (s === 'sent') {
    return { tickSymbol: '✓', tickClass: 'text-muted' }
  }
  return { tickSymbol: '◷', tickClass: 'text-muted' }
}

export function getWaInboxSidebarPreviewMeta(
  conv: Pick<
    WaInboxConversation,
    | 'last_message_preview'
    | 'last_message_type'
    | 'last_direction'
    | 'last_message_delivery_status'
  >
): WaInboxSidebarPreviewMeta {
  const type = resolveWaInboxLastMessageType(conv)
  const isMedia = Boolean(type && (MEDIA_TYPES.has(type) || type === 'template'))
  const icon = isMedia ? mediaIcon(type) : null
  const label = isMedia
    ? mediaLabel(type, conv.last_message_preview)
    : ((conv.last_message_preview || '').trim() || '—')
  const showTicks = conv.last_direction === 'out'
  const ticks = tickMeta(conv.last_message_delivery_status)

  return {
    label,
    icon,
    showMediaIcon: Boolean(icon),
    showTicks,
    ...ticks
  }
}

export function conversationPatchFromWaInboxMessage(
  msg: WaInboxMessage
): Partial<WaInboxConversation> {
  const type = (msg.message_type || 'text').toLowerCase()
  const label = mediaLabel(type, msg.body)
  const msgId = Number(msg.id)
  const patch: Partial<WaInboxConversation> = {
    last_message_preview: type === 'text' ? (msg.body?.trim() || label).slice(0, 200) : label,
    last_message_at: msg.sent_at || new Date().toISOString(),
    last_direction: msg.direction,
    last_message_type: msg.message_type,
    ...(msg.time_label ? { last_message_time_label: msg.time_label } : {}),
    ...(Number.isFinite(msgId) && msgId > 0 ? { last_message_id: msgId } : {}),
    last_message_delivery_status:
      msg.direction === 'out' ? (msg.delivery_status || 'pending') : null
  }
  return patch
}
