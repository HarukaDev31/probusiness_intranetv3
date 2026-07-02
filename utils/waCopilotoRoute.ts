import { normalizeWaInboxPhoneE164 } from '~/utils/whatsappInboxPhone'
import type { WaCopilotoConversation } from '~/types/wa-copiloto'

export type WaCopilotoConversationSlug =
  | { kind: 'id'; id: number }
  | { kind: 'phone'; phoneE164: string }

const WA_COPILOTO_BASE_PATH = '/copiloto'

export function parseWaCopilotoConversationSlug(slug: string): WaCopilotoConversationSlug | null {
  const raw = decodeURIComponent(String(slug || '').trim())
  if (!raw) return null

  const lower = raw.toLowerCase()
  if (lower.startsWith('id-') || lower.startsWith('c-')) {
    const id = parseInt(raw.replace(/^id-|^c-/i, ''), 10)
    return id > 0 ? { kind: 'id', id } : null
  }
  if (lower.startsWith('tel-') || lower.startsWith('phone-')) {
    const phoneE164 = normalizeWaInboxPhoneE164(raw.replace(/^(tel-|phone-)/i, ''))
    return phoneE164.length >= 10 ? { kind: 'phone', phoneE164 } : null
  }

  const digits = raw.replace(/\D+/g, '')
  if (!digits) return null

  if (digits.length <= 6) {
    const id = parseInt(digits, 10)
    return id > 0 ? { kind: 'id', id } : null
  }

  const phoneE164 = normalizeWaInboxPhoneE164(digits)
  return phoneE164.length >= 10 ? { kind: 'phone', phoneE164 } : null
}

export function waCopilotoConversationPath(conversationId: number): string {
  return `${WA_COPILOTO_BASE_PATH}/${conversationId}`
}

export function waCopilotoConversationPathByPhone(phoneE164: string): string {
  const d = normalizeWaInboxPhoneE164(phoneE164)
  return d ? `${WA_COPILOTO_BASE_PATH}/${d}` : WA_COPILOTO_BASE_PATH
}

export function findConversationInList(
  list: WaCopilotoConversation[],
  parsed: WaCopilotoConversationSlug
): WaCopilotoConversation | undefined {
  if (parsed.kind === 'id') {
    return list.find((c) => c.id === parsed.id)
  }
  return list.find((c) => c.phone_e164 === parsed.phoneE164)
}
