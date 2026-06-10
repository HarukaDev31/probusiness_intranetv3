import {
  parseWaCopilotoConversationSlug,
  findConversationInList
} from '~/utils/waCopilotoRoute'
import type { WaCopilotoConversation } from '~/types/wa-copiloto'

export type CopilotoRouteScope = 'advisor' | 'equipo'

export function copilotoBasePath(scope: CopilotoRouteScope = 'advisor'): string {
  return scope === 'equipo' ? '/copiloto/equipo' : '/copiloto'
}

export function copilotoListPath(scope: CopilotoRouteScope = 'advisor'): string {
  return copilotoBasePath(scope)
}

export function copilotoPipelinePath(scope: CopilotoRouteScope = 'advisor'): string {
  return `${copilotoBasePath(scope)}/pipeline`
}

export function copilotoConversationPath(
  scope: CopilotoRouteScope,
  conversationId: number
): string {
  return `${copilotoBasePath(scope)}/${conversationId}`
}

export function copilotoScopeFromPath(path: string): CopilotoRouteScope {
  return path.startsWith('/copiloto/equipo') ? 'equipo' : 'advisor'
}

export function copilotoIsPipelinePath(path: string, scope?: CopilotoRouteScope): boolean {
  const base = copilotoBasePath(scope ?? copilotoScopeFromPath(path))
  return path === copilotoPipelinePath(scope ?? copilotoScopeFromPath(path))
    || path === `${base}/pipeline`
}

export function copilotoRouteConversationSlug(route: {
  params: Record<string, string | string[] | undefined>
}): string | null {
  const idParam = route.params.id
  if (idParam) {
    const raw = Array.isArray(idParam) ? idParam[0] : String(idParam)
    const trimmed = raw?.trim()
    if (trimmed && trimmed !== 'pipeline') return trimmed
  }

  const legacy = route.params.conversation
  if (legacy) {
    const raw = Array.isArray(legacy) ? legacy[0] : String(legacy)
    const trimmed = raw?.trim()
    if (trimmed && trimmed !== 'pipeline') return trimmed
  }

  return null
}

export function copilotoConversationIdFromSlug(
  slug: string,
  conversations: WaCopilotoConversation[] = []
): number | null {
  const parsed = parseWaCopilotoConversationSlug(slug)
  if (!parsed) return null
  if (parsed.kind === 'id') return parsed.id
  const byPhone = findConversationInList(conversations, parsed)
  if (byPhone) return byPhone.id
  const digits = slug.replace(/\D+/g, '')
  const asId = parseInt(digits, 10)
  if (asId > 0) {
    const byId = conversations.find((c) => c.id === asId)
    if (byId) return byId.id
  }
  return null
}
