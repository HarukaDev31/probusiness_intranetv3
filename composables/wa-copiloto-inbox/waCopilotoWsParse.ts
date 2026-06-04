export function payloadConversationId(payload: { conversation_id?: unknown } | null): number {
  const n = Number(payload?.conversation_id)
  return Number.isFinite(n) && n > 0 ? n : 0
}

export function payloadMessageId(payload: { message_id?: unknown } | null): number {
  const n = Number(payload?.message_id)
  return Number.isFinite(n) && n > 0 ? n : 0
}

export function parseWaCopilotoWsPayload<T>(data: unknown): T | null {
  if (!data) return null
  let parsed: unknown = data
  if (typeof data === 'string') {
    try {
      parsed = JSON.parse(data)
    } catch {
      return null
    }
  }
  if (parsed && typeof parsed === 'object' && 'data' in parsed) {
    const top = parsed as Record<string, unknown>
    const hasTopLevelIds =
      payloadConversationId(top as { conversation_id?: unknown })
      || payloadMessageId(top as { message_id?: unknown })
      || (top.message != null && typeof top.message === 'object')
    if (!hasTopLevelIds) {
      const inner = top.data
      if (inner && typeof inner === 'object') {
        parsed = inner
      } else if (typeof inner === 'string') {
        try {
          parsed = JSON.parse(inner)
        } catch {
          return null
        }
      }
    }
  }
  return parsed as T
}
