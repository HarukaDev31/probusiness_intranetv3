import type { WaInboxMessage } from '~/types/whatsapp-inbox'

export const DELIVERY_STATUS_RANK: Record<string, number> = {
  pending: 0,
  sent: 1,
  delivered: 2,
  read: 3
}

export function waMessageNumericId(id: unknown): number {
  const n = Number(id)
  return Number.isFinite(n) && n > 0 ? n : 0
}

/** Evita que un WS MessageCreated tardío (pending) pise un StatusUpdated (sent). */
export function mergeDeliveryStatus(
  current?: string | null,
  incoming?: string | null
): string | null | undefined {
  if (!incoming) return current
  if (!current) return incoming
  if (incoming === 'failed') return 'failed'
  if (current === 'failed') return current
  const curRank = DELIVERY_STATUS_RANK[current] ?? -1
  const incRank = DELIVERY_STATUS_RANK[incoming] ?? -1
  return incRank >= curRank ? incoming : current
}

export function mergeWaInboxMessage(prev: WaInboxMessage, incoming: WaInboxMessage): WaInboxMessage {
  const id = waMessageNumericId(incoming.id)
  return {
    ...prev,
    ...incoming,
    id,
    delivery_status:
      mergeDeliveryStatus(prev.delivery_status, incoming.delivery_status)
      ?? incoming.delivery_status
  }
}

export function sortMessagesChronologically(list: WaInboxMessage[]): WaInboxMessage[] {
  return [...list].sort((a, b) => {
    const ta = a.sent_at ? new Date(a.sent_at).getTime() : 0
    const tb = b.sent_at ? new Date(b.sent_at).getTime() : 0
    if (ta !== tb) return ta - tb
    return waMessageNumericId(a.id) - waMessageNumericId(b.id)
  })
}

export function mergeMessageLists(...sources: WaInboxMessage[][]): WaInboxMessage[] {
  const byId = new Map<number, WaInboxMessage>()
  for (const list of sources) {
    for (const m of list) {
      const id = waMessageNumericId(m.id)
      if (!id) continue
      const prev = byId.get(id)
      byId.set(id, prev ? mergeWaInboxMessage(prev, { ...m, id }) : { ...m, id })
    }
  }
  return sortMessagesChronologically(Array.from(byId.values()))
}
