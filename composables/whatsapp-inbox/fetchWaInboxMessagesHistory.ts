import { WhatsappInboxService } from '~/services/whatsappInbox/whatsappInboxService'
import { mergeMessageLists } from '~/composables/whatsapp-inbox/waInboxMessageUtils'
import type { WaInboxConversation, WaInboxMessage } from '~/types/whatsapp-inbox'

const DEFAULT_PER_PAGE = 200

export type WaInboxMessagesHistoryResult = {
  messages: WaInboxMessage[]
  conversation?: Partial<WaInboxConversation>
  total: number
  fullHistory: boolean
}

/**
 * Carga todo el historial paginado (orden asc en API).
 * Evita marcar historial completo con solo la primera página (mensajes más antiguos).
 */
export async function fetchWaInboxMessagesHistory(
  conversationId: number,
  options: { perPage?: number } = {}
): Promise<WaInboxMessagesHistoryResult> {
  const perPage = options.perPage ?? DEFAULT_PER_PAGE
  let page = 1
  let lastPage = 1
  let total = 0
  let accumulated: WaInboxMessage[] = []
  let conversation: Partial<WaInboxConversation> | undefined

  do {
    const res = await WhatsappInboxService.getMessages(conversationId, { per_page: perPage, page })
    const rows = Array.isArray(res?.data) ? res.data : []
    lastPage = Math.max(1, Number(res?.pagination?.last_page) || 1)
    total = Math.max(0, Number(res?.pagination?.total) ?? accumulated.length + rows.length)
    if (res?.conversation) {
      conversation = res.conversation as Partial<WaInboxConversation>
    }
    accumulated = mergeMessageLists(accumulated, rows)
    if (rows.length === 0) break
    page += 1
  } while (page <= lastPage)

  const fullHistory = page > lastPage || (total > 0 && accumulated.length >= total)

  return {
    messages: accumulated,
    conversation,
    total,
    fullHistory
  }
}
