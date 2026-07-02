import { ref } from 'vue'
import type { WaCopilotoWsMessageInsightsPayload } from '~/types/wa-copiloto-ws'
import type { WaCopilotoMessage, WaCopilotoMessageInsight } from '~/types/wa-copiloto'
import { useWaCopilotoCache } from '~/composables/wa-copiloto-inbox/waCopilotoCache'
import { waMessageNumericId } from '~/composables/wa-copiloto-inbox/waCopilotoMessageUtils'
import { WaCopilotoLog } from '~/composables/wa-copiloto-inbox/waCopilotoWsLog'

/** Ficha IA recibida por WS, indexada por teléfono E.164. */
export const waCopilotoInsightsFichaByPhone = ref<Record<string, Record<string, unknown>>>({})

/** Mensajes entrantes esperando análisis IA (messageId → convId). */
export const waCopilotoPendingAnalysis = ref<Record<number, number>>({})

const pendingAnalysisTimers = new Map<number, ReturnType<typeof setTimeout>>()

const PENDING_ANALYSIS_TIMEOUT_MS = 120_000

export function isWaCopilotoAnalysisPending(messageId: number): boolean {
  const id = Number(messageId)
  return Number.isFinite(id) && id > 0 && id in waCopilotoPendingAnalysis.value
}

export function markWaCopilotoAnalysisPending(convId: number, messageId: number) {
  const msgId = Number(messageId)
  const cId = Number(convId)
  if (!Number.isFinite(msgId) || msgId <= 0 || !Number.isFinite(cId) || cId <= 0) return

  waCopilotoPendingAnalysis.value = {
    ...waCopilotoPendingAnalysis.value,
    [msgId]: cId
  }

  const prev = pendingAnalysisTimers.get(msgId)
  if (prev) clearTimeout(prev)
  pendingAnalysisTimers.set(
    msgId,
    setTimeout(() => clearWaCopilotoAnalysisPending(msgId), PENDING_ANALYSIS_TIMEOUT_MS)
  )
}

export function clearWaCopilotoAnalysisPending(messageId: number) {
  const msgId = Number(messageId)
  if (!Number.isFinite(msgId) || msgId <= 0) return

  const timer = pendingAnalysisTimers.get(msgId)
  if (timer) {
    clearTimeout(timer)
    pendingAnalysisTimers.delete(msgId)
  }

  if (!(msgId in waCopilotoPendingAnalysis.value)) return
  const next = { ...waCopilotoPendingAnalysis.value }
  delete next[msgId]
  waCopilotoPendingAnalysis.value = next
}

function isRecentInboundMessage(msg: WaCopilotoMessage, maxAgeMs = 3 * 60 * 1000): boolean {
  const raw = msg.sent_at || msg.created_at
  if (!raw) return false
  const t = new Date(String(raw)).getTime()
  return Number.isFinite(t) && Date.now() - t < maxAgeMs
}

export function syncWaCopilotoPendingAnalysisForMessages(convId: number, messages: WaCopilotoMessage[]) {
  for (const msg of messages) {
    const msgId = waMessageNumericId(msg.id)
    if (!msgId) continue
    if ((msg.insights ?? []).length > 0) {
      clearWaCopilotoAnalysisPending(msgId)
    }
  }

  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i]
    if (msg.direction !== 'in') continue
    const msgId = waMessageNumericId(msg.id)
    if (!msgId) break
    if ((msg.insights ?? []).length === 0) {
      const alreadyPending = isWaCopilotoAnalysisPending(msgId)
      if (alreadyPending || isRecentInboundMessage(msg)) {
        markWaCopilotoAnalysisPending(convId, msgId)
      }
    }
    break
  }
}

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
  clearWaCopilotoAnalysisPending(msgId)

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
