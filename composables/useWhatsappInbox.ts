import { WhatsappInboxService } from '~/services/whatsappInbox/whatsappInboxService'
import { useWaInboxCache } from '~/composables/whatsapp-inbox/waInboxCache'
import { useWaInboxWebSocket } from '~/composables/whatsapp-inbox/useWaInboxWebSocket'
import type {
  WaInboxWsMessageCreatedPayload,
  WaInboxWsMessageStatusPayload
} from '~/types/whatsapp-inbox-ws'
import type {
  WaInboxConversation,
  WaInboxFilter,
  WaInboxMessage,
  WaInboxSession,
  WaInboxTemplate,
  WaInboxAssignableUser,
  WaInboxComposerSendPayload
} from '~/types/whatsapp-inbox'
import { useSpinner } from '~/composables/commons/useSpinner'
import { useModal } from '~/composables/commons/useModal'
import { useUserRole } from '~/composables/auth/useUserRole'
import { formatDatePe } from '~/utils/formatters'
import {
  findConversationInList,
  parseWaInboxConversationSlug,
  waInboxConversationPath
} from '~/utils/whatsappInboxRoute'
import {
  mergeWaInboxMessage,
  mergeMessageLists,
  waMessageNumericId
} from '~/composables/whatsapp-inbox/waInboxMessageUtils'
import {
  setWaInboxViewingConversationId,
  getWaInboxViewingConversationId,
  mergeWaInboxStatusIntoMessage,
  resolveWaInboxDeliveryStatus
} from '~/composables/whatsapp-inbox/waInboxRealtimeSync'
import { registerWaInboxUiHandlers, getWaInboxUiHandlers } from '~/composables/whatsapp-inbox/waInboxUiBridge'
import { ensureWaInboxEchoChannel } from '~/composables/whatsapp-inbox/ensureWaInboxEchoChannel'
import { bindWaInboxLiveHandlers, getWaInboxLiveHandlers } from '~/composables/whatsapp-inbox/waInboxLiveBridge'
import {
  exposeWaInboxWsDiagnostics,
  waInboxLog,
  waInboxTrace,
  waInboxWarn
} from '~/composables/whatsapp-inbox/waInboxWsLog'
import { getEchoInstance } from '~/composables/websocket/useEcho'
import { WA_INBOX_WS_CHANNEL } from '~/constants/whatsappInboxWs'

const CONVERSATIONS_PER_PAGE = 30
const WA_INBOX_BASE_PATH = '/coordinacion/whatsapp-inbox'

/** Evita peticiones duplicadas en paralelo (varios watchers / init / select). */
const inflight = {
  session: null as Promise<void> | null,
  templates: null as Promise<void> | null,
  assignable: null as Promise<void> | null,
  conversationsKey: '' as string,
  conversations: null as Promise<void> | null,
  messages: new Map<number, Promise<void>>()
}

/** Cola de selección: evita carreras entre clics rápidos (URL / mensajes desincronizados). */
let selectConversationChain: Promise<void> = Promise.resolve()
let selectConversationGeneration = 0

/** PATCH /read agrupado; no dispara recargas de UI. */
const markReadDebounce = new Map<number, ReturnType<typeof setTimeout>>()

function scheduleMarkReadApi(conversationId: number) {
  const prev = markReadDebounce.get(conversationId)
  if (prev) clearTimeout(prev)
  markReadDebounce.set(
    conversationId,
    setTimeout(() => {
      markReadDebounce.delete(conversationId)
      WhatsappInboxService.markRead(conversationId).catch(() => {})
    }, 400)
  )
}

function clearMarkReadDebounce() {
  for (const t of markReadDebounce.values()) clearTimeout(t)
  markReadDebounce.clear()
}

