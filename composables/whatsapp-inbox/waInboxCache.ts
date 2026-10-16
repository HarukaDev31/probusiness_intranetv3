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
  /** false = caché parcial por WS; al abrir el chat hay que pedir GET historial */
  fullHistory?: boolean
  /** Total reportado por la API al cargar historial completo */
  messageTotal?: number
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
  /** Solo es true tras un GET de la lista. Un chat suelto (otro rol) no cuenta como bandeja. */
  conversationsReady: false,
  messagesByConvId: {} as Record<number, MessagesCacheEntry>
})

let ownerId = ''
let authBound = false

function readUserId(): string {
  if (!import.meta.client) return ''
  try {
    const raw = localStorage.getItem('auth_user')
    if (!raw) return ''
    const user = JSON.parse(raw) as { id?: number | string; raw?: { ID_Usuario?: number; id?: number } }
    const id = user?.id ?? user?.raw?.ID_Usuario ?? user?.raw?.id
    return id == null || id === '' ? '' : String(id)
  } catch {
    return ''
  }
}

function wipeCache() {
  cache.session = null
  cache.sessionAt = 0
  cache.templates = []
  cache.templatesAt = 0
  cache.assignable = []
  cache.assignableAt = 0
  cache.allConversations = []
  cache.conversationsAt = 0
  cache.conversationsReady = false
  cache.messagesByConvId = {}
}

function ensureOwner() {
  const next = readUserId()
  if (next === ownerId) return
  ownerId = next
  wipeCache()
}

function isFresh(fetchedAt: number, ttl: number) {
  return fetchedAt > 0 && Date.now() - fetchedAt < ttl
}

function sortConversationsList(list: WaInboxConversation[]) {
  return [...list].sort((a, b) => {
    const ta = a.last_message_at ? new Date(a.last_message_at).getTime() : 0
    const tb = b.last_message_at ? new Date(b.last_message_at).getTime() : 0
    if (tb !== ta) return tb - ta
    return b.id - a.id
  })
}

export function useWaInboxCache() {
  if (import.meta.client && !authBound) {
    authBound = true
    window.addEventListener('auth-login', () => invalidateAll())
    window.addEventListener('auth-logout', () => invalidateAll())
  }

  function captureOwner() {
    ensureOwner()
    return ownerId
  }

  function isCurrentOwner(owner: string) {
    return readUserId() === owner
  }

  function getSession() {
    ensureOwner()
    if (!isFresh(cache.sessionAt, TTL.session)) return null
    return cache.session
  }

  function setSession(data: WaInboxSession | null) {
    ensureOwner()
    cache.session = data
    cache.sessionAt = data ? Date.now() : 0
  }

  function getTemplates() {
    ensureOwner()
    if (!isFresh(cache.templatesAt, TTL.templates)) return null
    return cache.templates
  }

  function setTemplates(data: WaInboxTemplate[]) {
    ensureOwner()
    cache.templates = data
    cache.templatesAt = Date.now()
  }

  function getAssignable() {
    ensureOwner()
    if (!isFresh(cache.assignableAt, TTL.assignable)) return null
    return cache.assignable
  }

  function setAssignable(data: WaInboxAssignableUser[]) {
    ensureOwner()
    cache.assignable = data
    cache.assignableAt = Date.now()
  }

  function getAllConversations() {
    ensureOwner()
    if (!cache.conversationsReady || !isFresh(cache.conversationsAt, TTL.conversations)) return null
    return cache.allConversations
  }

  /** Lista ya pedida a la API para este usuario, aunque el TTL haya vencido. */
  function peekConversations() {
    ensureOwner()
    if (!cache.conversationsReady) return null
    return cache.allConversations
  }

  function setAllConversations(data: WaInboxConversation[]) {
    ensureOwner()
    cache.allConversations = data
    cache.conversationsAt = Date.now()
    cache.conversationsReady = true
  }

  function patchConversation(id: number, patch: Partial<WaInboxConversation>) {
    ensureOwner()
    const idx = cache.allConversations.findIndex((c) => c.id === id)
    if (idx >= 0) {
      cache.allConversations[idx] = { ...cache.allConversations[idx], ...patch }
      if (cache.conversationsReady) cache.conversationsAt = Date.now()
    }
  }

  /** Actualiza lista global aunque el usuario no esté en la vista del inbox (WS). */
  function upsertConversation(conv: WaInboxConversation) {
    ensureOwner()
    const idx = cache.allConversations.findIndex((c) => c.id === conv.id)
    if (idx >= 0) {
      cache.allConversations[idx] = { ...cache.allConversations[idx], ...conv }
    } else {
      cache.allConversations = [conv, ...cache.allConversations]
    }
    cache.allConversations = sortConversationsList(cache.allConversations)
    if (cache.conversationsReady) cache.conversationsAt = Date.now()
  }

  function getConversationsSnapshot(): WaInboxConversation[] {
    ensureOwner()
    return cache.allConversations
  }

  function appendMessage(conversationId: number, message: WaInboxMessage) {
    const entry = cache.messagesByConvId[conversationId]
    if (!entry) return
    if (entry.messages.some((m) => m.id === message.id)) return
    entry.messages = [...entry.messages, message]
    entry.fetchedAt = Date.now()
  }

  function getMessages(conversationId: number) {
    ensureOwner()
    const entry = cache.messagesByConvId[conversationId]
    if (!entry || !isFresh(entry.fetchedAt, TTL.messages)) return null
    return entry
  }

  /** Mensajes en caché sin TTL (sincronización WS con chat abierto). */
  function getMessagesEntry(conversationId: number) {
    ensureOwner()
    return cache.messagesByConvId[conversationId] ?? null
  }

  function setMessages(
    conversationId: number,
    messages: WaInboxMessage[],
    conversationPatch?: Partial<WaInboxConversation>,
    options?: { fullHistory?: boolean; messageTotal?: number }
  ) {
    ensureOwner()
    const prev = cache.messagesByConvId[conversationId]
    const fullHistory =
      options?.fullHistory !== undefined
        ? options.fullHistory
        : (prev?.fullHistory ?? true)
    const messageTotal =
      options?.messageTotal !== undefined
        ? options.messageTotal
        : prev?.messageTotal

    cache.messagesByConvId[conversationId] = {
      messages,
      conversationPatch: conversationPatch ?? prev?.conversationPatch,
      fetchedAt: Date.now(),
      fullHistory,
      messageTotal
    }
  }

  function invalidateConversations() {
    ensureOwner()
    cache.conversationsAt = 0
    cache.conversationsReady = false
  }

  function invalidateMessages(conversationId?: number) {
    if (conversationId != null) {
      delete cache.messagesByConvId[conversationId]
      return
    }
    cache.messagesByConvId = {}
  }

  function invalidateAll() {
    ownerId = ''
    wipeCache()
  }

  return {
    TTL,
    captureOwner,
    isCurrentOwner,
    getSession,
    setSession,
    getTemplates,
    setTemplates,
    getAssignable,
    setAssignable,
    getAllConversations,
    peekConversations,
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
