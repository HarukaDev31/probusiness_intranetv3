import { ref } from 'vue'
import type { WaCopilotoWsMessageInsightsPayload } from '~/types/wa-copiloto-ws'
import type { WaCopilotoMessage, WaCopilotoMessageInsight } from '~/types/wa-copiloto'
import { useWaCopilotoCache } from '~/composables/wa-copiloto-inbox/waCopilotoCache'
import { waMessageNumericId } from '~/composables/wa-copiloto-inbox/waCopilotoMessageUtils'
import { WaCopilotoLog } from '~/composables/wa-copiloto-inbox/waCopilotoWsLog'

/** Ficha IA recibida por WS, indexada por teléfono E.164. */
export const waCopilotoInsightsFichaByPhone = ref<Record<string, Record<string, unknown>>>({})

function applyInsightsToMessageList(
  list: WaCopilotoMessage[],
  msgId: number,
  insights: WaCopilotoMessageInsight[]
): { list: WaCopilotoMessage[]; applied: boolean } {
  const idx = list.findIndex((m) => waMessageNumericId(m.id) === msgId)
  if (idx < 0) return { list, applied: false }
  const next = [...list]
  next[idx] = { ...next[idx], insights: [...insights] }
  return { list: next, applied: true }
}

/**
 * Persiste insights IA en caché global (lista + mensajes + temperatura),
 * aunque la vista del inbox no esté montada.
 */
export function applyInsightsReadyToStore(payload: WaCopilotoWsMessageInsightsPayload) {
  const convId = Number(payload.conversation_id)
  const msgId = waMessageNumericId(payload.message_id)
  if (!convId || !msgId || !Array.isArray(payload.insights)) return

  const insights = [...payload.insights] as WaCopilotoMessageInsight[]
  const cache = useWaCopilotoCache()
  let appliedToMessages = false

  const entry = cache.getMessagesEntry(convId)
  if (entry?.messages?.length) {
    const result = applyInsightsToMessageList(entry.messages, msgId, insights)
    if (result.applied) {
      cache.setMessages(convId, result.list, entry.conversationPatch, {
        fullHistory: entry.fullHistory !== false
      })
      appliedToMessages = true
    }
  }

  const phone = String(payload.phone_e164 || '').trim()
  if (phone && payload.ficha) {
    waCopilotoInsightsFichaByPhone.value = {
      ...waCopilotoInsightsFichaByPhone.value,
      [phone]: {
        ...(waCopilotoInsightsFichaByPhone.value[phone] ?? {}),
        ...payload.ficha
      }
    }
  }

  const leadTemp = payload.temperatura_lead ?? payload.ficha?.temperatura
  if (leadTemp != null && Number.isFinite(Number(leadTemp))) {
    const temp = Math.min(100, Math.max(0, Number(leadTemp)))
    cache.patchConversation(convId, { temperatura: temp })
  }

  WaCopilotoLog('store.messageInsights', {
    convId,
    msgId,
    insightCount: insights.length,
    appliedToMessages,
    phone: phone || undefined,
    temperatura: leadTemp ?? undefined
  })
}