export function useWhatsappInbox() {
  const route = useRoute()
  const router = useRouter()
  const { withSpinner } = useSpinner()
  const { showError, showSuccess } = useModal()
  const { currentId } = useUserRole()
  const cache = useWaInboxCache()
  const waInboxWs = useWaInboxWebSocket()

  const session = ref<WaInboxSession | null>(null)
  const allConversations = ref<WaInboxConversation[]>([])
  const messages = ref<WaInboxMessage[]>([])
  const templates = ref<WaInboxTemplate[]>([])
  const assignableUsers = ref<WaInboxAssignableUser[]>([])

  const selectedConversationId = ref<number | null>(null)
  /** Conversación a la que corresponde `messages` (evita mostrar otro chat tras cargas en paralelo). */
  const messagesConversationId = ref<number | null>(null)
  const search = ref('')
  const filter = ref<WaInboxFilter>('todas')
  const sendingMessage = ref(false)
  const loadingConversations = ref(false)
  const loadingMessages = ref(false)
  const loadingTemplates = ref(false)
  const refreshing = ref(false)
  const savingNewContact = ref(false)
  const loadingMoreConversations = ref(false)
  const error = ref<string | null>(null)

  const conversationsPagination = ref({
    current_page: 1,
    last_page: 1,
    per_page: CONVERSATIONS_PER_PAGE,
    total: 0
  })

  const authUserId = computed(() => Number(currentId.value) || 0)

  const conversations = computed(() => allConversations.value)

  const conversationsHasMore = computed(
    () => conversationsPagination.value.current_page < conversationsPagination.value.last_page
  )

  const selectedConversation = computed(() =>
    allConversations.value.find((c) => c.id === selectedConversationId.value)
    ?? conversations.value.find((c) => c.id === selectedConversationId.value)
    ?? null
  )

  const unreadTotal = computed(() =>
    allConversations.value.reduce((sum, c) => sum + (c.unread_count || 0), 0)
  )

  function hydrateFromCache() {
    const cachedSession = cache.getSession()
    if (cachedSession) session.value = cachedSession

    const cachedTemplates = cache.getTemplates()
    if (cachedTemplates) templates.value = cachedTemplates

    const cachedAssignable = cache.getAssignable()
    if (cachedAssignable) assignableUsers.value = cachedAssignable

    const cachedConvs = cache.getAllConversations() ?? cache.getConversationsSnapshot()
    if (cachedConvs.length > 0) {
      allConversations.value = [...cachedConvs]
      ensureSelectedConversation()
    }
  }

  function sortConversationsList(list: WaInboxConversation[]) {
    return [...list].sort((a, b) => {
      const ta = a.last_message_at ? new Date(a.last_message_at).getTime() : 0
      const tb = b.last_message_at ? new Date(b.last_message_at).getTime() : 0
      if (tb !== ta) return tb - ta
      return b.id - a.id
    })
  }

  function upsertConversation(conv: WaInboxConversation) {
    const idx = allConversations.value.findIndex((c) => c.id === conv.id)
    if (idx >= 0) {
      allConversations.value[idx] = { ...allConversations.value[idx], ...conv }
    } else {
      allConversations.value = [conv, ...allConversations.value]
    }
    allConversations.value = sortConversationsList(allConversations.value)
    cache.setAllConversations(allConversations.value)
  }

  function syncConversationsFromStore() {
    const snap = cache.getConversationsSnapshot()
    if (snap.length > 0) {
      allConversations.value = [...snap]
    }
  }

  function syncOpenMessagesFromStore(convId: number) {
    if (selectedConversationId.value !== convId) return
    const entry = cache.getMessagesEntry(convId)
    if (!entry) return
    messages.value = [...entry.messages]
    messagesConversationId.value = convId
  }

  function findMessageIndex(list: WaInboxMessage[], messageId: unknown): number {
    const id = waMessageNumericId(messageId)
    if (!id) return -1
    return list.findIndex((m) => waMessageNumericId(m.id) === id)
  }

  function syncMessagesCacheForConversation(convId: number) {
    const cached = cache.getMessagesEntry(convId)
    cache.setMessages(convId, messages.value, cached?.conversationPatch, {
      fullHistory: cached?.fullHistory !== false
    })
  }

  function upsertMessageInConversation(convId: number, msg: WaInboxMessage) {
    const msgId = waMessageNumericId(msg.id)
    if (!msgId) return

    if (selectedConversationId.value === convId) {
      const idx = findMessageIndex(messages.value, msgId)
      const next = [...messages.value]
      if (idx >= 0) {
        next[idx] = mergeWaInboxMessage(next[idx], { ...msg, id: msgId })
      } else {
        next.push({ ...msg, id: msgId })
      }
      messages.value = next
      messagesConversationId.value = convId
      syncMessagesCacheForConversation(convId)
    } else {
      const cached = cache.getMessages(convId)
      if (cached) {
        const mi = findMessageIndex(cached.messages, msgId)
        const list = [...cached.messages]
        if (mi >= 0) {
          list[mi] = mergeWaInboxMessage(list[mi], { ...msg, id: msgId })
        } else {
          list.push({ ...msg, id: msgId })
        }
        cache.setMessages(convId, list, cached.conversationPatch, {
          fullHistory: cached?.fullHistory !== false
        })
      } else {
        cache.setMessages(convId, [{ ...msg, id: msgId }], undefined, {
          fullHistory: false
        })
      }
    }
  }

  function applyRealtimeMessage(payload: WaInboxWsMessageCreatedPayload) {
    const convId = Number(payload.conversation_id)
    if (!convId) return

    waInboxLog('ui.messageCreated', {
      convId,
      selected: selectedConversationId.value,
      messagesConv: messagesConversationId.value,
      direction: payload.message?.direction
    })

    // La caché ya tiene unread/preview correctos (applyMessageCreatedToStore); no pisar con payload.conversation crudo.
    syncConversationsFromStore()

    const msg = payload.message
    if (!waMessageNumericId(msg?.id)) return

    if (
      selectedConversationId.value === convId
      && messagesConversationId.value !== convId
    ) {
      hydrateMessagesFromCache(convId)
    }

    upsertMessageInConversation(convId, msg as WaInboxMessage)

    if (selectedConversationId.value === convId && msg?.direction === 'in') {
      markConversationRead(convId, { forceServer: true })
    }

    waInboxLog('ui.messageCreated.done', {
      convId,
      listLen: allConversations.value.length,
      openMessages: messages.value.length
    })
  }

  function applyRealtimeStatus(payload: WaInboxWsMessageStatusPayload) {
    const convId = Number(payload.conversation_id)
    const messageId = waMessageNumericId(payload.message_id)
    if (!convId || !messageId) return

    const incomingStatus = resolveWaInboxDeliveryStatus(payload)
    if (!incomingStatus) return

    waInboxLog('ui.statusUpdated', {
      convId,
      messageId,
      status: incomingStatus,
      selected: selectedConversationId.value
    })

    syncConversationsFromStore()

    if (selectedConversationId.value === convId) {
      if (messagesConversationId.value === convId) {
        const idx = findMessageIndex(messages.value, messageId)
        if (idx >= 0) {
          const list = [...messages.value]
          list[idx] = mergeWaInboxStatusIntoMessage(list[idx], payload, incomingStatus)
          messages.value = list
          syncMessagesCacheForConversation(convId)
        } else {
          syncOpenMessagesFromStore(convId)
        }
      } else {
        syncOpenMessagesFromStore(convId)
      }
      const merged = messages.value.find((m) => waMessageNumericId(m.id) === messageId)
      if (merged?.delivery_status === 'failed') {
        showError(
          'No llegó a WhatsApp',
          merged.failed_reason || 'Meta rechazó la entrega. Revisa tamaño o formato del archivo.'
        )
      }
    }
  }

  function getRouteConversationSlug(): string | null {
    const p = route.params.conversation
    if (!p) return null
    const raw = Array.isArray(p) ? p[0] : String(p)
    return raw?.trim() ? raw.trim() : null
  }

  function normalizeConversationId(id: unknown): number | null {
    const n = Number(id)
    return Number.isFinite(n) && n > 0 ? Math.trunc(n) : null
  }

  function isRouteOnConversation(convId: number): boolean {
    const slug = getRouteConversationSlug()
    if (!slug) return false
    const parsed = parseWaInboxConversationSlug(slug)
    if (!parsed) return false
    if (parsed.kind === 'id') return parsed.id === convId
    const conv = allConversations.value.find((c) => c.id === convId)
    return Boolean(conv?.phone_e164 === parsed.phoneE164)
  }

  async function navigateToConversation(convId: number) {
    const target = waInboxConversationPath(convId)
    const slug = String(convId)
    if (route.path === target && getRouteConversationSlug() === slug) {
      waInboxLog('navigate.skip', { convId, target })
      return
    }
    try {
      await router.replace(target)
      await nextTick()
      waInboxLog('navigate.ok', {
        convId,
        target,
        path: route.path,
        slug: getRouteConversationSlug()
      })
    } catch (err) {
      try {
        await navigateTo(target, { replace: true })
        await nextTick()
        waInboxLog('navigate.ok.fallback', { convId, target, path: route.path })
      } catch (fallbackErr) {
        waInboxWarn('navigate.failed', {
          convId,
          target,
          err: String(err),
          fallback: String(fallbackErr)
        })
      }
    }
  }

  function conversationIdFromSlug(slug: string): number | null {
    const parsed = parseWaInboxConversationSlug(slug)
    if (!parsed) return null
    if (parsed.kind === 'id') return parsed.id
    const byPhone = findConversationInList(allConversations.value, parsed)
    if (byPhone) return byPhone.id
    const digits = slug.replace(/\D+/g, '')
    const asId = parseInt(digits, 10)
    if (asId > 0) {
      const byId = allConversations.value.find((c) => c.id === asId)
      if (byId) return byId.id
    }
    return null
  }

  function isMessagesHydrated(conversationId: number, candidate: WaInboxMessage[]) {
    if (selectedConversationId.value !== conversationId) return false
    if (messagesConversationId.value !== conversationId) return false
    if (messages.value.length !== candidate.length) return false
    if (candidate.length === 0) return true
    const curLast = messages.value[messages.value.length - 1]
    const candLast = candidate[candidate.length - 1]
    return waMessageNumericId(curLast?.id) === waMessageNumericId(candLast?.id)
  }

  function applyMessagesForConversation(conversationId: number, list: WaInboxMessage[]) {
    if (selectedConversationId.value !== conversationId) return
    if (isMessagesHydrated(conversationId, list)) {
      messagesConversationId.value = conversationId
      return
    }
    messages.value = list
    messagesConversationId.value = conversationId
  }

  function hydrateMessagesFromCache(conversationId: number) {
    const entry = cache.getMessagesEntry(conversationId)
    if (entry?.fullHistory !== false && entry.messages.length > 0) {
      applyMessagesForConversation(conversationId, entry.messages)
      return
    }
    if (selectedConversationId.value === conversationId) {
      messages.value = []
      messagesConversationId.value = null
    }
  }

  function ensureSelectedConversation() {
    if (getRouteConversationSlug()) return

    const list = conversations.value
    if (!list.length) {
      selectedConversationId.value = null
      messages.value = []
      messagesConversationId.value = null
      return
    }
    const still = selectedConversationId.value
      && list.some((c) => c.id === selectedConversationId.value)
    if (!still) {
      selectedConversationId.value = list[0].id
    }
  }

  let resolveRouteChain: Promise<void> = Promise.resolve()

  async function resolveRouteConversation(explicitSlug?: string) {
    const slug = explicitSlug ?? getRouteConversationSlug()
    if (!slug) return

    const parsed = parseWaInboxConversationSlug(slug)
    if (!parsed) {
      showError('Enlace no válido', 'No se reconoce este chat.')
      await router.replace(WA_INBOX_BASE_PATH)
      return
    }

    const run = async () => {
      let conv = findConversationInList(allConversations.value, parsed)

      if (!conv && parsed.kind === 'id') {
        try {
          const res = await WhatsappInboxService.getMessages(parsed.id, { per_page: 1 })
          if (res?.conversation) {
            conv = res.conversation as WaInboxConversation
            upsertConversation(conv)
          }
        } catch {
          conv = undefined
        }
      }

      if (!conv && parsed.kind === 'phone') {
        try {
          const res = await WhatsappInboxService.getConversations({
            filter: filter.value,
            search: parsed.phoneE164,
            per_page: 20,
            page: 1
          })
          const rows = Array.isArray(res?.data) ? res.data : []
          conv = rows.find((c: WaInboxConversation) => c.phone_e164 === parsed.phoneE164)
          if (conv) upsertConversation(conv)
        } catch {
          conv = undefined
        }
      }

      if (!conv) {
        showError('Chat no encontrado', 'Este número o conversación no está en el inbox.')
        selectedConversationId.value = null
        messages.value = []
        messagesConversationId.value = null
        await router.replace(WA_INBOX_BASE_PATH)
        return
      }

      const canonicalPath = waInboxConversationPath(conv.id)
      const needsCanonicalUrl =
        parsed.kind === 'phone' || slug !== String(conv.id)

      if (selectedConversationId.value !== conv.id) {
        await selectConversation(conv.id, { skipRoute: true })
      } else if (messagesConversationId.value !== conv.id) {
        await loadMessages(conv.id)
      }

      if (needsCanonicalUrl && route.path !== canonicalPath) {
        await router.replace(canonicalPath)
      }
    }

    resolveRouteChain = resolveRouteChain.then(run, run)
    await resolveRouteChain
  }

  async function syncConversationFromRoute() {
    const slug = getRouteConversationSlug()
    if (slug) {
      await resolveRouteConversation(slug)
      return
    }
    ensureSelectedConversation()
  }

  /**
   * Actualiza badge local y sincroniza servidor solo si hace falta.
   * forceServer: mensaje entrante con chat abierto (servidor puede tener unread > 0).
   */
  function markConversationRead(
    conversationId: number,
    options: { forceServer?: boolean } = {}
  ) {
    const idx = allConversations.value.findIndex((x) => x.id === conversationId)
    const hadUnread = idx >= 0 && (allConversations.value[idx].unread_count || 0) > 0

    if (hadUnread && idx >= 0) {
      allConversations.value[idx] = {
        ...allConversations.value[idx],
        unread_count: 0
      }
      cache.patchConversation(conversationId, { unread_count: 0 })
    }

    if (!options.forceServer && !hadUnread) return

    scheduleMarkReadApi(conversationId)
  }

  async function loadSession(options: { background?: boolean; force?: boolean } = {}) {
    const cached = !options.force ? cache.getSession() : null
    if (cached) {
      session.value = cached
      if (!options.force) return
    }

    if (inflight.session && !options.force) {
      await inflight.session
      return
    }

    const run = async () => {
      const res = await WhatsappInboxService.getSession()
      session.value = res?.data ?? null
      cache.setSession(session.value)
    }

    inflight.session = run().then(() => undefined).finally(() => {
      inflight.session = null
    })
    await inflight.session
  }

  async function loadConversations(
    options: { page?: number; append?: boolean; background?: boolean; force?: boolean } = {}
  ) {
    const page = options.page ?? 1
    const append = options.append ?? false
    const useCache = !options.force && !append && page === 1 && !search.value.trim()

    if (useCache) {
      const cached = cache.getAllConversations()
      if (cached) {
        allConversations.value = cached
        ensureSelectedConversation()
        if (!options.force) return
      }
    }

    const convKey = `${filter.value}|${search.value.trim()}|${page}|${append ? 1 : 0}`
    if (inflight.conversations && inflight.conversationsKey === convKey && !options.force) {
      await inflight.conversations
      return
    }

    if (append) {
      loadingMoreConversations.value = true
    } else if (!options.background) {
      loadingConversations.value = true
    } else {
      refreshing.value = true
    }
    error.value = null

    const fetchConversations = async () => {
      try {
        const res = await WhatsappInboxService.getConversations({
          filter: filter.value,
          search: search.value.trim() || undefined,
          per_page: CONVERSATIONS_PER_PAGE,
          page
        })
        const rows = Array.isArray(res?.data) ? res.data : []
        if (append) {
          const seen = new Set(allConversations.value.map((c) => c.id))
          const merged = [...allConversations.value]
          for (const row of rows) {
            if (!seen.has(row.id)) merged.push(row)
          }
          allConversations.value = sortConversationsList(merged)
        } else {
          allConversations.value = rows
        }

        if (res?.pagination) {
          conversationsPagination.value = {
            current_page: Number(res.pagination.current_page) || page,
            last_page: Number(res.pagination.last_page) || 1,
            per_page: Number(res.pagination.per_page) || CONVERSATIONS_PER_PAGE,
            total: Number(res.pagination.total) || rows.length
          }
        }

        if (page === 1 && !search.value.trim()) {
          cache.setAllConversations(allConversations.value)
        }
        ensureSelectedConversation()
      } catch (e: any) {
        if (!append) {
          if (!useCache || !cache.getAllConversations()) {
            error.value = e?.message || 'No se pudo cargar conversaciones'
            allConversations.value = []
          }
        }
      } finally {
        loadingConversations.value = false
        loadingMoreConversations.value = false
        refreshing.value = false
      }
    }

    inflight.conversationsKey = convKey
    inflight.conversations = fetchConversations().finally(() => {
      if (inflight.conversationsKey === convKey) {
        inflight.conversations = null
        inflight.conversationsKey = ''
      }
    })
    await inflight.conversations
  }

  async function loadAllConversations(options: { background?: boolean; force?: boolean } = {}) {
    await loadConversations({ page: 1, ...options })
  }

  async function loadMoreConversations() {
    if (loadingMoreConversations.value || loadingConversations.value) return
    if (!conversationsHasMore.value) return
    await loadConversations({
      page: conversationsPagination.value.current_page + 1,
      append: true,
      background: true
    })
  }

  async function loadMessages(
    conversationId: number,
    options: { background?: boolean; force?: boolean } = {}
  ) {
    const pending = inflight.messages.get(conversationId)
    if (pending && !options.force) {
      await pending
      if (selectedConversationId.value === conversationId && messagesConversationId.value !== conversationId) {
        hydrateMessagesFromCache(conversationId)
      }
      return
    }

    const run = async () => {
      const cachedEntry = !options.force ? cache.getMessages(conversationId) : null
      const hasFullHistoryCache =
        Boolean(cachedEntry && cachedEntry.fullHistory !== false)

      if (hasFullHistoryCache && cachedEntry) {
        const localList =
          selectedConversationId.value === conversationId
          && messagesConversationId.value === conversationId
            ? messages.value
            : []
        const mergedCached = mergeMessageLists(cachedEntry.messages, localList)
        const hadUnread =
          (allConversations.value.find((c) => c.id === conversationId)?.unread_count || 0) > 0
        applyMessagesForConversation(conversationId, mergedCached)
        if (cachedEntry.conversationPatch) {
          cache.patchConversation(conversationId, cachedEntry.conversationPatch)
          const idx = allConversations.value.findIndex((c) => c.id === conversationId)
          if (idx >= 0) {
            allConversations.value[idx] = {
              ...allConversations.value[idx],
              ...cachedEntry.conversationPatch
            }
          }
        }
        if (selectedConversationId.value === conversationId) {
          markConversationRead(conversationId, { forceServer: hadUnread })
        }
        if (!options.force) return
      }

      const stillSelected = () => selectedConversationId.value === conversationId
      if (stillSelected()) {
        loadingMessages.value = true
      }
      try {
        const res = await WhatsappInboxService.getMessages(conversationId, { per_page: 200 })
        const rows = Array.isArray(res?.data) ? res.data : []
        const convPatch = res?.conversation as Partial<WaInboxConversation> | undefined
        const cachedList = cache.getMessages(conversationId)?.messages ?? []
        const localList =
          selectedConversationId.value === conversationId
          && messagesConversationId.value === conversationId
            ? messages.value
            : []
        const merged = mergeMessageLists(rows, cachedList, localList)
        const hadUnread =
          (allConversations.value.find((c) => c.id === conversationId)?.unread_count || 0) > 0
        cache.setMessages(conversationId, merged, convPatch, { fullHistory: true })
        applyMessagesForConversation(conversationId, merged)
        if (convPatch) {
          cache.patchConversation(conversationId, convPatch)
          const idx = allConversations.value.findIndex((c) => c.id === conversationId)
          if (idx >= 0) {
            allConversations.value[idx] = { ...allConversations.value[idx], ...convPatch }
          }
        }
        if (stillSelected()) {
          markConversationRead(conversationId, { forceServer: hadUnread })
        }
      } catch (e: any) {
        if (!hasFullHistoryCache && stillSelected()) {
          showError('Error', e?.message || 'No se pudo cargar mensajes')
          messages.value = []
          messagesConversationId.value = null
        }
      } finally {
        loadingMessages.value = false
        syncConversationsFromStore()
      }
    }

    const task = run().finally(() => {
      inflight.messages.delete(conversationId)
    })
    inflight.messages.set(conversationId, task)
    await task
  }

  async function runSelectConversation(
    convId: number,
    options: { skipRoute?: boolean },
    generation: number
  ) {
    const prevId = selectedConversationId.value
    const switched = prevId !== convId

    waInboxLog('selectConversation.run', {
      id: convId,
      from: prevId,
      generation,
      skipRoute: options.skipRoute
    })

    if (!options.skipRoute && !isRouteOnConversation(convId)) {
      await navigateToConversation(convId)
    }

    if (generation !== selectConversationGeneration) {
      waInboxLog('selectConversation.staleAfterNav', { id: convId, generation })
      return
    }

    syncConversationsFromStore()
    selectedConversationId.value = convId
    setWaInboxViewingConversationId(convId)
    hydrateMessagesFromCache(convId)

    if (generation !== selectConversationGeneration) return

    waInboxLog('loadMessages.start', {
      convId,
      generation,
      messagesConv: messagesConversationId.value
    })

    await loadMessages(convId, {
      force: switched || messagesConversationId.value !== convId
    })

    if (generation !== selectConversationGeneration) return

    waInboxLog('loadMessages.done', {
      convId,
      generation,
      count: messages.value.length,
      messagesConv: messagesConversationId.value
    })

    syncConversationsFromStore()
    syncOpenMessagesFromStore(convId)
  }

  async function selectConversation(id: number, options: { skipRoute?: boolean } = {}) {
    const convId = normalizeConversationId(id)
    if (!convId) return

    const generation = ++selectConversationGeneration
    waInboxLog('selectConversation.enqueue', {
      id: convId,
      from: selectedConversationId.value,
      generation,
      skipRoute: options.skipRoute
    })

    const run = () => runSelectConversation(convId, options, generation)
    selectConversationChain = selectConversationChain.then(run, run)
    await selectConversationChain
  }

  function patchConversationAfterOutbound(
    conv: WaInboxConversation,
    preview: string,
    msg?: WaInboxMessage
  ) {
    const sentAt = msg?.sent_at ?? new Date().toISOString()
    upsertConversation({
      ...conv,
      last_message_preview: preview.slice(0, 200),
      last_message_at: sentAt,
      last_message_time_label: formatDatePe(sentAt) || msg?.time_label || ''
    })
  }

  async function sendComposerMessage(payload: WaInboxComposerSendPayload) {
    const conv = selectedConversation.value
    if (!conv) return
    if (!conv.can_send_text) {
      showError('Ventana cerrada', 'Solo puedes enviar plantillas mientras la ventana esté cerrada.')
      return
    }

    const text = payload.text.trim()
    if (!text && !payload.file) return

    sendingMessage.value = true
    try {
      const res = await WhatsappInboxService.sendMessage(conv.id, {
        message: text || undefined,
        file: payload.file,
        mediaKind: payload.mediaKind,
        replyToMetaMessageId: payload.replyToMetaMessageId
      })
      const msg = res?.data as WaInboxMessage | undefined
      if (waMessageNumericId(msg?.id)) {
        const outbound: WaInboxMessage = {
          ...msg!,
          delivery_status: msg!.delivery_status ?? 'pending'
        }
        upsertMessageInConversation(conv.id, outbound)
        const preview = text || msg!.body || `[${msg!.message_type || 'archivo'}]`
        patchConversationAfterOutbound(conv, preview, outbound)
      }
    } catch (e: any) {
      showError('Error', e?.message || 'No se pudo enviar el mensaje')
      throw e
    } finally {
      sendingMessage.value = false
    }
  }

  const sendingTemplate = ref(false)

  async function sendTemplateMessage(
    templateName: string,
    params: Record<string, string>,
    files: Record<string, File> = {},
    fileKinds: Record<string, string> = {}
  ) {
    const conv = selectedConversation.value
    if (!conv) return

    sendingTemplate.value = true
    try {
      const res = await WhatsappInboxService.sendTemplate(conv.id, {
        template_name: templateName,
        params,
        files,
        fileKinds
      }) as { success?: boolean; message?: string; data?: WaInboxMessage }

      if (res?.success === false) {
        throw new Error(res?.message || 'No se pudo enviar la plantilla')
      }

      const msg = res?.data
      if (!msg?.id) {
        throw new Error('Respuesta inválida del servidor')
      }

      if (msg.delivery_status === 'failed') {
        throw new Error(msg.failed_reason || 'La plantilla no se pudo enviar')
      }

      upsertMessageInConversation(conv.id, msg)
      patchConversationAfterOutbound(conv, msg.body || '[Template enviado]', msg)
      showSuccess('Plantilla enviada', 'Registrada en el chat. Si ves ✗ después, el archivo puede ser demasiado grande para WhatsApp.')
    } catch (e: any) {
      showError('Error', e?.message || 'No se pudo enviar la plantilla')
    } finally {
      sendingTemplate.value = false
    }
  }

  async function assignConversation(userId: number | null) {
    const conv = selectedConversation.value
    if (!conv) return

    await withSpinner(async () => {
      const res = await WhatsappInboxService.assign(conv.id, userId)
      if (res?.data) {
        const idx = allConversations.value.findIndex((c) => c.id === conv.id)
        if (idx >= 0) {
          allConversations.value[idx] = res.data
          cache.patchConversation(conv.id, res.data)
        }
      }
    }, 'Asignando…')
  }

  async function createManualContact(payload: {
    contact_name: string
    phone: string
    assigned_user_id?: number | null
  }) {
    savingNewContact.value = true
    try {
      await withSpinner(async () => {
        const res = await WhatsappInboxService.createConversation(payload)
        if (!res?.success || !res?.data) {
          throw new Error(res?.message || 'No se pudo registrar el contacto')
        }

        const conv = res.data as WaInboxConversation
        upsertConversation(conv)
        selectedConversationId.value = conv.id
        messages.value = []
        messagesConversationId.value = conv.id
        cache.setMessages(conv.id, [], conv)
        await router.replace(waInboxConversationPath(conv.id))
        await loadMessages(conv.id)

        const title = res.created === false ? 'Contacto existente' : 'Contacto agregado'
        const detail = res.message
          || (res.created === false
            ? 'Este número ya estaba en el inbox.'
            : 'Puedes enviar una plantilla para iniciar la conversación.')
        showSuccess(title, detail)
      }, 'Registrando contacto…')
    } catch (e: any) {
      showError('Error', e?.message || 'No se pudo registrar el contacto')
      throw e
    } finally {
      savingNewContact.value = false
    }
  }

  async function loadTemplates(options: { background?: boolean; force?: boolean } = {}) {
    const cached = !options.force ? cache.getTemplates() : null
    if (cached?.length) {
      templates.value = cached
      if (!options.force) return
    }

    if (inflight.templates && !options.force) {
      await inflight.templates
      return
    }

    if (!options.background) {
      loadingTemplates.value = true
    }

    const run = async () => {
      try {
        const res = await WhatsappInboxService.getTemplates()
        templates.value = Array.isArray(res?.data) ? res.data : []
        cache.setTemplates(templates.value)
      } catch {
        if (!cached?.length) {
          templates.value = []
        }
      } finally {
        loadingTemplates.value = false
      }
    }

    inflight.templates = run().then(() => undefined).finally(() => {
      inflight.templates = null
    })
    await inflight.templates
  }

  async function loadAssignableUsers(options: { background?: boolean; force?: boolean } = {}) {
    const cached = !options.force ? cache.getAssignable() : null
    if (cached) {
      assignableUsers.value = cached
      if (!options.force) return
    }

    if (inflight.assignable && !options.force) {
      await inflight.assignable
      return
    }

    const run = async () => {
      const res = await WhatsappInboxService.getAssignableUsers()
      assignableUsers.value = Array.isArray(res?.data) ? res.data : []
      cache.setAssignable(assignableUsers.value)
    }

    inflight.assignable = run().then(() => undefined).finally(() => {
      inflight.assignable = null
    })
    await inflight.assignable
  }

  const inboxRealtimeHandlers = {
    onMessageCreated: applyRealtimeMessage,
    onMessageStatusUpdated: applyRealtimeStatus
  }

  function connectWebSocket() {
    if (!import.meta.client) return

    ensureWaInboxEchoChannel()

    try {
      registerWaInboxUiHandlers(inboxRealtimeHandlers)
      bindWaInboxLiveHandlers(inboxRealtimeHandlers)
      waInboxWs.connect(inboxRealtimeHandlers)
      waInboxTrace('connect.ok', {
        path: route.path,
        selected: selectedConversationId.value,
        echo: Boolean(getEchoInstance()),
        uiHandlers: Boolean(getWaInboxUiHandlers()),
        liveHandlers: Boolean(getWaInboxLiveHandlers())
      })
    } catch (err) {
      waInboxWarn('connect.handlersFailed', { err: String(err) })
    }
  }

  function disconnectWebSocket() {
    waInboxLog('disconnect', { path: route.path })
    clearMarkReadDebounce()
    setWaInboxViewingConversationId(null)
    registerWaInboxUiHandlers(null)
    bindWaInboxLiveHandlers(null)
    waInboxWs.disconnect()
  }

  function isInboxRoute(path: string) {
    return path === WA_INBOX_BASE_PATH || path.startsWith(`${WA_INBOX_BASE_PATH}/`)
  }

  watch(selectedConversationId, (id) => {
    setWaInboxViewingConversationId(id)
  }, { immediate: true })

  if (import.meta.client) {
    waInboxTrace('inbox.composable.client', { path: route.path })

    exposeWaInboxWsDiagnostics(() => ({
      route: route.path,
      selectedConversationId: selectedConversationId.value,
      messagesConversationId: messagesConversationId.value,
      viewing: getWaInboxViewingConversationId(),
      echo: Boolean(getEchoInstance()),
      channel: WA_INBOX_WS_CHANNEL,
      uiHandlers: Boolean(getWaInboxUiHandlers()),
      liveHandlers: Boolean(getWaInboxLiveHandlers()),
      conversations: allConversations.value.length,
      openMessages: messages.value.length
    }))

    watch(() => route.path, (path, prev) => {
      waInboxLog('route.change', { from: prev, to: path, inbox: isInboxRoute(path) })
      if (isInboxRoute(path)) {
        connectWebSocket()
      } else {
        disconnectWebSocket()
      }
    })

    onMounted(() => {
      if (isInboxRoute(route.path)) connectWebSocket()
    })

    const g = globalThis as typeof globalThis & { __waInboxEchoReadyBound?: boolean }
    if (!g.__waInboxEchoReadyBound) {
      g.__waInboxEchoReadyBound = true
      window.addEventListener('echo-ready', () => {
        waInboxLog('echo-ready')
        if (isInboxRoute(route.path)) connectWebSocket()
      })
    }
  }

  async function init() {
    hydrateFromCache()
    connectWebSocket()
    const hasCachedUi = Boolean(
      cache.getSession()
      || cache.getAllConversations()?.length
    )

    if (!hasCachedUi) {
      await withSpinner(async () => {
        await Promise.all([
          loadSession(),
          loadAllConversations(),
          loadTemplates(),
          loadAssignableUsers()
        ])
        await syncConversationFromRoute()
        if (selectedConversationId.value && !getRouteConversationSlug()) {
          await loadMessages(selectedConversationId.value)
        }
      }, 'Cargando inbox…')
      return
    }

    await Promise.all([
      loadSession({ background: true }),
      loadAllConversations({ background: true }),
      loadTemplates({ background: true }),
      loadAssignableUsers({ background: true })
    ])

    await syncConversationFromRoute()

    // Con slug en URL, selectConversation ya cargó mensajes. Sin slug, solo auto-selección.
    if (selectedConversationId.value && !getRouteConversationSlug()) {
      await loadMessages(selectedConversationId.value)
    }
  }

  async function refreshInbox() {
    cache.invalidateAll()
    await withSpinner(async () => {
      await Promise.all([
        loadSession(),
        loadAllConversations({ force: true }),
        loadTemplates({ background: true, force: true }),
        loadAssignableUsers({ background: true })
      ])
      if (selectedConversationId.value) {
        cache.invalidateMessages(selectedConversationId.value)
        await loadMessages(selectedConversationId.value)
      }
    }, 'Actualizando…')
  }

  if (import.meta.client) {
    watch(
      () => getRouteConversationSlug(),
      async (slug, prev) => {
        if (!slug) {
          if (prev) {
            selectedConversationId.value = null
            messages.value = []
            messagesConversationId.value = null
          }
          return
        }

        const convId = conversationIdFromSlug(slug)
        if (!convId) {
          await resolveRouteConversation(slug)
          return
        }

        if (selectedConversationId.value !== convId) {
          await selectConversation(convId, { skipRoute: true })
          return
        }

        if (messagesConversationId.value !== convId) {
          await loadMessages(convId)
        }
      },
      { flush: 'post' }
    )
  }

  watch(filter, () => {
    loadConversations({ page: 1, force: true, background: true })
  })

  let searchTimer: ReturnType<typeof setTimeout> | null = null
  watch(search, () => {
    if (searchTimer) clearTimeout(searchTimer)
    searchTimer = setTimeout(() => {
      loadConversations({ page: 1, force: true, background: true })
    }, 350)
  })

  return {
    session,
    conversations,
    allConversations,
    messages,
    templates,
    assignableUsers,
    selectedConversationId,
    selectedConversation,
    search,
    filter,
    sendingMessage,
    loadingConversations,
    loadingMoreConversations,
    conversationsHasMore,
    loadMoreConversations,
    loadingMessages,
    loadingTemplates,
    sendingTemplate,
    refreshing,
    savingNewContact,
    error,
    unreadTotal,
    init,
    refreshInbox,
    connectWebSocket,
    disconnectWebSocket,
    loadAllConversations,
    selectConversation,
    sendComposerMessage,
    sendTemplateMessage,
    assignConversation,
    createManualContact,
    loadTemplates
  }
}
