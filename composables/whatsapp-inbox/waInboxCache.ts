import type {
  WaInboxAssignableUser,
  WaInboxConversation,
  WaInboxMessage,
  WaInboxSession,
  WaInboxTemplate
} from '~/types/whatsapp-inbox'

const TTL = {
  session: 10 * 60 * 1000,
  templates: 60 * 60 * 1000,
  assignable: 10 * 60 * 1000,
  conversations: 45 * 1000,
  messages: 90 * 1000
} as const

type MessagesCacheEntry = {
  messages: WaInboxMessage[]
  conversationPatch?: Partial<WaInboxConversation>
  fetchedAt: number
}

const cache = reactive({
  session: null as WaInboxSession | null,
  sessionAt: 0,
  templates: [] as WaInboxTemplate[],
  templatesAt: 0,
  assignable: [] as WaInboxAssignableUser[],
  assignableAt: 0,
  allConversations: [] as WaInboxConversation[],
  conversationsAt: 0,
  messagesByConvId: {} as Record<number, MessagesCacheEntry>
})

function isFresh(fetchedAt: number, ttl: number) {
  return fetchedAt > 0 && Date.now() - fetchedAt < ttl
}

export function useWaInboxCache() {
  function getSession() {
    if (!isFresh(cache.sessionAt, TTL.session)) return null
    return cache.session
  }

  function setSession(data: WaInboxSession | null) {
    cache.session = data
    cache.sessionAt = data ? Date.now() : 0
  }

  function getTemplates() {
    if (!isFresh(cache.templatesAt, TTL.templates)) return null
    return cache.templates
  }

  function setTemplates(data: WaInboxTemplate[]) {
    cache.templates = data
    cache.templatesAt = Date.now()
  }

  function getAssignable() {
    if (!isFresh(cache.assignableAt, TTL.assignable)) return null
    return cache.assignable
  }

  function setAssignable(data: WaInboxAssignableUser[]) {
    cache.assignable = data
    cache.assignableAt = Date.now()
  }

  function getAllConversations() {
    if (!isFresh(cache.conversationsAt, TTL.conversations)) return null
    return cache.allConversations
  }

  function setAllConversations(data: WaInboxConversation[]) {
    cache.allConversations = data
    cache.conversationsAt = Date.now()
  }

  function patchConversation(id: number, patch: Partial<WaInboxConversation>) {
    const idx = cache.allConversations.findIndex((c) => c.id === id)
    if (idx >= 0) {
      cache.allConversations[idx] = { ...cache.allConversations[idx], ...patch }
    }
  }

  function getMessages(conversationId: number) {
    const entry = cache.messagesByConvId[conversationId]
    if (!entry || !isFresh(entry.fetchedAt, TTL.messages)) return null
    return entry
  }

  function setMessages(
    conversationId: number,
    messages: WaInboxMessage[],
    conversationPatch?: Partial<WaInboxConversation>
  ) {
    cache.messagesByConvId[conversationId] = {
      messages,
      conversationPatch,
      fetchedAt: Date.now()
    }
  }

  function invalidateConversations() {
    cache.conversationsAt = 0
  }

  function invalidateMessages(conversationId?: number) {
    if (conversationId != null) {
      delete cache.messagesByConvId[conversationId]
      return
    }
    cache.messagesByConvId = {}
  }

  function invalidateAll() {
    cache.session = null
    cache.sessionAt = 0
    cache.templates = []
    cache.templatesAt = 0
    cache.assignable = []
    cache.assignableAt = 0
    cache.allConversations = []
    cache.conversationsAt = 0
    cache.messagesByConvId = {}
  }

  return {
    TTL,
    getSession,
    setSession,
    getTemplates,
    setTemplates,
    getAssignable,
    setAssignable,
    getAllConversations,
    setAllConversations,
    patchConversation,
    getMessages,
    setMessages,
    invalidateConversations,
    invalidateMessages,
    invalidateAll
  }
}
