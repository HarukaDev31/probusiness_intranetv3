import type {
  WaCopilotoAssignableUser,
  WaCopilotoConversation,
  WaCopilotoMessage,
  WaCopilotoSession,
  WaCopilotoTemplate
} from '~/types/wa-copiloto'

const TTL = {
  session: 10 * 60 * 1000,
  templates: 60 * 60 * 1000,
  assignable: 10 * 60 * 1000,
  conversations: 45 * 1000,
  messages: 90 * 1000
} as const

type MessagesCacheEntry = {
  messages: WaCopilotoMessage[]
  conversationPatch?: Partial<WaCopilotoConversation>
  fetchedAt: number
  /** false = caché parcial por WS; al abrir el chat hay que pedir GET historial */
  fullHistory?: boolean
}

const cache = reactive({
  session: null as WaCopilotoSession | null,
  sessionAt: 0,
  templates: [] as WaCopilotoTemplate[],
  templatesAt: 0,
  templatesSessionSlug: '' as string,
  assignable: [] as WaCopilotoAssignableUser[],
  assignableAt: 0,
  allConversations: [] as WaCopilotoConversation[],
  conversationsAt: 0,
  messagesByConvId: {} as Record<number, MessagesCacheEntry>
})

function isFresh(fetchedAt: number, ttl: number) {
  return fetchedAt > 0 && Date.now() - fetchedAt < ttl
}

function sortConversationsList(list: WaCopilotoConversation[]) {
  return [...list].sort((a, b) => {
    const ta = a.last_message_at ? new Date(a.last_message_at).getTime() : 0
    const tb = b.last_message_at ? new Date(b.last_message_at).getTime() : 0
    if (tb !== ta) return tb - ta
    return b.id - a.id
  })
}

export function useWaCopilotoCache() {
  function getSession() {
    if (!isFresh(cache.sessionAt, TTL.session)) return null
    return cache.session
  }

  function setSession(data: WaCopilotoSession | null) {
    cache.session = data
    cache.sessionAt = data ? Date.now() : 0
  }

  function getTemplates(sessionSlug?: string) {
    const slug = (sessionSlug ?? cache.session?.slug ?? '').trim()
    if (!isFresh(cache.templatesAt, TTL.templates)) return null
    if (slug && cache.templatesSessionSlug !== slug) return null
    return cache.templates
  }

  function setTemplates(data: WaCopilotoTemplate[], sessionSlug?: string) {
    cache.templates = data
    cache.templatesAt = Date.now()
    cache.templatesSessionSlug = (sessionSlug ?? cache.session?.slug ?? '').trim()
  }

  function getAssignable() {
    if (!isFresh(cache.assignableAt, TTL.assignable)) return null
    return cache.assignable
  }

  function setAssignable(data: WaCopilotoAssignableUser[]) {
    cache.assignable = data
    cache.assignableAt = Date.now()
  }

  function getAllConversations() {
    if (!isFresh(cache.conversationsAt, TTL.conversations)) return null
    return cache.allConversations
  }

  function setAllConversations(data: WaCopilotoConversation[]) {
    cache.allConversations = data
    cache.conversationsAt = Date.now()
  }

  function patchConversation(id: number, patch: Partial<WaCopilotoConversation>) {
    const idx = cache.allConversations.findIndex((c) => c.id === id)
    if (idx >= 0) {
      cache.allConversations[idx] = { ...cache.allConversations[idx], ...patch }
      cache.conversationsAt = Date.now()
    }
  }

  /** Actualiza lista global aunque el usuario no esté en la vista del inbox (WS). */
  function upsertConversation(conv: WaCopilotoConversation) {
    const idx = cache.allConversations.findIndex((c) => c.id === conv.id)
    if (idx >= 0) {
      cache.allConversations[idx] = { ...cache.allConversations[idx], ...conv }
    } else {
      cache.allConversations = [conv, ...cache.allConversations]
    }
    cache.allConversations = sortConversationsList(cache.allConversations)
    cache.conversationsAt = Date.now()
  }

  function getConversationsSnapshot(): WaCopilotoConversation[] {
    return cache.allConversations
  }

  function appendMessage(conversationId: number, message: WaCopilotoMessage) {
    const entry = cache.messagesByConvId[conversationId]
    if (!entry) return
    if (entry.messages.some((m) => m.id === message.id)) return
    entry.messages = [...entry.messages, message]
    entry.fetchedAt = Date.now()
  }

  function getMessages(conversationId: number) {
    const entry = cache.messagesByConvId[conversationId]
    if (!entry || !isFresh(entry.fetchedAt, TTL.messages)) return null
    return entry
  }

  /** Mensajes en caché sin TTL (sincronización WS con chat abierto). */
  function getMessagesEntry(conversationId: number) {
    return cache.messagesByConvId[conversationId] ?? null
  }

  function setMessages(
    conversationId: number,
    messages: WaCopilotoMessage[],
    conversationPatch?: Partial<WaCopilotoConversation>,
    options?: { fullHistory?: boolean }
  ) {
    const prev = cache.messagesByConvId[conversationId]
    const fullHistory =
      options?.fullHistory !== undefined
        ? options.fullHistory
        : (prev?.fullHistory ?? true)

    cache.messagesByConvId[conversationId] = {
      messages,
      conversationPatch: conversationPatch ?? prev?.conversationPatch,
      fetchedAt: Date.now(),
      fullHistory
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
    cache.templatesSessionSlug = ''
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
    getConversationsSnapshot,
    patchConversation,
    upsertConversation,
    appendMessage,
    getMessages,
    getMessagesEntry,
    setMessages,
    invalidateConversations,
    invalidateMessages,
    invalidateAll
  }
}
