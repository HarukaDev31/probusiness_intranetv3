import { WaCopilotoService } from '~/services/wa-copiloto/waCopilotoService'
import { mergeMessageLists } from '~/composables/wa-copiloto-inbox/waCopilotoMessageUtils'
import type { WaCopilotoConversation, WaCopilotoMessage } from '~/types/wa-copiloto'

const DEFAULT_PER_PAGE = 200

export type WaCopilotoMessagesHistoryResult = {
  messages: WaCopilotoMessage[]
  conversation?: Partial<WaCopilotoConversation>
  total: number
  fullHistory: boolean
}

export async function fetchWaCopilotoMessagesHistory(
  conversationId: number,
  options: { perPage?: number } = {}
): Promise<WaCopilotoMessagesHistoryResult> {
  const perPage = options.perPage ?? DEFAULT_PER_PAGE
  let page = 1
  let lastPage = 1
  let total = 0
  let accumulated: WaCopilotoMessage[] = []
  let conversation: Partial<WaCopilotoConversation> | undefined

  do {
    const res = await WaCopilotoService.getMessages(conversationId, { per_page: perPage, page })
    const rows = Array.isArray(res?.data) ? res.data : []
    lastPage = Math.max(1, Number(res?.pagination?.last_page) || 1)
    total = Math.max(0, Number(res?.pagination?.total) ?? accumulated.length + rows.length)
    if (res?.conversation) {
      conversation = res.conversation as Partial<WaCopilotoConversation>
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
